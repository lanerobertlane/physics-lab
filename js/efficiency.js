// Efficiency: work out the efficiency of a device from a Sankey diagram, step by step, and
// practise questions finding the efficiency, useful output, total input or wasted energy.
// efficiency = useful output ÷ total input (energy or power).

PK.header({
  title: 'Efficiency',
  answers: true,
  spec: [
    { code: '4.1.2.1', text: 'Energy transfers in a system: wasted energy is dissipated; ways of reducing unwanted transfers (lubrication, thermal insulation)' },
    { code: '4.1.2.2', text: 'Efficiency = useful output energy transfer ÷ total input energy transfer, and = useful power output ÷ total power input; expressed as a decimal or a percentage' },
    { code: '4.1.2.2', text: 'Describe ways to increase the efficiency of an intended energy transfer', ht: true },
    { code: 'KS3', text: 'Energy changes and transfers; comparing efficiency; wasted energy; Sankey diagrams' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';
const num = (x) => Number(x.toPrecision(10)).toLocaleString('en-GB', { maximumFractionDigits: 3 });
const pct = (e) => `${num(e * 100)}%`;

// ---------- Devices ----------

const DEVICES = [
  { icon: '💡', name: 'filament lamp', short: 'light', power: 60, eff: 0.1, useful: 'light', wasted: 'heating the surroundings',
    improve: 'Swapping to an LED lamp gives the same light for much less power.' },
  { icon: '🔆', name: 'LED lamp', short: 'light', power: 8, eff: 0.4, useful: 'light', wasted: 'heating the surroundings',
    improve: 'LEDs waste far less energy heating their surroundings than filament lamps.' },
  { icon: '🫖', name: 'kettle', short: 'heating the water', power: 2000, eff: 0.9, useful: 'the thermal energy store of the water', wasted: 'heating the kettle and the air, and sound',
    improve: 'Thermal insulation around the kettle reduces the energy lost to the surroundings. Only boil the water you need.' },
  { icon: '🔧', name: 'electric drill', short: 'kinetic energy', power: 600, eff: 0.7, useful: 'the kinetic energy store of the drill bit', wasted: 'heating (friction and resistance) and sound',
    improve: 'Lubricating the moving parts reduces friction, so less energy is wasted heating them.' },
  { icon: '🚗', name: 'car engine', short: 'kinetic energy', power: 60000, eff: 0.3, useful: 'the kinetic energy store of the car', wasted: 'heating the engine, exhaust gases and surroundings, and sound',
    improve: 'Lubrication, streamlining the car to cut air resistance, and keeping the tyres pumped up all reduce wasted energy.' },
  { icon: '🔌', name: 'phone charger', short: 'charging the battery', power: 10, eff: 0.8, useful: 'the chemical energy store of the battery', wasted: 'heating the charger and phone',
    improve: 'A well-designed charger gets less hot, so it wastes less energy.' },
  { icon: '☀', name: 'solar panel', short: 'electricity', power: 1000, eff: 0.2, useful: 'electrical work', wasted: 'heating the panel, and reflected light',
    improve: 'Keeping panels clean and angled towards the Sun helps them capture more of the light.' },
  { icon: '🏭', name: 'gas power station', short: 'electricity', power: 500e6, eff: 0.5, useful: 'electrical work for the National Grid', wasted: 'heating the surroundings (cooling towers)',
    improve: 'Some power stations use their waste heat to heat nearby homes, making better use of the fuel.' },
];
const TIME = 10;   // seconds, for the energy version
const state = { tab: 'device', dev: 2, units: 'energy', count: false };

function deviceValues() {
  const d = DEVICES[state.dev], power = state.units === 'power';
  const total = power ? d.power : d.power * TIME;
  return { d, total, useful: total * d.eff, unit: power ? 'W' : 'J', power };
}

// ---------- Sankey diagram ----------

// Draw a Sankey diagram to scale on squared paper: 10 squares wide = the total input
function drawSankey(cv, { total, useful, unit, usefulName, wastedName, numbers, hideWasted }) {
  const ctx = cv.getContext('2d'), W = 800, H = 340, S = 18;
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(0, 0, W, H);
  // Squared paper
  ctx.strokeStyle = PK.isDark() ? 'rgba(255,255,255,.08)' : 'rgba(30, 99, 198, .12)'; ctx.lineWidth = 1;
  for (let x = 40; x <= 760; x += S) { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, H - 4); ctx.stroke(); }
  for (let y = 4; y <= H; y += S) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(760, y); ctx.stroke(); }
  const e = useful / total, Hin = 10 * S, hu = Math.round(e * 10) * S, hw = Hin - hu;
  const x0 = 202, y0 = 40, xs = 382, xEnd = 634;
  // Input band
  ctx.fillStyle = '#90a4ae'; ctx.fillRect(x0, y0, xs - x0, Hin);
  // Useful band, straight on
  ctx.fillStyle = '#43a047';
  if (hu > 0) { ctx.fillRect(xs, y0, xEnd - xs, hu); ctx.beginPath(); ctx.moveTo(xEnd, y0 - 8); ctx.lineTo(xEnd + 30, y0 + hu / 2); ctx.lineTo(xEnd, y0 + hu + 8); ctx.closePath(); ctx.fill(); }
  // Wasted band, turning downwards
  if (hw > 0) {
    const r = 18, cx = xs, cy = y0 + Hin + r;
    ctx.fillStyle = '#e53935'; ctx.beginPath();
    ctx.moveTo(xs, y0 + hu); ctx.arc(cx, cy, hw + r, -Math.PI / 2, 0); ctx.lineTo(cx + hw + r, H - 34);
    ctx.lineTo(cx + r, H - 34); ctx.arc(cx, cy, r, 0, -Math.PI / 2, true); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + r - 8, H - 34); ctx.lineTo(cx + r + hw / 2, H - 6); ctx.lineTo(cx + hw + r + 8, H - 34); ctx.closePath(); ctx.fill();
  }
  const ink = PK.cssVar('--text'), per = total / 10;
  const say = (t, x, y, o = {}) => { ctx.fillStyle = o.col || ink; ctx.font = `${o.w || 700} ${o.s || 13}px ${font()}`; ctx.textAlign = o.a || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); };
  say('Total input', x0 - 12, y0 + Hin / 2 - 10, { a: 'right', w: 800 });
  say(numbers ? `${num(total)} ${unit}` : '? (count the squares)', x0 - 12, y0 + Hin / 2 + 10, { a: 'right' });
  say(usefulName ? `Useful: ${usefulName}` : 'Useful', xEnd + 40, y0 + hu / 2 - 10, { a: 'left', w: 800, col: '#2e7d32' });
  say(numbers ? `${num(useful)} ${unit}` : '?', xEnd + 40, y0 + hu / 2 + 10, { a: 'left' });
  say(`Wasted: ${wastedName}`, xs + hw + 48, H - 52, { a: 'left', w: 800, col: '#c62828' });
  say(numbers && !hideWasted ? `${num(total - useful)} ${unit}` : hideWasted && numbers ? PK.ansText(`${num(total - useful)} ${unit}`) : '?', xs + hw + 48, H - 32, { a: 'left' });
  // Scale
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(44, H - 34, 148, 26);
  ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.strokeRect(50, H - 28, S, S);
  say(`= ${num(per)} ${unit}`, 50 + S + 8, H - 28 + S / 2, { a: 'left', s: 13 });
}

// ---------- Work it out for a device ----------

const an = (w) => (/^(LED|[aeiou])/i.test(w) ? 'an' : 'a');
const v = (label, val) => `<span class="v">${label} = ${val}</span>`;
function renderDevice() {
  const { d, total, useful, unit, power } = deviceValues();
  document.querySelectorAll('#devices .btn').forEach((b, i) => b.setAttribute('aria-pressed', String(i === state.dev)));
  if (state.count) $('d-question').innerHTML = `The Sankey diagram shows the ${power ? 'power' : `energy transferred in ${TIME} seconds`} for ${an(d.name)} ${d.name}. Use the scale to find the total input and the useful output, then calculate the efficiency.`;
  else if (power) $('d-question').innerHTML = `${an(d.name) === 'an' ? 'An' : 'A'} ${d.name} has a total power input of <b>${num(total)} W</b>. Its useful power output is <b>${num(useful)} W</b>, transferred to ${d.useful}. Calculate its efficiency.`;
  else $('d-question').innerHTML = `In ${TIME} seconds, ${an(d.name)} ${d.name} is supplied with <b>${num(total)} J</b> of energy. <b>${num(useful)} J</b> is usefully transferred to ${d.useful}. Calculate its efficiency.`;
  const eq = power ? 'efficiency = useful power output ÷ total power input' : 'efficiency = useful output energy transfer ÷ total input energy transfer';
  const tv = state.count ? PK.ans(`${num(total)} ${unit}`) : `${num(total)} ${unit}`;
  const uv = state.count ? PK.ans(`${num(useful)} ${unit}`) : `${num(useful)} ${unit}`;
  $('d-steps').innerHTML = `
    <div>${v(power ? 'total power input' : 'total input', tv)}${v(power ? 'useful power output' : 'useful output', uv)}${v('efficiency', '?')}</div>
    <div>${eq}</div>
    <div>efficiency = ${PK.ans(`${num(useful)} ÷ ${num(total)}`)}</div>
    <div class="ans">efficiency = ${PK.ans(`${num(d.eff)} (or ${pct(d.eff)})`)}</div>`;
  $('d-answer').value = ''; $('d-feedback').textContent = ''; $('d-feedback').className = 'feedback';
  $('improve').innerHTML = `<b>Wasted:</b> ${d.wasted}. <b>Improving it:</b> ${d.improve}`;
  drawDevice();
}
function drawDevice() {
  const { d, total, useful, unit } = deviceValues();
  drawSankey($('sankey'), { total, useful, unit, usefulName: d.short, wastedName: d.wasted.split(/,| and /)[0], numbers: !state.count, hideWasted: true });
}

// Mark an efficiency answer, spotting the usual mistakes
function parseEff(s) {
  const t = String(s).trim().replace(/,/g, '');
  if (!t) return null;
  const isPct = t.endsWith('%'), v = parseFloat(t);
  return Number.isFinite(v) ? { v, isPct } : null;
}
const close = (a, b) => Math.abs(a - b) <= Math.max(0.005, Math.abs(b) * 0.01);
function markEff(input, e) {
  const p = parseEff(input);
  if (!p) return ['bad', 'Type your answer as a decimal (like 0.25) or a percentage (like 25%).'];
  const asDec = p.isPct ? p.v / 100 : p.v;
  if (close(asDec, e)) return ['ok', `Correct! Efficiency = ${num(e)}, which is ${pct(e)}.`];
  if (!p.isPct && close(p.v, e * 100)) return ['ok', `Correct, ${pct(e)}. Remember to write the % sign: as a decimal it is ${num(e)}.`];
  if (close(asDec, 1 / e) || close(p.v, 100 / e)) return ['bad', 'That’s more than 1, so it can’t be right: you’ve divided the wrong way round. Do useful ÷ total.'];
  if (close(asDec, 1 - e) || close(p.v, (1 - e) * 100)) return ['bad', 'That’s the fraction that is wasted. Use the useful output, not the wasted energy.'];
  if (asDec > 1) return ['bad', 'Efficiency can’t be more than 1 (100%). Check which number goes on top: useful ÷ total.'];
  return ['bad', 'Not quite. Divide the useful output by the total input.'];
}
function checkDevice() {
  const [k, msg] = markEff($('d-answer').value, DEVICES[state.dev].eff);
  $('d-feedback').textContent = msg; $('d-feedback').className = `feedback ${k}`;
}

// ---------- Practice questions ----------

const CONTEXTS = [
  ['An electric motor', 'the kinetic energy store of the load it lifts'], ['A light bulb', 'light'], ['A loudspeaker', 'sound'],
  ['A hair dryer', 'heating and moving the air'], ['An electric heater', 'heating the room'], ['A television', 'light and sound'],
  ['A wind turbine', 'electrical work'], ['A food mixer', 'the kinetic energy store of the blades'], ['A washing machine motor', 'turning the drum'],
];
const TOTALS = [200, 400, 500, 800, 1000, 1200, 1500, 2000, 2500, 4000, 5000, 12000, 60000];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const P = { n: 0, right: 0, tried: 0, q: null, ...(PK.store.get('score.efficiency', null) || {}) };

function newPractice() {
  const type = pick(['eff', 'eff', 'useful', 'total', 'wasted', 'sankey']);
  const [who, use] = pick(CONTEXTS);
  const power = Math.random() < 0.4 && type !== 'sankey';
  const total = pick(TOTALS), eff = pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95].filter((x) => type !== 'sankey' || Math.abs(x * 10 - Math.round(x * 10)) < 1e-9));
  const useful = total * eff, unit = power ? 'W' : 'J';
  const inWord = power ? 'total power input' : 'total input energy', outWord = power ? 'useful power output' : 'useful output energy';
  let text, label, ans, kind = 'num', u = unit;
  if (type === 'eff') { text = `${who} has a ${inWord} of <b>${num(total)} ${unit}</b>. Its ${outWord} is <b>${num(useful)} ${unit}</b> (${use}). Calculate its efficiency.`; label = 'Efficiency ='; ans = eff; kind = 'eff'; u = ''; }
  if (type === 'useful') text = `${who} has a ${inWord} of <b>${num(total)} ${unit}</b> and an efficiency of <b>${pct(eff)}</b>. Calculate its ${outWord}.`, label = `${outWord.charAt(0).toUpperCase()}${outWord.slice(1)} =`, ans = useful;
  if (type === 'total') text = `${who} has an efficiency of <b>${pct(eff)}</b>. Its ${outWord} is <b>${num(useful)} ${unit}</b>. Calculate its ${inWord}.`, label = `${inWord.charAt(0).toUpperCase()}${inWord.slice(1)} =`, ans = total;
  if (type === 'wasted') text = `${who} has a ${inWord} of <b>${num(total)} ${unit}</b> and an efficiency of <b>${pct(eff)}</b>. How much ${power ? 'power is' : 'energy is'} wasted?`, label = `Wasted ${power ? 'power' : 'energy'} =`, ans = total - useful;
  if (type === 'sankey') { text = `The Sankey diagram shows the energy transferred by ${who.toLowerCase()}. Use the scale to calculate its efficiency.`; label = 'Efficiency ='; ans = eff; kind = 'eff'; u = ''; }
  P.q = { type, total, useful, eff, unit, power, ans, kind, use, who };
  P.n++;
  $('p-num').textContent = P.n;
  $('p-question').innerHTML = text;
  $('p-label').textContent = label; $('p-unit').textContent = u;
  $('p-answer').value = ''; $('p-answer').placeholder = kind === 'eff' ? 'e.g. 0.25 or 25%' : '';
  $('p-feedback').textContent = ''; $('p-feedback').className = 'feedback';
  $('p-method').open = false;
  $('p-stage').hidden = type !== 'sankey';
  if (type === 'sankey') { sizeCanvas($('psankey')); drawPracticeSankey(); }
  renderPracticeSteps();
}
function drawPracticeSankey() {
  const q = P.q;
  drawSankey($('psankey'), { total: q.total, useful: q.useful, unit: 'J', usefulName: '', wastedName: 'heating', numbers: false });
}
function renderPracticeSteps() {
  const q = P.q, U = q.unit, ew = q.power ? 'power' : 'energy';
  const eqE = q.power ? 'efficiency = useful power output ÷ total power input' : 'efficiency = useful output energy transfer ÷ total input energy transfer';
  let lines;
  if (q.type === 'eff' || q.type === 'sankey') lines = [
    `${v('total input', `${num(q.total)} ${U}`)}${v('useful output', `${num(q.useful)} ${U}`)}${v('efficiency', '?')}`,
    q.type === 'sankey' ? `(10 squares × ${num(q.total / 10)} J = ${num(q.total)} J in; ${Math.round(q.eff * 10)} squares × ${num(q.total / 10)} J = ${num(q.useful)} J useful)` : null,
    eqE, `efficiency = ${num(q.useful)} ÷ ${num(q.total)}`, `<span class="ans">efficiency = ${num(q.eff)} (or ${pct(q.eff)})</span>`];
  if (q.type === 'useful') lines = [
    `${v('total input', `${num(q.total)} ${U}`)}${v('efficiency', `${pct(q.eff)} = ${num(q.eff)}`)}${v(`useful ${ew}`, '?')}`,
    eqE, `${num(q.eff)} = useful ÷ ${num(q.total)}`, `useful = ${num(q.eff)} × ${num(q.total)}`, `<span class="ans">useful output = ${num(q.useful)} ${U}</span>`];
  if (q.type === 'total') lines = [
    `${v('useful output', `${num(q.useful)} ${U}`)}${v('efficiency', `${pct(q.eff)} = ${num(q.eff)}`)}${v('total input', '?')}`,
    eqE, `${num(q.eff)} = ${num(q.useful)} ÷ total`, `total = ${num(q.useful)} ÷ ${num(q.eff)}`, `<span class="ans">total input = ${num(q.total)} ${U}</span>`];
  if (q.type === 'wasted') lines = [
    `${v('total input', `${num(q.total)} ${U}`)}${v('efficiency', `${pct(q.eff)} = ${num(q.eff)}`)}${v('wasted', '?')}`,
    eqE, `useful = ${num(q.eff)} × ${num(q.total)} = ${num(q.useful)} ${U}`, `wasted = total − useful = ${num(q.total)} − ${num(q.useful)}`, `<span class="ans">wasted = ${num(q.total - q.useful)} ${U}</span>`];
  $('p-steps').innerHTML = lines.filter(Boolean).map((l) => `<div>${l}</div>`).join('');
}
function checkPractice() {
  const q = P.q;
  let k, msg;
  if (q.kind === 'eff') [k, msg] = markEff($('p-answer').value, q.eff);
  else {
    const g = parseFloat(String($('p-answer').value).replace(/,/g, ''));
    if (!Number.isFinite(g)) { k = 'bad'; msg = 'Type a number.'; }
    else if (close(g, q.ans)) { k = 'ok'; msg = `Correct! ${num(q.ans)} ${q.unit}.`; }
    else if (q.type === 'useful' && close(g, q.total - q.useful)) { k = 'bad'; msg = 'That’s the wasted part. Useful = efficiency × total.'; }
    else if (q.type === 'wasted' && close(g, q.useful)) { k = 'bad'; msg = 'That’s the useful part. Now take it away from the total.'; }
    else if (close(g, q.ans * 100) || close(g, q.ans / 100)) { k = 'bad'; msg = 'Check the efficiency: use it as a decimal (e.g. 25% = 0.25).'; }
    else if (q.type === 'total' && close(g, q.useful * q.eff)) { k = 'bad'; msg = 'Divide, don’t multiply: total = useful ÷ efficiency.'; }
    else { k = 'bad'; msg = 'Not quite. Have a look at the worked answer.'; }
  }
  P.tried++; if (k === 'ok') P.right++;
  $('p-feedback').textContent = msg; $('p-feedback').className = `feedback ${k}`;
  PK.store.set('score.efficiency', { right: P.right, tried: P.tried });
  $('p-score').textContent = `${P.right} right out of ${P.tried}`;
}

// ---------- Controls ----------

function sizeCanvas(cv) { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (340 / 800) * dpr); }
$('devices').innerHTML = DEVICES.map((d, i) => `<button class="btn" data-i="${i}">${d.icon} ${d.name.charAt(0).toUpperCase()}${d.name.slice(1)}</button>`).join('');
$('devices').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { state.dev = Number(b.dataset.i); renderDevice(); } });
document.querySelectorAll('#units .chip').forEach((b) => b.addEventListener('click', () => {
  state.units = b.dataset.u;
  document.querySelectorAll('#units .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  renderDevice();
}));
$('count').addEventListener('change', (e) => { state.count = e.target.checked; renderDevice(); });
$('d-check').addEventListener('click', checkDevice);
$('d-answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkDevice(); });
$('p-check').addEventListener('click', checkPractice);
$('p-answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPractice(); });
$('p-next').addEventListener('click', newPractice);
$('p-method').classList.add('hide-when-no-answers');

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-tab]').forEach((el) => { el.hidden = el.dataset.tab !== t; });
  if (t === 'device') { sizeCanvas($('sankey')); drawDevice(); }
  if (t === 'practice') { if (!P.q) newPractice(); else if (P.q.type === 'sankey') { sizeCanvas($('psankey')); drawPracticeSankey(); } }
  window.history.replaceState(null, '', `#${t}`);
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
const redraw = () => { if (state.tab === 'device') { sizeCanvas($('sankey')); drawDevice(); } else if (P.q && P.q.type === 'sankey') { sizeCanvas($('psankey')); drawPracticeSankey(); } };
window.addEventListener('resize', redraw);
window.addEventListener('pk-theme', redraw);
window.addEventListener('pk-answers', () => { renderDevice(); if (P.q) renderPracticeSteps(); redraw(); });

renderDevice();
showTab(location.hash.slice(1) === 'practice' ? 'practice' : 'device');
if (P.tried) $('p-score').textContent = `${P.right} right out of ${P.tried}`;
