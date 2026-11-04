export interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
}

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return env.ASSETS.fetch(req);
  },
};