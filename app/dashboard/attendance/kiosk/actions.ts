'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type KioskMember = {
    id: string
    name: string
    phone: string
    avatar?: string
}

export type CheckInResult = {
    success: boolean
    message: string
    member?: KioskMember
    multipleMatches?: KioskMember[]
}

export async function checkInByPhone(phoneFragment: string): Promise<CheckInResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: '인증되지 않은 사용자입니다.' }

    // 1. Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { success: false, message: '도장 정보를 찾을 수 없습니다.' }

    // 2. Find Member(s) matching phone
    // We search for phone matching %fragment
    const { data: members, error: searchError } = await supabase
        .from('gym_members')
        .select('id, name, phone, user_id')
        .eq('gym_id', gym.id)
        .ilike('phone', `%${phoneFragment}`)
        .eq('status', 'active') // Only active members

    if (searchError) {
        console.error('Member search error:', searchError)
        return { success: false, message: '회원 검색 중 오류가 발생했습니다.' }
    }

    if (!members || members.length === 0) {
        return { success: false, message: '해당 번호의 회원을 찾을 수 없습니다.' }
    }

    // 3. If multiple matches, ask for clarification (or just pick first if exact match? No, return list)
    if (members.length > 1) {
        // Narrow down if exact match exists among them?
        const exactMatch = members.find(m => m.phone === phoneFragment)
        if (exactMatch) {
            return await processCheckIn(supabase, gym.id, exactMatch)
        }

        return {
            success: false,
            message: '여러 명의 회원이 검색되었습니다. 본인을 선택해주세요.',
            multipleMatches: members.map(m => ({
                id: m.id,
                name: m.name || '이름 없음',
                phone: m.phone || '',
            }))
        }
    }

    // 4. Single match -> Process Check-in
    return await processCheckIn(supabase, gym.id, members[0])
}

async function processCheckIn(supabase: any, gymId: string, member: any): Promise<CheckInResult> {

    // Simple approach: Check if they already checked in today?
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

    const { data: existingLog } = await supabase
        .from('gym_attendance_logs')
        .select('id, created_at, checked_out_at')
        .eq('gym_id', gymId)
        .eq('member_id', member.id)
        .eq('date', today)
        .single()

    if (existingLog) {
        // Condition 1: Already Checked Out
        if (existingLog.checked_out_at) {
            return {
                success: true,
                message: `${member.name}님, 이미 하원 처리되었습니다.`,
                member: { id: member.id, name: member.name, phone: member.phone }
            }
        }

        // Condition 2: Check time difference
        // created_at is UTC usually, so we compare with UTC now
        const checkedInTime = new Date(existingLog.created_at).getTime()
        const now = new Date().getTime()
        const diffMinutes = (now - checkedInTime) / (1000 * 60)

        if (diffMinutes <= 5) {
            return {
                success: true,
                message: `${member.name}님, 이미 등원 처리되었습니다.`,
                member: { id: member.id, name: member.name, phone: member.phone }
            }
        } else {
            // Condition 3: Sign Out (After 5 mins)
            const { error: updateError } = await supabase
                .from('gym_attendance_logs')
                .update({ checked_out_at: new Date().toISOString() })
                .eq('id', existingLog.id)

            if (updateError) {
                console.error('Check-out error:', updateError)
                return { success: false, message: '하원 처리 중 오류가 발생했습니다.' }
            }

            // Revalidate
            revalidatePath('/dashboard/attendance')

            return {
                success: true,
                message: `${member.name}님, 하원 처리가 완료되었습니다.`,
                member: { id: member.id, name: member.name, phone: member.phone }
            }
        }
    }

    // Insert Log
    const { error: insertError } = await supabase
        .from('gym_attendance_logs')
        .insert({
            gym_id: gymId,
            member_id: member.id,
            date: today,
            method: 'kiosk',
            class_name: '자율 수련' // Default or calculate from time
        })

    if (insertError) {
        console.error('Check-in error:', insertError)
        return { success: false, message: '출석 처리 중 오류가 발생했습니다.' }
    }

    revalidatePath('/dashboard/attendance')

    return {
        success: true,
        message: `${member.name}님, 출석이 완료되었습니다!`,
        member: { id: member.id, name: member.name, phone: member.phone }
    }
}
