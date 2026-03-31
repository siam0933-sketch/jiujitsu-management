-- ==========================================
-- 포인트 시스템 스키마
-- Supabase SQL Editor에서 실행하세요
-- ==========================================

-- 1. 포인트 설정 테이블
CREATE TABLE IF NOT EXISTS gym_point_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('auto_portal', 'auto_kiosk', 'auto_payment', 'manual')),
    points INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 포인트 기록 테이블
CREATE TABLE IF NOT EXISTS gym_point_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
    setting_id UUID REFERENCES gym_point_settings(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    points INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_point_settings_gym ON gym_point_settings(gym_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_member ON gym_point_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_gym ON gym_point_logs(gym_id);

-- 4. RLS 정책
ALTER TABLE gym_point_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_point_logs ENABLE ROW LEVEL SECURITY;

-- gym_point_settings: gym_master만 접근 (service role bypass)
CREATE POLICY "gym_master_point_settings" ON gym_point_settings
    USING (
        gym_id IN (
            SELECT id FROM gyms
            WHERE owner_id = auth.uid()
        )
    );

-- gym_point_logs: gym_master만 접근 (service role bypass)
CREATE POLICY "gym_master_point_logs" ON gym_point_logs
    USING (
        gym_id IN (
            SELECT id FROM gyms
            WHERE owner_id = auth.uid()
        )
    );
