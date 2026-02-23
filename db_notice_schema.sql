-- 1. Create gym_notices table
CREATE TABLE IF NOT EXISTS public.gym_notices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    images text[] DEFAULT '{}',
    created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.gym_notices ENABLE ROW LEVEL SECURITY;

-- Policy: Gym masters can manage notices for their gyms
CREATE POLICY "Gym masters can manage their gym notices" ON public.gym_notices
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.gyms
            WHERE gyms.id = gym_notices.gym_id
            AND gyms.owner_id = auth.uid()
        )
    );

-- Policy: Gym members can view notices for their gym
CREATE POLICY "Gym members can view their gym notices" ON public.gym_notices
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.gym_members
            WHERE gym_members.gym_id = gym_notices.gym_id
            AND gym_members.user_id = auth.uid()
        )
    );

-- 2. Create Storage Bucket for notices
INSERT INTO storage.buckets (id, name, public)
VALUES ('notices', 'notices', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Note: 'storage.objects' policies
-- Allow public read access to the notices bucket
CREATE POLICY "Notice images are publicly accessible" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'notices');

-- Allow gym masters to upload images
CREATE POLICY "Gym masters can upload notice images" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'notices' AND
        EXISTS (SELECT 1 FROM public.gyms WHERE owner_id = auth.uid())
    );

-- Allow gym masters to update their images
CREATE POLICY "Gym masters can update notice images" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'notices' AND
        EXISTS (SELECT 1 FROM public.gyms WHERE owner_id = auth.uid())
    );

-- Allow gym masters to delete their images
CREATE POLICY "Gym masters can delete notice images" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'notices' AND
        EXISTS (SELECT 1 FROM public.gyms WHERE owner_id = auth.uid())
    );
