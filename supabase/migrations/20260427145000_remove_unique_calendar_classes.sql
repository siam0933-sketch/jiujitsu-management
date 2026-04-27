-- 20260427145000_remove_unique_calendar_classes.sql

-- 동일한 요일에 같은 수업(템플릿)을 여러 개 추가할 수 있게 제한(Unique Constraint)을 해제합니다.
-- Supabase에서 이 스크립트를 실행해 주세요.

ALTER TABLE gym_calendar_classes 
  DROP CONSTRAINT IF EXISTS gym_calendar_classes_gym_id_template_id_class_date_key;
