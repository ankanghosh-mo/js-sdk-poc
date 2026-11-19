import { useEffect, useRef, useState } from 'react';
import useTitle from '../lib/useTitle.js';
import Scenario from '../Scenario.jsx';

const MOBILES = ['9876543210', '9123456780', '9988776655'];

export default function ProfilePage() {
  useTitle('Profile · DAM Portal');

  const pan = 'ABCDE1234F';
  const aadhaar = '2345 6789 0123';
  const panInputRef = useRef(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [readResult, setReadResult] = useState(null);

  // S11: the value changes every 1.5 s through React state.
  const [mobileIdx, setMobileIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMobileIdx((i) => (i + 1) % MOBILES.length), 1500);
    return () => clearInterval(t);
  }, []);

  // S15: the app must receive the real value on submit.
  function onSubmit(e) {
    e.preventDefault();
    const submitted = new FormData(e.currentTarget).get('pan');
    setSubmitResult(submitted === 'ABCDE1234F' ? 'real value submitted' : 'MASKED value submitted');
  }

  // S16: the app must read the real value from the input.
  function onReadValue() {
    const v = panInputRef.current.value;
    setReadResult(v === 'ABCDE1234F' ? 'app reads real value' : 'app reads masked value');
  }

  return (
    <div className="page">
      <h1>Profile</h1>
      <p className="lead">The signed-in user&apos;s KYC details. Every value below is real in the app; the SDK masks the display.</p>

      <div className="grid">
        <Scenario ids="S02" title="App-wide id">
          <span id="aadhaarNo">2345 6789 0123</span>
        </Scenario>

        <Scenario ids="S03 · S15 · S16" title="Read-only input in a form, submit and read back">
          <form id="kycForm" onSubmit={onSubmit} className="form-row">
            <input name="pan" value={pan} readOnly ref={panInputRef} />
            <button id="submitKyc" type="submit">Submit KYC</button>
            <button id="readValue" type="button" onClick={onReadValue}>Read value</button>
          </form>
          <div className="results">
            {submitResult !== null && <span id="submitCheck">{submitResult}</span>}
            {readResult !== null && <span id="readCheck">{readResult}</span>}
          </div>
        </Scenario>

        <Scenario ids="S04" title="Editable input (skipped)">
          <input name="panNumber" defaultValue="ABCDE1234F" />
        </Scenario>

        <Scenario ids="S05" title="Email (click to reveal)">
          <span className="contact-email">rahul.verma@example.com</span>
        </Scenario>

        <Scenario ids="S06" title="Attribute (hover the icon)">
          <span className="info" title="Aadhaar 2345 6789 0123">ⓘ</span>
        </Scenario>

        <Scenario ids="S07" title="Text after a label (two text nodes)">
          <p className="kyc-line">Aadhaar: {aadhaar}</p>
        </Scenario>

        <Scenario ids="S08" title="Excluded card, with an exception">
          <div className="card"><h3>KYC verification</h3><span id="aadhaar">2345 6789 0123</span> <span className="pan">ABCDE1234F</span> <button name="verifyKyc" type="button">Verify</button></div>
        </Scenario>

        <Scenario ids="S09" title="Same id outside the card">
          <div id="profileDetails"><span id="aadhaar">2345 6789 0123</span></div>
        </Scenario>

        <Scenario ids="S10" title="Excluded section">
          <div id="internalNotes">Note: call <span className="mobile">9876543210</span></div>
        </Scenario>

        <Scenario ids="S11" title="Value changing every 1.5 s">
          <span id="mobileNo">{MOBILES[mobileIdx]}</span>
        </Scenario>

        <Scenario ids="S12" title="Definition list (app-wide labels)">
          <dl id="kycList"><dt>PAN</dt><dd>ABCDE1234F</dd><dt>Mobile</dt><dd>9876543210</dd></dl>
        </Scenario>

        <Scenario ids="S13" title="Phone link (href unchanged)">
          <a className="phone-link" href="tel:9876543210">9876543210</a>
        </Scenario>

        <Scenario ids="S14" title="Position selector">
          <div id="stats"><span>Mobile</span><span>9876543210</span></div>
        </Scenario>
      </div>
    </div>
  );
}
