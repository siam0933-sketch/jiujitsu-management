-- stripe(그랄) 컬럼 추가
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS stripe SMALLINT NOT NULL DEFAULT 0 CHECK (stripe >= 0 AND stripe <= 4);
ALTER TABLE team_join_requests ADD COLUMN IF NOT EXISTS stripe SMALLINT NOT NULL DEFAULT 0 CHECK (stripe >= 0 AND stripe <= 4);
