// Measuring the speed of sound three ways: timing a bang across a field by hand, clapping in
// step with an echo, and reading the gap between two microphones on an oscilloscope.

PK.header({
  title: 'Measuring the speed of sound',
  answers: true,
  spec: [
    { code: '4.6.1.2', text: 'Describe a method to measure the speed of sound waves in air' },
    { code: '4.5.6.1.2', text: 'Speed = distance ÷ time. A typical value for the speed of sound in air is 330 m/s' },
    { code: 'KS3', text: 'Sound: echoes, and the speed of sound in air' },
    { code: 'KS3', text: 'Speed = distance ÷ time' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sig = (x, n = 3) => Number(x.toPrecision(n));
const V = 340;   // m/s in the air on this page
const state = { tab: 'field', rows: { field: [], echo: [], mics: [] }, moved: { field: false, echo: false, mics: false }, cur: [1, 5], clapped: false, tdiv: 1 };
const round2 = (x) => Math.round(x * 100) / 100;

// What each reading means: a distance the sound travelled, and the time it took (in seconds)
const POINT = {
  field: (r) => ({ s: r.d, t: r.t }),
  echo: (r) => ({ s: 2 * r.d, t: r.T / 20 }),
  mics: (r) => ({ s: r.d, t: r.t / 1000 }),
};
const speedOf = (tab, r) => { const p = POINT[tab](r); return p.s / p.t; };

// ---------- Sound effects ----------

let audio = null;
function ensureAudio() {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch { audio = null; }
  return audio;
}
function bang(inSeconds, level) {
  if (!audio) return;
  const n = Math.round(audio.sampleRate * 0.09), buf = audio.createBuffer(1, n, audio.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.22));
  const s = audio.createBufferSource(), g = audio.createGain(), f = audio.createBiquadFilter();
  s.buffer = buf; g.gain.value = level; f.type = 'lowpass'; f.frequency.value = 2600;
  s.connect(f); f.connect(g); g.connect(audio.destination);
  s.start(audio.currentTime + Math.max(0, inSeconds));
}

// ---------- Across a field ----------

const field = { phase: 'idle', flashAt: 0, arriveAt: 0, heardAt: 0, d: 300, running: false, start: 0, shown: 0, msg: 'Press <b>Bang the blocks</b>, then watch the person on the left.' };
function showWatch(t) { $('sw').textContent = `${t.toFixed(2)} s`; }
function setWatchButton() { $('watch').textContent = field.running ? '⏹ Stop the stopwatch' : '⏱ Start the stopwatch'; }

$('fire').addEventListener('click', () => {
  if (field.phase === 'wait' || field.phase === 'travel') return;
  ensureAudio();
  Object.assign(field, { phase: 'wait', flashAt: performance.now() + 900 + Math.random() * 1700, running: false, d: PK.num('dist'), shown: 0 });
  showWatch(0); setWatchButton();
  field.msg = $('auto').checked ? 'Watch the blocks…' : 'Watch the blocks. Start the stopwatch the moment you <b>see</b> them hit.';
});

function pressWatch() {
  if ($('auto').checked) return;
  const at = performance.now();
  if (!field.running) {
    if (field.phase === 'idle') { PK.toast('Bang the blocks first'); return; }
    field.running = true; field.start = at; setWatchButton();
    if (field.phase === 'travel') field.msg = 'Stop the stopwatch the moment you <b>hear</b> the bang.';
    return;
  }
  field.running = false; setWatchButton();
  const t = (at - field.start) / 1000;
  showWatch(t);
  if (field.phase === 'wait') { field.phase = 'idle'; field.msg = 'You stopped before the blocks had banged. Try again.'; return; }
  addFieldRow(t);
}
function addFieldRow(t) {
  const real = field.d / V, reading = round2(t);
  state.rows.field.push({ d: field.d, t: reading });
  field.msg = `You timed <b>${reading.toFixed(2)} s</b>. The sound really took ${PK.ans(`${real.toFixed(2)} s`)}${$('auto').checked ? '.' : `, so reaction time made a difference of ${PK.ans(`${Math.abs(reading - real).toFixed(2)} s`)}.`}`;
  renderResults();
}
// Starting on pointer down is the fairest test of a reaction, and a keyboard press still works
$('watch').addEventListener('pointerdown', (e) => { e.preventDefault(); pressWatch(); });
$('watch').addEventListener('click', (e) => { if (e.detail === 0) pressWatch(); });

function stepField(now) {
  if (field.phase === 'wait' && now >= field.flashAt) {
    field.phase = 'travel'; field.arriveAt = field.flashAt + (field.d / V) * 1000;
    bang((field.arriveAt - now) / 1000, 0.55);
    if ($('auto').checked) { field.running = true; field.start = field.flashAt; }
    else if (field.running) field.msg = 'Stop the stopwatch the moment you <b>hear</b> the bang.';
    else field.msg = 'They’ve hit! Start the stopwatch, then stop it when you <b>hear</b> the bang.';
  }
  if (field.phase === 'travel' && now >= field.arriveAt) {
    field.phase = 'heard'; field.heardAt = now;
    if ($('auto').checked) { field.running = false; showWatch(field.d / V); addFieldRow(field.d / V); }
  }
  if (field.phase === 'heard') {
    if (field.running && now - field.heardAt > 3000) {
      field.running = false; setWatchButton(); showWatch(0); field.phase = 'idle';
      field.msg = 'Too slow: the bang was a while ago. Try again.';
    } else if (!field.running && now - field.heardAt > 900) field.phase = 'idle';
  }
  if (field.running) showWatch((now - field.start) / 1000);
}

// ---------- Echo off a wall ----------

const echoRun = { on: false, start: 0, next: 0, last: -1 };
const echoTime = () => (2 * PK.num('wall')) / V;
function setClapButton() { $('clap').textContent = echoRun.on ? '⏸ Stop clapping' : '▶ Start clapping'; }
$('clap').addEventListener('click', () => {
  ensureAudio();
  echoRun.on = !echoRun.on;
  if (echoRun.on) { echoRun.start = performance.now(); echoRun.next = 0; }
  setClapButton();
});
function stepEcho(now) {
  if (!echoRun.on) return;
  const gap = PK.num('gap') * 1000;
  // The gap can change while clapping, so claps are counted on from the last one
  if (now >= echoRun.start + echoRun.next * gap) {
    echoRun.start = now; echoRun.next = 1;
    echoRun.last = now;
    echoRun.claps = (echoRun.claps || []).filter((t) => now - t < 3000).concat(now);
    bang(0, 0.42); bang(echoTime(), 0.16);
  }
}
$('time20').addEventListener('click', () => {
  const gap = PK.num('gap'), off = Math.abs(gap - echoTime());
  if (off > 0.03) { PK.toast('Get your claps in step with the echo first'); return; }
  state.rows.echo.push({ d: PK.num('wall'), T: round2(20 * gap + (Math.random() - 0.5) * 0.12) });
  renderResults();
});
function echoStatus() {
  const diff = PK.num('gap') - echoTime();
  if (Math.abs(diff) < 0.0101) return '<b>In step:</b> each echo lands on your next clap. Now press <b>Time 20 claps</b>.';
  return diff > 0 ? 'The echo gets back <b>before</b> your next clap. Clap faster: make the time between claps shorter.' : 'You clap again <b>before</b> the echo gets back. Clap more slowly: make the time between claps longer.';
}

// ---------- Two microphones ----------

const micRun = { start: -1e9, on: false };
const MIC_L = 160, MIC_PX = 280, FIRST_MS = 1;   // the first pulse reaches microphone A this far along the trace
const micB = () => MIC_L + PK.num('mic-d') * MIC_PX;
const VIS = 620;   // how fast the pulse is drawn moving across the bench, px per second
$('mic-clap').addEventListener('click', () => {
  ensureAudio(); bang(0, 0.42);
  micRun.start = performance.now(); micRun.on = true; state.clapped = false; micDirty = true;
});
let micDirty = true;
function stepMics(now) {
  if (!micRun.on) return;
  const r = ((now - micRun.start) / 1000) * VIS;
  if (r > micB() - 70 + 30) { micRun.on = false; state.clapped = true; micDirty = true; }
}
$('mic-rec').addEventListener('click', () => {
  if (!state.clapped) { PK.toast('Clap first, so there are pulses to read'); return; }
  const t = Math.abs(state.cur[1] - state.cur[0]) * state.tdiv;
  if (t < 0.05) { PK.toast('Drag the two dashed lines onto the start of each pulse'); return; }
  const d = PK.num('mic-d'), row = { d, t: round2(t) };
  state.rows.mics.push(row);
  renderResults();
});

// ---------- Drawing ----------

const scene = $('scene'), c = scene.getContext('2d');
const W = 800, H = 300, GROUND = 200;
function label(text, x, y, opts = {}) {
  c.font = `${opts.w || 700} ${opts.s || 15}px ${font()}`; c.textAlign = opts.a || 'center'; c.textBaseline = opts.b || 'alphabetic';
  c.fillStyle = opts.col || PK.cssVar('--text'); c.fillText(text, x, y);
}
// A stick figure, the same style as on Background radiation
function figure(x, ground, armL, armR) {
  c.strokeStyle = '#20262e'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.arc(x, ground - 94, 11, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(x, ground - 83); c.lineTo(x, ground - 42);
  c.moveTo(x, ground - 42); c.lineTo(x - 11, ground); c.moveTo(x, ground - 42); c.lineTo(x + 11, ground);
  c.moveTo(x, ground - 74); c.lineTo(x + armL[0], ground - armL[1]); c.moveTo(x, ground - 74); c.lineTo(x + armR[0], ground - armR[1]);
  c.stroke(); c.lineCap = 'butt';
}
function outdoors(ground) {
  const sky = c.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, '#a8d8f5'); sky.addColorStop(1, '#e5f4fd');
  c.fillStyle = sky; c.fillRect(0, 0, W, ground);
  c.fillStyle = '#6fae55'; c.fillRect(0, ground, W, H - ground);
}
function arrowBetween(x1, x2, y, text) {
  c.strokeStyle = '#123'; c.fillStyle = '#123'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.stroke();
  for (const [x, dir] of [[x1, 1], [x2, -1]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 9 * dir, y - 5); c.lineTo(x + 9 * dir, y + 5); c.closePath(); c.fill(); }
  c.font = `800 16px ${font()}`;
  const w = c.measureText(text).width + 14, mid = (x1 + x2) / 2;
  c.fillStyle = '#fff'; c.fillRect(mid - w / 2, y - 12, w, 24);
  c.fillStyle = '#123'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, mid, y + 1);
}

// ----- Field -----
const F_X = 80, F_PX = 1.1, fieldX = (d) => F_X + d * F_PX;
function drawField(now) {
  outdoors(GROUND);
  const d = field.phase === 'idle' ? PK.num('dist') : field.d, x = fieldX(d);
  for (let m = 0; m <= 600; m += 100) {
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; const tx = fieldX(m);
    c.beginPath(); c.moveTo(tx, GROUND + 1); c.lineTo(tx, GROUND + 14); c.stroke();
    label(`${m} m`, tx, GROUND + 32, { s: 14, col: '#143' });
  }
  arrowBetween(F_X, x, GROUND + 62, `${d} m`);

  // The person with the blocks: arms up, then together at the flash
  const hit = field.phase === 'travel' || field.phase === 'heard';
  const since = hit ? now - field.flashAt : 1e9;
  const open = hit && since <= 200 ? 5 : 24;
  figure(F_X, GROUND, [open, 118], [-open, 118]);
  c.fillStyle = '#9b6a3c';
  c.fillRect(F_X + open - 5, GROUND - 133, 10, 26); c.fillRect(F_X - open - 5, GROUND - 133, 10, 26);
  if (hit && since < 160) {
    c.fillStyle = '#ffd400'; c.beginPath();
    for (let i = 0; i < 16; i++) { const r = i % 2 ? 12 : 34, a = (i * Math.PI) / 8; c[i ? 'lineTo' : 'moveTo'](F_X + Math.cos(a) * r, GROUND - 124 + Math.sin(a) * r); }
    c.closePath(); c.fill();
  }

  // The sound spreading out
  if (hit) {
    const reach = (V * (now - field.flashAt)) / 1000;
    c.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const m = reach - i * 16;
      if (m <= 0 || m > d + 60) continue;
      c.strokeStyle = `rgba(226, 75, 48, ${0.9 - i * 0.22})`;
      c.beginPath(); c.arc(F_X, GROUND - 124, m * F_PX, -0.75, 0.42); c.stroke();
    }
  }

  // The person with the stopwatch
  figure(x, GROUND, [-18, 56], [-22, 62]);
  c.fillStyle = '#d8dee8'; c.strokeStyle = '#20262e'; c.lineWidth = 2; c.beginPath(); c.arc(x - 25, GROUND - 64, 9, 0, Math.PI * 2); c.fill(); c.stroke();
  if (field.phase === 'heard' && now - field.heardAt < 700) {
    c.font = `900 22px ${font()}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const bx = clamp(x, 60, W - 60);
    c.fillStyle = '#fff'; c.strokeStyle = '#d0392b'; c.lineWidth = 3; c.beginPath(); c.roundRect(bx - 44, GROUND - 158, 88, 34, 10); c.fill(); c.stroke();
    c.fillStyle = '#d0392b'; c.fillText('BANG!', bx, GROUND - 140);
  }
  if (!state.moved.field && field.phase === 'idle') label('Drag this person to change the distance', clamp(x - 40, 180, W - 260), 26, { s: 16, w: 800, col: '#14324f' });
}

// ----- Echo -----
const E_G = 120, E_X = 90, E_PX = 3;
const wallX = (d) => E_X + d * E_PX;
function drawEcho(now) {
  outdoors(E_G);
  c.fillStyle = PK.cssVar('--surface'); c.fillRect(0, E_G + 18, W, H - E_G - 18);
  const d = PK.num('wall'), x = wallX(d);
  // Wall
  c.fillStyle = '#b5563f'; c.fillRect(x, 8, 34, E_G - 8);
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1;
  for (let y = 8; y < E_G; y += 12) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 34, y); c.stroke(); for (let bx = ((y / 12) % 2 ? 0 : 8); bx < 34; bx += 16) { c.beginPath(); c.moveTo(x + bx, y); c.lineTo(x + bx, y + 12); c.stroke(); } }
  // Person
  const justClapped = echoRun.on && now - echoRun.last < 90;
  figure(E_X, E_G, [justClapped ? 4 : 26, 80], [justClapped ? 7 : 22, 74]);
  arrowBetween(E_X + 4, x - 3, E_G + 9, `${d} m`);

  // Claps on their way there and back
  c.lineWidth = 3;
  for (const t of echoRun.claps || []) {
    const gone = (V * (now - t)) / 1000;
    if (gone < d) { c.strokeStyle = '#e24b30'; const px = E_X + gone * E_PX; c.beginPath(); c.arc(px - 20, E_G - 50, 26, -0.7, 0.7); c.stroke(); }
    else if (gone < 2 * d) { c.strokeStyle = '#f39c12'; const px = E_X + (2 * d - gone) * E_PX; c.beginPath(); c.arc(px + 20, E_G - 50, 26, Math.PI - 0.7, Math.PI + 0.7); c.stroke(); }
  }

  // Timeline: do the echoes land on the claps?
  const gap = PK.num('gap'), Te = echoTime(), span = 3.2, L = 110, R = W - 14, X = (t) => L + (t / span) * (R - L);
  const y1 = E_G + 56, y2 = E_G + 106, inStep = Math.abs(gap - Te) < 0.0101;
  label('Your claps', L - 8, y1 + 6, { a: 'right', s: 15 });
  label('Echoes', L - 8, y2 + 6, { a: 'right', s: 15 });
  c.strokeStyle = PK.cssVar('--grid'); c.lineWidth = 1;
  for (let t = 0; t <= span; t += 0.5) { c.beginPath(); c.moveTo(X(t), y1 - 20); c.lineTo(X(t), y2 + 20); c.stroke(); label(`${t} s`, X(t), H - 4, { s: 13, w: 600, col: PK.cssVar('--muted') }); }
  for (let n = 0; n * gap <= span; n++) {
    const t = n * gap;
    if (inStep && n) { c.strokeStyle = PK.cssVar('--good'); c.lineWidth = 4; c.beginPath(); c.moveTo(X(t), y1); c.lineTo(X(t), y2); c.stroke(); }
    c.strokeStyle = '#e24b30'; c.lineWidth = 5; c.beginPath(); c.moveTo(X(t), y1 - 14); c.lineTo(X(t), y1 + 14); c.stroke();
    const e = t + Te;
    if (e <= span) { c.strokeStyle = '#f39c12'; c.beginPath(); c.moveTo(X(e), y2 - 14); c.lineTo(X(e), y2 + 14); c.stroke(); }
  }
  if (!state.moved.echo) label('Drag the wall to change the distance', x > 430 ? x - 160 : x + 190, 60, { s: 16, w: 800, col: '#14324f' });
}

// ----- Microphones -----
const BENCH = 196;
function drawMic(x, name) {
  c.strokeStyle = '#20262e'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, BENCH); c.lineTo(x, BENCH - 74); c.stroke();
  c.fillStyle = '#4a5260'; c.fillRect(x - 16, BENCH - 3, 32, 7);
  c.fillStyle = '#4a5260'; c.beginPath(); c.roundRect(x - 11, BENCH - 106, 22, 36, 8); c.fill();
  c.strokeStyle = '#c3cad6'; c.lineWidth = 2;
  for (let y = BENCH - 100; y < BENCH - 76; y += 6) { c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 9, y); c.stroke(); }
  label(name, x, BENCH - 114, { s: 18, w: 800 });
}
function drawMics(now) {
  c.fillStyle = PK.cssVar('--surface-2'); c.fillRect(0, 0, W, H);
  c.fillStyle = '#b48a5a'; c.fillRect(0, BENCH, W, 16);
  c.fillStyle = '#8f6c44'; c.fillRect(0, BENCH + 16, W, H - BENCH - 16);
  const b = micB(), d = PK.num('mic-d');

  // Metre ruler
  c.fillStyle = '#f6e7a3'; c.fillRect(MIC_L, BENCH + 2, 560, 14);
  c.strokeStyle = '#333'; c.lineWidth = 1;
  for (let i = 0; i <= 20; i++) {
    const x = MIC_L + i * 0.1 * MIC_PX;
    c.beginPath(); c.moveTo(x, BENCH + 2); c.lineTo(x, BENCH + (i % 5 ? 9 : 15)); c.stroke();
  }
  [0, 0.5, 1, 1.5, 2].forEach((m) => label(`${m} m`, MIC_L + m * MIC_PX, BENCH + 36, { s: 14, col: '#fff' }));
  arrowBetween(MIC_L, b, BENCH + 66, `${d} m`);

  drawMic(MIC_L, 'A'); drawMic(b, 'B');

  // Hands clapping, in line with the two microphones
  const since = now - micRun.start, shut = since < 110;
  const hx = 70, hy = BENCH - 88;
  c.fillStyle = '#e8b08e';
  c.beginPath(); c.ellipse(hx - (shut ? 4 : 18), hy, 9, 20, 0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(hx + (shut ? 4 : 18), hy, 9, 20, -0.2, 0, Math.PI * 2); c.fill();

  if (micRun.on) {
    const r = (since / 1000) * VIS;
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      if (r - i * 16 <= 0) continue;
      c.strokeStyle = `rgba(226, 75, 48, ${0.9 - i * 0.25})`;
      c.beginPath(); c.arc(hx, hy, r - i * 16, -0.55, 0.55); c.stroke();
    }
  }
  if (!state.moved.mics) label('Drag microphone B to change the distance', clamp(b, 300, W - 260), 26, { s: 16, w: 800 });
}

// ----- Oscilloscope for the microphones -----
const cro = $('cro'), cc = cro.getContext('2d');
const CW = 800, CH = 420, GEO = { L: 40, T: 20, sq: 46, nx: 10, ny: 8 };
const WIDE = GEO.sq * GEO.nx, HIGH = GEO.sq * GEO.ny;
function ring(t) { return t < 0 ? 0 : Math.exp(-t / 0.8) * Math.sin(2 * Math.PI * 1.7 * t); }
function drawCro() {
  const k = cro.width / CW, { L, T, sq } = GEO;
  cc.setTransform(k, 0, 0, k, 0, 0);
  cc.fillStyle = Scope.CASE; cc.fillRect(0, 0, CW, CH);
  Scope.screen(cc, GEO);
  const rows = [[T + sq * 2, FIRST_MS, 'A', 1], [T + sq * 6, FIRST_MS + (PK.num('mic-d') / V) * 1000, 'B', 0.85]];
  for (const [y, arrive, name, size] of rows) {
    Scope.begin(cc, GEO, Scope.GREEN, 2.5);
    cc.beginPath();
    for (let px = 0; px <= WIDE; px += 0.6) {
      const t = (px / sq) * state.tdiv, v = state.clapped ? size * ring(t - arrive) : 0;
      const yy = y - v * sq * 1.7;
      if (px) cc.lineTo(L + px, yy); else cc.moveTo(L + px, yy);
    }
    cc.stroke();
    Scope.end(cc);
    cc.fillStyle = Scope.LABEL; cc.font = `800 18px ${font()}`; cc.textAlign = 'right'; cc.textBaseline = 'middle';
    cc.fillText(name, L - 10, y);
  }
  // The two dashed lines
  state.cur.forEach((c0, i) => {
    const x = L + c0 * sq;
    cc.strokeStyle = Scope.AMBER; cc.lineWidth = 2; cc.setLineDash([7, 6]);
    cc.beginPath(); cc.moveTo(x, T); cc.lineTo(x, T + HIGH); cc.stroke(); cc.setLineDash([]);
    cc.fillStyle = Scope.AMBER; cc.beginPath(); cc.arc(x, T + HIGH, 9, 0, Math.PI * 2); cc.fill();
    cc.fillStyle = Scope.GLASS; cc.font = `800 13px ${font()}`; cc.textAlign = 'center'; cc.textBaseline = 'middle'; cc.fillText(i + 1, x, T + HIGH + 0.5);
  });

  const x = L + WIDE + 24, squares = Math.abs(state.cur[1] - state.cur[0]);
  cc.fillStyle = Scope.LABEL; cc.textAlign = 'left'; cc.textBaseline = 'top';
  cc.font = `700 14px ${font()}`; cc.fillText('Time-base', x, T + 10);
  cc.font = `800 20px ${font()}`; cc.fillText(`${state.tdiv} ms / square`, x, T + 30);
  cc.font = `700 14px ${font()}`; cc.fillText('Between the lines', x, T + 80);
  cc.font = `800 20px ${font()}`; cc.fillText(`${squares.toFixed(2)} squares`, x, T + 100);
  cc.fillText(`= ${(squares * state.tdiv).toFixed(2)} ms`, x, T + 128);
  cc.font = `600 15px ${font()}`;
  (state.clapped ? ['Drag the dashed lines', 'onto the start of each', 'pulse, then record it.'] : ['Press Clap to see the', 'pulses arrive.']).forEach((l, i) => cc.fillText(l, x, T + 186 + i * 21));
}

function drawScene(now) {
  const k = scene.width / W;
  c.setTransform(k, 0, 0, k, 0, 0);
  if (state.tab === 'field') drawField(now); else if (state.tab === 'echo') drawEcho(now); else drawMics(now);
}

// ---------- Results ----------

const graph = $('graph'), g = graph.getContext('2d');
function niceTop(x) { const p = 10 ** Math.floor(Math.log10(x)); const n = x / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function drawGraph() {
  const GW = 270, GH = 220, k = graph.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const col = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent'), line: PK.cssVar('--accent') };
  const f = font();
  g.fillStyle = col.surface; g.fillRect(0, 0, GW, GH);
  const pts = state.rows[state.tab].map(POINT[state.tab]), inMs = state.tab === 'mics';
  const L = 46, R = 12, T = 12, B = 38, pw = GW - L - R, ph = GH - T - B;
  const tMax = niceTop(Math.max(inMs ? 0.002 : 0.5, ...pts.map((p) => p.t))), sMax = niceTop(Math.max(inMs ? 1 : 100, ...pts.map((p) => p.s)));
  const X = (t) => L + (t / tMax) * pw, Y = (s) => T + ph - (s / sMax) * ph;
  g.strokeStyle = col.grid; g.lineWidth = 1; g.fillStyle = col.muted; g.font = `600 13px ${f}`;
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let i = 0; i <= 5; i++) { const t = (tMax * i) / 5; g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), T + ph); g.stroke(); g.fillText(inMs ? sig(t * 1000, 2) : sig(t, 2), X(t), T + ph + 4); }
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= 5; i++) { const s = (sMax * i) / 5; g.beginPath(); g.moveTo(L, Y(s)); g.lineTo(L + pw, Y(s)); g.stroke(); g.fillText(sig(s, 2), L - 4, Y(s)); }
  g.strokeStyle = col.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = col.text; g.font = `700 13px ${f}`; g.textAlign = 'center'; g.textBaseline = 'bottom';
  g.fillText(inMs ? 'time / ms' : 'time / s', L + pw / 2, GH - 2);
  g.save(); g.translate(11, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('distance / m', 0, 0); g.restore();
  if (pts.length >= 2 && PK.answersShown()) {
    const m = pts.reduce((a, p) => a + p.t * p.s, 0) / pts.reduce((a, p) => a + p.t * p.t, 0);
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    g.strokeStyle = col.line; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(tMax), Y(m * tMax)); g.stroke(); g.restore();
  }
  g.strokeStyle = col.point; g.lineWidth = 2;
  for (const p of pts) { const x = X(p.t), y = Y(p.s); g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x - 4, y + 4); g.lineTo(x + 4, y - 4); g.stroke(); }
}

const HEADS = {
  field: ['Distance (m)', 'Time (s)'],
  echo: ['To the wall (m)', 'Time for 20 claps (s)'],
  mics: ['Between mics (m)', 'Time (ms)'],
};
function renderResults() {
  const tab = state.tab, rows = state.rows[tab], [h1, h2] = HEADS[tab];
  const a = (r) => (tab === 'echo' ? r.T.toFixed(2) : r.t.toFixed(2));
  $('table').innerHTML = rows.length
    ? `<table class="results"><thead><tr><th>${h1}</th><th>${h2}</th><th>Speed (m/s)</th><th><span class="sr-only">Delete</span></th></tr></thead>
      <tbody>${rows.map((r, n) => `<tr><td>${r.d}</td><td>${a(r)}</td><td class="n">${PK.ans(Math.round(speedOf(tab, r)))}</td><td><button class="del" data-row="${n}" aria-label="Delete reading ${n + 1}">✕</button></td></tr>`).join('')}</tbody></table>`
    : '<p class="note">No readings yet.</p>';
  if (rows.length) {
    const speeds = rows.map((r) => speedOf(tab, r)), mean = speeds.reduce((x, y) => x + y, 0) / speeds.length;
    $('mean').innerHTML = `Mean speed: ${PK.ans(`${Math.round(mean)} m/s`)}`;
  } else $('mean').textContent = '';
  const pts = rows.map(POINT[tab]);
  $('grad').innerHTML = pts.length >= 2
    ? `The gradient of the line is the speed: ${PK.ans(`${Math.round(pts.reduce((x, p) => x + p.t * p.s, 0) / pts.reduce((x, p) => x + p.t * p.t, 0))} m/s`)}`
    : tab === 'echo' ? 'In the time between claps, the sound goes to the wall and back, so the graph uses twice the distance to the wall.' : 'Take readings at different distances to draw the line.';
  drawGraph();
  renderCompare();
}
const NAMES = { field: 'Across a field', echo: 'Echo off a wall', mics: 'Two microphones' };
function renderCompare() {
  const used = Object.keys(NAMES).filter((t) => state.rows[t].length);
  if (!used.length) { $('compare').innerHTML = '<p class="note" style="margin-top:0">Take readings with each method to compare them here.</p>'; return; }
  $('compare').innerHTML = `<table class="results" style="margin-top:0"><thead><tr><th>Method</th><th>Readings</th><th>Mean speed (m/s)</th><th>Lowest to highest (m/s)</th></tr></thead><tbody>${used.map((t) => {
    const v = state.rows[t].map((r) => speedOf(t, r)), mean = v.reduce((x, y) => x + y, 0) / v.length;
    return `<tr><td>${NAMES[t]}</td><td>${v.length}</td><td class="n">${PK.ans(Math.round(mean))}</td><td>${PK.ans(`${Math.round(Math.min(...v))} to ${Math.round(Math.max(...v))}`)}</td></tr>`;
  }).join('')}</tbody></table><p class="note hide-when-no-answers">The narrower the range, the more precise the method. Timing by hand adds your reaction time, of around 0.2 s, to every reading.</p>`;
}

const HOW = {
  field: `<ol>
    <li>Measure a long distance across a field with a trundle wheel or long tape. At least 100 m is best.</li>
    <li>One person bangs two wooden blocks together, high up where they can be seen.</li>
    <li>The other starts a stopwatch when they <b>see</b> the blocks hit, and stops it when they <b>hear</b> the bang. Light arrives almost instantly, so the time on the stopwatch is the time the sound took.</li>
    <li>Repeat several times and work out a mean time.</li>
    <li>Speed = distance ÷ time.</li>
    </ol>
    <p class="note">Your reaction time causes the biggest error. A longer distance makes the time longer, so the same reaction time matters less.</p>`,
  echo: `<ol>
    <li>Stand at least 50 m from a large flat wall and measure the distance.</li>
    <li>Clap, and listen for the echo. Change how fast you clap until each clap lands on the echo of the one before.</li>
    <li>A partner times 20 of the gaps between claps, and divides by 20 to find the time for one.</li>
    <li>In that time the sound goes to the wall and back, so the distance is <b>2 × the distance to the wall</b>.</li>
    <li>Speed = distance ÷ time.</li>
    </ol>
    <p class="note">Timing 20 claps spreads your reaction time over many claps, so it matters much less.</p>`,
  mics: `<ol>
    <li>Set up two microphones in line with where the sound will be made, and measure the distance between them.</li>
    <li>Connect them to an oscilloscope or data logger.</li>
    <li>Make a sharp sound, such as a clap, beyond the first microphone.</li>
    <li>Read the time between the start of the two pulses, using the time-base.</li>
    <li>Speed = distance between the microphones ÷ time. Repeat with different distances.</li>
    </ol>
    <p class="note">The time is measured by the equipment, not by a person, so there’s no reaction time and the result is more precise.</p>`,
};

// ---------- Tabs and controls ----------

function showTab(t) {
  state.tab = t;
  if (t !== 'echo' && echoRun.on) { echoRun.on = false; setClapButton(); }
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('how').innerHTML = HOW[t];
  if (t === 'mics') { sizeAll(); micDirty = true; }
  renderResults();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
$('clear').addEventListener('click', () => { state.rows[state.tab] = []; renderResults(); });
$('table').addEventListener('click', (e) => { const b = e.target.closest('.del'); if (b) { state.rows[state.tab].splice(Number(b.dataset.row), 1); renderResults(); } });
$('tdiv').addEventListener('change', (e) => { state.tdiv = Number(e.target.value); micDirty = true; });
$('mic-d').addEventListener('input', () => { state.clapped = false; micDirty = true; });
$('auto').addEventListener('change', (e) => {
  if (field.phase === 'idle') $('watch').disabled = e.target.checked; else e.target.checked = !e.target.checked;
});

PK.dragOn(scene, W, H, {
  hit: (p) => {
    if (state.tab === 'field') {
      if (field.phase !== 'idle') return null;
      const x = fieldX(PK.num('dist')); return Math.abs(p.x - x) < 44 && p.y < GROUND + 16 ? {} : null;
    }
    if (state.tab === 'echo') { const x = wallX(PK.num('wall')); return p.x > x - 24 && p.x < x + 58 && p.y < E_G + 4 ? {} : null; }
    const x = micB(); return !micRun.on && Math.abs(p.x - x) < 40 && p.y < BENCH + 8 && p.y > BENCH - 130 ? {} : null;
  },
  move: (d, p) => {
    state.moved[state.tab] = true;
    if (state.tab === 'field') PK.setNum('dist', Math.round(clamp((p.x - F_X) / F_PX, 50, 600) / 10) * 10);
    else if (state.tab === 'echo') PK.setNum('wall', Math.round(clamp((p.x - E_X) / E_PX, 20, 200) / 5) * 5);
    else { PK.setNum('mic-d', Math.round(clamp((p.x - MIC_L) / MIC_PX, 0.2, 2) * 20) / 20); state.clapped = false; micDirty = true; }
  },
});
PK.dragOn(cro, CW, CH, {
  hit: (p) => {
    if (p.y < GEO.T - 10 || p.y > GEO.T + HIGH + 14) return null;
    const gaps = state.cur.map((s) => Math.abs(GEO.L + s * GEO.sq - p.x)), i = gaps[0] <= gaps[1] ? 0 : 1;
    return gaps[i] < 30 ? { i } : null;
  },
  move: (d, p) => { state.cur[d.i] = clamp((p.x - GEO.L) / GEO.sq, 0, GEO.nx); micDirty = true; },
});

// ---------- Start ----------

function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (H / W) * dpr);
  graph.width = Math.round(graph.clientWidth * dpr); graph.height = Math.round(graph.clientWidth * (220 / 270) * dpr);
  if (cro.clientWidth) { cro.width = Math.round(cro.clientWidth * dpr); cro.height = Math.round(cro.clientWidth * (CH / CW) * dpr); }
  micDirty = true;
}
let lastStatus = '';
function setStatus(html) { if (html !== lastStatus) { lastStatus = html; $('status').innerHTML = html; } }
function statusNow() {
  if (state.tab === 'field') return field.msg;
  if (state.tab === 'echo') return echoStatus();
  return state.clapped ? 'Read the time between the start of the two pulses. The dashed lines measure it for you.' : 'Press <b>Clap</b>. The sound reaches microphone A first, and then microphone B.';
}
function frame(now) {
  stepField(now);
  stepEcho(now);
  stepMics(now);
  drawScene(now);
  if (state.tab === 'mics' && (micDirty || micRun.on)) { drawCro(); micDirty = false; }
  setStatus(statusNow());
  requestAnimationFrame(frame);
}
window.addEventListener('resize', () => { sizeAll(); drawGraph(); });
window.addEventListener('pk-theme', () => { micDirty = true; drawGraph(); });
window.addEventListener('pk-answers', drawGraph);
sizeAll();
showTab('field');
requestAnimationFrame(frame);

// Share: the readings and the dashed lines (the tab, number boxes and tick box are shared anyway)
PK.shareState = {
  get: () => ({ r: state.rows, c: state.cur.map((x) => Number(x.toFixed(3))), k: state.clapped ? 1 : 0 }),
  set: (o) => {
    const num = (r, keys) => Object.fromEntries(keys.map((k) => [k, Number(r[k])]));
    if (o.r) {
      if (Array.isArray(o.r.field)) state.rows.field = o.r.field.map((r) => num(r, ['d', 't']));
      if (Array.isArray(o.r.echo)) state.rows.echo = o.r.echo.map((r) => num(r, ['d', 'T']));
      if (Array.isArray(o.r.mics)) state.rows.mics = o.r.mics.map((r) => num(r, ['d', 't']));
    }
    if (Array.isArray(o.c)) state.cur = [clamp(Number(o.c[0]) || 0, 0, 10), clamp(Number(o.c[1]) || 0, 0, 10)];
    state.clapped = Boolean(o.k); state.tdiv = Number($('tdiv').value);
    for (const k of Object.keys(state.moved)) state.moved[k] = true;
    micDirty = true;
    renderResults();
  },
};
