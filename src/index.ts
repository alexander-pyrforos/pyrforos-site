import { dispatchApi } from "./api";

export interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  VOTE_SALT?: string;
  TG_BOT_TOKEN?: string;
  TG_CHAT_ID?: string;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname, hostname, search } = new URL(req.url);
    if (hostname === "www.pyrforos.xyz") {
      return Response.redirect("https://pyrforos.xyz" + pathname + search, 301);
    }
    if (pathname.startsWith("/api/")) {
      return dispatchApi(req, env, ctx);
    }
    return env.ASSETS.fetch(req);
  },
};