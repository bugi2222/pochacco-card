'use strict';
importScripts('./precache-manifest.js','./audio-data.js');
const PREFIX='pochacco-card:'+self.registration.scope+':';
const CACHE=PREFIX+self.PRECACHE_VERSION;
const urls=self.PRECACHE_FILES.map(file=>new URL(file,self.registration.scope).href);
const allowed=new Set(urls);
const indexURL=new URL('index.html',self.registration.scope).href;
const audioURL=new URL('assets/audio/opening.mp3',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  try{const cache=await caches.open(CACHE);await cache.addAll(urls.filter(url=>url!==audioURL).map(url=>new Request(url,{cache:'reload'})));
    const bytes=Uint8Array.from(atob(self.PRECACHE_AUDIO_BASE64),c=>c.charCodeAt(0));
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
    if(digest!==self.PRECACHE_AUDIO_SHA256)throw Error('Offline audio integrity check failed');
    await cache.put(audioURL,new Response(bytes,{headers:{'Content-Type':'audio/mpeg','Content-Length':String(bytes.byteLength),'Accept-Ranges':'bytes'}}));
    await self.skipWaiting();}
  catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
async function ranged(response,range){
  const bytes=await response.arrayBuffer(),size=bytes.byteLength,match=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start=0,end=size-1;
  if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  if(!match[1]){const suffix=Number(match[2]);if(suffix<1)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});start=Math.max(0,size-suffix);}
  else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
  if(start>=size||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  const headers=new Headers(response.headers);for(const name of ['Transfer-Encoding','Connection','Content-Encoding'])headers.delete(name);headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
  return new Response(bytes.slice(start,end+1),{status:206,headers});
}
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const canonical=new URL(url.pathname,url.origin).href;
  const file=canonical===scope.href?indexURL:canonical;
  if(!allowed.has(file))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),cached=await cache.match(file);
    if(cached)return request.headers.has('Range')?ranged(cached,request.headers.get('Range')):cached;
    return fetch(request);
  })());
});
