-- 학교/학년 구조화 마이그레이션
-- Supabase SQL Editor에서 실행해주세요.

ALTER TABLE gym_members
  ADD COLUMN IF NOT EXISTS school_type TEXT DEFAULT '일반',
  ADD COLUMN IF NOT EXISTS grade_number INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS grade_updated_year INTEGER DEFAULT NULL;
