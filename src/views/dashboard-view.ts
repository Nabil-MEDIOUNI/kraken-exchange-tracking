import { BASE_STYLES, TABLE_STYLES, CARD_STYLES } from "./view-utils.ts";

const DASHBOARD_STYLES = `
  ${BASE_STYLES}
  ${TABLE_STYLES}
  ${CARD_STYLES}

  body { overflow-x: hidden; }

  .dashboard { max-width: 1200px; margin: 0 auto; padding: 20px 24px; }

  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .header-logo { width: 38px; height: 38px; border-radius: 50%; background: #5741d9; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; }
  .header-title { font-size: 20px; font-weight: 600; color: #eaecef; }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .sync-btn { background: #5741d9; color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.2s; }
  .sync-btn:hover { background: #6b57e0; }
  .sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .sync-btn .spinner { display: none; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
  .sync-btn.loading .spinner { display: inline-block; }
  .sync-btn.loading .sync-icon { display: none; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .last-sync { font-size: 11px; color: #848e9c; }

  /* Year filter */
  .year-select { background: #1e2329; color: #eaecef; border: 1px solid #2b3139; border-radius: 6px; padding: 7px 12px; font-size: 13px; cursor: pointer; outline: none; }
  .year-select:focus { border-color: #5741d9; }

  /* Summary cards */
  .cards-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .summary-card { background: #1e2329; border-radius: 10px; padding: 20px 24px; }
  .card-label { font-size: 11px; color: #848e9c; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .card-value { font-size: 26px; font-weight: 600; color: #eaecef; }
  .card-value.positive { color: #0ecb81; }
  .card-value.negative { color: #f6465d; }
  .card-sub { font-size: 12px; color: #848e9c; margin-top: 6px; display: flex; gap: 16px; }
  .card-sub .wins { color: #0ecb81; }
  .card-sub .losses { color: #f6465d; }

  /* Tabs */
  .tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid #2b3139; }
  .tab { padding: 10px 20px; font-size: 13px; font-weight: 500; color: #848e9c; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; }
  .tab:hover { color: #eaecef; }
  .tab.active { color: #eaecef; border-bottom-color: #5741d9; }

  /* View panels */
  .view-panel { display: none; }
  .view-panel.active { display: block; }

  /* Loading overlay */
  .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(11,14,17,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; }
  .loading-overlay .big-spinner { width: 48px; height: 48px; border: 3px solid rgba(87,65,217,0.2); border-top-color: #5741d9; border-radius: 50%; animation: spin 0.8s linear infinite; }
  .loading-overlay .loading-text { color: #848e9c; font-size: 14px; margin-top: 16px; }
  .loading-overlay.hidden { display: none; }

  /* Embedded views */
  .view-panel .table-container { width: 100%; overflow-x: auto; }
  .view-panel table { min-width: 900px; }

  /* Positions icon styles */
  .icon-btc { background: #f7931a; } .icon-eth { background: #627eea; }
  .icon-sol { background: #9945ff; } .icon-doge { background: #c2a633; }
  .icon-pepe { background: #4a8c3f; } .icon-default { background: #555; }

  /* Empty state */
  .empty-state { text-align: center; padding: 60px 20px; color: #848e9c; font-size: 14px; }

  /* Balance breakdown */
  .balance-breakdown { margin-top: 8px; display: flex; gap: 16px; font-size: 12px; }
  .balance-breakdown span { color: #848e9c; }
`;

export function buildDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kraken Portfolio Dashboard</title>
  <style>${DASHBOARD_STYLES}</style>
</head>
<body>
  <div class="loading-overlay" id="loadingOverlay">
    <div class="big-spinner"></div>
    <div class="loading-text" id="loadingText">Loading portfolio data...</div>
  </div>

  <div class="dashboard">
    <div class="header">
      <div class="header-left">
        <div class="header-logo">K</div>
        <span class="header-title">Portfolio Dashboard</span>
      </div>
      <div class="header-right">
        <span class="last-sync" id="lastSync"></span>
        <select class="year-select" id="yearSelect"><option value="all">All Years</option></select>
        <button class="sync-btn" id="syncBtn" onclick="syncData()">
          <span class="sync-icon">\u21BB</span>
          <span class="spinner"></span>
          Sync
        </button>
      </div>
    </div>

    <div class="cards-row">
      <div class="summary-card">
        <div class="card-label">Kraken Balance</div>
        <div class="card-value" id="totalBalance">-</div>
        <div class="balance-breakdown" id="balanceBreakdown"></div>
      </div>
      <div class="summary-card">
        <div class="card-label">Futures P&amp;L</div>
        <div class="card-value" id="futuresPnl">-</div>
        <div class="card-sub" id="futuresPnlSub">-</div>
      </div>
      <div class="summary-card">
        <div class="card-label">Spot P&amp;L</div>
        <div class="card-value" id="spotPnl">-</div>
        <div class="card-sub" id="spotPnlSub">-</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" data-view="futures-positions">Futures Positions</button>
      <button class="tab" data-view="futures-transactions">Futures Transactions</button>
      <button class="tab" data-view="spot-positions">Spot Positions</button>
      <button class="tab" data-view="spot-transactions">Spot Transactions</button>
    </div>

    <div class="view-panel active" id="view-futures-positions"></div>
    <div class="view-panel" id="view-futures-transactions"></div>
    <div class="view-panel" id="view-spot-positions"></div>
    <div class="view-panel" id="view-spot-transactions"></div>
  </div>

<script>
const STORAGE_KEY = 'kraken_dashboard_data';
const CRYPTO_ICONS = {
  BTC:{bg:'#f7931a',l:'B'},ETH:{bg:'#627eea',l:'E'},SOL:{bg:'#9945ff',l:'S'},
  DOGE:{bg:'#c2a633',l:'D'},PEPE:{bg:'#4a8c3f',l:'P'},XRP:{bg:'#23292f',l:'X'},
  ADA:{bg:'#0033ad',l:'A'},DOT:{bg:'#e6007a',l:'D'},LTC:{bg:'#bfbbbb',l:'L'},
};
const ICON_CLASSES = {btc:'icon-btc',eth:'icon-eth',sol:'icon-sol',doge:'icon-doge',pepe:'icon-pepe'};

let allData = null;

// ── Data fetching via SSE ──
function streamSync(onProgress, onComplete, onError) {
  const es = new EventSource('/sync');
  es.addEventListener('progress', function(e) {
    onProgress(JSON.parse(e.data).message);
  });
  es.addEventListener('complete', function(e) {
    es.close();
    onComplete(JSON.parse(e.data));
  });
  es.addEventListener('error', function(e) {
    // SSE fires generic error on stream close — only handle real errors
    if (es.readyState === EventSource.CLOSED) return;
    es.close();
    try {
      const d = JSON.parse(e.data);
      onError(d.message || 'Sync failed');
    } catch {
      onError('Connection lost during sync');
    }
  });
  return es;
}

function saveToStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Sync button ──
function syncData() {
  const btn = document.getElementById('syncBtn');
  btn.classList.add('loading');
  btn.disabled = true;
  showLoading('Connecting to Kraken APIs...');

  streamSync(
    function(msg) { updateLoadingText(msg); },
    function(data) {
      allData = data;
      saveToStorage(allData);
      renderDashboard();
      btn.classList.remove('loading');
      btn.disabled = false;
      hideLoading();
    },
    function(errMsg) {
      console.error('Sync failed:', errMsg);
      updateLoadingText('Sync failed: ' + errMsg);
      setTimeout(hideLoading, 3000);
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  );
}
window.syncData = syncData;

// ── Loading overlay ──
function updateLoadingText(text) {
  document.getElementById('loadingText').textContent = text;
}
function showLoading(text) {
  const el = document.getElementById('loadingOverlay');
  updateLoadingText(text || 'Loading...');
  el.classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

// ── Year filter ──
function getAvailableYears() {
  if (!allData) return [];
  const years = new Set();
  for (const tx of allData.futuresTransactions) {
    if (tx.date) years.add(new Date(tx.date).getFullYear());
  }
  for (const tx of allData.spotTransactions) {
    if (tx.date) years.add(new Date(tx.date).getFullYear());
  }
  for (const el of allData.futuresPositions) {
    const ts = el.timestamp || (el.event?.PositionUpdate?.fillTime);
    if (ts) years.add(new Date(ts).getFullYear());
  }
  for (const p of allData.spotPositions) {
    if (p.positionClosed) years.add(new Date(p.positionClosed).getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

function populateYearDropdown() {
  const select = document.getElementById('yearSelect');
  const current = select.value || getUrlParams().year;
  select.innerHTML = '<option value="all">All Years</option>';
  for (const y of getAvailableYears()) {
    select.innerHTML += '<option value="' + y + '"' + (String(y) === current ? ' selected' : '') + '>' + y + '</option>';
  }
}

function getSelectedYear() {
  const val = document.getElementById('yearSelect').value;
  return val === 'all' ? null : parseInt(val);
}

function filterByYear(items, dateField, year) {
  if (!year) return items;
  return items.filter(item => {
    const d = item[dateField];
    return d && new Date(d).getFullYear() === year;
  });
}

function filterFuturesPositionsByYear(elements, year) {
  if (!year) return elements;
  return elements.filter(el => {
    const ts = el.timestamp || (el.event?.PositionUpdate?.fillTime);
    return ts && new Date(ts).getFullYear() === year;
  });
}

// ── Formatting helpers ──
function fmt(n, decimals) {
  if (decimals === undefined) decimals = 2;
  return Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
}
function fmtCurrency(n, sym) {
  const sign = n >= 0 ? '+' : '-';
  return sign + fmt(n) + ' ' + sym;
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {month:'numeric',day:'numeric',year:'2-digit'});
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit',hour12:true});
}
function fmtDateTime(iso) {
  return fmtDate(iso) + ' ' + fmtTime(iso);
}
function fmtPrice(p) {
  if (p < 0.01) return p.toFixed(6);
  if (p < 1) return p.toFixed(4);
  return p.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtQty(q, sym) {
  if (q >= 1000) return q.toLocaleString('en-US', {maximumFractionDigits:0}) + ' ' + sym;
  if (q >= 1) return q.toFixed(2) + ' ' + sym;
  return q.toFixed(4) + ' ' + sym;
}
function fmtAbs(v) {
  const a = Math.abs(typeof v === 'string' ? parseFloat(v) : v);
  if (a >= 1) return a.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  if (a >= 0.01) return a.toFixed(4);
  return a.toFixed(8);
}
function csym(c) { return c === 'EUR' ? '\\u20AC' : c === 'USD' ? '$' : c; }

// ── EUR/USD rate (fetched once from Kraken public API) ──
let eurUsdRate = null;
async function fetchEurUsdRate() {
  try {
    const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=EURUSD');
    const data = await res.json();
    const ticker = data.result?.EURUSD || data.result?.ZEURZUSD;
    if (ticker) eurUsdRate = parseFloat(ticker.c[0]);
  } catch {}
}
function usdToEur(usd) {
  if (!eurUsdRate) return null;
  return usd / eurUsdRate;
}

// ── Balance computation ──
function computeBalances() {
  let futEur = 0, futUsd = 0;
  const flex = allData.futuresBalances?.flex;
  if (flex?.currencies) {
    for (const [cur, info] of Object.entries(flex.currencies)) {
      if (cur === 'EUR') futEur += info.quantity || 0;
      else if (cur === 'USD') futUsd += info.quantity || 0;
    }
  }
  const sb = allData.spotBalances || {};
  const spotEur = sb.EUR || 0;
  const totalEur = futEur + spotEur;
  const usdInEur = usdToEur(futUsd);
  const grandTotalEur = usdInEur !== null ? totalEur + usdInEur : null;
  return { futEur, futUsd, spotEur, totalEur, grandTotalEur };
}

// ── P&L computation ──
function computePnl(year) {
  const futPositions = filterFuturesPositionsByYear(allData.futuresPositions, year);
  const spotTx = filterByYear(allData.spotTransactions, 'date', year);

  let futTotalUsd = 0, futWins = 0, futLosses = 0;
  for (const el of futPositions) {
    const u = el.event?.PositionUpdate;
    if (!u) continue;
    const pnl = parseFloat(u.realizedPnL || '0');
    futTotalUsd += pnl;
    if (pnl >= 0) futWins++; else futLosses++;
  }

  let spotTotalEur = 0, spotWins = 0, spotLosses = 0;
  for (const tx of spotTx) {
    const gain = parseFloat(tx.gain || '0');
    if (gain === 0) continue;
    spotTotalEur += gain;
    if (gain >= 0) spotWins++; else spotLosses++;
  }

  return { futTotalUsd, futWins, futLosses, spotTotalEur, spotWins, spotLosses };
}

// ── Render summary cards ──
function renderSummaryCards(year) {
  const bal = computeBalances();
  const pnl = computePnl(year);

  const balEl = document.getElementById('totalBalance');
  balEl.textContent = bal.grandTotalEur !== null ? '\\u20AC' + fmt(bal.grandTotalEur) : '\\u20AC' + fmt(bal.totalEur) + ' + $' + fmt(bal.futUsd);
  balEl.className = 'card-value';

  const breakdown = document.getElementById('balanceBreakdown');
  breakdown.innerHTML = '<span>Futures: \\u20AC' + fmt(bal.futEur) + ' + $' + fmt(bal.futUsd) + ' | Spot: \\u20AC' + fmt(bal.spotEur) + '</span>';

  // Futures P&L
  const fpEl = document.getElementById('futuresPnl');
  const futSign = pnl.futTotalUsd >= 0 ? '+' : '-';
  fpEl.textContent = futSign + '$' + fmt(Math.abs(pnl.futTotalUsd));
  fpEl.className = 'card-value ' + (pnl.futTotalUsd >= 0 ? 'positive' : 'negative');
  document.getElementById('futuresPnlSub').innerHTML = '<span>' + pnl.futWins + ' wins / ' + pnl.futLosses + ' losses</span>';

  // Spot P&L
  const spEl = document.getElementById('spotPnl');
  const spotSign = pnl.spotTotalEur >= 0 ? '+' : '-';
  spEl.textContent = spotSign + '\\u20AC' + fmt(Math.abs(pnl.spotTotalEur));
  spEl.className = 'card-value ' + (pnl.spotTotalEur >= 0 ? 'positive' : 'negative');
  document.getElementById('spotPnlSub').innerHTML = '<span>' + pnl.spotWins + ' wins / ' + pnl.spotLosses + ' losses</span>';

  // Last sync
  if (allData.syncedAt) {
    document.getElementById('lastSync').textContent = 'Last sync: ' + new Date(allData.syncedAt).toLocaleString();
  }
}

// ── Futures Positions table ──
function renderFuturesPositions(year) {
  const elements = filterFuturesPositionsByYear(allData.futuresPositions, year);
  const positions = elements.map(el => {
    const u = el.event?.PositionUpdate;
    if (!u) return null;
    const sym = (u.tradeable || '').replace(/^PF_/, '').replace(/USD$/, '');
    const openPrice = parseFloat(u.oldAverageEntryPrice);
    const qty = parseFloat(u.executionSize);
    const pnl = parseFloat(u.realizedPnL);
    const costBasis = openPrice * qty;
    return {
      opened: (u.fillTime ? new Date(u.fillTime) : new Date(el.timestamp)).toISOString(),
      closed: new Date(el.timestamp).toISOString(),
      side: parseFloat(u.oldPosition) < 0 ? 'Short' : 'Long',
      market: sym + ' Perp', symbol: sym,
      openPrice, closePrice: parseFloat(u.executionPrice), qty,
      pnl, pnlPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
      currency: (u.feeCurrency || 'USD').toUpperCase(),
      id: (u.executionUid || '').slice(0, 8),
    };
  }).filter(Boolean);

  if (!positions.length) {
    document.getElementById('view-futures-positions').innerHTML = '<div class="empty-state">No futures positions found</div>';
    return;
  }

  let html = '<div class="table-container"><table><thead><tr>' +
    '<th>Opened</th><th>Closed</th><th>Side</th><th>Market</th>' +
    '<th style="text-align:right">Open Price</th><th style="text-align:right">Qty</th>' +
    '<th style="text-align:right">Close Price</th><th style="text-align:right">P&amp;L</th><th style="text-align:right">ID</th>' +
    '</tr></thead><tbody>';

  for (const p of positions) {
    const sideClass = p.side === 'Short' ? 'side-short' : 'side-long';
    const symLow = p.symbol.toLowerCase();
    const iconCls = ICON_CLASSES[symLow] || 'icon-default';
    const pnlCls = p.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
    const pnlSign = p.pnl >= 0 ? '+' : '';
    html += '<tr>' +
      '<td>' + fmtDateTime(p.opened) + '</td>' +
      '<td>' + fmtDateTime(p.closed) + '</td>' +
      '<td><span class="' + sideClass + '">' + p.side + '</span></td>' +
      '<td><div class="market-cell"><span class="market-icon ' + iconCls + '">' + p.symbol[0] + '</span>' + p.market + '</div></td>' +
      '<td style="text-align:right">' + fmtPrice(p.openPrice) + ' <span class="currency">' + csym(p.currency) + '</span></td>' +
      '<td style="text-align:right">' + fmtQty(p.qty, p.symbol) + '</td>' +
      '<td style="text-align:right">' + fmtPrice(p.closePrice) + ' <span class="currency">' + csym(p.currency) + '</span></td>' +
      '<td style="text-align:right"><div class="pnl-cell ' + pnlCls + '"><span class="pnl-value">' + pnlSign + p.pnl.toFixed(2) + ' ' + p.currency + '</span><span class="pnl-pct">' + pnlSign + p.pnlPct.toFixed(2) + '%</span></div></td>' +
      '<td style="text-align:right"><span class="id-cell">' + p.id + '</span></td>' +
      '</tr>';
  }
  html += '</tbody></table></div>';
  document.getElementById('view-futures-positions').innerHTML = html;
}

// ── Futures Transactions cards ──
function renderFuturesTransactions(year) {
  const transactions = filterByYear(allData.futuresTransactions, 'date', year);
  if (!transactions.length) {
    document.getElementById('view-futures-transactions').innerHTML = '<div class="empty-state">No futures transactions found</div>';
    return;
  }

  const grouped = {};
  for (const tx of transactions) {
    const key = fmtDate(tx.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  }

  let html = '<div class="container">';
  for (const [date, items] of Object.entries(grouped)) {
    html += '<div class="date-group"><span class="date-label">' + date + '</span></div>';
    for (const tx of items) {
      const sign = tx.amount >= 0 ? '+' : '-';
      const signClass = tx.amount >= 0 ? 'positive' : 'negative';
      const sym = csym(tx.currency);
      const amtStr = Math.abs(tx.amount) < 0.01 ? Math.abs(tx.amount).toFixed(4).replace('.',',') : Math.abs(tx.amount).toFixed(2).replace('.',',');

      let middleHTML = '';
      const contractSym = tx.contract ? tx.contract.replace(/^pf_/i,'').replace(/usd$/i,'').toUpperCase() : null;
      const ci = contractSym && CRYPTO_ICONS[contractSym] ? CRYPTO_ICONS[contractSym] : null;
      const curIcon = tx.currency === 'EUR' ? {bg:'#003399',l:'\\u20AC'} : tx.currency === 'USD' ? {bg:'#2d6a2e',l:'$'} : {bg:'#555',l:tx.currency[0]};

      if (tx.type === 'Deposit') {
        middleHTML = flowHTML(curIcon, {bg:'#5741d9',l:'K'});
      } else if (tx.type === 'Withdrawal') {
        middleHTML = flowHTML({bg:'#5741d9',l:'K'}, curIcon);
      } else if (ci) {
        middleHTML = flowHTML(ci, curIcon);
      }

      html += '<div class="row' + (tx.type === 'Realized P&L' || tx.type === 'Funding fee' ? ' tall' : '') + '">' +
        '<div class="left"><span class="kraken-logo">K</span><div class="left-text">' +
        '<span class="tx-type">' + tx.type + '</span>' +
        '<span class="tx-time">' + fmtTime(tx.date) + '</span>' +
        '</div></div>' +
        '<div class="middle">' + middleHTML + '</div>' +
        '<div class="right"><span class="wallet-label">Kraken Futures</span>' +
        '<div class="amount-line"><span class="sign ' + signClass + '">' + sign + '</span>' +
        '<span class="amount-value ' + signClass + '">' + amtStr + ' ' + sym + '</span></div>' +
        (tx.tag ? '<span class="tag-badge">' + tx.tag + '</span>' : '') +
        '</div></div>';
    }
  }
  html += '</div>';
  document.getElementById('view-futures-transactions').innerHTML = html;
}

function flowHTML(left, right) {
  return '<div class="middle-icons">' +
    '<span class="coin-icon" style="background:' + left.bg + '">' + left.l + '</span>' +
    '<span class="arrow-icon">\\u279C</span>' +
    '<span class="coin-icon" style="background:' + right.bg + '">' + right.l + '</span></div>';
}

// ── Spot Positions table ──
function renderSpotPositions(year) {
  let positions = allData.spotPositions;
  if (year) {
    positions = positions.filter(p => p.positionClosed && new Date(p.positionClosed).getFullYear() === year);
  }

  if (!positions.length) {
    document.getElementById('view-spot-positions').innerHTML = '<div class="empty-state">No spot margin positions found</div>';
    return;
  }

  let html = '<div class="table-container"><table><thead><tr>' +
    '<th>Opened</th><th>Closed</th><th>Side</th><th>Market</th>' +
    '<th style="text-align:right">Open Price</th><th style="text-align:right">Qty</th>' +
    '<th style="text-align:right">Close Price</th><th style="text-align:right">Leverage</th>' +
    '<th style="text-align:right">P&amp;L</th><th style="text-align:right">ID</th>' +
    '</tr></thead><tbody>';

  for (const p of positions) {
    const sideClass = p.side === 'Short' ? 'side-short' : 'side-long';
    const icon = CRYPTO_ICONS[p.base] || {bg:'#555',l:(p.base||'?')[0]};
    const pnlCls = p.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
    const pnlSign = p.pnl >= 0 ? '+' : '';
    html += '<tr>' +
      '<td>' + fmtDateTime(p.positionOpened) + '</td>' +
      '<td>' + fmtDateTime(p.positionClosed) + '</td>' +
      '<td><span class="' + sideClass + '">' + p.side + '</span></td>' +
      '<td><div class="market-cell"><span class="market-icon" style="background:' + icon.bg + '">' + icon.l + '</span>' + p.market + '</div></td>' +
      '<td style="text-align:right">' + fmtPrice(p.openingPrice) + ' <span class="currency">' + csym(p.currency) + '</span></td>' +
      '<td style="text-align:right">' + fmtQty(p.quantity, p.base) + '</td>' +
      '<td style="text-align:right">' + fmtPrice(p.closingPrice) + ' <span class="currency">' + csym(p.currency) + '</span></td>' +
      '<td style="text-align:right"><span class="leverage-badge">' + (p.leverage || '0') + 'x</span></td>' +
      '<td style="text-align:right"><div class="pnl-cell ' + pnlCls + '"><span class="pnl-value">' + pnlSign + p.pnl.toFixed(2) + ' ' + csym(p.currency) + '</span><span class="pnl-pct">' + pnlSign + p.pnlPct.toFixed(2) + '%</span></div></td>' +
      '<td style="text-align:right"><span class="id-cell">' + (p.id || '').slice(0, 10) + '</span></td>' +
      '</tr>';
  }
  html += '</tbody></table></div>';
  document.getElementById('view-spot-positions').innerHTML = html;
}

// ── Spot Transactions cards ──
function renderSpotTransactions(year) {
  const transactions = filterByYear(allData.spotTransactions, 'date', year);
  if (!transactions.length) {
    document.getElementById('view-spot-transactions').innerHTML = '<div class="empty-state">No spot transactions found</div>';
    return;
  }

  const TYPE_LABELS = {buy:'Buy',sell:'Sell',fiat_deposit:'Fiat Deposit',fiat_withdrawal:'Fiat Withdrawal',crypto_deposit:'Crypto Deposit',crypto_withdrawal:'Crypto Withdrawal'};
  const INFLOW = new Set(['buy','fiat_deposit','crypto_deposit']);
  const OUTFLOW = new Set(['sell','fiat_withdrawal','crypto_withdrawal']);

  const grouped = {};
  for (const tx of transactions) {
    const key = fmtDate(tx.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  }

  let html = '<div class="container">';
  for (const [date, items] of Object.entries(grouped)) {
    html += '<div class="date-group"><span class="date-label">' + date + '</span></div>';
    for (const tx of items) {
      const label = TYPE_LABELS[tx.type] || tx.type;
      const colorClass = INFLOW.has(tx.type) ? 'positive' : OUTFLOW.has(tx.type) ? 'negative' : '';
      const isTrade = tx.type === 'buy' || tx.type === 'sell';
      const fromCur = tx.from?.currency?.symbol || '';
      const toCur = tx.to?.currency?.symbol || '';

      let middleHTML = '';
      if (isTrade) middleHTML = flowHTML(iconObj(fromCur), iconObj(toCur));
      else if (INFLOW.has(tx.type)) middleHTML = flowHTML(iconObj(toCur), {bg:'#5741d9',l:'K'});
      else if (OUTFLOW.has(tx.type)) middleHTML = flowHTML({bg:'#5741d9',l:'K'}, iconObj(fromCur));

      let amountHTML = '<span class="wallet-label">Kraken Spot</span>';
      if (isTrade) {
        amountHTML += '<div class="amount-line"><span class="negative">-' + fmtAbs(tx.from.amount) + ' ' + csym(fromCur) + '</span></div>';
        amountHTML += '<div class="amount-line"><span class="positive">+' + fmtAbs(tx.to.amount) + ' ' + csym(toCur) + '</span></div>';
      } else if (INFLOW.has(tx.type)) {
        amountHTML += '<div class="amount-line"><span class="positive">+' + fmtAbs(tx.to.amount) + ' ' + csym(toCur) + '</span></div>';
      } else if (tx.from) {
        amountHTML += '<div class="amount-line"><span class="negative">-' + fmtAbs(tx.from.amount) + ' ' + csym(fromCur) + '</span></div>';
      }

      const feeVal = parseFloat(tx.fee_value || '0');
      if (feeVal > 0 && tx.fee) {
        const feeCur = tx.fee.currency?.symbol || '';
        amountHTML += '<span class="fee-label">Fee: ' + fmtAbs(tx.fee.amount) + ' ' + csym(feeCur) + '</span>';
      }
      const gain = parseFloat(tx.gain || '0');
      if (gain !== 0) {
        const cls = gain >= 0 ? 'positive' : 'negative';
        amountHTML += '<span class="gain-label ' + cls + '">P&L: ' + (gain >= 0 ? '+' : '') + gain.toFixed(4) + ' \\u20AC</span>';
      }

      const tall = isTrade || feeVal > 0 || gain !== 0;
      html += '<div class="row' + (tall ? ' tall' : '') + '">' +
        '<div class="left"><span class="kraken-logo">K</span><div class="left-text">' +
        '<span class="tx-type ' + colorClass + '">' + label + '</span>' +
        '<span class="tx-time">' + fmtTime(tx.date) + '</span>' +
        '</div></div>' +
        '<div class="middle">' + middleHTML + '</div>' +
        '<div class="right">' + amountHTML +
        (tx.label ? '<span class="tag-badge">' + tx.label.replace(/_/g, ' ') + '</span>' : '') +
        '</div></div>';
    }
  }
  html += '</div>';
  document.getElementById('view-spot-transactions').innerHTML = html;
}

function iconObj(sym) {
  if (CRYPTO_ICONS[sym]) return {bg:CRYPTO_ICONS[sym].bg, l:CRYPTO_ICONS[sym].l};
  if (sym === 'EUR') return {bg:'#003399',l:'\\u20AC'};
  if (sym === 'USD') return {bg:'#2d6a2e',l:'$'};
  return {bg:'#555',l:(sym||'?')[0]};
}

// ── Main render ──
function renderDashboard() {
  if (!allData) return;
  const year = getSelectedYear();
  populateYearDropdown();
  renderSummaryCards(year);
  renderFuturesPositions(year);
  renderFuturesTransactions(year);
  renderSpotPositions(year);
  renderSpotTransactions(year);
}

// ── URL state ──
function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return { tab: p.get('tab') || 'futures-positions', year: p.get('year') || 'all' };
}

function setUrlParams(tab, year) {
  const p = new URLSearchParams();
  if (tab && tab !== 'futures-positions') p.set('tab', tab);
  if (year && year !== 'all') p.set('year', year);
  const qs = p.toString();
  const url = window.location.pathname + (qs ? '?' + qs : '');
  window.history.replaceState(null, '', url);
}

function getActiveTab() {
  const el = document.querySelector('.tab.active');
  return el ? el.dataset.view : 'futures-positions';
}

function activateTab(viewName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  const tab = document.querySelector('.tab[data-view="' + viewName + '"]');
  if (tab) {
    tab.classList.add('active');
    document.getElementById('view-' + viewName).classList.add('active');
  }
}

// ── Tab switching ──
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    activateTab(tab.dataset.view);
    setUrlParams(tab.dataset.view, document.getElementById('yearSelect').value);
  });
});

// ── Year change ──
document.getElementById('yearSelect').addEventListener('change', () => {
  setUrlParams(getActiveTab(), document.getElementById('yearSelect').value);
  renderDashboard();
});

// ── Restore URL state ──
function restoreUrlState() {
  const params = getUrlParams();
  activateTab(params.tab);
  document.getElementById('yearSelect').value = params.year;
  if (params.year !== 'all') renderDashboard();
}

// ── Init ──
(async function init() {
  await fetchEurUsdRate();
  const cached = loadFromStorage();
  if (cached) {
    allData = cached;
    renderDashboard();
    hideLoading();
    restoreUrlState();
  } else {
    showLoading('Connecting to Kraken APIs...');
    streamSync(
      function(msg) { updateLoadingText(msg); },
      function(data) {
        allData = data;
        saveToStorage(allData);
        renderDashboard();
        hideLoading();
        restoreUrlState();
      },
      function(errMsg) {
        updateLoadingText('Failed to load: ' + errMsg + '. Check that the server is running.');
      }
    );
  }
})();
</script>
</body>
</html>`;
}
