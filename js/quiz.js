// Quick quizzes: students try a quiz on their own, or the teacher shows its QR code on the board and the class
// answers on their own devices. Each answer is marked straight away.
// Nothing is sent anywhere: scores stay on the student's device.
// Questions are drawn and marked by js/quiz-core.js (QZ), shared with each tool's Practice tab.
/* global QUIZ_BANK, TOPICS, TOOLS, QZ */
// While a quiz is being played, the back button returns to the list of quizzes rather than the home page
PK.header({ title: 'Quick quizzes', back: new URLSearchParams(location.search).get('play') ? { href: 'quiz.html', label: 'All quizzes' } : null });

const $ = (id) => document.getElementById(id);
const { esc, norm, answerText, rng, shuffled } = QZ;
const BANK = window.QUIZ_BANK || { quizzes: [], questions: [] };
const Q = new Map(BANK.questions.map((q) => [q.id, q]));
const topicName = (id) => (TOPICS.find((t) => t.id === id) || { name: id }).name;
const topicColour = (id) => (TOPICS.find((t) => t.id === id) || {}).colour || '--accent';

// A quiz's level from its questions: 'ks3', 'ks4', 'both' (suits either) or 'mixed'
function quizLevel(ids) {
  const lv = new Set(ids.map((id) => Q.get(id).lv).filter((l) => l !== 'both'));
  return lv.size === 0 ? 'both' : lv.size === 1 ? [...lv][0] : 'mixed';
}
const levelTag = (lv) => (lv === 'mixed' ? '<span class="tag qz-lv">KS3 and GCSE</span>' : `<span class="tag qz-lv">${QZ.levelName(lv)}</span>`);

// =====================================================================
// Student view: tools/quiz.html?play=<quiz id>  or  ?play=mix&q=id.id.id
// =====================================================================
const params = new URLSearchParams(location.search);
if (params.get('play')) startPlay(); else startTeacher();

function startPlay() {
  document.documentElement.classList.add('qz-playing');
  $('teacher').hidden = true;
  $('play').hidden = false;
  const playId = params.get('play');
  let title, ids;
  if (playId === 'mix') {
    ids = (params.get('q') || '').split('.').filter((id) => Q.has(id));
    title = params.get('t') || 'Quick quiz';
  } else {
    const quiz = BANK.quizzes.find((z) => z.id === playId);
    if (!quiz) { $('play').innerHTML = '<div class="panel"><h2>Quiz not found</h2><p>This quiz link doesn’t match a quiz on the site. Ask your teacher for the QR code again.</p></div>'; return; }
    title = quiz.title; ids = quiz.qs.slice();
  }
  if (!ids.length) { $('play').innerHTML = '<div class="panel"><h2>No questions</h2><p>This link has no questions in it.</p></div>'; return; }
  // Coming from the list, going back keeps their place on the page; from a QR code it opens the list
  const fromList = (() => { try { const r = new URL(document.referrer); return r.pathname === location.pathname && !r.searchParams.get('play'); } catch { return false; } })();
  const backToList = (e) => { if (fromList) { e.preventDefault(); history.back(); } };
  $('pk-back').addEventListener('click', backToList);
  const key = `quiz.run.${playId}.${params.get('q') || ''}`;
  let run = PK.store.get(key, null);
  if (!run || run.ids.join() !== ids.join()) run = newRun(ids);
  function newRun(list) {
    const seed = Math.floor(Math.random() * 1e9);
    const order = params.get('o') === '1' ? shuffled(list, rng(seed)) : list.slice();
    return { ids: list, order, seed, i: 0, res: {} };
  }
  const save = () => PK.store.set(key, run);
  const progress = () => $('play-progress').style.setProperty('--p', `${(Object.keys(run.res).length / run.order.length) * 100}%`);
  $('play-title').textContent = title;
  document.title = `${title} · Mr Lane's Physics Lab`;

  function render() {
    const total = run.order.length;
    progress();
    if (run.i >= total) return renderEnd();
    const q = Q.get(run.order[run.i]);
    $('play-count').textContent = `Question ${run.i + 1} of ${total}`;
    QZ.card($('play-card'), q, {
      res: run.res[q.id],
      seed: run.seed + run.i * 7919,
      keepOrder: params.get('a') === '0',
      onResult: (res) => { run.res[q.id] = res; save(); progress(); },
      nextLabel: run.i + 1 < total ? 'Next question →' : 'See my score',
      onNext: () => { run.i++; save(); render(); window.scrollTo(0, 0); },
    });
  }

  function renderEnd() {
    const total = run.order.length;
    const right = run.order.filter((id) => run.res[id] && run.res[id].ok).length;
    const pct = Math.round((right / total) * 100);
    $('play-count').textContent = 'Finished';
    const wrong = run.order.filter((id) => !(run.res[id] && run.res[id].ok));
    const msg = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Great work.' : pct >= 50 ? 'Good effort. Have another go at the ones you missed.' : 'Keep going: try the ones you missed again.';
    $('play-card').innerHTML = `<div class="qz-end">
      <p class="qz-score"><b>${right}</b> out of ${total}</p>
      <p class="qz-msg">${msg}</p>
      <ol class="qz-review">${run.order.map((id) => { const q = Q.get(id), r = run.res[id] || {}; return `<li class="${r.ok ? 'good' : 'bad'}"><span class="mk" aria-label="${r.ok ? 'right' : 'wrong'}">${r.ok ? '✓' : '✗'}</span> ${esc(q.q)}${r.ok ? '' : `<br><small>Answer: ${esc(answerText(q))}</small>`}</li>`; }).join('')}</ol>
      <div class="btn-row qz-actions">${wrong.length ? '<button class="btn primary qz-big" id="qz-redo">Try the ones I got wrong</button>' : ''}<button class="btn qz-big" id="qz-again">Start again</button><a class="btn ${wrong.length ? '' : 'primary '}qz-big" id="qz-back" href="quiz.html">Back to all quizzes</a></div>
    </div>`;
    if ($('qz-redo')) $('qz-redo').addEventListener('click', () => { run = { ...newRun(run.ids), order: wrong }; save(); render(); });
    $('qz-again').addEventListener('click', () => { run = newRun(run.ids); save(); render(); });
    $('qz-back').addEventListener('click', backToList);
  }
  render();
}

// =====================================================================
// Teacher and revision view: choose a quiz, try it, or show its QR code on the board
// =====================================================================
function startTeacher() {
  const qTopics = (ids) => [...new Set(ids.map((id) => Q.get(id).topic))];
  const tagHtml = (t) => `<span class="tag qz-tag" style="--c:var(${topicColour(t)})">${esc(topicName(t))}</span>`;
  let level = PK.store.get('quiz.level', 'all');
  const levelOk = (lv) => level === 'all' || lv === level || lv === 'both' || lv === 'mixed';

  // --- Department quizzes, laid out like the Showbie library: Year › folder › quiz ---
  const opened = new Set(PK.store.get('quiz.open', []) || []);
  const plural = (n) => `${n} quiz${n === 1 ? '' : 'zes'}`;
  const row = (z) => `<div class="qz-row">
        <div class="qz-row-main"><button class="qz-title" data-preview="${z.id}" aria-haspopup="dialog">${esc(z.title)}</button><span class="note">${z.qs.length} question${z.qs.length === 1 ? '' : 's'} · <button class="linkish" data-preview="${z.id}" aria-haspopup="dialog">See the questions</button></span><div class="qz-tags">${levelTag(z.lv)}${qTopics(z.qs).map(tagHtml).join('')}</div></div>
        <div class="btn-row"><button class="btn" data-try="${z.id}">Try it</button><button class="btn primary" data-board="${z.id}">Show on board</button></div>
      </div>`;
  function renderList() {
    const term = norm($('qz-search').value);
    const years = new Map();   // "Year 7" → { loose: [quizzes], folders: Map(name → [quizzes]) }
    for (const z of BANK.quizzes) {
      const lv = quizLevel(z.qs);
      if (!levelOk(lv)) continue;
      const hay = norm(`${z.title} ${z.folder} ${z.qs.map((id) => Q.get(id).q).join(' ')}`);
      if (term && !hay.includes(term)) continue;
      const [year, ...rest] = z.folder.split(' · ');
      if (!years.has(year)) years.set(year, { loose: [], folders: new Map() });
      const y = years.get(year), sub = rest.join(' · ');
      if (!sub) y.loose.push({ ...z, lv });
      else { if (!y.folders.has(sub)) y.folders.set(sub, []); y.folders.get(sub).push({ ...z, lv }); }
    }
    const yearNum = (y) => Number((y.match(/\d+/) || [99])[0]);
    const isOpen = (key) => (term || opened.has(key) ? ' open' : '');
    $('qz-list').innerHTML = years.size ? [...years].sort((a, b) => yearNum(a[0]) - yearNum(b[0])).map(([year, y]) => {
      const n = y.loose.length + [...y.folders.values()].reduce((s, l) => s + l.length, 0);
      // Folders first, then the quizzes that sit loose in the year, as Showbie lists them
      return `<details class="qz-year" data-key="${esc(year)}"${isOpen(year)}>
        <summary><h3>${esc(year)}</h3><span class="note">${plural(n)}</span></summary>
        ${[...y.folders].map(([sub, list]) => { const key = `${year} · ${sub}`; return `<details class="qz-group" data-key="${esc(key)}"${isOpen(key)}>
          <summary><h4>${esc(sub)}</h4><span class="note">${plural(list.length)}</span></summary>${list.map(row).join('')}</details>`; }).join('')}
        ${y.loose.map(row).join('')}
      </details>`;
    }).join('') : '<p class="note">No quizzes match.</p>';
    setOpenAll();
  }
  function setOpenAll() { $('qz-openall').textContent = $('qz-list').querySelector('details:not([open])') ? 'Open all' : 'Close all'; }
  $('qz-search').addEventListener('input', renderList);
  // Remember which years and folders are open (not while searching, which opens everything it finds)
  $('qz-list').addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d.matches || !d.matches('details[data-key]') || norm($('qz-search').value)) return;
    if (d.open) opened.add(d.dataset.key); else opened.delete(d.dataset.key);
    PK.store.set('quiz.open', [...opened]);
    setOpenAll();
  }, true);
  $('qz-openall').addEventListener('click', () => {
    const open = $('qz-openall').textContent === 'Open all';
    $('qz-list').querySelectorAll('details[data-key]').forEach((d) => { d.open = open; });
  });
  $('qz-list').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const z = BANK.quizzes.find((x) => x.id === (b.dataset.try || b.dataset.board || b.dataset.preview));
    if (!z) return;
    const url = () => playUrl({ play: z.id });
    if (b.dataset.preview) showPreview(z.title, z.qs, () => { location.href = url(); }, () => showBoard(z.title, z.qs.length, url()), b);
    else if (b.dataset.try) location.href = url(); else showBoard(z.title, z.qs.length, url());
  });

  // --- Build by topic ---
  const picked = new Set(PK.store.get('quiz.tools', []) || []);
  let byTool = new Map();
  function sortByTool() {
    byTool = new Map();
    for (const q of BANK.questions) {
      if (!QZ.fitsLevel(q, level)) continue;
      const k = `${q.topic}|${q.tool}`;
      if (!byTool.has(k)) byTool.set(k, []);
      byTool.get(k).push(q.id);
    }
  }
  // A tool can be listed under more than one topic (catalogue `also`); its questions are filed under its main topic
  const toolKey = (x) => `${x.topic}|${x.name}`;
  const toolsIn = (id) => TOOLS.filter((x) => (x.topic === id || (x.also || []).includes(id)) && byTool.has(toolKey(x)));
  function renderBuild() {
    sortByTool();
    const topics = TOPICS.filter((t) => toolsIn(t.id).length);
    $('qz-build').innerHTML = topics.map((t) => {
      const tools = toolsIn(t.id);
      const allOn = tools.every((x) => picked.has(toolKey(x)));
      return `<fieldset class="qz-topic" style="--c:var(${t.colour})"><legend><label class="toggle"><input type="checkbox" data-topic="${t.id}" ${allOn ? 'checked' : ''}> ${esc(t.name)}</label></legend>
        <div class="qz-tools">${tools.map((x) => { const k = toolKey(x); return `<label class="toggle"><input type="checkbox" data-tool="${esc(k)}" ${picked.has(k) ? 'checked' : ''}> ${esc(x.name)} <span class="note">(${byTool.get(k).length})</span></label>`; }).join('')}</div></fieldset>`;
    }).join('') || '<p class="note">No questions at this level yet.</p>';
    updateCount();
  }
  function pool() { return [...picked].flatMap((k) => byTool.get(k) || []); }
  function updateCount() {
    const n = pool().length;
    $('qz-pool').textContent = n ? `${n} question${n === 1 ? '' : 's'} to choose from.` : 'Tick at least one topic.';
    $('qz-build-board').disabled = !n; $('qz-build-try').disabled = !n; $('qz-build-preview').disabled = !n;
  }
  $('qz-build').addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.topic) {
      toolsIn(el.dataset.topic).forEach((x) => { if (el.checked) picked.add(toolKey(x)); else picked.delete(toolKey(x)); });
    } else if (el.dataset.tool) {
      if (el.checked) picked.add(el.dataset.tool); else picked.delete(el.dataset.tool);
    }
    if (el.dataset.topic || el.dataset.tool) renderBuild();   // a tool can appear under two topics, so redraw both
    PK.store.set('quiz.tools', [...picked]);
    updateCount();
  });
  function buildMix() {
    const all = pool(), n = $('qz-n').value === 'all' ? all.length : Math.min(Number($('qz-n').value), all.length);
    const ids = shuffled(all, rng(Math.floor(Math.random() * 1e9))).slice(0, n);
    const names = [...new Set(ids.map((id) => topicName(Q.get(id).topic)))];
    const title = names.length <= 2 ? `${names.join(' and ')} quiz` : 'Mixed physics quiz';
    return { ids, title, url: playUrl({ play: 'mix', q: ids.join('.'), t: title }) };
  }
  $('qz-build-board').addEventListener('click', () => { const m = buildMix(); showBoard(m.title, m.ids.length, m.url); });
  $('qz-build-try').addEventListener('click', () => { location.href = buildMix().url; });
  $('qz-build-preview').addEventListener('click', (e) => {
    const m = buildMix();
    showPreview(m.title, m.ids, () => { location.href = m.url; }, () => showBoard(m.title, m.ids.length, m.url), e.currentTarget, 'These are picked at random, so you get a different set each time you press Preview.');
  });

  // --- Level: all, KS3 or GCSE ---
  const lvBox = $('qz-level');
  const showLevel = () => lvBox.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.lv === level)));
  lvBox.addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    level = b.dataset.lv; PK.store.set('quiz.level', level);
    showLevel(); renderList(); renderBuild();
  });
  showLevel();

  // --- Tabs ---
  const tabs = $('qz-tabs');
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    tabs.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    $('qz-pane-list').hidden = b.dataset.t !== 'list';
    $('qz-pane-build').hidden = b.dataset.t !== 'build';
    PK.store.set('quiz.tab', b.dataset.t);
  });
  if (PK.store.get('quiz.tab', 'list') === 'build') tabs.querySelector('[data-t="build"]').click();
  $('qz-total').textContent = `${BANK.quizzes.length} quizzes, ${BANK.questions.length} questions`;
  renderList();
  renderBuild();
}

function playUrl(p) {
  const u = new URL(location.href);
  u.search = ''; u.hash = '';
  for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v);
  if ($('qz-order') && $('qz-order').checked) u.searchParams.set('o', '1');
  return u.toString();
}

// ---------- Preview: every question in a quiz, answers hidden until asked for ----------
function showPreview(title, ids, onTry, onBoard, opener, note) {
  const kind = { mc: 'Choose one', multi: 'Tick all that apply', tf: 'True or false', short: 'Type the answer', num: 'Calculate', open: 'Written answer' };
  const items = ids.map((id) => Q.get(id)).filter(Boolean).map((q) => {
    let opts = '';
    if (q.type === 'mc' || q.type === 'multi') opts = `<ul class="qz-p-opts">${q.opts.map((o, k) => `<li${q.ans.includes(k) ? ' class="qz-p-right"' : ''}>${esc(o)}</li>`).join('')}</ul>`;
    return `<li><p class="qz-p-q">${esc(q.q)} <span class="note">(${kind[q.type] || ''} · ${QZ.levelName(q.lv)})</span></p>${QZ.imgHtml(q, 'qz-img qz-p-img')}${opts || `<p class="qz-p-ans"><b>Answer:</b> ${esc(answerText(q))}</p>`}</li>`;
  }).join('');
  const m = document.createElement('div');
  m.className = 'pk-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'qz-p-title');
  m.innerHTML = `<div class="pk-modal-box qz-preview">
      <h2 id="qz-p-title">${esc(title)}</h2>
      <p class="note" style="margin-top:0">${ids.length} question${ids.length === 1 ? '' : 's'}${note ? `. ${esc(note)}` : ''}</p>
      <label class="toggle"><input type="checkbox" id="qz-p-show"> Show the answers</label>
      <ol class="qz-p-list">${items}</ol>
      <div class="btn-row qz-p-bar">
        <button class="btn" id="qz-p-close">Close</button>
        <button class="btn" id="qz-p-try">Try it</button>
        <button class="btn primary" id="qz-p-board">Show on board</button>
      </div></div>`;
  document.body.appendChild(m);
  QZ.fillImgs(m);
  const close = () => { m.remove(); document.removeEventListener('keydown', onKey); if (opener) opener.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  m.addEventListener('click', (e) => { if (e.target === m) close(); });
  m.querySelector('#qz-p-show').addEventListener('change', (e) => m.querySelector('.qz-preview').classList.toggle('qz-p-answers', e.target.checked));
  m.querySelector('#qz-p-close').addEventListener('click', close);
  m.querySelector('#qz-p-try').addEventListener('click', () => { close(); onTry(); });
  m.querySelector('#qz-p-board').addEventListener('click', () => { close(); onBoard(); });
  m.querySelector('#qz-p-close').focus();
}

// ---------- The board: a big QR code for the class to scan ----------
function showBoard(title, n, url) {
  const m = document.createElement('div');
  m.className = 'qz-board'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', `QR code for ${title}`);
  m.innerHTML = `<div class="qz-board-inner">
      <h1>${esc(title)}</h1>
      <p class="qz-board-sub">${n} question${n === 1 ? '' : 's'} · Scan with your iPad camera</p>
      <div class="qz-board-qr"><canvas aria-label="QR code"></canvas><p class="note" id="qz-qr-msg">Making the QR code…</p></div>
      <p class="qz-board-link">${esc(url.replace(/^https?:\/\//, ''))}</p>
    </div>
    <div class="p-bar qz-board-bar"><button class="btn" id="qz-copy">Copy link</button><button class="btn primary" id="qz-close">Close</button></div>`;
  document.body.appendChild(m);
  const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  m.querySelector('#qz-close').addEventListener('click', close);
  m.querySelector('#qz-copy').addEventListener('click', () => PK.copyLink(url));
  const bar = m.querySelector('.qz-board-bar');
  if (typeof PQ !== 'undefined' && PQ.presentTools) PQ.presentTools(m, bar);
  m.querySelector('#qz-close').focus();
  const draw = () => {
    if (!PK.qr) return setTimeout(draw, 100);
    PK.qr.load().then(() => {
      const ok = PK.qr.draw(m.querySelector('canvas'), url);
      m.querySelector('#qz-qr-msg').textContent = ok ? '' : 'This link is too long for a QR code. Use Copy link instead.';
    }).catch(() => { m.querySelector('#qz-qr-msg').textContent = 'The QR code couldn’t be made (are you offline?). Use Copy link instead.'; m.querySelector('canvas').hidden = true; });
  };
  draw();
}
