import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;
const multiuserMeta =
  /<meta(?=[^>]*\bname=["']multiuser-version["'])(?=[^>]*\bcontent=["']6\.1["'])[^>]*>/i;
const performanceMeta =
  /<meta(?=[^>]*\bname=["']performance-version["'])(?=[^>]*\bcontent=["']6\.1["'])[^>]*>/i;

async function loadWorker(label) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(label, `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

const environment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const context = { waitUntil() {}, passThroughOnException() {} };

test("renders development, multi-user and performance metadata", async () => {
  const worker = await loadWorker("render-test");
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    environment,
    context,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);
  assert.match(html, multiuserMeta);
  assert.match(html, performanceMeta);
  assert.match(html, /CivicLens/);
  assert.match(html, /Urban hazard intelligence/);
  assert.match(html, /Securing your workspace/);
});

test("returns an unauthenticated session without touching D1", async () => {
  const worker = await loadWorker("auth-me-test");
  const response = await worker.fetch(
    new Request("http://localhost/api/auth/me", { headers: { accept: "application/json" } }),
    environment,
    context,
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { user: null });
});

test("rejects invalid report payload before authentication and database access", async () => {
  const worker = await loadWorker("api-test");
  const response = await worker.fetch(
    new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ type: "Unknown" }),
    }),
    environment,
    context,
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid hazard report." });
});

test("requires authentication for a valid report submission", async () => {
  const worker = await loadWorker("api-auth-test");
  const response = await worker.fetch(
    new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        id: "CL-9001",
        type: "Pothole",
        severity: "High",
        confidence: 94,
        location: "Test Road",
        area: "Test Area",
        status: "Reported",
        source: "Citizen",
        slaMinutes: 180,
        priorityScore: 78,
      }),
    }),
    environment,
    context,
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication required." });
});

test("rejects invalid workflow update before authentication and database access", async () => {
  const worker = await loadWorker("patch-test");
  const response = await worker.fetch(
    new Request("http://localhost/api/reports", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "../../bad", status: "Deleted" }),
    }),
    environment,
    context,
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "A valid report ID is required." });
});

test("requires an operator for a valid workflow update", async () => {
  const worker = await loadWorker("patch-auth-test");
  const response = await worker.fetch(
    new Request("http://localhost/api/reports", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "CL-2841", status: "Investigating" }),
    }),
    environment,
    context,
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication required." });
});

test("rejects oversized workflow updates before parsing", async () => {
  const worker = await loadWorker("patch-size-test");
  const response = await worker.fetch(
    new Request("http://localhost/api/reports", {
      method: "PATCH",
      headers: { "content-type": "application/json", "content-length": "16385" },
      body: JSON.stringify({ id: "CL-2841" }),
    }),
    environment,
    context,
  );
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "Payload is too large." });
});
