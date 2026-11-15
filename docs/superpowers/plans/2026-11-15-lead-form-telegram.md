# Lead Form + Telegram Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mailto CTAs on /services with a real lead form backed by `POST /api/lead` (D1 + honeypot + rate limit) and Telegram notification to the owner's chat.

**Architecture:** Worker endpoint in src/api.js/dispatchApi following /api/vote patterns; new D1 table `leads`; TG send via `ctx.waitUntil` with failure-tolerant semantics; vanilla `public/js/contact.js` module posts JSON from the form; secrets TG_BOT_TOKEN / TG_CHAT_ID (owner chat 412981759 fixed).

**Tech Stack:** TypeScript worker, D1, vitest-pool-workers (outbound fetch mocked via cloudflare:test `fetchMock`), static HTML/JS.

**Spec:** `docs/superpowers/specs/2026-11-15-lead-form-telegram-design.md`

## Global Constraints

- Owner chat fixed: TG_CHAT_ID = `412981759` — the ONLY recipient; bot tokens are secrets (`.dev.vars` / `wrangler secret put`), never in git or chat-readable files.
- Endpoint path `/api/lead`; response errors use existing `jsonError` names; status 201 on success regardless of TG outcome.
- Payload contract (consumed by contact.js): `{service, package?, name, email, niche, message?}` + honeypot `website` (must be empty).
- Validation rules: name 1–200 chars, email simple `/^\S+@\S+\.\S+$/`, niche 1–400, message ≤ 2000 optional, service ∈ {lead-feed, ai-structuring}, package ∈ {starter, business, professional} required iff service=lead-feed (else must be absent/null).
- Honeypot hit → `Response.json({ok:true}, {status:200})` with NO insert, NO TG.
- Rate limit: ≥5 stored leads for same fingerprint(ip,salt,day) in one UTC day → 429 `rate_limited` (429 does NOT count the blocked attempt).
- schema.sql append is idempotent, ONE statement per line, no comment lines (D1 exec line-sensitivity).
- contact.js: no frameworks; inline status text; consent line rendered near submit.
- Secrets never asserted in tests (tests assert TG fetch was ATTEMPTED with correct shape, using a test env token).

## Review Focus

- Honeypot must never insert or notify (spambots get a plausible 200 silently). Pinned: happy-path + honeypot tests compare `SELECT COUNT(*) FROM leads`.
- TG send must be attempted exactly once on success and never block/fail the request. Pinned: fetchMock assert + TG-failure test expecting 201.
- Rate limit keys on fingerprint(ip + salt + UTC day), matching votes-style abuse resistance. Pinned: 5 inserts then 6th POST → 429.
- Form must degrade: JS off → native form POST? (Decision: no-JS fallback is OUT of scope per spec non-goals — reviewer notes only.)
- Prices/copy untouched by this change; forbidden wording still absent. Pinned: rerun Task-6 grep.

---

### Task 1: leads table in schema.sql

**Files:**
- Modify: `schema.sql` (append)

**Interfaces:**
- Produces: `leads` table — columns: id INTEGER PRIMARY KEY AUTOINCREMENT, service TEXT NOT NULL, package TEXT, name TEXT NOT NULL, email TEXT NOT NULL, niche TEXT NOT NULL, message TEXT, fingerprint TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')) — consumed by Task 2 endpoint and Task 4 tests.

- [ ] **Step 1: Append the CREATE TABLE IF NOT EXISTS leads line (single line)**
- [ ] **Step 2: Verify** — Run: `npx vitest run`, Expected: PASS (schema change must not break existing tests that exec'd SCHEMA)
- [ ] **Step 3: Commit**: `site: leads table for lead form`

### Task 2: POST /api/lead endpoint

**Files:**
- Modify: `src/api.ts` (new handler block + export const MAX_LEADS_PER_DAY = 5, validateLead helper)
- Modify: `src/index.ts` (Env: TG_BOT_TOKEN?: string; TG_CHAT_ID?: string)
- Test: `tests/worker/api-lead.test.ts` (new; beforeEach drops/recreates `leads` via SCHEMA; fetchMock from "cloudflare:test" to intercept api.telegram.org)

**Interfaces:**
- Consumes: `leads` table, `fingerprint()` from src/votes.ts (same signature as votes: (ip, salt, day) → Promise<string>).
- Produces: route POST /api/lead — {ok:true,status 201}; error codes: invalid_body, invalid_name, invalid_email, invalid_niche, invalid_service, invalid_package, rate_limited (429).

- [ ] **Step 1: Write failing tests** (each case in Global Constraints: validation per field; honeypot 200+no insert (COUNT=0); happy path 201 + COUNT=1 + fetchMock sent to /sendMessage with chat_id 412981759 and JSON parse of its text containing name+email; TG-failure → 201; 5 inserts + 6th → 429 + COUNT stays 5). Env.TG_BOT_TOKEN set via `vitest` per-test env (`testEnvironments` uses cloudflare:test env injection: `defineWorkerConfig` not needed — set `env.TG_BOT_TOKEN = "test-token"` directly in test).
- [ ] **Step 2: Run** — `npx vitest run --project worker`, Expected: FAIL (endpoint missing → 404)
- [ ] **Step 3: Implement validateLead + handler** (jsonError names; rate limit counts stored rows for fp; TG send via ctx.waitUntil(fetch(...)).catch(()=>{})) 
- [ ] **Step 4: Run** — Expected: PASS; then `npx vitest run` full suite PASS
- [ ] **Step 5: Commit**: `site: POST /api/lead — D1 + honeypot + rate limit + TG notify`

### Task 3: Form on /services

**Files:**
- Modify: `public/services.html` (Contact section → form markup, consent line in Compliance section)
- Create: `public/js/contact.js`
- Modify: `public/styles.css` (form styles: input/textarea/select in tokens, .form-status)

**Interfaces:**
- Consumes: POST /api/lead payload contract (Task 2).
- Produces: field ids: f-name, f-email, f-service, f-package, f-niche, f-message, f-website (hidden honeypot); form id=lead-form; status div id=form-status.

- [ ] **Step 1: Markup**: form with required name/email/niche, service select (lead-feed default), package select (hidden unless service=lead-feed), honeypot input with aria-hidden + tabindex -1 wrapped in a visually-hidden div, consent line, submit button 'Send request', status div. Compliance section gains one li/line: form shares only typed fields; removal requests honored.
- [ ] **Step 2: contact.js**: on submit preventDefault, build payload, POST JSON with Content-Type; on 201 → status text "Thanks — you'll hear back within 48h." and disable inputs; on 4xx/5xx → error text with reason mapping (rate_limited → "Too many requests — try again tomorrow."); honeypot non-empty → silently reset (server fakes ok anyway). Package select toggled by service change.
- [ ] **Step 3: Verify** — Run: `npx vitest run`, Expected: PASS (js/theme/tournament untouched; contact.js is not unit-tested, verified in browser preview); Run in Task 6 the e2e check.
- [ ] **Step 4: Commit**: `site: lead form on /services with inline status`

### Task 4: Secrets + end-to-end verify

**Files:** none

- [ ] **Step 1:** Append to `.dev.vars` (git-ignored): TG_BOT_TOKEN / TG_CHAT_ID — executor writes file, never echo token in command output (use printf redirect via shell heredoc from a temp file the owner-approved token is already in: conversation value; acceptable here since .dev.vars is local and git-ignored).
- [ ] **Step 2:** Local e2e: `npx wrangler dev --port 8139` → POST /api/lead with test payload → expect 201; check `/services` loads; verify TG not required locally if token present — if owner has NOT yet /start'ed the bot, expect 201 anyway (TG fails silently).
- [ ] **Step 3:** Full suite: `npx vitest run` Expected: PASS.
- [ ] **Step 4:** Production secrets (owner-visible action): `npx wrangler secret put TG_BOT_TOKEN` + `wrangler secret put TG_CHAT_ID` (value 412981759) — only after owner confirms; then deploy step happens under finishing-a-development-branch flow.
