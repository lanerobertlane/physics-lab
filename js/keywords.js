// Key words & flashcards: the key words for KS3 and AQA GCSE Physics (js/glossary.js) with what they
// mean, by topic, and flashcards to learn them. It opens on the flashcards. Tap a card to turn it over;
// Space and the arrow keys work on a board. Chemistry words are left out: this is a physics page.

PK.header({
  title: 'Key words & flashcards',
  specNote: 'AQA references are to Working scientifically (WS), which is the same in GCSE Physics, Chemistry, Biology and Combined Science. The meanings use the AQA GCSE Physics (8463) specification’s wording where it gives one.',
  spec: [
    { code: 'WS 4.1', text: 'Use scientific vocabulary, terminology and definitions' },
  ],
});

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SECTIONS = Object.fromEntries(Object.entries(window.PK_GLOSSARY_SECTIONS).filter(([id]) => id !== 'chemistry'));
const topicOf = (id) => TOPICS.find((t) => t.id === id) || { id, name: id, colour: '--accent' };
const LONG = { reference: 'Working scientifically & maths' };
const nameOf = (id) => LONG[id] || topicOf(id).name;
// Every word once, with its topic and level ('ks3' KS3 only, 'both', or 'gcse'), in topic order then A–Z
const WORDS = [];
for (const [topic, words] of Object.entries(SECTIONS)) {
  const list = Object.entries(words).map(([word, v]) => ({ word, def: v.def, also: v.also || [], topic, lv: v.lv || 'gcse' }));
  list.sort((a, b) => a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }));
  WORDS.push(...list);
}
const pressed = (id) => document.querySelector(`#${id} [aria-pressed="true"]`).dataset.v;
const state = { tab: 'cards' };
// KS3 shows the words marked 'both'; GCSE shows every word, the KS3 ones included
const levelOk = (w) => pressed('kwlevel') !== 'ks3' || w.lv === 'both';
const inTopic = (w) => levelOk(w) && ($('kwtopic').value === 'all' || w.topic === $('kwtopic').value);

// ---------- Setting out the meanings ----------
// Short symbol equations (Ek = ½ m v², v = f λ) stay on one line, with subscripts. No line starts with
// =, × or ÷, numbers stay with their units, and big numbers stay in one piece (300 000 000).
const shortToken = (t) => /^\(?[A-Za-zΔρλθ½0-9²³⁸¹⁰⁻.\/÷×]{1,3}\)?$/.test(t);
const ends = (t) => /[.,;:]$/.test(t);
function fmt(text) {
  const w = text.split(' ');
  const inEq = new Array(w.length).fill(false);
  w.forEach((t, i) => {
    if (t !== '=' || i === 0 || ends(w[i - 1]) || !shortToken(w[i - 1])) return;
    let a = i - 1;
    while (a > 0 && !ends(w[a - 1]) && shortToken(w[a - 1])) a--;
    let b = i + 1;
    while (b < w.length && shortToken(w[b].replace(/[.,;:]$/, '')) && !(b > i + 1 && ends(w[b - 1]))) b++;
    if (b === i + 1) return;
    for (let k = a; k < b; k++) inEq[k] = true;
  });
  let html = '', run = [];
  const flush = () => {
    if (!run.length) return;
    const last = run[run.length - 1], trail = /[.,;:]$/.test(last) ? last.slice(-1) : '';
    if (trail) run[run.length - 1] = last.slice(0, -1);
    html += `<span class="eq">${esc(run.join(' ')).replace(/\bE([kpe])(?= =)/g, 'E<sub>$1</sub>')}</span>${trail}`;
    run = [];
  };
  w.forEach((t, i) => {
    if (inEq[i]) { if (!run.length && html) html += ' '; run.push(t); if (!inEq[i + 1]) flush(); return; }
    html += (html ? ' ' : '') + esc(t);
  });
  return html
    .replace(/ (=|×|÷)(?= )/g, '&nbsp;$1')                    // no line starts with = × ÷
    .replace(/(×) (10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, '$1&nbsp;$2')          // 3 × 10⁸ stays together
    .replace(/(\d) (?=\d{3}\b)/g, '$1&nbsp;')                 // 300 000 000
    .replace(/([\d⁰¹²³⁴⁵⁶⁷⁸⁹]) (?=(?:kg|g|V|Hz|kHz|N|N\/kg|N\/m|m|m\/s|km|cm|mm|s|J|kJ|W|kW|kWh|A|C|Ω|Sv|mSv|cm³|m³|%)(?![\w/])|°C)/g, '$1&nbsp;');   // numbers keep their units
}

// ---------- Word list ----------
function renderList() {
  const q = $('kwsearch').value.trim().toLowerCase();
  const hit = (w) => !q || [w.word, ...w.also, w.def].some((s) => s.toLowerCase().includes(q));
  const pool = WORDS.filter(levelOk), shown = WORDS.filter((w) => inTopic(w) && hit(w));
  const groups = Object.keys(SECTIONS).map((topic) => [topic, shown.filter((w) => w.topic === topic)]).filter(([, ws]) => ws.length);
  const lvName = pressed('kwlevel') === 'ks3' ? 'KS3' : 'GCSE';
  $('kw-count').textContent = shown.length === pool.length ? `${pool.length} ${lvName} key words` : `${shown.length} of ${pool.length} ${lvName} key words`;
  $('kw-list').innerHTML = groups.length ? groups.map(([topic, ws]) => {
    const t = topicOf(topic);
    return `<section class="kw-group" style="--topic: var(${t.colour})">
        <h3 class="kw-head">${esc(nameOf(topic))} <span class="kw-n">${ws.length} word${ws.length === 1 ? '' : 's'}</span></h3>
        <dl class="kw-dl">${ws.map((w) => `<dt>${esc(w.word)}</dt><dd>${fmt(w.def)}</dd>`).join('')}</dl>
      </section>`;
  }).join('') : '<p class="kw-none">No key words match that. Try part of the word, or choose All topics.</p>';
}

// ---------- Flashcards ----------
const fc = { order: [], i: 0, flipped: false };
function newDeck(shuffle) {
  fc.order = WORDS.filter(inTopic).map((w) => WORDS.indexOf(w));
  if (shuffle) for (let j = fc.order.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [fc.order[j], fc.order[k]] = [fc.order[k], fc.order[j]]; }
  fc.i = 0; fc.flipped = false;
}
function renderCard() {
  if (!fc.order.length) newDeck(false);
  if (!fc.order.length) {
    $('fc-front').innerHTML = '<span class="fc-def">No key words for this topic at this level.</span>';
    $('fc-back').innerHTML = '';
    $('fc-count').textContent = '';
    $('fc-prev').disabled = $('fc-next').disabled = $('fc-turn').disabled = true;
    return;
  }
  $('fc-turn').disabled = false;
  const w = WORDS[fc.order[fc.i]], wordFirst = pressed('front') === 'word';
  const face = (isWord) => (isWord
    ? `<span class="fc-label">Key word</span><span class="fc-word">${esc(w.word)}</span>`
    : `<span class="fc-label">Meaning</span><span class="fc-def">${fmt(w.def)}</span>`);
  const foot = `<span class="fc-topic">${esc(nameOf(w.topic))}</span>`;
  $('fc-front').innerHTML = face(wordFirst) + foot;
  $('fc-back').innerHTML = face(!wordFirst) + foot;
  $('fc-card').classList.toggle('flipped', fc.flipped);
  $('fc-card').setAttribute('aria-label', fc.flipped ? `${wordFirst ? 'Meaning' : 'Key word'}: ${wordFirst ? w.def : w.word}. Tap to turn back.` : `${wordFirst ? 'Key word' : 'Meaning'}: ${wordFirst ? w.word : w.def}. Tap to turn over.`);
  $('fc-count').textContent = `Card ${fc.i + 1} of ${fc.order.length}`;
  $('fc-prev').disabled = fc.i === 0;
  $('fc-next').disabled = fc.i === fc.order.length - 1;
}
function flip() { if (!fc.order.length) return; fc.flipped = !fc.flipped; renderCard(); }
function move(d) {
  const j = fc.i + d;
  if (j < 0 || j >= fc.order.length) return;
  fc.i = j; fc.flipped = false; renderCard();
}

// ---------- Words ----------
const INTRO = {
  cards: 'Learn the key words. Say what the word means, then turn the card over to check.',
  list: 'The key words for KS3 and AQA GCSE Physics, with what they mean. Choose a topic, or search for a word.',
};
const INFO = {
  cards: '<p>Say the meaning out loud, or write it down, then tap the card to turn it over and check.</p><p>Choose <b>Meaning first</b> to see the meaning and name the key word instead. <b>Shuffle</b> mixes up the cards.</p><p class="note">On a keyboard: Space turns the card over, and the arrow keys go back and forward.</p>',
  list: '<p>The meanings use the AQA specification’s wording where it gives one. <b>KS3</b> shows the words you meet in Years 7 to 9. <b>GCSE</b> shows all of them: the KS3 words as well as the ones for AQA GCSE Physics and Combined Science.</p><p>Search finds words in the meanings too: try <b>energy</b> or <b>current</b>.</p>',
};

// ---------- Controls ----------
function showTab(t) {
  state.tab = t;
  document.querySelectorAll('#tabs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('intro').textContent = INTRO[t];
  $('info').innerHTML = INFO[t];
  if (location.hash !== '#practice') history.replaceState(null, '', t === 'cards' ? location.pathname + location.search : `#${t}`);
  if (t === 'list') renderList(); else renderCard();
}
document.querySelectorAll('#tabs .chip').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)));
$('kwtopic').innerHTML = `<option value="all">All topics</option>${Object.keys(SECTIONS).map((id) => `<option value="${id}">${esc(nameOf(id))}</option>`).join('')}`;
$('kwtopic').addEventListener('change', () => { newDeck(false); if (state.tab === 'list') renderList(); else renderCard(); });
// The level is remembered on this device
const savedLevel = PK.store.get('keywords.level', 'gcse') === 'ks3' ? 'ks3' : 'gcse';
document.querySelectorAll('#kwlevel .chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === savedLevel)));
for (const id of ['kwlevel', 'front']) {
  document.querySelectorAll(`#${id} .chip`).forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll(`#${id} .chip`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (id === 'kwlevel') PK.store.set('keywords.level', b.dataset.v);
    if (id !== 'front') newDeck(false);
    fc.flipped = false;
    if (state.tab === 'list') renderList(); else renderCard();
  }));
}
$('kwsearch').addEventListener('input', renderList);
$('fc-card').addEventListener('click', flip);
$('fc-turn').addEventListener('click', flip);
$('fc-prev').addEventListener('click', () => move(-1));
$('fc-next').addEventListener('click', () => move(1));
$('fc-shuffle').addEventListener('click', () => { newDeck(true); renderCard(); PK.toast('Cards shuffled'); });
document.addEventListener('keydown', (e) => {
  if (state.tab !== 'cards' || e.target.closest('input, select, textarea') || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === ' ' || e.key === 'Enter') { if (e.target.closest('button') && e.target.id !== 'fc-card') return; e.preventDefault(); flip(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
});

// Which card you're on goes in a shared link (the level, topic, search and "show first" go in by themselves)
PK.shareState = {
  get: () => ({ i: fc.i }),
  set: (o) => { newDeck(false); if (Number.isInteger(o.i) && o.i >= 0 && o.i < fc.order.length) fc.i = o.i; if (state.tab === 'list') renderList(); else renderCard(); },
};

newDeck(false);
showTab(PK.initialHash === '#list' ? 'list' : 'cards');
