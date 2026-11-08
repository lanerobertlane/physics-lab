// Nuclear fission and fusion.
// Fission: neutrons split uranium-235 nuclei into two smaller nuclei + 2 or 3 neutrons + gamma;
// control rods absorb neutrons. Fusion: deuterium and tritium nuclei collide; at a high enough
// temperature they get close enough to fuse into helium + a neutron.

PK.header({
  title: 'Nuclear fission & fusion',
  spec: [
    { code: '4.4.4.1', text: 'Nuclear fission: a large unstable nucleus absorbs a neutron and splits into two smaller nuclei, emitting two or three neutrons and gamma rays; chain reactions, controlled in a reactor and uncontrolled in a weapon', po: true },
    { code: '4.4.4.2', text: 'Nuclear fusion: two light nuclei join to form a heavier nucleus; some of the mass is converted into energy', po: true },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
function size(cv, w, h) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (h / w) * dpr); }
function text(c, t, x, y, o = {}) { c.fillStyle = o.col || PK.cssVar('--text'); c.font = `${o.w || 700} ${o.s || 13}px ${font()}`; c.textAlign = o.a || 'center'; c.textBaseline = o.b || 'middle'; c.fillText(t, x, y); }
function blob(c, x, y, r, col, col2) {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, col2); g.addColorStop(1, col); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}

let tab = 'fission';

// ---------- Fission ----------

const fc = $('chain'), fx = fc.getContext('2d');
const FW = 800, FH = 420, TOP = 30, BOT = 330, RODS = [118, 232, 346, 460, 574, 688];
const NSPEED = 210;
const fis = { nuclei: [], neutrons: [], products: [], flashes: [], gammas: [], count: 0, absorbed: 0, rods: 0, hist: [], tick: 0, recent: 0 };

function refuel() {
  fis.nuclei = []; fis.neutrons = []; fis.products = []; fis.flashes = []; fis.gammas = [];
  fis.count = 0; fis.absorbed = 0; fis.hist = []; fis.recent = 0;
  // Uranium-235 nuclei on a jittered grid
  let seed = 7; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let gx = 60; gx < FW - 30; gx += 38) for (let gy = TOP + 22; gy < BOT - 12; gy += 36) {
    fis.nuclei.push({ x: gx + (rand() - 0.5) * 16, y: gy + (rand() - 0.5) * 14, state: 'u', t: 0 });
  }
  renderFission();
}
function fire() {
  fis.neutrons.push({ x: 8, y: TOP + 20 + Math.random() * (BOT - TOP - 40), vx: NSPEED, vy: (Math.random() - 0.5) * 40 });
}
const rodDepth = () => TOP + (BOT - TOP) * (fis.rods / 100);

function stepFission(dt) {
  const depth = rodDepth();
  for (const n of fis.neutrons) {
    n.x += n.vx * dt; n.y += n.vy * dt;
    if (n.y < TOP + 4 || n.y > BOT - 4) { n.vy = -n.vy; n.y = Math.max(TOP + 4, Math.min(BOT - 4, n.y)); }   // reflector walls
    if (n.x < 0 || n.x > FW) n.dead = true;
    // Control rods absorb neutrons
    for (const rx of RODS) if (Math.abs(n.x - rx) < 7 && n.y < depth) { n.dead = true; fis.absorbed++; }
    if (n.dead) continue;
    for (const u of fis.nuclei) {
      if (u.state !== 'u') continue;
      if ((n.x - u.x) ** 2 + (n.y - u.y) ** 2 < 15 ** 2) {
        // Not every neutron that meets a nucleus is absorbed by it
        n.seen = n.seen || new Set();
        if (n.seen.has(u)) continue;
        n.seen.add(u);
        if (Math.random() < 0.45) { u.state = 'wobble'; u.t = 0; n.dead = true; break; }
      }
    }
  }
  for (const u of fis.nuclei) {
    if (u.state !== 'wobble') continue;
    u.t += dt;
    if (u.t > 0.35) {
      // Split: two smaller nuclei, 2 or 3 neutrons, a gamma ray and energy
      u.state = 'gone'; fis.count++; fis.recent++;
      const a = Math.random() * Math.PI * 2;
      fis.products.push({ x: u.x, y: u.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, r: 8, col: '#fb8c00', life: 3 });
      fis.products.push({ x: u.x, y: u.y, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, r: 7, col: '#43a047', life: 3 });
      const k = Math.random() < 0.5 ? 2 : 3;
      for (let i = 0; i < k; i++) { const b = Math.random() * Math.PI * 2; fis.neutrons.push({ x: u.x, y: u.y, vx: Math.cos(b) * NSPEED, vy: Math.sin(b) * NSPEED }); }
      fis.flashes.push({ x: u.x, y: u.y, t: 0 });
      const g = Math.random() * Math.PI * 2; fis.gammas.push({ x: u.x, y: u.y, vx: Math.cos(g) * 400, vy: Math.sin(g) * 400, t: 0 });
    }
  }
  fis.neutrons = fis.neutrons.filter((n) => !n.dead);
  for (const p of fis.products) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.5; p.life -= dt; }
  fis.products = fis.products.filter((p) => p.life > 0);
  for (const f of fis.flashes) f.t += dt;
  fis.flashes = fis.flashes.filter((f) => f.t < 0.5);
  for (const g of fis.gammas) { g.x += g.vx * dt; g.y += g.vy * dt; g.t += dt; }
  fis.gammas = fis.gammas.filter((g) => g.t < 1);
  // Fissions per half-second, for the graph
  fis.tick += dt;
  if (fis.tick >= 0.5) { fis.tick = 0; fis.hist.push(fis.recent); fis.recent = 0; if (fis.hist.length > 60) fis.hist.shift(); renderFission(); }
}

function drawFission() {
  const k = fc.width / FW;
  fx.setTransform(k, 0, 0, k, 0, 0);
  fx.fillStyle = PK.isDark() ? '#0f1620' : '#f4f7fa'; fx.fillRect(0, 0, FW, FH);
  fx.fillStyle = PK.isDark() ? '#16202c' : '#e6edf2'; fx.fillRect(0, TOP, FW, BOT - TOP);
  // Control rods
  const depth = rodDepth();
  for (const rx of RODS) { fx.fillStyle = '#37474f'; fx.fillRect(rx - 7, 0, 14, depth); }
  if (fis.rods > 0) text(fx, 'control rods', RODS[0] + 12, 14, { a: 'left', s: 13, col: PK.cssVar('--muted') });
  for (const u of fis.nuclei) {
    if (u.state === 'gone') continue;
    const wob = u.state === 'wobble' ? Math.sin(u.t * 80) * 3 : 0;
    blob(fx, u.x + wob, u.y, u.state === 'wobble' ? 13 : 12, '#1565c0', '#90caf9');
  }
  for (const f of fis.flashes) { fx.fillStyle = `rgba(255, 214, 0, ${0.8 * (1 - f.t / 0.5)})`; fx.beginPath(); fx.arc(f.x, f.y, 10 + f.t * 60, 0, Math.PI * 2); fx.fill(); }
  for (const p of fis.products) { fx.globalAlpha = Math.min(1, p.life); blob(fx, p.x, p.y, p.r, p.col, '#fff3e0'); fx.globalAlpha = 1; }
  fx.strokeStyle = '#8e24aa'; fx.lineWidth = 2;
  for (const g of fis.gammas) { const sp = 400, ux = g.vx / sp, uy = g.vy / sp; fx.beginPath(); for (let s = 0; s <= 16; s += 2) { const w = Math.sin(s) * 3; const x = g.x - ux * s - uy * w, y = g.y - uy * s + ux * w; if (s) fx.lineTo(x, y); else fx.moveTo(x, y); } fx.stroke(); }
  for (const n of fis.neutrons) blob(fx, n.x, n.y, 4.5, '#616161', '#e0e0e0');
  // Key
  const ky = BOT + 22;
  blob(fx, 30, ky, 9, '#1565c0', '#90caf9'); text(fx, 'uranium-235', 46, ky, { a: 'left', s: 13 });
  blob(fx, 160, ky, 4.5, '#616161', '#e0e0e0'); text(fx, 'neutron', 172, ky, { a: 'left', s: 13 });
  blob(fx, 250, ky, 7, '#fb8c00', '#fff3e0'); blob(fx, 266, ky, 6, '#43a047', '#fff3e0'); text(fx, 'smaller nuclei (e.g. barium + krypton)', 280, ky, { a: 'left', s: 13 });
  fx.strokeStyle = '#8e24aa'; fx.beginPath(); for (let s = 0; s <= 16; s += 2) fx.lineTo(520 + s, ky + Math.sin(s) * 3); fx.stroke(); text(fx, 'gamma ray', 542, ky, { a: 'left', s: 13 });
  // Graph of fissions over time
  const gx = 20, gy = BOT + 42, gw = FW - 40, gh = 40;
  fx.strokeStyle = PK.cssVar('--border-strong'); fx.lineWidth = 1; fx.strokeRect(gx, gy, gw, gh);
  const max = Math.max(4, ...fis.hist);
  fx.strokeStyle = '#e53935'; fx.lineWidth = 2; fx.beginPath();
  fis.hist.forEach((v, i) => { const x = gx + (i / 59) * gw, y = gy + gh - (v / max) * (gh - 4); if (i) fx.lineTo(x, y); else fx.moveTo(x, y); });
  fx.stroke();
  text(fx, 'fissions every ½ second (last 30 s)', gx + 6, gy + 9, { a: 'left', s: 13, col: PK.cssVar('--muted') });
  if (!fis.count && !fis.neutrons.length) text(fx, 'Fire a neutron at the uranium.', FW / 2, (TOP + BOT) / 2, { s: 15, w: 800 });
}

function trend() {
  const h = fis.hist.slice(-6);
  if (h.length < 4 || (!fis.neutrons.length && fis.count)) return fis.count ? 'Stopped' : '–';
  const a = h.slice(0, 3).reduce((s, v) => s + v, 0), b = h.slice(3).reduce((s, v) => s + v, 0);
  if (b === 0 && a === 0) return fis.neutrons.length ? 'Waiting for a hit' : '–';
  if (b > a * 1.4 + 1) return 'Growing: uncontrolled';
  if (b < a * 0.6) return 'Dying out';
  return 'Steady: controlled';
}
function renderFission() {
  const left = fis.nuclei.filter((u) => u.state === 'u').length;
  $('f-read').innerHTML = `
    <dt>Fissions so far</dt><dd>${fis.count}</dd>
    <dt>Neutrons moving now</dt><dd>${fis.neutrons.length}</dd>
    <dt>Absorbed by control rods</dt><dd>${fis.absorbed}</dd>
    <dt>Uranium-235 left</dt><dd>${left} of ${fis.nuclei.length}</dd>
    <dt>The reaction is</dt><dd>${trend()}</dd>
    <dt>Energy released</dt><dd>${fis.count ? `${(fis.count * 200).toLocaleString('en-GB')} MeV` : '0'}</dd>`;
  $('rods-val').textContent = `${fis.rods}%`;
}

// ---------- Fusion ----------

const uc = $('fusion'), ux = uc.getContext('2d');
const UW = 800, UH = 400, BOX = { x: 20, y: 20, w: 560, h: 360 }, R = 9;
const fus = { parts: [], temp: 15, count: 0, flashes: [], bumps: [] };
function refill() {
  fus.parts = []; fus.count = 0; fus.flashes = []; fus.bumps = [];
  for (let i = 0; i < 26; i++) addPart(i % 2 ? 'D' : 'T', BOX.x + 30 + Math.random() * (BOX.w - 60), BOX.y + 30 + Math.random() * (BOX.h - 60));
  renderFusion();
}
function speedFor(T) { return 30 + Math.sqrt(T) * 22; }
function addPart(kind, x, y, v) {
  const a = Math.random() * Math.PI * 2, s = v ?? speedFor(fus.temp) * (0.6 + Math.random() * 0.8);
  fus.parts.push({ kind, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: kind === 'n' ? 4.5 : kind === 'He' ? 11 : R });
}
// Chance that a deuterium–tritium collision fuses, at a temperature in millions of °C
const fuseChance = (T) => 1 / (1 + Math.exp(-(T - 90) / 14));

function stepFusion(dt) {
  const target = speedFor(fus.temp);
  for (const p of fus.parts) {
    // Nudge speeds towards the temperature
    if (p.kind === 'D' || p.kind === 'T' || p.kind === 'He') { const s = Math.hypot(p.vx, p.vy) || 1, want = p.kind === 'He' ? target * 0.7 : target; const f = 1 + (want / s - 1) * Math.min(1, dt * 1.5); p.vx *= f; p.vy *= f; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === 'n') { if (p.x < -10 || p.x > UW + 10 || p.y < -10 || p.y > UH + 10) p.dead = true; continue; }
    if (p.x < BOX.x + p.r) { p.x = BOX.x + p.r; p.vx = Math.abs(p.vx); }
    if (p.x > BOX.x + BOX.w - p.r) { p.x = BOX.x + BOX.w - p.r; p.vx = -Math.abs(p.vx); }
    if (p.y < BOX.y + p.r) { p.y = BOX.y + p.r; p.vy = Math.abs(p.vy); }
    if (p.y > BOX.y + BOX.h - p.r) { p.y = BOX.y + BOX.h - p.r; p.vy = -Math.abs(p.vy); }
  }
  const ps = fus.parts;
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i], b = ps[j];
    if (a.dead || b.dead || a.kind === 'n' || b.kind === 'n') continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
    if (d >= min || d === 0) continue;
    const pair = [a.kind, b.kind].sort().join('');
    if (pair === 'DT' && Math.random() < fuseChance(fus.temp)) {
      a.dead = true; b.dead = true; fus.count++;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      addPart('He', mx, my, 60);
      const ang = Math.random() * Math.PI * 2; fus.parts.push({ kind: 'n', x: mx, y: my, vx: Math.cos(ang) * 420, vy: Math.sin(ang) * 420, r: 4.5 });
      fus.flashes.push({ x: mx, y: my, t: 0 });
      continue;
    }
    // Repel: bounce apart
    const nx = dx / d, ny = dy / d, rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny; }
    const push = (min - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
    if (fus.bumps.length < 6) fus.bumps.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0 });
  }
  fus.parts = fus.parts.filter((p) => !p.dead);
  for (const f of fus.flashes) f.t += dt; fus.flashes = fus.flashes.filter((f) => f.t < 0.6);
  for (const f of fus.bumps) f.t += dt; fus.bumps = fus.bumps.filter((f) => f.t < 0.3);
}
function nucleus(c, p) {
  if (p.kind === 'n') { blob(c, p.x, p.y, 4.5, '#616161', '#e0e0e0'); return; }
  const parts = p.kind === 'D' ? [['p', -4, 0], ['n', 4, 0]] : p.kind === 'T' ? [['p', 0, -4], ['n', -4, 3], ['n', 4, 3]] : [['p', -4, -4], ['n', 4, -4], ['n', -4, 4], ['p', 4, 4]];
  for (const [k, dx, dy] of parts) blob(c, p.x + dx, p.y + dy, 5.5, k === 'p' ? '#c62828' : '#757575', k === 'p' ? '#ff8a80' : '#e0e0e0');
}
function drawFusion() {
  const k = uc.width / UW;
  ux.setTransform(k, 0, 0, k, 0, 0);
  ux.fillStyle = PK.cssVar('--surface'); ux.fillRect(0, 0, UW, UH);
  const hot = Math.min(1, fus.temp / 150);
  ux.fillStyle = `rgb(${Math.round(30 + 120 * hot)}, ${Math.round(30 + 30 * hot)}, ${Math.round(60 - 20 * hot)})`; ux.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
  for (const f of fus.bumps) { ux.strokeStyle = `rgba(255,255,255,${0.5 * (1 - f.t / 0.3)})`; ux.lineWidth = 1.5; ux.beginPath(); ux.arc(f.x, f.y, 14, 0, Math.PI * 2); ux.stroke(); }
  for (const f of fus.flashes) { ux.fillStyle = `rgba(255, 235, 59, ${0.9 * (1 - f.t / 0.6)})`; ux.beginPath(); ux.arc(f.x, f.y, 10 + f.t * 70, 0, Math.PI * 2); ux.fill(); }
  for (const p of fus.parts) nucleus(ux, p);
  // Key and equation
  const kx = 600;
  text(ux, 'Key', kx, 34, { a: 'left', s: 13, w: 800 });
  nucleus(ux, { kind: 'D', x: kx + 12, y: 62 }); text(ux, 'deuterium (hydrogen-2)', kx + 30, 62, { a: 'left', s: 13 });
  nucleus(ux, { kind: 'T', x: kx + 12, y: 92 }); text(ux, 'tritium (hydrogen-3)', kx + 30, 92, { a: 'left', s: 13 });
  nucleus(ux, { kind: 'He', x: kx + 12, y: 124 }); text(ux, 'helium-4', kx + 30, 124, { a: 'left', s: 13 });
  nucleus(ux, { kind: 'n', x: kx + 12, y: 152 }); text(ux, 'neutron', kx + 30, 152, { a: 'left', s: 13 });
  blob(ux, kx + 8, 180, 5, '#c62828', '#ff8a80'); text(ux, 'proton', kx + 20, 180, { a: 'left', s: 13 });
  blob(ux, kx + 80, 180, 5, '#757575', '#e0e0e0'); text(ux, 'neutron', kx + 92, 180, { a: 'left', s: 13 });
  text(ux, 'H-2 + H-3 → He-4 + n', kx + 90, 226, { s: 14, w: 800 });
  text(ux, '+ energy', kx + 90, 248, { s: 14, w: 800, col: '#ef6c00' });
  const verdict = fus.temp < 30 ? 'Too cold: the nuclei repel' : fus.temp < 80 ? 'Fusion is rare' : 'Hot enough: lots of fusion';
  text(ux, verdict, kx + 90, 300, { s: 13, w: 800, col: fus.temp < 30 ? '#1e63c6' : fus.temp < 80 ? '#ef6c00' : '#2e7d32' });
  if (fus.temp < 30) { text(ux, 'The Sun manages fusion at 15 million °C', kx + 90, 324, { s: 13 }); text(ux, 'because of the huge pressure in its core.', kx + 90, 340, { s: 13 }); }
}
function renderFusion() {
  const fuel = fus.parts.filter((p) => p.kind === 'D' || p.kind === 'T').length;
  $('temp-val').textContent = `${fus.temp} million °C`;
  $('u-read').innerHTML = `
    <dt>Fusions so far</dt><dd>${fus.count}</dd>
    <dt>Hydrogen nuclei left</dt><dd>${fuel}</dd>
    <dt>Core of the Sun</dt><dd>15 million °C</dd>
    <dt>Fusion reactors on Earth</dt><dd>about 150 million °C</dd>`;
}

// ---------- Tabs and loop ----------

function showTab(t) {
  tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-tab]').forEach((el) => { el.hidden = el.dataset.tab !== t; });
  sizeAll();
  window.history.replaceState(null, '', `#${t}`);
}
function sizeAll() { if (tab === 'fission') size(fc, FW, FH); else size(uc, UW, UH); }
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
$('fire').addEventListener('click', fire);
$('refuel').addEventListener('click', refuel);
$('rods').addEventListener('input', (e) => { fis.rods = Number(e.target.value); renderFission(); });
$('temp').addEventListener('input', (e) => { fus.temp = Number(e.target.value); renderFusion(); });
$('refill').addEventListener('click', refill);
window.addEventListener('resize', sizeAll);

let last = performance.now(), slow = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (tab === 'fission') { stepFission(dt); drawFission(); }
  else { stepFusion(dt); drawFusion(); if ((slow += dt) > 0.3) { slow = 0; renderFusion(); } }
  requestAnimationFrame(frame);
}
const startTab = location.hash.slice(1);
refuel(); refill();
showTab(['fission', 'fusion'].includes(startTab) ? startTab : 'fission');
requestAnimationFrame(frame);
