# Data & Persistence Strategy

## Current State (February 2026)

### Active Supabase Integration ✅
- **Database**: Supabase PostgreSQL (Project: `jerirjkzrkquhgskoopq.supabase.co`)
- **Purpose**: Persistent storage for wallet lookups, trade data, and user annotations
- **Client**: `@supabase/supabase-js` v2.95.3

### Data Sources
1. **Mock Data**: `MOCK_TRADES` from `mockData.ts` for demo/testing
2. **Live Blockchain Data**: Fetched via `HeliusService` + `DeriverseTradeService`
3. **Persistent Storage**: Supabase for caching and annotations

---

## Database Schema

### Table: `user_wallets`

**Purpose**: Track Solana wallet addresses that have been looked up, with metadata about connection method and sync status.

#### Schema Definition

```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  network TEXT NOT NULL,
  wallet_provider TEXT NOT NULL DEFAULT 'manual',
  connection_method TEXT NOT NULL DEFAULT 'manual',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_wallets_address ON user_wallets(wallet_address);
CREATE INDEX idx_user_wallets_last_synced ON user_wallets(last_synced_at DESC);
```

#### Field Descriptions

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key, auto-generated |
| `wallet_address` | TEXT | No | - | Full Solana public key (44 chars) |
| `network` | TEXT | No | - | Solana network: `'devnet'`, `'mainnet'`, or `'mock'` |
| `wallet_provider` | TEXT | No | `'manual'` | Wallet app name: `'Phantom'`, `'Solflare'`, or `'manual'` |
| `connection_method` | TEXT | No | `'manual'` | How address was obtained: `'manual'` or `'wallet_connect'` |
| `last_synced_at` | TIMESTAMPTZ | Yes | `NULL` | When trades were last fetched from blockchain |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | When this wallet was first added |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | When any field was last modified |

#### Design Decisions

**Why `wallet_provider` and `connection_method` have defaults:**
- Avoids NULL complexity in queries and application code
- `'manual'` is a sensible default for manually entered addresses
- Overridden to actual wallet name (e.g., `'Phantom'`) when using wallet connect
- Reduces need for null checks in TypeScript

**Why `last_synced_at` is nullable:**
- `NULL` explicitly means "never synced" (wallet saved but trades not fetched yet)
- Allows saving wallet address before running blockchain lookup
- Used to show "Last updated X hours ago" or "Never synced" in UI

**Why `updated_at` is separate from `last_synced_at`:**
- `updated_at`: Database metadata (when ANY field changed)
- `last_synced_at`: Business logic (when blockchain data was fetched)
- Serves different purposes: audit trail vs data freshness

#### Example Data

**Manual Address Entry:**
```sql
{
  "wallet_address": "7xKXtG2JtPZy4WqU9emKfbeuSTePDnSqeAACqVNx3k8s",
  "network": "devnet",
  "wallet_provider": "manual",
  "connection_method": "manual",
  "last_synced_at": "2026-02-13T17:30:00+05:30",
  "created_at": "2026-02-13T17:30:00+05:30",
  "updated_at": "2026-02-13T17:30:00+05:30"
}
```

**Wallet Connect (Phantom):**
```sql
{
  "wallet_address": "ABC123xyz456...",
  "network": "devnet",
  "wallet_provider": "Phantom",
  "connection_method": "wallet_connect",
  "last_synced_at": "2026-02-13T18:00:00+05:30",
  "created_at": "2026-02-13T18:00:00+05:30",
  "updated_at": "2026-02-13T18:00:00+05:30"
}
```

---

## Data Flow

### Wallet Lookup Flow

```
User Action (Manual or Wallet Connect)
         ↓
Check Supabase: Does wallet exist?
         ↓
    ┌────┴────┐
   YES       NO
    ↓         ↓
Load from    Fetch from blockchain
database     (HeliusService + DeriverseTradeService)
    ↓         ↓
Check if     Save to Supabase:
data stale   - user_wallets (wallet info)
    ↓         - trades (trade data)
Show         - trade_annotations (notes)
"Refresh"         ↓
button       Show fresh data
```

### Caching Strategy

- **Fresh data**: `last_synced_at` < 24 hours → Load from cache
- **Stale data**: `last_synced_at` > 24 hours → Show "Refresh" button
- **Never synced**: `last_synced_at` IS NULL → Auto-fetch from blockchain

---

## Client-Side Storage

### localStorage (Annotations Only)
- **Path**: `src/lib/annotationStorage.ts`
- **Purpose**: Fallback for offline mode, synced to Supabase when online
- **Data**: Trade notes, tags, lessons learned

### React State
- **Ephemeral**: Trade data in component state (TradeHistory.tsx)
- **Cleared**: On page refresh or navigation
- **Backed by**: Supabase for persistence

---

## Future Enhancements

### Planned Tables

**`trades`** - Cache blockchain trade data
- Store full trade details (symbol, PnL, fees, timestamps)
- Link to `wallet_address` via foreign key
- Enable fast analytics without re-fetching from blockchain

**`trade_annotations`** - Migrate from localStorage
- Store journal entries (notes, tags, lessons)
- Link to both `wallet_address` and `trade_id`
- Enable cross-device sync

### Performance Optimizations
- Implement SWR or TanStack Query for client-side caching
- Add real-time subscriptions for live trade updates
- Pre-calculate analytics (win rate, total PnL) in database

---

## Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jerirjkzrkquhgskoopq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

See `.env.example` for template.

---

## Migration Notes

### From Previous State
- **Before**: No database, all data ephemeral
- **After**: Supabase for persistent wallet tracking
- **Breaking Changes**: None (additive only)

### Backward Compatibility
- Mock data mode still works without database
- Lookup feature works without Supabase (just slower, no caching)
- Annotations still use localStorage as fallback

---

## Table: `trades`

**Purpose**: Cache blockchain trade data from Deriverse for fast loading, offline analytics, and historical preservation.

### Schema

```sql
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES user_wallets(wallet_address) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  side TEXT NOT NULL,
  order_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  notional NUMERIC NOT NULL,
  pnl NUMERIC NOT NULL,
  fee NUMERIC NOT NULL,
  fee_currency TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  is_win BOOLEAN NOT NULL,
  tx_signature TEXT NOT NULL,
  is_maker BOOLEAN,
  leverage NUMERIC,
  liquidation_price NUMERIC,
  margin_used NUMERIC,
  fee_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Storage Estimates

**Per Trade:** ~420 bytes (350 bytes data + 70 bytes indexes)

**Capacity (Supabase Free Tier: 500 MB):**
- 1,000 trades = 420 KB (0.08% used)
- 10,000 trades = 4.2 MB (0.84% used)
- 100,000 trades = 42 MB (8.4% used)
- 1,000,000 trades = 420 MB (84% used)

**Index Overhead:** ~20% (68 KB for 1000 trades)
- Trade-off: 2-3ms slower inserts, 100x faster queries

### Design Decisions

**NUMERIC vs FLOAT:**
- NUMERIC: Exact precision (0.1 + 0.2 = 0.3) ✅
- FLOAT: Rounding errors (0.1 + 0.2 ≠ 0.3) ❌
- Industry standard for financial data
- Handles crypto decimals (e.g., 0.000000000003)

**Manual Save Strategy:**
- User clicks "Save Trades" button in UI
- No auto-save (user control)
- Upsert logic (safe to save multiple times)

---

## Analytics SQL Queries

### Overall Performance Summary
```sql
SELECT 
  COUNT(*) as total_trades,
  SUM(pnl) as total_pnl,
  SUM(fee) as total_fees,
  SUM(pnl) - SUM(fee) as net_profit,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE COUNT(*) FILTER (WHERE is_win = true)::float / COUNT(*) * 100
  END as win_rate_percent,
  AVG(pnl) as avg_pnl_per_trade
FROM trades 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

### Performance by Symbol
```sql
SELECT 
  symbol,
  COUNT(*) as trades,
  SUM(pnl) as total_pnl,
  SUM(fee) as total_fees,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE COUNT(*) FILTER (WHERE is_win = true)::float / COUNT(*) * 100
  END as win_rate_percent,
  AVG(pnl) as avg_pnl
FROM trades 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS'
GROUP BY symbol
ORDER BY total_pnl DESC;
```

### Performance by Side (Long vs Short)
```sql
SELECT 
  side,
  COUNT(*) as trades,
  SUM(pnl) as total_pnl,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE COUNT(*) FILTER (WHERE is_win = true)::float / COUNT(*) * 100
  END as win_rate_percent
FROM trades 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS'
GROUP BY side
ORDER BY total_pnl DESC;
```

### Best and Worst Trades
```sql
-- Best 10 trades
SELECT symbol, side, pnl, fee, closed_at, tx_signature
FROM trades 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS'
ORDER BY pnl DESC
LIMIT 10;

-- Worst 10 trades
SELECT symbol, side, pnl, fee, closed_at, tx_signature
FROM trades 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS'
ORDER BY pnl ASC
LIMIT 10;
```

### Daily Performance
```sql
SELECT 
  DATE(closed_at) as trade_date,
  COUNT(*) as trades,
  SUM(pnl) as daily_pnl,
  SUM(fee) as daily_fees,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE COUNT(*) FILTER (WHERE is_win = true)::float / COUNT(*) * 100
  END as win_rate_percent
FROM trades 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS'
GROUP BY DATE(closed_at)
ORDER BY trade_date DESC;
```

### Winning vs Losing Trades
```sql
SELECT 
  CASE WHEN is_win THEN 'Winning' ELSE 'Losing' END as trade_type,
  COUNT(*) as count,
  SUM(pnl) as total_pnl,
  AVG(pnl) as avg_pnl,
  MIN(pnl) as min_pnl,
  MAX(pnl) as max_pnl
FROM trades 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS'
GROUP BY is_win
ORDER BY is_win DESC;
```

### Cumulative PnL Over Time
```sql
SELECT 
  closed_at,
  symbol,
  pnl,
  SUM(pnl) OVER (ORDER BY closed_at) as cumulative_pnl
FROM trades 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS'
ORDER BY closed_at;
```

### Multi-Wallet Summary
```sql
SELECT 
  wallet_address,
  COUNT(*) as total_trades,
  SUM(pnl) as total_pnl,
  SUM(fee) as total_fees,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE COUNT(*) FILTER (WHERE is_win = true)::float / COUNT(*) * 100
  END as win_rate_percent
FROM trades 
GROUP BY wallet_address
ORDER BY total_pnl DESC;
```
