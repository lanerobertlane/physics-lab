// Static electricity: charging by friction (electrons transfer), attraction and repulsion,
// electric field lines around point charges with a draggable test charge, and a Van de Graaff
// generator with a negatively charged dome.

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
  text(rx, `${r.name} rod`, rodX + 130, rodY - 14, { s: 13 });
  // The cloth (stays behind)
  const wob = rub.rubbing ? Math.sin(rub.t * 22) * 60 : 0;
  if (rub.away < 0.3) {
    const cx = 120 + wob, cy = 235;
    rx.globalAlpha = 1 - rub.away * 3;
    rx.fillStyle = '#bcaaa4'; rx.strokeStyle = '#8d6e63'; rx.beginPath(); rx.roundRect(cx, cy, 160, 60, 10); rx.fill(); rx.stroke();
    charges(rx, cx, cy + 6, 160, 50, base, base + (toRod ? -landed : landed), 7);
    text(rx, 'cloth', cx + 80, cy + 74, { s: 13 });
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
  text(rx, `hanging ${h.name} rod (${h.sign < 0 ? '−' : '+'})`, px, 330, { s: 13 });
  // Overall charge labels
  if (rub.charged) {
    text(rx, `rod: ${PK.ansText(r.sign < 0 ? 'negative' : 'positive')}`, rodX + 130, rodY - 34, { s: 14, w: 800, col: r.sign < 0 ? '#1e63c6' : '#c62828' });
    if (rub.away < 0.3) text(rx, `cloth: ${PK.ansText(r.sign < 0 ? 'positive' : 'negative')}`, 200, 330, { s: 14, w: 800, col: r.sign < 0 ? '#c62828' : '#1e63c6' });
  }
  if (rub.near) {
    const same = r.sign === h.sign;
    text(rx, PK.ansText(same ? 'Repel!' : 'Attract!'), 440, 120, { s: 22, w: 800, col: same ? '#c62828' : '#2e7d32' });
  }
  text(rx, '+ positive charge    − negative charge (electron)', 20, RH - 16, { a: 'left', s: 13, col: PK.cssVar('--muted') });
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
  text(fx, '+', T.x, T.y + 0.5, { s: 13, w: 800, col: '#fff' });
  text(fx, 'test charge: drag me', T.x, T.y - 18, { s: 13, col: '#2e7d32' });
  text(fx, fld.charges.length ? 'Tap to add or remove charges. Green arrow: the force on a small positive charge.' : 'Tap to add a charge.', 14, FH - 14, { a: 'left', s: 13, col: PK.cssVar('--muted') });
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
  text(rx, `woolly jumper${bal.e ? ` (${PK.ansText('positive')})` : ''}`, J.x + J.w / 2, J.y + J.h + 14, { s: 13 });
  // Wall, with charges in its surface pushed by the balloon
  rx.fillStyle = '#d7ccc8'; rx.fillRect(WALL_X, 0, RW - WALL_X, FLOOR);
  rx.strokeStyle = '#bcaaa4'; rx.lineWidth = 1;
  for (let y = 20; y < FLOOR; y += 26) { rx.beginPath(); rx.moveTo(WALL_X, y); rx.lineTo(RW, y); rx.stroke(); }
  for (let y = 30; y < FLOOR - 10; y += 34) for (let x = WALL_X + 18; x < RW; x += 40) {
    const d = Math.hypot(x - bal.x, y - bal.y), push = Math.max(0, 1 - d / 160) * Math.min(1, bal.e / 6);
    text(rx, '+', x - push * 6, y, { s: 13, w: 800, col: '#c62828' });
    text(rx, '−', x + 10 + push * 10, y, { s: 14, w: 800, col: '#1e63c6' });
  }
  text(rx, 'wall', WALL_X + 55, FLOOR + 10, { s: 13 });
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
  if (bal.e) text(rx, `balloon (${PK.ansText('negative')})`, bal.x, bal.y - BR - 18, { s: 13 });
  if (bal.stuck) text(rx, PK.ansText('Stuck!'), bal.x - BR - 14, bal.y, { a: 'right', s: 20, w: 800, col: '#2e7d32' });
  text(rx, '− electron', 20, RH - 6, { a: 'left', b: 'bottom', s: 13, col: PK.cssVar('--muted') });
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

// ---------- Van de Graaff generator ----------
// A rubber belt rubs against the bottom roller, which moves electrons onto it. The belt carries them
// up to a metal comb, which passes them to the dome, so the dome becomes negatively charged. V is how
// charged the dome is, from 0 to 1. A person touching it shares the charge, and an earthed sphere
// brought close enough makes a spark.

const vc = $('vdg'), vx = vc.getContext('2d');
const VW = 800, VH = 440, VFLOOR = 410;
const DOME = { x: 360, y: 150, r: 70 }, SPH_R = 24, GMAX = 115, TOUCH_X = 215, ARM = 64;
const vdg = { on: false, V: 0, Vp: 0, belt: 0, px: 80, s: { x: 640, y: 160 }, sparkAt: -1e9, drainAt: -1e9, path: null, movedP: false, movedS: false };
const touching = () => vdg.px >= TOUCH_X - 0.5;
const sphereGap = () => Math.hypot(vdg.s.x - DOME.x, vdg.s.y - DOME.y) - DOME.r - SPH_R;

// The crack of a spark (it needs a tap first before a browser will play sound)
let audio = null;
function ensureAudio() {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch { audio = null; }
}
function crack(level) {
  if (!audio) return;
  const n = Math.round(audio.sampleRate * 0.05), buf = audio.createBuffer(1, n, audio.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.12));
  const s = audio.createBufferSource(), g = audio.createGain(), f = audio.createBiquadFilter();
  s.buffer = buf; g.gain.value = level; f.type = 'highpass'; f.frequency.value = 1800;
  s.connect(f); f.connect(g); g.connect(audio.destination); s.start();
}

function spark(now) {
  const ux = (vdg.s.x - DOME.x), uy = (vdg.s.y - DOME.y), d = Math.hypot(ux, uy), u = [ux / d, uy / d];
  const a = [DOME.x + u[0] * DOME.r, DOME.y + u[1] * DOME.r], b = [vdg.s.x - u[0] * SPH_R, vdg.s.y - u[1] * SPH_R];
  const gap = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(4, Math.round(gap / 12)), pts = [a];
  for (let i = 1; i < n; i++) { const f = i / n, off = (Math.random() - 0.5) * 18; pts.push([a[0] + (b[0] - a[0]) * f - u[1] * off, a[1] + (b[1] - a[1]) * f + u[0] * off]); }
  pts.push(b);
  crack(0.25 + 0.5 * vdg.V);
  vdg.path = pts; vdg.sparkAt = now;
  vdg.V = 0.02; if (touching()) vdg.Vp = 0.02;
}
function stepVdg(dt, now) {
  if (vdg.on) vdg.belt = (vdg.belt + dt * 70) % 24;
  // The person shares the dome's charge while touching it, so it builds up more slowly
  const C = touching() ? 1.6 : 1;
  if (vdg.on) vdg.V += ((0.45 * (1 - vdg.V)) / C) * dt;
  else vdg.V *= Math.exp(-dt / 40);   // the charge slowly leaks away into the air
  if (touching()) vdg.Vp = vdg.V;
  else if (onMat()) vdg.Vp *= Math.exp(-dt / 40);
  else {   // on the floor the person is earthed, so their charge flows away into the ground
    if (vdg.Vp > 0.1 && now - vdg.drainAt > 900) vdg.drainAt = now;
    vdg.Vp *= Math.exp(-dt / 0.15);
  }
  // A spark when the field in the gap is strong enough: more charge, or a smaller gap
  if (vdg.V > 0.06 && sphereGap() < vdg.V * GMAX && now - vdg.sparkAt > 120) spark(now);
}

// The field of the dome (a negative charge at its centre) and the positive charge it pulls onto the
// earthed sphere (modelled as an image charge inside the sphere)
function vdgE(x, y) {
  const q = -vdg.V * DOME.r, d = Math.hypot(vdg.s.x - DOME.x, vdg.s.y - DOME.y), ux = (DOME.x - vdg.s.x) / d, uy = (DOME.y - vdg.s.y) / d;
  const qi = (-q * SPH_R) / d, ix = vdg.s.x + ux * ((SPH_R * SPH_R) / d), iy = vdg.s.y + uy * ((SPH_R * SPH_R) / d);
  let ex = 0, ey = 0;
  for (const [cq, cx, cy] of [[q, DOME.x, DOME.y], [qi, ix, iy]]) { const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy + 30, r = Math.sqrt(r2); ex += (cq * dx) / (r2 * r); ey += (cq * dy) / (r2 * r); }
  return [ex, ey];
}
function drawVdgField() {
  if (vdg.V < 0.05) return;
  const c = vx, col = '#7c3aed';
  c.globalAlpha = Math.min(1, vdg.V * 2.5); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.6;
  for (let i = 0; i < 18; i++) {
    const a0 = (i / 18) * Math.PI * 2 + 0.17;
    let x = DOME.x + Math.cos(a0) * (DOME.r + 3), y = DOME.y + Math.sin(a0) * (DOME.r + 3);
    const pts = [[x, y]];
    // Followed outwards from the dome, against the field, until it reaches the sphere or the edge
    for (let k = 0; k < 260; k++) {
      const [ex, ey] = vdgE(x, y), m = Math.hypot(ex, ey);
      if (!m) break;
      x -= (ex / m) * 4; y -= (ey / m) * 4; pts.push([x, y]);
      if (x < -10 || x > VW + 10 || y < -10 || y > VFLOOR || Math.hypot(x - vdg.s.x, y - vdg.s.y) < SPH_R) break;
    }
    c.beginPath(); pts.forEach(([px, py], n) => (n ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke();
    // An arrow pointing the way the field acts: towards the negative dome
    if (pts.length > 14) {
      const [x1, y1] = pts[12], [x0, y0] = pts[8], ang = Math.atan2(y0 - y1, x0 - x1);
      c.save(); c.translate(x0, y0); c.rotate(ang); c.beginPath(); c.moveTo(6, 0); c.lineTo(-5, -5); c.lineTo(-5, 5); c.closePath(); c.fill(); c.restore();
    }
  }
  c.globalAlpha = 1;
}
function vPill(s, x, y) {
  const c = vx;
  c.font = `800 14px ${font()}`;
  const w = c.measureText(s).width + 18, left = Math.max(6, Math.min(VW - w - 6, x - w / 2));
  c.fillStyle = PK.cssVar('--accent-soft'); c.beginPath(); c.roundRect(left, y - 13, w, 26, 8); c.fill();
  text(c, s, left + w / 2, y + 1, { s: 14, w: 800, col: PK.cssVar('--text') });
}
// A label with the background behind it, so it can be read over the field lines
function tag(s, x, y, col, size = 13) {
  const c = vx;
  c.font = `800 ${size}px ${font()}`;
  const w = c.measureText(s).width + 10;
  c.fillStyle = PK.cssVar('--surface'); c.globalAlpha = 0.9; c.fillRect(x - w / 2, y - size / 2 - 3, w, size + 6); c.globalAlpha = 1;
  text(c, s, x, y, { s: size, w: 800, col });
}
// The insulating mat stays put. On it the person keeps their charge; off it, standing on the
// floor, they are earthed and the charge flows through them into the ground.
const MAT = { x1: 150, x2: 280 }, MAT_TOP = 400;
const onMat = () => vdg.px >= MAT.x1 + 14;
function arrowTip(c, x, y, ux, uy) {
  c.beginPath(); c.moveTo(x + ux * 5, y + uy * 5); c.lineTo(x - uy * 4, y + ux * 4); c.lineTo(x + uy * 4, y - ux * 4); c.closePath(); c.fill();
}
function drawPerson(now) {
  const c = vx, x = vdg.px, drop = onMat() ? 0 : VFLOOR - MAT_TOP, len = 28;
  const feet = MAT_TOP + drop, hip = 334 + drop, sh = 288 + drop, hy = 258 + drop, hr = 21;
  c.fillStyle = '#37474f'; c.fillRect(MAT.x1, MAT_TOP, MAT.x2 - MAT.x1, VFLOOR - MAT_TOP);
  text(c, 'insulating mat', (MAT.x1 + MAT.x2) / 2, VFLOOR + 15, { s: 12, col: PK.cssVar('--muted') });
  c.strokeStyle = '#20262e'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, hy + hr); c.lineTo(x, hip);
  c.moveTo(x, hip); c.lineTo(x - 13, feet); c.moveTo(x, hip); c.lineTo(x + 13, feet);
  c.moveTo(x, sh); c.lineTo(x - 20, sh + 50);
  if (touching()) {
    // The arm reaches up to the nearest point on the dome
    const dx = x - DOME.x, dy = sh - DOME.y, d = Math.hypot(dx, dy), hx = DOME.x + (dx / d) * DOME.r, hyy = DOME.y + (dy / d) * DOME.r;
    const L = Math.min(Math.hypot(hx - x, hyy - sh), 2 * ARM - 1), mx = (x + hx) / 2, my = (sh + hyy) / 2, h = Math.sqrt(ARM * ARM - (L / 2) ** 2);
    const nx = -(hyy - sh) / L, ny = (hx - x) / L, ex = mx + nx * h * (ny > 0 ? 1 : -1), ey = my + ny * h * (ny > 0 ? 1 : -1);
    c.moveTo(x, sh); c.lineTo(ex, ey); c.lineTo(hx, hyy);
  } else { c.moveTo(x, sh); c.lineTo(x + 20, sh + 50); }
  c.stroke();
  c.fillStyle = PK.cssVar('--surface'); c.beginPath(); c.arc(x, hy, hr, 0, Math.PI * 2); c.fill(); c.stroke();
  // Hair: lying flat when uncharged, standing on end when charged
  const up = Math.max(0, Math.min(1, vdg.Vp * 1.3)), tips = [];
  c.strokeStyle = '#5d4037'; c.lineWidth = 2.5;
  for (let i = 0; i < 10; i++) {
    const phi = -Math.PI + ((i + 0.5) * Math.PI) / 10, rx0 = x + Math.cos(phi) * hr, ry0 = hy + Math.sin(phi) * hr;
    const flat = phi < -Math.PI / 2 ? phi - Math.PI / 2 : phi + Math.PI / 2, dir = flat + (phi - flat) * up;
    const tx = rx0 + Math.cos(dir) * len, ty = ry0 + Math.sin(dir) * len;
    c.beginPath(); c.moveTo(rx0, ry0);
    c.quadraticCurveTo(rx0 + Math.cos(phi) * len * 0.45, ry0 + Math.sin(phi) * len * 0.45, tx, ty);
    c.stroke();
    tips.push({ x: tx + Math.cos(dir) * 9, y: ty + Math.sin(dir) * 9 });
  }
  c.lineCap = 'butt';
  // Every hair has the same negative charge, so neighbouring hairs push each other apart
  if (vdg.Vp > 0.15) {
    const charged = tips.filter((_, i) => i % 2 === 0);
    for (const t of charged) text(c, '−', t.x, t.y, { s: 19, w: 900, col: '#1e63c6' });
    if (vdg.Vp > 0.3) {
      c.strokeStyle = '#e65100'; c.fillStyle = '#e65100'; c.lineWidth = 2.5;
      for (let i = 0; i + 1 < charged.length; i++) {
        const a = charged[i], b = charged[i + 1], d = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, half = Math.max(3, Math.min(8, d / 2 - 8));
        c.beginPath(); c.moveTo(mx - ux * half, my - uy * half); c.lineTo(mx + ux * half, my + uy * half); c.stroke();
        arrowTip(c, mx + ux * half, my + uy * half, ux, uy); arrowTip(c, mx - ux * half, my - uy * half, -ux, -uy);
      }
      tag('like charges repel', x, hy - hr - len - 28, '#e65100');
    }
  }
  if (vdg.Vp > 0.1) tag(`person: ${PK.ansText('negative')}`, x, hy - hr - len - (vdg.Vp > 0.3 ? 50 : 28), '#1e63c6');
  // Stepping off the mat: electrons flow down through their feet into the ground
  const age = now - vdg.drainAt;
  if (age >= 0 && age < 900) {
    for (let i = 0; i < 4; i++) { const f = (age / 900 + i * 0.25) % 1, side = i % 2 ? 1 : -1; text(c, '−', x + side * (8 + 13 * f), hip + (feet - hip) * f, { s: 16, w: 800, col: '#1e63c6' }); }
  }
  if (age >= 0 && age < 2500) tag('to earth ↓', x + 56, VFLOOR - 12, '#1e63c6');
}
function drawVdg(now) {
  const c = vx, k = vc.width / VW;
  c.setTransform(k, 0, 0, k, 0, 0);
  c.fillStyle = PK.cssVar('--surface'); c.fillRect(0, 0, VW, VH);
  c.fillStyle = PK.cssVar('--surface-2'); c.fillRect(0, VFLOOR, VW, VH - VFLOOR);
  if ($('vdg-field').checked) drawVdgField();

  // Base, motor, column, belt and rollers
  c.fillStyle = '#455a64'; c.beginPath(); c.roundRect(300, 360, 120, 50, 8); c.fill();
  c.fillStyle = vdg.on ? '#66bb6a' : '#90a4ae'; c.beginPath(); c.arc(404, 374, 6, 0, Math.PI * 2); c.fill();
  text(c, vdg.on ? 'motor on' : 'motor off', 352, 390, { s: 13, w: 800, col: '#fff' });
  c.fillStyle = 'rgba(144, 202, 249, .25)'; c.strokeStyle = '#90a4ae'; c.lineWidth = 1.5;
  c.fillRect(338, 205, 44, 155); c.strokeRect(338, 205, 44, 155);
  c.strokeStyle = '#6d4c41'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(349, 214); c.lineTo(349, 356); c.moveTo(371, 214); c.lineTo(371, 356); c.stroke();
  for (const y of [214, 356]) { c.fillStyle = '#cfd8dc'; c.strokeStyle = '#78909c'; c.lineWidth = 1.5; c.beginPath(); c.arc(360, y, 11, 0, Math.PI * 2); c.fill(); c.stroke(); }
  text(c, '+', 360, 357, { s: 13, w: 800, col: '#c62828' });
  if (vdg.on) for (let i = 0; i < 6; i++) { const y = 352 - ((i * 24 + vdg.belt) % 134); text(c, '−', 341, y, { s: 15, w: 800, col: '#1e63c6' }); }

  // The metal dome, with the comb and top roller seen through it
  const g = c.createRadialGradient(DOME.x - 22, DOME.y - 26, 6, DOME.x, DOME.y, DOME.r);
  g.addColorStop(0, '#f5f7f8'); g.addColorStop(1, '#90a4ae');
  c.fillStyle = g; c.beginPath(); c.arc(DOME.x, DOME.y, DOME.r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#78909c'; c.lineWidth = 2; c.stroke();
  c.globalAlpha = 0.55; c.strokeStyle = '#37474f'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(360, 214, 11, Math.PI, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(326, 205); c.lineTo(326, 222);
  for (let y = 207; y <= 221; y += 4) { c.moveTo(326, y); c.lineTo(344, y); }
  c.stroke(); c.globalAlpha = 1;
  const n = Math.round(vdg.V * 24);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; text(c, '−', DOME.x + Math.cos(a) * (DOME.r - 11), DOME.y + Math.sin(a) * (DOME.r - 11), { s: 17, w: 800, col: '#1e63c6' }); }
  if (vdg.V > 0.1) tag(`dome: ${PK.ansText('negative')}`, DOME.x, DOME.y - DOME.r - 14, '#1e63c6', 14);

  // The earthed sphere, on an insulating handle, with a wire to earth
  const s = vdg.s, ex = s.x + 56;
  c.strokeStyle = '#2e7d32'; c.lineWidth = 3; c.beginPath(); c.moveTo(s.x, s.y + SPH_R); c.bezierCurveTo(s.x, s.y + 90, ex, VFLOOR - 80, ex, VFLOOR - 14); c.stroke();
  c.strokeStyle = '#fbc02d'; c.setLineDash([7, 7]); c.stroke(); c.setLineDash([]);
  c.strokeStyle = PK.cssVar('--text'); c.lineWidth = 2;
  for (const [w, y] of [[22, VFLOOR - 14], [14, VFLOOR - 8], [6, VFLOOR - 2]]) { c.beginPath(); c.moveTo(ex - w / 2, y); c.lineTo(ex + w / 2, y); c.stroke(); }
  c.strokeStyle = '#8d6e63'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(s.x + 14, s.y + 14); c.lineTo(s.x + 70, s.y + 70); c.stroke(); c.lineCap = 'butt';
  const sg = c.createRadialGradient(s.x - 8, s.y - 9, 3, s.x, s.y, SPH_R);
  sg.addColorStop(0, '#f5f7f8'); sg.addColorStop(1, '#90a4ae');
  c.fillStyle = sg; c.beginPath(); c.arc(s.x, s.y, SPH_R, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#78909c'; c.lineWidth = 2; c.stroke();
  tag('earthed sphere', s.x, s.y - SPH_R - 12, PK.cssVar('--muted'));

  drawPerson(now);

  // The spark
  if (vdg.path && now - vdg.sparkAt < 200) {
    c.lineJoin = 'round';
    for (const [w, col] of [[11, 'rgba(110, 150, 255, .4)'], [4, '#3b5bdb'], [1.5, '#ffffff']]) {   // seen on light and dark backgrounds
      c.strokeStyle = col; c.lineWidth = w; c.beginPath(); vdg.path.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke();
    }
  }

  if (!vdg.movedP) vPill('Drag the person to the dome', Math.max(150, vdg.px + 40), 200);
  if (!vdg.movedS) vPill('Drag the sphere close to the dome', s.x, s.y + SPH_R + 26);
  text(c, '− electron    + positive charge', VW - 14, VH - 14, { a: 'right', s: 13, col: PK.cssVar('--muted') });
}
function vdgStatus(now) {
  if (now - vdg.sparkAt < 2500) return PK.ans('<b>Crack!</b> The electric field between the dome and the earthed sphere got strong enough to pull electrons off air particles. That let electrons jump across the gap and away to earth: a <b>spark</b>.') + (vdg.on ? ' The motor is still running, so the dome charges up again.' : '');
  if (now - vdg.drainAt < 3000) return PK.ans('The person stepped off the mat onto the floor. Their charge flowed down through them into the ground, to <b>earth</b>, so they aren’t charged any more and their hair falls flat.');
  if (touching() && vdg.V > 0.2) return PK.ans('Electrons spread from the dome onto the person and into every hair. Each hair has the same negative charge, so the hairs repel each other and stand on end.') + ' The insulating mat stops the charge flowing away to earth through their feet.';
  if (!touching() && vdg.Vp > 0.2) return PK.ans('The person keeps their charge after letting go, because the mat stops it flowing away to earth. Their hair stays up.') + ' Drag them off the mat to see what happens.';
  if (vdg.on && vdg.V < 0.9) return PK.ans('The belt is carrying electrons up to the dome, so the dome is gaining electrons and becoming <b>negatively charged</b>.');
  if (vdg.V >= 0.2) return PK.ans('The dome has a large <b>negative</b> charge: lots of extra electrons, spread over the outside of the metal.') + ' Bring the earthed sphere close to make a spark, or drag the person to the dome.';
  return 'Turn the motor on. The belt rubs on the bottom roller and starts carrying electrons up to the dome.';
}
function setMotor(on) {
  vdg.on = on;
  $('motor').textContent = on ? '⏸ Turn the motor off' : '▶ Turn the motor on';
  $('motor').classList.toggle('primary', !on);
}
function resetVdg() {
  Object.assign(vdg, { V: 0, Vp: 0, belt: 0, px: 80, s: { x: 640, y: 160 }, sparkAt: -1e9, drainAt: -1e9, path: null, movedP: false, movedS: false });
  setMotor(false);
}
$('motor').addEventListener('click', () => { ensureAudio(); setMotor(!vdg.on); });
$('vdg-reset').addEventListener('click', resetVdg);
vc.addEventListener('pointerdown', ensureAudio);
PK.dragOn(vc, VW, VH, {
  hit: (p) => {
    if (Math.hypot(p.x - vdg.s.x, p.y - vdg.s.y) < SPH_R + 10) return { what: 'sphere', dx: vdg.s.x - p.x, dy: vdg.s.y - p.y };
    if (Math.abs(p.x - vdg.px) < 40 && p.y > 230 && p.y < VFLOOR) return { what: 'person', dx: vdg.px - p.x };
    if (p.x > 300 && p.x < 420 && p.y > 360 && p.y < VFLOOR) return { what: 'motor' };
    return null;
  },
  move: (d, p) => {
    if (d.what === 'sphere') {
      let x = Math.max(30, Math.min(VW - 80, p.x + d.dx)), y = Math.max(30, Math.min(320, p.y + d.dy));
      const dx = x - DOME.x, dy = y - DOME.y, r = Math.hypot(dx, dy) || 1, min = DOME.r + SPH_R + 3;
      if (r < min) { x = DOME.x + (dx / r) * min; y = DOME.y + (dy / r) * min; }
      vdg.s = { x, y }; vdg.movedS = true;
    } else if (d.what === 'person') {
      const was = touching();
      let x = Math.max(50, Math.min(TOUCH_X, p.x + d.dx));
      if (x > MAT.x1 - 20 && x < MAT.x1 + 14) x = x < MAT.x1 - 3 ? MAT.x1 - 20 : MAT.x1 + 14;   // clearly on the mat or clearly off it
      if (x > TOUCH_X - 14) x = TOUCH_X;
      vdg.px = x; vdg.movedP = true;
      // Touching shares out the charge between the dome and the person
      if (touching() && !was) { const v = (vdg.V + 0.6 * vdg.Vp) / 1.6; vdg.V = v; vdg.Vp = v; }
    }
  },
  tap: (d) => { if (d.what === 'motor') { ensureAudio(); setMotor(!vdg.on); } },
});

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
function sizeAll() { if (tab === 'rub') size(rc, RW, RH); else if (tab === 'field') size(fc, FW, FH); else size(vc, VW, VH); }
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
window.addEventListener('pk-answers', () => { if (rubMode === 'rods') renderRub(); else renderBal(); });
window.addEventListener('resize', sizeAll);

let last = performance.now(), lastVdg = '';
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  stepVdg(dt, now);   // keeps charging (or leaking away) on the other tabs too
  if (tab === 'rub') { if (rubMode === 'rods') { stepRub(dt); drawRub(); } else { stepBal(dt); drawBal(); } }
  else if (tab === 'field') drawField();
  else { drawVdg(now); const s = vdgStatus(now); if (s !== lastVdg) { lastVdg = s; $('vdg-text').innerHTML = s; } }
  requestAnimationFrame(frame);
}
showTab(['field', 'vdg'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'rub');
resetRub();
requestAnimationFrame(frame);

// Share: the Van de Graaff set-up (the tab and tick box are shared anyway)
PK.shareState = {
  get: () => ({ g: [vdg.on ? 1 : 0, Number(vdg.V.toFixed(3)), Number(vdg.Vp.toFixed(3)), Math.round(vdg.px), Math.round(vdg.s.x), Math.round(vdg.s.y)] }),
  set: (o) => {
    if (!Array.isArray(o.g)) return;
    const [on, V, Vp, px, sx, sy] = o.g.map(Number), ok = (v, a, b, d) => (Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d);
    Object.assign(vdg, { V: ok(V, 0, 1, 0), Vp: ok(Vp, 0, 1, 0), px: ok(px, 50, TOUCH_X, 80), s: { x: ok(sx, 30, VW - 80, 640), y: ok(sy, 30, 320, 160) }, movedP: true, movedS: true });
    setMotor(Boolean(on));
  },
};
