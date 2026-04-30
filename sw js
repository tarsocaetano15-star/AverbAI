// Listener para mensagens vindas do script principal
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'DISPARAR_ALERTA') {
        const title = event.data.title;
        const options = {
            body: event.data.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/2040/2040061.png',
            requireInteraction: true,
            tag: event.data.tag || 'alerta-geral'
        };

        // O Service Worker mostra a notificação nativa do sistema
        self.registration.showNotification(title, options);
    }
});

self.addEventListener('install', () => self.skipWaiting());
