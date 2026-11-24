(() => {
  'use strict';
  // file:// and the Capacitor wrapper keep working without a service worker.
  if (!isSecureContext || !['https:','http:'].includes(location.protocol) || !('serviceWorker' in navigator) || window.Capacitor?.isNativePlatform?.()) return;
  const status = document.getElementById('pwaStatus');
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
    .then(async registration => {
      await navigator.serviceWorker.ready;
      document.body.dataset.offlineReady='true';
      if (status) status.textContent='Открытка сохранена для работы без интернета.';
      const hint=document.getElementById('hint'); if(hint)hint.title='Открытка готова к работе без интернета';
      addEventListener('online',()=>registration.update().catch(()=>{}));
    })
    .catch(() => {
      document.body.dataset.offlineReady='false';
      if(status)status.textContent='Не удалось сохранить офлайн-копию. Открытка работает, пока есть интернет.';
    });
})();
