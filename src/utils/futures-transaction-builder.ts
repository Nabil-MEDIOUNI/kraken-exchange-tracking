import type { AccountLog } from "../types/kraken.ts";
import type { FuturesTransaction } from "../types/common.ts";

/**
 * Returns the 8-hour funding window key for a given date.
 * Kraken futures funding happens at 00:00, 08:00, 16:00 UTC.
 * Trades within the same window get aggregated into one Realized P&L row
 * (matching Koinly's display behavior).
 */
function fundingWindowKey(dateStr: string, contract: string): string {
  const d = new Date(dateStr);
  const h = d.getUTCHours();
  const window = h < 8 ? "00" : h < 16 ? "08" : "16";
  const day = d.toISOString().substring(0, 10);
  return `${day}|${window}|${contract}`;
}

export function buildFuturesTransactions(logs: AccountLog[]): FuturesTransaction[] {
  const transactions: FuturesTransaction[] = [];

  // Group trades by 8-hour funding window + contract (matches Koinly's aggregation)
  const tradeGroups: Record<string, AccountLog[]> = {};
  for (const log of logs) {
    if (log.info?.toLowerCase() === "futures trade") {
      const key = fundingWindowKey(log.date, log.contract);
      if (!tradeGroups[key]) tradeGroups[key] = [];
      tradeGroups[key].push(log);
    }
  }
  for (const entries of Object.values(tradeGroups)) {
    let totalFee = 0, totalPnL = 0;
    // Use the latest entry's date as the display date
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const { date, contract, asset } = entries[0];
    for (const entry of entries) { totalFee += entry.fee || 0; totalPnL += entry.realized_pnl || 0; }
    transactions.push({
      type: "Realized P&L", date, contract,
      currency: asset?.toUpperCase() || "USD",
      amount: +(totalPnL - totalFee).toFixed(4),
      fee: +totalFee.toFixed(6),
      realizedPnL: +totalPnL.toFixed(6),
      tag: "futures trade",
    });
  }

  // Group funding fees by 8-hour window + contract (matches Koinly's aggregation)
  const fundingLogs = logs.filter((l) => l.info?.toLowerCase() === "funding rate change").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const fundingGroups: Record<string, AccountLog[]> = {};
  for (const log of fundingLogs) {
    const key = fundingWindowKey(log.date, log.contract);
    if (!fundingGroups[key]) fundingGroups[key] = [];
    fundingGroups[key].push(log);
  }
  for (const entries of Object.values(fundingGroups)) {
    let total = 0;
    for (const entry of entries) total += entry.realized_funding ?? (entry.new_balance - entry.old_balance);
    const latest = entries[entries.length - 1];
    transactions.push({
      type: "Funding fee", date: latest.date, contract: latest.contract,
      currency: latest.asset?.toUpperCase() || "USD",
      amount: +total.toFixed(6),
    });
  }

  for (const log of logs) {
    if (log.info === "cross-exchange transfer") {
      const amount = log.new_balance - log.old_balance;
      transactions.push({
        type: amount > 0 ? "Deposit" : "Withdrawal",
        date: log.date,
        currency: log.asset?.toUpperCase() || "USD",
        amount: +Math.abs(amount).toFixed(4),
      });
    }
  }

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return transactions;
}
