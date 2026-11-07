// Cursus : fonctionne sans réseau.
// Réseau d'abord (pour avoir les mises à jour), sinon la dernière copie enregistrée.
const CACHE='cursus-v1';
const FILES=['./','index.html','cours.json','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>c.add(new Request(f,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  const key=r.mode==='navigate'?new URL('index.html',self.registration.scope).href:u.origin+u.pathname;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    try{
      const res=await fetch(r,{cache:'no-store'});
      if(res.ok)await c.put(key,res.clone());
      return res;
    }catch(err){
      const hit=await c.match(key);
      if(hit)return hit;
      if(r.mode==='navigate'){const p=await c.match(new URL('./',self.registration.scope).href);if(p)return p}
      throw err;
    }
  })());
});
