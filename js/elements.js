// Element data shared by the Chemistry tools: symbols, names, relative atomic masses (as on the
// AQA periodic table), positions, categories and electron shells.

const EL = (() => {
  const SYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  const NAME = 'hydrogen helium lithium beryllium boron carbon nitrogen oxygen fluorine neon sodium magnesium aluminium silicon phosphorus sulfur chlorine argon potassium calcium scandium titanium vanadium chromium manganese iron cobalt nickel copper zinc gallium germanium arsenic selenium bromine krypton rubidium strontium yttrium zirconium niobium molybdenum technetium ruthenium rhodium palladium silver cadmium indium tin antimony tellurium iodine xenon caesium barium lanthanum cerium praseodymium neodymium promethium samarium europium gadolinium terbium dysprosium holmium erbium thulium ytterbium lutetium hafnium tantalum tungsten rhenium osmium iridium platinum gold mercury thallium lead bismuth polonium astatine radon francium radium actinium thorium protactinium uranium neptunium plutonium americium curium berkelium californium einsteinium fermium mendelevium nobelium lawrencium rutherfordium dubnium seaborgium bohrium hassium meitnerium darmstadtium roentgenium copernicium nihonium flerovium moscovium livermorium tennessine oganesson'.split(' ');
  const MASS = [1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35.5, 40, 39, 40, 45, 48, 51, 52, 55, 56, 59, 59, 63.5, 65, 70, 73, 75, 79, 80, 84, 85, 88, 89, 91, 93, 96, 98, 101, 103, 106, 108, 112, 115, 119, 122, 128, 127, 131, 133, 137, 139, 140, 141, 144, 145, 150, 152, 157, 159, 163, 165, 167, 169, 173, 175, 178, 181, 184, 186, 190, 192, 195, 197, 201, 204, 207, 209, 209, 210, 222, 223, 226, 227, 232, 231, 238, 237, 244, 243, 247, 247, 251, 252, 257, 258, 259, 262, 267, 268, 269, 270, 269, 278, 281, 282, 285, 286, 289, 290, 293, 294, 294];

  const PERIOD_START = [1, 3, 11, 19, 37, 55, 87, 119];
  // Group (1–18, or null for the lanthanides and actinides), period, and grid position
  function place(z) {
    let p = 0; while (z >= PERIOD_START[p + 1]) p++;
    const i = z - PERIOD_START[p], period = p + 1;
    if (period === 1) return { group: z === 1 ? 1 : 18, period, col: z === 1 ? 1 : 18, row: 1 };
    if (period <= 3) { const g = i < 2 ? i + 1 : i + 11; return { group: g, period, col: g, row: period }; }
    if (period <= 5) return { group: i + 1, period, col: i + 1, row: period };
    if (i < 2) return { group: i + 1, period, col: i + 1, row: period };
    if (i <= 16) return { group: null, period, col: i + 1, row: period + 3, f: true };   // f-block rows below
    return { group: i - 13, period, col: i - 13, row: period };
  }

  const METALLOID = new Set([5, 14, 32, 33, 51, 52]);
  const NONMETAL = new Set([1, 6, 7, 8, 15, 16, 34]);
  const HALOGEN = new Set([9, 17, 35, 53, 85, 117]);
  function category(z) {
    const { group, f, period } = place(z);
    if (f) return period === 6 ? 'lanthanide' : 'actinide';
    if (group === 18) return 'noble';
    if (HALOGEN.has(z)) return 'halogen';
    if (NONMETAL.has(z)) return 'nonmetal';
    if (METALLOID.has(z)) return 'metalloid';
    if (group === 1) return 'alkali';
    if (group === 2) return 'alkaline';
    if (group >= 3 && group <= 12) return 'transition';
    return 'post';
  }
  const CATEGORIES = {
    alkali: { name: 'Alkali metals (group 1)', col: '#f87171', metal: true },
    alkaline: { name: 'Alkaline earth metals (group 2)', col: '#fb923c', metal: true },
    transition: { name: 'Transition metals', col: '#facc15', metal: true },
    post: { name: 'Other metals', col: '#a3a3a3', metal: true },
    lanthanide: { name: 'Lanthanides', col: '#f9a8d4', metal: true },
    actinide: { name: 'Actinides', col: '#d8b4fe', metal: true },
    metalloid: { name: 'Metalloids (semi-metals)', col: '#5eead4', metal: false },
    nonmetal: { name: 'Other non-metals', col: '#86efac', metal: false },
    halogen: { name: 'Halogens (group 7)', col: '#7dd3fc', metal: false },
    noble: { name: 'Noble gases (group 0)', col: '#a5b4fc', metal: false },
  };

  // Electrons in each shell. For the first 20 this is the GCSE rule (2, 8, 8, 2).
  const ORBITALS = [[1, 2], [2, 2], [2, 6], [3, 2], [3, 6], [4, 2], [3, 10], [4, 6], [5, 2], [4, 10], [5, 6], [6, 2], [4, 14], [5, 10], [6, 6], [7, 2], [5, 14], [6, 10], [7, 6]];
  const EXCEPT = { 24: [2, 8, 13, 1], 29: [2, 8, 18, 1], 41: [2, 8, 18, 12, 1], 42: [2, 8, 18, 13, 1], 44: [2, 8, 18, 15, 1], 45: [2, 8, 18, 16, 1], 46: [2, 8, 18, 18], 47: [2, 8, 18, 18, 1], 78: [2, 8, 18, 32, 17, 1], 79: [2, 8, 18, 32, 18, 1], 57: [2, 8, 18, 18, 9, 2], 58: [2, 8, 18, 19, 9, 2], 64: [2, 8, 18, 25, 9, 2], 89: [2, 8, 18, 32, 18, 9, 2], 90: [2, 8, 18, 32, 18, 10, 2] };
  function shells(z) {
    if (EXCEPT[z]) return EXCEPT[z].slice();
    const out = []; let left = z;
    for (const [n, cap] of ORBITALS) { if (left <= 0) break; const k = Math.min(cap, left); out[n - 1] = (out[n - 1] || 0) + k; left -= k; }
    return out.map((v) => v || 0);
  }
  const outer = (z) => { const s = shells(z); return s[s.length - 1]; };
  // GCSE group number for the outer electrons: groups 1–2 and 13–18 (called 3–0 at GCSE)
  function gcseGroup(z) {
    const g = place(z).group;
    if (g === 1 || g === 2) return g;
    if (g >= 13 && g <= 17) return g - 10;
    if (g === 18) return 0;
    return null;
  }
  // The usual ion: groups 1, 2, 3 lose electrons; 5, 6, 7 gain them
  function ionCharge(z) {
    if (z === 1) return 1;
    const g = gcseGroup(z);
    if ((g === 1 || g === 2 || g === 3) && isMetal(z)) return g;
    if (g === 5 || g === 6 || g === 7) return g - 8;
    return null;
  }
  const isMetal = (z) => CATEGORIES[category(z)].metal;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const chargeText = (q) => (q === 0 ? '' : `${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '−'}`);
  const ionHtml = (z, q) => `${SYM[z - 1]}<sup>${chargeText(q)}</sup>`;

  return {
    count: SYM.length, sym: (z) => SYM[z - 1], name: (z) => NAME[z - 1], Name: (z) => cap(NAME[z - 1]), mass: (z) => MASS[z - 1],
    z: (s) => SYM.indexOf(s) + 1, place, category, CATEGORIES, shells, outer, gcseGroup, ionCharge, isMetal, chargeText, ionHtml, cap,
  };
})();

// Draw an atom in the style of the Atom builder: a nucleus of protons and neutrons, and
// electrons on dashed shells. colours: one colour per electron (optional).
function drawAtomModel(ctx, x, y, z, opts = {}) {
  const sh = opts.shells || EL.shells(z), R0 = opts.r0 || 26, dR = opts.dr || 16, er = opts.er || 4.5;
  const font = PK.cssVar('--font-body') || 'sans-serif';
  ctx.save();
  ctx.strokeStyle = opts.ring || PK.cssVar('--border-strong'); ctx.lineWidth = 1.3; ctx.setLineDash([3, 5]);
  sh.forEach((n, s) => { ctx.beginPath(); ctx.arc(x, y, R0 + s * dR, 0, Math.PI * 2); ctx.stroke(); });
  ctx.setLineDash([]);
  // Nucleus: a small cluster, labelled with the symbol
  const nr = Math.min(R0 - 8, 9 + Math.sqrt(z) * 1.2);
  const g = ctx.createRadialGradient(x - nr * 0.3, y - nr * 0.3, 1, x, y, nr);
  g.addColorStop(0, '#ff9e94'); g.addColorStop(1, '#c62828');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, nr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(nr * 0.95)}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(EL.sym(z), x, y + 0.5);
  let k = 0;
  sh.forEach((n, s) => {
    const r = R0 + s * dR;
    for (let i = 0; i < n; i++, k++) {
      const a = (opts.spin || 0) * (1 - s * 0.15) + (i / n) * Math.PI * 2 - Math.PI / 2 + s * 0.4;
      ctx.fillStyle = (opts.colours && opts.colours[k]) || '#2f7fe0';
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, er, 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.restore();
}
