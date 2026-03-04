import { createClient } from '@/utils/supabase/server'
import { getPromotionCandidates } from './attendance/actions_promotion'
import { getTodayAttendanceLogs } from './attendance/actions'
import PromotionWidget from './components/PromotionWidget'
import AttendanceStatsWidget from './components/AttendanceStatsWidget'
import SystemNoticeWidget from './components/SystemNoticeWidget'

export default async function DashboardPage(props: { searchParams: Promise<{ statsMonth?: string }> }) {
    const searchParamsObj = await props.searchParams
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Fetch Gym Info
    const { data: gym } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_id', user?.id)
        .single()

    // 2. Fetch Stats & Check Candidates
    let memberCount = 0
    let candidates: any[] = []
    let todayLogs: any[] = []

    if (gym?.id) {
        // Member Count
        const { count } = await supabase
            .from('gym_members')
            .select('*', { count: 'exact', head: true })
            .eq('gym_id', gym.id)
            .eq('status', 'active')
        memberCount = count || 0

        // Promotion Candidates
        candidates = await getPromotionCandidates()

        // Today's Attendance
        todayLogs = await getTodayAttendanceLogs()
    }

    // 3. Fetch System Notices
    const { data: systemNotices } = await supabase
        .from('system_notices')
        .select('id, title, content, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-8">
                안녕하세요, {gym ? gym.name : '관장님'}! 👋
            </h2>

            {/* System Notices */}
            {systemNotices && systemNotices.length > 0 && (
                <SystemNoticeWidget notices={systemNotices} />
            )}

            {/* Promotion Notification Widget */}
            <PromotionWidget candidates={candidates} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Total Members */}
                <div className="bg-white dark:bg-zinc-900 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400 truncate">
                                        전체 관원 수
                                    </dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-zinc-100">
                                            {memberCount || 0} 명
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-3">
                        <div className="text-sm">
                            <a href="/dashboard/members" className="font-medium text-blue-700 hover:text-blue-900">
                                회원 관리 바로가기
                            </a>
                        </div>
                    </div>
                </div>

                {/* Card 2: Today's Attendance */}
                <div className="bg-white dark:bg-zinc-900 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400 truncate">
                                        오늘 출석
                                    </dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-zinc-100">
                                            {todayLogs.length} 명
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-3">
                        <div className="text-sm">
                            <a href="/dashboard/attendance" className="font-medium text-green-700 hover:text-green-900">
                                출석부 확인
                            </a>
                        </div>
                    </div>
                </div>

                {/* Card 3: Notice Management */}
                <div className="bg-white dark:bg-zinc-900 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400 truncate">
                                        도장 소식
                                    </dt>
                                    <dd>
                                        <div className="text-sm text-gray-900 dark:text-zinc-100">
                                            공지사항 작성
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-3">
                        <div className="text-sm">
                            <a href="/dashboard/notice" className="font-medium text-orange-700 hover:text-orange-900">
                                공지사항 관리
                            </a>
                        </div>
                    </div>
                </div>

                {/* Card 4: Gym Info */}
                <div className="bg-white dark:bg-zinc-900 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v3m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-zinc-400 truncate">
                                        내 도장 정보
                                    </dt>
                                    <dd>
                                        <div className="text-sm text-gray-900 dark:text-zinc-100">
                                            {gym?.address || '주소 미등록'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                                            {gym?.phone}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Statistics */}
            <AttendanceStatsWidget monthStr={searchParamsObj?.statsMonth} />
        </div>
    )
}
