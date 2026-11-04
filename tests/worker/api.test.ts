import { it, expect } from "vitest";
import { SELF } from "cloudflare:test";

it("unknown api route returns 404 json", async () => {
  const res = await SELF.fetch("https://example.com/api/unknown");
  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ error: "not_found" });
});

it("root serves the page asset", async () => {
  const res = await SELF.fetch("https://example.com/");
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("Alexander Pyrforos");
});