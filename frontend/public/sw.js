const CACHE_NAME = 'clipoo-pwa-v1';

// Install event: cache basic files
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/favicon.svg'
            ]);
        })
    );
    self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Fetch event: Network first, fallback to cache for offline gracefully
self.addEventListener('fetch', (e) => {
    // Only cache GET requests
    if (e.request.method !== 'GET') return;
    
    // Ignore API and SSE requests
    if (e.request.url.includes('/api/')) return;

    e.respondWith(
        fetch(e.request)
            .then((res) => {
                // If valid response, clone and cache it
                if (res && res.status === 200 && res.type === 'basic') {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
                }
                return res;
            })
            .catch(() => {
                // If offline, try to get from cache
                return caches.match(e.request);
            })
    );
});
