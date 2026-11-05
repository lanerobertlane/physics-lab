// Resultant forces: forces at cardinal (and optional 45°) angles on a box.
// Maths uses x = east, y = north. SVG y points down, so we flip y when drawing.

PK.header({
  title: 'Resultant forces',
  answers: true,
  spec: [
    { code: '4.5.1.1', text: 'Scalar and vector quantities — forces drawn as arrows' },
    { code: '4.5.1.4', text: 'Resultant forces: calculating the resultant of forces in a line' },
    { code: '4.5.1.4', text: 'Scale vector diagrams to find the resultant of forces at angles', ht: true },
    { code: '4.5.6.2.1', text: "Newton's first law: balanced forces mean constant velocity (or at rest)" },
    { code: '4.5.6.2.2', text: "Newton's second law: F = m a" },
    { code: 'KS3', text: 'Forces as arrows, adding forces in one dimension, balanced and unbalanced forces' },
  ],
});

const R2 = Math.SQRT1_2;
const DIRS = [
  { id: 'N', name: 'North', arrow: '↑', ux: 0, uy: 1, col: '--f1' },
  { id: 'NE', name: 'North-east', arrow: '↗', ux: R2, uy: R2, col: '--f5', diag: true },
  { id: 'E', name: 'East', arrow: '→', ux: 1, uy: 0, col: '--f2' },
  { id: 'SE', name: 'South-east', arrow: '↘', ux: R2, uy: -R2, col: '--f6', diag: true },
  { id: 'S', name: 'South', arrow: '↓', ux: 0, uy: -1, col: '--f3' },
  { id: 'SW', name: 'South-west', arrow: '↙', ux: -R2, uy: -R2, col: '--f7', diag: true },
  { id: 'W', name: 'West', arrow: '←', ux: -1, uy: 0, col: '--f4' },
  { id: 'NW', name: 'North-west', arrow: '↖', ux: -R2, uy: R2, col: '--f8', diag: true },
];
const DIR = Object.fromEntries(DIRS.map((d) => [d.id, d]));

const MAX_F = 20;
const W = 640, H = 480, CX = W / 2, CY = H / 2;
const HALF = 32;          // half the box size, px
const PX_PER_N = 8.5;     // arrow length scale
const PX_PER_M = 30;      // motion scale
const START_SPEED = 2;    // m/s for "already moving"

const PRESETS = [
  { id: 'custom', name: 'Choose an example…' },
  { id: 'tug-bal', name: 'Tug of war — balanced', m: 5, f: { E: 10, W: 10 }, l: { E: 'Team B', W: 'Team A' } },
  { id: 'tug-unbal', name: 'Tug of war — unbalanced', m: 5, f: { E: 12, W: 9 }, l: { E: 'Team B', W: 'Team A' } },
  { id: 'car-steady', name: 'Car at a steady speed', m: 4, start: 'E', shape: 'car',
    f: { E: 8, W: 8, N: 15, S: 15 }, l: { E: 'Driving force', W: 'Drag + friction', N: 'Normal contact', S: 'Weight' } },
  { id: 'car-accel', name: 'Car speeding up', m: 4, start: 'E', shape: 'car',
    f: { E: 12, W: 8, N: 15, S: 15 }, l: { E: 'Driving force', W: 'Drag + friction', N: 'Normal contact', S: 'Weight' } },
  { id: 'sky-jump', name: 'Skydiver just after jumping', m: 2, shape: 'person',
    f: { S: 15, N: 3 }, l: { S: 'Weight', N: 'Air resistance' } },
  { id: 'sky-terminal', name: 'Skydiver at terminal velocity', m: 2, start: 'S', shape: 'person',
    f: { S: 15, N: 15 }, l: { S: 'Weight', N: 'Air resistance' } },
  { id: 'rocket', name: 'Rocket launch', m: 2, shape: 'rocket',
    f: { N: 18, S: 10 }, l: { N: 'Thrust', S: 'Weight' } },
  { id: '345', name: 'Two forces at right angles (scale drawing)', m: 2, f: { E: 6, N: 8 } },
  { id: 'diag', name: 'A force at 45° (Higher)', m: 2, diag: true, f: { NE: 10, W: 4 } },
];

// Each shape fits inside a 64 × 64 square centred on (0, 0), so the arrows start at its edges.
const SHAPES = {
  box: { name: 'Box', svg: (c, w) => `<rect x="-32" y="-32" width="64" height="64" rx="4" fill="${c('--surface-2')}" stroke="${c('--art')}" stroke-width="${w}"/>` },
  ball: { name: 'Ball', svg: (c, w) => `<circle r="31" fill="${c('--surface-2')}" stroke="${c('--art')}" stroke-width="${w}"/>
      <path d="M-31 0 Q0 -14 31 0 M-31 0 Q0 14 31 0" fill="none" stroke="${c('--art')}" stroke-width="${w * 0.6}"/>` },
  car: { name: 'Car', svg: (c, w) => `<path d="M-34 14 L-34 0 L-24 -4 L-14 -18 L12 -18 L22 -4 L34 0 L34 14 Z" fill="${c('--surface-2')}" stroke="${c('--art')}" stroke-width="${w}" stroke-linejoin="round"/>
      <path d="M-10 -14 L-1 -14 L-1 -4 L-17 -4 Z M3 -14 L10 -14 L17 -4 L3 -4 Z" fill="${c('--grid')}" stroke="${c('--art')}" stroke-width="${w * 0.6}"/>
      <circle cx="-19" cy="16" r="8" fill="${c('--art')}"/><circle cx="19" cy="16" r="8" fill="${c('--art')}"/>` },
  person: { name: 'Person', svg: (c, w) => `<g stroke="${c('--art')}" stroke-width="${w * 1.6}" stroke-linecap="round" fill="none">
      <path d="M0 -8 L0 12 M0 12 L-9 31 M0 12 L9 31 M0 -4 L-14 8 M0 -4 L14 8"/></g>
      <circle cy="-21" r="10" fill="${c('--surface-2')}" stroke="${c('--art')}" stroke-width="${w}"/>` },
  rocket: { name: 'Rocket', svg: (c, w) => `<path d="M-13 22 L-22 31 L-13 28 Z M13 22 L22 31 L13 28 Z" fill="${c('--art')}"/>
      <path d="M0 -34 C12 -22 13 -8 13 4 L13 28 L-13 28 L-13 4 C-13 -8 -12 -22 0 -34 Z" fill="${c('--surface-2')}" stroke="${c('--art')}" stroke-width="${w}" stroke-linejoin="round"/>
      <circle cy="-8" r="5" fill="${c('--grid')}" stroke="${c('--art')}" stroke-width="${w * 0.6}"/>` },
};

const state = {
  f: Object.fromEntries(DIRS.map((d) => [d.id, 0])),
  l: {},
  m: 2,
  shape: 'box',
  diag: false,
  revealed: false,
  showVector: true,
  start: 'rest',
  preset: 'custom',
};

const sim = { running: false, t: 0, x: 0, y: 0, vx: 0, vy: 0, trail: [], last: 0, stopped: false };

const $ = (id) => document.getElementById(id);
const arena = $('arena');
const vectorSvg = $('vector');

// ---------- Physics ----------

function activeDirs() { return DIRS.filter((d) => !d.diag || state.diag); }

function resultant() {
  let x = 0, y = 0;
  for (const d of activeDirs()) { x += state.f[d.id] * d.ux; y += state.f[d.id] * d.uy; }
  // Tidy floating-point noise from the 45° components.
  x = Math.abs(x) < 1e-9 ? 0 : x;
  y = Math.abs(y) < 1e-9 ? 0 : y;
  return { x, y, mag: Math.hypot(x, y) };
}

function bearingOf(x, y) { return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360; }

function directionText(x, y) {
  const b = bearingOf(x, y);
  const named = DIRS.find((d) => Math.abs(bearingOf(d.ux, d.uy) - b) < 0.05 || Math.abs(bearingOf(d.ux, d.uy) - b) > 359.95);
  if (named) return named.name.toLowerCase();
  // Describe as "θ° east of north" style relative to the nearest of N or S.
  const fromN = b <= 180 ? b : 360 - b;
  const side = b <= 180 ? 'east' : 'west';
  const desc = fromN <= 90 ? `${round1(fromN)}° ${side} of north` : `${round1(180 - fromN)}° ${side} of south`;
  return `${desc} (bearing ${String(Math.round(b)).padStart(3, '0')}°)`;
}

const round1 = (v) => Math.round(v * 10) / 10;
const fmt = (v) => String(round1(v));

// ---------- Drawing helpers ----------

function arrowSvg(x1, y1, x2, y2, colour, width = 5, extra = '') {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.5) return '';
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const head = Math.min(16, len), hw = 9 + width * 0.4;
  const bx = x2 - ux * head, by = y2 - uy * head;
  const px = -uy * hw / 2, py = ux * hw / 2;
  const pts = `${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`;
  // Optional halo: a background-coloured outline so the arrow stands out on top of others.
  const halo = extra === 'halo'
    ? `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${PK.cssVar('--surface')}" stroke-width="${width + 6}" />
       <polygon points="${pts}" fill="${PK.cssVar('--surface')}" stroke="${PK.cssVar('--surface')}" stroke-width="6" stroke-linejoin="round" />`
    : '';
  return `<g ${halo ? 'pointer-events="none"' : ''}>${halo}
    <line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${colour}" stroke-width="${width}" stroke-linecap="butt" />
    <polygon points="${pts}" fill="${colour}" />
  </g>`;
}

// The resultant is drawn the same way in both diagrams: thick purple arrow with a halo, on top.
const FORCE_W = 5, RESULTANT_W = 8;
function resultantArrow(x1, y1, x2, y2, stroke) {
  return arrowSvg(x1, y1, x2, y2, PK.cssVar('--resultant'), RESULTANT_W * stroke, 'halo');
}

// Where a line from the centre in direction (ux, uy) leaves the shape's 64 × 64 square.
function edgeOffset(ux, uy) {
  return HALF / Math.max(Math.abs(ux), Math.abs(uy));
}

function arrowStart(d) {
  const off = d.diag ? HALF * Math.SQRT2 : HALF;
  return { x: d.ux * off, y: -d.uy * off };
}

function labelAnchor(d) {
  if (d.ux > 0.1) return 'start';
  if (d.ux < -0.1) return 'end';
  return 'middle';
}

// ---------- Arena ----------

function drawArena() {
  const c = (n) => PK.cssVar(n);
  const stroke = parseFloat(PK.cssVar('--stroke')) || 1;
  const hidden = !PK.answersShown() && !state.revealed;
  const ox = CX + sim.x * PX_PER_M, oy = CY - sim.y * PX_PER_M;

  let s = `<rect width="${W}" height="${H}" fill="${c('--surface')}"/>`;
  // Background grid moves with nothing — it's the "ground" so motion is visible.
  for (let gx = 0; gx <= W; gx += 40) s += `<line x1="${gx}" y1="0" x2="${gx}" y2="${H}" stroke="${c('--grid')}" />`;
  for (let gy = 0; gy <= H; gy += 40) s += `<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="${c('--grid')}" />`;

  // Compass rose
  s += `<g font-size="13" font-weight="700" fill="${c('--muted')}" text-anchor="middle">
    <text x="${W - 34}" y="24">N</text>
    <line x1="${W - 34}" y1="30" x2="${W - 34}" y2="56" stroke="${c('--muted')}" stroke-width="2"/>
    <polygon points="${W - 34},28 ${W - 39},38 ${W - 29},38" fill="${c('--muted')}"/>
  </g>`;

  if (sim.trail.length > 1) {
    const pts = sim.trail.map((p) => `${CX + p.x * PX_PER_M},${CY - p.y * PX_PER_M}`).join(' ');
    s += `<polyline points="${pts}" fill="none" stroke="${c('--resultant')}" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round" opacity=".8"/>`;
  }

  // Mass readout in the corner (the shapes are too small to label inside).
  s += `<text x="16" y="28" font-size="16" font-weight="700" fill="${c('--muted')}">${SHAPES[state.shape].name} · mass ${fmt(state.m)} kg</text>`;

  s += `<g transform="translate(${ox} ${oy})">`;
  s += SHAPES[state.shape].svg(c, 2.5 * stroke);

  for (const d of activeDirs()) {
    const mag = state.f[d.id];
    const st = arrowStart(d);
    const len = mag * PX_PER_N;
    const tx = st.x + d.ux * len, ty = st.y - d.uy * len;
    const col = c(d.col);
    if (mag > 0) {
      s += arrowSvg(st.x, st.y, tx, ty, col, FORCE_W * stroke);
      const lx = tx + d.ux * 16, ly = ty - d.uy * 16 + (d.uy < -0.1 ? 14 : d.uy > 0.1 ? -4 : 5);
      const anchor = labelAnchor(d);
      s += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-size="16" font-weight="800" fill="${col}">${fmt(mag)} N</text>`;
      if (state.l[d.id]) {
        const ly2 = d.uy > 0.1 ? ly - 18 : ly + 17;
        s += `<text x="${lx}" y="${ly2}" text-anchor="${anchor}" font-size="13" font-weight="600" fill="${c('--muted')}">${escapeHtml(state.l[d.id])}</text>`;
      }
    }
    // Drag handle: at the arrow tip, or a dashed "+" ring when the force is zero.
    const hx = mag > 0 ? tx : st.x + d.ux * 14, hy = mag > 0 ? ty : st.y - d.uy * 14;
    if (!sim.running) {
      s += `<g class="handle" data-dir="${d.id}">
        <circle cx="${hx}" cy="${hy}" r="22" fill="transparent"/>
        ${mag > 0
          ? `<circle cx="${hx}" cy="${hy}" r="7" fill="${c('--surface')}" stroke="${col}" stroke-width="3"/>`
          : `<circle cx="${hx}" cy="${hy}" r="9" fill="${c('--surface')}" stroke="${col}" stroke-width="2" stroke-dasharray="3 3"/>
             <text x="${hx}" y="${hy + 4.5}" text-anchor="middle" font-size="13" font-weight="800" fill="${col}">+</text>`}
      </g>`;
    }
  }

  // Resultant last, so it sits in front of the force arrows.
  const r = resultant();
  if (!hidden && r.mag > 1e-9) {
    const ux = r.x / r.mag, uy = -r.y / r.mag;
    const off = edgeOffset(ux, uy);
    const len = r.mag * PX_PER_N;
    // Perpendicular pointing up (or right, for vertical arrows) — used to nudge and label.
    let px = -uy, py = ux;
    if (py > 1e-9 || (Math.abs(py) < 1e-9 && px < 0)) { px = -px; py = -py; }
    // If the resultant lies along a force arrow, shift it sideways so both stay visible.
    const alongForce = activeDirs().some((d) => state.f[d.id] > 0 && Math.abs(d.ux * ux - d.uy * uy - 1) < 1e-6);
    const shift = alongForce ? 18 : 0;
    const sx = ux * off + px * shift, sy = uy * off + py * shift;
    const ex = sx + ux * len, ey = sy + uy * len;
    s += resultantArrow(sx, sy, ex, ey, stroke);
    // Label just beyond the arrow tip.
    const lx = ex + ux * 10, ly = ey + uy * 12 + (uy > 0.3 ? 12 : uy < -0.3 ? -2 : 5);
    const anchor = ux > 0.3 ? 'start' : ux < -0.3 ? 'end' : 'middle';
    s += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-size="15" font-weight="700" fill="${c('--resultant')}" stroke="${c('--surface')}" stroke-width="4" paint-order="stroke" pointer-events="none">Resultant ${fmt(r.mag)} N</text>`;
  }

  s += '</g>';

  if (sim.stopped) {
    s += `<rect x="${CX - 150}" y="16" width="300" height="34" rx="10" fill="${c('--text')}" opacity=".9"/>
      <text x="${CX}" y="38" text-anchor="middle" font-size="15" font-weight="700" fill="${c('--bg')}">Reached the edge — press Reset</text>`;
  }

  arena.innerHTML = s;
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

// ---------- Dragging ----------

let drag = null;

function svgPoint(evt) {
  const pt = arena.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(arena.getScreenCTM().inverse());
}

arena.addEventListener('pointerdown', (e) => {
  const h = e.target.closest('.handle');
  if (!h || sim.running) return;
  drag = DIR[h.dataset.dir];
  arena.setPointerCapture(e.pointerId);
  e.preventDefault();
});

arena.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = svgPoint(e);
  const ox = CX + sim.x * PX_PER_M, oy = CY - sim.y * PX_PER_M;
  const st = arrowStart(drag);
  // Project the pointer onto the arrow's line of action.
  const along = (p.x - ox - st.x) * drag.ux + -(p.y - oy - st.y) * drag.uy;
  const mag = Math.max(0, Math.min(MAX_F, Math.round(along / PX_PER_N)));
  if (mag !== state.f[drag.id]) setForce(drag.id, mag);
});

const endDrag = () => { drag = null; };
arena.addEventListener('pointerup', endDrag);
arena.addEventListener('pointercancel', endDrag);

// ---------- Side panel ----------

function buildForceRows() {
  $('force-rows').innerHTML = DIRS.map((d) => `
    <div class="force-row" data-row="${d.id}" ${d.diag && !state.diag ? 'hidden' : ''}>
      <span class="swatch" style="background: var(${d.col})"></span>
      <span class="dir-name">${d.arrow} ${d.name}<span class="dir-label" id="label-${d.id}"></span></span>
      <div class="stepper">
        <button data-step="-1" data-dir="${d.id}" aria-label="Decrease ${d.name} force">−</button>
        <output id="out-${d.id}"></output>
        <button data-step="1" data-dir="${d.id}" aria-label="Increase ${d.name} force">+</button>
      </div>
    </div>`).join('');
}

$('force-rows').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-step]');
  if (!b) return;
  const id = b.dataset.dir;
  setForce(id, Math.max(0, Math.min(MAX_F, state.f[id] + Number(b.dataset.step))));
});

document.querySelectorAll('[data-mass]').forEach((b) => b.addEventListener('click', () => {
  state.m = Math.max(1, Math.min(20, state.m + Number(b.dataset.mass)));
  changed();
}));

function setForce(id, mag) {
  state.f[id] = mag;
  state.preset = 'custom';
  changed();
}

function renderPanel() {
  for (const d of DIRS) {
    $('out-' + d.id).textContent = `${fmt(state.f[d.id])} N`;
    $('label-' + d.id).textContent = state.l[d.id] || '';
    document.querySelector(`[data-row="${d.id}"]`).hidden = Boolean(d.diag && !state.diag);
  }
  $('mass').textContent = `${fmt(state.m)} kg`;
  $('shape').value = state.shape;
  $('diag').checked = state.diag;
  $('show-vector').checked = state.showVector;
  $('vector-panel').hidden = !state.showVector;
  $('start').value = state.start;
  $('preset').value = state.preset;

  const r = resultant();
  const hidden = !PK.answersShown() && !state.revealed;
  const balanced = r.mag < 1e-9;

  if (hidden) {
    $('result').innerHTML = `
      <div class="reveal-box">
        <span class="badge neutral">Make a prediction</span>
        <button class="btn primary" id="reveal">Reveal</button>
      </div>
      <p class="note">Is it balanced? What is the size and direction of the resultant force? What will the object do?</p>`;
    $('reveal').addEventListener('click', () => { state.revealed = true; render(); });
    return;
  }

  const a = r.mag / state.m;
  $('result').innerHTML = `
    ${balanced ? '<span class="badge good">Balanced</span>' : '<span class="badge bad">Unbalanced</span>'}
    <div style="margin-top:10px">
      <div class="label note" style="margin:0">Resultant force</div>
      <div class="big-number" style="color: var(--answer, var(--resultant))">${fmt(r.mag)} N</div>
      <div style="font-weight:650">${balanced ? 'no resultant force' : directionText(r.x, r.y)}</div>
    </div>
    <div class="working">${workingHtml(r, a)}</div>
    <p class="note">${balanced
      ? 'The forces are balanced, so the object stays at rest or keeps moving at a constant velocity (Newton’s first law).'
      : 'The forces are unbalanced, so the object accelerates in the direction of the resultant force.'}</p>`;
}

function workingHtml(r, a) {
  const lines = [];
  const axis = (pos, neg, value, posName, negName) => {
    const parts = [];
    const terms = activeDirs().filter((d) => state.f[d.id] > 0 && (pos(d) || neg(d)));
    if (!terms.length) return null;
    for (const d of terms) {
      const comp = d.diag ? `${fmt(state.f[d.id])} × cos 45°` : fmt(state.f[d.id]);
      parts.push(`${parts.length ? (pos(d) ? '+ ' : '− ') : (pos(d) ? '' : '− ')}${comp}`);
    }
    const dir = value > 1e-9 ? posName : value < -1e-9 ? negName : '';
    if (terms.length === 1 && !terms[0].diag) return `<b>${fmt(Math.abs(value))} N ${dir}</b>`;
    return `${parts.join(' ')} = <b>${fmt(Math.abs(value))} N${dir ? ' ' + dir : ''}</b>`;
  };
  const h = axis((d) => d.ux > 0.1, (d) => d.ux < -0.1, r.x, 'east', 'west');
  const v = axis((d) => d.uy > 0.1, (d) => d.uy < -0.1, r.y, 'north', 'south');
  if (h) lines.push(`<p>East–west: ${h}</p>`);
  if (v) lines.push(`<p>North–south: ${v}</p>`);
  if (Math.abs(r.x) > 1e-9 && Math.abs(r.y) > 1e-9) {
    lines.push(`<p>Pythagoras: √(${fmt(Math.abs(r.x))}² + ${fmt(Math.abs(r.y))}²) = <b>${fmt(r.mag)} N</b></p>`);
  }
  lines.push(`<p>a = F ÷ m = ${fmt(r.mag)} ÷ ${fmt(state.m)} = <b>${PK.sig(a, 3)} m/s²</b></p>`);
  return lines.join('');
}

// ---------- Vector (tip-to-tail) diagram ----------

function drawVector() {
  if (!state.showVector) return;
  const c = (n) => PK.cssVar(n);
  const stroke = parseFloat(PK.cssVar('--stroke')) || 1;
  const VW = 640, VH = 300, PAD = 30;
  const hidden = !PK.answersShown() && !state.revealed;

  const forces = activeDirs().filter((d) => state.f[d.id] > 0);
  const pts = [{ x: 0, y: 0 }];
  for (const d of forces) {
    const p = pts[pts.length - 1];
    pts.push({ x: p.x + state.f[d.id] * d.ux, y: p.y + state.f[d.id] * d.uy });
  }
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 4), spanY = Math.max(maxY - minY, 4);
  const scale = Math.min((VW - PAD * 2) / spanX, (VH - PAD * 2) / spanY, 26);
  // Grid size in newtons, chosen so squares stay readable.
  const step = scale >= 10 ? 1 : scale >= 5 ? 2 : 5;
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
  const toX = (x) => VW / 2 + (x - midX) * scale;
  const toY = (y) => VH / 2 - (y - midY) * scale;

  let s = `<rect width="${VW}" height="${VH}" fill="${c('--surface')}"/>`;
  const gx0 = Math.floor((midX - VW / 2 / scale) / step) * step;
  const gy0 = Math.floor((midY - VH / 2 / scale) / step) * step;
  for (let gx = gx0; toX(gx) <= VW; gx += step) s += `<line x1="${toX(gx)}" y1="0" x2="${toX(gx)}" y2="${VH}" stroke="${c('--grid')}"/>`;
  for (let gy = gy0; toY(gy) >= 0; gy += step) s += `<line x1="0" y1="${toY(gy)}" x2="${VW}" y2="${toY(gy)}" stroke="${c('--grid')}"/>`;

  forces.forEach((d, i) => {
    const a = pts[i], b = pts[i + 1];
    s += arrowSvg(toX(a.x), toY(a.y), toX(b.x), toY(b.y), c(d.col), FORCE_W * stroke);
  });

  const end = pts[pts.length - 1];
  const closed = Math.hypot(end.x, end.y) < 1e-9;
  if (!hidden && forces.length && !closed) {
    s += resultantArrow(toX(0), toY(0), toX(end.x), toY(end.y), stroke);
  }
  const tag = (x, y, text) => `<text x="${x + 9}" y="${y - 9}" font-size="14" font-weight="700" fill="${c('--text')}" stroke="${c('--surface')}" stroke-width="4" paint-order="stroke">${text}</text>`;
  s += `<circle cx="${toX(0)}" cy="${toY(0)}" r="5" fill="${c('--text')}"/>`;
  if (forces.length && !closed) {
    s += `<circle cx="${toX(end.x)}" cy="${toY(end.y)}" r="5" fill="${c('--text')}"/>`;
    s += tag(toX(0), toY(0), 'start') + tag(toX(end.x), toY(end.y), 'end');
  } else {
    s += tag(toX(0), toY(0), forces.length ? 'start = end' : 'start');
  }
  s += `<text x="12" y="${VH - 12}" font-size="13" font-weight="700" fill="${c('--muted')}">1 square = ${step} N</text>`;

  vectorSvg.innerHTML = s;

  let note = 'Each force is drawn starting where the last one ended. The resultant (purple) goes from the start to the final tip.';
  if (!forces.length) note = 'Add some forces to build the scale drawing.';
  else if (closed) note = 'The arrows join back up to the start, so there is no resultant force — the forces are balanced.';
  else if (hidden) note = 'Draw the resultant yourself: from the start dot to the final arrow tip. Then reveal to check.';
  $('vector-note').textContent = note;
}

// ---------- Simulation ----------

function resetSim() {
  sim.running = false;
  sim.t = 0; sim.x = 0; sim.y = 0; sim.trail = []; sim.stopped = false;
  const d = DIR[state.start];
  sim.vx = d ? d.ux * START_SPEED : 0;
  sim.vy = d ? d.uy * START_SPEED : 0;
  $('play').textContent = '▶ Play';
}

function step(now) {
  if (!sim.running) return;
  const dt = Math.min(0.05, (now - sim.last) / 1000);
  sim.last = now;
  const r = resultant();
  sim.vx += (r.x / state.m) * dt;
  sim.vy += (r.y / state.m) * dt;
  sim.x += sim.vx * dt;
  sim.y += sim.vy * dt;
  sim.t += dt;
  if (!sim.trail.length || sim.t - sim.trail[sim.trail.length - 1].t > 0.08) sim.trail.push({ x: sim.x, y: sim.y, t: sim.t });

  const limX = (CX - HALF - 2) / PX_PER_M, limY = (CY - HALF - 2) / PX_PER_M;
  if (Math.abs(sim.x) > limX || Math.abs(sim.y) > limY) {
    sim.x = Math.max(-limX, Math.min(limX, sim.x));
    sim.y = Math.max(-limY, Math.min(limY, sim.y));
    sim.running = false;
    sim.stopped = true;
    $('play').textContent = '▶ Play';
    $('play').disabled = true;
  }
  drawArena();
  updateStats();
  if (sim.running) requestAnimationFrame(step);
}

function updateStats() {
  $('t').textContent = sim.t.toFixed(1);
  $('speed').textContent = Math.hypot(sim.vx, sim.vy).toFixed(1);
}

$('play').addEventListener('click', () => {
  if (sim.stopped) return;
  sim.running = !sim.running;
  $('play').textContent = sim.running ? '❚❚ Pause' : '▶ Play';
  if (sim.running) {
    sim.last = performance.now();
    requestAnimationFrame(step);
  }
  drawArena();
});

$('reset').addEventListener('click', () => {
  resetSim();
  $('play').disabled = false;
  render();
  updateStats();
});

// ---------- Options ----------

$('shape').innerHTML = Object.entries(SHAPES).map(([id, s]) => `<option value="${id}">${s.name}</option>`).join('');
$('shape').addEventListener('change', (e) => { state.shape = e.target.value; render(); saveHash(); });

$('preset').innerHTML =PRESETS.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
$('preset').addEventListener('change', (e) => applyPreset(e.target.value));

function applyPreset(id) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p || id === 'custom') return;
  for (const d of DIRS) state.f[d.id] = 0;
  Object.assign(state.f, p.f);
  state.l = { ...(p.l || {}) };
  state.m = p.m || 2;
  state.shape = p.shape || 'box';
  state.diag = Boolean(p.diag);
  state.start = p.start || 'rest';
  state.preset = id;
  resetSim();
  $('play').disabled = false;
  changed();
}

$('clear').addEventListener('click', () => {
  for (const d of DIRS) state.f[d.id] = 0;
  state.l = {};
  state.preset = 'custom';
  changed();
});

$('diag').addEventListener('change', (e) => {
  state.diag = e.target.checked;
  if (!state.diag) DIRS.filter((d) => d.diag).forEach((d) => { state.f[d.id] = 0; });
  changed();
});
window.addEventListener('pk-answers', () => { state.revealed = false; render(); });
$('show-vector').addEventListener('change', (e) => { state.showVector = e.target.checked; render(); });
$('start').addEventListener('change', (e) => {
  state.start = e.target.value;
  resetSim();
  $('play').disabled = false;
  render();
  updateStats();
  saveHash();
});
$('share').addEventListener('click', () => { saveHash(); PK.copyLink(); });

// ---------- Shareable link (state lives in the URL hash) ----------

function saveHash() {
  const p = new URLSearchParams();
  const f = DIRS.filter((d) => state.f[d.id] > 0).map((d) => `${d.id}:${state.f[d.id]}`).join(',');
  if (f) p.set('f', f);
  const l = Object.entries(state.l).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join('|');
  if (l) p.set('l', l);
  p.set('m', state.m);
  if (state.shape !== 'box') p.set('o', state.shape);
  if (state.diag) p.set('d', '1');
  if (state.start !== 'rest') p.set('s', state.start);
  history.replaceState(null, '', '#' + p.toString());
}

function loadHash() {
  if (!location.hash) return false;
  const p = new URLSearchParams(location.hash.slice(1));
  for (const pair of (p.get('f') || '').split(',').filter(Boolean)) {
    const [id, v] = pair.split(':');
    if (DIR[id]) state.f[id] = Math.max(0, Math.min(MAX_F, Number(v) || 0));
  }
  for (const pair of (p.get('l') || '').split('|').filter(Boolean)) {
    const i = pair.indexOf(':');
    const id = pair.slice(0, i);
    if (DIR[id]) state.l[id] = pair.slice(i + 1).slice(0, 30);
  }
  state.m = Math.max(1, Math.min(20, Number(p.get('m')) || 2));
  state.shape = SHAPES[p.get('o')] ? p.get('o') : 'box';
  state.diag = p.get('d') === '1';
  state.start = DIR[p.get('s')] ? p.get('s') : 'rest';
  return true;
}

// ---------- Render loop ----------

function changed() {
  state.revealed = false;
  render();
  saveHash();
}

function render() {
  renderPanel();
  drawArena();
  drawVector();
}

window.addEventListener('pk-theme', render);

buildForceRows();
if (!loadHash()) applyPreset('345');
resetSim();
render();
updateStats();
