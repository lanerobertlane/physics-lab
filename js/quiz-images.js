// Pictures used in quiz questions: SVG strings, or functions that return a canvas (circuits). Keys are used as [img: key] in scripts/quiz-raw.
// Drawn in currentColor so they work in every theme. Circuits are drawn supply-side up.
(() => {
  const S = (vb, w, label, body) => `<svg viewBox="${vb}" width="${w}" role="img" aria-label="${label}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const axes = '<path d="M20 90H180M100 10V170" stroke-width="2"/><text x="186" y="94" font-size="14" fill="currentColor" stroke="none">V</text><text x="106" y="20" font-size="14" fill="currentColor" stroke="none">I</text>';
  const ball = (cx, cy, r = 12) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e57373" stroke="#8e2b2b" stroke-width="1.5"/>`;

  window.QUIZ_IMAGES = {
  // Circuit symbols come from js/circuit-symbols.js, the same drawing code as the circuit builder
  ...(window.CircuitSymbols ? (() => {
    const C = window.CircuitSymbols;
    const pics = {
      resistor: C.component('resistor', 'Circuit symbol for a fixed resistor'),
      'variable-resistor': C.component('varres', 'Circuit symbol for a variable resistor'),
      cell: C.component('cell', 'Circuit symbol for a cell'),
      battery: C.component('battery', 'Circuit symbol for a battery'),
      lamp: C.component('lamp', 'Circuit symbol for a lamp: a circle with a cross in it'),
      switch: C.component('switch', 'Circuit symbol for an open switch'),
      ammeter: C.component('ammeter', 'Circuit symbol for an ammeter: a circle with A in it', 'A'),
      voltmeter: C.component('voltmeter', 'Circuit symbol for a voltmeter: a circle with V in it', 'V'),
    };
    // Three circuits side by side, each with a voltmeter across a lamp
    pics.voltmeters3 = () => C.canvas(450, 150, 'Three circuits. Circuit 1: one cell and one lamp, with voltmeter V1 across the lamp. Circuit 2: two cells and one lamp, with V2 across the lamp. Circuit 3: three cells and two lamps in series, with V3 across one lamp.', (g, col) => {
      const one = (ox, n, lamps, k) => {
        const top = 22, bot = 80, l = ox + 10, r = ox + 140, cw = 30, x0 = ox + 75 - (n * cw) / 2;
        C.place(g, 'wire', l, top, x0, top, col);
        for (let i = 0; i < n; i++) C.place(g, 'cell', x0 + i * cw, top, x0 + (i + 1) * cw, top, col);
        C.place(g, 'wire', x0 + n * cw, top, r, top, col);
        C.place(g, 'wire', l, top, l, bot, col); C.place(g, 'wire', r, top, r, bot, col);
        const spans = lamps === 1 ? [[ox + 50, ox + 100]] : [[ox + 22, ox + 66], [ox + 84, ox + 128]];
        let x = l;
        spans.forEach(([a1, b1]) => { C.place(g, 'wire', x, bot, a1, bot, col); C.place(g, 'lamp', a1, bot, b1, bot, col); x = b1; });
        C.place(g, 'wire', x, bot, r, bot, col);
        const [va, vb] = spans[0], vy = 118;
        C.place(g, 'wire', va, bot, va, vy, col, 2); C.place(g, 'wire', vb, bot, vb, vy, col, 2);
        C.place(g, 'voltmeter', va, vy, vb, vy, col, 2);
        C.text(g, 'V' + k, (va + vb) / 2, vy + 1, col, 11);
        C.text(g, 'Circuit ' + k, ox + 75, 144, col, 12, 400);
      };
      one(0, 1, 1, 1); one(150, 2, 1, 2); one(300, 3, 2, 3);
    });
    return pics;
  })() : {}),
  'iv-ohmic': S('0 0 200 180', 200, 'I–V graph: a straight line through the origin', `${axes}<path d="M35 155L165 25" stroke="#d32f2f"/>`),
  'iv-diode': S('0 0 200 180', 200, 'I–V graph: zero current for negative p.d., then current rises steeply after a small positive p.d.', `${axes}<path d="M20 91C80 91 105 91 118 80S135 40 140 12" stroke="#d32f2f"/>`),
  'iv-filament': S('0 0 200 180', 200, 'I–V graph: an S-shaped curve through the origin that flattens at high positive and negative p.d.', `${axes}<path d="M22 160C60 150 85 130 100 90S140 30 178 20" stroke="#d32f2f"/>`),
  'wave-labels': S('0 0 320 140', 320, 'A transverse wave with labels. A points to a peak, B points to a trough, C is the height from the middle line to a peak, D is the distance from one peak to the next.', '<path d="M10 70H310" stroke-width="1" stroke-dasharray="4 4"/><path d="M10 70C35 10 60 10 85 70S135 130 160 70S210 10 235 70S285 130 310 70"/>'
    + '<path d="M60 22L48 22" stroke-width="1.5"/><text x="30" y="27" font-size="14" fill="currentColor" stroke="none">A</text>'
    + '<path d="M135 118L150 128" stroke-width="1.5"/><text x="154" y="134" font-size="14" fill="currentColor" stroke="none">B</text>'
    + '<path d="M197 70V24M193 30l4-6 4 6M193 64l4 6 4-6" stroke-width="1.5"/><text x="203" y="52" font-size="14" fill="currentColor" stroke="none">C</text>'
    + '<path d="M197 14H272M203 10l-6 4 6 4M266 10l6 4-6 4" stroke-width="1.5"/><text x="228" y="10" font-size="14" fill="currentColor" stroke="none">D</text>'),
  longitudinal: S('0 0 320 90', 320, 'A slinky-like wave: coils bunched close together in some places (compressions) and spread apart in others (rarefactions), with the wavelength marked from one compression to the next', [6, 10, 14, 18, 22, 30, 42, 56, 70, 82, 90, 94, 98, 102, 106, 114, 126, 140, 154, 166, 174, 178, 182, 186, 190, 198, 210, 224, 238, 250, 258, 262, 266, 270, 274, 282, 294, 308].map((x) => `<path d="M${x + 4} 30v30" stroke-width="2"/>`).join('')
    + '<path d="M18 74v8M18 78H186M186 74v8" stroke-width="1.5"/><text x="102" y="88" text-anchor="middle" font-size="11" fill="currentColor" stroke="none">wavelength</text>'
    + '<text x="102" y="20" text-anchor="middle" font-size="11" fill="currentColor" stroke="none">compression</text><text x="226" y="20" text-anchor="middle" font-size="11" fill="currentColor" stroke="none">rarefaction</text>'),
  'element-molecules': S('0 0 200 140', 200, 'Four molecules, each made of two identical red atoms joined together', ball(40, 40) + ball(62, 40) + ball(130, 35) + ball(148, 48) + ball(70, 100) + ball(90, 92) + ball(150, 105) + ball(168, 112)),
  'particles-solid': S('0 0 160 160', 160, 'Particles in neat rows touching each other: a regular arrangement', [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<circle cx="${32 + c * 48}" cy="${32 + r * 48}" r="23" fill="#ef6c3a" stroke="#333" stroke-width="2"/>`)).join('')),
  'particles-liquid': S('0 0 160 160', 160, 'Particles touching each other but arranged randomly', [[30, 120], [72, 128], [116, 124], [50, 80], [96, 86], [136, 82], [26, 40], [120, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="21" fill="#42a5f5" stroke="#333" stroke-width="2"/>`).join('')),
  'particles-gas': S('0 0 160 160', 160, 'A few particles spread far apart', [[30, 30], [120, 45], [70, 95], [135, 130], [25, 135]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#9ccc65" stroke="#333" stroke-width="2"/>`).join('')),
  'slope-friction': S('0 0 220 150', 220, 'A box on a slope. Arrows show the weight straight down, the normal force at right angles to the slope, and an unlabelled arrow pointing up the slope', '<path d="M10 40L210 140" stroke="#a1887f" stroke-width="8"/><g transform="rotate(26.6 120 80)"><rect x="95" y="38" width="50" height="40" fill="#e6cc9a" stroke="#8d6e63"/></g><path d="M118 92v40M112 124l6 8 6-8" stroke="#2e7d32"/><path d="M128 52l16-32M136 24l8-4 0 9" stroke="#2e7d32"/><path d="M92 58L60 42M66 40l-6 2 3 6" stroke="#2e7d32"/><rect x="40" y="12" width="26" height="16" fill="#555" stroke="none"/><text x="53" y="25" text-anchor="middle" font-size="13" fill="#fff" stroke="none">?</text><path d="M53 28L62 41" stroke-width="1"/>'),
  };
})();
