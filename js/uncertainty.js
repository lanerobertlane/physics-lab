// Uncertainty and means: reading the scales on common instruments (with a magnifier), repeat
// readings with anomalies, the mean and the uncertainty, and accuracy against precision.

PK.header({
  title: 'Uncertainty & means',
  answers: true,
  specNote: 'AQA references are to Working scientifically (WS) and the Mathematical skills (MS), which are the same in GCSE Physics, Chemistry, Biology and Combined Science. KS3 references are to the National Curriculum programme of study.',
  spec: [
    { code: 'WS 2', text: 'Make and record measurements using a range of apparatus, reading scales correctly. The resolution of an instrument' },
    { code: 'WS 3', text: 'Calculate the mean of repeat readings, leaving out anomalous results, and use the range to estimate the uncertainty' },
    { code: 'WS 3', text: 'Evaluate data in terms of accuracy, precision, repeatability and reproducibility, and identify random and systematic errors' },
    { code: 'MS 2', text: 'Find arithmetic means' },
    { code: 'KS3', text: 'Make and record measurements using a range of methods, and evaluate the reliability of methods' },
  ],
});

const $ = (id) => document.getElementById(id);
const scene = $('scene'), ctx = scene.getContext('2d');
const SW = 560, SH = 300;
const state = { tab: 'scales' };
const fix = (x, dp) => (Math.round(x * 10 ** dp) / 10 ** dp).toFixed(dp);

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), art: PK.cssVar('--art'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = c.surface; ctx.strokeText(text, x, y);
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
const INK = '#1c2430';
function txt(s, x, y, size = 11, align = 'center', col = INK) { ctx.font = `700 ${size}px ${PK.cssVar('--font-body') || 'sans-serif'}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }

// =====================================================================
// Reading scales
// =====================================================================

const INST = [
  // mag: where the magnifier sits, clear of the instrument: [x, y, radius, how many times bigger]
  { name: 'Ruler', unit: 'cm', res: 0.1, min: 2.5, max: 13.5, dp: 1, what: 'the length of the pencil', resText: '0.1 cm (1 mm)', mag: [462, 82, 72, 2] },
  { name: 'Measuring cylinder', unit: 'cm³', res: 1, min: 14, max: 88, dp: 0, what: 'the volume of water', resText: '1 cm³', mag: [452, 132, 82, 2.2] },
  { name: 'Thermometer', unit: '°C', res: 1, min: 6, max: 94, dp: 0, what: 'the temperature', resText: '1 °C', mag: [452, 132, 82, 2.5] },
  { name: 'Newtonmeter', unit: 'N', res: 0.2, min: 0.6, max: 9.4, dp: 1, what: 'the force', resText: '0.2 N', mag: [452, 132, 82, 2.5] },
  { name: 'Ammeter', unit: 'A', res: 0.02, min: 0.06, max: 0.94, dp: 2, what: 'the current', resText: '0.02 A', mag: [74, 236, 60, 1.6] },
];
const sc = { i: 0, value: 0, eye: 0, result: '', shown: false };
const inst = () => INST[sc.i];
// A new value: on a division, give or take a little, as a real reading would be
function newValue() {
  const r = inst(), n = Math.round((r.min + Math.random() * (r.max - r.min)) / r.res);
  sc.value = n * r.res + (Math.random() - 0.5) * r.res * 0.4;
  sc.result = ''; sc.shown = false; $('guess').value = ''; $('guess-res').value = '';
}
const correct = () => Math.round(sc.value / inst().res) * inst().res;

// Each instrument draws itself in its own space, and says where its reading point is (for the magnifier)
const DRAW = {
  Ruler() {
    const X = (cm) => 40 + cm * 32, y = 186;
    ctx.fillStyle = '#f3e5ab'; ctx.fillRect(28, y, 504, 56); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1.5; ctx.strokeRect(28, y, 504, 56);
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (let mm = 0; mm <= 150; mm++) { const x = X(mm / 10), h = mm % 10 === 0 ? 18 : mm % 5 === 0 ? 12 : 7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke(); }
    for (let cm = 0; cm <= 15; cm++) txt(String(cm), X(cm), y + 30, 12);
    txt('cm', X(15) - 2, y + 45, 10, 'right');
    // The pencil, lined up with 0
    const end = X(sc.value);
    ctx.fillStyle = '#ffca28'; ctx.fillRect(X(0), y - 26, end - X(0) - 18, 22);
    ctx.fillStyle = '#f5d6a8'; ctx.beginPath(); ctx.moveTo(end - 18, y - 26); ctx.lineTo(end, y - 15); ctx.lineTo(end - 18, y - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#424242'; ctx.beginPath(); ctx.moveTo(end - 5, y - 18); ctx.lineTo(end, y - 15); ctx.lineTo(end - 5, y - 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e57373'; ctx.fillRect(X(0) - 2, y - 26, 10, 22);
    return { x: end, y: y + 2 };   // the magnifier shows the pencil tip, the millimetres and the numbers
  },
  'Measuring cylinder'() {
    const top = 30, bottom = 270, Y = (v) => bottom - (v / 100) * (bottom - top), x0 = 230, w = 70;
    const level = Y(sc.value);
    ctx.fillStyle = 'rgba(100, 170, 230, .35)'; ctx.fillRect(x0, level, w, bottom - level);
    // The meniscus curves down in the middle: read the bottom of it
    ctx.fillStyle = PK.cssVar('--surface'); ctx.beginPath(); ctx.moveTo(x0, level - 5); ctx.quadraticCurveTo(x0 + w / 2, level + 9, x0 + w, level - 5); ctx.lineTo(x0 + w, level - 7); ctx.lineTo(x0, level - 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(100, 170, 230, .35)'; ctx.beginPath(); ctx.moveTo(x0, level - 5); ctx.quadraticCurveTo(x0 + w / 2, level + 9, x0 + w, level - 5); ctx.lineTo(x0 + w, level); ctx.lineTo(x0, level); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b6cb0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, level - 5); ctx.quadraticCurveTo(x0 + w / 2, level + 9, x0 + w, level - 5); ctx.stroke();
    ctx.strokeStyle = PK.cssVar('--art'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0, top - 15); ctx.lineTo(x0, bottom); ctx.lineTo(x0 + w, bottom); ctx.lineTo(x0 + w, top - 15); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (let v = 0; v <= 100; v++) { const h = v % 10 === 0 ? 22 : v % 5 === 0 ? 14 : 8; ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.lineTo(x0 + h, Y(v)); ctx.stroke(); }
    for (let v = 10; v <= 100; v += 10) txt(String(v), x0 - 8, Y(v), 11, 'right');
    txt('cm³', x0 + w / 2, bottom + 14, 11);
    return { x: x0 + 4, y: level + 2 };   // the numbers, the marks and the bottom of the meniscus
  },
  Thermometer() {
    const top = 26, bottom = 250, lo = -10, hi = 110, Y = (t) => bottom - ((t - lo) / (hi - lo)) * (bottom - top), x = 270;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = PK.cssVar('--art'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x - 9, top - 10, 18, bottom - top + 16, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, bottom + 18, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x, bottom + 18, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 3, Y(sc.value), 6, bottom + 10 - Y(sc.value));
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (let t = lo; t <= hi; t++) { const h = t % 10 === 0 ? 16 : t % 5 === 0 ? 11 : 6; ctx.beginPath(); ctx.moveTo(x + 10, Y(t)); ctx.lineTo(x + 10 + h, Y(t)); ctx.stroke(); }
    for (let t = lo; t <= hi; t += 10) txt(String(t), x + 30, Y(t), 11, 'left');
    txt('°C', x + 30, top - 14, 11, 'left');
    return { x: x + 18, y: Y(sc.value) };   // the top of the liquid, the marks and the numbers
  },
  Newtonmeter() {
    const top = 40, bottom = 240, Y = (f) => top + (f / 10) * (bottom - top), x = 270;
    ctx.fillStyle = '#e0e0e0'; ctx.strokeStyle = PK.cssVar('--art'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x - 34, top - 22, 68, bottom - top + 44, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, top, 40, bottom - top);
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (let k = 0; k <= 50; k++) { const f = k * 0.2, h = k % 5 === 0 ? 14 : 7; ctx.beginPath(); ctx.moveTo(x - 6, Y(f)); ctx.lineTo(x - 6 + h, Y(f)); ctx.stroke(); }
    for (let f = 0; f <= 10; f++) txt(String(f), x + 22, Y(f), 11);
    txt('N', x + 22, top - 12, 11);
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.moveTo(x - 30, Y(sc.value) - 5); ctx.lineTo(x - 4, Y(sc.value)); ctx.lineTo(x - 30, Y(sc.value) + 5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#757575'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, bottom + 22); ctx.lineTo(x, bottom + 34 + sc.value * 2); ctx.stroke();
    ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x - 14, bottom + 34 + sc.value * 2, 28, 18);
    return { x, y: Y(sc.value) };   // the pointer, the marks and the numbers
  },
  Ammeter() {
    const cx = 280, cy = 240, r = 190, a = (v) => Math.PI * (1.18 + 0.64 * v);
    ctx.fillStyle = '#fafafa'; ctx.strokeStyle = PK.cssVar('--art'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r + 26, Math.PI * 1.1, Math.PI * 1.9); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (let k = 0; k <= 50; k++) { const v = k * 0.02, an = a(v), h = k % 5 === 0 ? 16 : 8; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); ctx.lineTo(cx + Math.cos(an) * (r - h), cy + Math.sin(an) * (r - h)); ctx.stroke(); }
    for (let k = 0; k <= 10; k += 2) { const v = k / 10, an = a(v); txt(String(v), cx + Math.cos(an) * (r - 30), cy + Math.sin(an) * (r - 30), 11); }
    txt('A', cx, cy - 70, 16);
    const an = a(sc.value);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * (r + 4), cy + Math.sin(an) * (r + 4)); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    return { x: cx + Math.cos(an) * (r - 18), y: cy + Math.sin(an) * (r - 18) };
  },
};
function drawScales(c) {
  const r = inst(), draw = DRAW[r.name];
  const at = draw();
  // Reading a meniscus from the wrong height gives the wrong answer (parallax). The eye stays on the drawing.
  let seen = sc.value;
  if (r.name === 'Measuring cylinder') {
    const ex = 90, eyeY = Math.max(46, Math.min(SH - 24, at.y + sc.eye * 70));
    ctx.fillStyle = c.text; ctx.font = `26px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👁️', ex, eyeY);
    ctx.strokeStyle = sc.eye ? '#e53935' : '#2e9e4f'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    const hitX = 230, hitY = eyeY + (at.y - eyeY) * ((hitX - ex) / (265 - ex));
    ctx.beginPath(); ctx.moveTo(ex + 16, eyeY); ctx.lineTo(265, at.y); ctx.stroke(); ctx.setLineDash([]);
    seen = sc.value + (at.y - hitY) / 2.4;
    if (sc.eye) tag(c, sc.eye < 0 ? 'reads too high' : 'reads too low', ex, eyeY + (eyeY < 80 ? 26 : -26), '#e53935', 'center', 12);
  }
  // A magnifier over the reading: for the measuring cylinder it shows what your eye sees from where it is
  const [mx, my, mr, k] = r.mag, real = sc.value;
  ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = c.surface; ctx.fillRect(mx - mr, my - mr, 2 * mr, 2 * mr);
  sc.value = seen;
  ctx.translate(mx - at.x * k, my - at.y * k); ctx.scale(k, k); draw();
  sc.value = real;
  ctx.restore();
  ctx.strokeStyle = c.art; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,120,120,.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(at.x, at.y); ctx.lineTo(mx - mr * 0.7, my + mr * 0.7); ctx.stroke(); ctx.setLineDash([]);
  const cap = r.name === 'Measuring cylinder' ? `What your eye sees, ×${k}` : `Magnified ×${k}`;
  const capCol = sc.eye && r.name === 'Measuring cylinder' ? '#e53935' : c.muted;
  if (my + mr + 16 <= SH) tag(c, cap, mx, my + mr + 12, capCol, 'center', 11, 700);
  else tag(c, cap, mx + mr + 8, my + mr - 10, capCol, 'left', 11, 700);
  tag(c, `Read ${r.what}`, 14, 16, c.text, 'left', 14);
}
function renderScales() {
  const r = inst();
  $('guess-unit').textContent = r.unit; $('res-unit').textContent = r.unit;
  $('eye-field').hidden = r.name !== 'Measuring cylinder';
  $('scale-info').innerHTML = `${sc.result ? `<div style="margin-bottom:10px">${sc.result}</div>` : ''}
    ${sc.shown ? `<dl class="readout"><dt>Resolution</dt><dd>${r.resText}</dd><dt>The reading</dt><dd>${fix(correct(), r.dp)} ${r.unit}</dd></dl>
      <p class="note" style="margin-bottom:0">Reading a scale, you’re uncertain by about half the smallest division.</p>` : ''}`;
}
function check() {
  const r = inst(), sv = $('guess').value.trim(), sr = $('guess-res').value.trim(), v = Number(sv), res = Number(sr);
  if (sv === '' && sr === '') { sc.result = '<p class="note" style="margin:0">Type your reading and the resolution first.</p>'; renderScales(); return; }
  const lines = [];
  if (sv !== '') {
    const ok = Number.isFinite(v) && Math.abs(v - sc.value) <= r.res * 0.75;
    lines.push(ok ? `<span class="badge good">Right</span> Your reading, ${sv} ${r.unit}.`
      : `<span class="badge bad">Not quite</span> Your reading. Look again at the magnifier: count the small divisions from the nearest number.${r.name === 'Measuring cylinder' ? ' Read the bottom of the meniscus with your eye level with it.' : ''}`);
  }
  if (sr !== '') {
    const ok = Number.isFinite(res) && Math.abs(res - r.res) < r.res * 1e-6;
    lines.push(ok ? `<span class="badge good">Right</span> The resolution, ${sr} ${r.unit}.`
      : `<span class="badge bad">Not quite</span> The resolution is the size of one small division, in ${r.unit}. How much does each small mark go up by?`);
  }
  sc.result = lines.map((l) => `<p style="margin:0 0 6px">${l}</p>`).join('');
  if (sv !== '' && sr !== '') sc.shown = true;
  renderScales();
}

// =====================================================================
// Repeats and means
// =====================================================================

const EXAMPLES = [
  { name: 'New random readings', unit: '', vals: [], random: true },
  { name: 'Ruler drop: how far the ruler fell', unit: 'cm', vals: [12.5, 14.0, 13.2, 21.8, 12.9] },
  { name: 'Time for 10 swings of a pendulum', unit: 's', vals: [15.21, 15.43, 15.10, 15.36, 15.28] },
  { name: 'Resistance of a wire', unit: 'Ω', vals: [2.1, 2.3, 2.2, 3.5, 2.2] },
  { name: 'Your own readings', unit: '', vals: [] },
];
const N_ROWS = 6;
const mean = { ex: 0, out: new Set() };
function buildRows() {
  $('rows').innerHTML = Array.from({ length: N_ROWS }, (_, i) => `<div class="reading-row" data-i="${i}"><label for="r${i}">Reading ${i + 1}</label><input type="number" id="r${i}" step="any" inputmode="decimal"><button class="btn" data-cross="${i}">Cross out</button></div>`).join('');
}
// Random sets of repeat readings: each experiment has a typical value and spread. About two times in
// three, one reading is anomalous.
const RANDOM = [
  { what: 'Ruler drop: how far the ruler fell', unit: 'cm', lo: 10, hi: 25, spread: 1.2, dp: 1 },
  { what: 'Time for 10 swings of a pendulum', unit: 's', lo: 12, hi: 20, spread: 0.25, dp: 2 },
  { what: 'Resistance of a wire', unit: 'Ω', lo: 1.5, hi: 6, spread: 0.08, dp: 2 },
  { what: 'Time for a trolley to roll down a ramp', unit: 's', lo: 1.5, hi: 3.5, spread: 0.08, dp: 2 },
  { what: 'Temperature rise of a heated block', unit: '°C', lo: 8, hi: 20, spread: 0.6, dp: 1 },
  { what: 'Height a ball bounces', unit: 'cm', lo: 30, hi: 70, spread: 2, dp: 0 },
];
function randomSet() {
  const e = RANDOM[Math.floor(Math.random() * RANDOM.length)];
  for (let tries = 0; tries < 60; tries++) {
    const base = e.lo + Math.random() * (e.hi - e.lo), n = 4 + Math.floor(Math.random() * 3), odd = Math.random() < 0.65 ? Math.floor(Math.random() * n) : -1;
    const vals = Array.from({ length: n }, (_, k) => {
      const off = k === odd ? (Math.random() < 0.5 ? -1 : 1) * e.spread * (4 + Math.random() * 3) : (Math.random() - 0.5) * 2 * e.spread;
      return Number((base + off).toFixed(e.dp));
    });
    // Keep it only if the anomaly (or none) is the one a careful student should find
    const found = anomalies(vals.map((v, i) => ({ i, v })));
    if (vals.every((v) => v > 0) && found.length === (odd < 0 ? 0 : 1) && (odd < 0 || found[0] === odd)) return { e, vals };
  }
  return { e, vals: [] };
}
function loadExample(i) {
  mean.ex = i; mean.out = new Set();
  const e = EXAMPLES[i];
  if (e.random) { const r = randomSet(); e.unit = r.e.unit; e.what = r.e.what; e.vals = r.vals.map((v) => v.toFixed(r.e.dp)); }
  for (let k = 0; k < N_ROWS; k++) $(`r${k}`).value = e.vals[k] ?? '';
  $('rand-what').textContent = e.random ? `${e.what}, in ${e.unit}` : '';
  $('rand-what').hidden = !e.random;
}
const decimals = (s) => (String(s).includes('.') ? String(s).split('.')[1].length : 0);
function readings() {
  const all = [];
  for (let k = 0; k < N_ROWS; k++) { const s = $(`r${k}`).value.trim(); if (s !== '' && Number.isFinite(Number(s))) all.push({ i: k, v: Number(s), s }); }
  return all;
}
function renderMeans() {
  const all = readings(), used = all.filter((r) => !mean.out.has(r.i)), unit = EXAMPLES[mean.ex].unit;
  document.querySelectorAll('.reading-row').forEach((row) => {
    const i = Number(row.dataset.i), out = mean.out.has(i);
    row.classList.toggle('out', out);
    row.querySelector('button').textContent = out ? 'Put back' : 'Cross out';
  });
  if (used.length < 2) { $('mean-info').innerHTML = '<p class="note" style="margin:0">Enter at least two readings.</p>'; return; }
  const dp = Math.max(...all.map((r) => decimals(r.s))), sum = used.reduce((a, r) => a + r.v, 0), m = sum / used.length;
  const max = Math.max(...used.map((r) => r.v)), min = Math.min(...used.map((r) => r.v)), range = max - min, u = range / 2;
  $('mean-info').innerHTML = `<div class="working" style="margin-top:0">
      <p><b>Mean</b> = (${used.map((r) => r.s).join(' + ')}) ÷ ${used.length}<br>= ${PK.ans(`${fix(sum, dp)} ÷ ${used.length} = <b>${fix(m, dp)} ${unit}</b>`)}</p>
      <p><b>Range</b> = ${fix(max, dp)} − ${fix(min, dp)} = ${PK.ans(`${fix(range, dp)} ${unit}`)}</p>
      <p><b>Uncertainty</b> = ± range ÷ 2 = ${PK.ans(`± ${fix(u, dp + 1)} ${unit}`)}</p>
    </div>
    <p style="margin-bottom:0"><b>Result:</b> ${PK.ans(`${fix(m, dp)} ± ${fix(u, dp + 1)} ${unit}`)}</p>`;
}
// Anomalies: readings a long way from the middle of the others
function anomalies(all) {
  if (all.length < 3) return [];
  const sorted = all.map((r) => r.v).sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)];
  const spread = Math.max(1e-9, ...all.map((r) => Math.abs(r.v - med)).sort((a, b) => a - b).slice(0, Math.max(1, all.length - 1)));
  return all.filter((r) => Math.abs(r.v - med) > 2.5 * spread && Math.abs(r.v - med) > 0.05 * Math.abs(med)).map((r) => r.i);
}
// "Reading 4", "Readings 2 and 4"
const list = (ns) => (ns.length > 1 ? `Readings ${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}` : `Reading ${ns[0]}`);
function checkAnomalies() {
  const all = readings();
  if (all.length < 3) { $('anom-result').innerHTML = 'Enter at least three readings first.'; return; }
  const odd = anomalies(all), out = [...mean.out].filter((i) => all.some((r) => r.i === i));
  const wrongOut = out.filter((i) => !odd.includes(i)).map((i) => i + 1), missed = odd.filter((i) => !out.includes(i)).map((i) => i + 1);
  let msg;
  if (!wrongOut.length && !missed.length) {
    const n = odd.map((i) => i + 1);
    msg = n.length ? `<span class="badge good">Right</span> ${list(n)} ${n.length > 1 ? 'don’t' : 'doesn’t'} fit the pattern of the others, so leaving ${n.length > 1 ? 'them' : 'it'} out of the mean is right.`
      : '<span class="badge good">Right</span> None of these readings is anomalous: they are all close together, so use them all.';
  } else {
    const bits = [];
    if (missed.length) bits.push(`${list(missed)} ${missed.length > 1 ? 'are' : 'is'} a long way from the others. ${missed.length > 1 ? 'They are' : 'It is'} anomalous, so cross ${missed.length > 1 ? 'them' : 'it'} out.`);
    if (wrongOut.length) bits.push(`${list(wrongOut)} ${wrongOut.length > 1 ? 'fit' : 'fits'} the pattern of the others, so keep ${wrongOut.length > 1 ? 'them' : 'it'} in the mean.`);
    msg = `<span class="badge bad">Not quite</span> ${bits.join(' ')}`;
  }
  $('anom-result').innerHTML = msg;
}
function drawMeans(c) {
  const all = readings(), used = all.filter((r) => !mean.out.has(r.i)), unit = EXAMPLES[mean.ex].unit;
  tag(c, 'The readings on a number line', 14, 16, c.text, 'left', 14);
  if (!all.length) { tag(c, 'Enter some readings', SW / 2, 150, c.muted, 'center', 14, 700); return; }
  const vs = all.map((r) => r.v), lo = Math.min(...vs), hi = Math.max(...vs), pad = Math.max((hi - lo) * 0.25, Math.abs(hi) * 0.02, 0.1);
  const a = lo - pad, b = hi + pad, X = (v) => 50 + ((v - a) / (b - a)) * 460, y = 170;
  // Tick marks at a round step
  const step = (() => { const raw = (b - a) / 6, e = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 5, 10].map((k) => k * e).find((s) => s >= raw); })();
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(520, y); ctx.stroke();
  const dpT = Math.max(0, -Math.floor(Math.log10(step)));
  for (let t = Math.ceil(a / step) * step; t <= b; t += step) { ctx.beginPath(); ctx.moveTo(X(t), y - 6); ctx.lineTo(X(t), y + 6); ctx.stroke(); tag(c, t.toFixed(dpT), X(t), y + 20, c.muted, 'center', 12, 700); }
  tag(c, unit, 530, y + 20, c.muted, 'left', 12, 700);
  if (used.length >= 2 && PK.answersShown()) {
    const m = used.reduce((s, r) => s + r.v, 0) / used.length, u = (Math.max(...used.map((r) => r.v)) - Math.min(...used.map((r) => r.v))) / 2;
    ctx.fillStyle = 'rgba(124, 58, 237, .15)'; ctx.fillRect(X(m - u), y - 60, X(m + u) - X(m - u), 60);
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(m), y - 70); ctx.lineTo(X(m), y); ctx.stroke();
    tag(c, 'mean', X(m), y - 80, '#7c3aed', 'center', 13);
    // A bracket under the axis shows the uncertainty either side of the mean
    if (u > 0) {
      const by = y + 46, l = X(m - u), rr = X(m + u);
      ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(l, y + 6); ctx.lineTo(l, by + 6); ctx.moveTo(rr, y + 6); ctx.lineTo(rr, by + 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l, by); ctx.lineTo(rr, by); ctx.moveTo(X(m), by - 6); ctx.lineTo(X(m), by + 6); ctx.stroke();
      ctx.fillStyle = '#7c3aed';
      for (const [x, d] of [[l, 1], [rr, -1]]) { ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + d * 8, by - 4); ctx.lineTo(x + d * 8, by + 4); ctx.closePath(); ctx.fill(); }
      tag(c, 'the uncertainty, either side of the mean', X(m), by + 18, '#7c3aed', 'center', 12, 700);
    }
  }
  all.forEach((r, k) => {
    const yy = y - 18 - (k % 3) * 14, out = mean.out.has(r.i);
    if (out) { ctx.strokeStyle = '#c62828'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(r.v) - 6, yy - 6); ctx.lineTo(X(r.v) + 6, yy + 6); ctx.moveTo(X(r.v) + 6, yy - 6); ctx.lineTo(X(r.v) - 6, yy + 6); ctx.stroke(); }
    else { ctx.fillStyle = '#1e88e5'; ctx.beginPath(); ctx.arc(X(r.v), yy, 6, 0, Math.PI * 2); ctx.fill(); }
  });
  tag(c, '● reading   ✕ crossed out', 14, 280, c.muted, 'left', 12, 700);
}

// =====================================================================
// Accuracy and precision
// =====================================================================

const TRUE = 20.0;
const acc = { rand: 0, sys: 0, readings: [] };
function takeReadings() {
  const sd = acc.rand ? 0.4 : 0.05, offset = acc.sys ? 0.6 : 0;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  acc.readings = Array.from({ length: 5 }, () => Math.round((TRUE + offset + gauss() * sd) * 10) / 10);
}
function verdict() {
  const r = acc.readings, m = r.reduce((a, b) => a + b, 0) / r.length, range = Math.max(...r) - Math.min(...r);
  return { m, range, precise: range <= 0.3, accurate: Math.abs(m - TRUE) <= 0.2 };
}
function drawAccuracy(c) {
  const v = verdict();
  // A target: the bullseye is the true value
  const tx = 130, ty = 160, R = 100;
  [[R, '#ffffff'], [R * 0.75, '#e3f2fd'], [R * 0.5, '#bbdefb'], [R * 0.25, '#90caf9']].forEach(([r, col]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = c.art; ctx.lineWidth = 1; ctx.stroke(); });
  ctx.fillStyle = '#2e9e4f'; ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI * 2); ctx.fill();
  const offsetDir = acc.sys ? 0.6 : 0;
  acc.readings.forEach((x, i) => {
    const err = x - TRUE, ang = i * 2.4 + (offsetDir ? -0.6 : 0), dist = Math.min(R - 6, Math.abs(err) * 110);
    const px = tx + (acc.sys ? Math.sign(err) * Math.min(R - 6, Math.abs(err) * 110) * 0.9 : Math.cos(ang) * dist), py = ty + (acc.sys ? Math.sin(ang) * Math.min(20, dist * 0.3) : Math.sin(ang) * dist);
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
  });
  tag(c, 'bullseye = the true value', tx, ty + R + 18, c.muted, 'center', 12, 700);
  // A number line of the readings
  const a = 18.6, b = 21.4, X = (x) => 270 + ((x - a) / (b - a)) * 270, y = 170;
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(266, y); ctx.lineTo(544, y); ctx.stroke();
  for (let t = 19; t <= 21; t += 0.5) { ctx.beginPath(); ctx.moveTo(X(t), y - 5); ctx.lineTo(X(t), y + 5); ctx.stroke(); tag(c, t.toFixed(1), X(t), y + 18, c.muted, 'center', 11, 700); }
  ctx.strokeStyle = '#2e9e4f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(TRUE), y - 70); ctx.lineTo(X(TRUE), y); ctx.stroke();
  tag(c, 'true value', X(TRUE), y - 80, '#2e9e4f', 'center', 12);
  acc.readings.forEach((x, k) => { ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(X(Math.max(a, Math.min(b, x))), y - 14 - (k % 3) * 12, 5, 0, Math.PI * 2); ctx.fill(); });
  if (PK.answersShown()) { ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(v.m), y - 56); ctx.lineTo(X(v.m), y); ctx.stroke(); ctx.setLineDash([]); tag(c, 'mean', X(v.m), y + 36, '#7c3aed', 'center', 12); }
  tag(c, 'cm', 540, y + 34, c.muted, 'center', 11, 700);
  tag(c, 'Measuring a rod that is really 20.0 cm long', 14, 16, c.text, 'left', 14);
}
function renderAccuracy() {
  const v = verdict(), pill = (ok, yes, no) => `<span class="badge ${ok ? 'good' : 'bad'}">${ok ? yes : no}</span>`;
  $('acc-info').innerHTML = `<p style="margin-top:0">${acc.readings.map((x) => `${x.toFixed(1)}`).join(', ')} cm</p>
    <dl class="readout"><dt>Mean</dt><dd>${PK.ans(`${v.m.toFixed(2)} cm`)}</dd><dt>Range</dt><dd>${PK.ans(`${v.range.toFixed(1)} cm`)}</dd></dl>
    <p>${PK.ans(`${pill(v.precise, 'Precise', 'Not precise')} ${pill(v.accurate, 'Accurate', 'Not accurate')}`)}</p>
    <p class="note" style="margin-bottom:0"><b>Precise</b>: the readings are close together. <b>Accurate</b>: the mean is close to the true value.</p>`;
}

// =====================================================================
// Panels, tabs and controls
// =====================================================================

const WHY = {
  scales: `<p><b>Resolution</b> is the smallest change an instrument can show: the size of its smallest division. A ruler marked in millimetres has a resolution of 1 mm.</p>
    <p><b>Reading a scale.</b> Look straight at the scale, with your eye level with the reading, so you don’t get a parallax error. For a liquid, read the bottom of the curved meniscus.</p>
    <p>When you read a scale, you can be uncertain by about half of the smallest division.</p>`,
  means: `<p><b>Why repeat?</b> Repeating a measurement and taking the mean reduces the effect of random errors, and lets you spot anomalous results.</p>
    <p><b>Anomalous results</b> don’t fit the pattern of the others. Leave them out of the mean, and say why. If you can, repeat that reading.</p>
    <p><b>Uncertainty.</b> The range of the repeat readings (largest − smallest) shows how far they spread. Half the range, either side of the mean, is a good estimate of the uncertainty.</p>`,
  accuracy: `<p><b>Accurate</b> results are close to the true value. <b>Precise</b> results are close to each other: a small spread.</p>
    <p><b>Random errors</b> make readings spread out, so they are less precise. Repeating and taking a mean helps.</p>
    <p><b>Systematic errors</b>, such as a zero error, push every reading the same way, so they are less accurate. Repeating doesn’t help: you have to correct the error.</p>
    <p><b>Repeatable:</b> you get similar results when you repeat it yourself. <b>Reproducible:</b> someone else, or a different method, gets similar results.</p>`,
};
const INTRO = {
  scales: 'Read the scale on each instrument, using the magnifier. Type your reading and check it.',
  means: 'Find the mean and the uncertainty of a set of repeat readings. Cross out anything anomalous and check it. Press “New random readings” for another set, or type in your own.',
  accuracy: 'Take five readings of a rod that is really 20.0 cm long, with small or large random errors, and with or without a zero error.',
};
function renderPanel() {
  if (state.tab === 'scales') renderScales();
  if (state.tab === 'means') renderMeans();
  if (state.tab === 'accuracy') renderAccuracy();
}
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = WHY[t];
  $('go').textContent = { scales: '↻ New reading', means: '↻ New random readings', accuracy: '↻ Take 5 readings' }[t];
  scene.setAttribute('aria-label', { scales: 'An instrument to read, with a magnifier', means: 'The repeat readings on a number line', accuracy: 'Readings on a target and a number line' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'scales' ? location.pathname + location.search : `#${t}`);
  size(); renderPanel();
}
PK.chips('inst', (v) => { sc.i = v; newValue(); renderPanel(); });
PK.chips('eye', (v) => { sc.eye = v; });
PK.chips('rand', (v) => { acc.rand = v; takeReadings(); renderPanel(); });
PK.chips('sys', (v) => { acc.sys = v; takeReadings(); renderPanel(); });
$('go').addEventListener('click', () => {
  if (state.tab === 'scales') newValue();
  else if (state.tab === 'means') { $('example').value = '0'; loadExample(0); $('anom-result').innerHTML = ''; }
  else takeReadings();
  renderPanel();
});
$('check').addEventListener('click', check);
$('reveal').addEventListener('click', () => { sc.shown = true; renderPanel(); });
['guess', 'guess-res'].forEach((id) => $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); }));
$('check-anom').addEventListener('click', checkAnomalies);
$('example').innerHTML = EXAMPLES.map((e, i) => `<option value="${i}">${e.name}</option>`).join('');
$('example').addEventListener('change', (e) => { loadExample(Number(e.target.value)); $('anom-result').innerHTML = ''; renderPanel(); });
buildRows();
$('rows').addEventListener('input', () => { $('anom-result').innerHTML = ''; renderPanel(); });
$('rows').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cross]'); if (!b) return;
  const i = Number(b.dataset.cross);
  if (mean.out.has(i)) mean.out.delete(i); else mean.out.add(i);
  $('anom-result').innerHTML = '';
  renderPanel();
});
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
window.addEventListener('pk-answers', renderPanel);

function size() {
  const dpr = window.devicePixelRatio || 1;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (SH / SW) * dpr);
}
window.addEventListener('resize', size);
function frame() {
  if (scene.clientWidth) {
    const c = colours();
    ctx.setTransform(scene.width / SW, 0, 0, scene.width / SW, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, SW, SH);
    ({ scales: drawScales, means: drawMeans, accuracy: drawAccuracy })[state.tab](c);
  }
  requestAnimationFrame(frame);
}

newValue(); loadExample(0); takeReadings();
showTab(['means', 'accuracy'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'scales');
requestAnimationFrame(frame);

// Share: the value on the instrument, what's crossed out, and the accuracy readings
PK.shareState = {
  get: () => ({ v: Number(sc.value.toFixed(4)), o: [...mean.out], a: acc.readings, m: EXAMPLES[0].random && mean.ex === 0 ? [EXAMPLES[0].what, EXAMPLES[0].unit] : null }),
  set: (o) => {
    if (Number.isFinite(Number(o.v))) sc.value = Number(o.v);
    if (Array.isArray(o.m) && mean.ex === 0) { EXAMPLES[0].what = String(o.m[0]).slice(0, 60); EXAMPLES[0].unit = String(o.m[1]).slice(0, 8); $('rand-what').textContent = `${EXAMPLES[0].what}, in ${EXAMPLES[0].unit}`; }
    if (Array.isArray(o.o)) mean.out = new Set(o.o.map(Number));
    if (Array.isArray(o.a) && o.a.length) acc.readings = o.a.map(Number);
    renderPanel();
  },
};
