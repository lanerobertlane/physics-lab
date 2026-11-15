// Rates of reaction: collecting gas in a syringe (with the rate from a tangent, Higher), the
// disappearing cross, and particles colliding with a solid (collision theory).

PK.header({
  title: 'Rates of reaction',
  answers: true,
  specNote: 'AQA references are to GCSE Chemistry (8462); Combined Science (8464) covers the same content. KS3 references are to the National Curriculum programme of study.',
  spec: [
    { code: '4.6.1.1', text: 'The mean rate of a reaction = quantity of product formed (or reactant used) ÷ time taken, in cm³/s or g/s' },
    { code: '4.6.1.1', text: 'Draw and interpret graphs of the quantity of product formed against time: the steeper the line, the faster the reaction' },
    { code: '4.6.1.1', text: 'Draw a tangent to the curve and use its gradient as the rate at a particular time', ht: true },
    { code: '4.6.1.2', text: 'The effect of concentration, temperature, surface area and catalysts on the rate of a reaction' },
    { code: '4.6.1.2', text: 'Required practical: how concentration affects the rate, by measuring the volume of gas produced and by a change in turbidity (the disappearing cross)' },
    { code: '4.6.1.3', text: 'Collision theory: reactions happen when particles collide with enough energy (the activation energy). More frequent or more energetic collisions make the rate faster' },
    { code: '4.6.1.4', text: 'Catalysts change the rate of a reaction but are not used up. They provide a different pathway with a lower activation energy' },
    { code: 'KS3', text: 'What catalysts do' },
  ],
});

const $ = (id) => document.getElementById(id);
const scene = $('scene'), ctx = scene.getContext('2d'), graph = $('graph'), g = graph.getContext('2d');
const SW = 560, GW = 560;
const SIZE = { gas: { SH: 300, GH: 380 }, cross: { SH: 300, GH: 340 }, collide: { SH: 340, GH: 340 } };
const fmt = (x, dp = 1) => String(parseFloat(x.toFixed(dp)));
const f1 = (x) => x.toFixed(1);
const RUN_COLOURS = ['#1e88e5', '#e53935', '#2e9e4f', '#f57c00'];
const TRI = '#f57c00';
const real = () => PK.cssVar('--resultant');

const state = { tab: 'gas', warp: 1 };
const SH = () => SIZE[state.tab].SH;
const GH = () => SIZE[state.tab].GH;

// ---------- Helpers ----------

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), art: PK.cssVar('--art'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c2, c, text, x, y, col, align = 'center', size = 13, weight = 800) {
  c2.font = `${weight} ${size}px ${c.font}`; c2.textAlign = align; c2.textBaseline = 'middle';
  c2.lineWidth = 4; c2.lineJoin = 'round'; c2.strokeStyle = c.surface; c2.strokeText(text, x, y);
  c2.fillStyle = col; c2.fillText(text, x, y); c2.lineWidth = 1;
}
// The tightest round-numbered axis that fits
function axis(max, ticks) {
  for (let e = -4; e < 7; e++) {
    for (const k of [1, 2, 5]) {
      const st = k * 10 ** e, n = Math.ceil(max / st - 1e-9);
      if (n <= ticks) return { step: st, n, top: n * st };
    }
  }
  return { step: max, n: 1, top: max };
}
function plotArea() {
  const h = GH(), L = 62, Rm = 16, Tm = 14, B = 48;
  return { L, R: Rm, T: Tm, B, pw: GW - L - Rm, ph: h - Tm - B };
}
// Axes with a grid. minor: five small squares to each big one, for reading tangents.
function axes(c, xA, yA, xLabel, yLabel, minor, dp = 2) {
  const { L, T: Tm, pw, ph } = plotArea(), h = GH();
  const X = (x) => L + (x / xA.top) * pw, Y = (y) => Tm + ph - (y / yA.top) * ph;
  if (minor) {
    g.strokeStyle = c.grid; g.globalAlpha = 0.55; g.lineWidth = 1;
    for (let i = 0; i <= xA.n * 5; i++) { const x = (i * xA.step) / 5; g.beginPath(); g.moveTo(X(x), Tm); g.lineTo(X(x), Tm + ph); g.stroke(); }
    for (let i = 0; i <= yA.n * 5; i++) { const y = (i * yA.step) / 5; g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(L + pw, Y(y)); g.stroke(); }
    g.globalAlpha = 1;
  }
  g.lineWidth = minor ? 1.4 : 1; g.font = `600 13px ${c.font}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= yA.n; i++) { const y = i * yA.step; g.strokeStyle = minor ? c.art : c.grid; g.globalAlpha = minor ? 0.45 : 1; g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(L + pw, Y(y)); g.stroke(); g.globalAlpha = 1; g.fillStyle = c.muted; g.fillText(fmt(y, dp), L - 6, Y(y)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let i = 0; i <= xA.n; i++) { const x = i * xA.step; g.strokeStyle = minor ? c.art : c.grid; g.globalAlpha = minor ? 0.45 : 1; g.beginPath(); g.moveTo(X(x), Tm); g.lineTo(X(x), Tm + ph); g.stroke(); g.globalAlpha = 1; g.fillStyle = c.muted; g.fillText(fmt(x, 2), X(x), Tm + ph + 5); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, Tm); g.lineTo(L, Tm + ph); g.lineTo(L + pw, Tm + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 14px ${c.font}`;
  g.fillText(xLabel, L + pw / 2, h - 20);
  g.save(); g.translate(16, Tm + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText(yLabel, 0, 0); g.restore();
  return { X, Y };
}

// =====================================================================
// Gas collected
// =====================================================================

const REACT = {
  mg: { gas: 'hydrogen', vmax: 50, tmax: 180, solid: 'magnesium' },
  h2o2: { gas: 'oxygen', vmax: 60, tmax: 300, solid: 'hydrogen peroxide' },
};
const gas = { reaction: 'mg', conc: 1, powder: false, cat: false, T: 20, running: false, t: 0, runs: [], next: 0, tp: 30, m: 0, checked: false, bubbles: [], spawn: 0, dirty: false };
const R = () => REACT[gas.reaction];
const tempFactor = (T) => 2 ** ((T - 20) / 10);   // about twice as fast for every 10 °C
function newRun() {
  const r = R(), k = gas.reaction === 'mg'
    ? 0.035 * gas.conc * tempFactor(gas.T) * (gas.powder ? 3 : 1)
    : (gas.cat ? 0.045 : 0.0012) * tempFactor(gas.T);
  const label = gas.reaction === 'mg'
    ? `${fmt(gas.conc)} mol/dm³, ${gas.powder ? 'powder' : 'ribbon'}, ${gas.T} °C`
    : `${gas.cat ? 'with a catalyst' : 'no catalyst'}, ${gas.T} °C`;
  return { k, vmax: r.vmax, label, colour: RUN_COLOURS[gas.next++ % RUN_COLOURS.length], tEnd: 0, reaction: gas.reaction, powder: gas.powder, cat: gas.cat };
}
const vol = (run, t) => run.vmax * (1 - Math.exp(-run.k * t));
const slope = (run, t) => run.vmax * run.k * Math.exp(-run.k * t);
const current = () => gas.runs[gas.runs.length - 1];

function gasGo() {
  if (gas.running) { gas.running = false; $('go').textContent = '▶ Carry on'; return; }
  const run = current();
  // A new run if anything has changed since the last one, or it has finished
  if (!run || gas.dirty || gas.t >= R().tmax || run.reaction !== gas.reaction) {
    gas.dirty = false;
    gas.runs.push(newRun());
    if (gas.runs.length > 4) gas.runs.shift();
    gas.t = 0; gas.checked = false; gas.bubbles = [];
  }
  gas.running = true;
  $('go').textContent = '⏸ Pause';
  renderPanel();
}
function gasStep(dt) {
  const run = current();
  if (!gas.running || !run) return;
  gas.t = Math.min(R().tmax, gas.t + dt * state.warp);
  run.tEnd = gas.t;
  if (gas.t >= R().tmax) { gas.running = false; $('go').textContent = '▶ Start'; renderPanel(); }
  // Bubbles, as many as the gas being made
  gas.spawn += slope(run, gas.t) * dt * state.warp * 3;
  while (gas.spawn > 1) { gas.spawn -= 1; if (gas.bubbles.length < 60) gas.bubbles.push({ x: 120 + Math.random() * 60, y: 258, r: 1.5 + Math.random() * 2 }); }
}
function moveBubbles(dt) {
  for (const b of gas.bubbles) b.y -= 70 * dt;
  gas.bubbles = gas.bubbles.filter((b) => b.y > 196);
}

function drawGas(c) {
  const run = current(), active = run && run.reaction === gas.reaction, t = active ? gas.t : 0;
  const V = active ? vol(run, t) : 0, left = active ? 1 - V / run.vmax : 1;
  // Bench
  ctx.fillStyle = c.surface2; ctx.fillRect(0, 270, SW, 30);
  ctx.strokeStyle = c.art; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 270); ctx.lineTo(SW, 270); ctx.stroke();
  // The conical flask and what's in it
  const flask = () => { ctx.beginPath(); ctx.moveTo(88, 268); ctx.lineTo(212, 268); ctx.lineTo(166, 150); ctx.lineTo(166, 112); ctx.lineTo(134, 112); ctx.lineTo(134, 150); ctx.closePath(); };
  ctx.save(); flask(); ctx.clip();
  ctx.fillStyle = gas.reaction === 'mg' ? 'rgba(160, 205, 240, .55)' : 'rgba(190, 220, 245, .55)';
  ctx.fillRect(80, 200, 140, 70);
  ctx.restore();
  if (gas.reaction === 'mg') {
    if (gas.powder) {
      ctx.fillStyle = '#8a929c';
      const n = Math.round(60 * left);
      for (let i = 0; i < n; i++) { const a = (i * 137.5) % 360, r = (i % 9) * 5; ctx.beginPath(); ctx.arc(150 + Math.cos(a) * r * 1.6, 262 - Math.abs(Math.sin(a)) * 4, 1.8, 0, Math.PI * 2); ctx.fill(); }
    } else if (left > 0.01) {
      ctx.fillStyle = '#9aa3ad'; ctx.strokeStyle = '#5f6770'; ctx.lineWidth = 1;
      const w = 60 * Math.sqrt(left);
      ctx.beginPath(); ctx.roundRect(150 - w / 2, 255, w, 6, 2); ctx.fill(); ctx.stroke();
    }
  } else if (gas.cat) {
    ctx.fillStyle = '#2b2b2b';
    for (let i = 0; i < 40; i++) { const a = (i * 137.5) % 360, r = (i % 8) * 5; ctx.beginPath(); ctx.arc(150 + Math.cos(a) * r * 1.5, 263 - Math.abs(Math.sin(a)) * 3, 1.6, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.strokeStyle = 'rgba(80,120,160,.7)';
  for (const b of gas.bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  flask(); ctx.strokeStyle = c.art; ctx.lineWidth = 2.5; ctx.stroke();
  // Bung and delivery tube
  ctx.fillStyle = '#5d4037'; ctx.fillRect(128, 100, 44, 16);
  ctx.strokeStyle = c.art; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(150, 100); ctx.lineTo(150, 70); ctx.lineTo(300, 70); ctx.stroke();
  // The gas syringe: 0 to 100 cm³, 2 px for each cm³
  const x0 = 320, k = 2;
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(300, 55, 240, 30);
  ctx.fillStyle = 'rgba(160, 205, 240, .5)'; ctx.fillRect(x0, 57, V * k, 26);
  ctx.strokeStyle = c.art; ctx.lineWidth = 2; ctx.strokeRect(300, 55, 240, 30);
  ctx.fillStyle = '#5f6770'; ctx.fillRect(x0 + V * k - 3, 55, 6, 30);
  ctx.fillRect(x0 + V * k, 66, Math.max(0, 548 - x0 - V * k + 30), 8);
  ctx.strokeStyle = c.text; ctx.lineWidth = 1;
  for (let v = 0; v <= 100; v += 5) {
    const x = x0 + v * k, long = v % 10 === 0;
    ctx.beginPath(); ctx.moveTo(x, 55); ctx.lineTo(x, 55 + (long ? 9 : 5)); ctx.stroke();
    if (v % 20 === 0) tag(ctx, c, String(v), x, 44, c.text, 'center', 12, 700);
  }
  tag(ctx, c, 'gas syringe (cm³)', 430, 102, c.muted, 'center', 12, 700);
  // Stopwatch and conditions
  tag(ctx, c, `Time: ${Math.floor(t)} s`, 12, 18, c.text, 'left', 16);
  tag(ctx, c, `${gas.T} °C`, 228, 238, c.muted, 'left', 12, 700);
  if (active) tag(ctx, c, `${Math.round(V)} cm³ of ${R().gas}`, 430, 128, run.colour, 'center', 14);
  else tag(ctx, c, `Press Start to add the ${gas.reaction === 'mg' ? 'magnesium' : (gas.cat ? 'catalyst' : 'hydrogen peroxide')}`, 380, 160, c.muted, 'center', 13, 700);
}

// The rate at an instant (Higher): a dot on the latest curve and a straight edge you turn
function tangentGeom() {
  const r = R(), xA = axis(r.tmax, 10), yA = { step: 10, n: 10, top: 100 }, { L, T: Tm, pw, ph } = plotArea();
  const X = (t) => L + (t / xA.top) * pw, Y = (v) => Tm + ph - (v / yA.top) * ph;
  const pxT = pw / xA.top, pxV = ph / yA.top, run = current();
  const P = run ? { t: gas.tp, v: vol(run, gas.tp) } : null;
  let H = null;
  if (P) {
    const ang = Math.atan2(gas.m * pxV, pxT), side = X(P.t) + Math.cos(ang) * 120 > L + pw - 4 ? -1 : 1;
    H = { x: X(P.t) + side * Math.cos(ang) * 120, y: Y(P.v) - side * Math.sin(ang) * 120 };
  }
  return { r, xA, yA, X, Y, pxT, pxV, P, H, L, Tm, pw, ph, run };
}
// The biggest gradient triangle that fits on the graph, in steps of 5 s
function triangle(geo) {
  const { P, xA, yA } = geo, m = gas.m, lineAt = (t) => P.v + m * (t - P.t);
  const fits = (t) => t >= -1e-9 && t <= xA.top + 1e-9 && lineAt(t) >= -1e-9 && lineAt(t) <= yA.top + 1e-9;
  let a = 0, b = 0;
  for (let h = 5; h <= xA.top; h += 5) { if (fits(P.t - h)) a = h; else break; }
  for (let h = 5; h <= xA.top; h += 5) { if (fits(P.t + h)) b = h; else break; }
  const most = Math.min(Math.max(a, b), 3 * xA.step);
  if (a >= most && b >= most) { a = most; b = most; } else { a = Math.min(a, most * 2); b = Math.min(b, most * 2); }
  if (a + b <= 0) return null;
  const t1 = P.t - a, t2 = P.t + b;
  return { t1, t2, v1: lineAt(t1), v2: lineAt(t2) };
}
const reached = () => current() && current().reaction === gas.reaction && gas.t >= gas.tp;

function drawGasGraph(c) {
  const geo = tangentGeom(), { xA, yA, X, Y, P, H, L, Tm, pw, ph } = geo;
  axes(c, xA, yA, 'time / s', `volume of ${R().gas} / cm³`, true, 0);
  g.lineJoin = 'round';
  for (const run of gas.runs) {
    if (run.reaction !== gas.reaction) continue;
    const end = run === current() ? gas.t : run.tEnd, N = 200;
    g.strokeStyle = run.colour; g.lineWidth = run === current() ? 3 : 2.2; g.globalAlpha = run === current() ? 1 : 0.75;
    g.beginPath();
    for (let i = 0; i <= N; i++) { const t = (end * i) / N; if (i) g.lineTo(X(t), Y(vol(run, t))); else g.moveTo(X(t), Y(vol(run, t))); }
    g.stroke(); g.globalAlpha = 1;
  }
  if (!P || !reached()) return;
  g.save(); g.beginPath(); g.rect(L, Tm, pw, ph); g.clip();
  if (gas.checked) {
    const s = slope(geo.run, P.t);
    g.strokeStyle = real(); g.lineWidth = 2.5; g.setLineDash([8, 6]);
    g.beginPath(); g.moveTo(X(P.t - 400), Y(P.v - s * 400)); g.lineTo(X(P.t + 400), Y(P.v + s * 400)); g.stroke(); g.setLineDash([]);
  }
  g.strokeStyle = c.text; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(X(P.t - 400), Y(P.v - gas.m * 400)); g.lineTo(X(P.t + 400), Y(P.v + gas.m * 400)); g.stroke();
  const tri = triangle(geo);
  if (tri) {
    g.strokeStyle = TRI; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(X(tri.t1), Y(tri.v1)); g.lineTo(X(tri.t2), Y(tri.v1)); g.lineTo(X(tri.t2), Y(tri.v2)); g.stroke();
  }
  g.restore();
  if (tri) {
    let below = tri.v2 >= tri.v1;
    if (below && Y(tri.v1) + 14 > Tm + ph - 6) below = false;
    tag(g, c, `${fmt(tri.t2 - tri.t1, 0)} s`, (X(tri.t1) + X(tri.t2)) / 2, Y(tri.v1) + (below ? 14 : -14), TRI, 'center', 13);
    const right = X(tri.t2) + 70 < L + pw;
    if (Math.abs(Y(tri.v2) - Y(tri.v1)) > 14) tag(g, c, `${f1(Math.abs(tri.v2 - tri.v1))} cm³`, X(tri.t2) + (right ? 6 : -6), (Y(tri.v1) + Y(tri.v2)) / 2, TRI, right ? 'left' : 'right', 13);
  }
  g.fillStyle = c.text; g.beginPath(); g.arc(X(P.t), Y(P.v), 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = c.surface; g.strokeStyle = c.text; g.lineWidth = 3; g.beginPath(); g.arc(H.x, H.y, 9, 0, Math.PI * 2); g.fill(); g.stroke();
  tag(g, c, 'Higher: drag the dot along the curve, and the white circle to turn the line into a tangent', L + 8, Tm + 14, c.muted, 'left', 11, 700);
}

function renderReadings() {
  const run = current();
  if (!run || run.reaction !== gas.reaction) { $('readings').innerHTML = '<p class="note" style="margin:0">Press Start. A reading is taken every 10 s.</p>'; return; }
  const every = R().tmax > 200 ? 20 : 10, rows = [];
  for (let t = 0; t <= gas.t + 1e-9; t += every) rows.push([t, Math.round(vol(run, t))]);
  const body = rows.map(([t, v]) => `<tr><td>${t}</td><td>${v}</td></tr>`).join('');
  $('readings').innerHTML = `<p class="note" style="margin-top:0;color:${run.colour};font-weight:800">${run.label}</p>
    <table class="results"><thead><tr><th>Time (s)</th><th>Volume of gas (cm³)</th></tr></thead><tbody>${body}</tbody></table>`;
}

function renderRate() {
  const geo = tangentGeom(), run = geo.run;
  $('check').parentElement.hidden = !reached();
  if (!reached()) { $('rate').innerHTML = `<p class="note" style="margin:0">Start a run. Once it gets to ${gas.tp} s you can work out the rate.</p>`; $('checked').innerHTML = ''; return; }
  const v = vol(run, gas.tp), tri = triangle(geo), mine = tri ? (tri.v2 - tri.v1) / (tri.t2 - tri.t1) : gas.m;
  $('rate').innerHTML = `<div class="working">
      <p><b>Mean rate</b> over the first ${gas.tp} s = volume ÷ time</p>
      <p>= ${Math.round(v)} ÷ ${gas.tp} = <b>${PK.ans(`${PK.sig(Math.round(v) / gas.tp, 2)} cm³/s`)}</b></p>
    </div>
    ${tri ? `<div class="working">
      <p><b>Higher: rate at ${gas.tp} s</b> = gradient of your tangent</p>
      <p>= ${f1(tri.v2 - tri.v1)} ÷ ${fmt(tri.t2 - tri.t1, 0)} = <b>${PK.sig(mine, 2)} cm³/s</b></p>
    </div>` : ''}`;
  $('check').textContent = gas.checked ? 'Hide the real tangent' : 'Check my tangent';
  if (!gas.checked) { $('checked').innerHTML = ''; return; }
  const realRate = slope(run, gas.tp), diff = Math.abs(mine - realRate), pc = (diff / realRate) * 100;
  const good = pc <= 8 || diff < 0.03, close = pc <= 20;
  $('checked').innerHTML = `<dl class="readout" style="margin-top:12px"><dt>Real rate at ${gas.tp} s</dt><dd style="color:var(--resultant)">${PK.sig(realRate, 2)} cm³/s</dd><dt>Your tangent</dt><dd>${PK.sig(mine, 2)} cm³/s</dd></dl>
    <p class="note" style="margin-bottom:0">${good ? '<span class="badge good">Good tangent</span> That’s close to the real rate.' : `${close ? '<span class="badge neutral">Close</span>' : '<span class="badge bad">Not quite</span>'} The dashed line is the real tangent: it just touches the curve at the dot. Turn your line to match it.`}</p>`;
}

function renderGasKey() {
  $('key').innerHTML = gas.runs.filter((r) => r.reaction === gas.reaction).map((r) => `<span style="--c:${r.colour}">${r.label}</span>`).join('');
}

// =====================================================================
// The disappearing cross
// =====================================================================

const cross = { thio: 50, T: 20, running: false, t: 0, tStar: 0, results: [], auto: false };
const concOf = (thio) => (40 * thio) / 50;   // g/dm³, from 40 g/dm³ made up to 50 cm³ with water
const TEMPS = [20, 30, 40, 50], TCOL = ['#1e88e5', '#2e9e4f', '#f57c00', '#e53935'];
function crossGo() {
  if (cross.running) return;
  const c = concOf(cross.thio);
  cross.tStar = (600 / c) / tempFactor(cross.T) * (1 + (Math.random() - 0.5) * 0.08);
  cross.t = 0; cross.running = true; cross.auto = false;
  $('stop').hidden = false; $('go').disabled = true;
}
function crossStop(auto = false) {
  if (!cross.running) return;
  cross.running = false; cross.auto = auto;
  cross.results.push({ thio: cross.thio, T: cross.T, time: Math.round(cross.t * 10) / 10, auto });
  $('stop').hidden = true; $('go').disabled = false;
  renderPanel();
}
function crossStep(dt) {
  if (!cross.running) return;
  cross.t += dt * state.warp;
  if (cross.t > cross.tStar * 1.6) crossStop(true);
}
function drawCross(c) {
  const k = cross.running || cross.results.length ? Math.min(1, cross.t / Math.max(cross.tStar, 1e-6)) : 0;
  const cloud = cross.running || cross.t > 0 ? 0.93 * k ** 1.2 : 0;
  // Looking down through the flask at a cross on paper
  ctx.fillStyle = '#fbfaf6'; ctx.fillRect(40, 30, 250, 250);
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.strokeRect(40, 30, 250, 250);
  ctx.globalAlpha = Math.max(0, 1 - k ** 1.6);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(110, 100); ctx.lineTo(220, 210); ctx.moveTo(220, 100); ctx.lineTo(110, 210); ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineCap = 'butt';
  ctx.fillStyle = 'rgba(200, 225, 245, .25)'; ctx.beginPath(); ctx.arc(165, 155, 108, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(242, 236, 200, ${cloud})`; ctx.beginPath(); ctx.arc(165, 155, 108, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = c.art; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(165, 155, 108, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(165, 155, 30, 0, Math.PI * 2); ctx.stroke();
  tag(ctx, c, 'looking down through the flask', 165, 18, c.muted, 'center', 12, 700);
  // Clock and what's in the flask
  tag(ctx, c, `Time: ${f1(cross.t)} s`, 320, 60, c.text, 'left', 20);
  tag(ctx, c, `${cross.thio} cm³ sodium thiosulfate`, 320, 100, c.text, 'left', 13, 700);
  tag(ctx, c, `+ ${50 - cross.thio} cm³ water`, 320, 120, c.text, 'left', 13, 700);
  tag(ctx, c, '+ 10 cm³ hydrochloric acid', 320, 140, c.text, 'left', 13, 700);
  tag(ctx, c, `${cross.T} °C`, 320, 160, c.muted, 'left', 13, 700);
  const msg = cross.running ? ['Press “The cross has gone!”', 'when you can’t see it']
    : cross.results.length ? (cross.auto ? ['Stopped automatically:', 'the cross had long gone'] : ['Recorded. Change the mixture', 'and go again'])
      : ['Press Start to add the acid', 'and start the clock'];
  msg.forEach((m, i) => tag(ctx, c, m, 320, 204 + i * 18, c.muted, 'left', 12, 700));
}
function drawCrossGraph(c) {
  const pts = cross.results.map((r) => ({ x: concOf(r.thio), y: 1 / r.time, T: r.T }));
  const yA = axis(Math.max(0.04, ...pts.map((p) => p.y)) * 1.1, 8), xA = { step: 5, n: 8, top: 40 };
  const { X, Y } = axes(c, xA, yA, 'concentration of sodium thiosulfate / g/dm³', 'rate = 1 ÷ time / 1/s', false, 3);
  if (!PK.answersShown()) { tag(g, c, 'Work out 1 ÷ time for each result to plot the graph', X(20), Y(yA.top * 0.6), c.muted, 'center', 13, 700); return; }
  TEMPS.forEach((T, i) => {
    const set = pts.filter((p) => p.T === T);
    if (!set.length) return;
    // Line of best fit through the origin, once there are two results
    if (set.length >= 2) {
      const m = set.reduce((a, p) => a + p.x * p.y, 0) / set.reduce((a, p) => a + p.x * p.x, 0);
      g.strokeStyle = TCOL[i]; g.lineWidth = 2; g.setLineDash([6, 5]);
      g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(40), Y(Math.min(yA.top, m * 40))); g.stroke(); g.setLineDash([]);
    }
    g.fillStyle = TCOL[i];
    for (const p of set) { g.beginPath(); g.arc(X(p.x), Y(p.y), 5, 0, Math.PI * 2); g.fill(); }
  });
}
function renderCross() {
  $('mix').textContent = `${cross.thio} cm³ of sodium thiosulfate + ${50 - cross.thio} cm³ of water, so the concentration is ${fmt(concOf(cross.thio))} g/dm³.`;
  $('key').innerHTML = PK.answersShown() ? TEMPS.map((T, i) => (cross.results.some((r) => r.T === T) ? `<span style="--c:${TCOL[i]}">${T} °C</span>` : '')).join('') : '';
  if (!cross.results.length) { $('cross-results').innerHTML = '<p class="note" style="margin:0">Your results go here.</p>'; return; }
  $('cross-results').innerHTML = `<table class="results"><thead><tr><th>Thiosulfate (cm³)</th><th>Concentration (g/dm³)</th><th>°C</th><th>Time (s)</th><th>Rate = 1 ÷ time (1/s)</th></tr></thead><tbody>
    ${cross.results.map((r) => `<tr><td>${r.thio}</td><td>${fmt(concOf(r.thio))}</td><td>${r.T}</td><td>${f1(r.time)}</td><td>${PK.ans(PK.sig(1 / r.time, 2))}</td></tr>`).join('')}
  </tbody></table>`;
}

// =====================================================================
// Collisions
// =====================================================================

const CELL = 14, FLOOR = 318, BOX = { left: 10, right: 550, top: 36 }, SIGMA = 130, WINDOW = 8;
const col = { n: 40, temp: 1, pieces: 1, cat: false, parts: [], cells: [], events: [], hits: [], flashes: [] };
function speedSample() { let u = 0; while (!u) u = Math.random(); return Math.max(15, SIGMA * col.temp * Math.sqrt(-2 * Math.log(u))); }
function newParticle(top = false) {
  const s = speedSample(), a = Math.random() * Math.PI * 2;
  return { x: BOX.left + 10 + Math.random() * (BOX.right - BOX.left - 20), y: top ? BOX.top + 8 : BOX.top + 10 + Math.random() * 180, vx: Math.cos(a) * s, vy: Math.sin(a) * s, s, cool: 0 };
}
const threshold = () => SIGMA * (col.cat ? 1.6 : 2.0);   // the activation energy, as a speed
function buildSolid() {
  // 48 cells, as one lump, four pieces, or twelve little bits of powder
  const shapes = { 1: [[8, 6, 1]], 4: [[4, 3, 4]], 12: [[2, 2, 12]] }[col.pieces];
  const [w, h, count] = shapes[0], gap = (BOX.right - BOX.left - count * w * CELL) / (count + 1);
  col.cells = [];
  for (let p = 0; p < count; p++) {
    const x0 = BOX.left + gap * (p + 1) + p * w * CELL;
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) col.cells.push({ x: x0 + i * CELL, y: FLOOR - (j + 1) * CELL, alive: true });
  }
  col.events = []; col.hits = [];
}
function setParticles() {
  while (col.parts.length < col.n) col.parts.push(newParticle());
  col.parts.length = col.n;
}
function collideStep(dt) {
  const now = performance.now() / 1000, v0 = threshold();
  for (const p of col.parts) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.cool = Math.max(0, p.cool - dt);
    // Walls: bounce, and pick up a new speed from the surroundings
    let wall = false;
    if (p.x < BOX.left + 4) { p.x = BOX.left + 4; p.vx = Math.abs(p.vx); wall = true; }
    if (p.x > BOX.right - 4) { p.x = BOX.right - 4; p.vx = -Math.abs(p.vx); wall = true; }
    if (p.y < BOX.top + 4) { p.y = BOX.top + 4; p.vy = Math.abs(p.vy); wall = true; }
    if (p.y > FLOOR - 4) { p.y = FLOOR - 4; p.vy = -Math.abs(p.vy); wall = true; }
    if (wall) { const s = speedSample(), k = s / Math.hypot(p.vx, p.vy); p.vx *= k; p.vy *= k; p.s = s; }
    // Hitting the solid
    for (const cell of col.cells) {
      if (!cell.alive) continue;
      const nx = Math.max(cell.x, Math.min(p.x, cell.x + CELL)), ny = Math.max(cell.y, Math.min(p.y, cell.y + CELL));
      if (Math.hypot(p.x - nx, p.y - ny) > 4) continue;
      if (p.cool === 0) {
        col.hits.push(now);
        if (p.s >= v0) {
          cell.alive = false; col.events.push(now);
          col.flashes.push({ x: cell.x + CELL / 2, y: cell.y + CELL / 2, life: 0.6 });
          Object.assign(p, newParticle(true));
          break;
        }
        p.cool = 0.15;
      }
      // Bounce off the side it hit
      const dx = p.x - (cell.x + CELL / 2), dy = p.y - (cell.y + CELL / 2);
      if (Math.abs(dx) > Math.abs(dy)) { p.vx = Math.sign(dx) * Math.abs(p.vx); p.x = dx > 0 ? cell.x + CELL + 4 : cell.x - 4; }
      else { p.vy = Math.sign(dy) * Math.abs(p.vy); p.y = dy > 0 ? cell.y + CELL + 4 : cell.y - 4; }
      break;
    }
  }
  for (const f of col.flashes) f.life -= dt;
  col.flashes = col.flashes.filter((f) => f.life > 0);
  col.hits = col.hits.filter((t) => now - t < WINDOW); col.events = col.events.filter((t) => now - t < WINDOW);
}
function drawCollide(c) {
  const v0 = threshold();
  ctx.fillStyle = 'rgba(160, 205, 240, .25)'; ctx.fillRect(BOX.left, BOX.top, BOX.right - BOX.left, FLOOR - BOX.top);
  ctx.strokeStyle = c.art; ctx.lineWidth = 2; ctx.strokeRect(BOX.left, BOX.top, BOX.right - BOX.left, FLOOR - BOX.top);
  if (col.cat) {
    ctx.fillStyle = '#5b6470';
    for (let x = BOX.left + 20; x < BOX.right; x += 46) { ctx.beginPath(); ctx.arc(x, FLOOR - 3, 3, 0, Math.PI * 2); ctx.fill(); }
  }
  for (const cell of col.cells) {
    if (!cell.alive) continue;
    ctx.fillStyle = '#9aa3ad'; ctx.strokeStyle = '#6b737c'; ctx.lineWidth = 1;
    ctx.fillRect(cell.x + 0.5, cell.y + 0.5, CELL - 1, CELL - 1); ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, CELL - 1, CELL - 1);
  }
  for (const f of col.flashes) { ctx.fillStyle = `rgba(255, 193, 7, ${f.life / 0.6})`; ctx.beginPath(); ctx.arc(f.x, f.y - (0.6 - f.life) * 40, 6, 0, Math.PI * 2); ctx.fill(); }
  for (const p of col.parts) {
    ctx.fillStyle = p.s >= v0 ? '#e53935' : '#1e63c6';
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
  }
  tag(ctx, c, 'acid particles: red ones have enough energy to react', BOX.left + 6, 18, c.muted, 'left', 12, 700);
}

function renderCounts() {
  const left = col.cells.filter((x) => x.alive).length, enough = col.parts.filter((p) => p.s >= threshold()).length;
  $('counts').innerHTML = `<dt>Collisions with the solid</dt><dd>${f1(col.hits.length / WINDOW)} each second</dd>
    <dt>Successful collisions</dt><dd>${f1(col.events.length / WINDOW)} each second</dd>
    <dt>Particles with enough energy</dt><dd>${Math.round((100 * enough) / Math.max(1, col.parts.length))}%</dd>
    <dt>Solid left</dt><dd>${Math.round((100 * left) / Math.max(1, col.cells.length))}%</dd>`;
}

// =====================================================================
// Panels, tabs and controls
// =====================================================================

const WHY = {
  gas: () => `<p><b>Reading the graph.</b> The steeper the line, the faster the reaction. It’s steepest at the start, when there’s most to react, and levels off when the ${gas.reaction === 'mg' ? 'magnesium' : 'hydrogen peroxide'} has all reacted.</p>
    <p><b>The same volume each time.</b> Every run starts with the same amount of ${gas.reaction === 'mg' ? 'magnesium' : 'hydrogen peroxide'}, so the line always levels off at the same volume. Only how quickly it gets there changes.</p>
    ${gas.reaction === 'h2o2' ? '<p><b>The catalyst.</b> Manganese(IV) oxide speeds up the reaction but isn’t used up: it’s still there at the end, and the same volume of oxygen is made.</p>' : ''}
    <p><b>Mean rate</b> = volume of gas made ÷ time taken, in cm³/s. <b>Higher:</b> the rate at one instant is the gradient of a tangent to the curve at that time.</p>`,
  cross: () => `<p><b>The reaction.</b> Sodium thiosulfate reacts with hydrochloric acid to make sulfur, which doesn’t dissolve. The sulfur makes the liquid cloudy until you can’t see the cross.</p>
    <p><b>Measuring the rate.</b> The faster the reaction, the shorter the time for the cross to disappear, so 1 ÷ time is a measure of the rate.</p>
    <p><b>A fair test.</b> Water keeps the total volume at 50 cm³, so only the concentration changes. Use the same cross, and the same person to judge when it disappears.</p>
    <p><b>The graph.</b> Rate against concentration is roughly a straight line through the origin: double the concentration and the rate doubles.</p>`,
  collide: () => `<p><b>Collision theory.</b> Particles react only when they collide with enough energy: at least the activation energy. Most collisions just bounce off.</p>
    <p><b>Concentration (or pressure, for a gas)</b> puts more particles in the same space, so collisions happen more often. <b>Cutting up the solid</b> gives a bigger surface area, so more of it can be hit.</p>
    <p><b>Temperature</b> makes the particles move faster, so they collide more often <i>and</i> more of the collisions have enough energy. That’s why it has such a big effect.</p>
    <p><b>A catalyst</b> gives a different way for the reaction to happen, with a lower activation energy, so more collisions succeed. It isn’t used up.</p>`,
};
const INTRO = {
  gas: 'Collect the gas from a reaction in a gas syringe and plot it against time. Change one thing at a time and compare the lines: the steeper the line, the faster the reaction.',
  cross: 'The required practical with a change in turbidity: time how long it takes for a cross under the flask to disappear, for different concentrations of sodium thiosulfate.',
  collide: 'Zoom in to the particles. A reaction happens only when particles collide with enough energy. See what concentration, temperature, surface area and a catalyst do to the collisions.',
};

let lastPanel = '';
function renderPanel() {
  if (state.tab === 'gas') { renderReadings(); renderRate(); renderGasKey(); }
  if (state.tab === 'cross') renderCross();
  if (state.tab === 'collide') renderCounts();
  const why = WHY[state.tab]();
  if (why !== lastPanel) { $('explain').innerHTML = why; lastPanel = why; }
  $('graph-note').textContent = state.tab === 'gas' ? 'Up to four runs stay on the graph so you can compare them.' : state.tab === 'cross' ? 'Each dot is one result. The dashed lines are lines of best fit through the origin.' : '';
}

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('graph-panel').hidden = t === 'collide';
  $('graph-title').textContent = t === 'gas' ? 'Volume of gas against time' : 'Rate against concentration';
  $('go').hidden = t === 'collide'; $('warp').hidden = t === 'collide'; $('stop').hidden = !(t === 'cross' && cross.running);
  // The disappearing cross only goes up to 2×, so there's still time to judge when the cross goes
  const fast = document.querySelector('#warp [data-w="5"]');
  fast.hidden = t === 'cross';
  if (t === 'cross' && state.warp > 2) document.querySelector('#warp [data-w="2"]').click();
  $('go').textContent = t === 'gas' ? (gas.running ? '⏸ Pause' : '▶ Start') : '▶ Start';
  $('go').disabled = t === 'cross' && cross.running;
  $('reset').textContent = t === 'collide' ? '↺ New solid' : '↺ Reset';
  $('key').innerHTML = '';
  scene.setAttribute('aria-label', { gas: 'A conical flask connected to a gas syringe', cross: 'Looking down through a flask at a cross on paper', collide: 'Acid particles colliding with a solid' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'gas' ? location.pathname + location.search : `#${t}`);
  lastPanel = '';
  size();
  renderPanel();
}

// Gas controls
$('reaction').addEventListener('change', (e) => {
  gas.reaction = e.target.value; gas.running = false; gas.t = 0; gas.checked = false; gas.m = 0;
  document.querySelectorAll('[data-only]').forEach((el) => { el.hidden = el.dataset.only !== gas.reaction; });
  $('tp').max = R().tmax; if (gas.tp > R().tmax) PK.setNum('tp', 30);
  gas.tp = PK.num('tp'); $('go').textContent = '▶ Start';
  renderPanel();
});
const changed = () => { gas.dirty = true; if (!gas.running) $('go').textContent = '▶ Start'; };
PK.chips('conc', (v) => { gas.conc = v; changed(); });
PK.chips('form', (v) => { gas.powder = v === 1; changed(); });
PK.chips('cat', (v) => { gas.cat = v === 1; changed(); });
PK.chips('temp', (v) => { gas.T = v; changed(); });
$('clear-runs').addEventListener('click', () => { gas.runs = []; gas.running = false; gas.t = 0; gas.checked = false; $('go').textContent = '▶ Start'; renderPanel(); });
$('tp').addEventListener('input', () => { gas.tp = PK.num('tp'); gas.checked = false; renderPanel(); });
$('check').addEventListener('click', () => { gas.checked = !gas.checked; renderPanel(); });

// Cross controls
$('thio').addEventListener('input', () => { cross.thio = PK.num('thio'); if (!cross.running) cross.t = 0; renderPanel(); });
PK.chips('ctemp', (v) => { cross.T = v; });
$('stop').addEventListener('click', () => crossStop(false));
$('clear-cross').addEventListener('click', () => { cross.results = []; renderPanel(); });

// Collision controls
PK.chips('nconc', (v) => { col.n = v; setParticles(); });
PK.chips('ntemp', (v) => { col.temp = v; col.parts.forEach((p) => { const s = speedSample(), k = s / Math.hypot(p.vx, p.vy); p.vx *= k; p.vy *= k; p.s = s; }); });
PK.chips('pieces', (v) => { col.pieces = v; buildSolid(); });
$('ncat').addEventListener('change', (e) => { col.cat = e.target.checked; });

// The stage buttons
$('go').addEventListener('click', () => { if (state.tab === 'gas') gasGo(); else if (state.tab === 'cross') crossGo(); });
$('reset').addEventListener('click', () => {
  if (state.tab === 'gas') { const run = current(); if (run && gas.t < R().tmax) gas.runs.pop(); gas.running = false; gas.t = 0; gas.checked = false; gas.bubbles = []; $('go').textContent = '▶ Start'; }
  if (state.tab === 'cross') { cross.running = false; cross.t = 0; $('stop').hidden = true; $('go').disabled = false; }
  if (state.tab === 'collide') buildSolid();
  renderPanel();
});
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#warp .chip').forEach((b) => b.addEventListener('click', () => {
  state.warp = Number(b.dataset.w);
  document.querySelectorAll('#warp .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));
window.addEventListener('pk-answers', () => { lastPanel = ''; renderPanel(); });
window.addEventListener('pk-theme', () => { lastPanel = ''; renderPanel(); });

// Dragging the dot and the tangent on the gas graph. The graph changes height between tabs, so it
// reports y as if it were square and we scale it here.
PK.dragOn(graph, GW, GW, {
  hit: (p0) => {
    if (state.tab !== 'gas' || !reached()) return null;
    const p = { x: p0.x, y: p0.y * GH() / GW }, geo = tangentGeom();
    if (Math.hypot(p.x - geo.H.x, p.y - geo.H.y) < 24) return 'H';
    if (Math.hypot(p.x - geo.X(geo.P.t), p.y - geo.Y(geo.P.v)) < 22) return 'P';
    return null;
  },
  move: (h, p0) => {
    const p = { x: p0.x, y: p0.y * GH() / GW }, geo = tangentGeom();
    if (h === 'P') {
      const t = Math.round(((p.x - geo.L) / geo.pw) * geo.xA.top / 5) * 5;
      gas.tp = Math.max(5, Math.min(Math.min(R().tmax, gas.t), t));
      PK.setNum('tp', gas.tp); gas.checked = false;
    } else {
      let dx = p.x - geo.X(geo.P.t);
      const dy = p.y - geo.Y(geo.P.v);
      if (Math.abs(dx) < 6) dx = dx < 0 ? -6 : 6;
      gas.m = Math.max(-5, Math.min(10, (-dy * geo.pxT) / (dx * geo.pxV)));
    }
    renderPanel();
  },
});

function size() {
  const dpr = window.devicePixelRatio || 1, z = SIZE[state.tab];
  scene.style.aspectRatio = `${SW} / ${z.SH}`; graph.style.aspectRatio = `${GW} / ${z.GH}`;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (z.SH / SW) * dpr);
  graph.width = Math.round(graph.clientWidth * dpr); graph.height = Math.round(graph.clientWidth * (z.GH / GW) * dpr);
}
window.addEventListener('resize', size);

function draw() {
  const c = colours();
  if (scene.clientWidth) {
    ctx.setTransform(scene.width / SW, 0, 0, scene.width / SW, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, SW, SH());
    ({ gas: drawGas, cross: drawCross, collide: drawCollide })[state.tab](c);
  }
  if (graph.clientWidth && state.tab !== 'collide') {
    g.setTransform(graph.width / GW, 0, 0, graph.width / GW, 0, 0);
    g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH());
    if (state.tab === 'gas') drawGasGraph(c); else drawCrossGraph(c);
  }
}

let last = performance.now(), tick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  gasStep(dt); moveBubbles(dt); crossStep(dt);
  if (state.tab === 'collide') collideStep(dt);
  draw();
  tick += dt;
  if (tick > 0.25) {
    tick = 0;
    if (state.tab === 'gas' && gas.running) { renderReadings(); renderRate(); }
    if (state.tab === 'collide') renderCounts();
  }
  requestAnimationFrame(frame);
}

buildSolid(); setParticles();
showTab(['cross', 'collide'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'gas');
requestAnimationFrame(frame);

// Share: the runs on the graph, the tangent you've drawn, and the disappearing cross results
PK.shareState = {
  get: () => ({
    r: gas.runs.map((r) => [r.reaction, r.label, Number(r.k.toFixed(5)), r.vmax, r.colour, Math.round(r.tEnd), r.powder ? 1 : 0, r.cat ? 1 : 0]),
    t: Math.round(gas.t), m: Number(gas.m.toFixed(3)), c: gas.checked ? 1 : 0,
    x: cross.results.map((r) => [r.thio, r.T, r.time]),
  }),
  set: (o) => {
    if (Array.isArray(o.r)) gas.runs = o.r.map(([reaction, label, k, vmax, colour, tEnd, powder, cat]) => ({ reaction, label, k: Number(k), vmax: Number(vmax), colour, tEnd: Number(tEnd), powder: Boolean(powder), cat: Boolean(cat) })).filter((r) => REACT[r.reaction]);
    if (Number.isFinite(Number(o.t))) gas.t = Number(o.t);
    if (Number.isFinite(Number(o.m))) gas.m = Number(o.m);
    gas.checked = Boolean(o.c);
    if (Array.isArray(o.x)) cross.results = o.x.map(([thio, T, time]) => ({ thio: Number(thio), T: Number(T), time: Number(time) })).filter((r) => r.time > 0);
    renderPanel();
  },
};
