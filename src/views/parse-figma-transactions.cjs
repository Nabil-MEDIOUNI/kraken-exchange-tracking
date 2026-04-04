const fs = require('fs');
const path = require('path');

const inputFile = 'C:/Users/n.mediouni/.claude/projects/C--Users-n-mediouni-OneDrive---DKB-Konzern-Desktop-Personal-kraken-portfolio-mcp/84a6164f-fa02-4e08-bdf4-5df59be1bf7e/tool-results/mcp-figma-get_design_context-1775296176219.txt';
const outputFile = path.join(__dirname, 'koinly-data.json');

const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const text = data[0].text;

// All 68 row IDs in order
const rowIds = [
  '147:1102', '147:1116', '147:1134', '147:1149', '147:1167', '147:1185', '147:1200', '147:1217',
  '147:1232', '147:1247', '147:1265', '147:1283', '147:1298', '147:1318', '147:1333', '147:1353',
  '147:1373', '147:1388', '147:1403', '147:1423', '147:1437', '147:1455', '147:1472', '147:1492',
  '147:1507', '147:1527', '147:1542', '147:1562', '147:1582', '147:1597', '147:1617', '147:1637',
  '147:1652', '147:1667', '147:1687', '147:1702', '147:1722', '147:1742', '147:1762', '147:1782',
  '147:1802', '147:1817', '147:1837', '147:1852', '147:1872', '147:1892', '147:1912', '147:1932',
  '147:1947', '147:1967', '147:1987', '147:2002', '147:2022', '147:2037', '147:2052', '147:2067',
  '147:2082', '147:2097', '147:2112', '147:2127', '147:2142', '147:2156', '147:2174', '147:2193',
  '147:2213', '147:2242', '147:2269', '147:2286'
];

// Extract date headers with their y-positions
const dateHeaderRe = /name="Heading 6 → Link → ([^"]+)"[^>]*y="([^"]+)"/g;
const dateHeaders = [];
let m;
while ((m = dateHeaderRe.exec(text)) !== null) {
  dateHeaders.push({ date: m[1], y: parseFloat(m[2]) });
}
dateHeaders.sort((a, b) => a.y - b.y);

// For each row, extract the content between this row's id and the next row's id (or end of section)
function getRowContent(rowId) {
  const marker = `id="${rowId}" name="Background+Border"`;
  const startIdx = text.indexOf(marker);
  if (startIdx === -1) {
    console.error(`Row ${rowId} not found!`);
    return null;
  }

  // Find the end: look for the next Background+Border frame or end of parent
  // We'll grab until the next `<frame id="147:` that starts a Background+Border
  const afterStart = startIdx + marker.length;
  const nextBB = text.indexOf('name="Background+Border"', afterStart);
  // Also look for closing section
  const endIdx = nextBB !== -1 ? nextBB : text.length;

  // Back up to find the `<frame ` before the next Background+Border
  let contentEnd = endIdx;
  if (nextBB !== -1) {
    // Find the `<frame id=` before the next Background+Border
    const searchBack = text.lastIndexOf('<frame id=', nextBB);
    if (searchBack > startIdx) {
      contentEnd = searchBack;
    }
  }

  const content = text.substring(startIdx, contentEnd);

  // Extract y position
  const yMatch = content.match(/y="([^"]+)"/);
  const y = yMatch ? parseFloat(yMatch[1]) : 0;

  return { content, y };
}

function decodeXml(str) {
  if (!str) return str;
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function parseRow(rowId) {
  const extracted = getRowContent(rowId);
  if (!extracted) return null;
  const { content, y } = extracted;

  const row = {
    rowId,
    type: null,
    time: null,
    wallet: null,
    sign: null,
    amount: null,
    eurEquiv: null,
    tag: null,
    currencyIcon: null,
    secondAmount: null,
    fee: null,
    _y: y
  };

  // Type: text inside Button menu frame
  const typeMatch = content.match(/name="Button menu"[^>]*>\s*<text[^>]*name="([^"]+)"/);
  if (typeMatch) row.type = typeMatch[1];

  // Time: text element with time pattern
  const timeMatch = content.match(/<text[^>]*name="(\d{1,2}:\d{2}\s*[AP]M)"/);
  if (timeMatch) row.time = timeMatch[1];

  // Collect all direct child elements (frames and texts) with their names
  // We need to be smarter about parsing - let's extract key elements

  // Get all frame elements with name and dimensions (30x30 = icon frames)
  const iconFrames = [];
  const iconRe = /<frame[^>]*name="([^"]+)"[^>]*width="30"[^>]*height="30"/g;
  let cm;
  while ((cm = iconRe.exec(content)) !== null) {
    iconFrames.push({ name: cm[1], pos: cm.index });
  }
  // Filter out generic names
  const namedIcons = iconFrames.filter(f =>
    !['Background+Border', 'Container', 'Button menu', 'Paragraph+Overlay', 'Overlay'].includes(f.name)
  );

  // Wallet: first named icon (30x30)
  if (namedIcons.length >= 1) {
    row.wallet = namedIcons[0].name;
  }

  // Currency icon: for non-trade rows, it's the second named icon
  // For trade rows, there are 3 icons: wallet, currency1, currency2
  if (namedIcons.length >= 2) {
    row.currencyIcon = namedIcons[1].name;
  } else if (namedIcons.length === 1) {
    row.currencyIcon = namedIcons[0].name;
  }

  // Container texts: extract all text children of Container frames
  const containerTexts = [];
  const containerRe = /name="Container"[^>]*>\s*<text[^>]*name="([^"]+)"/g;
  while ((cm = containerRe.exec(content)) !== null) {
    containerTexts.push(cm[1]);
  }

  // The first Container text is usually the wallet name (right side)
  // Then sign (+/-), then amount
  // For trade rows: wallet, sign, amount, then second sign+amount, currency ticker

  // Sign and amount
  for (let i = 0; i < containerTexts.length; i++) {
    const t = containerTexts[i];
    if ((t === '+' || t === '-') && row.sign === null) {
      row.sign = t;
      if (i + 1 < containerTexts.length) {
        row.amount = containerTexts[i + 1];
      }
    }
  }

  // Second amount for trade rows: text like "+ 104.99m" followed by ticker like "PEPE"
  for (let i = 0; i < containerTexts.length; i++) {
    const t = containerTexts[i];
    if (/^[+-]\s+[\d.,]+[mkbKMB]*$/.test(t)) {
      if (i + 1 < containerTexts.length) {
        row.secondAmount = `${t} ${containerTexts[i + 1]}`;
      } else {
        row.secondAmount = t;
      }
    }
  }

  // EUR equivalent
  const eurEquivMatch = content.match(/name="(≈[^"]+)"/);
  if (eurEquivMatch) row.eurEquiv = eurEquivMatch[1];

  // Tag: text in Paragraph+Overlay
  const tagMatch = content.match(/name="Paragraph\+Overlay"[^>]*>[\s\S]*?<text[^>]*name="Symbol"[^/]*\/>\s*<text[^>]*name="([^"]+)"/);
  if (tagMatch && tagMatch[1] !== 'Symbol') {
    row.tag = tagMatch[1];
  }

  // Fee: text in Overlay frame (but not Paragraph+Overlay)
  // Look for a frame named "Overlay" (not "Paragraph+Overlay") containing fee text
  const feeMatch = content.match(/name="Overlay"[^>]*>[\s\S]*?name="([^"]*fee[^"]*)"/i);
  if (feeMatch) row.fee = feeMatch[1];

  // Decode XML entities in all string fields
  for (const key of Object.keys(row)) {
    if (typeof row[key] === 'string') {
      row[key] = decodeXml(row[key]);
    }
  }

  return row;
}

// Parse all rows
const rows = rowIds.map(id => parseRow(id)).filter(Boolean);

// Group rows by date using y-positions
const dateGroups = [];

for (let i = 0; i < dateHeaders.length; i++) {
  const dh = dateHeaders[i];
  const nextDhY = i + 1 < dateHeaders.length ? dateHeaders[i + 1].y : Infinity;

  const groupRows = rows
    .filter(r => r._y >= dh.y && r._y < nextDhY)
    .sort((a, b) => a._y - b._y)
    .map(r => {
      const { _y, ...rest } = r;
      return rest;
    });

  if (groupRows.length > 0) {
    dateGroups.push({
      date: dh.date,
      rows: groupRows
    });
  }
}

const result = { dateGroups };
const totalRows = dateGroups.reduce((sum, g) => sum + g.rows.length, 0);

console.log(`Total date groups: ${dateGroups.length}`);
console.log(`Total rows: ${totalRows}`);
dateGroups.forEach(g => {
  console.log(`  ${g.date}: ${g.rows.length} rows`);
});

if (totalRows !== 68) {
  console.error(`WARNING: Expected 68 rows, got ${totalRows}`);
  const foundIds = new Set(dateGroups.flatMap(g => g.rows.map(r => r.rowId)));
  const missingIds = rowIds.filter(id => !foundIds.has(id));
  if (missingIds.length > 0) {
    console.error('Missing row IDs:', missingIds);
  }
}

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
console.log(`\nOutput written to ${outputFile}`);

// Print sample rows for verification
console.log('\nFirst 3 rows:');
console.log(JSON.stringify(dateGroups[0]?.rows?.slice(0, 3), null, 2));

// Print a trade row if found
const tradeRow = dateGroups.flatMap(g => g.rows).find(r => r.type === 'Buy' || r.type === 'Sell');
if (tradeRow) {
  console.log('\nTrade row sample:');
  console.log(JSON.stringify(tradeRow, null, 2));
}

// Print a transfer row if found
const transferRow = dateGroups.flatMap(g => g.rows).find(r => r.tag === 'transfer');
if (transferRow) {
  console.log('\nTransfer row sample:');
  console.log(JSON.stringify(transferRow, null, 2));
}
