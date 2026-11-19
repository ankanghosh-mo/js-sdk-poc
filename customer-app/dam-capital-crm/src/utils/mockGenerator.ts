import {
  Customer,
  FinancialAccount,
  Transaction,
  KycStatus,
  AccountStatus,
  CustomerType,
  RiskCategory,
} from '../types/crm';
import { getFullName } from './formatters';

const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Rohan', 'Vikram', 'Siddharth', 'Karthik', 'Nikhil', 'Pranav', 'Rahul', 'Amit', 'Suresh', 'Rajesh',
  'Manish', 'Deepak', 'Anand', 'Harish', 'Gaurav', 'Varun', 'Abhishek', 'Tarun', 'Kunal', 'Devansh'
];

const FIRST_NAMES_FEMALE = [
  'Aadhya', 'Diya', 'Ananya', 'Pari', 'Myra', 'Sara', 'Ira', 'Navya', 'Kavya', 'Riya',
  'Priya', 'Neha', 'Sneha', 'Pooja', 'Anjali', 'Shruti', 'Meera', 'Swati', 'Divya', 'Nandini',
  'Rashmi', 'Sunita', 'Rekha', 'Geeta', 'Aarti', 'Bhavna', 'Chitra', 'Deepika', 'Ishita', 'Jhanvi'
];

const MIDDLE_NAMES = [
  'Kumar', 'Raj', 'Prakash', 'Mohan', 'Chandra', 'Nath', 'Devi', 'Kumari', 'Lata', 'Rani',
  'Vikram', 'Singh', 'Lal', 'Narayan', 'Shankar', '', '', '', ''
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Kulkarni', 'Deshmukh', 'Joshi',
  'Mehta', 'Shah', 'Agarwal', 'Gupta', 'Bansal', 'Malhotra', 'Kapoor', 'Khanna', 'Chatterjee', 'Banerjee',
  'Mukherjee', 'Das', 'Bose', 'Sen', 'Rao', 'Chaudhary', 'Yadav', 'Tiwari', 'Pandey', 'Mishra'
];

const CITIES: { city: string; state: string; pinPrefix: string }[] = [
  { city: 'Mumbai', state: 'Maharashtra', pinPrefix: '400' },
  { city: 'Pune', state: 'Maharashtra', pinPrefix: '411' },
  { city: 'Bengaluru', state: 'Karnataka', pinPrefix: '560' },
  { city: 'New Delhi', state: 'Delhi', pinPrefix: '110' },
  { city: 'Gurugram', state: 'Haryana', pinPrefix: '122' },
  { city: 'Hyderabad', state: 'Telangana', pinPrefix: '500' },
  { city: 'Chennai', state: 'Tamil Nadu', pinPrefix: '600' },
  { city: 'Kolkata', state: 'West Bengal', pinPrefix: '700' },
  { city: 'Ahmedabad', state: 'Gujarat', pinPrefix: '380' },
  { city: 'Jaipur', state: 'Rajasthan', pinPrefix: '302' },
];

const STREETS = [
  'Nariman Point', 'Bandra Kurla Complex', 'Worli Sea Face', 'Indiranagar 100ft Road',
  'Koramangala 4th Block', 'Connaught Place', 'DLF Cyber City', 'Banjara Hills Road No 12',
  'Anna Salai', 'Park Street', 'SG Highway', 'C-Scheme'
];

const BANKS: { name: string; ifscPrefix: string }[] = [
  { name: 'HDFC Bank', ifscPrefix: 'HDFC000' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC000' },
  { name: 'State Bank of India', ifscPrefix: 'SBIN000' },
  { name: 'Axis Bank', ifscPrefix: 'UTIB000' },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK000' },
  { name: 'IndusInd Bank', ifscPrefix: 'INDB000' },
];

const EMPLOYERS = [
  'Tata Consultancy Services', 'Infosys Ltd', 'Reliance Industries', 'HDFC Asset Management',
  'Wipro Technologies', 'Larsen & Toubro', 'Bharti Airtel', 'Mahindra & Mahindra',
  'Hindustan Unilever', 'ICICI Securities', 'Bajaj Finserv', 'Self-Owned Enterprise'
];

const OCCUPATIONS = [
  'Software Architect', 'Investment Analyst', 'Chartered Accountant', 'Corporate Lawyer',
  'Managing Director', 'Medical Surgeon', 'Business Owner', 'Vice President - Finance',
  'Senior Consultant', 'Product Director'
];

const OFFICERS = [
  'R. Subramanian', 'Meenakshi Pillai', 'Sandeep Deshpande', 'Kavita Krishnan', 'Arvind Swaminathan'
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSyntheticData(count: number = 100): {
  customers: Customer[];
  accounts: FinancialAccount[];
  transactions: Transaction[];
} {
  const rand = mulberry32(20261119);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const randDigits = (len: number) =>
    Array.from({ length: len }, () => Math.floor(rand() * 10)).join('');
  const randLetters = (len: number) =>
    Array.from({ length: len }, () => String.fromCharCode(65 + Math.floor(rand() * 26))).join('');

  const customers: Customer[] = [];
  const accounts: FinancialAccount[] = [];
  const transactions: Transaction[] = [];

  const kycStatuses: KycStatus[] = ['Verified', 'Verified', 'Verified', 'Pending', 'Under Review', 'Rejected'];
  const accountStatuses: AccountStatus[] = ['Active', 'Active', 'Active', 'Active', 'Inactive', 'Dormant', 'Suspended'];
  const customerTypes: CustomerType[] = ['Individual', 'Individual', 'HNI', 'Corporate', 'NRI'];
  const riskCategories: RiskCategory[] = ['Low', 'Low', 'Low', 'Medium', 'Medium', 'High'];
  const employmentTypes: Customer['employmentType'][] = ['Salaried', 'Self-Employed', 'Business', 'Professional', 'Retired'];
  const relationships = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother'];

  for (let i = 1; i <= count; i++) {
    const isFemale = rand() > 0.48;
    const gender: Customer['gender'] = isFemale ? 'Female' : 'Male';
    const firstName = isFemale ? pick(FIRST_NAMES_FEMALE) : pick(FIRST_NAMES_MALE);
    const middleName = pick(MIDDLE_NAMES);
    const lastName = pick(LAST_NAMES);
    const fullName = getFullName({ firstName, middleName, lastName });

    const customerId = `DAM-${String(10000 + i)}`;
    const cityInfo = pick(CITIES);
    const pinCode = `${cityInfo.pinPrefix}${randDigits(3)}`;
    const flatNo = `${randInt(101, 2404)}, Tower ${randLetters(1)}`;
    const street = pick(STREETS);
    const residentialAddress = `${flatNo}, ${street}, ${cityInfo.city}, ${cityInfo.state} - ${pinCode}`;

    const bank = pick(BANKS);
    const bankAccountNumber = `${randInt(10, 99)}${randDigits(12)}`;
    const ifscCode = `${bank.ifscPrefix}${randDigits(4)}`;

    const custType = pick(customerTypes);
    const fourthChar = custType === 'Corporate' ? 'C' : 'P';
    const panNumber = `${randLetters(3)}${fourthChar}${lastName[0].toUpperCase()}${randDigits(4)}${randLetters(1)}`;

    const aadhaarNumber = `${randInt(2, 9)}${randDigits(3)} ${randDigits(4)} ${randDigits(4)}`;

    const annualIncome = custType === 'HNI' || custType === 'Corporate'
      ? randInt(50, 450) * 100000
      : randInt(8, 48) * 100000;
    const netWorth = Math.round(annualIncome * (2.5 + rand() * 6));
    const investmentAmount = Math.round(netWorth * (0.25 + rand() * 0.45));

    const kycStatus = pick(kycStatuses);
    const accountStatus = pick(accountStatuses);
    const riskCategory = pick(riskCategories);

    const birthYear = randInt(1962, 2001);
    const birthMonth = String(randInt(1, 12)).padStart(2, '0');
    const birthDay = String(randInt(1, 28)).padStart(2, '0');

    const createdMonth = String(randInt(1, 11)).padStart(2, '0');
    const createdDay = String(randInt(1, 28)).padStart(2, '0');
    const createdYear = rand() > 0.35 ? '2026' : '2025';
    const createdAt = `${createdYear}-${createdMonth}-${createdDay}`;

    const emailSlug = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;

    const nomineeFirst = pick(isFemale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
    const emergencyFirst = pick(FIRST_NAMES_MALE);

    const customer: Customer = {
      customerId,
      firstName,
      middleName,
      lastName,
      dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
      gender,
      maritalStatus: birthYear < 1995 ? 'Married' : pick(['Single', 'Married']),
      nationality: custType === 'NRI' ? 'Indian (NRI)' : 'Indian',

      personalEmail: `${emailSlug}@gmail.com`,
      workEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@corpindia.in`,
      primaryPhone: `+91 ${randInt(70, 99)}${randDigits(8)}`,
      alternatePhone: `+91 ${randInt(70, 99)}${randDigits(8)}`,
      residentialAddress,
      permanentAddress: residentialAddress,
      city: cityInfo.city,
      state: cityInfo.state,
      pinCode,
      country: 'India',

      panNumber,
      aadhaarNumber,
      passportNumber: `${randLetters(1)}${randDigits(7)}`,
      voterId: `${randLetters(3)}${randDigits(7)}`,
      drivingLicenseNumber: `${cityInfo.state.slice(0, 2).toUpperCase()}${randDigits(2)} ${randInt(2005, 2024)}${randDigits(7)}`,
      ckycNumber: `100${randDigits(11)}`,

      bankAccountNumber,
      ifscCode,
      bankName: bank.name,
      accountHolderName: fullName,
      dematAccountNumber: `12081600${randDigits(8)}`,
      tradingAccountNumber: `DC${randDigits(7)}`,
      annualIncome,
      netWorth,
      investmentAmount,

      employerName: pick(EMPLOYERS),
      occupation: pick(OCCUPATIONS),
      designation: pick(['AVP', 'VP', 'Director', 'Senior Manager', 'Partner', 'Principal Consultant']),
      employmentType: pick(employmentTypes),
      annualSalary: Math.round(annualIncome * 0.85),
      officeAddress: `Plot ${randInt(10, 95)}, Financial District, ${cityInfo.city}, ${cityInfo.state}`,

      nomineeName: `${nomineeFirst} ${lastName}`,
      nomineeRelationship: pick(relationships),
      nomineePhoneNumber: `+91 ${randInt(70, 99)}${randDigits(8)}`,
      emergencyContact: `${emergencyFirst} ${pick(LAST_NAMES)}`,
      emergencyContactPhone: `+91 ${randInt(70, 99)}${randDigits(8)}`,

      customerType: custType,
      accountStatus,
      kycStatus,
      riskCategory,
      verificationDate: kycStatus === 'Verified' ? createdAt : '',
      assignedOfficer: pick(OFFICERS),
      createdAt,
    };

    customers.push(customer);

    const primaryAccId = `ACC-${String(50000 + i * 2 - 1)}`;
    accounts.push({
      accountId: primaryAccId,
      customerId,
      customerName: fullName,
      bankName: bank.name,
      accountNumber: bankAccountNumber,
      ifsc: ifscCode,
      accountType: custType === 'HNI' ? 'Portfolio PMS' : custType === 'Corporate' ? 'Current' : 'Savings',
      accountBalance: Math.round(investmentAmount * 0.4),
      accountStatus,
    });

    if (i <= Math.min(count, 150) && rand() > 0.5) {
      accounts.push({
        accountId: `ACC-${String(50000 + i * 2)}`,
        customerId,
        customerName: fullName,
        bankName: 'DAM Capital Custody',
        accountNumber: customer.tradingAccountNumber,
        ifsc: 'HDFC0000240',
        accountType: 'Demat Cash',
        accountBalance: Math.round(investmentAmount * 0.15),
        accountStatus: 'Active',
      });
    }

    if (i <= Math.min(count, 120)) {
      const txTypes: Transaction['transactionType'][] = [
        'Equity Buy', 'Equity Sell', 'Funds Deposit', 'Funds Withdrawal', 'IPO Application', 'Dividend Credit'
      ];
      const txStatuses: Transaction['transactionStatus'][] = ['Completed', 'Completed', 'Completed', 'Pending', 'Processing', 'Failed'];

      for (let t = 0; t < 2; t++) {
        const txMonth = String(randInt(1, 11)).padStart(2, '0');
        const txDay = String(randInt(1, 28)).padStart(2, '0');
        transactions.push({
          transactionId: `TXN-2026-${String(100000 + i * 10 + t)}`,
          customerId,
          customerName: fullName,
          accountNumber: bankAccountNumber,
          transactionDate: `2026-${txMonth}-${txDay}`,
          transactionType: pick(txTypes),
          amount: randInt(25, 4500) * 1000,
          transactionStatus: pick(txStatuses),
        });
      }
    }
  }

  return { customers, accounts, transactions };
}
