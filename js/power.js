// Power: comparing two motors. Each motor lifts its load at a steady speed, so the energy in the
// load's gravitational store goes up at a steady rate, and that rate is the power: P = E ÷ t,
// with E = m g h. No energy is wasted here: the motor's power all goes into lifting.

PK.header({
  title: 'Power: comparing two motors',
  answers: true,
  spec: [
    { code: '4.1.1.4', text: 'Power is the rate at which energy is transferred or the rate at which work is done: P = E ÷ t and P = W ÷ t. An energy transfer of 1 joule per second is a power of 1 watt' },
    { code: '4.1.1.4', text: 'Examples that illustrate power, such as two electric motors that lift the same weight through the same height, one faster than the other' },
    { code: '4.1.1.2', text: 'Gravitational potential energy: Ep = m g h' },
    { code: '4.5.2', text: 'Work done: W = F s. Lifting a load, the work done is its weight × the height' },
    { code: 'KS3', text: 'Power as the rate of transfer of energy, in watts (W) and kilowatts (kW)' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 520, g = 9.8;
const FLOOR = 300, PXM = 40;   // the floor's y, and pixels per metre (a fixed scale: 0 to 5 m)
const MOTORS = { A: { col: '#1e63c6', cx: 200 }, B: { col: '#e65100', cx: 600 } };
const state = { tab: 'same', mystery: false, myst: { A: 40, B: 20 }, t: 0, running: false, speed: 1 };
const sig = (x, n = 3) => String(parseFloat(x.toPrecision(n)));
const fmt = (x) => (Math.abs(x) >= 10000 ? Math.round(x).toLocaleString('en-GB').replace(/,/g, ' ') : Math.abs(x) >= 1000 ? String(Math.round(x)) : sig(x));

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800, halo = c.surface) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}

// ---------- The two jobs ----------

function job(k) {
  const same = state.tab === 'same';
  const m = PK.num(same ? 'mass' : `mass${k}`), h = PK.num(same ? 'height' : `height${k}`);
  const P = state.mystery ? state.myst[k] : PK.num(`power${k}`), E = m * g * h;
  return { m, h, P, E, t: E / P };
}
const hidden = () => state.mystery;   // the powers are hidden until the student shows them
const finished = (j) => state.t >= j.t;
const lifted = (j) => Math.min(j.h, (j.h * state.t) / j.t);
// A tidy axis for the graph: steps of 1, 2 or 5 (× 10ⁿ), with at most n of them
function axis(x, n) {
  const p = 10 ** Math.floor(Math.log10(x / n)), step = [1, 2, 5, 10].map((s) => s * p).find((s) => x / s <= n + 1e-9);
  return { step, max: Math.ceil(x / step - 1e-9) * step };
}
// Long jobs are speeded up, the same for both motors, so neither takes more than about 15 s to watch
function setSpeed() {
  const longest = Math.max(job('A').t, job('B').t);
  state.speed = [1, 2, 5, 10, 20, 50, 100].find((s) => longest / s <= 15) || 100;
}
function reset() { state.t = 0; state.running = false; setSpeed(); syncGo(); render(); }
function step(dt) {
  if (!state.running) return;
  const longest = Math.max(job('A').t, job('B').t);
  state.t = Math.min(longest, state.t + dt * state.speed);
  if (state.t >= longest) { state.running = false; syncGo(); render(); }
}

// ---------- Drawing ----------

const crateSize = (m) => 30 + 16 * Math.sqrt(Math.min(m, 50) / 50);
function drawRig(c, k) {
  const M = MOTORS[k], j = job(k), cx = M.cx, up = lifted(j);
  // The frame: two posts and a beam
  ctx.fillStyle = c.surface2; ctx.fillRect(cx - 150, FLOOR, 300, 8);
  ctx.fillStyle = '#90a4ae';
  ctx.fillRect(cx - 104, 20, 8, FLOOR - 20); ctx.fillRect(cx + 96, 20, 8, FLOOR - 20); ctx.fillRect(cx - 108, 14, 216, 10);
  // The ruler, 0 to 5 m
  const rx = cx - 128;
  ctx.strokeStyle = c.text; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(rx, FLOOR); ctx.lineTo(rx, FLOOR - 5 * PXM); ctx.stroke();
  for (let i = 0; i <= 10; i++) {
    const y = FLOOR - (i * PXM) / 2, whole = i % 2 === 0;
    ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx - (whole ? 9 : 5), y); ctx.stroke();
    if (whole) tag(c, `${i / 2} m`, rx - 12, y, c.muted, 'right', 12, 700, null);
  }
  ctx.lineWidth = 1;
  // The height to lift it to: drag the line to change it
  const yT = FLOOR - j.h * PXM;
  ctx.strokeStyle = M.col; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(rx, yT); ctx.lineTo(cx + 92, yT); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
  ctx.fillStyle = M.col; ctx.beginPath(); ctx.moveTo(rx + 2, yT); ctx.lineTo(rx + 16, yT - 8); ctx.lineTo(rx + 16, yT + 8); ctx.closePath(); ctx.fill();
  tag(c, `${j.h} m`, cx - 90, yT - 12, M.col, 'left', 14, 800);
  if (!state.running && state.t === 0) tag(c, 'drag me', cx - 90, yT + 13, c.muted, 'left', 12, 700);
  // The motor and its rope
  const s = crateSize(j.m), yb = FLOOR - up * PXM;
  ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, 58); ctx.lineTo(cx, yb - s); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = M.col; ctx.beginPath(); ctx.roundRect(cx - 34, 22, 68, 36, 6); ctx.fill();
  tag(c, `Motor ${k}`, cx, 40, '#fff', 'center', 13, 800, null);
  // The load
  ctx.fillStyle = '#c8a27a'; ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2;
  ctx.fillRect(cx - s / 2, yb - s, s, s); ctx.strokeRect(cx - s / 2, yb - s, s, s); ctx.lineWidth = 1;
  tag(c, `${j.m} kg`, cx, yb - s / 2, '#3e2a14', 'center', 12, 800, null);
  // Its stopwatch
  ctx.fillStyle = '#10161c'; ctx.beginPath(); ctx.roundRect(cx + 28, 68, 64, 30, 6); ctx.fill();
  const t = Math.min(state.t, j.t);
  tag(c, `${t.toFixed(2)} s`, cx + 60, 83, finished(j) && state.t > 0 ? '#8fd9a8' : '#fff', 'center', 15, 800, null);
  // Under the floor: the power and the energy transferred so far
  tag(c, `Motor ${k}: ${hidden() ? '? W' : `${j.P} W`}`, cx, 318, M.col, 'center', 16, 800);
  // While it's lifting, keep 3 figures with their zeros (52.0, not 52) so the number doesn't jump about
  const e = finished(j) ? fmt(j.E) : (j.m * g * up >= 1000 ? fmt(j.m * g * up) : (j.m * g * up).toPrecision(3));
  tag(c, `Energy transferred: ${PK.ansText(`${e} J`)}`, cx, 340, c.text, 'center', 14, 700);
}
function drawGraph(c) {
  const A = job('A'), B = job('B'), ta = axis(Math.max(A.t, B.t), 6), ea = axis(Math.max(A.E, B.E), 3), tMax = ta.max, eMax = ea.max;
  const x0 = 90, x1 = 770, y0 = 392, y1 = 478;
  const X = (t) => x0 + ((x1 - x0) * t) / tMax, Y = (e) => y1 - ((y1 - y0) * e) / eMax;
  tag(c, 'Energy transferred against time', 20, 370, c.text, 'left', 15, 800);
  tag(c, 'The steeper the line, the greater the power', x1, 370, c.muted, 'right', 14, 700);
  ctx.strokeStyle = c.border; ctx.font = `600 13px ${c.font}`; ctx.fillStyle = c.muted; ctx.textBaseline = 'middle';
  for (let e = 0; e <= eMax + 1e-9; e += ea.step) {
    ctx.beginPath(); ctx.moveTo(x0, Y(e)); ctx.lineTo(x1, Y(e)); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(`${fmt(e)} J`, x0 - 6, Y(e));
  }
  ctx.textAlign = 'center';
  for (let t = 0; t <= tMax + 1e-9; t += ta.step) ctx.fillText(sig(t), X(t), y1 + 14);
  ctx.fillText('Time (s)', (x0 + x1) / 2, y1 + 31);
  for (const k of ['A', 'B']) {
    const j = k === 'A' ? A : B, t = Math.min(state.t, j.t);
    if (state.t <= 0) continue;
    ctx.strokeStyle = MOTORS[k].col; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(t), Y(j.P * t));
    if (state.t > j.t) ctx.lineTo(X(state.t), Y(j.E));   // finished: no more energy is transferred
    ctx.stroke(); ctx.lineWidth = 1;
    // The higher line's letter goes above it, the lower one's below, so they don't sit on top of each other
    const o = k === 'A' ? B : A, above = j.P * t >= o.P * Math.min(state.t, o.t);
    tag(c, k, X(t) - 12, above ? Math.max(y0 + 6, Y(j.P * t) - 11) : Math.min(y1 - 6, Y(j.P * t) + 12), MOTORS[k].col, 'center', 15, 800);
  }
}

// ---------- Words ----------

const INTRO = {
  same: 'Two motors lift the same load through the same height, so they transfer the same amount of energy. Press Go and time them. The one that does the job in less time has the greater power.',
  different: 'Now each motor has a different job. The motor that takes longer isn’t always the less powerful one: you need the energy each one transfers every second.',
};
function render() {
  const A = job('A'), B = job('B'), done = !state.running && state.t > 0;
  // The results table
  const cell = (x, show) => (show ? PK.ans(x) : '–');
  const row = (k, j) => `<tr><td style="color:${MOTORS[k].col}">${k}</td><td>${j.m}</td><td>${j.h}</td><td>${cell(fmt(j.E), true)}</td><td>${finished(j) && state.t > 0 ? j.t.toFixed(2) : state.running ? '…' : '–'}</td><td>${hidden() ? '?' : cell(sig(j.P), finished(j) && state.t > 0)}</td></tr>`;
  let res = `<table class="results"><thead><tr><th>Motor</th><th>Mass (kg)</th><th>Height (m)</th><th>Energy transferred (J)</th><th>Time (s)</th><th>Power (W)</th></tr></thead><tbody>${row('A', A)}${row('B', B)}</tbody></table>`;
  res += '<div class="working">';
  for (const k of ['A', 'B']) {
    const j = k === 'A' ? A : B;
    res += `<p><b style="color:${MOTORS[k].col}">Motor ${k}:</b> E = m g h = ${j.m} × 9.8 × ${j.h} = ${PK.ans(`${fmt(j.E)} J`)}`;
    if (finished(j) && state.t > 0) res += `. P = E ÷ t = ${fmt(j.E)} ÷ ${j.t.toFixed(2)} = ${hidden() ? '? W' : PK.ans(`${sig(j.P)} W`)}`;
    res += '</p>';
  }
  res += `</div><p class="note" style="margin-bottom:0">Here no energy is wasted: it all goes into the load’s gravitational potential energy store. A real motor also heats up, so it needs a bigger input power than this.${hidden() && done ? ' Work out each power, then press <b>Show their power</b> to check.' : ''}</p>`;
  $('results').innerHTML = res;
  // What's happening
  let html;
  if (state.t === 0) {
    html = state.tab === 'same'
      ? `<p>Both motors lift a ${A.m} kg load through ${A.h} m. Which will finish first? Which has the greater power? Press <b>Go</b>.</p>`
      : `<p>Motor A lifts ${A.m} kg through ${A.h} m. Motor B lifts ${B.m} kg through ${B.h} m. Which has the greater power? Predict, then press <b>Go</b>.</p>`;
  } else if (state.running) {
    html = `<p>The motors are lifting. The energy in each load’s gravitational potential energy store goes up at a steady rate: that rate is the motor’s power.</p>${state.speed > 1 ? `<p>Speeded up ×${state.speed}, so you don’t have to wait.</p>` : ''}`;
  } else {
    const [fast, slow] = A.t <= B.t ? ['A', 'B'] : ['B', 'A'], more = A.P >= B.P ? 'A' : 'B';
    const jf = fast === 'A' ? A : B, js = fast === 'A' ? B : A;
    if (Math.abs(A.E - B.E) < 1e-9) {
      html = `<p>Both motors transferred the same energy, ${PK.ans(`${fmt(A.E)} J`)}, to the load’s gravitational potential energy store.</p>`;
      html += Math.abs(A.t - B.t) < 1e-9
        ? '<p>They took the same time, so they have the same power.</p>'
        : `<p>Motor ${fast} took ${jf.t.toFixed(2)} s and motor ${slow} took ${js.t.toFixed(2)} s. ${hidden() ? `Motor ${fast} did the same job in less time, so it has the greater power. By how much? Work it out!` : `Motor ${fast} did the same job in less time, so it transfers energy at a faster rate: it has the greater power.`}</p>`;
    } else {
      html = `<p>Motor A transferred ${PK.ans(`${fmt(A.E)} J`)} in ${A.t.toFixed(2)} s. Motor B transferred ${PK.ans(`${fmt(B.E)} J`)} in ${B.t.toFixed(2)} s.</p>`;
      html += hidden()
        ? '<p>They did different jobs, so the time alone doesn’t tell you which is more powerful. Work out the energy each one transfers every second.</p>'
        : `<p>${Math.abs(A.P - B.P) < 1e-9 ? 'They transfer energy at the same rate, so they have the same power, even though their times are different.' : `Motor ${more} transfers more energy every second (${PK.ans(`${sig(more === 'A' ? A.P : B.P)} W`)} against ${PK.ans(`${sig(more === 'A' ? B.P : A.P)} W`)}), so it has the greater power${more === slow ? `, even though it took longer` : ''}.`}</p>`;
    }
  }
  html += '<p>Power is the rate at which energy is transferred, or the rate at which work is done: <b>P = E ÷ t</b>. A power of 1 watt (W) is 1 joule of energy every second.</p>';
  $('info').innerHTML = html;
}

// ---------- Controls ----------

function syncGo() {
  $('go').disabled = state.running;
  $('go').textContent = state.running ? 'Lifting…' : state.t > 0 ? '▶ Go again' : '▶ Go';
}
function syncMystery() {
  document.querySelectorAll('.power-row').forEach((el) => { el.hidden = state.mystery; });
  document.querySelectorAll('.mystery-note').forEach((el) => { el.hidden = !state.mystery; });
  $('reveal').hidden = !state.mystery;
}
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'same' ? location.pathname + location.search : `#${t}`);
  reset();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
$('go').addEventListener('click', () => { state.t = 0; setSpeed(); state.running = true; syncGo(); render(); });
$('reset').addEventListener('click', reset);
for (const id of ['mass', 'height', 'massA', 'heightA', 'massB', 'heightB', 'powerA', 'powerB']) $(id).addEventListener('input', reset);
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
$('mystery').addEventListener('click', () => {
  const a = rint(4, 40) * 5;
  let b = a;
  while (Math.abs(b - a) < 10) b = rint(4, 40) * 5;
  state.mystery = true; state.myst = { A: a, B: b };
  syncMystery(); reset();
  PK.toast('Two new motors. Time them, then work out their power.');
});
$('reveal').addEventListener('click', () => {
  PK.setNum('powerA', state.myst.A); PK.setNum('powerB', state.myst.B);
  state.mystery = false; syncMystery(); render();
  PK.toast(`Motor A: ${state.myst.A} W. Motor B: ${state.myst.B} W.`);
});
window.addEventListener('pk-answers', render);

// Drag the dashed line to change the height
PK.dragOn(cv, W, H, {
  hit: (p) => {
    if (state.running) return null;
    for (const k of ['A', 'B']) {
      const cx = MOTORS[k].cx, yT = FLOOR - job(k).h * PXM;
      if (p.x > cx - 145 && p.x < cx + 100 && Math.abs(p.y - yT) < 14) return k;
    }
    return null;
  },
  move: (k, p) => {
    const h = Math.min(5, Math.max(0.5, Math.round(((FLOOR - p.y) / PXM) * 2) / 2));
    PK.setNum(state.tab === 'same' ? 'height' : `height${k}`, h);
    reset();
  },
});

// Mystery motors go in a shared link, so a class can all time the same pair
PK.shareState = {
  get: () => (state.mystery ? { m: [state.myst.A, state.myst.B] } : {}),
  set: (o) => {
    if (o && Array.isArray(o.m) && o.m.every((x) => Number.isFinite(x) && x >= 5 && x <= 500)) {
      state.mystery = true; state.myst = { A: o.m[0], B: o.m[1] }; syncMystery(); reset();
    }
  },
};

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  step(dt);
  if (cv.clientWidth) {
    const c = colours();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    drawRig(c, 'A'); drawRig(c, 'B'); drawGraph(c);
  }
  tick += dt;
  if (state.running && tick > 0.25) { tick = 0; render(); }
  requestAnimationFrame(frame);
}

syncMystery();
showTab(PK.initialHash === '#different' ? 'different' : 'same');
requestAnimationFrame(frame);
