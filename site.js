// The website's moving parts: the try-it question and the hub.
// Everything still reads without it: the question shows a link and every highlight is on the page.
(() => {
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // What else Mess knows: one heading whose ending changes, and the screen that goes with it. It moves on by
  // itself while you watch, waits while you point at it or tab into it, and stops for good once you pick one.
  const more = document.querySelector('.more');
  if (more) {
    const q = (x) => [...more.querySelectorAll(x)], tabs = q('[role=tab]'), views = q('.v'), descs = q('.moredescs p'), roll = more.querySelector('.roll');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches, BEAT = 6000;
    let cur = -1, timer = null, auto = !still, seen = false;
    const show = (i) => {
      if (i === cur) return;
      const first = cur < 0; cur = i;
      tabs.forEach((t, n) => { t.setAttribute('aria-selected', n === i); t.tabIndex = n === i ? 0 : -1; });
      views.forEach((v, n) => { v.hidden = n !== i; });
      descs.forEach((d, n) => d.classList.toggle('on', n === i));
      const say = tabs[i].dataset.say, old = roll.firstElementChild;
      if (first || still || !old.animate) { old.textContent = say; return; }
      const out = old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-.35em)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
      out.finished.then(() => { old.textContent = say; out.cancel(); old.animate([{ opacity: 0, transform: 'translateY(.35em)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' }); }, () => {});
    };
    const beat = () => { clearTimeout(timer); more.classList.toggle('auto', auto && seen); if (auto && seen) timer = setTimeout(() => { if (more.classList.contains('held')) return beat(); show((cur + 1) % tabs.length); beat(); }, BEAT); };
    const stop = () => { auto = false; clearTimeout(timer); more.classList.remove('auto'); };
    more.style.setProperty('--beat', BEAT + 'ms');
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { stop(); show(i); });
      t.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); stop(); const n = (i + d + tabs.length) % tabs.length; show(n); tabs[n].focus(); });
    });
    const grid = more.querySelector('.moregrid'), hold = (on) => (e) => { if (e.pointerType && e.pointerType !== 'mouse') return; more.classList.toggle('held', on); };
    grid.addEventListener('pointerenter', hold(true)); grid.addEventListener('focusin', hold(true)); grid.addEventListener('pointerleave', hold(false)); grid.addEventListener('focusout', hold(false));
    show(0);
    if (auto && 'IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[0].isIntersecting; beat(); }, { threshold: .4 }).observe(grid);
  }
})();
