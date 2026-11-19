// The data kinds an admin can pick, with the UEM field code and the masking each style stands for.
// A style is [key, label, example shown in the console, masking-core mask used in the map].
// Only masks the SDK engine (V12) can do are offered: FULL, PARTIAL, RANGE, PATTERN. There is no email or
// word-by-word masking yet, so those kinds only offer "Hide all".
const FULL = { function: 'FULL_MASK', params: {} };
const partial = (showFirst, showLast) => ({ function: 'PARTIAL_MASK', params: { showFirst, showLast } });

export const KINDS = {
  pan: { name: 'PAN card', code: 'PAN', tile: 'PAN', rule: '5 letters, 4 digits and 1 letter', sample: 'ABCDE1234F',
    styles: [['ends', 'Keep first 3 and last 2', 'ABC*****4F', partial(3, 2)], ['last4', 'Keep last 4', '******234F', partial(0, 4)], ['all', 'Hide all', '**********', FULL]],
    suggest: ['pan', 'panNo', 'panNumber', 'pan_no', 'PAN Number'] },
  mobile: { name: 'Mobile number', code: 'MOBILE_NUMBER', tile: 'TEL', rule: '10-digit Indian mobile numbers', sample: '9876543210',
    styles: [['last4', 'Keep last 4', '******3210', partial(0, 4)], ['ends', 'Keep first and last 2', '98******10', partial(2, 2)], ['all', 'Hide all', '**********', FULL]],
    suggest: ['mobile', 'mobileNo', 'userMobile', 'phone', 'phoneNumber'] },
  email: { name: 'Email address', code: 'EMAIL', tile: '@', rule: 'name@domain addresses', sample: 'rahul@example.com',
    styles: [['all', 'Hide all', '*************.***', FULL]],
    suggest: ['contactEmail', 'Email', 'email', 'emailId'] },
  name: { name: 'Full name', code: 'FULL_NAME', tile: 'AB', rule: 'words in name fields', sample: 'Rahul Verma',
    styles: [['all', 'Hide all', '***** *****', FULL]],
    suggest: ['fullName', 'customerName', 'Name', 'name'] },
  dob: { name: 'Date of birth', code: 'DATE_OF_BIRTH', tile: 'DOB', rule: 'dates written as DD/MM/YYYY', sample: '14/08/1990',
    styles: [['year', 'Keep year', '**/**/1990', partial(0, 4)], ['all', 'Hide all', '**/**/****', FULL]],
    suggest: ['dob', 'dateOfBirth', 'birthDate', 'DOB'] },
  aadhaar: { name: 'Aadhaar number', code: 'AADHAAR', tile: 'UID', rule: '12 digits with a valid checksum', sample: '2345 6789 0123',
    styles: [['last4', 'Keep last 4', '**** **** 0123', partial(0, 4)], ['ends', 'Keep first and last 4', '2345 **** 0123', partial(4, 4)], ['all', 'Hide all', '**** **** ****', FULL]],
    suggest: ['aadhaar', 'aadhaarNumber', 'aadhaar-number', 'aadhaar_no', 'Aadhaar No', 'aadhar'] },
  bank: { name: 'Bank account number', code: 'ACCOUNT_NUMBER', tile: 'ACC', rule: 'account numbers of 9 to 18 digits', sample: '50100234567891',
    styles: [['last4', 'Keep last 4', '**********7891', partial(0, 4)], ['all', 'Hide all', '**************', FULL]],
    suggest: ['accountNo', 'accountNumber', 'acctNo', 'bankAccount'] },
};

// The design's sample data. Pages are matched as "this page and everything below it" (V12).
export const SAMPLE_PAGES = [
  { id: 'p1', path: '/profile', match: 'Page and below', on: true },
  { id: 'p2', path: '/customers', match: 'Page and below', on: true },
  { id: 'p3', path: '/legacy', match: 'Page and below', on: true },
  { id: 'p4', path: '/login', match: 'Page and below', on: false },
];

export const SAMPLE_FIELDS = [
  { id: 'f1', kind: 'pan', words: ['pan', 'panNo', 'panNumber', 'pan_no'], style: 'ends', scope: 'all', pages: [], reveal: false, ok: true, draft: null },
  { id: 'f2', kind: 'mobile', words: ['mobile', 'mobileNo', 'userMobile', 'phone'], style: 'last4', scope: 'except', pages: ['p2'], reveal: false, ok: true, draft: 'edited' },
  { id: 'f3', kind: 'email', words: ['contactEmail', 'Email'], style: 'all', scope: 'all', pages: [], reveal: false, ok: true, draft: null },
  { id: 'f4', kind: 'name', words: ['fullName', 'customerName', 'Name'], style: 'all', scope: 'all', pages: [], reveal: true, ok: true, draft: null },
  { id: 'f5', kind: 'dob', words: ['dob', 'dateOfBirth'], style: 'year', scope: 'only', pages: ['p1', 'p2'], reveal: false, ok: true, draft: 'new' },
  { id: 'f6', kind: 'aadhaar', words: ['aadhaarNo', 'Aadhaar'], style: 'last4', scope: 'only', pages: ['p1'], reveal: false, ok: true, draft: 'new' },
];

export function maskOf(field) {
  const k = KINDS[field.kind];
  const st = k.styles.find((s) => s[0] === field.style) || k.styles[0];
  return st[3];
}
