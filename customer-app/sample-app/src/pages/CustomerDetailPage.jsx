import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CUSTOMERS } from '../lib/customers.js';
import Scenario from '../Scenario.jsx';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customer = CUSTOMERS[id];

  // S23: the page title carries the customer's name.
  useEffect(() => {
    document.title = customer ? 'Customer: ' + customer.name : 'Customer not found · DAM Portal';
  }, [customer]);

  if (!customer) {
    return (
      <div className="page">
        <h1>Customer not found</h1>
        <p>Only customers <Link to="/customers/101">101</Link> and <Link to="/customers/102">102</Link> exist.</p>
      </div>
    );
  }

  const other = customer.id === 101 ? 102 : 101;

  return (
    <div className="page">
      <p className="muted">Customer #{customer.id} · {customer.city}</p>

      <Scenario ids="S23 · S24" title="Name (page title and heading)">
        <h2 className="customer-name">{customer.name}</h2>
      </Scenario>

      <Scenario ids="S25" title="Read-only input with formcontrolname">
        <input formcontrolname="aadhaar" value={customer.aadhaar} readOnly />
      </Scenario>

      <Scenario ids="S26" title="Select options">
        <select id="accounts"><option>Savings · PAN ABCDE1234F</option><option>Current · PAN ABCDE1234F</option></select>
      </Scenario>

      <Scenario ids="S27" title="Client-side navigation">
        <Link id="nextCustomer" to={`/customers/${other}`}>Next customer ({other}) →</Link>
      </Scenario>
    </div>
  );
}
