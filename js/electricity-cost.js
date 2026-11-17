// Paying for electricity: switch appliances on and watch a smart meter count the energy (power
// is energy per second), then work out the energy for one appliance in joules and kilowatt-hours,
// read the meter, and find the cost. Also makes its own cost questions for the Practice tab.

PK.header({
  title: 'Paying for electricity',
  answers: true,
  spec: [
    { code: '4.1.1.4', text: 'Power is the rate at which energy is transferred: P = E ÷ t. An energy transfer of 1 joule per second is a power of 1 watt' },
    { code: '4.2.4.2', text: 'Energy transfers in everyday appliances: the energy transferred depends on the power of the appliance and how long it is switched on for. E = P t' },
    { code: '4.2.4.2', text: 'How appliances transfer energy from the mains to the kinetic energy of electric motors or the energy of heating devices' },
    { code: 'KS3', text: 'Comparing power ratings of appliances in watts (W, kW)' },
    { code: 'KS3', text: 'Comparing amounts of energy transferred (J, kJ, kW hour); domestic fuel bills, fuel use and costs' },
  ],
});

const $ = (id) => document.getElementById(id);
const cv = $('scene'), ctx = cv.getContext('2d');
const W = 800, H = 400;
const state = { tab: 'power' };
const appsEl = document.querySelector('.apps');   // no id, so a shared link doesn't treat it as a group of chips
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
// 12 345 with spaces, as on exam papers (but 1000 stays as it is)
const spaced = (x, dp = 0) => {
  const [i, f] = Math.abs(x).toFixed(dp).split('.');
  return `${x < 0 ? '−' : ''}${i.length > 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : i}${f ? `.${f}` : ''}`;
};
const sig = (x, n = 3) => (x === 0 ? '0' : Math.abs(x) >= 1e6 ? spaced(Number(x.toPrecision(n))) : String(parseFloat(x.toPrecision(n))));
const watts = (p) => (p >= 1000 ? `${sig(p / 1000)} kW` : `${sig(p)} W`);
// 3 significant figures that keep their zeros (12.0, not 12), so a display that counts up
// doesn't jump between 2 and 3 figures
const keep3 = (x) => (Math.abs(Number(x.toPrecision(3))) >= 1000 ? spaced(Math.round(x)) : x.toPrecision(3));
const joules = (e) => (e >= 1e5 ? `${spaced(Number(e.toPrecision(3)))} J` : `${sig(e)} J`);
const pence = (p) => (Number(p.toPrecision(3)) >= 100 ? `£${(p / 100).toFixed(2)}` : `${keep3(p)}p`);
const kwh = (e) => `${sig(e / 3.6e6)} kWh`;
// "Kettle" → "kettle", but "LED lamp" stays as it is
const lc = (name) => name.replace(/^[A-Z][a-z]/, (m) => m.toLowerCase());

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), border: PK.cssVar('--border'), font: PK.cssVar('--font-body') || 'sans-serif' };
}
function tag(c, text, x, y, col, align = 'center', size = 13, weight = 800, halo = c.surface) {
  ctx.font = `${weight} ${size}px ${c.font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}

// Typical power ratings, and where each one transfers the energy from the mains
const APPS = [
  { id: 'shower', em: '🚿', name: 'Electric shower', p: 9000, to: 'the thermal energy store of the water' },
  { id: 'car', em: '🚗', name: 'Electric car charger', p: 7000, to: 'the chemical energy store of the car’s battery' },
  { id: 'kettle', em: '🫖', name: 'Kettle', p: 3000, to: 'the thermal energy store of the water' },
  { id: 'hair', em: '💨', name: 'Hairdryer', p: 2000, to: 'the thermal energy store of the air, and the kinetic energy store of the fan’s motor' },
  { id: 'toaster', em: '🍞', name: 'Toaster', p: 1000, to: 'the thermal energy store of the bread' },
  { id: 'console', em: '🎮', name: 'Games console', p: 200, to: 'light and sound from the screen, and heating the surroundings' },
  { id: 'fridge', em: '🧊', name: 'Fridge', p: 150, to: 'the kinetic energy store of the pump’s motor, which carries energy out of the inside' },
  { id: 'tv', em: '📺', name: 'Television', p: 100, to: 'light and sound, and heating the surroundings' },
  { id: 'filament', em: '💡', name: 'Filament lamp', p: 60, to: 'light, but most of it heats the surroundings' },
  { id: 'laptop', em: '💻', name: 'Laptop', p: 50, to: 'the chemical energy store of its battery, light from the screen and heating' },
  { id: 'led', em: '💡', name: 'LED lamp', p: 10, to: 'light, with very little wasted by heating' },
  { id: 'phone', em: '📱', name: 'Phone charger', p: 5, to: 'the chemical energy store of the phone’s battery' },
];
const byId = Object.fromEntries(APPS.map((a) => [a.id, a]));
const price = () => PK.num('price');   // pence per kWh

// ---------- Power ratings: a meter that counts the energy ----------

const meter = { t: 0, E: 0, each: {}, on: new Set(), lastOn: null };
const totalPower = () => [...meter.on].reduce((s, id) => s + byId[id].p, 0);
function stepMeter(dt) {
  const speed = Number(pressed('clock')), t = dt * speed;
  if (!meter.on.size) return;
  meter.t += t;
  for (const id of meter.on) { const e = byId[id].p * t; meter.each[id] = (meter.each[id] || 0) + e; meter.E += e; }
}
const clockText = (t) => {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min ${String(s).padStart(2, '0')} s`;
};
function drawPower(c) {
  // The smart meter display
  const mx = 20, my = 20, mw = 270, mh = 360;
  ctx.fillStyle = '#1f2a33'; ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 14); ctx.fill();
  ctx.fillStyle = '#0f1a14'; ctx.beginPath(); ctx.roundRect(mx + 14, my + 34, mw - 28, mh - 48, 8); ctx.fill();
  tag(c, 'SMART METER', mx + mw / 2, my + 18, '#b0bec5', 'center', 12, 800, null);
  const P = totalPower(), row = (label, value, sub, y, big = false) => {
    tag(c, label, mx + 28, y, '#8fd9a8', 'left', 12, 700, null);
    tag(c, value, mx + 28, y + (big ? 30 : 24), '#d6ffe4', 'left', big ? 34 : 22, 800, null);
    if (sub) tag(c, sub, mx + 28, y + (big ? 58 : 46), '#8fd9a8', 'left', 13, 600, null);
  };
  row('POWER NOW', P >= 1000 ? `${keep3(P / 1000)} kW` : `${P} W`, P ? `= ${spaced(P)} J every second` : 'nothing is switched on', my + 52, true);
  row('ENERGY USED', `${(meter.E / 3.6e6).toFixed(3)} kWh`, `= ${spaced(Math.round(meter.E))} J`, my + 140);
  row('COST SO FAR', pence((meter.E / 3.6e6) * price()), P ? `${pence((P / 1000) * price())} for every hour` : '', my + 210);
  row('TIME', clockText(meter.t), '', my + 280);
  // Energy transferred by each appliance: the bars grow faster for a bigger power
  const used = APPS.filter((a) => meter.on.has(a.id) || meter.each[a.id]);
  const x0 = 320, x1 = 780, top = 46;
  tag(c, 'Energy transferred by each appliance', x0, 24, c.text, 'left', 15, 800);
  if (!used.length) {
    tag(c, 'Switch on some appliances, and watch', (x0 + x1) / 2, 170, c.muted, 'center', 15, 700);
    tag(c, 'how fast each one transfers energy.', (x0 + x1) / 2, 194, c.muted, 'center', 15, 700);
    return;
  }
  const most = Math.max(...used.map((a) => meter.each[a.id] || 0), 1), inKwh = most >= 3.6e7, rowH = Math.min(30, (H - top - 10) / used.length);
  used.forEach((a, i) => {
    const y = top + i * rowH + rowH / 2, on = meter.on.has(a.id), e = meter.each[a.id] || 0;
    ctx.globalAlpha = on ? 1 : 0.5;
    ctx.font = `${Math.min(20, rowH - 6)}px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.text;
    ctx.fillText(a.em, x0, y + 1);
    tag(c, `${a.name}${on ? '' : ' (off)'}`, x0 + 28, y, c.text, 'left', 13, 700);
    const bx = x0 + 180, bw = x1 - bx - 90;
    ctx.fillStyle = c.surface2; ctx.fillRect(bx, y - rowH * 0.3, bw, rowH * 0.6);
    ctx.fillStyle = on ? '#f2a900' : c.muted; ctx.fillRect(bx, y - rowH * 0.3, Math.max(e > 0 ? 1 : 0, (bw * e) / most), rowH * 0.6);
    tag(c, inKwh ? `${keep3(e / 3.6e6)} kWh` : `${spaced(Math.round(e))} J`, x1, y, c.text, 'right', 13, 700);   // all in the same unit, to compare
    ctx.globalAlpha = 1;
  });
}
function renderApps() {
  appsEl.innerHTML = APPS.map((a) => `<button class="app" data-app="${a.id}" aria-pressed="${meter.on.has(a.id)}"><span class="em" aria-hidden="true">${a.em}</span><span class="nm">${a.name}</span><span class="pw">${spaced(a.p)} W</span></button>`).join('');
}
appsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.app');
  if (!b) return;
  const id = b.dataset.app;
  if (meter.on.has(id)) meter.on.delete(id); else { meter.on.add(id); meter.lastOn = id; }
  b.setAttribute('aria-pressed', String(meter.on.has(id)));
  renderInfo();
});

// ---------- Energy & cost for one appliance ----------

const job = { run: 0, running: false, start: 0 };
const SEC = { s: 1, min: 60, h: 3600 }, UNIT_WORD = { s: 'seconds', min: 'minutes', h: 'hours' }, UNIT_SHORT = { s: 's', min: 'min', h: 'h' };
const jobT = () => PK.num('time') * SEC[pressed('tunit')];   // seconds
const jobE = () => PK.num('pw') * jobT();                     // joules
function newReading() { job.start = Math.round(10000 + Math.random() * 80000) + Math.round(Math.random() * 100) / 100; }
function resetJob() { job.run = 0; job.running = false; syncRun(); renderInfo(); }
function syncRun() {
  const t = `${PK.num('time')} ${PK.num('time') === 1 ? UNIT_WORD[pressed('tunit')].replace(/s$/, '') : UNIT_WORD[pressed('tunit')]}`;
  $('run').textContent = job.running ? 'Running…' : job.run >= 1 ? '▶ Run it again' : `▶ Switch it on for ${t}`;
  $('run').disabled = job.running;
}
function stepJob(dt) {
  if (!job.running) return;
  job.run = Math.min(1, job.run + dt / 4);   // every run takes 4 s to watch, however long it really is
  if (job.run >= 1) { job.running = false; syncRun(); renderInfo(); }
}
function drawCost(c) {
  const a = byId[$('app2').value], P = PK.num('pw'), on = job.running || (job.run > 0 && job.run < 1);
  // The appliance, glowing while it's on
  if (job.running) {
    const g = ctx.createRadialGradient(150, 130, 10, 150, 130, 95);
    g.addColorStop(0, 'rgba(255, 193, 7, .55)'); g.addColorStop(1, 'rgba(255, 193, 7, 0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(150, 130, 95, 0, Math.PI * 2); ctx.fill();
  }
  ctx.font = `86px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.text;
  ctx.fillText(a ? a.em : '🔌', 150, 132);
  tag(c, a ? a.name : 'Your appliance', 150, 215, c.text, 'center', 17, 800);
  tag(c, `${spaced(P)} W = ${sig(P / 1000)} kW`, 150, 240, c.muted, 'center', 15, 700);
  // How long it's been on
  const T = jobT(), u = pressed('tunit'), done = job.run * T / SEC[u];
  tag(c, on || job.run >= 1 ? `On for ${keep3(done)} of ${PK.num('time')} ${UNIT_SHORT[u]}` : `To be on for ${PK.num('time')} ${UNIT_SHORT[u]}`, 150, 290, c.text, 'center', 15, 700);
  ctx.fillStyle = c.surface2; ctx.fillRect(40, 306, 220, 14);
  ctx.fillStyle = '#f2a900'; ctx.fillRect(40, 306, 220 * job.run, 14);
  ctx.strokeStyle = c.border; ctx.strokeRect(40, 306, 220, 14);
  // The meter: readings before and now
  const E = jobE() * job.run, now = job.start + E / 3.6e6;
  const bx = 330, by = 30, bw = 440, bh = 330;
  ctx.fillStyle = '#eceff1'; ctx.strokeStyle = '#607d8b'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  tag(c, 'Electricity meter', bx + bw / 2, by + 24, '#37474f', 'center', 15, 800, null);
  const digits = (label, value, y) => {
    tag(c, label, bx + 30, y, '#455a64', 'left', 14, 700, null);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(bx + 170, y - 22, 240, 44, 6); ctx.fill();
    tag(c, `${value.toFixed(2).padStart(8, '0')} kWh`, bx + 290, y, '#fff', 'center', 22, 800, null);
  };
  digits('Before', job.start, by + 80);
  digits(job.run >= 1 ? 'After' : 'Now', now, by + 140);
  if (job.run > 0) {
    const used = Math.round(now * 100) / 100 - Math.round(job.start * 100) / 100;
    tag(c, `Energy used = ${PK.ansText(`${now.toFixed(2)} − ${job.start.toFixed(2)} = ${used.toFixed(2)} kWh`)}`, bx + bw / 2, by + 200, '#263238', 'center', 15, 700, null);
    tag(c, `Cost so far = ${PK.ansText(pence((E / 3.6e6) * price()))}`, bx + bw / 2, by + 232, '#263238', 'center', 15, 700, null);
    if (job.run >= 1 && jobE() / 3.6e6 < 0.005) tag(c, 'That’s too little energy to change the meter’s reading!', bx + bw / 2, by + 280, '#bf360c', 'center', 14, 800, null);
  } else {
    tag(c, 'Each kWh (a “unit”) you use costs', bx + bw / 2, by + 210, '#455a64', 'center', 15, 700, null);
    tag(c, `${price()}p`, bx + bw / 2, by + 240, '#263238', 'center', 22, 800, null);
  }
}

// ---------- Words ----------

const INTRO = {
  power: 'Power is how fast an appliance transfers energy: 1 watt (W) is 1 joule (J) every second. Switch on some appliances, and watch the meter count up the energy and the cost.',
  cost: 'How much energy an appliance transfers depends on its power and how long it’s on for: energy = power × time. Electricity is paid for in kilowatt-hours (kWh), sometimes called “units”.',
};
const WHY_POWER = `<p><b>Power</b> is the rate at which energy is transferred: the energy transferred every second. An energy transfer of 1 joule per second is a power of 1 watt (W), and 1 kilowatt (kW) is 1000 W.</p>
  <p>Switch two appliances on together and compare their bars: a 3000 W kettle transfers 3000 J every second, so its bar grows 300 times faster than a 10 W LED lamp’s.</p>
  <p>Appliances that heat things (showers, kettles, hairdryers, toasters) have the highest power ratings. An LED lamp gives about as much light as a 60 W filament lamp, for a sixth of the power, because so little is wasted heating the surroundings.</p>
  <p>The meter counts energy in <b>kilowatt-hours</b>: 1 kWh is the energy a 1 kW appliance transfers in 1 hour. That’s 1000 W × 3600 s = 3 600 000 J.</p>`;

function working() {
  const P = PK.num('pw'), u = pressed('tunit'), tv = PK.num('time'), t = jobT(), E = P * t, k = E / 3.6e6, cost = k * price();
  const tS = u === 's' ? `${tv} s` : `${tv} ${UNIT_WORD[u]} = ${tv} × ${SEC[u]} = ${spaced(t)} s`;
  const tH = u === 'h' ? `${tv} h` : `${tv} ${UNIT_WORD[u]} = ${tv} ÷ ${SEC[u] === 60 ? 60 : 3600} = ${sig(t / 3600)} h`;
  return `<div class="working">
    <p><span class="eq">E = P t</span> &nbsp; energy transferred = power × time</p>
    <p><b>In joules</b>, use power in W and time in seconds.<br>Time: ${tS}<br>E = ${spaced(P)} W × ${spaced(t)} s = <b>${PK.ans(joules(E))}</b></p>
    <p><b>In kilowatt-hours</b>, use power in kW and time in hours.<br>Power: ${spaced(P)} W = ${spaced(P)} ÷ 1000 = ${sig(P / 1000)} kW<br>Time: ${tH}<br>E = ${sig(P / 1000)} kW × ${sig(t / 3600)} h = <b>${PK.ans(`${sig(k)} kWh`)}</b></p>
    <p><b>Cost</b> = energy in kWh × price per kWh = ${PK.ans(`${sig(k)} × ${price()}p = ${pence(cost)}`)}</p>
    <p class="note" style="margin-bottom:0">Check: 1 kWh = 3 600 000 J, so ${PK.ans(`${joules(E)} ÷ 3 600 000 = ${sig(k)} kWh`)}.</p>
  </div>`;
}

function renderInfo() {
  if (state.tab === 'power') {
    const P = totalPower(), on = APPS.filter((a) => meter.on.has(a.id));
    let html = `<dl class="readout"><dt>Total power</dt><dd>${spaced(P)} W${P >= 1000 ? ` = ${sig(P / 1000)} kW` : ''}</dd><dt>Energy every second</dt><dd>${spaced(P)} J</dd></dl>`;
    if (!on.length) html += '<p>Nothing is switched on, so no energy is being transferred and the meter has stopped.</p>';
    else {
      const a = byId[meter.lastOn] && meter.on.has(meter.lastOn) ? byId[meter.lastOn] : on[0];
      html += `<p><b>${a.name}</b>: ${spaced(a.p)} W, so it transfers ${spaced(a.p)} J of energy every second. It transfers energy from the mains to ${a.to}.</p>`;
      if (on.length > 1) {
        const hi = on[0], lo = on[on.length - 1];
        if (hi.p > lo.p) html += `<p>The ${lc(hi.name)} has ${sig(hi.p / lo.p)} times the power of the ${lc(lo.name)}, so it transfers energy ${sig(hi.p / lo.p)} times as fast.</p>`;
      }
      html += `<p>Running these for an hour transfers ${sig(P / 1000)} kWh, which costs ${pence((P / 1000) * price())}.</p>`;
    }
    $('info').innerHTML = html;
    return;
  }
  const P = PK.num('pw'), E = jobE(), k = E / 3.6e6, a = byId[$('app2').value];
  let html = `<dl class="readout"><dt>Energy transferred</dt><dd>${PK.ans(joules(E))}</dd><dt>In kilowatt-hours</dt><dd>${PK.ans(`${sig(k)} kWh`)}</dd><dt>Cost</dt><dd>${PK.ans(pence(k * price()))}</dd></dl>`;
  html += `<p>A ${watts(P)} ${a ? lc(a.name) : 'appliance'} switched on for ${PK.num('time')} ${UNIT_WORD[pressed('tunit')]}. ${a ? `It transfers energy from the mains to ${a.to}.` : ''}</p>`;
  html += '<p>Double the power, or double the time, and the energy and the cost double too.</p>';
  $('info').innerHTML = html;
  $('explain').innerHTML = working();
}

// ---------- Practice questions, new every time ----------

const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = (xs) => xs[Math.floor(Math.random() * xs.length)];
// Appliance, lowest and highest power (W), and sensible times for it to be on
const GEN = [
  ['An electric heater', 2000, 3000, 'h', [1, 2, 3, 4, 5]],
  ['A kettle', 2000, 3000, 'min', [3, 4, 5, 6]],
  ['An electric shower', 8000, 10000, 'min', [6, 10, 12, 15, 20]],
  ['An electric oven', 2000, 3000, 'h', [0.5, 1, 1.5, 2]],
  ['An iron', 1000, 2500, 'min', [15, 20, 30, 45]],
  ['A television', 100, 200, 'h', [2, 3, 4, 5, 6]],
  ['A lamp', 40, 100, 'h', [3, 4, 5, 6, 8]],
  ['A hairdryer', 1500, 2000, 'min', [6, 10, 12, 15]],
];
function makeParams() {
  const k = pickOne(['kwh', 'cost', 'cost', 'meter', 'compare']);
  if (k === 'meter') { const a = rint(10000, 89999); return { k, a, b: a + rint(25, 450), c: rint(20, 34) }; }
  if (k === 'compare') return { k, i: rint(0, COMPARE.length - 1) };
  const g = rint(0, GEN.length - 1), [, lo, hi, u, ts] = GEN[g], step = hi >= 1000 ? 500 : 20;
  return { k, g, p: Math.round(rint(lo, hi) / step) * step, u, t: pickOne(ts), c: rint(15, 34) };
}
// Each compare question puts a high power on for a short time against a low power for a long time.
// Sometimes the low power costs more, sometimes not: you have to work out the energy.
const COMPARE = [
  [['a 9 kW electric shower', 9, 10, 'min'], ['a 150 W fridge', 0.15, 24, 'h']],
  [['a 3 kW kettle', 3, 4, 'min'], ['a 60 W filament lamp', 0.06, 5, 'h']],
  [['a 2 kW hairdryer', 2, 6, 'min'], ['a 100 W television', 0.1, 3, 'h']],
  [['a 2 kW heater', 2, 3, 'h'], ['a 10 W LED lamp', 0.01, 10, 'h']],
  [['a 9 kW electric shower', 9, 15, 'min'], ['a 200 W games console', 0.2, 4, 'h']],
];
function buildQ(p) {
  const base = { id: `gen-${JSON.stringify(p)}`, lv: 'both', topic: 'electricity', tool: 'Paying for electricity', pg: 'electricity-cost', gen: true, p };
  if (p.k === 'meter') {
    const units = p.b - p.a, cost = (units * p.c) / 100;
    return { ...base, type: 'num', q: `An electricity meter read ${spaced(p.a)} kWh at the start of a month and ${spaced(p.b)} kWh at the end. Electricity costs ${p.c}p per kWh. How much did the month’s electricity cost, in pounds?`, num: cost, numText: cost.toFixed(2), unit: 'pounds (£)',
      exp: `Energy used = ${spaced(p.b)} − ${spaced(p.a)} = ${units} kWh. Cost = ${units} × ${p.c}p = ${spaced(units * p.c)}p = £${cost.toFixed(2)}.` };
  }
  if (p.k === 'compare') {
    const [A, B] = COMPARE[p.i], e = (x) => x[1] * (x[3] === 'h' ? x[2] : x[2] / 60);
    const [eA, eB] = [e(A), e(B)], more = eA > eB ? A : B;
    const opts = [`${more[0][0].toUpperCase()}${more[0].slice(1)}`, `${(more === A ? B : A)[0][0].toUpperCase()}${(more === A ? B : A)[0].slice(1)}`, 'They cost the same'];
    const words = (x) => `${x[2]} ${x[3] === 'h' ? (x[2] === 1 ? 'hour' : 'hours') : 'minutes'}`;
    return { ...base, type: 'mc', q: `Which costs more to run: ${A[0]} used for ${words(A)}, or ${B[0]} used for ${words(B)}?`, opts, ans: [0],
      exp: `Energy = power × time. ${A[0][0].toUpperCase()}${A[0].slice(1)}: ${A[1]} kW × ${sig(e(A) / A[1])} h = ${sig(eA)} kWh. ${B[0][0].toUpperCase()}${B[0].slice(1)}: ${B[1]} kW × ${sig(e(B) / B[1])} h = ${sig(eB)} kWh. The cost depends on the energy, not just the power.` };
  }
  const [what] = GEN[p.g], kW = p.p / 1000, h = p.u === 'h' ? p.t : p.t / 60, E = kW * h;
  const tw = p.u === 'h' ? `${p.t} ${p.t === 1 ? 'hour' : 'hours'}` : `${p.t} minutes`;
  const tStep = p.u === 'h' ? '' : `${p.t} minutes = ${p.t} ÷ 60 = ${sig(h)} h. `;
  if (p.k === 'kwh') {
    return { ...base, type: 'num', q: `${what} has a power of ${spaced(p.p)} W. It is switched on for ${tw}. How much energy does it transfer, in kWh?`, num: E, numText: sig(E), unit: 'kWh',
      exp: `${spaced(p.p)} W = ${sig(kW)} kW. ${tStep}E = P t = ${sig(kW)} kW × ${sig(h)} h = ${sig(E)} kWh.` };
  }
  const cost = E * p.c;
  return { ...base, type: 'num', q: `${what} has a power of ${spaced(p.p)} W. It is switched on for ${tw}. Electricity costs ${p.c}p per kWh. How much does this cost, in pence?`, num: cost, numText: sig(cost), unit: 'p',
    exp: `${spaced(p.p)} W = ${sig(kW)} kW. ${tStep}Energy = ${sig(kW)} kW × ${sig(h)} h = ${sig(E)} kWh. Cost = ${sig(E)} kWh × ${p.c}p = ${sig(cost)}p.` };
}
function validParams(o) {
  const int = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
  if (!o || typeof o !== 'object') return false;
  if (o.k === 'meter') return int(o.a, 0, 999999) && int(o.b, o.a + 1, o.a + 5000) && int(o.c, 1, 100);
  if (o.k === 'compare') return int(o.i, 0, COMPARE.length - 1);
  if (o.k === 'kwh' || o.k === 'cost') return int(o.g, 0, GEN.length - 1) && int(o.p, 1, 20000) && ['h', 'min'].includes(o.u) && typeof o.t === 'number' && o.t > 0 && o.t <= 600 && int(o.c, 1, 100);
  return false;
}
PK.practiceGen = { make: () => buildQ(makeParams()), encode: (q) => q.p, decode: (o) => (validParams(o) ? buildQ(o) : null), share: 0.5 };

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('explain-h').textContent = t === 'power' ? 'Why?' : 'Working it out';
  if (t === 'power') $('explain').innerHTML = WHY_POWER;
  cv.setAttribute('aria-label', t === 'power' ? 'A smart meter, and the energy transferred by each appliance' : 'An appliance and an electricity meter');
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'power' ? location.pathname + location.search : `#${t}`);
  renderInfo();
  size();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#clock .chip').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#clock .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
}));
$('alloff').addEventListener('click', () => { meter.on.clear(); renderApps(); renderInfo(); });
$('zero').addEventListener('click', () => { meter.t = 0; meter.E = 0; meter.each = {}; renderInfo(); });
$('price').addEventListener('input', renderInfo);

$('app2').innerHTML = APPS.map((a) => `<option value="${a.id}">${a.name} (${spaced(a.p)} W)</option>`).join('') + '<option value="other">Something else</option>';
$('app2').value = 'kettle';
$('app2').addEventListener('change', () => { const a = byId[$('app2').value]; if (a) PK.setNum('pw', a.p); resetJob(); });
$('pw').addEventListener('input', () => {
  const a = byId[$('app2').value];
  if (a && a.p !== PK.num('pw')) $('app2').value = (APPS.find((x) => x.p === PK.num('pw')) || { id: 'other' }).id;
  resetJob();
});
$('time').addEventListener('input', resetJob);
document.querySelectorAll('#tunit .chip').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#tunit .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  $('time-unit').textContent = UNIT_SHORT[b.dataset.v];
  resetJob();
}));
$('run').addEventListener('click', () => { if (job.run >= 1) newReading(); job.run = 0; job.running = true; syncRun(); renderInfo(); });
$('reset').addEventListener('click', () => { newReading(); resetJob(); });
window.addEventListener('pk-answers', renderInfo);

// Which appliances are on goes in a shared link
PK.shareState = {
  get: () => ({ on: [...meter.on] }),
  set: (o) => { if (o && Array.isArray(o.on)) { meter.on = new Set(o.on.filter((id) => byId[id])); renderApps(); renderInfo(); } },
};

function size() {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  if (state.tab === 'power') stepMeter(dt); else stepJob(dt);
  if (cv.clientWidth) {
    const c = colours();
    ctx.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    ctx.fillStyle = c.surface; ctx.fillRect(0, 0, W, H);
    if (state.tab === 'power') drawPower(c); else drawCost(c);
  }
  requestAnimationFrame(frame);
}

newReading();
renderApps();
syncRun();
showTab(PK.initialHash === '#cost' ? 'cost' : 'power');
requestAnimationFrame(frame);
