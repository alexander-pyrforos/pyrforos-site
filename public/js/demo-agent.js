/* Recorded agent demo: dealer message → JSON extract → git-tree of tool
   calls → merge → buyer report. No inference; a scripted timeline.
   renderDemo(container, scenario, {instant}) — builds the skeleton, wires
   replay/skip, exposes run({start}) for the caller; #demo-agent-root mounts
   below and starts the timeline when scrolled into view (once). */

const TYPE_MS = 28; // per typed char
const BRANCH_MS = 450;
const TOKEN_MS = 110;
const STEP_MS = 300;

function wantsInstant(container) {
  if (typeof matchMedia === "function"
    && matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (container.hasAttribute("data-demo-instant")) return true;
  return false;
}

function el(cls) {
  const node = document.createElement("div");
  node.className = cls;
  return node;
}

export function renderDemo(container, scenario) {
  let runId = 0;

  // ---- build skeleton once ----
  const frame = el("demo-frame");
  frame.innerHTML = `
    <div class="demo-msg">
      <div class="demo-msg-meta"></div>
      <div class="demo-msg-text"></div>
    </div>
    <pre class="demo-json" aria-label="Extracted JSON"></pre>
    <div class="demo-tree" aria-live="polite"></div>
    <div class="demo-controls">
      <button type="button" class="demo-btn" data-demo-replay>replay</button>
      <button type="button" class="demo-btn quiet" data-demo-skip>skip</button>
    </div>`;
  frame.querySelector(".demo-msg-meta").textContent = scenario.bubble.meta;
  const text = frame.querySelector(".demo-msg-text");
  const json = frame.querySelector(".demo-json");
  for (const tok of scenario.extract.tokens) {
    const span = document.createElement("span");
    span.className = "demo-tok";
    span.innerHTML = `${tok}\n`;
    json.appendChild(span);
  }
  const tree = frame.querySelector(".demo-tree");
  const root = el("demo-commit");
  root.innerHTML =
    `<span class="demo-dot"></span><span class="demo-path"></span>`;
  root.querySelector(".demo-path").textContent = scenario.extract.commit;
  tree.appendChild(root);
  const branches = el("demo-branches");
  const rows = scenario.branches.map((b) => {
    const row = el("demo-branch");
    row.innerHTML =
      `<span class="demo-dot"></span>` +
      `<span class="demo-path"></span>` +
      `<span class="demo-note"></span>` +
      `<span class="demo-out"></span>`;
    row.querySelector(".demo-path").textContent = `git:${b.path}`;
    row.querySelector(".demo-note").textContent = b.note;
    const out = row.querySelector(".demo-out");
    out.textContent = b.out;
    out.classList.add(`st-${b.status}`);
    branches.appendChild(row);
    return row;
  });
  tree.appendChild(branches);
  const merge = el("demo-commit merge");
  merge.innerHTML =
    `<span class="demo-dot"></span><span class="demo-path"></span>` +
    `<div class="demo-report"></div>`;
  merge.querySelector(".demo-path").textContent = scenario.merge;
  const items = scenario.report.map((q) => {
    const item = el("demo-report-item");
    item.textContent = q;
    merge.querySelector(".demo-report").appendChild(item);
    return item;
  });
  tree.appendChild(merge);
  container.innerHTML = "";
  container.appendChild(frame);

  // ---- timeline helpers ----
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // resolve false when superseded (runId changed)
  const wait = async (ms) => {
    const id = runId;
    await sleep(ms);
    return id === runId;
  };

  function showAll() {
    text.textContent = scenario.bubble.text;
    json.classList.remove("is-off");
    for (const t of json.children) t.classList.remove("is-off");
    for (const node of [root, merge, ...rows, ...items]) {
      node.classList.remove("is-off");
    }
  }

  function hideAll() {
    text.textContent = "";
    json.classList.add("is-off");
    root.classList.add("is-off");
    merge.classList.add("is-off");
    for (const row of rows) row.classList.add("is-off");
    for (const item of items) item.classList.add("is-off");
    for (const t of json.children) t.classList.add("is-off");
  }

  async function play() {
    const id = ++runId;
    hideAll();
    for (let i = 1; i <= scenario.bubble.text.length; i++) {
      text.textContent = scenario.bubble.text.slice(0, i);
      if (!(await wait(TYPE_MS))) return;
    }
    for (const t of json.children) {
      json.classList.remove("is-off");
      t.classList.remove("is-off");
      if (!(await wait(TOKEN_MS))) return;
    }
    json.classList.remove("is-off");
    root.classList.remove("is-off");
    for (const row of rows) {
      if (!(await wait(BRANCH_MS))) return;
      row.classList.remove("is-off");
    }
    merge.classList.remove("is-off");
    for (const item of items) {
      if (!(await wait(STEP_MS))) return;
      item.classList.remove("is-off");
    }
  }

  function run({ instant }) {
    if (instant) { runId++; showAll(); return; }
    play();
  }

  frame.querySelector(".demo-controls").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn && btn.hasAttribute("data-demo-replay")) run({ instant: false });
    if (btn && btn.hasAttribute("data-demo-skip")) run({ instant: true });
  });

  // initial state: only the dealer bubble area visible; steps appear in timeline
  hideAll();

  return { run };
}

/* ---- auto-mount: start once, when scrolled into view ---- */
{
  const container = document.getElementById("demo-agent-root");
  if (container && window.DEMO_SCENARIO
    && typeof IntersectionObserver === "function") {
    const demo = renderDemo(container, window.DEMO_SCENARIO);
    const start = () => demo.run({ instant: wantsInstant(container) });
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          io.disconnect();
          start();
        }
      }
    }, { threshold: 0.2 });
    io.observe(container);
  }
}