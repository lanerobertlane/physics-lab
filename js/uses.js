// Uses of radiation: smoke alarm, thickness gauge, medical tracer and radiotherapy.
// Each job needs the right type of radiation (how far it gets, how strongly it ionises)
// and the right half-life (how long the source needs to last).

PK.header({
  title: 'Uses of radiation',
  answers: true,
  spec: [
    { code: '4.4.2.1', text: 'Alpha, beta and gamma: penetration through materials, range in air and ionising power' },
    { code: '4.4.3.2', text: 'Radioactive isotopes have a very wide range of half-life values', po: true },
    { code: '4.4.3.3', text: 'Uses of nuclear radiation: medical tracers, and controlling or destroying unwanted tissue; choosing a source by its type and half-life', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const cv = $('use'), ctx = cv.getContext('2d');
const W = 800, H = 380;
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }

const HOUR = 1, DAY = 24, YEAR = 8766;
const SOURCES = {
  am: { name: 'Americium-241', type: 'alpha', hl: 432 * YEAR, hlText: '432 years' },
  po: { name: 'Polonium-210', type: 'alpha', hl: 138 * DAY, hlText: '138 days' },
  sr: { name: 'Strontium-90', type: 'beta', hl: 28.8 * YEAR, hlText: '29 years' },
  p32: { name: 'Phosphorus-32', type: 'beta', hl: 14.3 * DAY, hlText: '14 days' },
  co: { name: 'Cobalt-60', type: 'gamma', hl: 5.27 * YEAR, hlText: '5.3 years' },
  tc: { name: 'Technetium-99m', type: 'gamma', hl: 6 * HOUR, hlText: '6 hours' },
};
const LETTER = { alpha: 'α', beta: 'β', gamma: 'γ' };
const COLOUR = { alpha: '#e53935', beta: '#1e88e5', gamma: '#8e24aa' };
const SPEED = { alpha: 170, beta: 300, gamma: 480 };
const left = (src, hours) => 0.5 ** (hours / src.hl);
const pct = (f) => (f > 0.995 ? 'almost 100%' : f < 0.001 ? 'almost none' : f < 0.1 ? `${(f * 100).toFixed(1)}%` : `${Math.round(f * 100)}%`);

const state = { job: 'smoke', src: 'am', age: 0, smoke: false, thick: 0.1, running: false, t: 0 };
let parts = [], extras = [];

// ---------- What each job needs ----------

const JOBS = {
  smoke: {
    title: 'Smoke alarm',
    text: 'Inside the alarm, radiation ionises the air between two metal plates, so a small current flows. Smoke gets in the way and the current drops, which sets off the alarm. The alarm should last about 10 years.',
    type: {
      alpha: ['ok', 'Alpha is very strongly ionising, so it makes plenty of ions to carry the current. Smoke absorbs it easily, so the current drops when there is smoke. It can’t get out through the plastic case.'],
      beta: ['bad', 'Beta passes straight through smoke, so smoke hardly changes the current and the alarm wouldn’t go off. It is also only weakly ionising, so the current is tiny.'],
      gamma: ['bad', 'Gamma passes straight through smoke (and out of the alarm into the room), so smoke doesn’t change the current. It is only very weakly ionising.'],
    },
    life: 10 * YEAR, lifeText: '10 years', okIf: (f) => f > 0.8,
    hlGood: 'Long enough: the source hardly runs down while the alarm is in use.',
    hlBad: 'Too short: as the source runs down, the current falls and the alarm goes off even with no smoke.',
    best: 'Americium-241 (alpha, 432 years)',
    age: { max: 10, step: 0.5, unit: 'years', hours: YEAR, label: 'Age of the alarm' },
  },
  gauge: {
    title: 'Thickness gauge',
    text: 'A factory makes paper (or foil) by squeezing it between rollers. A source above the paper and a detector below measure how much radiation gets through. If the count rate drops, the paper is too thick and the rollers squeeze harder.',
    type: {
      alpha: ['bad', 'Alpha is stopped completely by paper, so the detector reads zero whatever the thickness.'],
      beta: ['ok', 'Beta is partly absorbed by paper, so the count rate changes when the thickness changes.'],
      gamma: ['bad', 'Gamma passes through paper almost completely, so the count rate hardly changes with thickness.'],
    },
    life: 4 * 7 * DAY, lifeText: 'a month', okIf: (f) => f > 0.95,
    hlGood: 'Long enough: the count rate only changes because of the paper, not because the source is running down.',
    hlBad: 'Too short: the count rate falls as the source decays, so the machine would think the paper is getting thicker.',
    best: 'Strontium-90 (beta, 29 years)',
    age: { max: 12, step: 1, unit: 'weeks', hours: 7 * DAY, label: 'Time since the source was fitted' },
  },
  tracer: {
    title: 'Medical tracer',
    text: 'A tracer is injected into a patient and collects in an organ, here the kidneys. A gamma camera outside the body picks up the radiation to make an image showing whether the organ is working.',
    type: {
      alpha: ['bad', 'Alpha can’t get out of the body, so the camera detects nothing. Inside the body it is the most dangerous: it is strongly ionising and damages cells.'],
      beta: ['bad', 'Most beta is absorbed inside the body, so the camera detects very little, and it damages the cells around it.'],
      gamma: ['ok', 'Gamma passes out of the body to the camera, and it is only weakly ionising, so it does the least damage on the way.'],
    },
    life: 2 * DAY, lifeText: '2 days', okIf: (f, src) => f < 0.05 && src.hl >= 1,
    hlGood: 'Just right: long enough to take the images (a few hours), but it has almost gone after a day or two, so the patient isn’t radioactive for long.',
    hlBad: 'Too long: the patient would stay radioactive, and keep being irradiated, long after the scan.',
    best: 'Technetium-99m (gamma, 6 hours)',
  },
  therapy: {
    title: 'Radiotherapy',
    text: 'Beams of radiation from outside the body are aimed at a tumour (cancer) to kill its cells. The machine moves round the patient, so the tumour always gets the radiation but the healthy tissue around it gets much less.',
    type: {
      alpha: ['bad', 'Alpha is stopped by the skin, so it never reaches the tumour. It would just burn the skin.'],
      beta: ['bad', 'Beta only gets a short way into the body, so it can’t reach a deep tumour and damages the skin and tissue near the surface instead.'],
      gamma: ['ok', 'Gamma passes deep into the body, so it can reach the tumour from outside.'],
    },
    life: YEAR, lifeText: 'a year', okIf: (f) => f > 0.8,
    hlGood: 'Long enough: the source stays in the machine and keeps working for years before it is replaced.',
    hlBad: 'Too short: the source would run out before it could treat many patients.',
    best: 'Cobalt-60 (gamma, 5.3 years)',
    age: { max: 24, step: 1, unit: 'months', hours: YEAR / 12, label: 'Time since the source was fitted' },
  },
};

function renderVerdict() {
  const J = JOBS[state.job], S = SOURCES[state.src];
  const [tk, tWhy] = J.type[S.type];
  const f = left(S, J.life), hlOk = J.okIf(f, S);
  const icon = (k) => (k === 'ok' ? '✓' : '✗');
  $('job-title').textContent = J.title;
  $('job-text').textContent = J.text;
  $('verdict').innerHTML = `
    <p><span class="tick ${tk}">${icon(tk)} Type: ${S.type}.</span> ${tWhy}</p>
    <p><span class="tick ${hlOk ? 'ok' : 'bad'}">${icon(hlOk ? 'ok' : 'bad')} Half-life: ${S.hlText}.</span> After ${J.lifeText}, ${pct(f)} of the source is left. ${hlOk ? J.hlGood : J.hlBad}</p>
    <p><b>${tk === 'ok' && hlOk ? '✓ A good choice for this job.' : '✗ Not the right source for this job.'}</b> ${PK.ans(`The source used in real life: <b>${J.best}</b>.`)}</p>`;
  document.querySelectorAll('#sources .src').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === state.src)));
}

function renderSources() {
  $('sources').innerHTML = Object.entries(SOURCES).map(([k, s]) => `
    <button class="src" data-s="${k}" aria-pressed="false">
      <span class="t ${s.type}" aria-hidden="true">${LETTER[s.type]}</span><b>${s.name}</b><span class="hl">half-life<br>${s.hlText}</span>
      <small>${s.type}</small>
    </button>`).join('');
  document.querySelectorAll('#sources .src').forEach((b) => b.addEventListener('click', () => { state.src = b.dataset.s; resetJob(); renderVerdict(); }));
}

// ---------- Controls under the picture ----------

function renderBar() {
  const J = JOBS[state.job];
  let html = '';
  if (state.job === 'smoke') html += `<button class="btn primary" id="smoke">${state.smoke ? '🌬 Clear the smoke' : '💨 Puff in some smoke'}</button>`;
  if (state.job === 'gauge') html += `<div class="ctl" style="flex:1;min-width:200px"><label for="thick">Paper thickness <b>${state.thick.toFixed(2)} mm</b></label><input type="range" id="thick" min="0.05" max="0.3" step="0.01" value="${state.thick}"></div>`;
  if (state.job === 'tracer') html += `<button class="btn primary" id="go">💉 Inject the tracer</button>`;
  if (state.job === 'therapy') html += `<button class="btn primary" id="go">${state.running ? '❚❚ Pause treatment' : '▶ Start treatment'}</button><button class="btn" id="again">↺ New patient</button>`;
  if (J.age) html += `<div class="ctl" style="flex:1;min-width:220px"><label for="age">${J.age.label} <b>${state.age} ${J.age.unit}</b></label><input type="range" id="age" min="0" max="${J.age.max}" step="${J.age.step}" value="${state.age}"></div>`;
  $('bar').innerHTML = html;
  $('smoke')?.addEventListener('click', () => { state.smoke = !state.smoke; renderBar(); });
  $('thick')?.addEventListener('input', (e) => { state.thick = Number(e.target.value); e.target.previousElementSibling.querySelector('b').textContent = `${state.thick.toFixed(2)} mm`; });
  $('age')?.addEventListener('input', (e) => { state.age = Number(e.target.value); e.target.previousElementSibling.querySelector('b').textContent = `${state.age} ${J.age.unit}`; });
  $('go')?.addEventListener('click', () => {
    if (state.job === 'tracer') { resetJob(); state.running = true; }
    else { state.running = !state.running; renderBar(); }
  });
  $('again')?.addEventListener('click', () => { resetJob(); renderBar(); });
}

// How active the source is now, compared with when it was new
function activity() {
  const J = JOBS[state.job], S = SOURCES[state.src];
  if (state.job === 'tracer') return left(S, state.t);
  return J.age ? left(S, state.age * J.age.hours) : 1;
}

function resetJob() {
  parts = []; extras = []; state.t = 0; state.running = false; hist = []; dose = 0; acc = 0; countAcc = 0; shown = null;
  image = [];
}

// ---------- Particles ----------

function emit(x, y, ang, type, max) {
  const v = SPEED[type];
  parts.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, type, d: 0, max, dead: false, hit: false });
}
function drawParticle(p) {
  ctx.fillStyle = COLOUR[p.type]; ctx.strokeStyle = COLOUR[p.type];
  if (p.type === 'gamma') {
    const sp = Math.hypot(p.vx, p.vy), ux = p.vx / sp, uy = p.vy / sp;
    ctx.lineWidth = 2; ctx.beginPath();
    for (let s = 0; s <= 14; s += 2) { const w = Math.sin(s * 0.9) * 2.5; const x = p.x - ux * s - uy * w, y = p.y - uy * s + ux * w; if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
  } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.type === 'alpha' ? 4 : 2.5, 0, Math.PI * 2); ctx.fill(); }
}
function moveParts(dt, onStep) {
  for (const p of parts) {
    if (p.dead) continue;
    const s = Math.hypot(p.vx, p.vy) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.d += s;
    if (onStep) onStep(p);
    if (p.d > p.max || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) p.dead = true;
  }
  parts = parts.filter((p) => !p.dead);
}
let acc = 0;
function emitting(dt, rate, fn) { acc += dt * rate; while (acc >= 1) { acc -= 1; fn(); } }
function text(t, x, y, opts = {}) {
  ctx.fillStyle = opts.col || PK.cssVar('--text'); ctx.font = `${opts.w || 700} ${opts.s || 13}px ${font()}`;
  ctx.textAlign = opts.a || 'center'; ctx.textBaseline = opts.b || 'middle'; ctx.fillText(t, x, y);
}
function sourceBox(x, y, w, h, label) {
  const S = SOURCES[state.src];
  ctx.fillStyle = '#455a64'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = COLOUR[S.type]; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 4, 0, Math.PI * 2); ctx.fill();
  if (label !== false) text(S.name, x + w / 2, y + h + 12, { s: 11 });
}

// ---------- Smoke alarm ----------

const SMOKE_BLOBS = Array.from({ length: 46 }, (_, i) => ({ x: 290 + ((i * 73) % 320), y: 110 + ((i * 41) % 160), r: 14 + (i % 5) * 4, ph: i }));
const BASE = { alpha: 1, beta: 0.1, gamma: 0.03 }, THROUGH_SMOKE = { alpha: 0.25, beta: 0.97, gamma: 0.995 };
function smokeStep(dt) {
  const type = SOURCES[state.src].type, a = activity();
  emitting(dt, 22 * a, () => emit(195, 190, (Math.random() - 0.5) * 0.5, type, type === 'alpha' ? (state.smoke ? 70 : 330) : 2000));
  const ionRate = { alpha: 30, beta: 2, gamma: 0.6 }[type];
  moveParts(dt, (p) => {
    if (p.x > 280 && p.x < 620 && Math.random() < ionRate * dt) { extras.push({ x: p.x, y: p.y, s: 1 }, { x: p.x, y: p.y, s: -1 }); }
  });
  for (const e of extras) e.y += e.s * 70 * dt;
  extras = extras.filter((e) => e.y > 100 && e.y < 280);
  state.t += dt;
}
function smokeDraw() {
  const type = SOURCES[state.src].type, a = activity();
  ctx.fillStyle = PK.isDark() ? '#1d2530' : '#eef2f5'; ctx.fillRect(130, 70, 540, 240);
  ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 3; ctx.strokeRect(130, 70, 540, 240);
  text('Inside a smoke alarm (cut away)', 400, 52, { s: 13, w: 800 });
  ctx.fillStyle = '#b0bec5'; ctx.fillRect(280, 90, 340, 10); ctx.fillRect(280, 280, 340, 10);
  text('+', 270, 95, { s: 18, w: 800, col: '#c62828' }); text('−', 270, 285, { s: 18, w: 800, col: '#1e63c6' });
  sourceBox(150, 172, 44, 36);
  if (state.smoke) for (const b of SMOKE_BLOBS) { ctx.fillStyle = 'rgba(120,120,120,.2)'; ctx.beginPath(); ctx.arc(b.x + Math.sin(state.t + b.ph) * 6, b.y + Math.cos(state.t * 0.7 + b.ph) * 4, b.r, 0, Math.PI * 2); ctx.fill(); }
  for (const e of extras) text(e.s > 0 ? '+' : '−', e.x, e.y, { s: 11, w: 800, col: e.s > 0 ? '#c62828' : '#1e63c6' });
  parts.forEach(drawParticle);
  // Current meter and alarm
  const I = BASE[type] * (state.smoke ? THROUGH_SMOKE[type] : 1) * a, rel = I / BASE[type];
  const alarm = rel < 0.6;
  ctx.fillStyle = PK.cssVar('--surface-2'); ctx.fillRect(690, 90, 96, 200);
  text('Current', 738, 106, { s: 12, w: 800 });
  ctx.fillStyle = '#c5cdd3'; ctx.fillRect(722, 122, 32, 130);
  ctx.fillStyle = '#43a047'; const hBar = 130 * Math.min(1, I); ctx.fillRect(722, 252 - hBar, 32, hBar);
  text(I > 0.5 ? 'big' : I > 0.08 ? 'small' : 'tiny', 738, 268, { s: 12 });
  if (alarm) {
    const on = Math.floor(state.t * 4) % 2 === 0;
    ctx.fillStyle = on ? '#e53935' : '#7f1d1d'; ctx.beginPath(); ctx.arc(738, 40, 14, 0, Math.PI * 2); ctx.fill();
    if (on) text('BEEP! BEEP!', 640, 40, { s: 16, w: 800, col: '#e53935', a: 'right' });
  } else { ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.arc(738, 40, 10, 0, Math.PI * 2); ctx.fill(); text('quiet', 720, 40, { s: 12, a: 'right' }); }
  text(state.smoke ? (alarm ? 'Smoke absorbs the radiation: fewer ions, so the current drops and the alarm sounds.' : 'The radiation goes straight through the smoke, so the current hardly changes.')
    : (alarm ? 'The source has decayed so much that the current is low: the alarm goes off with no smoke!' : 'The radiation ionises the air, and the ions carry a current between the plates.'), 400, 345, { s: 13 });
}

// ---------- Thickness gauge ----------

let hist = [], countAcc = 0, countTime = 0, shown = null;
function gaugeTrans(type, th) { const k = th / 0.1; return type === 'alpha' ? 0 : type === 'beta' ? Math.exp(-0.9 * k) : 0.985 ** k; }
function gaugeStep(dt) {
  const type = SOURCES[state.src].type, a = activity();
  const top = 200 - state.thick * 60, bot = 200 + state.thick * 60;
  emitting(dt, 20 * a, () => emit(400 + (Math.random() - 0.5) * 16, 100, Math.PI / 2 + (Math.random() - 0.5) * 0.25, type, 2000));
  moveParts(dt, (p) => {
    if (!p.hit && p.y >= top) {
      p.hit = true;
      const pass = Math.random() < gaugeTrans(type, state.thick);
      if (!pass) p.max = p.d + Math.random() * (bot - top);
    }
    if (p.y > 300) p.dead = true;
  });
  // A real count: Poisson-ish around the expected rate
  const rate = 300 * gaugeTrans(type, state.thick) * a;
  countAcc += rate * dt * (0.8 + Math.random() * 0.4);
  countTime += dt; state.t += dt;
  if (countTime >= 1 || shown === null) { shown = Math.round(countAcc / Math.max(countTime, 0.001)); hist.push(shown); if (hist.length > 30) hist.shift(); countAcc = 0; countTime = 0; }
}
function gaugeDraw() {
  const top = 200 - state.thick * 60, bot = 200 + state.thick * 60;
  text('Paper factory', 400, 22, { s: 13, w: 800 });
  // Paper sheet moving right
  ctx.fillStyle = '#f5f0e1'; ctx.fillRect(0, top, 640, bot - top);
  ctx.strokeStyle = '#c9bfa3'; ctx.lineWidth = 1;
  for (let x = -((state.t * 60) % 40); x < 640; x += 40) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 6, bot); ctx.stroke(); }
  for (const rx of [130, 560]) for (const ry of [top - 26, bot + 26]) { ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.arc(rx, ry, 24, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.fill(); }
  text('rollers', 130, bot + 64, { s: 11 });
  sourceBox(374, 62, 52, 36, false);
  text(SOURCES[state.src].name, 450, 80, { s: 11, a: 'left' });
  // Detector
  ctx.fillStyle = '#37474f'; ctx.fillRect(382, 300, 36, 60); ctx.fillStyle = '#90a4ae'; ctx.fillRect(386, 300, 28, 6);
  text('detector', 450, 330, { s: 11, a: 'left' });
  parts.forEach(drawParticle);
  // Count rate and graph
  ctx.fillStyle = PK.cssVar('--surface-2'); ctx.fillRect(650, 40, 140, 300);
  text('Count rate', 720, 58, { s: 12, w: 800 });
  text(`${shown ?? 0}`, 720, 92, { s: 30, w: 800, col: PK.cssVar('--answer') || PK.cssVar('--text') });
  text('counts per second', 720, 118, { s: 11 });
  const gx = 660, gy = 140, gw = 120, gh = 180, max = 320;
  ctx.strokeStyle = PK.cssVar('--border-strong'); ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
  ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 2; ctx.beginPath();
  hist.forEach((v, i) => { const x = gx + (i / 29) * gw, y = gy + gh - Math.min(1, v / max) * gh; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  ctx.stroke();
  text('last 30 s', 720, gy + gh + 12, { s: 10 });
}

// ---------- Medical tracer ----------

let image = [];
const KIDNEYS = [[330, 252], [410, 256]];
function inBody(x, y) { return (x > 150 && x < 600 && y > 210 && y < 300) || Math.hypot(x - 110, y - 255) < 36; }
function tracerStep(dt) {
  if (!state.running) return;
  const type = SOURCES[state.src].type;
  state.t = Math.min(48, state.t + dt * 1.5);          // 1.5 hours every second
  if (state.t >= 48) state.running = false;
  emitting(dt, 110 * activity(), () => {
    const [kx, ky] = KIDNEYS[Math.random() < 0.5 ? 0 : 1];
    const x = kx + (Math.random() - 0.5) * 30, y = ky + (Math.random() - 0.5) * 14;
    const max = type === 'alpha' ? 5 : type === 'beta' ? 18 + Math.random() * 20 : 2000;
    emit(x, y, Math.random() * Math.PI * 2, type, max);
    parts[parts.length - 1].ox = x; parts[parts.length - 1].oy = y;
  });
  moveParts(dt, (p) => {
    if (p.type === 'gamma' && p.y <= 130 && p.x > 250 && p.x < 490 && !p.hit) { p.hit = true; p.dead = true; if (Math.abs(p.vx) < Math.abs(p.vy) * 0.8) image.push([p.ox, p.oy]); }
  });
  for (const p of parts) if (p.d + 6 > p.max && p.type !== 'gamma' && inBody(p.x, p.y) && Math.random() < 0.3) extras.push({ x: p.x, y: p.y });
  if (extras.length > 400) extras.splice(0, extras.length - 400);
}
function tracerDraw() {
  // Patient lying on a bed
  ctx.fillStyle = '#90a4ae'; ctx.fillRect(60, 300, 560, 12);
  ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.roundRect(150, 210, 450, 90, 30); ctx.fill();
  ctx.beginPath(); ctx.arc(110, 255, 36, 0, Math.PI * 2); ctx.fill();
  for (const [kx, ky] of KIDNEYS) { ctx.fillStyle = '#a1443a'; ctx.beginPath(); ctx.ellipse(kx, ky, 18, 9, 0, 0, Math.PI * 2); ctx.fill(); }
  text('kidneys', 370, 284, { s: 11 });
  for (const e of extras) { ctx.fillStyle = 'rgba(229, 57, 53, .35)'; ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, Math.PI * 2); ctx.fill(); }
  // Gamma camera
  ctx.fillStyle = '#546e7a'; ctx.fillRect(250, 100, 240, 30); text('gamma camera', 370, 115, { s: 12, col: '#fff' });
  ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(370, 100); ctx.lineTo(370, 60); ctx.lineTo(615, 60); ctx.stroke();
  parts.forEach(drawParticle);
  // Image from the camera
  ctx.fillStyle = '#000'; ctx.fillRect(620, 40, 165, 140);
  text('Camera image', 702, 30, { s: 12, w: 800 });
  for (const [x, y] of image) { ctx.fillStyle = 'rgba(120, 255, 160, .5)'; ctx.fillRect(620 + ((x - 290) / 160) * 165 - 2, 40 + ((y - 230) / 50) * 140 - 2, 4, 4); }
  if (!image.length) text(state.t > 0 ? 'nothing detected' : '', 702, 110, { s: 12, col: '#bbb' });
  // Clock and activity
  const a = activity();
  text(`Time since injection: ${Math.floor(state.t)} hours`, 20, 30, { s: 13, a: 'left', w: 800 });
  text(`Radioactive tracer left: ${state.t > 0 || state.running ? pct(a) : '–'}`, 20, 52, { s: 13, a: 'left' });
  if (extras.length > 20) text('Red: cells damaged inside the body', 20, 345, { s: 12, a: 'left', col: '#c62828' });
  if (!state.running && state.t === 0) text('Press “Inject the tracer” to start.', 370, 170, { s: 13 });
}

// ---------- Radiotherapy ----------

let dose = 0;
const TX = 380, TY = 200, BX = 330, BY = 205;
function therapyStep(dt) {
  if (!state.running) return;
  const type = SOURCES[state.src].type;
  state.t += dt;
  for (let k = 0; k < 3; k++) {
    const ang = state.t * 0.5 + (k * 2 * Math.PI) / 3, sx = TX + Math.cos(ang) * 230, sy = TY + Math.sin(ang) * 175;
    emitting(dt, 9 * activity(), () => {
      const dir = Math.atan2(TY - sy, TX - sx) + (Math.random() - 0.5) * 0.1;
      // Distance from the machine to the skin along this line
      let s = 0; while (s < 400 && ((sx + Math.cos(dir) * s - BX) / 175) ** 2 + ((sy + Math.sin(dir) * s - BY) / 125) ** 2 > 1) s += 2;
      emit(sx, sy, dir, type, type === 'alpha' ? s + 3 : type === 'beta' ? s + 14 + Math.random() * 10 : 2000);
    });
  }
  moveParts(dt, (p) => {
    if (p.type === 'gamma' && !p.hit && Math.hypot(p.x - TX, p.y - TY) < 22) { p.hit = true; dose += 1; }
    if (p.type !== 'gamma' && p.d + 4 > p.max && Math.random() < 0.4) extras.push({ x: p.x, y: p.y });
  });
  if (extras.length > 500) extras.splice(0, extras.length - 500);
}
function therapyDraw() {
  ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.ellipse(BX, BY, 175, 125, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c99a6e'; ctx.lineWidth = 2; ctx.stroke();
  text('Cross-section through the patient', BX, 40, { s: 13, w: 800 });
  const r = Math.max(0, 22 * (1 - dose / 400));
  if (r > 0) { ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(TX, TY, r, 0, Math.PI * 2); ctx.fill(); text('tumour', TX, TY + 34, { s: 11 }); }
  else text('Tumour destroyed ✓', TX, TY, { s: 13, w: 800, col: '#2e7d32' });
  for (const e of extras) { ctx.fillStyle = 'rgba(229, 57, 53, .4)'; ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, Math.PI * 2); ctx.fill(); }
  for (let k = 0; k < 3; k++) {
    const ang = state.t * 0.5 + (k * 2 * Math.PI) / 3, sx = TX + Math.cos(ang) * 230, sy = TY + Math.sin(ang) * 175;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang); ctx.fillStyle = '#455a64'; ctx.fillRect(-12, -14, 30, 28); ctx.restore();
  }
  parts.forEach(drawParticle);
  const a = activity();
  ctx.fillStyle = PK.cssVar('--surface-2'); ctx.fillRect(630, 60, 160, 150);
  text('Tumour', 710, 78, { s: 12, w: 800 });
  text(`${Math.round(Math.min(100, (dose / 400) * 100))}% destroyed`, 710, 104, { s: 15, w: 800 });
  text('Source strength', 710, 140, { s: 12, w: 800 });
  text(pct(a), 710, 164, { s: 15, w: 800 });
  if (extras.length > 20) text('Red: skin and healthy tissue damaged', 20, 355, { s: 12, a: 'left', col: '#c62828' });
  if (!state.running && state.t === 0) text('Press “Start treatment”.', BX, BY, { s: 13 });
}

// ---------- Loop ----------

const STEP = { smoke: smokeStep, gauge: gaugeStep, tracer: tracerStep, therapy: therapyStep };
const DRAW = { smoke: smokeDraw, gauge: gaugeDraw, tracer: tracerDraw, therapy: therapyDraw };
function draw() {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(0, 0, W, H);
  DRAW[state.job]();
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  STEP[state.job](dt);
  draw();
  requestAnimationFrame(frame);
}

function showJob(j) {
  state.job = j; state.age = 0; state.smoke = false;
  document.querySelectorAll('#jobs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.j === j)));
  resetJob(); renderBar(); renderVerdict();
  window.history.replaceState(null, '', `#${j}`);
}
document.querySelectorAll('#jobs .chip').forEach((b) => b.addEventListener('click', () => showJob(b.dataset.j)));
window.addEventListener('pk-answers', renderVerdict);
window.addEventListener('resize', size);

size();
renderSources();
const start = location.hash.slice(1);
showJob(JOBS[start] ? start : 'smoke');
requestAnimationFrame(frame);
