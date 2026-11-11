// Calculation practice: random questions built from the AQA equation list.
// Each equation has a short context and ranges for a set of "free" quantities. The free
// values are chosen at random, the remaining quantity is worked out from the equation,
// then one quantity is hidden and becomes the question.

PK.header({
  title: 'Calculation practice',
  spec: [
    { code: '8463', text: 'Recall, select and apply the equations in the specification, including the Physics equation sheet' },
    { code: 'WS 4.3', text: 'Use SI units and convert between units, including prefixes such as kilo, milli and mega' },
    { code: 'MS 3', text: 'Change the subject of an equation, substitute values and solve' },
    { code: 'MS 2', text: 'Give answers to an appropriate number of significant figures' },
  ],
});

const $ = (id) => document.getElementById(id);
const TOPIC_ORDER = ['Forces', 'Energy', 'Electricity', 'Particle model', 'Waves', 'Magnetism'];

const state = {
  course: PK.store.get('calc.course', 'physics'),
  higher: PK.store.get('calc.higher', true),
  topic: 'all',
  eqId: 'any',
  rearrange: PK.store.get('calc.rearrange', true),
  convert: PK.store.get('calc.convert', false),
  showEq: PK.store.get('calc.showEq', false),
  keep: false,
  q: null,
  tries: 0,
  score: PQ.loadScore('calc'),
};

function pool() {
  return EQUATIONS.filter((eq) => PQ.SETUPS[eq.id]
    && !(state.course === 'ks3' && !PQ.KS3.includes(eq.id))
    && !(state.course === 'combined' && eq.po)
    && !(!state.higher && eq.ht)
    && (state.topic === 'all' || eq.topic === state.topic));
}

function makeQuestion(keep = state.keep) {
  const list = state.eqId === 'any' ? pool() : EQUATIONS.filter((e) => e.id === state.eqId);
  $('g').textContent = state.course === 'ks3' ? '10' : '9.8';
  return PQ.make(list, { rearrange: state.rearrange, convert: state.convert, ks3: state.course === 'ks3', keep: keep ? state.q : null });
}

// The tool (and tab) where each equation can be explored
const TOOL_FOR = {
  weight: ['weight.html', 'Weight on other planets'], momentum: ['momentum.html', 'Momentum & collisions'], impulse: ['momentum.html#safety', 'Momentum & collisions (crash safety)'], work: ['work.html', 'Work done'], 'power-w': ['work.html', 'Work done'],
  hooke: ['springs.html', 'Springs & Hooke’s law'], epe: ['springs.html', 'Springs & Hooke’s law'],
  moment: ['moments.html', 'Moments'], speed: ['speed.html', 'Speed & distance–time'], suvat: ['motion-graphs.html', 'Motion graphs'],
  accel: ['acceleration.html', 'Acceleration'], newton2: ['resultant-forces.html', 'Resultant forces'],
  ke: ['energy.html', 'Energy stores'], gpe: ['work.html#lift', 'Work done (lifting)'],
  'eff-e': ['efficiency.html', 'Efficiency'], 'eff-p': ['efficiency.html', 'Efficiency'],
  charge: ['circuits.html', 'Circuit builder'], ohm: ['circuits.html', 'Circuit builder'], 'energy-qv': ['circuits.html', 'Circuit builder'],
  'power-vi': ['mains.html#safe', 'Mains electricity (earth wire & fuse)'], 'power-i2r': ['grid.html', 'The National Grid'],
  pressure: ['solid-pressure.html', 'Pressure on solids'], liquid: ['fluid-pressure.html', 'Pressure in fluids'],
  density: ['density.html', 'Density'], wave: ['waves.html', 'Waves'], period: ['waves.html', 'Transverse & longitudinal waves'],
  shc: ['shc.html', 'Specific heat capacity'], latent: ['states.html', 'States of matter'], gas: ['gas.html', 'Gas pressure'],
  fbil: ['electromagnetism.html', 'Electromagnetism'], 'transformer-ratio': ['transformers.html', 'Transformers'], 'transformer-power': ['transformers.html', 'Transformers'],
};

// ---------- Display ----------

function renderQuestion() {
  const q = state.q;
  state.tries = 0;
  $('feedback').innerHTML = '';
  $('feedback').className = 'feedback';
  $('working').hidden = true;
  $('hint').hidden = true;
  $('answer').value = '';
  if (!q) {
    $('question').innerHTML = '<p class="note">No equations match these settings. Try another topic or turn on Higher tier.</p>';
    $('unit').textContent = '';
    $('see-tool').hidden = true;
    return;
  }
  $('question').innerHTML = PQ.questionHtml(q, { showEq: state.showEq });
  const tool = TOOL_FOR[q.eq.id];
  $('see-tool').hidden = !tool;
  if (tool) { $('see-tool').href = tool[0]; $('see-tool').title = `Open ${tool[1]}`; }
  $('unit').textContent = PQ.unitOf(q.subject);
  $('hint').innerHTML = PQ.hintHtml(q);
  $('working').innerHTML = PQ.workingHtml(q);
  renderPresentation();
}

// ---------- Presentation view ----------

function renderPresentation() {
  const q = state.q;
  $('p-q').innerHTML = q ? PQ.presentationText(q) : '<p>No equations match these settings.</p>';
  $('p-hint').innerHTML = q ? `<div class="eq-show">${PQ.writtenFormula(q.eq)}</div>` : '';
  $('p-work').innerHTML = q ? PQ.vesrauHtml(q) : '';
  $('p-hint').hidden = !state.showEq;
  $('p-work').hidden = true;
  $('p-hint-btn').textContent = state.showEq ? 'Hide the equation' : 'Show the equation';
  $('p-work-btn').textContent = 'Show the answer';
}

const tools = PQ.presentTools($('present'), $('present').querySelector('.p-bar'));
const presenting = () => !$('present').hidden;
function setPresenting(on) {
  $('present').hidden = !on;
  document.body.classList.toggle('presenting', on);
  if (on) { renderPresentation(); tools.fit(); $('p-next').focus(); } else { tools.close(); $('present-open').focus(); }
}
function togglePart(id, btn, show, hide) {
  const el = $(id);
  el.hidden = !el.hidden;
  $(btn).textContent = el.hidden ? show : hide;
}
$('present-open').addEventListener('click', () => setPresenting(true));
$('p-close').addEventListener('click', () => setPresenting(false));
$('p-next').addEventListener('click', () => next());
$('p-hint-btn').addEventListener('click', () => togglePart('p-hint', 'p-hint-btn', 'Show the equation', 'Hide the equation'));
$('p-work-btn').addEventListener('click', () => togglePart('p-work', 'p-work-btn', 'Show the answer', 'Hide the answer'));
if (PK.fullscreenEnabled()) $('p-fs').addEventListener('click', PK.toggleFullscreen); else $('p-fs').remove();
// Keyboard (and presentation clickers, which send arrow keys / Page Down)
document.addEventListener('keydown', (e) => {
  if (!presenting() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape') setPresenting(false);
  else if (['ArrowRight', 'PageDown', 'n', 'N'].includes(e.key) || (e.key === ' ' && e.target.tagName !== 'BUTTON')) { e.preventDefault(); next(); }
  else if (e.key === 'a' || e.key === 'A') togglePart('p-work', 'p-work-btn', 'Show the answer', 'Hide the answer');
  else if (e.key === 'e' || e.key === 'E') togglePart('p-hint', 'p-hint-btn', 'Show the equation', 'Hide the equation');
});

// ---------- Checking ----------

function check() {
  const q = state.q;
  if (!q) return;
  const v = parseNum($('answer').value);
  const fb = $('feedback');
  if (!isFinite(v)) { fb.className = 'feedback'; fb.innerHTML = 'Type a number first. You can write standard form as 3e8 or 3 × 10^8.'; return; }
  const first = state.tries === 0;
  state.tries++;
  const m = PQ.mark(q, v);
  if (m.ok) {
    if (first) { state.score.right++; state.score.streak++; state.score.total++; }
    fb.className = 'feedback good';
    fb.innerHTML = `✔ Correct: ${PK.sig(q.answer, 3)}${PQ.unitText(PQ.unitOf(q.subject))}.${first ? '' : ' (Second try, so it doesn’t count towards your score.)'}`;
    $('next').focus();
  } else {
    if (first) { state.score.total++; state.score.streak = 0; }
    fb.className = 'feedback bad';
    fb.innerHTML = `✘ ${m.tip}`;
  }
  renderScore();
}

function renderScore() {
  const s = state.score;
  PQ.saveScore('calc', s);
  $('score').innerHTML = `<b>${s.right}</b> out of <b>${s.total}</b> right first time${s.streak >= 3 ? ` · streak <b>${s.streak}</b> 🔥` : ''}`;
}

// ---------- Settings ----------

function renderEqSelect() {
  const list = pool();
  const opts = ['<option value="any">Any equation</option>'].concat(TOPIC_ORDER.map((topic) => {
    const eqs = list.filter((e) => e.topic === topic);
    if (!eqs.length) return '';
    return `<optgroup label="${topic}">${eqs.map((e) => `<option value="${e.id}">${wordEquation(e).replace(/<[^>]+>/g, '')}</option>`).join('')}</optgroup>`;
  }));
  $('eq').innerHTML = opts.join('');
  if (state.eqId !== 'any' && !list.some((e) => e.id === state.eqId)) state.eqId = 'any';
  $('eq').value = state.eqId;
}

function next() { state.q = makeQuestion(); renderQuestion(); tools.clear(); }
// A change of settings starts afresh, even when keeping the context
function fresh() { const k = state.keep; state.keep = false; next(); state.keep = k; }

function chipGroup(containerId, key, onChange) {
  const btns = document.querySelectorAll(`#${containerId} .chip`);
  const sync = () => btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === state[key])));
  btns.forEach((b) => b.addEventListener('click', () => { state[key] = b.dataset.v; sync(); onChange(); }));
  sync();
}

chipGroup('course', 'course', () => { PK.store.set('calc.course', state.course); renderEqSelect(); fresh(); });
$('topic').innerHTML = '<option value="all">All topics</option>' + TOPIC_ORDER.map((t) => `<option value="${t}">${t}</option>`).join('');
$('topic').addEventListener('change', (e) => { state.topic = e.target.value; renderEqSelect(); fresh(); });
$('eq').addEventListener('change', (e) => { state.eqId = e.target.value; fresh(); });

function toggle(id, key, onChange) {
  $(id).checked = state[key];
  $(id).addEventListener('change', (e) => { state[key] = e.target.checked; PK.store.set('calc.' + key, state[key]); onChange(); });
}
toggle('higher', 'higher', () => { renderEqSelect(); fresh(); });
toggle('rearrange', 'rearrange', fresh);
toggle('convert', 'convert', fresh);
toggle('showEq', 'showEq', renderQuestion);
$('keep').addEventListener('change', (e) => { state.keep = e.target.checked; });

$('check').addEventListener('click', check);
$('answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
$('next').addEventListener('click', () => { next(); $('answer').focus(); });
$('show-hint').addEventListener('click', () => { $('hint').hidden = !$('hint').hidden; });
$('show-working').addEventListener('click', () => {
  const w = $('working');
  if (w.hidden && state.tries === 0 && state.q) { state.score.total++; state.score.streak = 0; state.tries = 1; renderScore(); }
  w.hidden = !w.hidden;
});
$('print-sheet').addEventListener('click', () => PQ.worksheetDialog({ make: () => makeQuestion(false), title: 'Calculation practice' }));
$('reset-score').addEventListener('click', () => { state.score = { right: 0, total: 0, streak: 0 }; renderScore(); });

renderEqSelect();
renderScore();
next();
// Share: the exact question on screen, so a QR code on the board opens the same one
PK.shareQuestion = {
  get: () => PQ.encodeQ(state.q),
  set: (o) => { const q = PQ.decodeQ(o); if (q) { state.q = q; renderQuestion(); } },
};
