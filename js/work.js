// Work done: W = F s. Pushing a 20 kg box: work against friction heats the box and floor, and
// any extra force gives the box kinetic energy. Lifting: W = F s = m g h, stored as GPE.

PK.header({
  title: 'Work done',
  answers: true,
  spec: [
    { code: '4.5.2', text: 'Work done and energy transfer: W = F s; 1 joule = 1 newton-metre; work done against friction causes a rise in temperature' },
    { code: '4.1.1.2', text: 'Energy changes: gravitational potential energy Ep = m g h and kinetic energy Ek = ½ m v²' },
    { code: 'KS3', text: 'Work done and energy changes on deformation; work done = force × distance' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const cv = $('work'), ctx = cv.getContext('2d');
const W = 800, H = 360, g = 9.8, BOX_M = 20;
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }
const fmt = (x) => PK.sig(x, 3);
const SURF = { ice: { name: 'ice', mu: 0.05, col: '#b3e5fc' }, wood: { name: 'a wooden floor', mu: 0.3, col: '#c8a27a' }, carpet: { name: 'carpet', mu: 0.6, col: '#b0566b' } };

const state = { tab: 'push', surface: 'wood', F: 80, m: 10, s: 5, x: 0, v: 0, running: false, done: false, heat: 0 };
const friction = () => SURF[state.surface].mu * BOX_M * g;

function reset() { Object.assign(state, { x: 0, v: 0, running: false, done: false, heat: 0 }); render(); }

function step(dt) {
  if (!state.running) return;
  if (state.tab === 'push') {
    const f = friction();
    if (state.F <= f) { state.running = false; state.done = true; render(); return; }    // it doesn't move
    const a = (state.F - f) / BOX_M;
    state.v += a * dt * 1.0; state.x += state.v * dt;
    state.heat = Math.min(1, state.heat + dt * f / 150);
    if (state.x >= state.s) { state.x = state.s; state.running = false; state.done = true; render(); }
  } else {
    state.x += dt * 0.8;
    if (state.x >= state.s) { state.x = state.s; state.running = false; state.done = true; render(); }
  }
}

function render() {
  const lift = state.tab === 'lift';
  $('force-ctl').hidden = lift; $('mass-ctl').hidden = !lift; $('surface').hidden = lift;
  $('force-val').textContent = `${state.F} N`;
  $('mass-val').textContent = `${state.m} kg`;
  $('dist-label').firstChild.textContent = lift ? 'Height to lift it ' : 'Distance to push it ';
  $('dist-val').textContent = `${state.s} m`;
  let rows = '', work = '';
  if (!lift) {
    const f = friction(), moves = state.F > f;
    const Wd = moves ? state.F * state.s : 0, heat = moves ? f * state.s : 0, ke = Wd - heat;
    rows = `
      <dt>Mass of the box</dt><dd>${BOX_M} kg</dd>
      <dt>Friction from ${SURF[state.surface].name}</dt><dd>${fmt(f)} N</dd>
      <dt>Work done by the push</dt><dd>${PK.ans(`${fmt(Wd)} J`)}</dd>
      <dt>…heating the box and floor</dt><dd>${PK.ans(`${fmt(heat)} J`)}</dd>
      <dt>…as kinetic energy of the box</dt><dd>${PK.ans(`${fmt(ke)} J`)}</dd>`;
    work = moves
      ? `<p><b>Work done</b> = force × distance = ${state.F} N × ${state.s} m = <b>${PK.ans(`${fmt(Wd)} J`)}</b></p>
         <p><b>Work done against friction</b> = ${fmt(f)} N × ${state.s} m = ${PK.ans(`${fmt(heat)} J`)}. This energy is transferred to the thermal energy stores of the box and the floor: they get warmer.</p>
         <p>${ke > 0.5 ? `The rest, ${PK.ans(`${fmt(Wd)} − ${fmt(heat)} = ${fmt(ke)} J`)}, goes into the box’s kinetic energy store: it speeds up.` : 'The push only just balances friction, so nearly all the work heats the box and floor, and the box moves at a steady speed.'}</p>`
      : `<p><b>The box doesn’t move.</b> The push (${state.F} N) isn’t bigger than the friction (${fmt(f)} N). The distance moved is 0, so <b>no work is done</b>: work done = ${state.F} × 0 = 0 J, however hard you push!</p>`;
  } else {
    const F = state.m * g, Wd = F * state.s;
    rows = `
      <dt>Weight (force needed)</dt><dd>${PK.ans(`${fmt(F)} N`)}</dd>
      <dt>Work done lifting it</dt><dd>${PK.ans(`${fmt(Wd)} J`)}</dd>
      <dt>Gain in gravitational potential energy</dt><dd>${PK.ans(`${fmt(Wd)} J`)}</dd>`;
    work = `<p><b>Force needed</b> = weight = m × g = ${state.m} × ${g} = ${PK.ans(`${fmt(F)} N`)}</p>
      <p><b>Work done</b> = force × distance = ${PK.ans(`${fmt(F)} × ${state.s} = <b>${fmt(Wd)} J</b>`)}</p>
      <p>This is the same as the gain in gravitational potential energy: E<sub>p</sub> = m g h = ${PK.ans(`${state.m} × ${g} × ${state.s} = ${fmt(Wd)} J`)}.</p>`;
  }
  $('readout').innerHTML = rows;
  $('working').innerHTML = work;
  $('go').disabled = state.running;
}

// ---------- Picture ----------

function person(x, y, push, lifting) {
  ctx.strokeStyle = PK.cssVar('--text'); ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - 112, 13, 0, Math.PI * 2); ctx.stroke();
  const lean = push ? 14 : 0;
  ctx.beginPath(); ctx.moveTo(x, y - 99); ctx.lineTo(x - lean, y - 50);
  ctx.moveTo(x - lean, y - 50); ctx.lineTo(x - lean - 18, y); ctx.moveTo(x - lean, y - 50); ctx.lineTo(x - lean + 12, y);
  if (lifting === null) { ctx.moveTo(x, y - 88); ctx.lineTo(x + 34, y - 72); ctx.moveTo(x, y - 84); ctx.lineTo(x + 34, y - 62); }
  ctx.stroke();
}
function arrow(x0, y0, x1, y1, col, label) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * 10, y1 - Math.sin(a) * 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(a - 0.5) * 14, y1 - Math.sin(a - 0.5) * 14); ctx.lineTo(x1 - Math.cos(a + 0.5) * 14, y1 - Math.sin(a + 0.5) * 14); ctx.closePath(); ctx.fill();
  if (label) { ctx.font = `800 13px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(label, (x0 + x1) / 2, Math.min(y0, y1) - 6); }
}
function draw() {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(0, 0, W, H);
  const ink = PK.cssVar('--text');
  if (state.tab === 'push') {
    const S = SURF[state.surface], floorY = 280, px0 = 120, scale = 52;
    ctx.fillStyle = S.col; ctx.fillRect(0, floorY, W, 30);
    // Distance markers
    ctx.strokeStyle = PK.cssVar('--muted'); ctx.lineWidth = 1; ctx.fillStyle = PK.cssVar('--muted'); ctx.font = `600 11px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let m = 0; m <= 10; m++) { const x = px0 + 60 + m * scale; ctx.beginPath(); ctx.moveTo(x, floorY + 30); ctx.lineTo(x, floorY + 38); ctx.stroke(); ctx.fillText(`${m} m`, x, floorY + 40); }
    const goalX = px0 + 60 + state.s * scale;
    ctx.strokeStyle = '#2e7d32'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(goalX, 120); ctx.lineTo(goalX, floorY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#2e7d32'; ctx.textBaseline = 'bottom'; ctx.font = `700 12px ${font()}`; ctx.fillText(`${state.s} m`, goalX, 116);
    // Box (front edge at the distance moved)
    const bx = px0 + 60 + state.x * scale - 0, bw = 90, bh = 80;
    const hot = state.heat;
    ctx.fillStyle = `rgb(${Math.round(176 + 70 * hot)}, ${Math.round(124 - 30 * hot)}, ${Math.round(80 - 40 * hot)})`;
    ctx.fillRect(bx - bw, floorY - bh, bw, bh);
    ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 2; ctx.strokeRect(bx - bw, floorY - bh, bw, bh);
    ctx.fillStyle = '#fff'; ctx.font = `800 14px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${BOX_M} kg`, bx - bw / 2, floorY - bh / 2);
    // Heat shimmer from friction
    if (hot > 0.05) { ctx.strokeStyle = `rgba(239, 83, 80, ${hot})`; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const x = bx - bw + 15 + i * 22, t = performance.now() / 300 + i; ctx.beginPath(); ctx.moveTo(x, floorY - 2); ctx.quadraticCurveTo(x + Math.sin(t) * 6, floorY - 10, x, floorY - 18); ctx.stroke(); } }
    person(bx - bw - 40, floorY, true, null);
    // Forces
    const f = friction();
    arrow(bx - bw - 6, floorY - 50, bx - bw - 6 + 20 + state.F * 0.6, floorY - 50, '#1e63c6', `push ${state.F} N`);
    if (state.running || state.done || state.F > 0) arrow(bx - bw / 2, floorY + 8, bx - bw / 2 - 20 - Math.min(state.F, f) * 0.6, floorY + 8, '#c62828', '');
    ctx.fillStyle = '#c62828'; ctx.font = `800 13px ${font()}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(`friction ${fmt(Math.min(state.F, f))} N`, bx - bw / 2 - 24, floorY + 54);
    // Distance moved
    if (state.x > 0) { ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px0 + 60, 140); ctx.lineTo(px0 + 60 + state.x * scale, 140); ctx.stroke(); ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(`moved ${fmt(state.x)} m`, px0 + 60 + (state.x * scale) / 2, 136); }
    if (state.done && state.x === 0) { ctx.fillStyle = '#c62828'; ctx.font = `800 16px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('It won’t budge! No distance moved, so no work done.', W / 2, 60); }
  } else {
    // Lifting with a rope over a pulley
    const groundY = 320, scale = 26, h = state.x * scale;
    ctx.fillStyle = PK.cssVar('--surface-2'); ctx.fillRect(0, groundY, W, 40);
    ctx.fillStyle = '#90a4ae'; ctx.fillRect(390, 20, 220, 10);
    ctx.strokeStyle = '#607d8b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(560, 40, 14, 0, Math.PI * 2); ctx.stroke();
    const top = groundY - 60 - h;
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(574, 40); ctx.lineTo(574, top); ctx.moveTo(546, 40); ctx.lineTo(470, groundY - 90); ctx.stroke();
    const side = 30 + Math.sqrt(state.m) * 5;
    ctx.fillStyle = '#78909c'; ctx.fillRect(574 - side / 2, top, side, 60);
    ctx.fillStyle = '#fff'; ctx.font = `800 13px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${state.m} kg`, 574, top + 30);
    person(450, groundY, false, true);
    // Height scale
    ctx.strokeStyle = PK.cssVar('--muted'); ctx.fillStyle = PK.cssVar('--muted'); ctx.lineWidth = 1; ctx.font = `600 11px ${font()}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let m = 0; m <= 10; m++) { const y = groundY - m * scale; ctx.beginPath(); ctx.moveTo(670, y); ctx.lineTo(680, y); ctx.stroke(); ctx.fillText(`${m} m`, 664, y); }
    ctx.strokeStyle = '#2e7d32'; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(600, groundY - state.s * scale); ctx.lineTo(690, groundY - state.s * scale); ctx.stroke(); ctx.setLineDash([]);
    arrow(612, top + 60, 612, top + 10, '#1e63c6', '');
    ctx.fillStyle = '#1e63c6'; ctx.font = `800 13px ${font()}`; ctx.textAlign = 'right'; ctx.fillText(`${fmt(state.m * g)} N`, 574 - side / 2 - 8, top + 35);
    // Energy bar
    const Ep = state.m * g * state.x;
    ctx.fillStyle = ink; ctx.font = `700 13px ${font()}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Gravitational potential energy gained', 30, 30);
    ctx.fillStyle = PK.cssVar('--surface-2'); ctx.fillRect(30, 52, 300, 22);
    ctx.fillStyle = '#7c3aed'; ctx.fillRect(30, 52, 300 * Math.min(1, Ep / (50 * g * 10)), 22);
    ctx.fillStyle = ink; ctx.fillText(`${PK.ansText(fmt(Ep))} J`, 30, 80);
  }
}

// ---------- Controls ----------

$('go').addEventListener('click', () => { if (state.done) reset(); state.running = true; state.done = false; render(); });
$('reset').addEventListener('click', reset);
$('force').addEventListener('input', (e) => { state.F = Number(e.target.value); reset(); });
$('mass').addEventListener('input', (e) => { state.m = Number(e.target.value); reset(); });
$('dist').addEventListener('input', (e) => { state.s = Number(e.target.value); reset(); });
document.querySelectorAll('#surface .chip').forEach((b) => b.addEventListener('click', () => {
  state.surface = b.dataset.s;
  document.querySelectorAll('#surface .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  reset();
}));
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => {
  state.tab = b.dataset.t;
  document.querySelectorAll('#tabs .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  window.history.replaceState(null, '', `#${state.tab}`);
  reset();
}));
window.addEventListener('pk-answers', render);
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); draw(); requestAnimationFrame(frame); }
if (location.hash === '#lift') { state.tab = 'lift'; document.querySelectorAll('#tabs .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.t === 'lift'))); }
size(); render(); requestAnimationFrame(frame);
