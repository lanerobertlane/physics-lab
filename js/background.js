// Contamination, irradiation and background radiation.
// Background: the UK average dose (about 2.7 mSv a year) split by source, and how it changes
// with where you live and what you do; correcting a count rate for background.
// Contamination: a person walks past a sealed source (irradiated only) or through a spill
// (contaminated: the radioactive dust goes with them and keeps irradiating them).

PK.header({
  title: 'Contamination, irradiation & background',
  answers: true,
  spec: [
    { code: '4.4.2.4', text: 'Radioactive contamination and irradiation; the hazards of each and precautions to protect against them' },
    { code: '4.4.3.1', text: 'Background radiation: natural and man-made sources; the level and dose vary with location and occupation; dose in sieverts', po: true },
    { code: '4.4.2.1', text: 'Count-rate measured with a Geiger–Müller tube' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
function text(c, t, x, y, o = {}) { c.fillStyle = o.col || PK.cssVar('--text'); c.font = `${o.w || 700} ${o.s || 13}px ${font()}`; c.textAlign = o.a || 'center'; c.textBaseline = o.b || 'middle'; c.fillText(t, x, y); }

let tab = 'background';

// ---------- Background radiation ----------

const bg = { place: 'uk', pilot: false, ct: false };
// Yearly dose in mSv, roughly the UK figures from Public Health England
function doses() {
  const d = [
    { k: 'Radon gas from rocks', v: 1.3, col: '#8e24aa', natural: true },
    { k: 'Rocks and buildings (gamma)', v: 0.35, col: '#8d6e63', natural: true },
    { k: 'Cosmic rays from space', v: 0.33, col: '#1e88e5', natural: true },
    { k: 'Food and drink', v: 0.27, col: '#43a047', natural: true },
    { k: 'Medical scans and X-rays', v: 0.41, col: '#e53935', natural: false },
    { k: 'Nuclear industry and fallout', v: 0.02, col: '#757575', natural: false },
  ];
  if (bg.place === 'cornwall') { d[0].v = 6.9; d[1].v = 0.6; }   // granite gives off more radon and gamma
  if (bg.pilot) d[2].v += 2.0;                                   // more cosmic rays high up
  if (bg.ct) d[4].v += 8;                                        // a CT scan of the abdomen
  return d;
}

const pie = $('pie'), pctx = pie.getContext('2d');
const PW = 800, PH = 360;
function drawPie() {
  const k = pie.width / PW;
  pctx.setTransform(k, 0, 0, k, 0, 0);
  pctx.fillStyle = PK.cssVar('--surface'); pctx.fillRect(0, 0, PW, PH);
  const d = doses(), total = d.reduce((s, x) => s + x.v, 0);
  const cx = 190, cy = 185, R = 140;
  let a = -Math.PI / 2;
  for (const x of d) {
    const a2 = a + (x.v / total) * Math.PI * 2;
    pctx.fillStyle = x.col; pctx.beginPath(); pctx.moveTo(cx, cy); pctx.arc(cx, cy, R, a, a2); pctx.closePath(); pctx.fill();
    pctx.strokeStyle = PK.cssVar('--surface'); pctx.lineWidth = 2; pctx.stroke();
    const share = x.v / total;
    if (share > 0.06) { const m = (a + a2) / 2; text(pctx, `${Math.round(share * 100)}%`, cx + Math.cos(m) * R * 0.66, cy + Math.sin(m) * R * 0.66, { col: '#fff', s: 14, w: 800 }); }
    a = a2;
  }
  // Key
  let y = 50;
  text(pctx, 'Where the dose comes from', 380, 24, { a: 'left', s: 14, w: 800 });
  for (const x of d) {
    pctx.fillStyle = x.col; pctx.fillRect(380, y - 8, 16, 16);
    text(pctx, x.k, 404, y, { a: 'left', s: 13 });
    text(pctx, `${x.v.toFixed(2)} mSv`, 680, y, { a: 'right', s: 13, w: 800 });
    text(pctx, x.natural ? 'natural' : 'man-made', 770, y, { a: 'right', s: 13, col: PK.cssVar('--muted') });
    y += 30;
  }
  pctx.strokeStyle = PK.cssVar('--border-strong'); pctx.lineWidth = 1; pctx.beginPath(); pctx.moveTo(380, y - 10); pctx.lineTo(770, y - 10); pctx.stroke();
  text(pctx, 'Total in a year', 404, y + 8, { a: 'left', s: 14, w: 800 });
  text(pctx, `${total.toFixed(1)} mSv`, 680, y + 8, { a: 'right', s: 15, w: 800 });
}
function renderDose() {
  const d = doses(), total = d.reduce((s, x) => s + x.v, 0), nat = d.filter((x) => x.natural).reduce((s, x) => s + x.v, 0);
  $('dose-read').innerHTML = `
    <dt>Total dose in a year</dt><dd>${total.toFixed(1)} mSv</dd>
    <dt>From natural sources</dt><dd>${Math.round((nat / total) * 100)}%</dd>
    <dt>Compared with the UK average</dt><dd>${(total / 2.68).toFixed(1)} ×</dd>`;
  document.querySelectorAll('#place .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === bg.place)));
  drawPie();
}

// Counting with a Geiger–Müller tube: 1 minute of counting runs in 6 seconds
const counting = { on: false, t: 0, n: 0, rate: 0, kind: null, bg: null, src: null };
function bgRate() { return bg.place === 'cornwall' ? 42 : 18; }   // counts per minute in a lab
function startCount(kind) {
  Object.assign(counting, { on: true, t: 0, n: 0, kind, rate: kind === 'bg' ? bgRate() : bgRate() + 120 });
  $('count-label').textContent = kind === 'bg' ? 'counts (background)' : 'counts (source + background)';
}
function stepCount(dt) {
  if (!counting.on) return;
  const sdt = dt * 10;
  counting.t += sdt;
  const steps = 10;
  for (let i = 0; i < steps; i++) if (Math.random() < (counting.rate / 60) * (sdt / steps)) counting.n++;
  if (counting.t >= 60) { counting.on = false; counting[counting.kind] = counting.n; renderResults(); }
  $('digits').textContent = counting.n;
}
function renderResults() {
  const r = [];
  if (counting.bg !== null) r.push(`<p>Background: <b>${counting.bg}</b> counts in 1 minute, so the background count rate is <b>${counting.bg} counts per minute</b>.</p>`);
  if (counting.src !== null) r.push(`<p>With the source: <b>${counting.src}</b> counts in 1 minute.</p>`);
  if (counting.bg !== null && counting.src !== null) r.push(`<p>Count rate from the source alone = ${PK.ans(`${counting.src} − ${counting.bg} = <b>${counting.src - counting.bg} counts per minute</b>`)}</p>`);
  else if (counting.src !== null) r.push('<p class="note">Now measure the background, so you can take it away.</p>');
  $('results').innerHTML = r.join('');
}

// ---------- Contamination or irradiation ----------

const sc = $('scene'), sctx = sc.getContext('2d');
const SW = 800, SH = 340, FLOOR = 290, SRC = 300, MONITOR = 660;
const walk = { mode: null, x: 60, t: 0, dots: [], parts: [], done: false, washed: false };
function startWalk(mode) {
  Object.assign(walk, { mode, x: 60, t: 0, dots: [], parts: [], done: false, washed: false });
  $('wash').disabled = true;
  $('c-text').textContent = mode === 'sealed' ? 'Walking past a sealed source…' : 'Walking through spilt radioactive powder…';
}
function stepWalk(dt) {
  if (!walk.mode) return;
  walk.t += dt;
  // Walk in, stand by the source for 2 s, then walk to the monitor
  if (walk.x < SRC + 20) walk.x += 110 * dt;
  else if (walk.t < 5.2) walk.x += 0;
  else if (walk.x < MONITOR - 40) walk.x += 110 * dt;
  else if (!walk.done) { walk.done = true; finishWalk(); }
  // Dust sticks to shoes and hands while walking through the spill
  if (walk.mode === 'spill' && !walk.washed && Math.abs(walk.x - SRC) < 60 && walk.dots.length < 14 && Math.random() < dt * 8) {
    walk.dots.push({ dx: (Math.random() - 0.5) * 22, dy: -Math.random() * 70 - 4 });
  }
  // Radiation from the source and from any dust on the person
  const emitters = [];
  emitters.push(walk.mode === 'sealed' ? [SRC, FLOOR - 40] : [SRC + (Math.random() - 0.5) * 80, FLOOR - 3]);
  for (const d of walk.dots) emitters.push([walk.x + d.dx, FLOOR + d.dy]);
  for (const [x, y] of emitters) if (Math.random() < dt * (walk.mode === 'sealed' ? 14 : 5)) {
    const a = Math.random() * Math.PI * 2;
    walk.parts.push({ x, y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 0.8 });
  }
  for (const p of walk.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  walk.parts = walk.parts.filter((p) => p.life > 0 && p.y < FLOOR + 2);
}
function readingCpm() {
  if (!walk.done) return null;
  return walk.dots.length ? 18 + walk.dots.length * 70 : 18;
}
function finishWalk() {
  const contaminated = walk.dots.length > 0;
  $('wash').disabled = !contaminated;
  $('c-text').innerHTML = contaminated
    ? `<b>Contaminated.</b> Radioactive dust has stuck to their shoes, clothes and hands. They have walked away from the spill, but the dust came with them, so they are <b>still being irradiated</b> and the monitor reads ${readingCpm()} counts per minute. They could also spread it, or breathe or swallow it. Washing and changing clothes removes most of it.`
    : '<b>Irradiated, not contaminated.</b> They were exposed to radiation while they stood near the source, but it stopped as soon as they walked away. They have <b>not</b> become radioactive: the monitor only picks up background (about 18 counts per minute).';
}
function wash() {
  walk.dots = []; walk.washed = true; $('wash').disabled = true;
  $('c-text').innerHTML = '<b>Decontaminated.</b> With the dust washed off, the monitor reads background again (about 18 counts per minute). If any had been breathed in or swallowed, it would keep irradiating them from inside, which is much harder to fix.';
}
function person(c, x) {
  const swing = walk.mode && !walk.done && !(walk.x >= SRC + 20 && walk.t < 5.2) ? Math.sin(walk.t * 9) * 10 : 0;
  c.strokeStyle = PK.cssVar('--text'); c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.arc(x, FLOOR - 112, 13, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(x, FLOOR - 99); c.lineTo(x, FLOOR - 50);
  c.moveTo(x, FLOOR - 50); c.lineTo(x - swing, FLOOR); c.moveTo(x, FLOOR - 50); c.lineTo(x + swing, FLOOR);
  c.moveTo(x, FLOOR - 88); c.lineTo(x + swing * 0.8, FLOOR - 58); c.moveTo(x, FLOOR - 88); c.lineTo(x - swing * 0.8, FLOOR - 58);
  c.stroke();
}
function trefoil(c, x, y, r) {
  c.fillStyle = '#ffd600'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#000';
  for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r * 0.85, a - 0.5, a + 0.5); c.closePath(); c.fill(); }
  c.fillStyle = '#ffd600'; c.beginPath(); c.arc(x, y, r * 0.22, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#000'; c.beginPath(); c.arc(x, y, r * 0.14, 0, Math.PI * 2); c.fill();
}
function drawScene() {
  const k = sc.width / SW;
  sctx.setTransform(k, 0, 0, k, 0, 0);
  sctx.fillStyle = PK.cssVar('--surface'); sctx.fillRect(0, 0, SW, SH);
  sctx.fillStyle = PK.cssVar('--surface-2'); sctx.fillRect(0, FLOOR, SW, SH - FLOOR);
  // The source: a sealed container on a bench, or a spill on the floor
  if (walk.mode !== 'spill') {
    sctx.fillStyle = '#8d6e63'; sctx.fillRect(SRC - 40, FLOOR - 30, 80, 30);
    sctx.fillStyle = '#607d8b'; sctx.fillRect(SRC - 14, FLOOR - 56, 28, 26);
    trefoil(sctx, SRC, FLOOR - 43, 9);
    text(sctx, 'sealed source', SRC, FLOOR + 16, { s: 13 });
  } else {
    sctx.fillStyle = 'rgba(205, 220, 57, .8)';
    for (let i = 0; i < 40; i++) { sctx.beginPath(); sctx.arc(SRC - 60 + ((i * 37) % 120), FLOOR - 2 + ((i * 7) % 5) - 2, 3, 0, Math.PI * 2); sctx.fill(); }
    trefoil(sctx, SRC, FLOOR - 70, 12);
    text(sctx, 'spilt radioactive powder', SRC, FLOOR + 16, { s: 13 });
  }
  // Monitor by the door
  sctx.fillStyle = '#455a64'; sctx.fillRect(MONITOR, FLOOR - 150, 70, 150);
  sctx.fillStyle = '#0b1a10'; sctx.fillRect(MONITOR + 8, FLOOR - 140, 54, 34);
  const cpm = readingCpm();
  text(sctx, cpm === null ? '---' : String(cpm), MONITOR + 35, FLOOR - 123, { s: 15, w: 800, col: cpm > 100 ? '#ff5252' : '#7CFF8A' });
  text(sctx, 'counts/min', MONITOR + 35, FLOOR - 94, { s: 13, col: '#fff' });
  text(sctx, 'radiation monitor', MONITOR + 35, FLOOR + 16, { s: 13 });
  // Radiation
  sctx.strokeStyle = '#8e24aa'; sctx.lineWidth = 2;
  for (const p of walk.parts) { sctx.beginPath(); sctx.moveTo(p.x, p.y); sctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); sctx.stroke(); }
  person(sctx, walk.x);
  for (const d of walk.dots) { sctx.fillStyle = '#c0ca33'; sctx.beginPath(); sctx.arc(walk.x + d.dx, FLOOR + d.dy, 4, 0, Math.PI * 2); sctx.fill(); }
  // What is happening now
  const near = walk.mode && Math.abs(walk.x - SRC) < 110;
  let msg = '';
  if (walk.mode && !walk.done) msg = near ? 'Being irradiated' : walk.dots.length ? 'Still being irradiated by the dust they carry' : walk.x > SRC ? 'Walked away: no longer irradiated' : '';
  if (msg) text(sctx, msg, walk.x, FLOOR - 150, { s: 13, w: 800, col: near || walk.dots.length ? '#c62828' : '#2e7d32' });
}

function renderDanger() {
  $('danger').innerHTML = `
    <tr><th></th><th>Outside the body</th><th>Inside the body</th></tr>
    <tr><th>Alpha</th><td>${PK.ans('Least dangerous: stopped by the skin')}</td><td>${PK.ans('<b>Most dangerous</b>: strongly ionising, and all of it is absorbed by nearby cells')}</td></tr>
    <tr><th>Beta</th><td>${PK.ans('Can reach the skin and tissue under it')}</td><td>${PK.ans('Dangerous, but less ionising than alpha')}</td></tr>
    <tr><th>Gamma</th><td>${PK.ans('<b>Most dangerous</b>: passes deep into the body')}</td><td>${PK.ans('Least dangerous: weakly ionising, and much of it passes out of the body')}</td></tr>`;
}

// ---------- Sort them ----------

const ITEMS = [
  ['A patient’s tumour is treated with gamma rays from a machine.', 'irr', 'The source stays in the machine outside the patient, so the patient isn’t radioactive afterwards.'],
  ['Radioactive dust lands on a worker’s overalls.', 'con', 'Radioactive material is now on the overalls and goes wherever they go.'],
  ['Radon gas is breathed into the lungs.', 'con', 'The radioactive gas is inside the body, irradiating the lungs from inside.'],
  ['Fruit is sterilised with gamma rays to kill bacteria.', 'irr', 'The fruit is exposed to radiation but doesn’t become radioactive, so it is safe to eat.'],
  ['A tracer is injected into a patient’s blood.', 'con', 'The radioactive material is inside the patient on purpose, which is why its half-life needs to be short.'],
  ['A scientist stands near a sealed gamma source.', 'irr', 'The source stays sealed. The exposure stops when the scientist moves away.'],
  ['Water from a damaged nuclear power station leaks into the sea.', 'con', 'Radioactive material is now in the water and can get into fish and food.'],
  ['Surgical instruments are sterilised with gamma rays in sealed packets.', 'irr', 'The gamma rays pass through the packet and kill microbes, but nothing radioactive gets into the packet.'],
];
const sortState = ITEMS.map(() => null);
function renderSort() {
  $('sort').innerHTML = ITEMS.map(([q, ans, why], i) => {
    const got = sortState[i];
    const fb = got === null ? '' : `<p class="fb ${got === ans ? 'ok' : 'bad'}">${got === ans ? '✓ Right.' : `✗ It’s ${ans === 'con' ? 'contamination' : 'irradiation'}.`} ${why}</p>`;
    return `<div class="item"><p>${q}</p><div class="btn-row">
      <button class="btn${got === 'con' ? ' primary' : ''}" data-i="${i}" data-a="con">Contamination</button>
      <button class="btn${got === 'irr' ? ' primary' : ''}" data-i="${i}" data-a="irr">Irradiation</button></div>${fb}</div>`;
  }).join('');
  document.querySelectorAll('#sort .btn').forEach((b) => b.addEventListener('click', () => { sortState[Number(b.dataset.i)] = b.dataset.a; renderSort(); }));
  const done = sortState.filter((s) => s !== null).length, right = sortState.filter((s, i) => s === ITEMS[i][1]).length;
  $('sort-score').textContent = done ? `${right} right out of ${done} answered.` : 'Choose an answer for each one.';
}

// ---------- Tabs and loop ----------

function showTab(t) {
  tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-tab]').forEach((el) => { el.hidden = el.dataset.tab !== t; });
  sizeAll();
  window.history.replaceState(null, '', `#${t}`);
}
function sizeAll() { if (tab === 'background') { size(pie, PW, PH); drawPie(); } if (tab === 'contamination') size(sc, SW, SH); }
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#place .chip').forEach((b) => b.addEventListener('click', () => { bg.place = b.dataset.p; renderDose(); }));
$('pilot').addEventListener('change', (e) => { bg.pilot = e.target.checked; renderDose(); });
$('ct').addEventListener('change', (e) => { bg.ct = e.target.checked; renderDose(); });
$('count-bg').addEventListener('click', () => startCount('bg'));
$('count-src').addEventListener('click', () => startCount('src'));
$('walk-sealed').addEventListener('click', () => startWalk('sealed'));
$('walk-spill').addEventListener('click', () => startWalk('spill'));
$('wash').addEventListener('click', wash);
window.addEventListener('pk-answers', () => { renderResults(); renderDanger(); });
window.addEventListener('pk-theme', () => drawPie());
window.addEventListener('resize', sizeAll);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  stepCount(dt);
  if (tab === 'contamination') { stepWalk(dt); drawScene(); }
  requestAnimationFrame(frame);
}
const startTab = location.hash.slice(1);
showTab(['background', 'contamination', 'sort'].includes(startTab) ? startTab : 'background');
renderDose(); renderDanger(); renderSort();
requestAnimationFrame(frame);
