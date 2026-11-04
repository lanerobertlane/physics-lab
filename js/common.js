// Shared helpers: header, themes, projector mode, spec panel, toast, offline cache.

// ---- Site name: change it here and it updates everywhere. ----
const SITE = {
  name: "Mr Lane's Physics Lab",
  byline: 'KS3 & AQA GCSE Physics', // shown under the name in the header
};

const PK = (() => {
  const root = document.documentElement.dataset.root || './';
  // Theme id -> label in the menu. 'auto' follows the device's light/dark setting.
  const THEMES = {
    auto: 'Auto',
    light: 'Light',
    lesson: 'Lesson',
    classroom: 'Classroom',
    sparx: 'Sparx style',
    dark: 'Dark',
  };

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
    projector: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  };

  // 'auto' follows the device's light/dark setting.
  function applyTheme(theme) {
    if (theme in THEMES && theme !== 'auto') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }

  function currentTheme() {
    const t = document.documentElement.dataset.theme;
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const isDark = () => currentTheme() === 'dark';

  function applyProjector(on) {
    if (on) document.documentElement.dataset.projector = '';
    else delete document.documentElement.dataset.projector;
  }

  // Apply saved preferences straight away to avoid a flash.
  applyTheme(store.get('theme', 'auto'));
  applyProjector(store.get('projector', false));

  function header({ title = '', isHome = false, spec = null } = {}) {
    document.title = title ? `${title} · ${SITE.name}` : SITE.name;

    const el = document.createElement('header');
    el.className = isHome ? 'site-header' : 'site-header tool';
    el.innerHTML = `
      ${isHome ? '' : `<a class="icon-btn" href="${root}index.html" aria-label="All tools">${icons.back}<span class="label">All tools</span></a>`}
      <a class="brand" href="${root}index.html">
        <span class="brand-mark" aria-hidden="true">${icons.cradle}</span>
        <span class="brand-text"><span class="brand-name">${SITE.name}</span>${SITE.byline ? `<span class="brand-by">${SITE.byline}</span>` : ''}</span>
      </a>
      ${title ? `<span class="header-title">${title}</span>` : ''}
      <span class="header-spacer"></span>
      <div class="header-actions">
        <button class="icon-btn" id="pk-projector" aria-pressed="false" title="Projector mode: bigger text and bolder lines">${icons.projector}<span class="label">Projector</span></button>
        <label class="icon-btn theme-select" title="Colour theme">${icons.palette}
          <select id="pk-theme" aria-label="Colour theme">
            ${Object.entries(THEMES).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}
          </select>
        </label>
      </div>`;
    document.body.prepend(el);

    const themeSel = el.querySelector('#pk-theme');
    themeSel.value = store.get('theme', 'auto') in THEMES ? store.get('theme', 'auto') : 'auto';
    themeSel.addEventListener('change', () => {
      applyTheme(themeSel.value);
      store.set('theme', themeSel.value);
      window.dispatchEvent(new Event('pk-theme'));
    });

    const projBtn = el.querySelector('#pk-projector');
    projBtn.setAttribute('aria-pressed', String(store.get('projector', false)));
    projBtn.addEventListener('click', () => {
      const on = projBtn.getAttribute('aria-pressed') !== 'true';
      projBtn.setAttribute('aria-pressed', String(on));
      applyProjector(on);
      store.set('projector', on);
      window.dispatchEvent(new Event('pk-theme'));
    });

    if (spec) specPanel(spec);
  }

  // spec: [{ code: '4.5.1.4', text: 'Resultant forces', ht?: true }, { code: 'KS3', text: '…' }]
  function specPanel(spec) {
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
      <p class="note">AQA references are to GCSE Physics (8463); Combined Science (8464) covers the same content apart from Physics-only points. KS3 references are to the National Curriculum programme of study.</p>`;
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

  // Cache the site for offline use (only works over http/https).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(root + 'sw.js').catch(() => {});
    });
  }

  return { root, store, header, toast, copyLink, cssVar, sig, isDark };
})();
