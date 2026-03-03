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

    // Determine default belt based on Korean Age (Current Year - Birth Year + 1)
    let defaultBelt = 'White' // Adult White (Maps to '화이트 (성인)' in UI)
    if (birth_date) {
        const bDate = new Date(birth_date)
        if (!isNaN(bDate.getTime())) {
            const age = new Date().getFullYear() - bDate.getFullYear() + 1
            if (age < 16) {
                defaultBelt = '화이트 (유소년)'
            }
        }
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
        belt: defaultBelt, // Auto-promoted based on age
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

            let defaultBelt = 'White'
            if (birthDateIso) {
                const bDate = new Date(birthDateIso)
                if (!isNaN(bDate.getTime())) {
                    const age = new Date().getFullYear() - bDate.getFullYear() + 1
                    if (age < 16) {
                        defaultBelt = '화이트 (유소년)'
                    }
                }
            }

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
                belt: defaultBelt
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



export async function bulkPromoteMembers(memberIds: string[]) {
    if (!memberIds.length) return { error: '선택된 회원이 없습니다.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Admin Name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const adminName = profile?.full_name || 'Admin'

    // Belt order definitions (must match constants.ts)
    const ADULT_BELT_ORDER = ['화이트 (성인)', '블루', '퍼플', '브라운', '블랙']
    const KIDS_BELT_ORDER = [
        '화이트 (유소년)', '그레이-화이트', '그레이', '그레이-블랙',
        '옐로우-화이트', '옐로우', '옐로우-블랙',
        '오렌지-화이트', '오렌지', '오렌지-블랙',
        '그린-화이트', '그린', '그린-블랙'
    ]

    // Belt display name normalization
    const normalizeBelt = (belt: string): string => {
        const map: Record<string, string> = {
            'white': '화이트 (성인)', 'white (adult)': '화이트 (성인)',
            'white (kids)': '화이트 (유소년)', 'blue': '블루', 'purple': '퍼플',
            'brown': '브라운', 'black': '블랙', 'gray-white': '그레이-화이트',
            'gray': '그레이', 'gray-black': '그레이-블랙',
            'yellow-white': '옐로우-화이트', 'yellow': '옐로우', 'yellow-black': '옐로우-블랙',
            'orange-white': '오렌지-화이트', 'orange': '오렌지', 'orange-black': '오렌지-블랙',
            'green-white': '그린-화이트', 'green': '그린', 'green-black': '그린-블랙',
        }
        return map[belt.toLowerCase().trim()] || belt
    }

    // Fetch members
    const { data: members } = await supabase
        .from('gym_members')
        .select('id, gym_id, belt, joined_at, start_date')
        .in('id', memberIds)

    if (!members?.length) return { error: '회원을 찾을 수 없습니다.' }

    // Fetch latest promotion log per member
    const { data: latestLogs } = await supabase
        .from('gym_promotion_logs')
        .select('member_id, belt_name, stripe_level, promoted_at')
        .in('member_id', memberIds)
        .order('promoted_at', { ascending: false })

    const latestLogMap: Record<string, { belt: string, stripe: number }> = {}
    latestLogs?.forEach((log: any) => {
        if (!latestLogMap[log.member_id]) {
            latestLogMap[log.member_id] = { belt: normalizeBelt(log.belt_name), stripe: log.stripe_level }
        }
    })

    // Fetch promotion criteria for max stripes (kids belts)
    const gymId = members[0].gym_id
    const { data: criteriaRows } = await supabase
        .from('gym_promotion_criteria')
        .select('belt_name, total_stripes_count, type')
        .eq('gym_id', gymId)

    const maxStripesMap: Record<string, number> = {}
    criteriaRows?.forEach((row: any) => {
        const normalized = normalizeBelt(row.belt_name)
        if (!maxStripesMap[normalized] && row.total_stripes_count) {
            maxStripesMap[normalized] = row.total_stripes_count
        }
    })

    const getMaxStripes = (beltName: string, isAdult: boolean) => {
        if (maxStripesMap[beltName]) return maxStripesMap[beltName]
        return isAdult ? 4 : 4
    }

    // Calculate next belt/stripe for each member
    const today = new Date().toISOString().split('T')[0]
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const member of members) {
        const currentBeltRaw = normalizeBelt(member.belt || '화이트 (성인)')
        const logEntry = latestLogMap[member.id]
        const currentBelt = logEntry?.belt || currentBeltRaw
        const currentStripe = logEntry?.stripe ?? 0

        const isAdult = ADULT_BELT_ORDER.includes(currentBelt)
        const beltOrder = isAdult ? ADULT_BELT_ORDER : KIDS_BELT_ORDER
        const currentBeltIdx = beltOrder.indexOf(currentBelt)

        if (currentBeltIdx === -1) {
            errors.push(`${member.id}: 알 수 없는 벨트 (${currentBelt})`)
            failCount++
            continue
        }

        const maxStripes = getMaxStripes(currentBelt, isAdult)
        let nextBelt = currentBelt
        let nextStripe = currentStripe

        if (currentStripe < maxStripes) {
            // Stripe up
            nextStripe = currentStripe + 1
        } else if (currentBeltIdx < beltOrder.length - 1) {
            // Belt up
            nextBelt = beltOrder[currentBeltIdx + 1]
            nextStripe = 0
        } else {
            // Already at max
            errors.push(`${member.id}: 이미 최고 등급입니다.`)
            failCount++
            continue
        }

        // Insert promotion log
        const { error: logError } = await supabase.from('gym_promotion_logs').insert({
            gym_id: member.gym_id,
            member_id: member.id,
            belt_name: nextBelt,
            stripe_level: nextStripe,
            promoted_at: today,
            training_days: 0,
            attendance_count: 0,
            awarded_by: adminName,
            memo: '일괄승급'
        })

        if (logError) {
            errors.push(`${member.id}: 로그 저장 실패`)
            failCount++
            continue
        }

        // Update member belt
        const { error: updateError } = await supabase
            .from('gym_members')
            .update({ belt: nextBelt, last_promotion_date: today })
            .eq('id', member.id)

        if (updateError) {
            errors.push(`${member.id}: 벨트 업데이트 실패`)
            failCount++
            continue
        }

        successCount++
    }

    revalidatePath('/dashboard/members')
    return { success: true, successCount, failCount, errors }
}

export async function updatePaymentBillingDay(memberId: string, day: number) {

    const supabase = await createClient()
    const parsed = Math.min(31, Math.max(1, Math.round(day)))
    const { error } = await supabase
        .from('gym_members')
        .update({ payment_due_day: parsed })
        .eq('id', memberId)

    if (error) return { error: '결제 기준일 수정 실패: ' + error.message }

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

export async function sendSmsInvitation(phone: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: '로그인이 필요합니다.' }

    // Get Gym Invitation Code and Name
    const { data: gym, error: dbError } = await supabase
        .from('gyms')
        .select('id, name, invitation_code')
        .eq('owner_id', user.id)
        .single()

    if (dbError) {
        console.error('sendSmsInvitation gym lookup error:', dbError)
    }
    if (!gym) return { error: `도장 정보를 찾을 수 없습니다. (에러: ${dbError?.message || '알 수 없음'})` }

    if (!gym.invitation_code) return { error: '도장 초대 코드가 생성되지 않았습니다. 설정에서 먼저 확인해주세요.' }

    // Format phone number to clean digits only string
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.length < 10) return { error: '유효하지 않은 전화번호 양식입니다.' }

    const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/portal/signup?code=${gym.invitation_code}`

    // Construct the SMS message
    const message = `[${gym.name}] 체육관 초대장\n\n안녕하세요! 아래 링크를 눌러 체육관 관원 가입을 진행해주세요.\n\n▶ 가입 링크: ${invitationUrl}\n\n감사합니다.`

    try {
        // [SMS Integration Placeholder]
        // Currently, we don't have a real SMS provider API key (e.g., CoolSMS, Aligo, Solapi).
        // For now, we simulate success and log to the console.
        // User should replace this block with actual API calls in production.
        console.log('--- SIMULATING SMS SEND ---')
        console.log('To:', cleanPhone)
        console.log('Message:', message)

        // Example for future Solapi implementation:
        /*
        const response = await fetch('https://api.solapi.com/messages/v4/send', {
             method: 'POST',
             headers: {
                 'Authorization': `HMAC-SHA256 apiKey=..., date=..., salt=..., signature=...`,
                 'Content-Type': 'application/json'
             },
             body: JSON.stringify({
                 message: {
                     to: cleanPhone,
                     from: 'YOUR_SENDER_NUMBER',
                     text: message,
                     type: 'SMS'
                 }
             })
        })
        */

        return { success: true, message: `[가상발송] ${phone} 번호로 초대 링크 발송을 성공했습니다.` }
    } catch (e: any) {
        return { error: '문자 발송 중 오류가 발생했습니다: ' + e.message }
    }
}
