import { createAdminClient } from '@/utils/supabase/server';
import NoticesTable from './components/NoticesTable';

export default async function SuperAdminNoticesPage() {
    const supabase = await createAdminClient();

    // Fetch all system notices
    const { data: notices, error } = await supabase
        .from('system_notices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching system notices:', error);
    }

    return (
        <div className="w-full">
            <NoticesTable notices={notices || []} />
        </div>
    );
}
