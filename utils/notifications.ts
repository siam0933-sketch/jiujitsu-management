import { createAdminClient } from '@/utils/supabase/server'
import { sendPushNotification } from './push'

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

    // 2.5. 방해 금지 시간(Quiet Hours) 체크 (한국 시간 밤 10시 ~ 아침 8시 이전)
    const nowKst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    const currentHour = nowKst.getHours()
    if (currentHour >= 22 || currentHour < 8) {
        console.log(`[sendNotification] Quiet hours active (Current KST Hour: ${currentHour}). Skipping push notification.`)
        return
    }

    const { data: subscriptions } = await supabase
        .from('member_push_subscriptions')
        .select('endpoint, p256dh, auth')
        .in('member_id', memberIds)

    if (!subscriptions || subscriptions.length === 0) return

    const pushResults = subscriptions.map((sub) =>
        sendPushNotification(
            sub.endpoint,
            sub.p256dh,
            sub.auth,
            title,
            body || '',
            link || '/portal/notifications'
        ).then(isSuccess => {
            if (!isSuccess) {
                // If it chronically fails we could delete the subscription from DB.
                // Not doing it automatically yet.
            }
        })
    )

    await Promise.allSettled(pushResults)
}

interface SendAdminNotificationParams {
    adminId: string
    title: string
    body?: string
    link?: string
}

export async function sendAdminNotification({
    adminId,
    title,
    body,
    link,
}: SendAdminNotificationParams) {
    const supabase = await createAdminClient()

    const { data: subscriptions } = await supabase
        .from('admin_push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('admin_id', adminId)

    if (!subscriptions || subscriptions.length === 0) return

    const pushResults = subscriptions.map((sub) =>
        sendPushNotification(
            sub.endpoint,
            sub.p256dh,
            sub.auth,
            title,
            body || '',
            link || '/dashboard'
        )
    )

    await Promise.allSettled(pushResults)
}
