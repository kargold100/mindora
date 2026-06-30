/* ====================================================
   MINDORA — tracker.js
   Movement + mind exercise logging, streaks, activity feed, and
   a simple Medications & Supplements tracker (a lighter version
   of the "treatment tracking" idea: just whether something was
   taken on a given day, fed into the Trends comparison insight).
   Activity types are stored as canonical English keys and
   displayed via I18n.t('act_' + key) — medication names are
   free text the person typed, so those are shown as-is, never
   run through the translation lookup.
   ==================================================== */

const Tracker = (function(){

  const TYPES = {
    physical: ['walk','run','cycle','strength','yoga','swim','sport','stretching','other'],
    mind: ['breathing','meditation','journaling','gratitude','therapy','reading','other']
  };

  let currentCategory = 'physical';

  function openLogForm(category){
    currentCategory = category;
    document.getElementById('logScreenTitle').textContent = category === 'physical' ? I18n.t('log_title_movement') : I18n.t('log_title_mind');
    const select = document.getElementById('logType');
    select.innerHTML = '';
    TYPES[category].forEach(key => {
      const opt = document.createElement('option');
      opt.value = key; opt.textContent = I18n.t('act_' + key);
      select.appendChild(opt);
    });
    document.getElementById('logDuration').value = 20;
    document.getElementById('logIntensity').value = 3;
    document.getElementById('intensityValueLabel').textContent = 3;
    document.getElementById('logNotes').value = '';
    document.getElementById('intensityWrap').classList.toggle('hidden', category !== 'physical');
  }

  async function saveFromForm(){
    const record = await Storage.saveLog({
      category: currentCategory,
      type: document.getElementById('logType').value,
      duration: document.getElementById('logDuration').value,
      intensity: currentCategory === 'physical' ? document.getElementById('logIntensity').value : null,
      notes: document.getElementById('logNotes').value
    });
    return record;
  }

  function weekCount(category){
    return Storage.getLogsInRange(7).filter(l => l.category === category).length;
  }

  function renderTrackerScreen(){
    const state = Gamification.getState();
    document.getElementById('moveStreakNum').textContent = state.moveStreak || 0;
    document.getElementById('mindStreakNum').textContent = state.mindStreak || 0;
    document.getElementById('moveWeekNum').textContent = weekCount('physical');
    document.getElementById('mindWeekNum').textContent = weekCount('mind');
    renderActivityLog();
    renderMedicationsList();
  }

  function activityIcon(category){
    if(category === 'physical') return '\u25C6';
    if(category === 'medication') return '\u25C7';
    return '\u25CB';
  }

  function activityTitle(l){
    // Medication "types" are free text the person typed in (a medication or
    // supplement name), never a canonical key — never run those through
    // I18n.t, or a name like "Aspirin" would print as the literal string
    // "act_Aspirin" since that key doesn't exist in any language pack.
    return l.category === 'medication' ? l.type : I18n.t('act_' + l.type);
  }

  function activityMeta(l){
    if(l.category === 'medication'){
      return formatDate(l.date);
    }
    return `${formatDate(l.date)} · ${l.duration} min${l.intensity ? ` · ${I18n.t('field_intensity')} ${l.intensity}/5` : ''}`;
  }

  function renderActivityLog(){
    const container = document.getElementById('activityLog');
    const logs = Storage.getRecentLogs(15).filter(l => l.category !== 'medication');
    if(!logs.length){
      container.innerHTML = `<div class="empty-state">${I18n.t('no_activity')}</div>`;
      return;
    }
    container.innerHTML = logs.map(l => `
        <div class="activity-row">
          <div class="activity-icon ${l.category}">${activityIcon(l.category)}</div>
          <div class="activity-main">
            <div class="activity-title">${escapeHtml(activityTitle(l))}</div>
            <div class="activity-meta">${activityMeta(l)}</div>
          </div>
          <button class="activity-del" data-del-log="${l.id}" aria-label="${escapeHtml(I18n.t('delete_label'))}">✕</button>
        </div>
      `).join('');

    container.querySelectorAll('[data-del-log]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.deleteLog(btn.getAttribute('data-del-log'));
        renderActivityLog();
        renderTrackerScreen();
        if(typeof window.MindoraShowToast === 'function') window.MindoraShowToast(I18n.t('toast_log_deleted'));
      });
    });
  }

  // ---------- Medications & Supplements ----------
  // The personal list of names lives in settings (settings.medications,
  // an array of strings); each "taken today" tap writes/removes a normal
  // log row with category 'medication' and type = that name. No dosage or
  // schedule data is modeled — see the disclaimer text in the UI.

  function getMedicationNames(){
    const settings = Storage.getSettings();
    return Array.isArray(settings.medications) ? settings.medications : [];
  }

  function addMedicationName(name){
    name = (name || '').trim();
    if(!name) return;
    const list = getMedicationNames();
    if(list.some(n => n.toLowerCase() === name.toLowerCase())) return;
    Storage.saveSettings({ medications: list.concat([name]) });
  }

  function removeMedicationName(name){
    const list = getMedicationNames().filter(n => n !== name);
    Storage.saveSettings({ medications: list });
  }

  function findTodayMedicationLog(name){
    const today = Storage.todayStr();
    return Storage.getLogs().find(l => l.category === 'medication' && l.type === name && l.date === today) || null;
  }

  async function toggleMedicationTaken(name){
    const existing = findTodayMedicationLog(name);
    if(existing){
      Storage.deleteLog(existing.id);
    } else {
      await Storage.saveLog({ category: 'medication', type: name, date: Storage.todayStr(), duration: 0, intensity: null, notes: '' });
    }
  }

  function renderMedicationsList(){
    const container = document.getElementById('medicationsList');
    if(!container) return;
    const names = getMedicationNames();
    if(!names.length){
      container.innerHTML = `<div class="empty-state">${I18n.t('medications_empty')}</div>`;
      return;
    }
    container.innerHTML = names.map(name => {
      const taken = !!findTodayMedicationLog(name);
      return `
        <div class="activity-row">
          <div class="activity-icon medication">${activityIcon('medication')}</div>
          <div class="activity-main">
            <div class="activity-title">${escapeHtml(name)}</div>
          </div>
          <button class="btn-secondary medication-toggle-btn ${taken ? 'taken' : ''}" data-med-toggle="${escapeHtml(name)}">${taken ? I18n.t('medications_taken_today') : I18n.t('medications_mark_taken')}</button>
          <button class="activity-del" data-med-remove="${escapeHtml(name)}" aria-label="${escapeHtml(I18n.t('delete_label'))}">✕</button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-med-toggle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await toggleMedicationTaken(btn.getAttribute('data-med-toggle'));
        renderMedicationsList();
      });
    });

    container.querySelectorAll('[data-med-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.getAttribute('data-med-remove');
        const ok = await Modal.confirmDialog({
          title: I18n.t('medications_title'),
          body: I18n.t('medications_remove_confirm', { name }),
          confirmText: I18n.t('admin_remove'),
          cancelText: I18n.t('btn_cancel'),
          danger: true
        });
        if(!ok) return;
        removeMedicationName(name);
        renderMedicationsList();
      });
    });
  }

  function formatDate(dateStr){
    const d = new Date(dateStr + 'T00:00:00');
    const today = Storage.todayStr();
    const yest = Storage.dateStrDaysAgo(1);
    if(dateStr === today) return I18n.t('today_label');
    if(dateStr === yest) return I18n.t('yesterday_label');
    return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    TYPES, openLogForm, saveFromForm, renderTrackerScreen, renderActivityLog,
    addMedicationName, renderMedicationsList
  };
})();
