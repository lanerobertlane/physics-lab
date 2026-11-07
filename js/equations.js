// Equation explorer: filterable cards, automatic rearranging and a calculator for each equation.

PK.header({
  title: 'Equation explorer',
  spec: [
    { code: '8463', text: 'All the equations students must recall and apply, across every topic' },
    { code: '8463', text: 'All the equations given on the Physics equation sheet, which students must be able to select and apply' },
    { code: 'WS 4', text: 'Working scientifically: using SI units, standard form, significant figures and rearranging equations' },
  ],
});

const $ = (id) => document.getElementById(id);
const TOPIC_ORDER = ['Forces', 'Energy', 'Electricity', 'Particle model', 'Waves', 'Magnetism'];

const state = {
  q: '',
  course: PK.store.get('eq.course', 'physics'),
  higher: PK.store.get('eq.higher', true),
  hide: false,
  sym: null,
  subject: {},   // eq.id -> chosen subject (undefined = as written)
  values: {},    // eq.id -> { varId: string }
  open: new Set(),
  revealed: new Set(),
};

function formulaHtml(eq) {
  const subject = state.subject[eq.id];
  if (eq.custom) return subject ? eq.forms[subject].html : eq.html;
  if (!subject && eq.html) return eq.html;
  const s = subject || eq.lhs;
  return `${Q[s].sym} = ${expression(eq, s, (id) => Q[id].sym, false)}`;
}

// ---------- Card ----------

function defaultSubject(eq) { return eq.custom ? eq.vars[0] : eq.lhs; }

function calcHtml(eq) {
  const subject = state.subject[eq.id] || defaultSubject(eq);
  const vals = state.values[eq.id] || {};
  const inputs = varsOf(eq).filter((id) => id !== subject).map((id) => `
    <label class="calc-row">
      <span>${nameOf(eq, id)}${Q[id].unit ? ` (${Q[id].unit})` : ''}</span>
      <input inputmode="decimal" autocomplete="off" data-var="${id}" value="${vals[id] || ''}" aria-label="${nameOf(eq, id)}">
    </label>`).join('');
  return `<details class="calc" ${state.open.has(eq.id) ? 'open' : ''}>
    <summary>Calculate ${nameOf(eq, subject)}</summary>
    ${inputs}
    <div class="calc-out" id="out-${eq.id}">${calcResult(eq)}</div>
  </details>`;
}

function calcResult(eq) {
  const subject = state.subject[eq.id] || defaultSubject(eq);
  const vals = state.values[eq.id] || {};
  const x = {};
  for (const id of varsOf(eq)) if (id !== subject) x[id] = parseNum(vals[id]);
  const missing = Object.values(x).some((v) => !isFinite(v));
  if (missing) return '<span class="note" style="margin:0">Fill in the other values to calculate.</span>';
  const ans = solve(eq, subject, x);
  const unit = Q[subject].unit;
  if (!isFinite(ans)) return '<span class="note" style="margin:0">No answer for these values — check them (you can’t square-root a negative number or divide by zero).</span>';
  const sub = eq.custom
    ? eq.forms[subject].sub(Object.fromEntries(Object.entries(x).map(([k, v]) => [k, numLabel(v)])))
    : expression(eq, subject, (id) => numLabel(x[id]), true);
  return `<div>${Q[subject].word ? nameOf(eq, subject) : Q[subject].sym} = ${sub}</div>
    <div class="ans">= ${PK.sig(ans, 3)}${unit ? ' ' + unit : ''}</div>`;
}

function cardHtml(eq) {
  const subject = state.subject[eq.id];
  const tags = [
    eq.po ? '<span class="tag po">Physics only</span>' : '',
    eq.ht ? '<span class="tag ht">Higher</span>' : '',
  ].join('');
  const vars = varsOf(eq).map((id) => {
    const hit = state.sym && groupOf(id) === state.sym;
    const pressed = (subject || '') === id;
    return `<button class="var-btn ${hit ? 'hit' : ''}" data-var="${id}" aria-pressed="${pressed}" title="Rearrange for ${nameOf(eq, id)}">
      <span class="vs ${Q[id].word ? 'word' : ''}">${Q[id].word ? '' : Q[id].sym}</span>
      <span>${nameOf(eq, id)}</span>
      <span class="vu">${Q[id].unit}</span>
    </button>`;
  }).join('');
  return `<article class="eq-card ${state.revealed.has(eq.id) ? 'revealed' : ''}" data-id="${eq.id}">
    <div class="tags">${tags}</div>
    <div class="eq-main ${hasWord(eq) ? 'word' : ''}">${formulaHtml(eq)}</div>
    <div class="eq-word">${wordEquation(eq)}</div>
    <div class="var-hint">Tap to rearrange</div>
    <div class="vars">${vars}</div>
    ${eq.note ? `<p class="eq-note">${eq.note}</p>` : ''}
    ${calcHtml(eq)}
  </article>`;
}

// ---------- Filtering & list ----------

const strip = (html) => html.replace(/<[^>]+>/g, '');

function visible(eq) {
  if (state.course === 'combined' && eq.po) return false;
  if (!state.higher && eq.ht) return false;
  if (state.sym && !varsOf(eq).some((id) => groupOf(id) === state.sym)) return false;
  if (state.q) {
    const hay = `${wordEquation(eq)} ${eq.topic} ${varsOf(eq).map((id) => `${strip(Q[id].sym)} ${nameOf(eq, id)}`).join(' ')} ${strip(eq.html || '')}`.toLowerCase();
    if (!state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

function renderList() {
  const shown = EQUATIONS.filter(visible);
  const html = TOPIC_ORDER.map((topic) => {
    const eqs = shown.filter((eq) => eq.topic === topic);
    if (!eqs.length) return '';
    return `<h2 class="eq-topic">${topic}</h2><div class="eq-grid">${eqs.map(cardHtml).join('')}</div>`;
  }).join('');
  $('list').innerHTML = html || '<p class="empty">No equations match.</p>';
  $('list').classList.toggle('hide-eq', state.hide);
}

function rerenderCard(id) {
  const el = document.querySelector(`.eq-card[data-id="${id}"]`);
  if (!el) return;
  el.outerHTML = cardHtml(EQUATIONS.find((e) => e.id === id));
}

function renderSymbols() {
  const groups = [];
  for (const eq of EQUATIONS) for (const id of varsOf(eq)) {
    const g = groupOf(id);
    if (!groups.includes(g)) groups.push(g);
  }
  $('symbols').innerHTML = groups.map((g) => {
    const q = Q[g];
    return `<button class="sym-chip" data-sym="${g}" aria-pressed="${state.sym === g}">${q.word ? '' : `<b>${q.sym}</b>`}${q.name}</button>`;
  }).join('');
}

// ---------- Events ----------

$('list').addEventListener('click', (e) => {
  const card = e.target.closest('.eq-card');
  if (!card) return;
  const id = card.dataset.id;

  if (e.target.closest('.eq-main') && state.hide) {
    state.revealed.add(id);
    card.classList.add('revealed');
    return;
  }
  const vb = e.target.closest('.var-btn');
  if (vb) {
    const v = vb.dataset.var;
    // Tapping the current subject again goes back to the equation as written.
    state.subject[id] = state.subject[id] === v ? undefined : v;
    rerenderCard(id);
  }
});

$('list').addEventListener('input', (e) => {
  const input = e.target.closest('input[data-var]');
  if (!input) return;
  const id = input.closest('.eq-card').dataset.id;
  (state.values[id] = state.values[id] || {})[input.dataset.var] = input.value;
  $('out-' + id).innerHTML = calcResult(EQUATIONS.find((x) => x.id === id));
});

$('list').addEventListener('toggle', (e) => {
  const d = e.target;
  if (!d.matches || !d.matches('details.calc')) return;
  const id = d.closest('.eq-card').dataset.id;
  if (d.open) state.open.add(id); else state.open.delete(id);
}, true);

$('search').addEventListener('input', (e) => { state.q = e.target.value.trim(); renderList(); });

function chipGroup(containerId, key, attr, onChange) {
  const btns = document.querySelectorAll(`#${containerId} .chip`);
  const sync = () => btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === state[key])));
  btns.forEach((b) => b.addEventListener('click', () => { state[key] = b.dataset[attr]; sync(); onChange && onChange(); renderList(); }));
  sync();
}
chipGroup('course', 'course', 'course', () => PK.store.set('eq.course', state.course));

$('higher').checked = state.higher;
$('higher').addEventListener('change', (e) => { state.higher = e.target.checked; PK.store.set('eq.higher', state.higher); renderList(); });
$('hide').addEventListener('change', (e) => { state.hide = e.target.checked; state.revealed.clear(); renderList(); });

$('symbols').addEventListener('click', (e) => {
  const b = e.target.closest('.sym-chip');
  if (!b) return;
  state.sym = state.sym === b.dataset.sym ? null : b.dataset.sym;
  renderSymbols();
  renderList();
});

renderSymbols();
renderList();
