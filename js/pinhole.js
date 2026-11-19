// Pinhole camera & the eye (KS3).
// Pinhole camera: rays from the top and bottom of a candle cross at the hole, so the image is upside
// down. A big hole lets each point spread into a patch (bright but blurred); a lens in the hole brings
// each point back together (bright and sharp, when the screen is in the right place).
// The eye: the cornea and lens focus light on the retina. The lens gets thicker to focus on near
// things, and the iris makes the pupil bigger in dim light.

PK.header({
  title: 'Pinhole camera & the eye',
  spec: [
    { code: 'KS3', text: 'Use of the ray model to explain imaging in the pinhole camera' },
    { code: 'KS3', text: 'The action of a convex lens in focusing (qualitative); the human eye' },
    { code: 'KS3', text: 'Light transferring energy from source to absorber, leading to chemical and electrical effects; photo-sensitive material in the retina and in cameras' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 420, AX = 220;   // AX: the height of the axis through the middle
const state = { tab: 'camera' };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const RAY = '#ffb300';

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800, halo = c.surface) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
const rayLine = (x1, y1, x2, y2, col, w = 1.8, a = 1) => { ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 1; };
// A candle with its base at (x, AX + 60) and its flame tip at (x, AX − 60). s < 0 draws it upside down.
function candle(x, y, s, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#eceff1'; ctx.fillRect(x - 8 * Math.abs(s), y - 30 * s, 16 * Math.abs(s), 90 * s);
  ctx.fillStyle = '#ffb300'; ctx.beginPath(); ctx.ellipse(x, y - 44 * s, 7 * Math.abs(s), 16 * Math.abs(s), 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.ellipse(x, y - 40 * s, 3 * Math.abs(s), 8 * Math.abs(s), 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}
// Blur by drawing several faint copies spread over a radius (canvas filters don't work on every iPad)
function blurred(r, fn, alpha) {
  if (r < 0.8) { fn(0, 0, alpha); return; }
  const n = 12;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; fn(r * Math.cos(a), r * Math.sin(a), (alpha * 2.2) / n); }
}

// ---------- Pinhole camera ----------
// 10 px is 1 cm. The candle is 12 cm tall; u is its distance from the hole, v the camera's length.
const PH = 420, F = 90;   // the hole, and the focal length of the lens
const cam = { u: 260, v: 150 };
const holeHalf = () => (pressed('hole') === 'small' ? 1.5 : 10);
// Where the lens would form a sharp image (px behind the hole), or null with no lens
const lensImage = () => (pressed('hole') === 'lens' && cam.u > F ? 1 / (1 / F - 1 / cam.u) : null);
// How blurred the image on the screen is (px): each point of the candle makes a patch this wide
function blurCam() {
  const hh = holeHalf(), vi = lensImage();
  if (vi) return (2 * hh * Math.abs(cam.v - vi)) / vi;
  return (2 * hh * (cam.u + cam.v)) / cam.u;
}
function drawCamera(c) {
  const xo = PH - cam.u, xs = PH + cam.v, hh = holeHalf(), vi = lensImage(), kind = pressed('hole');
  // Bench
  ctx.fillStyle = c.surface2; ctx.fillRect(20, AX + 70, 760, 10);
  candle(xo, AX, 1);
  tag(c, 'candle', xo, AX + 96, c.text, 'center', 13);
  tag(c, '⇔ drag', xo, AX + 114, c.muted, 'center', 11, 700);
  // The camera: a box with a hole in the front and tracing paper at the back
  ctx.fillStyle = PK.isDark() ? '#263238' : '#cfd8dc'; ctx.fillRect(PH, 112, cam.v, 6); ctx.fillRect(PH, 322, cam.v, 6);
  ctx.fillStyle = '#37474f'; ctx.fillRect(PH - 4, 112, 8, AX - hh - 112); ctx.fillRect(PH - 4, AX + hh, 8, 328 - AX - hh);
  ctx.fillStyle = 'rgba(255, 248, 225, .9)'; ctx.fillRect(xs - 3, 112, 6, 216);
  if (kind === 'lens') { ctx.fillStyle = 'rgba(179, 229, 252, .8)'; ctx.beginPath(); ctx.ellipse(PH, AX, 5, hh + 1, 0, 0, Math.PI * 2); ctx.fill(); }
  // Rays from the flame tip and the base of the candle
  for (const [oy, col] of [[AX - 60, RAY], [AX + 60, '#90a4ae']]) {
    for (const hy of hh > 3 ? [AX - hh, AX + hh] : [AX]) {
      let sy;
      if (vi) { const iy = AX - ((oy - AX) * vi) / cam.u; sy = hy + ((iy - hy) * cam.v) / vi; }
      else sy = hy + ((hy - oy) * cam.v) / cam.u;
      rayLine(xo, oy, PH, hy, col, 1.6, 0.9); rayLine(PH, hy, xs, sy, col, 1.6, 0.9);
    }
  }
  tag(c, kind === 'lens' ? 'lens' : 'hole', PH, 96, c.text, 'center', 13);
  tag(c, 'tracing paper', xs, 98, c.text, 'center', 13);
  tag(c, '⇔ drag', xs, 344, c.muted, 'center', 11, 700);
  // Distances
  tag(c, `${(cam.u / 10).toFixed(0)} cm`, (xo + PH) / 2, AX + 96, c.muted, 'center', 12, 700);
  tag(c, `${(cam.v / 10).toFixed(0)} cm`, (PH + xs) / 2, 344, c.muted, 'center', 12, 700);
  // What you see on the tracing paper, looking at it from behind
  const bx = 640, by = 40, bw = 150, bh = 130;
  ctx.fillStyle = '#1b1d20'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = c.border; ctx.strokeRect(bx, by, bw, bh);
  tag(c, 'On the tracing paper', bx + bw / 2, by + bh + 12, c.text, 'center', 12, 800);
  const m = (vi ? Math.min(vi, 1e4) : cam.v) / cam.u, bright = kind === 'small' ? 0.32 : 1;
  ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  blurred(Math.min(14, blurCam() * 0.6), (dx, dy, a) => candle(bx + bw / 2 + dx, by + bh / 2 + dy, -Math.min(1.1, m), a), bright);
  ctx.restore();
}

// ---------- The eye ----------
const EC = 540, ER = 125, LENS = 452, RET = 660;   // the eye's centre and radius, the lens, and the retina on the axis
function eyeOptics() {
  const near = pressed('dist') === 'near', u = near ? 330 : 1e5, v = RET - LENS;
  const fRelaxed = v;   // a relaxed eye focuses far-away things on the retina
  const f = $('focus').checked ? 1 / (1 / u + 1 / v) : fRelaxed;
  const vi = u > f ? 1 / (1 / f - 1 / u) : 1e5;
  const pupil = pressed('lightlvl') === 'dim' ? 22 : 8;
  return { near, u, v, f, vi, pupil, blur: (2 * pupil * Math.abs(vi - v)) / vi };
}
function drawEye(c) {
  const o = eyeOptics();
  // Eyeball, retina and optic nerve
  ctx.fillStyle = PK.isDark() ? '#2b3238' : '#f5f5f5'; ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(EC, AX, ER, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffcdd2'; ctx.fillRect(EC + ER - 4, AX - 14, 120, 28); ctx.strokeRect(EC + ER - 4, AX - 14, 120, 28);
  ctx.strokeStyle = '#e57373'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(EC, AX, ER - 4, -1.1, 1.1); ctx.stroke(); ctx.lineWidth = 1;
  // Cornea: the clear bulge at the front
  ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(EC - ER + 46, AX, 60, Math.PI * 0.72, Math.PI * 1.28); ctx.stroke(); ctx.lineWidth = 1;
  // Iris, with the pupil between
  ctx.fillStyle = '#6d4c41'; ctx.fillRect(438, AX - 58, 8, 58 - o.pupil); ctx.fillRect(438, AX + o.pupil, 8, 58 - o.pupil);
  // Lens: thicker when it's focusing on something close
  const thick = 8 + 14 * ((o.v / o.f) - 1) * 1.2;
  ctx.fillStyle = 'rgba(179, 229, 252, .85)'; ctx.strokeStyle = '#0288d1'; ctx.beginPath(); ctx.ellipse(LENS, AX, Math.max(6, thick), 42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // The thing being looked at, and rays from its top
  let src;
  if (o.near) {
    const bxp = LENS - o.u;
    ctx.fillStyle = '#5c6bc0'; ctx.fillRect(bxp - 10, AX - 50, 20, 100);
    ctx.fillStyle = '#fff'; for (let k = 0; k < 5; k++) ctx.fillRect(bxp - 6, AX - 40 + k * 18, 12, 3);
    tag(c, 'book, close up', bxp, AX + 70, c.text, 'center', 13);
    src = () => [bxp, AX - 50];
  } else {
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(36, AX - 6, 6, 24); ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(39, AX - 16, 14, 0, Math.PI * 2); ctx.fill();
    tag(c, 'tree, far away', 40, AX + 34, c.text, 'center', 13);
    src = (hy) => [70, hy - 0.08 * (LENS - 70)];
  }
  // Each ray goes through the pupil, is focused by the cornea and lens, and goes on to the retina
  const iy = o.near ? AX + (50 * Math.min(o.vi, 1e4)) / o.u : AX + 0.08 * Math.min(o.vi, 1e4);
  for (const hy of [AX - o.pupil + 2, AX, AX + o.pupil - 2]) {
    const [sx, sy] = src(hy);
    rayLine(sx, sy, LENS, hy, RAY, 1.8);
    const k = (RET - LENS) / Math.min(o.vi, 1e4), ry = hy + (iy - hy) * k;
    rayLine(LENS, hy, RET, ry, RAY, 1.8);
  }
  // Labels
  tag(c, 'cornea', EC - ER - 18, AX - 78, c.text, 'right', 12);
  tag(c, 'iris', 442, AX - 74, c.text, 'center', 12);
  tag(c, 'pupil', 400, AX + 6, c.muted, 'right', 12, 700);
  tag(c, 'lens', LENS, AX + 58, c.text, 'center', 12);
  tag(c, 'retina', EC + 92, AX - 104, '#e57373', 'center', 12);
  tag(c, 'optic nerve', 730, AX + 32, c.text, 'center', 12);
  // What lands on the retina
  const bx = 640, by = 300, bw = 150, bh = 100;
  ctx.fillStyle = '#1b1d20'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = c.border; ctx.strokeRect(bx, by, bw, bh);
  tag(c, 'The image on the retina', bx + bw / 2, by - 12, c.text, 'center', 12, 800);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  const alpha = pressed('lightlvl') === 'dim' ? 0.7 : 1;
  blurred(Math.min(16, o.blur * 0.7), (dx, dy, a) => {
    ctx.globalAlpha = a;
    const cx = bx + bw / 2 + dx, cy = by + bh / 2 + dy;
    if (o.near) { ctx.fillStyle = '#5c6bc0'; ctx.fillRect(cx - 10, cy - 34, 20, 68); ctx.fillStyle = '#fff'; for (let k = 0; k < 5; k++) ctx.fillRect(cx - 6, cy + 26 - k * 13, 12, 2); }
    else { ctx.fillStyle = '#6d4c41'; ctx.fillRect(cx - 4, cy - 28, 8, 26); ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(cx, cy + 12, 22, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }, alpha);
  ctx.restore();
  tag(c, 'upside down', bx + bw / 2, by + bh + 12, c.muted, 'center', 11, 700);
}

// ---------- Words ----------

const INTRO = {
  camera: 'A pinhole camera is a box with a tiny hole in the front and tracing paper at the back. Light from the candle travels in straight lines through the hole and makes an image on the tracing paper.',
  eye: 'Your eye works like a camera. The cornea and lens focus the light to make an image on the retina, which sends signals to your brain.',
};
const EXPLAIN = {
  camera: `<ul>
      <li>Light travels in <b>straight lines</b>. Rays from the top of the candle go down through the hole, and rays from the bottom go up, so they cross over: the image is <b>upside down</b>.</li>
      <li>A <b>small hole</b> lets light from each point of the candle reach just one place on the screen, so the image is sharp, but dim.</li>
      <li>A <b>big hole</b> lets in more light, so the image is brighter, but light from each point spreads into a patch, so it’s blurred.</li>
      <li>A <b>convex lens</b> refracts (bends) the light from each point back together, so the image is bright <b>and</b> sharp, but only when the screen is the right distance away: it has to be focused.</li>
      <li>Moving the candle closer, or making the camera longer, makes the image bigger.</li>
    </ul>`,
  eye: `<ul>
      <li>The <b>cornea</b> and the <b>lens</b> refract light so that it’s focused on the <b>retina</b> at the back of the eye.</li>
      <li>The lens changes shape: it gets <b>thicker</b> to focus on near things and <b>thinner</b> for things far away.</li>
      <li>The <b>iris</b> controls the size of the <b>pupil</b>: it opens wider in dim light to let more light in, and closes up in bright light.</li>
      <li>The retina has cells that are sensitive to light. The light’s energy causes chemical changes in them, which make <b>electrical signals</b> that travel along the <b>optic nerve</b> to the brain.</li>
      <li>The image on the retina is upside down; your brain turns it the right way up.</li>
      <li>A camera works in the same way: the aperture is like the pupil, its lens is like the cornea and lens, and the film or sensor is like the retina.</li>
    </ul>`,
};
function render() {
  if (state.tab === 'camera') {
    const kind = pressed('hole'), vi = lensImage(), sharp = blurCam() < 6, m = cam.v / cam.u;
    const size = (12 * m).toFixed(1);
    let html = `<dl class="readout"><dt>Candle to hole</dt><dd>${(cam.u / 10).toFixed(0)} cm</dd><dt>Length of the camera</dt><dd>${(cam.v / 10).toFixed(0)} cm</dd><dt>Image</dt><dd>upside down, about ${size} cm tall</dd><dt>Brightness</dt><dd>${kind === 'small' ? 'dim' : 'bright'}</dd><dt>Sharpness</dt><dd>${sharp ? 'sharp' : 'blurred'}</dd></dl>`;
    if (kind === 'small') html += '<p>Through a tiny hole, light from each point of the candle reaches just one place, so the image is sharp. But not much light gets in, so it’s dim.</p>';
    else if (kind === 'big') html += '<p>Through a big hole, light from each point spreads into a patch, and the patches overlap: the image is brighter but blurred. Try adding a lens.</p>';
    else html += sharp ? '<p>The lens focuses the light from each point to a point on the tracing paper: the image is bright and sharp.</p>'
      : `<p>The lens focuses the light ${vi && vi < cam.v ? 'in front of' : 'behind'} the tracing paper, so the image is blurred. Drag the back of the camera ${vi && vi < cam.v ? 'nearer the lens' : 'further back'} to focus it.</p>`;
    html += `<p>The image is ${m < 1 ? 'smaller than' : m > 1.05 ? 'bigger than' : 'about the same size as'} the candle. Move the candle closer, or make the camera longer, to make it bigger.</p>`;
    $('info').innerHTML = html;
  } else {
    const o = eyeOptics(), sharp = o.blur < 4;
    let html = `<dl class="readout"><dt>Looking at</dt><dd>${o.near ? 'a book close up' : 'a tree far away'}</dd><dt>Lens</dt><dd>${o.f < o.v - 5 ? 'thicker' : 'thin (relaxed)'}</dd><dt>Pupil</dt><dd>${pressed('lightlvl') === 'dim' ? 'wide open' : 'small'}</dd><dt>Image</dt><dd>${sharp ? 'sharp' : 'blurred'}</dd></dl>`;
    if (sharp) html += `<p>The cornea and lens focus the light on the retina, so the image is sharp. ${o.near ? 'To focus on something this close, the lens has become thicker, so it bends the light more.' : 'Light from far away needs less bending, so the lens is thin.'}</p>`;
    else html += '<p>The lens can’t change shape, so the light from the book isn’t focused by the time it reaches the retina: the image is blurred. Let the lens change shape to focus it.</p>';
    html += pressed('lightlvl') === 'dim' ? '<p>It’s dim, so the iris has made the pupil bigger to let in more light.</p>' : '<p>It’s bright, so the iris has made the pupil small.</p>';
    $('info').innerHTML = html;
  }
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = EXPLAIN[t];
  cv.setAttribute('aria-label', t === 'camera' ? 'A candle and a pinhole camera, with rays of light' : 'A cut-away of the eye, with rays of light focused on the retina');
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'camera' ? location.pathname + location.search : `#${t}`);
  render();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
for (const id of ['hole', 'dist', 'lightlvl']) {
  document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll(`#${id} .chip`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
}
$('focus').addEventListener('change', render);

// Drag the candle or the back of the camera (snapping to whole centimetres)
PK.dragOn(cv, W, H, {
  hit: (p) => {
    if (state.tab !== 'camera') return null;
    if (Math.abs(p.x - (PH - cam.u)) < 24 && p.y > AX - 70 && p.y < AX + 120) return 'candle';
    if (Math.abs(p.x - (PH + cam.v)) < 16 && p.y > 100 && p.y < 350) return 'back';
    return null;
  },
  move: (k, p) => {
    if (k === 'candle') cam.u = Math.min(380, Math.max(100, Math.round((PH - p.x) / 10) * 10));
    else cam.v = Math.min(330, Math.max(60, Math.round((p.x - PH) / 10) * 10));
    render();
  },
});

// The candle and camera go in a shared link
PK.shareState = { get: () => ({ u: cam.u, v: cam.v }), set: (o) => { if (Number.isFinite(o.u)) cam.u = Math.min(380, Math.max(100, o.u)); if (Number.isFinite(o.v)) cam.v = Math.min(330, Math.max(60, o.v)); render(); } };

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
    if (state.tab === 'camera') drawCamera(c); else drawEye(c);
  }
  requestAnimationFrame(frame);
}

showTab(PK.initialHash === '#eye' ? 'eye' : 'camera');
requestAnimationFrame(frame);
