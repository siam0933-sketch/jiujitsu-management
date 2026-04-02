import { PORTAL_STYLES } from '../styles';
import { getPortalNotices } from './actions';
import { getPortalShuttleData } from '../shuttle/actions';
import PaymentAlert from '../components/PaymentAlert';
import { createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import PortalHomeClient from './components/PortalHomeClient';

export default async function PortalHome() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')
    let currentMemberId = null

    if (sessionCookie) {
        try {
            const session = JSON.parse(sessionCookie.value)
            currentMemberId = session.memberId
        } catch (e) {}
    }

    // Fetch Notices and Shuttle Data in parallel
    const [noticeResult, shuttleData] = await Promise.all([
        getPortalNotices(1, 50), // Fetch up to 50 for the tab view
        getPortalShuttleData()
    ]);

    // Fetch current member's payment info for the alert
    let memberData = null;
    if (currentMemberId) {
        const supabase = await createAdminClient();
        const { data: member } = await supabase
            .from('gym_members')
            .select('payment_end_date, payment_due_day')
            .eq('id', currentMemberId)
            .single();
        memberData = member;
    }

    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            {memberData && <PaymentAlert member={memberData} />}

            {/* Client Component that handles the 3 tabs */}
            <div className="pt-2">
                <PortalHomeClient 
                    notices={noticeResult.notices} 
                    totalNotices={noticeResult.total}
                    shuttleData={shuttleData}
                />
            </div>

            {/* Bottom spacer for nav bar spacing */}
            <div className="h-4"></div>
        </div>
    );
}
