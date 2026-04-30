self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ALERTA_SISTEMA') {
        const options = {
            body: event.data.corpo,
            icon: 'https://cdn-icons-png.flaticon.com/512/2040/2040061.png',
            requireInteraction: true,
            tag: 'ship-' + Date.now()
        };
        self.registration.showNotification(event.data.titulo, options);
    }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
