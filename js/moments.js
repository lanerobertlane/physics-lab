// Moments: weights hung on a beam pivoted at its centre. Moment = F × d about the pivot.
// Hooks are every 0.1 m from 0.1 m to 0.5 m on each side.

PK.header({
  title: 'Moments',
  answers: true,
  spec: [
    { code: '4.5.4', text: 'Moments, levers and gears: moment = force × perpendicular distance (M = F d); the principle of moments for a balanced object', po: true },
    { code: 'KS3', text: 'Moment as the turning effect of a force; balanced moments' },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('beam'), ctx = canvas.getContext('2d');
const W = 800, H = 420, CX = 400, PIVOT_Y = 200, PX_PER_M = 720;
const HOOKS = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];   // ×0.1 m (negative = left)

const state = { weight: 1, hung: {}, angle: 0 };   // hung: hook → list of weights (N)

const PRESETS = [
  ['Examples…', null],
  ['Balanced: same weight, same distance', { '-3': [2], 3: [2] }],
  ['Balanced: 2 N far, 4 N near', { '-4': [2], 2: [2, 2] }],
  ['Unbalanced', { '-2': [5], 3: [2] }],
  ['Challenge: balance 5 N at 0.2 m', { '-2': [5] }],
  ['Challenge: three weights', { '-5': [1], '-1': [5], 4: [2] }],
];

function moments() {
  let acw = 0, cw = 0;
  const left = [], right = [];
  for (const [h, ws] of Object.entries(state.hung)) {
    const d = Math.abs(Number(h)) / 10;
    for (const w of ws) {
      const m = w * d;
      if (Number(h) < 0) { acw += m; left.push([w, d]); } else { cw += m; right.push([w, d]); }
    }
  }
  return { acw, cw, left, right };
}

// ---------- Drawing ----------

function hookPos(h, a) {
  const x = (h / 10) * PX_PER_M;
  return { x: CX + x * Math.cos(a), y: PIVOT_Y + x * Math.sin(a) };
}

function draw(dt) {
  const { acw, cw } = moments();
  const net = cw - acw;
  const target = Math.max(-0.2, Math.min(0.2, net * 0.08));
  state.angle += (target - state.angle) * Math.min(1, dt * 4);

  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), art: PK.cssVar('--art'), accent: PK.cssVar('--accent'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);

  // Pivot
  ctx.fillStyle = '#6b7380';
  ctx.beginPath(); ctx.moveTo(CX, PIVOT_Y); ctx.lineTo(CX - 40, PIVOT_Y + 150); ctx.lineTo(CX + 40, PIVOT_Y + 150); ctx.closePath(); ctx.fill();
  ctx.fillRect(CX - 140, PIVOT_Y + 150, 280, 12);

  // Beam
  ctx.save(); ctx.translate(CX, PIVOT_Y); ctx.rotate(state.angle);
  ctx.fillStyle = '#c9a66b'; ctx.strokeStyle = '#6b5532'; ctx.lineWidth = 2;
  ctx.fillRect(-380, -10, 760, 20); ctx.strokeRect(-380, -10, 760, 20);
  ctx.fillStyle = '#6b5532'; ctx.font = `700 11px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const h of HOOKS) ctx.fillText(`${Math.abs(h) / 10}`, (h / 10) * PX_PER_M, 0);
  ctx.restore();
  ctx.fillStyle = c.text; ctx.beginPath(); ctx.arc(CX, PIVOT_Y, 6, 0, Math.PI * 2); ctx.fill();

  // Hooks and weights (they hang straight down)
  for (const h of HOOKS) {
    const p = hookPos(h, state.angle);
    ctx.strokeStyle = c.art; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y + 10); ctx.lineTo(p.x, p.y + 24); ctx.stroke();
    const ws = state.hung[h] || [];
    let y = p.y + 24;
    for (const w of ws) {
      const hgt = 14 + w * 5, wid = 34 + w * 3;
      ctx.fillStyle = w === 5 ? '#5d6470' : w === 2 ? '#8a929f' : '#b5bcc6';
      ctx.fillRect(p.x - wid / 2, y, wid, hgt);
      ctx.strokeStyle = c.text; ctx.lineWidth = 1; ctx.strokeRect(p.x - wid / 2, y, wid, hgt);
      ctx.fillStyle = '#fff'; ctx.font = `800 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${w} N`, p.x, y + hgt / 2);
      y += hgt + 3;
    }
    if (!ws.length) { ctx.strokeStyle = c.accent; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(p.x, p.y + 32, 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  }

  ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('Numbers on the beam: distance from the pivot in metres', 16, 14);
  ctx.textAlign = 'center';
  ctx.fillText('↺ anticlockwise side', CX - 220, PIVOT_Y + 190);
  ctx.fillText('clockwise side ↻', CX + 220, PIVOT_Y + 190);
}

// ---------- Panel ----------

const fmt = (x) => String(parseFloat(x.toFixed(2)));

function render() {
  const { acw, cw, left, right } = moments();
  const list = (items) => items.length ? items.map(([w, d]) => `${w} N × ${d} m = ${PK.ans(`${fmt(w * d)} N m`)}`).join('<br>') : 'none';
  $('sides').innerHTML = `
    <div><b>Anticlockwise</b><br>${list(left)}<b class="total">${PK.ans(`${fmt(acw)} N m`)}</b></div>
    <div><b>Clockwise</b><br>${list(right)}<b class="total">${PK.ans(`${fmt(cw)} N m`)}</b></div>`;
  const diff = Math.abs(cw - acw);
  $('verdict').innerHTML = diff < 1e-9
    ? (acw === 0 ? 'Hang some weights on the beam.' : '<span class="badge good">Balanced</span> The clockwise and anticlockwise moments are equal.')
    : `<span class="badge bad">Not balanced</span> The ${cw > acw ? 'clockwise' : 'anticlockwise'} moment is bigger by ${PK.ans(`${fmt(diff)} N m`)}, so the beam turns ${cw > acw ? 'clockwise' : 'anticlockwise'}.`;
  history.replaceState(null, '', '#' + Object.entries(state.hung).filter(([, w]) => w.length).map(([h, w]) => `${h}:${w.join('.')}`).join('_'));
}

// ---------- Interaction ----------

function point(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = point(e);
  let best = null, bd = 1e9;
  for (const h of HOOKS) { const hp = hookPos(h, state.angle); const d = Math.abs(hp.x - p.x); if (d < bd) { bd = d; best = h; } }
  if (best == null || bd > 36) return;
  const hp = hookPos(best, state.angle);
  const ws = state.hung[best] || (state.hung[best] = []);
  if (p.y > hp.y + 22 && ws.length) ws.pop();          // tapped the weights: take the bottom one off
  else if (ws.length < 4) ws.push(state.weight);
  render();
});

document.querySelectorAll('#weights .chip').forEach((b) => b.addEventListener('click', () => {
  state.weight = Number(b.dataset.w);
  document.querySelectorAll('#weights .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));
$('preset').innerHTML = PRESETS.map(([n], i) => `<option value="${i}">${n}</option>`).join('');
$('preset').addEventListener('change', (e) => {
  const v = PRESETS[Number(e.target.value)][1];
  if (!v) return;
  state.hung = JSON.parse(JSON.stringify(v));
  render();
});
$('clear').addEventListener('click', () => { state.hung = {}; $('preset').value = '0'; render(); });

function loadHash() {
  for (const part of location.hash.slice(1).split('_').filter(Boolean)) {
    const [h, w] = part.split(':');
    if (HOOKS.includes(Number(h))) state.hung[h] = w.split('.').map(Number).filter((x) => [1, 2, 5].includes(x)).slice(0, 4);
  }
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
  draw(dt);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeCanvas);
sizeCanvas();
loadHash();
render();
requestAnimationFrame(frame);

// Share: the weights hanging on the beam
PK.shareState = {
  get: () => ({ h: state.hung }),
  set: (o) => { if (o.h && typeof o.h === 'object') { state.hung = o.h; render(); } },
};
