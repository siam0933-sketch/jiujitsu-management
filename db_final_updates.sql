-- ==========================================
-- 1. 포인트 시스템 기본 테이블 및 설정
-- ==========================================
CREATE TABLE IF NOT EXISTS gym_point_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('auto_portal', 'auto_kiosk', 'auto_payment', 'manual')),
    points INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_point_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
    setting_id UUID REFERENCES gym_point_settings(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    points INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_settings_gym ON gym_point_settings(gym_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_member ON gym_point_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_point_logs_gym ON gym_point_logs(gym_id);

ALTER TABLE gym_point_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_point_logs ENABLE ROW LEVEL SECURITY;

-- 🚨 이미 만들어진 정책(Policy)이 있으면 드롭한 뒤 생성하여 충돌 방지
DROP POLICY IF EXISTS "gym_master_point_settings" ON gym_point_settings;
CREATE POLICY "gym_master_point_settings" ON gym_point_settings
    USING (
        gym_id IN (
            SELECT id FROM gyms
            WHERE owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "gym_master_point_logs" ON gym_point_logs;
CREATE POLICY "gym_master_point_logs" ON gym_point_logs
    USING (
        gym_id IN (
            SELECT id FROM gyms
            WHERE owner_id = auth.uid()
        )
    );

-- ==========================================
-- 2. 출석 로그와 포인트 로그 연결 컬럼 추가 
-- ==========================================
ALTER TABLE gym_attendance_logs
  ADD COLUMN IF NOT EXISTS point_log_id UUID REFERENCES gym_point_logs(id) ON DELETE SET NULL;

-- ==========================================
-- 3. 1:1 메시지 기능 테이블 생성
-- ==========================================
CREATE TABLE IF NOT EXISTS gym_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('admin', 'member')),
  body TEXT NOT NULL,
  is_read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_read_by_member BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gym_messages_gym_member_idx ON gym_messages (gym_id, member_id, created_at DESC);
ALTER TABLE gym_messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. 포인트 설정 항목에 아이콘 컬럼 추가
-- ==========================================
ALTER TABLE gym_point_settings ADD COLUMN IF NOT EXISTS icon text;
