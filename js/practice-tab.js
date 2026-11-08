// "Practice questions" for a tool: calculations in the style of Calculation practice, mixed
// with the question bank's questions for this tool (js/quiz-pages/<tool>.js, built by
// scripts/build-quiz-bank.js). Load after the tool's own script, with equations-data.js,
// practice-core.js and, for bank questions, quiz-images.js, quiz-core.js and the page's
// question file. List the equations, if the tool has any:
//   <script src="../js/practice-tab.js" data-eqs="hooke epe"></script>
// It adds an Explore / Practice questions switch under the introduction.

(() => {
  const me = document.currentScript;
  const ids = (me && me.dataset.eqs ? me.dataset.eqs : '').split(/\s+/).filter(Boolean);
  const eqs = ids.map((id) => EQUATIONS.find((e) => e.id === id)).filter((e) => e && PQ.SETUPS[e.id]);
  const page = location.pathname.split('/').pop().replace('.html', '');
  const bank = window.QZ && window.QUIZ_BANK ? window.QUIZ_BANK.questions.filter((q) => q.pg === page) : [];
  if (!eqs.length && !bank.length) return;
  const el = (id) => document.getElementById(`pq-${id}`);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ---------- Styles (kept with the widget, like Calculation practice) ----------
  const css = document.createElement('style');
  css.textContent = `
    .pq-switch { margin: 0 0 14px; }
    .pq .q-panel { font-size: 1.15rem; }
    .pq .tags { gap: 4px; margin-bottom: 8px; display: flex; flex-wrap: wrap; }
    .pq .ctx { margin: 0 0 10px; }
    .pq .givens { list-style: none; padding: 0; margin: 0 0 12px; display: grid; gap: 6px; }
    .pq .givens li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 12px; background: var(--surface-2); border-radius: var(--radius-sm); }
    .pq .givens b { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .pq .ask { margin: 0 0 4px; }
    .pq .eq-show, .pq-present .eq-show { font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 1.3rem; padding: 8px 12px; margin: 6px 0; background: var(--surface-2); border-radius: var(--radius-sm); text-align: center; line-height: 1.3; }
    .pq .frac, .pq-present .frac { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; margin: 0 .15em; }
    .pq .frac > span, .pq-present .frac > span { padding: 0 .2em; }
    .pq .frac > span:first-child, .pq-present .frac > span:first-child { border-bottom: 2px solid currentColor; }
    .pq .pq-answer-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 14px; }
    .pq .pq-answer-row input { min-height: 46px; font-size: 1.15rem; padding: 4px 10px; width: 180px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
    .pq .pq-answer-box { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
    .pq .pq-unit { font-weight: 700; min-width: 2ch; }
    .pq .pq-feedback { margin-top: 10px; min-height: 1.4em; font-weight: 700; }
    .pq .pq-feedback.good { color: #2e7d32; }
    .pq .pq-feedback.bad { color: #c62828; }
    [data-theme="dark"] .pq .pq-feedback.good { color: #81c784; }
    [data-theme="dark"] .pq .pq-feedback.bad { color: #ef9a9a; }
    .pq .steps { margin: 0; padding-left: 1.3em; display: grid; gap: 10px; }
    .pq .steps .ans { font-size: 1.25rem; font-weight: 800; color: var(--answer, inherit); }
    .pq .setting { display: grid; gap: 4px; margin-bottom: 10px; font-weight: 700; font-size: .9rem; color: var(--muted); }
    .pq .setting .select { width: 100%; }
    .pq aside .toggle { margin-top: 6px; }
    .pq .pq-kind { margin: 0 0 8px; }
    .pq-present { position: fixed; inset: 0; z-index: 1000; background: var(--bg); color: var(--text); overflow: auto;
      padding: clamp(16px, 2.2vw, 40px) clamp(16px, 3vw, 56px) 110px; font-family: var(--font-body); }
    .pq-present h1 { color: var(--title, var(--accent)); font-size: clamp(2rem, 4.2vw, 3.6rem); font-weight: 700; margin: 0 0 clamp(24px, 6vh, 80px); }
    .pq-present .p-q { font-size: clamp(1.35rem, 3vw, 2.6rem); line-height: 1.45; max-width: 80ch; margin-left: clamp(0px, 2.5vw, 48px); }
    .pq-present .p-q p { margin: 0 0 .9em; }
    .pq-present .p-opts { margin: 0; padding-left: 1.6em; list-style: upper-alpha; display: grid; gap: .3em; }
    .pq-present .qz-img canvas, .pq-present .qz-img svg { width: min(100%, 520px); height: auto; }
    .pq-present .p-extra { font-size: clamp(1.1rem, 2.2vw, 1.9rem); margin: clamp(16px, 4vh, 40px) 0 0 clamp(0px, 2.5vw, 48px); max-width: 60ch; }
    .pq-present .p-extra .eq-show { font-size: 1em; text-align: left; display: inline-block; padding: 8px 18px; }
    .pq-present .p-extra .ans { font-weight: 800; color: var(--answer, inherit); }
    .pq-present .vesrau { display: grid; gap: .6em; line-height: 1.4; }
    .pq-present .vesrau .ans { font-weight: 800; color: var(--answer, inherit); }
    .pq-present .vesrau .v { display: inline-block; white-space: nowrap; margin-right: 2.5em; }
    .pq-present .vesrau .v:last-child { margin-right: 0; }
    .pq-present .p-bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end;
      padding: 12px clamp(16px, 3vw, 56px); background: linear-gradient(transparent, var(--bg) 35%); }
    body.pq-presenting { overflow: hidden; }
    :root:is([data-theme="lesson"], [data-theme="pink"]) .pq .eq-show, :root:is([data-theme="lesson"], [data-theme="pink"]) .pq-present .eq-show { font-family: var(--font-body); }`;
  document.head.appendChild(css);

  // ---------- Layout: wrap the tool, and add the practice pane ----------
  const main = document.querySelector('main');
  const intro = main.querySelector('.tool-intro');
  const spec = document.getElementById('spec');
  const toolPane = document.createElement('div');
  toolPane.className = 'pq-toolpane';
  let node = intro.nextSibling;
  while (node && node !== spec) { const nx = node.nextSibling; toolPane.appendChild(node); node = nx; }
  const sw = document.createElement('div');
  sw.className = 'chip-group pq-switch';
  sw.setAttribute('aria-label', 'Show');
  sw.innerHTML = '<button class="chip" data-v="tool" aria-pressed="true">🔬 Explore</button><button class="chip" data-v="practice" aria-pressed="false">✏️ Practice questions</button>';
  const pane = document.createElement('div');
  pane.className = 'pq';
  pane.hidden = true;
  const multi = eqs.length > 1;
  const both = eqs.length > 0 && bank.length > 0;
  const presentIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px;margin-right:4px"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8"/></svg>';
  pane.innerHTML = `
    <div class="tool-layout">
      <div class="main-col">
        <div class="panel q-panel">
          <div id="pq-bank" hidden></div>
          <div id="pq-calc">
            <div id="pq-question"></div>
            <div class="pq-answer-row">
              <label class="sr-only" for="pq-answer">Your answer</label>
              <span class="pq-answer-box"><input id="pq-answer" inputmode="decimal" autocomplete="off" placeholder="Your answer"> <span class="pq-unit" id="pq-unit"></span></span>
              <button class="btn primary" id="pq-check">Check</button>
              <button class="btn" id="pq-next">Next question →</button>
            </div>
            <div class="pq-feedback" id="pq-feedback" aria-live="polite"></div>
            <div class="btn-row" style="margin-top:10px">
              <button class="btn" id="pq-show-hint">Show the equation</button>
              <button class="btn" id="pq-show-working">Show the worked answer</button>
            </div>
            <div id="pq-hint" hidden style="margin-top:10px"></div>
          </div>
          <div class="btn-row" style="margin-top:10px">
            ${eqs.length ? '<button class="btn" id="pq-print-sheet">🖨 Print worksheet</button>' : ''}
            <button class="btn" id="pq-present-open" title="Show the question on its own, ready to put on the board">${presentIcon}Presentation view</button>
          </div>
        </div>
        <div class="panel after-aside" id="pq-working" hidden></div>
      </div>
      <aside>
        <div class="panel">
          <h2>Score</h2>
          <p id="pq-score" style="margin:0"></p>
          <div class="btn-row" style="margin-top:8px"><button class="btn" id="pq-reset">Reset score</button></div>
        </div>
        <div class="panel">
          <h2>Questions</h2>
          <label class="setting">Level<select class="select" id="pq-level"><option value="all">KS3 and GCSE</option><option value="ks3">KS3</option><option value="ks4">GCSE</option></select></label>
          ${both ? '<label class="toggle"><input type="checkbox" id="pq-calcOnly"> Calculation questions only</label>' : ''}
          ${eqs.length ? `<div id="pq-calcopts">
            ${multi ? `<label class="setting" style="margin-top:8px">Equation<select class="select" id="pq-eq"><option value="any">Any of these</option>${eqs.map((e) => `<option value="${e.id}">${wordEquation(e).replace(/<[^>]+>/g, '')}</option>`).join('')}</select></label>` : `<p class="note">${wordEquation(eqs[0])}</p>`}
            <label class="toggle"><input type="checkbox" id="pq-rearrange"> Include rearranging</label>
            <label class="toggle"><input type="checkbox" id="pq-convert"> Include unit conversions</label>
            <label class="toggle"><input type="checkbox" id="pq-showEq"> Always show the equation</label>
            <label class="toggle"><input type="checkbox" id="pq-keep"> Same question, new numbers</label>
            <p class="note">Calculations within 1% are marked correct, so 3 significant figures is fine. Use g = <span id="pq-g">9.8</span> N/kg. For every equation, try <a href="${PK.root}tools/practice.html">Calculation practice</a>.</p>
          </div>` : ''}
          ${bank.length ? `<p class="note" id="pq-banknote"></p>` : ''}
        </div>
      </aside>
    </div>`;
  const present = document.createElement('div');
  present.className = 'pq-present';
  present.setAttribute('role', 'dialog'); present.setAttribute('aria-modal', 'true'); present.setAttribute('aria-label', 'Presentation view');
  present.hidden = true;
  present.innerHTML = `
    <h1 id="pq-p-title">Practice questions</h1>
    <div class="p-q" id="pq-p-q"></div>
    <div class="p-extra" id="pq-p-hint" hidden></div>
    <div class="p-extra" id="pq-p-work" hidden></div>
    <div class="p-bar">
      <button class="btn" id="pq-p-hint-btn">Show the equation</button>
      <button class="btn" id="pq-p-work-btn">Show the answer</button>
      <button class="btn primary" id="pq-p-next">Next question →</button>
      <button class="btn fs-btn" id="pq-p-fs">Full screen</button>
      <button class="btn" id="pq-p-close">✕ Exit presentation view</button>
    </div>`;
  intro.after(sw);
  sw.after(toolPane);
  toolPane.after(pane);
  document.body.appendChild(present);
  const tools = PQ.presentTools(present, present.querySelector('.p-bar'));

  // ---------- Questions ----------
  // The level: all, ks3 or ks4. KS3 also means g = 10 N/kg and KS3 equations in calculations.
  const level0 = PK.store.get('practice.level', null) || (PK.store.get('calc.ks3', false) ? 'ks3' : 'all');
  const state = {
    eqId: 'any',
    level: level0,
    ks3: level0 === 'ks3',
    calcOnly: PK.store.get('practice.calcOnly', false),
    rearrange: PK.store.get('calc.rearrange', true),
    convert: PK.store.get('calc.convert', false),
    showEq: PK.store.get('calc.showEq', false),
    keep: false,
    q: null, b: null, bres: null, tries: 0, score: PQ.loadScore(`tab.${page}`),
  };
  const list = () => (state.eqId === 'any' ? eqs : eqs.filter((e) => e.id === state.eqId));
  const bankPool = () => bank.filter((q) => QZ.fitsLevel(q, state.level));
  // Bank questions come from a shuffled deck, so every one is seen before any comes round again,
  // and none comes back until at least GAP other questions have been shown.
  const GAP = 8;
  let deck = [], shown = [];   // shown: what came up recently, newest last ('c' for a calculation)
  const recent = (id) => shown.slice(-GAP).includes(id);
  function freshBank() { return bankPool().filter((q) => !recent(q.id)); }
  function drawBank(allowRepeat) {
    const pool = allowRepeat ? bankPool() : freshBank();
    if (!pool.length) return null;
    const ok = new Set(pool.map((q) => q.id));
    deck = deck.filter((id) => ok.has(id));
    if (!deck.length) deck = QZ.shuffled([...ok], QZ.rng(Math.floor(Math.random() * 1e9)));
    const id = deck.pop();
    return bank.find((q) => q.id === id);
  }
  // The situation a calculation is set in ("Cooking oil is heated…"), so two in a row can differ
  const calcContext = (q) => (q ? String(PQ.presentationText(q)).replace(/<[^>]+>/g, ' ').replace(/[\d.,]+/g, '#').slice(0, 60) : '');
  function makeCalc(keep) {
    let q = PQ.make(list(), { ...state, keep });
    for (let i = 0; !keep && i < 6 && state.q && q && calcContext(q) === calcContext(state.q); i++) q = PQ.make(list(), { ...state, keep: null });
    return q;
  }
  // A calculation or a bank question. With both, bank questions get a share that grows with how
  // many there are (half at most), and the same bank question never comes up twice running.
  function next() {
    const canCalc = eqs.length > 0;
    const n = state.calcOnly ? 0 : bankPool().length;
    const fresh = state.calcOnly ? 0 : freshBank().length;
    const keepCalc = state.keep && state.q && !state.b;
    // Only a fresh bank question, unless the tool has nothing else to ask
    const useBank = n > 0 && (canCalc ? fresh > 0 && !keepCalc && Math.random() < Math.min(0.5, n / (n + 4)) : true);
    if (tools) tools.clear();
    if (useBank) {
      state.b = drawBank(false) || drawBank(true); state.bres = null;
      shown.push(state.b.id);
    } else {
      shown.push('c');
      state.b = null;
      state.q = canCalc ? makeCalc(keepCalc ? state.q : null) : null;
      if (el('g')) el('g').textContent = state.ks3 ? '10' : '9.8';
    }
    render();
  }
  function render() {
    const isBank = Boolean(state.b);
    el('bank').hidden = !isBank; el('calc').hidden = isBank;
    el('working').hidden = true;
    if (isBank) {
      const q = state.b;
      QZ.card(el('bank'), q, {
        seed: Math.floor(Math.random() * 1e9),
        focus: false,
        onResult: (res) => { scoreBank(res); },
        onNext: () => { next(); },
        onSkip: () => { next(); },
      });
      renderPresentation();
      return;
    }
    const q = state.q;
    state.tries = 0;
    el('feedback').innerHTML = ''; el('feedback').className = 'pq-feedback';
    el('hint').hidden = true; el('answer').value = '';
    if (!q && !eqs.length) {   // a tool with bank questions only, and none at this level
      el('calc').hidden = true; el('bank').hidden = false;
      el('bank').innerHTML = `<p class="note">There are no ${state.level === 'ks3' ? 'KS3' : 'GCSE'} questions on this tool yet. Choose <b>KS3 and GCSE</b> under Level to see them all.</p>`;
      return;
    }
    if (!q) { el('question').innerHTML = '<p class="note">No question could be made. Try again.</p>'; return; }
    el('question').innerHTML = PQ.questionHtml(q, { showEq: state.showEq });
    el('unit').textContent = PQ.unitOf(q.subject);
    el('hint').innerHTML = PQ.hintHtml(q);
    el('working').innerHTML = PQ.workingHtml(q);
    renderPresentation();
  }
  // Bank questions count once, on the first answer (self-marked ones when the student marks them)
  function scoreBank(res) {
    if (!res || res.ok === null || state.bres) return;
    state.bres = res;
    state.score.total++;
    if (res.ok) { state.score.right++; state.score.streak++; } else state.score.streak = 0;
    renderScore();
  }
  function check() {
    const q = state.q; if (!q) return;
    const v = parseNum(el('answer').value), fb = el('feedback');
    if (!isFinite(v)) { fb.className = 'pq-feedback'; fb.innerHTML = 'Type a number first. You can write standard form as 3e8 or 3 × 10^8.'; return; }
    const first = state.tries === 0; state.tries++;
    const m = PQ.mark(q, v);
    if (m.ok) {
      if (first) { state.score.right++; state.score.streak++; state.score.total++; }
      fb.className = 'pq-feedback good';
      fb.innerHTML = `✔ Correct: ${PK.sig(q.answer, 3)}${PQ.unitText(PQ.unitOf(q.subject))}.${first ? '' : ' (Second try, so it doesn’t count towards your score.)'}`;
      el('next').focus();
    } else {
      if (first) { state.score.total++; state.score.streak = 0; }
      fb.className = 'pq-feedback bad'; fb.innerHTML = `✘ ${m.tip}`;
    }
    renderScore();
  }
  function renderScore() {
    const s = state.score;
    PQ.saveScore(`tab.${page}`, s);
    el('score').innerHTML = `<b>${s.right}</b> out of <b>${s.total}</b> right first time${s.streak >= 3 ? ` · streak <b>${s.streak}</b> 🔥` : ''}`;
  }
  function renderNotes() {
    if (el('calcopts')) el('calcopts').hidden = false;
    if (!el('banknote')) return;
    const n = bankPool().length;
    el('banknote').textContent = state.calcOnly ? `${n} other question${n === 1 ? '' : 's'} on this topic are switched off.`
      : `${n} question${n === 1 ? '' : 's'} on this topic${eqs.length ? ', mixed with calculations' : ''}. Written answers have a model answer to mark yourself against.`;
  }

  // ---------- Presentation view ----------
  function renderPresentation() {
    const b = state.b, q = state.q;
    el('p-title').textContent = b ? 'Practice questions' : 'Calculation practice';
    el('p-hint-btn').hidden = Boolean(b);
    if (b) {
      let opts = '';
      if (b.type === 'mc' || b.type === 'multi') opts = `<ol class="p-opts">${b.opts.map((o) => `<li>${esc(o)}</li>`).join('')}</ol>`;
      else if (b.type === 'tf') opts = '<p>True or false?</p>';
      el('p-q').innerHTML = `<p>${esc(b.q)}</p>${QZ.imgHtml(b)}${opts}`;
      QZ.fillImgs(el('p-q'));
      el('p-work').innerHTML = `<p><b>Answer:</b> <span class="ans">${esc(QZ.answerText(b))}</span></p>${b.exp ? `<p>${esc(b.exp)}</p>` : ''}`;
      el('p-hint').hidden = true;
    } else {
      el('p-q').innerHTML = q ? PQ.presentationText(q) : '';
      el('p-hint').innerHTML = q ? `<div class="eq-show">${PQ.writtenFormula(q.eq)}</div>` : '';
      el('p-work').innerHTML = q ? PQ.vesrauHtml(q) : '';
      el('p-hint').hidden = !state.showEq;
      el('p-hint-btn').textContent = state.showEq ? 'Hide the equation' : 'Show the equation';
    }
    el('p-work').hidden = true;
    el('p-work-btn').textContent = 'Show the answer';
  }
  const presenting = () => !present.hidden;
  function setPresenting(on) {
    present.hidden = !on;
    document.body.classList.toggle('pq-presenting', on);
    if (on) { renderPresentation(); tools.fit(); el('p-next').focus(); } else { tools.close(); el('present-open').focus(); }
  }
  function togglePart(id, btn, show, hide) { const e = el(id); e.hidden = !e.hidden; el(btn).textContent = e.hidden ? show : hide; }
  el('present-open').addEventListener('click', () => setPresenting(true));
  el('p-close').addEventListener('click', () => setPresenting(false));
  el('p-next').addEventListener('click', next);
  el('p-hint-btn').addEventListener('click', () => togglePart('p-hint', 'p-hint-btn', 'Show the equation', 'Hide the equation'));
  el('p-work-btn').addEventListener('click', () => togglePart('p-work', 'p-work-btn', 'Show the answer', 'Hide the answer'));
  if (PK.fullscreenEnabled()) el('p-fs').addEventListener('click', PK.toggleFullscreen); else el('p-fs').remove();
  document.addEventListener('keydown', (e) => {
    if (!presenting() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') setPresenting(false);
    else if (['ArrowRight', 'PageDown', 'n', 'N'].includes(e.key) || (e.key === ' ' && e.target.tagName !== 'BUTTON')) { e.preventDefault(); next(); }
    else if (e.key === 'a' || e.key === 'A') togglePart('p-work', 'p-work-btn', 'Show the answer', 'Hide the answer');
    else if ((e.key === 'e' || e.key === 'E') && !state.b) togglePart('p-hint', 'p-hint-btn', 'Show the equation', 'Hide the equation');
  });

  // ---------- Controls ----------
  if (el('print-sheet')) el('print-sheet').addEventListener('click', () => PQ.worksheetDialog({ make: () => PQ.make(list(), { ...state, keep: null }), title: `${document.querySelector('h1').textContent}: practice questions` }));
  el('check').addEventListener('click', check);
  el('answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
  el('next').addEventListener('click', () => { next(); if (!state.b) el('answer').focus(); });
  el('show-hint').addEventListener('click', () => { el('hint').hidden = !el('hint').hidden; });
  el('show-working').addEventListener('click', () => {
    const w = el('working');
    if (w.hidden && state.tries === 0 && state.q) { state.score.total++; state.score.streak = 0; state.tries = 1; renderScore(); }
    w.hidden = !w.hidden;
  });
  el('reset').addEventListener('click', () => { state.score = { right: 0, total: 0, streak: 0 }; renderScore(); });
  el('level').value = state.level;
  el('level').addEventListener('change', (e) => {
    state.level = e.target.value; state.ks3 = state.level === 'ks3';
    PK.store.set('practice.level', state.level); PK.store.set('calc.ks3', state.ks3);
    deck = []; renderNotes(); next();
  });
  if (el('calcOnly')) {
    el('calcOnly').checked = state.calcOnly;
    el('calcOnly').addEventListener('change', (e) => { state.calcOnly = e.target.checked; PK.store.set('practice.calcOnly', state.calcOnly); renderNotes(); next(); });
  }
  if (multi) el('eq').addEventListener('change', (e) => { state.eqId = e.target.value; next(); });
  for (const key of ['keep', 'rearrange', 'convert', 'showEq']) {
    if (!el(key)) continue;
    el(key).checked = state[key];
    el(key).addEventListener('change', (e) => {
      state[key] = e.target.checked;
      if (key !== 'keep') PK.store.set(`calc.${key}`, state[key]);
      if (key === 'showEq') { if (!state.b) render(); } else if (key !== 'keep') { const k = state.keep; state.keep = false; next(); state.keep = k; }
    });
  }

  // ---------- Switching between the tool and the questions ----------
  let toolHash = '';
  function show(which) {
    const practice = which === 'practice';
    sw.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === which)));
    toolPane.hidden = practice; pane.hidden = !practice;
    if (practice) {
      if (location.hash !== '#practice') toolHash = location.hash;
      history.replaceState(null, '', '#practice');
      if (!state.q && !state.b) next();
    } else {
      history.replaceState(null, '', toolHash || location.pathname + location.search);
      window.dispatchEvent(new Event('resize'));   // canvases measure themselves again
    }
  }
  sw.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => show(b.dataset.v)));
  renderScore();
  renderNotes();
  if (PK.initialHash === '#practice') show('practice');
  // Share: the exact question on screen
  PK.shareQuestion = {
    get: () => (pane.hidden ? null : state.b ? { b: state.b.id } : PQ.encodeQ(state.q)),
    set: (o) => {
      if (o && o.b) { const b = bank.find((q) => q.id === o.b); if (b) { state.b = b; state.bres = null; render(); } return; }
      const q = PQ.decodeQ(o); if (q) { state.b = null; state.q = q; render(); }
    },
  };
})();
