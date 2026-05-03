self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log("Service Worker ativo");
});

self.addEventListener('push', event => {
  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon
  });
});
