// Brownian motion & diffusion (KS3).
// Brownian motion: a smoke particle seen through a microscope is pushed about by air particles
// far too small to see. Every hit is an elastic collision, so the jiggling isn't faked: it comes
// from more air particles hitting one side than the other.
// Diffusion: a coloured gas or a dye spreads out once a divider is lifted. Gas particles fly
// freely and bounce off each other; liquid particles are packed together and jostle.

PK.header({
  title: 'Brownian motion & diffusion',
  spec: [
    { code: 'KS3', text: 'The particle model: the differences in arrangement, motion and closeness of particles in solids, liquids and gases' },
    { code: 'KS3', text: 'Brownian motion in gases' },
    { code: 'KS3', text: 'Diffusion in liquids and gases, driven by differences in concentration' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 470;
const state = { tab: 'brownian', paused: false };
const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const kelvin = (id) => PK.num(id) + 273;

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800, halo = c.surface) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
function dots(list, r, col) {
  ctx.fillStyle = col; ctx.beginPath();
  for (const p of list) { ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); }
  ctx.fill();
}

// ---------- Brownian motion ----------

const AIR_N = 700, AIR_R = 2.2, AIR_V = 170;   // AIR_V: typical (rms) speed on screen at 20 °C, in px/s
const SIZES = { small: { r: 13, m: 6 }, large: { r: 26, m: 24 } };   // m: mass compared with one air particle
const br = { air: [], p: null, path: [], hits: [], since: 0, T: 293 };

function brSetup() {
  const T = kelvin('btemp'), s = SIZES[pressed('size')], sd = (AIR_V * Math.sqrt(T / 293)) / Math.SQRT2;
  br.T = T;
  br.p = { x: W / 2, y: H / 2, r: s.r, m: s.m, vx: (gauss() * sd) / Math.sqrt(s.m), vy: (gauss() * sd) / Math.sqrt(s.m) };
  br.air = [];
  while (br.air.length < AIR_N) {
    const x = AIR_R + Math.random() * (W - 2 * AIR_R), y = AIR_R + Math.random() * (H - 2 * AIR_R);
    if (Math.hypot(x - br.p.x, y - br.p.y) < br.p.r + 4) continue;
    br.air.push({ x, y, vx: gauss() * sd, vy: gauss() * sd });
  }
  br.path = [{ x: br.p.x, y: br.p.y }]; br.hits = []; br.since = 0;
}
// Hotter air: every particle speeds up (speed goes with the square root of the kelvin temperature)
function brTemp() {
  const T = kelvin('btemp'), k = Math.sqrt(T / br.T);
  for (const a of br.air) { a.vx *= k; a.vy *= k; }
  br.p.vx *= k; br.p.vy *= k; br.T = T;
}
function brSize() {
  const s = SIZES[pressed('size')], p = br.p, k = Math.sqrt(p.m / s.m);
  p.vx *= k; p.vy *= k; p.r = s.r; p.m = s.m;
  p.x = Math.min(W - p.r, Math.max(p.r, p.x)); p.y = Math.min(H - p.r, Math.max(p.r, p.y));
  br.path = [{ x: p.x, y: p.y }];
}
function brStep(dt) {
  const p = br.p, n = 3, h = dt / n, R = p.r + AIR_R;
  for (let k = 0; k < n; k++) {
    p.x += p.vx * h; p.y += p.vy * h;
    if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx); }
    if (p.x > W - p.r) { p.x = W - p.r; p.vx = -Math.abs(p.vx); }
    if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy); }
    if (p.y > H - p.r) { p.y = H - p.r; p.vy = -Math.abs(p.vy); }
    for (const a of br.air) {
      a.x += a.vx * h; a.y += a.vy * h;
      if (a.x < AIR_R) { a.x = AIR_R; a.vx = Math.abs(a.vx); }
      if (a.x > W - AIR_R) { a.x = W - AIR_R; a.vx = -Math.abs(a.vx); }
      if (a.y < AIR_R) { a.y = AIR_R; a.vy = Math.abs(a.vy); }
      if (a.y > H - AIR_R) { a.y = H - AIR_R; a.vy = -Math.abs(a.vy); }
      const dx = a.x - p.x, dy = a.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 >= R * R) continue;
      const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d;
      const vn = (a.vx - p.vx) * nx + (a.vy - p.vy) * ny;
      if (vn < 0) {   // coming together: an elastic collision between masses 1 and p.m
        const ja = ((2 * p.m) / (1 + p.m)) * vn, jp = (2 / (1 + p.m)) * vn;
        a.vx -= ja * nx; a.vy -= ja * ny; p.vx += jp * nx; p.vy += jp * ny;
        br.hits.push({ ang: Math.atan2(ny, nx), age: 0 });
      }
      a.x = p.x + nx * R; a.y = p.y + ny * R;
    }
  }
  br.since += dt;
  if (br.since >= 0.2) { br.since = 0; br.path.push({ x: p.x, y: p.y }); if (br.path.length > 450) br.path.shift(); }
  for (const hit of br.hits) hit.age += dt;
  br.hits = br.hits.filter((hit) => hit.age < 0.3);
}
// The real typical speed of air particles: v = √(3RT/M), with M = 0.029 kg/mol
const airSpeed = () => Math.sqrt((3 * 8.314 * br.T) / 0.029);

function drawBrownian(c) {
  const showAir = $('air').checked, p = br.p;
  ctx.fillStyle = '#0d1218'; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 10); ctx.fill();
  if (showAir) dots(br.air, AIR_R, 'rgba(100, 181, 246, .9)');
  if ($('path').checked && br.path.length > 1) {
    const pts = [...br.path, { x: p.x, y: p.y }], n = pts.length;
    ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.strokeStyle = '#ffb74d';
    for (let part = 0; part < 4; part++) {   // older parts of the path are fainter
      const a = Math.floor((part * (n - 1)) / 4), b = Math.floor(((part + 1) * (n - 1)) / 4);
      if (b <= a) continue;
      ctx.globalAlpha = 0.3 + 0.2 * part;
      ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y);
      for (let i = a + 1; i <= b; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  }
  // The smoke particle: a speck of light
  const glow = ctx.createRadialGradient(p.x, p.y, p.r * 0.4, p.x, p.y, p.r * 1.9);
  glow.addColorStop(0, 'rgba(255, 255, 255, .35)'); glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.9, 0, Math.PI * 2); ctx.fill();
  const body = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.35, 1, p.x, p.y, p.r);
  body.addColorStop(0, '#ffffff'); body.addColorStop(1, '#b8c2cc');
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  if (showAir) {
    ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 2.5;
    for (const hit of br.hits) {
      ctx.globalAlpha = 1 - hit.age / 0.3;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 1.5, hit.ang - 0.35, hit.ang + 0.35); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  }
  const label = (text, x, y, col = '#cfd8dc', align = 'left', size = 14) => {
    ctx.font = `700 ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0d1218'; ctx.strokeText(text, x, y);
    ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
  };
  label('Seen through a microscope: the smoke particle is a speck of light', 14, 18);
  if (showAir) label('Blue: air particles. In real life they’re far too small to see.', 14, 40, '#90caf9');
  else label('Why does it move like this? Tick “Show the air particles”.', W / 2, H - 20, '#ffcc80', 'center', 15);
  if (state.paused) label('Paused', W - 14, H - 20, '#ffcc80', 'right', 15);
}

// ---------- Diffusion ----------

const DB = { l: 30, t: 50, r: 770, b: 292 }, MID = 400, WALL = 3;
const MEDIA = {
  gas: { r: 3.5, dr: 4.5, nCol: 170, nLeft: 0, nRight: 170, col: '#a0522d', other: '#9eadb6', what: 'bromine', whatP: 'bromine particle', into: 'air', axis: 40, v20: 420 },
  liquid: { r: 8, dr: 7.5, nCol: 210, nLeft: 0, nRight: 210, col: '#8e24aa', other: '#7fb8e6', what: 'purple dye', whatP: 'dye particle', into: 'water', axis: 120, sigma20: 130, gamma: 4 },
};
const df = { ps: [], wall: true, lifted: 0, t: 0, trace: [], since: 0, avg: [], mixedAt: null, last: null, follow: null, trail: [], trailSince: 0, T: 293, medium: 'gas', axis: 40 };
const M = () => MEDIA[df.medium];
const EVEN = 0.45;   // evenly spread: within 5% of half on each side
// Water gets runnier as it warms up, so dye spreads much faster in hot water than in cold:
// how fast a particle spreads goes with T ÷ viscosity. Viscosity of water from the Vogel equation.
// The effect is softened (square-rooted) so that a liquid is always slower than a gas at the
// same temperature, as it is in real life, where the gap is thousands of times bigger.
const viscosity = (T) => 2.414e-5 * 10 ** (247.8 / (T - 140));
const liquidFactor = (T) => ((T / viscosity(T)) / (293 / viscosity(293))) ** 0.5;
// In a real gas at a steady pressure, heating also spreads the particles out, so they go further
// between collisions, and diffusion speeds up about as T^1.5. This box keeps the same number of
// particles, so their speed is scaled that way instead, to give the same effect.
const gasSD = (T) => (M().v20 * (T / 293) ** 1.5) / Math.SQRT2;
const liquidSD = (T) => M().sigma20 * Math.sqrt(liquidFactor(T));

function dfSetup() {
  if (df.trace.length > 15) df.last = { trace: df.trace, medium: df.medium, temp: Math.round(df.T - 273), mixedAt: df.mixedAt };
  df.medium = pressed('medium');
  const m = M(), r = m.r;
  $('dtemp').max = df.medium === 'liquid' ? 100 : 300;
  PK.setNum('dtemp', PK.num('dtemp'));
  df.T = kelvin('dtemp');
  const sd = df.medium === 'gas' ? gasSD(df.T) : liquidSD(df.T);
  df.ps = [];
  const place = (n, x0, x1, coloured) => {
    for (let tries = 0; n > 0 && tries < 60000; tries++) {
      const x = x0 + r + Math.random() * (x1 - x0 - 2 * r), y = DB.t + r + Math.random() * (DB.b - DB.t - 2 * r);
      if (tries < 50000 && df.ps.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 4 * r * r * 0.95)) continue;
      df.ps.push({ x, y, vx: gauss() * sd, vy: gauss() * sd, col: coloured, side: x < MID ? 'L' : 'R' }); n--;
    }
  };
  place(m.nCol, DB.l, MID - WALL, true); place(m.nLeft, DB.l, MID - WALL, false); place(m.nRight, MID + WALL, DB.r, false);
  for (let i = 0; i < 20; i++) collide(false);
  Object.assign(df, { wall: true, lifted: 0, t: 0, trace: [], since: 0, avg: [], mixedAt: null, axis: m.axis, trail: [], trailSince: 0 });
  pickFollow();
  syncLift();
}
function pickFollow() {
  const col = df.ps.filter((p) => p.col);
  df.follow = col.reduce((best, p) => (Math.abs(p.x - 230) + Math.abs(p.y - 171) < Math.abs(best.x - 230) + Math.abs(best.y - 171) ? p : best), col[0]);
  df.trail = df.follow ? [{ x: df.follow.x, y: df.follow.y }] : [];
}
// Particles that overlap are pushed apart. In a gas they bounce (elastic, equal masses); in a liquid
// they just jostle, as the random kicks keep them moving.
function collide(bounce) {
  const r = M().r, cell = 2 * r, cols = Math.ceil((DB.r - DB.l) / cell) + 2, grid = new Map(), ps = df.ps;
  const key = (p) => (Math.floor((p.x - DB.l) / cell) + 1) + cols * (Math.floor((p.y - DB.t) / cell) + 1);
  ps.forEach((p, i) => { const k = key(p); const list = grid.get(k); if (list) list.push(i); else grid.set(k, [i]); });
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i], k = key(a);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const list = grid.get(k + dx + cols * dy);
        if (!list) continue;
        for (const j of list) {
          if (j <= i) continue;
          const b = ps[j], ex = b.x - a.x, ey = b.y - a.y, d2 = ex * ex + ey * ey;
          if (d2 >= 4 * r * r || d2 === 0) continue;
          const d = Math.sqrt(d2), nx = ex / d, ny = ey / d;
          if (bounce) {
            const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (vn > 0) { a.vx -= vn * nx; a.vy -= vn * ny; b.vx += vn * nx; b.vy += vn * ny; }
          }
          const o = (2 * r - d) / 2;
          a.x -= o * nx; a.y -= o * ny; b.x += o * nx; b.y += o * ny;
        }
      }
    }
  }
  for (const p of ps) keepIn(p);
}
function keepIn(p) {
  const r = M().r;
  let lo = DB.l + r, hi = DB.r - r;
  if (df.wall) { if (p.side === 'L') hi = MID - WALL - r; else lo = MID + WALL + r; }
  if (p.x < lo) { p.x = lo; p.vx = Math.abs(p.vx); }
  if (p.x > hi) { p.x = hi; p.vx = -Math.abs(p.vx); }
  if (p.y < DB.t + r) { p.y = DB.t + r; p.vy = Math.abs(p.vy); }
  if (p.y > DB.b - r) { p.y = DB.b - r; p.vy = -Math.abs(p.vy); }
}
function dfStep(dt) {
  const gas = df.medium === 'gas';
  // Small enough steps that fast gas particles can't pass through each other
  const n = Math.max(1, Math.ceil(dt / 0.017), gas ? Math.ceil((3 * gasSD(df.T) * dt) / M().r) : 1);
  const h = dt / n, m = M(), sd = gas ? 0 : liquidSD(df.T), kick = Math.sqrt(2 * m.gamma * h) * sd;
  for (let k = 0; k < n; k++) {
    for (const p of df.ps) {
      p.side = p.x < MID ? 'L' : 'R';
      if (!gas) {   // random kicks from the neighbours, with drag: a liquid's jostling
        p.vx += -m.gamma * p.vx * h + kick * gauss(); p.vy += -m.gamma * p.vy * h + kick * gauss();
      }
      p.x += p.vx * h; p.y += p.vy * h;
      keepIn(p);
    }
    collide(gas);
  }
  if (df.lifted > 0 && df.lifted < 1) df.lifted = Math.min(1, df.lifted + dt / 0.5);
  if (df.wall) return;
  df.t += dt;
  const col = df.ps.filter((p) => p.col), right = col.filter((p) => p.x > MID).length / col.length;
  df.since += dt;
  if (df.since >= 0.2) {
    df.since = 0;
    df.avg.push(right); if (df.avg.length > 10) df.avg.shift();
    const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
    df.trace.push({ t: df.t, f: mean(df.avg.slice(-5)) });   // the last second, to smooth out the wobble
    if (df.mixedAt === null && df.avg.length === 10 && mean(df.avg) >= EVEN) df.mixedAt = df.t;
    if (df.t > df.axis) df.axis *= 2;
  }
  df.trailSince += dt;
  if (df.follow && df.trailSince >= 0.05) { df.trailSince = 0; df.trail.push({ x: df.follow.x, y: df.follow.y }); if (df.trail.length > 600) df.trail.shift(); }
}
// How many are in each half: once the divider is up, the same 1-second average the graph plots,
// so the numbers match the graph and don't flicker
const counts = () => {
  const col = df.ps.filter((p) => p.col), last = df.trace[df.trace.length - 1];
  const right = !df.wall && last ? Math.round(last.f * col.length) : col.filter((p) => p.x > MID).length;
  return { left: col.length - right, right, total: col.length };
};

let GREEN = '#2e7d32';   // lighter in a dark theme: set in drawDiffusion
function netArrow(x1, y, x2, width, col) {
  const dir = Math.sign(x2 - x1), head = Math.max(10, width * 2.2);
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x1, y - width / 2); ctx.lineTo(x2 - dir * head, y - width / 2); ctx.lineTo(x2 - dir * head, y - head * 0.7);
  ctx.lineTo(x2, y); ctx.lineTo(x2 - dir * head, y + head * 0.7); ctx.lineTo(x2 - dir * head, y + width / 2); ctx.lineTo(x1, y + width / 2);
  ctx.closePath(); ctx.fill();
}
function drawDiffusion(c) {
  GREEN = PK.isDark() ? '#81c784' : '#2e7d32';
  const m = M(), view = pressed('view'), liquid = df.medium === 'liquid';
  // Key
  if (view === 'particles') {
    ctx.fillStyle = m.col; ctx.beginPath(); ctx.arc(DB.l + 8, 24, 7, 0, Math.PI * 2); ctx.fill();
    tag(c, m.whatP, DB.l + 22, 24, c.text, 'left', 14, 700);
    const x2 = DB.l + 40 + ctx.measureText(m.whatP).width;
    ctx.fillStyle = m.other; ctx.beginPath(); ctx.arc(x2, 24, 7, 0, Math.PI * 2); ctx.fill();
    tag(c, `${m.into} particle`, x2 + 14, 24, c.text, 'left', 14, 700);
  } else tag(c, `What you’d see: the colour of the ${m.what}`, DB.l, 24, c.text, 'left', 14, 700);
  if (state.paused) tag(c, 'Paused', DB.r, 24, '#e65100', 'right', 13);
  // The container
  ctx.fillStyle = liquid ? 'rgba(144, 202, 249, .22)' : c.surface;
  ctx.fillRect(DB.l, DB.t, DB.r - DB.l, DB.b - DB.t);
  ctx.save(); ctx.beginPath(); ctx.rect(DB.l, DB.t, DB.r - DB.l, DB.b - DB.t); ctx.clip();
  if (view === 'particles') {
    dots(df.ps.filter((p) => !p.col), m.dr, m.other);   // dr: the size drawn (gas particles are drawn a little bigger than they bump)
    dots(df.ps.filter((p) => p.col), m.dr, m.col);
  } else {
    // Shade each strip by how many coloured particles are in it, as your eye would see the colour
    const strip = 20, n = Math.round((DB.r - DB.l) / strip), cnt = new Array(n).fill(0);
    for (const p of df.ps) if (p.col) cnt[Math.min(n - 1, Math.floor((p.x - DB.l) / strip))]++;
    const full = m.nCol / (n / 2), wt = [1, 2, 3, 4, 5, 4, 3, 2, 1], rgb = m.col.match(/\w\w/g).map((h) => parseInt(h, 16)).join(', ');
    const grad = ctx.createLinearGradient(DB.l, 0, DB.r, 0);
    for (let i = 0; i < n; i++) {
      let s = 0, w = 0;
      for (let k = -4; k <= 4; k++) { const j = Math.min(n - 1, Math.max(0, i + k)); s += wt[k + 4] * cnt[j]; w += wt[k + 4]; }
      grad.addColorStop((i + 0.5) / n, `rgba(${rgb}, ${Math.min(0.9, (0.9 * s) / w / full).toFixed(3)})`);
    }
    ctx.fillStyle = grad; ctx.fillRect(DB.l, DB.t, DB.r - DB.l, DB.b - DB.t);
  }
  // One coloured particle's path
  if ($('follow').checked && df.follow) {
    const f = df.follow;
    if (df.trail.length > 1) {
      ctx.strokeStyle = PK.isDark() ? '#ffe082' : '#212121'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(df.trail[0].x, df.trail[0].y);
      for (const q of df.trail) ctx.lineTo(q.x, q.y);
      ctx.lineTo(f.x, f.y); ctx.stroke(); ctx.lineWidth = 1;
    }
    ctx.strokeStyle = '#ff6f00'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(f.x, f.y, m.r + 4, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
  }
  // The divider slides up out of the way when it's lifted
  if (df.lifted < 1) {
    const top = DB.t - (DB.b - DB.t) * df.lifted;
    ctx.fillStyle = c.text; ctx.fillRect(MID - WALL, top, 2 * WALL, DB.b - DB.t);
  }
  ctx.restore();
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.strokeRect(DB.l, DB.t, DB.r - DB.l, DB.b - DB.t); ctx.lineWidth = 1;
  if (df.wall) tag(c, 'divider', MID, DB.t - 9, c.muted, 'center', 12, 700);
  // How many are in each half, and which way the net movement is
  const n = counts();
  tag(c, `Left half: ${n.left}`, DB.l, 309, c.text, 'left', 15);
  tag(c, `Right half: ${n.right}`, DB.r, 309, c.text, 'right', 15);
  const diff = (n.left - n.right) / n.total;
  if (!df.wall && df.mixedAt === null && diff > 0) {
    const w = 3 + 9 * diff;
    netArrow(MID - 60, 309, MID + 60, w, '#e65100');
    tag(c, 'net movement', MID + 70, 309, '#e65100', 'left', 13, 800);
  } else if (df.mixedAt !== null) {
    netArrow(MID - 8, 304, MID + 52, 3, GREEN); netArrow(MID + 44, 314, MID - 16, 3, GREEN);
    tag(c, 'evenly spread: no net movement', MID - 22, 309, GREEN, 'right', 13, 800);
  }
  drawGraph(c);
}
function drawGraph(c) {
  const x0 = 70, x1 = DB.r, y0 = 344, y1 = 432, top = 60, ax = df.axis;
  const X = (t) => x0 + ((x1 - x0) * t) / ax, Y = (f) => y1 - ((y1 - y0) * f * 100) / top;
  tag(c, `% of the ${M().what} particles in the right half`, DB.l, 331, c.text, 'left', 14, 700);
  ctx.strokeStyle = c.border; ctx.lineWidth = 1;
  ctx.font = `600 13px ${c.font}`; ctx.fillStyle = c.muted; ctx.textBaseline = 'middle';
  for (const v of [0, 20, 40, 60]) {
    ctx.beginPath(); ctx.moveTo(x0, Y(v / 100)); ctx.lineTo(x1, Y(v / 100)); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(`${v}%`, x0 - 6, Y(v / 100));
  }
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) ctx.fillText(String((ax * i) / 4), X((ax * i) / 4), y1 + 12);
  ctx.fillText('Time (s)', (x0 + x1) / 2, y1 + 28);
  // Evenly spread: within 5% of half on each side
  ctx.fillStyle = 'rgba(46, 125, 50, .14)'; ctx.fillRect(x0, Y(1 - EVEN), x1 - x0, Y(EVEN) - Y(1 - EVEN));
  ctx.setLineDash([5, 4]); ctx.strokeStyle = GREEN;
  ctx.beginPath(); ctx.moveTo(x0, Y(0.5)); ctx.lineTo(x1, Y(0.5)); ctx.stroke(); ctx.setLineDash([]);
  tag(c, 'evenly spread (about half)', x1 - 4, Y(1 - EVEN) - 9, GREEN, 'right', 12, 800);
  const line = (trace, col, width) => {
    if (trace.length < 2) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0 - 6, x1 - x0, y1 - y0 + 6); ctx.clip();
    ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (const q of trace) ctx.lineTo(X(q.t), Y(q.f));
    ctx.stroke(); ctx.restore();
  };
  if (df.last) {
    line(df.last.trace, c.muted, 1.5);
    const end = df.last.trace[df.last.trace.length - 1], text = `last time: ${df.last.medium}, ${df.last.temp} °C`;
    ctx.font = `700 12px ${c.font}`;
    const tw = ctx.measureText(text).width, fits = X(end.t) + 8 + tw < x1;
    if (end.t < ax) tag(c, text, fits ? X(end.t) + 8 : X(end.t) - 8, Math.max(y0 + 10, Y(end.f)), c.muted, fits ? 'left' : 'right', 12, 700);
    else tag(c, text, x1 - 4, Y(0.5) + 12, c.muted, 'right', 12, 700);
  }
  line(df.trace, M().col, 2.5);
  if (df.mixedAt !== null && df.mixedAt <= ax) {
    const at = df.trace.find((q) => q.t >= df.mixedAt) || df.trace[df.trace.length - 1];
    ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(X(df.mixedAt), Y(at.f), 6, 0, Math.PI * 2); ctx.fill();
    tag(c, `even after ${df.mixedAt.toFixed(0)} s`, X(df.mixedAt), Y(at.f) + 16, GREEN, 'center', 12, 800);
  }
}

// ---------- Words ----------

const INTRO = {
  brownian: 'In a smoke cell, a bright light shines on smoke trapped in a tiny glass box, and you look through a microscope. Each smoke particle looks like a speck of light that jiggles about at random. This is Brownian motion, and it’s evidence that air is made of tiny particles that are always moving.',
  diffusion: 'Lift the divider and watch the coloured particles spread out until they are evenly mixed. This is diffusion. Compare a gas with a liquid, and try different temperatures.',
};
const WHY = {
  brownian: `<p>Air is made of tiny particles that move very fast in random directions. They’re far too small to see, even with a microscope. A smoke particle is much bigger, so you can see it as a speck of light.</p>
    <p>Air particles hit the smoke particle from every side. At any one time, more of them hit one side than the other, so it’s pushed one way, then another. This random, jerky movement is called <b>Brownian motion</b>.</p>
    <p><b>Hotter air:</b> the air particles move faster, so they hit harder and more often, and the smoke particle jiggles more. <b>A bigger particle</b> jiggles less: it has more mass, and the hits on different sides balance out more.</p>
    <p><b>Why it matters:</b> in 1827, Robert Brown saw tiny particles from pollen grains jiggling in water, but couldn’t explain it. In 1905, Albert Einstein explained it with moving particles, and experiments soon after convinced scientists that atoms and molecules are real.</p>`,
  diffusion: `<p><b>Diffusion</b> is the spreading out of particles from where there are lots of them (a high concentration) to where there are fewer (a low concentration). It happens in gases and liquids because their particles move about at random.</p>
    <p>No particle “knows” where to go: each one moves in a random direction. But there are more coloured particles on the left, so more of them happen to cross to the right than cross back. That’s the <b>net movement</b>, from high to low concentration. Once they’re evenly spread, they keep moving, but as many cross each way, so nothing changes overall.</p>
    <p><b>Gases diffuse faster than liquids.</b> In a liquid the particles are touching, so each one keeps bumping into its neighbours and can’t get far. <b>Heating speeds diffusion up</b>, because the particles move faster. In a solid, the particles only vibrate about fixed positions, so diffusion is extremely slow.</p>
    <p>Real diffusion is slower than this: dye can take hours to spread through still water. You see it when you smell perfume across a room, when a tea bag colours hot water, and when oxygen passes into your blood in your lungs.</p>`,
};

function renderInfo() {
  if (state.tab === 'brownian') {
    const v = airSpeed(), size = pressed('size');
    let html = `<dl class="readout"><dt>Temperature of the air</dt><dd>${PK.num('btemp')} °C</dd><dt>Typical speed of an air particle</dt><dd>about ${PK.sig(v, 2)} m/s</dd></dl>`;
    html += $('air').checked
      ? '<p>The air particles (blue) move very fast and keep hitting the smoke particle. Each orange flash is a hit. At any one time, more hit one side than the other, so the smoke particle is pushed about at random.</p>'
      : '<p>The smoke particle moves in a random, jerky zigzag, but you can’t see anything pushing it. What could be making it move? Tick <b>Show the air particles</b> to find out.</p>';
    if (pressed('bspeed') !== '1') html += '<p>In slow motion you can watch each hit.</p>';
    html += `<p>${v > 560 ? 'The air is hot, so its particles move faster and hit harder: the smoke particle jiggles more.' : v < 495 ? 'The air is cold, so its particles move more slowly and hit less hard: the smoke particle jiggles less.' : 'Try heating the air, or a larger smoke particle.'}${size === 'large' ? ' A large particle has more mass, and is hit from all sides at once, so it jiggles less.' : ''}</p>`;
    html += '<p>That’s faster than a passenger jet! The ones here are slowed right down so that you can follow them.</p>';
    $('info').innerHTML = html;
    return;
  }
  const m = M(), n = counts();
  let html = `<dl class="readout"><dt>Time</dt><dd>${df.wall ? '–' : `${df.t.toFixed(1)} s`}</dd><dt>Time to spread evenly</dt><dd>${df.mixedAt === null ? 'not yet' : `${df.mixedAt.toFixed(1)} s`}</dd></dl>`;
  if (df.wall) html += `<p>All ${n.total} ${m.what} particles are on the left. The right half has only ${m.into} particles. Predict what will happen, then press <b>Lift the divider</b>.</p>`;
  else if (df.mixedAt === null) html += `<p>Every particle moves in a random direction. There are more ${m.what} particles on the left, so more of them happen to move right than move back. The <b>net movement</b> is from a high concentration to a low concentration. It slows down as the difference gets smaller. Watch the graph reach the green band.</p>`;
  else html += `<p><b>Evenly spread.</b> About half the ${m.what} particles are on each side. They’re still moving, but now as many cross each way as cross back, so there’s no net movement and the colour stays even. The numbers wobble a little because there are only a few hundred particles here. A real gas or liquid has billions of billions, so the wobble is far too small to notice.</p>`;
  if (df.last && df.last.mixedAt !== null) html += `<p>Last time (${df.last.medium}, ${df.last.temp} °C) it took ${df.last.mixedAt.toFixed(1)} s.</p>`;
  $('info').innerHTML = html;
}

// ---------- Controls ----------

function syncLift() {
  $('lift').disabled = !df.wall;
  $('lift').textContent = df.wall ? '▶ Lift the divider' : 'Divider lifted';
}
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = WHY[t];
  cv.setAttribute('aria-label', t === 'brownian' ? 'A smoke particle seen through a microscope, jiggling about' : 'A container with a divider, and a graph of how far the particles have spread');
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'brownian' ? location.pathname + location.search : `#${t}`);
  renderInfo();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
const pick = (id, fn) => document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll(`#${id} .chip`).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  fn();
}));
pick('size', () => { brSize(); renderInfo(); });
pick('bspeed', renderInfo);
pick('dspeed', () => {});
pick('medium', () => { dfSetup(); renderInfo(); });
pick('view', () => {});
$('btemp').addEventListener('input', () => { brTemp(); renderInfo(); });
$('dtemp').addEventListener('input', () => { dfSetup(); renderInfo(); });
$('air').addEventListener('change', renderInfo);
$('follow').addEventListener('change', () => { pickFollow(); });
$('clear').addEventListener('click', () => { br.path = [{ x: br.p.x, y: br.p.y }]; });
$('pause').addEventListener('click', () => {
  state.paused = !state.paused;
  $('pause').textContent = state.paused ? '▶ Play' : '⏸ Pause';
});
$('lift').addEventListener('click', () => {
  if (!df.wall) return;
  df.wall = false; df.lifted = 0.01;
  if (state.paused) $('pause').click();
  syncLift(); renderInfo();
});
$('reset').addEventListener('click', () => { dfSetup(); renderInfo(); });

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  if (!state.paused) {
    if (state.tab === 'brownian') brStep(dt * Number(pressed('bspeed')));
    else dfStep(dt * Number(pressed('dspeed')));
  }
  if (cv.clientWidth) {
    const c = colours();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    if (state.tab === 'brownian') drawBrownian(c); else drawDiffusion(c);
  }
  tick += dt;
  if (tick > 0.25) { tick = 0; if (state.tab === 'diffusion') renderInfo(); }
  requestAnimationFrame(frame);
}

brSetup();
dfSetup();
showTab(PK.initialHash === '#diffusion' ? 'diffusion' : 'brownian');
requestAnimationFrame(frame);
