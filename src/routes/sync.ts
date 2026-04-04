import { Router } from "express";
import type { Request, Response } from "express";
import { createFuturesClient } from "../auth/futures.ts";
import { createSpotClient } from "../auth/spot.ts";
import { buildFuturesTransactions } from "../utils/futures-transaction-builder.ts";
import { buildSpotTransactions } from "../utils/spot-transaction-builder.ts";
import { normalizeAsset, parsePair, sleep } from "../utils/kraken-helpers.ts";
import type { NormalizedPosition } from "../types/common.ts";
import type { SpotTrade } from "../types/kraken.ts";

function buildSpotPositionsList(tradeList: SpotTrade[]): NormalizedPosition[] {
  const openers = tradeList.filter((t) => t.posstatus === "closed" && parseFloat(t.margin || "0") > 0);
  const positions: NormalizedPosition[] = [];

  for (const opener of openers) {
    const closingTrades = tradeList.filter((t) => t.postxid === opener.txid && (t.misc || "").includes("closing"));
    const isShort = opener.type === "sell";
    const openPrice = parseFloat(opener.price);
    const openVol = parseFloat(opener.vol);
    const openCost = parseFloat(opener.cost);
    const openFee = parseFloat(opener.fee);

    let closeVol = 0, closeCost = 0, closeFee = 0;
    let closeTime = parseFloat(String(opener.time));
    for (const ct of closingTrades) {
      closeVol += parseFloat(ct.vol || "0");
      closeCost += parseFloat(ct.cost || "0");
      closeFee += parseFloat(ct.fee || "0");
      const ctTime = parseFloat(String(ct.time));
      if (ctTime > closeTime) closeTime = ctTime;
    }
    const closePrice = closeVol > 0 ? closeCost / closeVol : 0;
    const totalFee = openFee + closeFee;
    const pnl = isShort ? openCost - closeCost - totalFee : closeCost - openCost - totalFee;
    const pnlPct = openCost > 0 ? (pnl / openCost) * 100 : 0;
    const { base, quote } = parsePair((opener.pair || "").replace("/", ""));

    positions.push({
      id: opener.txid || "", positionOpened: new Date(parseFloat(String(opener.time)) * 1000).toISOString(),
      positionClosed: new Date(closeTime * 1000).toISOString(),
      side: isShort ? "Short" : "Long", market: base + "/" + quote, base, symbol: base,
      openingPrice: openPrice, closingPrice: +closePrice.toFixed(8), quantity: openVol,
      leverage: opener.leverage || "0",
      pnl: +pnl.toFixed(4), pnlPct: +pnlPct.toFixed(2), currency: quote, feeCurrency: quote,
    });
  }

  positions.sort((a, b) => new Date(b.positionOpened).getTime() - new Date(a.positionOpened).getTime());
  return positions;
}

export function createSyncRouter() {
  const router = Router();

  const futuresClient = createFuturesClient({
    publicKey: process.env.KRAKEN_FUTURES_PUBLIC_KEY!,
    privateKey: process.env.KRAKEN_FUTURES_PRIVATE_KEY!,
  });

  const spotClient = createSpotClient({
    apiKey: process.env.KRAKEN_SPOT_API_KEY!,
    apiSecret: process.env.KRAKEN_SPOT_API_SECRET!,
  });

  router.get("/", async (req: Request, res: Response) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const progress = (msg: string) => send("progress", { message: msg });

    let aborted = false;
    req.on("close", () => { aborted = true; });

    try {
      const since = Date.now() - 365 * 5 * 24 * 60 * 60 * 1000;

      // ── Futures (parallel, separate API key) ──
      progress("Fetching futures account balances...");
      const futuresPromise = (async () => {
        const balData = await futuresClient.request("/derivatives/api/v3/accounts");
        if (aborted) return null;
        progress("Futures balances loaded");

        const posData = await futuresClient.request(
          `/api/history/v3/positions?since=${since}&count=5000&sort=desc&closed=true&decreased=true&reversed=true`,
          { postDataInSign: true },
        );
        if (aborted) return null;
        progress(`Futures positions loaded: ${(posData.elements || []).length} entries`);

        const txData = await futuresClient.request(
          `/api/history/v3/account-log?since=${since}&count=5000&sort=desc`,
          { postDataInSign: true },
        );
        if (aborted) return null;
        const futuresTx = buildFuturesTransactions(txData.logs || []);
        progress(`Futures transactions loaded: ${futuresTx.length} entries`);

        return { balData, posData, futuresTx };
      })();

      // ── Spot (sequential, shared nonce) ─���
      progress("Fetching spot balances...");
      const spotBalResult = await spotClient.request("/0/private/Balance");
      if (aborted) return;
      const spotBalances: Record<string, number> = {};
      for (const [asset, amount] of Object.entries(spotBalResult)) {
        const val = parseFloat(amount as string);
        if (val > 0) spotBalances[normalizeAsset(asset)] = val;
      }
      progress(`Spot balances loaded: ${Object.keys(spotBalances).length} assets`);

      progress("Fetching spot trades history...");
      const allTrades = await spotClient.fetchAllTrades({}, (msg) => progress(msg));
      if (aborted) return;
      const spotPositions = buildSpotPositionsList(Object.values(allTrades));
      progress(`Spot positions built: ${spotPositions.length} closed positions`);

      progress("Fetching spot ledger entries...");
      const ledgers = await spotClient.fetchAllLedgers({}, (msg) => progress(msg));
      if (aborted) return;
      await sleep(3000);

      progress("Building FIFO cost basis for spot transactions...");
      const spotTransactions = await buildSpotTransactions(ledgers, allTrades, { normalizeAsset, parsePair });
      if (aborted) return;
      progress(`Spot transactions built: ${spotTransactions.length} entries`);

      // ── Wait for futures ──
      const futuresResult = await futuresPromise;
      if (aborted || !futuresResult) return;

      // ── Build balances ──
      const accounts = futuresResult.balData.accounts;
      const futBal: Record<string, unknown> = {};
      if (accounts?.flex) {
        const f = accounts.flex;
        const currencies: Record<string, unknown> = {};
        for (const [cur, info] of Object.entries(f.currencies || {})) {
          if ((info as any).quantity > 0) {
            currencies[cur] = { quantity: (info as any).quantity, valueUsd: (info as any).value, collateral: (info as any).collateral, available: (info as any).available };
          }
        }
        futBal.flex = { currencies, portfolioValue: f.portfolioValue, availableMargin: f.availableMargin, initialMargin: f.initialMargin, pnl: f.pnl, unrealizedFunding: f.unrealizedFunding };
      }
      if (accounts?.cash) {
        const nonZero: Record<string, number> = {};
        for (const [cur, val] of Object.entries(accounts.cash.balances || {})) {
          if ((val as number) > 0) nonZero[cur] = val as number;
        }
        if (Object.keys(nonZero).length > 0) futBal.cash = nonZero;
      }

      progress("All data synced successfully!");

      send("complete", {
        futuresBalances: futBal,
        spotBalances,
        futuresPositions: futuresResult.posData.elements || [],
        futuresTransactions: futuresResult.futuresTx,
        spotPositions,
        spotTransactions,
        syncedAt: Date.now(),
      });
    } catch (err: any) {
      send("error", { message: err.message || "Sync failed" });
    } finally {
      res.end();
    }
  });

  return router;
}
