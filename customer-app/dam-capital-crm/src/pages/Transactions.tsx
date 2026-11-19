import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { formatINR } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';

export const Transactions: React.FC = () => {
  const { transactions } = useCrm();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (dateFilter && t.transactionDate !== dateFilter) return false;
      if (typeFilter !== 'ALL' && t.transactionType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && t.transactionStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        t.transactionId.toLowerCase().includes(q) ||
        t.customerId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.accountNumber.toLowerCase().includes(q)
      );
    });
  }, [transactions, search, dateFilter, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Client Transaction Ledger</h1>
        <p className="text-sm text-slate-500">
          Equity settlements, IPO subscriptions, and client fund transfers
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col lg:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Transaction ID, Customer ID, Name, or Account..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
          />

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
          >
            <option value="ALL">All Transaction Types</option>
            <option value="Equity Buy">Equity Buy</option>
            <option value="Equity Sell">Equity Sell</option>
            <option value="Funds Deposit">Funds Deposit</option>
            <option value="Funds Withdrawal">Funds Withdrawal</option>
            <option value="IPO Application">IPO Application</option>
            <option value="Dividend Credit">Dividend Credit</option>
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
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-navy-800 underline"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Transaction Date</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((tx) => (
                  <tr key={tx.transactionId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-navy-800">
                      {tx.transactionId}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      <Link to={`/customers/${tx.customerId}`} className="hover:underline">
                        {tx.customerId}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{tx.customerName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {tx.accountNumber}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{tx.transactionDate}</td>
                    <td className="py-3 px-4 text-xs text-slate-800">{tx.transactionType}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tx.transactionStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}{' '}
            of {filtered.length} transactions
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
