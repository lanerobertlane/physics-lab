// Energy stores: bouncing ball, skate ramp and pendulum. Tracks kinetic (Ek = ½ m v²),
// gravitational potential (Ep = m g h) and thermal energy dissipated by friction/air resistance.

PK.header({
  title: 'Energy stores',
  spec: [
    { code: '4.1.1.1', text: 'Energy stores and systems: energy transfers when a ball is dropped, when a moving object slows down, etc.' },
    { code: '4.1.1.2', text: 'Changes in energy: Ek = ½ m v² and Ep = m g h' },
    { code: '4.1.2.1', text: 'Energy transfers in a system: energy is conserved, and wasted energy is dissipated to the surroundings' },
    { code: 'KS3', text: 'Energy changes and transfers; comparing the starting and finishing energy of a system; dissipation' },
  ],
});

const $ = (id) => document.getElementById(id);
const G = 9.8;
const W = 800, H = 460;
const RAMP_L = 5, PEND_L = 5;

const SCENES = {
  ball: { name: 'Bouncing ball' },
  ramp: { name: 'Skate ramp' },
  pendulum: { name: 'Pendulum' },
};

const state = { scene: 'ball', m: 2, h0: 5, friction: false, speed: 1, running: false, showGraph: true };
const sim = { t: 0, y: 0, v: 0, x: 0, u: 0, th: 0, w: 0, resting: false };
let trace = [];   // energy readings over time for the graph

// ---------- Physics ----------

const rampH = (x) => state.h0 * (x / RAMP_L) ** 2;

function reset() {
  sim.t = 0; sim.resting = false;
  if (state.scene === 'ball') { sim.y = state.h0; sim.v = 0; }
  if (state.scene === 'ramp') { sim.x = -RAMP_L; sim.u = 0; }
  if (state.scene === 'pendulum') { sim.th = -Math.acos(1 - state.h0 / PEND_L); sim.w = 0; }
  trace = [];
  record();
}

function height() {
  if (state.scene === 'ball') return Math.max(0, sim.y);
  if (state.scene === 'ramp') return rampH(sim.x);
  return PEND_L * (1 - Math.cos(sim.th));
}

function speed() {
  if (state.scene === 'ball') return Math.abs(sim.v);
  if (state.scene === 'ramp') return Math.abs(sim.u);
  return Math.abs(sim.w) * PEND_L;
}

function energies() {
  const e0 = state.m * G * state.h0;
  const ek = 0.5 * state.m * speed() ** 2;
  const ep = state.m * G * height();
  const eth = state.friction ? Math.max(0, e0 - ek - ep) : 0;
  return { e0, ek, ep, eth };
}

function step(dt) {
  const m = state.m, fr = state.friction;
  if (state.scene === 'ball') {
    if (sim.resting) return;
    const drag = fr ? 0.06 * sim.v * Math.abs(sim.v) / m : 0;
    sim.v += (-G - drag) * dt;
    sim.y += sim.v * dt;
    if (sim.y < 0) {
      sim.y = -sim.y;
      sim.v = -sim.v * (fr ? 0.8 : 1);   // a bounce loses energy to sound and heating when friction is on
      if (fr && sim.v < 0.4) { sim.v = 0; sim.y = 0; sim.resting = true; }
    }
  } else if (state.scene === 'ramp') {
    if (sim.resting) return;
    const slope = (2 * state.h0 * sim.x) / RAMP_L ** 2;
    const th = Math.atan(slope);
    let a = -G * Math.sin(th);
    if (fr) {
      const mu = 0.04;
      if (Math.abs(sim.u) < 0.03 && Math.abs(G * Math.sin(th)) <= mu * G * Math.cos(th)) { sim.u = 0; sim.resting = true; return; }
      a -= Math.sign(sim.u || -slope) * (mu * G * Math.cos(th) + 0.03 * sim.u * sim.u / m);
    }
    sim.u += a * dt;
    sim.x += sim.u * Math.cos(th) * dt;
    if (sim.x > RAMP_L) { sim.x = RAMP_L; sim.u = -Math.abs(sim.u); }
    if (sim.x < -RAMP_L) { sim.x = -RAMP_L; sim.u = Math.abs(sim.u); }
  } else {
    const a = -(G / PEND_L) * Math.sin(sim.th) - (fr ? 0.12 * sim.w : 0);
    sim.w += a * dt;
    sim.th += sim.w * dt;
  }
}

function record() {
  const e = energies();
  trace.push({ t: sim.t, ...e });
  if (trace.length > 2000) trace.shift();
}

// ---------- Scene drawing ----------

const canvas = $('scene');
const ctx = canvas.getContext('2d');

function sizeCanvases() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
  const g = $('graph');
  g.width = Math.round(g.clientWidth * dpr);
  g.height = Math.round(g.clientWidth * (220 / 800) * dpr);
}

function colours() {
  return {
    surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'),
    border: PK.cssVar('--border-strong'), art: PK.cssVar('--art'), grid: PK.cssVar('--grid'),
    ek: PK.cssVar('--f2'), ep: PK.cssVar('--f1'), eth: PK.cssVar('--f4'), total: PK.cssVar('--f8'),
    font: PK.cssVar('--font-body') || 'sans-serif',
  };
}

function ruler(c, x, groundY, pxPerM, maxM) {
  ctx.strokeStyle = c.muted;
  ctx.fillStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, groundY - maxM * pxPerM); ctx.stroke();
  ctx.font = `600 12px ${c.font}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let mtr = 0; mtr <= maxM + 1e-9; mtr++) {
    const y = groundY - mtr * pxPerM;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y); ctx.stroke();
    ctx.fillText(`${mtr} m`, x - 4, y);
  }
}

function drawScene() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = colours();
  ctx.fillStyle = c.surface;
  ctx.fillRect(0, 0, W, H);

  if (state.scene === 'ball') {
    const ground = 430, ppm = 37;
    ctx.fillStyle = c.surface2;
    ctx.fillRect(0, ground, W, H - ground);
    ctx.strokeStyle = c.art; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(W, ground); ctx.stroke();
    ruler(c, 90, ground, ppm, 10);
    dashedLine(c, 100, ground - state.h0 * ppm, 700, ground - state.h0 * ppm, 'start height');
    const by = ground - sim.y * ppm - 16;
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    ctx.beginPath(); ctx.ellipse(400, ground + 4, 18 - Math.min(10, sim.y), 4, 0, 0, Math.PI * 2); ctx.fill();
    ball(400, by, 16, c);
  } else if (state.scene === 'ramp') {
    // Fixed width; the height scale shrinks for tall ramps so they still fit.
    const ground = 420, ppm = Math.min(60, 360 / state.h0), hx = 64, cx = 400;
    const X = (x) => cx + x * hx;
    const Y = (h) => ground - h * ppm;
    ctx.fillStyle = c.surface2;
    ctx.beginPath();
    ctx.moveTo(X(-RAMP_L), ground + 20);
    for (let x = -RAMP_L; x <= RAMP_L + 1e-9; x += 0.1) ctx.lineTo(X(x), Y(rampH(x)));
    ctx.lineTo(X(RAMP_L), ground + 20);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c.art; ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = -RAMP_L; x <= RAMP_L + 1e-9; x += 0.1) (x === -RAMP_L ? ctx.moveTo(X(x), Y(rampH(x))) : ctx.lineTo(X(x), Y(rampH(x))));
    ctx.stroke();
    ruler(c, 40, ground, ppm, Math.floor(state.h0));
    dashedLine(c, 50, Y(state.h0), 760, Y(state.h0), 'start height');
    // Skater: a ball sitting on the track, offset along the surface normal.
    const slope = (2 * state.h0 * sim.x) / RAMP_L ** 2;
    const sx = X(sim.x), sy = Y(rampH(sim.x));
    const nx = -slope * ppm, ny = -hx;   // upward normal to the track on screen (unnormalised)
    const nl = Math.hypot(nx, ny);
    ball(sx + (nx / nl) * 16, sy + (ny / nl) * 16, 15, c);
  } else {
    const px = 400, py = 40, ppm = 70;
    const bx = px + Math.sin(sim.th) * PEND_L * ppm, by = py + Math.cos(sim.th) * PEND_L * ppm;
    const lowest = py + PEND_L * ppm;
    ctx.fillStyle = c.art;
    ctx.fillRect(px - 60, py - 10, 120, 10);
    dashedLine(c, 150, lowest, 650, lowest, 'lowest point');
    dashedLine(c, 150, lowest - state.h0 * ppm, 650, lowest - state.h0 * ppm, 'start height');
    ctx.strokeStyle = c.text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
    ball(bx, by, 18, c);
  }

  // Readout
  ctx.fillStyle = c.text;
  ctx.font = `700 16px ${c.font}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`h = ${height().toFixed(2)} m    v = ${speed().toFixed(2)} m/s    t = ${sim.t.toFixed(1)} s`, W - 16, H - 8);
}

function ball(x, y, r, c) {
  const g = ctx.createRadialGradient(x - r / 3, y - r / 3, 2, x, y, r);
  g.addColorStop(0, '#ffd27a');
  g.addColorStop(1, '#e8890c');
  ctx.fillStyle = g;
  ctx.strokeStyle = c.text;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function dashedLine(c, x1, y1, x2, y2, label) {
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.muted;
  ctx.font = `600 12px ${c.font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, x2 + 4 > W - 90 ? x2 - 80 : x2 + 4, y1 - 3);
}

// ---------- Bars, working, transfer sentence ----------

const BARS = [
  { key: 'ek', name: 'Kinetic', colour: '--f2' },
  { key: 'ep', name: 'Gravitational potential', colour: '--f1' },
  { key: 'eth', name: 'Thermal (dissipated)', colour: '--f4' },
  { key: 'total', name: 'Total', colour: '--f8' },
];

$('bars').innerHTML = BARS.map((b) => `<div class="bar"><div class="fill" id="bar-${b.key}" style="background: var(${b.colour})"></div></div>`).join('');
$('bar-labels').innerHTML = BARS.map((b) => `<div>${b.name}<span class="val" id="val-${b.key}"></span></div>`).join('');

// +1 if the object is going up, −1 if going down, 0 if (almost) still.
function rising() {
  let rate;
  if (state.scene === 'ball') rate = sim.v;
  else if (state.scene === 'ramp') rate = sim.x * sim.u;              // height grows as |x| grows
  else rate = Math.sin(sim.th) * sim.w;
  return Math.abs(rate) < 1e-3 ? 0 : Math.sign(rate);
}

const fmtJ = (e) => `${e >= 100 ? Math.round(e) : e.toFixed(1)} J`;

function renderPanel() {
  const e = energies();
  const total = e.ek + e.ep + e.eth;
  const vals = { ek: e.ek, ep: e.ep, eth: e.eth, total: state.friction ? e.e0 : total };
  for (const b of BARS) {
    $('bar-' + b.key).style.height = `${Math.min(100, (vals[b.key] / e.e0) * 92)}%`;
    $('val-' + b.key).textContent = fmtJ(vals[b.key]);
  }

  // Which way is energy going?
  let sentence;
  const dEp = rising();
  if (sim.resting || (e.ek < 0.005 * e.e0 && e.eth > 0.95 * e.e0)) {
    sentence = state.friction && e.eth > 0.5 * e.e0
      ? 'At rest. All the energy has been dissipated to the thermal store of the surroundings.'
      : 'At rest.';
  } else if (!state.running && sim.t === 0) {
    sentence = 'At the start, all the energy is in the gravitational potential store.';
  } else if (dEp < 0) {
    sentence = `Gravitational potential store → kinetic store${state.friction ? ', with some dissipated to the thermal store' : ''}.`;
  } else if (dEp > 0) {
    sentence = `Kinetic store → gravitational potential store${state.friction ? ', with some dissipated to the thermal store' : ''}.`;
  } else {
    sentence = 'Momentarily still: all the energy (that is left) is in the gravitational potential store.';
  }
  $('transfer').textContent = sentence;

  const h = height(), v = speed();
  $('working').innerHTML = `
    <p>E<sub>p</sub> = m g h = ${state.m} × 9.8 × ${h.toFixed(2)} = <b>${fmtJ(e.ep)}</b></p>
    <p>E<sub>k</sub> = ½ m v² = ½ × ${state.m} × ${v.toFixed(2)}² = <b>${fmtJ(e.ek)}</b></p>
    ${state.friction ? `<p>Thermal (dissipated) = <b>${fmtJ(e.eth)}</b></p>` : ''}
    <p>Total = <b>${fmtJ(state.friction ? e.e0 : total)}</b> — it never changes.</p>`;
}

// ---------- Energy–time graph ----------

function drawGraph() {
  if (!state.showGraph) return;
  const cv = $('graph');
  const g = cv.getContext('2d');
  const GW = 800, GH = 220;
  const k = cv.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const c = colours();
  g.fillStyle = c.surface;
  g.fillRect(0, 0, GW, GH);

  const L = 56, R = 120, T = 10, B = 34;
  const pw = GW - L - R, ph = GH - T - B;
  const e0 = state.m * G * state.h0;
  const tEnd = Math.max(10, sim.t), tStart = tEnd - 10;
  const X = (t) => L + ((t - tStart) / 10) * pw;
  const Y = (e) => T + ph - (e / (e0 * 1.1)) * ph;

  g.strokeStyle = c.grid; g.lineWidth = 1;
  g.fillStyle = c.muted;
  g.font = `600 11px ${c.font}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const e = (e0 * i) / 4;
    g.beginPath(); g.moveTo(L, Y(e)); g.lineTo(L + pw, Y(e)); g.stroke();
    g.fillText(Math.round(e), L - 6, Y(e));
  }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let t = Math.ceil(tStart); t <= tEnd + 1e-9; t += 2) {
    g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), T + ph); g.stroke();
    g.fillText(t, X(t), T + ph + 4);
  }
  g.strokeStyle = c.text; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text;
  g.font = `700 12px ${c.font}`;
  g.fillText('time / s', L + pw / 2, GH - 16);
  g.save(); g.translate(14, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('energy / J', 0, 0); g.restore();

  const series = [
    { key: 'ek', col: c.ek, name: 'Kinetic' },
    { key: 'ep', col: c.ep, name: 'Grav. potential' },
    ...(state.friction ? [{ key: 'eth', col: c.eth, name: 'Thermal' }] : []),
    { key: 'e0', col: c.total, name: 'Total', dash: true },
  ];
  const pts = trace.filter((p) => p.t >= tStart);
  g.save();
  g.beginPath(); g.rect(L, T, pw, ph); g.clip();
  for (const s of series) {
    g.strokeStyle = s.col; g.lineWidth = 2.5;
    g.setLineDash(s.dash ? [6, 5] : []);
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(p[s.key])) : g.moveTo(X(p.t), Y(p[s.key]))));
    g.stroke();
  }
  g.restore();
  g.setLineDash([]);
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `700 12px ${c.font}`;
  series.forEach((s, i) => {
    const y = T + 12 + i * 20;
    g.strokeStyle = s.col; g.lineWidth = 3; g.setLineDash(s.dash ? [6, 5] : []);
    g.beginPath(); g.moveTo(L + pw + 12, y); g.lineTo(L + pw + 30, y); g.stroke();
    g.setLineDash([]);
    g.fillStyle = c.text; g.fillText(s.name, L + pw + 36, y);
  });
}

// ---------- Loop ----------

let lastT = performance.now();
let sinceRecord = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000) * state.speed;
  lastT = now;
  if (state.running) {
    const n = 40;
    for (let i = 0; i < n; i++) step(dt / n);
    sim.t += dt;
    sinceRecord += dt;
    if (sinceRecord > 0.03) { record(); sinceRecord = 0; }
  }
  drawScene();
  renderPanel();
  drawGraph();
  requestAnimationFrame(frame);
}

// ---------- Controls ----------

function setRunning(on) {
  state.running = on;
  $('play').textContent = on ? '❚❚ Pause' : '▶ Play';
}

$('play').addEventListener('click', () => setRunning(!state.running));
$('reset').addEventListener('click', () => { setRunning(false); reset(); });
$('speed').addEventListener('change', (e) => { state.speed = Number(e.target.value); });
$('friction').addEventListener('change', (e) => { state.friction = e.target.checked; setRunning(false); reset(); saveHash(); });
$('show-graph').addEventListener('change', (e) => { state.showGraph = e.target.checked; $('graph-panel').hidden = !state.showGraph; });

function syncSliders() {
  const hs = $('height');
  hs.max = state.scene === 'pendulum' ? PEND_L : 10;
  state.h0 = Math.min(state.h0, Number(hs.max));
  hs.value = state.h0;
  $('mass').value = state.m;
  $('mass-val').textContent = `${state.m} kg`;
  $('height-val').textContent = `${state.h0} m`;
}

$('mass').addEventListener('input', (e) => { state.m = Number(e.target.value); syncSliders(); setRunning(false); reset(); saveHash(); });
$('height').addEventListener('input', (e) => { state.h0 = Number(e.target.value); syncSliders(); setRunning(false); reset(); saveHash(); });

$('scenes').innerHTML = Object.entries(SCENES).map(([id, s]) => `<button class="btn" data-scene="${id}">${s.name}</button>`).join('');
$('scenes').addEventListener('click', (e) => {
  const b = e.target.closest('[data-scene]');
  if (!b) return;
  setScene(b.dataset.scene);
});

function setScene(id) {
  state.scene = id;
  document.querySelectorAll('#scenes .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scene === id)));
  syncSliders();
  setRunning(false);
  reset();
  saveHash();
}

function saveHash() {
  const p = new URLSearchParams({ s: state.scene, m: state.m, h: state.h0 });
  if (state.friction) p.set('f', '1');
  history.replaceState(null, '', '#' + p.toString());
}

function loadHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (SCENES[p.get('s')]) state.scene = p.get('s');
  const m = Number(p.get('m')), h = Number(p.get('h'));
  if (m >= 0.5 && m <= 5) state.m = m;
  if (h >= 1 && h <= 10) state.h0 = h;
  state.friction = p.get('f') === '1';
  $('friction').checked = state.friction;
}

window.addEventListener('resize', sizeCanvases);

loadHash();
sizeCanvases();
setScene(state.scene);
requestAnimationFrame(frame);
