
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MemberModal from './components/MemberModal'
import MembersTable from './components/MembersTable'

// searchParams is a Promise in newer Next.js versions (15+)
export default async function MembersPage({ searchParams }: { searchParams: Promise<{ id?: string, sort?: string, order?: string }> }) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const resolvedParams = await searchParams
    const selectedMemberId = resolvedParams?.id
    const sort = resolvedParams?.sort || 'joined_at'
    const order = resolvedParams?.order || 'desc'

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

    // 2. Fetch Members with Sorting
    const { data: members, count } = await supabase
        .from('gym_members')
        .select('*', { count: 'exact' })
        .eq('gym_id', gym.id)
        .order(sort, { ascending: order === 'asc' })

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

    return (
        <div>
            {/* Modal */}
            {selectedMember && <MemberModal member={selectedMember} />}

            {/* Client Component for Interactive Table & Bulk Actions */}
            <MembersTable
                initialMembers={members || []}
                count={count || 0}
            />
        </div>
    )
}
