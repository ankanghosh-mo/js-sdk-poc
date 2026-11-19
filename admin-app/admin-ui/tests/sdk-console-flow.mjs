// Clicks through the redesigned SDK console the way an admin would, and checks each step.
// Usage: npm run test:flow   (the console must be running on http://localhost:5181)
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'], defaultViewport: { width: 1440, height: 960 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

let pass = 0, fail = 0;
const check = (ok, what) => { console.log((ok ? '  ok   ' : '  FAIL ') + what); ok ? pass++ : fail++; };
const text = () => page.evaluate(() => document.body.innerText);
// click the first visible button/link/label whose own text is exactly `label`
async function click(label) {
  const done = await page.evaluate((label) => {
    const vis = [...document.querySelectorAll('button, a, label, [role="tab"]')].filter((e) => e.offsetParent !== null);
    const own = (e) => e.textContent.replace(/\s+/g, ' ').trim();
    let els = vis.filter((e) => own(e) === label);
    if (!els.length) els = vis.filter((e) => own(e).startsWith(label)); // tabs carry a count: "Needs you3"
    if (!els.length) return false;
    els[0].click();
    return true;
  }, label);
  await sleep(250);
  return done;
}

console.log('1. SDK list → Create SDK');
await page.goto('http://localhost:5181/#/sdks', { waitUntil: 'networkidle0' });
check((await text()).includes('DAM Portal SDK'), 'list shows the 5 SDKs');
await click('Needs you'); check(!(await text()).includes('Partner Console SDK'), '"Needs you" tab filters the list');
await click('All SDKs');
await page.type('input[type="search"]', 'kyc'); await sleep(200);
check((await text()).includes('KYC Admin SDK') && !(await text()).includes('Branch Ops SDK'), 'search filters by name');
await click('Create SDK'); check((await text()).includes('One SDK per web app'), 'Create SDK dialog opens');
await page.type('input[placeholder="e.g. Loan Desk SDK"]', 'Loan Desk SDK');
check(await page.$eval('input[placeholder="e.g. Loan Desk SDK"]', (e) => e.value) === 'Loan Desk SDK', 'SDK name can be typed');
await click('Create and add rules'); await sleep(400);
check(page.url().endsWith('#/sdks/dam-portal/rules'), '"Create and add rules" goes to the Rules page');

console.log('2. Rules → Add rule');
check((await text()).includes('Aadhaar number'), 'rules table shows the fields');
await click('Add rule'); await sleep(300);
check((await text()).includes('What kind of data is it?'), 'Add rule panel opens');
await page.type('input[placeholder="Type a word"]', 'acctNumber'); await page.keyboard.press('Enter'); await sleep(200);
check((await text()).includes('acctNumber'), 'a word can be added with Enter');
await click('Cancel'); await sleep(200);
check(!(await text()).includes('What kind of data is it?'), 'Cancel closes the panel');

console.log('3. Page map');
await click('Page map'); await sleep(300);
check((await text()).includes('Every-page rules'), 'Page map shows every-page rules for the chosen page');

console.log('4. Review (reviewer) → approve → build → ready');
await page.goto('http://localhost:5181/#/sdks/dam-portal/review', { waitUntil: 'networkidle0' });
check((await text()).includes('Review 3 changes from Yuvraj Bhati'), 'reviewer sees the 3 changes');
await click('Approve rules'); await sleep(400);
check((await text()).includes('Approved. Ready to build.'), 'Approve moves to the build step');
await click('Build SDK v1.3');
for (let i = 0; i < 40 && !(await text()).includes('Your SDK is ready'); i++) await sleep(250);
check((await text()).includes('Your SDK is ready'), 'Build finishes and shows the download');
await click('Options'); await sleep(200);
check((await text()).toLowerCase().includes('option'), 'README tabs switch');

await browser.close();
console.log(`\n${pass} passed, ${fail} failed` + (errors.length ? '\nErrors:\n' + [...new Set(errors)].join('\n') : ', no runtime errors'));
process.exit(fail ? 1 : 0);
