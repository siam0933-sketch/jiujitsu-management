-- ==========================================
-- 차량운행 관리 V3 스키마 (노선 - 정류장 - 탑승객)
-- ==========================================

-- 1. 기존 개발 중이던 V2 스키마 테이블 삭제 (초기화)
DROP TABLE IF EXISTS gym_shuttle_passengers CASCADE;
DROP TABLE IF EXISTS gym_shuttle_stops CASCADE;
DROP TABLE IF EXISTS gym_shuttle_routes CASCADE;

-- 2. 노선 (Route) 테이블: "3시부", "호계동 노선" 등 큰 단위
CREATE TABLE gym_shuttle_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                   -- 노선 이름 (예: 3시부 1호차)
    days SMALLINT[] NOT NULL DEFAULT '{}',-- 운행 요일 배열 (1:월요일 ~ 7:일요일)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 정류장 (Stop) 테이블: 특정 노선 하위에 속하는 정류장 및 시간 정보
CREATE TABLE gym_shuttle_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES gym_shuttle_routes(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL,        -- 해당 정류장의 복사된 실제 운행 요일
    time TIME NOT NULL,                   -- 요일별 정류장 도착 시간
    stop_name TEXT NOT NULL,              -- 정류장 이름
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 승객 (Passenger) 테이블: 개별 정류장에 탑승하는 수기 입력 승객
CREATE TABLE gym_shuttle_passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_id UUID NOT NULL REFERENCES gym_shuttle_stops(id) ON DELETE CASCADE,
    passenger_name TEXT NOT NULL,         -- 탑승객 이름 (직접 텍스트 입력)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 검색 성능 향상을 위한 인덱스 생성
CREATE INDEX idx_shuttle_routes_gym ON gym_shuttle_routes(gym_id);
CREATE INDEX idx_shuttle_stops_route ON gym_shuttle_stops(route_id);
CREATE INDEX idx_shuttle_stops_day ON gym_shuttle_stops(day_of_week);
CREATE INDEX idx_shuttle_passengers_stop ON gym_shuttle_passengers(stop_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE gym_shuttle_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_shuttle_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_shuttle_passengers ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 관장님만 본인 체육관의 데이터를 관리/조회 가능
CREATE POLICY "Masters can manage shuttle routes" ON gym_shuttle_routes
    FOR ALL USING ( gym_id IN ( SELECT id FROM gyms WHERE owner_id = auth.uid() ) );

CREATE POLICY "Masters can manage shuttle stops" ON gym_shuttle_stops
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gym_shuttle_routes
            WHERE gym_shuttle_routes.id = gym_shuttle_stops.route_id
            AND gym_shuttle_routes.gym_id IN ( SELECT id FROM gyms WHERE owner_id = auth.uid() )
        )
    );

CREATE POLICY "Masters can manage shuttle passengers" ON gym_shuttle_passengers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gym_shuttle_stops
            JOIN gym_shuttle_routes ON gym_shuttle_routes.id = gym_shuttle_stops.route_id
            WHERE gym_shuttle_stops.id = gym_shuttle_passengers.stop_id
            AND gym_shuttle_routes.gym_id IN ( SELECT id FROM gyms WHERE owner_id = auth.uid() )
        )
    );

-- 로그인한 사용자 등 누구나 읽을 수는 있게 하려면, 아래 선택적 주석을 해제할 수 있습니다.
-- CREATE POLICY "Anyone can check shuttle" ON gym_shuttle_routes FOR SELECT USING (true);
-- CREATE POLICY "Anyone can check stops" ON gym_shuttle_stops FOR SELECT USING (true);
