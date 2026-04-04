import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadIcons(): Record<string, string> {
  return JSON.parse(readFileSync(resolve(__dirname, "icon-data.json"), "utf8"));
}

/**
 * Builds the dynamic transactions page.
 * All data fetching, normalization, filtering, pagination happens client-side.
 * The server provides: the HTML shell + embedded icon data + the CSS from the reference page.
 */
export function buildTransactionsPageHTML(): string {
  const icons = loadIcons();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transactions</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  <style>${STYLES}</style>
</head>
<body>
  <div class="kn-loading" id="loadingOverlay">
    <div class="kn-spinner"></div>
    <div class="kn-loading-text" id="loadingText">Loading transactions...</div>
  </div>

  <div class="kn-page">
    <div class="kn-header">
      <span class="kn-title">Transaction</span>
      <span class="kn-count" id="txCount">0</span>
      <div class="kn-header-right">
        <button class="kn-sync-btn" id="syncBtn" onclick="doSync()">
          <span class="kn-sync-icon" id="syncIcon">&#x21BB;</span>
          <span class="kn-sync-spinner" id="syncSpinner"></span>
          Sync
        </button>
      </div>
    </div>

    <div class="kn-toolbar">
      <div class="kn-filters">
        <button class="kn-filter-btn active" data-source="all">All</button>
        <button class="kn-filter-btn" data-source="futures">Futures</button>
        <button class="kn-filter-btn" data-source="spots">Spots</button>
      </div>
      <div class="kn-toolbar-right">
        <input type="date" class="kn-date-input" id="dateFrom" placeholder="From">
        <span class="kn-date-sep">~</span>
        <input type="date" class="kn-date-input" id="dateTo" placeholder="To">
        <select class="kn-per-page" id="perPage">
          <option value="0">All</option>
          <option value="50">50</option>
          <option value="100" selected>100</option>
        </select>
      </div>
    </div>

    <div class="kn-content" id="txContent"></div>

    <div class="kn-pagination" id="pagination"></div>
  </div>

<script>
const ICONS = ${JSON.stringify(icons)};
const STORAGE_KEY = 'kraken_tx_data';

let allRows = [];
let currentPage = 1;

// ── Formatting helpers ──

function fmtAmount(n) {
  const abs = Math.abs(n);
  if (abs >= 1000000) return Math.round(abs).toLocaleString('de-DE');
  if (abs >= 1) return abs.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2});
  if (abs >= 0.01) return abs.toFixed(4).replace('.',',');
  return abs.toFixed(4).replace('.',',');
}

function fmtShortAmount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'm';
  if (n >= 1000) return (n / 1000).toFixed(2) + 'k';
  if (n >= 1) return n.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2});
  return n.toFixed(4).replace('.',',');
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'UTC'});
}

function fmtDateGroup(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
}

let eurUsdRate = 1.155;

// ── Normalization ──

function normalizeFuturesTx(tx) {
  var currency = tx.currency || 'USD';
  var currencyIcon = currency === 'EUR' ? 'Euro' : 'US Dollar';
  var isPositive;
  if (tx.type === 'Deposit') isPositive = true;
  else if (tx.type === 'Withdrawal') isPositive = false;
  else isPositive = tx.amount >= 0;
  var sign = isPositive ? '+' : '-';

  var eurEquiv = null;
  if (currency === 'USD' && tx.amount !== 0) {
    eurEquiv = '≈ ' + fmtAmount(Math.abs(tx.amount) / eurUsdRate) + ' €';
  } else if (currency === 'EUR') {
    eurEquiv = '≈ ' + fmtAmount(Math.abs(tx.amount)) + ' €';
  }

  var gainValue = null;
  if (tx.type === 'Realized P&L') {
    var eurVal = currency === 'USD' ? Math.abs(tx.amount) / eurUsdRate : Math.abs(tx.amount);
    gainValue = (isPositive ? '' : '-') + fmtAmount(eurVal) + ' €';
  }

  return {
    source: 'futures',
    date: tx.date,
    type: tx.type,
    time: fmtTime(tx.date),
    wallet: 'Kraken Futures',
    sign: sign,
    amount: fmtAmount(Math.abs(tx.amount)) + ' ' + (currency === 'EUR' ? '€' : '$'),
    eurEquiv: eurEquiv,
    tag: tx.tag || null,
    currencyIcon: currencyIcon,
    secondAmount: null,
    fee: null,
    gainValue: gainValue,
    gainPositive: isPositive,
    costBasis: null,
    _fromCur: null,
    _toCur: null,
    _rawAmount: Math.abs(tx.amount),
    _rawCurrency: currency,
    _rawType: tx.type,
    _rawDate: tx.date,
  };
}

function normalizeSpotTx(tx) {
  var label = tx.label || null;
  var isTrade = tx.type === 'buy' || tx.type === 'sell';
  var isFiatWithdrawal = tx.type === 'fiat_withdrawal';
  var isFiatDeposit = tx.type === 'fiat_deposit';
  var isCryptoWithdrawal = tx.type === 'crypto_withdrawal';
  var isCryptoDeposit = tx.type === 'crypto_deposit';
  var isInflow = isFiatDeposit || isCryptoDeposit;
  var isOutflow = isFiatWithdrawal || isCryptoWithdrawal;

  // ── Determine display type based on label mapping ──
  var displayType;
  var useFunnelIcon = false;
  var tag = null;

  if (isFiatWithdrawal && label === 'realized_gain') {
    displayType = 'Realized P&L';
    useFunnelIcon = true;
    // Spot realized_gain = margin trading settlement → tag "margin"
    tag = 'margin';
  } else if (isFiatWithdrawal && label === 'loan_fee') {
    displayType = 'Loan fee';
    useFunnelIcon = true;
    tag = 'rollover';
  } else if (isFiatDeposit && label === 'realized_gain') {
    displayType = 'Realized P&L';
    useFunnelIcon = true;
    // Spot realized_gain = margin trading settlement → tag "margin"
    tag = 'margin';
  } else if (isFiatWithdrawal) {
    displayType = 'Withdrawal';
    tag = null;
  } else if (isFiatDeposit) {
    displayType = 'Deposit';
    // Will be tagged 'deposit' if external (not transfer) in post-processing
    tag = null;
  } else if (isCryptoWithdrawal) {
    displayType = 'Withdrawal';
    tag = null;
  } else if (isCryptoDeposit) {
    displayType = 'Deposit';
    tag = null;
  } else if (tx.type === 'buy') {
    displayType = 'Buy';
    tag = 'trade';
  } else if (tx.type === 'sell') {
    displayType = 'Sell';
    tag = 'trade';
  } else {
    displayType = tx.type;
    tag = null;
  }

  // ── Determine primary currency and amount ──
  var primaryCur, primaryAmt, primaryIcon;
  if (isInflow) {
    primaryCur = tx.to?.currency?.symbol || 'EUR';
    primaryAmt = parseFloat(tx.to?.amount || '0');
  } else if (isOutflow) {
    primaryCur = tx.from?.currency?.symbol || 'EUR';
    primaryAmt = parseFloat(tx.from?.amount || '0');
  } else if (isTrade) {
    if (tx.type === 'buy') {
      primaryCur = tx.from?.currency?.symbol || 'EUR';
      primaryAmt = parseFloat(tx.from?.amount || '0');
    } else {
      primaryCur = tx.to?.currency?.symbol || 'EUR';
      primaryAmt = parseFloat(tx.to?.amount || '0');
    }
  } else {
    primaryCur = 'EUR';
    primaryAmt = parseFloat(tx.net_value || '0');
  }

  primaryIcon = primaryCur === 'EUR' ? 'Euro' : primaryCur === 'USD' ? 'US Dollar' : primaryCur;

  // ── Sign ──
  var sign;
  if (displayType === 'Realized P&L' || displayType === 'Funding fee' || displayType === 'Loan fee') {
    // For realized P&L: deposits are positive, withdrawals are negative
    if (isFiatDeposit) sign = '+';
    else sign = '-';
  } else if (isInflow || tx.type === 'sell') {
    sign = '+';
  } else {
    sign = '-';
  }

  // ── EUR equivalent ──
  var eurEquiv = null;
  if (primaryCur === 'USD') {
    eurEquiv = '≈ ' + fmtAmount(primaryAmt / eurUsdRate) + ' €';
  } else if (primaryCur === 'EUR' && (displayType === 'Realized P&L' || displayType === 'Funding fee' || displayType === 'Loan fee' || displayType === 'Withdrawal' || displayType === 'Deposit')) {
    eurEquiv = '≈ ' + fmtAmount(primaryAmt) + ' €';
  } else if (isTrade && tx.type === 'buy') {
    eurEquiv = '≈ ' + fmtAmount(primaryAmt) + ' €';
  }

  // ── Secondary amount for trades ──
  var secondAmount = null;
  if (isTrade) {
    if (tx.type === 'buy') {
      var toCur = tx.to?.currency?.symbol || '?';
      var toAmt = parseFloat(tx.to?.amount || '0');
      secondAmount = '+ ' + fmtShortAmount(toAmt) + ' ' + toCur;
    } else {
      var fromCur = tx.from?.currency?.symbol || '?';
      var fromAmt = parseFloat(tx.from?.amount || '0');
      secondAmount = '- ' + fmtShortAmount(fromAmt) + ' ' + fromCur;
    }
  }

  // ── Fee ──
  var fee = null;
  if (tx.fee && parseFloat(tx.fee_value || '0') > 0) {
    var feeAmt = parseFloat(tx.fee.amount);
    var feePct = primaryAmt > 0 ? (feeAmt / primaryAmt * 100) : 0;
    if (feePct > 0 && feePct < 100) {
      fee = feePct.toFixed(feePct >= 0.1 ? 1 : 2) + '% fee';
    }
  }

  // ── Gain (P&L indicator) ──
  var gainValue = null;
  var gainPositive = true;
  var gain = parseFloat(tx.gain || '0');
  if (gain !== 0 && (isTrade || displayType === 'Realized P&L')) {
    gainPositive = gain >= 0;
    gainValue = (gain >= 0 ? '' : '-') + fmtAmount(Math.abs(gain)) + ' €';
  }
  // For spot margin realized_gain: gain field is 0, but the amount IS the P&L
  // Withdrawal = loss, Deposit = gain
  if (displayType === 'Realized P&L' && label === 'realized_gain' && !gainValue) {
    var pnlAmt = primaryAmt;
    if (isFiatWithdrawal) {
      gainPositive = false;
      gainValue = '-' + fmtAmount(pnlAmt) + ' €';
    } else if (isFiatDeposit) {
      gainPositive = true;
      gainValue = fmtAmount(pnlAmt) + ' €';
    }
  }

  // ── Cost basis for sell ──
  var costBasis = null;
  if (tx.type === 'sell' && tx.from?.cost_basis) {
    var cb = parseFloat(tx.from.cost_basis);
    if (cb > 0) costBasis = '-' + fmtAmount(cb) + ' € cost';
  }

  return {
    source: 'spots',
    date: tx.date,
    type: displayType,
    time: fmtTime(tx.date),
    wallet: 'Kraken (API keys)',
    sign: sign,
    amount: fmtAmount(primaryAmt) + ' ' + (primaryCur === 'EUR' ? '€' : primaryCur === 'USD' ? '$' : primaryCur),
    eurEquiv: eurEquiv,
    tag: tag,
    currencyIcon: primaryIcon,
    secondAmount: secondAmount,
    fee: fee,
    gainValue: gainValue,
    gainPositive: gainPositive,
    costBasis: costBasis,
    _fromCur: tx.from?.currency?.symbol || null,
    _toCur: tx.to?.currency?.symbol || null,
    _useFunnelIcon: useFunnelIcon,
    _rawAmount: primaryAmt,
    _rawCurrency: primaryCur,
    _rawType: tx.type,
    _rawDate: tx.date,
    _label: label,
  };
}

// ── Transfer detection ──
function detectTransfers(rows) {
  var futRows = [];
  var spotRows = [];
  rows.forEach(function(r) {
    if (r.source === 'futures' && (r._rawType === 'Deposit' || r._rawType === 'Withdrawal')) futRows.push(r);
    if (r.source === 'spots' && (r.type === 'Deposit' || r.type === 'Withdrawal')) spotRows.push(r);
  });

  var usedSpot = {};
  futRows.forEach(function(fr) {
    // Determine expected spot type: futures deposit ← spot withdrawal, futures withdrawal → spot deposit
    var expectedSpotType = fr._rawType === 'Deposit' ? 'Withdrawal' : 'Deposit';
    for (var i = 0; i < spotRows.length; i++) {
      var sr = spotRows[i];
      if (usedSpot[i]) continue;
      if (sr.type !== expectedSpotType) continue;
      // Same currency
      var futCur = fr._rawCurrency;
      var spotCur = sr._rawCurrency;
      if (futCur !== spotCur) continue;
      // Same amount (within tolerance)
      if (Math.abs(fr._rawAmount - sr._rawAmount) > 0.01) continue;
      // Within 30 seconds
      var timeDiff = Math.abs(new Date(fr._rawDate).getTime() - new Date(sr._rawDate).getTime());
      if (timeDiff > 30000) continue;
      // Match found - tag both
      fr.tag = 'transfer';
      sr.tag = 'transfer';
      usedSpot[i] = true;
      break;
    }
  });
}

// ── Tag external deposits ──
function tagExternalDeposits(rows) {
  rows.forEach(function(r) {
    if (r.source === 'spots' && r.type === 'Deposit' && !r.tag && !r._label) {
      r.tag = 'deposit';
    }
  });
}

// ── Icon helpers ──
function getIcon(name) {
  if (name === 'Euro') return ICONS.euro;
  if (name === 'US Dollar') return ICONS.usd;
  if (name === 'PEPE') return ICONS.pepe;
  if (name === 'Pepe') return ICONS.pepe;
  return null;
}

function walletIcon(wallet) {
  return wallet === 'Kraken Futures' ? ICONS.kraken_futures : ICONS.kraken_api;
}

function currIconHTML(name) {
  var src = getIcon(name);
  if (src) return '<img class="kn-curr" src="' + src + '">';
  return '<span class="kn-curr-fallback">' + (name || '?')[0] + '</span>';
}

// ── Row rendering ──

function getLayout(row) {
  if (row.type === 'Buy' || row.type === 'Sell') return 'trade';
  if (row.type === 'Realized P&L' || row.type === 'Funding fee' || row.type === 'Loan fee') {
    return row.sign === '+' ? 'inflow' : 'outflow';
  }
  if (row.type === 'Deposit') return 'inflow';
  if (row.type === 'Withdrawal') return 'outflow';
  return row.sign === '+' ? 'inflow' : 'outflow';
}

function arrowColor(row) {
  if (row.type === 'Buy' || row.type === 'Sell') return '#35baf6';
  return getLayout(row) === 'inflow' ? '#49b40b' : '#dc3545';
}

function usesFunnel(row) {
  if (row.type === 'Realized P&L' || row.type === 'Funding fee' || row.type === 'Loan fee') return true;
  if (row._useFunnelIcon) return true;
  return false;
}

function buildRowHTML(row, isFirst, isLast) {
  var rTop = isFirst ? 'border-top-left-radius:8px;border-top-right-radius:8px;' : '';
  var rBot = isLast ? 'border-bottom-left-radius:8px;border-bottom-right-radius:8px;' : '';
  var layout = getLayout(row);
  var wIcon = walletIcon(row.wallet);
  var cIcon = getIcon(row.currencyIcon) || ICONS.euro;
  var arrClr = arrowColor(row);
  var isFunnel = usesFunnel(row);

  // Middle icons
  var middleHTML;
  if (layout === 'trade') {
    var leftImg, rightImg;
    if (row.type === 'Buy') {
      leftImg = getIcon(row._fromCur || row.currencyIcon) || ICONS.euro;
      rightImg = getIcon(row._toCur || 'EUR') || ICONS.euro;
    } else {
      leftImg = getIcon(row._fromCur || 'PEPE') || ICONS.euro;
      rightImg = getIcon(row._toCur || 'EUR') || ICONS.euro;
    }
    middleHTML = currIconHTML(row._fromCur || row.currencyIcon) + '<span class="kn-mid-icon" style="color:' + arrClr + '"><i class="fas fa-retweet"></i></span>' + currIconHTML(row._toCur || 'EUR');
  } else if (layout === 'outflow') {
    var rightI = isFunnel
      ? '<span class="kn-funnel"><i class="fas fa-funnel-dollar"></i></span>'
      : '<span class="kn-bank"><i class="fas fa-landmark"></i></span>';
    middleHTML = currIconHTML(row.currencyIcon) + '<span class="kn-mid-icon" style="color:' + arrClr + '"><i class="fas fa-arrow-right"></i></span>' + rightI;
  } else {
    var leftI = isFunnel
      ? '<span class="kn-funnel"><i class="fas fa-funnel-dollar"></i></span>'
      : '<span class="kn-bank"><i class="fas fa-landmark"></i></span>';
    middleHTML = leftI + '<span class="kn-mid-icon" style="color:' + arrClr + '"><i class="fas fa-arrow-right"></i></span>' + currIconHTML(row.currencyIcon);
  }

  // Left amounts
  var leftAmtHTML = '';
  if (layout === 'outflow') {
    leftAmtHTML = '<div class="kn-left-amt"><span class="kn-sublabel">' + row.wallet + '</span><span class="kn-amt">' + row.sign + ' ' + row.amount + '</span></div>';
  } else if (layout === 'trade') {
    if (row.type === 'Sell') {
      var secAmt = row.secondAmount || '';
      leftAmtHTML = '<div class="kn-left-amt"><span class="kn-sublabel">' + row.wallet + '</span><span class="kn-amt">' + secAmt + '</span>' + (row.costBasis ? '<span class="kn-cost">' + row.costBasis + '</span>' : '') + '</div>';
    } else {
      leftAmtHTML = '<div class="kn-left-amt"><span class="kn-sublabel">' + row.wallet + '</span><span class="kn-amt">- ' + row.amount + '</span></div>';
    }
  }

  // Right amounts
  var rightAmtHTML = '';
  if (layout === 'inflow') {
    var gainHTML = '';
    if (row.gainValue) {
      var gColor = row.gainPositive ? '#4bc0c0' : '#ff6384';
      gainHTML = ' <span class="kn-dot">•</span> <span class="kn-gain" style="color:' + gColor + '">' + row.gainValue + '</span>';
    }
    rightAmtHTML = '<div class="kn-right-amt"><span class="kn-sublabel">' + row.wallet + '</span><span class="kn-amt">' + row.sign + ' ' + row.amount + '</span>' + (row.eurEquiv ? '<span class="kn-eur-line">' + row.eurEquiv + gainHTML + '</span>' : '') + '</div>';
  } else if (layout === 'outflow') {
    var gainHTML2 = '';
    if (row.gainValue) {
      var gColor2 = row.gainPositive ? '#4bc0c0' : '#ff6384';
      gainHTML2 = '<span class="kn-dot">•</span> <span class="kn-gain" style="color:' + gColor2 + '">' + row.gainValue + '</span>';
    }
    rightAmtHTML = '<div class="kn-right-amt kn-right-slim">' + (row.eurEquiv ? '<span class="kn-eur-only">' + row.eurEquiv + '</span>' : '') + gainHTML2 + '</div>';
  } else if (layout === 'trade') {
    if (row.type === 'Sell') {
      var gHTML = '';
      if (row.gainValue) {
        var gc = row.gainPositive ? '#4bc0c0' : '#ff6384';
        gHTML = '<span class="kn-eur-line"><span class="kn-dot">•</span> <span class="kn-gain" style="color:' + gc + '">' + row.gainValue + '</span></span>';
      }
      rightAmtHTML = '<div class="kn-right-amt"><span class="kn-sublabel">' + row.wallet + '</span><span class="kn-amt">+ ' + row.amount + '</span>' + gHTML + '</div>';
    } else {
      var toAmt = row.secondAmount || '';
      rightAmtHTML = '<div class="kn-right-amt"><span class="kn-sublabel">' + row.wallet + '</span><span class="kn-amt">' + toAmt + '</span>' + (row.eurEquiv ? '<span class="kn-eur-line">' + row.eurEquiv + '</span>' : '') + '</div>';
    }
  }

  // Tags
  var tagsHTML = '';
  if (row.tag) {
    tagsHTML += '<span class="kn-tag"><i class="fas fa-terminal kn-tag-i"></i> ' + row.tag + '</span>';
  }
  if (row.fee) {
    var feeIcon = row.type === 'Sell' ? ICONS.euro : (getIcon(row._toCur || row.currencyIcon) || ICONS.euro);
    tagsHTML += '<span class="kn-fee-pill"><img class="kn-fee-img" src="' + feeIcon + '">' + row.fee + '</span>';
  }

  var isTall = !!(row.eurEquiv || row.secondAmount || row.fee || row.costBasis);
  var cls = 'kn-row' + (isTall ? ' kn-tall' : '');

  return '<div class="' + cls + '" style="' + rTop + rBot + '">' +
    '<img class="kn-wallet-img" src="' + wIcon + '">' +
    '<div class="kn-type-block"><span class="kn-type-label">' + row.type + '</span><span class="kn-time-label">' + row.time + '</span></div>' +
    leftAmtHTML +
    '<div class="kn-middle">' + middleHTML + '</div>' +
    rightAmtHTML +
    '<div class="kn-tags-block">' + tagsHTML + '</div>' +
  '</div>';
}

// ── Storage ──
function saveToStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}
function loadFromStorage() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

// ── SSE Sync (same pattern as dashboard) ──
function streamSync(onProgress, onComplete, onError) {
  var es = new EventSource('/sync');
  es.addEventListener('progress', function(e) {
    onProgress(JSON.parse(e.data).message);
  });
  es.addEventListener('complete', function(e) {
    es.close();
    onComplete(JSON.parse(e.data));
  });
  es.addEventListener('error', function(e) {
    if (es.readyState === EventSource.CLOSED) return;
    es.close();
    try { onError(JSON.parse(e.data).message); }
    catch(x) { onError('Connection lost during sync'); }
  });
  return es;
}

// ── Data processing ──
function processData(syncData) {
  var rows = [];

  // Normalize futures
  (syncData.futuresTransactions || []).forEach(function(tx) {
    rows.push(normalizeFuturesTx(tx));
  });

  // Normalize spots
  (syncData.spotTransactions || []).forEach(function(tx) {
    rows.push(normalizeSpotTx(tx));
  });

  // Transfer detection pass
  detectTransfers(rows);

  // Tag external deposits (fiat_deposit with no label and not a transfer)
  tagExternalDeposits(rows);

  // Sort by date descending
  rows.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

  return rows;
}

// ── Rendering ──
function getFilteredRows() {
  var source = document.querySelector('.kn-filter-btn.active').dataset.source;
  var dateFrom = document.getElementById('dateFrom').value;
  var dateTo = document.getElementById('dateTo').value;

  var filtered = allRows;
  if (source !== 'all') {
    filtered = filtered.filter(function(r) { return r.source === source; });
  }
  if (dateFrom) {
    var from = new Date(dateFrom);
    filtered = filtered.filter(function(r) { return new Date(r.date) >= from; });
  }
  if (dateTo) {
    var to = new Date(dateTo + 'T23:59:59');
    filtered = filtered.filter(function(r) { return new Date(r.date) <= to; });
  }
  return filtered;
}

function render() {
  var filtered = getFilteredRows();
  var perPage = parseInt(document.getElementById('perPage').value);
  var total = filtered.length;

  document.getElementById('txCount').textContent = total;

  // Paginate
  var paginated = filtered;
  var totalPages = 1;
  if (perPage > 0) {
    totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * perPage;
    paginated = filtered.slice(start, start + perPage);
  } else {
    currentPage = 1;
  }

  // Group by date
  var groups = {};
  var order = [];
  paginated.forEach(function(row) {
    var key = fmtDateGroup(row.date);
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push(row);
  });

  // Build HTML
  var html = '';
  order.forEach(function(date) {
    var rows = groups[date];
    html += '<div class="kn-date-header">' + date + '</div>';
    rows.forEach(function(row, i) {
      html += buildRowHTML(row, i === 0, i === rows.length - 1);
    });
  });

  document.getElementById('txContent').innerHTML = html;

  // Pagination controls - Koinly numbered style
  if (perPage > 0 && totalPages > 1) {
    var phtml = '<button class="kn-page-btn" onclick="goPage(' + (currentPage-1) + ')" ' + (currentPage===1?'disabled':'') + '>&#8249;</button>';
    for (var p = 1; p <= totalPages; p++) {
      if (p === currentPage) {
        phtml += '<button class="kn-page-btn kn-page-active" onclick="goPage(' + p + ')">' + p + '</button>';
      } else {
        phtml += '<button class="kn-page-btn" onclick="goPage(' + p + ')">' + p + '</button>';
      }
    }
    phtml += '<button class="kn-page-btn" onclick="goPage(' + (currentPage+1) + ')" ' + (currentPage===totalPages?'disabled':'') + '>&#8250;</button>';
    phtml += '<span class="kn-page-goto">Go to page <input type="number" class="kn-goto-input" id="gotoPageInput" min="1" max="' + totalPages + '" value="' + currentPage + '"> <button class="kn-page-btn" onclick="goToInputPage()">Go</button></span>';
    phtml += '<div class="kn-utc-footer">All date/times are in UTC</div>';
    document.getElementById('pagination').innerHTML = phtml;
  } else {
    var footerOnly = '<div class="kn-utc-footer">All date/times are in UTC</div>';
    document.getElementById('pagination').innerHTML = footerOnly;
  }
}

function goPage(p) {
  var perPage = parseInt(document.getElementById('perPage').value);
  var filtered = getFilteredRows();
  var totalPages = perPage > 0 ? Math.max(1, Math.ceil(filtered.length / perPage)) : 1;
  if (p < 1) p = 1;
  if (p > totalPages) p = totalPages;
  currentPage = p;
  render();
  window.scrollTo(0, 0);
}
window.goPage = goPage;

function goToInputPage() {
  var input = document.getElementById('gotoPageInput');
  if (input) goPage(parseInt(input.value) || 1);
}
window.goToInputPage = goToInputPage;

// ── Sync ──
function doSync() {
  var btn = document.getElementById('syncBtn');
  btn.disabled = true;
  document.getElementById('syncIcon').style.display = 'none';
  document.getElementById('syncSpinner').style.display = 'inline-block';
  showLoading('Connecting to Kraken APIs...');

  streamSync(
    function(msg) { document.getElementById('loadingText').textContent = msg; },
    function(data) {
      saveToStorage(data);
      allRows = processData(data);
      currentPage = 1;
      render();
      btn.disabled = false;
      document.getElementById('syncIcon').style.display = '';
      document.getElementById('syncSpinner').style.display = 'none';
      hideLoading();
    },
    function(err) {
      document.getElementById('loadingText').textContent = 'Sync failed: ' + err;
      setTimeout(hideLoading, 3000);
      btn.disabled = false;
      document.getElementById('syncIcon').style.display = '';
      document.getElementById('syncSpinner').style.display = 'none';
    }
  );
}
window.doSync = doSync;

function showLoading(text) {
  document.getElementById('loadingOverlay').style.display = 'flex';
  document.getElementById('loadingText').textContent = text;
}
function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// ── Event listeners ──
document.querySelectorAll('.kn-filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.kn-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentPage = 1;
    render();
  });
});

document.getElementById('dateFrom').addEventListener('change', function() { currentPage = 1; render(); });
document.getElementById('dateTo').addEventListener('change', function() { currentPage = 1; render(); });
document.getElementById('perPage').addEventListener('change', function() { currentPage = 1; render(); });

// ── Init ──
(async function init() {
  // Fetch EUR/USD rate
  try {
    var res = await fetch('https://api.kraken.com/0/public/Ticker?pair=EURUSD');
    var data = await res.json();
    var ticker = data.result?.EURUSD || data.result?.ZEURZUSD;
    if (ticker) eurUsdRate = parseFloat(ticker.c[0]);
  } catch(e) {}

  var cached = loadFromStorage();
  if (cached) {
    allRows = processData(cached);
    render();
    hideLoading();
  } else {
    showLoading('Connecting to Kraken APIs...');
    streamSync(
      function(msg) { document.getElementById('loadingText').textContent = msg; },
      function(data) {
        saveToStorage(data);
        allRows = processData(data);
        render();
        hideLoading();
      },
      function(err) {
        document.getElementById('loadingText').textContent = 'Failed: ' + err;
      }
    );
  }
})();
</script>
</body>
</html>`;
}

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { overflow-x: hidden; }
  body {
    background: #0d1421;
    color: rgba(255,255,255,0.87);
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }

  /* Loading overlay */
  .kn-loading {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(13,20,33,0.9);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 100;
  }
  .kn-spinner {
    width: 48px; height: 48px;
    border: 3px solid rgba(87,65,217,0.2); border-top-color: #5741d9;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  .kn-loading-text { color: #848e9c; font-size: 14px; margin-top: 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .kn-page { max-width: 1265px; margin: 0 auto; padding: 43px 16px 40px 16px; }

  .kn-header {
    display: flex; align-items: center; gap: 15px; flex-wrap: wrap;
    margin-left: 0; margin-bottom: 16px;
    min-height: 42px;
  }
  .kn-title { font-size: 32px; font-family: Arial, sans-serif; line-height: 38.4px; }
  .kn-count {
    font-size: 14px; font-family: Arial, sans-serif;
    color: rgba(255,255,255,0.6);
    border: 1px solid #c0c0c0; border-radius: 10px;
    padding: 2px 8px; line-height: 14px;
  }
  .kn-header-right { margin-left: auto; }
  .kn-sync-btn {
    background: #5741d9; color: #fff; border: none; border-radius: 6px;
    padding: 8px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
  }
  .kn-sync-btn:hover { background: #6b57e0; }
  .kn-sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .kn-sync-spinner {
    display: none; width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.6s linear infinite;
  }

  /* Toolbar */
  .kn-toolbar {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
    gap: 10px; margin-bottom: 16px;
  }
  .kn-filters { display: flex; gap: 0; }
  .kn-filter-btn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6); padding: 6px 16px; font-size: 13px; cursor: pointer;
    transition: all 0.15s;
  }
  .kn-filter-btn:first-child { border-radius: 6px 0 0 6px; }
  .kn-filter-btn:last-child { border-radius: 0 6px 6px 0; }
  .kn-filter-btn.active { background: #5741d9; color: #fff; border-color: #5741d9; }
  .kn-toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .kn-date-input {
    background: #141e2a; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
    color: rgba(255,255,255,0.87); padding: 6px 10px; font-size: 13px; width: 140px;
  }
  .kn-date-input::-webkit-calendar-picker-indicator { filter: invert(0.6); }
  .kn-date-sep { color: rgba(255,255,255,0.4); font-size: 13px; }
  .kn-per-page {
    background: #141e2a; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
    color: rgba(255,255,255,0.87); padding: 6px 10px; font-size: 13px;
  }

  .kn-date-header {
    font-size: 16px; font-family: Arial, sans-serif;
    color: rgba(255,255,255,0.87);
    line-height: 19.2px;
    margin-left: 15px;
    padding: 16px 0 9px 0;
  }

  .kn-content { display: flex; flex-direction: column; overflow: hidden; }

  /* Row */
  .kn-row {
    background: #141e2a;
    border: 1px solid rgba(255,255,255,0.1);
    width: 100%;
    height: 65px;
    padding: 0 25px;
    position: relative;
    margin-top: -1px;
  }
  .kn-row:first-of-type { margin-top: 0; }
  .kn-row.kn-tall { height: 89px; }

  .kn-wallet-img {
    width: 30px; height: 30px; border-radius: 5px;
    object-fit: cover;
    position: absolute; left: 25px; top: 50%; transform: translateY(-50%);
  }

  .kn-type-block {
    position: absolute; left: 71px; top: 50%; transform: translateY(-50%);
  }
  .kn-type-label { font-size: 16px; line-height: 24px; display: block; white-space: nowrap; }
  .kn-time-label {
    font-size: 12.8px; color: rgba(255,255,255,0.6);
    text-transform: uppercase; line-height: 19.2px; display: block;
  }

  .kn-left-amt {
    position: absolute; right: calc(56% + 10px); top: 50%; transform: translateY(-50%);
    text-align: right; white-space: nowrap;
  }
  .kn-sublabel {
    font-size: 12.8px; color: rgba(255,255,255,0.6);
    line-height: 19.2px; display: block;
  }
  .kn-amt { font-size: 16px; line-height: 24px; display: block; }
  .kn-cost {
    font-size: 12.8px; color: rgba(255,255,255,0.6);
    line-height: 19.2px; display: block;
  }

  .kn-middle {
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    display: flex; align-items: center; gap: 8px;
  }
  .kn-curr {
    width: 30px; height: 30px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
  }
  .kn-curr-fallback {
    width: 30px; height: 30px; border-radius: 50%;
    background: #555; display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .kn-bank {
    font-size: 28px; color: #bdbdbd;
    width: 30px; text-align: center; line-height: 28px;
  }
  .kn-funnel {
    font-size: 28px; color: #bdbdbd;
    width: 35px; text-align: center; line-height: 28px;
  }
  .kn-mid-icon {
    font-size: 20px; line-height: 20px; flex-shrink: 0;
  }

  .kn-right-amt {
    position: absolute; left: calc(56% + 10px); top: 50%; transform: translateY(-50%);
    white-space: nowrap;
  }
  .kn-right-slim {
    display: flex; align-items: center; gap: 6px;
  }
  .kn-eur-only {
    font-size: 12.8px; color: rgba(255,255,255,0.6);
    line-height: 19.2px;
  }
  .kn-eur-line {
    font-size: 12.8px; color: rgba(255,255,255,0.6);
    line-height: 19.2px; display: flex; align-items: center; gap: 6px;
  }
  .kn-dot {
    font-size: 16px; color: rgba(255,255,255,0.6); line-height: 24px;
  }
  .kn-gain {
    font-size: 12.8px; font-weight: 700; line-height: 19.2px;
  }

  .kn-tags-block {
    position: absolute; right: 25px; top: 50%; transform: translateY(-50%);
    display: flex; align-items: center; gap: 6px;
  }
  .kn-tag {
    background: rgba(255,255,255,0.1);
    border-radius: 4px; padding: 1px 8px;
    font-size: 12px; color: rgba(255,255,255,0.6);
    display: flex; align-items: center; gap: 4px;
    height: 18px; white-space: nowrap;
  }
  .kn-tag-i { font-size: 12px; }
  .kn-fee-pill {
    background: rgba(255,255,255,0.1);
    border-radius: 800px; padding: 2px 8px 2px 6px;
    font-size: 12px; color: rgba(255,255,255,0.6);
    display: flex; align-items: center; gap: 4px;
    height: 20px; white-space: nowrap;
  }
  .kn-fee-img {
    width: 14px; height: 14px; border-radius: 50%;
    object-fit: cover;
  }

  /* Pagination */
  .kn-pagination {
    display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
    gap: 8px; margin-top: 24px;
  }
  .kn-page-btn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.87); border-radius: 6px; padding: 6px 12px;
    font-size: 14px; cursor: pointer;
  }
  .kn-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .kn-page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
  .kn-page-btn.kn-page-active { background: #5741d9; color: #fff; border-color: #5741d9; }
  .kn-page-info { font-size: 13px; color: rgba(255,255,255,0.6); padding: 0 8px; }
  .kn-page-goto {
    font-size: 13px; color: rgba(255,255,255,0.6);
    margin-left: 16px; display: flex; align-items: center; gap: 6px;
  }
  .kn-goto-input {
    background: #141e2a; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
    color: rgba(255,255,255,0.87); padding: 4px 8px; font-size: 13px; width: 55px;
    text-align: center;
  }
  .kn-goto-input::-webkit-inner-spin-button,
  .kn-goto-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .kn-goto-input[type=number] { -moz-appearance: textfield; }
  .kn-utc-footer {
    width: 100%; text-align: center;
    font-size: 12px; color: rgba(255,255,255,0.4);
    margin-top: 12px;
  }

  /* ── Responsive: keep horizontal row, just scale down ── */
  @media (max-width: 900px) {
    .kn-date-header { margin-left: 0; }
    .kn-date-input { width: 120px; }
    .kn-middle { gap: 4px; }
    .kn-curr { width: 24px; height: 24px; }
    .kn-curr-fallback { width: 24px; height: 24px; font-size: 11px; }
    .kn-bank, .kn-funnel { font-size: 22px; width: 24px; }
    .kn-mid-icon { font-size: 16px; }
    .kn-sublabel { font-size: 11px; }
    .kn-amt { font-size: 14px; }
    .kn-type-label { font-size: 14px; }
    .kn-eur-line { font-size: 11px; }
    .kn-eur-only { font-size: 11px; }
    .kn-gain { font-size: 11px; }
  }

  @media (max-width: 560px) {
    .kn-page { padding: 16px 8px; }
    .kn-title { font-size: 22px; }
    .kn-header { gap: 10px; }

    /* Row: switch from absolute to 2-row grid */
    .kn-row, .kn-row.kn-tall {
      height: auto !important; min-height: 0;
      display: grid;
      grid-template-columns: 30px auto 1fr auto;
      grid-template-rows: auto auto;
      gap: 2px 8px;
      padding: 8px 10px;
      align-items: center;
    }
    .kn-wallet-img {
      position: static; transform: none;
      grid-row: 1 / 3; grid-column: 1; width: 26px; height: 26px;
      align-self: center;
    }
    .kn-type-block {
      position: static; transform: none;
      grid-row: 1; grid-column: 2;
      display: flex; align-items: baseline; gap: 6px;
    }
    .kn-type-label { font-size: 13px; display: inline; }
    .kn-time-label { font-size: 10px; display: inline; }
    .kn-tags-block {
      position: static; transform: none;
      grid-row: 1; grid-column: 4;
      justify-self: end;
    }
    .kn-tag { font-size: 10px; height: 16px; padding: 0 5px; }
    .kn-fee-pill { font-size: 10px; height: 16px; }

    /* Second row: left-amt + middle + right-amt all flow inline */
    .kn-left-amt {
      position: static; transform: none; text-align: left;
      grid-row: 2; grid-column: 2;
      display: flex; gap: 4px; align-items: baseline;
    }
    .kn-middle {
      position: static; transform: none;
      grid-row: 2; grid-column: 3;
      justify-self: center; gap: 4px;
    }
    .kn-right-amt {
      position: static; transform: none;
      grid-row: 2; grid-column: 4;
      justify-self: end; text-align: right;
    }
    .kn-right-slim { flex-wrap: wrap; justify-content: flex-end; }

    .kn-sublabel { display: none; }
    .kn-cost { display: none; }
    .kn-amt { font-size: 13px; }
    .kn-eur-line { font-size: 10px; }
    .kn-eur-only { font-size: 10px; }
    .kn-gain { font-size: 10px; }
    .kn-curr { width: 20px; height: 20px; }
    .kn-curr-fallback { width: 20px; height: 20px; font-size: 9px; }
    .kn-bank, .kn-funnel { font-size: 18px; width: 20px; }
    .kn-mid-icon { font-size: 14px; }

    .kn-date-header { margin-left: 0; font-size: 14px; }
    .kn-date-input { width: 100px; font-size: 11px; padding: 4px 6px; }
    .kn-per-page { font-size: 11px; padding: 4px 6px; }
    .kn-filter-btn { padding: 4px 10px; font-size: 12px; }
  }
`;
