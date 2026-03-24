import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/utils/supabase/server';
import BottomNav from './components/BottomNav';
import PortalHeader from './components/PortalHeader';
import { PORTAL_STYLES } from './styles';
import { getPaymentStatus } from '@/utils/payment';
import { getUnreadCount } from './notifications/actions';

async function getPortalContext() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')
    if (!sessionCookie) return null

    try {
        const session = JSON.parse(sessionCookie.value)
        if (!session.gymId || !session.memberId) return null

        const supabase = await createAdminClient()

        // Fetch Gym Name
        const { data: gym } = await supabase
            .from('gyms')
            .select('name')
            .eq('id', session.gymId)
            .single()

        // Fetch Member Info
        const { data: member } = await supabase
            .from('gym_members')
            .select('payment_end_date, payment_due_day, status')
            .eq('id', session.memberId)
            .single()

        if (!member || (member.status !== 'active' && member.status !== 'paused')) {
            return { error: 'invalid_session' }
        }

        let hasUnpaidDues = false
        if (member) {
            const paymentInfo = getPaymentStatus(member)
            if (paymentInfo.status === 'unpaid') {
                hasUnpaidDues = true
            }
        }

        const unreadCount = await getUnreadCount()

        return {
            gymName: gym?.name || '체육관',
            hasUnpaidDues,
            unreadCount,
        }
    } catch (e) {
        return null
    }
}

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // If we're on the signup page, don't require member_session
    // Unfortunately we can't easily read pathname in layout without headers,
    // so we'll check it via middleware or we let the child pages handle auth if needed,
    // OR a common trick is to use headers()
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const currentPath = headersList.get('x-pathname') || '';
    const isPublicUrl = currentPath === '/portal/signup';

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')

    if (!sessionCookie && !isPublicUrl && currentPath !== '/portal/force-logout') {
        redirect('/login')
    }

    const context = await getPortalContext()

    if (context && 'error' in context && context.error === 'invalid_session' && !isPublicUrl) {
        redirect('/portal/force-logout')
    }

    return (
        <div className={PORTAL_STYLES.PAGE_WRAPPER}>
            {!isPublicUrl && <PortalHeader dojoName={context?.gymName || '체육관'} unreadCount={context?.unreadCount || 0} />}
            <main className={`flex-1 ${!isPublicUrl ? 'pt-14' : ''}`}> {/* pt-14 matches header height */}
                {children}
            </main>
            {!isPublicUrl && <BottomNav hasUnpaidDues={context?.hasUnpaidDues || false} />}
        </div>
    );
}
