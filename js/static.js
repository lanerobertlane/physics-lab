// Static electricity: charging by friction (electrons transfer), attraction and repulsion,
// and electric field lines around point charges with a draggable test charge.

PK.header({
  title: 'Static electricity & electric fields',
  answers: true,
  spec: [
    { code: '4.2.5.1', text: 'Static charge: rubbing insulators together transfers electrons; gaining electrons gives a negative charge, losing them a positive charge; like charges repel, unlike charges attract; sparks', po: true },
    { code: '4.2.5.2', text: 'Electric fields: a charged object creates a field; the field is stronger closer to the object; field patterns around an isolated charged sphere', po: true },
    { code: 'KS3', text: 'Separation of positive or negative charges when objects are rubbed together: transfer of electrons, forces between charged objects' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
function text(c, t, x, y, o = {}) { c.fillStyle = o.col || PK.cssVar('--text'); c.font = `${o.w || 700} ${o.s || 13}px ${font()}`; c.textAlign = o.a || 'center'; c.textBaseline = o.b || 'middle'; c.fillText(t, x, y); }
let tab = 'rub';

// ---------- Charging by rubbing ----------

const rc = $('rub'), rx = rc.getContext('2d');
const RW = 800, RH = 400;
const ROD = { poly: { name: 'polythene', col: '#90caf9', sign: -1 }, acetate: { name: 'acetate', col: '#ffe082', sign: 1 } };
const TRANSFER = 5;
const HOME = { x: 70, y: 200 }, NEAR = { x: 300, y: 200 }, ROD_W = 260, ROD_H = 40;
const rub = { rod: 'poly', hang: 'poly', t: 0, rubbing: false, charged: false, moved: 0, bring: 0, away: 0, angle: 0, flying: [], x: HOME.x, y: HOME.y, drag: null, near: false };

function resetRub() {
  Object.assign(rub, { t: 0, rubbing: false, charged: false, moved: 0, bring: 0, away: 0, angle: 0, flying: [], x: HOME.x, y: HOME.y, drag: null, bringing: false, near: false });
  renderRub();
}
function renderRub() {
  const r = ROD[rub.rod], h = ROD[rub.hang];
  const cloth = r.sign < 0 ? 'positive' : 'negative';
  let t = '';
  if (!rub.charged && !rub.rubbing) t = `Both the ${r.name} rod and the cloth start uncharged: they have equal numbers of positive and negative charges. Press “Rub the rod”.`;
  else if (rub.rubbing) t = 'Rubbing… electrons are being moved by friction.';
  else {
    t = r.sign < 0
      ? PK.ans(`Electrons moved from the cloth onto the polythene. The polythene now has extra electrons, so it is <b>negatively charged</b>. The cloth has lost electrons, so it is left <b>${cloth}ly charged</b>.`)
      : PK.ans(`Electrons moved from the acetate onto the cloth. The acetate has lost electrons, so it is <b>positively charged</b>. The cloth has gained electrons, so it is <b>${cloth}ly charged</b>.`);
    if (rub.near) {
      const same = r.sign === h.sign;
      t += ` ${PK.ans(same ? `<b>The hanging rod is repelled</b>: both rods have ${r.sign < 0 ? 'negative' : 'positive'} charge, and like charges repel.` : '<b>The hanging rod is attracted</b>: one rod is positive and the other negative, and unlike charges attract.')} The force acts without the rods touching: it is a non-contact force.`;
    }
  }
  $('rub-text').innerHTML = t;
  $('bring').disabled = !rub.charged;
  document.querySelectorAll('#rod .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.r === rub.rod)));
  document.querySelectorAll('#hang .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.h === rub.hang)));
}
function stepRub(dt) {
  if (rub.rubbing) {
    rub.t += dt;
    if (rub.t > 0.3 && rub.moved < TRANSFER && rub.t > 0.3 + rub.moved * 0.3) {
      rub.moved++;
      const toRod = ROD[rub.rod].sign < 0;
      rub.flying.push({ t: 0, toRod, i: rub.moved - 1 });
    }
    if (rub.t > 2.2) { rub.rubbing = false; rub.charged = true; renderRub(); }
  }
  for (const f of rub.flying) f.t = Math.min(1, f.t + dt * 2);
  // Slide towards the hanging rod when the button is pressed
  if (rub.bringing) {
    const dx = NEAR.x - rub.x, dy = NEAR.y - rub.y, d = Math.hypot(dx, dy), stepL = 300 * dt;
    if (d <= stepL) { rub.x = NEAR.x; rub.y = NEAR.y; rub.bringing = false; } else { rub.x += (dx / d) * stepL; rub.y += (dy / d) * stepL; }
  }
  // How close the rod's end is to the hanging rod, from 0 (far) to 1 (close)
  const endX = rub.x + ROD_W, endY = rub.y + ROD_H / 2;
  rub.bring = Math.max(0, Math.min(1, (230 - Math.hypot(endX - 640, endY - 229)) / 150));
  rub.away = Math.max(0, Math.min(1, Math.hypot(rub.x - HOME.x, rub.y - HOME.y) / 80));
  const near = rub.charged && rub.bring > 0.6;
  if (near !== rub.near) { rub.near = near; renderRub(); }
  // The hanging rod swings: attract (towards) or repel (away)
  const same = ROD[rub.rod].sign === ROD[rub.hang].sign;
  const want = rub.charged ? (same ? -0.32 : 0.22) * rub.bring : 0;
  rub.angle += (want - rub.angle) * Math.min(1, dt * 4);
}
function charges(c, x0, y0, w, h, nPlus, nMinus, seed) {
  const pos = (i, k) => { const a = Math.sin(i * 12.9898 + seed + k * 78.233) * 43758.5453; return a - Math.floor(a); };
  for (let i = 0; i < nPlus; i++) text(c, '+', x0 + 10 + pos(i, 1) * (w - 20), y0 + 8 + pos(i, 2) * (h - 16), { s: 15, w: 800, col: '#c62828' });
  for (let i = 0; i < nMinus; i++) text(c, '−', x0 + 10 + pos(i, 3) * (w - 20), y0 + 8 + pos(i, 4) * (h - 16), { s: 16, w: 800, col: '#1e63c6' });
}
function drawRub() {
  const k = rc.width / RW;
  rx.setTransform(k, 0, 0, k, 0, 0);
  rx.fillStyle = PK.cssVar('--surface'); rx.fillRect(0, 0, RW, RH);
  const r = ROD[rub.rod], h = ROD[rub.hang];
  const base = 8, landed = rub.flying.filter((f) => f.t >= 1).length;
  const toRod = r.sign < 0;
  // The rod being rubbed (it slides towards the hanging rod when brought close)
  const rodX = rub.x, rodY = rub.y;
  rx.fillStyle = r.col; rx.strokeStyle = '#607d8b'; rx.lineWidth = 2;
  rx.beginPath(); rx.roundRect(rodX, rodY, 260, 40, 20); rx.fill(); rx.stroke();
  charges(rx, rodX, rodY, 260, 40, base, base + (toRod ? landed : -landed), 1);
  text(rx, `${r.name} rod`, rodX + 130, rodY - 14, { s: 12 });
  // The cloth (stays behind)
  const wob = rub.rubbing ? Math.sin(rub.t * 22) * 60 : 0;
  if (rub.away < 0.3) {
    const cx = 120 + wob, cy = 235;
    rx.globalAlpha = 1 - rub.away * 3;
    rx.fillStyle = '#bcaaa4'; rx.strokeStyle = '#8d6e63'; rx.beginPath(); rx.roundRect(cx, cy, 160, 60, 10); rx.fill(); rx.stroke();
    charges(rx, cx, cy + 6, 160, 50, base, base + (toRod ? -landed : landed), 7);
    text(rx, 'cloth', cx + 80, cy + 74, { s: 12 });
    rx.globalAlpha = 1;
  }
  // Electrons in flight
  for (const f of rub.flying) {
    if (f.t >= 1) continue;
    const fromY = f.toRod ? 265 : 220, toY = f.toRod ? 220 : 265, x = 160 + f.i * 25;
    text(rx, '−', x, fromY + (toY - fromY) * f.t, { s: 20, w: 800, col: '#1e63c6' });
  }
  // The hanging rod, on a thread like a pendulum: it swings towards or away from the charged rod
  const px = 640, py = 24;
  rx.fillStyle = '#90a4ae'; rx.fillRect(px - 60, py - 8, 120, 8);
  rx.save(); rx.translate(px, py); rx.rotate(rub.angle);
  rx.strokeStyle = PK.cssVar('--muted'); rx.lineWidth = 1.5; rx.beginPath(); rx.moveTo(0, 0); rx.lineTo(0, 130); rx.stroke();
  rx.fillStyle = h.col; rx.strokeStyle = '#607d8b'; rx.lineWidth = 2;
  rx.beginPath(); rx.roundRect(-16, 130, 32, 150, 16); rx.fill(); rx.stroke();
  charges(rx, -16, 130, 32, 150, h.sign > 0 ? 9 : 4, h.sign < 0 ? 9 : 4, 3);
  rx.restore();
  text(rx, `hanging ${h.name} rod (${h.sign < 0 ? '−' : '+'})`, px, 330, { s: 12 });
  // Overall charge labels
  if (rub.charged) {
    text(rx, `rod: ${PK.ansText(r.sign < 0 ? 'negative' : 'positive')}`, rodX + 130, rodY - 34, { s: 14, w: 800, col: r.sign < 0 ? '#1e63c6' : '#c62828' });
    if (rub.away < 0.3) text(rx, `cloth: ${PK.ansText(r.sign < 0 ? 'positive' : 'negative')}`, 200, 330, { s: 14, w: 800, col: r.sign < 0 ? '#c62828' : '#1e63c6' });
  }
  if (rub.near) {
    const same = r.sign === h.sign;
    text(rx, PK.ansText(same ? 'Repel!' : 'Attract!'), 440, 120, { s: 22, w: 800, col: same ? '#c62828' : '#2e7d32' });
  }
  text(rx, '+ positive charge    − negative charge (electron)', 20, RH - 16, { a: 'left', s: 12, col: PK.cssVar('--muted') });
}

// ---------- Electric fields ----------

const fc = $('field'), fx = fc.getContext('2d');
const FW = 800, FH = 440;
const fld = { charges: [{ x: 400, y: 220, q: 1 }], add: '+', test: { x: 560, y: 150 }, drag: false };
function E(x, y) {
  let ex = 0, ey = 0;
  for (const c of fld.charges) { const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 30, r = Math.sqrt(r2); ex += (c.q * dx) / (r2 * r); ey += (c.q * dy) / (r2 * r); }
  return [ex, ey];
}
function traceLine(x, y, sign) {
  const pts = [[x, y]];
  for (let i = 0; i < 900; i++) {
    const [ex, ey] = E(x, y), m = Math.hypot(ex, ey);
    if (m === 0) break;
    x += (sign * ex / m) * 3; y += (sign * ey / m) * 3;
    pts.push([x, y]);
    if (x < -10 || x > FW + 10 || y < -10 || y > FH + 10) break;
    if (fld.charges.some((c) => c.q * sign < 0 && Math.hypot(x - c.x, y - c.y) < 14)) break;
  }
  return pts;
}
function drawField() {
  const k = fc.width / FW;
  fx.setTransform(k, 0, 0, k, 0, 0);
  fx.fillStyle = PK.cssVar('--surface'); fx.fillRect(0, 0, FW, FH);
  const pos = fld.charges.filter((c) => c.q > 0), neg = fld.charges.filter((c) => c.q < 0);
  const starts = (pos.length ? pos : neg).flatMap((c) => Array.from({ length: 14 }, (_, i) => ({ x: c.x + Math.cos((i / 14) * Math.PI * 2) * 16, y: c.y + Math.sin((i / 14) * Math.PI * 2) * 16, s: pos.length ? 1 : -1 })));
  fx.strokeStyle = '#7c3aed'; fx.lineWidth = 1.6;
  for (const st of starts) {
    const pts = traceLine(st.x, st.y, st.s);
    fx.beginPath(); pts.forEach(([x, y], i) => (i ? fx.lineTo(x, y) : fx.moveTo(x, y))); fx.stroke();
    // An arrow part way along, pointing in the field direction
    const m = pts[Math.min(pts.length - 1, 30)], m0 = pts[Math.min(pts.length - 1, 26)];
    if (m && m0 && pts.length > 32) {
      let a = Math.atan2(m[1] - m0[1], m[0] - m0[0]); if (st.s < 0) a += Math.PI;
      fx.fillStyle = '#7c3aed'; fx.save(); fx.translate(m[0], m[1]); fx.rotate(a);
      fx.beginPath(); fx.moveTo(6, 0); fx.lineTo(-5, -5); fx.lineTo(-5, 5); fx.closePath(); fx.fill(); fx.restore();
    }
  }
  for (const c of fld.charges) {
    const g = fx.createRadialGradient(c.x - 6, c.y - 6, 2, c.x, c.y, 16);
    g.addColorStop(0, c.q > 0 ? '#ff8a80' : '#90caf9'); g.addColorStop(1, c.q > 0 ? '#c62828' : '#1e63c6');
    fx.fillStyle = g; fx.beginPath(); fx.arc(c.x, c.y, 16, 0, Math.PI * 2); fx.fill();
    text(fx, c.q > 0 ? '+' : '−', c.x, c.y + 1, { s: 20, w: 800, col: '#fff' });
  }
  // Test charge and the force on it
  const T = fld.test, [ex, ey] = E(T.x, T.y), m = Math.hypot(ex, ey);
  if (m > 0 && fld.charges.length) {
    const len = Math.min(110, 10 + m * 2e6), ux = ex / m, uy = ey / m;
    fx.strokeStyle = '#2e7d32'; fx.fillStyle = '#2e7d32'; fx.lineWidth = 3;
    fx.beginPath(); fx.moveTo(T.x, T.y); fx.lineTo(T.x + ux * len, T.y + uy * len); fx.stroke();
    fx.save(); fx.translate(T.x + ux * len, T.y + uy * len); fx.rotate(Math.atan2(uy, ux)); fx.beginPath(); fx.moveTo(8, 0); fx.lineTo(-6, -6); fx.lineTo(-6, 6); fx.closePath(); fx.fill(); fx.restore();
  }
  fx.fillStyle = '#2e7d32'; fx.beginPath(); fx.arc(T.x, T.y, 8, 0, Math.PI * 2); fx.fill();
  text(fx, '+', T.x, T.y + 0.5, { s: 12, w: 800, col: '#fff' });
  text(fx, 'test charge: drag me', T.x, T.y - 18, { s: 11, col: '#2e7d32' });
  text(fx, fld.charges.length ? 'Tap to add or remove charges. Green arrow: the force on a small positive charge.' : 'Tap to add a charge.', 14, FH - 14, { a: 'left', s: 12, col: PK.cssVar('--muted') });
}
function point(e) { const r = fc.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * FW, y: ((e.clientY - r.top) / r.height) * FH }; }
fc.addEventListener('pointerdown', (e) => {
  const p = point(e);
  if (Math.hypot(p.x - fld.test.x, p.y - fld.test.y) < 18) { fld.drag = true; fc.setPointerCapture(e.pointerId); return; }
  const hit = fld.charges.findIndex((c) => Math.hypot(p.x - c.x, p.y - c.y) < 20);
  if (fld.add === 'x' || hit >= 0) { if (hit >= 0) fld.charges.splice(hit, 1); return; }
  if (fld.charges.length < 6) fld.charges.push({ x: p.x, y: p.y, q: fld.add === '+' ? 1 : -1 });
});
fc.addEventListener('pointermove', (e) => { if (fld.drag) { const p = point(e); fld.test.x = Math.max(10, Math.min(FW - 10, p.x)); fld.test.y = Math.max(10, Math.min(FH - 10, p.y)); } });
fc.addEventListener('pointerup', () => { fld.drag = false; });
const PRESETS = { pos: [[400, 220, 1]], neg: [[400, 220, -1]], pair: [[290, 220, 1], [510, 220, -1]], like: [[290, 220, 1], [510, 220, 1]] };
document.querySelectorAll('#presets .chip').forEach((b) => b.addEventListener('click', () => { fld.charges = PRESETS[b.dataset.p].map(([x, y, q]) => ({ x, y, q })); }));
document.querySelectorAll('#add .chip').forEach((b) => b.addEventListener('click', () => {
  fld.add = b.dataset.a;
  document.querySelectorAll('#add .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
}));


// ---------- Balloon ----------

let rubMode = 'rods';
const JUMPER = { x: 40, y: 110, w: 220, h: 250 }, WALL_X = 690, FLOOR = 382, BR = 44, MAX_E = 12, STICK_E = 4;
const bal = { x: 400, y: 200, vx: 0, vy: 0, drag: null, e: 0, rubbed: 0, stuck: false, fell: false, flying: [], lastX: null, idle: true };
function resetBal() { Object.assign(bal, { x: 400, y: 200, vx: 0, vy: 0, drag: null, e: 0, rubbed: 0, stuck: false, fell: false, flying: [], lastX: null, idle: true }); renderBal(); }
const overJumper = () => bal.x + BR > JUMPER.x && bal.x - BR < JUMPER.x + JUMPER.w && bal.y + BR > JUMPER.y && bal.y - BR < JUMPER.y + JUMPER.h;
function renderBal() {
  let t;
  if (bal.stuck) t = PK.ans('<b>It sticks to the wall!</b> The balloon is negatively charged. The wall isn’t charged, but the balloon repels the electrons in the wall’s surface slightly away, so the surface nearest the balloon is left slightly <b>positive</b>. Unlike charges attract, and the attraction is strong enough to hold the balloon up against its weight.');
  else if (bal.fell && bal.e < STICK_E) t = `It fell. ${bal.e ? 'There isn’t enough charge on the balloon yet' : 'The balloon isn’t charged'}, so the attraction to the wall is too weak to hold it up. Rub it on the jumper some more.`;
  else if (bal.e >= STICK_E) t = PK.ans(`Electrons have moved from the jumper onto the balloon (${bal.e} so far). The balloon has gained electrons, so it is <b>negatively charged</b>; the jumper has lost electrons, so it is <b>positively charged</b>.`) + ' Now drag the balloon to the wall and let go.';
  else if (bal.e > 0) t = `Keep rubbing… ${bal.e} electron${bal.e > 1 ? 's have' : ' has'} moved from the jumper to the balloon.`;
  else t = 'Drag the balloon back and forth over the woolly jumper to rub it.';
  $('rub-text').innerHTML = t;
}
function stepBal(dt) {
  // Electrons jumping from the jumper to the balloon
  for (const f of bal.flying) f.t = Math.min(1, f.t + dt * 2.5);
  bal.flying = bal.flying.filter((f) => f.t < 1);
  if (bal.drag || bal.stuck || bal.idle) return;
  // Falling under gravity, bouncing on the floor
  bal.vy += 600 * dt; bal.y += bal.vy * dt; bal.x += bal.vx * dt; bal.vx *= 1 - dt;
  if (bal.y + BR + 30 > FLOOR) { bal.y = FLOOR - BR - 30; bal.vy = -bal.vy * 0.35; if (Math.abs(bal.vy) < 20) bal.vy = 0; }
}
function drawBal() {
  const k = rc.width / RW;
  rx.setTransform(k, 0, 0, k, 0, 0);
  rx.fillStyle = PK.cssVar('--surface'); rx.fillRect(0, 0, RW, RH);
  rx.fillStyle = PK.cssVar('--surface-2'); rx.fillRect(0, FLOOR, RW, RH - FLOOR);
  // Woolly jumper
  const J = JUMPER;
  rx.fillStyle = '#7e57c2'; rx.beginPath(); rx.roundRect(J.x, J.y, J.w, J.h, 18); rx.fill();
  rx.strokeStyle = 'rgba(255,255,255,.18)'; rx.lineWidth = 2;
  for (let y = J.y + 14; y < J.y + J.h; y += 14) { rx.beginPath(); for (let x = J.x + 6; x < J.x + J.w - 6; x += 12) { rx.moveTo(x, y); rx.lineTo(x + 6, y - 6); rx.lineTo(x + 12, y); } rx.stroke(); }
  // Neutral pairs on the jumper, plus the positive charge left behind
  const pr = (i, n) => { const a = Math.sin(i * 91.7 + n * 13.3) * 43758.5; return a - Math.floor(a); };
  for (let i = 0; i < 10; i++) {
    const x = J.x + 20 + pr(i, 1) * (J.w - 40), y = J.y + 20 + pr(i, 2) * (J.h - 40);
    text(rx, '+', x, y, { s: 15, w: 800, col: '#ffcdd2' });
    if (i >= bal.e) text(rx, '−', x + 12, y + 2, { s: 16, w: 800, col: '#bbdefb' });
  }
  text(rx, `woolly jumper${bal.e ? ` (${PK.ansText('positive')})` : ''}`, J.x + J.w / 2, J.y + J.h + 14, { s: 12 });
  // Wall, with charges in its surface pushed by the balloon
  rx.fillStyle = '#d7ccc8'; rx.fillRect(WALL_X, 0, RW - WALL_X, FLOOR);
  rx.strokeStyle = '#bcaaa4'; rx.lineWidth = 1;
  for (let y = 20; y < FLOOR; y += 26) { rx.beginPath(); rx.moveTo(WALL_X, y); rx.lineTo(RW, y); rx.stroke(); }
  for (let y = 30; y < FLOOR - 10; y += 34) for (let x = WALL_X + 18; x < RW; x += 40) {
    const d = Math.hypot(x - bal.x, y - bal.y), push = Math.max(0, 1 - d / 160) * Math.min(1, bal.e / 6);
    text(rx, '+', x - push * 6, y, { s: 13, w: 800, col: '#c62828' });
    text(rx, '−', x + 10 + push * 10, y, { s: 14, w: 800, col: '#1e63c6' });
  }
  text(rx, 'wall', WALL_X + 55, FLOOR + 10, { s: 12 });
  // Electrons in flight
  for (const f of bal.flying) text(rx, '−', f.x0 + (bal.x - f.x0) * f.t, f.y0 + (bal.y - f.y0) * f.t, { s: 20, w: 800, col: '#1e63c6' });
  // The balloon and its string
  rx.strokeStyle = PK.cssVar('--muted'); rx.lineWidth = 1.5; rx.beginPath(); rx.moveTo(bal.x, bal.y + BR + 6);
  rx.quadraticCurveTo(bal.x - 10, bal.y + BR + 30, bal.x + 4, bal.y + BR + 60); rx.stroke();
  const g = rx.createRadialGradient(bal.x - 14, bal.y - 18, 4, bal.x, bal.y, BR + 8);
  g.addColorStop(0, '#ff8a80'); g.addColorStop(1, '#d32f2f');
  rx.fillStyle = g; rx.beginPath(); rx.ellipse(bal.x, bal.y, BR - 4, BR + 6, 0, 0, Math.PI * 2); rx.fill();
  rx.fillStyle = '#b71c1c'; rx.beginPath(); rx.moveTo(bal.x - 6, bal.y + BR + 8); rx.lineTo(bal.x + 6, bal.y + BR + 8); rx.lineTo(bal.x, bal.y + BR + 1); rx.closePath(); rx.fill();
  for (let i = 0; i < bal.e; i++) {
    const a = (i / MAX_E) * Math.PI * 2 - Math.PI / 2;
    text(rx, '−', bal.x + Math.cos(a) * 24, bal.y + Math.sin(a) * 30, { s: 17, w: 800, col: '#fff' });
  }
  if (bal.e) text(rx, `balloon (${PK.ansText('negative')})`, bal.x, bal.y - BR - 18, { s: 12 });
  if (bal.stuck) text(rx, PK.ansText('Stuck!'), bal.x - BR - 14, bal.y, { a: 'right', s: 20, w: 800, col: '#2e7d32' });
  text(rx, '− electron', 20, RH - 6, { a: 'left', b: 'bottom', s: 12, col: PK.cssVar('--muted') });
}
rc.addEventListener('pointerdown', (e) => {
  if (rubMode !== 'balloon') return;
  const p = rubPoint(e);
  if (Math.hypot(p.x - bal.x, (p.y - bal.y) * 0.85) < BR + 8) {
    bal.drag = { dx: p.x - bal.x, dy: p.y - bal.y }; bal.idle = false; bal.stuck = false; bal.fell = false; bal.vx = bal.vy = 0; bal.lastX = p.x;
    rc.setPointerCapture(e.pointerId); rc.style.cursor = 'grabbing'; renderBal();
  }
});
rc.addEventListener('pointermove', (e) => {
  if (rubMode !== 'balloon') return;
  const p = rubPoint(e);
  if (!bal.drag) { rc.style.cursor = Math.hypot(p.x - bal.x, p.y - bal.y) < BR ? 'grab' : 'default'; return; }
  bal.x = Math.max(BR, Math.min(WALL_X - BR + 4, p.x - bal.drag.dx));
  bal.y = Math.max(BR + 6, Math.min(FLOOR - BR - 30, p.y - bal.drag.dy));
  // Rubbing: moving back and forth over the jumper moves electrons onto the balloon
  if (overJumper() && bal.e < MAX_E) {
    bal.rubbed += Math.abs(p.x - bal.lastX) + 0.3 * Math.abs(e.movementY || 0);
    if (bal.rubbed > 70) {
      bal.rubbed = 0; bal.e++;
      bal.flying.push({ x0: JUMPER.x + 30 + Math.random() * (JUMPER.w - 60), y0: JUMPER.y + 30 + Math.random() * (JUMPER.h - 60), t: 0 });
      renderBal();
    }
  }
  bal.lastX = p.x;
});
const endBal = () => {
  if (rubMode !== 'balloon' || !bal.drag) return;
  bal.drag = null; rc.style.cursor = 'grab';
  const atWall = bal.x + BR >= WALL_X - 14;
  if (atWall && bal.e >= STICK_E) { bal.stuck = true; bal.x = WALL_X - BR + 4; }
  else bal.fell = true;
  renderBal();
};
rc.addEventListener('pointerup', endBal);
rc.addEventListener('pointercancel', endBal);
function setRubMode(m) {
  rubMode = m;
  document.querySelectorAll('#rub-mode .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
  const rods = m === 'rods';
  for (const id of ['do-rub', 'bring', 'reset']) $(id).hidden = !rods;
  $('bal-reset').hidden = rods;
  $('rod-choices').hidden = !rods || tab !== 'rub';
  $('bal-help').hidden = rods || tab !== 'rub';
  rc.setAttribute('aria-label', rods ? 'A rod being rubbed with a cloth, and a second charged rod hanging from a thread' : 'A balloon, a woolly jumper and a wall. Drag the balloon to rub it, then let go by the wall.');
  if (rods) renderRub(); else renderBal();
}
document.querySelectorAll('#rub-mode .chip').forEach((b) => b.addEventListener('click', () => setRubMode(b.dataset.m)));
$('bal-reset').addEventListener('click', resetBal);

// ---------- Tabs, controls and loop ----------

$('do-rub').addEventListener('click', () => { if (rub.rubbing) return; resetRub(); rub.rubbing = true; renderRub(); });
$('bring').addEventListener('click', () => { if (rub.charged) { rub.bringing = true; } });
// Grab the rod and move it
function rubPoint(e) { const r = rc.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * RW, y: ((e.clientY - r.top) / r.height) * RH }; }
rc.addEventListener('pointerdown', (e) => {
  if (rubMode !== 'rods' || rub.rubbing) return;
  const p = rubPoint(e);
  if (p.x >= rub.x - 6 && p.x <= rub.x + ROD_W + 6 && p.y >= rub.y - 10 && p.y <= rub.y + ROD_H + 10) {
    rub.drag = { dx: p.x - rub.x, dy: p.y - rub.y }; rub.bringing = false;
    rc.setPointerCapture(e.pointerId); rc.style.cursor = 'grabbing';
  }
});
rc.addEventListener('pointermove', (e) => {
  if (rubMode !== 'rods') return;
  const p = rubPoint(e);
  if (!rub.drag) { rc.style.cursor = p.x >= rub.x && p.x <= rub.x + ROD_W && p.y >= rub.y && p.y <= rub.y + ROD_H ? 'grab' : 'default'; return; }
  let x = Math.max(0, Math.min(RW - ROD_W, p.x - rub.drag.dx)), y = Math.max(40, Math.min(RH - 60, p.y - rub.drag.dy));
  // Don't let it pass through the hanging rod
  if (x + ROD_W > 605 && y + ROD_H > 145 && y < 315) x = 605 - ROD_W;
  rub.x = x; rub.y = y;
});
const endDrag = () => { if (rubMode !== 'rods') return; rub.drag = null; rc.style.cursor = 'grab'; };
rc.addEventListener('pointerup', endDrag);
rc.addEventListener('pointercancel', endDrag);
$('reset').addEventListener('click', resetRub);
document.querySelectorAll('#rod .chip').forEach((b) => b.addEventListener('click', () => { rub.rod = b.dataset.r; resetRub(); }));
document.querySelectorAll('#hang .chip').forEach((b) => b.addEventListener('click', () => { rub.hang = b.dataset.h; renderRub(); }));
function showTab(t) {
  tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-tab]').forEach((el) => { el.hidden = el.dataset.tab !== t; });
  if (typeof setRubMode === 'function') setRubMode(rubMode);
  sizeAll();
  window.history.replaceState(null, '', `#${t}`);
}
function sizeAll() { if (tab === 'rub') size(rc, RW, RH); else size(fc, FW, FH); }
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
window.addEventListener('pk-answers', () => { if (rubMode === 'rods') renderRub(); else renderBal(); });
window.addEventListener('resize', sizeAll);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (tab === 'rub') { if (rubMode === 'rods') { stepRub(dt); drawRub(); } else { stepBal(dt); drawBal(); } } else drawField();
  requestAnimationFrame(frame);
}
showTab(location.hash.slice(1) === 'field' ? 'field' : 'rub');
resetRub();
requestAnimationFrame(frame);
