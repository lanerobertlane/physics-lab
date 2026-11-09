// Echo sounding and ultrasound: a pulse is partly reflected at each boundary it meets, and the
// time for each echo gives the distance to that boundary. distance = speed × time ÷ 2.

PK.header({
  title: 'Echo sounding & ultrasound scans',
  answers: true,
  spec: [
    { code: '4.6.1.3', text: 'Waves can be reflected, absorbed or transmitted at the boundary between two different materials', po: true },
    { code: '4.6.1.5', text: 'Ultrasound waves have a frequency higher than the upper limit of hearing for humans', po: true, ht: true },
    { code: '4.6.1.5', text: 'Ultrasound waves are partially reflected when they meet a boundary between two different media', po: true, ht: true },
    { code: '4.6.1.5', text: 'The time taken for reflections to reach a detector can be used to find how far away a boundary is, for medical and industrial imaging', po: true, ht: true },
    { code: '4.6.1.5', text: 'Echo sounding, using high frequency sound waves, is used to detect objects in deep water and measure water depth', po: true, ht: true },
    { code: 'KS3', text: 'Sound: echoes, and the reflection and absorption of sound' },
    { code: 'KS3', text: 'Ultrasound is a pressure wave that transfers energy' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sig = (x, n = 3) => Number(x.toPrecision(n));
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

const MODES = {
  sea: {
    v: 1500, medium: 'sea water', perSq: 1, tUnit: 's', tFactor: 1, rate: 2, min: 30, max: 770, speed: 170,
    sweep: 'Sail and map', wipe: 'Clear the map', fresh: 'New sea bed', posUnit: 'km', posOf: (x) => sig(x / 40, 3),
    distLabel: 'Depth', hint: 'Drag the ship along, then send a pulse.',
  },
  body: {
    v: 1500, medium: 'soft tissue', perSq: 20, tUnit: 'µs', tFactor: 1e-6, rate: 220e-6 / 1.8, min: 8, max: 384, speed: 80, pxPerM: 2200,
    sweep: 'Scan across', wipe: 'Clear the picture', fresh: null, posUnit: 'cm', posOf: (x) => sig(x / 22, 3),
    distLabel: 'Depth', hint: 'Drag the probe along the skin to build up the picture.',
  },
  metal: {
    v: 6000, medium: 'steel', perSq: 10, tUnit: 'µs', tFactor: 1e-6, rate: 100e-6 / 1.8, min: 8, max: 384, speed: 80, pxPerM: 1320,
    sweep: 'Scan across', wipe: 'Clear the picture', fresh: 'New steel block', posUnit: 'cm', posOf: (x) => sig(x / 13.2, 3),
    distLabel: 'Depth', hint: 'Drag the probe along the steel to look for cracks.',
  },
};
const state = {
  tab: 'sea', pos: { sea: 210, body: 130, metal: 130 }, hide: false, seaSeed: 1, metalSeed: 1,
  ping: null, sounded: null, sweep: false, pick: null, map: [], moved: { sea: false, body: false, metal: false },
  rows: { sea: [], body: [], metal: [] },
};
const mode = () => MODES[state.tab];
const pos = () => state.pos[state.tab];

// A repeatable random sequence, so a shared link opens the same hidden sea bed
function seeded(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- Sea bed ----------

let sea, cracks;
function buildSea() {
  const r = seeded(state.seaSeed);
  sea = {
    base: 2300 + r() * 500,
    bumps: Array.from({ length: 6 }, (_, i) => ({ x: (i + 0.2 + r() * 0.6) * (800 / 6), w: 55 + r() * 80, h: (r() < 0.5 ? -1 : 1) * (500 + r() * 1400) })),
    shoal: { x: 120 + r() * 240, w: 34, d: 650 + r() * 500 },
    wreck: { x: 470 + r() * 260, w: 22 },
  };
}
const seaDepth = (x) => clamp(sea.bumps.reduce((d, b) => d + b.h * Math.exp(-(((x - b.x) / b.w) ** 2)), sea.base), 450, 4700);
function echoesSea(x) {
  const list = [], bed = seaDepth(x);
  if (Math.abs(x - sea.shoal.x) < sea.shoal.w) list.push({ d: sea.shoal.d, a: 0.32, name: 'Shoal of fish' });
  const onWreck = Math.abs(x - sea.wreck.x) < sea.wreck.w;
  if (onWreck) list.push({ d: bed - 120, a: 0.7, name: 'Shipwreck' });
  list.push({ d: bed, a: onWreck ? 0.45 : 0.9, name: 'Sea bed', main: true });
  return list;
}

// ---------- Inside the body (all in cm, across and down from the top of the skin) ----------

const CM = 22;
const fatEnd = (x) => 1.5 + 0.15 * Math.sin(x * 0.7);
const muscleEnd = (x) => 2.9 + 0.2 * Math.sin(x * 0.5 + 1);
const WOMB = { cx: 8.9, cy: 9.2, a: 7.9, b: 5.5 };
const HEAD = { cx: 5.5, cy: 8.6, a: 2.8, b: 2.6 };
const TORSO = { cx: 10.6, cy: 9.9, a: 3.8, b: 2.1 };
const ARM = { cx: 11.2, cy: 7.3, a: 2.0, b: 0.45 };
function crossing(x, e) { const u = (x - e.cx) / e.a; if (Math.abs(u) >= 1) return null; const h = e.b * Math.sqrt(1 - u * u); return [e.cy - h, e.cy + h]; }
function echoesBody(px) {
  const x = px / CM, list = [{ d: fatEnd(x), a: 0.3, name: 'Fat to muscle', tag: 'Fat' }, { d: muscleEnd(x), a: 0.3, name: 'Muscle to tissue', tag: 'Muscle' }];
  const add = (e, name, tag, top, bottom) => { const c = crossing(x, e); if (c) list.push({ d: c[0], a: top, name, tag }, { d: c[1], a: bottom, name, tag }); };
  add(WOMB, 'Wall of the womb', 'Womb', 0.42, 0.36);
  add(HEAD, 'Baby’s skull', 'Skull', 0.95, 0.8);
  add(TORSO, 'Baby’s body', 'Body', 0.62, 0.5);
  add(ARM, 'Baby’s arm', 'Arm', 0.6, 0.4);
  list.sort((a, b) => a.d - b.d);
  // The first boundary that is part of the baby is the one worth working out
  const main = list.find((e) => e.name.startsWith('Baby')) || list[list.length - 1];
  main.main = true;
  return list.map((e, i) => ({ ...e, d: e.d / 100, a: e.a * 0.97 ** i }));
}

// ---------- Steel block ----------

const THICK = 0.25;   // metres
function buildMetal() {
  const r = seeded(state.metalSeed + 7);
  cracks = Array.from({ length: 1 + (r() > 0.55 ? 1 : 0) }, (_, i) => ({ x0: (i ? 225 : 50) + r() * 80, len: 45 + r() * 60, d: 0.05 + r() * 0.15 }));
}
function echoesMetal(px) {
  const list = [], hit = cracks.filter((c) => px >= c.x0 && px <= c.x0 + c.len);
  hit.forEach((c) => list.push({ d: c.d, a: 0.8, name: 'Crack', main: true }));
  list.push({ d: THICK, a: hit.length ? 0.3 : 0.9, name: 'Far side of the block', main: !hit.length });
  return list;
}

const echoes = (tab, x) => (tab === 'sea' ? echoesSea(x) : tab === 'body' ? echoesBody(x) : echoesMetal(x));
const timeOf = (e, m) => (2 * e.d) / m.v / m.tFactor;   // in the display unit
const fmtTime = (t, m) => (m.tUnit === 's' ? t.toFixed(2) : t.toFixed(t < 100 ? 1 : 0));

// The echoes on show: the last pulse at sea, or whatever is under the probe
function shown() {
  if (state.tab === 'sea') return state.sounded == null ? [] : echoes('sea', state.sounded);
  return echoes(state.tab, pos());
}
function pickIndex(list) {
  if (state.pick != null && state.pick < list.length) return state.pick;
  const i = list.findIndex((e) => e.main);
  return i < 0 ? list.length - 1 : i;
}
const echoName = (list, i) => (state.hide ? `Echo ${i + 1}` : list[i].name);

// ---------- Moving and pulsing ----------

// The pictures from the scanner, built one line at a time
const PIC_W = 392, PIC_H = 330;
function makePic() { const cv = document.createElement('canvas'); cv.width = PIC_W; cv.height = PIC_H; return { cv, g: cv.getContext('2d'), done: new Uint8Array(PIC_W) }; }
const pics = { body: makePic(), metal: makePic() };
function paintLine(tab, x) {
  const p = pics[tab], m = MODES[tab], px = Math.round(x);
  p.done[px] = 1;
  p.g.clearRect(px - 1, 0, 3, PIC_H);
  // Speckle, as on a real scan
  for (let i = 0; i < 16; i++) { p.g.fillStyle = `rgba(210, 220, 210, ${Math.random() * 0.14})`; p.g.fillRect(px - 1, Math.random() * PIC_H, 3, 3); }
  for (const e of echoes(tab, px)) {
    const y = e.d * m.pxPerM;
    p.g.fillStyle = `rgba(240, 245, 235, ${clamp(e.a * 1.15, 0.2, 1)})`;
    p.g.fillRect(px - 1, y - 2 + Math.random() * 1.5, 3, 3 + e.a * 3);
  }
}
function wipePic(tab) { const p = pics[tab]; p.g.clearRect(0, 0, PIC_W, PIC_H); p.done.fill(0); }

function addMapPoint(x) { const r = Math.round(x); if (!state.map.some((m) => Math.abs(m - r) < 8)) state.map.push(r); }

function moveTo(x, sailing) {
  const m = mode(), from = pos(), to = clamp(x, m.min, m.max);
  state.pos[state.tab] = to;
  if (state.tab === 'sea') { if (sailing) { addMapPoint(to); state.sounded = to; } else state.sounded = null; } else {
    for (let px = Math.min(from, to); px <= Math.max(from, to); px++) paintLine(state.tab, px);
  }
  state.pick = null;
  renderWork();
}
function stopSweep() { state.sweep = false; $('sweep').textContent = `▶ ${mode().sweep}`; }
function startSweep() {
  const m = mode();
  state.ping = null;
  if (pos() >= m.max - 4) state.pos[state.tab] = m.min;
  state.sweep = true; state.moved[state.tab] = true;
  $('sweep').textContent = '⏸ Stop';
}
function sendPulse() {
  stopSweep();
  state.ping = { t: 0, tab: state.tab, x: pos(), list: echoes(state.tab, pos()) };
  if (state.tab === 'sea') state.sounded = pos();
  state.pick = null;
  renderWork();
}
function finishPing() {
  if (state.ping.tab === 'sea') addMapPoint(state.ping.x);
  else paintLine(state.ping.tab, state.ping.x);
  state.ping = null;
  renderWork();
}

// ---------- Drawing the scene ----------

const scene = $('scene'), c = scene.getContext('2d');
const W = 800, H = 420;

function label(text, x, y, opts = {}) {
  c.font = `${opts.w || 700} ${opts.s || 15}px ${font()}`; c.textAlign = opts.a || 'left'; c.textBaseline = opts.b || 'alphabetic';
  if (opts.halo) { c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = opts.halo; c.strokeText(text, x, y); }
  c.fillStyle = opts.col || '#fff'; c.fillText(text, x, y);
}

// ----- Sea -----
const SEA_TOP = 70, SEA_PX = (H - SEA_TOP - 12) / 5000;
const seaY = (d) => SEA_TOP + d * SEA_PX;
function drawShip(x) {
  const y = SEA_TOP;
  c.fillStyle = '#d7dee8'; c.fillRect(x - 12, y - 30, 28, 18);
  c.fillStyle = '#7a8796'; c.fillRect(x + 2, y - 42, 7, 12);
  c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(x - 44, y - 12); c.lineTo(x + 46, y - 12); c.lineTo(x + 34, y + 6); c.lineTo(x - 36, y + 6); c.closePath(); c.fill();
  c.fillStyle = '#ffe066'; c.beginPath(); c.arc(x, y + 7, 4, 0, Math.PI * 2); c.fill();
}
function drawFish(x, y) {
  c.fillStyle = '#ffb35c';
  c.beginPath(); c.ellipse(x, y, 7, 3.5, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 12, y - 4); c.lineTo(x - 12, y + 4); c.closePath(); c.fill();
}
function drawSea() {
  const sky = c.createLinearGradient(0, 0, 0, SEA_TOP);
  sky.addColorStop(0, '#9fd3f7'); sky.addColorStop(1, '#dff1fc');
  c.fillStyle = sky; c.fillRect(0, 0, W, SEA_TOP);
  const water = c.createLinearGradient(0, SEA_TOP, 0, H);
  water.addColorStop(0, '#2a86c9'); water.addColorStop(1, '#0a2a55');
  c.fillStyle = water; c.fillRect(0, SEA_TOP, W, H - SEA_TOP);

  if (state.hide) {
    c.fillStyle = 'rgba(6, 22, 48, .94)'; c.fillRect(0, SEA_TOP, W, H - SEA_TOP);
    if (!state.map.length) label('What’s down there? Send pulses to find out.', W / 2, 250, { a: 'center', s: 18, col: '#b9d4ee' });
  } else {
    c.fillStyle = '#a58a58';
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) c.lineTo(x, seaY(seaDepth(x)));
    c.lineTo(W, H); c.closePath(); c.fill();
    c.strokeStyle = '#6f5a3a'; c.lineWidth = 2; c.stroke();
    const s = sea.shoal;
    for (let i = 0; i < 14; i++) drawFish(s.x - s.w + (i * 2 * s.w) / 13, seaY(s.d) + ((i * 37) % 9) * 2 - 8);
    // The wreck
    const wx = sea.wreck.x, wy = seaY(seaDepth(wx));
    c.fillStyle = '#3a3f4a'; c.save(); c.translate(wx, wy - 4); c.rotate(-0.12);
    c.beginPath(); c.moveTo(-24, -12); c.lineTo(24, -12); c.lineTo(17, 3); c.lineTo(-17, 3); c.closePath(); c.fill();
    c.fillRect(-4, -22, 9, 11); c.restore();
  }

  // The map built up from the echoes
  if (state.map.length) {
    const pts = [...state.map].sort((a, b) => a - b);
    c.strokeStyle = '#ffe066'; c.lineWidth = 2.5; c.beginPath();
    pts.forEach((x, i) => { const y = seaY(seaDepth(x)); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
    for (const x of pts) {
      for (const e of echoesSea(x)) { c.fillStyle = e.main ? '#ffe066' : '#ff8f4d'; c.beginPath(); c.arc(x, seaY(e.d), e.main ? 3.5 : 5, 0, Math.PI * 2); c.fill(); }
    }
  }

  // Depth scale
  for (let d = 0; d <= 5000; d += 1000) {
    const y = seaY(d);
    c.strokeStyle = 'rgba(255, 255, 255, .55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(W - 12, y); c.lineTo(W, y); c.stroke();
    if (d) label(`${d} m`, W - 16, y + 5, { a: 'right', s: 14, halo: 'rgba(8, 30, 60, .8)' });
  }

  const x = pos();
  drawShip(x);
  if (!state.moved.sea) label('Drag the ship', clamp(x, 70, W - 90) + 54, SEA_TOP - 22, { col: '#14324f', s: 16, w: 800 });
  drawSeaPulse();
}
function drawSeaPulse() {
  const p = state.ping;
  if (!p || p.tab !== 'sea') return;
  const m = MODES.sea, gone = m.v * p.t, deepest = p.list[p.list.length - 1].d;
  const arc = (d, colour, width) => {
    const r = d * SEA_PX + 8;
    c.strokeStyle = colour; c.lineWidth = width; c.beginPath(); c.arc(p.x, SEA_TOP, r, Math.PI / 2 - 0.3, Math.PI / 2 + 0.3); c.stroke();
  };
  if (gone < deepest) arc(gone, '#ffe066', 4);
  for (const e of p.list) if (gone > e.d && gone < 2 * e.d) arc(2 * e.d - gone, '#ff8f4d', 1.5 + e.a * 3);
}

// ----- Probe and scanner screen, for the body and the steel -----
const Y0 = 56;
function drawProbe(x) {
  c.strokeStyle = '#444b57'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, 18); c.bezierCurveTo(x, 2, x + 40, 2, x + 60, 12); c.stroke();
  c.lineCap = 'butt';
  c.fillStyle = '#5b6573'; c.beginPath(); c.roundRect(x - 18, 18, 36, 26, 6); c.fill();
  c.fillStyle = '#2f3640'; c.fillRect(x - 15, 44, 30, 12);
}
function drawBeam(x) {
  c.fillStyle = 'rgba(255, 240, 150, .22)'; c.fillRect(x - 7, Y0, 14, PIC_H);
  const p = state.ping;
  if (!p || p.tab === 'sea') return;
  const m = MODES[p.tab], gone = m.v * p.t, deepest = p.list[p.list.length - 1].d;
  if (gone < deepest) { c.fillStyle = '#ffe066'; c.fillRect(x - 9, Y0 + gone * m.pxPerM - 3, 18, 6); }
  for (const e of p.list) if (gone > e.d && gone < 2 * e.d) { c.fillStyle = '#ff8f4d'; c.fillRect(x - 9, Y0 + (2 * e.d - gone) * m.pxPerM - 2, 18, 2 + e.a * 4); }
}
function drawScreen(tab) {
  const X = 408, m = MODES[tab], p = pics[tab];
  c.fillStyle = '#05070a'; c.fillRect(X, 0, W - X, H);
  label('What the scanner shows', X + 12, 36, { col: '#dfe7ef', s: 18, w: 800 });
  c.drawImage(p.cv, X, Y0);
  if (!p.done.some(Boolean)) label('The picture appears as you scan', X + 196, 220, { a: 'center', col: '#7e8a99', s: 16 });
  const step = tab === 'body' ? 5 : 5, maxCm = PIC_H / (m.pxPerM / 100);
  for (let d = 0; d <= maxCm + 0.01; d += step) {
    const y = Y0 + (d / 100) * m.pxPerM;
    c.strokeStyle = 'rgba(255, 255, 255, .5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(W - 10, y); c.lineTo(W, y); c.stroke();
    if (d) label(`${d} cm`, W - 14, y + 5, { a: 'right', s: 14, col: '#dfe7ef' });
  }
  const bx = X + pos();
  c.strokeStyle = 'rgba(255, 224, 102, .55)'; c.lineWidth = 1.5; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(bx, Y0); c.lineTo(bx, Y0 + PIC_H); c.stroke(); c.setLineDash([]);
}

// ----- Body -----
function fillBetween(top, bottom, colour) {
  c.fillStyle = colour; c.beginPath(); c.moveTo(0, Y0 + top(0) * CM);
  for (let px = 0; px <= PIC_W; px += 4) c.lineTo(px, Y0 + top(px / CM) * CM);
  for (let px = PIC_W; px >= 0; px -= 4) c.lineTo(px, Y0 + bottom(px / CM) * CM);
  c.closePath(); c.fill();
}
const ell = (e, colour, stroke) => { c.fillStyle = colour; c.beginPath(); c.ellipse(e.cx * CM, Y0 + e.cy * CM, e.a * CM, e.b * CM, 0, 0, Math.PI * 2); c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } };
function drawBody() {
  c.fillStyle = PK.cssVar('--surface-2'); c.fillRect(0, 0, PIC_W, Y0);
  if (state.hide) {
    c.fillStyle = '#d8a58c'; c.fillRect(0, Y0, PIC_W, H - Y0);
    label('?', PIC_W / 2, 250, { a: 'center', s: 90, w: 800, col: 'rgba(90, 50, 35, .5)' });
    label('Scan to see inside', PIC_W / 2, 300, { a: 'center', s: 18, col: 'rgba(70, 40, 28, .85)' });
  } else {
    c.save(); c.beginPath(); c.rect(0, Y0, PIC_W, H - Y0); c.clip();
    fillBetween(() => 0, fatEnd, '#f3d990');
    fillBetween(fatEnd, muscleEnd, '#b65a50');
    fillBetween(muscleEnd, () => 18, '#8c4a48');
    ell(WOMB, '#274a68', '#d98b86');
    ell(ARM, '#efb79c', '#b97e66');
    ell(TORSO, '#f2bda3', '#b97e66');
    ell(HEAD, '#f6c7ae', '#b97e66');
    // Legs, tucked up
    c.strokeStyle = '#efb79c'; c.lineWidth = 15; c.lineCap = 'round';
    c.beginPath(); c.moveTo(13.6 * CM, Y0 + 11 * CM); c.quadraticCurveTo(15.3 * CM, Y0 + 9 * CM, 13 * CM, Y0 + 12.3 * CM); c.stroke();
    c.lineCap = 'butt';
    c.restore();
    label('Fat', 6, Y0 + 21, { s: 14, col: '#5f4a12' });
    label('Muscle', 6, Y0 + 52, { s: 14 });
    label('Fluid', 26, Y0 + 9.2 * CM, { s: 14, col: '#cfe4f7' });
    label('Baby', 5.5 * CM, Y0 + 8.8 * CM, { s: 15, a: 'center', col: '#6a3a29' });
  }
  c.fillStyle = '#e7a78a'; c.fillRect(0, Y0 - 3, PIC_W, 4);
  drawBeam(pos());
  drawProbe(pos());
  if (!state.moved.body) label('Drag the probe', clamp(pos() + 34, 0, 280), 34, { col: PK.cssVar('--text'), s: 16, w: 800 });
  drawScreen('body');
}

// ----- Steel -----
function drawMetal() {
  const m = MODES.metal, bottom = Y0 + THICK * m.pxPerM;
  c.fillStyle = PK.cssVar('--surface-2'); c.fillRect(0, 0, PIC_W, H);
  const steel = c.createLinearGradient(0, Y0, 0, bottom);
  steel.addColorStop(0, '#aab3bf'); steel.addColorStop(1, '#7d8794');
  c.fillStyle = steel; c.fillRect(0, Y0, PIC_W, bottom - Y0);
  c.strokeStyle = '#4e5763'; c.lineWidth = 2; c.strokeRect(1, Y0, PIC_W - 2, bottom - Y0);
  if (state.hide) label('?', PIC_W / 2, Y0 + 195, { a: 'center', s: 90, w: 800, col: 'rgba(40, 46, 56, .5)' });
  else {
    c.strokeStyle = '#17191d'; c.lineWidth = 4; c.lineJoin = 'round';
    for (const k of cracks) {
      const y = Y0 + k.d * m.pxPerM;
      c.beginPath(); c.moveTo(k.x0, y);
      for (let i = 1; i <= 6; i++) c.lineTo(k.x0 + (i * k.len) / 6, y + (i % 2 ? 3 : -3));
      c.stroke();
    }
    label('Crack', cracks[0].x0, Y0 + cracks[0].d * m.pxPerM - 10, { s: 15, col: '#17191d', w: 800 });
  }
  drawBeam(pos());
  drawProbe(pos());
  if (!state.moved.metal) label('Drag the probe', clamp(pos() + 34, 0, 280), 34, { col: PK.cssVar('--text'), s: 16, w: 800 });
  drawScreen('metal');
}

function drawScene() {
  const k = scene.width / W;
  c.setTransform(k, 0, 0, k, 0, 0);
  if (state.tab === 'sea') drawSea(); else if (state.tab === 'body') drawBody(); else drawMetal();
  // The stopwatch while a pulse is out
  if (state.ping) {
    const m = mode(), text = `${fmtTime(state.ping.t / m.tFactor, m)} ${m.tUnit}`;
    c.font = `800 20px ${font()}`;
    const tw = c.measureText(text).width + 22, tx = state.tab === 'sea' ? 12 : PIC_W - tw - 8, ty = state.tab === 'sea' ? 12 : 8;
    c.fillStyle = 'rgba(10, 16, 24, .85)'; c.beginPath(); c.roundRect(tx, ty, tw, 34, 6); c.fill();
    c.fillStyle = '#ffe066'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(text, tx + 11, ty + 18);
  }
}

// ---------- The receiver's trace ----------

const trace = $('trace'), tc = trace.getContext('2d');
const TW = 800, TH = 200, TGEO = { L: 40, T: 12, sq: 72, nx: 10, ny: 2 };
const spike = (dx) => (dx < 0 || dx > 30 ? 0 : Math.exp(-dx / 9) * (0.55 + 0.45 * Math.cos(dx * 1.1)));

function drawTrace() {
  const k = trace.width / TW, m = mode(), { L, T, sq, nx, ny } = TGEO, wide = sq * nx, h = sq * ny;
  tc.setTransform(k, 0, 0, k, 0, 0);
  tc.fillStyle = Scope.CASE; tc.fillRect(0, 0, TW, TH);
  Scope.screen(tc, TGEO);
  const base = T + h - 8, tall = h - 20;
  const xOf = (t) => L + (t / m.perSq) * sq;
  const list = state.ping ? state.ping.list : shown();
  const limit = state.ping ? state.ping.t / m.tFactor : Infinity;
  const live = list.map((e, i) => ({ e, i, t: timeOf(e, m) })).filter((s) => s.t <= limit);

  Scope.begin(tc, TGEO, Scope.GREEN, 2.5);
  tc.beginPath();
  for (let px = 0; px <= wide; px += 1) {
    const x = L + px;
    let y = list.length || state.ping ? spike(px) : 0;
    for (const s of live) y += s.e.a * spike(x - xOf(s.t));
    const v = base - Math.min(1, y) * tall;
    if (px) tc.lineTo(x, v); else tc.moveTo(x, v);
  }
  tc.stroke();
  Scope.end(tc);

  // Which echo is which
  const pick = pickIndex(list);
  tc.textBaseline = 'alphabetic';
  live.forEach((s) => {
    const x = xOf(s.t), mine = s.i === pick && !state.ping;
    tc.font = `${mine ? 800 : 600} 14px ${font()}`; tc.textAlign = x > L + wide - 150 ? 'right' : 'left';
    tc.fillStyle = mine ? Scope.AMBER : Scope.LABEL;
    tc.fillText(state.hide ? `Echo ${s.i + 1}` : s.e.tag || s.e.name, x + (tc.textAlign === 'right' ? -3 : 6), T + 18 + (s.i % 2) * 18);
  });
  if (state.ping) { tc.strokeStyle = Scope.AMBER; tc.lineWidth = 2; const x = xOf(limit); tc.beginPath(); tc.moveTo(x, T); tc.lineTo(x, T + h); tc.stroke(); }

  // Time scale
  tc.fillStyle = Scope.LABEL; tc.font = `600 14px ${font()}`; tc.textAlign = 'center'; tc.textBaseline = 'top';
  for (let i = 0; i <= nx; i++) tc.fillText(i * m.perSq, L + i * sq, T + h + 5);
  tc.font = `700 14px ${font()}`;
  tc.fillText(`time since the pulse was sent (${m.tUnit})`, L + wide / 2, T + h + 24);
}

trace.addEventListener('click', (e) => {
  const r = trace.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * TW, m = mode(), list = shown();
  if (!list.length || state.ping) return;
  let best = -1, gap = 40;
  list.forEach((echo, i) => { const g = Math.abs(TGEO.L + (timeOf(echo, m) / m.perSq) * TGEO.sq - x); if (g < gap) { gap = g; best = i; } });
  if (best >= 0) { state.pick = best; renderWork(); }
});

// ---------- Working and results ----------

function fmtDist(d, tab) { return tab === 'sea' ? `${sig(d)} m` : `${sig(d * 100, 3)} cm`; }
function renderWork() {
  const m = mode(), list = shown();
  const can = !state.ping && list.length > 0;
  $('record').disabled = !can;
  if (state.ping) { $('work').innerHTML = '<p>Waiting for the echoes to come back…</p>'; return; }
  if (!list.length) { $('work').innerHTML = '<p>Send a pulse to get a reading.</p>'; return; }
  const i = pickIndex(list), e = list[i], t = Number(fmtTime(timeOf(e, m), m)), tS = t * m.tFactor, both = m.v * tS;
  const plainS = m.tUnit === 's' ? String(t) : tS.toFixed(8).replace(/0+$/, '');
  const tText = m.tUnit === 's' ? `${t} s` : `${t} µs = ${plainS} s`;
  const dist = (x) => (state.tab === 'sea' ? `${sig(x)} m` : `${sig(x, 3)} m`);
  $('work').innerHTML = `
    <p><b style="color:inherit">${esc(echoName(list, i))}</b></p>
    <p>Speed of sound in ${m.medium}: v = ${m.v} m/s</p>
    <p>Time for the echo: t = ${tText}</p>
    <p>There and back: s = v × t = ${m.v} × ${plainS} = ${PK.ans(dist(both))}</p>
    <p>${m.distLabel}: half of that = ${PK.ans(`${dist(both / 2)}${state.tab === 'sea' ? '' : ` = ${fmtDist(both / 2, state.tab)}`}`)}</p>`;
}
function renderTable() {
  const m = mode(), rows = state.rows[state.tab];
  const distHead = state.tab === 'sea' ? 'Depth (m)' : 'Depth (cm)';
  $('table').innerHTML = rows.length
    ? `<table class="results"><thead><tr><th>Position (${m.posUnit})</th><th>Echo from</th><th>Time (${m.tUnit})</th><th>${distHead}</th><th><span class="sr-only">Delete</span></th></tr></thead>
      <tbody>${rows.map((r, n) => `<tr><td>${r.p}</td><td>${esc(r.n)}</td><td>${r.t}</td><td class="n">${PK.ans(`${r.d}`)}</td><td><button class="del" data-row="${n}" aria-label="Delete reading ${n + 1}">✕</button></td></tr>`).join('')}</tbody></table>`
    : '<p class="note">No readings yet.</p>';
}

const EXPLAIN = {
  sea: `<p>A ship’s <b>echo sounder</b> sends a pulse of high-frequency sound down through the water. The pulse reflects off the sea bed, and off anything in the way, such as a shoal of fish. Timing the echo tells you how far away it was.</p>
    <p>The pulse travels <b>there and back</b>, so the depth is <b>half</b> of speed × time. Sailing along and repeating this maps the sea bed. Tick <b>Hide what’s underneath</b> and work out its shape from the echoes alone.</p>`,
  body: `<p><b>Ultrasound</b> is sound with a frequency above 20 kHz, too high for people to hear. At each boundary between two different materials part of the pulse is reflected and the rest carries on, so one pulse gives a whole series of echoes. Each echo’s time shows how deep that boundary is.</p>
    <p>Many lines side by side build up a picture. Ultrasound isn’t ionising, so it is used to scan unborn babies. The echoes here are drawn much bigger than they really are, so you can see them.</p>`,
  metal: `<p>Ultrasound also travels through solids. A pulse sent into a steel block normally reflects only from the far side. A <b>crack</b> is a boundary, so part of the pulse comes back early. The time of that echo shows how deep the crack is, without cutting the metal open.</p>
    <p>This is how pipes, rails and aircraft parts are checked. Press <b>New steel block</b>, tick <b>Hide what’s underneath</b> and hunt for the cracks.</p>`,
};

function showTab(t) {
  state.tab = t; state.ping = null; stopSweep(); state.pick = null;
  const m = mode();
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  $('sweep').textContent = `▶ ${m.sweep}`; $('wipe').textContent = m.wipe;
  $('fresh').hidden = !m.fresh; if (m.fresh) $('fresh').textContent = m.fresh;
  $('trace-note').textContent = t === 'sea' ? 'Each spike is an echo. Tap one to work out how far away it came from.' : 'Each spike is an echo from a boundary. Tap one to work out how deep it is.';
  $('explain').innerHTML = EXPLAIN[t];
  renderWork(); renderTable();
}

// ---------- Controls ----------

document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
$('go').addEventListener('click', sendPulse);
$('sweep').addEventListener('click', () => { if (state.sweep) stopSweep(); else startSweep(); });
$('wipe').addEventListener('click', () => {
  if (state.tab === 'sea') state.map = []; else wipePic(state.tab);
});
$('fresh').addEventListener('click', () => {
  const seed = 2 + Math.floor(Math.random() * 1e6);
  if (state.tab === 'sea') { state.seaSeed = seed; buildSea(); state.map = []; state.sounded = null; } else { state.metalSeed = seed; buildMetal(); wipePic('metal'); }
  state.ping = null; stopSweep();
  if (state.rows[state.tab].length) PK.toast('Readings cleared for the new one');
  state.rows[state.tab] = [];
  renderWork(); renderTable();
});
$('hide').addEventListener('change', (e) => { state.hide = e.target.checked; renderWork(); });
$('record').addEventListener('click', () => {
  const m = mode(), list = shown();
  if (state.ping || !list.length) return;
  const i = pickIndex(list), e = list[i], t = Number(fmtTime(timeOf(e, m), m));
  const d = state.tab === 'sea' ? sig((m.v * t * m.tFactor) / 2) : sig((m.v * t * m.tFactor * 100) / 2);
  const x = state.tab === 'sea' ? state.sounded : pos();
  const row = { p: m.posOf(x), n: echoName(list, i), t, d };
  if (state.rows[state.tab].some((r) => r.p === row.p && r.t === row.t)) { PK.toast('You already have that reading'); return; }
  state.rows[state.tab].push(row);
  renderTable();
});
$('clear').addEventListener('click', () => { state.rows[state.tab] = []; renderTable(); });
$('table').addEventListener('click', (e) => { const b = e.target.closest('.del'); if (b) { state.rows[state.tab].splice(Number(b.dataset.row), 1); renderTable(); } });

PK.dragOn(scene, W, H, {
  hit: (p) => {
    if (state.tab === 'sea') return Math.abs(p.x - pos()) < 62 && p.y < SEA_TOP + 34 ? { dx: pos() - p.x } : null;
    return Math.abs(p.x - pos()) < 44 && p.x < PIC_W + 12 && p.y < Y0 + 34 ? { dx: pos() - p.x } : null;
  },
  move: (d, p) => { state.ping = null; stopSweep(); state.moved[state.tab] = true; moveTo(p.x + d.dx); },
});

// ---------- Start ----------

function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (H / W) * dpr);
  trace.width = Math.round(trace.clientWidth * dpr); trace.height = Math.round(trace.clientWidth * (TH / TW) * dpr);
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.ping) {
    const m = MODES[state.ping.tab];
    state.ping.t += dt * m.rate;
    const end = Math.max(...state.ping.list.map((e) => (2 * e.d) / m.v));
    if (state.ping.t > end * 1.02) finishPing();
  }
  if (state.sweep) {
    const m = mode(), to = Math.min(m.max, pos() + m.speed * dt);
    moveTo(to, true);
    if (to >= m.max) stopSweep();
  }
  drawScene();
  drawTrace();
  requestAnimationFrame(frame);
}
window.addEventListener('resize', sizeAll);
buildSea();
buildMetal();
sizeAll();
showTab('sea');
requestAnimationFrame(frame);

// Share: where everything is, what has been mapped and the readings (the tab and tick box are shared anyway)
const ranges = (done) => { const out = []; let start = -1; for (let i = 0; i <= done.length; i++) { if (done[i] && start < 0) start = i; else if (!done[i] && start >= 0) { out.push([start, i - 1]); start = -1; } } return out; };
PK.shareState = {
  get: () => ({ p: state.pos, a: state.seaSeed, b: state.metalSeed, m: state.map, s: state.sounded, c: { body: ranges(pics.body.done), metal: ranges(pics.metal.done) }, r: state.rows }),
  set: (o) => {
    if (o.p) for (const k of Object.keys(MODES)) if (Number(o.p[k]) > 0) state.pos[k] = clamp(Number(o.p[k]), MODES[k].min, MODES[k].max);
    if (o.a) { state.seaSeed = Number(o.a) || 1; buildSea(); }
    if (o.b) { state.metalSeed = Number(o.b) || 1; buildMetal(); }
    if (Array.isArray(o.m)) state.map = o.m.map(Number);
    state.sounded = o.s == null ? null : Number(o.s);
    if (o.c) for (const k of ['body', 'metal']) for (const [a, b] of o.c[k] || []) for (let x = Number(a); x <= Number(b) && x < PIC_W; x++) paintLine(k, x);
    if (o.r) for (const k of Object.keys(MODES)) if (Array.isArray(o.r[k])) state.rows[k] = o.r[k].map((r) => ({ p: Number(r.p), n: String(r.n), t: Number(r.t), d: Number(r.d) }));
    for (const k of Object.keys(MODES)) state.moved[k] = true;
    renderWork(); renderTable();
  },
};
