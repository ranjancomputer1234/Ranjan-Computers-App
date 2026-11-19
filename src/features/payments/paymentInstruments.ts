export type UpiApp = {
  id: string;
  label: string;
  probe: string;
};

export type SavedCard = {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  name: string;
};

export const UPI_APPS: UpiApp[] = [
  {id: 'gpay', label: 'Google Pay', probe: 'tez://upi/pay'},
  {id: 'phonepe', label: 'PhonePe', probe: 'phonepe://pay'},
  {id: 'paytm', label: 'Paytm', probe: 'paytmmp://pay'},
  {id: 'bhim', label: 'BHIM', probe: 'upi://pay'},
];

export const WALLETS = ['Paytm', 'Amazon Pay', 'PhonePe', 'Mobikwik', 'Freecharge'];

export const BANKS = [
  'SBI',
  'HDFC',
  'ICICI',
  'Axis',
  'Kotak',
  'PNB',
  'Bank of Baroda',
  'Canara',
  'Union Bank',
  'IDBI',
  'Yes Bank',
  'IndusInd',
];

export function digits(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCardNumber(value: string) {
  return digits(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiry(value: string) {
  const next = digits(value).slice(0, 4);
  if (next.length <= 2) return next;
  return `${next.slice(0, 2)}/${next.slice(2)}`;
}

export function cardBrand(pan: string) {
  const number = digits(pan);
  if (/^4/.test(number)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^(6|8)/.test(number)) return 'RuPay';
  return 'Card';
}

export function cvvLength(brand: string) {
  return brand === 'American Express' ? 4 : 3;
}

export function luhn(pan: string) {
  const number = digits(pan);
  if (number.length < 13 || number.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let index = number.length - 1; index >= 0; index -= 1) {
    let digit = Number(number[index]);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function cardLabel(pan: string) {
  const number = digits(pan);
  return `${cardBrand(number)} ···· ${number.slice(-4)}`;
}

export function savedCardFrom(input: {number: string; name: string; expiry: string}): SavedCard {
  const number = digits(input.number);
  const brand = cardBrand(number);
  const last4 = number.slice(-4);
  const expiry = input.expiry;
  return {id: `${brand}-${last4}-${expiry}`, brand, last4, expiry, name: input.name.trim()};
}

export function validateUpiId(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,}@[a-zA-Z]{2,}$/.test(value.trim());
}

export function validateExpiry(value: string, now = new Date()) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return 'Enter the expiry as MM/YY.';
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return 'Enter a valid expiry month.';
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  if (end.getTime() < now.getTime()) return 'This card has expired.';
  return null;
}

export function validateCard(
  input: {number: string; name: string; expiry: string; cvv: string},
  now = new Date(),
) {
  if (!luhn(input.number)) return 'Enter a valid card number.';
  if (input.name.trim().length < 2) return 'Enter the name on the card.';
  const expiryError = validateExpiry(input.expiry, now);
  if (expiryError) return expiryError;
  const length = cvvLength(cardBrand(input.number));
  if (digits(input.cvv).length !== length) return `Enter the ${length}-digit CVV.`;
  return null;
}

export function validateSavedCvv(brand: string, cvv: string) {
  const length = cvvLength(brand);
  if (digits(cvv).length !== length) return `Enter the ${length}-digit CVV.`;
  return null;
}
