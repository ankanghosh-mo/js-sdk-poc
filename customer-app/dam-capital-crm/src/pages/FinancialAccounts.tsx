import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { formatINR } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';

export const FinancialAccounts: React.FC = () => {
  const { accounts } = useCrm();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (typeFilter !== 'ALL' && a.accountType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && a.accountStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        a.accountId.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.bankName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        a.ifsc.toLowerCase().includes(q)
      );
    });
  }, [accounts, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Financial & Settlement Accounts</h1>
        <p className="text-sm text-slate-500">
          Linked client bank accounts, PMS portfolios, and custody ledger balances
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Account ID, Customer, Bank, Account No, or IFSC..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
          >
            <option value="ALL">All Account Types</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
            <option value="Portfolio PMS">Portfolio PMS</option>
            <option value="Demat Cash">Demat Cash</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Dormant">Dormant</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Bank Name</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">IFSC</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Account Balance</th>
                <th className="py-3 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {rows.map((acc) => (
                <tr key={acc.accountId} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-navy-800">
                    {acc.accountId}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <Link to={`/customers/${acc.customerId}`} className="hover:underline">
                      {acc.customerName}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700">{acc.bankName}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-800">
                    {acc.accountNumber}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700">{acc.ifsc}</td>
                  <td className="py-3 px-4 text-xs text-slate-700">{acc.accountType}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                    {formatINR(acc.accountBalance)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={acc.accountStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}{' '}
            of {filtered.length} accounts
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {safePage} of {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
