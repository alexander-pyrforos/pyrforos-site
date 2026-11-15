# Design — Services section + /services page (ORM lead feed)

Date: 2026-11-15 · Status: draft for approval · Size: small change

## Intent & why

The lead-feed pipeline (weekly CSV of local businesses that just received a
fresh 1–2★ public review, sold to online-reputation / reputation-mgmt agencies
at EUR 300/mo) is live and has its first client. It becomes a commercial
service and needs a public home: a Services section on index.html and a
dedicated /services page, both SEO-optimized. Secondary motive: cold outreach
emails need a credible link to show the product.

## Goals / non-goals

- Goals: sellable public copy (English), tiered pricing, SEO basics, zero
  worker/D1 changes, existing design language untouched.
- Non-goals: client portal/auth, payment integration, multi-service catalog
  beyond cards, changes to the voting/agent demos.
- Anti-goals: wording that implies scraping Google or non-consented emailing
  ("scraped", "Google Maps" in product copy); price war noise — tiers are
  neutral and factual.

## Constraints

- Single-repo static site: everything in `public/` (index.html, styles.css,
  new services.html, sitemap.xml); ASSETS serving handles /services
  (auto-trailing-slash → services.html). No src/ changes expected.
- Legal posture: B2B service sold to companies; copy states legitimate B2B
  use, opt-out honored, sender identified; no claims about data sources
  beyond "public review data".
- Packages (owner-set): Starter 50 EUR, Business 100 EUR, Professional
  300 EUR, all +VAT — prices shown only on /services.

## Approaches considered

- A. Services section on index only — rejected alone: not enough room for
  the full pitch; user chose A+B.
- B. Dedicated /services long-form page — chosen (full pitch, pricing, CTA,
  SEO surface).
- C. Email-only sales material — rejected: outreach needs a credible link.
- A+B chosen: short card on index (teaser → /services), full page for detail.

## Chosen design

1. **index.html**: new `<section id="services">` after "Open source", before
   "Dossiers": h2 "Services", one teaser card (style `.card`) linking to
   /services: "Weekly lead feed for sales teams — businesses hit by fresh
   1–2★ public reviews, with review link, contacts and emails. Packages from
   EUR 50." No price table on index.
2. **public/services.html** (new, same head pattern as index): hero + lede;
   what the feed contains (bulleted, mirrors the email pitch); schematic
   example row; packages table Starter/Business/Professional (EUR 50/100/300
   + VAT); how delivery works (weekly CSV, niche+region tailored, opt-out);
   compliance note (B2B marketing data, opted-out contacts excluded, sender
   identified); CTA block (mailto for free 50-lead sample).
3. **Tier contents** (proposed, owner to confirm/correct):
   | Tier | Price +VAT | Leads | Delivery | Extras |
   |---|---|---|---|---|
   | Starter | 50 | 50/mo | weekly CSV | one niche+region, review link, phone, website |
   | Business | 100 | 100/mo | weekly CSV | + owner names where public, emails prioritized |
   | Professional | 300 | 300/mo | weekly CSV | + multiple niches/regions, priority turnaround, monthly call |
   (Existing client quoted EUR 300/mo = Professional, consistent.)
4. **SEO (both pages)**: meta description per page; canonical links;
   JSON-LD: keep ProfilePage on index; add `Service` + `Offer` schema on
   /services (3 tiers as offers with prices EUR 50/100/300); new
   `public/sitemap.xml` (index, /services); robots.txt unchanged (search
   crawlers allowed); llms.txt Pages list gains /services entry.
5. **Tests**: none new (static markup); vitest suite stays green.

## What's left to the builder

- Exact English copy + heading structure (H1/H2s) on /services; card teaser
  wording; CSS additions (`.packages` table styles) in the existing token
  system; local preview + `npx wrangler deploy` by owner decision; commit
  cadence (local git, no push unless owner asks).
