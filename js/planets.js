// Planets, moons & satellites.
// The solar system: the eight planets and three dwarf planets go round the Sun at their real rates,
// sped up. The inner and outer views draw the distances to scale; "All of it" squashes them (on a
// log scale) so that everything fits. The Sun and planets are drawn much bigger than to scale.
// Moons: the biggest moons of four planets, with their real distances and times, to scale.
// Artificial satellites: four kinds of orbit round the Earth, to scale, seen from a little above the
// equator. A geostationary satellite stays over the same place while the Earth turns.

PK.header({
  title: 'Planets, moons & satellites',
  spec: [
    { code: '4.8.1.1', text: 'Our solar system: one star (the Sun), the eight planets and the dwarf planets that orbit it, and the natural satellites (moons) that orbit planets', po: true },
    { code: '4.8.1.1', text: 'Our solar system is a small part of the Milky Way galaxy', po: true },
    { code: '4.8.1.3', text: 'Gravity provides the force that keeps planets and satellites, natural and artificial, in their circular orbits', po: true },
    { code: '4.8.1.3', text: 'The similarities and differences between the planets, their moons and artificial satellites', po: true },
    { code: 'KS3', text: 'The solar system: the planets orbit the Sun, and moons orbit planets' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 470, CX = 400, CY = 235, TILT = 0.45;   // TILT: how squashed a circular orbit looks, seen at an angle
const SPACE = '#0b1020', INK = '#eceff1', DIM = '#9aa5c4', PICK = '#ffd54f';
const state = { tab: 'solar', playing: true };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const spaced = (n) => { const s = String(Math.round(n)); return s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s; };
const TAU = Math.PI * 2;

const font = () => PK.cssVar('--font-body') || 'sans-serif';
function tag(text, x, y, col = INK, align = 'center', size = 13, weight = 700) {
  ctx.font = `${weight} ${size}px ${font()}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = SPACE; ctx.strokeText(text, x, y);
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const STARS = Array.from({ length: 150 }, () => ({ x: rand() * W, y: rand() * H, s: rand() < 0.15 ? 1.4 : 0.8, a: 0.25 + rand() * 0.5 }));
function sky() {
  ctx.fillStyle = SPACE; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  for (const s of STARS) { ctx.globalAlpha = s.a; ctx.fillRect(s.x, s.y, s.s, s.s); }
  ctx.globalAlpha = 1;
}
function darker(hex, k) { const n = parseInt(hex.slice(1), 16); return `rgb(${((n >> 16) & 255) * k | 0}, ${((n >> 8) & 255) * k | 0}, ${(n & 255) * k | 0})`; }
// A planet or moon, lit from the upper left
function ball(x, y, r, col) {
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, darker(col, 0.45));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
function sun(x, y, r) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
  g.addColorStop(0, '#fffde7'); g.addColorStop(0.45, '#ffd54f'); g.addColorStop(0.5, 'rgba(255, 179, 0, .45)'); g.addColorStop(1, 'rgba(255, 152, 0, 0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2, 0, TAU); ctx.fill();
}
function ring(x, y, r, col = PICK) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, TAU); ctx.stroke(); ctx.lineWidth = 1; }
function orbitPath(x, y, rx, ry, col, w = 1, dash = null) {
  ctx.strokeStyle = col; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
}

// ---------- The solar system ----------
// a: distance from the Sun (AU, where 1 AU is the Earth's distance, 149.6 million km); T: time to
// orbit (Earth years); d: diameter (km); temp: average temperature (°C, at the cloud tops for the giants)
const AU = 149.6;
const BODIES = [
  { name: 'Mercury', kind: 'Rocky planet', a: 0.387, T: 0.241, d: 4879, moons: '0', temp: 167, col: '#a1887f', fact: 'The smallest planet, and the closest to the Sun. It has almost no atmosphere, so it’s about 430 °C in the day and −180 °C at night.' },
  { name: 'Venus', kind: 'Rocky planet', a: 0.723, T: 0.615, d: 12104, moons: '0', temp: 464, col: '#e6c27a', fact: 'The hottest planet, even though Mercury is closer to the Sun: its thick carbon dioxide atmosphere traps the heat (the greenhouse effect).' },
  { name: 'Earth', kind: 'Rocky planet', a: 1, T: 1, d: 12756, moons: '1', temp: 15, col: '#42a5f5', fact: 'The only place we know of with life, and the only planet with liquid water on its surface.' },
  { name: 'Mars', kind: 'Rocky planet', a: 1.524, T: 1.881, d: 6792, moons: '2', temp: -65, col: '#e57373', fact: 'The red planet: its surface is covered in iron oxide (rust). It has the biggest volcano in the solar system, Olympus Mons.' },
  { name: 'Ceres', kind: 'Dwarf planet', a: 2.77, T: 4.6, d: 940, moons: '0', temp: -105, col: '#bdbdbd', dwarf: true, fact: 'The biggest object in the asteroid belt, between Mars and Jupiter, and the only dwarf planet in the inner solar system.' },
  { name: 'Jupiter', kind: 'Gas giant', a: 5.203, T: 11.86, d: 142984, moons: '95+', temp: -110, col: '#d7a86e', fact: 'The biggest planet: more than twice the mass of all the other planets put together. Its Great Red Spot is a storm bigger than the Earth.' },
  { name: 'Saturn', kind: 'Gas giant', a: 9.537, T: 29.46, d: 120536, moons: '270+', temp: -140, col: '#e8d39a', rings: true, fact: 'Famous for its rings, which are made of billions of pieces of ice and rock. It’s less dense than water.' },
  { name: 'Uranus', kind: 'Ice giant', a: 19.19, T: 84.01, d: 51118, moons: '28+', temp: -195, col: '#80deea', fact: 'It spins on its side, so each pole has about 42 years of daylight, then 42 years of darkness.' },
  { name: 'Neptune', kind: 'Ice giant', a: 30.07, T: 164.8, d: 49528, moons: '16+', temp: -200, col: '#5c6bc0', fact: 'The furthest planet from the Sun, with the fastest winds in the solar system: over 2000 km/h.' },
  { name: 'Pluto', kind: 'Dwarf planet', a: 39.48, T: 248, d: 2377, moons: '5', temp: -230, col: '#bcaaa4', dwarf: true, e: 0.249, fact: 'Called a planet until 2006, when astronomers decided it’s a dwarf planet: it shares its part of space with many other icy objects. Its orbit is stretched out, and sometimes brings it closer to the Sun than Neptune.' },
  { name: 'Eris', kind: 'Dwarf planet', a: 67.7, T: 559, d: 2326, moons: '1', temp: -240, col: '#cfd8dc', dwarf: true, fact: 'About the same size as Pluto, and on average more than one and a half times as far out. Finding it in 2005 led astronomers to agree what a planet is, and to the new name, dwarf planet.' },
];
const byName = Object.fromEntries(BODIES.map((b) => [b.name, b]));
const VIEWS = {
  all: { r: (a) => 30 + 62 * Math.log(1 + a / 0.3), year: 6, sun: 20, size: 1, has: () => true },
  inner: { r: (a) => a * 222, year: 5, sun: 14, size: 1.5, has: (b) => b.a < 2 },
  outer: { r: (a) => a * 7.8, year: 0.3, sun: 9, size: 1.2, has: (b) => b.a > 4 && b.a < 50 },
};
const sol = { t: 0, lined: false, pick: 'Earth' };
const bodyAngle = (b, i) => (sol.lined ? 0 : i * 2.4) + (TAU * sol.t) / b.T;
const dotR = (b) => (b.dwarf ? 2.6 : 3 + 2.2 * Math.sqrt(b.d / 12756));
function bodyAt(b, i, v) {
  const th = bodyAngle(b, i);
  if (v === 'outer' && b.e) {
    // Pluto's stretched orbit, with the Sun at one focus (Kepler's equation gives where it is)
    let E = th;
    for (let k = 0; k < 6; k++) E = th + b.e * Math.sin(E);
    return { x: CX + b.a * (Math.cos(E) - b.e) * 7.8, y: CY - b.a * Math.sqrt(1 - b.e * b.e) * Math.sin(E) * 7.8 * TILT };
  }
  const r = VIEWS[v].r(b.a);
  return { x: CX + r * Math.cos(th), y: CY - r * Math.sin(th) * TILT };
}
function solarLayout() {
  const v = pressed('view'), V = VIEWS[v];
  return BODIES.map((b, i) => ({ b, ...bodyAt(b, i, v), r: dotR(b) * V.size })).filter((p) => V.has(p.b));
}
const BELT = Array.from({ length: 170 }, () => ({ a: 2.2 + rand() * 1.1, th: rand() * TAU, s: 0.6 + rand() }));
function drawSolar() {
  const v = pressed('view'), V = VIEWS[v];
  // Orbits
  for (const b of BODIES) {
    if (!V.has(b) && !(v === 'outer' && b.a < 2)) continue;
    const on = b.name === sol.pick, col = on ? PICK : b.dwarf ? 'rgba(160, 170, 200, .35)' : 'rgba(160, 170, 200, .5)';
    if (v === 'outer' && b.e) { const s = 7.8; orbitPath(CX - b.a * b.e * s, CY, b.a * s, b.a * Math.sqrt(1 - b.e * b.e) * s * TILT, col, on ? 2 : 1, b.dwarf ? [4, 4] : null); continue; }
    const r = V.r(b.a);
    orbitPath(CX, CY, r, r * TILT, col, on ? 2 : 1, b.dwarf ? [4, 4] : null);
  }
  // The asteroid belt, between Mars and Jupiter
  if (v !== 'inner') {
    ctx.fillStyle = '#8d8d8d';
    for (const k of BELT) { const th = k.th + (TAU * sol.t) / Math.pow(k.a, 1.5), r = V.r(k.a); ctx.globalAlpha = 0.7; ctx.fillRect(CX + r * Math.cos(th), CY - r * Math.sin(th) * TILT, k.s, k.s); }
    ctx.globalAlpha = 1;
  }
  sun(CX, CY, V.sun);
  if (v === 'outer') tag('Sun', CX, CY + V.sun + 12, sol.pick === 'Sun' ? PICK : INK, 'center', 14);
  else { ctx.font = `800 ${v === 'all' ? 13 : 11}px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5d4037'; ctx.fillText('Sun', CX, CY + 1); }
  if (sol.pick === 'Sun') ring(CX, CY, V.sun);
  // The planets and dwarf planets (far side first)
  const list = solarLayout().sort((p, q) => p.y - q.y);
  for (const p of list) {
    ball(p.x, p.y, p.r, p.b.col);
    if (p.b.rings) { ctx.strokeStyle = 'rgba(232, 211, 154, .85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.9, p.r * 0.55, -0.35, 0, TAU); ctx.stroke(); ctx.lineWidth = 1; }
    const on = p.b.name === sol.pick;
    if (on) ring(p.x, p.y, p.r);
    tag(p.b.name, p.x + p.r + 6, p.y, on ? PICK : p.b.dwarf ? DIM : INK, 'left', on ? 15 : 14, on ? 800 : 700);
  }
  // What can be done, and the scale
  tag('Tap a planet or dwarf planet', 14, 20, DIM, 'left', 14, 700);
  if (v === 'outer') tag('The inner planets are too close to the Sun to see at this scale', 14, 42, DIM, 'left', 13, 600);
  if (v === 'all') tag('Distances squashed to fit: not to scale', 14, H - 38, DIM, 'left', 13, 600);
  else {
    const km = v === 'inner' ? 100 : 1000, px = (km / AU) * (v === 'inner' ? 222 : 7.8);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(14, H - 40); ctx.lineTo(14 + px, H - 40); ctx.moveTo(14, H - 45); ctx.lineTo(14, H - 35); ctx.moveTo(14 + px, H - 45); ctx.lineTo(14 + px, H - 35); ctx.stroke(); ctx.lineWidth = 1;
    tag(`${km === 1000 ? '1000' : '100'} million km`, 22 + px, H - 40, INK, 'left', 13, 700);
  }
  tag('The Sun and planets are drawn far bigger than to scale', 14, H - 16, DIM, 'left', 13, 600);
}

// ---------- Moons ----------
// r: average distance from the planet's centre (km); T: time to orbit (days); d: diameter (km)
const HOSTS = {
  Earth: { d: 12756, col: '#42a5f5', day: 0.25, count: '1', moons: [
    { name: 'Moon', r: 384400, T: 27.32, d: 3475, col: '#cfd8dc', fact: 'The only place beyond the Earth that people have walked on. It always keeps the same side facing us.' },
  ] },
  Mars: { d: 6792, col: '#e57373', day: 6, count: '2', moons: [
    { name: 'Phobos', r: 9376, T: 0.319, d: 22, col: '#a1887f', fact: 'A lumpy rock about 22 km across. It goes round Mars three times a day, and is slowly spiralling inwards: in tens of millions of years it will break up or crash.' },
    { name: 'Deimos', r: 23463, T: 1.263, d: 12, col: '#bcaaa4', fact: 'Even smaller, about 12 km across. Both of Mars’s moons may be asteroids that were captured by its gravity.' },
  ] },
  Jupiter: { d: 142984, col: '#d7a86e', day: 1, count: '95+', moons: [
    { name: 'Io', r: 421700, T: 1.769, d: 3643, col: '#fff176', fact: 'The most volcanic place in the solar system, squeezed and heated by Jupiter’s gravity.' },
    { name: 'Europa', r: 671034, T: 3.551, d: 3122, col: '#d7ccc8', fact: 'Covered in a thick crust of ice with a salty ocean underneath: one of the places scientists look for signs of life.' },
    { name: 'Ganymede', r: 1070412, T: 7.155, d: 5268, col: '#a1887f', fact: 'The biggest moon in the solar system: wider than the planet Mercury.' },
    { name: 'Callisto', r: 1882709, T: 16.69, d: 4821, col: '#8d6e63', fact: 'Covered in craters: its surface is one of the oldest in the solar system.' },
  ] },
  Saturn: { d: 120536, col: '#e8d39a', day: 1.2, count: '270+', rings: true, moons: [
    { name: 'Enceladus', r: 238042, T: 1.370, d: 504, col: '#eceff1', fact: 'A small icy moon that shoots jets of water into space from an ocean under its surface.' },
    { name: 'Tethys', r: 294672, T: 1.888, d: 1062, col: '#e0e0e0', fact: 'Made almost entirely of ice, with one enormous crater.' },
    { name: 'Dione', r: 377415, T: 2.737, d: 1123, col: '#cfd8dc', fact: 'An icy moon covered in craters and long, bright cliffs of ice.' },
    { name: 'Rhea', r: 527068, T: 4.518, d: 1527, col: '#bdbdbd', fact: 'Saturn’s second-biggest moon: a cold ball of ice and rock.' },
    { name: 'Titan', r: 1221870, T: 15.95, d: 5150, col: '#ffb74d', fact: 'Bigger than the planet Mercury, with a thick atmosphere and lakes of liquid methane.' },
  ] },
};
const mo = { t: 0, pick: { Earth: 'Moon', Mars: 'Phobos', Jupiter: 'Ganymede', Saturn: 'Titan' } };
function moonLayout() {
  const name = pressed('host'), h = HOSTS[name], k = 340 / h.moons[h.moons.length - 1].r;
  const list = h.moons.map((m, i) => {
    const th = i * 1.9 + (TAU * mo.t) / m.T, r = m.r * k;
    return { m, x: CX + r * Math.cos(th), y: CY - r * Math.sin(th) * TILT, far: Math.sin(th) > 0, orbit: r, rad: Math.max(3, (m.d / 2) * k) };
  });
  return { name, h, k, list, pr: Math.max(4, (h.d / 2) * k) };
}
function drawMoons() {
  const L = moonLayout(), pick = mo.pick[L.name];
  for (const p of L.list) orbitPath(CX, CY, p.orbit, p.orbit * TILT, p.m.name === pick ? PICK : 'rgba(160, 170, 200, .5)', p.m.name === pick ? 2 : 1);
  const moon = (p) => {
    ball(p.x, p.y, p.rad, p.m.col);
    const on = p.m.name === pick;
    if (on) ring(p.x, p.y, p.rad);
    tag(p.m.name, p.x + p.rad + 6, p.y, on ? PICK : INK, 'left', on ? 15 : 14, on ? 800 : 700);
  };
  for (const p of L.list) if (p.far) moon(p);
  // Saturn's rings: the back half, the planet, then the front half
  const rings = (front) => {
    if (!L.h.rings) return;
    for (const [r, a] of [[136775, 0.55], [117580, 0.8], [92000, 0.6]]) {
      ctx.strokeStyle = `rgba(232, 211, 154, ${a})`; ctx.lineWidth = Math.max(1.5, 16000 * L.k);
      ctx.beginPath(); ctx.ellipse(CX, CY, r * L.k, r * L.k * TILT, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
    }
    ctx.lineWidth = 1;
  };
  rings(false);
  ball(CX, CY, L.pr, L.h.col);
  rings(true);
  tag(L.name, CX, CY + Math.max(L.pr, L.h.rings ? 136775 * L.k * TILT : 0) + 15, INK, 'center', 15, 800);
  for (const p of L.list) if (!p.far) moon(p);
  tag('Tap a moon', 14, 20, DIM, 'left', 14, 700);
  tag(`The distances and the size of ${L.name} are to scale.${L.list.some((p) => p.rad > (p.m.d / 2) * L.k + 0.5) ? ' Small moons are drawn bigger, so you can see them.' : ''}`, 14, H - 16, DIM, 'left', 13, 600);
}

// ---------- Artificial satellites ----------
// h: height above the ground (km); T: time to orbit (hours); inc: angle of the orbit to the equator;
// node: which way the orbit is turned. Seen from a little above the equator.
const RE = 6371, EPS = (20 * Math.PI) / 180, DAY = 23.934;
const SATS = {
  iss: { name: 'Space station', h: 420, T: 92.9 / 60, inc: 51.6, node: -0.5, col: '#ffb300',
    use: 'A laboratory where astronauts live and work. You can often see it from the UK, as a bright dot crossing the sky in a few minutes.', orbit: 'Low orbit, tilted at 52° to the equator' },
  polar: { name: 'Weather satellite', h: 830, T: 101.4 / 60, inc: 90, node: 0.45, col: '#81c784',
    use: 'Weather forecasts, maps and watching the Earth’s surface (ice, forests, crops). It passes over both poles, and the Earth turns underneath it, so it sees every part of the Earth each day.', orbit: 'Polar orbit, over the North and South Poles' },
  gps: { name: 'Satnav (GPS)', h: 20200, T: 11.967, inc: 55, node: 1.2, col: '#4fc3f7',
    use: 'Satnav. About 30 GPS satellites send out timed signals; a phone picks up four or more and works out where it is.', orbit: 'Medium orbit, tilted at 55° to the equator' },
  geo: { name: 'Geostationary', h: 35786, T: DAY, inc: 0, node: 0, col: '#f48fb1',
    use: 'TV, phone and internet links, and weather pictures of half the Earth at once. It stays above the same place, so a satellite dish can point at it without moving.', orbit: 'Above the equator, going round once in the time the Earth takes to spin once (23 h 56 min)' },
};
const sa = { t: 0 };   // hours
// Every working satellite, for the "Show every working satellite" tick box: about 17 000 in
// November 2026 (published counts were 16 900 to 17 300), about two-thirds of them Starlink.
// Each group: [how many, height (km), tilt to the equator (°), planes (0: spread out), kind]
const CROWD_GROUPS = [
  [6000, 550, 53, 0, 0], [2500, 530, 43, 0, 0], [1300, 535, 33, 0, 0], [700, 570, 70, 0, 0], [500, 560, 97.6, 0, 0],   // Starlink
  [650, 1200, 87.9, 0, 0],                                   // OneWeb
  [3000, -1, 97.5, 0, 0],                                    // watching the Earth, 450–850 km, over the poles
  [1400, -2, -1, 0, 0],                                      // other low orbits, 300–1500 km, any tilt
  [31, 20200, 55, 6, 1], [24, 19100, 64.8, 3, 1], [28, 23222, 56, 3, 1], [24, 21528, 55, 3, 1], [20, 8062, 0, 1, 1],   // satnav and others in medium orbits
  [600, 35786, 0, 0, 2],                                     // geostationary
];
const CROWD_COL = ['rgba(225, 232, 242, .8)', '#4fc3f7', '#f48fb1'];
const CROWD = [];
for (const [n, h0, inc0, planes, kind] of CROWD_GROUPS) {
  for (let j = 0; j < n; j++) {
    const h = h0 === -1 ? 450 + rand() * 400 : h0 === -2 ? 300 + rand() * 1200 : h0;
    const inc = ((inc0 < 0 ? rand() * 100 : kind === 2 ? rand() * 3 : inc0) * Math.PI) / 180;
    const node = planes ? (Math.floor(rand() * planes) / planes) * TAU : rand() * TAU, r = RE + h;
    // Mean motion in radians per hour, from T = 2π √(r³ / GM) with GM = 398 600 km³/s²
    CROWD.push({ kind, k: r / RE, cO: Math.cos(node), sO: Math.sin(node), ci: Math.cos(inc), si: Math.sin(inc), u0: rand() * TAU, n: Math.sqrt(398600 / (r * r * r)) * 3600 });
  }
}
const crowdXY = new Float32Array(CROWD.length * 3);
// Where every satellite is now, seen from a little above the equator
function placeCrowd(R) {
  const ce = Math.cos(EPS), se = Math.sin(EPS), turn = earthTurn();
  CROWD.forEach((s, j) => {
    const u = s.kind === 2 ? s.u0 + turn : s.u0 + s.n * sa.t, r = R * s.k, cu = Math.cos(u), su = Math.sin(u);
    const X = r * (s.cO * cu - s.sO * su * s.ci), Y = r * (s.sO * cu + s.cO * su * s.ci), Z = r * su * s.si;
    crowdXY[j * 3] = CX + X; crowdXY[j * 3 + 1] = CY - (Z * ce + Y * se); crowdXY[j * 3 + 2] = -Y * ce + Z * se;
  });
}
// The groups are listed low, medium, geostationary, so each kind is one run of the list
const CROWD_RUNS = [0, 1, 2].map((kind) => { const a = CROWD.findIndex((s) => s.kind === kind); return [a, a + CROWD.filter((s) => s.kind === kind).length]; });
// One shape per colour, rather than 17 000 separate squares, so it stays quick on an iPad
function drawCrowd(front, size) {
  CROWD_RUNS.forEach(([a, b], kind) => {
    ctx.beginPath();
    for (let j = a; j < b; j++) {
      if ((crowdXY[j * 3 + 2] >= 0) !== front) continue;
      const x = crowdXY[j * 3], y = crowdXY[j * 3 + 1];
      if (x > -2 && x < W + 2 && y > -2 && y < H + 2) ctx.rect(x - size / 2, y - size / 2, size, size);
    }
    ctx.fillStyle = CROWD_COL[kind]; ctx.fill();
  });
}
// Rough continents: [latitude, longitude, half-height, half-width] in degrees
const BLOBS = [[50, -100, 18, 30], [62, -140, 8, 22], [32, -95, 10, 16], [18, -99, 6, 8], [73, -40, 9, 16], [-5, -60, 14, 17], [-30, -65, 14, 8],
  [50, 10, 9, 18], [63, 20, 8, 12], [54, -2, 4, 3], [10, 15, 14, 25], [-12, 26, 16, 13], [24, 10, 9, 25], [55, 90, 14, 55], [35, 80, 12, 30],
  [21, 78, 8, 8], [15, 103, 8, 6], [33, 115, 10, 12], [28, 45, 8, 12], [-3, 115, 4, 12], [-25, 134, 10, 17]];
const LAND = [];
for (let lat = -87; lat <= 87; lat += 3) {
  const step = Math.min(30, 3 / Math.cos((lat * Math.PI) / 180));
  for (let lon = -180; lon < 180; lon += step) {
    const land = lat < -68 || BLOBS.some(([a, b, h, w]) => { const dl = ((lon - b + 540) % 360) - 180; return ((lat - a) / h) ** 2 + (dl / w) ** 2 <= 1; });
    if (land) LAND.push([(lat * Math.PI) / 180, (lon * Math.PI) / 180]);
  }
}
const earthTurn = () => -Math.PI / 2 + (TAU * sa.t) / DAY;   // the 0° line of longitude faces us at the start
function project(X, Y, Z, cx, cy) { return { x: cx + X, y: cy - (Z * Math.cos(EPS) + Y * Math.sin(EPS)), z: -Y * Math.cos(EPS) + Z * Math.sin(EPS) }; }
function surface(lat, lon, R, cx, cy) { const ln = lon + earthTurn(); return project(R * Math.cos(lat) * Math.cos(ln), R * Math.cos(lat) * Math.sin(ln), R * Math.sin(lat), cx, cy); }
function orbitPoint(s, u, R, cx, cy) {
  const r = (R * (RE + s.h)) / RE, i = (s.inc * Math.PI) / 180, O = s.node;
  return project(r * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i)), r * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i)), r * Math.sin(u) * Math.sin(i), cx, cy);
}
const satAngle = (s) => (s === SATS.geo ? earthTurn() : (TAU * sa.t) / s.T + s.node * 2);
function satLayout() {
  const close = pressed('zoom') === 'close', R = close ? 150 : 50;
  const shown = Object.entries(SATS).filter(([, s]) => !close || s.h < 2000);
  return { R, close, sats: shown.map(([k, s]) => ({ k, s, ...orbitPoint(s, satAngle(s), R, CX, CY) })) };
}
function satIcon(x, y, col, k = 1) {
  ctx.fillStyle = '#90caf9'; ctx.fillRect(x - 10 * k, y - 2 * k, 6 * k, 4 * k); ctx.fillRect(x + 4 * k, y - 2 * k, 6 * k, 4 * k);
  ctx.fillStyle = col; ctx.fillRect(x - 3.5 * k, y - 3.5 * k, 7 * k, 7 * k);
}
function drawSats() {
  const L = satLayout(), pick = pressed('sat'), R = L.R;
  // Orbits: the halves behind the Earth first
  const paths = L.sats.map(({ k, s }) => ({ k, s, pts: Array.from({ length: 181 }, (_, j) => orbitPoint(s, (j / 180) * TAU, R, CX, CY)) }));
  const drawOrbits = (front) => {
    for (const { k, s, pts } of paths) {
      ctx.strokeStyle = k === pick ? s.col : 'rgba(160, 170, 200, .55)'; ctx.lineWidth = k === pick ? 2.2 : 1.2;
      ctx.globalAlpha = front ? 1 : 0.55;
      ctx.beginPath();
      for (let j = 0; j < 180; j++) { const a = pts[j], b = pts[j + 1]; if ((a.z + b.z >= 0) === front) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } }
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  };
  const drawSat = (p) => {
    const on = p.k === pick, k = L.close ? 1.4 : 1;
    satIcon(p.x, p.y, p.s.col, k);
    if (on) ring(p.x, p.y, 9 * k, p.s.col);
    if (!L.close && p.s.h < 2000 && !on) return;   // zoomed out, the low orbits are too crowded to label
    tag(p.s.name, p.x + 14 * k, p.y - 11, on ? p.s.col : INK, 'left', on ? 15 : 14, on ? 800 : 700);
  };
  const crowd = $('crowd').checked, dotSize = L.close ? 1.8 : 1.2;
  if (crowd) { placeCrowd(R); drawCrowd(false, dotSize); }
  drawOrbits(false);
  for (const p of L.sats) if (p.z < 0) drawSat(p);
  // The Earth, turning
  const g = ctx.createRadialGradient(CX - R * 0.35, CY - R * 0.4, R * 0.1, CX, CY, R);
  g.addColorStop(0, '#4f8fe0'); g.addColorStop(1, '#173a78');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5d9e4a';
  const dot = R * 0.036 + 0.5;
  for (const [lat, lon] of LAND) { const p = surface(lat, lon, R, CX, CY); if (p.z > 0) { ctx.globalAlpha = 0.35 + 0.65 * (p.z / R); ctx.beginPath(); ctx.arc(p.x, p.y, dot, 0, TAU); ctx.fill(); } }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(179, 229, 252, .6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(CX, CY, R + 1, 0, TAU); ctx.stroke(); ctx.lineWidth = 1;
  // The equator, and the UK
  ctx.strokeStyle = 'rgba(255, 255, 255, .35)'; ctx.setLineDash([3, 3]); ctx.beginPath();
  for (let j = 0; j <= 90; j++) { const p = project(R * Math.cos((j / 90) * Math.PI + Math.PI), R * Math.sin((j / 90) * Math.PI + Math.PI), 0, CX, CY); if (j) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
  ctx.stroke(); ctx.setLineDash([]);
  const uk = surface((54 * Math.PI) / 180, (-2 * Math.PI) / 180, R, CX, CY);
  if (uk.z > R * 0.1) { ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(uk.x, uk.y, L.close ? 5 : 3, 0, TAU); ctx.fill(); tag('UK', uk.x - 6, uk.y - 9, '#ffcdd2', 'right', 13, 800); }
  // The geostationary satellite stays above the same place: show the line down to it
  const geo = L.sats.find((p) => p.k === 'geo');
  if (geo && geo.z > 0) {
    const below = surface(0, 0, R, CX, CY);
    ctx.strokeStyle = 'rgba(244, 143, 177, .7)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(geo.x, geo.y); ctx.lineTo(below.x, below.y); ctx.stroke(); ctx.setLineDash([]);
  }
  if (crowd) drawCrowd(true, dotSize);
  drawOrbits(true);
  for (const p of L.sats) if (p.z >= 0) drawSat(p);
  if (crowd) tag('Each dot is one working satellite: about 17 000 (November 2026)', 14, 42, '#e1e8f2', 'left', 13, 700);
  if (!L.close) tag('low orbits, just above the surface', CX - R - 10, CY - R - 4, DIM, 'right', 13, 600);
  tag(L.close ? 'Close up: the GPS and geostationary satellites are far beyond the edge' : 'The orbits and the Earth are to scale; the satellites are drawn much bigger', 14, H - 16, DIM, 'left', 13, 600);
  tag('Tap a satellite', 14, 20, DIM, 'left', 14, 700);
}

// ---------- Words ----------

const INTRO = {
  solar: 'Our solar system: one star, the Sun, with eight planets and some dwarf planets orbiting it. Watch how long each one takes to go round.',
  moons: 'Moons are natural satellites: they orbit planets. Pick a planet to see its biggest moons going round it.',
  sats: 'Artificial satellites are made by people and launched into orbit round the Earth. Different jobs need different orbits.',
};
const EXPLAIN = {
  solar: `<ul>
      <li>Our solar system has one star, the <b>Sun</b>. Eight <b>planets</b> orbit it, along with <b>dwarf planets</b> such as Pluto, and millions of smaller asteroids and comets.</li>
      <li>The four inner planets are small and <b>rocky</b>. The four outer planets are <b>giants</b>, made mostly of gas (Jupiter and Saturn) or of ices (Uranus and Neptune). The asteroid belt lies between Mars and Jupiter.</li>
      <li>A <b>dwarf planet</b> orbits the Sun and is round, but it isn’t big enough to have cleared other objects out of its path.</li>
      <li>The Sun’s <b>gravity</b> provides the force that keeps the planets moving in their orbits, which are almost circles.</li>
      <li>The further a planet is from the Sun, the longer it takes to go round: it has further to go, and it moves more slowly. Press “Line them up” and watch the inner planets race ahead.</li>
      <li>The Sun and planets formed about 4.6 billion years ago, from a cloud of dust and gas (a nebula) pulled together by gravity.</li>
      <li>Our solar system is a tiny part of a galaxy, the <b>Milky Way</b>, which has hundreds of billions of stars.</li>
    </ul>`,
  moons: `<ul>
      <li>A <b>moon</b> is a <b>natural satellite</b>: a natural object that orbits a planet (or a dwarf planet).</li>
      <li>The planet’s <b>gravity</b> provides the force that keeps each moon in its orbit.</li>
      <li>Moons closer to their planet move faster and take less time to go round, just as the inner planets do round the Sun.</li>
      <li>Moons come in all sizes. Ganymede and Titan are bigger than the planet Mercury, but they’re still moons, because they orbit a planet, not the Sun.</li>
      <li>Mercury and Venus have no moons. The giant planets have dozens, and astronomers keep finding more small ones.</li>
    </ul>`,
  sats: `<ul>
      <li>An <b>artificial satellite</b> is one that people have built and launched into orbit. Thousands of them orbit the Earth.</li>
      <li>Like the Moon, they are kept in orbit by the <b>Earth’s gravity</b>.</li>
      <li>Satellites in <b>low orbits</b>, a few hundred kilometres up, go round in about an hour and a half. Higher satellites move more slowly and take longer to go round.</li>
      <li>A <b>geostationary</b> satellite orbits above the equator once a day, in the same direction as the Earth spins, so it stays above the same place.</li>
      <li>A satellite in a <b>polar orbit</b> passes over the North and South Poles. The Earth turns beneath it, so it can see the whole planet.</li>
      <li>The Moon, our natural satellite, is about 9 times further from the Earth’s centre than a geostationary satellite, and takes 27 days to go round.</li>
      <li>The number of satellites is rising fast: there are about 17 000 working ones (November 2026), most of them in low orbits. Tick “Show every working satellite” to see them.</li>
    </ul>
    <h3 style="font-size:1rem;margin:14px 0 6px">Planets, moons and artificial satellites compared</h3>
    <p><b>What’s the same:</b> planets, moons and artificial satellites all orbit something bigger than themselves, in orbits that are almost circles, and <b>gravity</b> provides the force that keeps them there. The further out they are, the slower they go.</p>
    <table class="likeness">
      <tr><th></th><th>Planet</th><th>Dwarf planet</th><th>Moon</th><th>Artificial satellite</th></tr>
      <tr><th>Orbits</th><td>the Sun</td><td>the Sun</td><td>a planet or dwarf planet</td><td>usually the Earth</td></tr>
      <tr><th>Natural or made?</th><td>natural</td><td>natural</td><td>natural</td><td>made by people</td></tr>
      <tr><th>Size</th><td>4900 to 143 000 km across</td><td>a few hundred to 2400 km across</td><td>from a few km to 5300 km across</td><td>a few metres (the space station is about 100 m)</td></tr>
      <tr><th>Its path</th><td>cleared of other objects</td><td>shared with other objects</td><td>round its planet</td><td>chosen for its job</td></tr>
    </table>`,
};

function fmtYears(T) { return T === 1 ? '1 Earth year (365¼ days)' : T < 1 ? `${T.toFixed(2)} Earth years (${Math.round(T * 365.25)} days)` : `${T < 20 ? T.toFixed(1) : spaced(T)} Earth years`; }
function render() {
  const t = state.tab;
  let html = '';
  if (t === 'solar') {
    if (sol.pick === 'Sun') html = '<dl class="readout"><dt>Type</dt><dd>Star</dd><dt>Diameter</dt><dd>1.39 million km (109 × Earth)</dd><dt>Surface temperature</dt><dd>about 5500 °C</dd></dl><p>The Sun is the only star in our solar system. It has 99.8% of the solar system’s mass, and its gravity keeps everything else in orbit. It gives out light; the planets and moons only reflect it.</p>';
    else {
      const b = byName[sol.pick];
      html = `<p style="font-weight:800;font-size:1.05rem;margin-bottom:6px">${b.name}</p><dl class="readout"><dt>Type</dt><dd>${b.kind}</dd><dt>Distance from the Sun</dt><dd>${spaced(b.a * AU)} million km</dd><dt>Time to orbit the Sun</dt><dd>${fmtYears(b.T)}</dd><dt>Diameter</dt><dd>${spaced(b.d)} km${b.name === 'Earth' ? '' : ` (${(b.d / 12756).toFixed(b.d < 12756 ? 2 : 1)} × Earth)`}</dd><dt>Moons</dt><dd>${b.moons}</dd><dt>Average temperature</dt><dd>${b.temp < 0 ? '−' : ''}${Math.abs(b.temp)} °C</dd></dl><p>${b.fact}</p>`;
    }
    html += '<p class="note">Time passed: <b id="clock"></b></p>';
  } else if (t === 'moons') {
    const name = pressed('host'), h = HOSTS[name], m = h.moons.find((x) => x.name === mo.pick[name]);
    const hours = m.T * 24;
    html = `<p style="font-weight:800;font-size:1.05rem;margin-bottom:6px">${m.name}</p><dl class="readout"><dt>Orbits</dt><dd>${name}</dd><dt>Distance from ${name}’s centre</dt><dd>${spaced(m.r)} km</dd><dt>Time to orbit</dt><dd>${m.T < 2 ? `${hours.toFixed(1)} hours` : `${m.T.toFixed(1)} days`}</dd><dt>Diameter</dt><dd>${spaced(m.d)} km</dd></dl><p>${m.fact}</p>`;
    html += `<p>${name} has ${h.count} known moon${h.count === '1' ? '' : 's'}${h.moons.length < Number(h.count.replace('+', '')) || h.count.includes('+') ? `. These are the ${h.moons.length} biggest` : ''}. ${h.moons.length > 1 ? 'The closer a moon is, the less time it takes to go round.' : ''}${name === 'Earth' ? '' : ' For comparison, our Moon is 3475 km across, and the planet Mercury is 4879 km.'}</p>`;
    html += '<p class="note">Time passed: <b id="clock"></b></p>';
  } else {
    const s = SATS[pressed('sat')], r = RE + s.h, v = (TAU * r) / (s.T * 3600);
    const time = s.T < 3 ? `${Math.round(s.T * 60)} minutes` : `${Math.floor(s.T)} h ${Math.round((s.T % 1) * 60)} min`;
    html = `<p style="font-weight:800;font-size:1.05rem;margin-bottom:6px">${s.name}</p><dl class="readout"><dt>Height above the ground</dt><dd>${spaced(s.h)} km</dd><dt>Time to orbit</dt><dd>${time}</dd><dt>Speed</dt><dd>${v.toFixed(1)} km/s</dd></dl><p><b>Orbit:</b> ${s.orbit}.</p><p><b>Used for:</b> ${s.use}</p>`;
    html += '<p>The higher the orbit, the slower the satellite moves, and the longer it takes to go round.</p>';
    if ($('crowd').checked) html += '<p><b>Every working satellite:</b> about 17 000 in November 2026, and the number is rising fast. Grey dots are in low orbits, blue dots in medium orbits (mostly satnav) and pink dots in geostationary orbit.</p><p>About two-thirds of them belong to one internet network, Starlink. As well as working satellites, tens of thousands of pieces of space junk are tracked: dead satellites, old rocket parts and broken pieces that could crash into working satellites.</p>';
    html += '<p class="note">Time passed: <b id="clock"></b></p>';
  }
  $('info').innerHTML = html;
  document.querySelectorAll('#ptable tbody tr').forEach((tr) => tr.classList.toggle('on', tr.dataset.n === sol.pick));
  tickClock(true);
}
let lastClock = 0;
function tickClock(force) {
  const el = $('clock');
  if (!el || (!force && performance.now() - lastClock < 100)) return;
  lastClock = performance.now();
  const text = state.tab === 'solar' ? `${sol.t.toFixed(1)} Earth years` : state.tab === 'moons' ? `${mo.t.toFixed(1)} days` : `${Math.floor(sa.t)} h ${String(Math.floor((sa.t % 1) * 60)).padStart(2, '0')} min`;
  // Change the words in place, so the page's watchers (key words, tips) don't see a new element ten times a second
  if (el.firstChild) el.firstChild.nodeValue = text; else el.textContent = text;
}

// ---------- Controls ----------

$('ptable').querySelector('tbody').innerHTML = BODIES.map((b) => `<tr data-n="${b.name}"><th>${b.name}</th><td>${b.kind}</td><td>${spaced(b.a * AU)}</td><td>${b.T < 1 ? b.T.toFixed(2) : b.T < 20 ? b.T.toFixed(1) : spaced(b.T)}</td><td>${spaced(b.d)}</td><td>${b.moons}</td><td>${b.temp < 0 ? '−' : ''}${Math.abs(b.temp)}</td></tr>`).join('');
$('crowd').addEventListener('change', render);
$('ptable').addEventListener('click', (e) => { const tr = e.target.closest('tr[data-n]'); if (tr) { sol.pick = tr.dataset.n; render(); } });

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = !el.dataset.for.split(' ').includes(t); });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = EXPLAIN[t];
  cv.setAttribute('aria-label', { solar: 'The Sun with the planets and dwarf planets orbiting it', moons: 'A planet with its moons orbiting it', sats: 'The Earth turning, with satellites in four different orbits' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'solar' ? location.pathname + location.search : `#${t}`);
  render();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
for (const id of ['view', 'host', 'sat', 'zoom']) {
  document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll(`#${id} .chip`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (id === 'view' && !VIEWS[b.dataset.v].has(byName[sol.pick] || { a: 1 }) && sol.pick !== 'Sun') sol.pick = b.dataset.v === 'outer' ? 'Jupiter' : 'Earth';
    render();
  }));
}
function syncPlay() { $('play').textContent = state.playing ? '⏸ Pause' : '▶ Play'; }
$('play').addEventListener('click', () => { state.playing = !state.playing; syncPlay(); });
$('lineup').addEventListener('click', () => { sol.lined = true; sol.t = 0; state.playing = true; syncPlay(); tickClock(true); });

// Tap a planet, moon or satellite to find out about it
PK.dragOn(cv, W, H, {
  hit: (p) => {
    if (state.tab === 'solar') {
      const near = solarLayout().map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) })).filter((o) => o.d < o.q.r + 14).sort((a, b) => a.d - b.d)[0];
      if (near) return `b:${near.q.b.name}`;
      return Math.hypot(p.x - CX, p.y - CY) < VIEWS[pressed('view')].sun + 10 ? 'b:Sun' : null;
    }
    if (state.tab === 'moons') {
      const near = moonLayout().list.map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) })).filter((o) => o.d < o.q.rad + 16).sort((a, b) => a.d - b.d)[0];
      return near ? `m:${near.q.m.name}` : null;
    }
    const near = satLayout().sats.map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) })).filter((o) => o.d < 22).sort((a, b) => a.d - b.d)[0];
    return near ? `s:${near.q.k}` : null;
  },
  tap: (k) => {
    if (k.startsWith('b:')) { sol.pick = k.slice(2); render(); }
    else if (k.startsWith('m:')) { mo.pick[pressed('host')] = k.slice(2); render(); }
    else if (k.startsWith('s:')) { document.querySelectorAll('#sat .chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === k.slice(2)))); render(); }
  },
});

// What's been picked goes in a shared link
PK.shareState = {
  get: () => ({ p: sol.pick, m: mo.pick }),
  set: (o) => {
    if (o.p && (byName[o.p] || o.p === 'Sun')) sol.pick = o.p;
    if (o.m && typeof o.m === 'object') for (const [h, n] of Object.entries(o.m)) if (HOSTS[h] && HOSTS[h].moons.some((m) => m.name === n)) mo.pick[h] = n;
    render();
  },
};

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function step(dt) {
  if (!state.playing) return;
  if (state.tab === 'solar') sol.t += dt / VIEWS[pressed('view')].year;
  else if (state.tab === 'moons') mo.t += dt / HOSTS[pressed('host')].day;
  else if (state.tab === 'sats') sa.t += dt / 2;   // 1 hour every 2 seconds
}
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (cv.clientWidth) {
    step(dt);
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    sky();
    ({ solar: drawSolar, moons: drawMoons, sats: drawSats })[state.tab]();
    tickClock(false);
  }
  requestAnimationFrame(frame);
}

showTab(['#moons', '#sats'].includes(PK.initialHash) ? PK.initialHash.slice(1) : 'solar');
requestAnimationFrame(frame);
