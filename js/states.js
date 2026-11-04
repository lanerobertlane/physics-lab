// States of matter: an energy model of 1 g of water drives a particle animation and a
// heating curve. Energy goes into kinetic energy (temperature rises) or, during a change
// of state, into potential energy (temperature stays constant).

PK.header({
  title: 'States of matter',
  spec: [
    { code: '4.3.1.2', text: 'Changes of state: melting, freezing, boiling, evaporating, condensing; mass is conserved' },
    { code: '4.3.2.1', text: 'Internal energy: the total kinetic and potential energy of the particles' },
    { code: '4.3.2.2', text: 'Temperature changes in a system and specific heat capacity: ΔE = m c Δθ' },
    { code: '4.3.2.3', text: 'Changes of state and specific latent heat: E = m L' },
    { code: 'KS3', text: 'The particle model; changes of state; internal energy' },
  ],
});

const $ = (id) => document.getElementById(id);

// ---------- Energy model (1 g of water, energies in joules) ----------

const T_MIN = -40, T_MAX = 150;
const C_ICE = 2.1, C_WATER = 4.2, C_STEAM = 2.0;   // J/g °C
const L_F = 334, L_V = 2260;                        // J/g
const E1 = C_ICE * (0 - T_MIN);
const E2 = E1 + L_F;
const E3 = E2 + C_WATER * 100;
const E4 = E3 + L_V;
const E_MAX = E4 + C_STEAM * (T_MAX - 100);

// Temperature and how much is solid / liquid / gas for a given internal energy.
function stateOf(E) {
  if (E <= E1) return { T: T_MIN + E / C_ICE, s: 1, l: 0, g: 0 };
  if (E <= E2) { const f = (E - E1) / L_F; return { T: 0, s: 1 - f, l: f, g: 0 }; }
  if (E <= E3) return { T: (E - E2) / C_WATER, s: 0, l: 1, g: 0 };
  if (E <= E4) { const f = (E - E3) / L_V; return { T: 100, s: 0, l: 1 - f, g: f }; }
  return { T: 100 + (E - E4) / C_STEAM, s: 0, l: 0, g: 1 };
}

const sim = { E: C_ICE * 20, mode: 'off', power: 50, speed: 2, t: 0 };   // starts as ice at −20 °C
let curve = [];

// ---------- Particles ----------

const W = 800, H = 460;
const BOX = { x0: 60, y0: 30, x1: 520, y1: 430 };
const R = 11, N = 64;
const COLS = 8;

// Lattice sites packed at the bottom of the box; index 0 is bottom-left.
const sites = [];
for (let i = 0; i < N; i++) {
  const row = Math.floor(i / COLS), col = i % COLS;
  const sp = 2 * R + 2;
  const width = COLS * sp;
  sites.push({
    x: (BOX.x0 + BOX.x1) / 2 - width / 2 + sp / 2 + col * sp + (row % 2 ? sp / 2 - sp / 4 : -sp / 4),
    y: BOX.y1 - R - 2 - row * sp * 0.88,
  });
}
const parts = sites.map((s) => ({ x: s.x, y: s.y, vx: 0, vy: 0 }));

function phases() {
  const st = stateOf(sim.E);
  const nSolid = Math.round(N * st.s), nGas = Math.round(N * st.g);
  // The bottom particles stay solid longest; the top ones evaporate first.
  return parts.map((_, i) => (i < nSolid ? 'solid' : i >= N - nGas ? 'gas' : 'liquid'));
}

let rnd = (() => { let s = 11; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 - 0.5; }; })();

function stepParticles(dt) {
  const st = stateOf(sim.E);
  const TK = st.T + 273;
  const ph = phases();
  const jiggle = Math.sqrt(TK / 273);

  // Particles push apart when they overlap (gravity keeps the liquid together at the bottom).
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const a = parts[i], b = parts[j];
    const dx = b.x - a.x, dy = b.y - a.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > (2 * R) ** 2 || d2 < 1e-6) continue;
    const d = Math.sqrt(d2);
    const f = -(2 * R - d) * 60;
    const fx = (dx / d) * f, fy = (dy / d) * f;
    a.vx += fx * dt * 10; a.vy += fy * dt * 10;
    b.vx -= fx * dt * 10; b.vy -= fy * dt * 10;
  }

  parts.forEach((p, i) => {
    if (ph[i] === 'solid') {
      const s = sites[i];
      p.vx += ((s.x - p.x) * 120 - p.vx * 8) * dt + rnd() * 900 * jiggle * dt;
      p.vy += ((s.y - p.y) * 120 - p.vy * 8) * dt + rnd() * 900 * jiggle * dt;
    } else if (ph[i] === 'liquid') {
      p.vy += 900 * dt;                                   // gravity keeps the liquid at the bottom
      p.vx += rnd() * 9000 * jiggle * dt;                 // strong jostling: particles slide past each other
      p.vy += rnd() * 6000 * jiggle * dt;
      p.vx *= 1 - 4 * dt; p.vy *= 1 - 4 * dt;
    } else {
      // Gas: fast and free; keep the speed matched to the temperature.
      const target = 300 * jiggle;
      const v = Math.hypot(p.vx, p.vy);
      if (v < 5) {
        // A particle that has just evaporated gets launched in a random upward direction.
        const a = -Math.PI / 2 + rnd() * 2.4;
        p.vx = Math.cos(a) * target; p.vy = Math.sin(a) * target;
      } else {
        const k = 1 + (target / v - 1) * Math.min(1, 3 * dt);
        p.vx *= k; p.vy *= k;
      }
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < BOX.x0 + R) { p.x = BOX.x0 + R; p.vx = Math.abs(p.vx); }
    if (p.x > BOX.x1 - R) { p.x = BOX.x1 - R; p.vx = -Math.abs(p.vx); }
    if (p.y < BOX.y0 + R) { p.y = BOX.y0 + R; p.vy = Math.abs(p.vy); }
    if (p.y > BOX.y1 - R) { p.y = BOX.y1 - R; p.vy = -Math.abs(p.vy) * (ph[i] === 'gas' ? 1 : 0.3); }
  });
}

// ---------- Drawing ----------

const box = $('box'), bctx = box.getContext('2d');
const cv = $('curve'), cctx = cv.getContext('2d');

function sizeCanvases() {
  const dpr = window.devicePixelRatio || 1;
  box.width = Math.round(box.clientWidth * dpr); box.height = Math.round(box.clientWidth * (H / W) * dpr);
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (260 / 800) * dpr);
}

const PCOL = { solid: '#4a90d9', liquid: '#2bb3c0', gas: '#e8833a' };

function drawBox() {
  const k = box.width / W;
  bctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), art: PK.cssVar('--art') };
  const font = PK.cssVar('--font-body') || 'sans-serif';
  bctx.fillStyle = c.surface;
  bctx.fillRect(0, 0, W, H);

  // Container
  bctx.strokeStyle = c.art; bctx.lineWidth = 4;
  bctx.strokeRect(BOX.x0 - 2, BOX.y0 - 2, BOX.x1 - BOX.x0 + 4, BOX.y1 - BOX.y0 + 4);

  // Heater glow / cooling frost under the box
  if (sim.mode !== 'off') {
    const g = bctx.createLinearGradient(0, BOX.y1, 0, BOX.y1 + 26);
    g.addColorStop(0, sim.mode === 'heat' ? 'rgba(255,110,40,.9)' : 'rgba(90,170,255,.9)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    bctx.fillStyle = g;
    bctx.fillRect(BOX.x0, BOX.y1 + 2, BOX.x1 - BOX.x0, 26);
  }

  const ph = phases();
  parts.forEach((p, i) => {
    bctx.fillStyle = PCOL[ph[i]];
    bctx.strokeStyle = c.text;
    bctx.lineWidth = 1.2;
    bctx.beginPath(); bctx.arc(p.x, p.y, R, 0, Math.PI * 2); bctx.fill(); bctx.stroke();
  });

  // Key and thermometer
  const st = stateOf(sim.E);
  bctx.font = `700 15px ${font}`;
  bctx.textBaseline = 'middle';
  [['solid', 'Solid (ice)'], ['liquid', 'Liquid (water)'], ['gas', 'Gas (steam)']].forEach(([k2, label], i) => {
    const y = 60 + i * 30;
    bctx.fillStyle = PCOL[k2];
    bctx.beginPath(); bctx.arc(570, y, 9, 0, Math.PI * 2); bctx.fill();
    bctx.fillStyle = c.text; bctx.textAlign = 'left';
    bctx.fillText(label, 588, y);
  });
  // Thermometer
  const tx = 720, ty0 = 170, ty1 = 400;
  const frac = (st.T - T_MIN) / (T_MAX - T_MIN);
  bctx.fillStyle = c.surface; bctx.strokeStyle = c.text; bctx.lineWidth = 2;
  bctx.beginPath(); bctx.roundRect ? bctx.roundRect(tx - 9, ty0, 18, ty1 - ty0, 9) : bctx.rect(tx - 9, ty0, 18, ty1 - ty0); bctx.fill(); bctx.stroke();
  bctx.fillStyle = '#e53935';
  bctx.fillRect(tx - 5, ty1 - frac * (ty1 - ty0 - 10) - 5, 10, frac * (ty1 - ty0 - 10) + 5);
  bctx.beginPath(); bctx.arc(tx, ty1 + 10, 15, 0, Math.PI * 2); bctx.fill(); bctx.stroke();
  bctx.font = `600 12px ${font}`; bctx.textAlign = 'right'; bctx.fillStyle = c.muted;
  for (const t of [-40, 0, 50, 100, 150]) {
    const y = ty1 - ((t - T_MIN) / (T_MAX - T_MIN)) * (ty1 - ty0 - 10) - 5;
    bctx.fillText(`${t} °C`, tx - 16, y);
  }
}

function drawCurve() {
  const GW = 800, GH = 260;
  const k = cv.width / GW;
  cctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), line: PK.cssVar('--f4') };
  const font = PK.cssVar('--font-body') || 'sans-serif';
  cctx.fillStyle = c.surface;
  cctx.fillRect(0, 0, GW, GH);
  const L = 60, Rm = 20, T = 14, B = 40, pw = GW - L - Rm, ph = GH - T - B;
  const tMax = Math.max(60, Math.ceil((curve.length ? curve[curve.length - 1].t : 0) / 20) * 20);
  const X = (t) => L + (t / tMax) * pw;
  const Y = (temp) => T + ph - ((temp - T_MIN) / (T_MAX - T_MIN)) * ph;

  cctx.strokeStyle = c.grid; cctx.lineWidth = 1;
  cctx.fillStyle = c.muted; cctx.font = `600 11px ${font}`;
  cctx.textAlign = 'right'; cctx.textBaseline = 'middle';
  for (const temp of [-40, 0, 50, 100, 150]) {
    cctx.beginPath(); cctx.moveTo(L, Y(temp)); cctx.lineTo(L + pw, Y(temp)); cctx.stroke();
    cctx.fillText(temp, L - 6, Y(temp));
  }
  cctx.textAlign = 'center'; cctx.textBaseline = 'top';
  const step = tMax <= 120 ? 20 : tMax <= 300 ? 50 : 100;
  for (let t = 0; t <= tMax; t += step) cctx.fillText(t, X(t), T + ph + 4);
  cctx.strokeStyle = c.text; cctx.lineWidth = 1.5;
  cctx.beginPath(); cctx.moveTo(L, T); cctx.lineTo(L, T + ph); cctx.lineTo(L + pw, T + ph); cctx.stroke();
  cctx.fillStyle = c.text; cctx.font = `700 12px ${font}`;
  cctx.fillText('time / s', L + pw / 2, GH - 16);
  cctx.save(); cctx.translate(16, T + ph / 2); cctx.rotate(-Math.PI / 2); cctx.textBaseline = 'middle'; cctx.fillText('temperature / °C', 0, 0); cctx.restore();

  if (curve.length > 1) {
    cctx.strokeStyle = c.line; cctx.lineWidth = 2.5;
    cctx.beginPath();
    curve.forEach((p, i) => (i ? cctx.lineTo(X(p.t), Y(p.T)) : cctx.moveTo(X(p.t), Y(p.T))));
    cctx.stroke();
  }
  // Label the flat sections
  cctx.fillStyle = c.muted; cctx.font = `700 12px ${font}`; cctx.textAlign = 'left'; cctx.textBaseline = 'bottom';
  cctx.fillText('melting / freezing point (0 °C)', L + 6, Y(0) - 3);
  cctx.fillText('boiling point (100 °C)', L + 6, Y(100) - 3);
}

// ---------- Panel ----------

function renderPanel() {
  const st = stateOf(sim.E);
  $('temp').textContent = `${st.T.toFixed(1)} °C`;
  let phase, explain;
  if (st.s === 1) { phase = 'Solid (ice)'; explain = 'The particles are held in a regular pattern by strong forces. They vibrate about fixed positions; hotter means faster vibrations.'; }
  else if (st.s > 0) { phase = 'Melting: solid and liquid'; explain = 'The temperature stays at 0 °C. The energy supplied breaks bonds between particles (latent heat of fusion), raising their potential energy, not their kinetic energy.'; }
  else if (st.l === 1) { phase = 'Liquid (water)'; explain = 'The particles are still touching but can move around each other. Heating makes them move faster, so the temperature rises.'; }
  else if (st.l > 0) { phase = 'Boiling: liquid and gas'; explain = 'The temperature stays at 100 °C. The energy (latent heat of vaporisation) separates the particles completely. This takes much more energy than melting.'; }
  else { phase = 'Gas (steam)'; explain = 'The particles are far apart and move quickly in random directions. Heating makes them move even faster.'; }
  if (sim.mode === 'cool') explain = explain.replace('energy supplied breaks', 'energy released as bonds form').replace('The energy (latent', 'Energy (latent');
  $('phase').textContent = phase;
  $('explain').textContent = explain;

  const pe = L_F * (1 - st.s) + L_V * st.g;
  const ke = sim.E - pe;   // kinetic part (measured from −40 °C): everything that isn't latent heat
  $('ke-bar').style.width = `${Math.max(0, (ke / E_MAX) * 100)}%`;
  $('pe-bar').style.width = `${(pe / E_MAX) * 100}%`;
  $('ke-num').textContent = `${Math.round(ke)} J`;
  $('pe-num').textContent = `${Math.round(pe)} J`;
}

// ---------- Loop & controls ----------

let lastT = performance.now(), sinceRec = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (sim.mode !== 'off') {
    const simDt = dt * sim.speed;
    sim.E = Math.max(0, Math.min(E_MAX, sim.E + (sim.mode === 'heat' ? 1 : -1) * sim.power * simDt));
    sim.t += simDt;
    sinceRec += simDt;
    if (sinceRec > 0.2) { curve.push({ t: sim.t, T: stateOf(sim.E).T }); sinceRec = 0; }
    if (sim.E === 0 || sim.E === E_MAX) setMode('off');
  }
  for (let i = 0; i < 4; i++) stepParticles(dt / 4);
  drawBox();
  drawCurve();
  renderPanel();
  requestAnimationFrame(frame);
}

function setMode(m) {
  sim.mode = m;
  $('heat').setAttribute('aria-pressed', String(m === 'heat'));
  $('cool').setAttribute('aria-pressed', String(m === 'cool'));
}

$('heat').addEventListener('click', () => setMode(sim.mode === 'heat' ? 'off' : 'heat'));
$('cool').addEventListener('click', () => setMode(sim.mode === 'cool' ? 'off' : 'cool'));
$('stop').addEventListener('click', () => setMode('off'));
$('reset').addEventListener('click', () => {
  setMode('off');
  sim.E = C_ICE * 20; sim.t = 0; curve = [{ t: 0, T: stateOf(sim.E).T }];
  parts.forEach((p, i) => { p.x = sites[i].x; p.y = sites[i].y; p.vx = 0; p.vy = 0; });
});
$('speed').addEventListener('change', (e) => { sim.speed = Number(e.target.value); });
$('power').addEventListener('input', (e) => { sim.power = Number(e.target.value); $('power-val').textContent = `${sim.power} W`; });
$('power-val').textContent = `${sim.power} W`;

window.addEventListener('resize', sizeCanvases);
curve = [{ t: 0, T: stateOf(sim.E).T }];
sizeCanvases();
requestAnimationFrame(frame);
