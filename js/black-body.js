// Black body radiation and the greenhouse effect: the spectrum an object gives out at different
// temperatures, an object warming until it emits as fast as it absorbs, and a simple model of the
// Earth's temperature with greenhouse gases and reflection by ice and cloud.

PK.header({
  title: 'Black body radiation',
  answers: true,
  specNote: 'AQA references are to GCSE Physics (8463), apart from those marked Chem, which are GCSE Chemistry (8462). Combined Science (8464) covers the Chemistry points, but not the Physics-only ones. KS3 references are to the National Curriculum programme of study.',
  spec: [
    { code: '4.6.3.1', text: 'All bodies emit and absorb infrared radiation. The hotter the body, the more infrared radiation it emits in a given time', po: true },
    { code: '4.6.3.2', text: 'A perfect black body absorbs all the radiation that falls on it, and is the best possible emitter', po: true },
    { code: '4.6.3.2', text: 'The intensity and wavelength distribution of the radiation a body emits depends on its temperature', po: true },
    { code: '4.6.3.2', text: 'A body at a constant temperature absorbs radiation at the same rate as it emits it. Its temperature rises when it absorbs radiation faster than it emits it', po: true },
    { code: '4.6.3.2', text: 'The temperature of the Earth depends on the rates of absorption and emission of radiation, and the reflection of radiation into space', po: true, ht: true },
    { code: 'Chem 4.9.2.1', text: 'Greenhouse gases (carbon dioxide, water vapour and methane) keep the Earth warm enough to support life by absorbing infrared radiation' },
    { code: 'Chem 4.9.2.2', text: 'Human activities that increase the amount of greenhouse gases in the atmosphere' },
    { code: 'KS3', text: 'The production of carbon dioxide by human activity and the impact on climate' },
  ],
});

const $ = (id) => document.getElementById(id);
const scene = $('scene'), ctx = scene.getContext('2d'), graph = $('graph'), g = graph.getContext('2d');
const SW = 560, GW = 560, GH = 340;
const SIZE = { spectrum: 300, balance: 300, greenhouse: 380 };
const SIGMA = 5.67e-8;
const fmt = (x, dp = 1) => String(parseFloat(x.toFixed(dp)));
const state = { tab: 'spectrum' };
const SH = () => SIZE[state.tab];

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), art: PK.cssVar('--art'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c2, c, text, x, y, col, align = 'center', size = 13, weight = 800) {
  c2.font = `${weight} ${size}px ${c.font}`; c2.textAlign = align; c2.textBaseline = 'middle';
  c2.lineWidth = 4; c2.lineJoin = 'round'; c2.strokeStyle = c.surface; c2.strokeText(text, x, y);
  c2.fillStyle = col; c2.fillText(text, x, y); c2.lineWidth = 1;
}
function thermometer(c, x, top, bottom, lo, hi, t, label) {
  const y = (v) => bottom - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (bottom - top);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = c.art; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x - 7, top - 8, 14, bottom - top + 12, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, bottom + 12, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x, bottom + 12, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 3, y(t), 6, bottom + 6 - y(t));
  tag(ctx, c, `${t.toFixed(1)} °C`, x, top - 22, c.text, 'center', 13);
  if (label) tag(ctx, c, label, x, bottom + 34, c.muted, 'center', 11, 700);
}

// =====================================================================
// Hotter objects: the black body spectrum
// =====================================================================

const H = 6.626e-34, C = 2.998e8, KB = 1.381e-23, WIEN = 2.898e6;   // WIEN in nm K
const planck = (lam, K) => (2 * H * C * C) / lam ** 5 / (Math.exp((H * C) / (lam * KB * K)) - 1);
const peakOf = (K) => planck((WIEN / K) * 1e-9, K);
const TOP_K = 6000 + 273, SUN_K = 5500 + 273;
const REFS = [3000, 4000, 5000, 6000];
const tempC = () => PK.num('tc');
// The colour of something glowing at this temperature (an approximation that is good enough to see)
function glow(K) {
  const t = K / 100;
  let r, gr, b;
  if (t <= 66) { r = 255; gr = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * (t - 60) ** -0.1332; gr = 288.12 * (t - 60) ** -0.0755; b = 255; }
  const cl = (v) => Math.round(Math.max(0, Math.min(255, v)));
  return `rgb(${cl(r)}, ${cl(gr)}, ${cl(b)})`;
}
const glowWords = (K) => (K < 3000 ? 'orange' : K < 4000 ? 'yellow' : K < 5500 ? 'yellow-white' : 'white');
const bandOf = (nm) => (nm < 380 ? 'ultraviolet' : nm <= 700 ? 'visible light' : 'infrared');

function drawSpectrumScene(c) {
  const K = tempC() + 273, col = glow(K);
  const gl = ctx.createRadialGradient(140, 150, 50, 140, 150, 140); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl; ctx.fillRect(0, 0, 290, 300);
  ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(140, 150, 72, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  tag(ctx, c, `${tempC()} °C`, 140, 150, '#3a2a00', 'center', 20);
  tag(ctx, c, `glows ${glowWords(K)}`, 140, 262, c.text, 'center', 14);
  // How much radiation it gives out each second, compared with the Sun's surface
  const rel = (K / SUN_K) ** 4, x = 360, top = 60, hgt = 180, full = (TOP_K / SUN_K) ** 4;
  ctx.fillStyle = c.surface2; ctx.fillRect(x, top, 60, hgt);
  ctx.fillStyle = '#ff9800'; ctx.fillRect(x, top + hgt * (1 - rel / full), 60, hgt * (rel / full));
  ctx.strokeStyle = c.art; ctx.lineWidth = 1.5; ctx.strokeRect(x, top, 60, hgt);
  const sunY = top + hgt * (1 - 1 / full);
  ctx.strokeStyle = '#e65100'; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(x - 6, sunY); ctx.lineTo(x + 66, sunY); ctx.stroke(); ctx.setLineDash([]);
  tag(ctx, c, 'the Sun', x + 70, sunY, '#e65100', 'left', 12, 700);
  tag(ctx, c, 'Radiation it gives out', x + 30, 22, c.text, 'center', 13);
  tag(ctx, c, 'every second', x + 30, 40, c.text, 'center', 13);
  tag(ctx, c, `${Math.round(rel * 100)}% of the Sun’s`, x + 30, 262, c.muted, 'center', 12, 700);
}
// The graph: grey curves at fixed temperatures to compare with, and the object's own curve on top
const SPEC = { L: 62, T: 34, B: 48, max: 3000 };
const specX = (nm) => SPEC.L + (nm / SPEC.max) * (GW - SPEC.L - 16);
const specNm = (x) => ((x - SPEC.L) / (GW - SPEC.L - 16)) * SPEC.max;
function drawSpectrumGraph(c) {
  const { L, T, B, max } = SPEC, pw = GW - L - 16, ph = GH - T - B, top = peakOf(TOP_K) * 1.08;
  const X = specX, Y = (v) => T + ph - (v / top) * ph;
  // The visible part of the spectrum
  const grad = g.createLinearGradient(X(380), 0, X(700), 0);
  ['#8b00ff', '#3f51ff', '#00b8ff', '#00c853', '#ffeb3b', '#ff9800', '#f44336'].forEach((col, i, a) => grad.addColorStop(i / (a.length - 1), col));
  g.globalAlpha = 0.2; g.fillStyle = grad; g.fillRect(X(380), T, X(700) - X(380), ph); g.globalAlpha = 1;
  g.strokeStyle = c.grid; g.lineWidth = 1;
  for (let nm = 0; nm <= max; nm += 500) { g.beginPath(); g.moveTo(X(nm), T); g.lineTo(X(nm), T + ph); g.stroke(); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.muted; g.font = `600 13px ${c.font}`; g.textAlign = 'center'; g.textBaseline = 'top';
  for (let nm = 0; nm <= max; nm += 500) g.fillText(String(nm), X(nm), T + ph + 5);
  g.fillStyle = c.text; g.font = `700 14px ${c.font}`; g.fillText('wavelength / nm', L + pw / 2, GH - 20);
  g.save(); g.translate(18, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('radiation given out', 0, 0); g.restore();
  tag(g, c, 'ultraviolet', X(190), 14, c.muted, 'center', 12, 700);
  tag(g, c, 'visible', X(540), 14, c.muted, 'center', 12, 700);
  tag(g, c, 'infrared →', X(1500), 14, c.muted, 'center', 12, 700);
  const curve = (K, col, w) => {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath();
    for (let nm = 30; nm <= max; nm += 10) { const v = planck(nm * 1e-9, K); if (nm === 30) g.moveTo(X(nm), Y(v)); else g.lineTo(X(nm), Y(v)); }
    g.stroke();
  };
  g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
  for (const k of REFS) curve(k + 273, '#b0bec5', 1.5);
  const K = tempC() + 273, lp = WIEN / K, pk = peakOf(K);
  g.fillStyle = 'rgba(229, 57, 53, .12)'; g.beginPath(); g.moveTo(X(30), Y(0));
  for (let nm = 30; nm <= max; nm += 10) g.lineTo(X(nm), Y(planck(nm * 1e-9, K)));
  g.lineTo(X(max), Y(0)); g.closePath(); g.fill();
  curve(K, '#e53935', 3.5);
  g.restore();
  // Label the grey curves, except one the red curve is sitting on
  for (const k of REFS) {
    const kk = k + 273, x = X(WIEN / kk), y = Y(peakOf(kk)) - 10;
    if (Math.abs(x - X(lp)) < 60 && Math.abs(y - Y(pk)) < 34) continue;
    tag(g, c, `${k} °C`, x, y, '#78909c', 'center', 11, 700);
  }
  // The peak
  g.strokeStyle = '#e53935'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(lp), T + ph); g.lineTo(X(lp), Y(pk)); g.stroke(); g.setLineDash([]);
  g.fillStyle = c.surface; g.strokeStyle = '#e53935'; g.lineWidth = 3; g.beginPath(); g.arc(X(lp), Y(pk), 7, 0, Math.PI * 2); g.fill(); g.stroke();
  tag(g, c, `${tempC()} °C: peak at ${Math.round(lp)} nm`, X(lp) + 12, Y(pk) - 14, '#c62828', 'left', 13);
  tag(g, c, '← Drag the red peak →', X(2250), T + ph * 0.3, c.muted, 'center', 12, 700);
  tag(g, c, 'to change the temperature', X(2250), T + ph * 0.3 + 17, c.muted, 'center', 12, 700);
}
function renderSpectrum() {
  const K = tempC() + 273, lp = WIEN / K, rel = (K / SUN_K) ** 4;
  $('info').innerHTML = `<p style="margin-top:0"><b>Hotter → more radiation every second.</b> At ${tempC()} °C it gives out ${Math.round(rel * 100)}% as much radiation each second as the Sun’s surface (shown by the bar).</p>
    <p><b>Hotter → the peak moves to shorter wavelengths.</b> Its peak is at ${Math.round(lp)} nm, in the ${bandOf(lp)}${lp > 700 ? ', so most of its radiation is infrared, and it glows ' + glowWords(K) : ', and it glows ' + glowWords(K)}.</p>
    <p class="note" style="margin-bottom:0">The grey curves are for objects at 3000, 4000, 5000 and 6000 °C, to compare with. Cooler objects, like you at 37 °C, give out almost all their radiation as infrared, with a peak far off the right of this graph, so they don’t glow.</p>`;
}

// =====================================================================
// Absorbing and emitting
// =====================================================================

const ROOM = 20, KEMIT = 1e-9, CAP = 1.75, LAMP = [0, 2.23, 4.93], TMAX = 120;
const bal = { lamp: 2, T: ROOM, t: 0, hist: [{ t: 0, T: ROOM }], light: [], ir: [], irIn: [], inAcc: 0, outAcc: 0, roomAcc: 0 };
// Everything emits infrared. The block emits more the hotter it is, and absorbs infrared from the room
// around it (which is at 20 °C) as well as light from the lamp.
const emitted = (T) => KEMIT * (T + 273) ** 4;
const fromRoom = KEMIT * (ROOM + 273) ** 4;
const takenIn = () => LAMP[bal.lamp] + fromRoom;
const BLOCK = { x: 160, y: 170, w: 150, h: 70 };
function stepBalance(dt) {
  if (bal.t < TMAX) {
    for (let i = 0; i < 4; i++) { const h = dt / 4; bal.T += ((takenIn() - emitted(bal.T)) / CAP) * h; }
    bal.t = Math.min(TMAX, bal.t + dt);
    if (bal.t - bal.hist[bal.hist.length - 1].t >= 0.5) bal.hist.push({ t: bal.t, T: bal.T });
  }
  // Pulses of light from the lamp, of infrared from the room, and of infrared from the block, in
  // proportion to the energy each second
  bal.inAcc += dt * LAMP[bal.lamp] * 2;
  while (bal.inAcc > 1) { bal.inAcc -= 1; const tx = BLOCK.x + 10 + Math.random() * (BLOCK.w - 20); bal.light.push({ x: 112, y: 70, tx, ty: BLOCK.y, s: 0 }); }
  bal.roomAcc += dt * fromRoom * 2;
  while (bal.roomAcc > 1) {
    bal.roomAcc -= 1;
    const a = Math.PI * (0.85 + Math.random() * 1.3), tx = BLOCK.x + BLOCK.w / 2 + Math.cos(a) * 70, ty = BLOCK.y + BLOCK.h / 2 + Math.sin(a) * 30;
    bal.irIn.push({ x: tx + Math.cos(a) * 90, y: ty + Math.sin(a) * 90, vx: -Math.cos(a) * 70, vy: -Math.sin(a) * 70, life: 0 });
  }
  bal.outAcc += dt * emitted(bal.T) * 2;
  while (bal.outAcc > 1) {
    bal.outAcc -= 1;
    const side = Math.floor(Math.random() * 3), a = side === 0 ? -Math.PI / 2 + (Math.random() - 0.5) : side === 1 ? (Math.random() - 0.5) * 0.8 : Math.PI + (Math.random() - 0.5) * 0.8;
    const x = side === 0 ? BLOCK.x + Math.random() * BLOCK.w : side === 1 ? BLOCK.x + BLOCK.w : BLOCK.x, y = side === 0 ? BLOCK.y : BLOCK.y + 10 + Math.random() * (BLOCK.h - 20);
    bal.ir.push({ x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 0 });
  }
  for (const p of bal.light) p.s = Math.min(1, p.s + dt * 1.6);
  bal.light = bal.light.filter((p) => p.s < 1);
  for (const p of [...bal.ir, ...bal.irIn]) { p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt; }
  bal.ir = bal.ir.filter((p) => p.life < 1.3);
  bal.irIn = bal.irIn.filter((p) => p.life < 1.2);
}
function drawBalanceScene(c) {
  const P = LAMP[bal.lamp], E = emitted(bal.T);
  // Lamp
  ctx.fillStyle = '#5b6470'; ctx.beginPath(); ctx.moveTo(70, 30); ctx.lineTo(150, 30); ctx.lineTo(130, 58); ctx.lineTo(90, 58); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P > 0 ? '#ffeb3b' : '#cfd8dc'; ctx.beginPath(); ctx.arc(110, 64, 12, 0, Math.PI * 2); ctx.fill();
  // Light pulses travelling to the block
  ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const p of bal.light) {
    const x = p.x + (p.tx - p.x) * p.s, y = p.y + (p.ty - p.y) * p.s, dx = (p.tx - p.x) * 0.07, dy = (p.ty - p.y) * 0.07;
    ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x, y); ctx.stroke();
  }
  // The block warms up: its colour shows it
  const warm = Math.max(0, Math.min(1, (bal.T - ROOM) / 45));
  ctx.fillStyle = `rgb(${Math.round(34 + 90 * warm)}, ${Math.round(34 + 10 * warm)}, ${Math.round(34)})`;
  ctx.fillRect(BLOCK.x, BLOCK.y, BLOCK.w, BLOCK.h);
  ctx.fillStyle = '#9e9e9e'; ctx.fillRect(BLOCK.x + 35, BLOCK.y + BLOCK.h, BLOCK.w - 70, 26);
  ctx.fillStyle = '#fff'; ctx.font = `800 17px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${bal.T.toFixed(1)} °C`, BLOCK.x + BLOCK.w / 2, BLOCK.y + BLOCK.h / 2);
  // Infrared as short wavy lines: pink coming in from the room, red going out from the block
  const wave = (list, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2.5;
    for (const p of list) {
      const n = Math.hypot(p.vx, p.vy), ux = p.vx / n, uy = p.vy / n;
      ctx.beginPath();
      for (let s = 0; s <= 16; s += 2) { const w = Math.sin(s / 2.2) * 3, x = p.x - ux * s - uy * w, y = p.y - uy * s + ux * w; if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
    }
  };
  wave(bal.irIn, '#f48fb1'); wave(bal.ir, '#e53935');
  ctx.lineCap = 'butt';
  tag(ctx, c, 'light in', 120, 130, '#e69500', 'right', 13);
  tag(ctx, c, 'infrared out', BLOCK.x + BLOCK.w + 14, BLOCK.y - 26, '#e53935', 'left', 13);
  tag(ctx, c, 'infrared in, from the room', BLOCK.x + BLOCK.w / 2, BLOCK.y + BLOCK.h + 44, '#d81b60', 'center', 12);
  // Energy in (from the lamp and the room) and out each second, side by side
  const bx = 430, base = 250, scale = 10, full = 16, bar = (x, parts, label) => {
    let y = base;
    for (const [v, col] of parts) { ctx.fillStyle = col; ctx.fillRect(x, y - v * scale, 34, v * scale); y -= v * scale; }
    ctx.strokeStyle = c.art; ctx.lineWidth = 1; ctx.strokeRect(x, base - full * scale, 34, full * scale);
    tag(ctx, c, label, x + 17, base + 14, c.text, 'center', 12);
    tag(ctx, c, `${((base - y) / scale).toFixed(1)} J/s`, x + 17, y - 12, c.text, 'center', 11, 700);
  };
  bar(bx, [[fromRoom, '#f48fb1'], [P, '#ffb300']], 'in'); bar(bx + 50, [[E, '#e53935']], 'out');
  tag(ctx, c, 'Energy each second', bx + 42, 66, c.text, 'center', 12);
  const d = takenIn() - E, word = Math.abs(d) < 0.05 ? '⏸ Steady temperature' : d > 0 ? '⬆ Warming up' : '⬇ Cooling down';
  tag(ctx, c, word, 14, 18, Math.abs(d) < 0.05 ? '#2e7d32' : d > 0 ? '#e65100' : '#1565c0', 'left', 16);
  tag(ctx, c, `Time: ${Math.floor(bal.t)} s`, 14, 286, c.muted, 'left', 12, 700);
}
function renderBalance() {
  const P = LAMP[bal.lamp], E = emitted(bal.T), d = takenIn() - E;
  const big = Math.abs(d) < 0.05 ? ['⏸', 'Steady temperature', 'It is absorbing energy as fast as it emits it, so its temperature stays the same.', 'good']
    : d > 0 ? ['⬆', 'Warming up', 'It is absorbing energy faster than it emits it, so its temperature goes up. As it gets hotter it emits more, until the two are equal.', 'bad']
      : ['⬇', 'Cooling down', 'It is emitting energy faster than it absorbs it, so its temperature goes down.', 'neutral'];
  $('info').innerHTML = `<p style="margin:0 0 8px;font-size:1.25rem;font-weight:800">${big[0]} ${big[1]}</p>
    <dl class="readout"><dt>Energy in each second</dt><dd>${takenIn().toFixed(1)} J</dd><dt>Energy out each second</dt><dd>${E.toFixed(1)} J</dd><dt>Temperature</dt><dd>${bal.T.toFixed(1)} °C</dd></dl>
    <p class="note" style="margin-bottom:0">${big[2]}${bal.t >= TMAX ? ' The graph is full: press Reset to start it again.' : ''}</p>
    <p class="note" style="margin-bottom:0">It never stops giving out infrared. It also absorbs infrared from the room around it${P > 0 ? ', as well as light from the lamp' : ''}. With the lamp off it cools until it is at room temperature, where it absorbs as much as it emits.</p>`;
}
function drawBalanceGraph(c) {
  const L = 62, T = 14, B = 48, pw = GW - L - 16, ph = GH - T - B, lo = 10, hi = 70;
  const X = (t) => L + (t / TMAX) * pw, Y = (v) => T + ph - ((v - lo) / (hi - lo)) * ph;
  g.strokeStyle = c.grid; g.lineWidth = 1; g.font = `600 13px ${c.font}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let v = lo; v <= hi; v += 10) { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(L + pw, Y(v)); g.stroke(); g.fillStyle = c.muted; g.fillText(String(v), L - 6, Y(v)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let t = 0; t <= TMAX; t += 20) { g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), T + ph); g.stroke(); g.fillStyle = c.muted; g.fillText(String(t), X(t), T + ph + 5); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 14px ${c.font}`; g.fillText('time / s', L + pw / 2, GH - 20);
  g.save(); g.translate(18, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('temperature / °C', 0, 0); g.restore();
  g.strokeStyle = '#e53935'; g.lineWidth = 3; g.beginPath();
  bal.hist.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(p.T)) : g.moveTo(X(p.t), Y(p.T))));
  g.lineTo(X(bal.t), Y(bal.T)); g.stroke();
}

// =====================================================================
// The greenhouse effect: energy flows drawn as arrows whose widths come from a simple model
// =====================================================================

const EPS = [0, 0.6, 0.78, 0.9], ALB = [0.25, 0.30, 0.35], SOLAR = 1361, CG = 20;
const gh = { ghg: 2, alb: 1, Ts: 0, flow: 0 };
const incoming = SOLAR / 4;
const absorbed = () => incoming * (1 - ALB[gh.alb]);
const surfaceIR = () => SIGMA * gh.Ts ** 4;
const backIR = () => (EPS[gh.ghg] * surfaceIR()) / 2;
const toSpace = () => surfaceIR() * (1 - EPS[gh.ghg] / 2);
const settled = () => (absorbed() / (SIGMA * (1 - EPS[gh.ghg] / 2))) ** 0.25;
gh.Ts = settled();
function stepGreenhouse(dt) {
  gh.Ts += ((absorbed() - toSpace()) / CG) * dt;
  gh.flow = (gh.flow + dt * 40) % 40;
}
const EARTH = { x: 300, y: 720, r: 450 };
const groundY = (x) => EARTH.y - Math.sqrt(EARTH.r ** 2 - (x - EARTH.x) ** 2);
// A thick arrow along a path of points, with stripes flowing along it
function flowArrow(pts, width, col, c) {
  if (width < 1) return;
  const last = pts[pts.length - 1], prev = pts[pts.length - 2], a = Math.atan2(last.y - prev.y, last.x - prev.x), head = Math.max(14, width * 1.1);
  const end = { x: last.x - Math.cos(a) * head * 0.8, y: last.y - Math.sin(a) * head * 0.8 };
  ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  ctx.strokeStyle = col; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1, -1)) ctx.lineTo(p.x, p.y);
  ctx.lineTo(end.x, end.y); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = Math.max(1, width * 0.35); ctx.setLineDash([8, 32]); ctx.lineDashOffset = -gh.flow;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1, -1)) ctx.lineTo(p.x, p.y); ctx.lineTo(end.x, end.y); ctx.stroke(); ctx.setLineDash([]);
  const hw = Math.max(width * 0.9, 10);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(last.x, last.y);
  ctx.lineTo(end.x - Math.sin(a) * hw - Math.cos(a) * 2, end.y + Math.cos(a) * hw - Math.sin(a) * 2);
  ctx.lineTo(end.x + Math.sin(a) * hw - Math.cos(a) * 2, end.y - Math.cos(a) * hw - Math.sin(a) * 2); ctx.closePath(); ctx.fill();
}
function label(c, text, x, y, align = 'left') {
  ctx.font = `700 12px ${c.font}`;
  const lines = text.split('\n'), w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14, h = lines.length * 15 + 8;
  const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  ctx.fillStyle = '#4a4f6a'; ctx.beginPath(); ctx.roundRect(left, y - h / 2, w, h, 4); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, left + 7, y - h / 2 + 11 + i * 15));
}
function drawGreenhouse(c) {
  const k = 0.1, eps = EPS[gh.ghg], E = EARTH, layerR = E.r + 52;
  const layerY = (x) => E.y - Math.sqrt(layerR ** 2 - (x - E.x) ** 2);
  // The atmosphere: a dotted band round the Earth
  ctx.fillStyle = '#d7ecf8'; ctx.beginPath(); ctx.arc(E.x, E.y, E.r + 95, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(80, 140, 190, .25)';
  for (let i = 0; i < 260; i++) { const a = Math.PI + (i / 260) * Math.PI, rr = E.r + 10 + ((i * 37) % 80); ctx.beginPath(); ctx.arc(E.x + Math.cos(a) * rr, E.y + Math.sin(a) * rr, 1.6, 0, Math.PI * 2); ctx.fill(); }
  // The layer of greenhouse gases: thicker with more gas
  if (eps > 0) {
    ctx.strokeStyle = 'rgba(120, 120, 130, .28)'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(E.x, E.y, layerR, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
    // Molecules of greenhouse gas (carbon dioxide drawn as O=C=O): more gas, more molecules
    const n = Math.round([0, 22, 38, 64][gh.ghg]);
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.03 + (0.94 * (i + 0.5)) / n), rr = layerR + (((i * 7) % 5) - 2) * 3.6, x = E.x + Math.cos(a) * rr, y = E.y + Math.sin(a) * rr, tilt = (i * 1.7) % Math.PI;
      ctx.fillStyle = '#e53935';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + Math.cos(tilt) * 4.2 * s, y + Math.sin(tilt) * 4.2 * s, 2.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  // The Earth: sea and land, with more ice the more sunlight it reflects
  ctx.save(); ctx.beginPath(); ctx.arc(E.x, E.y, E.r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#4aa3df'; ctx.fillRect(0, 0, SW, SH());
  ctx.fillStyle = '#5aa64a'; ctx.beginPath(); ctx.ellipse(170, 345, 62, 24, -0.25, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(450, 335, 55, 22, 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5f9fc'; [[60, 362], [520, 360], [300, 372]].slice(0, gh.alb + 1).forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 46, 14, 0, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
  // Clouds: more ice and cloud reflects more sunlight
  const cloud = (x, y) => {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(120, 144, 156, .6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x - 14, y + 2, 10, 0, Math.PI * 2); ctx.arc(x, y - 5, 13, 0, Math.PI * 2); ctx.arc(x + 15, y + 1, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 14, y + 2, 29, 10);
  };
  [[456, 270], [146, 262], [528, 300]].slice(0, gh.alb + 1).forEach(([x, y]) => cloud(x, y));
  // The Sun
  const sg = ctx.createRadialGradient(55, 55, 20, 55, 55, 70); sg.addColorStop(0, '#ffd54f'); sg.addColorStop(1, 'rgba(255, 213, 79, 0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, 130, 130); ctx.fillStyle = '#ffca28'; ctx.beginPath(); ctx.arc(55, 55, 30, 0, Math.PI * 2); ctx.fill();
  // Sunlight in, and some reflected straight back out to space
  const S = { x: 215, y: groundY(215) }, SUN = '#ffb74d', IR = '#e53935';
  flowArrow([{ x: 82, y: 82 }, S], incoming * k, SUN, c);
  flowArrow([{ x: S.x - 16, y: S.y - 12 }, { x: 18, y: 172 }], incoming * ALB[gh.alb] * k, '#ffcc80', c);
  // Infrared from the ground rises to the greenhouse gases and splits: some escapes, some is sent back down
  const up = surfaceIR() * k, out = toSpace() * k, back = backIR() * k, U = { x: 318, y: groundY(318) + 6 }, Ly = layerY(318);
  ctx.strokeStyle = IR; ctx.lineWidth = up; ctx.beginPath(); ctx.moveTo(U.x, U.y); ctx.lineTo(U.x, Ly); ctx.stroke();
  const ox = U.x - up / 2 + out / 2;
  flowArrow([{ x: ox, y: Ly + 1 }, { x: ox, y: 14 }], out, IR, c);
  if (back >= 1) {
    const bx = U.x + up / 2 - back / 2;
    flowArrow([{ x: bx, y: Ly - back / 2 }, { x: bx + 34, y: Ly - back / 2 - 4 }, { x: bx + 76, y: groundY(bx + 76) - 2 }], back, '#b71c1c', c);
  }
  // Labels, like a textbook diagram
  label(c, 'Sunlight', 140, 132);
  label(c, 'Some sunlight is\nreflected back into\nspace by ice and cloud', 8, 310);
  label(c, 'The warm ground\ngives out infrared', U.x - up / 2 - 10, 316, 'right');
  label(c, 'Some infrared\nescapes to space', U.x + 34, 40);
  label(c, eps > 0 ? 'Greenhouse gases\nsend some infrared\nback down' : 'No greenhouse\ngases: no infrared\nis sent back down', U.x + 60, 140);
  thermometer(c, 526, 74, 192, -30, 30, gh.Ts - 273, 'surface');
}
function renderGreenhouse() {
  const A = absorbed(), O = toSpace(), d = A - O, eq = settled() - 273;
  const status = Math.abs(d) < 0.5 ? '⏸ Steady: energy in equals energy out.'
    : d > 0 ? '⬆ Warming up: more energy is coming in than is escaping.' : '⬇ Cooling down: more energy is escaping than is coming in.';
  const gas = ['With no greenhouse gases, all the infrared escapes to space, so the Earth is very cold.',
    'Fewer greenhouse gases send less infrared back down, so the Earth is cooler.',
    'Today’s greenhouse gases send some infrared back down, which keeps the Earth warm enough for life.',
    'More greenhouse gases send more infrared back down, so the Earth gets warmer.'][gh.ghg];
  $('info').innerHTML = `<p style="margin:0 0 8px;font-weight:800">${status}</p>
    <dl class="readout"><dt>Surface temperature</dt><dd>${(gh.Ts - 273).toFixed(1)} °C</dd>${Math.abs(d) < 0.5 ? '' : `<dt>It will settle at</dt><dd>${PK.ans(`${eq.toFixed(0)} °C`)}</dd>`}</dl>
    <p style="margin-bottom:0">${gas}</p>
    <p class="note" style="margin-bottom:0">The wider the arrow, the more energy flows each second.</p>`;
}

// =====================================================================
// Panels, tabs and controls
// =====================================================================

const WHY = {
  spectrum: `<p><b>Everything gives out radiation.</b> All objects emit and absorb infrared radiation, whatever their temperature. The hotter an object, the more radiation it gives out each second.</p>
    <p><b>Hotter means shorter wavelengths.</b> As an object gets hotter, the peak of its curve moves to shorter wavelengths, towards visible light. That’s why a heated piece of metal glows red, then orange, then white.</p>
    <p><b>A perfect black body</b> absorbs all the radiation that falls on it, and is the best possible emitter. The curves here are for perfect black bodies.</p>`,
  balance: `<p><b>Everything emits and absorbs infrared, all the time.</b> The hotter an object is, the more it emits each second.</p>
    <p><b>Absorbing faster than emitting</b> makes an object’s temperature go up. As it gets hotter, it emits more, until it emits as fast as it absorbs. Then its temperature stays the same. A brighter lamp means it has to get hotter before that happens.</p>
    <p><b>Turn the lamp off</b> and it emits faster than it absorbs, so it cools down. Back at room temperature it still emits infrared, but it absorbs just as much from the room, so its temperature stops changing.</p>`,
  greenhouse: `<p><b>Sunlight in.</b> Sunlight has short wavelengths and passes through the atmosphere. Some is reflected straight back into space by ice and cloud. The rest is absorbed and warms the ground.</p>
    <p><b>Infrared out.</b> The warm ground gives out infrared radiation, which has longer wavelengths. Greenhouse gases, such as carbon dioxide, water vapour and methane, absorb some of it and send some back down, so less escapes to space.</p>
    <p><b>The balance.</b> The Earth warms up until the energy escaping to space equals the sunlight it absorbs. More greenhouse gases, or less ice and cloud, mean it settles at a higher temperature. Without any greenhouse gases it would be about −18 °C.</p>`,
};
const INTRO = {
  spectrum: 'Change the temperature of a glowing object, or drag the peak of its curve. See how much radiation it gives out, and at which wavelengths.',
  balance: 'A black block under a lamp absorbs light and gives out infrared. Watch it warm up until it gives out energy as fast as it takes it in.',
  greenhouse: 'Why the Earth is warm enough for life: sunlight comes in, infrared goes out, and greenhouse gases send some of it back down.',
};
function renderPanel() {
  if (state.tab === 'spectrum') renderSpectrum();
  if (state.tab === 'balance') renderBalance();
  if (state.tab === 'greenhouse') renderGreenhouse();
}
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = WHY[t];
  $('graph-panel').hidden = t === 'greenhouse';
  $('reset').hidden = t === 'spectrum';
  $('bar').hidden = t === 'spectrum';
  $('graph-title').textContent = t === 'spectrum' ? 'Radiation given out at each wavelength' : 'Temperature of the block';
  $('graph-note').textContent = t === 'spectrum' ? 'The red curve is the object. The grey curves are objects at 3000, 4000, 5000 and 6000 °C, to compare with.' : '';
  scene.setAttribute('aria-label', { spectrum: 'A glowing object and how much radiation it gives out', balance: 'A black block under a lamp, with bars for the energy in and out each second', greenhouse: 'Arrows showing sunlight and infrared radiation passing through the Earth’s atmosphere' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'spectrum' ? location.pathname + location.search : `#${t}`);
  size(); renderPanel();
}
const syncEgs = () => document.querySelectorAll('#egs .chip').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === tempC())));
$('tc').addEventListener('input', () => { syncEgs(); renderPanel(); });
document.querySelectorAll('#egs .chip').forEach((b) => b.addEventListener('click', () => { PK.setNum('tc', Number(b.dataset.v)); syncEgs(); renderPanel(); }));
PK.chips('lamp', (v) => { bal.lamp = v; renderPanel(); });
PK.chips('ghg', (v) => { gh.ghg = v; renderPanel(); });
PK.chips('albedo', (v) => { gh.alb = v; renderPanel(); });
$('reset').addEventListener('click', () => {
  if (state.tab === 'balance') { bal.T = ROOM; bal.t = 0; bal.hist = [{ t: 0, T: ROOM }]; bal.light = []; bal.ir = []; bal.irIn = []; }
  if (state.tab === 'greenhouse') { gh.ghg = 2; gh.alb = 1; gh.Ts = settled(); document.querySelectorAll('#ghg .chip').forEach((b, i) => b.setAttribute('aria-pressed', String(i === 2))); document.querySelectorAll('#albedo .chip').forEach((b, i) => b.setAttribute('aria-pressed', String(i === 1))); }
  renderPanel();
});
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
window.addEventListener('pk-answers', renderPanel);
// Drag the peak of the curve left or right to change the temperature (the peak's wavelength sets it)
PK.dragOn(graph, GW, GH, {
  hit: (p) => (state.tab === 'spectrum' && p.x > SPEC.L && p.y < GH - SPEC.B ? 'peak' : null),
  move: (h, p) => {
    const nm = Math.max(300, Math.min(1100, specNm(p.x))), t = Math.round((WIEN / nm - 273) / 50) * 50;
    PK.setNum('tc', Math.max(2500, Math.min(6000, t))); syncEgs(); renderPanel();
  },
});

function size() {
  const dpr = window.devicePixelRatio || 1;
  scene.style.aspectRatio = `${SW} / ${SH()}`;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (SH() / SW) * dpr);
  graph.width = Math.round(graph.clientWidth * dpr); graph.height = Math.round(graph.clientWidth * (GH / GW) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state.tab === 'balance') stepBalance(dt);
  if (state.tab === 'greenhouse') stepGreenhouse(dt);
  const c = colours();
  if (scene.clientWidth) {
    ctx.setTransform(scene.width / SW, 0, 0, scene.width / SW, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, SW, SH());
    ({ spectrum: drawSpectrumScene, balance: drawBalanceScene, greenhouse: drawGreenhouse })[state.tab](c);
  }
  if (state.tab !== 'greenhouse' && graph.clientWidth) {
    g.setTransform(graph.width / GW, 0, 0, graph.width / GW, 0, 0);
    g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
    if (state.tab === 'spectrum') drawSpectrumGraph(c); else drawBalanceGraph(c);
  }
  tick += dt;
  if (tick > 0.3 && state.tab !== 'spectrum') { tick = 0; renderPanel(); }
  requestAnimationFrame(frame);
}

showTab(['balance', 'greenhouse'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'spectrum');
requestAnimationFrame(frame);
