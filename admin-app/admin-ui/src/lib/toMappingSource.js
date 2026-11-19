// Turns the console's rules and pages into the SDK team's `mapping-source.json` (DDM-V12-SPEC.md).
//
//   rule, scope "every page"          -> mappings.globalRules
//   rule, scope "every page except"   -> a global rule + mappings.pageExclusions for the listed pages
//   rule, scope "only some pages"     -> mappings.pageInclusions, one group per page
//   page with masking switched off    -> a page exclusion for every data kind that is masked anywhere
//
// The words go in as the admin typed them; the compiler cleans them up (norm-2) and reports what it refuses.
import { KINDS, maskOf } from './catalog.js';

const LOOK_IN = ['ELEMENT_ID', 'NAME', 'LABEL', 'COLUMN', 'CLASS', 'INLINE'];

export function toMappingSource({ fields, pages, meta }) {
  const pageById = Object.fromEntries(pages.map((p) => [p.id, p]));
  const live = fields.filter((f) => f.words.length > 0 && (f.scope !== 'only' || f.pages.some((id) => pageById[id])));

  // masking per data kind (the first rule of a kind decides; a kind is one entry in the map)
  const fieldsMasking = {};
  live.forEach((f) => {
    const code = KINDS[f.kind].code;
    const m = maskOf(f);
    const prev = fieldsMasking[code];
    fieldsMasking[code] = {
      outcome: 'POLICY',
      masking: prev ? prev.masking : { function: m.function, params: m.params },
      revealable: (prev ? prev.revealable : false) || f.reveal === true,
    };
  });

  const globalRules = [];
  const includeByPage = new Map();          // path -> rules
  const excludeByPage = new Map();          // path -> Set of PII codes
  const exclude = (path, code) => { if (!excludeByPage.has(path)) excludeByPage.set(path, new Set()); excludeByPage.get(path).add(code); };
  const offPaths = new Set(pages.filter((p) => !p.on).map((p) => p.path));
  const usedCodes = [...new Set(live.map((f) => KINDS[f.kind].code))];

  live.forEach((f, i) => {
    const code = KINDS[f.kind].code;
    const base = { pii: code, lookupTexts: f.words.slice(), lookIn: LOOK_IN.slice() };
    if (f.scope === 'only') {
      f.pages.map((id) => pageById[id]).filter(Boolean).forEach((p, j) => {
        if (offPaths.has(p.path)) return;   // masking is off on that page: nothing to include
        if (!includeByPage.has(p.path)) includeByPage.set(p.path, []);
        includeByPage.get(p.path).push({ ruleId: `i${i + 1}-${j + 1}`, ...base });
      });
    } else {
      globalRules.push({ ruleId: `g${i + 1}`, ...base });
      if (f.scope === 'except') f.pages.map((id) => pageById[id]).filter(Boolean).forEach((p) => exclude(p.path, code));
    }
  });
  offPaths.forEach((path) => usedCodes.forEach((code) => exclude(path, code)));

  let n = 0;
  const mappings = {
    globalRules,
    pageInclusions: [...includeByPage].map(([path, rules]) => ({ pages: [path], rules })),
    pageExclusions: [...excludeByPage].map(([path, codes]) => ({ pages: [path], rules: [...codes].map((pii) => ({ ruleId: `e${++n}`, pii })) })),
  };

  const m = { status: meta.status || 'DRAFT', policyId: 'POL-DAMCAP-0007' };
  if (meta.approvedAt) m.approvedAt = meta.approvedAt;
  if (meta.approvedBy) m.approvedBy = meta.approvedBy;

  return {
    schemaVersion: 2,
    configVersion: meta.configVersion || 'draft',
    meta: m,
    routing: { contextPath: '', hashRouting: 'auto', stripExtensions: ['.jsp', '.do'] },
    maskingRules: {
      defaults: { maskChar: '*', preserveSeparators: true, onFormatMismatch: 'FULL_MASK', revealable: false, revealTimeoutMs: 10000 },
      fields: fieldsMasking,
    },
    mappings,
  };
}
