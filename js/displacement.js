// Distance, displacement, speed and velocity: journeys with bends on a map, each drawn on a
// distance–time graph. The Higher tab finds the speed at an instant from a tangent to a curved
// distance–time graph. Map maths uses x = east, y = north, in metres.

PK.header({
  title: 'Distance, displacement, speed & velocity',
  answers: true,
  spec: [
    { code: '4.5.1.1', text: 'Scalar and vector quantities' },
    { code: '4.5.6.1.1', text: 'Distance is a scalar. Displacement is a vector: a distance in a straight line from the start, and its direction' },
    { code: '4.5.6.1.2', text: 'Speed is a scalar. Distance travelled = speed × time' },
    { code: '4.5.6.1.3', text: 'Velocity is speed in a given direction, a vector' },
    { code: '4.5.6.1.3', text: 'Motion in a circle: a constant speed but a changing velocity', ht: true },
    { code: '4.5.6.1.4', text: 'Speed from the gradient of a distance–time graph' },
    { code: '4.5.6.1.4', text: 'The speed at an instant from the gradient of a tangent to a curved distance–time graph', ht: true },
  ],
});

const $ = (id) => document.getElementById(id);
const scene = $('scene'), ctx = scene.getContext('2d'), graph = $('graph'), g = graph.getContext('2d');
const RAD = Math.PI / 180;
const SW = 560, GW = 560;
const SIZE = { journey: { SH: 320, GH: 330 }, tangent: { SH: 150, GH: 400 } };
const fmt = (x, dp = 1) => String(parseFloat(x.toFixed(dp)));
const f1 = (x) => x.toFixed(1);
const DIST = '#1e88e5', VEL = '#2e9e4f', TRI = '#f57c00';
const disp = () => PK.cssVar('--resultant');

// ---------- Paths: points with the distance along the route to each one ----------

function makePath(start, steps) {
  const pts = [{ x: start[0], y: start[1], s: 0 }];
  const add = (x, y) => { const p = pts[pts.length - 1]; const d = Math.hypot(x - p.x, y - p.y); if (d > 1e-9) pts.push({ x, y, s: p.s + d }); };
  for (const st of steps) {
    if (st.to) add(st.to[0], st.to[1]);
    else {
      const [cx, cy, r, a0, a1] = st.arc, n = Math.ceil(Math.abs(a1 - a0) / 3);
      for (let i = 1; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * RAD; add(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
    }
  }
  return { pts, L: pts[pts.length - 1].s };
}

// Where you are, and which way you're heading, a distance s along the path
function along(path, s) {
  const { pts, L } = path;
  if (pts.length < 2) return { x: pts[0] ? pts[0].x : 0, y: pts[0] ? pts[0].y : 0, dx: 1, dy: 0 };
  s = Math.max(0, Math.min(L, s));
  let i = 0;
  while (i < pts.length - 2 && pts[i + 1].s < s) i++;
  const a = pts[i], b = pts[i + 1], f = (s - a.s) / (b.s - a.s), len = b.s - a.s;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len };
}

const R = 100 / Math.PI;   // a 400 m track: two 100 m straights and two 100 m bends
const ROUTES = [
  { id: 'shop', who: '🚶', v: 1.5, start: [0, 0], steps: [{ to: [40, 0] }, { to: [40, 60] }, { to: [80, 60] }], box: [-10, 90, -10, 70],
    labels: [['Home', 0, 0, 'below'], ['Shop', 80, 60, 'right']],
    note: 'Walk 40 m east, 60 m north, then 40 m east to the shop, at 1.5 m/s.',
    work: 'Altogether you went 80 m east and 60 m north. Pythagoras: √(80² + 60²) = 100 m.' },
  { id: 'track', who: '🏃', v: 5, start: [0, 0], steps: [{ to: [100, 0] }, { arc: [100, R, R, -90, 90] }, { to: [0, 2 * R] }, { arc: [0, R, R, 90, 270] }],
    box: [-R - 8, 100 + R + 8, -9, 2 * R + 9], labels: [['Start and finish', 0, 0, 'below']], track: true,
    note: 'Run one 400 m lap of a running track at 5 m/s. Where do you finish?',
    work: 'You finish exactly where you started, so the displacement is 0.' },
  { id: 'back', who: '🐕', v: 4, start: [0, 0], steps: [{ to: [50, 0] }, { to: [20, 0] }], box: [-10, 60, -16, 14], ball: true,
    labels: [['Start', 0, 0, 'below']],
    note: 'A dog runs 50 m east to fetch a ball, then 30 m back west, at 4 m/s.',
    work: 'It went 50 m east, then 30 m back west: 50 − 30 = 20 m east of the start.' },
  { id: 'round', who: 'car', v: 10, start: [0, -20], steps: [{ arc: [0, 0, 20, -90, -450] }], box: [-30, 30, -30, 30], roundabout: true,
    labels: [['Start', 0, -20, 'below']],
    note: 'A car goes once round a roundabout at a steady 10 m/s. Higher: its speed never changes, but its velocity keeps changing, because its direction does.',
    work: 'The car finishes where it started, so the displacement is 0.' },
  { id: 'own', who: '🚶', v: 1.5, box: [-5, 105, -5, 65], own: true,
    note: 'Tap the map to add corners to your route (up to 8). You walk it at 1.5 m/s.' },
];

// ---------- Tangent journeys ----------

const SPRINT = 100 / (10 - 1.3 * (1 - Math.exp(-10 / 1.3)));   // top speed that makes 100 m in 10 s
const TJ = [
  { who: '🚴', T: 10, d: (t) => 6 * t, v: () => 6,
    note: 'A cyclist at a steady 6 m/s. The graph is a straight line, so the gradient is the same all the way along. A tangent lies right on top of the line.' },
  { who: '🚗', T: 10, d: (t) => t * t, v: (t) => 2 * t,
    note: 'A car pulling away from traffic lights. It speeds up, so the graph curves upwards and gets steeper.' },
  { who: '🚗', T: 10, d: (t) => 20 * t - t * t, v: (t) => 20 - 2 * t,
    note: 'A car slowing down for traffic lights. The graph gets less steep, and goes flat when the car stops.' },
  { who: '🏃', T: 10, d: (t) => SPRINT * (t - 1.3 * (1 - Math.exp(-t / 1.3))), v: (t) => SPRINT * (1 - Math.exp(-t / 1.3)),
    note: 'A 100 m sprinter. They speed up quickly at the start, then run at an almost steady speed.' },
];

const state = {
  tab: 'journey', running: false, t: 0, warp: 1,
  route: 0, own: [], path: null,
  tj: 0, tp: 5, m: 0, checked: false,
};

const route = () => ROUTES[state.route];
const tj = () => TJ[state.tj];
const SH = () => SIZE[state.tab].SH;
const GH = () => SIZE[state.tab].GH;

function buildPath() {
  const r = route();
  if (r.own) state.path = state.own.length ? makePath(state.own[0], state.own.slice(1).map((p) => ({ to: p }))) : { pts: [], L: 0 };
  else state.path = makePath(r.start, r.steps);
}
const T = () => (state.tab === 'tangent' ? tj().T : state.path.L / route().v);
const sNow = () => Math.min(state.path.L, route().v * state.t);

// ---------- Words for directions ----------

const NAMES = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
function dirText(dx, dy) {
  const b = (Math.atan2(dx, dy) / RAD + 360) % 360, near = Math.round(b / 45) * 45;
  if (Math.abs(b - near) < 0.5) return NAMES[(near / 45) % 8];
  return `on a bearing of ${String(Math.round(b) % 360).padStart(3, '0')}°`;
}
function vecText(dx, dy, unit, dp = 1) {
  const size = Math.hypot(dx, dy);
  return size < 0.05 ? `0 ${unit}` : `${fmt(size, dp)} ${unit} ${dirText(dx, dy)}`;
}

// ---------- Moving ----------

function reset() {
  state.running = false;
  state.t = state.tab === 'tangent' ? 0 : 0;
  $('go').textContent = '▶ Go';
  renderPanel();
}

function go() {
  if (state.running) { state.running = false; $('go').textContent = '▶ Go'; return; }
  if (T() <= 0) return;
  if (state.t >= T() - 1e-9) state.t = 0;
  state.running = true;
  $('go').textContent = '⏸ Pause';
}

function step(dt) {
  if (!state.running) return;
  state.t = Math.min(T(), state.t + dt * state.warp);
  if (state.t >= T()) { state.running = false; $('go').textContent = '▶ Go'; renderPanel(); }
}

// ---------- Drawing helpers ----------

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), art: PK.cssVar('--art'), font: PK.cssVar('--font-body') || 'sans-serif' };
}

function arrow(c2, x1, y1, x2, y2, col, w) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len, head = Math.min(14, len), hw = 5 + w * 0.6;
  c2.strokeStyle = col; c2.lineWidth = w; c2.lineCap = 'butt';
  c2.beginPath(); c2.moveTo(x1, y1); c2.lineTo(x2 - ux * head, y2 - uy * head); c2.stroke();
  c2.fillStyle = col; c2.beginPath(); c2.moveTo(x2, y2);
  c2.lineTo(x2 - ux * head - uy * hw, y2 - uy * head + ux * hw); c2.lineTo(x2 - ux * head + uy * hw, y2 - uy * head - ux * hw);
  c2.closePath(); c2.fill();
}

function tag(c2, c, text, x, y, col, align = 'center', size = 13, weight = 800) {
  c2.font = `${weight} ${size}px ${c.font}`; c2.textAlign = align; c2.textBaseline = 'middle';
  c2.lineWidth = 4; c2.lineJoin = 'round'; c2.strokeStyle = c.surface; c2.strokeText(text, x, y);
  c2.fillStyle = col; c2.fillText(text, x, y); c2.lineWidth = 1;
}

function emoji(c2, icon, x, y, flip, size = 26) {
  c2.save(); c2.translate(x, y); if (flip) c2.scale(-1, 1);
  c2.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; c2.textAlign = 'center'; c2.textBaseline = 'middle';
  c2.fillStyle = '#000'; c2.fillText(icon, 0, 0);
  c2.restore();
}

// The tightest round-numbered axis that fits
function axis(max, ticks) {
  for (let e = -2; e < 7; e++) {
    for (const k of [1, 2, 5]) {
      const st = k * 10 ** e, n = Math.ceil(max / st - 1e-9);
      if (n <= ticks) return { step: st, n, top: n * st };
    }
  }
  return { step: max, n: 1, top: max };
}

// ---------- The map ----------

function mapScale() {
  const [x0, x1, y0, y1] = route().box, h = SH();
  const k = Math.min((SW - 40) / (x1 - x0), (h - 50) / (y1 - y0));
  const cx = SW / 2, cy = 34 + (h - 50) / 2, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  return { k, X: (x) => cx + (x - mx) * k, Y: (y) => cy - (y - my) * k, x: (px) => mx + (px - cx) / k, y: (py) => my - (py - cy) / k };
}

let flipWho = true;
function drawMap(c) {
  const r = route(), m = mapScale(), { X, Y, k } = m, path = state.path, s = sNow(), h = SH();
  // Squared paper, 10 m to a square
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let gx = Math.ceil(m.x(0) / 10) * 10; X(gx) <= SW; gx += 10) { ctx.beginPath(); ctx.moveTo(X(gx), 0); ctx.lineTo(X(gx), h); ctx.stroke(); }
  for (let gy = Math.ceil(m.y(h) / 10) * 10; Y(gy) >= 0; gy += 10) { ctx.beginPath(); ctx.moveTo(0, Y(gy)); ctx.lineTo(SW, Y(gy)); ctx.stroke(); }
  // North arrow and the scale
  ctx.fillStyle = c.muted; ctx.strokeStyle = c.muted; ctx.lineWidth = 2;
  // (kept below the top-right corner, where the page puts its Copy button)
  ctx.beginPath(); ctx.moveTo(SW - 24, 76); ctx.lineTo(SW - 24, 52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(SW - 24, 46); ctx.lineTo(SW - 30, 57); ctx.lineTo(SW - 18, 57); ctx.closePath(); ctx.fill();
  tag(ctx, c, 'N', SW - 24, 86, c.muted, 'center', 13);
  // The scale goes in the strip along the top, clear of every route
  ctx.fillStyle = c.surface; ctx.fillRect(SW - 206, 5, 128, 22); ctx.strokeStyle = c.grid; ctx.strokeRect(SW - 206, 5, 128, 22);
  tag(ctx, c, '1 square = 10 m', SW - 142, 16, c.text, 'center', 13);

  if (r.track) {
    ctx.strokeStyle = '#c75b45'; ctx.globalAlpha = 0.35; ctx.lineWidth = 8 * k; ctx.lineJoin = 'round';
    ctx.beginPath(); path.pts.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)))); ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (r.roundabout) {
    ctx.strokeStyle = '#5c6470'; ctx.lineWidth = 9 * k; ctx.beginPath(); ctx.arc(X(0), Y(0), 20 * k, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#7cb342'; ctx.beginPath(); ctx.arc(X(0), Y(0), 14 * k, 0, Math.PI * 2); ctx.fill();
  }

  if (path.pts.length) {
    // The whole route, then the part travelled so far
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = r.roundabout ? '#ffffff' : c.muted; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
    ctx.beginPath(); path.pts.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)))); ctx.stroke(); ctx.setLineDash([]);
    if (s > 0) {
      ctx.strokeStyle = DIST; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(X(path.pts[0].x), Y(path.pts[0].y));
      for (const p of path.pts) { if (p.s >= s) break; ctx.lineTo(X(p.x), Y(p.y)); }
      const here = along(path, s); ctx.lineTo(X(here.x), Y(here.y)); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    for (const p of r.own ? state.own : []) { ctx.fillStyle = c.text; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 4, 0, Math.PI * 2); ctx.fill(); }
    const st = path.pts[0];
    ctx.fillStyle = c.text; ctx.beginPath(); ctx.arc(X(st.x), Y(st.y), 6, 0, Math.PI * 2); ctx.fill();
    for (const [text, lx, ly, where] of r.labels || [['Start', st.x, st.y, 'below']]) {
      if (where === 'right') tag(ctx, c, text, X(lx) + 14, Y(ly), c.text, 'left', 13);
      else tag(ctx, c, text, X(lx), Y(ly) + 18, c.text, 'center', 13);
    }

    const here = along(path, s);
    // Velocity arrows left behind every eighth of the way round the roundabout
    if (r.roundabout) {
      for (let i = 1; i < 8; i++) {
        const si = (path.L * i) / 8;
        if (si > s) break;
        const p = along(path, si);
        ctx.globalAlpha = 0.6; arrow(ctx, X(p.x), Y(p.y), X(p.x) + p.dx * 38, Y(p.y) - p.dy * 38, VEL, 3); ctx.globalAlpha = 1;
      }
    }
    // Displacement: a straight arrow from the start to where you are now
    if (Math.hypot(here.x - st.x, here.y - st.y) > 0.5) {
      arrow(ctx, X(st.x), Y(st.y), X(here.x), Y(here.y), disp(), 5);
      const mx = (X(st.x) + X(here.x)) / 2, my = (Y(st.y) + Y(here.y)) / 2;
      const ddx = here.x - st.x, ddy = here.y - st.y, L = Math.hypot(ddx, ddy);
      const nx = -ddy / L, ny = -ddx / L;    // to the left of the arrow, on the screen
      const off = r.id === 'back' ? 16 : 14;
      tag(ctx, c, PK.answersShown() ? `displacement ${fmt(L)} m` : 'displacement', mx + nx * off, my + ny * off + (r.id === 'back' ? 4 : 0), disp(), 'center', 13);
    }
    // Velocity: which way you're heading right now
    const moving = s > 0 && s < path.L;
    if (moving || (s === 0 && path.L > 0)) arrow(ctx, X(here.x), Y(here.y), X(here.x) + here.dx * 46, Y(here.y) - here.dy * 46, VEL, 4);
    if (moving) tag(ctx, c, 'velocity', X(here.x) + here.dx * 46 + (here.dx >= 0 ? 6 : -6), Y(here.y) - here.dy * 46 - 12, VEL, here.dx >= 0 ? 'left' : 'right', 12);

    if (r.ball) {
      const atBall = s >= 50;
      const b = atBall ? here : { x: 50, y: 0 };
      emoji(ctx, '⚽', X(b.x) + (atBall ? -10 : 0), Y(b.y) - (atBall ? 2 : 0), false, atBall ? 14 : 18);
    }
    if (r.who === 'car') drawCar(X(here.x), Y(here.y), Math.atan2(-here.dy, here.dx), k);
    else {
      if (Math.abs(here.dx) > 0.3) flipWho = here.dx > 0;
      emoji(ctx, r.who, X(here.x), Y(here.y) - 12, flipWho, 26);
    }
  }
  // Clock, and what you can drag
  tag(ctx, c, `Time: ${state.t.toFixed(1)} s`, SW / 2, 16, c.text, 'center', 16);
  if (!state.running) {
    const help = r.own && state.own.length < 8 ? 'Tap the map to add a corner' : path.L > 0 ? `Drag the ${r.who === 'car' ? 'car' : r.id === 'back' ? 'dog' : 'walker'} along the route` : '';
    if (help) tag(ctx, c, help, 12, 16, c.muted, 'left', 13, 700);
  }
}

// A car seen from above, so it can point any way round the roundabout
function drawCar(x, y, ang, k) {
  const L = Math.max(22, 4.4 * k * 1.4), W = L * 0.48;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = '#e53935'; ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-L / 2, -W / 2, L, W, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#cfe8ff'; ctx.fillRect(L * 0.08, -W * 0.36, L * 0.18, W * 0.72); ctx.fillRect(-L * 0.36, -W * 0.36, L * 0.14, W * 0.72);
  ctx.restore();
}

// ---------- The road, for the tangent journeys ----------

function drawRoad(c) {
  const j = tj(), D = j.d(j.T), X0 = 30, X1 = SW - 30, x = (d) => X0 + (d / D) * (X1 - X0), y = 96;
  ctx.fillStyle = '#5c6470'; ctx.fillRect(0, y - 26, SW, 52);
  ctx.fillStyle = '#fff'; for (let d = 0; d < D; d += 10) ctx.fillRect(x(d) + 4, y - 2, (x(10) - x(0)) * 0.45, 4);
  ctx.font = `600 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let d = 0; d <= D + 1e-6; d += axis(D, 10).step) {
    ctx.strokeStyle = c.muted; ctx.beginPath(); ctx.moveTo(x(d), y + 26); ctx.lineTo(x(d), y + 31); ctx.stroke();
    ctx.fillStyle = c.muted; ctx.fillText(`${fmt(d)} m`, x(d), y + 33);
  }
  const t = Math.min(state.t, j.T);
  emoji(ctx, j.who, x(j.d(t)), y - 8, true, 30);
  tag(ctx, c, `Time: ${state.t.toFixed(1)} s`, SW / 2, 18, c.text, 'center', 16);
  if (PK.answersShown()) tag(ctx, c, `speed ${f1(j.v(t))} m/s`, 12, 18, VEL, 'left', 14);
}

function drawScene() {
  if (!scene.clientWidth) return;
  const k = scene.width / SW, c = colours();
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, SW, SH());
  if (state.tab === 'tangent') drawRoad(c); else drawMap(c);
}

// ---------- The graph ----------

function plotArea() {
  const h = GH(), L = 62, Rm = 16, Tm = 14, B = 48;
  return { L, R: Rm, T: Tm, B, pw: GW - L - Rm, ph: h - Tm - B };
}

function axes(c, tA, dA, minor) {
  const { L, T: Tm, pw, ph } = plotArea(), h = GH();
  const X = (t) => L + (t / tA.top) * pw, Y = (d) => Tm + ph - (d / dA.top) * ph;
  if (minor) {
    g.strokeStyle = c.grid; g.globalAlpha = 0.55; g.lineWidth = 1;
    for (let i = 0; i <= tA.n * 5; i++) { const t = (i * tA.step) / 5; g.beginPath(); g.moveTo(X(t), Tm); g.lineTo(X(t), Tm + ph); g.stroke(); }
    for (let i = 0; i <= dA.n * 5; i++) { const d = (i * dA.step) / 5; g.beginPath(); g.moveTo(L, Y(d)); g.lineTo(L + pw, Y(d)); g.stroke(); }
    g.globalAlpha = 1;
  }
  g.lineWidth = minor ? 1.4 : 1; g.font = `600 13px ${c.font}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= dA.n; i++) { const d = i * dA.step; g.strokeStyle = minor ? c.art : c.grid; g.globalAlpha = minor ? 0.45 : 1; g.beginPath(); g.moveTo(L, Y(d)); g.lineTo(L + pw, Y(d)); g.stroke(); g.globalAlpha = 1; g.fillStyle = c.muted; g.fillText(fmt(d, 2), L - 6, Y(d)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let i = 0; i <= tA.n; i++) { const t = i * tA.step; g.strokeStyle = minor ? c.art : c.grid; g.globalAlpha = minor ? 0.45 : 1; g.beginPath(); g.moveTo(X(t), Tm); g.lineTo(X(t), Tm + ph); g.stroke(); g.globalAlpha = 1; g.fillStyle = c.muted; g.fillText(fmt(t, 2), X(t), Tm + ph + 5); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, Tm); g.lineTo(L, Tm + ph); g.lineTo(L + pw, Tm + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 14px ${c.font}`;
  g.fillText('time / s', L + pw / 2, h - 20);
  g.save(); g.translate(16, Tm + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('distance / m', 0, 0); g.restore();
  return { X, Y };
}

function drawJourneyGraph(c) {
  const path = state.path, r = route(), Tt = T();
  if (!path.pts.length || path.L <= 0) {
    axes(c, axis(10, 10), axis(10, 6), false);
    return;
  }
  const st = path.pts[0];
  const dispAt = (t) => { const p = along(path, Math.min(path.L, r.v * t)); return Math.hypot(p.x - st.x, p.y - st.y); };
  let most = path.L;
  const tA = axis(Tt, 10), dA = axis(most, 6);
  const { X, Y } = axes(c, tA, dA, false);
  const N = 300, end = state.t, showDisp = PK.answersShown();
  g.lineJoin = 'round';
  if (showDisp) {
    g.strokeStyle = disp(); g.lineWidth = 3; g.beginPath();
    for (let i = 0; i <= N; i++) { const t = (end * i) / N; if (i) g.lineTo(X(t), Y(dispAt(t))); else g.moveTo(X(t), Y(dispAt(t))); }
    g.stroke();
  }
  g.strokeStyle = DIST; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(end), Y(Math.min(path.L, r.v * end))); g.stroke();
  if (end > 0) {
    g.fillStyle = DIST; g.beginPath(); g.arc(X(end), Y(Math.min(path.L, r.v * end)), 5, 0, Math.PI * 2); g.fill();
    if (showDisp) { g.fillStyle = disp(); g.beginPath(); g.arc(X(end), Y(dispAt(end)), 5, 0, Math.PI * 2); g.fill(); }
  }
}

// The tangent tab: the curve, a dot on it, and a straight edge you can turn
function tangentGeom() {
  const j = tj(), tA = axis(j.T, 10), dA = axis(j.d(j.T), 10), { L, T: Tm, pw, ph } = plotArea();
  const X = (t) => L + (t / tA.top) * pw, Y = (d) => Tm + ph - (d / dA.top) * ph;
  const pxT = pw / tA.top, pxD = ph / dA.top;
  const P = { t: state.tp, d: j.d(state.tp) };
  // The handle sits on the line, 120 px from the dot, on whichever side has room
  const ang = Math.atan2(state.m * pxD, pxT), side = X(P.t) + Math.cos(ang) * 120 > L + pw - 4 ? -1 : 1;
  const H = { x: X(P.t) + side * Math.cos(ang) * 120, y: Y(P.d) - side * Math.sin(ang) * 120 };
  return { j, tA, dA, X, Y, pxT, pxD, P, H, L, Tm, pw, ph };
}

// The biggest gradient triangle that fits on the graph, using steps of half a second
function triangle(geo) {
  const { P, tA, dA } = geo, m = state.m, lineAt = (t) => P.d + m * (t - P.t);
  const fits = (t) => t >= -1e-9 && t <= tA.top + 1e-9 && lineAt(t) >= -1e-9 && lineAt(t) <= dA.top + 1e-9;
  let a = 0, b = 0;
  for (let h = 0.5; h <= tA.top; h += 0.5) { if (fits(P.t - h)) a = h; else break; }
  for (let h = 0.5; h <= tA.top; h += 0.5) { if (fits(P.t + h)) b = h; else break; }
  // Keep it balanced either side of the dot when there's room, as you would on paper
  const most = Math.min(Math.max(a, b), 4 * tA.step);
  if (a >= most && b >= most) { a = most; b = most; } else { a = Math.min(a, most * 2); b = Math.min(b, most * 2); }
  if (a + b <= 0) return null;
  const t1 = P.t - a, t2 = P.t + b;
  return { t1, t2, d1: lineAt(t1), d2: lineAt(t2) };
}

function drawTangentGraph(c) {
  const geo = tangentGeom(), { j, tA, dA, X, Y, P, H, L, Tm, pw, ph } = geo;
  axes(c, tA, dA, true);
  const end = Math.min(state.t, j.T), N = 240;
  g.strokeStyle = DIST; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i <= N; i++) { const t = (end * i) / N; if (i) g.lineTo(X(t), Y(j.d(t))); else g.moveTo(X(t), Y(j.d(t))); }
  g.stroke();
  if (state.t < P.t) {
    tag(g, c, 'The curve hasn’t reached the dot yet', L + pw / 2, Tm + 20, c.muted, 'center', 13, 700);
    return;
  }
  g.save(); g.beginPath(); g.rect(L, Tm, pw, ph); g.clip();
  // The real tangent, once you've checked
  if (state.checked) {
    const v = j.v(P.t);
    g.strokeStyle = disp(); g.lineWidth = 2.5; g.setLineDash([8, 6]);
    g.beginPath(); g.moveTo(X(P.t - 30), Y(P.d - v * 30)); g.lineTo(X(P.t + 30), Y(P.d + v * 30)); g.stroke(); g.setLineDash([]);
  }
  // Your straight edge
  g.strokeStyle = c.text; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(X(P.t - 30), Y(P.d - state.m * 30)); g.lineTo(X(P.t + 30), Y(P.d + state.m * 30)); g.stroke();
  // The gradient triangle
  const tri = triangle(geo);
  if (tri) {
    g.strokeStyle = TRI; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(X(tri.t1), Y(tri.d1)); g.lineTo(X(tri.t2), Y(tri.d1)); g.lineTo(X(tri.t2), Y(tri.d2)); g.stroke();
  }
  g.restore();
  if (tri) {
    // Labels outside the triangle, unless that would put them off the graph
    let below = tri.d2 >= tri.d1;
    if (below && Y(tri.d1) + 14 > Tm + ph - 6) below = false;
    tag(g, c, `${f1(tri.t2 - tri.t1)} s`, (X(tri.t1) + X(tri.t2)) / 2, Y(tri.d1) + (below ? 14 : -14), TRI, 'center', 13);
    const right = X(tri.t2) + 60 < L + pw;
    if (Math.abs(Y(tri.d2) - Y(tri.d1)) > 14) tag(g, c, `${f1(Math.abs(tri.d2 - tri.d1))} m`, X(tri.t2) + (right ? 6 : -6), (Y(tri.d1) + Y(tri.d2)) / 2, TRI, right ? 'left' : 'right', 13);
  }
  // The dot (drag it along the curve) and the handle (drag it to turn the line)
  g.fillStyle = c.text; g.beginPath(); g.arc(X(P.t), Y(P.d), 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = c.surface; g.strokeStyle = c.text; g.lineWidth = 3; g.beginPath(); g.arc(H.x, H.y, 9, 0, Math.PI * 2); g.fill(); g.stroke();
  tag(g, c, 'Drag the dot along the curve. Drag the white circle to turn the line.', L + 8, Tm + 14, c.muted, 'left', 12, 700);
}

function drawGraph() {
  if (!graph.clientWidth) return;
  const k = graph.width / GW, c = colours();
  g.setTransform(k, 0, 0, k, 0, 0);
  g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH());
  if (state.tab === 'tangent') drawTangentGraph(c); else drawJourneyGraph(c);
}

// ---------- The panels ----------

let lastNow = '';
function renderNow() {
  if (state.tab !== 'journey') return;
  const path = state.path, r = route(), s = sNow();
  const st = path.pts[0] || { x: 0, y: 0 }, here = along(path, s);
  const moving = s > 0 && s < path.L && path.L > 0;
  const html = `<dt>Time</dt><dd>${f1(state.t)} s</dd>
    <dt>Distance travelled</dt><dd>${fmt(s)} m</dd>
    <dt>Displacement</dt><dd>${PK.ans(vecText(here.x - st.x, here.y - st.y, 'm'))}</dd>
    <dt>Speed</dt><dd>${moving ? fmt(r.v) : 0} m/s</dd>
    <dt>Velocity</dt><dd>${moving ? `${fmt(r.v)} m/s <small>${dirText(here.dx, here.dy)}</small>` : '0 m/s'}</dd>`;
  if (html !== lastNow) { $('now').innerHTML = html; lastNow = html; }
}

function renderWhole() {
  const path = state.path, r = route();
  if (path.L <= 0) { $('whole').innerHTML = '<p class="note">Tap the map to add at least two corners.</p>'; return; }
  const done = state.t >= T() - 1e-9;
  if (!done) { $('whole').innerHTML = '<p class="note">Press Go. At the end of the journey, compare the distance with the displacement, and the speed with the velocity.</p>'; return; }
  const st = path.pts[0], fin = path.pts[path.pts.length - 1], dx = fin.x - st.x, dy = fin.y - st.y, D = Math.hypot(dx, dy), Tt = T();
  const dispTxt = vecText(dx, dy, 'm'), velTxt = D < 0.05 ? '0 m/s' : `${fmt(D / Tt, 2)} m/s ${dirText(dx, dy)}`;
  let work = r.work;
  if (r.own) {
    const ew = Math.abs(dx) > 0.05 ? `${fmt(Math.abs(dx))} m ${dx > 0 ? 'east' : 'west'}` : '', ns = Math.abs(dy) > 0.05 ? `${fmt(Math.abs(dy))} m ${dy > 0 ? 'north' : 'south'}` : '';
    work = D < 0.05 ? 'You finished where you started, so the displacement is 0.'
      : ew && ns ? `Altogether you went ${ew} and ${ns}. Pythagoras: √(${fmt(Math.abs(dx))}² + ${fmt(Math.abs(dy))}²) = ${fmt(D)} m.`
        : `Altogether you went ${ew || ns}.`;
  }
  $('whole').innerHTML = `<table class="results">
      <thead><tr><th></th><th>Scalar<br><small>size only</small></th><th>Vector<br><small>size and direction</small></th></tr></thead>
      <tbody>
        <tr><td>How far</td><td>distance<br><b>${fmt(path.L)} m</b></td><td>displacement<br><b>${PK.ans(dispTxt)}</b></td></tr>
        <tr><td>Average</td><td>speed<br><b>${PK.ans(`${fmt(path.L / Tt, 2)} m/s`)}</b></td><td>velocity<br><b>${PK.ans(velTxt)}</b></td></tr>
      </tbody></table>
    <div class="working">
      <p>Time taken: ${f1(Tt)} s</p>
      <p>Displacement: ${PK.ans(work)}</p>
      <p>Average speed = distance ÷ time = ${fmt(path.L)} ÷ ${f1(Tt)} = <b>${PK.ans(`${fmt(path.L / Tt, 2)} m/s`)}</b></p>
      <p>Average velocity = displacement ÷ time = ${PK.ans(D < 0.05 ? '0 ÷ ' + f1(Tt) + ' = <b>0 m/s</b>' : `${fmt(D)} ÷ ${f1(Tt)} = <b>${velTxt}</b>`)}</p>
    </div>`;
}

function renderTangent() {
  const geo = tangentGeom(), { j, P } = geo, tri = triangle(geo);
  $('tj-note').textContent = j.note;
  if (state.t < P.t) { $('mine').innerHTML = '<p class="note">Press Go, or wait for the curve to reach the dot.</p>'; $('checked').innerHTML = ''; return; }
  const mine = tri ? (tri.d2 - tri.d1) / (tri.t2 - tri.t1) : state.m;
  $('mine').innerHTML = tri ? `<div class="working">
      <p>Gradient = change in distance ÷ change in time</p>
      <p>= (${f1(tri.d2)} − ${f1(tri.d1)}) ÷ (${f1(tri.t2)} − ${f1(tri.t1)})</p>
      <p>= ${f1(tri.d2 - tri.d1)} ÷ ${f1(tri.t2 - tri.t1)} = <b>${f1(mine)} m/s</b></p>
    </div>
    <p class="note" style="margin-bottom:0">So the speed at ${fmt(P.t)} s is about ${f1(mine)} m/s, if your line is a good tangent.</p>` : '';
  $('check').textContent = state.checked ? 'Hide the real tangent' : 'Check my tangent';
  if (!state.checked) { $('checked').innerHTML = ''; return; }
  const real = j.v(P.t), diff = Math.abs(mine - real), pc = real > 0.05 ? (diff / real) * 100 : null;
  const good = pc === null ? diff <= 0.5 : pc <= 5, close = pc === null ? diff <= 1.5 : pc <= 15;
  $('checked').innerHTML = `<dl class="readout" style="margin-top:12px"><dt>Real speed at ${fmt(P.t)} s</dt><dd style="color:var(--resultant)">${f1(real)} m/s</dd><dt>Your tangent</dt><dd>${f1(mine)} m/s</dd></dl>
    <p class="note" style="margin-bottom:0">${good ? '<span class="badge good">Good tangent</span> ' : close ? '<span class="badge neutral">Close</span> ' : '<span class="badge bad">Not quite</span> '}${
      good ? `That’s within ${pc === null ? '0.5 m/s' : '5%'} of the real speed.`
        : 'The dashed line is the real tangent. It just touches the curve at the dot, and is exactly as steep as the curve is there. Turn your line to match it.'}</p>`;
}

function renderPanel() {
  if (state.tab === 'tangent') { renderTangent(); return; }
  const r = route();
  $('route-note').textContent = r.note;
  $('own-btns').hidden = !r.own;
  renderNow();
  renderWhole();
  $('key').innerHTML = `<span style="--c:${DIST}">distance</span>${PK.answersShown() ? `<span style="--c:${disp()}">size of the displacement</span>` : ''}`;
  $('graph-note').textContent = r.id === 'round' || r.id === 'track'
    ? 'The distance line keeps going up. The displacement grows as you get further from the start, then falls back to zero as you come round to it again.'
    : 'The distance line only ever goes up. The displacement is never bigger than the distance, and is only the same when you go in a straight line.';
}

// ---------- Controls ----------

const INTRO = {
  journey: '<b>Distance</b> is how far you travel along the route. <b>Displacement</b> is how far you end up from the start, in a straight line, and in which direction. Speed goes with distance, and velocity goes with displacement. Pick a journey and press Go.',
  tangent: 'When something speeds up or slows down, its distance–time graph is curved. To find its speed at one instant, draw a <b>tangent</b>: a straight line that just touches the curve there. The gradient of the tangent is the speed.',
};

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  const tan = t === 'tangent';
  for (const id of ['p-journey', 'p-now', 'p-whole']) $(id).hidden = tan;
  for (const id of ['p-tangent', 'p-gradient']) $(id).hidden = !tan;
  $('key').hidden = tan;
  $('intro').innerHTML = INTRO[t];
  $('graph-title').textContent = tan ? 'Distance–time graph: the speed at an instant' : 'Distance–time graph';
  scene.setAttribute('aria-label', tan ? 'The journey along a straight road' : 'A map of the journey');
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'journey' ? location.pathname + location.search : '#tangent');
  state.running = false; $('go').textContent = '▶ Go';
  state.t = tan ? tj().T : 0;
  if (tan) $('graph-note').textContent = 'Make your line just touch the curve at the dot, so it is exactly as steep as the curve there. Then use the triangle to work out its gradient.';
  size();
  renderPanel();
}

function setRoute(i) {
  state.route = i; buildPath(); state.running = false; state.t = 0; $('go').textContent = '▶ Go';
  renderPanel();
}
function setTj(i) {
  state.tj = i; state.checked = false; state.running = false; $('go').textContent = '▶ Go';
  state.t = tj().T;
  state.tp = Math.min(state.tp, tj().T);
  state.m = 0;
  renderPanel();
}

PK.chips('route', setRoute);
PK.chips('tj', setTj);
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#warp .chip').forEach((b) => b.addEventListener('click', () => {
  state.warp = Number(b.dataset.w);
  document.querySelectorAll('#warp .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));
$('go').addEventListener('click', go);
$('reset').addEventListener('click', () => { state.running = false; state.t = 0; $('go').textContent = '▶ Go'; renderPanel(); });
$('undo').addEventListener('click', () => { state.own.pop(); setRoute(state.route); });
$('clear').addEventListener('click', () => { state.own = []; setRoute(state.route); });
$('tp').addEventListener('input', () => { state.tp = PK.num('tp'); state.checked = false; renderPanel(); });
$('check').addEventListener('click', () => { state.checked = !state.checked; renderPanel(); });
window.addEventListener('pk-answers', () => { lastNow = ''; renderPanel(); });
window.addEventListener('pk-theme', () => { lastNow = ''; renderPanel(); });

// Dragging. The canvases change height between tabs, so they report y as if they were square
// (0 to the width) and we scale it to the real height here.
let downAt = null;   // a tap only tells us what was hit, so remember where
PK.dragOn(scene, SW, SW, {
  hit: (p0) => {
    downAt = p0;
    if (state.tab !== 'journey' || state.running) return null;
    const p = { x: p0.x, y: p0.y * SH() / SW }, m = mapScale(), path = state.path;
    if (path.L > 0) {
      const here = along(path, sNow());
      if (Math.hypot(p.x - m.X(here.x), p.y - (m.Y(here.y) - 8)) < 30) return 'who';
    }
    return route().own ? 'map' : null;
  },
  move: (h, p0) => {
    if (h !== 'who') return;
    const p = { x: p0.x, y: p0.y * SH() / SW }, m = mapScale(), path = state.path;
    // The nearest point on the route to your finger
    let best = 0, bestD = Infinity;
    for (let i = 0; i < path.pts.length - 1; i++) {
      const a = path.pts[i], b = path.pts[i + 1], ax = m.X(a.x), ay = m.Y(a.y), bx = m.X(b.x), by = m.Y(b.y);
      const L2 = (bx - ax) ** 2 + (by - ay) ** 2, f = L2 ? Math.max(0, Math.min(1, ((p.x - ax) * (bx - ax) + (p.y - ay) * (by - ay)) / L2)) : 0;
      const d = Math.hypot(ax + (bx - ax) * f - p.x, ay + (by - ay) * f - p.y);
      // On a lap, the start and the finish are the same place: stay on the side you were on
      const s = a.s + (b.s - a.s) * f, jump = Math.abs(s - sNow()) > path.L / 2 ? 25 : 0;
      if (d + jump < bestD) { bestD = d + jump; best = s; }
    }
    state.t = best / route().v;
    renderPanel();
  },
  tap: (h) => {
    const p0 = downAt;
    if (h !== 'map' || !p0 || state.own.length >= 8) return;
    const m = mapScale(), x = Math.round(m.x(p0.x) / 10) * 10, y = Math.round(m.y(p0.y * SH() / SW) / 10) * 10;
    if (x < 0 || x > 100 || y < 0 || y > 60) return;
    const last = state.own[state.own.length - 1];
    if (last && last[0] === x && last[1] === y) return;
    state.own.push([x, y]);
    setRoute(state.route);
  },
});

PK.dragOn(graph, GW, GW, {
  hit: (p0) => {
    if (state.tab !== 'tangent' || state.t < state.tp) return null;
    const p = { x: p0.x, y: p0.y * GH() / GW }, geo = tangentGeom();
    if (Math.hypot(p.x - geo.H.x, p.y - geo.H.y) < 24) return 'H';
    if (Math.hypot(p.x - geo.X(geo.P.t), p.y - geo.Y(geo.P.d)) < 22) return 'P';
    return null;
  },
  move: (h, p0) => {
    const p = { x: p0.x, y: p0.y * GH() / GW }, geo = tangentGeom();
    if (h === 'P') {
      const t = Math.round((((p.x - geo.L) / geo.pw) * geo.tA.top) * 2) / 2;
      state.tp = Math.max(0.5, Math.min(Math.min(geo.j.T, state.t), t));
      PK.setNum('tp', state.tp);
      state.checked = false;
    } else {
      let dx = p.x - geo.X(geo.P.t);
      const dy = p.y - geo.Y(geo.P.d);
      if (Math.abs(dx) < 6) dx = dx < 0 ? -6 : 6;
      const most = 3 * Math.max(...[0, 2, 4, 6, 8, 10].map((t) => geo.j.v(t)));
      state.m = Math.max(-most, Math.min(most, (-dy * geo.pxT) / (dx * geo.pxD)));
    }
    renderPanel();
  },
});

function size() {
  const dpr = window.devicePixelRatio || 1, z = SIZE[state.tab];
  scene.style.aspectRatio = `${SW} / ${z.SH}`; graph.style.aspectRatio = `${GW} / ${z.GH}`;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (z.SH / SW) * dpr);
  graph.width = Math.round(graph.clientWidth * dpr); graph.height = Math.round(graph.clientWidth * (z.GH / GW) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  drawScene();
  drawGraph();
  if (state.running) { if (state.tab === 'journey') renderNow(); else if (state.t >= state.tp) renderTangent(); }
  requestAnimationFrame(frame);
}

buildPath();
showTab(PK.initialHash === '#tangent' ? 'tangent' : 'journey');
requestAnimationFrame(frame);

// Share: your own route, and the line you've drawn for the tangent
PK.shareState = {
  get: () => ({ p: state.own, m: Math.round(state.m * 1000) / 1000, c: state.checked ? 1 : 0, t: Math.round(state.t * 10) / 10 }),
  set: (o) => {
    if (Array.isArray(o.p)) { state.own = o.p.filter((q) => Array.isArray(q) && q.length === 2).slice(0, 8).map((q) => [Number(q[0]) || 0, Number(q[1]) || 0]); buildPath(); }
    if (Number.isFinite(Number(o.m))) state.m = Number(o.m);
    state.checked = Boolean(o.c);
    if (Number.isFinite(Number(o.t))) state.t = Math.max(0, Math.min(T(), Number(o.t)));
    renderPanel();
  },
};
