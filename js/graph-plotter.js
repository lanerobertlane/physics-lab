// Practical graph plotter: type in results, plot them as crosses on graph paper, then choose a line
// of best fit (none, straight, through the origin, or a smooth curve) to get the gradient, the
// equation of the line, and a warning about anomalous points. Tap a point to leave it out.

PK.header({
  title: 'Practical graph plotter',
  answers: true,
  specNote: 'AQA references are to Working scientifically (WS) and the Mathematical skills (MS), which are the same in GCSE Physics, Chemistry, Biology and Combined Science. KS3 references are to the National Curriculum programme of study.',
  spec: [
    { code: 'WS 2', text: 'Independent, dependent and control variables' },
    { code: 'WS 3', text: 'Present results as a graph: choose suitable scales, plot the points, and draw a line of best fit, either a straight line or a smooth curve' },
    { code: 'WS 3', text: 'Identify anomalous results' },
    { code: 'MS 4', text: 'Plot two variables from data, find the gradient and intercept of a straight line, understand y = m x + c, and recognise direct proportion' },
    { code: 'KS3', text: 'Present data using tables and graphs, and interpret it to identify patterns' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('plot'), ctx = cv.getContext('2d');
const W = 560, H = 440, ROWS = 12;
const FIT_COL = '#7c3aed', TRI = '#f57c00';

const EX = [
  { name: 'Hooke’s law: stretching a spring', x: ['Force', 'N'], y: ['Extension', 'cm'], pts: [[0, 0], [1, 2.1], [2, 4.0], [3, 6.2], [4, 9.5], [5, 10.1], [6, 12.0]] },
  { name: 'Resistance of a wire', x: ['Length', 'cm'], y: ['Resistance', 'Ω'], pts: [[10, 0.79], [20, 1.22], [30, 1.58], [40, 2.03], [50, 2.41], [60, 2.78], [70, 3.22], [80, 3.61], [90, 3.98]] },
  { name: 'A cooling cup of water', x: ['Time', 'min'], y: ['Temperature', '°C'], pts: [[0, 80], [1, 68], [2, 59], [3, 51], [4, 45], [5, 40], [6, 36], [7, 33], [8, 30], [9, 28], [10, 26]] },
  { name: 'Force and acceleration of a trolley', x: ['Force', 'N'], y: ['Acceleration', 'm/s²'], pts: [[0.2, 0.38], [0.4, 0.82], [0.6, 1.19], [0.8, 1.62], [1.0, 1.98]] },
  { name: 'Heating a metal block', x: ['Time', 's'], y: ['Temperature', '°C'], pts: [[0, 21.0], [60, 23.4], [120, 26.1], [180, 28.4], [240, 31.0], [300, 33.5], [360, 36.1], [420, 38.4]] },
  { name: 'Your own results', x: ['', ''], y: ['', ''], pts: [] },
];
// fit: −1 no line yet (you choose one), 0 straight, 1 straight through the origin, 2 smooth curve
// out: points you've tapped to leave out; keep: anomalous-looking points you've tapped to put back in
const st = { fit: -1, out: new Set(), keep: new Set() };

// ---------- The table ----------

$('rows').innerHTML = Array.from({ length: ROWS }, (_, i) => `<tr data-i="${i}"><td><input type="number" id="x${i}" step="any" inputmode="decimal" aria-label="x value ${i + 1}"></td><td><input type="number" id="y${i}" step="any" inputmode="decimal" aria-label="y value ${i + 1}"></td></tr>`).join('');
function points() {
  const out = [];
  for (let i = 0; i < ROWS; i++) {
    const xs = $(`x${i}`).value.trim(), ys = $(`y${i}`).value.trim();
    if (xs === '' || ys === '' || !Number.isFinite(Number(xs)) || !Number.isFinite(Number(ys))) continue;
    out.push({ i, x: Number(xs), y: Number(ys), out: st.out.has(i) });
  }
  return out;
}
function loadExample(k) {
  const e = EX[k];
  st.out = new Set(); st.keep = new Set();
  for (let i = 0; i < ROWS; i++) { const p = e.pts[i]; $(`x${i}`).value = p ? p[0] : ''; $(`y${i}`).value = p ? p[1] : ''; }
  $('xname').value = e.x[0]; $('xunit').value = e.x[1]; $('yname').value = e.y[0]; $('yunit').value = e.y[1];
  st.fit = -1;
  document.querySelectorAll('#fit .chip').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === st.fit)));
}
const label = (n, u) => (n ? `${n}${u ? ` / ${u}` : ''}` : '');

// ---------- Fitting ----------

// Least squares for a polynomial of the given degree (0 to 3)
function polyFit(pts, deg) {
  const n = deg + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (const p of pts) for (let r = 0; r < n; r++) { for (let c = 0; c < n; c++) A[r][c] += p.x ** (r + c); A[r][n] += p.y * p.x ** r; }
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    if (Math.abs(A[c][c]) < 1e-12) return null;
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
  }
  return A.map((row, r) => row[n] / A[r][r]);   // coefficients a0, a1, a2...
}
function fitLine(pts) {
  if (pts.length < 2 || st.fit < 0) return null;
  if (st.fit === 1) {
    const sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
    if (sxx < 1e-12) return null;
    const m = pts.reduce((a, p) => a + p.x * p.y, 0) / sxx;
    return { kind: 'line', m, c: 0, f: (x) => m * x };
  }
  if (st.fit === 2 && pts.length >= 3) {
    const co = polyFit(pts, pts.length >= 6 ? 3 : 2);
    if (!co) return null;
    return { kind: 'curve', f: (x) => co.reduce((a, k, i) => a + k * x ** i, 0), d: (x) => co.reduce((a, k, i) => a + (i ? i * k * x ** (i - 1) : 0), 0) };
  }
  const co = polyFit(pts, 1);
  if (!co) return null;
  return { kind: 'line', m: co[1], c: co[0], f: (x) => co[0] + co[1] * x };
}
// The line of best fit ignores anomalous points, as you would drawing it by hand: fit, find any points
// a long way from the line, fit again without them, and repeat until nothing changes.
function analyse(pts) {
  const kept = pts.filter((p) => !p.out);
  let fit = fitLine(kept), odd = [];
  for (let k = 0; fit && k < 4; k++) {
    const s = suspects(kept, fit).filter((p) => !st.keep.has(p.i)).map((p) => p.i);
    if (s.join() === odd.join()) break;
    odd = s;
    const again = fitLine(kept.filter((p) => !odd.includes(p.i)));
    if (!again) break;
    fit = again;
  }
  return { kept, fit, odd, used: kept.filter((p) => !odd.includes(p.i)), oddPts: kept.filter((p) => odd.includes(p.i)) };
}
// Points a long way from the line, compared with how far the others are
function suspects(pts, fit) {
  if (!fit || pts.length < 5) return [];
  const res = pts.map((p) => Math.abs(p.y - fit.f(p.x))), sorted = [...res].sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)];
  const span = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
  return pts.filter((p, k) => res[k] > Math.max(3.5 * med, 0.04 * span));
}

// ---------- Axes and drawing ----------

function niceAxis(lo, hi) {
  const span = Math.max(hi - lo, Math.abs(hi) * 0.1, 1e-6);
  for (let e = -4; e < 7; e++) for (const k of [1, 2, 5]) {
    const step = k * 10 ** e, a = Math.floor(lo / step + 1e-9) * step, n = Math.ceil((hi - a) / step - 1e-9);
    if (n <= 10 && n * step >= span * 0.999) return { a, step, n, b: a + n * step };
  }
  return { a: lo, step: span, n: 1, b: lo + span };
}
const PL = { L: 64, R: 18, T: 18, B: 54 };
// An axis for these values. It starts at zero unless that would squash the points into less than half
// of it: the points should fill at least half the grid, and the axes don't have to start at zero.
// A line through the origin needs the origin on the graph.
function axisFor(vals, zero) {
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const fromZero = zero || (lo >= 0 && hi > 0 && hi - lo >= 0.5 * hi);
  const pad = Math.max(hi - lo, Math.abs(hi) * 0.1, 1e-6) * 0.04;   // a little room, so no cross sits on the edge
  if (fromZero) { lo = Math.min(0, lo); hi = Math.max(0, hi); } else lo -= pad;
  return niceAxis(lo < 0 || !fromZero ? lo : 0, hi > 0 ? hi + pad : hi);
}
function geometry(pts) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), zero = st.fit === 1;
  const xA = axisFor(xs, zero), yA = axisFor(ys, zero);
  const pw = W - PL.L - PL.R, ph = H - PL.T - PL.B;
  return { xA, yA, X: (x) => PL.L + ((x - xA.a) / (xA.b - xA.a)) * pw, Y: (y) => PL.T + ph - ((y - yA.a) / (yA.b - yA.a)) * ph, pw, ph };
}
const fmt = (v, step) => { const dp = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)); return v.toFixed(dp); };
function draw() {
  if (!cv.clientWidth) return;
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), art: PK.cssVar('--art'), font: PK.cssVar('--font-body') || 'sans-serif' };
  ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
  const pts = points();
  if (!pts.length) {
    ctx.fillStyle = c.muted; ctx.font = `700 15px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Type your results into the table', W / 2, H / 2); return;
  }
  const geo = geometry(pts), { xA, yA, X, Y, pw, ph } = geo;
  // Graph paper: big squares and small ones
  ctx.lineWidth = 1;
  for (let i = 0; i <= xA.n * 5; i++) { const x = X(xA.a + (i * xA.step) / 5); ctx.strokeStyle = i % 5 ? c.grid : c.art; ctx.globalAlpha = i % 5 ? 0.6 : 0.5; ctx.beginPath(); ctx.moveTo(x, PL.T); ctx.lineTo(x, PL.T + ph); ctx.stroke(); }
  for (let i = 0; i <= yA.n * 5; i++) { const y = Y(yA.a + (i * yA.step) / 5); ctx.strokeStyle = i % 5 ? c.grid : c.art; ctx.globalAlpha = i % 5 ? 0.6 : 0.5; ctx.beginPath(); ctx.moveTo(PL.L, y); ctx.lineTo(PL.L + pw, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c.text; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(0 < xA.a ? xA.a : 0), PL.T); ctx.lineTo(X(0 < xA.a ? xA.a : 0), PL.T + ph); ctx.moveTo(PL.L, Y(0 < yA.a ? yA.a : 0)); ctx.lineTo(PL.L + pw, Y(0 < yA.a ? yA.a : 0)); ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = `600 12px ${c.font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i <= xA.n; i++) { const v = xA.a + i * xA.step; ctx.fillText(fmt(v, xA.step), X(v), PL.T + ph + 5); }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let i = 0; i <= yA.n; i++) { const v = yA.a + i * yA.step; ctx.fillText(fmt(v, yA.step), PL.L - 6, Y(v)); }
  ctx.fillStyle = c.text; ctx.font = `700 14px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label($('xname').value, $('xunit').value) || 'independent variable', PL.L + pw / 2, H - 16);
  ctx.save(); ctx.translate(16, PL.T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(label($('yname').value, $('yunit').value) || 'dependent variable', 0, 0); ctx.restore();
  // The line of best fit, through the points that are kept
  const { fit, odd, used } = analyse(pts), show = PK.answersShown();
  if (fit) {
    ctx.save(); ctx.beginPath(); ctx.rect(PL.L, PL.T, pw, ph); ctx.clip();
    ctx.strokeStyle = FIT_COL; ctx.lineWidth = 2.5; ctx.beginPath();
    const x0 = fit.kind === 'line' ? xA.a : Math.min(...used.map((p) => p.x)), x1 = fit.kind === 'line' ? xA.b : Math.max(...used.map((p) => p.x));
    for (let k = 0; k <= 120; k++) { const x = x0 + ((x1 - x0) * k) / 120; if (k) ctx.lineTo(X(x), Y(fit.f(x))); else ctx.moveTo(X(x), Y(fit.f(x))); }
    ctx.stroke();
    // A big gradient triangle on a straight line
    const tri = fit.kind === 'line' ? triangle(used, fit) : null;
    if (tri) {
      ctx.strokeStyle = TRI; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(X(tri.x1), Y(tri.y1)); ctx.lineTo(X(tri.x2), Y(tri.y1)); ctx.lineTo(X(tri.x2), Y(tri.y2)); ctx.stroke();
    }
    ctx.restore();
    if (tri && show) {
      const lab = (t, x, y, a) => { ctx.font = `800 12px ${c.font}`; ctx.textAlign = a; ctx.lineWidth = 4; ctx.strokeStyle = c.surface; ctx.strokeText(t, x, y); ctx.fillStyle = TRI; ctx.fillText(t, x, y); };
      lab(`Δx = ${PK.sig(tri.x2 - tri.x1, 3)}`, (X(tri.x1) + X(tri.x2)) / 2, Y(tri.y1) + (tri.y2 > tri.y1 ? 14 : -14), 'center');
      lab(`Δy = ${PK.sig(tri.y2 - tri.y1, 3)}`, X(tri.x2) + 6, (Y(tri.y1) + Y(tri.y2)) / 2, 'left');
    }
  }
  // The points, as crosses
  for (const p of pts) {
    const x = X(p.x), y = Y(p.y);
    ctx.strokeStyle = p.out ? c.muted : c.text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
    if (p.out) { ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (odd.includes(p.i)) { ctx.strokeStyle = '#e65100'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function triangle(pts, fit) {
  const xs = pts.map((p) => p.x), lo = Math.min(...xs), hi = Math.max(...xs);
  if (hi - lo <= 0) return null;
  const x1 = lo + (hi - lo) * 0.1, x2 = lo + (hi - lo) * 0.9;
  return { x1, x2, y1: fit.f(x1), y2: fit.f(x2) };
}

// ---------- The panel ----------

function render() {
  const pts = points(), { kept, fit, used, oddPts } = analyse(pts);
  const xn = $('xname').value || 'x', yn = $('yname').value || 'y', xu = $('xunit').value, yu = $('yunit').value;
  $('xhead').textContent = xu ? `${xn} (${xu})` : xn; $('yhead').textContent = yu ? `${yn} (${yu})` : yn;
  document.querySelectorAll('#rows tr').forEach((tr) => tr.classList.toggle('out', st.out.has(Number(tr.dataset.i))));
  if (kept.length < 2) { $('info').innerHTML = '<p class="note" style="margin:0">Type in at least two results.</p>'; draw(); return; }
  let html = `<p style="margin-top:0"><b>Independent variable:</b> ${xn}, along the bottom.<br><b>Dependent variable:</b> ${yn}, up the side.</p>`;
  if (!fit) {
    $('info').innerHTML = html + `<p class="note" style="margin-bottom:0">${st.fit < 0 ? 'Look at the pattern of the crosses first. Do they lie on a straight line or a curve? Would a straight line go through the origin? Then choose a line of best fit in the set-up.' : 'A curve needs at least three results.'}</p>`;
    draw(); return;
  }
  const unit = yu && xu ? `${yu}/${xu}` : yu ? yu : '', odd = oddPts;
  if (fit.kind === 'line') {
    const tri = triangle(used, fit), span = Math.max(...used.map((p) => p.y)) - Math.min(...used.map((p) => p.y), 0);
    const through = st.fit === 1 || Math.abs(fit.c) < 0.03 * Math.max(span, 1e-9);
    html += `<div class="working">
      <p><b>Gradient</b> = Δy ÷ Δx = ${PK.ans(`${PK.sig(tri.y2 - tri.y1, 3)} ÷ ${PK.sig(tri.x2 - tri.x1, 3)} = <b>${PK.sig(fit.m, 3)}${unit ? ` ${unit}` : ''}</b>`)}</p>
      ${st.fit === 1 ? '' : `<p><b>Intercept</b> (where it crosses the y-axis) = ${PK.ans(`${PK.sig(fit.c, 2)}${yu ? ` ${yu}` : ''}`)}</p>`}
      <p><b>Equation</b>: ${PK.ans(`y = ${PK.sig(fit.m, 3)}x${st.fit === 1 ? '' : ` ${fit.c < 0 ? '−' : '+'} ${PK.sig(Math.abs(fit.c), 2)}`}`)}</p>
    </div>
    <p class="note">${PK.ans(fit.m > 0 ? (through ? `A straight line through the origin: ${yn.toLowerCase()} is <b>directly proportional</b> to ${xn.toLowerCase()}.` : `A straight line that doesn’t go through the origin: ${yn.toLowerCase()} goes up steadily with ${xn.toLowerCase()}, but isn’t directly proportional to it. A line that misses the origin can be a sign of a zero error.`)
      : `A straight line going down: as ${xn.toLowerCase()} increases, ${yn.toLowerCase()} decreases steadily.`)}</p>`;
  } else {
    const xs = kept.map((p) => p.x), a = Math.min(...xs), b = Math.max(...xs), d1 = fit.d(a + (b - a) * 0.2), d2 = fit.d(a + (b - a) * 0.8);
    const up = fit.f(b) > fit.f(a), slowing = Math.abs(d2) < Math.abs(d1);
    html += `<p class="note">${PK.ans(`A curve: as ${xn.toLowerCase()} increases, ${yn.toLowerCase()} ${up ? 'increases' : 'decreases'}, ${slowing ? 'more and more slowly' : 'more and more quickly'}.`)} To find the gradient at one point on a curve, draw a tangent there.</p>`;
  }
  const many = odd.length > 1, at = odd.map((p) => `(${p.x}, ${p.y})`).join(' and ');
  if (odd.length) html += `<p class="note" style="margin-bottom:0"><span class="badge bad">Anomalous</span> The point${many ? 's' : ''} at ${at} ${many ? 'are' : 'is'} a long way from the pattern of the others, so the line of best fit ignores ${many ? 'them' : 'it'}. Tap ${many ? 'them' : 'it'} to put ${many ? 'them' : 'it'} back in.</p>`;
  const kept2 = [...st.keep].filter((i) => kept.some((p) => p.i === i)).length;
  if (kept2) html += `<p class="note" style="margin-bottom:0">You’ve put ${kept2} anomalous point${kept2 > 1 ? 's' : ''} back into the line. Tap ${kept2 > 1 ? 'them' : 'it'} again to leave ${kept2 > 1 ? 'them' : 'it'} out.</p>`;
  if (st.out.size) html += `<p class="note" style="margin-bottom:0">${st.out.size} point${st.out.size > 1 ? 's are' : ' is'} left out of the line. Tap ${st.out.size > 1 ? 'them' : 'it'} again to put ${st.out.size > 1 ? 'them' : 'it'} back.</p>`;
  $('info').innerHTML = html;
  draw();
}

// ---------- Controls ----------

$('example').innerHTML = EX.map((e, i) => `<option value="${i}">${e.name}</option>`).join('');
$('example').addEventListener('change', (e) => { loadExample(Number(e.target.value)); render(); });
PK.chips('fit', (v) => { st.fit = v; render(); });
$('rows').addEventListener('input', render);
for (const id of ['xname', 'xunit', 'yname', 'yunit']) $(id).addEventListener('input', render);
$('clear').addEventListener('click', () => { for (let i = 0; i < ROWS; i++) { $(`x${i}`).value = ''; $(`y${i}`).value = ''; } st.out = new Set(); st.keep = new Set(); $('example').value = String(EX.length - 1); render(); });
window.addEventListener('pk-answers', render);
window.addEventListener('pk-theme', render);
// Tap a point to leave it out of the line (or put it back)
PK.dragOn(cv, W, H, {
  hit: (p) => {
    const pts = points(); if (!pts.length) return null;
    const { X, Y } = geometry(pts);
    let best = null, bd = 18;
    for (const q of pts) { const d = Math.hypot(X(q.x) - p.x, Y(q.y) - p.y); if (d < bd) { bd = d; best = q.i; } }
    return best === null ? null : { i: best };
  },
  // Tap: put a left-out point back, put an ignored anomaly back in, or leave a point out
  tap: (h) => {
    const { odd } = analyse(points());
    if (st.out.has(h.i)) st.out.delete(h.i);
    else if (odd.includes(h.i)) st.keep.add(h.i);
    else if (st.keep.has(h.i)) st.keep.delete(h.i);
    else st.out.add(h.i);
    render();
  },
});
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); draw(); }
window.addEventListener('resize', size);

loadExample(0);
size();
render();

// Share: the names of the variables and which points are left out (the numbers are shared anyway)
PK.shareState = {
  get: () => ({ n: ['xname', 'xunit', 'yname', 'yunit'].map((id) => $(id).value.slice(0, 40)), o: [...st.out], k: [...st.keep] }),
  set: (o) => {
    if (Array.isArray(o.n)) ['xname', 'xunit', 'yname', 'yunit'].forEach((id, k) => { $(id).value = String(o.n[k] ?? '').slice(0, 40); });
    if (Array.isArray(o.o)) st.out = new Set(o.o.map(Number));
    if (Array.isArray(o.k)) st.keep = new Set(o.k.map(Number));
    render();
  },
};
