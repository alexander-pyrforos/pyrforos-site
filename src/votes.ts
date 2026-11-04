/** Canonical unordered-pair key: lexical sort joined with "|". */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export type BlendCounts = { a: number; b: number };

/**
 * Seed votes are shown together with real votes until the visitor has cast
 * SEED_HIDE_THRESHOLD real votes; after that only real votes are displayed.
 */
export function blendCounts(
  realA: number,
  realB: number,
  seedA: number,
  seedB: number,
  totalReal: number,
  hideThreshold = 10,
): BlendCounts {
  if (totalReal < hideThreshold) {
    return { a: realA + seedA, b: realB + seedB };
  }
  return { a: realA, b: realB };
}

export type VoteRow = { choice: "a" | "b"; is_seed: number };

export function computeCounts(rows: VoteRow[], totalReal: number): BlendCounts {
  let realA = 0;
  let realB = 0;
  let seedA = 0;
  let seedB = 0;
  for (const r of rows) {
    if (r.is_seed) {
      if (r.choice === "a") seedA++;
      else seedB++;
    } else {
      if (r.choice === "a") realA++;
      else realB++;
    }
  }
  return blendCounts(realA, realB, seedA, seedB, totalReal);
}

export type PairCountRow = { a_id: string; b_id: string; real: number };

/** Pair with the fewest real votes; ties broken at random; excluded pairs skipped. */
export function pickPairFromRows(
  votes: PairCountRow[],
  options: string[],
  exclude: string[],
): [string, string] {
  const counts = new Map<string, number>();
  for (const v of votes) {
    const k = pairKey(v.a_id, v.b_id);
    counts.set(k, (counts.get(k) ?? 0) + v.real);
  }
  const all: [string, string][] = [];
  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      all.push([options[i], options[j]]);
    }
  }
  const candidates = all
    .filter(([a, b]) => !exclude.includes(pairKey(a, b)))
    .map(([a, b]) => ({ pair: [a, b] as [string, string], real: counts.get(pairKey(a, b)) ?? 0 }));
  let pool: { pair: [string, string]; real: number }[] = candidates;
  if (pool.length === 0) {
    // every pair was excluded this session — fall back to an already-shown pair
    pool = all.map(([a, b]) => ({ pair: [a, b] as [string, string], real: counts.get(pairKey(a, b)) ?? 0 }));
  }
  const min = Math.min(...pool.map((c) => c.real));
  const least = pool.filter((c) => c.real === min);
  return least[Math.floor(Math.random() * least.length)].pair;
}

/** Privacy-safe voter identity: truncated SHA-256 of ip|salt|day. Salt is a worker secret; raw IP is never stored. */
export async function fingerprint(ip: string, salt: string, day: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|${salt}|${day}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}