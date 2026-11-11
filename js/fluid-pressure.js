// Pressure in fluids: the water pushing on a dam, a water tower with three spouts, and
// floating and sinking. The pressure due to a column of liquid is p = h ρ g.

PK.header({
  title: 'Pressure in fluids & upthrust',
  answers: true,
  spec: [
    { code: '4.5.5.1.1', text: 'A fluid can be either a liquid or a gas. The pressure in fluids causes a force normal (at right angles) to any surface', po: true },
    { code: '4.5.5.1.2', text: 'The pressure due to a column of liquid: p = h ρ g. Pressure at a point increases with the height of the column of liquid above it, and with the density of the liquid', po: true, ht: true },
    { code: '4.5.5.1.2', text: 'Calculate the differences in pressure at different depths in a liquid', po: true, ht: true },
    { code: '4.5.5.1.2', text: 'A submerged object has a greater pressure on its bottom surface than its top, giving a resultant force upwards: the upthrust. The factors that influence floating and sinking', po: true, ht: true },
    { code: 'KS3', text: 'Pressure in liquids, increasing with depth; upthrust effects, floating and sinking' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const G = 9.8;
const cv = $('scene'), c = cv.getContext('2d');
const W = 800, H = 460, INK = '#1c2430', PUSH = '#e65100';
let tab = 'dam';

function text(s, x, y, o = {}) {
  c.font = `${o.w || 700} ${o.s || 14}px ${font()}`; c.textAlign = o.a || 'center'; c.textBaseline = o.b || 'middle';
  c.fillStyle = o.col || INK; c.fillText(s, x, y);
}
function pill(s, x, y, col = INK, size = 14) {
  c.font = `800 ${size}px ${font()}`;
  const w = c.measureText(s).width + 16, left = clamp(x - w / 2, 4, W - w - 4);
  c.fillStyle = 'rgba(255,255,255,.93)'; c.beginPath(); c.roundRect(left, y - size / 2 - 5, w, size + 10, 7); c.fill();
  text(s, left + w / 2, y + 1, { s: size, w: 800, col });
}
function arrow(x1, y1, x2, y2, col, w = 3, head = 9) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); c.stroke(); c.lineCap = 'butt';
  c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head); c.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head); c.closePath(); c.fill();
}
const big = (n) => Math.round(n).toLocaleString('en-GB').replace(/,/g, ' ');   // 254 800, as AQA writes it
const kPa = (p) => (p >= 10000 ? Math.round(p / 1000) : Number((p / 1000).toFixed(1)));
const sky = (bottom) => { const g = c.createLinearGradient(0, 0, 0, bottom); g.addColorStop(0, '#8fcdf2'); g.addColorStop(1, '#e2f2fb'); c.fillStyle = g; c.fillRect(0, 0, W, bottom); };

// ---------- The dam ----------

const DAM = { base: 420, crest: 70, px: 5 };   // 5 px for each metre of depth
const LIQUIDS = { water: { name: 'fresh water', rho: 1000, col: '#4b97d8' }, sea: { name: 'sea water', rho: 1030, col: '#2f7bb2' }, oil: { name: 'oil', rho: 910, col: '#d9ad3c' } };
const liquid = () => LIQUIDS[$('liquid').value] || LIQUIDS.water;
const faceX = (y) => 420 - ((y - DAM.crest) / (DAM.base - DAM.crest)) * 20;   // the dam's upstream face leans slightly
const FACE = (() => { const tx = -20, ty = DAM.base - DAM.crest, l = Math.hypot(tx, ty); return { nx: ty / l, ny: -tx / l }; })();   // at right angles to the face, into the dam
const surfaceY = () => DAM.base - PK.num('depth') * DAM.px;
const sensors = [{ x: 160, y: 290 }, { x: 110, y: 380 }];
const dam = { movedLevel: false, movedSensor: false };
const depthAt = (y) => Math.max(0, (y - surfaceY()) / DAM.px);
const pAt = (y) => depthAt(y) * liquid().rho * G;
const activeSensors = () => sensors.slice(0, $('two').checked ? 2 : 1);
function keepSensorsIn() {
  for (const s of sensors) { s.y = clamp(s.y, surfaceY() + 14, DAM.base - 12); s.x = clamp(s.x, 34, faceX(s.y) - 18); }
}
function drawDam() {
  sky(DAM.base);
  c.fillStyle = '#9ccc7a'; c.beginPath(); c.moveTo(0, 150); c.quadraticCurveTo(170, 60, 330, 140); c.lineTo(330, DAM.base); c.lineTo(0, DAM.base); c.closePath(); c.fill();
  c.fillStyle = '#7cb35f'; c.beginPath(); c.moveTo(560, 200); c.quadraticCurveTo(700, 110, 800, 170); c.lineTo(800, DAM.base); c.lineTo(560, DAM.base); c.closePath(); c.fill();
  c.fillStyle = '#8d6e4c'; c.fillRect(0, DAM.base, W, H - DAM.base);
  // The reservoir
  const top = surfaceY(), L = liquid();
  c.fillStyle = L.col; c.beginPath(); c.moveTo(0, top); c.lineTo(faceX(top), top); c.lineTo(faceX(DAM.base), DAM.base); c.lineTo(0, DAM.base); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, top); c.lineTo(faceX(top), top); c.stroke();
  // The river below the dam
  c.fillStyle = 'rgba(52, 140, 220, .78)'; c.fillRect(612, DAM.base - 10, W - 612, 10);
  // The dam: thin at the top, thick at the bottom
  c.fillStyle = '#a3abb5'; c.beginPath(); c.moveTo(420, DAM.crest); c.lineTo(458, DAM.crest); c.lineTo(612, DAM.base); c.lineTo(400, DAM.base); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(60,70,80,.35)'; c.lineWidth = 1;
  for (let y = DAM.crest + 35; y < DAM.base; y += 35) { const x2 = 458 + ((y - DAM.crest) / (DAM.base - DAM.crest)) * 154; c.beginPath(); c.moveTo(faceX(y), y); c.lineTo(x2, y); c.stroke(); }
  c.fillStyle = '#6b7480'; c.fillRect(416, DAM.crest - 6, 46, 6);
  text('dam', 500, 250, { s: 16, w: 800, col: '#3a424c' });
  // Depth scale down the left
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2;
  for (let d = 10; d * DAM.px <= DAM.base - top + 0.1; d += 10) {
    const y = top + d * DAM.px;
    c.beginPath(); c.moveTo(0, y); c.lineTo(14, y); c.stroke();
    text(`${d} m`, 20, y, { s: 13, a: 'left', col: '#fff' });
  }
  // The water pushing on the dam, at right angles to its face, more strongly lower down
  const show = PK.answersShown();
  let k = 0;
  for (let d = 5; top + d * DAM.px < DAM.base - 2; d += 10, k++) {
    const y = top + d * DAM.px, fx = faceX(y), p = pAt(y), len = 8 + (p / 1000) * 0.2;
    arrow(fx - FACE.nx * len, y - FACE.ny * len, fx - 2, y, PUSH, 3.5, 10);
    if (k % 2 === 0 || top + (d + 10) * DAM.px >= DAM.base - 2) text(show ? `${kPa(p)} kPa` : '? kPa', fx - FACE.nx * len - 6, y - 12, { s: 12, w: 800, a: 'right', col: '#fff' });
  }
  // The pressure sensors
  keepSensorsIn();
  activeSensors().forEach((s, i) => {
    c.strokeStyle = '#2b2f3a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(s.x, s.y - 12); c.lineTo(s.x, top - 22); c.stroke();
    c.fillStyle = '#ffd54f'; c.strokeStyle = '#2b2f3a'; c.lineWidth = 2; c.beginPath(); c.arc(s.x, s.y, 12, 0, Math.PI * 2); c.fill(); c.stroke();
    text('AB'[i], s.x, s.y + 1, { s: 13, w: 900 });
    pill(`${'AB'[i]}: ${Math.round(depthAt(s.y))} m deep, ${kPa(pAt(s.y))} kPa`, s.x, s.y - 30, '#1e3a5f', 13);
  });
  if (!dam.movedSensor) pill('Drag the sensor', sensors[0].x, sensors[0].y + 30);
  if (!dam.movedLevel) pill('Drag the water level', 250, top - 16);
}
function damHit(p) {
  const hits = activeSensors().map((s, i) => [Math.hypot(p.x - s.x, p.y - s.y), i]).filter(([d]) => d < 26).sort((a, b) => a[0] - b[0]);
  if (hits.length) { const s = sensors[hits[0][1]]; return { what: 'sensor', i: hits[0][1], dx: s.x - p.x, dy: s.y - p.y }; }
  if (Math.abs(p.y - surfaceY()) < 16 && p.x < faceX(p.y)) return { what: 'level' };
  return null;
}
function damMove(d, p) {
  if (d.what === 'sensor') { const s = sensors[d.i]; s.x = p.x + d.dx; s.y = p.y + d.dy; dam.movedSensor = true; keepSensorsIn(); }
  else { PK.setNum('depth', Math.round(clamp((DAM.base - p.y) / DAM.px, 10, 68))); dam.movedLevel = true; }
}
function damStatus() {
  return 'The arrows show the force of the water on each part of the dam. They get longer lower down: the deeper the water, the bigger the pressure.';
}
function damWork() {
  const L = liquid(), list = activeSensors(), row = (s, n) => {
    const h = Math.round(depthAt(s.y)), p = h * L.rho * G;
    return `<p><b>Sensor ${n}</b> is ${h} m below the surface.<br>p = h ρ g = ${h} × ${L.rho} × 9.8 = ${PK.ans(`${big(p)} Pa (${kPa(p)} kPa)`)}</p>`;
  };
  let html = `<p class="note" style="margin-top:0">The pressure from the ${L.name}. The air above adds about 100 kPa more.</p>` + list.map((s, i) => row(s, 'AB'[i])).join('');
  if (list.length === 2) {
    const dh = Math.round(depthAt(list[1].y)) - Math.round(depthAt(list[0].y));
    html += `<p><b>Difference</b> = Δh × ρ × g = ${dh} × ${L.rho} × 9.8 = ${PK.ans(`${big(dh * L.rho * G)} Pa`)}</p>`;
  }
  return html;
}
const DAM_WHY = `<p><b>Why is a dam thicker at the bottom?</b> The pressure in a liquid increases with depth, because there’s a taller column of liquid above pushing down. So the water pushes hardest on the bottom of the dam, and the dam has to be strongest there.</p>
  <p><b>Why do the arrows point that way?</b> The pressure in a fluid causes a force at right angles to any surface it touches, so every arrow is at right angles to the face of the dam.</p>
  <p><b>What about a denser liquid?</b> A denser liquid has more mass above each point, so the pressure at the same depth is bigger.</p>`;

// ---------- The tower with three spouts ----------

const T = { left: 140, right: 240, base: 280, px: 200, stand: 0.8, height: 1.0 };   // 200 px for each metre
const HOLES = [0.8, 0.5, 0.2];   // how high each spout is above the bottom of the tank (m)
const FULL = 0.95, GROUND = T.base + T.stand * T.px;
const sp = { level: FULL, open: [true, true, true], flow: 0, tapped: false };
const holeY = (h) => T.base - h * T.px;
const levelY = () => T.base - sp.level * T.px;
function jet(i) {
  const d = sp.level - HOLES[i];
  if (!sp.open[i] || d <= 0.005) return null;
  const v = Math.sqrt(2 * G * d), fall = T.stand + HOLES[i], time = Math.sqrt((2 * fall) / G);
  return { d, v, time, range: v * time };
}
function stepSpouts(dt) {
  sp.flow = (sp.flow + dt * 60) % 24;
  if ($('full').checked) { sp.level = FULL; return; }
  let out = 0;
  for (let i = 0; i < 3; i++) { const j = jet(i); if (j) out += j.v; }
  sp.level = Math.max(0, sp.level - out * 0.0045 * dt);
}
function drawSpouts() {
  sky(GROUND);
  c.fillStyle = '#8d6e4c'; c.fillRect(0, GROUND, W, H - GROUND);
  // Distances along the ground, from the side of the tank
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2;
  for (let m = 0; T.right + m * T.px < W - 10; m += 0.5) {
    const x = T.right + m * T.px;
    c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, GROUND + 8); c.stroke();
    text(`${m} m`, x, GROUND + 16, { s: 12, col: '#fff' });
  }
  // The stand, the tank and the water in it
  c.strokeStyle = '#5b6470'; c.lineWidth = 7;
  c.beginPath(); c.moveTo(T.left + 12, T.base); c.lineTo(T.left - 6, GROUND); c.moveTo(T.right - 12, T.base); c.lineTo(T.right + 6, GROUND);
  c.moveTo(T.left + 4, T.base + 70); c.lineTo(T.right - 4, T.base + 70); c.stroke();
  const top = T.base - T.height * T.px;
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(T.left, top, T.right - T.left, T.base - top);
  c.fillStyle = 'rgba(52, 140, 220, .82)'; c.fillRect(T.left, levelY(), T.right - T.left, T.base - levelY());
  c.strokeStyle = '#5b6470'; c.lineWidth = 4; c.beginPath(); c.moveTo(T.left, top); c.lineTo(T.left, T.base); c.lineTo(T.right, T.base); c.lineTo(T.right, top); c.stroke();
  // Topping it up from a pipe above
  if ($('full').checked) {
    c.strokeStyle = '#5b6470'; c.lineWidth = 8; c.beginPath(); c.moveTo(60, top - 30); c.lineTo(T.left + 40, top - 30); c.lineTo(T.left + 40, top - 14); c.stroke();
    c.strokeStyle = 'rgba(52, 140, 220, .75)'; c.lineWidth = 5; c.beginPath(); c.moveTo(T.left + 40, top - 10); c.lineTo(T.left + 40, levelY()); c.stroke();
  }
  // The jets: the deeper the spout, the faster the water comes out and the further it goes
  const show = PK.answersShown();
  HOLES.forEach((h, i) => {
    const y = holeY(h), j = jet(i), x0 = T.right + 14;
    c.fillStyle = '#5b6470'; c.fillRect(T.right, y - 5, 14, 10);
    if (j) {
      const pts = [];
      for (let k = 0; k <= 40; k++) { const t = (j.time * k) / 40; pts.push([x0 + j.v * t * T.px, y + 0.5 * G * t * t * T.px]); }
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(52, 140, 220, .85)'; c.lineWidth = 6; c.beginPath(); pts.forEach(([x, yy], n) => (n ? c.lineTo(x, yy) : c.moveTo(x, yy))); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.setLineDash([6, 18]); c.lineDashOffset = -sp.flow; c.stroke(); c.setLineDash([]);
      c.lineCap = 'butt';
      const [lx] = pts[pts.length - 1];
      c.fillStyle = 'rgba(52, 140, 220, .6)'; c.beginPath(); c.ellipse(lx, GROUND, 12, 4, 0, 0, Math.PI * 2); c.fill();
    } else if (!sp.open[i]) {
      c.fillStyle = '#c62828'; c.beginPath(); c.roundRect(x0 - 2, y - 7, 12, 14, 3); c.fill();
    }
    const d = Math.max(0, sp.level - h);
    pill(d > 0 ? `${d.toFixed(2)} m deep · ${show ? `${kPa(d * 1000 * G)} kPa` : '? kPa'}` : 'above the water', T.left - 14 - 70, y, '#1e3a5f', 12);
  });
  if (!sp.tapped) pill('Tap a spout to open or close it', 470, 50);
}
function spoutHit(p) {
  for (let i = 0; i < 3; i++) if (Math.abs(p.y - holeY(HOLES[i])) < 20 && p.x > T.right - 20 && p.x < T.right + 50) return { what: 'spout', i };
  return null;
}
function spoutStatus() {
  if (sp.level < 0.01) return 'The tank is empty. Press <b>Fill the tank</b>.';
  if (!sp.open.some(Boolean)) return 'All three spouts are closed. Tap one to open it.';
  return $('full').checked ? 'The bottom spout has the most water above it, so its jet goes furthest.' : 'As the tank empties, the water above each spout gets shallower, so the pressure drops and the jets get weaker.';
}
function spoutWork() {
  const rows = HOLES.map((h, i) => {
    const d = Math.max(0, sp.level - h);
    return `<tr><td>${['Top', 'Middle', 'Bottom'][i]}</td><td>${d.toFixed(2)}</td><td>${PK.ans(kPa(d * 1000 * G))}</td></tr>`;
  }).join('');
  return `<table class="results"><thead><tr><th>Spout</th><th>Depth (m)</th><th>Pressure (kPa)</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="note" style="margin:8px 0 0">p = h ρ g, with h the depth of water above the spout and ρ = 1000 kg/m³.</p>`;
}
const SPOUT_WHY = `<p><b>Why does the bottom jet go furthest?</b> The bottom spout has the deepest water above it, so the pressure there is the greatest. That pushes the water out fastest, so it travels furthest.</p>
  <p>The top spout has the least water above it, so the pressure there is lowest and its jet is weakest. As the tank empties, every jet gets weaker, because the water above each spout gets shallower.</p>`;

// ---------- Floating and sinking ----------

const F = { left: 330, right: 770, surface: 170, bottom: 420, px: 6 };   // 6 px for each centimetre
const FLIQ = { water: { name: 'water', rho: 1000, col: 'rgba(52, 140, 220, .55)' }, salty: { name: 'very salty water', rho: 1200, col: 'rgba(80, 160, 190, .6)' }, alcohol: { name: 'alcohol', rho: 790, col: 'rgba(160, 200, 235, .55)' } };
const fliquid = () => FLIQ[$('fliquid').value] || FLIQ.water;
const THINGS = [
  { name: 'cork', rho: 240, w: 54, h: 54, col: '#c8a165', home: 16 },
  { name: 'pine wood', rho: 510, w: 54, h: 54, col: '#e7c793', home: 76 },
  { name: 'ice', rho: 920, w: 54, h: 54, col: '#e6f4ff', home: 136 },
  { name: 'egg', rho: 1030, w: 30, h: 40, col: '#f3e3c6', home: 198, egg: true },
  { name: 'steel', rho: 7800, w: 54, h: 54, col: '#8a939e', home: 238 },
].map((t) => ({ ...t, x: t.home, y: 0, vy: 0, where: 'shelf' }));
const SHELF = 330;
THINGS.forEach((t) => { t.y = SHELF - t.h; });
const fl = { sel: null, moved: false };
const cm = (pxs) => pxs / F.px;
function volume(t) {   // m³
  const a = cm(t.w) / 100, b = cm(t.h) / 100;
  return t.egg ? (Math.PI / 6) * a * a * b : a * a * b;
}
const under = (t) => clamp(t.y + t.h - F.surface, 0, t.h) / t.h;   // the fraction of it below the surface
const weightOf = (t) => t.rho * volume(t) * G;
const upthrustOf = (t) => fliquid().rho * volume(t) * under(t) * G;
// The forces as they're shown, to 2 decimal places, so the sums of the shown numbers always work.
// On the bottom of the tank, the bottom pushes up with whatever the upthrust doesn't hold up.
const r2 = (f) => Math.round(f * 100) / 100;
function forces(t) {
  const W = r2(weightOf(t)), bottom = t.y + t.h >= F.bottom - 0.5;
  let U = r2(upthrustOf(t));
  // Something that floats and has settled: the forces are equal, whatever the rounding says
  if (!bottom && t.rho < fliquid().rho && under(t) < 0.999 && Math.abs(t.vy) < 2 && Math.abs(W - U) <= 0.015) U = W;
  const R = bottom ? Math.max(0, r2(W - U)) : 0;
  return { W, U, R, res: r2(W - U - R), bottom };
}
const newtons = (f) => `${f.toFixed(2)} N`;
function stepFloat(dt) {
  const s = dt * 0.55, rho = fliquid().rho;
  for (const t of THINGS) {
    if (t.where !== 'tank') continue;
    // Strong damping near the surface stops it bobbing for ever; less once it's right under
    const f = under(t), drag = f >= 0.999 ? 3 : f > 0 ? 9 : 0, a = G * (1 - (rho / t.rho) * f) * 100 * F.px - drag * t.vy;
    t.vy += a * s; t.y += t.vy * s;
    if (t.y + t.h >= F.bottom) { t.y = F.bottom - t.h; t.vy = 0; }
  }
}
function drawThing(t) {
  c.fillStyle = t.col; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5;
  if (t.egg) { c.beginPath(); c.ellipse(t.x + t.w / 2, t.y + t.h / 2, t.w / 2, t.h / 2, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
  else { c.beginPath(); c.roundRect(t.x, t.y, t.w, t.h, 4); c.fill(); c.stroke(); }
  if (t.name === 'pine wood') { c.strokeStyle = 'rgba(140,90,40,.35)'; for (let k = 10; k < t.h; k += 11) { c.beginPath(); c.moveTo(t.x + 4, t.y + k); c.lineTo(t.x + t.w - 4, t.y + k + 2); c.stroke(); } }
  if (t.egg) text(t.name, t.x + t.w / 2, t.y + t.h / 2, { s: 11, w: 800 });
  else text(t.name === 'pine wood' ? 'pine' : t.name, t.x + t.w / 2, t.y + t.h / 2, { s: 12, w: 800, col: t.name === 'steel' ? '#fff' : INK });
}
function drawFloat() {
  c.fillStyle = PK.cssVar('--surface'); c.fillRect(0, 0, W, H);
  c.fillStyle = '#b48a5a'; c.fillRect(0, SHELF, 312, 12); c.fillRect(0, F.bottom + 6, W, H - F.bottom - 6);
  const L = fliquid();
  c.fillStyle = L.col; c.fillRect(F.left, F.surface, F.right - F.left, F.bottom - F.surface);
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(F.left, F.surface); c.lineTo(F.right, F.surface); c.stroke();
  for (const t of THINGS) if (t !== fl.sel) drawThing(t);
  if (fl.sel) drawThing(fl.sel);
  c.strokeStyle = '#5b6470'; c.lineWidth = 4; c.beginPath(); c.moveTo(F.left, 90); c.lineTo(F.left, F.bottom); c.lineTo(F.right, F.bottom); c.lineTo(F.right, 90); c.stroke();
  text(`tank of ${L.name}`, (F.left + F.right) / 2, 76, { s: 14, w: 800, col: PK.cssVar('--muted') });

  // Forces on the object that was moved last
  const t = fl.sel;
  if (t && t.where === 'tank') {
    const Wt = weightOf(t), U = upthrustOf(t), full = fliquid().rho * volume(t) * G, k = 70 / Math.max(Wt, full), cx = t.x + t.w / 2, cy = t.y + t.h / 2;
    if ($('faces').checked && under(t) > 0) {
      const pTop = Math.max(0, cm(t.y - F.surface) / 100) * fliquid().rho * G, pBot = cm(t.y + t.h - F.surface) / 100 * fliquid().rho * G;
      const len = (p) => 6 + (p / 1000) * 12;
      for (const f of [0.25, 0.5, 0.75]) {
        const x = t.x + t.w * f;
        if (pTop > 0) arrow(x, t.y - len(pTop) - 2, x, t.y - 2, PUSH, 2.5, 8);
        arrow(x, t.y + t.h + len(pBot) + 2, x, t.y + t.h + 2, PUSH, 2.5, 8);
      }
      const mid = Math.max(0, cm(cy - F.surface) / 100) * fliquid().rho * G;
      if (mid > 0) { arrow(t.x - len(mid) - 2, cy, t.x - 2, cy, PUSH, 2.5, 8); arrow(t.x + t.w + len(mid) + 2, cy, t.x + t.w + 2, cy, PUSH, 2.5, 8); }
    } else {
      const f = forces(t);
      arrow(cx, cy, cx, cy + 10 + Wt * k, '#c62828', 4, 11);
      if (U > 0.001) arrow(cx, cy, cx, cy - 10 - U * k, '#1565c0', 4, 11);
      if (f.R > 0) arrow(cx + 16, t.y + t.h, cx + 16, t.y + t.h - 10 - f.R * k, '#2e7d32', 4, 11);   // the bottom of the tank pushing up
      // Labels on whichever side has more room
      const lx = t.x + t.w / 2 > (F.left + F.right) / 2 ? t.x - 82 : t.x + t.w + 82;
      pill(`upthrust ${newtons(f.U)}`, lx, cy - 36, '#1565c0', 12);
      pill(`weight ${newtons(f.W)}`, lx, cy - 12, '#c62828', 12);
      if (f.R > 0) pill(`push from the bottom ${newtons(f.R)}`, lx, cy + 12, '#2e7d32', 12);
      pill(f.res === 0 ? 'forces balanced' : `resultant ${newtons(Math.abs(f.res))} ${f.res > 0 ? 'down' : 'up'}`, lx, cy + (f.R > 0 ? 36 : 12), f.res === 0 ? '#2e7d32' : INK, 12);
    }
  }
  if (!fl.moved) pill('Drag something into the tank', 170, 230);
}
function floatHit(p) {
  for (let i = THINGS.length - 1; i >= 0; i--) {
    const t = THINGS[i];
    if (p.x > t.x - 8 && p.x < t.x + t.w + 8 && p.y > t.y - 8 && p.y < t.y + t.h + 8) return { what: 'thing', t, dx: t.x - p.x, dy: t.y - p.y };
  }
  return null;
}
function floatMove(d, p) {
  const t = d.t;
  t.where = 'held'; t.vy = 0; fl.sel = t; fl.moved = true;
  t.x = clamp(p.x + d.dx, 0, W - t.w); t.y = clamp(p.y + d.dy, 0, F.bottom - t.h);
}
function floatEnd(d) {
  const t = d.t;
  if (t.x + t.w / 2 > F.left && t.x + t.w / 2 < F.right) { t.where = 'tank'; t.x = clamp(t.x, F.left + 4, F.right - t.w - 4); }
  else { t.where = 'shelf'; t.x = t.home; t.y = SHELF - t.h; }
}
function floatStatus() {
  const t = fl.sel;
  if (!t || t.where !== 'tank') return 'Drag an object into the tank and let go.';
  const L = fliquid();
  return t.rho < L.rho
    ? `The ${t.name} floats: it sinks in until the upthrust equals its weight.`
    : `The ${t.name} sinks: even right under the surface, the upthrust is less than its weight.`;
}
function forceLines(t) {
  const f = forces(t);
  let html = `<p>Weight = ${newtons(f.W)}<br>Upthrust now = ${newtons(f.U)}`;
  if (f.R > 0) html += `<br>Push from the bottom of the tank = ${newtons(f.R)}`;
  html += '</p>';
  if (f.res === 0) html += f.R > 0
    ? '<p>The upthrust is less than the weight, so it sinks. On the bottom, the tank pushes up with the difference, so the forces are balanced and it stays still.</p>'
    : '<p>The upthrust equals the weight, so the forces are balanced and it stays still.</p>';
  else html += `<p>Resultant force = ${newtons(Math.abs(f.res))} ${f.res > 0 ? 'downwards, so it moves down' : 'upwards, so it moves up'}.</p>`;
  return html;
}
function floatWork() {
  const t = fl.sel, L = fliquid();
  if (!t || t.where !== 'tank') return '<p class="note" style="margin:0">Drag an object into the tank to see the forces on it.</p>';
  const floats = t.rho < L.rho;
  return `<p>Density of the ${t.name}: <b>${t.rho} kg/m³</b><br>Density of the ${L.name}: <b>${L.rho} kg/m³</b></p>
    <p>${PK.ans(floats
      ? `The ${t.name} is less dense than the ${L.name}, so it <b>floats</b>, with about ${Math.round((100 * t.rho) / L.rho)}% of it under the surface.`
      : `The ${t.name} is denser than the ${L.name}, so it <b>sinks</b>.`)}</p>
    ${forceLines(t)}`;
}
const FLOAT_WHY = `<p><b>Where does upthrust come from?</b> The bottom of an object in a liquid is deeper than its top, so the pressure on the bottom is greater. That gives a resultant force upwards: the upthrust. Tick <b>Show the pressure on each face</b> to see it.</p>
  <p><b>Float or sink?</b> An object less dense than the liquid floats: it sinks in only until the upthrust equals its weight. An object denser than the liquid sinks, because even when it’s right under the surface the upthrust is less than its weight.</p>
  <p>Try the egg in water and then in very salty water, or the ice in water and then in alcohol.</p>`;

// ---------- Tabs, dragging and start ----------

const SCENES = {
  dam: { draw: drawDam, hit: damHit, move: damMove, status: damStatus, work: damWork, why: DAM_WHY, title: 'Pressure at the sensors', exp: 'The dam' },
  spouts: { draw: drawSpouts, hit: spoutHit, status: spoutStatus, work: spoutWork, why: SPOUT_WHY, title: 'Pressure at each spout', exp: 'The three spouts' },
  float: { draw: drawFloat, hit: floatHit, move: floatMove, end: floatEnd, status: floatStatus, work: floatWork, why: FLOAT_WHY, title: 'Float or sink?', exp: 'Upthrust' },
};
PK.dragOn(cv, W, H, {
  hit: (p) => SCENES[tab].hit(p),
  move: (d, p) => { if (SCENES[tab].move) SCENES[tab].move(d, p); },
  end: (d) => { if (SCENES[tab].end) SCENES[tab].end(d); },
  tap: (d) => {
    if (d.what === 'spout') { sp.open[d.i] = !sp.open[d.i]; sp.tapped = true; }
    if (d.what === 'thing') { fl.sel = d.t; }
  },
});
$('refill').addEventListener('click', () => { sp.level = FULL; });
$('tidy').addEventListener('click', () => { THINGS.forEach((t) => Object.assign(t, { x: t.home, y: SHELF - t.h, vy: 0, where: 'shelf' })); fl.sel = null; });
$('depth').addEventListener('input', () => { dam.movedLevel = true; });

function sizeAll() { const dpr = window.devicePixelRatio || 1; if (!cv.clientWidth) return; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }
function showTab(t) {
  tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('explain').innerHTML = SCENES[t].why;
  $('exp-title').textContent = SCENES[t].exp;
  $('work-title').textContent = SCENES[t].title;
  last = {};
  sizeAll();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
let last = {}, lastFrame = null;
function setHTML(id, html) { if (last[id] !== html) { last[id] = html; $(id).innerHTML = html; } }
function frame(now) {
  const dt = lastFrame === null ? 0 : Math.min(0.05, Math.max(0, now - lastFrame) / 1000); lastFrame = now;
  stepSpouts(dt); stepFloat(dt);
  c.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
  const s = SCENES[tab];
  s.draw();
  setHTML('status', s.status());
  setHTML('work', s.work());
  requestAnimationFrame(frame);
}
window.addEventListener('resize', sizeAll);
window.addEventListener('pk-answers', () => { last = {}; });
showTab('dam');
requestAnimationFrame(frame);

// Share: where the sensors and objects are, and which spouts are open (the tab, number box,
// selects and tick boxes are shared anyway)
PK.shareState = {
  get: () => ({
    s: sensors.map((s) => [Math.round(s.x), Math.round(s.y)]),
    o: sp.open.map(Number).join(''), l: Number(sp.level.toFixed(3)),
    t: THINGS.map((t) => [t.where === 'tank' ? 1 : 0, Math.round(t.x), Math.round(t.y)]),
    k: fl.sel ? THINGS.indexOf(fl.sel) : -1,
  }),
  set: (o) => {
    if (Array.isArray(o.s)) o.s.slice(0, 2).forEach(([x, y], i) => { sensors[i].x = Number(x) || sensors[i].x; sensors[i].y = Number(y) || sensors[i].y; });
    if (typeof o.o === 'string') sp.open = [0, 1, 2].map((i) => o.o[i] !== '0');
    if (Number.isFinite(Number(o.l))) sp.level = clamp(Number(o.l), 0, FULL);
    if (Array.isArray(o.t)) o.t.forEach(([inTank, x, y], i) => {
      const t = THINGS[i]; if (!t) return;
      if (Number(inTank)) Object.assign(t, { where: 'tank', x: clamp(Number(x), F.left + 4, F.right - t.w - 4), y: clamp(Number(y), 0, F.bottom - t.h), vy: 0 });
    });
    fl.sel = THINGS[Number(o.k)] || null;
    dam.movedLevel = dam.movedSensor = true; sp.tapped = true; fl.moved = true;
  },
};
