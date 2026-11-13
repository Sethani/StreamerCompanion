'use strict';
// Never cache credentials, pairing responses, OBS state or execution requests.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('stream-deck-')||key.startsWith('phone-deck-')).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>new Response('<h1>Phone Deck offline</h1><p>Waiting for Companion. This page reconnects automatically.</p><script>setInterval(async()=>{try{const r=await fetch("/api/deck/bootstrap",{cache:"no-store"});if(r.ok||r.status===401)location.reload();}catch{}},2000);</script>',{status:503,headers:{'Content-Type':'text/html'}})));});
