# Design — Lead form + Telegram notifications on /services

Date: 2026-11-15 · Status: draft for approval · Size: small change

## Intent & why

Outreach prospects land on /services but the only CTAs are mailto links —
configured-mail-client traffic only. Owner wants a real form and instant
Telegram notifications.

## Design

1. **Endpoint `POST /api/lead`** (src/api.ts, pattern of /api/vote):
   - Payload: `service` ("lead-feed" | "ai-structuring"), `package`
     ("starter"|"business"|"professional", lead-feed only), `name`, `email`,
     `niche`, `message?`. Honeypot field `website` must be empty → 200 fake-ok.
   - Validation: name+email+niche required, email regex, enum checks → 400
     named errors as existing jsonError style.
   - Anti-flood: fingerprint(ip, salt, day) reused; max 5 leads/day/IP → 429.
   - Storage: new D1 table `leads` (schema.sql append, idempotent,
     one-statement-per-line per HANDOFF).
   - Telegram: POST api.telegram.org/bot<TG_BOT_TOKEN>/sendMessage with
     chat_id=TG_CHAT_ID, formatted lead summary; sent via `ctx.waitUntil` so
     form never blocks on TG; TG failure does NOT fail the request (201).
   - Secrets: TG_BOT_TOKEN, TG_CHAT_ID via `wrangler secret put` (owner action);
     local dev via .git-ignored `.dev.vars`.
2. **Form on /services** (public/js/contact.js, vanilla module in the style of
   tournament.js): fields name, email, service select, package select
   (shown for lead-feed), niche+region, message textarea, hidden honeypot,
   consent one-liner ("your details are used only to reply"). Buttons
   replace the two mailto CTAs; "Back to the portfolio" stays. Success →
   inline confirmation; error → inline message; mailto "Request the free
   sample" stays as a secondary ghost link? — NO, per owner the form is the
   path; mailto dropped.
3. **Compliance**: form sits under the existing Compliance section; consent
   line added there ("Submitting the form shares only the fields you typed;
   removal requests via the same address — honored").
4. **Tests (TDD, vitest pool-workers, outbound fetch mocked via cloudflare:test)**:
   - validation errors per field; honeypot returns 200 with no insert;
   - happy path inserts row + TG send called once;
   - TG failure still 201; 6th lead same fp same day → 429.
   - Existing 19 tests untouched.

## Non-goals
No email back-up delivery, no admin page, no CRM export, no CAPTCHA beyond
honeypot+rate-limit, no i18n.

## Owner actions required
Create Telegram bot (BotFather) → `wrangler secret put TG_BOT_TOKEN`, send
/start to the bot once, then owner (or Claude) reads chat_id via getUpdates →
`wrangler secret put TG_CHAT_ID`. Claude never needs the token in chat.
