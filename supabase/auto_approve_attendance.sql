-- ==============================================================================
-- 자정(밤 12시) 미승인(pending) 상태의 출석을 자동 승인(present)으로 변경하는 스크립트
-- Supabase의 SQL Editor 메뉴에 복사/붙여넣기 한 뒤 RUN 하시면 됩니다.
-- ==============================================================================

-- 1. pg_cron 확장 기능 활성화 (Supabase는 기본 지원)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 이미 등록된 동일한 이름의 스케줄이 있다면 삭제 (중복 방지용)
SELECT cron.unschedule('auto-approve-attendance');

-- 3. 매일 자정(한국 시간 기준)에 실행되는 자동화 작업 등록
-- 참고: 한국 시간(KST) 자정 00:00은 협정세계시(UTC) 15:00 입니다.
SELECT cron.schedule(
  'auto-approve-attendance', -- 작업 이름
  '0 15 * * *',              -- 실행 주기: 매일 15:00 UTC (한국 시간 00:00 자정)
  $$
    UPDATE gym_attendance_logs
    SET status = 'present'
    WHERE status = 'pending';
  $$
);

-- (선택) 만약 등록된 스케줄이 잘 들어갔는지 확인하고 싶다면 아래 쿼리를 사용하세요:
-- SELECT * FROM cron.job;
