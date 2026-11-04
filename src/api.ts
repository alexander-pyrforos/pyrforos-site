import { OPTIONS, SEED_HIDE_THRESHOLD } from "./options";
import { computeCounts, fingerprint, pairKey, pickPairFromRows } from "./votes";

type PairMeta = { id: string; title: string; art: string };

function optionMeta(id: string): PairMeta | null {
  const o = OPTIONS.find((o) => o.id === id);
  return o ? { id: o.id, title: o.title, art: o.art } : null;
}

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

export async function dispatchApi(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
  return handleApi(req, env).catch((e) => {
    console.error("api error", e);
    return jsonError(503, "db_unavailable");
  });
}

async function handleApi(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  if (!env.DB) return jsonError(503, "db_unavailable");
  const db = env.DB;

  if (req.method === "GET" && url.pathname === "/api/pair") {
    const exclude = (url.searchParams.get("exclude") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { results } = await db
      .prepare(
        `SELECT a_id, b_id, SUM(CASE WHEN is_seed = 0 THEN 1 ELSE 0 END) AS real
         FROM votes GROUP BY pair_key`,
      )
      .all<{ a_id: string; b_id: string; real: number }>();
    const [a, b] = pickPairFromRows(
      results.map((r) => ({ ...r, real: Number(r.real) })),
      OPTIONS.map((o) => o.id),
      exclude,
    );
    const metaA = optionMeta(a);
    const metaB = optionMeta(b);
    if (!metaA || !metaB) return jsonError(500, "unknown_option");
    return Response.json({ pair: { a: metaA, b: metaB } });
  }

  if (req.method === "POST" && url.pathname === "/api/vote") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "invalid_body");
    }
    const { a, b, choice } = (body ?? {}) as { a?: string; b?: string; choice?: string };
    if (!a || !b || a === b) return jsonError(400, "invalid_body");
    if (choice !== "a" && choice !== "b") return jsonError(400, "invalid_choice");
    if (!OPTIONS.some((o) => o.id === a) || !OPTIONS.some((o) => o.id === b)) {
      return jsonError(400, "unknown_option");
    }

    const key = pairKey(a, b);
    const ip = req.headers.get("cf-connecting-ip") ?? "";
    const salt = env.VOTE_SALT ?? "dev-salt";
    const day = new Date().toISOString().slice(0, 10);
    const fp = await fingerprint(ip, salt, day);

    const existing = await db
      .prepare("SELECT 1 FROM votes WHERE pair_key = ? AND fingerprint = ? AND is_seed = 0 LIMIT 1")
      .bind(key, fp)
      .first();
    if (existing) return jsonError(409, "already_voted");

    await db
      .prepare("INSERT INTO votes (pair_key, a_id, b_id, choice, is_seed, fingerprint) VALUES (?, ?, ?, ?, 0, ?)")
      .bind(key, a, b, choice, fp)
      .run();

    const { totalReal } = (
      await db.prepare("SELECT COUNT(*) AS totalReal FROM votes WHERE is_seed = 0").first()
    ) as { totalReal: number };
    const pairRows = await db
      .prepare("SELECT choice, is_seed FROM votes WHERE pair_key = ?")
      .bind(key)
      .all<{ choice: string; is_seed: number }>();
    const counts = computeCounts(
      (pairRows.results ?? []).map((r) => ({
        choice: r.choice as "a" | "b",
        is_seed: Number(r.is_seed),
      })),
      Number(totalReal),
    );
    return Response.json({ counts, totalReal: Number(totalReal) }, { status: 201 });
  }

  return jsonError(404, "not_found");
}