/* ====================================================
   MINDORA — admin.js
   Lets the person managing this device add or remove profiles
   from Settings, with no separate login of its own — whoever is
   already in Settings can use it. Names are listed; PINs never
   are, in either direction (adding a profile here still requires
   typing that profile's own PIN, same as the normal create flow,
   it just doesn't switch the active session to it).
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

    const current = Profiles.getSession();
    list.innerHTML = profiles.map(p => {
      const isCurrent = current && current.id === p.profileId;
      return `
      <div class="activity-row${isCurrent ? ' admin-current-row' : ''}">
        <div class="activity-main">
          <div class="activity-title">${escapeHtml(p.name)}</div>
        </div>
        <button class="btn-danger admin-remove-btn" data-remove-profile="${p.profileId}" data-remove-name="${escapeHtml(p.name)}">${I18n.t('admin_remove')}</button>
      </div>
    `;
    }).join('');

    list.querySelectorAll('[data-remove-profile]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-remove-profile');
        const name = btn.getAttribute('data-remove-name');
        if(!confirm(I18n.t('admin_remove_confirm', { name }))) return;
        btn.disabled = true;
        try{
          await Profiles.removeProfile(id);
          await render();
          if(typeof window.MindoraOnProfileRemoved === 'function'){
            window.MindoraOnProfileRemoved(id);
          }
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
