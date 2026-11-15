import { OPTIONS, SEED_HIDE_THRESHOLD } from "./options";
import { computeCounts, fingerprint, pairKey, pickPairFromRows } from "./votes";
import { buildTelegramMessage, sendMessage, type LeadPayload } from "./tg";

type PairMeta = { id: string; title: string; art: string };

export const MAX_LEADS_PER_DAY = 5;

const SERVICES = new Set(["lead-feed", "ai-structuring"]);
const PACKAGES = new Set(["starter", "business", "professional"]);

function validLead(body: Record<string, unknown>): LeadPayload | string {
  const service = typeof body.service === "string" ? body.service : "";
  const pkg = typeof body.package === "string" ? body.package : null;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const niche = typeof body.niche === "string" ? body.niche.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length === 0 || name.length > 200) return "invalid_name";
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) return "invalid_email";
  if (message && message.length > 2000) return "invalid_body";
  if (!SERVICES.has(service)) return "invalid_service";
  if (service === "lead-feed") {
    if (!pkg || !PACKAGES.has(pkg)) return "invalid_package";
  } else if (pkg !== null) {
    return "invalid_package";
  }
  if (niche.length === 0 || niche.length > 400) return "invalid_niche";
  return { service, package: pkg, name, email, niche, message: message || null };
}

function optionMeta(id: string): PairMeta | null {
  const o = OPTIONS.find((o) => o.id === id);
  return o ? { id: o.id, title: o.title, art: o.art } : null;
}

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

export async function dispatchApi(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
  return handleApi(req, env, _ctx).catch((e) => {
    console.error("api error", e);
    return jsonError(503, "db_unavailable");
  });
}

async function handleApi(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

  if (req.method === "POST" && url.pathname === "/api/lead") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return jsonError(400, "invalid_body");
    }

    // honeypot: bots fill this invisible field; pretend success, store nothing
    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return Response.json({ ok: true }, { status: 200 });
    }

    const lead = validLead(body);
    if (typeof lead === "string") return jsonError(400, lead);

    const ip = req.headers.get("cf-connecting-ip") ?? "";
    const salt = env.VOTE_SALT ?? "dev-salt";
    const day = new Date().toISOString().slice(0, 10);
    const fp = await fingerprint(ip, salt, day);

    const { total } = await db
      .prepare("SELECT COUNT(*) AS total FROM leads WHERE fingerprint = ? AND substr(created_at, 1, 10) = ?")
      .bind(fp, day)
      .first();
    if (Number(total) >= MAX_LEADS_PER_DAY) return jsonError(429, "rate_limited");

    await db
      .prepare("INSERT INTO leads (service, package, name, email, niche, message, fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(lead.service, lead.package, lead.name, lead.email, lead.niche, lead.message, fp)
      .run();

    ctx.waitUntil(sendMessage(env, buildTelegramMessage(lead)));
    return Response.json({ ok: true }, { status: 201 });
  }

  return jsonError(404, "not_found");
}