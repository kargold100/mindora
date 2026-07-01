/* ====================================================
   MINDORA — trends.js  (v2)
   Period navigation: prev/next for week, month, 3-month,
   or all-time ranges. Each section is error-isolated, so
   a crash in one doesn't blank the rest of the screen.
   New: mood distribution bar chart below the snapshot stats.
   ==================================================== */

const Trends = (function(){

  let currentRange  = 7;    // days; 0 = all-time
  let periodOffset  = 0;    // 0 = current period, -1 = one period back, etc.

  function setRange(days){
    currentRange  = days;
    periodOffset  = 0;
    updatePeriodNav();
    renderAll();
  }

  function navigate(direction){
    // Block forward past the current period
    if(direction > 0 && periodOffset >= 0) return;
    if(currentRange === 0) return; // all-time has no navigation
    periodOffset = Math.min(0, periodOffset + direction);
    updatePeriodNav();
    renderAll();
  }

  function getPeriodBounds(){
    if(currentRange === 0){
      const entries = Storage.getMoodEntries();
      if(!entries.length) return { start: Storage.todayStr(), end: Storage.todayStr() };
      const sorted = entries.map(e=>e.date).sort();
      return { start: sorted[0], end: sorted[sorted.length-1] };
    }
    // periodOffset is a negative integer: 0 = latest, -1 = one period back
    const periodLengthDays = currentRange;
    const endDaysAgo  = Math.abs(periodOffset) * periodLengthDays;
    const startDaysAgo = endDaysAgo + periodLengthDays - 1;
    const end   = Storage.dateStrDaysAgo(endDaysAgo);
    const start = Storage.dateStrDaysAgo(startDaysAgo);
    return { start, end };
  }

  function getEntriesForPeriod(){
    const { start, end } = getPeriodBounds();
    return Storage.getMoodEntries().filter(e => e.date >= start && e.date <= end)
                                   .sort((a,b) => a.date.localeCompare(b.date));
  }

  function getLogsForPeriod(){
    const { start, end } = getPeriodBounds();
    return Storage.getLogs().filter(l => l.date >= start && l.date <= end);
  }

  function updatePeriodNav(){
    const prevBtn  = document.getElementById('trendsPrevBtn');
    const nextBtn  = document.getElementById('trendsNextBtn');
    const label    = document.getElementById('trendsPeriodLabel');
    if(!prevBtn || !nextBtn || !label) return;

    nextBtn.disabled = (periodOffset >= 0 || currentRange === 0);

    if(currentRange === 0){
      label.textContent = I18n.t('range_all') || 'All time';
      prevBtn.style.visibility = 'hidden';
      nextBtn.style.visibility = 'hidden';
      return;
    }

    prevBtn.style.visibility = 'visible';
    nextBtn.style.visibility = 'visible';

    const { start, end } = getPeriodBounds();
    const fmt = (d) => {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString(undefined, { month:'short', day:'numeric' });
    };
    label.textContent = currentRange <= 7
      ? `${fmt(start)} – ${fmt(end)}`
      : `${fmt(start)} – ${fmt(end)}`;
  }

  // ----------------------------------------------------------------
  // renderAll — error-isolated per section
  // ----------------------------------------------------------------
  function renderAll(){
    updatePeriodNav();
    safely('renderLineChart',    renderLineChart);
    safely('renderHeatmap',      renderHeatmap);
    safely('renderStats',        renderStats);
    safely('renderDistribution', renderDistribution);
    safely('renderTagFreq',      renderTagFreq);
    safely('renderWeekdayInsight', renderWeekdayInsight);
    safely('renderComparisonInsight', renderComparisonInsight);
  }

  function safely(name, fn){
    try{ fn(); }
    catch(e){ console.error('Mindora Trends: error in', name, e); }
  }

  // ----------------------------------------------------------------
  // Line chart
  // ----------------------------------------------------------------
  function renderLineChart(){
    const entries   = getEntriesForPeriod();
    const container = document.getElementById('moodLineChart');
    const msg       = document.getElementById('noMoodDataMsg');

    if(!container) return;

    if(entries.length < 2){
      container.innerHTML = '';
      container.classList.add('hidden');
      if(msg){ msg.textContent = I18n.t('no_mood_data'); msg.classList.remove('hidden'); }
      return;
    }
    container.classList.remove('hidden');
    if(msg) msg.classList.add('hidden');

    Charts.renderLine(container, entries.map(e => ({
      x: formatShort(e.date), y: e.mood
    })), { min:0, max:10, ySteps:5, valueSuffix:'/10', ariaLabel:I18n.t('mood_over_time') });
  }

  // ----------------------------------------------------------------
  // Heatmap — always shows current calendar month
  // ----------------------------------------------------------------
  function renderHeatmap(){
    const grid = document.getElementById('heatmapGrid');
    if(!grid) return;
    grid.innerHTML = '';

    const now          = new Date();
    const year         = now.getFullYear();
    const month        = now.getMonth();
    const firstDay     = new Date(year, month, 1);
    const daysInMonth  = new Date(year, month+1, 0).getDate();
    const startOffset  = firstDay.getDay();

    const byDate = {};
    Storage.getMoodEntries().forEach(e => byDate[e.date] = e.mood);

    // Weekday headers Mon-Sun
    const wd = ['weekday_sun','weekday_mon','weekday_tue','weekday_wed','weekday_thu','weekday_fri','weekday_sat'];
    wd.forEach(k => {
      const h = document.createElement('div');
      h.className = 'heatmap-header';
      h.textContent = I18n.t(k);
      grid.appendChild(h);
    });

    for(let i=0;i<startOffset;i++){
      const e = document.createElement('div');
      e.className = 'heatmap-cell empty';
      grid.appendChild(e);
    }

    for(let day=1; day<=daysInMonth; day++){
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const cell    = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.textContent = day;
      if(byDate[dateStr] !== undefined){
        const color = Mood.moodColor(byDate[dateStr]);
        cell.style.background = color;
        cell.style.color = '#fff';
        cell.title = `${dateStr}: ${byDate[dateStr]}/10`;
      }
      grid.appendChild(cell);
    }
  }

  // ----------------------------------------------------------------
  // Snapshot stats
  // ----------------------------------------------------------------
  function renderStats(){
    const entries = getEntriesForPeriod();
    const grid    = document.getElementById('statsGrid');
    if(!grid) return;

    if(!entries.length){
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${I18n.t('no_checkins_range')}</div>`;
      return;
    }

    const moods  = entries.map(e => e.mood);
    const avg    = (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1);
    const best   = entries.reduce((a,b)=> b.mood > a.mood ? b : a);
    const worst  = entries.reduce((a,b)=> b.mood < a.mood ? b : a);
    const streak = (() => {
      let s = 0, max = 0, prev = null;
      entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(e => {
        if(prev){
          const diff = (new Date(e.date) - new Date(prev)) / 86400000;
          s = diff === 1 ? s+1 : 1;
        } else { s = 1; }
        max = Math.max(max, s);
        prev = e.date;
      });
      return max;
    })();

    grid.innerHTML = `
      <div class="stat-box"><span class="num">${avg}</span><span class="cap">${I18n.t('stat_avg')}</span></div>
      <div class="stat-box"><span class="num">${entries.length}</span><span class="cap">${I18n.t('stat_checkins')}</span></div>
      <div class="stat-box"><span class="num">${best.mood}</span><span class="cap">${I18n.t('stat_best')} (${formatShort(best.date)})</span></div>
      <div class="stat-box"><span class="num">${worst.mood}</span><span class="cap">${I18n.t('stat_lowest')} (${formatShort(worst.date)})</span></div>
      <div class="stat-box" style="grid-column:1/-1;"><span class="num">${streak}</span><span class="cap">${I18n.t('stat_checkins')} ${I18n.t('goal_streak_label')}</span></div>
    `;
  }

  // ----------------------------------------------------------------
  // Mood distribution (new) — simple 3-band bar chart
  // ----------------------------------------------------------------
  function renderDistribution(){
    const entries   = getEntriesForPeriod();
    const container = document.getElementById('moodDistribution');
    if(!container) return;

    if(entries.length < 3){
      container.innerHTML = `<p class="empty-state">${I18n.t('no_checkins_range')}</p>`;
      return;
    }

    const low  = entries.filter(e => e.mood <= 3).length;
    const mid  = entries.filter(e => e.mood >= 4 && e.mood <= 6).length;
    const high = entries.filter(e => e.mood >= 7).length;
    const total= entries.length;

    const pct = (n) => total > 0 ? Math.round((n/total)*100) : 0;

    Charts.renderHBars(container, [
      { label: I18n.t('mood_dist_band_1'), value: low,  max: total, display: `${low} (${pct(low)}%)`,  colorVar: 'var(--dusk)' },
      { label: I18n.t('mood_dist_band_2'), value: mid,  max: total, display: `${mid} (${pct(mid)}%)`,  colorVar: 'var(--ash)' },
      { label: I18n.t('mood_dist_band_3'), value: high, max: total, display: `${high} (${pct(high)}%)`, colorVar: 'var(--moss)' }
    ]);
  }

  // ----------------------------------------------------------------
  // Tag frequency
  // ----------------------------------------------------------------
  function renderTagFreq(){
    const entries   = getEntriesForPeriod();
    const container = document.getElementById('tagFreq');
    if(!container) return;

    const counts = {};
    entries.forEach(e => (e.tags||[]).forEach(t => counts[t] = (counts[t]||0)+1));
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8);

    if(!sorted.length){
      container.innerHTML = `<div class="empty-state">${I18n.t('no_tags')}</div>`;
      return;
    }
    Charts.renderHBars(container, sorted.map(([tag,count]) => ({
      label: I18n.t('tag_'+tag), value: count
    })));
  }

  // ----------------------------------------------------------------
  // Insights — weekday averages (full history)
  // ----------------------------------------------------------------
  function renderWeekdayInsight(){
    const container = document.getElementById('weekdayInsight');
    if(!container) return;
    const entries = Storage.getMoodEntries();
    if(entries.length < 7){
      container.innerHTML = `<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`;
      return;
    }
    const dayKeys = ['weekday_sun','weekday_mon','weekday_tue','weekday_wed','weekday_thu','weekday_fri','weekday_sat'];
    const sums = Array(7).fill(0), cnts = Array(7).fill(0);
    entries.forEach(e => { const d = new Date(e.date+'T00:00:00').getDay(); sums[d]+=e.mood; cnts[d]++; });
    const order = [1,2,3,4,5,6,0];
    const bars = order.filter(i => cnts[i]>0).map(i => ({
      label: I18n.t(dayKeys[i]),
      value: sums[i]/cnts[i],
      max: 10,
      display: (sums[i]/cnts[i]).toFixed(1)
    }));
    Charts.renderHBars(container, bars);
  }

  // ----------------------------------------------------------------
  // Insights — what-seems-to-help comparison
  // ----------------------------------------------------------------
  function renderComparisonInsight(){
    const container = document.getElementById('comparisonInsight');
    if(!container) return;
    const entries   = getEntriesForPeriod();
    if(entries.length < 5){
      container.innerHTML = `<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`;
      return;
    }
    const moodByDate = {};
    entries.forEach(e => moodByDate[e.date] = e.mood);
    const logs = getLogsForPeriod();

    function compare(category){
      const daysWith = new Set(logs.filter(l => l.category===category).map(l=>l.date));
      const withM = [], withoutM = [];
      Object.keys(moodByDate).forEach(d => (daysWith.has(d) ? withM : withoutM).push(moodByDate[d]));
      if(withM.length < 2 || withoutM.length < 2) return null;
      const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
      return { withAvg: avg(withM), withoutAvg: avg(withoutM) };
    }

    const rows = [];
    const mv = compare('physical');
    if(mv){ rows.push({label:I18n.t('insights_with_movement'),value:mv.withAvg,max:10,display:mv.withAvg.toFixed(1)}); rows.push({label:I18n.t('insights_without_movement'),value:mv.withoutAvg,max:10,display:mv.withoutAvg.toFixed(1)}); }
    const mn = compare('mind');
    if(mn){ rows.push({label:I18n.t('insights_with_mind'),value:mn.withAvg,max:10,display:mn.withAvg.toFixed(1)}); rows.push({label:I18n.t('insights_without_mind'),value:mn.withoutAvg,max:10,display:mn.withoutAvg.toFixed(1)}); }
    const med = compare('medication');
    if(med){ rows.push({label:I18n.t('insights_with_medication'),value:med.withAvg,max:10,display:med.withAvg.toFixed(1)}); rows.push({label:I18n.t('insights_without_medication'),value:med.withoutAvg,max:10,display:med.withoutAvg.toFixed(1)}); }

    if(!rows.length){ container.innerHTML=`<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`; return; }
    Charts.renderHBars(container, rows);
  }

  function formatShort(dateStr){
    const d = new Date(dateStr+'T00:00:00');
    return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  }

  return {
    setRange, navigate, renderAll,
    get currentRange(){ return currentRange; },
    get periodOffset(){ return periodOffset; }
  };
})();
