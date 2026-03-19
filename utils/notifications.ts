import webpush from 'web-push'
import { createAdminClient } from '@/utils/supabase/server'

export type NotificationType = 'notice' | 'attendance' | 'payment'

interface SendNotificationParams {
    gymId: string
    memberIds: string[]   // 알림 보낼 회원 ID 배열
    type: NotificationType
    title: string
    body?: string
    link?: string
}

/**
 * 1. member_notifications 테이블에 인앱 알림 bulk insert
 * 2. 각 회원의 push subscription으로 Web Push 전송
 */
export async function sendNotification({
    gymId,
    memberIds,
    type,
    title,
    body,
    link,
}: SendNotificationParams) {
    if (!memberIds || memberIds.length === 0) return

    const supabase = await createAdminClient()

    // 1. 인앱 알림 삽입
    const notifications = memberIds.map((memberId) => ({
        gym_id: gymId,
        member_id: memberId,
        type,
        title,
        body: body || null,
        link: link || '/portal/notifications',
        is_read: false,
    }))

    const { error: insertError } = await supabase
        .from('member_notifications')
        .insert(notifications)

    if (insertError) {
        console.error('[sendNotification] DB insert error:', insertError)
    }

    // 2. Web Push 전송 (구독 정보가 있는 회원만)
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidSubject = process.env.VAPID_SUBJECT

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
        // VAPID 키가 없으면 인앱 알림만 동작
        return
    }

    // 2.5. 방해 금지 시간(Quiet Hours) 체크 (한국 시간 밤 10시 ~ 아침 8시 이전)
    const nowKst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    const currentHour = nowKst.getHours()
    if (currentHour >= 22 || currentHour < 8) {
        console.log(`[sendNotification] Quiet hours active (Current KST Hour: ${currentHour}). Skipping push notification.`)
        return
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const { data: subscriptions } = await supabase
        .from('member_push_subscriptions')
        .select('endpoint, p256dh, auth')
        .in('member_id', memberIds)

    if (!subscriptions || subscriptions.length === 0) return

    const payload = JSON.stringify({ title, body, link: link || '/portal/notifications' })

    const pushResults = subscriptions.map((sub) =>
        webpush
            .sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
            )
            .catch((err: any) => {
                // 410 Gone = 구독이 만료됨 → DB에서 삭제
                if (err.statusCode === 410) {
                    return supabase
                        .from('member_push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint)
                }
                console.error('[sendNotification] Push send error:', err.message)
            })
    )

    await Promise.allSettled(pushResults)
}
