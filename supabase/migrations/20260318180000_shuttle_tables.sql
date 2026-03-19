-- 차량운행 노선 (시간표)
CREATE TABLE IF NOT EXISTS gym_shuttle_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time TIME NOT NULL,
    stop_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 노선별 탑승객
CREATE TABLE IF NOT EXISTS gym_shuttle_passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES gym_shuttle_routes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(route_id, member_id)
);

-- RLS (Row Level Security) 설정
ALTER TABLE gym_shuttle_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_shuttle_passengers ENABLE ROW LEVEL SECURITY;

-- 관장님(Master)은 본인 체육관의 노선을 관리할 수 있음
CREATE POLICY "Masters can manage shuttle routes" ON gym_shuttle_routes
    FOR ALL USING (
        gym_id IN (
            SELECT id FROM gyms WHERE owner_id = auth.uid()
        )
    );

-- 로그인한 사용자(회원 등)는 읽기 가능
CREATE POLICY "Everything viewable by everyone" ON gym_shuttle_routes
    FOR SELECT USING (true);

-- 관장님(Master)은 본인 체육관 노선의 탑승객을 관리할 수 있음
CREATE POLICY "Masters can manage shuttle passengers" ON gym_shuttle_passengers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gym_shuttle_routes
            JOIN gyms ON gyms.id = gym_shuttle_routes.gym_id
            WHERE gym_shuttle_routes.id = gym_shuttle_passengers.route_id
            AND gyms.owner_id = auth.uid()
        )
    );

-- 로그인한 사용자(회원 등)는 읽기 가능
CREATE POLICY "Everything viewable by everyone" ON gym_shuttle_passengers
    FOR SELECT USING (true);
