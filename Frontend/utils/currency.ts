export function formatCurrency(amount: number, currency = 'INR'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(safeAmount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(isoString?: string): string {
  if (!isoString) {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}
