// Speed and distance–time graphs (KS3): a race, a journey with stages and stops, and two cars
// passing. Every mode is a list of movers, each with a position at time t, so one graph can
// draw them all.

PK.header({
  title: 'Speed & distance–time',
  answers: true,
  spec: [
    { code: 'KS3', text: 'Speed and the quantitative relationship between average speed, distance and time (speed = distance ÷ time)' },
    { code: 'KS3', text: 'The representation of a journey on a distance–time graph' },
    { code: 'KS3', text: 'Relative motion: trains and cars passing one another' },
  ],
});

const $ = (id) => document.getElementById(id);
const fmt = (x, dp = 1) => String(parseFloat(x.toFixed(dp)));
const val = PK.num;
const scene = $('scene'), ctx = scene.getContext('2d'), dt_ = $('dt'), g = dt_.getContext('2d');
const SW = 560, SH = 220, GW = 560, GH = 330;
const COLOURS = ['#1e88e5', '#e53935', '#2e9e4f'];
const STAGE_COLOURS = ['#1e88e5', '#f57c00', '#2e9e4f'];
const GAP = 100;   // how far ahead car B starts when both go the same way (m)

const RACERS = {
  none: { name: 'Nobody' },
  walker: { name: 'Walker', v: 1.5, icon: '🚶' },
  jogger: { name: 'Jogger', v: 3, icon: '🏃' },
  cyclist: { name: 'Cyclist', v: 6, icon: '🚴' },
  sprinter: { name: 'Sprinter', v: 10, icon: '🏃' },
  horse: { name: 'Horse', v: 15, icon: '🐎' },
  car: { name: 'Car', v: 20, icon: '🚗' },
  cheetah: { name: 'Cheetah', v: 30, icon: '🐆' },
  mystery: { name: 'Mystery runner', v: 5, icon: '❓', hidden: true },
};
function newMystery() { RACERS.mystery.v = (4 + Math.floor(Math.random() * 17)) / 2; }   // 2 to 10 m/s
newMystery();

const state = { tab: 'race', running: false, t: 0, warp: 1, dir: 'opposite', model: null };

// ---------- The three modes ----------

function buildRace() {
  const L = 100;
  const movers = ['lane1', 'lane2', 'lane3'].map((id, i) => ({ id: $(id).value, i })).filter((m) => m.id !== 'none').map(({ id, i }) => {
    const r = RACERS[id];
    return { name: r.name, icon: r.icon, v: r.v, hidden: r.hidden, colour: COLOURS[i], lane: i, finish: L / r.v, pos: (t) => Math.min(r.v * t, L) };
  });
  const T = movers.length ? Math.max(...movers.map((m) => m.finish)) : 10;
  return { L, T, movers, yLabel: 'distance / m', lanes: 3 };
}

function stages() {
  return [1, 2, 3].map((n) => ({ v: val(`v${n}`), t: val(`t${n}`) }));
}

function buildJourney() {
  const st = stages(), T = st.reduce((a, s) => a + s.t, 0), D = st.reduce((a, s) => a + s.v * s.t, 0);
  const pos = (t) => {
    let d = 0, left = t;
    for (const s of st) { const u = Math.min(left, s.t); d += s.v * u; left -= u; if (left <= 0) break; }
    return d;
  };
  return { L: Math.max(D, 20), T, D, stages: st, yLabel: 'distance / m', lanes: 1, movers: [{ name: 'Walker', icon: '🚶', colour: STAGE_COLOURS[0], lane: 0, pos }] };
}

function buildPass() {
  const va = val('va'), vb = val('vb');
  const A = { name: 'A', icon: '🚙', colour: COLOURS[0], flip: true };
  const B = { name: 'B', icon: '🚗', colour: COLOURS[1] };
  if (state.dir === 'opposite') {
    const L = 400, T = L / Math.max(va, vb), meet = L / (va + vb);
    A.pos = (t) => va * t; B.pos = (t) => L - vb * t; B.flip = false;
    return { L, T, meet, relative: va + vb, va, vb, movers: [A, B], lanes: 2, yLabel: 'position on the road / m' };
  }
  B.flip = true;
  const catches = va > vb, meet = catches ? GAP / (va - vb) : null;
  const T = catches ? Math.min(meet * 1.5, 150) : 20;
  const L = Math.max(va * T, GAP + vb * T);
  A.pos = (t) => va * t; B.pos = (t) => GAP + vb * t;
  return { L, T, meet, relative: Math.abs(va - vb), va, vb, movers: [A, B], lanes: 2, yLabel: 'position on the road / m' };
}

function build() { return { race: buildRace, journey: buildJourney, pass: buildPass }[state.tab](); }

function reset() {
  state.running = false; state.t = 0;
  state.model = build();
  $('go').textContent = '▶ Go';
  renderPanel();
}

function go() {
  if (state.running) { state.running = false; $('go').textContent = '▶ Go'; return; }
  if (state.t >= state.model.T) state.t = 0;
  state.running = true;
  $('go').textContent = '⏸ Pause';
  if (state.tab === 'race') renderPanel();
}

function step(dt) {
  if (!state.running) return;
  const m = state.model, before = state.t;
  state.t = Math.min(m.T, state.t + dt * state.warp);
  // The table fills in as each racer finishes
  if (state.tab === 'race' && m.movers.some((r) => r.finish > before && r.finish <= state.t)) renderPanel();
  if (state.t >= m.T) { state.running = false; $('go').textContent = '▶ Go'; renderPanel(); }
}

// ---------- The scene ----------

function colours() {
  return { surface: PK.cssVar('--surface'), surface2: PK.cssVar('--surface-2'), text: PK.cssVar('--text'), muted: PK.cssVar('--muted'), grid: PK.cssVar('--grid'), font: PK.cssVar('--font-body') || 'sans-serif' };
}

// The tightest round-numbered axis that fits: an axis for 66.7 s stops at 70 s, not 80 s
function axis(max, ticks) {
  for (let e = -2; e < 7; e++) {
    for (const k of [1, 2, 5]) {
      const step = k * 10 ** e, n = Math.ceil(max / step - 1e-9);
      if (n <= ticks) return { step, n, top: n * step };
    }
  }
  return { step: max, n: 1, top: max };
}

function drawIcon(icon, x, y, flip, size = 26) {
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000'; ctx.fillText(icon, 0, 0);
  ctx.restore();
}

function drawClock(c) {
  ctx.font = `800 16px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = c.text;
  ctx.fillText(`Time: ${state.t.toFixed(1)} s`, SW / 2, 8);
}

function drawLanes(c) {
  const m = state.model, X0 = 44, X1 = SW - 28;
  const top = 36, laneH = (SH - top - 38) / m.lanes;
  const x = (d) => X0 + (d / m.L) * (X1 - X0);
  ctx.fillStyle = c.surface2; ctx.fillRect(X0, top, X1 - X0, laneH * m.lanes);
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= m.lanes; i++) { ctx.beginPath(); ctx.moveTo(X0, top + i * laneH); ctx.lineTo(X1, top + i * laneH); ctx.stroke(); }
  // Distance marks
  const a = axis(m.L, 5);
  ctx.fillStyle = c.muted; ctx.font = `600 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i <= a.n && i * a.step <= m.L + 1e-6; i++) {
    const d = i * a.step;
    ctx.strokeStyle = c.grid; ctx.beginPath(); ctx.moveTo(x(d), top); ctx.lineTo(x(d), top + laneH * m.lanes + 4); ctx.stroke();
    ctx.fillText(`${fmt(d, 1)} m`, x(d), top + laneH * m.lanes + 6);
  }
  // The stretch of road covered in each stage of a journey
  if (state.tab === 'journey') {
    let d = 0;
    const stops = [];
    m.stages.forEach((s, i) => {
      const e = d + s.v * s.t;
      if (e > d) {
        ctx.fillStyle = STAGE_COLOURS[i]; ctx.fillRect(x(d), top + laneH - 22, x(e) - x(d), 22);
        ctx.strokeStyle = c.surface; ctx.lineWidth = 2; ctx.strokeRect(x(d), top + laneH - 22, x(e) - x(d), 22);
        ctx.fillStyle = '#fff'; ctx.font = `800 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (x(e) - x(d) > 60) ctx.fillText(`Stage ${i + 1}`, (x(d) + x(e)) / 2, top + laneH - 11);
        else if (x(e) - x(d) > 14) ctx.fillText(i + 1, (x(d) + x(e)) / 2, top + laneH - 11);
      } else stops.push([i, d]);   // a stop takes up no road, so it gets a marker
      d = e;
    });
    for (const [i, at] of stops) {
      ctx.fillStyle = STAGE_COLOURS[i]; ctx.beginPath(); ctx.arc(x(at), top + laneH - 11, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.surface; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `800 13px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, x(at), top + laneH - 10.5);
    }
  }
  // Finish line
  if (state.tab === 'race') {
    for (let i = 0; i < 3 * 8; i++) { ctx.fillStyle = i % 2 ? '#000' : '#fff'; ctx.fillRect(X1 - 4, top + (i * laneH) / 8, 5, laneH / 8); }
  }
  for (const r of m.movers) {
    const y = top + (r.lane + 0.5) * laneH - (state.tab === 'journey' ? 16 : 0), px = x(r.pos(state.t));
    if (m.lanes > 1) {
      ctx.fillStyle = r.colour; ctx.font = `800 12px ${c.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(`${r.lane + 1}`, X0 - 6, y);
    }
    drawIcon(r.icon, px, y, true, Math.min(30, laneH * 0.75));
  }
}

// ---------- Passing cars: the same road from the roadside, or from inside car A ----------

const ROAD_TOP = 66, ROAD_H = 104;

function drawRoad(px, from, to, dash, tree) {
  ctx.fillStyle = '#5c6470'; ctx.fillRect(0, ROAD_TOP, SW, ROAD_H);
  ctx.fillStyle = '#fff';
  const dashPx = Math.max(6, (px(dash) - px(0)) * 0.5);
  for (let d = Math.floor(from / dash) * dash; d <= to; d += dash) ctx.fillRect(px(d), ROAD_TOP + ROAD_H / 2 - 2, dashPx, 4);
  for (let d = Math.floor(from / tree) * tree; d <= to; d += tree) drawIcon('🌳', px(d), ROAD_TOP - 16, false, 26);
}

// UK roads: traffic keeps left, and an overtaking car goes round on the right
function laneYs() {
  const upper = ROAD_TOP + ROAD_H * 0.25, lower = ROAD_TOP + ROAD_H * 0.75;
  return state.dir === 'opposite' ? { A: upper, B: lower } : { A: lower, B: upper };
}

function carLabel(text, x, y, colour, c) {
  ctx.fillStyle = colour; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `800 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 0.5);
}

function drawRoadside(c) {
  const m = state.model, X0 = 30, X1 = SW - 30, scale = (X1 - X0) / m.L, px = (x) => X0 + x * scale, ys = laneYs();
  drawRoad(px, -X0 / scale, m.L + 30 / scale, axis(m.L, 20).step, axis(m.L, 8).step);
  const a = axis(m.L, 5);
  ctx.fillStyle = c.muted; ctx.font = `600 12px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i <= a.n && i * a.step <= m.L + 1e-6; i++) {
    const d = i * a.step;
    ctx.strokeStyle = c.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px(d), ROAD_TOP + ROAD_H); ctx.lineTo(px(d), ROAD_TOP + ROAD_H + 5); ctx.stroke();
    ctx.fillText(`${fmt(d, 1)} m`, px(d), ROAD_TOP + ROAD_H + 7);
  }
  for (const r of m.movers) {
    const x = px(r.pos(state.t)), y = ys[r.name];
    drawIcon(r.icon, x, y, r.flip, 34);
    carLabel(r.name, x, y - 24, r.colour, c);
  }
  ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('From the roadside', 12, 8);
}

function drawRide(c) {
  const m = state.model, S = 3, cx = SW / 2, [A, B] = m.movers, xA = A.pos(state.t), xB = B.pos(state.t), ys = laneYs();
  const px = (x) => cx + (x - xA) * S;
  drawRoad(px, xA - cx / S - 40, xA + cx / S + 40, 20, 40);
  drawIcon(A.icon, cx, ys.A, true, 34);
  carLabel('A', cx, ys.A - 24, A.colour, c);
  const opposite = state.dir === 'opposite', bx = px(xB);
  if (bx > -20 && bx < SW + 20) {
    drawIcon(B.icon, bx, ys.B, !opposite, 34);
    carLabel('B', bx, ys.B - 24, B.colour, c);
  } else {
    ctx.fillStyle = '#fff'; ctx.font = `800 14px ${c.font}`; ctx.textBaseline = 'middle';
    ctx.textAlign = bx < 0 ? 'left' : 'right';
    ctx.fillText(bx < 0 ? `← B is ${Math.round(Math.abs(xB - xA))} m behind` : `B is ${Math.round(Math.abs(xB - xA))} m ahead →`, bx < 0 ? 10 : SW - 10, ys.B);
  }
  ctx.fillStyle = c.text; ctx.font = `700 13px ${c.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('From inside car A', 12, 8);
  ctx.fillStyle = c.muted; ctx.font = `600 13px ${c.font}`; ctx.textAlign = 'center';
  ctx.fillText('The road and car B slide past. Car A seems to stay still.', SW / 2, SH - 26);
}

function drawScene() {
  if (!scene.clientWidth) return;
  const k = scene.width / SW, c = colours();
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = c.surface; ctx.fillRect(0, 0, SW, SH);
  if (state.tab === 'pass') { if ($('ride').checked) drawRide(c); else drawRoadside(c); } else drawLanes(c);
  drawClock(c);
}

// ---------- The graph ----------

function drawGraph() {
  if (!dt_.clientWidth) return;
  const k = dt_.width / GW, c = colours(), m = state.model;
  g.setTransform(k, 0, 0, k, 0, 0);
  g.fillStyle = c.surface; g.fillRect(0, 0, GW, GH);
  const L = 62, R = 16, T = 14, B = 48, pw = GW - L - R, ph = GH - T - B;
  const tA = axis(m.T, 10), dA = axis(m.L, 6);
  const X = (t) => L + (t / tA.top) * pw, Y = (d) => T + ph - (d / dA.top) * ph;
  g.lineWidth = 1; g.font = `600 13px ${c.font}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let i = 0; i <= dA.n; i++) { const d = i * dA.step; g.strokeStyle = c.grid; g.beginPath(); g.moveTo(L, Y(d)); g.lineTo(L + pw, Y(d)); g.stroke(); g.fillStyle = c.muted; g.fillText(fmt(d, 2), L - 6, Y(d)); }
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let i = 0; i <= tA.n; i++) { const t = i * tA.step; g.strokeStyle = c.grid; g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), T + ph); g.stroke(); g.fillStyle = c.muted; g.fillText(fmt(t, 2), X(t), T + ph + 5); }
  g.strokeStyle = c.text; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
  g.fillStyle = c.text; g.font = `700 14px ${c.font}`;
  g.fillText('time / s', L + pw / 2, GH - 20);
  g.save(); g.translate(16, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText(m.yLabel, 0, 0); g.restore();

  if (state.tab === 'journey') drawStages(m, X, Y, c);
  else {
    for (const r of m.movers) {
      g.strokeStyle = r.colour; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath();
      const N = 240;
      for (let i = 0; i <= N; i++) { const t = (state.t * i) / N, x = X(t), y = Y(r.pos(t)); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
      if (state.t > 0) { g.fillStyle = r.colour; g.beginPath(); g.arc(X(state.t), Y(r.pos(state.t)), 5, 0, Math.PI * 2); g.fill(); }
    }
  }
  // Where the cars pass
  if (state.tab === 'pass' && m.meet != null && state.t >= m.meet) {
    const x = X(m.meet), y = Y(m.movers[0].pos(m.meet));
    g.strokeStyle = c.text; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke();
  }
}

// A journey's line is coloured and numbered by stage, to match the stage boxes
function drawStages(m, X, Y, c) {
  const pos = m.movers[0].pos;
  let t0 = 0;
  m.stages.forEach((s, i) => {
    const t1 = t0 + s.t, end = Math.min(t1, state.t);
    if (end > t0) {
      g.strokeStyle = STAGE_COLOURS[i]; g.lineWidth = 3.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(X(t0), Y(pos(t0))); g.lineTo(X(end), Y(pos(end))); g.stroke(); g.lineCap = 'butt';
    }
    const mid = (t0 + t1) / 2;
    if (state.t >= mid) {
      const x = X(mid), y = Y(pos(mid)) - 17;
      g.fillStyle = STAGE_COLOURS[i]; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.font = `800 13px ${c.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i + 1, x, y + 0.5);
    }
    t0 = t1;
  });
  if (state.t > 0) { g.fillStyle = c.text; g.beginPath(); g.arc(X(state.t), Y(pos(state.t)), 5, 0, Math.PI * 2); g.fill(); }
  // Average speed, once the journey is finished
  if (state.t >= m.T && m.D > 0) {
    g.strokeStyle = c.muted; g.lineWidth = 2; g.setLineDash([6, 5]);
    g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(m.T), Y(m.D)); g.stroke(); g.setLineDash([]);
  }
}

// ---------- The panel ----------

function renderRace() {
  const m = state.model;
  $('results-title').textContent = 'Results';
  if (!m.movers.length) { $('results').innerHTML = '<p class="note">Choose someone for at least one lane.</p>'; $('working').innerHTML = ''; return; }
  $('results').innerHTML = `<table class="results"><thead><tr><th>Racer</th><th>Distance (m)</th><th>Time (s)</th><th>Speed (m/s)</th></tr></thead><tbody>
    ${m.movers.map((r) => {
      const done = state.t >= r.finish - 1e-9;
      return `<tr><td style="color:${r.colour};font-weight:800">${r.name}</td><td>${m.L}</td><td>${done ? fmt(r.finish, 2) : '–'}</td><td>${done ? PK.ans(fmt(r.v, 2)) : '–'}</td></tr>`;
    }).join('')}
  </tbody></table>`;
  const fin = m.movers.find((r) => state.t >= r.finish - 1e-9);
  $('working').innerHTML = fin
    ? `Speed = distance ÷ time<br>${fin.name}: ${m.L} ÷ ${fmt(fin.finish, 2)} = <b>${PK.ans(`${fmt(fin.v, 2)} m/s`)}</b>`
    : 'Press Go. When a racer finishes, use the time to work out their speed.';
  $('graph-note').textContent = 'The steeper the line, the faster the speed. A line that goes flat has stopped moving.';
}

function renderJourney() {
  const m = state.model;
  $('results-title').textContent = 'The journey';
  m.stages.forEach((s, i) => { $(`say${i + 1}`).textContent = s.v === 0 ? `Stopped for ${fmt(s.t)} s` : `Moving at ${fmt(s.v)} m/s for ${fmt(s.t)} s`; });
  const rows = m.stages.map((s, i) => `<tr><td style="color:${STAGE_COLOURS[i]};font-weight:800">${i + 1}</td><td>${s.v === 0 ? '0 (stopped)' : fmt(s.v)}</td><td>${fmt(s.t)}</td><td>${PK.ans(fmt(s.v * s.t))}</td></tr>`).join('');
  $('results').innerHTML = `<table class="results"><thead><tr><th>Stage</th><th>Speed (m/s)</th><th>Time (s)</th><th>Distance (m)</th></tr></thead><tbody>${rows}
    <tr class="sum"><td>Total</td><td></td><td>${fmt(m.T)}</td><td>${PK.ans(fmt(m.D))}</td></tr></tbody></table>`;
  $('working').innerHTML = `Average speed = total distance ÷ total time<br>= ${PK.ans(`${fmt(m.D)} ÷ ${fmt(m.T)} = <b>${fmt(m.D / m.T, 2)} m/s</b>`)}`;
  $('graph-note').textContent = 'The numbers match the stages. A flat part of the line means stopped. When the journey ends, the dashed line shows the average speed.';
}

function renderPass() {
  const m = state.model, opposite = state.dir === 'opposite';
  $('results-title').textContent = 'Relative speed';
  const sum = opposite ? `${fmt(m.va)} + ${fmt(m.vb)}` : `${fmt(Math.max(m.va, m.vb))} − ${fmt(Math.min(m.va, m.vb))}`;
  $('results').innerHTML = `<dl class="readout"><dt>Car A</dt><dd>${fmt(m.va)} m/s</dd><dt>Car B</dt><dd>${fmt(m.vb)} m/s</dd><dt>Relative speed</dt><dd>${PK.ans(`${fmt(m.relative)} m/s`)}</dd></dl>`;
  const start = opposite ? `They start ${m.L} m apart.` : `Car B starts ${GAP} m ahead.`;
  $('working').innerHTML = `${opposite ? 'Moving in opposite directions, add the speeds' : 'Moving the same way, subtract the speeds'}:<br>${PK.ans(`${sum} = <b>${fmt(m.relative)} m/s</b>`)}<br>${start} ${m.meet != null
    ? `They draw level after ${PK.ans(`<b>${fmt(m.meet, 1)} s</b>`)}.`
    : (m.va === m.vb ? 'At the same speed, the gap between them never changes.' : 'Car A is slower, so it never catches car B.')}`;
  $('graph-note').textContent = opposite || m.meet != null
    ? 'The cars are level where the two lines cross.'
    : 'The lines never cross, because the cars are never level.';
}

function renderPanel() {
  if (state.tab === 'race') renderRace(); else if (state.tab === 'journey') renderJourney(); else renderPass();
}

// ---------- Controls ----------

function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.t === t)));
  $('p-race').hidden = t !== 'race'; $('p-journey').hidden = t !== 'journey'; $('p-pass').hidden = t !== 'pass';
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'race' ? location.pathname + location.search : `#${t}`);
  reset();
}

const OPTIONS = Object.entries(RACERS).map(([k, r]) => `<option value="${k}">${r.name}${r.hidden || !r.v ? '' : ` (${r.v} m/s)`}</option>`).join('');
['lane1', 'lane2', 'lane3'].forEach((id, i) => {
  $(id).innerHTML = OPTIONS;
  $(id).value = ['sprinter', 'cyclist', 'jogger'][i];
  $(id).addEventListener('change', () => { if ($(id).value === 'mystery') newMystery(); reset(); });
});
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
document.querySelectorAll('#warp .chip').forEach((b) => b.addEventListener('click', () => {
  state.warp = Number(b.dataset.w);
  document.querySelectorAll('#warp .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
}));
document.querySelectorAll('#dir .chip').forEach((b) => b.addEventListener('click', () => {
  state.dir = b.dataset.d;
  document.querySelectorAll('#dir .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  reset();
}));
for (const id of ['v1', 't1', 'v2', 't2', 'v3', 't3', 'va', 'vb']) $(id).addEventListener('input', reset);
$('go').addEventListener('click', go);
$('reset').addEventListener('click', reset);
window.addEventListener('pk-answers', renderPanel);

function size() {
  const dpr = window.devicePixelRatio || 1;
  scene.width = Math.round(scene.clientWidth * dpr); scene.height = Math.round(scene.clientWidth * (SH / SW) * dpr);
  dt_.width = Math.round(dt_.clientWidth * dpr); dt_.height = Math.round(dt_.clientWidth * (GH / GW) * dpr);
}
window.addEventListener('resize', size);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  drawScene();
  drawGraph();
  requestAnimationFrame(frame);
}

size();
showTab(['journey', 'pass'].includes(PK.initialHash.slice(1)) ? PK.initialHash.slice(1) : 'race');
requestAnimationFrame(frame);

// Share: the mystery runner's speed (the lanes, number boxes and chips are shared anyway)
PK.shareState = {
  get: () => ({ my: RACERS.mystery.v }),
  set: (o) => { if (Number(o.my) > 0) RACERS.mystery.v = Number(o.my); reset(); },
};
