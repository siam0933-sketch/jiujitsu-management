import { PORTAL_STYLES } from '../styles';
import { getPortalNotices, getPortalRanking } from './actions';
import Link from 'next/link';
import { Bell, ImageIcon, ChevronRightIcon } from 'lucide-react';
import PortalRankingClient from './PortalRankingClient';
import PaymentAlert from '../components/PaymentAlert';
import { createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function PortalHome() {
    // 1. Fetching Notices and Rankings in parallel
    const [noticeResult, rankingResult] = await Promise.all([
        getPortalNotices(1, 5), // Only fetch top 5 for the home view
        getPortalRanking(new Date().getFullYear(), null) // Default to yearly ranking
    ]);

    const notices = noticeResult.notices;
    const rankingData = rankingResult.ranking;
    const currentMemberId = rankingResult.currentMemberId;
    const currentYear = rankingResult.year || new Date().getFullYear();
    const currentMonth = rankingResult.month || new Date().getMonth() + 1;

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

            {/* SECTION 1: Notice Board */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-500" />
                        도장 소식
                    </h2>
                    {noticeResult.total > 5 && (
                        <Link href="/portal/notice/all" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                            더 보기 <ChevronRightIcon className="w-4 h-4 ml-0.5" />
                        </Link>
                    )}
                </div>

                <div className="space-y-3">
                    {notices && notices.length > 0 ? (
                        notices.map((notice: any) => (
                            <Link
                                href={`/portal/notice/${notice.id}`}
                                key={notice.id}
                                className={`${PORTAL_STYLES.CARD} hover:border-black dark:hover:border-white transition-colors flex items-center justify-between p-4 ${
                                    notice.is_read === false
                                        ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/80 dark:bg-yellow-900/20'
                                        : ''
                                }`}
                            >
                                <div className="flex flex-col gap-1 flex-1 pr-4">
                                    <h3 className={`font-medium line-clamp-1 flex items-center gap-2 ${notice.is_read === false ? 'font-bold text-zinc-900 dark:text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                        {notice.is_read === false && (
                                            <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                                        )}
                                        <span>{notice.title}</span>
                                        {notice.images && notice.images.length > 0 && (
                                            <ImageIcon className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                                        )}
                                    </h3>
                                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                                        <span>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className={`${PORTAL_STYLES.CARD} p-6 text-center text-zinc-500 text-sm`}>
                            아직 올라온 소식이 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 2: Attendance Ranking */}
            <PortalRankingClient initialRanking={rankingResult} />

            {/* Bottom spacer for infinite scrolling / nav bar spacing */}
            <div className="h-4"></div>
        </div>
    );
}
