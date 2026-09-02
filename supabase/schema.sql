-- ===================================================================
-- DYNAMIC REVIEW CARD ENGINE - SUPABASE DATABASE SCHEMA (V3)
-- Supports Dual Entry-Point: Dynamic QR Code + NFC Chip
-- ===================================================================

-- 1. Table Users (Client / Business Owner)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    business_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table Cards (Card ID Mapping to Target Google Review URL)
--    V3: Added `nfc_uid` for NFC chip hardware UID (1-to-1 static mapping)
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(20) UNIQUE NOT NULL,       -- Dynamic QR identifier e.g. "k-001"
    nfc_uid VARCHAR(100) UNIQUE,                   -- NFC chip hardware UID e.g. "04:A3:2B:1C:5D:6E:7F" [NEW v3]
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_url TEXT,
    label VARCHAR(100),                            -- Internal admin label [NEW]
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Critical index for fast lookup during cache misses
CREATE INDEX IF NOT EXISTS idx_cards_short_code ON cards(short_code);

-- Index for NFC UID lookup [NEW v3]
CREATE INDEX IF NOT EXISTS idx_cards_nfc_uid ON cards(nfc_uid);

-- Optional index for faster user_id lookups in admin dashboard
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- Index for filtering active/inactive cards in admin dashboard
CREATE INDEX IF NOT EXISTS idx_cards_is_active ON cards(is_active);

-- Extensions for search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_cards_short_code_trgm ON cards USING gin (short_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cards_nfc_uid_trgm ON cards USING gin (nfc_uid gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cards_label_trgm ON cards USING gin (label gin_trgm_ops);

-- 3. Table Tap Logs (Analytics & Tap tracking)
--    V3: Added `access_type` to distinguish QR scan vs NFC tap
CREATE TABLE IF NOT EXISTS tap_logs (
    id BIGSERIAL PRIMARY KEY,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    access_type VARCHAR(10) DEFAULT 'QR',  -- 'QR' or 'NFC' [NEW v3]
    device_type VARCHAR(20),               -- "Android", "iOS", "Desktop", "Other"
    user_agent TEXT,
    ip_address VARCHAR(45),
    tapped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying analytics per card and by date
CREATE INDEX IF NOT EXISTS idx_tap_logs_card_id_tapped_at ON tap_logs(card_id, tapped_at DESC);

-- Trigger to automatically update `updated_at` column in `cards` table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_cards_updated_at ON cards;
CREATE TRIGGER trigger_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- V3 MIGRATION SCRIPT (Run this if upgrading from V2)
-- ===================================================================
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS nfc_uid VARCHAR(100) UNIQUE;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS label VARCHAR(100);
-- CREATE INDEX IF NOT EXISTS idx_cards_nfc_uid ON cards(nfc_uid);
-- CREATE INDEX IF NOT EXISTS idx_cards_label_trgm ON cards USING gin (label gin_trgm_ops);
-- ALTER TABLE tap_logs ADD COLUMN IF NOT EXISTS access_type VARCHAR(10) DEFAULT 'QR';
-- ALTER TABLE cards ALTER COLUMN target_url DROP NOT NULL, ALTER COLUMN target_url DROP DEFAULT;
-- ALTER TABLE cards ALTER COLUMN is_active SET DEFAULT FALSE;
-- CREATE INDEX IF NOT EXISTS idx_cards_is_active ON cards(is_active);

-- ===================================================================
-- OPTIONAL SAMPLE SEED DATA
-- ===================================================================
-- INSERT INTO users (id, name, email, business_name)
-- VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Budi Santoso', 'budi@kopi.com', 'Kopi Senja Utama')
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO cards (short_code, nfc_uid, user_id, target_url, is_active)
-- VALUES ('k-001', '04:A3:2B:1C:5D:6E:7F', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://maps.app.goo.gl/sample123', true)
-- ON CONFLICT (short_code) DO NOTHING;
