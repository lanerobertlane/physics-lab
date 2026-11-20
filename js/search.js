// The home page search. A tool matches when every word of the search is found in its name,
// description, topic, specification points (their wording and codes) or extra search words
// (js/search-words.js). It copes with:
// - the starts of words (magn, refrac) and plurals (lenses, batteries);
// - spellings and other words for the same thing (color, voltage, earthquake);
// - words run together or split up (halflife, half life, half-life);
// - equations typed with or without spaces (v = fλ, F=ma, P = E/t);
// - spec point numbers, and the start of them (4.6.1.5, 4.6), including Combined Science's
//   numbers (6.x for physics, 5.x for chemistry).
window.PKSearch = (() => {
  const SWAP = [['÷', '/'], ['½', '1/2'], ['²', '2'], ['³', '3'], ['–', '-'], ['—', '-'], ['’', "'"], ['‘', "'"], ['×', ' '], ['·', ' '], [' ', ' ']];
  const norm = (s) => { let t = String(s).toLowerCase(); for (const [a, b] of SWAP) t = t.split(a).join(b); return t; };
  const SEP = /[\s.,;:()'"!?/|-]/;
  // Squash the text together, remembering where each word started: "half-life" → "halflife"
  function squash(text) {
    let flat = '', gap = true;
    const starts = new Set();
    for (const ch of text) {
      if (SEP.test(ch)) { gap = true; continue; }
      if (gap) starts.add(flat.length);
      flat += ch; gap = false;
    }
    return { flat, starts };
  }
  // Other words for the same thing, or other spellings
  const ALSO = {
    color: ['colour'], colors: ['colours'], colored: ['coloured'], gray: ['grey'], aluminum: ['aluminium'], sulphur: ['sulfur'], sulfur: ['sulphur'],
    meter: ['metre', 'meter'], meters: ['metres'], center: ['centre'], fiber: ['fibre'], vapor: ['vapour'],
    voltage: ['potential difference', 'p.d', 'volt'], volts: ['potential difference', 'volt'], pd: ['potential difference'], emf: ['induced', 'potential difference'],
    gravity: ['gravit'], radioactivity: ['radioactiv', 'decay'], speed: ['speed', 'velocity'], velocity: ['velocity', 'speed'],
    ac: ['alternating', 'a.c'], dc: ['direct current', 'd.c'], em: ['electromagnetic'], ir: ['infrared'], uv: ['ultraviolet'], xray: ['x-ray', 'x ray'], xrays: ['x-ray', 'x ray'],
  };
  // The word, other words for it, and the word without its ending: lenses → lens, batteries → battery,
  // or with its plural ending: galaxy → galaxies
  function forms(w) {
    const out = [w, ...(ALSO[w] || [])];
    if (w.length > 3 && /[^aeiou]y$/.test(w)) out.push(`${w.slice(0, -1)}ies`);
    if (w.length > 4 && w.endsWith('ies')) out.push(`${w.slice(0, -3)}y`);
    if (w.length > 4 && /(s|x|z|ch|sh)es$/.test(w)) out.push(w.slice(0, -2));
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) out.push(w.slice(0, -1));
    return out;
  }
  const isCode = (w) => /^\d+(\.\d+)*\.?$/.test(w);

  function index(tools, topics, specIndex, words) {
    const byPage = {};
    for (const p of specIndex || []) byPage[p.page] = p;
    const data = new Map();
    for (const t of tools) {
      const page = t.href ? t.href.replace(/^tools\//, '').replace(/\.html.*$/, '') : '';
      const sp = byPage[page];
      const topicName = (id) => (topics.find((x) => x.id === id) || {}).name || '';
      const text = norm([t.name, t.desc, topicName(t.topic), ...(t.also || []).map(topicName), sp ? sp.spec.map((s) => s.text).join(' ') : '', (words && words[t.name]) || ''].join(' | '));
      // Each code, and whether it's a Chemistry one (a Chemistry tool's, or marked "Chem" in a Physics tool)
      const codes = sp ? sp.spec.map((s) => (s.code.startsWith('Chem ') ? { c: s.code.slice(5), chem: true } : { c: s.code, chem: sp.course === 'chemistry' })) : [];
      data.set(t, { text, ...squash(text), codes });
    }
    function codeMatches(d, w) {
      const code = w.replace(/\.$/, '');
      // Combined Science numbers its physics 6.1–6.7 and its chemistry 5.x, where the separate sciences use 4.x
      return d.codes.some(({ c, chem }) => {
        const tries = [code];
        if (!chem && code.startsWith('6.')) tries.push(`4.${code.slice(2)}`);
        if (chem && code.startsWith('5.')) tries.push(`4.${code.slice(2)}`);
        return tries.some((x) => c === x || c.startsWith(`${x}.`));
      });
    }
    // Found at the start of a word, ignoring spaces and hyphens: "magn" finds "magnetic" but not "electromagnetic"
    function atWordStart(d, phrase) {
      const f = squash(phrase).flat;
      if (!f) return false;
      for (let i = d.flat.indexOf(f); i >= 0; i = d.flat.indexOf(f, i + 1)) if (d.starts.has(i)) return true;
      return false;
    }
    function match(t, q) {
      const d = data.get(t);
      const query = norm(q).trim();
      if (!query) return true;
      if (!d) return false;
      // An equation: look for it with the spaces taken out
      if (query.includes('=')) return d.flat.includes(squash(query).flat);
      const ws = query.split(/[\s-]+/).filter(Boolean);
      for (let i = 0; i < ws.length; i++) {
        const w = ws[i];
        if (isCode(w)) { if (!codeMatches(d, w)) return false; continue; }
        // A letter or two (the P in "P waves") only counts together with the next word
        if (w.length <= 2 && i + 1 < ws.length && !isCode(ws[i + 1])) {
          if (!forms(ws[i + 1]).some((n) => atWordStart(d, `${w} ${n}`))) return false;
          i++;
          continue;
        }
        if (w.length <= 2) { if (!forms(w).some((f) => new RegExp(`(^|[^a-z0-9])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(d.text))) return false; continue; }
        if (!forms(w).some((f) => atWordStart(d, f))) return false;
      }
      return true;
    }
    return { match };
  }
  return { index };
})();
