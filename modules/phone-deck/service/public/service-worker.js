'use strict';
// Never cache credentials, pairing responses, OBS state or execution requests.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>new Response('<h1>Phone Deck offline</h1><p>Reconnect to Companion before using controls.</p>',{status:503,headers:{'Content-Type':'text/html'}})));});
