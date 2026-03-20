-- 도장 연합(팀) 테이블
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    representative_name TEXT NOT NULL,
    representative_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 팀 소속 멤버
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('representative', 'admin', 'member')),
    member_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gym_address TEXT NOT NULL,
    gym_name TEXT, -- 선택
    branch_name TEXT NOT NULL, -- 필수 (지부명)
    current_belt TEXT NOT NULL,
    last_promotion_date DATE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id) -- 한 관장은 하나의 팀에만 소속
);

-- 가입 신청 (대기열)
CREATE TABLE IF NOT EXISTS team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    member_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gym_address TEXT NOT NULL,
    gym_name TEXT,
    branch_name TEXT NOT NULL,
    current_belt TEXT NOT NULL,
    last_promotion_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 팀 공지사항
CREATE TABLE IF NOT EXISTS team_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 팀 공지사항 댓글
CREATE TABLE IF NOT EXISTS team_notice_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES team_notices(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) 설정
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notice_comments ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 개방 (앱 내에서 로직 제어)
CREATE POLICY "Teams viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Team members viewable by everyone" ON team_members FOR SELECT USING (true);
CREATE POLICY "Team join requests viewable by everyone" ON team_join_requests FOR SELECT USING (true);
CREATE POLICY "Team notices viewable by everyone" ON team_notices FOR SELECT USING (true);
CREATE POLICY "Team notice comments viewable by everyone" ON team_notice_comments FOR SELECT USING (true);
