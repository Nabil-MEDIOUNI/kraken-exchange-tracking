# Kraken Portfolio

A portfolio tracker and tax tool for Kraken day traders in Germany. Connects to the Kraken Futures and Spot APIs, computes FIFO cost basis, and tells you if you owe tax.

## What you get

**Dashboard** at `http://localhost:8000` with:
- Cash balance across Futures and Spot accounts
- Tax overview with filing status (single/married) and allowance calculations
- Futures P&L and Spot P&L summaries
- Merged transaction history with source filtering, date range, and pagination
- Positions table with sorting, side filtering (Long/Short), and source filtering
- Everything filterable by year, shareable via URL

**MCP Server** for AI assistants (Claude Code, Cursor, Codex) to query your portfolio and generate tax reports.

**REST API** for programmatic access to all your Kraken data.

## Quick start

```bash
git clone <repo-url> && cd kraken-portfolio-mcp
npm install
```

Create `.env`:

```env
KRAKEN_FUTURES_PUBLIC_KEY=your_key
KRAKEN_FUTURES_PRIVATE_KEY=your_key
KRAKEN_SPOT_API_KEY=your_key
KRAKEN_SPOT_API_SECRET=your_key
```

Run:

```bash
npm run dev     # dashboard with auto-reload
npm start       # production
npm run mcp     # MCP server for AI assistants
```

Open `http://localhost:8000` and hit Sync.

## Tax reporting

Built for German tax law. The dashboard shows a live tax overview per year. For a detailed report, ask your AI assistant:

> Generate my German crypto tax report for 2025

The MCP tool handles everything:
- **Spot trades** FIFO cost basis, 1-year holding period check, Freigrenze (1,000 EUR)
- **Margin positions** P&L classified under private sales
- **Futures** realized P&L + funding fees, Sparerpauschbetrag (1,000/2,000 EUR), 20k loss cap
- **Staking** rewards at EUR fair market value, 256 EUR Freigrenze

Returns Elster line references and a CSV for WISO Steuer or Taxfix.

## API

### Futures

| Endpoint | Returns |
|----------|---------|
| `GET /futures/balances` | Flex + cash account balances |
| `GET /futures/positions` | Closed position history with P&L |
| `GET /futures/transactions` | Realized P&L, funding fees, transfers |

### Spot

| Endpoint | Returns |
|----------|---------|
| `GET /spots/balances` | All non-zero balances |
| `GET /spots/positions` | Closed margin positions with P&L |
| `GET /spots/transactions` | Full history with FIFO cost basis |

### Other

| Endpoint | Returns |
|----------|---------|
| `GET /` | Dashboard |
| `GET /sync` | SSE stream for full data sync |
| `GET /health` | Server status |

## MCP setup

Add to your AI client config:

```json
{
  "mcpServers": {
    "kraken-portfolio": {
      "command": "npx",
      "args": ["tsx", "/path/to/kraken-portfolio-mcp/src/mcp-server.ts"],
      "env": {
        "KRAKEN_FUTURES_PUBLIC_KEY": "...",
        "KRAKEN_FUTURES_PRIVATE_KEY": "...",
        "KRAKEN_SPOT_API_KEY": "...",
        "KRAKEN_SPOT_API_SECRET": "..."
      }
    }
  }
}
```

### Available tools

| Tool | What it does |
|------|-------------|
| `kraken_tracker_futures_balances` | Futures account balances |
| `kraken_tracker_futures_positions` | Closed futures positions |
| `kraken_tracker_futures_transactions` | Futures transaction history |
| `kraken_tracker_spot_balances` | Spot balances |
| `kraken_tracker_spot_positions` | Spot margin positions |
| `kraken_tracker_spot_transactions` | Spot transactions with FIFO |
| `kraken_tracker_portfolio_summary` | Combined portfolio overview |
| `kraken_tracker_german_tax_report` | Full German tax report with CSV |

## Tech

- TypeScript + Express
- MCP SDK for AI tool integration
- FIFO lot tracking for cost basis
- Server-Sent Events for live sync
- CoinGecko API for crypto icons
- No frontend framework single self-contained HTML page
