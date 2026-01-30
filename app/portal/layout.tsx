import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/server';
import BottomNav from './components/BottomNav';
import PortalHeader from './components/PortalHeader';
import { PORTAL_STYLES } from './styles';

async function getGymName() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')
    if (!sessionCookie) return null

    try {
        const session = JSON.parse(sessionCookie.value)
        if (!session.gymId) return null

        const supabase = await createAdminClient()
        const { data: gym } = await supabase
            .from('gyms')
            .select('name')
            .eq('id', session.gymId)
            .single()

        return gym?.name
    } catch (e) {
        return null
    }
}

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const gymName = await getGymName()

    return (
        <div className={PORTAL_STYLES.PAGE_WRAPPER}>
            <PortalHeader dojoName={gymName} />
            <main className="flex-1 pt-14"> {/* pt-14 matches header height */}
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
