// Transverse and longitudinal waves: y = A sin(2π(f t − x/λ)). The same travelling wave is
// shown as beads moving up and down (transverse) and coils moving back and forth (longitudinal),
// or, with Particles ticked, as a block of particles and the air in a tube pushed by a piston.

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
const W = 800, H0 = 500;                   // H0: the height the drag helper is set up with
let H = H0;                                // the particle view of both waves needs more room
const X0 = 40, X1 = 760, PX = 20;          // 20 px per cm, 36 cm across
const MARK_X = 8;                          // the red particle's rest position (cm)

// Particle view: where each block of particles goes. cy is its middle, hb half its height and
// ty the top of its heading (all px).
const PART = {
  both: { H: 600, t: { ty: 8, cy: 186, hb: 45 }, l: { ty: 318, cy: 418, hb: 50 } },
  transverse: { H: 500, t: { ty: 8, cy: 245, hb: 85 } },
  longitudinal: { H: 500, l: { ty: 60, cy: 240, hb: 110 } },
};
const DOT = 3.5, GAP = 9;                  // particle radius and the smallest gap between centres (px)
const P0 = 3;                              // the piston's rest position in the tube (cm)
const RED = '#e53935';

const state = { mode: 'both', f: 0.5, v: 10, A: 2, running: true, speed: 1, labels: true, graph: false, particles: false, t: 0 };
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

// halo: outline the arrow and its label in the background colour, so they read over particles.
function doubleArrow(x1, y1, x2, y2, colour, label, c, labelSide = -1, halo = false) {
  if (halo) {
    ctx.strokeStyle = c.surface; ctx.lineWidth = 7; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    for (const [x, y, a] of [[x2, y2, ang], [x1, y1, ang + Math.PI]]) {
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x - 9 * Math.cos(a - 0.4), y - 9 * Math.sin(a - 0.4));
      ctx.lineTo(x - 9 * Math.cos(a + 0.4), y - 9 * Math.sin(a + 0.4));
      ctx.closePath(); ctx.lineWidth = 5; ctx.stroke();
    }
    if (label) {
      ctx.font = `700 14px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 5;
      ctx.strokeText(label, x1 + 8, (y1 + y2) / 2);   // only used for upright arrows
    }
  }
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
function lambdaArrow(xs, y, c, side, min = 0) {
  const lam = lambda(), max = (X1 - X0) / PX;
  for (const x of xs) {
    if (x + lam <= max) return doubleArrow(sx(x), y, sx(x + lam), y, c.f2, 'wavelength λ', c, side);
    if (x - lam >= min) return doubleArrow(sx(x - lam), y, sx(x), y, c.f2, 'wavelength λ', c, side);
  }
}

// ---------- Particle view ----------
// Particles are spread out at random but evenly (no two closer than GAP), from a fixed seed so
// the picture is the same every time. Each one keeps its rest position and is moved by disp().
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function spreadOut(w, h, seed) {
  const rand = seeded(seed), cell = GAP / Math.SQRT2;
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
  const grid = new Int32Array(cols * rows).fill(-1), pts = [], active = [];
  const add = (x, y) => { grid[Math.floor(y / cell) * cols + Math.floor(x / cell)] = pts.length; active.push(pts.length); pts.push({ x, y }); };
  const free = (x, y) => {
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    for (let j = Math.max(0, gy - 2); j <= Math.min(rows - 1, gy + 2); j++) {
      for (let i = Math.max(0, gx - 2); i <= Math.min(cols - 1, gx + 2); i++) {
        const n = grid[j * cols + i];
        if (n >= 0 && (pts[n].x - x) ** 2 + (pts[n].y - y) ** 2 < GAP * GAP) return false;
      }
    }
    return true;
  };
  add(rand() * w, rand() * h);
  while (active.length) {
    const k = Math.floor(rand() * active.length), p = pts[active[k]];
    let placed = false;
    for (let tries = 0; tries < 30 && !placed; tries++) {
      const a = rand() * 2 * Math.PI, r = GAP * (1 + rand());
      const x = p.x + r * Math.cos(a), y = p.y + r * Math.sin(a);
      if (x >= 0 && x < w && y >= 0 && y < h && free(x, y)) { add(x, y); placed = true; }
    }
    if (!placed) active.splice(k, 1);
  }
  return pts;
}

// The particles for one block: x is the rest position (cm), y the height from the middle (px).
// Three are picked out in red; the first sits by the arrow showing how it moves.
const blocks = {};
function block(kind, hb) {
  const key = kind + hb;
  if (blocks[key]) return blocks[key];
  // The air in the tube starts just right of the piston and carries on past the edge of the picture.
  const left = kind === 't' ? 0 : P0 * PX + DOT + 4, right = kind === 't' ? X1 - X0 : W - X0 + 3.5 * PX;
  const pts = spreadOut(right - left, 2 * (hb - DOT), kind === 't' ? 3 : 5)
    .map((p) => ({ x: (left + p.x) / PX, y: p.y - (hb - DOT) }));
  const aims = kind === 't' ? [[MARK_X, -0.45], [20, 0.1], [31, 0.5]] : [[MARK_X, 0.5], [19, 0], [30, -0.5]];
  const red = aims.map(([ax, ay]) => {
    let best = 0, bestD = Infinity;
    pts.forEach((p, i) => { const d = ((p.x - ax) * PX) ** 2 + (p.y - ay * hb) ** 2; if (d < bestD) { bestD = d; best = i; } });
    return best;
  });
  return (blocks[key] = { pts, red });
}

// Draws every particle, then the red ones on top. at(p) gives a particle's [x, y] now.
function drawDots(pts, red, at, c) {
  ctx.fillStyle = c.text;
  ctx.beginPath();
  for (const p of pts) { const [x, y] = at(p); ctx.moveTo(x + DOT, y); ctx.arc(x, y, DOT, 0, 2 * Math.PI); }
  ctx.fill();
  ctx.fillStyle = RED; ctx.strokeStyle = c.surface; ctx.lineWidth = 1.5;
  for (const i of red) { const [x, y] = at(pts[i]); ctx.beginPath(); ctx.arc(x, y, DOT + 1.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
}

function heading(text, y, c) {
  ctx.fillStyle = c.muted; ctx.font = `700 15px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(text, X0, y);
}

function drawTransverseParticles(L, c) {
  const { cy, hb } = L, A = state.A * PX, top = cy - hb, { pts, red } = block('t', hb);
  heading('Transverse wave (drag up or down to change the amplitude)', L.ty, c);
  if (state.labels) {
    // Where the top of the block sits when there's no wave
    ctx.strokeStyle = c.muted; ctx.setLineDash([6, 6]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X0, top); ctx.lineTo(X1, top); ctx.stroke(); ctx.setLineDash([]);
  }
  drawDots(pts, red, (p) => [sx(p.x), cy + p.y - disp(p.x, A)], c);

  if (!state.labels) return;
  const m = pts[red[0]], my = cy + m.y;
  doubleArrow(sx(m.x) - 16, my - A - 8, sx(m.x) - 16, my + A + 8, RED, '', c, -1, true);
  const crests = featureXs(Math.PI / 2), troughs = featureXs(-Math.PI / 2);
  ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'center';
  if (crests[0] != null) { ctx.textBaseline = 'bottom'; ctx.fillText('crest', sx(crests[0]), top - A - 8); }
  const tr = troughs.find((x) => x > (crests[0] ?? -1)) ?? troughs[0];
  if (tr != null) { ctx.textBaseline = 'top'; ctx.fillText('trough', sx(tr), cy + hb + A + 8); }
  lambdaArrow([...crests, ...troughs], top - A - 34, c, -1);
  // Amplitude beside a crest where its label fits on the picture
  const ac = [crests[1], crests[0], crests[2]].find((x) => x != null && sx(x) + 110 <= W);
  if (ac != null) doubleArrow(sx(ac) + 16, top, sx(ac) + 16, top - A, c.f3, 'amplitude', c, -1, true);
}

// Labels compressions and rarefactions along a line: each word in full once, then C or R.
// When the wavelength is too short for the words, it's letters only, with a key after the
// heading (which starts at headY).
function featureLabels(comps, rares, y, headY, c) {
  ctx.font = `700 13px ${c.font}`;
  const roomy = (lambda() / 2) * PX >= (ctx.measureText('compression').width + ctx.measureText('rarefaction').width) / 2 + 12;
  if (!roomy) {
    ctx.font = `700 15px ${c.font}`;
    const after = X0 + ctx.measureText('Longitudinal wave').width + 14;
    ctx.fillStyle = c.muted; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('(C = compression, R = rarefaction)', after, headY + 1);
  }
  ctx.fillStyle = c.text; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  const marks = [...comps.map((x) => [x, 'compression', 'C']), ...rares.map((x) => [x, 'rarefaction', 'R'])].sort((a, b) => a[0] - b[0]);
  const spelt = new Set();
  let lastRight = -Infinity;
  for (const [x, word, letter] of marks) {
    const text = roomy && !spelt.has(word) ? word : letter, half = ctx.measureText(text).width / 2 + 4;
    if (sx(x) - half < lastRight) continue;   // would overlap the label before
    ctx.fillText(text, sx(x), y);
    lastRight = sx(x) + half;
    spelt.add(word);
  }
}

function drawLongitudinalParticles(L, c) {
  const lam = lambda(), A = Math.min(state.A, (0.8 * lam) / (2 * Math.PI)) * PX;   // as for the slinky
  const { cy, hb } = L, WALL = 8, bottom = cy + hb + WALL, { pts, red } = block('l', hb);
  heading('Longitudinal wave', L.ty, c);
  // The tube, and the piston pushing and pulling the air at its left-hand end
  ctx.fillStyle = c.text;
  ctx.fillRect(0, cy - hb - WALL, W, WALL); ctx.fillRect(0, cy + hb, W, WALL);
  const face = sx(P0) + disp(P0, A);
  ctx.fillStyle = c.muted;
  ctx.fillRect(face - 10, cy - hb, 10, 2 * hb);
  ctx.fillRect(0, cy - 3, face - 10, 6);
  drawDots(pts, red, (p) => [sx(p.x) + disp(p.x, A), cy + p.y], c);

  if (state.graph) {
    // Displacement–distance graph of the same wave (displacement drawn upwards).
    ctx.beginPath();
    for (let x = P0; x <= (X1 - X0) / PX + 1e-9; x += 0.1) {
      const y = cy - disp(x, A);
      x === P0 ? ctx.moveTo(sx(x), y) : ctx.lineTo(sx(x), y);
    }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = c.surface; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = c.f2; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = c.f2; ctx.font = `700 12px ${c.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('displacement graph', X1, bottom + 6);   // below the tube, clear of the C and R labels
  }

  if (!state.labels) return;
  ctx.fillStyle = c.muted; ctx.font = `700 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('piston', sx(P0) - 5, bottom + 6);
  // The first red particle: where it rests, and how far it moves either way
  const mx = sx(pts[red[0]].x);
  ctx.fillStyle = RED;
  ctx.beginPath(); ctx.moveTo(mx, bottom + 4); ctx.lineTo(mx - 6, bottom + 14); ctx.lineTo(mx + 6, bottom + 14); ctx.closePath(); ctx.fill();
  doubleArrow(mx - A - 4, bottom + 28, mx + A + 4, bottom + 28, RED, '', c);
  const comps = featureXs(0).filter((x) => x > P0 + 1), rares = featureXs(Math.PI).filter((x) => x > P0 + 1);
  featureLabels(comps, rares, cy - hb - WALL - 6, L.ty, c);
  lambdaArrow([...comps, ...rares], bottom + 50, c, 1, P0);
}

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = colours();
  ctx.fillStyle = c.surface;
  ctx.fillRect(0, 0, W, H);

  if (state.particles) {
    const L = PART[state.mode];
    if (L.t) drawTransverseParticles(L.t, c);
    if (L.l) drawLongitudinalParticles(L.l, c);
  } else if (state.mode === 'both') { drawTransverse(130, c); drawLongitudinal(355, c); }
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

// The particle view of both waves is taller, so the canvas changes shape to fit.
function fitCanvas() {
  const h = state.particles ? PART[state.mode].H : H0;
  if (h === H) return;
  H = h;
  canvas.style.aspectRatio = `${W} / ${H}`;
  sizeCanvas();
}

const intro = document.querySelector('.tool-intro p');
const INTRO = {
  false: intro.textContent,
  true: "Watch the red particles: each one only moves back and forth around one place. The wave moves along, carrying energy, but the particles don't travel with it.",
};

function setParticles(on) {
  state.particles = on;
  $('particles').checked = on;
  if (intro.textContent !== INTRO[on]) intro.textContent = INTRO[on];
  fitCanvas();
}

function setMode(m) {
  state.mode = m;
  document.querySelectorAll('#modes .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  $('graph').closest('label').hidden = m === 'transverse';
  fitCanvas();
  saveHash();
}

$('modes').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });
$('pause').addEventListener('click', () => { state.running = !state.running; $('pause').textContent = state.running ? '❚❚ Pause' : '▶ Play'; });
PK.chips('speed', (v) => { state.speed = v; });
$('labels').addEventListener('change', (e) => { state.labels = e.target.checked; });
$('graph').addEventListener('change', (e) => { state.graph = e.target.checked; });
$('particles').addEventListener('change', (e) => { setParticles(e.target.checked); saveHash(); });
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
  const s = { m: state.mode, f: state.f, v: state.v, a: state.A };
  if (state.particles) s.p = 1;
  history.replaceState(null, '', '#' + new URLSearchParams(s).toString());
}
function loadHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const num = (k, lo, hi, d) => { const v = Number(p.get(k)); return v >= lo && v <= hi ? v : d; };
  state.f = num('f', 0.25, 2, state.f); state.v = num('v', 5, 20, state.v); state.A = num('a', 0.5, 3, state.A);
  $('freq').value = state.f; $('vel').value = state.v; $('amp').value = state.A;
  setParticles(p.get('p') === '1');
  setMode(['both', 'transverse', 'longitudinal'].includes(p.get('m')) ? p.get('m') : 'both');
}

// The drag helper measures in a 500 px high picture; the particle view can be taller.
PK.dragOn(canvas, W, H0, {
  hit: (p) => {
    if (state.mode === 'longitudinal') return null;
    const y = (p.y * H) / H0;
    if (p.x <= X0 || p.x >= X1) return null;
    if (!state.particles) { const cy = state.mode === 'both' ? 130 : 260; return Math.abs(y - cy) < 90 ? { cy } : null; }
    // Particle view: drag away from the middle of the block to make the waves bigger
    const { cy, hb } = PART[state.mode].t, dy = Math.abs(y - cy);
    return dy < hb + state.A * PX + 30 ? { cy, dy, A: state.A } : null;
  },
  move: (d, p) => {
    const dy = Math.abs((p.y * H) / H0 - d.cy);
    const A = d.A == null ? dy / PX : d.A + (dy - d.dy) / PX;
    state.A = Math.max(0.5, Math.min(3, Math.round(A * 10) / 10));
    $('amp').value = state.A; renderWorking(); saveHash();
  },
});

window.addEventListener('resize', sizeCanvas);
sizeCanvas();
loadHash();
renderWorking();
requestAnimationFrame(frame);
