// Electrolysis: ions moving to the electrodes in molten compounds and in solutions (with
// predictions and gas tests), and the extraction of aluminium.

PK.header({
  title: 'Electrolysis',
  answers: true,
  specNote: 'AQA references are to GCSE Chemistry (8462); Combined Science (8464) covers the same content.',
  spec: [
    { code: '4.4.3.1', text: 'When an ionic compound is melted or dissolved, the ions are free to move and it conducts (an electrolyte). Positive ions move to the cathode (negative electrode) and negative ions to the anode (positive electrode)' },
    { code: '4.4.3.2', text: 'Electrolysis of molten ionic compounds: the metal forms at the cathode and the non-metal at the anode' },
    { code: '4.4.3.3', text: 'Extracting aluminium by electrolysis of aluminium oxide mixed with cryolite, using carbon anodes that have to be replaced' },
    { code: '4.4.3.4', text: 'Electrolysis of aqueous solutions: hydrogen at the cathode if the metal is more reactive than hydrogen; oxygen at the anode unless halide ions are present, when the halogen is produced' },
    { code: '4.4.3.4', text: 'Required practical: investigate what happens when aqueous solutions are electrolysed using inert electrodes' },
    { code: '4.4.3.5', text: 'Represent the reactions at the electrodes as half equations', ht: true },
    { code: '4.8.2', text: 'Tests for hydrogen (a squeaky pop), oxygen (relights a glowing splint) and chlorine (bleaches damp litmus paper)' },
  ],
});

const $ = (id) => document.getElementById(id);
const scene = $('scene'), ctx = scene.getContext('2d');
const SW = 560, SH = 380, POS = '#d84315', NEG = '#1565c0', WATER = '#78909c';
const CAT_X = 210, AN_X = 350;
const state = { tab: 'molten', power: false };

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), art: PK.cssVar('--art'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = c.surface; ctx.strokeText(text, x, y);
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}

// ---------- The compounds ----------

const MOLTEN = {
  pbbr2: { name: 'lead(II) bromide', pos: 'Pb²⁺', neg: 'Br⁻', nNeg: 2, cat: 'lead', an: 'bromine', mp: 373, metal: '#8a929c', gas: 'rgba(160, 82, 45, .5)', half: ['Pb²⁺ + 2e⁻ → Pb', '2Br⁻ → Br₂ + 2e⁻'] },
  zncl2: { name: 'zinc chloride', pos: 'Zn²⁺', neg: 'Cl⁻', nNeg: 2, cat: 'zinc', an: 'chlorine', mp: 290, metal: '#a5aeb8', gas: 'rgba(197, 225, 165, .6)', half: ['Zn²⁺ + 2e⁻ → Zn', '2Cl⁻ → Cl₂ + 2e⁻'] },
  nacl: { name: 'sodium chloride', pos: 'Na⁺', neg: 'Cl⁻', nNeg: 1, cat: 'sodium', an: 'chlorine', mp: 801, metal: '#cfd8dc', gas: 'rgba(197, 225, 165, .6)', half: ['Na⁺ + e⁻ → Na', '2Cl⁻ → Cl₂ + 2e⁻'] },
};
const SOLN = {
  cucl2: { name: 'copper(II) chloride', pos: 'Cu²⁺', neg: 'Cl⁻', nPos: 10, nNeg: 20, cat: 'copper', an: 'chlorine', half: ['Cu²⁺ + 2e⁻ → Cu', '2Cl⁻ → Cl₂ + 2e⁻'],
    left: 'Copper and chlorine are both taken out, so the solution slowly loses its blue colour. Water is left.',
    left: 'Na⁺ and OH⁻ ions are left in the solution: it slowly turns into sodium hydroxide solution.',
    why: ['Copper is less reactive than hydrogen, so copper is produced.', 'There are chloride (halide) ions, so chlorine is produced.'] },
  nacl: { name: 'sodium chloride', pos: 'Na⁺', neg: 'Cl⁻', nPos: 12, nNeg: 12, cat: 'hydrogen', an: 'chlorine', half: ['2H⁺ + 2e⁻ → H₂', '2Cl⁻ → Cl₂ + 2e⁻'],
    why: ['Sodium is more reactive than hydrogen, so hydrogen is produced instead.', 'There are chloride (halide) ions, so chlorine is produced.'] },
  cuso4: { name: 'copper(II) sulfate', pos: 'Cu²⁺', neg: 'SO₄²⁻', nPos: 12, nNeg: 12, cat: 'copper', an: 'oxygen', half: ['Cu²⁺ + 2e⁻ → Cu', '4OH⁻ → O₂ + 2H₂O + 4e⁻'],
    left: 'H⁺ and SO₄²⁻ ions are left in the solution: it slowly turns into sulfuric acid, and loses its blue colour.',
    why: ['Copper is less reactive than hydrogen, so copper is produced.', 'There are no halide ions, so oxygen is produced from the hydroxide ions.'] },
  na2so4: { name: 'sodium sulfate', pos: 'Na⁺', neg: 'SO₄²⁻', nPos: 14, nNeg: 7, cat: 'hydrogen', an: 'oxygen', half: ['2H⁺ + 2e⁻ → H₂', '4OH⁻ → O₂ + 2H₂O + 4e⁻'],
    left: 'Na⁺ and SO₄²⁻ ions stay in the solution. Only the water is split up, into hydrogen and oxygen.',
    why: ['Sodium is more reactive than hydrogen, so hydrogen is produced instead.', 'There are no halide ions, so oxygen is produced from the hydroxide ions.'] },
  kbr: { name: 'potassium bromide', pos: 'K⁺', neg: 'Br⁻', nPos: 12, nNeg: 12, cat: 'hydrogen', an: 'bromine', half: ['2H⁺ + 2e⁻ → H₂', '2Br⁻ → Br₂ + 2e⁻'],
    left: 'K⁺ and OH⁻ ions are left in the solution: it slowly turns into potassium hydroxide solution.',
    why: ['Potassium is more reactive than hydrogen, so hydrogen is produced instead.', 'There are bromide (halide) ions, so bromine is produced.'] },
};
const GASES = ['hydrogen', 'oxygen', 'chlorine'];

// ---------- Ions ----------

const sim = { ions: [], heat: 0, heating: false, made: { cat: 0, an: 0 }, busy: { cat: 0, an: 0 }, supply: { cat: 1, an: 1 }, bubbles: [], flashes: [], test: null, anodeWear: 0, al: 0,
  target: {}, events: [], cool: { split: 0, join: 0, inflow: 0 } };
// In a solution: how many H⁺ and OH⁻ ions, and water molecules, to show
const H_N = 8, WATER_N = 8;
const box = () => (state.tab === 'molten' ? { l: 150, r: 410, t: 205, b: 325 } : state.tab === 'solution' ? { l: 116, r: 444, t: 180, b: 336 } : { l: 92, r: 468, t: 186, b: 296 });
const molten = () => MOLTEN[$('mcomp').value];
const soln = () => SOLN[$('scomp').value];
function makeIon(kind, label, x, y) { return { kind, label, x, y, vx: 0, vy: 0, hx: x, hy: y }; }
function buildIons() {
  const b = box(), out = [], rnd = (k, l) => out.push(makeIon(k, l, b.l + 14 + Math.random() * (b.r - b.l - 28), b.t + 12 + Math.random() * (b.b - b.t - 24)));
  if (state.tab === 'molten') {
    // Start as a solid lattice: ions in a grid, alternating
    const m = molten(), cols = 10, rows = m.nNeg === 2 ? 4 : 3;
    let k = 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = b.l + 20 + i * ((b.r - b.l - 40) / (cols - 1)), y = b.b - 16 - j * 24;
      const pos = m.nNeg === 2 ? k % 3 === 0 : (i + j) % 2 === 0;
      out.push(makeIon(pos ? 'pos' : 'neg', pos ? m.pos : m.neg, x, y)); k++;
    }
  } else if (state.tab === 'solution') {
    const s = soln();
    for (let i = 0; i < s.nPos; i++) rnd('pos', s.pos);
    for (let i = 0; i < s.nNeg; i++) rnd('neg', s.neg);
    for (let i = 0; i < H_N; i++) { rnd('h', 'H⁺'); rnd('oh', 'OH⁻'); }
    for (let i = 0; i < WATER_N; i++) rnd('w', 'H₂O');
    sim.target = { pos: s.nPos, neg: s.nNeg, w: WATER_N };
  } else {
    for (let i = 0; i < 10; i++) rnd('pos', 'Al³⁺');
    for (let i = 0; i < 15; i++) rnd('neg', 'O²⁻');
  }
  sim.ions = out;
  // How many ions there are to be discharged at each electrode, for how full the tubes get
  sim.supply = { cat: Math.max(1, out.filter((i) => discharges(i) === 'cat').length), an: Math.max(1, out.filter((i) => discharges(i) === 'an').length) };
}
const mobile = () => (state.tab === 'molten' ? sim.heat >= 1 : true);
// Which ion is discharged at each electrode
function discharges(ion) {
  if (state.tab === 'molten' || state.tab === 'alu') return ion.kind === 'pos' ? 'cat' : ion.kind === 'neg' ? 'an' : null;
  const s = soln();
  if (ion.kind === 'pos' && s.cat !== 'hydrogen') return 'cat';
  if (ion.kind === 'h' && s.cat === 'hydrogen') return 'cat';
  if (ion.kind === 'neg' && s.an !== 'oxygen') return 'an';
  if (ion.kind === 'oh' && s.an === 'oxygen') return 'an';
  return null;
}
const electrodes = () => (state.tab === 'alu' ? { cat: null, an: [150, 280, 410] } : { cat: CAT_X, an: [AN_X] });
function stepIons(dt) {
  const b = box(), on = state.power && mobile(), e = electrodes();
  for (const ion of sim.ions) {
    if (!mobile()) { ion.x += (ion.hx + (Math.random() - 0.5) * 2 - ion.x) * 0.3; ion.y += (ion.hy + (Math.random() - 0.5) * 2 - ion.y) * 0.3; continue; }
    // Random jostling, plus a drift towards the oppositely charged electrode when the power is on
    ion.vx += (Math.random() - 0.5) * 300 * dt; ion.vy += (Math.random() - 0.5) * 300 * dt;
    ion.vx *= 0.9; ion.vy *= 0.9;
    if (ion.a !== undefined && !ion.leaving) ion.a = Math.min(1, ion.a + dt / 0.8);
    if (ion.leaving) { ion.vx += (ion.x < (b.l + b.r) / 2 ? -80 : 80) * dt; ion.a -= dt / 1.2; if (ion.a <= 0) ion.gone = true; }
    if (on && ion.kind !== 'w' && !ion.leaving) {
      const toward = ion.kind === 'pos' || ion.kind === 'h';
      if (state.tab === 'alu') { if (toward) ion.vy += 60 * dt; else { const ax = e.an.reduce((a, x) => (Math.abs(x - ion.x) < Math.abs(a - ion.x) ? x : a)); ion.vx += Math.sign(ax - ion.x) * 60 * dt; ion.vy -= 40 * dt; } }
      else ion.vx += (toward ? Math.sign(e.cat - ion.x) : Math.sign(e.an[0] - ion.x)) * 50 * dt;
    }
    ion.x += ion.vx * dt; ion.y += ion.vy * dt;
    ion.x = Math.max(b.l + 9, Math.min(b.r - 9, ion.x)); ion.y = Math.max(b.t + 9, Math.min(b.b - 9, ion.y));
    if (!on || ion.kind === 'w' || ion.leaving) continue;
    // Arriving at an electrode
    const where = discharges(ion);
    let at = null;
    if (state.tab === 'alu') {
      if (ion.kind === 'pos' && ion.y > b.b - 14) at = 'cat';
      if (ion.kind === 'neg' && ion.y < b.t + 50 && e.an.some((x) => Math.abs(x - ion.x) < 34)) at = 'an';
    } else {
      if (Math.abs(ion.x - e.cat) < 14) at = 'cat';
      if (Math.abs(ion.x - e.an[0]) < 14) at = 'an';
    }
    // Ions attracted to an electrode but not discharged there crowd round it, but stay off it (and out
    // of its tube). Ions on their way to the other electrode can pass by.
    if (state.tab !== 'alu') {
      const pulled = ion.kind === 'pos' || ion.kind === 'h' ? 'cat' : 'an', ex = pulled === 'cat' ? e.cat : e.an[0];
      if (pulled !== where && Math.abs(ion.x - ex) < 26) { ion.x = ex + (ion.x < ex ? -26 : 26); ion.vx = 0; continue; }
    }
    // One ion at a time is discharged at each electrode, so you can watch it happen
    if (at && at === where && sim.busy[at] > 0 && state.tab !== 'alu') { ion.x += ion.x < (at === 'cat' ? e.cat : e.an[0]) ? -16 : 16; ion.vx = 0; continue; }
    if (at && at === where) {
      sim.busy[at] = 0.7;
      sim.made[at] += 1;
      sim.flashes.push({ x: ion.x, y: ion.y, life: 0.4, col: at === 'cat' ? NEG : POS });
      const sol = state.tab === 'solution', gas = at === 'an' ? !(sol && soln().an === 'bromine') : sol && soln().cat === 'hydrogen';
      if (gas) sim.bubbles.push({ x: ion.x + (Math.random() - 0.5) * 6, y: ion.y, at });
      ion.gone = true;   // discharged: it has become an atom of the product
    }
  }
  sim.ions = sim.ions.filter((i) => !i.gone);
  if (state.tab === 'solution') keepGoing(dt);
  sim.busy.cat = Math.max(0, sim.busy.cat - dt); sim.busy.an = Math.max(0, sim.busy.an - dt);
  for (const f of sim.flashes) f.life -= dt;
  sim.flashes = sim.flashes.filter((f) => f.life > 0);
  for (const bb of sim.bubbles) bb.y -= 60 * dt;
  sim.bubbles = sim.bubbles.filter((bb) => bb.y > b.t - (state.tab === 'solution' ? 70 : 6));
  if (state.tab === 'molten' && sim.heating) sim.heat = Math.min(1, sim.heat + dt / 2);
  if (state.tab === 'alu' && state.power) { sim.anodeWear = Math.min(1, sim.anodeWear + dt / 60); sim.al = Math.min(1, sim.al + dt / 50); }
}

// ---------- Keeping a solution going ----------
// A real beaker holds billions of billions of ions, far more than we can draw. As ions are
// discharged, more drift in from the rest of the solution (in at the sides), so it never runs out.
// H⁺ and OH⁻ ions come from water: a water molecule can split up, H₂O → H⁺ + OH⁻, and when an H⁺
// meets an OH⁻ they can join back together into water, H⁺ + OH⁻ → H₂O.
const count = (k) => sim.ions.filter((i) => i.kind === k && !i.leaving).length;
const labelOf = (k) => ({ pos: soln().pos, neg: soln().neg, h: 'H⁺', oh: 'OH⁻', w: 'H₂O' })[k];
const awayFromElectrodes = (i) => Math.abs(i.x - CAT_X) > 40 && Math.abs(i.x - AN_X) > 40;
function enter(k) {
  const b = box(), left = Math.random() < 0.5, ion = makeIon(k, labelOf(k), left ? b.l + 12 : b.r - 12, b.t + 14 + Math.random() * (b.b - b.t - 28));
  ion.a = 0; ion.vx = left ? 40 : -40;
  sim.ions.push(ion);
}
function note(x, y, text) { sim.events.push({ x, y, text, life: 1.8 }); }
function split() {
  const ws = sim.ions.filter((i) => i.kind === 'w' && !i.leaving && awayFromElectrodes(i));
  if (!ws.length) return false;
  const w = ws[Math.floor(Math.random() * ws.length)], h = makeIon('h', 'H⁺', w.x - 7, w.y), oh = makeIon('oh', 'OH⁻', w.x + 7, w.y);
  h.vx = -45; oh.vx = 45;
  w.gone = true;
  sim.ions.push(h, oh);
  note(w.x, w.y - 18, 'H₂O → H⁺ + OH⁻');
  return true;
}
function join() {
  const hs = sim.ions.filter((i) => i.kind === 'h' && !i.leaving && awayFromElectrodes(i)), ohs = sim.ions.filter((i) => i.kind === 'oh' && !i.leaving && awayFromElectrodes(i));
  for (const h of hs) for (const oh of ohs) {
    if (Math.hypot(h.x - oh.x, h.y - oh.y) > 20) continue;
    h.gone = true; oh.gone = true;
    const w = makeIon('w', 'H₂O', (h.x + oh.x) / 2, (h.y + oh.y) / 2);
    sim.ions.push(w);
    note(w.x, w.y - 18, 'H⁺ + OH⁻ → H₂O');
    return true;
  }
  return false;
}
function keepGoing(dt) {
  for (const k of ['split', 'join', 'inflow']) sim.cool[k] = Math.max(0, sim.cool[k] - dt);
  for (const e of sim.events) { e.life -= dt; e.y -= 8 * dt; }
  sim.events = sim.events.filter((e) => e.life > 0);
  // Ions from the compound, and water molecules, that have been used are replaced from the rest of the solution
  if (!sim.cool.inflow) {
    let n = 0;
    for (const k of ['pos', 'neg', 'w']) if (count(k) < (sim.target[k] || 0)) { enter(k); n++; }
    if (n) sim.cool.inflow = 0.3;
  }
  // Water splits up to replace H⁺ or OH⁻ ions, and they join back together into water when they meet
  const h = count('h'), oh = count('oh');
  if (!sim.cool.split && (h < H_N || oh < H_N) && split()) sim.cool.split = 0.5;
  else if (!sim.cool.join && h >= H_N && oh >= H_N && join()) sim.cool.join = 3;
  // Ions left behind build up (sodium hydroxide, say). Past a point, the extra drift off into the rest of the solution.
  for (const k of ['h', 'oh']) {
    if (count(k) <= H_N + 6) continue;
    const spare = sim.ions.filter((i) => i.kind === k && !i.leaving);
    if (spare.length) { const ion = spare[Math.floor(Math.random() * spare.length)]; ion.leaving = true; ion.a = ion.a ?? 1; }
  }
}

// ---------- Current in the wires (as on the circuit builder) ----------
// Electrons flow from the − terminal along the wire into the cathode, where positive ions gain them.
// At the anode, negative ions lose electrons, which flow along the wire back to the + terminal.
// No electrons go through the electrolyte: the ions carry the charge there.
// Each path is listed in the direction the electrons go; conventional current goes the other way.
function wirePaths() {
  if (state.tab === 'alu') {
    const ans = electrodes().an.map((x) => [[x, 222], [x, 97], [280, 97], [280, 60]]);
    return [[[225, 43], [44, 43], [44, 250], [80, 250]], ...ans];
  }
  const bottom = box().b - 12;
  return [[[238, 56], [238, 80], [CAT_X, 80], [CAT_X, bottom]], [[AN_X, bottom], [AN_X, 80], [322, 80], [322, 56]]];
}
const flowing = () => state.power && mobile();
let flowPhase = 0;
function drawFlow() {
  const how = $('flow').value;
  if (how === 'off' || !flowing()) return;
  ctx.fillStyle = PK.cssVar(how === 'electron' ? '--f1' : '--f2');
  for (const path of wirePaths()) {
    const pts = how === 'electron' ? path : [...path].reverse(), lens = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
    for (let s = flowPhase % 20; s < total; s += 20) {
      let d = s, i = 0;
      while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
      const f = lens[i] ? d / lens[i] : 0, x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ---------- Drawing ----------

function drawCircuit(c, current) {
  // d.c. supply, a lamp, and wires down to the two electrodes
  ctx.fillStyle = c.surface2; ctx.strokeStyle = c.art; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(225, 14, 110, 42, 6); ctx.fill(); ctx.stroke();
  tag(c, 'd.c. supply', 280, 35, c.text, 'center', 12);
  ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.arc(322, 56, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(238, 56, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(238, 56); ctx.lineTo(238, 80); ctx.lineTo(CAT_X, 80); ctx.lineTo(CAT_X, 112); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(322, 56); ctx.lineTo(322, 80); ctx.lineTo(AN_X, 80); ctx.lineTo(AN_X, 112); ctx.stroke();
  // The lamp on the cathode side
  ctx.fillStyle = current ? '#ffeb3b' : c.surface; ctx.strokeStyle = c.text;
  ctx.beginPath(); ctx.arc(CAT_X, 96, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CAT_X - 6, 90); ctx.lineTo(CAT_X + 6, 102); ctx.moveTo(CAT_X + 6, 90); ctx.lineTo(CAT_X - 6, 102); ctx.stroke();
  if (current) { ctx.strokeStyle = 'rgba(255, 193, 7, .7)'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(CAT_X + Math.cos(a) * 13, 96 + Math.sin(a) * 13); ctx.lineTo(CAT_X + Math.cos(a) * 19, 96 + Math.sin(a) * 19); ctx.stroke(); } }
  tag(c, state.power ? (current ? 'current flowing' : 'switched on, but no current') : 'switched off', 280, 70, current ? '#e65100' : c.muted, 'center', 11, 700);
}
function drawElectrode(c, x, top, bottom, label, coat, coatCol) {
  ctx.fillStyle = '#37474f'; ctx.fillRect(x - 6, top, 12, bottom - top);
  if (coat > 0) { ctx.fillStyle = coatCol; const w = Math.min(5, coat); ctx.fillRect(x - 6 - w, bottom - 90, 12 + 2 * w, 90); }
  // Labels outside the pair of electrodes, near the top
  const left = label.includes('−');
  tag(c, label, x + (left ? -24 : 24), top + 22, left ? NEG : POS, left ? 'right' : 'left', 12);
}
function drawIons(c, small) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const water = state.tab !== 'solution' || $('water').checked;
  for (const ion of sim.ions) {
    if (!water && (ion.kind === 'h' || ion.kind === 'oh' || ion.kind === 'w')) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, ion.a ?? 1));
    if (ion.kind === 'w') {
      // A water molecule: not charged, so drawn pale, with a dark label
      ctx.fillStyle = '#e3eaee'; ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ion.x, ion.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#455a64'; ctx.font = `800 8px ${c.font}`; ctx.fillText('H₂O', ion.x, ion.y + 0.5);
      ctx.globalAlpha = 1;
      continue;
    }
    const r = small || ion.kind === 'h' || ion.kind === 'oh' ? 9 : 12, col = ion.kind === 'pos' ? POS : ion.kind === 'neg' ? NEG : WATER;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ion.x, ion.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${r > 10 ? 9 : 8}px ${c.font}`; ctx.fillText(ion.label, ion.x, ion.y + 0.5);
    ctx.globalAlpha = 1;
  }
  if (water) for (const e of sim.events) { ctx.globalAlpha = Math.min(1, e.life / 0.6); tag(c, e.text, e.x, e.y, '#37474f', 'center', 11); ctx.globalAlpha = 1; }
  for (const f of sim.flashes) { ctx.strokeStyle = '#ffb300'; ctx.globalAlpha = f.life / 0.4; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(f.x, f.y, 13 - f.life * 10, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
}
function drawBubbles(col) {
  ctx.fillStyle = col; ctx.strokeStyle = 'rgba(80,100,120,.6)'; ctx.lineWidth = 1;
  for (const bb of sim.bubbles) { ctx.beginPath(); ctx.arc(bb.x, bb.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
}

function drawMolten(c) {
  const m = molten(), b = box(), on = state.power && mobile();
  // Tripod, Bunsen burner and crucible
  ctx.strokeStyle = c.art; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(140, 345); ctx.lineTo(160, 368); ctx.moveTo(420, 345); ctx.lineTo(400, 368); ctx.stroke();
  if (sim.heating) {
    ctx.fillStyle = 'rgba(66, 133, 244, .55)'; ctx.beginPath(); ctx.moveTo(262, 368); ctx.quadraticCurveTo(280, 330, 298, 368); ctx.fill();
    ctx.fillStyle = 'rgba(255, 152, 0, .7)'; ctx.beginPath(); ctx.moveTo(270, 368); ctx.quadraticCurveTo(280, 345, 290, 368); ctx.fill();
  }
  ctx.fillStyle = sim.heat >= 1 ? 'rgba(255, 183, 77, .35)' : c.surface2;
  ctx.fillRect(b.l, b.t, b.r - b.l, b.b - b.t);
  ctx.strokeStyle = c.art; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.l - 6, b.t - 25); ctx.lineTo(b.l - 6, b.b + 6); ctx.lineTo(b.r + 6, b.b + 6); ctx.lineTo(b.r + 6, b.t - 25); ctx.stroke();
  // Metal collecting under the cathode
  const metal = 24 * Math.min(1, sim.made.cat / sim.supply.cat);
  if (metal > 0) { ctx.fillStyle = m.metal; ctx.beginPath(); ctx.ellipse(CAT_X, b.b - 2, 16 + metal * 1.5, Math.max(3, metal * 0.45), 0, Math.PI, 0); ctx.fill(); }
  // Gas from the anode: bromine as a brown vapour, chlorine as pale green
  if (sim.made.an > 0) {
    ctx.fillStyle = m.gas; ctx.globalAlpha = Math.min(1, (2 * sim.made.an) / sim.supply.an);
    for (const [dx, dy, r] of [[28, -10, 16], [44, -22, 12], [20, -26, 10]]) { ctx.beginPath(); ctx.arc(AN_X + dx, b.t + dy, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  drawCircuit(c, on);
  drawElectrode(c, CAT_X, 112, b.b - 12, 'cathode (−)', 0, m.metal);
  drawElectrode(c, AN_X, 112, b.b - 12, 'anode (+)', 0, '');
  drawFlow();
  drawIons(c, true);
  drawBubbles(m.gas);
  // What's in the crucible, to the left of it, clear of the electrodes
  tag(c, sim.heat >= 1 ? 'molten' : sim.heating ? 'melting…' : 'solid', b.l - 14, b.t + 18, c.text, 'right', 13);
  tag(c, m.name, b.l - 14, b.t + 36, c.text, 'right', 13);
  if (state.power && !mobile()) tag(c, 'In the solid, the ions can’t move', 280, 160, '#c62828', 'center', 13);
  usedUp(c);
}

function drawSolution(c) {
  const s = soln(), b = box(), gasCat = s.cat === 'hydrogen', gasAn = GASES.includes(s.an);
  // Beaker of solution
  ctx.fillStyle = s.pos === 'Cu²⁺' ? 'rgba(66, 165, 245, .32)' : 'rgba(160, 205, 240, .22)';
  ctx.fillRect(b.l, b.t, b.r - b.l, b.b - b.t);
  if (s.an === 'bromine' && sim.made.an > 0) { ctx.fillStyle = `rgba(205, 110, 30, ${0.5 * (1 - Math.exp(-sim.made.an / 12))})`; ctx.beginPath(); ctx.ellipse(AN_X, b.t + 60, 46, 70, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = c.art; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.l - 6, 150); ctx.lineTo(b.l - 6, b.b + 6); ctx.lineTo(b.r + 6, b.b + 6); ctx.lineTo(b.r + 6, 150); ctx.stroke();
  // Test tubes over each electrode, collecting any gas
  // Test tubes over each electrode, full of solution at first. Gas collects at the top and pushes
  // the solution down.
  const liquid = s.pos === 'Cu²⁺' ? 'rgba(66, 165, 245, .45)' : 'rgba(160, 205, 240, .45)';
  const tube = (x, frac) => {
    const top = 120, bottom = 258, gasTo = top + (bottom - top) * Math.min(1, frac);
    ctx.fillStyle = liquid; ctx.fillRect(x - 18, top, 36, bottom - top);
    if (frac > 0.01) {
      ctx.fillStyle = '#fbfdff'; ctx.fillRect(x - 17, top, 34, gasTo - top);
      ctx.strokeStyle = '#2b6cb0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 17, gasTo); ctx.lineTo(x + 17, gasTo); ctx.stroke();
      tag(c, 'gas', x, Math.min(gasTo - 10, top + 18), c.muted, 'center', 11, 700);
    }
    ctx.strokeStyle = c.art; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 18, 258); ctx.lineTo(x - 18, 128); ctx.quadraticCurveTo(x, 108, x + 18, 128); ctx.lineTo(x + 18, 258); ctx.stroke();
  };
  // The tubes fill up and then stay full. Two H⁺ make one H₂, but four OH⁻ make one O₂, so oxygen
  // collects half as fast as hydrogen; chlorine partly dissolves, so less of it collects.
  const fill = (n, per) => 0.92 * (1 - Math.exp(-n / per));
  tube(CAT_X, gasCat ? fill(sim.made.cat, 24) : 0);
  tube(AN_X, gasAn ? fill(sim.made.an, s.an === 'oxygen' ? 48 : s.an === 'chlorine' ? 40 : 24) : 0);
  drawCircuit(c, state.power);
  drawElectrode(c, CAT_X, 112, b.b - 12, 'cathode (−)', s.cat === 'copper' ? 5 * (1 - Math.exp(-sim.made.cat / 12)) : 0, '#b8733d');
  drawElectrode(c, AN_X, 112, b.b - 12, 'anode (+)', 0, '');
  drawFlow();
  drawIons(c, false);
  drawBubbles('rgba(255,255,255,.95)');
  tag(c, `${s.name} solution`, 280, 348, c.text, 'center', 13);
  if (state.power && !sim.tested && !sim.test && (sim.made.cat >= 3 || sim.made.an >= 3)) tag(c, 'Now test the products', 14, 22, '#e65100', 'left', 14);
  drawTest(c);   // on top of everything else
}
// Once every ion that can be discharged has gone, say so
function usedUp(c) {
  if (!state.power || state.tab === 'alu' || sim.ions.some((i) => discharges(i))) return;
  tag(c, 'All electrolysed:', 14, 22, c.muted, 'left', 12, 700);
  tag(c, 'press Reset to go again', 14, 40, c.muted, 'left', 12, 700);
}

function drawAlu(c) {
  const b = box(), wear = sim.anodeWear;
  // Steel tank lined with carbon (the cathode)
  ctx.fillStyle = '#546e7a'; ctx.fillRect(66, 150, 428, 200);
  ctx.fillStyle = '#263238'; ctx.fillRect(80, 160, 400, 178);
  const al = 8 + sim.al * 22;
  ctx.fillStyle = 'rgba(255, 152, 0, .55)'; ctx.fillRect(b.l, b.t, b.r - b.l, 326 - al - b.t);
  ctx.fillStyle = '#cfd8dc'; ctx.fillRect(b.l, 326 - al, b.r - b.l, al);
  // Carbon anodes hanging from a bar: they burn away from the top down as they're lowered in
  ctx.fillStyle = '#5d4037'; ctx.fillRect(110, 92, 340, 10);
  const top = 102 + wear * 80;
  for (const x of electrodes().an) {
    ctx.fillStyle = '#5d4037'; ctx.fillRect(x - 3, 102, 6, top - 102);
    ctx.fillStyle = '#212121'; ctx.fillRect(x - 26, top, 52, 222 - top);
  }
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(280, 92); ctx.lineTo(280, 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(225, 43); ctx.lineTo(44, 43); ctx.lineTo(44, 250); ctx.lineTo(66, 250); ctx.stroke();
  drawFlow();
  ctx.fillStyle = c.surface2; ctx.strokeStyle = c.art; ctx.beginPath(); ctx.roundRect(225, 26, 110, 34, 6); ctx.fill(); ctx.stroke();
  tag(c, 'd.c. supply', 280, 43, c.text, 'center', 12);
  if ($('alu-ions').checked) drawIons(c, true);
  drawBubbles('rgba(240,240,240,.8)');
  tag(c, 'carbon anodes (+)', 280, 82, POS, 'center', 12);
  tag(c, 'aluminium oxide dissolved in molten cryolite, about 950 °C', 280, 262, '#5d2f00', 'center', 12);
  tag(c, 'molten aluminium', 280, 318 - al / 2 + 4, '#37474f', 'center', 12);
  tag(c, 'carbon lining: cathode (−)', 280, 362, NEG, 'center', 12);
  tag(c, wear > 0.8 ? 'The anodes have nearly burnt away: replace them' : state.power ? 'Oxygen reacts with the hot carbon anodes, making carbon dioxide' : 'Switch on to start', 280, 16, wear > 0.8 ? '#c62828' : c.muted, 'center', 12, 700);
}

// ---------- The panel ----------

const PRODUCT_OPTIONS = { cat: ['copper', 'hydrogen', 'sodium', 'potassium'], an: ['chlorine', 'oxygen', 'bromine', 'sulfur'] };
function renderInfo() {
  const ions = (list) => `<div class="ions">${list.map(([l, k]) => `<span class="ion ${k}">${l}</span>`).join('')}</div>`;
  if (state.tab === 'molten') {
    const m = molten();
    $('info').innerHTML = `<p style="margin-top:0">Ions in ${m.name}:</p>${ions([[m.pos, 'pos'], [m.neg, 'neg']])}
      <div class="working">
        <p><b>At the cathode (−):</b> ${PK.ans(m.cat)}<br><b>At the anode (+):</b> ${PK.ans(m.an)}</p>
        <p><b>Higher: half equations</b><br>${PK.ans(m.half[0])}<br>${PK.ans(m.half[1])}</p>
      </div>
      <p class="note" style="margin-bottom:0">${m.name[0].toUpperCase() + m.name.slice(1)} melts at about ${m.mp} °C. ${sim.heat >= 1 ? 'It’s molten, so the ions are free to move.' : 'While it’s solid, the ions are held in place and no current flows.'}</p>`;
  } else if (state.tab === 'solution') {
    const s = soln(), pc = $('pcat').value, pa = $('pan').value, done = sim.made.cat >= 3 || sim.made.an >= 3;
    const mark = (guess, real) => (!guess ? '' : guess === real ? ' <span class="badge good">your prediction was right</span>' : ` <span class="badge bad">you predicted ${guess}</span>`);
    $('info').innerHTML = `<p style="margin-top:0">Ions in the solution:</p>${ions([[s.pos, 'pos'], [s.neg, 'neg'], ['H⁺', 'pos'], ['OH⁻', 'neg']])}
      <p class="note">H⁺ and OH⁻ come from the water. A few water molecules split up into H⁺ and OH⁻, and H⁺ and OH⁻ join back together into water: H₂O ⇌ H⁺ + OH⁻.</p>
      ${done ? `<div class="working">
        <p><b>At the cathode (−):</b> ${s.cat}${mark(pc, s.cat)}<br>${s.why[0]}</p>
        <p><b>At the anode (+):</b> ${s.an}${mark(pa, s.an)}<br>${s.why[1]}</p>
        <p><b>Left in the solution:</b> ${s.left}</p>
        <p><b>Higher: half equations</b><br>${PK.ans(s.half[0])}<br>${PK.ans(s.half[1])}</p>
      </div>` : `<p class="note" style="margin-bottom:0">${pc && pa ? 'Switch on to see if you were right.' : 'Make your predictions, then switch on.'}</p>`}`;
  } else {
    $('info').innerHTML = `<div class="working" style="margin-top:0">
        <p><b>At the cathode (−):</b> aluminium ions gain electrons and become aluminium.<br>${PK.ans('Al³⁺ + 3e⁻ → Al')}</p>
        <p><b>At the anode (+):</b> oxide ions lose electrons and become oxygen.<br>${PK.ans('2O²⁻ → O₂ + 4e⁻')}</p>
      </div>
      <p><b>Why cryolite?</b> Aluminium oxide melts at over 2000 °C. Dissolving it in molten cryolite lowers the temperature needed to about 950 °C, saving energy.</p>
      <p><b>Why replace the anodes?</b> The oxygen made at the anodes reacts with the hot carbon to make carbon dioxide, so the anodes burn away.</p>
      <p style="margin-bottom:0"><b>Why is it expensive?</b> It takes a lot of energy to melt the electrolyte and to produce the electric current.</p>`;
  }
  if (flowNote()) $('info').insertAdjacentHTML('beforeend', flowNote());
}
function flowNote() {
  const how = $('flow').value;
  if (how === 'electron') return '<p class="note" style="margin-bottom:0"><b>Electron flow:</b> electrons flow from the − terminal to the cathode, where positive ions gain them. At the anode, negative ions lose electrons, which flow back to the + terminal. No electrons go through the electrolyte: the moving ions carry the charge there.</p>';
  if (how === 'conv') return '<p class="note" style="margin-bottom:0"><b>Conventional current</b> flows from + to −, the opposite way to the electrons. In the electrolyte, the moving ions carry the charge.</p>';
  return '';
}
function fillPredictions() {
  for (const [id, key] of [['pcat', 'cat'], ['pan', 'an']]) {
    $(id).innerHTML = '<option value="">Choose…</option>' + PRODUCT_OPTIONS[key].map((p) => `<option value="${p}">${p}</option>`).join('');
  }
}
function test(where, t) {
  const s = soln(), what = where === 'cat' ? s.cat : s.an;
  if (sim.made[where] < 3) { $('test-result').textContent = 'Switch on and wait for some product to form first.'; return; }
  const R = {
    hydrogen: { lit: 'It burns with a squeaky pop. The gas is hydrogen.', glow: 'The glowing splint does not relight.', litmus: 'No change.' },
    oxygen: { lit: 'The splint burns a little more brightly, because oxygen helps things burn. Oxygen on its own doesn’t pop or explode. The test for oxygen is a glowing splint.', glow: 'The glowing splint relights. The gas is oxygen.', litmus: 'No change.' },
    chlorine: { lit: 'Nothing special happens. (Chlorine is toxic, so only small amounts are made, in a well-ventilated room.)', glow: 'The glowing splint does not relight.', litmus: 'The damp litmus paper turns red, then is bleached white. The gas is chlorine.' },
    copper: { lit: 'There’s no gas here, so no squeaky pop. H⁺ ions are attracted to the cathode, but copper is less reactive than hydrogen, so copper forms instead: a brown coating on the electrode.', glow: 'There’s no gas here, so no squeaky pop. H⁺ ions are attracted to the cathode, but copper is less reactive than hydrogen, so copper forms instead: a brown coating on the electrode.', litmus: 'There’s no gas here, so no squeaky pop. H⁺ ions are attracted to the cathode, but copper is less reactive than hydrogen, so copper forms instead: a brown coating on the electrode.' },
    bromine: { lit: 'No gas collects. The solution around the anode turns orange-brown: that’s bromine.', glow: 'No gas collects. The solution around the anode turns orange-brown: that’s bromine.', litmus: 'No gas collects. The solution around the anode turns orange-brown: that’s bromine.' },
  };
  $('test-result').textContent = R[what][t];
  const effect = { hydrogen: { lit: 'pop' }, oxygen: { glow: 'relight', lit: 'bright' }, chlorine: { litmus: 'bleach' } }[what]?.[t] || (GASES.includes(what) ? 'none' : 'nogas');
  // A few short lines for the box on the diagram
  const short = { pop: ['Squeaky pop:', 'hydrogen'], relight: ['It relights:', 'oxygen'], bleach: ['Bleached:', 'chlorine'], bright: ['Burns a little brighter.', 'The test for oxygen is', 'a glowing splint'], none: ['No change'], nogas: what === 'copper' ? ['No gas: copper', 'coats the electrode'] : ['No gas: bromine', 'dissolves'] }[effect];
  sim.test = { where, kind: t, effect, t: 0, short };
  sim.tested = true;
}
// The test, in a box beside the apparatus: the tube of gas from that electrode, held mouth down,
// with a splint or damp litmus paper at its mouth
function drawTest(c) {
  const T = sim.test;
  if (!T) return;
  const x0 = T.where === 'cat' ? 10 : SW - 170, y0 = 92, w = 160, h = 220, cx = x0 + w / 2, mouth = y0 + 112;
  ctx.fillStyle = c.surface; ctx.strokeStyle = T.where === 'cat' ? NEG : POS; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 10); ctx.fill(); ctx.stroke();
  tag(c, `Testing the ${T.where === 'cat' ? 'cathode' : 'anode'} tube`, cx, y0 + 14, T.where === 'cat' ? NEG : POS, 'center', 12);
  // The tube, mouth down
  const gas = T.effect !== 'nogas';
  ctx.fillStyle = gas ? '#fbfdff' : 'rgba(160, 205, 240, .45)'; ctx.fillRect(cx - 14, y0 + 34, 28, mouth - y0 - 34);
  ctx.strokeStyle = c.art; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 14, mouth); ctx.lineTo(cx - 14, y0 + 44); ctx.quadraticCurveTo(cx, y0 + 26, cx + 14, y0 + 44); ctx.lineTo(cx + 14, mouth); ctx.stroke();
  if (!gas) tag(c, 'no gas', cx, y0 + 70, c.muted, 'center', 11, 700);
  const k = Math.min(1, T.t / 0.8);
  if (T.kind === 'litmus') {
    const col = T.effect === 'bleach' ? (T.t < 0.9 ? '#5c8fd6' : T.t < 1.7 ? '#e53935' : '#f5f5f5') : '#5c8fd6';
    ctx.fillStyle = col; ctx.strokeStyle = c.art; ctx.lineWidth = 1.5;
    const y = mouth + 46 - 40 * k;
    ctx.fillRect(cx - 8, y, 16, 34); ctx.strokeRect(cx - 8, y, 16, 34);
  } else {
    const tipY = mouth + 40 - 34 * k, tipX = cx + 6;
    ctx.strokeStyle = '#a1785a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tipX + 34, tipY + 40); ctx.lineTo(tipX, tipY); ctx.stroke();
    const flame = T.kind === 'lit' ? T.effect !== 'pop' || T.t < 0.9 : T.effect === 'relight' && T.t > 0.9;
    if (flame) {
      const big = T.effect === 'relight' || T.effect === 'bright' ? 1.5 : 1;
      ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.ellipse(tipX, tipY - 8 * big, 6 * big, 11 * big, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.ellipse(tipX, tipY - 5 * big, 3 * big, 6 * big, 0, 0, Math.PI * 2); ctx.fill();
    } else if (T.kind === 'glow') { ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.arc(tipX, tipY, 4, 0, Math.PI * 2); ctx.fill(); }
    if (T.effect === 'pop' && T.t > 0.9 && T.t < 2) {
      ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 12, mouth + Math.sin(a) * 12); ctx.lineTo(cx + Math.cos(a) * 24, mouth + Math.sin(a) * 24); ctx.stroke(); }
      tag(c, 'POP!', cx + 44, mouth - 22, '#e65100', 'center', 17);
    }
  }
  if (T.t > 0.9) T.short.forEach((line, i) => tag(c, line, cx, y0 + h - 18 - (T.short.length - 1 - i) * 16, '#5d2f00', 'center', 12));
}

// ---------- Tabs and controls ----------

const WHY = {
  molten: `<p><b>Why melt it?</b> In a solid ionic compound the ions are held in a lattice and can’t move, so it doesn’t conduct. When it melts, the ions are free to move and carry the current.</p>
    <p><b>Opposites attract.</b> Positive metal ions move to the negative electrode, the cathode, and gain electrons to become metal atoms. Negative non-metal ions move to the positive electrode, the anode, and lose electrons.</p>
    <p><b>Higher.</b> Gaining electrons is reduction and losing electrons is oxidation: OIL RIG.</p>`,
  solution: `<p><b>Two kinds of ion.</b> A solution has the ions from the compound and also H⁺ and OH⁻ ions from the water. A few water molecules split up into H⁺ and OH⁻ ions, and H⁺ and OH⁻ ions join back together to make water, so there are always some: H₂O ⇌ H⁺ + OH⁻.</p>
    <p><b>At the cathode (−):</b> hydrogen is produced if the metal is more reactive than hydrogen. Otherwise the metal is produced.</p>
    <p><b>At the anode (+):</b> oxygen is produced, unless the solution contains halide ions (chloride, bromide or iodide). Then the halogen is produced.</p>
    <p><b>Ions that aren’t discharged</b> stay in the solution. With sodium chloride, the Na⁺ and OH⁻ ions are left, so the solution slowly turns into sodium hydroxide.</p>
    <p><b>The required practical</b> uses inert electrodes, such as carbon, so they don’t react themselves.</p>
    <p class="note">A real beaker holds billions of billions of ions, far more than we can show. As ions are discharged, more move in from the rest of the solution, so it keeps going.</p>`,
  alu: `<p><b>Why electrolysis?</b> Aluminium is more reactive than carbon, so it can’t be extracted by heating its oxide with carbon. Electrolysis is used instead, which takes a lot of energy.</p>
    <p>The aluminium sinks to the bottom and is tapped off. The carbon anodes slowly burn away and have to be replaced regularly.</p>`,
};
const INTRO = {
  molten: 'Pass a current through a molten ionic compound. The ions move to the electrodes and are discharged: the metal at the cathode and the non-metal at the anode.',
  solution: 'The required practical: electrolyse solutions with inert electrodes. Predict what forms at each electrode, switch on, then test the products.',
  alu: 'How aluminium is extracted from aluminium oxide by electrolysis, using cryolite and carbon anodes.',
};
function reset() {
  sim.made = { cat: 0, an: 0 }; sim.busy = { cat: 0, an: 0 }; sim.bubbles = []; sim.flashes = []; sim.test = null; state.power = false; $('test-result').textContent = '';
  sim.target = {}; sim.events = []; sim.cool = { split: 0, join: 0, inflow: 0 }; sim.tested = false;
  if (state.tab === 'molten') { sim.heat = 0; sim.heating = false; }
  if (state.tab === 'alu') { sim.anodeWear = 0; sim.al = 0; }
  buildIons(); syncButtons(); renderInfo();
}
function syncButtons() {
  $('power').textContent = state.power ? '⏻ Switch off' : '⚡ Switch on';
  $('heat').hidden = state.tab !== 'molten';
  $('heat').textContent = sim.heating ? '🔥 Heating' : '🔥 Heat it';
  $('heat').disabled = sim.heating;
}
$('flow').addEventListener('change', renderInfo);
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = WHY[t];
  scene.setAttribute('aria-label', { molten: 'A crucible of an ionic compound with two electrodes', solution: 'A beaker of solution with two electrodes and test tubes', alu: 'An electrolysis cell for extracting aluminium' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'molten' ? location.pathname + location.search : `#${t}`);
  reset();
  size();
}
$('power').addEventListener('click', () => { state.power = !state.power; syncButtons(); renderInfo(); });
$('heat').addEventListener('click', () => { sim.heating = true; syncButtons(); });
$('reset').addEventListener('click', reset);
$('mcomp').addEventListener('change', reset);
$('scomp').addEventListener('change', () => { $('pcat').value = ''; $('pan').value = ''; reset(); });
$('pcat').addEventListener('change', renderInfo);
$('pan').addEventListener('change', renderInfo);
document.querySelectorAll('[data-test]').forEach((b) => b.addEventListener('click', () => test(b.dataset.where, b.dataset.test)));
$('anodes').addEventListener('click', () => { sim.anodeWear = 0; });
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
window.addEventListener('pk-answers', renderInfo);
fillPredictions();

function size() {
  const dpr = window.devicePixelRatio || 1;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (SH / SW) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now(), tick = 0, wasMolten = false;
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  stepIons(dt);
  flowPhase = (flowPhase + 40 * dt) % 20;
  if (sim.test) { sim.test.t += dt; if (sim.test.t > 4) sim.test = null; }
  if (state.tab === 'alu' && state.power && Math.random() < dt * 6) {
    const xs = electrodes().an, x = xs[Math.floor(Math.random() * xs.length)];
    sim.bubbles.push({ x: x + (Math.random() - 0.5) * 40, y: 222, at: 'an' });
  }
  if (scene.clientWidth) {
    const c = colours();
    ctx.setTransform(scene.width / SW, 0, 0, scene.width / SW, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, SW, SH);
    ({ molten: drawMolten, solution: drawSolution, alu: drawAlu })[state.tab](c);
  }
  tick += dt;
  const isMolten = sim.heat >= 1;
  if (tick > 0.5 || isMolten !== wasMolten) { tick = 0; wasMolten = isMolten; renderInfo(); }
  requestAnimationFrame(frame);
}

showTab(['solution', 'alu'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'molten');
requestAnimationFrame(frame);
