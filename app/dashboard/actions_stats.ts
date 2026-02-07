'use server'

import { createClient } from '@/utils/supabase/server'

interface AttendanceStat {
    rate: number
    avgDaily: number
    ranking: { name: string; count: number; memberId: string; age?: number }[]
}

export async function getAttendanceStats(targetDateStr?: string): Promise<{
    month: AttendanceStat
    year: AttendanceStat
} | null> {
    const supabase = await createClient()

    // 1. Get Gym ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return null

    // 2. Get Total Active Members (for rate calculation)
    const { count: activeMemberCount } = await supabase
        .from('gym_members')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id)
        .eq('status', 'active')

    const totalMembers = activeMemberCount || 1 // Avoid division by zero

    // 3. Define Periods
    // Default to today if no date provided or invalid
    const now = targetDateStr ? new Date(targetDateStr + '-02') : new Date() // append day to avoid timezone issues parsing YYYY-MM
    if (isNaN(now.getTime())) {
        // Fallback to now if invalid
    }

    // Adjust to be safe (though YYYY-MM is usually parsed as UTC, we want local representation or just simple string manip)
    // Actually, simpler: just use strings for Start/End

    const targetYear = now.getFullYear()
    const targetMonth = now.getMonth() + 1

    // Format: YYYY-MM-DD
    const startOfMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
    // const startOfYear = `${targetYear}-01-01` 
    // Logic check: User wants "2월 출석랭킹", "이번달 랭킹". 
    // If user viewing Feb 2024, "Yearly" stats should probably still be 2024 Year-to-date or just 2024 total? 
    // Usually "Yearly Ranking" implies the whole year of the selected month's year.
    const startOfYear = `${targetYear}-01-01`

    // 4. Fetch Logs
    // We fetch all present logs for this year to calculate both stats in memory or via separate queries.
    // Given the scale might be small, fetching all year logs is probably fine, but separate RPC or queries is cleaner.
    // Let's use simple queries.

    // --- Monthly Stats ---
    const { data: monthLogs } = await supabase
        .from('gym_attendance_logs')
        .select('member_id, date, member:gym_members(name, birth_date)')
        .eq('gym_id', gym.id)
        .eq('status', 'present')
        .gte('date', startOfMonth)

    // --- Yearly Stats ---
    const { data: yearLogs } = await supabase
        .from('gym_attendance_logs')
        .select('member_id, date, member:gym_members(name, birth_date)')
        .eq('gym_id', gym.id)
        .eq('status', 'present')
        .gte('date', startOfYear)

    return {
        month: calculateStats(monthLogs || [], totalMembers),
        year: calculateStats(yearLogs || [], totalMembers)
    }
}

function calculateStats(logs: any[], totalMembers: number): AttendanceStat {
    if (logs.length === 0) {
        return { rate: 0, avgDaily: 0, ranking: [] }
    }

    // 1. Unique Dates (Working Days)
    const uniqueDates = new Set(logs.map(log => log.date)).size
    const workingDays = uniqueDates || 1

    // 2. Average Daily Attendance
    const avgDaily = logs.length / workingDays

    // 3. Attendance Rate (Avg Daily / Total Members * 100)
    // Example: 20 members, avg 10 show up => 50% rate.
    const rate = Math.round((avgDaily / totalMembers) * 100)

    // 4. Ranking
    const counts: Record<string, { count: number, name: string, age?: number }> = {}

    logs.forEach(log => {
        const id = log.member_id
        if (!counts[id]) {
            const name = log.member?.name || 'Unknown'
            let age: number | undefined = undefined;
            if (log.member?.birth_date) {
                const birthDate = new Date(log.member.birth_date);
                const today = new Date();
                // Simple age calculation
                let calcAge = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    calcAge--;
                }
                age = calcAge;
            }
            counts[id] = { count: 0, name, age }
        }
        counts[id].count++
    })

    const ranking = Object.entries(counts)
        .map(([id, val]) => ({ memberId: id, name: val.name, count: val.count, age: val.age }))
        .sort((a, b) => b.count - a.count)
    // .slice(0, 10) // Return all for client-side filtering

    return {
        rate,
        avgDaily: Math.round(avgDaily * 10) / 10, // 1 decimal
        ranking
    }
}
