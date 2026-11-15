// Hash-based tabs on /services: #lead-feed | #ai-structuring.
// Deep-linkable from index cards; default is lead-feed.
// Progressive enhancement: without JS every section stays visible —
// hiding happens only in this script's apply() call.
const TABS = new Set(["lead-feed", "ai-structuring"]);
const DEFAULT_TAB = "lead-feed";

function activeTab() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ""));
  return TABS.has(h) ? h : DEFAULT_TAB;
}

function apply(tab) {
  document.querySelectorAll("[data-group]").forEach((el) => {
    if (el.getAttribute("data-group") === tab) el.removeAttribute("hidden");
    else el.setAttribute("hidden", "");
  });
  document.querySelectorAll(".svc-tabs a").forEach((a) => {
    if (a.getAttribute("data-tab") === tab) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
}

window.addEventListener("hashchange", () => apply(activeTab()));
apply(activeTab());
