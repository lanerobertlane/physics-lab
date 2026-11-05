// Builds js/spec-index-data.js: every tool's specification points (from its PK.header call),
// for the Spec index page. Run after adding or changing a tool:  node scripts/build-spec-index.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = [];
for (const file of fs.readdirSync(path.join(root, 'tools')).filter((f) => f.endsWith('.html'))) {
  const page = file.replace('.html', '');
  const jsFile = path.join(root, 'js', `${page}.js`);
  if (!fs.existsSync(jsFile)) continue;
  const src = fs.readFileSync(jsFile, 'utf8');
  const m = src.match(/PK\.header\(\{([\s\S]*?)\n\}\);/);
  if (!m) continue;
  let header;
  try { header = Function(`return {${m[1]}};`)(); } catch (e) { console.warn(`Skipped ${page}: ${e.message}`); continue; }
  if (!header.spec) continue;
  const course = /Chemistry \(8462\)/.test(header.specNote || '') ? 'chemistry' : 'physics';
  out.push({ page, title: header.title, course, spec: header.spec.map(({ code, text, ht, po }) => ({ code, text, ...(ht ? { ht: 1 } : {}), ...(po ? { po: 1 } : {}) })) });
}
fs.writeFileSync(path.join(root, 'js', 'spec-index-data.js'),
  `// Made by scripts/build-spec-index.js. Don't edit by hand.\nwindow.SPEC_INDEX = ${JSON.stringify(out, null, 1)};\n`);
console.log(`${out.length} tools, ${out.reduce((n, t) => n + t.spec.length, 0)} spec points`);
