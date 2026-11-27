// Counts visits to the website's own pages: the home page and Help. Nothing else.
// It is never loaded inside Mess. Nothing under app/ includes this file, and app/'s own security line refuses
// the counting script even if Cloudflare is set to add it to every page (tests/site-visits.test.js checks both).
//
// The counter is Cloudflare Web Analytics. It sets no cookie and stores nothing on the device. The token below
// is public by design: it sits in the page and only says which site a count belongs to. It is not a key.
// With no token, nothing loads. Pressing "Stop counting my visits" on the Help page keeps one word in this
// browser so the counter is never loaded here again; a browser that sends Global Privacy Control is never counted.
(function () {
  var TOKEN = 'cc681e866c4b4a9c9caa2afdfa295ae7';
  var KEY = 'mess-site-no-count';
  var said = function () { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  var asked = navigator.globalPrivacyControl === true;

  if (TOKEN && !asked && !said()) {
    var s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
    document.head.appendChild(s);
  }

  // The switch on the Help page. It stays hidden with no token, because then there is nothing to switch.
  var box = document.getElementById('visits');
  if (!box || !TOKEN) return;
  var say = box.querySelector('[data-say]'), btn = box.querySelector('button');
  var show = function () {
    var off = said();
    say.textContent = asked ? 'Your browser asks sites not to track you, so your visits here are not counted.'
      : off ? 'Visits from this browser are not counted.' : 'Visits from this browser are counted.';
    btn.textContent = off ? 'Count my visits again' : 'Stop counting my visits';
    btn.hidden = asked;
  };
  btn.addEventListener('click', function () {
    try { if (said()) localStorage.removeItem(KEY); else localStorage.setItem(KEY, '1'); } catch (e) {}
    show();
  });
  show(); box.hidden = false;
})();
