// Electromagnetic spectrum: tappable band, wavelength slider, animated wave, region facts.
// Content follows the AQA GCSE Physics spec (4.6.2). Items marked ht are Higher tier only.

PK.header({
  title: 'EM spectrum',
  spec: [
    { code: '4.6.1.2', text: 'Properties of waves: wave speed = frequency × wavelength (v = f λ)' },
    { code: '4.6.2.1', text: 'Types of electromagnetic waves: transverse, continuous spectrum, same speed in a vacuum' },
    { code: '4.6.2.3', text: 'Changes in atoms and nuclei generate EM waves; gamma rays come from the nucleus' },
    { code: '4.6.2.3', text: 'Radio waves produced by oscillations in electrical circuits, and absorbed to create an alternating current', ht: true },
    { code: '4.6.2.3', text: 'Hazards of UV, X-rays and gamma rays (ionising radiation)' },
    { code: '4.6.2.4', text: 'Uses and applications of each region of the spectrum' },
    { code: 'KS3', text: 'Light waves travelling through a vacuum; speed of light' },
  ],
});

const C = 3e8;
const $ = (id) => document.getElementById(id);

const REGIONS = [
  {
    id: 'radio', name: 'Radio waves', short: 'Radio', colour: '#f5c26b', logMax: 4, logMin: -1,
    range: 'Longer than about 10 cm — up to kilometres',
    uses: ['Television and radio broadcasts', 'Long-wave radio can travel around the curve of the Earth'],
    dangers: 'Low risk. Radio waves are not ionising.',
    made: [{ text: 'Produced by oscillations (charges moving back and forth) in electrical circuits.', ht: true }],
    extra: [{ text: 'When absorbed by an aerial, radio waves create an alternating current with the same frequency as the wave.', ht: true }],
  },
  {
    id: 'micro', name: 'Microwaves', short: 'Micro', colour: '#f7a072', logMax: -1, logMin: -3,
    range: 'About 1 mm to 10 cm',
    uses: ['Satellite communications', 'Cooking food (microwave ovens)', 'Mobile phone signals'],
    dangers: 'Can heat water in body tissue, causing internal heating.',
    made: [{ text: 'Produced electronically, e.g. by oscillating circuits or a magnetron in a microwave oven.' }],
    extra: [{ text: 'Microwaves pass through the atmosphere, which is why they are used to talk to satellites.' }],
  },
  {
    id: 'ir', name: 'Infrared', short: 'IR', colour: '#f2777a', logMax: -3, logMin: Math.log10(7e-7),
    range: 'About 700 nm to 1 mm',
    uses: ['Electrical heaters', 'Cooking food (grills and toasters)', 'Infrared (thermal imaging) cameras', 'TV remote controls'],
    dangers: 'Too much infrared can cause skin burns.',
    made: [{ text: 'Given off by all objects. The hotter the object, the more infrared it emits.' }],
    extra: [{ text: 'We feel infrared as heat on our skin.' }],
  },
  {
    id: 'visible', name: 'Visible light', short: 'Visible', colour: 'linear-gradient(90deg, #ff4a3d, #ff9f1c, #ffe14d, #5ad35a, #3fa7ff, #6a5cff, #b06cff)',
    logMax: Math.log10(7e-7), logMin: Math.log10(4e-7),
    range: 'About 400 nm (violet) to 700 nm (red)',
    uses: ['Fibre optic communications', 'Seeing, photography and lighting'],
    dangers: 'Very bright light (the Sun, lasers) can damage the retina of the eye.',
    made: [{ text: 'Very hot objects (the Sun, filament lamps), and electrons in atoms changing energy level (LEDs, neon lights).' }],
    extra: [{ text: 'Red light has the longest wavelength and violet the shortest. White light is a mixture of all the colours.' }],
  },
  {
    id: 'uv', name: 'Ultraviolet', short: 'UV', colour: '#c4a1ff', logMax: Math.log10(4e-7), logMin: -8,
    range: 'About 10 nm to 400 nm',
    uses: ['Energy-efficient lamps', 'Sun tanning (sunbeds)', 'Security marks on banknotes', 'Sterilising water'],
    dangers: 'Causes skin to age prematurely and increases the risk of skin cancer. Can damage the eyes.',
    made: [{ text: 'The Sun and very hot objects, and electrons in atoms changing energy level (e.g. UV lamps).' }],
    extra: [{ text: 'Sun cream and sunglasses absorb UV to protect you.' }],
  },
  {
    id: 'xray', name: 'X-rays', short: 'X-ray', colour: '#8fb8ff', logMax: -8, logMin: -11,
    range: 'About 0.01 nm to 10 nm',
    uses: ['Medical imaging (seeing broken bones)', 'Medical treatments (radiotherapy)', 'Airport security scanners'],
    dangers: 'Ionising radiation: can cause mutation of genes and cancer.', ionising: true,
    made: [{ text: 'Produced when fast-moving electrons hit a metal target in an X-ray tube.' }],
    extra: [{ text: 'X-rays pass through soft tissue but are absorbed by bone, which shows up white on the image.' }],
  },
  {
    id: 'gamma', name: 'Gamma rays', short: 'Gamma', colour: '#7fe0c4', logMax: -11, logMin: -13,
    range: 'Shorter than about 0.01 nm',
    uses: ['Medical treatments: killing cancer cells (radiotherapy)', 'Sterilising medical equipment and food', 'Medical tracers'],
    dangers: 'Ionising radiation: can cause mutation of genes and cancer.', ionising: true,
    made: [{ text: 'Come from changes in the nucleus of an atom (radioactive decay).' }],
    extra: [{ text: 'Gamma rays and X-rays overlap — they are named by how they are produced, not just by wavelength.' }],
  },
];

const SIZES = [
  [3, 'a small town'], [2, 'a football pitch'], [1, 'a house'], [0, 'a person'], [-1, 'your hand'],
  [-2, 'a coin'], [-3, 'a pinhead'], [-4, 'the width of a hair'], [-5, 'a human cell'], [-6, 'a bacterium'],
  [-7, 'a virus'], [-8, 'a large molecule'], [-10, 'an atom'], [-99, 'an atomic nucleus'],
];

const state = { pos: 350, quiz: false };

// ---------- Mapping slider position (0–700) <-> wavelength ----------

function logLambdaAt(pos) {
  const i = Math.min(REGIONS.length - 1, Math.floor(pos / 100));
  const r = REGIONS[i];
  const frac = (pos - i * 100) / 100;
  return r.logMax + (r.logMin - r.logMax) * frac;
}

const regionAt = (pos) => REGIONS[Math.min(REGIONS.length - 1, Math.floor(pos / 100))];

// ---------- Formatting ----------

function withPrefix(value, unit, prefixes) {
  for (const [factor, p] of prefixes) {
    if (value >= factor * 0.9999) {
      const v = value / factor;
      return `${v >= 100 ? Math.round(v) : parseFloat(v.toPrecision(2))} ${p}${unit}`;
    }
  }
  const [factor, p] = prefixes[prefixes.length - 1];
  return `${parseFloat((value / factor).toPrecision(2))} ${p}${unit}`;
}

const LAMBDA_PREFIX = [[1e3, 'k'], [1, ''], [1e-2, 'c'], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
const FREQ_PREFIX = [[1e18, 'E'], [1e15, 'P'], [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, '']];

function standardForm(x) {
  const e = Math.floor(Math.log10(x));
  const m = x / 10 ** e;
  return `${m.toFixed(1)} × 10<sup>${e}</sup>`;
}

// ---------- Visible colour from wavelength (approximation) ----------

function visibleColour(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  const to = (v) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)), 0.8));
  return `rgb(${to(r)}, ${to(g)}, ${to(b)})`;
}

function waveColour(pos) {
  const r = regionAt(pos);
  if (r.id === 'visible') return visibleColour(10 ** logLambdaAt(pos) * 1e9);
  return r.colour;
}

// ---------- Band + ticks ----------

$('band').innerHTML = REGIONS.map((r, i) => `
  <button data-i="${i}" style="background: ${r.colour}" aria-pressed="false" aria-label="${r.name}">
    <span class="long">${r.name}</span><span class="short">${r.short}</span>
  </button>`).join('');

const TICKS = ['10 cm', '1 mm', '700 nm', '400 nm', '10 nm', '0.01 nm'];
$('ticks').innerHTML = TICKS.map((t, i) => `<span style="left: ${((i + 1) / 7) * 100}%">${t}</span>`).join('');

$('band').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const i = Number(b.dataset.i);
  if (state.quiz) revealed.add(i);
  setPos(i * 100 + 50);
});

$('slider').addEventListener('input', (e) => setPos(Number(e.target.value)));

const revealed = new Set();
$('quiz').addEventListener('change', (e) => {
  state.quiz = e.target.checked;
  revealed.clear();
  $('band').classList.toggle('quiz', state.quiz);
  render();
});

function setPos(pos) {
  state.pos = Math.max(0, Math.min(700, pos));
  $('slider').value = state.pos;
  history.replaceState(null, '', '#r=' + regionAt(state.pos).id);
  render();
}

// ---------- Info panel ----------

function itemList(items) {
  return items.map((it) => `<li>${it.text}${it.ht ? ' <span class="tag ht">Higher</span>' : ''}</li>`).join('');
}

function render() {
  const pos = state.pos;
  const r = regionAt(pos);
  const i = REGIONS.indexOf(r);
  const lambda = 10 ** logLambdaAt(pos);
  const f = C / lambda;

  document.querySelectorAll('#band button').forEach((b, j) => {
    b.setAttribute('aria-pressed', String(j === i));
    if (state.quiz) b.classList.toggle('shown', revealed.has(j));
  });

  const hideName = state.quiz && !revealed.has(i);
  $('lambda').textContent = withPrefix(lambda, 'm', LAMBDA_PREFIX);
  $('lambda-sf').innerHTML = `${standardForm(lambda)} m`;
  $('freq').textContent = withPrefix(f, 'Hz', FREQ_PREFIX);
  $('freq-sf').innerHTML = `${standardForm(f)} Hz`;
  $('wave-eq').innerHTML = `<p><b>Wave equation:</b> v = f λ, so f = v ÷ λ</p>
    <p>f = 3.0 × 10<sup>8</sup> ÷ ${standardForm(lambda)} = <b>${standardForm(f)} Hz</b></p>`;
  const lg = Math.log10(lambda);
  $('size').textContent = SIZES.find(([t]) => lg >= t - 0.5)[1];

  $('info').innerHTML = `
    <h3>${hideName ? 'Which region is this?' : r.name}</h3>
    <div class="sub">${r.range}</div>
    ${r.ionising ? '<div style="margin-top:8px"><span class="badge bad">Ionising</span></div>' : ''}
    <h4>Uses</h4><ul>${r.uses.map((u) => `<li>${u}</li>`).join('')}</ul>
    <h4>Dangers</h4><p>${r.dangers}</p>
    <h4>How it is made</h4><ul>${itemList(r.made)}</ul>
    <h4>Did you know?</h4><ul>${itemList(r.extra)}</ul>`;
}

// ---------- Animated wave ----------

const canvas = $('wave');
const ctx = canvas.getContext('2d');
let phase = 0, lastT = performance.now();

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
}

function drawWave(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Drawn wavelength shrinks from ~420 px (radio) to ~5 px (gamma) so the trend is visible.
  const pxLambda = 420 * Math.pow(5 / 420, state.pos / 700) * dpr;
  phase = (phase + dt * 0.9) % 1;
  const amp = h * 0.32, mid = h / 2;

  ctx.strokeStyle = PK.cssVar('--border');
  ctx.lineWidth = dpr;
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();

  const r = regionAt(state.pos);
  ctx.strokeStyle = r.id === 'visible' ? waveColour(state.pos) : r.colour;
  ctx.lineWidth = (pxLambda < 12 ? 1.5 : 3) * dpr * (parseFloat(PK.cssVar('--stroke')) || 1);
  ctx.beginPath();
  const stepPx = Math.max(0.5, Math.min(4, pxLambda / 16));
  for (let x = 0; x <= w; x += stepPx) {
    const y = mid - amp * Math.sin(2 * Math.PI * (x / pxLambda - phase));
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Mark one wavelength when it is big enough to see.
  if (pxLambda > 40 * dpr) {
    const x0 = ((0.25 + phase) % 1) * pxLambda; // a crest
    const y0 = mid - amp - 12 * dpr;
    ctx.strokeStyle = PK.cssVar('--text');
    ctx.fillStyle = PK.cssVar('--text');
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + pxLambda, y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y0 - 6 * dpr); ctx.lineTo(x0, y0 + 6 * dpr); ctx.moveTo(x0 + pxLambda, y0 - 6 * dpr); ctx.lineTo(x0 + pxLambda, y0 + 6 * dpr); ctx.stroke();
    ctx.font = `700 ${14 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('λ', x0 + pxLambda / 2, y0 - 6 * dpr);
  }

  requestAnimationFrame(drawWave);
}

window.addEventListener('resize', sizeCanvas);
window.addEventListener('pk-theme', render);

const fromHash = new URLSearchParams(location.hash.slice(1)).get('r');
const startIdx = Math.max(0, REGIONS.findIndex((r) => r.id === fromHash));
sizeCanvas();
setPos(fromHash ? startIdx * 100 + 50 : 350);
requestAnimationFrame(drawWave);
