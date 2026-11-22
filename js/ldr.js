// Light-dependent resistors. The LDR slides along a ruler away from a lamp. Less light reaches it the
// further away it is, so its resistance goes up. The room is always dark, as in the real practical.
// With the lamp off, the LDR is in the dark and its resistance is very high.

PK.header({
  title: 'Light-dependent resistors (LDRs)',
  answers: true,
  spec: [
    { code: '4.2.1.4', text: 'The resistance of an LDR decreases as light intensity increases. LDRs are used in circuits, e.g. to switch lights on when it gets dark' },
    { code: '4.2.1.4', text: 'Explain the design and use of a circuit to measure the resistance of a component by measuring the current through it and the potential difference across it' },
    { code: '4.2.1.3', text: 'Potential difference = current × resistance: V = I R' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const EMF = 3, R_INSIDE = 0.7;   // two 1.5 V cells, with a little resistance of their own and in the leads
const D_MIN = 1, D_MAX = 30;     // cm from the front of the lamp
const half = (x) => Math.round(x * 2) / 2;   // distances go to the nearest half centimetre
const dist = () => half(PK.num('dist'));
const state = { rows: [], moved: false };
const lampOn = () => $('lamp').querySelector('[aria-pressed="true"]')?.dataset.v !== 'off';
function setLamp(on) { $('lamp').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String((x.dataset.v === 'on') === on))); }
// Light intensity (lux) at the LDR: the lamp's light spreads out with distance. The dark room adds a little.
function lux(d = dist()) { return (lampOn() ? 90000 / (d * d) : 0) + 0.5; }
// A typical LDR: about 10 kΩ in dim light, a few hundred ohms in bright light, close to 1 MΩ in the dark
const ldrR = (E) => 400000 * Math.pow(E, -0.8);
function circuit() {
  const R = ldrR(lux()), I = EMF / (R + R_INSIDE);
  return { R, I: I * 1000, V: I * R };   // I in mA, as the ammeter shows it
}
// The ammeter switches range like a real one: 3 decimal places up to 2 mA, 2 up to 20 mA, then 1
const dpOf = (I) => (I < 2 ? 3 : I < 20 ? 2 : 1);
const mA = (I) => I.toFixed(dpOf(I));
const amps = (I) => (I / 1000).toFixed(dpOf(I) + 3);   // the same reading in amps: 0.300 mA = 0.000300 A
// 3 significant figures, with spaces in numbers of 5 or more digits (12 000), as on AQA papers
function ohms(R) {
  const n = Number(R.toPrecision(3));
  return n >= 10000 ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n);   // a space that doesn't break the line
}

$('lamp').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setLamp(b.dataset.v === 'on'); });

$('rec').addEventListener('click', () => {
  if (!lampOn()) { PK.toast('The lamp is off. Turn it on to take readings for the graph.'); return; }
  if (state.rows.length >= 30) { PK.toast('The table is full. Clear it to carry on.'); return; }
  const { I, V } = circuit();
  state.rows.push({ d: dist(), V: Number(V.toFixed(2)), I: Number(mA(I)) });
  renderResults();
});

// ---------- The bench ----------

const bench = $('bench'), c = bench.getContext('2d');
const W = 800, H = 440, RL = 150, RP = 20, RY = 352, LY = 300;   // ruler zero at the front of the lamp, 20 px per cm
const ldrX = () => RL + dist() * RP;
// Fixed colours, the same in every theme. The bench is in a darkened room.
const RED = '#d0392b', BLACK = '#23272e', VLEAD = '#2563eb', INK = '#1c2430';
const benchCol = () => '#a9b2bf';
function label(s, x, y, o = {}) {
  c.font = `${o.w || 700} ${o.s || 15}px ${font()}`; c.textAlign = o.a || 'center'; c.textBaseline = o.b || 'middle';
  c.fillStyle = o.col || INK; c.fillText(s, x, y);
}
function hint(s, x, y) {
  c.font = `800 16px ${font()}`;
  const w = c.measureText(s).width + 18;
  c.fillStyle = '#fff'; c.globalAlpha = 0.93; c.beginPath(); c.roundRect(x - w / 2, y - 14, w, 28, 8); c.fill(); c.globalAlpha = 1;
  label(s, x, y, { s: 16, w: 800 });
}
function lead(x1, y1, cx1, cy1, cx2, cy2, x2, y2, col) {
  c.strokeStyle = col; c.lineWidth = 3.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2); c.stroke(); c.lineCap = 'butt';
}
const MW = 156;   // meter width
function meter(cx, cy, name, value, unit) {
  const h = 78;
  c.fillStyle = '#343a45'; c.beginPath(); c.roundRect(cx - MW / 2, cy - h / 2, MW, h, 9); c.fill();
  c.fillStyle = '#cfe6c4'; c.fillRect(cx - 64, cy - 30, 128, 40);
  c.fillStyle = '#17231a'; c.font = `800 26px ui-monospace, Consolas, monospace`; c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillText(value, cx + 20, cy - 9);
  c.font = `800 22px ${font()}`; c.textAlign = 'left'; c.fillText(unit, cx + 24, cy - 9);
  label(name, cx, cy + 25, { s: 14, col: '#fff' });
  for (const [x, col] of [[cx - MW / 2, BLACK], [cx + MW / 2, RED]]) { c.fillStyle = col; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, cy, 6, 0, Math.PI * 2); c.fill(); c.stroke(); }
}
function battery(cx, cy, n) {
  const each = 44, w = n * each + 24;
  c.fillStyle = '#4a5260'; c.beginPath(); c.roundRect(cx - w / 2, cy - 28, w, 56, 7); c.fill();
  for (let i = 0; i < n; i++) {
    const x = cx - (n * each) / 2 + i * each + 2;
    c.fillStyle = '#d6a92e'; c.fillRect(x, cy - 16, each - 12, 32);
    c.fillStyle = '#1b1e24'; c.fillRect(x + (each - 12) * 0.55, cy - 16, (each - 12) * 0.45, 32);
    c.fillStyle = '#bfc5cf'; c.fillRect(x + each - 12, cy - 6, 5, 12);
  }
  label(`${(1.5 * n).toFixed(1)} V`, cx, cy - 42, { s: 15, w: 800 });   // above it, clear of the leads
  return { left: cx - w / 2, right: cx + w / 2 };
}

// The ruler, in the same style as the Ripple tank's: millimetre marks, a number every centimetre
function ruler() {
  const end = RL + (D_MAX + 1.4) * RP;
  c.fillStyle = '#f6e7a3'; c.fillRect(RL - 12, RY, end - RL + 12, 40);
  c.strokeStyle = '#7a6a1f'; c.lineWidth = 1.5; c.strokeRect(RL - 12, RY, end - RL + 12, 40);
  c.strokeStyle = '#222';
  for (let mm = 0; mm <= D_MAX * 10; mm++) {
    const x = RL + (mm / 10) * RP, h = mm % 10 === 0 ? 14 : mm % 5 === 0 ? 10 : 6;
    c.lineWidth = mm % 10 === 0 ? 1.4 : 1;
    c.beginPath(); c.moveTo(x, RY); c.lineTo(x, RY + h); c.stroke();
  }
  for (let cm = 0; cm <= D_MAX; cm++) label(String(cm), RL + cm * RP, RY + 25, { s: 13, col: '#222' });
  label('cm', end - 5, RY + 25, { s: 13, w: 600, col: '#222', a: 'right' });
}

// The lamp points along the ruler. Its light spreads out, so it's weaker further away.
function lamp(on) {
  if (on) {
  const g = c.createRadialGradient(140, LY, 0, 140, LY, 680);
  g.addColorStop(0, 'rgba(255, 224, 110, 0.85)'); g.addColorStop(0.1, 'rgba(255, 224, 110, 0.6)');
  g.addColorStop(0.4, 'rgba(255, 224, 110, 0.22)'); g.addColorStop(1, 'rgba(255, 224, 110, 0)');
  c.save();
  c.beginPath(); c.moveTo(148, LY - 44); c.lineTo(W, LY - 44 - (W - 148) * 0.2); c.lineTo(W, RY); c.lineTo(148, RY); c.closePath(); c.clip();
  c.fillStyle = g; c.fillRect(148, 0, W, RY);
  c.restore();
  }
  // The cable to its power supply, then the housing: a body and a cone, open at the front
  c.strokeStyle = '#2b2f36'; c.lineWidth = 5; c.beginPath(); c.moveTo(18, LY + 8); c.bezierCurveTo(-4, LY + 20, 6, LY + 60, -10, LY + 70); c.stroke();
  const hg = c.createLinearGradient(0, LY - 48, 0, LY + 48);
  hg.addColorStop(0, '#5b626d'); hg.addColorStop(0.45, '#2f343c'); hg.addColorStop(1, '#4a515c');
  c.fillStyle = hg;
  c.beginPath(); c.roundRect(16, LY - 26, 70, 52, 5); c.fill();
  c.beginPath(); c.moveTo(84, LY - 28); c.lineTo(146, LY - 46); c.lineTo(146, LY + 46); c.lineTo(84, LY + 28); c.closePath(); c.fill();
  c.fillStyle = on ? '#fff6cf' : '#8d939c'; c.beginPath(); c.ellipse(146, LY, 6, 45, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#2f343c'; c.lineWidth = 2; c.stroke();
  // The stand it sits on
  c.fillStyle = '#4a515c'; c.fillRect(70, LY + 26, 22, RY - LY - 26); c.fillRect(40, RY - 8, 82, 8);
  label(on ? 'Lamp: on' : 'Lamp: off', 84, LY - 64, { s: 16, w: 800 });
}

// The LDR on its holder. x is the front of the LDR, which is where the ruler is read.
function ldr(x, E) {
  const glow = clamp(Math.log10(E) / 4.4, 0, 1);
  // Light falling on its face
  const g = c.createRadialGradient(x - 2, LY, 0, x - 2, LY, 30);
  g.addColorStop(0, `rgba(255, 236, 150, ${0.75 * glow})`); g.addColorStop(1, 'rgba(255, 236, 150, 0)');
  c.fillStyle = g; c.beginPath(); c.arc(x - 2, LY, 30, 0, Math.PI * 2); c.fill();
  // The holder: a green board on a clamp that slides along the ruler
  c.fillStyle = '#2f8a3e'; c.fillRect(x + 4, LY - 30, 9, RY - 10 - (LY - 30));
  c.fillStyle = '#3a3f49'; c.beginPath(); c.roundRect(x - 12, RY - 12, 40, 12, 3); c.fill();
  // The LDR, seen side-on, facing the lamp
  c.fillStyle = '#7a3b1c'; c.beginPath(); c.roundRect(x, LY - 16, 6, 32, 2); c.fill();
  c.fillStyle = '#e8a04a'; c.fillRect(x, LY - 13, 2.5, 26);
  // Its two legs go to the terminals on the back of the holder
  c.strokeStyle = '#aab1bc'; c.lineWidth = 2;
  for (const dy of [-8, 8]) { c.beginPath(); c.moveTo(x + 6, LY + dy); c.lineTo(x + 20, LY + dy); c.stroke(); }
  for (const [dy, col] of [[-8, BLACK], [8, RED]]) { c.fillStyle = col; c.beginPath(); c.arc(x + 21, LY + dy, 4.5, 0, Math.PI * 2); c.fill(); }
  // Where to read the ruler
  c.strokeStyle = RED; c.lineWidth = 2; c.beginPath(); c.moveTo(x, LY + 18); c.lineTo(x, RY + 16); c.stroke();
}

function drawBench(cir) {
  c.setTransform(bench.width / W, 0, 0, bench.width / W, 0, 0);
  c.fillStyle = benchCol(); c.fillRect(0, 0, W, H);
  const x = ldrX(), d = dist();
  lamp(lampOn());
  ruler();
  ldr(x, lux(d));

  // The circuit: cells, ammeter and LDR in series, with the voltmeter across the LDR
  const bat = battery(250, 64, 2), A = { x: 500, y: 64 }, V = { x: 500, y: 186 };
  const t1 = { x: x + 21, y: LY - 8 }, t2 = { x: x + 21, y: LY + 8 };
  lead(bat.left, 64, bat.left - 60, 124, t1.x - 60, t1.y - 180, t1.x, t1.y, BLACK);   // under the battery, between the meters
  lead(bat.right, 64, bat.right + 40, 64, A.x - MW / 2 - 40, A.y, A.x - MW / 2, A.y, RED);
  lead(A.x + MW / 2, A.y, A.x + MW / 2 + 90, A.y + 20, t2.x + 120, t2.y - 60, t2.x, t2.y, RED);
  lead(V.x - MW / 2, V.y, V.x - MW / 2 - 50, V.y + 10, t1.x + 50, t1.y - 70, t1.x, t1.y, VLEAD);
  lead(V.x + MW / 2, V.y, V.x + MW / 2 + 50, V.y + 10, t2.x + 90, t2.y - 30, t2.x, t2.y, VLEAD);
  meter(A.x, A.y, 'Ammeter', mA(cir.I), 'mA');
  meter(V.x, V.y, 'Voltmeter', cir.V.toFixed(2), 'V');
  // Its name, on a patch of bench so the leads don't hide it
  const nx = Math.min(x + 6, W - 28);
  c.fillStyle = benchCol(); c.beginPath(); c.roundRect(nx - 22, LY - 58, 44, 24, 6); c.fill();
  label('LDR', nx, LY - 46, { s: 16, w: 800 });

  // How far the LDR is from the lamp
  const y = H - 18;
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(RL, y); c.lineTo(x, y); c.stroke();
  for (const [ax, dir] of [[RL, 1], [x, -1]]) { c.beginPath(); c.moveTo(ax, y); c.lineTo(ax + 9 * dir, y - 5); c.lineTo(ax + 9 * dir, y + 5); c.closePath(); c.fill(); }
  const tag = `${d} cm`;
  c.font = `800 16px ${font()}`;
  const tw = c.measureText(tag).width + 14, mid = x - RL < tw + 30 ? x + 8 + tw / 2 : (RL + x) / 2;   // beside a short arrow, not on it
  c.fillStyle = benchCol(); c.fillRect(mid - tw / 2, y - 12, tw, 24);
  label(tag, mid, y + 1, { s: 16, w: 800 });

  if (!state.moved) hint('Drag the LDR along the ruler', x < 560 ? x + 170 : x - 170, LY - 40);   // beside it, clear of the meters
}

PK.dragOn(bench, W, H, {
  hit: (p) => {
    if (Math.abs(p.x - (ldrX() + 8)) < 34 && p.y > LY - 60 && p.y < RY + 40) return { what: 'ldr' };
    if (p.x < 150 && p.y > LY - 80 && p.y < RY) return { what: 'lamp' };   // tap the lamp to switch it on or off
    return null;
  },
  move: (dr, p) => { if (dr.what === 'ldr') { state.moved = true; PK.setNum('dist', half(clamp((p.x - RL) / RP, D_MIN, D_MAX))); } },
  tap: (dr) => { if (dr.what === 'lamp') setLamp(!lampOn()); },
});
$('dist').addEventListener('input', () => { state.moved = true; });
$('dist').addEventListener('change', () => PK.setNum('dist', dist()));   // a typed 10.3 becomes 10.5

// ---------- The circuit diagram, drawn with the Circuit builder's symbols ----------

const dia = $('diagram'), dd = dia.getContext('2d');
let diagramKey = '';
function drawDiagram() {
  const key = `${dia.width}|${PK.cssVar('--text')}`;
  if (key === diagramKey || !dia.width) return;
  diagramKey = key;
  const DW = 270, DH = 190, k = dia.width / DW, S = window.CircuitSymbols, col = PK.cssVar('--text');
  dd.setTransform(k, 0, 0, k, 0, 0);
  dd.fillStyle = PK.cssVar('--surface'); dd.fillRect(0, 0, DW, DH);
  const L = 24, R = 246, T = 30, M = 108, B = 166, J1 = 74, J2 = 182;
  const w = (x1, y1, x2, y2) => S.place(dd, 'wire', x1, y1, x2, y2, col);
  S.place(dd, 'battery', L, T, R, T, col);
  w(R, T, R, M);
  S.place(dd, 'ammeter', J2, M, R, M, col); S.text(dd, 'A', (J2 + R) / 2, M, col, 15);
  S.place(dd, 'ldr', J1, M, J2, M, col);
  w(L, M, J1, M); w(L, T, L, M);
  w(J1, M, J1, B); w(J2, M, J2, B);
  S.place(dd, 'voltmeter', J1, B, J2, B, col); S.text(dd, 'V', (J1 + J2) / 2, B, col, 15);
  dd.fillStyle = col;
  for (const x of [J1, J2]) { dd.beginPath(); dd.arc(x, M, 4, 0, Math.PI * 2); dd.fill(); }
}

// ---------- Results ----------

const graph = $('graph'), g = graph.getContext('2d');
// The resistance axis is fixed at 0 to 12 000 Ω in steps of 2000, so it doesn't change as readings are added.
// The highest reading the bench can give is about 10 000 Ω, at 30 cm.
const AXIS = { step: 2000, n: 6 };
const resist = (r) => r.V / (r.I / 1000);
const points = () => state.rows.map((r) => ({ x: r.d, y: resist(r) }));
// A smooth curve of best fit: ln R = a + b ln d + c (ln d)², by least squares. Like a student, it waits
// until the readings show the shape: five or more distances, spread over at least 10 cm of the ruler,
// with no gap bigger than half that spread. It's only drawn between the readings, never beyond them.
const FIT_MIN = 5, FIT_SPREAD = 10;
const distances = (pts) => [...new Set(pts.map((p) => p.x))].sort((a, b) => a - b);
// Why there's no curve yet, or '' when there's enough
function notYet(pts) {
  const xs = distances(pts), more = FIT_MIN - xs.length;
  if (more > 0) return `Take readings at ${more} more distance${more > 1 ? 's' : ''} to draw the curve of best fit.`;
  const lo = xs[0], hi = xs[xs.length - 1];
  if (hi - lo < FIT_SPREAD) return `Your readings are bunched together, between ${lo} cm and ${hi} cm. Spread them out over at least ${FIT_SPREAD} cm of the ruler to draw the curve of best fit.`;
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] - xs[i - 1] > (hi - lo) / 2) return `There’s a big gap between ${xs[i - 1]} cm and ${xs[i]} cm. Take a reading in between to draw the curve of best fit.`;
  }
  return '';
}
function curveFit(pts) {
  const xs = distances(pts);
  if (notYet(pts)) return null;
  const rows = pts.map((p) => [1, Math.log(p.x), Math.log(p.x) ** 2, Math.log(p.y)]);
  const n = 3;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n + 1 }, (_, j) => rows.reduce((s, r) => s + r[i] * (j < n ? r[j] : r[3]), 0)));
  for (let i = 0; i < n; i++) {   // Gaussian elimination
    const piv = A[i][i];
    if (Math.abs(piv) < 1e-12) return null;
    for (let j = i; j <= n; j++) A[i][j] /= piv;
    for (let k = 0; k < n; k++) if (k !== i) { const f = A[k][i]; for (let j = i; j <= n; j++) A[k][j] -= f * A[i][j]; }
  }
  const [a, b, q = 0] = A.map((r) => r[n]);
  return { lo: Math.min(...xs), hi: Math.max(...xs), at: (d) => Math.exp(a + b * Math.log(d) + q * Math.log(d) ** 2) };
}
function drawGraph() {
  if (!graph.width) return;
  const GW = 800, GH = 340, k = graph.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const col = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent'), line: PK.cssVar('--accent') };
  const f = font(), pts = points();
  g.fillStyle = col.surface; g.fillRect(0, 0, GW, GH);
  const L = 84, R = 20, T = 16, B = 58, pw = GW - L - R, ph = GH - T - B;
  const ax = AXIS, yMax = ax.step * ax.n;
  const X = (x) => L + (x / D_MAX) * pw, Y = (y) => T + ph - (y / yMax) * ph;
  g.lineWidth = 1; g.font = `600 15px ${f}`;
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let x = 0; x <= D_MAX; x += 5) { g.strokeStyle = col.grid; g.beginPath(); g.moveTo(X(x), T); g.lineTo(X(x), T + ph); g.stroke(); g.fillStyle = col.muted; g.fillText(x, X(x), T + ph + 6); }
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= ax.n; i++) { const y = ax.step * i; g.strokeStyle = col.grid; g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(L + pw, Y(y)); g.stroke(); g.fillStyle = col.muted; g.fillText(ohms(y), L - 8, Y(y)); }
  g.strokeStyle = col.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = col.text; g.font = `700 16px ${f}`; g.textAlign = 'center'; g.textBaseline = 'bottom';
  g.fillText('Distance from the lamp (cm)', L + pw / 2, GH - 6);
  g.save(); g.translate(20, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('Resistance (Ω)', 0, 0); g.restore();
  const fit = curveFit(pts);
  if (fit && PK.answersShown()) {
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    g.strokeStyle = col.line; g.lineWidth = 2.5; g.beginPath();
    for (let i = 0; i <= 60; i++) { const d = fit.lo + ((fit.hi - fit.lo) * i) / 60; if (i) g.lineTo(X(d), Y(fit.at(d))); else g.moveTo(X(d), Y(fit.at(d))); }
    g.stroke(); g.restore();
  }
  g.strokeStyle = col.point; g.lineWidth = 2.5;
  for (const p of pts) { const x = X(p.x), y = Y(p.y); g.beginPath(); g.moveTo(x - 6, y - 6); g.lineTo(x + 6, y + 6); g.moveTo(x - 6, y + 6); g.lineTo(x + 6, y - 6); g.stroke(); }
}
function renderResults() {
  const rows = state.rows;
  $('table').innerHTML = rows.length
    ? `<table class="results"><thead><tr><th>Distance (cm)</th><th>p.d. (V)</th><th>Current (mA)</th><th>Resistance (Ω)</th><th><span class="sr-only">Delete</span></th></tr></thead>
      <tbody>${rows.map((r, n) => `<tr><td>${r.d}</td><td>${r.V.toFixed(2)}</td><td>${mA(r.I)}</td><td>${PK.ans(ohms(resist(r)))}</td><td><button class="del" data-row="${n}" aria-label="Delete reading ${n + 1}">✕</button></td></tr>`).join('')}</tbody></table>`
    : '<p class="note">No readings yet.</p>';
  const last = rows[rows.length - 1];
  $('working').innerHTML = last
    ? `${mA(last.I)} mA = ${amps(last.I)} A<br>Resistance = p.d. ÷ current = ${last.V.toFixed(2)} ÷ ${amps(last.I)} = ${PK.ans(`${ohms(resist(last))} Ω`)}`
    : '';
  const ds = rows.map((r) => r.d), lo = rows[ds.indexOf(Math.min(...ds))], hi = rows[ds.indexOf(Math.max(...ds))];
  const why = notYet(points()), toGo = why ? ` ${why}` : '';
  $('trend').innerHTML = lo && hi && lo.d !== hi.d
      ? `From ${lo.d} cm to ${hi.d} cm, the resistance went up from ${PK.ans(`${ohms(resist(lo))} Ω`)} to ${PK.ans(`${ohms(resist(hi))} Ω`)}.${toGo}`
      : 'Take readings at five or more distances to draw the curve of best fit.';
  drawGraph();
}
$('clear').addEventListener('click', () => { state.rows = []; renderResults(); });
$('table').addEventListener('click', (e) => { const b = e.target.closest('.del'); if (b) { state.rows.splice(Number(b.dataset.row), 1); renderResults(); } });

// ---------- Start ----------

function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  for (const [cv, w, h] of [[bench, W, H], [graph, 800, 340], [dia, 270, 190]]) {
    if (!cv.clientWidth) continue;
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr);
  }
  diagramKey = '';
}
function statusNow() {
  if (!lampOn()) return '<b>The lamp is off.</b> The LDR is in the dark, so its resistance is very high and hardly any current flows. Turn the lamp on to take readings.';
  if (!state.rows.length) return 'Put the LDR at a distance from the lamp, read both meters, then press <b>Record reading</b>.';
  return 'Move the LDR to a new distance and record another reading. Try at least five distances.';
}
let lastStatus = '';
function frame() {
  drawBench(circuit());
  drawDiagram();
  const s = statusNow();
  if (s !== lastStatus) { lastStatus = s; $('status').innerHTML = s; }
  requestAnimationFrame(frame);
}
window.addEventListener('resize', () => { sizeAll(); drawGraph(); });
window.addEventListener('pk-theme', () => { diagramKey = ''; drawGraph(); });
window.addEventListener('pk-answers', drawGraph);
sizeAll();
renderResults();
requestAnimationFrame(frame);

// Share: the readings (the distance and the lamp are shared anyway)
PK.shareState = {
  get: () => ({ r: state.rows.map((r) => [r.d, r.V, r.I]) }),
  set: (o) => {
    if (Array.isArray(o.r)) state.rows = o.r.map(([d, V, I]) => ({ d: Number(d), V: Number(V), I: Number(I) })).filter((r) => r.I > 0 && r.d > 0);
    state.moved = true;
    renderResults();
  },
};
