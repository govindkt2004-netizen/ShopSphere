/**
 * Standard Indian Rupee (INR - ₹) Currency Formatter
 * Formats numbers into Indian Numbering System (e.g. ₹1,499, ₹24,999, ₹1,25,000)
 */
export const formatINR = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0';
  }
  const num = Number(amount);
  return `₹${num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2
  })}`;
};

export const formatPrice = formatINR;
export const formatCurrency = formatINR;
