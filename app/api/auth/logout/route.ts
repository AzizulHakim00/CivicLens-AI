import { clearSessionCookie, destroyCurrentSession, sameOrigin } from "../../../../lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
  try {
    await destroyCurrentSession(request);
  } catch {
    // Always clear the browser cookie even if the server-side session was already removed.
  }
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
}
