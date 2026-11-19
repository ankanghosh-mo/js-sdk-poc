# DDM SDK: V12 developer spec

This is the contract between the backend compiler and the browser SDK. `ddm-compiled-v12.json` is a real example of
the payload, and the reference compiler (`ddm-compiler-core.js`) and checker (`ddm-check.js`) implement everything below.
A backend written in another language must reproduce `ddm-compiled-v12.json` byte-for-byte in meaning from
`mapping-source.json` (same JSON value; whitespace is free).

This is browser-side UI masking. The original values still exist in network responses, page source and application
state. Do not describe it as data protection.

## 1. Payload

| Field | Meaning |
|---|---|
| `v` | Always `12`. The SDK refuses any other value and masks nothing. |
| `configVersion` | Free text from the source, for support. |
| `meta` | `status`, `policyId`, `approvedAt`, `configHash`, `normalization`. See section 6. |
| `routing` | How URLs are cleaned before page rules are tested. See section 3. |
| `defaults` | `maskChar`, `preserveSeparators`, `onFormatMismatch` (always `FULL`: a value that doesn't fit a PATTERN mask is shown as `****`, v5.2 rule 13), `revealable` (default `true`), `revealTimeoutMs`. |
| `pii` | List of masking rules. The position in this list is the PII number used everywhere else. A PII may carry its own `revealable`. |
| `pages` | List of `{"type":"PREFIX","value":"/path"}`. The position is the page number used everywhere else. |
| `parentExclusions` | `{ "*": "sel,sel", "<page>": "sel,sel" }`. Ready-to-use CSS selector lists. A page key already includes the `"*"` selectors. |
| `excludedPiiByPage` | `{ "<page>": [pii, ...] }`. PII that are fully visible on that page. |
| `index` | `{ LOCATION: { key: [entry, ...] } }` for cleaned-up keys of 3 or more characters. Locations: `ELEMENT_ID`, `NAME`, `LABEL`, `COLUMN`, `CLASS`, `INLINE`. |
| `exactIndex` | The same shape, for keywords shorter than 3 characters after clean-up, keyed exactly as the admin wrote them (white space at either end removed). Can be empty. |

An index entry is `{ "pii": n }`, optionally with `"page": n` (only on that page) and, under `COLUMN` only,
`"table": "id"` (only in that table). Entries have no `action`: V12 index entries never exclude anything.

## 2. norm-2: key matching

`meta.normalization` is the identifier of the matching rules below. The SDK knows only `"norm-2"`. If it sees any other
value (including the older `"norm-1"`) it logs a console error, matches nothing, masks nothing and exposes
`DamDDM.active === false`.

**Clean-up.** Both the compiler (on the admin's lookup texts) and the SDK (on the text found on the page) apply, in this order:

1. Unicode NFKC normalization.
2. Lowercase (`toLowerCase()`, not locale specific).
3. Remove every run of whitespace, `_` and `-`.
4. Remove trailing `:` and `*` characters.

```js
const normalizeKey = (s) => String(s).normalize('NFKC').toLowerCase()
  .replace(/[\s_\-]+/g, '').replace(/[:*]+$/, '');
```

**Length rule (v5.2 rule 6).** A keyword whose cleaned-up form has **3 or more** characters goes into `index` under that
form and matches loosely: `panNo` matches `panNo`, `pan_no`, `PAN-NO`, `PanNo`. A keyword whose cleaned-up form has
**2** characters goes into `exactIndex` exactly as written (white space at either end removed) and matches only that:
`DL` matches `DL`, not `dl`, `D_L` or `D L`. List every spelling the screens use (`DL` and `D_L` are two keywords).
A cleaned-up form of fewer than 2 characters is refused.

**Lookup in the SDK.** Clean up the text found on the page. If the result has 3 or more characters, look it up in
`index`; otherwise look up the page text itself (white space at either end removed) in `exactIndex`.

Matching is exact on the result in both cases: `aadhar` and `aadhaar` are different keys. The compiler drops duplicates
that collapse to the same key and warns about every short keyword.

Differences from v5.2 rule 6, kept on purpose: white space is removed (screen labels contain spaces, such as
"Account Number"), NFKC is applied, and a trailing `:` or `*` is removed (labels such as "PAN Number:" or "Mobile*").

| Input | Result |
|---|---|
| `Account Number` | `index` key `accountnumber` |
| `ACCOUNT_NUMBER:` | `index` key `accountnumber` |
| ` Account  Number * ` | `index` key `accountnumber` |
| `aadhaar-no`, `Aadhaar No` | `index` key `aadhaarno` |
| `Ａａｄｈａａｒ Ｎｏ` (full-width letters) | `index` key `aadhaarno` |
| `PAN Number:` | `index` key `pannumber` |
| `mobile_no` | `index` key `mobileno` |
| `Date of Birth*` | `index` key `dateofbirth` |
| `DL` | `exactIndex` key `DL` (matches `DL` only) |
| ` D_L ` | `exactIndex` key `D_L` (matches `D_L` only) |
| `A` | refused (too short) |

## 3. Routing

### 3.1 Page rules (compiler)

The admin enters page paths. The compiler turns each into a normalized prefix, once. The SDK never edits rule text.

| Admin input | Result |
|---|---|
| `/profile`, `/profile/`, `/Profile` | PREFIX `/profile` |
| `/profile*`, `/profile/*` | PREFIX `/profile`, with a warning (see section 8) |
| `/profile.jsp` | PREFIX `/profile` when `.jsp` is in `routing.stripExtensions`, with a warning |
| `/customer/*/details` | **Error**: wildcard inside the path (no segment matcher in V1) |
| `/`, `/*`, `*` | **Error**: a raw `/` prefix would match every page; use a global rule |
| `*/profile`, `profile` | **Error**: must start with `/`; put the application prefix in `routing.contextPath` |
| anything with `?`, `#`, `;`, `%` or spaces | **Error** |

Steps: strip a trailing `*` (and the `/` before it), reject any other `*`, collapse `//` to `/`, lowercase,
remove trailing `/`, remove one matching extension from `routing.stripExtensions`, reject an empty result.
Identical results collapse into one `pages` entry. A page entry exists only if something references it.

### 3.2 URL cleaning (SDK, once per route change)

1. Route source. If `routing.hashRouting` is `"auto"` and `location.hash` starts with `#/`, the route is the hash
   without the `#`, and the pathname is ignored (exclusively). Otherwise the route is `location.pathname`.
   A hash that does not start with `#/` (for example `#section`) is ignored.
2. Remove everything from the first `?`.
3. Remove every `;...` path parameter up to the next `/` (`;jsessionid=...`).
4. Collapse `//` (and longer) to `/`. Lowercase. Make sure it starts with `/`.
5. Pathname only: if `routing.contextPath` is set and the path equals it or starts with it plus `/`, remove it
   (an empty result becomes `/`).
6. Remove a trailing `/` (not for the root).
7. Remove one trailing extension from `routing.stripExtensions` (for example `.jsp`, `.do`) if something remains.
8. An empty result is `/`.

`caseInsensitive`, `stripQuery` and `stripTrailingSlash` are always `true` in V12 (the checker rejects `false`).

### 3.3 Matcher

```js
const isMatch = (currentPath, rulePath) =>
  currentPath === rulePath || currentPath.startsWith(rulePath + '/');
```

`/profile` matches `/profile`, `/profile/settings`, `/profile.jsp` and `/profile;jsessionid=x`, and rejects
`/profileadmin`, `/profile-settings` and `/profiles`. Each page rule is tested once per route change
(page load, `pushState`, `replaceState`, `popstate`, `hashchange`, and the Navigation API's `currententrychange`
and `navigatesuccess` where the browser has it); per-element code only reads the results. Several rules can be active
at once. The SDK rescans the page only when the set of active rules changes, so two signals for the same navigation
cost one check. The Navigation API's `navigate` event is not used: it fires before the new URL is committed.

Verified examples (rule `/profile`, extensions `.jsp` and `.do`, no context path):

| URL | Match |
|---|---|
| `/profile`, `/profile/`, `/Profile`, `//profile`, `/profile?x=1` | yes |
| `/profile/settings`, `/profile.jsp`, `/profile.do` | yes |
| `/profile;jsessionid=A1B2C3`, `/profile.jsp;jsessionid=A1B2C3?tab=1` | yes |
| `/#/profile`, `/#/profile?tab=2` | yes (hash route) |
| `/profile#section` | yes (plain anchor ignored, pathname used) |
| `/profile#/support` | no (the hash route `/support` is used exclusively) |
| `/profileadmin`, `/profile-settings`, `/profiles` | no |
| `/bankapp/profile.jsp` | no, unless `routing.contextPath` is `/bankapp` |

## 4. Lookup and exclusion

1. The SDK looks at an element's id, `name` or Angular `formcontrolname`, label text, `aria-label`, column header,
   class tokens, or "Label: value" text, depending on which locations have keys. It finds the keyword's list with
   norm-2 (section 2): `index` for 3+ characters, `exactIndex` for shorter ones.
2. Walk the entries in order. Skip an entry whose `page` is not active, or whose `table` is not the table being read.
   The first remaining entry decides.
3. If the decided PII is in the excluded set for the active pages (the union of `excludedPiiByPage[p]` for every
   active page `p`), the element is left visible. Stop: do not look at later entries.
4. Otherwise the PII's masking rule is applied. A PATTERN mask whose input shape the value doesn't fit shows `****`
   (v5.2 rule 13), for example a 15-digit card under `****-****-****-####`.

When several locations match the same element, the order is `ELEMENT_ID`, `NAME`, `LABEL`, `COLUMN`, `CLASS`
(first wins). The compiler orders each key's entries most specific first (v5.2 rule 2: route, then location): a longer
page prefix before a shorter one (`/profile/settings` before `/profile`), page entries before global ones, and within
the same page a table-filtered entry first. The result never depends on the order the admin wrote the rules in.
A parent exclusion beats everything: nothing inside an element matching the active `parentExclusions` selector is masked.

`excludedPiiByPage` applies to whole PII only. Excluding a PII on a page makes **all** its values visible on that
page, whatever matched them. Scoped exclusions (a rule with `lookupTexts`, `lookIn` or `tableId`) are rejected by the compiler.
The compiler also rejects a source that includes and excludes the same PII on the same page.

### Change handling

The SDK watches the page with one MutationObserver. The browser delivers its records before it paints, and the SDK
masks inside that callback for up to **50 ms** (the long-task threshold). Only work beyond that is finished after a
paint; each time this happens `DamDDM.stats().deferredSlices` goes up by one. A step that fails unexpectedly is skipped
with one console warning, and masking continues.

- A new element: its whole subtree is scanned.
- A changed attribute (`id`, `name`, `formcontrolname`, `for`, `aria-label`, `aria-labelledby`, and `class` when
  there are `CLASS` keys): that element only, not its children.
- Changed text inside a masked element: masked again (the application's rewrite never shows).
- Changed text inside a `label` or table header: that label or header is evaluated again.
- Any other changed text is ignored, because ids, names and classes are attributes. The exception is `INLINE` keys:
  such text is checked on its own (one colon search, one lookup), never by rescanning its parent.

### Veil (opt-in)

An element carrying the attribute `data-ddm-veil` (the `<html>` element, a page wrapper, or a heavy grid's container) is
hidden with `visibility: hidden` until masking has nothing pending: after the first full scan for content present at
load, and as soon as the queue is empty for content added later. A 3-second failsafe removes every veil, so a page is
never left hidden. `DamDDM.stats().veilsLifted` counts them. This is the only markup an application adds, and only on
the pages it chooses.

### Input fields

Matched text inputs get the attribute `data-ddm-ts`; their value is never changed, so forms submit the real value.

| Browser | What the user sees | `stats().inputMaskMode` |
|---|---|---|
| Chrome, Edge, Safari, Firefox 114+ (supports `-webkit-text-security`) | dots | `dots` |
| Older browsers | typed text made invisible (cursor still visible), one console warning | `hidden-text` |

### `DamDDM` at runtime

| Field | Meaning |
|---|---|
| `version`, `configVersion`, `meta` | Engine version, map name, and `meta` (status, policyId, approvedAt, configHash, normalization) |
| `active` | `false` when the map was refused (unknown normalization, missing meta) |
| `reveal(element)`, `rescan()` | Reveal one masked value (if allowed); scan the whole page again |
| `stats()` | `initialScanMs`, `initialScanBusyMs`, `longestSliceMs`, `lastBatchMs`, `batches`, `fullScans`, `routeChanges`, `maskedTargets`, `deferredSlices`, `inputMaskMode`, `veilsLifted` |

## 5. Elements the SDK cannot hide (V1)

`<input>` types other than text, search, tel, email, number and url; `<select>`; editable rich-text areas.
When a rule matches one of them the SDK logs one console warning per element (`not supported in V1, the value stays
visible`), leaves it unchanged and does not count it in `DamDDM.stats().maskedTargets`.
Password and hidden inputs are skipped silently (the browser already hides them).
Date inputs (`type="date"`) are in this group; blur or transparent treatments are planned for V1.1.

## 6. Metadata, hash, status

`meta.configHash` is `"sha256:"` plus the lowercase hex SHA-256 of the UTF-8 text produced by `ddmCanonicalJson`
over the whole payload with the key `meta.configHash` removed.

Canonical JSON: object keys sorted in ascending order of their UTF-16 code units (the same as code point order for
every BMP character), no whitespace, arrays keep their order, strings and numbers as `JSON.stringify` writes them.

```js
function ddmCanonicalJson(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(ddmCanonicalJson).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + ddmCanonicalJson(v[k])).join(',') + '}';
}
```

Test vector: `{"b":[1,{"z":1,"a":2}],"a":"x","c":null,"d":true}` becomes
`{"a":"x","b":[1,{"a":2,"z":1}],"c":null,"d":true}`, whose SHA-256 is
`7374bc2af2c1c4b66a41392043e68967ed46cc29191eba4b60ae844027eee0c2`.

The hash must not depend on the build time. `approvedAt` comes from the approval record, not from the clock.
The SDK does not verify the hash: it is in the same file as the data, so it proves nothing against someone who
edits the file. Integrity is the SRI `integrity` attribute on the script tag.

`window.DamDDM.meta` (frozen) exposes `configVersion`, `status`, `policyId`, `approvedAt`, `configHash` and
`normalization` for support. If `status` is not `APPROVED` the SDK logs a console warning and keeps running.
Production builds must be `APPROVED`: the backend must refuse to publish anything else.

## 7. Reveal

`defaults.revealable` is `true` unless the source says otherwise, and a PII can override it. There are no roles:
anyone can reveal a revealable value. It is masked again after `defaults.revealTimeoutMs` (10 seconds by default).
This is a convenience, not an access control.

## 7b. Build-time checks (v5.2 rules 5, 14, 15, 23, 24)

The compiler refuses (error, nothing written) or warns. The Admin UI should show both.

| Check | Result |
|---|---|
| Any key the format doesn't define (typos such as `page`, `tableID`, `lookupText`, `showLst`) | Error naming the key, with "did you mean …?" when it is close to a real one |
| `maskEverywhere`, `type` | Error: no longer an option (v5.2 rule 5) |
| A list written as text (`"lookupTexts": "aadhaar"`), a missing `pages` or `rules` on a page group | Error |
| `source`, `approvedBy`, `approvedAt` on rules and exclusions, `approvedBy` in `meta` (v5.2 rule 19) | Accepted for record keeping; not copied into the browser payload |
| No lookup keys at all, or no masking rules (v5.2 rule 23) | Error: the map would mask nothing |
| A PII with a masking rule but no lookup mapping | Warning: it is never masked |
| A field with role/channel conditions (Part 1 `rules`, v5.2 rule 15) | Warning; the field is compiled as **not revealable** (the browser can't check roles, so access is never widened). With `revealable: true` as well: error |
| A letter or digit as mask character (v5.2 rule 14) | Warning: a masked value can't be told from a real one |
| A keyword shorter than 3 characters after clean-up (v5.2 rule 6) | Warning: it is matched only exactly as written |
| A parent exclusion on every page, or on a root-like id (`root`, `app`, `app-root`, `__next`, `__nuxt`, `main`, `body`, `content`, `wrapper`, `container`, `page`, `layout`) (v5.2 rule 24) | Warning: everything inside stays visible |
| A page exclusion | Warning: all values of that PII are visible on that page |

`ddm-check.js` repeats the checks that can be made on a compiled map (no lookup keys, unused PII, mask character,
broad parent exclusions, broad-before-specific page order), so the standalone build reports them for hand-edited maps.

## 8. Admin UI wording (decided)

- Page field help: "Matches this page and everything below it. `/profile` matches `/profile` and `/profile/edit`, not
  `/profile-settings` or `/profileadmin`. A trailing `*` means the same. A `*` inside the path is not supported yet."
- Exclusion warning (shown when a page exclusion is added): "Excluding `<PII>` on `<page>` makes all its values visible on
  that page: labels, fields, columns and text."
- Scoped exclusions are not offered in V1.

The compiler returns the same warnings as text, so the Admin UI can show them:

- `"/profile*" is matched as the exact prefix "/profile": it matches /profile and /profile/..., not /profile-settings or /profileadmin`
- `excluding AADHAAR on /support makes ALL its values (labels, fields, columns, text) visible on that page`

## 9. Known limitations

- Percent-encoded paths (`/pro%66ile`) are not decoded. Browsers report them as written.
- Page rules cannot contain a wildcard inside the path.
- `INLINE` applies only to text that starts with a matching label (norm-2) followed by a colon within the first
  60 characters. `Please link your Aadhaar to PAN` and `Note: link your Aadhaar` are not touched. It then masks everything
  after the colon with no value-pattern check, which fails closed on format (spaces, dashes or none all work) but also
  masks help text like `Aadhaar: enter 12 digits`.
- If the text of an element referenced by `aria-labelledby` changes after load, the element it labels is not
  evaluated again until the next full scan (route change or `DamDDM.rescan()`).
- `CLASS` matching is only as stable as the application's class names (CSS modules often generate new ones per release).
- Angular's `formcontrolname` is only present when the template sets a fixed name.
- `ELEMENT_ID`, `NAME` and similar look at the live DOM: the original value stays in application state and network traffic.
- An excluded element inside a masked table column is still masked: exclusions are checked per table, not per cell
  (fails safe; accepted for performance).
- A container that receives an excluded id after load keeps its contents masked until the next route change or
  `DamDDM.rescan()` (fails safe; accepted).
- Content inside shadow DOM components and iframes is not watched.
- Browsers without the Navigation API rely on the History API signals, which every mainstream router uses.
