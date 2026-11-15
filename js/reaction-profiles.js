// Reaction profiles and energy changes: a draggable reaction profile (with a catalyst), the
// temperature-change required practical in a polystyrene cup, and energy changes from bond
// energies (Higher).

PK.header({
  title: 'Reaction profiles & energy changes',
  answers: true,
  specNote: 'AQA references are to GCSE Chemistry (8462); Combined Science (8464) covers the same content. KS3 references are to the National Curriculum programme of study.',
  spec: [
    { code: '4.5.1.1', text: 'Exothermic reactions transfer energy to the surroundings, so the temperature rises. Endothermic reactions take in energy from the surroundings, so the temperature falls. Examples and everyday uses' },
    { code: '4.5.1.1', text: 'Required practical: the variables that affect temperature changes in reacting solutions' },
    { code: '4.5.1.2', text: 'Reaction profiles: the relative energies of the reactants and products, the activation energy and the overall energy change' },
    { code: '4.5.1.3', text: 'Breaking bonds takes in energy and making bonds gives out energy. Calculate the energy change of a reaction from bond energies', ht: true },
    { code: '4.6.1.4', text: 'A catalyst provides a different pathway with a lower activation energy. The reaction profile for a catalysed reaction' },
    { code: 'KS3', text: 'Exothermic and endothermic chemical reactions (qualitative)' },
  ],
});

const $ = (id) => document.getElementById(id);
const scene = $('scene'), ctx = scene.getContext('2d'), graph = $('graph'), g = graph.getContext('2d');
const SW = 560, SH = 380, GW = 560, GH = 340;
const fmt = (x, dp = 1) => String(parseFloat(x.toFixed(dp)));
const EXO = '#e65100', ENDO = '#1565c0', CAT = '#2e9e4f', IN = '#c62828', OUT = '#1565c0';
const state = { tab: 'profile' };

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), art: PK.cssVar('--art'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c2, c, text, x, y, col, align = 'center', size = 13, weight = 800) {
  c2.font = `${weight} ${size}px ${c.font}`; c2.textAlign = align; c2.textBaseline = 'middle';
  c2.lineWidth = 4; c2.lineJoin = 'round'; c2.strokeStyle = c.surface; c2.strokeText(text, x, y);
  c2.fillStyle = col; c2.fillText(text, x, y); c2.lineWidth = 1;
}
function arrow(c2, x1, y1, x2, y2, col, w = 2.5, head = 9) {
  const a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  c2.strokeStyle = col; c2.fillStyle = col; c2.lineWidth = w;
  c2.beginPath(); c2.moveTo(x1, y1); c2.lineTo(x2 - Math.cos(a) * head * 0.7, y2 - Math.sin(a) * head * 0.7); c2.stroke();
  c2.beginPath(); c2.moveTo(x2, y2); c2.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head); c2.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head); c2.closePath(); c2.fill();
}
const hidden = () => !PK.answersShown();

// =====================================================================
// Reaction profiles
// =====================================================================

const EXAMPLES = [
  { id: 'methane', name: 'Burning methane (combustion)', P: 12, E: 78, re: 'CH₄ + 2O₂', pr: 'CO₂ + 2H₂O',
    note: 'Combustion gives out a lot of energy. It needs a flame or spark to get it started: that provides the activation energy.' },
  { id: 'neut', name: 'Hydrochloric acid + sodium hydroxide (neutralisation)', P: 34, E: 58, re: 'HCl + NaOH', pr: 'NaCl + H₂O',
    note: 'Neutralisation is exothermic. Its activation energy is small, so it happens as soon as the solutions mix.' },
  { id: 'iron', name: 'Iron rusting in a hand warmer (oxidation)', P: 22, E: 70, re: 'iron + oxygen + water', pr: 'hydrated iron(III) oxide',
    note: 'Hand warmers and self-heating cans use exothermic reactions.' },
  { id: 'caco3', name: 'Heating calcium carbonate (thermal decomposition)', P: 80, E: 94, re: 'CaCO₃', pr: 'CaO + CO₂',
    note: 'Thermal decomposition is endothermic: it only keeps going while you keep heating it.' },
  { id: 'citric', name: 'Citric acid + sodium hydrogencarbonate', P: 63, E: 80, re: 'citric acid + NaHCO₃', pr: 'sodium citrate + H₂O + CO₂',
    note: 'This endothermic reaction takes in energy from the surroundings, so the solution gets colder. Some sports injury packs use endothermic changes to cool an injury.' },
  { id: 'own', name: 'Your own: drag the profile', P: 30, E: 70, re: 'reactants', pr: 'products', note: '' },
];
const R0 = 50;   // the reactants' energy level, on a scale of 0 to 100
const X = { axis: 56, start: 58, rise: 190, peak: 300, fall: 420, end: 492, thermo: 528 };
const Ye = (e) => 330 - e * 2.7;
const eY = (y) => (330 - y) / 2.7;
const prof = { ex: 0, P: EXAMPLES[0].P, E: EXAMPLES[0].E, cat: false, run: -1, temp: 20, moved: false };
const ex = () => EXAMPLES[prof.ex];
const catPeak = () => Math.max(R0, prof.P) + (prof.E - Math.max(R0, prof.P)) * 0.45;
const CURVE = '#d32f2f';

function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y };
}
// The profile as points, for drawing it and for moving along it: flat reactants, a hump, a steep
// fall to the products, then flat products (the shape AQA draws)
function profilePoints(peak) {
  const r = Ye(R0), p = Ye(prof.P), e = Ye(peak), pts = [];
  pts.push({ x: X.start, y: r });
  for (let i = 0; i <= 30; i++) pts.push(bez({ x: X.rise, y: r }, { x: X.rise + 40, y: r }, { x: X.peak - 40, y: e }, { x: X.peak, y: e }, i / 30));
  for (let i = 1; i <= 30; i++) pts.push(bez({ x: X.peak, y: e }, { x: X.peak + 40, y: e }, { x: X.fall - 30, y: p }, { x: X.fall, y: p }, i / 30));
  pts.push({ x: X.end, y: p });
  return pts;
}
function strokePts(pts) { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke(); }
function dashed(c, x1, y1, x2, y2) { ctx.strokeStyle = c.text; ctx.lineWidth = 1.3; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); }
function words(c, lines, x, y, col, align) { lines.forEach((t, i) => tag(ctx, c, t, x, y + (i - (lines.length - 1) / 2) * 17, col, align, 14, 600)); }

function drawProfile(c) {
  const exo = prof.P < R0, endo = prof.P > R0, hide = hidden(), r = Ye(R0), p = Ye(prof.P), e = Ye(prof.E);
  // Axes
  arrow(ctx, X.axis, 352, X.axis, 32, c.text, 2, 10); arrow(ctx, X.axis, 352, 512, 352, c.text, 2, 10);
  tag(ctx, c, 'Energy', X.axis - 8, 150, c.text, 'right', 14, 600);
  tag(ctx, c, 'Progress of reaction', 285, 368, c.text, 'center', 14, 600);
  // Dashed guides: along from the reactants to under the hump, and along from the products
  dashed(c, X.rise, r, X.peak + 34, r);
  if (Math.abs(prof.P - R0) > 1) dashed(c, 130, p, X.fall, p);
  // The catalysed path, then the main one
  if (prof.cat) { ctx.strokeStyle = CAT; ctx.lineWidth = 2.5; ctx.setLineDash([9, 6]); strokePts(profilePoints(catPeak())); ctx.setLineDash([]); }
  ctx.strokeStyle = CURVE; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; strokePts(profilePoints(prof.E));
  tag(ctx, c, ex().re === 'reactants' ? 'Reactants' : ex().re, (X.start + X.rise) / 2 + 6, r - 16, c.text, 'center', 14, 600);
  tag(ctx, c, ex().pr === 'products' ? 'Products' : ex().pr, (X.fall + X.end) / 2, p - 16, c.text, 'center', 14, 600);
  // Activation energy: from the reactants' level up to the top of the hump
  arrow(ctx, X.peak, r, X.peak, e + 1, c.text, 1.6, 9);
  words(c, hide ? ['?'] : ['Activation', 'energy'], X.peak - 10, (r + e) / 2, c.text, 'right');
  if (prof.cat) {
    const k = Ye(catPeak());
    arrow(ctx, X.peak + 22, r, X.peak + 22, k + 1, CAT, 1.6, 9);
    words(c, hide ? ['?'] : ['with a', 'catalyst'], X.peak + 30, (r + k) / 2, CAT, 'left');
  }
  // Energy released (or taken in): from the reactants down (or up) to the products
  if (Math.abs(prof.P - R0) > 1) {
    arrow(ctx, 160, r, 160, p, c.text, 1.6, 9);
    words(c, hide ? ['?'] : (exo ? ['Energy', 'released'] : ['Energy', 'taken in']), 172, (r + p) / 2, c.text, 'left');
  }
  // Drag handles
  ctx.fillStyle = c.surface; ctx.strokeStyle = c.text; ctx.lineWidth = 2.5;
  for (const [x, y] of [[X.peak, e], [X.end - 18, p]]) { ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (!prof.moved) tag(ctx, c, 'Drag the top of the hump, or the products', 68, 18, c.muted, 'left', 12, 700);
  // A particle travelling along the profile when you run the reaction: over the lower hump if there's a catalyst
  if (prof.run >= 0) {
    const pts = profilePoints(prof.cat ? catPeak() : prof.E), i = Math.min(pts.length - 1, Math.floor(prof.run * (pts.length - 1)));
    ctx.fillStyle = '#ffb300'; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y - 9, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  drawThermometer(c, X.thermo, prof.temp, 'surroundings');
  if (endo || exo) tag(ctx, c, hide ? '' : (exo ? 'exothermic' : 'endothermic'), 505, 18, exo ? EXO : ENDO, 'right', 15);
}

function drawThermometer(c, x, temp, label) {
  const top = 70, bottom = 230, lo = 10, hi = 30, y = (t) => bottom - ((t - lo) / (hi - lo)) * (bottom - top);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = c.art; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x - 6, top - 8, 12, bottom - top + 12, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, bottom + 10, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x, bottom + 10, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 3, y(Math.max(lo, Math.min(hi, temp))), 6, bottom + 4 - y(Math.max(lo, Math.min(hi, temp))));
  ctx.strokeStyle = c.text; ctx.lineWidth = 1;
  for (let t = lo; t <= hi; t += 10) { ctx.beginPath(); ctx.moveTo(x + 6, y(t)); ctx.lineTo(x + 11, y(t)); ctx.stroke(); tag(ctx, c, String(t), x + 13, y(t), c.muted, 'left', 10, 700); }
  tag(ctx, c, label, x, top - 36, c.muted, 'center', 10, 700);
  tag(ctx, c, `${temp.toFixed(1)} °C`, x, top - 21, c.text, 'center', 12);
}

function renderProfile() {
  const exo = prof.P < R0 - 1, endo = prof.P > R0 + 1, e = ex();
  const type = exo ? 'Exothermic' : endo ? 'Endothermic' : 'No overall energy change';
  $('profile-info').innerHTML = `<p style="margin-top:0">${PK.ans(`<span class="badge ${exo ? 'bad' : endo ? 'neutral' : 'good'}">${type}</span>`)}</p>
    <p>${exo ? 'The products have <b>less</b> energy than the reactants. The difference is given out to the surroundings, so the temperature goes up.'
      : endo ? 'The products have <b>more</b> energy than the reactants. The difference is taken in from the surroundings, so the temperature goes down.'
        : 'The products have the same energy as the reactants.'}</p>
    <p>The <b>activation energy</b> is the smallest amount of energy the particles need when they collide for them to react: the height of the hump above the reactants.</p>
    ${prof.cat ? '<p>The <b>catalyst</b> gives a different pathway with a lower activation energy. The reactants and products, and the overall energy change, stay the same.</p>' : ''}
    ${e.note ? `<p class="note" style="margin-bottom:0">${e.note}</p>` : ''}`;
}

function runProfile() { prof.run = 0; prof.temp = 20; }
function stepProfile(dt) {
  if (prof.run < 0) return;
  prof.run = Math.min(1, prof.run + dt / 3);
  // The surroundings change temperature as the products form
  if (prof.run > 0.5) prof.temp = 20 + ((R0 - prof.P) * 0.18) * Math.min(1, (prof.run - 0.5) / 0.4);
  if (prof.run >= 1) prof.run = -1;
}

// =====================================================================
// Temperature change (required practical)
// =====================================================================

const TR = {
  neut: { step: 5, max: 40, unit: 'cm³', what: 'sodium hydroxide', axis: 'volume of sodium hydroxide added / cm³', col: 'Volume added (cm³)',
    setup: '25 cm³ of hydrochloric acid in a polystyrene cup. Add sodium hydroxide 5 cm³ at a time, stir, and record the highest temperature.',
    dT: (v) => (v <= 25 ? (57 * v) / (4.2 * (25 + v)) : 1425 / (4.2 * (25 + v))) },
  citric: { step: 0.5, max: 4, unit: 'g', what: 'sodium hydrogencarbonate', axis: 'mass of sodium hydrogencarbonate added / g', col: 'Mass added (g)',
    setup: '25 cm³ of citric acid solution in a polystyrene cup. Add sodium hydrogencarbonate 0.5 g at a time, stir, and record the lowest temperature.',
    dT: (m) => -2.8 * Math.min(m, 2.5) + (m > 2.5 ? 0.15 * (m - 2.5) : 0) },
};
const tr = { react: 'neut', lid: true, start: 20, readings: [] };
const T0 = () => TR[tr.react];
function trReset() {
  tr.start = Math.round((19.5 + Math.random() * 1.5) * 10) / 10;
  tr.readings = [{ x: 0, t: tr.start }];
}
function trAdd() {
  const r = T0(), last = tr.readings[tr.readings.length - 1].x;
  if (last >= r.max - 1e-9) return;
  const x = Math.round((last + r.step) * 10) / 10, eff = tr.lid ? 0.93 : 0.78;
  const t = tr.start + eff * r.dT(x) + (Math.random() - 0.5) * 0.3;
  tr.readings.push({ x, t: Math.round(t * 10) / 10 });
}
function drawTemp(c) {
  const r = T0(), last = tr.readings[tr.readings.length - 1];
  // A polystyrene cup in a beaker, with a lid and a thermometer
  ctx.fillStyle = 'rgba(200,220,240,.35)'; ctx.strokeStyle = c.art; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(150, 140); ctx.lineTo(150, 330); ctx.lineTo(330, 330); ctx.lineTo(330, 140); ctx.stroke();
  ctx.fillStyle = '#f7f4ec'; ctx.beginPath(); ctx.moveTo(175, 120); ctx.lineTo(305, 120); ctx.lineTo(290, 320); ctx.lineTo(190, 320); ctx.closePath(); ctx.fill(); ctx.stroke();
  const level = 250 - (last.x / r.max) * 40;
  ctx.fillStyle = 'rgba(120, 180, 230, .45)'; ctx.beginPath(); ctx.moveTo(180 + (level - 120) * 0.075, level); ctx.lineTo(300 - (level - 120) * 0.075, level); ctx.lineTo(290, 318); ctx.lineTo(190, 318); ctx.closePath(); ctx.fill();
  if (tr.lid) { ctx.fillStyle = '#e8e2d2'; ctx.fillRect(168, 108, 144, 14); ctx.strokeRect(168, 108, 144, 14); }
  // Thermometer probe and display
  ctx.strokeStyle = '#5b6470'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(262, 60); ctx.lineTo(262, 300); ctx.stroke();
  ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.roundRect(212, 20, 110, 44, 8); ctx.fill();
  ctx.fillStyle = '#7cfc9a'; ctx.font = `700 24px ui-monospace, Consolas, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${last.t.toFixed(1)} °C`, 267, 43);
  // What you add
  tag(ctx, c, `${fmt(last.x)} ${r.unit} of`, 445, 140, c.text, 'center', 14);
  tag(ctx, c, `${r.what} added`, 445, 160, c.text, 'center', 14);
  tag(ctx, c, `Started at ${tr.start.toFixed(1)} °C`, 445, 188, c.muted, 'center', 13, 700);
  tag(ctx, c, last.x >= r.max - 1e-9 ? 'Finished: press Reset' : `Press “Add ${fmt(r.step)} ${r.unit}”`, 445, 220, c.muted, 'center', 12, 700);
  tag(ctx, c, tr.lid ? 'lid on: less energy lost' : 'no lid: more energy lost to the air', 240, 352, c.muted, 'center', 12, 700);
}
function renderTemp() {
  const r = T0();
  $('tsetup').textContent = r.setup;
  $('go').textContent = `+ Add ${fmt(r.step)} ${r.unit}`;
  $('go').disabled = tr.readings[tr.readings.length - 1].x >= r.max - 1e-9;
  $('tresults').innerHTML = `<table class="results"><thead><tr><th>${r.col}</th><th>Temperature (°C)</th><th>Change (°C)</th></tr></thead><tbody>
    ${tr.readings.map((q) => `<tr><td>${fmt(q.x)}</td><td>${q.t.toFixed(1)}</td><td>${PK.ans(`${q.t - tr.start >= 0 ? '+' : '−'}${Math.abs(q.t - tr.start).toFixed(1)}`)}</td></tr>`).join('')}
  </tbody></table>`;
  $('graph-note').textContent = tr.react === 'neut'
    ? 'The temperature rises while acid is still being neutralised, then falls as extra cold sodium hydroxide is added. The two lines of best fit cross at the volume that exactly neutralises the acid.'
    : 'The temperature falls while the citric acid is reacting, then stops falling once all the acid has been used up.';
}
function axis(max, ticks) {
  for (let e = -3; e < 6; e++) for (const k of [1, 2, 5]) { const st = k * 10 ** e, n = Math.ceil(max / st - 1e-9); if (n <= ticks) return { step: st, n, top: n * st }; }
  return { step: max, n: 1, top: max };
}
function drawTempGraph(c) {
  const r = T0(), L = 62, T = 14, B = 48, pw = GW - L - 16, ph = GH - T - B;
  const ts = tr.readings.map((q) => q.t), lo = Math.floor(Math.min(...ts, tr.start) - 1), hi = Math.ceil(Math.max(...ts, tr.start) + 1);
  const xA = axis(r.max, 8), span = hi - lo, yStep = span <= 6 ? 1 : 2, yTop = lo + Math.ceil(span / yStep) * yStep;
  const Xp = (x) => L + (x / xA.top) * pw, Yp = (t) => T + ph - ((t - lo) / (yTop - lo)) * ph;
  g.lineWidth = 1; g.font = `600 13px ${c.font}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let t = lo; t <= yTop + 1e-9; t += yStep) { g.strokeStyle = c.grid; g.beginPath(); g.moveTo(L, Yp(t)); g.lineTo(L + pw, Yp(t)); g.stroke(); g.fillStyle = c.muted; g.fillText(String(t), L - 6, Yp(t)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let i = 0; i <= xA.n; i++) { const x = i * xA.step; g.strokeStyle = c.grid; g.beginPath(); g.moveTo(Xp(x), T); g.lineTo(Xp(x), T + ph); g.stroke(); g.fillStyle = c.muted; g.fillText(fmt(x), Xp(x), T + ph + 5); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 14px ${c.font}`; g.fillText(r.axis, L + pw / 2, GH - 20);
  g.save(); g.translate(16, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('temperature / °C', 0, 0); g.restore();
  // Lines of best fit either side of the turning point, once there are enough results
  const pts = tr.readings, turn = tr.react === 'neut' ? 25 : 2.5;
  const fit = (set) => {
    const n = set.length, sx = set.reduce((a, q) => a + q.x, 0), sy = set.reduce((a, q) => a + q.t, 0);
    const sxx = set.reduce((a, q) => a + q.x * q.x, 0), sxy = set.reduce((a, q) => a + q.x * q.t, 0), d = n * sxx - sx * sx;
    if (n < 2 || Math.abs(d) < 1e-9) return null;
    const m = (n * sxy - sx * sy) / d; return { m, k: (sy - m * sx) / n };
  };
  const a = fit(pts.filter((q) => q.x <= turn + 1e-9)), b = fit(pts.filter((q) => q.x >= turn - 1e-9));
  if (PK.answersShown() && a && b && pts.filter((q) => q.x > turn + 1e-9).length >= 2) {
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    g.strokeStyle = '#7c3aed'; g.lineWidth = 2; g.setLineDash([7, 5]);
    for (const f of [a, b]) { g.beginPath(); g.moveTo(Xp(0), Yp(f.k)); g.lineTo(Xp(r.max), Yp(f.k + f.m * r.max)); g.stroke(); }
    g.setLineDash([]); g.restore();
    const xi = (b.k - a.k) / (a.m - b.m);
    if (xi > 0 && xi < r.max) tag(g, c, `lines cross at ${fmt(xi)} ${r.unit}`, Xp(xi), Yp(a.k + a.m * xi) + (tr.react === 'neut' ? -16 : 18), '#7c3aed', 'center', 13);
  }
  g.fillStyle = '#e53935';
  for (const q of pts) { g.beginPath(); g.arc(Xp(q.x), Yp(q.t), 5, 0, Math.PI * 2); g.fill(); }
}

// =====================================================================
// Bond energies (Higher)
// =====================================================================

const BOND = { 'H–H': 436, 'Cl–Cl': 243, 'H–Cl': 432, 'C–H': 413, 'O=O': 498, 'C=O': 805, 'O–H': 464, 'N≡N': 945, 'N–H': 391 };
const BREACT = [
  { name: 'Hydrogen + chlorine → hydrogen chloride', eq: 'H₂ + Cl₂ → 2HCl', atoms: '2H + 2Cl', broken: [['H–H', 1], ['Cl–Cl', 1]], made: [['H–Cl', 2]] },
  { name: 'Burning methane', eq: 'CH₄ + 2O₂ → CO₂ + 2H₂O', atoms: 'C + 4H + 4O', broken: [['C–H', 4], ['O=O', 2]], made: [['C=O', 2], ['O–H', 4]] },
  { name: 'Burning hydrogen', eq: '2H₂ + O₂ → 2H₂O', atoms: '4H + 2O', broken: [['H–H', 2], ['O=O', 1]], made: [['O–H', 4]] },
  { name: 'Making ammonia', eq: 'N₂ + 3H₂ → 2NH₃', atoms: '2N + 6H', broken: [['N≡N', 1], ['H–H', 3]], made: [['N–H', 6]] },
  { name: 'Splitting hydrogen chloride', eq: '2HCl → H₂ + Cl₂', atoms: '2H + 2Cl', broken: [['H–Cl', 2]], made: [['H–H', 1], ['Cl–Cl', 1]] },
];
const bonds = { i: 1 };
const total = (list) => list.reduce((a, [b, n]) => a + BOND[b] * n, 0);
function drawBonds(c) {
  const r = BREACT[bonds.i], inE = total(r.broken), outE = total(r.made), net = inE - outE, hide = hidden();
  // Levels: the reactants, the separate atoms above them, and the products where they end up
  const k = 250 / Math.max(inE, outE), yReact = 300, yProd = yReact - net * k, yAtoms = yReact - inE * k;
  const lvl = (x1, x2, y, text, col) => { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); tag(ctx, c, text, (x1 + x2) / 2, y + (y > yAtoms + 5 ? 16 : -14), col, 'center', 13); };
  const top = Math.min(yAtoms, yProd, yReact), bottom = Math.max(yAtoms, yProd, yReact), shift = 190 - (top + bottom) / 2;
  ctx.save(); ctx.translate(0, shift);
  lvl(40, 200, yReact, r.eq.split('→')[0].trim(), c.text);
  lvl(200, 360, yAtoms, `separate atoms: ${r.atoms}`, c.muted);
  lvl(360, 520, yProd, r.eq.split('→')[1].trim(), c.text);
  arrow(ctx, 200, yReact, 200, yAtoms + 2, IN, 3);
  tag(ctx, c, hide ? 'energy in: ?' : `energy in: +${inE} kJ`, 192, (yReact + yAtoms) / 2, IN, 'right', 13);
  tag(ctx, c, 'breaking bonds', 192, (yReact + yAtoms) / 2 + 17, IN, 'right', 11, 700);
  arrow(ctx, 360, yAtoms, 360, yProd - 2, OUT, 3);
  tag(ctx, c, hide ? 'energy out: ?' : `energy out: −${outE} kJ`, 368, (yAtoms + yProd) / 2, OUT, 'left', 13);
  tag(ctx, c, 'making bonds', 368, (yAtoms + yProd) / 2 + 17, OUT, 'left', 11, 700);
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1.2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(200, yReact); ctx.lineTo(520, yReact); ctx.stroke(); ctx.setLineDash([]);
  if (Math.abs(net) * k > 6) {
    arrow(ctx, 500, yReact, 500, yProd, net < 0 ? EXO : ENDO, 3);
    tag(ctx, c, hide ? 'overall: ?' : `overall: ${net < 0 ? '−' : '+'}${Math.abs(net)} kJ`, 492, (yReact + yProd) / 2, net < 0 ? EXO : ENDO, 'right', 13);
  }
  ctx.restore();
  tag(ctx, c, 'Energy diagram drawn to scale (kJ per mole of the equation)', 280, 18, c.muted, 'center', 12, 700);
}
function renderBonds() {
  const r = BREACT[bonds.i], inE = total(r.broken), outE = total(r.made), net = inE - outE;
  const rows = (list) => list.map(([b, n]) => `${n} × ${b} = ${n} × ${BOND[b]} = ${PK.ans(String(n * BOND[b]))} kJ`).join('<br>');
  $('bwork').innerHTML = `<p class="eq">${r.eq}</p>
    <div class="working">
      <p><b>Bonds broken</b> (energy in)<br>${rows(r.broken)}<br>Total = <b>${PK.ans(`${inE} kJ`)}</b></p>
      <p><b>Bonds made</b> (energy out)<br>${rows(r.made)}<br>Total = <b>${PK.ans(`${outE} kJ`)}</b></p>
      <p><b>Overall energy change</b> = energy in − energy out<br>= ${inE} − ${outE} = <b>${PK.ans(`${net > 0 ? '+' : '−'}${Math.abs(net)} kJ/mol`)}</b></p>
    </div>
    <p class="note" style="margin-bottom:0">${PK.ans(net < 0 ? 'Negative: more energy is given out making bonds than is taken in breaking them, so the reaction is <b>exothermic</b>.' : 'Positive: more energy is taken in breaking bonds than is given out making them, so the reaction is <b>endothermic</b>.')}</p>`;
  $('btable').innerHTML = `<table class="results"><tbody>${Object.entries(BOND).map(([b, e]) => `<tr><td>${b}</td><td>${e}</td></tr>`).join('')}</tbody></table>`;
}

// =====================================================================
// Panels, tabs and controls
// =====================================================================

const WHY = {
  profile: `<p><b>Exothermic</b> reactions give out energy to the surroundings, so the temperature goes up: combustion, oxidation and neutralisation. <b>Endothermic</b> reactions take in energy, so the temperature goes down: thermal decomposition, and citric acid with sodium hydrogencarbonate.</p>
    <p><b>Reading a profile.</b> The hump is the activation energy that the particles need to react. The gap between the reactants and products is the overall energy change.</p>
    <p><b>A catalyst</b> lowers the hump, so more collisions have enough energy and the reaction is faster. It doesn’t change the energy of the reactants or the products.</p>`,
  temp: `<p><b>Why a polystyrene cup?</b> Polystyrene is a good insulator, so less energy is transferred to or from the surroundings. A lid helps too. Without them the temperature change measured is smaller than it should be.</p>
    <p><b>Variables.</b> The independent variable is the amount added. The dependent variable is the temperature. Keep the volume and concentration of the acid, and the starting temperature, the same.</p>
    <p><b>Exothermic or endothermic?</b> The neutralisation warms up, so it’s exothermic. The citric acid reaction cools down, so it’s endothermic.</p>`,
  bonds: `<p><b>Breaking bonds takes in energy.</b> <b>Making bonds gives out energy.</b></p>
    <p>Overall energy change = energy taken in breaking bonds − energy given out making bonds.</p>
    <p>If more energy is given out than taken in, the answer is negative and the reaction is exothermic. If more is taken in, it’s positive and the reaction is endothermic.</p>`,
};
const INTRO = {
  profile: 'A reaction profile shows the energy of the reactants and products, and the activation energy needed to get the reaction started. Drag it, pick an example, and run the reaction to see what happens to the temperature of the surroundings.',
  temp: 'The required practical: measure the temperature change in a polystyrene cup as you add one reactant a little at a time.',
  bonds: 'Higher: work out the overall energy change of a reaction from the energy needed to break the bonds and the energy given out making new ones.',
};

function renderPanel() {
  if (state.tab === 'profile') renderProfile();
  if (state.tab === 'temp') renderTemp();
  if (state.tab === 'bonds') renderBonds();
}
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = WHY[t];
  $('graph-panel').hidden = t !== 'temp';
  $('go').parentElement.hidden = t === 'bonds';
  $('go').disabled = false;
  $('go').textContent = t === 'profile' ? '▶ Run the reaction' : '+ Add';
  scene.setAttribute('aria-label', { profile: 'A reaction profile', temp: 'A polystyrene cup with a thermometer', bonds: 'An energy diagram for breaking and making bonds' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'profile' ? location.pathname + location.search : `#${t}`);
  size();
  renderPanel();
}

$('example').innerHTML = EXAMPLES.map((e, i) => `<option value="${i}">${e.name}</option>`).join('');
$('example').addEventListener('change', (e) => { prof.ex = Number(e.target.value); prof.P = ex().P; prof.E = ex().E; prof.temp = 20; prof.run = -1; renderPanel(); });
$('catalyst').addEventListener('change', (e) => { prof.cat = e.target.checked; renderPanel(); });
$('treact').addEventListener('change', (e) => { tr.react = e.target.value; trReset(); renderPanel(); });
$('lid').addEventListener('change', (e) => { tr.lid = e.target.checked; trReset(); renderPanel(); });
$('breact').innerHTML = BREACT.map((r, i) => `<option value="${i}">${r.name}</option>`).join('');
$('breact').value = '1';
$('breact').addEventListener('change', (e) => { bonds.i = Number(e.target.value); renderPanel(); });
$('go').addEventListener('click', () => { if (state.tab === 'profile') runProfile(); else if (state.tab === 'temp') { trAdd(); renderPanel(); } });
$('reset').addEventListener('click', () => {
  if (state.tab === 'profile') { prof.P = ex().P; prof.E = ex().E; prof.temp = 20; prof.run = -1; }
  if (state.tab === 'temp') trReset();
  renderPanel();
});
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
window.addEventListener('pk-answers', renderPanel);
window.addEventListener('pk-theme', renderPanel);

// Dragging the top of the hump and the products level
PK.dragOn(scene, SW, SH, {
  hit: (p) => {
    if (state.tab !== 'profile') return null;
    if (Math.hypot(p.x - X.peak, p.y - Ye(prof.E)) < 26) return 'E';
    if (Math.abs(p.y - Ye(prof.P)) < 18 && p.x > X.fall - 20 && p.x < X.end + 12) return 'P';
    return null;
  },
  move: (h, p) => {
    const e = Math.round(Math.max(4, Math.min(100, eY(p.y))));
    if (h === 'E') prof.E = Math.max(e, Math.max(R0, prof.P) + 8);
    else { prof.P = Math.max(4, Math.min(92, e)); prof.E = Math.max(prof.E, Math.max(R0, prof.P) + 8); }
    prof.moved = true; prof.temp = 20; prof.run = -1;
    if (prof.ex !== EXAMPLES.length - 1) { prof.ex = EXAMPLES.length - 1; $('example').value = String(prof.ex); }
    renderPanel();
  },
});

function size() {
  const dpr = window.devicePixelRatio || 1;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (SH / SW) * dpr);
  graph.width = Math.round(graph.clientWidth * dpr); graph.height = Math.round(graph.clientWidth * (GH / GW) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  stepProfile(dt);
  const c = colours();
  if (scene.clientWidth) {
    ctx.setTransform(scene.width / SW, 0, 0, scene.width / SW, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, SW, SH);
    ({ profile: drawProfile, temp: drawTemp, bonds: drawBonds })[state.tab](c);
  }
  if (state.tab === 'temp' && graph.clientWidth) {
    g.setTransform(graph.width / GW, 0, 0, graph.width / GW, 0, 0);
    g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
    drawTempGraph(c);
  }
  requestAnimationFrame(frame);
}

trReset();
showTab(['temp', 'bonds'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'profile');
requestAnimationFrame(frame);

// Share: your own profile and the temperature readings
PK.shareState = {
  get: () => ({ p: [prof.ex, prof.P, prof.E], t: [tr.start, tr.readings.map((q) => [q.x, q.t])] }),
  set: (o) => {
    if (Array.isArray(o.p)) { prof.ex = Math.max(0, Math.min(EXAMPLES.length - 1, Number(o.p[0]) || 0)); prof.P = Number(o.p[1]) || ex().P; prof.E = Number(o.p[2]) || ex().E; $('example').value = String(prof.ex); prof.moved = true; }
    if (Array.isArray(o.t) && Array.isArray(o.t[1]) && o.t[1].length) { tr.start = Number(o.t[0]) || 20; tr.readings = o.t[1].map(([x, t]) => ({ x: Number(x), t: Number(t) })); }
    renderPanel();
  },
};
