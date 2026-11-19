// Generated from the design canvas "Data Masking Redesign" (SDKReview.dc.html) by dc2jsx.py.
// Markup and logic are connected to the in-browser V12 compiler (buildSdk.js).
import React from 'react';
import { css, route } from '../lib/dc.js';
import Sidebar from '../components/Sidebar.jsx';
import { loadStore, saveStore } from '../lib/store.js';
import { KINDS, SAMPLE_FIELDS, SAMPLE_PAGES } from '../lib/catalog.js';
import { toMappingSource } from '../lib/toMappingSource.js';
import { buildSdk, readmeFor, readmeMarkdown, download } from '../lib/buildSdk.js';

const BUILD = [
  'Packing rules and the page map',
  'Compiling the SDK (V12 map)',
  'Signing the package (SHA-256 configHash)',
  'Writing the developer README'
];

class Design extends React.Component {
  constructor(props) {
    super(props);
    const stored = loadStore();
    const fields = stored.fields || SAMPLE_FIELDS;
    const pages = stored.pages || SAMPLE_PAGES;
    const stage = props.initial?.stage || (stored.stage && stored.stage !== 'draft' ? stored.stage : 'review');
    const role = props.initial?.role || (stage === 'approved' || stage === 'building' || stage === 'ready' ? 'maker' : 'reviewer');
    this.state = {
      stage,
      role,
      comment: stored.comment || '',
      reminded: false,
      fmt: 'script',
      srcMap: false,
      step: 0,
      downloaded: false,
      copied: false,
      rtab: 'quick',
      build: stored.build || null,
      fields,
      pages,
      reviewer: stored.reviewer || 'priya',
      changes: stored.changes !== undefined ? stored.changes : 3,
      isBuilding: false
    };
  }

  componentDidMount() {
    if (this.state.stage === 'ready' && !this.state.build) {
      this.runBuild();
    }
  }

  async runBuild() {
    const s = this.state;
    const source = toMappingSource({
      fields: s.fields,
      pages: s.pages,
      meta: {
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedBy: s.reviewer === 'arjun' ? 'Arjun Mehta' : 'Priya Shah',
        configVersion: 'dam-portal-1.3.0',
      },
    });
    try {
      const build = await buildSdk(source);
      if (build.ok) {
        saveStore({ build, stage: 'ready' });
        this.setState({ build, stage: 'ready', step: BUILD.length, isBuilding: false });
      } else {
        console.error('Build errors:', build.errors);
        this.setState({ isBuilding: false });
      }
    } catch (e) {
      console.error('Build failed:', e);
      this.setState({ isBuilding: false });
    }
  }

  startBuild() {
    this.setState({ stage: 'building', step: 0, isBuilding: true });
    const tick = (step) => {
      if (step >= BUILD.length) {
        this.runBuild();
        return;
      }
      this.setState({ step });
      setTimeout(() => tick(step + 1), 600);
    };
    setTimeout(() => tick(1), 600);
  }

  renderVals() {
    const s = this.state;
    const set = (o) => this.setState(o);
    const maker = s.role === 'maker';
    const st = s.stage;

    const STEP_DEFS = [
      ['SDK details', 'dam.bank.internal'],
      ['Rules and page map', `${s.fields.length} rules · ${s.pages.length} pages`],
      ['Review', st === 'review' ? (maker ? 'Waiting for Priya Shah' : 'With Priya Shah') : st === 'changes' ? 'Changes requested' : 'Approved by Priya Shah'],
      ['Build and download', st === 'ready' ? 'Ready to download' : st === 'building' ? 'Building…' : st === 'approved' ? 'Ready to build' : 'After approval']
    ];
    const curStep = st === 'review' || st === 'changes' ? 2 : st === 'ready' ? 4 : 3;
    const steps = STEP_DEFS.map(([label, sub], i) => {
      const k = i < curStep ? 'done' : i === curStep ? 'cur' : 'todo';
      return { n: i + 1, label, sub, done: k === 'done', num: k !== 'done', cur: k === 'cur', line: i < 3, cls: 'stp ' + k + (i === 3 ? ' last' : ''), cCls: 'stc ' + k };
    });

    const STATUS = {
      review: ['In review', 'st-info'], changes: ['Changes requested', 'st-high'], approved: ['Approved', 'st-approved'],
      building: ['Building', 'st-info'], ready: ['Ready to download', 'st-approved']
    };
    const INTRO = {
      review: maker ? 'Your rules are with a reviewer. Once they approve, you can build the SDK here.' : 'Yuvraj submitted these rules. Approve them, or ask for changes with a comment.',
      changes: 'The reviewer asked for changes. Edit the rules and submit them again.',
      approved: 'The rules are approved. Build the SDK when you are ready.',
      building: 'Building the SDK from the approved rules.',
      ready: 'Built from the rules Priya Shah approved. Download it and share the README with your developers.'
    };

    const pkgName = s.fmt === 'npm' ? 'dam-portal-ddm-sdk-1.3.0.tgz' : 'ddm-sdk.js';
    const sdkSizeKb = s.build?.files?.['ddm-sdk.js'] ? Math.round(s.build.files['ddm-sdk.js'].length / 1024) : 44;
    const pkgMeta = `${sdkSizeKb} KB · built today at 4:12 PM · engine v${s.build?.engineVersion || '0.4.1'}` + (s.srcMap ? ' · with source map' : '');
    const pct = st === 'ready' ? 100 : Math.round(((s.step + 0.5) / BUILD.length) * 100);

    const hashDisplay = s.build?.configHash
      ? 'SHA-256 ' + s.build.configHash.replace('sha256:', '').slice(0, 4) + '…' + s.build.configHash.slice(-4)
      : 'SHA-256 3f9a…c21e';

    const ruleList = s.fields.map((f) => {
      const k = KINDS[f.kind] || {};
      let scLabel = 'Every page', scCls = 'sc-all';
      if (f.scope === 'except') { scLabel = `Except ${f.pages.length} page${f.pages.length === 1 ? '' : 's'}`; scCls = 'sc-except'; }
      else if (f.scope === 'only') { scLabel = `Only ${f.pages.length} page${f.pages.length === 1 ? '' : 's'}`; scCls = 'sc-only'; }
      return { tile: k.tile || '?', name: k.name || f.kind, scLabel, scCls };
    });

    const defaultChanges = [
      { tag: 'New', cls: 'st-info', name: 'Date of birth', what: 'Looks for dob, dateOfBirth', sample: '14/08/1990', masked: '**/**/1990', scLabel: 'Only 2 pages', scCls: 'sc-only', scPages: '/profile, /customers' },
      { tag: 'New', cls: 'st-info', name: 'Aadhaar number', what: 'Looks for aadhaarNo, Aadhaar', sample: '2345 6789 0123', masked: '**** **** 0123', scLabel: 'Only 1 page', scCls: 'sc-only', scPages: '/profile' },
      { tag: 'Edited', cls: 'st-review', name: 'Mobile number', what: 'Now shown on customer pages', sample: '9876543210', masked: '******3210', scLabel: 'Every page except 1', scCls: 'sc-except', scPages: 'Shown on /customers' }
    ];

    const contents = s.build?.files ? [
      { name: 'ddm-sdk.js', desc: 'Standalone bundle (map + engine)', size: Math.round(s.build.files['ddm-sdk.js'].length / 1024) + ' KB' },
      { name: 'ddm-map.js', desc: 'Approved rules & config map', size: Math.round(s.build.files['ddm-map.js'].length / 1024) + ' KB' },
      { name: 'ddm-engine.js', desc: 'Masking engine v' + s.build.engineVersion, size: Math.round(s.build.files['ddm-engine.js'].length / 1024) + ' KB' },
      { name: 'mapping-source.json', desc: 'Source configuration', size: Math.round(s.build.files['mapping-source.json'].length / 1024) + ' KB' },
      { name: 'README.md', desc: 'Setup guide for developers', size: '2 KB' }
    ] : [
      { name: 'ddm-sdk.js', desc: 'The SDK', size: '44 KB' },
      { name: 'ddm-map.js', desc: 'Your approved rules, signed', size: '3 KB' },
      { name: 'README.md', desc: 'Setup guide for developers', size: '2 KB' },
      { name: 'mapping-source.json', desc: 'Source configuration', size: '4 KB' }
    ];

    const scriptIntegrity = s.build?.integrity?.['ddm-sdk.js'] || 'sha384-P2fK8yQm…Xr7c';
    const mapIntegrity = s.build?.integrity?.['ddm-map.js'] || 'sha384-M4p...';
    const engineIntegrity = s.build?.integrity?.['ddm-engine.js'] || 'sha384-Eng...';

    return {
      intro: INTRO[st], statusLabel: STATUS[st][0], statusCls: STATUS[st][1], steps,
      roles: [['maker', 'Maker'], ['reviewer', 'Reviewer']].map(([k, label]) => ({ label, on: s.role === k, cls: s.role === k ? 'seg on' : 'seg', pick: () => set({ role: k }) })),
      isMaker: maker,
      vWaiting: st === 'review' && maker,
      vReview: st === 'review' && !maker,
      vChanges: st === 'changes',
      vApproved: st === 'approved',
      vBuilding: st === 'building',
      vReady: st === 'ready',
      timeline: [
        { label: 'Submitted by Yuvraj Bhati', sub: 'Today, 3:42 PM · 3 changes since v1.2', cls: 'tli done' },
        { label: 'Review by Priya Shah', sub: s.reminded ? 'Reminder sent just now' : 'Waiting · usually within a day', cls: 'tli cur' },
        { label: 'Build and download', sub: 'Unlocks after approval', cls: 'tli' }
      ],
      remind: () => set({ reminded: true }), remindLabel: s.reminded ? 'Reminder sent' : 'Remind Priya',
      changes: defaultChanges,
      comment: s.comment || 'Keep mobile hidden on /customers too. Call-backs can use the reveal option instead.',
      commentInput: s.comment,
      onComment: (e) => set({ comment: e.target.value }),
      approve: () => {
        saveStore({ stage: 'approved' });
        set({ stage: 'approved', role: 'maker' });
      },
      requestChanges: () => {
        const comment = s.comment || 'Keep mobile hidden on /customers too. Call-backs can use the reveal option instead.';
        saveStore({ stage: 'changes', comment });
        set({ stage: 'changes', comment });
      },
      resetReview: () => {
        saveStore({ stage: 'review' });
        set({ stage: 'review', role: 'reviewer' });
      },
      changesTitle: maker ? 'Priya Shah asked for changes' : 'You asked for changes',
      changesSub: maker ? 'Edit the rules, then submit them for review again.' : 'Yuvraj will get an email with your comment.',
      formats: [
        ['script', 'Script tag', 'For any website. Add one line to your HTML.', 'ddm-sdk.js'],
        ['npm', 'Separate map + engine', 'For decoupled deployments (map and engine separate).', 'ddm-map.js + ddm-engine.js']
      ].map(([k, label, desc, file]) => ({ label, desc, file, on: s.fmt === k, cls: s.fmt === k ? 'opt on' : 'opt', pick: () => set({ fmt: k }) })),
      srcMap: s.srcMap, srcMapCls: s.srcMap ? 'on' : '', toggleSrcMap: () => set({ srcMap: !s.srcMap }),
      build: () => this.startBuild(),
      buildPct: pct + '%',
      buildSteps: BUILD.map((label, i) => ({
        label, done: i < s.step,
        bg: i < s.step ? '#16A34A' : i === s.step ? '#4457D6' : '#D5D9E3',
        color: i <= s.step ? '#12141C' : '#9AA0B0'
      })),
      pkgName,
      pkgMeta,
      hashDisplay,
      download: () => {
        if (s.build?.files?.['ddm-sdk.js']) {
          download('ddm-sdk.js', s.build.files['ddm-sdk.js'], 'application/javascript');
        }
        set({ downloaded: true });
      },
      dlLabel: s.downloaded ? 'Downloaded' : 'Download SDK',
      downloadReadme: () => {
        if (s.build) {
          download('README.md', readmeMarkdown(s.build, s.fmt === 'npm' ? 'two' : 'one', 'DAM Portal SDK'), 'text/markdown');
        }
      },
      copyLink: () => {
        const code = s.build ? readmeFor(s.build, s.fmt === 'npm' ? 'two' : 'one') : '<script src="/vendor/ddm-sdk.js"></script>';
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(code).catch(() => {});
        }
        set({ copied: true });
        setTimeout(() => set({ copied: false }), 2500);
      },
      copyLabel: s.copied ? 'Snippet copied!' : 'Copy link for developers',
      contents,
      rtabs: [['quick', 'Quick start'], ['options', 'Options'], ['check', 'Check it works']].map(([k, label]) => ({ label, on: s.rtab === k, cls: s.rtab === k ? 'tab on' : 'tab', pick: () => set({ rtab: k }) })),
      rQuick: s.rtab === 'quick', rOptions: s.rtab === 'options', rCheck: s.rtab === 'check',
      isScript: s.fmt === 'script', isNpm: s.fmt === 'npm',
      scriptIntegrity,
      mapIntegrity,
      engineIntegrity,
      options: [
        ['window.DAM_DDM_DEBUG = true', 'Enable verbose engine logs in browser devtools console.'],
        ['DamDDM.stats()', 'Inspect total masked elements and dynamic mutation counts.'],
        ['DamDDM.meta', 'Returns { status, configHash, policyId, version }.'],
        ['window.DAM_DDM_CONFIG', 'The frozen V12 configuration map compiled for this application.']
      ].map(([name, desc]) => ({ name, desc })),
      checks: [
        ['Open /profile. The PAN card should show as', 'ABC*****4F'],
        ['In the browser console, run', 'DamDDM.stats()  →  reports active masks'],
        ['Open /login. Nothing is masked there, because masking is off for that page.', '']
      ].map(([text, code], i) => ({ n: i + 1, text, code })),
      ruleList,
      inThisVersionSub: `${ruleList.length} rules \u00b7 ${s.pages.length} pages \u00b7 ${s.changes} changes since v1.2`,
      history: [{ v: 'v1.2', meta: 'Nov 10 · approved by Priya Shah' }, { v: 'v1.1', meta: 'Oct 2 · approved by Arjun Mehta' }]
    };
  }

  render() {
    const V = this.renderVals();
    return (
      <div style={css("position: relative; display: flex; flex-wrap: wrap; align-items: stretch; gap: 12px; padding: 12px; box-sizing: border-box; min-height: 1040px; background: #F4F5F9")}>
        <Sidebar />
        <main style={css("flex: 999 1 560px; min-width: 0; background: #fff; border: 1px solid #E7E9F0; border-radius: 20px; box-sizing: border-box")}>
          <header style={css("display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 28px; border-bottom: 1px solid #EEF0F5")}>
            <nav aria-label="Breadcrumb" style={css("display: flex; align-items: center; gap: 8px; font-size: 14px; color: #6B7080")}>
              <span>{"PET"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
              <a href={route("SDKList.dc.html")} style={css("color: #6B7080")}>{"JavaScript SDKs"}</a>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
              <a href={route("DDMRules.dc.html")} style={css("color: #6B7080")}>{"DAM Portal SDK"}</a>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
              <span style={css("color: #12141C; font-weight: 500")}>{"Review and build"}</span>
            </nav>
            <div style={css("display: flex; align-items: center; gap: 10px")}>
              <a href={route("#")} className="btn" style={css("display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 500; color: #12141C; box-sizing: border-box")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"></path><path d="M14 3v5h5M10 13h6M10 17h6"></path></svg>{" Audit logs "}
              </a>
              <button type="button" className="iconbtn" aria-label="Notifications" style={css("position: relative; width: 38px; height: 38px; border: 1px solid #E1E4EC; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; color: #12141C")}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"></path><path d="M10 21h4"></path></svg>
              </button>
              <div aria-label="Signed in as Yuvraj" style={css("width: 38px; height: 38px; border-radius: 50%; background: #E6EAFE; color: #2B3FB0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600")}>{"YB"}</div>
            </div>
          </header>

          <div style={css("padding: 24px 28px 36px; display: flex; flex-direction: column; gap: 18px")}>
            <div style={css("display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 14px 20px")}>
              <div style={css("display: flex; flex-direction: column; gap: 6px; max-width: 700px")}>
                <div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 10px")}>
                  <h1 style={css("margin: 0; font-size: 24px; line-height: 1.2; font-weight: 600; letter-spacing: -0.01em")}>{"DAM Portal SDK"}</h1>
                  <span className="tag st-draft mono" style={css("height: 22px; font-size: 12px")}>{"v1.3"}</span>
                  <span style={css("font-size: 13.5px; color: #6B7080")}>{"for "}<span className="mono" style={css("color: #3B4050")}>{"dam.bank.internal"}</span></span>
                </div>
                <span style={css("font-size: 14px; line-height: 1.5; color: #6B7080")}>{V.intro}</span>
              </div>
              <div style={css("display: flex; align-items: center; gap: 12px")}>
                <div title="Prototype only: switch who is looking at this page" style={css("display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 10px; border: 1px dashed #C9CEDB; border-radius: 12px")}>
                  <span style={css("font-size: 12px; color: #6B7080")}>{"Prototype \u00b7 view as"}</span>
                  <div role="group" aria-label="View as" className="segwrap" style={css("padding: 2px")}>
                    {(V.roles || []).map((ro, $i1) => (
                      <React.Fragment key={$i1}>
                        <button type="button" className={ro.cls} aria-pressed={ro.on} onClick={ro.pick} style={css("height: 26px; font-size: 12.5px")}>{ro.label}</button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <span className={`pill ${V.statusCls}`}><i></i>{V.statusLabel}</span>
              </div>
            </div>

            <ol aria-label="SDK progress" className="stepper">
              {(V.steps || []).map((sp, $i2) => (
                <React.Fragment key={$i2}>
                  <li className={sp.cls} aria-current={sp.cur}>
                    <span className={sp.cCls} aria-hidden="true">
                      {(sp.done) ? (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg></>) : null}
                      {(sp.num) ? (<>{sp.n}</>) : null}
                    </span>
                    <span style={css("display: flex; flex-direction: column; gap: 1px; min-width: 0")}>
                      <span className="stl">{sp.label}</span>
                      <span style={css("font-size: 12.5px; color: #6B7080; white-space: nowrap")}>{sp.sub}</span>
                    </span>
                    {(sp.line) ? (<><span className="stline" aria-hidden="true"></span></>) : null}
                  </li>
                </React.Fragment>
              ))}
            </ol>

            <div style={css("display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start")}>
              <div style={css("display: flex; flex-direction: column; gap: 18px; min-width: 0")}>
                {(V.vWaiting) ? (
                  <section className="card">
                    <div className="cardhead">
                      <span className="htile" style={css("background: #E6EDFF; color: #2B3FB0")} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>
                      </span>
                      <div style={css("display: flex; flex-direction: column; gap: 2px")}>
                        <h2 style={css("margin: 0; font-size: 17px; font-weight: 600")}>{"Waiting for Priya Shah"}</h2>
                        <span style={css("font-size: 13.5px; color: #6B7080")}>{"You'll get an email when she approves or asks for changes. Rules are locked until then."}</span>
                      </div>
                    </div>
                    <ol className="tl">
                      {(V.timeline || []).map((tl, $i3) => (
                        <React.Fragment key={$i3}>
                          <li className={tl.cls}>
                            <span className="tldot" aria-hidden="true"></span>
                            <div style={css("display: flex; flex-direction: column; gap: 2px")}>
                              <span style={css("font-size: 14px; font-weight: 500")}>{tl.label}</span>
                              <span style={css("font-size: 12.5px; color: #6B7080")}>{tl.sub}</span>
                            </div>
                          </li>
                        </React.Fragment>
                      ))}
                    </ol>
                    <div style={css("display: flex; gap: 10px; padding: 0 20px 20px")}>
                      <button type="button" className="btn" onClick={V.remind} style={css("height: 38px; padding: 0 14px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 13.5px; font-weight: 500; color: #12141C")}>{V.remindLabel}</button>
                      <a href={route("DDMRules.dc.html")} className="btn" style={css("display: inline-flex; align-items: center; height: 38px; padding: 0 14px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 13.5px; font-weight: 500; color: #12141C; box-sizing: border-box")}>{"Withdraw and edit"}</a>
                    </div>
                  </section>
                ) : null}

                {(V.vReview) ? (
                  <section className="card">
                    <div className="cardhead">
                      <span className="htile" style={css("background: #FFF0D1; color: #8A4B00")} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 8-8"></path><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"></path></svg>
                      </span>
                      <div style={css("display: flex; flex-direction: column; gap: 2px")}>
                        <h2 style={css("margin: 0; font-size: 17px; font-weight: 600")}>{"Review 3 changes from Yuvraj Bhati"}</h2>
                        <span style={css("font-size: 13.5px; color: #6B7080")}>{"Check what each rule hides and where. Approving lets Yuvraj build the SDK."}</span>
                      </div>
                    </div>
                    <div style={css("margin: 0 20px; padding: 10px 14px; border-left: 3px solid #C9CFF3; background: #F7F8FF; border-radius: 0 10px 10px 0; font-size: 13.5px; color: #3B4050")}>
                      {"\u201cAdded date of birth and Aadhaar for /profile. Mobile stays visible on customer pages for call-backs.\u201d"}
                    </div>
                    <div style={css("display: flex; flex-direction: column; margin: 16px 20px 0; border: 1px solid #EEF0F5; border-radius: 12px; overflow: hidden")}>
                      {(V.changes || []).map((ch, $i4) => (
                        <React.Fragment key={$i4}>
                          <div className="crow">
                            <span className={`tag ${ch.cls}`} style={css("width: 52px; justify-content: center")}>{ch.tag}</span>
                            <div style={css("display: flex; flex-direction: column; gap: 2px; min-width: 0")}>
                              <span style={css("font-size: 14px; font-weight: 600")}>{ch.name}</span>
                              <span style={css("font-size: 12.5px; color: #6B7080")}>{ch.what}</span>
                            </div>
                            <span className="mono" style={css("font-size: 12.5px; color: #6B7080")}>
                              {ch.sample}{" "}<span style={css("color: #9AA0B0")}>{"\u2192"}</span>{" "}<span style={css("color: #2B3FB0")}>{ch.masked}</span>
                            </span>
                            <div style={css("display: flex; flex-direction: column; align-items: flex-start; gap: 4px")}>
                              <span className={`sc ${ch.scCls}`}>{ch.scLabel}</span>
                              <span className="mono" style={css("font-size: 11.5px; color: #6B7080")}>{ch.scPages}</span>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    <div style={css("display: flex; flex-direction: column; gap: 6px; padding: 16px 20px 0")}>
                      <label htmlFor="rc" style={css("font-size: 13.5px; font-weight: 500; color: #3B4050")}>
                        {"Comment for Yuvraj "}<span style={css("font-weight: 400; color: #6B7080")}>{"\u00b7 needed if you ask for changes"}</span>
                      </label>
                      <input id="rc" type="text" value={V.commentInput} onChange={V.onComment} placeholder="e.g. Keep mobile hidden on /customers too" style={css("height: 40px; padding: 0 12px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; color: #12141C; box-sizing: border-box")} />
                    </div>
                    <div style={css("display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px 20px")}>
                      <button type="button" className="btn" onClick={V.requestChanges} style={css("height: 42px; padding: 0 16px; border: 1px solid #F1C4BE; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 500; color: #B42318")}>{"Ask for changes"}</button>
                      <button type="button" className="primary" onClick={V.approve} style={css("display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 18px; border: 0; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>{" Approve rules "}
                      </button>
                    </div>
                  </section>
                ) : null}

                {(V.vChanges) ? (
                  <section className="card">
                    <div className="cardhead">
                      <span className="htile" style={css("background: #FDE7E4; color: #A12218")} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"></path></svg>
                      </span>
                      <div style={css("display: flex; flex-direction: column; gap: 2px")}>
                        <h2 style={css("margin: 0; font-size: 17px; font-weight: 600")}>{V.changesTitle}</h2>
                        <span style={css("font-size: 13.5px; color: #6B7080")}>{V.changesSub}</span>
                      </div>
                    </div>
                    <div style={css("margin: 0 20px; padding: 12px 14px; border-left: 3px solid #F1A097; background: #FFF6F4; border-radius: 0 10px 10px 0; font-size: 14px; color: #12141C")}>
                      {"\u201c"}{V.comment}{"\u201d"}
                      <div style={css("margin-top: 4px; font-size: 12.5px; color: #6B7080")}>{"Priya Shah \u00b7 just now"}</div>
                    </div>
                    <div style={css("display: flex; gap: 10px; padding: 16px 20px 20px")}>
                      {(V.isMaker) ? (
                        <a href={route("DDMRules.dc.html")} className="primary" style={css("display: inline-flex; align-items: center; height: 42px; padding: 0 18px; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff; box-sizing: border-box")}>{"Edit rules"}</a>
                      ) : null}
                      <button type="button" className="btn" onClick={V.resetReview} style={css("height: 42px; padding: 0 16px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 500; color: #12141C")}>{"Back to review (prototype)"}</button>
                    </div>
                  </section>
                ) : null}

                {(V.vApproved) ? (
                  <section className="card">
                    <div className="cardhead">
                      <span className="htile" style={css("background: #E3F5EA; color: #166534")} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>
                      </span>
                      <div style={css("display: flex; flex-direction: column; gap: 2px")}>
                        <h2 style={css("margin: 0; font-size: 17px; font-weight: 600")}>{"Approved. Ready to build."}</h2>
                        <span style={css("font-size: 13.5px; color: #6B7080")}>{"Priya Shah approved these rules today at 4:10 PM. Choose how your developers will add the SDK."}</span>
                      </div>
                    </div>
                    <div style={css("display: flex; flex-direction: column; gap: 10px; padding: 0 20px")}>
                      <span style={css("font-size: 13.5px; font-weight: 600")}>{"Package type"}</span>
                      <div role="radiogroup" aria-label="Package type" style={css("display: grid; grid-template-columns: 1fr 1fr; gap: 10px")}>
                        {(V.formats || []).map((fm, $i5) => (
                          <React.Fragment key={$i5}>
                            <button type="button" role="radio" aria-checked={fm.on} className={fm.cls} onClick={fm.pick}>
                              <span className="radio" aria-hidden="true"></span>
                              <span style={css("display: flex; flex-direction: column; gap: 3px")}>
                                <span style={css("font-size: 14px; font-weight: 600; color: #12141C")}>{fm.label}</span>
                                <span style={css("font-size: 12.5px; line-height: 1.45; color: #6B7080")}>{fm.desc}</span>
                                <span className="mono" style={css("font-size: 12px; color: #3B4050")}>{fm.file}</span>
                              </span>
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                      <div style={css("display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 14px; border-radius: 12px; background: #F7F8FB")}>
                        <div style={css("display: flex; flex-direction: column; gap: 2px")}>
                          <span style={css("font-size: 14px; font-weight: 500")}>{"Include a source map"}</span>
                          <span style={css("font-size: 12.5px; color: #6B7080")}>{"Helps developers debug. Leave it off for production."}</span>
                        </div>
                        <button type="button" role="switch" aria-checked={V.srcMap} aria-label="Include a source map" className={`sw ${V.srcMapCls}`} onClick={V.toggleSrcMap}><span className="k"></span></button>
                      </div>
                    </div>
                    <div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px 20px")}>
                      <span style={css("font-size: 13px; color: #6B7080")}>{"The package is self-contained with engine v0.4.1 and the compiled V12 map."}</span>
                      <button type="button" className="primary" onClick={V.build} style={css("display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 18px; border: 0; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"></path></svg>{" Build SDK v1.3 "}
                      </button>
                    </div>
                  </section>
                ) : null}

                {(V.vBuilding) ? (
                  <section className="card" aria-live="polite">
                    <div className="cardhead">
                      <span className="htile" style={css("background: #E6EDFF; color: #2B3FB0")} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"></path></svg>
                      </span>
                      <div style={css("display: flex; flex-direction: column; gap: 2px; flex: 1")}>
                        <h2 style={css("margin: 0; font-size: 17px; font-weight: 600")}>{"Building DAM Portal SDK v1.3"}</h2>
                        <span style={css("font-size: 13.5px; color: #6B7080")}>{"Compiling in browser using DDM V12 spec. Takes just a few seconds."}</span>
                      </div>
                      <span style={css("font-size: 14px; font-weight: 600")}>{V.buildPct}</span>
                    </div>
                    <div style={css("margin: 0 20px; height: 8px; border-radius: 999px; background: #EEF0F5; overflow: hidden")}>
                      <div style={css(`height: 100%; width: ${V.buildPct}; border-radius: 999px; background: #4457D6; transition: width .4s`)}></div>
                    </div>
                    <div style={css("display: flex; flex-direction: column; gap: 10px; padding: 16px 20px 20px")}>
                      {(V.buildSteps || []).map((bs, $i6) => (
                        <React.Fragment key={$i6}>
                          <div style={css(`display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: ${bs.color}`)}>
                            <span style={css(`width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none; background: ${bs.bg}; color: #fff`)} aria-hidden="true">
                              {(bs.done) ? (<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg></>) : null}
                            </span>{" "}{bs.label}{" "}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </section>
                ) : null}

                {(V.vReady) ? (
                  <div style={css("display: flex; flex-direction: column; gap: 18px")}>
                    <section className="card">
                      <div className="cardhead">
                        <span className="htile" style={css("background: #E3F5EA; color: #166534")} aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>
                        </span>
                        <div style={css("display: flex; flex-direction: column; gap: 2px")}>
                          <h2 style={css("margin: 0; font-size: 17px; font-weight: 600")}>{"Your SDK is ready"}</h2>
                          <span style={css("font-size: 13.5px; color: #6B7080")}>{"Download it, or send the snippet to your developers. The README below explains how to add it."}</span>
                        </div>
                      </div>
                      <div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin: 0 20px; padding: 16px; border: 1px solid #E7E9F0; border-radius: 14px; background: #FAFBFD")}>
                        <span style={css("width: 46px; height: 46px; border-radius: 12px; background: #12141C; color: #FDE68A; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; flex: none")} aria-hidden="true">{"JS"}</span>
                        <div style={css("flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 3px")}>
                          <span className="mono" style={css("font-size: 14px; font-weight: 500")}>{V.pkgName}</span>
                          <span style={css("font-size: 12.5px; color: #6B7080")}>{V.pkgMeta}</span>
                          <span style={css("display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #166534")}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"></path><path d="m9 12 2 2 4-4"></path></svg>
                            {" Signed by miniOrange \u00b7 "}<span className="mono">{V.hashDisplay}</span>
                          </span>
                        </div>
                        <div style={css("display: flex; gap: 8px")}>
                          <button type="button" className="btn" onClick={V.copyLink} style={css("height: 42px; padding: 0 14px; border: 1px solid #E1E4EC; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 500; color: #12141C")}>{V.copyLabel}</button>
                          <button type="button" className="primary" onClick={V.download} style={css("display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 18px; border: 0; border-radius: 10px; background: #4457D6; font-size: 14px; font-weight: 500; color: #fff")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"></path></svg>{" "}{V.dlLabel}{" "}
                          </button>
                        </div>
                      </div>
                      <div style={css("display: flex; flex-direction: column; gap: 8px; padding: 16px 20px 20px")}>
                        <span style={css("font-size: 13.5px; font-weight: 600")}>{"What's inside"}</span>
                        <div style={css("display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px")}>
                          {(V.contents || []).map((ct, $i7) => (
                            <React.Fragment key={$i7}>
                              <div style={css("display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #EEF0F5; border-radius: 10px")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7080" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"></path><path d="M14 3v5h5"></path></svg>
                                <div style={css("flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px")}>
                                  <span className="mono" style={css("font-size: 12.5px; color: #12141C")}>{ct.name}</span>
                                  <span style={css("font-size: 12px; color: #6B7080")}>{ct.desc}</span>
                                </div>
                                <span style={css("font-size: 12px; color: #6B7080")}>{ct.size}</span>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </section>

                    <section className="card" aria-label="README for developers">
                      <div style={css("display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 0 20px; border-bottom: 1px solid #EEF0F5")}>
                        <div style={css("display: flex; align-items: center; gap: 12px")}>
                          <span style={css("font-size: 15px; font-weight: 600; padding-right: 8px")}>{"README for developers"}</span>
                          <div role="tablist" aria-label="README sections" style={css("display: flex")}>
                            {(V.rtabs || []).map((rt, $i8) => (
                              <React.Fragment key={$i8}>
                                <button type="button" role="tab" aria-selected={rt.on} className={rt.cls} onClick={rt.pick}>{rt.label}</button>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                        <button type="button" className="linkbtn" onClick={V.downloadReadme}>{"Download README only"}</button>
                      </div>

                      <div style={css("padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 12px")}>
                        {(V.rQuick) ? (
                          <div style={css("display: flex; flex-direction: column; gap: 12px")}>
                            <span style={css("font-size: 13.5px; line-height: 1.55; color: #3B4050")}>
                              {"Two steps. The rules approved by Priya Shah are already inside the package, so developers don't configure any masking."}
                            </span>
                            {(V.isScript) ? (
                              <pre className="code">
                                <span className="c">{"<!-- 1. Copy ddm-sdk.js to /vendor/ and load it as the first script in <head> -->"}</span>{"\n<"}<span className="k">{"script"}</span>{" src="}<span className="s">{"\"/vendor/ddm-sdk.js\""}</span>{"\n        integrity="}<span className="s">{`"${V.scriptIntegrity}"`}</span>{" crossorigin="}<span className="s">{"\"anonymous\""}</span>{"></"}<span className="k">{"script"}</span>{">\n\n"}<span className="c">{"<!-- 2. That's it! Rules are already inside. Masking begins straight away. -->"}</span>
                              </pre>
                            ) : null}
                            {(V.isNpm) ? (
                              <pre className="code">
                                <span className="c">{"<!-- 1. Decoupled setup: load the map first, then the engine -->"}</span>{"\n<"}<span className="k">{"script"}</span>{" src="}<span className="s">{"\"/vendor/ddm-map.js\""}</span>{"\n        integrity="}<span className="s">{`"${V.mapIntegrity}"`}</span>{" crossorigin="}<span className="s">{"\"anonymous\""}</span>{"></"}<span className="k">{"script"}</span>{"\n<"}<span className="k">{"script"}</span>{" src="}<span className="s">{"\"/vendor/ddm-engine.js\""}</span>{"\n        integrity="}<span className="s">{`"${V.engineIntegrity}"`}</span>{" crossorigin="}<span className="s">{"\"anonymous\""}</span>{"></"}<span className="k">{"script"}</span>{">\n\n"}<span className="c">{"<!-- 2. Map must load before the engine. Masking begins automatically. -->"}</span>
                              </pre>
                            ) : null}
                          </div>
                        ) : null}

                        {(V.rOptions) ? (
                          <div style={css("display: flex; flex-direction: column; border: 1px solid #EEF0F5; border-radius: 12px; overflow: hidden")}>
                            {(V.options || []).map((op, $i9) => (
                              <React.Fragment key={$i9}>
                                <div style={css("display: grid; grid-template-columns: 240px 1fr; gap: 14px; padding: 11px 14px; border-bottom: 1px solid #F3F4F8; font-size: 13.5px")}>
                                  <span className="mono" style={css("font-size: 12.5px; color: #2B3FB0")}>{op.name}</span>
                                  <span style={css("line-height: 1.5; color: #3B4050")}>{op.desc}</span>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        ) : null}

                        {(V.rCheck) ? (
                          <ol style={css("display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none")}>
                            {(V.checks || []).map((cs, $i10) => (
                              <React.Fragment key={$i10}>
                                <li style={css("display: flex; gap: 12px; font-size: 13.5px; line-height: 1.5; color: #3B4050")}>
                                  <span className="stc todo" style={css("width: 22px; height: 22px; font-size: 12px")} aria-hidden="true">{cs.n}</span>
                                  <span>{cs.text}{" "}<span className="mono" style={css("font-size: 12.5px; color: #2B3FB0")}>{cs.code}</span></span>
                                </li>
                              </React.Fragment>
                            ))}
                          </ol>
                        ) : null}
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>

              <aside style={css("display: flex; flex-direction: column; gap: 18px")}>
                <section className="card" aria-label="In this version">
                  <div style={css("display: flex; flex-direction: column; gap: 2px; padding: 16px 18px 12px")}>
                    <span style={css("font-size: 15px; font-weight: 600")}>{"In this version"}</span>
                    <span style={css("font-size: 12.5px; color: #6B7080")}>{V.inThisVersionSub}</span>
                  </div>
                  {(V.ruleList || []).map((rl, $i11) => (
                    <React.Fragment key={$i11}>
                      <div style={css("display: flex; align-items: center; gap: 10px; padding: 9px 18px; border-top: 1px solid #F3F4F8")}>
                        <span className="tile" style={css("width: 30px; height: 30px; font-size: 10px; border-radius: 8px")} aria-hidden="true">{rl.tile}</span>
                        <span style={css("flex: 1; min-width: 0; font-size: 13.5px; font-weight: 500")}>{rl.name}</span>
                        <span className={`sc ${rl.scCls}`} style={css("height: 22px; font-size: 11.5px")}>{rl.scLabel}</span>
                      </div>
                    </React.Fragment>
                  ))}
                  <div style={css("padding: 12px 18px 16px; border-top: 1px solid #F3F4F8")}>
                    <a href={route("DDMRules.dc.html")} className="linkbtn" style={css("font-size: 13px")}>{"Open rules and page map"}</a>
                  </div>
                </section>

                <section className="card" aria-label="Earlier builds">
                  <div style={css("padding: 16px 18px 10px; font-size: 15px; font-weight: 600")}>{"Earlier builds"}</div>
                  {(V.history || []).map((hs, $i12) => (
                    <React.Fragment key={$i12}>
                      <div style={css("display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-top: 1px solid #F3F4F8")}>
                        <span className="mono" style={css("font-size: 13px; font-weight: 500; width: 40px")}>{hs.v}</span>
                        <span style={css("flex: 1; font-size: 12.5px; color: #6B7080")}>{hs.meta}</span>
                        <button type="button" className="iconbtn" aria-label={`Download ${hs.v}`} style={css("width: 30px; height: 30px; border: 0; border-radius: 8px; background: none; display: flex; align-items: center; justify-content: center; color: #4A4F5E")}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"></path></svg>
                        </button>
                      </div>
                    </React.Fragment>
                  ))}
                </section>
              </aside>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

// `initial` overrides the design's starting state (the canvas shows each screen in a different state).
export default class ReviewPage extends Design {
  constructor(props) {
    super(props);
    if (props.initial) this.state = { ...this.state, ...props.initial };
  }
}
