// Transformers: Vp / Vs = np / ns, and for a 100% efficient transformer Vp Ip = Vs Is.
// Only an alternating current makes a changing magnetic field, so d.c. induces nothing.

PK.header({
  title: 'Transformers',
  answers: true,
  spec: [
    { code: '4.2.4.3', text: 'The National Grid: step-up transformers increase the potential difference and step-down transformers decrease it' },
    { code: '4.7.3.4', text: 'Transformers: a primary and a secondary coil on an iron core; an alternating current induces an alternating p.d.; Vp / Vs = np / ns', po: true, ht: true },
    { code: '4.7.3.4', text: 'Vs × Is = Vp × Ip for a 100% efficient transformer', po: true, ht: true },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const cv = $('tf'), ctx = cv.getContext('2d');
const W = 800, H = 400;
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }
const fmt = (x) => PK.sig(x, 3);
// What the secondary coil powers: rated p.d. (V), power (W) and resistance (Ω)
const LOADS = {
  charger: { name: 'phone charger', label: '5 V phone charger', v: 5, p: 10, r: 2.5 },
  lamp12: { name: '12 V lamp', label: '12 V lamp', v: 12, p: 24, r: 6 },
  lamp230: { name: '230 V lamp', label: '230 V lamp', v: 230, p: 60, r: 880 },
  neon: { name: 'neon sign', label: '2000 V neon sign', v: 2000, p: 50, r: 80000 },
};
const load = () => LOADS[state.load];

const state = { ac: true, vp: 230, np: 1150, ns: 60, blown: false, load: 'lamp12' };
function calc() {
  const vs = state.ac ? (state.vp * state.ns) / state.np : 0;
  const is = state.blown ? 0 : vs / load().r;
  const p = vs * is, ip = state.ac ? p / state.vp : 0;
  return { vs, is, ip, p };
}

function render() {
  const c = calc();
  if (c.vs > 1.6 * load().v && !state.blown && state.ac) { state.blown = true; return render(); }
  const kind = !state.ac ? 'none (d.c.)' : state.ns > state.np ? 'step-up' : state.ns < state.np ? 'step-down' : 'neither (same turns)';
  $('readout').innerHTML = `
    <dt>Type of transformer</dt><dd>${state.ac ? PK.ans(kind) : kind}</dd>
    <dt>Primary p.d., V<sub>p</sub></dt><dd>${state.vp} V ${state.ac ? 'a.c.' : 'd.c.'}</dd>
    <dt>Secondary p.d., V<sub>s</sub></dt><dd>${PK.ans(`${fmt(c.vs)} V`)}</dd>
    <dt>Secondary current, I<sub>s</sub></dt><dd>${PK.ans(`${fmt(c.is)} A`)}</dd>
    <dt>Primary current, I<sub>p</sub></dt><dd>${PK.ans(`${fmt(c.ip)} A`)}</dd>
    <dt>Power (in = out)</dt><dd>${PK.ans(`${fmt(c.p)} W`)}</dd>`;
  if (!state.ac) {
    $('working').innerHTML = '<p><b>Nothing happens with d.c.</b> A steady current makes a steady magnetic field in the core. The field isn’t changing, so no p.d. is induced in the secondary coil.</p><p>(A p.d. is only induced for a moment when the d.c. is switched on or off, as the field grows or collapses.)</p>';
    return;
  }
  const A = (x) => PK.ans(x);   // every number hides with the answers
  // VESRAU: values, equation, substitution, rearrangement, answer and unit. The value being found
  // is written as its own symbol (Vs = Vs), not a question mark.
  const v = (sym, val) => `<span class="v">${sym} = ${val}</span>`;
  const step = (title, lines) => `<div class="vesrau"><h3>${title}</h3>${lines.map((l, i) => `<div${i === lines.length - 1 ? ' class="ans"' : ''}>${l}</div>`).join('')}</div>`;
  const Vs = fmt(c.vs), Is = fmt(c.is), Ip = fmt(c.ip);
  const s1 = step('1. The p.d. across the secondary coil', [
    `${v('V<sub>p</sub>', `${A(state.vp)} V`)}${v('n<sub>p</sub>', A(state.np))}${v('n<sub>s</sub>', A(state.ns))}${v('V<sub>s</sub>', 'V<sub>s</sub>')}`,
    'V<sub>p</sub> ÷ V<sub>s</sub> = n<sub>p</sub> ÷ n<sub>s</sub>',
    `${A(state.vp)} ÷ V<sub>s</sub> = ${A(state.np)} ÷ ${A(state.ns)}`,
    `V<sub>s</sub> = ${A(state.vp)} × ${A(state.ns)} ÷ ${A(state.np)}`,
    `V<sub>s</sub> = ${PK.ans(`${Vs} V`)}`,
  ]);
  if (state.blown) {
    $('working').innerHTML = `${s1}<p><b>The ${load().name} has burnt out!</b> ${PK.ans(`${Vs} V`)} is far more than its ${A(load().v)} V rating. Change the turns to make about ${A(load().v)} V, and it is replaced.</p>`;
    return;
  }
  const s2 = step(`2. The current in the ${load().name}`, [
    `${v('V<sub>s</sub>', PK.ans(`${Vs} V`))}${v('R', `${A(fmt(load().r))} Ω`)}${v('I<sub>s</sub>', 'I<sub>s</sub>')}`,
    'V = I R',
    `${PK.ans(Vs)} = I<sub>s</sub> × ${A(fmt(load().r))}`,
    `I<sub>s</sub> = ${PK.ans(Vs)} ÷ ${A(fmt(load().r))}`,
    `I<sub>s</sub> = ${PK.ans(`${Is} A`)}`,
  ]);
  const s3 = step('3. The current in the primary coil', [
    `${v('V<sub>p</sub>', `${A(state.vp)} V`)}${v('V<sub>s</sub>', PK.ans(`${Vs} V`))}${v('I<sub>s</sub>', PK.ans(`${Is} A`))}${v('I<sub>p</sub>', 'I<sub>p</sub>')}`,
    'V<sub>p</sub> × I<sub>p</sub> = V<sub>s</sub> × I<sub>s</sub>',
    `${A(state.vp)} × I<sub>p</sub> = ${PK.ans(Vs)} × ${PK.ans(Is)}`,
    `I<sub>p</sub> = ${PK.ans(Vs)} × ${PK.ans(Is)} ÷ ${A(state.vp)}`,
    `I<sub>p</sub> = ${PK.ans(`${Ip} A`)}`,
  ]);
  $('working').innerHTML = `${s1}${s2}${s3}
    <p class="note">${state.ns < state.np ? 'A step-down transformer lowers the p.d. but raises the current.' : state.ns > state.np ? 'A step-up transformer raises the p.d. but lowers the current: that is why the National Grid uses them to send power at high p.d.' : 'With equal turns the p.d. stays the same.'}</p>`;
}

// ---------- Picture ----------

let t = 0;
function coil(x, y0, y1, n, phase, amp, col) {
  const turns = Math.max(2, Math.min(26, Math.round(n / 60)));
  const gap = (y1 - y0) / turns;
  ctx.strokeStyle = col; ctx.lineWidth = 3;
  for (let i = 0; i < turns; i++) {
    const y = y0 + gap * (i + 0.5);
    ctx.beginPath(); ctx.ellipse(x, y, 34, Math.min(7, gap * 0.45), 0, 0, Math.PI * 2); ctx.stroke();
  }
}
function wire(points, current, phase) {
  ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3; ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  // Charges moving back and forth (a.c.) to show the current
  if (Math.abs(current) < 1e-3) return;
  let total = 0; const seg = [];
  for (let i = 1; i < points.length; i++) { const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]); seg.push(l); total += l; }
  const shift = Math.sin(phase) * 18 * Math.min(1, Math.abs(current));
  ctx.fillStyle = '#ffd54f';
  for (let d = 10; d < total; d += 26) {
    let s = (d + shift + total) % total, i = 0;
    while (s > seg[i]) { s -= seg[i]; i++; }
    const f = s / seg[i], x = points[i][0] + (points[i + 1][0] - points[i][0]) * f, y = points[i][1] + (points[i + 1][1] - points[i][1]) * f;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
}
function label(txt, x, y, o = {}) {
  ctx.fillStyle = o.col || PK.cssVar('--text'); ctx.font = `${o.w || 700} ${o.s || 13}px ${font()}`;
  ctx.textAlign = o.a || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
}

function draw(dt) {
  t += dt;
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(0, 0, W, H);
  const c = calc();
  const phase = state.ac ? t * Math.PI * 2 * 0.8 : 0;          // slowed right down so you can see it
  const flux = state.ac ? Math.sin(phase) : 1;
  // Iron core, coloured by the field strength
  const ci = Math.abs(flux);
  ctx.fillStyle = `rgb(${120 + 60 * ci}, ${125 + 20 * ci}, ${135 - 30 * ci})`;
  ctx.fillRect(260, 60, 280, 40); ctx.fillRect(260, 300, 280, 40); ctx.fillRect(260, 60, 40, 280); ctx.fillRect(500, 60, 40, 280);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(300, 100, 200, 200);
  label('iron core', 400, 200, { col: PK.cssVar('--muted') });
  // Field arrows round the core
  ctx.fillStyle = 'rgba(124, 58, 237, .85)';
  const dir = flux >= 0 ? 1 : -1;
  if (ci > 0.15) for (const [x, y, ang] of [[400, 80, 0], [520, 200, Math.PI / 2], [400, 320, Math.PI], [280, 200, -Math.PI / 2]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + (dir < 0 ? Math.PI : 0)); ctx.scale(0.6 + ci * 0.6, 0.6 + ci * 0.6);
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  label(state.ac ? 'changing magnetic field' : 'steady magnetic field', 400, 50, { s: 12, col: '#7c3aed' });
  // Coils
  coil(280, 110, 290, state.np, phase, 1, '#c77845');
  coil(520, 110, 290, state.ns, phase, 1, '#c77845');
  label(`primary: ${state.np} turns`, 230, 360, { s: 14 });
  label(`secondary: ${state.ns} turns`, 570, 360, { s: 14 });
  label('Drag a coil up or down to change its turns', 400, 385, { s: 14 });
  // Supply and wires
  wire([[246, 115], [140, 115], [140, 285], [246, 285]], state.ac ? c.ip * 3 : 0.5, phase);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.strokeStyle = PK.cssVar('--text'); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(140, 200, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (state.ac) { ctx.beginPath(); for (let x = -14; x <= 14; x++) { const y = -Math.sin((x / 14) * Math.PI) * 8; if (x === -14) ctx.moveTo(140 + x, 200 + y); else ctx.lineTo(140 + x, 200 + y); } ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(130, 188); ctx.lineTo(130, 212); ctx.moveTo(146, 194); ctx.lineTo(146, 206); ctx.stroke(); }
  label(`${state.vp} V ${state.ac ? 'a.c.' : 'd.c.'}`, 70, 200, { s: 14, w: 800 });
  wire([[554, 115], [690, 115], [690, 175]], c.is / 2, phase);
  wire([[690, 225], [690, 285], [554, 285]], c.is / 2, phase);
  // Lamp
  const bright = state.blown ? 0 : Math.min(1.3, c.vs / load().v) * (state.ac ? Math.abs(Math.sin(phase)) * 0.25 + 0.75 : 0);
  if (bright > 0.05) { const g = ctx.createRadialGradient(690, 200, 4, 690, 200, 70); g.addColorStop(0, `rgba(255, 230, 120, ${Math.min(0.9, bright)})`); g.addColorStop(1, 'rgba(255, 230, 120, 0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(690, 200, 70, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = bright > 0.05 ? `rgb(255, ${200 + 55 * Math.min(1, bright)}, ${100 + 80 * Math.min(1, bright)})` : PK.cssVar('--surface-2');
  ctx.strokeStyle = PK.cssVar('--text'); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(690, 200, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(673, 183); ctx.lineTo(707, 217); ctx.moveTo(707, 183); ctx.lineTo(673, 217); ctx.stroke();
  label(state.blown ? 'BURNT OUT!' : load().label, 690, 245, { s: 12, w: 800, col: state.blown ? '#c62828' : undefined });
  label(`${PK.ansText(fmt(c.vs))} V`, 750, 200, { s: 14, w: 800 });
  label(c.vs > 0 && !state.blown ? (state.ns > state.np ? 'step-up' : state.ns < state.np ? 'step-down' : '') : state.ac ? '' : 'no output', 690, 150, { s: 12, col: PK.cssVar('--muted') });
}

// ---------- Controls ----------

function setTurns(which, v) { state[which] = v; if (state.blown && (state.vp * state.ns) / state.np <= 1.6 * load().v) state.blown = false; render(); }
PK.dragOn(cv, W, H, {
  hit: (p) => { if (p.y < 95 || p.y > 305) return null; return Math.abs(p.x - 280) < 75 ? { k: 'np', n: state.np } : Math.abs(p.x - 520) < 75 ? { k: 'ns', n: state.ns } : null; },
  move: (d, p, s) => {
    const n = Math.max(10, Math.min(2000, Math.round((d.n + (s.y - p.y) * 5) / 10) * 10));
    PK.setNum(d.k, n); setTurns(d.k, n);
  },
});
$('np').addEventListener('input', () => setTurns('np', PK.num('np')));
$('ns').addEventListener('input', () => setTurns('ns', PK.num('ns')));
document.querySelectorAll('#vp .chip').forEach((b) => b.addEventListener('click', () => {
  state.vp = Number(b.dataset.v);
  // Sensible starting turns for each supply, giving 12 V
  suggestTurns();
  document.querySelectorAll('#vp .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  render();
}));
// Choose turns that give the rated p.d. for the chosen output
function suggestTurns() {
  const ratio = load().v / state.vp;
  let best = null;
  for (let np = 10; np <= 2000; np += 10) {
    const ns = Math.round((np * ratio) / 10) * 10;
    if (ns < 10 || ns > 2000) continue;
    const err = Math.abs((ns / np) / ratio - 1), score = err * 1000 + Math.abs(np - 1000) / 1000;
    if (!best || score < best.score) best = { np, ns, score };
  }
  if (best) { state.np = best.np; state.ns = best.ns; }
  $('np').value = state.np; $('ns').value = state.ns; state.blown = false;
}
document.querySelectorAll('#load .chip').forEach((b) => b.addEventListener('click', () => {
  state.load = b.dataset.l;
  document.querySelectorAll('#load .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  suggestTurns(); render();
}));
window.addEventListener('pk-answers', render);
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; draw(dt); requestAnimationFrame(frame); }
size(); render(); requestAnimationFrame(frame);
