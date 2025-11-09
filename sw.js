// Plantnote Service Worker v1.1
const CACHE_NAME = 'plantnote-v1.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/plantnote_complete.html',
  '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If we got a valid response, clone it and cache it
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try to get from cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // If not in cache and network failed, return offline page
            if (event.request.destination === 'document') {
              return caches.match('/plantnote_complete.html');
            }
          });
      })
  );
});

// Background sync for data backup reminder
self.addEventListener('sync', event => {
  if (event.tag === 'backup-reminder') {
    event.waitUntil(
      self.registration.showNotification('Plantnote Backup Reminder', {
        body: 'Remember to backup your plant data!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        actions: [
          { action: 'backup', title: 'Backup Now' },
          { action: 'later', title: 'Later' }
        ]
      })
    );
  }
});

// Handle notification actions
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'backup') {
    event.waitUntil(
      clients.openWindow('/index.html#backup')
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-plant-care') {
    event.waitUntil(checkPlantCareReminders());
  }
});

async function checkPlantCareReminders() {
  // This would check for plants that need care
  // For now, just log
  console.log('Checking plant care reminders...');
}