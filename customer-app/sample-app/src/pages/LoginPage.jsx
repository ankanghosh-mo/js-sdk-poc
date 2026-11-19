import { useState } from 'react';
import useTitle from '../lib/useTitle.js';
import Scenario from '../Scenario.jsx';

export default function LoginPage() {
  useTitle('Login · DAM Portal');
  const [msg, setMsg] = useState('');

  function onSubmit(e) {
    e.preventDefault();
    setMsg('This is a fake login form; nothing is sent.');
  }

  return (
    <div className="page">
      <h1>Login</h1>
      <p className="lead">This page is excluded: the SDK does nothing here, not even in the header.</p>

      <form className="login-form" onSubmit={onSubmit}>
        <label htmlFor="loginUser">Username</label>
        <input id="loginUser" autoComplete="username" />
        <label htmlFor="loginPassword">Password</label>
        <input id="loginPassword" type="password" autoComplete="current-password" />
        <button type="submit">Sign in</button>
        {msg && <p className="muted">{msg}</p>}
      </form>

      <Scenario ids="S36" title="Excluded page">
        <span id="aadhaarNo">2345 6789 0123</span>
      </Scenario>
    </div>
  );
}
