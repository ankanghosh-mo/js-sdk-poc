// Screenshots of every screen of the redesigned SDK console (one per canvas screen), plus
// runtime errors and React warnings, for comparing with the "Data Masking Redesign" canvas.
// Usage: npm run test:shots   (the console must be running on http://localhost:5181)
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, 'out');
mkdirSync(OUT, { recursive: true });
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SCREENS = [
  ['1-sdk-list', '/sdks'],
  ['2-create-sdk', '/sdks/new'],
  ['3-rules', '/sdks/dam-portal/rules'],
  ['3a-add-rule', '/sdks/dam-portal/rules/add'],
  ['3b-page-map', '/sdks/dam-portal/pages'],
  ['4-review', '/sdks/dam-portal/review'],
  ['5-build', '/sdks/dam-portal/build'],
  ['6-ready', '/sdks/dam-portal/ready'],
];

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'], defaultViewport: { width: 1440, height: 960 } });
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push('[page error] ' + e.message));
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });

for (const [name, path] of SCREENS) {
  const before = problems.length;
  await page.goto('http://localhost:5181/#' + path, { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(500);
  const h1 = await page.$eval('h1', (e) => e.textContent.trim()).catch(() => '(no h1)');
  await page.screenshot({ path: resolve(OUT, name + '.png'), fullPage: true });
  console.log(`${name.padEnd(14)} ${path.padEnd(30)} h1="${h1}"  ${problems.length - before ? (problems.length - before) + ' problem(s)' : 'ok'}`);
}
await browser.close();
console.log('\n' + (problems.length ? [...new Set(problems)].join('\n') : 'No runtime errors or React warnings.'));
console.log('Screenshots: ' + OUT);
