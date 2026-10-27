'use strict';
const CORE = 'tiny-live-core-v3', VOICE = 'tiny-live-voice-v2';
const FILES = ['./','index.html','style.css','core.js','engine.js','app.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','voice/model-info.json'];
self.addEventListener('install', event => { event.waitUntil((async () => { const cache = await caches.open(CORE); await cache.addAll(FILES.map(file => new URL(file,self.registration.scope).href)); await self.skipWaiting(); })()); });
self.addEventListener('activate', event => { event.waitUntil((async () => { const names = await caches.keys(); await Promise.all(names.filter(key => key.startsWith('tiny-live-core-') && key !== CORE).map(key => caches.delete(key))); await self.clients.claim(); })()); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return; const url = new URL(event.request.url); if (url.origin !== location.origin) return;
  const base = new URL(self.registration.scope).pathname; if (!url.pathname.startsWith(base)) return;
  const relative = url.pathname.slice(base.length);
  if (relative.startsWith('api/') || relative === 'sw.js') return;
  event.respondWith((async () => {
    if (relative.startsWith('voice/')) { const voice = await caches.open(VOICE); const found = await voice.match(event.request); if (found) return found; }
    const core = await caches.open(CORE); const found = await core.match(event.request,{ignoreSearch:true}); if (found) return found;
    try { return await fetch(event.request); }
    catch (error) { if (event.request.mode === 'navigate') { const index = await core.match(new URL('index.html',self.registration.scope).href); if (index) return index; } return new Response('Offline resource unavailable',{status:503,headers:{'Content-Type':'text/plain'}}); }
  })());
});
