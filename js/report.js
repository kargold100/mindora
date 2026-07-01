/* ====================================================
   MINDORA — report.js
   Generates a print-ready HTML report in a new tab.
   Uses the same data that's already in the local cache
   and produces a readable summary the user can print
   or save as PDF using their browser's built-in function.
   No external service, no upload — everything stays local.
   ==================================================== */

const Report = (function(){

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function generate(days){
    days = days || 30;
    const entries = days === 0
      ? Storage.getMoodEntries().slice().sort((a,b) => a.date.localeCompare(b.date))
      : Storage.getMoodEntriesInRange(days);
    const logs    = days === 0 ? Storage.getLogs() : Storage.getLogsInRange(days);
    const settings = Storage.getSettings();

    const now   = new Date();
    const today = now.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });

    // Period label
    const periodLabel = days === 0
      ? (I18n.t('range_all') || 'All time')
      : (() => {
          const end   = Storage.dateStrDaysAgo(0);
          const start = Storage.dateStrDaysAgo(days-1);
          const fmt   = d => new Date(d+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
          return `${fmt(start)} – ${fmt(end)}`;
        })();

    // Stats
    const avgMood = entries.length
      ? (entries.reduce((a,e)=>a+e.mood,0)/entries.length).toFixed(1)
      : '—';

    // Tag frequency
    const tagCounts = {};
    entries.forEach(e => (e.tags||[]).forEach(t => tagCounts[t] = (tagCounts[t]||0)+1));
    const topTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);

    // Journal entries with text (newest first)
    const journals = entries.filter(e => e.journal && e.journal.trim())
                             .slice().sort((a,b)=>b.date.localeCompare(a.date))
                             .slice(0,10);

    // Log summary
    const movementCount = logs.filter(l=>l.category==='physical').length;
    const mindCount     = logs.filter(l=>l.category==='mind').length;
    const medCount      = logs.filter(l=>l.category==='medication').length;

    const userName = settings.name || '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(I18n.t('report_title'))}</title>
<style>
  *{box-sizing:border-box; margin:0; padding:0;}
  body{font-family:'Inter',system-ui,sans-serif; color:#211F2E; background:#fff; padding:32px 40px; max-width:700px; margin:0 auto; font-size:13px; line-height:1.6;}
  .report-header{border-bottom:2px solid #E8896B; padding-bottom:16px; margin-bottom:24px;}
  .report-title{font-size:22px; font-weight:700; color:#1B1B2F; margin-bottom:4px;}
  .report-meta{color:#6E6B78; font-size:12px;}
  .section{margin-bottom:28px;}
  .section-title{font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#6B6F9E; margin-bottom:10px; padding-bottom:4px; border-bottom:1px solid #eee;}
  .stat-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:12px;}
  .stat-box{background:#F7F4EF; border-radius:10px; padding:12px; text-align:center;}
  .stat-num{font-size:22px; font-weight:700; display:block; color:#1B1B2F;}
  .stat-cap{font-size:11px; color:#6E6B78;}
  .bar-row{display:flex; align-items:center; gap:10px; margin-bottom:6px;}
  .bar-label{width:120px; flex-shrink:0; font-size:12px; color:#6E6B78;}
  .bar-bg{flex:1; height:8px; background:#EEE; border-radius:4px; overflow:hidden;}
  .bar-fill{height:100%; background:linear-gradient(90deg,#6B6F9E,#E8896B); border-radius:4px;}
  .bar-count{width:28px; text-align:right; font-size:11px; font-family:monospace;}
  .journal-entry{border-left:3px solid #E8896B; padding:8px 12px; margin-bottom:10px; background:#FBF8F3; border-radius:0 8px 8px 0;}
  .journal-date{font-size:11px; color:#6E6B78; margin-bottom:2px;}
  .journal-text{font-size:13px; line-height:1.55;}
  .privacy-note{margin-top:32px; padding:12px; background:#F7F4EF; border-radius:8px; font-size:11px; color:#6E6B78; text-align:center;}
  .print-btn{display:block; margin:24px auto 0; padding:12px 32px; background:#E8896B; color:#fff; border:none; border-radius:999px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit;}
  @media print{ .print-btn{display:none!important;} }
</style>
</head>
<body>
<div class="report-header">
  <div class="report-title">${escapeHtml(I18n.t('report_title'))}${userName ? ` — ${escapeHtml(userName)}` : ''}</div>
  <div class="report-meta">
    ${escapeHtml(I18n.t('report_period'))}: ${escapeHtml(periodLabel)} &nbsp;|&nbsp;
    ${escapeHtml(I18n.t('report_generated'))}: ${escapeHtml(today)}
  </div>
</div>

<div class="section">
  <div class="section-title">Summary</div>
  <div class="stat-grid">
    <div class="stat-box"><span class="stat-num">${entries.length}</span><span class="stat-cap">${escapeHtml(I18n.t('report_total_checkins'))}</span></div>
    <div class="stat-box"><span class="stat-num">${avgMood}</span><span class="stat-cap">${escapeHtml(I18n.t('report_avg_mood'))} /10</span></div>
    <div class="stat-box"><span class="stat-num">${movementCount}</span><span class="stat-cap">${escapeHtml(I18n.t('movement'))}</span></div>
    <div class="stat-box"><span class="stat-num">${mindCount}</span><span class="stat-cap">${escapeHtml(I18n.t('mind'))}</span></div>
    <div class="stat-box"><span class="stat-num">${medCount}</span><span class="stat-cap">${escapeHtml(I18n.t('medications_title'))}</span></div>
  </div>
</div>

${entries.length ? `
<div class="section">
  <div class="section-title">Daily mood</div>
  ${entries.map(e => {
    const pct = ((e.mood-1)/9*100).toFixed(0);
    const d = new Date(e.date+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'});
    return `<div class="bar-row"><span class="bar-label">${d}</span><span class="bar-bg"><span class="bar-fill" style="width:${pct}%"></span></span><span class="bar-count">${e.mood}</span></div>`;
  }).join('')}
</div>` : ''}

${topTags.length ? `
<div class="section">
  <div class="section-title">${escapeHtml(I18n.t('report_top_tags'))}</div>
  ${topTags.map(([tag,count]) => {
    const pct = (count/entries.length*100).toFixed(0);
    return `<div class="bar-row"><span class="bar-label">${escapeHtml(I18n.t('tag_'+tag))}</span><span class="bar-bg"><span class="bar-fill" style="width:${pct}%"></span></span><span class="bar-count">${count}</span></div>`;
  }).join('')}
</div>` : ''}

${journals.length ? `
<div class="section">
  <div class="section-title">${escapeHtml(I18n.t('report_notes_heading'))}</div>
  ${journals.map(e => `
    <div class="journal-entry">
      <div class="journal-date">${new Date(e.date+'T00:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})} — mood ${e.mood}/10</div>
      <div class="journal-text">${escapeHtml(e.journal)}</div>
    </div>
  `).join('')}
</div>` : ''}

<p class="privacy-note">${escapeHtml(I18n.t('report_privacy_note'))}</p>
<button class="print-btn" onclick="window.print()">${escapeHtml(I18n.t('report_print_btn'))}</button>
</body>
</html>`;

    const win = window.open('', '_blank');
    if(win){
      win.document.write(html);
      win.document.close();
    } else {
      alert('Please allow pop-ups from this site to generate the report.');
    }
  }

  return { generate };
})();
