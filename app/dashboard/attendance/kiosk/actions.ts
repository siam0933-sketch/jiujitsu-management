'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/utils/notifications'
import { grantAutoPoints } from '@/utils/grantAutoPoints'

export type KioskMember = {
    id: string
    name: string
    phone: string
    avatar?: string
    payment_end_date?: string
}

export type CheckInResult = {
    success: boolean
    message: string
    member?: KioskMember
    multipleMatches?: KioskMember[]
    paymentWarning?: string
}

export async function getKioskInitData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: '인증되지 않은 사용자입니다.' }

    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: '도장 정보를 찾을 수 없습니다.' }

    return { gymId: gym.id }
}

export async function checkInByPhone(input: string, gymId: string): Promise<CheckInResult> {
    const supabase = await createAdminClient()

    // Skip auth and gym fetch since it's already done by init

    // 2. Find Member(s) matching phone OR access_code
    const { data: members, error: searchError } = await supabase
        .from('gym_members')
        .select('id, name, phone, user_id, access_code, remaining_sessions, payment_end_date')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .or(`phone.ilike.%${input},access_code.eq.${input}`)

    if (searchError) {
        console.error('Member search error:', searchError)
        return { success: false, message: '회원 검색 중 오류가 발생했습니다.' }
    }

    if (!members || members.length === 0) {
        return { success: false, message: '해당 번호의 회원을 찾을 수 없습니다.' }
    }

    // 3. If multiple matches, ALWAYS return selection list
    if (members.length > 1) {
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
    return await processCheckIn(supabase, gymId, members[0])
}

export async function checkInById(memberId: string, gymId: string): Promise<CheckInResult> {
    const supabase = await createAdminClient()
    const { data: member } = await supabase.from('gym_members').select('*').eq('id', memberId).single()
    if (!member) return { success: false, message: 'Member not found' }

    return await processCheckIn(supabase, gymId, member)
}

async function processCheckIn(supabase: any, gymId: string, member: any): Promise<CheckInResult> {

    // Simple approach: Check if they already checked in today?
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

    // Check payment due date logic
    let paymentWarning: string | undefined = undefined;
    if (member.payment_end_date) {
        // Assume 'YYYY-MM-DD' from DB. Compare with 'today' (Seoul date string)
        const dToday = new Date(today);
        const dDue = new Date(member.payment_end_date);

        // Calculate difference in days strictly by ignoring hours
        // Set both to midnight UTC to avoid daylight saving issues
        const utcToday = Date.UTC(dToday.getFullYear(), dToday.getMonth(), dToday.getDate());
        const utcDue = Date.UTC(dDue.getFullYear(), dDue.getMonth(), dDue.getDate());
        const diffDays = Math.floor((utcDue - utcToday) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            paymentWarning = "결제일이 지났습니다. 체육관에 문의해 주세요.";
        } else if (diffDays === 0) {
            paymentWarning = "오늘이 결제 예정일입니다.";
        } else if (diffDays <= 5) {
            paymentWarning = `결제 예정일이 D-${diffDays} 남았습니다.`;
        }
    }

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
                member: { id: member.id, name: member.name, phone: member.phone },
                paymentWarning
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
                member: { id: member.id, name: member.name, phone: member.phone },
                paymentWarning
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

            // 하원 알림
            try {
                await sendNotification({
                    gymId,
                    memberIds: [member.id],
                    type: 'attendance',
                    title: '👋 하원 완료',
                    body: `${member.name}님의 하원이 완료되었습니다.`,
                    link: '/portal/attendance',
                })
            } catch (e) { /* 알림 오류가 출석 처리에 영향 없도록 */ }

            // Revalidate
            revalidatePath('/dashboard/attendance')

            return {
                success: true,
                message: `${member.name}님, 하원 처리가 완료되었습니다.`,
                member: { id: member.id, name: member.name, phone: member.phone },
                paymentWarning
            }
        }
    }

    // Insert Log
    const { data: newKioskLog, error: insertError } = await supabase
        .from('gym_attendance_logs')
        .insert({
            gym_id: gymId,
            member_id: member.id,
            date: today,
            method: 'kiosk',
            class_name: '자율 수련', // Default or calculate from time
            status: 'present'
        })
        .select('id')
        .single()

    if (insertError) {
        console.error('Check-in error:', insertError)
        return { success: false, message: '출석 처리 중 오류가 발생했습니다.' }
    }

    // Decrement Member Remaining Sessions if applicable
    let updateData: any = {}
    let shouldUpdate = false;

    if (member.remaining_sessions !== undefined && member.remaining_sessions !== null && member.remaining_sessions > 0) {
        updateData.remaining_sessions = member.remaining_sessions - 1
        shouldUpdate = true;
    }

    if (shouldUpdate) {
        const { error: memberUpdateError } = await supabase
            .from('gym_members')
            .update(updateData)
            .eq('id', member.id)

        if (memberUpdateError) console.error('Failed to update member stats:', memberUpdateError)
    }

    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard/members')

    // 포인트 자동 적립 (auto_kiosk) 후 point_log_id 저장
    try {
        if (newKioskLog?.id) {
            const pointLogId = await grantAutoPoints(gymId, member.id, 'auto_kiosk')
            if (pointLogId) {
                await supabase
                    .from('gym_attendance_logs')
                    .update({ point_log_id: pointLogId })
                    .eq('id', newKioskLog.id)
            }
        }
    } catch (e) { /* 포인트 오류가 출석 처리에 영향 없도록 */ }

    // 출석 알림
    try {
        await sendNotification({
            gymId,
            memberIds: [member.id],
            type: 'attendance',
            title: '✅ 출석 완료',
            body: `${member.name}님의 출석이 완료되었습니다.`,
            link: '/portal/attendance',
        })
    } catch (e) { /* 알림 오류가 출석 처리에 영향 없도록 */ }

    return {
        success: true,
        message: `${member.name}님, 출석이 완료되었습니다!`,
        member: { id: member.id, name: member.name, phone: member.phone },
        paymentWarning
    }
}
