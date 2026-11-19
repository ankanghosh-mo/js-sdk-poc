import React, { useEffect, useState } from 'react';
import SdkListPage from './pages/SdkListPage.jsx';
import RulesPage from './pages/RulesPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';

// Each route is one screen of the canvas. The canvas shows one page in several states
// (e.g. "Rules", "Add rule" and "Page map" are the same page), so a route = page + starting state.
const SCREENS = {
  '/sdks': { title: 'JavaScript SDKs', render: () => <SdkListPage /> },
  '/sdks/new': { title: 'Create SDK', render: () => <SdkListPage initial={{ create: true }} /> },
  '/sdks/dam-portal/rules': { title: 'Rules and page map', render: () => <RulesPage /> },
  '/sdks/dam-portal/rules/add': {
    title: 'Add rule',
    render: () => (
      <RulesPage
        initial={{
          modal: { mode: 'add', kind: 'bank', words: ['accountNo', 'accountNumber', 'acctNo'], style: 'last4', scope: 'except', pages: ['p3'], reveal: false },
        }}
      />
    ),
  },
  '/sdks/dam-portal/pages': { title: 'Page map', render: () => <RulesPage initial={{ view: 'page' }} /> },
  '/sdks/dam-portal/review': { title: 'Review and build', render: () => <ReviewPage /> },
  '/sdks/dam-portal/build': { title: 'Review and build', render: () => <ReviewPage initial={{ stage: 'approved', role: 'maker' }} /> },
  '/sdks/dam-portal/ready': { title: 'Review and build', render: () => <ReviewPage initial={{ stage: 'ready', role: 'maker' }} /> },
};

function currentPath() {
  const p = window.location.hash.replace(/^#/, '') || '/sdks';
  return SCREENS[p] ? p : '/sdks';
}

export default function App() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onHash = () => {
      setPath(currentPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const screen = SCREENS[path];
  useEffect(() => {
    document.title = screen.title + ' · DDM';
  }, [screen]);

  // key={path}: a new route starts the page fresh in that screen's state, as on the canvas.
  return <React.Fragment key={path}>{screen.render()}</React.Fragment>;
}
