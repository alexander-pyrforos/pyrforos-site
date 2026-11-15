/* Recorded demo scenario — placeholder content (EN).
   Owner provides real figures/images later; phones are always masked. */
window.DEMO_SCENARIO = {
  bubble: {
    meta: "+48 •• ••• ••• · not in contacts · PL",
    text: "CAT 320D excavator 2018 12500 m/h EUR 85000 💵",
  },
  extract: {
    // one line of pretty-printed JSON per revealed token; jk/jv colored in CSS
    tokens: [
      "{",
      '&nbsp;&nbsp;<span class="jk">"product"</span> {',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"category"</span>: <span class="jv">"excavator"</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"make"</span>: <span class="jv">"Caterpillar"</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"model"</span>: <span class="jv">"320D"</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"year"</span>: <span class="jv">2018</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"operating_hours"</span>: <span class="jv">12500</span>',
      '&nbsp;&nbsp;},',
      '&nbsp;&nbsp;<span class="jk">"price"</span>: <span class="jv">85000</span>,',
      '&nbsp;&nbsp;<span class="jk">"currency"</span>: <span class="jv">"EUR"</span>,',
      '&nbsp;&nbsp;<span class="jk">"seller"</span> {',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"name"</span>: <span class="jv">"unknown"</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"is_contact"</span>: <span class="jv">false</span>,',
      '&nbsp;&nbsp;&nbsp;&nbsp;<span class="jk">"sender_phone_country_iso"</span>: <span class="jv">"PL"</span>',
      '&nbsp;&nbsp;},',
      '&nbsp;&nbsp;<span class="jk">"validated"</span>: <span class="jv">false</span>',
      "}",
    ],
    commit: "extract · CAT / 320D / 2018",
  },
  branches: [
    {
      path: "kb/machines",
      note: "make + model + year",
      out: "spec sheet ready (image placeholder)",
      status: "ok",
    },
    {
      path: "db/warehouse",
      note: "model lookup",
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
      note: "hours, origin papers",
      out: "B2C price range (placeholder)",
      status: "ok",
    },
    {
      path: "sanity/price",
      note: "deal + b2c range",
      out: "⚠ hours vs year doubt → flag to verify service log",
      status: "warn",
    },
  ],
  merge: "merge → buyer report",
  report: [
    "Verify the service log: 12500 m/h matches a 2018 machine?",
    "Benchmark the deal vs B2C range + expected margin",
    "Export terms: shipping, inspection, origin paperwork",
  ],
};
