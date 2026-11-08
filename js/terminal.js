// Terminal velocity: a skydiver falls with weight W = m g down and air resistance D = k v² up.
// The resultant force (W − D) sets the acceleration. When D = W the skydiver reaches terminal
// velocity. Opening the parachute makes k much bigger, so they slow to a new, lower terminal velocity.

PK.header({
  title: 'Terminal velocity',
  answers: true,
  spec: [
    { code: '4.5.6.1.5', text: 'An object falling through a fluid first accelerates due to gravity; eventually the resultant force is zero and it moves at its terminal velocity' },
    { code: '4.5.6.2.1', text: "Newton's first law: zero resultant force means constant velocity" },
    { code: '4.5.6.2.2', text: "Newton's second law: F = m a" },
    { code: '4.5.6.1.5', text: 'Velocity–time graphs: the gradient is the acceleration' },
    { code: '4.5.6.1.5', text: 'Drawing and interpreting velocity–time graphs for objects that reach terminal velocity, and explaining the motion in terms of the forces', po: true },
    { code: 'KS3', text: 'Forces: air resistance, balanced and unbalanced forces, speed' },
  ],
});

const $ = (id) => document.getElementById(id);
const G = 9.8, H0 = 3000;
const K = { spread: 0.24, dive: 0.09, chute: 26 };   // drag constants, D = k v²

const state = { m: 80, body: 'spread', speedUp: 1 };
const sim = { phase: 'ready', t: 0, h: H0, v: 0, chute: 0, opening: false, log: [], cloudY: 0, landed: '' };

const kNow = () => K[state.body] + (K.chute - K[state.body]) * sim.chute;
const weight = () => state.m * G;
const drag = () => kNow() * sim.v * sim.v;
const accel = () => (sim.phase === 'falling' ? (weight() - drag()) / state.m : 0);
const terminal = (k) => Math.sqrt(weight() / k);

function reset() {
  Object.assign(sim, { phase: 'ready', t: 0, h: H0, v: 0, chute: 0, opening: false, log: [], landed: '' });
  $('jump').disabled = false; $('jump').textContent = '▶ Jump';
  $('chute').disabled = true;
  renderPanel();
}

function step(dt) {
  if (sim.phase !== 'falling') return;
  // The canopy takes about 3 s to open fully
  if (sim.opening && sim.chute < 1) sim.chute = Math.min(1, sim.chute + dt / 3);
  sim.v = Math.max(0, sim.v + accel() * dt);
  sim.h -= sim.v * dt;
  sim.t += dt;
  sim.cloudY += sim.v * dt;
  if (!sim.log.length || sim.t - sim.log[sim.log.length - 1].t > 0.2) sim.log.push({ t: sim.t, v: sim.v });
  if (sim.h <= 0) {
    sim.h = 0;
    sim.phase = 'landed';
    sim.log.push({ t: sim.t, v: sim.v });
    sim.landed = sim.v > 8
      ? `Landed at ${sim.v.toFixed(0)} m/s: far too fast! Open the parachute earlier.`
      : `Safe landing at ${sim.v.toFixed(1)} m/s.`;
    sim.v = 0;
    $('chute').disabled = true;
    $('jump').disabled = true;
  }
}

// ---------- Drawing ----------

const scene = $('scene'), ctx = scene.getContext('2d');
const graph = $('graph'), gctx = graph.getContext('2d');
const W = 800, H = 420, GW = 800, GH = 260;
function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
function sizeAll() { size(scene, W, H); size(graph, GW, GH); }

function arrow(c, x, y1, y2, col, label, side) {
  const dir = Math.sign(y2 - y1) || 1;
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2 - dir * 12); c.stroke();
  c.beginPath(); c.moveTo(x, y2); c.lineTo(x - 13, y2 - dir * 18); c.lineTo(x + 13, y2 - dir * 18); c.closePath(); c.fill();
  c.font = `800 15px ${PK.cssVar('--font-body') || 'sans-serif'}`; c.textBaseline = 'middle';
  c.textAlign = side < 0 ? 'right' : 'left';
  c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.85)';
  const lx = x + side * 20, ly = (y1 + y2) / 2;
  c.strokeText(label, lx, ly); c.fillText(label, lx, ly);
}

function drawScene() {
  const k = scene.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const font = PK.cssVar('--font-body') || 'sans-serif';
  // Sky gets lighter nearer the ground
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#5aa9e6'); sky.addColorStop(1, '#bfe3ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // Clouds drift upwards as the skydiver falls (a sense of speed)
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 7; i++) {
    const cx = (i * 137 + 60) % 560;
    const cy = ((i * 173 - sim.cloudY * 4) % (H + 120) + H + 120) % (H + 120) - 60;
    ctx.beginPath(); ctx.ellipse(cx, cy, 46, 16, 0, 0, Math.PI * 2); ctx.ellipse(cx + 30, cy - 8, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Ground comes into view for the last 250 m
  const CY = 200;
  if (sim.h < 250) {
    const gy = CY + 60 + sim.h * 1.2;
    ctx.fillStyle = '#6aa84f'; ctx.fillRect(0, gy, 560, H - gy + 1);
    ctx.fillStyle = '#4e8a37'; for (let x = 10; x < 560; x += 40) ctx.fillRect(x, gy, 18, 4);
  }

  // Skydiver (and parachute)
  const X = 280, f = sim.chute;
  if (f > 0) {
    const cw = 40 + 120 * f, ch = 20 + 50 * f, top = CY - 50 - 90 * f;
    ctx.fillStyle = '#e53935';
    ctx.beginPath(); ctx.ellipse(X, top + ch, cw, ch, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(X, top + ch, cw * 0.33, ch, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    for (const sx of [-1, -0.5, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(X + sx * cw, top + ch); ctx.lineTo(X, CY - 12); ctx.stroke(); }
  }
  ctx.fillStyle = '#263238'; ctx.strokeStyle = '#263238'; ctx.lineCap = 'round';
  if (state.body === 'dive' && f === 0) {
    // Head-down dive: streamlined
    ctx.beginPath(); ctx.arc(X, CY + 34, 11, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(X, CY + 22); ctx.lineTo(X, CY - 20); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X - 4, CY - 20); ctx.lineTo(X - 8, CY - 52); ctx.moveTo(X + 4, CY - 20); ctx.lineTo(X + 8, CY - 52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X - 6, CY + 16); ctx.lineTo(X - 6, CY + 44); ctx.moveTo(X + 6, CY + 16); ctx.lineTo(X + 6, CY + 44); ctx.stroke();
  } else {
    // Spread out (belly to the ground), or hanging under the canopy
    ctx.beginPath(); ctx.arc(X, CY - 22, 11, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(X, CY - 10); ctx.lineTo(X, CY + 22); ctx.stroke();
    ctx.lineWidth = 6;
    if (f > 0.3) { ctx.beginPath(); ctx.moveTo(X - 5, CY - 6); ctx.lineTo(X - 14, CY - 30); ctx.moveTo(X + 5, CY - 6); ctx.lineTo(X + 14, CY - 30); ctx.moveTo(X - 4, CY + 22); ctx.lineTo(X - 8, CY + 50); ctx.moveTo(X + 4, CY + 22); ctx.lineTo(X + 8, CY + 50); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(X - 5, CY - 4); ctx.lineTo(X - 36, CY - 20); ctx.moveTo(X + 5, CY - 4); ctx.lineTo(X + 36, CY - 20); ctx.moveTo(X - 4, CY + 22); ctx.lineTo(X - 30, CY + 40); ctx.moveTo(X + 4, CY + 22); ctx.lineTo(X + 30, CY + 40); ctx.stroke(); }
  }

  // Force arrows (length in proportion to the force; very large forces are capped)
  const scale = 110 / weight();
  const wLen = weight() * scale, dRaw = drag() * scale, dLen = Math.min(dRaw, 190);
  if (sim.phase !== 'landed') {
    arrow(ctx, X - 120, CY + 10, CY + 10 + wLen, '#1e63c6', 'weight', -1);
    if (drag() > 1) arrow(ctx, X + 120, CY + 10, CY + 10 - dLen, '#ea6a00', dRaw > 190 ? 'air resistance (off the scale)' : 'air resistance', 1);
  }

  // Altimeter and status on the right
  ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(560, 0, 240, H);
  ctx.fillStyle = '#1b1f2a'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.font = `700 13px ${font}`; ctx.fillText('Height', 580, 20);
  ctx.font = `800 28px ${font}`; ctx.fillText(`${Math.round(sim.h)} m`, 580, 38);
  ctx.font = `700 13px ${font}`; ctx.fillText('Speed', 580, 84);
  ctx.font = `800 28px ${font}`; ctx.fillText(`${sim.v.toFixed(1)} m/s`, 580, 102);
  // Height bar
  ctx.fillStyle = '#dfe6ee'; ctx.fillRect(580, 150, 24, 240);
  ctx.fillStyle = '#6aa84f'; ctx.fillRect(580, 386, 24, 4);
  const hy = 150 + 236 * (1 - sim.h / H0);
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(592, hy, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1f2a'; ctx.font = `600 13px ${font}`; ctx.fillText(`${H0} m`, 612, 146); ctx.fillText('ground', 612, 382);
  // What is happening
  ctx.font = `700 13px ${font}`;
  wrap(ctx, phaseText(), 612, 200, 175, 17);
}

function wrap(c, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (c.measureText(test).width > maxW && line) { c.fillText(line, x, y); y += lh; line = w; } else line = test;
  }
  if (line) c.fillText(line, x, y);
}

function phaseText() {
  if (sim.phase === 'ready') return 'Press Jump to leave the plane.';
  if (sim.phase === 'landed') return sim.landed;
  const a = accel();
  if (Math.abs(a) < 0.15) return 'Terminal velocity: the forces are balanced, so the speed stays the same.';
  return a > 0 ? 'Speeding up: the weight is bigger than the air resistance.' : 'Slowing down: the air resistance is bigger than the weight.';
}

function drawGraph() {
  const k = graph.width / GW;
  gctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), font: PK.cssVar('--font-body') || 'sans-serif' };
  gctx.fillStyle = c.surface; gctx.fillRect(0, 0, GW, GH);
  const L = 60, R = 20, T = 14, B = 40, pw = GW - L - R, ph = GH - T - B;
  const tMax = Math.max(60, Math.ceil(sim.t / 30) * 30);
  const vMax = Math.max(60, Math.ceil(terminal(K[state.body]) / 20) * 20);
  const X = (t) => L + (t / tMax) * pw, Y = (v) => T + ph - (Math.min(v, vMax) / vMax) * ph;
  gctx.strokeStyle = c.grid; gctx.fillStyle = c.muted; gctx.font = `600 13px ${c.font}`; gctx.lineWidth = 1;
  gctx.textAlign = 'right'; gctx.textBaseline = 'middle';
  for (let v = 0; v <= vMax; v += 10) { gctx.beginPath(); gctx.moveTo(L, Y(v)); gctx.lineTo(L + pw, Y(v)); gctx.stroke(); gctx.fillText(v, L - 6, Y(v)); }
  gctx.textAlign = 'center'; gctx.textBaseline = 'top';
  const step = tMax > 120 ? 20 : 10;
  for (let t = 0; t <= tMax; t += step) { gctx.beginPath(); gctx.moveTo(X(t), T); gctx.lineTo(X(t), T + ph); gctx.stroke(); gctx.fillText(t, X(t), T + ph + 4); }
  gctx.strokeStyle = c.text; gctx.lineWidth = 1.5; gctx.beginPath(); gctx.moveTo(L, T); gctx.lineTo(L, T + ph); gctx.lineTo(L + pw, T + ph); gctx.stroke();
  gctx.fillStyle = c.text; gctx.font = `700 13px ${c.font}`; gctx.fillText('time / s', L + pw / 2, GH - 18);
  gctx.save(); gctx.translate(16, T + ph / 2); gctx.rotate(-Math.PI / 2); gctx.textBaseline = 'middle'; gctx.fillText('velocity / m/s', 0, 0); gctx.restore();
  // Terminal velocities as dashed lines
  if ($('show-vt').checked) {
    gctx.setLineDash([6, 5]); gctx.lineWidth = 1.5; gctx.textAlign = 'right'; gctx.textBaseline = 'bottom'; gctx.font = `700 13px ${c.font}`;
    for (const [kk, label, col] of [[K[state.body], 'terminal velocity (no parachute)', '#1e63c6'], [K.chute, 'terminal velocity (parachute open)', '#e53935']]) {
      const vt = terminal(kk);
      gctx.strokeStyle = col; gctx.fillStyle = col;
      gctx.beginPath(); gctx.moveTo(L, Y(vt)); gctx.lineTo(L + pw, Y(vt)); gctx.stroke();
      gctx.fillText(`${label}: ${PK.ansText(vt.toFixed(1))} m/s`, L + pw - 4, Y(vt) - 2);
    }
    gctx.setLineDash([]);
  }
  const pts = [...sim.log, ...(sim.phase === 'falling' ? [{ t: sim.t, v: sim.v }] : [])];
  if (pts.length > 1) {
    gctx.strokeStyle = PK.cssVar('--accent'); gctx.lineWidth = 3;
    gctx.beginPath(); pts.forEach((p, i) => (i ? gctx.lineTo(X(p.t), Y(p.v)) : gctx.moveTo(X(p.t), Y(p.v)))); gctx.stroke();
  }
}

// ---------- Panel ----------

function renderPanel() {
  const D = drag(), Wt = weight(), F = sim.phase === 'falling' ? Wt - D : 0;
  $('readout').innerHTML = `
    <dt>Weight (W = m g)</dt><dd>${PK.ans(`${Wt.toFixed(0)} N`)}</dd>
    <dt>Air resistance</dt><dd>${D.toFixed(0)} N</dd>
    <dt>Resultant force</dt><dd>${PK.ans(`${Math.abs(F).toFixed(0)} N ${Math.abs(F) < 1 ? '' : F > 0 ? 'down' : 'up'}`)}</dd>
    <dt>Acceleration (a = F ÷ m)</dt><dd>${PK.ans(`${(sim.phase === 'falling' && Math.abs(accel()) >= 0.005 ? accel() : 0).toFixed(2)} m/s²`)}</dd>`;
}

// ---------- Controls ----------

$('jump').addEventListener('click', () => {
  if (sim.phase === 'ready') { sim.phase = 'falling'; $('chute').disabled = false; $('jump').textContent = '❚❚ Pause'; return; }
  if (sim.phase === 'falling') { sim.phase = 'paused'; $('jump').textContent = '▶ Carry on'; return; }
  if (sim.phase === 'paused') { sim.phase = 'falling'; $('jump').textContent = '❚❚ Pause'; }
});
$('chute').addEventListener('click', () => { sim.opening = true; $('chute').disabled = true; });
$('reset').addEventListener('click', reset);
$('mass').addEventListener('input', () => { state.m = PK.num('mass'); renderPanel(); });
document.querySelectorAll('#body .chip').forEach((b) => b.addEventListener('click', () => {
  state.body = b.dataset.b;
  document.querySelectorAll('#body .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));
document.querySelectorAll('#speed .chip').forEach((b) => b.addEventListener('click', () => {
  state.speedUp = Number(b.dataset.s);
  document.querySelectorAll('#speed .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const n = 8 * state.speedUp;
  for (let i = 0; i < n; i++) step((dt * state.speedUp) / n);
  drawScene(); drawGraph();
  if ((tick += dt) > 0.15) { tick = 0; renderPanel(); }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeAll);
sizeAll();
reset();
requestAnimationFrame(frame);
