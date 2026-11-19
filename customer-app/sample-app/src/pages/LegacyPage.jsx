import { Link, useSearchParams } from 'react-router-dom';
import useTitle from '../lib/useTitle.js';
import Scenario from '../Scenario.jsx';

export default function LegacyPage() {
  useTitle('Legacy · DAM Portal');
  const [params] = useSearchParams();
  const action = params.get('action');

  return (
    <div className="page">
      <h1>Legacy</h1>
      <p className="lead">The page mapping applies only when the query has <code>action=view</code>.</p>

      <Scenario ids="S35" title="Query condition">
        <p>Current action: <strong>{action ?? '(none)'}</strong></p>
        <p><span id="legacyPan">ABCDE1234F</span></p>
        <div className="toolbar">
          <Link to="/legacy?action=view">View (masked)</Link>
          <Link to="/legacy?action=edit">Edit (not masked)</Link>
        </div>
      </Scenario>
    </div>
  );
}
