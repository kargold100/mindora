/* ====================================================
   MINDORA — goals.js
   Simple, shame-free goal tracking. Four goal types:
     mood_avg       — average mood >= target over a rolling window
     checkin_streak — consecutive daily check-ins
     movement       — movement logs in a window
     mind           — mindfulness logs in a window

   Progress is calculated live from existing data — nothing is
   stored separately from the entries already in storage.
   Goals themselves sit in settings.goals (an array of objects).
   ==================================================== */

const Goals = (function(){

  const TYPES = ['mood_avg','checkin_streak','movement','mind'];

  function getGoals(){
    const s = Storage.getSettings();
    return Array.isArray(s.goals) ? s.goals : [];
  }

  function saveGoals(list){
    Storage.saveSettings({ goals: list });
  }

  function addGoal(type, target, window){
    const goals = getGoals();
    goals.push({
      id: 'g_' + Date.now(),
      type,
      target: Number(target),
      window: Number(window),
      createdAt: Storage.todayStr()
    });
    saveGoals(goals);
  }

  function removeGoal(id){
    saveGoals(getGoals().filter(g => g.id !== id));
  }

  // ----------------------------------------------------------------
  // Progress calculation
  // ----------------------------------------------------------------
  function calcProgress(goal){
    const w = goal.window || 30;
    const entries = Storage.getMoodEntriesInRange(w);
    const logs    = Storage.getLogsInRange(w);

    switch(goal.type){
      case 'mood_avg': {
        if(!entries.length) return { current:0, ratio:0, done:false };
        const avg = entries.reduce((a,e)=>a+e.mood,0)/entries.length;
        return {
          current: avg.toFixed(1),
          ratio: Math.min(1, avg / goal.target),
          done: avg >= goal.target,
          label: `${I18n.t('stat_avg')} ${avg.toFixed(1)} / ${goal.target}`
        };
      }
      case 'checkin_streak': {
        const state = Gamification.getState();
        const streak = state.checkinStreak || 0;
        return {
          current: streak,
          ratio: Math.min(1, streak / goal.target),
          done: streak >= goal.target,
          label: `${streak} / ${goal.target} ${I18n.t('goal_streak_label')}`
        };
      }
      case 'movement': {
        const count = logs.filter(l=>l.category==='physical').length;
        return {
          current: count,
          ratio: Math.min(1, count / goal.target),
          done: count >= goal.target,
          label: `${count} / ${goal.target} ${I18n.t('goal_count_label')}`
        };
      }
      case 'mind': {
        const count = logs.filter(l=>l.category==='mind').length;
        return {
          current: count,
          ratio: Math.min(1, count / goal.target),
          done: count >= goal.target,
          label: `${count} / ${goal.target} ${I18n.t('goal_count_label')}`
        };
      }
      default:
        return { current:0, ratio:0, done:false, label:'' };
    }
  }

  function goalTitle(goal){
    const t = goal.target, w = goal.window;
    const tpl = I18n.t('goal_type_'+goal.type);
    return tpl.replace('{target}', t).replace('{window}', w);
  }

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  function render(){
    const container = document.getElementById('goalsList');
    if(!container) return;

    const goals = getGoals();
    if(!goals.length){
      container.innerHTML = `<p class="empty-state">${I18n.t('goals_empty')}</p>`;
    } else {
      container.innerHTML = goals.map(g => {
        const prog = calcProgress(g);
        const pct  = Math.round(prog.ratio * 100);
        const done = prog.done;
        return `
          <div class="goal-card ${done ? 'done' : ''}">
            <div class="goal-header">
              <span class="goal-name">${escapeHtml(goalTitle(g))}</span>
              <span class="goal-status-badge ${done ? 'done' : 'active'}">${done ? I18n.t('goals_done_label') : I18n.t('goals_active_label')}</span>
            </div>
            <p class="goal-desc">${prog.label || ''}</p>
            <div class="goal-progress-wrap">
              <div class="goal-progress-bar-bg">
                <div class="goal-progress-bar-fill ${done ? 'done' : ''}" style="width:${pct}%"></div>
              </div>
              <span class="goal-pct">${pct}%</span>
            </div>
            <button class="goal-remove-btn link-btn" data-goal-id="${g.id}" data-i18n="admin_remove">Remove</button>
          </div>
        `;
      }).join('');

      container.querySelectorAll('[data-goal-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-goal-id');
          const ok = await Modal.confirmDialog({
            title: I18n.t('goals_nav_title'),
            body: I18n.t('goal_remove_confirm'),
            confirmText: I18n.t('admin_remove'),
            cancelText: I18n.t('btn_cancel'),
            danger: true
          });
          if(!ok) return;
          removeGoal(id);
          render();
        });
      });
    }

    renderAddForm();
    renderTodaySummary();
  }

  function renderAddForm(){
    const typeSelect   = document.getElementById('goalTypeSelect');
    const targetInput  = document.getElementById('goalTargetInput');
    const windowInput  = document.getElementById('goalWindowInput');
    if(!typeSelect) return;

    if(!typeSelect.children.length){
      TYPES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        // placeholder label without template variables
        const base = t.replace('_',' ');
        opt.textContent = base.charAt(0).toUpperCase() + base.slice(1);
        typeSelect.appendChild(opt);
      });
    }

    // Update the preview label when type changes
    const updatePreview = () => {
      const t = typeSelect.value;
      const targ = targetInput.value || '?';
      const win  = windowInput.value || '?';
      const preview = document.getElementById('goalPreviewLabel');
      if(preview){
        const tpl = I18n.t('goal_type_'+t);
        preview.textContent = tpl.replace('{target}', targ).replace('{window}', win);
      }
    };
    typeSelect.addEventListener('change', updatePreview);
    targetInput.addEventListener('input', updatePreview);
    windowInput.addEventListener('input', updatePreview);
    updatePreview();
  }

  function renderTodaySummary(){
    const container = document.getElementById('todayGoalsSummary');
    if(!container) return;
    const goals = getGoals();
    if(!goals.length){ container.innerHTML = ''; return; }

    container.innerHTML = goals.map(g => {
      const prog = calcProgress(g);
      const pct  = Math.round(prog.ratio * 100);
      return `
        <div class="today-goal-chip ${prog.done ? 'done' : ''}">
          <span class="today-goal-label">${escapeHtml(goalTitle(g))}</span>
          <div class="today-goal-bar-bg"><div class="today-goal-bar-fill" style="width:${pct}%"></div></div>
          <span class="today-goal-pct">${pct}%</span>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return { render, addGoal, removeGoal, calcProgress, renderTodaySummary };
})();
