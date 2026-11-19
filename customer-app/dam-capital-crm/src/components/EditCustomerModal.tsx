import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Customer, AccountStatus, CustomerType, KycStatus, RiskCategory } from '../types/crm';

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSave: (updated: Customer) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<Customer>({ ...customer });
  const [error, setError] = useState('');

  const handleChange = (field: keyof Customer, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.personalEmail.trim()) {
      setError('First Name, Last Name, and Personal Email are required.');
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.toUpperCase())) {
      setError('Invalid PAN format (e.g., ABCDE1234F).');
      return;
    }
    onSave({
      ...form,
      panNumber: form.panNumber.toUpperCase(),
      ifscCode: form.ifscCode.toUpperCase(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">
              Edit Customer — {customer.customerId}
            </h2>
            <p className="text-xs text-slate-500">Update personal, KYC, and financial profile details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-700 mb-3">
              Personal & Account Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={form.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Type</label>
                <select
                  value={form.customerType}
                  onChange={(e) => handleChange('customerType', e.target.value as CustomerType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-navy-700"
                >
                  <option value="Individual">Individual</option>
                  <option value="HNI">HNI</option>
                  <option value="Corporate">Corporate</option>
                  <option value="NRI">NRI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Status</label>
                <select
                  value={form.accountStatus}
                  onChange={(e) => handleChange('accountStatus', e.target.value as AccountStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-navy-700"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Dormant">Dormant</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">KYC Status</label>
                <select
                  value={form.kycStatus}
                  onChange={(e) => handleChange('kycStatus', e.target.value as KycStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-navy-700"
                >
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-700 mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Personal Email *</label>
                <input
                  type="email"
                  value={form.personalEmail}
                  onChange={(e) => handleChange('personalEmail', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={form.primaryPhone}
                  onChange={(e) => handleChange('primaryPhone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={form.residentialAddress}
                  onChange={(e) => handleChange('residentialAddress', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-700 mb-3">
              KYC & Banking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  value={form.panNumber}
                  onChange={(e) => handleChange('panNumber', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  value={form.aadhaarNumber}
                  onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Risk Category</label>
                <select
                  value={form.riskCategory}
                  onChange={(e) => handleChange('riskCategory', e.target.value as RiskCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-navy-700"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bank Account No.</label>
                <input
                  type="text"
                  value={form.bankAccountNumber}
                  onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={form.ifscCode}
                  onChange={(e) => handleChange('ifscCode', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:border-navy-700"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
