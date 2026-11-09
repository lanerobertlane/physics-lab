// Resistance of a wire (required practical). The clips and leads add a small fixed resistance,
// which is the zero error on the graph, and the current slowly heats the wire, raising its resistance.

PK.header({
  title: 'Resistance of a wire',
  answers: true,
  spec: [
    { code: '4.2.1.3', text: 'Required practical: use circuit diagrams to set up and check circuits to investigate the factors affecting resistance, including the length of a wire at constant temperature' },
    { code: '4.2.1.3', text: 'Potential difference = current × resistance: V = I R' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const R_CLIPS = 0.4;   // ohms: the clips and their contacts, which are inside the voltmeter's leads
// Ohms per metre, and how much the resistance rises per °C (constantan hardly changes at all)
const WIRES = { nichrome: { perM: 13.7, a: 0.0004 }, thick: { perM: 4.47, a: 0.0004 }, constantan: { perM: 6.09, a: 0.00002 } };
const SEGS = 100, MELT = 400;   // the wire is 100 pieces, each 1 cm long with its own temperature rise. At MELT it burns through.
const state = { closed: false, rise: new Array(SEGS).fill(0), broken: null, meltAt: -1e9, rows: [], moved: false, tapped: false };
const wireNow = () => WIRES[$('wire').value] || WIRES.nichrome;
const hottest = (to = SEGS) => Math.max(...state.rise.slice(0, to));
const gapInCircuit = () => state.broken != null && state.broken < PK.num('len');   // a melted gap between the two clips

function circuit() {
  const w = wireNow(), n = PK.num('cells'), L = PK.num('len'), emf = 1.5 * n;
  if (gapInCircuit()) return { I: 0, V: state.closed ? emf : 0 };   // no current, but the voltmeter still reads across the gap
  let Rs = R_CLIPS;
  for (let i = 0; i < L; i++) Rs += (w.perM / 100) * (1 + w.a * state.rise[i]);
  const I = state.closed ? emf / (0.3 * n + 0.1 + Rs) : 0;   // the cells and the leads have a little resistance too
  return { I, V: I * Rs };
}
// Only wire carrying a current gets hotter. Each piece settles at a temperature set by its own
// heating, so everything else cools down.
function stepHeat(dt, now) {
  const { I } = circuit(), w = wireNow(), L = PK.num('len'), fade = 1 - Math.exp(-dt / 6);
  state.rise = state.rise.map((rise, i) => {
    const heat = i < L ? I * I * w.perM * (1 + w.a * rise) : 0;   // watts per metre of wire
    return rise + (800 * (1 - Math.exp((-15 * heat) / 800)) - rise) * fade;
  });
  const melted = state.rise.map((rise, i) => (rise >= MELT ? i : -1)).filter((i) => i >= 0);
  if (melted.length && I > 0) {   // it gives way in the middle of the hottest stretch
    state.broken = (melted[0] + melted[melted.length - 1]) / 2 + 0.5;
    state.meltAt = now;
    $('new-wire').hidden = false;
  }
}
function newWire() { state.rise.fill(0); state.broken = null; warned = false; $('new-wire').hidden = true; }
$('new-wire').addEventListener('click', newWire);
$('wire').addEventListener('change', newWire);

function setSwitch(on) {
  state.closed = on;
  $('sw-btn').textContent = on ? 'Open the switch' : 'Close the switch';
  $('sw-btn').setAttribute('aria-pressed', String(on));
  diagramKey = '';
}
$('sw-btn').addEventListener('click', () => { state.tapped = true; setSwitch(!state.closed); });

$('rec').addEventListener('click', () => {
  if (!state.closed) { PK.toast('Close the switch first, so there’s something to read'); return; }
  if (gapInCircuit()) { PK.toast('The wire has melted, so there’s no current to read'); return; }
  if (state.rows.length >= 30) { PK.toast('The table is full. Clear it to carry on.'); return; }
  const { I, V } = circuit();
  state.rows.push({ L: PK.num('len'), V: Number(V.toFixed(2)), I: Number(I.toFixed(3)) });
  warned = hottest(PK.num('len')) > 30;
  renderResults();
});
let warned = false;

// ---------- The bench ----------

const bench = $('bench'), c = bench.getContext('2d');
const W = 800, H = 440, RL = 70, RP = 6.4, RY = 338, WY = 330;
const clipX = () => RL + PK.num('len') * RP;
const RED = '#d0392b', BLACK = '#23272e', VLEAD = '#2563eb', INK = '#1c2430', BENCH = '#e8eef5';   // the same in every theme, so the black leads always show
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
function flag(s, x, y, col) {
  c.font = `800 15px ${font()}`;
  const w = c.measureText(s).width + 14;
  c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - w / 2, y - 12, w, 24, 7); c.fill();
  label(s, x, y, { s: 15, w: 800, col });
}
function lead(x1, y1, cx1, cy1, cx2, cy2, x2, y2, col) {
  c.strokeStyle = col; c.lineWidth = 3.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2); c.stroke(); c.lineCap = 'butt';
}
function meter(cx, cy, name, value, unit) {
  const w = 132, h = 78;
  c.fillStyle = '#343a45'; c.beginPath(); c.roundRect(cx - w / 2, cy - h / 2, w, h, 9); c.fill();
  c.fillStyle = '#cfe6c4'; c.fillRect(cx - 52, cy - 30, 104, 40);
  c.fillStyle = '#17231a'; c.font = `800 26px ui-monospace, Consolas, monospace`; c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillText(value, cx + 26, cy - 9);
  c.font = `800 22px ${font()}`; c.textAlign = 'left'; c.fillText(unit, cx + 30, cy - 9);
  label(name, cx, cy + 25, { s: 14, col: '#fff' });
  for (const [x, col] of [[cx - w / 2, BLACK], [cx + w / 2, RED]]) { c.fillStyle = col; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, cy, 6, 0, Math.PI * 2); c.fill(); c.stroke(); }
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
  label(`${(1.5 * n).toFixed(1)} V`, cx, cy + 42, { s: 15, w: 800 });
  return { left: cx - w / 2, right: cx + w / 2 };
}
const SW = { x1: 96, x2: 166, y: 66 };
function knife(closed) {
  c.fillStyle = '#b48a5a'; c.beginPath(); c.roundRect(SW.x1 - 12, SW.y - 6, SW.x2 - SW.x1 + 24, 22, 5); c.fill();
  c.strokeStyle = '#555c68'; c.lineWidth = 6; c.lineCap = 'round';
  const a = closed ? 0 : -0.62, len = SW.x2 - SW.x1;
  c.beginPath(); c.moveTo(SW.x1, SW.y); c.lineTo(SW.x1 + Math.cos(a) * len, SW.y + Math.sin(a) * len); c.stroke(); c.lineCap = 'butt';
  for (const x of [SW.x1, SW.x2]) { c.fillStyle = '#2e333c'; c.beginPath(); c.arc(x, SW.y, 6, 0, Math.PI * 2); c.fill(); }
  label(closed ? 'Closed' : 'Open', (SW.x1 + SW.x2) / 2, SW.y + 32, { s: 14, w: 800, col: closed ? '#15803d' : '#576070' });
}
function clip(x, col) {
  c.save(); c.translate(x, WY);
  c.fillStyle = col;
  c.beginPath(); c.moveTo(-5, 0); c.lineTo(-8, -32); c.lineTo(8, -32); c.lineTo(5, 0); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-6, -26, 12, 4); c.fillRect(-6, -18, 12, 4);
  c.fillStyle = '#aab1bc'; c.fillRect(-4, -3, 8, 7);
  c.restore();
}
// Wire colour: grey when cool, then dark red, then orange just before it melts
function wireColour(rise) {
  const f = clamp((rise - 60) / (MELT - 60), 0, 1), mix = (a, b, t) => Math.round(a + (b - a) * t);
  const [from, to, t] = f < 0.5 ? [[107, 114, 128], [190, 40, 30], f * 2] : [[190, 40, 30], [255, 165, 30], f * 2 - 1];
  return `rgb(${mix(from[0], to[0], t)}, ${mix(from[1], to[1], t)}, ${mix(from[2], to[2], t)})`;
}

function drawBench(cir, now) {
  c.setTransform(bench.width / W, 0, 0, bench.width / W, 0, 0);
  c.fillStyle = BENCH; c.fillRect(0, 0, W, H);
  const x = clipX(), L = PK.num('len'), n = PK.num('cells');

  // The metre ruler
  c.fillStyle = '#f6e7a3'; c.fillRect(RL - 10, RY, 100 * RP + 20, 34);
  c.strokeStyle = '#333'; c.lineWidth = 1;
  for (let cm = 0; cm <= 100; cm++) { const tx = RL + cm * RP; c.beginPath(); c.moveTo(tx, RY); c.lineTo(tx, RY + (cm % 10 ? (cm % 5 ? 6 : 10) : 15)); c.stroke(); }
  for (let cm = 0; cm <= 100; cm += 10) label(String(cm), RL + cm * RP, RY + 25, { s: 14, col: '#222' });

  // The wire on the ruler
  c.strokeStyle = '#8b93a0'; c.lineWidth = 3; c.beginPath(); c.moveTo(RL - 8, WY); c.lineTo(RL + 100 * RP + 8, WY); c.stroke();
  c.strokeStyle = '#6b7280'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(RL, WY); c.lineTo(x, WY); c.stroke();
  // Each centimetre shows its own temperature, so only the part that carried the current looks hot
  state.rise.forEach((rise, i) => {
    if (rise < 60) return;
    const x1 = RL + i * RP, x2 = x1 + RP;
    if (rise > 180) { c.strokeStyle = '#ff7a1a'; c.globalAlpha = clamp((rise - 180) / 220, 0, 0.45); c.lineWidth = 11; c.beginPath(); c.moveTo(x1, WY); c.lineTo(x2, WY); c.stroke(); c.globalAlpha = 1; }
    c.strokeStyle = wireColour(rise); c.lineWidth = 3.5; c.beginPath(); c.moveTo(x1 - 0.5, WY); c.lineTo(x2 + 0.5, WY); c.stroke();
  });
  if (state.broken != null) {   // the melted gap, with a blob of metal on each end
    const gx = RL + state.broken * RP;
    c.fillStyle = BENCH; c.fillRect(gx - 7, WY - 7, 14, 14);
    c.fillStyle = '#3a3f49';
    for (const s of [-1, 1]) { c.beginPath(); c.arc(gx + s * 7, WY, 3.5, 0, Math.PI * 2); c.fill(); }
  }

  // Equipment
  const bat = battery(330, 64, n);
  lead(SW.x1, SW.y, 34, 96, 40, 262, RL, WY - 32, BLACK);
  lead(SW.x2, SW.y, 190, 66, bat.left - 26, 66, bat.left, 64, BLACK);
  lead(bat.right, 64, bat.right + 30, 64, 500, 64, 524, 64, RED);
  lead(656, 64, 770, 80, x + 90, 210, x, WY - 32, RED);
  lead(334, 192, 240, 192, 110, 226, RL + 3, WY - 32, VLEAD);
  lead(466, 192, 506, 200, x + 30, 240, x - 3, WY - 32, VLEAD);
  knife(state.closed);
  meter(590, 64, 'Ammeter', cir.I.toFixed(3), 'A');
  meter(400, 192, 'Voltmeter', cir.V.toFixed(2), 'V');
  clip(RL, BLACK); clip(x, RED);

  // How long the wire is
  const y = H - 22;
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(RL, y); c.lineTo(x, y); c.stroke();
  for (const [ax, dir] of [[RL, 1], [x, -1]]) { c.beginPath(); c.moveTo(ax, y); c.lineTo(ax + 9 * dir, y - 5); c.lineTo(ax + 9 * dir, y + 5); c.closePath(); c.fill(); }
  const tag = `${L} cm`;
  c.font = `800 16px ${font()}`;
  const tw = c.measureText(tag).width + 14, mid = x - RL < tw + 30 ? x + 8 + tw / 2 : (RL + x) / 2;   // beside a short arrow, not on it
  c.fillStyle = BENCH; c.fillRect(mid - tw / 2, y - 12, tw, 24);
  label(tag, mid, y + 1, { s: 16, w: 800 });

  // What can be moved, and how the wire is doing
  if (!state.moved) {
    const tx = clamp(x, 170, W - 150);
    hint('Drag the red clip along the wire', tx, WY - 58);
  }
  if (!state.tapped) hint('Tap the switch to close it', 176, 130);
  if (state.broken != null) {
    const gx = RL + state.broken * RP, age = now - state.meltAt;
    flag('Melted!', clamp(gx, 110, W - 90), WY - 48, '#c62828');
    if (age >= 0 && age < 800) {   // sparks as it gives way
      const f = age / 800;
      c.fillStyle = '#ff8a1f'; c.globalAlpha = 1 - f;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = 6 + 46 * f; c.beginPath(); c.arc(gx + Math.cos(a) * r, WY + Math.sin(a) * r * 0.8, 3.5 * (1 - f) + 1, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1;
    }
  } else {
    // The label sits over whichever part of the wire is actually hot
    const hot = state.rise.map((rise, i) => (rise > 30 ? i : -1)).filter((i) => i >= 0);
    if (hot.length) {
      const peak = Math.max(...hot.map((i) => state.rise[i])), spot = RL + ((hot[0] + hot[hot.length - 1] + 1) / 2) * RP;
      flag(peak > 250 ? 'Glowing!' : peak > 120 ? 'Hot!' : 'Getting warm', clamp(spot, 110, W - 90), WY - 48, peak > 120 ? '#c62828' : '#b45309');
    }
  }
}

PK.dragOn(bench, W, H, {
  hit: (p) => {
    if (p.x > SW.x1 - 22 && p.x < SW.x2 + 22 && p.y > 18 && p.y < 110) return { what: 'switch' };
    if (Math.abs(p.x - clipX()) < 34 && p.y > WY - 60 && p.y < RY + 40) return { what: 'clip' };
    return null;
  },
  move: (d, p) => { if (d.what === 'clip') { state.moved = true; PK.setNum('len', Math.round(clamp((p.x - RL) / RP, 5, 100))); } },
  tap: (d) => { if (d.what === 'switch') { state.tapped = true; setSwitch(!state.closed); } },
});
$('len').addEventListener('input', () => { state.moved = true; });

// ---------- The circuit diagram, drawn with the Circuit builder's symbols ----------

const dia = $('diagram'), d = dia.getContext('2d');
let diagramKey = '';
function drawDiagram() {
  const key = `${state.closed}|${PK.num('cells')}|${dia.width}|${PK.cssVar('--text')}`;
  if (key === diagramKey || !dia.width) return;
  diagramKey = key;
  const DW = 270, DH = 190, k = dia.width / DW, S = window.CircuitSymbols, col = PK.cssVar('--text');
  d.setTransform(k, 0, 0, k, 0, 0);
  d.fillStyle = PK.cssVar('--surface'); d.fillRect(0, 0, DW, DH);
  const L = 24, R = 246, T = 38, M = 104, B = 166, J1 = 74, J2 = 182;
  const w = (x1, y1, x2, y2) => S.place(d, 'wire', x1, y1, x2, y2, col);
  S.place(d, PK.num('cells') > 1 ? 'battery' : 'cell', L, T, 135, T, col);
  S.place(d, 'switch', 135, T, R, T, col, 2.5, { open: !state.closed });
  w(R, T, R, M);
  S.place(d, 'ammeter', J2, M, R, M, col); S.text(d, 'A', (J2 + R) / 2, M, col, 15);
  S.place(d, 'resistor', J1, M, J2, M, col);
  w(L, M, J1, M); w(L, T, L, M);
  w(J1, M, J1, B); w(J2, M, J2, B);
  S.place(d, 'voltmeter', J1, B, J2, B, col); S.text(d, 'V', (J1 + J2) / 2, B, col, 15);
  d.fillStyle = col;
  for (const x of [J1, J2]) { d.beginPath(); d.arc(x, M, 4, 0, Math.PI * 2); d.fill(); }
  S.text(d, 'test wire', (J1 + J2) / 2, M - 20, col, 13);
}

// ---------- Results ----------

const graph = $('graph'), g = graph.getContext('2d');
function niceTop(x) { const p = 10 ** Math.floor(Math.log10(x)); const n = x / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
const points = () => state.rows.map((r) => ({ x: r.L, y: r.V / r.I }));
function bestFit(pts) {
  if (pts.length < 2 || new Set(pts.map((p) => p.x)).size < 2) return null;
  const n = pts.length, sx = pts.reduce((a, p) => a + p.x, 0), sy = pts.reduce((a, p) => a + p.y, 0);
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0), sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { m, c: (sy - m * sx) / n };
}
function drawGraph() {
  if (!graph.width) return;
  const GW = 800, GH = 340, k = graph.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const col = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent'), line: PK.cssVar('--accent') };
  const f = font(), pts = points();
  g.fillStyle = col.surface; g.fillRect(0, 0, GW, GH);
  const L = 74, R = 20, T = 16, B = 58, pw = GW - L - R, ph = GH - T - B;
  const yMax = niceTop(Math.max(2, ...pts.map((p) => p.y)) * 1.02);
  const X = (x) => L + (x / 100) * pw, Y = (y) => T + ph - (y / yMax) * ph;
  g.lineWidth = 1; g.font = `600 15px ${f}`;
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let x = 0; x <= 100; x += 10) { g.strokeStyle = col.grid; g.beginPath(); g.moveTo(X(x), T); g.lineTo(X(x), T + ph); g.stroke(); g.fillStyle = col.muted; g.fillText(x, X(x), T + ph + 6); }
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= 5; i++) { const y = (yMax * i) / 5; g.strokeStyle = col.grid; g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(L + pw, Y(y)); g.stroke(); g.fillStyle = col.muted; g.fillText(parseFloat(y.toFixed(2)), L - 8, Y(y)); }
  g.strokeStyle = col.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = col.text; g.font = `700 16px ${f}`; g.textAlign = 'center'; g.textBaseline = 'bottom';
  g.fillText('Length of wire (cm)', L + pw / 2, GH - 6);
  g.save(); g.translate(20, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('Resistance (Ω)', 0, 0); g.restore();
  const fit = bestFit(pts);
  if (fit && PK.answersShown()) {
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    g.strokeStyle = col.line; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(0), Y(fit.c)); g.lineTo(X(100), Y(fit.m * 100 + fit.c)); g.stroke(); g.restore();
  }
  g.strokeStyle = col.point; g.lineWidth = 2.5;
  for (const p of pts) { const x = X(p.x), y = Y(p.y); g.beginPath(); g.moveTo(x - 6, y - 6); g.lineTo(x + 6, y + 6); g.moveTo(x - 6, y + 6); g.lineTo(x + 6, y - 6); g.stroke(); }
}
function renderResults() {
  const rows = state.rows;
  $('table').innerHTML = rows.length
    ? `<table class="results"><thead><tr><th>Length (cm)</th><th>p.d. (V)</th><th>Current (A)</th><th>Resistance (Ω)</th><th><span class="sr-only">Delete</span></th></tr></thead>
      <tbody>${rows.map((r, n) => `<tr><td>${r.L}</td><td>${r.V.toFixed(2)}</td><td>${r.I.toFixed(3)}</td><td>${PK.ans((r.V / r.I).toFixed(2))}</td><td><button class="del" data-row="${n}" aria-label="Delete reading ${n + 1}">✕</button></td></tr>`).join('')}</tbody></table>`
    : '<p class="note">No readings yet.</p>';
  const last = rows[rows.length - 1];
  $('working').innerHTML = last ? `Resistance = p.d. ÷ current = ${last.V.toFixed(2)} ÷ ${last.I.toFixed(3)} = ${PK.ans(`${(last.V / last.I).toFixed(2)} Ω`)}` : '';
  const fit = bestFit(points());
  $('grad').innerHTML = fit
    ? `The line of best fit goes up by ${PK.ans(`${(fit.m * 10).toFixed(2)} Ω`)} for every 10 cm, and crosses the resistance axis at ${PK.ans(`${fit.c.toFixed(2)} Ω`)}.`
    : 'Take readings at different lengths to draw the line.';
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
  const peak = hottest(PK.num('len'));
  if (gapInCircuit()) return '<b>The wire has melted!</b> So much current flowed that it got hot enough to break. The circuit isn’t complete now, so there’s no current. Put on a new wire, then use a longer length or fewer cells.';
  if (!state.closed) return state.rows.length ? 'The switch is open, so the wire can cool. Move the clip, then close the switch for the next reading.' : 'Close the switch to let a current flow, then read the two meters.';
  if (peak > 250) return '<b>The wire is glowing!</b> Open the switch now, or it will melt.';
  if (peak > 120) return '<b>The wire is hot.</b> That raises its resistance, so this wouldn’t be a fair reading. Open the switch and let it cool.';
  if (peak > 30) return '<b>The wire is warming up,</b> and its resistance is creeping up. Take your reading quickly, then open the switch.';
  if (warned) return 'That reading was taken with a warm wire, so its resistance is a little high. Open the switch between readings.';
  return 'Read both meters, then press <b>Record reading</b>.';
}
let lastStatus = '', lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, now - lastFrame) / 1000); lastFrame = now;
  stepHeat(dt, now);
  if (!state.closed && hottest() < 1) warned = false;
  drawBench(circuit(), now);
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

// Share: the readings and the switch (the length, cells and wire are shared anyway)
PK.shareState = {
  get: () => ({ r: state.rows.map((r) => [r.L, r.V, r.I]), s: state.closed ? 1 : 0, b: state.broken }),
  set: (o) => {
    if (Array.isArray(o.r)) state.rows = o.r.map(([L, V, I]) => ({ L: Number(L), V: Number(V), I: Number(I) })).filter((r) => r.I > 0);
    setSwitch(Boolean(o.s));
    state.broken = o.b == null ? null : Number(o.b);
    $('new-wire').hidden = state.broken == null;
    state.moved = true; state.tapped = true;
    renderResults();
  },
};
