
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
        <div className="min-h-[calc(100vh-100px)] p-2 sm:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-200">출석부</h1>
                    {pendingCount > 0 && (
                        <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                            {pendingCount}
                        </span>
                    )}
                </div>
            </div>
            <ClassScheduleBoard
                initialSchedules={schedules}
                activeMembers={members}
                todayKST={todayKST}
            />
        </div>
    )
}
