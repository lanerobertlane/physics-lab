// Atom builder: protons, neutrons and electrons → element, mass number, isotope and ion.
// Electrons fill shells 2, 8, 8, then the rest (as used at GCSE for the first 20 elements).

PK.header({
  title: 'Atom builder',
  answers: true,
  spec: [
    { code: '4.4.1.1', text: 'The structure of an atom: a tiny positive nucleus of protons and neutrons, with electrons in energy levels; electrons move between levels by absorbing or emitting EM radiation' },
    { code: '4.4.1.2', text: 'Mass number, atomic number and isotopes; atoms losing or gaining electrons become ions' },
    { code: 'KS3', text: 'A simple (Dalton) atomic model; differences between atoms, elements and compounds' },
  ],
});

const $ = (id) => document.getElementById(id);
const ELEMENTS = [
  ['H', 'Hydrogen'], ['He', 'Helium'], ['Li', 'Lithium'], ['Be', 'Beryllium'], ['B', 'Boron'], ['C', 'Carbon'],
  ['N', 'Nitrogen'], ['O', 'Oxygen'], ['F', 'Fluorine'], ['Ne', 'Neon'], ['Na', 'Sodium'], ['Mg', 'Magnesium'],
  ['Al', 'Aluminium'], ['Si', 'Silicon'], ['P', 'Phosphorus'], ['S', 'Sulfur'], ['Cl', 'Chlorine'], ['Ar', 'Argon'],
  ['K', 'Potassium'], ['Ca', 'Calcium'],
];
// Neutrons in the most common isotope, so "normal" atoms can be recognised.
const COMMON_N = [0, 2, 4, 5, 6, 6, 7, 8, 10, 10, 12, 12, 14, 14, 16, 16, 18, 22, 20, 20];

const LIMITS = { p: [0, 20], n: [0, 30], e: [0, 24] };
const state = { p: 6, n: 6, e: 6, excited: null };
const SHELL_CAP = [2, 8, 8, 8];
const SHELL_R = [92, 136, 180, 224];

const PRESETS = [
  ['Choose an example…', null],
  ['Hydrogen atom', [1, 0, 1]], ['Deuterium (hydrogen-2)', [1, 1, 1]], ['Tritium (hydrogen-3)', [1, 2, 1]],
  ['Helium atom', [2, 2, 2]], ['Alpha particle (helium nucleus)', [2, 2, 0]],
  ['Carbon-12', [6, 6, 6]], ['Carbon-14 (radioactive)', [6, 8, 6]],
  ['Oxygen ion O²⁻', [8, 8, 10]], ['Sodium atom', [11, 12, 11]], ['Sodium ion Na⁺', [11, 12, 10]],
  ['Chlorine-35', [17, 18, 17]], ['Chlorine-37', [17, 20, 17]], ['Calcium atom', [20, 20, 20]],
];

// ---------- Panel ----------

const SUP = { '-': '⁻', '+': '⁺', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (s) => String(s).split('').map((ch) => SUP[ch] ?? ch).join('');

function shells(e) {
  const out = [];
  let left = e;
  for (const cap of SHELL_CAP) { const k = Math.min(cap, left); out.push(k); left -= k; }
  if (left > 0) out[out.length - 1] += left;
  while (out.length && out[out.length - 1] === 0) out.pop();
  return out;
}

function render() {
  const { p, n, e } = state;
  const el = p > 0 ? ELEMENTS[p - 1] : null;
  const charge = p - e;
  const chargeTxt = charge === 0 ? '' : `${Math.abs(charge) === 1 ? '' : Math.abs(charge)}${charge > 0 ? '+' : '−'}`;
  $('name').innerHTML = el ? PK.ans(`${el[1]}${p ? `-${p + n}` : ''}`) : 'No protons: not an element';
  $('notation').innerHTML = el
    ? PK.ans(`<span class="nums"><span>${p + n}</span><span>${p}</span></span><span class="sym">${el[0]}</span><span class="chg">${chargeTxt}</span>`)
    : '';
  const kind = !el ? '—'
    : charge === 0 ? 'neutral atom'
      : charge > 0 ? `positive ion (lost ${charge} electron${charge > 1 ? 's' : ''})`
        : `negative ion (gained ${-charge} electron${charge < -1 ? 's' : ''})`;
  const iso = !el ? '' : n === COMMON_N[p - 1] ? 'the most common isotope' : `an isotope of ${el[1].toLowerCase()} (usually ${COMMON_N[p - 1]} neutrons)`;
  const sh = shells(e);
  $('readout').innerHTML = `
    <dt>Atomic number (Z)</dt><dd>${PK.ans(p)}</dd>
    <dt>Mass number (A)</dt><dd>${PK.ans(p + n)}</dd>
    <dt>Charge</dt><dd>${PK.ans(charge === 0 ? '0' : (charge > 0 ? '+' : '−') + Math.abs(charge))}</dd>
    <dt>Type</dt><dd>${PK.ans(kind)}</dd>
    ${el ? `<dt>Isotope</dt><dd>${PK.ans(iso)}</dd>` : ''}
    <dt>Electron shells</dt><dd>${PK.ans(sh.length ? sh.join(', ') : '—')}</dd>`;
  for (const k of ['p', 'n', 'e']) $(`${k}-val`).textContent = state[k];
}

const PARTS = [
  ['p', 'Protons', '#e2483d'],
  ['n', 'Neutrons', '#8d939c'],
  ['e', 'Electrons', '#2f7fe0'],
];
$('parts').innerHTML = PARTS.map(([k, label, col]) => `
  <div class="part"><span class="dot" style="background:${col}"></span><b>${label}</b>
    <div class="stepper"><button data-k="${k}" data-d="-1" aria-label="Remove ${label}">−</button><output id="${k}-val"></output><button data-k="${k}" data-d="1" aria-label="Add ${label}">+</button></div>
  </div>`).join('');
function changeParticle(k, by) {
  state[k] = Math.max(LIMITS[k][0], Math.min(LIMITS[k][1], state[k] + by));
  state.excited = null;
  $('preset').value = '0';
  layoutNucleus();
  render();
  saveHash();
}
$('parts').addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-k]');
  if (b) changeParticle(b.dataset.k, Number(b.dataset.d));
});

$('preset').innerHTML = PRESETS.map(([name], i) => `<option value="${i}">${name}</option>`).join('');
$('preset').addEventListener('change', (ev) => {
  const v = PRESETS[Number(ev.target.value)][1];
  if (!v) return;
  [state.p, state.n, state.e] = v;
  state.excited = null;
  layoutNucleus();
  render();
  saveHash();
});

// ---------- Drawing ----------

const canvas = $('atom'), ctx = canvas.getContext('2d');
const W = 800, H = 520, CX = 400, CY = 260;
const TRAY_X = 75, TRAY = [{ k: 'p', name: 'proton', sym: '+', col: '#e2483d', y: 180 }, { k: 'n', name: 'neutron', sym: '', col: '#8d939c', y: 260 }, { k: 'e', name: 'electron', sym: '−', col: '#2f7fe0', y: 340 }];
let carried = null, drawnElectrons = [];
let nucleus = [];

// Pack protons and neutrons in a sunflower spiral, mixed together.
function layoutNucleus() {
  const total = state.p + state.n;
  const types = [];
  let placedP = 0;
  for (let i = 0; i < total; i++) {
    // Spread protons evenly through the nucleus.
    if (placedP < Math.round(((i + 1) * state.p) / total)) { types.push('p'); placedP++; } else types.push('n');
  }
  nucleus = types.map((t, i) => {
    const r = 8.5 * Math.sqrt(i + 0.5), a = i * 2.39996;
    return { t, x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
}

let photon = null;   // { phase: 'in' | 'out', t, from, to, shell }
$('light').addEventListener('click', () => {
  const sh = shells(state.e);
  if (!sh.length || photon) return;
  photon = { phase: 'in', t: 0, shell: sh.length - 1 };
});

let spin = 0, last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  spin += dt * 0.25;
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--border-strong'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface;
  ctx.fillRect(0, 0, W, H);

  const sh = shells(state.e);
  // Photon animation: in → electron jumps up a level → drops back → photon out
  let jump = null;
  if (photon) {
    photon.t += dt;
    if (photon.phase === 'in' && photon.t > 1) { photon.phase = 'excited'; photon.t = 0; }
    else if (photon.phase === 'excited' && photon.t > 1.2) { photon.phase = 'out'; photon.t = 0; }
    else if (photon.phase === 'out' && photon.t > 1) photon = null;
    if (photon && photon.phase === 'excited') jump = photon.shell;
  }

  const shellCount = Math.max(sh.length, jump != null ? jump + 2 : 0);
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
  for (let s = 0; s < Math.min(4, Math.max(shellCount, sh.length)); s++) { ctx.beginPath(); ctx.arc(CX, CY, SHELL_R[s], 0, Math.PI * 2); ctx.stroke(); }
  if (jump != null && jump + 1 < 4) { ctx.beginPath(); ctx.arc(CX, CY, SHELL_R[jump + 1], 0, Math.PI * 2); ctx.stroke(); }
  ctx.setLineDash([]);

  // Nucleus
  for (const b of nucleus) {
    ctx.fillStyle = b.t === 'p' ? '#e2483d' : '#8d939c';
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(CX + b.x, CY + b.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (nucleus.length <= 12) {
      ctx.fillStyle = '#fff'; ctx.font = `800 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.t === 'p' ? '+' : '', CX + b.x, CY + b.y + 0.5);
    }
  }

  // Electrons
  drawnElectrons = [];
  sh.forEach((count, s) => {
    for (let i = 0; i < count; i++) {
      let ring = s;
      if (jump === s && i === count - 1) ring = Math.min(3, s + 1);
      const r = SHELL_R[ring];
      const a = spin * (1 - ring * 0.18) + (i / count) * Math.PI * 2 + s * 0.4;
      ctx.fillStyle = '#2f7fe0';
      ctx.beginPath(); ctx.arc(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `800 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('−', CX + Math.cos(a) * r, CY + Math.sin(a) * r);
      drawnElectrons.push({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r });
    }
  });

  // Tray of particles to drag on
  ctx.fillStyle = c.muted; ctx.font = `700 15px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Drag on', TRAY_X, TRAY[0].y - 42);
  for (const t of TRAY) {
    ctx.fillStyle = t.col; ctx.beginPath(); ctx.arc(TRAY_X, t.y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `800 18px ${c.font}`; ctx.fillText(t.sym, TRAY_X, t.y + 1);
    ctx.fillStyle = c.text; ctx.font = `700 14px ${c.font}`; ctx.fillText(t.name, TRAY_X, t.y + 29);
  }
  ctx.fillStyle = c.muted; ctx.font = `700 15px ${c.font}`; ctx.fillText('Drag one out', TRAY_X, TRAY[2].y + 62); ctx.fillText('to remove it', TRAY_X, TRAY[2].y + 80);
  if (carried && carried.moved) {
    const t = TRAY.find((q) => q.k === carried.k);
    ctx.fillStyle = t.col; ctx.beginPath(); ctx.arc(carried.x, carried.y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `800 16px ${c.font}`; ctx.fillText(t.sym, carried.x, carried.y + 1);
  }

  // Photon (wavy arrow)
  if (photon && photon.phase !== 'excited') {
    const inward = photon.phase === 'in';
    const f = Math.min(1, photon.t);
    const x0 = inward ? 30 : CX + SHELL_R[photon.shell] * 0.7, y0 = inward ? 60 : CY - SHELL_R[photon.shell] * 0.7;
    const x1 = inward ? CX - SHELL_R[photon.shell] * 0.7 : 770, y1 = inward ? CY - SHELL_R[photon.shell] * 0.7 : 60;
    const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    const end = f * len, start = Math.max(0, end - 160);
    ctx.strokeStyle = '#f2a900'; ctx.lineWidth = 3; ctx.beginPath();
    for (let d = start; d <= end; d += 2) {
      const w = Math.sin(d / 6) * 7;
      const x = x0 + ux * d - uy * w, y = y0 + uy * d + ux * w;
      d === start ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const msg = !photon ? 'Not to scale: the radius of the real nucleus is less than 1/10 000 of the radius of the atom.'
    : photon.phase === 'in' ? 'Light (electromagnetic radiation) arrives…'
      : photon.phase === 'excited' ? 'The electron absorbed the energy and moved to a higher energy level.'
        : 'It drops back down and gives out the energy as electromagnetic radiation.';
  ctx.fillText(msg, 16, 12);
  requestAnimationFrame(frame);
}

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

function saveHash() { history.replaceState(null, '', `#p=${state.p}&n=${state.n}&e=${state.e}`); }
function loadHash() {
  const q = new URLSearchParams(location.hash.slice(1));
  for (const k of ['p', 'n', 'e']) {
    const v = Number(q.get(k));
    if (q.has(k) && v >= LIMITS[k][0] && v <= LIMITS[k][1]) state[k] = v;
  }
}

// Particles: drag one from the tray into the atom, or drag one out of the atom (a tap on the tray adds one too)
PK.dragOn(canvas, W, H, {
  hit: (p) => {
    const t = TRAY.find((q) => Math.hypot(p.x - TRAY_X, p.y - q.y) < 30);
    if (t) return { from: 'tray', k: t.k };
    const b = nucleus.find((q) => Math.hypot(p.x - (CX + q.x), p.y - (CY + q.y)) < 11);
    if (b) return { from: 'atom', k: b.t };
    return drawnElectrons.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 22) ? { from: 'atom', k: 'e' } : null;
  },
  move: (d, p) => { carried = Object.assign(d, { x: p.x, y: p.y, moved: true }); },
  end: (d) => {
    carried = null;
    const inside = Math.hypot(d.x - CX, d.y - CY) < 245;
    if (d.from === 'tray' && inside) changeParticle(d.k, 1);
    if (d.from === 'atom' && !inside) changeParticle(d.k, -1);
  },
  tap: (d) => { if (d.from === 'tray') changeParticle(d.k, 1); },
});

window.addEventListener('resize', sizeCanvas);
loadHash();
sizeCanvas();
layoutNucleus();
render();
requestAnimationFrame(frame);
