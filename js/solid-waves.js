// Waves in a solid (required practical).
// Vibrating string: a signal generator drives a vibration generator at one end of a string, which
// runs over a pulley to a hanging mass. At certain frequencies the string forms still loops (a
// standing wave): each loop is half a wavelength, so λ = 2L ÷ loops, and v = f λ. The wave speed is
// √(T ÷ μ), set by the tension (the hanging weight) and the string's mass per metre, so it's the
// same whatever the frequency.
// Metal rod: tap one end and a phone app measures the frequency of the note. Held at its middle,
// the rod is half a wavelength long (λ = 2L), so v = f λ is the speed of sound in the metal.

PK.header({
  title: 'Waves in a solid',
  answers: true,
  spec: [
    { code: '4.6.1.2', text: 'Properties of waves: frequency, wavelength and wave speed; v = f λ' },
    { code: '4.6.1.2', text: 'Required practical: make observations to identify the suitability of apparatus to measure the frequency, wavelength and speed of waves in a solid, and take appropriate measurements' },
    { code: '4.6.1.1', text: 'Transverse and longitudinal waves: waves on a string are transverse; sound waves travelling through a solid are longitudinal' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 360, g = 9.8;
const TOP = 60;   // the drawings are laid out 60 px lower than they're shown: everything is moved up by this
const state = { tab: 'string', t: 0 };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const sig = (x, n = 3) => String(parseFloat(x.toPrecision(n)));
const results = { string: [], rod: [] };

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800, halo = c.surface) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
function dimension(c, x1, x2, y, text) {
  ctx.strokeStyle = c.muted; ctx.fillStyle = c.muted; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.moveTo(x1, y - 6); ctx.lineTo(x1, y + 6); ctx.moveTo(x2, y - 6); ctx.lineTo(x2, y + 6); ctx.stroke();
  for (const [x, d] of [[x1, 1], [x2, -1]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d * 9, y - 4); ctx.lineTo(x + d * 9, y + 4); ctx.closePath(); ctx.fill(); }
  ctx.lineWidth = 1;
  tag(c, text, (x1 + x2) / 2, y - 12, c.text, 'center', 14, 800);
}
// A ruler: zero at x0, cm marks, numbers every 10 cm
function ruler(c, x0, y, cm, pxPerCm) {
  ctx.fillStyle = '#fff3c4'; ctx.strokeStyle = '#b08d2a'; ctx.lineWidth = 1;
  ctx.fillRect(x0 - 4, y, cm * pxPerCm + 8, 18); ctx.strokeRect(x0 - 4, y, cm * pxPerCm + 8, 18);
  ctx.strokeStyle = '#5d4a12';
  ctx.beginPath();
  for (let i = 0; i <= cm; i++) { const x = x0 + i * pxPerCm, h = i % 10 === 0 ? 9 : i % 5 === 0 ? 6 : 3; ctx.moveTo(x, y); ctx.lineTo(x, y + h); }
  ctx.stroke();
  ctx.fillStyle = '#3e2f05'; ctx.font = `700 10px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  for (let i = 0; i <= cm; i += 10) ctx.fillText(String(i), x0 + i * pxPerCm, y + 18);
}

// ---------- The vibrating string ----------

const MU = 0.0012;                                   // the string's mass per metre (kg/m)
const PULLEY_X = 712, STRING_Y = 200, PXM = 380;     // the top of the pulley, the string's height, pixels per metre
const AMP = 34;                                      // the biggest the loops get (px)
const spindleX = () => PULLEY_X - PK.num('len') * PXM;
const waveSpeed = () => Math.sqrt(((PK.num('mass') / 1000) * g) / MU);
// The string is driven hard by any pattern (n loops) whose own frequency is close to the generator's
function modes() {
  const f = PK.num('freq'), v = waveSpeed(), L = PK.num('len'), out = [];
  for (let n = 1; n <= 16; n++) { const f0 = (n * v) / (2 * L), w = 0.035 * f0; out.push({ n, a: 1 / (1 + ((f - f0) / w) ** 2) }); }
  return out;
}
// A clear pattern: one set of loops shaking much more than anything else
function loops() { const best = modes().reduce((a, b) => (b.a > a.a ? b : a)); return best.a > 0.5 ? best.n : 0; }
function shapeAt(s, ms) {
  let y = 0;
  for (const m of ms) y += m.a * Math.sin(m.n * Math.PI * s);
  return AMP * Math.max(-1.15, Math.min(1.15, y));
}

function drawString(c) {
  const sx = spindleX(), f = PK.num('freq'), m = PK.num('mass'), ms = modes(), slow = pressed('view') === 'slow';
  // The bench, with a ruler along its front edge (zero at the far left)
  ctx.fillStyle = '#c8a27a'; ctx.fillRect(0, 300, 706, 20);
  ctx.fillStyle = '#a07a52'; ctx.fillRect(0, 318, 706, 4);
  // The pulley, clamped to the end of the bench
  ctx.fillStyle = '#607d8b'; ctx.fillRect(700, 290, 14, 34);
  ruler(c, 142, 301, 150, PXM / 100);
  ctx.strokeStyle = '#607d8b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(712, 212); ctx.lineTo(704, 292); ctx.stroke();
  ctx.fillStyle = '#b0bec5'; ctx.strokeStyle = '#455a64'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(712, 212, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#455a64'; ctx.beginPath(); ctx.arc(712, 212, 3, 0, Math.PI * 2); ctx.fill();
  // String over the pulley and down to the masses
  ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(712, 212, 12, -Math.PI / 2, 0); ctx.lineTo(724, 338); ctx.stroke();
  const discs = Math.round(m / 50) - 1;   // a 50 g hanger plus 50 g slotted masses
  ctx.fillStyle = '#78909c'; ctx.fillRect(722, 338, 4, 8 + discs * 7);
  ctx.fillStyle = '#546e7a'; ctx.fillRect(708, 346 + discs * 7, 32, 6);
  for (let i = 0; i < discs; i++) { ctx.fillStyle = i % 2 ? '#8d99a6' : '#a7b2bd'; ctx.fillRect(710, 346 + i * 7, 28, 7); }
  tag(c, `${m} g`, 762, 360, c.text, 'center', 13, 800);
  // The vibrating string
  const N = 160, len = PULLEY_X - sx, t = state.t;
  if (slow) {
    const k = Math.sin(2 * Math.PI * 0.7 * t);
    ctx.strokeStyle = c.text; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= N; i++) { const s = i / N, y = STRING_Y + shapeAt(s, ms) * k; if (i) ctx.lineTo(sx + s * len, y); else ctx.moveTo(sx + s * len, y); }
    ctx.stroke();
  } else {
    // Too fast to see: the string looks like a blur between its highest and lowest points
    const top = [], bot = [];
    for (let i = 0; i <= N; i++) { const s = i / N, e = Math.abs(shapeAt(s, ms)); top.push([sx + s * len, STRING_Y - e]); bot.push([sx + s * len, STRING_Y + e]); }
    ctx.fillStyle = PK.isDark() ? 'rgba(236, 239, 241, .22)' : 'rgba(38, 50, 56, .16)';
    ctx.beginPath(); top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c.text; ctx.globalAlpha = 0.75; ctx.lineWidth = 2;
    for (const edge of [top, bot]) { ctx.beginPath(); edge.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
  // The vibration generator, and its spindle shaking the end of the string
  const buzz = 1.5 * Math.sin(2 * Math.PI * f * t);
  ctx.fillStyle = '#90a4ae'; ctx.fillRect(sx - 3, STRING_Y + buzz, 6, 236 - STRING_Y - buzz);
  ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.roundRect(sx - 36, 236, 72, 64, 6); ctx.fill();
  tag(c, 'vibration', sx, 258, '#fff', 'center', 11, 700, null); tag(c, 'generator', sx, 272, '#fff', 'center', 11, 700, null);
  tag(c, '⇔ drag', sx, 289, '#b0bec5', 'center', 10, 700, null);
  // The signal generator, and the wires to the vibration generator
  ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(100, 262); ctx.bezierCurveTo(130, 262, sx - 70, 262, sx - 36, 268); ctx.stroke();
  ctx.strokeStyle = PK.isDark() ? '#9e9e9e' : '#212121'; ctx.beginPath(); ctx.moveTo(100, 280); ctx.bezierCurveTo(130, 282, sx - 70, 286, sx - 36, 284); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = c.surface2; ctx.strokeStyle = c.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(10, 206, 92, 94, 6); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#10161c'; ctx.fillRect(18, 216, 76, 30);
  tag(c, `${f.toFixed(1)} Hz`, 56, 231, '#8fd9a8', 'center', 16, 800, null);
  ctx.fillStyle = c.muted; ctx.beginPath(); ctx.arc(40, 272, 10, 0, Math.PI * 2); ctx.fill();
  tag(c, 'signal', 74, 266, c.text, 'center', 10, 700, null); tag(c, 'generator', 74, 279, c.text, 'center', 10, 700, null);
  // The length of string that vibrates
  dimension(c, sx, PULLEY_X, 140, `L = ${PK.num('len').toFixed(2)} m`);
}

// ---------- The metal rod ----------

// Speed of sound along a thin rod (√(E ÷ ρ)), rounded
const METALS = {
  steel: { name: 'steel', v: 5000, col: ['#cfd8dc', '#78909c'] },
  aluminium: { name: 'aluminium', v: 5100, col: ['#eceff1', '#9eabb3'] },
  brass: { name: 'brass', v: 3400, col: ['#f3d27a', '#a8842a'] },
  copper: { name: 'copper', v: 3600, col: ['#f0a77a', '#a4532c'] },
};
const metal = () => METALS[$('metal').value];
const ROD_C = 355, ROD_Y = 180, RPXM = 360;
const rod = { ring: -1, hammer: -1, reading: null };   // ring: time since it was tapped (−1: not ringing)
const rodF = () => metal().v / (2 * PK.num('rlen'));
function tapRod() {
  rod.hammer = 0; rod.ring = 0;
  rod.reading = Math.round(rodF() * (1 + (Math.random() - 0.5) * 0.006));   // a phone app's reading wobbles a little
  render();
}

function drawRod(c) {
  const L = PK.num('rlen'), half = (L * RPXM) / 2, x0 = ROD_C - half, x1 = ROD_C + half, M = metal();
  // Bench and clamp stand: the rod is held at its middle
  ctx.fillStyle = '#c8a27a'; ctx.fillRect(0, 330, W, 20); ctx.fillStyle = '#a07a52'; ctx.fillRect(0, 348, W, 4);
  ctx.fillStyle = '#546e7a'; ctx.fillRect(ROD_C - 34, 322, 68, 8); ctx.fillRect(ROD_C - 3, ROD_Y, 7, 322 - ROD_Y);
  // The rod, with lines showing its particles. They're shown slowed right down.
  const grad = ctx.createLinearGradient(0, ROD_Y - 10, 0, ROD_Y + 10);
  grad.addColorStop(0, M.col[0]); grad.addColorStop(1, M.col[1]);
  ctx.fillStyle = grad; ctx.fillRect(x0, ROD_Y - 10, x1 - x0, 20);
  const amp = rod.ring >= 0 ? 7 * Math.exp(-rod.ring / 1.4) : 0, k = Math.sin(2 * Math.PI * 0.9 * state.t);
  ctx.strokeStyle = 'rgba(0, 0, 0, .45)'; ctx.lineWidth = 1.5; ctx.beginPath();
  const n = Math.round((x1 - x0) / 9);
  for (let i = 0; i <= n; i++) {
    const s = i / n, x = x0 + s * (x1 - x0) + amp * k * Math.cos(Math.PI * s);
    ctx.moveTo(x, ROD_Y - 9); ctx.lineTo(x, ROD_Y + 9);
  }
  ctx.stroke(); ctx.lineWidth = 1;
  // The clamp, holding the middle
  ctx.fillStyle = '#37474f'; ctx.fillRect(ROD_C - 9, ROD_Y - 14, 18, 28);
  tag(c, 'held at its middle', ROD_C + 14, ROD_Y + 30, c.muted, 'left', 12, 700);
  // The hammer: it swings in when the rod is tapped
  // It swings up from below, so it stays clear of the ruler
  const px = x0 - 80, py = ROD_Y + 60, hitX = x0 - 9, aHit = Math.atan2(ROD_Y - py, hitX - px), reach = Math.hypot(hitX - px, ROD_Y - py);
  const swing = rod.hammer >= 0 && rod.hammer < 0.35 ? Math.sin((rod.hammer / 0.35) * Math.PI) : 0;
  ctx.save(); ctx.translate(px, py); ctx.rotate(aHit + 0.9 * (1 - swing));
  ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(reach - 8, 0); ctx.stroke();
  ctx.fillStyle = '#455a64'; ctx.fillRect(reach - 10, -11, 14, 22);
  ctx.restore(); ctx.lineWidth = 1;
  if (rod.ring < 0) tag(c, 'tap me', x0 + 10, ROD_Y + 102, c.muted, 'center', 12, 700);
  // A ruler held along the rod, zero at its left end
  ruler(c, x0, ROD_Y - 44, Math.min(150, Math.ceil(L * 100) + 5), RPXM / 100);
  dimension(c, x0, x1, ROD_Y - 66, `L = ${L.toFixed(2)} m`);
  // The phone, listening
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(648, 110, 132, 214, 16); ctx.fill();
  ctx.fillStyle = '#0d1b24'; ctx.fillRect(656, 128, 116, 178);
  tag(c, 'Frequency app', 714, 142, '#90caf9', 'center', 11, 700, null);
  const ringing = rod.ring >= 0 && rod.ring < 4;
  // A spectrum: one sharp peak at the rod's note while it rings
  ctx.strokeStyle = '#546e7a'; ctx.beginPath(); ctx.moveTo(662, 262); ctx.lineTo(766, 262); ctx.stroke();
  ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 104; i++) {
    const fx = (i / 104) * 8000, peak = ringing && rod.reading ? Math.exp(-(((fx - rod.reading) / 120) ** 2)) * 70 * Math.exp(-rod.ring / 1.4) : 0;
    const y = 262 - peak - 2 * Math.random();
    if (i) ctx.lineTo(662 + i, y); else ctx.moveTo(662 + i, y);
  }
  ctx.stroke(); ctx.lineWidth = 1;
  tag(c, '0', 662, 272, '#78909c', 'left', 9, 700, null); tag(c, '8000 Hz', 766, 272, '#78909c', 'right', 9, 700, null);
  if (rod.reading) {
    tag(c, `${rod.reading} Hz`, 714, 292, ringing ? '#fff' : '#90a4ae', 'center', 20, 800, null);
    if (!ringing) tag(c, 'last note', 714, 160, '#78909c', 'center', 10, 700, null);
  } else tag(c, 'Listening…', 714, 292, '#90a4ae', 'center', 14, 700, null);
  tag(c, 'phone', 714, 336, c.muted, 'center', 12, 700);
}

// ---------- Words ----------

const INTRO = {
  string: 'A vibration generator shakes one end of a stretched string. At certain frequencies the string forms still loops: a standing wave. Count the loops and measure the string to find the wavelength, then work out the wave speed.',
  rod: 'Tap a metal rod and it rings with a high note. Measure the frequency with a phone app, and the length of the rod, then work out the speed of sound in the metal.',
};
const METHOD = {
  string: `<ol>
      <li>Set up the string between the vibration generator and the pulley, with a mass hanging on the end. Connect the vibration generator to the signal generator.</li>
      <li>Change the frequency slowly until you see clear loops that keep still.</li>
      <li>Count the loops and measure the length of string that vibrates, L. Each loop is half a wavelength, so <b>λ = 2L ÷ number of loops</b>. Measuring across all the loops is more accurate than measuring one.</li>
      <li>Read the frequency, f, from the signal generator. Work out the wave speed: <b>v = f λ</b>.</li>
      <li>Find other frequencies that give clear loops, and repeat. The wave speed should stay the same.</li>
    </ol>`,
  rod: `<ol>
      <li>Hold the rod at its middle with a clamp. Measure its length, L, with a metre rule.</li>
      <li>Tap one end of the rod with a hammer. Use a frequency app on a phone to measure the frequency, f, of the note.</li>
      <li>The rod’s length is half a wavelength: <b>λ = 2L</b>.</li>
      <li>Work out the speed of sound in the metal: <b>v = f λ</b>.</li>
      <li>Repeat with rods of different lengths, or different metals.</li>
    </ol>`,
};

function render() {
  if (state.tab === 'string') {
    const n = loops(), f = PK.num('freq'), L = PK.num('len');
    let html = `<dl class="readout"><dt>Frequency, f</dt><dd>${f.toFixed(1)} Hz</dd><dt>Loops on the string</dt><dd>${n || 'no clear loops'}</dd><dt>Length vibrating, L</dt><dd>${L.toFixed(2)} m</dd></dl>`;
    if (n) {
      const lam = (2 * L) / n;
      html += `<p>A standing wave with <b>${n} loop${n > 1 ? 's' : ''}</b>. Each loop is half a wavelength, so the wavelength is λ = 2L ÷ ${n} = 2 × ${L.toFixed(2)} ÷ ${n} = <b>${PK.ans(`${sig(lam)} m`)}</b>.</p>`;
      html += `<p>Wave speed: v = f λ = ${f.toFixed(1)} × ${sig(lam)} = <b>${PK.ans(`${sig(f * lam)} m/s`)}</b>. Press <b>Record reading</b>, then find another frequency that gives clear loops.</p>`;
    } else html += '<p>The string is only shaking a little. Change the frequency slowly, 1 Hz at a time, until you see clear loops that keep still.</p>';
    if (pressed('view') === 'blur') html += `<p class="note">The string really vibrates ${f.toFixed(0)} times a second, too fast to see, so it looks blurred. Try slow motion.</p>`;
    html += '<p class="note beyond">The wave speed depends on the string, not the frequency: v = √(T ÷ μ), where T is the tension (the weight hanging on the end) and μ is the mass of each metre of string. A heavier mass makes the waves faster.</p>';
    $('info').innerHTML = html;
  } else {
    const L = PK.num('rlen'), M = metal(), f = rod.reading;
    let html = `<dl class="readout"><dt>Metal</dt><dd>${M.name}</dd><dt>Length of the rod, L</dt><dd>${L.toFixed(2)} m</dd><dt>Frequency (from the app), f</dt><dd>${f ? `${f} Hz` : '–'}</dd></dl>`;
    if (f) {
      const lam = 2 * L, v = f * lam;
      html += `<p>Held at its middle, the rod’s ends vibrate most and its middle stays still, so the rod is half a wavelength long: λ = 2L = 2 × ${L.toFixed(2)} = <b>${PK.ans(`${sig(lam)} m`)}</b>.</p>`;
      html += `<p>Speed of sound in ${M.name}: v = f λ = ${f} × ${sig(lam)} = <b>${PK.ans(`${Math.round(v)} m/s`)}</b>. That’s about ${PK.ans(String(Math.round(v / 330)))} times faster than sound in air (330 m/s).</p>`;
    } else html += '<p>Press <b>Tap the end of the rod</b>, or tap the hammer, and the phone app will measure the frequency of the note.</p>';
    html += `<p class="note">The waves in the rod are longitudinal: the particles vibrate along the rod. They’re shown slowed right down; this rod really vibrates about ${Math.round(rodF() / 100) * 100} times a second.</p>`;
    $('info').innerHTML = html;
  }
  renderResults();
}
function renderResults() {
  $('method').innerHTML = METHOD[state.tab];
  const rows = results[state.tab], del = (i) => `<td><button class="del" data-i="${i}" aria-label="Delete">✕</button></td>`;
  if (!rows.length) { $('table').innerHTML = `<p class="note">No readings yet. ${state.tab === 'string' ? 'Find clear loops, then press <b>Record reading</b>.' : 'Tap the rod, then press <b>Record reading</b>.'}</p>`; return; }
  $('table').innerHTML = state.tab === 'string'
    ? `<table class="results"><thead><tr><th>m (g)</th><th>f (Hz)</th><th>Loops</th><th>L (m)</th><th>λ (m)</th><th>v (m/s)</th><th></th></tr></thead><tbody>${rows.map((r, i) => {
      const lam = (2 * r.L) / r.n;
      return `<tr><td>${r.m}</td><td>${r.f.toFixed(1)}</td><td>${r.n}</td><td>${r.L.toFixed(2)}</td><td>${PK.ans(sig(lam))}</td><td>${PK.ans(sig(r.f * lam))}</td>${del(i)}</tr>`;
    }).join('')}</tbody></table>`
    : `<table class="results"><thead><tr><th>Metal</th><th>L (m)</th><th>f (Hz)</th><th>λ (m)</th><th>v (m/s)</th><th></th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${METALS[r.metal].name}</td><td>${r.L.toFixed(2)}</td><td>${r.f}</td><td>${PK.ans(sig(2 * r.L))}</td><td>${PK.ans(String(Math.round(r.f * 2 * r.L)))}</td>${del(i)}</tr>`).join('')}</tbody></table>`;
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  cv.setAttribute('aria-label', t === 'string' ? 'A string stretched between a vibration generator and a pulley, with a hanging mass' : 'A metal rod held at its middle, a hammer and a phone with a frequency app');
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'string' ? location.pathname + location.search : `#${t}`);
  render();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#view .chip').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#view .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  render();
}));
for (const id of ['freq', 'mass', 'len']) $(id).addEventListener('input', render);
for (const id of ['rlen', 'metal']) $(id).addEventListener(id === 'metal' ? 'change' : 'input', () => { rod.reading = null; rod.ring = -1; render(); });
$('tap').addEventListener('click', tapRod);
$('record').addEventListener('click', () => {
  if (state.tab === 'string') {
    const n = loops();
    if (!n) { PK.toast('No clear loops yet: change the frequency until the loops keep still.'); return; }
    results.string.push({ m: PK.num('mass'), f: PK.num('freq'), n, L: PK.num('len') });
  } else {
    if (!rod.reading) { PK.toast('Tap the rod first, so the app can measure the frequency.'); return; }
    results.rod.push({ metal: $('metal').value, L: PK.num('rlen'), f: rod.reading });
  }
  renderResults();
});
$('clear-results').addEventListener('click', () => { results[state.tab].length = 0; renderResults(); });
$('table').addEventListener('click', (e) => { const b = e.target.closest('.del'); if (b) { results[state.tab].splice(Number(b.dataset.i), 1); renderResults(); } });
window.addEventListener('pk-answers', render);

// Drag the vibration generator along the bench (snapping to 5 cm), or tap the hammer
PK.dragOn(cv, W, H, {
  hit: (p) => {
    const y = p.y + TOP;
    if (state.tab === 'string') return Math.abs(p.x - spindleX()) < 40 && y > 228 && y < 304 ? 'gen' : null;
    const x0 = ROD_C - (PK.num('rlen') * RPXM) / 2;
    return p.x > x0 - 90 && p.x < x0 + 40 && y > ROD_Y + 10 && y < ROD_Y + 110 ? 'hammer' : null;
  },
  move: (k, p) => {
    if (k !== 'gen') return;
    PK.setNum('len', Math.round(((PULLEY_X - p.x) / PXM) * 20) / 20);
    render();
  },
  tap: (k) => { if (k === 'hammer') tapRod(); },
});

// Results go in a shared link
PK.shareState = {
  get: () => ({ s: results.string.map((r) => [r.m, r.f, r.n, r.L]), r: results.rod.map((r) => [r.metal, r.L, r.f]) }),
  set: (o) => {
    if (Array.isArray(o.s)) results.string = o.s.filter((r) => Array.isArray(r) && r.length === 4 && r.every(Number.isFinite)).map(([m, f, n, L]) => ({ m, f, n, L }));
    if (Array.isArray(o.r)) results.rod = o.r.filter((r) => Array.isArray(r) && METALS[r[0]] && Number.isFinite(r[1]) && Number.isFinite(r[2])).map(([metal, L, f]) => ({ metal, L, f }));
    renderResults();
  },
};

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  state.t += dt;
  if (rod.hammer >= 0) { rod.hammer += dt; if (rod.hammer > 0.6) rod.hammer = -1; }
  if (rod.ring >= 0) rod.ring += dt;
  if (cv.clientWidth) {
    const c = colours();
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(k, 0, 0, k, 0, -TOP * k);
    if (state.tab === 'string') drawString(c); else drawRod(c);
  }
  requestAnimationFrame(frame);
}

showTab(PK.initialHash === '#rod' ? 'rod' : 'string');
requestAnimationFrame(frame);
