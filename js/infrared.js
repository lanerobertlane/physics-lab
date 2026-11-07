// Infrared radiation practical. Emitting: a Leslie cube of hot water; the detector reading is
// proportional to ε σ (T⁴ − T_room⁴). Absorbing: plates beside a radiant heater warm at a
// rate set by how well their surface absorbs; the wax holding a pin melts at 50 °C.
// ε values are simplified, typical-of-a-school-lab figures.

PK.header({
  title: 'Infrared radiation',
  spec: [
    { code: '4.6.3.1', text: 'Required practical: investigate how the amount of infrared radiation absorbed or radiated by a surface depends on the nature of that surface' },
    { code: '4.6.3.1', text: 'All bodies emit and absorb infrared radiation; the hotter the body, the more infrared radiation it emits in a given time', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const SURFACES = [
  { id: 'mblack', name: 'Matt black', e: 0.95, col: '#1b1b1b' },
  { id: 'sblack', name: 'Shiny black', e: 0.8, col: '#2c2c2c', shiny: true },
  { id: 'mwhite', name: 'Matt white', e: 0.7, col: '#f2f2f0' },
  { id: 'silver', name: 'Shiny silver', e: 0.1, col: '#c9ced6', shiny: true },
];
const SIGMA = 5.67e-8, ROOM = 20, MELT = 50;
const state = {
  mode: 'emit', face: 0, water: 80, rows: [],
  plates: [0, 3], plateT: [ROOM, ROOM], pinDown: [null, null], running: false, t: 0, speed: 20, absorbRows: [],
};

const reading = () => {
  const T = state.water + 273, R = ROOM + 273;
  return SURFACES[state.face].e * SIGMA * (T ** 4 - R ** 4) * 0.5;   // W/m² at the detector
};

// ---------- Drawing ----------

const cv = $('ir'), ctx = cv.getContext('2d');
const W = 800, H = 380;
function sizeCanvas() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }

function surfaceFill(s, x, y, w, h) {
  ctx.fillStyle = s.col; ctx.fillRect(x, y, w, h);
  if (s.shiny) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); g.addColorStop(0.6, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }
}

function waves(x1, y, x2, strength, t) {
  ctx.strokeStyle = `rgba(230, 70, 40, ${Math.min(1, 0.15 + strength)})`; ctx.lineWidth = 2.5;
  for (let k = -1; k <= 1; k++) {
    ctx.beginPath();
    for (let x = x1; x <= x2; x += 3) { const yy = y + k * 34 + Math.sin((x - t * 120) / 9) * 7; x === x1 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.stroke();
  }
}

function drawEmit(c, t) {
  const s = SURFACES[state.face];
  // Leslie cube (front face shows the chosen surface)
  ctx.fillStyle = '#8a929f';
  ctx.beginPath(); ctx.moveTo(150, 120); ctx.lineTo(190, 90); ctx.lineTo(370, 90); ctx.lineTo(330, 120); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(330, 120); ctx.lineTo(370, 90); ctx.lineTo(370, 270); ctx.lineTo(330, 300); ctx.closePath(); ctx.fill();
  surfaceFill(s, 150, 120, 180, 180);
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.strokeRect(150, 120, 180, 180);
  ctx.fillStyle = s.id === 'mwhite' || s.id === 'silver' ? '#222' : '#fff';
  ctx.font = `700 15px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(s.name, 240, 210);
  ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`;
  ctx.fillText(`hot water inside: ${state.water} °C`, 240, 330);
  const r = reading();
  waves(340, 210, 560, r / 250, t);
  // Detector
  ctx.fillStyle = '#39414d'; ctx.fillRect(570, 175, 70, 70);
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(570, 210, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0d1a0d'; ctx.fillRect(590, 100, 160, 48);
  ctx.fillStyle = '#7CFC00'; ctx.font = '700 24px ui-monospace, Consolas, monospace'; ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(r * (1 + (Math.sin(t * 7) * 0.004)))}`, 740, 125);
  ctx.fillStyle = c.muted; ctx.font = `600 12px ${c.font}`; ctx.textAlign = 'center';
  ctx.fillText('infrared detector (W/m²)', 670, 90);
  ctx.fillText('same distance for every face', 455, 290);
}

function drawAbsorb(c, t) {
  // Radiant heater in the middle, plates either side with a pin held on by wax
  const hx = 400;
  ctx.fillStyle = '#5d6470'; ctx.fillRect(hx - 20, 110, 40, 180);
  ctx.fillStyle = state.running ? '#ff5a1f' : '#9a4a2f'; ctx.fillRect(hx - 12, 120, 24, 160);
  if (state.running) { waves(hx - 210, 200, hx - 26, 0.6, t); waves(hx + 26, 200, hx + 210, 0.6, -t); }
  state.plates.forEach((si, i) => {
    const s = SURFACES[si], px = i === 0 ? 150 : 620;
    surfaceFill(s, px, 110, 30, 180);
    ctx.strokeStyle = c.text; ctx.lineWidth = 1.5; ctx.strokeRect(px, 110, 30, 180);
    // Wax blob and pin on the back
    const back = i === 0 ? px - 10 : px + 40;
    const down = state.pinDown[i] != null;
    ctx.fillStyle = '#f3e3a3'; ctx.beginPath(); ctx.arc(back, 200, down ? 4 : 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
    const py = down ? 320 : 200;
    ctx.beginPath(); ctx.moveTo(back - (i === 0 ? 18 : -18), py); ctx.lineTo(back, py); ctx.stroke();
    ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(s.name, px + 15, 300);
    ctx.fillText(`${state.plateT[i].toFixed(1)} °C`, px + 15, 92);
  });
  ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`time: ${state.t.toFixed(0)} s   ·   wax melts at ${MELT} °C`, hx, 340);
}

// ---------- Absorbing simulation ----------

function stepAbsorb(dt) {
  state.t += dt;
  state.plates.forEach((si, i) => {
    const a = SURFACES[si].e;   // a good emitter is an equally good absorber
    state.plateT[i] += ((a * 4 - 0.01 * (state.plateT[i] - ROOM)) / 20) * dt;
    if (state.pinDown[i] == null && state.plateT[i] >= MELT) {
      state.pinDown[i] = state.t;
      state.absorbRows.push({ name: SURFACES[si].name, t: state.t });
      renderTable();
    }
  });
  if (state.pinDown.every((x) => x != null) || state.t > 3000) state.running = false;
}

// ---------- Panel ----------

function renderControls() {
  const el = $('controls');
  if (state.mode === 'emit') {
    $('intro').textContent = 'A Leslie cube is filled with hot water. Each face has a different surface. Point the infrared detector at each face in turn, from the same distance, and record the reading.';
    el.innerHTML = `<h2>Leslie cube</h2>
      <div class="btn-row" style="margin-bottom:10px">${SURFACES.map((s, i) => `<button class="btn" data-face="${i}" aria-pressed="${i === state.face}">${s.name}</button>`).join('')}</div>
      <div class="ctl"><label for="water">Water temperature <b id="water-val">${state.water} °C</b></label><input type="range" id="water" min="40" max="90" step="5" value="${state.water}"></div>
      <div class="btn-row" style="margin-top:8px"><button class="btn primary" id="record">＋ Record reading</button><button class="btn" id="clear">Clear</button></div>`;
    el.querySelectorAll('[data-face]').forEach((b) => b.addEventListener('click', () => { state.face = Number(b.dataset.face); renderControls(); }));
    $('water').addEventListener('input', (e) => { state.water = Number(e.target.value); $('water-val').textContent = `${state.water} °C`; });
    $('record').addEventListener('click', () => { state.rows.push({ name: SURFACES[state.face].name, T: state.water, r: reading() }); renderTable(); });
    $('clear').addEventListener('click', () => { state.rows = []; renderTable(); });
    $('bar').innerHTML = '<span class="note" style="margin:0">Tip: keep the water temperature the same for every face (a fair test).</span>';
  } else {
    $('intro').textContent = 'Two metal plates face a radiant heater. A drawing pin is stuck to the back of each plate with wax. The plate that absorbs infrared best heats up fastest, so its wax melts and its pin drops first.';
    const opts = (sel) => SURFACES.map((s, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${s.name}</option>`).join('');
    el.innerHTML = `<h2>Plates</h2>
      <div class="field"><label for="pl">Left plate</label><select class="select" id="pl">${opts(state.plates[0])}</select></div>
      <div class="field"><label for="pr">Right plate</label><select class="select" id="pr">${opts(state.plates[1])}</select></div>
      <div class="field"><label for="spd">Speed</label><select class="select" id="spd"><option value="1">Real time</option><option value="5">5 × faster</option><option value="20">20 × faster</option><option value="50">50 × faster</option></select></div>`;
    $('pl').addEventListener('change', (e) => { state.plates[0] = Number(e.target.value); resetAbsorb(); });
    $('pr').addEventListener('change', (e) => { state.plates[1] = Number(e.target.value); resetAbsorb(); });
    $('spd').value = String(state.speed);
    $('spd').addEventListener('change', (e) => { state.speed = Number(e.target.value); });
    $('bar').innerHTML = '<button class="btn primary" id="start">🔥 Switch on the heater</button><button class="btn" id="reset">↺ Reset</button>';
    $('start').addEventListener('click', () => { if (!state.running && state.t === 0) state.running = true; });
    $('reset').addEventListener('click', resetAbsorb);
  }
  renderTable();
}

function resetAbsorb() { Object.assign(state, { plateT: [ROOM, ROOM], pinDown: [null, null], running: false, t: 0 }); renderTable(); }

function renderTable() {
  if (state.mode === 'emit') {
    $('table').innerHTML = state.rows.length ? `<table class="results"><thead><tr><th>Surface</th><th>Water (°C)</th><th>Reading (W/m²)</th></tr></thead>
      <tbody>${state.rows.map((r) => `<tr><td>${r.name}</td><td>${r.T}</td><td class="n">${Math.round(r.r)}</td></tr>`).join('')}</tbody></table>` : '<p class="note">No readings yet.</p>';
  } else {
    $('table').innerHTML = state.absorbRows.length ? `<table class="results"><thead><tr><th>Surface</th><th>Time for pin to drop (s)</th></tr></thead>
      <tbody>${state.absorbRows.map((r) => `<tr><td>${r.name}</td><td class="n">${Math.round(r.t)}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Switch on the heater and wait for the pins to drop.</p>';
  }
}

document.querySelectorAll('#modes .chip').forEach((b) => b.addEventListener('click', () => {
  state.mode = b.dataset.m;
  document.querySelectorAll('#modes .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderControls();
}));

let last = performance.now(), t = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; t += dt;
  if (state.mode === 'absorb' && state.running) { const sim = dt * state.speed; for (let i = 0; i < 10; i++) if (state.running) stepAbsorb(sim / 10); }
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  if (state.mode === 'emit') drawEmit(c, t); else drawAbsorb(c, t);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeCanvas);
sizeCanvas();
renderControls();
requestAnimationFrame(frame);
