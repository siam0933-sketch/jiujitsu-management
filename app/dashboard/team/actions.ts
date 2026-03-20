'use server'

import { createAdminClient, createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}

// --- Team Membership Check ---
export async function getMyTeamData() {
    const userId = await getCurrentUserId()
    if (!userId) return null

    const supabase = await createAdminClient()

    // Check if already a team member
    const { data: membership } = await supabase
        .from('team_members')
        .select('team_id, role, branch_name, current_belt')
        .eq('user_id', userId)
        .maybeSingle()

    if (!membership) return null

    // Get team data
    const { data: team } = await supabase
        .from('teams')
        .select('id, name, representative_name, representative_id')
        .eq('id', membership.team_id)
        .single()

    if (!team) return null

    // Get all members
    const { data: members } = await supabase
        .from('team_members')
        .select('id, user_id, member_name, role, gym_name, branch_name, current_belt, last_promotion_date, joined_at')
        .eq('team_id', team.id)
        .order('role')

    return {
        team,
        membership,
        members: members || [],
        isRepresentative: team.representative_id === userId,
        currentUserId: userId,
    }
}

// --- Create Team ---
export async function createTeam(formData: FormData) {
    const userId = await getCurrentUserId()
    if (!userId) return { error: '로그인이 필요합니다.' }

    const supabase = await createAdminClient()
    const fullName = String(formData.get('representative_name') || '')
    const teamName = String(formData.get('team_name') || '').trim()

    if (!teamName) return { error: '팀 이름을 입력해주세요.' }

    // Check if user already belongs to a team
    const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

    if (existing) return { error: '이미 소속된 팀이 있습니다.' }

    // Get user profile for the representative info
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

    const repName = fullName || profile?.full_name || '대표'

    // Create the team
    const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName, representative_name: repName, representative_id: userId })
        .select('id')
        .single()

    if (teamError) {
        if (teamError.code === '23505') return { error: '이미 같은 이름의 팀이 존재합니다.' }
        return { error: '팀 생성 중 오류가 발생했습니다.' }
    }

    // Add creator as representative
    await supabase.from('team_members').insert({
        team_id: newTeam.id,
        user_id: userId,
        role: 'representative',
        member_name: repName,
        phone: '',
        gym_address: '',
        gym_name: null,
        branch_name: teamName + ' 본관',
        current_belt: 'black',
        last_promotion_date: new Date().toISOString().split('T')[0],
    })

    revalidatePath('/dashboard/team')
    return { success: true }
}

// --- Search Teams ---
export async function searchTeams(query: string) {
    if (!query.trim()) return []
    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('teams')
        .select('id, name, representative_name')
        .ilike('name', `%${query}%`)
        .limit(10)
    return data || []
}

// --- Submit Join Request ---
export async function submitJoinRequest(formData: FormData) {
    const userId = await getCurrentUserId()
    if (!userId) return { error: '로그인이 필요합니다.' }

    const supabase = await createAdminClient()
    const teamId = String(formData.get('team_id') || '')
    const branchName = String(formData.get('branch_name') || '').trim()
    const currentBelt = String(formData.get('current_belt') || '').trim()
    const lastPromoDate = String(formData.get('last_promotion_date') || '')

    if (!teamId || !branchName || !currentBelt || !lastPromoDate) {
        return { error: '모든 필수 항목을 입력해주세요.' }
    }

    // Check for existing membership/pending request
    const { data: existing } = await supabase
        .from('team_members').select('id').eq('user_id', userId).maybeSingle()
    if (existing) return { error: '이미 소속된 팀이 있습니다.' }

    const { data: pending } = await supabase
        .from('team_join_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .maybeSingle()
    if (pending) return { error: '이미 해당 팀에 가입 신청을 했습니다.' }

    const { data: profile } = await supabase
        .from('profiles').select('full_name, phone').eq('id', userId).single()

    const { data: gym } = await supabase
        .from('gyms').select('name, address').eq('owner_id', userId).single()

    const { error } = await supabase.from('team_join_requests').insert({
        team_id: teamId,
        user_id: userId,
        status: 'pending',
        member_name: profile?.full_name || '',
        phone: profile?.phone || '',
        gym_address: gym?.address || '',
        gym_name: gym?.name || null,
        branch_name: branchName,
        current_belt: currentBelt,
        last_promotion_date: lastPromoDate,
    })

    if (error) return { error: '가입 신청 중 오류가 발생했습니다.' }

    revalidatePath('/dashboard/team')
    return { success: true }
}

// --- Get Join Requests (for representative) ---
export async function getJoinRequests(teamId: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('team_join_requests')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
    return data || []
}

// --- Handle Join Request ---
export async function handleJoinRequest(requestId: string, action: 'accept' | 'reject') {
    const userId = await getCurrentUserId()
    if (!userId) return { error: '로그인이 필요합니다.' }

    const supabase = await createAdminClient()

    // Verify requester is representative
    const { data: request } = await supabase
        .from('team_join_requests')
        .select('*')
        .eq('id', requestId)
        .single()
    if (!request) return { error: '신청을 찾을 수 없습니다.' }

    const { data: team } = await supabase
        .from('teams').select('representative_id').eq('id', request.team_id).single()
    if (team?.representative_id !== userId) return { error: '권한이 없습니다.' }

    await supabase.from('team_join_requests').update({ status: action === 'accept' ? 'accepted' : 'rejected' }).eq('id', requestId)

    if (action === 'accept') {
        await supabase.from('team_members').insert({
            team_id: request.team_id,
            user_id: request.user_id,
            role: 'member',
            member_name: request.member_name,
            phone: request.phone,
            gym_address: request.gym_address,
            gym_name: request.gym_name,
            branch_name: request.branch_name,
            current_belt: request.current_belt,
            last_promotion_date: request.last_promotion_date,
        })
    }

    revalidatePath('/dashboard/team')
    return { success: true }
}

// --- Team Notices ---
export async function getTeamNotices(teamId: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('team_notices')
        .select('id, title, content, created_at, author_id')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
    return data || []
}

export async function createNotice(formData: FormData) {
    const userId = await getCurrentUserId()
    if (!userId) return { error: '로그인이 필요합니다.' }

    const supabase = await createAdminClient()
    const teamId = String(formData.get('team_id') || '')
    const title = String(formData.get('title') || '').trim()
    const content = String(formData.get('content') || '').trim()
    if (!title || !content) return { error: '제목과 내용을 입력해주세요.' }

    // Check permission: representative or admin
    const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .maybeSingle()

    if (!member || member.role === 'member') return { error: '공지사항 작성 권한이 없습니다.' }

    const { error } = await supabase.from('team_notices').insert({
        team_id: teamId, author_id: userId, title, content
    })

    if (error) return { error: '공지사항 등록 중 오류가 발생했습니다.' }
    revalidatePath('/dashboard/team')
    return { success: true }
}

// --- Comments ---
export async function getNoticeComments(noticeId: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase
        .from('team_notice_comments')
        .select('id, content, created_at, author_id')
        .eq('notice_id', noticeId)
        .order('created_at', { ascending: true })
    return data || []
}

export async function createComment(noticeId: string, content: string) {
    const userId = await getCurrentUserId()
    if (!userId) return { error: '로그인이 필요합니다.' }
    if (!content.trim()) return { error: '댓글 내용을 입력해주세요.' }

    const supabase = await createAdminClient()
    const { error } = await supabase.from('team_notice_comments').insert({
        notice_id: noticeId, author_id: userId, content: content.trim()
    })
    if (error) return { error: '댓글 등록 중 오류가 발생했습니다.' }
    revalidatePath('/dashboard/team')
    return { success: true }
}
