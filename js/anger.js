/* ====================================================
   MINDORA — anger.js
   Anger Management module with three sections:
   Understand | Cool-down | Log
   Anger log is stored in localStorage.
   ==================================================== */

const Anger = (function(){

  const STORE_KEY = 'mindora_anger_log';

  function getLog(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY)||'[]'); }
    catch(e){ return []; }
  }
  function saveEntry(entry){
    const log = getLog();
    log.unshift({ ...entry, id:'ang_'+Date.now(), date:Storage.todayStr() });
    if(log.length > 30) log.length = 30;
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(log)); }catch(e){}
  }

  let activeTab = 'understand';

  const INTENSITY_LABELS = [
    {v:1, key:'anger_i1'}, {v:3, key:'anger_i3'}, {v:5, key:'anger_i5'},
    {v:7, key:'anger_i7'}, {v:9, key:'anger_i9'}, {v:10,key:'anger_i10'}
  ];

  function getIntensityLabel(v){
    let best = INTENSITY_LABELS[0];
    for(const item of INTENSITY_LABELS){
      if(v >= item.v) best = item;
    }
    return I18n.t(best.key);
  }

  function getIntensityColor(v){
    if(v <= 3) return 'var(--moss)';
    if(v <= 5) return 'var(--dusk)';
    if(v <= 7) return 'var(--ash)';
    return 'var(--bloom)';
  }

  /* ── Main render ─────────────────────────────────── */
  function render(){
    const container = document.getElementById('angerContent');
    if(!container) return;

    container.innerHTML = `
      <p class="muted" style="margin-bottom:12px;">${I18n.t('anger_subtitle')}</p>
      <div class="range-tabs" id="angerSubTabs" role="group">
        <button class="range-tab ${activeTab==='understand'?'active':''}" data-anger-tab="understand">${I18n.t('anger_tab_understand')}</button>
        <button class="range-tab ${activeTab==='cooldown'?'active':''}" data-anger-tab="cooldown">${I18n.t('anger_tab_cooldown')}</button>
        <button class="range-tab ${activeTab==='log'?'active':''}" data-anger-tab="log">${I18n.t('anger_tab_log')}</button>
      </div>
      <div id="angerUnderstand" class="${activeTab!=='understand'?'hidden':''}"></div>
      <div id="angerCooldown" class="${activeTab!=='cooldown'?'hidden':''}"></div>
      <div id="angerLog" class="${activeTab!=='log'?'hidden':''}"></div>
    `;

    container.querySelectorAll('[data-anger-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-anger-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.getAttribute('data-anger-tab');
        renderTab(container);
      });
    });

    renderTab(container);
  }

  function renderTab(container){
    const u = document.getElementById('angerUnderstand');
    const c = document.getElementById('angerCooldown');
    const l = document.getElementById('angerLog');
    if(!u || !c || !l) return;

    u.classList.toggle('hidden', activeTab !== 'understand');
    c.classList.toggle('hidden', activeTab !== 'cooldown');
    l.classList.toggle('hidden', activeTab !== 'log');

    if(activeTab === 'understand') renderUnderstand(u);
    if(activeTab === 'cooldown')   renderCooldown(c);
    if(activeTab === 'log')        renderLog(l, container);
  }

  /* ── Understand ──────────────────────────────────── */
  function renderUnderstand(el){
    el.innerHTML = `
      ${card(I18n.t('anger_what_title'), I18n.t('anger_what_body'))}
      ${card(I18n.t('anger_cycle_title'), I18n.t('anger_cycle_body'))}
      ${card(I18n.t('anger_warning_title'), I18n.t('anger_warning_body'))}

      <div class="anger-intensity-section card">
        <h3>${I18n.t('anger_intensity_title')}</h3>
        <div class="anger-slider-row">
          <input type="range" id="angerIntensitySlider" min="1" max="10" value="5" class="mood-slider">
        </div>
        <div class="anger-intensity-display">
          <span id="angerIntensityNum" class="anger-intensity-num" style="color:${getIntensityColor(5)}">5</span>
          <span id="angerIntensityLabel" class="anger-intensity-label">${getIntensityLabel(5)}</span>
        </div>
      </div>

      ${card(I18n.t('anger_express_title'),
        `<p>${I18n.t('anger_express_intro')}</p>
         <ul class="anger-express-list">
           <li>${I18n.t('anger_express_1')}</li>
           <li>${I18n.t('anger_express_2')}</li>
           <li>${I18n.t('anger_express_3')}</li>
           <li>${I18n.t('anger_express_4')}</li>
           <li>${I18n.t('anger_express_5')}</li>
         </ul>`
      )}
    `;

    const slider = el.querySelector('#angerIntensitySlider');
    if(slider){
      slider.addEventListener('input', () => {
        const v = Number(slider.value);
        const numEl = el.querySelector('#angerIntensityNum');
        const lblEl = el.querySelector('#angerIntensityLabel');
        const col = getIntensityColor(v);
        if(numEl){ numEl.textContent = v; numEl.style.color = col; }
        if(lblEl){ lblEl.textContent = getIntensityLabel(v); }
      });
    }
  }

  /* ── Cool-down ───────────────────────────────────── */
  function renderCooldown(el){
    el.innerHTML = `
      <div class="card anger-stop-card">
        <h3>${I18n.t('anger_stop_title')}</h3>
        <p class="muted" style="margin-bottom:10px;">S·T·O·P</p>
        <div class="anger-stop-steps">
          ${['s','t','o','p'].map((letter,i) => `
            <div class="anger-stop-step">
              <span class="anger-stop-letter">${letter.toUpperCase()}</span>
              <span class="anger-stop-text">${I18n.t('anger_stop_'+letter)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <h3>${I18n.t('anger_timeout_title')}</h3>
        <p class="muted" style="margin-bottom:10px; font-style:italic;">${I18n.t('anger_timeout_note')}</p>
        <ol class="anger-list">
          <li>${I18n.t('anger_timeout_1')}</li>
          <li>${I18n.t('anger_timeout_2')}</li>
          <li>${I18n.t('anger_timeout_3')}</li>
          <li>${I18n.t('anger_timeout_4')}</li>
        </ol>
      </div>

      ${card(I18n.t('anger_physical_title'), I18n.t('anger_physical_body'))}
      ${card(I18n.t('anger_journal_title'), I18n.t('anger_journal_body'))}
    `;
  }

  /* ── Log ─────────────────────────────────────────── */
  function renderLog(el, container){
    const log = getLog();
    el.innerHTML = `
      <div class="card">
        <h3>${I18n.t('anger_log_title')}</h3>
        <label class="field-label" for="angerTrigger">${I18n.t('anger_log_trigger')}</label>
        <textarea id="angerTrigger" rows="2"></textarea>
        <label class="field-label" for="angerIntSlider">${I18n.t('anger_log_intensity')}</label>
        <input type="range" id="angerIntSlider" min="1" max="10" value="5" class="mood-slider">
        <div class="mood-slider-labels"><span>1</span><span id="angerIntVal">5</span><span>10</span></div>
        <label class="field-label" for="angerResponse">${I18n.t('anger_log_response')}</label>
        <textarea id="angerResponse" rows="2"></textarea>
        <label class="field-label" for="angerOutcome">${I18n.t('anger_log_outcome')}</label>
        <textarea id="angerOutcome" rows="2"></textarea>
        <div class="form-actions">
          <button id="angerSaveBtn" class="btn-primary">${I18n.t('anger_log_save')}</button>
        </div>
      </div>

      <h3 style="margin-top:16px;">${I18n.t('anger_log_history')}</h3>
      ${log.length ? log.map(e => `
        <div class="cbt-record-card">
          <p class="cbt-record-date">${e.date} · ${I18n.t('anger_log_intensity')}: ${e.intensity}</p>
          ${e.trigger ? `<p class="cbt-record-thought"><strong>${I18n.t('anger_log_trigger').replace(':','')}</strong> ${esc(e.trigger)}</p>` : ''}
          ${e.outcome ? `<p class="cbt-record-balanced"><strong>${I18n.t('anger_log_outcome').replace('?','')}</strong> ${esc(e.outcome)}</p>` : ''}
        </div>
      `).join('') : `<p class="empty-state">${I18n.t('anger_log_empty')}</p>`}
    `;

    const intSlider = el.querySelector('#angerIntSlider');
    if(intSlider){
      intSlider.addEventListener('input', () => {
        const v = el.querySelector('#angerIntVal');
        if(v) v.textContent = intSlider.value;
      });
    }

    const saveBtn = el.querySelector('#angerSaveBtn');
    if(saveBtn){
      saveBtn.addEventListener('click', () => {
        const trigger  = el.querySelector('#angerTrigger')?.value.trim();
        const intensity= el.querySelector('#angerIntSlider')?.value;
        const response = el.querySelector('#angerResponse')?.value.trim();
        const outcome  = el.querySelector('#angerOutcome')?.value.trim();
        if(!trigger && !response) return;
        saveEntry({ trigger, intensity, response, outcome });
        renderTab(container);
        if(typeof window.MindoraShowToast === 'function') window.MindoraShowToast(I18n.t('toast_log_saved'));
      });
    }
  }

  function card(title, body){
    return `<div class="card" style="margin-bottom:10px;"><h3>${title}</h3><p class="muted" style="margin-top:6px; line-height:1.65;">${body}</p></div>`;
  }
  function esc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  return { render };
})();
