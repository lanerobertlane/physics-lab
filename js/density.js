// Density practical: measure mass on a balance and volume by a ruler (regular block),
// a eureka can (irregular object) or a measuring cylinder (liquid). ρ = m ÷ V.

PK.header({
  title: 'Density practical',
  spec: [
    { code: '4.3.1.1', text: 'Density of materials: ρ = m ÷ V; the particle model explains differences in density' },
    { code: '4.3.1.1', text: 'Required practical: use appropriate apparatus to make and record measurements to determine the densities of regular and irregular solid objects and liquids' },
    { code: 'KS3', text: 'Density, using the particle model' },
  ],
});

const $ = (id) => document.getElementById(id);
const SOLIDS = { aluminium: ['Aluminium', 2.7, '#c3c9d2'], steel: ['Steel', 7.8, '#8a929f'], brass: ['Brass', 8.5, '#d4b04c'], wood: ['Pine wood', 0.5, '#d2a670'], perspex: ['Perspex', 1.18, 'rgba(180, 220, 255, .8)'] };
const OBJECTS = { stone: ['Stone', 2.6, '#8d8172', 32], key: ['Brass key', 8.5, '#d4b04c', 2.4], plasticine: ['Plasticine lump', 1.6, '#e57373', 18], bolt: ['Steel bolt', 7.8, '#8a929f', 6.5] };
const LIQUIDS = { water: ['Water', 1.0, 'rgba(120, 180, 255, .7)'], salt: ['Salt water', 1.03, 'rgba(140, 190, 240, .7)'], oil: ['Cooking oil', 0.92, 'rgba(240, 200, 80, .8)'], ethanol: ['Ethanol', 0.79, 'rgba(220, 230, 255, .7)'], glycerol: ['Glycerol', 1.26, 'rgba(230, 240, 200, .8)'] };

const state = {
  mode: 'regular', solid: 'aluminium', dims: [4, 3, 2.5],
  object: 'stone', dropped: false, flow: 0,
  liquid: 'water', poured: 50, tared: true,
  answers: false, rows: [], t: 0,
};

const CYL_MASS = 82.4;   // empty measuring cylinder, g

function measurement() {
  if (state.mode === 'regular') {
    const [l, w, h] = state.dims, V = l * w * h, m = V * SOLIDS[state.solid][1];
    return { what: `${SOLIDS[state.solid][0]} block`, m, V, how: `${l} × ${w} × ${h} cm` };
  }
  if (state.mode === 'irregular') {
    const o = OBJECTS[state.object], V = o[3];
    return { what: o[0], m: V * o[1], V, how: 'eureka can' };
  }
  const L = LIQUIDS[state.liquid], m = state.poured * L[1];
  return { what: L[0], m, V: state.poured, how: 'measuring cylinder' };
}

// ---------- Drawing ----------

const cv = $('lab'), ctx = cv.getContext('2d');
const W = 800, H = 380;
function sizeCanvas() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }

function balance(x, reading, c) {
  ctx.fillStyle = '#39414d'; ctx.fillRect(x - 110, 300, 220, 50);
  ctx.fillStyle = '#9aa3ae'; ctx.fillRect(x - 90, 288, 180, 12);
  ctx.fillStyle = '#0d1a0d'; ctx.fillRect(x - 60, 310, 120, 30);
  ctx.fillStyle = '#7CFC00'; ctx.font = '700 20px ui-monospace, Consolas, monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(`${reading.toFixed(1)} g`, x + 54, 326);
}

function cylinder(x, y0, vol, maxVol, colour, c, label = true) {
  const w = 54, h = 220, top = y0;
  if (vol > 0) { const fh = (vol / maxVol) * (h - 10); ctx.fillStyle = colour; ctx.fillRect(x - w / 2 + 2, top + h - fh, w - 4, fh); }
  ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w / 2, top + h); ctx.lineTo(x + w / 2, top + h); ctx.lineTo(x + w / 2, top); ctx.stroke();
  ctx.fillRect(x - w / 2 - 10, top + h, w + 20, 6);
  ctx.lineWidth = 1; ctx.fillStyle = c.text; ctx.font = `600 9px ${c.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let v = 0; v <= maxVol; v += maxVol / 20) {
    const yy = top + h - (v / maxVol) * (h - 10);
    const major = Math.round(v) % (maxVol / 4) === 0;
    ctx.beginPath(); ctx.moveTo(x + w / 2, yy); ctx.lineTo(x + w / 2 - (major ? 14 : 7), yy); ctx.stroke();
    if (major && label) ctx.fillText(Math.round(v), x + w / 2 - 16, yy);
  }
}

function draw() {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  const m = measurement();

  if (state.mode === 'regular') {
    const [l, w, h] = state.dims, s = 34, bx = 260, by = 288;
    const col = SOLIDS[state.solid][2];
    // Block in simple 3D
    ctx.fillStyle = col; ctx.strokeStyle = c.text; ctx.lineWidth = 2;
    ctx.fillRect(bx - (l * s) / 2, by - h * s, l * s, h * s); ctx.strokeRect(bx - (l * s) / 2, by - h * s, l * s, h * s);
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(bx - (l * s) / 2, by - h * s); ctx.lineTo(bx - (l * s) / 2 + w * 14, by - h * s - w * 10); ctx.lineTo(bx + (l * s) / 2 + w * 14, by - h * s - w * 10); ctx.lineTo(bx + (l * s) / 2, by - h * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + (l * s) / 2, by - h * s); ctx.lineTo(bx + (l * s) / 2 + w * 14, by - h * s - w * 10); ctx.lineTo(bx + (l * s) / 2 + w * 14, by - w * 10); ctx.lineTo(bx + (l * s) / 2, by); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    balance(bx, m.m, c);
    // Measurement labels
    ctx.fillStyle = c.text; ctx.font = `700 14px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`length ${l} cm`, bx, by - h * s - w * 10 - 30);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`width ${w} cm`, bx + (l * s) / 2 + w * 14 + 8, by - h * s - w * 5);
    ctx.textAlign = 'right'; ctx.fillText(`height ${h} cm`, bx - (l * s) / 2 - 10, by - (h * s) / 2);
    ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'left';
    ctx.fillText('Measured with a ruler (to the nearest mm).', 470, 120);
    ctx.fillText('Volume = length × width × height', 470, 145);
  } else if (state.mode === 'irregular') {
    const o = OBJECTS[state.object];
    // Eureka can, spout and measuring cylinder
    const ex = 230, ey = 120;
    state.flow = state.dropped ? Math.min(1, state.flow + 0.02) : 0;
    ctx.fillStyle = 'rgba(120, 180, 255, .55)'; ctx.fillRect(ex - 70, ey + 40, 140, 140);
    ctx.strokeStyle = c.text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ex - 70, ey); ctx.lineTo(ex - 70, ey + 180); ctx.lineTo(ex + 70, ey + 180); ctx.lineTo(ex + 70, ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex + 70, ey + 40); ctx.lineTo(ex + 120, ey + 70); ctx.moveTo(ex + 70, ey + 48); ctx.lineTo(ex + 118, ey + 78); ctx.stroke();
    if (state.dropped && state.flow < 1) { ctx.fillStyle = 'rgba(120, 180, 255, .8)'; ctx.fillRect(ex + 116, ey + 74, 4, 70); }
    const objY = state.dropped ? ey + 150 : ey - 40;
    ctx.fillStyle = o[2]; ctx.beginPath(); ctx.ellipse(ex - 10, objY, 18 + o[3] * 0.4, 12 + o[3] * 0.3, 0.3, 0, Math.PI * 2); ctx.fill();
    cylinder(ex + 150, 80, o[3] * state.flow, 50, 'rgba(120, 180, 255, .7)', c);
    ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('eureka can', ex, ey + 186);
    ctx.fillText('measuring cylinder (cm³)', ex + 150, 312);
    balance(620, m.m, c);
    ctx.fillStyle = o[2]; ctx.beginPath(); ctx.ellipse(620, 276, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'center';
    ctx.fillText(`mass of the ${o[0].toLowerCase()}`, 620, 360);
  } else {
    const L = LIQUIDS[state.liquid];
    cylinder(400, 50, state.poured, 100, L[2], c);
    balance(400, (state.tared ? 0 : CYL_MASS) + m.m, c);
    ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(state.tared ? 'Balance zeroed with the empty cylinder on it,' : 'Balance not zeroed: the reading includes', 520, 120);
    ctx.fillText(state.tared ? 'so it shows the mass of liquid only.' : `the cylinder (${CYL_MASS} g). Subtract it, or press Zero.`, 520, 140);
    ctx.fillText('Read the volume at the bottom of the meniscus.', 520, 170);
  }
}

// ---------- Panel ----------

function renderControls() {
  const el = $('controls'), bar = $('bar');
  if (state.mode === 'regular') {
    $('intro').textContent = 'Measure the block’s length, width and height with a ruler, and its mass on a balance. Volume = length × width × height.';
    el.innerHTML = `<h2>Block</h2><div class="field"><label for="solid">Material</label><select class="select" id="solid">${Object.entries(SOLIDS).map(([id, s]) => `<option value="${id}">${s[0]}</option>`).join('')}</select></div>`;
    $('solid').value = state.solid;
    $('solid').addEventListener('change', (e) => { state.solid = e.target.value; });
    bar.innerHTML = '<button class="btn" id="newblock">🎲 A different-sized block</button>';
    $('newblock').addEventListener('click', () => { const r = () => (2 + Math.round(Math.random() * 8) / 2); state.dims = [r() + 1, r(), r() - 0.5]; });
  } else if (state.mode === 'irregular') {
    $('intro').textContent = 'Fill a eureka can to the spout. Lower the object in: the water it pushes out (displaces) flows into the measuring cylinder. That volume equals the object’s volume.';
    el.innerHTML = `<h2>Object</h2><div class="field"><label for="obj">Object</label><select class="select" id="obj">${Object.entries(OBJECTS).map(([id, o]) => `<option value="${id}">${o[0]}</option>`).join('')}</select></div>`;
    $('obj').value = state.object;
    $('obj').addEventListener('change', (e) => { state.object = e.target.value; state.dropped = false; });
    bar.innerHTML = '<button class="btn primary" id="drop">⬇ Lower it into the eureka can</button><button class="btn" id="out">↺ Take it out and refill</button>';
    $('drop').addEventListener('click', () => { state.dropped = true; });
    $('out').addEventListener('click', () => { state.dropped = false; });
  } else {
    $('intro').textContent = 'Put an empty measuring cylinder on the balance and zero it. Pour in some liquid, then read the volume from the cylinder and the mass from the balance.';
    el.innerHTML = `<h2>Liquid</h2><div class="field"><label for="liq">Liquid</label><select class="select" id="liq">${Object.entries(LIQUIDS).map(([id, l]) => `<option value="${id}">${l[0]}</option>`).join('')}</select></div>
      <div class="ctl"><label for="vol">Volume poured <b id="vol-val">${state.poured} cm³</b></label><input type="range" id="vol" min="10" max="100" step="5" value="${state.poured}"></div>`;
    $('liq').value = state.liquid;
    $('liq').addEventListener('change', (e) => { state.liquid = e.target.value; });
    $('vol').addEventListener('input', (e) => { state.poured = Number(e.target.value); $('vol-val').textContent = `${state.poured} cm³`; });
    bar.innerHTML = `<button class="btn" id="tare">${state.tared ? 'Un-zero the balance' : '⓪ Zero (tare) the balance'}</button>`;
    $('tare').addEventListener('click', () => { state.tared = !state.tared; renderControls(); });
  }
}

function renderTable() {
  $('table').innerHTML = state.rows.length ? `<table class="results"><thead><tr><th>Object</th><th>Mass (g)</th><th>Volume (cm³)</th><th>Density (g/cm³)</th><th>Density (kg/m³)</th></tr></thead>
    <tbody>${state.rows.map((r) => `<tr><td>${r.what}</td><td class="n">${r.m.toFixed(1)}</td><td class="n">${parseFloat(r.V.toFixed(1))}</td>
      <td class="n">${state.answers ? (r.m / r.V).toFixed(2) : '?'}</td><td class="n">${state.answers ? Math.round((r.m / r.V) * 1000) : '?'}</td></tr>`).join('')}</tbody></table>` : '<p class="note">No readings yet. Take the measurements, then press Record.</p>';
}

document.querySelectorAll('#modes .chip').forEach((b) => b.addEventListener('click', () => {
  state.mode = b.dataset.m;
  document.querySelectorAll('#modes .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderControls();
}));
$('record').addEventListener('click', () => {
  if (state.mode === 'irregular' && !state.dropped) { PK.toast('Lower the object into the eureka can first'); return; }
  state.rows.push(measurement());
  renderTable();
});
$('clear').addEventListener('click', () => { state.rows = []; renderTable(); });
$('answers').addEventListener('change', (e) => { state.answers = e.target.checked; renderTable(); });

function frame() { draw(); requestAnimationFrame(frame); }
window.addEventListener('resize', sizeCanvas);
sizeCanvas();
renderControls();
renderTable();
requestAnimationFrame(frame);
