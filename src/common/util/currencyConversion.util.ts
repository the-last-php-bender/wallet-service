export class CurrencyConverter {
  static usdToCents(usd: number): number {
    if (usd < 0) throw new Error('Amount cannot be negative');
    return Math.round(usd * 100);
  }
  static centsToUsd(cents: number): number {
    return cents / 100;
  }
  static formatUsd(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }
}
