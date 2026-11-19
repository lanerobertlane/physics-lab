// Colour & filters. Light is treated as three bands of wavelength: blue (400–490 nm), green (490–580 nm)
// and red (580–700 nm). A filter transmits some bands and absorbs the rest; an object reflects some
// bands and absorbs the rest. What you see is whatever is left of the light after each step.

PK.header({
  title: 'Colour & filters',
  spec: [
    { code: '4.6.2.6', text: 'Each colour within the visible light spectrum has its own narrow band of wavelength and frequency', po: true },
    { code: '4.6.2.6', text: 'Specular reflection from a smooth surface in a single direction; diffuse reflection from a rough surface, which scatters the light', po: true },
    { code: '4.6.2.6', text: 'Colour filters work by absorbing certain wavelengths (and colour) and transmitting other wavelengths (and colour)', po: true },
    { code: '4.6.2.6', text: 'The colour of an opaque object depends on which wavelengths are reflected; the rest are absorbed. White reflects all wavelengths equally; black absorbs them all', po: true },
    { code: '4.6.2.6', text: 'Objects that transmit light are either transparent or translucent', po: true },
    { code: 'KS3', text: 'Colours and the different frequencies of light; white light and prisms; colour effects in absorption and diffuse reflection' },
    { code: 'KS3', text: 'Transmission of light through materials: absorption, diffuse scattering and specular reflection at a surface' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 420;
const state = { tab: 'filters' };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;

function colours() {
  return { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
// Text on the dark scenes
function label(c, text, x, y, col = '#e0e0e0', align = 'center', size = 13, weight = 800) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#11161b'; ctx.strokeText(text, x, y);
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}

// ---------- Colours as sets of bands ----------
const R = 4, G = 2, B = 1, ALL = 7;
const SETS = { none: ALL, white: ALL, red: R, green: G, blue: B, yellow: R | G, cyan: G | B, magenta: R | B, black: 0 };
const NAME = { 7: 'white', 4: 'red', 2: 'green', 1: 'blue', 6: 'yellow', 3: 'cyan', 5: 'magenta', 0: 'black' };
const SHOW = { 7: '#f5f5f5', 4: '#e53935', 2: '#43a047', 1: '#2962ff', 6: '#fdd835', 3: '#26c6da', 5: '#d81b60', 0: '#141414' };
const bandOf = (nm) => (nm < 490 ? B : nm < 580 ? G : R);
// A colour for each wavelength of the spectrum (an approximation)
function hue(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
  const k = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 680 ? 0.3 + (0.7 * (700 - nm)) / 20 : 1;
  return `rgb(${Math.round(255 * r * k)}, ${Math.round(255 * g * k)}, ${Math.round(255 * b * k)})`;
}
const glow = (x, y, r, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

// ---------- Filters and a prism ----------
function drawFilters(c) {
  const f1 = SETS[$('f1').value], f2 = SETS[$('f2').value], after1 = ALL & f1, after2 = after1 & f2;
  ctx.fillStyle = '#11161b'; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 10); ctx.fill();
  // Ray box
  ctx.fillStyle = '#546e7a'; ctx.fillRect(24, 180, 74, 60); label(c, 'ray box', 61, 258, '#b0bec5', 'center', 12, 700);
  const beam = (x1, x2, set) => { if (!set) return; ctx.strokeStyle = SHOW[set]; ctx.lineWidth = 8; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(x1, 210); ctx.lineTo(x2, 210); ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 1; };
  beam(98, 160, ALL); beam(168, 236, after1); beam(244, 364, after2);
  const filter = (x, v) => {
    if (v === 'none') { ctx.strokeStyle = '#455a64'; ctx.setLineDash([4, 4]); ctx.strokeRect(x - 4, 170, 8, 80); ctx.setLineDash([]); return; }
    ctx.fillStyle = SHOW[SETS[v]]; ctx.globalAlpha = 0.75; ctx.fillRect(x - 4, 170, 8, 80); ctx.globalAlpha = 1;
    label(c, `${v} filter`, x, 158, SHOW[SETS[v]], 'center', 12, 800);
  };
  filter(164, $('f1').value); filter(240, $('f2').value);
  // The prism splits whatever light gets through into its colours
  const apex = [400, 120], bl = [330, 300], br = [470, 300];
  ctx.fillStyle = 'rgba(200, 230, 255, .14)'; ctx.strokeStyle = '#b3e5fc'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(...apex); ctx.lineTo(...br); ctx.lineTo(...bl); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  label(c, 'prism', 400, 318, '#b3e5fc', 'center', 12, 700);
  const inX = 364, outX = 438, outY = 222, sy = (nm) => 150 + ((700 - nm) / 300) * 170;   // red at the top of the screen, violet at the bottom
  if (after2) { ctx.strokeStyle = SHOW[after2]; ctx.lineWidth = 6; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(inX, 210); ctx.lineTo(outX, outY); ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 1; }
  // Screen, with the spectrum on it
  ctx.fillStyle = '#263238'; ctx.fillRect(700, 120, 14, 230);
  let any = false;
  for (let nm = 400; nm <= 700; nm += 2) {
    if (!(bandOf(nm) & after2)) continue;
    any = true;
    ctx.strokeStyle = hue(nm); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(outX, outY); ctx.lineTo(700, sy(nm)); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = hue(nm); ctx.fillRect(700, sy(nm) - 1.2, 14, 3.4);
  }
  label(c, 'screen', 707, 108, '#b0bec5', 'center', 12, 700);
  // Wavelengths along the screen
  for (const [nm, name, col] of [[696, 'red  700 nm', '#ef5350'], [610, 'orange', '#ffa726'], [580, 'yellow', '#ffee58'], [530, 'green', '#66bb6a'], [470, 'blue', '#42a5f5'], [432, 'indigo', '#9fa8da'], [404, 'violet  400 nm', '#ce93d8']]) {
    label(c, name, 722, sy(nm), col, 'left', 12, 800);
  }
  if (!any) label(c, 'No light gets through: the screen is dark', 560, 380, '#ffcc80', 'center', 14);
}

// ---------- Coloured objects ----------
const CARDS = [['red', R], ['green', G], ['blue', B], ['yellow', R | G], ['white', ALL], ['black', 0]];
function seen(reflects) { return SETS[pressed('light')] & reflects & SETS[$('eyef').value]; }
function drawObjects(c) {
  const light = SETS[pressed('light')];
  ctx.fillStyle = '#0d1014'; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 10); ctx.fill();
  // The lamp, and its light falling on everything
  ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.moveTo(26, 20); ctx.lineTo(80, 20); ctx.lineTo(96, 58); ctx.lineTo(10, 58); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(50, 58, 500, 420); g.addColorStop(0, SHOW[light]); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.12; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(14, 58); ctx.lineTo(92, 58); ctx.lineTo(800, 420); ctx.lineTo(0, 420); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  label(c, `${NAME[light]} light`, 53, 74, SHOW[light], 'center', 12, 800);
  // A row of cards. Each is labelled with its colour in white light, and how it looks now.
  CARDS.forEach(([name, refl], i) => {
    const x = 150 + i * 106, col = SHOW[seen(refl)];
    ctx.fillStyle = col; ctx.strokeStyle = '#455a64'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, 110, 80, 90, 6); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
    label(c, `${name} card`, x + 40, 214, '#cfd8dc', 'center', 12, 800);
    label(c, `looks ${NAME[seen(refl)]}`, x + 40, 232, '#90a4ae', 'center', 11, 700);
  });
  label(c, 'Colour in white light:', 140, 96, '#90a4ae', 'left', 11, 700);
  // A strawberry: red with green leaves
  const sx = 250, sy = 320;
  ctx.fillStyle = SHOW[seen(R)]; ctx.beginPath(); ctx.moveTo(sx - 38, sy - 20); ctx.quadraticCurveTo(sx, sy - 40, sx + 38, sy - 20); ctx.quadraticCurveTo(sx + 30, sy + 40, sx, sy + 60); ctx.quadraticCurveTo(sx - 30, sy + 40, sx - 38, sy - 20); ctx.fill();
  ctx.fillStyle = SHOW[seen(G)]; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(sx + k * 14, sy - 28, 10, 5, k * 0.4, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#455a64'; ctx.lineWidth = 1;
  label(c, 'strawberry', sx, 396, '#cfd8dc', 'center', 12, 800);
  label(c, `body looks ${NAME[seen(R)]}, leaves look ${NAME[seen(G)]}`, sx, 412, '#90a4ae', 'center', 11, 700);
  // A flag: white with a red cross and blue corners
  const fx = 470, fy = 280, fw = 180, fh = 100;
  ctx.fillStyle = SHOW[seen(B)]; ctx.fillRect(fx, fy, fw, fh);
  ctx.fillStyle = SHOW[seen(ALL)]; ctx.fillRect(fx + fw / 2 - 22, fy, 44, fh); ctx.fillRect(fx, fy + fh / 2 - 22, fw, 44);
  ctx.fillStyle = SHOW[seen(R)]; ctx.fillRect(fx + fw / 2 - 12, fy, 24, fh); ctx.fillRect(fx, fy + fh / 2 - 12, fw, 24);
  ctx.strokeStyle = '#455a64'; ctx.lineWidth = 2; ctx.strokeRect(fx, fy, fw, fh); ctx.lineWidth = 1;
  label(c, 'flag: red, white and blue', fx + fw / 2, 396, '#cfd8dc', 'center', 12, 800);
  label(c, `looks ${NAME[seen(R)]}, ${NAME[seen(ALL)]} and ${NAME[seen(B)]}`, fx + fw / 2, 412, '#90a4ae', 'center', 11, 700);
  const ef = $('eyef').value;
  if (ef !== 'none') label(c, `seen through a ${ef} filter`, 790, 20, SHOW[SETS[ef]], 'right', 13, 800);
}

// ---------- Smooth, rough and see-through ----------
function drawSurfaces(c) {
  const kind = pressed('surface');
  ctx.fillStyle = '#11161b'; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 10); ctx.fill();
  const SY = 230;   // the surface
  // The surface or block
  if (kind === 'smooth') { ctx.fillStyle = '#b0bec5'; ctx.fillRect(140, SY, 520, 10); ctx.fillStyle = '#eceff1'; ctx.fillRect(140, SY, 520, 3); }
  else if (kind === 'rough' || kind === 'opaque') {
    ctx.fillStyle = kind === 'rough' ? '#eeeeee' : '#8d6e63'; ctx.beginPath(); ctx.moveTo(140, SY + 40);
    for (let x = 140; x <= 660; x += 10) ctx.lineTo(x, SY + 5 * Math.sin(x * 0.9) + 3 * Math.sin(x * 2.1));
    ctx.lineTo(660, SY + 40); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = kind === 'transparent' ? 'rgba(179, 229, 252, .25)' : 'rgba(236, 239, 241, .45)';
    ctx.fillRect(140, SY, 520, 60); ctx.strokeStyle = '#b3e5fc'; ctx.strokeRect(140, SY, 520, 60);
  }
  // Seven parallel rays coming in from the top left
  const rays = [];
  for (let i = 0; i < 7; i++) rays.push(250 + i * 45);
  const inc = Math.PI / 4;   // 45° to the normal
  ctx.lineWidth = 2.5;
  rays.forEach((hx, i) => {
    const sx = hx - 170 * Math.tan(inc), sy = SY - 170;
    ctx.strokeStyle = '#fff59d'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, SY); ctx.stroke();
    const out = (ang, len, y0 = SY, x0 = hx, col = '#fff59d') => { ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + len * Math.sin(ang), y0 + len * Math.cos(ang)); ctx.stroke(); };
    const spread = Math.sin(i * 12.9898) * 0.5 + Math.sin(i * 4.1) * 0.5;   // fixed "random" angles for each ray
    if (kind === 'smooth') out(Math.PI - inc, 170);
    else if (kind === 'rough' || kind === 'opaque') {
      if (kind === 'opaque') ctx.globalAlpha = 0.45;   // a dark surface absorbs most of it
      out(Math.PI + spread * 1.3, kind === 'opaque' ? 80 : 130); ctx.globalAlpha = 1;
    } else if (kind === 'transparent') {
      const r = Math.asin(Math.sin(inc) / 1.5);   // bends towards the normal in the glass, back again leaving it
      const x1 = hx + 60 * Math.tan(r); ctx.strokeStyle = '#fff59d'; ctx.beginPath(); ctx.moveTo(hx, SY); ctx.lineTo(x1, SY + 60); ctx.stroke();
      out(inc, 110, SY + 60, x1);
      ctx.globalAlpha = 0.25; out(Math.PI - inc, 70); ctx.globalAlpha = 1;   // a little is reflected
    } else {
      const x1 = hx + 40 + spread * 25; ctx.strokeStyle = '#fff59d'; ctx.beginPath(); ctx.moveTo(hx, SY); ctx.lineTo(x1, SY + 60); ctx.stroke();
      out(inc + spread * 0.9, 100, SY + 60, x1);
    }
  });
  ctx.lineWidth = 1;
  const NAMES = { smooth: 'smooth mirror', rough: 'rough paper', transparent: 'transparent glass', translucent: 'translucent frosted glass', opaque: 'opaque wood' };
  label(c, NAMES[kind], 400, kind === 'smooth' ? SY + 30 : SY + 80, '#cfd8dc', 'center', 14);
  label(c, 'light', 70, 70, '#fff59d', 'center', 13);
  const SAY = {
    smooth: 'Specular reflection: every ray is reflected in the same direction',
    rough: 'Diffuse reflection: the rays are scattered in all directions',
    transparent: 'The light passes straight through: you can see clearly through it',
    translucent: 'The light passes through, but it is scattered: things look blurred',
    opaque: 'No light passes through. Some is reflected (scattered); the rest is absorbed',
  };
  label(c, SAY[kind], 400, 395, '#ffcc80', 'center', 14);
}

// ---------- Words ----------

const INTRO = {
  filters: 'White light is a mixture of colours. A prism spreads them out into a spectrum. Put colour filters in the beam and see which colours get through.',
  objects: 'The colour of an object depends on which colours of light it reflects. Change the colour of the light, or look through a filter, and see how the objects change.',
  surfaces: 'Compare what happens when light hits a smooth surface, a rough one, and materials that let light through.',
};
const EXPLAIN = {
  filters: `<ul>
      <li>White light is a mixture of all the colours. Each colour has its own narrow band of <b>wavelength</b> and frequency: red light has the longest wavelength, about 700 nm, and violet the shortest, about 400 nm.</li>
      <li>A prism refracts each colour by a different amount (violet the most), so it spreads white light into a <b>spectrum</b>.</li>
      <li>A colour filter <b>transmits</b> its own colour and <b>absorbs</b> the others. A red filter lets red through; a cyan filter lets blue and green through.</li>
      <li>Two filters only let through what both of them transmit. A red filter then a green filter lets nothing through.</li>
    </ul>`,
  objects: `<ul>
      <li>An opaque object <b>reflects</b> some colours and <b>absorbs</b> the rest. We see the colours it reflects.</li>
      <li>A white object reflects all colours equally. A black object absorbs them all.</li>
      <li>In coloured light, an object can only reflect the colours that are there. A green leaf in red light has no green to reflect, so it looks black.</li>
      <li>Looking through a filter, you only see the reflected colours that the filter transmits.</li>
    </ul>`,
  surfaces: `<ul>
      <li><b>Specular reflection:</b> a smooth surface, like a mirror, reflects light in a single direction, so you see a clear image.</li>
      <li><b>Diffuse reflection:</b> a rough surface, like paper, scatters the light in all directions, so there’s no image.</li>
      <li><b>Transparent</b> materials, like glass, let light pass straight through. <b>Translucent</b> materials, like frosted glass, let light through but scatter it.</li>
      <li><b>Opaque</b> materials don’t let light through: they reflect or absorb it.</li>
    </ul>`,
};
function render() {
  if (state.tab === 'filters') {
    const v1 = $('f1').value, v2 = $('f2').value, out = SETS[v1] & SETS[v2];
    let html = `<dl class="readout"><dt>Gets through</dt><dd>${out === ALL ? 'all the colours' : out ? `${NAME[out]} light` : 'nothing'}</dd></dl>`;
    if (v1 === 'none' && v2 === 'none') html += '<p>White light goes straight to the prism, which spreads it into all the colours of the spectrum. Choose a filter.</p>';
    else {
      const lets = { yellow: 'red and green light (which we see as yellow)', cyan: 'green and blue light', magenta: 'red and blue light' };
      const parts = [v1, v2].filter((v) => v !== 'none').map((v) => `The ${v} filter transmits ${lets[v] || `${v} light`} and absorbs the rest.`);
      html += `<p>${parts.join(' ')}</p>`;
      html += out ? `<p>Only ${out === (R | G) ? 'red, orange, yellow and green' : out === (G | B) ? 'green, blue and violet' : out === (R | B) ? 'red and blue-violet' : NAME[out]} light reaches the prism, so that’s all that appears on the screen.</p>` : '<p>Nothing that the first filter lets through can get through the second one, so the screen is dark.</p>';
    }
    $('info').innerHTML = html;
  } else if (state.tab === 'objects') {
    const light = SETS[pressed('light')], ef = $('eyef').value;
    let html = `<dl class="readout"><dt>Light</dt><dd>${NAME[light]}</dd><dt>Looking through</dt><dd>${ef === 'none' ? 'no filter' : `a ${ef} filter`}</dd></dl>`;
    if (light === ALL && ef === 'none') html += '<p>In white light, each card reflects its own colour and absorbs the rest. The white card reflects every colour; the black card absorbs them all.</p>';
    else {
      const black = CARDS.filter(([, r]) => !seen(r)).map(([n]) => n);
      html += `<p>Each card can only reflect light that’s there to be reflected${ef === 'none' ? '' : ', and you only see what the filter transmits'}.</p>`;
      if (black.length) html += `<p>The ${black.join(', ')} card${black.length > 1 ? 's look' : ' looks'} black: ${black.length > 1 ? 'they reflect' : 'it reflects'} none of the light that reaches your eyes.</p>`;
      html += `<p>The white card looks ${NAME[seen(ALL)]}: it reflects all the light that falls on it.</p>`;
    }
    $('info').innerHTML = html;
  } else {
    const kind = pressed('surface');
    const SAY = {
      smooth: '<p>A smooth, shiny surface reflects all the rays at the same angle: <b>specular reflection</b>. That’s why you can see an image in a mirror.</p>',
      rough: '<p>Close up, paper is bumpy, so each ray hits it at a different angle and is reflected in a different direction: <b>diffuse reflection</b>. You can see the paper from anywhere, but there’s no image in it.</p>',
      transparent: '<p>Glass is <b>transparent</b>: the light passes straight through (bending a little at each surface), so you see clearly through it. A little is reflected.</p>',
      translucent: '<p>Frosted glass is <b>translucent</b>: light passes through, but its rough surface scatters it, so things behind it look blurred.</p>',
      opaque: '<p>Wood is <b>opaque</b>: no light gets through. A dark surface absorbs most of the light and reflects (scatters) a little.</p>',
    };
    $('info').innerHTML = SAY[kind];
  }
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = EXPLAIN[t];
  cv.setAttribute('aria-label', { filters: 'White light passing through colour filters and a prism onto a screen', objects: 'Coloured cards, a strawberry and a flag lit by a lamp', surfaces: 'Rays of light hitting different surfaces' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'filters' ? location.pathname + location.search : `#${t}`);
  render();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
for (const id of ['light', 'surface']) {
  document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll(`#${id} .chip`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
}
for (const id of ['f1', 'f2', 'eyef']) $(id).addEventListener('change', render);

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

function frame() {
  if (cv.clientWidth) {
    const c = colours();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    ({ filters: drawFilters, objects: drawObjects, surfaces: drawSurfaces })[state.tab](c);
  }
  requestAnimationFrame(frame);
}

showTab(['objects', 'surfaces'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'filters');
requestAnimationFrame(frame);
