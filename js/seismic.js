// Seismic waves (Physics only, HT).
// Through the Earth: P and S rays are traced through a simple Earth (speeds rise with depth in the
// mantle, so rays curve back up). S waves stop at the liquid outer core. P waves slow down and refract
// at the core, so none arrive directly between about 103° and 142°: the shadow zones that show the
// outer core is liquid and how big the core is.
// P and S waves: rows of particles show longitudinal (P) and transverse (S) waves, and what happens
// when they reach a liquid.

PK.header({
  title: 'Seismic waves',
  spec: [
    { code: '4.6.1.5', text: 'P-waves are longitudinal seismic waves. P-waves travel at different speeds through solids and liquids', po: true, ht: true },
    { code: '4.6.1.5', text: 'S-waves are transverse seismic waves. S-waves cannot travel through a liquid', po: true, ht: true },
    { code: '4.6.1.5', text: 'P-waves and S-waves provide evidence for the structure and size of the Earth’s core, which can’t be observed directly', po: true, ht: true },
    { code: '4.6.1.1', text: 'Transverse and longitudinal waves: the direction of the vibrations compared with the direction the wave travels' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 440;
const state = { tab: 'earth', t: 0 };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const dark = () => PK.isDark();
const P_COL = () => (dark() ? '#64b5f6' : '#1e63c6'), S_COL = () => (dark() ? '#ef9a9a' : '#d32f2f');

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800, halo = c.surface) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
const mins = (s) => `${Math.floor(s / 60)} min ${String(Math.floor(s % 60)).padStart(2, '0')} s`;

// ---------- The Earth, and the rays through it ----------
// Radius 1 is the surface. Speeds in km/s: inner core below 0.19, liquid outer core to 0.546, then the
// mantle. The mantle speeds are a little simpler than the real Earth's, chosen so the shadow zones come
// out where the textbooks put them.
const ICB = 0.19, CMB = 0.546;
const vP = (x) => (x < ICB ? 11.1 : x < CMB ? 10.36 - (2.3 * (x - ICB)) / (CMB - ICB) : 13.7 - (1.6 * (x - CMB)) / (1 - CMB));
const vS = (x) => (x < CMB ? 0 : 7.3 - (0.65 * (x - CMB)) / (1 - CMB));
// Follow a ray from just below the surface, keeping r sin(i) ÷ v the same (Snell's law in layers).
// Returns its points (x, angle round the Earth θ, time t) and where it comes back up, if it does.
function traceRay(v, takeoff) {
  const ds = 0.0005, pts = [];
  let x = 0.999, th = 0, t = 0, down = true;
  const p = (x * Math.sin(takeoff)) / v(x);
  for (let k = 0; k < 40000; k++) {
    const vx = v(x);
    let s = (p * vx) / x;
    if (s >= 1) { down = !down; s = 0.9999; }   // the ray turns back up
    const nx = x + (down ? -1 : 1) * Math.sqrt(1 - s * s) * ds, vn = v(nx);
    if (vn === 0) { pts.push(x, th, t); return { pts, stop: true }; }   // an S wave reaching the liquid outer core
    if ((p * vn) / nx >= 1 && Math.abs(vn - vx) > 0.3) return { pts, lost: true };   // can't get through a boundary
    x = nx; th += (s * ds) / x; t += (ds * 6371) / vx;
    if (k % 6 === 0) pts.push(x, th, t);
    if (!down && x >= 0.999) { pts.push(x, th, t); return { pts, arrive: th, t }; }
  }
  return { pts, lost: true };
}
const RAYS = { P: [], S: [] };
for (const [k, v] of [['P', vP], ['S', vS]]) {
  for (let d = 0.25; d < 90; d += 0.25) {
    const r = traceRay(v, (d * Math.PI) / 180);
    const deg = r.arrive ? (r.arrive * 180) / Math.PI : null;
    // A few rays through the inner core come up inside the P shadow zone; real ones are very weak, so leave them out
    if (deg !== null && deg > 104 && deg < 140) continue;
    RAYS[k].push({ ...r, deg: deg !== null && deg > 180 ? 360 - deg : deg, d });
  }
}
// The first arrival of each kind of wave at an angle Δ from the earthquake (null: none arrive)
function arrival(k, delta) {
  let best = null;
  for (const r of RAYS[k]) if (r.deg !== null && Math.abs(r.deg - delta) < 1.2 && (best === null || r.t < best)) best = r.t;
  return best;
}
const EX = 250, EY = 222, ER = 196;
const quake = { phi: 0, T: -1, running: false, sel: 4 };   // phi: where the earthquake is (rad, from the top); T: seconds since it
const STATIONS = Array.from({ length: 24 }, (_, i) => (i * 15 * Math.PI) / 180);
const distance = (a) => { let d = Math.abs(((a - quake.phi) * 180) / Math.PI) % 360; if (d > 180) d = 360 - d; return d; };
const toXY = (x, ang) => [EX + ER * x * Math.sin(ang), EY - ER * x * Math.cos(ang)];
const END = 1500;   // the animation stops 25 minutes after the earthquake
const SPEEDUP = 100;   // 1 s on screen is 100 s

function drawEarth(c) {
  // Layers
  const layer = (r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(EX, EY, ER * r, 0, Math.PI * 2); ctx.fill(); };
  layer(1, '#7a4a2e'); layer(0.985, dark() ? '#a0522d' : '#c8794a'); layer(CMB, '#f2a33a'); layer(ICB, '#ffd54f');
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5;
  for (const r of [CMB, ICB]) { ctx.beginPath(); ctx.arc(EX, EY, ER * r, 0, Math.PI * 2); ctx.stroke(); }
  // Rays, up to the time now (every 8th ray, so it isn't too busy)
  const T = quake.T, draw = (k, col) => {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
    RAYS[k].forEach((r, i) => {
      if (i % 8) return;
      for (const side of [1, -1]) {
        ctx.beginPath();
        let head = null;
        for (let j = 0; j < r.pts.length; j += 3) {
          if (r.pts[j + 2] > T) break;
          const [px, py] = toXY(r.pts[j], quake.phi + side * r.pts[j + 1]);
          if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          head = [px, py];
        }
        ctx.stroke();
        const ended = r.pts[r.pts.length - 1] <= T;
        if (head && !ended) { ctx.beginPath(); ctx.arc(head[0], head[1], 2.6, 0, Math.PI * 2); ctx.fill(); }
      }
    });
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  };
  if (T >= 0) { if ($('showp').checked) draw('P', P_COL()); if ($('shows').checked) draw('S', S_COL()); }
  if ($('layers').checked) {
    const lab = (t, x, y) => tag(c, t, x, y, '#2a1a0e', 'center', 12, 800, 'rgba(255,255,255,.75)');
    lab('inner core (solid)', EX, EY); lab('outer core (liquid)', EX, EY - ER * 0.37); lab('mantle (solid)', EX, EY + ER * 0.77); lab('crust', EX - ER * 0.78, EY + ER * 0.66);
  }
  // Shadow zones, once all the waves have arrived
  if (T >= 1300) {
    ctx.lineWidth = 6; ctx.setLineDash([8, 6]);
    for (const side of [1, -1]) {
      ctx.strokeStyle = S_COL(); ctx.beginPath(); ctx.arc(EX, EY, ER + 20, quake.phi - Math.PI / 2 + side * (105 * Math.PI) / 180, quake.phi - Math.PI / 2 + side * Math.PI, side < 0); ctx.stroke();
      ctx.strokeStyle = P_COL(); ctx.beginPath(); ctx.arc(EX, EY, ER + 12, quake.phi - Math.PI / 2 + side * (103 * Math.PI) / 180, quake.phi - Math.PI / 2 + side * (142 * Math.PI) / 180, side < 0); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.lineWidth = 1;
  }
  // Seismometers round the surface
  STATIONS.forEach((a, i) => {
    const d = distance(a), [x, y] = toXY(1.04, a), tp = arrival('P', d), ts = arrival('S', d);
    const gotP = tp !== null && T >= tp, gotS = ts !== null && T >= ts;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = gotP && gotS ? '#7b1fa2' : gotP ? P_COL() : gotS ? S_COL() : (T >= 1300 ? '#9e9e9e' : c.surface2);
    ctx.strokeStyle = c.text; ctx.lineWidth = i === quake.sel ? 3 : 1.2;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 5); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore(); ctx.lineWidth = 1;
  });
  // The earthquake: drag it round the surface
  const [qx, qy] = toXY(1, quake.phi);
  ctx.fillStyle = '#ff6f00'; ctx.beginPath();
  for (let k = 0; k < 10; k++) { const r = k % 2 ? 6 : 14, a = (k * Math.PI) / 5; ctx.lineTo(qx + r * Math.sin(a), qy - r * Math.cos(a)); }
  ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
  if (T < 0) tag(c, 'drag me', qx, qy + (Math.cos(quake.phi) > 0 ? 26 : -26), c.text, 'center', 12, 800);
  // Key, clock and the chosen seismometer's trace
  const x0 = 482;
  tag(c, 'P waves', x0 + 22, 30, P_COL(), 'left', 13); tag(c, 'S waves', x0 + 22, 50, S_COL(), 'left', 13);
  ctx.strokeStyle = P_COL(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, 30); ctx.lineTo(x0 + 16, 30); ctx.stroke();
  ctx.strokeStyle = S_COL(); ctx.beginPath(); ctx.moveTo(x0, 50); ctx.lineTo(x0 + 16, 50); ctx.stroke(); ctx.lineWidth = 1;
  tag(c, '▲ seismometer: blue gets P, red gets S, purple both, grey nothing', x0, 72, c.muted, 'left', 11, 700);
  if (T >= 0) tag(c, `Time since the earthquake: ${mins(Math.min(T, END))}`, x0, 100, c.text, 'left', 14, 800);
  if (T >= 1300) { tag(c, '- - shadow zones: no S waves (red), no direct P waves (blue)', x0, 124, c.muted, 'left', 11, 700); }
  drawSeismogram(c, x0, 240, 300, 150);
}
function drawSeismogram(c, x, y, w, h) {
  const d = distance(STATIONS[quake.sel]), tp = arrival('P', d), ts = arrival('S', d), T = quake.T;
  tag(c, `Seismometer ${Math.round(d)}° from the earthquake`, x, y - 22, c.text, 'left', 13, 800);
  ctx.fillStyle = dark() ? '#1b2228' : '#fbfaf5'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = c.border; ctx.strokeRect(x, y, w, h);
  const X = (t) => x + (w * t) / END;
  ctx.strokeStyle = c.muted; ctx.font = `600 11px ${c.font}`; ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let m = 0; m <= 25; m += 5) { ctx.beginPath(); ctx.moveTo(X(m * 60), y + h); ctx.lineTo(X(m * 60), y + h + 4); ctx.stroke(); ctx.fillText(String(m), X(m * 60), y + h + 6); }
  ctx.fillText('minutes after the earthquake', x + w / 2, y + h + 20);
  if (T < 0) { tag(c, 'Waiting for an earthquake', x + w / 2, y + h / 2, c.muted, 'center', 12, 700); return; }
  // A wiggle at each arrival, dying away: S waves shake the ground more
  const amp = (t) => {
    let a = 0;
    if (tp !== null && t > tp) a += 0.35 * Math.exp(-(t - tp) / 120) * Math.sin((t - tp) * 0.9);
    if (ts !== null && t > ts) a += 0.85 * Math.exp(-(t - ts) / 160) * Math.sin((t - ts) * 0.6);
    return a + 0.03 * Math.sin(t * 2.3) * Math.sin(t * 0.37);
  };
  ctx.strokeStyle = c.text; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let t = 0; t <= Math.min(T, END); t += 2) { const py = y + h / 2 - amp(t) * (h / 2 - 6); if (t) ctx.lineTo(X(t), py); else ctx.moveTo(X(t), py); }
  ctx.stroke(); ctx.lineWidth = 1;
  if (tp !== null && T >= tp) tag(c, 'P', X(tp), y + 12, P_COL(), 'center', 14);
  if (ts !== null && T >= ts) tag(c, 'S', X(ts), y + 12, S_COL(), 'center', 14);
}

// ---------- P and S waves ----------

const types = { start: 0 };
const XB = 410;   // the boundary between the two halves
// Displacement at x: a wave coming in from the left. P waves slow down in a liquid; S waves don't get in at all.
function shiftAt(x, kind) {
  const t = state.t - types.start, liquid = pressed('medium') === 'liquid';
  const v1 = kind === 'P' ? 120 : 70, v2 = kind === 'P' ? (liquid ? 80 : 120) : liquid ? 0 : 70;
  let delay;
  if (x <= XB) delay = (x - 50) / v1;
  else if (!v2) return 0;
  else delay = (XB - 50) / v1 + (x - XB) / v2;
  const tt = t - delay;
  return tt <= 0 ? 0 : Math.sin(2 * Math.PI * 0.8 * tt) * Math.min(1, tt / 0.4);
}
function drawTypes(c) {
  const liquid = pressed('medium') === 'liquid';
  ctx.fillStyle = dark() ? '#3e2f24' : '#efe1d3'; ctx.fillRect(40, 40, XB - 40, 360);
  ctx.fillStyle = liquid ? (dark() ? '#20384a' : '#d7ecfa') : (dark() ? '#3e2f24' : '#efe1d3'); ctx.fillRect(XB, 40, 760 - XB, 360);
  ctx.strokeStyle = c.muted; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(XB, 40); ctx.lineTo(XB, 400); ctx.stroke(); ctx.setLineDash([]);
  tag(c, 'solid rock', 225, 30, c.text, 'center', 13); tag(c, liquid ? 'liquid' : 'solid rock', 585, 30, c.text, 'center', 13);
  // Rows of particles. One in each row is red, so you can follow it: it only moves to and fro.
  for (const [kind, y0, col] of [['P', 90, P_COL()], ['S', 270, S_COL()]]) {
    for (let row = 0; row < 5; row++) {
      for (let x = 56; x <= 744; x += 16) {
        const s = shiftAt(x, kind), y = y0 + row * 16;
        const px = kind === 'P' ? x + 7 * s : x, py = kind === 'S' ? y + 14 * s : y;
        const mark = x === 216 && row === 2;
        ctx.fillStyle = mark ? '#ff6f00' : col; ctx.beginPath(); ctx.arc(px, py, mark ? 5 : 3.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  tag(c, 'P wave: longitudinal. The particles vibrate along the direction the wave travels.', 400, 66, P_COL(), 'center', 13);
  tag(c, 'S wave: transverse. The particles vibrate at right angles to the direction the wave travels.', 400, 246, S_COL(), 'center', 13);
  // Direction of travel
  ctx.strokeStyle = c.text; ctx.fillStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 196); ctx.lineTo(150, 196); ctx.stroke(); ctx.beginPath(); ctx.moveTo(158, 196); ctx.lineTo(148, 190); ctx.lineTo(148, 202); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1;
  tag(c, 'direction of travel', 170, 196, c.text, 'left', 12, 700);
  if (liquid) {
    tag(c, 'S waves can’t travel through a liquid', 585, 376, S_COL(), 'center', 13);
    tag(c, 'P waves slow down in the liquid', 585, 196, P_COL(), 'center', 13);
  }
}

// ---------- Words ----------

const INTRO = {
  earth: 'An earthquake sends seismic waves through the Earth. Seismometers all round the world record when P waves and S waves arrive. Where they don’t arrive tells us about the inside of the Earth.',
  types: 'There are two kinds of seismic wave that travel through the Earth: P waves and S waves. Compare how the particles move, and what happens when the waves reach a liquid.',
};
const EXPLAIN = {
  earth: `<ul>
      <li><b>P waves</b> are longitudinal. They travel through solids and liquids, and they’re faster, so they arrive first.</li>
      <li><b>S waves</b> are transverse. They can’t travel through liquids, and they’re slower.</li>
      <li>The waves speed up as they go deeper, so their paths curve. When they cross into a different layer they change speed suddenly, so they refract (change direction).</li>
      <li>No S waves arrive more than about 105° from the earthquake: the <b>S-wave shadow zone</b>. The outer core stops them, so it must be <b>liquid</b>.</li>
      <li>P waves refract as they go into and out of the core, so none arrive directly between about 103° and 142°: the <b>P-wave shadow zone</b>. The size of the shadow zones tells us how big the core is.</li>
      <li>Nobody can drill to the core. Seismic waves gave scientists new evidence about parts of the Earth that can’t be seen.</li>
    </ul>`,
  types: `<ul>
      <li><b>P waves</b> (primary): longitudinal, like a push and pull along a slinky. Faster. They travel through solids and liquids, but change speed when they go from one to the other.</li>
      <li><b>S waves</b> (secondary): transverse, like shaking a rope from side to side. Slower. They can only travel through solids.</li>
      <li>In both, the particles only vibrate about where they are: it’s the wave that travels, carrying energy.</li>
    </ul>`,
};
function render() {
  if (state.tab === 'earth') {
    const T = quake.T, d = distance(STATIONS[quake.sel]), tp = arrival('P', d), ts = arrival('S', d);
    let html = `<dl class="readout"><dt>Chosen seismometer</dt><dd>${Math.round(d)}° away</dd><dt>P waves arrive</dt><dd>${tp === null ? 'none' : T >= tp ? `after ${mins(tp)}` : '…'}</dd><dt>S waves arrive</dt><dd>${ts === null ? 'none' : T >= ts ? `after ${mins(ts)}` : '…'}</dd></dl>`;
    if (T < 0) html += '<p>Press <b>Earthquake!</b> and watch which seismometers pick up P waves and which pick up S waves.</p>';
    else if (T < 1300) html += '<p>The waves spread out through the Earth in all directions. P waves are faster, so they reach each seismometer first.</p>';
    else html += '<p>No S waves reached the far side of the Earth: the liquid outer core stopped them. P waves got through the core, but refracted, leaving a gap where none arrived directly.</p>';
    if (ts === null && tp !== null && T >= 1300) html += '<p>This seismometer got P waves but no S waves: it’s in the S-wave shadow zone.</p>';
    if (tp === null && T >= 1300) html += '<p>This seismometer got no waves directly: it’s in the P-wave shadow zone as well as the S-wave one.</p>';
    $('info').innerHTML = html;
  } else {
    const liquid = pressed('medium') === 'liquid';
    $('info').innerHTML = `<dl class="readout"><dt>P waves</dt><dd>longitudinal, faster</dd><dt>S waves</dt><dd>transverse, slower</dd></dl>
      <p>${liquid ? 'In the liquid, the P wave carries on, but more slowly. The S wave stops at the boundary: a liquid can’t pass on a side-to-side shake.' : 'Both waves carry on into the rock on the right. Choose the liquid to see the difference.'}</p>
      <p class="note">Watch the orange particle in each row: it only vibrates about where it is.</p>`;
  }
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = EXPLAIN[t];
  cv.setAttribute('aria-label', t === 'earth' ? 'A cut-away of the Earth with an earthquake and seismometers' : 'Rows of particles showing a P wave and an S wave');
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'earth' ? location.pathname + location.search : `#${t}`);
  types.start = state.t;
  render();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#medium .chip').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#medium .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  types.start = state.t; render();
}));
$('quake').addEventListener('click', () => { quake.T = 0; quake.running = true; render(); });
$('shake').addEventListener('click', () => { types.start = state.t; });
for (const id of ['showp', 'shows', 'layers']) $(id).addEventListener('change', render);

// Drag the earthquake round the surface; tap a seismometer to choose it
PK.dragOn(cv, W, H, {
  hit: (p) => {
    if (state.tab !== 'earth') return null;
    const [qx, qy] = toXY(1, quake.phi);
    if (Math.hypot(p.x - qx, p.y - qy) < 22) return 'quake';
    const i = STATIONS.findIndex((a) => { const [x, y] = toXY(1.04, a); return Math.hypot(p.x - x, p.y - y) < 14; });
    return i >= 0 ? `s${i}` : null;
  },
  move: (k, p) => {
    if (k !== 'quake') return;
    quake.phi = Math.atan2(p.x - EX, -(p.y - EY));
    quake.T = -1; quake.running = false;
    render();
  },
  tap: (k) => { if (k[0] === 's') { quake.sel = Number(k.slice(1)); render(); } },
});

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  state.t += dt;
  if (quake.running) { quake.T = Math.min(END, quake.T + dt * SPEEDUP); if (quake.T >= END) { quake.running = false; render(); } }
  tick += dt;
  if (quake.running && tick > 0.5) { tick = 0; render(); }
  if (cv.clientWidth) {
    const c = colours();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    if (state.tab === 'earth') drawEarth(c); else drawTypes(c);
  }
  requestAnimationFrame(frame);
}

showTab(PK.initialHash === '#types' ? 'types' : 'earth');
requestAnimationFrame(frame);
