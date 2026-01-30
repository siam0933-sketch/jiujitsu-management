import { PORTAL_STYLES } from '../styles';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPromotionLogs } from '@/app/dashboard/members/[id]/actions'; // Re-use action
import { BELT_OPTIONS_DATA, displayBeltName } from '@/app/dashboard/members/constants';

export const dynamic = 'force-dynamic';

export default async function PromotionPage() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('member_session');

    if (!sessionCookie) {
        redirect('/portal');
    }

    let memberId = '';
    try {
        const session = JSON.parse(sessionCookie.value);
        memberId = session.memberId;
    } catch (e) {
        // Fallback for string ID (legacy consistency)
        memberId = sessionCookie.value;
    }

    if (!memberId) {
        redirect('/portal');
    }

    const logs = await getPromotionLogs(memberId);

    return (
        <div className={PORTAL_STYLES.CONTAINER}>
            <h1 className={PORTAL_STYLES.HEADING_LG}>승급 이력</h1>

            <div className={PORTAL_STYLES.CARD}>
                <div className="flow-root">
                    <ul role="list" className="divide-y divide-gray-200">
                        {logs.length === 0 ? (
                            <li className="px-4 py-10 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>승급 기록이 없습니다.</span>
                            </li>
                        ) : (
                            logs.map((log) => {
                                const displayName = displayBeltName(log.belt_name);
                                const beltMeta = BELT_OPTIONS_DATA.find(b => b.name === displayName) || { name: displayName, colorClass: 'bg-gray-100', style: undefined };

                                return (
                                    <li key={log.id} className="px-4 py-5 sm:px-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-4 items-center flex-1">
                                                {/* Belt Icon */}
                                                <div
                                                    className={`w-10 h-10 rounded-md shadow-sm flex-shrink-0 border flex items-center justify-center ${beltMeta.colorClass}`}
                                                    style={beltMeta.style}
                                                >
                                                    {/* Optional: Add stripe lines if needed, but color is sufficient for now */}
                                                </div>

                                                <div>
                                                    <p className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                        {displayName}
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                                            {log.stripe_level}그랄
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">승급일: {new Date(log.promoted_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <div className="text-right hidden sm:block">
                                                <div className="flex flex-col gap-1 items-end">
                                                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                        수련일 <span className="font-bold text-gray-700">{log.training_days}일</span>
                                                    </span>
                                                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                        출석 <span className="font-bold text-gray-700">{log.attendance_count}회</span>
                                                    </span>
                                                </div>
                                                {log.awarded_by && (
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Checked by {log.awarded_by}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mobile View Stats */}
                                        <div className="mt-3 flex gap-2 sm:hidden">
                                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                수련 {log.training_days}일
                                            </span>
                                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                출석 {log.attendance_count}회
                                            </span>
                                        </div>

                                        {log.memo && (
                                            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                {log.memo}
                                            </div>
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
