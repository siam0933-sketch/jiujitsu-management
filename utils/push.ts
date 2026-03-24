import { firebaseAdmin } from './firebase-admin';
import webpush from 'web-push';

export async function sendPushNotification(
    endpoint: string,
    p256dh: string | null,
    auth: string | null,
    title: string,
    body: string,
    url?: string
) {
    if (p256dh && auth) {
        // --- WEB PUSH ---
        if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            console.warn('VAPID keys not configured for Web Push.');
            return false;
        }
        
        webpush.setVapidDetails(
            'mailto:admin@myjiujitsu.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        try {
            const pushSubscription = { endpoint, keys: { p256dh, auth } };
            const payload = JSON.stringify({ title, body, url: url || '/portal' });
            
            await webpush.sendNotification(pushSubscription as any, payload);
            console.log('Successfully sent web push to', endpoint.substring(0, 30));
            return true;
        } catch (error) {
            console.error('Error sending web push:', error);
            return false;
        }
    } else {
        // --- NATIVE FCM PUSH ---
        if (!firebaseAdmin.apps.length) {
            console.warn('Firebase Admin not initialized. Skipping FCM push.');
            return false;
        }

        try {
            // endpoint acts as the FCM Token for native clients
            const response = await firebaseAdmin.messaging().send({
                token: endpoint,
                notification: {
                    title,
                    body,
                },
                data: {
                    url: url || '/portal'
                },
                android: {
                    notification: {
                        sound: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default'
                        }
                    }
                }
            });
            
            console.log('Successfully sent native FCM push:', response);
            return true;
        } catch (error) {
            console.error('Error sending native FCM push:', error);
            return false;
        }
    }
}

