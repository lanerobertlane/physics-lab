// Conductors & insulators. Clip a material into the gap in a circuit with a cell, a lamp and an
// ammeter. Metals and graphite let a current flow; the other non-metals don't. The zoomed-in view
// shows why: metals and graphite have free electrons, but in the other materials every electron
// stays with its own atom.

PK.header({
  title: 'Conductors & insulators',
  answers: true,
  spec: [
    { code: 'KS3', text: 'Differences in resistance between conducting and insulating components' },
    { code: 'KS3', text: 'Electric current as a flow of charge, measured in amperes' },
    { code: 'KS3', text: 'The properties of metals and non-metals' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const rand = (a, b) => a + Math.random() * (b - a);

// The materials. R is the resistance of the piece in the gap, in ohms (none for an insulator).
const ITEMS = [
  { id: 'copper', name: 'Copper wire', mat: 'Copper', kind: 'metal', R: 0.02, ion: '#e08a4f' },
  { id: 'nail', name: 'Steel nail', mat: 'Steel', kind: 'metal', R: 0.05, ion: '#9aa4b1' },
  { id: 'foil', name: 'Aluminium foil', mat: 'Aluminium', kind: 'metal', R: 0.03, ion: '#c3ccd5' },
  { id: 'key', name: 'Brass key', mat: 'Brass', kind: 'metal', R: 0.04, ion: '#d6b24a' },
  { id: 'lead', name: 'Pencil lead', mat: 'Graphite', kind: 'graphite', R: 8 },
  { id: 'ruler', name: 'Plastic ruler', mat: 'Plastic', kind: 'insulator', tint: '#5aa0e0' },
  { id: 'stick', name: 'Lolly stick', mat: 'Wood', kind: 'insulator', tint: '#c9a46a' },
  { id: 'band', name: 'Rubber band', mat: 'Rubber', kind: 'insulator', tint: '#d0574a' },
  { id: 'glass', name: 'Glass rod', mat: 'Glass', kind: 'insulator', tint: '#7fc1d3' },
  { id: 'paper', name: 'Paper', mat: 'Paper', kind: 'insulator', tint: '#c8bfa8' },
];
const EMF = 3, R_IN = 0.5, R_LAMP = 12.5;   // two 1.5 V cells and a small torch lamp
const I_FULL = EMF / (R_IN + R_LAMP);
const state = { gap: -1, rows: [], drag: null, used: false };
const inGap = () => ITEMS[state.gap] || null;
const conducts = (it) => Boolean(it) && it.kind !== 'insulator';
function current() { const it = inGap(); return conducts(it) ? EMF / (R_IN + R_LAMP + it.R) : 0; }

// ---------- The bench ----------

const cv = $('bench'), c = cv.getContext('2d');
const W = 800, H = 440;
const TOP = 70, BOT = 236, XL = 34, XR = 540, CL = 182, CR = 378, GX = (CL + CR) / 2;   // the circuit; CL and CR are the clip jaws
const LX = 290, AX = 440, MW = 150;                                                         // lamp and ammeter
const ZX = 672, ZY = 168, ZR = 112;                                                         // the zoomed-in view
const TY = 340, SLOT = (W - 24) / ITEMS.length;                                             // the tray
const slotX = (i) => 12 + SLOT * (i + 0.5);
const BLUE = '#1e63c6', RED = '#d0392b', BLACK = '#23272e', INK = '#1c2430', WIRE = '#3a414c', BENCH = '#e8eef5';   // the same in every theme
function label(s, x, y, o = {}) {
  c.font = `${o.w || 700} ${o.s || 15}px ${font()}`; c.textAlign = o.a || 'center'; c.textBaseline = o.b || 'middle';
  c.fillStyle = o.col || INK; c.fillText(s, x, y);
}
function meter(cx, cy, name, value, unit) {
  const h = 78;
  c.fillStyle = '#343a45'; c.beginPath(); c.roundRect(cx - MW / 2, cy - h / 2, MW, h, 9); c.fill();
  c.fillStyle = '#cfe6c4'; c.fillRect(cx - 60, cy - 30, 120, 40);
  c.fillStyle = '#17231a'; c.font = `800 26px ui-monospace, Consolas, monospace`; c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillText(value, cx + 26, cy - 9);
  c.font = `800 22px ${font()}`; c.textAlign = 'left'; c.fillText(unit, cx + 30, cy - 9);
  label(name, cx, cy + 25, { s: 14, col: '#fff' });
}
function battery(cx, cy) {
  const each = 44, n = 2, w = n * each + 24;
  c.fillStyle = '#4a5260'; c.beginPath(); c.roundRect(cx - w / 2, cy - 28, w, 56, 7); c.fill();
  for (let i = 0; i < n; i++) {
    const x = cx - (n * each) / 2 + i * each + 2;
    c.fillStyle = '#d6a92e'; c.fillRect(x, cy - 16, each - 12, 32);
    c.fillStyle = '#1b1e24'; c.fillRect(x + (each - 12) * 0.55, cy - 16, (each - 12) * 0.45, 32);
    c.fillStyle = '#bfc5cf'; c.fillRect(x + each - 12, cy - 6, 5, 12);
  }
  label('3.0 V', cx, cy - 42, { s: 15, w: 800 });
  label('−', cx - w / 2 - 12, cy - 16, { s: 22, w: 800 });
  label('+', cx + w / 2 + 12, cy - 16, { s: 20, w: 800 });
  return { left: cx - w / 2, right: cx + w / 2 };
}
// A torch lamp in a holder. b is how bright it is, from 0 (off) to 1.
function lamp(b) {
  const x = LX, gy = TOP - 30;
  if (b > 0) {
    const g = c.createRadialGradient(x, gy, 4, x, gy, 30 + 50 * b);
    g.addColorStop(0, `rgba(255, 214, 90, ${0.7 * b})`); g.addColorStop(1, 'rgba(255, 214, 90, 0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, gy, 30 + 50 * b, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = '#4a515c'; c.beginPath(); c.roundRect(x - 26, TOP - 7, 52, 14, 4); c.fill();
  c.fillStyle = '#b9a46a'; c.fillRect(x - 9, TOP - 15, 18, 9);
  c.fillStyle = b > 0 ? `rgba(255, 236, 150, ${0.35 + 0.6 * b})` : 'rgba(226, 234, 242, 0.9)';
  c.beginPath(); c.arc(x, gy, 20, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#7c8796'; c.lineWidth = 1.5; c.stroke();
  c.strokeStyle = b > 0 ? '#ff8a00' : '#5b6370'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x - 6, TOP - 14); c.lineTo(x - 6, gy + 2);
  for (let i = 1; i <= 6; i++) c.lineTo(x - 6 + i * 2, gy + 2 + (i % 2 ? -4 : 0));
  c.lineTo(x + 6, TOP - 14); c.stroke();
  label('Lamp', x, TOP + 22, { s: 14, w: 800 });
}
// A crocodile clip whose jaws are at x. dir is +1 when the jaws point right, −1 when they point left.
function clip(x, dir, col) {
  const back = x - dir * 30;
  c.fillStyle = col;
  c.beginPath(); c.roundRect(Math.min(back, back - dir * 14), BOT - 11, 14, 22, 3); c.fill();
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(back, BOT + s * 11); c.lineTo(x, BOT + s * 4); c.lineTo(x, BOT + s * 1.5); c.lineTo(back, BOT + s * 3); c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1;
  for (let k = 0; k < 4; k++) { const tx = x - dir * (4 + k * 6); c.beginPath(); c.moveTo(tx, BOT - 3); c.lineTo(tx - dir * 3, BOT - 1); c.stroke(); }
  return back - dir * 14;   // where the lead joins it
}

// Each material, drawn lying flat, centred on (x, y), len long. s scales its thickness.
function drawItem(it, x, y, len, s) {
  const L = x - len / 2, R = x + len / 2;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  switch (it.id) {
    case 'copper':
      c.strokeStyle = '#b8612a'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke();
      c.strokeStyle = '#f0a868'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(L + 2, y - 1 * s); c.lineTo(R - 2, y - 1 * s); c.stroke();
      break;
    case 'nail':
      c.fillStyle = '#8d96a3'; c.fillRect(L + 4 * s, y - 3.5 * s, len - 16 * s, 7 * s);
      c.beginPath(); c.moveTo(R - 12 * s, y - 3.5 * s); c.lineTo(R, y); c.lineTo(R - 12 * s, y + 3.5 * s); c.closePath(); c.fill();
      c.fillStyle = '#6b7480'; c.fillRect(L, y - 9 * s, 5 * s, 18 * s);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(L + 6 * s, y - 2.5 * s, len - 22 * s, 1.5 * s);
      break;
    case 'foil': {
      c.fillStyle = '#d5dbe1'; c.strokeStyle = '#98a2ae'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(L, y - 8 * s);
      const n = Math.max(6, Math.round(len / 10));
      for (let i = 1; i <= n; i++) c.lineTo(L + (len * i) / n, y - 8 * s + (i % 2 ? 2.5 : -1) * s);
      for (let i = n; i >= 0; i--) c.lineTo(L + (len * i) / n, y + 8 * s + (i % 2 ? -2 : 1.5) * s);
      c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.8)';
      for (let i = 1; i < n; i += 2) { c.beginPath(); c.moveTo(L + (len * i) / n, y - 5 * s); c.lineTo(L + (len * (i + 0.6)) / n, y + 5 * s); c.stroke(); }
      break;
    }
    case 'key':
      c.fillStyle = '#c9a43a'; c.strokeStyle = '#8f7320'; c.lineWidth = 1;
      c.beginPath(); c.arc(L + 10 * s, y, 10 * s, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = BENCH; c.beginPath(); c.arc(L + 8 * s, y, 3.5 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9a43a'; c.fillRect(L + 19 * s, y - 3 * s, len - 19 * s, 6 * s);
      for (let i = 0; i < 4; i++) c.fillRect(R - (6 + i * 7) * s, y + 3 * s, 4 * s, (4 + (i % 2) * 3) * s);
      break;
    case 'lead':
      c.strokeStyle = '#33373d'; c.lineWidth = 4.5 * s; c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke();
      c.strokeStyle = '#8a8f96'; c.lineWidth = 1 * s; c.beginPath(); c.moveTo(L + 2, y - 1 * s); c.lineTo(R - 2, y - 1 * s); c.stroke();
      break;
    case 'ruler': {
      c.fillStyle = 'rgba(80, 160, 230, 0.6)'; c.strokeStyle = '#2f6fb0'; c.lineWidth = 1;
      c.fillRect(L, y - 9 * s, len, 18 * s); c.strokeRect(L, y - 9 * s, len, 18 * s);
      c.strokeStyle = '#1d4f86';
      const n = Math.max(6, Math.round(len / 9));
      for (let i = 1; i < n; i++) { const tx = L + (len * i) / n; c.beginPath(); c.moveTo(tx, y - 9 * s); c.lineTo(tx, y - (i % 5 ? 5 : 2) * s); c.stroke(); }
      break;
    }
    case 'stick':
      c.fillStyle = '#e3c58f'; c.strokeStyle = '#b8955a'; c.lineWidth = 1;
      c.beginPath(); c.roundRect(L, y - 6 * s, len, 12 * s, 6 * s); c.fill(); c.stroke();
      break;
    case 'band':
      c.strokeStyle = '#c0392b'; c.lineWidth = 3 * s;
      c.beginPath(); c.roundRect(L + 2, y - 5 * s, len - 4, 10 * s, 5 * s); c.stroke();
      break;
    case 'glass':
      c.fillStyle = 'rgba(190, 230, 240, 0.85)'; c.strokeStyle = '#6fa8b8'; c.lineWidth = 1;
      c.beginPath(); c.roundRect(L, y - 5 * s, len, 10 * s, 5 * s); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(L + 5 * s, y - 2 * s); c.lineTo(R - 5 * s, y - 2 * s); c.stroke();
      break;
    case 'paper':
      c.fillStyle = '#fbfaf5'; c.strokeStyle = '#b9b3a3'; c.lineWidth = 1;
      c.fillRect(L, y - 9 * s, len, 18 * s); c.strokeRect(L, y - 9 * s, len, 18 * s);
      c.strokeStyle = '#dcd6c6'; c.beginPath(); c.moveTo(L + len * 0.5, y - 9 * s); c.lineTo(L + len * 0.5, y + 9 * s); c.stroke();
      break;
  }
  c.restore();
}

// Moving electrons in the wires, from the − terminal of the cell round to the +
let paths = null, phase = 0;
function pathLen(p) { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }
function pointAt(p, d) {
  for (let i = 1; i < p.length; i++) {
    const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (d <= seg) { const f = d / seg; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f]; }
    d -= seg;
  }
  return p[p.length - 1];
}
function electrons(list) {
  c.fillStyle = BLUE;
  for (const p of list) {
    const len = pathLen(p);
    for (let d = phase % 22; d < len; d += 22) { const [x, y] = pointAt(p, d); c.beginPath(); c.arc(x, y, 3.4, 0, Math.PI * 2); c.fill(); }
  }
}

function drawBench(dt) {
  c.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
  c.fillStyle = BENCH; c.fillRect(0, 0, W, H);
  const I = current(), it = inGap();
  const bat = { left: 118 - 56, right: 118 + 56 };
  // The wires
  const lClip = CL - 44, rClip = CR + 44;
  const wires = [
    [[bat.left, TOP], [XL, TOP], [XL, BOT], [lClip, BOT]],
    [[rClip, BOT], [XR, BOT], [XR, TOP], [AX + MW / 2, TOP]],
    [[AX - MW / 2, TOP], [LX + 26, TOP]],
    [[LX - 26, TOP], [bat.right, TOP]],
  ];
  c.strokeStyle = WIRE; c.lineWidth = 4; c.lineJoin = 'round';
  for (const p of wires) { c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
  battery(118, TOP);
  lamp((I / I_FULL) ** 2);
  meter(AX, TOP, 'Ammeter', I.toFixed(2), 'A');

  // The gap, and whatever is in it
  if (it) drawItem(it, GX, BOT, CR - CL + 22, 1.5);
  else {
    c.setLineDash([6, 5]); c.strokeStyle = '#7a8594'; c.lineWidth = 1.5;
    c.beginPath(); c.roundRect(CL + 8, BOT - 22, CR - CL - 16, 44, 8); c.stroke(); c.setLineDash([]);
    label(state.used ? 'Air: the gap is empty' : 'Drag a material here', GX, BOT, { s: 15, w: 800, col: '#4b5563' });
  }
  clip(CL, 1, BLACK); clip(CR, -1, RED);
  if (I > 0) {
    phase += dt * 70 * (I / I_FULL);
    electrons([...wires.slice(0, 1), [[lClip, BOT], [rClip, BOT]], ...wires.slice(1)]);
  }
  c.fillStyle = BLUE; c.beginPath(); c.arc(44, 300, 5, 0, Math.PI * 2); c.fill();
  label('Electrons, flowing from − round to +', 56, 300, { s: 14, a: 'left' });

  drawZoom(it);
  tray();
  if (state.drag) drawItem(ITEMS[state.drag.i], state.drag.x, state.drag.y, 130, 1.1);
}

// ---------- Inside the material ----------

let parts = { els: [], atoms: [] }, zoomFor = null;
function setupZoom(it) {
  zoomFor = it;
  const atoms = [], els = [];
  if (it && it.kind === 'metal') {
    for (let r = -3; r <= 3; r++) for (let k = -3; k <= 3; k++) atoms.push({ x: k * 46 + (r % 2 ? 23 : 0), y: r * 42, ph: Math.random() * 9 });
    for (let i = 0; i < 26; i++) els.push({ x: rand(-ZR, ZR), y: rand(-ZR, ZR), vx: rand(-40, 40), vy: rand(-40, 40) });
  } else if (it && it.kind === 'graphite') {
    for (const ly of [-69, -23, 23, 69]) for (let k = -6; k <= 6; k++) atoms.push({ x: k * 24, y: ly + (k % 2 ? -5 : 5), layer: ly, ph: Math.random() * 9 });
    for (const ly of [-69, -23, 23, 69]) for (let i = 0; i < 5; i++) els.push({ x: rand(-ZR, ZR), y: ly, layer: ly, vx: rand(-30, 30), ph: Math.random() * 9 });
  } else if (it) {
    for (let r = -2; r <= 2; r++) for (let k = -3; k <= 3; k++) {
      const a = { x: k * 50 + (r % 2 ? 25 : 0), y: r * 48, ph: Math.random() * 9 };
      atoms.push(a);
      for (const off of [0, Math.PI]) els.push({ atom: a, ang: rand(0, 6.3) + off, w: rand(2, 3.5) * (Math.random() < 0.5 ? -1 : 1) });
    }
  }
  parts = { atoms, els };
}
// Free electrons wander about at random, and drift from − to + while a current flows
function stepZoom(dt) {
  const it = zoomFor;
  if (!it) return;
  const drift = conducts(it) ? (it.kind === 'graphite' ? 22 : 30) : 0;
  for (const e of parts.els) {
    if (e.atom) { e.ang += e.w * dt; continue; }
    e.vx += rand(-150, 150) * dt;
    if (it.kind === 'graphite') { e.vx = Math.max(-35, Math.min(35, e.vx)); e.ph += dt * 3; e.y = e.layer + Math.sin(e.ph) * 4; }
    else {
      e.vy += rand(-150, 150) * dt;
      const sp = Math.hypot(e.vx, e.vy); if (sp > 45) { e.vx *= 45 / sp; e.vy *= 45 / sp; }
      e.y += e.vy * dt;
      if (Math.abs(e.y) > ZR) { e.vy = -e.vy; e.y = Math.sign(e.y) * ZR; }
    }
    e.x += (e.vx + drift) * dt;
    if (e.x > ZR + 8) e.x -= 2 * ZR + 16; else if (e.x < -ZR - 8) e.x += 2 * ZR + 16;
  }
}
function electron(x, y) {
  c.fillStyle = BLUE; c.beginPath(); c.arc(x, y, 5.5, 0, Math.PI * 2); c.fill();
  label('−', x, y - 0.5, { s: 13, w: 800, col: '#fff' });
}
function drawZoom(it) {
  label('Inside the material', ZX, ZY - ZR - 16, { s: 15, w: 800 });
  c.save();
  c.beginPath(); c.arc(ZX, ZY, ZR, 0, Math.PI * 2); c.clip();
  c.fillStyle = '#f8fafc'; c.fillRect(ZX - ZR, ZY - ZR, 2 * ZR, 2 * ZR);
  const t = performance.now() / 1000;
  if (!it) {
    label('Put a material in', ZX, ZY - 10, { s: 15, col: '#6b7280' });
    label('the gap to look inside it', ZX, ZY + 10, { s: 15, col: '#6b7280' });
  } else if (it.kind === 'metal') {
    for (const a of parts.atoms) {
      const x = ZX + a.x + Math.sin(t * 9 + a.ph) * 0.8, y = ZY + a.y + Math.cos(t * 7 + a.ph) * 0.8;
      const g = c.createRadialGradient(x - 5, y - 5, 2, x, y, 15); g.addColorStop(0, '#ffffff'); g.addColorStop(1, it.ion);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, 15, 0, Math.PI * 2); c.fill();
      label('+', x, y, { s: 16, w: 800, col: '#2b2f36' });
    }
    for (const e of parts.els) electron(ZX + e.x, ZY + e.y);
  } else if (it.kind === 'graphite') {
    c.strokeStyle = '#8a9099'; c.lineWidth = 2;
    for (const ly of [-69, -23, 23, 69]) {
      const row = parts.atoms.filter((a) => a.layer === ly);
      c.beginPath(); row.forEach((a, i) => (i ? c.lineTo(ZX + a.x, ZY + a.y) : c.moveTo(ZX + a.x, ZY + a.y))); c.stroke();
    }
    for (const a of parts.atoms) { c.fillStyle = '#454a52'; c.beginPath(); c.arc(ZX + a.x + Math.sin(t * 8 + a.ph) * 0.6, ZY + a.y, 8, 0, Math.PI * 2); c.fill(); }
    for (const e of parts.els) electron(ZX + e.x, ZY + e.y);
  } else {
    for (const a of parts.atoms) {
      const x = ZX + a.x + Math.sin(t * 9 + a.ph) * 0.8, y = ZY + a.y + Math.cos(t * 7 + a.ph) * 0.8;
      a.dx = x; a.dy = y;
      c.fillStyle = it.tint; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(30, 99, 198, 0.25)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 17, 0, Math.PI * 2); c.stroke();
    }
    for (const e of parts.els) electron(e.atom.dx + Math.cos(e.ang) * 17, e.atom.dy + Math.sin(e.ang) * 17);
  }
  c.restore();
  c.strokeStyle = '#4b5563'; c.lineWidth = 3; c.beginPath(); c.arc(ZX, ZY, ZR, 0, Math.PI * 2); c.stroke();
  if (it) {
    const [a, b] = it.kind === 'metal' ? [`${it.mat}: a metal`, 'Free electrons drift through it']
      : it.kind === 'graphite' ? ['Graphite: a non-metal', 'Free electrons move along its layers']
        : [it.mat, 'Each electron stays with its atom'];
    label(a, ZX, ZY + ZR + 18, { s: 15, w: 800 });
    label(b, ZX, ZY + ZR + 37, { s: 14, w: 600 });
  }
}

// ---------- The tray of materials ----------

function tray() {
  c.fillStyle = 'rgba(255, 255, 255, 0.75)'; c.strokeStyle = '#c3ccd8'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(8, TY, W - 16, 96, 10); c.fill(); c.stroke();
  label('Materials: drag one into the gap, or tap it', 22, TY + 15, { s: 14, w: 800, a: 'left' });
  ITEMS.forEach((it, i) => {
    const x = slotX(i);
    if (i === state.gap || state.drag?.i === i) {
      c.setLineDash([4, 4]); c.strokeStyle = '#9aa4b1'; c.lineWidth = 1.2;
      c.beginPath(); c.roundRect(x - 30, TY + 34, 60, 22, 6); c.stroke(); c.setLineDash([]);
    } else drawItem(it, x, TY + 45, 58, 0.75);
    const words = it.name.split(' ');
    label(words[0], x, TY + 70, { s: 13, w: 700 });
    if (words[1]) label(words.slice(1).join(' '), x, TY + 85, { s: 13, w: 700 });
  });
}

function place(i) {
  state.gap = i; state.used = true;
  setupZoom(ITEMS[i]);
}
function takeOut() { state.gap = -1; state.used = true; setupZoom(null); }
const nearGap = (p) => p.x > CL - 70 && p.x < CR + 70 && p.y > BOT - 80 && p.y < BOT + 70;
PK.dragOn(cv, W, H, {
  hit: (p) => {
    if (p.y > TY + 26 && p.y < TY + 96) {
      const i = Math.floor((p.x - 12) / SLOT);
      if (i >= 0 && i < ITEMS.length && i !== state.gap) return { what: 'tray', i, x: p.x, y: p.y };
    }
    if (state.gap >= 0 && p.x > CL - 24 && p.x < CR + 24 && Math.abs(p.y - BOT) < 28) return { what: 'gap', i: state.gap, x: p.x, y: p.y };
    return null;
  },
  move: (d, p) => {
    if (d.what === 'gap' && state.gap === d.i) takeOut();
    d.x = p.x; d.y = p.y;
    state.drag = { i: d.i, x: p.x, y: p.y };
  },
  end: (d) => { state.drag = null; if (nearGap(d)) place(d.i); },
  tap: (d) => { if (d.what === 'tray') place(d.i); else takeOut(); },
});

// ---------- The circuit diagram, drawn with the Circuit builder's symbols ----------

const dia = $('diagram'), dd = dia.getContext('2d');
let diagramKey = '';
function drawDiagram() {
  const key = `${dia.width}|${PK.cssVar('--text')}`;
  if (key === diagramKey || !dia.width) return;
  diagramKey = key;
  const DW = 270, DH = 160, k = dia.width / DW, S = window.CircuitSymbols, col = PK.cssVar('--text');
  dd.setTransform(k, 0, 0, k, 0, 0);
  dd.fillStyle = PK.cssVar('--surface'); dd.fillRect(0, 0, DW, DH);
  const L = 24, R = 246, T = 30, B = 112;
  const w = (x1, y1, x2, y2) => S.place(dd, 'wire', x1, y1, x2, y2, col);
  S.place(dd, 'battery', L, T, R, T, col);
  w(L, T, L, B); w(R, T, R, B);
  w(L, B, 52, B);
  S.place(dd, 'lamp', 112, B, 168, B, col);
  S.place(dd, 'ammeter', 182, B, 232, B, col); S.text(dd, 'A', 207, B, col, 15);
  w(98, B, 112, B); w(168, B, 182, B); w(232, B, R, B);
  dd.strokeStyle = col; dd.lineWidth = 2.5;
  for (const x of [56, 94]) { dd.beginPath(); dd.arc(x, B, 4, 0, Math.PI * 2); dd.stroke(); }
  S.text(dd, 'gap', 75, B + 20, col, 13);
}

// ---------- Results ----------

const lampText = (it) => (it.kind === 'metal' ? 'Lights' : it.kind === 'graphite' ? 'Lights dimly' : 'Off');
const amps = (it) => (conducts(it) ? EMF / (R_IN + R_LAMP + it.R) : 0).toFixed(2);
$('rec').addEventListener('click', () => {
  const it = inGap();
  if (!it) { PK.toast('Put a material in the gap first'); return; }
  if (state.rows.includes(it.id)) { PK.toast(`${it.name} is already in the table`); return; }
  state.rows.push(it.id);
  renderResults();
});
function renderResults() {
  const rows = state.rows.map((id) => ITEMS.find((x) => x.id === id)).filter(Boolean);
  $('table').innerHTML = rows.length
    ? `<table class="results"><thead><tr><th>Material</th><th>Metal?</th><th>Lamp</th><th>Current (A)</th><th>Conductor or insulator?</th><th><span class="sr-only">Delete</span></th></tr></thead>
      <tbody>${rows.map((it, n) => `<tr><td>${it.name}</td><td>${it.kind === 'metal' ? 'Yes' : 'No'}</td><td>${lampText(it)}</td><td>${amps(it)}</td><td>${PK.ans(conducts(it) ? 'Conductor' : 'Insulator')}</td><td><button class="del" data-row="${n}" aria-label="Delete ${it.name}">✕</button></td></tr>`).join('')}</tbody></table>`
    : '<p class="note">No results yet.</p>';
}
$('clear').addEventListener('click', () => { state.rows = []; renderResults(); });
$('table').addEventListener('click', (e) => { const b = e.target.closest('.del'); if (b) { state.rows.splice(Number(b.dataset.row), 1); renderResults(); } });

// ---------- Start ----------

function statusNow() {
  const it = inGap(), I = amps(it || ITEMS[5]);
  if (!it) return state.used
    ? 'There’s only air in the gap, so the circuit isn’t complete and no current flows. Drag another material into the gap.'
    : 'There’s a gap in the circuit, so no current flows. Drag a material from the tray into the gap, between the crocodile clips.';
  const name = it.name.toLowerCase();
  if (it.kind === 'metal') return `<b>The lamp lights</b> and the ammeter reads ${I} A. A current flows through the ${name}, so it’s ${PK.ans('a conductor')}. Record the result, then try another material.`;
  if (it.kind === 'graphite') return `<b>The lamp lights, but more dimly</b>, and the ammeter reads ${I} A. A current flows through the pencil lead (graphite), so it’s ${PK.ans('a conductor')}, but not as good a one as a metal.`;
  return `<b>The lamp stays off</b> and the ammeter reads 0.00 A. No current flows through the ${name}, so it’s ${PK.ans('an insulator')}. Record the result, then try another material.`;
}
function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  for (const [el, w, h] of [[cv, W, H], [dia, 270, 160]]) {
    if (!el.clientWidth) continue;
    el.width = Math.round(el.clientWidth * dpr); el.height = Math.round(el.clientWidth * (h / w) * dpr);
  }
  diagramKey = '';
}
let lastStatus = '', lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, now - lastFrame) / 1000); lastFrame = now;
  stepZoom(dt);
  drawBench(dt);
  drawDiagram();
  const s = statusNow();
  if (s !== lastStatus) { lastStatus = s; $('status').innerHTML = s; }
  requestAnimationFrame(frame);
}
window.addEventListener('resize', sizeAll);
window.addEventListener('pk-theme', () => { diagramKey = ''; });
sizeAll();
renderResults();
requestAnimationFrame(frame);

// Share: what's in the gap and the results table
PK.shareState = {
  get: () => ({ g: state.gap, r: state.rows }),
  set: (o) => {
    if (Number.isInteger(o.g) && ITEMS[o.g]) place(o.g); else if (o.g === -1) takeOut();
    if (Array.isArray(o.r)) state.rows = o.r.filter((id) => ITEMS.some((x) => x.id === id));
    renderResults();
  },
};
