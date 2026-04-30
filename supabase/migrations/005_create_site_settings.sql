-- ============================================
-- 005: Site Settings — global theme/preset config
-- ============================================

-- Single-row table for global site settings (admin-controlled)
CREATE TABLE IF NOT EXISTS site_settings (
    id           INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- enforce single row
    default_preset_id  TEXT NOT NULL DEFAULT 'paper',
    enabled_presets    TEXT[] NOT NULL DEFAULT ARRAY['paper','winter','spring','summer','glass','soft','retro'],
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the single settings row
INSERT INTO site_settings (id, default_preset_id, enabled_presets)
VALUES (1, 'paper', ARRAY['paper','winter','spring','summer','glass','soft','retro'])
ON CONFLICT (id) DO NOTHING;

-- Auto-update timestamp trigger (reuse pattern from 004)
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();
