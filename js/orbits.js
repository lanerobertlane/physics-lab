// Orbits: Newtonian gravity (a = GM / r², towards the centre) integrated with small time steps.
// Launch speed is given as a percentage of the circular-orbit speed √(GM/r):
// below 100% the orbit dips (or crashes), 100% is circular, 141% (√2) is escape speed.

PK.header({
  title: 'Orbits',
  spec: [
    { code: '4.8.1.1', text: 'Our solar system: planets, moons and artificial satellites' },
    { code: '4.8.1.3', text: 'Orbital motion, natural and artificial satellites: gravity provides the force for circular orbits', po: true },
    { code: '4.8.1.3', text: 'In a circular orbit speed is constant but velocity changes; a change in speed needs a change in radius', po: true, ht: true },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d');
const W = 800, H = 560, CX = 400, CY = 280, PLANET_R = 48;
const GM = 2.4e6;
const vCirc = (r) => Math.sqrt(GM / r);
const COLS = ['#ffb020', '#4fc3f7', '#ff6b9d', '#7ee787', '#c39bff', '#ff8a50'];

const state = { r0: 150, pct: 100, arrows: true };
let sats = [];
let ci = 0;

function launch(r0 = state.r0, pct = state.pct) {
  const v = (vCirc(r0) * pct) / 100;
  sats.push({ x: CX, y: CY - r0, vx: v, vy: 0, trail: [], col: COLS[ci++ % COLS.length], status: 'flying', pct, r0, t: 0 });
  if (sats.length > 8) sats.shift();
}

function outcome(pct) {
  if (pct === 0) return 'falls straight down';
  if (pct < 100) return 'an ellipse dipping closer (or it crashes)';
  if (pct === 100) return 'a circular orbit';
  if (pct < 141) return 'a stretched-out ellipse';
  return 'escapes: it never comes back';
}

function step(dt) {
  const sub = 20, h = dt / sub;
  for (const s of sats) {
    if (s.status !== 'flying') continue;
    for (let i = 0; i < sub; i++) {
      const dx = s.x - CX, dy = s.y - CY, r = Math.hypot(dx, dy);
      if (r < PLANET_R) { s.status = 'crashed'; break; }
      if (r > 1400) { s.status = 'escaped'; break; }
      const a = GM / (r * r);
      s.vx -= (a * dx / r) * h; s.vy -= (a * dy / r) * h;
      s.x += s.vx * h; s.y += s.vy * h;
    }
    s.t += dt;
    s.trail.push({ x: s.x, y: s.y });
    if (s.trail.length > 1400) s.trail.shift();
  }
}

function arrow(x1, y1, x2, y2, col) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 10 * Math.cos(a - 0.4), y2 - 10 * Math.sin(a - 0.4)); ctx.lineTo(x2 - 10 * Math.cos(a + 0.4), y2 - 10 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
}

// Fixed starfield
const STARS = Array.from({ length: 140 }, (_, i) => ({ x: (i * 97.3) % W, y: (i * 53.7 + (i % 7) * 31) % H, s: (i % 3) * 0.5 + 0.6 }));

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const font = PK.cssVar('--font-body') || 'sans-serif';
  ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (const st of STARS) { ctx.beginPath(); ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2); ctx.fill(); }

  // Planet
  const g = ctx.createRadialGradient(CX - 16, CY - 16, 6, CX, CY, PLANET_R);
  g.addColorStop(0, '#6fb7ff'); g.addColorStop(0.6, '#2b6cc4'); g.addColorStop(1, '#173e7a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, PLANET_R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(80, 170, 90, .8)';
  ctx.beginPath(); ctx.ellipse(CX - 12, CY - 8, 16, 10, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(CX + 18, CY + 14, 12, 8, -0.3, 0, Math.PI * 2); ctx.fill();

  // Launch point preview
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(CX, CY, state.r0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(CX, CY - state.r0, 4, 0, Math.PI * 2); ctx.fill();

  for (const s of sats) {
    ctx.strokeStyle = s.col; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
    ctx.beginPath(); s.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.globalAlpha = 1;
    if (s.status === 'crashed') { ctx.fillStyle = '#ff5a3c'; ctx.font = `800 18px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✸', s.x, s.y); continue; }
    ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill();
  }

  const latest = sats[sats.length - 1];
  if (state.arrows && latest && latest.status === 'flying') {
    const v = Math.hypot(latest.vx, latest.vy), dx = CX - latest.x, dy = CY - latest.y, r = Math.hypot(dx, dy);
    arrow(latest.x, latest.y, latest.x + (latest.vx / v) * (30 + v * 0.25), latest.y + (latest.vy / v) * (30 + v * 0.25), '#7ee787');
    const f = Math.min(90, 20 + (GM / (r * r)) * 0.25);
    arrow(latest.x, latest.y, latest.x + (dx / r) * f, latest.y + (dy / r) * f, '#ff6b6b');
    ctx.font = `700 13px ${font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7ee787'; ctx.fillText('velocity', 16, H - 40);
    ctx.fillStyle = '#ff6b6b'; ctx.fillText('gravitational force (towards the centre)', 16, H - 20);
  }
}

function renderPanel() {
  $('height-val').textContent = `${state.r0} units`;
  $('speed-val').textContent = `${state.pct}% of circular speed`;
  $('predict').innerHTML = `Prediction: <b>${outcome(state.pct)}</b>. Circular speed here: ${vCirc(state.r0).toFixed(0)} units/s.`;
  const s = sats[sats.length - 1];
  if (!s) { $('readout').innerHTML = '<dt>—</dt><dd>Press Launch</dd>'; return; }
  const r = Math.hypot(s.x - CX, s.y - CY), v = Math.hypot(s.vx, s.vy);
  $('readout').innerHTML = `
    <dt>Status</dt><dd>${s.status === 'flying' ? 'in flight' : s.status}</dd>
    <dt>Distance from centre</dt><dd>${r.toFixed(0)} units</dd>
    <dt>Speed</dt><dd>${v.toFixed(0)} units/s</dd>`;
}

$('launch').addEventListener('click', () => launch());
$('compare').addEventListener('click', () => { sats = []; for (const r of [100, 160, 230]) launch(r, 100); });
$('clear').addEventListener('click', () => { sats = []; });
$('height').addEventListener('input', (e) => { state.r0 = Number(e.target.value); renderPanel(); });
$('speed').addEventListener('input', (e) => { state.pct = Number(e.target.value); renderPanel(); });
$('arrows').addEventListener('change', (e) => { state.arrows = e.target.checked; });

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  draw();
  if ((tick += dt) > 0.2) { tick = 0; renderPanel(); }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeCanvas);
sizeCanvas();
renderPanel();
requestAnimationFrame(frame);
