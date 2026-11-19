import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { formatINR, getFullName } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { EditCustomerModal } from '../components/EditCustomerModal';

type TabKey =
  | 'overview'
  | 'personal'
  | 'contact'
  | 'kyc'
  | 'financial'
  | 'employment'
  | 'account';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal Information' },
  { key: 'contact', label: 'Contact Information' },
  { key: 'kyc', label: 'KYC Information' },
  { key: 'financial', label: 'Financial Information' },
  { key: 'employment', label: 'Employment Information' },
  { key: 'account', label: 'Account Information' },
];

export const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customers, accounts, transactions, updateCustomer } = useCrm();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [editOpen, setEditOpen] = useState(false);

  const customer = customers.find((c) => c.customerId === customerId) || customers[0];

  if (!customer) {
    return (
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
        <p className="text-slate-600 mb-4">Customer record not found.</p>
        <Link to="/customers" className="text-sm font-medium text-navy-900 underline">
          Return to Customer Directory
        </Link>
      </div>
    );
  }

  const customerAccounts = accounts.filter((a) => a.customerId === customer.customerId);
  const customerTransactions = transactions.filter((t) => t.customerId === customer.customerId);

  const FieldItem = ({
    label,
    value,
    mono = false,
  }: {
    label: string;
    value: string | number;
    mono?: boolean;
  }) => (
    <div className="py-2.5 border-b border-slate-100 last:border-b-0">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`text-sm font-medium text-slate-900 mt-0.5 ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 bg-white border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-navy-900">{getFullName(customer)}</h1>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-navy-100 text-navy-900 rounded">
                {customer.customerId}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {customer.personalEmail}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {customer.primaryPhone}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {customer.city}, {customer.state}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={customer.accountStatus} />
          <StatusBadge status={customer.kycStatus} />
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800"
          >
            <Edit2 className="w-4 h-4" />
            Edit Customer
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-600">Quick Switch Customer Profile:</span>
        <select
          value={customer.customerId}
          onChange={(e) => navigate(`/customers/${e.target.value}`)}
          className="text-xs border border-slate-300 rounded-md px-3 py-1.5 bg-white max-w-xs"
        >
          {customers.slice(0, 100).map((c) => (
            <option key={c.customerId} value={c.customerId}>
              {c.customerId} — {getFullName(c)} ({c.panNumber})
            </option>
          ))}
        </select>
      </div>

      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-6 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-navy-900 text-navy-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-900 mb-3">Identity & Compliance Summary</h3>
            <FieldItem label="Customer ID" value={customer.customerId} mono />
            <FieldItem label="PAN Number" value={customer.panNumber} mono />
            <FieldItem label="Aadhaar Number" value={customer.aadhaarNumber} mono />
            <FieldItem label="CKYC Number" value={customer.ckycNumber} mono />
            <FieldItem label="Risk Category" value={customer.riskCategory} />
            <FieldItem label="Assigned Relationship Officer" value={customer.assignedOfficer} />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-900 mb-3">Wealth & Banking Snapshot</h3>
            <FieldItem label="Primary Bank" value={customer.bankName} />
            <FieldItem label="Bank Account Number" value={customer.bankAccountNumber} mono />
            <FieldItem label="IFSC Code" value={customer.ifscCode} mono />
            <FieldItem label="Demat Account" value={customer.dematAccountNumber} mono />
            <FieldItem label="Total Investment (AUM)" value={formatINR(customer.investmentAmount)} />
            <FieldItem label="Declared Net Worth" value={formatINR(customer.netWorth)} />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-900 mb-3">Nominee & Emergency Contact</h3>
            <FieldItem label="Nominee Name" value={customer.nomineeName} />
            <FieldItem label="Nominee Relationship" value={customer.nomineeRelationship} />
            <FieldItem label="Nominee Phone" value={customer.nomineePhoneNumber} />
            <FieldItem label="Emergency Contact" value={customer.emergencyContact} />
            <FieldItem label="Emergency Phone" value={customer.emergencyContactPhone} />
            <FieldItem label="Client Since" value={customer.createdAt} />
          </div>
        </div>
      )}

      {activeTab === 'personal' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <FieldItem label="Customer ID" value={customer.customerId} mono />
          <FieldItem label="First Name" value={customer.firstName} />
          <FieldItem label="Middle Name" value={customer.middleName} />
          <FieldItem label="Last Name" value={customer.lastName} />
          <FieldItem label="Date of Birth" value={customer.dateOfBirth} />
          <FieldItem label="Gender" value={customer.gender} />
          <FieldItem label="Marital Status" value={customer.maritalStatus} />
          <FieldItem label="Nationality" value={customer.nationality} />
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <FieldItem label="Personal Email" value={customer.personalEmail} />
          <FieldItem label="Work Email" value={customer.workEmail} />
          <FieldItem label="Primary Phone" value={customer.primaryPhone} />
          <FieldItem label="Alternate Phone" value={customer.alternatePhone} />
          <FieldItem label="Residential Address" value={customer.residentialAddress} />
          <FieldItem label="Permanent Address" value={customer.permanentAddress} />
          <FieldItem label="City" value={customer.city} />
          <FieldItem label="State" value={customer.state} />
          <FieldItem label="PIN Code" value={customer.pinCode} mono />
          <FieldItem label="Country" value={customer.country} />
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Government Identification & Statutory KYC Records</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <FieldItem label="PAN Number" value={customer.panNumber} mono />
            <FieldItem label="Aadhaar Number" value={customer.aadhaarNumber} mono />
            <FieldItem label="Passport Number" value={customer.passportNumber} mono />
            <FieldItem label="Voter ID (EPIC)" value={customer.voterId} mono />
            <FieldItem label="Driving License Number" value={customer.drivingLicenseNumber} mono />
            <FieldItem label="CKYC Registry Number" value={customer.ckycNumber} mono />
            <FieldItem label="KYC Verification Status" value={customer.kycStatus} />
            <FieldItem label="Verification Date" value={customer.verificationDate || 'Pending Verification'} />
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <FieldItem label="Bank Name" value={customer.bankName} />
          <FieldItem label="Account Holder Name" value={customer.accountHolderName} />
          <FieldItem label="Bank Account Number" value={customer.bankAccountNumber} mono />
          <FieldItem label="IFSC Code" value={customer.ifscCode} mono />
          <FieldItem label="Demat Account Number (CDSL/NSDL)" value={customer.dematAccountNumber} mono />
          <FieldItem label="Trading Account Number" value={customer.tradingAccountNumber} mono />
          <FieldItem label="Annual Income" value={formatINR(customer.annualIncome)} />
          <FieldItem label="Declared Net Worth" value={formatINR(customer.netWorth)} />
          <FieldItem label="Total Investment Amount" value={formatINR(customer.investmentAmount)} />
        </div>
      )}

      {activeTab === 'employment' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <FieldItem label="Employer Name" value={customer.employerName} />
          <FieldItem label="Occupation" value={customer.occupation} />
          <FieldItem label="Designation" value={customer.designation} />
          <FieldItem label="Employment Type" value={customer.employmentType} />
          <FieldItem label="Annual Salary" value={formatINR(customer.annualSalary)} />
          <FieldItem label="Office Address" value={customer.officeAddress} />
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <FieldItem label="Customer Segment" value={customer.customerType} />
            <FieldItem label="Account Status" value={customer.accountStatus} />
            <FieldItem label="Risk Profile" value={customer.riskCategory} />
            <FieldItem label="Nominee Name" value={customer.nomineeName} />
            <FieldItem label="Nominee Relationship" value={customer.nomineeRelationship} />
            <FieldItem label="Nominee Phone Number" value={customer.nomineePhoneNumber} />
            <FieldItem label="Emergency Contact" value={customer.emergencyContact} />
            <FieldItem label="Emergency Contact Phone" value={customer.emergencyContactPhone} />
            <FieldItem label="Assigned Relationship Manager" value={customer.assignedOfficer} />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-navy-900 uppercase">
              Linked Financial Accounts ({customerAccounts.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 px-4">Account ID</th>
                    <th className="py-2.5 px-4">Bank</th>
                    <th className="py-2.5 px-4">Account Number</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Balance</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerAccounts.map((acc) => (
                    <tr key={acc.accountId}>
                      <td className="py-2.5 px-4 font-mono text-xs">{acc.accountId}</td>
                      <td className="py-2.5 px-4">{acc.bankName}</td>
                      <td className="py-2.5 px-4 font-mono text-xs">{acc.accountNumber}</td>
                      <td className="py-2.5 px-4 text-xs">{acc.accountType}</td>
                      <td className="py-2.5 px-4 font-medium">{formatINR(acc.accountBalance)}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={acc.accountStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {customerTransactions.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-navy-900 uppercase">
                Recent Transactions ({customerTransactions.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2.5 px-4">Transaction ID</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerTransactions.map((tx) => (
                      <tr key={tx.transactionId}>
                        <td className="py-2.5 px-4 font-mono text-xs">{tx.transactionId}</td>
                        <td className="py-2.5 px-4 text-xs">{tx.transactionDate}</td>
                        <td className="py-2.5 px-4 text-xs">{tx.transactionType}</td>
                        <td className="py-2.5 px-4 font-medium">{formatINR(tx.amount)}</td>
                        <td className="py-2.5 px-4">
                          <StatusBadge status={tx.transactionStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => updateCustomer(updated)}
        />
      )}
    </div>
  );
};
