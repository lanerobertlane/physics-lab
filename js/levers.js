// Levers and gears: both pass on the turning effect of a force.
// Lever: drag the pivot, load and effort along the bar; what is in the middle follows from
// where they are. Gears: the same force acts on the meshed teeth, so moment ∝ radius (teeth)
// and speed ∝ 1 ÷ teeth.

PK.header({
  title: 'Levers & gears',
  answers: true,
  spec: [
    { code: '4.5.4', text: 'Moment of a force: M = F d, where d is the perpendicular distance from the pivot', po: true },
    { code: '4.5.4', text: 'If an object is balanced, the total clockwise moment about a pivot equals the total anticlockwise moment', po: true },
    { code: '4.5.4', text: 'A simple lever and a simple gear system can both be used to transmit the rotational effects of forces', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('stage'), ctx = canvas.getContext('2d');
const W = 800, H = 400;
const fmt = (x, dp = 2) => String(parseFloat(x.toFixed(dp)));
const val = PK.num;
const state = { tab: 'lever', xP: 0.6, xL: 0.2, xE: 1.8, angle: -0.06, lockScale: null, phi: 0, spinning: true };

function colours() {
  return { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
}

function arrowLine(x0, y0, x1, y1, colour, width = 4) {
  const a = Math.atan2(y1 - y0, x1 - x0), h = 7 + width * 1.5;
  ctx.strokeStyle = ctx.fillStyle = colour; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * h * 0.7, y1 - Math.sin(a) * h * 0.7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - h * Math.cos(a - 0.5), y1 - h * Math.sin(a - 0.5));
  ctx.lineTo(x1 - h * Math.cos(a + 0.5), y1 - h * Math.sin(a + 0.5)); ctx.closePath(); ctx.fill();
  ctx.lineCap = 'butt';
}

function pill(text, x, y, c, ink) {
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = c.surface; ctx.fillRect(x - w / 2, y - 10, w, 20);
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}

// ---------- Lever ----------

const BAR = 2.4, GRID = 0.05, PX = 300, X_LEFT = 40, PY = 170, GROUND = 330, TILT = 0.06;
const LOAD_COL = '#e53935', EFFORT_COL = '#1e88e5';
const snap = (x) => Math.round(x / GRID) * GRID;
const same = (a, b) => Math.abs(a - b) < 1e-6;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function lever() {
  const L = val('load'), E = val('effort');
  const sL = state.xL - state.xP, sE = state.xE - state.xP;
  const dl = Math.abs(sL), de = Math.abs(sE);
  const mL = L * dl, mE = E * de, needed = mL / de;
  const balanced = Math.abs(mE - mL) <= Math.max(mL * 0.005, 0.01);
  return { L, E, sL, sE, dl, de, mL, mE, needed, balanced, wins: balanced ? 0 : Math.sign(mE - mL), opposite: sL * sE < 0 };
}

// Both force arrows share one scale, so they can be compared. It goes up in steps as the forces do.
const TIERS = [10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];
function tierFor(l) {
  const big = Math.max(l.L, l.needed);
  return TIERS.find((t) => t >= big) || 5000;
}
const forceScale = (l) => state.lockScale || 90 / tierFor(l);

function geom() {
  const l = lever(), a = state.angle, x0 = X_LEFT + state.xP * PX, scale = forceScale(l);
  const at = (s) => ({ x: x0 + s * PX * Math.cos(a), y: PY + s * PX * Math.sin(a) });
  const pL = at(l.sL), pE = at(l.sE);
  const loadLen = clamp(l.L * scale, 14, 100), effLen = l.E > 0 ? clamp(l.E * scale, 14, 95) : 0;
  const bw = 44 + l.L * 0.05, bh = 30 + l.L * 0.05;
  return { l, a, x0, at, pL, pE, loadLen, effLen, bw, bh, scale, gripL: pL.y + 12 + loadLen + 11, gripE: pE.y - 12 - effLen - 12 };
}

function drawGrip(x, y, colour) {
  ctx.fillStyle = colour; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
  ctx.moveTo(x - 3.5, y - 3); ctx.lineTo(x, y - 6.5); ctx.lineTo(x + 3.5, y - 3);
  ctx.moveTo(x - 3.5, y + 3); ctx.lineTo(x, y + 6.5); ctx.lineTo(x + 3.5, y + 3); ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawLever(dt, c) {
  // The load side rests on the way down; it rises when the effort has the bigger moment
  const l0 = lever(), target = l0.wins === 0 ? 0 : -l0.wins * Math.sign(l0.sL) * TILT;
  state.angle += (target - state.angle) * Math.min(1, dt * 5);
  const G = geom(), { l, x0, pL, pE, loadLen, effLen, bw, bh, a } = G;

  ctx.font = `600 14px ${c.font}`; ctx.fillStyle = c.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('Drag the pivot, the load or the effort. Pull a round handle to change a force.', 16, 10);

  // Ground and pivot
  ctx.fillStyle = c.muted; ctx.fillRect(16, GROUND, W - 32, 3);
  ctx.fillStyle = drag && drag.what === 'pivot' ? '#4b525d' : '#6b7380';
  ctx.beginPath(); ctx.moveTo(x0, PY + 4); ctx.lineTo(x0 - 36, GROUND); ctx.lineTo(x0 + 36, GROUND); ctx.closePath(); ctx.fill();

  // Bar
  ctx.save(); ctx.translate(x0, PY); ctx.rotate(a);
  ctx.fillStyle = '#c9a66b'; ctx.strokeStyle = '#6b5532'; ctx.lineWidth = 2;
  const b0 = -state.xP * PX, bLen = BAR * PX;
  ctx.fillRect(b0, -9, bLen, 18); ctx.strokeRect(b0, -9, bLen, 18);
  ctx.restore();
  ctx.fillStyle = c.text; ctx.beginPath(); ctx.arc(x0, PY, 6, 0, Math.PI * 2); ctx.fill();

  // Load: a box on the bar, with its weight acting down
  ctx.fillStyle = '#6b7380'; ctx.strokeStyle = c.text; ctx.lineWidth = 1.5;
  ctx.fillRect(pL.x - bw / 2, pL.y - 9 - bh, bw, bh); ctx.strokeRect(pL.x - bw / 2, pL.y - 9 - bh, bw, bh);
  ctx.fillStyle = '#fff'; ctx.font = `800 15px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${fmt(l.L, 1)} N`, pL.x, pL.y - 9 - bh / 2);
  arrowLine(pL.x, pL.y + 12, pL.x, pL.y + 12 + loadLen, LOAD_COL);
  ctx.fillStyle = LOAD_COL; ctx.font = `800 15px ${c.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('load', pL.x - 16, pL.y + 16 + loadLen / 2);
  drawGrip(pL.x, G.gripL, LOAD_COL);

  // Effort: on the other side of the pivot from the load it pushes down; on the same side it pulls up
  const free = pE.y - 12 - effLen;
  if (l.E > 0) {
    if (l.opposite) arrowLine(pE.x, free, pE.x, pE.y - 12, EFFORT_COL);
    else arrowLine(pE.x, pE.y - 12, pE.x, free, EFFORT_COL);
  }
  drawGrip(pE.x, G.gripE, EFFORT_COL);
  const nearEdge = pE.x > W - 150;
  ctx.fillStyle = EFFORT_COL; ctx.font = `800 15px ${c.font}`; ctx.textAlign = nearEdge ? 'right' : 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(l.E > 0 ? `effort ${fmt(l.E, 1)} N` : 'effort', pE.x + (nearEdge ? -18 : 18), G.gripE);

  // Distances from the pivot
  const dim = (s, y, col, text) => {
    const x = x0 + s * PX;
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x, y); ctx.moveTo(x0, y - 6); ctx.lineTo(x0, y + 6); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
    ctx.font = `700 14px ${c.font}`;
    pill(text, (x0 + x) / 2, y, c, col);
  };
  dim(l.sL, GROUND + 24, LOAD_COL, `${fmt(l.dl)} m`);
  dim(l.sE, GROUND + 50, EFFORT_COL, `${fmt(l.de)} m`);
}

// ---------- Dragging on the diagram ----------

let drag = null;

function logical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

// What is under the finger? Handles and arrows first, because they are the smallest targets.
function hit(p) {
  const G = geom(), { pL, pE, bw, bh, x0 } = G;
  if (Math.abs(p.x - pE.x) < 30 && p.y > G.gripE - 26 && p.y < pE.y + 22) return { what: 'effort', free: true };
  if (Math.abs(p.x - pL.x) < 30 && p.y > pL.y && p.y < G.gripL + 26) return { what: 'load', free: true };
  if (Math.abs(p.x - pL.x) < bw / 2 + 8 && p.y > pL.y - 9 - bh - 8 && p.y <= pL.y + 12) return { what: 'load', free: false };
  if (Math.abs(p.x - x0) < 46 && p.y > PY + 6 && p.y < GROUND + 16) return { what: 'pivot', free: false };
  return null;
}

const POS = { pivot: 'xP', load: 'xL', effort: 'xE' };

function moveAlong(what, metres) {
  const key = POS[what], x = clamp(snap(metres), 0.05, BAR - 0.05);
  // Two things can't share a point. The finger can pass over: this one catches up on the far side.
  const others = Object.values(POS).filter((k) => k !== key).map((k) => state[k]);
  if (others.some((o) => same(o, x)) || same(state[key], x)) return;
  state[key] = x;
  $('lever-note').textContent = '';
  renderLever();
}

function resize(what, dy) {
  const s = drag.scale;
  if (what === 'effort') {
    const tier = 90 / s, step = tier <= 50 ? 1 : tier <= 200 ? 2 : tier <= 1000 ? 5 : 10;
    PK.setNum('effort', Math.round(clamp(drag.size - dy / s, 0, 95 / s) / step) * step);
  } else {
    PK.setNum('load', Math.round(clamp(drag.size + dy / s, 10, 1000) / 10) * 10);
  }
  $('lever-note').textContent = '';
  renderLever();
}

canvas.addEventListener('pointerdown', (e) => {
  if (state.tab !== 'lever') return;
  const p = logical(e), h = hit(p);
  if (!h) return;
  const l = lever();
  const metres = (p.x - X_LEFT) / PX;
  drag = { ...h, x: p.x, y: p.y, offset: state[POS[h.what]] - metres, scale: forceScale(l), size: h.what === 'effort' ? l.E : l.L, axis: h.free ? null : 'pos' };
  state.lockScale = drag.scale;       // keep the arrows steady while a force is being changed
  canvas.setPointerCapture(e.pointerId);
  canvas.style.cursor = 'grabbing';
  e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
  if (state.tab !== 'lever') { canvas.style.cursor = ''; return; }
  const p = logical(e);
  if (!drag) { canvas.style.cursor = hit(p) ? 'grab' : ''; return; }
  const dx = p.x - drag.x, dy = p.y - drag.y;
  if (!drag.axis) {                   // up and down changes the force; sideways moves it
    if (Math.hypot(dx, dy) < 6) return;
    drag.axis = Math.abs(dy) > Math.abs(dx) ? 'size' : 'pos';
  }
  if (drag.axis === 'pos') moveAlong(drag.what, (p.x - X_LEFT) / PX + drag.offset);
  else resize(drag.what, dy);
});
function endDrag() { drag = null; state.lockScale = null; canvas.style.cursor = ''; }
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// xL, xP and xE: where the load, pivot and effort go along the bar (m)
const PRESETS = [
  ['Real-life examples…'],
  ['Crowbar lifting a paving slab', 400, 0.1, 0.2, 1.4, 'The pivot is close to the slab, so a small effort lifts it.'],
  ['Claw hammer pulling a nail', 800, 0.5, 0.55, 0.85, 'The head of the hammer is the pivot.'],
  ['See-saw with two equal people', 400, 0.2, 1.2, 2.2, 'Equal distances, so the forces have to be equal.'],
  ['Wheelbarrow', 600, 0.6, 0.2, 1.6, 'The wheel is the pivot. The load sits between the wheel and your hands.'],
  ['Nutcracker', 100, 0.45, 0.4, 0.6, 'The hinge is the pivot, and the nut is between the hinge and your hand.'],
  ['Tweezers', 10, 0.75, 0.6, 0.65, 'Your fingers are nearer the pivot than the tips are, so the tips move further.'],
  ['Fishing rod', 20, 2.1, 0.1, 0.6, 'Your top hand is the effort. A small movement there moves the tip a long way.'],
  ['Your forearm', 30, 0.85, 0.5, 0.55, 'The elbow is the pivot. Your biceps pulls with a big force, close to it.'],
];

function renderLever() {
  const l = lever();
  $('lever-work').innerHTML = `
    Moment of the load = ${fmt(l.L, 1)} N × ${fmt(l.dl)} m = <b>${PK.ans(`${fmt(l.mL)} N m`)}</b><br>
    Moment of the effort = ${fmt(l.E, 1)} N × ${fmt(l.de)} m = <b>${PK.ans(`${fmt(l.mE)} N m`)}</b><br>
    Effort needed to balance = ${PK.ans(`${fmt(l.mL)} ÷ ${fmt(l.de)} = <b>${fmt(l.needed, 1)} N</b>`)}`;
  $('lever-verdict').innerHTML = l.balanced
    ? '<span class="badge good">Balanced</span> The moments are equal, so the lever stays still.'
    : l.wins > 0
      ? '<span class="badge bad">Not balanced</span> The effort has the bigger moment, so the load rises.'
      : '<span class="badge bad">Not balanced</span> The load has the bigger moment, so the load stays down.';
  const kind = l.opposite
    ? 'The pivot is between the load and the effort, like a crowbar or a see-saw.'
    : l.dl < l.de
      ? 'The load is between the pivot and the effort, like a wheelbarrow.'
      : 'The effort is between the pivot and the load, like tweezers or your forearm.';
  const ratio = l.de / l.dl;
  const why = same(ratio, 1)
    ? 'The effort and the load are the same distance from the pivot, so the forces must be equal.'
    : ratio > 1
      ? `The effort is further from the pivot, so it can be ${PK.ans(`${fmt(ratio, 1)} times`)} smaller than the load. It has to move further, though.`
      : `The effort is closer to the pivot, so it must be ${PK.ans(`${fmt(1 / ratio, 1)} times`)} bigger than the load. In return, the load moves further and faster.`;
  $('lever-why').innerHTML = `${kind} ${why}`;
}

// ---------- Gears ----------

const TOOTH_PX = 3.6, GY = 190;
const DRIVER = '#1e88e5', DRIVEN = '#e53935', IDLER = '#7d8590', IDLER_TEETH = 14;
const CM_PER_TOOTH = 0.5, FORCE_COL = '#fbc02d';
const DEG_PER_NM = 4;      // the moment arrow: 80 N m would go most of the way round
const SPIN = 2.1;          // how fast the driver is drawn turning (rad/s); rotation speed isn't on the spec

function gearSet() {
  const N1 = val('n1'), N2 = val('n2'), M1 = val('m1'), idler = $('idler').checked;
  const list = idler
    ? [{ N: N1, name: 'Driver', col: DRIVER }, { N: IDLER_TEETH, name: 'Middle', col: IDLER }, { N: N2, name: 'Driven', col: DRIVEN }]
    : [{ N: N1, name: 'Driver', col: DRIVER }, { N: N2, name: 'Driven', col: DRIVEN }];
  const r1 = (N1 * CM_PER_TOOTH) / 100, F = M1 / r1;
  list.forEach((g, i) => {
    g.dir = i % 2 ? -1 : 1;                 // 1 = clockwise
    g.r = (g.N * CM_PER_TOOTH) / 100;       // metres
    g.M = F * g.r;
  });
  return { list, F, M1, N1, N2, idler };
}

function drawGear(x, y, N, phi, col) {
  const r = N * TOOTH_PX, tip = r + 4.5, root = r - 5.5, a = (Math.PI * 2) / N;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const t = phi + i * a;
    for (const [rad, f] of [[root, -0.5], [root, -0.27], [tip, -0.15], [tip, 0.15], [root, 0.27]]) {
      ctx.lineTo(x + rad * Math.cos(t + f * a), y + rad * Math.sin(t + f * a));
    }
  }
  ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, .35)'; ctx.lineWidth = 1.2; ctx.stroke();
  // Spoke, so the turning is easy to see
  ctx.strokeStyle = 'rgba(0, 0, 0, .25)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (root - 4) * Math.cos(phi), y + (root - 4) * Math.sin(phi)); ctx.stroke();
}

// The curved arrow on each gear: the bigger the moment, the longer and thicker it is
function drawMoment(x, y, r, M, dir) {
  const R = Math.max(25, r * 0.68), sweep = Math.min(5.7, Math.max(0.3, (M * DEG_PER_NM * Math.PI) / 180));
  const width = Math.min(r * 0.17, 3 + M * 0.12), head = width * 1.5 + 5;
  const a0 = -Math.PI / 2 - sweep / 2, a1 = -Math.PI / 2 + sweep / 2;
  const end = dir > 0 ? a1 : a0;
  const paint = (colour, extra) => {
    ctx.strokeStyle = ctx.fillStyle = colour; ctx.lineWidth = width + extra; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(x, y, R, a0, a1); ctx.stroke();
    const t = end + (dir > 0 ? Math.PI / 2 : -Math.PI / 2), hx = x + R * Math.cos(end), hy = y + R * Math.sin(end);
    const out = Math.cos(end), up = Math.sin(end), wing = head * 0.95 + extra;
    ctx.beginPath();
    ctx.moveTo(hx + (head * 1.5 + extra) * Math.cos(t), hy + (head * 1.5 + extra) * Math.sin(t));
    ctx.lineTo(hx + wing * out, hy + wing * up);
    ctx.lineTo(hx - wing * out, hy - wing * up);
    ctx.closePath(); ctx.fill();
  };
  paint('rgba(0, 0, 0, .4)', 2.5);
  paint('#fff', 0);
}

function drawHub(x, y, N, r, c) {
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, Math.max(13, Math.min(17, r * 0.34)), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, .4)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#1b1f27'; ctx.font = `800 14px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(N, x, y + 1);
}

function drawGears(dt, c) {
  const s = gearSet();
  if (state.spinning) state.phi += SPIN * dt;
  const radii = s.list.map((g) => g.N * TOOTH_PX), total = radii.reduce((a, r) => a + r * 2, 0);
  let x = (W - total) / 2, phi = state.phi, prev = null;
  const shown = PK.answersShown();
  s.list.forEach((g, i) => {
    x += radii[i];
    // Each gear's angle follows from the one before, so the teeth mesh
    if (prev) phi = Math.PI + Math.PI / g.N - (prev.phi * prev.N) / g.N;
    g.phi = phi; g.x = x; prev = g;
    drawGear(x, GY, g.N, phi, g.col);
    x += radii[i];
  });
  s.list.forEach((g, i) => {
    const r = radii[i], toRight = i === 0;
    // The radius: moment = the force at the teeth × this distance
    const edge = g.x + (toRight ? r : -r);
    ctx.strokeStyle = FORCE_COL; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(g.x, GY); ctx.lineTo(edge, GY); ctx.stroke();
    drawMoment(g.x, GY, r, g.M, g.dir);
    drawHub(g.x, GY, g.N, r, c);
    if (r >= 60) {
      ctx.font = `700 13px ${c.font}`;
      const tx = (g.x + edge) / 2 + (toRight ? 6 : -6), label = `${fmt(g.r * 100)} cm`, w = ctx.measureText(label).width + 8;
      ctx.fillStyle = 'rgba(0, 0, 0, .55)'; ctx.fillRect(tx - w / 2, GY + 6, w, 18);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, tx, GY + 15);
    }
    const y0 = GY + r + 12, known = i === 0 || shown;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = c.text; ctx.font = `800 14px ${c.font}`;
    ctx.fillText(g.name, g.x, y0);
    ctx.font = `600 13px ${c.font}`; ctx.fillStyle = c.muted;
    ctx.fillText(known ? `${fmt(g.M, 1)} N m` : '? N m', g.x, y0 + 17);
  });
  // The force is the same where the teeth meet; a bigger force gets a longer arrow
  const half = 10 + (Math.min(s.F, 400) / 400) * 46;
  for (let i = 0; i < s.list.length - 1; i++) {
    const cx = s.list[i].x + radii[i], down = s.list[i].dir > 0;
    ctx.strokeStyle = 'rgba(0, 0, 0, .35)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, GY - half); ctx.lineTo(cx, GY + half); ctx.stroke(); ctx.lineCap = 'butt';
    arrowLine(cx, GY + (down ? -half : half), cx, GY + (down ? half : -half), FORCE_COL, 5);
    ctx.font = `800 13px ${c.font}`;
    const label = shown ? `${fmt(s.F, 1)} N` : '? N', ly = GY - half - 14, w = ctx.measureText(label).width + 10;
    ctx.fillStyle = 'rgba(0, 0, 0, .6)'; ctx.fillRect(cx - w / 2, ly - 9, w, 18);
    ctx.fillStyle = '#ffe082'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, cx, ly);
  }
  ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('White arrow: the moment on each gear. Yellow: the force where the teeth meet, and each radius.', 16, 10);
}

function renderGears() {
  const s = gearSet();
  const dirName = (d) => (d > 0 ? 'clockwise' : 'anticlockwise');
  $('gear-table').innerHTML = `<table class="results"><thead><tr><th>Gear</th><th>Teeth</th><th>Radius (cm)</th><th>Moment (N m)</th></tr></thead><tbody>
    ${s.list.map((g, i) => `<tr><td>${g.name}</td><td>${g.N}</td><td>${fmt(g.r * 100)}</td><td>${i ? PK.ans(fmt(g.M, 1)) : fmt(g.M, 1)}</td></tr>`).join('')}
  </tbody></table>`;
  const r1 = s.list[0].r, last = s.list[s.list.length - 1];
  $('gear-work').innerHTML = `
    Force on the teeth = moment ÷ radius = ${fmt(s.M1, 1)} N m ÷ ${fmt(r1, 3)} m = <b>${PK.ans(`${fmt(s.F, 1)} N`)}</b><br>
    Moment on the driven gear = force × radius = ${PK.ans(`${fmt(s.F, 1)} N × ${fmt(last.r, 3)} m = <b>${fmt(last.M, 1)} N m</b>`)}`;
  const ratio = s.N2 / s.N1;
  const size_ = same(ratio, 1)
    ? 'The gears are the same size, so the moment and the speed stay the same.'
    : ratio > 1
      ? `The driven gear is bigger, so the same force has a bigger moment. The moment is ${PK.ans(`${fmt(ratio)} times`)} bigger, but the gear turns more slowly.`
      : `The driven gear is smaller, so it turns faster, but its moment is ${PK.ans(`${fmt(1 / ratio)} times`)} smaller.`;
  $('gear-why').innerHTML = `${size_} The driven gear turns ${dirName(last.dir)}. ${s.idler
    ? 'The gear in between doesn’t change the speed or the moment of the last gear. It only makes it turn the same way as the driver.'
    : 'Two meshed gears always turn in opposite directions.'}`;
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.t === t)));
  const isLever = t === 'lever';
  $('p-lever').hidden = $('p-lever-result').hidden = $('lever-bar').hidden = !isLever;
  $('p-gears').hidden = $('p-gears-result').hidden = $('gear-bar').hidden = isLever;
  if (location.hash !== '#practice') history.replaceState(null, '', isLever ? location.pathname + location.search : '#gears');
}

function renderAll() { renderLever(); renderGears(); }

document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
for (const id of ['load', 'effort']) $(id).addEventListener('input', () => { $('lever-note').textContent = ''; renderLever(); });
for (const id of ['n1', 'n2', 'm1']) $(id).addEventListener('input', renderGears);
$('idler').addEventListener('change', renderGears);
$('spin').addEventListener('click', () => { state.spinning = !state.spinning; $('spin').textContent = state.spinning ? '⏸ Pause' : '▶ Turn'; });
$('lpreset').innerHTML = PRESETS.map(([n], i) => `<option value="${i}">${n}</option>`).join('');
$('lpreset').addEventListener('change', (e) => {
  const p = PRESETS[Number(e.target.value)];
  e.target.value = '0';                // an example is a one-off action, so it isn't part of a shared link
  if (p.length < 2) return;
  const [, L, xL, xP, xE, note] = p;
  Object.assign(state, { xL, xP, xE });
  PK.setNum('load', L); PK.setNum('effort', 0);
  $('lever-note').textContent = note;
  renderLever();
});
window.addEventListener('pk-answers', renderAll);

function size() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

function draw(dt) {
  if (!canvas.clientWidth) return;
  const k = canvas.width / W, c = colours();
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  if (state.tab === 'lever') drawLever(dt, c); else drawGears(dt, c);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  draw(dt);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', size);
size();
renderAll();
showTab(PK.initialHash === '#gears' ? 'gears' : 'lever');
requestAnimationFrame(frame);

// Share: where the pivot, load and effort are on the bar (the number boxes are shared anyway)
PK.shareState = {
  get: () => ({ p: state.xP, l: state.xL, e: state.xE }),
  set: (o) => {
    const ok = [o.p, o.l, o.e].every((x) => Number(x) >= 0 && Number(x) <= BAR);
    if (ok && !same(o.p, o.l) && !same(o.p, o.e) && !same(o.l, o.e)) Object.assign(state, { xP: Number(o.p), xL: Number(o.l), xE: Number(o.e) });
    renderLever();
  },
};
