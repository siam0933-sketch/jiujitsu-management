-- 20260426170000_class_color_settings.sql

CREATE TABLE IF NOT EXISTS gym_class_colors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    color_tag TEXT NOT NULL,
    label_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(gym_id, color_tag)
);

ALTER TABLE gym_class_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can manage class colors" ON gym_class_colors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gyms
            WHERE gyms.id = gym_class_colors.gym_id
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view class colors" ON gym_class_colors
    FOR SELECT USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gym_class_colors_gym_tag ON gym_class_colors(gym_id, color_tag);
