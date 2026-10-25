export function inr(minor: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {style: 'currency', currency, minimumFractionDigits: minor % 100 === 0 ? 0 : 2}).format(minor / 100);
}
