import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { KycStatus, RiskCategory } from '../types/crm';
import { getFullName } from '../utils/formatters';

export const KycManagement: React.FC = () => {
  const { customers, updateKycStatus } = useCrm();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter !== 'ALL' && c.kycStatus !== statusFilter) return false;
      if (riskFilter !== 'ALL' && c.riskCategory !== riskFilter) return false;
      if (!q) return true;
      return (
        c.customerId.toLowerCase().includes(q) ||
        getFullName(c).toLowerCase().includes(q) ||
        c.panNumber.toLowerCase().includes(q) ||
        c.aadhaarNumber.toLowerCase().includes(q) ||
        c.assignedOfficer.toLowerCase().includes(q)
      );
    });
  }, [customers, search, statusFilter, riskFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">KYC & AML Compliance Management</h1>
        <p className="text-sm text-slate-500">
          Review CKYC verification queues, risk categorizations, and statutory identity documents
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Customer ID, Name, PAN, Aadhaar, or Officer..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
          >
            <option value="ALL">All KYC Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
          >
            <option value="ALL">All Risk Categories</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">PAN</th>
                <th className="py-3 px-4">Aadhaar</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Risk Category</th>
                <th className="py-3 px-4">Verification Date</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {rows.map((c) => (
                <tr key={c.customerId} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-navy-800">
                    {c.customerId}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {getFullName(c)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-800">{c.panNumber}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                    {c.aadhaarNumber}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={c.kycStatus}
                      onChange={(e) =>
                        updateKycStatus(c.customerId, e.target.value as KycStatus)
                      }
                      className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={c.riskCategory}
                      onChange={(e) =>
                        updateKycStatus(c.customerId, c.kycStatus, e.target.value as RiskCategory)
                      }
                      className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {c.verificationDate || '—'}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                    {c.assignedOfficer}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => updateKycStatus(c.customerId, 'Verified')}
                        title="Approve KYC"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateKycStatus(c.customerId, 'Rejected')}
                        title="Reject KYC"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/customers/${c.customerId}`}
                        title="View Customer Details"
                        className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}{' '}
            of {filtered.length} records
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
