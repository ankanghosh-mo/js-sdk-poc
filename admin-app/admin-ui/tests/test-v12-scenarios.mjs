import puppeteer from 'puppeteer-core';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const BASE = 'http://localhost:5182';

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-first-run', '--disable-gpu'],
  defaultViewport: { width: 1360, height: 900 }
});

const page = await browser.newPage();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function record(s) {
  results.push(s);
  const statusStr = s.status === 'MASKED' ? ' [PASS: MASKED] ' : s.status === 'UNMASKED' ? ' [FAIL: UNMASKED] ' : ' [NOTE] ';
  console.log(`${s.id.padEnd(5)} | ${statusStr} | ${s.description.padEnd(45)} | got "${s.actual}" (expected "${s.expected}")`);
}

const text = (sel) => page.$eval(sel, (el) => el.textContent.trim()).catch(() => '(not found)');
const val = (sel) => page.$eval(sel, (el) => el.value).catch(() => '(not found)');
const attr = (sel, a) => page.$eval(sel, (el, a) => el.getAttribute(a), a).catch(() => '(not found)');

async function nav(href) {
  await page.evaluate((h) => {
    const a = Array.from(document.querySelectorAll('a')).find((x) => x.getAttribute('href') === h);
    if (a) a.click();
    else window.location.href = h;
  }, href);
  await sleep(600);
}

console.log('--- Testing V12 Masking Engine (v0.4.1) against Sample App Scenarios ---');

// ================= /profile =================
await page.goto(BASE + '/profile', { waitUntil: 'networkidle0' });
await page.waitForSelector('#aadhaarNo');
await sleep(500);

// S01: Layout header #userMobile
const s01 = await text('#userMobile');
record({ id: 'S01', description: 'Header #userMobile (ELEMENT_ID)', actual: s01, expected: '******3210', status: s01.includes('*') ? 'MASKED' : 'UNMASKED', reason: s01.includes('*') ? 'Supported: ELEMENT_ID matches id="userMobile"' : 'Missed' });

// S02: #aadhaarNo
const s02 = await text('#aadhaarNo');
record({ id: 'S02', description: 'Profile #aadhaarNo (ELEMENT_ID)', actual: s02, expected: '**** **** 0123', status: s02.includes('*') ? 'MASKED' : 'UNMASKED', reason: s02.includes('*') ? 'Supported: ELEMENT_ID matches id="aadhaarNo"' : 'Missed' });

// S03: input[name=pan] readOnly
const s03 = await page.$eval('input[name=pan]', (el) => ({ val: el.value, ts: el.hasAttribute('data-ddm-ts') }));
record({ id: 'S03', description: 'readOnly input[name=pan] (NAME)', actual: s03.ts ? 'dots (-webkit-text-security)' : s03.val, expected: 'dots (-webkit-text-security)', status: s03.ts ? 'MASKED' : 'UNMASKED', reason: s03.ts ? 'Supported: NAME matches name="pan", sets data-ddm-ts' : 'Missed' });

// S04: input[name=panNumber] editable
const s04 = await page.$eval('input[name=panNumber]', (el) => ({ val: el.value, ts: el.hasAttribute('data-ddm-ts') }));
record({ id: 'S04', description: 'editable input[name=panNumber]', actual: s04.ts ? 'dots' : s04.val, expected: 'ABCDE1234F (editable)', status: !s04.ts ? 'MASKED' : 'UNMASKED', reason: 'Supported: editable inputs are not modified' });

// S05: .contact-email
const s05 = await text('.contact-email');
record({ id: 'S05', description: '.contact-email (CLASS lookup)', actual: s05, expected: 'masked (FULL_MASK)', status: s05.includes('*') ? 'MASKED' : 'UNMASKED', reason: s05.includes('*') ? 'Supported: CLASS matches "contact-email"' : 'Engine Gap: CLASS token lookup' });

// S06: .info title attribute
const s06 = await attr('.info', 'title');
record({ id: 'S06', description: '.info title attribute tooltip', actual: s06, expected: 'Aadhaar XXXX XXXX 0123', status: s06.includes('*') || s06.includes('X') ? 'MASKED' : 'UNMASKED', reason: 'Engine Gap: V12 spec §5 does not inspect or mask title attributes' });

// S07: p.kyc-line (React two text nodes: "Aadhaar: " + value)
const s07 = await text('p.kyc-line');
record({ id: 'S07', description: 'p.kyc-line "Aadhaar: {val}" in 2 text nodes', actual: s07, expected: 'Aadhaar: masked', status: s07.includes('*') || s07.includes('X') ? 'MASKED' : 'UNMASKED', reason: s07.includes('*') ? 'Supported' : 'Engine Gap: V12 INLINE requires "Label: value" within single text node (React splits dynamic text)' });

// S08: .card verifyKyc section
const s08 = await page.evaluate(() => {
  const card = document.querySelector('button[name=verifyKyc]')?.closest('.card');
  return card ? { a: card.querySelector('#aadhaar')?.textContent.trim(), p: card.querySelector('.pan')?.textContent.trim() } : null;
});
record({ id: 'S08', description: 'Complex container selector exclusion', actual: JSON.stringify(s08), expected: 'Aadhaar real, PAN masked', status: 'UNMASKED', reason: 'Engine Gap: V12 spec does not support CSS selector container exclusions (only whole-page or id-based)' });

// S09: #profileDetails #aadhaar
const s09 = await text('#profileDetails #aadhaar');
record({ id: 'S09', description: '#profileDetails #aadhaar (ELEMENT_ID)', actual: s09, expected: 'masked', status: s09.includes('*') ? 'MASKED' : 'UNMASKED', reason: s09.includes('*') ? 'Supported: ELEMENT_ID matches id="aadhaar"' : 'Missed' });

// S10: #internalNotes
const s10 = await text('#internalNotes .mobile');
record({ id: 'S10', description: '#internalNotes section exclusion', actual: s10, expected: '9876543210 (unmasked)', status: s10 === '9876543210' ? 'UNMASKED' : 'MASKED', reason: s10 === '9876543210' ? 'Excluded' : 'Engine Gap: #internalNotes has no V12 parent exclusion rule defined' });

// S11: #mobileNo timer update
const s11 = await text('#mobileNo');
record({ id: 'S11', description: '#mobileNo React re-render state', actual: s11, expected: 'masked', status: s11.includes('*') ? 'MASKED' : 'UNMASKED', reason: s11.includes('*') ? 'Supported: MutationObserver re-masks on node text replacement' : 'Missed' });

// S12: #kycList dt/dd
const s12 = await page.$$eval('#kycList dd', (els) => els.map((e) => e.textContent.trim()));
record({ id: 'S12', description: '<dl><dt>PAN</dt><dd>value</dd></dl>', actual: s12.join(' | '), expected: 'both masked', status: s12.some((x) => x.includes('*')) ? 'MASKED' : 'UNMASKED', reason: s12.some((x) => x.includes('*')) ? 'Masked' : 'Engine Gap: <dt>/<dd> are not <label> and not <th> columns; V12 ignores dl elements' });

// S13: a.phone-link
const s13 = await page.$eval('a.phone-link', (a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
record({ id: 'S13', description: '<a class="phone-link" href="tel:..">', actual: s13.text, expected: 'masked', status: s13.text.includes('*') ? 'MASKED' : 'UNMASKED', reason: s13.text.includes('*') ? 'Supported: CLASS matches "phone-link"' : 'Missed' });

// S14: #stats position selector
const s14 = await text('#stats > span:nth-child(2)');
record({ id: 'S14', description: 'Position selector (#stats > span:nth-child(2))', actual: s14, expected: 'masked', status: s14.includes('*') ? 'MASKED' : 'UNMASKED', reason: s14.includes('*') ? 'Masked' : 'Engine Gap: V12 spec does not support CSS position selectors without matching id/name/class/label' });

// S15: Form submission
await page.click('#submitKyc').catch(() => {});
await sleep(200);
const s15 = await text('#submitCheck');
record({ id: 'S15', description: 'Form submit real value', actual: s15, expected: 'real value submitted', status: s15.includes('real') ? 'MASKED' : 'UNMASKED', reason: s15.includes('real') ? 'Supported: data-ddm-ts keeps real underlying input value for FormData' : 'Missed' });

// S16: Read value via ref
await page.click('#readValue').catch(() => {});
await sleep(200);
const s16 = await text('#readCheck');
record({ id: 'S16', description: 'App ref read real value', actual: s16, expected: 'app reads real value', status: s16.includes('real') ? 'MASKED' : 'UNMASKED', reason: s16.includes('real') ? 'Supported: input.value getter returns real value' : 'Missed' });

// ================= /customers =================
await nav('/customers');
await page.waitForSelector('#custTable tbody tr');
await sleep(400);

// S17: Table <th> columns
const s17 = await page.$$eval('#custTable tbody tr', (rows) => {
  const r0 = rows[0];
  return { pan: r0.cells[1]?.textContent.trim(), mob: r0.cells[2]?.textContent.trim(), name: r0.cells[0]?.textContent.trim() };
});
record({ id: 'S17', description: 'Table <th> header matching (PAN, Mobile)', actual: JSON.stringify(s17), expected: 'PAN/Mobile masked, Name unmasked', status: (s17.pan?.includes('*') && s17.mob?.includes('*')) ? 'MASKED' : 'UNMASKED', reason: (s17.pan?.includes('*')) ? 'Supported: COLUMN index matches <th>PAN</th> and <th>Mobile</th>' : 'Missed' });

// S18: Sort table
await page.click('#sortByName').catch(() => {});
await sleep(200);
const s18 = await page.$$eval('#custTable tbody tr', (rows) => rows[0].cells[1]?.textContent.trim());
record({ id: 'S18', description: 'Table rows sort preservation', actual: s18, expected: 'masked', status: s18?.includes('*') ? 'MASKED' : 'UNMASKED', reason: s18?.includes('*') ? 'Supported: Table column tracking persists on row reordering' : 'Missed' });

// S19: Load more rows
await page.click('#loadMore').catch(() => {});
await sleep(250);
const s19 = await page.$$eval('#custTable tbody tr', (rows) => rows[25]?.cells[1]?.textContent.trim());
record({ id: 'S19', description: 'Dynamic table rows added', actual: s19, expected: 'masked', status: s19?.includes('*') ? 'MASKED' : 'UNMASKED', reason: s19?.includes('*') ? 'Supported: MutationObserver scans new <tr> child elements' : 'Missed' });

// S20: React Portal modal with data-testid
await page.click('#custTable tbody tr').catch(() => {});
await page.waitForSelector('.ddm-modal').catch(() => {});
await sleep(200);
const s20 = await page.evaluate(() => {
  const m = document.querySelector('.ddm-modal');
  return m ? {
    name: m.querySelector('.customer-name')?.textContent.trim(),
    aadhaar: m.querySelector('[data-testid=customerAadhaar]')?.textContent.trim()
  } : null;
});
await page.click('#closeModal').catch(() => {});
record({ id: 'S20', description: 'Modal with [data-testid=customerAadhaar]', actual: JSON.stringify(s20), expected: 'name & aadhaar masked', status: s20?.aadhaar?.includes('*') ? 'MASKED' : 'UNMASKED', reason: s20?.aadhaar?.includes('*') ? 'Masked' : 'Engine Gap: V12 does not read data-testid attributes (only id, name, class, label, th, inline)' });

// S22: Linked table "PAN No" column
const s22 = await page.$$eval('#linkedTable tbody tr', (rows) => rows[0]?.cells[1]?.textContent.trim());
record({ id: 'S22', description: 'Second table <th>PAN No</th> column', actual: s22, expected: 'masked', status: s22?.includes('*') ? 'MASKED' : 'UNMASKED', reason: s22?.includes('*') ? 'Supported: COLUMN index matches normalized "panno"' : 'Missed' });

// ================= /customers/101 =================
await nav('/customers/101');
await page.waitForSelector('h2.customer-name').catch(() => {});
await sleep(400);

// S23: document.title
const s23 = await page.title();
record({ id: 'S23', description: 'document.title masking', actual: s23, expected: 'Customer: R**********', status: s23.includes('*') ? 'MASKED' : 'UNMASKED', reason: s23.includes('*') ? 'Masked' : 'Engine Gap: V12 spec does not observe or mask document.title' });

// S24: h2.customer-name
const s24 = await text('h2.customer-name');
record({ id: 'S24', description: 'h2.customer-name (CLASS lookup)', actual: s24, expected: 'masked', status: s24.includes('*') ? 'MASKED' : 'UNMASKED', reason: s24.includes('*') ? 'Supported: CLASS matches "customer-name"' : 'Missed' });

// S25: input[formcontrolname=aadhaar]
const s25 = await page.$eval('input[formcontrolname=aadhaar]', (el) => ({ val: el.value, ts: el.hasAttribute('data-ddm-ts') })).catch(() => null);
record({ id: 'S25', description: 'input[formcontrolname=aadhaar] (Angular attribute)', actual: JSON.stringify(s25), expected: 'dots (-webkit-text-security)', status: s25?.ts ? 'MASKED' : 'UNMASKED', reason: s25?.ts ? 'Supported: V12 explicitly inspects formcontrolname attribute' : 'Missed' });

// S26: select option
const s26 = await page.$eval('#accounts', (s) => s.options[0]?.text.trim()).catch(() => null);
record({ id: 'S26', description: '<select> <option> text', actual: s26, expected: 'masked after PAN', status: s26?.includes('*') ? 'MASKED' : 'UNMASKED', reason: s26?.includes('*') ? 'Masked' : 'Engine Gap: V12 spec §5 explicitly states <select> is NOT supported in V1 (values stay visible)' });

// ================= /documents =================
await nav('/documents');
await sleep(2200);

// S28: #docs .pan async fetch
const s28 = await page.$$eval('#docs .pan', (els) => els.map((e) => e.textContent.trim()));
record({ id: 'S28', description: 'Async fetch loaded .pan elements', actual: s28[0] || '(empty)', expected: 'masked', status: s28[0]?.includes('*') ? 'MASKED' : 'UNMASKED', reason: s28[0]?.includes('*') ? 'Supported: MutationObserver catches elements appended asynchronously' : 'Missed' });

// S29: #legacyWidget .aadhaar innerHTML
const s29 = await text('#legacyWidget .aadhaar');
record({ id: 'S29', description: 'innerHTML appended outside React (.aadhaar)', actual: s29, expected: 'masked', status: s29.includes('*') ? 'MASKED' : 'UNMASKED', reason: s29.includes('*') ? 'Supported: MutationObserver observes raw innerHTML insertions' : 'Missed' });

// S30: <label for="aadhaarField"> + input
const s30 = await page.$eval('#aadhaarField', (el) => ({ val: el.value, ts: el.hasAttribute('data-ddm-ts') })).catch(() => null);
record({ id: 'S30', description: '<label for="id"> matching associated input', actual: JSON.stringify(s30), expected: 'dots (-webkit-text-security)', status: s30?.ts ? 'MASKED' : 'UNMASKED', reason: s30?.ts ? 'Supported: LABEL index matches "Aadhaar No" -> sets data-ddm-ts on target input' : 'Missed' });

// ================= /widgets =================
await nav('/widgets');
await sleep(1000);

// S31: customer-badge shadowRoot
const s31 = await page.$eval('customer-badge', (b) => b.shadowRoot?.querySelector('.pan')?.textContent.trim()).catch(() => '(shadow error)');
record({ id: 'S31', description: 'Shadow DOM inside custom web component', actual: s31, expected: 'masked', status: s31?.includes('*') ? 'MASKED' : 'UNMASKED', reason: s31?.includes('*') ? 'Masked' : 'Engine Gap: V12 spec §9 explicitly confirms Shadow DOM is not watched' });

// S32: svg text
const s32 = await text('svg text.mobile');
record({ id: 'S32', description: '<svg> <text class="mobile">', actual: s32, expected: 'masked', status: s32.includes('*') ? 'MASKED' : 'UNMASKED', reason: s32.includes('*') ? 'Supported: SVG text nodes with matching class are processed' : 'Engine Gap: SVG DOM differences' });

// S33: iframe
const frame = page.frames().find((f) => f.url().endsWith('/frame.html'));
const s33 = frame ? await frame.$eval('#aadhaarNo', (e) => e.textContent.trim()).catch(() => '(err)') : '(no frame)';
record({ id: 'S33', description: 'Same-origin <iframe> loading ddm-sdk.js', actual: s33, expected: 'masked', status: s33.includes('*') ? 'MASKED' : 'UNMASKED', reason: s33.includes('*') ? 'Supported: Iframe loading own copy of ddm-sdk.js masks independently' : 'Missed' });

// S34: input[type=hidden]
const s34 = await page.$eval('input[type=hidden][name=aadhaar]', (e) => e.value).catch(() => null);
record({ id: 'S34', description: 'input[type=hidden] untouched', actual: s34, expected: '234567890123 (unchanged)', status: s34 === '234567890123' ? 'MASKED' : 'UNMASKED', reason: 'Supported: Hidden inputs are skipped by design' });

// ================= /login (page exclusion) =================
await nav('/login');
await sleep(400);

// S36: Excluded page
const s36a = await text('#aadhaarNo');
const s36m = await text('#userMobile');
const s36ok = s36a === '2345 6789 0123' && s36m === '9876543210';
record({ id: 'S36', description: 'Excluded page /login: everything stays visible', actual: `${s36a} | ${s36m}`, expected: '2345 6789 0123 | 9876543210', status: s36ok ? 'MASKED' : 'UNMASKED', reason: s36ok ? 'Supported: pageExclusions on /login disables masking for all PII' : 'Missed' });

await browser.close();

writeFileSync(resolve('sample-app-v12-results.json'), JSON.stringify(results, null, 2), 'utf-8');
console.log('\n--- Testing Completed. Results written to sample-app-v12-results.json ---');
