// Generated from the design canvas "Data Masking Redesign" (DDMRules.dc.html) by dc2jsx.py.
// Markup and logic are connected to the in-browser V12 compiler and localStorage store.
import React from 'react';
import { css, route } from '../lib/dc.js';
import Sidebar from '../components/Sidebar.jsx';
import { loadStore, saveStore } from '../lib/store.js';
import { KINDS, SAMPLE_FIELDS, SAMPLE_PAGES } from '../lib/catalog.js';
import { toMappingSource } from '../lib/toMappingSource.js';
import { previewCompile } from '../lib/buildSdk.js';

const KIND_ORDER = ['aadhaar', 'pan', 'mobile', 'email', 'name', 'dob', 'bank'];
const SCOPES = [
  ['all', 'Every page', 'Recommended for common data'],
  ['except', 'Every page except some', 'Show the real value on a few pages'],
  ['only', 'Only some pages', 'Hide it where it is needed']
];
class Design extends React.Component {
  constructor(props) {
    super(props);
    const stored = loadStore();
    const pages = stored.pages || SAMPLE_PAGES;
    const fields = stored.fields || SAMPLE_FIELDS;
    const stage = props.initial?.stage || stored.stage || 'draft';
    const reviewer = stored.reviewer || 'priya';
    const changes = stored.changes !== undefined ? stored.changes : 3;
    this.state = {
      view: 'field',
      q: '', where: 'any', pq: '', pg: pages[0]?.id || 'p1',
      addingPage: false, newPath: '',
      changes, stage, reviewer, note: stored.note || '', subOpen: false, pubTried: false,
      undo: null,
      pages,
      fields,
      modal: null
    };
  }

  renderVals() {
    const s = this.state;
    const set = (o) => this.setState(o);
    // A rule is ready when it has at least one word to look for (V1 is map-based: no value detection).
    const pages = s.pages, fields = s.fields.map((f) => ({ ...f, ok: f.words.length > 0 }));
    const P = (id) => pages.find((p) => p.id === id);
    const pathOf = (id) => (P(id) || {}).path || '';
    const K = (f) => KINDS[f.kind];
    const shows = (f) => { const st = K(f).styles.find((x) => x[0] === f.style) || K(f).styles[0]; return st[2]; };
    const isGlobal = (f) => f.scope === 'all' || f.scope === 'except';
    const maskedOn = (f, pid) => f.scope === 'all' ? true : f.scope === 'except' ? !f.pages.includes(pid) : f.pages.includes(pid);
    const snap = (label) => ({ label, fields, pages, changes: s.changes, pg: s.pg });
    const locked = s.stage !== 'draft';
    const G = (fn) => locked ? () => {} : fn;
    const bump = (o) => {
      const nextChanges = s.changes + 1;
      const next = { ...o, changes: nextChanges };
      saveStore({ fields: next.fields || fields, pages: next.pages || pages, changes: nextChanges });
      set(next);
    };
    const REVIEWERS = { priya: 'Priya Shah', arjun: 'Arjun Mehta' };

    // ---------- modal openers ----------
    const openFor = (f) => locked ? null : set({ modal: { mode: 'edit', id: f.id, kind: f.kind, words: f.words.slice(), style: f.style, scope: f.scope, pages: f.pages.slice(), reveal: f.reveal, fix: !f.ok }, pubTried: false });
    const firstFreeKind = () => KIND_ORDER.find((k) => !fields.some((f) => f.kind === k)) || 'bank';
    const openAdd = (scope, pid) => {
      if (locked) return;
      const kind = firstFreeKind();
      set({ modal: { mode: 'add', kind, words: KINDS[kind].suggest.slice(0, 3), style: KINDS[kind].styles[0][0], scope: scope || 'all', pages: pid ? [pid] : [], reveal: false } });
    };

    // ---------- status + issues ----------
    const broken = fields.filter((f) => !f.ok);
    const issues = broken.map((f) => ({
      name: K(f).name,
      short: K(f).name.split(' ')[0],
      where: f.scope === 'only' ? f.pages.map(pathOf).join(', ') : 'every page',
      note: s.pubTried ? 'Add a word to submit for review.' : 'You can submit for review once it has a word. Until then, real values would still show on these pages.',
      cls: s.pubTried ? 'alert loud' : 'alert',
      fix: () => openFor(f)
    }));
    const reviewerName = REVIEWERS[s.reviewer];
    const statusLabel = s.stage === 'review' ? 'In review' : 'Draft · ' + s.changes + (s.changes === 1 ? ' change' : ' changes') + ' since v1.2';
    const statusCls = s.stage === 'review' ? 'st-info' : 'st-review';
    const STEP_DEFS = [
      ['SDK details', 'dam.bank.internal'],
      ['Rules and page map', fields.length + ' rules · ' + pages.length + ' pages'],
      ['Review', s.stage === 'review' ? 'Waiting for ' + reviewerName : 'Not submitted yet'],
      ['Build and download', 'After approval']
    ];
    const curStep = s.stage === 'review' ? 2 : 1;
    const steps = STEP_DEFS.map(([label, sub], i) => {
      const st = i < curStep ? 'done' : i === curStep ? 'cur' : 'todo';
      return { n: i + 1, label, sub, done: st === 'done', num: st !== 'done', cur: st === 'cur', line: i < STEP_DEFS.length - 1,
        cls: 'stp ' + st + (i === STEP_DEFS.length - 1 ? ' last' : ''), cCls: 'stc ' + st };
    });

    // ---------- submit for review ----------
    const drafts = fields.filter((f) => f.draft);
    const scopeOf = (f) => {
      const pp = f.pages.map(pathOf).filter(Boolean);
      if (f.scope === 'all' || (f.scope === 'except' && !pp.length)) return ['Every page', 'sc-all'];
      if (f.scope === 'except') return ['Every page except ' + pp.length, 'sc-except'];
      return pp.length ? ['Only ' + pp.length + (pp.length === 1 ? ' page' : ' pages'), 'sc-only'] : ['Not on any page', 'sc-none'];
    };
    const sub = {
      stats: [['Rules', fields.length], ['Pages mapped', pages.filter((p) => p.on).length + ' of ' + pages.length], ['Changes', s.changes]].map(([label, value], i) => ({ label, value, cls: i === 0 ? 'stat first' : 'stat' })),
      changes: drafts.map((f) => { const sc = scopeOf(f); return { tag: f.draft === 'new' ? 'New' : 'Edited', cls: f.draft === 'new' ? 'st-info' : 'st-review', name: K(f).name, scLabel: sc[0], scCls: sc[1] }; }),
      checks: [
        ...(broken.length ? broken.map((f) => ({ label: K(f).name + ' has no words to look for', ok: false, fix: () => set({ subOpen: false, modal: { mode: 'edit', id: f.id, kind: f.kind, words: f.words.slice(), style: f.style, scope: f.scope, pages: f.pages.slice(), reveal: f.reveal, fix: true } }) })) : [{ label: 'Every rule looks for at least one word', ok: true }]),
        { label: 'Every mapped page has a path', ok: pages.every((p) => p.path) }
      ].map((c) => ({ ...c, bad: !c.ok, fix: c.fix || (() => {}), bg: c.ok ? '#E3F5EA' : '#FDE7E4', fg: c.ok ? '#166534' : '#A12218', text: c.ok ? '#3B4050' : '#A12218' })),
      reviewers: Object.keys(REVIEWERS).map((k) => ({ value: k, label: REVIEWERS[k] + (k === 'priya' ? ' · Security' : ' · Compliance'), sel: s.reviewer === k })),
      onReviewer: (e) => set({ reviewer: e.target.value }),
      note: s.note, onNote: (e) => set({ note: e.target.value }),
      can: broken.length === 0, cant: broken.length > 0,
      foot: broken.length ? 'Fix the failed check to submit.' : 'Rules are locked while they are in review.'
    };

    // ---------- tabs ----------
    const tabs = [['field', 'Rules', fields.length], ['page', 'Page map', pages.length]].map(([k, label, count]) => ({
      label, count, selected: s.view === k, cls: s.view === k ? 'tab on' : 'tab', pick: () => set({ view: k })
    }));

    // ---------- by field ----------
    const q = s.q.trim().toLowerCase();
    const whereMatch = (f) => s.where === 'any' || f.scope === s.where;
    const visible = fields.filter((f) => whereMatch(f) && (!q || K(f).name.toLowerCase().includes(q) || K(f).code.toLowerCase().includes(q) || f.words.join(' ').toLowerCase().includes(q)));
    const frows = visible.map((f) => {
      const k = K(f);
      const pp = f.pages.map(pathOf).filter(Boolean);
      let scLabel, scCls, scPrefix = '';
      if (f.scope === 'all') { scLabel = 'Every page'; scCls = 'sc-all'; }
      else if (f.scope === 'except') {
        if (pp.length) { scLabel = 'Every page except ' + pp.length; scCls = 'sc-except'; scPrefix = 'Shown on'; }
        else { scLabel = 'Every page'; scCls = 'sc-all'; }
      } else {
        if (pp.length) { scLabel = 'Only ' + pp.length + (pp.length === 1 ? ' page' : ' pages'); scCls = 'sc-only'; scPrefix = ''; }
        else { scLabel = 'Not on any page'; scCls = 'sc-none'; }
      }
      return {
        name: k.name, code: k.code, tile: k.tile,
        tileCls: f.ok ? 'tile' : 'tile bad',
        rowCls: f.ok ? 'fgrid body' : 'fgrid body bad',
        isDraft: !!f.draft, draftLabel: f.draft === 'new' ? 'New' : 'Edited', draftCls: f.draft === 'new' ? 'st-info' : 'st-review',
        chips: f.words.slice(0, 3), hasMore: f.words.length > 3, more: f.words.length - 3, allWords: f.words.join(', '),
        ok: f.ok, bad: !f.ok, sample: k.sample, masked: shows(f), reveal: f.reveal,
        scLabel, scCls, scPrefix, scPages: pp, hasScPages: pp.length > 0,
        canEdit: !locked, locked,
        edit: () => openFor(f), editWhere: () => openFor(f),
        del: () => locked ? null : set({ fields: fields.filter((x) => x.id !== f.id), undo: snap('Removed ' + k.name), changes: s.changes + 1 })
      };
    });
    const whereOpts = [['any', 'All'], ['all', 'Every page'], ['except', 'With exceptions'], ['only', 'Some pages']].map(([k, label]) => ({
      label, on: s.where === k, cls: s.where === k ? 'seg on' : 'seg', pick: () => set({ where: k })
    }));

    // ---------- by page ----------
    const pqv = s.pq.trim().toLowerCase();
    const plist = pages.filter((p) => !pqv || p.path.toLowerCase().includes(pqv)).map((p) => {
      const added = fields.filter((f) => f.scope === 'only' && f.pages.includes(p.id));
      const off = fields.filter((f) => f.scope === 'except' && f.pages.includes(p.id));
      const parts = [];
      if (added.length) parts.push(added.length + ' added');
      if (off.length) parts.push(off.length + ' turned off');
      return {
        path: p.path, on: s.pg === p.id,
        cls: s.pg === p.id ? 'pitem on' : 'pitem',
        dotCls: p.on ? 'live' : 'off',
        sub: !p.on ? 'Masking off' : parts.length ? parts.join(' · ') : 'Every-page fields only',
        hasIssue: p.on && added.some((f) => !f.ok),
        pick: () => set({ pg: p.id })
      };
    });
    const cp = P(s.pg) || pages[0];
    let cur = {};
    if (cp) {
      const globals = fields.filter(isGlobal);
      const locals = fields.filter((f) => f.scope === 'only' && f.pages.includes(cp.id));
      const gOn = globals.filter((f) => maskedOn(f, cp.id));
      const maskCount = gOn.length + locals.filter((f) => f.ok).length;
      const shown = globals.length - gOn.length;
      cur = {
        path: cp.path, match: cp.match, on: cp.on, off: !cp.on, swCls: (cp.on ? 'on' : '') + (locked ? ' locked' : ''), canEdit: !locked,
        toggle: G(() => bump({ pages: pages.map((p) => p.id === cp.id ? { ...p, on: !p.on } : p) })),
        del: G(() => {
          const rest = pages.filter((p) => p.id !== cp.id);
          set({
            pages: rest,
            fields: fields.map((f) => ({ ...f, pages: f.pages.filter((x) => x !== cp.id) })).map((f) => f.scope === 'except' && !f.pages.length ? { ...f, scope: 'all' } : f),
            pg: rest.length ? rest[0].id : null,
            undo: snap('Removed ' + cp.path), changes: s.changes + 1
          });
        }),
        maskCount, maskWord: maskCount === 1 ? 'field is' : 'fields are',
        shownText: shown ? shown + (shown === 1 ? ' every-page field shows its real value here.' : ' every-page fields show their real value here.') : '',
        gOnText: gOn.length + ' of ' + globals.length + ' on',
        globals: globals.map((f) => {
          const on = maskedOn(f, cp.id);
          return {
            name: K(f).name, tile: K(f).tile, words: f.words.join(', '), masked: shows(f), on,
            swCls: (on ? 'on' : '') + (locked ? ' locked' : ''), rowCls: on ? 'prow' : 'prow muted',
            state: on ? 'Hidden' : 'Real value shown',
            toggle: G(() => {
              let nf;
              if (on) nf = { ...f, scope: 'except', pages: f.scope === 'except' ? [...f.pages, cp.id] : [cp.id] };
              else { const rest = f.pages.filter((x) => x !== cp.id); nf = { ...f, pages: rest, scope: rest.length ? 'except' : 'all' }; }
              nf.draft = f.draft === 'new' ? 'new' : 'edited';
              bump({ fields: fields.map((x) => x.id === f.id ? nf : x) });
            })
          };
        }),
        locals: locals.map((f) => {
          const others = f.pages.filter((x) => x !== cp.id).length;
          return {
            name: K(f).name, tile: K(f).tile, tileCls: f.ok ? 'tile' : 'tile bad', words: f.words.join(', '), masked: shows(f),
            ok: f.ok, bad: !f.ok, canEdit: !locked,
            alsoText: others ? 'Also on ' + others + (others === 1 ? ' other page' : ' other pages') : 'This page only',
            edit: () => openFor(f),
            remove: G(() => set({ fields: fields.map((x) => x.id === f.id ? { ...x, pages: x.pages.filter((y) => y !== cp.id), draft: x.draft === 'new' ? 'new' : 'edited' } : x), undo: snap('Removed ' + K(f).name + ' from ' + cp.path), changes: s.changes + 1 }))
          };
        }),
        noLocals: locals.length === 0,
        addLocal: () => openAdd('only', cp.id)
      };
    }

    // ---------- modal ----------
    const md = s.modal;
    let m = {};
    if (md) {
      const k = KINDS[md.kind];
      const setM = (o) => set({ modal: { ...md, ...o } });
      const st = k.styles.find((x) => x[0] === md.style) || k.styles[0];
      const tmp = { scope: md.scope, pages: md.pages };
      const cover = pages.map((p) => {
        const masked = p.on && maskedOn(tmp, p.id);
        return {
          path: p.path, masked, shown: !masked,
          state: !p.on ? 'Masking off' : masked ? 'Hidden' : 'Real value',
          bg: masked ? '#E3F5EA' : '#EEF0F5', fg: masked ? '#166534' : '#6B7080'
        };
      });
      const nMasked = cover.filter((c) => c.masked).length;
      const editing = md.mode === 'edit';
      const needPages = md.scope !== 'all';
      const canSave = md.words.length > 0 && !(md.scope === 'only' && md.pages.length === 0);
      const save = () => {
        if (!canSave) return;
        const base = { kind: md.kind, words: md.words, style: md.style, scope: md.scope === 'except' && !md.pages.length ? 'all' : md.scope, pages: md.scope === 'all' ? [] : md.pages, reveal: md.reveal, ok: true };
        if (editing) {
          bump({ modal: null, pubTried: false, fields: fields.map((f) => f.id === md.id ? { ...f, ...base, draft: f.draft === 'new' ? 'new' : 'edited' } : f) });
        } else {
          bump({ modal: null, fields: [...fields, { id: 'f' + Date.now(), ...base, draft: 'new' }] });
        }
      };
      const appliesText = md.scope === 'all' ? 'Every page'
        : md.scope === 'except' ? (md.pages.length ? 'Every page except ' + md.pages.map(pathOf).join(', ') : 'Every page')
        : (md.pages.length ? md.pages.map(pathOf).join(', ') : 'No pages yet');
      const previewRows = md.kind === 'name'
        ? [{ k: 'Full name', v: st[2], cls: 'mono hl' }, { k: 'Customer ID', v: 'CUST-20931' }, { k: 'City', v: 'Pune' }]
        : [{ k: 'Name', v: 'Rahul Verma' }, { k: k.name.replace(' number', '').replace(' address', ''), v: st[2], cls: 'hl' }, { k: 'City', v: 'Pune' }];
      m = {
        title: editing ? (md.fix ? 'Set up ' + k.name : 'Edit ' + k.name) : 'Add rule',
        cta: editing ? (md.fix ? 'Set up rule' : 'Save changes') : 'Add rule',
        kinds: KIND_ORDER.map((key) => ({ value: key, label: KINDS[key].name, sel: key === md.kind })),
        onKind: (e) => { const nk = e.target.value; setM({ kind: nk, words: KINDS[nk].suggest.slice(0, 3), style: KINDS[nk].styles[0][0] }); },
        rule: k.rule, code: k.code, sample: k.sample,
        styles: k.styles.map(([key, label, example]) => ({ label, example, on: md.style === key, cls: md.style === key ? 'styl on' : 'styl', pick: () => setM({ style: key }) })),
        words: md.words.map((w) => ({ label: w, remove: () => setM({ words: md.words.filter((x) => x !== w) }) })),
        onWordKey: (e) => {
          if (e.key !== 'Enter' && e.key !== ',') return;
          if (e.preventDefault) e.preventDefault();
          const v = (e.target.value || '').trim().replace(/,$/, '');
          if (e.target) e.target.value = '';
          if (v && !md.words.includes(v)) setM({ words: [...md.words, v] });
        },
        wordPh: md.words.length ? 'Type a word' : 'e.g. ' + k.suggest[0],
        suggest: k.suggest.filter((w) => !md.words.includes(w)).map((w) => ({ label: w, add: () => setM({ words: [...md.words, w] }) })),
        hasSuggest: k.suggest.some((w) => !md.words.includes(w)),
        noWords: md.words.length === 0,
        wordCount: md.words.length === 1 ? '1 word' : md.words.length + ' words',
        scopes: SCOPES.map(([key, label, desc]) => ({ label, desc, on: md.scope === key, cls: md.scope === key ? 'opt on' : 'opt', pick: () => setM({ scope: key, pages: key === md.scope ? md.pages : [] }) })),
        needPages,
        pagesTitle: md.scope === 'except' ? 'Show the real value on these pages' : 'Hide it on these pages',
        pagesCount: md.pages.length + ' of ' + pages.length + ' selected',
        pageOpts: pages.map((p) => {
          const checked = md.pages.includes(p.id);
          return {
            path: p.path, checked, cls: checked ? 'pck on' : 'pck',
            sub: !p.on ? 'Masking is off on this page' : p.match,
            toggle: () => setM({ pages: checked ? md.pages.filter((x) => x !== p.id) : [...md.pages, p.id] })
          };
        }),
        reveal: md.reveal, revealCls: md.reveal ? 'on' : '', toggleReveal: () => setM({ reveal: !md.reveal }),
        preview: previewRows.map((r) => ({ k: r.k, v: r.v, cls: r.cls ? 'mono pvhl' : '' })),
        cover, coverText: 'Hidden on ' + nMasked + ' of ' + pages.length,
        appliesText,
        canSave, cantSave: !canSave,
        why: md.words.length === 0 ? 'Add at least one word first' : 'Pick at least one page',
        save
      };
    }

    return {
      statusLabel, statusCls, issues, steps, reviewerName,
      isDraft: s.stage === 'draft', isReview: s.stage === 'review', unlocked: !locked,
      openSubmit: () => broken.length ? set({ pubTried: true, subOpen: true }) : set({ subOpen: true }),
      closeSubmit: () => set({ subOpen: false }),
      subOpen: s.subOpen, sub,
      submit: () => {
        if (broken.length) return;
        saveStore({ stage: 'review', fields, pages, changes: s.changes, reviewer: s.reviewer, note: s.note });
        set({ stage: 'review', subOpen: false, undo: null, modal: null });
      },
      withdraw: () => {
        saveStore({ stage: 'draft' });
        set({ stage: 'draft' });
      },
      tabs, isField: s.view === 'field', isPage: s.view === 'page',
      q: s.q, onQ: (e) => set({ q: e.target.value }), whereOpts, frows, fEmpty: frows.length === 0,
      resetF: () => set({ q: '', where: 'any' }),
      openAdd: () => openAdd('all'),
      pq: s.pq, onPq: (e) => set({ pq: e.target.value }), plist, pEmpty: plist.length === 0,
      addingPage: s.addingPage, newPath: s.newPath,
      startAddPage: G(() => set({ addingPage: true })),
      cancelAddPage: () => set({ addingPage: false, newPath: '' }),
      onNewPath: (e) => set({ newPath: e.target.value }),
      saveAddPage: () => {
        let path = (s.newPath || '').trim() || '/accounts';
        if (path[0] !== '/') path = '/' + path;
        const id = 'p' + Date.now();
        bump({ pages: [...pages, { id, path, match: 'Page and below', on: true }], pg: id, addingPage: false, newPath: '' });
      },
      hasPage: !!cp, noPage: !cp, cur,
      hasUndo: !!s.undo, undoLabel: s.undo ? s.undo.label : '',
      undo: () => set({ fields: s.undo.fields, pages: s.undo.pages, changes: s.undo.changes, pg: s.undo.pg, undo: null }),
      clearUndo: () => set({ undo: null }),
      mOpen: !!md, m,
      closeModal: () => set({ modal: null })
    };
  }

  render() {
    const V = this.renderVals();
    return (<div style={css("position: relative; display: flex; flex-wrap: wrap; align-items: stretch; gap: 12px; padding: 12px; box-sizing: border-box; min-height: 1120px; background: #F4F5F9")}><Sidebar /><main style={css("flex: 999 1 560px; min-width: 0; background: #fff; border: 1px solid #E7E9F0; border-radius: 20px; box-sizing: border-box")}><header style={css("display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 28px; border-bottom: 1px solid #EEF0F5")}><nav aria-label="Breadcrumb" style={css("display: flex; align-items: center; gap: 8px; font-size: 14px; color: #6B7080")}><span>{"PET"}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg><a href={route("SDKList.dc.html")} style={css("color: #6B7080")}>{"JavaScript SDKs"}</a><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg><span style={css("color: #12141C; font-weight: 500")}>{"DAM Portal SDK"}</span></nav><div style={css("display: flex; align-items: center; gap: 10px")}><a href={route("#")} className="btn" style={css("display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 500; color: #12141C; box-sizing: border-box")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"></path><path d="M14 3v5h5M10 13h6M10 17h6"></path></svg>{" Audit logs "}</a><button type="button" className="iconbtn" aria-label="Notifications" style={css("position: relative; width: 38px; height: 38px; border: 1px solid #E1E4EC; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; color: #12141C")}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"></path><path d="M10 21h4"></path></svg></button><div aria-label="Signed in as Yuvraj" style={css("width: 38px; height: 38px; border-radius: 50%; background: #E6EAFE; color: #2B3FB0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600")}>{"YB"}</div></div></header><div style={css("padding: 24px 28px 36px; display: flex; flex-direction: column; gap: 18px")}><div style={css("display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 14px 20px")}><div style={css("display: flex; flex-direction: column; gap: 6px; max-width: 700px")}><div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 10px")}><h1 style={css("margin: 0; font-size: 24px; line-height: 1.2; font-weight: 600; letter-spacing: -0.01em")}>{"DAM Portal SDK"}</h1><span className="tag st-draft mono" style={css("height: 22px; font-size: 12px")}>{"v1.3"}</span><span style={css("font-size: 13.5px; color: #6B7080")}>{"for "}<span className="mono" style={css("color: #3B4050")}>{"dam.bank.internal"}</span></span></div><span style={css("font-size: 14px; line-height: 1.5; color: #6B7080")}>{"Set the masking rules and map them to your app's pages. When they're ready, submit them for review. Once approved, you can build the SDK and download it for your developers."}</span></div><div style={css("display: flex; align-items: center; gap: 10px")}><span className={`pill ${V.statusCls}`}><i></i>{V.statusLabel}</span>{(V.isDraft) ? (<><button type="button" className="primary" onClick={V.openSubmit} style={css("display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 18px; border: 0; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 20 4l-4 16-4-7z"></path><path d="m12 13 8-9"></path></svg>{" Submit for review "}</button></>) : null}{(V.isReview) ? (<><div style={css("display: flex; align-items: center; gap: 10px")}><button type="button" className="btn" onClick={V.withdraw} style={css("height: 42px; padding: 0 16px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 500; color: #12141C")}>{"Withdraw and edit"}</button><a href={route("SDKReview.dc.html")} className="primary" style={css("display: inline-flex; align-items: center; height: 42px; padding: 0 18px; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff; box-sizing: border-box")}>{"View review"}</a></div></>) : null}</div></div><ol aria-label="SDK progress" className="stepper">{(V.steps || []).map((sp, $i1) => (<React.Fragment key={$i1}><li className={sp.cls} aria-current={sp.cur}><span className={sp.cCls} aria-hidden="true">{(sp.done) ? (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg></>) : null}{(sp.num) ? (<>{sp.n}</>) : null}</span><span style={css("display: flex; flex-direction: column; gap: 1px; min-width: 0")}><span className="stl">{sp.label}</span><span style={css("font-size: 12.5px; color: #6B7080; white-space: nowrap")}>{sp.sub}</span></span>{(sp.line) ? (<><span className="stline" aria-hidden="true"></span></>) : null}</li></React.Fragment>))}</ol>{(V.issues || []).map((x, $i2) => (<React.Fragment key={$i2}><div role="alert" className={x.cls}><span style={css("width: 32px; height: 32px; border-radius: 9px; background: #FDE7E4; color: #A12218; display: flex; align-items: center; justify-content: center; flex: none")} aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5M12 16.5h.01"></path></svg></span><div style={css("flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px")}><span style={css("font-size: 14px; color: #12141C")}><b style={css("font-weight: 600")}>{x.name}</b>{" is mapped to "}<span className="mono" style={css("font-size: 13px")}>{x.where}</span>{", but it has no words to look for yet."}</span><span style={css("font-size: 13px; color: #8F2A1F")}>{x.note}</span></div><button type="button" className="dangerbtn" onClick={x.fix} style={css("height: 36px; padding: 0 14px; border: 0; border-radius: 9px; background: #B42318; font-size: 13.5px; font-weight: 500; color: #fff; white-space: nowrap")}>{"Set up "}{x.short}</button></div></React.Fragment>))}{(V.isReview) ? (<><div role="status" style={css("display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid #DCE2FB; border-radius: 14px; background: #F4F6FF")}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4457D6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg><span style={css("flex: 1; font-size: 14px; color: #12141C")}>{"Sent to "}<b style={css("font-weight: 600")}>{V.reviewerName}</b>{" for review. Rules are locked until they approve or ask for changes. Withdraw if you need to edit now."}</span></div></>) : null}<section aria-label="Rules and page map" style={css("border: 1px solid #E7E9F0; border-radius: 16px; background: #fff")}><div style={css("display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 0 20px; border-bottom: 1px solid #EEF0F5")}><div role="tablist" aria-label="View rules" style={css("display: flex; align-items: center")}>{(V.tabs || []).map((t, $i3) => (<React.Fragment key={$i3}><button type="button" role="tab" aria-selected={t.selected} className={t.cls} onClick={t.pick}>{t.label}<span className="n">{t.count}</span></button></React.Fragment>))}</div>{(V.isField) ? (<><div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 0")}><label style={css("position: relative; display: flex; align-items: center")}><span style={css("position: absolute; left: 11px; display: flex; color: #6B7080")} aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg></span><input type="search" value={V.q} onChange={V.onQ} placeholder="Search rules or words" aria-label="Search rules" style={css("width: 210px; height: 36px; padding: 0 12px 0 33px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 13.5px; color: #12141C; box-sizing: border-box")} /></label><div role="group" aria-label="Filter by where it is masked" className="segwrap">{(V.whereOpts || []).map((w, $i4) => (<React.Fragment key={$i4}><button type="button" className={w.cls} aria-pressed={w.on} onClick={w.pick}>{w.label}</button></React.Fragment>))}</div>{(V.unlocked) ? (<><button type="button" className="primary" onClick={V.openAdd} style={css("display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border: 0; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff")}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>{" Add rule "}</button></>) : null}</div></>) : null}{(V.isPage) ? (<><span style={css("font-size: 13px; color: #6B7080; padding: 8px 0")}>{"Pick a page to see which rules apply to it."}</span></>) : null}</div>{(V.isField) ? (<><div style={css("overflow-x: auto")}><div style={css("min-width: 1000px")}><div className="fgrid head"><div>{"Rule"}</div><div>{"Looks for these words"}</div><div>{"Shows as"}</div><div>{"Where it is masked"}</div><div style={css("text-align: right")}>{"Actions"}</div></div>{(V.frows || []).map((f, $i5) => (<React.Fragment key={$i5}><div className={f.rowCls}><div style={css("display: flex; align-items: center; gap: 12px; min-width: 0")}><span className={f.tileCls} aria-hidden="true">{f.tile}</span><div style={css("display: flex; flex-direction: column; gap: 3px; min-width: 0")}><div style={css("display: flex; align-items: center; gap: 8px; flex-wrap: wrap")}><span style={css("font-size: 14.5px; font-weight: 600")}>{f.name}</span>{(f.isDraft) ? (<><span className={`tag ${f.draftCls}`}>{f.draftLabel}</span></>) : null}</div><span className="mono" style={css("font-size: 12px; color: #6B7080")}>{f.code}</span></div></div><div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 6px")} title={f.allWords}>{(f.chips || []).map((c, $i6) => (<React.Fragment key={$i6}><span className="chip">{c}</span></React.Fragment>))}{(f.hasMore) ? (<><span style={css("font-size: 12.5px; font-weight: 500; color: #4A4F5E")}>{"+"}{f.more}</span></>) : null}</div><div style={css("display: flex; flex-direction: column; gap: 4px; min-width: 0")}>{(f.ok) ? (<><div className="mono" style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 12.5px")}><span style={css("color: #6B7080")}>{f.sample}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9AA0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="becomes"><path d="M5 12h14M13 6l6 6-6 6"></path></svg><span style={css("color: #2B3FB0; font-weight: 500")}>{f.masked}</span></div>{(f.reveal) ? (<><span style={css("display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #6B7080")}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>{" Users can reveal for 5 s "}</span></>) : null}</>) : null}{(f.bad) ? (<><span style={css("font-size: 13px; font-weight: 500; color: #A12218")}>{"No words yet"}</span><span style={css("font-size: 12px; color: #6B7080")}>{"Real values still show"}</span></>) : null}</div><div style={css("min-width: 0")}><button type="button" className="scope" onClick={f.editWhere} aria-label={`Change where ${f.name} is masked`}><span className={`sc ${f.scCls}`}>{f.scLabel}</span>{(f.hasScPages) ? (<><span style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 12px; color: #6B7080")}>{" "}{f.scPrefix}{" "}{(f.scPages || []).map((sp, $i7) => (<React.Fragment key={$i7}><span className="mono" style={css("color: #3B4050")}>{sp}</span></React.Fragment>))}</span></>) : null}</button></div><div style={css("display: flex; align-items: center; justify-content: flex-end; gap: 4px")}>{(f.canEdit) ? (<>{(f.bad) ? (<><button type="button" className="dangerbtn" onClick={f.edit} style={css("height: 32px; padding: 0 12px; border: 0; border-radius: 8px; background: #B42318; font-size: 13px; font-weight: 500; color: #fff")}>{"Set up"}</button></>) : null}{(f.ok) ? (<><button type="button" className="iconbtn" onClick={f.edit} aria-label={`Edit ${f.name}`} title="Edit" style={css("width: 34px; height: 34px; border: 0; border-radius: 9px; background: none; display: flex; align-items: center; justify-content: center; color: #4A4F5E")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"></path></svg></button></>) : null}<button type="button" className="iconbtn" onClick={f.del} aria-label={`Remove ${f.name}`} title="Remove" style={css("width: 34px; height: 34px; border: 0; border-radius: 9px; background: none; display: flex; align-items: center; justify-content: center; color: #4A4F5E")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"></path></svg></button></>) : null}{(f.locked) ? (<><span title="Locked while in review" style={css("display: flex; color: #9AA0B0; padding-right: 8px")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label="Locked while in review"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg></span></>) : null}</div></div></React.Fragment>))}{(V.fEmpty) ? (<><div style={css("display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 48px 24px; text-align: center")}><span style={css("font-size: 15px; font-weight: 600")}>{"No rules match"}</span><span style={css("font-size: 13.5px; color: #6B7080")}>{"Try another word, or show every field."}</span><button type="button" className="btn" onClick={V.resetF} style={css("margin-top: 8px; height: 34px; padding: 0 14px; border: 1px solid #E1E4EC; border-radius: 9px; background: #fff; font-size: 13.5px; font-weight: 500; color: #12141C")}>{"Show all rules"}</button></div></>) : null}</div></div><div style={css("display: flex; align-items: flex-start; gap: 10px; padding: 14px 20px")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7080" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={css("flex: none; margin-top: 2px")}><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path></svg><p style={css("margin: 0; font-size: 13px; line-height: 1.55; color: #6B7080; text-wrap: pretty")}>{"To apply a rule everywhere except a few pages, click its "}<b style={css("font-weight: 600; color: #3B4050")}>{"Where it is masked"}</b>{" setting and choose "}<b style={css("font-weight: 600; color: #3B4050")}>{"Every page except some"}</b>{". You can also switch it off for one page in "}<b style={css("font-weight: 600; color: #3B4050")}>{"Page map"}</b>{"."}</p></div></>) : null}{(V.isPage) ? (<><div style={css("display: grid; grid-template-columns: 300px minmax(0, 1fr); min-height: 560px")}><aside aria-label="Pages" style={css("display: flex; flex-direction: column; gap: 10px; padding: 16px 14px; border-right: 1px solid #EEF0F5")}><div style={css("display: flex; gap: 8px")}><label style={css("position: relative; flex: 1; display: flex; align-items: center")}><span style={css("position: absolute; left: 11px; display: flex; color: #6B7080")} aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg></span><input type="search" value={V.pq} onChange={V.onPq} placeholder="Search pages" aria-label="Search pages" style={css("width: 100%; height: 36px; padding: 0 10px 0 33px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 13.5px; color: #12141C; box-sizing: border-box")} /></label>{(V.unlocked) ? (<><button type="button" className="btn" onClick={V.startAddPage} aria-label="Add a page" title="Add a page" style={css("width: 36px; height: 36px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; color: #12141C; flex: none")}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg></button></>) : null}</div>{(V.addingPage) ? (<><div style={css("display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid #DCE2FB; border-radius: 12px; background: #F6F8FF")}><label style={css("display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; font-weight: 500; color: #3B4050")}>{" Page path "}<input type="text" className="mono" value={V.newPath} onChange={V.onNewPath} placeholder="/accounts/{id}" aria-label="Page path" style={css("height: 36px; padding: 0 10px; border: 1px solid #E1E4EC; border-radius: 9px; background: #fff; font-size: 13px; color: #12141C; box-sizing: border-box")} /></label><span style={css("font-size: 12px; line-height: 1.45; color: #6B7080")}>{"Use {id} or * for parts that change."}</span><div style={css("display: flex; justify-content: flex-end; gap: 6px")}><button type="button" className="btn" onClick={V.cancelAddPage} style={css("height: 32px; padding: 0 12px; border: 1px solid #E1E4EC; border-radius: 8px; background: #fff; font-size: 13px; font-weight: 500; color: #12141C")}>{"Cancel"}</button><button type="button" className="primary" onClick={V.saveAddPage} style={css("height: 32px; padding: 0 12px; border: 0; border-radius: 8px; background: #4457D6; font-size: 13px; font-weight: 500; color: #fff")}>{"Add page"}</button></div></div></>) : null}<div style={css("display: flex; flex-direction: column; gap: 2px")}>{(V.plist || []).map((p, $i8) => (<React.Fragment key={$i8}><button type="button" className={p.cls} onClick={p.pick} aria-current={p.on}><span className={`dot ${p.dotCls}`} aria-hidden="true"></span><span style={css("flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px")}><span className="mono" style={css("font-size: 13px; font-weight: 500; color: #12141C; overflow-wrap: anywhere")}>{p.path}</span><span style={css("font-size: 12.5px; color: #6B7080")}>{p.sub}</span></span>{(p.hasIssue) ? (<><span className="tag st-high">{"1 issue"}</span></>) : null}</button></React.Fragment>))}{(V.pEmpty) ? (<><span style={css("padding: 16px 12px; font-size: 13px; color: #6B7080")}>{"No pages match."}</span></>) : null}</div></aside><div style={css("display: flex; flex-direction: column; gap: 16px; padding: 18px 22px 22px; min-width: 0")}>{(V.hasPage) ? (<><div style={css("display: flex; flex-direction: column; gap: 16px")}><div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 12px")}><h2 className="mono" style={css("margin: 0; font-size: 19px; font-weight: 500")}>{V.cur.path}</h2><span className="tag st-draft">{V.cur.match}</span><div style={css("flex: 1")}></div><span style={css("font-size: 13.5px; color: #3B4050")}>{"Mask this page"}</span><button type="button" role="switch" aria-checked={V.cur.on} aria-label="Mask this page" className={`sw ${V.cur.swCls}`} onClick={V.cur.toggle}><span className="k"></span></button>{(V.cur.canEdit) ? (<><span style={css("width: 1px; height: 22px; background: #E7E9F0; margin: 0 2px")}></span><button type="button" className="iconbtn" onClick={V.cur.del} aria-label="Remove this page" title="Remove this page" style={css("width: 34px; height: 34px; border: 1px solid #E1E4EC; border-radius: 9px; background: #fff; display: flex; align-items: center; justify-content: center; color: #4A4F5E")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"></path></svg></button></>) : null}</div>{(V.cur.off) ? (<><div style={css("display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 56px 24px; border: 1px dashed #D5D9E3; border-radius: 14px; text-align: center")}><span style={css("font-size: 15px; font-weight: 600")}>{"Masking is off on this page"}</span><span style={css("font-size: 13.5px; line-height: 1.5; color: #6B7080; max-width: 420px")}>{"Every field shows its real value here. Turn masking on to apply your every-page fields."}</span><button type="button" className="btn" onClick={V.cur.toggle} style={css("margin-top: 8px; height: 36px; padding: 0 14px; border: 1px solid #E1E4EC; border-radius: 9px; background: #fff; font-size: 13.5px; font-weight: 500; color: #12141C")}>{"Turn masking on"}</button></div></>) : null}{(V.cur.on) ? (<><div style={css("display: flex; flex-direction: column; gap: 16px")}><div style={css("display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; background: #F4F6FF; font-size: 14px; color: #12141C")}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4457D6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"></path></svg><span>{"On "}<span className="mono" style={css("font-size: 13px")}>{V.cur.path}</span>{", "}<b style={css("font-weight: 600")}>{V.cur.maskCount}</b>{" "}{V.cur.maskWord}{" hidden. "}{V.cur.shownText}</span></div><div style={css("border: 1px solid #E7E9F0; border-radius: 14px; overflow: hidden")}><div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: #FAFBFD")}><div style={css("display: flex; flex-direction: column; gap: 2px")}><span style={css("font-size: 14.5px; font-weight: 600")}>{"Every-page rules"}</span><span style={css("font-size: 13px; color: #6B7080")}>{"On by default. Switch one off to show the real value on this page only."}</span></div><span style={css("font-size: 12.5px; color: #6B7080")}>{V.cur.gOnText}</span></div>{(V.cur.globals || []).map((g, $i9) => (<React.Fragment key={$i9}><div className={g.rowCls}><span className="tile" aria-hidden="true">{g.tile}</span><div className="pname" style={css("display: flex; flex-direction: column; gap: 2px; min-width: 0")}><span style={css("font-size: 14px; font-weight: 600")}>{g.name}</span><span className="mono" style={css("font-size: 12px; color: #6B7080; overflow: hidden; text-overflow: ellipsis; white-space: nowrap")}>{g.words}</span></div><span className="mono pval" style={css("font-size: 12.5px; color: #2B3FB0")}>{g.masked}</span><span style={css("font-size: 12.5px; color: #6B7080; text-align: right")}>{g.state}</span><button type="button" role="switch" aria-checked={g.on} aria-label={`Mask ${g.name} on this page`} className={`sw ${g.swCls}`} onClick={g.toggle}><span className="k"></span></button></div></React.Fragment>))}</div><div style={css("border: 1px solid #E7E9F0; border-radius: 14px; overflow: hidden")}><div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: #FAFBFD")}><div style={css("display: flex; flex-direction: column; gap: 2px")}><span style={css("font-size: 14.5px; font-weight: 600")}>{"Rules only for this page"}</span><span style={css("font-size: 13px; color: #6B7080")}>{"Extra fields hidden here and nowhere else."}</span></div>{(V.cur.canEdit) ? (<><button type="button" className="btn" onClick={V.cur.addLocal} style={css("display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border: 1px solid #E1E4EC; border-radius: 9px; background: #fff; font-size: 13.5px; font-weight: 500; color: #12141C")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>{" Add rule "}</button></>) : null}</div>{(V.cur.locals || []).map((l, $i10) => (<React.Fragment key={$i10}><div className="prow"><span className={l.tileCls} aria-hidden="true">{l.tile}</span><div style={css("display: flex; flex-direction: column; gap: 2px; min-width: 0")}><span style={css("font-size: 14px; font-weight: 600")}>{l.name}</span><span className="mono" style={css("font-size: 12px; color: #6B7080; overflow: hidden; text-overflow: ellipsis; white-space: nowrap")}>{l.words}</span></div><div>{(l.ok) ? (<><span className="mono" style={css("font-size: 12.5px; color: #2B3FB0")}>{l.masked}</span></>) : null}{(l.bad) ? (<><span style={css("font-size: 13px; font-weight: 500; color: #A12218")}>{"No words yet"}</span></>) : null}</div><div style={css("display: flex; justify-content: flex-end")}>{(l.bad) ? (<><button type="button" className="dangerbtn" onClick={l.edit} style={css("height: 30px; padding: 0 12px; border: 0; border-radius: 8px; background: #B42318; font-size: 12.5px; font-weight: 500; color: #fff")}>{"Set up"}</button></>) : null}{(l.ok) ? (<><span style={css("font-size: 12.5px; color: #6B7080")}>{l.alsoText}</span></>) : null}</div><div style={css("display: flex; justify-content: center")}>{(l.canEdit) ? (<><button type="button" className="iconbtn" onClick={l.remove} aria-label={`Stop masking ${l.name} on this page`} title="Remove from this page" style={css("width: 32px; height: 32px; border: 0; border-radius: 8px; background: none; display: flex; align-items: center; justify-content: center; color: #4A4F5E")}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></>) : null}</div></div></React.Fragment>))}{(V.cur.noLocals) ? (<><div style={css("padding: 18px 16px; border-top: 1px solid #EEF0F5; font-size: 13.5px; color: #6B7080")}>{"Nothing extra here. Add a field only if this page shows data the other pages don't."}</div></>) : null}</div></div></>) : null}</div></>) : null}{(V.noPage) ? (<><div style={css("padding: 56px 24px; text-align: center; font-size: 14px; color: #6B7080")}>{"Add a page to give it its own rules."}</div></>) : null}</div></div></>) : null}</section></div></main>{(V.subOpen) ? (<><div style={css("position: absolute; inset: 0; z-index: 30; background: rgba(18,20,28,.34)")}><div onClick={V.closeSubmit} style={css("position: absolute; inset: 0")}></div><section role="dialog" aria-modal="true" aria-label="Submit for review" style={css("position: absolute; top: 72px; left: 50%; transform: translateX(-50%); width: 620px; max-width: calc(100% - 32px); display: flex; flex-direction: column; border-radius: 20px; background: #fff; box-shadow: 0 24px 64px rgba(18,20,28,.24); overflow: hidden")}><div style={css("display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 24px 16px")}><div style={css("display: flex; flex-direction: column; gap: 3px")}><h2 style={css("margin: 0; font-size: 19px; font-weight: 600")}>{"Submit DAM Portal SDK v1.3 for review"}</h2><span style={css("font-size: 14px; line-height: 1.5; color: #6B7080")}>{"A reviewer checks these rules. After they approve, you can build and download the SDK."}</span></div><button type="button" className="iconbtn" onClick={V.closeSubmit} aria-label="Close" style={css("width: 36px; height: 36px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; color: #12141C; flex: none")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></div><div style={css("display: flex; flex-direction: column; gap: 18px; padding: 4px 24px 22px")}><div style={css("display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #E7E9F0; border-radius: 12px")}>{(V.sub.stats || []).map((ss, $i11) => (<React.Fragment key={$i11}><div className={ss.cls}><span style={css("font-size: 12.5px; color: #6B7080")}>{ss.label}</span><span style={css("font-size: 20px; font-weight: 600")}>{ss.value}</span></div></React.Fragment>))}</div><div style={css("display: flex; flex-direction: column; gap: 8px")}><span style={css("font-size: 13.5px; font-weight: 600")}>{"What changed since v1.2"}</span><div style={css("display: flex; flex-direction: column; border: 1px solid #EEF0F5; border-radius: 12px")}>{(V.sub.changes || []).map((ch, $i12) => (<React.Fragment key={$i12}><div style={css("display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #F3F4F8; font-size: 13.5px")}><span className={`tag ${ch.cls}`} style={css("width: 52px; justify-content: center")}>{ch.tag}</span><span style={css("font-weight: 500")}>{ch.name}</span><span style={css("flex: 1")}></span><span className={`sc ${ch.scCls}`}>{ch.scLabel}</span></div></React.Fragment>))}</div></div><div style={css("display: flex; flex-direction: column; gap: 8px")}><span style={css("font-size: 13.5px; font-weight: 600")}>{"Checks"}</span>{(V.sub.checks || []).map((ck, $i13) => (<React.Fragment key={$i13}><div style={css("display: flex; align-items: center; gap: 10px; font-size: 13.5px")}><span style={css(`width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none; background: ${ck.bg}; color: ${ck.fg}`)} aria-hidden="true">{(ck.ok) ? (<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg></>) : null}{(ck.bad) ? (<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 6v8M12 18h.01"></path></svg></>) : null}</span><span style={css(`flex: 1; color: ${ck.text}`)}>{ck.label}</span>{(ck.bad) ? (<><button type="button" className="linkbtn" onClick={ck.fix}>{"Set it up"}</button></>) : null}</div></React.Fragment>))}</div><div style={css("display: grid; grid-template-columns: 1fr 1fr; gap: 12px")}><label style={css("display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 500; color: #3B4050")}>{" Reviewer "}<select onChange={V.sub.onReviewer} style={css("height: 40px; padding: 0 10px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; color: #12141C")} value={((V.sub.reviewers) || []).find((rv) => rv.sel)?.value ?? ""}>{(V.sub.reviewers || []).map((rv, $i14) => (<React.Fragment key={$i14}><option value={rv.value}>{rv.label}</option></React.Fragment>))}</select></label><label style={css("display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 500; color: #3B4050")}>{" Note for the reviewer "}<span style={css("font-weight: 400; color: #6B7080; margin-top: -4px; font-size: 12px")}>{"Optional"}</span><input type="text" value={V.sub.note} onChange={V.sub.onNote} placeholder="e.g. Added DOB and Aadhaar for /profile" style={css("height: 40px; padding: 0 12px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; color: #12141C; box-sizing: border-box; margin-top: -6px")} /></label></div></div><div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 24px; border-top: 1px solid #EEF0F5; background: #FAFBFD")}><span style={css("font-size: 13px; color: #6B7080")}>{V.sub.foot}</span><div style={css("display: flex; gap: 10px")}><button type="button" className="btn" onClick={V.closeSubmit} style={css("height: 42px; padding: 0 16px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 500; color: #12141C")}>{"Cancel"}</button>{(V.sub.can) ? (<><button type="button" className="primary" onClick={V.submit} style={css("height: 42px; padding: 0 20px; border: 0; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff")}>{"Submit for review"}</button></>) : null}{(V.sub.cant) ? (<><button type="button" aria-disabled="true" title="Fix the failed check first" style={css("height: 42px; padding: 0 20px; border: 0; border-radius: 10px; background: #C9CFF3; font-size: 14px; font-weight: 500; color: #fff; cursor: not-allowed")}>{"Submit for review"}</button></>) : null}</div></div></section></div></>) : null}{(V.hasUndo) ? (<><div role="status" style={css("position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 25")}><div className="toast"><span>{V.undoLabel}</span><button type="button" onClick={V.undo} style={css("height: 32px; padding: 0 10px; border: 0; border-radius: 8px; background: rgba(255,255,255,.12); font-size: 13.5px; font-weight: 600; color: #fff")}>{"Undo"}</button><button type="button" onClick={V.clearUndo} aria-label="Dismiss" style={css("width: 30px; height: 30px; border: 0; border-radius: 8px; background: none; color: #B4B9C6; display: flex; align-items: center; justify-content: center")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></div></div></>) : null}{(V.mOpen) ? (<><div style={css("position: absolute; inset: 0; z-index: 30; background: rgba(18,20,28,.34)")}><div onClick={V.closeModal} style={css("position: absolute; inset: 0")}></div><section role="dialog" aria-modal="true" aria-label={V.m.title} style={css("position: absolute; top: 56px; left: 50%; transform: translateX(-50%); width: 1040px; max-width: calc(100% - 32px); display: flex; flex-direction: column; border-radius: 20px; background: #fff; box-shadow: 0 24px 64px rgba(18,20,28,.24); overflow: hidden")}><div style={css("display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 24px 18px; border-bottom: 1px solid #EEF0F5")}><div style={css("display: flex; flex-direction: column; gap: 3px")}><h2 style={css("margin: 0; font-size: 19px; font-weight: 600")}>{V.m.title}</h2><span style={css("font-size: 14px; color: #6B7080")}>{"Three quick questions. Detection and masking are set up for you."}</span></div><button type="button" className="iconbtn" onClick={V.closeModal} aria-label="Close" style={css("width: 36px; height: 36px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; color: #12141C")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></div><div style={css("display: grid; grid-template-columns: minmax(0, 1fr) 330px")}><div style={css("display: flex; flex-direction: column; gap: 26px; padding: 22px 26px 24px")}><div style={css("display: flex; gap: 14px")}><span className="stepn">{"1"}</span><div style={css("flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px")}><label htmlFor="kind" style={css("font-size: 15px; font-weight: 600; padding-top: 3px")}>{"What kind of data is it?"}</label><select id="kind" onChange={V.m.onKind} style={css("height: 42px; padding: 0 12px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14.5px; color: #12141C")} value={((V.m.kinds) || []).find((k) => k.sel)?.value ?? ""}>{(V.m.kinds || []).map((k, $i15) => (<React.Fragment key={$i15}><option value={k.value}>{k.label}</option></React.Fragment>))}</select><span style={css("display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: #3B4050")}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>{" Detects "}{V.m.rule}{" "}</span></div></div><div style={css("display: flex; gap: 14px")}><span className="stepn">{"2"}</span><div style={css("flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px")}><div style={css("display: flex; flex-direction: column; gap: 3px; padding-top: 3px")}><span style={css("font-size: 15px; font-weight: 600")}>{"What does your page call it?"}</span><span style={css("font-size: 13px; line-height: 1.5; color: #6B7080")}>{"Words used in ids, names, classes, column headers or labels. Press Enter after each."}</span></div><div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 44px; padding: 7px 8px; border: 1px solid #B9C2F3; border-radius: 10px; background: #fff; box-shadow: 0 0 0 3px rgba(68,87,214,.08); box-sizing: border-box")}>{(V.m.words || []).map((wd, $i17) => (<React.Fragment key={$i17}><span className="tok">{wd.label}<button type="button" onClick={wd.remove} aria-label={`Remove ${wd.label}`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></span></React.Fragment>))}<input type="text" onKeyDown={V.m.onWordKey} placeholder={V.m.wordPh} aria-label="Add a word" className="mono" style={css("flex: 1; min-width: 160px; height: 28px; border: 0; outline: none; background: none; font-size: 13px; color: #12141C")} /></div>{(V.m.hasSuggest) ? (<><div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 6px")}><span style={css("font-size: 13px; color: #6B7080; margin-right: 2px")}>{"Suggested"}</span>{(V.m.suggest || []).map((sg, $i18) => (<React.Fragment key={$i18}><button type="button" className="sug" onClick={sg.add}>{"+ "}{sg.label}</button></React.Fragment>))}</div></>) : null}{(V.m.noWords) ? (<><span style={css("font-size: 12.5px; color: #8A4B00")}>{"Add at least one word so DDM knows where to look."}</span></>) : null}</div></div><div style={css("display: flex; gap: 14px")}><span className="stepn">{"3"}</span><div style={css("flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px")}><span style={css("font-size: 15px; font-weight: 600; padding-top: 3px")}>{"Where should it be masked?"}</span><div role="radiogroup" aria-label="Where should it be masked" style={css("display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px")}>{(V.m.scopes || []).map((o, $i19) => (<React.Fragment key={$i19}><button type="button" role="radio" aria-checked={o.on} className={o.cls} onClick={o.pick}><span className="radio" aria-hidden="true"></span><span style={css("display: flex; flex-direction: column; gap: 2px")}><span style={css("font-size: 14px; font-weight: 600; color: #12141C")}>{o.label}</span><span style={css("font-size: 12.5px; line-height: 1.4; color: #6B7080")}>{o.desc}</span></span></button></React.Fragment>))}</div>{(V.m.needPages) ? (<><div style={css("display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid #E7E9F0; border-radius: 12px; background: #FAFBFD")}><div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px")}><span style={css("font-size: 13.5px; font-weight: 600")}>{V.m.pagesTitle}</span><span style={css("font-size: 12.5px; color: #6B7080")}>{V.m.pagesCount}</span></div><div style={css("display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px")}>{(V.m.pageOpts || []).map((po, $i20) => (<React.Fragment key={$i20}><label className={po.cls}><input type="checkbox" checked={po.checked} onChange={po.toggle} style={css("width: 16px; height: 16px; margin: 0; accent-color: #4457D6; flex: none")} /><span style={css("display: flex; flex-direction: column; gap: 1px; min-width: 0")}><span className="mono" style={css("font-size: 12.5px; color: #12141C; overflow-wrap: anywhere")}>{po.path}</span><span style={css("font-size: 11.5px; color: #6B7080")}>{po.sub}</span></span></label></React.Fragment>))}</div></div></>) : null}</div></div><div style={css("display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 16px; border-radius: 12px; background: #F7F8FB")}><div style={css("display: flex; flex-direction: column; gap: 2px")}><span style={css("font-size: 14px; font-weight: 500")}>{"Let users click to see the real value for 5 seconds"}</span><span style={css("font-size: 12.5px; color: #6B7080")}>{"Every reveal is recorded in the audit log."}</span></div><button type="button" role="switch" aria-checked={V.m.reveal} aria-label="Let users reveal the real value" className={`sw ${V.m.revealCls}`} onClick={V.m.toggleReveal}><span className="k"></span></button></div></div><aside aria-label="Preview" style={css("display: flex; flex-direction: column; gap: 14px; padding: 22px 22px 24px; background: #F7F8FB; border-left: 1px solid #EEF0F5")}><span style={css("font-size: 13px; font-weight: 600; color: #3B4050")}>{"Preview"}</span><div style={css("display: flex; flex-direction: column; border: 1px solid #E7E9F0; border-radius: 14px; background: #fff; overflow: hidden")}><div style={css("padding: 12px 16px; border-bottom: 1px solid #EEF0F5; font-size: 13.5px; font-weight: 600")}>{"Customer details"}</div>{(V.m.preview || []).map((pv, $i21) => (<React.Fragment key={$i21}><div style={css("display: grid; grid-template-columns: 110px 1fr; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13.5px")}><span style={css("color: #6B7080")}>{pv.k}</span><span className={pv.cls}>{pv.v}</span></div></React.Fragment>))}</div><p style={css("margin: 0; font-size: 12.5px; line-height: 1.55; color: #4A4F5E")}>{"The real value "}<span className="mono">{V.m.sample}</span>{" is hidden wherever one of your "}{V.m.wordCount}{" appears."}</p><div style={css("height: 1px; background: #E7E9F0")}></div><div style={css("display: flex; flex-direction: column; gap: 8px")}><div style={css("display: flex; align-items: center; justify-content: space-between")}><span style={css("font-size: 13px; font-weight: 600; color: #3B4050")}>{"On each page"}</span><span style={css("font-size: 12px; color: #6B7080")}>{V.m.coverText}</span></div>{(V.m.cover || []).map((cv, $i22) => (<React.Fragment key={$i22}><div style={css("display: flex; align-items: center; gap: 8px; font-size: 12.5px")}><span style={css(`width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none; background: ${cv.bg}; color: ${cv.fg}`)} aria-hidden="true">{(cv.masked) ? (<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg></>) : null}{(cv.shown) ? (<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 12h12"></path></svg></>) : null}</span><span className="mono" style={css("flex: 1; min-width: 0; color: #12141C; overflow-wrap: anywhere")}>{cv.path}</span><span style={css("color: #6B7080; white-space: nowrap")}>{cv.state}</span></div></React.Fragment>))}</div><div style={css("flex: 1")}></div><div style={css("display: grid; grid-template-columns: 90px 1fr; gap: 6px; font-size: 12.5px")}><span style={css("color: #6B7080")}>{"Field name"}</span><span className="mono" style={css("color: #12141C")}>{V.m.code}</span><span style={css("color: #6B7080")}>{"Applies to"}</span><span style={css("color: #12141C")}>{V.m.appliesText}</span></div></aside></div><div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 24px; border-top: 1px solid #EEF0F5")}><span style={css("font-size: 13px; color: #6B7080")}>{"Saved to your draft. It reaches the SDK only after review and a new build."}</span><div style={css("display: flex; gap: 10px")}><button type="button" className="btn" onClick={V.closeModal} style={css("height: 42px; padding: 0 16px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 500; color: #12141C")}>{"Cancel"}</button>{(V.m.canSave) ? (<><button type="button" className="primary" onClick={V.m.save} style={css("height: 42px; padding: 0 20px; border: 0; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff")}>{V.m.cta}</button></>) : null}{(V.m.cantSave) ? (<><button type="button" aria-disabled="true" title={V.m.why} style={css("height: 42px; padding: 0 20px; border: 0; border-radius: 10px; background: #C9CFF3; font-size: 14px; font-weight: 500; color: #fff; cursor: not-allowed")}>{V.m.cta}</button></>) : null}</div></div></section></div></>) : null}</div>);
  }
}

// `initial` overrides the design's starting state (the canvas shows each screen in a different state).
export default class RulesPage extends Design {
  constructor(props) {
    super(props);
    if (props.initial) this.state = { ...this.state, ...props.initial };
  }
}
