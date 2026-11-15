import { beforeEach, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import SCHEMA from "../../schema.sql?raw";

const VALID = {
  service: "lead-feed",
  package: "business",
  name: "Test Buyer",
  email: "buyer@example.com",
  niche: "dental clinics, Sydney",
};

beforeEach(async () => {
  // isolatedStorage does not reset D1 tables between tests — drop and recreate
  await env.DB.exec("DROP TABLE IF EXISTS leads");
  await env.DB.exec(SCHEMA);
  // TG_BOT_TOKEN stays unset here: unit tests cover the transport
});

function postLead(body: unknown, ip = "10.0.0.1") {
  return SELF.fetch("https://example.com/api/lead", {
    method: "POST",
    headers: { "cf-connecting-ip": ip },
    body: JSON.stringify(body),
  });
}

async function leadCount(): Promise<number> {
  const r = (await env.DB.prepare("SELECT COUNT(*) AS c FROM leads").first()) as { c: number };
  return Number(r.c);
}

it("rejects unparseable body with invalid_body", async () => {
  const res = await SELF.fetch("https://example.com/api/lead", {
    method: "POST",
    body: "not json",
  });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe("invalid_body");
});

it("rejects missing name with invalid_name", async () => {
  const res = await postLead({ ...VALID, name: "" });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe("invalid_name");
});

it("rejects malformed email with invalid_email", async () => {
  const res = await postLead({ ...VALID, email: "nope" });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe("invalid_email");
});

it("rejects unknown service with invalid_service", async () => {
  const res = await postLead({ ...VALID, service: "other" });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe("invalid_service");
});

it("requires package for lead-feed service", async () => {
  const res = await postLead({ ...VALID, package: undefined });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe("invalid_package");
});

it("rejects package for ai-structuring service", async () => {
  const res = await postLead({ ...VALID, service: "ai-structuring", package: "starter" });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe("invalid_package");
});

it("rejects overlong message as invalid_body", async () => {
  const res = await postLead({ ...VALID, message: "x".repeat(2001) });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe("invalid_body");
});

it("stores the lead on success even with no TG token configured", async () => {
  const res = await postLead(VALID);
  expect(res.status).toBe(201);
  expect(await res.json()).toMatchObject({ ok: true });
  expect(await leadCount()).toBe(1);
});

it("honeypot gets a fake-ok with no insert", async () => {
  const res = await postLead({ ...VALID, website: "http://spam.tld" });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true });
  expect(await leadCount()).toBe(0);
});

it("rate limited after 5 leads per ip per day", async () => {
  for (let i = 0; i < 5; i++) {
    const res = await postLead({ ...VALID, name: `Buyer ${i}`, email: `b${i}@example.com` });
    expect(res.status).toBe(201);
  }
  const res = await postLead({ ...VALID, name: "Buyer 6th" });
  expect(res.status).toBe(429);
  expect((await res.json()).error).toBe("rate_limited");
  expect(await leadCount()).toBe(5);
});

it("rate limit keys on ip, a second ip still gets through", async () => {
  for (let i = 0; i < 5; i++) {
    await postLead(VALID, "10.0.0.1");
  }
  const res = await postLead({ ...VALID }, "10.0.0.2");
  expect(res.status).toBe(201);
});
