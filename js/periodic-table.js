// Periodic table: tap an element for its atom, electronic structure, group, period and ion.

PK.header({
  title: 'Periodic table',
  answers: true,
  spec: [
    { code: '4.1.1.4', text: 'Relative atomic mass; the numbers of protons, neutrons and electrons in an atom' },
    { code: '4.1.1.7', text: 'Electronic structure: electrons occupy the lowest available energy levels (shells), shown as numbers (e.g. 2,8,1) or diagrams' },
    { code: '4.1.2.1', text: 'The periodic table: elements in order of atomic number, in groups with the same number of outer electrons' },
    { code: '4.1.2.3', text: 'Metals and non-metals: metals are on the left and towards the bottom; metals form positive ions, non-metals do not' },
    { code: '4.1.2.4', text: 'Group 0, group 1 and group 7: properties explained by the outer-shell electrons' },
    { code: 'KS3', text: 'The periodic table: groups, periods, metals and non-metals' },
  ],
  specNote: 'AQA references are to GCSE Chemistry (8462); Combined Science (8464) covers the same content. KS3 references are to the National Curriculum programme of study.',
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const state = { z: 11, colour: 'type', config: false, view: 'shells' };

// ---------- The table ----------

function cellColour(z) {
  const cat = EL.CATEGORIES[EL.category(z)];
  if (state.colour === 'type') return cat.col;
  if (state.colour === 'metal') return EL.category(z) === 'metalloid' ? '#d6d3d1' : cat.metal ? '#93c5fd' : '#fde68a';
  return '#e5e7eb';
}
function buildTable() {
  const cells = [];
  // Group numbers along the top (GCSE numbering: 1, 2, 3–7, 0)
  const gl = { 1: '1', 2: '2', 13: '3', 14: '4', 15: '5', 16: '6', 17: '7', 18: '0' };
  for (let c = 1; c <= 18; c++) cells.push(`<div class="label" style="grid-column:${c};grid-row:1">${gl[c] || ''}</div>`);
  for (let z = 1; z <= EL.count; z++) {
    const p = EL.place(z);
    const sh = EL.shells(z);
    cells.push(`<button class="cell" data-z="${z}" style="grid-column:${p.col};grid-row:${p.row + 1};background:${cellColour(z)}" aria-pressed="${z === state.z}" aria-label="${EL.Name(z)}, atomic number ${z}">
      <span class="n">${z}</span><span class="s">${EL.sym(z)}</span><span class="c">${state.config && z <= 20 ? PK.ansText(sh.join(',')) : ''}</span></button>`);
  }
  cells.push('<div class="marker" style="grid-column:3;grid-row:7">57–71</div><div class="marker" style="grid-column:3;grid-row:8">89–103</div>');
  cells.push('<div class="gap" style="grid-row:9"></div>');
  // Key
  let key = '';
  if (state.colour === 'type') key = Object.values(EL.CATEGORIES).map((c) => `<span><i style="background:${c.col}"></i>${c.name}</span>`).join('');
  if (state.colour === 'metal') key = '<span><i style="background:#93c5fd"></i>Metals</span><span><i style="background:#fde68a"></i>Non-metals</span><span><i style="background:#d6d3d1"></i>On the dividing line</span>';
  cells.push(`<div class="key" style="grid-row:2 / 5">${key}</div>`);
  $('pt').innerHTML = cells.join('');
  $('pt').style.gridTemplateRows = 'auto repeat(7, auto) 8px auto auto';
  document.querySelectorAll('#pt .cell').forEach((b) => b.addEventListener('click', () => select(Number(b.dataset.z))));
}

function select(z) {
  state.z = z;
  document.querySelectorAll('#pt .cell').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.z) === z)));
  renderInfo();
}

// ---------- Facts and explanation ----------

const neutrons = (z) => { const m = EL.mass(z); return (m % 1 ? Math.floor(m) : Math.round(m)) - z; };
function renderInfo() {
  const z = state.z, p = EL.place(z), sh = EL.shells(z), cat = EL.category(z), C = EL.CATEGORIES[cat];
  const g = EL.gcseGroup(z), q = EL.ionCharge(z), name = EL.Name(z);
  $('big').innerHTML = `<div class="tile" style="background:${cellColour(z)}"><small>${z}</small><b>${EL.sym(z)}</b><small>${EL.mass(z)}</small></div><div><h2>${name}</h2><div class="note" style="margin:2px 0 0">${C.name.replace(/ \(.*\)/, '')}</div></div>`;
  const groupText = p.group === null ? (p.period === 6 ? 'lanthanide' : 'actinide') : g !== null ? `${g}${p.group !== g ? ` (or ${p.group})` : ''}` : `${p.group} (transition metal)`;
  const ion = q === null ? (cat === 'noble' ? 'none: full outer shell' : '—') : PK.ans(`${EL.ionHtml(z, q)} (${q > 0 ? 'loses' : 'gains'} ${Math.abs(q)})`);
  $('facts').innerHTML = `
    <dt>Atomic number</dt><dd>${z}</dd>
    <dt>Relative atomic mass</dt><dd>${EL.mass(z)}</dd>
    <dt>Protons</dt><dd>${PK.ans(z)}</dd>
    <dt>Neutrons${EL.mass(z) % 1 ? ' (commonest isotope)' : ''}</dt><dd>${PK.ans(neutrons(z))}</dd>
    <dt>Electrons</dt><dd>${PK.ans(z)}</dd>
    <dt>Electronic structure</dt><dd>${PK.ans(sh.join(','))}</dd>
    <dt>Group</dt><dd>${groupText}</dd>
    <dt>Period</dt><dd>${p.period}</dd>
    <dt>Metal or non-metal?</dt><dd>${cat === 'metalloid' ? 'semi-metal' : C.metal ? 'metal' : 'non-metal'}</dd>
    <dt>Ion it forms</dt><dd>${ion}</dd>`;

  const out = sh[sh.length - 1], lines = [];
  lines.push(`<h2>Explaining ${name}’s place</h2>`);
  if (g !== null) lines.push(`<p>${PK.ans(`${name} is in <b>group ${g}</b> because it has <b>${out} electron${out > 1 ? 's' : ''}</b> in its outer shell${g === 0 && z === 2 ? ' (a full first shell holds only 2)' : ''}. It is in <b>period ${p.period}</b> because it has <b>${sh.length} shell${sh.length > 1 ? 's' : ''}</b> of electrons.`)}</p>`);
  else lines.push(`<p>${name} is in <b>period ${p.period}</b> because it has ${sh.length} shells of electrons. ${p.group === null ? 'It is one of the elements usually shown in the rows below the main table.' : 'It is a transition metal, in the central block.'}</p>`);
  if (q !== null && q > 0 && z !== 1) lines.push(`<p>${PK.ans(`It is a metal, so it reacts by <b>losing ${q} electron${q > 1 ? 's' : ''}</b> to form a <b>${EL.ionHtml(z, q)}</b> ion with a full outer shell (${sh.slice(0, -1).join(',')}).`)}</p>`);
  if (q !== null && q < 0) lines.push(`<p>${PK.ans(`It is a non-metal, so it reacts with metals by <b>gaining ${-q} electron${q < -1 ? 's' : ''}</b> to form a <b>${EL.ionHtml(z, q)}</b> ion with a full outer shell (${[...sh.slice(0, -1), 8].join(',')}). With other non-metals it shares electrons instead (covalent bonds).`)}</p>`);
  if (cat === 'noble') lines.push(`<p>${PK.ans('It has a <b>full outer shell</b>, so it is stable and very unreactive. It doesn’t need to gain, lose or share electrons, so it exists as single atoms.')}</p>`);
  if (g === 1) lines.push(`<p class="note">Going down group 1 the elements get <b>more reactive</b>: the outer electron is further from the nucleus, so it is lost more easily.</p>`);
  if (g === 7) lines.push(`<p class="note">Going down group 7 the elements get <b>less reactive</b>: the outer shell is further from the nucleus, so an electron is gained less easily.</p>`);
  if (z > 20) lines.push('<p class="note">At GCSE you only need to write electronic structures for the first 20 elements. Beyond calcium the shells fill in a more complicated way.</p>');
  $('explain').innerHTML = lines.join('');
}

// ---------- Atom diagram ----------

const cv = $('atom'), ctx = cv.getContext('2d');
const W = 800, H = 420;
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }
let spin = 0;
function draw(dt) {
  spin += dt * 0.25;
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(0, 0, W, H);
  const z = state.z, sh = EL.shells(z), n = sh.length;
  const dr = Math.min(36, 170 / (n + 0.5)), r0 = dr + 6;
  const ink = PK.cssVar('--text');
  if (state.view === 'model') {
    drawAtomModel(ctx, 400, 210, z, { r0, dr, er: n > 5 ? 3.5 : 5.5, spin });
  } else {
    // GCSE style: circles for shells, crosses for electrons, in pairs at the four points
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(400, 210, Math.min(r0 - 10, 22), 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = ink; ctx.font = `800 ${n > 5 ? 14 : 18}px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(EL.sym(z), 400, 211);
    sh.forEach((count, s) => {
      const r = r0 + s * dr;
      ctx.beginPath(); ctx.arc(400, 210, r, 0, Math.PI * 2); ctx.stroke();
      slots(count).forEach((a) => cross(400 + Math.cos(a) * r, 210 + Math.sin(a) * r, n > 5 ? 3.5 : 5));
    });
  }
  ctx.fillStyle = ink; ctx.font = `800 16px ${font()}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(EL.Name(z), 16, 14);
  ctx.font = `700 14px ${font()}`; ctx.fillStyle = PK.cssVar('--muted');
  ctx.fillText(`Electronic structure: ${PK.ansText(sh.join(','))}`, 16, 38);
  if (state.view === 'model') { ctx.fillText(`Nucleus: ${z} protons and ${neutrons(z)} neutrons`, 16, 60); }
}
// Angles for electrons in a shell: in pairs at the top, right, bottom and left
function slots(count) {
  if (count > 8) return Array.from({ length: count }, (_, i) => -Math.PI / 2 + (i / count) * Math.PI * 2);
  const base = [-Math.PI / 2, 0, Math.PI / 2, Math.PI], out = [];
  for (let i = 0; i < count; i++) {
    const pair = Math.floor(i / 2), last = i === count - 1 && i % 2 === 0;
    out.push(base[pair] + (last ? 0 : i % 2 ? 0.17 : -0.17));
  }
  return out;
}
function cross(x, y, s) {
  ctx.strokeStyle = '#1e63c6'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
}

// ---------- Controls ----------

document.querySelectorAll('#colour-by .chip').forEach((b) => b.addEventListener('click', () => {
  state.colour = b.dataset.c;
  document.querySelectorAll('#colour-by .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  buildTable(); renderInfo();
}));
document.querySelectorAll('#view .chip').forEach((b) => b.addEventListener('click', () => {
  state.view = b.dataset.v;
  document.querySelectorAll('#view .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
}));
$('show-config').addEventListener('change', (e) => { state.config = e.target.checked; buildTable(); });
window.addEventListener('pk-answers', () => { buildTable(); renderInfo(); });
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; draw(dt); requestAnimationFrame(frame); }
size(); buildTable(); renderInfo();
requestAnimationFrame(frame);

// Share: the chosen element
PK.shareState = { get: () => ({ z: state.z }), set: (o) => { if (o.z) select(o.z); } };
