import { beforeEach, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import SCHEMA from "../../schema.sql?raw";

const OPTS = ["V1", "V2", "V3", "V4", "V5", "V6"];

async function insertVote(a: string, b: string, choice: "a" | "b", isSeed = 0) {
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  await env.DB.prepare(
    "INSERT INTO votes (pair_key, a_id, b_id, choice, is_seed) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(key, a, b, choice, isSeed)
    .run();
}

beforeEach(async () => {
  // isolatedStorage does not reset D1 tables between tests — drop and recreate
  await env.DB.exec("DROP TABLE IF EXISTS votes");
  await env.DB.exec(SCHEMA);
});

it("GET /api/pair picks least-voted pair and hides counts", async () => {
  for (let i = 0; i < OPTS.length; i++) {
    for (let j = i + 1; j < OPTS.length; j++) {
      if (OPTS[i] === "V4" && OPTS[j] === "V6") continue;
      await insertVote(OPTS[i], OPTS[j], "a");
    }
  }
  const res = await SELF.fetch("https://example.com/api/pair");
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.counts).toBeUndefined();
  expect([data.pair.a.id, data.pair.b.id].sort().join("|")).toBe("V4|V6");
  expect(data.pair.a).toHaveProperty("title");
});

it("POST /api/vote blends seeds under 10 real votes", async () => {
  // 8 real votes, all on pairs that involve neither V3 nor V5
  const others = [
    ["V1", "V2"], ["V1", "V4"], ["V1", "V6"], ["V2", "V4"],
    ["V2", "V6"], ["V4", "V6"], ["V1", "V2"], ["V2", "V4"],
  ];
  for (const [a, b] of others) await insertVote(a, b, "a");
  // seeds on V3|V5: a=4, b=1
  for (let i = 0; i < 4; i++) {
    await env.DB.prepare(
      "INSERT INTO votes (pair_key, a_id, b_id, choice, is_seed) VALUES ('V3|V5','V3','V5','a',1)"
    ).run();
  }
  await env.DB.prepare(
    "INSERT INTO votes (pair_key, a_id, b_id, choice, is_seed) VALUES ('V3|V5','V3','V5','b',1)"
  ).run();

  const res = await SELF.fetch("https://example.com/api/vote", {
    method: "POST",
    body: JSON.stringify({ a: "V3", b: "V5", choice: "a" }),
  });
  expect(res.status).toBe(201);
  const data = await res.json();
  // totalReal is 9 (< 10): displayed counts blend seeds in
  expect(data.counts).toEqual({ a: 5, b: 1 }); // 1 real + 4 seed a, 0 real + 1 seed b
  expect(data.totalReal).toBe(9);
});

it("rejects a second vote from the same voter on the same pair", async () => {
  const res1 = await SELF.fetch("https://example.com/api/vote", {
    method: "POST",
    body: JSON.stringify({ a: "V1", b: "V2", choice: "a" }),
  });
  expect(res1.status).toBe(201);
  const res2 = await SELF.fetch("https://example.com/api/vote", {
    method: "POST",
    body: JSON.stringify({ a: "V1", b: "V2", choice: "a" }),
  });
  expect(res2.status).toBe(409);
  expect(await res2.json()).toEqual({ error: "already_voted" });
});

it("rejects invalid votes with 400", async () => {
  const res1 = await SELF.fetch("https://example.com/api/vote", {
    method: "POST",
    body: JSON.stringify({ a: "XX", b: "V2", choice: "a" }),
  });
  expect(res1.status).toBe(400);
  const res2 = await SELF.fetch("https://example.com/api/vote", {
    method: "POST",
    body: JSON.stringify({ a: "V1", b: "V2", choice: "c" }),
  });
  expect(res2.status).toBe(400);
  const res3 = await SELF.fetch("https://example.com/api/vote", {
    method: "POST",
    body: JSON.stringify({ a: "V1", b: "V1", choice: "a" }),
  });
  expect(res3.status).toBe(400);
});