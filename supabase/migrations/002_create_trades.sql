-- ============================================
-- Deriverse Database Schema
-- Table: trades
-- Purpose: Cache blockchain trade data for fast loading and analytics
-- ============================================

CREATE TABLE trades (
  -- Primary key (matches Trade.id format: txSignature-orderId-type)
  id TEXT PRIMARY KEY,
  
  -- Foreign key to user_wallets (CRITICAL for multi-wallet support)
  wallet_address TEXT NOT NULL REFERENCES user_wallets(wallet_address) ON DELETE CASCADE,
  
  -- Trade identification
  symbol TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  side TEXT NOT NULL,
  order_type TEXT NOT NULL,
  
  -- Quantities and prices (NUMERIC for exact precision)
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  notional NUMERIC NOT NULL,
  
  -- P&L and fees (NUMERIC for exact precision)
  pnl NUMERIC NOT NULL,
  fee NUMERIC NOT NULL,
  fee_currency TEXT NOT NULL,
  
  -- Timing
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  
  -- Metadata
  is_win BOOLEAN NOT NULL,
  tx_signature TEXT NOT NULL,
  
  -- Optional fields
  is_maker BOOLEAN,
  
  -- Perpetuals-specific (nullable)
  leverage NUMERIC,
  liquidation_price NUMERIC,
  margin_used NUMERIC,
  
  -- Additional data (JSONB for flexibility)
  fee_breakdown JSONB,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Auto-update Trigger for updated_at
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that calls the function before any UPDATE
CREATE TRIGGER trigger_update_trades_updated_at
BEFORE UPDATE ON trades
FOR EACH ROW
EXECUTE FUNCTION update_trades_updated_at();

-- ============================================
-- Indexes for Performance
-- ============================================

-- Fast lookup by wallet address (most common query)
CREATE INDEX idx_trades_wallet ON trades(wallet_address);

-- Find recent trades (for analytics)
CREATE INDEX idx_trades_closed_at ON trades(closed_at DESC);

-- Filter by symbol (e.g., "show all SOL-PERP trades")
CREATE INDEX idx_trades_symbol ON trades(symbol);

-- Lookup by transaction signature (for debugging)
CREATE INDEX idx_trades_tx_signature ON trades(tx_signature);

-- Composite index for "recent trades for this wallet" (most common query)
CREATE INDEX idx_trades_wallet_closed ON trades(wallet_address, closed_at DESC);

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE trades IS 'Cached blockchain trade data from Deriverse protocol. Enables fast loading and offline analytics.';

COMMENT ON COLUMN trades.id IS 'Composite ID format: txSignature-orderId-type (e.g., "5YzK...abc-12345-spot")';
COMMENT ON COLUMN trades.wallet_address IS 'Solana wallet address that executed this trade';
COMMENT ON COLUMN trades.symbol IS 'Trading pair symbol (e.g., "SOL-PERP", "BTC-SPOT")';
COMMENT ON COLUMN trades.quote_currency IS 'Quote currency (usually "USDC")';
COMMENT ON COLUMN trades.side IS 'Trade direction: buy, sell, long, or short';
COMMENT ON COLUMN trades.order_type IS 'Order type: limit, market, stop_limit, or stop_market';
COMMENT ON COLUMN trades.quantity IS 'Trade size in base currency (NUMERIC for exact precision)';
COMMENT ON COLUMN trades.price IS 'Execution price (NUMERIC for exact precision)';
COMMENT ON COLUMN trades.notional IS 'Total value: quantity × price';
COMMENT ON COLUMN trades.pnl IS 'Profit/loss for this trade (NUMERIC for exact precision)';
COMMENT ON COLUMN trades.fee IS 'Total fee paid (NUMERIC for exact precision)';
COMMENT ON COLUMN trades.fee_currency IS 'Fee currency (usually "USDC")';
COMMENT ON COLUMN trades.opened_at IS 'Trade entry timestamp';
COMMENT ON COLUMN trades.closed_at IS 'Trade exit timestamp';
COMMENT ON COLUMN trades.duration_seconds IS 'Trade duration in seconds (usually 0 for instant fills)';
COMMENT ON COLUMN trades.is_win IS 'Whether trade was profitable (pnl > 0)';
COMMENT ON COLUMN trades.tx_signature IS 'Solana transaction signature';
COMMENT ON COLUMN trades.is_maker IS 'Whether this was a maker order (provides liquidity)';
COMMENT ON COLUMN trades.leverage IS 'Leverage used (perpetuals only)';
COMMENT ON COLUMN trades.liquidation_price IS 'Liquidation price (perpetuals only)';
COMMENT ON COLUMN trades.margin_used IS 'Margin used (perpetuals only)';
COMMENT ON COLUMN trades.fee_breakdown IS 'Detailed fee composition (JSONB array)';
COMMENT ON COLUMN trades.created_at IS 'When this trade was saved to database';
COMMENT ON COLUMN trades.updated_at IS 'When this trade was last modified in database (auto-updated)';

-- ============================================
-- Example Usage
-- ============================================

-- Insert a trade
-- INSERT INTO trades (id, wallet_address, symbol, quote_currency, side, order_type, quantity, price, notional, pnl, fee, fee_currency, opened_at, closed_at, duration_seconds, is_win, tx_signature)
-- VALUES ('5YzK...abc-12345-spot', '7xKXt...3k8s', 'SOL-PERP', 'USDC', 'long', 'limit', 10.5, 100.25, 1052.625, 250.50, 2.10, 'USDC', NOW(), NOW(), 0, true, '5YzK...abc');

-- Get all trades for a wallet
-- SELECT * FROM trades WHERE wallet_address = '7xKXt...3k8s' ORDER BY closed_at DESC;

-- Get recent winning trades
-- SELECT * FROM trades WHERE is_win = true ORDER BY closed_at DESC LIMIT 10;

-- Get trades by symbol
-- SELECT * FROM trades WHERE symbol = 'SOL-PERP' ORDER BY closed_at DESC;

-- Calculate total PnL for a wallet
-- SELECT SUM(pnl) as total_pnl FROM trades WHERE wallet_address = '7xKXt...3k8s';

-- Get win rate (safe for empty tables)
-- SELECT 
--   CASE 
--     WHEN COUNT(*) = 0 THEN 0
--     ELSE COUNT(*) FILTER (WHERE is_win = true)::float / COUNT(*) * 100
--   END as win_rate_percent
-- FROM trades 
-- WHERE wallet_address = '7xKXt...3k8s';
