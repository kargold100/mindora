/* ====================================================
   MINDORA — admin-login.js
   Controller for admin.html: a credential gate plus wiring for
   the profile management panel.

   IMPORTANT — read this before relying on it:
   This is a static site with no server of its own. Any check
   that runs in JavaScript in the visitor's browser can be read
   (View Source / DevTools) and, by a determined person, bypassed
   entirely. Hashing the credential (SHA-256 below) means the
   literal password isn't sitting in plain text in the file, but
   it does NOT make this secure against someone who actually
   tries to get in — only against casual/accidental access. If
   your GitHub repo is public, this file and its hash are visible
   to anyone who browses the repo, whether or not they ever
   visit the page.

   The login here is intentionally NOT remembered between visits
   (no session token saved anywhere) — you re-enter the
   credentials every time you load this page. That's a deliberate
   choice: a saved "is_admin=true" flag in localStorage would
   itself be a trivial bypass for anyone poking at dev tools.
   ==================================================== */

(function(){

  // SHA-256 of "username:password" — never the plaintext. Generated once
  // with Node's crypto module; if you want different credentials, compute
  // a new hash the same way and replace this constant.
  const EXPECTED_HASH = '0efead63e1817999fb60689c338a52f8b1ec17c26398b981d7ab8ebd93d7470d';

  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function checkCredentials(username, password){
    if(!window.crypto || !window.crypto.subtle){
      // crypto.subtle needs a secure context (https, or localhost). Fails
      // closed rather than silently accepting anything.
      return false;
    }
    const combined = (username || '').trim() + ':' + (password || '');
    const hash = await sha256Hex(combined);
    return hash === EXPECTED_HASH;
  }

  function showLoginError(msg){
    const el = document.getElementById('adminLoginError');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  async function handleLoginSubmit(e){
    e.preventDefault();
    const username = document.getElementById('adminUsernameInput').value;
    const password = document.getElementById('adminPasswordInput').value;
    const btn = document.getElementById('adminLoginBtn');
    const original = btn.textContent;
    document.getElementById('adminLoginError').classList.add('hidden');
    btn.disabled = true;
    btn.textContent = I18n.t('loading');

    try{
      const ok = await checkCredentials(username, password);
      if(ok){
        document.getElementById('adminLoginGate').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        Admin.render();
      } else {
        showLoginError(I18n.t('admin_login_error'));
      }
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  function init(){
    I18n.init();
    document.getElementById('adminLoginForm').addEventListener('submit', handleLoginSubmit);
    document.getElementById('adminLogoutBtn').addEventListener('click', () => location.reload());

    document.getElementById('adminAddBtn').addEventListener('click', async () => {
      const name = document.getElementById('adminNewName').value.trim();
      const pin = document.getElementById('adminNewPin').value.trim();
      const errEl = document.getElementById('adminAddError');
      errEl.classList.add('hidden');

      if(!name || pin.length < 4){
        errEl.textContent = I18n.t('profile_error_pin');
        errEl.classList.remove('hidden');
        return;
      }

      const btn = document.getElementById('adminAddBtn');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = I18n.t('loading');
      try{
        await Admin.addProfile(name, pin);
        document.getElementById('adminNewName').value = '';
        document.getElementById('adminNewPin').value = '';
      }catch(e){
        errEl.textContent = (e.message === 'NAME_TAKEN') ? I18n.t('profile_error_taken') : I18n.t('profile_error_notfound');
        errEl.classList.remove('hidden');
      }finally{
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
