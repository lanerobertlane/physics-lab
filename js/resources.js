// Energy resources: build a mix of power stations to meet a day's demand for electricity,
// and compare the main resources. Numbers are simplified, roughly like the UK.

PK.header({
  title: 'Energy resources',
  answers: true,
  spec: [
    { code: '4.1.3', text: 'National and global energy resources: fossil fuels, nuclear, biofuel, wind, hydro-electricity, geothermal, tides, the Sun and water waves; renewable and non-renewable; reliability and environmental impact' },
    { code: 'KS3', text: 'Fuels and energy resources; comparing the costs and benefits of different ways of generating electricity' },
  ],
});

const $ = (id) => document.getElementById(id);
const font = () => PK.cssVar('--font-body') || 'sans-serif';

// ---------- Meet the demand ----------

const SOURCES = [
  { k: 'nuclear', name: 'Nuclear', col: '#8e24aa', max: 15, co2: 0, renew: false, kind: 'base' },
  { k: 'wind', name: 'Wind', col: '#29b6f6', max: 40, co2: 0, renew: true, kind: 'wind' },
  { k: 'solar', name: 'Solar', col: '#fdd835', max: 40, co2: 0, renew: true, kind: 'solar' },
  { k: 'hydro', name: 'Hydro-electric', col: '#26a69a', max: 6, co2: 0, renew: true, kind: 'fill' },
  { k: 'gas', name: 'Gas', col: '#ff7043', max: 40, co2: 0.37, renew: false, kind: 'fill' },
  { k: 'coal', name: 'Coal', col: '#5d4037', max: 30, co2: 0.9, renew: false, kind: 'fill' },
];
const state = { tab: 'demand', season: 'winter', wind: 0.35, sun: 1, cap: { nuclear: 6, wind: 15, solar: 10, hydro: 2, gas: 28, coal: 4 }, filter: 'all' };

// Demand in GW through the day (24 values, one per hour)
function demand(h) {
  const base = 26 + 8 * Math.exp(-(((h - 8.5) / 2.2) ** 2)) + 5 * Math.sin(Math.max(0, Math.min(1, (h - 7) / 10)) * Math.PI) + 13 * Math.exp(-(((h - 18) / 2) ** 2)) - 6 * Math.exp(-(((h - 3.5) / 3) ** 2));
  return state.season === 'winter' ? base : base * 0.72;
}
function solarFactor(h) {
  const [rise, set] = state.season === 'summer' ? [5, 21] : [8, 16];
  if (h <= rise || h >= set) return 0;
  return Math.sin(((h - rise) / (set - rise)) * Math.PI) * state.sun * (state.season === 'summer' ? 1 : 0.45);
}
const windFactor = (h) => Math.max(0, Math.min(1, state.wind * (1 + 0.25 * Math.sin((h / 24) * Math.PI * 2 + 1))));

function simulate() {
  const hours = [];
  for (let h = 0; h <= 24; h += 0.25) {
    const d = demand(h), out = {};
    out.nuclear = state.cap.nuclear;
    out.wind = state.cap.wind * windFactor(h);
    out.solar = state.cap.solar * solarFactor(h);
    let need = d - out.nuclear - out.wind - out.solar;
    const spare = Math.max(0, -need);
    for (const k of ['hydro', 'gas', 'coal']) { out[k] = Math.max(0, Math.min(state.cap[k], need)); need -= out[k]; }
    hours.push({ h, d, out, short: Math.max(0, need), spare });
  }
  return hours;
}

const cv = $('day'), ctx = cv.getContext('2d');
const W = 800, H = 380, G = { x: 60, y: 20, w: 720, h: 300 };
function size() { const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientWidth * (H / W) * dpr); }
function drawDay() {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PK.cssVar('--surface'); ctx.fillRect(0, 0, W, H);
  const hrs = simulate();
  const maxY = 60, X = (h) => G.x + (h / 24) * G.w, Y = (v) => G.y + G.h - (v / maxY) * G.h;
  // Grid
  ctx.strokeStyle = PK.cssVar('--border'); ctx.lineWidth = 1;
  ctx.fillStyle = PK.cssVar('--muted'); ctx.font = `600 11px ${font()}`;
  for (let v = 0; v <= maxY; v += 10) { ctx.beginPath(); ctx.moveTo(G.x, Y(v)); ctx.lineTo(G.x + G.w, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(v, G.x - 6, Y(v)); }
  for (let h = 0; h <= 24; h += 3) { ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(`${String(h).padStart(2, '0')}:00`, X(h), G.y + G.h + 6); }
  ctx.save(); ctx.translate(16, G.y + G.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 12px ${font()}`; ctx.fillText('Power (GW)', 0, 0); ctx.restore();
  // Stacked areas
  const order = ['nuclear', 'wind', 'solar', 'hydro', 'gas', 'coal'];
  const stack = hrs.map(() => 0);
  for (const key of order) {
    const S = SOURCES.find((s) => s.k === key);
    ctx.fillStyle = S.col; ctx.globalAlpha = 0.9; ctx.beginPath();
    hrs.forEach((p, i) => { const y = Y(stack[i] + p.out[key]); if (i) ctx.lineTo(X(p.h), y); else ctx.moveTo(X(p.h), y); });
    for (let i = hrs.length - 1; i >= 0; i--) ctx.lineTo(X(hrs[i].h), Y(stack[i]));
    ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    hrs.forEach((p, i) => { stack[i] += p.out[key]; });
  }
  // Shortfall
  ctx.fillStyle = 'rgba(229, 57, 53, .35)';
  ctx.beginPath(); hrs.forEach((p, i) => { const y = Y(stack[i] + p.short); if (i) ctx.lineTo(X(p.h), y); else ctx.moveTo(X(p.h), y); });
  for (let i = hrs.length - 1; i >= 0; i--) ctx.lineTo(X(hrs[i].h), Y(stack[i])); ctx.closePath(); ctx.fill();
  // Demand line
  ctx.strokeStyle = PK.cssVar('--text'); ctx.lineWidth = 3; ctx.setLineDash([]);
  ctx.beginPath(); hrs.forEach((p, i) => (i ? ctx.lineTo(X(p.h), Y(p.d)) : ctx.moveTo(X(p.h), Y(p.d)))); ctx.stroke();
  ctx.fillStyle = PK.cssVar('--text'); ctx.font = `800 12px ${font()}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  const peak = hrs.reduce((a, b) => (b.d > a.d ? b : a));
  ctx.fillText('demand', X(peak.h) + 8, Y(peak.d) - 4);
  // Key
  let kx = G.x + 8;
  ctx.font = `700 11px ${font()}`; ctx.textBaseline = 'middle';
  for (const S of SOURCES) { ctx.fillStyle = S.col; ctx.fillRect(kx, G.y + 6, 11, 11); ctx.fillStyle = PK.cssVar('--text'); ctx.textAlign = 'left'; ctx.fillText(S.name, kx + 15, G.y + 12); kx += ctx.measureText(S.name).width + 32; }
  ctx.fillStyle = 'rgba(229, 57, 53, .6)'; ctx.fillRect(kx, G.y + 6, 11, 11); ctx.fillStyle = PK.cssVar('--text'); ctx.fillText('not enough!', kx + 15, G.y + 12);
  return hrs;
}

function renderResult() {
  const hrs = drawDay(), dt = 0.25;
  let energy = 0, renew = 0, co2 = 0, shortH = 0, spareE = 0;
  for (const p of hrs.slice(0, -1)) {
    for (const S of SOURCES) { const e = p.out[S.k] * dt; energy += e; if (S.renew) renew += e; co2 += e * S.co2; }
    if (p.short > 0.05) shortH += dt;
    spareE += p.spare * dt;
  }
  const pct = energy ? (renew / energy) * 100 : 0;
  $('result').innerHTML = `
    <dt>Electricity supplied</dt><dd>${Math.round(energy)} GWh</dd>
    <dt>From renewables</dt><dd>${Math.round(pct)}%</dd>
    <dt>Carbon dioxide released</dt><dd>${Math.round(co2)} thousand tonnes</dd>
    <dt>Time with not enough electricity</dt><dd>${shortH ? `${shortH} hours` : 'none'}</dd>
    <dt>Wasted (too much at once)</dt><dd>${spareE > 0.5 ? `${Math.round(spareE)} GWh` : 'none'}</dd>`;
  let v;
  if (shortH > 0) v = '❌ <b>Blackouts!</b> Demand isn’t met at some times of day. Add more power stations that can be turned up when needed, such as gas or hydro.';
  else if (spareE > 20) v = '⚠️ Demand is met, but at times there is <b>far more electricity than needed</b> from wind, solar or nuclear, and it is wasted. Energy storage, such as pumped hydro or batteries, would help.';
  else if (co2 > 300) v = '⚠️ Demand is met, but a lot of <b>carbon dioxide</b> is released, which adds to climate change. Can you use more renewables and still keep the lights on?';
  else v = `✅ <b>Demand met</b>, with ${Math.round(pct)}% from renewables. Now try it on a calm, cloudy winter evening!`;
  $('verdict').innerHTML = v;
}

function renderSliders() {
  $('sliders').innerHTML = SOURCES.map((S) => `<div class="ctl"><label for="c-${S.k}"><span><i style="background:${S.col}"></i>${S.name}</span><b id="v-${S.k}">${state.cap[S.k]} GW</b></label><input type="range" id="c-${S.k}" min="0" max="${S.max}" step="1" value="${state.cap[S.k]}"></div>`).join('');
  for (const S of SOURCES) $(`c-${S.k}`).addEventListener('input', (e) => { state.cap[S.k] = Number(e.target.value); $(`v-${S.k}`).textContent = `${state.cap[S.k]} GW`; renderResult(); });
}

// ---------- Compare resources ----------

const RES = [
  { n: 'Coal', r: false, use: 'Electricity (being phased out in the UK)', plus: ['Reliable: can be turned on when needed', 'Large amounts available'], minus: ['Releases carbon dioxide (climate change)', 'Sulfur dioxide causes acid rain', 'Will run out'] },
  { n: 'Oil', r: false, use: 'Transport (petrol, diesel), heating', plus: ['Reliable', 'Easy to transport as a liquid'], minus: ['Releases carbon dioxide', 'Oil spills harm wildlife', 'Will run out'] },
  { n: 'Natural gas', r: false, use: 'Electricity, heating, cooking', plus: ['Reliable, and quick to start up to meet demand', 'Less carbon dioxide than coal'], minus: ['Still releases carbon dioxide', 'Will run out'] },
  { n: 'Nuclear', r: false, use: 'Electricity', plus: ['No carbon dioxide while running', 'Reliable: runs all the time', 'A lot of energy from a little fuel'], minus: ['Radioactive waste lasts thousands of years', 'Expensive to build and to close down', 'Risk of major accidents'] },
  { n: 'Biofuel', r: true, use: 'Transport, electricity, heating', plus: ['Renewable: new crops can be grown', 'Can be carbon neutral: the plants took in carbon dioxide as they grew'], minus: ['Land used for fuel instead of food', 'Forests may be cleared to grow it'] },
  { n: 'Wind', r: true, use: 'Electricity', plus: ['No fuel and no carbon dioxide while running', 'Cheap to run'], minus: ['Unreliable: no electricity when there is no wind', 'Some people think turbines spoil the view, and they can be noisy'] },
  { n: 'Solar', r: true, use: 'Electricity, heating water', plus: ['No fuel and no carbon dioxide while running', 'Good for remote places'], minus: ['Unreliable: none at night, less when cloudy', 'Large areas of panels are needed'] },
  { n: 'Hydro-electric', r: true, use: 'Electricity', plus: ['Reliable, and can respond quickly to demand', 'No carbon dioxide while running'], minus: ['Dams flood valleys, destroying habitats', 'Only possible in some places'] },
  { n: 'Tides', r: true, use: 'Electricity', plus: ['Reliable and predictable: tides happen twice a day', 'No carbon dioxide while running'], minus: ['Barrages affect habitats and shipping', 'Only possible in a few places, and expensive to build'] },
  { n: 'Water waves', r: true, use: 'Electricity', plus: ['No fuel and no carbon dioxide'], minus: ['Unreliable: depends on the weather', 'Small amounts; can affect shipping and sea life'] },
  { n: 'Geothermal', r: true, use: 'Electricity, heating', plus: ['Reliable: runs all the time', 'Very little pollution'], minus: ['Only possible where hot rocks are near the surface (not much in the UK)'] },
];
function renderCards() {
  $('cards').innerHTML = RES.filter((x) => state.filter === 'all' || (state.filter === 'r') === x.r).map((x) => `
    <div class="card"><h3>${x.n} <span class="pill ${x.r ? 'r' : 'n'}">${x.r ? 'renewable' : 'non-renewable'}</span></h3>
      <div class="note" style="margin:0">Used for: ${x.use}</div>
      <ul>${x.plus.map((p) => `<li>✅ ${PK.ans(p)}</li>`).join('')}${x.minus.map((p) => `<li>❌ ${PK.ans(p)}</li>`).join('')}</ul></div>`).join('');
}

// ---------- Controls ----------

function chipGroup(id, key, attr, conv = (v) => v) {
  document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
    state[key] = conv(b.dataset[attr]);
    document.querySelectorAll(`#${id} .chip`).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    if (key === 'filter') renderCards(); else renderResult();
  }));
}
chipGroup('season', 'season', 's'); chipGroup('wind', 'wind', 'w', Number); chipGroup('sun', 'sun', 'u', Number); chipGroup('filter', 'filter', 'f');
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-tab]').forEach((el) => { el.hidden = el.dataset.tab !== t; });
  if (t === 'demand') { size(); renderResult(); }
  window.history.replaceState(null, '', `#${t}`);
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
window.addEventListener('resize', () => { if (state.tab === 'demand') { size(); renderResult(); } });
window.addEventListener('pk-theme', () => { if (state.tab === 'demand') renderResult(); });
window.addEventListener('pk-answers', renderCards);

renderSliders(); renderCards();
showTab(location.hash.slice(1) === 'compare' ? 'compare' : 'demand');
