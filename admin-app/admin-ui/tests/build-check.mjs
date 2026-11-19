// Checks the in-browser build: rules -> mapping-source -> V12 map -> ddm-sdk.js, and that the built file masks.
// Usage: npm run test:build   (the console must be running on http://localhost:5181)
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const BASE = 'http://localhost:5181';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'], defaultViewport: { width: 1200, height: 800 } });
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
let pass = 0, fail = 0;
const check = (ok, what, extra) => { console.log((ok ? '  ok   ' : '  FAIL ') + what + (!ok && extra ? '\n         ' + extra : '')); ok ? pass++ : fail++; };

await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
const lib = (code, arg) => page.evaluate(`(async () => { ${code} })()`);

console.log('1. SHA-256 and the kit');
const vec = await lib(`const { sha256Hex } = await import('/src/lib/sha.js'); const k = await import('/src/lib/ddmKit.js');
  const c = k.ddmCanonicalJson({"b":[1,{"z":1,"a":2}],"a":"x","c":null,"d":true});
  return { c, h: sha256Hex(c), empty: sha256Hex(''), long: sha256Hex('a'.repeat(1000)), engine: k.ENGINE_VERSION };`);
check(vec.c === '{"a":"x","b":[1,{"a":2,"z":1}],"c":null,"d":true}', 'canonical JSON matches the spec');
check(vec.h === '7374bc2af2c1c4b66a41392043e68967ed46cc29191eba4b60ae844027eee0c2', 'SHA-256 equals the spec test vector');
check(vec.empty === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'SHA-256 of an empty text');
check(vec.long === '41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3', 'SHA-256 of 1000 characters (several blocks)');
check(vec.engine === '0.4.1', 'engine version read from the copied file: ' + vec.engine);

console.log('2. Sample rules -> source -> V12 map');
const built = await lib(`const { SAMPLE_FIELDS, SAMPLE_PAGES } = await import('/src/lib/catalog.js');
  const { toMappingSource } = await import('/src/lib/toMappingSource.js');
  const { buildSdk } = await import('/src/lib/buildSdk.js');
  const source = toMappingSource({ fields: SAMPLE_FIELDS, pages: SAMPLE_PAGES, meta: { status: 'APPROVED', approvedAt: '2026-11-19T10:00:00Z', approvedBy: 'Priya Shah', configVersion: 'dam-portal-test' } });
  const r = await buildSdk(source);
  const again = await buildSdk(source);
  return { ok: r.ok, errors: r.errors, warnings: r.warnings, hash: r.configHash, sameHash: r.configHash === again.configHash, files: r.ok ? Object.fromEntries(Object.entries(r.files).map(([k, v]) => [k, v.length])) : null,
           integrity: r.integrity, sdk: r.ok ? r.files['ddm-sdk.js'] : '', source };`);
check(built.ok, 'builds with no errors', JSON.stringify(built.errors));
console.log('       warnings:', built.warnings.map((w) => '\n         - ' + w).join('') || 'none');
check(/^sha256:[0-9a-f]{64}$/.test(built.hash || ''), 'configHash looks right: ' + built.hash);
check(built.sameHash, 'building twice gives the same configHash');
check(built.files && built.files['ddm-sdk.js'] > 40000, 'ddm-sdk.js size ' + (built.files && built.files['ddm-sdk.js']) + ' bytes');
check(/^sha384-/.test(built.integrity['ddm-sdk.js']), 'SRI integrity ' + built.integrity['ddm-sdk.js'].slice(0, 24) + '...');
console.log('       source globalRules:', built.source.mappings.globalRules.length, '| pageInclusions:', built.source.mappings.pageInclusions.length, '| pageExclusions:', built.source.mappings.pageExclusions.map((e) => e.pages[0] + ':' + e.rules.length).join(', '));

console.log('3. The built ddm-sdk.js masks (loaded in a plain page)');
const HTML = `<h1>t</h1>
  <span id="aadhaarNo">2345 6789 0123</span>
  <span id="panNo">ABCDE1234F</span>
  <span name="mobileNo">9876543210</span>
  <span id="dob">14/08/1990</span>
  <span id="plain">hello</span>`;
async function maskedOn(path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  await page.evaluate((html) => { document.body.innerHTML = html; }, HTML);
  await page.addScriptTag({ content: built.sdk });
  await new Promise((r) => setTimeout(r, 300));
  return page.evaluate(() => Object.fromEntries([...document.querySelectorAll('span')].map((e) => [e.id || e.getAttribute('name'), e.textContent])));
}
const profile = await maskedOn('/profile');
check(profile.aadhaarNo === '**** **** 0123', 'on /profile: Aadhaar shows only the last 4 -> ' + profile.aadhaarNo);
check(profile.panNo === 'ABC*****4F', 'on /profile: PAN keeps first 3 and last 2 -> ' + profile.panNo);
check(profile.dob === '**/**/1990', 'on /profile: date of birth keeps the year -> ' + profile.dob);
check(profile.plain === 'hello', 'an unrelated element is left alone');
const other = await maskedOn('/somewhere');
check(other.panNo === 'ABC*****4F', 'on /somewhere: PAN is masked on every page -> ' + other.panNo);
check(other.aadhaarNo === '2345 6789 0123', 'on /somewhere: Aadhaar (only /profile) stays visible -> ' + other.aadhaarNo);
const login = await maskedOn('/login');
check(login.panNo === 'ABCDE1234F' && login.aadhaarNo === '2345 6789 0123', 'on /login: masking is off -> ' + login.panNo);
const customers = await maskedOn('/customers/42');
check(customers.mobileNo === '9876543210' && customers.panNo === 'ABC*****4F', 'on /customers/42: mobile is shown (except), PAN still masked -> ' + customers.mobileNo + ' / ' + customers.panNo);

console.log('4. Problems are reported, not hidden');
const bad = await lib(`const { SAMPLE_FIELDS, SAMPLE_PAGES } = await import('/src/lib/catalog.js');
  const { toMappingSource } = await import('/src/lib/toMappingSource.js'); const { previewCompile } = await import('/src/lib/buildSdk.js');
  const pages = [...SAMPLE_PAGES, { id: 'p9', path: '/customers/{id}', match: 'x', on: true }];
  const fields = SAMPLE_FIELDS.map((f) => f.id === 'f5' ? { ...f, pages: ['p9'] } : f);
  return previewCompile(toMappingSource({ fields, pages, meta: {} }));`);
check(bad.errors.length > 0, 'a page like /customers/{id} is an error: ' + (bad.errors[0] || '(none)'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed` + (problems.length ? '\nPage errors:\n' + [...new Set(problems)].join('\n') : ', no page errors'));
process.exit(fail ? 1 : 0);
