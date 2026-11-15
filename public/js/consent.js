// Consent banner (Consent Mode v2) — default-denied is set in <head>;
// this script asks once, stores the choice, updates Google consent.
// No third-party banner: rendered in site tokens by consent.js itself.
(function () {
  let stored = 'denied';
  try { stored = localStorage.getItem('py-consent'); } catch (e) {}

  function updateGoogle(value) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', {
      analytics_storage: value,
      ad_user_data: value,
      ad_personalization: value,
    });
  }

  if (stored === 'granted') { updateGoogle('granted'); return; }

  const bar = document.createElement('div');
  bar.className = 'consent-bar';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Analytics consent');
  bar.innerHTML =
    '<p>This site uses privacy-safe analytics to see which pages help. ' +
    'Everything else stays off. <a href="#" class="consent-more">Details</a></p>' +
    '<div class="consent-actions">' +
    '<button type="button" class="btn" data-consent="granted">Allow analytics</button>' +
    '<button type="button" class="btn ghost" data-consent="denied">No thanks</button>' +
    '</div>';

  function store(value) {
    try { localStorage.setItem('py-consent', value); } catch (e) {}
    updateGoogle(value);
    bar.remove();
  }
  bar.querySelectorAll('[data-consent]').forEach((b) =>
    b.addEventListener('click', () => store(b.getAttribute('data-consent'))));
  bar.querySelector('.consent-more').addEventListener('click', (e) => {
    e.preventDefault();
    const p = bar.querySelector('p');
    p.textContent =
      'On "Allow analytics": page views and events go to Google Analytics ' +
      '(Google LLC). On "No thanks": no analytics cookies, only aggregate ' +
      'Consent Mode signals. Your choice is stored locally in this browser ' +
      'and can be changed by clearing site data.';
  });
  document.body.appendChild(bar);
})();
