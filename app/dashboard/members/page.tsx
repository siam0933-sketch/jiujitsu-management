
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MemberModal from './components/MemberModal'
import MembersTable from './components/MembersTable'

// searchParams is a Promise in newer Next.js versions (15+)
export default async function MembersPage({ searchParams }: { searchParams: Promise<{ id?: string, sort?: string, order?: string, status?: string }> }) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const resolvedParams = await searchParams
    const selectedMemberId = resolvedParams?.id
    const sort = resolvedParams?.sort || 'name'
    const order = resolvedParams?.order || 'asc'
    const status = resolvedParams?.status || 'active' // Default to 'active'

    // 1. Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) {
        return (
            <div className="p-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                도장 정보가 없습니다. 대시보드에서 도장 정보를 확인해주세요.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 2. Fetch Members with Sorting & Filtering
    const dbSortColumns = ['name', 'belt', 'joined_at', 'birth_date']
    const isDbSort = dbSortColumns.includes(sort)

    let query = supabase
        .from('gym_members')
        .select('*', { count: 'exact' })
        .eq('gym_id', gym.id)

    if (isDbSort) {
        query = query.order(sort, { ascending: order === 'asc' })
    } else {
        query = query.order('name', { ascending: true })
    }

    // Apply Filter
    if (status !== 'all') {
        query = query.eq('status', status)
    }

    const { data: members, count } = await query

    // 2-1. Fetch latest stripe_level per member from promotion logs
    let stripeMap: Record<string, number> = {}
    if (members && members.length > 0) {
        const memberIds = members.map((m: any) => m.id)
        const { data: latestLogs } = await supabase
            .from('gym_promotion_logs')
            .select('member_id, stripe_level, promoted_at')
            .in('member_id', memberIds)
            .order('promoted_at', { ascending: false })

        // Keep only the most recent log per member
        if (latestLogs) {
            latestLogs.forEach((log: any) => {
                if (stripeMap[log.member_id] === undefined) {
                    stripeMap[log.member_id] = log.stripe_level
                }
            })
        }
    }

    // Attach latest_stripe to each member
    const membersWithStripe = (members || []).map((m: any) => ({
        ...m,
        latest_stripe: stripeMap[m.id] ?? 0
    }))

    // 3. Fetch Selected Member (if param exists)
    let selectedMember = null
    if (selectedMemberId) {
        const { data } = await supabase
            .from('gym_members')
            .select('*')
            .eq('id', selectedMemberId)
            .single()
        selectedMember = data
    }

    // 4. Fetch Today's Attendance Logs for Button Status
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
    const { data: rawLogs } = await supabase
        .from('gym_attendance_logs')
        .select('member_id, checked_out_at')
        .eq('gym_id', gym.id)
        .eq('date', today)

    // Map logs by member_id for quick lookup
    const attendanceMap = new Map()
    rawLogs?.forEach((log: any) => {
        attendanceMap.set(log.member_id, {
            checkedOut: !!log.checked_out_at
        })
    })

    return (
        <div className="max-w-7xl mx-auto">
            {/* Modal */}
            {selectedMember && <MemberModal member={selectedMember} />}

            {/* Client Component for Interactive Table & Bulk Actions */}
            <MembersTable
                initialMembers={membersWithStripe}
                count={count || 0}
                status={status}
                attendanceStatusMap={Object.fromEntries(attendanceMap)}
            />
        </div>
    )
}
