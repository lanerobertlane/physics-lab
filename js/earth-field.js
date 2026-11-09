// Earth's magnetic field: a compass on a desk, then compasses all round the Earth, and why that
// is evidence that the core must be magnetic.

PK.header({
  title: 'Earth’s magnetic field',
  answers: true,
  spec: [
    { code: '4.7.1.2', text: 'A magnetic compass contains a small bar magnet. The Earth has a magnetic field' },
    { code: '4.7.1.2', text: 'The compass needle points in the direction of the Earth’s magnetic field' },
    { code: '4.7.1.2', text: 'Explain how the behaviour of a magnetic compass is related to evidence that the core of the Earth must be magnetic' },
    { code: 'KS3', text: 'Earth’s magnetism, compass and navigation' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const RED = '#d93025', BLUE = '#1f5fd1', GREY = '#9aa0a6';   // the same colours as Bar magnet fields
const state = { tab: 'desk' };

function write(ctx, s, x, y, o = {}) {
  ctx.font = `${o.w || 700} ${o.s || 15}px ${font()}`; ctx.textAlign = o.a || 'center'; ctx.textBaseline = o.b || 'middle';
  ctx.fillStyle = o.col || '#fff'; ctx.fillText(s, x, y);
}
function barMagnet(ctx, x, y, angle, len, wide) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = BLUE; ctx.fillRect(-len / 2, -wide / 2, len / 2, wide);
  ctx.fillStyle = RED; ctx.fillRect(0, -wide / 2, len / 2, wide);
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.5; ctx.strokeRect(-len / 2, -wide / 2, len, wide);
  ctx.restore();
  const c = Math.cos(angle) * len * 0.3, s = Math.sin(angle) * len * 0.3, size = Math.round(wide * 0.62);
  write(ctx, 'N', x + c, y + s, { s: size, w: 900 });
  write(ctx, 'S', x - c, y - s, { s: size, w: 900 });
}

// ---------- On your desk ----------

const desk = $('desk'), dc = desk.getContext('2d');
const DW = 800, DH = 460, CR = 96;
const comp = { x: 300, y: 214, rot: 0, th: 0, om: 0, used: false };   // rot: how far the dial is turned. th: where the needle points. 0 is north.
let magnet = null;   // { x, y, a }, where a is the direction its north end points
const POLE = 48000, HALF = 55, MLEN = 136, MWIDE = 42;

// The Earth's field, plus a magnet modelled as two poles (the same idea as Bar magnet fields)
function deskField(x, y) {
  const b = { x: 0, y: -1 };
  if (magnet) {
    const ux = Math.cos(magnet.a), uy = Math.sin(magnet.a);
    for (const [q, px, py] of [[POLE, magnet.x + ux * HALF, magnet.y + uy * HALF], [-POLE, magnet.x - ux * HALF, magnet.y - uy * HALF]]) {
      const dx = x - px, dy = y - py, r2 = Math.max(400, dx * dx + dy * dy), r = Math.sqrt(r2);
      b.x += (q * dx) / (r2 * r); b.y += (q * dy) / (r2 * r);
    }
  }
  return b;
}
function stepNeedle(dt) {
  const b = deskField(comp.x, comp.y);
  const err = Math.atan2(Math.sin(Math.atan2(b.x, -b.y) - comp.th), Math.cos(Math.atan2(b.x, -b.y) - comp.th));
  comp.om += (32 * Math.sin(err) - 3.2 * comp.om) * dt;
  comp.th += comp.om * dt;
}
function drawDesk() {
  const c = dc;
  c.setTransform(desk.width / DW, 0, 0, desk.width / DW, 0, 0);
  c.fillStyle = '#c99e6e'; c.fillRect(0, 0, DW, DH);
  c.strokeStyle = 'rgba(120, 80, 40, .22)'; c.lineWidth = 2;
  for (let y = 18; y < DH; y += 38) { c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(240, y + 14, 520, y - 14, DW, y + 6); c.stroke(); }

  // Which way is north
  c.strokeStyle = '#14324f'; c.fillStyle = '#14324f'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(52, 118); c.lineTo(52, 42); c.stroke();
  c.beginPath(); c.moveTo(52, 28); c.lineTo(42, 48); c.lineTo(62, 48); c.closePath(); c.fill();
  write(c, 'North', 52, 136, { s: 17, w: 800, col: '#14324f' });

  if (magnet) barMagnet(c, magnet.x, magnet.y, magnet.a, MLEN, MWIDE);

  // The compass case and dial
  c.save(); c.translate(comp.x, comp.y);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(4, 6, CR + 4, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(0, 0, CR, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#8c6d27'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#fbfaf5'; c.beginPath(); c.arc(0, 0, CR - 15, 0, Math.PI * 2); c.fill();
  c.rotate(comp.rot);
  c.strokeStyle = '#8c6d27'; c.lineWidth = 3;
  for (let i = 0; i < 24; i++) { const a = (i * Math.PI) / 12; c.beginPath(); c.moveTo(Math.sin(a) * (CR - 11), -Math.cos(a) * (CR - 11)); c.lineTo(Math.sin(a) * (CR - 3), -Math.cos(a) * (CR - 3)); c.stroke(); }
  c.strokeStyle = '#555'; c.lineWidth = 1.5;
  for (let i = 0; i < 36; i++) { const a = (i * Math.PI) / 18, r = i % 9 ? CR - 22 : CR - 27; c.beginPath(); c.moveTo(Math.sin(a) * r, -Math.cos(a) * r); c.lineTo(Math.sin(a) * (CR - 16), -Math.cos(a) * (CR - 16)); c.stroke(); }
  ['N', 'E', 'S', 'W'].forEach((d, i) => {
    c.save(); c.rotate((i * Math.PI) / 2); write(c, d, 0, -(CR - 40), { s: d === 'N' ? 24 : 20, w: 900, col: d === 'N' ? RED : '#222' }); c.restore();
  });
  c.restore();

  // The needle, which doesn't turn with the case
  c.save(); c.translate(comp.x, comp.y); c.rotate(comp.th);
  const len = CR - 30, w = 11;
  c.fillStyle = RED; c.beginPath(); c.moveTo(0, -len); c.lineTo(w, 0); c.lineTo(-w, 0); c.closePath(); c.fill();
  c.fillStyle = GREY; c.beginPath(); c.moveTo(0, len); c.lineTo(w, 0); c.lineTo(-w, 0); c.closePath(); c.fill();
  c.fillStyle = '#333'; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill();
  c.restore();

  // What can be dragged
  c.fillStyle = 'rgba(20, 30, 45, .78)'; c.fillRect(0, DH - 34, DW, 34);
  write(c, magnet ? 'Drag the compass or the magnet. Drag the ring to turn the compass. Tap the magnet to turn it round.' : 'Drag the compass to move it. Drag the brass ring to turn it. Tap it to give the needle a nudge.', DW / 2, DH - 17, { s: 16 });
}
function deskStatus() {
  const turned = Math.abs(Math.atan2(Math.sin(comp.rot), Math.cos(comp.rot)));
  if (magnet) {
    const b = deskField(comp.x, comp.y), pull = Math.hypot(b.x, b.y + 1);
    if (pull < 0.08) return 'The magnet is too far away to make much difference, so the needle still points north. Move it closer.';
    if (pull > 1.5) return 'Close to the magnet, its field is much stronger than the Earth’s, so the needle lines up with the <b>magnet’s</b> field. Take the magnet away and watch the needle.';
    return 'The needle has turned because it’s now in two fields at once: the Earth’s and the magnet’s.';
  }
  if (comp.rot !== 0 && turned < 0.07) return '<b>N on the dial lines up with the needle.</b> Now the letters on the dial show the real directions, which is how a compass is used to find your way.';
  if (comp.rot !== 0) return 'You turned the case, but the needle didn’t turn with it. Nothing is holding it that way round except a <b>magnetic field</b>.';
  return 'With no magnet nearby, the red end still settles pointing the same way: <b>north</b>. Something must be making a magnetic field here. It’s the <b>Earth</b>.';
}
$('magnet').addEventListener('click', () => {
  magnet = magnet ? null : { x: 620, y: 300, a: Math.PI };
  $('magnet').textContent = magnet ? 'Take the magnet away' : '＋ Bring a magnet';
});
function magnetAt(p) {
  if (!magnet) return false;
  const dx = p.x - magnet.x, dy = p.y - magnet.y, ux = Math.cos(magnet.a), uy = Math.sin(magnet.a);
  return Math.abs(dx * ux + dy * uy) < MLEN / 2 + 8 && Math.abs(-dx * uy + dy * ux) < MWIDE / 2 + 12;
}
PK.dragOn(desk, DW, DH, {
  hit: (p) => {
    if (magnetAt(p)) return { what: 'magnet', dx: magnet.x - p.x, dy: magnet.y - p.y };
    const r = Math.hypot(p.x - comp.x, p.y - comp.y);
    if (r <= CR - 15) return { what: 'body', dx: comp.x - p.x, dy: comp.y - p.y };
    if (r <= CR + 18) return { what: 'ring', a0: Math.atan2(p.x - comp.x, comp.y - p.y), rot0: comp.rot };
    return null;
  },
  move: (d, p) => {
    if (d.what === 'magnet') { magnet.x = clamp(p.x + d.dx, 80, DW - 80); magnet.y = clamp(p.y + d.dy, 40, DH - 66); }
    else if (d.what === 'body') { comp.x = clamp(p.x + d.dx, CR + 6, DW - CR - 6); comp.y = clamp(p.y + d.dy, CR + 6, DH - CR - 40); }
    else {
      comp.rot = d.rot0 + Math.atan2(p.x - comp.x, comp.y - p.y) - d.a0;
      if (Math.abs(Math.atan2(Math.sin(comp.rot), Math.cos(comp.rot))) < 0.07 && comp.rot !== 0) comp.rot = 2 * Math.PI * 1e-4;   // settles when lined up
    }
  },
  tap: (d) => {
    if (d.what === 'magnet') magnet.a += Math.PI;
    else comp.om += Math.random() < 0.5 ? 7 : -7;
  },
});

// ---------- Around the Earth ----------

const globe = $('globe'), gc = globe.getContext('2d');
const GW = 800, GH = 540, CX = 400, CY = 270, ER = 112, TILT = (11 * Math.PI) / 180, MAX = 40;
const atPolar = (deg, r) => ({ x: CX + r * Math.cos((deg * Math.PI) / 180), y: CY - r * Math.sin((deg * Math.PI) / 180) });
const START = () => [atPolar(52, ER + 28), atPolar(180, ER + 28), atPolar(-35, ER + 28)];
const sim = { comps: START(), marks: [], flip: false, moved: false };
const STARS = (() => { let s = 11; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Array.from({ length: 150 }, () => ({ x: rnd() * GW, y: rnd() * GH, r: 0.5 + rnd() * 1.1 })); })();

const tilted = () => (PK.beyondShown() && $('tilt').checked ? TILT : 0);
const flipped = () => sim.flip && $('inside').checked;
// The field of a magnet with a pole just under each end of the Earth: its north pole at the South
// Pole end and its south pole at the North Pole end. The field then runs along the ground towards
// the North Pole, so a compass in the UK points north and follows the field lines as well.
const POLE_AT = 0.9;   // how far each pole is from the centre, in Earth radii
function poleField(x, y) {   // in Earth radii, with the axis upright and y going down the screen
  let bx = 0, by = 0;
  for (const [q, py] of [[1, POLE_AT], [-1, -POLE_AT]]) {
    const dy = y - py, r2 = Math.max(0.0004, x * x + dy * dy), r3 = r2 * Math.sqrt(r2);
    bx += (q * x) / r3; by += (q * dy) / r3;
  }
  return { x: bx, y: by };
}
function fieldAt(x, y) {
  const t = tilted(), sign = flipped() ? -1 : 1, cos = Math.cos(t), sin = Math.sin(t);
  const dx = (x - CX) / ER, dy = (y - CY) / ER, b = poleField(dx * cos + dy * sin, -dx * sin + dy * cos);
  return { x: sign * (b.x * cos - b.y * sin), y: sign * (b.x * sin + b.y * cos) };
}
function arrowAt(x, y, a, len, col, width = 2) {
  const c = gc, ux = Math.cos(a), uy = Math.sin(a);
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = width;
  c.beginPath(); c.moveTo(x - ux * len, y - uy * len); c.lineTo(x + ux * (len - 3), y + uy * (len - 3)); c.stroke();
  c.beginPath(); c.moveTo(x + ux * (len + 4), y + uy * (len + 4));
  c.lineTo(x + ux * (len - 5) - uy * 5, y + uy * (len - 5) + ux * 5); c.lineTo(x + ux * (len - 5) + uy * 5, y + uy * (len - 5) - ux * 5); c.closePath(); c.fill();
}
function needle(x, y, b, len) {
  const c = gc, a = Math.atan2(b.y, b.x), ux = Math.cos(a), uy = Math.sin(a), w = len * 0.22;
  c.fillStyle = RED; c.beginPath(); c.moveTo(x + ux * len, y + uy * len); c.lineTo(x - uy * w, y + ux * w); c.lineTo(x + uy * w, y - ux * w); c.closePath(); c.fill();
  c.fillStyle = GREY; c.beginPath(); c.moveTo(x - ux * len, y - uy * len); c.lineTo(x - uy * w, y + ux * w); c.lineTo(x + uy * w, y - ux * w); c.closePath(); c.fill();
}
// Each line is followed both ways from where it crosses the equator, until it reaches the Earth
const LINES = (() => {
  const trace = (x0, dir) => {
    const pts = [];
    let x = x0, y = 0;
    for (let i = 0; i < 2600 && Math.hypot(x, y) >= 1 && Math.abs(x) < 6 && Math.abs(y) < 6; i++) {
      const a = poleField(x, y), m = Math.hypot(a.x, a.y) * dir;
      const b = poleField(x + (a.x / m) * 0.01, y + (a.y / m) * 0.01), n = Math.hypot(b.x, b.y) * dir;
      x += (b.x / n) * 0.02; y += (b.y / n) * 0.02;
      if (i % 3 === 2) pts.push([x, y]);
    }
    return pts;
  };
  return [1.22, 1.5, 1.9, 2.5, 3.4].map((x0) => [...trace(x0, -1).reverse(), [x0, 0], ...trace(x0, 1)]);
})();
function fieldLines() {
  const c = gc, t = tilted(), col = '#8fd0ff';
  const place = ([x, y], side) => {
    const px = side * x * ER, py = y * ER;
    return { x: CX + px * Math.cos(t) - py * Math.sin(t), y: CY + px * Math.sin(t) + py * Math.cos(t) };
  };
  for (const line of LINES) {
    for (const side of [-1, 1]) {
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath();
      line.forEach((q, i) => { const p = place(q, side); if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); });
      c.stroke();
      for (const f of [0.25, 0.5, 0.75]) {
        const p = place(line[Math.floor(line.length * f)], side);
        if (Math.hypot(p.x - CX, p.y - CY) < ER + 8 || p.x < 12 || p.x > GW - 12 || p.y < 12 || p.y > GH - 12) continue;
        const b = fieldAt(p.x, p.y);
        arrowAt(p.x, p.y, Math.atan2(b.y, b.x), 5, col);
      }
    }
  }
}
function drawGlobe() {
  const c = gc, inside = $('inside').checked;
  c.save(); c.beginPath(); c.arc(CX, CY, ER, 0, Math.PI * 2); c.clip();
  if (inside) {
    c.fillStyle = '#7a5138'; c.fillRect(CX - ER, CY - ER, ER * 2, ER * 2);
    c.fillStyle = '#c4622f'; c.beginPath(); c.arc(CX, CY, ER - 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f2a33a'; c.beginPath(); c.arc(CX, CY, 70, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffe08a'; c.beginPath(); c.arc(CX, CY, 30, 0, Math.PI * 2); c.fill();
  } else {
    const sea = c.createRadialGradient(CX - 34, CY - 44, 12, CX, CY, ER);
    sea.addColorStop(0, '#62b0ee'); sea.addColorStop(1, '#1d5ba4');
    c.fillStyle = sea; c.fillRect(CX - ER, CY - ER, ER * 2, ER * 2);
    c.fillStyle = '#5aa35a';
    for (const [x, y, rx, ry, a] of [[-38, -46, 44, 28, 0.4], [34, -62, 36, 18, -0.2], [52, -6, 22, 42, 0.3], [-52, 34, 26, 44, -0.25], [18, 72, 30, 14, 0.1], [-8, -14, 14, 20, 0.5]]) {
      c.beginPath(); c.ellipse(CX + x, CY + y, rx, ry, a, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#eef4f8'; c.fillRect(CX - ER, CY - ER, ER * 2, 16); c.fillRect(CX - ER, CY + ER - 13, ER * 2, 13);
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(CX - ER, CY); c.lineTo(CX + ER, CY); c.stroke(); c.setLineDash([]);
  }
  c.restore();
  if (inside) {
    const t = tilted();
    // barMagnet's first half is the south end. The real Earth has that end at the top.
    barMagnet(c, CX, CY, Math.PI / 2 + t + (flipped() ? Math.PI : 0), 128, 32);
    write(c, 'Core', CX + 92, CY + 44, { s: 15, w: 800, col: '#fff' });
  }
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.beginPath(); c.arc(CX, CY, ER, 0, Math.PI * 2); c.stroke();
}
function drawSpace() {
  const c = gc;
  c.setTransform(globe.width / GW, 0, 0, globe.width / GW, 0, 0);
  c.fillStyle = '#0b1530'; c.fillRect(0, 0, GW, GH);
  c.fillStyle = 'rgba(255,255,255,.65)';
  for (const s of STARS) { c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI * 2); c.fill(); }
  if ($('lines').checked) fieldLines();
  drawGlobe();
  const uk = atPolar(52, ER);
  c.fillStyle = '#ffd400'; c.beginPath(); c.arc(uk.x, uk.y, 5, 0, Math.PI * 2); c.fill();
  write(c, 'UK', uk.x - 20, uk.y + 6, { s: 14, w: 800 });

  for (const m of sim.marks) { const b = fieldAt(m.x, m.y); arrowAt(m.x, m.y, Math.atan2(b.y, b.x), 9, '#ffcf5a'); }
  for (const p of sim.comps) {
    c.fillStyle = '#fff'; c.strokeStyle = '#333'; c.lineWidth = 2;
    c.beginPath(); c.arc(p.x, p.y, 20, 0, Math.PI * 2); c.fill(); c.stroke();
    needle(p.x, p.y, fieldAt(p.x, p.y), 16);
    c.fillStyle = '#333'; c.beginPath(); c.arc(p.x, p.y, 2.5, 0, Math.PI * 2); c.fill();
  }
  for (const [name, y] of [['North Pole', CY - ER - 14], ['South Pole', CY + ER + 15]]) {
    c.fillStyle = 'rgba(11, 21, 48, .78)'; c.beginPath(); c.roundRect(CX - 46, y - 12, 92, 24, 7); c.fill();
    write(c, name, CX, y, { s: 16, w: 800 });
  }
  if (!sim.moved) write(c, 'Drag a compass around the Earth', 20, 28, { s: 17, w: 800, a: 'left' });
  if ($('inside').checked && !sim.flipSeen) write(c, 'Tap the magnet to turn it round', 20, sim.moved ? 28 : 54, { s: 17, w: 800, a: 'left' });
}
function earthStatus() {
  if (flipped()) return 'Turned this way round, the compasses point towards the <b>South</b> Pole. Real compasses don’t do that. Tap the magnet to turn it back.';
  if ($('inside').checked) return 'The field looks just like the field of a bar magnet inside the Earth, with its <b>south</b> end towards the North Pole.';
  if ($('lines').checked) return 'The field lines come out near the South Pole and go back in near the North Pole. You’ve seen that shape around a <b>bar magnet</b>.';
  return 'Each needle lines up with the field where it is. Follow the red ends from one compass to the next, and they lead you round the Earth from the South Pole end to the North Pole end.';
}
function placeOutside(p) {
  const dx = p.x - CX, dy = p.y - CY, r = Math.hypot(dx, dy) || 1, min = ER + 24;
  const out = r < min ? { x: CX + (dx / r) * min, y: CY + (dy / r) * min } : p;
  return { x: clamp(out.x, 22, GW - 22), y: clamp(out.y, 22, GH - 22) };
}
PK.dragOn(globe, GW, GH, {
  hit: (p) => {
    let best = -1, near = 28;
    sim.comps.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < near) { near = d; best = i; } });
    if (best >= 0) { const q = sim.comps[best]; return { what: 'compass', i: best, dx: q.x - p.x, dy: q.y - p.y, last: { x: q.x, y: q.y } }; }
    if ($('inside').checked) {
      const t = tilted(), dx = p.x - CX, dy = p.y - CY, along = dx * -Math.sin(t) + dy * Math.cos(t), across = dx * Math.cos(t) + dy * Math.sin(t);
      if (Math.abs(along) < 72 && Math.abs(across) < 28) return { what: 'magnet' };
    }
    return null;
  },
  move: (d, p) => {
    if (d.what !== 'compass') return;
    sim.moved = true;
    const q = placeOutside({ x: p.x + d.dx, y: p.y + d.dy });
    sim.comps[d.i] = q;
    if ($('trail').checked && Math.hypot(q.x - d.last.x, q.y - d.last.y) >= 36) {
      sim.marks.push({ x: d.last.x, y: d.last.y }); d.last = { x: q.x, y: q.y };
      if (sim.marks.length > 300) sim.marks.shift();
    }
  },
  tap: (d) => { if (d.what === 'magnet') { sim.flip = !sim.flip; sim.flipSeen = true; } },
});
$('add').addEventListener('click', () => {
  if (sim.comps.length >= MAX) { PK.toast('That’s as many compasses as will fit'); return; }
  for (let i = 0; i < 24; i++) {
    const p = atPolar(20 + i * 75, ER + 60 + (i % 3) * 50);
    if (p.x > 24 && p.x < GW - 24 && p.y > 24 && p.y < GH - 24 && sim.comps.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 40)) { sim.comps.push(p); return; }
  }
  sim.comps.push(atPolar(Math.random() * 360, ER + 60));
});
$('fill').addEventListener('click', () => {
  const list = [];
  for (const [r, n, from] of [[ER + 30, 12, 15], [ER + 90, 12, 0], [ER + 160, 16, 11]]) {
    for (let i = 0; i < n; i++) { const p = atPolar(from + (i * 360) / n, r); if (p.x > 24 && p.x < GW - 24 && p.y > 24 && p.y < GH - 24) list.push(p); }
  }
  sim.comps = list.slice(0, MAX); sim.moved = true;
});
$('clear').addEventListener('click', () => { sim.comps = START(); sim.marks = []; sim.moved = false; });

// ---------- The exam answer, and starting up ----------

$('answer').innerHTML = [
  'A compass needle is a small bar magnet, and it lines up with a magnetic field.',
  'With no magnet nearby, the needle still points north, wherever you are on the Earth.',
  'So the Earth must have a magnetic field.',
  'The field has the same shape as the field around a bar magnet, so the core of the Earth must be magnetic.',
].map((p) => `<p>${PK.ans(p)}</p>`).join('');

function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  for (const [cv, w, h] of [[desk, DW, DH], [globe, GW, GH]]) {
    if (!cv.clientWidth) continue;
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr);
  }
}
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  sizeAll();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));

let lastStatus = '', lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, now - lastFrame) / 1000); lastFrame = now;
  stepNeedle(dt);
  let s;
  if (state.tab === 'desk') { drawDesk(); s = deskStatus(); } else { drawSpace(); s = earthStatus(); }
  if (s !== lastStatus) { lastStatus = s; $(state.tab === 'desk' ? 'd-status' : 'e-status').innerHTML = s; }
  requestAnimationFrame(frame);
}
window.addEventListener('resize', sizeAll);
showTab('desk');
requestAnimationFrame(frame);

// Share: where everything is (the tab and tick boxes are shared anyway)
PK.shareState = {
  get: () => ({
    d: [Math.round(comp.x), Math.round(comp.y), Number(comp.rot.toFixed(3))],
    m: magnet ? [Math.round(magnet.x), Math.round(magnet.y), Number(magnet.a.toFixed(3))] : 0,
    c: sim.comps.map((p) => [Math.round(p.x), Math.round(p.y)]),
    k: sim.marks.slice(-80).map((p) => [Math.round(p.x), Math.round(p.y)]),
    f: sim.flip ? 1 : 0,
  }),
  set: (o) => {
    if (Array.isArray(o.d)) { comp.x = clamp(Number(o.d[0]), CR + 6, DW - CR - 6); comp.y = clamp(Number(o.d[1]), CR + 6, DH - CR - 40); comp.rot = Number(o.d[2]) || 0; }
    magnet = Array.isArray(o.m) ? { x: Number(o.m[0]), y: Number(o.m[1]), a: Number(o.m[2]) } : null;
    $('magnet').textContent = magnet ? 'Take the magnet away' : '＋ Bring a magnet';
    const pos = (list) => list.map(([x, y]) => ({ x: Number(x), y: Number(y) })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (Array.isArray(o.c)) sim.comps = pos(o.c).slice(0, MAX);
    if (Array.isArray(o.k)) sim.marks = pos(o.k);
    sim.flip = Boolean(o.f); sim.moved = true;
  },
};
