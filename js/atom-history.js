// History of the atom: the models from Dalton to Chadwick, and a simulation of the
// alpha-scattering experiment. Alpha particles are repelled by nuclei with a 1/r² force
// (nuclear model) or barely affected by spread-out charge (plum pudding model).

PK.header({
  title: 'History of the atom',
  spec: [
    { code: '4.4.1.3', text: 'The development of the model of the atom: plum pudding, the alpha-particle scattering experiment, the nuclear model, Bohr’s energy levels and Chadwick’s neutron' },
    { code: 'KS3', text: 'A simple (Dalton) atomic model' },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('model'), ctx = canvas.getContext('2d');
const W = 800, H = 500, CX = 400, CY = 250;

const STEPS = [
  { id: 'dalton', year: 'about 1803', who: 'John Dalton', name: 'Solid spheres',
    text: 'Atoms were thought of as tiny solid spheres that could not be divided. Each element had its own kind of atom.' },
  { id: 'thomson', year: '1897', who: 'J.J. Thomson', name: 'Plum pudding model',
    text: 'The discovery of the electron showed atoms contain even smaller particles. In the plum pudding model the atom is a ball of positive charge with negative electrons embedded in it.' },
  { id: 'scatter', year: '1909', who: 'Geiger and Marsden', name: 'Alpha-scattering experiment', sim: true,
    text: 'Alpha particles were fired at very thin gold foil. Most went straight through, some were deflected, and a very few bounced back. The plum pudding model couldn’t explain this. Try both models.' },
  { id: 'rutherford', year: '1911', who: 'Ernest Rutherford', name: 'Nuclear model',
    text: 'The results showed the mass of an atom is concentrated at the centre (the nucleus), which is positively charged. Most of the atom is empty space, which is why most alpha particles pass straight through.' },
  { id: 'bohr', year: '1913', who: 'Niels Bohr', name: 'Electrons in energy levels',
    text: 'Bohr suggested electrons orbit the nucleus at specific distances (energy levels or shells). His calculations agreed with experimental observations.' },
  { id: 'chadwick', year: '1932', who: 'James Chadwick', name: 'The neutron',
    text: 'Later experiments showed the positive charge of the nucleus is split into smaller particles, protons. About 20 years after the nucleus was accepted, Chadwick provided evidence for neutrons in the nucleus.' },
];

const state = { step: 'dalton', model: 'nuclear', t: 0 };

// ---------- Static model drawings ----------

function colours() {
  return { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--border-strong'), font: PK.cssVar('--font-body') || 'sans-serif' };
}

function electron(x, y, r = 8) {
  ctx.fillStyle = '#2f7fe0'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `800 ${r + 4}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('−', x, y);
}

function label(text, x, y, c) {
  ctx.fillStyle = c.muted; ctx.font = `700 14px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawModel(id, c) {
  const t = state.t;
  if (id === 'dalton') {
    const g = ctx.createRadialGradient(CX - 40, CY - 40, 10, CX, CY, 150);
    g.addColorStop(0, '#d3d7de'); g.addColorStop(1, '#6f7784');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, 150, 0, Math.PI * 2); ctx.fill();
    label('a solid, indivisible sphere', CX + 170, CY, c);
  } else if (id === 'thomson') {
    ctx.fillStyle = 'rgba(242, 120, 140, .55)'; ctx.strokeStyle = '#c2445d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(CX, CY, 160, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a3243b'; ctx.font = `800 26px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [x, y] of [[-90, -60], [60, -100], [100, 40], [-40, 90], [-110, 30], [20, -10], [70, 110]]) ctx.fillText('+', CX + x, CY + y);
    for (const [x, y] of [[-60, -100], [10, -60], [-100, -10], [50, 60], [110, -40], [-20, 40], [-70, 110], [100, 100]]) electron(CX + x, CY + y);
    label('ball of positive charge', CX + 175, CY - 40, c);
    label('electrons embedded in it', CX + 175, CY + 40, c);
  } else {
    const shells = id === 'rutherford' ? null : [80, 135, 190];
    // Nucleus
    const parts = id === 'chadwick' ? [['p', -6, -5], ['n', 6, -5], ['n', -6, 6], ['p', 6, 6], ['p', 0, -12], ['n', 0, 12]] : [['p', 0, 0]];
    for (const [k, x, y] of parts) {
      ctx.fillStyle = k === 'p' ? '#e2483d' : '#8d939c';
      ctx.beginPath(); ctx.arc(CX + x, CY + y, id === 'chadwick' ? 7 : 12, 0, Math.PI * 2); ctx.fill();
    }
    if (id !== 'chadwick') { ctx.fillStyle = '#fff'; ctx.font = `800 16px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', CX, CY + 1); }
    if (shells) {
      ctx.strokeStyle = c.grid; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
      for (const r of shells) { ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke(); }
      ctx.setLineDash([]);
      [[2, 80], [8, 135], [2, 190]].forEach(([n, r], s) => {
        for (let i = 0; i < n; i++) { const a = t * (0.5 - s * 0.12) + (i / n) * Math.PI * 2; electron(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 7); }
      });
      label(id === 'bohr' ? 'electrons at fixed distances (energy levels)' : 'protons (red) and neutrons (grey) in the nucleus', CX + 205, CY - 150, c);
    } else {
      // Rutherford: electrons somewhere in the mostly empty space around the nucleus
      for (let i = 0; i < 6; i++) { const a = t * 0.4 + i * 1.05, r = 120 + 40 * Math.sin(i * 2.1); electron(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 7); }
      ctx.strokeStyle = c.grid; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.arc(CX, CY, 180, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      label('tiny, dense, positive nucleus', CX + 30, CY - 20, c);
      label('mostly empty space', CX + 190, CY + 150, c);
    }
  }
}

// ---------- Alpha scattering simulation ----------

const FOIL_X = [390, 420];
const atoms = [];
for (const x of FOIL_X) for (let y = 30; y <= 470; y += 40) atoms.push({ x, y: y + (x === FOIL_X[1] ? 20 : 0) });
// The real nucleus is about 1/100 000 of the atom, far too small to step through frame by
// frame. Instead each alpha is turned by Rutherford's formula as it passes a layer of the
// foil: tan(θ/2) = B / b, where b is how far it passes from the nearest nucleus.
const B = 0.08;               // px: the miss distance that gives a 90° deflection
const SPEED = 380;
let alphas = [];
const counts = { straight: 0, deflected: 0, back: 0 };
let spawnAcc = 0;

function spawn() {
  alphas.push({ x: 40, y: 60 + Math.random() * 380, vx: SPEED, vy: 0, trail: [], done: false });
}

function deflect(a, colX) {
  const column = atoms.filter((n) => n.x === colX);
  const n = column.reduce((best, m) => (Math.abs(m.y - a.y) < Math.abs(best.y - a.y) ? m : best));
  const b = a.y - n.y;
  const theta = state.model === 'nuclear'
    ? 2 * Math.atan(B / Math.max(1e-6, Math.abs(b))) * Math.sign(b || 1)   // away from the nucleus
    : (Math.random() - 0.5) * 0.02;                                       // plum pudding: barely changes
  const phi = Math.atan2(a.vy, a.vx) + theta;
  a.vx = Math.cos(phi) * SPEED; a.vy = Math.sin(phi) * SPEED;
}

function stepAlphas(dt) {
  for (const a of alphas) {
    if (a.done) continue;
    const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
    const col = a.vx > 0 ? FOIL_X.find((X) => a.x < X && nx >= X) : null;
    if (col != null) {
      // Move to the layer, turn, then carry on.
      a.y += (a.vy * (col - a.x)) / a.vx; a.x = col;
      a.trail.push({ x: a.x, y: a.y });
      deflect(a, col);
    } else { a.x = nx; a.y = ny; }
    a.trail.push({ x: a.x, y: a.y });
    if (a.trail.length > 90) a.trail.shift();
    if (a.x > W + 10 || a.x < -10 || a.y < -10 || a.y > H + 10) {
      a.done = true;
      const ang = Math.abs(Math.atan2(a.vy, a.vx)) * 180 / Math.PI;
      if (ang < 8) counts.straight++; else if (ang < 90) counts.deflected++; else counts.back++;
      renderInfo();
    }
  }
  alphas = alphas.filter((a) => !a.done || a.trail.length > 0);
  for (const a of alphas) if (a.done) a.trail.shift();
}

function drawScatter(c, dt) {
  spawnAcc += dt * 14;
  while (spawnAcc >= 1) { spawn(); spawnAcc--; }
  stepAlphas(dt);

  // Source and foil
  ctx.fillStyle = '#5b6470'; ctx.fillRect(0, CY - 200, 34, 400);
  ctx.fillStyle = '#fff'; ctx.font = `700 12px ${c.font}`; ctx.save(); ctx.translate(18, CY); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('alpha source', 0, 0); ctx.restore();
  ctx.fillStyle = 'rgba(212, 175, 55, .25)'; ctx.fillRect(FOIL_X[0] - 16, 0, FOIL_X[1] - FOIL_X[0] + 32, H);
  for (const n of atoms) {
    if (state.model === 'nuclear') { ctx.fillStyle = '#d4af37'; ctx.beginPath(); ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(242, 120, 140, .45)'; ctx.beginPath(); ctx.arc(n.x, n.y, 19, 0, Math.PI * 2); ctx.fill(); }
  }
  // Alpha trails
  ctx.lineWidth = 2;
  for (const a of alphas) {
    ctx.strokeStyle = 'rgba(226, 72, 61, .65)';
    ctx.beginPath(); a.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    if (!a.done) { ctx.fillStyle = '#e2483d'; ctx.beginPath(); ctx.arc(a.x, a.y, 4, 0, Math.PI * 2); ctx.fill(); }
  }
  label('gold foil', FOIL_X[0] - 12, H - 14, c);
}

// ---------- Panel and loop ----------

function renderInfo() {
  const s = STEPS.find((x) => x.id === state.step);
  const total = counts.straight + counts.deflected + counts.back;
  const pct = (n) => (total ? `${((100 * n) / total).toFixed(n && n / total < 0.01 ? 2 : 1)}%` : '—');
  $('info').innerHTML = `<div class="year">${s.year}</div><div class="who">${s.who}</div>
    <h2 style="margin-top:10px">${s.name}</h2><p style="margin:0">${s.text}</p>
    ${s.sim ? `<h2 style="margin-top:14px">Results so far</h2>
      <div class="counts">
        <span>Went straight through</span><b>${counts.straight} (${pct(counts.straight)})</b>
        <span>Deflected</span><b>${counts.deflected} (${pct(counts.deflected)})</b>
        <span>Bounced back</span><b>${counts.back} (${pct(counts.back)})</b>
      </div>
      <p class="note">${state.model === 'nuclear'
        ? 'Most pass straight through the empty space. Only those that come very close to a tiny, positive nucleus are deflected, and a head-on hit bounces back.'
        : 'With charge spread thinly over the whole atom, nothing is strong enough to deflect an alpha particle much, so none bounce back. That’s not what Geiger and Marsden saw.'}</p>` : ''}`;
}

$('steps').innerHTML = STEPS.map((s) => `<button class="btn" data-s="${s.id}">${s.year.replace('about ', '')}: ${s.name}</button>`).join('');
$('steps').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) setStep(b.dataset.s); });
document.querySelectorAll('#model-pick .chip').forEach((b) => b.addEventListener('click', () => {
  state.model = b.dataset.m;
  document.querySelectorAll('#model-pick .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  alphas = []; Object.assign(counts, { straight: 0, deflected: 0, back: 0 });
  renderInfo();
}));
$('reset-count').addEventListener('click', () => { Object.assign(counts, { straight: 0, deflected: 0, back: 0 }); renderInfo(); });

function setStep(id) {
  state.step = id;
  document.querySelectorAll('#steps .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === id)));
  $('bar').hidden = id !== 'scatter';
  if (id === 'scatter') { alphas = []; Object.assign(counts, { straight: 0, deflected: 0, back: 0 }); }
  renderInfo();
  history.replaceState(null, '', '#s=' + id);
}

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.t += dt;
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = colours();
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  if (state.step === 'scatter') drawScatter(c, dt); else drawModel(state.step, c);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeCanvas);
sizeCanvas();
const fromHash = new URLSearchParams(location.hash.slice(1)).get('s');
setStep(STEPS.some((s) => s.id === fromHash) ? fromHash : 'dalton');
requestAnimationFrame(frame);
