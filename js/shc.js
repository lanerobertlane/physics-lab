// Specific heat capacity: a 1 kg block heated by a 50 W heater. The block warms as
// m c dθ/dt = P − k (θ − θ_room); without insulation k is bigger, so more energy is lost
// and the measured c comes out too high.

PK.header({
  title: 'Specific heat capacity',
  answers: true,
  spec: [
    { code: '4.1.1.3', text: 'Energy changes in systems: ΔE = m c Δθ; specific heat capacity' },
    { code: '4.1.1.3', text: 'Required practical: determine the specific heat capacity of one or more materials' },
    { code: '4.1.2.1', text: 'Reducing unwanted energy transfers with thermal insulation' },
  ],
});

const $ = (id) => document.getElementById(id);
const MATS = {
  aluminium: { name: 'Aluminium', c: 900, col: '#c3c9d2' },
  copper: { name: 'Copper', c: 385, col: '#d08a52' },
  iron: { name: 'Iron', c: 450, col: '#8a8f98' },
  water: { name: 'Water', c: 4200, col: '#7fb8ff' },
};
const M = 1, P = 50, V = 12, ROOM = 20;
const state = { mat: 'aluminium', insulated: true, on: false, speed: 10, t: 0, E: 0, temp: ROOM, rows: [] };

function step(dt) {
  const k = state.insulated ? 0.08 : 0.9;     // W per °C lost to the room
  const input = state.on ? P : 0;
  state.temp += ((input - k * (state.temp - ROOM)) / (M * MATS[state.mat].c)) * dt;
  state.E += input * dt;
  state.t += dt;
}

// ---------- Drawing ----------

const rig = $('rig'), ctx = rig.getContext('2d');
const W = 800, H = 380;
function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  rig.width = Math.round(rig.clientWidth * dpr); rig.height = Math.round(rig.clientWidth * (H / W) * dpr);
  const g = $('graph'); g.width = Math.round(g.clientWidth * dpr); g.height = Math.round(g.clientWidth * (220 / 270) * dpr);
}

function draw() {
  const k = rig.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  const m = MATS[state.mat];
  const bx = 150, by = 150, bw = 220, bh = 190;

  if (state.insulated) {
    ctx.fillStyle = '#f2e6c9';
    ctx.fillRect(bx - 22, by - 10, bw + 44, bh + 22);
    ctx.strokeStyle = '#d8c79c'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(bx - 11 + (i % 2) * (bw + 22), by + i * 14, 8, 0, Math.PI * 2); ctx.stroke(); }
  }
  // Block (or beaker of water)
  const warm = Math.min(1, (state.temp - ROOM) / 40);
  ctx.fillStyle = m.col; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = `rgba(255, 80, 30, ${warm * 0.35})`; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = c.text; ctx.font = `700 14px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${m.name} · 1 kg`, bx + bw / 2, by + bh - 20);

  // Heater
  ctx.fillStyle = state.on ? '#ff7043' : '#5d6470';
  ctx.fillRect(bx + 50, by - 70, 22, 190);
  if (state.on) { ctx.fillStyle = 'rgba(255,140,60,.35)'; ctx.beginPath(); ctx.arc(bx + 61, by + 80, 40, 0, Math.PI * 2); ctx.fill(); }
  // Thermometer
  ctx.fillStyle = '#fff'; ctx.strokeStyle = c.text; ctx.lineWidth = 1.5;
  ctx.fillRect(bx + 150, by - 110, 14, 220); ctx.strokeRect(bx + 150, by - 110, 14, 220);
  const fill = Math.min(1, (state.temp - 0) / 100);
  ctx.fillStyle = '#e53935'; ctx.fillRect(bx + 154, by + 110 - fill * 200, 6, fill * 200);
  ctx.beginPath(); ctx.arc(bx + 157, by + 116, 10, 0, Math.PI * 2); ctx.fill();

  // Power pack and joulemeter
  ctx.fillStyle = '#39414d'; ctx.fillRect(500, 70, 240, 110);
  ctx.fillStyle = '#0d1a0d'; ctx.fillRect(520, 90, 200, 50);
  ctx.fillStyle = '#7CFC00'; ctx.font = `700 26px ui-monospace, Consolas, monospace`; ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(state.E)} J`, 710, 116);
  ctx.fillStyle = '#fff'; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'center';
  ctx.fillText(`joulemeter · heater ${P} W (${V} V)`, 620, 162);
  ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx + 61, by - 70); ctx.lineTo(bx + 61, 50); ctx.lineTo(560, 50); ctx.lineTo(560, 70); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + 66, by - 70); ctx.lineTo(bx + 66, 60); ctx.lineTo(600, 60); ctx.lineTo(600, 70); ctx.stroke();

  // Readouts
  ctx.fillStyle = c.text; ctx.font = `700 18px ${c.font}`; ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${state.temp.toFixed(1)} °C`, bx + 142, by - 58);   // beside the thermometer, below the heater wires
  ctx.font = `600 14px ${c.font}`; ctx.fillStyle = c.muted;
  ctx.fillText(`time: ${Math.floor(state.t / 60)} min ${String(Math.floor(state.t % 60)).padStart(2, '0')} s`, 500, 220);
}

// ---------- Panel, results, graph ----------

function renderPanel() {
  $('readout').innerHTML = `
    <dt>Temperature</dt><dd>${state.temp.toFixed(1)} °C</dd>
    <dt>Energy supplied</dt><dd>${Math.round(state.E)} J</dd>
    <dt>Heater</dt><dd>${state.on ? 'on' : 'off'}</dd>`;
}

function renderResults() {
  const rows = state.rows, first = rows[0];
  // Changes are measured from the first reading.
  $('table').innerHTML = rows.length ? `<table class="results"><thead><tr><th>Time (s)</th><th>Energy (J)</th><th>Temp. (°C)</th><th>ΔE (J)</th><th>Δθ (°C)</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${Math.round(r.t)}</td><td class="n">${Math.round(r.E)}</td><td class="n">${r.T.toFixed(1)}</td>
      <td class="n">${PK.ans(Math.round(r.E - first.E))}</td><td class="n">${PK.ans((r.T - first.T).toFixed(1))}</td></tr>`).join('')}</tbody></table>` : '<p class="note">No readings yet.</p>';
  const lastRow = rows[rows.length - 1];
  const dE = rows.length >= 2 ? lastRow.E - first.E : 0, dT = rows.length >= 2 ? lastRow.T - first.T : 0;
  if (dE > 0 && dT > 0.05) {
    const cVal = dE / (M * dT), real = MATS[state.mat].c;
    $('answer').innerHTML = `Using the first and last readings:<br>c = ΔE ÷ (m Δθ) = ${PK.ans(Math.round(dE))} ÷ (${M} × ${PK.ans(dT.toFixed(1))}) = <b>${PK.ans(`${Math.round(cVal)} J/kg °C`)}</b><br>
      <span class="note hide-when-no-answers">Accepted value for ${MATS[state.mat].name.toLowerCase()}: ${real} J/kg °C (${cVal > real * 1.02 ? `${Math.round(((cVal - real) / real) * 100)}% too high: some energy heated the surroundings` : 'good agreement'}).</span>`;
  } else $('answer').innerHTML = 'Record a reading at the start, then more while heating.';
  drawGraph();
}

function drawGraph() {
  const cv = $('graph'), g = cv.getContext('2d'), GW = 270, GH = 220, k = cv.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent'), font: PK.cssVar('--font-body') || 'sans-serif' };
  g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
  const L = 40, R = 10, T = 10, B = 34, pw = GW - L - R, ph = GH - T - B;
  const eMax = Math.max(10000, Math.ceil(Math.max(0, ...state.rows.map((r) => r.E)) / 10000) * 10000);
  const tMax = Math.max(40, Math.ceil(Math.max(0, ...state.rows.map((r) => r.T)) / 10) * 10);
  const X = (e) => L + (e / eMax) * pw, Y = (t) => T + ph - ((t - 0) / tMax) * ph;
  g.strokeStyle = c.grid; g.fillStyle = c.muted; g.font = `600 10px ${c.font}`; g.lineWidth = 1;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let t = 0; t <= tMax; t += tMax / 4) { g.beginPath(); g.moveTo(L, Y(t)); g.lineTo(L + pw, Y(t)); g.stroke(); g.fillText(Math.round(t), L - 4, Y(t)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let e = 0; e <= eMax; e += eMax / 4) { g.beginPath(); g.moveTo(X(e), T); g.lineTo(X(e), T + ph); g.stroke(); g.fillText(`${e / 1000}k`, X(e), T + ph + 3); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 11px ${c.font}`; g.fillText('energy supplied / J', L + pw / 2, GH - 15);
  g.save(); g.translate(10, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('temperature / °C', 0, 0); g.restore();
  g.strokeStyle = c.point; g.lineWidth = 2;
  for (const r of state.rows) { const x = X(r.E), y = Y(r.T); g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x - 4, y + 4); g.lineTo(x + 4, y - 4); g.stroke(); }
}

// ---------- Controls & loop ----------

function resetAll() { Object.assign(state, { on: false, t: 0, E: 0, temp: ROOM, rows: [] }); $('heat').textContent = '🔥 Switch heater on'; renderPanel(); renderResults(); }
$('heat').addEventListener('click', () => { state.on = !state.on; $('heat').textContent = state.on ? '■ Switch heater off' : '🔥 Switch heater on'; });
$('reset').addEventListener('click', resetAll);
$('speed').addEventListener('change', (e) => { state.speed = Number(e.target.value); });
$('mat').addEventListener('change', (e) => { state.mat = e.target.value; resetAll(); });
$('insulate').addEventListener('change', (e) => { state.insulated = e.target.checked; });
$('record').addEventListener('click', () => { state.rows.push({ t: state.t, E: state.E, T: state.temp }); renderResults(); });
$('clear').addEventListener('click', () => { state.rows = []; renderResults(); });

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const sim = dt * state.speed, n = Math.ceil(sim / 0.5);
  for (let i = 0; i < n; i++) step(sim / n);
  draw();
  if ((tick += dt) > 0.2) { tick = 0; renderPanel(); }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { sizeAll(); renderResults(); });
sizeAll();
renderPanel();
renderResults();
requestAnimationFrame(frame);
