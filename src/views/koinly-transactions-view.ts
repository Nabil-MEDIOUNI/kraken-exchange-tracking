import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface KoinlyRow {
  rowId: string;
  type: string;
  time: string;
  wallet: string;
  sign: string;
  amount: string;
  eurEquiv: string | null;
  tag: string | null;
  currencyIcon: string;
  secondAmount: string | null;
  fee: string | null;
}

interface DateGroup {
  date: string;
  rows: KoinlyRow[];
}

function loadData(): { dateGroups: DateGroup[] } {
  return JSON.parse(readFileSync(resolve(__dirname, "koinly-data.json"), "utf8"));
}

function loadIcons(): Record<string, string> {
  return JSON.parse(readFileSync(resolve(__dirname, "icon-data.json"), "utf8"));
}

function currIconKey(icon: string): string {
  if (icon === "Euro") return "euro";
  if (icon === "US Dollar") return "usd";
  if (icon === "Pepe") return "pepe";
  return "euro";
}

function walletIconKey(wallet: string): string {
  return wallet === "Kraken Futures" ? "kraken_futures" : "kraken_api";
}

// Layout type for a row
type Layout = "inflow" | "outflow" | "trade";

function getLayout(row: KoinlyRow): Layout {
  if (row.type === "Buy" || row.type === "Sell") return "trade";
  // Realized P&L and Funding fee: sign determines direction
  if (row.type === "Realized P&L" || row.type === "Funding fee") {
    return row.sign === "+" ? "inflow" : "outflow";
  }
  if (row.type === "Deposit") return "inflow";
  if (row.type === "Withdrawal") return "outflow";
  return row.sign === "+" ? "inflow" : "outflow";
}

// Arrow color
function arrowColor(row: KoinlyRow): string {
  const layout = getLayout(row);
  if (row.type === "Buy" || row.type === "Sell") return "#35baf6";
  return layout === "inflow" ? "#49b40b" : "#dc3545";
}

// Left icon (before arrow) for non-trade rows
function usesFunnelIcon(type: string): boolean {
  return type === "Realized P&L" || type === "Funding fee";
}

// Extract EUR gain value from eurEquiv for Realized P&L
function extractGainValue(row: KoinlyRow): string | null {
  if (row.type !== "Realized P&L" || !row.eurEquiv) return null;
  // eurEquiv is like "≈ 5,44 €" or "≈ 0,30 €"
  const match = row.eurEquiv.match(/≈\s*([\d,]+)\s*€/);
  if (!match) return null;
  if (row.sign === "+") return match[1] + " €";
  return "-" + match[1] + " €";
}

function gainColor(row: KoinlyRow): string {
  return row.sign === "+" ? "#4bc0c0" : "#ff6384";
}

function buildRow(row: KoinlyRow, icons: Record<string, string>, isFirst: boolean, isLast: boolean): string {
  const rTop = isFirst ? "border-top-left-radius:8px;border-top-right-radius:8px;" : "";
  const rBot = isLast ? "border-bottom-left-radius:8px;border-bottom-right-radius:8px;" : "";
  const layout = getLayout(row);
  const walletImg = icons[walletIconKey(row.wallet)];
  const currImg = icons[currIconKey(row.currencyIcon)];
  const arrClr = arrowColor(row);
  const isFunnel = usesFunnelIcon(row.type);

  // === Middle icons ===
  let middleHTML: string;
  if (layout === "trade") {
    // Buy: Euro → Pepe, Sell: Pepe → Euro
    const leftImg = row.type === "Buy" ? icons["euro"] : icons["pepe"];
    const rightImg = row.type === "Buy" ? icons["pepe"] : icons["euro"];
    middleHTML = `<img class="kn-curr" src="${leftImg}"><span class="kn-mid-icon" style="color:${arrClr}"><i class="fas fa-retweet"></i></span><img class="kn-curr" src="${rightImg}">`;
  } else if (layout === "outflow") {
    const rightIcon = isFunnel
      ? `<span class="kn-funnel"><i class="fas fa-funnel-dollar"></i></span>`
      : `<span class="kn-bank"><i class="fas fa-landmark"></i></span>`;
    middleHTML = `<img class="kn-curr" src="${currImg}"><span class="kn-mid-icon" style="color:${arrClr}"><i class="fas fa-arrow-right"></i></span>${rightIcon}`;
  } else {
    const leftIcon = isFunnel
      ? `<span class="kn-funnel"><i class="fas fa-funnel-dollar"></i></span>`
      : `<span class="kn-bank"><i class="fas fa-landmark"></i></span>`;
    middleHTML = `${leftIcon}<span class="kn-mid-icon" style="color:${arrClr}"><i class="fas fa-arrow-right"></i></span><img class="kn-curr" src="${currImg}">`;
  }

  // === Left amounts (outflow / trade source) ===
  let leftAmtHTML = "";
  if (layout === "outflow") {
    leftAmtHTML = `<div class="kn-left-amt">
      <span class="kn-sublabel">${row.wallet}</span>
      <span class="kn-amt">${row.sign} ${row.amount}</span>
    </div>`;
  } else if (layout === "trade") {
    if (row.type === "Sell") {
      // Sell: left shows PEPE sent + cost basis
      const secAmt = row.secondAmount || "";
      leftAmtHTML = `<div class="kn-left-amt">
        <span class="kn-sublabel">${row.wallet}</span>
        <span class="kn-amt">${secAmt}</span>
        <span class="kn-cost">-400,00 € cost</span>
      </div>`;
    } else {
      // Buy: left shows EUR sent
      leftAmtHTML = `<div class="kn-left-amt">
        <span class="kn-sublabel">${row.wallet}</span>
        <span class="kn-amt">- ${row.amount}</span>
      </div>`;
    }
  }

  // === Right amounts (inflow / trade destination / outflow EUR equiv) ===
  let rightAmtHTML = "";
  const gain = extractGainValue(row);

  if (layout === "inflow") {
    rightAmtHTML = `<div class="kn-right-amt">
      <span class="kn-sublabel">${row.wallet}</span>
      <span class="kn-amt">${row.sign} ${row.amount}</span>
      ${row.eurEquiv ? `<span class="kn-eur-line">${row.eurEquiv}${gain ? ` <span class="kn-dot">•</span> <span class="kn-gain" style="color:${gainColor(row)}">${gain}</span>` : ""}</span>` : ""}
    </div>`;
  } else if (layout === "outflow") {
    rightAmtHTML = `<div class="kn-right-amt kn-right-slim">
      ${row.eurEquiv ? `<span class="kn-eur-only">${row.eurEquiv}</span>` : ""}
      ${gain ? `<span class="kn-dot">•</span> <span class="kn-gain" style="color:${gainColor(row)}">${gain}</span>` : ""}
    </div>`;
  } else if (layout === "trade") {
    if (row.type === "Sell") {
      // Sell: right shows EUR received + P&L
      rightAmtHTML = `<div class="kn-right-amt">
        <span class="kn-sublabel">${row.wallet}</span>
        <span class="kn-amt">+ ${row.amount}</span>
        <span class="kn-eur-line"><span class="kn-dot">•</span> <span class="kn-gain" style="color:#ff6384">-12,62 €</span></span>
      </div>`;
    } else {
      // Buy: right shows PEPE received + EUR equiv
      const toAmt = row.secondAmount || "";
      rightAmtHTML = `<div class="kn-right-amt">
        <span class="kn-sublabel">${row.wallet}</span>
        <span class="kn-amt">${toAmt}</span>
        ${row.eurEquiv ? `<span class="kn-eur-line">${row.eurEquiv}</span>` : ""}
      </div>`;
    }
  }

  // === Tags ===
  let tagsHTML = "";
  if (row.tag) {
    tagsHTML += `<span class="kn-tag"><i class="fas fa-terminal kn-tag-i"></i> ${row.tag}</span>`;
  }
  if (row.fee) {
    // Sell fee icon = Euro, Buy fee icon = Pepe
    const feeImg = row.type === "Sell" ? icons["euro"] : icons["pepe"];
    tagsHTML += `<span class="kn-fee-pill"><img class="kn-fee-img" src="${feeImg}">${row.fee}</span>`;
  }

  // Tall rows: have eurEquiv, cost, gain, or second amount
  const isTall = !!(row.eurEquiv || row.secondAmount || row.fee);
  const cls = "kn-row" + (isTall ? " kn-tall" : "");

  return `<div class="${cls}" style="${rTop}${rBot}">
  <img class="kn-wallet-img" src="${walletImg}">
  <div class="kn-type-block">
    <span class="kn-type-label">${row.type}</span>
    <span class="kn-time-label">${row.time}</span>
  </div>
  ${leftAmtHTML}
  <div class="kn-middle">${middleHTML}</div>
  ${rightAmtHTML}
  <div class="kn-tags-block">${tagsHTML}</div>
</div>`;
}

export function buildKoinlyTransactionsHTML(): string {
  const data = loadData();
  const icons = loadIcons();

  let totalRows = 0;
  data.dateGroups.forEach(g => totalRows += g.rows.length);

  let bodyHTML = "";
  for (const group of data.dateGroups) {
    bodyHTML += `<div class="kn-date-header">${group.date}</div>`;
    for (let i = 0; i < group.rows.length; i++) {
      bodyHTML += buildRow(group.rows[i], icons, i === 0, i === group.rows.length - 1);
    }
  }

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
  <div class="kn-page">
    <div class="kn-header">
      <span class="kn-title">Transaction</span>
      <span class="kn-count">${totalRows}</span>
    </div>
    <div class="kn-content">${bodyHTML}</div>
  </div>
</body>
</html>`;
}

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0d1421;
    color: rgba(255,255,255,0.87);
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }

  .kn-page { max-width: 1265px; margin: 0 auto; padding: 43px 0 40px 0; }

  .kn-header {
    display: flex; align-items: center; gap: 15px;
    margin-left: 77px; margin-bottom: 24px;
    height: 42px;
  }
  .kn-title { font-size: 32px; font-family: Arial, sans-serif; line-height: 38.4px; }
  .kn-count {
    font-size: 14px; font-family: Arial, sans-serif;
    color: rgba(255,255,255,0.6);
    border: 1px solid #c0c0c0; border-radius: 10px;
    padding: 2px 8px; line-height: 14px;
  }

  .kn-date-header {
    font-size: 16px; font-family: Arial, sans-serif;
    color: rgba(255,255,255,0.87);
    line-height: 19.2px;
    margin-left: 92px;
    padding: 16px 0 9px 0;
  }

  .kn-content { display: flex; flex-direction: column; }

  /* Row — two heights: 65px (simple) and 89px (with extra line) */
  .kn-row {
    background: #141e2a;
    border: 1px solid rgba(255,255,255,0.1);
    margin-left: 77px;
    width: 1110px;
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
  .kn-type-label { font-size: 16px; line-height: 24px; display: block; }
  .kn-time-label {
    font-size: 12.8px; color: rgba(255,255,255,0.6);
    text-transform: uppercase; line-height: 19.2px; display: block;
  }

  /* Left amounts (outflows: right-aligned before center) */
  .kn-left-amt {
    position: absolute; right: calc(56% + 10px); top: 50%; transform: translateY(-50%);
    text-align: right;
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

  /* Middle icons — absolutely centered at 49.2% */
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

  /* Right amounts (inflows: left-aligned after center) */
  .kn-right-amt {
    position: absolute; left: calc(56% + 10px); top: 50%; transform: translateY(-50%);
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

  /* Tags — right-aligned */
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
`;
