// The list of every tool on the home page. Set `href` once a tool is built;
// tools without one show as "coming soon".
// Flags: ks3, gcse, po (GCSE Physics only, not Combined), ht (has Higher-tier content), rp (required practical).

const TOPICS = [
  { id: 'forces', name: 'Forces', ref: 'AQA 4.5', colour: '--t-forces' },
  { id: 'electricity', name: 'Electricity', ref: 'AQA 4.2', colour: '--t-electricity' },
  { id: 'magnetism', name: 'Magnetism & electromagnetism', ref: 'AQA 4.7', colour: '--t-magnetism' },
  { id: 'waves', name: 'Waves', ref: 'AQA 4.6', colour: '--t-waves' },
  { id: 'energy', name: 'Energy', ref: 'AQA 4.1', colour: '--t-energy' },
  { id: 'particles', name: 'Particle model of matter', ref: 'AQA 4.3', colour: '--t-particles' },
  { id: 'atomic', name: 'Atomic structure', ref: 'AQA 4.4', colour: '--t-atomic' },
  { id: 'space', name: 'Space physics', ref: 'AQA 4.8', colour: '--t-space' },
  { id: 'reference', name: 'Reference', ref: '', colour: '--t-reference' },
];

const TOOLS = [
  // Forces
  { topic: 'forces', icon: 'resultant', name: 'Resultant forces', href: 'tools/resultant-forces.html', ks3: true, gcse: true, ht: true,
    desc: 'Put forces on an object, find the resultant and watch it accelerate. Includes scale drawings.' },
  { topic: 'forces', icon: 'pairs', name: "Newton's third law pairs", href: 'tools/third-law.html', ks3: true, gcse: true,
    desc: 'Tap a force to find its partner. Spot the pairs that only look like pairs.' },
  { topic: 'forces', icon: 'graph', name: 'Motion graphs', href: 'tools/motion-graphs.html', gcse: true, ht: true, ks3: true,
    desc: 'Drive a car or play a journey and watch distance–time and velocity–time graphs being drawn.' },
  { topic: 'forces', icon: 'car', name: 'Stopping distances', href: 'tools/stopping.html', gcse: true, ht: true,
    desc: 'Thinking and braking distance with speed, reaction time, road conditions and worn brakes.' },
  { topic: 'forces', icon: 'spring', name: "Springs & Hooke's law", href: 'tools/springs.html', gcse: true, ks3: true, rp: true,
    desc: 'Hang masses, read the ruler, plot force against extension and find the spring constant.' },
  { topic: 'forces', icon: 'lever', name: 'Moments', href: 'tools/moments.html', gcse: true, po: true, ks3: true,
    desc: 'Hang weights on a beam and balance it using the principle of moments.' },
  { topic: 'forces', icon: 'resultant', name: 'Required practical: acceleration', gcse: true, rp: true,
    desc: 'A trolley pulled by falling masses: how force and mass affect acceleration (F = m a).' },

  // Electricity
  { topic: 'electricity', icon: 'circuit', name: 'Circuit builder', href: 'tools/circuits.html', gcse: true, ks3: true, rp: true,
    desc: 'Build circuits with UK symbols and measure V, I and R live. Lamps, diodes, LDRs, thermistors and fuses.' },
  { topic: 'electricity', icon: 'iv', name: 'I–V characteristics', href: 'tools/circuits.html', gcse: true, rp: true,
    desc: 'Plot the I–V graph for a resistor, filament lamp and diode, using the circuit builder’s results table.' },

  // Magnetism
  { topic: 'magnetism', icon: 'magnet', name: 'Bar magnet fields', href: 'tools/magnets.html', gcse: true, ks3: true,
    desc: 'Drag and turn magnets to see field lines, iron filings and attraction or repulsion. Plot the field with a compass.' },
  { topic: 'magnetism', icon: 'motor', name: 'Electromagnets & the motor effect', href: 'tools/electromagnetism.html', gcse: true, ks3: true, ht: true,
    desc: "Fields around wires and solenoids, electromagnets, F = BIl with Fleming's left-hand rule, and the DC motor." },
  { topic: 'magnetism', icon: 'wave', name: 'Electromagnetic induction', href: 'tools/electromagnetism.html#m=induction', gcse: true, po: true, ht: true,
    desc: 'Move a magnet in and out of a coil: induced p.d., alternating current and the generator effect.' },

  // Waves
  { topic: 'waves', icon: 'spectrum', name: 'Electromagnetic spectrum', href: 'tools/em-spectrum.html', ks3: true, gcse: true, ht: true,
    desc: 'Explore every region: wavelength, frequency, uses, dangers and how it is made.' },
  { topic: 'waves', icon: 'wave', name: 'Transverse & longitudinal waves', href: 'tools/waves.html', gcse: true, ks3: true,
    desc: 'Beads on a string and a slinky side by side: crests, troughs, compressions and rarefactions, with v = fλ.' },
  { topic: 'waves', icon: 'ripple', name: 'Ripple tank', href: 'tools/ripple-tank.html', gcse: true, ks3: true, rp: true,
    desc: 'Reflection, refraction and diffraction, with a ruler and strobe for the required practical.' },
  { topic: 'waves', icon: 'heat', name: 'Required practical: infrared radiation', gcse: true, rp: true,
    desc: 'A Leslie cube: how the type of surface affects the infrared radiated and absorbed.' },
  { topic: 'waves', icon: 'ray', name: 'Light box & lenses', href: 'tools/light-box.html', gcse: true, po: true, ks3: true, rp: true,
    desc: 'Refraction through glass blocks, total internal reflection, prisms, mirrors and lens ray diagrams.' },

  // Energy
  { topic: 'energy', icon: 'stores', name: 'Energy stores', href: 'tools/energy.html', gcse: true, ks3: true,
    desc: 'Kinetic and gravitational stores for a bouncing ball or rollercoaster, with friction on or off.' },
  { topic: 'energy', icon: 'efficiency', name: 'Efficiency calculator', href: 'tools/efficiency.html', gcse: true, ks3: true, ht: true,
    desc: 'Where the energy goes in everyday devices, plus a calculator for any efficiency question.' },
  { topic: 'energy', icon: 'heat', name: 'Specific heat capacity', href: 'tools/shc.html', gcse: true, rp: true,
    desc: 'Heat a 1 kg block, record energy and temperature, and find c from the gradient.' },
  { topic: 'energy', icon: 'heat', name: 'Required practical: thermal insulation', gcse: true, po: true, rp: true,
    desc: 'Compare insulating materials by how quickly a beaker of hot water cools.' },

  // Particles
  { topic: 'particles', icon: 'particles', name: 'States of matter', href: 'tools/states.html', gcse: true, ks3: true,
    desc: 'Heat or cool water and watch the particles. Heating curve, latent heat and internal energy.' },
  { topic: 'particles', icon: 'gas', name: 'Gas pressure', href: 'tools/gas.html', gcse: true, po: true, ht: true, ks3: true,
    desc: 'Particles in a cylinder with a piston: pressure, volume and temperature, with pV = constant.' },
  { topic: 'particles', icon: 'gas', name: 'Required practical: density', gcse: true, rp: true, ks3: true,
    desc: 'Measure mass and volume of regular and irregular objects (a eureka can) and liquids, and calculate density.' },

  // Atomic
  { topic: 'atomic', icon: 'atom', name: 'Atom builder', href: 'tools/atom.html', gcse: true, ks3: true,
    desc: 'Add protons, neutrons and electrons. Make ions and isotopes.' },
  { topic: 'atomic', icon: 'history', name: 'History of the atom', href: 'tools/atom-history.html', gcse: true,
    desc: 'Plum pudding to Bohr, including Rutherford scattering.' },
  { topic: 'atomic', icon: 'radiation', name: 'Alpha, beta & gamma', href: 'tools/radiation.html', gcse: true,
    desc: 'Penetration through paper, aluminium and lead.' },
  { topic: 'atomic', icon: 'halflife', name: 'Half-life', href: 'tools/half-life.html', gcse: true, ht: true,
    desc: 'Random decay simulator with a graph that builds as it runs.' },

  // Space
  { topic: 'space', icon: 'orbit', name: 'Orbits', href: 'tools/orbits.html', gcse: true, po: true, ht: true,
    desc: 'Change a satellite’s speed to see whether it orbits or escapes.' },
  { topic: 'space', icon: 'star', name: 'Life cycle of a star', href: 'tools/star-life.html', gcse: true, po: true,
    desc: 'From nebula to white dwarf, neutron star or black hole.' },
  { topic: 'space', icon: 'redshift', name: 'Red-shift', href: 'tools/redshift.html', gcse: true, po: true,
    desc: 'Galaxies moving away and the evidence for the Big Bang.' },

  // Reference
  { topic: 'reference', icon: 'equation', name: 'Equation explorer', href: 'tools/equations.html', ks3: true, gcse: true, ht: true,
    desc: 'Every AQA equation: recall or given, rearrange it and calculate.' },
];

const TOOL_ICONS = {
  resultant: '<path d="M12 12h8M12 12V4M12 12l6-6"/><path d="M18 3l2 1-1 2M18 10l2 2-2 2M10 6l2-2 2 2"/>',
  pairs: '<path d="M3 12h7M21 12h-7"/><path d="M7 9l3 3-3 3M17 9l-3 3 3 3"/>',
  graph: '<path d="M4 20V4M4 20h16"/><path d="M7 16l4-5 3 3 5-7"/>',
  car: '<path d="M3 16v-3l2-5h11l3 5h2v3z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  spring: '<path d="M12 2v3l-5 2 10 2-10 2 10 2-10 2 5 2v3"/><rect x="9" y="20" width="6" height="2"/>',
  lever: '<path d="M2 10l20 -2"/><path d="M12 9l-3 9h6z"/>',
  circuit: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M10 3v4M14 4v2" /><circle cx="12" cy="19" r="2.5"/>',
  iv: '<path d="M12 3v18M3 12h18"/><path d="M5 19l14-14"/>',
  magnet: '<rect x="3" y="9" width="18" height="6" rx="1"/><path d="M12 9v6"/><path d="M5 9c2-6 12-6 14 0" stroke-dasharray="2 2"/>',
  motor: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
  spectrum: '<path d="M2 12c1-4 2-4 3 0s2 4 3 0 1.5-4 2.5 0 1.5 4 2 0 1-4 1.5 0 1 4 1.5 0 .7-4 1 0 .7 4 1 0 .5-3 .7 0 .5 3 .8 0"/>',
  wave: '<path d="M2 12c2.5-7 5-7 7.5 0s5 7 7.5 0 3.5-5 5-3"/>',
  ripple: '<path d="M4 6v12M8 6v12M12 6v12"/><path d="M15 9a4 4 0 0 1 0 6M18 7a7 7 0 0 1 0 10"/>',
  ray: '<path d="M2 8l7 2 6 6 7 2"/><rect x="8" y="5" width="8" height="14" rx="1"/>',
  stores: '<path d="M5 20V10M10 20V4M15 20v-7M20 20v-3"/>',
  efficiency: '<path d="M4 18a8 8 0 0 1 16 0"/><path d="M12 18l4-6"/>',
  heat: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/>',
  particles: '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="8" r="2.5"/><circle cx="9" cy="17" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  gas: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="9" r="1.5"/><circle cx="12" cy="15" r="1.5"/>',
  atom: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  radiation: '<circle cx="12" cy="12" r="2"/><path d="M12 10L8 3a9 9 0 0 1 8 0zM13.7 13l7.3 1a9 9 0 0 1-4 7zM10.3 13L3 14a9 9 0 0 0 4 7z"/>',
  halflife: '<path d="M4 4v16h16"/><path d="M5 6c3 0 4 6 7 8s5 3 8 3"/>',
  orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="6"/><circle cx="21" cy="11" r="1.5"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  redshift: '<path d="M3 12h4M17 12h4"/><path d="M7 12c1-4 1.5-4 2.5 0s2 4 3 0 2-4 4.5 0"/>',
  equation: '<path d="M4 7h7M7.5 3.5v7M4 17h7M14 5l6 6M20 5l-6 6M14 15h6M14 19h6"/>',
};

function toolIcon(key) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TOOL_ICONS[key] || ''}</svg>`;
}
