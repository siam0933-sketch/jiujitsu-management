import { PORTAL_STYLES } from '../styles';
import { getPortalNotices, getPortalRanking } from './actions';
import Link from 'next/link';
import { Bell, ImageIcon, ChevronRightIcon, Trophy, Flame } from 'lucide-react';

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
            <div>
                <div className="flex items-center mb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        {currentMonth}월 출석 랭킹
                    </h2>
                </div>

                <div className={PORTAL_STYLES.CARD}>
                    {rankingData && rankingData.length > 0 ? (
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {rankingData.map((member: any, index: number) => {
                                const isMe = member.memberId === currentMemberId;
                                const isTop3 = index < 3;

                                return (
                                    <li
                                        key={member.memberId}
                                        className={`flex items-center justify-between p-4 transition-colors ${isMe ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 text-center font-bold ${index === 0 ? 'text-yellow-500 text-lg' :
                                                    index === 1 ? 'text-slate-400 text-lg' :
                                                        index === 2 ? 'text-amber-600 text-lg' :
                                                            'text-zinc-400 text-base'
                                                }`}>
                                                {isTop3 ? <Trophy className="w-5 h-5 mx-auto" /> : `${index + 1}`}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium ${isMe ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                    {member.name}
                                                </span>
                                                {isMe && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">나</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{member.count}</span>
                                            <span className="text-xs text-zinc-500 font-medium">회</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-zinc-500 text-sm">
                            <p>아직 이번 달 출석 기록이 없습니다.</p>
                            <p className="mt-1">가장 먼저 출석해 랭킹에 이름을 올려보세요!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom spacer for infinite scrolling / nav bar spacing */}
            <div className="h-4"></div>
        </div>
    );
}
