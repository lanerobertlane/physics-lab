// Acceleration practical: trolley + hanging mass system. The hanging weight accelerates the
// whole system: a = (m_hang g − friction) / (m_trolley + m_load + m_hang). Light gates time
// a 5 cm card to measure speed, and the time between gates gives a = (v − u) / t.

PK.header({
  title: 'Acceleration practical',
  answers: true,
  spec: [
    { code: '4.5.6.2.2', text: "Newton's second law: F = m a; acceleration is proportional to the resultant force and inversely proportional to the mass" },
    { code: '4.5.6.2.2', text: 'Required practical: investigate the effect of varying the force, and the mass, on the acceleration of an object' },
    { code: '4.5.6.1.5', text: 'Acceleration = change in velocity ÷ time taken' },
  ],
});

const $ = (id) => document.getElementById(id);
const G = 9.8, M_TROLLEY = 0.5, CARD = 0.05, GATE1 = 0.25, GATE2 = 0.85, RUN = 1.05, FRICTION = 0.25;
const state = { hang: 1, load: 4, friction: false, x: 0, v: 0, t: 0, running: false, g1: null, g2: null, rows: [] };

const mHang = () => state.hang * 0.1;
const mTotal = () => M_TROLLEY + state.load * 0.1 + mHang();
const force = () => mHang() * G;
function accel() {
  const f = force() - (state.friction ? FRICTION : 0);
  return Math.max(0, f) / mTotal();
}

function step(dt) {
  const a = accel();
  const x0 = state.x;
  state.v += a * dt; state.x += state.v * dt; state.t += dt;
  // Light gates: record when the card's front and back pass each gate
  for (const [key, gx] of [['g1', GATE1], ['g2', GATE2]]) {
    const g = state[key] || (state[key] = {});
    if (g.in == null && x0 < gx && state.x >= gx) g.in = state.t - (state.x - gx) / state.v;
    if (g.out == null && x0 < gx + CARD && state.x >= gx + CARD) g.out = state.t - (state.x - gx - CARD) / state.v;
  }
  if (state.x >= RUN || (a === 0 && state.v === 0)) { state.running = false; $('go').disabled = false; }
}

function readings() {
  const { g1, g2 } = state;
  if (!g1 || !g2 || g1.out == null || g2.out == null) return null;
  const u = CARD / (g1.out - g1.in), v = CARD / (g2.out - g2.in);
  const t = (g2.in + g2.out) / 2 - (g1.in + g1.out) / 2;
  return { u, v, t, a: (v - u) / t };
}

// ---------- Drawing ----------

const cv = $('bench'), ctx = cv.getContext('2d');
const W = 800, H = 320, X0 = 70, PPM = 560, BENCH_Y = 200;
function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
  const g = $('graph'); g.width = Math.round(g.clientWidth * dpr); g.height = Math.round(g.clientWidth * (220 / 270) * dpr);
}

function draw() {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  const font = c.font;
  // Bench and runway
  ctx.fillStyle = '#c9a66b'; ctx.fillRect(20, BENCH_Y, 690, 16);
  ctx.fillStyle = '#9a7a45'; ctx.fillRect(40, BENCH_Y + 16, 14, 100); ctx.fillRect(670, BENCH_Y + 16, 14, 100);
  ctx.fillStyle = '#7a828e'; ctx.fillRect(30, BENCH_Y - 8, 670, 8);
  // Pulley and string
  const px = 712, py = BENCH_Y - 4;
  ctx.fillStyle = '#5d6470'; ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill();
  const tx = X0 + state.x * PPM;
  const hangY = 230 + state.x * PPM * 0.12;
  ctx.strokeStyle = c.text; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(tx + 80, BENCH_Y - 26); ctx.lineTo(px, py - 12); ctx.moveTo(px + 12, py); ctx.lineTo(px + 12, Math.min(300, hangY)); ctx.stroke();
  // Hanging masses
  for (let i = 0; i < state.hang; i++) { ctx.fillStyle = i % 2 ? '#b08d57' : '#c9a66b'; ctx.fillRect(px - 4, Math.min(300, hangY) + i * 9, 32, 8); }
  ctx.fillStyle = c.text; ctx.font = `700 12px ${font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`${state.hang * 100} g`, px + 32, Math.min(300, hangY) + 8);
  // Light gates
  for (const [gx, label] of [[GATE1, 'light gate 1'], [GATE2, 'light gate 2']]) {
    const x = X0 + gx * PPM + 40;
    ctx.fillStyle = '#39414d'; ctx.fillRect(x - 6, BENCH_Y - 90, 12, 82);
    ctx.fillRect(x - 6, BENCH_Y - 96, 40, 10);
    ctx.fillStyle = c.muted; ctx.font = `600 11px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, x, BENCH_Y - 100);
  }
  // Trolley with card
  ctx.fillStyle = '#1e88e5'; ctx.fillRect(tx, BENCH_Y - 34, 80, 22);
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(tx + 16, BENCH_Y - 10, 6, 0, Math.PI * 2); ctx.arc(tx + 64, BENCH_Y - 10, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(tx + 34, BENCH_Y - 64, (CARD * PPM), 30);
  ctx.strokeStyle = c.text; ctx.lineWidth = 1; ctx.strokeRect(tx + 34, BENCH_Y - 64, CARD * PPM, 30);
  for (let i = 0; i < state.load; i++) { ctx.fillStyle = i % 2 ? '#b08d57' : '#c9a66b'; ctx.fillRect(tx + 6 + i * 9, BENCH_Y - 46, 8, 12); }
}

// ---------- Panel, results, graph ----------

function render() {
  $('hang-val').textContent = `${state.hang * 100} g`;
  $('load-val').textContent = `${state.load * 100} g`;
  $('setup').innerHTML = `
    <dt>Accelerating force</dt><dd>${PK.ans(`${force().toFixed(2)} N`)}</dd>
    <dt>Total mass moving</dt><dd>${mTotal().toFixed(2)} kg</dd>`;
  const r = readings();
  $('gates').innerHTML = r
    ? `<dt>Speed at gate 1 (u)</dt><dd>${r.u.toFixed(2)} m/s</dd><dt>Speed at gate 2 (v)</dt><dd>${r.v.toFixed(2)} m/s</dd><dt>Time between gates (t)</dt><dd>${r.t.toFixed(2)} s</dd>
       <dt>a = (v − u) ÷ t</dt><dd>${PK.ans(`${r.a.toFixed(2)} m/s²`)}</dd>`
    : '<dt>—</dt><dd>Release the trolley</dd>';
  $('record').disabled = !r;
}

function renderResults() {
  const rows = state.rows;
  $('table').innerHTML = rows.length ? `<table class="results"><thead><tr><th>F (N)</th><th>m (kg)</th><th>u (m/s)</th><th>v (m/s)</th><th>t (s)</th><th>a (m/s²)</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${PK.ans(r.F.toFixed(2))}</td><td>${r.m.toFixed(2)}</td><td class="n">${r.u.toFixed(2)}</td><td class="n">${r.v.toFixed(2)}</td><td class="n">${r.t.toFixed(2)}</td><td class="n">${PK.ans(r.a.toFixed(2))}</td></tr>`).join('')}</tbody></table>` : '<p class="note">No readings yet.</p>';
  drawGraph();
}

function drawGraph() {
  const g = $('graph').getContext('2d'), GW = 270, GH = 220, k = $('graph').width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent'), font: PK.cssVar('--font-body') || 'sans-serif' };
  g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
  const byF = $('axis').value === 'F';
  const L = 40, R = 10, T = 10, B = 34, pw = GW - L - R, ph = GH - T - B;
  const xMax = byF ? 5 : 1.6, yMax = Math.max(2, Math.ceil(Math.max(0, ...state.rows.map((r) => r.a))));
  const X = (x) => L + (x / xMax) * pw, Y = (y) => T + ph - (y / yMax) * ph;
  g.strokeStyle = c.grid; g.fillStyle = c.muted; g.font = `600 10px ${c.font}`; g.lineWidth = 1;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) { const y = (yMax * i) / 4; g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(L + pw, Y(y)); g.stroke(); g.fillText(parseFloat(y.toFixed(1)), L - 4, Y(y)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let i = 0; i <= 4; i++) { const x = (xMax * i) / 4; g.beginPath(); g.moveTo(X(x), T); g.lineTo(X(x), T + ph); g.stroke(); g.fillText(parseFloat(x.toFixed(2)), X(x), T + ph + 3); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 11px ${c.font}`; g.fillText(byF ? 'force / N' : 'total mass / kg', L + pw / 2, GH - 15);
  g.save(); g.translate(10, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('acceleration / m/s²', 0, 0); g.restore();
  g.strokeStyle = c.point; g.lineWidth = 2;
  for (const r of state.rows) { const x = X(byF ? r.F : r.m), y = Y(r.a); g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x - 4, y + 4); g.lineTo(x + 4, y - 4); g.stroke(); }
}

// ---------- Controls ----------

function pullBack() { Object.assign(state, { x: 0, v: 0, t: 0, running: false, g1: null, g2: null }); $('go').disabled = false; render(); }
document.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.k;
  state[k] = Math.max(k === 'hang' ? 1 : 0, Math.min(k === 'hang' ? 5 : 10, state[k] + Number(b.dataset.d)));
  pullBack();
}));
$('move').addEventListener('click', () => { if (state.load > 0 && state.hang < 5) { state.load--; state.hang++; pullBack(); } });
$('go').addEventListener('click', () => { pullBack(); state.running = true; $('go').disabled = true; });
$('back').addEventListener('click', pullBack);
$('friction').addEventListener('change', (e) => { state.friction = e.target.checked; pullBack(); });
$('record').addEventListener('click', () => { const r = readings(); if (r) { state.rows.push({ F: force(), m: mTotal(), ...r }); renderResults(); } });
$('clear').addEventListener('click', () => { state.rows = []; renderResults(); });
$('axis').addEventListener('change', drawGraph);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.03, (now - last) / 1000);
  last = now;
  if (state.running) { for (let i = 0; i < 10; i++) if (state.running) step(dt / 10); if (!state.running) render(); }
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { sizeAll(); drawGraph(); });
sizeAll();
render();
renderResults();
requestAnimationFrame(frame);
