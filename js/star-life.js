// Life cycle of a star: stage-by-stage pictures for Sun-sized and massive stars.

PK.header({
  title: 'Life cycle of a star',
  spec: [
    { code: '4.8.1.2', text: 'The life cycle of a star: nebula, protostar, main sequence, red giant or red super giant, white dwarf, black dwarf, supernova, neutron star or black hole', po: true },
    { code: '4.8.1.2', text: 'Fusion in stars produces elements up to iron; heavier elements form in supernovae, which distribute them throughout the universe', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('star'), ctx = canvas.getContext('2d');
const W = 800, H = 460, CX = 400, CY = 230;

const STAGES = {
  nebula: { name: 'Nebula', text: 'A huge cloud of dust and gas, mainly hydrogen. Gravity starts to pull parts of the cloud together.' },
  protostar: { name: 'Protostar', text: 'As the gas is pulled in it gets hotter and denser. When the core is hot enough, hydrogen nuclei start to fuse into helium.' },
  main: { name: 'Main sequence star', text: 'Fusion of hydrogen into helium releases energy. The outward pressure from this balances the inward pull of gravity, so the star is stable for billions of years. The Sun is at this stage now.' },
  main_big: { name: 'Main sequence star', text: 'A massive star is hotter, bluer and brighter. It is stable while gravity is balanced by pressure from fusion, but it uses up its hydrogen much faster: millions rather than billions of years.' },
  redgiant: { name: 'Red giant', text: 'When the hydrogen in the core runs out, the star swells and cools, glowing red. Helium and then other light elements are fused into heavier elements.' },
  supergiant: { name: 'Red super giant', text: 'A massive star swells into an enormous red super giant. Fusion makes heavier and heavier elements, up to iron.' },
  whitedwarf: { name: 'White dwarf', text: 'The outer layers drift away. The core that is left collapses into a small, very hot, very dense white dwarf. No fusion happens any more.' },
  blackdwarf: { name: 'Black dwarf', text: 'Over a very long time the white dwarf cools down and stops giving out light, becoming a black dwarf.' },
  supernova: { name: 'Supernova', text: 'The star explodes. Elements heavier than iron are formed in the explosion, which spreads them throughout the universe. They can later become part of new stars and planets.' },
  neutron: { name: 'Neutron star', text: 'The core left behind collapses into a neutron star: it may be only about 20 km across, but more massive than the Sun.' },
  blackhole: { name: 'Black hole', text: 'If the star was very massive, the core collapses further into a black hole. Its gravity is so strong that not even light can escape.' },
};

const PATHS = {
  sun: ['nebula', 'protostar', 'main', 'redgiant', 'whitedwarf', 'blackdwarf'],
  massive: ['nebula', 'protostar', 'main_big', 'supergiant', 'supernova', 'neutron'],
  huge: ['nebula', 'protostar', 'main_big', 'supergiant', 'supernova', 'blackhole'],
};

const state = { path: 'sun', i: 0, prev: null, fade: 1, playing: false, t: 0 };
const stage = () => PATHS[state.path][state.i];

// ---------- Drawing each stage ----------

function glow(x, y, r, inner, outer) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

const CLOUD = Array.from({ length: 40 }, (_, i) => ({ a: i * 2.4, r: 40 + ((i * 37) % 170), s: 40 + ((i * 53) % 60), hue: [300, 210, 20, 260][i % 4] }));

function drawStage(id, t) {
  if (id === 'nebula' || id === 'protostar') {
    const shrink = id === 'protostar' ? 0.55 : 1;
    for (const b of CLOUD) {
      const x = CX + Math.cos(b.a + t * 0.03) * b.r * shrink * 1.6, y = CY + Math.sin(b.a + t * 0.03) * b.r * shrink * 0.8;
      glow(x, y, b.s * shrink + 20, `hsla(${b.hue}, 70%, 60%, .22)`, 'rgba(0,0,0,0)');
    }
    if (id === 'protostar') { glow(CX, CY, 90, 'rgba(255, 190, 120, .95)', 'rgba(255, 120, 60, 0)'); glow(CX, CY, 26, '#fff4dc', 'rgba(255,200,120,.6)'); }
  } else if (id === 'main' || id === 'main_big') {
    const big = id === 'main_big';
    const r = big ? 85 : 60;
    glow(CX, CY, r * 2.6, big ? 'rgba(150, 190, 255, .55)' : 'rgba(255, 220, 120, .55)', 'rgba(0,0,0,0)');
    glow(CX, CY, r, big ? '#f4f8ff' : '#fffbe6', big ? '#7fa8ff' : '#ffc23d');
    // Balance of forces
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.2;
      arrow(CX + Math.cos(a) * (r + 70), CY + Math.sin(a) * (r + 70), CX + Math.cos(a) * (r + 18), CY + Math.sin(a) * (r + 18), '#ff6b6b');
      arrow(CX + Math.cos(a + 0.39) * (r - 30), CY + Math.sin(a + 0.39) * (r - 30), CX + Math.cos(a + 0.39) * (r + 46), CY + Math.sin(a + 0.39) * (r + 46), '#ffd166');
    }
    ctx.font = '700 14px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff6b6b'; ctx.fillText('gravity pulls in', 20, H - 46);
    ctx.fillStyle = '#ffd166'; ctx.fillText('pressure from fusion pushes out', 20, H - 24);
  } else if (id === 'redgiant' || id === 'supergiant') {
    const r = id === 'supergiant' ? 200 : 140;
    glow(CX, CY, r * 1.3, 'rgba(255, 110, 60, .4)', 'rgba(0,0,0,0)');
    glow(CX, CY, r, '#ffb36b', '#c2361b');
  } else if (id === 'whitedwarf') {
    // Planetary nebula (outer layers drifting off) around a tiny white dwarf
    ctx.strokeStyle = 'rgba(120, 220, 255, .35)'; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.ellipse(CX, CY, 150 + Math.sin(t) * 3, 110, 0.3, 0, Math.PI * 2); ctx.stroke();
    glow(CX, CY, 40, 'rgba(230, 240, 255, .9)', 'rgba(150, 180, 255, 0)');
    glow(CX, CY, 12, '#ffffff', '#dfe8ff');
  } else if (id === 'blackdwarf') {
    ctx.fillStyle = '#2a2d36'; ctx.strokeStyle = '#555b69'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(CX, CY, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (id === 'supernova') {
    const pulse = 1 + 0.08 * Math.sin(t * 6);
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2, len = (170 + (k % 5) * 30) * pulse;
      ctx.strokeStyle = `hsla(${30 + (k % 4) * 15}, 100%, 65%, .7)`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * 40, CY + Math.sin(a) * 40); ctx.lineTo(CX + Math.cos(a) * len, CY + Math.sin(a) * len); ctx.stroke();
    }
    glow(CX, CY, 150 * pulse, 'rgba(255, 255, 230, .95)', 'rgba(255, 120, 40, 0)');
  } else if (id === 'neutron') {
    const a = t * 3;
    for (const s of [1, -1]) {
      ctx.fillStyle = 'rgba(140, 200, 255, .25)';
      ctx.beginPath(); ctx.moveTo(CX, CY);
      ctx.lineTo(CX + s * Math.cos(a) * 260 - Math.sin(a) * 30, CY + s * Math.sin(a) * 260 + Math.cos(a) * 30);
      ctx.lineTo(CX + s * Math.cos(a) * 260 + Math.sin(a) * 30, CY + s * Math.sin(a) * 260 - Math.cos(a) * 30);
      ctx.closePath(); ctx.fill();
    }
    glow(CX, CY, 30, 'rgba(210, 235, 255, 1)', 'rgba(120, 170, 255, 0)');
    glow(CX, CY, 8, '#ffffff', '#cfe3ff');
  } else if (id === 'blackhole') {
    ctx.save(); ctx.translate(CX, CY); ctx.scale(1, 0.32);
    for (let k = 0; k < 5; k++) { ctx.strokeStyle = `rgba(255, ${150 + k * 20}, 80, ${0.5 - k * 0.08})`; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(0, 0, 70 + k * 18, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(CX, CY, 46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 200, 120, .8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(CX, CY, 48, 0, Math.PI * 2); ctx.stroke();
  }
}

function arrow(x1, y1, x2, y2, col) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 10 * Math.cos(a - 0.45), y2 - 10 * Math.sin(a - 0.45)); ctx.lineTo(x2 - 10 * Math.cos(a + 0.45), y2 - 10 * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
}

const STARS = Array.from({ length: 120 }, (_, i) => ({ x: (i * 97.3) % W, y: (i * 61.7 + (i % 5) * 23) % H, s: (i % 3) * 0.5 + 0.5 }));

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = '#070a14'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  for (const s of STARS) { ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill(); }
  if (state.prev && state.fade < 1) { ctx.globalAlpha = 1 - state.fade; drawStage(state.prev, state.t); }
  ctx.globalAlpha = state.fade; drawStage(stage(), state.t); ctx.globalAlpha = 1;
}

// ---------- Panel and controls ----------

function render() {
  const id = stage();
  $('name').textContent = `${state.i + 1}. ${STAGES[id].name}`;
  $('text').textContent = STAGES[id].text;
  $('timeline').innerHTML = PATHS[state.path].map((s, i) => `<button class="btn" data-i="${i}" aria-pressed="${i === state.i}">${STAGES[s].name}</button>`).join('');
  $('prev').disabled = state.i === 0;
  $('next').disabled = state.i === PATHS[state.path].length - 1;
  history.replaceState(null, '', `#path=${state.path}&stage=${state.i}`);
}

function go(i) {
  i = Math.max(0, Math.min(PATHS[state.path].length - 1, i));
  if (i === state.i) return;
  state.prev = stage(); state.i = i; state.fade = 0;
  render();
}

$('prev').addEventListener('click', () => go(state.i - 1));
$('next').addEventListener('click', () => go(state.i + 1));
$('timeline').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) go(Number(b.dataset.i)); });
$('play').addEventListener('click', () => {
  state.playing = !state.playing;
  $('play').textContent = state.playing ? '❚❚ Pause' : '▶ Play all';
  if (state.playing && state.i === PATHS[state.path].length - 1) { state.prev = null; state.i = 0; state.fade = 1; render(); }
});
document.querySelectorAll('#paths .chip').forEach((b) => b.addEventListener('click', () => {
  state.path = b.dataset.p;
  document.querySelectorAll('#paths .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  state.i = Math.min(state.i, PATHS[state.path].length - 1);
  state.prev = null; state.fade = 1;
  render();
}));

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

let last = performance.now(), playT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.t += dt;
  state.fade = Math.min(1, state.fade + dt * 1.5);
  if (state.playing && (playT += dt) > 4) {
    playT = 0;
    if (state.i < PATHS[state.path].length - 1) go(state.i + 1);
    else { state.playing = false; $('play').textContent = '▶ Play all'; }
  }
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeCanvas);
const q = new URLSearchParams(location.hash.slice(1));
if (PATHS[q.get('path')]) {
  state.path = q.get('path');
  document.querySelectorAll('#paths .chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.p === state.path)));
}
state.i = Math.max(0, Math.min(PATHS[state.path].length - 1, Number(q.get('stage')) || 0));
sizeCanvas();
render();
requestAnimationFrame(frame);
