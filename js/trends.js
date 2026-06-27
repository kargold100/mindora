/* ====================================================
   MINDORA — trends.js
   Mood line chart, monthly heatmap, snapshot stats, tag frequency.
   ==================================================== */

const Trends = (function(){

  let lineChart = null;
  let currentRange = 7;

  function setRange(days){
    currentRange = days;
    renderAll();
  }

  function renderAll(){
    renderLineChart();
    renderHeatmap();
    renderStats();
    renderTagFreq();
  }

  function renderLineChart(){
    const entries = Storage.getMoodEntriesInRange(currentRange);
    const canvas = document.getElementById('moodLineChart');
    const msg = document.getElementById('noMoodDataMsg');

    if(entries.length < 2){
      canvas.classList.add('hidden');
      msg.textContent = I18n.t('no_mood_data');
      msg.classList.remove('hidden');
      if(lineChart){ lineChart.destroy(); lineChart = null; }
      return;
    }
    canvas.classList.remove('hidden');
    msg.classList.add('hidden');

    const labels = entries.map(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
    });
    const data = entries.map(e => e.mood);

    if(lineChart) lineChart.destroy();

    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(27,27,47,0.06)';
    const textColor = isDark ? '#B9B6C3' : '#8A8794';

    lineChart = new Chart(ctx, {
      type:'line',
      data:{
        labels,
        datasets:[{
          data,
          borderColor:'#E8896B',
          backgroundColor:'rgba(232,137,107,0.12)',
          borderWidth:2.5,
          tension:0.35,
          fill:true,
          pointRadius:3,
          pointBackgroundColor:'#6B6F9E'
        }]
      },
      options:{
        responsive:true,
        plugins:{ legend:{ display:false } },
        scales:{
          y:{ min:0, max:10, ticks:{ stepSize:2, color:textColor }, grid:{ color:gridColor } },
          x:{ ticks:{ color:textColor, maxRotation:0, autoSkip:true }, grid:{ display:false } }
        }
      }
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
    const max = sorted[0][1];
    container.innerHTML = sorted.map(([tag,count]) => `
      <div class="tagfreq-row">
        <span class="tagfreq-name">${I18n.t('tag_' + tag)}</span>
        <span class="tagfreq-bar-wrap"><span class="tagfreq-bar" style="width:${(count/max)*100}%"></span></span>
        <span class="tagfreq-count">${count}</span>
      </div>
    `).join('');
  }

  function formatShort(dateStr){
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  }

  return { setRange, renderAll, get currentRange(){ return currentRange; } };
})();
