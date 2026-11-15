// Lead form on /services → POST /api/lead. No frameworks; inline status.
const form = /** @type {HTMLFormElement} */ (document.getElementById("lead-form"));
const statusEl = /** @type {HTMLElement} */ (document.getElementById("form-status"));
const serviceSel = /** @type {HTMLSelectElement} */ (document.getElementById("f-service"));
const packageRow = /** @type {HTMLElement} */ (document.getElementById("f-package-row"));
const packageSel = /** @type {HTMLSelectElement} */ (document.getElementById("f-package"));

function syncService() {
  const isFeed = serviceSel.value === "lead-feed";
  packageRow.style.display = isFeed ? "" : "none";
  packageSel.disabled = !isFeed;
}
serviceSel.addEventListener("change", syncService);
syncService();

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.classList.toggle("is-error", Boolean(isError));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("Sending…", false);
  const payload = {
    service: serviceSel.value,
    package: serviceSel.value === "lead-feed" ? packageSel.value : null,
    name: form.querySelector("#f-name").value.trim(),
    email: form.querySelector("#f-email").value.trim(),
    niche: form.querySelector("#f-niche").value.trim(),
    message: form.querySelector("#f-message").value.trim() || null,
    // honeypot: real users never fill this
    website: form.querySelector("#f-website").value.trim() || null,
  };

  const emailOk = /^\S+@\S+\.\S+$/.test(payload.email);
  if (!payload.name || !emailOk || !payload.niche) {
    setStatus("Please fill name, a valid email and the niche.", true);
    return;
  }

  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus("Thanks — you'll hear back within 48 hours.", false);
      for (const el of form.querySelectorAll("input, select, textarea, button")) {
        el.disabled = true;
      }
    } else if (res.status === 429) {
      setStatus("Too many requests from your network — try again tomorrow.", true);
    } else {
      setStatus(`Could not send: ${data.error || "unexpected error"}.`, true);
    }
  } catch {
    setStatus("Network error — try again.", true);
  }
});
