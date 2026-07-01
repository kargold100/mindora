/* ====================================================
   MINDORA — trends.js  (v3)
   ─────────────────────────────────────────────────────
   KEY FIX: The heatmap now uses getPeriodBounds() to
   determine which calendar months to show. Previously it
   always used new Date() (today) regardless of which
   period was selected — navigating to "previous week"
   still showed the current month. Now navigating to
   any past period shows the correct month(s).

   For 7d: 1 month (containing the period)
   For 30d: 1–2 months (months the period spans)
   For 90d: up to 3 months
   For all-time: all months with data, oldest → newest

   Days inside the selected period get a subtle ring so
   you can see exactly which days are "in scope" even when
   the surrounding month has more data.
   ==================================================== */

const Trends = (function(){

  let currentRange = 7;   // days; 0 = all-time
  let periodOffset = 0;   // 0 = current period, -1 = one period back, etc.

  // ── Public API ────────────────────────────────────

  function setRange(days){
    currentRange = days;
    periodOffset = 0;
    renderAll();
  }

  function navigate(direction){
    if(direction > 0 && periodOffset >= 0) return;
    if(currentRange === 0) return;
    periodOffset = Math.min(0, periodOffset + direction);
    renderAll();
  }

  // ── Period maths ──────────────────────────────────

  function getPeriodBounds(){
    if(currentRange === 0){
      const entries = Storage.getMoodEntries();
      if(!entries.length){ const t = Storage.todayStr(); return { start:t, end:t }; }
      const dates = entries.map(e=>e.date).sort();
      return { start:dates[0], end:dates[dates.length-1] };
    }
    const len    = currentRange;
    const back   = Math.abs(periodOffset) * len;
    const end    = Storage.dateStrDaysAgo(back);
    const start  = Storage.dateStrDaysAgo(back + len - 1);
    return { start, end };
  }

  function getEntriesForPeriod(){
    const { start, end } = getPeriodBounds();
    return Storage.getMoodEntries()
      .filter(e => e.date >= start && e.date <= end)
      .sort((a,b) => a.date.localeCompare(b.date));
  }

  function getLogsForPeriod(){
    const { start, end } = getPeriodBounds();
    return Storage.getLogs().filter(l => l.date >= start && l.date <= end);
  }

  // ── Period nav label ──────────────────────────────

  function updatePeriodNav(){
    const prevBtn = document.getElementById('trendsPrevBtn');
    const nextBtn = document.getElementById('trendsNextBtn');
    const label   = document.getElementById('trendsPeriodLabel');
    if(!prevBtn || !nextBtn || !label) return;

    if(currentRange === 0){
      label.textContent = I18n.t('range_all') || 'All time';
      prevBtn.style.visibility = 'hidden';
      nextBtn.style.visibility = 'hidden';
      return;
    }

    prevBtn.style.visibility = 'visible';
    nextBtn.style.visibility = 'visible';
    nextBtn.disabled = (periodOffset >= 0);

    const { start, end } = getPeriodBounds();
    const fmt = d => new Date(d+'T00:00:00').toLocaleDateString(undefined,{ month:'short', day:'numeric' });
    const fmtYear = d => new Date(d+'T00:00:00').toLocaleDateString(undefined,{ month:'short', year:'numeric' });

    if(currentRange <= 7){
      label.textContent = `${fmt(start)} – ${fmt(end)}`;
    } else if(currentRange <= 31){
      label.textContent = fmtYear(end);
    } else {
      label.textContent = `${fmt(start)} – ${fmt(end)}`;
    }
  }

  // ── renderAll — each section error-isolated ───────

  function renderAll(){
    updatePeriodNav();
    safely('lineChart',    renderLineChart);
    safely('heatmap',      renderHeatmap);
    safely('stats',        renderStats);
    safely('distribution', renderDistribution);
    safely('tagFreq',      renderTagFreq);
    safely('weekday',      renderWeekdayInsight);
    safely('comparison',   renderComparisonInsight);
  }

  function safely(name, fn){
    try{ fn(); }catch(e){ console.error('Mindora Trends ['+name+']:', e); }
  }

  // ── Line chart ────────────────────────────────────

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

    Charts.renderLine(container,
      entries.map(e => ({ x: formatShort(e.date), y: e.mood })),
      { min:0, max:10, ySteps:5, valueSuffix:'/10', ariaLabel: I18n.t('mood_over_time') }
    );
  }

  // ── Heatmap — period-aware multi-month ────────────
  //
  // This is the section that was broken: it previously
  // always read new Date() so navigating to a previous
  // period had no effect on which month was shown.
  //
  // Now we:
  //  1. Calculate the months the selected period spans
  //  2. Render one calendar grid per month
  //  3. Mark days inside the period with a highlight ring
  //  4. Colour days that have a check-in with the mood gradient

  function renderHeatmap(){
    const grid = document.getElementById('heatmapGrid');
    if(!grid) return;
    grid.innerHTML = '';

    const { start, end } = getPeriodBounds();

    // Update section heading to reflect the period
    const heading = document.getElementById('heatmapHeading');
    if(heading){
      if(currentRange === 0){
        heading.textContent = I18n.t('this_month') || 'Calendar';
      } else if(currentRange <= 31){
        const endDt = new Date(end+'T00:00:00');
        heading.textContent = endDt.toLocaleDateString(undefined,{ month:'long', year:'numeric' });
      } else {
        heading.textContent = I18n.t('this_month') || 'Calendar';
      }
    }

    // Build a map of date → mood for fast lookup
    const byDate = {};
    Storage.getMoodEntries().forEach(e => { byDate[e.date] = e.mood; });

    // Determine which months to render
    const months = getMonthsToRender(start, end);

    // Weekday header row (rendered once at the top for compactness)
    const wdKeys = ['weekday_sun','weekday_mon','weekday_tue','weekday_wed','weekday_thu','weekday_fri','weekday_sat'];
    wdKeys.forEach(k => {
      const h = document.createElement('div');
      h.className = 'heatmap-header';
      h.textContent = I18n.t(k);
      grid.appendChild(h);
    });

    months.forEach((ym, idx) => {
      // For multi-month views, add a month label row
      if(months.length > 1){
        const label = document.createElement('div');
        label.className = 'heatmap-month-label';
        label.textContent = new Date(ym.year, ym.month, 1)
          .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        grid.appendChild(label);
      }

      renderCalendarMonth(grid, ym.year, ym.month, byDate, start, end);
    });
  }

  // Returns an array of {year, month} for months the period spans,
  // capped at a sensible maximum to keep the heatmap readable.
  function getMonthsToRender(start, end){
    const startDt  = new Date(start+'T00:00:00');
    const endDt    = new Date(end+'T00:00:00');

    // Cap: all-time shows last 6 months, 90d shows up to 3, others 1-2
    let maxMonths;
    if(currentRange === 0) maxMonths = 6;
    else if(currentRange >= 90) maxMonths = 3;
    else maxMonths = 2;

    // Walk from end backward for up to maxMonths
    const months = [];
    let cur = new Date(endDt.getFullYear(), endDt.getMonth(), 1);
    const earliest = new Date(startDt.getFullYear(), startDt.getMonth(), 1);

    while(cur >= earliest && months.length < maxMonths){
      months.unshift({ year: cur.getFullYear(), month: cur.getMonth() });
      cur.setMonth(cur.getMonth() - 1);
    }

    return months;
  }

  // Renders one month into the existing CSS grid.
  // Days inside [periodStart, periodEnd] get the 'in-period' class (ring outline).
  // Days with a check-in get coloured by mood.
  function renderCalendarMonth(grid, year, month, byDate, periodStart, periodEnd){
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const startDow    = new Date(year, month, 1).getDay(); // 0=Sun

    // Empty padding cells to align first day
    for(let i=0; i<startDow; i++){
      const e = document.createElement('div');
      e.className = 'heatmap-cell empty';
      grid.appendChild(e);
    }

    for(let day=1; day<=daysInMonth; day++){
      const mm      = String(month+1).padStart(2,'0');
      const dd      = String(day).padStart(2,'0');
      const dateStr = `${year}-${mm}-${dd}`;
      const cell    = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.textContent = day;

      // Mark if this day is inside the selected period
      const inPeriod = dateStr >= periodStart && dateStr <= periodEnd;
      if(inPeriod) cell.classList.add('in-period');

      // Colour if there's a check-in
      if(byDate[dateStr] !== undefined){
        const color = Mood.moodColor(byDate[dateStr]);
        cell.style.background = color;
        cell.style.color = '#fff';
        cell.title = `${dateStr}: ${byDate[dateStr]}/10`;
      }

      grid.appendChild(cell);
    }

    // Fill trailing cells so the grid rows complete cleanly
    const totalCells = startDow + daysInMonth;
    const trailing   = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for(let i=0; i<trailing; i++){
      const e = document.createElement('div');
      e.className = 'heatmap-cell empty';
      grid.appendChild(e);
    }
  }

  // ── Snapshot stats ────────────────────────────────

  function renderStats(){
    const entries = getEntriesForPeriod();
    const grid    = document.getElementById('statsGrid');
    if(!grid) return;

    if(!entries.length){
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${I18n.t('no_checkins_range')}</div>`;
      return;
    }

    const moods = entries.map(e=>e.mood);
    const avg   = (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1);
    const best  = entries.reduce((a,b)=>b.mood>a.mood?b:a);
    const worst = entries.reduce((a,b)=>b.mood<a.mood?b:a);

    // Longest consecutive-day streak within the period
    const streak = (() => {
      let s=0, max=0, prev=null;
      entries.forEach(e=>{
        if(prev){
          const diff=(new Date(e.date)-new Date(prev))/86400000;
          s = diff===1 ? s+1 : 1;
        } else s=1;
        max=Math.max(max,s); prev=e.date;
      });
      return max;
    })();

    grid.innerHTML = `
      <div class="stat-box"><span class="num">${avg}</span><span class="cap">${I18n.t('stat_avg')}</span></div>
      <div class="stat-box"><span class="num">${entries.length}</span><span class="cap">${I18n.t('stat_checkins')}</span></div>
      <div class="stat-box"><span class="num">${best.mood}</span><span class="cap">${I18n.t('stat_best')}<br>${formatShort(best.date)}</span></div>
      <div class="stat-box"><span class="num">${worst.mood}</span><span class="cap">${I18n.t('stat_lowest')}<br>${formatShort(worst.date)}</span></div>
    `;
  }

  // ── Mood distribution ─────────────────────────────

  function renderDistribution(){
    const entries   = getEntriesForPeriod();
    const container = document.getElementById('moodDistribution');
    if(!container) return;

    if(entries.length < 3){
      container.innerHTML = `<p class="empty-state">${I18n.t('no_checkins_range')}</p>`;
      return;
    }

    const low  = entries.filter(e=>e.mood<=3).length;
    const mid  = entries.filter(e=>e.mood>=4&&e.mood<=6).length;
    const high = entries.filter(e=>e.mood>=7).length;
    const n    = entries.length;
    const pct  = v => n>0 ? Math.round((v/n)*100) : 0;

    Charts.renderHBars(container, [
      { label:I18n.t('mood_dist_band_1'), value:low,  max:n, display:`${low} (${pct(low)}%)`,  colorVar:'var(--dusk)' },
      { label:I18n.t('mood_dist_band_2'), value:mid,  max:n, display:`${mid} (${pct(mid)}%)`,  colorVar:'var(--ash)' },
      { label:I18n.t('mood_dist_band_3'), value:high, max:n, display:`${high} (${pct(high)}%)`, colorVar:'var(--moss)' }
    ]);
  }

  // ── Tag frequency ─────────────────────────────────

  function renderTagFreq(){
    const entries   = getEntriesForPeriod();
    const container = document.getElementById('tagFreq');
    if(!container) return;

    const counts = {};
    entries.forEach(e=>(e.tags||[]).forEach(t=>counts[t]=(counts[t]||0)+1));
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8);

    if(!sorted.length){
      container.innerHTML=`<div class="empty-state">${I18n.t('no_tags')}</div>`;
      return;
    }
    Charts.renderHBars(container, sorted.map(([tag,count])=>({
      label: I18n.t('tag_'+tag), value: count
    })));
  }

  // ── Insight: weekday averages (full history) ──────

  function renderWeekdayInsight(){
    const container = document.getElementById('weekdayInsight');
    if(!container) return;
    const entries = Storage.getMoodEntries();
    if(entries.length < 7){
      container.innerHTML=`<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`;
      return;
    }
    const wdKeys=['weekday_sun','weekday_mon','weekday_tue','weekday_wed','weekday_thu','weekday_fri','weekday_sat'];
    const sums=Array(7).fill(0), cnts=Array(7).fill(0);
    entries.forEach(e=>{
      const d=new Date(e.date+'T00:00:00').getDay();
      sums[d]+=e.mood; cnts[d]++;
    });
    const order=[1,2,3,4,5,6,0];
    Charts.renderHBars(container,
      order.filter(i=>cnts[i]>0).map(i=>({
        label:I18n.t(wdKeys[i]),
        value:sums[i]/cnts[i],
        max:10,
        display:(sums[i]/cnts[i]).toFixed(1)
      }))
    );
  }

  // ── Insight: what-seems-to-help ───────────────────

  function renderComparisonInsight(){
    const container = document.getElementById('comparisonInsight');
    if(!container) return;
    const entries = getEntriesForPeriod();
    if(entries.length < 5){
      container.innerHTML=`<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`;
      return;
    }

    const moodByDate={};
    entries.forEach(e=>moodByDate[e.date]=e.mood);
    const logs=getLogsForPeriod();

    function compare(cat){
      const days=new Set(logs.filter(l=>l.category===cat).map(l=>l.date));
      const w=[],wo=[];
      Object.keys(moodByDate).forEach(d=>(days.has(d)?w:wo).push(moodByDate[d]));
      if(w.length<2||wo.length<2) return null;
      const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
      return { with:avg(w), without:avg(wo) };
    }

    const rows=[];
    const push=(labelWith,labelWithout,r)=>{
      if(!r) return;
      rows.push({label:I18n.t(labelWith),   value:r.with,   max:10, display:r.with.toFixed(1)});
      rows.push({label:I18n.t(labelWithout), value:r.without, max:10, display:r.without.toFixed(1)});
    };
    push('insights_with_movement',   'insights_without_movement',   compare('physical'));
    push('insights_with_mind',        'insights_without_mind',       compare('mind'));
    push('insights_with_medication',  'insights_without_medication', compare('medication'));

    if(!rows.length){
      container.innerHTML=`<p class="empty-state">${I18n.t('insights_not_enough_data')}</p>`;
      return;
    }
    Charts.renderHBars(container, rows);
  }

  // ── Helpers ───────────────────────────────────────

  function formatShort(dateStr){
    return new Date(dateStr+'T00:00:00')
      .toLocaleDateString(undefined, { month:'short', day:'numeric' });
  }

  return {
    setRange, navigate, renderAll,
    get currentRange(){ return currentRange; },
    get periodOffset(){ return periodOffset; }
  };
})();
