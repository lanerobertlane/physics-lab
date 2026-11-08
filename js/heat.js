// Conduction, convection and radiation: the three ways energy is transferred by heating.
// Conduction: heat spreads along two rods (a 1-D diffusion model); wax holds pins that drop off.
// Convection: water heated at one side becomes less dense and rises, setting up a current.
// Radiation: infrared from a heater is absorbed by cans with different surfaces.

PK.header({
  title: 'Conduction, convection & radiation',
  spec: [
    { code: 'KS3', text: 'Energy transfer by heating: conduction, convection and radiation; insulators and conductors' },
    { code: '4.1.2.1', text: 'Thermal conductivity: the higher it is, the higher the rate of energy transfer by conduction' },
    { code: '4.3.1.1', text: 'Density: particles spread out when heated, so a fluid becomes less dense' },
    { code: '4.6.3.1', text: 'All bodies emit and absorb infrared radiation; dark matt surfaces are the best absorbers and emitters', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
const heatCol = (f) => { f = Math.max(0, Math.min(1, f)); return `rgb(${Math.round(60 + 195 * f)}, ${Math.round(110 + 40 * Math.sin(f * Math.PI) - 60 * f)}, ${Math.round(220 - 200 * f)})`; };

let tab = 'conduction';

// ---------- Conduction ----------

const MATERIALS = {
  copper: { name: 'Copper', a: 3.8, col: '#c77845' },
  aluminium: { name: 'Aluminium', a: 2.9, col: '#b7bec7' },
  steel: { name: 'Steel', a: 0.9, col: '#7d8794' },
  glass: { name: 'Glass', a: 0.18, col: '#bfe3ea' },
  wood: { name: 'Wood', a: 0.06, col: '#a47148' },
};
const N = 40, PINS = [6, 12, 18, 24, 30, 36], ROOM = 20, FLAME = 400, MELT = 55;
const cond = { mats: ['copper', 'steel'], T: [], pins: [], t: 0, on: false };
function resetCond() {
  cond.T = cond.mats.map(() => new Array(N).fill(ROOM));
  cond.pins = cond.mats.map(() => PINS.map(() => ({ y: 0, v: 0, fallen: false, at: null })));
  cond.t = 0; cond.on = false;
  $('c-go').textContent = '🔥 Light the Bunsen burners';
}

function stepCond(dt) {
  if (!cond.on) return;
  cond.t += dt;
  cond.mats.forEach((m, r) => {
    const a = MATERIALS[m].a, T = cond.T[r];
    const sub = Math.ceil(a * dt / 0.4);
    const h = dt / sub;
    for (let s = 0; s < sub; s++) {
      T[0] = FLAME;
      const nt = T.slice();
      for (let i = 1; i < N; i++) {
        const right = i === N - 1 ? T[i] : T[i + 1];
        nt[i] = T[i] + a * h * (T[i - 1] - 2 * T[i] + right) - 0.01 * h * (T[i] - ROOM);
      }
      nt[0] = FLAME;
      for (let i = 0; i < N; i++) T[i] = nt[i];
    }
    cond.pins[r].forEach((p, j) => {
      if (!p.fallen && T[PINS[j]] > MELT) { p.fallen = true; p.at = cond.t; }
      if (p.fallen && p.y < 44) { p.v += 600 * dt; p.y = Math.min(44, p.y + p.v * dt); }
    });
  });
}

const cc = $('cond'), cx = cc.getContext('2d');
const CW = 800, CH = 400;
let jig = 0;
function drawCond(dt) {
  const k = cc.width / CW;
  cx.setTransform(k, 0, 0, k, 0, 0);
  cx.fillStyle = PK.cssVar('--surface'); cx.fillRect(0, 0, CW, CH);
  jig += dt;
  const X0 = 150, X1 = 700, cell = (X1 - X0) / N;
  cond.mats.forEach((m, r) => {
    const y = 90 + r * 170, mat = MATERIALS[m];
    // Bunsen burner and flame at the left end
    cx.fillStyle = '#6b7280'; cx.fillRect(98, y + 40, 20, 70); cx.fillRect(84, y + 104, 48, 10);
    if (cond.on) {
      const fl = 1 + 0.08 * Math.sin(jig * 20 + r);
      cx.fillStyle = 'rgba(80, 140, 255, .85)'; cx.beginPath(); cx.ellipse(108, y + 22, 12 * fl, 24 * fl, 0, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = 'rgba(255, 190, 60, .8)'; cx.beginPath(); cx.ellipse(108, y + 26, 6, 14 * fl, 0, 0, Math.PI * 2); cx.fill();
    }
    // The rod, coloured by temperature, with its particles vibrating
    for (let i = 0; i < N; i++) {
      const f = (cond.T[r][i] - ROOM) / (FLAME - ROOM);
      cx.fillStyle = $('c-colour').checked ? heatCol(f) : mat.col;
      cx.fillRect(X0 + i * cell - 40 * (i === 0), y, cell + 1 + 40 * (i === 0), 24);
    }
    cx.strokeStyle = '#333'; cx.lineWidth = 1.5; cx.strokeRect(X0 - 40, y, X1 - X0 + 40, 24);
    if ($('c-particles').checked) {
      cx.fillStyle = 'rgba(20, 20, 30, .55)';
      for (let i = 0; i < N; i++) for (let row = 0; row < 2; row++) {
        const amp = 0.4 + 3.2 * Math.sqrt(Math.max(0, (cond.T[r][i] - ROOM) / (FLAME - ROOM)));
        const px = X0 + (i + 0.5) * cell + amp * Math.sin(jig * 37 + i * 1.7 + row * 2.3 + r);
        const py = y + 7 + row * 10 + amp * Math.cos(jig * 41 + i * 2.1 + row);
        cx.beginPath(); cx.arc(px, py, 3.4, 0, Math.PI * 2); cx.fill();
      }
    }
    // Tray to catch the pins
    cx.fillStyle = '#c9ced6'; cx.fillRect(X0 - 10, y + 104, X1 - X0 + 20, 5);
    // Wax and pins underneath
    cond.pins[r].forEach((p, j) => {
      const px = X0 + (PINS[j] + 0.5) * cell;
      if (!p.fallen) { cx.fillStyle = '#fff3c4'; cx.beginPath(); cx.ellipse(px, y + 28, 9, 6, 0, 0, Math.PI * 2); cx.fill(); cx.strokeStyle = '#c9b46b'; cx.lineWidth = 1; cx.stroke(); }
      cx.strokeStyle = '#555'; cx.fillStyle = '#555'; cx.lineWidth = 2.5;
      if (p.fallen && p.y >= 44) {
        // Landed: lying on its side in the tray
        cx.beginPath(); cx.moveTo(px - 15, y + 101); cx.lineTo(px + 15, y + 101); cx.stroke();
        cx.beginPath(); cx.arc(px - 15, y + 101, 3.5, 0, Math.PI * 2); cx.fill();
      } else {
        const py = y + 30 + p.y;
        cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px, py + 30); cx.stroke();
        cx.beginPath(); cx.arc(px, py, 3.5, 0, Math.PI * 2); cx.fill();
      }
    });
    cx.fillStyle = PK.cssVar('--text'); cx.font = `800 15px ${font()}`; cx.textAlign = 'left'; cx.textBaseline = 'bottom';
    cx.fillText(`${'AB'[r]}: ${mat.name}`, X0, y - 8);
    cx.font = `700 13px ${font()}`; cx.textAlign = 'right';
    cx.fillText(`far end ${cond.T[r][N - 1].toFixed(0)} °C`, X1, y - 8);
  });
  cx.fillStyle = PK.cssVar('--muted'); cx.font = `700 13px ${font()}`; cx.textAlign = 'left'; cx.textBaseline = 'bottom';
  cx.fillText(`time: ${cond.t.toFixed(0)} s`, 12, CH - 8);
}

function renderCond() {
  const rows = cond.mats.map((m, r) => {
    const fallen = cond.pins[r].filter((p) => p.fallen);
    return `<dt>${'AB'[r]}: ${MATERIALS[m].name}</dt><dd>${fallen.length} of ${PINS.length} pins</dd>`;
  }).join('');
  $('c-read').innerHTML = rows;
  const done = cond.mats.map((m, r) => cond.pins[r].filter((p) => p.fallen).length);
  $('c-verdict').innerHTML = !cond.on && cond.t === 0 ? 'Light the burners and watch the pins.'
    : done[0] === done[1] ? 'So far, both rods have dropped the same number of pins.'
      : `<b>${'AB'[done[0] > done[1] ? 0 : 1]} (${MATERIALS[cond.mats[done[0] > done[1] ? 0 : 1]].name.toLowerCase()})</b> is conducting faster: it is the better thermal conductor.`;
}

// ---------- Convection ----------

const vc = $('conv'), vx = vc.getContext('2d');
const VW = 800, VH = 420, BX0 = 180, BX1 = 620, BY0 = 70, BY1 = 360;
const conv = { on: true, strength: 0, pts: [], dye: [] };
function resetConv() {
  conv.pts = Array.from({ length: 260 }, () => ({ x: BX0 + Math.random() * (BX1 - BX0), y: BY0 + 10 + Math.random() * (BY1 - BY0 - 10), T: 0 }));
  conv.dye = [];
}
// One convection cell: rising above the heater on the left, sinking on the right.
function flow(x, y) {
  const u = (x - BX0) / (BX1 - BX0), v = (y - BY0) / (BY1 - BY0);
  const s = 90 * conv.strength;
  return { vx: s * Math.sin(Math.PI * u) * Math.cos(Math.PI * v) * 0.9, vy: s * Math.cos(Math.PI * u) * Math.sin(Math.PI * v) * 1.1 };
}
function stepConv(dt) {
  conv.strength += ((conv.on ? 1 : 0) - conv.strength) * dt * 0.5;
  for (const p of [...conv.pts, ...conv.dye]) {
    const f = flow(p.x, p.y);
    p.x += (f.vx + (Math.random() - 0.5) * 14) * dt;
    p.y += (f.vy * -1 + (Math.random() - 0.5) * 14) * dt;
    p.x = Math.max(BX0 + 4, Math.min(BX1 - 4, p.x)); p.y = Math.max(BY0 + 4, Math.min(BY1 - 4, p.y));
    // Warmed near the heater (bottom left), cooled at the surface
    const nearHeater = p.y > BY1 - 40 && p.x < BX0 + (BX1 - BX0) * 0.4;
    if (conv.on && nearHeater) p.T = Math.min(1, p.T + dt * 0.9);
    else p.T = Math.max(0, p.T - dt * (p.y < BY0 + 50 ? 0.35 : 0.08));
  }
  conv.dye = conv.dye.filter((d) => (d.life -= dt) > 0);
}
function drawConv() {
  const k = vc.width / VW;
  vx.setTransform(k, 0, 0, k, 0, 0);
  vx.fillStyle = PK.cssVar('--surface'); vx.fillRect(0, 0, VW, VH);
  // Water and beaker
  vx.fillStyle = 'rgba(120, 180, 255, .25)'; vx.fillRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
  vx.strokeStyle = '#555'; vx.lineWidth = 3;
  vx.beginPath(); vx.moveTo(BX0 - 6, BY0 - 30); vx.lineTo(BX0 - 6, BY1 + 6); vx.lineTo(BX1 + 6, BY1 + 6); vx.lineTo(BX1 + 6, BY0 - 30); vx.stroke();
  // Heater under the left side
  vx.fillStyle = '#6b7280'; vx.fillRect(BX0 + 50, BY1 + 30, 40, 40);
  if (conv.on) {
    vx.fillStyle = 'rgba(80, 140, 255, .85)'; vx.beginPath(); vx.ellipse(BX0 + 70, BY1 + 18, 14, 14, 0, 0, Math.PI * 2); vx.fill();
    vx.fillStyle = 'rgba(255, 190, 60, .85)'; vx.beginPath(); vx.ellipse(BX0 + 70, BY1 + 20, 6, 9, 0, 0, Math.PI * 2); vx.fill();
  }
  for (const p of conv.pts) { vx.fillStyle = $('v-colour').checked ? heatCol(p.T) : '#3a6ea5'; vx.beginPath(); vx.arc(p.x, p.y, 3.2, 0, Math.PI * 2); vx.fill(); }
  for (const d of conv.dye) { vx.fillStyle = `rgba(128, 0, 128, ${Math.min(0.8, d.life / 6)})`; vx.beginPath(); vx.arc(d.x, d.y, 4, 0, Math.PI * 2); vx.fill(); }
  // Arrows showing the current
  if ($('v-arrows').checked && conv.strength > 0.2) {
    vx.strokeStyle = 'rgba(200, 40, 40, .8)'; vx.fillStyle = 'rgba(200, 40, 40, .8)'; vx.lineWidth = 3;
    const arrowAt = (x1, y1, x2, y2, col) => {
      vx.strokeStyle = col; vx.fillStyle = col;
      vx.beginPath(); vx.moveTo(x1, y1); vx.lineTo(x2, y2); vx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      vx.beginPath(); vx.moveTo(x2, y2); vx.lineTo(x2 - 12 * Math.cos(a - 0.4), y2 - 12 * Math.sin(a - 0.4)); vx.lineTo(x2 - 12 * Math.cos(a + 0.4), y2 - 12 * Math.sin(a + 0.4)); vx.closePath(); vx.fill();
    };
    arrowAt(BX0 + 90, BY1 - 60, BX0 + 90, BY0 + 80, 'rgba(210, 40, 30, .85)');
    arrowAt(BX0 + 130, BY0 + 40, BX1 - 130, BY0 + 40, 'rgba(150, 80, 160, .8)');
    arrowAt(BX1 - 90, BY0 + 80, BX1 - 90, BY1 - 60, 'rgba(30, 90, 200, .85)');
    arrowAt(BX1 - 130, BY1 - 30, BX0 + 130, BY1 - 30, 'rgba(150, 80, 160, .8)');
  }
  vx.fillStyle = PK.cssVar('--text'); vx.font = `700 14px ${font()}`; vx.textAlign = 'left'; vx.textBaseline = 'middle';
  vx.fillText('hot water rises', 20, 150);
  vx.fillText('(less dense)', 20, 168);
  vx.textAlign = 'right';
  vx.fillText('cooler water sinks', VW - 20, 150);
  vx.fillText('(more dense)', VW - 20, 168);
}

// ---------- Radiation ----------

const SURF = {
  black: { name: 'Matt black', absorb: 0.95, col: '#1a1a1a' },
  white: { name: 'Matt white', absorb: 0.4, col: '#f2f2f2' },
  silver: { name: 'Shiny silver', absorb: 0.08, col: '#d8dde3' },
};
const rad = { picks: ['black', 'silver'], T: [ROOM, ROOM], on: false, t: 0, waves: [] };
const rc = $('rad'), rx = rc.getContext('2d');
const RW = 800, RH = 380;
function resetRad() { rad.T = [ROOM, ROOM]; rad.t = 0; rad.on = false; rad.waves = []; $('r-go').textContent = '🔥 Switch the heater on'; }
function stepRad(dt) {
  if (!rad.on) return;
  rad.t += dt;
  rad.T = rad.T.map((T, i) => T + (SURF[rad.picks[i]].absorb * 0.5 - 0.01 * (T - ROOM)) * dt);
  if (Math.random() < dt * 6) rad.waves.push({ r: 30, side: Math.random() < 0.5 ? -1 : 1, y: 150 + Math.random() * 90 });
  const D = 220;   // distance from the heater to the surface of each can
  for (const w of rad.waves) {
    w.r += 160 * dt;
    if (!w.decided && w.r >= D) {
      // Absorbed, or reflected back by the surface
      w.decided = true;
      w.reflect = Math.random() > SURF[rad.picks[w.side < 0 ? 0 : 1]].absorb;
      if (!w.reflect) w.dead = true;
    }
    if (w.reflect && 2 * D - w.r < 40) w.dead = true;
  }
  rad.waves = rad.waves.filter((w) => !w.dead);
}
function drawRad() {
  const k = rc.width / RW;
  rx.setTransform(k, 0, 0, k, 0, 0);
  rx.fillStyle = $('r-vacuum').checked ? '#1b1f2a' : PK.cssVar('--surface'); rx.fillRect(0, 0, RW, RH);
  // Heater
  rx.fillStyle = '#6b7280'; rx.fillRect(370, 110, 60, 160);
  for (let i = 0; i < 6; i++) { rx.fillStyle = rad.on ? `rgba(255, ${80 + 20 * Math.sin(rad.t * 6 + i)}, 0, .95)` : '#9aa1ab'; rx.fillRect(378, 122 + i * 25, 44, 10); }
  // Infrared waves travelling out to each can
  const canX = [130, 670];
  rx.lineWidth = 2;
  for (const w of rad.waves) {
    const dist = w.reflect ? 440 - w.r : w.r;
    const x = 400 + w.side * dist, dir = w.side * (w.reflect ? -1 : 1);
    rx.strokeStyle = `rgba(230, 60, 30, ${w.reflect ? 0.45 : 0.85})`;
    rx.beginPath();
    for (let q = 0; q <= 40; q += 2) { const xx = x - dir * q, yy = w.y + Math.sin((q + w.r) / 4) * 6; q ? rx.lineTo(xx, yy) : rx.moveTo(xx, yy); }
    rx.stroke();
  }
  // Two cans with thermometers
  rad.picks.forEach((p, i) => {
    const x = canX[i], s = SURF[p];
    rx.fillStyle = s.col; rx.strokeStyle = '#555'; rx.lineWidth = 2;
    rx.fillRect(x - 50, 140, 100, 150); rx.strokeRect(x - 50, 140, 100, 150);
    if (p === 'silver') { const g = rx.createLinearGradient(x - 50, 0, x + 50, 0); g.addColorStop(0, 'rgba(255,255,255,.0)'); g.addColorStop(0.35, 'rgba(255,255,255,.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); rx.fillStyle = g; rx.fillRect(x - 50, 140, 100, 150); }
    rx.fillStyle = '#fff'; rx.fillRect(x - 5, 60, 10, 150); rx.strokeRect(x - 5, 60, 10, 150);
    const h = Math.min(140, ((rad.T[i] - 10) / 60) * 140);
    rx.fillStyle = '#e53935'; rx.fillRect(x - 3, 206 - h, 6, h);
    const txt = $('r-vacuum').checked ? '#ffffff' : PK.cssVar('--text');
    rx.fillStyle = txt; rx.font = `800 18px ${font()}`; rx.textAlign = 'center'; rx.textBaseline = 'top';
    rx.fillText(`${rad.T[i].toFixed(1)} °C`, x, 300);
    rx.font = `700 13px ${font()}`; rx.fillText(s.name, x, 326);
  });
  rx.fillStyle = $('r-vacuum').checked ? '#cfd8dc' : PK.cssVar('--muted'); rx.font = `700 13px ${font()}`; rx.textAlign = 'left'; rx.textBaseline = 'top';
  rx.fillText($('r-vacuum').checked ? 'In a vacuum: no particles, but infrared still gets through.' : 'Infrared radiation: an electromagnetic wave', 12, 12);
  rx.textAlign = 'right'; rx.fillText(`time: ${rad.t.toFixed(0)} s`, RW - 12, 12);
}
function renderRad() {
  const d = rad.T.map((T) => T - ROOM);
  $('r-verdict').innerHTML = rad.t < 5 ? 'Switch the heater on and watch both thermometers.'
    : `After ${rad.t.toFixed(0)} s: ${SURF[rad.picks[0]].name.toLowerCase()} has warmed by ${d[0].toFixed(1)} °C and ${SURF[rad.picks[1]].name.toLowerCase()} by ${d[1].toFixed(1)} °C.`
      + (rad.picks[0] !== rad.picks[1] ? ` The <b>${SURF[rad.picks[d[0] > d[1] ? 0 : 1]].name.toLowerCase()}</b> surface absorbs infrared best.` : '');
}

// ---------- Tabs, controls and loop ----------

function showTab(t) {
  tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-tab]').forEach((el) => { el.hidden = el.dataset.tab !== t; });
  sizeAll();
  history.replaceState(null, '', `#${t}`);
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));

const matOpts = Object.entries(MATERIALS).map(([id, m]) => `<option value="${id}">${m.name}</option>`).join('');
['c-mat-a', 'c-mat-b'].forEach((id, r) => {
  $(id).innerHTML = matOpts; $(id).value = cond.mats[r];
  $(id).addEventListener('change', (e) => { cond.mats[r] = e.target.value; resetCond(); renderCond(); });
});
$('c-go').addEventListener('click', () => { cond.on = !cond.on; $('c-go').textContent = cond.on ? '❚❚ Turn the burners off' : '🔥 Light the Bunsen burners'; });
$('c-reset').addEventListener('click', () => { resetCond(); renderCond(); });

$('v-go').addEventListener('click', () => { conv.on = !conv.on; $('v-go').textContent = conv.on ? '❚❚ Turn the heat off' : '🔥 Turn the heat on'; });
$('v-dye').addEventListener('click', () => { for (let i = 0; i < 40; i++) conv.dye.push({ x: BX0 + 70 + (Math.random() - 0.5) * 16, y: BY1 - 12 + (Math.random() - 0.5) * 8, life: 14 }); });

const surfOpts = Object.entries(SURF).map(([id, s]) => `<option value="${id}">${s.name}</option>`).join('');
['r-a', 'r-b'].forEach((id, i) => {
  $(id).innerHTML = surfOpts; $(id).value = rad.picks[i];
  $(id).addEventListener('change', (e) => { rad.picks[i] = e.target.value; resetRad(); renderRad(); });
});
$('r-go').addEventListener('click', () => { rad.on = !rad.on; $('r-go').textContent = rad.on ? '❚❚ Switch the heater off' : '🔥 Switch the heater on'; });
$('r-reset').addEventListener('click', () => { resetRad(); renderRad(); });

function sizeAll() {
  if (tab === 'conduction') size(cc, CW, CH);
  if (tab === 'convection') size(vc, VW, VH);
  if (tab === 'radiation') size(rc, RW, RH);
}

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (tab === 'conduction') { stepCond(dt); drawCond(dt); }
  if (tab === 'convection') { stepConv(dt); drawConv(); }
  if (tab === 'radiation') { for (let i = 0; i < 4; i++) stepRad(dt); drawRad(); }
  if ((tick += dt) > 0.25) { tick = 0; renderCond(); renderRad(); }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeAll);
resetCond(); resetConv(); resetRad();
const startTab = location.hash.slice(1);
showTab(['conduction', 'convection', 'radiation'].includes(startTab) ? startTab : 'conduction');
renderCond(); renderRad();
requestAnimationFrame(frame);
