// Spec index: every specification point the tools cover, grouped by section, with links.
// The data comes from each tool's own spec list (scripts/build-spec-index.js).

PK.header({ title: 'Spec index' });

const $ = (id) => document.getElementById(id);
const state = { q: '', course: PK.store.get('spec.course', 'all') };

const SECTIONS = {
  physics: { '4.1': 'Energy', '4.2': 'Electricity', '4.3': 'Particle model of matter', '4.4': 'Atomic structure', '4.5': 'Forces', '4.6': 'Waves', '4.7': 'Magnetism and electromagnetism', '4.8': 'Space physics' },
  chemistry: { '4.1': 'Atomic structure and the periodic table', '4.2': 'Bonding, structure and the properties of matter' },
};
const nameOf = (page, fallback) => (TOOLS.find((t) => t.href === `tools/${page}.html`) || {}).name || fallback;
const keyOf = (code) => code.split('.').map((n) => n.padStart(3, '0')).join('.');

// Gather every spec point: one row per course + code, with its texts and tools
function rows() {
  const map = new Map();
  for (const t of window.SPEC_INDEX) for (const s of t.spec) {
    const isAqa = /^\d/.test(s.code);
    const course = s.code === 'KS3' ? 'ks3' : isAqa ? t.course : 'skills';
    const k = `${course}|${s.code}`;
    if (!map.has(k)) map.set(k, { course, code: s.code, texts: new Set(), tools: new Map(), ht: false, po: false });
    const r = map.get(k);
    r.texts.add(s.text); r.tools.set(t.page, nameOf(t.page, t.title)); r.ht = r.ht || !!s.ht; r.po = r.po || !!s.po;
  }
  return [...map.values()];
}
const ALL = rows();

function section(course, title, list) {
  if (!list.length) return '';
  let html = `<section class="sec"><h2>${title}</h2>`;
  let group;
  for (const r of list) {
    const g = course === 'physics' || course === 'chemistry' ? r.code.split('.').slice(0, 2).join('.') : null;
    if (g !== group) {
      if (group !== undefined) html += '</tbody></table>';
      group = g;
      html += `${g ? `<h3 style="margin:14px 0 6px">${g} ${SECTIONS[course][g] || ''}</h3>` : ''}<table class="spec"><thead><tr><th>Code</th><th>What it covers</th><th>Tools</th></tr></thead><tbody>`;
    }
    const prefix = course === 'physics' ? 'AQA ' : course === 'chemistry' ? 'AQA Chem ' : '';
    html += `<tr><td class="code">${prefix}${r.code}</td>
      <td class="text">${[...r.texts].map((t) => `<p>${t}</p>`).join('')}${r.ht ? ' <span class="tag ht">Higher</span>' : ''}${r.po ? ' <span class="tag po">Physics only</span>' : ''}</td>
      <td class="links">${[...r.tools].map(([p, n]) => `<a href="${p}.html">${n}</a>`).join('')}</td></tr>`;
  }
  return `${html}</tbody></table></section>`;
}

function render() {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  const match = (r) => !words.length || words.every((w) => `${r.code} ${[...r.texts].join(' ')} ${[...r.tools.values()].join(' ')}`.toLowerCase().includes(w));
  const pick = (course) => ALL.filter((r) => r.course === course && match(r)).sort((a, b) => keyOf(a.code).localeCompare(keyOf(b.code)));
  const show = (c) => state.course === 'all' || state.course === c;
  const parts = [
    show('physics') ? section('physics', 'AQA GCSE Physics (8463)', pick('physics')) : '',
    show('chemistry') ? section('chemistry', 'AQA GCSE Chemistry (8462)', pick('chemistry')) : '',
    show('ks3') ? section('ks3', 'KS3 National Curriculum', pick('ks3')) : '',
    state.course === 'all' ? section('skills', 'Maths and working scientifically', pick('skills')) : '',
  ];
  const n = ALL.filter((r) => match(r) && (state.course === 'all' || r.course === state.course)).length;
  $('list').innerHTML = parts.join('') || '<p class="note">Nothing matches that search.</p>';
  $('count').textContent = `${n} spec point${n === 1 ? '' : 's'}`;
  document.querySelectorAll('#course .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === state.course)));
}

$('q').addEventListener('input', (e) => { state.q = e.target.value.trim(); render(); });
document.querySelectorAll('#course .chip').forEach((b) => b.addEventListener('click', () => { state.course = b.dataset.c; PK.store.set('spec.course', state.course); render(); }));
render();
