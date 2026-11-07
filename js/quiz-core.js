// One quiz question, marked on the spot. Shared by Quick quizzes (tools/quiz.html) and the
// Practice questions tab on each tool, so a question looks and marks the same everywhere.
// Needs common.js; pictures come from quiz-images.js (and circuit-symbols.js for circuits).
window.QZ = (() => {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const IMGS = () => window.QUIZ_IMAGES || {};

  // ---------- Marking ----------
  // Plus and minus signs are kept (the charge of an electron is −1, not +1), Ω is read as "ohm",
  // subscript and superscript digits as ordinary digits (CO₂, m²)
  const SUBS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '²': '2', '³': '3' };
  const norm = (s) => {
    const t = String(s).toLowerCase()
      .replace(/[₀-₄²³]/g, (c) => SUBS[c]).replace(/[ω]/g, ' ohm ').replace(/[−–]/g, '-')
      .replace(/[‘’']/g, '').replace(/[^a-z0-9.+\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    // Leave out "a", "an" and "the", unless that's the whole answer ("A" is the unit of current)
    return t.replace(/\b(a|an|the)\b/g, ' ').replace(/\s+/g, ' ').trim() || t;
  };
  function close1(a, b) { // one letter wrong, missing or extra
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return d + (a.length - i) + (b.length - j) <= 1;
  }
  function markShort(q, given) {
    const g = norm(given);
    if (!g) return null;
    // Returns the accepted answer it matched (exactly, or with one letter out)
    return q.accept.find((a) => norm(a) === g) || q.accept.find((a) => { const n = norm(a); return n.length >= 5 && close1(g, n); }) || null;
  }
  function markNum(q, given) {
    const v = Number(String(given).replace(/[,\s]/g, '').replace(/[a-zA-Z/]+$/, ''));
    if (!Number.isFinite(v)) return false;
    return Math.abs(v - q.num) <= Math.abs(q.num) * 0.01 + 1e-9;
  }
  const answerText = (q) => {
    if (q.type === 'mc' || q.type === 'multi') return q.ans.map((k) => q.opts[k]).join(', ');
    if (q.type === 'tf') return q.ans ? 'True' : 'False';
    if (q.type === 'short') return q.accept[0];
    if (q.type === 'num') return `${q.num.toLocaleString('en-GB')}${q.unit ? ` ${q.unit}` : ''}`;
    return q.model;
  };
  const levelName = (lv) => ({ ks3: 'KS3', ks4: 'GCSE', both: 'KS3 and GCSE' }[lv] || '');
  // Does a question suit the chosen level? 'all', 'ks3' or 'ks4'
  const fitsLevel = (q, level) => level === 'all' || !level || q.lv === 'both' || q.lv === level;

  // ---------- Random order (seeded, so a refresh keeps the same order) ----------
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }
  function shuffled(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- Pictures ----------
  const imgHtml = (q, cls = 'qz-img') => (q.img && IMGS()[q.img] ? `<div class="${cls}" data-img="${esc(q.img)}"></div>` : '');
  function fillImgs(root) {
    root.querySelectorAll('[data-img]').forEach((box) => {
      const p = IMGS()[box.dataset.img];
      if (typeof p === 'function') box.replaceChildren(p()); else if (p) box.innerHTML = p;
    });
  }

  // ---------- The question card ----------
  // opts: { res: an earlier result to show, seed, keepOrder, onResult(res), nextLabel, onNext }
  function card(box, q, opts = {}) {
    const r = rng((opts.seed || 1) + 7919);
    let body = `<p class="qz-q">${esc(q.q)}</p>${imgHtml(q)}`;
    if (q.type === 'mc' || q.type === 'multi') {
      const keep = opts.keepOrder || /all of these|none of these/i.test(q.opts.join(' '));
      const order = keep ? q.opts.map((_, k) => k) : shuffled(q.opts.map((_, k) => k), r);
      if (q.type === 'multi') body += '<p class="note qz-hint">Tick all the correct answers.</p>';
      body += `<div class="qz-opts" role="group">${order.map((k) => `<button class="qz-opt" data-k="${k}" aria-pressed="false">${esc(q.opts[k])}</button>`).join('')}</div>`;
    } else if (q.type === 'tf') {
      body += '<div class="qz-opts qz-tf" role="group"><button class="qz-opt" data-k="1" aria-pressed="false">True</button><button class="qz-opt" data-k="0" aria-pressed="false">False</button></div>';
    } else if (q.type === 'short') {
      body += '<input class="qz-input" data-ans type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" placeholder="Type your answer">';
    } else if (q.type === 'num') {
      body += `<div class="qz-numrow"><input class="qz-input" data-ans type="text" inputmode="decimal" autocomplete="off" aria-label="Your answer" placeholder="Your answer">${q.unit ? `<b>${esc(q.unit)}</b>` : ''}</div>`;
    } else {
      body += '<textarea class="qz-input qz-long" data-ans rows="3" aria-label="Your answer" placeholder="Write your answer, then check it against the model answer"></textarea>';
    }
    body += '<div class="qz-feedback" aria-live="polite"></div><div class="btn-row qz-actions"></div>';
    box.innerHTML = body;
    fillImgs(box);
    const fb = box.querySelector('.qz-feedback');
    const actions = box.querySelector('.qz-actions');
    const input = box.querySelector('[data-ans]');
    let res = opts.res || null;
    const save = () => { if (opts.onResult) opts.onResult(res); };
    const btn = (cls, text) => Object.assign(document.createElement('button'), { className: `btn qz-big ${cls}`, type: 'button', textContent: text });

    const check = btn('primary', q.type === 'open' ? 'Show the model answer' : 'Check');
    actions.appendChild(check);
    if (opts.onSkip) { const skip = btn('', 'Skip →'); skip.addEventListener('click', opts.onSkip); actions.appendChild(skip); }
    const pick = (b) => {
      if (res) return;
      if (q.type === 'multi') b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      else box.querySelectorAll('.qz-opt').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      check.disabled = !box.querySelector('.qz-opt[aria-pressed="true"]');
    };
    box.querySelectorAll('.qz-opt').forEach((b) => b.addEventListener('click', () => pick(b)));
    if (q.type === 'mc' || q.type === 'multi' || q.type === 'tf') check.disabled = true;
    if (input && q.type !== 'open') {
      check.disabled = true;
      input.addEventListener('input', () => { check.disabled = !input.value.trim(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !check.disabled) check.click(); });
    }
    check.addEventListener('click', () => {
      if (q.type === 'open') { res = { ok: null, given: input.value }; save(); return showResult(); }
      let ok, given, spelt;
      if (q.type === 'mc' || q.type === 'multi') {
        given = [...box.querySelectorAll('.qz-opt[aria-pressed="true"]')].map((b) => Number(b.dataset.k)).sort();
        ok = given.join() === q.ans.slice().sort().join();
      } else if (q.type === 'tf') {
        given = box.querySelector('.qz-opt[aria-pressed="true"]').dataset.k === '1';
        ok = given === q.ans;
      } else {
        given = input.value;
        if (q.type === 'num') ok = markNum(q, given);
        else { const m = markShort(q, given); ok = Boolean(m); if (m && norm(m) !== norm(given)) spelt = m; }
      }
      res = { ok, given, ...(spelt ? { spelt } : {}) }; save();
      showResult();
    });

    function showResult() {
      if (input) { input.readOnly = true; if (res.given != null) input.value = res.given; }
      box.querySelectorAll('.qz-opt').forEach((b) => {
        const k = Number(b.dataset.k);
        b.disabled = true;
        const right = q.type === 'tf' ? (k === 1) === q.ans : q.ans.includes(k);
        const chosen = q.type === 'tf' ? res.given === (k === 1) : (res.given || []).includes(k);
        b.setAttribute('aria-pressed', String(chosen));
        if (right) b.classList.add('right');
        else if (chosen) b.classList.add('wrong');
      });
      const exp = q.exp ? `<p class="qz-exp">${esc(q.exp)}</p>` : '';
      actions.innerHTML = '';
      if (q.type === 'open') {
        fb.className = 'qz-feedback model';
        fb.innerHTML = `<p class="qz-mlabel">Model answer</p><p class="qz-model">${esc(q.model)}</p>${exp}`;
        if (res.ok === null) {
          fb.insertAdjacentHTML('beforeend', '<p class="qz-ask">Did you get it?</p>');
          const yes = btn('good', '✓ I got it'), no = btn('bad', '✗ Not quite');
          yes.addEventListener('click', () => { res.ok = true; save(); showResult(); });
          no.addEventListener('click', () => { res.ok = false; save(); showResult(); });
          actions.append(yes, no);
          return;
        }
        fb.insertAdjacentHTML('beforeend', `<p class="qz-self">${res.ok ? '✓ You marked this as right' : '✗ You marked this as not quite'}</p>`);
      } else {
        fb.className = `qz-feedback ${res.ok ? 'good' : 'bad'}`;
        fb.innerHTML = res.ok
          ? `<p class="qz-verdict">✓ Correct</p>${res.spelt ? `<p>Check the spelling: <b>${esc(res.spelt)}</b></p>` : ''}${exp}`
          : `<p class="qz-verdict">✗ Not quite</p><p>The answer is <b>${esc(answerText(q))}</b>.</p>${exp}`;
      }
      if (opts.onNext) {
        const next = btn('primary', opts.nextLabel || 'Next question →');
        next.addEventListener('click', opts.onNext);
        actions.appendChild(next);
        next.focus({ preventScroll: true });
      }
    }
    if (res) showResult();
    else if (input && opts.focus !== false) setTimeout(() => input.focus({ preventScroll: true }), 50);
  }

  return { esc, norm, markShort, markNum, answerText, levelName, fitsLevel, rng, shuffled, imgHtml, fillImgs, card };
})();
