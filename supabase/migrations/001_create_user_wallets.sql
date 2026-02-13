-- ============================================
-- Deriverse Database Schema
-- Table: user_wallets
-- Purpose: Track Solana wallet addresses with sync metadata
-- ============================================

CREATE TABLE user_wallets (
  -- Primary key (auto-generated)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Wallet identification
  wallet_address TEXT UNIQUE NOT NULL,
  network TEXT NOT NULL,
  
  -- Connection metadata (defaults to 'manual' to avoid NULL complexity)
  wallet_provider TEXT NOT NULL DEFAULT 'manual',
  connection_method TEXT NOT NULL DEFAULT 'manual',
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ,  -- NULL = never synced
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Fast lookup by wallet address (most common query)
CREATE INDEX idx_user_wallets_address ON user_wallets(wallet_address);

-- Find recently synced wallets
CREATE INDEX idx_user_wallets_last_synced ON user_wallets(last_synced_at DESC);

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE user_wallets IS 'Tracks Solana wallet addresses that have been looked up, with metadata about connection method and sync status';

COMMENT ON COLUMN user_wallets.wallet_address IS 'Full Solana public key (44 characters, base58 encoded)';
COMMENT ON COLUMN user_wallets.network IS 'Solana network: devnet, mainnet, or mock';
COMMENT ON COLUMN user_wallets.wallet_provider IS 'Wallet app name (Phantom, Solflare, etc.) or manual for typed addresses';
COMMENT ON COLUMN user_wallets.connection_method IS 'How address was obtained: manual (typed) or wallet_connect (connected wallet)';
COMMENT ON COLUMN user_wallets.last_synced_at IS 'When trades were last fetched from blockchain. NULL means never synced.';
COMMENT ON COLUMN user_wallets.created_at IS 'When this wallet was first added to the database';
COMMENT ON COLUMN user_wallets.updated_at IS 'When any field in this row was last modified';

-- ============================================
-- Example Usage
-- ============================================

-- Insert wallet from manual address entry
-- INSERT INTO user_wallets (wallet_address, network, last_synced_at)
-- VALUES ('7xKXtG2JtPZy4WqU9emKfbeuSTePDnSqeAACqVNx3k8s', 'devnet', NOW());

-- Insert wallet from Phantom connection
-- INSERT INTO user_wallets (wallet_address, network, wallet_provider, connection_method, last_synced_at)
-- VALUES ('ABC123xyz...', 'devnet', 'Phantom', 'wallet_connect', NOW());

-- Update sync timestamp after fetching trades
-- UPDATE user_wallets 
-- SET last_synced_at = NOW(), updated_at = NOW()
-- WHERE wallet_address = '7xKXtG2JtPZy4WqU9emKfbeuSTePDnSqeAACqVNx3k8s';

-- Find wallets that need refresh (older than 24 hours)
-- SELECT * FROM user_wallets 
-- WHERE last_synced_at < NOW() - INTERVAL '24 hours'
-- OR last_synced_at IS NULL;
