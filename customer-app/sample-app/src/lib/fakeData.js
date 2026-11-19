// Deterministic fake customer data (seeded PRNG, no unseeded Math.random).

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kavya', 'Meera', 'Pooja', 'Neha', 'Riya', 'Sneha'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Iyer', 'Nair', 'Reddy', 'Patel', 'Shah', 'Mehta', 'Rao',
  'Kulkarni', 'Banerjee', 'Das', 'Joshi', 'Menon', 'Singh', 'Kapoor', 'Chopra', 'Bose', 'Pillai'];
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Kochi', 'Indore'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
const digit = (rnd) => String(Math.floor(rnd() * 10));
const letter = (rnd) => LETTERS[Math.floor(rnd() * 26)];

function pan(rnd) {
  let s = '';
  for (let i = 0; i < 5; i++) s += letter(rnd);
  for (let i = 0; i < 4; i++) s += digit(rnd);
  return s + letter(rnd);
}

function mobile(rnd) {
  let s = pick(rnd, ['9', '8', '7']);
  for (let i = 0; i < 9; i++) s += digit(rnd);
  return s;
}

function aadhaar(rnd) {
  // Aadhaar numbers never start with 0 or 1.
  let s = String(2 + Math.floor(rnd() * 8));
  for (let i = 0; i < 11; i++) s += digit(rnd);
  return `${s.slice(0, 4)} ${s.slice(4, 8)} ${s.slice(8, 12)}`;
}

/** The customer with the given numeric id; the same id always gives the same customer. */
export function makeCustomer(id) {
  const rnd = mulberry32(Math.imul(id, 2654435761) ^ 0x5eed);
  return {
    id,
    name: `${pick(rnd, FIRST)} ${pick(rnd, LAST)}`,
    pan: pan(rnd),
    mobile: mobile(rnd),
    city: pick(rnd, CITIES),
    aadhaar: aadhaar(rnd),
  };
}

/** `count` customers with consecutive ids starting at `startId`. */
export function makeCustomers(startId, count) {
  const out = new Array(count);
  for (let i = 0; i < count; i++) out[i] = makeCustomer(startId + i);
  return out;
}
