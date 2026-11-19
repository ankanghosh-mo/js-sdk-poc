import { useEffect, useRef, useState } from 'react';
import useTitle from '../lib/useTitle.js';
import Scenario from '../Scenario.jsx';

const DOCS = [
  { id: 'd1', pan: 'ABCDE1234F' },
  { id: 'd2', pan: 'ABCDE1234F' },
  { id: 'd3', pan: 'ABCDE1234F' },
];

export default function DocumentsPage() {
  useTitle('Documents · DAM Portal');

  // S28: simulated fetch, 1 s.
  const [docs, setDocs] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => setDocs(DOCS), 1000);
    return () => clearTimeout(t);
  }, []);

  // S29: a non-React widget writes innerHTML after 1.5 s.
  const legacyRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (legacyRef.current) {
        legacyRef.current.innerHTML = '<p>Aadhaar No: <span class="aadhaar">2345 6789 0123</span></p>';
      }
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="page">
      <h1>Documents</h1>
      <p className="lead">Content that arrives late: after a simulated fetch, and from a non-React widget.</p>

      <Scenario ids="S28" title="List after a simulated fetch (1 s)">
        {docs === null ? (
          <p className="muted">Loading documents…</p>
        ) : (
          <ul id="docs">
            {docs.map((d) => (
              <li key={d.id}><span className="pan">{d.pan}</span> PAN card</li>
            ))}
          </ul>
        )}
      </Scenario>

      <Scenario ids="S29" title="innerHTML widget (1.5 s)">
        <div id="legacyWidget" ref={legacyRef} />
      </Scenario>

      <Scenario ids="S30" title="Label → input">
        <div className="form-row">
          <label htmlFor="aadhaarField">Aadhaar No</label><input id="aadhaarField" value="2345 6789 0123" readOnly />
        </div>
      </Scenario>
    </div>
  );
}
