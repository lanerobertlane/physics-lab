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
  q: null,
  tries: 0,
  score: { right: 0, total: 0, streak: 0 },
};

function pool() {
  return EQUATIONS.filter((eq) => PQ.SETUPS[eq.id]
    && !(state.course === 'combined' && eq.po)
    && !(!state.higher && eq.ht)
    && (state.topic === 'all' || eq.topic === state.topic));
}

function makeQuestion() {
  const list = state.eqId === 'any' ? pool() : EQUATIONS.filter((e) => e.id === state.eqId);
  return PQ.make(list, { rearrange: state.rearrange, convert: state.convert });
}

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
    return;
  }
  $('question').innerHTML = PQ.questionHtml(q, { showEq: state.showEq });
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

const presenting = () => !$('present').hidden;
function setPresenting(on) {
  $('present').hidden = !on;
  document.body.classList.toggle('presenting', on);
  if (on) { renderPresentation(); $('p-next').focus(); } else $('present-open').focus();
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

function next() { state.q = makeQuestion(); renderQuestion(); }

function chipGroup(containerId, key, onChange) {
  const btns = document.querySelectorAll(`#${containerId} .chip`);
  const sync = () => btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === state[key])));
  btns.forEach((b) => b.addEventListener('click', () => { state[key] = b.dataset.v; sync(); onChange(); }));
  sync();
}

chipGroup('course', 'course', () => { PK.store.set('calc.course', state.course); renderEqSelect(); next(); });
$('topic').innerHTML = '<option value="all">All topics</option>' + TOPIC_ORDER.map((t) => `<option value="${t}">${t}</option>`).join('');
$('topic').addEventListener('change', (e) => { state.topic = e.target.value; renderEqSelect(); next(); });
$('eq').addEventListener('change', (e) => { state.eqId = e.target.value; next(); });

function toggle(id, key, onChange) {
  $(id).checked = state[key];
  $(id).addEventListener('change', (e) => { state[key] = e.target.checked; PK.store.set('calc.' + key, state[key]); onChange(); });
}
toggle('higher', 'higher', () => { renderEqSelect(); next(); });
toggle('rearrange', 'rearrange', next);
toggle('convert', 'convert', next);
toggle('showEq', 'showEq', renderQuestion);

$('check').addEventListener('click', check);
$('answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
$('next').addEventListener('click', () => { next(); $('answer').focus(); });
$('show-hint').addEventListener('click', () => { $('hint').hidden = !$('hint').hidden; });
$('show-working').addEventListener('click', () => {
  const w = $('working');
  if (w.hidden && state.tries === 0 && state.q) { state.score.total++; state.score.streak = 0; state.tries = 1; renderScore(); }
  w.hidden = !w.hidden;
});
$('reset-score').addEventListener('click', () => { state.score = { right: 0, total: 0, streak: 0 }; renderScore(); });

renderEqSelect();
renderScore();
next();
