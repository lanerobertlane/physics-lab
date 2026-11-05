// Efficiency: where a device's input energy goes, plus a calculator for
// efficiency = useful output ÷ total input (energy or power), rearranged for any unknown.

PK.header({
  title: 'Efficiency',
  answers: true,
  spec: [
    { code: '4.1.2.1', text: 'Energy transfers in a system: wasted energy is dissipated; ways of reducing unwanted transfers (lubrication, thermal insulation)' },
    { code: '4.1.2.2', text: 'Efficiency = useful output energy transfer ÷ total input energy transfer, and = useful power output ÷ total power input' },
    { code: '4.1.2.2', text: 'Describe ways to increase the efficiency of an intended energy transfer', ht: true },
    { code: 'KS3', text: 'Energy changes and transfers; comparing efficiency; wasted energy' },
  ],
});

const $ = (id) => document.getElementById(id);

const DEVICES = [
  { icon: '💡', name: 'Filament lamp', power: 60, eff: 0.1, useful: 'light', wasted: 'heating the surroundings',
    improve: 'Swapping to an LED lamp gives the same light for much less power.' },
  { icon: '🔆', name: 'LED lamp', power: 8, eff: 0.4, useful: 'light', wasted: 'heating the surroundings',
    improve: 'LEDs waste far less energy heating their surroundings than filament lamps.' },
  { icon: '🫖', name: 'Electric kettle', power: 2000, eff: 0.9, useful: 'thermal energy of the water', wasted: 'heating the kettle and the air, and sound',
    improve: 'Thermal insulation on the kettle reduces the energy lost to the surroundings. Only boil the water you need.' },
  { icon: '🔧', name: 'Electric drill', power: 600, eff: 0.7, useful: 'kinetic energy of the drill bit', wasted: 'heating from friction and electrical resistance, and sound',
    improve: 'Lubricating the moving parts reduces friction, so less energy is wasted heating them.' },
  { icon: '🚗', name: 'Petrol car engine', power: 60000, eff: 0.3, useful: 'kinetic energy of the car', wasted: 'heating the engine, exhaust gases and surroundings, and sound',
    improve: 'Lubrication, streamlining the car to cut air resistance, and keeping tyres pumped up all reduce wasted energy.' },
  { icon: '🔌', name: 'Phone charger', power: 10, eff: 0.8, useful: 'chemical energy store of the battery', wasted: 'heating the charger and phone',
    improve: 'A well-designed charger gets less hot, so it wastes less energy.' },
  { icon: '🏭', name: 'Gas power station', power: 500e6, eff: 0.5, useful: 'electrical energy transferred to the grid', wasted: 'heating the surroundings (cooling towers)',
    improve: 'Some power stations use their waste heat to heat nearby homes, making better use of the fuel.' },
  { icon: '☀', name: 'Solar panel', power: 1000, eff: 0.2, useful: 'electrical energy', wasted: 'heating the panel, and reflected light',
    improve: 'Keeping panels clean and angled towards the Sun helps them capture more of the light.' },
];

const state = { dev: 2, time: 60 };

function siPower(w) {
  if (w >= 1e6) return `${parseFloat((w / 1e6).toPrecision(3))} MW`;
  if (w >= 1e3) return `${parseFloat((w / 1e3).toPrecision(3))} kW`;
  return `${parseFloat(w.toPrecision(3))} W`;
}
function siEnergy(j) {
  if (j >= 1e9) return `${parseFloat((j / 1e9).toPrecision(3))} GJ`;
  if (j >= 1e6) return `${parseFloat((j / 1e6).toPrecision(3))} MJ`;
  if (j >= 1e3) return `${parseFloat((j / 1e3).toPrecision(3))} kJ`;
  return `${parseFloat(j.toPrecision(3))} J`;
}

function renderDevice() {
  const d = DEVICES[state.dev];
  document.querySelectorAll('#devices .btn').forEach((b, i) => b.setAttribute('aria-pressed', String(i === state.dev)));
  const u = d.power * d.eff, wst = d.power - u, Ein = d.power * state.time;
  $('split').innerHTML = `<div class="useful" style="width:${d.eff * 100}%">${d.eff >= 0.15 ? `useful ${PK.ans(`${Math.round(d.eff * 100)}%`)}` : ''}</div>
    <div class="wasted" style="width:${(1 - d.eff) * 100}%">wasted ${PK.ans(`${Math.round((1 - d.eff) * 100)}%`)}</div>`;
  $('legend').innerHTML = `<div><b style="color:#2e9e57">Useful: ${PK.ans(siPower(u))}</b>${d.useful}</div><div><b style="color:#d4553a">Wasted: ${PK.ans(siPower(wst))}</b>${d.wasted}</div>`;
  $('time-val').textContent = state.time >= 60 ? `${Math.floor(state.time / 60)} min ${state.time % 60 ? `${state.time % 60} s` : ''}` : `${state.time} s`;
  $('working').innerHTML = `
    <p>Total power input = <b>${siPower(d.power)}</b>, useful power output = <b>${PK.ans(siPower(u))}</b></p>
    <p>efficiency = useful power output ÷ total power input = ${PK.ans(siPower(u))} ÷ ${siPower(d.power)} = <b>${PK.ans(`${d.eff} (${Math.round(d.eff * 100)}%)`)}</b></p>
    <p>In ${state.time} s: total energy in = P × t = ${PK.ans(siEnergy(Ein))}, useful energy out = ${PK.ans(siEnergy(Ein * d.eff))}, wasted = ${PK.ans(siEnergy(Ein * (1 - d.eff)))}</p>`;
  $('improve').innerHTML = `<b>Improving it:</b> ${d.improve}`;
}

$('devices').innerHTML = DEVICES.map((d, i) => `<button class="btn" data-i="${i}">${d.icon} ${d.name}</button>`).join('');
$('devices').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { state.dev = Number(b.dataset.i); renderDevice(); } });
$('time').addEventListener('input', (e) => { state.time = Number(e.target.value); renderDevice(); });

// ---------- Calculator ----------

const FIELDS = { eff: 'Efficiency (decimal or %)', useful: 'Useful output (J or W)', total: 'Total input (J or W)' };

function renderCalc() {
  const find = $('find').value;
  $('calc-inputs').innerHTML = Object.entries(FIELDS).filter(([k]) => k !== find).map(([k, label]) =>
    `<label class="calc"><span>${label}</span><input inputmode="decimal" data-k="${k}" autocomplete="off"></label>`).join('');
  calc();
}

function readEff(s) {
  const pct = /%/.test(s);
  const v = parseFloat(String(s).replace('%', ''));
  if (!isFinite(v)) return NaN;
  return pct || v > 1 ? v / 100 : v;
}

function calc() {
  const find = $('find').value;
  const val = (k) => { const el = document.querySelector(`#calc-inputs [data-k="${k}"]`); return el ? el.value.trim() : ''; };
  const out = $('calc-out');
  const n = (s) => parseFloat(s);
  let html = 'Fill in the two boxes.';
  if (find === 'eff' && val('useful') && val('total')) {
    const u = n(val('useful')), t = n(val('total'));
    html = t > 0 ? `efficiency = ${u} ÷ ${t} = <b>${parseFloat((u / t).toPrecision(3))}</b> (${parseFloat(((100 * u) / t).toPrecision(3))}%)${u > t ? '<br><b>Check:</b> useful output can’t be more than the total input!' : ''}` : 'The total input must be more than 0.';
  } else if (find === 'useful' && val('eff') && val('total')) {
    const e = readEff(val('eff')), t = n(val('total'));
    html = `useful output = efficiency × total input = ${e} × ${t} = <b>${parseFloat((e * t).toPrecision(3))}</b>`;
  } else if (find === 'total' && val('eff') && val('useful')) {
    const e = readEff(val('eff')), u = n(val('useful'));
    html = e > 0 ? `total input = useful output ÷ efficiency = ${u} ÷ ${e} = <b>${parseFloat((u / e).toPrecision(3))}</b>` : 'Efficiency must be more than 0.';
  }
  out.innerHTML = html;
}

$('find').addEventListener('change', renderCalc);
$('calc-inputs').addEventListener('input', calc);

renderDevice();
renderCalc();
