-- member_notifications: 인앱 알림 테이블
CREATE TABLE IF NOT EXISTS public.member_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
    member_id uuid REFERENCES public.gym_members(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('notice', 'attendance', 'payment')),
    title text NOT NULL,
    body text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스: 회원별 빠른 조회
CREATE INDEX IF NOT EXISTS idx_member_notifications_member_id
    ON public.member_notifications(member_id);

CREATE INDEX IF NOT EXISTS idx_member_notifications_member_unread
    ON public.member_notifications(member_id, is_read)
    WHERE is_read = false;

-- RLS 활성화 (Admin Client로만 접근하므로 정책은 간단하게)
ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;

-- Admin Client (service_role)는 RLS 우회하므로 별도 정책 불필요.
-- 필요 시 회원 자신 조회 정책 추가 가능:
-- CREATE POLICY "Members can view own notifications" ON public.member_notifications
--     FOR SELECT USING (
--         member_id IN (
--             SELECT id FROM public.gym_members WHERE user_id = auth.uid()
--         )
--     );
