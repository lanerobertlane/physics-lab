// Moments: weights hung on a beam pivoted at its centre. Moment = F × d about the pivot.
// Hooks are every 0.1 m from 0.1 m to 0.5 m on each side. Weights are dragged from the tray
// onto a hook, and off again.

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
const MAX_ON_HOOK = 4;
const TRAY = [{ w: 1, x: 320 }, { w: 2, x: 400 }, { w: 5, x: 480 }], TRAY_Y = 92;

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

const blockH = (w) => 24 + w * 5, blockW = (w) => 42 + w * 3;
const blockFill = (w) => (w === 5 ? '#5d6470' : w === 2 ? '#7d8590' : '#a3abb6');

function drawBlock(x, y, w, c, lifted) {
  const hgt = blockH(w), wid = blockW(w);
  if (lifted) { ctx.save(); ctx.shadowColor = 'rgba(0, 0, 0, .35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; }
  ctx.fillStyle = blockFill(w);
  ctx.fillRect(x - wid / 2, y, wid, hgt);
  if (lifted) ctx.restore();
  ctx.strokeStyle = c.text; ctx.lineWidth = 1; ctx.strokeRect(x - wid / 2, y, wid, hgt);
  ctx.fillStyle = '#fff'; ctx.font = `800 15px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${w} N`, x, y + hgt / 2 + 1);
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

  // Tray of weights to drag from
  ctx.fillStyle = c.muted; ctx.font = `700 16px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('Drag a weight onto a hook. Drag it off to take it away.', CX, 12);
  for (const t of TRAY) {
    if (state.weight === t.w) {
      ctx.strokeStyle = c.accent; ctx.lineWidth = 3;
      ctx.strokeRect(t.x - blockW(t.w) / 2 - 5, TRAY_Y - blockH(t.w) / 2 - 5, blockW(t.w) + 10, blockH(t.w) + 10);
    }
    drawBlock(t.x, TRAY_Y - blockH(t.w) / 2, t.w, c);
  }

  // Pivot
  ctx.fillStyle = '#6b7380';
  ctx.beginPath(); ctx.moveTo(CX, PIVOT_Y); ctx.lineTo(CX - 40, PIVOT_Y + 150); ctx.lineTo(CX + 40, PIVOT_Y + 150); ctx.closePath(); ctx.fill();
  ctx.fillRect(CX - 140, PIVOT_Y + 150, 280, 12);

  // Beam, with the distance from the pivot printed on it
  ctx.save(); ctx.translate(CX, PIVOT_Y); ctx.rotate(state.angle);
  ctx.fillStyle = '#c9a66b'; ctx.strokeStyle = '#6b5532'; ctx.lineWidth = 2;
  ctx.fillRect(-380, -13, 760, 26); ctx.strokeRect(-380, -13, 760, 26);
  ctx.fillStyle = '#3d2f1a'; ctx.font = `800 16px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const h of HOOKS) ctx.fillText(`${Math.abs(h) / 10}`, (h / 10) * PX_PER_M, 1);
  ctx.restore();
  ctx.fillStyle = c.text; ctx.beginPath(); ctx.arc(CX, PIVOT_Y, 6, 0, Math.PI * 2); ctx.fill();

  // Hooks and weights (they hang straight down)
  for (const h of HOOKS) {
    const p = hookPos(h, state.angle);
    ctx.strokeStyle = c.art; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y + 13); ctx.lineTo(p.x, p.y + 27); ctx.stroke();
    const ws = state.hung[h] || [];
    let y = p.y + 27;
    for (const w of ws) { drawBlock(p.x, y, w, c); y += blockH(w) + 3; }
    const lit = drag && drag.moved && drag.target === h;
    if (!ws.length || lit) {
      const ry = ws.length ? y + 14 : p.y + 41;
      ctx.strokeStyle = c.accent; ctx.lineWidth = lit ? 3.5 : 2; ctx.setLineDash(lit ? [] : [4, 4]);
      ctx.beginPath(); ctx.arc(p.x, ry, 14, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c.accent; ctx.font = `800 20px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', p.x, ry + 1);
    }
  }

  ctx.fillStyle = c.muted; ctx.font = `700 16px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('↺ anticlockwise side', CX - 220, H - 28);
  ctx.fillText('clockwise side ↻', CX + 220, H - 28);
  ctx.fillText('Numbers on the beam: distance from the pivot in metres', CX, PIVOT_Y + 172);

  // The weight being dragged, on top of everything
  if (drag && drag.moved) drawBlock(drag.x, drag.y - blockH(drag.w) / 2, drag.w, c, true);
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

// ---------- Dragging weights ----------

let drag = null;

function point(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

function trayAt(p) {
  return TRAY.find((t) => Math.abs(p.x - t.x) < blockW(t.w) / 2 + 12 && Math.abs(p.y - TRAY_Y) < blockH(t.w) / 2 + 12);
}

// Which weight on the beam is under the finger?
function hungAt(p) {
  for (const h of HOOKS) {
    const hp = hookPos(h, state.angle), ws = state.hung[h] || [];
    let y = hp.y + 27;
    for (let i = 0; i < ws.length; i++) {
      const hgt = blockH(ws[i]);
      if (Math.abs(p.x - hp.x) < blockW(ws[i]) / 2 + 6 && p.y >= y - 2 && p.y <= y + hgt + 2) return { h, i };
      y += hgt + 3;
    }
  }
  return null;
}

// The hook a weight would go on if it were let go here
function nearestHook(p) {
  let best = null, bd = 90;
  for (const h of HOOKS) {
    const hp = hookPos(h, state.angle), ws = state.hung[h] || [];
    const stack = ws.reduce((a, w) => a + blockH(w) + 3, 0);
    const d = Math.hypot(p.x - hp.x, Math.max(0, hp.y - p.y) + Math.max(0, p.y - (hp.y + 60 + stack)));
    if (d < bd) { bd = d; best = h; }
  }
  return best;
}

function hang(h, w) {
  const ws = state.hung[h] || (state.hung[h] = []);
  if (ws.length >= MAX_ON_HOOK) { PK.toast(`A hook can only hold ${MAX_ON_HOOK} weights`); return false; }
  ws.push(w);
  return true;
}

canvas.addEventListener('pointerdown', (e) => {
  const p = point(e), t = trayAt(p), on = t ? null : hungAt(p);
  if (t) {
    state.weight = t.w;
    drag = { w: t.w, from: null, x: p.x, y: p.y, x0: p.x, y0: p.y, moved: false, target: null };
  } else if (on) {
    const [w] = state.hung[on.h].splice(on.i, 1);
    drag = { w, from: on.h, x: p.x, y: p.y, x0: p.x, y0: p.y, moved: false, target: on.h };
    render();
  } else {
    // A tap by a hook hangs the weight chosen in the tray
    const h = nearestHook(p), hp = h != null && hookPos(h, state.angle);
    if (h != null && Math.abs(p.x - hp.x) < 40 && hang(h, state.weight)) { $('preset').value = '0'; render(); }
    return;
  }
  canvas.setPointerCapture(e.pointerId);
  canvas.style.cursor = 'grabbing';
  e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
  const p = point(e);
  if (!drag) { canvas.style.cursor = trayAt(p) || hungAt(p) ? 'grab' : ''; return; }
  drag.x = p.x; drag.y = p.y;
  if (Math.hypot(p.x - drag.x0, p.y - drag.y0) > 8) drag.moved = true;
  drag.target = nearestHook(p);
});

function finishDrag(cancelled) {
  if (!drag) return;
  const d = drag;
  drag = null;
  canvas.style.cursor = '';
  if (d.moved && !cancelled && d.target != null) {
    if (!hang(d.target, d.w) && d.from != null) hang(d.from, d.w);   // that hook was full: put it back
  } else if (cancelled && d.from != null) {
    hang(d.from, d.w);
  }
  // A tap on a weight on the beam takes it off, and so does dropping it away from the hooks
  $('preset').value = '0';
  render();
}
canvas.addEventListener('pointerup', () => finishDrag(false));
canvas.addEventListener('pointercancel', () => finishDrag(true));

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
    if (HOOKS.includes(Number(h))) state.hung[h] = w.split('.').map(Number).filter((x) => [1, 2, 5].includes(x)).slice(0, MAX_ON_HOOK);
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
