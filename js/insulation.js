// Thermal insulation practical: each beaker cools following Newton's law of cooling,
// dθ/dt = −k (θ − θ_room). A better insulator (lower thermal conductivity, more layers,
// a lid) has a smaller k, so its water stays hot for longer.

PK.header({
  title: 'Thermal insulation practical',
  spec: [
    { code: '4.1.2.1', text: 'Required practical: investigate the effectiveness of different materials as thermal insulators, and the factors that affect this (such as thickness)', po: true },
    { code: '4.1.2.1', text: 'The higher the thermal conductivity of a material, the higher the rate of energy transfer by conduction', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const MATERIALS = {
  none: { name: 'Nothing', k: 0.045, col: null },
  paper: { name: 'Newspaper', k: 0.031, col: '#d9d4c7' },
  foil: { name: 'Aluminium foil', k: 0.034, col: '#c9ced6' },
  bubble: { name: 'Bubble wrap', k: 0.022, col: 'rgba(200, 230, 255, .8)' },
  cotton: { name: 'Cotton wool', k: 0.016, col: '#fbfbf7' },
};
const ROOM = 20, START = 80, T_END = 20 * 60, EVERY = 120;
const state = { picks: ['none', 'paper', 'bubble', 'cotton'], layers: 2, lid: false, running: false, t: 0, temps: [START, START, START, START], log: [], speed: 30 };

// Cooling constant per minute for one beaker
function kOf(i) {
  const m = MATERIALS[state.picks[i]];
  let k = m.k;
  if (state.picks[i] !== 'none') k = m.k / (1 + 0.5 * (state.layers - 1));
  if (state.lid) k *= 0.7;
  return k / 60;   // per second
}

function reset() {
  Object.assign(state, { running: false, t: 0, temps: [START, START, START, START] });
  state.log = [{ t: 0, temps: [...state.temps] }];
  $('go').textContent = '▶ Start the stopwatch';
  render();
}

function step(dt) {
  state.temps = state.temps.map((T, i) => T - kOf(i) * (T - ROOM) * dt);
  const prev = state.t;
  state.t += dt;
  if (Math.floor(state.t / EVERY) > Math.floor(prev / EVERY)) { state.log.push({ t: Math.floor(state.t / EVERY) * EVERY, temps: [...state.temps] }); render(); }
  if (state.t >= T_END) { state.running = false; $('go').textContent = '▶ Start the stopwatch'; render(); }
}

// ---------- Drawing ----------

const bc = $('beakers'), bctx = bc.getContext('2d');
const cc = $('curve'), cctx = cc.getContext('2d');
const COLS = ['#e53935', '#1e88e5', '#43a047', '#8e24aa'];
function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }

function drawBeakers() {
  const W = 800, H = 300, k = bc.width / W;
  bctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
  bctx.fillStyle = c.surface; bctx.fillRect(0, 0, W, H);
  state.picks.forEach((p, i) => {
    const cx = 100 + i * 200, top = 90, bw = 100, bh = 150;
    const m = MATERIALS[p];
    if (m.col) {
      const pad = 6 + state.layers * 5;
      bctx.fillStyle = m.col; bctx.strokeStyle = '#aaa'; bctx.lineWidth = 1;
      bctx.fillRect(cx - bw / 2 - pad, top + 10, bw + pad * 2, bh - 6); bctx.strokeRect(cx - bw / 2 - pad, top + 10, bw + pad * 2, bh - 6);
      if (p === 'bubble') { bctx.strokeStyle = 'rgba(120, 170, 220, .8)'; for (let y = top + 20; y < top + bh; y += 14) for (let x = cx - bw / 2 - pad + 6; x < cx + bw / 2 + pad; x += 14) { bctx.beginPath(); bctx.arc(x, y, 4, 0, Math.PI * 2); bctx.stroke(); } }
    }
    // Water: colour shows how hot it is
    const f = (state.temps[i] - ROOM) / (START - ROOM);
    bctx.fillStyle = `rgb(${Math.round(90 + 165 * f)}, ${Math.round(150 - 60 * f)}, ${Math.round(230 - 170 * f)})`;
    bctx.fillRect(cx - bw / 2, top + 40, bw, bh - 40);
    bctx.strokeStyle = c.text; bctx.lineWidth = 2;
    bctx.beginPath(); bctx.moveTo(cx - bw / 2, top); bctx.lineTo(cx - bw / 2, top + bh); bctx.lineTo(cx + bw / 2, top + bh); bctx.lineTo(cx + bw / 2, top); bctx.stroke();
    if (state.lid) { bctx.fillStyle = '#8d6e4f'; bctx.fillRect(cx - bw / 2 - 6, top - 10, bw + 12, 10); }
    // Thermometer
    bctx.fillStyle = '#fff'; bctx.fillRect(cx + 22, top - 50, 10, 160); bctx.strokeStyle = c.text; bctx.lineWidth = 1; bctx.strokeRect(cx + 22, top - 50, 10, 160);
    bctx.fillStyle = '#e53935'; const h = (state.temps[i] / 100) * 150; bctx.fillRect(cx + 24, top + 108 - h, 6, h);
    bctx.fillStyle = COLS[i]; bctx.font = `800 18px ${c.font}`; bctx.textAlign = 'center'; bctx.textBaseline = 'top';
    bctx.fillText(`${state.temps[i].toFixed(1)} °C`, cx, top + bh + 12);
    bctx.fillStyle = c.text; bctx.font = `700 13px ${c.font}`;
    bctx.fillText(`${'ABCD'[i]}: ${m.name}`, cx, 16);
  });
  bctx.fillStyle = c.muted; bctx.font = `600 13px ${c.font}`; bctx.textAlign = 'right'; bctx.textBaseline = 'top';
  bctx.fillText(`stopwatch: ${Math.floor(state.t / 60)} min ${String(Math.floor(state.t % 60)).padStart(2, '0')} s`, W - 10, H - 22);
}

function drawCurve() {
  const GW = 800, GH = 300, k = cc.width / GW;
  cctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), font: PK.cssVar('--font-body') || 'sans-serif' };
  cctx.fillStyle = c.surface; cctx.fillRect(0, 0, GW, GH);
  const L = 56, R = 150, T = 12, B = 40, pw = GW - L - R, ph = GH - T - B;
  const X = (t) => L + (t / T_END) * pw, Y = (v) => T + ph - ((v - 20) / 65) * ph;
  cctx.strokeStyle = c.grid; cctx.fillStyle = c.muted; cctx.font = `600 11px ${c.font}`; cctx.lineWidth = 1;
  cctx.textAlign = 'right'; cctx.textBaseline = 'middle';
  for (let v = 20; v <= 80; v += 10) { cctx.beginPath(); cctx.moveTo(L, Y(v)); cctx.lineTo(L + pw, Y(v)); cctx.stroke(); cctx.fillText(v, L - 6, Y(v)); }
  cctx.textAlign = 'center'; cctx.textBaseline = 'top';
  for (let m = 0; m <= 20; m += 2) { cctx.beginPath(); cctx.moveTo(X(m * 60), T); cctx.lineTo(X(m * 60), T + ph); cctx.stroke(); cctx.fillText(m, X(m * 60), T + ph + 4); }
  cctx.strokeStyle = c.text; cctx.lineWidth = 1.5; cctx.beginPath(); cctx.moveTo(L, T); cctx.lineTo(L, T + ph); cctx.lineTo(L + pw, T + ph); cctx.stroke();
  cctx.fillStyle = c.text; cctx.font = `700 12px ${c.font}`; cctx.fillText('time / minutes', L + pw / 2, GH - 16);
  cctx.save(); cctx.translate(14, T + ph / 2); cctx.rotate(-Math.PI / 2); cctx.textBaseline = 'middle'; cctx.fillText('temperature / °C', 0, 0); cctx.restore();
  const pts = [...state.log, { t: state.t, temps: state.temps }];
  for (let i = 0; i < 4; i++) {
    cctx.strokeStyle = COLS[i]; cctx.lineWidth = 2.5;
    cctx.beginPath(); pts.forEach((p, j) => (j ? cctx.lineTo(X(p.t), Y(p.temps[i])) : cctx.moveTo(X(p.t), Y(p.temps[i])))); cctx.stroke();
    cctx.fillStyle = COLS[i]; cctx.font = `700 12px ${c.font}`; cctx.textAlign = 'left'; cctx.textBaseline = 'middle';
    cctx.fillText(`${'ABCD'[i]}: ${MATERIALS[state.picks[i]].name}`, L + pw + 10, T + 14 + i * 20);
  }
}

// ---------- Panel ----------

function render() {
  $('layers').textContent = state.layers;
  const rows = state.log;
  $('table').innerHTML = `<table class="results"><thead><tr><th>Time (min)</th>${state.picks.map((p, i) => `<th style="color:${COLS[i]}">${'ABCD'[i]}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${r.t / 60}</td>${r.temps.map((T) => `<td class="n">${T.toFixed(1)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  if (state.t >= T_END) {
    const drops = state.temps.map((T) => START - T);
    const best = drops.indexOf(Math.min(...drops));
    $('verdict').innerHTML = `Temperature drop in 20 minutes: ${drops.map((d, i) => `${'ABCD'[i]} ${d.toFixed(1)} °C`).join(', ')}.<br><b>Best insulator: ${'ABCD'[best]} (${MATERIALS[state.picks[best]].name.toLowerCase()})</b>.${['cotton', 'bubble', 'paper'].includes(state.picks[best]) ? ' It traps air, which is a poor conductor of heat.' : ''}`;
  } else $('verdict').textContent = 'Readings are taken every 2 minutes for 20 minutes.';
}

function renderPicks() {
  const opts = Object.entries(MATERIALS).map(([id, m]) => `<option value="${id}">${m.name}</option>`).join('');
  $('picks').innerHTML = state.picks.map((p, i) => `<label><span class="sr-only">Beaker ${'ABCD'[i]}</span><select class="select" data-i="${i}">${opts}</select></label>`).join('');
  $('picks').querySelectorAll('select').forEach((s) => { s.value = state.picks[Number(s.dataset.i)]; s.addEventListener('change', () => { state.picks[Number(s.dataset.i)] = s.value; reset(); }); });
}

$('go').addEventListener('click', () => {
  if (state.t >= T_END) reset();
  state.running = !state.running;
  $('go').textContent = state.running ? '❚❚ Pause' : '▶ Start the stopwatch';
});
$('reset').addEventListener('click', reset);
$('speed').addEventListener('change', (e) => { state.speed = Number(e.target.value); });
$('less').addEventListener('click', () => { state.layers = Math.max(1, state.layers - 1); reset(); });
$('more').addEventListener('click', () => { state.layers = Math.min(4, state.layers + 1); reset(); });
$('lid').addEventListener('change', (e) => { state.lid = e.target.checked; reset(); });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.running) { const sim = dt * state.speed, n = Math.ceil(sim); for (let i = 0; i < n; i++) if (state.running) step(sim / n); }
  drawBeakers(); drawCurve();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { size(bc, 800, 300); size(cc, 800, 300); });
size(bc, 800, 300); size(cc, 800, 300);
renderPicks();
reset();
requestAnimationFrame(frame);
