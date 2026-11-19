# Vendored SDK kit

Copied **unchanged** from the SDK team's `js-sdk` folder (engine v0.4.1, V12 map, norm-2). Do not edit these files here.
To take a new version: replace the three `.js` files (and the spec) with the new ones; nothing else changes.

| File | Used for |
|---|---|
| `ddm-compiler-core.js` | `ddmCompile(source)` turns the mapping source into the V12 map (plain JS, runs in the browser) |
| `ddm-check.js` | `ddmCheckV12`, `ddmCanonicalJson` (for the config hash) |
| `ddm-engine.js` | the masking engine that goes into the downloaded `ddm-sdk.js` |
| `DDM-V12-SPEC.md` | the contract |

`src/lib/ddmKit.js` loads them; `src/lib/buildSdk.js` does what the kit's `ddm-compile.mjs` does, in the browser.
