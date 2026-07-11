/* ====================================================
   MINDORA — cbt.js
   CBT Toolkit: thought records + cognitive distortions.
   Thought records are stored locally (localStorage).
   This is psychoeducational, not therapeutic treatment.
   ==================================================== */

const CBT = (function(){

  const STORE_KEY = 'mindora_cbt_records';

  const DISTORTIONS = [
    'all_or_nothing','catastrophizing','mind_reading','overgeneralization',
    'personalization','filtering','should','labelling'
  ];

  /* ── Storage ─────────────────────────────────────── */
  function getRecords(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY)||'[]'); }
    catch(e){ return []; }
  }
  function saveRecord(r){
    const list = getRecords();
    list.unshift({ ...r, id: 'cbt_'+Date.now(), date: Storage.todayStr() });
    // Keep last 20
    if(list.length > 20) list.length = 20;
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(list)); }catch(e){}
  }

  /* ── Render ──────────────────────────────────────── */
  function render(){
    const container = document.getElementById('cbtContent');
    if(!container) return;

    // Two sub-sections: Distortions list + Thought record
    container.innerHTML = `
      <div id="cbtTabs" class="range-tabs" style="margin-bottom:14px;">
        <button class="range-tab active" data-cbt="distortions">${I18n.t('cbt_distortions_title')}</button>
        <button class="range-tab" data-cbt="record">${I18n.t('cbt_thought_record_title')}</button>
      </div>
      <div id="cbtDistortions">${renderDistortions()}</div>
      <div id="cbtRecord" class="hidden">${renderThoughtRecordForm()}</div>
    `;

    container.querySelectorAll('[data-cbt]').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('[data-cbt]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const key = tab.getAttribute('data-cbt');
        document.getElementById('cbtDistortions').classList.toggle('hidden', key !== 'distortions');
        document.getElementById('cbtRecord').classList.toggle('hidden', key !== 'record');
      });
    });

    wireThoughtRecord(container);
  }

  function renderDistortions(){
    return `
      <p class="muted" style="margin-bottom:14px;">${I18n.t('cbt_distortions_desc')}</p>
      ${DISTORTIONS.map(key => `
        <details class="distortion-card">
          <summary class="distortion-summary">
            <span class="distortion-name">${I18n.t('distortion_'+key)}</span>
            <span class="distortion-chevron">+</span>
          </summary>
          <p class="distortion-body">${I18n.t('distortion_'+key+'_desc')}</p>
          <div class="distortion-example-box">
            <p class="distortion-example-label">Example of balanced thinking:</p>
            <p class="distortion-example">${getDistortionExample(key)}</p>
          </div>
        </details>
      `).join('')}
    `;
  }

  function getDistortionExample(key){
    const examples = {
      all_or_nothing: '"I made a mistake in this presentation" → "I made one error in an otherwise solid presentation."',
      catastrophizing: '"If I fail this exam, my whole future is ruined" → "Failing one exam would be disappointing, but it wouldn\'t define my entire future."',
      mind_reading: '"They must think I\'m stupid" → "I don\'t actually know what they\'re thinking. They could be distracted or having their own tough day."',
      overgeneralization: '"I always mess things up" → "I got this particular thing wrong. That doesn\'t mean I always fail."',
      personalization: '"The team project failed because of me" → "Multiple factors contributed. I can own my part without taking all the blame."',
      filtering: '"The whole day was terrible because of that one comment" → "One comment was hurtful, but several good things also happened today."',
      should: '"I should never feel anxious" → "Anxiety is a normal human experience. It\'s okay to have it and still manage well."',
      labelling: '"I\'m such a failure" → "I failed at something specific. One outcome doesn\'t define who I am as a person."',
    };
    return examples[key] || '';
  }

  function renderThoughtRecordForm(){
    const saved = getRecords();
    return `
      <p class="muted" style="margin-bottom:14px;">${I18n.t('cbt_thought_record_desc')}</p>
      <div class="cbt-form">
        <label class="field-label" for="cbtSituation">${I18n.t('cbt_situation_label')}</label>
        <textarea id="cbtSituation" rows="2"></textarea>
        <label class="field-label" for="cbtThought">${I18n.t('cbt_thought_label')}</label>
        <textarea id="cbtThought" rows="2"></textarea>
        <label class="field-label" for="cbtEmotion">${I18n.t('cbt_emotion_label')}</label>
        <input type="text" id="cbtEmotion" placeholder="e.g. Anxious (7/10)">
        <label class="field-label" for="cbtFor">${I18n.t('cbt_evidence_for')}</label>
        <textarea id="cbtFor" rows="2"></textarea>
        <label class="field-label" for="cbtAgainst">${I18n.t('cbt_evidence_against')}</label>
        <textarea id="cbtAgainst" rows="2"></textarea>
        <label class="field-label" for="cbtBalanced">${I18n.t('cbt_balanced')}</label>
        <textarea id="cbtBalanced" rows="2"></textarea>
        <div class="form-actions">
          <button class="btn-primary" id="cbtSaveBtn">${I18n.t('cbt_save_btn')}</button>
        </div>
      </div>
      <div class="cbt-records">
        <h3 style="margin-top:18px;">${I18n.t('cbt_saved_title')}</h3>
        ${saved.length ? saved.map(r => `
          <div class="cbt-record-card">
            <p class="cbt-record-date">${r.date}</p>
            <p class="cbt-record-thought"><strong>Thought:</strong> ${escHtml(r.thought||'')}</p>
            ${r.balanced ? `<p class="cbt-record-balanced"><strong>Reframe:</strong> ${escHtml(r.balanced)}</p>` : ''}
          </div>
        `).join('') : `<p class="empty-state">${I18n.t('cbt_no_records')}</p>`}
      </div>
    `;
  }

  function wireThoughtRecord(container){
    const btn = container.querySelector('#cbtSaveBtn');
    if(!btn) return;
    btn.addEventListener('click', () => {
      const record = {
        situation: document.getElementById('cbtSituation')?.value.trim(),
        thought:   document.getElementById('cbtThought')?.value.trim(),
        emotion:   document.getElementById('cbtEmotion')?.value.trim(),
        for:       document.getElementById('cbtFor')?.value.trim(),
        against:   document.getElementById('cbtAgainst')?.value.trim(),
        balanced:  document.getElementById('cbtBalanced')?.value.trim(),
      };
      if(!record.thought){ return; }
      saveRecord(record);
      // Refresh the form
      document.getElementById('cbtRecord').innerHTML = renderThoughtRecordForm();
      wireThoughtRecord(container);
      if(typeof window.MindoraShowToast === 'function') window.MindoraShowToast(I18n.t('toast_log_saved'));
    });
  }

  function escHtml(str){
    const d=document.createElement('div'); d.textContent=str; return d.innerHTML;
  }

  return { render };
})();
