// Alpha, beta and gamma: penetration through air, paper, aluminium and lead, measured with a
// Geiger–Müller tube. Counts are random (Poisson) at a rate set by the source, the distance
// (inverse square) and what fraction gets through the absorber, plus background radiation.

PK.header({
  title: 'Alpha, beta & gamma',
  spec: [
    { code: '4.4.2.1', text: 'Radioactive decay and nuclear radiation: alpha, beta and gamma; their penetration through materials, range in air and ionising power; activity and count-rate' },
    { code: '4.4.2.2', text: 'Nuclear equations for alpha and beta decay; gamma emission causes no change in mass or charge' },
    { code: '4.4.3.1', text: 'Background radiation from natural and man-made sources', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('rad'), ctx = canvas.getContext('2d');
const W = 800, H = 380, SRC_X = 90, PX_CM = 28, CY = 190;

// Fraction that gets through each absorber
const PASS = {
  alpha: { none: 1, paper: 0, aluminium: 0, lead: 0 },
  beta: { none: 1, paper: 0.95, aluminium: 0.02, lead: 0 },
  gamma: { none: 1, paper: 1, aluminium: 0.95, lead: 0.45 },
};
const ALPHA_RANGE = 5;                 // cm in air
const SOURCE_RATE = 40;                // counts per second detected at 2 cm with nothing in the way
const BACKGROUND = 20 / 60;            // counts per second

const state = { source: 'alpha', absorber: 'none', d: 3, sound: false };
let particles = [];
let clicks = [];                       // times of recent counts
let t = 0;

function detectedRate() {
  if (state.source === 'none') return 0;
  if (state.source === 'alpha' && state.d > ALPHA_RANGE) return 0;
  return SOURCE_RATE * (2 / state.d) ** 2 * PASS[state.source][state.absorber];
}

// ---------- Sound ----------

let audio = null;
function click() {
  if (!state.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'square'; o.frequency.value = 1800;
    g.gain.setValueAtTime(0.15, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.02);
    o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.025);
  } catch { /* audio not available */ }
}

// ---------- Simulation ----------

const detX = () => SRC_X + 30 + state.d * PX_CM;
const absX = () => SRC_X + 30 + (state.d * PX_CM) / 2;

function step(dt) {
  t += dt;
  // Random counts: background plus source
  const rate = detectedRate() + BACKGROUND;
  let n = 0;
  const p = rate * dt;
  if (Math.random() < p - Math.floor(p)) n++;
  n += Math.floor(p);
  for (let i = 0; i < n; i++) { clicks.push(t); click(); }
  while (clicks.length && clicks[0] < t - 30) clicks.shift();

  // Visible particles (for the picture; the count above is the measurement)
  if (state.source !== 'none' && Math.random() < dt * 30) {
    const a = (Math.random() - 0.5) * 0.5;
    const speed = state.source === 'alpha' ? 160 : state.source === 'beta' ? 320 : 520;
    particles.push({ type: state.source, x: SRC_X + 30, y: CY, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, passed: Math.random() < PASS[state.source][state.absorber] });
  }
  for (const q of particles) {
    q.x += q.vx * dt; q.y += q.vy * dt;
    const travelled = (q.x - SRC_X - 30) / PX_CM;
    if (q.type === 'alpha' && travelled > ALPHA_RANGE) q.life -= dt * 6;           // stopped by air
    if (state.absorber !== 'none' && !q.passed && q.x > absX() - 8) { q.x = absX() - 8; q.life -= dt * 8; }
    if (q.x > W + 20 || q.y < -20 || q.y > H + 20) q.life = 0;
  }
  particles = particles.filter((q) => q.life > 0);
}

// ---------- Drawing ----------

const ABS_STYLE = {
  paper: { w: 4, fill: '#f4f1e8', name: 'paper' },
  aluminium: { w: 12, fill: '#c3c9d2', name: 'aluminium' },
  lead: { w: 34, fill: '#5d6470', name: 'lead' },
};

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);

  // Ruler along the bottom
  ctx.strokeStyle = c.muted; ctx.fillStyle = c.muted; ctx.lineWidth = 1; ctx.font = `600 11px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let cm = 0; cm <= 22; cm++) {
    const x = SRC_X + 30 + cm * PX_CM;
    if (x > W - 10) break;
    ctx.beginPath(); ctx.moveTo(x, H - 40); ctx.lineTo(x, H - 40 + (cm % 5 === 0 ? 12 : 6)); ctx.stroke();
    if (cm % 5 === 0) ctx.fillText(`${cm} cm`, x, H - 24);
  }

  // Source in a lead holder
  ctx.fillStyle = '#4b525d'; ctx.fillRect(SRC_X - 50, CY - 40, 80, 80);
  ctx.fillStyle = state.source === 'none' ? '#888' : '#ffd23f'; ctx.fillRect(SRC_X + 20, CY - 10, 10, 20);
  ctx.fillStyle = '#fff'; ctx.font = `700 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(state.source === 'none' ? 'no source' : `${state.source} source`, SRC_X - 10, CY + 54 > 0 ? CY : CY);
  if (state.source !== 'none') { ctx.fillStyle = '#ffd23f'; ctx.font = `800 18px ${c.font}`; ctx.fillText('☢', SRC_X - 10, CY - 22); }

  // Absorber
  const ab = ABS_STYLE[state.absorber];
  if (ab) {
    ctx.fillStyle = ab.fill; ctx.strokeStyle = c.text; ctx.lineWidth = 1.5;
    ctx.fillRect(absX() - ab.w / 2, CY - 110, ab.w, 220); ctx.strokeRect(absX() - ab.w / 2, CY - 110, ab.w, 220);
    ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textBaseline = 'bottom';
    ctx.fillText(ab.name, absX(), CY - 116);
  }

  // Particles
  for (const q of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, q.life));
    if (q.type === 'alpha') { ctx.fillStyle = '#e2483d'; ctx.beginPath(); ctx.arc(q.x, q.y, 6, 0, Math.PI * 2); ctx.fill(); }
    else if (q.type === 'beta') { ctx.fillStyle = '#2f7fe0'; ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, Math.PI * 2); ctx.fill(); }
    else {
      ctx.strokeStyle = '#d9a400'; ctx.lineWidth = 2; ctx.beginPath();
      const ang = Math.atan2(q.vy, q.vx), ux = Math.cos(ang), uy = Math.sin(ang);
      for (let s = -18; s <= 0; s += 2) { const w = Math.sin((s + q.x) / 3) * 4; const x = q.x + ux * s - uy * w, y = q.y + uy * s + ux * w; s === -18 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Geiger–Müller tube and counter
  const dx = detX();
  ctx.fillStyle = '#9aa3ae'; ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.fillRect(dx, CY - 16, 90, 32); ctx.strokeRect(dx, CY - 16, 90, 32);
  ctx.fillStyle = '#333'; ctx.fillRect(dx - 4, CY - 18, 6, 36);
  const recent = clicks.length && t - clicks[clicks.length - 1] < 0.08;
  ctx.fillStyle = recent ? '#ff3b30' : '#555';
  ctx.beginPath(); ctx.arc(dx + 75, CY - 30, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c.text; ctx.font = `700 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('G–M tube', dx + 45, CY + 22);
}

// ---------- Panel ----------

function iso(A, Z, sym) {
  return `<span class="iso"><span class="nums"><span>${A}</span><span>${Z}</span></span>${sym}</span>`;
}

function renderPanel() {
  const cpm = Math.round((clicks.length / Math.min(30, Math.max(1, t))) * 60);
  $('rate').textContent = cpm;
  $('dist-val').textContent = `${state.d} cm`;
  const eq = {
    alpha: `<div class="eqn">${iso(241, 95, 'Am')} → ${iso(237, 93, 'Np')} + ${iso(4, 2, 'He')}</div><p class="note">Alpha decay: the nucleus loses 2 protons and 2 neutrons, so the mass number goes down by 4 and the atomic number by 2.</p>`,
    beta: `<div class="eqn">${iso(90, 38, 'Sr')} → ${iso(90, 39, 'Y')} + ${iso(0, '−1', 'e')}</div><p class="note">Beta decay: a neutron turns into a proton and an electron. The mass number stays the same and the atomic number goes up by 1.</p>`,
    gamma: `<div class="eqn">${iso(60, 27, 'Co')} → ${iso(60, 27, 'Co')} + γ</div><p class="note">Gamma emission: the nucleus gets rid of extra energy as an electromagnetic wave. There is no change to the mass or the charge.</p>`,
    none: '<p class="note" style="margin:0">Choose a source. With no source you only measure background radiation.</p>',
  };
  $('equation').innerHTML = eq[state.source];
}

function pick(groupId, attr, key) {
  document.querySelectorAll(`#${groupId} .chip`).forEach((b) => b.addEventListener('click', () => {
    state[key] = b.dataset[attr];
    document.querySelectorAll(`#${groupId} .chip`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    clicks = []; t = 0; particles = [];
    renderPanel();
  }));
}
pick('source', 's', 'source');
pick('absorber', 'a', 'absorber');
$('dist').addEventListener('input', (e) => { state.d = Number(e.target.value); clicks = []; t = 0; particles = []; renderPanel(); });
$('sound').addEventListener('change', (e) => { state.sound = e.target.checked; });

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  draw();
  if ((tick += dt) > 0.5) { tick = 0; renderPanel(); }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeCanvas);
sizeCanvas();
renderPanel();
requestAnimationFrame(frame);
