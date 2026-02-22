import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/server';
import BottomNav from './components/BottomNav';
import PortalHeader from './components/PortalHeader';
import { PORTAL_STYLES } from './styles';

import { getPaymentStatus } from '@/utils/payment';

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

        // Fetch Member Payment Info
        const { data: member } = await supabase
            .from('gym_members')
            .select('payment_end_date, payment_due_day')
            .eq('id', session.memberId)
            .single()

        let hasUnpaidDues = false
        if (member) {
            const paymentInfo = getPaymentStatus(member)
            if (paymentInfo.status === 'unpaid') {
                hasUnpaidDues = true
            }
        }

        return {
            gymName: gym?.name || '체육관',
            hasUnpaidDues
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
    const context = await getPortalContext()

    return (
        <div className={PORTAL_STYLES.PAGE_WRAPPER}>
            <PortalHeader dojoName={context?.gymName || '체육관'} />
            <main className="flex-1 pt-14"> {/* pt-14 matches header height */}
                {children}
            </main>
            <BottomNav hasUnpaidDues={context?.hasUnpaidDues || false} />
        </div>
    );
}
