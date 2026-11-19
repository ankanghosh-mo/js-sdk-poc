import { Link } from 'react-router-dom';
import useTitle from '../lib/useTitle.js';

export default function NotFoundPage() {
  useTitle('Not found · DAM Portal');
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p><Link to="/">Back to the scenarios</Link></p>
    </div>
  );
}
