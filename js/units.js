// Units, prefixes and standard form: a ladder of prefixes to convert between, and the decimal point
// hopping place by place to write numbers in standard form. Its Practice questions tab gets new
// conversion questions every time (PK.practiceGen, below).

PK.header({
  title: 'Units, prefixes & standard form',
  answers: true,
  specNote: 'AQA references are to Working scientifically (WS) and the Mathematical skills (MS), which are the same in GCSE Physics, Chemistry, Biology and Combined Science. KS3 references are to the National Curriculum programme of study.',
  spec: [
    { code: 'WS 4', text: 'Use SI units (for example kg, g, mg; km, m, mm; kJ, J) and interconvert units' },
    { code: 'WS 4', text: 'Use prefixes and powers of ten for orders of magnitude: tera, giga, mega, kilo, centi, milli, micro and nano' },
    { code: 'MS 1', text: 'Recognise and use expressions in decimal form and in standard form' },
    { code: 'KS3', text: 'Understand and use SI units' },
  ],
});

const $ = (id) => document.getElementById(id);
const scene = $('scene'), ctx = scene.getContext('2d');
const SW = 560, SIZE = { prefixes: 320, sform: 300 };
const state = { tab: 'prefixes' };
const SH = () => SIZE[state.tab];
const ORANGE = '#ef6c00', BLUE = '#1565c0';

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border-strong'), art: PK.cssVar('--art'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function txt(c, s, x, y, size, col, align = 'left', weight = 800) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y);
}
// Text that wraps onto more lines, centred on x
function wrapText(c, s, x, y, maxW, size, col, lineH = size * 1.3) {
  ctx.font = `800 ${size}px ${c.font}`;
  const lines = [];
  let line = '';
  for (const w of s.split(' ')) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line);
  lines.forEach((l, i) => txt(c, l, x, y + (i - (lines.length - 1) / 2) * lineH, size, col, 'center'));
}

// ---------- Numbers as digits ----------
// A number is kept as its digits and where the decimal point is, so moving the point is exact
// (4.7 × 1000 is 4700, not 4700.000000000001).

function parse(str) {
  let s = String(str ?? '').trim().replace(/[\s ]/g, '').replace('−', '-');
  if (!/^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const neg = s[0] === '-';
  if (neg) s = s.slice(1);
  let exp = 0;
  const m = s.match(/e([-+]?\d+)$/i);
  if (m) { exp = Number(m[1]); s = s.slice(0, m.index); }
  const dot = s.indexOf('.');
  return { neg, digits: s.replace('.', '') || '0', point: (dot < 0 ? s.length : dot) + exp };
}
const shift = (n, k) => ({ ...n, point: n.point + k });
const valueOf = (n) => Number(`${n.neg ? '-' : ''}0.${n.digits}e${n.point}`);
const isZero = (n) => !/[1-9]/.test(n.digits);
const SP = ' ';   // a thin space that doesn't break, between groups of three digits
// Write a number out in full, without zeros that don't matter, with spaces in long numbers
function plain(n, spaces = true) {
  let { digits, point } = n;
  if (point <= 0) { digits = '0'.repeat(1 - point) + digits; point = 1; }
  if (point > digits.length) digits += '0'.repeat(point - digits.length);
  let int = digits.slice(0, point).replace(/^0+(?=\d)/, ''), frac = digits.slice(point).replace(/0+$/, '');
  if (spaces && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, SP);
  if (spaces && frac.length > 4) frac = frac.replace(/(\d{3})(?=\d)/g, `$1${SP}`);
  return `${n.neg && !isZero(n) ? '−' : ''}${int}${frac ? `.${frac}` : ''}`;
}
// Standard form: a, at least 1 and less than 10, times 10 to the power e
function toSF(n) {
  const f = n.digits.search(/[1-9]/);
  if (f < 0) return { a: '0', e: 0, neg: false, zero: true };
  const rest = n.digits.slice(f + 1).replace(/0+$/, '');
  return { a: n.digits[f] + (rest ? `.${rest}` : ''), e: n.point - f - 1, neg: n.neg };
}
const SUP = (e) => String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const sfText = (s) => (s.zero ? '0' : `${s.neg ? '−' : ''}${s.a} × 10${SUP(s.e)}`);
const sfHtml = (s) => (s.zero ? '0' : `${s.neg ? '−' : ''}${s.a} × 10<sup>${String(s.e).replace('-', '−')}</sup>`);
// "1000" for 10³, but 10⁹ stays as a power
const powText = (k) => (k <= 6 ? plain(parse(`1e${k}`)) : `10${SUP(k)}`);
const places = (k) => `${Math.abs(k)} place${Math.abs(k) === 1 ? '' : 's'}`;

// ---------- Prefixes and units ----------

const PRE = [
  { s: 'T', name: 'tera', e: 12 }, { s: 'G', name: 'giga', e: 9 }, { s: 'M', name: 'mega', e: 6 }, { s: 'k', name: 'kilo', e: 3 },
  { s: '', name: 'no prefix', e: 0 },
  { s: 'c', name: 'centi', e: -2 }, { s: 'm', name: 'milli', e: -3 }, { s: 'μ', name: 'micro', e: -6 }, { s: 'n', name: 'nano', e: -9 },
];
const BASE = 4;
const idx = (s) => PRE.findIndex((p) => p.s === s);
const UNITS = [['m', 'metres'], ['g', 'grams'], ['s', 'seconds'], ['J', 'joules'], ['W', 'watts'], ['N', 'newtons'], ['Pa', 'pascals'], ['A', 'amps'], ['V', 'volts'], ['Ω', 'ohms'], ['Hz', 'hertz']];
const unitName = (u) => (UNITS.find((x) => x[0] === u) || [u, u])[1];
// Examples: value, unit, from, to
const PEGS = [['4.7', 'Ω', 'k', ''], ['250', 'A', 'm', ''], ['3.2', 'J', 'M', ''], ['650', 'm', 'n', ''], ['75', 'g', '', 'k'], ['2.4', 'Hz', 'G', ''], ['45', 'm', 'c', '']];

// The cells for the decimal point to hop along, with zeros added where it runs off either end
function hopCells(n, k) {
  const p1 = n.point + k, lo = Math.min(n.point, p1), hi = Math.max(n.point, p1);
  const left = Math.max(0, 1 - lo), right = Math.max(0, hi - n.digits.length);
  const cells = [...'0'.repeat(left)].map((d) => ({ d, pad: true }))
    .concat([...n.digits].map((d) => ({ d, pad: false })), [...'0'.repeat(right)].map((d) => ({ d, pad: true })));
  return { cells, p0: n.point + left, p1: p1 + left };
}
// The digits in boxes, and the decimal point hopping from box to box, one hop at a time
function drawHops(c, h, x, y, maxW, t, show, centre = false) {
  const n = h.cells.length, cw = Math.min(30, maxW / n), ch = Math.min(36, cw * 1.3), k = h.p1 - h.p0, steps = Math.abs(k);
  const done = show ? Math.min(steps, Math.floor(t / 0.3)) : 0, final = show && done === steps;
  const x0 = centre ? x - (n * cw) / 2 : x, at = h.p0 + Math.sign(k) * done;
  const first = h.cells.findIndex((q) => q.d !== '0'), last = n - 1 - [...h.cells].reverse().findIndex((q) => q.d !== '0');
  h.cells.forEach((q, i) => {
    const cx = x0 + i * cw;
    // Zeros that don't matter in the answer are greyed out once the point has moved
    const dropped = final && first >= 0 && ((i < first && i < h.p1 - 1) || (i >= h.p1 && i > last));
    ctx.fillStyle = q.pad && final ? 'rgba(239, 108, 0, .16)' : c.surface2;
    ctx.fillRect(cx + 1, y, cw - 2, ch);
    if (q.pad && !final) { ctx.strokeStyle = c.border; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeRect(cx + 1.5, y + 0.5, cw - 3, ch - 1); ctx.setLineDash([]); }
    if (!q.pad || final) { ctx.globalAlpha = dropped ? 0.35 : 1; txt(c, q.d, cx + cw / 2, y + ch / 2, Math.round(cw * 0.72), q.pad ? ORANGE : c.text, 'center'); ctx.globalAlpha = 1; }
  });
  const px = (p) => x0 + p * cw, dotY = y + ch - 4, r = Math.max(2.5, cw * 0.12);
  // Hops made so far, numbered
  ctx.strokeStyle = '#c62828'; ctx.fillStyle = '#c62828'; ctx.lineWidth = 1.8;
  for (let j = 1; j <= done; j++) {
    const a = px(h.p0 + Math.sign(k) * (j - 1)), b = px(h.p0 + Math.sign(k) * j), m = (a + b) / 2;
    ctx.beginPath(); ctx.moveTo(a, y - 2); ctx.quadraticCurveTo(m, y - 16, b, y - 2); ctx.stroke();
    if (cw >= 13 || j === done) txt(c, String(j), m, y - 17, cw >= 18 ? 11 : 9, '#c62828', 'center', 800);
  }
  if (steps && done) { ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(px(h.p0), dotY, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  // Only show a point at the end if something follows it
  if (at < n || !final) { ctx.beginPath(); ctx.arc(px(at), dotY, r * 1.4, 0, Math.PI * 2); ctx.fill(); }
  return { x0, w: n * cw, ch };
}

// ---------- The prefix ladder ----------

const LAD = { x: 14, w: 186, top: 26, row: 31, h: 25 };
const rowMid = (i) => LAD.top + i * LAD.row + LAD.h / 2;
function drawPrefix(c, P) {
  const { from, to, unit } = P;
  pf.badge = null;
  txt(c, '▲ bigger units', LAD.x + 4, 12, 11, c.muted, 'left', 700);
  txt(c, '▼ smaller units', LAD.x + 4, rowMid(8) + 22, 11, c.muted, 'left', 700);
  PRE.forEach((p, i) => {
    const y = LAD.top + i * LAD.row, F = i === from, T = i === to, col = F || T ? '#fff' : c.text;
    ctx.fillStyle = F ? BLUE : T ? ORANGE : c.surface2;
    ctx.beginPath(); ctx.roundRect(LAD.x, y, LAD.w, LAD.h, 6); ctx.fill();
    txt(c, p.name, LAD.x + 10, y + LAD.h / 2, 12, col, 'left', 700);
    txt(c, p.s + unit, LAD.x + 112, y + LAD.h / 2, 14, col, 'center');
    txt(c, p.e ? `× 10${SUP(p.e)}` : '× 1', LAD.x + LAD.w - 8, y + LAD.h / 2, 12, col, 'right', 700);
  });
  const k = PRE[from].e - PRE[to].e, n = P.n;
  if (from !== to) {
    const ax = LAD.x + LAD.w + 4, y1 = rowMid(from), y2 = rowMid(to), bend = 34 + Math.abs(to - from) * 2;
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, y1); ctx.bezierCurveTo(ax + bend, y1, ax + bend, y2, ax + 8, y2); ctx.stroke();
    ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.moveTo(ax, y2); ctx.lineTo(ax + 11, y2 - 6); ctx.lineTo(ax + 11, y2 + 6); ctx.closePath(); ctx.fill();
    // The label on the arrow is a button: tap it to swap the conversion round (kg → g becomes g → kg)
    const label = `${k > 0 ? `× 10${SUP(k)}` : `÷ 10${SUP(-k)}`} ⇅`, bx = ax + bend * 0.75, by = (y1 + y2) / 2;
    ctx.font = `800 12px ${c.font}`;
    const w = ctx.measureText(label).width + 12;
    ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.roundRect(bx - w / 2, by - 11, w, 22, 11); ctx.fill();
    txt(c, label, bx, by, 12, '#fff', 'center');
    if (P.hint) pf.badge = { x: bx - w / 2, y: by - 11, w, h: 22 };
  }
  // The conversion, in words and with the decimal point moving
  const X0 = 284, fromU = PRE[from].s + unit, toU = PRE[to].s + unit;
  if (!n) { txt(c, 'Type a number in the Value box', X0, 60, 14, c.muted, 'left', 700); return; }
  const r = shift(n, k);
  txt(c, `${plain(n)} ${fromU}`, X0, 40, 24, BLUE);
  txt(c, `= ${P.show ? plain(r) : '?'} ${toU}`, X0, 76, 24, ORANGE);
  const why = k > 0 ? [`${toU} is ${k} power${k > 1 ? 's' : ''} of ten smaller,`, `so the number gets bigger: × ${powText(k)}`]
    : k < 0 ? [`${toU} is ${-k} power${k < -1 ? 's' : ''} of ten bigger,`, `so the number gets smaller: ÷ ${powText(-k)}`]
      : ['The same prefix, so the', 'number doesn’t change.'];
  txt(c, why[0], X0, 110, 13, c.text, 'left', 700); txt(c, why[1], X0, 128, 13, c.text, 'left', 700);
  const h = hopCells(n, k);
  if (k && h.cells.length <= 26) {
    if (P.show) txt(c, `Move the decimal point ${places(k)} ${k > 0 ? 'right' : 'left'}:`, X0, 154, 12, '#c62828', 'left', 700);
    drawHops(c, h, X0, 188, SW - X0 - 12, P.t, P.show);
  } else if (k) txt(c, `Move the decimal point ${places(k)} ${k > 0 ? 'right' : 'left'}`, X0, 188, 12, '#c62828', 'left', 700);
  txt(c, 'In standard form', X0, 250, 12, c.muted, 'left', 700);
  txt(c, P.show ? `${sfText(toSF(r))} ${toU}` : '?', X0, 274, 19, c.text);
  if (P.hint) txt(c, 'Tap a step to change to it, drag the blue step, or tap ⇅ to swap them round.', SW - 8, SH() - 10, 11, c.muted, 'right', 700);
}

// ---------- Standard form, both ways ----------

// What's shown: dir 0 turns a number into standard form, dir 1 turns standard form into a number
function sfModel(dir, n) {
  const sf = toSF(n);
  if (dir === 0) return { start: n, k: -sf.e, sf, out: sf };
  const a = parse(sf.a);   // start from the 1-to-10 number, then move the point by the power
  return { start: { ...a, neg: n.neg }, k: sf.e, sf, out: n };
}
function drawSF(c, S) {
  const { dir, n, label } = S;
  txt(c, dir === 0 ? 'Write it in standard form' : 'Write it as an ordinary number', 14, 20, 15, c.text);
  if (label) txt(c, label, 14, 40, 12, c.muted, 'left', 700);
  if (!n) { txt(c, 'Type a number in the set-up', SW / 2, 120, 15, c.muted, 'center', 700); return; }
  const m = sfModel(dir, n), e = m.sf.e;
  txt(c, dir === 0 ? plain(n) : sfText(m.sf), SW / 2, 62, 26, BLUE, 'center');
  if (m.sf.zero) { txt(c, 'Zero is just 0', SW / 2, 150, 15, c.muted, 'center', 700); return; }
  drawHops(c, hopCells(m.start, m.k), SW / 2, 112, SW - 40, S.t, S.show, true);
  const say = dir === 0
    ? (e > 0 ? `The point moves ${places(e)} left, to just after the first digit`
      : e < 0 ? `The point moves ${places(e)} right, to just after the first digit that isn’t 0`
        : 'It’s already at least 1 and less than 10, so the power is 0')
    : (e > 0 ? `The power is ${e}, so the point moves ${places(e)} right` : e < 0 ? `The power is −${-e}, so the point moves ${places(e)} left` : 'The power is 0, so the point doesn’t move');
  if (S.show || dir === 1) wrapText(c, say, SW / 2, 178, SW - 40, 13, c.text);
  txt(c, S.show ? (dir === 0 ? sfText(m.sf) : plain(n)) : '?', SW / 2, 228, 30, ORANGE, 'center');
  if (dir === 0 && S.show && e) txt(c, e > 0 ? 'A big number, so the power is positive' : 'Less than 1, so the power is negative', SW / 2, 266, 13, c.muted, 'center', 700);
}
// Examples: name, the number, its unit
const SEGS = [
  ['Speed of light', '300000000', 'm/s'], ['Mass of the Earth', '6000000000000000000000000', 'kg'], ['Radius of an atom', '0.0000000001', 'm'],
  ['Radius of a nucleus', '0.00000000000001', 'm'], ['Wavelength of green light', '0.00000053', 'm'], ['Avogadro constant', '602000000000000000000000', 'per mole'],
];
const sf = { dir: 0, label: '' };

// ---------- Questions for the Practice questions tab ----------
// New every time, in the question bank's format, and mixed in with the bank's questions there.

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const PAIRS = [   // from, to, and the units it makes sense for
  ['k', '', ['J', 'W', 'Ω', 'm', 'N', 'Pa', 'Hz']], ['M', '', ['J', 'W', 'Ω', 'Hz']], ['G', '', ['Hz', 'W', 'J']],
  ['m', '', ['A', 'V', 's', 'm']], ['μ', '', ['A', 'm', 's']], ['n', '', ['m', 's']], ['c', '', ['m']],
  ['', 'k', ['J', 'W', 'm', 'g']], ['', 'm', ['A', 's']], ['m', '', ['g']],
];
function makeParams() {
  const k = pick(['prefix', 'prefix', 'prefix', 'toSF', 'toSF', 'fromSF', 'prefixSF', 'time', 'speed']);
  if (k === 'prefix' || k === 'prefixSF') {
    const pairs = k === 'prefixSF' ? PAIRS.filter((p) => p[1] === '' && p[0] !== 'c' && p[2].some((u) => u !== 'g')) : PAIRS;
    const [f, t, us] = pick(pairs), u = pick(us.filter((x) => k !== 'prefixSF' || x !== 'g')), bigger = PRE[idx(t)].e > PRE[idx(f)].e;
    // Sensible starting values: big ones to change into a bigger unit, small ones from a unit without a prefix into milli
    const v = bigger ? pick([String(rint(12, 98) * 100), String(rint(2, 9) * 1000), String(rint(150, 950))])
      : f === '' ? pick([(rint(11, 99) / 100).toFixed(2), (rint(11, 49) / 10).toFixed(1), (rint(1, 9) / 100).toFixed(2)])
        : pick([String(rint(2, 99)), (rint(11, 99) / 10).toFixed(1), String(rint(2, 19) * 50), (rint(1, 9) / 10).toFixed(1)]);
    return { k, v, u, f: idx(f), t: idx(t) };
  }
  if (k === 'toSF') return { k, a: pick([String(rint(2, 9)), (rint(11, 99) / 10).toFixed(1)]), e: pick([-9, -8, -7, -6, -5, -4, -3, -2, 3, 4, 5, 6, 7, 8]) };
  if (k === 'fromSF') return { k, a: (rint(11, 99) / 10).toFixed(1), e: pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]) };
  if (k === 'time') return Math.random() < 0.5 ? { k, v: String(rint(3, 40) / 2), from: 'min' } : { k, v: String(rint(2, 8) / 2), from: 'h' };
  return Math.random() < 0.6 ? { k, v: String(rint(1, 7) * 18), to: 'ms' } : { k, v: String(rint(2, 8) * 5), to: 'kmh' };
}
// Wrong answers that come from real mistakes: the power the wrong way round, one place out, or not
// quite standard form (34 × 10⁻⁵ is the right size, but 34 isn't less than 10)
function sfChoices(s, unit = '') {
  const u = unit ? ` ${unit}` : '', out = [sfText(s) + u];
  const add = (t) => { if (!out.includes(t + u) && out.length < 4) out.push(t + u); };
  if (s.e) add(sfText({ ...s, e: -s.e }));
  add(`${plain(shift(parse(s.a), 1), false)} × 10${SUP(s.e - 1)}`);
  add(sfText({ ...s, e: s.e + (s.e > 0 ? -1 : 1) }));
  add(sfText({ ...s, e: s.e + (s.e > 0 ? 1 : -1) }));
  return out;
}
function buildQ(p) {
  const base = { id: `gen-${JSON.stringify(p)}`, lv: 'both', topic: 'reference', tool: 'Units, prefixes & standard form', pg: 'units', gen: true, p };
  if (p.k === 'prefix' || p.k === 'prefixSF') {
    const n = parse(p.v), k = PRE[p.f].e - PRE[p.t].e, r = shift(n, k), F = PRE[p.f], T = PRE[p.t], fromU = F.s + p.u, toU = T.s + p.u;
    const means = (P, U) => (P.s ? `${P.name} means × 10${SUP(P.e)}` : `${U} has no prefix`);
    const first = means(F, fromU), exp = `${first[0].toUpperCase()}${first.slice(1)}, and ${means(T, toU)}. ${k > 0 ? `${toU} is a smaller unit, so the number gets bigger: × ${powText(k)}` : `${toU} is a bigger unit, so the number gets smaller: ÷ ${powText(-k)}`}. The decimal point moves ${places(k)} ${k > 0 ? 'right' : 'left'}: ${plain(n)} ${fromU} = ${plain(r)} ${toU}.`;
    if (p.k === 'prefix') return { ...base, type: 'num', q: `Write ${plain(n)} ${fromU} in ${toU}.`, num: valueOf(r), numText: plain(r), unit: toU, exp };
    const s = toSF(r);
    return { ...base, type: 'mc', q: `Write ${plain(n)} ${fromU} in ${unitName(p.u)}, in standard form.`, opts: sfChoices(s, toU), ans: [0], exp: `${exp} In standard form, that’s ${sfText(s)} ${toU}.` };
  }
  if (p.k === 'toSF' || p.k === 'fromSF') {
    const n = shift(parse(p.a), p.e), s = toSF(n);
    if (p.k === 'toSF') {
      return { ...base, type: 'mc', q: `Write ${plain(n)} in standard form.`, opts: sfChoices(s), ans: [0],
        exp: `Put the decimal point just after the first digit that isn’t 0: ${s.a}. It moves ${places(s.e)} ${s.e > 0 ? 'left' : 'right'}. ${s.e > 0 ? 'A big number, so the power is positive' : 'Less than 1, so the power is negative'}: ${sfText(s)}.` };
    }
    return { ...base, type: 'num', q: `Write ${sfText(s)} as an ordinary number.`, num: valueOf(n), numText: plain(n),
      exp: `The power is ${String(s.e).replace('-', '−')}, so move the decimal point ${places(s.e)} ${s.e > 0 ? 'right: the number gets bigger' : 'left: the number gets smaller'}, filling any gaps with zeros: ${plain(n)}.` };
  }
  if (p.k === 'time') {
    const mult = p.from === 'min' ? 60 : 3600, n = parse(String(Number(p.v) * mult));
    return { ...base, type: 'num', q: `How many seconds are there in ${p.v} ${p.from === 'min' ? 'minutes' : 'hours'}?`, num: valueOf(n), numText: plain(n), unit: 's',
      exp: p.from === 'min' ? `There are 60 seconds in a minute: ${p.v} × 60 = ${plain(n)} s.` : `There are 60 × 60 = 3600 seconds in an hour: ${p.v} × 3600 = ${plain(n)} s.` };
  }
  const v = Number(p.v), n = parse(String(p.to === 'ms' ? (v * 10) / 36 : (v * 36) / 10)), unit = p.to === 'ms' ? 'm/s' : 'km/h';
  return { ...base, type: 'num', num: valueOf(n), numText: plain(n), unit,
    q: p.to === 'ms' ? `A car travels at ${p.v} km/h. What is this in m/s?` : `A cyclist travels at ${p.v} m/s. What is this in km/h?`,
    exp: `1 km = 1000 m and 1 hour = 3600 s. ${p.to === 'ms' ? `${p.v} × 1000 ÷ 3600 = ${p.v} ÷ 3.6` : `${p.v} × 3600 ÷ 1000 = ${p.v} × 3.6`} = ${plain(n)} ${unit}.` };
}
// Only rebuild a question from a shared link if its numbers are sensible
function validParams(o) {
  const num = (s) => typeof s === 'string' && /^\d{1,6}(\.\d{1,3})?$/.test(s), int = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
  if (!o || typeof o !== 'object') return false;
  if (o.k === 'prefix' || o.k === 'prefixSF') return num(o.v) && UNITS.some((u) => u[0] === o.u) && int(o.f, 0, 8) && int(o.t, 0, 8) && o.f !== o.t;
  if (o.k === 'toSF' || o.k === 'fromSF') return num(o.a) && int(o.e, -12, 12);
  if (o.k === 'time') return num(o.v) && ['min', 'h'].includes(o.from);
  if (o.k === 'speed') return num(o.v) && ['ms', 'kmh'].includes(o.to);
  return false;
}
PK.practiceGen = { make: () => buildQ(makeParams()), encode: (q) => q.p, decode: (o) => (validParams(o) ? buildQ(o) : null), share: 0.75 };

// ---------- Panels ----------

const pf = { t: 0, key: '' };
const fromI = () => Number($('from').value), toI = () => Number($('to').value);
function renderPrefixes() {
  const n = parse($('val').value), u = $('unit').value, F = PRE[fromI()], T = PRE[toI()], k = F.e - T.e;
  const fromU = F.s + u, toU = T.s + u;
  $('val-unit').textContent = fromU;
  $('info-title').textContent = 'What’s happening';
  const key = `${$('val').value}|${fromI()}|${toI()}`;
  if (key !== pf.key) { pf.key = key; pf.t = 0; }
  document.querySelectorAll('#pegs .chip').forEach((b, i) => { const [v, uu, f, t] = PEGS[i]; b.setAttribute('aria-pressed', String(v === $('val').value && uu === u && idx(f) === fromI() && idx(t) === toI())); });
  if (!n) { $('info').innerHTML = '<p class="note" style="margin:0">Type a number in the Value box.</p>'; return; }
  const r = shift(n, k), mean = (P, U) => (P.s ? `<b>${P.name}</b> means × 10<sup>${String(P.e).replace('-', '−')}</sup>${Math.abs(P.e) <= 6 && P.e !== 0 ? ` (${P.e > 0 ? `× ${powText(P.e)}` : `÷ ${powText(-P.e)}`})` : ''}` : `<b>${U}</b> has no prefix`);
  $('info').innerHTML = `<ol class="steps">
      <li>${mean(F, fromU)}. ${mean(T, toU)}.</li>
      <li>${k === 0 ? 'They’re the same, so nothing changes.' : `From ${fromU} to ${toU} is ${Math.abs(k)} power${Math.abs(k) > 1 ? 's' : ''} of ten. ${k > 0 ? `${toU} is smaller, so you need more of them: <b>multiply</b> by ${powText(k)}.` : `${toU} is bigger, so you need fewer of them: <b>divide</b> by ${powText(-k)}.`}`}</li>
      <li>${plain(n)} ${fromU} = ${PK.ans(`<b>${plain(r)} ${toU}</b>`)}${k ? ` (the decimal point moves ${places(k)} ${k > 0 ? 'right' : 'left'})` : ''}</li>
    </ol>
    ${u === 'g' ? '<p class="note" style="margin-bottom:0">The SI unit of mass is the kilogram, so change grams into kilograms before you use them in an equation.</p>' : ''}`;
}
function sfNumber() {
  if (sf.dir === 0) return parse($('big').value);
  const a = parse($('sfa').value), e = $('sfn').value.trim();
  return a && e !== '' && Number.isInteger(Number(e)) ? shift(a, Number(e)) : null;
}
function renderSF() {
  $('num-field').hidden = sf.dir !== 0; $('sf-field').hidden = sf.dir !== 1;
  $('info-title').textContent = 'What’s happening';
  const n = sfNumber(), key = `${sf.dir}|${$('big').value}|${$('sfa').value}|${$('sfn').value}`;
  if (key !== pf.key) { pf.key = key; pf.t = 0; }
  if (!n) { $('info').innerHTML = `<p class="note" style="margin:0">${sf.dir === 0 ? 'Type a number.' : 'Type the number and a whole-number power of ten.'}</p>`; return; }
  const s = toSF(n), a = Number($('sfa').value);
  if (s.zero) { $('info').innerHTML = '<p style="margin:0">Zero is just 0: there’s no standard form for it.</p>'; return; }
  const warn = sf.dir === 1 && !(Math.abs(a) >= 1 && Math.abs(a) < 10) ? '<p class="note" style="margin-bottom:0"><span class="badge bad">Careful</span> That isn’t standard form: the first number should be at least 1 and less than 10.</p>' : '';
  $('info').innerHTML = sf.dir === 0 ? `<ol class="steps">
      <li>Put the decimal point just after the first digit that isn’t 0. That gives <b>${s.a}</b>, a number at least 1 and less than 10.</li>
      <li>${s.e === 0 ? 'The point doesn’t move.' : `The point moves ${places(s.e)} ${s.e > 0 ? 'left' : 'right'}.`}</li>
      <li>${s.e > 0 ? 'A big number, so the power is positive' : s.e < 0 ? 'Less than 1, so the power is negative' : 'No move, so the power is 0'}: ${PK.ans(`<b>${sfHtml(s)}</b>`)}</li>
    </ol>`
    : `<ol class="steps">
      <li>${s.e === 0 ? 'The power is 0, so the point stays where it is.' : `The power is ${String(s.e).replace('-', '−')}, so move the decimal point ${places(s.e)} ${s.e > 0 ? 'right: the number gets bigger' : 'left: the number gets smaller'}.`}</li>
      <li>Fill any gaps with zeros.</li>
      <li>${PK.ans(`<b>${plain(n)}</b>`)}</li>
    </ol>${warn}`;
  document.querySelectorAll('#segs .chip').forEach((b, i) => b.setAttribute('aria-pressed', String(SEGS[i][1] === plain(n, false) || valueOf(parse(SEGS[i][1])) === valueOf(n))));
  sf.label = (SEGS.find((x) => valueOf(parse(x[1])) === valueOf(n)) || [])[0] || '';
  if (sf.label) sf.label += `, in ${SEGS.find((x) => x[0] === sf.label)[2]}`;
}
function renderPanel() {
  if (state.tab === 'prefixes') renderPrefixes();
  if (state.tab === 'sform') renderSF();
}

const WHY = {
  prefixes: `<p><b>Prefixes</b> go in front of a unit to make it bigger or smaller by a power of ten. A kilometre is 1000 metres. A milliamp is a thousandth of an amp.</p>
    <p><b>Converting.</b> Count how many powers of ten apart the two prefixes are. Changing to a smaller unit you need more of them, so the number gets bigger: multiply. Changing to a bigger unit, divide.</p>
    <p><b>In calculations</b>, change everything into units without a prefix first: kJ into J, mA into A, cm into m. Mass is the odd one out: change grams into kilograms, because the SI unit of mass is the kilogram.</p>`,
  sform: `<p><b>Standard form</b> is a short way to write very big and very small numbers: a number at least 1 and less than 10, multiplied by a power of ten.</p>
    <p><b>Big numbers</b> (10 or more) have a positive power. <b>Numbers less than 1</b> have a negative power. The power tells you how many places the decimal point moves.</p>
    <p><b>On a calculator</b>, type standard form with the ×10<sup>x</sup> button (EXP on some calculators): for 3.4 × 10<sup>−4</sup>, press 3.4, then ×10<sup>x</sup>, then −4.</p>
    <p><b>Practise</b> on the Practice questions tab: there’s a new conversion question every time.</p>`,
};
const INTRO = {
  prefixes: 'Prefixes such as kilo and milli make a unit bigger or smaller by powers of ten. Choose a value, then tap a step on the ladder to convert it.',
  sform: 'Write very big and very small numbers in standard form, by counting how many places the decimal point moves.',
};
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = WHY[t];
  scene.classList.toggle('drag', t === 'prefixes');
  scene.setAttribute('aria-label', { prefixes: 'A ladder of prefixes from tera to nano, with the conversion worked out', sform: 'The decimal point hopping place by place to write the number in standard form' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'prefixes' ? location.pathname + location.search : `#${t}`);
  pf.key = ''; size(); renderPanel();
}

// ---------- Controls ----------

$('unit').innerHTML = UNITS.map(([s, name]) => `<option value="${s}">${s} (${name})</option>`).join('');
const preOpt = () => PRE.map((p, i) => `<option value="${i}">${p.s ? `${p.name} (${p.s})` : 'no prefix'}</option>`).join('');
$('from').innerHTML = preOpt(); $('to').innerHTML = preOpt();
$('unit').value = 'Ω'; $('from').value = '3'; $('to').value = '4';
const syncUnitNames = () => {
  const u = $('unit').value;
  [...$('from').options].concat([...$('to').options]).forEach((o) => { const p = PRE[Number(o.value)]; o.textContent = p.s ? `${p.name} (${p.s}${u})` : `no prefix (${u})`; });
};
syncUnitNames();
$('pegs').innerHTML = PEGS.map(([, u, f, t]) => `<button class="chip" aria-pressed="false">${f}${u} → ${t}${u}</button>`).join('');
document.querySelectorAll('#pegs .chip').forEach((b, i) => b.addEventListener('click', () => {
  const [v, u, f, t] = PEGS[i];
  $('val').value = v; $('unit').value = u; $('from').value = String(idx(f)); $('to').value = String(idx(t));
  syncUnitNames(); renderPanel();
}));
for (const id of ['val', 'from', 'to']) { $(id).addEventListener('input', renderPanel); $(id).addEventListener('change', renderPanel); }
$('unit').addEventListener('change', () => { syncUnitNames(); renderPanel(); });

$('segs').innerHTML = SEGS.map(([name]) => `<button class="chip" aria-pressed="false">${name}</button>`).join('');
document.querySelectorAll('#segs .chip').forEach((b, i) => b.addEventListener('click', () => {
  const n = parse(SEGS[i][1]), s = toSF(n);
  $('big').value = SEGS[i][1]; $('sfa').value = s.a; $('sfn').value = String(s.e);
  renderPanel();
}));
PK.chips('dir', (v) => {
  // Carry the number across, so switching direction shows the same number the other way round
  const n = sf.dir === 0 ? parse($('big').value) : sfNumber();
  sf.dir = v;
  if (n) { const s = toSF(n); $('big').value = plain(n, false); if (!s.zero) { $('sfa').value = s.a; $('sfn').value = String(s.e); } }
  renderPanel();
});
for (const id of ['big', 'sfa', 'sfn']) $(id).addEventListener('input', renderPanel);


document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
window.addEventListener('pk-answers', () => { pf.t = 0; renderPanel(); });

// Tap a step on the ladder to change to it; drag the blue (starting) step to change where you start
PK.dragOn(scene, SW, SW, {
  hit: (p) => {
    if (state.tab !== 'prefixes') return null;
    const y = (p.y * SH()) / SW, row = Math.round((y - rowMid(0)) / LAD.row), b = pf.badge;
    if (b && p.x > b.x - 6 && p.x < b.x + b.w + 6 && y > b.y - 6 && y < b.y + b.h + 6) return { swap: true };
    if (p.x < LAD.x || p.x > LAD.x + LAD.w || row < 0 || row >= PRE.length) return null;
    return { row, from: row === fromI() };
  },
  move: (h, p) => {
    if (h.swap) return;
    const row = Math.max(0, Math.min(PRE.length - 1, Math.round(((p.y * SH()) / SW - rowMid(0)) / LAD.row)));
    $(h.from ? 'from' : 'to').value = String(row); renderPanel();
  },
  tap: (h) => {
    // Swap: the answer becomes the starting value, so 75 g = 0.075 kg turns into 0.075 kg = 75 g
    if (h.swap) {
      const n = parse($('val').value), k = PRE[fromI()].e - PRE[toI()].e;
      if (n) $('val').value = plain(shift(n, k), false);
      const f = $('from').value; $('from').value = $('to').value; $('to').value = f;
      renderPanel(); return;
    }
    if (!h.from) { $('to').value = String(h.row); renderPanel(); }
  },
});

function size() {
  const dpr = window.devicePixelRatio || 1;
  scene.style.aspectRatio = `${SW} / ${SH()}`;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (SH() / SW) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  pf.t += dt;
  if (scene.clientWidth) {
    const c = colours();
    ctx.setTransform(scene.width / SW, 0, 0, scene.width / SW, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, SW, SH());
    const show = PK.answersShown();
    if (state.tab === 'prefixes') drawPrefix(c, { n: parse($('val').value), from: fromI(), to: toI(), unit: $('unit').value, t: pf.t, show, hint: true });
    else drawSF(c, { dir: sf.dir, n: sfNumber(), t: pf.t, show, label: sf.label });
  }
  requestAnimationFrame(frame);
}

showTab(PK.initialHash === '#sform' ? 'sform' : 'prefixes');
requestAnimationFrame(frame);

// Share: everything is in the set-up (shared anyway); the unit names in the lists follow the unit
PK.shareState = { get: () => ({}), set: () => { syncUnitNames(); renderPanel(); } };
