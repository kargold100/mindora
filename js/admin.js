/* ====================================================
   MINDORA — admin.js  (v3)
   Full profile management:
     • Approve / Reject pending profiles
     • Lock / Unlock any profile  
     • Reset PIN for any profile
     • Remove a profile entirely
     • Add a new auto-approved profile
   ==================================================== */

const Admin = (function(){

  let profiles = [];
  let lastRefreshed = null;

  // ── Main render entry ─────────────────────────────

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
      console.error('Mindora admin: listAllProfiles failed:', e.message);
      profiles = [];
      // Show the real error, not just an empty list
      if(list){
        list.innerHTML = `
          <div class="admin-empty-state" style="border:1px solid rgba(200,123,104,0.3);">
            <p style="color:var(--bloom); font-weight:600; margin-bottom:6px;">⚠ Could not load profiles</p>
            <p style="font-family:var(--font-mono); font-size:.76rem;">${e.message}</p>
            <p style="margin-top:10px; font-size:.8rem;">If the sheet was just created, click <strong>Run setup()</strong> below, then try Refresh.</p>
            <button id="adminRunSetupBtn" class="btn-secondary" style="margin-top:10px; width:100%;">Run setup() to initialise sheets</button>
          </div>
        `;
        const setupBtn = list.querySelector('#adminRunSetupBtn');
        if(setupBtn){
          setupBtn.addEventListener('click', async () => {
            setupBtn.disabled = true; setupBtn.textContent = '…';
            try{
              if(Profiles.isRemoteMode()){
                await Api.call('setup', {});
              }
              await loadProfiles();
              renderPendingBanner();
              renderProfileList();
            }catch(err){
              setupBtn.textContent = 'Failed: ' + err.message;
            }
          });
        }
      }
    }
  }

  function renderPendingBanner(){
    const banner = document.getElementById('adminPendingBanner');
    if(!banner) return;
    const n = profiles.filter(p => (p.status||'approved') === 'pending').length;
    if(n > 0){
      banner.textContent = I18n.t('admin_pending_count', { n });
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  function renderProfileList(){
    const container = document.getElementById('adminProfileList');
    if(!container) return;

    const tsEl = document.getElementById('adminRefreshTime');
    if(tsEl && lastRefreshed){
      tsEl.textContent = lastRefreshed.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
    }

    if(!profiles.length){
      // Show a diagnostic note in local mode
      const diag = Profiles.localDiagnostic();
      if(diag && diag.profileCount === 0){
        container.innerHTML = `
          <div class="admin-empty-state">
            <p>${I18n.t('admin_local_empty_hint')}</p>
            <div class="admin-diag-box" style="margin-top:10px;">
              <p style="font-size:.74rem; color:var(--text-muted); font-family:var(--font-mono);">
                Mindora keys in this browser: ${diag.mindoraKeys.length}<br>
                ${diag.mindoraKeys.map(k=>'· '+k).join('<br>')}
              </p>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `<p class="empty-state">${I18n.t('admin_empty')}</p>`;
      }
      return;
    }

    // Sort: pending first, then locked, then approved; alpha within each group
    const order = { pending:0, locked:1, approved:2 };
    const sorted = profiles.slice().sort((a,b) => {
      const sa = order[a.status||'approved'] ?? 2;
      const sb = order[b.status||'approved'] ?? 2;
      if(sa !== sb) return sa - sb;
      return (a.name||'').localeCompare(b.name||'');
    });

    container.innerHTML = sorted.map(p => {
      const status = p.status || 'approved';
      const isPending = status === 'pending';
      const isLocked  = status === 'locked';

      const badgeLabel = isPending ? I18n.t('admin_status_pending')
                       : isLocked  ? I18n.t('admin_status_locked')
                       : I18n.t('admin_status_approved');

      const approveBtn = isPending
        ? `<button class="admin-action-btn approve-btn" data-approve="${p.profileId}">${I18n.t('admin_approve')}</button>`
        : '';
      const lockBtn = !isPending
        ? isLocked
          ? `<button class="admin-action-btn unlock-btn" data-unlock="${p.profileId}">${I18n.t('admin_unlock')}</button>`
          : `<button class="admin-action-btn lock-btn" data-lock="${p.profileId}">${I18n.t('admin_lock')}</button>`
        : '';
      const resetBtn   = `<button class="admin-action-btn pin-btn" data-reset-pin="${p.profileId}" data-name="${escHtml(p.name)}">${I18n.t('admin_reset_pin')}</button>`;
      const resendBtn  = (status === 'approved' && p.email) ? `<button class="admin-action-btn resend-btn" data-resend="${p.profileId}" title="Resend approval email to ${escHtml(p.email)}">✉</button>` : '';
      const removeBtn  = `<button class="admin-action-btn remove-btn" data-remove="${p.profileId}" data-name="${escHtml(p.name)}">✕</button>`;
      const emailHint  = p.email ? `<span class="admin-profile-email">${escHtml(p.email)}</span>` : '';

      return `
        <div class="admin-profile-row ${status}">
          <div class="admin-profile-info">
            <span class="admin-profile-name">${escHtml(p.name)}</span>
            <span class="admin-badge ${status}">${badgeLabel}</span>
            ${emailHint}
          </div>
          <div class="admin-profile-actions">
            ${approveBtn}${lockBtn}${resetBtn}${resendBtn}${removeBtn}
          </div>
        </div>
      `;
    }).join('');

    wireActions(container);
  }

  function wireActions(container){
    // Approve
    container.querySelectorAll('[data-approve]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await runAction(btn, () => Profiles.approveProfile(btn.getAttribute('data-approve')));
      });
    });

    // Lock
    container.querySelectorAll('[data-lock]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await runAction(btn, () => Profiles.lockProfile(btn.getAttribute('data-lock')));
      });
    });

    // Unlock
    container.querySelectorAll('[data-unlock]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await runAction(btn, () => Profiles.unlockProfile(btn.getAttribute('data-unlock')));
      });
    });

    // Reset PIN
    container.querySelectorAll('[data-reset-pin]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id   = btn.getAttribute('data-reset-pin');
        const name = btn.getAttribute('data-name');
        const ok = await Modal.confirmDialog({
          title: `${I18n.t('admin_reset_pin')}: ${name}`,
          body: I18n.t('admin_reset_pin_prompt'),
          checkboxLabel: null,
          confirmText: I18n.t('admin_reset_pin_confirm'),
          cancelText: I18n.t('btn_cancel'),
          inputPlaceholder: '••••',
          inputType: 'password',
          danger: false
        });
        if(!ok) return;
        const pin = ok.inputValue;
        if(!pin || pin.length < 4){
          showAdminError(I18n.t('profile_error_pin')); return;
        }
        await runAction(btn, () => Profiles.resetProfilePin(id, pin));
      });
    });

    // Resend approval email
    container.querySelectorAll('[data-resend]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-resend');
        btn.disabled = true; btn.textContent = '…';
        try{
          if(Profiles.isRemoteMode()){
            await Api.call('resendApprovalEmail', { profileId: id });
          }
          if(typeof window.MindoraShowToast === 'function'){
            window.MindoraShowToast('✉ Email sent');
          }
        }catch(e){ console.error('Resend failed', e); }
        btn.disabled = false; btn.textContent = '✉';
      });
    });

    // Remove
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
        await runAction(btn, () => Profiles.removeProfile(id));
      });
    });
  }

  async function runAction(btn, fn){
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = '…';
    try{
      await fn();
      await loadProfiles();
      renderPendingBanner();
      renderProfileList();
    }catch(e){
      console.error('Mindora admin action failed', e);
      btn.disabled = false;
      btn.textContent = orig;
      showAdminError(e.message);
    }
  }

  function showAdminError(msg){
    const el = document.getElementById('adminGlobalError');
    if(!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  async function addProfile(name, pin){
    await Profiles.createProfileSilently(name, pin);
    await loadProfiles();
    renderPendingBanner();
    renderProfileList();
  }

  function escHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return { render, addProfile, loadProfiles, renderProfileList };
})();
