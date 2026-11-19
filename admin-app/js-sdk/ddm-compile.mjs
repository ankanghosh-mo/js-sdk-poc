#!/usr/bin/env node
// DAM Capital DDM - map builder (V12 payload)
// Usage:  node ddm-compile.mjs [mapping-source.json] [output-folder]
// Writes: ddm-compiled-v12.json   the final V12 runtime map, readable (the source of truth for the SDK)
//         ddm-map.js             the same map as a script (load before ddm-engine.js)
//         ddm-sdk.js             map + engine in one file
//         ddm-sdk.min.js         minified ddm-sdk.js          (needs `npm i esbuild`)
//         ddm-engine.min.js      minified engine only          (needs `npm i esbuild`)
//         ddm-sdk-standalone.js  readable V12 map + checker + engine in one file (testing: edit and reload)
// The build stops with an error list instead of guessing when the source is contradictory.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] ?? join(here, 'mapping-source.json');
const OUT = process.argv[3] ?? here;
const coreJs = readFileSync(join(here, 'ddm-compiler-core.js'), 'utf8');
const checkJs = readFileSync(join(here, 'ddm-check.js'), 'utf8');
const engineJs = readFileSync(join(here, 'ddm-engine.js'), 'utf8');
const ddmCompile = new Function(coreJs + '\nreturn ddmCompile;')();
const { ddmCheckV12, ddmCanonicalJson } = new Function(checkJs + '\nreturn { ddmCheckV12, ddmCanonicalJson };')();
const sha256Hex = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

const source = JSON.parse(readFileSync(SRC, 'utf8'));
const { compiled, errors, warnings } = ddmCompile(source);
if (errors.length) {
  console.error(`\n${errors.length} error(s), nothing written:\n  - ` + errors.join('\n  - '));
  process.exit(1);
}

// configHash: SHA-256 of the canonical JSON of the payload without meta.configHash (see DDM-V12-SPEC.md)
const forHash = JSON.parse(JSON.stringify(compiled));
delete forHash.meta.configHash;
compiled.meta.configHash = 'sha256:' + sha256Hex(ddmCanonicalJson(forHash));

// The output must pass the V12 contract check, hash included, before anything is written
const selfCheck = ddmCheckV12(JSON.parse(JSON.stringify(compiled)), undefined, { sha256Hex });
if (selfCheck.errors.length) {
  console.error('Compiled map failed the V12 check, nothing written:\n  - ' + selfCheck.errors.join('\n  - '));
  process.exit(1);
}
const allWarnings = warnings;   // the self-check repeats the same warnings for a compiled map; its errors are what matter here

const inlineSafe = (s) => s.replace(/</g, '\\u003c');   // no closing script tag can appear inside the files

// Readable V12 layout: one line per pii entry, page and keyword list
function prettyV12(c) {
  const one = (v) => JSON.stringify(v).replace(/,"/g, ', "').replace(/":/g, '": ').replace(/\},\{/g, '}, {');
  const block = (name, obj) => `  "${name}": ${JSON.stringify(obj, null, 2).replace(/\n/g, '\n  ')}`;
  const L = [];
  L.push('{');
  L.push(`  "v": ${c.v},`);
  L.push(`  "configVersion": ${JSON.stringify(c.configVersion)},`);
  L.push(block('meta', c.meta) + ',');
  L.push(block('routing', c.routing) + ',');
  L.push(block('defaults', c.defaults) + ',');
  L.push('  "pii": [');
  c.pii.forEach((p, i) => L.push(`    ${one(p)}${i < c.pii.length - 1 ? ',' : ''}`));
  L.push('  ],');
  L.push('  "pages": [');
  c.pages.forEach((p, i) => L.push(`    ${one(p)}${i < c.pages.length - 1 ? ',' : ''}`));
  L.push('  ],');
  const keysOf = (o) => Object.keys(o).sort((a, b) => (a === '*' ? -1 : b === '*' ? 1 : a - b));
  const peKeys = keysOf(c.parentExclusions);
  L.push('  "parentExclusions": {');
  peKeys.forEach((k, i) => L.push(`    ${JSON.stringify(k)}: ${JSON.stringify(c.parentExclusions[k])}${i < peKeys.length - 1 ? ',' : ''}`));
  L.push('  },');
  const exKeys = keysOf(c.excludedPiiByPage);
  L.push('  "excludedPiiByPage": {');
  exKeys.forEach((k, i) => L.push(`    ${JSON.stringify(k)}: ${JSON.stringify(c.excludedPiiByPage[k])}${i < exKeys.length - 1 ? ',' : ''}`));
  L.push('  },');
  const writeIndex = (name, ix, last) => {
    const locs = Object.keys(ix);
    if (!locs.length) { L.push(`  "${name}": {}${last ? '' : ','}`); return; }
    L.push(`  "${name}": {`);
    locs.forEach((loc, li) => {
      L.push(`    ${JSON.stringify(loc)}: {`);
      const keys = Object.keys(ix[loc]);
      keys.forEach((k, ki) => L.push(`      ${JSON.stringify(k)}: ${one(ix[loc][k])}${ki < keys.length - 1 ? ',' : ''}`));
      L.push(`    }${li < locs.length - 1 ? ',' : ''}`);
    });
    L.push(`  }${last ? '' : ','}`);
  };
  writeIndex('index', c.index, false);
  writeIndex('exactIndex', c.exactIndex, true);
  L.push('}');
  return L.join('\n');
}
const pretty = prettyV12(compiled);
if (JSON.stringify(JSON.parse(pretty)) !== JSON.stringify(compiled)) { console.error('internal error: readable layout differs from the payload'); process.exit(1); }

const mapJs =
  `/*! DAM Capital DDM map ${compiled.configVersion} (V12) - generated by ddm-compile.mjs. Do not edit; edit the mapping source and rebuild. */\n` +
  `(function(){var c=${inlineSafe(JSON.stringify(compiled))};if(!window.DAM_DDM_CONFIG){Object.defineProperty(window,'DAM_DDM_CONFIG',{value:c,writable:false,configurable:false});}})();\n`;
const sdkJs = mapJs + '\n' + engineJs;

const standaloneJs = `/*!
 * DAM Capital DDM SDK - STANDALONE TEST BUILD (${compiled.configVersion}, V12 map)
 *
 * One file: the V12 compiled map (readable) + the engine. No build step, no compiling in the browser.
 * To test a change: edit DAM_DDM_V12 below, save, reload. The map is checked against the V12 contract on load;
 * problems are listed in the browser console and masking stays off until they are fixed.
 * Hand-editing rules: index keys must be cleaned up (norm-2: lowercase, no spaces, _ or -; 3+ characters), shorter
 * keywords go in exactIndex exactly as the screen shows them; "page" and "pii" are
 * positions in the pages and pii lists, page-specific entries come before the global entry.
 * meta.configHash is NOT recomputed when you edit this file by hand, so it will no longer describe the edited map.
 */
(function () {
  'use strict';
  // ============================ V12 COMPILED MAP (edit here) ============================
  var DAM_DDM_V12 = ${inlineSafe(pretty).replace(/\n/g, '\n  ')};
  // =====================================================================================

${checkJs.replace(/^(?=.)/gm, '  ')}
  try {
    var check = ddmCheckV12(DAM_DDM_V12, document);
    if (check.warnings.length) console.warn('[DDM] map warnings:\\n - ' + check.warnings.join('\\n - '));
    if (check.errors.length) {
      console.error('[DDM] map has ' + check.errors.length + ' error(s), masking is off:\\n - ' + check.errors.join('\\n - '));
      return;
    }
    if (!window.DAM_DDM_CONFIG) {
      Object.defineProperty(window, 'DAM_DDM_CONFIG', { value: DAM_DDM_V12, writable: false, configurable: false });
    }
  } catch (e) {
    console.error('[DDM] could not read the map, masking is off: ' + (e && e.message));
  }
})();

${engineJs}`;

// Minified builds (optional: needs `npm i esbuild`; skipped with a hint if it is not installed)
let minNote = '';
try {
  const { transformSync } = await import('esbuild');
  const min = (code) => transformSync(code, { minify: true, target: 'es2019', legalComments: 'none' }).code;
  const banner = `/*! DAM Capital DDM SDK ${compiled.configVersion} */\n`;
  const sdkMin = banner + min(sdkJs), engineMin = banner + min(engineJs);
  writeFileSync(join(OUT, 'ddm-sdk.min.js'), sdkMin);
  writeFileSync(join(OUT, 'ddm-engine.min.js'), engineMin);
  minNote = `ddm-sdk.min.js         ${sdkMin.length} bytes  integrity="${'sha384-' + createHash('sha384').update(sdkMin).digest('base64')}"\n` +
            `ddm-engine.min.js      ${engineMin.length} bytes  (use with ddm-map.js)`;
} catch (e) {
  minNote = 'minified files skipped (run "npm i esbuild" next to this script to produce ddm-sdk.min.js)';
}

writeFileSync(join(OUT, 'ddm-compiled-v12.json'), pretty + '\n');
writeFileSync(join(OUT, 'ddm-map.js'), mapJs);
writeFileSync(join(OUT, 'ddm-sdk.js'), sdkJs);
writeFileSync(join(OUT, 'ddm-sdk-standalone.js'), standaloneJs);

const sri = (s) => 'sha384-' + createHash('sha384').update(s).digest('base64');
if (allWarnings.length) console.warn(`${allWarnings.length} warning(s):\n  - ` + allWarnings.join('\n  - '));
const counts = Object.keys(compiled.index).map((l) => `${l} ${Object.keys(compiled.index[l]).length}`).join(', ') + (Object.keys(compiled.exactIndex).length ? '; exact: ' + Object.keys(compiled.exactIndex).map((l) => `${l} ${Object.keys(compiled.exactIndex[l]).length}`).join(', ') : '; exact: none');
console.log(`Map ${compiled.configVersion} (V12): ${compiled.pii.length} PII, ${compiled.pages.length} pages, lookup keys: ${counts}`);
console.log(`configHash ${compiled.meta.configHash}`);
console.log(`ddm-compiled-v12.json   ${pretty.length} bytes`);
console.log(`ddm-map.js             ${mapJs.length} bytes  integrity="${sri(mapJs)}"`);
console.log(`ddm-sdk.js             ${sdkJs.length} bytes  integrity="${sri(sdkJs)}"`);
console.log(`ddm-sdk-standalone.js  ${standaloneJs.length} bytes  (testing only)`);
console.log(minNote);
