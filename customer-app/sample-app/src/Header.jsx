import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Scenarios', end: true },
  { to: '/profile', label: 'Profile' },
  { to: '/customers', label: 'Customers', end: true },
  { to: '/customers/101', label: 'Customer 101' },
  { to: '/documents', label: 'Documents' },
  { to: '/widgets', label: 'Widgets' },
  { to: '/legacy?action=view', label: 'Legacy' },
  { to: '/login', label: 'Login' },
];

function readDebug() {
  try {
    return localStorage.getItem('ddmDebug') === '1';
  } catch {
    return false;
  }
}

function toggleDebug() {
  try {
    if (localStorage.getItem('ddmDebug') === '1') localStorage.removeItem('ddmDebug');
    else localStorage.setItem('ddmDebug', '1');
  } catch {
    // storage blocked: nothing to toggle
  }
  location.reload();
}

export default function Header() {
  const debugOn = readDebug();
  return (
    <header className="app-header">
      <div className="header-top">
        <span className="brand">DAM Portal (sample app)</span>
        <span className="user">
          Logged in: Rahul · <span id="userMobile">9876543210</span>
        </span>
        <button
          type="button"
          className={'debug-btn' + (debugOn ? ' on' : '')}
          onClick={toggleDebug}
          title="Toggle localStorage.ddmDebug and reload"
        >
          DDM debug{debugOn ? ' (on)' : ''}
        </button>
      </div>
      <nav className="nav">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
