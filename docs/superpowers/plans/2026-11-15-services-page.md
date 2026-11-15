# Services Section + /services Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Services teaser section to `index.html` and a full `/services` page (ORM lead-feed service, 3 paid packages) with SEO wiring, no worker/D1 changes.

**Architecture:** Cloudflare Workers static assets from `public/` (auto-trailing-slash serves `/services` → `services.html`). New markup + CSS only; all styling reuses existing design tokens; JSON-LD `Service`/`Offer` for SEO; new `sitemap.xml` + `llms.txt` entry.

**Tech Stack:** Static HTML/CSS, Schema.org JSON-LD, existing vitest worker suite untouched.

**Spec:** `docs/superpowers/specs/2026-11-15-services-section-design.md`

## Global Constraints

- Product copy in English; must NOT contain the words "scraped" or "Google Maps" — data framing is "public review data" / "public reviews" (spec anti-goals).
- Package prices verbatim: Starter EUR 50, Business EUR 100, Professional EUR 300 — each shown with "+ VAT" (spec, owner-set).
- Tier features verbatim from spec: Starter = 50/mo, weekly CSV, one niche+region, review link, phone, website. Business = 100/mo, + owner names where public, emails prioritized. Professional = 300/mo, + multiple niches/regions, priority turnaround, monthly call.
- CSS only via existing tokens in `public/styles.css` (`--bg, --bg2, --card, --fg, --muted, --accent, --accent-soft, --line, --line-strong`); no external additions.
- No changes to `src/`, robots.txt, `js/*.js`; no new JavaScript; existing scripts included by reference only.
- Canonical base: `https://pyrforos.xyz`.
- Local commits only (site subrepo `site/` has `origin`, never push unless owner asks).
- Commits end with `Co-Authored-By: Claude Code <noreply@anthropic.com>`.

## Review Focus

- `/services` must resolve to `services.html` via assets auto-trailing-slash — a person would expect the URL in outreach emails to open the page. Pinned by curl check in Task 5.
- Prices must read exactly 50/100/300 EUR + VAT (a person would expect the quoted EUR 300 client price to equal Professional's price). Pinned by grep in Task 5.
- Product copy must not contain "scraped"/"Google Maps" (legal posture). Pinned by grep in Task 5.
- JSON-LD must be valid JSON (SEO rich results break otherwise). Pinned by `node` parse in Task 2 verify.
- Existing suite must stay green (index.html is not part of worker tests, but the deploy artifact is re-served). Pinned by `npx vitest run` in Task 5.

---

### Task 1: Package styles in styles.css

**Files:**
- Modify: `public/styles.css` (append after the `.chips`/`.chip` block, before `.cta`)

**Interfaces:**
- Consumes: existing tokens (see Global Constraints).
- Produces: classes `.packages`, `.pkg`, `.pkg.featured`, `.pkg-name`, `.pkg-price`, `.pkg-note`, `.pkg ul`, `.pkg li` used by Task 2's markup.

- [ ] **Step 1: Add the CSS block**

```css
  /* ---- packages (services) ---- */
  .packages { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  @media (max-width: 640px) { .packages { grid-template-columns: 1fr; } }
  .pkg {
    display: flex; flex-direction: column; gap: 6px;
    background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    padding: 15px 17px;
  }
  .pkg.featured { border-color: var(--accent-soft); }
  .pkg-name {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: .72rem; text-transform: uppercase; letter-spacing: .12em;
    color: var(--muted);
  }
  .pkg-price { font-family: "Instrument Serif", Georgia, serif; font-size: 1.5rem; }
  .pkg-price small { font-size: .78rem; color: var(--muted); font-family: system-ui, sans-serif; }
  .pkg-note { margin: 0; font-size: .84rem; color: var(--muted); }
  .pkg ul { margin: 0; padding-left: 1.15em; font-size: .88rem; color: var(--muted); }
  .pkg li { margin-bottom: 2px; }
  .pkg li b { color: var(--fg); font-weight: 550; }
```

- [ ] **Step 2: Verify suite still green** — Run: `npx vitest run`, Expected: PASS (0 failures)
- [ ] **Step 3: Commit**

```bash
git add public/styles.css
git commit -m "site: package card styles for services page"
```

### Task 2: services.html

**Files:**
- Create: `public/services.html`

**Interfaces:**
- Consumes: `public/styles.css` classes (`.wrap, section, h2, .section-note, .demo-json, .packages, .pkg*, .cta, .btn, .btn.ghost, footer`), `js/theme.js` module.
- Produces: page at URL `https://pyrforos.xyz/services` (assets auto-trailing-slash), referenced by Task 3 teaser and Task 4 sitemap/llms.

- [ ] **Step 1: Write the page**

Head pattern — copy `index.html` head's charset/viewport/font links/styles link, then:

- `<title>Services — Alexander Pyrforos</title>`
- meta description: `Weekly lead feeds for sales and reputation-management teams: businesses hit by fresh 1-2 star public reviews, with review link, phone, website and contact emails. Packages from EUR 50 + VAT.`
- `<link rel="canonical" href="https://pyrforos.xyz/services">`
- og: same title/description, `og:type article`, `og:url https://pyrforos.xyz/services`.
- JSON-LD (one script block; must parse):

```json
{"@context":"https://schema.org","@type":"Service","name":"Weekly lead feed","serviceType":"B2B lead data feed","provider":{"@type":"Person","name":"Alexander Pyrforos","url":"https://pyrforos.xyz"},"areaServed":"Worldwide","description":"Weekly CSV feed of local businesses that recently received a fresh 1-2 star public review, with the review link, contact details and public emails.","offers":[{"@type":"Offer","name":"Starter","price":"50","priceCurrency":"EUR","url":"https://pyrforos.xyz/services","description":"50 leads per month, weekly CSV, one niche and region."},{"@type":"Offer","name":"Business","price":"100","priceCurrency":"EUR","url":"https://pyrforos.xyz/services","description":"100 leads per month, weekly CSV, owner names where public, emails prioritized."},{"@type":"Offer","name":"Professional","price":"300","priceCurrency":"EUR","url":"https://pyrforos.xyz/services","description":"300 leads per month, weekly CSV, multiple niches and regions, priority turnaround, monthly call."}]}
```

Icons/links in head: same favicon `data:image/svg+xml` line, Google Fonts line, `styles.css` link as `index.html:19-21`.

Body (`<div class="wrap">`): copy the `#theme-toggle` button markup from `index.html:27-30`, then:

- header: `<p class="eyebrow">data &amp; automation engineer · prague</p>` + `<h1>Lead feeds for teams that <em>follow up</em></h1>` + lede paragraph (2–3 sentences, own words): the feed catches local businesses right after a fresh 1–2★ public review lands — the moment they need reputation help — and drops a clean CSV on the sales team every week.
- `<section><h2>What you get</h2>` — `ul` with exactly these li:
  - business name, category, current public rating + total review count
  - the fresh 1–2 star review: date, text excerpt, direct link to that exact review
  - phone, website, address
  - owner/manager name where public (Business and Professional)
  - contact email where publicly available
- `<section><h2>Example row</h2>` — `<p class="section-note">Schematic example; data fields, not a quote.</p>` + `<div class="demo-json">` one line:

```
Restaurant Name  ·  Dining  ·  3.6★ (412 reviews)  ·  2★ on 2026-11-12: "Waited 50 minutes and the food was cold." [review link]  ·  +61 xxx xxx xxx  ·  restaurantname.com.au  ·  owner name  ·  reservations@restaurantname.com.au
```

- `<section><h2>Packages</h2>` — `<div class="packages">` with three `<div class="pkg">` (Professional gets `featured`); each: `.pkg-name` + `.pkg-price` + `.pkg ul` features + `.pkg-note`.
  - Starter: price line `EUR 50 <small>+ VAT</small>`; ul: 50 leads/month · weekly CSV · one niche + region · review link · phone, website; note: Free 50-lead sample before you commit.
  - Business: `EUR 100 <small>+ VAT</small>`; ul: 100 leads/month · everything in Starter · owner names where public · contact emails prioritized; note: The working default for one sales team.
  - Professional: `EUR 300 <small>+ VAT</small>`; ul: 300 leads/month · everything in Business · multiple niches and regions · priority turnaround · monthly review call; note: Multi-region reputation agencies.
- `<section><h2>How it works</h2>` — `ul`: 1) you name the niche + city/region; 2) a free 50-lead sample arrives within 48 hours as CSV (UTF-8, opens in Excel/Sheets); 3) the weekly feed lands in your inbox, cancel anytime.
- `<section><h2>Compliance</h2>` — one short paragraph (own words, factual): B2B marketing service; only publicly listed business contacts, opt-outs honored immediately, sender always identified. Not legal advice — keep one sentence.
- `<section><h2>Contact</h2>` — `.cta` with `<a class="btn" href="mailto:alexander.pyrforos@gmail.com">Request the free sample</a>` and `<a class="btn ghost" href="/">Back to the portfolio</a>`.
- footer: copy `index.html:147-150` structure (`© 2026 Alexander Pyrforos`, `pyrforos.xyz`).
- scripts: only `<script type="module" src="/js/theme.js"></script>` before `</body>`.

- [ ] **Step 2: Verify JSON-LD parses** — Run:

```bash
node -e "const s=require('fs').readFileSync('public/services.html','utf8');const m=s.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/);JSON.parse(m[1]);console.log('ld ok')"
```

Expected: `ld ok`
- [ ] **Step 3: Verify forbidden wording absent** — Run: `grep -in "scraped\|google maps" public/services.html || echo clean`, Expected: `clean` (the string "public rating" is fine; "Google" alone in review-rating context is allowed, "Google Maps" is not)
- [ ] **Step 4: Verify prices verbatim** — Run: `grep -o "EUR [0-9]*" public/services.html | sort -u`, Expected: exactly three lines — `EUR 50`, `EUR 100`, `EUR 300`
- [ ] **Step 5: Commit**

```bash
git add public/services.html
git commit -m "site: /services page — lead feed service, packages, SEO"
```

### Task 3: Services teaser on index

**Files:**
- Modify: `public/index.html` (insert between Open source `</section>` at line 88 and Dossiers `<section>` at line 90)

**Interfaces:**
- Consumes: `/services` page (Task 2), `.card` markup pattern.
- Produces: nothing consumed downstream.

- [ ] **Step 1: Insert the section**

```html
  <section id="services">
    <h2>Services</h2>
    <a class="card" href="/services">
      <span class="top"><h3>Weekly lead feed</h3><span class="kind">service</span></span>
      <p>Local businesses hit by fresh 1–2 star public reviews — review link, contacts, emails. For sales and reputation teams. Packages from EUR 50.</p>
      <span class="tags">csv · weekly · tailored niche</span>
    </a>
  </section>
```

- [ ] **Step 2: Verify** — Run: `grep -c 'id="services"' public/index.html`, Expected: `1`; Run: `grep -c 'href="/services"' public/index.html`, Expected: `1`
- [ ] **Step 3: Verify suite green** — Run: `npx vitest run`, Expected: PASS
- [ ] **Step 4: Commit**

```bash
git add public/index.html
git commit -m "site: services teaser card on index"
```

### Task 4: sitemap.xml + llms.txt

**Files:**
- Create: `public/sitemap.xml`
- Modify: `public/llms.txt` (Pages list)

**Interfaces:**
- Consumes: canonical URLs.
- Produces: SEO discovery surface for / and /services.

- [ ] **Step 1: Create sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://pyrforos.xyz/</loc></url>
  <url><loc>https://pyrforos.xyz/services</loc></url>
</urlset>
```

- [ ] **Step 2: Append to llms.txt Pages list**

```
- [/services](https://pyrforos.xyz/services) Lead feed service for sales and reputation teams: contents, packages (EUR 50/100/300 + VAT), delivery, sample request.
```

- [ ] **Step 3: Verify XML parses** — Run: `python3 -c "import xml.etree.ElementTree as ET; ET.parse('public/sitemap.xml'); print('xml ok')"`, Expected: `xml ok`
- [ ] **Step 4: Commit**

```bash
git add public/sitemap.xml public/llms.txt
git commit -m "site: sitemap + llms.txt entry for /services"
```

### Task 5: End-to-end verification

**Files:** none (verification only)

**Interfaces:**
- Consumes: all prior tasks.

- [ ] **Step 1: Serve locally** — Run: `cd public && python3 -m http.server 8137` (background)
- [ ] **Step 2: Curl checks** — Run:

```bash
curl -s http://localhost:8137/services | grep -c "Professional"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8137/sitemap.xml
curl -s http://localhost:8137/ | grep -c 'href="/services"'
```

Expected: `1`, `200`, `1`
- [ ] **Step 3: Suite green** — Run: `npx vitest run`, Expected: PASS (full unit + worker projects)
- [ ] **Step 4: Report deploy decision to owner** — deploy is `npx wrangler deploy`; do NOT run it without owner confirmation.
