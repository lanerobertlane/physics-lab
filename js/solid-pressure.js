// Pressure on solids: pressure = force ÷ area, shown by walking on snow in different footwear.

PK.header({
  title: 'Pressure on solids',
  answers: true,
  spec: [
    { code: 'KS3', text: 'Pressure measured by the ratio of force over area, acting normal to any surface' },
    { code: 'KS3', text: 'Pressure = force ÷ area, in newtons per square metre (N/m²) or newtons per square centimetre (N/cm²)' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const cv = $('scene'), c = cv.getContext('2d');
const W = 800, H = 420, INK = '#1c2430';

function text(s, x, y, o = {}) {
  c.font = `${o.w || 700} ${o.s || 14}px ${font()}`; c.textAlign = o.a || 'center'; c.textBaseline = o.b || 'middle';
  c.fillStyle = o.col || INK; c.fillText(s, x, y);
}
function pill(s, x, y, col = INK, size = 14) {
  c.font = `800 ${size}px ${font()}`;
  const w = c.measureText(s).width + 16, left = clamp(x - w / 2, 4, W - w - 4);
  c.fillStyle = 'rgba(255,255,255,.94)'; c.beginPath(); c.roundRect(left, y - size / 2 - 5, w, size + 10, 7); c.fill();
  text(s, left + w / 2, y + 1, { s: size, w: 800, col });
}
function arrow(x1, y1, x2, y2, col, w = 4, head = 11) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); c.stroke(); c.lineCap = 'butt';
  c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head); c.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head); c.closePath(); c.fill();
}
const nice = (x) => (x >= 100 ? Math.round(x).toLocaleString('en-GB').replace(/,/g, ' ') : x >= 10 ? Number(x.toFixed(1)) : Number(x.toFixed(2)));

// When you walk, all your weight is on one foot at a time, so each area is for one foot.
// hole: how wide a hole the footwear makes; contact: the part actually touching the snow;
// ankle: how far above the snow the leg meets the footwear (all in px, from the middle of the foot).
const SHOES = [
  { name: 'trainer', area: 250, hole: [-15, 25], contact: [-12, 22], ankle: 10 },
  { name: 'snowshoe', area: 1500, hole: [-45, 53], contact: [-42, 50], ankle: 11 },
  { name: 'ski', area: 1500, hole: [-152, 152], contact: [-150, 150], ankle: 14 },
  { name: 'stiletto heel', area: 1, hole: [-12, 64], contact: [-2.5, 2.5], ankle: 56 },
];
const snow = { shoe: 0 };
const SNOW_TOP = 236, SNOW_BOTTOM = 396, CM = 2.2;   // px for each cm of snow
const snowP = () => PK.num('force') / PK.num('area');   // N/cm²
// Fresh snow holds up a pressure of about 0.3 N/cm² before it starts to give way
const sinkCm = (p) => (p <= 0.3 ? 0 : 70 * (1 - Math.exp(-(p - 0.3) / 2)));

// A high-heeled shoe seen from the side, stepping down on its heel: the thin heel touches the
// snow at (x, y) and the toe is still in the air.
function stiletto(x, y) {
  c.fillStyle = '#222833';
  c.beginPath(); c.moveTo(x - 2.5, y); c.lineTo(x + 2.5, y); c.lineTo(x + 5, y - 36); c.lineTo(x - 5, y - 36); c.closePath(); c.fill();   // the heel
  c.fillStyle = '#b0154a';
  c.beginPath();
  c.moveTo(x - 9, y - 60);                                        // back of the heel cup
  c.quadraticCurveTo(x - 11, y - 40, x - 5, y - 36);              // down the back to the heel
  c.lineTo(x + 6, y - 36);
  c.bezierCurveTo(x + 18, y - 34, x + 34, y - 16, x + 54, y - 13); // the arch, sloping down to the toe
  c.quadraticCurveTo(x + 66, y - 14, x + 61, y - 25);             // round the toe
  c.bezierCurveTo(x + 47, y - 33, x + 31, y - 42, x + 19, y - 52); // the top of the foot
  c.quadraticCurveTo(x + 6, y - 61, x - 9, y - 60);              // the opening, back to the heel cup
  c.closePath(); c.fill();
  c.strokeStyle = '#3b0617'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x + 6, y - 36); c.bezierCurveTo(x + 18, y - 34, x + 34, y - 16, x + 54, y - 13); c.stroke();   // the sole
}
function drawSnow() {
  c.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, SNOW_TOP); g.addColorStop(0, '#8fcdf2'); g.addColorStop(1, '#e8f5fd');
  c.fillStyle = g; c.fillRect(0, 0, W, SNOW_TOP);
  c.fillStyle = '#dfe9f1'; c.beginPath(); c.moveTo(0, 150); c.quadraticCurveTo(180, 90, 340, 160); c.quadraticCurveTo(520, 110, 800, 170); c.lineTo(800, SNOW_TOP); c.lineTo(0, SNOW_TOP); c.closePath(); c.fill();
  c.fillStyle = '#ffffff'; c.fillRect(0, SNOW_TOP, W, SNOW_BOTTOM - SNOW_TOP);   // clears the last frame, inside the hole too
  c.fillStyle = '#7a5a3c'; c.fillRect(0, SNOW_BOTTOM, W, H - SNOW_BOTTOM);
  const shoe = SHOES[snow.shoe], p = snowP(), sink = sinkCm(p) * CM, foot = SNOW_TOP + sink, cx = 400;
  const h1 = cx + shoe.hole[0], h2 = cx + shoe.hole[1];
  c.fillStyle = 'rgba(160,190,215,.35)'; c.fillRect(h1, SNOW_TOP, h2 - h1, sink);   // the hole the foot has made
  // The walker, with all their weight on the front foot
  const ankle = foot - shoe.ankle, hip = ankle - 84, shoulder = hip - 62, head = shoulder - 22;
  c.strokeStyle = '#20262e'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx, hip); c.lineTo(cx, ankle);                                        // the leg taking the weight
  c.moveTo(cx, hip); c.lineTo(cx - 34, hip + 48); c.lineTo(cx - 52, hip + 70);   // the back leg, lifted
  c.moveTo(cx, hip); c.lineTo(cx, shoulder);
  c.moveTo(cx, shoulder + 8); c.lineTo(cx + 26, shoulder + 50); c.moveTo(cx, shoulder + 8); c.lineTo(cx - 26, shoulder + 48);
  c.stroke(); c.lineCap = 'butt';
  c.fillStyle = PK.cssVar('--surface'); c.beginPath(); c.arc(cx, head, 15, 0, Math.PI * 2); c.fill(); c.stroke();
  // What's on the foot
  if (snow.shoe === 0) { c.fillStyle = '#1f5fd1'; c.beginPath(); c.roundRect(cx - 12, foot - 10, 34, 10, 4); c.fill(); }
  else if (snow.shoe === 1) { c.strokeStyle = '#5d4037'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx + 4, foot - 3, 46, 5, 0, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#1f5fd1'; c.beginPath(); c.roundRect(cx - 12, foot - 12, 30, 9, 4); c.fill(); }
  else if (snow.shoe === 2) { c.fillStyle = '#c62828'; c.beginPath(); c.roundRect(cx - 150, foot - 6, 300, 6, 3); c.fill(); c.beginPath(); c.moveTo(cx + 150, foot - 6); c.quadraticCurveTo(cx + 166, foot - 8, cx + 168, foot - 19); c.lineTo(cx + 162, foot - 19); c.quadraticCurveTo(cx + 158, foot - 5, cx + 146, foot); c.fill(); c.fillStyle = '#1f5fd1'; c.beginPath(); c.roundRect(cx - 12, foot - 15, 30, 9, 4); c.fill(); }
  else stiletto(cx, foot);
  // The snow in front, with a hole where the foot has pushed in
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(0, SNOW_TOP); c.lineTo(h1, SNOW_TOP); c.lineTo(h1, foot); c.lineTo(h2, foot); c.lineTo(h2, SNOW_TOP); c.lineTo(W, SNOW_TOP);
  c.lineTo(W, SNOW_BOTTOM); c.lineTo(0, SNOW_BOTTOM); c.closePath(); c.fill();
  c.strokeStyle = '#c5d7e6'; c.lineWidth = 2; c.stroke();
  // The force, and the area it acts on: only the part touching the snow
  arrow(cx + 60, hip - 30, cx + 60, hip + 40, '#c62828');
  pill(`weight ${nice(PK.num('force'))} N`, cx + 60, hip - 46, '#c62828', 13);
  c.fillStyle = '#e65100'; c.fillRect(cx + shoe.contact[0], foot - 1, shoe.contact[1] - shoe.contact[0], 4);
  pill(`area ${nice(PK.num('area'))} cm²`, clamp(h1 - 70, 70, W - 70), Math.min(foot + 16, SNOW_BOTTOM - 14), '#e65100', 13);
  pill(`pressure ${PK.ansText(`${nice(p)} N/cm²`)}`, 140, 40, '#1e3a5f', 16);
  if (sink > 0) text(sink >= 69 * CM ? 'sinks right in!' : `sinks ${Math.round(sinkCm(p))} cm`, h2 + 50, Math.min(foot, SNOW_BOTTOM - 14), { s: 14, w: 800, col: '#3a5a78' });
  else text('stays on top', h2 + 56, SNOW_TOP - 14, { s: 14, w: 800, col: '#2e7d32' });
}
function snowStatus() {
  const s = SHOES[snow.shoe];
  return s.name === 'stiletto heel'
    ? `As you step down on a stiletto heel, all your weight goes through the tip of the heel, an area of about ${nice(PK.num('area'))} cm².`
    : `When you walk, all your weight is on one foot at a time. With a ${s.name}, that weight is spread over ${nice(PK.num('area'))} cm².`;
}
function snowWork() {
  const F = PK.num('force'), A = PK.num('area'), p = F / A, m2 = A / 10000;
  return `<p>Pressure = force ÷ area<br>= ${nice(F)} N ÷ ${nice(A)} cm² = ${PK.ans(`${nice(p)} N/cm²`)}</p>
    <p class="note" style="margin:0">In square metres: ${nice(A)} cm² = ${m2} m², so the pressure is ${nice(F)} ÷ ${m2} = ${PK.ans(`${nice(F / m2)} N/m²`)}, or ${PK.ans(`${nice(F / m2)} Pa`)}.</p>`;
}

// ---------- Controls and start ----------

PK.chips('shoe', (v) => { snow.shoe = v; PK.setNum('area', SHOES[v].area); });
$('explain').innerHTML = `<p><b>Snowshoes and skis</b> spread your weight over a big area, so the pressure on the snow is small and you stay on top.</p>
  <p><b>A stiletto heel</b> puts the same weight on a tiny area, so the pressure is huge and it sinks straight in.</p>
  <p>Try changing only the area, then only the force. A bigger force or a smaller area gives a bigger pressure.</p>`;

function sizeAll() { const dpr = window.devicePixelRatio || 1; if (!cv.clientWidth) return; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }
let last = {};
function setHTML(id, html) { if (last[id] !== html) { last[id] = html; $(id).innerHTML = html; } }
function frame() {
  drawSnow();
  setHTML('status', snowStatus());
  setHTML('work', snowWork());
  requestAnimationFrame(frame);
}
window.addEventListener('resize', sizeAll);
window.addEventListener('pk-answers', () => { last = {}; });
sizeAll();
requestAnimationFrame(frame);
