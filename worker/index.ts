/** Cloudflare Worker entry point that delegates all routing to vinext. */
import handler from "vinext/server/fetch-handler";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
};
