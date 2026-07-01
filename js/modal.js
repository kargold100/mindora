/* ====================================================
   MINDORA — modal.js  (v2)
   Reusable modal for:
     • confirm/cancel dialogs (replaces native confirm())
     • First-launch onboarding acknowledgment
     • Input-capture dialogs (e.g. admin reset PIN)
   Returns a Promise that resolves to:
     • false if cancelled / dismissed
     • true if confirmed (no input)
     • { inputValue: string } if an input field is present
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
        <span>${escHtml(opts.checkboxLabel)}</span>
      </label>` : '';

    const inputHtml = opts.inputPlaceholder !== undefined ? `
      <input type="${opts.inputType||'text'}"
             id="mindoraModalInput"
             placeholder="${escHtml(opts.inputPlaceholder||'')}"
             autocomplete="off"
             style="margin-top:12px; width:100%;">` : '';

    overlay.innerHTML = `
      <div class="mindora-modal-card" role="dialog" aria-modal="true">
        <h3>${escHtml(opts.title||'')}</h3>
        <p class="muted">${escHtml(opts.body||'')}</p>
        ${checkboxHtml}
        ${inputHtml}
        <div class="modal-actions">
          ${opts.cancelText ? `<button id="mindoraModalCancel" class="btn-ghost">${escHtml(opts.cancelText)}</button>` : ''}
          <button id="mindoraModalConfirm"
                  class="${opts.danger ? 'btn-danger' : 'btn-primary'}"
                  ${(opts.checkboxLabel || opts.inputPlaceholder !== undefined) ? 'disabled' : ''}>
            ${escHtml(opts.confirmText||'OK')}
          </button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => overlay.classList.add('visible'));

    const confirmBtn = overlay.querySelector('#mindoraModalConfirm');

    if(opts.checkboxLabel){
      const cb = overlay.querySelector('#mindoraModalCheckbox');
      cb.addEventListener('change', () => { confirmBtn.disabled = !cb.checked; });
    }

    if(opts.inputPlaceholder !== undefined){
      const input = overlay.querySelector('#mindoraModalInput');
      input.addEventListener('input', () => {
        confirmBtn.disabled = input.value.trim().length < (opts.inputMinLength || 1);
      });
      // Also handle Enter key in the input
      input.addEventListener('keydown', e => {
        if(e.key === 'Enter' && !confirmBtn.disabled) confirmBtn.click();
      });
      // Focus the input after animation
      setTimeout(() => { try{ input.focus(); }catch(e){} }, 120);
    }

    return overlay;
  }

  function hide(){
    const overlay = document.getElementById('mindoraModalOverlay');
    if(overlay){
      overlay.classList.remove('visible');
    }
  }

  function escHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function confirmDialog(opts){
    return new Promise(resolve => {
      const overlay = render(opts);

      overlay.querySelector('#mindoraModalConfirm').addEventListener('click', () => {
        const inputEl = overlay.querySelector('#mindoraModalInput');
        hide();
        if(inputEl){
          resolve({ inputValue: inputEl.value });
        } else {
          resolve(true);
        }
      });

      const cancelBtn = overlay.querySelector('#mindoraModalCancel');
      if(cancelBtn){
        cancelBtn.addEventListener('click', () => { hide(); resolve(false); });
      }

      // Close on backdrop click (only when a cancel exists)
      if(opts.cancelText){
        overlay.addEventListener('click', e => {
          if(e.target === overlay){ hide(); resolve(false); }
        });
      }
    });
  }

  return { confirmDialog, hide };
})();
