import useTitle from '../lib/useTitle.js';
import '../lib/customerBadge.js';
import Scenario from '../Scenario.jsx';

export default function WidgetsPage() {
  useTitle('Widgets · DAM Portal');

  return (
    <div className="page">
      <h1>Widgets</h1>
      <p className="lead">Values inside a shadow root, an SVG, an iframe and a hidden input.</p>

      <div className="grid">
        <Scenario ids="S31" title="Custom element, open shadow root">
          <customer-badge pan="ABCDE1234F"></customer-badge>
        </Scenario>

        <Scenario ids="S32" title="SVG text">
          <svg width="300" height="40"><text className="mobile" x="10" y="25">9876543210</text></svg>
        </Scenario>

        <Scenario ids="S33" title="Same-origin iframe">
          <iframe id="frame" src="/frame.html" title="Embedded frame" width="420" height="140" />
        </Scenario>

        <Scenario ids="S34" title="Hidden input (nothing visible)">
          <input type="hidden" name="aadhaar" value="234567890123" />
          <p className="muted">A hidden input sits here; inspect the DOM to see it.</p>
        </Scenario>
      </div>
    </div>
  );
}
