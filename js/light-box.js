// Light box & lenses: a 2D ray tracer (Snell's law, partial reflection, total internal
// reflection, thin lenses) plus a ray-diagram mode for convex and concave lenses.

PK.header({
  title: 'Light box & lenses',
  answers: true,
  spec: [
    { code: '4.6.2.2', text: 'Refraction at a boundary, shown with ray diagrams' },
    { code: '4.6.1.3', text: 'Required practical: reflection of light by surfaces and refraction by different substances', po: true },
    { code: '4.6.2.5', text: 'Lenses: convex and concave, principal focus, real and virtual images, ray diagrams, magnification = image height ÷ object height', po: true },
    { code: '4.6.2.6', text: 'Visible light: white light is a mixture of colours (prism)', po: true },
    { code: 'KS3', text: 'Ray model of light: reflection in mirrors, refraction, convex lenses focusing light, prisms and colour' },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('optics');
const ctx = canvas.getContext('2d');
const W = 800, H = 500;
const AXIS_Y = 250;

const SCENES = {
  block: { name: 'Glass block' },
  semi: { name: 'Semicircular block (TIR)' },
  prism: { name: 'Prism' },
  mirror: { name: 'Plane mirror' },
  convex: { name: 'Convex lens' },
  concave: { name: 'Concave lens' },
  diagram: { name: 'Lens ray diagrams' },
};

const DEFAULT_BOX = {
  block: { x: 140, y: 120, angle: 25 },
  semi: { x: 0, y: 0, angle: 20 },        // position comes from the angle (it circles the block)
  prism: { x: 120, y: 330, angle: -20 },
  mirror: { x: 160, y: 120, angle: 30 },
  convex: { x: 110, y: 250, angle: 0 },
  concave: { x: 110, y: 250, angle: 0 },
};

const state = {
  scene: 'block', box: { ...DEFAULT_BOX.block }, beam: 1,
  n: 1.5, f: 160, spectrum: false,
  // Ray diagram mode, in cm (15 px per cm)
  diag: { type: 'convex', f: 8, u: 20, h: 3 },
};

// ---------- Optical elements for each scene ----------

const SEMI_C = { x: 460, y: 250 }, SEMI_R = 150;

function elements() {
  const s = state.scene;
  if (s === 'block') return [{ type: 'poly', n: state.n, pts: rect(330, 160, 260, 180) }];
  if (s === 'semi') {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = Math.PI / 2 + (i / 64) * Math.PI;      // left half: curved side faces the light box
      pts.push({ x: SEMI_C.x + Math.cos(a) * SEMI_R, y: SEMI_C.y + Math.sin(a) * SEMI_R });
    }
    return [{ type: 'poly', n: state.n, pts }];
  }
  if (s === 'prism') {
    const cx = 420, cy = 280, r = 140;
    const pts = [0, 1, 2].map((i) => ({ x: cx + r * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / 3), y: cy + r * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / 3) }));
    return [{ type: 'poly', n: state.n, pts }];
  }
  if (s === 'mirror') return [{ type: 'mirror', a: { x: 520, y: 90 }, b: { x: 520, y: 410 } }];
  if (s === 'convex') return [{ type: 'lens', x: 470, y0: 90, y1: 410, f: state.f }];
  if (s === 'concave') return [{ type: 'lens', x: 470, y0: 90, y1: 410, f: -state.f }];
  return [];
}

function rect(x, y, w, h) { return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }]; }

// ---------- Ray tracing ----------

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a, b) => a.x * b.x + a.y * b.y;
const norm = (v) => { const l = Math.hypot(v.x, v.y); return { x: v.x / l, y: v.y / l }; };

// Segment intersection: ray o + t d with segment p→q. Returns t or null.
function hitSegment(o, d, p, q) {
  const e = sub(q, p);
  const den = d.x * e.y - d.y * e.x;
  if (Math.abs(den) < 1e-12) return null;
  const w = sub(p, o);
  const t = (w.x * e.y - w.y * e.x) / den;
  const s = (w.x * d.y - w.y * d.x) / den;
  return t > 1e-6 && s >= 0 && s <= 1 ? t : null;
}

function polyCentre(pts) {
  return pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
}

function nearestHit(o, d, els) {
  let best = null;
  for (const el of els) {
    if (el.type === 'poly') {
      const c = polyCentre(el.pts);
      for (let i = 0; i < el.pts.length; i++) {
        const p = el.pts[i], q = el.pts[(i + 1) % el.pts.length];
        const t = hitSegment(o, d, p, q);
        if (t != null && (!best || t < best.t)) {
          const e = norm(sub(q, p));
          let nrm = { x: e.y, y: -e.x };
          const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
          if (dot(nrm, sub(mid, c)) < 0) nrm = { x: -nrm.x, y: -nrm.y };   // outward
          best = { t, el, nrm };
        }
      }
    } else if (el.type === 'mirror') {
      const t = hitSegment(o, d, el.a, el.b);
      if (t != null && (!best || t < best.t)) {
        const e = norm(sub(el.b, el.a));
        best = { t, el, nrm: { x: e.y, y: -e.x } };
      }
    } else if (el.type === 'lens') {
      const t = hitSegment(o, d, { x: el.x, y: el.y0 }, { x: el.x, y: el.y1 });
      if (t != null && (!best || t < best.t)) best = { t, el, nrm: { x: -1, y: 0 } };
    }
  }
  return best;
}

let segments = [];   // { a, b, alpha, colour, width }
let firstEvents = []; // angle info for the central ray

function trace(o, d, I, colour, nIndex, depth, record) {
  const els = elements();
  for (let guard = 0; guard < 40 && I > 0.02; guard++) {
    const h = nearestHit(o, d, els);
    if (!h) { segments.push({ a: o, b: { x: o.x + d.x * 2000, y: o.y + d.y * 2000 }, alpha: I, colour }); return; }
    const p = { x: o.x + d.x * h.t, y: o.y + d.y * h.t };
    segments.push({ a: o, b: p, alpha: I, colour });

    if (h.el.type === 'mirror') {
      const n = dot(d, h.nrm) > 0 ? { x: -h.nrm.x, y: -h.nrm.y } : h.nrm;
      const nd = { x: d.x - 2 * dot(d, n) * n.x, y: d.y - 2 * dot(d, n) * n.y };
      if (record) firstEvents.push({ kind: 'reflect', p, n, din: d, dout: nd });
      o = p; d = nd; continue;
    }
    if (h.el.type === 'lens') {
      const sign = Math.sign(d.x) || 1;
      const s = d.y / d.x;
      const s2 = s - (sign * (p.y - AXIS_Y)) / h.el.f;
      d = norm({ x: sign, y: sign * s2 });
      o = p; continue;
    }
    // Glass surface
    const entering = dot(d, h.nrm) < 0;
    const n1 = entering ? 1 : nIndex, n2 = entering ? nIndex : 1;
    const n = entering ? h.nrm : { x: -h.nrm.x, y: -h.nrm.y };   // faces back against the ray
    const cosi = -dot(n, d);
    const eta = n1 / n2;
    const k = 1 - eta * eta * (1 - cosi * cosi);
    const refl = { x: d.x + 2 * cosi * n.x, y: d.y + 2 * cosi * n.y };
    if (k < 0) {
      if (record) firstEvents.push({ kind: 'tir', p, n, din: d, dout: refl, n1, n2 });
      o = p; d = refl; continue;   // total internal reflection
    }
    const cost = Math.sqrt(k);
    const tdir = { x: eta * d.x + (eta * cosi - cost) * n.x, y: eta * d.y + (eta * cosi - cost) * n.y };
    // How much is reflected (Schlick's approximation)
    const r0 = ((n1 - n2) / (n1 + n2)) ** 2;
    const c = n1 <= n2 ? cosi : cost;
    const R = r0 + (1 - r0) * (1 - c) ** 5;
    if (record) firstEvents.push({ kind: 'refract', p, n, din: d, dout: tdir, n1, n2 });
    if (depth < 6 && I * R > 0.04) trace(p, refl, I * R, colour, nIndex, depth + 1, false);
    o = p; d = norm(tdir); I *= 1 - R;
  }
}

const SPECTRUM = [
  ['#ff3b30', 1.512], ['#ff9500', 1.516], ['#ffd60a', 1.52], ['#34c759', 1.525],
  ['#32ade6', 1.53], ['#5856d6', 1.535], ['#af52de', 1.54],
];

function traceAll() {
  segments = []; firstEvents = [];
  const b = boxPose();
  const dir = { x: Math.cos(b.angle * Math.PI / 180), y: Math.sin(b.angle * Math.PI / 180) };
  const perp = { x: -dir.y, y: dir.x };
  const front = { x: b.x + dir.x * 36, y: b.y + dir.y * 36 };
  const offsets = state.beam === 1 ? [0] : state.beam === 3 ? [-18, 0, 18] : [-36, -18, 0, 18, 36];
  for (const off of offsets) {
    const o = { x: front.x + perp.x * off, y: front.y + perp.y * off };
    if (state.scene === 'prism' && state.spectrum) {
      for (const [col, n] of SPECTRUM) trace(o, dir, 0.9, col, n, 0, false);
    } else {
      trace(o, dir, 1, null, state.n, 0, off === 0);
    }
  }
}

// In the semicircle scene the light box circles the block, always aimed at the centre of the flat face.
function boxPose() {
  if (state.scene !== 'semi') return state.box;
  const a = state.box.angle * Math.PI / 180;
  const dist = SEMI_R + 75;
  return { x: SEMI_C.x - Math.cos(a) * dist, y: SEMI_C.y - Math.sin(a) * dist, angle: state.box.angle };
}

// ---------- Drawing ----------

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

const DARK = '#11141b', RAY = '#fff3a6', GLASS = 'rgba(140, 200, 255, 0.18)', GLASS_EDGE = 'rgba(170, 215, 255, 0.85)';

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const font = PK.cssVar('--font-body') || 'sans-serif';
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, W, H);

  if (state.scene === 'diagram') { drawDiagram(font); return; }

  traceAll();
  const els = elements();

  // Principal axis for lenses
  if (state.scene === 'convex' || state.scene === 'concave') {
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, AXIS_Y); ctx.lineTo(W, AXIS_Y); ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const el of els) {
    if (el.type === 'poly') {
      ctx.fillStyle = GLASS; ctx.strokeStyle = GLASS_EDGE; ctx.lineWidth = 2;
      ctx.beginPath(); el.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (el.type === 'mirror') {
      ctx.strokeStyle = '#d7dde8'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(el.a.x, el.a.y); ctx.lineTo(el.b.x, el.b.y); ctx.stroke();
      ctx.strokeStyle = '#7a8394'; ctx.lineWidth = 1.5;
      for (let y = el.a.y + 6; y < el.b.y; y += 14) { ctx.beginPath(); ctx.moveTo(el.a.x + 3, y); ctx.lineTo(el.a.x + 13, y - 9); ctx.stroke(); }
    } else if (el.type === 'lens') {
      drawLensShape(el);
    }
  }

  // Rays, with a soft glow
  ctx.lineCap = 'round';
  for (const s of segments) {
    ctx.strokeStyle = s.colour || RAY;
    ctx.globalAlpha = Math.max(0.12, Math.min(1, s.alpha));
    ctx.shadowColor = s.colour || RAY;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  drawAngles(font);
  drawBox(font);
  renderReadout();
}

function drawLensShape(el) {
  const h = (el.y1 - el.y0) / 2, cy = (el.y0 + el.y1) / 2, conv = el.f > 0;
  ctx.fillStyle = GLASS; ctx.strokeStyle = GLASS_EDGE; ctx.lineWidth = 2;
  ctx.beginPath();
  if (conv) {
    ctx.moveTo(el.x, el.y0);
    ctx.quadraticCurveTo(el.x + 46, cy, el.x, el.y1);
    ctx.quadraticCurveTo(el.x - 46, cy, el.x, el.y0);
  } else {
    ctx.moveTo(el.x - 22, el.y0);
    ctx.lineTo(el.x + 22, el.y0);
    ctx.quadraticCurveTo(el.x + 2, cy, el.x + 22, el.y1);
    ctx.lineTo(el.x - 22, el.y1);
    ctx.quadraticCurveTo(el.x - 2, cy, el.x - 22, el.y0);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Principal foci
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 14px ${PK.cssVar('--font-body') || 'sans-serif'}`;
  ctx.textAlign = 'center';
  for (const side of [-1, 1]) {
    const fx = el.x + side * Math.abs(el.f);
    ctx.beginPath(); ctx.arc(fx, AXIS_Y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('F', fx, AXIS_Y + 22);
  }
}

function drawBox(font) {
  const b = boxPose();
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle * Math.PI / 180);
  ctx.fillStyle = '#3a4252';
  ctx.strokeStyle = '#9aa3b5';
  ctx.lineWidth = 2;
  ctx.fillRect(-36, -18, 72, 36);
  ctx.strokeRect(-36, -18, 72, 36);
  ctx.fillStyle = RAY;
  ctx.fillRect(32, -10, 4, 20);
  ctx.restore();
  // Rotate handle behind the box
  const a = b.angle * Math.PI / 180;
  const hx = b.x - Math.cos(a) * 62, hy = b.y - Math.sin(a) * 62;
  ctx.fillStyle = PK.cssVar('--accent') || '#3b4fd8';
  ctx.beginPath(); ctx.arc(hx, hy, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `800 14px ${font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⟳', hx, hy + 1);
}

const deg = (r) => (r * 180) / Math.PI;
function angleFromNormal(n, d) { return deg(Math.acos(Math.min(1, Math.abs(dot(n, d))))); }

// Normal line and labelled angles where the central ray first meets a surface.
function drawAngles(font) {
  const events = firstEvents.slice(0, state.scene === 'semi' ? 2 : 1);
  for (const ev of events) {
    if (state.scene === 'semi' && ev === events[0] && events.length > 1) continue;   // the curved face: no bending
    const { p, n } = ev;
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(p.x - n.x * 90, p.y - n.y * 90); ctx.lineTo(p.x + n.x * 90, p.y + n.y * 90); ctx.stroke();
    ctx.setLineDash([]);
    const i = angleFromNormal(n, ev.din);
    const o = angleFromNormal(n, ev.dout);
    // Arc for incidence (between the incoming ray reversed and the outward normal)
    arcBetween(p, n, { x: -ev.din.x, y: -ev.din.y }, 46, '#ffd60a', `i = ${i.toFixed(0)}°`, font);
    const outRef = ev.kind === 'refract' ? { x: -n.x, y: -n.y } : n;
    arcBetween(p, outRef, ev.dout, 60, ev.kind === 'refract' ? '#5ac8fa' : '#ff9f0a', `${ev.kind === 'refract' ? 'r' : 'r'} = ${o.toFixed(0)}°`, font);
  }
}

function arcBetween(p, a, b, r, colour, label, font) {
  const a1 = Math.atan2(a.y, a.x), a2 = Math.atan2(b.y, b.x);
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  ctx.strokeStyle = colour; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, r, a1, a1 + diff, diff < 0); ctx.stroke();
  const mid = a1 + diff / 2;
  ctx.fillStyle = colour;
  ctx.font = `700 14px ${font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, p.x + Math.cos(mid) * (r + 24), p.y + Math.sin(mid) * (r + 24));
}

// ---------- Ray diagram mode ----------

const PXCM = 15;          // light-box scenes: pixels per cm
const DPX = 11, LENS_X = 390;   // ray-diagram scale and lens position

function drawDiagram(font) {
  const dg = state.diag;
  const lx = LENS_X, f = (dg.type === 'convex' ? 1 : -1) * dg.f;
  const ox = lx - dg.u * DPX, oh = dg.h * DPX, tip = { x: ox, y: AXIS_Y - oh };
  const white = '#e9edf5', rayCol = RAY;

  // Axis, foci and 2F marks
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, AXIS_Y); ctx.lineTo(W, AXIS_Y); ctx.stroke();
  ctx.fillStyle = white; ctx.font = `700 14px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const s of [-1, 1]) {
    for (const m of [1, 2]) {
      const x = lx + s * m * dg.f * DPX;
      if (x < 0 || x > W) continue;
      ctx.beginPath(); ctx.arc(x, AXIS_Y, m === 1 ? 4 : 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(m === 1 ? 'F' : '2F', x, AXIS_Y + 8);
    }
  }

  // Lens symbol (AQA style): a line with arrowheads pointing out (convex) or in (concave)
  const top = AXIS_Y - 170, bot = AXIS_Y + 170;
  ctx.strokeStyle = '#8fd0ff'; ctx.fillStyle = '#8fd0ff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(lx, top); ctx.lineTo(lx, bot); ctx.stroke();
  const head = (y, dir) => { ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx - 10, y - dir * 14); ctx.lineTo(lx + 10, y - dir * 14); ctx.closePath(); ctx.fill(); };
  if (dg.type === 'convex') { head(top, -1); head(bot, 1); } else { head(top + 14, 1); head(bot - 14, -1); }

  // Object arrow
  arrowUp(ox, AXIS_Y, tip.y, white, false);
  ctx.fillStyle = white; ctx.textBaseline = 'bottom';
  ctx.fillText('object', ox, tip.y - 6);

  // Image (thin lens equation, real-is-positive: 1/f = 1/u + 1/v)
  const atFocus = Math.abs(dg.u - Math.abs(f)) < 1e-6 && f > 0;
  const v = atFocus ? Infinity : 1 / (1 / f - 1 / dg.u);
  const m = -v / dg.u;
  const ix = lx + v * DPX, ihPx = m * oh, imgTip = { x: ix, y: AXIS_Y - ihPx };
  const real = v > 0 && isFinite(v);

  ctx.lineWidth = 2.2;
  const extend = (p, q, len) => { const d = norm(sub(q, p)); return { x: q.x + d.x * len, y: q.y + d.y * len }; };
  const line = (a, b, dashed) => {
    ctx.setLineDash(dashed ? [7, 6] : []);
    ctx.strokeStyle = rayCol; ctx.globalAlpha = dashed ? 0.7 : 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  };

  // Ray 1: parallel to the axis, then through (or away from) F
  const l1 = { x: lx, y: tip.y };
  line(tip, l1);
  const fFar = { x: lx + f * DPX, y: AXIS_Y };   // convex: F on the far side; concave: F on the near side
  if (f > 0) line(l1, extend(l1, fFar, 900));
  else { const away = extend(fFar, l1, 900); line(l1, away); line(fFar, l1, true); }
  // Ray 2: through the centre, undeviated
  const c = { x: lx, y: AXIS_Y };
  line(tip, extend(tip, c, 900));
  // Ray 3 (convex, object beyond F): through F, then parallel
  if (f > 0 && dg.u > f) {
    const fNear = { x: lx - f * DPX, y: AXIS_Y };
    const t = (lx - tip.x) / (fNear.x - tip.x);
    const l3 = { x: lx, y: tip.y + (fNear.y - tip.y) * t };
    line(tip, l3);
    line(l3, { x: W + 20, y: l3.y });
  }
  // Virtual image: trace the refracted rays back as dashed lines
  if (!real && isFinite(v)) {
    line(l1, imgTip, true);
    line(c, imgTip, true);
  }

  if (isFinite(v) && Math.abs(ihPx) < 2000) arrowUp(ix, AXIS_Y, imgTip.y, real ? '#7ee787' : '#ffb86b', !real);

  // Labels
  ctx.fillStyle = real ? '#7ee787' : '#ffb86b';
  ctx.textAlign = 'center';
  ctx.textBaseline = ihPx >= 0 ? 'bottom' : 'top';
  if (isFinite(v) && ix > 0 && ix < W) ctx.fillText(real ? 'real image' : 'virtual image', ix, imgTip.y + (ihPx >= 0 ? -6 : 6));

  renderDiagramReadout(v, m, real, atFocus);
}

function arrowUp(x, y0, y1, colour, dashed) {
  ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = 4;
  ctx.setLineDash(dashed ? [8, 6] : []);
  ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 + (y1 < y0 ? 12 : -12)); ctx.stroke();
  ctx.setLineDash([]);
  const dir = y1 < y0 ? -1 : 1;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 9, y1 - dir * 16); ctx.lineTo(x + 9, y1 - dir * 16); ctx.closePath(); ctx.fill();
}

// ---------- Side panel ----------

function renderReadout() {
  const el = $('readout');
  const s = state.scene;
  const ev = firstEvents;
  let html = '';
  if (s === 'block' || s === 'prism') {
    const e = ev[0];
    if (e && e.kind === 'refract') {
      const i = angleFromNormal(e.n, e.din), r = angleFromNormal(e.n, e.dout);
      html = `<dl class="readout"><dt>Angle of incidence (i)</dt><dd>${i.toFixed(1)}°</dd><dt>Angle of refraction (r)</dt><dd>${r.toFixed(1)}°</dd></dl>
        <p class="note">Going into glass the light slows down and bends <b>towards</b> the normal, so r is smaller than i.</p>`;
    } else html = '<p class="note" style="margin:0">Aim the light box at the glass.</p>';
  } else if (s === 'mirror') {
    const e = ev[0];
    if (e) {
      const i = angleFromNormal(e.n, e.din), r = angleFromNormal(e.n, e.dout);
      html = `<dl class="readout"><dt>Angle of incidence (i)</dt><dd>${i.toFixed(1)}°</dd><dt>Angle of reflection (r)</dt><dd>${r.toFixed(1)}°</dd></dl>
        <p class="note">Law of reflection: the angle of incidence equals the angle of reflection.</p>`;
    } else html = '<p class="note" style="margin:0">Aim the light box at the mirror.</p>';
  } else if (s === 'semi') {
    const e = ev.find((x, k) => k > 0) || ev[1];
    const crit = deg(Math.asin(1 / state.n));
    if (e) {
      const i = angleFromNormal(e.n, e.din);
      html = `<dl class="readout"><dt>Angle at the flat face (i)</dt><dd>${i.toFixed(1)}°</dd><dt>Critical angle</dt><dd>${crit.toFixed(1)}°</dd></dl>
        <p class="note">${e.kind === 'tir'
          ? '<b>Total internal reflection:</b> i is bigger than the critical angle, so all the light reflects back inside the glass.'
          : 'Below the critical angle most light refracts out, bending away from the normal. A little is reflected.'}</p>`;
    } else html = '<p class="note" style="margin:0">Turn the light box to change the angle.</p>';
  } else {
    html = `<p class="note" style="margin:0">Parallel rays ${s === 'convex' ? 'converge to the principal focus F' : 'spread out as if they came from the principal focus F'}. Focal length = ${(state.f / PXCM).toFixed(1)} cm.</p>`;
  }
  el.innerHTML = html;
}

function renderDiagramReadout(v, m, real, atFocus) {
  const dg = state.diag;
  if (atFocus) {
    $('readout').innerHTML = '<p class="note" style="margin:0">The object is at F: the rays come out parallel, so <b>no image</b> is formed.</p>';
    return;
  }
  const mag = Math.abs(m);
  const size = mag > 1.02 ? 'magnified' : mag < 0.98 ? 'diminished' : 'same size';
  $('readout').innerHTML = `
    <dl class="readout">
      <dt>Image</dt><dd>${PK.ans(`${real ? 'real' : 'virtual'}, ${m < 0 ? 'inverted' : 'upright'}, ${size}`)}</dd>
      <dt>Image distance</dt><dd>${Math.abs(v).toFixed(1)} cm ${v > 0 ? '(other side)' : '(same side)'}</dd>
      <dt>Image height</dt><dd>${(mag * dg.h).toFixed(1)} cm</dd>
    </dl>
    <div class="working">magnification = image height ÷ object height = ${(mag * dg.h).toFixed(1)} ÷ ${dg.h} = <b>${PK.ans(mag.toFixed(2))}</b></div>`;
}

function renderSettings() {
  const el = $('settings');
  const s = state.scene;
  $('box-bar').hidden = s === 'diagram';
  if (s === 'diagram') {
    const dg = state.diag;
    el.innerHTML = `<h2>Ray diagram</h2>
      <div class="field"><label for="d-type">Lens</label>
        <select class="select" id="d-type"><option value="convex">Convex (converging)</option><option value="concave">Concave (diverging)</option></select></div>
      <div class="ctl"><label for="d-u">Object distance <b id="d-u-val">${dg.u} cm</b></label><input type="range" id="d-u" min="2" max="26" step="0.5" value="${dg.u}"></div>
      <div class="ctl"><label for="d-f">Focal length <b id="d-f-val">${dg.f} cm</b></label><input type="range" id="d-f" min="4" max="12" step="0.5" value="${dg.f}"></div>
      <p class="note">Try the object beyond 2F, at 2F, between F and 2F, and inside F.</p>`;
    $('d-type').value = dg.type;
    $('d-type').addEventListener('change', (e) => { dg.type = e.target.value; changed(); });
    $('d-u').addEventListener('input', (e) => { dg.u = Number(e.target.value); $('d-u-val').textContent = `${dg.u} cm`; changed(); });
    $('d-f').addEventListener('input', (e) => { dg.f = Number(e.target.value); $('d-f-val').textContent = `${dg.f} cm`; changed(); });
    return;
  }
  let html = '<h2>Settings</h2>';
  if (['block', 'semi', 'prism'].includes(s)) {
    html += `<div class="field"><label for="material">Material</label><select class="select" id="material">
      <option value="1.33">Water (n = 1.33)</option><option value="1.5">Glass (n = 1.5)</option><option value="1.49">Perspex (n = 1.49)</option><option value="2.42">Diamond (n = 2.42)</option></select></div>`;
  }
  if (s === 'prism') html += '<label class="toggle"><input type="checkbox" id="spectrum"> White light (show the spectrum)</label>';
  if (s === 'convex' || s === 'concave') html += `<div class="ctl"><label for="focal">Focal length <b id="focal-val">${(state.f / PXCM).toFixed(1)} cm</b></label><input type="range" id="focal" min="60" max="300" step="5" value="${state.f}"></div>`;
  el.innerHTML = html;
  el.hidden = html === '<h2>Settings</h2>';
  if ($('material')) { $('material').value = String(state.n); $('material').addEventListener('change', (e) => { state.n = Number(e.target.value); changed(); }); }
  if ($('spectrum')) { $('spectrum').checked = state.spectrum; $('spectrum').addEventListener('change', (e) => { state.spectrum = e.target.checked; changed(); }); }
  if ($('focal')) $('focal').addEventListener('input', (e) => { state.f = Number(e.target.value); $('focal-val').textContent = `${(state.f / PXCM).toFixed(1)} cm`; changed(); });
}

// ---------- Interaction ----------

function point(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (state.scene === 'diagram') {
    const p = point(e);
    const ox = LENS_X - state.diag.u * DPX;
    if (Math.abs(p.x - ox) < 24) drag = { what: 'object' };
  } else {
    const p = point(e), b = boxPose();
    const a = b.angle * Math.PI / 180;
    const hx = b.x - Math.cos(a) * 62, hy = b.y - Math.sin(a) * 62;
    if (Math.hypot(p.x - hx, p.y - hy) < 20 || (state.scene === 'semi' && Math.hypot(p.x - b.x, p.y - b.y) < 44)) drag = { what: 'rotate' };
    else if (Math.hypot(p.x - b.x, p.y - b.y) < 44) drag = { what: 'move', dx: b.x - p.x, dy: b.y - p.y };
  }
  if (drag) { try { canvas.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ } e.preventDefault(); }
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = point(e);
  if (drag.what === 'object') {
    state.diag.u = Math.max(2, Math.min(26, Math.round(((LENS_X - p.x) / DPX) * 2) / 2));
    const s = $('d-u'); if (s) { s.value = state.diag.u; $('d-u-val').textContent = `${state.diag.u} cm`; }
  } else if (drag.what === 'move') {
    state.box.x = Math.max(20, Math.min(W - 20, p.x + drag.dx));
    state.box.y = Math.max(20, Math.min(H - 20, p.y + drag.dy));
  } else {
    const b = boxPose();
    const ref = state.scene === 'semi' ? SEMI_C : b;
    let a = Math.atan2(ref.y - p.y, ref.x - p.x) * 180 / Math.PI;
    if (state.scene === 'semi') a = Math.max(-80, Math.min(80, a));
    state.box.angle = Math.round(a);
  }
  changed();
});
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

document.querySelectorAll('[data-turn]').forEach((b) => b.addEventListener('click', () => {
  let a = state.box.angle + Number(b.dataset.turn);
  if (state.scene === 'semi') a = Math.max(-80, Math.min(80, a));
  state.box.angle = a;
  changed();
}));
$('beam').addEventListener('change', (e) => { state.beam = Number(e.target.value); changed(); });

$('scenes').innerHTML = Object.entries(SCENES).map(([id, s]) => `<button class="btn" data-scene="${id}">${s.name}</button>`).join('');
$('scenes').addEventListener('click', (e) => { const b = e.target.closest('[data-scene]'); if (b) setScene(b.dataset.scene); });

function setScene(id) {
  state.scene = id;
  if (DEFAULT_BOX[id]) state.box = { ...DEFAULT_BOX[id] };
  if (id === 'convex' || id === 'concave') { state.beam = 5; $('beam').value = '5'; }
  document.querySelectorAll('#scenes .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scene === id)));
  renderSettings();
  changed();
}

let queued = false;
function changed() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; draw(); saveHash(); });
}

function saveHash() {
  const p = new URLSearchParams({ s: state.scene });
  if (state.scene === 'diagram') { p.set('t', state.diag.type); p.set('u', state.diag.u); p.set('f', state.diag.f); }
  else { p.set('a', state.box.angle); p.set('x', Math.round(state.box.x)); p.set('y', Math.round(state.box.y)); }
  history.replaceState(null, '', '#' + p.toString());
}

function loadHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const s = SCENES[p.get('s')] ? p.get('s') : 'block';
  setScene(s);
  if (s === 'diagram') {
    if (p.get('t') === 'concave') state.diag.type = 'concave';
    const u = Number(p.get('u')), f = Number(p.get('f'));
    if (u >= 2 && u <= 26) state.diag.u = u;
    if (f >= 4 && f <= 12) state.diag.f = f;
    renderSettings();
  } else if (p.get('a') != null) {
    state.box.angle = Number(p.get('a')) || 0;
    if (p.get('x')) state.box.x = Number(p.get('x'));
    if (p.get('y')) state.box.y = Number(p.get('y'));
  }
  changed();
}

window.addEventListener('resize', () => { sizeCanvas(); changed(); });
window.addEventListener('pk-theme', changed);

sizeCanvas();
loadHash();
