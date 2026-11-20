// Stars, galaxies & light years (KS3).
// Stars: the Sun and four other stars drawn to the same scale as each other, with their colours,
// temperatures and distances. The two supergiants are drawn as if they were where the Sun is, with
// the planets' orbits round them.
// Galaxies: the Milky Way from above (with where the Sun is), then zooming out to the Local Group, our
// supercluster (Laniakea) and the whole universe we can see; and a field of galaxies of different shapes.
// Light years: a pulse of light sent out for a second, a minute… four years, drawn to scale, with
// the distance worked out as speed × time.

PK.header({
  title: 'Stars, galaxies & light years',
  spec: [
    { code: 'KS3', text: 'Our Sun as a star, other stars in our galaxy, other galaxies' },
    { code: 'KS3', text: 'The light year as a unit of astronomical distance' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene');
let ctx = cv.getContext('2d');   // swapped for a hidden canvas while a galaxy picture is drawn once and kept
const W = 800, H = 470, CX = 400, CY = 235, TAU = Math.PI * 2;
const SPACE = '#0b1020', INK = '#eceff1', DIM = '#9aa5c4', LIGHT = '#ffe082';
const C = 300000, LY = 9.4608e12;   // the speed of light (km/s), and a light year (km), using 365 days
const state = { tab: 'stars' };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const spaced = (n) => { const s = String(Math.round(n)); return s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s; };
const NOW = new Date().getFullYear();

const font = () => PK.cssVar('--font-body') || 'sans-serif';
function tag(text, x, y, col = INK, align = 'center', size = 14, weight = 700) {
  ctx.font = `${weight} ${size}px ${font()}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = SPACE; ctx.strokeText(text, x, y);
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
let seed = 11;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const gauss = () => { let s = 0; for (let k = 0; k < 4; k++) s += rand(); return (s - 2) * 1.7; };
const SKY = Array.from({ length: 170 }, () => ({ x: rand() * W, y: rand() * H, s: rand() < 0.15 ? 1.4 : 0.8, a: 0.25 + rand() * 0.5 }));
function sky(n = SKY.length) {
  ctx.fillStyle = SPACE; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  for (let k = 0; k < n; k++) { const s = SKY[k]; ctx.globalAlpha = s.a; ctx.fillRect(s.x, s.y, s.s, s.s); }
  ctx.globalAlpha = 1;
}
function glowBall(x, y, r, col, rim) {
  const halo = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 1.6 + 6);
  halo.addColorStop(0, col); halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.35; ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 1.6 + 6, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  // Brightest in the middle, darker towards the edge, as stars look
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, r > 40 ? col : '#ffffff'); g.addColorStop(r > 40 ? 0.55 : 0.35, col); g.addColorStop(1, rim);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, Math.max(r, 0.8), 0, TAU); ctx.fill();
}
function dashedCircle(x, y, r, col, label, lx, ly, align = 'left') {
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
  if (label) tag(label, lx, ly, col, align, 13, 700);
}
function scaleBar(px, text) {
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(16, H - 40); ctx.lineTo(16 + px, H - 40); ctx.moveTo(16, H - 45); ctx.lineTo(16, H - 35); ctx.moveTo(16 + px, H - 45); ctx.lineTo(16 + px, H - 35); ctx.stroke(); ctx.lineWidth = 1;
  tag(text, 24 + px, H - 40, INK, 'left', 13, 700);
}

// ---------- Stars ----------
// R: radius compared with the Sun's; temp: surface temperature (°C); ly: distance (light years)
const STARS = {
  sun: { name: 'The Sun', kind: 'A medium-sized yellow star', R: 1, temp: 5500, ly: 8.3 / (60 * 24 * 365.25), col: '#ffe9a8', rim: '#f9a825', colour: 'yellowish white',
    bright: 'Far too bright to look at: never look at the Sun, even through sunglasses.', fact: 'The Sun is about 4.6 billion years old, about halfway through its life. Every second, nuclear fusion in its core turns about 600 million tonnes of hydrogen into helium.' },
  proxima: { name: 'Proxima Centauri', kind: 'A red dwarf', R: 0.154, temp: 2800, ly: 4.24, col: '#ff8a50', rim: '#bf360c', colour: 'red',
    bright: 'Too faint to see without a telescope, and it never rises above the horizon in the UK.', fact: 'The nearest star to the Sun. It has at least one planet. Red dwarfs are the most common kind of star, but they are so faint that you can’t see a single one without a telescope.' },
  sirius: { name: 'Sirius', kind: 'A white star', R: 1.71, temp: 9700, ly: 8.6, col: '#dfe9ff', rim: '#7aa2e3', colour: 'bluish white',
    bright: 'The brightest star in the night sky. From the UK, look low in the south on winter evenings, down and to the left of Orion.', fact: 'It gives out about 25 times as much light as the Sun. It also looks bright because it’s one of the nearest stars to us.' },
  betelgeuse: { name: 'Betelgeuse', kind: 'A red supergiant', R: 764, temp: 3300, ly: 550, col: '#ff7043', rim: '#8e2a10', colour: 'orange-red',
    bright: 'One of the brightest stars: the orange-red star at Orion’s shoulder, easy to see on winter evenings.', fact: 'It’s near the end of its life. Some time in the next 100 000 years it will explode as a supernova, bright enough to see in the daytime.' },
  rigel: { name: 'Rigel', kind: 'A blue supergiant', R: 79, temp: 11800, ly: 860, col: '#b9d0ff', rim: '#3f6fd8', colour: 'blue-white',
    bright: 'One of the brightest stars: the blue-white star at Orion’s foot, opposite Betelgeuse.', fact: 'It gives out more than 100 000 times as much light as the Sun. Hot, blue-white stars like this are rare, and burn out quickly.' },
};
// How many pixels one Sun-radius is: the same scale for the Sun, Proxima Centauri and Sirius
const starScale = (k) => (k === 'rigel' ? 150 / 79 : k === 'betelgeuse' ? 150 / 764 : 60);
function drawStars() {
  sky();
  const k = pressed('star'), s = STARS[k], px = starScale(k);
  tag(px === 60 ? 'Drawn to scale: the Sun, Proxima Centauri and Sirius' : `Drawn to scale, as if ${s.name} were where the Sun is`, 16, 22, DIM, 'left', 14, 700);
  if (px === 60) {
    const sunX = k === 'sun' ? 280 : 210;
    glowBall(sunX, CY, 60, STARS.sun.col, STARS.sun.rim);
    tag('the Sun', sunX, CY + 84, INK, 'center', 15, 800);
    if (k === 'sun') {
      // Jupiter and the Earth, to the same scale
      ctx.fillStyle = '#d7a86e'; ctx.beginPath(); ctx.arc(480, CY, 0.1005 * px, 0, TAU); ctx.fill();
      tag('Jupiter', 480, CY + 22, INK, 'center', 14);
      ctx.fillStyle = '#64b5f6'; ctx.beginPath(); ctx.arc(600, CY, 1, 0, TAU); ctx.fill();
      tag('the Earth (a dot)', 600, CY + 22, INK, 'center', 14);
      tag('109 Earths would fit across the Sun', 540, CY - 40, DIM, 'center', 13, 600);
    } else {
      const x = k === 'sirius' ? 520 : 520;
      glowBall(x, CY, s.R * px, s.col, s.rim);
      tag(s.name, x, CY + Math.max(s.R * px, 10) + 24, INK, 'center', 15, 800);
      if (k === 'proxima') {
        ctx.fillStyle = '#d7a86e'; ctx.beginPath(); ctx.arc(640, CY, 0.1005 * px, 0, TAU); ctx.fill();
        tag('Jupiter', 640, CY + 24, DIM, 'center', 13, 700);
      }
    }
    scaleBar((1e6 / 696000) * px, '1 million km');
  } else {
    const x = CX + 30, r = s.R * px;
    glowBall(x, CY, r, s.col, s.rim);
    // The planets' orbits round the Sun, to the same scale (1 AU is 215 Sun-radii)
    if (k === 'betelgeuse') {
      dashedCircle(x, CY, 215 * px, 'rgba(255, 255, 255, .85)', 'Earth’s orbit', x, CY - 215 * px - 10, 'center');
      dashedCircle(x, CY, 327.7 * px, 'rgba(255, 255, 255, .85)', 'Mars’s orbit', x, CY - 327.7 * px - 10, 'center');
      dashedCircle(x, CY, 1118 * px, '#ffcc80', 'Jupiter’s orbit', x + 1118 * px * 0.72 + 8, CY - 1118 * px * 0.69, 'left');
    } else dashedCircle(x, CY, 83.2 * px, '#ffcc80', 'Mercury’s orbit', x + 83.2 * px * 0.72 + 8, CY - 83.2 * px * 0.69 - 4, 'left');
    ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(x, CY, Math.max(1.4, px), 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff59d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 6, CY + 6); ctx.lineTo(x - 70, CY + 70); ctx.stroke(); ctx.lineWidth = 1;
    tag('the Sun, to the same scale', x - 74, CY + 80, '#fff59d', 'right', 14, 800);
    tag(s.name, x, CY + r + 22, INK, 'center', 16, 800);
    const km = k === 'rigel' ? 100 : 500;
    scaleBar(((km * 1e6) / 696000) * px, `${km} million km`);
  }
}

// ---------- Galaxies ----------
// The Milky Way: a bar and four spiral arms, about 100 000 light years across (radius 200 px)
const GAL = [];
for (let k = 0; k < 520; k++) { const r = Math.abs(gauss()) * 16, a = rand() * TAU; GAL.push({ x: r * Math.cos(a) * 1.3, y: r * Math.sin(a), c: '#ffe0b2', a: 0.5 + rand() * 0.5 }); }
for (let k = 0; k < 260; k++) { const t = (rand() - 0.5) * 2, d = gauss() * 5; GAL.push({ x: t * 48 * Math.cos(0.45) - d * Math.sin(0.45), y: t * 48 * Math.sin(0.45) + d * Math.cos(0.45), c: '#ffe0b2', a: 0.4 + rand() * 0.5 }); }
for (let arm = 0; arm < 4; arm++) {
  for (let k = 0; k < 520; k++) {
    const th = rand() * 6.9, r = 38 * Math.exp(0.24 * th), ang = th + arm * (Math.PI / 2) + 0.45, sp = gauss() * (3 + r * 0.07);
    GAL.push({ x: r * Math.cos(ang) - sp * Math.sin(ang), y: r * Math.sin(ang) + sp * Math.cos(ang), c: rand() < 0.04 ? '#ff8a80' : rand() < 0.5 ? '#c5d4ff' : '#eef2ff', a: 0.35 + rand() * 0.6 });
  }
}
for (let k = 0; k < 500; k++) { const r = 20 + rand() * 190, a = rand() * TAU; GAL.push({ x: r * Math.cos(a), y: r * Math.sin(a), c: '#b0bec5', a: 0.15 + rand() * 0.25 }); }
// A galaxy made from the Milky Way's dots: centre, radius (px), squash (seen at an angle), turn
function galaxy(x, y, r, squash = 1, turn = 0, alpha = 1, every = 1) {
  if (x + r < 0 || x - r > W || y + r < 0 || y - r > H) return;
  alpha *= fade;
  const k = r / 200, cs = Math.cos(turn), sn = Math.sin(turn);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.35);
  g.addColorStop(0, 'rgba(255, 236, 200, .55)'); g.addColorStop(1, 'rgba(255, 236, 200, 0)');
  ctx.save(); ctx.translate(x, y); ctx.rotate(turn); ctx.scale(1, squash); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, TAU); ctx.fill(); ctx.restore();
  const dot = Math.max(0.6, Math.min(1.6, r / 110));
  for (let n = 0; n < GAL.length; n += every) {
    const p = GAL[n], px = p.x * k, py = p.y * k * squash;
    ctx.globalAlpha = p.a * alpha; ctx.fillStyle = p.c;
    ctx.fillRect(x + px * cs - py * sn, y + px * sn + py * cs, dot, dot);
  }
  ctx.globalAlpha = 1;
}
function blob(x, y, rx, ry, turn, col, a = 0.9) {
  if (x + rx < 0 || x - rx > W || y + rx < 0 || y - rx > H) return;
  a *= fade;
  ctx.save(); ctx.translate(x, y); ctx.rotate(turn); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
}
// The deep field: lots of galaxies of different shapes, sizes and colours
const FIELD = Array.from({ length: 150 }, () => {
  const t = rand();
  return { x: 20 + rand() * 760, y: 40 + rand() * 390, r: 2 + Math.pow(rand(), 3) * 16, turn: rand() * Math.PI, sq: 0.3 + rand() * 0.7, kind: t < 0.55 ? 'spiral' : t < 0.9 ? 'elliptical' : 'irregular', red: rand() };
});
// ---------- Zooming out ----------
// Four pictures, each drawn to scale (ly: light years per pixel). Each is 40 to 180 times further out
// than the one before; "at" is where the one before sits in it: the Milky Way in the Local Group,
// the Local Group in Laniakea, and Laniakea in the middle of the universe we can see.
const LEVELS = ['milky', 'local', 'super', 'universe'];
const LV = {
  milky: { ly: 250 },
  local: { ly: 1e4, at: [CX - 125, CY + 30] },
  super: { ly: 1.25e6, at: [CX - 150, CY + 70] },
  universe: { ly: 2.2e8, at: [CX, CY] },
};
// The Local Group (1 px is 10 000 light years)
const MW = LV.local.at, M31 = [CX + 120, CY - 35], M33 = [CX + 150, CY + 30];
const DWARFS = [];
for (let k = 0; k < 26; k++) { const r = 4 + rand() * 32, a = rand() * TAU; DWARFS.push([MW[0] + r * Math.cos(a), MW[1] + r * Math.sin(a), 0.7 + rand() * 1.1]); }
for (let k = 0; k < 32; k++) { const r = 5 + rand() * 40, a = rand() * TAU; DWARFS.push([M31[0] + r * Math.cos(a), M31[1] + r * Math.sin(a), 0.7 + rand() * 1.1]); }
for (let k = 0; k < 14; k++) { const r = 80 + rand() * 240, a = rand() * TAU; DWARFS.push([CX + r * Math.cos(a), CY + r * Math.sin(a) * 0.6, 0.7 + rand() * 1]); }
// Laniakea (1 px is 1.25 million light years): threads of galaxies running into the middle
const GA = [CX + 40, CY], VIRGO = [LV.super.at[0] + 32, LV.super.at[1] - 29];
const edgeR = (th) => 216 + 8 * Math.sin(3 * th + 1) + 5 * Math.sin(5 * th + 2);
const WEB2 = [];
function thread(x, y, ang, steps, len, spread, bright, out) {
  for (let s = 0; s < steps; s++) {
    const nx = x + len * Math.cos(ang), ny = y + len * Math.sin(ang);
    for (let k = 0; k < 11; k++) { const t = rand(); out.push([x + (nx - x) * t + gauss() * spread, y + (ny - y) * t + gauss() * spread, bright * (0.4 + rand() * 0.6)]); }
    if (rand() < 0.22 && steps > 4) thread(nx, ny, ang + (rand() < 0.5 ? 1 : -1) * (0.6 + rand() * 0.6), 3 + Math.floor(rand() * 3), len * 0.9, spread, bright * 0.9, out);
    if (rand() < 0.15) for (let k = 0; k < 40; k++) out.push([nx + gauss() * 2.5, ny + gauss() * 2.5, bright]);
    x = nx; y = ny; ang += (rand() - 0.5) * 0.7;
  }
}
for (let b = 0; b < 10; b++) thread(GA[0], GA[1], (b / 10) * TAU + rand() * 0.4, 9 + Math.floor(rand() * 4), 19, 3.5, 1, WEB2);
// The thread from the middle out to the Virgo Cluster and us
for (const [p, q] of [[GA, VIRGO], [VIRGO, LV.super.at]]) for (let k = 0; k < 160; k++) { const t = rand(); WEB2.push([p[0] + (q[0] - p[0]) * t + gauss() * 3, p[1] + (q[1] - p[1]) * t + gauss() * 3, 0.5 + rand() * 0.5]); }
for (let k = 0; k < 260; k++) WEB2.push([VIRGO[0] + gauss() * 2.6, VIRGO[1] + gauss() * 2.6, 1]);
for (let k = 0; k < 220; k++) WEB2.push([GA[0] + gauss() * 4, GA[1] + gauss() * 4, 1]);
// Other superclusters round about, fainter
for (const [x, y] of [[40, 40], [770, 60], [760, 420], [60, 440], [700, 240], [120, 200]]) for (let b = 0; b < 3; b++) thread(x, y, rand() * TAU, 6, 18, 3.5, 0.45, WEB2);
// The universe we can see (1 px is 220 million light years): a web of threads, with empty voids between
const UR = 211, NODES = [];
for (let tries = 0; NODES.length < 120 && tries < 5000; tries++) {
  const r = Math.sqrt(rand()) * (UR + 20), a = rand() * TAU, x = CX + r * Math.cos(a), y = CY + r * Math.sin(a);
  if (NODES.every(([u, v]) => Math.hypot(u - x, v - y) > 25)) NODES.push([x, y]);
}
const WEB3 = [];
NODES.forEach(([x, y], i) => {
  NODES.map(([u, v], j) => ({ j, d: Math.hypot(u - x, v - y) })).filter((o) => o.j > i).sort((a, b) => a.d - b.d).slice(0, 2 + Math.floor(rand() * 2)).forEach(({ j, d }) => {
    if (d > 70) return;
    const [u, v] = NODES[j], bend = (rand() - 0.5) * 12, nx = -(v - y) / d, ny = (u - x) / d;
    for (let k = 0; k < d * 0.9; k++) { const t = rand(), b = bend * Math.sin(Math.PI * t); WEB3.push([x + (u - x) * t + nx * b + gauss() * 1.2, y + (v - y) * t + ny * b + gauss() * 1.2, 0.35 + rand() * 0.5]); }
  });
  for (let k = 0; k < 14; k++) WEB3.push([x + gauss() * 2, y + gauss() * 2, 0.9]);
});
function dots(list, col) {
  ctx.fillStyle = col;
  for (const [x, y, a] of list) {
    const X = vx(x), Y = vy(y);
    if (X < -2 || X > W + 2 || Y < -2 || Y > H + 2) continue;
    ctx.globalAlpha = a * fade; ctx.fillRect(X, Y, 1, 1);
  }
  ctx.globalAlpha = 1;
}
// What's drawn at each level and zooms with it (the labels are added once the zoom stops)
// Where a picture is drawn while zooming (x → x k + ox), and how faded it is
let view = { k: 1, ox: 0, oy: 0 }, fade = 1;
const vx = (x) => x * view.k + view.ox, vy = (y) => y * view.k + view.oy;
function layer(v) {
  const k = view.k;
  if (v === 'milky') galaxy(vx(CX), vy(CY), 200 * k);
  else if (v === 'local') {
    for (const [x, y, r] of DWARFS) blob(vx(x), vy(y), r * 2.2 * k, r * 1.8 * k, 0, 'rgba(225, 232, 255, 1)', 1);
    galaxy(vx(MW[0]), vy(MW[1]), 5 * k, 1, 0, 1);
    blob(vx(MW[0] + 11), vy(MW[1] + 12), 1.6 * k, 1.2 * k, 0.4, 'rgba(220, 228, 255, .95)', 1);
    blob(vx(MW[0] + 16), vy(MW[1] + 14), 1.1 * k, 0.8 * k, 0.2, 'rgba(220, 228, 255, .9)', 1);
    galaxy(vx(M31[0]), vy(M31[1]), 11 * k, 0.32, -0.6, 1);
    galaxy(vx(M33[0]), vy(M33[1]), 3 * k, 0.8, 0.5, 1);
  } else if (v === 'super') {
    dots(WEB2, '#f3e5c8');
    blob(vx(VIRGO[0]), vy(VIRGO[1]), 7 * k, 7 * k, 0, 'rgba(255, 236, 200, .7)', 0.8);
    blob(vx(GA[0]), vy(GA[1]), 9 * k, 9 * k, 0, 'rgba(255, 236, 200, .7)', 0.8);
    blob(vx(LV.super.at[0]), vy(LV.super.at[1]), 2.5 * k, 2.5 * k, 0, 'rgba(255, 245, 157, .9)', 1);
  } else if (v === 'universe') {
    const ux = vx(CX), uy = vy(CY);
    ctx.save(); ctx.beginPath(); ctx.arc(ux, uy, UR * k, 0, TAU); ctx.clip();
    dots(WEB3, '#d9e0ff');
    for (const [x, y] of NODES) blob(vx(x), vy(y), 4 * k, 4 * k, 0, 'rgba(255, 230, 200, .6)', 0.7);
    ctx.restore();
    const g = ctx.createRadialGradient(ux, uy, (UR - 6) * k, ux, uy, (UR + 10) * k);
    g.addColorStop(0, 'rgba(255, 152, 0, 0)'); g.addColorStop(0.45, 'rgba(255, 152, 0, .55)'); g.addColorStop(1, 'rgba(255, 152, 0, 0)');
    ctx.globalAlpha = fade; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ux, uy, (UR + 10) * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  } else shapesLayer();
}
function shapesLayer() {
  for (const g of FIELD) {
    const col = g.kind === 'elliptical' ? `rgba(255, ${200 + g.red * 40 | 0}, ${150 + g.red * 40 | 0}, .9)` : g.kind === 'irregular' ? 'rgba(200, 215, 255, .8)' : `rgba(${200 + g.red * 50 | 0}, 215, 255, .9)`;
    if (g.kind === 'irregular') { blob(g.x, g.y, g.r * 0.7, g.r * 0.5, g.turn, col); blob(g.x + g.r * 0.4, g.y - g.r * 0.2, g.r * 0.4, g.r * 0.3, g.turn, col); }
    else if (g.kind === 'spiral' && g.r > 7) galaxy(g.x, g.y, g.r, g.sq, g.turn, 0.55 + g.red * 0.3, 2);
    else blob(g.x, g.y, g.r, g.r * g.sq, g.turn, col);
  }
  // Three examples, bigger, with labels
  ctx.fillStyle = 'rgba(11, 16, 32, .85)'; ctx.fillRect(470, 300, 320, 160);
  ctx.strokeStyle = 'rgba(160, 170, 200, .5)'; ctx.strokeRect(470, 300, 320, 160);
  galaxy(540, 370, 34, 0.75, 0.3, 1);
  for (let n = 0; n < 3; n++) blob(650, 370, 30 - n * 8, 20 - n * 5, 0.4, 'rgba(255, 224, 180, .9)', 1);
  for (const [dx, dy, r, c] of [[-8, -6, 12, '200, 215, 255'], [8, 6, 10, '200, 215, 255'], [-12, 10, 7, '255, 170, 200'], [12, -10, 6, '220, 230, 255'], [0, 0, 8, '235, 240, 255']]) blob(742 + dx, 370 + dy, r, r * 0.75, 0.5, `rgba(${c}, .95)`, 1);
}
// A yellow ring round where we are, with a label
function here(x, y, r, text, lx, ly, align) {
  ctx.strokeStyle = '#fff59d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  const a = Math.atan2(ly - y, lx - x);
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a)); ctx.lineTo(lx - Math.cos(a) * 6, ly - Math.sin(a) * 10); ctx.stroke(); ctx.lineWidth = 1;
  tag(text, lx, ly, '#fff59d', align, 15, 800);
}
function labels(v) {
  if (v === 'milky') {
    // The Sun is about 26 000 light years from the centre
    here(CX + 104 * Math.cos(2.2), CY + 104 * Math.sin(2.2), 7, 'You are here: the Sun', CX - 104, CY + 130, 'right');
    tag('The Milky Way, from above', 16, 22, DIM, 'left', 14, 700);
    scaleBar(40, '10 000 light years');
    // From the side: a thin disc with a bulge in the middle
    const bx = 692, by = 372;
    ctx.fillStyle = 'rgba(11, 16, 32, .85)'; ctx.fillRect(bx - 86, by - 50, 172, 100);
    ctx.strokeStyle = 'rgba(160, 170, 200, .5)'; ctx.strokeRect(bx - 86, by - 50, 172, 100);
    blob(bx, by, 76, 3.5, 0, 'rgba(220, 228, 255, .95)', 1);
    blob(bx, by, 15, 10, 0, 'rgba(255, 224, 178, .95)', 1);
    tag('From the side', bx, by - 34, INK, 'center', 13, 800);
    tag('a thin disc', bx, by + 30, DIM, 'center', 12, 600);
  } else if (v === 'local') {
    here(MW[0], MW[1], 10, 'the Milky Way: you are here', MW[0] - 20, MW[1] - 46, 'center');
    tag('Magellanic Clouds', MW[0] + 26, MW[1] + 34, DIM, 'left', 13, 700);
    tag('the Andromeda galaxy', M31[0], M31[1] - 34, INK, 'center', 15, 800);
    tag('2.5 million light years away', M31[0], M31[1] - 16, DIM, 'center', 13, 700);
    tag('the Triangulum galaxy', M33[0], M33[1] + 20, INK, 'center', 14, 800);
    tag('The Local Group: more than 80 galaxies', 16, 22, DIM, 'left', 14, 700);
    tag('the faint smudges are small dwarf galaxies', W - 16, H - 40, DIM, 'right', 13, 600);
    scaleBar(100, '1 million light years');
  } else if (v === 'super') {
    ctx.strokeStyle = 'rgba(255, 213, 79, .55)'; ctx.setLineDash([5, 5]); ctx.beginPath();
    for (let j = 0; j <= 120; j++) { const th = (j / 120) * TAU, r = edgeR(th); if (j) ctx.lineTo(GA[0] + r * Math.cos(th), GA[1] + r * Math.sin(th)); else ctx.moveTo(GA[0] + r, GA[1]); }
    ctx.stroke(); ctx.setLineDash([]);
    tag('the edge of Laniakea', GA[0] + edgeR(-1.2) * Math.cos(-1.2) + 8, GA[1] + edgeR(-1.2) * Math.sin(-1.2) - 6, '#ffd54f', 'left', 13, 700);
    here(LV.super.at[0], LV.super.at[1], 8, 'you are here: the Local Group', LV.super.at[0] - 14, LV.super.at[1] + 44, 'right');
    tag('the Virgo Cluster', VIRGO[0] + 12, VIRGO[1] - 16, INK, 'left', 14, 800);
    tag('Laniakea, our supercluster: about 100 000 galaxies', 16, 22, DIM, 'left', 14, 700);
    scaleBar(100e6 / LV.super.ly, '100 million light years');
  } else if (v === 'universe') {
    here(CX, CY, 6, 'you are here', CX + 46, CY - 40, 'left');
    tag('the edge of the universe we can see', CX, CY + UR + 16, '#ffcc80', 'center', 13, 700);
    tag('The whole universe we can see', 16, 22, DIM, 'left', 14, 700);
    scaleBar(10e9 / LV.universe.ly, '10 billion light years');
  } else {
    tag('spiral', 540, 438, INK, 'center', 14, 800);
    tag('elliptical', 650, 438, INK, 'center', 14, 800);
    tag('irregular', 742, 438, INK, 'center', 14, 800);
    tag('Every smudge is a galaxy of billions of stars', 16, 22, DIM, 'left', 14, 700);
  }
}
// Each picture is drawn once on a hidden canvas and kept, as it has thousands of dots
const kept = { width: 0, pics: {} };
function picture(v) {
  if (kept.width !== cv.width) { kept.width = cv.width; kept.pics = {}; }
  if (!kept.pics[v]) {
    const c = document.createElement('canvas');
    c.width = cv.width; c.height = cv.height;
    const real = ctx;
    ctx = c.getContext('2d');
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    layer(v);
    ctx = real;
    kept.pics[v] = c;
  }
  return kept.pics[v];
}
// Halved copies of a picture, so it can be shrunk a long way without its one-pixel stars vanishing
function shrunk(v, s) {
  const pic = picture(v);
  if (!pic.halves) {
    pic.halves = [pic];
    for (let c = pic; c.width > 16;) {
      const d = document.createElement('canvas');
      d.width = c.width >> 1; d.height = c.height >> 1;
      d.getContext('2d').drawImage(c, 0, 0, d.width, d.height);
      pic.halves.push(d); c = d;
    }
  }
  return pic.halves[Math.min(pic.halves.length - 1, Math.max(0, Math.floor(Math.log2(1 / s))))];
}
const zoom = { shown: null, anim: null };
const ease = (t) => t * t * (3 - 2 * t);
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
// Part way through zooming out from one level to the next (p from 0 to 1)
function between(inner, outer, p) {
  // Zoom about the one point that's in the same place on the screen at the start and the end, so
  // where we are moves smoothly from the middle to its place in the bigger picture
  const Z = LV[outer].ly / LV[inner].ly, f = LV[outer].at, k = Math.pow(Z, 1 - p);
  const px = (f[0] * Z - CX) / (Z - 1), py = (f[1] * Z - CY) / (Z - 1);
  const a = ramp(p, 0.3, 0.95);
  if (a > 0.01) { view = { k, ox: px * (1 - k), oy: py * (1 - k) }; fade = a; layer(outer); view = { k: 1, ox: 0, oy: 0 }; fade = 1; }
  const b = 1 - ramp(p, 0.55, 0.98), s = k / Z;
  if (b > 0.01) { ctx.save(); ctx.globalAlpha = b; ctx.translate((f[0] - CX / Z - px) * k + px, (f[1] - CY / Z - py) * k + py); ctx.scale(s, s); ctx.drawImage(shrunk(inner, s), 0, 0, W, H); ctx.restore(); }
}
function drawGalaxies(now) {
  sky(pressed('gview') === 'milky' || zoom.shown === 'milky' ? 90 : 60);
  const target = pressed('gview');
  if (zoom.shown === null) zoom.shown = target;
  if (!zoom.anim && target !== zoom.shown) {
    const a = LEVELS.indexOf(zoom.shown), b = LEVELS.indexOf(target);
    if (a < 0 || b < 0) zoom.shown = target;   // galaxy shapes isn't part of the zoom
    else {
      const to = LEVELS[a + Math.sign(b - a)], outer = b > a ? to : zoom.shown, inner = b > a ? zoom.shown : to;
      zoom.anim = { from: zoom.shown, to, out: b > a, inner, outer, start: now, dur: 850 * Math.log10(LV[outer].ly / LV[inner].ly) };
    }
  }
  if (zoom.anim) {
    const z = zoom.anim, t = Math.min(1, Math.max(0, (now - z.start) / z.dur)), p = z.out ? ease(t) : 1 - ease(t);
    between(z.inner, z.outer, p);
    if (t >= 1) { zoom.shown = z.to; zoom.anim = null; }
    return;
  }
  ctx.drawImage(picture(zoom.shown), 0, 0, W, H);
  labels(zoom.shown);
}

// ---------- Light years ----------
// For each time: how long (s), the scene it's drawn in, and the words for the clock
const DAY_S = 86400, YEAR_S = 365 * DAY_S;
const SPANS = {
  s1: { t: 1, scene: 'moon', label: '1 second' },
  m1: { t: 60, scene: 'sun', label: '1 minute' },
  m8: { t: 500, scene: 'sun', label: '8⅓ minutes' },
  h1: { t: 3600, scene: 'planets', label: '1 hour' },
  d1: { t: DAY_S, scene: 'far', label: '1 day' },
  y1: { t: YEAR_S, scene: 'stars', label: '1 year' },
  y4: { t: 4.24 * YEAR_S, scene: 'stars', label: '4.24 years' },
};
// Each scene: where the light starts (x), and how many px one km is
const AUkm = 1.496e8;
const SCENES = {
  moon: { x0: 90, k: 600 / 384400 },
  sun: { x0: 60, k: 680 / AUkm },
  planets: { x0: 40 + 72, k: 72 / AUkm },
  far: { x0: 40 + 4, k: 4 / AUkm },
  stars: { x0: 60, k: 680 / (4.24 * LY) },
};
const lt = { start: performance.now() };
const RUN = 3;   // seconds to draw the light's journey
function clockText(span, f) {
  const t = span.t * f;
  if (span.t === 1) return `${t.toFixed(2)} s`;
  if (span.t === 60) return `${Math.floor(t)} s`;
  if (span.t === 500) return `${Math.floor(t / 60)} min ${String(Math.floor(t % 60)).padStart(2, '0')} s`;
  if (span.t === 3600) return `${Math.floor(t / 60)} min`;
  if (span.t === DAY_S) return `${Math.floor(t / 3600)} h ${String(Math.floor((t % 3600) / 60)).padStart(2, '0')} min`;
  if (span.t === YEAR_S) return `${Math.floor(t / DAY_S)} days`;
  return `${(t / YEAR_S).toFixed(2)} years`;
}
function planetMark(x, y, r, col, name, below = true) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  if (name) tag(name, x, y + (below ? r + 16 : -r - 14), INK, 'center', 14, 700);
}
function drawLight(now) {
  sky(110);
  const span = SPANS[pressed('span')], sc = SCENES[span.scene], f = Math.min(1, (now - lt.start) / (RUN * 1000));
  const y = CY + 30;
  // The scene
  if (span.scene === 'moon') {
    planetMark(sc.x0, y, 6371 * sc.k, '#42a5f5', 'Earth');
    planetMark(sc.x0 + 384400 * sc.k, y, Math.max(3, 1737 * sc.k), '#cfd8dc', 'the Moon');
    scaleBar(100000 * sc.k, '100 000 km');
  } else if (span.scene === 'sun') {
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(sc.x0, y, 12, 0, TAU); ctx.fill();
    tag('the Sun', sc.x0 + 4, y + 30, INK, 'center', 14, 700);
    for (const [r, n] of [[0.387, 'Mercury’s orbit'], [0.723, 'Venus’s orbit']]) {
      ctx.strokeStyle = 'rgba(160, 170, 200, .45)'; ctx.beginPath(); ctx.arc(sc.x0, y, r * AUkm * sc.k, -0.5, 0.5); ctx.stroke();
      tag(n, sc.x0 + r * AUkm * sc.k + 6, y + 22, DIM, 'left', 13, 700);
    }
    planetMark(sc.x0 + AUkm * sc.k, y, 4, '#42a5f5', 'Earth');
    scaleBar(50e6 * sc.k, '50 million km');
  } else if (span.scene === 'planets') {
    const sx = 40;
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(sx, y, 7, 0, TAU); ctx.fill();
    tag('Sun', sx, y + 24, INK, 'center', 13, 700);
    for (const [a, n, col] of [[1, 'Earth', '#42a5f5'], [1.524, '', '#e57373'], [5.2, 'Jupiter', '#d7a86e'], [9.54, 'Saturn', '#e8d39a']]) {
      ctx.strokeStyle = 'rgba(160, 170, 200, .4)'; ctx.beginPath(); ctx.arc(sx, y, a * 72, -0.6, 0.6); ctx.stroke();
      planetMark(sx + a * 72, y, n === 'Jupiter' ? 6 : n === 'Saturn' ? 5 : 3, col, n);
    }
    scaleBar(1e9 * sc.k, '1 billion km');
  } else if (span.scene === 'far') {
    const sx = 40;
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(sx, y, 5, 0, TAU); ctx.fill();
    tag('Sun', sx, y + 22, INK, 'center', 13, 700);
    for (const [a, n] of [[30.1, 'Neptune'], [39.5, 'Pluto']]) { ctx.strokeStyle = 'rgba(160, 170, 200, .4)'; ctx.beginPath(); ctx.arc(sx, y, a * 4, -0.9, 0.9); ctx.stroke(); tag(n, sx + a * 4 * Math.cos(0.9), y - a * 4 * Math.sin(0.9) - 12, DIM, 'center', 12, 700); }
    const vx = sc.x0 + C * DAY_S * sc.k;   // Voyager 1 reached one light day from the Earth in November 2026
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(vx - 3, y - 84, 6, 6); ctx.strokeStyle = '#b0bec5'; ctx.beginPath(); ctx.moveTo(vx, y - 78); ctx.lineTo(vx, y - 8); ctx.stroke();
    tag('Voyager 1: one light day away', vx - 8, y - 81, INK, 'right', 14, 700);
    scaleBar(5e9 * sc.k, '5 billion km');
  } else {
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(sc.x0, y, 4, 0, TAU); ctx.fill();
    tag('the Sun (and the whole solar system)', sc.x0 - 6, y - 26, INK, 'left', 13, 700);
    const px = sc.x0 + 4.24 * LY * sc.k;
    ctx.fillStyle = '#ff8a50'; ctx.beginPath(); ctx.arc(px, y, 4, 0, TAU); ctx.fill();
    tag('Proxima Centauri,', px, y + 24, INK, 'center', 14, 800);
    tag('the nearest star', px, y + 42, INK, 'center', 14, 800);
    scaleBar(LY * sc.k, '1 light year');
  }
  // The light, travelling
  const end = sc.x0 + C * span.t * sc.k * f;
  const grad = ctx.createLinearGradient(sc.x0, 0, Math.max(sc.x0 + 1, end), 0);
  grad.addColorStop(0, 'rgba(255, 224, 130, .35)'); grad.addColorStop(1, LIGHT);
  ctx.strokeStyle = grad; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sc.x0, y); ctx.lineTo(end, y); ctx.stroke(); ctx.lineWidth = 1;
  const g = ctx.createRadialGradient(end, y, 0, end, y, 12);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)'); g.addColorStop(0.3, 'rgba(255, 224, 130, .9)'); g.addColorStop(1, 'rgba(255, 224, 130, 0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(end, y, 12, 0, TAU); ctx.fill();
  // The clock, and where the light got to
  tag('Light travelling for', 16, 24, DIM, 'left', 14, 700);
  tag(clockText(span, f), 16, 52, LIGHT, 'left', 26, 800);
  if (f >= 1) tag(farText(span), Math.min(Math.max(end, 200), 600), y - 46, LIGHT, 'center', 15, 800);
}
function farText(span) {
  const km = C * span.t;
  if (km >= 1e12) return `${(km / 1e12).toFixed(1)} million million km`;
  if (km >= 1e9) return `${(km / 1e9).toFixed(km >= 1e10 ? 0 : 2)} billion km`;
  if (km >= 1e6) return `${spaced(km / 1e6)} million km`;
  return `${spaced(km)} km`;
}
const SAYS = {
  s1: 'That’s 7½ times round the Earth, and most of the way to the Moon. Light from the Moon takes about 1.3 seconds to reach us.',
  m1: 'That’s about an eighth of the way to the Sun.',
  m8: 'That gets it all the way from the Sun to the Earth: sunlight takes about 8⅓ minutes to reach us, so we see the Sun as it was 8 minutes ago.',
  h1: 'From the Earth, the light would get past Jupiter’s orbit, but not as far as Saturn’s.',
  d1: 'That’s almost 6 times as far as Neptune. Voyager 1, launched in 1977, is the furthest spacecraft from the Earth. In November 2026 it reached one light day away: its radio signals now take a whole day to reach us.',
  y1: 'That’s one light year: about 9.5 million million km. It still only gets about a quarter of the way to the nearest star.',
  y4: 'Light from Proxima Centauri, the nearest star to the Sun, takes 4.24 years to reach us: it’s 4.24 light years away.',
};

// ---------- Words ----------

const INTRO = {
  stars: 'The Sun is a star: the nearest one to us. Compare it with other stars in our galaxy, drawn to the same scale.',
  galaxy: 'A galaxy is a huge group of stars held together by gravity. Start at ours, the Milky Way, and zoom out to the whole universe.',
  ly: 'A light year is a distance: how far light travels in a year. See how far light gets in a second, a minute, an hour and more.',
};
const EXPLAIN = {
  stars: `<ul>
      <li>The <b>Sun</b> is a star: a huge ball of hot gas that gives out light, heated by nuclear fusion in its core. Planets and moons don’t give out light: we see them because they reflect the Sun’s light.</li>
      <li>The Sun looks much bigger and brighter than the other stars because it’s so much closer. Its light takes 8⅓ minutes to reach us; light from the next nearest star takes over 4 years.</li>
      <li>Stars come in very different sizes. The Sun is a medium-sized star. Red dwarfs are smaller; supergiants can be hundreds of times wider than the Sun.</li>
      <li>A star’s colour tells you how hot its surface is. Red stars are the coolest; then orange, yellow and white; blue-white stars are the hottest.</li>
      <li>All the stars you can see at night are in our galaxy, the <b>Milky Way</b>.</li>
    </ul>`,
  galaxy: `<ul>
      <li>A <b>galaxy</b> is a huge group of billions of stars, held together by gravity.</li>
      <li>Our solar system is a tiny part of the <b>Milky Way</b> galaxy. It has 100 to 400 billion stars, and is about 100 000 light years across.</li>
      <li>The Milky Way is a <b>spiral galaxy</b>: a flat disc with spiral arms, and a bulge of older stars in the middle. On a dark night you can see the disc, from the inside, as a faint band of light across the sky.</li>
      <li>The Sun is about 26 000 light years from the centre, and takes about 230 million years to go round it once.</li>
      <li>Galaxies are found in groups and clusters. Ours, the <b>Local Group</b>, has more than 80 galaxies. The nearest big one, Andromeda, is 2.5 million light years away: the light you see from it left 2.5 million years ago, long before modern humans existed.</li>
      <li>Groups and clusters are joined into <b>superclusters</b>. Ours is called Laniakea, and has about 100 000 galaxies.</li>
      <li>The part of the universe we can see is about 93 billion light years across. It has hundreds of billions of galaxies, in threads and sheets with huge empty spaces between them. Some are spirals; others are elliptical (shaped like a squashed ball) or irregular.</li>
    </ul>`,
  ly: `<ul>
      <li>Light travels at <b>300 000 km every second</b>. Nothing travels faster.</li>
      <li>A <b>light year</b> is the distance light travels in one year: about 9.5 million million km (9.46 × 10¹² km). It’s a <b>distance</b>, not a time.</li>
      <li>Distance = speed × time. In a year: 300 000 km/s × 31 536 000 s = 9 460 800 000 000 km.</li>
      <li>Distances in space are so big that kilometres give enormous numbers. Light years make them easier: Proxima Centauri is 4.24 light years away, rather than 40 million million km.</li>
      <li>Smaller distances can be given in light seconds, minutes or hours: the Moon is about 1.3 light seconds away, and the Sun about 8⅓ light minutes.</li>
      <li>When you look at a star, the light reaching your eye left it years ago: you see the star as it was then, not as it is now.</li>
    </ul>`,
};

function lightLeft(ly) {
  if (ly < 0.001) return 'about 8⅓ minutes ago';
  const y = NOW - ly;
  return ly < 20 ? `${ly} years ago, in about ${Math.round(y)}` : `about ${spaced(ly)} years ago, around ${Math.round(y / 10) * 10}`;
}
function render() {
  const t = state.tab;
  let html = '';
  if (t === 'stars') {
    const k = pressed('star'), s = STARS[k];
    const dkm = s.R * 1.392;
    const mm = s.ly * 9.46, mmText = mm < 100 ? spaced(mm) : spaced(Math.round(mm / 100) * 100);
    const dist = k === 'sun' ? '<dt>Distance from us</dt><dd>150 million km</dd><dt>In light time</dt><dd>8⅓ light minutes</dd>' : `<dt>Distance from us</dt><dd>${s.ly > 100 ? 'about ' : ''}${s.ly} light years</dd><dt>In km</dt><dd>${mmText} million million km</dd>`;
    html = `<p style="font-weight:800;font-size:1.05rem;margin-bottom:6px">${s.name}</p><dl class="readout"><dt>Type</dt><dd>${s.kind.replace(/^A /, '')}</dd><dt>Width</dt><dd>${k === 'sun' ? '1.39 million km' : `${s.R < 10 ? s.R.toFixed(s.R < 1 ? 2 : 1) : spaced(s.R)} × the Sun`}</dd>${k === 'sun' ? '' : `<dt>That’s</dt><dd>${dkm < 10 ? dkm.toFixed(dkm < 1 ? 2 : 1) : spaced(dkm)} million km</dd>`}<dt>Surface temperature</dt><dd>about ${spaced(s.temp)} °C</dd><dt>Colour</dt><dd>${s.colour}</dd>${dist}</dl>`;
    html += `<p>The light you see from it left it ${lightLeft(s.ly)}.</p><p><b>From Earth:</b> ${s.bright}</p><p>${s.fact}</p>`;
    if (k === 'betelgeuse') html += '<p>If Betelgeuse were where the Sun is, it would swallow Mercury, Venus, the Earth and Mars, and reach most of the way to Jupiter.</p>';
    if (k === 'rigel') html += '<p>If Rigel were where the Sun is, it would reach almost as far as Mercury’s orbit.</p>';
  } else if (t === 'galaxy') {
    const v = pressed('gview');
    if (v === 'milky') html = '<dl class="readout"><dt>Type</dt><dd>spiral galaxy</dd><dt>Width</dt><dd>about 100 000 light years</dd><dt>Thickness of the disc</dt><dd>about 1000 light years</dd><dt>Stars</dt><dd>100 to 400 billion</dd><dt>The Sun’s distance from the centre</dt><dd>about 26 000 light years</dd><dt>Time for the Sun to go round</dt><dd>about 230 million years</dd></dl><p>Every star you can see in the night sky is in the Milky Way. Most of its stars are too far away and too faint to see.</p>';
    else if (v === 'local') html = '<dl class="readout"><dt>Galaxies</dt><dd>more than 80</dd><dt>Width</dt><dd>about 10 million light years</dd><dt>Andromeda</dt><dd>2.5 million light years away</dd><dt>Triangulum</dt><dd>2.7 million light years away</dd></dl><p>The Local Group is our group of galaxies, held together by gravity. Andromeda and the Milky Way are the biggest. Most of the rest are small dwarf galaxies, like the Large and Small Magellanic Clouds, which orbit the Milky Way 160 000 and 200 000 light years away.</p><p>Andromeda is a spiral galaxy with about a trillion stars. On a dark night you can just see it from the UK as a faint smudge: it’s one of the furthest things you can see with just your eyes.</p>';
    else if (v === 'super') html = '<dl class="readout"><dt>Name</dt><dd>Laniakea</dd><dt>Galaxies</dt><dd>about 100 000</dd><dt>Width</dt><dd>about 500 million light years</dd><dt>The Virgo Cluster</dt><dd>54 million light years away</dd></dl><p>Groups and clusters of galaxies are joined into superclusters, strung out along threads. Ours is called Laniakea, Hawaiian for “immeasurable heaven”. Our Local Group is near its edge.</p><p>The Virgo Cluster, with more than 1000 galaxies, is the nearest big cluster.</p>';
    else if (v === 'universe') html = '<dl class="readout"><dt>Width</dt><dd>about 93 billion light years</dd><dt>Galaxies</dt><dd>hundreds of billions</dd><dt>Age</dt><dd>about 13.8 billion years</dd></dl><p>This is the part of the universe we can see: the observable universe. Superclusters are joined by threads of galaxies, with huge empty spaces (voids) between them, like a sponge.</p><p>We can’t see any further, because light from further away hasn’t had time to reach us. The universe has been expanding while that light travelled, so it’s now much more than 13.8 billion light years to the edge. The universe may go on much further than the part we can see.</p><p>We’re in the middle only because we can see the same distance in every direction.</p>';
    else html = '<p>A photo of a tiny patch of the sky, taken with a big telescope, is full of galaxies. Each one has billions of stars.</p><p>There are hundreds of billions of galaxies in the part of the universe we can see. The light from the furthest ones has taken billions of years to reach us.</p>';
  } else {
    const k = pressed('span'), span = SPANS[k], km = C * span.t;
    html = `<dl class="readout"><dt>Time</dt><dd>${span.label}${span.t === 1 ? '' : ` = ${spaced(span.t)} s`}</dd><dt>Speed of light</dt><dd>300 000 km/s</dd></dl>`;
    html += `<p><b>Distance = speed × time</b><br>= 300 000 km/s × ${spaced(span.t)} s<br>= ${spaced(km)} km${km >= 1e9 ? ` (${farText(span)})` : ''}</p><p>${SAYS[k]}</p>`;
  }
  $('info').innerHTML = html;
  const lvl = LEVELS.indexOf(pressed('gview'));
  $('zout').disabled = lvl < 0 || lvl === LEVELS.length - 1;
  $('zin').disabled = lvl <= 0;
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = EXPLAIN[t];
  cv.setAttribute('aria-label', { stars: 'The Sun and another star drawn to the same scale', galaxy: 'Galaxies, drawn to scale', ly: 'A pulse of light travelling through space, drawn to scale' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'stars' ? location.pathname + location.search : `#${t}`);
  if (t === 'ly') lt.start = performance.now();
  render();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
for (const id of ['star', 'gview', 'span']) {
  document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll(`#${id} .chip`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (id === 'span') lt.start = performance.now();
    render();
  }));
}
$('send').addEventListener('click', () => { lt.start = performance.now(); });
// Zoom out (or in) one level at a time
function zoomBy(d) {
  const j = LEVELS.indexOf(pressed('gview')) + d;
  if (j < 0 || j >= LEVELS.length || LEVELS.indexOf(pressed('gview')) < 0) return;
  document.querySelectorAll('#gview .chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === LEVELS[j])));
  render();
}
$('zout').addEventListener('click', () => zoomBy(1));
$('zin').addEventListener('click', () => zoomBy(-1));

// ---------- Practice questions, new every time ----------
// How far light goes in a time, or how long it takes to go a distance (KS3 maths: speed × time)
const TRIP = [['the Moon', 384000, ''], ['the Sun', 150000000, ''], ['Mars', 60000000, ' at its closest'], ['Jupiter', 630000000, ' at its closest'], ['Venus', 42000000, ' at its closest']];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function makeParams() {
  const k = ['far', 'far', 'time', 'ly'][rint(0, 3)];
  if (k === 'far') return { k, t: [2, 3, 5, 10, 20, 30, 60, 100][rint(0, 7)] };
  if (k === 'time') return { k, i: rint(0, TRIP.length - 1) };
  return { k, n: [2, 3, 4, 5, 10][rint(0, 4)] };
}
function buildQ(p) {
  const base = { id: `gen-${JSON.stringify(p)}`, lv: 'ks3', topic: 'space', tool: 'Stars, galaxies & light years', pg: 'stars', gen: true, p };
  if (p.k === 'far') {
    const km = C * p.t;
    return { ...base, type: 'num', q: `Light travels at 300 000 km/s. How far does it travel in ${p.t} seconds?`, num: km, numText: spaced(km), unit: 'km',
      exp: `Distance = speed × time = 300 000 km/s × ${p.t} s = ${spaced(km)} km.` };
  }
  if (p.k === 'time') {
    const [what, km, when] = TRIP[p.i], s = km / C;
    return { ...base, type: 'num', q: `${what[0].toUpperCase()}${what.slice(1)} is ${spaced(km)} km from the Earth${when}. Light travels at 300 000 km/s. How long does light take to travel from ${what} to the Earth?`, num: s, numText: s < 10 ? String(Math.round(s * 100) / 100) : spaced(s), unit: 's',
      exp: `Time = distance ÷ speed = ${spaced(km)} km ÷ 300 000 km/s = ${s < 10 ? Math.round(s * 100) / 100 : spaced(s)} s${s >= 120 ? ` (about ${Math.round(s / 60)} minutes)` : ''}.` };
  }
  const v = Math.round(9.5 * p.n * 10) / 10;
  return { ...base, type: 'num', q: `A light year is about 9.5 million million km. A star is ${p.n} light years away. How far away is it, in million million km?`, num: v, numText: String(v), unit: 'million million km',
    exp: `${p.n} light years = ${p.n} × 9.5 million million km = ${v} million million km.` };
}
function validParams(o) {
  if (!o || typeof o !== 'object') return false;
  if (o.k === 'far') return [2, 3, 5, 10, 20, 30, 60, 100].includes(o.t);
  if (o.k === 'time') return Number.isInteger(o.i) && o.i >= 0 && o.i < TRIP.length;
  if (o.k === 'ly') return [2, 3, 4, 5, 10].includes(o.n);
  return false;
}
PK.practiceGen = { make: () => buildQ(makeParams()), encode: (q) => q.p, decode: (o) => (validParams(o) ? buildQ(o) : null), share: 0.4 };

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

function frame(now) {
  if (cv.clientWidth) {
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    ({ stars: drawStars, galaxy: drawGalaxies, ly: drawLight })[state.tab](now);
  }
  requestAnimationFrame(frame);
}

showTab(['#galaxy', '#ly'].includes(PK.initialHash) ? PK.initialHash.slice(1) : 'stars');
requestAnimationFrame(frame);
