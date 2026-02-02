import { PORTAL_STYLES } from '../styles';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPortalPromotionLogs } from './actions';
import { BELT_OPTIONS_DATA, displayBeltName } from '@/app/dashboard/members/constants';

export const dynamic = 'force-dynamic';

export default async function PromotionPage() {
    const logs = await getPortalPromotionLogs();

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
                                    <li key={log.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            {/* LEFT: Belt Icon + Name/Stripe */}
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-md shadow-sm border flex-shrink-0 flex items-center justify-center ${beltMeta.colorClass}`}
                                                    style={beltMeta.style}
                                                />
                                                <p className="text-base font-bold text-gray-900">
                                                    {displayName} {log.stripe_level}그랄
                                                </p>
                                            </div>

                                            {/* RIGHT: Date + Stats (2 lines) */}
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date(log.promoted_at).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    수련 {log.training_days}일 · 출석 {log.attendance_count}회
                                                </p>
                                            </div>
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
