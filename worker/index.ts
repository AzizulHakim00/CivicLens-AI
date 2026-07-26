/** Cloudflare Worker entry point for CivicLens AI. */
import handler from "vinext/server/app-router-entry";

const securityHeaders: Record<string, string> = {
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(self), geolocation=(self), microphone=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

const worker = {
  async fetch(...args: Parameters<typeof handler.fetch>): Promise<Response> {
    const [request] = args;
    const response = await handler.fetch(...args);
    const headers = new Headers(response.headers);

    for (const [name, value] of Object.entries(securityHeaders)) {
      if (!headers.has(name)) headers.set(name, value);
    }

    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith("/api/")) {
      headers.set("cache-control", "no-store, max-age=0");
      headers.set("x-robots-tag", "noindex");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
