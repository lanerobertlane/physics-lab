// Bonding: choose two elements and see ionic, covalent or metallic bonding, drawn as a dot and
// cross diagram or with the atom model, with a model 4-mark exam answer.

PK.header({
  title: 'Bonding',
  answers: true,
  spec: [
    { code: '4.2.1.1', text: 'Chemical bonds: ionic, covalent and metallic' },
    { code: '4.2.1.2', text: 'Ionic bonding: metal atoms lose electrons and non-metal atoms gain electrons to form ions with full outer shells; dot and cross diagrams' },
    { code: '4.2.1.3', text: 'Ionic compounds: a giant structure of ions held by strong electrostatic forces; working out the formula from the charges' },
    { code: '4.2.1.4', text: 'Covalent bonding: atoms share pairs of electrons; dot and cross diagrams for small molecules such as H₂, Cl₂, O₂, N₂, HCl, H₂O, NH₃ and CH₄' },
    { code: '4.2.1.5', text: 'Metallic bonding: a giant structure of positive ions in a sea of delocalised electrons' },
    { code: 'KS3', text: 'Atoms, elements and compounds; chemical bonds' },
  ],
  specNote: 'AQA references are to GCSE Chemistry (8462); Combined Science (8464) covers the same content. KS3 references are to the National Curriculum programme of study.',
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const S = EL.sym, N = EL.name, NN = EL.Name;
const CHOICES = ['H', 'Li', 'C', 'N', 'O', 'F', 'Na', 'Mg', 'Al', 'P', 'S', 'Cl', 'K', 'Ca', 'Br'].map(EL.z);
const ANION = { 1: 'hydride', 7: 'nitride', 8: 'oxide', 9: 'fluoride', 15: 'phosphide', 16: 'sulfide', 17: 'chloride', 35: 'bromide' };
const MOLECULE = { H2: 'hydrogen', O2: 'oxygen', N2: 'nitrogen', F2: 'fluorine', Cl2: 'chlorine', Br2: 'bromine', H2O: 'water', CH4: 'methane', NH3: 'ammonia', HCl: 'hydrogen chloride', HF: 'hydrogen fluoride', HBr: 'hydrogen bromide', CO2: 'carbon dioxide', CS2: 'carbon disulfide', H2S: 'hydrogen sulfide', PH3: 'phosphine', CCl4: 'tetrachloromethane', PCl3: 'phosphorus trichloride', NCl3: 'nitrogen trichloride' };
const COL = { metal: '#e65100', non: '#1e63c6', a: '#1e63c6', b: '#e65100' };
const sub = (n) => (n > 1 ? `<sub>${n}</sub>` : '');
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const valence = (z) => (z === 1 ? 1 : 8 - EL.gcseGroup(z));
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const state = { a: 11, b: 17, view: 'dc', all: false, t: 0, dir: 0, pd: false, temp: 30 };
let info = null, metalElectrons = [];

// ---------- What kind of bonding? ----------

function analyse(a, b) {
  const ma = EL.isMetal(a), mb = EL.isMetal(b);
  if (ma && mb) {
    if (a !== b) return { type: 'none', why: 'Two different metals mixed together make an <b>alloy</b>. Alloys have metallic bonding too: choose the same metal twice to see it.' };
    return { type: 'metallic', m: a, q: EL.ionCharge(a) };
  }
  if (ma || mb) {
    const m = ma ? a : b, x = ma ? b : a;
    if (x === 1) return { type: 'none', why: `Metals do react with hydrogen to make hydrides, but these aren’t on the GCSE course. Try ${N(m)} with a non-metal such as chlorine or oxygen.` };
    const qm = EL.ionCharge(m), qx = -(EL.ionCharge(x) ?? 0);
    if (!qx || qx < 0) return { type: 'none', why: `${NN(x)} doesn’t usually form simple negative ions, so we don’t draw it bonding ionically at GCSE.` };
    const g = gcd(qm, qx);
    const nM = qx / g, nX = qm / g;
    return { type: 'ionic', m, x, qm, qx, nM, nX, formula: `${S(m)}${sub(nM)}${S(x)}${sub(nX)}`, name: `${N(m)} ${ANION[x]}` };
  }
  // Two non-metals: covalent
  let central, lig, n, order;
  const va = valence(a), vb = valence(b);
  if (a === b) {
    if (![1, 7, 8, 9, 17, 35].includes(a)) return { type: 'none', why: a === 6 ? 'Carbon doesn’t form simple molecules of two atoms: it forms giant covalent structures such as diamond and graphite.' : `${NN(a)} doesn’t form simple molecules of two atoms.` };
    central = a; lig = a; n = 1; order = va;
  } else if (va === 1 && vb === 1) { central = a === 1 ? a : b === 1 ? b : a; lig = central === a ? b : a; n = 1; order = 1; }
  else if (vb === 1) { central = a; lig = b; n = va; order = 1; }
  else if (va === 1) { central = b; lig = a; n = vb; order = 1; }
  else if (va === 4 && vb === 2) { central = a; lig = b; n = 2; order = 2; }
  else if (vb === 4 && va === 2) { central = b; lig = a; n = 2; order = 2; }
  else return { type: 'none', why: `${NN(a)} and ${N(b)} don’t make a simple molecule that you need at GCSE. Try water (H and O), ammonia (N and H), methane (C and H) or carbon dioxide (C and O).` };
  let key;
  if (central === lig) key = `${S(central)}2`;
  else if (lig === 1 && [8, 16].includes(central)) key = `H${n > 1 ? n : ''}${S(central)}`;
  else if (n === 1 && (central === 1 || lig === 1)) key = `H${S(central === 1 ? lig : central)}`;
  else key = `${S(central)}${S(lig)}${n > 1 ? n : ''}`;
  const formula = key.replace(/(\d+)/g, '<sub>$1</sub>');
  return { type: 'covalent', central, lig, n, order, formula, name: MOLECULE[key] || 'a covalent molecule', key };
}

// ---------- Drawing helpers ----------

const cv = $('bond'), ctx = cv.getContext('2d');
const W = 800, H = 420;
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }
const OUTER_R = 50, R0 = 28, DR = 16;
const outerR = (nShells) => (state.all ? R0 + (nShells - 1) * DR : OUTER_R);
// Angles for electrons in a shell of up to 8: pairs at the top, right, bottom and left
function slots(count, total = count) {
  if (total > 8) return Array.from({ length: count }, (_, i) => -Math.PI / 2 + (i / total) * Math.PI * 2);
  const base = [-Math.PI / 2, 0, Math.PI / 2, Math.PI], out = [];
  for (let i = 0; i < count; i++) { const pair = Math.floor(i / 2); out.push(base[pair] + (i % 2 ? 0.2 : -0.2)); }
  return out;
}
function mark(x, y, kind, owner) {
  if (state.view === 'model') {
    ctx.fillStyle = owner; ctx.beginPath(); ctx.arc(x, y, 4.6, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (kind === 'x') {
    ctx.strokeStyle = owner; ctx.lineWidth = 2.2; const s = 4.2;
    ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
  } else { ctx.fillStyle = owner; ctx.beginPath(); ctx.arc(x, y, 3.8, 0, Math.PI * 2); ctx.fill(); }
}
function circle(x, y, r, dashed) {
  ctx.strokeStyle = state.view === 'model' ? PK.cssVar('--border-strong') : PK.cssVar('--text');
  ctx.lineWidth = state.view === 'model' ? 1.3 : 1.6; ctx.setLineDash(state.view === 'model' || dashed ? [3, 5] : []);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
}
function centre(x, y, z) {
  if (state.view === 'model') {
    const nr = 12;
    const g = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, nr); g.addColorStop(0, '#ff9e94'); g.addColorStop(1, '#c62828');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, nr, 0, Math.PI * 2); ctx.fill();
    text(S(z), x, y + 0.5, { col: '#fff', s: 11, w: 800 });
  } else text(S(z), x, y + 1, { s: state.all ? 14 : 19, w: 800 });
}
function text(t, x, y, o = {}) {
  ctx.fillStyle = o.col || PK.cssVar('--text'); ctx.font = `${o.w || 700} ${o.s || 13}px ${font()}`;
  ctx.textAlign = o.a || 'center'; ctx.textBaseline = o.b || 'middle'; ctx.fillText(t, x, y);
}
const kindOf = (owner) => (owner === COL.metal || owner === COL.b ? 'x' : 'o');
// Inner shells (only when showing all shells)
function innerShells(x, y, z, shells, owner) {
  if (!state.all) return;
  shells.forEach((count, s) => {
    const r = R0 + s * DR; circle(x, y, r);
    slots(count, count).forEach((a) => mark(x + Math.cos(a) * r, y + Math.sin(a) * r, kindOf(owner), owner));
  });
}

// ---------- Ionic ----------

function ionicLayout() {
  const I = info, atoms = [];
  const single = I.nM === 1 && I.nX === 1;
  const row = (n, y, kind, z) => { for (let i = 0; i < n; i++) atoms.push({ z, kind, x: 400 + (i - (n - 1) / 2) * 175, y }); };
  if (single) { atoms.push({ z: I.m, kind: 'M', x: 260, y: 200 }, { z: I.x, kind: 'X', x: 540, y: 200 }); }
  else { row(I.nM, 120, 'M', I.m); row(I.nX, 300, 'X', I.x); }
  // Which non-metal each metal electron goes to
  const metals = atoms.filter((a) => a.kind === 'M'), nons = atoms.filter((a) => a.kind === 'X');
  const moves = []; let ni = 0, need = I.qx;
  metals.forEach((m) => { for (let e = 0; e < I.qm; e++) { moves.push({ from: m, e, to: nons[ni], slot: 8 - need }); need--; if (need === 0) { ni++; need = I.qx; } } });
  return { atoms, moves };
}
function drawIonic() {
  const I = info, { atoms, moves } = ionicLayout(), t = state.t;
  // 0–0.7: electrons transfer; 0.7–1: the oppositely charged ions pull together
  const tt = Math.min(1, t / 0.7), done = tt >= 0.999;
  const sq = Math.max(0, Math.min(1, (t - 0.7) / 0.3)), sqE = sq * sq * (3 - 2 * sq);
  const single = I.nM === 1 && I.nX === 1;
  for (const a of atoms) { if (single) a.x = 400 + (a.x - 400) * (1 - 0.2 * sqE); else a.y = 210 + (a.y - 210) * (1 - 0.14 * sqE); }
  const own = { M: COL.metal, X: COL.non };
  for (const a of atoms) {
    const sh = EL.shells(a.z), n = sh.length;
    const isM = a.kind === 'M';
    // Shells after the transfer
    const ionShells = isM && done ? sh.slice(0, -1) : sh;
    const drawN = ionShells.length;
    // Inner shells
    innerShells(a.x, a.y, a.z, isM && done ? ionShells.slice(0, -1) : sh.slice(0, -1), own[a.kind]);
    if (isM && done) {
      // The metal ion: its old inner shell is now the full outer shell
      const r = outerR(drawN), full = ionShells[ionShells.length - 1];
      circle(a.x, a.y, r);
      slots(full, full).forEach((ang) => mark(a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r, 'x', own.M));
    } else {
      const r = outerR(n);
      circle(a.x, a.y, r);
      const outer = sh[n - 1];
      if (isM) {
        // Electrons that haven't left yet are drawn by the moves below
      } else slots(8).slice(0, outer).forEach((ang) => mark(a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r, 'o', own.X));
    }
    centre(a.x, a.y, a.z);
    // Brackets and charge once the ions have formed
    const label = done ? (isM ? `${S(a.z)}${EL.chargeText(I.qm)} ion` : `${S(a.z)}${EL.chargeText(-I.qx)} ion`) : `${S(a.z)} atom`;
    if (done) {
      const r = outerR(isM ? drawN : n) + 12;
      ctx.strokeStyle = PK.cssVar('--text'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.x - r + 8, a.y - r); ctx.lineTo(a.x - r, a.y - r); ctx.lineTo(a.x - r, a.y + r); ctx.lineTo(a.x - r + 8, a.y + r);
      ctx.moveTo(a.x + r - 8, a.y - r); ctx.lineTo(a.x + r, a.y - r); ctx.lineTo(a.x + r, a.y + r); ctx.lineTo(a.x + r - 8, a.y + r); ctx.stroke();
      text(isM ? EL.chargeText(I.qm) : EL.chargeText(-I.qx), a.x + r + 4, a.y - r + 2, { a: 'left', s: 17, w: 800, col: isM ? COL.metal : COL.non });
    }
    const shellsNow = done ? (isM ? ionShells : [...sh.slice(0, -1), 8]) : sh;
    text(`${label}  ${shellsNow.join(',')}`, a.x, a.y + outerR(n) + (done ? 32 : 20), { s: 12, col: PK.cssVar('--muted') });
  }
  // Losing and gaining: the metal's outer electrons disappear, then the non-metal's appear.
  // Nothing is shown travelling between them.
  const lose = Math.min(1, tt / 0.45), gain = Math.max(0, Math.min(1, (tt - 0.55) / 0.45));
  for (const mv of moves) {
    const rF = outerR(EL.shells(mv.from.z).length), rT = outerR(EL.shells(mv.to.z).length);
    const a0 = slots(I.qm)[mv.e], a1 = slots(8)[mv.slot];
    if (lose < 1) {
      ctx.save(); ctx.globalAlpha = 1 - lose;
      mark(mv.from.x + Math.cos(a0) * rF, mv.from.y + Math.sin(a0) * rF, 'x', COL.metal);
      ctx.restore();
    }
    if (gain > 0) {
      ctx.save(); ctx.globalAlpha = gain;
      mark(mv.to.x + Math.cos(a1) * rT, mv.to.y + Math.sin(a1) * rT, 'x', COL.metal);
      ctx.restore();
    }
  }
  // Say what is happening above each atom while it happens
  const phase = (v) => v > 0.001 && v < 0.999;
  for (const a of atoms) {
    const r = outerR(EL.shells(a.z).length);
    if (a.kind === 'M' && phase(lose)) text(`loses ${pl(I.qm, 'electron')}`, a.x, a.y - r - 18, { s: 14, w: 800, col: COL.metal });
    if (a.kind === 'X' && phase(gain)) text(`gains ${pl(I.qx, 'electron')}`, a.x, a.y - r - 18, { s: 14, w: 800, col: COL.non });
  }
  if (done && t < 0.999) text('The oppositely charged ions attract each other…', 400, H - 18, { s: 13, col: PK.cssVar('--muted') });
  else if (done) text(`Formula: ${S(I.m)}${I.nM > 1 ? I.nM : ''}${S(I.x)}${I.nX > 1 ? I.nX : ''}  (charges balance: ${I.nM} × ${I.qm}+ = ${I.nX} × ${I.qx}−)`, 400, H - 18, { s: 13 });
  else text(t === 0 ? `Press “Bond”: ${N(I.m)} will lose electrons and ${N(I.x)} will gain them.`
    : lose < 0.999 ? `${NN(I.m)} loses ${pl(I.qm, 'electron')}${I.nM > 1 ? ' (each atom)' : ''}…`
      : gain > 0.001 ? `${NN(I.x)} gains ${pl(I.qx, 'electron')}${I.nX > 1 ? ' (each atom)' : ''}…` : `${NN(I.m)} has lost ${pl(I.qm, 'electron')}…`, 400, H - 18, { s: 13, col: PK.cssVar('--muted') });
}

// ---------- Covalent ----------

const DIRS = { 1: [0], 2: [Math.PI, 0], 3: [Math.PI, 0, Math.PI / 2], 4: [Math.PI, 0, -Math.PI / 2, Math.PI / 2] };
function drawCovalent() {
  const I = info, cz = I.central, lz = I.lig;
  const cSh = EL.shells(cz), lSh = EL.shells(lz), rc = outerR(cSh.length), rl = outerR(lSh.length);
  const Dbond = rc + rl - Math.min(26, 0.6 * Math.min(rc, rl)), Dsep = rc + rl + (I.n === 1 ? 80 : 40);
  const t = state.t, e = t * t * (3 - 2 * t), bonded = t >= 0.999;
  const D = Dsep + (Dbond - Dsep) * e;
  const dirs = DIRS[I.n];
  let cx = 400, cy = 205;
  if (I.n === 1) cx = 400 - D / 2;
  const ligs = dirs.map((a) => ({ x: cx + Math.cos(a) * D, y: cy + Math.sin(a) * D, back: a + Math.PI }));
  const cCol = COL.a, lCol = COL.b;
  // Shells
  innerShells(cx, cy, cz, cSh.slice(0, -1), cCol);
  circle(cx, cy, rc);
  for (const L of ligs) { innerShells(L.x, L.y, lz, lSh.slice(0, -1), lCol); circle(L.x, L.y, rl); }
  centre(cx, cy, cz); for (const L of ligs) centre(L.x, L.y, lz);
  // Bonding electrons: start on each atom's own shell, facing the other atom; end as shared pairs in the overlap
  const lerp = (p, q) => [p[0] + (q[0] - p[0]) * e, p[1] + (q[1] - p[1]) * e];
  for (const [i, a] of dirs.entries()) {
    const L = ligs[i], ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
    const m = (D - rl + rc) / 2;
    for (let j = 0; j < I.order; j++) {
      const k = j - (I.order - 1) / 2, off = k * 12;
      const bx = cx + ux * m + px * off, by = cy + uy * m + py * off;
      const ac = a + k * 0.34, al = L.back - k * 0.34;
      const pc = lerp([cx + Math.cos(ac) * rc, cy + Math.sin(ac) * rc], [bx - ux * 5, by - uy * 5]);
      const pq = lerp([L.x + Math.cos(al) * rl, L.y + Math.sin(al) * rl], [bx + ux * 5, by + uy * 5]);
      mark(pc[0], pc[1], 'o', cCol);
      mark(pq[0], pq[1], 'x', lCol);
    }
  }
  // Lone pairs
  const lone = (z, x, y, r, bondDirs, col) => {
    const pairs = (EL.outer(z) - bondDirs.length * I.order) / 2;
    const free = [-Math.PI / 2, 0, Math.PI / 2, Math.PI].filter((f) => bondDirs.every((b) => Math.abs(Math.atan2(Math.sin(f - b), Math.cos(f - b))) > 0.8));
    for (let p = 0; p < pairs && p < free.length; p++) for (const d of [-0.2, 0.2]) mark(x + Math.cos(free[p] + d) * r, y + Math.sin(free[p] + d) * r, col === cCol ? 'o' : 'x', col);
  };
  lone(cz, cx, cy, rc, dirs, cCol);
  for (const L of ligs) lone(lz, L.x, L.y, rl, [L.back], lCol);
  if (bonded) {
    drawDisplayed(I, 680, 340);
    text(`${pl(I.n * I.order, 'shared pair')} of electrons = ${pl(I.n, I.order === 1 ? 'single bond' : I.order === 2 ? 'double bond' : 'triple bond')}`, 330, H - 18, { s: 13 });
  } else text(t === 0 ? 'Press “Bond”: the atoms will move together and share electrons.' : 'The outer shells overlap and electrons are shared…', 400, H - 18, { s: 13, col: PK.cssVar('--muted') });
}
function drawDisplayed(I, x, y) {
  text('Displayed formula', x, y - 50, { s: 11, col: PK.cssVar('--muted') });
  const dirs = DIRS[I.n], L = 34, cx = I.n === 1 ? x - L / 2 : x;
  ctx.strokeStyle = PK.cssVar('--text'); ctx.lineWidth = 2;
  for (const a of dirs) {
    const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
    for (let j = 0; j < I.order; j++) {
      const off = (j - (I.order - 1) / 2) * 5;
      ctx.beginPath(); ctx.moveTo(cx + ux * 10 + px * off, y + uy * 10 + py * off); ctx.lineTo(cx + ux * (L - 10) + px * off, y + uy * (L - 10) + py * off); ctx.stroke();
    }
    text(S(I.lig), cx + ux * L, y + uy * L + 1, { s: 15, w: 800 });
  }
  text(S(I.central), cx, y + 1, { s: 15, w: 800 });
}

// ---------- Metallic ----------

const LAT = { cols: 7, rows: 4, x0: 130, y0: 95, dx: 90, dy: 76 };
function resetMetal() {
  const n = Math.min(80, LAT.cols * LAT.rows * (info?.q || 1));
  metalElectrons = Array.from({ length: n }, () => ({ x: 90 + Math.random() * 620, y: 55 + Math.random() * 280, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120 }));
}
// A hotter metal: ions vibrate more, so the electrons collide with them more and drift more slowly
const driftSpeed = () => 90 / (1 + state.temp / 30);
function stepMetal(dt) {
  for (const e of metalElectrons) {
    e.vx += (Math.random() - 0.5) * 400 * dt; e.vy += (Math.random() - 0.5) * 400 * dt;
    const sp = Math.hypot(e.vx, e.vy); if (sp > 120) { e.vx *= 120 / sp; e.vy *= 120 / sp; }
    e.x += (e.vx + (state.pd ? driftSpeed() : 0)) * dt; e.y += e.vy * dt;
    if (e.y < 50 || e.y > 340) { e.vy = -e.vy; e.y = Math.max(50, Math.min(340, e.y)); }
    if (e.x > 720) e.x = state.pd ? 80 : 720 - (e.x - 720); if (e.x < 80) e.x = state.pd ? 720 : 80 + (80 - e.x);
    if (!state.pd && (e.x <= 80 || e.x >= 720)) e.vx = -e.vx;
  }
}
function drawMetallic() {
  const I = info, sh = EL.shells(I.m).slice(0, -1);
  ctx.strokeStyle = PK.cssVar('--border-strong'); ctx.lineWidth = 1; ctx.strokeRect(70, 40, 660, 310);
  const now = performance.now() / 1000, amp = 0.6 + state.temp * 0.1;
  for (let r = 0; r < LAT.rows; r++) for (let c = 0; c < LAT.cols; c++) {
    const ph = r * 7.3 + c * 3.1;
    const x = LAT.x0 + c * LAT.dx + Math.sin(now * 23 + ph) * amp, y = LAT.y0 + r * LAT.dy + Math.cos(now * 19 + ph * 1.7) * amp;
    if (state.view === 'model') drawAtomModel(ctx, x, y, I.m, { shells: sh, r0: 14, dr: 9, er: 2.6 });
    else {
      const g = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, 25); g.addColorStop(0, '#ffe0b2'); g.addColorStop(1, '#ef6c00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill();
      text(`${S(I.m)}${EL.chargeText(I.q)}`, x, y + 1, { s: 14, w: 800, col: '#3e2723' });
    }
  }
  for (const e of metalElectrons) {
    ctx.fillStyle = '#1e63c6'; ctx.beginPath(); ctx.arc(e.x, e.y, 4.5, 0, Math.PI * 2); ctx.fill();
    if (state.view !== 'model') text('−', e.x, e.y - 0.5, { s: 9, w: 800, col: '#fff' });
  }
  if (state.pd) { text('−', 50, 195, { s: 26, w: 800, col: '#1e63c6' }); text('+', 752, 195, { s: 26, w: 800, col: '#c62828' }); }
  const hot = state.temp > 55;
  text(state.pd
    ? (hot ? 'Hot: the ions vibrate more, so electrons bump into them more often. The resistance goes up and the current goes down.' : 'With a potential difference, the delocalised electrons drift through the metal: a current flows.')
    : (hot ? 'Hot: the ions vibrate more, but they stay in their lattice positions while the metal is solid.' : `${S(I.m)}${EL.chargeText(I.q)} ions in a regular lattice, in a “sea” of delocalised electrons`), 400, H - 30, { s: 13 });
  if (state.pd) { const f = driftSpeed() / 90; text(`Current: ${f > 0.6 ? 'high' : f > 0.35 ? 'medium' : 'low'}`, 400, 22, { s: 13, w: 800 }); }
  text(`Each ${N(I.m)} atom gives ${pl(I.q, 'electron')} to the sea.`, 400, H - 10, { s: 12, col: PK.cssVar('--muted') });
}

// ---------- The exam answer ----------

function renderAnswer() {
  const I = info; let html = '';
  if (I.type === 'ionic') {
    const M = NN(I.m), X = N(I.x), mOut = EL.shells(I.m), xOut = EL.shells(I.x);
    const many = I.nM > 1 || I.nX > 1;
    const p1 = `${M} loses ${pl(I.qm, 'electron')} and ${X} gains ${pl(I.qx, 'electron')}.${many ? ` In ${I.formula}, ${I.nM === 1 ? 'one' : words[I.nM]} ${N(I.m)} atom${I.nM > 1 ? 's' : ''} transfer${I.nM > 1 ? '' : 's'} ${I.nM * I.qm} electrons to ${I.nX === 1 ? 'one' : words[I.nX]} ${X} atom${I.nX > 1 ? 's' : ''}.` : ''}`;
    const p2 = `The ${N(I.m)} ion (${EL.ionHtml(I.m, I.qm)}) has a ${I.qm}+ charge and the ${ANION[I.x]} ion (${EL.ionHtml(I.x, -I.qx)}) has a ${I.qx}− charge.`;
    // The 4 marks: what each atom loses or gains, and the charge on each ion
    html = [p1, p2].map((p) => `<p>${PK.ans(p)}</p>`).join('');
  } else if (I.type === 'covalent') {
    const C = NN(I.central), c = N(I.central), l = N(I.lig), same = I.central === I.lig;
    const needC = valence(I.central), needL = valence(I.lig);
    const bond = I.order === 1 ? 'a single covalent bond' : I.order === 2 ? 'a double covalent bond' : 'a triple covalent bond';
    const p1 = same
      ? `Each ${c} atom has ${pl(EL.outer(I.central), 'electron')} in its outer shell and needs ${needC} more to fill it.`
      : `${C} has ${pl(EL.outer(I.central), 'electron')} in its outer shell and needs ${needC} more. ${EL.Name(I.lig)} has ${pl(EL.outer(I.lig), 'electron')} and needs ${needL} more.`;
    const p2 = same
      ? `The two atoms share ${I.order === 1 ? 'a pair' : `${words[I.order]} pairs`} of electrons (one electron from each atom in each pair): ${bond}.`
      : I.n === 1 ? `The ${c} atom and the ${l} atom share ${I.order === 1 ? 'a pair' : `${words[I.order]} pairs`} of electrons, one electron from each atom in each pair: ${bond}.`
        : `The ${c} atom shares ${I.order === 1 ? 'one pair' : `${words[I.order]} pairs`} of electrons with each of the ${words[I.n]} ${l} atoms. Each shared pair is a covalent bond, so there ${I.order === 1 ? `are ${words[I.n]} single bonds` : `are ${words[I.n]} double bonds`}.`;
    const fullC = I.central === 1 ? 2 : 8, fullL = I.lig === 1 ? 2 : 8;
    const p3 = same ? `Now each ${c} atom has a full outer shell of ${fullC} electrons.` : `Now every atom has a full outer shell: ${c} has ${fullC} electrons and ${I.n > 1 ? 'each ' : ''}${l} has ${fullL}.`;
    const p4 = `Covalent bonds are strong, but ${I.formula} is a small molecule. The forces between the molecules are weak, so it has a low melting point and boiling point.`;
    html = [p1, p2, p3, p4].map((p) => `<p>${PK.ans(p)}</p>`).join('');
  } else if (I.type === 'metallic') {
    const M = NN(I.m);
    const p = [
      `${M} atoms lose their ${pl(I.q, 'outer electron')}, which become delocalised: free to move through the whole structure.`,
      `This leaves ${EL.ionHtml(I.m, I.q)} positive ions, arranged in layers in a regular giant lattice.`,
      'Metallic bonding is the strong electrostatic attraction between the positive metal ions and the sea of delocalised electrons.',
      `The delocalised electrons can move, so ${N(I.m)} conducts electricity and thermal energy. The layers of ions can slide over each other, so it can be bent and shaped.`,
    ];
    html = p.map((x) => `<p>${PK.ans(x)}</p>`).join('');
  } else html = `<p>${I.why}</p>`;
  $('answer').innerHTML = html;
}

function renderSummary() {
  const I = info;
  const badge = { ionic: ['Ionic bonding', '#c2410c', 'metal + non-metal: electrons are transferred'], covalent: ['Covalent bonding', '#1d4ed8', 'non-metal + non-metal: electrons are shared'], metallic: ['Metallic bonding', '#7c3aed', 'a metal: delocalised electrons'], none: ['No simple bond to show', '#6b7280', ''] }[I.type];
  $('summary').innerHTML = `<span class="type-badge" style="background:${badge[1]}">${badge[0]}</span>
    ${I.formula ? `<div class="formula">${I.formula}</div><div>${EL.cap(I.name)}</div>` : I.type === 'metallic' ? `<div class="formula">${S(I.m)}</div><div>${NN(I.m)}</div>` : ''}
    ${badge[2] ? `<p class="note" style="margin:6px 0 0">${badge[2]}</p>` : ''}`;
}

// ---------- Choosing elements ----------

function pickerHtml(which) {
  return CHOICES.map((z) => {
    // Grey out second elements that don't make a simple bond with the first
    const off = which === 'b' && analyse(state.a, z).type === 'none';
    return `<button data-z="${z}" style="background:${EL.CATEGORIES[EL.category(z)].col}" aria-pressed="${state[which] === z}" aria-label="${EL.Name(z)}"${off ? ' class="off" disabled' : ''}>${S(z)}</button>`;
  }).join('');
}
function renderPickers() {
  $('pick1').innerHTML = pickerHtml('a'); $('pick2').innerHTML = pickerHtml('b');
  const cats = [...new Set(CHOICES.map(EL.category))];
  $('pick-key').innerHTML = cats.map((c) => `<span><i style="background:${EL.CATEGORIES[c].col}"></i>${EL.CATEGORIES[c].name}</span>`).join('');
  $('pick1').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    const z = Number(b.dataset.z);
    // If the current second element no longer bonds simply, move to one that does
    const second = analyse(z, state.b).type !== 'none' ? state.b : CHOICES.find((y) => analyse(z, y).type !== 'none') ?? state.b;
    choose(z, second);
  }));
  $('pick2').querySelectorAll('button:not(.off)').forEach((b) => b.addEventListener('click', () => choose(state.a, Number(b.dataset.z))));
}
function choose(a, b) {
  state.a = a; state.b = b; state.t = 0; state.dir = 0; state.pd = false;
  info = analyse(a, b);
  if (info.type === 'metallic') resetMetal();
  renderPickers(); renderSummary(); renderAnswer(); renderControls();
}
function renderControls() {
  const go = $('go');
  go.hidden = info.type === 'none';
  if (info.type === 'ionic' || info.type === 'covalent') go.textContent = state.t >= 0.999 ? '↺ Separate the atoms' : '🔗 Bond';
  if (info.type === 'metallic') go.textContent = state.pd ? '⏹ Switch off the p.d.' : '⚡ Apply a potential difference';
  $('all-wrap').hidden = info.type === 'metallic' || info.type === 'none';
  $('temp-wrap').hidden = info.type !== 'metallic';
}
const EXAMPLES = [['NaCl', 11, 17], ['MgO', 12, 8], ['MgCl₂', 12, 17], ['Al₂O₃', 13, 8], ['CaF₂', 20, 9], ['K₂O', 19, 8], ['H₂', 1, 1], ['Cl₂', 17, 17], ['O₂', 8, 8], ['N₂', 7, 7], ['HCl', 1, 17], ['H₂O', 8, 1], ['NH₃', 7, 1], ['CH₄', 6, 1], ['CO₂', 6, 8], ['Na', 11, 11], ['Mg', 12, 12], ['Al', 13, 13]];
$('examples').innerHTML = EXAMPLES.map(([l, a, b]) => `<button class="chip" data-a="${a}" data-b="${b}">${l}</button>`).join('');
document.querySelectorAll('#examples .chip').forEach((b) => b.addEventListener('click', () => choose(Number(b.dataset.a), Number(b.dataset.b))));

$('go').addEventListener('click', () => {
  if (info.type === 'ionic' || info.type === 'covalent') state.dir = state.t >= 0.999 ? -1 : 1;
  if (info.type === 'metallic') state.pd = !state.pd;
  renderControls();
});
document.querySelectorAll('#view .chip').forEach((b) => b.addEventListener('click', () => {
  state.view = b.dataset.v;
  document.querySelectorAll('#view .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
}));
$('all').addEventListener('change', (e) => { state.all = e.target.checked; });
const tempWord = (v) => (v < 15 ? 'cold' : v < 45 ? 'room temperature' : v < 75 ? 'hot' : 'very hot');
$('temp').addEventListener('input', (e) => { state.temp = Number(e.target.value); $('temp-val').textContent = tempWord(state.temp); });
$('temp-val').textContent = tempWord(state.temp);
window.addEventListener('pk-answers', renderAnswer);
window.addEventListener('resize', size);

// ---------- Loop ----------

function draw(dt) {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(0, 0, W, H);
  if (state.dir) { state.t = Math.max(0, Math.min(1, state.t + state.dir * dt / (info.type === 'ionic' ? 2.4 : 1.6))); if (state.t === 0 || state.t === 1) { state.dir = 0; renderControls(); } }
  if (info.type === 'ionic') drawIonic();
  else if (info.type === 'covalent') drawCovalent();
  else if (info.type === 'metallic') { stepMetal(dt); drawMetallic(); }
  else text('Choose a different pair of elements.', 400, 200, { s: 16, w: 800, col: PK.cssVar('--muted') });
  // Key
  if (info.type === 'ionic' || info.type === 'covalent') {
    const [c1, c2, l1, l2] = info.type === 'ionic' ? [COL.metal, COL.non, `${N(info.m)} electron`, `${N(info.x)} electron`] : [COL.a, COL.b, `${N(info.central)} electron`, `${N(info.lig)} electron`];
    const k1 = info.type === 'ionic' ? 'x' : 'o', k2 = info.type === 'ionic' ? 'o' : 'x';
    mark(20, 18, k1, c1); text(l1, 32, 18, { a: 'left', s: 12 });
    mark(20, 38, k2, c2); text(l2, 32, 38, { a: 'left', s: 12 });
  }
}
let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; draw(dt); requestAnimationFrame(frame); }
size();
choose(11, 17);
requestAnimationFrame(frame);

// ---------- Practice: gap-fill model answers ----------

const P = { type: 'ionic', a: 0, b: 0, info: null, answers: {}, checked: false, right: 0, total: 0, last: '', ...(PK.store.get('score.bonding', null) || {}) };
const PX_IONIC = { metals: [3, 11, 19, 12, 20, 13], nons: [9, 17, 35, 8, 16, 7] };
const PX_COV = [[8, 1], [7, 1], [6, 1], [1, 17], [6, 8], [17, 17], [8, 8], [7, 7], [1, 1], [1, 9], [16, 1]];
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const CHARGES = ['3+', '2+', '1+', '1−', '2−', '3−'];

// A drop-down gap; the first option is a blank
function gap(key, options, answer) {
  P.answers[key] = String(answer);
  const opts = ['…', ...options.map(String)];
  return `<select data-k="${key}" aria-label="Choose">${opts.map((o, i) => `<option value="${i ? o : ''}">${o}</option>`).join('')}</select>`;
}
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function newPractice() {
  let key;
  do {
    if (P.type === 'ionic') { P.a = pickOne(PX_IONIC.metals); P.b = pickOne(PX_IONIC.nons); } else [P.a, P.b] = pickOne(PX_COV);
    key = `${P.a}-${P.b}`;
  } while (key === P.last);
  P.last = key;
  P.info = analyse(P.a, P.b);
  P.answers = {}; P.checked = false;
  const I = P.info;
  let html;
  if (I.type === 'ionic') {
    const m = N(I.m), x = N(I.x), an = ANION[I.x];
    $('p-title').textContent = `Ionic bonding in ${EL.cap(I.name)}`;
    html = `
      <p>${cap1(m)} ${gap('v1', ['loses', 'gains', 'shares'], 'loses')} ${gap('n1', range(1, 3), I.qm)} electron(s).</p>
      <p>${cap1(x)} ${gap('v2', ['loses', 'gains', 'shares'], 'gains')} ${gap('n2', range(1, 3), I.qx)} electron(s).</p>
      <p>The ${m} ion has a ${gap('c1', CHARGES, `${I.qm}+`)} charge and the ${an} ion has a ${gap('c2', CHARGES, `${I.qx}−`)} charge.</p>
      <p>Both ions now have a full outer shell: the same electronic structure as a ${gap('ng', ['noble gas', 'halogen', 'alkali metal'], 'noble gas')}.</p>
      <p>The oppositely charged ions are held together by strong ${gap('f', ['electrostatic', 'magnetic', 'gravitational'], 'electrostatic')} forces of attraction. This is ${gap('bt', ['ionic', 'covalent', 'metallic'], 'ionic')} bonding.</p>
      <p>For every ${gap('k1', range(1, 3), I.nM)} ${m} ion(s) there are ${gap('k2', range(1, 3), I.nX)} ${an} ion(s), so the charges add up to zero.</p>
      <p class="formula-line">Formula: <span id="p-formula">?</span></p>`;
  } else {
    const c = N(I.central), l = N(I.lig), same = I.central === I.lig;
    const word = ['', 'single', 'double', 'triple'][I.order];
    $('p-title').textContent = `Covalent bonding in ${I.name === 'a covalent molecule' ? I.formula.replace(/<[^>]+>/g, '') : I.name}`;
    html = `
      <p>${same ? `Each ${c} atom` : cap1(c)} has ${gap('o1', range(1, 8), EL.outer(I.central))} electron(s) in its outer shell, so it needs ${gap('n1', range(1, 4), valence(I.central))} more to fill it.</p>
      ${same ? '' : `<p>${cap1(l)} has ${gap('o2', range(1, 8), EL.outer(I.lig))} electron(s) in its outer shell, so it needs ${gap('n2', range(1, 4), valence(I.lig))} more.</p>`}
      <p>The atoms ${gap('v', ['share', 'transfer', 'lose'], 'share')} pairs of electrons. Each shared pair has one electron from each atom.</p>
      <p>Altogether there are ${gap('pairs', range(1, 8), I.n * I.order)} shared pair(s) of electrons, and each bond is a ${gap('t', ['single', 'double', 'triple'], word)} covalent bond.</p>
      <p>Covalent bonds are ${gap('s1', ['strong', 'weak'], 'strong')}, but the forces between the molecules are ${gap('s2', ['weak', 'strong'], 'weak')}, so ${I.formula} has a ${gap('bp', ['low', 'high'], 'low')} boiling point.</p>
      <p class="formula-line">Formula: <span id="p-formula">?</span></p>`;
  }
  $('p-text').innerHTML = html;
  $('p-text').querySelectorAll('select').forEach((s) => s.addEventListener('change', () => s.classList.remove('ok', 'bad')));
  $('p-feedback').textContent = ''; $('p-feedback').className = 'p-feedback';
}
function checkPractice(reveal = false) {
  const sels = [...$('p-text').querySelectorAll('select')];
  let right = 0, blank = 0;
  for (const s of sels) {
    if (reveal) s.value = P.answers[s.dataset.k];
    const ok = s.value === P.answers[s.dataset.k];
    if (!s.value) blank++;
    if (ok) right++;
    s.classList.toggle('ok', ok); s.classList.toggle('bad', !ok && !!s.value);
  }
  if (!reveal && blank === sels.length) { $('p-feedback').textContent = 'Choose an answer for each gap first.'; $('p-feedback').className = 'p-feedback bad'; return; }
  const all = right === sels.length;
  if (all || reveal) $('p-formula').innerHTML = P.info.formula;
  // Only the first complete attempt counts towards the score
  if (!reveal && !P.checked && !blank) { P.checked = true; P.right += right; P.total += sels.length; }
  if (reveal) P.checked = true;
  $('p-feedback').textContent = reveal ? 'Here are the answers.' : all ? `All ${sels.length} correct!` : `${right} out of ${sels.length} correct${blank ? `, ${blank} still blank` : ''}. Fix the red ones and check again.`;
  $('p-feedback').className = `p-feedback ${all || reveal ? 'ok' : 'bad'}`;
  PK.store.set('score.bonding', { right: P.right, total: P.total });
  $('p-score').textContent = P.total ? `${P.right} out of ${P.total} gaps right first time.` : 'No questions checked yet.';
}

function setMode(m) {
  document.querySelectorAll('#mode .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
  $('explore').hidden = m !== 'explore'; $('practice').hidden = m !== 'practice';
  if (m === 'practice' && !P.info) newPractice();
  if (m === 'explore') size();
  window.history.replaceState(null, '', m === 'practice' ? '#practice' : location.pathname);
}
document.querySelectorAll('#mode .chip').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
document.querySelectorAll('#p-type .chip').forEach((b) => b.addEventListener('click', () => {
  P.type = b.dataset.t;
  document.querySelectorAll('#p-type .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  newPractice();
}));
$('p-check').addEventListener('click', () => checkPractice(false));
$('p-show').addEventListener('click', () => checkPractice(true));
$('p-next').addEventListener('click', newPractice);
$('p-see').addEventListener('click', () => { choose(P.a, P.b); setMode('explore'); });
if (PK.initialHash === '#practice') setMode('practice');
// Share: the two elements and whether they have bonded (the view and tick boxes are shared anyway)
PK.shareState = {
  get: () => ({ a: state.a, b: state.b, bonded: state.t >= 0.999 ? 1 : 0, pd: state.pd ? 1 : 0, temp: state.temp }),
  set: (o) => { choose(o.a, o.b); if (o.bonded) state.t = 1; if (o.pd) state.pd = true; if (o.temp != null) { state.temp = o.temp; $('temp').value = o.temp; } renderControls(); },
};
if (P.total) $('p-score').textContent = `${P.right} out of ${P.total} gaps right first time.`;
