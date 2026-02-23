import { PORTAL_STYLES } from '../styles';
import { getPortalNotices, getPortalRanking } from './actions';
import Link from 'next/link';
import { Bell, ImageIcon, ChevronRightIcon } from 'lucide-react';
import PortalRankingClient from './PortalRankingClient';

export default async function PortalHome() {
    // 1. Fetching Notices and Rankings in parallel
    const [noticeResult, rankingResult] = await Promise.all([
        getPortalNotices(1, 5), // Only fetch top 5 for the home view
        getPortalRanking()
    ]);

    const notices = noticeResult.notices;
    const rankingData = rankingResult.ranking;
    const currentMemberId = rankingResult.currentMemberId;
    const currentYear = rankingResult.year || new Date().getFullYear();
    const currentMonth = rankingResult.month || new Date().getMonth() + 1;

    return (
        <div className={PORTAL_STYLES.CONTAINER}>

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
                                className={`${PORTAL_STYLES.CARD} hover:border-black dark:hover:border-white transition-colors flex items-center justify-between p-4`}
                            >
                                <div className="flex flex-col gap-1 flex-1 pr-4">
                                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1 flex items-center gap-2">
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
