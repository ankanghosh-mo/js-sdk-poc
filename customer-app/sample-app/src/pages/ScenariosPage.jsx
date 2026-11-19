import { Link } from 'react-router-dom';
import useTitle from '../lib/useTitle.js';

// Copied from SCENARIOS.md. `look` = the DOM to look at, `expected` = the result with the SDK loaded.
const SCENARIOS = [
  { id: 'S01', page: '/profile', look: 'header: <span id="userMobile">9876543210</span>', expected: 'masked (app-wide name, by id), on every page except /login' },

  { id: 'S02', page: '/profile', look: '<span id="aadhaarNo">2345 6789 0123</span>', expected: 'masked (app-wide id)' },
  { id: 'S03', page: '/profile', look: 'inside <form id="kycForm">: controlled <input name="pan" value={pan} readOnly /> (pan = ABCDE1234F)', expected: 'input shows ABC*****4F' },
  { id: 'S04', page: '/profile', look: '<input name="panNumber" defaultValue="ABCDE1234F" /> (editable)', expected: 'not masked (editable inputs are skipped)' },
  { id: 'S05', page: '/profile', look: '<span class="contact-email">rahul.verma@example.com</span>', expected: 'masked; click reveals the real value for 5 s' },
  { id: 'S06', page: '/profile', look: '<span class="info" title="Aadhaar 2345 6789 0123">ⓘ</span>', expected: 'title = Aadhaar XXXX XXXX 0123' },
  { id: 'S07', page: '/profile', look: '<p class="kyc-line">Aadhaar: {aadhaar}</p> (React makes two text nodes)', expected: 'text Aadhaar: XXXX XXXX 0123' },
  { id: 'S08', page: '/profile', look: '<div class="card"><h3>KYC verification</h3><span id="aadhaar">2345 6789 0123</span> <span class="pan">ABCDE1234F</span> <button name="verifyKyc" type="button">Verify</button></div>', expected: '#aadhaar in the card not masked (exclusion); .pan in the card masked (exception)' },
  { id: 'S09', page: '/profile', look: '<div id="profileDetails"><span id="aadhaar">2345 6789 0123</span></div> (same id again)', expected: 'masked' },
  { id: 'S10', page: '/profile', look: '<div id="internalNotes">Note: call <span class="mobile">9876543210</span></div>', expected: 'not masked (excluded section)' },
  { id: 'S11', page: '/profile', look: '<span id="mobileNo">{value}</span>, value cycles 9876543210 → 9123456780 → 9988776655 every 1.5 s (React state)', expected: 'always masked (******3210, ******6780, ******6655)' },
  { id: 'S12', page: '/profile', look: '<dl id="kycList"><dt>PAN</dt><dd>ABCDE1234F</dd><dt>Mobile</dt><dd>9876543210</dd></dl>', expected: 'both dd masked (app-wide labels)' },
  { id: 'S13', page: '/profile', look: '<a class="phone-link" href="tel:9876543210">9876543210</a>', expected: 'text masked; href unchanged' },
  { id: 'S14', page: '/profile', look: '<div id="stats"><span>Mobile</span><span>9876543210</span></div>', expected: 'second span masked (position selector)' },
  { id: 'S15', page: '/profile', look: 'kycForm has <button id="submitKyc" type="submit">; onSubmit reads FormData.get(\'pan\') and renders <span id="submitCheck">', expected: 'real value submitted' },
  { id: 'S16', page: '/profile', look: '<button id="readValue" type="button"> reads panInputRef.current.value and renders <span id="readCheck">', expected: 'app reads real value' },

  { id: 'S17', page: '/customers', look: '<table id="custTable"> with header Name / PAN / Mobile / City and 20 body rows (deterministic fake data)', expected: 'PAN and Mobile cells masked; Name and City not' },
  { id: 'S18', page: '/customers', look: '<button id="sortByName"> sorts the rows (keyed by customer id)', expected: 'still masked' },
  { id: 'S19', page: '/customers', look: '<button id="loadMore"> adds 20 rows', expected: 'new rows masked' },
  { id: 'S20', page: '/customers', look: 'click a body row: createPortal modal <div class="ddm-modal"><h3 class="customer-name">{name}</h3><span data-testid="customerAadhaar">{aadhaar}</span><button id="closeModal">Close</button></div>', expected: 'name masked (/** page mapping), Aadhaar masked (app-wide data-testid)' },
  { id: 'S21', page: '/customers', look: '<button id="load1000"> replaces the rows with 1000 rows', expected: 'all masked; pass time in the debug panel' },
  { id: 'S22', page: '/customers', look: 'second table <table id="linkedTable"> header Account / PAN No, 3 rows', expected: 'PAN No column masked' },

  { id: 'S23', page: '/customers/101', look: 'document.title = "Customer: " + name', expected: 'Customer: R**********' },
  { id: 'S24', page: '/customers/101', look: '<h2 class="customer-name">Rahul Verma</h2> (102: Priya Shah)', expected: 'R********** (P*********)' },
  { id: 'S25', page: '/customers/101', look: '<input formcontrolname="aadhaar" value={aadhaar} readOnly />', expected: 'XXXX XXXX 0123' },
  { id: 'S26', page: '/customers/101', look: '<select id="accounts"><option>Savings · PAN ABCDE1234F</option><option>Current · PAN ABCDE1234F</option></select>', expected: 'option text Savings · PAN ABC*****4F' },
  { id: 'S27', page: '/customers/101', look: '<Link id="nextCustomer" to="/customers/102">', expected: 'after navigation: title and name masked for 102' },

  { id: 'S28', page: '/documents', look: 'after 1 s (simulated fetch), <ul id="docs"> with 3 × <li><span class="pan">ABCDE1234F</span> PAN card</li>', expected: 'masked' },
  { id: 'S29', page: '/documents', look: '<div id="legacyWidget"> filled with innerHTML (not React) after 1.5 s: <p>Aadhaar No: <span class="aadhaar">2345 6789 0123</span></p>', expected: 'masked' },
  { id: 'S30', page: '/documents', look: '<label for="aadhaarField">Aadhaar No</label><input id="aadhaarField" value="2345 6789 0123" readOnly />', expected: 'masked (app-wide label → input)' },

  { id: 'S31', page: '/widgets', look: 'custom element <customer-badge pan="ABCDE1234F"> with an open shadow root containing <span class="pan">ABCDE1234F</span>', expected: 'masked inside the shadow root' },
  { id: 'S32', page: '/widgets', look: '<svg width="300" height="40"><text class="mobile" x="10" y="25">9876543210</text></svg>', expected: 'masked' },
  { id: 'S33', page: '/widgets', look: '<iframe id="frame" src="/frame.html">; frame.html loads /ddm/ddm-sdk.js and has <span id="aadhaarNo">2345 6789 0123</span>', expected: 'masked inside the iframe' },
  { id: 'S34', page: '/widgets', look: '<input type="hidden" name="aadhaar" value="234567890123" />', expected: 'unchanged' },

  { id: 'S35', page: '/legacy?action=view', look: '<span id="legacyPan">ABCDE1234F</span>, with links /legacy?action=view and /legacy?action=edit', expected: 'masked on ?action=view; not masked on ?action=edit (query condition)' },

  { id: 'S36', page: '/login', look: '<span id="aadhaarNo">2345 6789 0123</span> and the header\'s #userMobile', expected: 'not masked (page excluded)' },
];

export default function ScenariosPage() {
  useTitle('Scenarios · DAM Portal');

  return (
    <div className="page">
      <h1>Scenarios</h1>
      <p className="lead">
        Checklist for the DDM browser SDK proof of concept. The app always renders real values; the SDK script
        (<code>/ddm/ddm-sdk.js</code>, loaded first in <code>&lt;head&gt;</code>) masks what the users see.
        Turn on <strong>DDM debug</strong> in the header for the SDK&apos;s debug panel.
      </p>
      <div className="table-wrap">
        <table id="scenarioTable" className="data-table checklist">
          <thead>
            <tr><th>#</th><th>Page</th><th>What to look at</th><th>Expected</th></tr>
          </thead>
          <tbody>
            {SCENARIOS.map((s) => (
              <tr key={s.id}>
                <td className="nowrap"><strong>{s.id}</strong></td>
                <td className="nowrap"><Link to={s.page}>{s.page}</Link></td>
                <td><code>{s.look}</code></td>
                <td>{s.expected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
