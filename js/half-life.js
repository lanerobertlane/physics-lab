// Half-life: each undecayed nucleus decays at random with probability 1 − 2^(−dt / T½)
// in each small time step, so the number left halves (on average) every half-life.

PK.header({
  title: 'Half-life',
  spec: [
    { code: '4.4.2.1', text: 'Radioactive decay is random; activity is the rate at which unstable nuclei decay (becquerel, Bq)' },
    { code: '4.4.2.3', text: 'Half-lives and the random nature of radioactive decay; finding the half-life from a graph' },
    { code: '4.4.2.3', text: 'The net decline, as a ratio, after a given number of half-lives', ht: true },
  ],
});

const $ = (id) => document.getElementById(id);
const grid = $('grid'), gctx = grid.getContext('2d');
const curve = $('curve'), cctx = curve.getContext('2d');

const state = { n0: 400, half: 5, running: false, t: 0, nuclei: [], history: [], recent: [], expected: true };

function reset() {
  state.running = false;
  $('play').textContent = '▶ Start';
  state.t = 0;
  state.nuclei = Array.from({ length: state.n0 }, () => ({ decayed: false, flash: 0 }));
  state.history = [{ t: 0, n: state.n0 }];
  state.recent = [];
}

const left = () => state.nuclei.reduce((a, q) => a + (q.decayed ? 0 : 1), 0);

function step(dt) {
  const p = 1 - Math.pow(2, -dt / state.half);
  for (const q of state.nuclei) {
    if (!q.decayed && Math.random() < p) { q.decayed = true; q.flash = 1; state.recent.push(state.t); }
    if (q.flash > 0) q.flash -= dt * 2;
  }
  state.t += dt;
  while (state.recent.length && state.recent[0] < state.t - 1) state.recent.shift();
  const lastH = state.history[state.history.length - 1];
  if (state.t - lastH.t >= 0.25) state.history.push({ t: state.t, n: left() });
  if (left() === 0) { state.running = false; $('play').textContent = '▶ Start'; }
}

function sizeCanvases() {
  const dpr = window.devicePixelRatio || 1;
  grid.width = Math.round(grid.clientWidth * dpr); grid.height = grid.width;
  curve.width = Math.round(curve.clientWidth * dpr); curve.height = Math.round(curve.clientWidth * (300 / 800) * dpr);
}

function drawGrid() {
  const S = 420, k = grid.width / S;
  gctx.setTransform(k, 0, 0, k, 0, 0);
  gctx.fillStyle = PK.cssVar('--surface'); gctx.fillRect(0, 0, S, S);
  const side = Math.ceil(Math.sqrt(state.n0)), cell = S / side, r = cell * 0.38;
  state.nuclei.forEach((q, i) => {
    const x = (i % side + 0.5) * cell, y = (Math.floor(i / side) + 0.5) * cell;
    gctx.fillStyle = q.decayed ? (q.flash > 0 ? '#ffd23f' : '#c4c9d0') : '#7b3fe4';
    gctx.beginPath(); gctx.arc(x, y, q.flash > 0 ? r * (1 + q.flash * 0.6) : r, 0, Math.PI * 2); gctx.fill();
  });
}

function drawCurve() {
  const GW = 800, GH = 300, k = curve.width / GW;
  cctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), line: '#7b3fe4', mark: PK.cssVar('--f2'), font: PK.cssVar('--font-body') || 'sans-serif' };
  cctx.fillStyle = c.surface; cctx.fillRect(0, 0, GW, GH);
  const L = 60, R = 16, T = 12, B = 40, pw = GW - L - R, ph = GH - T - B;
  const tMax = state.half * 6;
  const X = (t) => L + (t / tMax) * pw, Y = (n) => T + ph - (n / state.n0) * ph;

  cctx.strokeStyle = c.grid; cctx.lineWidth = 1; cctx.fillStyle = c.muted; cctx.font = `600 11px ${c.font}`;
  cctx.textAlign = 'right'; cctx.textBaseline = 'middle';
  for (const f of [0, 0.25, 0.5, 0.75, 1]) { cctx.beginPath(); cctx.moveTo(L, Y(f * state.n0)); cctx.lineTo(L + pw, Y(f * state.n0)); cctx.stroke(); cctx.fillText(Math.round(f * state.n0), L - 6, Y(f * state.n0)); }
  cctx.textAlign = 'center'; cctx.textBaseline = 'top';
  for (let s = 0; s <= tMax; s += state.half) cctx.fillText(s, X(s), T + ph + 4);
  cctx.strokeStyle = c.text; cctx.lineWidth = 1.5;
  cctx.beginPath(); cctx.moveTo(L, T); cctx.lineTo(L, T + ph); cctx.lineTo(L + pw, T + ph); cctx.stroke();
  cctx.fillStyle = c.text; cctx.font = `700 12px ${c.font}`;
  cctx.fillText('time / s', L + pw / 2, GH - 16);
  cctx.save(); cctx.translate(14, T + ph / 2); cctx.rotate(-Math.PI / 2); cctx.textBaseline = 'middle'; cctx.fillText('undecayed nuclei', 0, 0); cctx.restore();

  if (state.expected) {
    // Smooth curve N = N₀ × (½)^(t / T½), with the half-life construction lines
    cctx.strokeStyle = c.muted; cctx.setLineDash([6, 5]); cctx.lineWidth = 1.5;
    cctx.beginPath();
    for (let t = 0; t <= tMax; t += tMax / 200) { const y = Y(state.n0 * Math.pow(0.5, t / state.half)); t === 0 ? cctx.moveTo(X(t), y) : cctx.lineTo(X(t), y); }
    cctx.stroke();
    cctx.strokeStyle = c.mark;
    for (let k2 = 1; k2 <= 3; k2++) {
      const n = state.n0 / 2 ** k2, x = X(state.half * k2);
      cctx.beginPath(); cctx.moveTo(L, Y(n)); cctx.lineTo(x, Y(n)); cctx.lineTo(x, T + ph); cctx.stroke();
      cctx.fillStyle = c.mark; cctx.font = `700 11px ${c.font}`; cctx.textAlign = 'left'; cctx.textBaseline = 'bottom';
      cctx.fillText(`${k2} half-li${k2 > 1 ? 'ves' : 'fe'}`, x + 4, T + ph - 4);
    }
    cctx.setLineDash([]);
  }
  // Measured
  cctx.strokeStyle = c.line; cctx.lineWidth = 2.5;
  cctx.beginPath();
  state.history.forEach((p, i) => (i ? cctx.lineTo(X(p.t), Y(p.n)) : cctx.moveTo(X(p.t), Y(p.n))));
  cctx.stroke();
}

function renderPanel() {
  const n = left(), halves = state.t / state.half;
  $('half-val').textContent = `${state.half} s`;
  $('readout').innerHTML = `
    <dt>Time</dt><dd>${state.t.toFixed(1)} s</dd>
    <dt>Half-lives gone</dt><dd>${halves.toFixed(2)}</dd>
    <dt>Undecayed nuclei</dt><dd>${n} of ${state.n0}</dd>
    <dt>Activity</dt><dd>${state.recent.length} Bq</dd>`;
  const whole = Math.floor(halves + 1e-9);
  $('working').innerHTML = whole >= 1
    ? `<p>After ${whole} half-li${whole > 1 ? 'ves' : 'fe'} we expect ${state.n0} × (½)<sup>${whole}</sup> = <b>${(state.n0 / 2 ** whole).toFixed(1)}</b> left (1/${2 ** whole} of the start).</p><p class="note" style="margin-top:4px">The real number left varies because decay is random. With more nuclei it gets closer to the prediction.</p>`
    : '<p>Press Start. Watch how long it takes for half of the nuclei to decay.</p>';
}

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.running) step(dt);
  drawGrid();
  drawCurve();
  if ((tick += dt) > 0.15) { tick = 0; renderPanel(); }
  requestAnimationFrame(frame);
}

$('play').addEventListener('click', () => {
  if (left() === 0) reset();
  state.running = !state.running;
  $('play').textContent = state.running ? '❚❚ Pause' : '▶ Start';
});
$('reset').addEventListener('click', () => { reset(); renderPanel(); });
$('count').addEventListener('change', (e) => { state.n0 = Number(e.target.value); reset(); renderPanel(); });
$('half').addEventListener('input', (e) => { state.half = Number(e.target.value); reset(); renderPanel(); });
$('expected').addEventListener('change', (e) => { state.expected = e.target.checked; });

window.addEventListener('resize', sizeCanvases);
sizeCanvases();
reset();
renderPanel();
requestAnimationFrame(frame);
