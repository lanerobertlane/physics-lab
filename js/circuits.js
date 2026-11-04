// Circuit builder: components sit on the gaps between grid dots. Each grid dot is a
// node; a modified nodal analysis (MNA) solver works out every voltage and current.

PK.header({
  title: 'Circuit builder',
  spec: [
    { code: '4.2.1.1', text: 'Standard circuit diagram symbols' },
    { code: '4.2.1.2', text: 'Electrical charge and current: current is the same at any point in a single closed loop' },
    { code: '4.2.1.3', text: 'Current, resistance and potential difference: V = I R' },
    { code: '4.2.1.4', text: 'Resistors, filament lamps, diodes, LDRs and thermistors (required practicals: resistance and I–V characteristics)' },
    { code: '4.2.2', text: 'Series and parallel circuits' },
    { code: '4.2.4.1', text: 'Power: P = V I and P = I² R' },
    { code: 'KS3', text: 'Electric current, potential difference and resistance in series and parallel circuits' },
  ],
});

const $ = (id) => document.getElementById(id);

// ---------- Grid ----------

const W = 800, H = 560, S = 80, OX = 40, OY = 40;
const COLS = 10, ROWS = 7;   // dots across and down

const vx = (c) => OX + c * S;
const vy = (r) => OY + r * S;

// Edge keys: "h,c,r" joins (c,r)-(c+1,r); "v,c,r" joins (c,r)-(c,r+1).
function edgeInfo(key) {
  const [o, cs, rs] = key.split(',');
  const c = Number(cs), r = Number(rs);
  const a = `${c},${r}`;
  const b = o === 'h' ? `${c + 1},${r}` : `${c},${r + 1}`;
  return { o, c, r, a, b, x1: vx(c), y1: vy(r), x2: o === 'h' ? vx(c + 1) : vx(c), y2: o === 'h' ? vy(r) : vy(r + 1) };
}

function validEdge(o, c, r) {
  return o === 'h' ? c >= 0 && c < COLS - 1 && r >= 0 && r < ROWS : c >= 0 && c < COLS && r >= 0 && r < ROWS - 1;
}

// ---------- Component types ----------

const TYPES = {
  select: { name: 'Select', tool: true },
  wire: { name: 'Wire' },
  erase: { name: 'Eraser', tool: true },
  cell: { name: 'Cell', value: 1.5, unit: 'V', min: 0.5, max: 3, step: 0.5, polar: true },
  battery: { name: 'Battery', value: 6, unit: 'V', min: 1, max: 24, step: 1, polar: true },
  switch: { name: 'Switch' },
  lamp: { name: 'Lamp' },
  resistor: { name: 'Resistor', value: 10, unit: 'Ω', min: 1, max: 1000, step: 1 },
  varres: { name: 'Variable resistor', value: 20, unit: 'Ω', min: 1, max: 100, step: 1, slider: true },
  ldr: { name: 'LDR' },
  thermistor: { name: 'Thermistor' },
  diode: { name: 'Diode', polar: true },
  led: { name: 'LED', polar: true },
  fuse: { name: 'Fuse', value: 1, unit: 'A', choices: [0.5, 1, 3, 5, 13] },
  ammeter: { name: 'Ammeter' },
  voltmeter: { name: 'Voltmeter' },
};

const DESCRIPTIONS = {
  wire: 'Connects components. Treated as having no resistance.',
  cell: 'Pushes current round the circuit. The longer line is the positive (+) terminal.',
  battery: 'Two or more cells joined together. The longer line is the positive (+) terminal.',
  switch: 'Tap it on the board to open or close it.',
  lamp: 'A filament lamp. Its resistance increases as it gets hotter, so its I–V graph is a curve.',
  resistor: 'A fixed resistor at constant temperature: current is directly proportional to p.d.',
  varres: 'Drag the slider to change its resistance.',
  ldr: 'Light-dependent resistor: its resistance goes down as light intensity goes up.',
  thermistor: 'Its resistance goes down as temperature goes up.',
  diode: 'Current only flows one way — in the direction the triangle points.',
  led: 'A diode that gives out light when current flows through it the right way.',
  fuse: 'Melts and breaks the circuit if the current goes above its rating.',
  ammeter: 'Measures current. Connect it in series.',
  voltmeter: 'Measures potential difference. Connect it in parallel, across a component.',
};

const PALETTE = ['select', 'wire', 'erase', 'cell', 'battery', 'switch', 'lamp', 'resistor', 'varres', 'ldr', 'thermistor', 'diode', 'led', 'fuse', 'ammeter', 'voltmeter'];

// ---------- State ----------

const state = {
  tool: 'wire',
  comps: new Map(),   // edge key -> { type, value, flip, open, blown }
  selected: null,
  hover: null,
  light: 50,
  temp: 20,
  flow: 'conv',
  showValues: true,
};

let result = { V: {}, I: {}, lampR: {}, ledOn: {}, short: false };
const lampR = {};        // persisted lamp resistance (helps the solver settle)
const phase = {};        // current-dot animation offsets per edge

function newComp(type) {
  const t = TYPES[type];
  const c = { type };
  if ('value' in t) c.value = t.value;
  if (type === 'switch') c.open = false;
  return c;
}

// ---------- Physics models ----------

const WIRE_R = 1e-5;   // tiny, so wires drop no visible voltage but shorts still show up
const LAMP_R0 = 4, LAMP_K = 1 / 3;              // R = R0 (1 + k|V|): 4 Ω cold, 12 Ω at 6 V
const DIODE = { diode: { vd: 0.7, ron: 0.5 }, led: { vd: 2.0, ron: 2 } };

const ldrR = () => 10000 * Math.pow(0.01, state.light / 100);   // 10 kΩ dark → 100 Ω bright
const thermR = () => 4000 * Math.exp(-0.04 * state.temp);        // ≈ 4 kΩ at 0 °C → 73 Ω at 100 °C

function resistanceOf(key, c) {
  switch (c.type) {
    case 'wire': case 'ammeter': return WIRE_R;
    case 'switch': return c.open ? null : WIRE_R;
    case 'fuse': return c.blown ? null : WIRE_R;
    case 'resistor': case 'varres': return c.value;
    case 'lamp': return lampR[key] || LAMP_R0;
    case 'ldr': return ldrR();
    case 'thermistor': return thermR();
    default: return null;
  }
}

// Gaussian elimination with partial pivoting. Solves A x = z in place.
function gaussSolve(A, z) {
  const n = z.length;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    [A[i], A[p]] = [A[p], A[i]];
    [z[i], z[p]] = [z[p], z[i]];
    const d = A[i][i];
    if (Math.abs(d) < 1e-18) continue;
    for (let k = i + 1; k < n; k++) {
      const f = A[k][i] / d;
      if (!f) continue;
      for (let j = i; j < n; j++) A[k][j] -= f * A[i][j];
      z[k] -= f * z[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = z[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = Math.abs(A[i][i]) < 1e-18 ? 0 : s / A[i][i];
  }
  return x;
}

function solveOnce(diodeOn) {
  const nodes = new Map();
  const nodeOf = (k) => { if (!nodes.has(k)) nodes.set(k, nodes.size); return nodes.get(k); };
  const res = [];   // { key, a, b, g }
  const src = [];   // { key, p, n, E, sign }
  for (const [key, c] of state.comps) {
    const e = edgeInfo(key);
    const a = nodeOf(e.a), b = nodeOf(e.b);
    if (c.type === 'cell' || c.type === 'battery') {
      // Positive terminal at b unless flipped.
      src.push(c.flip ? { key, p: a, n: b, E: c.value, sign: 1 } : { key, p: b, n: a, E: c.value, sign: -1 });
    } else if (DIODE[c.type]) {
      const anode = c.flip ? b : a, cathode = c.flip ? a : b;
      if (diodeOn[key]) {
        const mid = nodeOf('d:' + key);
        src.push({ key, p: anode, n: mid, E: DIODE[c.type].vd, sign: c.flip ? -1 : 1 });
        res.push({ key: null, a: mid, b: cathode, g: 1 / DIODE[c.type].ron });
      } else {
        res.push({ key, a: anode, b: cathode, g: 1e-9, diodeOff: true });
      }
    } else {
      const R = resistanceOf(key, c);
      if (R != null) res.push({ key, a, b, g: 1 / R });
    }
  }

  const n = nodes.size, m = src.length, N = n + m;
  const A = Array.from({ length: N }, () => new Array(N).fill(0));
  const z = new Array(N).fill(0);
  for (let i = 0; i < n; i++) A[i][i] += 1e-9;   // tiny leak to 0 V keeps floating parts solvable
  for (const r of res) {
    A[r.a][r.a] += r.g; A[r.b][r.b] += r.g;
    A[r.a][r.b] -= r.g; A[r.b][r.a] -= r.g;
  }
  src.forEach((s, k) => {
    const j = n + k;
    A[s.p][j] += 1; A[s.n][j] -= 1;
    A[j][s.p] += 1; A[j][s.n] -= 1;
    z[j] = s.E;
  });
  const x = gaussSolve(A, z);

  const V = {}, I = {};
  for (const [k, i] of nodes) V[k] = x[i];
  for (const [key, c] of state.comps) {
    const e = edgeInfo(key);
    I[key] = 0;
    const R = DIODE[c.type] || c.type === 'cell' || c.type === 'battery' ? null : resistanceOf(key, c);
    if (R != null) I[key] = (V[e.a] - V[e.b]) / R;
  }
  // Source currents: x is the current from p to n through the source.
  src.forEach((s, k) => { I[s.key] = s.sign * x[n + k]; });
  for (const r of res) if (r.diodeOff) I[r.key] = (x[r.a] - x[r.b]) * r.g * (state.comps.get(r.key).flip ? -1 : 1);
  return { V, I };
}

function solve() {
  const diodeOn = {};
  let out;
  for (let pass = 0; pass < 3; pass++) {           // passes allow a fuse to blow and re-solve
    for (let it = 0; it < 40; it++) {
      out = solveOnce(diodeOn);
      let moved = false;
      for (const [key, c] of state.comps) {
        const e = edgeInfo(key);
        if (c.type === 'lamp') {
          const v = Math.abs(out.V[e.a] - out.V[e.b]);
          const target = LAMP_R0 * (1 + LAMP_K * v);
          const prev = lampR[key] || LAMP_R0;
          lampR[key] = 0.5 * prev + 0.5 * target;
          if (Math.abs(lampR[key] - prev) > 1e-4) moved = true;
        } else if (DIODE[c.type]) {
          const anode = c.flip ? e.b : e.a, cathode = c.flip ? e.a : e.b;
          const vf = out.V[anode] - out.V[cathode];
          const fwdI = out.I[key] * (c.flip ? -1 : 1);
          if (diodeOn[key] && fwdI < 0) { diodeOn[key] = false; moved = true; }
          else if (!diodeOn[key] && vf > DIODE[c.type].vd + 1e-6) { diodeOn[key] = true; moved = true; }
        }
      }
      if (!moved) break;
    }
    let blew = false;
    for (const [key, c] of state.comps) {
      if (c.type === 'fuse' && !c.blown && Math.abs(out.I[key]) > c.value) { c.blown = true; blew = true; }
    }
    if (!blew) break;
  }
  const short = [...state.comps.keys()].some((k) => Math.abs(out.I[k]) > 50);
  result = { ...out, ledOn: diodeOn, short };
}

// ---------- Readings ----------

function readings(key) {
  const c = state.comps.get(key);
  const e = edgeInfo(key);
  const v = result.V[e.a] != null ? result.V[e.b] - result.V[e.a] : 0;
  const i = result.I[key] || 0;
  return { V: Math.abs(v), I: Math.abs(i), c };
}

const fmtNum = (x) => {
  if (!isFinite(x)) return '—';
  if (Math.abs(x) < 1e-6) return '0';
  if (Math.abs(x) >= 1000) return String(Math.round(x));
  return String(parseFloat(x.toPrecision(3)));
};
const fmtA = (i) => `${fmtNum(i)} A`;
const fmtV = (v) => `${fmtNum(v)} V`;
const fmtR = (r) => (r >= 1000 ? `${parseFloat((r / 1000).toPrecision(3))} kΩ` : `${fmtNum(r)} Ω`);

// ---------- Symbol drawing (UK / IEC symbols), horizontal from (0,0) to (L,0) ----------

function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function leads(ctx, L, a, b) { line(ctx, 0, 0, a, 0); line(ctx, b, 0, L, 0); }
function arrowHead(ctx, x1, y1, x2, y2, size = 6) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang - 0.45), y2 - size * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - size * Math.cos(ang + 0.45), y2 - size * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
}
function arrow(ctx, x1, y1, x2, y2, size) { line(ctx, x1, y1, x2, y2); arrowHead(ctx, x1, y1, x2, y2, size); }

function drawSymbol(ctx, type, L, c, col, w, extra = {}) {
  const m = L / 2;
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (type) {
    case 'wire':
      line(ctx, 0, 0, L, 0);
      break;
    case 'cell': {
      leads(ctx, L, m - 5, m + 5);
      ctx.lineWidth = w * 2.4; line(ctx, m - 5, -9, m - 5, 9);
      ctx.lineWidth = w; line(ctx, m + 5, -18, m + 5, 18);
      break;
    }
    case 'battery': {
      leads(ctx, L, m - 17, m + 17);
      ctx.lineWidth = w * 2.4; line(ctx, m - 17, -9, m - 17, 9); line(ctx, m + 9, -9, m + 9, 9);
      ctx.lineWidth = w; line(ctx, m - 9, -18, m - 9, 18); line(ctx, m + 17, -18, m + 17, 18);
      ctx.setLineDash([3, 3]); line(ctx, m - 9, 0, m + 9, 0); ctx.setLineDash([]);
      break;
    }
    case 'lamp': {
      leads(ctx, L, m - 15, m + 15);
      const b = extra.glow || 0;
      if (b > 0.01) {
        const g = ctx.createRadialGradient(m, 0, 4, m, 0, 34);
        g.addColorStop(0, `rgba(255, 210, 60, ${0.9 * b})`);
        g.addColorStop(1, 'rgba(255, 210, 60, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(m, 0, 34, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col;
      }
      ctx.beginPath(); ctx.arc(m, 0, 15, 0, Math.PI * 2); ctx.stroke();
      const d = 15 * Math.SQRT1_2;
      line(ctx, m - d, -d, m + d, d); line(ctx, m - d, d, m + d, -d);
      break;
    }
    case 'resistor':
      leads(ctx, L, m - 20, m + 20);
      ctx.strokeRect(m - 20, -8, 40, 16);
      break;
    case 'varres':
      leads(ctx, L, m - 20, m + 20);
      ctx.strokeRect(m - 20, -8, 40, 16);
      arrow(ctx, m - 18, 15, m + 18, -16, 7);
      break;
    case 'ldr':
      leads(ctx, L, m - 15, m + 15);
      ctx.strokeRect(m - 15, -7, 30, 14);
      ctx.beginPath(); ctx.arc(m, 0, 23, 0, Math.PI * 2); ctx.stroke();
      arrow(ctx, m - 30, -36, m - 17, -23, 6);
      arrow(ctx, m - 18, -42, m - 5, -29, 6);
      break;
    case 'thermistor':
      leads(ctx, L, m - 20, m + 20);
      ctx.strokeRect(m - 20, -8, 40, 16);
      line(ctx, m - 26, 15, m - 15, 15);
      line(ctx, m - 15, 15, m + 17, -16);
      break;
    case 'diode':
    case 'led': {
      leads(ctx, L, m - 10, m + 10);
      line(ctx, m - 10, 0, m + 10, 0);
      ctx.beginPath(); ctx.moveTo(m - 10, -11); ctx.lineTo(m - 10, 11); ctx.lineTo(m + 10, 0); ctx.closePath(); ctx.fill();
      line(ctx, m + 10, -12, m + 10, 12);
      if (type === 'led') {
        if (extra.glow) {
          const g = ctx.createRadialGradient(m, 0, 2, m, 0, 30);
          g.addColorStop(0, 'rgba(255, 60, 60, .8)');
          g.addColorStop(1, 'rgba(255, 60, 60, 0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(m, 0, 30, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = col;
        }
        arrow(ctx, m + 2, -14, m + 12, -26, 5);
        arrow(ctx, m + 10, -12, m + 20, -24, 5);
      }
      break;
    }
    case 'switch': {
      leads(ctx, L, m - 16, m + 16);
      ctx.beginPath(); ctx.arc(m - 16, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(m + 16, 0, 3, 0, Math.PI * 2); ctx.fill();
      if (c && c.open) line(ctx, m - 16, 0, m + 13, -17);
      else line(ctx, m - 16, 0, m + 16, 0);
      break;
    }
    case 'fuse':
      leads(ctx, L, m - 18, m + 18);
      ctx.strokeRect(m - 18, -7, 36, 14);
      if (c && c.blown) { line(ctx, m - 18, 0, m - 5, 0); line(ctx, m + 5, 0, m + 18, 0); line(ctx, m - 5, 0, m - 1, -5); line(ctx, m + 5, 0, m + 1, 5); }
      else line(ctx, m - 18, 0, m + 18, 0);
      break;
    case 'ammeter':
    case 'voltmeter':
      leads(ctx, L, m - 15, m + 15);
      ctx.beginPath(); ctx.arc(m, 0, 15, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'select': {
      ctx.beginPath(); ctx.moveTo(m - 6, -14); ctx.lineTo(m - 6, 10); ctx.lineTo(m, 4); ctx.lineTo(m + 9, 8); ctx.closePath(); ctx.fill();
      break;
    }
    case 'erase': {
      ctx.save(); ctx.translate(m, 0); ctx.rotate(-0.6);
      ctx.strokeRect(-14, -7, 28, 14); line(ctx, -2, -7, -2, 7);
      ctx.restore();
      break;
    }
  }
}

// Letters and "+" signs are drawn upright, whatever way the component points.
function drawUprightMarks(ctx, type, mx, my, vertical, flip, col) {
  ctx.fillStyle = col;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (type === 'ammeter' || type === 'voltmeter') {
    ctx.font = `700 18px ${PK.cssVar('--font-body') || 'sans-serif'}`;
    ctx.fillText(type === 'ammeter' ? 'A' : 'V', mx, my + 1);
  }
  if (type === 'cell' || type === 'battery') {
    const off = (type === 'cell' ? 5 : 17) * (flip ? -1 : 1);
    const px = vertical ? mx + 24 : mx + off + 9 * (flip ? -1 : 1);
    const py = vertical ? my + off + 7 * (flip ? -1 : 1) : my - 22;
    ctx.font = `700 15px ${PK.cssVar('--font-body') || 'sans-serif'}`;
    ctx.fillText('+', px, py);
  }
}

// ---------- Board rendering ----------

const board = $('board');
const ctx = board.getContext('2d');

function sizeBoard() {
  const dpr = window.devicePixelRatio || 1;
  board.width = Math.round(board.clientWidth * dpr);
  board.height = Math.round(board.clientWidth * (H / W) * dpr);
}

function degreeMap() {
  const deg = {};
  for (const key of state.comps.keys()) {
    const e = edgeInfo(key);
    deg[e.a] = (deg[e.a] || 0) + 1;
    deg[e.b] = (deg[e.b] || 0) + 1;
  }
  return deg;
}

let lastT = performance.now();

function draw(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  const scale = board.width / W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const col = {
    surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'),
    grid: PK.cssVar('--border-strong'), accent: PK.cssVar('--accent'), answer: PK.cssVar('--answer') || PK.cssVar('--accent'),
    dot: state.flow === 'electron' ? PK.cssVar('--f1') : PK.cssVar('--f2'), bad: PK.cssVar('--bad'),
  };
  const stroke = parseFloat(PK.cssVar('--stroke')) || 1;
  const font = PK.cssVar('--font-body') || 'sans-serif';

  ctx.fillStyle = col.surface;
  ctx.fillRect(0, 0, W, H);

  // Hover highlight
  if (state.hover && !state.comps.has(state.hover) && TYPES[state.tool] && !TYPES[state.tool].tool) {
    const e = edgeInfo(state.hover);
    ctx.strokeStyle = col.accent; ctx.globalAlpha = 0.35; ctx.lineWidth = 10; ctx.lineCap = 'round';
    line(ctx, e.x1, e.y1, e.x2, e.y2);
    ctx.globalAlpha = 1;
  }

  // Grid dots
  const deg = degreeMap();
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    if (deg[`${c},${r}`]) continue;
    ctx.fillStyle = col.grid;
    ctx.beginPath(); ctx.arc(vx(c), vy(r), 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // Components
  for (const [key, c] of state.comps) {
    const e = edgeInfo(key);
    const vertical = e.o === 'v';
    const mx = (e.x1 + e.x2) / 2, my = (e.y1 + e.y2) / 2;
    const extra = {};
    const rd = readings(key);
    if (c.type === 'lamp') extra.glow = Math.pow(Math.min(1, (rd.V * rd.I) / 3), 0.6);
    if (c.type === 'led') extra.glow = result.ledOn[key] && rd.I > 1e-3;

    if (state.selected === key) {
      ctx.fillStyle = PK.cssVar('--accent-soft');
      if (vertical) ctx.fillRect(mx - 30, e.y1 + 6, 60, S - 12);
      else ctx.fillRect(e.x1 + 6, my - 30, S - 12, 60);
    }

    ctx.save();
    ctx.translate(e.x1, e.y1);
    if (vertical) ctx.rotate(Math.PI / 2);
    if (c.flip) { ctx.translate(S, 0); ctx.scale(-1, 1); }
    drawSymbol(ctx, c.type, S, c, c.type === 'fuse' && c.blown ? col.bad : col.text, 2.5 * stroke, extra);
    ctx.restore();
    drawUprightMarks(ctx, c.type, mx, my, vertical, c.flip, col.text);

    // Labels: set values (above / right) and meter readings (below / left).
    const lab = (text, colour, side) => {
      ctx.font = `700 14px ${font}`;
      ctx.fillStyle = colour;
      ctx.textBaseline = 'middle';
      if (vertical) {
        ctx.textAlign = side > 0 ? 'left' : 'right';
        ctx.fillText(text, mx + side * 30, my);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(text, mx, my + side * 30);
      }
    };
    const T = TYPES[c.type];
    // Set values go below (or right); meter readings go above (or left), so they never collide.
    if (state.showValues && 'value' in T && c.type !== 'fuse') lab(`${fmtNum(c.value)} ${T.unit}`, col.muted, 1);
    if (state.showValues && c.type === 'fuse') lab(c.blown ? 'blown!' : `${c.value} A`, c.blown ? col.bad : col.muted, 1);
    if (c.type === 'ammeter') readingTag(rd.I, 'A', mx, my, vertical, col, font);
    if (c.type === 'voltmeter') readingTag(rd.V, 'V', mx, my, vertical, col, font);
  }

  // Junction dots where three or more connections meet
  for (const [k, d] of Object.entries(deg)) {
    if (d < 3) continue;
    const [c, r] = k.split(',').map(Number);
    ctx.fillStyle = col.text;
    ctx.beginPath(); ctx.arc(vx(c), vy(r), 5, 0, Math.PI * 2); ctx.fill();
  }

  // Moving charges
  if (state.flow !== 'off') {
    ctx.fillStyle = col.dot;
    const dir = state.flow === 'electron' ? -1 : 1;
    for (const [key, c] of state.comps) {
      if (c.type === 'voltmeter') continue;
      const I = result.I[key] || 0;
      if (Math.abs(I) < 1e-4 || result.short) continue;
      const speed = Math.min(160, 25 + Math.abs(I) * 60) * Math.sign(I) * dir;
      phase[key] = ((phase[key] || 0) + speed * dt) % 20;
      const e = edgeInfo(key);
      for (let s = (phase[key] + 20) % 20; s < S; s += 20) {
        const f = s / S;
        ctx.beginPath();
        ctx.arc(e.x1 + (e.x2 - e.x1) * f, e.y1 + (e.y2 - e.y1) * f, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (result.short) {
    ctx.fillStyle = col.bad;
    ctx.fillRect(W / 2 - 200, 6, 400, 30);
    ctx.fillStyle = '#fff';
    ctx.font = `700 15px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Short circuit! A huge current would flow.', W / 2, 21);
  }

  requestAnimationFrame(draw);
}

function readingTag(value, unit, mx, my, vertical, col, font) {
  const text = `${fmtNum(value)} ${unit}`;
  ctx.font = `700 14px ${font}`;
  const w = ctx.measureText(text).width + 12;
  const x = vertical ? mx - 30 - w : mx - w / 2;
  const y = vertical ? my - 12 : Math.max(2, my - 46);
  ctx.fillStyle = col.surface;
  ctx.strokeStyle = col.answer;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, 24, 4) : ctx.rect(x, y, w, 24);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = col.answer;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 12.5);
}

// ---------- Palette ----------

function paletteIcon(type) {
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.width = 60 * dpr; cv.height = 34 * dpr;
  const g = cv.getContext('2d');
  g.setTransform(dpr * 0.6, 0, 0, dpr * 0.6, 0, 17 * dpr);
  drawSymbol(g, type, 100, newComp(type === 'select' || type === 'erase' ? 'wire' : type), PK.cssVar('--text'), 3);
  if (type === 'ammeter' || type === 'voltmeter') {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = PK.cssVar('--text');
    g.font = '700 11px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(type === 'ammeter' ? 'A' : 'V', 30, 17.5);
  }
  return cv;
}

function buildPalette() {
  const el = $('palette');
  el.innerHTML = '';
  for (const type of PALETTE) {
    const b = document.createElement('button');
    b.className = 'tool-btn';
    b.dataset.tool = type;
    b.setAttribute('aria-pressed', String(state.tool === type));
    b.appendChild(paletteIcon(type));
    const span = document.createElement('span');
    span.textContent = TYPES[type].name;
    b.appendChild(span);
    b.addEventListener('click', () => { state.tool = type; syncPalette(); updateHint(); });
    el.appendChild(b);
  }
}

function syncPalette() {
  document.querySelectorAll('.tool-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === state.tool)));
}

function updateHint() {
  const t = state.tool;
  $('hint').textContent = t === 'select' ? 'Tap a component to see its readings.'
    : t === 'erase' ? 'Tap or drag over components to remove them.'
      : t === 'wire' ? 'Tap a gap, or drag along the dots, to draw wires.'
        : `Tap a gap between two dots to place a ${TYPES[t].name.toLowerCase()}.`;
}

// ---------- Interaction ----------

function boardPoint(evt) {
  const r = board.getBoundingClientRect();
  return { x: (evt.clientX - r.left) * (W / r.width), y: (evt.clientY - r.top) * (H / r.height) };
}

// Nearest gap between two dots, or null if the pointer isn't close to one.
function edgeAt(p) {
  const gx = (p.x - OX) / S, gy = (p.y - OY) / S;
  const hr = Math.round(gy), hc = Math.floor(gx);
  const vc = Math.round(gx), vr = Math.floor(gy);
  const dh = Math.abs(gy - hr) + (gx - hc < 0.12 || gx - hc > 0.88 ? 0.5 : 0);
  const dv = Math.abs(gx - vc) + (gy - vr < 0.12 || gy - vr > 0.88 ? 0.5 : 0);
  const options = [];
  if (validEdge('h', hc, hr)) options.push({ key: `h,${hc},${hr}`, d: dh });
  if (validEdge('v', vc, vr)) options.push({ key: `v,${vc},${vr}`, d: dv });
  options.sort((a, b) => a.d - b.d);
  return options.length && options[0].d < 0.4 ? options[0].key : null;
}

let painting = false;
let lastPainted = null;

function applyTool(key, isDrag) {
  if (!key) return;
  const existing = state.comps.get(key);
  const tool = state.tool;
  if (tool === 'erase') {
    if (existing) { state.comps.delete(key); if (state.selected === key) state.selected = null; changed(); }
    return;
  }
  if (isDrag) {
    if (tool === 'wire' && !existing) { state.comps.set(key, newComp('wire')); changed(); }
    return;
  }
  if (existing) {
    if (existing.type === 'switch') {
      existing.open = !existing.open;               // tapping a switch flips it
    } else if (existing.type === 'wire' && tool !== 'select' && tool !== 'wire') {
      state.comps.set(key, newComp(tool));          // swap a wire for the chosen component
    }
    state.selected = key;
    changed();
    return;
  }
  if (tool === 'select') { state.selected = null; renderSelected(); return; }
  state.comps.set(key, newComp(tool));
  state.selected = tool === 'wire' ? state.selected : key;
  changed();
}

board.addEventListener('pointerdown', (e) => {
  const key = edgeAt(boardPoint(e));
  painting = state.tool === 'wire' || state.tool === 'erase';
  lastPainted = key;
  if (painting) { try { board.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ } }
  applyTool(key, false);
  e.preventDefault();
});

board.addEventListener('pointermove', (e) => {
  const key = edgeAt(boardPoint(e));
  state.hover = key;
  if (painting && key && key !== lastPainted) {
    lastPainted = key;
    applyTool(key, true);
  }
});

const stopPaint = () => { painting = false; lastPainted = null; };
board.addEventListener('pointerup', stopPaint);
board.addEventListener('pointercancel', stopPaint);
board.addEventListener('pointerleave', () => { state.hover = null; });

// ---------- Selected panel ----------

function renderSelected() {
  const el = $('selected');
  const key = state.selected;
  const c = key && state.comps.get(key);
  // Selecting a testable component makes it the one being tested, until readings exist.
  if (c && TESTABLE.includes(c.type) && !results.rows.length && results.test !== key) {
    results.test = key;
    results.sign = 0;
    syncTestSelect();
  }
  if (!c) {
    el.innerHTML = '<p class="note" style="margin:0">Choose <b>Select</b> and tap a component to see the current through it and the potential difference across it.</p>';
    return;
  }
  const T = TYPES[c.type];

  let controls = '';
  if ('value' in T && T.choices) {
    controls += `<div class="ctl"><label for="c-val">Rating</label><select class="select" id="c-val">${T.choices.map((v) => `<option value="${v}" ${v === c.value ? 'selected' : ''}>${v} A</option>`).join('')}</select></div>`;
  } else if ('value' in T && T.slider) {
    controls += `<div class="ctl-wide"><label class="note" style="margin:0" for="c-val">Resistance: <b id="c-val-out">${fmtR(c.value)}</b></label><input type="range" id="c-val" min="${T.min}" max="${T.max}" step="${T.step}" value="${c.value}"></div>`;
  } else if ('value' in T) {
    controls += `<div class="ctl"><label for="c-val">${c.type === 'resistor' ? 'Resistance' : 'Voltage'} (${T.unit})</label><input type="number" id="c-val" min="${T.min}" max="${T.max}" step="${T.step}" value="${c.value}" inputmode="decimal"></div>`;
  }
  const btns = [];
  if (T.polar) btns.push('<button class="btn" id="c-flip">⇄ Turn round</button>');
  if (c.type === 'switch') btns.push(`<button class="btn" id="c-toggle">${c.open ? 'Close switch' : 'Open switch'}</button>`);
  if (c.type === 'fuse' && c.blown) btns.push('<button class="btn primary" id="c-replace">Replace fuse</button>');
  btns.push('<button class="btn" id="c-delete">🗑 Remove</button>');

  el.innerHTML = `
    <div class="sel-head"><span id="sel-icon"></span><b>${T.name}${c.type === 'switch' ? (c.open ? ' (open)' : ' (closed)') : ''}${c.type === 'fuse' && c.blown ? ' — blown' : ''}</b></div>
    <dl class="readout" id="sel-readout">${readoutHtml(key)}</dl>
    ${controls}
    <div class="btn-row" style="margin-top:10px">${btns.join('')}</div>
    <p class="note">${DESCRIPTIONS[c.type] || ''}</p>`;
  $('sel-icon').appendChild(paletteIcon(c.type));

  const val = $('c-val');
  if (val) {
    val.addEventListener(T.slider ? 'input' : 'change', () => {
      let v = Number(val.value);
      if (!isFinite(v) || v <= 0) return;
      if (T.min != null) v = Math.max(T.min, Math.min(T.max, v));
      c.value = v;
      if (c.type === 'fuse') c.blown = false;
      changed(T.slider);
      if (T.slider) $('c-val-out').textContent = fmtR(v);
    });
  }
  const on = (id, fn) => { const b = $(id); if (b) b.addEventListener('click', fn); };
  on('c-flip', () => { c.flip = !c.flip; changed(); });
  on('c-toggle', () => { c.open = !c.open; changed(); });
  on('c-replace', () => { c.blown = false; changed(); });
  on('c-delete', () => { state.comps.delete(key); state.selected = null; changed(); });
}

function readoutHtml(key) {
  const c = state.comps.get(key);
  const rd = readings(key);
  const R = c.type === 'cell' || c.type === 'battery' ? null
    : DIODE[c.type] || c.type === 'lamp' ? (rd.I > 1e-6 ? rd.V / rd.I : null)
      : resistanceOf(key, c);
  const rows = [['Current (I)', fmtA(rd.I)]];
  if (c.type !== 'wire') {
    rows.push(['Potential difference (V)', fmtV(rd.V)]);
    if (R != null && !['ammeter', 'switch', 'fuse'].includes(c.type)) rows.push(['Resistance (R)', fmtR(R)]);
    if (!['ammeter', 'voltmeter', 'switch', 'fuse'].includes(c.type)) rows.push(['Power (P = V I)', `${fmtNum(rd.V * rd.I)} W`]);
  }
  return rows.map(([k, v]) => `<dt>${k}</dt><dd style="color: var(--answer, inherit)">${v}</dd>`).join('');
}

// Update just the numbers while a slider is being dragged (rebuilding would interrupt the drag).
function refreshReadingsOnly() {
  const key = state.selected;
  const dl = $('sel-readout');
  if (key && dl && state.comps.has(key)) dl.innerHTML = readoutHtml(key);
}

// ---------- Surroundings (LDR / thermistor) ----------

function renderEnv() {
  const types = new Set([...state.comps.values()].map((c) => c.type));
  $('env-panel').hidden = !types.has('ldr') && !types.has('thermistor');
  $('light-ctl').hidden = !types.has('ldr');
  $('temp-ctl').hidden = !types.has('thermistor');
  $('light-val').textContent = `${state.light}% (LDR = ${fmtR(ldrR())})`;
  $('temp-val').textContent = `${state.temp} °C (thermistor = ${fmtR(thermR())})`;
}

$('light').addEventListener('input', (e) => { state.light = Number(e.target.value); solve(); renderEnv(); refreshReadingsOnly(); });
$('temp').addEventListener('input', (e) => { state.temp = Number(e.target.value); solve(); renderEnv(); refreshReadingsOnly(); });

// ---------- Presets ----------

function rect(c1, r1, c2, r2) {
  const keys = [];
  for (let c = c1; c < c2; c++) { keys.push(`h,${c},${r1}`); keys.push(`h,${c},${r2}`); }
  for (let r = r1; r < r2; r++) { keys.push(`v,${c1},${r}`); keys.push(`v,${c2},${r}`); }
  return keys;
}

const PRESETS = [
  { id: 'none', name: 'Choose an example…' },
  { id: 'simple', name: 'Cell, switch and lamp', build: () => [rect(2, 1, 6, 4), { 'h,3,4': ['cell', { flip: true }], 'h,4,1': ['lamp'], 'v,6,2': ['switch'] }] },
  { id: 'series', name: 'Two lamps in series', build: () => [rect(2, 1, 7, 4), { 'h,4,4': ['battery', { flip: true }], 'h,3,1': ['lamp'], 'h,5,1': ['lamp'], 'v,2,2': ['ammeter'], 'v,7,2': ['ammeter'] }] },
  { id: 'parallel', name: 'Two lamps in parallel', build: () => [
    [...rect(2, 1, 7, 5), 'h,2,3', 'h,3,3', 'h,4,3', 'h,5,3', 'h,6,3'],
    { 'v,2,4': ['battery', { flip: true }], 'h,4,1': ['lamp'], 'h,4,3': ['lamp'], 'h,5,1': ['ammeter'], 'h,5,3': ['ammeter'], 'h,4,5': ['ammeter'] }] },
  { id: 'resistance', name: 'Required practical: resistance', build: () => [
    [...rect(2, 1, 7, 4), 'v,4,0', 'h,4,0', 'v,5,0'],
    { 'h,3,4': ['battery', { flip: true }], 'h,4,1': ['resistor'], 'h,4,0': ['voltmeter'], 'h,5,4': ['ammeter'], 'v,7,2': ['varres'] }] },
  { id: 'iv-lamp', name: 'Required practical: I–V of a lamp', build: () => [
    [...rect(2, 1, 7, 4), 'v,4,0', 'h,4,0', 'v,5,0'],
    { 'h,3,4': ['battery', { flip: true }], 'h,4,1': ['lamp'], 'h,4,0': ['voltmeter'], 'h,5,4': ['ammeter'], 'v,7,2': ['varres'] }] },
  { id: 'diode', name: 'Diode: which way round?', build: () => [
    [...rect(1, 1, 4, 4), ...rect(5, 1, 8, 4)],
    { 'h,2,4': ['battery', { flip: true }], 'h,2,1': ['diode'], 'h,3,1': ['lamp'], 'h,6,4': ['battery', { flip: true }], 'h,6,1': ['diode', { flip: true }], 'h,7,1': ['lamp'] }] },
  { id: 'ldr', name: 'LDR and thermistor', build: () => [
    [...rect(1, 1, 4, 4), ...rect(5, 1, 8, 4)],
    { 'h,2,4': ['battery', { flip: true }], 'h,2,1': ['ldr'], 'v,4,2': ['ammeter'], 'h,6,4': ['battery', { flip: true }], 'h,6,1': ['thermistor'], 'v,8,2': ['ammeter'] }] },
  { id: 'fuse', name: 'Fuse blowing', build: () => [rect(2, 1, 7, 4), { 'h,3,4': ['battery', { value: 12, flip: true }], 'h,3,1': ['fuse', { value: 1 }], 'h,5,1': ['varres', { value: 40 }], 'v,7,2': ['ammeter'] }] },
];

function applyPreset(id) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p || !p.build) return;
  const [wires, parts] = p.build();
  state.comps.clear();
  for (const k of Object.keys(lampR)) delete lampR[k];
  for (const k of wires) state.comps.set(k, newComp('wire'));
  for (const [k, [type, props]] of Object.entries(parts)) state.comps.set(k, Object.assign(newComp(type), props || {}));
  state.selected = null;
  state.tool = 'select';
  syncPalette();
  updateHint();
  changed();
  $('preset').value = id;
}

$('preset').innerHTML = PRESETS.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
$('preset').addEventListener('change', (e) => applyPreset(e.target.value));

// ---------- Options ----------

$('flow').addEventListener('change', (e) => { state.flow = e.target.value; });
$('show-values').addEventListener('change', (e) => { state.showValues = e.target.checked; });
$('clear').addEventListener('click', () => { state.comps.clear(); state.selected = null; $('preset').value = 'none'; changed(); });
$('share').addEventListener('click', () => { saveHash(); PK.copyLink(); });

// ---------- Shareable link ----------

function saveHash() {
  const parts = [];
  for (const [key, c] of state.comps) {
    const flags = (c.flip ? 'f' : '') + (c.open ? 'o' : '');
    parts.push([key.replace(/,/g, '.'), c.type, c.value ?? '', flags].join('~'));
  }
  const p = new URLSearchParams();
  if (parts.length) p.set('c', parts.join('_'));
  if (state.light !== 50) p.set('light', state.light);
  if (state.temp !== 20) p.set('temp', state.temp);
  history.replaceState(null, '', parts.length ? '#' + p.toString() : location.pathname);
}

function loadHash() {
  if (!location.hash) return false;
  const p = new URLSearchParams(location.hash.slice(1));
  const raw = p.get('c');
  if (!raw) return false;
  for (const item of raw.split('_')) {
    const [k, type, value, flags = ''] = item.split('~');
    const key = k.replace(/\./g, ',');
    const [o, c, r] = key.split(',');
    if (!TYPES[type] || TYPES[type].tool || !validEdge(o, Number(c), Number(r))) continue;
    const comp = newComp(type);
    if (value !== '' && 'value' in TYPES[type]) comp.value = Number(value) || comp.value;
    comp.flip = flags.includes('f');
    if (type === 'switch') comp.open = flags.includes('o');
    state.comps.set(key, comp);
  }
  state.light = Math.max(0, Math.min(100, Number(p.get('light') ?? 50)));
  state.temp = Math.max(0, Math.min(100, Number(p.get('temp') ?? 20)));
  $('light').value = state.light;
  $('temp').value = state.temp;
  return true;
}

// ---------- Results table and I–V graph ----------

const TESTABLE = ['lamp', 'resistor', 'varres', 'ldr', 'thermistor', 'diode', 'led'];
const results = { test: null, rows: [], sign: 0, table: true, graph: true, join: true };

function testableList() {
  const counts = {};
  const list = [];
  for (const [key, c] of state.comps) {
    if (!TESTABLE.includes(c.type)) continue;
    counts[c.type] = (counts[c.type] || 0) + 1;
    list.push({ key, label: `${TYPES[c.type].name} ${counts[c.type]}` });
  }
  // Number a type only when there is more than one of it.
  return list.map((it) => {
    const type = state.comps.get(it.key).type;
    return counts[type] > 1 ? it : { ...it, label: TYPES[type].name };
  });
}

function syncTestSelect() {
  const list = testableList();
  if (!list.some((it) => it.key === results.test)) {
    const prev = results.test;
    results.test = list.length ? list[0].key : null;
    if (prev !== results.test) { results.rows = []; results.sign = 0; }
  }
  const sel = $('test-comp');
  sel.innerHTML = list.length
    ? list.map((it) => `<option value="${it.key}" ${it.key === results.test ? 'selected' : ''}>${it.label}</option>`).join('')
    : '<option value="">Add a lamp, resistor or diode first</option>';
  sel.disabled = !list.length;
  $('record').disabled = !list.length;
}

// Signed readings. Diodes and LEDs count forward bias as positive; for other components
// the first reading recorded is made positive, so a normal set-up plots in the top-right.
function signedReading(key) {
  const c = state.comps.get(key);
  const e = edgeInfo(key);
  let v = (result.V[e.a] ?? 0) - (result.V[e.b] ?? 0);
  let i = result.I[key] || 0;
  let s;
  if (DIODE[c.type]) s = c.flip ? -1 : 1;
  else {
    if (!results.sign) results.sign = (Math.abs(v) > 1e-9 ? Math.sign(v) : 1);
    s = results.sign;
  }
  v *= s; i *= s;
  // Below a microamp counts as no current (the solver leaks a trace through "off" diodes).
  return { V: Math.abs(v) < 1e-9 ? 0 : v, I: Math.abs(i) < 1e-6 ? 0 : i };
}

function renderResults() {
  const wrap = $('table-wrap');
  wrap.hidden = !results.table;
  if (results.table) {
    wrap.innerHTML = results.rows.length
      ? `<table class="results">
          <thead><tr><th>#</th><th>V (V)</th><th>I (A)</th><th>R (Ω)</th><th><span class="sr-only">Delete</span></th></tr></thead>
          <tbody>${results.rows.map((r, n) => `<tr>
            <td>${n + 1}</td>
            <td class="num">${fmtNum(r.V)}</td>
            <td class="num">${fmtNum(r.I)}</td>
            <td class="num">${r.I ? fmtNum(r.V / r.I) : r.V ? 'very high' : '—'}</td>
            <td><button class="del" data-row="${n}" aria-label="Delete reading ${n + 1}">✕</button></td></tr>`).join('')}</tbody>
        </table>`
      : '<p class="note">No readings yet.</p>';
  }
  $('graph-wrap').hidden = !results.graph;
  if (results.graph) drawGraph();
}

function niceStep(x) {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / p;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
}

function drawGraph() {
  const cv = $('graph');
  const dpr = window.devicePixelRatio || 1;
  const GW = 270, GH = 230;
  cv.width = Math.round(cv.clientWidth * dpr);
  cv.height = Math.round(cv.clientWidth * (GH / GW) * dpr);
  const g = cv.getContext('2d');
  const k = cv.width / GW;
  g.setTransform(k, 0, 0, k, 0, 0);
  const col = {
    surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'),
    grid: PK.cssVar('--grid'), point: PK.cssVar('--answer') || PK.cssVar('--accent'), line: PK.cssVar('--accent'),
  };
  const font = PK.cssVar('--font-body') || 'sans-serif';
  g.fillStyle = col.surface;
  g.fillRect(0, 0, GW, GH);

  const L = 46, R = 12, T = 12, B = 38;
  const pw = GW - L - R, ph = GH - T - B;
  const rows = results.rows;
  const neg = rows.some((r) => r.V < 0 || r.I < 0);
  const maxV = Math.max(1, ...rows.map((r) => Math.abs(r.V)));
  const maxI = Math.max(0.1, ...rows.map((r) => Math.abs(r.I)));
  const sx = niceStep(maxV / (neg ? 2 : 4)), sy = niceStep(maxI / (neg ? 2 : 4));
  const xMax = Math.ceil(maxV / sx) * sx, yMax = Math.ceil(maxI / sy) * sy;
  const xMin = neg ? -xMax : 0, yMin = neg ? -yMax : 0;
  const X = (v) => L + ((v - xMin) / (xMax - xMin)) * pw;
  const Y = (i) => T + ph - ((i - yMin) / (yMax - yMin)) * ph;

  // Grid and tick labels
  g.lineWidth = 1;
  g.font = `600 11px ${font}`;
  g.fillStyle = col.muted;
  g.textAlign = 'center';
  g.textBaseline = 'top';
  const dec = (s) => Math.max(0, -Math.floor(Math.log10(s) + 1e-9));
  const tick = (v, s) => (Math.abs(v) < s / 1000 ? '0' : v.toFixed(dec(s)));
  for (let n = 0, v = xMin; v <= xMax + 1e-9; n++, v = xMin + n * sx) {
    g.strokeStyle = col.grid;
    g.beginPath(); g.moveTo(X(v), T); g.lineTo(X(v), T + ph); g.stroke();
    g.fillText(tick(v, sx), X(v), T + ph + 4);
  }
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  for (let n = 0, i = yMin; i <= yMax + 1e-9; n++, i = yMin + n * sy) {
    g.strokeStyle = col.grid;
    g.beginPath(); g.moveTo(L, Y(i)); g.lineTo(L + pw, Y(i)); g.stroke();
    g.fillText(tick(i, sy), L - 4, Y(i));
  }

  // Axes through the origin
  g.strokeStyle = col.text;
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(X(0), T); g.lineTo(X(0), T + ph); g.stroke();
  g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(L + pw, Y(0)); g.stroke();

  g.fillStyle = col.text;
  g.font = `700 12px ${font}`;
  g.textAlign = 'center';
  g.textBaseline = 'bottom';
  g.fillText('potential difference / V', L + pw / 2, GH - 2);
  g.save();
  g.translate(11, T + ph / 2);
  g.rotate(-Math.PI / 2);
  g.textBaseline = 'middle';
  g.fillText('current / A', 0, 0);
  g.restore();

  if (!rows.length) {
    g.fillStyle = col.muted;
    g.font = `600 12px ${font}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('Record readings to plot the graph', L + pw / 2, T + ph / 3);
    return;
  }

  if (results.join && rows.length > 1) {
    const sorted = [...rows].sort((a, b) => a.V - b.V);
    g.strokeStyle = col.line;
    g.lineWidth = 1.5;
    g.beginPath();
    sorted.forEach((r, n) => (n ? g.lineTo(X(r.V), Y(r.I)) : g.moveTo(X(r.V), Y(r.I))));
    g.stroke();
  }

  // Points as crosses, as drawn in a practical write-up.
  g.strokeStyle = col.point;
  g.lineWidth = 2;
  for (const r of rows) {
    const x = X(r.V), y = Y(r.I);
    g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x - 4, y + 4); g.lineTo(x + 4, y - 4); g.stroke();
  }
}

$('test-comp').addEventListener('change', (e) => {
  results.test = e.target.value || null;
  results.rows = [];
  results.sign = 0;
  renderResults();
});
$('record').addEventListener('click', () => {
  if (!results.test) return;
  results.rows.push(signedReading(results.test));
  renderResults();
});
$('clear-results').addEventListener('click', () => { results.rows = []; results.sign = 0; renderResults(); });
$('table-wrap').addEventListener('click', (e) => {
  const b = e.target.closest('.del');
  if (!b) return;
  results.rows.splice(Number(b.dataset.row), 1);
  if (!results.rows.length) results.sign = 0;
  renderResults();
});
$('show-table').addEventListener('change', (e) => { results.table = e.target.checked; renderResults(); });
$('show-graph').addEventListener('change', (e) => { results.graph = e.target.checked; renderResults(); });
$('join').addEventListener('change', (e) => { results.join = e.target.checked; drawGraph(); });
window.addEventListener('resize', () => { if (results.graph) drawGraph(); });

// ---------- Update cycle ----------

function changed(fromSlider = false) {
  solve();
  renderEnv();
  syncTestSelect();
  if (fromSlider) refreshReadingsOnly(); else renderSelected();
  saveHash();
}

window.addEventListener('resize', sizeBoard);
window.addEventListener('pk-theme', () => { buildPalette(); renderSelected(); renderResults(); });

sizeBoard();
buildPalette();
updateHint();
if (loadHash()) { state.tool = 'select'; syncPalette(); updateHint(); changed(); } else applyPreset('simple');
renderResults();
requestAnimationFrame(draw);
