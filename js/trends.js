/* ====================================================
   MINDORA — trends.js
   Mood line chart, monthly heatmap, snapshot stats, tag
   frequency, and two insight panels (weekday averages and a
   simple "what seems to help" comparison). Charts are drawn by
   js/charts.js — no external dependency, so this screen can't be
   broken by a CDN request failing.
   ==================================================== */

const Trends = (function(){

  let currentRange = 7;

  function setRange(days){
    currentRange = days;
    renderAll();
  }

  // Each section renders independently — if one throws, the others
  // still show, rather than one bad section blanking the whole screen.
  function renderAll(){
    safely(renderLineChart);
    safely(renderHeatmap);
    safely(renderStats);
    safely(renderTagFreq);
    safely(renderWeekdayInsight);
    safely(renderComparisonInsight);
  }

  function safely(fn){
    try{ fn(); }catch(e){ console.error('Mindora trends render error in', fn.name, e); }
  }

  function renderLineChart(){
    const entries = Storage.getMoodEntriesInRange(currentRange);
    const container = document.getElementById('moodLineChart');
    const msg = document.getElementById('noMoodDataMsg');

    if(entries.length < 2){
      container.classList.add('hidden');
      msg.textContent = I18n.t('no_mood_data');
      msg.classList.remove('hidden');
      container.innerHTML = '';
      return;
    }
    container.classList.remove('hidden');
    msg.classList.add('hidden');

    const points = entries.map(e => ({
      x: formatShort(e.date),
      y: e.mood
    }));

    Charts.renderLine(container, points, {
      min: 0, max: 10, ySteps: 5,
      valueSuffix: '/10',
      ariaLabel: I18n.t('mood_over_time')
    });
  }

  function renderHeatmap(){
    const grid = document.getElementById('heatmapGrid');
    grid.innerHTML = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const startOffset = firstDay.getDay(); // 0=Sun

    const entries = Storage.getMoodEntries();
    const byDate = {};
    entries.forEach(e => byDate[e.date] = e.mood);

    for(let i=0;i<startOffset;i++){
      const empty = document.createElement('div');
      empty.className = 'heatmap-cell empty';
      grid.appendChild(empty);
    }

    for(let day=1; day<=daysInMonth; day++){
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const cell = document.createElement('div');
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

  function renderStats(){
    const entries = Storage.getMoodEntriesInRange(currentRange);
    const grid = document.getElementById('statsGrid');

    if(!entries.length){
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${I18n.t('no_checkins_range')}</div>`;
      return;
    }

    const moods = entries.map(e=>e.mood);
    const avg = (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1);
    const best = entries.reduce((a,b)=> b.mood > a.mood ? b : a);
    const worst = entries.reduce((a,b)=> b.mood < a.mood ? b : a);

    grid.innerHTML = `
      <div class="stat-box"><span class="num">${avg}</span><span class="cap">${I18n.t('stat_avg')}</span></div>
      <div class="stat-box"><span class="num">${entries.length}</span><span class="cap">${I18n.t('stat_checkins')}</span></div>
      <div class="stat-box"><span class="num">${best.mood}</span><span class="cap">${I18n.t('stat_best')} (${formatShort(best.date)})</span></div>
      <div class="stat-box"><span class="num">${worst.mood}</span><span class="cap">${I18n.t('stat_lowest')} (${formatShort(worst.date)})</span></div>
    `;
  }

  function renderTagFreq(){
    const entries = Storage.getMoodEntriesInRange(currentRange);
    const container = document.getElementById('tagFreq');
    const counts = {};
    entries.forEach(e => (e.tags||[]).forEach(t => counts[t] = (counts[t]||0)+1));
    const sorted = Object.entries(counts).sort((a,b)=> b[1]-a[1]).slice(0,8);

    if(!sorted.length){
      container.innerHTML = `<div class="empty-state">${I18n.t('no_tags')}</div>`;
      return;
    }
    Charts.renderHBars(container, sorted.map(([tag,count]) => ({
      label: I18n.t('tag_' + tag), value: count
    })));
  }

  // ---------- Insight: average mood by day of week ----------

  function renderWeekdayInsight(){
    const container = document.getElementById('weekdayInsight');
    if(!container) return;
    const entries = Storage.getMoodEntries(); // full history reads better here than a short range
    if(entries.length < 7){
      container.innerHTML = `<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`;
      return;
    }

    const dayKeys = ['weekday_sun','weekday_mon','weekday_tue','weekday_wed','weekday_thu','weekday_fri','weekday_sat'];
    const sums = [0,0,0,0,0,0,0];
    const counts = [0,0,0,0,0,0,0];
    entries.forEach(e => {
      const d = new Date(e.date + 'T00:00:00');
      const idx = d.getDay();
      sums[idx] += e.mood;
      counts[idx] += 1;
    });

    // Display Monday first, matching the week layout most people expect
    const order = [1,2,3,4,5,6,0];
    const bars = order
      .filter(i => counts[i] > 0)
      .map(i => ({
        label: I18n.t(dayKeys[i]),
        value: sums[i] / counts[i],
        max: 10,
        display: (sums[i] / counts[i]).toFixed(1)
      }));

    Charts.renderHBars(container, bars);
  }

  // ---------- Insight: simple "what seems to help" comparison ----------

  function renderComparisonInsight(){
    const container = document.getElementById('comparisonInsight');
    if(!container) return;
    const entries = Storage.getMoodEntriesInRange(currentRange);
    if(entries.length < 5){
      container.innerHTML = `<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`;
      return;
    }

    const moodByDate = {};
    entries.forEach(e => moodByDate[e.date] = e.mood);
    const cutoff = Storage.dateStrDaysAgo(currentRange - 1);
    const logs = Storage.getLogs().filter(l => l.date >= cutoff);

    function compare(category){
      const daysWith = new Set(logs.filter(l => l.category === category).map(l => l.date));
      const withMoods = [], withoutMoods = [];
      Object.keys(moodByDate).forEach(date => {
        (daysWith.has(date) ? withMoods : withoutMoods).push(moodByDate[date]);
      });
      if(withMoods.length < 2 || withoutMoods.length < 2) return null;
      const avg = arr => arr.reduce((a,b)=>a+b,0) / arr.length;
      return { withAvg: avg(withMoods), withoutAvg: avg(withoutMoods) };
    }

    const rows = [];
    const movement = compare('physical');
    if(movement){
      rows.push({ label: I18n.t('insights_with_movement'), value: movement.withAvg, max: 10, display: movement.withAvg.toFixed(1) });
      rows.push({ label: I18n.t('insights_without_movement'), value: movement.withoutAvg, max: 10, display: movement.withoutAvg.toFixed(1) });
    }
    const mind = compare('mind');
    if(mind){
      rows.push({ label: I18n.t('insights_with_mind'), value: mind.withAvg, max: 10, display: mind.withAvg.toFixed(1) });
      rows.push({ label: I18n.t('insights_without_mind'), value: mind.withoutAvg, max: 10, display: mind.withoutAvg.toFixed(1) });
    }
    const medication = compare('medication');
    if(medication){
      rows.push({ label: I18n.t('insights_with_medication'), value: medication.withAvg, max: 10, display: medication.withAvg.toFixed(1) });
      rows.push({ label: I18n.t('insights_without_medication'), value: medication.withoutAvg, max: 10, display: medication.withoutAvg.toFixed(1) });
    }

    if(!rows.length){
      container.innerHTML = `<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`;
      return;
    }
    Charts.renderHBars(container, rows);
  }

  function formatShort(dateStr){
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  }

  return { setRange, renderAll, get currentRange(){ return currentRange; } };
})();
