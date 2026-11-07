// Momentum and collisions: two gliders on an air track (no friction) that stick or bounce,
// an "explosion" where a spring pushes them apart from rest, and a car crash showing that
// a longer stopping time (crumple zone) means a smaller force: F = m Δv ÷ Δt.
// Velocities to the right are positive.

PK.header({
  title: 'Momentum & collisions',
  answers: true,
  spec: [
    { code: '4.5.7.1', text: 'Momentum is a property of moving objects: p = m v', ht: true },
    { code: '4.5.7.2', text: 'Conservation of momentum: in a closed system, the total momentum before an event is equal to the total momentum after the event', ht: true },
    { code: '4.5.7.2', text: 'Collisions and explosions: calculating velocities from conservation of momentum', ht: true },
    { code: '4.5.7.3', text: 'Changes in momentum: F = m Δv ÷ Δt; force equals the rate of change of momentum', ht: true, po: true },
    { code: '4.5.7.3', text: 'Safety features that increase the time taken for a change in momentum: air bags, seat belts, crumple zones, cushioned surfaces, cycle helmets', ht: true, po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const TRACK = 1.8, WID = 0.14;          // track length and glider length (m)
const CRUMPLE_T = 0.12, RIGID_T = 0.03;  // stopping times in the crash (s)
const SLOW = 12;                         // the crash is shown this many times slower than real life

const state = { tab: 'collide', kind: 'stick' };
const num = (id) => Number($(id).value);

// ---------- Physics ----------

// Velocities after a collision of A (left) with B (right)
function collideAfter(ma, ua, mb, ub, kind) {
  if (kind === 'stick') { const v = (ma * ua + mb * ub) / (ma + mb); return { va: v, vb: v }; }
  return { va: ((ma - mb) * ua + 2 * mb * ub) / (ma + mb), vb: ((mb - ma) * ub + 2 * ma * ua) / (ma + mb) };
}
// An explosion from rest: the spring's energy E is shared so that momentum stays zero
function explodeAfter(ma, mb, E) {
  return { va: -Math.sqrt((2 * E * mb) / (ma * (ma + mb))), vb: Math.sqrt((2 * E * ma) / (mb * (ma + mb))) };
}

// The moving picture
const sim = { phase: 'ready', xa: 0, xb: 0, va: 0, vb: 0, hit: false, t: 0 };
const crash = { phase: 'ready', x: 0, v: 0, t: 0, squash: 0 };

function reset() {
  sim.phase = 'ready'; sim.hit = false; sim.t = 0;
  if (state.tab === 'explode') { sim.xb = TRACK / 2; sim.xa = TRACK / 2 - WID; sim.va = 0; sim.vb = 0; }
  else { sim.xa = 0.15; sim.xb = 1.0; sim.va = num('ua'); sim.vb = num('ub'); }
  Object.assign(crash, { phase: 'ready', x: 0, v: num('cv'), t: 0, squash: 0 });
  $('go').disabled = false;
  render();
}

function go() {
  if (sim.phase === 'done' || crash.phase === 'done') reset();
  if (state.tab === 'safety') { crash.phase = 'driving'; crash.v = num('cv'); }
  else if (state.tab === 'explode') {
    const { va, vb } = explodeAfter(num('ea'), num('eb'), num('espring'));
    Object.assign(sim, { va, vb, phase: 'running', hit: true });
  } else sim.phase = 'running';
  $('go').disabled = true;
  render();
}

function step(dt) {
  if (state.tab === 'safety') return stepCrash(dt);
  if (sim.phase !== 'running') return;
  sim.t += dt;
  sim.xa += sim.va * dt; sim.xb += sim.vb * dt;
  if (state.tab === 'collide' && !sim.hit && sim.xa + WID >= sim.xb && sim.va > sim.vb) {
    sim.xa = sim.xb - WID;
    const after = collideAfter(num('ma'), num('ua'), num('mb'), num('ub'), state.kind);
    sim.va = after.va; sim.vb = after.vb; sim.hit = true;
    render();
  }
  // Stop when a glider reaches either end, or nothing more can happen
  const off = sim.xa < 0 || sim.xb + WID > TRACK || sim.xa + WID > TRACK || sim.xb < 0;
  const stuckStill = sim.hit && Math.abs(sim.va) < 1e-6 && Math.abs(sim.vb) < 1e-6;
  const neverMeet = !sim.hit && sim.va <= sim.vb && sim.t > 0.5;
  if (off || stuckStill || neverMeet || sim.t > 20) { sim.phase = 'done'; $('go').disabled = false; render(); }
}

// The car drives towards the wall at its real speed (scaled), then stops over the stopping time, slowed down
const ROAD = 12, WALL = 10.5, CAR_LEN = 4.2;  // metres shown, where the wall is, and the car's length
function stepCrash(dt) {
  if (crash.phase === 'driving') {
    crash.x += Math.min(crash.v, 12) * dt * 0.6;     // drive in at a comfortable on-screen speed
    if (crash.x + CAR_LEN >= WALL) { crash.x = WALL - CAR_LEN; crash.phase = 'stopping'; crash.t = 0; }
  } else if (crash.phase === 'stopping') {
    const T = stopTime(), v0 = num('cv');
    crash.t = Math.min(T, crash.t + dt / SLOW);
    crash.v = v0 * (1 - crash.t / T);
    crash.squash = v0 * crash.t - (v0 * crash.t * crash.t) / (2 * T);   // distance crushed so far
    if (crash.t >= T) { crash.phase = 'done'; crash.v = 0; $('go').disabled = false; render(); }
  }
}
const stopTime = () => ($('crumple').checked ? CRUMPLE_T : RIGID_T);

// ---------- Numbers ----------

const f2 = (x) => { const r = Math.abs(x) < 0.005 ? 0 : x; return r.toFixed(2); };
const sgn = (x) => (Math.abs(x) < 0.005 ? '0.00' : (x > 0 ? '+' : '−') + Math.abs(x).toFixed(2));
const ke = (m, v) => 0.5 * m * v * v;

function render() {
  for (const id of ['ma', 'mb', 'ea', 'eb']) $(`${id}-val`).textContent = `${num(id).toFixed(1)} kg`;
  for (const id of ['ua', 'ub']) $(`${id}-val`).textContent = `${sgn(num(id))} m/s`;
  $('espring-val').textContent = `${num('espring').toFixed(2)} J`;
  $('cm-val').textContent = `${num('cm')} kg`;
  $('cv-val').textContent = `${num('cv')} m/s`;
  $('dir-note').textContent = state.tab === 'safety' ? `The crash itself is shown ${SLOW} times slower than real life.` : 'Velocities to the right are positive.';
  if (state.tab === 'safety') return renderSafety();
  renderGliders();
}

function renderGliders() {
  const explode = state.tab === 'explode';
  const ma = num(explode ? 'ea' : 'ma'), mb = num(explode ? 'eb' : 'mb');
  const ua = explode ? 0 : num('ua'), ub = explode ? 0 : num('ub');
  const after = explode ? explodeAfter(ma, mb, num('espring')) : collideAfter(ma, ua, mb, ub, state.kind);
  const showKe = $('show-ke').checked || explode;
  const happened = sim.hit;
  const neverMeet = !explode && ua <= ub;
  const row = (who, m, v, ans) => `<tr><td>${who}</td><td>${f2(m)}</td><td>${ans ? PK.ans(sgn(v)) : sgn(v)}</td><td>${PK.ans(sgn(m * v))}</td>${showKe ? `<td>${PK.ans(ke(m, v).toFixed(3))}</td>` : ''}</tr>`;
  const head = `<tr><th></th><th>m (kg)</th><th>v (m/s)</th><th>p = m v (kg m/s)</th>${showKe ? '<th>KE = ½ m v² (J)</th>' : ''}</tr>`;
  const pBefore = ma * ua + mb * ub, pAfter = ma * after.va + mb * after.vb;
  const keBefore = ke(ma, ua) + ke(mb, ub), keAfter = ke(ma, after.va) + ke(mb, after.vb);
  const total = (p, k) => `<tr class="sum"><td><b>Total</b></td><td></td><td></td><td class="total">${PK.ans(sgn(p))}</td>${showKe ? `<td class="total">${PK.ans(k.toFixed(3))}</td>` : ''}</tr>`;
  let afterRows;
  if (!happened) afterRows = `<tr><td colspan="${showKe ? 5 : 4}" class="note">${neverMeet ? 'Glider A never catches up with B, so they don’t collide.' : `Press <b>Go</b> to see what happens. Can you predict the velocities${explode ? '' : ' first'}?`}</td></tr>`;
  else if (!explode && state.kind === 'stick') afterRows = row('<span class="glider-a">A</span> + <span class="glider-b">B</span> together', ma + mb, after.va, true) + total(pAfter, keAfter);
  else afterRows = row('<span class="glider-a">A</span>', ma, after.va, true) + row('<span class="glider-b">B</span>', mb, after.vb, true) + total(pAfter, keAfter);
  $('table-title').textContent = explode ? 'Momentum before and after the explosion' : 'Momentum before and after the collision';
  $('table').innerHTML = `<table class="mtable">
    <thead>${head}</thead>
    <tbody><tr><th colspan="${showKe ? 5 : 4}" style="text-align:left">Before</th></tr>
      ${explode ? row('<span class="glider-a">A</span> + <span class="glider-b">B</span> at rest', ma + mb, 0) : row('<span class="glider-a">A</span>', ma, ua) + row('<span class="glider-b">B</span>', mb, ub)}
      ${total(pBefore, keBefore)}
      <tr><th colspan="${showKe ? 5 : 4}" style="text-align:left">After</th></tr>
      ${afterRows}</tbody></table>`;
  let v = '';
  if (happened && PK.answersShown()) {
    v = `Total momentum before = total momentum after = ${sgn(pBefore)} kg m/s, so momentum is conserved.`;
    if (explode) v += ` The gliders move apart with equal and opposite momentum. The lighter glider moves faster. The kinetic energy (${keAfter.toFixed(3)} J) came from the spring’s elastic potential store.`;
    else if (showKe) v += state.kind === 'stick'
      ? ` Kinetic energy is not conserved: ${(keBefore - keAfter).toFixed(3)} J is transferred to the thermal store of the gliders and surroundings, and as sound.`
      : ' These collisions are perfectly elastic, so no kinetic energy is lost. Real collisions always lose some.';
  } else if (happened) v = 'Turn on Answers to check the totals.';
  $('verdict').textContent = v;
}

function renderSafety() {
  const m = num('cm'), v = num('cv'), T = stopTime();
  const dp = m * v, F = dp / T, other = dp / (T === CRUMPLE_T ? RIGID_T : CRUMPLE_T);
  $('safety-readout').innerHTML = `
    <dt>Momentum before (m v)</dt><dd>${PK.ans(`${dp.toLocaleString('en-GB')} kg m/s`)}</dd>
    <dt>Momentum after</dt><dd>0 kg m/s</dd>
    <dt>Stopping time (Δt)</dt><dd>${T} s</dd>
    <dt>Force (Δp ÷ Δt)</dt><dd>${PK.ans(`${Math.round(F).toLocaleString('en-GB')} N`)}</dd>
    <dt>Deceleration (Δv ÷ Δt)</dt><dd>${PK.ans(`${Math.round(v / T)} m/s² (${(v / T / 9.8).toFixed(0)} g)`)}</dd>`;
  $('table-title').textContent = 'The force on the car';
  const max = Math.max(F, other);
  const bar = (label, val, on) => `<div class="bar"><span>${label}</span><span><span class="fill" style="width:${(val / max) * 100}%;${on ? '' : 'opacity:.45'}"></span> ${PK.ans(`${Math.round(val).toLocaleString('en-GB')} N`)}</span></div>`;
  $('table').innerHTML = `<p class="note" style="margin-top:0">The car’s momentum always falls by the same amount (${PK.ans(`${dp.toLocaleString('en-GB')} kg m/s`)}). What changes is how long it takes.</p>
    <div class="bars">${bar(`With a crumple zone (${CRUMPLE_T} s)`, dp / CRUMPLE_T, T === CRUMPLE_T)}${bar(`Without (${RIGID_T} s)`, dp / RIGID_T, T === RIGID_T)}</div>`;
  $('verdict').textContent = PK.answersShown()
    ? `Stopping in ${CRUMPLE_T} s instead of ${RIGID_T} s makes the force ${(RIGID_T === 0 ? 0 : CRUMPLE_T / RIGID_T).toFixed(0)} times smaller, because force = change in momentum ÷ time.`
    : '';
}

// ---------- Drawing ----------

const cv = $('track'), ctx = cv.getContext('2d');
const W = 800, H = 300, X0 = 40, PPM = (W - 2 * X0) / TRACK, TRACK_Y = 200;
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }

function arrow(x, y, len, col, label, font) {
  if (Math.abs(len) < 2) return;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  const d = Math.sign(len);
  ctx.beginPath(); ctx.moveTo(x + len, y); ctx.lineTo(x + len - d * 10, y - 6); ctx.lineTo(x + len - d * 10, y + 6); ctx.closePath(); ctx.fill();
  if (label) { ctx.font = `700 12px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(label, x + len / 2, y - 6); }
}

function drawGlider(x, colour, letter, m, v, c) {
  const px = X0 + x * PPM, w = WID * PPM, top = TRACK_Y - 34;
  // Body: an upside-down V sitting on the track, with a flag
  ctx.fillStyle = colour; ctx.fillRect(px, top, w, 26);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(px, top + 20, w, 6);
  ctx.fillStyle = '#fff'; ctx.font = `800 15px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(letter, px + w / 2, top + 11);
  // Mass blocks on top
  const blocks = Math.round(m * 10);
  for (let i = 0; i < blocks; i++) { ctx.fillStyle = i % 2 ? '#b08d57' : '#c9a66b'; ctx.fillRect(px + 4 + (i % 5) * 10, top - 9 - Math.floor(i / 5) * 9, 9, 8); }
  ctx.fillStyle = c.text; ctx.font = `700 12px ${c.font}`; ctx.textBaseline = 'top';
  ctx.fillText(`${m.toFixed(1)} kg`, px + w / 2, TRACK_Y + 26);
  // Velocity arrow
  arrow(px + w / 2, top - 34, v * 70, colour, `${sgn(v)} m/s`, c.font);
}

function drawTrack(c) {
  ctx.fillStyle = '#9aa3ae'; ctx.fillRect(X0 - 10, TRACK_Y - 8, W - 2 * X0 + 20, 16);
  ctx.fillStyle = '#6d7580';
  for (let x = X0; x < W - X0; x += 14) { ctx.beginPath(); ctx.arc(x, TRACK_Y - 1, 1.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#5d6470'; ctx.fillRect(X0 - 22, TRACK_Y - 30, 12, 46); ctx.fillRect(W - X0 + 10, TRACK_Y - 30, 12, 46);
  ctx.fillRect(80, TRACK_Y + 8, 12, 70); ctx.fillRect(W - 92, TRACK_Y + 8, 12, 70);
  ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('air track (no friction)', 102, TRACK_Y + 52);
}

function drawCrash(c) {
  const ppm = (W - 2 * X0) / ROAD, roadY = 230;
  ctx.fillStyle = '#7d8590'; ctx.fillRect(0, roadY, W, 40);
  ctx.fillStyle = '#e8e8e8'; for (let x = 10; x < W; x += 60) ctx.fillRect(x, roadY + 18, 30, 4);
  // The wall
  const wx = X0 + WALL * ppm;
  for (let r = 0; r < 9; r++) for (let k = 0; k < 3; k++) {
    ctx.fillStyle = (r + k) % 2 ? '#a5523b' : '#b9623f';
    ctx.fillRect(wx + k * 22 + (r % 2 ? 11 : 0), roadY - (r + 1) * 20, 21, 19);
  }
  // The car: its front squashes against the wall
  const len = CAR_LEN, squash = Math.min(crash.squash, 1.2);
  const front = X0 + Math.min(crash.x + len, WALL) * ppm;
  const back = front - (len - squash) * ppm;
  const bodyCol = '#1e88e5';
  ctx.fillStyle = bodyCol;
  ctx.fillRect(back, roadY - 62, front - back, 38);
  ctx.beginPath(); ctx.moveTo(back + 0.25 * (front - back), roadY - 62); ctx.lineTo(back + 0.35 * (front - back), roadY - 96); ctx.lineTo(back + 0.7 * (front - back), roadY - 96); ctx.lineTo(back + 0.82 * (front - back), roadY - 62); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#cfe8ff'; ctx.fillRect(back + 0.38 * (front - back), roadY - 90, 0.28 * (front - back), 24);
  // Crumpled front shown as zig-zags
  if (squash > 0.02 && $('crumple').checked) {
    ctx.strokeStyle = '#0d47a1'; ctx.lineWidth = 2; ctx.beginPath();
    const zx = front - 0.9 * ppm;
    for (let i = 0; i <= 8; i++) ctx.lineTo(zx + (i % 2 ? 10 : 0) + (i / 8) * (front - zx - 10), roadY - 60 + (i % 2 ? 8 : 0) + i * 4);
    ctx.stroke();
  }
  ctx.fillStyle = '#111';
  for (const fx of [0.2, 0.78]) { ctx.beginPath(); ctx.arc(back + fx * (front - back), roadY - 22, 13, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  const label = crash.phase === 'stopping' ? `stopping… ${crash.v.toFixed(1)} m/s` : crash.phase === 'done' ? 'stopped' : `${num('cv')} m/s`;
  ctx.fillText(label, (back + front) / 2, roadY - 104);
  if (crash.phase !== 'done') arrow(front + 6, roadY - 120, Math.max(0, crash.v) * 3, '#1e88e5', '', c.font);
}

function draw() {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  if (state.tab === 'safety') return drawCrash(c);
  drawTrack(c);
  const explode = state.tab === 'explode';
  if (explode && !sim.hit) {
    // Squashed spring between the gliders
    const sx = X0 + sim.xb * PPM;
    ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 8; i++) ctx.lineTo(sx - 6 + (i % 2 ? 12 : 0), TRACK_Y - 30 + i * 2.5);
    ctx.stroke();
  }
  const stuck = !explode && sim.hit && state.kind === 'stick';
  drawGlider(sim.xa, '#1e88e5', 'A', num(explode ? 'ea' : 'ma'), sim.phase === 'ready' && !explode ? num('ua') : sim.va, c);
  drawGlider(sim.xb, '#e53935', 'B', num(explode ? 'eb' : 'mb'), stuck ? 0 : (sim.phase === 'ready' && !explode ? num('ub') : sim.vb), c);
  if (stuck) { ctx.fillStyle = c.muted; ctx.font = `700 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('stuck together', X0 + (sim.xb) * PPM, TRACK_Y + 42); }
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.t === t)));
  $('p-collide').hidden = t !== 'collide'; $('p-explode').hidden = t !== 'explode'; $('p-safety').hidden = t !== 'safety';
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'collide' ? location.pathname + location.search : `#${t}`);
  reset();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#kind .chip').forEach((b) => b.addEventListener('click', () => {
  state.kind = b.dataset.k;
  document.querySelectorAll('#kind .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  reset();
}));
for (const id of ['ma', 'ua', 'mb', 'ub', 'ea', 'eb', 'espring', 'cm', 'cv']) $(id).addEventListener('input', reset);
$('show-ke').addEventListener('change', render);
$('crumple').addEventListener('change', reset);
$('go').addEventListener('click', go);
$('reset').addEventListener('click', reset);
window.addEventListener('pk-answers', render);
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  for (let i = 0; i < 5; i++) step(dt / 5);
  draw();
  requestAnimationFrame(frame);
}
size();
const startTab = ['explode', 'safety'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'collide';
showTab(startTab);
requestAnimationFrame(frame);
