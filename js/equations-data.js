// AQA GCSE Physics (8463) equations.
// recall: true  = students must memorise it; false = given on the Physics equation sheet.
// po: Physics only (not Combined Science). ht: Higher tier only.
//
// Most equations are "monomials": lhs = coef × (var^power × ...), which lets the app
// rearrange and solve them automatically. The suvat equation is written out by hand.

const Q = {
  m: { sym: 'm', name: 'mass', unit: 'kg' },
  g: { sym: 'g', name: 'gravitational field strength', unit: 'N/kg' },
  Wwt: { sym: 'W', name: 'weight', unit: 'N' },
  Wwd: { sym: 'W', name: 'work done', unit: 'J' },
  F: { sym: 'F', name: 'force', unit: 'N' },
  s: { sym: 's', name: 'distance', unit: 'm' },
  k: { sym: 'k', name: 'spring constant', unit: 'N/m' },
  e: { sym: 'e', name: 'extension', unit: 'm' },
  M: { sym: 'M', name: 'moment of a force', unit: 'N m' },
  d: { sym: 'd', name: 'perpendicular distance from the pivot', unit: 'm' },
  p: { sym: 'p', name: 'pressure', unit: 'Pa' },
  A: { sym: 'A', name: 'area', unit: 'm²' },
  v: { sym: 'v', name: 'speed (or velocity)', unit: 'm/s' },
  t: { sym: 't', name: 'time', unit: 's' },
  a: { sym: 'a', name: 'acceleration', unit: 'm/s²' },
  dv: { sym: 'Δv', name: 'change in velocity', unit: 'm/s' },
  mom: { sym: 'p', name: 'momentum', unit: 'kg m/s' },
  Ek: { sym: 'E<sub>k</sub>', name: 'kinetic energy', unit: 'J' },
  Ep: { sym: 'E<sub>p</sub>', name: 'gravitational potential energy', unit: 'J' },
  h: { sym: 'h', name: 'height', unit: 'm' },
  P: { sym: 'P', name: 'power', unit: 'W' },
  E: { sym: 'E', name: 'energy transferred', unit: 'J' },
  eff: { sym: 'efficiency', name: 'efficiency', unit: '', word: true },
  Eout: { sym: 'useful output energy transfer', name: 'useful output energy transfer', unit: 'J', word: true },
  Ein: { sym: 'total input energy transfer', name: 'total input energy transfer', unit: 'J', word: true },
  Pout: { sym: 'useful power output', name: 'useful power output', unit: 'W', word: true },
  Pin: { sym: 'total power input', name: 'total power input', unit: 'W', word: true },
  Qc: { sym: 'Q', name: 'charge flow', unit: 'C' },
  I: { sym: 'I', name: 'current', unit: 'A' },
  V: { sym: 'V', name: 'potential difference', unit: 'V' },
  R: { sym: 'R', name: 'resistance', unit: 'Ω' },
  rho: { sym: 'ρ', name: 'density', unit: 'kg/m³' },
  vol: { sym: 'V', name: 'volume', unit: 'm³' },
  f: { sym: 'f', name: 'frequency', unit: 'Hz' },
  lam: { sym: 'λ', name: 'wavelength', unit: 'm' },
  mag: { sym: 'magnification', name: 'magnification', unit: '', word: true },
  hi: { sym: 'image height', name: 'image height', unit: 'cm', word: true },
  ho: { sym: 'object height', name: 'object height', unit: 'cm', word: true },
  u: { sym: 'u', name: 'initial velocity', unit: 'm/s' },
  vf: { sym: 'v', name: 'final velocity', unit: 'm/s', group: 'v' },
  Ee: { sym: 'E<sub>e</sub>', name: 'elastic potential energy', unit: 'J' },
  dE: { sym: 'ΔE', name: 'change in thermal energy', unit: 'J' },
  c: { sym: 'c', name: 'specific heat capacity', unit: 'J/kg °C' },
  dth: { sym: 'Δθ', name: 'temperature change', unit: '°C' },
  T: { sym: 'T', name: 'period', unit: 's' },
  B: { sym: 'B', name: 'magnetic flux density', unit: 'T' },
  l: { sym: 'l', name: 'length', unit: 'm' },
  Eth: { sym: 'E', name: 'thermal energy for a change of state', unit: 'J', group: 'E' },
  L: { sym: 'L', name: 'specific latent heat', unit: 'J/kg' },
  Vp: { sym: 'V<sub>p</sub>', name: 'p.d. across the primary coil', unit: 'V', group: 'V' },
  Vs: { sym: 'V<sub>s</sub>', name: 'p.d. across the secondary coil', unit: 'V', group: 'V' },
  np: { sym: 'n<sub>p</sub>', name: 'number of turns on the primary coil', unit: '' },
  ns: { sym: 'n<sub>s</sub>', name: 'number of turns on the secondary coil', unit: '' },
  Ip: { sym: 'I<sub>p</sub>', name: 'current in the primary coil', unit: 'A', group: 'I' },
  Is: { sym: 'I<sub>s</sub>', name: 'current in the secondary coil', unit: 'A', group: 'I' },
  p1: { sym: 'p<sub>1</sub>', name: 'starting pressure', unit: 'Pa', group: 'p' },
  V1: { sym: 'V<sub>1</sub>', name: 'starting volume', unit: 'm³', group: 'vol' },
  p2: { sym: 'p<sub>2</sub>', name: 'final pressure', unit: 'Pa', group: 'p' },
  V2: { sym: 'V<sub>2</sub>', name: 'final volume', unit: 'm³', group: 'vol' },
  dt: { sym: 'Δt', name: 'time taken', unit: 's', group: 't' },
};

const EQUATIONS = [
  // ----- Recall -----
  { id: 'weight', topic: 'Forces', recall: true, lhs: 'Wwt', rhs: [['m', 1], ['g', 1]] },
  { id: 'work', topic: 'Forces', recall: true, lhs: 'Wwd', rhs: [['F', 1], ['s', 1]] },
  { id: 'hooke', topic: 'Forces', recall: true, lhs: 'F', rhs: [['k', 1], ['e', 1]], wordNames: { F: 'force applied to a spring' } },
  { id: 'moment', topic: 'Forces', recall: true, po: true, lhs: 'M', rhs: [['F', 1], ['d', 1]] },
  { id: 'pressure', topic: 'Forces', recall: true, po: true, lhs: 'p', rhs: [['F', 1], ['A', -1]], wordNames: { F: 'force normal to a surface', A: 'area of that surface' } },
  { id: 'speed', topic: 'Forces', recall: true, lhs: 's', rhs: [['v', 1], ['t', 1]], wordNames: { s: 'distance travelled' } },
  { id: 'accel', topic: 'Forces', recall: true, lhs: 'a', rhs: [['dv', 1], ['t', -1]], wordNames: { t: 'time taken' } },
  { id: 'newton2', topic: 'Forces', recall: true, lhs: 'F', rhs: [['m', 1], ['a', 1]], wordNames: { F: 'resultant force' } },
  { id: 'momentum', topic: 'Forces', recall: true, ht: true, lhs: 'mom', rhs: [['m', 1], ['v', 1]], wordNames: { v: 'velocity' } },
  { id: 'ke', topic: 'Energy', recall: true, lhs: 'Ek', rhs: [['m', 1], ['v', 2]], coef: 0.5, wordNames: { v: 'speed' } },
  { id: 'gpe', topic: 'Energy', recall: true, lhs: 'Ep', rhs: [['m', 1], ['g', 1], ['h', 1]] },
  { id: 'power-e', topic: 'Energy', recall: true, lhs: 'P', rhs: [['E', 1], ['t', -1]] },
  { id: 'power-w', topic: 'Energy', recall: true, lhs: 'P', rhs: [['Wwd', 1], ['t', -1]] },
  { id: 'eff-e', topic: 'Energy', recall: true, lhs: 'eff', rhs: [['Eout', 1], ['Ein', -1]], note: 'Efficiency is a decimal here. Multiply by 100 to get a percentage.' },
  { id: 'eff-p', topic: 'Energy', recall: true, lhs: 'eff', rhs: [['Pout', 1], ['Pin', -1]], note: 'Efficiency is a decimal here. Multiply by 100 to get a percentage.' },
  { id: 'charge', topic: 'Electricity', recall: true, lhs: 'Qc', rhs: [['I', 1], ['t', 1]] },
  { id: 'ohm', topic: 'Electricity', recall: true, lhs: 'V', rhs: [['I', 1], ['R', 1]] },
  { id: 'power-vi', topic: 'Electricity', recall: true, lhs: 'P', rhs: [['V', 1], ['I', 1]] },
  { id: 'power-i2r', topic: 'Electricity', recall: true, lhs: 'P', rhs: [['I', 2], ['R', 1]] },
  { id: 'energy-pt', topic: 'Electricity', recall: true, lhs: 'E', rhs: [['P', 1], ['t', 1]] },
  { id: 'energy-qv', topic: 'Electricity', recall: true, lhs: 'E', rhs: [['Qc', 1], ['V', 1]] },
  { id: 'density', topic: 'Particle model', recall: true, lhs: 'rho', rhs: [['m', 1], ['vol', -1]] },
  { id: 'wave', topic: 'Waves', recall: true, lhs: 'v', rhs: [['f', 1], ['lam', 1]], wordNames: { v: 'wave speed' } },
  { id: 'magnification', topic: 'Waves', recall: true, po: true, lhs: 'mag', rhs: [['hi', 1], ['ho', -1]], note: 'Image and object height just need the same units (both cm or both mm).' },

  // ----- Given on the equation sheet -----
  {
    id: 'suvat', topic: 'Forces', recall: false, custom: true,
    vars: ['vf', 'u', 'a', 's'],
    word: '(final velocity)² − (initial velocity)² = 2 × acceleration × distance',
    html: 'v<sup>2</sup> − u<sup>2</sup> = 2 a s',
    forms: {
      vf: { html: 'v = √(u<sup>2</sup> + 2 a s)', calc: (x) => Math.sqrt(x.u ** 2 + 2 * x.a * x.s), sub: (x) => `√(${x.u}<sup>2</sup> + 2 × ${x.a} × ${x.s})` },
      u: { html: 'u = √(v<sup>2</sup> − 2 a s)', calc: (x) => Math.sqrt(x.vf ** 2 - 2 * x.a * x.s), sub: (x) => `√(${x.vf}<sup>2</sup> − 2 × ${x.a} × ${x.s})` },
      a: { html: 'a = (v<sup>2</sup> − u<sup>2</sup>) ÷ 2s', calc: (x) => (x.vf ** 2 - x.u ** 2) / (2 * x.s), sub: (x) => `(${x.vf}<sup>2</sup> − ${x.u}<sup>2</sup>) ÷ (2 × ${x.s})` },
      s: { html: 's = (v<sup>2</sup> − u<sup>2</sup>) ÷ 2a', calc: (x) => (x.vf ** 2 - x.u ** 2) / (2 * x.a), sub: (x) => `(${x.vf}<sup>2</sup> − ${x.u}<sup>2</sup>) ÷ (2 × ${x.a})` },
    },
  },
  { id: 'epe', topic: 'Energy', recall: false, lhs: 'Ee', rhs: [['k', 1], ['e', 2]], coef: 0.5, wordNames: { Ee: 'elastic potential energy' } },
  { id: 'shc', topic: 'Energy', recall: false, lhs: 'dE', rhs: [['m', 1], ['c', 1], ['dth', 1]] },
  { id: 'period', topic: 'Waves', recall: false, lhs: 'T', rhs: [['f', -1]] },
  { id: 'fbil', topic: 'Magnetism', recall: false, ht: true, lhs: 'F', rhs: [['B', 1], ['I', 1], ['l', 1]], wordNames: { F: 'force on a conductor carrying a current', l: 'length' } },
  { id: 'latent', topic: 'Particle model', recall: false, lhs: 'Eth', rhs: [['m', 1], ['L', 1]] },
  { id: 'transformer-ratio', topic: 'Magnetism', recall: false, po: true, ht: true, lhs: 'Vp', rhs: [['Vs', 1], ['np', 1], ['ns', -1]],
    html: 'V<sub>p</sub> / V<sub>s</sub> = n<sub>p</sub> / n<sub>s</sub>', word: 'p.d. across primary ÷ p.d. across secondary = turns on primary ÷ turns on secondary' },
  { id: 'transformer-power', topic: 'Magnetism', recall: false, po: true, ht: true, lhs: 'Vs', rhs: [['Vp', 1], ['Ip', 1], ['Is', -1]],
    html: 'V<sub>s</sub> I<sub>s</sub> = V<sub>p</sub> I<sub>p</sub>', word: 'p.d. across secondary × current in secondary = p.d. across primary × current in primary' },
  { id: 'gas', topic: 'Particle model', recall: false, po: true, lhs: 'p1', rhs: [['p2', 1], ['V2', 1], ['V1', -1]],
    html: 'p V = constant', word: 'pressure × volume = constant (for a fixed mass of gas at constant temperature)', note: 'The calculator uses p₁V₁ = p₂V₂ — the "before" and "after" values.' },
  { id: 'liquid', topic: 'Forces', recall: false, po: true, ht: true, lhs: 'p', rhs: [['h', 1], ['rho', 1], ['g', 1]], wordNames: { p: 'pressure due to a column of liquid', h: 'height of the column' } },
  { id: 'impulse', topic: 'Forces', recall: false, po: true, ht: true, lhs: 'F', rhs: [['m', 1], ['dv', 1], ['dt', -1]], wordNames: { dv: 'change in velocity' },
    word: 'force = change in momentum ÷ time taken', html: 'F = <span class="frac"><span>m Δv</span><span>Δt</span></span>' },
];

// ---------- Helpers shared by the explorer and calculation practice ----------

const varsOf = (eq) => (eq.custom ? eq.vars : [eq.lhs, ...eq.rhs.map(([id]) => id)]);
const groupOf = (id) => Q[id].group || id;
const nameOf = (eq, id) => (eq.wordNames && eq.wordNames[id]) || Q[id].name;
const hasWord = (eq) => varsOf(eq).some((id) => Q[id].word);
const term = (label, p) => (p === 1 ? label : `${label}<sup>${p}</sup>`);
const frac = (num, den) => (den ? `<span class="frac"><span>${num}</span><span>${den}</span></span>` : num);

function wordEquation(eq) {
  if (eq.word) return eq.word;
  const n = (id, p) => (p === 2 ? `(${nameOf(eq, id)})²` : nameOf(eq, id));
  const num = eq.rhs.filter(([, p]) => p > 0).map(([id, p]) => n(id, p));
  const den = eq.rhs.filter(([, p]) => p < 0).map(([id, p]) => n(id, -p));
  const coef = eq.coef === 0.5 ? '0.5 × ' : '';
  return `${nameOf(eq, eq.lhs)} = ${coef}${num.join(' × ') || '1'}${den.length ? ' ÷ ' + den.join(' × ') : ''}`;
}

// Build the right-hand side for a chosen subject. `lab` turns a variable id into HTML
// (its symbol, or a number when showing the working).
function expression(eq, subject, lab, numeric) {
  const join = numeric || hasWord(eq) ? ' × ' : ' ';
  const coef = eq.coef || 1;
  let num = [], den = [], power = 1;

  if (subject === eq.lhs) {
    for (const [id, p] of eq.rhs) (p > 0 ? num : den).push(term(lab(id), Math.abs(p)));
    if (coef === 0.5) num.unshift('½');
    else if (coef !== 1) num.unshift(String(coef));
  } else {
    power = eq.rhs.find(([id]) => id === subject)[1];
    num.push(lab(eq.lhs));
    for (const [id, p] of eq.rhs) {
      if (id === subject) continue;
      (p < 0 ? num : den).push(term(lab(id), Math.abs(p)));
    }
    if (coef === 0.5) num.unshift('2');
    else if (coef !== 1) den.unshift(String(coef));
    if (power < 0) { [num, den] = [den, num]; power = -power; }
  }
  const body = frac(num.join(join) || '1', den.join(join));
  return power === 2 ? `√(${body})` : body;
}

function solve(eq, subject, x) {
  if (eq.custom) return eq.forms[subject].calc(x);
  const coef = eq.coef || 1;
  if (subject === eq.lhs) return eq.rhs.reduce((acc, [id, p]) => acc * x[id] ** p, coef);
  const pX = eq.rhs.find(([id]) => id === subject)[1];
  const rest = eq.rhs.reduce((acc, [id, p]) => (id === subject ? acc : acc * x[id] ** p), coef);
  return (x[eq.lhs] / rest) ** (1 / pX);
}

// Accept "3e8", "3 x 10^8", "3×10^8", "1,200".
function parseNum(str) {
  if (str == null) return NaN;
  const s = String(str).replace(/,/g, '').replace(/\s+/g, '').replace(/[x×]10\^?/i, 'e');
  if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return parseFloat(s);
}

function numLabel(v) {
  const t = PK.sig(v, 4);
  return v < 0 || t.includes('×') ? `(${t})` : t;
}
