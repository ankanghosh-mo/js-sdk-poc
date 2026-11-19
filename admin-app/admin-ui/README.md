# DDM console: JavaScript SDKs

The admin console for the DDM JavaScript SDK, built from the design canvas **"Data Masking Redesign"** (its 8 "SDK" screens).

**Status:** phase 1. The screens work exactly as in the design, on the design's sample data. Nothing is saved yet
(a reload starts again), and it does not call any backend. Next: export the rules as the map file the SDK engine reads.

## Run

Requirements: Node.js 18 or later.

```
npm install
npm run dev
```

Open http://localhost:5181.

## Run with Docker

No Node.js needed, only Docker:

```
docker build -t ddm-sdk-console .
docker run --rm -p 5181:80 ddm-sdk-console
```

Open http://localhost:5181. The image builds the site with Node 20, then serves it with nginx (`nginx.conf`); about 72 MB.
Use another port if 5181 is taken: `-p 8080:80` → http://localhost:8080.

## Screens

| Route | Canvas screen |
|---|---|
| `#/sdks` | SDK 1 · All SDKs |
| `#/sdks/new` | SDK 2 · Create SDK |
| `#/sdks/dam-portal/rules` | SDK 3 · Rules |
| `#/sdks/dam-portal/rules/add` | SDK 3a · Add rule |
| `#/sdks/dam-portal/pages` | SDK 3b · Page map |
| `#/sdks/dam-portal/review` | SDK 4 · Review (reviewer) |
| `#/sdks/dam-portal/build` | SDK 5 · Build |
| `#/sdks/dam-portal/ready` | SDK 6 · Download and README |

The canvas has 8 screens but only 3 pages, each shown in several states. So `src/pages/` holds 3 components, and each route
gives its page a starting state (`initial`).

## Folders

| Folder | What it holds |
|---|---|
| `src/pages/` | The 3 pages: SDK list, rules and page map, review and build |
| `src/components/Sidebar.jsx` | The left menu (the PET group opens and closes) |
| `src/lib/dc.js` | Helpers: inline styles, and the routes between screens |
| `src/styles.css` | The design's shared styles |
| `design/` | The design's source pages, as exported from the canvas |
| `tools/dc2jsx.py` | The converter that made `src/pages/` from `design/` |
| `tests/` | Browser checks (below) |

## How the pages were made

`src/pages/*.jsx` were generated from `design/` by `tools/dc2jsx.py`: the markup is copied as-is, the design's logic class becomes
a React class component, links between screens become the routes above. The menu was then moved into `Sidebar.jsx` by hand.

From phase 2 on, the pages are edited by hand. To compare with a new version of the design, regenerate into a scratch folder:

```
python tools/dc2jsx.py design/DDMRules.dc.html scratch/RulesPage.jsx RulesPage
```

## Checks

With the console running (`npm run dev`), in a second terminal:

- `npm run test:shots`: a screenshot of every screen in `tests/out/`, and any runtime error or React warning;
- `npm run test:flow`: clicks through list → create → rules → add rule → page map → review → approve → build → download.

Both use Microsoft Edge (installed on Windows) through `puppeteer-core`; no browser is downloaded.
