import { expect, it } from "vitest";
import { dispatchApi } from "../../src/api";
import type { Env } from "../../src/index";

const stubAssets = { fetch: () => new Response("stub") } as unknown as Fetcher;
const ctx = {} as ExecutionContext;

it("returns 503 when DB binding is missing", async () => {
  const env = { ASSETS: stubAssets } as unknown as Env;
  const res = await dispatchApi(new Request("https://x.example/api/pair"), env, ctx);
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual({ error: "db_unavailable" });
});

it("returns 503 when DB throws", async () => {
  const env = {
    ASSETS: stubAssets,
    DB: {
      prepare: () => {
        throw new Error("boom");
      },
    },
  } as unknown as Env;
  const res = await dispatchApi(new Request("https://x.example/api/pair"), env, ctx);
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual({ error: "db_unavailable" });
});