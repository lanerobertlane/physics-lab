// Newton's third law pairs: scenes with force arrows; tap to find partners, or quiz yourself.

PK.header({
  title: 'Third law pairs',
  spec: [
    { code: '4.5.6.2.3', text: "Newton's third law: whenever two objects interact, the forces they exert on each other are equal and opposite" },
    { code: '4.5.1.2', text: 'Contact and non-contact forces' },
    { code: '4.5.1.3', text: 'Gravity: weight is the force acting on an object due to gravity' },
    { code: 'KS3', text: 'Forces as pushes or pulls, arising from the interaction between two objects' },
  ],
});

const $ = (id) => document.getElementById(id);
const svg = $('scene');

// ---------- Scene art helpers (colours come from CSS variables so dark mode works) ----------

const EARTH_TOP = 340;
const earth = (label = 'Earth') => `
  <circle cx="320" cy="${EARTH_TOP + 900}" r="900" style="fill: color-mix(in srgb, var(--t-energy) 30%, var(--surface)); stroke: var(--t-energy)" stroke-width="2"/>
  <text x="560" y="425" text-anchor="middle" font-size="15" font-weight="700" style="fill: var(--muted)">${label}</text>`;
// Drawings use the soft --art grey so the coloured force arrows stand out against them.
const solid = 'style="fill: var(--surface-2); stroke: var(--art)" stroke-width="2.5"';const label = (x, y, text, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="14" font-weight="700" style="fill: var(--muted)">${text}</text>`;

function personSvg(x, top, { walking = false, flip = false, arms = '' } = {}) {
  const s = flip ? -1 : 1;
  const legs = walking
    ? `<path d="M${x} ${top + 100} L${x - 30} ${top + 195} M${x} ${top + 100} L${x + 35} ${top + 195}"/>`
    : `<path d="M${x} ${top + 100} L${x - 18} ${top + 195} M${x} ${top + 100} L${x + 18} ${top + 195}"/>`;
  return `<g style="stroke: var(--art)" stroke-width="5" stroke-linecap="round" fill="none">
    <circle cx="${x}" cy="${top + 18}" r="17" ${solid}/>
    <path d="M${x} ${top + 36} L${x} ${top + 100}"/>
    ${arms || `<path d="M${x} ${top + 52} L${x + 26 * s} ${top + 80} M${x} ${top + 52} L${x - 24 * s} ${top + 82}"/>`}
    ${legs}
  </g>`;
}

// ---------- Scenes ----------
// Each force: by, on (object ids), type, mag (N), arrow (x1,y1)->(x2,y2), pair (shared id with its partner).

const SCENES = [
  {
    id: 'book', name: 'Book on a table',
    caption: 'The weight of the book and the normal contact force are equal and opposite — but they are not a third-law pair. Can you see why?',
    objects: { book: 'the book', table: 'the table', earth: 'the Earth' },
    art: () => `${earth()}
      <rect x="170" y="230" width="300" height="14" rx="3" ${solid}/>
      <rect x="190" y="244" width="12" height="104" ${solid}/>
      <rect x="438" y="244" width="12" height="104" ${solid}/>
      <rect x="250" y="194" width="130" height="36" rx="4" style="fill: color-mix(in srgb, var(--t-forces) 30%, var(--surface)); stroke: var(--art)" stroke-width="2.5"/>
      ${label(315, 217, 'Book')}
      ${label(470, 222, 'Table', 'end')}`,
    forces: [
      { id: 'w', pair: 'g', by: 'earth', on: 'book', type: 'gravitational', mag: 10, text: 'The Earth pulls the book down', a: [285, 212, 285, 287] },
      { id: 'wr', pair: 'g', by: 'book', on: 'earth', type: 'gravitational', mag: 10, text: 'The book pulls the Earth up', a: [285, 435, 285, 360] },
      { id: 'n', pair: 'n', by: 'table', on: 'book', type: 'normal contact', mag: 10, text: 'The table pushes the book up', a: [345, 230, 345, 155] },
      { id: 'nr', pair: 'n', by: 'book', on: 'table', type: 'normal contact', mag: 10, text: 'The book pushes the table down', a: [345, 237, 345, 312] },
    ],
  },
  {
    id: 'apple', name: 'Falling apple',
    caption: 'Weight and air resistance both act on the apple and are different types of force, so they can never be a pair.',
    objects: { apple: 'the apple', earth: 'the Earth', air: 'the air' },
    art: () => `${earth()}
      <g style="fill: var(--muted)" opacity=".35">
        ${[[140, 90], [190, 200], [460, 120], [500, 240], [230, 290], [420, 300], [120, 260], [540, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}
      </g>
      <path d="M310 112 l0 -18 M330 116 l0 -26 M350 112 l0 -18" style="stroke: var(--muted)" stroke-width="2" stroke-linecap="round" opacity=".6"/>
      <circle cx="320" cy="170" r="28" style="fill: color-mix(in srgb, var(--t-forces) 55%, var(--surface)); stroke: var(--art)" stroke-width="2.5"/>
      <path d="M320 142 q4 -12 12 -14" style="stroke: var(--art)" stroke-width="3" fill="none"/>
      ${label(160, 160, 'Air')}
      ${label(370, 176, 'Apple', 'start')}`,
    forces: [
      { id: 'w', pair: 'g', by: 'earth', on: 'apple', type: 'gravitational', mag: 3, text: 'The Earth pulls the apple down', a: [305, 175, 305, 265] },
      { id: 'wr', pair: 'g', by: 'apple', on: 'earth', type: 'gravitational', mag: 3, text: 'The apple pulls the Earth up', a: [305, 438, 305, 348] },
      { id: 'd', pair: 'd', by: 'air', on: 'apple', type: 'air resistance (drag)', mag: 1, text: 'The air pushes up on the apple', a: [340, 150, 340, 120] },
      { id: 'dr', pair: 'd', by: 'apple', on: 'air', type: 'air resistance (drag)', mag: 1, text: 'The apple pushes the air down', a: [345, 200, 345, 230] },
    ],
  },
  {
    id: 'walk', name: 'Walking',
    caption: 'To walk forwards, your foot pushes the ground backwards. The ground pushes you forwards with an equal and opposite friction force.',
    objects: { person: 'the person', earth: 'the Earth (ground)' },
    art: () => `${earth('Earth (ground)')}${personSvg(300, 145, { walking: true })}${label(240, 150, 'Person', 'end')}`,
    forces: [
      { id: 'f', pair: 'f', by: 'earth', on: 'person', type: 'friction', mag: 200, text: 'The ground pushes the person forwards', a: [340, 334, 385, 334] },
      { id: 'fr', pair: 'f', by: 'person', on: 'earth', type: 'friction', mag: 200, text: "The person's foot pushes the ground backwards", a: [335, 352, 290, 352] },
      { id: 'w', pair: 'g', by: 'earth', on: 'person', type: 'gravitational', mag: 600, text: 'The Earth pulls the person down', a: [300, 205, 300, 295] },
      { id: 'wr', pair: 'g', by: 'person', on: 'earth', type: 'gravitational', mag: 600, text: 'The person pulls the Earth up', a: [450, 438, 450, 348] },
      { id: 'n', pair: 'n', by: 'earth', on: 'person', type: 'normal contact', mag: 600, text: 'The ground pushes the person up', a: [262, 335, 262, 245] },
      { id: 'nr', pair: 'n', by: 'person', on: 'earth', type: 'normal contact', mag: 600, text: 'The person pushes the ground down', a: [225, 345, 225, 435] },
    ],
  },
  {
    id: 'rocket', name: 'Rocket launch',
    caption: 'The rocket pushes exhaust gas down; the gas pushes the rocket up. The thrust is bigger than the weight, so the rocket accelerates upwards.',
    objects: { rocket: 'the rocket', gas: 'the exhaust gas', earth: 'the Earth' },
    art: () => `${earth()}
      <path d="M320 40 C 345 70 350 110 350 140 L350 230 L290 230 L290 140 C 290 110 295 70 320 40 Z" ${solid}/>
      <path d="M290 190 L268 236 L290 226 Z M350 190 L372 236 L350 226 Z" ${solid}/>
      <circle cx="320" cy="120" r="11" style="fill: color-mix(in srgb, var(--t-waves) 45%, var(--surface)); stroke: var(--art)" stroke-width="2"/>
      <path d="M296 232 Q 300 290 320 325 Q 340 290 344 232 Z" style="fill: color-mix(in srgb, var(--t-electricity) 60%, var(--surface)); stroke: var(--t-electricity)" stroke-width="2"/>
      ${label(370, 110, 'Rocket', 'start')}
      ${label(370, 300, 'Exhaust gas', 'start')}`,
    forces: [
      { id: 't', pair: 't', by: 'gas', on: 'rocket', type: 'contact (thrust)', mag: 30000, text: 'The gas pushes the rocket up', a: [308, 205, 308, 130] },
      { id: 'tr', pair: 't', by: 'rocket', on: 'gas', type: 'contact (thrust)', mag: 30000, text: 'The rocket pushes the gas down', a: [308, 245, 308, 320] },
      { id: 'w', pair: 'g', by: 'earth', on: 'rocket', type: 'gravitational', mag: 20000, text: 'The Earth pulls the rocket down', a: [334, 160, 334, 210] },
      { id: 'wr', pair: 'g', by: 'rocket', on: 'earth', type: 'gravitational', mag: 20000, text: 'The rocket pulls the Earth up', a: [420, 432, 420, 382] },
    ],
  },
  {
    id: 'skaters', name: 'Ice skaters',
    caption: 'Both skaters move apart — even if only one of them does the pushing. Each one feels the same size of force.',
    objects: { a: 'skater A', b: 'skater B' },
    art: () => `
      <rect x="0" y="340" width="640" height="100" style="fill: color-mix(in srgb, var(--t-waves) 18%, var(--surface)); stroke: var(--t-waves)" stroke-width="2"/>
      ${label(560, 425, 'Ice')}
      ${personSvg(230, 145, { arms: '<path d="M230 197 L280 190 M230 197 L282 206"/>' })}
      ${personSvg(410, 145, { flip: true, arms: '<path d="M410 197 L360 190 M410 197 L358 206"/>' })}
      ${label(230, 132, 'Skater A')}
      ${label(410, 132, 'Skater B')}`,
    forces: [
      { id: 'ab', pair: 'p', by: 'a', on: 'b', type: 'contact (push)', mag: 50, text: 'Skater A pushes skater B to the right', a: [415, 250, 495, 250] },
      { id: 'ba', pair: 'p', by: 'b', on: 'a', type: 'contact (push)', mag: 50, text: 'Skater B pushes skater A to the left', a: [225, 250, 145, 250] },
    ],
  },
  {
    id: 'magnets', name: 'Two magnets',
    caption: 'Non-contact forces come in pairs too. The small magnet pulls on the big magnet just as hard as the big one pulls on it.',
    objects: { big: 'the big magnet', small: 'the small magnet' },
    art: () => `
      <rect x="80" y="200" width="110" height="60" style="fill: color-mix(in srgb, var(--t-forces) 55%, var(--surface)); stroke: var(--art)" stroke-width="2.5"/>
      <rect x="190" y="200" width="110" height="60" style="fill: color-mix(in srgb, var(--t-waves) 55%, var(--surface)); stroke: var(--art)" stroke-width="2.5"/>
      <text x="135" y="239" text-anchor="middle" font-size="24" font-weight="800" style="fill: var(--text)">N</text>
      <text x="245" y="239" text-anchor="middle" font-size="24" font-weight="800" style="fill: var(--text)">S</text>
      <rect x="380" y="210" width="70" height="40" style="fill: color-mix(in srgb, var(--t-forces) 55%, var(--surface)); stroke: var(--art)" stroke-width="2.5"/>
      <rect x="450" y="210" width="70" height="40" style="fill: color-mix(in srgb, var(--t-waves) 55%, var(--surface)); stroke: var(--art)" stroke-width="2.5"/>
      <text x="415" y="237" text-anchor="middle" font-size="18" font-weight="800" style="fill: var(--text)">N</text>
      <text x="485" y="237" text-anchor="middle" font-size="18" font-weight="800" style="fill: var(--text)">S</text>
      ${label(190, 188, 'Big magnet')}
      ${label(450, 198, 'Small magnet')}`,
    forces: [
      { id: 'sb', pair: 'm', by: 'small', on: 'big', type: 'magnetic', mag: 2, text: 'The small magnet pulls the big magnet to the right', a: [190, 300, 270, 300] },
      { id: 'bs', pair: 'm', by: 'big', on: 'small', type: 'magnetic', mag: 2, text: 'The big magnet pulls the small magnet to the left', a: [450, 300, 370, 300] },
    ],
  },
];

const state = {
  scene: SCENES[0],
  mode: 'explore',
  selected: null,       // explore: chosen force id
  quiz: null,           // { target, picked }
  score: { right: 0, total: 0 },
};

// ---------- Logic ----------

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const fmtN = (n) => (n >= 1000 ? `${n / 1000} kN` : `${n} N`);
const forceById = (id) => state.scene.forces.find((f) => f.id === id);
const partnerOf = (f) => state.scene.forces.find((g) => g.pair === f.pair && g.id !== f.id);

function direction(f) {
  const [x1, y1, x2, y2] = f.a;
  const len = Math.hypot(x2 - x1, y2 - y1);
  return { x: (x2 - x1) / len, y: (y2 - y1) / len };
}

function compare(f, g) {
  const objs = state.scene.objects;
  const d1 = direction(f), d2 = direction(g);
  const opposite = d1.x * d2.x + d1.y * d2.y < -0.99;
  const swapped = f.by === g.on && f.on === g.by;
  return [
    {
      ok: swapped,
      text: swapped
        ? `Two objects: ${objs[f.by]} on ${objs[f.on]}, and ${objs[g.by]} on ${objs[g.on]}`
        : f.on === g.on
          ? `Both forces act on ${objs[f.on]} — a pair must act on two different objects`
          : `The objects don't swap round (${objs[f.by]} → ${objs[f.on]}, ${objs[g.by]} → ${objs[g.on]})`,
    },
    { ok: f.type === g.type, text: f.type === g.type ? `Same type: both ${f.type}` : `Different types: ${f.type} and ${g.type}` },
    { ok: f.mag === g.mag, text: f.mag === g.mag ? `Equal size: both ${fmtN(f.mag)}` : `Different sizes: ${fmtN(f.mag)} and ${fmtN(g.mag)}` },
    { ok: opposite, text: opposite ? 'Opposite directions' : 'Not in opposite directions' },
  ];
}

function checksHtml(list) {
  return `<ul class="checks">${list.map((c) => `<li><span class="${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'}</span><span>${c.text}</span></li>`).join('')}</ul>`;
}

function forceCard(f, cls) {
  const objs = state.scene.objects;
  return `<div class="pair-box" style="border-left: 4px solid var(${cls})">
    <b>${f.text}</b>
    <span class="note" style="margin:0">${cap(f.type)} · ${fmtN(f.mag)} · acts on ${objs[f.on]}</span>
  </div>`;
}

// ---------- Rendering ----------

function arrow(f, colour, width, opacity) {
  const [x1, y1, x2, y2] = f.a;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const head = 16, hw = 13;
  const bx = x2 - ux * head, by = y2 - uy * head;
  const px = -uy * hw / 2, py = ux * hw / 2;
  // Label beside the arrow tip.
  const lx = x2 + (Math.abs(uy) > 0.5 ? 12 : 0), ly = y2 + (Math.abs(uy) > 0.5 ? (uy > 0 ? -4 : 12) : -12);
  const anchor = Math.abs(uy) > 0.5 ? 'start' : 'middle';
  return `<g class="force" data-id="${f.id}" opacity="${opacity}" role="button" aria-label="${f.text}">
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="30"/>
    <line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" style="stroke: ${colour}" stroke-width="${width}"/>
    <polygon points="${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}" style="fill: ${colour}"/>
    <text x="${lx}" y="${ly}" text-anchor="${anchor}" font-size="14" font-weight="800" style="fill: ${colour}">${fmtN(f.mag)}</text>
  </g>`;
}

function roleOf(f) {
  if (state.mode === 'explore') {
    if (!state.selected) return 'idle';
    const sel = forceById(state.selected);
    if (f.id === sel.id) return 'sel';
    if (f.id === partnerOf(sel).id) return 'partner';
    return 'faded';
  }
  const q = state.quiz;
  if (!q) return 'idle';
  if (f.id === q.target) return 'sel';
  if (q.picked) {
    const correct = partnerOf(forceById(q.target)).id;
    if (f.id === correct) return 'right';
    if (f.id === q.picked) return 'wrong';
    return 'faded';
  }
  return 'idle';
}

const ROLE_STYLE = {
  idle: ['var(--accent)', 5, 1],
  sel: ['var(--f2)', 6, 1],
  partner: ['var(--f3)', 6, 1],
  right: ['var(--good)', 6, 1],
  wrong: ['var(--bad)', 6, 1],
  faded: ['var(--muted)', 4, 0.25],
};

function render() {
  const s = state.scene;
  const stroke = parseFloat(PK.cssVar('--stroke')) || 1;
  svg.innerHTML = `<rect width="640" height="440" style="fill: var(--surface)"/>${s.art()}${
    s.forces.map((f) => {
      const [col, w, op] = ROLE_STYLE[roleOf(f)];
      return arrow(f, col, w * stroke, op);
    }).join('')}`;
  $('caption').textContent = s.caption;

  document.querySelectorAll('#scenes .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scene === s.id)));
  document.querySelectorAll('#mode .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));

  $('force-list').innerHTML = s.forces.map((f) => {
    const role = roleOf(f);
    const cls = { sel: 'sel', partner: 'partner', right: 'right', wrong: 'wrong' }[role] || '';
    return `<button class="force-btn ${cls}" data-id="${f.id}"><span class="dot"></span><span>${f.text}<small>${cap(f.type)} · ${fmtN(f.mag)}</small></span></button>`;
  }).join('');

  renderInfo();
}

function renderInfo() {
  const el = $('info');
  if (state.mode === 'explore') {
    if (!state.selected) {
      el.innerHTML = '<p class="note" style="margin:0">Tap any force arrow (or one from the list) to see its third-law partner.</p>';
      return;
    }
    const f = forceById(state.selected), g = partnerOf(f);
    el.innerHTML = `${forceCard(f, '--f2')}
      <p style="margin:8px 0 0; font-weight:700; text-align:center">↕ is paired with</p>
      ${forceCard(g, '--f3')}
      ${checksHtml(compare(f, g))}`;
    return;
  }

  const q = state.quiz;
  const target = forceById(q.target);
  const score = `<span class="score">Score: ${state.score.right} / ${state.score.total}</span>`;
  if (!q.picked) {
    el.innerHTML = `<p style="margin:0 0 4px"><b>Which force is the partner of the highlighted one?</b></p>
      ${forceCard(target, '--f2')}
      <p class="note">Tap an arrow or choose from the list. ${score}</p>`;
    return;
  }
  const picked = forceById(q.picked);
  const correct = partnerOf(target).id === picked.id;
  el.innerHTML = `
    <span class="badge ${correct ? 'good' : 'bad'}">${correct ? 'Correct — that’s the pair' : 'Not a third-law pair'}</span>
    ${forceCard(target, '--f2')}
    ${forceCard(picked, correct ? '--good' : '--bad')}
    ${checksHtml(compare(target, picked))}
    ${correct ? '' : `<p class="note">The real partner is shown in green: <b>${partnerOf(target).text.toLowerCase()}</b>.</p>`}
    <div class="btn-row" style="margin-top:10px; align-items:center">
      <button class="btn primary" id="next">Next question</button>${score}
    </div>`;
  $('next').addEventListener('click', nextQuestion);
}

// ---------- Interaction ----------

function choose(id) {
  if (state.mode === 'explore') {
    state.selected = state.selected === id ? null : id;
  } else {
    const q = state.quiz;
    if (q.picked || id === q.target) return;
    q.picked = id;
    state.score.total += 1;
    if (partnerOf(forceById(q.target)).id === id) state.score.right += 1;
  }
  render();
}

function nextQuestion() {
  // Pick a scene with enough forces to make it a real question, then a random force in it.
  const pool = SCENES.filter((s) => s.forces.length >= 4);
  const prev = state.quiz && state.quiz.target;
  let scene = state.scene.forces.length >= 4 && Math.random() < 0.5 ? state.scene : pool[Math.floor(Math.random() * pool.length)];
  let target;
  do { target = scene.forces[Math.floor(Math.random() * scene.forces.length)].id; } while (scene === state.scene && target === prev && scene.forces.length > 1);
  state.scene = scene;
  state.quiz = { target, picked: null };
  render();
}

svg.addEventListener('click', (e) => {
  const g = e.target.closest('.force');
  if (g) choose(g.dataset.id);
});

$('force-list').addEventListener('click', (e) => {
  const b = e.target.closest('.force-btn');
  if (b) choose(b.dataset.id);
});

$('scenes').innerHTML = SCENES.map((s) => `<button class="btn" data-scene="${s.id}" aria-pressed="false">${s.name}</button>`).join('');
$('scenes').addEventListener('click', (e) => {
  const b = e.target.closest('[data-scene]');
  if (!b) return;
  state.scene = SCENES.find((s) => s.id === b.dataset.scene);
  state.selected = null;
  if (state.mode === 'quiz') {
    const forces = state.scene.forces;
    state.quiz = { target: forces[Math.floor(Math.random() * forces.length)].id, picked: null };
  }
  history.replaceState(null, '', '#scene=' + state.scene.id);
  render();
});

document.querySelectorAll('#mode .chip').forEach((b) => b.addEventListener('click', () => {
  state.mode = b.dataset.mode;
  state.selected = null;
  if (state.mode === 'quiz') {
    state.score = { right: 0, total: 0 };
    const forces = state.scene.forces;
    state.quiz = { target: forces[Math.floor(Math.random() * forces.length)].id, picked: null };
  }
  render();
}));

window.addEventListener('pk-theme', render);

const fromHash = new URLSearchParams(location.hash.slice(1)).get('scene');
state.scene = SCENES.find((s) => s.id === fromHash) || SCENES[0];
render();
