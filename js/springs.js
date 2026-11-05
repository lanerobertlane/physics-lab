// Springs: F = k e up to the limit of proportionality; past it the spring stretches more than
// expected, and past its elastic limit it is permanently stretched (it won't go back).

PK.header({
  title: "Springs & Hooke's law",
  answers: true,
  spec: [
    { code: '4.5.3', text: 'Forces and elasticity: elastic and inelastic deformation; F = k e; the limit of proportionality' },
    { code: '4.5.3', text: 'Required practical: investigate the relationship between force and extension for a spring' },
    { code: '4.5.3', text: 'Work done in stretching: elastic potential energy E = ½ k e² (below the limit of proportionality)' },
    { code: 'KS3', text: "Forces: stretching and squashing springs; Hooke's law as a special case" },
  ],
});

const $ = (id) => document.getElementById(id);
const G = 9.8;
const SPRINGS = {
  a: { k: 25, lp: 4.0, el: 4.4, L0: 10, max: 600, name: 'Spring A' },
  b: { k: 50, lp: 7.0, el: 7.5, L0: 10, max: 800, name: 'Spring B' },
  c: { k: 32, lp: 5.0, el: 5.5, L0: 12, max: 700, name: 'Spring C' },
};
// moveRuler: the ruler can be dragged so its zero lines up with the bottom of the spring.
// rulerCm: how far the ruler's zero sits below the top of the spring.
const state = { spring: 'a', grams: 0, maxF: 0, set: 0, y: 0, vy: 0, showLength: true, rows: [], moveRuler: false, rulerCm: 0 };
const RULER_MAX_CM = 30;
const sp = () => SPRINGS[state.spring];
const force = () => (state.grams / 1000) * G;

// Extension in metres for a force (N): linear, then stretching more beyond the limit.
function extension(F) {
  const s = sp();
  let e = F <= s.lp ? F / s.k : s.lp / s.k + ((F - s.lp) / s.k) * (1 + 1.5 * (F - s.lp));
  return e + state.set;
}

function load(dg) {
  state.grams = Math.max(0, Math.min(sp().max, state.grams + dg));   // max keeps it on the ruler
  const F = force();
  if (F > state.maxF) {
    // Past the elastic limit the spring is permanently stretched.
    const s = sp();
    if (F > s.el) state.set = Math.max(state.set, ((F - s.el) / s.k) * 1.2 + (F - s.el) * 0.01);
    state.maxF = F;
  }
  render();
}

// ---------- Drawing ----------

const rig = $('rig'), ctx = rig.getContext('2d');
const W = 520, H = 560, TOP = 70, PX_CM = 7, RULER_X = 360;

function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  rig.width = Math.round(rig.clientWidth * dpr); rig.height = Math.round(rig.clientWidth * (H / W) * dpr);
  const fe = $('fe'); fe.width = Math.round(fe.clientWidth * dpr); fe.height = Math.round(fe.clientWidth * (220 / 270) * dpr);
}

function draw(dt) {
  // Spring bounces to its new length (damped), like a real one
  const target = (sp().L0 / 100 + extension(force())) * 100 * PX_CM;
  state.vy += ((target - state.y) * 60 - state.vy * 9) * dt;
  state.y += state.vy * dt;

  const k = rig.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);

  // Clamp stand
  ctx.fillStyle = '#5d6470'; ctx.fillRect(60, 20, 12, 520); ctx.fillRect(30, 530, 260, 16); ctx.fillRect(60, 50, 200, 12);
  ctx.fillStyle = '#3a3f48'; ctx.fillRect(225, 44, 30, 24);

  // Ruler (its zero is at R0; it moves when the movable ruler is switched on)
  const R0 = TOP + state.rulerCm * PX_CM;
  if (state.moveRuler) { ctx.save(); ctx.shadowColor = 'rgba(0, 0, 0, .25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2; }
  ctx.fillStyle = 'rgba(255, 236, 140, .95)'; ctx.strokeStyle = '#7a6a1f'; ctx.lineWidth = 1.5;
  ctx.fillRect(RULER_X, R0 - 6, 54, 62 * PX_CM);
  if (state.moveRuler) ctx.restore();
  ctx.strokeRect(RULER_X, R0 - 6, 54, 62 * PX_CM);
  ctx.strokeStyle = '#222'; ctx.fillStyle = '#222'; ctx.font = `700 10px ${c.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let mm = 0; mm <= 600; mm++) {
    const y = R0 + (mm / 10) * PX_CM;
    if (mm % 10 && PX_CM < 6) continue;
    const len = mm % 10 === 0 ? 18 : mm % 5 === 0 ? 12 : 6;
    if (mm % 2 && mm % 5) continue;
    ctx.lineWidth = mm % 10 === 0 ? 1.3 : 0.8;
    ctx.beginPath(); ctx.moveTo(RULER_X, y); ctx.lineTo(RULER_X + len, y); ctx.stroke();
    if (mm % 50 === 0) ctx.fillText(mm / 10, RULER_X + 50, y);
  }
  ctx.textAlign = 'center'; ctx.fillText('cm', RULER_X + 27, R0 - 14);
  if (state.moveRuler) {
    ctx.fillStyle = c.muted; ctx.font = `700 12px ${c.font}`; ctx.textAlign = 'left';
    ctx.fillText('↕ drag the ruler', RULER_X + 60, R0 + 20);
  }

  // Spring
  const x = 240, y0 = TOP, y1 = TOP + state.y;
  const coils = 18;
  ctx.strokeStyle = '#8a929f'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y0);
  const body0 = y0 + 8, body1 = y1 - 8;
  ctx.lineTo(x, body0);
  for (let i = 0; i <= coils * 2; i++) ctx.lineTo(x + (i % 2 ? 14 : -14), body0 + ((body1 - body0) * i) / (coils * 2));
  ctx.lineTo(x, body1); ctx.lineTo(x, y1); ctx.stroke();
  // Pointer to the ruler
  ctx.strokeStyle = '#e53935'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(RULER_X + 4, y1); ctx.stroke();
  // Hanger and slotted masses (100 g each)
  ctx.fillStyle = '#4b525d'; ctx.fillRect(x - 2, y1, 4, 16);
  const n = state.grams / 100;
  for (let i = 0; i < n; i++) {
    const my = y1 + 16 + i * 12;
    ctx.fillStyle = i % 2 ? '#b08d57' : '#c9a66b'; ctx.fillRect(x - 30, my, 60, 11);
    ctx.strokeStyle = '#6b5532'; ctx.lineWidth = 1; ctx.strokeRect(x - 30, my, 60, 11);
  }
  if (n) { ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(`${state.grams} g`, x - 38, y1 + 16 + n * 6); }
}

// ---------- Panel, table and graph ----------

function lengthCm() { return sp().L0 + extension(force()) * 100; }

function render() {
  const s = sp(), F = force(), L = lengthCm(), e = L - s.L0;
  const linear = F <= s.lp;
  $('readout').innerHTML = `
    <dt>Mass</dt><dd>${state.grams} g</dd>
    <dt>Force (weight)</dt><dd>${PK.ans(`${F.toFixed(2)} N`)}</dd>
    <dt>Natural length</dt><dd>${s.L0.toFixed(1)} cm</dd>
    ${state.moveRuler
      ? `<dt>Ruler reading</dt><dd>${state.showLength ? `${(L - state.rulerCm).toFixed(1)} cm` : 'read the ruler'}</dd>`
      : `<dt>Length now</dt><dd>${state.showLength ? `${L.toFixed(1)} cm` : 'read the ruler'}</dd>`}
    ${state.showLength ? `<dt>Extension</dt><dd>${PK.ans(`${e.toFixed(1)} cm`)}</dd>` : ''}
    ${state.showLength && linear && F > 0 ? `<dt>Elastic potential energy</dt><dd>${PK.ans(`${(0.5 * s.k * (e / 100) ** 2).toFixed(3)} J`)}</dd>` : ''}`;
  $('warn').innerHTML = state.set > 1e-6
    ? '<b>Past the elastic limit:</b> this spring is now permanently stretched (inelastic deformation). It won’t return to its natural length. Press “New spring”.'
    : !linear ? '<b>Past the limit of proportionality:</b> extension is no longer proportional to force, so the graph curves.' : 'Force = mass × g = mass (kg) × 9.8 N/kg.';
  renderTable();
}

function renderTable() {
  const rows = state.rows;
  $('table').innerHTML = rows.length ? `<table class="results"><thead><tr><th>Mass (g)</th><th>Force (N)</th><th>${state.moveRuler ? 'Ruler reading' : 'Length'} (cm)</th><th>Extension (cm)</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${r.g}</td><td class="n">${PK.ans(r.F.toFixed(2))}</td><td class="n">${r.read.toFixed(1)}</td><td class="n">${PK.ans(r.e.toFixed(1))}</td></tr>`).join('')}</tbody></table>` : '<p class="note">No readings yet.</p>';
  drawGraph();
  // Spring constant from the straight part (points at or below the limit of proportionality)
  const lin = rows.filter((r) => r.F > 0 && r.F <= sp().lp + 1e-9);
  if (lin.length >= 2) {
    const sxx = lin.reduce((a, r) => a + (r.e / 100) ** 2, 0), sxy = lin.reduce((a, r) => a + (r.e / 100) * r.F, 0);
    const kk = sxy / sxx;
    $('kcalc').innerHTML = `Gradient of the straight part = spring constant: <b>k ≈ ${PK.ans(`${kk.toFixed(1)} N/m`)}</b><br>(F = k e, with e in metres)`;
  } else $('kcalc').innerHTML = 'Record at least two readings to find the spring constant from the gradient.';
}

function drawGraph() {
  const cv = $('fe'), g = cv.getContext('2d'), GW = 270, GH = 220, k = cv.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent'), font: PK.cssVar('--font-body') || 'sans-serif' };
  g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
  const L = 40, R = 10, T = 10, B = 34, pw = GW - L - R, ph = GH - T - B;
  const eMax = Math.max(10, Math.ceil(Math.max(0, ...state.rows.map((r) => r.e)) / 5) * 5), fMax = 8;
  const X = (e) => L + (e / eMax) * pw, Y = (f) => T + ph - (f / fMax) * ph;
  g.strokeStyle = c.grid; g.fillStyle = c.muted; g.font = `600 10px ${c.font}`; g.lineWidth = 1;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let f = 0; f <= fMax; f += 2) { g.beginPath(); g.moveTo(L, Y(f)); g.lineTo(L + pw, Y(f)); g.stroke(); g.fillText(f, L - 4, Y(f)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let e = 0; e <= eMax; e += eMax / 5) { g.beginPath(); g.moveTo(X(e), T); g.lineTo(X(e), T + ph); g.stroke(); g.fillText(Math.round(e), X(e), T + ph + 3); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 11px ${c.font}`; g.fillText('extension / cm', L + pw / 2, GH - 15);
  g.save(); g.translate(10, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('force / N', 0, 0); g.restore();
  g.strokeStyle = c.point; g.lineWidth = 2;
  for (const r of state.rows) { const x = X(r.e), y = Y(r.F); g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x - 4, y + 4); g.lineTo(x + 4, y - 4); g.stroke(); }
}

// ---------- Controls ----------

$('add').addEventListener('click', () => load(100));
$('remove').addEventListener('click', () => load(-100));
function freshSpring() { state.grams = 0; state.maxF = 0; state.set = 0; state.rows = []; render(); }
$('fresh').addEventListener('click', freshSpring);
$('spring').addEventListener('change', (e) => { state.spring = e.target.value; freshSpring(); });
$('record').addEventListener('click', () => {
  const L = lengthCm();
  state.rows.push({ g: state.grams, F: force(), L, read: state.moveRuler ? L - state.rulerCm : L, e: L - sp().L0 });
  renderTable();
});
$('clear').addEventListener('click', () => { state.rows = []; renderTable(); });
$('auto-length').addEventListener('change', (e) => { state.showLength = e.target.checked; render(); });

// ---------- Movable ruler ----------

function setRuler(cm) {
  state.rulerCm = Math.round(Math.max(0, Math.min(RULER_MAX_CM, cm)) * 10) / 10;
  render();
}
$('move-ruler').addEventListener('change', (e) => {
  state.moveRuler = e.target.checked;
  if (!state.moveRuler) state.rulerCm = 0;
  $('ruler-nudge').hidden = !state.moveRuler;
  $('ruler-tip').hidden = !state.moveRuler;
  rig.style.touchAction = state.moveRuler ? 'none' : '';   // stop iPads scrolling while dragging
  if (state.rows.length) { state.rows = []; PK.toast('Results cleared for the new set-up'); }
  render();
});
$('ruler-up').addEventListener('click', () => setRuler(state.rulerCm - 0.1));
$('ruler-down').addEventListener('click', () => setRuler(state.rulerCm + 0.1));

const toLogical = (e) => { const r = rig.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
const onRuler = (p) => state.moveRuler && p.x >= RULER_X - 6 && p.x <= RULER_X + 60
  && p.y >= TOP + state.rulerCm * PX_CM - 12 && p.y <= TOP + state.rulerCm * PX_CM + 62 * PX_CM;
let drag = null;
rig.addEventListener('pointerdown', (e) => {
  const p = toLogical(e);
  if (!onRuler(p)) return;
  drag = { y: p.y, cm: state.rulerCm };
  rig.setPointerCapture(e.pointerId);
  rig.style.cursor = 'grabbing';
  e.preventDefault();
});
rig.addEventListener('pointermove', (e) => {
  const p = toLogical(e);
  if (drag) setRuler(drag.cm + (p.y - drag.y) / PX_CM);
  else rig.style.cursor = onRuler(p) ? 'grab' : '';
});
const endDrag = () => { drag = null; rig.style.cursor = ''; };
rig.addEventListener('pointerup', endDrag);
rig.addEventListener('pointercancel', endDrag);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.03, (now - last) / 1000);
  last = now;
  draw(dt);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { sizeAll(); drawGraph(); });
sizeAll();
state.y = sp().L0 * PX_CM;
render();
requestAnimationFrame(frame);
