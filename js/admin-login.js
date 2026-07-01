/* ====================================================
   MINDORA — admin-login.js  (v2)
   Credential gate for admin.html.

   SHA-256 hash of "mind_admin:MindAdmin123$"
   = 0efead63e1817999fb60689c338a52f8b1ec17c26398b981d7ab8ebd93d7470d

   SECURITY NOTE (please read before trusting this):
   This check runs in the visitor's browser — View Source
   shows the hash. A determined person can bypass it using
   DevTools. This protects against casual/accidental access,
   not a targeted attempt. If your GitHub repo is public,
   the file is visible in the repo regardless of this gate.
   For real security, verify the credential server-side in
   Code.gs (remote mode) so it never reaches the browser.

   The session is NOT persisted — you re-authenticate each
   time you open this page. A "logged in" flag in localStorage
   would itself be a one-line bypass.
   ==================================================== */

(function(){

  const EXPECTED_HASH = '0efead63e1817999fb60689c338a52f8b1ec17c26398b981d7ab8ebd93d7470d';

  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function checkCredentials(username, password){
    if(!window.crypto || !window.crypto.subtle) return false;
    return (await sha256Hex(username.trim() + ':' + password)) === EXPECTED_HASH;
  }

  function showLoginError(msg){
    const el = document.getElementById('adminLoginError');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  async function showAdminPanel(){
    // Hide gate, show panel
    document.getElementById('adminLoginGate').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');

    // Apply translations NOW that the panel is visible
    I18n.applyStaticTranslations();

    // Show local vs remote mode indicator
    const modeText  = document.getElementById('adminModeText');
    const modeBadge = document.getElementById('adminModeBadge');
    if(Profiles.isRemoteMode()){
      if(modeBadge){ modeBadge.textContent = '● Remote mode'; modeBadge.style.color = 'var(--moss)'; }
      if(modeText)  modeText.removeAttribute('data-i18n'); // use static text
    } else {
      if(modeBadge){ modeBadge.textContent = '● Local mode'; modeBadge.style.color = 'var(--bloom)'; }
      if(modeText)  modeText.textContent = I18n.t('admin_local_mode_note');
    }

    // Load profiles
    await Admin.render();
  }

  async function handleLoginSubmit(e){
    e.preventDefault();
    const username = document.getElementById('adminUsernameInput').value;
    const password = document.getElementById('adminPasswordInput').value;
    const btn      = document.getElementById('adminLoginBtn');
    document.getElementById('adminLoginError').classList.add('hidden');
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = '…';

    try{
      const ok = await checkCredentials(username, password);
      if(ok){
        await showAdminPanel();
      } else {
        showLoginError(I18n.t('admin_login_error'));
      }
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }

  function init(){
    // Init I18n before anything else
    I18n.init();
    I18n.applyStaticTranslations();

    // Login form
    document.getElementById('adminLoginForm').addEventListener('submit', handleLoginSubmit);

    // Support Enter key in password field
    document.getElementById('adminPasswordInput').addEventListener('keydown', e => {
      if(e.key === 'Enter') document.getElementById('adminLoginForm').requestSubmit();
    });

    // Logout = refresh page (clears in-memory state)
    document.getElementById('adminLogoutBtn').addEventListener('click', () => location.reload());

    // Refresh list button
    document.getElementById('adminRefreshBtn').addEventListener('click', async () => {
      const btn = document.getElementById('adminRefreshBtn');
      btn.disabled = true;
      await Admin.loadProfiles();
      Admin.renderProfileList();
      btn.disabled = false;
    });

    // Add profile button
    document.getElementById('adminAddBtn').addEventListener('click', async () => {
      const name   = document.getElementById('adminNewName').value.trim();
      const pin    = document.getElementById('adminNewPin').value.trim();
      const errEl  = document.getElementById('adminAddError');
      errEl.classList.add('hidden');

      if(!name || pin.length < 4){
        errEl.textContent = I18n.t('profile_error_pin');
        errEl.classList.remove('hidden');
        return;
      }

      const btn   = document.getElementById('adminAddBtn');
      const orig  = btn.textContent;
      btn.disabled = true;
      btn.textContent = I18n.t('loading');
      try{
        await Admin.addProfile(name, pin);
        document.getElementById('adminNewName').value = '';
        document.getElementById('adminNewPin').value = '';
      }catch(err){
        errEl.textContent = err.message === 'NAME_TAKEN' ? I18n.t('profile_error_taken') : err.message;
        errEl.classList.remove('hidden');
      }finally{
        btn.disabled = false;
        btn.textContent = orig;
      }
    });

    // Enter key in add form
    ['adminNewName','adminNewPin'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if(e.key === 'Enter') document.getElementById('adminAddBtn').click();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
