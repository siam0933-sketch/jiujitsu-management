import { getSchedules } from './actions_schedule'
import { getActiveMembers } from './actions'
import ClassScheduleBoard from './components/ClassScheduleBoard'

export default async function AttendancePage() {
    const [schedules, members] = await Promise.all([
        getSchedules(),
        getActiveMembers()
    ])

    return (
        <div className="h-[calc(100vh-100px)] p-6">
            <ClassScheduleBoard
                initialSchedules={schedules}
                activeMembers={members}
            />
        </div>
    )
}

