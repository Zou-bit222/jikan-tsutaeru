const CACHE='koutama-jikan-v10';const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).origin===self.location.origin)e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});

// Firebase Messaging: receive server-sent push messages even while the PWA is closed.
// Scheduled reminders require a separate trusted sender; this worker does not schedule them.
try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp({apiKey:'AIzaSyBICvs8y80St4Tkp2PNaWgSXQXi42HgNq8',authDomain:'koutama-jikan-1692d.firebaseapp.com',projectId:'koutama-jikan-1692d',storageBucket:'koutama-jikan-1692d.firebasestorage.app',messagingSenderId:'848923963817',appId:'1:848923963817:web:6c0095a528eac4b8ac54b8'});
  firebase.messaging().onBackgroundMessage(payload => {
    // FCM notification payloads may be displayed automatically by the SDK.
    // Only display data-only messages here to avoid duplicate notifications.
    if (payload.notification) return;
    const data=payload.data||{};
    self.registration.showNotification(data.title||'こうたま時間',{
      body:data.body||'お知らせがあります',icon:'./icon-192.png',silent:true,
      tag:data.tag||'koutama-'+Date.now(),data:{url:'./index.html'}
    });
  });
} catch (e) { console.warn('Firebase Messaging initialization failed',e); }
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windows=>{
    for(const win of windows){if(win.url.startsWith(self.location.origin)&&'focus'in win)return win.focus();}
    return clients.openWindow('./index.html');
  }));
});
