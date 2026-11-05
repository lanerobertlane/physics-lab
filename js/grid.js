// The National Grid: power stations generate at about 25 kV. A step-up transformer raises the
// p.d. so the current in the cables is small (P = V I), and much less energy is wasted heating
// the cables (P = I² R). Step-down transformers bring it back to 230 V for homes.

PK.header({
  title: 'The National Grid',
  answers: true,
  spec: [
    { code: '4.2.4.3', text: 'The National Grid: step-up transformers increase the p.d. so the current is lower and less energy is lost; step-down transformers make it safe for homes' },
    { code: '4.2.4.1', text: 'Power: P = V I and P = I² R' },
    { code: '4.7.3.4', text: 'Transformers: V_p ÷ V_s = n_p ÷ n_s and V_s I_s = V_p I_p', ht: true, po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const V_GEN = 25000, V_HOME = 230, R_CABLE = 0.5;
const state = { P: 500e6, Vt: 400000 };

function figures() {
  const I = state.P / state.Vt;                 // current in the transmission cables
  const loss = Math.min(state.P, I * I * R_CABLE);  // power wasted heating the cables
  const fraction = loss / state.P;
  return { I, loss, fraction, delivered: state.P - loss };
}

const fmtW = (w) => (w >= 1e9 ? `${(w / 1e9).toFixed(2)} GW` : w >= 1e6 ? `${parseFloat((w / 1e6).toPrecision(3))} MW` : w >= 1e3 ? `${parseFloat((w / 1e3).toPrecision(3))} kW` : `${Math.round(w)} W`);
const fmtA = (a) => (a >= 1000 ? `${Math.round(a).toLocaleString()} A` : `${parseFloat(a.toPrecision(3))} A`);
const fmtV = (v) => (v >= 1000 ? `${v / 1000} kV` : `${v} V`);

// ---------- Drawing ----------

const cv = $('grid'), ctx = cv.getContext('2d');
const W = 800, H = 330;
let phase = 0;
function sizeCanvas() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }

function label(text, x, y, col, size = 12, weight = 700) {
  ctx.fillStyle = col; ctx.font = `${weight} ${size}px ${PK.cssVar('--font-body') || 'sans-serif'}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(text, x, y);
}

function transformer(x, y, up, col) {
  ctx.fillStyle = '#7b8794'; ctx.fillRect(x - 26, y - 30, 52, 60);
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x - 26, y - 30, 52, 60);
  // Two coils: fewer turns on the low-voltage side
  ctx.strokeStyle = '#ffb74d'; ctx.lineWidth = 2;
  const coil = (cx, turns) => { for (let i = 0; i < turns; i++) { const yy = y - 20 + (40 * i) / Math.max(1, turns - 1); ctx.beginPath(); ctx.ellipse(cx, yy, 7, 2.5, 0, 0, Math.PI * 2); ctx.stroke(); } };
  coil(x - 12, up ? 3 : 8); coil(x + 12, up ? 8 : 3);
}

function pylon(x, base, top) {
  ctx.strokeStyle = '#5f6b78'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 16, base); ctx.lineTo(x - 4, top); ctx.lineTo(x + 4, top); ctx.lineTo(x + 16, base);
  ctx.moveTo(x - 12, base - 30); ctx.lineTo(x + 12, base - 30); ctx.moveTo(x - 9, base - 60); ctx.lineTo(x + 9, base - 60);
  ctx.moveTo(x - 24, top + 10); ctx.lineTo(x + 24, top + 10);
  ctx.moveTo(x - 14, base); ctx.lineTo(x + 9, base - 60); ctx.moveTo(x + 14, base); ctx.lineTo(x - 9, base - 60);
  ctx.stroke();
}

function draw(dt) {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const c = { surface: PK.cssVar('--surface'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted') };
  ctx.fillStyle = '#d7ecff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#8bc34a'; ctx.fillRect(0, 250, W, H - 250);
  const f = figures();

  // Power station
  ctx.fillStyle = '#9e9e9e'; ctx.fillRect(20, 170, 90, 80);
  ctx.fillStyle = '#757575'; ctx.fillRect(34, 110, 20, 60); ctx.fillRect(70, 124, 20, 46);
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  for (let i = 0; i < 3; i++) { const yy = 100 - ((phase * 12 + i * 18) % 54); ctx.beginPath(); ctx.arc(44 + i * 3, yy, 8 + i * 2, 0, Math.PI * 2); ctx.fill(); }
  label('Power station', 65, 256, '#1b1f2a');
  label(fmtV(V_GEN), 65, 272, '#1b1f2a', 13, 800);

  const stepped = state.Vt !== V_GEN;
  // Step-up transformer
  transformer(165, 210, true, c.text);
  label(stepped ? 'Step-up' : 'No step-up', 165, 256, '#1b1f2a');
  label('transformer', 165, 270, '#1b1f2a');

  // Pylons and cables
  const pylons = [250, 380, 510, 640];
  for (const x of pylons) pylon(x, 250, 120);
  const heat = Math.min(1, f.fraction * 2.2);       // 0 = cool grey, 1 = glowing hot
  const col = `rgb(${Math.round(90 + 165 * heat)}, ${Math.round(100 - 40 * heat)}, ${Math.round(110 - 90 * heat)})`;
  const cableY = (x) => { // sagging cable between the pylon tops
    if (x <= pylons[0]) return 210 + ((x - 190) / (pylons[0] - 190)) * (130 - 210);
    if (x >= pylons[3]) return 130 + ((x - pylons[3]) / (720 - pylons[3])) * (210 - 130);
    const i = pylons.findIndex((p, j) => x >= p && x <= pylons[j + 1]);
    const a = pylons[i], b = pylons[i + 1], u = (x - a) / (b - a);
    return 130 + 22 * 4 * u * (1 - u);
  };
  if (heat > 0.05) { ctx.strokeStyle = `rgba(255, 120, 0, ${0.35 * heat})`; ctx.lineWidth = 12; ctx.beginPath(); for (let x = 190; x <= 720; x += 5) (x === 190 ? ctx.moveTo(x, cableY(x)) : ctx.lineTo(x, cableY(x))); ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); for (let x = 190; x <= 720; x += 5) (x === 190 ? ctx.moveTo(x, cableY(x)) : ctx.lineTo(x, cableY(x))); ctx.stroke();
  // Heat shimmer above hot cables
  if (heat > 0.2) {
    ctx.strokeStyle = `rgba(230, 80, 0, ${0.6 * heat})`; ctx.lineWidth = 1.5;
    for (let x = 280; x < 640; x += 60) {
      const y0 = cableY(x) - 8;
      ctx.beginPath();
      for (let s = 0; s < 22; s += 2) { const yy = y0 - s, xx = x + Math.sin((s + phase * 30) / 3) * 3; s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
    }
  }
  // Moving charge: speed shows the size of the current
  const speed = Math.min(220, 12 + f.I / 100);
  phase += dt;
  ctx.fillStyle = '#ffeb3b';
  const offset = (phase * speed) % 40;
  for (let x = 190 + offset; x < 720; x += 40) { ctx.beginPath(); ctx.arc(x, cableY(x), 3.2, 0, Math.PI * 2); ctx.fill(); }
  label(`Transmission cables: ${fmtV(state.Vt)}`, 445, 86, '#1b1f2a', 14, 800);
  label(`current ${PK.ansText(fmtA(f.I))}`, 445, 104, '#1b1f2a', 12, 700);

  // Step-down transformer and homes
  transformer(745, 210, false, c.text);
  label('Step-down', 745, 256, '#1b1f2a');
  label('transformer', 745, 270, '#1b1f2a');
  ctx.fillStyle = '#e57373';
  for (let i = 0; i < 2; i++) { const hx = 690 + i * 40; ctx.fillStyle = '#ffe0b2'; ctx.fillRect(hx - 15, 296, 30, 24); ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(hx - 19, 297); ctx.lineTo(hx, 282); ctx.lineTo(hx + 19, 297); ctx.closePath(); ctx.fill(); }
  label('Homes: 230 V', 630, 300, '#1b1f2a', 12, 800);
}

// ---------- Panel ----------

function render() {
  const f = figures();
  $('power-val').textContent = fmtW(state.P);
  document.querySelectorAll('#volts .chip').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === state.Vt)));
  $('readout').innerHTML = `
    <dt>Current in the cables (I = P ÷ V)</dt><dd>${PK.ans(fmtA(f.I))}</dd>
    <dt>Power wasted heating the cables (P = I² R)</dt><dd>${PK.ans(fmtW(f.loss))}</dd>
    <dt>Percentage wasted</dt><dd>${PK.ans(`${(f.fraction * 100).toPrecision(2)}%`)}</dd>
    <dt>Power reaching homes</dt><dd>${PK.ans(fmtW(f.delivered))}</dd>`;
  $('bar').innerHTML = `<div class="ok" style="width:${(1 - f.fraction) * 100}%"></div><div class="lost" style="width:${f.fraction * 100}%"></div>`;
  const stepped = state.Vt !== V_GEN;
  const turnsUp = state.Vt / V_GEN, turnsDown = state.Vt / V_HOME;
  $('working').innerHTML = `
    <p>I = P ÷ V = ${fmtW(state.P)} ÷ ${fmtV(state.Vt)} = <b>${PK.ans(fmtA(f.I))}</b></p>
    <p>Power wasted = I² R = ${PK.ans(fmtA(f.I))}² × ${R_CABLE} Ω = <b>${PK.ans(fmtW(f.loss))}</b></p>
    ${stepped ? `<p>Step-up turns ratio n<sub>s</sub> ÷ n<sub>p</sub> = V<sub>s</sub> ÷ V<sub>p</sub> = ${fmtV(state.Vt)} ÷ ${fmtV(V_GEN)} = <b>${PK.ans(parseFloat(turnsUp.toPrecision(3)))}</b> <span class="tag ht">Higher</span></p>` : ''}
    <p>Step-down: ${fmtV(state.Vt)} → 230 V, so the secondary coil has <b>${PK.ans(Math.round(turnsDown).toLocaleString())}</b> times fewer turns. <span class="tag ht">Higher</span></p>`;
  $('verdict').innerHTML = stepped
    ? `Raising the p.d. to ${fmtV(state.Vt)} makes the current ${PK.ans(`${parseFloat((state.Vt / V_GEN).toPrecision(3))} times`)} smaller, so the power wasted is ${PK.ans(`${Math.round((state.Vt / V_GEN) ** 2)} times`)} smaller (it depends on I²).`
    : 'Without a step-up transformer the current is huge, so the cables get very hot and much of the energy is wasted.';
}

document.querySelectorAll('#volts .chip').forEach((b) => b.addEventListener('click', () => { state.Vt = Number(b.dataset.v); render(); }));
$('power').addEventListener('input', (e) => { state.P = Number(e.target.value) * 1e6; render(); });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  draw(dt);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', sizeCanvas);
window.addEventListener('pk-answers', render);
sizeCanvas();
render();
requestAnimationFrame(frame);
