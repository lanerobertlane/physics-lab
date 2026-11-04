// Stopping distances: thinking distance = speed × reaction time; braking distance = v² / (2a).
// With an alert driver on a dry road this matches the Highway Code (e.g. 96 m at 70 mph).

PK.header({
  title: 'Stopping distances',
  spec: [
    { code: '4.5.6.3.1', text: 'Stopping distance = thinking distance + braking distance' },
    { code: '4.5.6.3.2', text: 'Reaction time: typically 0.2–0.9 s; affected by tiredness, drugs, alcohol and distractions' },
    { code: '4.5.6.3.3', text: 'Factors affecting braking distance: wet or icy roads, poor brakes or tyres; the braking force does work to transfer kinetic energy' },
    { code: '4.5.6.3.4', text: 'Large decelerations and the work done by the brakes (W = F s = ½ m v²)', ht: true, po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const MPH = 0.44704;     // m/s per mph

const state = { mph: 30, react: 0.67, decel: 6.6, worn: false, mass: 1200, phase: 'ready', t: 0, x: 0 };

const v = () => state.mph * MPH;
// Road decelerations are for a 1200 kg car; the brakes give the same force for any car,
// so a heavier car decelerates less (a = F / m).
const a = () => state.decel * (1200 / state.mass) * (state.worn ? 0.7 : 1);
const thinking = () => v() * state.react;
const braking = () => (v() * v()) / (2 * a());

function reset() { state.phase = 'ready'; state.t = 0; state.x = 0; $('go').disabled = false; }

function step(dt) {
  if (state.phase === 'thinking') {
    state.x += v() * dt; state.t += dt;
    if (state.t >= state.react) { state.phase = 'braking'; state.t = 0; }
  } else if (state.phase === 'braking') {
    state.t += dt;
    const tb = v() / a();
    const tt = Math.min(state.t, tb);
    state.x = thinking() + v() * tt - 0.5 * a() * tt * tt;
    if (state.t >= tb) { state.phase = 'stopped'; state.x = thinking() + braking(); }
  }
}

// ---------- Drawing ----------

const road = $('road'), rctx = road.getContext('2d');
const chart = $('chart'), cctx = chart.getContext('2d');
function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
function sizeAll() { size(road, 800, 230); size(chart, 800, 280); drawChart(); }

function drawRoad() {
  const W = 800, H = 230, k = road.width / W;
  rctx.setTransform(k, 0, 0, k, 0, 0);
  const font = PK.cssVar('--font-body') || 'sans-serif';
  rctx.fillStyle = '#9ccc65'; rctx.fillRect(0, 0, W, H);
  rctx.fillStyle = '#4a4f57'; rctx.fillRect(0, 90, W, 70);
  // Scale the road so this stop fits, in steps of 50 m
  const maxStop = Math.max(100, Math.ceil((thinking() + braking()) / 50) * 50);
  const tick = maxStop > 300 ? 100 : 50;
  const ppm = 700 / maxStop, x0 = 60;
  rctx.fillStyle = '#fff';
  for (let m = 0; m <= maxStop; m += 10) rctx.fillRect(x0 + m * ppm - 6, 123, 12, 3);
  rctx.fillStyle = '#1b1f2a'; rctx.font = `600 11px ${font}`; rctx.textAlign = 'center'; rctx.textBaseline = 'top';
  for (let m = 0; m <= maxStop; m += tick) rctx.fillText(`${m} m`, x0 + m * ppm, 166);

  // Thinking and braking bars
  const tx = x0 + thinking() * ppm, bx = x0 + (thinking() + braking()) * ppm;
  rctx.fillStyle = '#ffb300'; rctx.fillRect(x0, 60, tx - x0, 18);
  rctx.fillStyle = '#e53935'; rctx.fillRect(tx, 60, bx - tx, 18);
  rctx.fillStyle = '#1b1f2a'; rctx.font = `700 13px ${font}`; rctx.textBaseline = 'bottom'; rctx.textAlign = 'left';
  rctx.fillText(`thinking ${thinking().toFixed(0)} m`, x0, 56);
  rctx.textAlign = 'right'; rctx.fillText(`braking ${braking().toFixed(0)} m`, Math.min(W - 6, bx), 56);

  // Hazard and car
  if (state.phase !== 'ready') {
    rctx.font = `800 26px ${font}`; rctx.textAlign = 'center'; rctx.textBaseline = 'middle';
    rctx.fillText('⚠', x0 - 30, 110);
  }
  const cx = x0 + state.x * ppm, y = 96;
  rctx.fillStyle = '#1e88e5';
  rctx.fillRect(cx - 46, y + 18, 46, 18); rctx.fillRect(cx - 36, y + 6, 26, 14);
  rctx.fillStyle = '#111'; rctx.beginPath(); rctx.arc(cx - 36, y + 38, 7, 0, Math.PI * 2); rctx.arc(cx - 10, y + 38, 7, 0, Math.PI * 2); rctx.fill();
  if (state.phase === 'braking' || state.phase === 'stopped') { rctx.fillStyle = '#ff1744'; rctx.fillRect(cx - 48, y + 22, 4, 8); }
  const label = { ready: 'Press Hazard!', thinking: 'Driver reacting… (thinking distance)', braking: 'Braking… (braking distance)', stopped: 'Stopped' }[state.phase];
  rctx.fillStyle = '#1b1f2a'; rctx.font = `700 15px ${font}`; rctx.textAlign = 'left'; rctx.textBaseline = 'top';
  rctx.fillText(label, 12, 10);
}

function drawChart() {
  const GW = 800, GH = 280, k = chart.width / GW;
  cctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), font: PK.cssVar('--font-body') || 'sans-serif' };
  cctx.fillStyle = c.surface; cctx.fillRect(0, 0, GW, GH);
  const speeds = [20, 30, 40, 50, 60, 70];
  const rows = speeds.map((s) => { const vv = s * MPH; return { s, th: vv * state.react, br: (vv * vv) / (2 * a()) }; });
  const max = Math.max(100, Math.ceil(Math.max(...rows.map((r) => r.th + r.br)) / 50) * 50);
  const L = 70, R = 20, T = 10, rowH = (GH - T - 30) / speeds.length;
  const X = (m) => L + (m / max) * (GW - L - R);
  cctx.strokeStyle = c.grid; cctx.fillStyle = c.muted; cctx.font = `600 11px ${c.font}`; cctx.textAlign = 'center'; cctx.textBaseline = 'top';
  for (let m = 0; m <= max; m += 50) { cctx.beginPath(); cctx.moveTo(X(m), T); cctx.lineTo(X(m), GH - 28); cctx.stroke(); cctx.fillText(`${m} m`, X(m), GH - 24); }
  rows.forEach((r, i) => {
    const y = T + i * rowH + 4, h = rowH - 8;
    cctx.fillStyle = '#ffb300'; cctx.fillRect(X(0), y, X(r.th) - X(0), h);
    cctx.fillStyle = '#e53935'; cctx.fillRect(X(r.th), y, X(r.th + r.br) - X(r.th), h);
    cctx.fillStyle = r.s === state.mph ? c.text : c.muted;
    cctx.font = `${r.s === state.mph ? 800 : 600} 12px ${c.font}`; cctx.textAlign = 'right'; cctx.textBaseline = 'middle';
    cctx.fillText(`${r.s} mph`, L - 8, y + h / 2);
    cctx.textAlign = 'left'; cctx.fillStyle = c.text; cctx.font = `700 11px ${c.font}`;
    cctx.fillText(`${(r.th + r.br).toFixed(0)} m`, X(r.th + r.br) + 6, y + h / 2);
  });
}

function renderPanel() {
  const vv = v(), th = thinking(), br = braking(), ke = 0.5 * state.mass * vv * vv, F = ke / br;
  $('speed-val').textContent = `${state.mph} mph (${vv.toFixed(1)} m/s)`;
  $('mass-val').textContent = `${state.mass} kg`;
  $('readout').innerHTML = `
    <dt>Thinking distance</dt><dd>${th.toFixed(1)} m</dd>
    <dt>Braking distance</dt><dd>${br.toFixed(1)} m</dd>
    <dt>Stopping distance</dt><dd>${(th + br).toFixed(1)} m</dd>
    <dt>That's about</dt><dd>${Math.max(1, Math.round((th + br) / 4.5))} car lengths</dd>`;
  $('working').innerHTML = `
    <p>Thinking: ${vv.toFixed(1)} m/s × ${state.react} s = <b>${th.toFixed(1)} m</b></p>
    <p>Kinetic energy: ½ × ${state.mass} × ${vv.toFixed(1)}² = <b>${Math.round(ke).toLocaleString()} J</b></p>
    <p>The brakes do this much work: W = F s, so the braking force ≈ ${Math.round(ke).toLocaleString()} ÷ ${br.toFixed(1)} = <b>${Math.round(F).toLocaleString()} N</b> <span class="tag ht">Higher</span></p>
    <p class="note" style="margin-top:4px">A heavier car has more kinetic energy, so the same braking force takes longer to stop it. The brakes get hot: the energy goes to their thermal store.</p>`;
  drawChart();
}

// ---------- Controls ----------

$('go').addEventListener('click', () => { reset(); state.phase = 'thinking'; $('go').disabled = true; });
$('reset').addEventListener('click', reset);
$('speed').addEventListener('input', (e) => { state.mph = Number(e.target.value); reset(); renderPanel(); });
$('driver').addEventListener('change', (e) => { state.react = Number(e.target.value); reset(); renderPanel(); });
$('road-type').addEventListener('change', (e) => { state.decel = Number(e.target.value); reset(); renderPanel(); });
$('worn').addEventListener('change', (e) => { state.worn = e.target.checked; reset(); renderPanel(); });
$('mass').addEventListener('input', (e) => {
  state.mass = Number(e.target.value); reset(); renderPanel();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  drawRoad();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeAll);
sizeAll();
renderPanel();
requestAnimationFrame(frame);
