-- 20260425174500_create_class_plan.sql

-- 1. Create gym_class_templates table
CREATE TABLE IF NOT EXISTS gym_class_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    details TEXT,
    color_tag TEXT NOT NULL DEFAULT '#3B82F6', -- Default to a blue
    color_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for gym_class_templates
ALTER TABLE gym_class_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can manage class templates" ON gym_class_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gyms
            WHERE gyms.id = gym_class_templates.gym_id
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view class templates" ON gym_class_templates
    FOR SELECT USING (true);


-- 2. Create gym_calendar_classes table
CREATE TABLE IF NOT EXISTS gym_calendar_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES gym_class_templates(id) ON DELETE CASCADE NOT NULL,
    class_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(gym_id, template_id, class_date) -- Prevent duplicate identical classes on the same day if desired, or maybe omit this. I will omit the unique constraint to allow multiple of same class, but actually we probably only need one type of class per day. Let's omit UNIQUE to be safe and just allow multiple additions if the user wants. No wait, actually maybe they only want one per template per day. Let's omit unique for flexibility.
);

-- RLS for gym_calendar_classes
ALTER TABLE gym_calendar_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can manage calendar classes" ON gym_calendar_classes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gyms
            WHERE gyms.id = gym_calendar_classes.gym_id
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view calendar classes" ON gym_calendar_classes
    FOR SELECT USING (true);

-- Index for faster lookup by date and gym
CREATE INDEX IF NOT EXISTS idx_gym_calendar_classes_date ON gym_calendar_classes(gym_id, class_date);
