// Mains electricity: AC and DC on an oscilloscope, wiring a three-pin plug, and how the
// earth wire and fuse protect you when a fault makes the case live.

PK.header({
  title: 'Mains electricity',
  answers: true,
  spec: [
    { code: '4.2.3.1', text: 'Direct and alternating potential difference; UK mains is a.c. at 50 Hz and about 230 V' },
    { code: '4.2.3.2', text: 'Mains electricity: live (brown), neutral (blue) and earth (green and yellow) wires; why the live wire is dangerous; the earth wire as a safety wire' },
    { code: '4.2.4.1', text: 'Power: P = V I, used to choose a fuse' },
    { code: 'KS3', text: 'Electricity in the home: fuses, the cost of electricity and safety' },
  ],
});

const $ = (id) => document.getElementById(id);
const state = { tab: 'scope', src: 'ac', vdiv: 100, tdiv: 5, wires: { L: null, N: null, E: null }, checked: false,
  earth: true, fuse: 13, appliance: 'kettle', fault: false, on: false, blown: null };
const WIRES = { brown: { name: 'brown', col: '#8d5524', stripe: null }, blue: { name: 'blue', col: '#1e63c6', stripe: null }, gy: { name: 'green and yellow', col: '#43a047', stripe: '#fdd835' } };
const CORRECT = { L: 'brown', N: 'blue', E: 'gy' };
const APPLIANCES = {
  kettle: { name: 'Kettle (2.3 kW)', P: 2300 },
  toaster: { name: 'Toaster (900 W)', P: 900 },
  lamp: { name: 'Table lamp (60 W)', P: 60 },
  heater: { name: 'Fan heater (2.8 kW)', P: 2800 },
};

function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
const font = () => PK.cssVar('--font-body') || 'sans-serif';

// ---------- Oscilloscope ----------

const scope = $('scope'), sctx = scope.getContext('2d');
const SW = 800, SH = 420;
let tNow = 0;

function drawScope() {
  const k = scope.width / SW;
  sctx.setTransform(k, 0, 0, k, 0, 0);
  // The screen: 10 squares across, 8 up
  sctx.fillStyle = '#1f2a24'; sctx.fillRect(0, 0, SW, SH);
  const L = 40, T = 20, sq = 46, nx = 10, ny = 8, w = sq * nx, h = sq * ny, cy = T + h / 2;
  sctx.fillStyle = '#0b1a10'; sctx.fillRect(L, T, w, h);
  sctx.strokeStyle = 'rgba(120, 255, 160, .18)'; sctx.lineWidth = 1;
  for (let i = 0; i <= nx; i++) { sctx.beginPath(); sctx.moveTo(L + i * sq, T); sctx.lineTo(L + i * sq, T + h); sctx.stroke(); }
  for (let j = 0; j <= ny; j++) { sctx.beginPath(); sctx.moveTo(L, T + j * sq); sctx.lineTo(L + w, T + j * sq); sctx.stroke(); }
  sctx.strokeStyle = 'rgba(120, 255, 160, .4)';
  sctx.beginPath(); sctx.moveTo(L, cy); sctx.lineTo(L + w, cy); sctx.moveTo(L + w / 2, T); sctx.lineTo(L + w / 2, T + h); sctx.stroke();

  // The trace
  const peak = state.src === 'ac' ? 325 : state.src === 'battery' ? 12 : 230;   // volts
  const yOf = (v) => cy - (v / state.vdiv) * sq;
  sctx.save(); sctx.beginPath(); sctx.rect(L, T, w, h); sctx.clip();
  sctx.strokeStyle = '#7dff9b'; sctx.lineWidth = 3; sctx.shadowColor = '#7dff9b'; sctx.shadowBlur = 8;
  sctx.beginPath();
  for (let px = 0; px <= w; px += 2) {
    const t = (px / sq) * state.tdiv / 1000;   // seconds across the screen
    const v = state.src === 'ac' ? peak * Math.sin(2 * Math.PI * 50 * (t + tNow)) : peak;
    px ? sctx.lineTo(L + px, yOf(v)) : sctx.moveTo(L + px, yOf(v));
  }
  sctx.stroke(); sctx.restore();

  // Settings beside the screen
  const x = L + w + 24;
  sctx.fillStyle = '#cfe8d6'; sctx.font = `700 14px ${font()}`; sctx.textAlign = 'left'; sctx.textBaseline = 'top';
  sctx.fillText('Y-gain', x, T + 10);
  sctx.font = `800 20px ${font()}`; sctx.fillText(`${state.vdiv} V / square`, x, T + 30);
  sctx.font = `700 14px ${font()}`; sctx.fillText('Time-base', x, T + 80);
  sctx.font = `800 20px ${font()}`; sctx.fillText(`${state.tdiv} ms / square`, x, T + 100);
  sctx.font = `700 14px ${font()}`;
  sctx.fillText(state.src === 'ac' ? 'Mains (a.c.)' : state.src === 'battery' ? '12 V battery (d.c.)' : '230 V d.c. supply', x, T + 160);
  const lines = state.src === 'ac'
    ? ['The p.d. keeps changing', 'direction: alternating', 'current.']
    : ['The p.d. stays the same', 'and in one direction:', 'direct current.'];
  sctx.font = `600 13px ${font()}`;
  lines.forEach((l, i) => sctx.fillText(l, x, T + 184 + i * 18));
}

function renderScopePanel() {
  const ac = state.src === 'ac';
  $('scope-read').innerHTML = ac
    ? `<dt>Peak p.d.</dt><dd>325 V</dd><dt>Squares for one cycle</dt><dd>${parseFloat((20 / state.tdiv).toFixed(2))} squares</dd>
       <dt>Period (squares × time-base)</dt><dd>${PK.ans('0.02 s (20 ms)')}</dd><dt>Frequency (f = 1 ÷ T)</dt><dd>${PK.ans('50 Hz')}</dd>`
    : `<dt>P.d.</dt><dd>${state.src === 'battery' ? '12 V' : '230 V'}</dd><dt>Direction</dt><dd>always the same</dd><dt>Frequency</dt><dd>${PK.ans('0 Hz (it doesn’t alternate)')}</dd>`;
  $('vdiv-val').textContent = `${state.vdiv} V`;
  $('tdiv-val').textContent = `${state.tdiv} ms`;
}

// ---------- Three-pin plug ----------

const plug = $('plug'), pctx = plug.getContext('2d');
const PW = 800, PH = 460;
const TERM = { E: { x: 400, y: 110, label: 'Earth' }, N: { x: 270, y: 300, label: 'Neutral' }, L: { x: 530, y: 300, label: 'Live' } };

function drawWire(c, x1, y1, x2, y2, wire, width = 16) {
  const w = WIRES[wire];
  c.lineCap = 'round';
  c.strokeStyle = w ? w.col : '#c9ced6'; c.lineWidth = width;
  c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, y2 + 40, x2, y2); c.stroke();
  if (w && w.stripe) { c.strokeStyle = w.stripe; c.lineWidth = width / 3; c.setLineDash([10, 12]); c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, y2 + 40, x2, y2); c.stroke(); c.setLineDash([]); }
  if (!w) { c.strokeStyle = '#8a929f'; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, y2 + 40, x2, y2); c.stroke(); c.setLineDash([]); }
}

function drawPlug() {
  const k = plug.width / PW;
  pctx.setTransform(k, 0, 0, k, 0, 0);
  pctx.fillStyle = PK.cssVar('--surface'); pctx.fillRect(0, 0, PW, PH);
  // Plug body
  pctx.fillStyle = '#f5f5f5'; pctx.strokeStyle = '#555'; pctx.lineWidth = 3;
  pctx.beginPath(); pctx.roundRect ? pctx.roundRect(160, 40, 480, 380, 34) : pctx.rect(160, 40, 480, 380); pctx.fill(); pctx.stroke();
  // Pins
  pctx.fillStyle = '#c0a060';
  pctx.fillRect(385, 60, 30, 70); pctx.fillRect(255, 270, 30, 60); pctx.fillRect(515, 270, 30, 60);
  // Fuse beside the live pin
  pctx.fillStyle = '#fdd835'; pctx.fillRect(560, 180, 40, 100); pctx.strokeStyle = '#555'; pctx.lineWidth = 2; pctx.strokeRect(560, 180, 40, 100);
  pctx.fillStyle = '#d9d9d9'; pctx.fillRect(560, 172, 40, 12); pctx.fillRect(560, 276, 40, 12);
  pctx.fillStyle = '#333'; pctx.font = `800 14px ${font()}`; pctx.textAlign = 'center'; pctx.textBaseline = 'middle';
  pctx.save(); pctx.translate(580, 230); pctx.rotate(-Math.PI / 2); pctx.fillText(`fuse ${state.fuse} A`, 0, 0); pctx.restore();
  // Cable grip at the bottom
  pctx.fillStyle = '#9e9e9e'; pctx.fillRect(340, 380, 120, 24);
  pctx.fillStyle = '#333'; pctx.font = `700 12px ${font()}`; pctx.fillText('cable grip', 400, 392);
  // Outer cable
  pctx.fillStyle = '#eeeeee'; pctx.strokeStyle = '#999'; pctx.fillRect(370, 404, 60, 60); pctx.strokeRect(370, 404, 60, 60);
  // Wires from the cable to each terminal
  drawWire(pctx, 385, 384, TERM.N.x, TERM.N.y, state.wires.N);
  drawWire(pctx, 400, 384, TERM.E.x, TERM.E.y + 26, state.wires.E);
  drawWire(pctx, 415, 384, TERM.L.x, TERM.L.y, state.wires.L);
  // Terminals and labels
  for (const [key, t] of Object.entries(TERM)) {
    pctx.fillStyle = '#b0b7c0'; pctx.beginPath(); pctx.arc(t.x, t.y, 16, 0, Math.PI * 2); pctx.fill();
    pctx.strokeStyle = '#555'; pctx.lineWidth = 2; pctx.stroke();
    const ok = state.checked && state.wires[key] === CORRECT[key];
    const bad = state.checked && state.wires[key] !== CORRECT[key];
    pctx.font = `800 16px ${font()}`; pctx.fillStyle = PK.cssVar('--text'); pctx.textBaseline = 'middle';
    const lx = key === 'E' ? t.x + 70 : key === 'N' ? t.x - 70 : t.x + 100;
    pctx.textAlign = 'center';
    pctx.fillText(t.label, lx, t.y - 10);
    if (ok) { pctx.fillStyle = '#2e7d32'; pctx.fillText('✔', lx, t.y + 14); }
    if (bad) { pctx.fillStyle = '#c62828'; pctx.fillText('✘', lx, t.y + 14); }
  }
  pctx.fillStyle = PK.cssVar('--muted'); pctx.font = `700 13px ${font()}`; pctx.textAlign = 'left'; pctx.textBaseline = 'top';
  pctx.fillText('Tap a terminal to change its wire', 12, 12);
}

plug.addEventListener('pointerdown', (e) => {
  const r = plug.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * PW, y = ((e.clientY - r.top) / r.height) * PH;
  for (const [key, t] of Object.entries(TERM)) {
    if (Math.hypot(x - t.x, y - t.y) < 40) {
      const order = [null, 'brown', 'blue', 'gy'];
      state.wires[key] = order[(order.indexOf(state.wires[key]) + 1) % order.length];
      state.checked = false;
      renderPlugPanel();
      return;
    }
  }
});

function renderPlugPanel() {
  const all = Object.values(state.wires).every(Boolean);
  const right = Object.keys(CORRECT).every((k) => state.wires[k] === CORRECT[k]);
  $('plug-check').disabled = !all;
  $('plug-result').innerHTML = !state.checked ? (all ? 'All three wires are connected. Check your wiring.' : 'Connect a wire to each of the three terminals.')
    : right ? '<span class="badge good">Correct</span> Brown to live (through the fuse), blue to neutral, green and yellow to earth.'
      : '<span class="badge bad">Not quite</span> Look at the crosses and try again.';
  drawPlug();
}

// ---------- Safety: earth wire and fuse ----------

const safe = $('safe'), fctx = safe.getContext('2d');
const FW = 800, FH = 360;

function current() { return APPLIANCES[state.appliance].P / 230; }

// Blow the fuse if it should go: too much current when switched on, or a
// live-to-case fault with the earth connected. A blown fuse stays blown
// until it is replaced.
function settle() {
  if (state.blown) return;
  if (state.fault && state.earth) state.blown = 'earth';
  else if (state.on && current() > state.fuse) state.blown = 'overload';
}

function outcome() {
  const I = current();
  const name = APPLIANCES[state.appliance].name.split(' (')[0].toLowerCase();
  if (state.blown === 'overload') return { kind: 'blown-normal', text: `The fuse blew as soon as the ${name} was switched on: it needs ${PK.ans(`${I.toFixed(1)} A`)}, more than the ${state.fuse} A fuse allows. Choose a bigger fuse.` };
  if (state.blown === 'earth') return { kind: 'earthed', text: state.fault
    ? 'The live wire touched the metal case. A large current flowed through the earth wire, which melted the fuse and cut off the live wire. The case is safe to touch. Repair the fault before you replace the fuse, or it will just blow again.'
    : 'The fault has been repaired, but the fuse is still blown, so nothing works. Replace the fuse.' };
  if (state.fault) return { kind: 'shock', text: `Danger! The live wire is touching the metal case and there is no earth wire. The case is now at 230 V${state.on ? '' : ', even though the ' + name + ' is switched off'}. Anyone touching it would get an electric shock, as current flows through them to earth.` };
  if (!state.on) return { kind: 'off', text: `The ${name} is switched off, so no current flows. Switch it on.` };
  return { kind: 'ok', text: state.fuse - I > 7 ? `It works, but a ${state.fuse} A fuse is much bigger than the ${PK.ans(`${I.toFixed(1)} A`)} it normally needs. A smaller fault current might overheat the cable without blowing the fuse.` : `Working normally. The current is ${PK.ans(`${I.toFixed(1)} A`)}, which is less than the fuse rating.` };
}

function drawSafety() {
  const k = safe.width / FW;
  fctx.setTransform(k, 0, 0, k, 0, 0);
  fctx.fillStyle = PK.cssVar('--surface'); fctx.fillRect(0, 0, FW, FH);
  const o = outcome();
  const blown = o.kind === 'blown-normal' || o.kind === 'earthed';
  // Socket and cable
  fctx.fillStyle = '#eeeeee'; fctx.strokeStyle = '#777'; fctx.lineWidth = 2;
  fctx.fillRect(30, 120, 90, 110); fctx.strokeRect(30, 120, 90, 110);
  fctx.fillStyle = '#333'; fctx.font = `700 12px ${font()}`; fctx.textAlign = 'center'; fctx.textBaseline = 'top'; fctx.fillText('socket', 75, 236);
  // Three wires to the appliance
  const lines = [['L', 150, '#8d5524'], ['N', 175, '#1e63c6'], ['E', 200, '#43a047']];
  for (const [key, y, col] of lines) {
    if (key === 'E' && !state.earth) {
      fctx.strokeStyle = col; fctx.lineWidth = 6; fctx.beginPath(); fctx.moveTo(120, y); fctx.lineTo(230, y); fctx.stroke();
      fctx.fillStyle = '#c62828'; fctx.font = `800 16px ${font()}`; fctx.fillText('✂ not connected', 300, y - 10);
      continue;
    }
    fctx.strokeStyle = col; fctx.lineWidth = 6; fctx.beginPath(); fctx.moveTo(120, y); fctx.lineTo(key === 'L' ? 200 : 470, y); fctx.stroke();
    if (key === 'E') { fctx.setLineDash([8, 8]); fctx.strokeStyle = '#fdd835'; fctx.lineWidth = 2; fctx.beginPath(); fctx.moveTo(120, y); fctx.lineTo(470, y); fctx.stroke(); fctx.setLineDash([]); }
  }
  // Fuse in the live wire
  fctx.fillStyle = '#fdd835'; fctx.fillRect(200, 140, 60, 20); fctx.strokeStyle = '#555'; fctx.lineWidth = 1.5; fctx.strokeRect(200, 140, 60, 20);
  fctx.strokeStyle = blown ? '#999' : '#333'; fctx.lineWidth = 2; fctx.beginPath();
  if (blown) { fctx.moveTo(204, 150); fctx.lineTo(224, 150); fctx.moveTo(236, 150); fctx.lineTo(256, 150); } else { fctx.moveTo(204, 150); fctx.lineTo(256, 150); }
  fctx.stroke();
  fctx.fillStyle = '#333'; fctx.font = `700 12px ${font()}`; fctx.fillText(`${state.fuse} A fuse${blown ? ' (blown)' : ''}`, 230, 112);
  fctx.strokeStyle = '#8d5524'; fctx.lineWidth = 6; fctx.beginPath(); fctx.moveTo(260, 150); fctx.lineTo(state.fault ? 520 : 470, 150); fctx.stroke();
  // Appliance with a metal case
  const live = o.kind === 'shock';
  fctx.fillStyle = live ? '#ffcdd2' : '#cfd8dc'; fctx.strokeStyle = live ? '#c62828' : '#546e7a'; fctx.lineWidth = 4;
  fctx.fillRect(470, 80, 220, 180); fctx.strokeRect(470, 80, 220, 180);
  fctx.fillStyle = '#263238'; fctx.font = `800 15px ${font()}`;
  fctx.fillText(APPLIANCES[state.appliance].name, 580, 270);
  fctx.font = `700 12px ${font()}`; fctx.fillText('metal case', 580, 90);
  // On/off indicator light
  const working = o.kind === 'ok';
  fctx.fillStyle = working ? '#76ff03' : '#455a64'; fctx.strokeStyle = '#263238'; fctx.lineWidth = 2;
  if (working) { fctx.shadowColor = '#76ff03'; fctx.shadowBlur = 14; }
  fctx.beginPath(); fctx.arc(650, 200, 9, 0, Math.PI * 2); fctx.fill(); fctx.shadowBlur = 0; fctx.stroke();
  fctx.fillStyle = '#263238'; fctx.font = `800 12px ${font()}`; fctx.fillText(state.on ? 'ON' : 'OFF', 650, 214);
  if (state.fault) {
    fctx.fillStyle = '#ffeb3b'; fctx.font = `800 26px ${font()}`; fctx.fillText('⚡', 530, 132);
    fctx.fillStyle = '#c62828'; fctx.font = `700 12px ${font()}`; fctx.fillText('live wire loose, touching the case', 580, 236);
  }
  // A hand touching the case
  if (state.fault) {
    fctx.fillStyle = '#f1c27d'; fctx.beginPath(); fctx.ellipse(720, 180, 26, 16, 0, 0, Math.PI * 2); fctx.fill();
    fctx.fillRect(720, 172, 70, 18);
    if (live) { fctx.strokeStyle = '#ffeb3b'; fctx.lineWidth = 3; for (let i = 0; i < 3; i++) { fctx.beginPath(); fctx.moveTo(700 + i * 20, 150); fctx.lineTo(708 + i * 20, 162); fctx.lineTo(698 + i * 20, 168); fctx.lineTo(706 + i * 20, 180); fctx.stroke(); } }
  }
  // Status
  const badge = { off: ['#546e7a', 'Switched off'], ok: ['#2e7d32', 'Working normally'], earthed: ['#2e7d32', 'Safe: the fuse has blown'], shock: ['#c62828', 'DANGER: the case is live'], 'blown-normal': ['#ef6c00', 'Fuse blown'] }[o.kind];
  fctx.fillStyle = badge[0]; fctx.font = `800 18px ${font()}`; fctx.textAlign = 'left'; fctx.fillText(badge[1], 30, 300);
}

function renderSafetyPanel() {
  settle();
  const o = outcome();
  $('safe-result').innerHTML = o.text;
  $('fault').textContent = state.fault ? '↺ Repair the fault' : '⚡ Cause a fault';
  $('power').textContent = state.on ? '⏻ Switch off' : '⏻ Switch on';
  $('power').setAttribute('aria-pressed', String(state.on));
  $('replace').disabled = !state.blown;
  const I = current();
  $('fuse-working').innerHTML = `I = P ÷ V = ${APPLIANCES[state.appliance].P} ÷ 230 = <b>${PK.ans(`${I.toFixed(1)} A`)}</b>. Choose the fuse with the next rating above this: <b>${PK.ans(`${[3, 5, 13].find((f) => f > I) || 'none (13 A is the biggest)'}${[3, 5, 13].find((f) => f > I) ? ' A' : ''}`)}</b>.`;
  document.querySelectorAll('#fuses .chip').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.f) === state.fuse)));
  drawSafety();
  drawPlug();
}

// ---------- Tabs and controls ----------

function showTab(tab) {
  state.tab = tab;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === tab)));
  for (const t of ['scope', 'plug', 'safe']) document.querySelectorAll(`[data-tab="${t}"]`).forEach((el) => { el.hidden = t !== tab; });
  sizeAll();
  renderScopePanel(); renderPlugPanel(); renderSafetyPanel();
  history.replaceState(null, '', `#${tab}`);
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#source .chip').forEach((b) => b.addEventListener('click', () => {
  state.src = b.dataset.s;
  document.querySelectorAll('#source .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  if (state.src === 'battery' && state.vdiv > 20) { state.vdiv = 5; $('vdiv').value = 5; }
  if (state.src !== 'battery' && state.vdiv < 50) { state.vdiv = 100; $('vdiv').value = 100; }
  renderScopePanel();
}));
$('vdiv').addEventListener('change', (e) => { state.vdiv = Number(e.target.value); renderScopePanel(); });
$('tdiv').addEventListener('change', (e) => { state.tdiv = Number(e.target.value); renderScopePanel(); });
$('plug-check').addEventListener('click', () => { state.checked = true; renderPlugPanel(); });
$('plug-show').addEventListener('click', () => { state.wires = { ...CORRECT }; state.checked = true; renderPlugPanel(); });
$('plug-clear').addEventListener('click', () => { state.wires = { L: null, N: null, E: null }; state.checked = false; renderPlugPanel(); });
$('earth').addEventListener('change', (e) => { state.earth = e.target.checked; renderSafetyPanel(); });
$('fault').addEventListener('click', () => { state.fault = !state.fault; renderSafetyPanel(); });
$('appliance').innerHTML = Object.entries(APPLIANCES).map(([id, a]) => `<option value="${id}">${a.name}</option>`).join('');
$('power').addEventListener('click', () => { state.on = !state.on; renderSafetyPanel(); });
$('replace').addEventListener('click', () => { state.blown = null; renderSafetyPanel(); });
// A new appliance comes with its own plug and a good fuse, switched off.
$('appliance').addEventListener('change', (e) => { state.appliance = e.target.value; state.on = false; state.blown = null; renderSafetyPanel(); });
// Picking a fuse means fitting a new one.
document.querySelectorAll('#fuses .chip').forEach((b) => b.addEventListener('click', () => { state.fuse = Number(b.dataset.f); state.blown = null; renderSafetyPanel(); }));
window.addEventListener('pk-answers', () => { renderScopePanel(); renderSafetyPanel(); });

function sizeAll() {
  if (state.tab === 'scope') size(scope, SW, SH);
  if (state.tab === 'plug') size(plug, PW, PH);
  if (state.tab === 'safe') size(safe, FW, FH);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // Slow the trace's drift right down so it looks steady, as on a real oscilloscope
  tNow += dt * 0.002;
  if (state.tab === 'scope') drawScope();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { sizeAll(); drawPlug(); drawSafety(); });
const startTab = location.hash.slice(1);
showTab(['scope', 'plug', 'safe'].includes(startTab) ? startTab : 'scope');
requestAnimationFrame(frame);
