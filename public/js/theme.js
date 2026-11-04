export function resolveTheme(stored, systemLight) {
  if (stored === "light" || stored === "dark") return stored;
  return systemLight ? "light" : "dark";
}

export function applyTheme(t) {
  if (t === "light" || t === "dark") {
    document.documentElement.dataset.theme = t;
  } else {
    delete document.documentElement.dataset.theme;
  }
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    const effective =
      t ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    btn.dataset.icon = effective === "light" ? "moon" : "sun";
  }
}

if (typeof document !== "undefined") {
  let stored = null;
  try {
    stored = localStorage.getItem("theme");
  } catch {
    stored = null;
  }
  const systemLight = matchMedia("(prefers-color-scheme: light)").matches;
  if (stored === "light" || stored === "dark") applyTheme(stored);
  else applyTheme(/** @type {null} */ (null));
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.dataset.icon = resolveTheme(stored, systemLight) === "light" ? "moon" : "sun";
    btn.addEventListener("click", () => {
      const systemLightNow = matchMedia("(prefers-color-scheme: light)").matches;
      const current = document.documentElement.dataset.theme ?? (systemLightNow ? "light" : "dark");
      const next = current === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* storage unavailable — session-only choice */
      }
      applyTheme(next);
    });
  }
}