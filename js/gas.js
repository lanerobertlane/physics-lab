// Gas pressure: an ideal gas of particles bouncing in a cylinder with a movable piston.
// Pressure is measured from the impulses of collisions with the walls. Pushing the piston
// in does work on the gas, which heats it unless the temperature is held constant.
// The second tab blows up a balloon: the forces of the air inside and outside on the rubber balance.

PK.header({
  title: 'Gas pressure',
  answers: true,
  spec: [
    { code: '4.3.3.1', text: 'Particle motion in gases: random motion; temperature is related to the average kinetic energy; pressure increases with temperature at constant volume' },
    { code: '4.3.3.2', text: 'Pressure in gases: p V = constant for a fixed mass of gas at constant temperature', po: true },
    { code: '4.3.3.3', text: 'Increasing the pressure of a gas: doing work on a gas increases its temperature (e.g. a bike pump)', po: true, ht: true },
    { code: 'KS3', text: 'Pressure in gases as a result of particles colliding with the walls' },
    { code: 'KS3', text: 'Atmospheric pressure decreases with increasing height, as the weight of air above decreases' },
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

const state = { tab: 'cylinder', xp: X0 + LMAX, targetXp: X0 + LMAX, T: 300, n: 100, iso: true, trail: false };
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
  if (state.tab !== 'cylinder') return;
  const p = point(e);
  if (p.x > state.xp - 10 && p.y > Y0 - 10 && p.y < Y1 + 10) {
    dragging = true; grabDx = state.targetXp - p.x;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ }
    e.preventDefault();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (state.tab !== 'cylinder') { canvas.style.cursor = 'default'; return; }
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

// ---------- Blowing up a balloon ----------
// The balloon is a circle of radius R (px). The air inside pushes the rubber out; the air outside
// and the stretched rubber push it in. R moves smoothly to where they balance:
//   inside pressure C N T / R²  =  outside pressure + S (1 − R0 / R)
// The inside pressure shown comes from that formula (what the collisions average to), so it reads
// steadily; the particles show why.
// C is set so that 160 particles at 293 K fill a 150 px balloon at about 106 kPa: lots of particles, so lots of collisions
const BL = { cx: 320, cy: 215, C: 33.9, S: 8, R0: 34, BURST: 200, START: 160, PUMP: 20, TOUT: 293 };
const bl = { in: [], out: [], R: 0, T: 293, pout: 100, popped: false, popT: 0, shreds: [], tick: 0, hits: [] };
const blSD = (T) => (V_REF * Math.sqrt(T / 300)) / Math.SQRT2;
const blPin = () => (bl.popped ? bl.pout : (BL.C * bl.in.length * bl.T) / (bl.R * bl.R));
const rubber = (R) => (R > BL.R0 ? BL.S * (1 - BL.R0 / R) : 0);
// The radius where the forces balance (bisection: the difference only gets smaller as R grows)
function blBalance() {
  const f = (R) => (BL.C * bl.in.length * bl.T) / (R * R) - bl.pout - rubber(R);
  if (f(BL.R0) <= 0) return BL.R0;   // too little air: the rubber stays floppy
  let lo = BL.R0, hi = 2000;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return lo;
}
function blInsideParticle(atNeck) {
  const sd = blSD(bl.T);
  if (atNeck) return { x: BL.cx + (Math.random() - 0.5) * 10, y: BL.cy + bl.R - 6, vx: gauss() * sd * 0.5, vy: -Math.abs(gauss() * sd) - sd };
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (bl.R - 4);
  return { x: BL.cx + r * Math.cos(a), y: BL.cy + r * Math.sin(a), vx: gauss() * sd, vy: gauss() * sd };
}
function blOutsideParticle() {
  const sd = blSD(BL.TOUT);
  for (let tries = 0; tries < 50; tries++) {
    const x = 3 + Math.random() * (W - 6), y = 3 + Math.random() * (H - 6);
    if (!bl.popped && Math.hypot(x - BL.cx, y - BL.cy) < bl.R + 4) continue;
    return { x, y, vx: gauss() * sd, vy: gauss() * sd };
  }
  return null;
}
// The outside air keeps the same density for its pressure: N = p A / (C π T)
const blOutTarget = () => Math.round((bl.pout * (W * H - (bl.popped ? 0 : Math.PI * bl.R * bl.R))) / (BL.C * Math.PI * BL.TOUT));
function blNew(n = BL.START) {
  Object.assign(bl, { in: [], popped: false, popT: 0, shreds: [], hits: [] });
  bl.R = 60;
  for (let i = 0; i < n; i++) bl.in.push(blInsideParticle(false));
  bl.R = blBalance();
  bl.in = bl.in.map(() => blInsideParticle(false));
  bl.out = [];
  for (let i = 0, n2 = blOutTarget(); i < n2; i++) { const p = blOutsideParticle(); if (p) bl.out.push(p); }
  blRender();
}
function blPop() {
  bl.popped = true; bl.popT = 0; bl.hits = [];
  bl.out.push(...bl.in.map((p) => ({ ...p })));
  bl.in = [];
  bl.shreds = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    return { x: BL.cx + Math.cos(a) * bl.R, y: BL.cy + Math.sin(a) * bl.R, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, a, spin: (Math.random() - 0.5) * 6 };
  });
  blRender();
}
function blStep(dt) {
  if (!bl.popped) {
    const target = blBalance(), dR = Math.max(-120 * dt, Math.min(120 * dt, (target - bl.R) * Math.min(1, dt * 3)));
    bl.R += dR;
    if (bl.R >= BL.BURST) { blPop(); return; }
  }
  const R = bl.R, cx = BL.cx, cy = BL.cy;
  for (const p of bl.in) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy), lim = R - 3;
    if (d > lim) {
      const nx = dx / d, ny = dy / d, vn = p.vx * nx + p.vy * ny;
      if (vn > 0) {
        // Bounce off the rubber, a little off true, as rubber isn't perfectly smooth
        let vx = p.vx - 2 * vn * nx, vy = p.vy - 2 * vn * ny;
        const turn = (Math.random() - 0.5) * 0.6, c = Math.cos(turn), s = Math.sin(turn);
        [vx, vy] = [vx * c - vy * s, vx * s + vy * c];
        if (vx * nx + vy * ny > 0) { vx = p.vx - 2 * vn * nx; vy = p.vy - 2 * vn * ny; }
        p.vx = vx; p.vy = vy;
        bl.hits.push({ ang: Math.atan2(ny, nx), age: 0, inside: true });
      }
      p.x = cx + nx * lim; p.y = cy + ny * lim;
    }
  }
  // Keep the air inside at its temperature (the rubber lets heat in and out, slowly)
  if (bl.in.length) {
    const v2 = bl.in.reduce((a, p) => a + p.vx * p.vx + p.vy * p.vy, 0) / bl.in.length;
    const k = 1 + (Math.sqrt((2 * blSD(bl.T) ** 2) / v2) - 1) * Math.min(1, dt * 2);
    for (const p of bl.in) { p.vx *= k; p.vy *= k; }
  }
  for (const p of bl.out) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 3) { p.x = 3; p.vx = Math.abs(p.vx); }
    if (p.x > W - 3) { p.x = W - 3; p.vx = -Math.abs(p.vx); }
    if (p.y < 3) { p.y = 3; p.vy = Math.abs(p.vy); }
    if (p.y > H - 3) { p.y = H - 3; p.vy = -Math.abs(p.vy); }
    if (bl.popped) continue;
    const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy), lim = R + 3;
    if (d < lim) {
      const nx = dx / d, ny = dy / d, vn = p.vx * nx + p.vy * ny;
      if (vn < 0) { p.vx -= 2 * vn * nx; p.vy -= 2 * vn * ny; bl.hits.push({ ang: Math.atan2(ny, nx), age: 0, inside: false }); }
      p.x = cx + nx * lim; p.y = cy + ny * lim;
    }
  }
  for (const h of bl.hits) h.age += dt;
  bl.hits = bl.hits.filter((h) => h.age < 0.35);
  // Outside, the same density of air whatever size the balloon is
  const want = blOutTarget();
  for (let i = 0; i < 3 && bl.out.length < want; i++) { const p = blOutsideParticle(); if (p) bl.out.push(p); }
  for (let i = 0; i < 3 && bl.out.length > want; i++) bl.out.splice(Math.floor(Math.random() * bl.out.length), 1);
  if (bl.popped) {
    bl.popT += dt;
    for (const s of bl.shreds) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 200 * dt; s.a += s.spin * dt; s.vx *= 1 - dt;
      s.x = Math.max(10, Math.min(550, s.x));
      if (s.y > H - 8) { s.y = H - 8; s.vy = 0; s.vx *= 0.8; s.spin *= 0.8; }   // the bits land on the floor
    }
  }
  bl.tick += dt;
  if (bl.tick > 0.5) { bl.tick = 0; blRender(); }
}
function blArrow(x1, y1, x2, y2, col) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 7;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h, y2 - Math.sin(a) * h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(a - 0.45) * h * 1.4, y2 - Math.sin(a - 0.45) * h * 1.4);
  ctx.lineTo(x2 - Math.cos(a + 0.45) * h * 1.4, y2 - Math.sin(a + 0.45) * h * 1.4); ctx.closePath(); ctx.fill();
}
function blDial(c, font, cx, cy, value, label, col) {
  const r = 34, max = 200;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1.5;
  for (let i = 0; i <= 4; i++) {
    const a = Math.PI * 0.75 + (i / 4) * Math.PI * 1.5;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3)); ctx.lineTo(cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9)); ctx.stroke();
  }
  const a = Math.PI * 0.75 + Math.min(1, value / max) * Math.PI * 1.5;
  ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7)); ctx.stroke();
  ctx.fillStyle = '#333'; ctx.font = `700 9px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('kPa', cx, cy + 18);
  ctx.fillStyle = c.text; ctx.font = `800 14px ${font}`; ctx.fillText(label, cx, cy - r - 12);
  ctx.fillStyle = col; ctx.font = `800 17px ${font}`; ctx.fillText(`${value.toFixed(0)} kPa`, cx, cy + r + 16);
}
function blDraw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted') };
  const font = PK.cssVar('--font-body') || 'sans-serif', R = bl.R, cx = BL.cx, cy = BL.cy;
  const IN = '#e53935', OUT = PK.isDark() ? '#64b5f6' : '#1e63c6';
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  // The air outside
  ctx.fillStyle = '#9eadb6'; ctx.beginPath();
  for (const p of bl.out) { ctx.moveTo(p.x + 2.5, p.y); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); }
  ctx.fill();
  // The tube from the pump, and the neck of the balloon
  const neck = bl.popped ? cy + 40 : cy + R;
  ctx.fillStyle = '#78909c'; ctx.fillRect(cx - 5, neck + 8, 10, H - neck - 8);
  ctx.fillStyle = c.muted; ctx.font = `700 12px ${font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('from the pump', cx + 12, H - 14);
  if (bl.popped) { ctx.fillStyle = '#c62828'; ctx.fillRect(cx - 8, neck + 2, 16, 8); }   // all that's left on the tube
  if (!bl.popped) {
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(cx - 9, neck + 12); ctx.lineTo(cx + 9, neck + 12); ctx.lineTo(cx + 4, neck - 2); ctx.lineTo(cx - 4, neck - 2); ctx.closePath(); ctx.fill();
    // The balloon: the rubber gets thinner as it stretches
    ctx.fillStyle = 'rgba(229, 57, 53, .12)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    const vref = blSD(293) * Math.SQRT2;   // coloured against room temperature, so cold air looks slow and hot air fast
    for (const p of bl.in) {
      const s = Math.min(1, Math.hypot(p.vx, p.vy) / (2 * vref));
      ctx.fillStyle = `hsl(${220 - s * 200}, 80%, 52%)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    const lw = Math.min(7, 480 / R);
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    // A flash where each particle hits the rubber: on the inside for the air inside, on the outside for the air outside
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const h of bl.hits) {
      const r = h.inside ? R - lw / 2 - 3 : R + lw / 2 + 3, span = 11 / r;
      ctx.globalAlpha = 1 - h.age / 0.35; ctx.strokeStyle = h.inside ? '#ff6d00' : OUT;
      ctx.beginPath(); ctx.arc(cx, cy, r, h.ang - span, h.ang + span); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1; ctx.lineCap = 'butt';
    // The forces on the balloon, from the air inside and the air outside
    if ($('arrows').checked) {
      const pin = blPin(), Lin = Math.min(R - 8, pin * 0.32), Lout = bl.pout * 0.32;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + Math.PI / 8, ux = Math.cos(a), uy = Math.sin(a);
        if (Lin > 6) blArrow(cx + ux * (R - 4 - Lin), cy + uy * (R - 4 - Lin), cx + ux * (R - 4), cy + uy * (R - 4), IN);
        blArrow(cx + ux * (R + 4 + Lout), cy + uy * (R + 4 + Lout), cx + ux * (R + 4), cy + uy * (R + 4), OUT);
      }
      ctx.lineWidth = 1;
    }
  } else {
    // Pop! Bits of rubber fly off
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const s of bl.shreds) { ctx.beginPath(); ctx.arc(s.x, s.y, 10, s.a, s.a + 1.4); ctx.stroke(); }
    ctx.lineCap = 'butt'; ctx.lineWidth = 1;
    if (bl.popT < 2.5) {
      ctx.globalAlpha = Math.max(0, 1 - bl.popT / 2.5);
      ctx.fillStyle = '#e53935'; ctx.font = `900 64px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Pop!', cx, cy - 50);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = c.text; ctx.font = `700 15px ${font}`; ctx.textAlign = 'center';
    ctx.fillText('The rubber stretched too far. Press 🎈 New balloon.', cx, cy + 5);
  }
  // Key for the arrows
  if (!bl.popped && $('arrows').checked) {
    ctx.fillStyle = c.surface; ctx.globalAlpha = 0.88; ctx.fillRect(6, 4, 230, 50); ctx.globalAlpha = 1;
    ctx.font = `700 13px ${font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    blArrow(14, 18, 44, 18, IN); ctx.fillStyle = IN; ctx.fillText('force from the air inside', 52, 18);
    blArrow(14, 40, 44, 40, OUT); ctx.fillStyle = OUT; ctx.fillText('force from the air outside', 52, 40);
  }
  // Gauges and readings
  ctx.fillStyle = c.surface; ctx.globalAlpha = 0.88; ctx.fillRect(560, 0, W - 560, H); ctx.globalAlpha = 1;
  blDial(c, font, 625, 92, blPin(), 'Inside', IN);
  blDial(c, font, 735, 92, bl.pout, 'Outside', OUT);
  ctx.fillStyle = c.text; ctx.font = `700 15px ${font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`Air particles inside: ${bl.in.length}`, 580, 200);
  ctx.fillText(`Temperature inside: ${String(bl.T - 273).replace('-', '−')} °C`, 580, 226);
  ctx.fillText(`Outside: ${BL.TOUT - 273} °C`, 580, 252);
  if (!bl.popped && bl.R > 185) { ctx.fillStyle = '#c62828'; ctx.font = `800 14px ${font}`; ctx.fillText('The rubber is very thin!', 580, 288); }
  ctx.fillStyle = c.muted; ctx.font = `600 13px ${font}`;
  ctx.fillText('Flashes: collisions with', 580, H - 80);
  ctx.fillText('the rubber.', 580, H - 62);
  ctx.fillText('Blue = slow, red = fast.', 580, H - 40);
  ctx.fillText('Grey = air outside.', 580, H - 20);
}
function blRender() {
  if (state.tab !== 'balloon') return;
  const pin = blPin(), n = bl.in.length, Tc = bl.T - 273, floppy = !bl.popped && bl.R <= BL.R0 + 0.5;
  let html = `<dl class="readout"><dt>Pressure inside</dt><dd>${pin.toFixed(0)} kPa</dd><dt>Pressure outside</dt><dd>${bl.pout} kPa</dd><dt>Air particles inside</dt><dd>${n}</dd></dl>`;
  if (bl.popped) html += '<p><b>Pop!</b> The rubber was stretched too far and split. The air inside rushes out and mixes with the air outside.</p>';
  else if (floppy) html += '<p>The balloon is floppy: there aren’t enough particles inside to stretch the rubber against the force of the air outside. Pump in some air.</p>';
  else {
    html += `<p>Each particle that hits the inside of the rubber exerts a tiny force on it, outwards. Each flash is one collision. The air particles outside hit it too, exerting forces inwards. The balloon stretches until the forces balance. The stretched rubber squeezes too, so the pressure inside is a little higher than outside.</p>`;
    html += '<p>Pump in more air: more particles means more collisions with the rubber every second, so the pressure inside goes up and the balloon gets bigger.</p>';
  }
  if (!bl.popped) {
    html += Tc <= -150 ? '<p>In liquid nitrogen the particles slow right down. They hit the rubber less hard and less often, so the balloon shrinks.</p>'
      : Tc >= 50 ? '<p>The air inside is hot, so its particles move faster and hit the rubber harder and more often: the balloon gets bigger.</p>'
        : '<p>Heat the air inside and the balloon gets bigger, because the particles move faster. Cool it right down (−196&nbsp;°C is liquid nitrogen) and it shrinks.</p>';
    html += bl.pout < 90 ? '<p>The air pressure outside is low, as it is high up. Fewer air particles hit the outside, so the balloon gets bigger. Weather balloons grow as they rise, until they burst.</p>'
      : '<p>Try a lower air pressure outside, as you’d find high up a mountain.</p>';
  }
  $('info').innerHTML = html;
  $('pump').disabled = bl.popped || n >= 1200;
  $('letout').disabled = bl.popped || n === 0;
}
$('pump').addEventListener('click', () => { for (let i = 0; i < BL.PUMP; i++) bl.in.push(blInsideParticle(true)); blRender(); });
$('letout').addEventListener('click', () => {
  // The particles nearest the neck leave through it, into the air outside
  const neck = { x: BL.cx, y: BL.cy + bl.R };
  bl.in.sort((a, b) => Math.hypot(a.x - neck.x, a.y - neck.y) - Math.hypot(b.x - neck.x, b.y - neck.y));
  const sd = blSD(BL.TOUT);
  bl.in.splice(0, BL.PUMP).forEach((p) => bl.out.push({ x: BL.cx + (Math.random() - 0.5) * 10, y: neck.y + 8, vx: gauss() * sd, vy: Math.abs(gauss() * sd) + sd }));
  blRender();
});
$('newb').addEventListener('click', () => blNew());
$('btemp').addEventListener('input', () => {
  const T = PK.num('btemp') + 273, k = Math.sqrt(T / bl.T);
  for (const p of bl.in) { p.vx *= k; p.vy *= k; }
  bl.T = T; blRender();
});
$('bout').addEventListener('input', () => { bl.pout = PK.num('bout'); blRender(); });

// ---------- Tabs ----------

const INTRO = {
  cylinder: 'Gas particles move randomly and hit the walls of the container. Each collision pushes on the wall, which is what causes the pressure. Drag the piston to change the volume, or change the temperature.',
  balloon: 'Pump air into a balloon. The particles inside hit the rubber, exerting a force outwards, while the air outside exerts a force inwards. Change the temperature, or the air pressure outside, and watch the balloon.',
};
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  canvas.classList.toggle('drag', t === 'cylinder');   // nothing to drag on the balloon, so let iPads scroll over it
  canvas.setAttribute('aria-label', t === 'cylinder' ? 'Gas particles in a cylinder with a piston' : 'A balloon with air particles inside and outside');
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'cylinder' ? location.pathname + location.search : `#${t}`);
  sizeCanvas();
  if (t === 'cylinder') drawGraph(); else blRender();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));

// ---------- Loop ----------

let lastT = performance.now(), frameCount = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (state.tab === 'balloon') {
    for (let i = 0; i < 2; i++) blStep(dt / 2);
    blDraw();
    requestAnimationFrame(frame);
    return;
  }
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
blNew();
sizeCanvas();
syncLabels();
renderResults();
showTab(PK.initialHash === '#balloon' ? 'balloon' : 'cylinder');
requestAnimationFrame(frame);

// Share: the readings go with the link, so the table and graph open as they are now,
// and so does how much air is in the balloon
PK.shareState = {
  get: () => ({ r: results.map((x) => [Number(x.V.toFixed(4)), Number(x.T.toFixed(2)), Number(x.p.toFixed(2))]), b: bl.popped ? 0 : bl.in.length }),
  set: (o) => {
    if (Number.isInteger(o.b) && o.b >= 0 && o.b <= 1200) blNew(o.b);
    if (!Array.isArray(o.r)) return;
    results.length = 0;
    o.r.forEach(([V, T, p]) => results.push({ V: Number(V), T: Number(T), p: Number(p) }));
    renderResults();
  },
};
