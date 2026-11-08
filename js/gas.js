// Gas pressure: an ideal gas of particles bouncing in a cylinder with a movable piston.
// Pressure is measured from the impulses of collisions with the walls. Pushing the piston
// in does work on the gas, which heats it unless the temperature is held constant.

PK.header({
  title: 'Gas pressure',
  answers: true,
  spec: [
    { code: '4.3.3.1', text: 'Particle motion in gases: random motion; temperature is related to the average kinetic energy; pressure increases with temperature at constant volume' },
    { code: '4.3.3.2', text: 'Pressure in gases: p V = constant for a fixed mass of gas at constant temperature', po: true },
    { code: '4.3.3.3', text: 'Increasing the pressure of a gas: doing work on a gas increases its temperature (e.g. a bike pump)', po: true, ht: true },
    { code: 'KS3', text: 'Pressure in gases as a result of particles colliding with the walls' },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('gas');
const ctx = canvas.getContext('2d');

const W = 800, H = 440;
const X0 = 40, Y0 = 50, Y1 = 390, LMAX = 600, HC = Y1 - Y0;
const R = 4;
const V_REF = 160;                    // rms speed (px/s) at 300 K
const V_FULL = 2.0;                   // litres when the piston is fully out
// In 2D, p = N <v²> / (2 A). Scale so 100 particles at 300 K in the full cylinder read 100 kPa.
const KCONV = 100 / ((100 * V_REF * V_REF) / (2 * LMAX * HC));

const state = { xp: X0 + LMAX, targetXp: X0 + LMAX, T: 300, n: 100, iso: true, trail: false };
let parts = [];
let pressure = 0;            // smoothed, kPa
let trail = [];
const results = [];

// ---------- Particles ----------

function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

function newParticle() {
  const s = (V_REF * Math.sqrt(state.T / 300)) / Math.SQRT2;
  return { x: X0 + R + Math.random() * (state.xp - X0 - 2 * R), y: Y0 + R + Math.random() * (HC - 2 * R), vx: gauss() * s, vy: gauss() * s };
}

function setCount(n) {
  while (parts.length < n) parts.push(newParticle());
  parts.length = n;
}

function measuredT() {
  if (!parts.length) return state.T;
  const v2 = parts.reduce((a, p) => a + p.vx * p.vx + p.vy * p.vy, 0) / parts.length;
  return (300 * v2) / (V_REF * V_REF);
}

function rescaleTo(T) {
  const k = Math.sqrt(T / measuredT());
  parts.forEach((p) => { p.vx *= k; p.vy *= k; });
}

// ---------- Simulation ----------

// Elastic collisions between particles share energy out, so speeds become random in every
// direction (without them, pushing the piston would only speed up side-to-side motion).
// A coarse grid keeps this fast: only particles in neighbouring cells are checked.
const RC = 1.5;          // collision radius: much smaller than drawn, so the gas behaves ideally
const CELL = 8 * R;
function collide() {
  const grid = new Map();
  parts.forEach((p, i) => {
    const key = Math.floor(p.x / CELL) * 1000 + Math.floor(p.y / CELL);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  });
  for (const [key, list] of grid) {
    const gx = Math.floor(key / 1000), gy = key % 1000;
    for (let ox = 0; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      if (ox === 0 && oy < 0) continue;
      const other = ox === 0 && oy === 0 ? list : grid.get((gx + ox) * 1000 + gy + oy);
      if (!other) continue;
      for (const i of list) for (const j of other) {
        if (other === list && j <= i) continue;
        const a = parts[i], b = parts[j];
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * RC * RC || d2 < 1e-9) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel <= 0) continue;           // already moving apart
        a.vx -= rel * nx; a.vy -= rel * ny;
        b.vx += rel * nx; b.vy += rel * ny;
      }
    }
  }
}

function step(dt) {
  // Move the piston towards where the user wants it (so it moves smoothly, not in jumps).
  const prev = state.xp;
  const maxMove = 80 * dt;   // slower than the molecules, like pushing a real piston
  state.xp += Math.max(-maxMove, Math.min(maxMove, state.targetXp - state.xp));
  const vp = (state.xp - prev) / dt;

  let impulse = 0;
  for (const p of parts) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < X0 + RC) { p.x = X0 + RC; impulse += 2 * Math.abs(p.vx); p.vx = Math.abs(p.vx); }
    if (p.y < Y0 + RC) { p.y = Y0 + RC; impulse += 2 * Math.abs(p.vy); p.vy = Math.abs(p.vy); }
    if (p.y > Y1 - RC) { p.y = Y1 - RC; impulse += 2 * Math.abs(p.vy); p.vy = -Math.abs(p.vy); }
    if (p.x > state.xp - RC) {
      p.x = state.xp - RC;
      if (p.vx > vp) {
        // Bounce off a moving piston: a piston moving in speeds the particle up (work done on the gas).
        impulse += 2 * (p.vx - vp);
        p.vx = 2 * vp - p.vx;
      }
    }
  }
  collide();
  const perimeter = 2 * (state.xp - X0) + 2 * HC;
  const inst = (impulse / (dt * perimeter)) * KCONV;
  const a = Math.min(1, dt / 0.8);
  pressure += (inst - pressure) * a;

  if (state.iso) {
    const k = Math.sqrt(state.T / measuredT());
    const blend = 1 + (k - 1) * Math.min(1, dt * 4);
    parts.forEach((p) => { p.vx *= blend; p.vy *= blend; });
  }

  if (state.trail && parts[0]) { trail.push({ x: parts[0].x, y: parts[0].y }); if (trail.length > 400) trail.shift(); }
}

// ---------- Drawing ----------

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
  const g = $('pgraph');
  g.width = Math.round(g.clientWidth * dpr);
  g.height = Math.round(g.clientWidth * (220 / 270) * dpr);
}

const volumeL = () => (V_FULL * (state.xp - X0)) / LMAX;

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), art: PK.cssVar('--art'), accent: PK.cssVar('--accent') };
  const font = PK.cssVar('--font-body') || 'sans-serif';
  ctx.fillStyle = c.surface;
  ctx.fillRect(0, 0, W, H);

  // Cylinder
  ctx.fillStyle = c.surface2;
  ctx.fillRect(X0, Y0, state.xp - X0, HC);
  ctx.strokeStyle = c.art; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(X0 + LMAX + 30, Y0 - 3); ctx.lineTo(X0 - 3, Y0 - 3); ctx.lineTo(X0 - 3, Y1 + 3); ctx.lineTo(X0 + LMAX + 30, Y1 + 3); ctx.stroke();

  // Particle trail
  if (state.trail && trail.length > 1) {
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
    ctx.beginPath(); trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Particles, coloured by speed
  const vref = V_REF * Math.sqrt(measuredT() / 300);
  for (const [i, p] of parts.entries()) {
    const s = Math.min(1, Math.hypot(p.vx, p.vy) / (2 * vref));
    ctx.fillStyle = state.trail && i === 0 ? '#e53935' : `hsl(${220 - s * 200}, 80%, 52%)`;
    ctx.beginPath(); ctx.arc(p.x, p.y, state.trail && i === 0 ? R + 2 : R, 0, Math.PI * 2); ctx.fill();
  }

  // Piston and handle
  ctx.fillStyle = '#8a929f'; ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.fillRect(state.xp, Y0 - 1, 16, HC + 2); ctx.strokeRect(state.xp, Y0 - 1, 16, HC + 2);
  ctx.fillStyle = '#aab1bc';
  ctx.fillRect(state.xp + 16, (Y0 + Y1) / 2 - 7, W - state.xp - 16 - 30, 14);
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W - 46, (Y0 + Y1) / 2 - 40, 26, 80, 8) : ctx.rect(W - 46, (Y0 + Y1) / 2 - 40, 26, 80); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `800 16px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⇔', W - 33, (Y0 + Y1) / 2);

  // Readouts above the cylinder
  ctx.fillStyle = c.text; ctx.font = `700 16px ${font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const T = measuredT();
  ctx.fillText(`p = ${pressure.toFixed(0)} kPa`, X0, 24);
  ctx.fillText(`V = ${volumeL().toFixed(2)} L`, X0 + 180, 24);
  ctx.fillText(`T = ${T.toFixed(0)} K (${(T - 273).toFixed(0)} °C)`, X0 + 340, 24);
  drawGauge(c, font);
  ctx.fillStyle = c.muted; ctx.font = `600 13px ${font}`; ctx.textAlign = 'left';
  ctx.fillText('Drag the handle to move the piston.  Blue = slow, red = fast.', X0, Y1 + 30);
}

function drawGauge(c, font) {
  const cx = 715, cy = 34, r = 26, max = 400;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const a = Math.PI * 0.75 + Math.min(1, pressure / max) * Math.PI * 1.5;
  ctx.strokeStyle = '#e53935'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5)); ctx.stroke();
  ctx.fillStyle = '#333'; ctx.font = `700 8px ${font}`; ctx.textAlign = 'center';
  ctx.fillText('kPa', cx, cy + 14);
}

// ---------- Results ----------

function renderResults() {
  $('table').innerHTML = results.length ? `<table class="results">
    <thead><tr><th>V (L)</th><th>T (${PK.beyondShown() ? 'K' : '°C'})</th><th>p (kPa)</th><th>p × V</th><th></th></tr></thead>
    <tbody>${results.map((r, i) => `<tr><td class="n">${r.V.toFixed(2)}</td><td class="n">${(PK.beyondShown() ? r.T : r.T - 273).toFixed(0)}</td><td class="n">${r.p.toFixed(0)}</td><td class="n">${PK.ans((r.p * r.V).toFixed(0))}</td>
      <td><button class="del" data-i="${i}" aria-label="Delete">✕</button></td></tr>`).join('')}</tbody></table>`
    : '<p class="note">No readings yet. Change the volume or temperature between readings.</p>';
  drawGraph();
}

function drawGraph() {
  const cv = $('pgraph'), g = cv.getContext('2d');
  const GW = 270, GH = 220, k = cv.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent') };
  const font = PK.cssVar('--font-body') || 'sans-serif';
  g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
  const byV = $('axis').value === 'V';
  const L = 44, Rm = 10, T = 10, B = 36, pw = GW - L - Rm, ph = GH - T - B;
  const kelvin = PK.beyondShown(), xMin = byV || kelvin ? 0 : -200, xN = byV || kelvin ? 4 : 6;
  const xMax = byV ? V_FULL : kelvin ? 600 : 400, yMax = Math.max(100, Math.ceil(Math.max(0, ...results.map((r) => r.p)) / 100) * 100);
  const X = (x) => L + ((x - xMin) / (xMax - xMin)) * pw, Y = (y) => T + ph - (y / yMax) * ph;
  g.strokeStyle = c.grid; g.lineWidth = 1; g.fillStyle = c.muted; g.font = `600 13px ${font}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) { const y = (yMax * i) / 4; g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(L + pw, Y(y)); g.stroke(); g.fillText(y, L - 4, Y(y)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let i = 0; i <= xN; i++) { const x = xMin + ((xMax - xMin) * i) / xN; g.beginPath(); g.moveTo(X(x), T); g.lineTo(X(x), T + ph); g.stroke(); g.fillText(byV ? x.toFixed(1) : x, X(x), T + ph + 3); }
  g.strokeStyle = c.text; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 13px ${font}`;
  g.fillText(byV ? 'volume / L' : kelvin ? 'temperature / K' : 'temperature / °C', L + pw / 2, GH - 15);
  g.save(); g.translate(11, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('pressure / kPa', 0, 0); g.restore();
  g.strokeStyle = c.point; g.lineWidth = 2;
  for (const r of results) {
    const x = X(byV ? r.V : kelvin ? r.T : r.T - 273), y = Y(r.p);
    g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x - 4, y + 4); g.lineTo(x + 4, y - 4); g.stroke();
  }
}

$('record').addEventListener('click', () => { results.push({ V: volumeL(), T: measuredT(), p: pressure }); renderResults(); });
$('clear-results').addEventListener('click', () => { results.length = 0; renderResults(); });
$('table').addEventListener('click', (e) => { const b = e.target.closest('.del'); if (b) { results.splice(Number(b.dataset.i), 1); renderResults(); } });
$('axis').addEventListener('change', drawGraph);

// ---------- Controls ----------

function syncLabels() {
  $('temp-k').textContent = `${state.T - 273} °C is ${state.T} K.`;
  $('count-val').textContent = state.n;
  $('iso-note').innerHTML = state.iso
    ? 'The temperature is held constant (the gas can lose or gain heat through the cylinder walls).'
    : '<b>Insulated:</b> push the piston in quickly and the gas heats up, because work is done on it. Pull it out and the gas cools.';
}

$('volume').addEventListener('input', () => { state.targetXp = X0 + (LMAX * PK.num('volume')) / V_FULL; syncLabels(); });
$('temp').addEventListener('input', () => { state.T = PK.num('temp') + 273; rescaleTo(state.T); syncLabels(); });
$('count').addEventListener('input', (e) => { state.n = Number(e.target.value); setCount(state.n); syncLabels(); });
$('iso').addEventListener('change', (e) => {
  state.iso = e.target.checked;
  if (state.iso) { state.T = Math.round(measuredT() / 10) * 10; state.T = Math.max(100, Math.min(600, state.T)); $('temp').value = state.T - 273; }
  syncLabels();
});
$('trail').addEventListener('change', (e) => { state.trail = e.target.checked; trail = []; });

// Drag the piston handle (or anywhere on the piston)
function point(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}
let dragging = false, grabDx = 0;
canvas.addEventListener('pointerdown', (e) => {
  const p = point(e);
  if (p.x > state.xp - 10 && p.y > Y0 - 10 && p.y < Y1 + 10) {
    dragging = true; grabDx = state.targetXp - p.x;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ }
    e.preventDefault();
  }
});
canvas.addEventListener('pointermove', (e) => {
  const p = point(e);
  canvas.style.cursor = dragging || p.x > state.xp - 10 ? 'ew-resize' : 'default';
  if (!dragging) return;
  state.targetXp = Math.max(X0 + LMAX * 0.25, Math.min(X0 + LMAX, p.x + grabDx));
  $('volume').value = (((state.targetXp - X0) / LMAX) * V_FULL).toFixed(2);
  syncLabels();
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// ---------- Loop ----------

let lastT = performance.now(), frameCount = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  for (let i = 0; i < 4; i++) step(dt / 4);
  if (!state.iso && frameCount++ % 10 === 0) {
    // Insulated: show the gas's own temperature in the box (unless someone is typing in it).
    if (document.activeElement !== $('temp')) $('temp').value = (measuredT() - 273).toFixed(0);
    $('temp-k').textContent = `${(measuredT() - 273).toFixed(0)} °C is ${measuredT().toFixed(0)} K.`;
  }
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { sizeCanvas(); drawGraph(); });
window.addEventListener('pk-theme', drawGraph);
window.addEventListener('pk-beyond', () => { renderResults(); drawGraph(); });

setCount(state.n);
pressure = 100;
sizeCanvas();
syncLabels();
renderResults();
requestAnimationFrame(frame);
