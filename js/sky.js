// Earth, Sun and Moon: day and night (with how much of the Sun's energy each part of the surface
// receives), the seasons, and the phases of the Moon.
// The Sun's declination is δ = 23.44° × sin(2π (day − 80) ÷ 365). The energy falling on each m²
// of ground depends on the Sun's height: a low Sun spreads the same light over a bigger area.

PK.header({
  title: 'Earth, Sun & Moon',
  spec: [
    { code: 'KS3', text: 'Space physics: the Earth’s rotation causes day and night; its tilted axis and orbit cause the seasons' },
    { code: 'KS3', text: 'How the Sun’s height in the sky and day length change the light and heating at the surface' },
    { code: 'KS3', text: 'The Moon orbits the Earth; its phases are caused by how much of its sunlit half we can see' },
    { code: 'KS3', text: 'The Sun is a star; the solar system; a year, a month and a day' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const RAD = Math.PI / 180, TILT = 23.44, UK = { lat: 52.5, lon: -1.5 };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }

// tilt: the axial tilt used in the Seasons tab (Earth's, or another planet's)
const state = { tab: 'day', day: 171, hour: 12, spin: true, heat: false, moonDay: 0, moonPlay: false, tilt: TILT, four: false };

// The axis stays pointing the same way in space while the planet orbits. The orbit angle is how
// far round it has gone since the June solstice, when the North Pole leans towards the Sun.
const orbitAngle = (day) => (2 * Math.PI * (day - 171)) / 365;
const decl = (day, tilt = TILT) => Math.asin(Math.sin(tilt * RAD) * Math.cos(orbitAngle(day))) / RAD;
function dateText(day) { let m = 11; while (MONTH_START[m] > day) m--; return `${day - MONTH_START[m] + 1} ${MONTHS[m]}`; }
// Hours of daylight at a latitude (degrees) for a declination (degrees)
function dayLength(lat, d) {
  const c = -Math.tan(lat * RAD) * Math.tan(d * RAD);
  if (c <= -1) return 24; if (c >= 1) return 0;
  return (2 * Math.acos(c)) / RAD / 15;
}
const noonHeight = (lat, d) => 90 - Math.abs(lat - d);
// Average energy from the Sun per m² over a whole day, at the top of the atmosphere (W/m²)
function dailyAverage(lat, d) {
  const p = lat * RAD, q = d * RAD, c = -Math.tan(p) * Math.tan(q);
  const h0 = c <= -1 ? Math.PI : c >= 1 ? 0 : Math.acos(c);
  return (1361 / Math.PI) * (h0 * Math.sin(p) * Math.sin(q) + Math.cos(p) * Math.cos(q) * Math.sin(h0));
}
function seasonNorth(day) {
  if (day >= 79 && day < 171) return 'spring'; if (day >= 171 && day < 264) return 'summer';
  if (day >= 264 && day < 354) return 'autumn'; return 'winter';
}
const opposite = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' };
// Which way the North Pole leans, from the Sun's declination
function leanText(d) {
  if (d > 4) return 'North Pole tilted towards the Sun';
  if (d < -4) return 'North Pole tilted away from the Sun';
  return 'Tilted sideways: neither pole leans towards the Sun';
}

// ---------- A simple world map (rough shapes of the continents) ----------

const BLOBS = [
  [48, -100, 20, 30], [65, -115, 10, 35], [17, -95, 9, 10], [-12, -58, 22, 15], [-38, -67, 12, 7], [72, -42, 10, 16],
  [50, 12, 10, 22], [62, 20, 7, 14], [5, 20, 22, 18], [-22, 26, 12, 11], [50, 90, 17, 50], [22, 79, 10, 11], [32, 108, 11, 15],
  [66, 100, 8, 55], [23, 46, 8, 10], [-25, 134, 10, 17], [-84, 0, 9, 180], [54, -2.5, 4.5, 3], [36, 138, 6, 5], [-2, 115, 6, 12],
];
const MW = 360, MH = 180, land = new Uint8Array(MW * MH);
for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
  const lat = 90 - j - 0.5, lon = i - 180 + 0.5;
  land[j * MW + i] = BLOBS.some(([a, b, ra, rb]) => { let dl = Math.abs(lon - b); if (dl > 180) dl = 360 - dl; return ((lat - a) / ra) ** 2 + (dl / rb) ** 2 < 1; }) ? 1 : 0;
}
const isLand = (lat, lon) => { const j = Math.min(MH - 1, Math.max(0, Math.floor(90 - lat))); const i = ((Math.floor(lon + 180) % 360) + 360) % 360; return land[j * MW + i]; };

// ---------- Drawing a lit, tilted globe ----------

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
// Camera looking from direction d (towards the viewer), with screen-right r and screen-up u.
function lookFrom(d) {
  d = norm(d); const r = norm([d[1], -d[0], 0]); let u = cross(d, r); if (u[2] < 0) u = u.map((v) => -v);
  return { d, r, u };
}
// An Earth-fixed frame: axis A, e1 towards the midday meridian (the Sun's side), e2 east.
function earthFrame(A, S) {
  let e1 = S.map((v, k) => v - dot(S, A) * A[k]);
  if (Math.hypot(...e1) < 1e-3) e1 = Math.abs(A[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  e1 = norm(e1.map((v, k) => v - dot(e1, A) * A[k]));
  return { A, e1, e2: cross(A, e1) };
}
const heatColour = (I) => {
  const stops = [[0, [24, 34, 80]], [0.25, [110, 50, 140]], [0.5, [210, 60, 60]], [0.75, [245, 150, 40]], [1, [255, 240, 120]]];
  for (let s = 1; s < stops.length; s++) if (I <= stops[s][0]) { const [a, ca] = stops[s - 1], [b, cb] = stops[s]; const f = (I - a) / (b - a); return ca.map((v, k) => v + (cb[k] - v) * f); }
  return stops[stops.length - 1][1];
};
// An offscreen canvas to render a globe into
function makeGlobe(n) { const c = document.createElement('canvas'); c.width = n; c.height = n; const g = c.getContext('2d'); return { c, g, img: g.createImageData(n, n), n }; }
// Render a globe seen by cam, lit from direction S. subLon: the longitude where it is midday.
function renderGlobe(G, cam, F, S, subLon, heat) {
  const { d, r, u } = cam, data = G.img.data, n = G.n, eqW = (90 / n) * 1.6;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const nx = (x + 0.5) / (n / 2) - 1, ny = 1 - (y + 0.5) / (n / 2), q = nx * nx + ny * ny, o = (y * n + x) * 4;
    if (q > 1) { data[o + 3] = 0; continue; }
    const nz = Math.sqrt(1 - q);
    const N = [nx * r[0] + ny * u[0] + nz * d[0], nx * r[1] + ny * u[1] + nz * d[1], nx * r[2] + ny * u[2] + nz * d[2]];
    const I = Math.max(0, dot(N, S));
    const lat = Math.asin(Math.max(-1, Math.min(1, dot(N, F.A)))) / RAD;
    let col;
    if (heat) col = heatColour(I);
    else {
      const lon = Math.atan2(dot(N, F.e2), dot(N, F.e1)) / RAD + subLon;
      const base = Math.abs(lat) > 72 ? [232, 240, 245] : isLand(lat, lon) ? [86, 160, 70] : [38, 104, 172];
      const light = I > 0 ? 0.3 + 0.7 * Math.min(1, I * 1.4 + 0.1) : 0.1;
      col = base.map((v) => v * light);
      if (I === 0) col = col.map((v, k) => v * 0.7 + [8, 12, 34][k] * 0.3);
    }
    if (Math.abs(lat) < eqW) col = col.map((v) => v * 0.45 + 255 * 0.55 * (I > 0 ? 1 : 0.45));   // the equator
    data[o] = col[0]; data[o + 1] = col[1]; data[o + 2] = col[2]; data[o + 3] = 255;
  }
  G.g.putImageData(G.img, 0, 0);
}
// Draw the axis through a globe at (cx, cy), radius R, with an upright dashed line to compare.
function drawAxis(c, cam, A, cx, cy, R, tilt, opts = {}) {
  const ext = opts.ext ?? 1.35, sx = dot(A, cam.r), sy = dot(A, cam.u), vy = dot([0, 0, 1], cam.u);
  c.save();
  if (opts.upright !== false) {
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.5; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(cx, cy - R * ext * vy); c.lineTo(cx, cy + R * ext * vy); c.stroke(); c.setLineDash([]);
  }
  c.strokeStyle = '#fff'; c.lineWidth = opts.width || 3; c.lineCap = 'round';
  const nx = cx + sx * R * ext, ny = cy - sy * R * ext, spx = cx - sx * R * ext, spy = cy + sy * R * ext;
  c.beginPath(); c.moveTo(nx, ny); c.lineTo(spx, spy); c.stroke();
  const len = Math.max(0.3, Math.hypot(sx, sy)), lx = (sx / len) * 12, ly = (-sy / len) * 12;
  c.fillStyle = '#fff'; c.font = `800 ${opts.font || 13}px ${font()}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('N', nx + lx, ny + ly);
  if (opts.south !== false) c.fillText('S', spx - lx, spy - ly);
  if (opts.spin) {   // which way it spins (anticlockwise seen from above the North Pole)
    const px = cx + sx * R * 1.08, py = cy - sy * R * 1.08;
    c.strokeStyle = '#7fd4ff'; c.lineWidth = 2.5;
    c.save(); c.translate(px, py); c.rotate(Math.atan2(sx, sy));
    c.beginPath(); c.ellipse(0, 0, 20, 7, 0, 0.15 * Math.PI, 0.85 * Math.PI, true); c.stroke();
    const ex = 20 * Math.cos(0.85 * Math.PI), ey = 7 * Math.sin(0.85 * Math.PI);
    c.fillStyle = '#7fd4ff'; c.beginPath(); c.moveTo(ex - 7, ey + 1); c.lineTo(ex + 3, ey - 5); c.lineTo(ex + 3, ey + 6); c.closePath(); c.fill();
    c.restore();
  }
  if (opts.label) {
    c.fillStyle = '#ffe082'; c.font = `800 14px ${font()}`; c.textAlign = 'left';
    c.fillText(`Axis tilted ${tilt.toFixed(1)}°`, cx + 30, cy - R * ext * vy + 2);
  }
  c.restore();
}

// ---------- Day and night ----------

const dc = $('dayview'), dctx = dc.getContext('2d');
const DW = 800, DH = 440, ER = 165, EX = 470, EY = 225;
const DAYG = makeGlobe(220);

// Frame with the Sun along +x and z at right angles to the orbit. The camera looks from 20°
// above the orbit, 75° round from the Sun, so the lit side is on the left and night on the right.
const CAM = (() => { const az = -75 * RAD, el = 20 * RAD; return lookFrom([Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)]); })();
const SUN_X = [1, 0, 0];
// The axis on a given day, seen in this Sun-fixed frame
function axisOnDay(day, tilt = TILT) {
  const t = orbitAngle(day), s = Math.sin(tilt * RAD);
  return norm([s * Math.cos(t), -s * Math.sin(t), Math.cos(tilt * RAD)]);
}

function ukPoint(F, subLon) {
  const la = UK.lat * RAD, lo = (UK.lon - subLon) * RAD;
  const N = [0, 1, 2].map((k) => Math.cos(la) * Math.cos(lo) * F.e1[k] + Math.cos(la) * Math.sin(lo) * F.e2[k] + Math.sin(la) * F.A[k]);
  return { N, visible: dot(N, CAM.d) > 0, sx: dot(N, CAM.r), sy: dot(N, CAM.u) };
}

function drawDay() {
  const k = dc.width / DW;
  dctx.setTransform(k, 0, 0, k, 0, 0);
  dctx.fillStyle = '#05070f'; dctx.fillRect(0, 0, DW, DH);
  // Stars
  dctx.fillStyle = 'rgba(255,255,255,.6)';
  for (let i = 0; i < 60; i++) dctx.fillRect((i * 137) % DW, (i * 89) % DH, 1.5, 1.5);
  // The Sun, off to the left, and its rays
  const g = dctx.createRadialGradient(-40, EY, 20, -40, EY, 160);
  g.addColorStop(0, '#fff7c2'); g.addColorStop(0.4, '#ffd23f'); g.addColorStop(1, 'rgba(255, 180, 0, 0)');
  dctx.fillStyle = g; dctx.fillRect(0, 0, 200, DH);
  dctx.strokeStyle = 'rgba(255, 220, 90, .35)'; dctx.lineWidth = 2;
  for (let y = 70; y <= 370; y += 50) { dctx.beginPath(); dctx.moveTo(120, y); dctx.lineTo(260, y); dctx.stroke(); dctx.beginPath(); dctx.moveTo(260, y); dctx.lineTo(250, y - 5); dctx.lineTo(250, y + 5); dctx.closePath(); dctx.fillStyle = 'rgba(255, 220, 90, .35)'; dctx.fill(); }
  dctx.fillStyle = '#fff3b0'; dctx.font = `800 15px ${font()}`; dctx.textAlign = 'left'; dctx.textBaseline = 'top'; dctx.fillText('Sunlight', 20, 18);

  const A = axisOnDay(state.day), F = earthFrame(A, SUN_X), subLon = (12 - state.hour) * 15;
  renderGlobe(DAYG, CAM, F, SUN_X, subLon, state.heat);
  dctx.imageSmoothingEnabled = true;
  dctx.drawImage(DAYG.c, EX - ER, EY - ER, ER * 2, ER * 2);
  dctx.strokeStyle = 'rgba(160, 190, 255, .35)'; dctx.lineWidth = 1.5; dctx.beginPath(); dctx.arc(EX, EY, ER, 0, Math.PI * 2); dctx.stroke();
  drawAxis(dctx, CAM, A, EX, EY, ER, TILT, { ext: 1.2, spin: true, label: true, font: 15 });
  dctx.fillStyle = '#ffe082'; dctx.font = `700 13px ${font()}`; dctx.textAlign = 'right'; dctx.textBaseline = 'top';
  dctx.fillText(leanText(decl(state.day)), DW - 14, 14);
  // The UK
  const p = ukPoint(F, subLon);
  if (p.visible) {
    const x = EX + p.sx * ER, y = EY - p.sy * ER;
    dctx.fillStyle = '#ff3b30'; dctx.strokeStyle = '#fff'; dctx.lineWidth = 2;
    dctx.beginPath(); dctx.arc(x, y, 6, 0, Math.PI * 2); dctx.fill(); dctx.stroke();
    dctx.fillStyle = '#fff'; dctx.textAlign = 'left'; dctx.textBaseline = 'middle'; dctx.font = `800 13px ${font()}`;
    dctx.fillText('UK', x + 10, y);
  }
  // Key for the heat view
  if (state.heat) {
    const gx = 640, gy = 380, gw = 140;
    for (let i = 0; i < gw; i++) { const c = heatColour(i / gw); dctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; dctx.fillRect(gx + i, gy, 1, 12); }
    dctx.fillStyle = '#fff'; dctx.font = `700 11px ${font()}`; dctx.textAlign = 'left'; dctx.textBaseline = 'top';
    dctx.fillText('none', gx, gy + 16); dctx.textAlign = 'right'; dctx.fillText('most', gx + gw, gy + 16);
    dctx.textAlign = 'center'; dctx.textBaseline = 'bottom'; dctx.fillText('Sun’s energy per m²', gx + gw / 2, gy - 4);
  }
  dctx.fillStyle = 'rgba(255,255,255,.75)'; dctx.font = `600 11px ${font()}`; dctx.textAlign = 'right'; dctx.textBaseline = 'bottom';
  dctx.fillText('Not to scale. The Sun is really about 100 times wider than the Earth.', DW - 10, DH - 8);
  return p;
}

function renderDayPanel(p) {
  const dl = decl(state.day);
  const el = Math.asin(Math.max(-1, Math.min(1, dot(p.N, SUN_X)))) / RAD;
  const hh = Math.floor(state.hour), mm = Math.floor((state.hour - hh) * 60);
  $('date-val').textContent = dateText(state.day);
  $('hour-val').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  $('day-read').innerHTML = `
    <dt>In the UK it is</dt><dd>${el > 0 ? 'day' : el > -6 ? 'twilight' : 'night'}</dd>
    <dt>Height of the Sun in the sky</dt><dd>${el > 0 ? `${el.toFixed(0)}°` : 'below the horizon'}</dd>
    <dt>Sunlight on each m² of ground (clear sky)</dt><dd>${el > 0 ? `about ${Math.round(1000 * Math.sin(el * RAD))} W` : '0 W'}</dd>
    <dt>Hours of daylight today</dt><dd>${dayLength(UK.lat, dl).toFixed(1)} h</dd>`;
}

// ---------- Seasons ----------

const sc = $('seasons'), sctx = sc.getContext('2d');
const SW = 800, SH = 420;
const OX = 215, OY = 215, RX = 165, RY = 82;
// The orbit is seen from above at an angle, so the camera is raised by asin(RY / RX)
const S_EL = Math.asin(RY / RX), SCAM = { d: [0, -Math.cos(S_EL), Math.sin(S_EL)], r: [1, 0, 0], u: [0, Math.sin(S_EL), Math.cos(S_EL)] };
const BIG = makeGlobe(72), SMALL = makeGlobe(52);
const PLANETS = { earth: ['Earth', TILT], mercury: ['Mercury', 0.03], mars: ['Mars', 25.2], uranus: ['Uranus', 97.8] };
let planet = 'earth';

// Position on the orbit (June on the left, so the North Pole, leaning left, points at the Sun)
function orbitPos(day) { const a = Math.PI + orbitAngle(day); return { x: OX + RX * Math.cos(a), y: OY - RY * Math.sin(a), w: [Math.cos(a), Math.sin(a), 0] }; }

function drawOrbitEarth(day, R, G, label) {
  const q = orbitPos(day), tilt = state.tilt;
  const A = norm([Math.sin(tilt * RAD), 0, Math.cos(tilt * RAD)]);      // fixed in space
  const S = norm(q.w.map((v) => -v));                                     // towards the Sun
  renderGlobe(G, SCAM, earthFrame(A, S), S, -UK.lon, false);
  sctx.drawImage(G.c, q.x - R, q.y - R, R * 2, R * 2);
  drawAxis(sctx, SCAM, A, q.x, q.y, R, tilt, { ext: 1.45, width: 2.5, font: 11, south: false, upright: R > 30 });
  if (label) {
    sctx.fillStyle = '#ffe082'; sctx.font = `800 13px ${font()}`; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
    const side = Math.abs(q.y - OY) < 10;
    sctx.fillText(label, q.x, side ? q.y + R + 26 : q.y > OY ? q.y + R + 16 : q.y - R - 42);
  }
}

function drawSeasons() {
  const k = sc.width / SW;
  sctx.setTransform(k, 0, 0, k, 0, 0);
  sctx.fillStyle = '#05070f'; sctx.fillRect(0, 0, SW, SH);
  sctx.strokeStyle = 'rgba(255,255,255,.3)'; sctx.lineWidth = 1.5; sctx.beginPath(); sctx.ellipse(OX, OY, RX, RY, 0, 0, Math.PI * 2); sctx.stroke();
  // Direction of travel round the orbit
  sctx.fillStyle = 'rgba(255,255,255,.5)';
  for (const day of [125, 310]) { const p = orbitPos(day), p2 = orbitPos(day + 6), ang = Math.atan2(p2.y - p.y, p2.x - p.x); sctx.save(); sctx.translate(p.x, p.y); sctx.rotate(ang); sctx.beginPath(); sctx.moveTo(8, 0); sctx.lineTo(-6, -6); sctx.lineTo(-6, 6); sctx.closePath(); sctx.fill(); sctx.restore(); }
  const g = sctx.createRadialGradient(OX, OY, 4, OX, OY, 46); g.addColorStop(0, '#fff7c2'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, 'rgba(255,180,0,0)');
  const drawSun = () => {
    sctx.fillStyle = g; sctx.beginPath(); sctx.arc(OX, OY, 46, 0, Math.PI * 2); sctx.fill();
    sctx.fillStyle = '#5a3d00'; sctx.font = `800 12px ${font()}`; sctx.textAlign = 'center'; sctx.textBaseline = 'middle'; sctx.fillText('Sun', OX, OY);
  };
  // Earths further away (higher up the picture) are drawn first, then the Sun, then nearer ones
  const four = state.four ? [[79, 'spring'], [171, 'summer'], [264, 'autumn'], [354, 'winter']] : [];
  const items = four.map(([d, s]) => ({ d, s, R: 26, G: SMALL }));
  if (!four.some(([d]) => Math.abs(d - state.day) < 12)) items.push({ d: state.day, R: state.four ? 26 : 34, G: state.four ? SMALL : BIG });
  items.sort((a, b) => orbitPos(a.d).y - orbitPos(b.d).y);
  let sunDrawn = false;
  for (const it of items) {
    if (!sunDrawn && orbitPos(it.d).y > OY) { drawSun(); sunDrawn = true; }
    drawOrbitEarth(it.d, it.R, it.G, it.s ? (state.tilt < 1 ? PK.ansText('no seasons') : PK.ansText(it.s)) : null);
  }
  if (!sunDrawn) drawSun();
  // Month names round the orbit
  if (!state.four) {
    sctx.fillStyle = 'rgba(255,255,255,.6)'; sctx.font = `700 11px ${font()}`; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
    for (const [day, name] of [[171, 'June'], [264, 'September'], [354, 'December'], [79, 'March']]) {
      const q = orbitPos(day);
      sctx.fillText(name, q.x, q.y < OY - 10 ? q.y - 50 : q.y + 50);
    }
  }
  const dl = decl(state.day, state.tilt);
  sctx.fillStyle = '#ffe082'; sctx.font = `700 13px ${font()}`; sctx.textAlign = 'left'; sctx.textBaseline = 'top';
  sctx.fillText(state.tilt < 1 ? 'No tilt: neither pole leans towards the Sun' : leanText(dl), 14, 12);
  sctx.fillStyle = 'rgba(255,255,255,.7)'; sctx.font = `600 11px ${font()}`; sctx.textBaseline = 'bottom';
  sctx.fillText(`The axis always points the same way in space (tilted ${state.tilt.toFixed(state.tilt < 1 ? 0 : 1)}°). Not to scale.`, 14, SH - 8);

  // Midday sunshine: a beam of the same width spreads over more ground when the Sun is low
  const h = noonHeight(UK.lat, dl), BX = 600, GY = 330;
  sctx.fillStyle = '#17202c'; sctx.fillRect(430, 30, 350, 370);
  sctx.fillStyle = '#5c8a3a'; sctx.fillRect(440, GY, 330, 50);
  sctx.fillStyle = '#fff'; sctx.font = `800 13px ${font()}`; sctx.textAlign = 'center'; sctx.textBaseline = 'top';
  sctx.fillText(planet === 'earth' ? 'Midday sunshine in the UK' : 'Midday sunshine at the UK’s latitude', 605, 40);
  if (h <= 0.5) {
    sctx.font = `700 12px ${font()}`; sctx.fillText('The Sun doesn’t rise at all today', 605, 62);
    sctx.fillText('It is dark all day: no heating from the Sun', 605, GY + 18);
    return;
  }
  const a = h * RAD, beamW = 46, spread = beamW / Math.sin(a);
  const dx = Math.cos(a), dy = -Math.sin(a), L = 230;
  const x1 = BX - spread / 2, x2 = BX + spread / 2;
  sctx.save(); sctx.beginPath(); sctx.rect(430, 30, 350, 370); sctx.clip();
  sctx.fillStyle = 'rgba(255, 220, 80, .35)';
  sctx.beginPath(); sctx.moveTo(x1, GY); sctx.lineTo(x2, GY); sctx.lineTo(x2 - dx * L, GY + dy * L); sctx.lineTo(x1 - dx * L, GY + dy * L); sctx.closePath(); sctx.fill();
  sctx.strokeStyle = '#ffd23f'; sctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { const sx = x1 + (spread * i) / 4; sctx.beginPath(); sctx.moveTo(sx - dx * L, GY + dy * L); sctx.lineTo(sx, GY); sctx.stroke(); }
  const bright = Math.sin(a);
  sctx.fillStyle = `rgba(255, ${Math.round(150 + 90 * bright)}, 40, ${0.35 + 0.6 * bright})`;
  sctx.fillRect(x1, GY - 3, spread, 8);
  const sunD = Math.min(200, (BX - 460) / Math.max(0.01, dx));
  const sunX = BX - dx * sunD, sunY = GY + dy * sunD;
  const sg = sctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 26); sg.addColorStop(0, '#fff7c2'); sg.addColorStop(0.5, '#ffd23f'); sg.addColorStop(1, 'rgba(255,180,0,0)');
  sctx.fillStyle = sg; sctx.beginPath(); sctx.arc(sunX, sunY, 26, 0, Math.PI * 2); sctx.fill();
  sctx.restore();
  sctx.fillStyle = '#fff'; sctx.font = `700 12px ${font()}`;
  sctx.fillText(`Sun ${h.toFixed(0)}° above the horizon`, 605, 62);
  sctx.fillText(`The light is spread over ${(1 / Math.sin(a)).toFixed(1)} × the area`, 605, GY + 18);
  sctx.fillText('it would cover if the Sun were overhead', 605, GY + 34);
}

function renderSeasonsPanel() {
  const t = state.tilt, dl = decl(state.day, t), n = seasonNorth(state.day);
  $('s-date-val').textContent = dateText(state.day);
  let best = 0; for (let d = 0; d < 365; d += 2) best = Math.max(best, dailyAverage(UK.lat, decl(d, t)));
  const avg = dailyAverage(UK.lat, dl), pct = best > 0 ? (avg / best) * 100 : 0;
  const none = t < 1, h = noonHeight(UK.lat, dl), earth = planet === 'earth';
  $('s-read').innerHTML = `
    <dt>Axial tilt</dt><dd>${t < 1 ? 'almost 0' : t.toFixed(1)}°</dd>
    <dt>Season ${earth ? 'in the UK' : 'in the north'}</dt><dd>${none ? 'no seasons' : n}</dd>
    <dt>Season ${earth ? 'in Australia' : 'in the south'}</dt><dd>${none ? 'no seasons' : opposite[n]}</dd>
    <dt>Sun’s height at midday</dt><dd>${h > 0 ? `${h.toFixed(0)}°` : 'below the horizon'}</dd>
    <dt>Hours of daylight</dt><dd>${dayLength(UK.lat, dl).toFixed(1)} h</dd>
    <dt>Sun’s energy per m² over the day</dt><dd>${Math.round(pct)}% of midsummer</dd>`;
  $('s-bar').style.width = `${Math.max(2, pct)}%`;
  document.querySelectorAll('#planets .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === planet)));
  $('planet-note').hidden = earth;
}

// ---------- Phases of the Moon ----------

const mc = $('moon'), mctx = mc.getContext('2d');
const MW2 = 800, MH2 = 400, PERIOD = 29.53;
const PHASES = [[1.85, 'New moon'], [5.5, 'Waxing crescent'], [9.2, 'First quarter'], [12.9, 'Waxing gibbous'], [16.6, 'Full moon'], [20.3, 'Waning gibbous'], [24.0, 'Last quarter'], [27.7, 'Waning crescent'], [99, 'New moon']];
const phaseName = (d) => PHASES.find(([end]) => d < end)[1];

function moonDisc(c, x, y, R, day) {
  const phi = (2 * Math.PI * day) / PERIOD, waxing = day < PERIOD / 2, side = waxing ? 1 : -1;
  c.fillStyle = '#2b2f3a'; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f4f1e6'; c.beginPath();
  for (let i = 0; i <= 40; i++) { const s = (Math.PI * i) / 40; const px = x + side * R * Math.sin(s), py = y - R * Math.cos(s); i ? c.lineTo(px, py) : c.moveTo(px, py); }
  for (let i = 0; i <= 40; i++) { const s = (Math.PI * i) / 40; const px = x + side * R * Math.cos(phi) * Math.sin(s), py = y + R * Math.cos(s); c.lineTo(px, py); }
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.stroke();
}

function drawMoon() {
  const k = mc.width / MW2;
  mctx.setTransform(k, 0, 0, k, 0, 0);
  mctx.fillStyle = '#05070f'; mctx.fillRect(0, 0, MW2, MH2);
  // Sunlight from the left
  mctx.strokeStyle = 'rgba(255, 220, 90, .3)'; mctx.lineWidth = 2;
  for (let y = 50; y <= 350; y += 50) { mctx.beginPath(); mctx.moveTo(10, y); mctx.lineTo(80, y); mctx.stroke(); }
  mctx.fillStyle = '#fff3b0'; mctx.font = `800 13px ${font()}`; mctx.textAlign = 'left'; mctx.textBaseline = 'top'; mctx.fillText('Sunlight', 12, 14);
  // Top-down view: Earth in the middle, the Moon's orbit round it
  const EXm = 270, EYm = 200, R = 140;
  mctx.strokeStyle = 'rgba(255,255,255,.3)'; mctx.setLineDash([4, 6]); mctx.beginPath(); mctx.arc(EXm, EYm, R, 0, Math.PI * 2); mctx.stroke(); mctx.setLineDash([]);
  mctx.fillStyle = '#2f7fd0'; mctx.beginPath(); mctx.arc(EXm, EYm, 26, 0, Math.PI * 2); mctx.fill();
  mctx.fillStyle = 'rgba(0,0,0,.55)'; mctx.beginPath(); mctx.arc(EXm, EYm, 26, -Math.PI / 2, Math.PI / 2); mctx.closePath(); mctx.fill();
  mctx.fillStyle = '#fff'; mctx.font = `700 12px ${font()}`; mctx.textAlign = 'center'; mctx.fillText('Earth', EXm, EYm + 32);
  // The Moon: always half lit (the half facing the Sun)
  const ang = Math.PI + (2 * Math.PI * state.moonDay) / PERIOD;   // starts between the Earth and the Sun
  const mx = EXm + R * Math.cos(ang), my = EYm - R * Math.sin(ang);
  mctx.fillStyle = '#f4f1e6'; mctx.beginPath(); mctx.arc(mx, my, 14, 0, Math.PI * 2); mctx.fill();
  mctx.fillStyle = '#2b2f3a'; mctx.beginPath(); mctx.arc(mx, my, 14, -Math.PI / 2, Math.PI / 2); mctx.closePath(); mctx.fill();
  mctx.strokeStyle = 'rgba(255,255,255,.45)'; mctx.setLineDash([3, 4]); mctx.beginPath(); mctx.moveTo(EXm, EYm); mctx.lineTo(mx, my); mctx.stroke(); mctx.setLineDash([]);
  mctx.fillStyle = '#fff'; mctx.fillText('Moon', mx, my + 18);
  mctx.fillStyle = 'rgba(255,255,255,.6)'; mctx.font = `600 11px ${font()}`; mctx.fillText('view from above the North Pole', EXm, 372);
  // What we see from Earth
  mctx.fillStyle = '#11151f'; mctx.fillRect(500, 40, 280, 320);
  mctx.fillStyle = '#fff'; mctx.font = `800 14px ${font()}`; mctx.fillText('What we see from the UK', 640, 52);
  moonDisc(mctx, 640, 200, 90, state.moonDay);
  mctx.font = `800 18px ${font()}`; mctx.fillText(phaseName(state.moonDay), 640, 304);
  const lit = (1 - Math.cos((2 * Math.PI * state.moonDay) / PERIOD)) / 2;
  mctx.font = `600 12px ${font()}`; mctx.fillText(`${Math.round(lit * 100)}% of the side facing us is lit`, 640, 330);
}

function renderMoonPanel() {
  $('m-day-val').textContent = `day ${state.moonDay.toFixed(1)}`;
  $('m-phase').textContent = phaseName(state.moonDay);
}

// ---------- Tabs, controls and loop ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-tab]').forEach((el) => { el.hidden = el.dataset.tab !== t; });
  sizeAll();
  history.replaceState(null, '', `#${t}`);
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));

function setDay(d) { state.day = d; $('date').value = d; $('s-date').value = d; renderSeasonsPanel(); }
$('date').addEventListener('input', (e) => setDay(Number(e.target.value)));
$('s-date').addEventListener('input', (e) => setDay(Number(e.target.value)));
document.querySelectorAll('.quick-date').forEach((b) => b.addEventListener('click', () => setDay(Number(b.dataset.d))));
$('hour').addEventListener('input', (e) => { state.hour = Number(e.target.value); state.spin = false; $('spin').textContent = '▶ Spin'; });
$('spin').addEventListener('click', () => { state.spin = !state.spin; $('spin').textContent = state.spin ? '❚❚ Stop spinning' : '▶ Spin'; });
$('heat').addEventListener('change', (e) => { state.heat = e.target.checked; });
$('four').addEventListener('change', (e) => { state.four = e.target.checked; });
document.querySelectorAll('#planets .chip').forEach((b) => b.addEventListener('click', () => { planet = b.dataset.p; state.tilt = PLANETS[planet][1]; renderSeasonsPanel(); }));
window.addEventListener('pk-answers', () => renderSeasonsPanel());
$('m-day').addEventListener('input', (e) => { state.moonDay = Number(e.target.value); state.moonPlay = false; $('m-play').textContent = '▶ Play'; renderMoonPanel(); });
$('m-play').addEventListener('click', () => { state.moonPlay = !state.moonPlay; $('m-play').textContent = state.moonPlay ? '❚❚ Pause' : '▶ Play'; });

function sizeAll() {
  if (state.tab === 'day') size(dc, DW, DH);
  if (state.tab === 'seasons') size(sc, SW, SH);
  if (state.tab === 'moon') size(mc, MW2, MH2);
}

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.tab === 'day') {
    if (state.spin) { state.hour = (state.hour + dt * 1.5) % 24; $('hour').value = state.hour; }
    const p = drawDay();
    if ((tick += dt) > 0.2) { tick = 0; renderDayPanel(p); }
  }
  if (state.tab === 'seasons') drawSeasons();
  if (state.tab === 'moon') {
    if (state.moonPlay) { state.moonDay = (state.moonDay + dt * 2) % PERIOD; $('m-day').value = state.moonDay; renderMoonPanel(); }
    drawMoon();
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeAll);
const startTab = location.hash.slice(1);
showTab(['day', 'seasons', 'moon'].includes(startTab) ? startTab : 'day');
setDay(state.day);
renderMoonPanel();
requestAnimationFrame(frame);
