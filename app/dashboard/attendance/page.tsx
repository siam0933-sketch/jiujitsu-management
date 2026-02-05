
import { getSchedules } from './actions_schedule'
import { getActiveMembers, getPendingAttendanceCount } from './actions'
import ClassScheduleBoard from './components/ClassScheduleBoard'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic' // Ensure no caching

export default async function AttendancePage() {
    // ... inside component ...
    const [schedules, members, pendingCount] = await Promise.all([
        getSchedules(),
        getActiveMembers(),
        getPendingAttendanceCount()
    ])

    const todayKST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

    return (
        <div className="min-h-[calc(100vh-100px)] p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800">출석부</h1>
                    {pendingCount > 0 && (
                        <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                            {pendingCount}
                        </span>
                    )}
                </div>
                <a
                    href="/dashboard/attendance/kiosk"

                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    키오스크 모드 (Full Screen)
                </a>
            </div>
            <ClassScheduleBoard
                initialSchedules={schedules}
                activeMembers={members}
                todayKST={todayKST}
            />
        </div>
    )
}
