/* ─────────────────────────────────────────────────
   Kraken Portfolio — Unified Dashboard
   ───────────────────────────────────────────────── */

const KRAKEN_LOGO = '/assets/kraken-futures.png';
const KRAKEN_API_ICON = '/assets/kraken-api.png';
const EUR_ICON = '/assets/euro.png';
const USD_ICON = '/assets/usd.png';
const CRYPTO_ICON_CDN = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/32/color/';

/* ═══════════════════════════════════════════════════
   CSS
   ═══════════════════════════════════════════════════ */
const STYLES = `
:root {
  --bg: #09090b; --fg: #fafafa; --card: #0c0c0f; --card-border: #1c1c22;
  --muted: #27272a; --muted-fg: #a1a1aa; --primary: #5741d9; --primary-hover: #6b57e0;
  --primary-fg: #fff; --accent: #18181b; --border: #27272a; --ring: #5741d9;
  --positive: #22c55e; --negative: #ef4444; --radius: 8px; --radius-sm: 6px;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{-webkit-font-smoothing:antialiased}
body{background:var(--bg);color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,sans-serif;font-size:15px;line-height:1.5;overflow-x:hidden}

.skip-link{position:absolute;left:-9999px;top:0;z-index:200;background:var(--primary);color:#fff;padding:8px 16px;border-radius:0 0 var(--radius) 0;font-size:14px;text-decoration:none}
.skip-link:focus{left:0}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
.dashboard{max-width:1280px;margin:0 auto;padding:24px 24px 40px}

/* ── Header ── */
.dh{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.dh-left{display:flex;align-items:center;gap:12px}
.dh-logo{width:32px;height:32px;border-radius:50%;object-fit:cover}
.dh-title{font-size:18px;font-weight:600;letter-spacing:-0.01em;margin:0}
.dh-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.dh-sync-info{font-size:13px;color:var(--muted-fg);text-align:right;opacity:.6}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:var(--radius-sm);font-size:14px;font-weight:500;cursor:pointer;transition:background .15s;border:none;padding:8px 16px;line-height:1}
.btn:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{background:var(--primary);color:var(--primary-fg)}
.btn-primary:hover:not(:disabled){background:var(--primary-hover)}
.btn-ghost{background:transparent;color:var(--muted-fg);padding:6px 10px}
.btn-ghost:hover{background:var(--accent);color:var(--fg)}
.btn .sp{display:none;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
.btn.loading .sp{display:inline-block}
.btn.loading .bi{display:none}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── Select / Input ── */
.sel{background:var(--accent);color:var(--fg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 32px 8px 12px;font-size:14px;cursor:pointer;outline:none;min-height:36px;-webkit-appearance:none;-moz-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27%3E%3Cpath d=%27M1 1.5L6 6.5L11 1.5%27 stroke=%27%23a1a1aa%27 stroke-width=%271.5%27 fill=%27none%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center}
.sel:focus-visible{border-color:var(--ring);box-shadow:0 0 0 2px rgba(87,65,217,.25)}
.date-input{background:var(--accent);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);padding:8px 10px;font-size:14px;width:140px;min-height:36px}
.date-input:focus-visible{border-color:var(--ring);box-shadow:0 0 0 2px rgba(87,65,217,.25)}
.date-input::-webkit-calendar-picker-indicator{filter:invert(.6);cursor:pointer}
/* ── Date range group ── */
.date-range{display:flex;align-items:center;gap:0;background:var(--accent);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden}
.date-range .date-input{border:none;border-radius:0;background:transparent;min-height:34px;width:130px}
.date-range .date-input:focus-visible{box-shadow:inset 0 0 0 2px rgba(87,65,217,.3)}
.date-range .dr-sep{color:var(--muted-fg);padding:0 4px;font-size:14px;user-select:none}
.date-range .dr-clear{background:transparent;border:none;border-left:1px solid var(--border);color:var(--muted-fg);padding:0 12px;font-size:14px;cursor:pointer;min-height:34px;transition:color .15s}
.date-range .dr-clear:hover{color:var(--fg)}
.date-range .dr-clear:focus-visible{box-shadow:inset 0 0 0 2px rgba(87,65,217,.3)}

/* ── Summary layout ── */
.summary{display:flex;flex-direction:column;gap:14px;margin-bottom:24px}
.hero-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:stretch}
.hero{background:var(--card);border:1px solid var(--card-border);border-radius:var(--radius);padding:20px 24px;position:relative}
.hero-badge{position:absolute;top:18px;right:20px}
.hero-label{font-size:13px;font-weight:500;color:var(--muted-fg);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.hero-val{font-size:32px;font-weight:700;letter-spacing:-.02em;line-height:1.1}
.hero-sub{font-size:14px;color:var(--muted-fg);margin-top:8px}
.metrics-row{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.metric{background:var(--card);border:1px solid var(--card-border);border-radius:var(--radius);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.metric-left{display:flex;flex-direction:column;gap:2px}
.metric-label{font-size:14px;color:var(--muted-fg)}
.metric-val{font-size:18px;font-weight:600}
.metric-right{font-size:14px;color:var(--muted-fg);text-align:right;white-space:nowrap}
.c-pos{color:var(--positive)} .c-neg{color:var(--negative)}
/* ── Tax card content ── */
.tax-detail{display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap}
.tax-gains{font-size:15px;color:var(--fg);font-weight:500}
.tax-pill{font-size:14px;padding:3px 10px;border-radius:4px;font-weight:500}
.tax-pill-ok{background:rgba(34,197,94,.1);color:#4ade80}
.tax-pill-due{background:rgba(239,68,68,.1);color:#f87171}
.filing-toggle{display:flex;align-items:center;gap:6px}
.filing-toggle label{font-size:14px;color:var(--muted-fg);cursor:pointer}
.filing-toggle .sel{padding:6px 30px 6px 10px;font-size:14px}

/* ── Tabs ── */
.tl{display:flex;gap:0;background:var(--accent);border-radius:var(--radius-sm);padding:3px;margin-bottom:0;width:fit-content}
.tt{padding:7px 20px;font-size:15px;font-weight:500;color:var(--muted-fg);cursor:pointer;border:none;background:transparent;border-radius:calc(var(--radius-sm) - 2px);transition:all .15s;white-space:nowrap}
.tt:hover{color:var(--fg)}
.tt:focus-visible{outline:2px solid var(--ring);outline-offset:-1px}
.tt[aria-selected="true"]{background:var(--bg);color:var(--fg);box-shadow:0 1px 2px rgba(0,0,0,.3)}
.tc{display:none} .tc.active{display:block}

/* ── Toolbar (shared for tx + positions) ── */
.toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:16px 0}
.toolbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg{display:flex;gap:0}
.fb{background:var(--accent);border:1px solid var(--border);color:var(--muted-fg);padding:8px 18px;font-size:14px;min-height:36px;cursor:pointer;transition:all .15s}
.fb:first-child{border-radius:var(--radius-sm) 0 0 var(--radius-sm)}
.fb:last-child{border-radius:0 var(--radius-sm) var(--radius-sm) 0}
.fb:focus-visible{outline:2px solid var(--ring);outline-offset:-1px;z-index:1;position:relative}
.fb.active{background:var(--primary);color:var(--primary-fg);border-color:var(--primary)}
.toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.count-badge{font-size:14px;color:var(--muted-fg);border:1px solid var(--border);border-radius:10px;padding:2px 10px}
.date-group-label{font-size:14px;color:var(--muted-fg);font-weight:500}

/* ── Loading overlay ── */
.lo{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(9,9,11,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:100}
.lo .bs{width:48px;height:48px;border:3px solid rgba(87,65,217,.2);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}
.lo .lt{color:var(--muted-fg);font-size:15px;margin-top:16px}
.lo.hidden{display:none}

/* ── Empty state ── */
.empty{text-align:center;padding:60px 20px;color:var(--muted-fg);font-size:15px}

/* ── Transaction rows (preserved from original) ── */
.kn-date-header{font-size:15px;font-weight:500;color:var(--fg);margin-left:15px;padding:16px 0 9px 0}
.kn-content{display:flex;flex-direction:column;overflow:hidden}
.kn-row{background:var(--card);border:1px solid var(--card-border);width:100%;height:65px;padding:0 25px;position:relative;margin-top:-1px}
.kn-row:first-of-type{margin-top:0}
.kn-row.kn-tall{height:89px}
.kn-wallet-img{width:30px;height:30px;border-radius:5px;object-fit:cover;position:absolute;left:25px;top:50%;transform:translateY(-50%)}
.kn-type-block{position:absolute;left:71px;top:50%;transform:translateY(-50%)}
.kn-type-label{font-size:15px;line-height:24px;display:block;white-space:nowrap}
.kn-time-label{font-size:14px;color:var(--muted-fg);line-height:20px;display:block}
.kn-left-amt{position:absolute;right:calc(56% + 10px);top:50%;transform:translateY(-50%);text-align:right;white-space:nowrap}
.kn-sublabel{font-size:14px;color:var(--muted-fg);line-height:20px;display:block}
.kn-amt{font-size:15px;line-height:24px;display:block}
.kn-cost{font-size:14px;color:var(--muted-fg);line-height:20px;display:block}
.kn-middle{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:8px}
.kn-curr{width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0}
.kn-curr-fallback{width:30px;height:30px;border-radius:50%;background:#555;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}
.kn-bank{font-size:28px;color:#bdbdbd;width:30px;text-align:center;line-height:28px}
.kn-funnel{font-size:28px;color:#bdbdbd;width:35px;text-align:center;line-height:28px}
.kn-mid-icon{font-size:20px;line-height:20px;flex-shrink:0}
.kn-right-amt{position:absolute;left:calc(56% + 10px);top:50%;transform:translateY(-50%);white-space:nowrap}
.kn-right-slim{display:flex;align-items:center;gap:6px}
.kn-eur-only{font-size:14px;color:var(--muted-fg);line-height:20px}
.kn-eur-line{font-size:14px;color:var(--muted-fg);line-height:20px;display:flex;align-items:center;gap:6px}
.kn-dot{font-size:16px;color:var(--muted-fg);line-height:24px}
.kn-gain{font-size:14px;font-weight:600;line-height:20px}
.kn-tags-block{position:absolute;right:25px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:6px}
.kn-tag{background:var(--accent);border-radius:4px;padding:1px 8px;font-size:13px;color:var(--muted-fg);display:flex;align-items:center;gap:4px;height:20px;white-space:nowrap}
.kn-tag-i{font-size:13px}
.kn-fee-pill{background:var(--accent);border-radius:800px;padding:2px 8px 2px 6px;font-size:13px;color:var(--muted-fg);display:flex;align-items:center;gap:4px;height:22px;white-space:nowrap}
.kn-fee-img{width:14px;height:14px;border-radius:50%;object-fit:cover}

/* ── Pagination ── */
.pgn{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;margin-top:24px}
.pb{background:var(--accent);border:1px solid var(--border);color:var(--fg);border-radius:var(--radius-sm);padding:6px 12px;font-size:14px;cursor:pointer}
.pb:disabled{opacity:.3;cursor:not-allowed}
.pb:hover:not(:disabled){background:var(--muted)}
.pb:focus-visible{outline:2px solid var(--ring);outline-offset:1px}
.pb.pa{background:var(--primary);color:var(--primary-fg);border-color:var(--primary)}
.pg-goto{font-size:14px;color:var(--muted-fg);margin-left:16px;display:flex;align-items:center;gap:6px}
.pg-input{background:var(--accent);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);padding:4px 8px;font-size:14px;width:55px;text-align:center}
.pg-input::-webkit-inner-spin-button,.pg-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.pg-input[type=number]{-moz-appearance:textfield}
.utc-footer{width:100%;text-align:center;font-size:14px;color:var(--muted-fg);margin-top:12px}

/* ── Positions table ── */
.tw{width:100%;overflow-x:auto;margin-top:8px}
.tw table{width:100%;border-collapse:collapse;min-width:900px}
.tw thead th{position:sticky;top:0;background:var(--bg);color:var(--muted-fg);font-weight:500;font-size:13px;text-transform:uppercase;letter-spacing:.05em;padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);white-space:nowrap}
.tw tbody tr{border-bottom:1px solid rgba(39,39,42,.5);transition:background .1s}
.tw tbody tr:hover{background:rgba(39,39,42,.4)}
.tw td{padding:8px 12px;white-space:nowrap;vertical-align:middle;font-size:15px}
.tw .n{text-align:right}
.tw .mc{display:flex;align-items:center;gap:6px}
.tw .mi{width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle}
.tw .mi-fb{width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}
.tw .cur{color:var(--muted-fg);font-size:14px;margin-left:2px}
.tw .pc{display:flex;flex-direction:column;line-height:1.3;text-align:right}
.tw .pv{font-weight:500} .tw .pp{font-size:14px;color:var(--muted-fg)}
.tw .pnl-pos{color:var(--positive)} .tw .pnl-neg{color:var(--negative)}
.tw .side-l{color:var(--positive)} .tw .side-s{color:var(--negative)}
.tw .idc{color:var(--muted-fg);font-family:'SF Mono','Consolas','Courier New',monospace;font-size:14px}
.tw .lev{background:var(--accent);border-radius:3px;padding:1px 6px;font-size:14px;color:var(--muted-fg)}
.tw .src-badge{font-size:14px;padding:2px 10px;border-radius:4px;font-weight:500}
.tw .src-f{background:rgba(87,65,217,.15);color:#8b7ae8}
.tw .src-s{background:rgba(34,197,94,.1);color:#4ade80}
.tw th.sortable{cursor:pointer;user-select:none;position:relative;padding-right:20px}
.tw th.sortable:hover{color:var(--fg)}
.tw th.sortable::after{content:'\\21C5';position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:13px;opacity:.4}
.tw th.sortable.asc::after{content:'\\2191';opacity:.8}
.tw th.sortable.desc::after{content:'\\2193';opacity:.8}

/* ── Responsive ── */
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
@media(max-width:1024px){.metrics-row{grid-template-columns:1fr 1fr}}
@media(max-width:768px){
  .dashboard{padding:16px 12px 32px}
  .dh-title{font-size:16px}
  .hero-row{grid-template-columns:1fr}
  .metrics-row{grid-template-columns:1fr}
  .hero-val{font-size:26px}
  .tl{width:100%} .tt{flex:1;text-align:center;padding:7px 10px}
  .toolbar{flex-direction:column;align-items:stretch}
  .toolbar-right{justify-content:flex-start}
}
@media(max-width:900px){
  .kn-date-header{margin-left:0}
  .date-input{width:110px}
  .kn-middle{gap:4px}
  .kn-curr{width:24px;height:24px}
  .kn-curr-fallback{width:24px;height:24px;font-size:13px}
  .kn-bank,.kn-funnel{font-size:22px;width:24px}
  .kn-mid-icon{font-size:16px}
}
@media(max-width:560px){
  .kn-row,.kn-row.kn-tall{height:auto!important;min-height:0;display:grid;grid-template-columns:30px auto 1fr auto;grid-template-rows:auto auto;gap:2px 8px;padding:8px 10px;align-items:center}
  .kn-wallet-img{position:static;transform:none;grid-row:1/3;grid-column:1;width:26px;height:26px;align-self:center}
  .kn-type-block{position:static;transform:none;grid-row:1;grid-column:2;display:flex;align-items:baseline;gap:6px}
  .kn-type-label{font-size:13px;display:inline} .kn-time-label{font-size:13px;display:inline}
  .kn-tags-block{position:static;transform:none;grid-row:1;grid-column:4;justify-self:end}
  .kn-left-amt{position:static;transform:none;text-align:left;grid-row:2;grid-column:2;display:flex;gap:4px;align-items:baseline}
  .kn-middle{position:static;transform:none;grid-row:2;grid-column:3;justify-self:center;gap:4px}
  .kn-right-amt{position:static;transform:none;grid-row:2;grid-column:4;justify-self:end;text-align:right}
  .kn-right-slim{flex-wrap:wrap;justify-content:flex-end}
  .kn-sublabel,.kn-cost{display:none}
  .kn-amt{font-size:13px}
  .kn-curr{width:20px;height:20px} .kn-curr-fallback{width:20px;height:20px;font-size:13px}
  .kn-bank,.kn-funnel{font-size:18px;width:20px} .kn-mid-icon{font-size:14px}
  .kn-date-header{margin-left:0;font-size:14px}
  .date-input{width:100px;font-size:13px;padding:4px 6px}
  .fb{padding:4px 10px}
}
@media(max-width:480px){
  .dh{flex-direction:column;align-items:flex-start}
  .dh-right{width:100%;justify-content:space-between}
  .hero-row{grid-template-columns:1fr}
}
`;

export function buildDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kraken Portfolio</title>
  <link rel="icon" href="${KRAKEN_LOGO}">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  <style>${STYLES}</style>
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>
  <div class="lo" id="loadingOverlay" role="status" aria-live="polite">
    <div class="bs" aria-hidden="true"></div>
    <div class="lt" id="loadingText">Loading portfolio data...</div>
  </div>

  <main class="dashboard" id="main">
    <header class="dh">
      <div class="dh-left">
        <img class="dh-logo" src="${KRAKEN_LOGO}" alt="Kraken" width="32" height="32">
        <h1 class="dh-title">Kraken Portfolio</h1>
      </div>
      <div class="dh-right">
        <div class="filing-toggle">
          <label for="filingStatus">Filing</label>
          <select class="sel" id="filingStatus"><option value="single">Single</option><option value="married">Married</option></select>
        </div>
        <label for="yearSelect" class="sr-only">Filter by year</label>
        <select class="sel" id="yearSelect"><option value="all">All Years</option></select>
        <button class="btn btn-primary" id="syncBtn" type="button" onclick="syncData()">
          <span class="bi" aria-hidden="true">&#x21BB;</span><span class="sp" aria-hidden="true"></span> Sync
        </button>
      </div>
    </header>

    <section class="summary" aria-label="Portfolio summary">
      <div class="hero-row">
        <div class="hero">
          <div class="hero-label">Cash Balance</div>
          <div class="hero-val" id="vBal">&#x2014;</div>
          <div class="tax-detail" id="sBal"></div>
        </div>
        <div class="hero">
          <div class="hero-label">Tax Overview</div>
          <div class="hero-badge" id="taxBadge"></div>
          <div class="hero-val" id="vTax">&#x2014;</div>
          <div id="sTax"></div>
        </div>
      </div>
      <div class="metrics-row">
        <div class="metric">
          <div class="metric-left"><span class="metric-label">Futures P&amp;L</span><span class="metric-val" id="vFut">&#x2014;</span></div>
          <div class="metric-right" id="sFut"></div>
        </div>
        <div class="metric">
          <div class="metric-left"><span class="metric-label">Spot P&amp;L</span><span class="metric-val" id="vSpot">&#x2014;</span></div>
          <div class="metric-right" id="sSpot"></div>
        </div>
      </div>
      <div class="dh-sync-info" id="lastSync" aria-live="polite"></div>
    </section>

    <div class="tl" role="tablist" aria-label="Dashboard views">
      <button class="tt" role="tab" aria-selected="true" id="tab-tx" aria-controls="p-tx" tabindex="0"><span id="tab-tx-label">Transactions</span></button>
      <button class="tt" role="tab" aria-selected="false" id="tab-pos" aria-controls="p-pos" tabindex="-1"><span id="tab-pos-label">Positions</span></button>
    </div>

    <div class="tc active" id="p-tx" role="tabpanel" aria-labelledby="tab-tx">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="fg" role="group" aria-label="Source filter" id="txFilterGroup">
            <button class="fb active" data-source="all" type="button">All</button>
            <button class="fb" data-source="futures" type="button">Futures</button>
            <button class="fb" data-source="spots" type="button">Spots</button>
          </div>
          <span class="count-badge" id="txCount" aria-live="polite">0</span>
        </div>
        <div class="toolbar-right">
          <div class="date-range">
            <input type="date" class="date-input" id="dateFrom" aria-label="From date">
            <span class="dr-sep">&#x2192;</span>
            <input type="date" class="date-input" id="dateTo" aria-label="To date">
            <button class="dr-clear" id="clearDates" type="button" aria-label="Clear dates">&#x2715;</button>
          </div>
          <select class="sel" id="perPage"><option value="0">All</option><option value="50">50</option><option value="100" selected>100</option></select>
        </div>
      </div>
      <div class="kn-content" id="txContent"></div>
      <div class="pgn" id="pagination"></div>
    </div>

    <div class="tc" id="p-pos" role="tabpanel" aria-labelledby="tab-pos">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="fg" role="group" aria-label="Position source filter" id="posFilterGroup">
            <button class="fb active" data-source="all" type="button">All</button>
            <button class="fb" data-source="futures" type="button">Futures</button>
            <button class="fb" data-source="spots" type="button">Spots</button>
          </div>
          <div class="fg" role="group" aria-label="Side filter" id="posSideGroup">
            <button class="fb active" data-side="all" type="button">Both</button>
            <button class="fb" data-side="Long" type="button">Long</button>
            <button class="fb" data-side="Short" type="button">Short</button>
          </div>
          <span class="count-badge" id="posCount" aria-live="polite">0</span>
        </div>
        <div class="toolbar-right">
          <div class="date-range">
            <input type="date" class="date-input" id="posDateFrom" aria-label="From date">
            <span class="dr-sep">&#x2192;</span>
            <input type="date" class="date-input" id="posDateTo" aria-label="To date">
            <button class="dr-clear" id="clearPosDates" type="button" aria-label="Clear dates">&#x2715;</button>
          </div>
        </div>
      </div>
      <div id="posContent"></div>
    </div>
  </main>

<script>
/* ═══════════════════════════════════════════
   A — Constants & State
   ═══════════════════════════════════════════ */
var KRAKEN_LOGO='${KRAKEN_LOGO}';
var KRAKEN_API='${KRAKEN_API_ICON}';
var ICON_CDN='${CRYPTO_ICON_CDN}';
var EUR_ICON='${EUR_ICON}';
var USD_ICON='${USD_ICON}';
var CRYPTO_BG={BTC:'#f7931a',ETH:'#627eea',SOL:'#9945ff',DOGE:'#c2a633',PEPE:'#4a8c3f',XRP:'#23292f',ADA:'#0033ad',DOT:'#e6007a',LTC:'#bfbbbb'};
var ONE_YEAR_MS=365.25*24*60*60*1000;
var STORAGE_KEY='kraken_dashboard_v2';
var allData=null, allRows=[], allPositions=[], currentPage=1, eurUsdRate=1.155;

/* ═══════════════════════════════════════════
   B — SSE Sync & Storage
   ═══════════════════════════════════════════ */
function streamSync(onP,onC,onE){var es=new EventSource('/sync');es.addEventListener('progress',function(e){onP(JSON.parse(e.data).message)});es.addEventListener('complete',function(e){es.close();onC(JSON.parse(e.data))});es.addEventListener('error',function(e){if(es.readyState===EventSource.CLOSED)return;es.close();try{onE(JSON.parse(e.data).message)}catch(x){onE('Connection lost')}});return es}
function save(d){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}catch(e){}}
function load(){try{var r=localStorage.getItem(STORAGE_KEY);if(r)return JSON.parse(r)}catch(e){}try{var o=localStorage.getItem('kraken_dashboard_data');if(o)return JSON.parse(o)}catch(e){}try{var o2=localStorage.getItem('kraken_tx_data');if(o2)return JSON.parse(o2)}catch(e){}return null}
function showL(t){document.getElementById('loadingOverlay').classList.remove('hidden');document.getElementById('loadingText').textContent=t||'Loading...'}
function hideL(){document.getElementById('loadingOverlay').classList.add('hidden')}
function syncData(){var b=document.getElementById('syncBtn');b.classList.add('loading');b.disabled=true;showL('Connecting to Kraken APIs...');streamSync(function(m){document.getElementById('loadingText').textContent=m},function(d){allData=d;save(d);allRows=processData(d);allPositions=processPositions();currentPage=1;renderAll();b.classList.remove('loading');b.disabled=false;hideL()},function(e){document.getElementById('loadingText').textContent='Sync failed: '+e;setTimeout(hideL,3000);b.classList.remove('loading');b.disabled=false})}
window.syncData=syncData;

/* ═══════════════════════════════════════════
   C — Formatting
   ═══════════════════════════════════════════ */
function fmt(n,d){d=d===undefined?2:d;return Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}
function fmtA(n){var a=Math.abs(n);if(a>=1e6)return Math.round(a).toLocaleString('de-DE');if(a>=1)return a.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});return a.toFixed(4).replace('.',',')}
function fmtS(n){if(n>=1e6)return(n/1e6).toFixed(2)+'m';if(n>=1e3)return(n/1e3).toFixed(2)+'k';if(n>=1)return n.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});return n.toFixed(4).replace('.',',')}
function fmtT(iso){return new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'})}
function fmtDG(iso){return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}
function fmtD(iso){return new Date(iso).toLocaleDateString('en-US',{month:'numeric',day:'numeric',year:'2-digit'})}
function fmtDT(iso){return fmtD(iso)+' '+new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}
function fmtP(p){if(p<.01)return p.toFixed(6);if(p<1)return p.toFixed(4);return p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function fmtQ(q,s){if(q>=1e3)return q.toLocaleString('en-US',{maximumFractionDigits:0})+' '+s;if(q>=1)return q.toFixed(2)+' '+s;return q.toFixed(4)+' '+s}
function fmtAbs(v){var a=Math.abs(typeof v==='string'?parseFloat(v):v);if(a>=1)return a.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});if(a>=.01)return a.toFixed(4);return a.toFixed(8)}
function csym(c){return c==='EUR'?'\\u20AC':c==='USD'?'$':c}
function u2e(u){return u/eurUsdRate}

/* ═══════════════════════════════════════════
   D — Icon helpers (real crypto icons from CDN)
   ═══════════════════════════════════════════ */
// Dynamic coin icon resolver via CoinGecko search API
var SYM_ALIAS={XBT:'BTC',XDG:'DOGE'};
var iconCache={};
var iconPending={};
function resolveIcon(sym){
  if(!sym)return;
  var key=SYM_ALIAS[sym]||sym;
  if(iconCache[key]||iconPending[key])return;
  iconPending[key]=true;
  fetch('https://api.coingecko.com/api/v3/search?query='+encodeURIComponent(key)).then(function(r){return r.json()}).then(function(d){
    var coins=d.coins||[];
    var match=coins.find(function(c){return c.symbol.toUpperCase()===key.toUpperCase()})||coins[0];
    if(match&&match.thumb){iconCache[key]=match.large||match.small||match.thumb;refreshIcons()}
  }).catch(function(){}).finally(function(){delete iconPending[key]});
}
function refreshIcons(){
  document.querySelectorAll('img[data-coin]').forEach(function(img){
    var sym=img.getAttribute('data-coin');var key=SYM_ALIAS[sym]||sym;
    if(iconCache[key]&&img.src!==iconCache[key])img.src=iconCache[key];
  });
}
function getCurrSrc(name){
  if(name==='Euro'||name==='EUR')return EUR_ICON;
  if(name==='US Dollar'||name==='USD')return USD_ICON;
  var key=SYM_ALIAS[name]||name;
  if(key&&iconCache[key])return iconCache[key];
  if(key&&key.length<=8){resolveIcon(name);return ICON_CDN+key.toLowerCase()+'.png'}
  return null;
}
function imgFB(el){var l=el.getAttribute('data-l')||'?',b=el.getAttribute('data-b')||'#555';el.outerHTML='<span class="kn-curr-fallback" style="background:'+b+'">'+l+'</span>'}
window.imgFB=imgFB;
function currIconHTML(name){
  var src=getCurrSrc(name);if(src){var l=(name||'?')[0],b=CRYPTO_BG[name]||'#555';return'<img class="kn-curr" src="'+src+'" alt="" data-coin="'+name+'" data-l="'+l+'" data-b="'+b+'" onerror="imgFB(this)">'}
  return'<span class="kn-curr-fallback" style="background:'+(CRYPTO_BG[name]||'#555')+'">'+(name||'?')[0]+'</span>';
}
function coinImg(sym,sz){sz=sz||24;var url=getCurrSrc(sym)||ICON_CDN+(SYM_ALIAS[sym]||sym||'').toLowerCase()+'.png',b=CRYPTO_BG[sym]||'#555';return'<img class="mi" src="'+url+'" width="'+sz+'" height="'+sz+'" alt="" data-coin="'+sym+'" data-l="'+(sym||'?')[0]+'" data-b="'+b+'" onerror="imgFB(this)">'}

/* ═══════════════════════════════════════════
   E — Transaction normalization (preserved exactly)
   ═══════════════════════════════════════════ */
function normalizeFuturesTx(tx){
  var cur=tx.currency||'USD',curI=cur==='EUR'?'Euro':'US Dollar';
  var isP=tx.type==='Deposit'?true:tx.type==='Withdrawal'?false:tx.amount>=0;
  var sign=isP?'+':'-',eurEq=null;
  if(cur==='USD'&&tx.amount!==0)eurEq='\\u2248 '+fmtA(Math.abs(tx.amount)/eurUsdRate)+' \\u20AC';
  else if(cur==='EUR')eurEq='\\u2248 '+fmtA(Math.abs(tx.amount))+' \\u20AC';
  var gv=null;if(tx.type==='Realized P&L'){var ev=cur==='USD'?Math.abs(tx.amount)/eurUsdRate:Math.abs(tx.amount);gv=(isP?'':'-')+fmtA(ev)+' \\u20AC'}
  return{source:'futures',date:tx.date,type:tx.type,time:fmtT(tx.date),wallet:'Kraken Futures',sign:sign,amount:fmtA(Math.abs(tx.amount))+' '+(cur==='EUR'?'\\u20AC':'$'),eurEquiv:eurEq,tag:tx.tag||null,currencyIcon:curI,secondAmount:null,fee:null,gainValue:gv,gainPositive:isP,costBasis:null,_fromCur:null,_toCur:null,_rawAmount:Math.abs(tx.amount),_rawCurrency:cur,_rawType:tx.type,_rawDate:tx.date}
}

function normalizeSpotTx(tx){
  var label=tx.label||null,isTrade=tx.type==='buy'||tx.type==='sell',iFW=tx.type==='fiat_withdrawal',iFD=tx.type==='fiat_deposit',iCW=tx.type==='crypto_withdrawal',iCD=tx.type==='crypto_deposit',isIn=iFD||iCD,isOut=iFW||iCW;
  var dt,uF=false,tag=null;
  if(iFW&&label==='realized_gain'){dt='Realized P&L';uF=true;tag='margin'}
  else if(iFW&&label==='loan_fee'){dt='Loan fee';uF=true;tag='rollover'}
  else if(iFD&&label==='realized_gain'){dt='Realized P&L';uF=true;tag='margin'}
  else if(iFW||iCW)dt='Withdrawal';
  else if(iFD||iCD)dt='Deposit';
  else if(tx.type==='buy'){dt='Buy';tag=label==='crypto_swap'?'swap':'trade'}
  else if(tx.type==='sell'){dt='Sell';tag='trade'}
  else dt=tx.type;
  var pCur,pAmt,pIcon;
  if(isIn){pCur=tx.to?.currency?.symbol||'EUR';pAmt=parseFloat(tx.to?.amount||'0')}
  else if(isOut){pCur=tx.from?.currency?.symbol||'EUR';pAmt=parseFloat(tx.from?.amount||'0')}
  else if(isTrade){if(tx.type==='buy'){pCur=tx.from?.currency?.symbol||'EUR';pAmt=parseFloat(tx.from?.amount||'0')}else{pCur=tx.to?.currency?.symbol||'EUR';pAmt=parseFloat(tx.to?.amount||'0')}}
  else{pCur='EUR';pAmt=parseFloat(tx.net_value||'0')}
  pIcon=pCur==='EUR'?'Euro':pCur==='USD'?'US Dollar':pCur;
  var sign;
  if(dt==='Realized P&L'||dt==='Funding fee'||dt==='Loan fee'){sign=iFD?'+':'-'}
  else if(isIn||tx.type==='sell')sign='+';else sign='-';
  var eurEq=null;
  if(pCur==='USD')eurEq='\\u2248 '+fmtA(pAmt/eurUsdRate)+' \\u20AC';
  else if(pCur==='EUR'&&(dt==='Realized P&L'||dt==='Funding fee'||dt==='Loan fee'||dt==='Withdrawal'||dt==='Deposit'))eurEq='\\u2248 '+fmtA(pAmt)+' \\u20AC';
  else if(isTrade&&tx.type==='buy')eurEq='\\u2248 '+fmtA(pAmt)+' \\u20AC';
  var sa=null;
  if(isTrade){if(tx.type==='buy'){var tc=tx.to?.currency?.symbol||'?',ta=parseFloat(tx.to?.amount||'0');sa='+ '+fmtS(ta)+' '+tc}else{var fc=tx.from?.currency?.symbol||'?',fa=parseFloat(tx.from?.amount||'0');sa='- '+fmtS(fa)+' '+fc}}
  var fee=null;
  if(tx.fee&&parseFloat(tx.fee_value||'0')>0){var fA=parseFloat(tx.fee.amount),fP=pAmt>0?(fA/pAmt*100):0;if(fP>0&&fP<100)fee=fP.toFixed(fP>=.1?1:2)+'% fee'}
  var gv=null,gp=true,g=parseFloat(tx.gain||'0');
  if(g!==0&&(isTrade||dt==='Realized P&L')){gp=g>=0;gv=(g>=0?'':'-')+fmtA(Math.abs(g))+' \\u20AC'}
  if(dt==='Realized P&L'&&label==='realized_gain'&&!gv){if(iFW){gp=false;gv='-'+fmtA(pAmt)+' \\u20AC'}else if(iFD){gp=true;gv=fmtA(pAmt)+' \\u20AC'}}
  var cb=null;
  if(tx.type==='sell'&&tx.from?.cost_basis){var cv=parseFloat(tx.from.cost_basis);if(cv>0)cb='-'+fmtA(cv)+' \\u20AC cost'}
  return{source:'spots',date:tx.date,type:dt,time:fmtT(tx.date),wallet:'Kraken (API keys)',sign:sign,amount:fmtA(pAmt)+' '+(pCur==='EUR'?'\\u20AC':pCur==='USD'?'$':pCur),eurEquiv:eurEq,tag:tag,currencyIcon:pIcon,secondAmount:sa,fee:fee,gainValue:gv,gainPositive:gp,costBasis:cb,_fromCur:tx.from?.currency?.symbol||null,_toCur:tx.to?.currency?.symbol||null,_useFunnelIcon:uF,_rawAmount:pAmt,_rawCurrency:pCur,_rawType:tx.type,_rawDate:tx.date,_label:label}
}

function detectTransfers(rows){
  var fR=[],sR=[];rows.forEach(function(r){if(r.source==='futures'&&(r._rawType==='Deposit'||r._rawType==='Withdrawal'))fR.push(r);if(r.source==='spots'&&(r.type==='Deposit'||r.type==='Withdrawal'))sR.push(r)});
  var used={};fR.forEach(function(fr){var exp=fr._rawType==='Deposit'?'Withdrawal':'Deposit';for(var i=0;i<sR.length;i++){if(used[i])continue;var sr=sR[i];if(sr.type!==exp||fr._rawCurrency!==sr._rawCurrency)continue;if(Math.abs(fr._rawAmount-sr._rawAmount)>.01)continue;if(Math.abs(new Date(fr._rawDate).getTime()-new Date(sr._rawDate).getTime())>30000)continue;fr.tag='transfer';sr.tag='transfer';used[i]=true;break}})
}
function tagExternalDeposits(rows){rows.forEach(function(r){if(r.source==='spots'&&r.type==='Deposit'&&!r.tag&&!r._label)r.tag='deposit'})}
function processData(sd){
  var rows=[];
  (sd.futuresTransactions||[]).forEach(function(tx){rows.push(normalizeFuturesTx(tx))});
  (sd.spotTransactions||[]).forEach(function(tx){rows.push(normalizeSpotTx(tx))});
  detectTransfers(rows);tagExternalDeposits(rows);
  rows.sort(function(a,b){return new Date(b.date)-new Date(a.date)});return rows;
}

/* ═══════════════════════════════════════════
   F — Row rendering (preserved exactly, using CDN icons)
   ═══════════════════════════════════════════ */
function getLayout(r){if(r.type==='Buy'||r.type==='Sell')return'trade';if(r.type==='Realized P&L'||r.type==='Funding fee'||r.type==='Loan fee')return r.sign==='+'?'inflow':'outflow';if(r.type==='Deposit')return'inflow';if(r.type==='Withdrawal')return'outflow';return r.sign==='+'?'inflow':'outflow'}
function arrClr(r){if(r.type==='Buy'||r.type==='Sell')return'#35baf6';return getLayout(r)==='inflow'?'#49b40b':'#dc3545'}
function usesF(r){return r.type==='Realized P&L'||r.type==='Funding fee'||r.type==='Loan fee'||r._useFunnelIcon}

function buildRowHTML(row,isFirst,isLast){
  var rT=isFirst?'border-top-left-radius:8px;border-top-right-radius:8px;':'';
  var rB=isLast?'border-bottom-left-radius:8px;border-bottom-right-radius:8px;':'';
  var ly=getLayout(row),wI=row.wallet==='Kraken Futures'?KRAKEN_LOGO:KRAKEN_API,ac=arrClr(row),iF=usesF(row);
  var mH;
  if(ly==='trade')mH=currIconHTML(row._fromCur||row.currencyIcon)+'<span class="kn-mid-icon" style="color:'+ac+'"><i class="fas fa-retweet"></i></span>'+currIconHTML(row._toCur||'EUR');
  else if(ly==='outflow'){var rI=iF?'<span class="kn-funnel"><i class="fas fa-funnel-dollar"></i></span>':'<span class="kn-bank"><i class="fas fa-landmark"></i></span>';mH=currIconHTML(row.currencyIcon)+'<span class="kn-mid-icon" style="color:'+ac+'"><i class="fas fa-arrow-right"></i></span>'+rI}
  else{var lI=iF?'<span class="kn-funnel"><i class="fas fa-funnel-dollar"></i></span>':'<span class="kn-bank"><i class="fas fa-landmark"></i></span>';mH=lI+'<span class="kn-mid-icon" style="color:'+ac+'"><i class="fas fa-arrow-right"></i></span>'+currIconHTML(row.currencyIcon)}
  var laH='';
  if(ly==='outflow')laH='<div class="kn-left-amt"><span class="kn-sublabel">'+row.wallet+'</span><span class="kn-amt">'+row.sign+' '+row.amount+'</span></div>';
  else if(ly==='trade'){if(row.type==='Sell'){laH='<div class="kn-left-amt"><span class="kn-sublabel">'+row.wallet+'</span><span class="kn-amt">'+(row.secondAmount||'')+'</span>'+(row.costBasis?'<span class="kn-cost">'+row.costBasis+'</span>':'')+'</div>'}else laH='<div class="kn-left-amt"><span class="kn-sublabel">'+row.wallet+'</span><span class="kn-amt">- '+row.amount+'</span></div>'}
  var raH='';
  if(ly==='inflow'){var gH='';if(row.gainValue){var gc=row.gainPositive?'#4bc0c0':'#ff6384';gH=' <span class="kn-dot">\\u2022</span> <span class="kn-gain" style="color:'+gc+'">'+row.gainValue+'</span>'}raH='<div class="kn-right-amt"><span class="kn-sublabel">'+row.wallet+'</span><span class="kn-amt">'+row.sign+' '+row.amount+'</span>'+(row.eurEquiv?'<span class="kn-eur-line">'+row.eurEquiv+gH+'</span>':'')+'</div>'}
  else if(ly==='outflow'){var gH2='';if(row.gainValue){var gc2=row.gainPositive?'#4bc0c0':'#ff6384';gH2='<span class="kn-dot">\\u2022</span> <span class="kn-gain" style="color:'+gc2+'">'+row.gainValue+'</span>'}raH='<div class="kn-right-amt kn-right-slim">'+(row.eurEquiv?'<span class="kn-eur-only">'+row.eurEquiv+'</span>':'')+gH2+'</div>'}
  else if(ly==='trade'){if(row.type==='Sell'){var gH3='';if(row.gainValue){var gc3=row.gainPositive?'#4bc0c0':'#ff6384';gH3='<span class="kn-eur-line"><span class="kn-dot">\\u2022</span> <span class="kn-gain" style="color:'+gc3+'">'+row.gainValue+'</span></span>'}raH='<div class="kn-right-amt"><span class="kn-sublabel">'+row.wallet+'</span><span class="kn-amt">+ '+row.amount+'</span>'+gH3+'</div>'}else raH='<div class="kn-right-amt"><span class="kn-sublabel">'+row.wallet+'</span><span class="kn-amt">'+(row.secondAmount||'')+'</span>'+(row.eurEquiv?'<span class="kn-eur-line">'+row.eurEquiv+'</span>':'')+'</div>'}
  var tgH='';
  if(row.tag)tgH+='<span class="kn-tag"><i class="fas fa-terminal kn-tag-i"></i> '+row.tag+'</span>';
  if(row.fee){var fI=row.type==='Sell'?EUR_ICON:(getCurrSrc(row._toCur||row.currencyIcon)||EUR_ICON);tgH+='<span class="kn-fee-pill"><img class="kn-fee-img" src="'+fI+'" alt="">'+row.fee+'</span>'}
  var tall=!!(row.eurEquiv||row.secondAmount||row.fee||row.costBasis);
  return'<div class="kn-row'+(tall?' kn-tall':'')+'" style="'+rT+rB+'"><img class="kn-wallet-img" src="'+wI+'" alt="" onerror="this.style.display=&apos;none&apos;"><div class="kn-type-block"><span class="kn-type-label">'+row.type+'</span><span class="kn-time-label">'+row.time+'</span></div>'+laH+'<div class="kn-middle">'+mH+'</div>'+raH+'<div class="kn-tags-block">'+tgH+'</div></div>';
}

/* ═══════════════════════════════════════════
   G — Transaction filtering, rendering, pagination
   ═══════════════════════════════════════════ */
function getFilteredRows(){
  var yr=getYear(),src=document.querySelector('#txFilterGroup .fb.active')?.dataset.source||'all';
  var df=document.getElementById('dateFrom').value,dt=document.getElementById('dateTo').value;
  var f=allRows;
  if(yr)f=f.filter(function(r){return new Date(r.date).getFullYear()===yr});
  if(src!=='all')f=f.filter(function(r){return r.source===src});
  if(df){var from=new Date(df);f=f.filter(function(r){return new Date(r.date)>=from})}
  if(dt){var to=new Date(dt+'T23:59:59');f=f.filter(function(r){return new Date(r.date)<=to})}
  return f;
}
function renderTx(){
  var f=getFilteredRows(),pp=parseInt(document.getElementById('perPage').value),tot=f.length;
  document.getElementById('txCount').textContent=tot;
  var pg=f,tp=1;
  if(pp>0){tp=Math.max(1,Math.ceil(tot/pp));if(currentPage>tp)currentPage=tp;var s=(currentPage-1)*pp;pg=f.slice(s,s+pp)}else currentPage=1;
  if(!pg.length){document.getElementById('txContent').innerHTML='<div class="empty">No transactions found</div>';document.getElementById('pagination').innerHTML='';return}
  var groups={},order=[];pg.forEach(function(r){var k=fmtDG(r.date);if(!groups[k]){groups[k]=[];order.push(k)}groups[k].push(r)});
  var h='';order.forEach(function(d){var rows=groups[d];h+='<div class="kn-date-header">'+d+'</div>';rows.forEach(function(r,i){h+=buildRowHTML(r,i===0,i===rows.length-1)})});
  document.getElementById('txContent').innerHTML=h;
  if(pp>0&&tp>1){var p='<button class="pb" onclick="goPage('+(currentPage-1)+')" '+(currentPage===1?'disabled':'')+' aria-label="Previous">&#8249;</button>';for(var i=1;i<=tp;i++){if(tp>9&&Math.abs(i-currentPage)>3&&i!==1&&i!==tp){if(i===2||i===tp-1)p+='<span style="color:var(--muted-fg);padding:0 4px">...</span>';continue}p+='<button class="pb'+(i===currentPage?' pa':'')+'" onclick="goPage('+i+')"'+(i===currentPage?' aria-current="page"':'')+'>'+i+'</button>'}p+='<button class="pb" onclick="goPage('+(currentPage+1)+')" '+(currentPage===tp?'disabled':'')+' aria-label="Next">&#8250;</button>';p+='<span class="pg-goto">Page <input type="number" class="pg-input" id="gotoP" min="1" max="'+tp+'" value="'+currentPage+'" aria-label="Go to page"> <button class="pb" onclick="goToP()">Go</button></span>';p+='<div class="utc-footer">All date/times are in UTC</div>';document.getElementById('pagination').innerHTML=p}else document.getElementById('pagination').innerHTML='<div class="utc-footer">All date/times are in UTC</div>';
}
function goPage(p){var pp=parseInt(document.getElementById('perPage').value);var f=getFilteredRows();var tp=pp>0?Math.max(1,Math.ceil(f.length/pp)):1;if(p<1)p=1;if(p>tp)p=tp;currentPage=p;renderTx();syncUrl();window.scrollTo(0,0)}
window.goPage=goPage;
function goToP(){var i=document.getElementById('gotoP');if(i)goPage(parseInt(i.value)||1)}
window.goToP=goToP;

/* ═══════════════════════════════════════════
   H — Positions (unified with source filtering)
   ═══════════════════════════════════════════ */
function processPositions(){
  if(!allData)return[];var pos=[];
  (allData.futuresPositions||[]).forEach(function(el){
    var u=el.event?.PositionUpdate;if(!u)return;
    var sym=(u.tradeable||'').replace(/^PF_/,'').replace(/USD$/,''),op=parseFloat(u.oldAverageEntryPrice),qty=parseFloat(u.executionSize),pnl=parseFloat(u.realizedPnL),cb=op*qty;
    pos.push({source:'futures',opened:(u.fillTime?new Date(u.fillTime):new Date(el.timestamp)).toISOString(),closed:new Date(el.timestamp).toISOString(),side:parseFloat(u.oldPosition)<0?'Short':'Long',market:sym+' Perp',symbol:sym,openPrice:op,closePrice:parseFloat(u.executionPrice),qty:qty,pnl:pnl,pnlPct:cb>0?(pnl/cb)*100:0,currency:(u.feeCurrency||'USD').toUpperCase(),id:(u.executionUid||'').slice(0,8),leverage:null})
  });
  // Spot margin positions
  (allData.spotPositions||[]).forEach(function(p){
    pos.push({source:'spots',opened:p.positionOpened,closed:p.positionClosed,side:p.side,market:p.market,symbol:p.base||p.symbol,openPrice:p.openingPrice,closePrice:p.closingPrice,qty:p.quantity,pnl:p.pnl,pnlPct:p.pnlPct,currency:p.currency,id:p.id||'',leverage:p.leverage||null})
  });
  // Spot trades with realized P&L (sells + swaps with cost basis)
  (allData.spotTransactions||[]).forEach(function(t){
    if(t.type!=='sell'&&!(t.type==='buy'&&t.label==='crypto_swap'))return;
    var g=parseFloat(t.gain||'0');if(g===0)return;
    var fromSym=t.from?.currency?.symbol||'?',toSym=t.to?.currency?.symbol||'?';
    var qty=parseFloat(t.from?.amount||'0'),cb=parseFloat(t.from?.cost_basis||'0');
    var proceeds=parseFloat(t.to?.amount||'0');
    var entryPrice=qty>0?cb/qty:0,exitPrice=qty>0?proceeds/qty:0;
    var pnlPct=cb>0?(g/cb)*100:0;
    pos.push({source:'spots',opened:t.from?.cost_basis_date||t.date,closed:t.date,side:'Long',market:fromSym+'/'+toSym,symbol:fromSym,openPrice:entryPrice,closePrice:exitPrice,qty:qty,pnl:g,pnlPct:pnlPct,currency:toSym,id:t.id||'',leverage:null})
  });
  pos.sort(function(a,b){return new Date(b.closed)-new Date(a.closed)});return pos;
}
var posSort={col:'closed',dir:'desc'};
function getFilteredPositions(){
  var yr=getYear(),src=document.querySelector('#posFilterGroup .fb.active')?.dataset.source||'all';
  var side=document.querySelector('#posSideGroup .fb.active')?.dataset.side||'all';
  var df=document.getElementById('posDateFrom').value,dt=document.getElementById('posDateTo').value;
  var f=allPositions;
  if(yr)f=f.filter(function(p){return new Date(p.closed).getFullYear()===yr});
  if(src!=='all')f=f.filter(function(p){return p.source===src});
  if(side!=='all')f=f.filter(function(p){return p.side===side});
  if(df){var from=new Date(df);f=f.filter(function(p){return new Date(p.closed)>=from})}
  if(dt){var to=new Date(dt+'T23:59:59');f=f.filter(function(p){return new Date(p.closed)<=to})}
  // Sort
  f=f.slice().sort(function(a,b){
    var c=posSort.col,va,vb;
    if(c==='opened'||c==='closed'){va=new Date(a[c]);vb=new Date(b[c])}
    else if(c==='pnl'||c==='pnlPct'||c==='openPrice'||c==='closePrice'||c==='qty'){va=a[c];vb=b[c]}
    else if(c==='market'||c==='side'||c==='source'){va=a[c];vb=b[c]}
    else{va=a[c];vb=b[c]}
    if(va<vb)return posSort.dir==='asc'?-1:1;
    if(va>vb)return posSort.dir==='asc'?1:-1;
    return 0;
  });
  return f;
}
function sortCol(col){if(posSort.col===col)posSort.dir=posSort.dir==='asc'?'desc':'asc';else{posSort.col=col;posSort.dir=col==='pnl'||col==='pnlPct'?'desc':'asc'}renderPos()}
window.sortCol=sortCol;
function thSort(col,label,align){var cls='sortable'+(posSort.col===col?' '+posSort.dir:'');return'<th class="'+cls+(align?' n':'')+'" onclick="sortCol(&apos;'+col+'&apos;)">'+label+'</th>'}
function renderPos(){
  var f=getFilteredPositions();document.getElementById('posCount').textContent=f.length;
  if(!f.length){document.getElementById('posContent').innerHTML='<div class="empty">No positions found</div>';return}
  var h='<div class="tw"><table><thead><tr>'+thSort('source','Source')+thSort('opened','Opened')+thSort('closed','Closed')+thSort('side','Side')+thSort('market','Market')+thSort('openPrice','Open Price',1)+thSort('qty','Qty',1)+thSort('closePrice','Close Price',1)+thSort('pnl','P&amp;L',1)+'<th class="n">ID</th></tr></thead><tbody>';
  f.forEach(function(p){
    var sC=p.side==='Short'?'side-s':'side-l',pC=p.pnl>=0?'pnl-pos':'pnl-neg',pS=p.pnl>=0?'+':'';
    var srcB=p.source==='futures'?'<span class="src-badge src-f">Futures</span>':'<span class="src-badge src-s">Spot</span>';
    h+='<tr><td>'+srcB+'</td><td>'+fmtDT(p.opened)+'</td><td>'+fmtDT(p.closed)+'</td><td><span class="'+sC+'">'+p.side+'</span></td><td><div class="mc">'+coinImg(p.symbol)+' '+p.market+'</div></td><td class="n">'+fmtP(p.openPrice)+' <span class="cur">'+csym(p.currency)+'</span></td><td class="n">'+fmtQ(p.qty,p.symbol)+'</td><td class="n">'+fmtP(p.closePrice)+' <span class="cur">'+csym(p.currency)+'</span></td><td class="n"><div class="pc '+pC+'"><span class="pv">'+pS+p.pnl.toFixed(2)+' '+csym(p.currency)+'</span><span class="pp">'+pS+p.pnlPct.toFixed(2)+'%</span></div></td><td class="n"><span class="idc">'+(p.id||'').slice(0,10)+'</span></td></tr>';
  });
  h+='</tbody></table></div>';document.getElementById('posContent').innerHTML=h;
}

/* ═══════════════════════════════════════════
   I — Year filter & Summary cards (incl. tax)
   ═══════════════════════════════════════════ */
function getYears(){if(!allData)return[];var y=new Set();(allData.futuresTransactions||[]).forEach(function(t){if(t.date)y.add(new Date(t.date).getFullYear())});(allData.spotTransactions||[]).forEach(function(t){if(t.date)y.add(new Date(t.date).getFullYear())});(allData.futuresPositions||[]).forEach(function(e){var t=e.timestamp||(e.event?.PositionUpdate?.fillTime);if(t)y.add(new Date(t).getFullYear())});(allData.spotPositions||[]).forEach(function(p){if(p.positionClosed)y.add(new Date(p.positionClosed).getFullYear())});return Array.from(y).sort(function(a,b){return b-a})}
var yearInitDone=false,urlYear=null;
function popYear(){var s=document.getElementById('yearSelect'),c=s.value;if(!yearInitDone){c=urlYear||String(new Date().getFullYear());yearInitDone=true}s.innerHTML='<option value="all">All Years</option>';getYears().forEach(function(y){s.innerHTML+='<option value="'+y+'"'+(String(y)===c?' selected':'')+'>'+y+'</option>'})}
function getYear(){var v=document.getElementById('yearSelect').value;return v==='all'?null:parseInt(v)}

function renderCards(){
  if(!allData)return;var yr=getYear();
  // ── Balance ──
  var fE=0,fU=0,flex=allData.futuresBalances?.flex;
  if(flex?.currencies){for(var c in flex.currencies){var i=flex.currencies[c];if(c==='EUR')fE+=i.quantity||0;else if(c==='USD')fU+=i.quantity||0}}
  var sE=(allData.spotBalances||{}).EUR||0,tot=fE+sE+u2e(fU);
  document.getElementById('vBal').textContent='\\u20AC'+fmt(tot);
  // Total P&L (computed after P&L section below, but we set balance breakdown first)
  document.getElementById('sBal').setAttribute('data-base','<span class="tax-gains">Futures \\u20AC'+fmt(fE)+' + $'+fmt(fU)+' \\u00B7 Spot \\u20AC'+fmt(sE)+'</span>');
  // ── P&L data ──
  var ft=allData.futuresTransactions||[];if(yr)ft=ft.filter(function(t){return new Date(t.date).getFullYear()===yr});
  var fT=0,fW=0,fL=0,fF=0;ft.forEach(function(t){if(t.type==='Realized P&L'){fT+=t.amount;if(t.amount>=0)fW++;else fL++}else if(t.type==='Funding fee')fF+=t.amount});
  var st=allData.spotTransactions||[];if(yr)st=st.filter(function(t){return new Date(t.date).getFullYear()===yr});
  var sT=0,sG=0,sL2=0;st.forEach(function(t){var g=parseFloat(t.gain||'0');if(g===0)return;sT+=g;if(g>=0)sG++;else sL2++});
  // Include spot margin positions in Spot P&L
  var sp=allData.spotPositions||[];if(yr)sp=sp.filter(function(p){return new Date(p.positionClosed).getFullYear()===yr});
  sp.forEach(function(p){var pnl=p.currency==='USD'?u2e(p.pnl):p.pnl;sT+=pnl;if(pnl>=0)sG++;else sL2++});
  // ── Futures metric ──
  var fe=document.getElementById('vFut');fe.textContent=(fT>=0?'+':'-')+'$'+fmt(Math.abs(fT));
  fe.className='metric-val'+(fT>0?' c-pos':fT<0?' c-neg':'');
  document.getElementById('sFut').innerHTML=fW+' wins<br>'+fL+' losses';
  // ── Spot metric (trades + margin positions) ──
  var se=document.getElementById('vSpot');se.textContent=(sT>=0?'+':'-')+'\\u20AC'+fmt(Math.abs(sT));
  se.className='metric-val'+(sT>0?' c-pos':sT<0?' c-neg':'');
  document.getElementById('sSpot').innerHTML=sG+' gains<br>'+sL2+' losses';
  document.getElementById('sBal').innerHTML=document.getElementById('sBal').getAttribute('data-base');
  // ── Tax hero ──
  var vTax=document.getElementById('vTax'),sTax=document.getElementById('sTax');
  var taxBadge=document.getElementById('taxBadge');
  if(!yr){vTax.textContent='\\u2014';vTax.className='hero-val';sTax.innerHTML='<div class="hero-sub">Select a year</div>';taxBadge.innerHTML='';
    if(allData.syncedAt)document.getElementById('lastSync').textContent='Synced '+new Date(allData.syncedAt).toLocaleString();return}
  var married=document.getElementById('filingStatus').value==='married';
  // § 23 — Spot/crypto private sales (Freigrenze: all-or-nothing threshold)
  var fg23=yr>=2024?1000:600;
  var sells=st.filter(function(t){return t.type==='sell'||(t.type==='buy'&&t.label==='crypto_swap')});
  var sG23=0,sL23=0;
  sells.forEach(function(s){var g=parseFloat(s.gain||'0'),cd=s.from?.cost_basis_date,lt=cd&&(new Date(s.date).getTime()-new Date(cd).getTime())>=ONE_YEAR_MS;if(!lt){if(g>=0)sG23+=g;else sL23+=g}});
  var mP=0;(allData.spotPositions||[]).filter(function(p){return new Date(p.positionClosed).getFullYear()===yr}).forEach(function(p){mP+=p.currency==='USD'?u2e(p.pnl):p.pnl});
  var lf=0;st.filter(function(t){return t.label==='loan_fee'}).forEach(function(t){lf+=parseFloat(t.net_value||'0')});
  var n23=sG23+sL23+mP-lf;
  var s23TaxFree=sG23+(mP>0?mP:0)<fg23;
  var s23Taxable=s23TaxFree?0:Math.max(0,n23);
  // § 20 — Derivatives (Sparerpauschbetrag: deduction)
  var sparer=married?2000:1000;
  var fG20=0,fL20=0,ffT=0;ft.forEach(function(t){if(t.type==='Realized P&L'){var e=u2e(t.amount);if(e>=0)fG20+=e;else fL20+=e}else if(t.type==='Funding fee')ffT+=u2e(t.amount)});
  var cL=Math.max(fL20,-20000),n20=fG20+cL+ffT;
  var s20Taxable=Math.max(0,n20-sparer);
  // Staking
  var stk=0;st.filter(function(t){return t.label==='staking'}).forEach(function(t){stk+=parseFloat(t.net_value||'0')});
  // Total
  var totalTaxable=s23Taxable+s20Taxable;
  var noTax=totalTaxable<=0;
  var totalGross=n23+n20+stk;
  if(noTax){
    vTax.textContent='No tax due';vTax.className='hero-val';
    taxBadge.innerHTML='<span class="tax-pill tax-pill-ok">Within allowances</span>';
    sTax.innerHTML='<div class="tax-detail"><span class="tax-gains">'+(totalGross>=0?'+':'-')+'\\u20AC'+fmt(Math.abs(totalGross))+' total gains</span></div>';
  } else {
    vTax.textContent='\\u20AC'+fmt(totalTaxable)+' taxable';vTax.className='hero-val c-neg';
    taxBadge.innerHTML='<span class="tax-pill tax-pill-due">Taxable</span>';
    var parts=[];
    if(s23Taxable>0)parts.push('Spot \\u20AC'+fmt(s23Taxable));
    if(s20Taxable>0)parts.push('Derivatives \\u20AC'+fmt(s20Taxable));
    sTax.innerHTML='<div class="tax-detail"><span class="tax-gains">'+(totalGross>=0?'+':'-')+'\\u20AC'+fmt(Math.abs(totalGross))+' total gains</span><span style="color:var(--muted-fg)">'+parts.join(' + ')+'</span></div>';
  }
  if(allData.syncedAt)document.getElementById('lastSync').textContent='Synced '+new Date(allData.syncedAt).toLocaleString();
}

/* ═══════════════════════════════════════════
   J — Tab switching
   ═══════════════════════════════════════════ */
function actTab(id){
  document.querySelectorAll('.tt').forEach(function(t){t.setAttribute('aria-selected','false');t.setAttribute('tabindex','-1')});
  document.querySelectorAll('.tc').forEach(function(p){p.classList.remove('active')});
  var tab=document.getElementById(id);
  if(tab){tab.setAttribute('aria-selected','true');tab.setAttribute('tabindex','0');var p=document.getElementById(tab.getAttribute('aria-controls'));if(p)p.classList.add('active')}
}
document.querySelectorAll('.tt').forEach(function(tab){
  tab.addEventListener('click',function(){actTab(tab.id);syncUrl()});
  tab.addEventListener('keydown',function(e){var tabs=Array.from(document.querySelectorAll('.tt')),idx=tabs.indexOf(tab);if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();var n=e.key==='ArrowRight'?(idx+1)%tabs.length:(idx-1+tabs.length)%tabs.length;tabs[n].focus();actTab(tabs[n].id);syncUrl()}})
});

/* ═══════════════════════════════════════════
   K — URL state
   ═══════════════════════════════════════════ */
function syncUrl(){
  var p=new URLSearchParams();
  var yr=document.getElementById('yearSelect').value;if(yr!=='all')p.set('year',yr);
  var tab=document.querySelector('.tt[aria-selected="true"]');if(tab&&tab.id!=='tab-tx')p.set('tab',tab.id.replace('tab-',''));
  var src=document.querySelector('#txFilterGroup .fb.active')?.dataset.source;if(src&&src!=='all')p.set('src',src);
  var df=document.getElementById('dateFrom').value;if(df)p.set('from',df);
  var dt=document.getElementById('dateTo').value;if(dt)p.set('to',dt);
  var pp=document.getElementById('perPage').value;if(pp!=='100')p.set('pp',pp);
  if(currentPage>1)p.set('page',String(currentPage));
  var psrc=document.querySelector('#posFilterGroup .fb.active')?.dataset.source;if(psrc&&psrc!=='all')p.set('psrc',psrc);
  var pside=document.querySelector('#posSideGroup .fb.active')?.dataset.side;if(pside&&pside!=='all')p.set('pside',pside);
  var pdf=document.getElementById('posDateFrom').value;if(pdf)p.set('pfrom',pdf);
  var pdt=document.getElementById('posDateTo').value;if(pdt)p.set('pto',pdt);
  if(posSort.col!=='closed')p.set('psort',posSort.col);
  if(posSort.dir!=='desc')p.set('pdir',posSort.dir);
  var qs=p.toString();
  window.history.replaceState(null,'',window.location.pathname+(qs?'?'+qs:''));
}
function restoreFromUrl(){
  var p=new URLSearchParams(window.location.search);
  if(p.get('year'))urlYear=p.get('year');
  if(p.get('tab'))actTab('tab-'+p.get('tab'));
  if(p.get('src')){document.querySelectorAll('#txFilterGroup .fb').forEach(function(b){b.classList.toggle('active',b.dataset.source===p.get('src'))})}
  if(p.get('from'))document.getElementById('dateFrom').value=p.get('from');
  if(p.get('to'))document.getElementById('dateTo').value=p.get('to');
  if(p.get('pp'))document.getElementById('perPage').value=p.get('pp');
  if(p.get('page'))currentPage=parseInt(p.get('page'))||1;
  if(p.get('psrc')){document.querySelectorAll('#posFilterGroup .fb').forEach(function(b){b.classList.toggle('active',b.dataset.source===p.get('psrc'))})}
  if(p.get('pside')){document.querySelectorAll('#posSideGroup .fb').forEach(function(b){b.classList.toggle('active',b.dataset.side===p.get('pside'))})}
  if(p.get('pfrom'))document.getElementById('posDateFrom').value=p.get('pfrom');
  if(p.get('pto'))document.getElementById('posDateTo').value=p.get('pto');
  if(p.get('psort'))posSort.col=p.get('psort');
  if(p.get('pdir'))posSort.dir=p.get('pdir');
}

/* ═══════════════════════════════════════════
   K2 — Event listeners
   ═══════════════════════════════════════════ */
document.querySelectorAll('#txFilterGroup .fb').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#txFilterGroup .fb').forEach(function(x){x.classList.remove('active')});b.classList.add('active');currentPage=1;renderTx();syncUrl()})});
document.querySelectorAll('#posFilterGroup .fb').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#posFilterGroup .fb').forEach(function(x){x.classList.remove('active')});b.classList.add('active');renderPos();syncUrl()})});
document.querySelectorAll('#posSideGroup .fb').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#posSideGroup .fb').forEach(function(x){x.classList.remove('active')});b.classList.add('active');renderPos();syncUrl()})});
document.getElementById('posDateFrom').addEventListener('change',function(){renderPos();syncUrl()});
document.getElementById('posDateTo').addEventListener('change',function(){renderPos();syncUrl()});
document.getElementById('clearPosDates').addEventListener('click',function(){document.getElementById('posDateFrom').value='';document.getElementById('posDateTo').value='';renderPos();syncUrl()});
document.getElementById('dateFrom').addEventListener('change',function(){currentPage=1;renderTx();syncUrl()});
document.getElementById('dateTo').addEventListener('change',function(){currentPage=1;renderTx();syncUrl()});
document.getElementById('clearDates').addEventListener('click',function(){document.getElementById('dateFrom').value='';document.getElementById('dateTo').value='';currentPage=1;renderTx();syncUrl()});
document.getElementById('perPage').addEventListener('change',function(){currentPage=1;renderTx();syncUrl()});
document.getElementById('yearSelect').addEventListener('change',function(){renderAll();syncUrl()});
document.getElementById('filingStatus').addEventListener('change',function(){try{localStorage.setItem('kraken_filing',this.value)}catch(e){}renderCards()});

/* ═══════════════════════════════════════════
   L — Main render & init
   ═══════════════════════════════════════════ */
function updateTabCounts(){
  var yr=getYear();
  var txC=allRows.length;if(yr)txC=allRows.filter(function(r){return new Date(r.date).getFullYear()===yr}).length;
  var posC=allPositions.length;if(yr)posC=allPositions.filter(function(p){return new Date(p.closed).getFullYear()===yr}).length;
  document.getElementById('tab-tx-label').textContent='Transactions ('+txC+')';
  document.getElementById('tab-pos-label').textContent='Positions ('+posC+')';
}
function renderAll(){
  if(!allData)return;popYear();renderCards();updateTabCounts();renderTx();renderPos();
}
(async function init(){
  try{var sf=localStorage.getItem('kraken_filing');if(sf)document.getElementById('filingStatus').value=sf}catch(e){}
  try{var r=await fetch('https://api.kraken.com/0/public/Ticker?pair=EURUSD');var d=await r.json();var t=d.result?.EURUSD||d.result?.ZEURZUSD;if(t)eurUsdRate=parseFloat(t.c[0])}catch(e){}
  var cached=load();
  restoreFromUrl();
  if(cached){allData=cached;allRows=processData(cached);allPositions=processPositions();renderAll();syncUrl();hideL()}
  else{showL('Connecting to Kraken APIs...');streamSync(function(m){document.getElementById('loadingText').textContent=m},function(d){allData=d;save(d);allRows=processData(d);allPositions=processPositions();renderAll();syncUrl();hideL()},function(e){document.getElementById('loadingText').textContent='Failed: '+e})}
})();
</script>
</body>
</html>`;
}
