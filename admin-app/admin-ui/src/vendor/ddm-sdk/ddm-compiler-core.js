/*! DAM Capital DDM - mapping compiler core, V12 payload (norm-2)
 * Turns the admin mapping source (Part 1 masking rules + Part 2 mappings + meta + routing) into the V12 runtime map.
 * Plain JavaScript with no Node or browser APIs. Used by ddm-compile.mjs; the backend can port it 1:1.
 * Returns { compiled, errors, warnings }. `compiled.meta.configHash` is left null: the caller computes it
 * (see ddmCanonicalJson in ddm-check.js) once the payload is final.
 */
function ddmCompile(src) {
  const LOCS = ['ELEMENT_ID', 'NAME', 'LABEL', 'COLUMN', 'CLASS', 'INLINE'];
  const LOC_ALIAS = { FIELD_ID: 'ELEMENT_ID', DIV_ID: 'ELEMENT_ID', ID: 'ELEMENT_ID', COL_ID: 'COLUMN', COLUMN_HEADER: 'COLUMN', FIELD_LABEL: 'LABEL', FIELD_NAME: 'NAME', CSS_CLASS: 'CLASS', CLASS_ID: 'CLASS', INLINE_LABEL: 'INLINE', TEXT_AFTER_LABEL: 'INLINE' };
  const FN = { FULL_MASK: 'FULL', PARTIAL_MASK: 'PARTIAL', RANGE_MASK: 'RANGE', PATTERN_MASK: 'PATTERN' };
  const NORMALIZATION = 'norm-2';
  const SHORT = 3;   // v5.2 rule 6: cleaned-up keys shorter than this are matched exactly as written

  // Key clean-up of norm-2. Must stay identical to normalizeKey() in ddm-engine.js (see DDM-V12-SPEC.md).
  const normalizeKey = (s) => String(s).normalize('NFKC').toLowerCase().replace(/[\s_\-]+/g, '').replace(/[:*]+$/, '');

  const errors = [];
  const warnings = [];
  const isInt = (n) => Number.isInteger(n);
  const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

  // G3 (spec rule 5): every key must be known. A typo must never silently drop or widen a rule.
  const AUDIT = ['source', 'approvedBy', 'approvedAt'];   // record-keeping keys (spec rule 19): accepted, not shipped to the browser
  const REMOVED = { maskEverywhere: 'no longer an option (a global rule always applies on every page)', type: 'no longer an option' };
  function keysOk(obj, allowed, where) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { errors.push(`${where} must be an object`); return false; }
    for (const k of Object.keys(obj)) {
      if (allowed.includes(k)) continue;
      if (REMOVED[k]) { errors.push(`${where}: "${k}" is ${REMOVED[k]}`); continue; }
      const hint = allowed.find((a) => a.toLowerCase() === k.toLowerCase() || a === k + 's' || a + 's' === k);
      errors.push(`${where}: unknown key "${k}"${hint ? ` (did you mean "${hint}"?)` : ''}; allowed: ${allowed.join(', ')}`);
    }
    return true;
  }
  function arr(v, where, name, required) {
    if (v === undefined) { if (required) errors.push(`${where}: ${name} is required`); return []; }
    if (!Array.isArray(v)) { errors.push(`${where}: ${name} must be a list`); return []; }
    return v;
  }
  keysOk(src, ['schemaVersion', 'configVersion', 'meta', 'routing', 'maskingRules', 'mappings'], 'mapping source');
  if (src.maskingRules === undefined) errors.push('mapping source: maskingRules is required');
  if (src.mappings === undefined) errors.push('mapping source: mappings is required');

  // ---------- meta (approval record; the hash is added by the caller) ----------
  const sm = src.meta ?? {};
  if (src.meta !== undefined) keysOk(src.meta, ['status', 'policyId', 'approvedAt', 'approvedBy'], 'meta');
  if (!sm.status) errors.push('meta.status is required (production builds must be APPROVED)');
  else if (sm.status !== 'APPROVED') warnings.push(`meta.status is "${sm.status}": production builds must be APPROVED (the SDK logs a warning at runtime)`);
  if (!sm.policyId) errors.push('meta.policyId is required');
  if (!sm.approvedAt || Number.isNaN(Date.parse(sm.approvedAt))) errors.push('meta.approvedAt is required and must be an ISO date-time');
  const meta = { status: sm.status, policyId: sm.policyId, approvedAt: sm.approvedAt, configHash: null, normalization: NORMALIZATION };

  // ---------- routing ----------
  const sr = src.routing ?? {};
  if (src.routing !== undefined) keysOk(src.routing, ['contextPath', 'hashRouting', 'stripExtensions'], 'routing');
  let ctx = typeof sr.contextPath === 'string' ? sr.contextPath.trim().toLowerCase().replace(/\/{2,}/g, '/') : '';
  if (sr.contextPath !== undefined && typeof sr.contextPath !== 'string') errors.push('routing.contextPath must be text');
  if (/[?#;*%\s]/.test(ctx)) { errors.push('routing.contextPath must not contain ? # ; * % or spaces'); ctx = ''; }
  if (ctx && ctx[0] !== '/') ctx = '/' + ctx;
  ctx = ctx.replace(/\/+$/, '');
  const hashRouting = sr.hashRouting ?? 'auto';
  if (hashRouting !== 'auto' && hashRouting !== 'off') errors.push('routing.hashRouting must be "auto" or "off"');
  const exts = [];
  for (const e of arr(sr.stripExtensions, 'routing', 'stripExtensions')) {
    const x = String(e).trim().toLowerCase();
    if (!/^\.[a-z0-9]+$/.test(x)) errors.push(`routing.stripExtensions: "${e}" must look like ".jsp"`);
    else if (!exts.includes(x)) exts.push(x);
  }
  const routing = { caseInsensitive: true, stripQuery: true, stripTrailingSlash: true, hashRouting, contextPath: ctx, stripExtensions: exts };

  // ---------- Part 1: masking rules ----------
  const mr = src.maskingRules ?? {};
  if (src.maskingRules !== undefined) keysOk(mr, ['defaults', 'fields'], 'maskingRules');
  const d = mr.defaults ?? {};
  if (mr.defaults !== undefined) keysOk(d, ['maskChar', 'preserveSeparators', 'onFormatMismatch', 'revealable', 'revealTimeoutMs'], 'maskingRules.defaults');
  const defaults = {
    maskChar: d.maskChar ?? '*',
    preserveSeparators: d.preserveSeparators !== false,
    onFormatMismatch: FN[d.onFormatMismatch ?? 'FULL_MASK'] ?? 'FULL',
    revealable: d.revealable !== false,                    // default true: anyone can reveal (no roles in V1)
    revealTimeoutMs: d.revealTimeoutMs ?? 10000
  };
  if (defaults.onFormatMismatch !== 'FULL') errors.push('defaults.onFormatMismatch: only FULL_MASK is supported');
  if ([...String(defaults.maskChar)].length !== 1) errors.push('defaults.maskChar must be one character');
  else if (LETTER_OR_DIGIT.test(defaults.maskChar))      // G5 (spec rule 14)
    warnings.push(`defaults.maskChar "${defaults.maskChar}" is a letter or digit: a masked value can't be told from a real one (keep "*")`);

  const pii = [];
  const piiIndex = new Map();
  const PARAMS = { FULL: ['fixedLength'], PARTIAL: ['showFirst', 'showLast'], RANGE: ['from', 'to'], PATTERN: ['template', 'inputFormat'] };
  if (mr.fields !== undefined && (typeof mr.fields !== 'object' || Array.isArray(mr.fields))) errors.push('maskingRules.fields must be an object');
  for (const [code, f] of Object.entries(mr.fields ?? {})) {
    const where = `maskingRules.fields.${code}`;
    if (!keysOk(f, ['outcome', 'masking', 'revealable', 'rules'], where)) continue;
    if (f.masking !== undefined) keysOk(f.masking, ['function', 'params'], `${where}.masking`);
    if (f.outcome !== 'POLICY') {
      errors.push(`${where}: outcome "${f.outcome}" is not supported yet (only POLICY); confirm its meaning in the DDM spec`);
      continue;
    }
    const fn = FN[f.masking?.function];
    const p = f.masking?.params ?? {};
    if (!fn) { errors.push(`${where}: unknown masking function "${f.masking?.function}"`); continue; }
    keysOk(p, [...PARAMS[fn], 'maskChar', 'preserveSeparators'], `${where}.masking.params`);
    if (p.maskChar !== undefined) {
      if ([...String(p.maskChar)].length !== 1) errors.push(`${where}: maskChar must be one character`);
      else if (LETTER_OR_DIGIT.test(p.maskChar)) warnings.push(`${where}: maskChar "${p.maskChar}" is a letter or digit: a masked value can't be told from a real one (keep "*")`);
    }
    if (f.revealable !== undefined && typeof f.revealable !== 'boolean') errors.push(`${where}: revealable must be true or false`);
    if (fn === 'PARTIAL' && !(isInt(p.showFirst) && isInt(p.showLast) && p.showFirst >= 0 && p.showLast >= 0))
      errors.push(`${where}: PARTIAL_MASK needs whole numbers showFirst and showLast (0 or more)`);
    if (fn === 'RANGE' && !(isInt(p.from) && isInt(p.to) && p.from !== 0 && p.to !== 0))
      errors.push(`${where}: RANGE_MASK needs whole numbers from and to (not 0; negative counts from the end)`);
    if (fn === 'RANGE' && Math.sign(p.from) === Math.sign(p.to) && p.from > p.to)
      errors.push(`${where}: RANGE_MASK from must not be after to`);
    if (fn === 'PATTERN' && !(typeof p.template === 'string' && typeof p.inputFormat === 'string' && p.template.length === p.inputFormat.length))
      errors.push(`${where}: PATTERN_MASK needs template and inputFormat of the same length`);
    if (fn === 'FULL' && p.fixedLength !== undefined && !(isInt(p.fixedLength) && p.fixedLength > 0))
      errors.push(`${where}: fixedLength must be a whole number above 0`);
    const entry = { code, mask: { fn, ...p } };
    // G4 (spec rule 15): role/channel conditions can't be checked in the browser. Never widen: no reveal for this PII.
    let revealable = f.revealable;
    if (arr(f.rules, where, 'rules').length) {
      if (f.revealable === true) errors.push(`${where}: has role/channel conditions and revealable: true; the browser can't check roles, so it can't honour both. Remove one`);
      warnings.push(`${where}: role/channel conditions can't be checked in the browser, so ${code} is masked for everyone and can't be revealed in the browser build`);
      revealable = false;
    }
    if (revealable !== undefined) entry.revealable = revealable === true;
    piiIndex.set(code, pii.length);
    pii.push(entry);
  }

  // ---------- Part 2: mappings ----------
  const m = src.mappings ?? {};
  if (src.mappings !== undefined) keysOk(m, ['globalRules', 'pageInclusions', 'pageExclusions', 'parentExclusions'], 'mappings');
  const RULE_KEYS = ['ruleId', 'pii', 'lookupTexts', 'lookIn', 'tableId', ...AUDIT];
  const groups = (name) => arr(m[name], 'mappings', name).filter((g, gi) =>
    keysOk(g, name === 'parentExclusions' ? ['pages', 'elementIds', ...AUDIT] : ['pages', 'rules'], `${name}[${gi}]`));

  // Page rules: a path prefix. Admin text -> normalized prefix. The SDK never touches rule text.
  const pages = [];
  const pageValues = new Map();
  function normPage(raw, where) {
    if (typeof raw !== 'string' || raw[0] !== '/') { errors.push(`${where}: page "${raw}" must start with / (put the application prefix in routing.contextPath)`); return null; }
    if (/[?#;%\s]/.test(raw)) { errors.push(`${where}: page "${raw}" must not contain ? # ; % or spaces`); return null; }
    let p = raw, trailingStar = false;
    if (/\*$/.test(p)) { trailingStar = true; p = p.replace(/\/?\*+$/, ''); }
    if (p.includes('*')) { errors.push(`${where}: page "${raw}" has a wildcard inside the path; only a trailing * is supported in V1 (a segment matcher is not built yet)`); return null; }
    p = p.replace(/\/{2,}/g, '/').toLowerCase().replace(/\/+$/, '');
    for (const x of exts) if (p.length > x.length && p.endsWith(x)) {
      warnings.push(`${where}: page "${raw}" is matched as "${p.slice(0, -x.length)}" (the ${x} extension is ignored, so ${exts.map((e) => p.slice(0, -x.length) + e).join(' and ')} all match)`);
      p = p.slice(0, -x.length);
      break;
    }
    if (p === '') { errors.push(`${where}: page "${raw}" would match every page; use a global rule instead (a raw / prefix is not allowed)`); return null; }
    if (trailingStar) warnings.push(`${where}: "${raw}" is matched as the exact prefix "${p}": it matches ${p} and ${p}/..., not ${p}-settings or ${p}admin`);
    return p;
  }
  function pageIndex(raw, where) {
    const p = normPage(raw, where);
    if (p === null) return -1;
    if (!pageValues.has(p)) { pageValues.set(p, pages.length); pages.push({ type: 'PREFIX', value: p }); }
    return pageValues.get(p);
  }
  function locsOf(rule, where) {
    const list = arr(rule.lookIn, where, 'lookIn').map((l) => LOC_ALIAS[l] ?? l);
    const bad = list.filter((l) => !LOCS.includes(l));
    if (bad.length) errors.push(`${where}: unknown lookIn ${bad.join(', ')} (use ${LOCS.join(', ')})`);
    if (!list.length) errors.push(`${where}: lookIn is empty`);
    if (rule.tableId !== undefined && !(list.length === 1 && list[0] === 'COLUMN'))
      errors.push(`${where}: tableId is only allowed when lookIn is COLUMN alone`);
    return [...new Set(list.filter((l) => LOCS.includes(l)))];
  }
  // Internal key: "n:" + cleaned-up key (3+ characters, matched loosely) or "x:" + the text as written (shorter, exact).
  function keysOf(rule, where) {
    const keys = new Set();
    for (const t of arr(rule.lookupTexts, where, 'lookupTexts')) {
      if (typeof t !== 'string') { errors.push(`${where}: lookup text ${JSON.stringify(t)} must be text`); continue; }
      const k = normalizeKey(t);
      if (k.length < 2) { errors.push(`${where}: lookup text "${t}" is too short after clean-up ("${k}")`); continue; }
      if (k.length >= SHORT) { keys.add('n:' + k); continue; }
      const exact = t.trim();
      keys.add('x:' + exact);
      warnings.push(`${where}: "${exact}" is shorter than ${SHORT} characters after clean-up, so it matches only exactly as written ("${exact}", not "${exact.toLowerCase() === exact ? exact.toUpperCase() : exact.toLowerCase()}" or variants with _ - or spaces); list each spelling the screens use (v5.2 rule 6)`);
    }
    if (!keys.size) errors.push(`${where}: lookupTexts is empty`);
    return [...keys];
  }
  function piiOf(rule, where) {
    if (!piiIndex.has(rule.pii)) { errors.push(`${where}: pii "${rule.pii}" has no masking rule in Part 1`); return -1; }
    return piiIndex.get(rule.pii);
  }

  // Two tiers: page inclusions, then global. (Exclusions are not keyword entries any more: see excludedPiiByPage.)
  const tier = { incl: {}, glob: {} };
  LOCS.forEach((l) => { tier.incl[l] = new Map(); tier.glob[l] = new Map(); });
  const owner = new Map();   // conflict detection: "tier|loc|key|page|table" -> { pii, where }
  function put(t, loc, key, entry, where) {
    const sig = [t, loc, key, entry.page ?? '', entry.table ?? ''].join('|');
    const prev = owner.get(sig);
    if (prev) {
      if (prev.pii !== entry.pii) errors.push(`${where}: "${key.slice(2)}" in ${loc} is already mapped to ${pii[prev.pii]?.code} by ${prev.where}`);
      return;   // same PII again: ignore duplicate
    }
    owner.set(sig, { pii: entry.pii, where });
    const map = tier[t][loc];
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  }

  arr(m.globalRules, 'mappings', 'globalRules').forEach((r, ri) => {
    const where = `globalRules ${r && r.ruleId ? r.ruleId : '[' + ri + ']'}`;
    if (!keysOk(r, RULE_KEYS, where)) return;
    const p = piiOf(r, where), locs = locsOf(r, where), keys = keysOf(r, where);
    if (p < 0) return;
    for (const loc of locs) for (const key of keys)
      put('glob', loc, key, r.tableId !== undefined ? { pii: p, table: r.tableId } : { pii: p }, where);
  });

  const inclusions = [];
  groups('pageInclusions').forEach((g, gi) => arr(g.pages, `pageInclusions[${gi}]`, 'pages', true).forEach((pg) => arr(g.rules, `pageInclusions[${gi}]`, 'rules', true).forEach((r, ri) => {
    const where = `pageInclusions[${gi}] ${r && r.ruleId ? r.ruleId : 'rules[' + ri + ']'}`;
    if (!keysOk(r, RULE_KEYS, where)) return;
    const page = pageIndex(pg, where), p = piiOf(r, where), locs = locsOf(r, where), keys = keysOf(r, where);
    if (p < 0 || page < 0) return;
    inclusions.push({ page, pii: p, where });
    for (const loc of locs) for (const key of keys) {
      const e = { pii: p, page };
      if (r.tableId !== undefined) e.table = r.tableId;
      put('incl', loc, key, e, where);
    }
  })));

  // Page exclusions: whole PII only. Excluding a PII on a page shows ALL of its values there.
  const excluded = new Map();   // page index -> Set(pii index)
  groups('pageExclusions').forEach((g, gi) => arr(g.pages, `pageExclusions[${gi}]`, 'pages', true).forEach((pg) => arr(g.rules, `pageExclusions[${gi}]`, 'rules', true).forEach((r, ri) => {
    const where = `pageExclusions[${gi}] ${r && r.ruleId ? r.ruleId : 'rules[' + ri + ']'}`;
    if (!keysOk(r, RULE_KEYS, where)) return;
    if (r.lookupTexts !== undefined || r.lookIn !== undefined || r.tableId !== undefined) {
      errors.push(`${where}: scoped exclusions (lookupTexts / lookIn / tableId) are not supported in V1; list only the PII. Excluding a PII on a page makes ALL its values visible on that page`);
      return;
    }
    const page = pageIndex(pg, where), p = piiOf(r, where);
    if (p < 0 || page < 0) return;
    warnings.push(`${where}: excluding ${r.pii} on ${pages[page].value} makes ALL its values (labels, fields, columns, text) visible on that page`);
    if (!excluded.has(page)) excluded.set(page, new Set());
    excluded.get(page).add(p);
  })));
  for (const inc of inclusions)
    if (excluded.get(inc.page)?.has(inc.pii))
      errors.push(`${inc.where}: ${pii[inc.pii].code} is both included and excluded on ${pages[inc.page].value}`);
  for (const [page, set] of excluded) for (const p of set) {
    const used = LOCS.some((l) => ['glob', 'incl'].some((t) => [...tier[t][l].values()].some((list) => list.some((e) => e.pii === p))));
    if (!used) warnings.push(`${pii[p].code} is excluded on ${pages[page].value} but has no lookup mappings, so the exclusion does nothing`);
  }

  // Keyword lists: most specific entry first (spec rule 2: route first, then location).
  // A longer page prefix (more path segments) before a shorter one, page entries before global ones; then a table filter first.
  const segments = (e) => (e.page !== undefined ? pages[e.page].value.split('/').length : 0);
  const tableFirst = (e) => (e.table !== undefined ? 0 : 1);
  const index = {};        // cleaned-up keys, 3+ characters
  const exactIndex = {};   // shorter keywords, exactly as written
  for (const loc of LOCS) {
    const keys = new Set([...tier.incl[loc].keys(), ...tier.glob[loc].keys()]);
    for (const key of [...keys].sort()) {
      const target = key.startsWith('x:') ? exactIndex : index;
      const list = [...(tier.incl[loc].get(key) ?? []), ...(tier.glob[loc].get(key) ?? [])];
      (target[loc] ??= {})[key.slice(2)] = list.map((e, i) => [e, i])
        .sort((a, b) => segments(b[0]) - segments(a[0]) || tableFirst(a[0]) - tableFirst(b[0]) || a[1] - b[1]).map((x) => x[0]);
    }
  }

  const cssId = (id) => (/^[A-Za-z_][\w-]*$/.test(id) ? '#' + id : `[id="${String(id).replace(/["\\]/g, '\\$&')}"]`);
  // Pre-joined selectors: "*" = every page; "<page index>" = global + that page's own (ready for element.closest)
  const peGlobal = new Set();
  const pePage = new Map();
  const ROOT_IDS = ['root', 'app', 'app-root', '__next', '__nuxt', 'main', 'body', 'content', 'wrapper', 'container', 'page', 'layout'];
  const warnedIds = new Set();
  groups('parentExclusions').forEach((x, xi) => {
    const ids = arr(x.elementIds, `parentExclusions[${xi}]`, 'elementIds', true);
    if (x.elementIds !== undefined && Array.isArray(x.elementIds) && !ids.length) errors.push(`parentExclusions[${xi}]: elementIds is empty`);
    const pgs = x.pages === undefined ? ['*'] : arr(x.pages, `parentExclusions[${xi}]`, 'pages');
    for (const id of ids) {                                  // G6 (spec rule 24): broad exclusions are warned about
      if (warnedIds.has(id)) continue;
      if (ROOT_IDS.includes(String(id).toLowerCase())) { warnedIds.add(id); warnings.push(`parentExclusions[${xi}]: "#${id}" looks like a page root: excluding it leaves everything on the page unmasked`); }
    }
    if (pgs.includes('*') && ids.length) warnings.push(`parentExclusions[${xi}]: ${ids.map((i) => '#' + i).join(', ')} excluded on every page: nothing inside is ever masked`);
    for (const pg of pgs) for (const id of ids) {
      if (pg === '*') { peGlobal.add(cssId(id)); continue; }
      const i = pageIndex(pg, `parentExclusions[${xi}]`);
      if (i < 0) continue;
      if (!pePage.has(i)) pePage.set(i, new Set());
      pePage.get(i).add(cssId(id));
    }
  });
  const parentExclusions = {};
  if (peGlobal.size) parentExclusions['*'] = [...peGlobal].join(',');
  for (const [i, set] of [...pePage].sort((a, b) => a[0] - b[0]))
    parentExclusions[String(i)] = [...new Set([...peGlobal, ...set])].join(',');

  // G1 (spec rule 23): never "configured but unprotected"
  if (!pii.length && mr.fields !== undefined) errors.push('maskingRules.fields has no masking rules: the map would mask nothing');
  const keyCount = [index, exactIndex].reduce((n, ix) => n + Object.values(ix).reduce((m2, o) => m2 + Object.keys(o).length, 0), 0);
  if (!keyCount) errors.push('no lookup mappings (global rules or page inclusions): the map would mask nothing');
  const usedPii = new Set();
  for (const ix of [index, exactIndex]) for (const loc of Object.keys(ix)) for (const list of Object.values(ix[loc])) for (const e of list) usedPii.add(e.pii);
  pii.forEach((p, i) => { if (!usedPii.has(i)) warnings.push(`maskingRules.fields.${p.code} has no lookup mapping, so ${p.code} is never masked`); });

  const excludedPiiByPage = {};
  for (const [page, set] of [...excluded].sort((a, b) => a[0] - b[0])) excludedPiiByPage[String(page)] = [...set].sort((a, b) => a - b);

  const compiled = { v: 12, configVersion: src.configVersion, meta, routing, defaults, pii, pages, parentExclusions, excludedPiiByPage, index, exactIndex };
  return { compiled, errors, warnings };
}
