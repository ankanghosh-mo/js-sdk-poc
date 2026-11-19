export type KycStatus = 'Verified' | 'Pending' | 'Rejected' | 'Under Review';
export type AccountStatus = 'Active' | 'Inactive' | 'Suspended' | 'Dormant';
export type CustomerType = 'Individual' | 'HNI' | 'Corporate' | 'NRI';
export type RiskCategory = 'Low' | 'Medium' | 'High';

export interface Customer {
  // Personal Information
  customerId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  nationality: string;

  // Contact Information
  personalEmail: string;
  workEmail: string;
  primaryPhone: string;
  alternatePhone: string;
  residentialAddress: string;
  permanentAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;

  // Government Identification / KYC
  panNumber: string;
  aadhaarNumber: string;
  passportNumber: string;
  voterId: string;
  drivingLicenseNumber: string;
  ckycNumber: string;

  // Financial Information
  bankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  dematAccountNumber: string;
  tradingAccountNumber: string;
  annualIncome: number;
  netWorth: number;
  investmentAmount: number;

  // Employment Information
  employerName: string;
  occupation: string;
  designation: string;
  employmentType: 'Salaried' | 'Self-Employed' | 'Business' | 'Retired' | 'Professional';
  annualSalary: number;
  officeAddress: string;

  // Additional Information
  nomineeName: string;
  nomineeRelationship: string;
  nomineePhoneNumber: string;
  emergencyContact: string;
  emergencyContactPhone: string;

  // CRM & Compliance Metadata
  customerType: CustomerType;
  accountStatus: AccountStatus;
  kycStatus: KycStatus;
  riskCategory: RiskCategory;
  verificationDate: string;
  assignedOfficer: string;
  createdAt: string;
}

export interface FinancialAccount {
  accountId: string;
  customerId: string;
  customerName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountType: 'Savings' | 'Current' | 'Portfolio PMS' | 'Demat Cash';
  accountBalance: number;
  accountStatus: AccountStatus;
}

export interface Transaction {
  transactionId: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  transactionDate: string;
  transactionType: 'Equity Buy' | 'Equity Sell' | 'Funds Deposit' | 'Funds Withdrawal' | 'IPO Application' | 'Dividend Credit';
  amount: number;
  transactionStatus: 'Completed' | 'Pending' | 'Failed' | 'Processing';
}
