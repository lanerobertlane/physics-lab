// Ripple tank: the 2D wave equation solved on a grid (finite differences). Walls reflect,
// shallow water slows the waves, and gaps diffract them — all from the same simple rule.

PK.header({
  title: 'Ripple tank',
  spec: [
    { code: '4.6.1.2', text: 'Properties of waves: wavelength, frequency, period and wave speed; v = f λ' },
    { code: '4.6.1.2', text: 'Required practical: measure the frequency, wavelength and speed of waves in a ripple tank' },
    { code: '4.6.1.3', text: 'Reflection and refraction of waves at a boundary', po: true },
    { code: 'KS3', text: 'Waves on water as undulations which travel through water with transverse motion; reflection' },
  ],
});

const $ = (id) => document.getElementById(id);

// The visible tank is 40 cm × 25 cm (6 grid cells per cm). The simulated tank is taller,
// with hidden strips above and below, so edge effects there fade before they reach the view.
const TANK_W = 40, TANK_H = 25, PER_CM = 6;
const PAD = 60;
const NX = TANK_W * PER_CM, NYV = TANK_H * PER_CM, NY = NYV + 2 * PAD, N = NX * NY;
const W = 800, H = 500, PX_PER_CM = W / TANK_W;
const V_DEEP = 24, V_SHALLOW = 14;          // cm/s
const DX = 1 / PER_CM;                      // cm
const DT = (0.5 * DX) / V_DEEP;             // s, keeps the simulation stable
const SPONGE = 16;
const SOURCE_GAIN = 0.078;   // tuned so waves have an amplitude of about 1 at any frequency

let u = new Float32Array(N), up = new Float32Array(N), un = new Float32Array(N);
const c2 = new Float32Array(N);      // (c dt / dx)² for each cell
const wall = new Uint8Array(N);
const shallow = new Uint8Array(N);
const damp = new Float32Array(N);

const MODES = {
  measure: { name: 'Measure waves' },
  reflect: { name: 'Reflection', slider: { label: 'Barrier angle', min: 20, max: 70, step: 5, value: 45, unit: '°' } },
  refract: { name: 'Refraction', slider: { label: 'Boundary angle', min: 0, max: 50, step: 5, value: 30, unit: '°' } },
  diffract: { name: 'Diffraction', slider: { label: 'Gap width', min: 1, max: 10, step: 0.5, value: 3, unit: ' cm' } },
};

const state = {
  mode: 'measure', f: 6, source: 'plane', param: null, speed: 1, frozen: false,
  ruler: { on: true, x: 6, y: 3, vertical: false, len: 20 },
  mark: 30,                 // x position of the counting line (cm)
  watch: { running: false, t: 0, count: 0 },
  t: 0,
};

const idx = (i, j) => j * NX + i;

// ---------- Geometry for each mode ----------

function build() {
  wall.fill(0); shallow.fill(0);
  const p = state.param;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const x = i / PER_CM, y = (j - PAD) / PER_CM, k = idx(i, j);
    if (state.mode === 'reflect') {
      // A barrier through (28, 12.5) tilted p° from the wavefronts.
      const a = (p * Math.PI) / 180;
      const dx = x - 28, dy = y - 12.5;
      const along = dx * Math.sin(a) + dy * Math.cos(a);
      const across = dx * Math.cos(a) - dy * Math.sin(a);
      if (Math.abs(across) < 0.35 && Math.abs(along) < 11) wall[k] = 1;
    } else if (state.mode === 'refract') {
      // Shallow water (a glass plate) beyond a boundary through (18, 12.5), tilted p° from the wavefronts.
      const a = (p * Math.PI) / 180;
      if ((x - 18) * Math.cos(a) - (y - 12.5) * Math.sin(a) > 0) shallow[k] = 1;
    } else if (state.mode === 'diffract') {
      if (Math.abs(x - 16) < 0.35 && Math.abs(y - 12.5) > p / 2) wall[k] = 1;
    }
    const v = shallow[k] ? V_SHALLOW : V_DEEP;
    c2[k] = ((v * DT) / DX) ** 2;
    // Edges soak waves up so they don't bounce back. In plain "measure" mode with straight waves
    // the top and bottom walls reflect instead: walls parallel to the waves keep them straight.
    // The top/bottom soak-up strips sit in the hidden padding, and are gentle so they don't reflect.
    const absorbTB = state.source === 'point' || state.mode !== 'measure';
    const dSide = Math.min(i, NX - 1 - i);
    const dTB = Math.min(j, NY - 1 - j);
    let d = 1;
    if (dSide < SPONGE) d *= 1 - 0.15 * ((SPONGE - dSide) / SPONGE) ** 2;
    if (absorbTB && dTB < PAD - 10) d *= 1 - 0.06 * ((PAD - 10 - dTB) / (PAD - 10)) ** 2;
    damp[k] = d;
  }
}

function clearWaves() { u.fill(0); up.fill(0); un.fill(0); state.t = 0; }

// The dipper adds a push each step rather than forcing the height, so waves reflected back
// towards it pass straight through and are soaked up at the edge (no standing-wave mess).
function drive(t) {
  const a = Math.sin(2 * Math.PI * state.f * t) * SOURCE_GAIN * (state.f / 8) ** 1.65;
  if (state.source === 'plane') {
    const i = SPONGE + 2;
    for (let j = 1; j < NY - 1; j++) un[idx(i, j)] += a;
  } else {
    const ci = SPONGE + 6, cj = NY / 2;
    for (let j = cj - 2; j <= cj + 2; j++) for (let i = ci - 2; i <= ci + 2; i++) {
      if ((i - ci) ** 2 + (j - cj) ** 2 <= 4) un[idx(i, j)] += a * 1.2;
    }
  }
}

// Refraction is drawn from the exact solution: straight waves in deep water, and in shallow water
// waves that keep the same frequency, travel slower (shorter λ) and bend so the fronts join up.
const SRC_X = (SPONGE + 2) / PER_CM;
function refractField(x, y, t) {
  if (x < SRC_X) return 0;
  const w = 2 * Math.PI * state.f, k1 = w / V_DEEP, k2 = w / V_SHALLOW;
  const a = (state.param * Math.PI) / 180;
  const nx = Math.cos(a), ny = -Math.sin(a), tx = Math.sin(a), ty = Math.cos(a);
  const rx = x - 18, ry = y - 12.5;
  const into = rx * nx + ry * ny;
  let phase;
  if (into <= 0) phase = k1 * (x - SRC_X);
  else {
    const k2t = k1 * tx;                        // the wave's component along the boundary is kept
    const k2n = Math.sqrt(Math.max(0, k2 * k2 - k2t * k2t));
    const bx = 18 - SRC_X;                      // phase at the boundary point (18, 12.5)
    phase = k1 * bx + k2t * (rx * tx + ry * ty) + k2n * into;
  }
  return Math.sin(w * t - phase);
}

function step() {
  state.t += DT;
  if (state.mode === 'refract') {
    if (state.watch.running) countCrossing();
    return;
  }
  for (let j = 1; j < NY - 1; j++) {
    for (let i = 1; i < NX - 1; i++) {
      const k = j * NX + i;
      if (wall[k]) { un[k] = 0; continue; }
      const lap = u[k - 1] + u[k + 1] + u[k - NX] + u[k + NX] - 4 * u[k];
      un[k] = (2 * u[k] - up[k] + c2[k] * lap) * damp[k];
    }
  }
  drive(state.t);
  // Tank walls: the water surface is free to move at the wall (zero slope), so copy the
  // neighbouring row/column into the edge.
  for (let i = 0; i < NX; i++) { un[i] = un[i + NX]; un[(NY - 1) * NX + i] = un[(NY - 2) * NX + i]; }
  for (let j = 0; j < NY; j++) { un[j * NX] = un[j * NX + 1]; un[j * NX + NX - 1] = un[j * NX + NX - 2]; }
  [up, u, un] = [u, un, up];
  if (state.watch.running) countCrossing();
}

// Count crests passing the red line (upward zero-crossings in the middle of the tank).
let lastAtMark = 0;
function countCrossing() {
  state.watch.t += DT;
  const v = state.mode === 'refract'
    ? refractField(state.mark, NY / 2 / PER_CM - PAD / PER_CM, state.t)
    : u[idx(Math.round(state.mark * PER_CM), Math.round(NY / 2))];
  if (lastAtMark < -0.05 && v >= -0.05 && v > lastAtMark) state.watch.count++;
  lastAtMark = v;
}

// ---------- Rendering ----------

const canvas = $('tank');
const ctx = canvas.getContext('2d');
const off = document.createElement('canvas');
off.width = NX; off.height = NYV;
const offCtx = off.getContext('2d');
const img = offCtx.createImageData(NX, NYV);

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

function render() {
  const d = img.data;
  const exact = state.mode === 'refract';
  for (let p = 0; p < NX * NYV; p++) {
    const k = p + PAD * NX;      // skip the hidden strip at the top
    const o = p * 4;
    if (wall[k]) { d[o] = 70; d[o + 1] = 74; d[o + 2] = 82; d[o + 3] = 255; continue; }
    // Bright crests and dark troughs, like the shadow pattern on the paper under a real tank.
    const val = exact ? refractField((p % NX) / PER_CM, Math.floor(p / NX) / PER_CM, state.t) : u[k] * 1.1;
    const v = Math.max(-1, Math.min(1, val));
    const t = 0.5 + 0.5 * v;
    let r = 24 + t * 206, g = 70 + t * 175, b = 130 + t * 122;
    if (shallow[k]) { r = r * 0.85 + 30; g = g * 0.9 + 14; b *= 0.9; }
    d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
  }
  offCtx.putImageData(img, 0, 0);

  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);

  const font = PK.cssVar('--font-body') || 'sans-serif';

  // Dipper
  ctx.fillStyle = '#333';
  if (state.source === 'plane') ctx.fillRect(((SPONGE + 2) / PER_CM) * PX_PER_CM - 3, 0, 6, H);
  else { ctx.beginPath(); ctx.arc(((SPONGE + 6) / PER_CM) * PX_PER_CM, ((Math.round(NY / 2) - PAD) / PER_CM) * PX_PER_CM, 7, 0, Math.PI * 2); ctx.fill(); }

  if (state.mode === 'refract') {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = `700 14px ${font}`;
    ctx.textAlign = 'right';
    ctx.fillText('shallow water (over a glass plate)', W - 24, H - 22);
    ctx.textAlign = 'left';
    ctx.fillText('deep water', 24, H - 22);
  }

  // Counting line
  const mx = state.mark * PX_PER_CM;
  ctx.strokeStyle = '#e53935';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.arc(mx, H / 2, 7, 0, Math.PI * 2); ctx.fill();

  if (state.ruler.on) drawRuler(font);
}

function drawRuler(font) {
  const r = state.ruler;
  const L = r.len * PX_PER_CM, T = 40;
  ctx.save();
  ctx.translate(r.x * PX_PER_CM, r.y * PX_PER_CM);
  if (r.vertical) ctx.rotate(Math.PI / 2);
  ctx.fillStyle = 'rgba(255, 236, 140, 0.88)';
  ctx.strokeStyle = '#7a6a1f';
  ctx.lineWidth = 1.5;
  ctx.fillRect(0, 0, L, T);
  ctx.strokeRect(0, 0, L, T);
  ctx.strokeStyle = '#222';
  ctx.fillStyle = '#222';
  ctx.font = `700 11px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let mm = 0; mm <= r.len * 10; mm++) {
    const x = (mm / 10) * PX_PER_CM;
    const h = mm % 10 === 0 ? 14 : mm % 5 === 0 ? 10 : 6;
    ctx.lineWidth = mm % 10 === 0 ? 1.4 : 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    if (mm % 10 === 0) ctx.fillText(String(mm / 10), x, 16);
  }
  ctx.font = `600 10px ${font}`;
  ctx.textAlign = 'right';
  ctx.fillText('cm', L - 4, 28);
  ctx.restore();
}

// ---------- Loop ----------

let lastT = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (!state.frozen) {
    acc += dt * state.speed;
    let n = 0;
    while (acc >= DT && n < 40) { step(); acc -= DT; n++; }
    if (n === 40) acc = 0;
  }
  render();
  if (state.watch.running || state.watch.t) {
    $('watch').textContent = `${state.watch.t.toFixed(2)} s`;
    $('count').textContent = state.watch.count;
  }
  requestAnimationFrame(frame);
}

// ---------- Dragging the ruler and the counting line ----------

function point(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * TANK_W, y: ((e.clientY - r.top) / r.height) * TANK_H };
}

function onRuler(p) {
  const r = state.ruler, T = 40 / PX_PER_CM;
  const dx = p.x - r.x, dy = p.y - r.y;
  return r.vertical ? (dy >= 0 && dy <= r.len && dx <= 0 && dx >= -T) : (dx >= 0 && dx <= r.len && dy >= 0 && dy <= T);
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = point(e);
  if (state.ruler.on && onRuler(p)) drag = { what: 'ruler', dx: state.ruler.x - p.x, dy: state.ruler.y - p.y };
  else if (Math.abs(p.x - state.mark) < 1.2) drag = { what: 'mark' };
  if (drag) { try { canvas.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ } e.preventDefault(); }
});
canvas.addEventListener('pointermove', (e) => {
  const p = point(e);
  canvas.style.cursor = drag || (state.ruler.on && onRuler(p)) || Math.abs(p.x - state.mark) < 1.2 ? 'grab' : 'default';
  if (!drag) return;
  if (drag.what === 'ruler') {
    state.ruler.x = Math.max(-5, Math.min(TANK_W, p.x + drag.dx));
    state.ruler.y = Math.max(0, Math.min(TANK_H, p.y + drag.dy));
  } else {
    state.mark = Math.max(SPONGE / PER_CM + 1, Math.min(TANK_W - SPONGE / PER_CM - 1, p.x));
  }
});
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// ---------- Controls ----------

function renderValues() {
  $('freq-val').textContent = `${state.f} Hz`;
  const lam = V_DEEP / state.f;
  const box = $('values');
  box.hidden = !$('show-values').checked;
  let html = `<p>f = <b>${state.f} Hz</b></p><p>λ = <b>${lam.toFixed(1)} cm</b> (deep water)</p><p>v = f λ = ${state.f} × ${lam.toFixed(1)} = <b>${V_DEEP} cm/s</b></p>`;
  if (state.mode === 'refract') html += `<p>In shallow water: v = <b>${V_SHALLOW} cm/s</b>, λ = <b>${(V_SHALLOW / state.f).toFixed(1)} cm</b>. The frequency doesn't change.</p>`;
  box.innerHTML = html;
}

function renderModeCtl() {
  const m = MODES[state.mode];
  const el = $('mode-ctl');
  if (!m.slider) { el.innerHTML = ''; return; }
  const s = m.slider;
  el.innerHTML = `<label for="param">${s.label} <b id="param-val">${state.param}${s.unit}</b></label>
    <input type="range" id="param" min="${s.min}" max="${s.max}" step="${s.step}" value="${state.param}">`;
  $('param').addEventListener('input', (e) => {
    state.param = Number(e.target.value);
    $('param-val').textContent = `${state.param}${s.unit}`;
    build();
    saveHash();
  });
}

function setMode(id) {
  state.mode = id;
  state.param = MODES[id].slider ? MODES[id].slider.value : null;
  document.querySelectorAll('#modes .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === id)));
  $('source').disabled = id === 'refract';   // refraction is shown with straight waves only
  if (id === 'refract') { state.source = 'plane'; $('source').value = 'plane'; }
  build();
  clearWaves();
  renderModeCtl();
  renderValues();
  saveHash();
}

$('modes').innerHTML = Object.entries(MODES).map(([id, m]) => `<button class="btn" data-mode="${id}">${m.name}</button>`).join('');
$('modes').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });

$('freq').addEventListener('input', (e) => { state.f = Number(e.target.value); renderValues(); saveHash(); });
$('source').addEventListener('change', (e) => { state.source = e.target.value; build(); clearWaves(); saveHash(); });
$('speed').addEventListener('change', (e) => { state.speed = Number(e.target.value); });
$('show-values').addEventListener('change', renderValues);
$('freeze').addEventListener('click', () => {
  state.frozen = !state.frozen;
  $('freeze').textContent = state.frozen ? '▶ Run' : '❚❚ Freeze (strobe)';
});
$('ruler-on').addEventListener('change', (e) => { state.ruler.on = e.target.checked; });
$('ruler-turn').addEventListener('click', () => {
  const r = state.ruler;
  r.vertical = !r.vertical;
  r.len = r.vertical ? 20 : 20;
  if (r.vertical) { r.x = Math.max(2.5, r.x); r.y = Math.min(r.y, TANK_H - r.len); }
  else { r.x = Math.min(r.x, TANK_W - r.len); }
  state.ruler.on = true; $('ruler-on').checked = true;
});

$('watch-start').addEventListener('click', () => {
  state.watch.running = !state.watch.running;
  $('watch-start').textContent = state.watch.running ? 'Stop' : 'Start';
  if (state.frozen && state.watch.running) $('freeze').click();
});
$('watch-reset').addEventListener('click', () => {
  state.watch = { running: false, t: 0, count: 0 };
  $('watch-start').textContent = 'Start';
  $('watch').textContent = '0.00 s';
  $('count').textContent = '0';
});

function saveHash() {
  const p = new URLSearchParams({ m: state.mode, f: state.f, s: state.source });
  if (state.param != null) p.set('p', state.param);
  history.replaceState(null, '', '#' + p.toString());
}

function loadHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const f = Number(p.get('f'));
  if (f >= 4 && f <= 12) state.f = f;
  if (p.get('s') === 'point') state.source = 'point';
  $('freq').value = state.f;
  $('source').value = state.source;
  const mode = MODES[p.get('m')] ? p.get('m') : 'measure';
  setMode(mode);
  const s = MODES[mode].slider;
  const v = Number(p.get('p'));
  if (s && v >= s.min && v <= s.max) { state.param = v; renderModeCtl(); build(); }
}

window.addEventListener('resize', sizeCanvas);

sizeCanvas();
loadHash();
requestAnimationFrame(frame);
