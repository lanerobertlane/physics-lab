// Electromagnetism: field around a wire, solenoids and electromagnets, the motor effect
// (F = B I l and Fleming's left-hand rule), the DC motor, and electromagnetic induction.
// Fields from wires use B ∝ I / r around each wire (current out of the page = anticlockwise).

PK.header({
  title: 'Electromagnetism',
  answers: true,
  spec: [
    { code: '4.7.2.1', text: 'Electromagnetism: the field around a wire and a solenoid; electromagnets and iron cores' },
    { code: '4.7.2.2', text: "Fleming's left-hand rule and F = B I l", ht: true },
    { code: '4.7.2.3', text: 'Electric motors: a coil of wire carrying a current in a magnetic field tends to rotate', ht: true },
    { code: '4.7.3.1', text: 'Induced potential: a p.d. is induced when a conductor moves relative to a magnetic field', po: true, ht: true },
    { code: '4.7.3.2', text: 'Uses of the generator effect: alternators and dynamos', po: true, ht: true },
    { code: 'KS3', text: 'Magnetic effect of a current, electromagnets, D.C. motors (principles only)' },
  ],
});

const $ = (id) => document.getElementById(id);
const canvas = $('em');
const ctx = canvas.getContext('2d');
const W = 800, H = 480;
const RED = '#d93025', BLUE = '#1f5fd1';

const S = {
  mode: 'wire',
  wire: { I: 3, out: true, compasses: [{ x: 250, y: 160 }, { x: 560, y: 300 }, { x: 400, y: 380 }] },
  sol: { I: 3, turns: 10, core: false, dir: 1 },
  motor: { B: 0.5, I: 3, l: 0.1, flipI: false, flipB: false, combined: false, offset: 0 },
  dc: { I: 3, dir: 1, commutator: true, theta: 0.4, omega: 0 },
  ind: { mx: 150, flip: false, turns: 10, strong: false, auto: false, freq: 0.5, phase: 0, needle: 0, trace: [], lastFlux: null, emf: 0, t: 0 },
};

// ---------- Shared drawing helpers ----------

function colours() {
  return {
    surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'),
    art: PK.cssVar('--art'), line: PK.cssVar('--t-magnetism'), accent: PK.cssVar('--accent'), grid: PK.cssVar('--grid'),
    force: PK.cssVar('--f3'), current: PK.cssVar('--f2'), field: PK.cssVar('--f1'),
    font: PK.cssVar('--font-body') || 'sans-serif',
  };
}

function head(x, y, ang, size, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(ang) * size, y + Math.sin(ang) * size);
  ctx.lineTo(x + Math.cos(ang + 2.5) * size, y + Math.sin(ang + 2.5) * size);
  ctx.lineTo(x + Math.cos(ang - 2.5) * size, y + Math.sin(ang - 2.5) * size);
  ctx.closePath(); ctx.fill();
}

function arrow(x1, y1, x2, y2, colour, width = 3, size = 10) {
  ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.lineCap = 'round';
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * size * 0.6, y2 - Math.sin(a) * size * 0.6); ctx.stroke();
  head(x2, y2, a, size, colour);
}

// A wire seen end-on: • = current out of the page, × = current into the page.
function wireEnd(x, y, r, out, c, current = true) {
  ctx.fillStyle = '#f3c26b'; ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (!current) return;
  ctx.fillStyle = c.text; ctx.strokeStyle = c.text; ctx.lineWidth = 2.5;
  if (out) { ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, Math.PI * 2); ctx.fill(); }
  else { const d = r * 0.5; ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x - d, y + d); ctx.lineTo(x + d, y - d); ctx.stroke(); }
}

function magnetBlock(x, y, w, h, pole, c, font) {
  ctx.fillStyle = pole === 'N' ? RED : BLUE;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#fff'; ctx.font = `800 30px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(pole, x + w / 2, y + h / 2 + 1);
}

function needle(x, y, bx, by, len) {
  const a = Math.atan2(by, bx), cs = Math.cos(a), sn = Math.sin(a), w = len * 0.24;
  ctx.fillStyle = RED;
  ctx.beginPath(); ctx.moveTo(x + cs * len, y + sn * len); ctx.lineTo(x - sn * w, y + cs * w); ctx.lineTo(x + sn * w, y - cs * w); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9aa0a6';
  ctx.beginPath(); ctx.moveTo(x - cs * len, y - sn * len); ctx.lineTo(x - sn * w, y + cs * w); ctx.lineTo(x + sn * w, y - cs * w); ctx.closePath(); ctx.fill();
}

// Field of straight wires at a point. Each wire: { x, y, I } with I > 0 meaning out of the page.
function wireField(wires, x, y) {
  let bx = 0, by = 0;
  for (const w of wires) {
    const dx = x - w.x, dy = y - w.y, r2 = dx * dx + dy * dy + 30;
    bx += (w.I * dy) / r2; by += (-w.I * dx) / r2;
  }
  return { x: bx, y: by };
}

// Trace a field line from a start point, forwards then (if it didn't close) backwards.
function traceLine(field, x0, y0, stop) {
  const run = (sign) => {
    const pts = [{ x: x0, y: y0 }];
    let p = { x: x0, y: y0 };
    for (let i = 0; i < 2500; i++) {
      const b = field(p.x, p.y); const m = Math.hypot(b.x, b.y);
      if (m < 1e-12) break;
      p = { x: p.x + (sign * b.x / m) * 3, y: p.y + (sign * b.y / m) * 3 };
      pts.push(p);
      if (stop(p)) break;
      if (i > 40 && Math.hypot(p.x - x0, p.y - y0) < 3) return { pts, closed: true };
    }
    return { pts, closed: false };
  };
  const f = run(1);
  if (f.closed) return f.pts;
  const b = run(-1);
  return [...b.pts.reverse(), ...f.pts.slice(1)];
}

function drawLines(lines, c, everyPx = 90) {
  ctx.strokeStyle = c.line; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  for (const pts of lines) {
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    let d = 0, next = everyPx / 2;
    for (let i = 1; i < pts.length; i++) {
      d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (d >= next) { next += everyPx; head(pts[i].x, pts[i].y, Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x), 6, c.line); }
    }
  }
}

const inView = (p) => p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20;

// ---------- 1. Field around a wire ----------

const wireMode = {
  name: 'Wire',
  intro: 'A current in a wire makes a magnetic field around it: circles centred on the wire. Drag the compasses around to see the field direction.',
  controls() {
    const s = S.wire;
    return `<h2>Current</h2>
      <div class="ctl"><label for="w-i">Current <b id="w-i-val">${s.I} A</b></label><input type="range" id="w-i" min="0" max="5" step="0.5" value="${s.I}"></div>
      <div class="btn-row"><button class="btn" id="w-dir">⇄ Reverse current</button><button class="btn" id="w-add">＋ Compass</button></div>`;
  },
  bind() {
    $('w-i').addEventListener('input', (e) => { S.wire.I = Number(e.target.value); $('w-i-val').textContent = `${S.wire.I} A`; renderInfo(); });
    $('w-dir').addEventListener('click', () => { S.wire.out = !S.wire.out; renderInfo(); });
    $('w-add').addEventListener('click', () => { S.wire.compasses.push({ x: 120 + Math.random() * 560, y: 80 + Math.random() * 320 }); });
  },
  info() {
    const s = S.wire;
    return `<h2>What's happening</h2>
      <p style="margin:0">Current is flowing <b>${s.out ? 'out of the page (•)' : 'into the page (×)'}</b>, so the field goes <b>${s.out ? 'anticlockwise' : 'clockwise'}</b>.</p>
      <p class="note"><b>Right-hand grip rule:</b> point your right thumb along the current; your fingers curl the way the field goes.</p>
      <p class="note">The field is strongest close to the wire (circles closer together) and gets stronger with a bigger current.</p>`;
  },
  draw(c) {
    const s = S.wire, cx = 400, cy = 240;
    const I = s.I * (s.out ? 1 : -1);
    if (s.I > 0) {
      // Circles at equal steps of field strength: B ∝ I / r, so r = k I / n
      ctx.strokeStyle = c.line; ctx.lineWidth = 1.8;
      for (let n = 1; n < 12; n++) {
        const r = (80 * s.I) / n;
        if (r < 30) break;
        if (r > 420) continue;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        for (const a of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) {
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          const dir = s.out ? a - Math.PI / 2 : a + Math.PI / 2;   // anticlockwise on screen when out of the page
          head(x, y, dir, 7, c.line);
        }
      }
    }
    wireEnd(cx, cy, 18, s.out, c, s.I > 0);
    for (const cp of s.compasses) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const b = wireField([{ x: cx, y: cy, I }], cp.x, cp.y);
      if (Math.hypot(b.x, b.y) < 1e-9) needle(cp.x, cp.y, 0, -1, 15); else needle(cp.x, cp.y, b.x, b.y, 15);
    }
    ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Looking along the wire.  • = current coming out of the page,  × = going in.', 16, 12);
  },
  down(p) {
    const i = S.wire.compasses.findIndex((cp) => Math.hypot(cp.x - p.x, cp.y - p.y) < 24);
    return i >= 0 ? { i } : null;
  },
  move(d, p) { const cp = S.wire.compasses[d.i]; cp.x = Math.max(20, Math.min(W - 20, p.x)); cp.y = Math.max(20, Math.min(H - 20, p.y)); },
};

// ---------- 2. Solenoid & electromagnet ----------

const SOL = { cx: 400, cy: 240, L: 320, R: 70 };
function solWires() {
  const s = S.sol, out = [];
  for (let i = 0; i < s.turns; i++) {
    const x = SOL.cx - SOL.L / 2 + ((i + 0.5) * SOL.L) / s.turns;
    out.push({ x, y: SOL.cy - SOL.R, I: s.I * s.dir }, { x, y: SOL.cy + SOL.R, I: -s.I * s.dir });
  }
  return out;
}
let solCache = null;

const solenoidMode = {
  name: 'Solenoid & electromagnet',
  intro: 'A coil of wire (a solenoid) makes a field like a bar magnet. Inside, the field is strong and uniform. Add an iron core to make an electromagnet much stronger.',
  controls() {
    const s = S.sol;
    return `<h2>Solenoid</h2>
      <div class="ctl"><label for="s-i">Current <b id="s-i-val">${s.I} A</b></label><input type="range" id="s-i" min="0" max="5" step="0.5" value="${s.I}"></div>
      <div class="ctl"><label for="s-n">Number of turns <b id="s-n-val">${s.turns}</b></label><input type="range" id="s-n" min="4" max="20" step="1" value="${s.turns}"></div>
      <label class="toggle"><input type="checkbox" id="s-core" ${s.core ? 'checked' : ''}> Iron core</label>
      <div class="btn-row" style="margin-top:6px"><button class="btn" id="s-dir">⇄ Reverse current</button></div>`;
  },
  bind() {
    $('s-i').addEventListener('input', (e) => { S.sol.I = Number(e.target.value); $('s-i-val').textContent = `${S.sol.I} A`; solCache = null; renderInfo(); });
    $('s-n').addEventListener('input', (e) => { S.sol.turns = Number(e.target.value); $('s-n-val').textContent = S.sol.turns; solCache = null; renderInfo(); });
    $('s-core').addEventListener('change', (e) => { S.sol.core = e.target.checked; renderInfo(); });
    $('s-dir').addEventListener('click', () => { S.sol.dir *= -1; solCache = null; renderInfo(); });
  },
  clips() { const s = S.sol; return Math.min(40, Math.round(s.I * s.turns * (s.core ? 0.6 : 0.03))); },
  info() {
    const s = S.sol, n = this.clips();
    return `<h2>Strength</h2>
      <p style="margin:0">This electromagnet can pick up <b style="color: var(--answer, inherit)">${n} paperclip${n === 1 ? '' : 's'}</b>.</p>
      <p class="note">Make it stronger with <b>more current</b>, <b>more turns</b> or an <b>iron core</b> (the core becomes an induced magnet). Turning the current off switches it off — that's why electromagnets are useful (scrapyard cranes, door locks, relays).</p>
      <p class="note">${s.dir > 0 ? 'The right-hand end is the north pole.' : 'The left-hand end is the north pole.'} Reversing the current swaps the poles.</p>`;
  },
  draw(c) {
    const s = S.sol;
    const wires = solWires();
    if (s.I > 0) {
      if (!solCache) {
        const field = (x, y) => wireField(wires, x, y);
        const stop = (p) => inView(p) || wires.some((w) => Math.hypot(p.x - w.x, p.y - w.y) < 5);
        solCache = [];
        for (let k = 0; k < 7; k++) solCache.push(traceLine(field, SOL.cx, SOL.cy - SOL.R * 0.78 + (k * SOL.R * 1.56) / 6, stop));
      }
      drawLines(solCache, c, 110);
    }
    if (s.core) { ctx.fillStyle = 'rgba(120,126,136,.55)'; ctx.fillRect(SOL.cx - SOL.L / 2 - 30, SOL.cy - SOL.R * 0.55, SOL.L + 60, SOL.R * 1.1); }
    // Coil turns (side view) and wire ends top and bottom
    ctx.strokeStyle = '#c98b2b'; ctx.lineWidth = 3;
    for (let i = 0; i < wires.length; i += 2) {
      const x = wires[i].x;
      ctx.beginPath(); ctx.ellipse(x, SOL.cy, 7, SOL.R, 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (const w of wires) wireEnd(w.x, w.y, 7, w.I > 0, c, s.I > 0);
    if (s.I > 0) {
      ctx.font = `800 34px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const right = s.dir > 0 ? 'N' : 'S', left = s.dir > 0 ? 'S' : 'N';
      ctx.fillStyle = right === 'N' ? RED : BLUE; ctx.fillText(right, SOL.cx + SOL.L / 2 + 60, SOL.cy);
      ctx.fillStyle = left === 'N' ? RED : BLUE; ctx.fillText(left, SOL.cx - SOL.L / 2 - 60, SOL.cy);
    }
    // Paperclips hanging from the coil
    const n = this.clips();
    ctx.strokeStyle = c.muted; ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const x = SOL.cx - SOL.L / 2 + 10 + (i % 20) * 16, y = SOL.cy + SOL.R + 28 + Math.floor(i / 20) * 28;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, 8, 22, 4) : ctx.rect(x, y, 8, 22); ctx.stroke();
    }
    ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('A cut-through view of the coil: • current out of the page, × into the page.', 16, 12);
  },
};

// ---------- 3. Motor effect ----------

const motorMode = {
  name: 'Motor effect',
  intro: "A wire carrying a current in a magnetic field feels a force. Use Fleming's left-hand rule to find its direction, and F = B I l for its size.",
  controls() {
    const s = S.motor;
    return `<h2>Wire in a field</h2>
      <div class="ctl"><label for="m-b">Magnetic flux density (B) <b id="m-b-val">${s.B} T</b></label><input type="range" id="m-b" min="0.1" max="1" step="0.05" value="${s.B}"></div>
      <div class="ctl"><label for="m-i">Current (I) <b id="m-i-val">${s.I} A</b></label><input type="range" id="m-i" min="0" max="5" step="0.5" value="${s.I}"></div>
      <div class="ctl"><label for="m-l">Length of wire in the field (l) <b id="m-l-val">${s.l} m</b></label><input type="range" id="m-l" min="0.05" max="0.25" step="0.01" value="${s.l}"></div>
      <div class="btn-row"><button class="btn" id="m-fi">⇄ Reverse current</button><button class="btn" id="m-fb">⇄ Swap the magnets</button></div>
      <label class="toggle" style="margin-top:6px"><input type="checkbox" id="m-comb" ${s.combined ? 'checked' : ''}> Show the combined field</label>`;
  },
  bind() {
    const s = S.motor;
    for (const [id, k, u] of [['m-b', 'B', 'T'], ['m-i', 'I', 'A'], ['m-l', 'l', 'm']]) {
      $(id).addEventListener('input', (e) => { s[k] = Number(e.target.value); $(`${id}-val`).textContent = `${s[k]} ${u}`; renderInfo(); });
    }
    $('m-fi').addEventListener('click', () => { s.flipI = !s.flipI; renderInfo(); });
    $('m-fb').addEventListener('click', () => { s.flipB = !s.flipB; renderInfo(); });
    $('m-comb').addEventListener('change', (e) => { s.combined = e.target.checked; });
  },
  dirs() {
    const s = S.motor;
    const bRight = !s.flipB, out = !s.flipI;
    const up = bRight === out;     // B to the right × I out of the page → force up
    return { bRight, out, up };
  },
  info() {
    const s = S.motor, d = this.dirs(), F = s.B * s.I * s.l;
    return `<h2>Force</h2>
      <div class="working" style="margin:0">F = B I l = ${s.B} × ${s.I} × ${s.l} = <b>${PK.ans(`${parseFloat(F.toFixed(4))} N`)}</b> ${F > 0 ? (d.up ? 'upwards' : 'downwards') : ''}</div>
      <p class="note"><b>Fleming's left-hand rule:</b> <b>F</b>irst finger = <b>F</b>ield (N → S), se<b>C</b>ond finger = <b>C</b>urrent, thu<b>M</b>b = <b>M</b>otion (force).</p>
      <p class="note">Reverse the current <i>or</i> the field and the force reverses. Reverse both and it goes back the same way. There is no force if the wire is parallel to the field.</p>`;
  },
  draw(c, dt) {
    const s = S.motor, d = this.dirs(), F = s.B * s.I * s.l;
    const left = d.bRight ? 'N' : 'S', right = d.bRight ? 'S' : 'N';
    magnetBlock(110, 130, 140, 220, left, c, c.font);
    magnetBlock(550, 130, 140, 220, right, c, c.font);
    // Wire swings in the direction of the force
    const target = F > 0 ? (d.up ? -1 : 1) * Math.min(70, 30 + F * 120) : 0;
    s.offset += (target - s.offset) * Math.min(1, dt * 4);
    const wx = 400, wy = 240 + s.offset;
    const B0 = (d.bRight ? 1 : -1) * s.B * 0.02;
    if (s.combined && s.I > 0) {
      const I = (d.out ? 1 : -1) * s.I;
      const field = (x, y) => { const b = wireField([{ x: wx, y: wy, I: I * 0.6 }], x, y); return { x: b.x + B0, y: b.y }; };
      const lines = [];
      for (let k = 0; k < 9; k++) {
        const y0 = 145 + k * 24;
        const pts = [{ x: 252, y: y0 }];
        let p = { x: 252, y: y0 };
        for (let i = 0; i < 600; i++) {
          const b = field(p.x, p.y), m = Math.hypot(b.x, b.y);
          if (m < 1e-12) break;
          const sgn = d.bRight ? 1 : -1;
          p = { x: p.x + sgn * (b.x / m) * 3, y: p.y + sgn * (b.y / m) * 3 };
          if (p.x > 548 || p.x < 252 || Math.hypot(p.x - wx, p.y - wy) < 22) break;
          pts.push(p);
        }
        if (!d.bRight) pts.reverse();
        lines.push(pts);
      }
      drawLines(lines, c, 120);
    } else {
      for (let k = 0; k < 7; k++) {
        const y = 150 + k * 30;
        if (d.bRight) arrow(256, y, 544, y, c.line, 1.8, 8); else arrow(544, y, 256, y, c.line, 1.8, 8);
      }
    }
    wireEnd(wx, wy, 20, d.out, c, s.I > 0);
    if (F > 0) {
      const len = 40 + Math.min(60, F * 150);
      arrow(wx, wy + (d.up ? -24 : 24), wx, wy + (d.up ? -24 - len : 24 + len), c.force, 6, 16);
      ctx.fillStyle = c.force; ctx.font = `700 15px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('force', wx + 14, wy + (d.up ? -24 - len / 2 : 24 + len / 2));
    }
    this.fleming(c, d);
  },
  // Fleming's left-hand rule as three perpendicular arrows (current drawn in perspective).
  fleming(c, d) {
    const ox = 715, oy = 420;
    ctx.fillStyle = c.surface2; ctx.fillRect(630, 330, 165, 145);
    ctx.fillStyle = c.text; ctx.font = `700 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText("Fleming's left-hand rule", 712, 334);
    arrow(ox, oy, ox + (d.bRight ? 50 : -50), oy, c.field, 3, 9);
    arrow(ox, oy, ox + (d.out ? -30 : 30), oy + (d.out ? 26 : -26), c.current, 3, 9);
    if (S.motor.I > 0) arrow(ox, oy, ox, oy + (d.up ? -55 : 55), c.force, 3, 9);
    ctx.font = `700 11px ${c.font}`; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.field; ctx.textAlign = d.bRight ? 'left' : 'right'; ctx.fillText('Field', ox + (d.bRight ? 54 : -54), oy);
    ctx.fillStyle = c.current; ctx.textAlign = 'center'; ctx.fillText(d.out ? 'Current (out)' : 'Current (in)', ox + (d.out ? -30 : 30), oy + (d.out ? 40 : -38));
    if (S.motor.I > 0) { ctx.fillStyle = c.force; ctx.textAlign = 'left'; ctx.fillText('Force', ox + 6, oy + (d.up ? -50 : 50)); }
  },
};

// ---------- 4. DC motor ----------

const dcMode = {
  name: 'DC motor',
  intro: 'A coil carrying a current between two magnets feels forces on opposite sides, one up and one down, so it turns. The split-ring commutator reverses the current every half turn to keep it turning the same way.',
  controls() {
    const s = S.dc;
    return `<h2>Motor</h2>
      <div class="ctl"><label for="d-i">Current <b id="d-i-val">${s.I} A</b></label><input type="range" id="d-i" min="0" max="5" step="0.5" value="${s.I}"></div>
      <label class="toggle"><input type="checkbox" id="d-comm" ${s.commutator ? 'checked' : ''}> Split-ring commutator</label>
      <div class="btn-row" style="margin-top:6px"><button class="btn" id="d-dir">⇄ Reverse current</button><button class="btn" id="d-stop">■ Stop the coil</button></div>`;
  },
  bind() {
    const s = S.dc;
    $('d-i').addEventListener('input', (e) => { s.I = Number(e.target.value); $('d-i-val').textContent = `${s.I} A`; });
    $('d-comm').addEventListener('change', (e) => { s.commutator = e.target.checked; renderInfo(); });
    $('d-dir').addEventListener('click', () => { s.dir *= -1; });
    $('d-stop').addEventListener('click', () => { s.omega = 0; });
  },
  info() {
    return `<h2>How it works</h2>
      <p class="note" style="margin-top:0">The two sides of the coil carry current in opposite directions, so by Fleming's left-hand rule one side is pushed up and the other down.</p>
      <p class="note">${S.dc.commutator
        ? 'The <b>split-ring commutator</b> swaps the current’s direction in the coil each time it passes vertical, so the coil keeps turning the same way.'
        : '<b>Without the commutator</b> the forces reverse once the coil passes vertical, so it just rocks back and settles. Turn the commutator back on.'}</p>
      <p class="note">Faster: more current, a stronger magnet, or more turns on the coil. Reverse the current (or the magnets) to reverse the direction.</p>`;
  },
  // Current in each coil side: +1 out of the page, −1 into the page.
  sides() {
    const s = S.dc, r = 110;
    const a = { x: Math.cos(s.theta) * r, y: Math.sin(s.theta) * r };
    const b = { x: -a.x, y: -a.y };
    let ia, ib;
    if (s.commutator) { ia = a.x < 0 ? 1 : -1; ib = -ia; }   // the left-hand side always carries current out
    else { ia = 1; ib = -1; }
    return [{ p: a, I: ia * s.dir }, { p: b, I: ib * s.dir }];
  },
  draw(c, dt) {
    const s = S.dc, cx = 400, cy = 230;
    // Physics: force on each side is vertical (field left→right); torque = x × F
    const sides = this.sides();
    let torque = 0;
    for (const sd of sides) torque += sd.p.x * (-sd.I * s.I);   // out of the page → force up (−y)
    s.omega += (torque * 0.009 - s.omega * 0.8) * dt;
    s.theta += s.omega * dt;

    magnetBlock(60, 110, 130, 240, 'N', c, c.font);
    magnetBlock(610, 110, 130, 240, 'S', c, c.font);
    for (let k = 0; k < 7; k++) { const y = 125 + k * 35; ctx.globalAlpha = 0.35; arrow(195, y, 605, y, c.line, 1.5, 7); ctx.globalAlpha = 1; }

    // Coil, seen end-on (a line between the two sides)
    const A = sides[0].p, B = sides[1].p;
    ctx.strokeStyle = '#c98b2b'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx + A.x, cy + A.y); ctx.lineTo(cx + B.x, cy + B.y); ctx.stroke();
    // Commutator / slip ring and brushes
    ctx.lineWidth = 6;
    if (s.commutator) {
      const g = 0.35;
      ctx.strokeStyle = '#b07a22';
      ctx.beginPath(); ctx.arc(cx, cy, 22, s.theta + Math.PI / 2 + g, s.theta + 1.5 * Math.PI - g); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 22, s.theta - Math.PI / 2 + g, s.theta + Math.PI / 2 - g); ctx.stroke();
    } else {
      ctx.strokeStyle = '#b07a22'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#555';
    ctx.fillRect(cx - 40, cy - 6, 12, 12); ctx.fillRect(cx + 28, cy - 6, 12, 12);
    ctx.strokeStyle = c.text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 40, cy); ctx.lineTo(cx - 60, cy); ctx.lineTo(cx - 60, 430); ctx.lineTo(cx - 12, 430); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 40, cy); ctx.lineTo(cx + 60, cy); ctx.lineTo(cx + 60, 430); ctx.lineTo(cx + 12, 430); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 12, 414); ctx.lineTo(cx - 12, 446); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx + 12, 422); ctx.lineTo(cx + 12, 438); ctx.stroke();

    for (const sd of sides) {
      wireEnd(cx + sd.p.x, cy + sd.p.y, 14, sd.I > 0, c, s.I > 0);
      if (s.I > 0) {
        const up = sd.I > 0;
        arrow(cx + sd.p.x, cy + sd.p.y + (up ? -18 : 18), cx + sd.p.x, cy + sd.p.y + (up ? -70 : 70), c.force, 5, 13);
      }
    }
    const rpm = (s.omega / (2 * Math.PI)) * 60;
    ctx.fillStyle = c.text; ctx.font = `700 15px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`${Math.abs(rpm) < 1 ? 'not turning' : `${Math.abs(rpm).toFixed(0)} rpm ${rpm > 0 ? 'clockwise' : 'anticlockwise'}`}`, 16, 12);
    ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.fillText('Looking along the motor’s axle. Green arrows: forces on the coil.', 16, 34);
  },
};

// ---------- 5. Induction ----------

const COIL = { x0: 440, x1: 640, cy: 250, R: 70 };
const MAG_L = 180, MAG_H = 50;

const inductionMode = {
  name: 'Induction (generator)',
  intro: 'Move a magnet into or out of a coil and a potential difference is induced, making a current flow. This is the generator effect.',
  controls() {
    const s = S.ind;
    return `<h2>Magnet and coil</h2>
      <div class="ctl"><label for="i-n">Turns on the coil <b id="i-n-val">${s.turns}</b></label><input type="range" id="i-n" min="5" max="20" step="1" value="${s.turns}"></div>
      <label class="toggle"><input type="checkbox" id="i-strong" ${s.strong ? 'checked' : ''}> Stronger magnet</label>
      <div class="btn-row" style="margin:6px 0 10px"><button class="btn" id="i-flip">⇄ Turn the magnet round</button></div>
      <label class="toggle"><input type="checkbox" id="i-auto" ${s.auto ? 'checked' : ''}> Move the magnet in and out automatically</label>
      <div class="ctl" style="margin-top:6px"><label for="i-f">Speed <b id="i-f-val">${s.freq} Hz</b></label><input type="range" id="i-f" min="0.2" max="2" step="0.1" value="${s.freq}"></div>`;
  },
  bind() {
    const s = S.ind;
    $('i-n').addEventListener('input', (e) => { s.turns = Number(e.target.value); $('i-n-val').textContent = s.turns; });
    $('i-strong').addEventListener('change', (e) => { s.strong = e.target.checked; });
    $('i-flip').addEventListener('click', () => { s.flip = !s.flip; s.lastFlux = null; });
    $('i-auto').addEventListener('change', (e) => { s.auto = e.target.checked; });
    $('i-f').addEventListener('input', (e) => { s.freq = Number(e.target.value); $('i-f-val').textContent = `${s.freq} Hz`; });
  },
  info() {
    return `<h2>What affects the induced p.d.?</h2>
      <ul style="margin:0; padding-left:18px; font-size:.94rem">
        <li>It only happens while the magnet is <b>moving</b> (the field through the coil is changing).</li>
        <li><b>Faster</b> movement, a <b>stronger</b> magnet or <b>more turns</b> give a bigger p.d.</li>
        <li>Moving the other way, or turning the magnet round, <b>reverses</b> it.</li>
        <li>Moving in and out over and over makes an <b>alternating current</b>, like a generator.</li>
        <li>The induced current makes the coil a magnet that <b>opposes</b> the motion.</li>
      </ul>`;
  },
  flux() {
    const s = S.ind;
    const d = (COIL.x0 + COIL.x1) / 2 - s.mx;
    return (s.flip ? -1 : 1) * (s.strong ? 2 : 1) / (1 + (d / 120) ** 2) ** 1.5;
  },
  draw(c, dt) {
    const s = S.ind;
    s.t += dt;
    if (s.auto && !drag) { s.phase += 2 * Math.PI * s.freq * dt; s.mx = 300 + 170 * Math.sin(s.phase); }
    const phi = this.flux();
    const rate = s.lastFlux == null || dt === 0 ? 0 : (phi - s.lastFlux) / dt;
    s.lastFlux = phi;
    s.emf += (-s.turns * rate * 0.35 - s.emf) * Math.min(1, dt * 12);
    const reading = Math.max(-1, Math.min(1, s.emf / 10));
    s.needle += (reading - s.needle) * Math.min(1, dt * 10);
    s.trace.push({ t: s.t, v: reading });
    while (s.trace.length && s.trace[0].t < s.t - 8) s.trace.shift();

    // Coil
    const turnsDrawn = s.turns;
    ctx.strokeStyle = '#c98b2b'; ctx.lineWidth = 3;
    for (let i = 0; i < turnsDrawn; i++) {
      const x = COIL.x0 + ((i + 0.5) * (COIL.x1 - COIL.x0)) / turnsDrawn;
      ctx.beginPath(); ctx.ellipse(x, COIL.cy, 7, COIL.R, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // Leads to the meter
    ctx.strokeStyle = c.text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(COIL.x0 + 4, COIL.cy - COIL.R); ctx.lineTo(COIL.x0 + 4, 110); ctx.lineTo(500, 110); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(COIL.x1 - 4, COIL.cy - COIL.R); ctx.lineTo(COIL.x1 - 4, 110); ctx.lineTo(580, 110); ctx.stroke();
    // Centre-zero meter
    const mx = 540, my = 100;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx, my, 46, Math.PI, 2 * Math.PI); ctx.lineTo(mx + 46, my + 12); ctx.lineTo(mx - 46, my + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
    for (let k = -4; k <= 4; k++) { const a = -Math.PI / 2 + k * 0.3; ctx.beginPath(); ctx.moveTo(mx + Math.cos(a) * 38, my + Math.sin(a) * 38); ctx.lineTo(mx + Math.cos(a) * 44, my + Math.sin(a) * 44); ctx.stroke(); }
    const na = -Math.PI / 2 + s.needle * 1.2;
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(mx, my + 6); ctx.lineTo(mx + Math.cos(na) * 40, my + Math.sin(na) * 40); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = `700 10px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('0', mx, my - 30);

    // Magnet (draggable)
    const left = s.mx - MAG_L / 2, top = COIL.cy - MAG_H / 2;
    const facing = s.flip ? 'S' : 'N';
    ctx.fillStyle = facing === 'N' ? BLUE : RED; ctx.fillRect(left, top, MAG_L / 2, MAG_H);
    ctx.fillStyle = facing === 'N' ? RED : BLUE; ctx.fillRect(s.mx, top, MAG_L / 2, MAG_H);
    ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.strokeRect(left, top, MAG_L, MAG_H);
    ctx.fillStyle = '#fff'; ctx.font = `800 22px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(facing === 'N' ? 'S' : 'N', left + 24, COIL.cy + 1);
    ctx.fillText(facing, s.mx + MAG_L / 2 - 24, COIL.cy + 1);

    // Induced pole at the coil's end facing the magnet (it opposes the change)
    if (Math.abs(reading) > 0.04) {
      const approaching = Math.abs(phi) > 0 && Math.sign(rate) === Math.sign(phi);
      const induced = approaching ? facing : facing === 'N' ? 'S' : 'N';
      ctx.font = `800 24px ${c.font}`;
      ctx.fillStyle = induced === 'N' ? RED : BLUE;
      ctx.fillText(induced, COIL.x0 - 4, COIL.cy - COIL.R - 22);
      ctx.fillStyle = c.muted; ctx.font = `600 12px ${c.font}`;
      ctx.fillText(approaching ? 'induced pole repels the magnet' : 'induced pole attracts the magnet back', COIL.x0 + 40, COIL.cy + COIL.R + 22);
    }

    // Current–time trace
    const gx = 40, gy = 400, gw = 720, gh = 60;
    ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.strokeRect(gx, gy - gh / 2, gw, gh);
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
    ctx.strokeStyle = c.current; ctx.lineWidth = 2.5;
    ctx.beginPath();
    s.trace.forEach((p, i) => { const x = gx + gw - ((s.t - p.t) / 8) * gw, y = gy - p.v * (gh / 2 - 4); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.fillStyle = c.muted; ctx.font = `600 12px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('induced current against time (last 8 s)', gx, gy - gh / 2 - 4);
    ctx.textBaseline = 'top';
    ctx.fillText('Drag the magnet into and out of the coil.', 16, 12);
  },
  down(p) {
    const s = S.ind;
    if (Math.abs(p.x - s.mx) < MAG_L / 2 + 10 && Math.abs(p.y - COIL.cy) < MAG_H / 2 + 14) { s.auto = false; const a = $('i-auto'); if (a) a.checked = false; return { dx: s.mx - p.x }; }
    return null;
  },
  move(d, p) { S.ind.mx = Math.max(MAG_L / 2 + 5, Math.min(COIL.x1 - 40, p.x + d.dx)); },
};

// ---------- Mode switching, loop, pointer ----------

const MODES = { wire: wireMode, solenoid: solenoidMode, motor: motorMode, dcmotor: dcMode, induction: inductionMode };

function renderInfo() { $('info').innerHTML = MODES[S.mode].info(); }

function setMode(id) {
  S.mode = id;
  const m = MODES[id];
  document.querySelectorAll('#modes .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === id)));
  $('intro').textContent = m.intro;
  $('controls').innerHTML = m.controls();
  m.bind();
  renderInfo();
  $('bar').hidden = true;
  history.replaceState(null, '', '#m=' + id);
}

$('modes').innerHTML = Object.entries(MODES).map(([id, m]) => `<button class="btn" data-mode="${id}">${m.name}</button>`).join('');
$('modes').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientWidth * (H / W) * dpr);
}

let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = colours();
  ctx.fillStyle = c.surface;
  ctx.fillRect(0, 0, W, H);
  MODES[S.mode].draw(c, dt);
  requestAnimationFrame(frame);
}

function point(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const m = MODES[S.mode];
  if (!m.down) return;
  drag = m.down(point(e));
  if (drag) { try { canvas.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ } e.preventDefault(); }
});
canvas.addEventListener('pointermove', (e) => { if (drag) MODES[S.mode].move(drag, point(e)); });
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
window.addEventListener('resize', sizeCanvas);
window.addEventListener('pk-theme', () => { solCache = null; });

sizeCanvas();
const fromHash = new URLSearchParams(location.hash.slice(1)).get('m');
setMode(MODES[fromHash] ? fromHash : 'wire');
requestAnimationFrame(frame);
