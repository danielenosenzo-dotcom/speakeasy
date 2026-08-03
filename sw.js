const CACHE_NAME = 'speakeasy-v14';
const APP_SHELL = [
  './index.html',
  './call.html',
  './feedback.html',
  './grammatica.html',
  './esercizi.html',
  './guidata.html',
  './css/main.css',
  './css/avatar.css',
  './css/call.css',
  './js/zoe-avatar.js',
  './js/storage.js',
  './js/session.js',
  './js/elevenlabs.js',
  './js/voice-input.js',
  './js/conversation.js',
  './js/guided-conversation.js',
  './js/ai-content.js',
  './api-config.js',
  './firebase-config.js',
  './manifest.json',
  './assets/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Non intercettare mai le chiamate alle API esterne (ElevenLabs, Claude):
  // vanno sempre in rete, mai servite dalla cache né salvate (contengono le chiavi).
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
