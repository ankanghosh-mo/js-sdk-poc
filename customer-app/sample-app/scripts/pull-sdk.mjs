// Downloads the latest approved DDM SDK for the dam-portal app into public/ddm/ddm-sdk.js.
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_LATEST = process.env.DDM_SDK_URL || 'http://localhost:8095/api/apps/dam-portal/versions/latest/sdk.js';
const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '..', 'public', 'ddm', 'ddm-sdk.js');

async function main() {
  let res;
  try {
    res = await fetch(URL_LATEST);
  } catch (err) {
    console.error(`ddm:pull failed: cannot reach the DDM backend at ${URL_LATEST} (${err.cause?.code || err.message}).`);
    console.error('Start the backend and try again.');
    process.exit(1);
  }

  if (res.status === 404) {
    let detail = '';
    try { detail = (await res.json()).error || ''; } catch { /* not JSON */ }
    console.error('ddm:pull failed: the app "dam-portal" has no approved version yet (HTTP 404).' + (detail ? ` Backend says: ${detail}` : ''));
    console.error('Submit and approve the draft in the admin UI, then run npm run ddm:pull again.');
    process.exit(1);
  }
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch { /* ignore */ }
    console.error(`ddm:pull failed: HTTP ${res.status} ${res.statusText} from ${URL_LATEST}${detail ? `\n${detail.slice(0, 500)}` : ''}`);
    process.exit(1);
  }

  const body = await res.text();
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body, 'utf8');

  const firstLine = body.split(/\r?\n/, 1)[0] || '';
  const m = firstLine.match(/\bv(?:ersion)?\s*[:=]?\s*(\d+)\b/i);
  const version = m ? m[1] : 'unknown';
  const bytes = Buffer.byteLength(body, 'utf8');

  console.log(`DDM SDK pulled: version ${version}, ${bytes} bytes -> public/ddm/ddm-sdk.js`);
  console.log(`Header: ${firstLine.slice(0, 200)}`);
}

main();
