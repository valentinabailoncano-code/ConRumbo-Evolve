// ConRumbo Service Worker
// VersiÃ³n del cache
const CACHE_NAME = 'conrumbo-v1.0.5';
const STATIC_CACHE_NAME = 'conrumbo-static-v1.0.5';
const DYNAMIC_CACHE_NAME = 'conrumbo-dynamic-v1.0.5';

// Archivos para cachear estÃ¡ticamente
const STATIC_FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/script.js?v=20250926-5',
    '/manifest.webmanifest',
    '/favicon.ico'
];

// URLs de la API que se pueden cachear
const CACHEABLE_API_URLS = [
    '/api/protocols',
    '/api/health'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cacheando archivos estÃ¡ticos');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: InstalaciÃ³n completada');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Error durante la instalaciÃ³n', error);
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Eliminar caches antiguos
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('conrumbo-')) {
                            console.log('Service Worker: Eliminando cache antiguo', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: ActivaciÃ³n completada');
                return self.clients.claim();
            })
    );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Solo manejar peticiones HTTP/HTTPS
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Estrategia Cache First para archivos estÃ¡ticos
    if (STATIC_FILES.includes(url.pathname) || 
        request.destination === 'style' || 
        request.destination === 'script' ||
        request.destination === 'manifest') {
        
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // Estrategia Network First para APIs
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Estrategia Cache First para el resto
    event.respondWith(cacheFirst(request));
});

// Estrategia Cache First
async function cacheFirst(request) {
    try {
        // Buscar en cache primero
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('Service Worker: Sirviendo desde cache', request.url);
            return cachedResponse;
        }
        
        // Si no estÃ¡ en cache, buscar en red
        const networkResponse = await fetch(request);
        
        // Cachear la respuesta si es exitosa
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('Service Worker: Error en cacheFirst', error);
        
        // Fallback para pÃ¡ginas HTML
        if (request.destination === 'document') {
            const cachedIndex = await caches.match('/index.html');
            if (cachedIndex) {
                return cachedIndex;
            }
        }
        
        // Fallback genÃ©rico
        return new Response('Contenido no disponible offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Estrategia Network First
async function networkFirst(request) {
    try {
        // Intentar red primero
        const networkResponse = await fetch(request);
        
        // Cachear respuestas exitosas de APIs especÃ­ficas
        if (networkResponse.ok && shouldCacheApiResponse(request)) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Service Worker: Red no disponible, buscando en cache', request.url);
        
        // Fallback a cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback para APIs crÃ­ticas
        if (request.url.includes('/api/')) {
            return createOfflineApiResponse(request);
        }
        
        throw error;
    }
}

// Determinar si una respuesta de API debe ser cacheada
function shouldCacheApiResponse(request) {
    const url = new URL(request.url);
    return CACHEABLE_API_URLS.some(apiUrl => url.pathname.startsWith(apiUrl));
}

// Crear respuesta offline para APIs
function createOfflineApiResponse(request) {
    const url = new URL(request.url);
    
    // Respuesta para /api/health
    if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({ ok: false, offline: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Respuesta para /api/understand
    if (url.pathname === '/api/understand') {
        return new Response(JSON.stringify({
            intent: 'offline_mode',
            confidence: 0.5,
            protocol_id: null,
            message: 'Modo offline: funcionalidad limitada'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Respuesta para /api/protocols
    if (url.pathname === '/api/protocols') {
        // Intentar devolver protocolos desde localStorage si estÃ¡n disponibles
        const fallbackProtocols = getFallbackProtocols();
        return new Response(JSON.stringify(fallbackProtocols), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Respuesta genÃ©rica offline
    return new Response(JSON.stringify({
        error: 'Funcionalidad no disponible offline',
        offline: true
    }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Obtener protocolos de fallback para modo offline
function getFallbackProtocols() {
    return {
        'pa_no_respira_v1': {
            'protocol_id': 'pa_no_respira_v1',
            'title': 'Parada respiratoria (adulto)',
            'steps': [
                'Verificar consciencia: toque los hombros y grite Â¿EstÃ¡ bien?',
                'Llamar al 112 inmediatamente',
                'Inclinar la cabeza hacia atrÃ¡s y levantar el mentÃ³n',
                'Verificar respiraciÃ³n durante 10 segundos',
                'Si no respira, iniciar ventilaciÃ³n de rescate',
                'Dar 2 ventilaciones de rescate cada 5-6 segundos',
                'Continuar hasta que llegue ayuda mÃ©dica'
            ],
            'meta': {
                'age': 'adulto',
                'niÃ±o': false,
                'tags': ['rcp', 'dea']
            }
        },
        'pa_atragantamiento_v1': {
            'protocol_id': 'pa_atragantamiento_v1',
            'title': 'Atragantamiento',
            'steps': [
                'Preguntar Â¿Se estÃ¡ atragantando?',
                'Si puede hablar o toser, animar a toser',
                'Si no puede hablar, realizar maniobra de Heimlich',
                'Colocarse detrÃ¡s de la persona',
                'Poner las manos en el abdomen, arriba del ombligo',
                'Realizar compresiones abdominales hacia arriba y adentro',
                'Repetir hasta que el objeto salga o la persona pierda consciencia',
                'Si pierde consciencia, iniciar RCP'
            ],
            'meta': {
                'age': 'adulto',
                'niÃ±o': false,
                'tags': ['atragantamiento']
            }
        }
    };
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Manejar sincronizaciÃ³n en segundo plano
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: SincronizaciÃ³n en segundo plano');
        event.waitUntil(doBackgroundSync());
    }
});

// FunciÃ³n de sincronizaciÃ³n en segundo plano
async function doBackgroundSync() {
    try {
        // AquÃ­ se pueden sincronizar mÃ©tricas pendientes, feedback, etc.
        console.log('Service Worker: Ejecutando sincronizaciÃ³n en segundo plano');
        
        // Ejemplo: enviar mÃ©tricas pendientes
        const pendingMetrics = await getPendingMetrics();
        if (pendingMetrics.length > 0) {
            await sendPendingMetrics(pendingMetrics);
        }
        
    } catch (error) {
        console.error('Service Worker: Error en sincronizaciÃ³n en segundo plano', error);
    }
}

// Funciones auxiliares para sincronizaciÃ³n
async function getPendingMetrics() {
    // Implementar lÃ³gica para obtener mÃ©tricas pendientes
    return [];
}

async function sendPendingMetrics(metrics) {
    // Implementar lÃ³gica para enviar mÃ©tricas
    console.log('Service Worker: Enviando mÃ©tricas pendientes', metrics);
}

// Manejar notificaciones push (para futuras versiones)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            data: data.data || {},
            actions: data.actions || []
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('Service Worker: Cargado correctamente');



