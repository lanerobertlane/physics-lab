// Red-shift: galaxies spread out as the universe expands (every distance grows by the same
// factor), so speed is proportional to distance. Each galaxy's absorption lines are
// shifted by z = v / c towards longer (redder) wavelengths.

PK.header({
  title: 'Red-shift',
  spec: [
    { code: '4.8.2', text: 'Red-shift: an increase in the observed wavelength of light from most distant galaxies; the further away, the faster they move and the bigger the red-shift', po: true },
    { code: '4.8.2', text: 'Red-shift provides evidence that the universe is expanding and supports the Big Bang theory; dark mass and dark energy', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const uni = $('universe'), uctx = uni.getContext('2d');
const spec = $('spectra'), sctx = spec.getContext('2d');
const W = 800, H = 460, CX = 400, CY = 230;
const MLY_PER_PX = 10;        // million light-years per pixel at the current size
const H0 = 22;                // km/s per million light-years (about 70 km/s per megaparsec)
const C = 300000;             // km/s
const LINES = [410, 434, 486, 656];   // hydrogen absorption lines (nm)

let seed = 3;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const galaxies = Array.from({ length: 46 }, (_, i) => {
  const a = rnd() * Math.PI * 2, r = 40 + Math.sqrt(rnd()) * 200;
  return { x: Math.cos(a) * r * 1.7, y: Math.sin(a) * r, rot: rnd() * Math.PI, size: 5 + rnd() * 5, hue: 30 + rnd() * 30 };
});

const state = { scale: 0.55, playing: true, sel: 3 };

function distanceMly(g) { return Math.hypot(g.x, g.y) * state.scale * MLY_PER_PX; }

// ---------- Universe view ----------

function sizeCanvases() {
  const dpr = window.devicePixelRatio || 1;
  uni.width = Math.round(uni.clientWidth * dpr); uni.height = Math.round(uni.clientWidth * (H / W) * dpr);
  spec.width = Math.round(spec.clientWidth * dpr); spec.height = Math.round(spec.clientWidth * (200 / 800) * dpr);
}

function drawGalaxy(x, y, g, highlight) {
  uctx.save(); uctx.translate(x, y); uctx.rotate(g.rot);
  const s = g.size * (0.6 + state.scale * 0.6);
  const grad = uctx.createRadialGradient(0, 0, 0, 0, 0, s * 2);
  grad.addColorStop(0, `hsla(${g.hue}, 90%, 85%, 1)`); grad.addColorStop(1, `hsla(${g.hue}, 80%, 60%, 0)`);
  uctx.fillStyle = grad; uctx.scale(1, 0.45); uctx.beginPath(); uctx.arc(0, 0, s * 2, 0, Math.PI * 2); uctx.fill();
  uctx.restore();
  if (highlight) { uctx.strokeStyle = '#ffd23f'; uctx.lineWidth = 2; uctx.beginPath(); uctx.arc(x, y, s * 2 + 8, 0, Math.PI * 2); uctx.stroke(); }
}

function drawUniverse() {
  const k = uni.width / W;
  uctx.setTransform(k, 0, 0, k, 0, 0);
  const font = PK.cssVar('--font-body') || 'sans-serif';
  uctx.fillStyle = '#050814'; uctx.fillRect(0, 0, W, H);
  const sel = galaxies[state.sel];
  const sx = CX + sel.x * state.scale, sy = CY + sel.y * state.scale;
  uctx.strokeStyle = 'rgba(255, 210, 63, .5)'; uctx.setLineDash([6, 6]); uctx.lineWidth = 1.5;
  uctx.beginPath(); uctx.moveTo(CX, CY); uctx.lineTo(sx, sy); uctx.stroke(); uctx.setLineDash([]);
  galaxies.forEach((g, i) => drawGalaxy(CX + g.x * state.scale, CY + g.y * state.scale, g, i === state.sel));
  // Us
  uctx.fillStyle = '#7ee787'; uctx.beginPath(); uctx.arc(CX, CY, 7, 0, Math.PI * 2); uctx.fill();
  uctx.font = `700 13px ${font}`; uctx.textAlign = 'center'; uctx.textBaseline = 'top';
  uctx.fillText('us (the Milky Way)', CX, CY + 10);
  uctx.fillStyle = 'rgba(255,255,255,.75)'; uctx.textAlign = 'left';
  uctx.fillText('Every galaxy moves away from every other one as space itself expands.', 14, 12);
}

// ---------- Spectra ----------

function visibleColour(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else r = 1;
  const fade = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
  const to = (v) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v * fade)), 0.8));
  return `rgb(${to(r)},${to(g)},${to(b)})`;
}

function drawSpectra(z) {
  const GW = 800, GH = 200, k = spec.width / GW;
  sctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), font: PK.cssVar('--font-body') || 'sans-serif' };
  sctx.fillStyle = c.surface; sctx.fillRect(0, 0, GW, GH);
  const L = 150, R = 20, x = (nm) => L + ((nm - 380) / 400) * (GW - L - R);
  const band = (y, h, shift, label) => {
    for (let nm = 380; nm <= 780; nm += 1) { sctx.fillStyle = visibleColour(nm); sctx.fillRect(x(nm), y, x(nm + 1) - x(nm) + 0.5, h); }
    sctx.fillStyle = '#000';
    for (const l of LINES) { const nm = l * (1 + shift); if (nm <= 780) sctx.fillRect(x(nm) - 2, y, 4, h); }
    sctx.fillStyle = c.text; sctx.font = `700 13px ${c.font}`; sctx.textAlign = 'right'; sctx.textBaseline = 'middle';
    sctx.fillText(label, L - 10, y + h / 2);
  };
  band(20, 50, 0, 'Light from the Sun');
  band(110, 50, z, 'Selected galaxy');
  // Shift arrows between matching lines
  sctx.strokeStyle = c.text; sctx.fillStyle = c.text; sctx.lineWidth = 1.5;
  for (const l of LINES) {
    const x1 = x(l), x2 = x(l * (1 + z));
    if (x2 > GW - R) continue;
    sctx.setLineDash([3, 3]); sctx.beginPath(); sctx.moveTo(x1, 72); sctx.lineTo(x2, 108); sctx.stroke(); sctx.setLineDash([]);
  }
  sctx.font = `600 13px ${c.font}`; sctx.textAlign = 'left'; sctx.textBaseline = 'top';
  sctx.fillText('violet (short wavelength)', L, 172);
  sctx.textAlign = 'right'; sctx.fillText('red (long wavelength) →', GW - R, 172);
}

// ---------- Panel and loop ----------

function renderPanel() {
  const g = galaxies[state.sel];
  const d = distanceMly(g), v = H0 * d, z = v / C;
  $('readout').innerHTML = `
    <dt>Distance</dt><dd>${Math.round(d).toLocaleString()} million light-years</dd>
    <dt>Moving away at</dt><dd>${Math.round(v).toLocaleString()} km/s</dd>
    <dt>Red-shift</dt><dd>lines moved ${(z * 100).toFixed(1)}% longer</dd>`;
  $('explain').textContent = 'Tap a galaxy further from us: its lines shift further towards red, because it is moving away faster.';
  drawSpectra(z);
}

uni.addEventListener('pointerdown', (e) => {
  const r = uni.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H;
  let best = -1, bd = 1e9;
  galaxies.forEach((g, i) => { const d = Math.hypot(CX + g.x * state.scale - px, CY + g.y * state.scale - py); if (d < bd) { bd = d; best = i; } });
  if (bd < 40) { state.sel = best; renderPanel(); }
});
$('play').addEventListener('click', () => { state.playing = !state.playing; $('play').textContent = state.playing ? '❚❚ Pause expansion' : '▶ Expand'; });
$('reset').addEventListener('click', () => { state.scale = 0.3; renderPanel(); });

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.playing) { state.scale *= 1 + dt * 0.04; if (state.scale > 1.25) state.scale = 0.3; }
  drawUniverse();
  if ((tick += dt) > 0.25) { tick = 0; renderPanel(); }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { sizeCanvases(); renderPanel(); });
sizeCanvases();
renderPanel();
requestAnimationFrame(frame);

// Share: how far the universe has expanded
PK.shareState = { get: () => ({ s: state.scale }), set: (o) => { if (o.s) { state.scale = Number(o.s); renderPanel(); } } };
