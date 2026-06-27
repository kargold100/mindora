/* ====================================================
   MINDORA — tracker.js
   Movement + mind exercise logging, streaks, activity feed.
   Activity types are stored as canonical English keys and
   displayed via I18n.t('act_' + key).
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
  }

  function renderActivityLog(){
    const container = document.getElementById('activityLog');
    const logs = Storage.getRecentLogs(15);
    if(!logs.length){
      container.innerHTML = `<div class="empty-state">${I18n.t('no_activity')}</div>`;
      return;
    }
    container.innerHTML = logs.map(l => {
      const icon = l.category === 'physical' ? '◆' : '○';
      const meta = `${formatDate(l.date)} · ${l.duration} min${l.intensity ? ` · ${I18n.t('field_intensity')} ${l.intensity}/5` : ''}`;
      return `
        <div class="activity-row">
          <div class="activity-icon ${l.category}">${icon}</div>
          <div class="activity-main">
            <div class="activity-title">${escapeHtml(I18n.t('act_' + l.type))}</div>
            <div class="activity-meta">${meta}</div>
          </div>
          <button class="activity-del" data-del-log="${l.id}" aria-label="${escapeHtml(I18n.t('delete_label'))}">✕</button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-del-log]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.deleteLog(btn.getAttribute('data-del-log'));
        renderActivityLog();
        renderTrackerScreen();
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

  return { TYPES, openLogForm, saveFromForm, renderTrackerScreen, renderActivityLog };
})();
