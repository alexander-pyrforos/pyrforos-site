/* Recorded demo scenario — placeholder content (EN).
   Owner provides real figures/images later; phones are always masked. */
window.DEMO_SCENARIO = {
  bubble: {
    meta: "+852 •• ••• ••• · not in contacts · HKG",
    text: "15500ST blue 2016 fullset 540000 💵",
  },
  extract: {
    // one line of pretty-printed JSON per revealed token; jk/jv colored in CSS
    tokens: [
      "{",
      '&nbsp;&nbsp;<span class="jk">"product"</span> {',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"brand"</span>: <span class="jv">"Audemars Piguet"</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"collection"</span>: <span class="jv">"Royal Oak"</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"reference_number"</span>: <span class="jv">"15500ST"</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"dial_colour"</span>: <span class="jv">"blue"</span>',
      '&nbsp;&nbsp;},',
      '&nbsp;&nbsp;<span class="jk">"price"</span>: <span class="jv">540000</span>,',
      '&nbsp;&nbsp;<span class="jk">"currency"</span>: <span class="jv">"USD"</span>,',
      '&nbsp;&nbsp;<span class="jk">"dealer"</span> {',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"name"</span>: <span class="jv">"unknown"</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"is_contact"</span>: <span class="jv">false</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"sender_phone_country_iso"</span>: <span class="jv">"HK"</span>',
      '&nbsp;&nbsp;},',
      '&nbsp;&nbsp;<span class="jk">"validated"</span>: <span class="jv">false</span>',
      "}",
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