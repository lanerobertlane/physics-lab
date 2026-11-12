// Shared helpers: header, themes, full screen, spec panel, toast, offline cache.

// ---- Site name: change it here and it updates everywhere. ----
const SITE = {
  name: "Mr Lane's Physics Lab",
  byline: 'KS3 & AQA GCSE Physics · Beta', // shown under the name in the header
  version: 59,   // shown in the footer; keep it the same as VERSION in sw.js
  bugEmail: 'bug@lanerobertlane.space',
};

const PK = (() => {
  const root = document.documentElement.dataset.root || './';
  // Theme id -> label in the menu. Lesson is the default for anyone who hasn't chosen.
  const THEMES = {
    lesson: 'Lesson',
    pink: 'Pink Noise',
    light: 'Light',
    classroom: 'ClassCharts',
    sparx: 'Sparx',
    dark: 'Dark',
  };
  const DEFAULT_THEME = 'lesson';
  // An old saved choice (such as the removed 'auto') falls back to the default.
  const savedTheme = () => { const t = store.get('theme', DEFAULT_THEME); return t in THEMES ? t : DEFAULT_THEME; };

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('physkit.' + key);
        return v === null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('physkit.' + key, JSON.stringify(value)); } catch { /* storage blocked */ }
    },
  };

  const icons = {
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4-4-7.4-9-7.4z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/></svg>',
    // App icon: a Newton's cradle. Uses currentColor so it follows the header colours.
    cradle: '<svg viewBox="-1 -1 34 34" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M4 5h24" stroke-width="2.6"/><path d="M9.2 5L3.4 17.6M12.6 5v13.9M16 5v13.9M19.4 5v13.9M22.8 5v13.9" stroke-width="1.1"/><g fill="currentColor" stroke="none"><circle cx="2.65" cy="19.15" r="1.75"/><circle cx="12.6" cy="20.6" r="1.75"/><circle cx="16" cy="20.6" r="1.75"/><circle cx="19.4" cy="20.6" r="1.75"/><circle cx="22.8" cy="20.6" r="1.75"/></g></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    classroom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l9-4 9 4-9 4z"/><path d="M7 8v5c0 1.5 2.2 3 5 3s5-1.5 5-3V8"/><path d="M21 6v6"/></svg>',
    sparx: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.2 6.3L20 10l-5.8 1.7L12 18l-2.2-6.3L4 10l5.8-1.7z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    exitFullscreen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  };

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme in THEMES ? theme : DEFAULT_THEME;
  }

  const currentTheme = () => document.documentElement.dataset.theme || DEFAULT_THEME;

  const isDark = () => currentTheme() === 'dark';

  // Full screen (the same as pressing F11). Safari before 16.4 only has the webkit names.
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  // The address's #part when the page opened, before a tool changes it (e.g. #practice)
  const initialHash = location.hash;
  const fsEnabled = () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  function toggleFullscreen() {
    const de = document.documentElement;
    const p = fsElement()
      ? (document.exitFullscreen || document.webkitExitFullscreen).call(document)
      : (de.requestFullscreen || de.webkitRequestFullscreen).call(de);
    if (p && p.catch) p.catch(() => toast('Full screen isn’t available here. Try pressing F11.'));
  }

  // Show / hide answers, so students can work values out for themselves. One setting for
  // the whole site. Wrap a value in PK.ans() for HTML; use PK.ansText() for canvas text.
  // A shared link can hide the answers for whoever opens it, without changing their own setting
  const linkHidesAnswers = new URLSearchParams(location.search).get('answers') === 'hide';
  const answersShown = () => !linkHidesAnswers && store.get('answers', true) !== false;
  function applyAnswers(on) {
    if (on) delete document.documentElement.dataset.hideAnswers;
    else document.documentElement.dataset.hideAnswers = '';
  }
  const ans = (html) => `<span class="pk-ans"><span class="pk-ans-v">${html}</span><span class="pk-ans-q" aria-label="hidden answer">?</span></span>`;
  const ansText = (text) => (answersShown() ? text : '?');

  // Apply saved settings straight away to avoid a flash.
  applyTheme(savedTheme());
  applyAnswers(answersShown());
  // Content beyond the specification stays hidden unless the box in the footer is ticked
  const beyondShown = () => store.get('beyond', false) === true;
  const applyBeyond = () => document.documentElement.classList.toggle('show-beyond', beyondShown());
  applyBeyond();

  function header({ title = '', isHome = false, spec = null, answers = false, specNote = null, back = null } = {}) {
    document.title = title ? `${title} · ${SITE.name}` : SITE.name;
    // Opened from a Revise link on a quiz's score screen: the back button returns to the score
    const fromQuiz = new URLSearchParams(location.search).has('fromquiz');
    if (fromQuiz) back = { href: `${root}tools/quiz.html`, label: 'Back to my score' };

    const el = document.createElement('header');
    el.className = isHome ? 'site-header' : 'site-header tool';
    el.innerHTML = `
      ${isHome ? '' : `<a class="icon-btn" id="pk-back" href="${back ? back.href : `${root}index.html`}" aria-label="${back ? back.label : 'All tools'}">${icons.back}<span class="label">${back ? back.label : 'All tools'}</span></a>`}
      <a class="brand" href="${root}index.html">
        <span class="brand-mark" aria-hidden="true">${icons.cradle}</span>
        <span class="brand-text"><span class="brand-name">${SITE.name}</span>${SITE.byline ? `<span class="brand-by">${SITE.byline}</span>` : ''}</span>
      </a>
      ${title ? `<span class="header-title">${title}</span>` : ''}
      <span class="header-spacer"></span>
      <div class="header-actions">
        ${answers && !linkHidesAnswers ? `<button class="icon-btn" id="pk-answers" aria-pressed="false">${icons.eye}<span class="label">Answers</span></button>` : ''}
        ${fsEnabled() ? `<button class="icon-btn fs-btn" id="pk-fullscreen" title="Full screen (F11)">${icons.fullscreen}<span class="label">Full screen</span></button>` : ''}
        <label class="icon-btn theme-select" title="Colour theme">${icons.palette}
          <select id="pk-theme" aria-label="Colour theme">
            ${Object.entries(THEMES).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}
          </select>
        </label>
      </div>`;
    document.body.prepend(el);
    if (fromQuiz) el.querySelector('#pk-back').addEventListener('click', (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } });

    const themeSel = el.querySelector('#pk-theme');
    themeSel.value = savedTheme();
    themeSel.addEventListener('change', () => {
      applyTheme(themeSel.value);
      store.set('theme', themeSel.value);
      window.dispatchEvent(new Event('pk-theme'));
    });

    const ansBtn = el.querySelector('#pk-answers');
    if (ansBtn) {
      const syncAns = () => {
        const on = answersShown();
        ansBtn.innerHTML = `${on ? icons.eye : icons.eyeOff}<span class="label">${on ? 'Answers shown' : 'Answers hidden'}</span>`;
        ansBtn.setAttribute('aria-pressed', String(!on));
        ansBtn.title = on ? 'Hide the answers, so you can work them out yourself' : 'Show the answers';
      };
      ansBtn.addEventListener('click', () => {
        store.set('answers', !answersShown());
        applyAnswers(answersShown());
        syncAns();
        toast(answersShown() ? 'Answers shown' : 'Answers hidden: work them out yourself');
        window.dispatchEvent(new Event('pk-answers'));
        window.dispatchEvent(new Event('pk-theme'));   // tools redraw their canvases on this
      });
      syncAns();
    }

    const fsBtn = el.querySelector('#pk-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', toggleFullscreen);
      const syncFs = () => {
        const on = Boolean(fsElement());
        fsBtn.innerHTML = `${on ? icons.exitFullscreen : icons.fullscreen}<span class="label">${on ? 'Exit full screen' : 'Full screen'}</span>`;
        fsBtn.title = on ? 'Exit full screen (Esc)' : 'Full screen (F11)';
      };
      document.addEventListener('fullscreenchange', syncFs);
      document.addEventListener('webkitfullscreenchange', syncFs);
    }

    if (spec) specPanel(spec, specNote);
    footer();
  }

  function footer() {
    const el = document.createElement('footer');
    el.className = 'site-footer';
    el.innerHTML = `
      <span>© 2026 Robert Lane</span>
      <a href="${root}terms.html">Terms of use</a>
      <a href="${root}privacy.html">Privacy</a>
      <a id="pk-report" href="mailto:${SITE.bugEmail}">Report a problem</a>
      <span>Beta v${SITE.version}</span>
      <label class="footer-beyond"><input type="checkbox" id="pk-beyond"${beyondShown() ? ' checked' : ''}> Show content beyond the spec</label>`;
    document.body.appendChild(el);
    // The email is filled in when the link is pressed, so it describes the page as it is then
    el.querySelector('#pk-report').addEventListener('click', (e) => {
      const lines = ['What went wrong?', '', '', '---- Please leave this part in ----', `Page: ${document.title.split(' · ')[0]}`, `Address: ${location.href.slice(0, 400)}`, `Version: v${SITE.version}`, `Device: ${navigator.userAgent}`, `Window: ${window.innerWidth} × ${window.innerHeight}`];
      e.currentTarget.href = `mailto:${SITE.bugEmail}?subject=${encodeURIComponent(`Physics Lab problem: ${document.title.split(' · ')[0]}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    });
    el.querySelector('#pk-beyond').addEventListener('change', (e) => {
      store.set('beyond', e.target.checked);
      applyBeyond();
      window.dispatchEvent(new Event('pk-beyond'));
    });
  }

  // spec: [{ code: '4.5.1.4', text: 'Resultant forces', ht?: true }, { code: 'KS3', text: '…' }]
  function specPanel(spec, note) {
    const main = document.querySelector('main');
    const intro = document.querySelector('.tool-intro');
    if (intro) {
      const line = document.createElement('div');
      line.className = 'spec-line';
      const codes = [...new Set(spec.map((s) => (s.code === 'KS3' ? 'KS3' : 'AQA ' + s.code)))];
      line.innerHTML = codes.map((c) => `<span class="tag">${c}</span>`).join('')
        + '<a class="tag" href="#spec" style="text-decoration:none">What it covers ↓</a>';
      intro.appendChild(line);
    }
    const panel = document.createElement('section');
    panel.className = 'panel spec-panel';
    panel.id = 'spec';
    panel.innerHTML = `<h2>Specification coverage</h2>
      <ul>${spec.map((s) => `<li><span class="code">${s.code === 'KS3' ? 'KS3' : 'AQA ' + s.code}</span><span>${s.text}${s.ht ? ' <span class="tag ht">Higher</span>' : ''}${s.po ? ' <span class="tag po">Physics only</span>' : ''}</span></li>`).join('')}</ul>
      <p class="note">${note || 'AQA references are to GCSE Physics (8463); Combined Science (8464) covers the same content apart from Physics-only points. KS3 references are to the National Curriculum programme of study.'}</p>`;
    main.appendChild(panel);
  }

  let toastTimer;
  function toast(message) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function copyLink(url = location.href) {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied — paste it anywhere to open this set-up');
    } catch {
      window.prompt('Copy this link:', url);
    }
  }

  // Read a CSS custom property (used to colour SVG/canvas drawings).
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Format a number to n significant figures, using standard form for very big/small values.
  function sig(x, n = 3) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const abs = Math.abs(x);
    if (abs >= 1e6 || abs < 1e-3) {
      const [m, e] = x.toExponential(n - 1).split('e');
      return `${parseFloat(m)} × 10<sup>${parseInt(e, 10)}</sup>`;
    }
    return String(parseFloat(x.toPrecision(n)));
  }

  // Dragging on a canvas drawn in W × H units. hit(p) returns what is under the finger (or null);
  // move(what, p, start) follows the drag; end(what) runs after a drag and tap(what) after a tap.
  function dragOn(cv, W, H, { hit, move, end, tap }) {
    const at = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
    let held = null, start = null, moved = false, over = false;
    cv.addEventListener('pointerdown', (e) => {
      const p = at(e), h = hit(p);
      if (!h) return;
      held = h; start = p; moved = false;
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = 'grabbing';
      e.preventDefault();
    });
    cv.addEventListener('pointermove', (e) => {
      const p = at(e);
      if (!held) { const h = Boolean(hit(p)); if (h !== over) { over = h; cv.style.cursor = h ? 'grab' : ''; } return; }
      if (!moved && Math.hypot(p.x - start.x, p.y - start.y) < 6) return;
      moved = true;
      if (move) move(held, p, start);
    });
    const stop = () => {
      if (!held) return;
      const h = held;
      held = null; over = false; cv.style.cursor = '';
      if (moved) { if (end) end(h); } else if (tap) tap(h);
    };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);
  }

  // Number boxes: <div class="stepper" data-num> holding an <input type="number" data-inc="…">
  // between − and + buttons (data-step="-1" and "1"). Type a value, tap, or hold to keep going.
  function numberOf(el, raw) {
    const hi = el.max === '' ? Infinity : Number(el.max), lo = el.min === '' ? -Infinity : Number(el.min);
    let v = Number(raw === '' ? el.defaultValue : raw);
    if (!Number.isFinite(v)) v = Number(el.defaultValue);
    v = Math.max(lo, Math.min(hi, v));
    return 'whole' in el.dataset ? Math.round(v) : parseFloat(v.toFixed(6));
  }
  const num = (id) => { const el = document.getElementById(id); return numberOf(el, el.value); };
  const setNum = (id, v) => { const el = document.getElementById(id); el.value = numberOf(el, v); };
  // A group of chips with data-v values: tapping one presses it and passes on its number
  function chips(id, fn) {
    const all = document.querySelectorAll(`#${id} .chip`);
    all.forEach((b) => b.addEventListener('click', () => { all.forEach((c) => c.setAttribute('aria-pressed', String(c === b))); fn(Number(b.dataset.v)); }));
  }
  const stepButton = (t) => t.closest && t.closest('.stepper[data-num] button[data-step]');
  function bump(b) {
    const el = b.parentElement.querySelector('input');
    el.value = numberOf(el, numberOf(el, el.value) + Number(b.dataset.step) * (Number(el.dataset.inc) || 1));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  let held = null;
  const letGo = () => { if (held) { clearTimeout(held.wait); clearInterval(held.again); held = null; } };
  document.addEventListener('pointerdown', (e) => {
    const b = stepButton(e.target);
    if (!b) return;
    letGo();
    const h = { b, repeated: false };
    h.wait = setTimeout(() => { h.repeated = true; bump(b); h.again = setInterval(() => bump(b), 90); }, 450);
    held = h;
  });
  document.addEventListener('pointerup', (e) => { if (held && !held.repeated && stepButton(e.target) === held.b) bump(held.b); letGo(); });
  document.addEventListener('pointercancel', letGo);
  // Older iPads can still zoom on a quick double tap, so a number box's buttons cancel it themselves
  document.addEventListener('touchend', (e) => { if (stepButton(e.target)) e.preventDefault(); }, { passive: false });
  document.addEventListener('click', (e) => { const b = stepButton(e.target); if (b && e.detail === 0) bump(b); });   // keyboard
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.closest || !el.closest('.stepper[data-num]') || el.tagName !== 'INPUT') return;
    const v = String(numberOf(el, el.value));
    if (v !== el.value) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
  });

  // Cache the site for offline use (only works over http/https).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(root + 'sw.js').catch(() => {});
    });
  }

  // Anonymous page-view counts (Cloudflare Web Analytics): no cookies and nothing stored on the
  // device. Only on the live site, so testing locally isn't counted.
  if (location.hostname === 'lanerobertlane.space') {
    const beacon = document.createElement('script');
    beacon.defer = true;   // a classic script, so the beacon can find its own tag (document.currentScript)
    beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    beacon.setAttribute('data-cf-beacon', '{"token": "abeb8a6480974a32b24aafb4d792e58d"}');
    document.head.appendChild(beacon);
  }

  // Tooltips, Copy picture, Share, glossary and recently used (see extras.js)
  const extras = document.createElement('script');
  extras.src = `${root}js/extras.js`;
  document.head.appendChild(extras);

  return { root, store, header, toast, copyLink, cssVar, sig, isDark, ans, ansText, answersShown, toggleFullscreen, fullscreenEnabled: fsEnabled, initialHash, num, setNum, beyondShown, chips, dragOn };
})();
