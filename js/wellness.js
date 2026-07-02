/* ====================================================
   MINDORA — wellness.js
   Calculates today's Mental, Physical, Habit, and Overall
   wellness scores (0–100) from the day's check-in data.
   All logic is visible here — no hidden weighting.

   Mental score  (45 pts mood + 25 pts stress + 20 pts gratitude + 10 pts energy)
   Physical score(35 pts sleep + 30 pts water + 20 pts food + 15 pts movement)
   Habit score   (habit completion %, 0-100)
   Overall       (weighted avg: mental 40% + physical 35% + habit 25%)
   ==================================================== */

const Wellness = (function(){

  function calcScores(){
    const today     = Storage.getTodayEntry();
    const logs      = Storage.getLogsInRange(1); // today only
    const habitScore = Habits.getHabitScore();   // null if no habits

    // ── Mental (0–100) ──────────────────────────────
    let mental = null;
    if(today){
      const mood    = today.mood || 5;         // 1-10
      const stress  = today.stressLevel || 5; // 1-10, lower=better
      const energy  = today.energy;
      const hasGrat = today.gratitude &&
        today.gratitude.some(g => g && g.trim().length > 0);

      const moodPts    = (mood / 10) * 45;
      const stressPts  = ((10 - stress) / 9) * 25;
      const gratPts    = hasGrat ? 20 : 0;
      const energyPts  = energy !== null && energy !== undefined
        ? (energy / 10) * 10 : 5;

      mental = Math.min(100, Math.round(moodPts + stressPts + gratPts + energyPts));
    }

    // ── Physical (0–100) ────────────────────────────
    let physical = null;
    if(today){
      const sleep  = today.sleepHours;
      const water  = today.water;
      const food   = today.food;
      const hasMov = logs.some(l => l.category === 'physical');

      // Sleep: 7-9h = 35pts, tapers off
      let sleepPts = 0;
      if(sleep !== null && sleep !== undefined && sleep !== ''){
        const s = Number(sleep);
        if(s >= 7 && s <= 9)      sleepPts = 35;
        else if(s >= 6 && s < 7)  sleepPts = 28;
        else if(s > 9 && s <= 10) sleepPts = 28;
        else if(s >= 5 && s < 6)  sleepPts = 18;
        else if(s > 10)            sleepPts = 18;
        else                       sleepPts = 8;
      } else { sleepPts = 17; } // unknown → mid

      // Water: 0-30 pts, 8 glasses = full
      let waterPts = 0;
      if(water !== null && water !== undefined && water !== ''){
        waterPts = Math.min(30, Math.round((Number(water) / 8) * 30));
      } else { waterPts = 15; }

      // Food: healthy=20, average=10, poor=2, skipped=0, unknown=10
      const foodMap = { healthy:20, average:10, poor:2, skipped:0 };
      const foodPts = food ? (foodMap[food] ?? 10) : 10;

      const movPts = hasMov ? 15 : 0;

      physical = Math.min(100, Math.round(sleepPts + waterPts + foodPts + movPts));
    }

    // ── Habit (0–100) ───────────────────────────────
    // From habits.js — null if no habits defined

    // ── Overall (0–100) ─────────────────────────────
    let overall = null;
    const parts = [];
    if(mental   !== null) parts.push({ v: mental,     w: 0.40 });
    if(physical !== null) parts.push({ v: physical,   w: 0.35 });
    if(habitScore!==null) parts.push({ v: habitScore, w: 0.25 });

    if(parts.length){
      // Redistribute weights if some sections are missing
      const totalW = parts.reduce((s,p) => s + p.w, 0);
      const weighted = parts.reduce((s,p) => s + p.v * (p.w / totalW), 0);
      overall = Math.round(weighted);
    }

    return { mental, physical, habit: habitScore, overall };
  }

  function scoreLabel(score){
    if(score === null) return '—';
    if(score >= 80) return I18n.t('score_great');
    if(score >= 60) return I18n.t('score_good');
    if(score >= 40) return I18n.t('score_okay');
    return I18n.t('score_low');
  }

  function scoreColor(score){
    if(score === null) return 'var(--text-faint)';
    if(score >= 80) return 'var(--moss)';
    if(score >= 60) return 'var(--dusk)';
    if(score >= 40) return 'var(--bloom)';
    return 'var(--bloom-dim)';
  }

  function render(){
    const container = document.getElementById('wellnessScoreCard');
    if(!container) return;

    const today = Storage.getTodayEntry();
    if(!today){
      container.classList.add('hidden'); return;
    }
    container.classList.remove('hidden');

    const scores = calcScores();

    const items = [
      { label: I18n.t('mental_score_label'),   val: scores.mental },
      { label: I18n.t('physical_score_label'), val: scores.physical },
      { label: I18n.t('habit_score_label'),    val: scores.habit }
    ].filter(i => i.val !== null);

    const overallHtml = scores.overall !== null ? `
      <div class="wellness-overall">
        <span class="wellness-overall-num" style="color:${scoreColor(scores.overall)}">${scores.overall}</span>
        <span class="wellness-overall-label">${I18n.t('overall_score_label')} — ${scoreLabel(scores.overall)}</span>
      </div>` : '';

    container.innerHTML = `
      <div class="card-head">
        <h3 data-i18n="wellness_score_title">${I18n.t('wellness_score_title')}</h3>
      </div>
      ${overallHtml}
      <div class="wellness-grid">
        ${items.map(i => `
          <div class="wellness-item">
            <span class="wellness-val" style="color:${scoreColor(i.val)}">${i.val}</span>
            <span class="wellness-bar-bg"><span class="wellness-bar-fill" style="width:${i.val}%; background:${scoreColor(i.val)};"></span></span>
            <span class="wellness-item-label">${i.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  return { calcScores, scoreLabel, scoreColor, render };
})();
