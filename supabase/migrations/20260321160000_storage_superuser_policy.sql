-- 1. Insert Policy for super_admin to upload into 'notices' bucket
CREATE POLICY "Super Admin Notice Image Upload" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'notices' AND
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
);

-- 2. Allow SELECT for super_admin if needed to view or manage objects
CREATE POLICY "Super Admin Notice Image Select" 
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'notices' AND
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
);

-- 3. Also allow DELETE if needed for super_admin
CREATE POLICY "Super Admin Notice Image Delete" 
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'notices' AND
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
);

-- 4. Also UPDATE if replacing an image
CREATE POLICY "Super Admin Notice Image Update" 
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'notices' AND
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
);
