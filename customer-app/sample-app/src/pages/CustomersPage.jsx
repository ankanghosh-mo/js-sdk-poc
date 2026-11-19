import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import useTitle from '../lib/useTitle.js';
import { makeCustomers } from '../lib/fakeData.js';
import Scenario from '../Scenario.jsx';

const PAGE_SIZE = 20;

const LINKED_ACCOUNTS = [
  { account: 'Savings', panNo: 'BQWPK4821L' },
  { account: 'Current', panNo: 'CZRTM7390H' },
  { account: 'Fixed deposit', panNo: 'DKLNS2468P' },
];

function CustomerModal({ customer, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div className="ddm-modal-backdrop" onClick={onClose} />
      <div className="ddm-modal"><h3 className="customer-name">{customer.name}</h3><span data-testid="customerAadhaar">{customer.aadhaar}</span><button id="closeModal" onClick={onClose}>Close</button></div>
    </>,
    document.body
  );
}

export default function CustomersPage() {
  useTitle('Customers · DAM Portal');

  const [rows, setRows] = useState(() => makeCustomers(1, PAGE_SIZE));
  const [sortDir, setSortDir] = useState(null); // null | 'asc' | 'desc'
  const [selected, setSelected] = useState(null);

  // S18: sort by name; clicking again flips the order.
  function sortByName() {
    const dir = sortDir === 'asc' ? 'desc' : 'asc';
    setSortDir(dir);
    setRows((r) => [...r].sort((a, b) => (dir === 'asc' ? 1 : -1) * (a.name.localeCompare(b.name) || a.id - b.id)));
  }

  // S19: append the next 20 customers.
  function loadMore() {
    setSortDir(null);
    setRows((r) => {
      const nextId = r.reduce((m, c) => Math.max(m, c.id), 0) + 1;
      return [...r, ...makeCustomers(nextId, PAGE_SIZE)];
    });
  }

  // S21: replace everything with 1000 customers.
  function load1000() {
    setSortDir(null);
    setRows(makeCustomers(1, 1000));
  }

  return (
    <div className="page">
      <h1>Customers</h1>
      <p className="lead">Fake, deterministic customer data. Click a row to open the customer in a modal.</p>

      <Scenario ids="S17 · S18 · S19 · S20 · S21" title="Customer table">
        <div className="toolbar">
          <button id="sortByName" type="button" onClick={sortByName}>
            Sort by name{sortDir ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
          </button>
          <button id="loadMore" type="button" onClick={loadMore}>Load 20 more</button>
          <button id="load1000" type="button" onClick={load1000}>Load 1000 rows</button>
          <span className="muted">{rows.length} rows</span>
        </div>
        <div className="table-wrap">
          <table id="custTable" className="data-table">
            <thead><tr><th>Name</th><th>PAN</th><th>Mobile</th><th>City</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => setSelected(c)}>
                  <td>{c.name}</td>
                  <td>{c.pan}</td>
                  <td>{c.mobile}</td>
                  <td>{c.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Scenario>

      <Scenario ids="S22" title="Second table, different header">
        <table id="linkedTable" className="data-table">
          <thead><tr><th>Account</th><th>PAN No</th></tr></thead>
          <tbody>
            {LINKED_ACCOUNTS.map((a) => (
              <tr key={a.account}>
                <td>{a.account}</td>
                <td>{a.panNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Scenario>

      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
