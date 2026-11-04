import { dispatchApi } from "./api";

export interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  VOTE_SALT?: string;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname.startsWith("/api/")) {
      return dispatchApi(req, env, ctx);
    }
    return env.ASSETS.fetch(req);
  },
};