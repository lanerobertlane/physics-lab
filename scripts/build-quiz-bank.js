// Builds js/quiz-bank.js from the notes in scripts/quiz-raw/*.txt
// Run: node scripts/build-quiz-bank.js
//
// Each notes file:
//   SOURCE GRN Science / Year 11 / Physics / Waves
//   ## Quiz title   (anything in brackets after the title is a note and is ignored)
//   type | topic | tool | question | options or answer | EXP: explanation
// Types: mc (one answer), multi (tick all), tf (TRUE/FALSE), short (ACCEPT: a; b),
//        num (NUM: 1000 J), open (MODEL: a model answer, marked by the student).
// In options, * marks a correct one. Square brackets [ ... ] are notes for the teacher
// and are left out, except [img: ...], which names a picture.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const rawDir = path.join(__dirname, 'quiz-raw');

// Check every tag against the catalogue, so a typo doesn't make an orphan topic
const cat = {};
vm.runInNewContext(`${fs.readFileSync(path.join(root, 'js', 'catalogue.js'), 'utf8')}\nthis.TOPICS = TOPICS; this.TOOLS = TOOLS;`, cat);
const toolNames = new Set(cat.TOOLS.map((t) => `${t.topic}|${t.name}`));

// Pictures are drawn in js/quiz-images.js; [img: key] must name one of them
const imgSrc = fs.readFileSync(path.join(root, 'js', 'quiz-images.js'), 'utf8');
const IMG_KEYS = new Set([
  ...[...imgSrc.matchAll(/^\s+'?([a-z0-9-]+)'?: (?:S\(|C\.component\()/gm)].map((m) => m[1]),
  ...[...imgSrc.matchAll(/pics\.([a-z0-9]+) = /g)].map((m) => m[1]),
]);
const IMG = {
  'fixed resistor symbol': 'resistor',
  'three circuits. 1: one cell, one lamp, V1 across lamp. 2: two cells, one lamp, V2 across lamp. 3: three cells, two lamps in series, V3 across one lamp': 'voltmeters3',
};

const quizzes = [], questions = [], seen = new Map(), problems = [];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stripNotes = (s) => s.replace(/\s*\[(?!img:)[^\]]*\]/g, '').trim();

for (const file of fs.readdirSync(rawDir).filter((f) => f.endsWith('.txt')).sort()) {
  const lines = fs.readFileSync(path.join(rawDir, file), 'utf8').split(/\r?\n/);
  let source = '', quiz = null;
  lines.forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    if (!line.trim()) return;
    if (line.startsWith('SOURCE ')) { source = line.slice(7).trim(); return; }
    if (line.startsWith('Format')) return;
    if (line.startsWith('## ')) {
      // Notes after the title, in ( ) or [ ], are for the teacher and left out
      const title = line.slice(3).replace(/\s*[([].*$/, '').trim();
      const parts = source.split('/').map((s) => s.trim());
      const folder = parts.slice(1).filter((p) => p !== 'Physics').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' · ');
      // Short ids keep the link under the QR code easy to type: y11-1-magnetic-fields
      const year = (parts[1] || '').replace(/^Year\s*/i, 'y');
      let id = slug(`${year} ${title}`), k = 2;
      while (quizzes.some((z) => z.id === id)) id = slug(`${year} ${title} ${k++}`);
      quiz = { id, title, folder, qs: [], ...(source === 'OWN' ? { own: true } : {}) };
      quizzes.push(quiz);
      return;
    }
    if (!quiz) { problems.push(`${where}: question before any ## quiz title`); return; }
    const f = line.split(' | ').map((s) => s.trim());
    const [type, topic, tool, qRaw, body, extra] = f;
    if (!toolNames.has(`${topic}|${tool}`)) problems.push(`${where}: "${topic} | ${tool}" is not in the catalogue`);
    let text = stripNotes(qRaw), img;
    const im = text.match(/\s*\[img:\s*([^\]]+)\]/);
    if (im) {
      img = IMG[im[1].trim()] || im[1].trim();
      if (!IMG_KEYS.has(img)) problems.push(`${where}: no picture called "${im[1].trim()}"`);
      text = text.replace(im[0], '').trim();
    }
    // Key stage: {ks3} {ks4} {both} in the question, otherwise from the year folder
    let lv = /^Year\s*(7|8)(?!\d)/i.test(quiz.folder) ? 'ks3' : 'ks4'; // Y9 folders are GCSE units
    const lm = text.match(/\s*\{(ks3|ks4|both)\}/);
    if (lm) { lv = lm[1]; text = text.replace(lm[0], '').trim(); } else if (quiz.own) problems.push(`${where}: our own questions need a level: {ks3}, {ks4} or {both}`);
    const q = { type, topic, tool, q: text, lv };
    if (img) q.img = img;
    const b = stripNotes(body || '');
    if (type === 'mc' || type === 'multi') {
      const opts = b.split(';').map((s) => s.trim()).filter(Boolean);
      q.opts = opts.map((o) => o.replace(/^\*/, ''));
      q.ans = opts.map((o, k) => (o.startsWith('*') ? k : -1)).filter((k) => k >= 0);
      if (!q.ans.length) problems.push(`${where}: no correct option`);
      if (type === 'mc' && q.ans.length !== 1) problems.push(`${where}: mc needs exactly one correct option`);
    } else if (type === 'tf') {
      if (!/^(TRUE|FALSE)$/.test(b)) problems.push(`${where}: tf answer must be TRUE or FALSE`);
      q.ans = b === 'TRUE';
    } else if (type === 'short') {
      q.accept = b.replace(/^ACCEPT:\s*/, '').split(';').map((s) => s.trim()).filter(Boolean);
    } else if (type === 'num') {
      const m = b.match(/^NUM:\s*([-\d.eE]+)\s*(.*)$/);
      if (!m) problems.push(`${where}: num answer must look like NUM: 150 J`);
      else { q.num = Number(m[1]); q.unit = m[2].trim(); }
    } else if (type === 'open') {
      q.model = b.replace(/^MODEL:\s*/, '');
    } else problems.push(`${where}: unknown type "${type}"`);
    const ex = (extra || '').match(/^EXP:\s*(.*)$/);
    if (ex) q.exp = stripNotes(ex[1]);
    // The same question in two quizzes is stored once
    const key = `${type}|${q.q.toLowerCase()}`;
    let id = seen.get(key);
    if (!id) {
      // Based on the question text, so ids (and quiz links) don't change when more quizzes are added
      let h = 2166136261;
      for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
      id = `${topic.slice(0, 3)}${h.toString(36).slice(0, 5)}`;
      if (questions.some((x) => x.id === id)) problems.push(`${where}: question id clash, reword slightly`);
      q.id = id; seen.set(key, id); questions.push(q);
    }
    quiz.qs.push(id);
  });
}

// Our own questions (SOURCE OWN) go into the bank and the Practice tabs, but aren't department quizzes
for (let i = quizzes.length - 1; i >= 0; i--) if (!quizzes[i].qs.length || quizzes[i].own) quizzes.splice(i, 1);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// The page each question belongs to, from the tool's link in the catalogue
const pageOf = new Map(cat.TOOLS.filter((t) => t.href).map((t) => [`${t.topic}|${t.name}`, t.href.replace(/^tools\//, '').replace(/\.html.*$/, '')]));
for (const q of questions) { const pg = pageOf.get(`${q.topic}|${q.tool}`); if (pg) q.pg = pg; }

const head = '// Built by scripts/build-quiz-bank.js from scripts/quiz-raw/*.txt. Don\'t edit by hand.\n';
fs.writeFileSync(path.join(root, 'js', 'quiz-bank.js'), `${head}window.QUIZ_BANK = ${JSON.stringify({ quizzes, questions }, null, 1)};\n`);

// One small file per tool page for its Practice questions tab, so tools don't load the whole bank
const pagesDir = path.join(root, 'js', 'quiz-pages');
fs.mkdirSync(pagesDir, { recursive: true });
for (const f of fs.readdirSync(pagesDir)) fs.unlinkSync(path.join(pagesDir, f));
const byPage = new Map();
for (const q of questions) if (q.pg) { if (!byPage.has(q.pg)) byPage.set(q.pg, []); byPage.get(q.pg).push(q); }
for (const [pg, qs] of byPage) fs.writeFileSync(path.join(pagesDir, `${pg}.js`), `${head}window.QUIZ_BANK = ${JSON.stringify({ quizzes: [], questions: qs })};\n`);

// Make sure each of those tool pages loads what its Practice tab needs, in this order
const NEEDS = ['equations-data.js', 'practice-core.js', 'circuit-symbols.js', 'quiz-images.js', 'quiz-core.js', 'quiz-pages/PG.js'];
const added = [];
for (const pg of byPage.keys()) {
  const file = path.join(root, 'tools', `${pg}.html`);
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';   // keep the file's own line endings
  let html = raw.replace(/\r\n/g, '\n');
  const before = html;
  const has = (src) => html.includes(`src="../js/${src}"`);
  const missing = NEEDS.map((s) => s.replace('PG', pg)).filter((s) => !has(s));
  const tags = missing.map((s) => `  <script src="../js/${s}"></script>\n`).join('');
  const tab = html.match(/ *<script src="\.\.\/js\/practice-tab\.js"[^>]*><\/script>\n/);
  if (tab) html = html.replace(tab[0], tags + tab[0]);
  else html = html.replace(/\n<\/body>/, `\n${tags}  <script src="../js/practice-tab.js"></script>\n</body>`);
  if (html !== before) { fs.writeFileSync(file, html.replace(/\n/g, eol)); added.push(pg); }
}
if (added.length) console.log(`Practice tab scripts added to: ${added.join(', ')}`);
const unlinked = questions.filter((q) => !q.pg).length;
console.log(`${quizzes.length} quizzes, ${questions.length} questions on ${byPage.size} tool pages${unlinked ? ` (${unlinked} on tools not built yet)` : ''}`);
