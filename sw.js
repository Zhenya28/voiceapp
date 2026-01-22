/* ============================================
   VoiceNotes PWA - Service Worker
   Obsługa trybu offline i cache'owanie
   ============================================ */

// Nazwa i wersja cache
const CACHE_NAME = "voicenotes-v1";

// Pliki do cache'owania przy instalacji (App Shell)
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// ==========================================
// INSTALACJA SERVICE WORKER
// ==========================================

self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalacja");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache: Dodawanie plików statycznych");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Aktywuj natychmiast
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Błąd instalacji:", error);
      }),
  );
});

// ==========================================
// AKTYWACJA SERVICE WORKER
// ==========================================

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Aktywacja");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log("Usuwanie starego cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        // Przejmij kontrolę nad wszystkimi klientami
        return self.clients.claim();
      }),
  );
});

// ==========================================
// OBSŁUGA ŻĄDAŃ (FETCH)
// Strategia: Cache First, Network Fallback
// ==========================================

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Ignoruj żądania nie-GET
  if (request.method !== "GET") {
    return;
  }

  // Ignoruj żądania chrome-extension i inne
  if (!request.url.startsWith("http")) {
    return;
  }

  event.respondWith(cacheFirst(request));
});

// ==========================================
// STRATEGIE CACHE'OWANIA
// ==========================================

/**
 * Cache First - najpierw sprawdza cache, potem sieć
 */
async function cacheFirst(request) {
  try {
    // Sprawdź cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log("Cache hit:", request.url);
      return cachedResponse;
    }

    // Jeśli nie ma w cache, pobierz z sieci
    console.log("Network fetch:", request.url);
    const networkResponse = await fetch(request);

    // Zapisz do cache (klonujemy response)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Fetch failed:", error);

    // Zwróć stronę offline fallback
    const cachedFallback = await caches.match("./index.html");
    if (cachedFallback) {
      return cachedFallback;
    }

    // Ostateczność - błąd
    return new Response("Offline - brak połączenia", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// ==========================================
// OBSŁUGA POWIADOMIEŃ PUSH
// (Przygotowane na przyszłość)
// ==========================================

self.addEventListener("push", (event) => {
  console.log("Push notification received");

  const options = {
    body: event.data ? event.data.text() : "Nowa notatka",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "Otwórz" },
      { action: "close", title: "Zamknij" },
    ],
  };

  event.waitUntil(self.registration.showNotification("VoiceNotes", options));
});

// Obsługa kliknięcia w powiadomienie
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow("/"));
  }
});

// ==========================================
// SYNCHRONIZACJA W TLE
// (Przygotowane na przyszłość)
// ==========================================

self.addEventListener("sync", (event) => {
  console.log("Background sync:", event.tag);

  if (event.tag === "sync-notes") {
    event.waitUntil(syncNotes());
  }
});
