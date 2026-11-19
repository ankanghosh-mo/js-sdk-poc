// Small runtime helpers for the pages generated from the design canvas.

const styleCache = new Map();

/** "display: flex; gap: 8px" -> { display: 'flex', gap: '8px' } (cached; the design writes styles inline). */
export function css(text) {
  if (!text) return undefined;
  let obj = styleCache.get(text);
  if (obj) return obj;
  obj = {};
  for (const decl of text.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || value === '') continue;
    const key = prop.startsWith('--')
      ? prop
      : prop.replace(/^-(webkit|moz|ms)-/, (_, v) => v[0].toUpperCase() + v.slice(1) + '-')
          .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    obj[key] = value;
  }
  styleCache.set(text, obj);
  return obj;
}

/** The canvas links screens by file name; the console uses hash routes. */
export const ROUTES = {
  'SDKList.dc.html': '#/sdks',
  'SDKCreate.dc.html': '#/sdks/new',
  'DDMRules.dc.html': '#/sdks/dam-portal/rules',
  'DDMAddField.dc.html': '#/sdks/dam-portal/rules/add',
  'DDMPages.dc.html': '#/sdks/dam-portal/pages',
  'SDKReview.dc.html': '#/sdks/dam-portal/review',
  'SDKBuild.dc.html': '#/sdks/dam-portal/build',
  'SDKReady.dc.html': '#/sdks/dam-portal/ready',
  'Dashboard-3eyx.dc.html': '#', // "Data Masking" (another product area, not part of this console)
};

export function route(href) {
  if (typeof href !== 'string') return href;
  const [file, hash] = href.split('#');
  if (file.endsWith('.dc.html')) return ROUTES[file] || '#';
  return hash !== undefined && file === '' ? href : href;
}
