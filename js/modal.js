/* ====================================================
   MINDORA — modal.js
   A small reusable modal, used for:
   1. The one-time first-launch disclaimer acknowledgment
   2. Replacing native browser confirm() dialogs (clear data,
      remove profile) with something that matches the rest of
      the design instead of a jarring system popup
   ==================================================== */

const Modal = (function(){

  function render(opts){
    let overlay = document.getElementById('mindoraModalOverlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'mindoraModalOverlay';
      overlay.className = 'mindora-modal-overlay';
      document.body.appendChild(overlay);
    }

    const checkboxHtml = opts.checkboxLabel ? `
      <label class="modal-checkbox-row">
        <input type="checkbox" id="mindoraModalCheckbox">
        <span>${opts.checkboxLabel}</span>
      </label>` : '';

    overlay.innerHTML = `
      <div class="mindora-modal-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(opts.title || '')}">
        <h3>${escapeHtml(opts.title || '')}</h3>
        <p class="muted">${escapeHtml(opts.body || '')}</p>
        ${checkboxHtml}
        <div class="modal-actions">
          ${opts.cancelText ? `<button id="mindoraModalCancel" class="btn-ghost">${escapeHtml(opts.cancelText)}</button>` : ''}
          <button id="mindoraModalConfirm" class="${opts.danger ? 'btn-danger' : 'btn-primary'}" ${opts.checkboxLabel ? 'disabled' : ''}>${escapeHtml(opts.confirmText || '')}</button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => overlay.classList.add('visible'));
    return overlay;
  }

  function hide(){
    const overlay = document.getElementById('mindoraModalOverlay');
    if(overlay) overlay.classList.remove('visible');
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Returns a Promise<boolean> — true if confirmed, false if cancelled.
  // Omit cancelText for a single-button dialog (e.g. an acknowledgment
  // that must be confirmed to proceed, with no way to decline).
  function confirmDialog(opts){
    return new Promise(resolve => {
      const overlay = render(opts);

      if(opts.checkboxLabel){
        const cb = overlay.querySelector('#mindoraModalCheckbox');
        const confirmBtn = overlay.querySelector('#mindoraModalConfirm');
        cb.addEventListener('change', () => { confirmBtn.disabled = !cb.checked; });
      }

      overlay.querySelector('#mindoraModalConfirm').addEventListener('click', () => {
        hide();
        resolve(true);
      });

      const cancelBtn = overlay.querySelector('#mindoraModalCancel');
      if(cancelBtn){
        cancelBtn.addEventListener('click', () => {
          hide();
          resolve(false);
        });
      }
    });
  }

  return { confirmDialog, hide };
})();
