// Shared engine for calculation questions, used by Calculation practice and by the
// "Practice questions" tab in the tools. Needs equations-data.js.
// Each equation has a short context and ranges for a set of "free" quantities. The free
// values are chosen at random, the remaining quantity is worked out from the equation,
// then one quantity is hidden and becomes the question.

const PQ = (() => {
  // r(min, max, step): a random multiple of step. list: pick one.
  const r = (min, max, step) => ({ min, max, step });
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function draw(spec) {
    if (Array.isArray(spec)) return pick(spec);
    const n = Math.round((spec.max - spec.min) / spec.step);
    return Number((spec.min + spec.step * Math.floor(Math.random() * (n + 1))).toPrecision(10));
  }

  const G = [9.8];
  const SETUPS = {
    weight: { ctx: 'An object is hung from a newtonmeter.', free: { m: r(0.2, 60, 0.1), g: [9.8, 9.8, 9.8, 1.6, 3.7] } },
    work: { ctx: 'A box is pushed along the floor.', free: { F: r(5, 400, 5), s: r(0.5, 40, 0.5) } },
    hooke: { ctx: 'A spring is stretched by hanging masses on it.', free: { k: r(10, 400, 10), e: r(0.01, 0.25, 0.01) } },
    moment: { ctx: 'A force is used to turn a spanner.', free: { F: r(5, 300, 5), d: r(0.05, 1.5, 0.05) } },
    pressure: { ctx: 'A crate rests on the ground.', free: { F: r(50, 5000, 50), A: r(0.05, 2, 0.05) } },
    speed: { ctx: 'A cyclist travels at a steady speed.', free: { v: r(2, 15, 0.5), t: r(10, 600, 10) } },
    accel: { ctx: 'A car speeds up along a straight road.', free: { dv: r(2, 30, 1), t: r(2, 20, 0.5) } },
    newton2: { ctx: 'A car accelerates along a straight road.', free: { m: r(600, 2000, 50), a: r(0.5, 5, 0.5) } },
    momentum: { ctx: 'An object moves in a straight line.', free: { m: r(0.2, 90, 0.1), v: r(1, 30, 0.5) } },
    ke: { ctx: 'A runner is moving at a steady speed.', free: { m: r(40, 100, 1), v: r(2, 10, 0.5) } },
    gpe: { ctx: 'A box is lifted onto a high shelf.', free: { m: r(0.5, 50, 0.5), g: G, h: r(0.2, 20, 0.1) } },
    'power-e': { ctx: 'An electric kettle is switched on.', free: { P: r(500, 3000, 100), t: r(30, 300, 10) } },
    'power-w': { ctx: 'A motor lifts a load.', free: { Wwd: r(100, 20000, 100), t: r(2, 60, 1) } },
    'eff-e': { ctx: 'An electric motor transfers energy.', free: { eff: r(0.15, 0.95, 0.05), Ein: r(100, 10000, 100) } },
    'eff-p': { ctx: 'A lamp is switched on.', free: { eff: r(0.05, 0.9, 0.05), Pin: r(5, 2000, 5) } },
    charge: { ctx: 'A current flows through a lamp.', free: { I: r(0.1, 5, 0.1), t: r(5, 600, 5) } },
    ohm: { ctx: 'A resistor is connected in a circuit.', free: { I: r(0.1, 2, 0.1), R: r(2, 60, 2) } },
    'power-vi': { ctx: 'An appliance is connected to a power supply.', free: { V: [3, 6, 9, 12, 230], I: r(0.1, 10, 0.1) } },
    'power-i2r': { ctx: 'A current flows through a resistor.', free: { I: r(0.1, 5, 0.1), R: r(1, 200, 1) } },
    'energy-pt': { ctx: 'An appliance is switched on.', free: { P: r(5, 3000, 5), t: r(10, 3600, 10) } },
    'energy-qv': { ctx: 'Charge flows through a component.', free: { Qc: r(1, 500, 1), V: [1.5, 3, 6, 9, 12, 24, 230] } },
    density: { ctx: 'A block of material is measured.', free: { rho: [700, 920, 1000, 2700, 7900, 8900, 11300, 19300], vol: r(0.0005, 0.02, 0.0005) } },
    wave: { ctx: 'A wave travels across the surface of some water.', free: { f: r(0.5, 20, 0.5), lam: r(0.05, 5, 0.05) } },
    magnification: { ctx: 'A lens forms an image of an object.', free: { ho: r(0.5, 10, 0.5), mag: r(0.5, 6, 0.5) } },
    suvat: { ctx: 'A car accelerates along a straight road.', free: { u: r(2, 20, 1), a: r(0.5, 5, 0.5), s: r(5, 200, 5) } },
    epe: { ctx: 'A spring is stretched without going past its limit of proportionality.', free: { k: r(10, 500, 10), e: r(0.01, 0.3, 0.01) } },
    shc: { ctx: 'A block is heated with an electric heater.', free: { m: r(0.2, 5, 0.1), c: [4200, 2100, 900, 450, 390, 130], dth: r(2, 60, 1) } },
    period: { ctx: 'A wave passes a point.', free: { f: r(0.5, 50, 0.5) } },
    fbil: { ctx: 'A wire carrying a current is at right angles to a magnetic field.', free: { B: r(0.05, 1, 0.05), I: r(0.5, 10, 0.5), l: r(0.02, 0.5, 0.01) } },
    latent: { ctx: 'A substance changes state at constant temperature.', free: { m: r(0.1, 5, 0.1), L: [334000, 2260000, 200000] } },
    'transformer-ratio': { ctx: 'A transformer changes the size of an alternating p.d.', free: { Vp: [12, 230, 400, 11000], np: r(100, 5000, 100), ns: r(10, 2000, 10) } },
    'transformer-power': { ctx: 'A transformer is 100% efficient.', free: { Vp: [230, 400, 11000], Ip: r(0.5, 10, 0.5), Vs: [6, 12, 24, 110] } },
    gas: { ctx: 'A fixed mass of gas is compressed slowly, so its temperature stays the same.', free: { p1: r(100000, 300000, 10000), V1: r(0.002, 0.01, 0.0005), V2: r(0.0005, 0.0019, 0.0001) } },
    liquid: { ctx: 'A diver is under water.', free: { h: r(0.5, 50, 0.5), rho: [1000, 1030], g: G } },
    impulse: { ctx: 'A ball is kicked.', free: { m: r(0.1, 1, 0.05), dv: r(2, 30, 1), dt: r(0.01, 0.5, 0.01) } },
  };

  // Units a value can be shown in instead of the SI unit, and when that looks natural.
  const CONVERT = {
    m: [{ unit: 'km', f: 1000, ok: (v) => v >= 1000 }, { unit: 'cm', f: 0.01, ok: (v) => v < 1 }],
    kg: [{ unit: 'g', f: 0.001, ok: (v) => v < 5 }],
    J: [{ unit: 'MJ', f: 1e6, ok: (v) => v >= 1e6 }, { unit: 'kJ', f: 1000, ok: (v) => v >= 1000 && v < 1e6 }],
    W: [{ unit: 'kW', f: 1000, ok: (v) => v >= 1000 }],
    s: [{ unit: 'minutes', f: 60, ok: (v) => v >= 60 && v % 60 === 0 }],
    A: [{ unit: 'mA', f: 0.001, ok: (v) => v < 1 }],
    Hz: [{ unit: 'kHz', f: 1000, ok: (v) => v >= 1000 }],
    Pa: [{ unit: 'kPa', f: 1000, ok: (v) => v >= 1000 }],
    V: [{ unit: 'kV', f: 1000, ok: (v) => v >= 1000 }],
    'Ω': [{ unit: 'kΩ', f: 1000, ok: (v) => v >= 1000 }],
    N: [{ unit: 'kN', f: 1000, ok: (v) => v >= 1000 }],
    'm³': [{ unit: 'cm³', f: 1e-6, ok: (v) => v < 0.01 }],
  };

  const sig3 = (x) => Number(x.toPrecision(3));
  const unitOf = (id) => Q[id].unit;
  const fmt = (v) => PK.sig(v, 4);
  const unitText = (u) => (u ? ` ${u}` : '');
  const isExact = (v) => Number(v.toPrecision(3)) === Number(v.toPrecision(12));

  function writtenFormula(eq) {
    if (eq.custom || eq.html) return eq.html;
    return `${Q[eq.lhs].sym} = ${expression(eq, eq.lhs, (id) => Q[id].sym, false)}`;
  }
  function rearranged(eq, subject) {
    if (eq.custom) return eq.forms[subject].html;
    return `${Q[subject].word ? nameOf(eq, subject) : Q[subject].sym} = ${expression(eq, subject, (id) => Q[id].sym, false)}`;
  }

  // Work out every quantity: the free ones are drawn, the last one comes from the equation.
  function fullSet(eq) {
    const x = {};
    for (const [id, spec] of Object.entries(SETUPS[eq.id].free)) x[id] = draw(spec);
    const rest = varsOf(eq).find((id) => !(id in x));
    if (rest) x[rest] = sig3(solve(eq, rest, x));
    return x;
  }

  // A question from one of the equations in the list
  function make(list, { rearrange = true, convert = false } = {}) {
    list = list.filter((eq) => SETUPS[eq.id]);
    if (!list.length) return null;
    for (let tries = 0; tries < 50; tries++) {
      const eq = pick(list);
      const x = fullSet(eq);
      const defaultSub = eq.custom ? eq.vars[0] : eq.lhs;
      const subject = rearrange ? pick(varsOf(eq)) : defaultSub;
      const given = varsOf(eq).filter((id) => id !== subject);
      const answer = solve(eq, subject, Object.fromEntries(given.map((id) => [id, x[id]])));
      if (!isFinite(answer) || answer <= 0 || given.some((id) => !(x[id] > 0))) continue;
      // Choose how each given value is shown
      const shown = {};
      for (const id of given) shown[id] = { value: x[id], unit: unitOf(id), f: 1 };
      if (convert) {
        const options = given.filter((id) => (CONVERT[unitOf(id)] || []).some((c) => c.ok(x[id])));
        options.sort(() => Math.random() - 0.5);
        options.slice(0, Math.random() < 0.4 ? 2 : 1).forEach((id) => {
          const c = CONVERT[unitOf(id)].find((cv) => cv.ok(x[id]));
          shown[id] = { value: Number((x[id] / c.f).toPrecision(6)), unit: c.unit, f: c.f };
        });
      }
      return { eq, subject, given, x, shown, answer };
    }
    return null;
  }

  // Plainer wording for questions than the formal names on the equation sheet.
  const PLAIN = {
    'force applied to a spring': 'force', 'moment of a force': 'moment', 'force normal to a surface': 'force',
    'area of that surface': 'area', 'speed (or velocity)': 'speed', 'distance travelled': 'distance',
    'force on a conductor carrying a current': 'force on the wire', 'pressure due to a column of liquid': 'pressure',
    'height of the column': 'depth', 'perpendicular distance from the pivot': 'distance from the pivot',
  };
  const plainName = (eq, id) => PLAIN[nameOf(eq, id)] || nameOf(eq, id);
  const sentenceName = (eq, id) => { const n = plainName(eq, id); return n.charAt(0).toUpperCase() + n.slice(1); };

  // The question as a card: tags, context, the given values and what to find
  function questionHtml(q, { showEq = false } = {}) {
    const { eq, subject, given, shown } = q;
    const rows = given.map((id) => `<li><span>${sentenceName(eq, id)}</span><b>${fmt(shown[id].value)}${unitText(shown[id].unit)}</b></li>`).join('');
    const unit = unitOf(subject);
    const tags = [
      eq.recall ? '<span class="tag recall">Must recall</span>' : '<span class="tag given">Given on sheet</span>',
      eq.po ? '<span class="tag po">Physics only</span>' : '',
      eq.ht ? '<span class="tag ht">Higher</span>' : '',
    ].join('');
    return `
      <div class="tags">${tags}<span class="tag">${eq.topic}</span></div>
      <p class="ctx">${SETUPS[eq.id].ctx}</p>
      <ul class="givens">${rows}</ul>
      <p class="ask">Calculate the <b>${plainName(eq, subject)}</b>${unit ? ` in ${unit}` : ''}.${Q[subject].word && subject === 'eff' ? ' Give your answer as a decimal.' : ''}</p>
      ${showEq ? `<div class="eq-show">${writtenFormula(eq)}</div>` : ''}`;
  }
  const hintHtml = (q) => `<div class="eq-show">${writtenFormula(q.eq)}</div><div class="note">${wordEquation(q.eq)}</div>`;

  // Numbered worked answer (the normal view)
  function workingHtml(q) {
    const { eq, subject, given, shown, x, answer } = q;
    const steps = [];
    steps.push(`<li><b>Write down the equation.</b><div class="eq-show">${writtenFormula(eq)}</div></li>`);
    const conv = given.filter((id) => shown[id].f !== 1);
    if (conv.length) steps.push(`<li><b>Convert to SI units.</b>${conv.map((id) => `<div>${fmt(shown[id].value)} ${shown[id].unit} = ${fmt(x[id])} ${unitOf(id)}</div>`).join('')}</li>`);
    const asWritten = eq.custom ? eq.vars[0] : eq.lhs;
    if (subject !== asWritten || (eq.html && !eq.custom)) steps.push(`<li><b>Rearrange for the ${plainName(eq, subject)}.</b><div class="eq-show">${rearranged(eq, subject)}</div></li>`);
    const sub = eq.custom
      ? eq.forms[subject].sub(Object.fromEntries(given.map((id) => [id, numLabel(x[id])])))
      : expression(eq, subject, (id) => numLabel(x[id]), true);
    const lhsLabel = Q[subject].word ? nameOf(eq, subject) : Q[subject].sym;
    steps.push(`<li><b>Substitute the values.</b><div class="eq-show">${lhsLabel} = ${sub}</div></li>`);
    steps.push(`<li><b>Work it out.</b><div class="ans">${lhsLabel} = ${PK.sig(answer, 3)}${unitText(unitOf(subject))}</div>${isExact(answer) ? '' : '<div class="note">Rounded to 3 significant figures.</div>'}</li>`);
    return `<h2>Worked answer</h2><ol class="steps">${steps.join('')}</ol>`;
  }

  // VESRAU layout: Values, Equation, Substitute, Rearrange (only when it's needed), Answer
  // and Units. Just the lines, without labels.
  const symOf = (eq, id) => (Q[id].word ? plainName(eq, id) : Q[id].sym);
  // Equations written on the sheet in a different form from the one used to solve them.
  const WRITTEN = {
    'transformer-ratio': { order: ['Vp', 'Vs', 'np', 'ns'], html: 'V<sub>p</sub> / V<sub>s</sub> = n<sub>p</sub> / n<sub>s</sub>', sub: (l) => `${l('Vp')} / ${l('Vs')} = ${l('np')} / ${l('ns')}` },
    'transformer-power': { order: ['Vs', 'Is', 'Vp', 'Ip'], html: 'V<sub>s</sub> I<sub>s</sub> = V<sub>p</sub> I<sub>p</sub>', sub: (l) => `${l('Vs')} × ${l('Is')} = ${l('Vp')} × ${l('Ip')}` },
    gas: { order: ['p1', 'V1', 'p2', 'V2'], html: 'p<sub>1</sub> V<sub>1</sub> = p<sub>2</sub> V<sub>2</sub>', sub: (l) => `${l('p1')} × ${l('V1')} = ${l('p2')} × ${l('V2')}` },
  };
  function vesrauHtml(q) {
    const { eq, subject, given, shown, x, answer } = q;
    const lab = (id) => (id === subject ? symOf(eq, id) : numLabel(x[id]));
    const blocks = [];
    const written = WRITTEN[eq.id];
    blocks.push((written ? written.order : varsOf(eq)).map((id) => {
      if (id === subject) return `<span class="v">${symOf(eq, id)} = ?</span>`;
      const sh = shown[id];
      return `<span class="v">${symOf(eq, id)} = ${fmt(sh.value)}${unitText(sh.unit)}${sh.f !== 1 ? ` = ${fmt(x[id])}${unitText(unitOf(id))}` : ''}</span>`;
    }).join(''));
    blocks.push(`<div>${written ? written.html : writtenFormula(eq)}</div>`);
    blocks.push(`<div>${written ? written.sub(lab)
      : eq.custom ? `${lab('vf')}<sup>2</sup> − ${lab('u')}<sup>2</sup> = 2 × ${lab('a')} × ${lab('s')}`
        : `${lab(eq.lhs)} = ${expression(eq, eq.lhs, lab, true)}`}</div>`);
    if (written || eq.custom || subject !== eq.lhs) {
      const solved = eq.custom
        ? eq.forms[subject].sub(Object.fromEntries(given.map((id) => [id, numLabel(x[id])])))
        : expression(eq, subject, (id) => numLabel(x[id]), true);
      blocks.push(`<div>${symOf(eq, subject)} = ${solved}</div>`);
    }
    blocks.push(`<div class="ans">${symOf(eq, subject)} = ${PK.sig(answer, 3)}${unitText(unitOf(subject))}</div>`);
    return `<div class="vesrau">${blocks.map((b) => `<div class="vb">${b}</div>`).join('')}</div>`;
  }

  // The question as sentences, for presentation view
  const joinList = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  function presentationText(q) {
    const { eq, subject, given, shown } = q;
    const sentence = joinList(given.map((id) => `the ${plainName(eq, id)} is ${fmt(shown[id].value)}${unitText(shown[id].unit)}`));
    const unit = unitOf(subject);
    return `<p>${SETUPS[eq.id].ctx} ${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.</p>
      <p>Calculate the ${plainName(eq, subject)}${unit ? ` in ${unit}` : ''}.${subject === 'eff' ? ' Give your answer as a decimal.' : ''}</p>`;
  }

  // Mark an answer: { ok, tip } with a hint for the usual slips
  function mark(q, v) {
    if (Math.abs(v - q.answer) / Math.abs(q.answer) <= 0.011) return { ok: true };
    const ratio = v / q.answer;
    const near = (k) => Math.abs(ratio / k - 1) < 0.02;
    let tip = 'Not quite. Check your rearranging and your arithmetic, then try again.';
    if ([1000, 0.001, 1e6, 1e-6, 100, 0.01, 60, 1 / 60].some(near)) tip = 'Not quite. Your answer is out by a power of ten (or a factor of 60). Check you converted every value to SI units.';
    else if (q.answer !== 1 && (near(q.answer) || Math.abs((v * v) / q.answer - 1) < 0.02)) tip = 'Not quite. Did you square or square-root when you shouldn’t have, or forget to?';
    else if (Math.abs(v * q.answer - 1) < 0.02) tip = 'Not quite. Have you divided the wrong way round?';
    else if (near(2) || near(0.5)) tip = 'Not quite. Your answer is out by a factor of 2. Check for a ½ (or a 2) in the equation.';
    else if (near(4) || near(0.25)) tip = 'Not quite. Your answer is out by a factor of 4. Did you square a value twice, or forget to?';
    return { ok: false, tip };
  }

  return { SETUPS, CONVERT, make, questionHtml, hintHtml, workingHtml, vesrauHtml, presentationText, mark, writtenFormula, plainName, unitOf, unitText };
})();
