/* ====================================================
   MINDORA — api.js
   JSONP client for the Apps Script backend (same cross-origin
   pattern used in SmartSaver Connect AU). Only used when
   APPS_SCRIPT_URL in config.js is set; otherwise local mode
   never calls this.
   ==================================================== */

const Api = (function(){
  let counter = 0;

  function isConfigured(){
    return !!(typeof APPS_SCRIPT_URL === 'string' && APPS_SCRIPT_URL.trim());
  }

  function call(action, params){
    return new Promise((resolve, reject) => {
      if(!isConfigured()){
        reject(new Error('NO_BACKEND_CONFIGURED'));
        return;
      }
      const cbName = '__mindora_cb_' + (counter++) + '_' + Date.now();
      const merged = Object.assign({ action, callback: cbName }, params || {});
      const qs = Object.keys(merged)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(merged[k]))
        .join('&');

      const script = document.createElement('script');
      let settled = false;

      const cleanup = () => {
        delete window[cbName];
        if(script.parentNode) script.parentNode.removeChild(script);
      };

      const timeout = setTimeout(() => {
        if(settled) return;
        settled = true;
        cleanup();
        reject(new Error('TIMEOUT'));
      }, 15000);

      window[cbName] = (data) => {
        if(settled) return;
        settled = true;
        clearTimeout(timeout);
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        if(settled) return;
        settled = true;
        clearTimeout(timeout);
        cleanup();
        reject(new Error('NETWORK_ERROR'));
      };

      script.src = APPS_SCRIPT_URL + '?' + qs;
      document.body.appendChild(script);
    });
  }

  return { isConfigured, call };
})();
