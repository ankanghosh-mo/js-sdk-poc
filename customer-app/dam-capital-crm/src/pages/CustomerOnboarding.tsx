import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Customer, CustomerType } from '../types/crm';
import { getFullName } from '../utils/formatters';

interface FormErrors {
  [key: string]: string;
}

export const CustomerOnboarding: React.FC = () => {
  const { customers, addCustomer } = useCrm();
  const navigate = useNavigate();

  const [submittedSuccess, setSubmittedSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male' as Customer['gender'],
    maritalStatus: 'Single' as Customer['maritalStatus'],
    nationality: 'Indian',
    customerType: 'Individual' as CustomerType,

    personalEmail: '',
    workEmail: '',
    primaryPhone: '',
    alternatePhone: '',
    residentialAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',

    panNumber: '',
    aadhaarNumber: '',
    passportNumber: '',
    voterId: '',
    drivingLicenseNumber: '',
    ckycNumber: '',

    bankName: 'HDFC Bank',
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    dematAccountNumber: '',
    tradingAccountNumber: '',
    annualIncome: '1500000',
    netWorth: '4500000',
    investmentAmount: '1000000',

    employerName: '',
    occupation: '',
    designation: '',
    employmentType: 'Salaried' as Customer['employmentType'],
    annualSalary: '1500000',
    officeAddress: '',
    nomineeName: '',
    nomineeRelationship: 'Spouse',
    nomineePhoneNumber: '',
    emergencyContact: '',
    emergencyContactPhone: '',
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.personalEmail.trim()) {
      newErrors.personalEmail = 'Personal email is required';
    } else if (!emailRegex.test(form.personalEmail)) {
      newErrors.personalEmail = 'Enter a valid email address';
    }

    if (form.workEmail && !emailRegex.test(form.workEmail)) {
      newErrors.workEmail = 'Enter a valid work email address';
    }

    const cleanPhone = form.primaryPhone.replace(/[\s\-+]/g, '');
    if (!cleanPhone) {
      newErrors.primaryPhone = 'Primary phone number is required';
    } else if (!/^(91)?[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.primaryPhone = 'Enter a valid 10-digit Indian mobile number';
    }

    if (!form.residentialAddress.trim()) {
      newErrors.residentialAddress = 'Residential address is required';
    }
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!/^\d{6}$/.test(form.pinCode.trim())) {
      newErrors.pinCode = 'Enter a valid 6-digit PIN code';
    }

    const panUpper = form.panNumber.trim().toUpperCase();
    if (!panUpper) {
      newErrors.panNumber = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panUpper)) {
      newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }

    const cleanAadhaar = form.aadhaarNumber.replace(/\s/g, '');
    if (!cleanAadhaar) {
      newErrors.aadhaarNumber = 'Aadhaar number is required';
    } else if (!/^[2-9]\d{11}$/.test(cleanAadhaar)) {
      newErrors.aadhaarNumber = 'Aadhaar must be 12 digits (cannot start with 0 or 1)';
    }

    if (!form.bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!/^\d{9,18}$/.test(form.bankAccountNumber.trim())) {
      newErrors.bankAccountNumber = 'Enter a valid 9 to 18 digit account number';
    }

    const ifscUpper = form.ifscCode.trim().toUpperCase();
    if (!ifscUpper) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscUpper)) {
      newErrors.ifscCode = 'Invalid IFSC format (e.g., HDFC0001234)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const nextNum = 10000 + customers.length + Math.floor(1 + Math.random() * 900);
    const customerId = `DAM-${nextNum}`;
    const cleanAadhaar = form.aadhaarNumber.replace(/\s/g, '');
    const formattedAadhaar = `${cleanAadhaar.slice(0, 4)} ${cleanAadhaar.slice(4, 8)} ${cleanAadhaar.slice(8, 12)}`;
    const today = new Date().toISOString().split('T')[0];

    const fullName = getFullName({
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
    });

    const newCustomer: Customer = {
      customerId,
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      maritalStatus: form.maritalStatus,
      nationality: form.nationality,

      personalEmail: form.personalEmail.trim(),
      workEmail: form.workEmail.trim() || form.personalEmail.trim(),
      primaryPhone: form.primaryPhone.trim(),
      alternatePhone: form.alternatePhone.trim(),
      residentialAddress: form.residentialAddress.trim(),
      permanentAddress: form.permanentAddress.trim() || form.residentialAddress.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pinCode: form.pinCode.trim(),
      country: form.country,

      panNumber: form.panNumber.trim().toUpperCase(),
      aadhaarNumber: formattedAadhaar,
      passportNumber: form.passportNumber.trim().toUpperCase() || `Z${Math.floor(1000000 + Math.random() * 8999999)}`,
      voterId: form.voterId.trim().toUpperCase() || `ABC${Math.floor(1000000 + Math.random() * 8999999)}`,
      drivingLicenseNumber: form.drivingLicenseNumber.trim().toUpperCase() || 'MH01 20220014521',
      ckycNumber: form.ckycNumber.trim() || `100${Math.floor(10000000000 + Math.random() * 89999999999)}`,

      bankAccountNumber: form.bankAccountNumber.trim(),
      ifscCode: form.ifscCode.trim().toUpperCase(),
      bankName: form.bankName.trim(),
      accountHolderName: form.accountHolderName.trim() || fullName,
      dematAccountNumber: form.dematAccountNumber.trim() || `12081600${Math.floor(10000000 + Math.random() * 89999999)}`,
      tradingAccountNumber: form.tradingAccountNumber.trim() || `DC${Math.floor(1000000 + Math.random() * 8999999)}`,
      annualIncome: Number(form.annualIncome) || 1200000,
      netWorth: Number(form.netWorth) || 3500000,
      investmentAmount: Number(form.investmentAmount) || 500000,

      employerName: form.employerName.trim() || 'Independent Consultant',
      occupation: form.occupation.trim() || 'Executive',
      designation: form.designation.trim() || 'Manager',
      employmentType: form.employmentType,
      annualSalary: Number(form.annualSalary) || Number(form.annualIncome) || 1200000,
      officeAddress: form.officeAddress.trim() || `${form.city}, ${form.state}`,

      nomineeName: form.nomineeName.trim() || `Asha ${form.lastName.trim()}`,
      nomineeRelationship: form.nomineeRelationship,
      nomineePhoneNumber: form.nomineePhoneNumber.trim() || form.primaryPhone.trim(),
      emergencyContact: form.emergencyContact.trim() || `Vikram ${form.lastName.trim()}`,
      emergencyContactPhone: form.emergencyContactPhone.trim() || form.primaryPhone.trim(),

      customerType: form.customerType,
      accountStatus: 'Active',
      kycStatus: 'Pending',
      riskCategory: 'Low',
      verificationDate: '',
      assignedOfficer: 'R. Subramanian',
      createdAt: today,
    };

    addCustomer(newCustomer);
    setSubmittedSuccess(`${fullName} (${customerId})`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 text-sm border rounded-md focus:outline-none ${
      errors[field]
        ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600'
        : 'border-slate-300 bg-white focus:border-navy-700'
    }`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-900">New Customer Onboarding</h1>
        <p className="text-sm text-slate-500">
          Complete client registration, statutory KYC identifiers, and settlement bank details
        </p>
      </div>

      {submittedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Customer <strong>{submittedSuccess}</strong> has been onboarded and saved to the directory.
            </span>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded hover:bg-emerald-800"
          >
            View Customer List
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-900 border-b border-slate-100 pb-2">
            1. Personal Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="e.g., Siddharth"
                className={inputClass('firstName')}
              />
              {errors.firstName && <p className="text-xs text-rose-600 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="middleName" className="block text-xs font-medium text-slate-700 mb-1">Middle Name</label>
              <input
                id="middleName"
                name="middleName"
                type="text"
                value={form.middleName}
                onChange={(e) => updateField('middleName', e.target.value)}
                placeholder="e.g., Raj"
                className={inputClass('middleName')}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="e.g., Kulkarni"
                className={inputClass('lastName')}
              />
              {errors.lastName && <p className="text-xs text-rose-600 mt-1">{errors.lastName}</p>}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-xs font-medium text-slate-700 mb-1">Date of Birth *</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                className={inputClass('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-rose-600 mt-1">{errors.dateOfBirth}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className={inputClass('gender')}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Marital Status</label>
              <select
                value={form.maritalStatus}
                onChange={(e) => updateField('maritalStatus', e.target.value)}
                className={inputClass('maritalStatus')}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nationality</label>
              <input
                type="text"
                value={form.nationality}
                onChange={(e) => updateField('nationality', e.target.value)}
                className={inputClass('nationality')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Segment</label>
              <select
                value={form.customerType}
                onChange={(e) => updateField('customerType', e.target.value)}
                className={inputClass('customerType')}
              >
                <option value="Individual">Individual</option>
                <option value="HNI">HNI</option>
                <option value="Corporate">Corporate</option>
                <option value="NRI">NRI</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-900 border-b border-slate-100 pb-2">
            2. Contact Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="personalEmail" className="block text-xs font-medium text-slate-700 mb-1">Personal Email *</label>
              <input
                id="personalEmail"
                name="personalEmail"
                type="email"
                value={form.personalEmail}
                onChange={(e) => updateField('personalEmail', e.target.value)}
                placeholder="name@example.com"
                className={inputClass('personalEmail')}
              />
              {errors.personalEmail && (
                <p className="text-xs text-rose-600 mt-1">{errors.personalEmail}</p>
              )}
            </div>
            <div>
              <label htmlFor="workEmail" className="block text-xs font-medium text-slate-700 mb-1">Work Email</label>
              <input
                id="workEmail"
                name="workEmail"
                type="email"
                value={form.workEmail}
                onChange={(e) => updateField('workEmail', e.target.value)}
                placeholder="name@company.in"
                className={inputClass('workEmail')}
              />
              {errors.workEmail && <p className="text-xs text-rose-600 mt-1">{errors.workEmail}</p>}
            </div>
            <div>
              <label htmlFor="primaryPhone" className="block text-xs font-medium text-slate-700 mb-1">Primary Phone *</label>
              <input
                id="primaryPhone"
                name="primaryPhone"
                type="text"
                value={form.primaryPhone}
                onChange={(e) => updateField('primaryPhone', e.target.value)}
                placeholder="+91 9820112233"
                className={inputClass('primaryPhone')}
              />
              {errors.primaryPhone && (
                <p className="text-xs text-rose-600 mt-1">{errors.primaryPhone}</p>
              )}
            </div>
            <div>
              <label htmlFor="alternatePhone" className="block text-xs font-medium text-slate-700 mb-1">Alternate Phone</label>
              <input
                id="alternatePhone"
                name="alternatePhone"
                type="text"
                value={form.alternatePhone}
                onChange={(e) => updateField('alternatePhone', e.target.value)}
                placeholder="+91 9820112244"
                className={inputClass('alternatePhone')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Residential Address *
              </label>
              <input
                type="text"
                value={form.residentialAddress}
                onChange={(e) => updateField('residentialAddress', e.target.value)}
                placeholder="Flat / Building / Street / Locality"
                className={inputClass('residentialAddress')}
              />
              {errors.residentialAddress && (
                <p className="text-xs text-rose-600 mt-1">{errors.residentialAddress}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Mumbai"
                className={inputClass('city')}
              />
              {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  placeholder="Maharashtra"
                  className={inputClass('state')}
                />
                {errors.state && <p className="text-xs text-rose-600 mt-1">{errors.state}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  value={form.pinCode}
                  onChange={(e) => updateField('pinCode', e.target.value)}
                  placeholder="400001"
                  maxLength={6}
                  className={inputClass('pinCode')}
                />
                {errors.pinCode && <p className="text-xs text-rose-600 mt-1">{errors.pinCode}</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-900 border-b border-slate-100 pb-2">
            3. KYC Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="panNumber" className="block text-xs font-medium text-slate-700 mb-1">PAN Number *</label>
              <input
                id="panNumber"
                name="panNumber"
                type="text"
                value={form.panNumber}
                onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                className={`${inputClass('panNumber')} font-mono uppercase`}
              />
              {errors.panNumber && <p className="text-xs text-rose-600 mt-1">{errors.panNumber}</p>}
            </div>
            <div>
              <label htmlFor="aadhaarNumber" className="block text-xs font-medium text-slate-700 mb-1">Aadhaar Number *</label>
              <input
                id="aadhaarNumber"
                name="aadhaarNumber"
                type="text"
                value={form.aadhaarNumber}
                onChange={(e) => updateField('aadhaarNumber', e.target.value)}
                placeholder="4512 8890 1123"
                maxLength={14}
                className={`${inputClass('aadhaarNumber')} font-mono`}
              />
              {errors.aadhaarNumber && (
                <p className="text-xs text-rose-600 mt-1">{errors.aadhaarNumber}</p>
              )}
            </div>
            <div>
              <label htmlFor="ckycNumber" className="block text-xs font-medium text-slate-700 mb-1">CKYC Number</label>
              <input
                id="ckycNumber"
                name="ckycNumber"
                type="text"
                value={form.ckycNumber}
                onChange={(e) => updateField('ckycNumber', e.target.value)}
                placeholder="10012345678901"
                className={`${inputClass('ckycNumber')} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="passportNumber" className="block text-xs font-medium text-slate-700 mb-1">Passport Number</label>
              <input
                id="passportNumber"
                name="passportNumber"
                type="text"
                value={form.passportNumber}
                onChange={(e) => updateField('passportNumber', e.target.value)}
                placeholder="Z4129081"
                className={`${inputClass('passportNumber')} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="voterId" className="block text-xs font-medium text-slate-700 mb-1">Voter ID</label>
              <input
                id="voterId"
                name="voterId"
                type="text"
                value={form.voterId}
                onChange={(e) => updateField('voterId', e.target.value)}
                placeholder="XYZ1234567"
                className={`${inputClass('voterId')} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="drivingLicenseNumber" className="block text-xs font-medium text-slate-700 mb-1">
                Driving License Number
              </label>
              <input
                id="drivingLicenseNumber"
                name="drivingLicenseNumber"
                type="text"
                value={form.drivingLicenseNumber}
                onChange={(e) => updateField('drivingLicenseNumber', e.target.value)}
                placeholder="MH01 20210045123"
                className={`${inputClass('drivingLicenseNumber')} font-mono`}
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-900 border-b border-slate-100 pb-2">
            4. Bank & Financial Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bankName" className="block text-xs font-medium text-slate-700 mb-1">Bank Name *</label>
              <input
                id="bankName"
                name="bankName"
                type="text"
                value={form.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                className={inputClass('bankName')}
              />
              {errors.bankName && <p className="text-xs text-rose-600 mt-1">{errors.bankName}</p>}
            </div>
            <div>
              <label htmlFor="bankAccountNumber" className="block text-xs font-medium text-slate-700 mb-1">
                Bank Account Number *
              </label>
              <input
                id="bankAccountNumber"
                name="bankAccountNumber"
                type="text"
                value={form.bankAccountNumber}
                onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                placeholder="50100239481234"
                className={`${inputClass('bankAccountNumber')} font-mono`}
              />
              {errors.bankAccountNumber && (
                <p className="text-xs text-rose-600 mt-1">{errors.bankAccountNumber}</p>
              )}
            </div>
            <div>
              <label htmlFor="ifscCode" className="block text-xs font-medium text-slate-700 mb-1">IFSC Code *</label>
              <input
                id="ifscCode"
                name="ifscCode"
                type="text"
                value={form.ifscCode}
                onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                placeholder="HDFC0000240"
                maxLength={11}
                className={`${inputClass('ifscCode')} font-mono uppercase`}
              />
              {errors.ifscCode && <p className="text-xs text-rose-600 mt-1">{errors.ifscCode}</p>}
            </div>
            <div>
              <label htmlFor="dematAccountNumber" className="block text-xs font-medium text-slate-700 mb-1">Demat Account No.</label>
              <input
                id="dematAccountNumber"
                name="dematAccountNumber"
                type="text"
                value={form.dematAccountNumber}
                onChange={(e) => updateField('dematAccountNumber', e.target.value)}
                placeholder="1208160044556677"
                className={`${inputClass('dematAccountNumber')} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Annual Income (₹)</label>
              <input
                type="number"
                value={form.annualIncome}
                onChange={(e) => updateField('annualIncome', e.target.value)}
                className={inputClass('annualIncome')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Initial Investment (₹)
              </label>
              <input
                type="number"
                value={form.investmentAmount}
                onChange={(e) => updateField('investmentAmount', e.target.value)}
                className={inputClass('investmentAmount')}
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-900 border-b border-slate-100 pb-2">
            5. Employment & Nominee Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Employer Name</label>
              <input
                type="text"
                value={form.employerName}
                onChange={(e) => updateField('employerName', e.target.value)}
                placeholder="e.g., Infosys Ltd"
                className={inputClass('employerName')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Occupation</label>
              <input
                type="text"
                value={form.occupation}
                onChange={(e) => updateField('occupation', e.target.value)}
                placeholder="e.g., Financial Analyst"
                className={inputClass('occupation')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Employment Type</label>
              <select
                value={form.employmentType}
                onChange={(e) => updateField('employmentType', e.target.value)}
                className={inputClass('employmentType')}
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business">Business</option>
                <option value="Professional">Professional</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nominee Name</label>
              <input
                type="text"
                value={form.nomineeName}
                onChange={(e) => updateField('nomineeName', e.target.value)}
                placeholder="Full Name of Nominee"
                className={inputClass('nomineeName')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nominee Relationship
              </label>
              <input
                type="text"
                value={form.nomineeRelationship}
                onChange={(e) => updateField('nomineeRelationship', e.target.value)}
                className={inputClass('nomineeRelationship')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nominee Phone</label>
              <input
                type="text"
                value={form.nomineePhoneNumber}
                onChange={(e) => updateField('nomineePhoneNumber', e.target.value)}
                placeholder="+91 9820000000"
                className={inputClass('nomineePhoneNumber')}
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800"
          >
            Submit Onboarding Application
          </button>
        </div>
      </form>
    </div>
  );
};
