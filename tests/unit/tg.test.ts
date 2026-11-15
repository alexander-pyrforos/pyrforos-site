import { afterEach, expect, it, vi } from "vitest";
import { buildTelegramMessage, sendMessage } from "../../src/tg";

const FETCH_OK = (async () =>
  new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;

afterEach(() => {
  vi.restoreAllMocks();
});

it("buildTelegramMessage includes chat id, name, email and niche", () => {
  const text = buildTelegramMessage({
    service: "lead-feed",
    package: "business",
    name: "Test Buyer",
    email: "buyer@example.com",
    niche: "dental clinics, Sydney",
    message: undefined,
  });
  expect(text).toContain("Test Buyer");
  expect(text).toContain("buyer@example.com");
  expect(text).toContain("dental clinics, Sydney");
  expect(text).toContain("business");
});

it("sendMessage attempts fetch exactly once with the bot URL and chat id", async () => {
  const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  await sendMessage(
    { TG_BOT_TOKEN: "secret-token", TG_CHAT_ID: "412981759" },
    "hello from lead",
    spy as unknown as typeof fetch,
  );
  expect(spy).toHaveBeenCalledTimes(1);
  const [url, init] = spy.mock.calls[0];
  expect(String(url)).toBe(
    "https://api.telegram.org/botsecret-token/sendMessage",
  );
  const body = JSON.parse(String((init as RequestInit).body));
  expect(body.chat_id).toBe("412981759");
  expect(body.text).toContain("hello from lead");
});

it("sendMessage resolves even when telegram is down", async () => {
  const spy = vi.fn().mockRejectedValue(new Error("network down"));
  await expect(
    sendMessage({ TG_BOT_TOKEN: "t", TG_CHAT_ID: "1" }, "text", spy as unknown as typeof fetch),
  ).resolves.toBeUndefined();
  expect(spy).toHaveBeenCalledTimes(1);
});

it("sendMessage skips when no token or no chat id configured", async () => {
  const spy = vi.fn().mockResolvedValue(FETCH_OK());
  await sendMessage({ TG_CHAT_ID: "1" }, "text", spy as unknown as typeof fetch);
  await sendMessage({ TG_BOT_TOKEN: "t" }, "text", spy as unknown as typeof fetch);
  expect(spy).not.toHaveBeenCalled();
});
