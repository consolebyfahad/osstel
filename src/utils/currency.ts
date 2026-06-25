function formatCompactSuffix(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(1).replace(/\.0$/, "");
}

export function formatCompactCurrency(amount: number, currency = "Rs"): string {
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    return `${prefix}${currency} ${formatCompactSuffix(abs / 1_000_000)}M`;
  }
  if (abs >= 1000) {
    return `${prefix}${currency} ${formatCompactSuffix(abs / 1000)}K`;
  }

  return `${prefix}${currency} ${abs.toLocaleString()}`;
}
