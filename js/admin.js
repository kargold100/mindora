/* ====================================================
   MINDORA — admin.js  (v2)
   Profile management for the standalone admin page.

   ── Local mode (no Apps Script URL configured) ──────
   Reads/writes the 'mindora_profiles_local' key in
   localStorage. IMPORTANT: localStorage is per-browser,
   per-origin. Both this admin page and the main app
   MUST be served from the same origin (e.g. the same
   GitHub Pages URL) AND opened in the same browser on
   the same device for pending registrations to appear.
   If a user registers on their phone and you check admin
   on your laptop, the profile will not appear — use
   remote mode for cross-device management.

   ── Remote mode (Apps Script URL in config.js) ──────
   Reads/writes via the configured Apps Script backend
   (Google Sheets). Works across any device on any browser.
   ==================================================== */

const Admin = (function(){

  let profiles = [];
  let lastRefreshed = null;

  // ── Render the full admin panel ──────────────────────

  async function render(){
    await loadProfiles();
    renderPendingBanner();
    renderProfileList();
  }

  async function loadProfiles(){
    const list = document.getElementById('adminProfileList');
    if(list) list.innerHTML = `<div class="admin-loading">${I18n.t('loading')}</div>`;
    try{
      profiles = await Profiles.listAllProfiles();
      lastRefreshed = new Date();
    }catch(e){
      console.error('Mindora admin: could not load profiles', e);
      profiles = [];
    }
  }

  function renderPendingBanner(){
    const banner = document.getElementById('adminPendingBanner');
    if(!banner) return;
    const pending = profiles.filter(p => (p.status || 'approved') === 'pending');
    if(pending.length){
      banner.textContent = I18n.t('admin_pending_count', { n: pending.length });
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  function renderProfileList(){
    const container = document.getElementById('adminProfileList');
    if(!container) return;

    // Update refresh timestamp
    const ts = document.getElementById('adminRefreshTime');
    if(ts && lastRefreshed){
      ts.textContent = lastRefreshed.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
    }

    if(!profiles.length){
      container.innerHTML = `<p class="empty-state">${I18n.t('admin_empty')}</p>`;
      return;
    }

    // Pending first, then alpha
    const sorted = profiles.slice().sort((a,b) => {
      const ap = (a.status||'approved') === 'pending' ? 0 : 1;
      const bp = (b.status||'approved') === 'pending' ? 0 : 1;
      if(ap !== bp) return ap - bp;
      return (a.name||'').localeCompare(b.name||'');
    });

    container.innerHTML = sorted.map(p => {
      const isPending = (p.status || 'approved') === 'pending';
      return `
        <div class="admin-profile-row ${isPending ? 'pending' : ''}">
          <div class="admin-profile-info">
            <span class="admin-profile-name">${escapeHtml(p.name)}</span>
            <span class="admin-badge ${isPending ? 'pending' : 'approved'}">
              ${isPending ? I18n.t('admin_status_pending') : I18n.t('admin_status_approved')}
            </span>
          </div>
          <div class="admin-profile-actions">
            ${isPending ? `<button class="btn-approve" data-approve="${p.profileId}">${I18n.t('admin_approve')}</button>` : ''}
            <button class="btn-remove-profile" data-remove="${p.profileId}" data-name="${escapeHtml(p.name)}" aria-label="${I18n.t('admin_remove')} ${escapeHtml(p.name)}">✕</button>
          </div>
        </div>
      `;
    }).join('');

    // Wire approve buttons
    container.querySelectorAll('[data-approve]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-approve');
        btn.disabled = true;
        btn.textContent = I18n.t('loading');
        try{
          await Profiles.approveProfile(id);
          await loadProfiles();
          renderPendingBanner();
          renderProfileList();
        }catch(e){
          console.error('Mindora admin: approve failed', e);
          btn.disabled = false;
          btn.textContent = I18n.t('admin_approve');
        }
      });
    });

    // Wire remove buttons
    container.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id   = btn.getAttribute('data-remove');
        const name = btn.getAttribute('data-name');
        const ok = await Modal.confirmDialog({
          title: I18n.t('admin_remove'),
          body: I18n.t('admin_remove_confirm', { name }),
          confirmText: I18n.t('admin_remove'),
          cancelText: I18n.t('btn_cancel'),
          danger: true
        });
        if(!ok) return;
        btn.disabled = true;
        try{
          await Profiles.removeProfile(id);
          await loadProfiles();
          renderPendingBanner();
          renderProfileList();
        }catch(e){
          console.error('Mindora admin: remove failed', e);
          btn.disabled = false;
        }
      });
    });
  }

  async function addProfile(name, pin){
    await Profiles.createProfileSilently(name, pin);
    await loadProfiles();
    renderPendingBanner();
    renderProfileList();
  }

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return { render, addProfile, loadProfiles, renderProfileList };
})();
