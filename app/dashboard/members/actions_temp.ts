
// ... existing imports
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// ... existing registerMember function

export async function registerBatch(members: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { error: 'User not authenticated' }
    }

    // Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) {
        return { error: 'Gym not found' }
    }

    // Prepare data
    const batchData = members.map(member => ({
        gym_id: gym.id,
        name: member.name,
        phone: member.phone,
        gender: member.gender || null, // 'male' | 'female'
        birth_date: member.birth_date || null,
        joined_at: member.joined_at ? new Date(member.joined_at).toISOString() : new Date().toISOString(),
        guardian_phone: member.guardian_phone || null,
        address: member.address || null,
        school: member.school || null,
        grade: member.grade || null,
        access_code: member.access_code ? String(member.access_code) : '1234', // Default if missing
        status: 'active',
        belt: 'white'
    }))

    const { error } = await supabase.from('gym_members').insert(batchData)

    if (error) {
        console.error('Batch insert error:', error)
        return { error: '일괄 등록 중 오류가 발생했습니다: ' + error.message }
    }

    return { success: true }
}
