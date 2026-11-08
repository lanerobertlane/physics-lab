// Nuclear equations: complete alpha, beta and gamma decay equations for real isotopes.
// Alpha: A − 4, Z − 2 (a helium nucleus leaves). Beta: a neutron turns into a proton and a
// fast electron leaves, so A stays the same and Z + 1. Gamma: no change to A or Z.

PK.header({
  title: 'Nuclear equations',
  answers: true,
  spec: [
    { code: '4.4.1.2', text: 'Mass number, atomic number and isotopes; the notation for a nucleus' },
    { code: '4.4.2.1', text: 'An alpha particle is two neutrons and two protons; a beta particle is a high-speed electron ejected from the nucleus as a neutron turns into a proton' },
    { code: '4.4.2.2', text: 'Nuclear equations: alpha decay decreases the mass and charge of the nucleus; beta decay increases the charge but not the mass; gamma emission changes neither' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';

const SYMBOLS = ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm').split(' ');
const NAMES = ('hydrogen helium lithium beryllium boron carbon nitrogen oxygen fluorine neon sodium magnesium aluminium silicon phosphorus sulfur chlorine argon potassium calcium scandium titanium vanadium chromium manganese iron cobalt nickel copper zinc gallium germanium arsenic selenium bromine krypton rubidium strontium yttrium zirconium niobium molybdenum technetium ruthenium rhodium palladium silver cadmium indium tin antimony tellurium iodine xenon caesium barium lanthanum cerium praseodymium neodymium promethium samarium europium gadolinium terbium dysprosium holmium erbium thulium ytterbium lutetium hafnium tantalum tungsten rhenium osmium iridium platinum gold mercury thallium lead bismuth polonium astatine radon francium radium actinium thorium protactinium uranium neptunium plutonium americium curium').split(' ');
const sym = (z) => SYMBOLS[z - 1] || '?';
const isotopeName = (z) => NAMES[z - 1] || '';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// [mass number, atomic number, decay]
const ISOTOPES = [
  [238, 92, 'alpha'], [226, 88, 'alpha'], [210, 84, 'alpha'], [241, 95, 'alpha'], [222, 86, 'alpha'], [232, 90, 'alpha'], [239, 94, 'alpha'], [218, 84, 'alpha'],
  [14, 6, 'beta'], [90, 38, 'beta'], [131, 53, 'beta'], [60, 27, 'beta'], [137, 55, 'beta'], [3, 1, 'beta'], [40, 19, 'beta'], [32, 15, 'beta'], [234, 90, 'beta'], [24, 11, 'beta'],
  [99, 43, 'gamma'], [137, 56, 'gamma'], [60, 28, 'gamma'],
];
const PARTICLE = {
  alpha: { m: 4, c: 2, sym: 'He', word: 'an alpha particle', name: 'alpha' },
  beta: { m: 0, c: -1, sym: 'e', word: 'a beta particle', name: 'beta' },
  gamma: { m: 0, c: 0, sym: 'γ', word: 'a gamma ray', name: 'gamma' },
};
function daughter(q) {
  if (q.decay === 'alpha') return { A: q.A - 4, Z: q.Z - 2 };
  if (q.decay === 'beta') return { A: q.A, Z: q.Z + 1 };
  return { A: q.A, Z: q.Z };
}

const state = { mode: 'mixed', q: null, solved: false, right: 0, tried: 0, last: -1 };

function newQuestion() {
  const pool = ISOTOPES.map((v, i) => i).filter((i) => state.mode === 'mixed' || ISOTOPES[i][2] === state.mode);
  let i; do { i = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && i === state.last);
  state.last = i;
  const [A, Z, decay] = ISOTOPES[i];
  state.q = { A, Z, decay };
  state.solved = false;
  anim = null; $('replay').disabled = true;
  layout = makeNucleus(A, Z);
  render();
}

// ---------- The equation ----------

const nucl = (top, bottom, s, excited) => `<span class="nucl"><span class="ms"><span>${top}</span><span>${bottom}</span></span><span class="sym">${s}${excited ? '<sup>*</sup>' : ''}</span></span>`;
const box = (id, label) => `<input class="num" id="${id}" type="number" inputmode="numeric" aria-label="${label}">`;

function render() {
  const q = state.q, p = PARTICLE[q.decay];
  const nm = `${cap(isotopeName(q.Z))}-${q.A}`;
  $('question').innerHTML = q.decay === 'gamma'
    ? `An excited nucleus of <b>${nm}</b> gives out <b>a gamma ray</b>. Complete the equation.`
    : `<b>${nm}</b> decays by giving out <b>${p.word}</b>. Complete the equation.`;
  $('equation').innerHTML = `
    ${nucl(q.A, q.Z, sym(q.Z), q.decay === 'gamma')}
    <span class="arrow">→</span>
    <span class="nucl"><span class="ms">${box('dA', 'Mass number of the new nucleus')}${box('dZ', 'Atomic number of the new nucleus')}</span><span class="sym unknown" id="dSym">?</span></span>
    <span>+</span>
    <span class="nucl"><span class="ms">${box('pM', `Top number for ${p.word}`)}${box('pC', `Bottom number for ${p.word}`)}</span><span class="sym">${p.sym}</span></span>`;
  $('result').textContent = ''; $('result').className = 'result';
  $('el-name').textContent = '';
  $('dZ').addEventListener('input', updateSymbol);
  for (const id of ['dA', 'dZ', 'pM', 'pC']) {
    $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    $(id).addEventListener('input', () => $(id).classList.remove('ok', 'bad'));
  }
  renderScore();
  renderRules();
}

const val = (id) => { const v = $(id).value.trim(); return v === '' ? null : Number(v); };

function updateSymbol() {
  const z = val('dZ');
  const ok = Number.isInteger(z) && z >= 1 && z <= SYMBOLS.length;
  $('dSym').textContent = ok ? sym(z) : '?';
  $('dSym').classList.toggle('unknown', !ok);
  $('el-name').textContent = ok ? `Atomic number ${z} is ${isotopeName(z)} (${sym(z)}).` : '';
}

function check() {
  if (state.solved) return;
  const q = state.q, d = daughter(q), p = PARTICLE[q.decay];
  const want = { dA: d.A, dZ: d.Z, pM: p.m, pC: p.c };
  const got = Object.fromEntries(Object.keys(want).map((k) => [k, val(k)]));
  if (Object.values(got).some((v) => v === null)) { $('result').textContent = 'Fill in all four numbers first.'; $('result').className = 'result bad'; return; }
  let allRight = true;
  for (const k of Object.keys(want)) { const ok = got[k] === want[k]; $(k).classList.toggle('ok', ok); $(k).classList.toggle('bad', !ok); if (!ok) allRight = false; }
  state.tried++;
  if (allRight) {
    state.right++; state.solved = true;
    $('result').textContent = `Correct! ${cap(isotopeName(q.Z))}-${q.A} → ${cap(isotopeName(d.Z))}-${d.A}.${q.decay === 'gamma' ? ' Gamma emission doesn’t change the nucleus: it just loses energy.' : ''}`;
    $('result').className = 'result ok';
    play();
  } else {
    const hints = [];
    if (got.pM !== p.m || got.pC !== p.c) hints.push(q.decay === 'alpha' ? 'An alpha particle is 2 protons and 2 neutrons (a helium nucleus).' : q.decay === 'beta' ? 'A beta particle is an electron: mass number 0, charge −1.' : 'A gamma ray has no mass and no charge.');
    if (got.dA !== d.A && got.pM !== null) hints.push(`Top numbers must balance: ${q.A} = ? + ${got.pM}.`);
    if (got.dZ !== d.Z && got.pC !== null) hints.push(`Bottom numbers must balance: ${q.Z} = ? + ${got.pC < 0 ? `(${got.pC})` : got.pC}.`);
    $('result').textContent = `Not quite. ${hints.join(' ')}`;
    $('result').className = 'result bad';
  }
  renderScore();
}

function showMe() {
  const q = state.q, d = daughter(q), p = PARTICLE[q.decay];
  $('dA').value = d.A; $('dZ').value = d.Z; $('pM').value = p.m; $('pC').value = p.c;
  updateSymbol();
  for (const id of ['dA', 'dZ', 'pM', 'pC']) { $(id).classList.remove('bad'); $(id).classList.add('ok'); }
  state.solved = true;
  $('result').textContent = `${cap(isotopeName(q.Z))}-${q.A} → ${cap(isotopeName(d.Z))}-${d.A}.`;
  $('result').className = 'result ok';
  play();
}

function renderScore() { $('score').textContent = state.tried ? `${state.right} right out of ${state.tried} checks` : ''; }

function renderRules() {
  $('rules').innerHTML = `
    <dt>Alpha (α) decay</dt><dd>${PK.ans('Mass number goes <b>down by 4</b>, atomic number goes <b>down by 2</b>. A new element.')}</dd>
    <dt>Beta (β) decay</dt><dd>${PK.ans('A neutron turns into a proton and an electron, and the electron leaves. Mass number <b>stays the same</b>, atomic number goes <b>up by 1</b>. A new element.')}</dd>
    <dt>Gamma (γ) emission</dt><dd>${PK.ans('<b>No change</b> to the mass number or the atomic number. The nucleus just gets rid of energy.')}</dd>`;
}

// ---------- The decaying nucleus ----------

const cv = $('nuc'), ctx = cv.getContext('2d');
const W = 800, H = 300, NX = 230, NY = 145;
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }
let layout = null, anim = null;

// Pack A balls in a sunflower spiral, and choose which are protons
function makeNucleus(A, Z) {
  const b = Math.max(4, Math.min(15, 78 / Math.sqrt(A)));
  let seed = A * 97 + Z;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const balls = [];
  for (let i = 0; i < A; i++) {
    const r = b * 1.02 * Math.sqrt(i + 0.5) * 1.75 / 1.77, t = i * 2.39996;
    balls.push({ x: r * Math.cos(t), y: r * Math.sin(t), p: false, out: false, order: rand() });
  }
  [...balls].sort((u, v) => u.order - v.order).slice(0, Z).forEach((u) => { u.p = true; });
  return { b, balls, A, Z };
}

function play() {
  const q = state.q, L = layout;
  L.balls.forEach((u) => { u.out = false; u.p0 = u.p0 ?? u.p; u.p = u.p0; });
  const right = [...L.balls].sort((u, v) => v.x - u.x);
  let picks = [];
  if (q.decay === 'alpha') picks = [...right.filter((u) => u.p).slice(0, 2), ...right.filter((u) => !u.p).slice(0, 2)];
  if (q.decay === 'beta') picks = right.filter((u) => !u.p).slice(0, 1);
  anim = { t: 0, kind: q.decay, picks };
  if (q.decay === 'alpha') picks.forEach((u) => { u.out = true; });
  $('replay').disabled = false;
}

function ball(x, y, r, proton) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, proton ? '#ff8a80' : '#e0e0e0'); g.addColorStop(1, proton ? '#c62828' : '#757575');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function draw(dt) {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(0, 0, W, H);
  if (!layout) return;
  const q = state.q, L = layout, ink = PK.cssVar('--text');
  if (anim) anim.t = Math.min(4, anim.t + dt);
  const t = anim ? anim.t : 0;
  const go = anim ? Math.max(0, Math.min(1, (t - 0.4) / 1.6)) : 0;          // how far the particle has flown
  const ease = 1 - (1 - go) ** 2;
  // Shake before decaying
  const shake = anim && t < 0.4 ? Math.sin(t * 90) * 2 : 0;
  // Beta: the neutron turns into a proton at t = 0.4
  if (anim && anim.kind === 'beta' && t >= 0.4) anim.picks[0].p = true;
  for (const u of L.balls) {
    if (u.out) continue;
    ball(NX + u.x + shake, NY + u.y, L.b, u.p);
  }
  // Flying alpha particle
  if (anim && anim.kind === 'alpha') {
    const cx0 = anim.picks.reduce((s, u) => s + u.x, 0) / 4, cy0 = anim.picks.reduce((s, u) => s + u.y, 0) / 4;
    const off = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    const ax = NX + cx0 + shake + ease * (600 - NX - cx0), ay = NY + cy0 * (1 - ease);
    anim.picks.forEach((u, i) => ball(ax + off[i][0] * 7, ay + off[i][1] * 7, 8, u.p));
    if (go > 0.3) label(ax, ay + 32, 'alpha particle: 2 protons + 2 neutrons', ink);
  }
  if (anim && anim.kind === 'beta' && t >= 0.4) {
    const u = anim.picks[0], ex = NX + u.x + ease * (600 - NX - u.x), ey = NY + u.y * (1 - ease);
    ctx.fillStyle = '#1e63c6'; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `800 8px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('−', ex, ey);
    if (go > 0.3) label(ex, ey + 24, 'beta particle: a fast electron', ink);
    if (t < 2.4) label(NX + u.x, NY + u.y - L.b - 12, 'neutron → proton + electron', '#c62828');
  }
  if (anim && anim.kind === 'gamma' && t >= 0.4) {
    const x0 = NX + 95, x1 = x0 + ease * 380;
    ctx.strokeStyle = '#8e24aa'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = x0; x <= x1; x += 2) { const y = NY + Math.sin((x - x0) / 7) * 10; if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    if (go > 0.3) label((x0 + x1) / 2, NY + 34, 'gamma ray: an electromagnetic wave', ink);
  }
  // Counts under the nucleus
  const decayed = anim && t >= 0.5;
  const nowZ = decayed ? daughter(q).Z : q.Z, nowA = decayed ? daughter(q).A : q.A;
  ctx.fillStyle = ink; ctx.font = `800 15px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`${cap(isotopeName(nowZ))}-${nowA}`, NX, H - 52);
  ctx.font = `700 13px ${font()}`;
  ctx.fillStyle = '#c62828'; ctx.fillText(`${nowZ} protons`, NX - 55, H - 30);
  ctx.fillStyle = PK.cssVar('--muted'); ctx.fillText(`${nowA - nowZ} neutrons`, NX + 55, H - 30);
  // Key
  ball(W - 120, 22, 7, true); ball(W - 120, 44, 7, false);
  ctx.fillStyle = ink; ctx.font = `700 13px ${font()}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('proton', W - 106, 22); ctx.fillText('neutron', W - 106, 44);
}
function label(x, y, text, col) {
  ctx.fillStyle = col; ctx.font = `700 13px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, Math.min(W - 130, Math.max(130, x)), y);
}

// ---------- Controls ----------

document.querySelectorAll('#modes .chip').forEach((b) => b.addEventListener('click', () => {
  state.mode = b.dataset.m;
  document.querySelectorAll('#modes .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  newQuestion();
}));
$('check').addEventListener('click', check);
$('show').addEventListener('click', showMe);
$('next').addEventListener('click', newQuestion);
$('replay').addEventListener('click', play);
window.addEventListener('pk-answers', renderRules);

let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; draw(dt); requestAnimationFrame(frame); }
window.addEventListener('resize', size);
size();
newQuestion();
requestAnimationFrame(frame);
