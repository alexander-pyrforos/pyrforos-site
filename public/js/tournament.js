/* Live pair-voting tournament (tinder-anything as product).
   Pure helpers are exported; the browser flow mounts into #tournament-root. */

/** Canonical unordered-pair key, same rule as src/votes.ts. */
export function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Add a seen pair to the exclude set (session memory). */
export function accumulateExcluded(excluded, a, b) {
  excluded.add(pairKey(a, b));
  return excluded;
}

/** Deterministic seeded RNG [0,1). */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let z = t;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates; returns a new array. */
export function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Map a clicked option id to the API's choice letter ("a" | "b"). */
export function choiceFor(pair, optionId) {
  return optionId === pair.b.id ? "b" : "a";
}

/* ---- browser flow ---- */

export async function tourney(container, { onCounts } = {}) {
  const excluded = new Set();
  let active = null; // current pair { a, b }
  let voting = false;

  function make(cls, text) {
    const n = document.createElement("div");
    n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function stageEl() {
    let s = container.querySelector(".t-stage");
    if (!s) {
      s = make("t-stage");
      container.appendChild(s);
    }
    return s;
  }

  function noteEl(text) {
    let n = container.querySelector(".t-note");
    if (!n) {
      n = make("t-note");
      container.appendChild(n);
    }
    n.textContent = text;
    return n;
  }

  function clearNote() {
    const n = container.querySelector(".t-note");
    if (n) n.remove();
  }

  function clearStage() {
    const stage = stageEl();
    while (stage.firstChild) stage.removeChild(stage.firstChild);
  }

  function nextButton(pair) {
    const next = document.createElement("button");
    next.type = "button";
    next.className = "demo-btn t-next";
    next.textContent = "next pair";
    next.addEventListener("click", () => {
      accumulateExcluded(excluded, pair.a.id, pair.b.id);
      load();
    });
    return next;
  }

  function errorState() {
    const stage = stageEl();
    clearStage();
    active = null;
    stage.appendChild(make("t-error", "Voting is temporarily unavailable."));
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "demo-btn t-retry";
    retry.textContent = "retry";
    retry.addEventListener("click", () => { clearNote(); load(); });
    stage.appendChild(retry);
  }

  async function fetchPair() {
    const q = excluded.size
      ? `?exclude=${encodeURIComponent([...excluded].join(","))}`
      : "";
    let res;
    try {
      res = await fetch(`/api/pair${q}`);
    } catch {
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.pair ? data.pair : null;
  }

  function renderAsking(pair) {
    active = pair;
    const stage = stageEl();
    clearStage();
    clearNote();
    // seeded shuffle: left/right position is random, deterministic per render
    const rng = mulberry32(Math.floor(Math.random() * 0xffffffff));
    const [left, right] = shuffle([pair.a, pair.b], rng);
    const row = make("t-pair");
    for (const opt of [left, right]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "t-card";
      btn.setAttribute("aria-label", `Vote for ${opt.title}`);
      const art = document.createElement("span");
      art.className = `t-art ${opt.art}`;
      art.setAttribute("aria-hidden", "true");
      const title = make("t-title");
      title.textContent = opt.title;
      btn.appendChild(art);
      btn.appendChild(title);
      btn.addEventListener("click", () => vote(choiceFor(pair, opt.id)));
      row.appendChild(btn);
    }
    stage.appendChild(row);
  }

  function renderVoted(result, pair) {
    const stage = stageEl();
    clearStage();
    clearNote();
    const a = result.counts.a || 0;
    const b = result.counts.b || 0;
    const total = a + b;
    const bar = make("t-bar");
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", `Current standings: ${a} to ${b}`);
    const ba = document.createElement("span");
    ba.className = "t-bar-a";
    ba.style.width = total ? `${(a / total) * 100}%` : "50%";
    const bb = document.createElement("span");
    bb.className = "t-bar-b";
    bb.style.width = total ? `${(b / total) * 100}%` : "50%";
    bar.appendChild(ba);
    bar.appendChild(bb);
    stage.appendChild(bar);
    const line = make("t-counts");
    line.textContent = `${pair.a.title} : ${pair.b.title} — ${a} : ${b}`;
    stage.appendChild(line);
    stage.appendChild(nextButton(pair));
    if (typeof onCounts === "function") onCounts(result);
  }

  function renderNextOnly(pair) {
    const stage = stageEl();
    clearStage();
    stage.appendChild(nextButton(pair));
  }

  async function vote(choice) {
    if (!active || voting) return;
    voting = true;
    const pair = active;
    active = null; // one vote per rendered pair
    clearNote();
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: pair.a.id, b: pair.b.id, choice }),
      });
      if (res.status === 201) {
        renderVoted(await res.json(), pair);
      } else if (res.status === 409) {
        noteEl("You already voted on this pair today.");
        renderNextOnly(pair);
      } else {
        noteEl("Voting is temporarily unavailable. Try again in a moment.");
        active = pair; // allow a retry on the same pair
      }
    } catch {
      noteEl("Voting is temporarily unavailable. Try again in a moment.");
      active = pair; // allow a retry on the same pair
    } finally {
      voting = false;
    }
  }

  async function load() {
    clearStage();
    const pair = await fetchPair();
    if (!pair) { errorState(); return; }
    renderAsking(pair);
  }

  await load();

  return { excluded };
}

/* ---- auto-mount (browser only) ---- */
if (typeof document !== "undefined") {
  const container = document.getElementById("tournament-root");
  if (container) {
    tourney(container);
  }
}