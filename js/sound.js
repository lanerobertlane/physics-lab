// Sound on an oscilloscope: a signal generator drives a loudspeaker, the sound travels to a
// microphone, and the oscilloscope shows it. Amplitude sets the loudness and frequency the pitch.

PK.header({
  title: 'Sound on an oscilloscope',
  answers: true,
  spec: [
    { code: '4.6.1.1', text: 'Sound waves travelling through air are longitudinal' },
    { code: '4.6.1.2', text: 'Describe wave motion in terms of amplitude, wavelength, frequency and period' },
    { code: '4.6.1.2', text: 'Period = 1 ÷ frequency, and wave speed = frequency × wavelength' },
    { code: '4.6.1.2', text: 'How speed, frequency and wavelength are linked when sound passes from one medium to another', po: true },
    { code: '4.6.1.4', text: 'Sound waves make the ear drum and other parts vibrate. This only works over a limited frequency range', po: true, ht: true },
    { code: '4.6.1.4', text: 'The range of normal human hearing is from 20 Hz to 20 kHz', po: true, ht: true },
    { code: 'KS3', text: 'Sound is produced by vibrating objects and detected by a microphone diaphragm and the ear drum. Frequency is measured in hertz' },
    { code: 'KS3', text: 'Sound needs a medium to travel. The speed of sound in air, in water and in solids. The auditory range of humans and animals' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sig = (x, n = 3) => Number(x.toPrecision(n));
const MEDIA = {
  air: { name: 'air', v: 340, fill: null, show: 110 },
  water: { name: 'water', v: 1500, fill: 'rgba(60, 140, 220, .2)', show: 170 },
  steel: { name: 'steel', v: 6000, fill: 'rgba(120, 132, 148, .3)', show: 240 },
  none: { name: 'a vacuum', v: 0, fill: null, show: 0 },
};
const F_MIN = 10, F_MAX = 100000, A_MAX = 4;
const TDIVS = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
const state = { f: 440, A: 2, vdiv: 1, tdiv: 1, medium: 'air', sound: false, kept: null, mystery: false };
const fmtF = (f) => (f < 1000 ? `${sig(f)} Hz` : `${sig(f / 1000)} kHz`);
const heard = () => state.medium !== 'none' && state.f >= 20 && state.f <= 20000 && state.A > 0;
let dirty = true;

// ---------- The sound itself ----------

let audio = null, osc = null, gain = null;
function startAudio() {
  if (osc) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    osc = audio.createOscillator(); gain = audio.createGain();
    gain.gain.value = 0;
    osc.connect(gain); gain.connect(audio.destination); osc.start();
  } catch { PK.toast('Sound isn’t available on this device'); }
}
function updateAudio() {
  if (!osc) return;
  const now = audio.currentTime;
  osc.frequency.setTargetAtTime(Math.min(state.f, audio.sampleRate / 2 - 1), now, 0.015);
  // High notes sound far louder than low ones of the same amplitude, so they are turned down
  const level = state.sound && heard() ? 0.2 * (state.A / A_MAX) * (state.f > 3000 ? 0.45 : 1) : 0;
  gain.gain.setTargetAtTime(level, now, 0.03);
}
function setSound(on) {
  state.sound = on;
  if (on) startAudio();
  $('sound-btn').textContent = on ? '🔇 Turn the sound off' : '🔊 Turn the sound on';
  $('sound-note').hidden = !on;
  updateAudio();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && state.sound) setSound(false); });

// ---------- Changing the sound ----------

const incFor = (f) => (f < 100 ? 5 : f < 1000 ? 10 : f < 10000 ? 100 : 1000);
const niceF = (f) => clamp(sig(f, 3), F_MIN, F_MAX);
function setF(f, fromBox) {
  state.f = fromBox ? f : niceF(f);
  if (!fromBox) PK.setNum('freq', state.f);
  $('freq').dataset.inc = incFor(state.f);
  changed();
}
function setA(A, fromBox) {
  state.A = clamp(A, 0, A_MAX);
  if (!fromBox) PK.setNum('amp', state.A);
  changed();
}
function changed() { dirty = true; updateAudio(); renderRead(); }

// Choose the time-base that shows a few waves and a Y-gain that makes good use of the screen
function fit() {
  let best = 1, gap = Infinity;
  for (const t of TDIVS) { const waves = (state.f * 10 * t) / 1000, g = Math.abs(waves - 4); if (g < gap) { gap = g; best = t; } }
  state.tdiv = best; $('tdiv').value = String(best);
  state.vdiv = state.A > 3 ? 2 : state.A > 0 && state.A <= 1.5 ? 0.5 : 1; $('vdiv').value = String(state.vdiv);
  changed();
}

// ---------- Oscilloscope ----------

const scope = $('scope'), sc = scope.getContext('2d');
const SW = 800, SH = 420, GEO = { L: 40, T: 20, sq: 46, nx: 10, ny: 8 };
const WIDE = GEO.sq * GEO.nx, CY = GEO.T + (GEO.sq * GEO.ny) / 2;

function drawTrace(f, A, colour, width) {
  const amp = (A / state.vdiv) * GEO.sq, waves = (f * GEO.nx * state.tdiv) / 1000;
  Scope.begin(sc, GEO, colour, width);
  if (waves > 70 && amp > 0) {   // too many to pick out, as on a real screen: a solid band
    sc.globalAlpha = 0.6; sc.fillRect(GEO.L, CY - amp, WIDE, 2 * amp);
  } else {
    const step = clamp(WIDE / waves / 14, 0.4, 2);
    sc.beginPath();
    for (let px = 0; px <= WIDE; px += step) {
      const y = CY - amp * Math.sin((2 * Math.PI * waves * px) / WIDE);
      if (px) sc.lineTo(GEO.L + px, y); else sc.moveTo(GEO.L + px, y);
    }
    sc.stroke();
  }
  Scope.end(sc);
}

function drawScope() {
  const k = scope.width / SW;
  sc.setTransform(k, 0, 0, k, 0, 0);
  sc.fillStyle = Scope.CASE; sc.fillRect(0, 0, SW, SH);
  Scope.screen(sc, GEO);
  if (state.kept) drawTrace(state.kept.f, state.kept.A, Scope.AMBER, 2.5);
  drawTrace(state.f, state.medium === 'none' ? 0 : state.A, Scope.GREEN, 3);

  // Settings beside the screen
  const x = GEO.L + WIDE + 24, y = GEO.T;
  sc.fillStyle = Scope.LABEL; sc.textAlign = 'left'; sc.textBaseline = 'top';
  sc.font = `700 14px ${font()}`; sc.fillText('Y-gain', x, y + 10);
  sc.font = `800 20px ${font()}`; sc.fillText(`${state.vdiv} V / square`, x, y + 30);
  sc.font = `700 14px ${font()}`; sc.fillText('Time-base', x, y + 80);
  sc.font = `800 20px ${font()}`; sc.fillText(`${state.tdiv} ms / square`, x, y + 100);
  let line = y + 158;
  if (state.kept) {
    sc.font = `700 14px ${font()}`;
    sc.fillStyle = Scope.GREEN; sc.fillRect(x, line + 6, 22, 4); sc.fillText('Now', x + 30, line);
    sc.fillStyle = Scope.AMBER; sc.fillRect(x + 90, line + 6, 22, 4); sc.fillText('Kept', x + 120, line);
    line += 34;
  }
  sc.fillStyle = Scope.LABEL; sc.font = `600 15px ${font()}`;
  const lines = state.medium === 'none' ? ['No particles to carry', 'the sound, so the', 'microphone picks up', 'nothing.']
    : state.mystery ? ['Mystery sound.', 'Read the trace to find', 'its frequency and', 'amplitude.']
      : ['Drag the wave:', 'up or down for', 'amplitude, sideways', 'for frequency.'];
  lines.forEach((l, i) => sc.fillText(l, x, line + i * 21));
}

PK.dragOn(scope, SW, SH, {
  hit: (p) => (!state.mystery && p.x >= GEO.L && p.x <= GEO.L + WIDE && p.y >= GEO.T && p.y <= GEO.T + GEO.sq * GEO.ny
    ? { x: p.x, y: p.y, f: state.f, axis: null } : null),
  move: (d, p) => {
    if (!d.axis) d.axis = Math.abs(p.x - d.x) > Math.abs(p.y - d.y) ? 'f' : 'A';
    if (d.axis === 'A') setA(Math.round((Math.abs(p.y - CY) / GEO.sq) * state.vdiv * 10) / 10);
    else setF(clamp((d.f * Math.max(14, d.x - GEO.L)) / Math.max(14, p.x - GEO.L), F_MIN, F_MAX));
  },
});

// ---------- Particles between the loudspeaker and the microphone ----------

const air = $('air'), ac = air.getContext('2d');
const AW = 800, AH = 180, A_LEFT = 140, A_RIGHT = 690;
let clock = 0;

// Compressed so the whole range fits, but a shorter wavelength is always drawn shorter
function wavePx() {
  const m = MEDIA[state.medium];
  return m.v ? clamp(26 + (Math.log10(m.v / state.f) + 2.5) * 62, 22, 420) : 100;
}
function drawAir() {
  const k = air.width / AW, m = MEDIA[state.medium], lam = wavePx();
  ac.setTransform(k, 0, 0, k, 0, 0);
  ac.fillStyle = PK.cssVar('--surface-2'); ac.fillRect(0, 0, AW, AH);
  if (m.fill) { ac.fillStyle = m.fill; ac.fillRect(A_LEFT - 22, 8, A_RIGHT - A_LEFT + 44, AH - 44); }
  const phase = (x) => (2 * Math.PI * (x - A_LEFT - m.show * clock)) / lam;
  const reach = Math.min(lam * 0.22, 3 + state.A * 3);
  const text = PK.cssVar('--text'), muted = PK.cssVar('--muted');

  // Particles: each one only moves back and forth
  if (m.v) {
    ac.fillStyle = muted;
    let mark = null;
    for (let r = 0; r < 7; r++) {
      for (let i = 0; A_LEFT + i * 11 <= A_RIGHT; i++) {
        const x0 = A_LEFT + i * 11 + (r % 2) * 5.5, y = 22 + r * 18;
        const x = x0 + reach * Math.sin(phase(x0));
        if (r === 3 && i === 25) { mark = [x, y]; continue; }
        ac.beginPath(); ac.arc(x, y, 2.6, 0, Math.PI * 2); ac.fill();
      }
    }
    ac.fillStyle = '#e53935'; ac.beginPath(); ac.arc(mark[0], mark[1], 5, 0, Math.PI * 2); ac.fill();
  } else {
    ac.fillStyle = muted; ac.font = `700 15px ${font()}`; ac.textAlign = 'center'; ac.textBaseline = 'middle';
    ac.fillText('No particles, so there is nothing to pass the vibrations along', (A_LEFT + A_RIGHT) / 2, 74);
  }

  // Loudspeaker
  const push = (state.A / A_MAX) * 7 * Math.sin(phase(A_LEFT) + Math.PI);
  ac.fillStyle = '#4a5260'; ac.fillRect(26, 58, 30, 36);
  ac.fillStyle = '#7b8494'; ac.beginPath(); ac.moveTo(56, 62); ac.lineTo(100 + push, 18); ac.lineTo(100 + push, 134); ac.lineTo(56, 90); ac.closePath(); ac.fill();
  ac.strokeStyle = text; ac.lineWidth = 2; ac.stroke();

  // Microphone and its lead
  const mx = A_RIGHT + 52;
  ac.strokeStyle = text; ac.lineWidth = 3;
  ac.beginPath(); ac.moveTo(mx + 30, 76); ac.lineTo(AW - 6, 76); ac.stroke();
  ac.fillStyle = '#4a5260'; ac.fillRect(mx, 64, 32, 24);
  ac.fillStyle = '#c3cad6'; ac.beginPath(); ac.ellipse(mx, 76, 8, 18, 0, 0, Math.PI * 2); ac.fill(); ac.stroke();

  ac.fillStyle = text; ac.font = `700 15px ${font()}`; ac.textAlign = 'center'; ac.textBaseline = 'alphabetic';
  ac.fillText('Loudspeaker', 66, AH - 12);
  ac.fillText('Microphone', mx + 4, AH - 12);
}

// ---------- Who can hear it? ----------

const range = $('range'), rc = range.getContext('2d');
const RW = 800, RH = 300, R_L = 140, R_R = 780, R_T = 50, R_B = 250;
const HEARING = [
  ['🐘', 'Elephants', 16, 12000],
  ['🧑', 'Humans', 20, 20000],
  ['🐕', 'Dogs', 65, 45000],
  ['🦇', 'Bats', 2000, 110000],
  ['🐬', 'Dolphins', 150, 150000],
];
const LOG_LO = 1, LOG_HI = Math.log10(200000);
const fx = (f) => R_L + ((Math.log10(f) - LOG_LO) / (LOG_HI - LOG_LO)) * (R_R - R_L);
const xf = (x) => 10 ** (LOG_LO + ((x - R_L) / (R_R - R_L)) * (LOG_HI - LOG_LO));

function drawRange() {
  const k = range.width / RW, text = PK.cssVar('--text'), muted = PK.cssVar('--muted'), accent = PK.cssVar('--accent');
  rc.setTransform(k, 0, 0, k, 0, 0);
  rc.fillStyle = PK.cssVar('--surface'); rc.fillRect(0, 0, RW, RH);
  // Above and below what people can hear
  rc.fillStyle = PK.cssVar('--surface-2');
  rc.fillRect(R_L, R_T, fx(20) - R_L, R_B - R_T); rc.fillRect(fx(20000), R_T, R_R - fx(20000), R_B - R_T);
  rc.fillStyle = muted; rc.font = `700 15px ${font()}`; rc.textAlign = 'center'; rc.textBaseline = 'alphabetic';
  rc.textAlign = 'left'; rc.fillText('Ultrasound', fx(20000) + 2, R_T - 7);
  rc.textAlign = 'center';
  rc.fillText('What people can hear', (fx(20) + fx(20000)) / 2, R_T - 7);

  // Frequency scale
  rc.strokeStyle = PK.cssVar('--grid'); rc.lineWidth = 1;
  rc.fillStyle = muted; rc.font = `600 15px ${font()}`; rc.textBaseline = 'top';
  [[10, '10 Hz'], [100, '100 Hz'], [1000, '1 kHz'], [10000, '10 kHz'], [100000, '100 kHz']].forEach(([f, label]) => {
    rc.beginPath(); rc.moveTo(fx(f), R_T); rc.lineTo(fx(f), R_B); rc.stroke();
    rc.fillText(label, fx(f), R_B + 6);
  });
  rc.strokeStyle = text; rc.lineWidth = 1.5; rc.beginPath(); rc.moveTo(R_L, R_B); rc.lineTo(R_R, R_B); rc.stroke();

  // One bar for each animal
  const rowH = (R_B - R_T) / HEARING.length;
  HEARING.forEach(([icon, name, lo, hi], i) => {
    const y = R_T + rowH * (i + 0.5), human = name === 'Humans';
    rc.fillStyle = text; rc.font = `${human ? 800 : 600} 16px ${font()}`; rc.textAlign = 'left'; rc.textBaseline = 'middle';
    rc.fillText(`${icon} ${name}`, 4, y);
    rc.fillStyle = human ? accent : PK.cssVar('--art'); rc.globalAlpha = human ? 1 : 0.65;
    rc.fillRect(fx(lo), y - 9, fx(hi) - fx(lo), 18);
    rc.globalAlpha = 1;
    if (human) { rc.fillStyle = PK.cssVar('--accent-ink'); rc.font = `800 14px ${font()}`; rc.textAlign = 'center'; rc.fillText('20 Hz to 20 kHz', (fx(lo) + fx(hi)) / 2, y + 1); }
  });
  rc.fillStyle = muted; rc.font = `600 14px ${font()}`; rc.textAlign = 'right'; rc.textBaseline = 'alphabetic';
  rc.fillText('Animal ranges are approximate', R_R, RH - 4);

  // The sound being played: drag it along
  if (!state.mystery) {
    const x = fx(state.f), col = PK.cssVar('--answer') || accent;
    rc.strokeStyle = col; rc.fillStyle = col; rc.lineWidth = 3;
    rc.beginPath(); rc.moveTo(x, R_T - 2); rc.lineTo(x, R_B + 2); rc.stroke();
    rc.beginPath(); rc.arc(x, R_B, 8, 0, Math.PI * 2); rc.fill();
    const label = fmtF(state.f), lx = clamp(x, R_L + 42, R_R - 42);
    rc.font = `800 16px ${font()}`; rc.textAlign = 'center'; rc.textBaseline = 'alphabetic';
    const tw = rc.measureText(label).width + 14;
    rc.fillRect(lx - tw / 2, 2, tw, 24);
    rc.fillStyle = PK.cssVar('--surface'); rc.fillText(label, lx, 20);
  }
}

function fromRange(p) { setF(clamp(xf(clamp(p.x, R_L, R_R)), F_MIN, F_MAX)); }
PK.dragOn(range, RW, RH, {
  hit: (p) => (!state.mystery && p.x >= R_L - 12 && p.x <= R_R + 12 ? { p } : null),
  move: (d, p) => fromRange(p),
  tap: (d) => fromRange(d.p),
});

// ---------- Panel ----------

const fmtTime = (ms) => `${sig(ms)} ms (${sig(ms / 1000)} s)`;
function fmtLength(m) { return m >= 1 ? `${sig(m)} m` : m >= 0.01 ? `${sig(m * 100)} cm` : `${sig(m * 1000)} mm`; }
function pitchWords() {
  const { f, A } = state;
  if (state.medium === 'none') return 'You would hear nothing: sound can’t travel through a vacuum.';
  if (f < 20) return 'Too low for people to hear.';
  if (f > 20000) return 'Ultrasound: too high for people to hear.';
  if (A === 0) return 'Silent: there is no vibration.';
  const pitch = f < 250 ? 'Low pitch' : f < 2000 ? 'Medium pitch' : 'High pitch', loud = A <= 1 ? 'quiet' : A <= 2.5 ? 'medium loudness' : 'loud';
  return `${pitch}, ${loud}.`;
}
function renderRead() {
  const T = 1000 / state.f, squares = T / state.tdiv, m = MEDIA[state.medium];
  const secret = (html) => (state.mystery ? '?' : PK.ans(html));
  const flat = state.medium === 'none';
  $('read').innerHTML = `
    <dt>Squares for one wave</dt><dd>${secret(`${sig(squares)}`)}</dd>
    <dt>Period (squares × time-base)</dt><dd>${secret(fmtTime(T))}</dd>
    <dt>Frequency (f = 1 ÷ T)</dt><dd>${secret(fmtF(state.f))}</dd>
    <dt>Amplitude (squares × Y-gain)</dt><dd>${flat ? '0' : secret(`${sig(state.A / state.vdiv)} × ${state.vdiv} = ${sig(state.A)} V`)}</dd>`;
  $('what-you-hear').textContent = state.mystery ? '' : pitchWords();
  $('air-note').innerHTML = m.v
    ? `Sound is a longitudinal wave: the particles vibrate along the direction the wave travels. The red particle stays in the same place and only the wave moves on. (The picture is slowed right down and isn’t to scale.) In ${m.name} it travels at about <b>${m.v} m/s</b>, so at this frequency the wavelength is ${secret(`λ = v ÷ f = ${fmtLength(m.v / state.f)}`)}. Changing the material changes the speed and the wavelength, but not the frequency.`
    : 'A vacuum has no particles to pass the vibrations along, so sound can’t travel through it.';
}

// ---------- Controls ----------

$('sound-btn').addEventListener('click', () => setSound(!state.sound));
$('freq').addEventListener('input', () => setF(PK.num('freq'), true));
$('amp').addEventListener('input', () => setA(PK.num('amp'), true));
$('vdiv').addEventListener('change', (e) => { state.vdiv = Number(e.target.value); changed(); });
$('tdiv').addEventListener('change', (e) => { state.tdiv = Number(e.target.value); changed(); });
$('fit').addEventListener('click', fit);
$('examples').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { setF(Number(b.dataset.f)); fit(); } });
function keepLabel() { $('keep').textContent = state.kept ? '✕ Clear the kept trace' : '📌 Keep this trace'; }
$('keep').addEventListener('click', () => {
  state.kept = state.kept ? null : { f: state.f, A: state.A };
  keepLabel(); changed();
});
document.querySelectorAll('#medium .chip').forEach((b) => b.addEventListener('click', () => {
  state.medium = b.dataset.m;
  document.querySelectorAll('#medium .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  changed();
}));

function showMystery() {
  $('gen-rows').hidden = state.mystery; $('mystery-note').hidden = !state.mystery;
  $('mystery').textContent = state.mystery ? '👁 Reveal' : '❓ Mystery sound';
}
$('mystery').addEventListener('click', () => {
  state.mystery = !state.mystery;
  if (state.mystery) {
    // Numbers that land on the grid lines, so they can be read from the screen
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    state.tdiv = pick([0.1, 0.2, 0.5, 1, 2, 5]);
    state.f = sig(1000 / (state.tdiv * pick([2, 2.5, 4, 5])), 4);
    state.vdiv = pick([0.5, 1]); state.A = state.vdiv * pick([1, 1.5, 2, 2.5, 3]);
    state.kept = null; keepLabel();
    $('vdiv').value = String(state.vdiv); $('tdiv').value = String(state.tdiv);
    PK.setNum('freq', state.f); PK.setNum('amp', state.A); $('freq').dataset.inc = incFor(state.f);
    // Sound through air, so the trace is there to read
    state.medium = 'air';
    document.querySelectorAll('#medium .chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.m === 'air')));
  }
  showMystery(); changed();
});

// ---------- Start ----------

function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  for (const [cv, w, h] of [[scope, SW, SH], [air, AW, AH], [range, RW, RH]]) { cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
  dirty = true;
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; clock += dt;
  if (dirty) { drawScope(); drawRange(); dirty = false; }
  drawAir();
  requestAnimationFrame(frame);
}
window.addEventListener('resize', sizeAll);
window.addEventListener('pk-theme', () => { dirty = true; });
window.addEventListener('pk-answers', renderRead);
sizeAll();
renderRead();
requestAnimationFrame(frame);

// Share: the kept trace and whether it's a mystery (the number boxes, drop-downs and chips are shared anyway)
PK.shareState = {
  get: () => ({ k: state.kept, m: state.mystery ? 1 : 0 }),
  set: (o) => {
    state.kept = o.k && Number(o.k.f) > 0 ? { f: Number(o.k.f), A: Number(o.k.A) } : null;
    state.mystery = Boolean(o.m);
    keepLabel(); showMystery(); changed();
  },
};
