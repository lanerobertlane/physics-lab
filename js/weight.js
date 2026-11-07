// Weight on other planets: hang slotted masses on a newtonmeter on different worlds.
// W = m g; the gradient of a weight–mass graph is the gravitational field strength.

PK.header({
  title: 'Weight on other planets',
  answers: true,
  spec: [
    { code: '4.5.1.3', text: 'Weight is the force acting on an object due to gravity: W = m g' },
    { code: '4.5.1.3', text: 'The weight of an object depends on the gravitational field strength at the point where the object is' },
    { code: '4.5.1.3', text: 'Weight and mass are directly proportional; weight is measured using a calibrated spring-balance (a newtonmeter)' },
    { code: 'KS3', text: 'Forces: weight = mass × gravitational field strength (g); on Earth g is about 10 N/kg, and it is different on other planets and stars' },
    { code: 'KS3', text: 'Space physics: gravity force and weight on other planets' },
  ],
});

const $ = (id) => document.getElementById(id);
// g in N/kg (NASA planetary fact sheet), with sky and ground colours for the scene
const WORLDS = {
  mercury: { name: 'Mercury', g: 3.7, colour: '#9e958a', sky: '#07080f', ground: '#8c8378', stars: true },
  venus: { name: 'Venus', g: 8.9, colour: '#d9a441', sky: '#e8c47a', ground: '#b8863d' },
  earth: { name: 'Earth', g: 9.8, colour: '#2e7dd7', sky: '#a8d4ff', ground: '#6aa84f' },
  moon: { name: 'The Moon', g: 1.6, colour: '#7d8a99', sky: '#07080f', ground: '#a3a3a3', stars: true },
  mars: { name: 'Mars', g: 3.7, colour: '#d0603a', sky: '#e7bb96', ground: '#b8552f' },
  jupiter: { name: 'Jupiter', g: 23.1, colour: '#c98a50', sky: '#e2c3a0', ground: '#c47f4a', gas: true },
  saturn: { name: 'Saturn', g: 9.0, colour: '#c8ad5e', sky: '#efe2b8', ground: '#cdb36d', gas: true },
  uranus: { name: 'Uranus', g: 8.7, colour: '#4fb3c2', sky: '#c4eef2', ground: '#7cc6cf', gas: true },
  neptune: { name: 'Neptune', g: 11.0, colour: '#3f5fd1', sky: '#6f8fe6', ground: '#3450a8', gas: true },
  pluto: { name: 'Pluto', g: 0.7, colour: '#a8876b', sky: '#07080f', ground: '#c9b49f', stars: true },
  mystery: { name: 'Mystery planet', g: 6.4, colour: '#8e44ad', sky: '#2a1840', ground: '#6b4f8a', stars: true },
};
const ORDER = ['mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'mystery'];
const MAX_G = 1000;   // grams of slotted masses
const state = { world: 'earth', grams: 0, meter: 10, show: true, rows: [], y: 0, vy: 0 };
const world = () => WORLDS[state.world];
const weight = () => (state.grams / 1000) * world().g;
const fmt = (x, dp = 2) => x.toFixed(dp);

function newMystery() {
  let g;
  do g = Math.round((2 + Math.random() * 16) * 10) / 10; while (ORDER.some((k) => k !== 'mystery' && Math.abs(WORLDS[k].g - g) < 0.3));
  WORLDS.mystery.g = g;
}
newMystery();

// ---------- Drawing ----------

const rig = $('rig'), ctx = rig.getContext('2d');
const W = 520, H = 620;
const X = 250, HOOK_Y = 62, ZERO_Y = 104, SCALE = 170, BODY_BOTTOM = ZERO_Y + SCALE + 22, GROUND = 600;

function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  rig.width = Math.round(rig.clientWidth * dpr); rig.height = Math.round(rig.clientWidth * (H / W) * dpr);
  const g = $('wm'); g.width = Math.round(g.clientWidth * dpr); g.height = Math.round(g.clientWidth * (220 / 270) * dpr);
}

// Stars stay put between frames
const STARS = Array.from({ length: 60 }, (_, i) => [(i * 137.5) % W, (i * 89.3) % (GROUND - 40), (i % 3) * 0.5 + 0.6]);

function draw(dt) {
  const frac = Math.min(1, weight() / state.meter);
  const target = frac * SCALE;
  state.vy += ((target - state.y) * 70 - state.vy * 10) * dt;
  state.y += state.vy * dt;
  const d = state.y;

  const k = rig.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const w = world();
  const font = PK.cssVar('--font-body') || 'sans-serif';
  // Sky, stars and ground
  ctx.fillStyle = w.sky; ctx.fillRect(0, 0, W, H);
  if (w.stars) { ctx.fillStyle = '#fff'; for (const [sx, sy, r] of STARS) { ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill(); } }
  ctx.fillStyle = w.ground; ctx.fillRect(0, GROUND, W, H - GROUND);
  if (w.gas) {
    ctx.fillStyle = 'rgba(255, 255, 255, .18)';
    for (let i = 0; i < 4; i++) ctx.fillRect(0, GROUND + 4 + i * 7, W, 3);
  }
  // Name of the world
  ctx.font = `800 17px ${font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const label = state.world === 'mystery' ? 'Mystery planet · g = ?' : `${w.name} · g = ${w.g} N/kg`;
  const lw = ctx.measureText(label).width + 20;
  ctx.fillStyle = 'rgba(255, 255, 255, .88)'; roundRect(12, 12, lw, 30, 8); ctx.fill();
  ctx.fillStyle = '#1b1f27'; ctx.fillText(label, 22, 27);

  // Clamp stand
  ctx.fillStyle = '#5d6470'; ctx.fillRect(400, 40, 12, GROUND - 52); ctx.fillRect(340, GROUND - 14, 140, 14);
  ctx.fillRect(X - 10, 40, 412 - (X - 10), 10);
  ctx.fillStyle = '#3a3f48'; ctx.fillRect(390, 34, 32, 22);
  // Hook from the arm
  ctx.strokeStyle = '#3a3f48'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(X, 50); ctx.lineTo(X, HOOK_Y - 6); ctx.stroke();
  ctx.beginPath(); ctx.arc(X, HOOK_Y, 6, 0, 7); ctx.stroke();

  drawMeter(d, font);
  // Magnifier: shows the scale around the pointer, so it can be read on a small screen
  const LX = 112, LY = ZERO_Y + SCALE / 2, LR = 78, Z = 2.4, py = ZERO_Y + d;
  ctx.strokeStyle = 'rgba(0, 0, 0, .35)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(LX + LR, LY); ctx.lineTo(X - 30, py); ctx.stroke(); ctx.setLineDash([]);
  ctx.save();
  ctx.beginPath(); ctx.arc(LX, LY, LR, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = w.sky; ctx.fillRect(LX - LR, LY - LR, LR * 2, LR * 2);
  ctx.translate(LX, LY); ctx.scale(Z, Z); ctx.translate(-X + 8, -py);
  drawMeter(d, font);
  ctx.restore();
  ctx.strokeStyle = '#3a3f48'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(LX, LY, LR, 0, Math.PI * 2); ctx.stroke();
  ctx.font = `700 12px ${font}`; ctx.textAlign = 'center';
  const mt = 'magnified', mw = ctx.measureText(mt).width + 12;
  ctx.fillStyle = 'rgba(255, 255, 255, .88)'; roundRect(LX - mw / 2, LY + LR + 6, mw, 18, 5); ctx.fill();
  ctx.fillStyle = '#1b1f27'; ctx.fillText(mt, LX, LY + LR + 15);
  // Pull rod and hook out of the bottom
  const rodEnd = BODY_BOTTOM + 10 + d;
  ctx.fillStyle = '#9aa1ab'; ctx.fillRect(X - 3, BODY_BOTTOM - 4, 6, rodEnd - BODY_BOTTOM + 4);
  ctx.strokeStyle = '#3a3f48'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(X, rodEnd + 6, 6, -Math.PI / 2, Math.PI * 0.9); ctx.stroke();

  // Hanger and 100 g slotted masses
  const hy = rodEnd + 12, n = state.grams / 100;
  if (n) {
    ctx.fillStyle = '#4b525d'; ctx.fillRect(X - 2, hy, 4, 12);
    for (let i = 0; i < n; i++) {
      const my = hy + 12 + i * 7;
      ctx.fillStyle = i % 2 ? '#b08d57' : '#c9a66b'; ctx.fillRect(X - 28, my, 56, 6);
      ctx.strokeStyle = '#6b5532'; ctx.lineWidth = 1; ctx.strokeRect(X - 28, my, 56, 6);
    }
    ctx.font = `700 13px ${font}`; ctx.textAlign = 'right';
    const ty = hy + 12 + n * 3.5;
    const t = `${state.grams} g`, tw = ctx.measureText(t).width;
    ctx.fillStyle = 'rgba(255, 255, 255, .85)'; roundRect(X - 40 - tw - 6, ty - 10, tw + 12, 20, 5); ctx.fill();
    ctx.fillStyle = '#1b1f27'; ctx.fillText(t, X - 40, ty);
  }
  // Weight arrow
  if (state.grams) {
    const ay = hy + 12 + n * 7 + 4, len = 14 + Math.min(1, weight() / 25) * 36;
    ctx.strokeStyle = ctx.fillStyle = '#e53935'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X, ay); ctx.lineTo(X, ay + len); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X - 7, ay + len - 8); ctx.lineTo(X, ay + len + 2); ctx.lineTo(X + 7, ay + len - 8); ctx.fill();
    ctx.font = `800 13px ${font}`; ctx.textAlign = 'left';
    const t = 'weight', tw = ctx.measureText(t).width;
    ctx.fillStyle = 'rgba(255, 255, 255, .85)'; roundRect(X + 10, ay + len / 2 - 10, tw + 12, 20, 5); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.fillText(t, X + 16, ay + len / 2);
  }
}

// The newtonmeter's body, spring, scale and pointer (also drawn again, larger, in the magnifier)
function drawMeter(d, font) {
  const bx = X - 30, bw = 60, top = HOOK_Y + 6, py = ZERO_Y + d;
  ctx.fillStyle = '#eef1f5'; ctx.strokeStyle = '#4b525d'; ctx.lineWidth = 2;
  roundRect(bx, top, bw, BODY_BOTTOM - top, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d33'; ctx.font = `800 12px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', X, top + 18);
  // Slot with the spring
  ctx.fillStyle = '#c9ced6'; ctx.fillRect(X + 2, ZERO_Y - 8, 12, SCALE + 16);
  const coils = 14;
  ctx.strokeStyle = '#7a828e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X + 8, ZERO_Y - 8);
  for (let i = 0; i <= coils * 2; i++) ctx.lineTo(X + 8 + (i % 2 ? 4 : -4), ZERO_Y - 8 + ((py - ZERO_Y + 8) * i) / (coils * 2));
  ctx.stroke();
  // Scale: small, middle and numbered marks
  const minor = state.meter === 10 ? 0.1 : 1, midEvery = state.meter === 10 ? 0.5 : 5, labelEvery = state.meter === 10 ? 1 : 10;
  const on = (n, step) => Math.abs(n / step - Math.round(n / step)) < 1e-6;
  ctx.strokeStyle = '#1b1f27'; ctx.fillStyle = '#1b1f27'; ctx.font = `700 11px ${font}`; ctx.textAlign = 'right';
  for (let i = 0; i <= Math.round(state.meter / minor); i++) {
    const n = i * minor, y = ZERO_Y + (n / state.meter) * SCALE;
    const big = on(n, labelEvery), mid = !big && on(n, midEvery);
    ctx.lineWidth = big ? 1.2 : mid ? 0.9 : 0.5;
    const len = big ? 12 : mid ? 8 : 4;
    ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X - len, y); ctx.stroke();
    if (big) ctx.fillText(Math.round(n), X - 14, y);
  }
  // Pointer
  ctx.fillStyle = '#e53935'; ctx.fillRect(X - 14, py - 1, 30, 2);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- Readout, table and graph ----------

function render() {
  const w = world(), F = weight(), over = F > state.meter + 1e-9;
  const mystery = state.world === 'mystery';
  $('readout').innerHTML = `
    <dt>Mass</dt><dd>${state.grams} g = ${fmt(state.grams / 1000, 1)} kg</dd>
    <dt>Gravitational field strength</dt><dd>${mystery ? PK.ans(`${w.g} N/kg`) : `${w.g} N/kg`}</dd>
    <dt>Newtonmeter reading</dt><dd>${over ? 'off the scale' : state.show ? `${fmt(F)} N` : 'read the newtonmeter'}</dd>`;
  const working = state.show && !over && F > 0
    ? `W = m g = ${fmt(state.grams / 1000, 1)} kg × ${mystery ? '?' : `${w.g} N/kg`} = ${PK.ans(`${fmt(F)} N`)}` : '';
  $('warn').innerHTML = over
    ? `<b>Off the scale:</b> the weight is more than ${state.meter} N. Use the 0–50 N newtonmeter, or take some masses off.`
    : [working, state.meter === 50 && F > 0 && F < 10 ? 'For small weights the 0–10 N newtonmeter has finer divisions, so it gives a more precise reading.' : ''].filter(Boolean).join('<br>');
  $('world-note').textContent = mystery
    ? 'Record weights for several masses, then use the gradient of your graph to find g on the mystery planet.'
    : w.gas ? `${w.name} has no solid surface, so imagine standing on a platform at the top of its clouds.`
      : state.world === 'earth' ? 'On Earth g is 9.8 N/kg. In KS3 we often round it to 10 N/kg.' : '';
  $('new-mystery').hidden = !mystery;
  $('add').disabled = state.grams >= MAX_G; $('remove').disabled = state.grams <= 0;
  renderTable();
}

function renderTable() {
  const rows = state.rows;
  $('table').innerHTML = rows.length ? `<table class="results"><thead><tr><th>World</th><th>Mass (kg)</th><th>Weight (N)</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td><span class="swatch" style="background:${WORLDS[r.w].colour}"></span>${WORLDS[r.w].name}</td><td>${fmt(r.kg, 1)}</td><td class="n">${state.show ? fmt(r.F) : PK.ans(fmt(r.F))}</td></tr>`).join('')}</tbody></table>` : '<p class="note">No readings yet. Add some masses and press Record reading.</p>';
  drawGraph();
  // Gradient of each world's line (best fit through the origin)
  const items = ORDER.map((k) => {
    const pts = rows.filter((r) => r.w === k && r.kg > 0);
    if (pts.length < 2) return pts.length ? `<li><span class="swatch" style="background:${WORLDS[k].colour}"></span>${WORLDS[k].name}: record one more reading to draw the line.</li>` : '';
    const g = pts.reduce((a, r) => a + r.kg * r.F, 0) / pts.reduce((a, r) => a + r.kg * r.kg, 0);
    return `<li><span class="swatch" style="background:${WORLDS[k].colour}"></span>${WORLDS[k].name}: gradient = g ≈ <b>${PK.ans(`${g.toFixed(1)} N/kg`)}</b></li>`;
  }).join('');
  $('legend').innerHTML = items || '<li class="note">Record two or more readings on a world to find g from the gradient.</li>';
}

function graphColours() {
  return { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), font: PK.cssVar('--font-body') || 'sans-serif' };
}

function drawGraph() {
  const cv = $('wm'), g = cv.getContext('2d'), GW = 270, GH = 220, k = cv.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const c = graphColours();
  g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
  const L = 40, R = 10, T = 10, B = 34, pw = GW - L - R, ph = GH - T - B;
  const fTop = Math.max(...state.rows.map((r) => r.F), 0);
  const fMax = fTop <= 10 ? 10 : Math.ceil(fTop / 5) * 5, fStep = fMax <= 10 ? 2 : fMax <= 30 ? 5 : 10, mMax = 1;
  const Xp = (m) => L + (m / mMax) * pw, Yp = (f) => T + ph - (f / fMax) * ph;
  g.strokeStyle = c.grid; g.fillStyle = c.muted; g.font = `600 10px ${c.font}`; g.lineWidth = 1;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let f = 0; f <= fMax; f += fStep) { g.beginPath(); g.moveTo(L, Yp(f)); g.lineTo(L + pw, Yp(f)); g.stroke(); g.fillText(f, L - 4, Yp(f)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let m = 0; m <= 10; m += 2) { const x = Xp(m / 10); g.beginPath(); g.moveTo(x, T); g.lineTo(x, T + ph); g.stroke(); g.fillText((m / 10).toFixed(1), x, T + ph + 3); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 11px ${c.font}`; g.fillText('mass / kg', L + pw / 2, GH - 15);
  g.save(); g.translate(10, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('weight / N', 0, 0); g.restore();
  g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
  for (const key of ORDER) {
    const pts = state.rows.filter((r) => r.w === key);
    if (!pts.length) continue;
    const col = WORLDS[key].colour;
    const good = pts.filter((r) => r.kg > 0);
    if (good.length >= 2) {
      const grad = good.reduce((a, r) => a + r.kg * r.F, 0) / good.reduce((a, r) => a + r.kg * r.kg, 0);
      g.strokeStyle = col; g.lineWidth = 1.5; g.globalAlpha = 0.7;
      g.beginPath(); g.moveTo(Xp(0), Yp(0)); g.lineTo(Xp(mMax), Yp(grad * mMax)); g.stroke(); g.globalAlpha = 1;
    }
    g.strokeStyle = col; g.lineWidth = 2;
    for (const r of pts) { const x = Xp(r.kg), y = Yp(r.F); g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x - 4, y + 4); g.lineTo(x + 4, y - 4); g.stroke(); }
  }
  g.restore();
}

// "What would you weigh?" on every world
function renderBars() {
  const m = Number($('you').value);
  $('you-val').textContent = `${m} kg`;
  const top = Math.max(...ORDER.filter((k) => k !== 'mystery').map((k) => WORLDS[k].g));
  $('bars').innerHTML = ORDER.filter((k) => k !== 'mystery').map((k) => {
    const w = WORLDS[k], F = m * w.g;
    return `<div class="bar"><span>${w.name}</span><span class="track"><span class="fill" style="width:${(w.g / top) * 100}%;background:${w.colour}"></span></span><span class="val">${PK.ans(`${Math.round(F)} N`)}</span></div>`;
  }).join('');
}

// ---------- Controls ----------

function load(dg) { state.grams = Math.max(0, Math.min(MAX_G, state.grams + dg)); render(); }
$('add').addEventListener('click', () => load(100));
$('remove').addEventListener('click', () => load(-100));
$('world').addEventListener('change', (e) => { state.world = e.target.value; render(); });
$('meter').addEventListener('change', (e) => { state.meter = Number(e.target.value); state.y = Math.min(1, weight() / state.meter) * SCALE; render(); });
$('new-mystery').addEventListener('click', () => {
  newMystery();
  const before = state.rows.length;
  state.rows = state.rows.filter((r) => r.w !== 'mystery');
  if (state.rows.length < before) PK.toast('Mystery planet readings cleared');
  render();
});
$('record').addEventListener('click', () => {
  const F = weight();
  if (F > state.meter + 1e-9) { PK.toast('The reading is off the scale'); return; }
  if (state.rows.some((r) => r.w === state.world && r.kg === state.grams / 1000)) { PK.toast('You already have that reading'); return; }
  state.rows.push({ w: state.world, kg: state.grams / 1000, F });
  state.rows.sort((a, b) => ORDER.indexOf(a.w) - ORDER.indexOf(b.w) || a.kg - b.kg);
  renderTable();
});
$('clear').addEventListener('click', () => { state.rows = []; renderTable(); });
$('show-reading').addEventListener('change', (e) => { state.show = e.target.checked; render(); });
$('you').addEventListener('input', renderBars);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.03, (now - last) / 1000);
  last = now;
  draw(dt);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { sizeAll(); drawGraph(); });
window.addEventListener('pk-theme', drawGraph);
sizeAll();
render();
renderBars();
requestAnimationFrame(frame);

// Share: the masses, the readings and the mystery planet's g (the selects, slider and tick box are shared anyway)
PK.shareState = {
  get: () => ({ g: state.grams, mg: WORLDS.mystery.g, rows: state.rows }),
  set: (o) => {
    state.grams = Math.max(0, Math.min(MAX_G, Math.round((Number(o.g) || 0) / 100) * 100));
    if (Number(o.mg) > 0) WORLDS.mystery.g = Number(o.mg);
    if (Array.isArray(o.rows)) state.rows = o.rows.filter((r) => WORLDS[r.w]);
    state.world = $('world').value; state.meter = Number($('meter').value); state.show = $('show-reading').checked;
    render(); renderBars();
  },
};
