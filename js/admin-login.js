/* ====================================================
   MINDORA — admin-login.js  (v3)
   ──────────────────────────────────────────────────
   Default credentials: mind_admin / MindAdmin123$
   SHA-256("mind_admin:MindAdmin123$")
     = 0efead63e1817999fb60689c338a52f8b1ec17c26398b981d7ab8ebd93d7470d

   Admin can change their password from the panel.
   The new hash is stored in localStorage under
   'mindora_admin_hash_override' so it persists.
   (Still client-side — read the security note in
    admin-login.js comments before relying on this.)
   ==================================================== */

(function(){

  const DEFAULT_HASH = '0efead63e1817999fb60689c338a52f8b1ec17c26398b981d7ab8ebd93d7470d';
  const OVERRIDE_KEY = 'mindora_admin_hash_override';

  // ── SHA-256 helper ────────────────────────────────

  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function getExpectedHash(){
    try{
      return localStorage.getItem(OVERRIDE_KEY) || DEFAULT_HASH;
    }catch(e){ return DEFAULT_HASH; }
  }

  async function checkCredentials(username, password){
    if(!window.crypto || !window.crypto.subtle) return false;
    const hash = await sha256Hex(username.trim() + ':' + password);
    return hash === getExpectedHash();
  }

  // ── Login gate ────────────────────────────────────

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
    document.getElementById('adminLoginError').classList.add('hidden');
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = '…';
    try{
      if(await checkCredentials(username, password)){
        await showAdminPanel();
      } else {
        showLoginError(I18n.t('admin_login_error'));
      }
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }

  // ── Panel show ────────────────────────────────────

  async function showAdminPanel(){
    document.getElementById('adminLoginGate').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');

    // Apply translations now that the panel is visible
    I18n.applyStaticTranslations();

    // Mode indicator
    const modeCard = document.getElementById('adminModeCard');
    const modeBadge = document.getElementById('adminModeBadge');
    const modeText = document.getElementById('adminModeText');
    if(Profiles.isRemoteMode()){
      if(modeBadge){ modeBadge.textContent = '● Remote'; modeBadge.style.color = 'var(--moss)'; }
      if(modeText) modeText.textContent = 'Remote mode — changes sync via Google Sheets.';
    } else {
      if(modeBadge){ modeBadge.textContent = '● Local'; modeBadge.style.color = 'var(--bloom)'; }
      if(modeText) modeText.textContent = I18n.t('admin_local_mode_note');
    }

    await Admin.render();
  }

  // ── Change admin password ─────────────────────────

  async function handleChangePassword(){
    const current = document.getElementById('adminCurrentPwd').value;
    const next    = document.getElementById('adminNewPwd').value;
    const confirm = document.getElementById('adminConfirmPwd').value;
    const errEl   = document.getElementById('adminPwdError');
    const okEl    = document.getElementById('adminPwdOk');
    errEl.classList.add('hidden');
    okEl.classList.add('hidden');

    if(next !== confirm){
      errEl.textContent = I18n.t('admin_password_mismatch');
      errEl.classList.remove('hidden'); return;
    }
    if(next.length < 6){
      errEl.textContent = I18n.t('profile_error_pin');
      errEl.classList.remove('hidden'); return;
    }

    const currentOk = await checkCredentials(
      document.getElementById('adminUsernameInput').value || 'mind_admin',
      current
    );
    if(!currentOk){
      errEl.textContent = I18n.t('admin_password_wrong');
      errEl.classList.remove('hidden'); return;
    }

    // Save new hash — "mind_admin" username is fixed, only password changes
    const newHash = await sha256Hex('mind_admin:' + next);
    try{ localStorage.setItem(OVERRIDE_KEY, newHash); }catch(e){}
    document.getElementById('adminCurrentPwd').value = '';
    document.getElementById('adminNewPwd').value = '';
    document.getElementById('adminConfirmPwd').value = '';
    okEl.textContent = I18n.t('admin_password_changed');
    okEl.classList.remove('hidden');
  }

  // ── Test connection ───────────────────────────────

  async function handleTestConnection(){
    const btn = document.getElementById('adminTestConnBtn');
    const result = document.getElementById('adminConnResult');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = '…';
    result.classList.add('hidden');
    result.classList.remove('ok','fail');

    if(!Profiles.isRemoteMode()){
      result.textContent = '● Local mode — no backend configured.';
      result.style.color = 'var(--bloom)';
      result.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = orig;
      return;
    }

    try{
      const profiles = await Profiles.listAllProfiles();
      result.textContent = I18n.t('admin_connection_ok') + ` (${profiles.length} profiles)`;
      result.style.color = 'var(--moss)';
    }catch(e){
      result.textContent = I18n.t('admin_connection_fail') + ': ' + e.message;
      result.style.color = 'var(--bloom)';
    }
    result.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = orig;
  }

  // ── Init ──────────────────────────────────────────

  function init(){
    I18n.init();
    I18n.applyStaticTranslations();

    document.getElementById('adminLoginForm').addEventListener('submit', handleLoginSubmit);
    document.getElementById('adminPasswordInput').addEventListener('keydown', e => {
      if(e.key === 'Enter') document.getElementById('adminLoginBtn').click();
    });
    document.getElementById('adminLogoutBtn').addEventListener('click', () => location.reload());

    document.getElementById('adminRefreshBtn').addEventListener('click', async () => {
      const btn = document.getElementById('adminRefreshBtn');
      btn.disabled = true;
      await Admin.loadProfiles();
      Admin.renderProfileList();
      btn.disabled = false;
    });

    // Add profile
    document.getElementById('adminAddBtn').addEventListener('click', async () => {
      const name  = document.getElementById('adminNewName').value.trim();
      const pin   = document.getElementById('adminNewPin').value.trim();
      const errEl = document.getElementById('adminAddError');
      errEl.classList.add('hidden');
      if(!name || pin.length < 4){
        errEl.textContent = I18n.t('profile_error_pin');
        errEl.classList.remove('hidden'); return;
      }
      const btn = document.getElementById('adminAddBtn');
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '…';
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
    ['adminNewName','adminNewPin'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if(e.key === 'Enter') document.getElementById('adminAddBtn').click();
      });
    });

    // Change password
    document.getElementById('adminChangePwdBtn').addEventListener('click', handleChangePassword);

    // Test connection
    document.getElementById('adminTestConnBtn').addEventListener('click', handleTestConnection);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
