'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateInitialPassword } from '@/utils/password'

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
    // [NEW] Default start_date to joined_at
    const start_date = joined_at

    // New Fields
    const guardian_phone = String(formData.get('guardian_phone') || '')
    const address = String(formData.get('address') || '')
    const school = String(formData.get('school') || '')
    const grade = String(formData.get('grade') || '')
    const access_code = String(formData.get('access_code') || '')

    // Server-side fallback for password generation
    let login_password = String(formData.get('login_password') || '')
    if (!login_password) {
        login_password = generateInitialPassword()
    }

    // Check for duplicates
    const { data: existingPhone } = await supabase
        .from('gym_members')
        .select('id')
        .eq('gym_id', gym.id)
        .eq('phone', phone)
        .single()

    if (existingPhone) {
        return { error: '이미 등록된 전화번호입니다.' }
    }



    const { error } = await supabase.from('gym_members').insert({
        gym_id: gym.id,
        name,
        phone,
        gender,
        birth_date,
        joined_at,
        start_date, // [NEW]
        guardian_phone: guardian_phone || null,
        address: address || null,
        school: school || null,
        grade: grade || null,
        access_code: access_code || null,
        login_password: login_password,
        status: 'active',
        belt: 'white', // Default
    })

    if (error) {
        console.error('Error registering member:', error)
        return { error: `회원 등록 실패: ${error.message} (${error.details || ''})` }
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
            const startDateIso = joinedAtIso // [NEW] Default start_date to joined_at

            return {
                gym_id: gym.id,
                name: member.name,
                phone: member.phone,
                gender: member.gender,
                birth_date: birthDateIso ? birthDateIso.split('T')[0] : null,
                joined_at: joinedAtIso,
                start_date: startDateIso, // [NEW]
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

export async function updateMember(memberId: string, data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: '로그인이 필요합니다.' }
    }

    try {
        const { error } = await supabase
            .from('gym_members')
            .update(data)
            .eq('id', memberId)

        if (error) {
            console.error('Update error:', error)
            return { error: '회원 정보 수정 중 오류가 발생했습니다.' }
        }

        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

// --- Pause / Resume Logic ---

export async function pauseMember(memberId: string, startDate: string, endDate?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Member Info
    const { data: member } = await supabase
        .from('gym_members')
        .select('gym_id, payment_end_date')
        .eq('id', memberId)
        .single()

    if (!member) return { error: 'Member not found' }

    // 1. Insert Pause Record
    const { error: insertError } = await supabase
        .from('gym_membership_pauses')
        .insert({
            gym_id: member.gym_id,
            member_id: memberId,
            start_date: startDate,
            end_date: endDate || null
        })

    if (insertError) return { error: '휴관 처리 실패: ' + insertError.message }

    // 2. Update Member Status
    const updatePayload: any = { status: 'paused' }

    // 3. Handle Auto-Extension for Definite Pause
    if (endDate && member.payment_end_date) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const durationMs = end.getTime() - start.getTime()
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1 // Inclusive

        if (days > 0) {
            const currentExpiry = new Date(member.payment_end_date)
            const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000))
            updatePayload.payment_end_date = newExpiry.toISOString().split('T')[0]
        }
    }

    const { error: updateError } = await supabase
        .from('gym_members')
        .update(updatePayload)
        .eq('id', memberId)

    if (updateError) return { error: '회원 상태 업데이트 실패: ' + updateError.message }

    // 4. Remove enrollments
    await supabase.from('gym_class_enrollments').delete().eq('member_id', memberId)

    revalidatePath('/dashboard/members')
    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

export async function resumeMember(memberId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Find Open Pause
    const { data: pause } = await supabase
        .from('gym_membership_pauses')
        .select('*')
        .eq('member_id', memberId)
        .or('end_date.is.null,end_date.gte.today')
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

    if (!pause) {
        await supabase.from('gym_members').update({ status: 'active' }).eq('id', memberId)
        revalidatePath('/dashboard/members')
        revalidatePath(`/dashboard/members/${memberId}`)
        return { success: true }
    }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // If Indefinite or Resume Early
    // We close the pause record today
    await supabase
        .from('gym_membership_pauses')
        .update({ end_date: todayStr })
        .eq('id', pause.id)

    // Logically: If indefinite, we calculate extension.
    // If definite, we already extended fully. If coming back early, we might need to reduce extension?
    // Current logic: Only extend if indefinite.

    if (!pause.end_date) {
        // Indefinite -> Extend
        const start = new Date(pause.start_date)
        const durationMs = today.getTime() - start.getTime()
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24))

        if (days > 0) {
            const { data: member } = await supabase.from('gym_members').select('payment_end_date').eq('id', memberId).single()
            if (member?.payment_end_date) {
                const currentExpiry = new Date(member.payment_end_date)
                const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000))
                await supabase.from('gym_members').update({
                    status: 'active',
                    payment_end_date: newExpiry.toISOString().split('T')[0]
                }).eq('id', memberId)
            } else {
                await supabase.from('gym_members').update({ status: 'active' }).eq('id', memberId)
            }
        } else {
            await supabase.from('gym_members').update({ status: 'active' }).eq('id', memberId)
        }
    } else {
        // Definite -> Just Active
        await supabase.from('gym_members').update({ status: 'active' }).eq('id', memberId)
    }

    revalidatePath('/dashboard/members')
    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

// --- Member Field Updates ---

export async function updateMemberStartDate(memberId: string, startDate: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_members')
        .update({ start_date: startDate })
        .eq('id', memberId)

    if (error) return { error: '입문일 수정 실패: ' + error.message }

    revalidatePath(`/dashboard/members`)
    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

export async function updateMemberJoinedDate(memberId: string, joinedAt: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_members')
        .update({ joined_at: joinedAt })
        .eq('id', memberId)

    if (error) return { error: '가입일 수정 실패: ' + error.message }

    revalidatePath(`/dashboard/members`)
    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}

export async function updateMemberPaymentEndDate(memberId: string, endDate: string | null) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('gym_members')
        .update({ payment_end_date: endDate })
        .eq('id', memberId)

    if (error) return { error: '만료일 수정 실패: ' + error.message }

    revalidatePath(`/dashboard/members`)
    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true }
}



export async function getMemberAttendanceLogs(memberId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('gym_attendance_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('date', { ascending: false })

    if (error) {
        console.error('getMemberAttendanceLogs Error:', error)
        return []
    }
    return data
}



export async function generateMemberPassword(memberId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: '로그인이 필요합니다.' }

    const pwd = generateInitialPassword()

    try {
        const { error } = await supabase
            .from('gym_members')
            .update({ login_password: pwd })
            .eq('id', memberId)

        if (error) {
            console.error('Password generation error:', error)
            return { error: '비밀번호 생성 실패: ' + error.message }
        }

        revalidatePath('/dashboard/members')
        revalidatePath(`/dashboard/members/${memberId}`)
        return { success: true, password: pwd }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function generateMissingPasswords() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get Gym ID
    const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!gym) return { error: 'Gym not found' }

    // Find members with empty password
    const { data: allMembers, error } = await supabase
        .from('gym_members')
        .select('id, login_password')
        .eq('gym_id', gym.id)

    if (error) return { error: '회원 목록 조회 실패: ' + error.message }

    const members = allMembers?.filter(m => !m.login_password) || []

    if (members.length === 0) return { success: true, count: 0, message: '생성할 대상이 없습니다.' }

    // Batch limit to prevent timeout
    const BATCH_LIMIT = 50
    const targetMembers = members.slice(0, BATCH_LIMIT)
    const remainingCount = members.length - targetMembers.length

    let count = 0
    let failCount = 0

    // Use sequential execution
    for (const m of targetMembers) {
        const pwd = generateInitialPassword()
        const { error } = await supabase
            .from('gym_members')
            .update({ login_password: pwd })
            .eq('id', m.id)

        if (!error) {
            count++
        } else {
            failCount++
            console.error(`Failed to update password for member ${m.id}:`, error)
        }
    }

    revalidatePath('/dashboard/members')

    let message = `${count}명의 비밀번호가 생성되었습니다.`
    if (remainingCount > 0) {
        message += ` (남은 대상: ${remainingCount}명 - 다시 실행하여 나머지를 생성하세요)`
    }
    if (failCount > 0) {
        message += `, 실패: ${failCount}명`
    }

    return { success: true, count, message }
}
