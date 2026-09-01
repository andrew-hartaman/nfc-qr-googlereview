-- ===================================================================
-- DYNAMIC REVIEW CARD ENGINE - SUPABASE DATABASE SCHEMA (V2)
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
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(20) UNIQUE NOT NULL, -- e.g. "k-001", "c-kopi-01"
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_url TEXT NOT NULL DEFAULT 'https://google.com',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Critical index for fast lookup during cache misses
CREATE INDEX IF NOT EXISTS idx_cards_short_code ON cards(short_code);

-- Optional index for faster user_id lookups in admin dashboard
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- 3. Table Tap Logs (Analytics & Tap tracking)
CREATE TABLE IF NOT EXISTS tap_logs (
    id BIGSERIAL PRIMARY KEY,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    device_type VARCHAR(20), -- "Android", "iOS", "Desktop", "Other"
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
-- OPTIONAL SAMPLE SEED DATA
-- ===================================================================
-- INSERT INTO users (id, name, email, business_name)
-- VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Budi Santoso', 'budi@kopi.com', 'Kopi Senja Utama')
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO cards (short_code, user_id, target_url, is_active)
-- VALUES ('k-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://maps.app.goo.gl/sample123', true)
-- ON CONFLICT (short_code) DO NOTHING;
