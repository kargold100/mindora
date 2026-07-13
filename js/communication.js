/* ====================================================
   MINDORA — communication.js
   Effective Communication Under Stress module.
   Three sections: Patterns | Skills | Scripts
   The I-statement builder generates a copyable statement.
   ==================================================== */

const Communication = (function(){

  let activeTab = 'patterns';

  const PATTERNS = ['criticism','contempt','defensiveness','stonewall'];

  /* ── Main render ─────────────────────────────────── */
  function render(){
    const container = document.getElementById('communicationContent');
    if(!container) return;

    container.innerHTML = `
      <p class="muted" style="margin-bottom:12px;">${I18n.t('comm_subtitle')}</p>
      <div class="range-tabs" id="commSubTabs" role="group">
        <button class="range-tab ${activeTab==='patterns'?'active':''}" data-comm-tab="patterns">${I18n.t('comm_tab_patterns')}</button>
        <button class="range-tab ${activeTab==='tools'?'active':''}" data-comm-tab="tools">${I18n.t('comm_tab_tools')}</button>
        <button class="range-tab ${activeTab==='scripts'?'active':''}" data-comm-tab="scripts">${I18n.t('comm_tab_scripts')}</button>
      </div>
      <div id="commPatterns" class="${activeTab!=='patterns'?'hidden':''}"></div>
      <div id="commTools" class="${activeTab!=='tools'?'hidden':''}"></div>
      <div id="commScripts" class="${activeTab!=='scripts'?'hidden':''}"></div>
    `;

    container.querySelectorAll('[data-comm-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-comm-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.getAttribute('data-comm-tab');
        renderTab(container);
      });
    });

    renderTab(container);
  }

  function renderTab(container){
    const p = document.getElementById('commPatterns');
    const t = document.getElementById('commTools');
    const s = document.getElementById('commScripts');
    if(!p||!t||!s) return;
    p.classList.toggle('hidden', activeTab !== 'patterns');
    t.classList.toggle('hidden', activeTab !== 'tools');
    s.classList.toggle('hidden', activeTab !== 'scripts');
    if(activeTab === 'patterns') renderPatterns(p);
    if(activeTab === 'tools')    renderTools(t, container);
    if(activeTab === 'scripts')  renderScripts(s);
  }

  /* ── Patterns tab ────────────────────────────────── */
  function renderPatterns(el){
    el.innerHTML = `
      <div class="card" style="margin-bottom:12px;">
        <p class="muted">${I18n.t('comm_patterns_intro')}</p>
      </div>
      ${PATTERNS.map(key => `
        <details class="distortion-card" style="margin-bottom:8px;">
          <summary class="distortion-summary">
            <span class="distortion-name">${I18n.t('comm_'+key+'_title')}</span>
            <span class="distortion-chevron">+</span>
          </summary>
          <p class="distortion-body">${I18n.t('comm_'+key+'_desc')}</p>
        </details>
      `).join('')}

      <div class="card" style="margin-top:14px;">
        <h3>${I18n.t('comm_flooding_title')}</h3>
        <p class="muted" style="margin-top:6px; line-height:1.65;">${I18n.t('comm_flooding_body')}</p>
      </div>
    `;
  }

  /* ── Skills tab ──────────────────────────────────── */
  function renderTools(el, container){
    el.innerHTML = `
      <!-- I-statement builder -->
      <div class="card" style="margin-bottom:12px;">
        <h3>${I18n.t('comm_istatement_title')}</h3>
        <p class="muted" style="margin-bottom:8px;">${I18n.t('comm_istatement_desc')}</p>
        <p class="comm-template-label">${I18n.t('comm_istatement_template')}</p>
        <p class="muted comm-example" style="font-style:italic; font-size:.84rem; margin-bottom:14px;">${I18n.t('comm_istatement_eg')}</p>

        <p class="field-label" style="margin-bottom:4px;">${I18n.t('comm_istatement_try')}</p>
        <label class="field-label" for="isFeel">${I18n.t('comm_istatement_feel')}</label>
        <input type="text" id="isFeel" placeholder="e.g. anxious, hurt, frustrated…">
        <label class="field-label" for="isWhen">${I18n.t('comm_istatement_when')}</label>
        <input type="text" id="isWhen" placeholder="e.g. plans change without warning…">
        <label class="field-label" for="isBecause">${I18n.t('comm_istatement_because')}</label>
        <input type="text" id="isBecause" placeholder="e.g. unexpected changes are hard for me…">
        <label class="field-label" for="isNeed">${I18n.t('comm_istatement_need')}</label>
        <input type="text" id="isNeed" placeholder="e.g. a heads-up when possible…">
        <div id="isOutput" class="comm-is-output hidden" style="margin-top:12px;"></div>
        <div class="form-actions" style="margin-top:10px;">
          <button id="isBuildBtn" class="btn-secondary">${I18n.t('comm_istatement_try')}</button>
          <button id="isCopyBtn" class="btn-primary hidden">${I18n.t('comm_istatement_copy')}</button>
        </div>
      </div>

      <!-- Active listening -->
      <div class="card" style="margin-bottom:12px;">
        <h3>${I18n.t('comm_listen_title')}</h3>
        <p class="muted" style="margin-bottom:10px;">${I18n.t('comm_listen_intro')}</p>
        <ol class="anger-list">
          ${[1,2,3,4,5,6].map(i => `<li>${I18n.t('comm_listen_'+i)}</li>`).join('')}
        </ol>
      </div>

      <!-- Communication time-out -->
      <div class="card" style="margin-bottom:12px;">
        <h3>${I18n.t('comm_timeout_title')}</h3>
        <p class="muted" style="margin-bottom:10px; font-style:italic;">${I18n.t('comm_timeout_desc')}</p>
        <ol class="anger-list">
          ${[1,2,3,4].map(i => `<li>${I18n.t('comm_timeout_'+i)}</li>`).join('')}
        </ol>
      </div>

      <!-- DEAR -->
      <div class="card">
        <h3>${I18n.t('comm_dear_title')}</h3>
        <p class="muted" style="margin-bottom:10px;">${I18n.t('comm_dear_desc')}</p>
        <div class="anger-stop-steps">
          ${['d','e','a','r'].map(letter => `
            <div class="anger-stop-step">
              <span class="anger-stop-letter">${letter.toUpperCase()}</span>
              <span class="anger-stop-text">${I18n.t('comm_dear_'+letter)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Wire I-statement builder
    const build  = el.querySelector('#isBuildBtn');
    const copy   = el.querySelector('#isCopyBtn');
    const output = el.querySelector('#isOutput');

    if(build && output){
      build.addEventListener('click', () => {
        const feel    = el.querySelector('#isFeel')?.value.trim() || '___';
        const when    = el.querySelector('#isWhen')?.value.trim() || '___';
        const because = el.querySelector('#isBecause')?.value.trim() || '___';
        const need    = el.querySelector('#isNeed')?.value.trim() || '___';
        const stmt    = `I feel ${feel} when ${when} because ${because}. What I need is ${need}.`;
        output.textContent = stmt;
        output.classList.remove('hidden');
        if(copy) copy.classList.remove('hidden');
        output._statement = stmt;
      });
    }

    if(copy && output){
      copy.addEventListener('click', () => {
        try{ navigator.clipboard.writeText(output._statement || output.textContent); }catch(e){}
        copy.textContent = '✓ Copied';
        setTimeout(() => { copy.textContent = I18n.t('comm_istatement_copy'); }, 2000);
      });
    }
  }

  /* ── Scripts tab ─────────────────────────────────── */
  function renderScripts(el){
    const scripts = [1,2,3,4,5];
    el.innerHTML = `
      <p class="muted" style="margin-bottom:12px;">These are starting points — adapt them to sound like you.</p>
      ${scripts.map(n => `
        <div class="comm-script-card card">
          <h3 class="comm-script-title">${I18n.t('comm_script_'+n+'_title')}</h3>
          <p class="comm-script-text">${I18n.t('comm_script_'+n)}</p>
          <button class="comm-copy-btn" data-script="${n}" title="Copy">📋 Copy</button>
        </div>
      `).join('')}
    `;

    el.querySelectorAll('.comm-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const n    = btn.getAttribute('data-script');
        const text = I18n.t('comm_script_'+n);
        try{ navigator.clipboard.writeText(text.replace(/^"|"$/g,'')); }catch(e){}
        btn.textContent = '✓ Copied';
        setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
      });
    });
  }

  return { render };
})();
