# DAM Portal sample app (DDM browser SDK POC)

A small React 18 + Vite + React Router app that renders every scenario in `../SCENARIOS.md` (S01–S36) with
**real** values. It does no masking itself: the DDM SDK script, loaded first in `<head>` of `index.html` as
`<script src="/ddm/ddm-sdk.js"></script>`, masks what users see. The e2e runner uses this app to check every scenario.

## Run

```sh
npm install
npm run ddm:pull   # download the latest approved SDK from the backend (http://localhost:8095)
npm run dev        # http://localhost:5182
```

`npm run ddm:pull` writes `public/ddm/ddm-sdk.js` and prints the version and size. It needs the backend running
and an approved version of the `dam-portal` app (otherwise it exits with a clear error). Until you pull, the
committed placeholder only logs a warning and nothing is masked.

`npm run build` builds into `dist/`; `npm run preview` serves the build on port 5182.

## Pages

| Path | Scenarios |
|---|---|
| `/` | checklist of all scenarios, with links |
| `/profile` | S02–S16 |
| `/customers` | S17–S22 (click a row for the modal) |
| `/customers/101`, `/customers/102` | S23–S27 |
| `/documents` | S28–S30 |
| `/widgets` | S31–S34 (`/frame.html` is the iframe, S33) |
| `/legacy?action=view`, `/legacy?action=edit` | S35 |
| `/login` | S36 (excluded page) |

The header (S01) is on every page. **DDM debug** toggles `localStorage.ddmDebug` and reloads.
