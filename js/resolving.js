// Resolving forces (Higher): split one force into two components at right angles and find them
// with a scale drawing. It's a tab of the Resultant forces page, so everything here is kept inside
// this function to stay clear of the names in resultant-forces.js.
(() => {
  const $ = (id) => document.getElementById(id);
  const c = (n) => PK.cssVar(n);
  const RAD = Math.PI / 180;
  const r1 = (v) => Math.round(v * 10) / 10;
  const f1 = (v) => r1(v).toFixed(1);          // components always to 1 dp: "8.0 N"
  const fN = (v) => String(r1(v));
  const cap = (t) => t[0].toUpperCase() + t.slice(1);

  // F: [min, max, start] in N. a: [min, max, start] in degrees.
  const EX = [
    { id: 'any', F: [0.5, 200, 10], a: [0, 90, 36.87], fLabel: 'Size of the force', aLabel: 'Angle above the horizontal',
      p: 'horizontal component', q: 'vertical component', ps: 'horizontal', qs: 'vertical' },
    { id: 'sledge', F: [10, 100, 50], a: [0, 80, 30], fLabel: 'Pull of the rope', aLabel: 'Angle of the rope',
      p: 'forward component', q: 'upward component', ps: 'forward', qs: 'upward' },
    { id: 'slope', F: [5, 50, 40], a: [5, 60, 30], fLabel: 'Weight of the box', aLabel: 'Angle of the slope',
      p: 'component down the slope', q: 'component into the slope', ps: 'down the slope', qs: 'into the slope' },
  ];

  const rs = { on: false, ex: 0, vals: EX.map((e) => ({ F: e.F[2], a: e.a[2] })), revealed: false, others: false, scales: [1, 5, 5] };
  const VW = 640, VH = 400, SQ = 24;
  const ex = () => EX[rs.ex];
  const val = () => rs.vals[rs.ex];
  const hidden = () => !PK.answersShown() && !rs.revealed;

  // p is along the first axis (horizontal / forward / down the slope), q along the second.
  function parts() {
    const { F, a } = val();
    return ex().id === 'slope'
      ? { p: F * Math.sin(a * RAD), q: F * Math.cos(a * RAD) }
      : { p: F * Math.cos(a * RAD), q: F * Math.sin(a * RAD) };
  }

  // Newtons per square. It only changes when someone picks a new scale: a drawing that zooms by
  // itself is confusing.
  const scaleNow = () => rs.scales[rs.ex];
  // Whether the drawing fits on the squared paper at this scale
  function fits() {
    const s = scaleNow(), { p, q } = parts();
    return ex().id === 'slope' ? val().F / s <= 14.5 : p / s <= 23.1 && q / s <= 14.4;
  }

  // ---------- Drawing helpers ----------

  function arrow(x1, y1, x2, y2, col, w = 5, dash = '') {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return '';
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const head = Math.min(15, len), hw = 9 + w * 0.4;
    const bx = x2 - ux * head, by = y2 - uy * head, px = -uy * hw / 2, py = ux * hw / 2;
    return `<g pointer-events="none"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>
      <polygon points="${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}" fill="${col}"/></g>`;
  }
  const dotted = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c('--muted')}" stroke-width="1.6" stroke-dasharray="2 5" stroke-linecap="round" pointer-events="none"/>`;
  const label = (x, y, text, col, anchor = 'middle', size = 15) =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="800" fill="${col}" stroke="${c('--surface')}" stroke-width="4" paint-order="stroke" pointer-events="none">${text}</text>`;
  const handle = (x, y, col) => `<circle cx="${x}" cy="${y}" r="24" fill="transparent"/><circle cx="${x}" cy="${y}" r="8" fill="${c('--surface')}" stroke="${col}" stroke-width="3"/>`;
  const hint = (text) => `<text x="14" y="26" font-size="14" font-weight="700" fill="${c('--muted')}" pointer-events="none">${text}</text>`;
  // An arc for the angle from direction a0 to a1 (degrees, SVG rotation: clockwise from →)
  function angleArc(x, y, r, a0, a1, text, col) {
    const p = (a) => [x + r * Math.cos(a * RAD), y + r * Math.sin(a * RAD)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    const big = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 1 : 0;
    const lx = x + (r + 16) * Math.cos(((a0 + a1) / 2) * RAD), ly = y + (r + 16) * Math.sin(((a0 + a1) / 2) * RAD) + 5;
    return `<path d="M${x0} ${y0} A${r} ${r} 0 ${big} ${sweep} ${x1} ${y1}" fill="none" stroke="${col}" stroke-width="2" pointer-events="none"/>` +
      label(lx, ly, text, col, 'middle', 14);
  }
  // What a component's label says: its name, and its size once the answers are showing
  const partText = (name, v) => (hidden() ? `${name} = ?` : `${name} ${f1(v)} N`);

  // ---------- Squared paper ----------

  function scaleDrawing(svg, drag) {
    const e = ex(), { F, a } = val(), s = scaleNow(), k = SQ / s, { p, q } = parts();
    let out = `<rect width="${VW}" height="${VH}" fill="${c('--surface')}"/>`;
    const fCol = c('--f1'), pCol = c('--f2'), qCol = c('--f3');
    if (e.id === 'slope') {
      // The squares are turned to line up with the slope, so both components lie along grid lines
      const O = { x: 330, y: 30 };
      out += `<g transform="rotate(${a} ${O.x} ${O.y})">`;
      for (let i = -40; i <= 40; i++) {
        out += `<line x1="${O.x + i * SQ}" y1="${O.y - 900}" x2="${O.x + i * SQ}" y2="${O.y + 900}" stroke="${c('--grid')}"/>`;
        out += `<line x1="${O.x - 900}" y1="${O.y + i * SQ}" x2="${O.x + 900}" y2="${O.y + i * SQ}" stroke="${c('--grid')}"/>`;
      }
      out += `<line x1="${O.x - 900}" y1="${O.y}" x2="${O.x + 900}" y2="${O.y}" stroke="${c('--art')}" stroke-width="2"/>`;
      out += '</g>';
      const d = { x: Math.cos(a * RAD), y: Math.sin(a * RAD) }, n = { x: -Math.sin(a * RAD), y: Math.cos(a * RAD) };
      const T = { x: O.x, y: O.y + F * k };
      const P = { x: O.x + d.x * p * k, y: O.y + d.y * p * k }, Q = { x: O.x + n.x * q * k, y: O.y + n.y * q * k };
      out += dotted(T.x, T.y, P.x, P.y) + dotted(T.x, T.y, Q.x, Q.y);
      out += arrow(O.x, O.y, P.x, P.y, pCol, 4, '10 6') + arrow(O.x, O.y, Q.x, Q.y, qCol, 4, '10 6');
      out += arrow(O.x, O.y, T.x, T.y, fCol, 5);
      out += angleArc(O.x, O.y, 46, 90, 90 + a, `${fN(a)}°`, c('--muted'));
      out += `<circle cx="${O.x}" cy="${O.y}" r="5" fill="${c('--text')}"/>`;
      out += label(T.x + 10, T.y - 4, `weight ${fN(F)} N`, fCol, 'start');
      out += label(P.x + 8, P.y + 20, partText(e.ps, p), pCol, 'start', 14);
      out += label(Q.x - 8, Q.y + 18, partText(e.qs, q), qCol, 'end', 14);
      out += `<text x="14" y="24" font-size="13" font-weight="700" fill="${c('--muted')}">Grey line: the slope</text>`;
    } else {
      const O = { x: 70, y: 360 };
      for (let x = O.x % SQ; x <= VW; x += SQ) out += `<line x1="${x}" y1="0" x2="${x}" y2="${VH}" stroke="${c('--grid')}"/>`;
      for (let y = O.y % SQ; y <= VH; y += SQ) out += `<line x1="0" y1="${y}" x2="${VW}" y2="${y}" stroke="${c('--grid')}"/>`;
      out += `<line x1="${O.x}" y1="${O.y}" x2="${VW - 16}" y2="${O.y}" stroke="${c('--art')}" stroke-width="2"/>
        <line x1="${O.x}" y1="${O.y}" x2="${O.x}" y2="14" stroke="${c('--art')}" stroke-width="2"/>`;
      const T = { x: O.x + p * k, y: O.y - q * k };
      out += dotted(T.x, T.y, T.x, O.y) + dotted(T.x, T.y, O.x, T.y);
      out += arrow(O.x, O.y, T.x, O.y, pCol, 4, '10 6') + arrow(O.x, O.y, O.x, T.y, qCol, 4, '10 6');
      out += arrow(O.x, O.y, T.x, T.y, fCol, 5);
      if (a > 0.5 && a < 89.5) out += angleArc(O.x, O.y, 46, -a, 0, `${fN(a)}°`, c('--muted'));
      out += `<circle cx="${O.x}" cy="${O.y}" r="5" fill="${c('--text')}"/>`;
      // The force's size sits beside the middle of its arrow, on the upper-left side
      const mx = (O.x + T.x) / 2, my = (O.y + T.y) / 2, L = Math.hypot(T.x - O.x, T.y - O.y) || 1;
      const nx = -(O.y - T.y) / L, ny = -(T.x - O.x) / L;
      out += label(mx + nx * 22, my + ny * 22 + 5, `${fN(F)} N`, fCol, nx < -0.3 ? 'end' : 'middle', 16);
      out += label((O.x + T.x) / 2, O.y + 24, partText(e.ps, p), pCol, 'middle', 14);
      out += `<g transform="translate(${O.x - 12} ${(O.y + T.y) / 2}) rotate(-90)">${label(0, 0, partText(e.qs, q), qCol, 'middle', 14)}</g>`;
      if (drag) out += `<g class="rs-handle">${handle(T.x, T.y, fCol)}</g>` + hint('Drag the end of the blue arrow. It snaps to the corners of the squares.');
    }
    if (!fits()) {
      out += `<rect x="${VW / 2 - 190}" y="40" width="380" height="32" rx="8" fill="${c('--surface')}" stroke="${c('--bad')}" stroke-width="2"/>
        <text x="${VW / 2}" y="61" text-anchor="middle" font-size="14" font-weight="800" fill="${c('--bad')}">Too big for the paper: choose a bigger scale</text>`;
    }
    // The scale, in a box in the bottom-right corner
    const key = `1 square = ${s} N`;
    out += `<rect x="${VW - 150}" y="${VH - 34}" width="138" height="26" rx="6" fill="${c('--surface')}" stroke="${c('--border')}"/>
      <text x="${VW - 81}" y="${VH - 16}" text-anchor="middle" font-size="14" font-weight="800" fill="${c('--text')}">${key}</text>`;
    svg.innerHTML = out;
  }

  // ---------- The situations ----------

  const SLEDGE = { P: { x: 300, y: 292 }, k: 2.2 };
  function sledgeScene() {
    const e = ex(), { F, a } = val(), { p, q } = parts(), { P, k } = SLEDGE;
    const fCol = c('--f1'), pCol = c('--f2'), qCol = c('--f3'), ground = 318;
    let s = `<rect width="${VW}" height="${VH}" fill="${c('--surface')}"/>
      <rect x="0" y="${ground}" width="${VW}" height="${VH - ground}" fill="${c('--surface-2')}"/>
      <line x1="0" y1="${ground}" x2="${VW}" y2="${ground}" stroke="${c('--art')}" stroke-width="2"/>`;
    // The sledge, with a parcel on it
    s += `<g stroke="${c('--art')}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M120 ${ground - 2} L280 ${ground - 2} Q300 ${ground - 2} 300 ${P.y}"/>
        <path d="M140 ${ground - 2} L140 ${ground - 18} M260 ${ground - 2} L260 ${ground - 18}"/></g>
      <rect x="120" y="${ground - 30}" width="170" height="12" rx="4" fill="${c('--surface-2')}" stroke="${c('--art')}" stroke-width="2.5"/>
      <rect x="150" y="${ground - 92}" width="104" height="62" rx="6" fill="${c('--surface-2')}" stroke="${c('--art')}" stroke-width="2.5"/>
      <path d="M202 ${ground - 92} L202 ${ground - 30} M150 ${ground - 61} L254 ${ground - 61}" stroke="${c('--art')}" stroke-width="2"/>`;
    // The rope runs on past the arrow to whoever is pulling, off to the right
    const ux = Math.cos(a * RAD), uy = -Math.sin(a * RAD);
    s += `<line x1="${P.x}" y1="${P.y}" x2="${P.x + ux * 900}" y2="${P.y + uy * 900}" stroke="#a1785a" stroke-width="3"/>`;
    const T = { x: P.x + p * k, y: P.y - q * k };
    s += dotted(T.x, T.y, T.x, P.y) + dotted(T.x, T.y, P.x, T.y);
    s += arrow(P.x, P.y, T.x, P.y, pCol, 4, '10 6') + arrow(P.x, P.y, P.x, T.y, qCol, 4, '10 6');
    s += arrow(P.x, P.y, T.x, T.y, fCol, 5);
    if (a > 0.5) s += angleArc(P.x, P.y, 40, -a, 0, `${fN(a)}°`, c('--muted'));
    s += label(T.x + 12, T.y - 10, `pull ${fN(F)} N`, fCol, 'start', 16);
    s += label(Math.max(P.x + 4, (P.x + T.x) / 2), P.y + 22, partText(e.ps, p), pCol, (T.x - P.x) < 120 ? 'start' : 'middle', 14);
    if (q > 0.05) s += label(P.x, T.y - 12, partText(e.qs, q), qCol, 'middle', 14);
    s += `<g class="rs-handle">${handle(T.x, T.y, fCol)}</g>`;
    s += hint('Drag the end of the blue arrow to change the pull');
    return s;
  }

  const SLOPE = { B: { x: 610, y: 300 }, k: 2.8 };
  function slopeGeom() {
    const { a } = val(), { B } = SLOPE;
    const L = Math.min(430, 272 / Math.sin(a * RAD));
    const A = { x: B.x - L * Math.cos(a * RAD), y: B.y - L * Math.sin(a * RAD) };
    // The slope rises to the left: up the slope is up-left, and straight out of it is up-right
    const up = { x: -Math.cos(a * RAD), y: -Math.sin(a * RAD) }, out = { x: Math.sin(a * RAD), y: -Math.cos(a * RAD) };
    const S = { x: B.x + up.x * L * 0.5, y: B.y + up.y * L * 0.5 };   // where the box touches the slope
    const C = { x: S.x + out.x * 30, y: S.y + out.y * 30 };            // the middle of the box
    return { A, B, L, up, out, S, C };
  }
  function slopeScene() {
    const e = ex(), { F, a } = val(), { p, q } = parts(), { k } = SLOPE, { A, B, up, out, C } = slopeGeom();
    const fCol = c('--f1'), pCol = c('--f2'), qCol = c('--f3');
    let s = `<rect width="${VW}" height="${VH}" fill="${c('--surface')}"/>
      <rect x="0" y="${B.y}" width="${VW}" height="${VH - B.y}" fill="${c('--surface-2')}" opacity=".6"/>
      <line x1="0" y1="${B.y}" x2="${VW}" y2="${B.y}" stroke="${c('--art')}" stroke-width="2"/>
      <polygon points="${A.x},${A.y} ${B.x},${B.y} ${A.x},${B.y}" fill="${c('--surface-2')}" stroke="${c('--art')}" stroke-width="2.5" stroke-linejoin="round"/>`;
    s += angleArc(B.x, B.y, 54, 180, 180 + a, `${fN(a)}°`, c('--muted'));
    s += `<rect x="-30" y="-30" width="60" height="60" rx="4" fill="${c('--surface')}" stroke="${c('--art')}" stroke-width="2.5" transform="translate(${C.x} ${C.y}) rotate(${a})"/>`;
    const d = { x: -up.x, y: -up.y }, n = { x: -out.x, y: -out.y };
    const T = { x: C.x, y: C.y + F * k };
    const P = { x: C.x + d.x * p * k, y: C.y + d.y * p * k }, Q = { x: C.x + n.x * q * k, y: C.y + n.y * q * k };
    if (rs.others) {
      s += arrow(C.x, C.y, C.x + out.x * q * k, C.y + out.y * q * k, c('--f5'), 5);
      s += arrow(C.x, C.y, C.x + up.x * p * k, C.y + up.y * p * k, c('--f6'), 5);
    }
    s += dotted(T.x, T.y, P.x, P.y) + dotted(T.x, T.y, Q.x, Q.y);
    s += arrow(C.x, C.y, P.x, P.y, pCol, 4, '10 6') + arrow(C.x, C.y, Q.x, Q.y, qCol, 4, '10 6');
    s += arrow(C.x, C.y, T.x, T.y, fCol, 5);
    s += `<circle cx="${C.x}" cy="${C.y}" r="4" fill="${c('--text')}" pointer-events="none"/>`;
    s += label(T.x + 12, T.y + 2, `weight ${fN(F)} N`, fCol, 'start', 15);
    s += label(P.x + 10, P.y + 18, partText(e.ps, p), pCol, 'start', 14);
    s += label(Q.x - 10, Q.y + 16, partText(e.qs, q), qCol, 'end', 14);
    if (rs.others) {
      const N = { x: C.x + out.x * q * k, y: C.y + out.y * q * k }, Fr = { x: C.x + up.x * p * k, y: C.y + up.y * p * k };
      s += label(N.x - 8, N.y - 8, hidden() ? 'normal contact force' : `normal contact ${f1(q)} N`, c('--f5'), 'end', 14);
      s += label(Fr.x - 10, Fr.y + 18, hidden() ? 'friction' : `friction ${f1(p)} N`, c('--f6'), 'end', 14);
    }
    s += `<g class="rs-handle" data-h="top">${handle(A.x, A.y, c('--art'))}</g>`;
    s += `<g class="rs-handle" data-h="w">${handle(T.x, T.y, fCol)}</g>`;
    s += hint('Drag the top of the slope, or the end of the blue weight arrow');
    return s;
  }

  // ---------- Dragging ----------

  // The boxes show 1 decimal place; a snapped arrow keeps its exact size and angle
  function showVals() { const v = val(); $('rs-F').value = fN(v.F); $('rs-a').value = fN(v.a); }
  function setVal(F, a, exact) {
    const e = ex(), v = val(), rd = (x) => (exact ? Math.round(x * 1000) / 1000 : Math.round(x));
    v.F = Math.max(e.F[0], Math.min(e.F[1], rd(F)));
    v.a = Math.max(e.a[0], Math.min(e.a[1], rd(a)));
    showVals();
    rs.revealed = false;
    render();
  }
  // Put the tip of the arrow on the nearest corner of the squares, at s newtons per square
  function snapTo(s, i, j) { if (i || j) setVal(s * Math.hypot(i, j), Math.atan2(j, i) / RAD, true); }

  PK.dragOn($('rs-main'), VW, VH, {
    hit: (pt) => {
      const e = ex();
      if (e.id === 'any') {
        const s = scaleNow(), { p, q } = parts(), T = { x: 70 + p * SQ / s, y: 360 - q * SQ / s };
        return Math.hypot(pt.x - T.x, pt.y - T.y) < 30 ? 'tip' : null;
      }
      if (e.id === 'sledge') {
        const { p, q } = parts(), T = { x: SLEDGE.P.x + p * SLEDGE.k, y: SLEDGE.P.y - q * SLEDGE.k };
        return Math.hypot(pt.x - T.x, pt.y - T.y) < 30 ? 'tip' : null;
      }
      const { A, C } = slopeGeom(), W = { x: C.x, y: C.y + val().F * SLOPE.k };
      if (Math.hypot(pt.x - W.x, pt.y - W.y) < 30) return 'w';
      return Math.hypot(pt.x - A.x, pt.y - A.y) < 34 ? 'top' : null;
    },
    move: (h, pt) => {
      const e = ex();
      if (e.id === 'any') {
        // Snaps to the corners of the squares, and stays on the paper
        const i = Math.max(0, Math.min(23, Math.round((pt.x - 70) / SQ))), j = Math.max(0, Math.min(14, Math.round((360 - pt.y) / SQ)));
        snapTo(scaleNow(), i, j);
      } else if (e.id === 'sledge') {
        const dx = Math.max(0, pt.x - SLEDGE.P.x), dy = Math.max(0, SLEDGE.P.y - pt.y);
        setVal(Math.hypot(dx, dy) / SLEDGE.k, Math.atan2(dy, dx) / RAD);
      } else if (h === 'w') {
        setVal((pt.y - slopeGeom().C.y) / SLOPE.k, val().a);
      } else {
        const { B } = SLOPE;
        setVal(val().F, Math.atan2(B.y - pt.y, Math.max(1, B.x - pt.x)) / RAD);
      }
    },
    end: saveHash,
  });

  // ---------- The panel ----------

  function renderResult() {
    const e = ex(), { F, a } = val(), { p, q } = parts(), s = scaleNow();
    const note = {
      any: 'The two components together have exactly the same effect as the single force. You could swap the force for its two components and nothing would change.',
      sledge: 'Only the forward component pulls the sledge along. The upward component lifts it a little, so it presses less on the snow. Pull at a smaller angle and more of the force goes forward.',
      slope: rs.others
        ? 'The box is still. Friction balances the component down the slope, and the normal contact force balances the component into the slope, so the resultant force is zero.'
        : 'The component down the slope tries to make the box slide. The component into the slope presses the box onto the slope. A steeper slope makes the part down the slope bigger.',
    }[e.id];
    if (hidden()) {
      $('rs-result').innerHTML = `
        <div class="reveal-box">
          <span class="badge neutral">Measure them</span>
          <button class="btn primary" id="rs-reveal">Reveal</button>
        </div>
        <p class="note">Count the squares along each dashed arrow on the scale drawing, then use the scale (1 square = ${s} N) to find the ${e.p} and the ${e.q}.</p>`;
      $('rs-reveal').addEventListener('click', () => { rs.revealed = true; render(); });
      return;
    }
    const trig = e.id === 'slope'
      ? `${e.ps} = W sin θ = ${fN(F)} × sin ${fN(a)}° = ${f1(p)} N<br>${e.qs} = W cos θ = ${fN(F)} × cos ${fN(a)}° = ${f1(q)} N`
      : `${e.ps} = F cos θ = ${fN(F)} × cos ${fN(a)}° = ${f1(p)} N<br>${e.qs} = F sin θ = ${fN(F)} × sin ${fN(a)}° = ${f1(q)} N`;
    $('rs-result').innerHTML = `
      <dl class="readout"><dt>${cap(e.p)}</dt><dd style="color:var(--f2)">${f1(p)} N</dd><dt>${cap(e.q)}</dt><dd style="color:var(--f3)">${f1(q)} N</dd></dl>
      <div class="working">
        <p>Scale: 1 square = ${s} N</p>
        <p>${cap(e.ps)}: ${f1(p / s)} squares × ${s} N = <b>${f1(p)} N</b></p>
        <p>${cap(e.qs)}: ${f1(q / s)} squares × ${s} N = <b>${f1(q)} N</b></p>
        <p>Check with Pythagoras: √(${f1(p)}² + ${f1(q)}²) = <b>${fN(Math.hypot(p, q))} N</b>, the size of the ${e.id === 'slope' ? 'weight' : 'force'}.</p>
        <p class="beyond">With trigonometry:<br>${trig}</p>
      </div>
      <p class="note">${note}</p>`;
  }

  function renderNotes() {
    const e = ex();
    $('rs-scale-note').textContent = e.id === 'slope'
      ? 'The squares are turned to line up with the slope, so you can count along the slope and into it. The two dashed components, tip-to-tail, make the weight.'
      : 'Count the squares along each dashed arrow. Joined tip-to-tail, the two components make the original force.';
  }

  function render() {
    if (!rs.on) return;
    const e = ex();
    $('rs-scale-panel').hidden = e.id === 'any';
    $('rs-main').setAttribute('aria-label', e.id === 'any' ? 'A force and its two components on squared paper'
      : e.id === 'sledge' ? 'A sledge pulled by a rope at an angle, with the pull split into forward and upward components'
        : 'A box on a slope, with its weight split into components down the slope and into the slope');
    if (e.id === 'any') scaleDrawing($('rs-main'), true);
    else {
      $('rs-main').innerHTML = e.id === 'sledge' ? sledgeScene() : slopeScene();
      scaleDrawing($('rs-scale'), false);
    }
    renderResult();
    renderNotes();
  }

  // ---------- Controls ----------

  function setExample(i) {
    rs.ex = i; rs.revealed = false;
    const e = ex(), v = val();
    document.querySelectorAll('#rs-ex .chip').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === i)));
    $('rs-F-label').textContent = e.fLabel; $('rs-a-label').textContent = e.aLabel;
    Object.assign($('rs-F'), { min: e.F[0], max: e.F[1] }); Object.assign($('rs-a'), { min: e.a[0], max: e.a[1] });
    showVals();
    $('rs-per-square').value = String(scaleNow());
    $('rs-others-row').hidden = e.id !== 'slope';
    render();
  }
  document.querySelectorAll('#rs-ex .chip').forEach((b) => b.addEventListener('click', () => { setExample(Number(b.dataset.v)); saveHash(); }));
  for (const id of ['rs-F', 'rs-a']) {
    $(id).addEventListener('input', () => {
      const v = val(); v.F = PK.num('rs-F'); v.a = PK.num('rs-a');
      rs.revealed = false; render();
    });
    $(id).addEventListener('change', saveHash);
  }
  $('rs-others').addEventListener('change', (e) => { rs.others = e.target.checked; render(); saveHash(); });
  $('rs-per-square').addEventListener('change', (e) => { rs.scales[rs.ex] = Number(e.target.value) || 1; rs.revealed = false; render(); saveHash(); });
  window.addEventListener('pk-answers', () => { rs.revealed = false; render(); });
  window.addEventListener('pk-theme', render);

  // ---------- The two tabs of the page ----------

  const intro = document.querySelector('.tool-intro');
  const TEXT = {
    resultant: { h: intro.querySelector('h1').textContent, p: intro.querySelector('p').innerHTML },
    resolve: { h: 'Resolving forces', p: 'A single force can be split into two <b>components</b> at right angles. Together, the two components have the same effect as the single force. Drag the blue arrow, then count squares on the scale drawing to find each component.' },
  };
  function showTab(t) {
    rs.on = t === 'resolve';
    document.querySelectorAll('#rf-tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
    $('rf-resultant').hidden = rs.on; $('rf-resolve').hidden = !rs.on;
    intro.querySelector('h1').textContent = TEXT[t].h;
    intro.querySelector('p').innerHTML = TEXT[t].p;
    if (location.hash !== '#practice') window.saveHash();
    render();
  }
  document.querySelectorAll('#rf-tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));

  // The link for this tab: #t=resolve&e=sledge&F=50&a=30&o=1
  function saveHash() {
    if (!rs.on || location.hash === '#practice') return;
    const v = val(), p = new URLSearchParams({ t: 'resolve', e: ex().id, F: v.F, a: v.a, s: scaleNow() });
    if (rs.others) p.set('o', '1');
    history.replaceState(null, '', '#' + p.toString());
  }
  window.RF_RESOLVE = { on: () => rs.on, saveHash };

  const start = new URLSearchParams(PK.initialHash.slice(1));
  if (start.get('t') === 'resolve') {
    const i = Math.max(0, EX.findIndex((e) => e.id === start.get('e')));
    const e = EX[i];
    if (start.has('F')) rs.vals[i].F = Math.max(e.F[0], Math.min(e.F[1], Number(start.get('F')) || e.F[2]));
    if (start.has('a')) rs.vals[i].a = Math.max(e.a[0], Math.min(e.a[1], Number(start.get('a')) || 0));
    if ([1, 2, 5, 10, 20].includes(Number(start.get('s')))) rs.scales[i] = Number(start.get('s'));
    rs.others = start.get('o') === '1';
    $('rs-others').checked = rs.others;
    rs.ex = i;
    rs.on = true;
    setExample(i);
    showTab('resolve');
  } else setExample(0);
})();
