import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Customer } from '../types/crm';
import { getFullName } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { EditCustomerModal } from '../components/EditCustomerModal';

type SortField = 'customerId' | 'fullName' | 'customerType' | 'accountStatus' | 'kycStatus';

export const Customers: React.FC = () => {
  const { customers, deleteCustomer, updateCustomer, globalSearch, setGlobalSearch } = useCrm();
  const navigate = useNavigate();

  const [kycFilter, setKycFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('customerId');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return customers
      .filter((c) => {
        if (kycFilter !== 'ALL' && c.kycStatus !== kycFilter) return false;
        if (accountFilter !== 'ALL' && c.accountStatus !== accountFilter) return false;
        if (!q) return true;
        const fullName = getFullName(c).toLowerCase();
        return (
          c.customerId.toLowerCase().includes(q) ||
          fullName.includes(q) ||
          c.personalEmail.toLowerCase().includes(q) ||
          c.primaryPhone.toLowerCase().includes(q) ||
          c.panNumber.toLowerCase().includes(q) ||
          c.aadhaarNumber.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA = '';
        let valB = '';
        if (sortField === 'fullName') {
          valA = getFullName(a);
          valB = getFullName(b);
        } else {
          valA = String(a[sortField]);
          valB = String(b[sortField]);
        }
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
  }, [customers, globalSearch, kycFilter, accountFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedCustomers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, safePage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleDelete = (customer: Customer) => {
    if (window.confirm(`Delete customer ${getFullName(customer)} (${customer.customerId})?`)) {
      deleteCustomer(customer.customerId);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Customer ID',
      'Full Name',
      'Email',
      'Phone',
      'PAN Number',
      'Aadhaar Number',
      'Customer Type',
      'Account Status',
      'KYC Status',
      'City',
      'Annual Income',
    ];
    const rows = filteredCustomers.map((c) => [
      c.customerId,
      `"${getFullName(c)}"`,
      c.personalEmail,
      `"${c.primaryPhone}"`,
      c.panNumber,
      `"${c.aadhaarNumber}"`,
      c.customerType,
      c.accountStatus,
      c.kycStatus,
      c.city,
      c.annualIncome,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dam_capital_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Customer Directory</h1>
          <p className="text-sm text-slate-500">
            Manage client profiles, KYC identifiers, and account lifecycles ({filteredCustomers.length} records)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Name, ID, Email, Phone, PAN, or Aadhaar..."
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={kycFilter}
            onChange={(e) => {
              setKycFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-navy-700"
          >
            <option value="ALL">All KYC Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-navy-700"
          >
            <option value="ALL">All Account Statuses</option>
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
                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('customerId')}
                    className="inline-flex items-center gap-1 hover:text-navy-900"
                  >
                    Customer ID <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('fullName')}
                    className="inline-flex items-center gap-1 hover:text-navy-900"
                  >
                    Full Name <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">PAN Number</th>
                <th className="py-3 px-4">Aadhaar Number</th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('customerType')}
                    className="inline-flex items-center gap-1 hover:text-navy-900"
                  >
                    Type <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('accountStatus')}
                    className="inline-flex items-center gap-1 hover:text-navy-900"
                  >
                    Account <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => handleSort('kycStatus')}
                    className="inline-flex items-center gap-1 hover:text-navy-900"
                  >
                    KYC <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No customers match the current search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => (
                  <tr key={c.customerId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-navy-800 whitespace-nowrap">
                      <Link to={`/customers/${c.customerId}`} className="hover:underline">
                        {c.customerId}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {getFullName(c)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{c.personalEmail}</td>
                    <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {c.primaryPhone}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {c.panNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {c.aadhaarNumber}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{c.customerType}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={c.accountStatus} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={c.kycStatus} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/customers/${c.customerId}`}
                          title="View Profile"
                          className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setEditingCustomer(c)}
                          title="Edit Customer"
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          title="Delete Customer"
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded px-2 py-1 bg-white"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <span>
              Showing {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filteredCustomers.length)} of{' '}
              {filteredCustomers.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {safePage} of {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={(updated) => updateCustomer(updated)}
        />
      )}
    </div>
  );
};
