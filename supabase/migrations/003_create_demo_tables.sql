-- ============================================
-- Demo Market Database Schema
-- Tables: demo_orders, demo_balances, demo_settings
-- Purpose: Persist simulated trading data per wallet
-- ============================================

-- ============================================
-- Table: demo_balances
-- Token balances for demo trading per wallet
-- ============================================

CREATE TABLE demo_balances (
  wallet_address TEXT NOT NULL,
  token TEXT NOT NULL,
  available NUMERIC NOT NULL DEFAULT 0,
  in_order NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (wallet_address, token)
);

CREATE OR REPLACE FUNCTION update_demo_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_demo_balances_updated_at
BEFORE UPDATE ON demo_balances
FOR EACH ROW
EXECUTE FUNCTION update_demo_balances_updated_at();

CREATE INDEX idx_demo_balances_wallet ON demo_balances(wallet_address);

COMMENT ON TABLE demo_balances IS 'Demo trading token balances per wallet. Composite PK on (wallet_address, token).';
COMMENT ON COLUMN demo_balances.available IS 'Available balance for trading';
COMMENT ON COLUMN demo_balances.in_order IS 'Balance reserved by open orders';

-- ============================================
-- Table: demo_settings
-- Per-wallet settings for demo trading
-- ============================================

CREATE TABLE demo_settings (
  wallet_address TEXT PRIMARY KEY,
  currency TEXT NOT NULL DEFAULT 'USD',
  usd_inr_rate NUMERIC NOT NULL DEFAULT 90.98,
  price_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_demo_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_demo_settings_updated_at
BEFORE UPDATE ON demo_settings
FOR EACH ROW
EXECUTE FUNCTION update_demo_settings_updated_at();

COMMENT ON TABLE demo_settings IS 'Per-wallet demo settings: currency preference, exchange rate, and price overrides.';
COMMENT ON COLUMN demo_settings.currency IS 'Active currency display: USD or INR';
COMMENT ON COLUMN demo_settings.usd_inr_rate IS 'Hardcoded USD to INR conversion rate, editable by user';
COMMENT ON COLUMN demo_settings.price_overrides IS 'JSONB map of token->price overrides from Control Panel. Empty = use live WS prices.';

-- ============================================
-- Table: demo_orders
-- All demo orders (open, filled, cancelled)
-- ============================================

CREATE TABLE demo_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  
  -- Order identification
  pair TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop_market', 'stop_limit', 'iceberg', 'twap')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'filled', 'cancelled', 'triggered')),
  
  -- Prices
  price NUMERIC,
  stop_price NUMERIC,
  limit_price NUMERIC,
  fill_price NUMERIC,
  
  -- Quantities
  quantity NUMERIC NOT NULL,
  filled_quantity NUMERIC NOT NULL DEFAULT 0,
  
  -- Take Profit / Stop Loss
  tp_price NUMERIC,
  sl_price NUMERIC,
  
  -- Iceberg-specific
  visible_qty NUMERIC,
  
  -- TWAP-specific
  twap_duration INTEGER,
  twap_intervals INTEGER,
  twap_next_slice_at TIMESTAMPTZ,
  
  -- TP/SL child order relationship
  parent_order_id UUID REFERENCES demo_orders(id) ON DELETE SET NULL,
  
  -- Fee
  fee NUMERIC NOT NULL DEFAULT 0,
  fee_currency TEXT NOT NULL DEFAULT 'USDC',
  
  -- PnL (computed on fill)
  pnl NUMERIC,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  filled_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION update_demo_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_demo_orders_updated_at
BEFORE UPDATE ON demo_orders
FOR EACH ROW
EXECUTE FUNCTION update_demo_orders_updated_at();

-- Indexes
CREATE INDEX idx_demo_orders_wallet ON demo_orders(wallet_address);
CREATE INDEX idx_demo_orders_status ON demo_orders(status);
CREATE INDEX idx_demo_orders_wallet_status ON demo_orders(wallet_address, status);
CREATE INDEX idx_demo_orders_pair ON demo_orders(pair);
CREATE INDEX idx_demo_orders_parent ON demo_orders(parent_order_id);
CREATE INDEX idx_demo_orders_created ON demo_orders(created_at DESC);

COMMENT ON TABLE demo_orders IS 'Demo trading orders with full lifecycle tracking. Supports market, limit, stop, iceberg, and TWAP order types.';
COMMENT ON COLUMN demo_orders.parent_order_id IS 'References parent order for TP/SL child orders';
COMMENT ON COLUMN demo_orders.twap_next_slice_at IS 'Timestamp for next TWAP slice execution';
COMMENT ON COLUMN demo_orders.visible_qty IS 'Visible quantity for iceberg orders';
