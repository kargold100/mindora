/* ====================================================
   MINDORA — habits.js
   Custom habit tracker: create habits, mark daily/weekly
   completions, track streaks and this-week counts.
   Habits live in settings.habits (array of habit objects).
   Completions are stored as logs with category='habit'
   and type=habit.id, so they feed naturally into the
   Trends comparison insight.
   ==================================================== */

const Habits = (function(){

  const DAILY_GOAL_WATER  = 8;   // glasses
  const WEEKLY_GOAL_MOVE  = 5;   // sessions

  function getHabits(){
    const s = Storage.getSettings();
    return Array.isArray(s.habits) ? s.habits : [];
  }

  function saveHabits(list){
    Storage.saveSettings({ habits: list });
  }

  function addHabit(name, frequency){
    name = (name || '').trim();
    if(!name) throw new Error('NAME_REQUIRED');
    const list = getHabits();
    const id = 'h_' + Date.now();
    list.push({ id, name, frequency: frequency || 'daily', createdAt: Storage.todayStr() });
    saveHabits(list);
    return id;
  }

  function removeHabit(id){
    saveHabits(getHabits().filter(h => h.id !== id));
  }

  // ── Completion queries ────────────────────────────

  function getCompletionLogs(){
    return Storage.getLogs().filter(l => l.category === 'habit');
  }

  function isCompletedToday(habitId){
    const today = Storage.todayStr();
    return getCompletionLogs().some(l => l.type === habitId && l.date === today);
  }

  async function toggleCompletion(habitId){
    const today = Storage.todayStr();
    const existing = getCompletionLogs().find(l => l.type === habitId && l.date === today);
    if(existing){
      Storage.deleteLog(existing.id);
    } else {
      await Storage.saveLog({
        category: 'habit', type: habitId,
        date: today, duration: 0, intensity: null, notes: ''
      });
    }
  }

  // Streak = consecutive days with a completion up to today
  function getStreak(habitId){
    const logs = getCompletionLogs().filter(l => l.type === habitId);
    const datesSet = new Set(logs.map(l => l.date));
    let streak = 0;
    let d = new Date();
    while(true){
      const dateStr = d.toISOString().slice(0,10);
      if(datesSet.has(dateStr)){
        streak++;
        d.setDate(d.getDate()-1);
      } else break;
    }
    return streak;
  }

  // Completions this calendar week (Mon-Sun)
  function getThisWeekCount(habitId){
    const logs = getCompletionLogs().filter(l => l.type === habitId);
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // 0=Mon
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dow);
    const startStr = weekStart.toISOString().slice(0,10);
    return logs.filter(l => l.date >= startStr).length;
  }

  // Completion % over the last 30 days
  function getCompletionPct(habit){
    const logs = getCompletionLogs().filter(l => l.type === habit.id);
    const cutoff = Storage.dateStrDaysAgo(29);
    const inRange = logs.filter(l => l.date >= cutoff).length;
    const divisor = habit.frequency === 'weekly' ? 4 : 30;
    return Math.min(100, Math.round((inRange / divisor) * 100));
  }

  // ── Wellness score inputs ─────────────────────────

  function getHabitScore(){
    const habits = getHabits();
    if(!habits.length) return null;
    const completed = habits.filter(h =>
      h.frequency === 'weekly'
        ? getThisWeekCount(h.id) >= 1
        : isCompletedToday(h.id)
    ).length;
    return Math.round((completed / habits.length) * 100);
  }

  // ── Render ────────────────────────────────────────

  function render(){
    renderHabitList();
    renderAddForm();
  }

  function renderHabitList(){
    const container = document.getElementById('habitsList');
    if(!container) return;
    const habits = getHabits();
    if(!habits.length){
      container.innerHTML = `<p class="empty-state">${I18n.t('habits_empty')}</p>`;
      return;
    }
    container.innerHTML = habits.map(h => {
      const done    = isCompletedToday(h.id);
      const streak  = getStreak(h.id);
      const weekCnt = getThisWeekCount(h.id);
      const pct     = getCompletionPct(h);
      return `
        <div class="habit-card ${done ? 'done' : ''}">
          <div class="habit-main">
            <span class="habit-name">${escHtml(h.name)}</span>
            <span class="habit-freq">${I18n.t('habit_' + h.frequency)}</span>
          </div>
          <div class="habit-stats">
            <span class="habit-streak"><strong>${streak}</strong> ${I18n.t('habit_streak_label')}</span>
            <span class="habit-week">${I18n.t('habit_this_week')}: <strong>${weekCnt}</strong></span>
            <span class="habit-pct">${pct}%</span>
          </div>
          <div class="habit-bar-bg"><div class="habit-bar-fill" style="width:${pct}%"></div></div>
          <div class="habit-actions">
            <button class="habit-toggle-btn ${done ? 'done' : ''}" data-habit-id="${h.id}">
              ${done ? I18n.t('habit_done_label') : I18n.t('mark_habit_done')}
            </button>
            <button class="habit-remove-btn link-btn" data-habit-remove="${h.id}" aria-label="Remove">✕</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-habit-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await toggleCompletion(btn.getAttribute('data-habit-id'));
        render();
        if(typeof window.MindoraShowToast === 'function'){
          window.MindoraShowToast(I18n.t('toast_log_saved'));
        }
        // Refresh today screen progress/score
        if(typeof window.MindoraRefreshToday === 'function') window.MindoraRefreshToday();
      });
    });

    container.querySelectorAll('[data-habit-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id   = btn.getAttribute('data-habit-remove');
        const habit = habits.find(h => h.id === id);
        const ok = await Modal.confirmDialog({
          title: I18n.t('habits_title'),
          body: I18n.t('habits_remove_confirm', { name: habit ? habit.name : '' }),
          confirmText: I18n.t('admin_remove'),
          cancelText: I18n.t('btn_cancel'),
          danger: true
        });
        if(!ok) return;
        removeHabit(id);
        render();
      });
    });
  }

  function renderAddForm(){
    const typeSelect = document.getElementById('habitFreqSelect');
    if(typeSelect && !typeSelect.options.length){
      ['daily','weekly'].forEach(f => {
        const opt = document.createElement('option');
        opt.value = f; opt.textContent = I18n.t('habit_' + f);
        typeSelect.appendChild(opt);
      });
    }
  }

  // Compact strip for the Today screen
  function renderTodaySummary(){
    const container = document.getElementById('habitsToday');
    if(!container) return;
    const habits = getHabits();
    if(!habits.length){ container.innerHTML = ''; return; }

    container.innerHTML = habits.map(h => {
      const done = isCompletedToday(h.id);
      return `
        <button class="habit-quick-btn ${done ? 'done' : ''}" data-quick-habit="${h.id}">
          ${done ? '✓ ' : ''}${escHtml(h.name)}
        </button>
      `;
    }).join('');

    container.querySelectorAll('[data-quick-habit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await toggleCompletion(btn.getAttribute('data-quick-habit'));
        renderTodaySummary();
        if(typeof window.MindoraRefreshToday === 'function') window.MindoraRefreshToday();
      });
    });
  }

  function escHtml(str){
    const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
  }

  return {
    addHabit, removeHabit, toggleCompletion, getHabits,
    getStreak, getThisWeekCount, getCompletionPct, getHabitScore,
    isCompletedToday, render, renderTodaySummary
  };
})();
