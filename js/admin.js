/* ====================================================
   MINDORA — admin.js
   Profile management for the standalone admin page
   (admin.html) — approve, add, or remove profiles. PINs are
   never shown here, in either direction. This module assumes
   the credential gate in js/admin-login.js has already run;
   it doesn't check who's calling it itself.
   ==================================================== */

const Admin = (function(){

  let profiles = [];
  let loading = false;

  async function render(){
    const list = document.getElementById('adminProfileList');
    if(!list) return;

    if(loading){
      list.innerHTML = `<p class="muted-inline">${I18n.t('loading')}</p>`;
      return;
    }

    loading = true;
    list.innerHTML = `<p class="muted-inline">${I18n.t('loading')}</p>`;
    try{
      profiles = await Profiles.listAllProfiles();
    }catch(e){
      console.error('Mindora: could not load profiles', e);
      profiles = [];
    }
    loading = false;

    if(!profiles.length){
      list.innerHTML = `<p class="empty-state">${I18n.t('admin_empty')}</p>`;
      return;
    }

    // Pending profiles first, so the thing most likely to need action is on top.
    const sorted = profiles.slice().sort((a,b) => {
      const ap = (a.status || 'approved') === 'pending' ? 0 : 1;
      const bp = (b.status || 'approved') === 'pending' ? 0 : 1;
      return ap - bp;
    });

    list.innerHTML = sorted.map(p => {
      const isPending = (p.status || 'approved') === 'pending';
      const badge = isPending
        ? `<span class="admin-badge pending">${I18n.t('admin_status_pending')}</span>`
        : `<span class="admin-badge approved">${I18n.t('admin_status_approved')}</span>`;
      return `
      <div class="activity-row">
        <div class="activity-main">
          <div class="activity-title">${escapeHtml(p.name)} ${badge}</div>
        </div>
        <div style="display:flex; gap:6px;">
          ${isPending ? `<button class="btn-secondary admin-approve-btn" data-approve-profile="${p.profileId}">${I18n.t('admin_approve')}</button>` : ''}
          <button class="btn-danger admin-remove-btn" data-remove-profile="${p.profileId}" data-remove-name="${escapeHtml(p.name)}">${I18n.t('admin_remove')}</button>
        </div>
      </div>
    `;
    }).join('');

    list.querySelectorAll('[data-approve-profile]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-approve-profile');
        btn.disabled = true;
        try{
          await Profiles.approveProfile(id);
          await render();
        }catch(e){
          console.error('Mindora: could not approve profile', e);
          btn.disabled = false;
        }
      });
    });

    list.querySelectorAll('[data-remove-profile]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-remove-profile');
        const name = btn.getAttribute('data-remove-name');
        if(!confirm(I18n.t('admin_remove_confirm', { name }))) return;
        btn.disabled = true;
        try{
          await Profiles.removeProfile(id);
          await render();
        }catch(e){
          console.error('Mindora: could not remove profile', e);
          btn.disabled = false;
        }
      });
    });
  }

  async function addProfile(name, pin){
    await Profiles.createProfileSilently(name, pin);
    await render();
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render, addProfile };
})();
