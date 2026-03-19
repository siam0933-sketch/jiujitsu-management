// Service Worker for Web Push Notifications
// This file is served from /sw.js (public directory)

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Receive push and show OS notification
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: '새 알림', body: event.data.text(), link: '/portal/notifications' };
    }

    const options = {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: { link: data.link || '/portal/notifications' },
        vibrate: [200, 100, 200],
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click: open the linked URL
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const link = (event.notification.data && event.notification.data.link)
        ? event.notification.data.link
        : '/portal/notifications';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If the page is already open, focus it
            for (const client of windowClients) {
                if (client.url.includes(link) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(link);
            }
        })
    );
});
