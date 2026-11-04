// Motion graphs: a car's motion (driven with pedals or a ready-made journey) plotted live
// as distance–time and velocity–time graphs.

PK.header({
  title: 'Motion graphs',
  spec: [
    { code: '4.5.6.1.2', text: 'Speed: distance travelled = speed × time' },
    { code: '4.5.6.1.4', text: 'Distance–time relationship: the gradient of a distance–time graph is the speed' },
    { code: '4.5.6.1.5', text: 'Acceleration: a = Δv ÷ t; the gradient of a velocity–time graph is the acceleration' },
    { code: '4.5.6.1.5', text: 'The distance travelled is the area under a velocity–time graph', ht: true },
    { code: 'KS3', text: 'Speed and the quantitative relationship between average speed, distance and time; distance–time graphs' },
  ],
});

const $ = (id) => document.getElementById(id);
const T_MAX = 30, V_MAX = 20;

const JOURNEYS = [
  { name: 'Drive it yourself', v0: 0, segs: null },
  { name: 'Stationary', v0: 0, segs: [[30, 0]] },
  { name: 'Steady speed', v0: 10, segs: [[30, 0]] },
  { name: 'Speeding up', v0: 0, segs: [[20, 1], [10, 0]] },
  { name: 'Slowing down', v0: 20, segs: [[20, -1], [10, 0]] },
  { name: 'Stop–start journey', v0: 0, segs: [[5, 2], [5, 0], [5, -2], [4, 0], [6, 1.5], [5, -1.8]] },
];

const state = { journey: 0, running: false, t: 0, d: 0, v: 0, a: 0, pedal: 0, area: false, log: [] };

function reset() {
  const j = JOURNEYS[state.journey];
  Object.assign(state, { running: false, t: 0, d: 0, v: j.v0, a: 0 });
  state.log = [{ t: 0, d: 0, v: j.v0 }];
  $('play').textContent = '▶ Start';
}

function scriptedAccel(t) {
  const segs = JOURNEYS[state.journey].segs;
  if (!segs) return state.pedal > 0 ? 2 : state.pedal < 0 ? -3 : 0;
  let s = 0;
  for (const [dur, a] of segs) { if (t < s + dur) return a; s += dur; }
  return 0;
}

function step(dt) {
  state.a = scriptedAccel(state.t);
  state.v = Math.max(0, Math.min(V_MAX, state.v + state.a * dt));
  if ((state.v === 0 && state.a < 0) || (state.v === V_MAX && state.a > 0)) state.a = 0;
  state.d += state.v * dt;
  state.t += dt;
  const last = state.log[state.log.length - 1];
  if (state.t - last.t >= 0.1) state.log.push({ t: state.t, d: state.d, v: state.v });
  if (state.t >= T_MAX) { state.running = false; $('play').textContent = '▶ Start'; }
}

// ---------- Drawing ----------

const road = $('road'), rctx = road.getContext('2d');
const dtc = $('dt'), dctx = dtc.getContext('2d');
const vtc = $('vt'), vctx = vtc.getContext('2d');

function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
function sizeAll() { size(road, 800, 150); size(dtc, 400, 260); size(vtc, 400, 260); }

function drawRoad() {
  const W = 800, H = 150, k = road.width / W;
  rctx.setTransform(k, 0, 0, k, 0, 0);
  const font = PK.cssVar('--font-body') || 'sans-serif';
  rctx.fillStyle = '#9ccc65'; rctx.fillRect(0, 0, W, H);
  rctx.fillStyle = '#4a4f57'; rctx.fillRect(0, 70, W, 60);
  // Distance markers scroll past (1 m = 8 px); the car stays near the middle
  const ppm = 8, carX = 260;
  rctx.fillStyle = '#fff'; rctx.font = `700 12px ${font}`; rctx.textAlign = 'center'; rctx.textBaseline = 'top';
  const first = Math.floor((state.d - carX / ppm) / 10) * 10;
  for (let m = first; m < state.d + (W - carX) / ppm + 10; m += 10) {
    const x = carX + (m - state.d) * ppm;
    rctx.fillRect(x - 12, 98, 24, 4);
    if (m >= 0 && m % 50 === 0) { rctx.fillStyle = '#222'; rctx.fillText(`${m} m`, x, 132); rctx.fillStyle = '#fff'; }
  }
  // Car
  const y = 76;
  rctx.fillStyle = '#e53935';
  rctx.beginPath(); rctx.moveTo(carX - 40, y + 36); rctx.lineTo(carX - 40, y + 18); rctx.lineTo(carX - 24, y + 14); rctx.lineTo(carX - 14, y + 2); rctx.lineTo(carX + 18, y + 2); rctx.lineTo(carX + 30, y + 14); rctx.lineTo(carX + 42, y + 18); rctx.lineTo(carX + 42, y + 36); rctx.closePath(); rctx.fill();
  rctx.fillStyle = '#bfe3ff'; rctx.fillRect(carX - 10, y + 6, 12, 9); rctx.fillRect(carX + 5, y + 6, 12, 9);
  rctx.fillStyle = '#111'; rctx.beginPath(); rctx.arc(carX - 22, y + 37, 8, 0, Math.PI * 2); rctx.arc(carX + 24, y + 37, 8, 0, Math.PI * 2); rctx.fill();
  if (state.a < 0) { rctx.fillStyle = '#ff1744'; rctx.fillRect(carX - 42, y + 20, 5, 7); }
  rctx.fillStyle = '#1b1f2a'; rctx.font = `700 16px ${font}`; rctx.textAlign = 'left'; rctx.textBaseline = 'top';
  rctx.fillText(`t = ${state.t.toFixed(1)} s    distance = ${state.d.toFixed(1)} m    speed = ${state.v.toFixed(1)} m/s`, 12, 10);
}

function axes(g, title, yLabel, yMax, yStep) {
  const GW = 400, GH = 260;
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), font: PK.cssVar('--font-body') || 'sans-serif' };
  g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
  const L = 48, R = 10, T = 26, B = 36, pw = GW - L - R, ph = GH - T - B;
  const X = (t) => L + (t / T_MAX) * pw, Y = (y) => T + ph - (y / yMax) * ph;
  g.strokeStyle = c.grid; g.lineWidth = 1; g.fillStyle = c.muted; g.font = `600 10px ${c.font}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let y = 0; y <= yMax + 1e-9; y += yStep) { g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(L + pw, Y(y)); g.stroke(); g.fillText(y, L - 4, Y(y)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let t = 0; t <= T_MAX; t += 5) { g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), T + ph); g.stroke(); g.fillText(t, X(t), T + ph + 3); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 12px ${c.font}`; g.fillText('time / s', L + pw / 2, GH - 16);
  g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(title, L, 6);
  g.save(); g.translate(12, T + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 11px ${c.font}`; g.fillText(yLabel, 0, 0); g.restore();
  return { X, Y, T, ph };
}

function drawGraphs() {
  const dMax = Math.max(100, Math.ceil(Math.max(...state.log.map((p) => p.d), state.d) / 100) * 100);
  for (const [cv, g, key, title, yl, yMax, yStep, col] of [
    [dtc, dctx, 'd', 'Distance–time graph', 'distance / m', dMax, dMax / 5, PK.cssVar('--f1')],
    [vtc, vctx, 'v', 'Velocity–time graph', 'velocity / m/s', V_MAX, 5, PK.cssVar('--f2')],
  ]) {
    const k = cv.width / 400;
    g.setTransform(k, 0, 0, k, 0, 0);
    const ax = axes(g, title, yl, yMax, yStep);
    if (key === 'v' && state.area && state.log.length > 1) {
      g.fillStyle = 'rgba(234, 88, 12, .18)';
      g.beginPath(); g.moveTo(ax.X(0), ax.Y(0));
      for (const p of state.log) g.lineTo(ax.X(p.t), ax.Y(p.v));
      g.lineTo(ax.X(state.log[state.log.length - 1].t), ax.Y(0)); g.closePath(); g.fill();
      g.fillStyle = PK.cssVar('--text'); g.font = `700 12px ${PK.cssVar('--font-body') || 'sans-serif'}`; g.textAlign = 'right'; g.textBaseline = 'top';
      g.fillText(`area = ${state.d.toFixed(0)} m`, 390, 30);
    }
    g.strokeStyle = col; g.lineWidth = 2.5;
    g.beginPath(); state.log.forEach((p, i) => (i ? g.lineTo(ax.X(p.t), ax.Y(p[key])) : g.moveTo(ax.X(p.t), ax.Y(p[key])))); g.stroke();
  }
}

function renderPanel() {
  const what = state.v === 0 ? 'stationary' : state.a > 0 ? 'speeding up' : state.a < 0 ? 'slowing down' : 'constant speed';
  $('readout').innerHTML = `
    <dt>Time</dt><dd>${state.t.toFixed(1)} s</dd>
    <dt>Distance</dt><dd>${state.d.toFixed(1)} m</dd>
    <dt>Velocity</dt><dd>${state.v.toFixed(1)} m/s</dd>
    <dt>Acceleration</dt><dd>${state.a.toFixed(1)} m/s²</dd>
    <dt>Motion</dt><dd>${what}</dd>`;
}

// ---------- Controls ----------

$('journey').innerHTML = JOURNEYS.map((j, i) => `<option value="${i}">${j.name}</option>`).join('');
$('journey').addEventListener('change', (e) => {
  state.journey = Number(e.target.value);
  document.querySelectorAll('.pedal').forEach((b) => { b.disabled = JOURNEYS[state.journey].segs !== null; });
  reset();
});
$('play').addEventListener('click', () => {
  if (state.t >= T_MAX) reset();
  state.running = !state.running;
  $('play').textContent = state.running ? '❚❚ Pause' : '▶ Start';
});
$('reset').addEventListener('click', reset);
$('area').addEventListener('change', (e) => { state.area = e.target.checked; });
for (const [id, dir] of [['accel', 1], ['brake', -1]]) {
  const b = $(id);
  const on = (e) => { e.preventDefault(); state.pedal = dir; if (!state.running && state.t < T_MAX) { state.running = true; $('play').textContent = '❚❚ Pause'; } };
  const off = () => { state.pedal = 0; };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
}
window.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') state.pedal = 1; if (e.key === 'ArrowDown') state.pedal = -1; });
window.addEventListener('keyup', (e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') state.pedal = 0; });

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.running) step(dt);
  drawRoad(); drawGraphs();
  if ((tick += dt) > 0.1) { tick = 0; renderPanel(); }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeAll);
sizeAll();
reset();
renderPanel();
requestAnimationFrame(frame);
