// Generators, loudspeakers & microphones (HT, Physics only).
// Alternator & dynamo: a coil turns in a uniform field. Its long sides cut across the field lines, so
// a p.d. is induced: V = N B A ω cos θ. Slip rings keep each end on the same brush (a.c.); a split-ring
// commutator swaps the ends every half turn, just as the p.d. reverses (d.c., still rising and falling).
// Loudspeaker: an alternating current in a coil in a magnet's field feels a force that keeps reversing
// (the motor effect), so the coil and cone vibrate and push the air into compressions and rarefactions.
// Microphone: the reverse. Sound pushes a diaphragm and coil to and fro in a field, inducing a p.d.
// (the generator effect) that varies like the sound.

PK.header({
  title: 'Generators, loudspeakers & microphones',
  answers: true,
  spec: [
    { code: '4.7.3.1', text: 'Induced potential: a p.d. is induced across a conductor that moves relative to a magnetic field (the generator effect)', po: true, ht: true },
    { code: '4.7.3.2', text: 'Uses of the generator effect: alternators generate a.c. and dynamos generate d.c.; graphs of potential difference against time', po: true, ht: true },
    { code: '4.7.3.3', text: 'Microphones use the generator effect to convert the pressure variations in sound waves into variations in current', po: true, ht: true },
    { code: '4.7.2.4', text: 'Loudspeakers and headphones use the motor effect to convert variations in current into the pressure variations in sound waves', po: true, ht: true },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 420;
const state = { tab: 'gen', t: 0 };
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const RED = '#d84315', BLUE = '#1565c0', COPPER = '#c98b2b';

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800, halo = c.surface) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
function pointer(x1, y1, x2, y2, col, w = 2.5) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h, y2 - Math.sin(a) * h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(a - 0.45) * h * 1.3, y2 - Math.sin(a - 0.45) * h * 1.3);
  ctx.lineTo(x2 - Math.cos(a + 0.45) * h * 1.3, y2 - Math.sin(a + 0.45) * h * 1.3); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1;
}
// An oscilloscope screen showing the last few seconds of a trace (newest on the right)
function scope(c, x, y, w, h, trace, now, span, vmax, label, unitText) {
  ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.roundRect(x - 10, y - 10, w + 20, h + 46, 10); ctx.fill();
  ctx.fillStyle = '#0d1a14'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(143, 217, 168, .18)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 1; i < 8; i++) { ctx.moveTo(x + (w * i) / 8, y); ctx.lineTo(x + (w * i) / 8, y + h); }
  for (let i = 1; i < 6; i++) { ctx.moveTo(x, y + (h * i) / 6); ctx.lineTo(x + w, y + (h * i) / 6); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(143, 217, 168, .45)'; ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = '#8fd9a8'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
  trace.forEach((p, i) => { const px = x + w - ((now - p.t) / span) * w, py = y + h / 2 - (p.v / vmax) * (h / 2); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.stroke(); ctx.restore();
  tag(c, label, x + w / 2, y + h + 16, '#cfd8dc', 'center', 12, 700, null);
  tag(c, unitText, x + w / 2, y + h + 31, '#90a4ae', 'center', 11, 600, null);
}

// ---------- Alternator & dynamo ----------
// A 10 cm × 10 cm coil in a 0.2 T field: peak p.d. = N B A ω = N × 0.2 × 0.01 × 2π f
const B = 0.2, AREA = 0.01, CX = 250, CY = 200, HALF = 82;
const gen = { theta: 0, spin: true, omega: 0, trace: [], dragging: false, dragW: 0 };
const peakFor = (omega) => PK.num('turns') * B * AREA * omega;
const omegaSet = () => 2 * Math.PI * PK.num('speed');
// The p.d. across the coil is biggest when its sides cut straight across the field (cos θ = ±1)
const coilPD = () => peakFor(gen.omega) * Math.cos(gen.theta);
const outputPD = () => (pressed('gtype') === 'dyn' ? Math.abs(coilPD()) : coilPD());
function stepGen(dt) {
  if (gen.spin) gen.omega = omegaSet();
  else if (!gen.dragging) gen.omega *= Math.max(0, 1 - dt * 6);   // let go: it slows to a stop
  if (!gen.dragging) gen.theta += gen.omega * dt;
  gen.trace.push({ t: state.t, v: outputPD() });
  while (gen.trace.length && gen.trace[0].t < state.t - 4) gen.trace.shift();
}
function drawGen(c) {
  const th = gen.theta, cos = Math.cos(th), sin = Math.sin(th), dyn = pressed('gtype') === 'dyn';
  // The magnet's poles, and the field between them
  ctx.fillStyle = RED; ctx.fillRect(130, 34, 240, 52); ctx.fillStyle = BLUE; ctx.fillRect(130, 314, 240, 52);
  tag(c, 'N', 250, 60, '#fff', 'center', 26, 800, null); tag(c, 'S', 250, 340, '#fff', 'center', 26, 800, null);
  ctx.globalAlpha = 0.45;
  for (let x = 146; x <= 356; x += 30) pointer(x, 92, x, 308, PK.isDark() ? '#90a4ae' : '#78909c', 1.5);
  ctx.globalAlpha = 1;
  tag(c, 'magnetic', 124, 192, c.muted, 'right', 12, 700); tag(c, 'field', 124, 208, c.muted, 'right', 12, 700);
  // The coil turns about a horizontal axle. Seen from the front, its height shrinks as it turns
  // edge-on. The side nearer to you is drawn in front, brighter.
  const yA = CY - HALF * cos, yB = CY + HALF * cos;   // side A (with the dot) and side B
  const nearA = sin < 0, turns = 3;
  const side = (y, near) => {
    ctx.strokeStyle = near ? '#e0a040' : '#8a5a1a'; ctx.lineWidth = near ? 4 : 3;
    for (let k = 0; k < turns; k++) { ctx.beginPath(); ctx.moveTo(160, y + (k - 1) * 3 * Math.sign(cos || 1)); ctx.lineTo(340, y + (k - 1) * 3 * Math.sign(cos || 1)); ctx.stroke(); }
  };
  const ends = () => { ctx.strokeStyle = '#b07a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(160, yA); ctx.lineTo(160, yB); ctx.moveTo(340, yA); ctx.lineTo(340, yB); ctx.stroke(); };
  if (nearA) { side(yB, false); ends(); side(yA, true); } else { side(yA, false); ends(); side(yB, true); }
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(250, yA, 6, 0, Math.PI * 2); ctx.fill();   // a dot to follow one side round
  ctx.lineWidth = 1;
  // Axle, then slip rings or a split-ring commutator, with brushes
  ctx.fillStyle = '#90a4ae'; ctx.fillRect(340, CY - 5, 140, 10);
  ctx.strokeStyle = c.text; ctx.lineWidth = 2;
  if (!dyn) {
    for (const x of [400, 446]) {
      ctx.fillStyle = COPPER; ctx.fillRect(x - 8, CY - 24, 16, 48);
      ctx.fillStyle = '#424242'; ctx.fillRect(x - 7, CY + 26, 14, 16);   // carbon brush, pressing up
      ctx.beginPath(); ctx.moveTo(x, CY + 42); ctx.lineTo(x, x === 400 ? 398 : 388); ctx.lineTo(x === 400 ? 620 : 680, x === 400 ? 398 : 388); ctx.lineTo(x === 400 ? 620 : 680, 318); ctx.stroke();
    }
    tag(c, 'slip rings', 423, CY - 40, c.text, 'center', 12, 800);
  } else {
    // Two halves of a ring; the gap turns with the coil
    ctx.fillStyle = COPPER; ctx.fillRect(404, CY - 24, 36, 48);
    const gapY = CY - 22 * sin;
    ctx.fillStyle = '#263238'; ctx.fillRect(404, gapY - 2, 36, 4);
    ctx.fillStyle = '#424242'; ctx.fillRect(415, CY - 42, 14, 16); ctx.fillRect(415, CY + 26, 14, 16);
    ctx.beginPath(); ctx.moveTo(422, CY - 42); ctx.lineTo(422, CY - 58); ctx.lineTo(500, CY - 58); ctx.lineTo(500, 398); ctx.lineTo(620, 398); ctx.lineTo(620, 318); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(422, CY + 42); ctx.lineTo(422, 388); ctx.lineTo(680, 388); ctx.lineTo(680, 318); ctx.stroke();
    tag(c, 'split-ring commutator', 422, CY - 72, c.text, 'center', 12, 800);
  }
  ctx.lineWidth = 1;
  tag(c, dyn ? 'brushes' : 'brushes', dyn ? 470 : 423, dyn ? CY + 34 : CY + 58, c.muted, dyn ? 'left' : 'center', 11, 700);
  if (!gen.spin && !gen.dragging) tag(c, '↕ drag the coil', 250, 384, c.muted, 'center', 12, 700);
  // Oscilloscope
  const gain = Number(pressed('ygain'));   // volts per square, chosen like the Y-gain knob on a real oscilloscope
  scope(c, 528, 52, 252, 230, gen.trace, state.t, 4, 3 * gain, 'p.d. across the output', `${gain} V per square · 0.5 s per square`);
  tag(c, dyn ? 'd.c.' : 'a.c.', 740, 360, c.text, 'center', 22, 800);
}

// ---------- Loudspeaker and microphone ----------
// The current is shown as orange dots flowing along the wires and round the coil, like the circuit
// builder's conventional current. They move with the current and turn round when it reverses.
const FLOW = '#ff9800';
let flow = 0;   // how far the dots have moved along (px)
function dotsAlong(pts, offset) {
  const lens = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
  ctx.fillStyle = FLOW;
  for (let s = ((offset % 16) + 16) % 16; s < total; s += 16) {
    let dd = s, i = 0;
    while (i < lens.length - 1 && dd > lens[i]) { dd -= lens[i]; i++; }
    const f = lens[i] ? dd / lens[i] : 0;
    ctx.beginPath(); ctx.arc(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f, 3, 0, Math.PI * 2); ctx.fill();
  }
}
// The sound is shown slowed right down. On the screen, 112 px is 1 m of air and sound moves at 120 px/s,
// so a sound of frequency f is drawn with wavelength (330 ÷ f) m and frequency f × 0.00325 Hz.
const PXM = 112, VVIS = 120;
const visF = (f) => (f * VVIS) / (330 * PXM);
const snd = { start: 0, trace: [] };   // when the sound started, and the microphone's trace
const loudness = () => Number(pressed(state.tab === 'speaker' ? 'sloud' : 'mloud'));
const freq = () => PK.num(state.tab === 'speaker' ? 'sfreq' : 'mfreq');
// How far the air (and the cone) moves. It's in step with the wavelength, so the compressions look
// equally squashed at any frequency, for the same loudness. Capped so low notes don't swing too far.
const swing = () => Math.min(18, loudness() * 0.04 * (VVIS / visF(freq())));
// Air displacement at x (px), for a sound leaving a source at x0. Nothing until the sound has got there.
function airShift(x, x0) {
  const t = state.t - snd.start, dist = x - x0;
  if (dist < 0 || dist > VVIS * t) return 0;
  const fv = visF(freq()), k = (2 * Math.PI * fv) / VVIS;
  return swing() * Math.sin(2 * Math.PI * fv * t - k * dist);
}
function drawAir(c, x0, x1, src) {
  ctx.fillStyle = PK.isDark() ? '#90a4ae' : '#607d8b'; ctx.beginPath();
  for (let x = x0; x <= x1; x += 12) {
    const px = x + airShift(x, src);
    for (let y = 70; y <= 350; y += 14) { ctx.moveTo(px + 2.4, y); ctx.arc(px, y, 2.4, 0, Math.PI * 2); }
  }
  ctx.fill();
}
// The magnet and coil, shown cut in half. dir = 1: facing right (loudspeaker); −1: facing left (microphone).
function drawMagnetCoil(c, ox, d, current, dir) {
  const X = (x) => ox + dir * x;   // x measured from the back of the magnet towards its front
  const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.min(X(x), X(x + w)), y, w, h); };
  rect(0, 150, 20, 120, '#455a64');                       // back plate
  rect(20, 150, 86, 22, BLUE); rect(20, 248, 86, 22, BLUE);
  // The coil: three loops wound round the end of the N pole, on a tube that moves with the cone or
  // diaphragm. The back of each loop is behind the pole, and the front is drawn over it.
  const loops = [0, 1, 2].map((i) => X(70 + d + i * 15)), back = dir > 0 ? [Math.PI / 2, (3 * Math.PI) / 2] : [-Math.PI / 2, Math.PI / 2];
  ctx.strokeStyle = '#8a5a1a'; ctx.lineWidth = 3;
  for (const x of loops) { ctx.beginPath(); ctx.ellipse(x, 210, 7, 38, 0, back[0], back[1]); ctx.stroke(); }
  rect(20, 194, 86, 32, RED);
  tag(c, 'N', X(50), 210, '#fff', 'center', 15, 800, null); tag(c, 'S', X(50), 161, '#fff', 'center', 12, 800, null); tag(c, 'S', X(50), 259, '#fff', 'center', 12, 800, null);
  // The field across the gaps, from N out to S
  ctx.globalAlpha = 0.6;
  for (const x of [74, 92]) { pointer(X(x), 192, X(x), 176, '#78909c', 1.5); pointer(X(x), 228, X(x), 244, '#78909c', 1.5); }
  ctx.globalAlpha = 1;
  // The fronts of the loops, with the current flowing round them
  ctx.strokeStyle = '#e0a040'; ctx.lineWidth = 3.5;
  for (const x of loops) {
    ctx.beginPath(); ctx.ellipse(x, 210, 7, 38, 0, back[1], back[0] + 2 * Math.PI); ctx.stroke();
    const arc = [];
    for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 8; arc.push([x + dir * 7 * Math.cos(a), 210 + 38 * Math.sin(a)]); }
    dotsAlong(arc, flow);
  }
  ctx.lineWidth = 1;
  return X(110 + d);   // where the cone or diaphragm is fixed to the coil
}
function drawSpeaker(c) {
  const fv = visF(freq()), t = state.t - snd.start, ph = 2 * Math.PI * fv * t;
  const current = Math.sin(ph), d = swing() * Math.sin(ph);   // the cone moves with the force, which goes with the current
  const ox = 70;
  // The sound in the air in front of the cone
  drawAir(c, 340, 790, 316);
  // The frame (basket) and the cone
  ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(176, 150); ctx.lineTo(310, 62); ctx.moveTo(176, 270); ctx.lineTo(310, 358); ctx.stroke();
  flow += current * 45 * state.dt;
  const front = drawMagnetCoil(c, ox, d, current, 1);
  ctx.fillStyle = PK.isDark() ? 'rgba(207, 216, 220, .25)' : 'rgba(55, 71, 79, .12)'; ctx.strokeStyle = PK.isDark() ? '#cfd8dc' : '#37474f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(front, 176); ctx.lineTo(316 + d, 70); ctx.lineTo(316 + d, 350); ctx.lineTo(front, 244); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(front, 176); ctx.lineTo(316 + d, 70); ctx.moveTo(front, 244); ctx.lineTo(316 + d, 350); ctx.stroke();
  ctx.lineWidth = 1;
  // The force on the coil (motor effect), reversing with the current
  if (Math.abs(current) > 0.12) pointer(150, 120, 150 + 40 * Math.sign(current) * Math.min(1, Math.abs(current) + 0.3), 120, '#2e7d32', 3);
  tag(c, 'force on the coil', 150, 102, '#2e7d32', 'center', 12, 800);
  tag(c, 'cone', 262, 52, c.text, 'center', 12, 800);
  tag(c, 'coil', 204, 300, COPPER, 'center', 12, 800);
  tag(c, 'magnet', 80, 292, c.muted, 'center', 12, 800);
  // The amplifier, with the current it sends
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(160, 247); ctx.lineTo(160, 330); ctx.lineTo(130, 330); ctx.moveTo(168, 247); ctx.lineTo(168, 340); ctx.lineTo(130, 340); ctx.stroke(); ctx.lineWidth = 1;
  dotsAlong([[160, 247], [160, 330], [130, 330]], flow); dotsAlong([[130, 340], [168, 340], [168, 247]], flow);
  tag(c, 'orange dots: the current', 236, 384, FLOW, 'center', 12, 800);
  snd.trace.push({ t: state.t, v: current * loudness() });
  while (snd.trace.length && snd.trace[0].t < state.t - 3) snd.trace.shift();
  ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.roundRect(10, 310, 120, 96, 8); ctx.fill();
  ctx.fillStyle = '#0d1a14'; ctx.fillRect(18, 318, 104, 58);
  ctx.save(); ctx.beginPath(); ctx.rect(18, 318, 104, 58); ctx.clip();
  ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 2; ctx.beginPath();
  snd.trace.forEach((p, i) => { const px = 122 - ((state.t - p.t) / 3) * 104, py = 347 - p.v * 8; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.stroke(); ctx.restore();
  tag(c, 'current from the amplifier', 70, 392, '#cfd8dc', 'center', 10, 700, null);
  waveLabels(c, 316, 340, 790);
}
function drawMic(c) {
  const src = 96, at = 452;   // the sound leaves the speaker on the left; the diaphragm is at 452
  drawAir(c, 110, 440, src);
  // A loudspeaker making the sound
  ctx.fillStyle = '#546e7a'; ctx.fillRect(20, 150, 50, 120);
  const s0 = airShift(src + 1, src);
  ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.moveTo(70, 170); ctx.lineTo(src + s0, 120); ctx.lineTo(src + s0, 300); ctx.lineTo(70, 250); ctx.closePath(); ctx.fill();
  tag(c, 'sound', 58, 132, c.muted, 'center', 12, 800);
  // The microphone, facing left: diaphragm, coil and magnet
  const d = airShift(at, src);
  ctx.strokeStyle = c.muted; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.roundRect(440, 112, 168, 196, 16); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
  const fv = visF(freq()), velocity = Math.cos(2 * Math.PI * fv * (state.t - snd.start) - (2 * Math.PI * fv / VVIS) * (at - src));
  const arrived = state.t - snd.start > (at - src) / VVIS;
  const current = arrived ? velocity : 0;
  flow += current * 45 * state.dt;
  const front = drawMagnetCoil(c, 600, -d, current, -1);   // facing left, so the coil moves the same way as the air
  ctx.strokeStyle = PK.isDark() ? '#cfd8dc' : '#37474f'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(front - 1, 124); ctx.quadraticCurveTo(front - 6, 210, front - 1, 296); ctx.stroke(); ctx.lineWidth = 1;
  tag(c, 'diaphragm', front - 2, 100, c.text, 'center', 12, 800);
  tag(c, 'coil', 540, 292, COPPER, 'center', 12, 800);
  tag(c, 'magnet', 572, 128, c.muted, 'center', 12, 800);
  // Wires to the oscilloscope
  ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(512, 247); ctx.lineTo(512, 402); ctx.lineTo(680, 402); ctx.lineTo(680, 296); ctx.moveTo(520, 247); ctx.lineTo(520, 394); ctx.lineTo(720, 394); ctx.lineTo(720, 296); ctx.stroke(); ctx.lineWidth = 1;
  dotsAlong([[512, 247], [512, 402], [680, 402], [680, 296]], flow); dotsAlong([[720, 296], [720, 394], [520, 394], [520, 247]], flow);
  tag(c, 'orange dots: the induced current', 600, 414, FLOW, 'center', 12, 800);
  const peak = [0, 2, 5, 10][loudness()];   // mV
  snd.trace.push({ t: state.t, v: current * peak });
  while (snd.trace.length && snd.trace[0].t < state.t - 6) snd.trace.shift();
  scope(c, 632, 60, 150, 200, snd.trace, state.t, 6, 12, 'p.d. from the coil', '4 mV per square');
  waveLabels(c, src, 110, 440);
}
// Mark a compression and a rarefaction, and one wavelength, once the sound has spread
function waveLabels(c, src, x0, x1) {
  const fv = visF(freq()), lam = VVIS / fv, t = state.t - snd.start;
  if (VVIS * t < lam * 1.6) return;
  // Compressions are where the air is most squashed: phase 2π f t − k x = 0 (mod 2π)
  const k = (2 * Math.PI) / lam, ph = 2 * Math.PI * fv * t;
  let xc = src + ((ph % (2 * Math.PI)) / k);
  while (xc < x0 + 20) xc += lam;
  if (xc + lam > x1 || xc + lam > src + VVIS * t) {
    if (xc < x1 - 10) tag(c, 'compression', xc, 62, c.text, 'center', 12, 800);
    return;
  }
  tag(c, 'compression', xc, 62, c.text, 'center', 12, 800);
  if (xc + lam / 2 < x1 - 30) tag(c, 'rarefaction', xc + lam / 2, 372, c.text, 'center', 12, 800);
  // One wavelength, from this compression to the next
  ctx.strokeStyle = c.text; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xc, 388); ctx.lineTo(xc + lam, 388); ctx.moveTo(xc, 380); ctx.lineTo(xc, 396); ctx.moveTo(xc + lam, 380); ctx.lineTo(xc + lam, 396); ctx.stroke(); ctx.lineWidth = 1;
  tag(c, `λ = ${PK.ansText(`${(330 / freq()).toPrecision(3)} m`)}`, xc + lam / 2, 402, c.text, 'center', 12, 800);
}

// ---------- Sound you can hear ----------
// An iPad keeps web audio silent while it's muted, unless a media clip is playing as well. So a
// silent looping clip plays alongside the tone (and the page asks for the 'playback' audio session
// where it can), which lets the tone be heard.
let audio = null, unlock = null;
function silentWav() {
  const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const str = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);   // in 8-bit sound, 128 is silence
  return new Blob([buf], { type: 'audio/wav' });
}
function setTone() {
  if (!audio) return;
  const now = audio.ctx.currentTime;
  audio.osc.frequency.setTargetAtTime(freq(), now, 0.02);
  audio.gain.gain.setTargetAtTime([0, 0.12, 0.3, 0.6][loudness()], now, 0.05);
}
function stopTone() {
  if (!audio) return;
  try { audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.03); audio.osc.stop(audio.ctx.currentTime + 0.2); } catch { /* already stopped */ }
  audio = null;
  if (unlock) unlock.pause();
  $('listen').textContent = '🔊 Play the sound';
}
function startTone() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { PK.toast('This browser can’t play sounds.'); return; }
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* not supported */ }
  if (!unlock) { unlock = new Audio(URL.createObjectURL(silentWav())); unlock.loop = true; }
  unlock.play().catch(() => {});
  const ac = (startTone.ctx = startTone.ctx || new AC());
  if (ac.state === 'suspended') ac.resume();
  const osc = ac.createOscillator(), gain = ac.createGain();
  gain.gain.value = 0; osc.type = 'sine'; osc.connect(gain); gain.connect(ac.destination); osc.start();
  audio = { ctx: ac, osc, gain };
  setTone();
  $('listen').textContent = '🔇 Stop the sound';
}

// ---------- Words ----------

const INTRO = {
  gen: 'A coil turns between the poles of a magnet. As its sides cut across the magnetic field, a potential difference is induced: the generator effect. Compare the output from slip rings (an alternator) and a split-ring commutator (a dynamo).',
  speaker: 'An alternating current in a coil makes it vibrate in a magnet’s field, and the cone pushes the air to make sound. This uses the motor effect.',
  mic: 'A microphone works the other way round: sound waves make a coil vibrate in a magnet’s field, which induces a p.d. that varies just like the sound. This uses the generator effect.',
};
const EXPLAIN = {
  gen: `<ul>
      <li>When the coil turns, its long sides move through the magnetic field, and a <b>p.d. is induced</b> across the coil.</li>
      <li>The p.d. is biggest when the sides cut <b>straight across</b> the field lines, and zero when they move <b>along</b> them.</li>
      <li>Each side moves one way through the field, then the other, so the induced p.d. <b>reverses every half turn</b>.</li>
      <li><b>Alternator:</b> slip rings keep each end of the coil touching the same brush, so the output is <b>alternating current (a.c.)</b>.</li>
      <li><b>Dynamo:</b> a split-ring commutator swaps the connections every half turn, just as the p.d. reverses, so the output is always the same way round: <b>direct current (d.c.)</b>. It still rises and falls.</li>
      <li>Turning faster gives a <b>bigger</b> p.d. and <b>more peaks</b> each second. More turns on the coil, or a stronger magnet, also give a bigger p.d.</li>
    </ul>`,
  speaker: `<ul>
      <li>The amplifier sends an <b>alternating current</b> through the coil, which sits in the magnet’s field.</li>
      <li>A current in a magnetic field feels a <b>force</b> (the motor effect). As the current reverses, so does the force, so the coil is pushed out, then in.</li>
      <li>The coil is fixed to the cone, so the cone <b>vibrates</b> at the same frequency as the current. It squashes and stretches the air in front of it, making <b>compressions and rarefactions</b>: a sound wave.</li>
      <li>A higher frequency current gives a higher pitch. A bigger current gives a bigger force, bigger vibrations and a louder sound.</li>
    </ul>`,
  mic: `<ul>
      <li>Sound waves are <b>pressure variations</b> in the air. They push the diaphragm in and out.</li>
      <li>The diaphragm is fixed to a coil in a magnet’s field. As the coil moves through the field, a <b>p.d. is induced</b> across it (the generator effect).</li>
      <li>The p.d. varies in the same way as the pressure: a louder sound gives a bigger p.d.; a higher pitch gives more peaks each second. This is the electrical signal.</li>
      <li>A moving-coil microphone is built like a tiny loudspeaker, working backwards.</li>
    </ul>`,
};
function render() {
  if (state.tab === 'gen') {
    const dyn = pressed('gtype') === 'dyn', f = PK.num('speed'), peak = peakFor(omegaSet());
    let html = `<dl class="readout"><dt>Output</dt><dd>${dyn ? 'd.c. (dynamo)' : 'a.c. (alternator)'}</dd><dt>Peak p.d.</dt><dd>${PK.ans(`${peak.toPrecision(2)} V`)}</dd><dt>${dyn ? 'Peaks each second' : 'Frequency'}</dt><dd>${PK.ans(dyn ? String(2 * f) : `${f} Hz`)}</dd></dl>`;
    html += dyn
      ? '<p>The commutator swaps the coil’s connections every half turn, so the p.d. never goes below zero: d.c. There are two peaks for every turn.</p>'
      : '<p>The p.d. goes up and down and reverses every half turn: a.c. One complete wave for every turn of the coil.</p>';
    html += '<p>Change the speed or the number of turns, and compare the new trace with the old one on the screen.</p>';
    if (!gen.spin) html += '<p class="note">The coil has stopped, so no p.d. is induced. Drag it round by hand: the faster you turn it, the bigger the p.d.</p>';
    $('info').innerHTML = html;
  } else {
    const f = freq(), L = ['', 'quiet', 'medium', 'loud'][loudness()];
    let html = `<dl class="readout"><dt>Frequency</dt><dd>${f} Hz</dd><dt>Wavelength in air</dt><dd>${PK.ans(`${(330 / f).toPrecision(3)} m`)}</dd><dt>Loudness</dt><dd>${L}</dd></dl>`;
    html += state.tab === 'speaker'
      ? `<p>The current goes back and forth ${f} times a second, so the force on the coil does too, and the cone vibrates ${f} times a second. Sound travels at 330 m/s, so λ = v ÷ f = 330 ÷ ${f} = ${PK.ans(`${(330 / f).toPrecision(3)} m`)}.</p>`
      : `<p>The diaphragm and coil vibrate ${f} times a second, so the induced p.d. on the oscilloscope makes ${f} waves a second. A louder sound makes a taller trace.</p>`;
    html += `<p class="note">Shown slowed down about 300 times. Press <b>Play the sound</b> to hear it.</p>`;
    $('info').innerHTML = html;
  }
}

// ---------- Controls ----------

function showTab(t) {
  if (t !== state.tab) stopTone();
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = !el.dataset.for.split(' ').includes(t); });
  $('intro').textContent = INTRO[t];
  $('explain').innerHTML = EXPLAIN[t];
  cv.setAttribute('aria-label', { gen: 'A coil turning between the poles of a magnet, and an oscilloscope', speaker: 'A loudspeaker cut in half, sending sound waves through the air', mic: 'Sound waves reaching a microphone cut in half, and an oscilloscope' }[t]);
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'gen' ? location.pathname + location.search : `#${t}`);
  snd.start = state.t; snd.trace = [];
  render();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
for (const id of ['gtype', 'ygain', 'sloud', 'mloud']) {
  document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll(`#${id} .chip`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    setTone(); render();
  }));
}
for (const id of ['speed', 'turns']) $(id).addEventListener('input', render);
for (const id of ['sfreq', 'mfreq']) $(id).addEventListener('input', () => { snd.start = state.t; snd.trace = []; setTone(); render(); });
$('spin').addEventListener('click', () => {
  gen.spin = !gen.spin;
  $('spin').textContent = gen.spin ? '⏸ Stop the coil' : '▶ Turn the coil';
  render();
});
$('clear').addEventListener('click', () => { gen.trace = []; });
$('listen').addEventListener('click', () => (audio ? stopTone() : startTone()));
window.addEventListener('pagehide', stopTone);
window.addEventListener('pk-answers', render);

// Turn the coil by hand: drag up or down on it
let lastDrag = null;
PK.dragOn(cv, W, H, {
  hit: (p) => (state.tab === 'gen' && p.x > 150 && p.x < 350 && Math.abs(p.y - CY) < HALF + 14 ? 'coil' : null),
  move: (k, p) => {
    const now = performance.now() / 1000;
    if (!gen.dragging) {
      gen.dragging = true; gen.spin = false; $('spin').textContent = '▶ Turn the coil'; lastDrag = { y: p.y, t: now };
      render();
      return;
    }
    const dth = (p.y - lastDrag.y) / 60, dt = Math.max(0.016, now - lastDrag.t);
    gen.theta += dth;
    gen.omega += (dth / dt - gen.omega) * 0.5;
    lastDrag = { y: p.y, t: now };
  },
  end: () => { gen.dragging = false; },
});

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  state.t += dt; state.dt = dt;
  if (state.tab === 'gen') stepGen(dt);
  if (cv.clientWidth) {
    const c = colours();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    ({ gen: drawGen, speaker: drawSpeaker, mic: drawMic })[state.tab](c);
  }
  requestAnimationFrame(frame);
}

showTab(['speaker', 'mic'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'gen');
requestAnimationFrame(frame);
