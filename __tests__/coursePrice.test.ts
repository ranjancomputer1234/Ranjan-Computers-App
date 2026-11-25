import {coursePriceHeadline, coursePriceLabel} from '../src/features/catalog/coursePrice';

describe('course price labels', () => {
  it('shows the rupee amount for a paid course', () => {
    const course = {pricing: 'paid' as const, price: {amountMinor: 49900, currency: 'INR'}};
    expect(coursePriceLabel(course)).toBe('₹499');
    expect(coursePriceHeadline(course)).toBe('₹499');
  });

  it('groups larger amounts in Indian numbering', () => {
    expect(coursePriceLabel({pricing: 'paid', price: {amountMinor: 149900, currency: 'INR'}})).toBe('₹1,499');
  });

  it('keeps free courses unlabeled with a price', () => {
    expect(coursePriceLabel({pricing: 'free'})).toBe('FREE');
    expect(coursePriceHeadline({pricing: 'free', price: {amountMinor: 49900, currency: 'INR'}})).toBe('Free Course');
  });

  it('falls back to Paid when the amount is missing', () => {
    expect(coursePriceLabel({pricing: 'paid'})).toBe('PAID');
    expect(coursePriceHeadline({pricing: 'paid'})).toBe('Paid Course');
  });

  it('hides the amount after purchase', () => {
    const course = {pricing: 'paid' as const, purchased: true, price: {amountMinor: 49900, currency: 'INR'}};
    expect(coursePriceLabel(course)).toBe('PURCHASED');
    expect(coursePriceHeadline(course)).toBe('Purchased');
  });

  it('shows Enrolled once the learner is enrolled', () => {
    const course = {pricing: 'free' as const, enrolled: true};
    expect(coursePriceLabel(course)).toBe('ENROLLED');
    expect(coursePriceHeadline(course)).toBe('Enrolled');
    expect(coursePriceLabel({pricing: 'paid', enrolled: true, purchased: true, price: {amountMinor: 49900, currency: 'INR'}})).toBe('ENROLLED');
  });
});
