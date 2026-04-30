// Ativação imediata para o GitHub Pages
self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim()); // Assume o controle da aba imediatamente
});

// Ouve as mensagens do script principal e mostra o pop-up nativo
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'ALERTA_SISTEMA') {
        const options = {
            body: event.data.corpo,
            icon: 'https://cdn-icons-png.flaticon.com/512/2040/2040061.png',
            requireInteraction: true,
            tag: 'monitor-' + Date.now()
        };
        self.registration.showNotification(event.data.titulo, options);
    }
});
