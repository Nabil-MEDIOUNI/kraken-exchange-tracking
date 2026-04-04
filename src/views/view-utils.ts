let cachedEurUsdRate = 1.155;
let rateLastFetched = 0;

export async function refreshEurUsdRate(): Promise<void> {
  if (Date.now() - rateLastFetched < 10 * 60 * 1000) return;
  try {
    const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=EURUSD");
    const data = await res.json();
    const ticker = data.result?.EURUSD || data.result?.ZEURZUSD;
    if (ticker) { cachedEurUsdRate = parseFloat(ticker.c[0]); rateLastFetched = Date.now(); }
  } catch { /* keep fallback */ }
}
