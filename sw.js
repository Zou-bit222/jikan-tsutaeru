// こうたま時間 PWA: network-first for page updates, Push API handler for closed-app reminders.
const CACHE='koutama-jikan-push-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',copy)));}
      return response;
    }).catch(()=>caches.match('./index.html')));
  }else{
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }
});
self.addEventListener('push',event=>{
  let message={};
  try{if(event.data)message=event.data.json()}catch(e){message={body:'新しいお知らせがあります'}}
  const title=typeof message.title==='string'?message.title:'こうたま時間';
  const options={
    body:typeof message.body==='string'?message.body:'予定のお知らせです',
    icon:'./icon-192.png',badge:'./icon-192.png',
    tag:typeof message.tag==='string'?message.tag:'koutama-reminder',
    silent:true,data:{url:self.registration.scope}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=self.registration.scope;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{
    for(const client of windows){if(client.url.startsWith(url)){await client.focus();return}}
    await clients.openWindow(url);
  }));
});
