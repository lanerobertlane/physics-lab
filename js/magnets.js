// Bar magnet fields. Each magnet is modelled as a north "pole charge" and a south "pole
// charge" near its ends; the field at any point is the sum of their r̂ / r² contributions.
// Iron bars become induced magnets, magnetised along the field from the real magnets.

PK.header({
  title: 'Bar magnet fields',
  spec: [
    { code: '4.7.1.1', text: 'Poles of a magnet: like poles repel, unlike poles attract; permanent and induced magnets (induced magnetism always causes attraction)' },
    { code: '4.7.1.2', text: 'Magnetic fields: strongest at the poles, direction from north to south, plotting the field with a compass' },
    { code: 'KS3', text: 'Magnetic poles, attraction and repulsion; magnetic fields shown by plotting with a compass; field lines' },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('field');
const ctx = canvas.getContext('2d');

const W = 800, H = 520;
const LEN = 170, WID = 46;
const POLE = LEN / 2 - 14;       // distance from centre to each pole charge
const IRON_K = 40000, IRON_MAX = 0.85;   // how easily iron is magnetised, and its maximum strength

const state = {
  objs: [],          // { kind: 'magnet' | 'iron', x, y, angle (degrees) }
  compasses: [],     // { x, y }
  marks: [],         // { x, y, a } left by a dragged compass
  selected: null,    // { type: 'obj' | 'compass', index }
  view: { lines: true, arrows: true, filings: false, grid: false, strength: false, force: true, marks: false },
};

// ---------- Physics ----------

const unit = (deg) => ({ x: Math.cos(deg * Math.PI / 180), y: Math.sin(deg * Math.PI / 180) });

function fieldFrom(charges, x, y) {
  let bx = 0, by = 0;
  for (const c of charges) {
    const dx = x - c.x, dy = y - c.y;
    const r2 = dx * dx + dy * dy + 25;
    const k = c.q / (r2 * Math.sqrt(r2));
    bx += k * dx; by += k * dy;
  }
  return { x: bx, y: by };
}

// Pole charges for every object. Iron bars take their strength from the permanent magnets' field.
function buildCharges() {
  const out = [];
  const perm = [];
  for (const o of state.objs) {
    if (o.kind !== 'magnet') continue;
    const u = unit(o.angle);
    perm.push({ x: o.x + u.x * POLE, y: o.y + u.y * POLE, q: 1, obj: o });
    perm.push({ x: o.x - u.x * POLE, y: o.y - u.y * POLE, q: -1, obj: o });
  }
  out.push(...perm);
  for (const o of state.objs) {
    if (o.kind !== 'iron') continue;
    const u = unit(o.angle);
    const b = fieldFrom(perm, o.x, o.y);
    const s = Math.max(-IRON_MAX, Math.min(IRON_MAX, (b.x * u.x + b.y * u.y) * IRON_K));
    o.induced = s;
    out.push({ x: o.x + u.x * POLE, y: o.y + u.y * POLE, q: s, obj: o });
    out.push({ x: o.x - u.x * POLE, y: o.y - u.y * POLE, q: -s, obj: o });
  }
  return out;
}

let charges = [];
let lines = [];
let strengthImg = null;

function traceLines() {
  lines = [];
  const sinks = charges.filter((c) => c.q < -0.05);
  for (const src of charges) {
    if (src.q <= 0.05) continue;
    const n = Math.max(4, Math.round(16 * src.q));
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * (k + 0.5)) / n;
      let p = { x: src.x + Math.cos(a) * 6, y: src.y + Math.sin(a) * 6 };
      const pts = [p];
      for (let step = 0; step < 900; step++) {
        const b1 = fieldFrom(charges, p.x, p.y);
        const m1 = Math.hypot(b1.x, b1.y);
        if (m1 < 1e-12) break;
        const mid = { x: p.x + (b1.x / m1) * 2, y: p.y + (b1.y / m1) * 2 };
        const b2 = fieldFrom(charges, mid.x, mid.y);
        const m2 = Math.hypot(b2.x, b2.y);
        if (m2 < 1e-12) break;
        p = { x: p.x + (b2.x / m2) * 4, y: p.y + (b2.y / m2) * 4 };
        pts.push(p);
        if (p.x < -80 || p.x > W + 80 || p.y < -80 || p.y > H + 80) break;
        if (sinks.some((s) => (p.x - s.x) ** 2 + (p.y - s.y) ** 2 < 49)) break;
      }
      lines.push(pts);
    }
  }
}

function computeStrength() {
  const S = 8, cols = Math.ceil(W / S), rows = Math.ceil(H / S);
  const off = document.createElement('canvas');
  off.width = cols; off.height = rows;
  const g = off.getContext('2d');
  const img = g.createImageData(cols, rows);
  const accent = PK.cssVar('--accent');
  const rgb = toRgb(accent);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const b = fieldFrom(charges, i * S + S / 2, j * S + S / 2);
    const m = Math.hypot(b.x, b.y);
    // Log scale so both strong and weak regions show.
    const t = Math.max(0, Math.min(1, (Math.log10(m) + 5.2) / 3.2));
    const idx = (j * cols + i) * 4;
    img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2];
    img.data[idx + 3] = Math.round(t * 170);
  }
  g.putImageData(img, 0, 0);
  strengthImg = off;
}

function toRgb(css) {
  const probe = document.createElement('canvas').getContext('2d');
  probe.fillStyle = css;
  const v = probe.fillStyle;
  if (v.startsWith('#')) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  const m = v.match(/\d+/g);
  return m ? m.slice(0, 3).map(Number) : [80, 80, 200];
}

// Force on object i from all other objects' pole charges.
function forceOn(o) {
  let fx = 0, fy = 0;
  const own = charges.filter((c) => c.obj === o);
  const others = charges.filter((c) => c.obj !== o);
  for (const a of own) for (const b of others) {
    const dx = a.x - b.x, dy = a.y - b.y;
    const r2 = dx * dx + dy * dy + 25;
    const k = (a.q * b.q) / (r2 * Math.sqrt(r2));
    fx += k * dx; fy += k * dy;
  }
  return { x: fx, y: fy };
}

function pairForce(o, p) {
  let fx = 0, fy = 0;
  const own = charges.filter((c) => c.obj === o);
  const theirs = charges.filter((c) => c.obj === p);
  for (const a of own) for (const b of theirs) {
    const dx = a.x - b.x, dy = a.y - b.y;
    const r2 = dx * dx + dy * dy + 25;
    const k = (a.q * b.q) / (r2 * Math.sqrt(r2));
    fx += k * dx; fy += k * dy;
  }
  return { x: fx, y: fy };
}

// ---------- Recompute & render scheduling ----------

let dirty = true;
let frameQueued = false;

function update() {
  charges = buildCharges();
  traceLines();
  if (state.view.strength) computeStrength();
  dirty = false;
}

function requestDraw(recompute = true) {
  if (recompute) dirty = true;
  if (frameQueued) return;
  frameQueued = true;
  requestAnimationFrame(() => {
    frameQueued = false;
    if (dirty) update();
    draw();
  });
}

// ---------- Drawing ----------

const RED = '#d93025', BLUE = '#1f5fd1', IRON = '#8d939c';

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
  requestDraw(false);
}

function arrowHead(x, y, ang, size, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(ang) * size, y + Math.sin(ang) * size);
  ctx.lineTo(x + Math.cos(ang + 2.5) * size, y + Math.sin(ang + 2.5) * size);
  ctx.lineTo(x + Math.cos(ang - 2.5) * size, y + Math.sin(ang - 2.5) * size);
  ctx.closePath();
  ctx.fill();
}

function insideObj(o, x, y, pad = 0) {
  const u = unit(o.angle);
  const dx = x - o.x, dy = y - o.y;
  const along = dx * u.x + dy * u.y, across = -dx * u.y + dy * u.x;
  return Math.abs(along) <= LEN / 2 + pad && Math.abs(across) <= WID / 2 + pad;
}

function drawNeedle(x, y, b, len, outline) {
  const a = Math.atan2(b.y, b.x);
  const c = Math.cos(a), s = Math.sin(a);
  const w = len * 0.22;
  ctx.fillStyle = RED;   // north-seeking end points along the field
  ctx.beginPath(); ctx.moveTo(x + c * len, y + s * len); ctx.lineTo(x - s * w, y + c * w); ctx.lineTo(x + s * w, y - c * w); ctx.closePath(); ctx.fill();
  ctx.fillStyle = outline;
  ctx.beginPath(); ctx.moveTo(x - c * len, y - s * len); ctx.lineTo(x - s * w, y + c * w); ctx.lineTo(x + s * w, y - c * w); ctx.closePath(); ctx.fill();
}

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const col = {
    surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'),
    accent: PK.cssVar('--accent'), line: PK.cssVar('--t-magnetism'), grid: PK.cssVar('--grid'),
    force: PK.cssVar('--f3'),
  };
  const stroke = parseFloat(PK.cssVar('--stroke')) || 1;
  const font = PK.cssVar('--font-body') || 'sans-serif';
  ctx.fillStyle = col.surface;
  ctx.fillRect(0, 0, W, H);

  if (state.view.strength && strengthImg) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(strengthImg, 0, 0, W, H);
  }

  if (state.view.filings) {
    ctx.strokeStyle = col.muted;
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = 0.75;
    for (const f of FILINGS) {
      if (state.objs.some((o) => insideObj(o, f.x, f.y, 2))) continue;
      const b = fieldFrom(charges, f.x, f.y);
      const m = Math.hypot(b.x, b.y);
      if (m < 1e-12) continue;
      const ux = (b.x / m) * 3.5, uy = (b.y / m) * 3.5;
      ctx.beginPath(); ctx.moveTo(f.x - ux, f.y - uy); ctx.lineTo(f.x + ux, f.y + uy); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (state.view.lines) {
    ctx.strokeStyle = col.line;
    ctx.lineWidth = 1.6 * stroke;
    ctx.lineJoin = 'round';
    for (const pts of lines) {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      if (!state.view.arrows) continue;
      let dist = 0, next = 70;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        dist += Math.hypot(b.x - a.x, b.y - a.y);
        if (dist >= next) {
          next += 110;
          if (state.objs.some((o) => insideObj(o, b.x, b.y, 4))) continue;
          if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) continue;
          arrowHead(b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), 6 * stroke, col.line);
        }
      }
    }
  }

  if (state.view.grid) {
    for (let y = 30; y < H; y += 50) for (let x = 30; x < W; x += 50) {
      if (state.objs.some((o) => insideObj(o, x, y, 10))) continue;
      const b = fieldFrom(charges, x, y);
      if (Math.hypot(b.x, b.y) < 1e-12) continue;
      drawNeedle(x, y, b, 11, col.muted);
    }
  }

  // Marks left by the plotting compass
  ctx.strokeStyle = col.text;
  ctx.lineWidth = 2;
  for (const m of state.marks) {
    const c = Math.cos(m.a) * 7, s = Math.sin(m.a) * 7;
    ctx.beginPath(); ctx.moveTo(m.x - c, m.y - s); ctx.lineTo(m.x + c, m.y + s); ctx.stroke();
    arrowHead(m.x + c, m.y + s, m.a, 5, col.text);
  }

  // Magnets and iron bars
  state.objs.forEach((o, i) => {
    const u = unit(o.angle);
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.angle * Math.PI / 180);
    if (o.kind === 'magnet') {
      ctx.fillStyle = RED; ctx.fillRect(0, -WID / 2, LEN / 2, WID);
      ctx.fillStyle = BLUE; ctx.fillRect(-LEN / 2, -WID / 2, LEN / 2, WID);
    } else {
      ctx.fillStyle = IRON; ctx.fillRect(-LEN / 2, -WID / 2, LEN, WID);
    }
    const sel = state.selected && state.selected.type === 'obj' && state.selected.index === i;
    ctx.strokeStyle = sel ? col.accent : col.text;
    ctx.lineWidth = sel ? 3.5 : 2;
    ctx.strokeRect(-LEN / 2, -WID / 2, LEN, WID);
    ctx.restore();

    // Letters drawn upright
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (o.kind === 'magnet') {
      ctx.font = `800 24px ${font}`;
      ctx.fillText('N', o.x + u.x * (LEN / 2 - 24), o.y + u.y * (LEN / 2 - 24) + 1);
      ctx.fillText('S', o.x - u.x * (LEN / 2 - 24), o.y - u.y * (LEN / 2 - 24) + 1);
    } else {
      ctx.font = `700 14px ${font}`;
      ctx.fillText('iron', o.x, o.y + 1);
      const s = o.induced || 0;
      if (Math.abs(s) > 0.12) {
        ctx.globalAlpha = Math.min(1, Math.abs(s) * 1.4);
        ctx.font = `800 20px ${font}`;
        const end = s > 0 ? 1 : -1;
        ctx.fillText('N', o.x + end * u.x * (LEN / 2 - 20), o.y + end * u.y * (LEN / 2 - 20) + 1);
        ctx.fillText('S', o.x - end * u.x * (LEN / 2 - 20), o.y - end * u.y * (LEN / 2 - 20) + 1);
        ctx.globalAlpha = 1;
      }
    }

    if (sel) {
      const h = handlePos(o);
      ctx.strokeStyle = col.accent;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(o.x + u.x * LEN / 2, o.y + u.y * LEN / 2); ctx.lineTo(h.x, h.y); ctx.stroke();
      ctx.fillStyle = col.accent;
      ctx.beginPath(); ctx.arc(h.x, h.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col.surface;
      ctx.font = `800 14px ${font}`;
      ctx.fillText('⟳', h.x, h.y + 1);
    }
  });

  // Force arrows on each object
  if (state.view.force && state.objs.length > 1) {
    for (const o of state.objs) {
      const f = forceOn(o);
      const m = Math.hypot(f.x, f.y);
      if (m < 2e-6) continue;
      // Log scale: arrows stay visible far apart and don't explode when close.
      let len = Math.max(30, Math.min(110, 30 + 28 * Math.log10(m / 2e-6)));
      const dx = f.x / m, dy = f.y / m;
      const u = unit(o.angle);
      const along = Math.abs(dx * u.x + dy * u.y), across = Math.abs(-dx * u.y + dy * u.x);
      const edge = Math.min(along > 1e-6 ? LEN / 2 / along : Infinity, across > 1e-6 ? WID / 2 / across : Infinity) + 4;
      const sx = o.x + dx * edge, sy = o.y + dy * edge;
      // Stop short of halfway to anything in the way, so two arrows in a gap don't cross.
      for (let t = 0; t < len * 2.5; t += 2) {
        if (state.objs.some((q) => q !== o && insideObj(q, sx + dx * t, sy + dy * t, 4))) { len = Math.max(14, t * 0.32); break; }
      }
      const ex = sx + dx * len, ey = sy + dy * len;
      ctx.lineCap = 'round';
      ctx.strokeStyle = col.surface;
      ctx.lineWidth = 11;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = col.force;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex - dx * 8, ey - dy * 8); ctx.stroke();
      arrowHead(ex + dx * 4, ey + dy * 4, Math.atan2(dy, dx), 15, col.force);
    }
  }

  // Compasses
  state.compasses.forEach((c, i) => {
    const sel = state.selected && state.selected.type === 'compass' && state.selected.index === i;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = sel ? col.accent : '#333';
    ctx.lineWidth = sel ? 3.5 : 2;
    ctx.beginPath(); ctx.arc(c.x, c.y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const b = fieldFrom(charges, c.x, c.y);
    drawNeedle(c.x, c.y, Math.hypot(b.x, b.y) < 1e-12 ? { x: 0, y: -1 } : b, 16, '#9aa0a6');
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2); ctx.fill();
  });
}

// Fixed pseudo-random positions for iron filings (same every time, so the pattern doesn't jump).
const FILINGS = (() => {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  return Array.from({ length: 2600 }, () => ({ x: rnd() * W, y: rnd() * H }));
})();

// ---------- Interaction ----------

const handlePos = (o) => {
  const u = unit(o.angle);
  return { x: o.x + u.x * (LEN / 2 + 26), y: o.y + u.y * (LEN / 2 + 26) };
};

function point(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}

let drag = null;   // { mode: 'move' | 'rotate' | 'compass', index, dx, dy, lastMark }

canvas.addEventListener('pointerdown', (e) => {
  const p = point(e);
  drag = null;
  const ci = state.compasses.findIndex((c) => Math.hypot(c.x - p.x, c.y - p.y) < 24);
  if (ci >= 0) {
    const c = state.compasses[ci];
    state.selected = { type: 'compass', index: ci };
    drag = { mode: 'compass', index: ci, dx: c.x - p.x, dy: c.y - p.y, lastMark: { x: c.x, y: c.y } };
  } else {
    const s = state.selected;
    if (s && s.type === 'obj') {
      const h = handlePos(state.objs[s.index]);
      if (Math.hypot(h.x - p.x, h.y - p.y) < 20) drag = { mode: 'rotate', index: s.index };
    }
    if (!drag) {
      const oi = [...state.objs.keys()].reverse().find((i) => insideObj(state.objs[i], p.x, p.y, 6));
      if (oi != null) {
        const o = state.objs[oi];
        state.selected = { type: 'obj', index: oi };
        drag = { mode: 'move', index: oi, dx: o.x - p.x, dy: o.y - p.y };
      } else {
        state.selected = null;
      }
    }
  }
  if (drag) { try { canvas.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ } }
  renderSelected();
  requestDraw(false);
  e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = point(e);
  const clampX = (v) => Math.max(10, Math.min(W - 10, v));
  const clampY = (v) => Math.max(10, Math.min(H - 10, v));
  if (drag.mode === 'compass') {
    const c = state.compasses[drag.index];
    c.x = clampX(p.x + drag.dx); c.y = clampY(p.y + drag.dy);
    if (state.view.marks && Math.hypot(c.x - drag.lastMark.x, c.y - drag.lastMark.y) > 28) {
      const b = fieldFrom(charges, c.x, c.y);
      state.marks.push({ x: c.x, y: c.y, a: Math.atan2(b.y, b.x) });
      drag.lastMark = { x: c.x, y: c.y };
      $('clear-marks').hidden = false;
    }
    requestDraw(false);
  } else if (drag.mode === 'move') {
    const o = state.objs[drag.index];
    o.x = clampX(p.x + drag.dx); o.y = clampY(p.y + drag.dy);
    requestDraw();
  } else if (drag.mode === 'rotate') {
    const o = state.objs[drag.index];
    const deg = Math.atan2(p.y - o.y, p.x - o.x) * 180 / Math.PI;
    const snapped = Math.round(deg / 15) * 15;
    if (snapped !== o.angle) { o.angle = (snapped + 360) % 360; requestDraw(); }
  }
});

const endDrag = () => {
  if (drag) { drag = null; renderForces(); saveHash(); }
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// ---------- Side panel ----------

function objName(i) {
  const o = state.objs[i];
  if (o.kind === 'iron') {
    const n = state.objs.slice(0, i + 1).filter((x) => x.kind === 'iron').length;
    const total = state.objs.filter((x) => x.kind === 'iron').length;
    return total > 1 ? `Iron bar ${n}` : 'Iron bar';
  }
  const n = state.objs.slice(0, i + 1).filter((x) => x.kind === 'magnet').length;
  const total = state.objs.filter((x) => x.kind === 'magnet').length;
  return total > 1 ? `Magnet ${n}` : 'Magnet';
}

function renderSelected() {
  const el = $('selected');
  const s = state.selected;
  if (!s) {
    el.innerHTML = '<p class="note" style="margin:0">Tap a magnet, iron bar or compass to select it.</p>';
    return;
  }
  if (s.type === 'compass') {
    el.innerHTML = `<p style="margin:0 0 8px"><b>Plotting compass</b></p>
      <p class="note" style="margin:0 0 10px">The red end of the needle is its north pole. It points along the field line, towards a south pole.</p>
      <div class="btn-row"><button class="btn" id="s-remove">🗑 Remove</button></div>`;
  } else {
    const o = state.objs[s.index];
    el.innerHTML = `<p style="margin:0 0 8px"><b>${objName(s.index)}</b></p>
      <div class="btn-row">
        <button class="btn" id="s-left">⟲ 15°</button>
        <button class="btn" id="s-right">⟳ 15°</button>
        <button class="btn" id="s-flip">Turn round</button>
        <button class="btn" id="s-remove">🗑 Remove</button>
      </div>
      <p class="note">${o.kind === 'iron'
        ? 'Iron is a magnetic material. Near a magnet it becomes an induced magnet, with the opposite pole facing the magnet, so it is always attracted. Move it away and it loses its magnetism.'
        : 'A permanent magnet produces its own magnetic field.'}</p>`;
    const turn = (d) => { o.angle = (o.angle + d + 360) % 360; changed(); };
    $('s-left').addEventListener('click', () => turn(-15));
    $('s-right').addEventListener('click', () => turn(15));
    $('s-flip').addEventListener('click', () => turn(180));
  }
  $('s-remove').addEventListener('click', () => {
    if (s.type === 'compass') state.compasses.splice(s.index, 1);
    else state.objs.splice(s.index, 1);
    state.selected = null;
    changed();
  });
}

function renderForces() {
  const panel = $('forces-panel');
  if (state.objs.length < 2) { panel.hidden = true; return; }
  panel.hidden = false;
  if (dirty) update();
  const rows = [];
  for (let i = 0; i < state.objs.length; i++) for (let j = i + 1; j < state.objs.length; j++) {
    const a = state.objs[i], b = state.objs[j];
    const f = pairForce(a, b);
    const m = Math.hypot(f.x, f.y);
    let badge;
    if (m < 2e-6) badge = '<span class="badge neutral">Hardly any force</span>';
    else if (f.x * (b.x - a.x) + f.y * (b.y - a.y) > 0) badge = '<span class="badge good">Attract</span>';
    else badge = '<span class="badge bad">Repel</span>';
    rows.push(`<div class="pair"><span>${objName(i)} &amp; ${objName(j)}</span>${badge}</div>`);
  }
  $('forces').innerHTML = rows.join('');
}

// ---------- Buttons and views ----------

function addObj(kind) {
  const n = state.objs.length;
  state.objs.push({ kind, x: 200 + (n % 3) * 200, y: 110 + Math.floor(n / 3) % 3 * 150, angle: 0 });
  state.selected = { type: 'obj', index: state.objs.length - 1 };
  changed();
}

$('add-magnet').addEventListener('click', () => addObj('magnet'));
$('add-iron').addEventListener('click', () => addObj('iron'));
$('add-compass').addEventListener('click', () => {
  state.compasses.push({ x: 60 + (state.compasses.length % 6) * 40, y: 60 });
  state.selected = { type: 'compass', index: state.compasses.length - 1 };
  changed();
});
$('clear-marks').addEventListener('click', () => { state.marks = []; $('clear-marks').hidden = true; requestDraw(false); });

const VIEWS = { lines: 'v-lines', arrows: 'v-arrows', filings: 'v-filings', grid: 'v-grid', strength: 'v-strength', force: 'v-force', marks: 'v-marks' };
for (const [key, id] of Object.entries(VIEWS)) {
  $(id).addEventListener('change', (e) => {
    state.view[key] = e.target.checked;
    requestDraw(key === 'strength');
  });
}
function syncViews() { for (const [key, id] of Object.entries(VIEWS)) $(id).checked = state.view[key]; }

// ---------- Presets ----------

const PRESETS = [
  { id: 'none', name: 'Choose an example…' },
  { id: 'single', name: 'One bar magnet', objs: [['magnet', 400, 260, 0]] },
  { id: 'attract', name: 'N facing S (attract)', objs: [['magnet', 220, 260, 0], ['magnet', 580, 260, 0]] },
  { id: 'repel', name: 'N facing N (repel)', objs: [['magnet', 220, 260, 0], ['magnet', 580, 260, 180]] },
  { id: 'repel-s', name: 'S facing S (repel)', objs: [['magnet', 220, 260, 180], ['magnet', 580, 260, 0]] },
  { id: 'side', name: 'Side by side', objs: [['magnet', 400, 175, 0], ['magnet', 400, 345, 180]] },
  { id: 'iron', name: 'Induced magnetism (iron bar)', objs: [['magnet', 250, 260, 0], ['iron', 540, 260, 0]] },
  { id: 'plot', name: 'Plot the field with a compass', objs: [['magnet', 400, 280, 0]], compasses: [[400, 150]], view: { lines: false, marks: true } },
];

function applyPreset(id) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p || !p.objs) return;
  state.objs = p.objs.map(([kind, x, y, angle]) => ({ kind, x, y, angle }));
  state.compasses = (p.compasses || []).map(([x, y]) => ({ x, y }));
  state.marks = [];
  $('clear-marks').hidden = true;
  state.selected = null;
  state.view = { lines: true, arrows: true, filings: false, grid: false, strength: false, force: true, marks: false, ...(p.view || {}) };
  syncViews();
  $('preset').value = id;
  changed();
}

$('preset').innerHTML = PRESETS.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
$('preset').addEventListener('change', (e) => applyPreset(e.target.value));
$('clear').addEventListener('click', () => {
  state.objs = []; state.compasses = []; state.marks = []; state.selected = null;
  $('clear-marks').hidden = true;
  $('preset').value = 'none';
  changed();
});
$('share').addEventListener('click', () => { saveHash(); PK.copyLink(); });

// ---------- Shareable link ----------

function saveHash() {
  const items = [
    ...state.objs.map((o) => `${o.kind === 'magnet' ? 'm' : 'i'}.${Math.round(o.x)}.${Math.round(o.y)}.${o.angle}`),
    ...state.compasses.map((c) => `c.${Math.round(c.x)}.${Math.round(c.y)}`),
  ];
  // A cleared board still needs a mark in the link, or it would open with the first example
  history.replaceState(null, '', items.length ? `#o=${items.join('_')}` : '#empty');
}

function loadHash() {
  if (location.hash === '#empty') return true;
  const raw = new URLSearchParams(location.hash.slice(1)).get('o');
  if (!raw) return false;
  for (const item of raw.split('_')) {
    const [t, x, y, a] = item.split('.');
    const pos = { x: Math.max(0, Math.min(W, Number(x) || 0)), y: Math.max(0, Math.min(H, Number(y) || 0)) };
    if (t === 'm' || t === 'i') state.objs.push({ kind: t === 'm' ? 'magnet' : 'iron', ...pos, angle: ((Number(a) || 0) % 360 + 360) % 360 });
    else if (t === 'c') state.compasses.push(pos);
  }
  return true;
}

// ---------- Update cycle ----------

function changed() {
  dirty = true;
  update();
  renderSelected();
  renderForces();
  requestDraw(false);
  saveHash();
}

window.addEventListener('resize', sizeCanvas);
window.addEventListener('pk-theme', () => requestDraw(true));

sizeCanvas();
if (loadHash()) changed(); else applyPreset('single');
