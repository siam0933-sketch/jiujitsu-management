'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function registerMember(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) {
        throw new Error('Gym not found')
    }

    const name = String(formData.get('name'))
    const phone = String(formData.get('phone'))
    const gender = String(formData.get('gender'))
    const birth_date = formData.get('birth_date') ? String(formData.get('birth_date')) : null
    const joined_at = formData.get('joined_at') ? new Date(String(formData.get('joined_at'))).toISOString() : new Date().toISOString()

    // New Fields
    const guardian_phone = String(formData.get('guardian_phone') || '')
    const address = String(formData.get('address') || '')
    const school = String(formData.get('school') || '')
    const grade = String(formData.get('grade') || '')
    const access_code = String(formData.get('access_code') || '')

    const { error } = await supabase.from('gym_members').insert({
        gym_id: gym.id,
        name,
        phone,
        gender,
        birth_date,
        joined_at,
        guardian_phone: guardian_phone || null,
        address: address || null,
        school: school || null,
        grade: grade || null,
        access_code: access_code || null,
        status: 'active',
        belt: 'white', // Default
    })

    if (error) {
        console.error('Error registering member:', error)
        return { error: '회원 등록에 실패했습니다. 다시 시도해주세요.' }
    }

    redirect('/dashboard/members')
}

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

    try {
        const safeIsoString = (val: any) => {
            if (!val) return null
            const date = new Date(val)
            if (isNaN(date.getTime())) return null
            return date.toISOString()
        }

        const batchData = members.map(member => {
            const birthDateIso = safeIsoString(member.birth_date)
            const joinedAtIso = safeIsoString(member.joined_at) || new Date().toISOString()

            return {
                gym_id: gym.id,
                name: member.name,
                phone: member.phone,
                gender: member.gender,
                birth_date: birthDateIso ? birthDateIso.split('T')[0] : null,
                joined_at: joinedAtIso,
                guardian_phone: member.guardian_phone || null,
                address: member.address || null,
                school: member.school || null,
                grade: member.grade || null,
                access_code: member.access_code ? String(member.access_code) : '1234',
                payment_due_day: member.payment_due_day ? parseInt(String(member.payment_due_day).replace(/[^0-9]/g, '')) : null,
                status: 'active',
                belt: 'white'
            }
        })

        const { error } = await supabase.from('gym_members').insert(batchData)

        if (error) {
            console.error('Batch insert error:', error)
            return { error: '일괄 등록 중 오류가 발생했습니다: ' + error.message }
        }

        return { success: true }
    } catch (e: any) {
        console.error('Processing error:', e)
        return { error: '데이터 처리 중 오류가 발생했습니다: ' + e.message }
    }
}

export async function deleteMembers(memberIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: '로그인이 필요합니다.' }
    }

    try {
        const { error } = await supabase
            .from('gym_members')
            .delete()
            .in('id', memberIds)

        if (error) {
            console.error('Delete error:', error)
            return { error: '회원 삭제 중 오류가 발생했습니다.' }
        }

        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
