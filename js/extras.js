// Site-wide extras, loaded by common.js on every page once the tool has built itself:
// tooltips (with a tappable ⓘ), "Copy picture" on diagrams, Share (QR code + the current
// set-up saved in the link), a glossary of key words, and "recently used" for the home page.

(() => {
  const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  const main = document.querySelector('main');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Tooltip bubble (hover on desktop, tap on iPad) ----------
  const tip = document.createElement('div');
  tip.className = 'pk-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  let tipFor = null;
  function showTip(target, html) {
    tip.innerHTML = html; tip.hidden = false; tipFor = target;
    const r = target.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
    tip.style.maxWidth = `${w}px`;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2; x = Math.max(12, Math.min(window.innerWidth - tw - 12, x));
    let y = r.bottom + 8; if (y + th > window.innerHeight - 8) y = r.top - th - 8;
    tip.style.left = `${x + window.scrollX}px`; tip.style.top = `${Math.max(8, y) + window.scrollY}px`;
  }
  function hideTip() { tip.hidden = true; tipFor = null; }
  const tipHtml = (el) => (el.dataset.tip ? esc(el.dataset.tip) : el.dataset.def ? `<b>${esc(el.dataset.term)}</b>: ${esc(el.dataset.def)}` : '');
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-tip], .pk-term');
    if (t && t !== tipFor && matchMedia('(hover: hover)').matches) showTip(t, tipHtml(t));
  });
  document.addEventListener('mouseout', (e) => {
    const t = e.target.closest('[data-tip], .pk-term');
    if (t && !t.contains(e.relatedTarget) && matchMedia('(hover: hover)').matches) hideTip();
  });
  document.addEventListener('click', (e) => {
    const i = e.target.closest('.pk-tip-i, .pk-term');
    if (i) {
      e.preventDefault(); e.stopPropagation();
      const t = i.classList.contains('pk-term') ? i : i.closest('[data-tip]');
      if (tipFor === t) hideTip(); else showTip(t, tipHtml(t));
      return;
    }
    if (!e.target.closest('.pk-tip')) hideTip();
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });
  window.addEventListener('scroll', () => { if (!tip.hidden && !matchMedia('(hover: hover)').matches) hideTip(); }, { passive: true });

  // ---------- Tooltips for settings ----------
  // Keys are element ids; "page#id" when the same id means different things on different pages.
  const TIPS = {
    'quiz#qz-order': 'Each student gets the questions in a different order, so they can’t copy the person next to them.',
    // Practice questions (Calculation practice and every tool's Practice tab)
    rearrange: 'Sometimes asks for a quantity that isn’t the subject of the equation, so you have to rearrange it first.',
    convert: 'Some values are given in units like kJ, g or cm. Convert them to SI units (such as J, kg and m) before you calculate.',
    showEq: 'Shows the equation with every question. Untick it to practise remembering the equations.',
    keep: 'Keeps the same situation and the same thing to find, and just changes the numbers. Good for practising one type of question.',
    higher: 'Includes the Higher-tier equations as well.',
    'pq-ks3': 'Uses rounder, easier numbers and g = 10 N/kg, and leaves out the most extreme situations.',
    // Tools
    count: 'Takes the numbers off the Sankey diagram, so you read the values from the squares using the scale.',
    'bonding#all': 'Shows the inner shells as well. A dot and cross diagram usually only needs the outer shell.',
    area: 'Shades the area under the line. On a velocity–time graph, this area is the distance travelled.',
    arrows: 'Shows the velocity of the planet and the force of gravity on it.',
    'auto-length': 'Shows the spring’s length for you. Untick it to read the length from the ruler yourself, as in the real practical.',
    'c-colour': 'Colours the rods by temperature: blue is cool and red is hot.',
    'c-particles': 'Shows the particles vibrating. Hotter particles vibrate more and pass energy on to their neighbours.',
    ct: 'Adds the dose from one CT scan: a medical scan that uses X-rays.',
    diag: 'Lets you add forces at 45°, which have to be split into parts or drawn to scale.',
    earth: 'Connects the earth wire to the metal case. Untick it to see why the earth wire keeps you safe.',
    expected: 'Draws the smooth curve that random decay follows on average, with the half-life marked.',
    four: 'Shows the Earth at four points in its orbit, ready for labelling the seasons.',
    'acceleration#friction': 'Leaves friction acting on the trolley. In the practical, the runway is tilted slightly so friction is cancelled out.',
    'energy#friction': 'Adds friction and air resistance, so some energy is dissipated by heating the surroundings.',
    graph: 'Shows the graph alongside the experiment.',
    'waves#graph': 'Plots how far each particle has moved, so a longitudinal wave can be drawn as a graph like a transverse one.',
    'sky#heat': 'Colours the Earth by how much of the Sun’s energy each square metre receives.',
    hide: 'Hides the answers so you can test yourself.',
    insulate: 'Wraps the block in insulation, so less energy is lost to the surroundings and the result is more accurate.',
    iso: 'Keeps the temperature the same as you change the volume, so pressure × volume stays constant.',
    join: 'Joins the plotted points.',
    labels: 'Shows labels on the wave, such as wavelength and amplitude.',
    lid: 'Puts lids on the beakers, so less energy is lost by evaporation.',
    'move-ruler': 'Lets you slide the ruler so its zero lines up with the bottom of the spring. Then you read the extension directly.',
    pilot: 'Airline pilots get a bigger dose of cosmic rays, because they spend a lot of time high up in the atmosphere.',
    quiz: 'Hides the names of the regions so you can test yourself.',
    'r-vacuum': 'Removes the air. Infrared still reaches the cans, because radiation doesn’t need particles to travel.',
    'ruler-on': 'Shows a ruler for measuring the wavelength.',
    'show-config': 'Writes the electronic structure (like 2,8,1) on each of the first 20 elements.',
    idler: 'Adds a gear between the driver and the driven gear, so you can see what it changes and what it doesn’t.',
    ride: 'Shows the road as it looks from inside car A, so you can see the relative speed of car B.',
    'show-ke': 'Adds kinetic energy to the table. Momentum is always conserved, but kinetic energy is only kept when the gliders bounce perfectly.',
    crumple: 'Gives the car a crumple zone, so it takes longer to stop. The same change in momentum over a longer time means a smaller force.',
    'circuits#show-graph': 'Plots an I–V graph from your readings.',
    'energy#show-graph': 'Shows how the energy in each store changes over time.',
    'show-reading': 'Shows the newtonmeter reading for you. Untick it to read the scale yourself, as in a real experiment.',
    'show-table': 'Shows the results table for your readings.',
    'show-values': 'Writes each component’s value on the circuit, such as a cell’s p.d. or a resistor’s resistance.',
    'show-vector': 'Shows the scale drawing, with the forces drawn tip to tail.',
    'show-vt': 'Draws dashed lines on the graph at the terminal velocities.',
    sound: 'Plays a click for each count, like a real Geiger counter.',
    trail: 'Picks out one particle and draws the path it takes.',
    'magnets#v-arrows': 'Adds arrows to the field lines, pointing from the north pole to the south pole.',
    'heat#v-arrows': 'Shows arrows for the direction of the convection current.',
    'v-colour': 'Colours the water by temperature: red is warmer and blue is cooler.',
    'v-filings': 'Shows the pattern iron filings would make around the magnet.',
    'v-force': 'Shows the force each magnet feels.',
    'v-grid': 'Fills the space with small compasses, each pointing along the field.',
    'v-lines': 'Draws the magnetic field lines.',
    'v-marks': 'Leaves a mark wherever the plotting compass has been, as when you plot a field by hand.',
    'v-strength': 'Shades the field: darker means a stronger field.',
    worn: 'Worn brakes and tyres grip the road less, so the braking distance is longer.',
  };
  function attachTips() {
    for (const [key, text] of Object.entries(TIPS)) {
      if (!text) continue;
      const [pg, id] = key.includes('#') ? key.split('#') : [null, key];
      if (pg && pg !== page) continue;
      if (!pg && TIPS[`${page}#${id}`]) continue;
      for (const pre of ['', 'pq-']) {
        const el = document.getElementById(pre + id);
        if (!el || el.dataset.tipDone || !el.matches('input, select, button')) continue;
        el.dataset.tipDone = '1';
        const label = el.closest('label');
        const host = label || el;
        host.dataset.tip = text;
        if (label) {
          const i = document.createElement('span');
          i.className = 'pk-tip-i'; i.textContent = 'i'; i.setAttribute('role', 'button'); i.tabIndex = 0;
          i.setAttribute('aria-label', `About: ${text}`);
          label.appendChild(i);
        }
      }
    }
    // Header and shared buttons
    const btnTips = {
      'pk-fullscreen': 'Fills the whole screen with this page. Press Esc to come back.',
      'pk-share': 'Shows a QR code and a link to this page, with everything set up as it is now.',
      'present-open': 'Shows the question on its own in big text, ready for the board.',
      'pq-present-open': 'Shows the question on its own in big text, ready for the board.',
      'show-working': 'Shows the full worked answer. Your score counts it as not right first time.',
      'pq-show-working': 'Shows the full worked answer. Your score counts it as not right first time.',
      'print-sheet': 'Makes a printable worksheet of questions with a separate answer page.',
      'pq-print-sheet': 'Makes a printable worksheet of questions with a separate answer page.',
    };
    for (const [id, text] of Object.entries(btnTips)) { const el = document.getElementById(id); if (el && !el.dataset.tip) { el.dataset.tip = text; el.removeAttribute('title'); } }
    const theme = document.querySelector('.theme-select');
    if (theme && !theme.dataset.tip) { theme.dataset.tip = 'Changes the colours. Lesson matches the classroom slides, and Pink Noise is the same in pinks; Dark is easier on the eyes in a dim room.'; theme.removeAttribute('title'); }
  }

  // ---------- Copy picture ----------
  // An SVG diagram becomes a PNG: copy the computed colours onto each part first, so the theme's
  // colours (CSS variables) survive outside the page.
  function svgToCanvas(svg) {
    const r = svg.getBoundingClientRect(), scale = 2;
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((el, i) => {
      const cs = getComputedStyle(el);
      for (const prop of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'visibility', 'display']) {
        dst[i].style.setProperty(prop, cs.getPropertyValue(prop));
      }
    });
    clone.setAttribute('width', r.width); clone.setAttribute('height', r.height);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = r.width * scale; cv.height = r.height * scale;
        const c = cv.getContext('2d');
        c.fillStyle = getComputedStyle(svg.closest('.panel') || document.body).backgroundColor || '#fff';
        c.fillRect(0, 0, cv.width, cv.height);
        c.drawImage(img, 0, 0, cv.width, cv.height);
        res(cv);
      };
      img.onerror = rej; img.src = url;
    });
  }
  async function copyPicture(el) {
    const cv = el.tagName === 'CANVAS' ? el : await svgToCanvas(el);
    const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      PK.toast('Picture copied: paste it into your slides or worksheet');
    } catch {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `${document.title.split(' · ')[0]}.png`;
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      PK.toast('Picture saved as a file (your browser can’t copy pictures)');
    }
  }
  const copyBtns = [];
  // Keep each button in the top-right corner of its own diagram
  function placeCopyButtons() {
    for (const { el, b } of copyBtns) {
      const show = el.isConnected && el.getClientRects().length && el.clientWidth >= 160;
      b.hidden = !show;
      if (!show) continue;
      const host = b.offsetParent || b.parentElement, hr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
      b.style.top = `${r.top - hr.top + 6}px`;
      b.style.left = `${r.right - hr.left - b.offsetWidth - 6}px`;
    }
  }
  function addCopyButtons() {
    document.querySelectorAll('main canvas, main svg[viewBox]').forEach((el) => {
      if (el.dataset.copyDone || el.closest('button, .chip, .tool-icon, .pq, .pk-modal') || el.classList.contains('pq-ink')) return;
      const box = el.viewBox && el.viewBox.baseVal;
      if (el.tagName !== 'CANVAS' && (!box || box.width < 200)) return;
      el.dataset.copyDone = '1';
      const holder = el.parentElement;
      if (getComputedStyle(holder).position === 'static') holder.style.position = 'relative';
      const b = document.createElement('button');
      b.className = 'pk-copy'; b.type = 'button';
      b.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg><span>Copy</span>';
      b.setAttribute('aria-label', 'Copy this diagram as a picture');
      b.dataset.tip = 'Copies this diagram as a picture, ready to paste into PowerPoint or a worksheet.';
      b.addEventListener('click', () => copyPicture(el));
      holder.appendChild(b);
      copyBtns.push({ el, b });
    });
    placeCopyButtons();
  }
  window.addEventListener('resize', () => requestAnimationFrame(placeCopyButtons));

  // ---------- Copy table ----------
  // Results tables copy as a real table (Word, PowerPoint, Google Docs) and as tab-separated
  // text (Excel and Sheets put each value in its own cell). Hidden answers copy as "?".
  const TABLES = 'main table.results, main table.compare, main table.props';
  function tableData(t) {
    return [...t.rows].map((tr) => [...tr.cells].map((td) => {
      const c = td.cloneNode(true);
      c.querySelectorAll('button, .pk-tip-i').forEach((b) => b.remove());
      c.querySelectorAll('input, select').forEach((i) => i.replaceWith(document.createTextNode(i.value)));
      c.querySelectorAll('.pk-ans').forEach((a) => a.replaceWith(document.createTextNode(PK.answersShown() ? a.querySelector('.pk-ans-v').textContent : '?')));
      return { text: c.textContent.replace(/\s+/g, ' ').trim(), head: td.tagName === 'TH' };
    })).filter((row) => row.some((cell) => cell.text));
  }
  async function copyTable(t) {
    const rows = tableData(t);
    const esc2 = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = `<table border="1" cellpadding="4" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif">${rows.map((r) =>
      `<tr>${r.map((c) => (c.head ? `<th style="background:#eee">${esc2(c.text)}</th>` : `<td>${esc2(c.text)}</td>`)).join('')}</tr>`).join('')}</table>`;
    const tsv = rows.map((r) => r.map((c) => c.text).join('\t')).join('\n');
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([tsv], { type: 'text/plain' }) })]);
      PK.toast('Table copied: paste it into Word, PowerPoint or Excel');
    } catch {
      try { await navigator.clipboard.writeText(tsv); PK.toast('Table copied as text: paste it into Excel or Word'); } catch { PK.toast('Your browser wouldn’t let the table be copied'); }
    }
  }
  const tableBtns = [];
  function placeTableButtons() {
    for (const { box, b } of tableBtns) {
      const t = box.querySelector('table');
      b.hidden = !t || !t.rows.length;
      if (b.hidden) continue;
      const hr = box.getBoundingClientRect(), r = t.getBoundingClientRect();
      b.style.top = `${r.top - hr.top - b.offsetHeight - 4}px`;
      b.style.left = `${r.right - hr.left - b.offsetWidth}px`;
    }
  }
  function addTableButtons() {
    document.querySelectorAll(TABLES).forEach((t) => {
      // Tools rebuild their tables, so the button belongs to the box the table sits in
      const box = t.parentElement;
      if (!box) return;
      if (box.dataset.tableCopy) {
        // Rebuilding the table with innerHTML removes the button too, so put it back
        const had = tableBtns.find((x) => x.box === box);
        if (had && !box.contains(had.b)) box.appendChild(had.b);
        return;
      }
      box.dataset.tableCopy = '1';
      if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      if (parseFloat(getComputedStyle(box).paddingTop) < 30) box.style.paddingTop = '30px';
      const b = document.createElement('button');
      b.className = 'pk-copy pk-copy-table'; b.type = 'button';
      b.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg><span>Copy table</span>';
      b.setAttribute('aria-label', 'Copy this table');
      b.dataset.tip = 'Copies the table, ready to paste into Word, PowerPoint or Excel.';
      b.addEventListener('click', () => { const tb = box.querySelector('table'); if (tb) copyTable(tb); });
      box.appendChild(b);
      tableBtns.push({ box, b });
    });
    placeTableButtons();
  }
  window.addEventListener('resize', () => requestAnimationFrame(placeTableButtons));

  // ---------- Share: QR code and the current set-up ----------
  // The set-up is every named control in the tool: sliders, tick boxes, drop-downs and the
  // pressed button in each group of chips. It goes in the link as ?s=…
  const skip = (el) => !el.id || /answer|^pk-|^ws-/.test(el.id) || el.closest('.pk-modal, header, .pq-present, .present');
  const groupButtons = (g) => [...g.querySelectorAll(':scope > button[aria-pressed], :scope > .chip[aria-pressed]')];
  function captureState() {
    const s = {};
    main.querySelectorAll('input[type=range], input[type=number], input[type=checkbox], select').forEach((el) => {
      if (skip(el)) return;
      s[el.id] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value;
    });
    if (PK.shareState) { try { s['@@'] = PK.shareState.get(); } catch { /* leave it out */ } }
    if (PK.shareQuestion) { try { const q = PK.shareQuestion.get(); if (q) s['@q'] = q; } catch { /* leave it out */ } }
    // Any group of on/off buttons (chips, element pickers, source cards…)
    main.querySelectorAll('[id]').forEach((g) => {
      if (skip(g)) return;
      const btns = groupButtons(g);
      if (btns.length < 2) return;
      const i = btns.findIndex((c) => c.getAttribute('aria-pressed') === 'true');
      if (i >= 0) s[`@${g.id}`] = i;
    });
    return s;
  }
  const enc = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = (t) => JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g, '+').replace(/_/g, '/')))));
  function shareUrl() {
    const u = new URL(location.href);
    u.searchParams.delete('s');
    const s = captureState();
    if (Object.keys(s).length) u.searchParams.set('s', enc(s));
    return u.toString();
  }
  function restoreState() {
    const t = new URLSearchParams(location.search).get('s');
    if (!t) return;
    let s; try { s = dec(t); } catch { return; }
    const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
    // Chips first (they can reset other controls), then drop-downs, sliders and tick boxes
    for (const [k, i] of Object.entries(s)) {
      if (!k.startsWith('@') || k === '@@' || k === '@q') continue;
      const g = document.getElementById(k.slice(1)), chip = g && groupButtons(g)[i];
      if (chip && chip.getAttribute('aria-pressed') !== 'true') chip.click();
    }
    const els = Object.keys(s).filter((k) => !k.startsWith('@')).map((k) => [document.getElementById(k), s[k]]).filter(([el]) => el);
    for (const [el, v] of els) if (el.tagName === 'SELECT' && el.value !== v) { el.value = v; fire(el, 'change'); }
    for (const [el, v] of els) if (el.type === 'range' || el.type === 'number') { if (el.value !== v) { el.value = v; fire(el, 'input'); fire(el, 'change'); } }
    for (const [el, v] of els) if (el.type === 'checkbox' && el.checked !== Boolean(v)) el.click();
    // The tool's own extra details last, so a button above can't reset them
    if (s['@@'] && PK.shareState) { try { PK.shareState.set(s['@@']); } catch { /* ignore */ } }
    if (s['@q'] && PK.shareQuestion) { try { PK.shareQuestion.set(s['@q']); } catch { /* ignore */ } }
  }

  let qrLoading = null;
  const QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  function loadQr() {
    if (window.qrcode) return Promise.resolve();
    if (!qrLoading) qrLoading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = QR_SRC; s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer';
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    return qrLoading;
  }
  function drawQr(cv, text) {
    let q;
    for (const level of ['M', 'L']) { try { q = qrcode(0, level); q.addData(text); q.make(); break; } catch { q = null; } }
    if (!q) return false;
    const n = q.getModuleCount(), quiet = 4, size = 640, cell = size / (n + quiet * 2);
    cv.width = size; cv.height = size;
    const c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, size, size); c.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) c.fillRect(Math.floor((k + quiet) * cell), Math.floor((r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
    return true;
  }
  PK.qr = { load: loadQr, draw: drawQr };
  function openShare() {
    if (typeof window.saveHash === 'function') { try { window.saveHash(); } catch { /* ignore */ } }
    const url = shareUrl();
    const m = document.createElement('div');
    m.className = 'pk-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Share this page');
    m.innerHTML = `<div class="pk-modal-box">
        <h2>Scan to open this page</h2>
        <p class="note" style="margin-top:0">Opens ${esc(document.title.split(' · ')[0])} set up exactly as it is now.</p>
        <div class="pk-qr"><canvas aria-label="QR code for this page"></canvas><p class="note" id="pk-qr-msg">Making the QR code…</p></div>
        <input class="pk-link" readonly value="${esc(url)}" aria-label="Link to this page">
        <div class="btn-row" style="justify-content:flex-end;margin-top:10px">
          <button class="btn" id="pk-copy-link">Copy link</button>
          <button class="btn primary" id="pk-close-share">Close</button>
        </div></div>`;
    document.body.appendChild(m);
    const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
    m.querySelector('#pk-close-share').addEventListener('click', close);
    m.querySelector('#pk-copy-link').addEventListener('click', () => PK.copyLink(url));
    m.querySelector('#pk-close-share').focus();
    loadQr().then(() => {
      const ok = drawQr(m.querySelector('canvas'), url);
      m.querySelector('#pk-qr-msg').textContent = ok ? '' : 'This set-up is too big for a QR code. Use Copy link instead.';
    }).catch(() => { m.querySelector('#pk-qr-msg').textContent = 'The QR code couldn’t be made (are you offline?). Use Copy link instead.'; m.querySelector('canvas').hidden = true; });
  }
  function addShareButton() {
    const actions = document.querySelector('.site-header .header-actions');
    if (!actions || document.getElementById('pk-share')) return;
    const b = document.createElement('button');
    b.className = 'icon-btn'; b.id = 'pk-share';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4z"/></svg><span class="label">Share</span>';
    b.addEventListener('click', openShare);
    actions.prepend(b);
  }

  // ---------- Glossary of key words ----------
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'BUTTON', 'SELECT', 'OPTION', 'TEXTAREA', 'INPUT', 'LABEL', 'A', 'CANVAS', 'SVG', 'H1', 'H2', 'H3', 'SUMMARY']);
  let gloss = null, glossBusy = false;
  function wrapGlossary() {
    if (!gloss || glossBusy) return;
    glossBusy = true;
    const done = new Set([...document.querySelectorAll('.pk-term')].map((t) => t.dataset.term.toLowerCase()));
    const todo = gloss.filter((g) => !done.has(g.term.toLowerCase()));
    if (todo.length) {
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          for (let p = n.parentElement; p && p !== main; p = p.parentElement) {
            if (SKIP_TAGS.has(p.tagName) || p.classList.contains('pk-term') || p.classList.contains('pk-ans') || p.classList.contains('readout') || p.classList.contains('spec-panel') || p.classList.contains('chip-group') || p.isContentEditable) return NodeFilter.FILTER_REJECT;
          }
          return n.nodeValue.trim().length > 3 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const g of todo) {
        for (const n of nodes) {
          if (!n.parentNode) continue;
          const m = g.re.exec(n.nodeValue);
          if (!m) continue;
          const before = n.nodeValue.slice(0, m.index), word = m[0], after = n.nodeValue.slice(m.index + word.length);
          const span = document.createElement('span');
          span.className = 'pk-term'; span.textContent = word; span.tabIndex = 0;
          span.dataset.term = g.term; span.dataset.def = g.def;
          const rest = document.createTextNode(after);
          n.nodeValue = before;
          n.parentNode.insertBefore(span, n.nextSibling);
          span.parentNode.insertBefore(rest, span.nextSibling);
          nodes.push(rest);
          break;
        }
      }
    }
    glossBusy = false;
  }
  function startGlossary() {
    if (page === 'index' || !main || document.documentElement.dataset.glossary === 'off') return;
    const s = document.createElement('script');
    s.src = `${PK.root}js/glossary.js`;
    s.onload = () => {
      if (!window.PK_GLOSSARY) return;
      gloss = Object.entries(window.PK_GLOSSARY).map(([term, v]) => {
        const words = [term, ...(v.also || [])].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        return { term, def: v.def, re: new RegExp(`\\b(${words.join('|')})\\b`, 'i') };
      });
      wrapGlossary();
      let t = null;
      new MutationObserver(() => { if (glossBusy) return; clearTimeout(t); t = setTimeout(wrapGlossary, 400); }).observe(main, { childList: true, subtree: true });
    };
    document.head.appendChild(s);
  }

  // ---------- Recently used ----------
  function recordVisit() {
    if (!location.pathname.includes('/tools/')) return;
    const href = `tools/${location.pathname.split('/').pop()}`;
    const list = (PK.store.get('home.recent', []) || []).filter((h) => h !== href);
    list.unshift(href);
    PK.store.set('home.recent', list.slice(0, 8));
  }

  // Keep the address bar up to date, so copying it gives the same set-up as Share
  let urlTimer = null, restoring = false;
  function syncUrl() {
    if (restoring) return;
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      if (typeof window.saveHash === 'function') { try { window.saveHash(); } catch { /* ignore */ } }
      const u = new URL(shareUrl());
      if (u.toString() !== location.href) history.replaceState(history.state, '', u.toString());
    }, 400);
  }
  function watchUrl() {
    if (!main || page === 'index') return;
    for (const type of ['input', 'change', 'click', 'pointerup']) main.addEventListener(type, syncUrl, true);
  }

  // ---------- Start ----------
  function start() {
    // A page can opt out of link sharing (Quick quizzes makes its own links)
    const own = document.documentElement.dataset.share === 'off';
    if (!own) { restoring = true; restoreState(); restoring = false; watchUrl(); addShareButton(); }
    attachTips();
    addCopyButtons();
    addTableButtons();
    startGlossary();
    recordVisit();
    // Some tools build parts later (tabs, practice): pick those up too
    let t = null;
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { attachTips(); addCopyButtons(); placeCopyButtons(); addTableButtons(); }, 300); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
