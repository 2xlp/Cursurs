// Cursus : s'ouvre aussi sans réseau.
// Avec réseau : la version en ligne (mises à jour). Sans réseau ou réseau trop lent : la dernière copie enregistrée.
const CACHE='cursus-v3';
const FILES=['./','index.html','cours.json','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>fetch(f,{cache:'reload'}).then(r=>{if(r.ok)return c.put(new URL(f,self.registration.scope).href,r)}).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
function withTimeout(p,ms){return Promise.race([p,new Promise((_,ko)=>setTimeout(()=>ko(new Error('lent')),ms))])}
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  const nav=r.mode==='navigate';
  const key=nav?new URL('./',self.registration.scope).href:u.origin+u.pathname;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    try{
      const res=await withTimeout(fetch(u.href,{cache:'no-store'}),nav?4000:6000);
      if(res.ok)await c.put(key,res.clone());
      return res;
    }catch(err){
      const hit=await c.match(key)||(nav?await c.match(new URL('index.html',self.registration.scope).href):null);
      if(hit)return hit;
      return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font:17px system-ui;padding:24px"><h1>Cursus</h1><p>Ouvre Cursus une fois avec internet pour pouvoir l\'utiliser ensuite sans réseau.</p>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
  })());
});
