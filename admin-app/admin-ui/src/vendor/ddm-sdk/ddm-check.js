/*! DAM Capital DDM - V12 map checker + canonical JSON
 * ddmCanonicalJson(value): the exact text the configHash is computed from (see DDM-V12-SPEC.md).
 * ddmCheckV12(cfg, doc?, opts?): checks a compiled V12 map against the contract. Returns { errors, warnings }.
 *   doc  : a document, to test CSS selectors (omit in Node)
 *   opts : { sha256Hex: function (text) -> hex } to verify meta.configHash (the browser skips this)
 * Used by ddm-compile.mjs (on its own output), by ddm-sdk-standalone.js (hand-edited maps) and by backend tests.
 */
function ddmCanonicalJson(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(ddmCanonicalJson).join(',') + ']';
  return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + ddmCanonicalJson(v[k]); }).join(',') + '}';
}

function ddmCheckV12(cfg, doc, opts) {
  opts = opts || {};
  var errors = [], warnings = [];
  var LOCS = ['ELEMENT_ID', 'NAME', 'LABEL', 'COLUMN', 'CLASS', 'INLINE'];
  var FNS = { FULL: 1, PARTIAL: 1, RANGE: 1, PATTERN: 1 };
  var isInt = function (n) { return typeof n === 'number' && n % 1 === 0; };
  var LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
  var ROOT_IDS = ['root', 'app', 'app-root', '__next', '__nuxt', 'main', 'body', 'content', 'wrapper', 'container', 'page', 'layout'];
  // norm-2 key clean-up: must match normalizeKey() in the engine; used here only to catch keys that were not cleaned up
  var norm = function (s) { return s.normalize('NFKC').toLowerCase().replace(/[\s_\-]+/g, '').replace(/[:*]+$/, ''); };

  if (!cfg || typeof cfg !== 'object') return { errors: ['map is missing or not an object'], warnings: warnings };
  if (cfg.v !== 12) errors.push('v must be 12 (found ' + cfg.v + ')');
  if (typeof cfg.configVersion !== 'string' || !cfg.configVersion) errors.push('configVersion is missing');

  // ---- meta ----
  var m = cfg.meta;
  if (!m || typeof m !== 'object') errors.push('meta is missing');
  else {
    if (typeof m.status !== 'string' || !m.status) errors.push('meta.status is missing');
    else if (m.status !== 'APPROVED') warnings.push('meta.status is "' + m.status + '", not APPROVED');
    if (typeof m.policyId !== 'string' || !m.policyId) errors.push('meta.policyId is missing');
    if (typeof m.approvedAt !== 'string' || isNaN(Date.parse(m.approvedAt))) errors.push('meta.approvedAt must be an ISO date-time');
    if (m.normalization !== 'norm-2') errors.push('meta.normalization must be "norm-2" (the only version this SDK knows; found ' + JSON.stringify(m.normalization) + ')');
    if (typeof m.configHash !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(m.configHash)) errors.push('meta.configHash must be "sha256:" followed by 64 hex characters (found ' + JSON.stringify(m.configHash) + ')');
    else if (opts.sha256Hex) {
      var copy = JSON.parse(JSON.stringify(cfg)); delete copy.meta.configHash;
      var expected = 'sha256:' + opts.sha256Hex(ddmCanonicalJson(copy));
      if (expected !== m.configHash) errors.push('meta.configHash does not match the payload (expected ' + expected + ')');
    }
  }

  // ---- routing ----
  var r = cfg.routing, exts = [];
  if (!r || typeof r !== 'object') errors.push('routing is missing');
  else {
    ['caseInsensitive', 'stripQuery', 'stripTrailingSlash'].forEach(function (k) {
      if (r[k] !== true) errors.push('routing.' + k + ' must be true (the SDK always does this in V12)');
    });
    if (r.hashRouting !== 'auto' && r.hashRouting !== 'off') errors.push('routing.hashRouting must be "auto" or "off"');
    var ctx = r.contextPath;
    if (typeof ctx !== 'string' || (ctx !== '' && !(ctx.charAt(0) === '/' && ctx.length > 1 && ctx.charAt(ctx.length - 1) !== '/' && !/[?#;*%\s]/.test(ctx) && ctx === ctx.toLowerCase())))
      errors.push('routing.contextPath must be "" or start with "/", be lowercase, and have no trailing "/"');
    if (!Array.isArray(r.stripExtensions)) errors.push('routing.stripExtensions must be a list (it can be empty)');
    else r.stripExtensions.forEach(function (x, i) {
      if (typeof x !== 'string' || !/^\.[a-z0-9]+$/.test(x)) errors.push('routing.stripExtensions[' + i + '] must look like ".jsp" (lowercase)');
      else if (exts.indexOf(x) >= 0) errors.push('routing.stripExtensions[' + i + '] "' + x + '" is listed twice');
      else exts.push(x);
    });
  }

  // ---- defaults ----
  var d = cfg.defaults || {};
  if (typeof d.maskChar !== 'string' || Array.from(d.maskChar).length !== 1) errors.push('defaults.maskChar must be one character');
  else if (LETTER_OR_DIGIT.test(d.maskChar)) warnings.push('defaults.maskChar "' + d.maskChar + '" is a letter or digit: a masked value can\'t be told from a real one (keep "*")');
  if (d.onFormatMismatch !== 'FULL') errors.push('defaults.onFormatMismatch must be FULL');
  if (typeof d.revealable !== 'boolean') errors.push('defaults.revealable must be true or false');
  if (!(isInt(d.revealTimeoutMs) && d.revealTimeoutMs > 0)) errors.push('defaults.revealTimeoutMs must be a whole number above 0');

  // ---- pii ----
  var pii = Array.isArray(cfg.pii) ? cfg.pii : [];
  if (!pii.length) errors.push('pii must be a non-empty list');
  pii.forEach(function (p, i) {
    var w = 'pii[' + i + '] ' + (p && p.code || '');
    var mk = p && p.mask;
    if (!p || typeof p.code !== 'string') errors.push(w + ': code is missing');
    if (p && p.revealable !== undefined && typeof p.revealable !== 'boolean') errors.push(w + ': revealable must be true or false');
    if (!mk || !FNS[mk.fn]) { errors.push(w + ': mask.fn must be FULL, PARTIAL, RANGE or PATTERN'); return; }
    if (mk.maskChar !== undefined) {
      if (typeof mk.maskChar !== 'string' || Array.from(mk.maskChar).length !== 1) errors.push(w + ': maskChar must be one character');
      else if (LETTER_OR_DIGIT.test(mk.maskChar)) warnings.push(w + ': maskChar "' + mk.maskChar + '" is a letter or digit: a masked value can\'t be told from a real one (keep "*")');
    }
    if (mk.fn === 'PARTIAL' && !(isInt(mk.showFirst) && isInt(mk.showLast) && mk.showFirst >= 0 && mk.showLast >= 0)) errors.push(w + ': PARTIAL needs showFirst and showLast (whole numbers, 0 or more)');
    if (mk.fn === 'RANGE' && !(isInt(mk.from) && isInt(mk.to) && mk.from !== 0 && mk.to !== 0)) errors.push(w + ': RANGE needs from and to (whole numbers, not 0)');
    if (mk.fn === 'RANGE' && (mk.from > 0) === (mk.to > 0) && mk.from > mk.to) errors.push(w + ': RANGE from is after to');
    if (mk.fn === 'PATTERN' && !(typeof mk.template === 'string' && typeof mk.inputFormat === 'string' && mk.template.length === mk.inputFormat.length)) errors.push(w + ': PATTERN needs template and inputFormat of the same length');
    if (mk.fn === 'FULL' && mk.fixedLength !== undefined && !(isInt(mk.fixedLength) && mk.fixedLength > 0)) errors.push(w + ': fixedLength must be a whole number above 0');
  });

  // ---- pages ----
  var pages = Array.isArray(cfg.pages) ? cfg.pages : [];
  if (!Array.isArray(cfg.pages)) errors.push('pages must be a list of { "type": "PREFIX", "value": "/path" }');
  var seenPage = {};
  pages.forEach(function (p, i) {
    var w = 'pages[' + i + ']';
    if (!p || p.type !== 'PREFIX') { errors.push(w + ': type must be "PREFIX"'); return; }
    var v = p.value;
    if (typeof v !== 'string' || v.charAt(0) !== '/' || v === '/') { errors.push(w + ': value must start with "/" and must not be "/" (a raw / prefix is not allowed)'); return; }
    if (/[*?#;%\s]/.test(v) || v.indexOf('//') >= 0 || v.charAt(v.length - 1) === '/' || v !== v.toLowerCase()) errors.push(w + ': value "' + v + '" must be lowercase, with no * ? # ; % spaces, "//" or trailing "/"');
    exts.forEach(function (x) { if (v.length > x.length && v.slice(-x.length) === x) errors.push(w + ': value "' + v + '" ends with ' + x + ', which the SDK removes from every URL, so it could never match'); });
    if (seenPage[v]) errors.push(w + ': "' + v + '" is listed twice');
    seenPage[v] = true;
  });

  // ---- excludedPiiByPage ----
  var ex = cfg.excludedPiiByPage;
  if (!ex || typeof ex !== 'object' || Array.isArray(ex)) { errors.push('excludedPiiByPage must be an object (it can be empty)'); ex = {}; }
  Object.keys(ex).forEach(function (k) {
    var w = 'excludedPiiByPage["' + k + '"]';
    if (!(/^\d+$/.test(k) && +k < pages.length)) { errors.push(w + ': key must be a page number (0 to ' + (pages.length - 1) + ')'); return; }
    if (!Array.isArray(ex[k]) || !ex[k].length) { errors.push(w + ': must be a non-empty list of pii numbers'); return; }
    var seen = {};
    ex[k].forEach(function (n) {
      if (!isInt(n) || n < 0 || n >= pii.length) errors.push(w + ': ' + n + ' is not in the pii list (0 to ' + (pii.length - 1) + ')');
      else if (seen[n]) errors.push(w + ': pii ' + n + ' is listed twice');
      seen[n] = true;
    });
  });

  // ---- index (cleaned-up keys, 3+ characters) and exactIndex (shorter keywords, exactly as written) ----
  var usedPages = {}, usedPii = {}, keyCount = 0;
  function checkIndex(idx, name, exact) {
    if (idx === undefined && exact) return;
    if (!idx || typeof idx !== 'object' || Array.isArray(idx)) { errors.push(name + ' must be an object'); return; }
    Object.keys(idx).forEach(function (loc) {
      if (LOCS.indexOf(loc) < 0) { errors.push(name + '.' + loc + ': unknown location (use ' + LOCS.join(', ') + ')'); return; }
      Object.keys(idx[loc]).forEach(function (key) {
        var w = name + '.' + loc + '.' + key;
        var list = idx[loc][key];
        if (!exact) {
          if (norm(key) !== key) errors.push(w + ': key is not cleaned up (norm-2); it should be "' + norm(key) + '"');
          else if (key.length < 3) errors.push(w + ': key is shorter than 3 characters; norm-2 matches it only exactly, so it belongs in exactIndex as written');
        } else {
          var n = norm(key);
          if (key !== key.trim() || !key) errors.push(w + ': key must not start or end with white space');
          else if (n.length >= 3) errors.push(w + ': key has 3+ characters after clean-up, so it belongs in index as "' + n + '"');
          else if (n.length < 2) errors.push(w + ': key is too short');
        }
        if (!Array.isArray(list) || !list.length) { errors.push(w + ': must be a non-empty list'); return; }
        keyCount++;
        var unconditional = false, seenPageValues = [];
        list.forEach(function (e, j) {
          var we = w + '[' + j + ']';
          if (!e || !isInt(e.pii) || e.pii < 0 || e.pii >= pii.length) errors.push(we + ': pii must point into the pii list (0 to ' + (pii.length - 1) + ')');
          if (e && isInt(e.pii)) usedPii[e.pii] = true;
          if (e && e.page !== undefined) {
            if (!(isInt(e.page) && e.page >= 0 && e.page < pages.length)) errors.push(we + ': page must point into the pages list (0 to ' + (pages.length - 1) + ')');
            else {
              usedPages[e.page] = true;
              var pv = pages[e.page] && pages[e.page].value;
              seenPageValues.forEach(function (prev) {                       // v5.2 rule 2: the more specific page must come first
                if (typeof pv === 'string' && pv.indexOf(prev + '/') === 0)
                  warnings.push(we + ': page "' + pv + '" comes after the broader "' + prev + '", so it can never win where both apply (put the more specific page first)');
              });
              if (typeof pv === 'string') seenPageValues.push(pv);
              if (ex[e.page] && ex[e.page].indexOf(e.pii) >= 0) warnings.push(we + ': pii ' + e.pii + ' is excluded on this page, so this entry never masks there');
            }
          }
          if (e && e.action !== undefined) errors.push(we + ': "action" is not allowed in V12; exclusions are listed in excludedPiiByPage');
          if (e && e.table !== undefined && loc !== 'COLUMN') errors.push(we + ': table is only allowed under COLUMN');
          if (unconditional) warnings.push(we + ': comes after an entry that always applies, so it can never be reached');
          if (e && e.page === undefined && e.table === undefined) unconditional = true;
        });
      });
    });
  }
  checkIndex(cfg.index || {}, 'index', false);
  checkIndex(cfg.exactIndex, 'exactIndex', true);

  if (!keyCount) errors.push('index and exactIndex have no lookup keys: the map would mask nothing');
  pii.forEach(function (p, i) { if (!usedPii[i]) warnings.push('pii[' + i + '] ' + (p && p.code || '') + ' has no lookup key, so it is never masked'); });

  // ---- parentExclusions ----
  var pe = cfg.parentExclusions;
  if (!pe || typeof pe !== 'object' || Array.isArray(pe)) { errors.push('parentExclusions must be an object of { "*" or page number: "selector,selector" } (it can be empty)'); pe = {}; }
  Object.keys(pe).forEach(function (k) {
    var w = 'parentExclusions["' + k + '"]';
    var pageKey = k !== '*';
    if (pageKey && !(/^\d+$/.test(k) && +k < pages.length)) errors.push(w + ': key must be "*" or a page number (0 to ' + (pages.length - 1) + ')');
    else if (pageKey) usedPages[+k] = true;
    if (typeof pe[k] !== 'string' || !pe[k]) { errors.push(w + ': must be a non-empty selector string'); return; }
    if (!pageKey) warnings.push(w + ': "' + pe[k] + '" is excluded on every page: nothing inside is ever masked');
    pe[k].split(',').forEach(function (sel) {
      var m2 = /^#([\w-]+)$/.exec(sel.trim());
      if (m2 && ROOT_IDS.indexOf(m2[1].toLowerCase()) >= 0 && !(pageKey && typeof pe['*'] === 'string' && pe['*'].split(',').indexOf(sel) >= 0))
        warnings.push(w + ': "' + sel + '" looks like a page root: excluding it leaves everything on the page unmasked');
    });
    if (doc) {
      pe[k].split(/,(?![^\[]*\])/).forEach(function (part) {   // check each selector so the message names the bad one
        try { doc.querySelector(part); } catch (e) { errors.push(w + ': "' + part + '" is not a valid CSS selector'); }
      });
    }
    if (pageKey && typeof pe['*'] === 'string') {
      pe['*'].split(',').forEach(function (g) {
        if (pe[k].split(',').indexOf(g) < 0) warnings.push(w + ': does not include the global "' + g + '" (the build normally adds it)');
      });
    }
  });
  Object.keys(ex).forEach(function (k) { usedPages[k] = true; });
  pages.forEach(function (p, i) { if (!usedPages[i]) warnings.push('pages[' + i + '] "' + (p && p.value) + '" is not used by any rule'); });

  return { errors: errors, warnings: warnings };
}
