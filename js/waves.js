// Transverse and longitudinal waves: y = A sin(2π(f t − x/λ)). The same travelling wave is
// shown as beads moving up and down (transverse) and coils moving back and forth (longitudinal).

PK.header({
  title: 'Transverse & longitudinal waves',
  answers: true,
  spec: [
    { code: '4.6.1.1', text: 'Transverse and longitudinal waves: oscillations perpendicular or parallel to the direction of energy transfer; compressions and rarefactions' },
    { code: '4.6.1.2', text: 'Properties of waves: amplitude, wavelength, frequency, period (T = 1 / f) and wave speed (v = f λ)' },
    { code: 'KS3', text: 'Waves on water as transverse; sound as a longitudinal wave; frequency and amplitude' },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('waves');
const ctx = canvas.getContext('2d');
const W = 800, H = 500;
const X0 = 40, X1 = 760, PX = 20;          // 20 px per cm, 36 cm across
const MARK_X = 8;                          // the red particle's rest position (cm)

const state = { mode: 'both', f: 0.5, v: 10, A: 2, running: true, speed: 1, labels: true, graph: false, t: 0 };
const lambda = () => state.v / state.f;

const phase = (x) => 2 * Math.PI * (state.f * state.t - x / lambda());
const disp = (x, A) => A * Math.sin(phase(x));

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

// Positions (cm) inside the view where the phase equals `target` (mod 2π), left to right.
function featureXs(target) {
  const lam = lambda(), out = [];
  // phase(x) = target + 2πk  →  x = λ (f t − target/2π − k)
  const base = lam * (state.f * state.t - target / (2 * Math.PI));
  const kMin = Math.ceil((base - (X1 - X0) / PX) / lam), kMax = Math.floor(base / lam);
  for (let k = kMax; k >= kMin; k--) out.push(base - k * lam);
  return out.filter((x) => x >= 0 && x <= (X1 - X0) / PX).sort((a, b) => a - b);
}

const sx = (x) => X0 + x * PX;

function colours() {
  return {
    surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'),
    wave: PK.cssVar('--t-waves'), accent: PK.cssVar('--accent'), f1: PK.cssVar('--f1'), f2: PK.cssVar('--f2'), f3: PK.cssVar('--f3'),
    font: PK.cssVar('--font-body') || 'sans-serif',
  };
}

function doubleArrow(x1, y1, x2, y2, colour, label, c, labelSide = -1) {
  ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  for (const [x, y, a] of [[x2, y2, ang], [x1, y1, ang + Math.PI]]) {
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - 9 * Math.cos(a - 0.4), y - 9 * Math.sin(a - 0.4));
    ctx.lineTo(x - 9 * Math.cos(a + 0.4), y - 9 * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
  }
  ctx.font = `700 14px ${c.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = labelSide < 0 ? 'bottom' : 'top';
  const horizontal = Math.abs(y2 - y1) < 1;
  if (horizontal) ctx.fillText(label, (x1 + x2) / 2, y1 + labelSide * 5);
  else { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, x1 + 8, (y1 + y2) / 2); }
}

function drawTransverse(cy, c) {
  const A = state.A * PX;
  ctx.fillStyle = c.muted; ctx.font = `700 15px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('Transverse wave (drag up or down to change the amplitude)', X0, cy - 100);

  ctx.strokeStyle = c.muted; ctx.setLineDash([6, 6]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(X0, cy); ctx.lineTo(X1, cy); ctx.stroke(); ctx.setLineDash([]);

  // String
  ctx.strokeStyle = c.wave; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let x = 0; x <= (X1 - X0) / PX + 1e-9; x += 0.1) {
    const y = cy - disp(x, A);
    x === 0 ? ctx.moveTo(sx(x), y) : ctx.lineTo(sx(x), y);
  }
  ctx.stroke();
  // Beads
  for (let x = 0; x <= (X1 - X0) / PX + 1e-9; x += 1) {
    const marker = Math.abs(x - MARK_X) < 1e-6;
    ctx.fillStyle = marker ? '#e53935' : c.wave;
    ctx.strokeStyle = c.text; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sx(x), cy - disp(x, A), marker ? 8 : 5, 0, Math.PI * 2); ctx.fill(); if (marker) ctx.stroke();
  }

  if (!state.labels) return;
  // Particle motion: up and down
  doubleArrow(sx(MARK_X) - 26, cy - A - 6, sx(MARK_X) - 26, cy + A + 6, '#e53935', '', c);
  const crests = featureXs(Math.PI / 2), troughs = featureXs(-Math.PI / 2);
  ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'center';
  if (crests[0] != null) { ctx.textBaseline = 'bottom'; ctx.fillText('crest', sx(crests[0]), cy - A - 8); }
  const tr = troughs.find((x) => x > (crests[0] ?? -1)) ?? troughs[0];
  if (tr != null) { ctx.textBaseline = 'top'; ctx.fillText('trough', sx(tr), cy + A + 8); }
  // Wavelength: crest to crest
  lambdaArrow([...crests, ...troughs], cy - A - 34, c, -1);   // crest to crest, or trough to trough
  // Amplitude: rest line to a crest
  const ac = crests[1] ?? crests[0];
  if (ac != null) doubleArrow(sx(ac) + 16, cy, sx(ac) + 16, cy - A, c.f3, 'amplitude', c);
}

function drawLongitudinal(cy, c) {
  const lam = lambda();
  // Keep coils from crossing: the stretch 2πA/λ must stay below 1.
  const A = Math.min(state.A, (0.8 * lam) / (2 * Math.PI)) * PX;
  ctx.fillStyle = c.muted; ctx.font = `700 15px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('Longitudinal wave', X0, cy - 100);

  const half = 46;
  for (let x = 0; x <= (X1 - X0) / PX + 1e-9; x += 0.5) {
    const marker = Math.abs(x - MARK_X) < 1e-6;
    const px = sx(x) + disp(x, A);
    ctx.strokeStyle = marker ? '#e53935' : c.wave;
    ctx.lineWidth = marker ? 5 : 2.5;
    ctx.beginPath(); ctx.moveTo(px, cy - half); ctx.lineTo(px, cy + half); ctx.stroke();
  }
  // Rest position of the red coil
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.moveTo(sx(MARK_X), cy + half + 4); ctx.lineTo(sx(MARK_X) - 6, cy + half + 14); ctx.lineTo(sx(MARK_X) + 6, cy + half + 14); ctx.closePath(); ctx.fill();

  if (state.graph) {
    // Displacement–distance graph of the same wave (displacement drawn upwards).
    ctx.strokeStyle = c.f2; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for (let x = 0; x <= (X1 - X0) / PX + 1e-9; x += 0.1) {
      const y = cy - disp(x, A);
      x === 0 ? ctx.moveTo(sx(x), y) : ctx.lineTo(sx(x), y);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = c.f2; ctx.font = `700 12px ${c.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('displacement →', X1, cy - half - 4);
  }

  if (!state.labels) return;
  doubleArrow(sx(MARK_X) - A - 4, cy + half + 30, sx(MARK_X) + A + 4, cy + half + 30, '#e53935', '', c);
  const comps = featureXs(0), rares = featureXs(Math.PI);
  ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  comps.forEach((x, i) => ctx.fillText(i === 0 ? 'compression' : 'C', sx(x), cy - half - 6));
  rares.forEach((x, i) => ctx.fillText(i === 0 ? 'rarefaction' : 'R', sx(x), cy - half - 6));
  lambdaArrow([...comps, ...rares], cy + half + 52, c, 1);
}

// One wavelength measured from a visible feature (crest or compression), whichever way fits.
function lambdaArrow(xs, y, c, side) {
  const lam = lambda(), max = (X1 - X0) / PX;
  for (const x of xs) {
    if (x + lam <= max) return doubleArrow(sx(x), y, sx(x + lam), y, c.f2, 'wavelength λ', c, side);
    if (x - lam >= 0) return doubleArrow(sx(x - lam), y, sx(x), y, c.f2, 'wavelength λ', c, side);
  }
}

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = colours();
  ctx.fillStyle = c.surface;
  ctx.fillRect(0, 0, W, H);

  if (state.mode === 'both') { drawTransverse(130, c); drawLongitudinal(355, c); }
  else if (state.mode === 'transverse') drawTransverse(260, c);
  else drawLongitudinal(240, c);

  // Direction of energy transfer
  ctx.strokeStyle = c.text; ctx.fillStyle = c.text; ctx.lineWidth = 2;
  const y = H - 16;
  ctx.beginPath(); ctx.moveTo(X1 - 230, y); ctx.lineTo(X1, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X1, y); ctx.lineTo(X1 - 12, y - 6); ctx.lineTo(X1 - 12, y + 6); ctx.closePath(); ctx.fill();
  ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText('direction of energy transfer', X1, y - 6);
}

function renderWorking() {
  const lam = lambda();
  $('amp-val').textContent = `${state.A.toFixed(1)} cm`;
  $('working').innerHTML = `
    <p>Period: T = 1 ÷ f = 1 ÷ ${state.f.toFixed(2)} = <b>${PK.ans(`${(1 / state.f).toFixed(2)} s`)}</b></p>
    <p>Wavelength: λ = v ÷ f = ${state.v} ÷ ${state.f.toFixed(2)} = <b>${PK.ans(`${lam.toFixed(1)} cm`)}</b></p>
    <p>Check: v = f λ = ${state.f.toFixed(2)} × ${PK.ans(lam.toFixed(1))} = <b>${state.v} cm/s</b></p>
    <p class="note" style="margin-top:6px">Amplitude doesn't affect the speed, frequency or wavelength — it shows how much energy the wave carries.</p>`;
}

let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (state.running) state.t += dt * state.speed;
  draw();
  requestAnimationFrame(frame);
}

function setMode(m) {
  state.mode = m;
  document.querySelectorAll('#modes .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  $('graph').closest('label').hidden = m === 'transverse';
  saveHash();
}

$('modes').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });
$('pause').addEventListener('click', () => { state.running = !state.running; $('pause').textContent = state.running ? '❚❚ Pause' : '▶ Play'; });
PK.chips('speed', (v) => { state.speed = v; });
$('labels').addEventListener('change', (e) => { state.labels = e.target.checked; });
$('graph').addEventListener('change', (e) => { state.graph = e.target.checked; });
for (const [id, key] of [['freq', 'f'], ['vel', 'v'], ['amp', 'A']]) {
  $(id).addEventListener('input', (e) => {
    // Keep the wave where it is when f changes, so it doesn't jump.
    if (key === 'f') state.t *= state.f / PK.num(id);
    state[key] = PK.num(id);
    renderWorking();
    saveHash();
  });
}

function saveHash() {
  history.replaceState(null, '', '#' + new URLSearchParams({ m: state.mode, f: state.f, v: state.v, a: state.A }).toString());
}
function loadHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const num = (k, lo, hi, d) => { const v = Number(p.get(k)); return v >= lo && v <= hi ? v : d; };
  state.f = num('f', 0.25, 2, state.f); state.v = num('v', 5, 20, state.v); state.A = num('a', 0.5, 3, state.A);
  $('freq').value = state.f; $('vel').value = state.v; $('amp').value = state.A;
  setMode(['both', 'transverse', 'longitudinal'].includes(p.get('m')) ? p.get('m') : 'both');
}

PK.dragOn(canvas, W, H, {
  hit: (p) => { if (state.mode === 'longitudinal') return null; const cy = state.mode === 'both' ? 130 : 260; return Math.abs(p.y - cy) < 90 && p.x > X0 && p.x < X1 ? { cy } : null; },
  move: (d, p) => {
    state.A = Math.max(0.5, Math.min(3, Math.round((Math.abs(p.y - d.cy) / PX) * 10) / 10));
    $('amp').value = state.A; renderWorking(); saveHash();
  },
});

window.addEventListener('resize', sizeCanvas);
sizeCanvas();
loadHash();
renderWorking();
requestAnimationFrame(frame);
