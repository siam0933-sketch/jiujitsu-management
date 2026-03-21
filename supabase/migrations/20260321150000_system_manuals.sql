-- Create system_manuals table
CREATE TABLE IF NOT EXISTS public.system_manuals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.system_manuals ENABLE ROW LEVEL SECURITY;

-- Only super admins can insert, update, or delete
CREATE POLICY "Super admins can manage manuals" 
ON public.system_manuals 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'super_admin'
    )
);

-- Any authenticated user can view the manuals
CREATE POLICY "Any authenticated user can view manuals" 
ON public.system_manuals 
FOR SELECT 
USING (auth.role() = 'authenticated');
