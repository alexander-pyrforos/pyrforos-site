# HANDOFF — pyrforos.xyz v2 (Cloudflare Workers)

_2026-11-04. Supersedes the site/Pages part of `docs/HANDOFF.md` (that file keeps the non-site items: resume, LinkedIn, security follow-ups)._

## What this project is

`pyrforos-site`: the portfolio business-card site (v2) — static assets + a
Cloudflare Worker with `/api/pair` + `/api/vote` backed by D1
(pair-voting tournament, seed-blended counts until 10 real votes).

## Layout

```
src/index.ts      worker entry: /api/* → dispatchApi (src/api.ts), rest → ASSETS
src/api.ts        GET /api/pair (least-voted, exclude list), POST /api/vote
src/votes.ts      pairKey, blendCounts, computeCounts, pickPairFromRows, fingerprint
src/options.ts    tournament options (placeholders V1–V6 → owner supplies content)
schema.sql        D1 schema (votes table + pair index)
seed.sql          seed votes (is_seed=1) — idempotence: run once on a fresh DB
public/           static site (index.html, styles.css, js/{theme,demo-agent,demo-data,tournament}.js,
                  robots.txt, llms.txt)
tests/            vitest: unit (pure helpers, node) + worker (D1 + SELF.fetch)
```

## Deploy workflow

```bash
# from the repo root (branch main after merge):
npm install               # once
npx wrangler deploy       # statics + worker; workers.dev URL prints
# production D1 (one-time, done 2026-11-04):
npx wrangler d1 create pyrforos-votes        # done: id 6ce14b08-3fa1-41a3-91f6-accdc7d32d98
npx wrangler d1 execute pyrforos-votes --remote --file schema.sql
npx wrangler d1 execute pyrforos-votes --remote --file seed.sql
npx wrangler secret put VOTE_SALT            # done 2026-11-04 (random 64-hex)
```

Secrets: `VOTE_SALT` is a worker **secret** (do not re-add it as a `var` —
deploy fails on the collision). Local dev value lives in `.dev.vars`
(git-ignored).

## Tests

```bash
npx vitest run    # unit + worker projects; worker tests run D1 against local miniflare
```

Notes that bit during development: D1 `exec()` is line-sensitive (schema.sql
is one statement per line, no comment lines); `isolatedStorage` does not clean
D1 tables between tests — `beforeEach` drops and recreates them; vitest 4 needs
`@cloudflare/vitest-plugin` at project level (`plugins`, not pool).

## Cutover record (updated at finish)

- [x] workers.dev preview: https://pyrforos-site.alexander-pyrforos-cloudflare.workers.dev — live 2026-11-04
- [x] D1 `pyrforos-votes` created, schema applied, 50 seed votes (5 pairs × 7:3/6:4/4:6/3:7/5:5)
- [x] `VOTE_SALT` secret set
- [ ] branch merged to `main`, pushed to GitHub (source of truth stays there)
- [ ] custom domains attached (`routes` in wrangler.jsonc): `pyrforos.xyz` + `www.pyrforos.xyz`,
      `custom_domain: true` — if Cloudflare refuses because the old proxied
      record occupies the name, the owner deletes the legacy record in the
      dashboard and redeploys
- [ ] post-cutover verify: `dig A pyrforos.xyz` → 104.21/172.67; `/llms.txt` → 200;
      `/index.html` has `demo-agent`; live `POST /api/vote` → 201
- [ ] GitHub Pages disabled: `gh api -X DELETE repos/alexander-pyrforos/pyrforos-site/pages`

## Cutover-time wrangler.jsonc (final form, after merge)

```jsonc
{
  "name": "pyrforos-site",
  "main": "src/index.ts",
  "compatibility_date": "2026-08-22",
  "assets": { "directory": "./public", "binding": "ASSETS" },
  "d1_databases": [{ "binding": "DB", "database_name": "pyrforos-votes",
                     "database_id": "6ce14b08-3fa1-41a3-91f6-accdc7d32d98" }],
  "routes": [
    { "pattern": "pyrforos.xyz", "custom_domain": true },
    { "pattern": "www.pyrforos.xyz", "custom_domain": true }
  ]
}
```

## Still owner-supplied (placeholders now)

- tournament option titles (V1–V6 are "Variant N") and their gradients
- AP Royal Oak photo for `kb/watches` branch (slot reserved)
- real B2C price-range figure for `market/b2c` (+20% margin already real)
- 3–5 real dealer messages to diversify the recorded demo (hygiene rules apply:
  no vendor names, masked phone)