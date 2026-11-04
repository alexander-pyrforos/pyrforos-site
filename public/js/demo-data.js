/* Recorded demo scenario — placeholder content (EN).
   Owner provides real figures/images later; phones are always masked. */
window.DEMO_SCENARIO = {
  bubble: {
    meta: "+852 •• ••• ••• · not in contacts · HKG",
    text: "15500ST blue 2016 fullset 540000 💵",
  },
  extract: {
    tokens: [
      '{ "product": {',
      '&nbsp;&nbsp;"brand": "Audemars Piguet",',
      '&nbsp;&nbsp;"collection": "Royal Oak",',
      '&nbsp;&nbsp;"reference_number": "15500ST",',
      '&nbsp;&nbsp;"dial_colour": "blue" },',
      '"price": 540000,',
      '"currency": "USD",',
      '"dealer": { "name": "unknown",',
      '&nbsp;&nbsp;"is_contact": false,',
      '&nbsp;&nbsp;"sender_phone_country_iso": "HK" },',
      '"validated": false }',
    ],
    commit: "extract · AP / Royal Oak / 15500ST",
  },
  branches: [
    {
      path: "kb/watches",
      note: "ref + dial + brand",
      out: "photo card ready (image placeholder)",
      status: "ok",
    },
    {
      path: "db/warehouse",
      note: "reference lookup",
      out: "✕ not in stock",
      status: "miss",
    },
    {
      path: "db/deals",
      note: "sales history",
      out: "◉ sold before · +20% margin",
      status: "ok",
    },
    {
      path: "market/b2c",
      note: "fullset, papers, box",
      out: "B2C price range (placeholder)",
      status: "ok",
    },
    {
      path: "sanity/price",
      note: "deal + b2c range",
      out: "⚠ USD vs HKD doubt → flag to convert",
      status: "warn",
    },
  ],
  merge: "merge → buyer report",
  report: [
    "Confirm the currency: USD or HKD? (dealer is in Hong Kong)",
    "Benchmark the deal vs B2C range + expected margin",
    "Fullset terms: papers, box, service history",
  ],
};