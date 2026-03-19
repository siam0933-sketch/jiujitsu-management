-- member_push_subscriptions: Web Push 구독 정보 테이블
CREATE TABLE IF NOT EXISTS public.member_push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid REFERENCES public.gym_members(id) ON DELETE CASCADE NOT NULL,
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_member_id
    ON public.member_push_subscriptions(member_id);

ALTER TABLE public.member_push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Admin Client (service_role)로만 접근하므로 RLS 우회됨.
