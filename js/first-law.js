// Newton's first law & inertia.
// Keep moving: drag the box to push it, then let go. Friction (μ m g) slows it on carpet, wood and ice;
// in deep space nothing acts on it, so it keeps moving at a constant velocity.
// Inertia: the coin-and-card trick. Friction from the card can only give the coin an acceleration of up
// to μ g, so a quick flick pulls the card away before the coin can speed up, and it drops into the cup.
// Inertial mass (HT): the same push for 1 second gives a = F ÷ m, whether on Earth, the Moon or in space.
// For now only Inertial mass is shown: the other two tabs are hidden (see START and the tab bar in the page),
// and their code is kept so they can come back.

PK.header({
  title: 'Newton’s first law & inertia',
  spec: [
    { code: '4.5.6.2.1', text: 'Newton’s first law: if the resultant force on a stationary object is zero, it remains stationary; if the resultant force on a moving object is zero, it continues to move at the same speed and in the same direction' },
    { code: '4.5.6.2.1', text: 'The velocity (speed and/or direction) of an object will only change if a resultant force is acting on it' },
    { code: '4.5.6.2.1', text: 'Inertia: the tendency of objects to continue in their state of rest or of uniform motion', ht: true },
    { code: '4.5.6.2.2', text: 'Inertial mass is a measure of how difficult it is to change the velocity of an object; it is defined as the ratio of force over acceleration', ht: true },
    { code: 'KS3', text: 'Forces being needed to cause objects to stop or start moving, or to change their speed or direction of motion (qualitative only)' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 380, G = 9.8;
const START = 'mass';   // the tab the page opens on, and the only one shown for now
const SHOWN = ['mass'];
const state = { tab: START };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const spaced = (n) => { const s = String(Math.round(n)); return s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s; };
const COL = { push: '#1e88e5', friction: '#e53935', weight: '#2e7d32', normal: '#8e24aa' };

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 14, weight = 700, halo = c.surface) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
// A force arrow from (x, y), dx and dy long, with a label beside its tip
function forceArrow(c, x, y, dx, dy, col, label, halo) {
  const len = Math.hypot(dx, dy);
  if (len < 3) return;
  const ux = dx / len, uy = dy / len, hx = x + dx, hy = y + dy;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx - ux * 8, hy - uy * 8); ctx.stroke(); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - ux * 13 - uy * 7, hy - uy * 13 + ux * 7); ctx.lineTo(hx - ux * 13 + uy * 7, hy - uy * 13 - ux * 7); ctx.closePath(); ctx.fill();
  if (label) tag(c, label, hx + (Math.abs(ux) > 0.5 ? ux * 8 : 12), hy + (Math.abs(uy) > 0.5 ? uy * 10 : 0), col, Math.abs(ux) > 0.5 ? (ux > 0 ? 'left' : 'right') : 'left', 13, 800, halo);
}
let seed = 3;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const STARS = Array.from({ length: 120 }, () => ({ x: rand() * W, y: rand() * H, s: rand() < 0.2 ? 1.5 : 0.9, a: 0.3 + rand() * 0.5 }));
function space() {
  ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  for (const s of STARS) { ctx.globalAlpha = s.a; ctx.fillRect(s.x, s.y, s.s, s.s); }
  ctx.globalAlpha = 1;
}
// Distance marks along the floor, every metre, scrolling with the view
function ruler(c, camX, ppm, y, ink) {
  ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
  const first = Math.floor(camX);
  for (let m = first; m <= camX + W / ppm + 1; m++) {
    const x = (m - camX) * ppm;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + (m % 5 === 0 ? 14 : 8)); ctx.stroke();
    if (m % (ppm < 80 ? 5 : 1) === 0 && x > 16 && x < W - 16) tag(c, `${m} m`, x, y + 24, ink, 'center', 12, 700, null);
  }
  ctx.lineWidth = 1;
}

// ---------- Keep moving ----------
const SURF = {
  carpet: { name: 'carpet', mu: 0.35, floor: '#b5736a', dark: '#8d5149' },
  wood: { name: 'a wooden floor', mu: 0.15, floor: '#d2a36c', dark: '#a87b47' },
  ice: { name: 'ice', mu: 0.02, floor: '#d6eef8', dark: '#9cc9dd' },
  space: { name: 'deep space', mu: 0, floor: null },
};
const BOX = { m: 2, w: 0.5, h: 0.34 };
const PPM = 100, FLOOR = 280;
const mv = { x: 1.5, v: 0, held: false, going: false, t: 0, samples: [], marks: [], nextMark: 0, graph: [], camX: 0, status: 'still' };
const friction = () => SURF[pressed('surface')].mu * BOX.m * G;
function resetMove() { Object.assign(mv, { x: 1.5, v: 0, held: false, going: false, t: 0, samples: [], marks: [], nextMark: 0, graph: [], camX: 0 }); setStatus(); }
function startMoving(v) {
  mv.v = Math.max(-8, Math.min(8, v));
  mv.going = true; mv.t = 0; mv.marks = []; mv.nextMark = 0; mv.graph = [{ t: 0, v: Math.abs(mv.v) }];
  setStatus();
}
function stepMove(dt) {
  if (mv.held) return;
  const a = SURF[pressed('surface')].mu * G;
  if (mv.v !== 0) { const dv = a * dt; mv.v = Math.abs(mv.v) <= dv ? 0 : mv.v - Math.sign(mv.v) * dv; }
  mv.x += mv.v * dt;
  if (mv.going) {
    mv.t += dt;
    if (mv.t >= mv.nextMark) { mv.marks.push(mv.x); mv.nextMark += 0.5; if (mv.marks.length > 80) mv.marks.shift(); }
    const last = mv.graph[mv.graph.length - 1];
    if (mv.t - last.t >= 0.05) mv.graph.push({ t: mv.t, v: Math.abs(mv.v) });
    if (mv.v === 0) { mv.going = false; mv.marks.push(mv.x); }
  }
  // Keep the box in view
  const view = W / PPM;
  if (mv.x - mv.camX > view * 0.6) mv.camX = mv.x - view * 0.6;
  if (mv.x - mv.camX < view * 0.15) mv.camX = mv.x - view * 0.15;
  setStatus();
}
function setStatus() {
  const s = mv.held ? 'held' : mv.v !== 0 ? (SURF[pressed('surface')].mu ? 'slowing' : 'steady') : mv.marks.length ? 'stopped' : 'still';
  if (s !== mv.status) { mv.status = s; if (state.tab === 'move') render(); }
}
function drawMove(c) {
  const sf = SURF[pressed('surface')], inSpace = !sf.floor, ink = inSpace ? '#cfd8dc' : c.text;
  if (inSpace) space();
  else {
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = sf.floor; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    // Texture that moves with the floor, so you can see the box move past it
    ctx.strokeStyle = sf.dark; ctx.lineWidth = 1;
    const step = pressed('surface') === 'wood' ? 1 : 0.25;
    for (let m = Math.floor(mv.camX / step) * step; m < mv.camX + W / PPM + step; m += step) {
      const x = (m - mv.camX) * PPM;
      if (pressed('surface') === 'wood') { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x, H); ctx.stroke(); }
      else if (pressed('surface') === 'carpet') { for (let y = FLOOR + 40; y < H; y += 10) { ctx.fillStyle = sf.dark; ctx.fillRect(x + ((y / 10) % 2) * 12, y, 2, 2); } }
      else { ctx.beginPath(); ctx.moveTo(x, FLOOR + 44); ctx.lineTo(x + 14, FLOOR + 40); ctx.stroke(); }
    }
  }
  // Speed against time since you let go
  const gx = 520, gy = 18, gw = 262, gh = 120, tMax = Math.max(10, Math.ceil(mv.t)), vMax = 8;
  ctx.fillStyle = inSpace ? 'rgba(11, 16, 32, .85)' : c.surface; ctx.fillRect(gx - 34, gy - 6, gw + 44, gh + 40);
  ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke(); ctx.lineWidth = 1;
  tag(c, 'speed (m/s)', gx + 8, gy + 2, ink, 'left', 11, 700, null);
  tag(c, '8', gx - 8, gy + 4, ink, 'right', 11, 600, null); tag(c, '0', gx - 8, gy + gh, ink, 'right', 11, 600, null);
  tag(c, `time since you let go (s): 0 to ${tMax}`, gx + gw / 2, gy + gh + 16, ink, 'center', 11, 700, null);
  if (mv.graph.length > 1) {
    ctx.strokeStyle = inSpace ? '#ffd54f' : '#1e88e5'; ctx.lineWidth = 2.5; ctx.beginPath();
    mv.graph.forEach((p, i) => { const x = gx + (p.t / tMax) * gw, y = gy + gh - (Math.min(p.v, vMax) / vMax) * gh; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke(); ctx.lineWidth = 1;
  }
  ruler(c, mv.camX, PPM, FLOOR, inSpace ? ink : '#3b2f2a');
  if (inSpace) { ctx.strokeStyle = 'rgba(207, 216, 220, .5)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke(); ctx.setLineDash([]); }
  // Where the box was every half second
  ctx.fillStyle = inSpace ? '#ffd54f' : '#1e88e5';
  for (const m of mv.marks) { const x = (m - mv.camX) * PPM; ctx.beginPath(); ctx.moveTo(x, FLOOR - 1); ctx.lineTo(x - 5, FLOOR - 9); ctx.lineTo(x + 5, FLOOR - 9); ctx.closePath(); ctx.fill(); }
  // The box (it floats just above the line in space)
  const bx = (mv.x - mv.camX) * PPM, bw = BOX.w * PPM, bh = BOX.h * PPM, by = FLOOR - bh - (inSpace ? 26 : 0);
  ctx.fillStyle = '#ef8a3a'; ctx.fillRect(bx - bw / 2, by, bw, bh);
  ctx.strokeStyle = '#a5531a'; ctx.lineWidth = 2; ctx.strokeRect(bx - bw / 2, by, bw, bh); ctx.lineWidth = 1;
  tag(c, '2 kg', bx, by + bh / 2, '#fff', 'center', 14, 800, null);
  if ($('forces').checked) {
    const halo = inSpace ? '#0b1020' : c.surface;
    if (!inSpace) {
      forceArrow(c, bx, by + bh, 0, 62, COL.weight, 'weight 20 N', sf.floor);
      forceArrow(c, bx, by, 0, -62, COL.normal, 'normal contact force 20 N', halo);
      if (mv.v !== 0 && !mv.held) forceArrow(c, bx - Math.sign(mv.v) * bw / 2, by + bh - 6, -Math.sign(mv.v) * Math.max(12, friction() * 6), 0, COL.friction, `friction ${friction().toFixed(1)} N`, halo);
    } else tag(c, 'no forces act on it', bx, by - 22, '#ffd54f', 'center', 13, 800, halo);
  }
  tag(c, mv.held ? 'Let go to see what happens' : 'Drag the box to push it, then let go', 16, 22, inSpace ? '#cfd8dc' : c.muted, 'left', 14, 700, inSpace ? '#0b1020' : c.surface);
  tag(c, '▼ marks where it was every half second', 16, 44, inSpace ? '#ffd54f' : '#1e88e5', 'left', 12, 700, inSpace ? '#0b1020' : c.surface);
}

// ---------- Inertia: the coin and the card ----------
// Units: cm and s. The table top is at height 0; the cup is 10 cm tall with a 7 cm opening.
const CUP = { x: 40, w: 7, h: 10 }, CARD_L = 14, CARD_T = 0.3, COIN_D = 2.4, MU_COIN = 0.4;
const PX = 10, TABLE_Y = 320;   // px per cm, and the table top on the canvas
const sx = (x) => 400 + (x - CUP.x) * PX, sy = (y) => TABLE_Y - y * PX;
const tr = { card: 40, cardV: 0, prevCard: 40, held: false, auto: null, coin: { x: 40, y: CUP.h + CARD_T, vx: 0, vy: 0, mode: 'card' }, slipped: false, outcome: null };
function resetCoin() { Object.assign(tr, { card: 40, cardV: 0, prevCard: 40, held: false, auto: null, coin: { x: 40, y: CUP.h + CARD_T, vx: 0, vy: 0, mode: 'card' }, slipped: false, outcome: null, fricT: 0, fricDir: 0 }); if (state.tab === 'coin') render(); }
function stepCoin(dt) {
  // The card: moved by your finger, or by the Flick and Pull buttons
  if (tr.auto) {
    const a = tr.auto === 'flick' ? 9000 : 20, vTop = tr.auto === 'flick' ? 350 : 12;
    tr.cardV = Math.min(vTop, tr.cardV + a * dt);
    tr.card += tr.cardV * dt;
    if (tr.card > 120) tr.auto = null;
  } else if (tr.held) {
    tr.cardV = (tr.card - tr.prevCard) / Math.max(dt, 1e-3);
  } else tr.cardV = 0;
  tr.prevCard = tr.card;
  const c = tr.coin, n = 10, h = dt / n, v0 = c.vx;
  for (let i = 0; i < n; i++) {
    if (c.mode === 'card') {
      if (Math.abs(c.x - tr.card) < CARD_L / 2) {
        // Friction from the card can only change the coin's speed by μ g each second
        const rel = tr.cardV - c.vx, dvMax = MU_COIN * 981 * h;
        if (Math.abs(rel) <= dvMax) c.vx = tr.cardV; else { c.vx += Math.sign(rel) * dvMax; if (Math.abs(rel) > 20) tr.slipped = true; }
        c.x += c.vx * h;
      } else { c.mode = 'fall'; c.vy = 0; }
    } else if (c.mode === 'fall') {
      c.vy -= 981 * h; c.y += c.vy * h; c.x += c.vx * h;
      const inside = Math.abs(c.x - CUP.x) < CUP.w / 2 - COIN_D / 2 + 0.4;
      if (inside && c.y <= CUP.h) { c.mode = 'drop'; c.vx = 0; c.x = Math.max(CUP.x - CUP.w / 2 + COIN_D / 2 + 0.2, Math.min(CUP.x + CUP.w / 2 - COIN_D / 2 - 0.2, c.x)); }
      else if (!inside && c.y <= 0) { c.y = 0; c.vy = 0; c.vx = 0; c.mode = 'table'; tr.outcome = 'table'; }
    } else if (c.mode === 'drop') {
      c.vy -= 981 * h; c.y += c.vy * h;
      if (c.y <= 0.6) { c.y = 0.6; c.vy = 0; c.mode = 'cup'; tr.outcome = 'cup'; }
    }
  }
  // Friction acts only while it is changing the coin's speed; the arrow stays a moment so it doesn't flicker
  if (c.mode === 'card' && Math.abs(c.vx - v0) > 0.01) { tr.fricDir = Math.sign(c.vx - v0); tr.fricT = 0.2; } else tr.fricT = Math.max(0, (tr.fricT || 0) - dt);
  if (c.mode === 'card' && Math.abs(c.x - CUP.x) > CUP.w / 2 + 2 && !tr.outcome) tr.outcome = 'carried';
  const key = `${c.mode} ${tr.outcome}`;
  if (key !== tr.lastKey) { tr.lastKey = key; if (state.tab === 'coin') render(); }
}
function drawCoin(c) {
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  // Table
  ctx.fillStyle = '#c99a63'; ctx.fillRect(0, TABLE_Y, W, 18); ctx.fillStyle = '#a77a45'; ctx.fillRect(0, TABLE_Y + 18, W, H - TABLE_Y - 18);
  // The glass
  const L = sx(CUP.x - CUP.w / 2), R = sx(CUP.x + CUP.w / 2), top = sy(CUP.h);
  ctx.fillStyle = 'rgba(179, 229, 252, .35)'; ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(L - 4, top); ctx.lineTo(L + 4, TABLE_Y); ctx.lineTo(R - 4, TABLE_Y); ctx.lineTo(R + 4, top); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  // The coin (drawn before the card when it's inside the glass)
  const coin = tr.coin, cx = sx(coin.x), cy = sy(coin.y);
  const drawTheCoin = () => {
    ctx.fillStyle = '#f2c14e'; ctx.strokeStyle = '#b8892a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy - 4, COIN_D * PX / 2, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  };
  if (coin.mode === 'drop' || coin.mode === 'cup') drawTheCoin();
  // The card
  const kx = sx(tr.card - CARD_L / 2), kw = CARD_L * PX, ky = sy(CUP.h + CARD_T);
  ctx.fillStyle = '#fff3c4'; ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
  ctx.fillRect(kx, ky, kw, CARD_T * PX + 3); ctx.strokeRect(kx, ky, kw, CARD_T * PX + 3); ctx.lineWidth = 1;
  if (coin.mode !== 'drop' && coin.mode !== 'cup') drawTheCoin();
  // Friction on the coin while the card is sliding under it
  if (coin.mode === 'card' && tr.fricT > 0) forceArrow(c, cx, cy - 4, tr.fricDir * 34, 0, COL.friction, 'friction', c.surface);
  tag(c, '⇔ drag the card sideways', sx(tr.card), ky + 26, c.muted, 'center', 12, 700);
  tag(c, 'Drag the card: try a slow pull, then a quick flick', 16, 22, c.muted, 'left', 14, 700);
}

// ---------- Inertial mass ----------
const OBJ = {
  ball: { name: 'football', m: 0.45, shape: 'ball', r: 0.11, col: '#eceff1' },
  bowl: { name: 'bowling ball', m: 6, shape: 'ball', r: 0.11, col: '#37474f' },
  books: { name: 'box of books', m: 20, shape: 'box', w: 0.5, h: 0.36, col: '#ef8a3a' },
  car: { name: 'small car', m: 1000, shape: 'car', w: 3.6, h: 1.4, col: '#1e88e5' },
};
const PLACE = { earth: { name: 'on Earth', g: 9.8 }, moon: { name: 'on the Moon', g: 1.6 }, space: { name: 'in deep space', g: 0 } };
const PPM3 = 60, FLOOR3 = 290;
const im = { x: 2, v: 0, t: 0, phase: 'ready', camX: 0 };
const pushF = () => Math.max(1, Math.min(200, PK.num('pushF') || 10));
function resetMass() { Object.assign(im, { x: 2, v: 0, t: 0, phase: 'ready', camX: 0 }); if (state.tab === 'mass') render(); }
function stepMass(dt) {
  if (im.phase === 'push') {
    const a = pushF() / OBJ[pressed('obj')].m;
    const d = Math.min(dt, 1 - im.t);
    im.v += a * d; im.x += im.v * d; im.t += d;
    if (im.t >= 1) { im.phase = 'glide'; render(); }
  } else if (im.phase === 'glide') im.x += im.v * dt;
  const view = W / PPM3;
  if (im.x - im.camX > view * 0.55) im.camX = im.x - view * 0.55;
}
function drawMass(c) {
  const pl = pressed('place'), o = OBJ[pressed('obj')], inSpace = pl === 'space', ink = inSpace ? '#cfd8dc' : c.text, halo = inSpace ? '#0b1020' : c.surface;
  const floor = pl === 'moon' ? '#b0b0b0' : '#d6eef8';
  if (inSpace) space();
  else {
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = floor; ctx.fillRect(0, FLOOR3, W, H - FLOOR3);
  }
  ruler(c, im.camX, PPM3, H - 38, inSpace ? ink : '#37474f');   // along the front edge, below the weight arrow
  const x = (im.x - im.camX) * PPM3, lift = inSpace ? 30 : 0;
  let top, w, h;
  if (o.shape === 'ball') {
    const r = o.r * PPM3 * 1.6; w = 2 * r; h = 2 * r; top = FLOOR3 - h - lift;
    ctx.fillStyle = o.col; ctx.strokeStyle = inSpace ? '#b0bec5' : '#263238'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, top + r, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  } else if (o.shape === 'box') {
    w = o.w * PPM3; h = o.h * PPM3; top = FLOOR3 - h - lift;
    ctx.fillStyle = o.col; ctx.fillRect(x - w / 2, top, w, h); ctx.strokeStyle = '#a5531a'; ctx.lineWidth = 2; ctx.strokeRect(x - w / 2, top, w, h); ctx.lineWidth = 1;
  } else {
    w = o.w * PPM3; h = o.h * PPM3; top = FLOOR3 - h - lift;
    ctx.fillStyle = o.col; ctx.beginPath(); ctx.moveTo(x - w / 2, top + h * 0.85); ctx.lineTo(x - w / 2, top + h * 0.45); ctx.lineTo(x - w * 0.25, top + h * 0.4); ctx.lineTo(x - w * 0.1, top); ctx.lineTo(x + w * 0.22, top); ctx.lineTo(x + w * 0.38, top + h * 0.4); ctx.lineTo(x + w / 2, top + h * 0.48); ctx.lineTo(x + w / 2, top + h * 0.85); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#cfe8ff'; ctx.fillRect(x - w * 0.06, top + h * 0.08, w * 0.25, h * 0.28);
    ctx.fillStyle = '#263238'; for (const k of [-0.3, 0.3]) { ctx.beginPath(); ctx.arc(x + k * w, top + h * 0.85, h * 0.15, 0, Math.PI * 2); ctx.fill(); }
  }
  tag(c, `${o.m < 1 ? o.m.toFixed(2) : spaced(o.m)} kg`, x + w / 2 + 8, top + Math.min(h / 2, 12), ink, 'left', 13, 800, halo);
  if ($('forces').checked) {
    const g = PLACE[pl].g, Wt = o.m * g;
    if (g) {
      // Arrow lengths grow with the log of the force, so a car's weight still fits
      const len = 22 + Math.log10(1 + Wt) * 7, N = Wt >= 100 ? spaced(Wt) : Wt >= 10 ? Wt.toFixed(1) : Wt.toFixed(2);   // as in the panel
      forceArrow(c, x, top + h / 2, 0, len, COL.weight, `weight ${N} N`, floor);
      forceArrow(c, x, top, 0, -len, COL.normal, `normal contact force ${N} N`, halo);
    }
    if (im.phase === 'push') {
      forceArrow(c, x - w / 2 - 70, top + h / 2, 64, 0, COL.push, '', halo);
      tag(c, `push ${pushF()} N`, x - w / 2 - 38, top + h / 2 - 16, COL.push, 'center', 13, 800, halo);
    }
  }
  tag(c, im.phase === 'ready' ? 'Press “Push for 1 second”' : im.phase === 'push' ? 'Pushing…' : 'The push has stopped: it keeps moving', 16, 22, inSpace ? '#cfd8dc' : c.muted, 'left', 14, 700, halo);
  tag(c, inSpace ? 'nothing to rub against: no friction' : 'a smooth surface with no friction', 16, 44, inSpace ? '#cfd8dc' : c.muted, 'left', 12, 700, halo);
}

// ---------- Words ----------

const INTRO = {
  move: 'What happens to a moving object when you stop pushing it? Push a box across carpet, wood, ice and deep space.',
  coin: 'Objects tend to stay still, or keep moving, unless a force changes that. This is called inertia. Try the coin and card trick.',
  mass: 'Some objects are much harder to get moving than others. Push each one with the same force for 1 second.',
};
const EXPLAIN = {
  move: `<ul>
      <li><b>Newton’s first law:</b> if the resultant force on an object is zero, a stationary object stays still, and a moving object keeps moving at the same speed in the same direction.</li>
      <li>So you only need a force to <b>change</b> the velocity of an object: to start it, stop it, speed it up, slow it down or change its direction.</li>
      <li>On carpet, wood and ice, <b>friction</b> is the only horizontal force once you let go. It is a resultant force backwards, so the box slows down and stops. The smoother the surface, the smaller the friction and the further the box goes.</li>
      <li>In deep space there is no friction, no air resistance and almost no gravity. Nothing acts on the box, so it keeps moving at a constant velocity forever. The marks every half second stay equally spaced, and the speed–time graph stays flat.</li>
      <li>Weight and the normal contact force are balanced, so they don’t change the box’s motion.</li>
    </ul>`,
  coin: `<ul>
      <li><b>Inertia</b> is the tendency of an object to stay at rest, or to keep moving at a steady velocity.</li>
      <li>The only force that can move the coin sideways is friction from the card. Friction can only change the coin’s speed a little each second.</li>
      <li>A <b>quick flick</b> pulls the card away so fast that friction acts for only a tiny time. The coin hardly moves sideways, so it is left above the glass and falls in.</li>
      <li>A <b>slow pull</b> gives friction time to speed the coin up with the card, so the coin is carried away with it.</li>
      <li>The same idea is why you lurch forwards when a bus brakes suddenly, and why a magician can pull a tablecloth from under the plates.</li>
    </ul>`,
  mass: `<ul>
      <li><b>Inertial mass</b> is a measure of how difficult it is to change the velocity of an object.</li>
      <li>It is defined as the ratio of force over acceleration: inertial mass = force ÷ acceleration, from F = m a.</li>
      <li>The same push gives a heavy object a small acceleration and a light object a big one.</li>
      <li>Inertial mass doesn’t depend on gravity. On the Moon or in deep space, a bowling ball weighs less (or nothing), but it is just as hard to get moving.</li>
      <li>Once the push stops, there is no resultant force on the frictionless surface, so each object keeps moving at a steady speed: Newton’s first law.</li>
    </ul>`,
};
function render() {
  let html = '';
  if (state.tab === 'move') {
    const sf = SURF[pressed('surface')], f = friction();
    const res = mv.held ? 'your push' : mv.v !== 0 ? (f ? `${f.toFixed(1)} N backwards (friction)` : '0 N') : '0 N';
    html = `<dl class="readout"><dt>Surface</dt><dd>${sf.name}</dd><dt>Sliding friction</dt><dd>${f ? `${f.toFixed(1)} N` : 'none'}</dd><dt>Resultant force</dt><dd>${res}</dd><dt>Speed</dt><dd><b id="spd">0.00</b> m/s</dd></dl>`;
    html += {
      still: '<p>The box is still, and the forces on it are balanced, so it stays still. Drag it to push it, then let go.</p>',
      held: '<p>You’re pushing the box. Let go while it’s moving to see what it does on its own.</p>',
      slowing: '<p>Once you let go, friction is the only horizontal force on the box. It is a resultant force backwards, so the box slows down.</p>',
      steady: '<p>Once you let go, nothing acts on the box: the resultant force is zero. So it keeps moving at the same speed in the same direction, as Newton’s first law says.</p>',
      stopped: `<p>Friction stopped the box. ${pressed('surface') === 'ice' ? 'On ice the friction is tiny, so it went a long way first.' : 'Try a smoother surface: less friction means it goes further.'}</p>`,
    }[mv.status];
  } else if (state.tab === 'coin') {
    const c = tr.coin;
    html = `<dl class="readout"><dt>Where the coin is</dt><dd>${{ card: tr.slipped ? 'sliding on the card' : 'on the card', fall: 'falling', drop: 'falling into the glass', cup: 'in the glass', table: 'on the table' }[c.mode]}</dd></dl>`;
    html += {
      cup: '<p>The card was pulled away so quickly that friction only had a tiny time to act on the coin. Its inertia kept it where it was, so it dropped straight into the glass.</p>',
      carried: '<p>The card moved slowly, so friction had time to speed the coin up to the same speed as the card. The coin was carried along with it.</p>',
      table: '<p>Friction got the coin moving a little before the card came away, so it missed the glass. Try a quicker flick.</p>',
    }[tr.outcome] || '<p>Drag the card sideways, or use the buttons. A quick flick and a slow pull give different results.</p>';
  } else {
    const o = OBJ[pressed('obj')], pl = PLACE[pressed('place')], F = pushF(), a = F / o.m;
    const fmt = (x) => (x >= 100 ? spaced(x) : x >= 10 ? x.toFixed(1) : x >= 0.1 ? x.toFixed(2) : x.toPrecision(2));
    html = `<dl class="readout"><dt>Inertial mass</dt><dd>${o.m < 1 ? o.m.toFixed(2) : spaced(o.m)} kg</dd><dt>Weight ${pl.name}</dt><dd>${pl.g ? `${fmt(o.m * pl.g)} N` : '0 N'}</dd><dt>Push</dt><dd>${F} N for 1 s</dd><dt>Acceleration</dt><dd>${fmt(a)} m/s²</dd><dt>Speed after the push</dt><dd>${fmt(a)} m/s</dd></dl>`;
    html += `<p>Acceleration = force ÷ mass = ${F} ÷ ${o.m < 1 ? o.m.toFixed(2) : spaced(o.m)} = ${fmt(a)} m/s². ${pl.g ? '' : 'It has no weight here, but it is just as hard to get moving. '}Inertial mass doesn’t change from place to place; weight does.</p>`;
  }
  $('info').innerHTML = html;
}
let lastSpd = 0;
function tickSpeed() {
  const el = $('spd');
  if (!el || performance.now() - lastSpd < 100) return;
  lastSpd = performance.now();
  const t = Math.abs(mv.held ? mv.liveV || 0 : mv.v).toFixed(2);
  if (el.firstChild) el.firstChild.nodeValue = t; else el.textContent = t;
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = !el.dataset.for.split(' ').includes(t); });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = EXPLAIN[t];
  cv.setAttribute('aria-label', { move: 'A box sliding along a floor, with the forces on it', coin: 'A coin on a card on top of a glass', mass: 'An object being pushed along a frictionless surface' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === START ? location.pathname + location.search : `#${t}`);
  render();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
for (const id of ['surface', 'obj', 'place']) {
  document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll(`#${id} .chip`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (id === 'surface') { setStatus(); render(); } else resetMass();
  }));
}
$('pushF').addEventListener('input', () => { if (im.phase === 'ready') render(); });
$('forces').addEventListener('change', render);
$('push').addEventListener('click', () => { if (!mv.held) startMoving(3); });
$('reset').addEventListener('click', () => ({ move: resetMove, coin: resetCoin, mass: resetMass })[state.tab]());
$('flick').addEventListener('click', () => { resetCoin(); tr.auto = 'flick'; });
$('pull').addEventListener('click', () => { resetCoin(); tr.auto = 'pull'; });
$('push1').addEventListener('click', () => { resetMass(); im.phase = 'push'; render(); });

// Dragging: the box on the first tab, the card on the second
PK.dragOn(cv, W, H, {
  hit: (p) => {
    if (state.tab === 'move') {
      const inSpace = pressed('surface') === 'space', bx = (mv.x - mv.camX) * PPM, bw = BOX.w * PPM, bh = BOX.h * PPM, by = FLOOR - bh - (inSpace ? 26 : 0);
      if (Math.abs(p.x - bx) < bw / 2 + 14 && p.y > by - 14 && p.y < by + bh + 14) { mv.grab = p.x - bx; return 'box'; }
    }
    if (state.tab === 'coin' && !tr.auto) {
      const ky = sy(CUP.h + CARD_T);
      if (Math.abs(p.x - sx(tr.card)) < (CARD_L * PX) / 2 + 10 && p.y > ky - 26 && p.y < ky + 30) { tr.grab = p.x - sx(tr.card); tr.held = true; return 'card'; }
    }
    return null;
  },
  move: (k, p) => {
    if (k === 'box') {
      const now = performance.now(), x = mv.camX + (p.x - mv.grab) / PPM;
      mv.held = true; mv.going = false; mv.v = 0;
      mv.samples.push({ t: now, x }); while (mv.samples.length && now - mv.samples[0].t > 120) mv.samples.shift();
      const s0 = mv.samples[0];
      mv.liveV = mv.samples.length > 1 ? (x - s0.x) / Math.max(0.016, (now - s0.t) / 1000) : 0;
      mv.x = x; setStatus();
    } else if (k === 'card') tr.card = CUP.x + (p.x - tr.grab - 400) / PX;
  },
  end: (k) => {
    if (k === 'box') {
      mv.held = false;
      const s = mv.samples, now = performance.now();
      const v = s.length > 1 && now - s[s.length - 1].t < 80 ? (s[s.length - 1].x - s[0].x) / Math.max(0.016, (s[s.length - 1].t - s[0].t) / 1000) : 0;
      mv.samples = [];
      if (Math.abs(v) > 0.05) startMoving(v); else setStatus();
    } else if (k === 'card') tr.held = false;
  },
  tap: (k) => { if (k === 'card') tr.held = false; if (k === 'box') { mv.held = false; setStatus(); } },
});

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (cv.clientWidth) {
    const c = colours();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    if (state.tab === 'move') { stepMove(dt); drawMove(c); tickSpeed(); }
    else if (state.tab === 'coin') { stepCoin(dt); drawCoin(c); }
    else { stepMass(dt); drawMass(c); }
  }
  requestAnimationFrame(frame);
}

showTab(SHOWN.includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : START);
requestAnimationFrame(frame);
