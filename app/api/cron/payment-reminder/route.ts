import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { sendNotification } from '@/utils/notifications'

// 이 API는 Vercel Cron에 의해 매일 KST 13:00 (UTC 04:00)에 호출됨
// vercel.json: { "crons": [{ "path": "/api/cron/payment-reminder", "schedule": "0 4 * * *" }] }

export async function GET(req: NextRequest) {
    // Cron secret으로 무단 호출 방지
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const supabase = await createAdminClient()

        // 내일 날짜 (KST 기준)
        const tomorrowKST = new Date(
            new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
        )
        tomorrowKST.setDate(tomorrowKST.getDate() + 1)
        const tomorrowStr = tomorrowKST.toISOString().split('T')[0]      // 'YYYY-MM-DD'
        const tomorrowDay = tomorrowKST.getDate()                         // 1~31

        // Case 1: payment_end_date가 내일인 활성 회원
        const { data: endDateMembers } = await supabase
            .from('gym_members')
            .select('id, name, gym_id')
            .eq('status', 'active')
            .eq('payment_end_date', tomorrowStr)

        // Case 2: payment_due_day가 내일의 날짜와 일치하는 활성 회원
        const { data: dueDayMembers } = await supabase
            .from('gym_members')
            .select('id, name, gym_id')
            .eq('status', 'active')
            .eq('payment_due_day', tomorrowDay)
            .is('payment_end_date', null)   // end_date가 없는 회원만 (중복 방지)

        const allMembers = [...(endDateMembers || []), ...(dueDayMembers || [])]

        if (allMembers.length === 0) {
            return NextResponse.json({ sent: 0 })
        }

        // 도장별로 그룹핑해서 알림 전송
        const byGym: Record<string, string[]> = {}
        for (const m of allMembers) {
            if (!byGym[m.gym_id]) byGym[m.gym_id] = []
            byGym[m.gym_id].push(m.id)
        }

        let totalSent = 0
        for (const [gymId, memberIds] of Object.entries(byGym)) {
            await sendNotification({
                gymId,
                memberIds,
                type: 'payment',
                title: '💳 결제일 안내',
                body: '내일이 결제일입니다. 도장에 문의해 주세요.',
                link: '/portal/profile',
            })
            totalSent += memberIds.length
        }

        return NextResponse.json({ sent: totalSent })
    } catch (err) {
        console.error('[cron/payment-reminder]', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
