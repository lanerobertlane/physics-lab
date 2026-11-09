// Reaction time: brake when the car in front does (with or without a distraction), or catch a
// falling ruler. Every time on this page comes from the student's own tap.

PK.header({
  title: 'Reaction time test',
  answers: true,
  spec: [
    { code: '4.5.6.3.2', text: 'Reaction times vary from person to person. Typical values range from 0.2 s to 0.9 s' },
    { code: '4.5.6.3.2', text: 'A driver’s reaction time can be affected by tiredness, drugs and alcohol. Distractions may also affect a driver’s ability to react' },
    { code: '4.5.6.3.2', text: 'Explain methods used to measure human reaction times, and interpret and evaluate the results' },
    { code: '4.5.6.3.2', text: 'Evaluate the effect of various factors on thinking distance' },
    { code: 'KS3', text: 'Speed = distance ÷ time' },
    { code: 'KS3', text: 'Working scientifically: repeat readings, work out a mean and spot anomalies' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const G = 9.8, MAX = 10, TARGET = 5;   // the most readings in a column, and how many to suggest
const CONDS = ['No distraction', 'Doing sums', 'Phone messages'];
const SHORT = ['None', 'Sums', 'Phone'];
const state = { tab: 'brake', cond: 0, rows: [[], [], []], ruler: [] };

const mean = (list) => list.reduce((a, b) => a + b, 0) / list.length;
const meanOf = (rows) => { const k = rows.filter((r) => !r.off); return k.length ? mean(k.map((r) => r.t)) : null; };
const timeFor = (cm) => Math.sqrt((2 * cm) / 100 / G);   // s = ½ g t², for a ruler dropped from rest
const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// The time of a tap. Events carry the moment they really happened, which is fairer than the
// moment the page got round to handling them.
function eventTime(e) {
  const now = performance.now();
  return e && e.timeStamp > 0 && Math.abs(now - e.timeStamp) < 500 ? e.timeStamp : now;
}
// A press counts on pointer down, and the keyboard still works. The short gap stops one press counting twice.
let lastPress = -1e9;
function press(fn, e) {
  const now = performance.now();
  if (now - lastPress < 140) return;
  lastPress = now;
  fn(eventTime(e));
}
function pressable(el, fn) {
  el.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); press(fn, e); });
  el.addEventListener('click', (e) => { if (e.detail === 0) press(fn, e); });
}

// ---------- The brake test ----------

const run = { phase: 'idle', lightAt: 0, litAt: 0, endAt: 0, result: 0, task: null, answered: 0, scroll: 0, msg: '', side: rand(2) };
const driving = () => run.phase === 'wait' || run.phase === 'lit';
const IDLE_MSG = 'Press <b>Start driving</b>. The moment the brake lights on the car in front come on, tap <b>BRAKE</b> or anywhere on the picture.';

// The names take turns between girls' and boys', so a run of messages always has both
const NAMES = [['Emily', 'Priya', 'Zara', 'Grace', 'Amelia'], ['Tom', 'Ali', 'Jack', 'Kai', 'Oscar']];
const ASKS = ['Send me a', 'Can you send a', 'Quick, send me a', 'Reply with a'];
const EMOJI = ['🍕', '🐶', '⚽', '🎉', '🍔', '🐱', '🎧', '🚲', '🌈', '🍩'];
function nextTask() {
  if (state.cond === 1) {
    const a = 6 + rand(14), b = 3 + rand(7), right = a + b, opts = new Set([right]);
    while (opts.size < 3) opts.add(right + (1 + rand(4)) * (rand(2) ? 1 : -1));
    run.task = { q: `${a} + ${b} =`, right: String(right), opts: shuffle([...opts].map(String)) };
  } else if (state.cond === 2) {
    const pick = shuffle([...EMOJI]).slice(0, 3), names = NAMES[run.side = 1 - run.side], who = names[rand(names.length)];
    run.task = { who, q: `<div class="msg-name">${who}</div><div class="bubble">${ASKS[rand(ASKS.length)]} ${pick[0]}</div>`, right: pick[0], opts: shuffle(pick) };
  } else run.task = null;
  renderTask();
}
function renderTask() {
  const el = $('task');
  el.classList.toggle('two-rows', Boolean(state.cond));
  if (!state.cond) { el.innerHTML = '<p class="task-note">Keep your eyes on the car in front.</p>'; return; }
  if (!driving() || !run.task) {
    el.innerHTML = `<p class="task-note">While you drive, ${state.cond === 1 ? 'answer the sums' : 'reply to the messages'} <b>and</b> watch the car in front.</p>`;
    return;
  }
  const phone = Boolean(run.task.who);
  el.innerHTML = `<div class="task-q">${run.task.q}</div><div class="task-opts${phone ? ' replies' : ''}">${run.task.opts.map((o) => `<button type="button" class="${phone ? 'reply' : 'btn'}" data-a="${o}">${o}</button>`).join('')}</div>`;
}
$('task').addEventListener('pointerdown', (e) => {
  const b = e.target.closest('[data-a]');
  if (!b || !driving()) return;
  e.preventDefault();
  if (b.dataset.a === run.task.right) run.answered++;
  nextTask();
});

function setBrake() {
  const b = $('brake');
  b.textContent = driving() ? '🛑 BRAKE' : run.phase === 'idle' ? '▶ Start driving' : '▶ Go again';
  b.classList.toggle('stop', driving());
  b.classList.toggle('primary', !driving());
}
function startDriving() {
  if (state.rows[state.cond].length >= MAX) { PK.toast('That column is full. Choose another test or clear the table.'); return; }
  const extra = state.cond ? 3000 : 1800;   // a distraction needs long enough to get going
  Object.assign(run, { phase: 'wait', lightAt: performance.now() + extra + Math.random() * 3700, litAt: 0, answered: 0, msg: state.cond ? 'Keep answering, and keep watching the car in front…' : 'Watch the car in front…' });
  nextTask(); setBrake();
}
function stopRun(phase, msg) {
  run.phase = phase; run.endAt = performance.now(); run.msg = msg;
  run.task = null; renderTask(); setBrake();
}
function pressBrake(at) {
  if (run.phase === 'wait') { stopRun('early', '<b>Too soon!</b> The brake lights hadn’t come on, so that try doesn’t count.'); return; }
  if (run.phase !== 'lit') { startDriving(); return; }
  const t = (at - run.litAt) / 1000;
  if (t < 0.1) { stopRun('early', '<b>Too soon!</b> Nobody reacts in under 0.1 s, so that was a guess and doesn’t count.'); return; }
  if (state.cond && !run.answered) { stopRun('early', 'You didn’t answer any of the questions, so that wasn’t a test of being distracted. Try again, and answer them as you drive.'); return; }
  const v = Math.round(t * 100) / 100, c = state.cond;
  state.rows[c].push({ t: v, off: false });
  run.result = v;
  const n = state.rows[c].length, todo = state.rows.findIndex((col) => col.length < TARGET);
  const next = n < TARGET ? `That’s ${n} of ${TARGET} for ${CONDS[c].toLowerCase()}.`
    : todo >= 0 ? `That’s enough for this column. Now try <b>${CONDS[todo].toLowerCase()}</b>.` : 'You’ve filled all three columns. Compare the means.';
  stopRun('done', `Your reaction time was <b>${v.toFixed(2)} s</b>. ${next}`);
  renderResults();
}
function stepDrive(now) {
  if (run.phase === 'wait' && now >= run.lightAt) { run.phase = 'lit'; run.litAt = performance.now(); }
  else if (run.phase === 'lit' && now - run.litAt > 3000) stopRun('slow', '<b>Too slow!</b> That try doesn’t count. Press <b>Go again</b>.');
}

pressable($('brake'), pressBrake);
// Tapping the picture brakes, but it can't start a run, so scrolling past it does no harm
$('scene').addEventListener('pointerdown', (e) => { if (driving()) press(pressBrake, e); });
PK.chips('cond', (v) => {
  state.cond = v;
  if (driving()) { run.phase = 'idle'; run.task = null; setBrake(); }
  run.msg = '';
  renderTask();
});

// ----- The view through the windscreen -----

const scene = $('scene'), c = scene.getContext('2d');
const W = 800, H = 340, HOR = 128;
function poly(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.closePath(); ctx.fill(); }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }

function drawCar(scale, lit) {
  c.save();
  c.translate(400, 268); c.scale(scale, scale);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 8, 128, 12, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1c1f24'; rrect(c, -104, -18, 38, 30, 5); rrect(c, 66, -18, 38, 30, 5);
  c.fillStyle = '#2b529a'; poly(c, [[-86, -70], [-62, -124], [62, -124], [86, -70]]);
  c.fillStyle = '#c4dcec'; poly(c, [[-72, -76], [-54, -116], [54, -116], [72, -76]]);
  c.fillStyle = '#3563b5'; rrect(c, -114, -76, 228, 68, 14);
  c.fillStyle = '#ffd83a'; c.fillRect(-40, -44, 80, 20);
  c.fillStyle = '#111'; c.font = `800 15px ${font()}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('R3 ACT', 0, -33);
  // The brake lights
  const glass = lit ? '#ff2a2a' : '#6e2020';
  for (const x of [-79, 79]) {
    if (lit) {
      const g = c.createRadialGradient(x, -56, 6, x, -56, 74);
      g.addColorStop(0, 'rgba(255, 60, 40, .95)'); g.addColorStop(1, 'rgba(255, 60, 40, 0)');
      c.fillStyle = g; c.fillRect(x - 74, -130, 148, 148);
    }
    c.fillStyle = glass; rrect(c, x - 26, -66, 52, 20, 5);
  }
  c.fillStyle = glass; rrect(c, -30, -128, 60, 6, 3);
  c.restore();
}
function banner(big, small, col) {
  c.fillStyle = 'rgba(255,255,255,.94)'; c.strokeStyle = col; c.lineWidth = 3;
  c.beginPath(); c.roundRect(280, 12, 240, 76, 12); c.fill(); c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = col; c.font = `900 34px ${font()}`; c.fillText(big, 400, 40);
  c.fillStyle = '#333'; c.font = `700 15px ${font()}`; c.fillText(small, 400, 72);
}
function drawRoad(now, dt) {
  c.setTransform(scene.width / W, 0, 0, scene.width / W, 0, 0);
  const sky = c.createLinearGradient(0, 0, 0, HOR);
  sky.addColorStop(0, '#8fcdf2'); sky.addColorStop(1, '#e2f2fb');
  c.fillStyle = sky; c.fillRect(0, 0, W, HOR);
  c.fillStyle = '#7fb765'; c.fillRect(0, HOR, W, H - HOR);
  c.fillStyle = '#565c66'; poly(c, [[368, HOR], [432, HOR], [800, H], [0, H]]);
  c.fillStyle = '#eef0f3'; poly(c, [[368, HOR], [371, HOR], [22, H], [0, H]]); poly(c, [[429, HOR], [432, HOR], [800, H], [778, H]]);

  if (driving()) run.scroll = (run.scroll + dt * 1.6) % 1;
  for (let i = 0; i < 8; i++) {
    const s = (i + run.scroll) / 8, a = s * s, y = HOR + (H - HOR) * a;
    c.fillStyle = '#f5f6f8'; c.fillRect(400 - (1 + 7 * a), y, 2 + 14 * a, 6 + 52 * a);
    for (const side of [-1, 1]) {   // posts at the side of the road
      c.fillStyle = '#dfe3e8'; c.fillRect(400 + side * (46 + 470 * a) - (1 + 3 * a), y - (6 + 54 * a), 2 + 6 * a, 6 + 54 * a);
      c.fillStyle = '#d0392b'; c.fillRect(400 + side * (46 + 470 * a) - (1 + 3 * a), y - (6 + 54 * a), 2 + 6 * a, 2 + 12 * a);
    }
  }

  const lit = run.phase === 'lit' || run.phase === 'done' || run.phase === 'slow';
  const since = lit ? (run.phase === 'lit' ? now : run.endAt) - run.litAt : 0;
  drawCar(1 + 0.3 * Math.min(1, Math.max(0, since) / 900), lit);

  if (run.phase === 'done') banner(`${run.result.toFixed(2)} s`, 'Your reaction time', '#14632f');
  else if (run.phase === 'early') banner('Too soon!', 'That try doesn’t count', '#c62828');
  else if (run.phase === 'slow') banner('Too slow!', 'That try doesn’t count', '#c62828');
}

// ---------- The ruler drop ----------

const rule = { phase: 'idle', dropAt: 0, fellAt: 0, d: 0, t: 0, msg: '' };
const RULER_IDLE = 'Press <b>Get ready</b> and watch the ruler. When it starts to fall, tap <b>CATCH</b> or anywhere on the picture.';
const falling = () => rule.phase === 'wait' || rule.phase === 'fall';
function setCatch() {
  const b = $('catch');
  b.textContent = falling() ? '✊ CATCH' : rule.phase === 'idle' ? '▶ Get ready' : '▶ Go again';
  b.classList.toggle('stop', falling());
  b.classList.toggle('primary', !falling());
}
function endRule(phase, msg) { rule.phase = phase; rule.msg = msg; setCatch(); }
function pressCatch(at) {
  if (rule.phase === 'wait') { endRule('early', '<b>Too soon!</b> The ruler hadn’t been dropped, so that try doesn’t count.'); return; }
  if (rule.phase !== 'fall') {
    if (state.ruler.length >= MAX) { PK.toast('The table is full. Clear it to carry on.'); return; }
    Object.assign(rule, { phase: 'wait', dropAt: performance.now() + 1000 + Math.random() * 3000, fellAt: 0, d: 0, t: 0, msg: 'Watch the ruler…' });
    setCatch();
    return;
  }
  const t = (at - rule.fellAt) / 1000;
  if (t < 0.1) { endRule('early', '<b>Too soon!</b> Nobody reacts in under 0.1 s, so that was a guess and doesn’t count.'); return; }
  const fell = Math.min(100, 0.5 * G * t * t * 100);
  rule.d = Math.round(fell * 2) / 2;   // read from the ruler to the nearest half a centimetre
  rule.t = timeFor(rule.d);
  addRuler(rule.d);
  endRule('done', `Your reaction time was <b>${rule.t.toFixed(2)} s</b>. Read how far the ruler fell at the red line: ${PK.ans(`${rule.d} cm`)}.`);
}
function addRuler(d, own = false) { state.ruler.push({ d, t: Math.round(timeFor(d) * 100) / 100, off: false, own }); renderResults(); }
function stepRule(now) {
  if (rule.phase === 'wait' && now >= rule.dropAt) { rule.phase = 'fall'; rule.fellAt = performance.now(); rule.msg = 'Catch it!'; setCatch(); }
  else if (rule.phase === 'fall') {
    const t = (now - rule.fellAt) / 1000;
    if (0.5 * G * t * t * 100 >= 100) endRule('missed', '<b>Missed!</b> It fell right through your fingers. That try doesn’t count.');
  }
}
pressable($('catch'), pressCatch);
$('rule').addEventListener('pointerdown', (e) => { if (falling()) press(pressCatch, e); });

const rc = $('rule'), r = rc.getContext('2d');
const RW = 800, RH = 440, RX = 120, RHALF = 27, Y0 = 376, PX = 3.4;
const SKIN = '#e8b08e', WOOD = '#f6e7a3', RED = '#d0392b';
function rtext(s, x, y, o = {}) {
  r.font = `${o.w || 700} ${o.s || 14}px ${font()}`; r.textAlign = o.a || 'center'; r.textBaseline = o.b || 'middle';
  r.fillStyle = o.col || PK.cssVar('--text'); r.fillText(s, x, y);
}
// A hand seen from the front: the fingers go behind the ruler and the thumb comes across in
// front of it. y is the top edge of the thumb, which is where the ruler is read.
const PALM = RX - RHALF - 30;
function limb(x1, y1, x2, y2, w) { r.strokeStyle = SKIN; r.lineWidth = w; r.lineCap = 'round'; r.beginPath(); r.moveTo(x1, y1); r.lineTo(x2, y2); r.stroke(); r.lineCap = 'butt'; }
function handBack(y, fromAbove) {
  limb(-30, y + 14 + (fromAbove ? -60 : 70), PALM, y + 14, 46);
  limb(PALM, y + 14, RX + RHALF + 12, y + 14, 20);
}
function thumb(y, shut) { limb(PALM, y + 14, shut ? RX + 4 : RX - RHALF - 16, y + 14, 27); }
function drawRuler(now) {
  const d = rule.phase === 'fall' ? Math.min(100, 0.5 * G * ((now - rule.fellAt) / 1000) ** 2 * 100) : rule.phase === 'done' ? rule.d : rule.phase === 'missed' ? 100 : 0;
  const y = (cm) => Y0 - cm * PX + d * PX, TOP = 18;
  handBack(TOP, true); handBack(Y0, false);
  if (rule.phase !== 'missed') {
    r.fillStyle = WOOD; r.fillRect(RX - RHALF, y(100), RHALF * 2, 100 * PX);
    r.strokeStyle = '#8f7a35'; r.lineWidth = 1; r.strokeRect(RX - RHALF, y(100), RHALF * 2, 100 * PX);
    r.strokeStyle = '#333';
    for (let cm = 0; cm <= 100; cm++) {
      const len = cm % 10 ? (cm % 5 ? 6 : 11) : 18;
      r.beginPath(); r.moveTo(RX - RHALF, y(cm)); r.lineTo(RX - RHALF + len, y(cm)); r.stroke();
      if (cm % 10 === 0) rtext(String(cm), RX + 8, y(cm), { s: 15, col: '#222' });
    }
  }
  const dropped = rule.phase === 'fall' || rule.phase === 'done' || rule.phase === 'missed';
  thumb(TOP, !dropped);
  thumb(Y0, rule.phase === 'done');
  if (rule.phase === 'done') { r.strokeStyle = RED; r.lineWidth = 2; r.beginPath(); r.moveTo(RX - RHALF - 14, Y0); r.lineTo(RX + RHALF + 14, Y0); r.stroke(); }
}
function drawZoom() {
  const X = 216, Wd = 136, T = 52, B = 372, MID = (T + B) / 2, Z = 18;
  rtext('Zoomed in', X + Wd / 2, T - 16, { s: 15, w: 800 });
  r.fillStyle = PK.cssVar('--surface'); r.fillRect(X, T, Wd, B - T);
  r.save(); r.beginPath(); r.rect(X, T, Wd, B - T); r.clip();
  if (rule.phase === 'done') {
    const y = (cm) => MID - (cm - rule.d) * Z;
    r.fillStyle = WOOD; r.fillRect(X, y(100), Wd, 100 * Z);
    r.strokeStyle = '#333'; r.lineWidth = 1.2;
    const lo = Math.max(0, Math.floor(rule.d - 10)), hi = Math.min(100, Math.ceil(rule.d + 10));
    for (let i = lo * 2; i <= hi * 2; i++) {
      const cm = i / 2, whole = Number.isInteger(cm);
      r.beginPath(); r.moveTo(X, y(cm)); r.lineTo(X + (whole ? 26 : 13), y(cm)); r.stroke();
      if (whole) rtext(String(cm), X + 46, y(cm), { s: 14, col: '#222' });
    }
    r.strokeStyle = RED; r.lineWidth = 2.5; r.beginPath(); r.moveTo(X, MID); r.lineTo(X + Wd, MID); r.stroke();
  } else {
    rtext('Catch the', X + Wd / 2, MID - 10, { s: 15, col: PK.cssVar('--muted') });
    rtext('ruler first', X + Wd / 2, MID + 10, { s: 15, col: PK.cssVar('--muted') });
  }
  r.restore();
  r.strokeStyle = PK.cssVar('--border-strong'); r.lineWidth = 2; r.strokeRect(X, T, Wd, B - T);
  if (rule.phase === 'done') rtext('Read it at the red line', X + Wd / 2, B + 18, { s: 13, col: RED });
}
function drawConversion() {
  const L = 432, R = 784, T = 36, B = 388;
  const X = (cm) => L + (cm / 100) * (R - L), Y = (t) => B - (t / 0.5) * (B - T);
  const grid = PK.cssVar('--grid'), muted = PK.cssVar('--muted'), text = PK.cssVar('--text'), line = PK.cssVar('--accent');
  rtext('Conversion graph', (L + R) / 2, 16, { s: 16, w: 800 });
  r.fillStyle = PK.cssVar('--surface'); r.fillRect(L, T, R - L, B - T);
  r.lineWidth = 1;
  for (let cm = 0; cm <= 100; cm += 10) {
    r.strokeStyle = grid; r.beginPath(); r.moveTo(X(cm), T); r.lineTo(X(cm), B); r.stroke();
    if (cm % 20 === 0) rtext(String(cm), X(cm), B + 13, { s: 13, w: 600, col: muted });
  }
  for (let i = 0; i <= 10; i++) {
    const t = i * 0.05;
    r.strokeStyle = grid; r.beginPath(); r.moveTo(L, Y(t)); r.lineTo(R, Y(t)); r.stroke();
    if (i % 2 === 0) rtext(t.toFixed(1), L - 6, Y(t), { s: 13, w: 600, col: muted, a: 'right' });
  }
  r.strokeStyle = text; r.lineWidth = 1.5; r.strokeRect(L, T, R - L, B - T);
  rtext('Distance the ruler fell (cm)', (L + R) / 2, B + 34, { s: 14 });
  r.save(); r.translate(L - 40, (T + B) / 2); r.rotate(-Math.PI / 2); rtext('Reaction time (s)', 0, 0, { s: 14 }); r.restore();
  r.strokeStyle = line; r.lineWidth = 3; r.beginPath();
  for (let cm = 0; cm <= 100; cm++) { if (cm) r.lineTo(X(cm), Y(timeFor(cm))); else r.moveTo(X(cm), Y(0)); }
  r.stroke();
  if (rule.phase === 'done' && PK.answersShown()) {
    const x = X(rule.d), y = Y(rule.t);
    r.strokeStyle = RED; r.lineWidth = 2; r.setLineDash([6, 5]);
    r.beginPath(); r.moveTo(x, B); r.lineTo(x, y); r.lineTo(L, y); r.stroke(); r.setLineDash([]);
    r.fillStyle = RED; r.beginPath(); r.arc(x, y, 6, 0, Math.PI * 2); r.fill();
    rtext(`${rule.t.toFixed(2)} s`, L + 8, y - 13, { s: 16, w: 800, col: RED, a: 'left' });
  }
}
function drawRule(now) {
  r.setTransform(rc.width / RW, 0, 0, rc.width / RW, 0, 0);
  r.fillStyle = PK.cssVar('--surface-2'); r.fillRect(0, 0, RW, RH);
  drawRuler(now);
  drawZoom();
  drawConversion();
}

// ---------- Results ----------

const cell = (c, i, text, off) => `<span class="rd" role="button" tabindex="0" data-c="${c}" data-i="${i}">${off ? `<s>${text}</s>` : text}</span>`;
function brakeTable() {
  const n = Math.max(...state.rows.map((col) => col.length));
  if (!n) return '<p class="note">No readings yet.</p>';
  const body = Array.from({ length: n }, (_, i) => `<tr><td>${i + 1}</td>${state.rows.map((col, c) => `<td>${col[i] ? cell(c, i, col[i].t.toFixed(2), col[i].off) : ''}</td>`).join('')}</tr>`).join('');
  const foot = state.rows.map((col) => { const m = meanOf(col); return `<td>${m == null ? '' : PK.ans(m.toFixed(2))}</td>`; }).join('');
  return `<table class="results"><thead><tr><th>Try</th>${CONDS.map((h) => `<th>${h} (s)</th>`).join('')}</tr></thead><tbody>${body}</tbody><tfoot><tr><th>Mean</th>${foot}</tr></tfoot></table>`;
}
function rulerTable() {
  if (!state.ruler.length) return '<p class="note">No readings yet.</p>';
  const body = state.ruler.map((row, i) => {
    const fell = row.own ? row.d.toFixed(1) : PK.ans(row.d.toFixed(1));
    return `<tr><td>${i + 1}</td><td>${row.off ? `<s>${fell}</s>` : fell}</td><td>${cell('r', i, row.t.toFixed(2), row.off)}</td></tr>`;
  }).join('');
  const k = state.ruler.filter((x) => !x.off);
  const foot = k.length ? `<tfoot><tr><th>Mean</th><td>${PK.ans(mean(k.map((x) => x.d)).toFixed(1))}</td><td>${PK.ans(mean(k.map((x) => x.t)).toFixed(2))}</td></tr></tfoot>` : '';
  return `<table class="results"><thead><tr><th>Try</th><th>Ruler fell (cm)</th><th>Reaction time (s)</th></tr></thead><tbody>${body}</tbody>${foot}</table>`;
}
function renderResults() {
  $('table').innerHTML = state.tab === 'brake' ? brakeTable() : rulerTable();
  const any = state.tab === 'brake' ? state.rows.some((col) => col.length) : state.ruler.length;
  $('table-note').textContent = any ? 'If a reading looks like an anomaly, tap it to cross it out. It’s left out of the mean.' : '';
  drawBars();
  renderRoad();
}
function toggleCell(el) {
  const i = Number(el.dataset.i), row = el.dataset.c === 'r' ? state.ruler[i] : state.rows[Number(el.dataset.c)][i];
  if (row) { row.off = !row.off; renderResults(); }
}
$('table').addEventListener('click', (e) => { const el = e.target.closest('.rd'); if (el) toggleCell(el); });
$('table').addEventListener('keydown', (e) => { const el = e.target.closest('.rd'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleCell(el); } });
$('clear').addEventListener('click', () => { if (state.tab === 'brake') state.rows = [[], [], []]; else state.ruler = []; renderResults(); });
$('add-real').addEventListener('click', () => {
  if (state.ruler.length >= MAX) { PK.toast('The table is full. Clear it to carry on.'); return; }
  addRuler(Math.round(PK.num('real') * 2) / 2, true);
});

// Every reading along a line from 0 to 1 s, so the spread and any anomalies can be seen
const bars = $('bars'), b = bars.getContext('2d');
function drawBars() {
  if (!bars.clientWidth) return;
  const BW = 270, BH = 150, L = 50, R = BW - 12, T = 26, B2 = BH - 26;
  b.setTransform(bars.width / BW, 0, 0, bars.width / BW, 0, 0);
  const col = { surface: PK.cssVar('--surface'), soft: PK.cssVar('--good-soft'), good: PK.cssVar('--good'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent') };
  b.fillStyle = col.surface; b.fillRect(0, 0, BW, BH);
  const top = Math.max(1, ...state.rows.flat().map((x) => Math.ceil(x.t * 2) / 2));
  const X = (t) => L + (t / top) * (R - L), f = font();
  b.fillStyle = col.soft; b.fillRect(X(0.2), T, X(0.9) - X(0.2), B2 - T);
  b.fillStyle = col.good; b.font = `700 12px ${f}`; b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillText('typical range', X(0.55), T - 11);
  b.font = `600 12px ${f}`; b.textBaseline = 'top';
  for (let t = 0; t <= top + 1e-6; t += 0.2) {
    b.strokeStyle = col.grid; b.lineWidth = 1; b.beginPath(); b.moveTo(X(t), T); b.lineTo(X(t), B2); b.stroke();
    b.fillStyle = col.muted; b.fillText(t.toFixed(1), X(t), B2 + 4);
  }
  b.fillStyle = col.text; b.font = `700 12px ${f}`; b.textBaseline = 'bottom'; b.fillText('reaction time / s', (L + R) / 2, BH);
  state.rows.forEach((rows, i) => {
    const y = T + ((i + 0.5) * (B2 - T)) / 3;
    b.fillStyle = col.text; b.font = `700 13px ${f}`; b.textAlign = 'right'; b.textBaseline = 'middle'; b.fillText(SHORT[i], L - 6, y);
    for (const row of rows) {
      const x = X(row.t);
      b.strokeStyle = row.off ? col.muted : col.point; b.lineWidth = 2; b.globalAlpha = row.off ? 0.5 : 1;
      b.beginPath(); b.moveTo(x - 4, y - 4); b.lineTo(x + 4, y + 4); b.moveTo(x - 4, y + 4); b.lineTo(x + 4, y - 4); b.stroke();
      b.globalAlpha = 1;
    }
    const m = meanOf(rows);
    if (m != null && PK.answersShown()) { b.strokeStyle = col.text; b.lineWidth = 3; b.beginPath(); b.moveTo(X(m), y - 11); b.lineTo(X(m), y + 11); b.stroke(); }
  });
}

// ----- What it means on the road -----

const lanesCv = $('lanes'), g = lanesCv.getContext('2d');
function laneData() {
  if (state.tab === 'ruler') { const m = meanOf(state.ruler); return m == null ? [] : [['Ruler drop', m]]; }
  return state.rows.map((rows, i) => [CONDS[i], meanOf(rows)]).filter((x) => x[1] != null);
}
const LANE_COL = ['--f1', '--f2', '--f3'];
function renderRoad() {
  const v = PK.num('v'), list = laneData();
  $('mph').textContent = `${Math.round(v / 0.44704)} mph`;
  if (lanesCv.clientWidth) drawLanes(v, list);
  if (!list.length) { $('think').innerHTML = ''; return; }
  const lines = list.map(([n, t]) => `<div>${n}: ${v} × ${PK.ans(t.toFixed(2))} = ${PK.ans(`${(v * t).toFixed(1)} m`)}</div>`).join('');
  let extra = '';
  if (list.length > 1) {
    const base = list[0], worst = list.reduce((a, x) => (x[1] > a[1] ? x : a), list[0]);
    if (worst !== base && worst[1] > base[1]) extra = `<p style="margin:8px 0 0"><b>${worst[0]}</b> added ${PK.ans(`${(v * (worst[1] - base[1])).toFixed(1)} m`)} to the thinking distance.</p>`;
  }
  $('think').innerHTML = `<p style="margin:10px 0 4px;font-weight:700">Thinking distance = speed × reaction time</p>${lines}${extra}`;
}
function drawLanes(v, list) {
  const LW = 800, LH = 176, L = 130, R = LW - 74, k = lanesCv.width / LW;
  g.setTransform(k, 0, 0, k, 0, 0);
  g.fillStyle = PK.cssVar('--surface-2'); g.fillRect(0, 0, LW, LH);
  const f = font(), text = PK.cssVar('--text'), muted = PK.cssVar('--muted');
  if (!list.length) {
    g.fillStyle = muted; g.font = `700 17px ${f}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Take some readings to see how far the car travels while you react.', LW / 2, LH / 2);
    return;
  }
  const max = Math.max(...list.map((x) => v * x[1]));
  const raw = Math.max(5, max * 1.05), p = 10 ** Math.floor(Math.log10(raw)), n = raw / p;
  const top = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p, X = (m) => L + (m / top) * (R - L), show = PK.answersShown();
  const laneH = 44, y0 = 10 + ((3 - list.length) * laneH) / 2;
  g.font = `600 13px ${f}`; g.textAlign = 'center'; g.textBaseline = 'top';
  for (let i = 0; i <= 5; i++) {
    const m = (top * i) / 5;
    g.strokeStyle = PK.cssVar('--grid'); g.lineWidth = 1; g.beginPath(); g.moveTo(X(m), 8); g.lineTo(X(m), LH - 24); g.stroke();
    g.fillStyle = muted; g.fillText(`${parseFloat(m.toFixed(1))} m`, X(m), LH - 20);
  }
  list.forEach(([name, t], i) => {
    const y = y0 + i * laneH + laneH / 2, d = v * t;
    g.fillStyle = text; g.font = `700 14px ${f}`; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(name, L - 10, y);
    g.fillStyle = '#6a7180'; g.fillRect(L, y - 15, R - L, 30);
    const key = state.tab === 'ruler' ? '--f1' : LANE_COL[CONDS.indexOf(name)];
    if (show) {
      const c0 = PK.cssVar(key);
      g.fillStyle = c0; g.globalAlpha = 0.85; g.fillRect(L, y - 8, X(d) - L, 16); g.globalAlpha = 1;
      g.fillStyle = c0; g.beginPath(); g.roundRect(X(d) - 2, y - 11, 34, 22, 6); g.fill();
      g.fillStyle = '#c4dcec'; g.fillRect(X(d) + 18, y - 8, 7, 16);
      g.fillStyle = text; g.font = `800 15px ${f}`; g.textAlign = 'left'; g.fillText(`${d.toFixed(1)} m`, Math.min(X(d) + 38, LW - 60), y);
    } else {
      g.fillStyle = '#fff'; g.font = `800 15px ${f}`; g.textAlign = 'left'; g.fillText('? m', L + 10, y);
    }
  });
}

const HOW = {
  brake: `<ol>
    <li>Use a reaction timer or a computer test, so that a machine does the timing.</li>
    <li>Take at least five readings with no distraction, and leave out any anomalies.</li>
    <li>Work out the mean: add the readings together and divide by how many there are.</li>
    <li>Take another five readings with one distraction, such as doing sums or listening to music.</li>
    <li>Compare the two means. The bigger the difference, the more the distraction has affected the reaction time.</li>
    </ol>
    <p class="note">Keep the person, the hand they use and the test the same, so that the distraction is the only thing that changes. Have a few practice goes first, because people get quicker to begin with.</p>`,
  ruler: `<ol>
    <li>Your partner holds a ruler upright, with the zero mark level with the top of your thumb.</li>
    <li>Hold your thumb and first finger open on either side of the ruler, without touching it.</li>
    <li>Your partner lets go without warning. Catch the ruler as quickly as you can.</li>
    <li>Read the distance at the top of your thumb. The shorter the distance, the shorter your reaction time.</li>
    <li>Use a conversion graph or table to turn the distance into a time.</li>
    <li>Repeat at least five times and work out a mean.</li>
    </ol>
    <p class="note">Keep the same hand, the same starting gap and the same person dropping the ruler. They must give no warning, otherwise you could predict the drop and it wouldn’t be a test of your reactions.</p>`,
};

// ---------- Tabs and start ----------

function sizeAll() {
  const dpr = window.devicePixelRatio || 1;
  for (const [cv, w, h] of [[scene, W, H], [rc, RW, RH], [bars, 270, 150], [lanesCv, 800, 176]]) {
    if (!cv.clientWidth) continue;
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr);
  }
}
function showTab(t) {
  state.tab = t;
  if (driving()) { run.phase = 'idle'; run.task = null; run.msg = ''; setBrake(); renderTask(); }
  if (falling()) { rule.phase = 'idle'; rule.msg = ''; setCatch(); }
  document.querySelectorAll('#tabs .chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('how').innerHTML = HOW[t];
  sizeAll();
  renderResults();
}
document.querySelectorAll('#tabs .chip').forEach((x) => x.addEventListener('click', () => showTab(x.dataset.t)));
$('v').addEventListener('input', renderRoad);

// The space bar works too, unless someone is typing or has another button selected
const mainButton = (el) => el === $('brake') || el === $('catch');
const usable = (el) => !el.matches || !el.matches('input, select, textarea, a, summary, button, .rd') || mainButton(el);
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.repeat || !usable(e.target)) return;
  e.preventDefault();
  press(state.tab === 'brake' ? pressBrake : pressCatch, e);
});
document.addEventListener('keyup', (e) => { if (e.code === 'Space' && mainButton(e.target)) e.preventDefault(); });
// A test can't be timed fairly if the page goes out of view halfway through
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  if (driving()) { run.phase = 'idle'; run.task = null; run.msg = ''; setBrake(); renderTask(); }
  if (falling()) { rule.phase = 'idle'; rule.msg = ''; setCatch(); }
});

let lastStatus = {};
function setStatus(id, html) { if (lastStatus[id] !== html) { lastStatus[id] = html; $(id).innerHTML = html; } }
let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, now - lastFrame) / 1000); lastFrame = now;
  if (state.tab === 'brake') { stepDrive(now); drawRoad(now, dt); setStatus('status', run.msg || IDLE_MSG); }
  else { stepRule(now); drawRule(now); setStatus('r-status', rule.msg || RULER_IDLE); }
  requestAnimationFrame(frame);
}
window.addEventListener('resize', () => { sizeAll(); renderResults(); });
window.addEventListener('pk-theme', renderResults);
window.addEventListener('pk-answers', renderResults);
renderTask(); setBrake(); setCatch();
showTab('brake');
requestAnimationFrame(frame);

// Share: the readings (the test, the distraction and the speed are shared anyway)
PK.shareState = {
  get: () => ({
    r: state.rows.map((col) => col.map((x) => [x.t, x.off ? 1 : 0])),
    u: state.ruler.map((x) => [x.d, x.off ? 1 : 0, x.own ? 1 : 0]),
  }),
  set: (o) => {
    if (Array.isArray(o.r)) state.rows = [0, 1, 2].map((i) => (Array.isArray(o.r[i]) ? o.r[i].map(([t, off]) => ({ t: Number(t), off: Boolean(off) })).filter((x) => x.t > 0) : []));
    if (Array.isArray(o.u)) state.ruler = o.u.map(([d, off, own]) => ({ d: Number(d), t: Math.round(timeFor(Number(d)) * 100) / 100, off: Boolean(off), own: Boolean(own) })).filter((x) => x.d > 0);
    renderResults();
  },
};
