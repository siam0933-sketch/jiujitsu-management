import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    try {
        // 회원 세션에서 memberId 꺼내기
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('member_session')
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const session = JSON.parse(sessionCookie.value)
        const memberId = session.memberId
        if (!memberId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subscription, nativeToken } = await req.json()
        
        if (!subscription?.endpoint && !nativeToken) {
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
        }

        const supabase = await createAdminClient()

        // upsert: 같은 endpoint면 update
        await supabase
            .from('member_push_subscriptions')
            .upsert(
                {
                    member_id: memberId,
                    endpoint: nativeToken || subscription.endpoint,
                    p256dh: subscription?.keys?.p256dh || null,
                    auth: subscription?.keys?.auth || null,
                },
                { onConflict: 'endpoint' }
            )

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[push/subscribe] POST error', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { endpoint, nativeToken } = await req.json()
        const targetEndpoint = nativeToken || endpoint

        if (!targetEndpoint) {
            return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
        }

        const supabase = await createAdminClient()
        await supabase
            .from('member_push_subscriptions')
            .delete()
            .eq('endpoint', targetEndpoint)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[push/subscribe] DELETE error', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
