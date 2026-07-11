/* ====================================================
   MINDORA — assessments.js
   Five evidence-informed self-assessments.
   IMPORTANT: These are for self-reflection and
   psychoeducation ONLY. They are not diagnostic tools
   and do not constitute clinical assessment.
   ==================================================== */

const Assessments = (function(){

  /* Assessment definitions — question banks */
  const DEFS = {

    wellbeing: {
      id: 'wellbeing',
      titleKey: 'assess_wellbeing_title',
      descKey:  'assess_wellbeing_desc',
      scale:    ['answer_never','answer_rarely','answer_sometimes','answer_often','answer_always'],
      scaleVals:[0,1,2,3,4],
      questions:[
        'Over the past two weeks, I have felt cheerful and in good spirits.',
        'Over the past two weeks, I have felt calm and relaxed.',
        'Over the past two weeks, I have felt active and vigorous.',
        'Over the past two weeks, I woke up feeling fresh and rested.',
        'My daily life has been filled with things that interest me.'
      ],
      maxScore: 20,
      bands:[
        { min:0,  max:8,  key:'result_high',     color:'var(--bloom)',  suggestions:['Try a 5-minute mindfulness exercise daily.','Gentle movement can shift mood quickly.','Reach out to someone you trust today.'] },
        { min:9,  max:13, key:'result_moderate',  color:'var(--ash)',    suggestions:['Consider what has felt draining lately.','A consistent sleep routine can help.','Small acts of kindness often lift wellbeing.'] },
        { min:14, max:17, key:'result_good',       color:'var(--dusk)',   suggestions:['You\'re doing reasonably well. Keep up your positive habits.','Notice what\'s working and do more of it.'] },
        { min:18, max:20, key:'result_thriving',   color:'var(--moss)',   suggestions:['Excellent wellbeing score. Your habits are clearly working.','Share what\'s going well — positivity spreads.'] },
      ]
    },

    stress: {
      id: 'stress',
      titleKey: 'assess_stress_title',
      descKey:  'assess_stress_desc',
      scale:    ['answer_never','answer_rarely','answer_sometimes','answer_often','answer_always'],
      scaleVals:[0,1,2,3,4],
      reverse:  [4,5,6], // 0-indexed questions to reverse-score
      questions:[
        'I have felt that things were going out of my control.',
        'I have felt nervous and stressed.',
        'I have found myself unable to deal with all the things I had to do.',
        'I have been upset because of something that happened unexpectedly.',
        'I have felt confident about my ability to handle problems.', // reverse
        'I have been able to control irritations in my life.',          // reverse
        'I have felt that things were going my way.'                    // reverse
      ],
      maxScore: 28,
      bands:[
        { min:0,  max:9,  key:'result_good',      color:'var(--moss)',  suggestions:['Your stress seems well managed. Keep it up.'] },
        { min:10, max:17, key:'result_moderate',  color:'var(--dusk)',  suggestions:['Box breathing is effective for acute stress.','Try breaking big tasks into smaller ones.','Sleep has a large impact on perceived stress.'] },
        { min:18, max:28, key:'result_high',      color:'var(--bloom)', suggestions:['High stress is worth taking seriously.','Talking to someone — friend, counsellor, or GP — can help.','Reduce commitments where possible, even temporarily.'] }
      ]
    },

    sleep: {
      id: 'sleep',
      titleKey: 'assess_sleep_title',
      descKey:  'assess_sleep_desc',
      scale:    ['answer_never','answer_rarely','answer_sometimes','answer_often','answer_always'],
      scaleVals:[0,1,2,3,4],
      questions:[
        'I have difficulty falling asleep within 30 minutes.',
        'I wake up in the middle of the night or early morning.',
        'I have used sleep medication (including herbal) to help me sleep.',
        'I have had trouble staying awake during the day.',
        'I feel my sleep quality overall has been poor.',
        'I feel tired or fatigued during the day.'
      ],
      maxScore: 24,
      bands:[
        { min:0,  max:6,  key:'result_good',      color:'var(--moss)',  suggestions:['Your sleep appears healthy. Maintain a consistent schedule.'] },
        { min:7,  max:14, key:'result_moderate',  color:'var(--dusk)',  suggestions:['A consistent wake time (even weekends) is the most effective sleep fix.','Avoid screens 30-60 minutes before bed.','A cool, dark room helps most people sleep better.'] },
        { min:15, max:24, key:'result_high',      color:'var(--bloom)', suggestions:['Poor sleep significantly affects mood and cognition.','Consider talking to your GP if this has persisted more than a month.','The sleep relaxation tool in the Tools section may help.'] }
      ]
    },

    anxiety: {
      id: 'anxiety',
      titleKey: 'assess_anxiety_title',
      descKey:  'assess_anxiety_desc',
      scale:    ['answer_not_at_all','answer_several_days','answer_more_than_half','answer_nearly_every_day'],
      scaleVals:[0,1,2,3],
      questions:[
        'Feeling nervous, anxious, or on edge.',
        'Not being able to stop or control worrying.',
        'Worrying too much about different things.',
        'Having trouble relaxing.',
        'Being so restless that it\'s hard to sit still.',
        'Becoming easily annoyed or irritable.',
        'Feeling afraid something awful might happen.'
      ],
      maxScore: 21,
      bands:[
        { min:0,  max:4,  key:'result_good',      color:'var(--moss)',  suggestions:['Minimal anxiety detected. Keep up your self-care routines.'] },
        { min:5,  max:9,  key:'result_moderate',  color:'var(--dusk)',  suggestions:['Mild anxiety is common. Breathing exercises and mindfulness can help.','Notice what triggers worry and try writing them down.'] },
        { min:10, max:14, key:'result_high',      color:'var(--bloom)', suggestions:['Moderate anxiety is worth addressing. CBT tools in the app can help.','Speaking to a GP or counsellor is a reasonable next step.'] },
        { min:15, max:21, key:'result_high',      color:'var(--bloom)', suggestions:['These scores suggest significant anxiety. Please consider speaking to a mental health professional.','In Australia: Beyond Blue 1300 22 4636 or your GP is a great start.'] }
      ]
    },

    burnout: {
      id: 'burnout',
      titleKey: 'assess_burnout_title',
      descKey:  'assess_burnout_desc',
      scale:    ['answer_never','answer_rarely','answer_sometimes','answer_often','answer_always'],
      scaleVals:[0,1,2,3,4],
      questions:[
        'I feel emotionally exhausted by my work or daily responsibilities.',
        'I feel detached or cynical about things that used to matter to me.',
        'I feel I\'m not achieving much despite putting in a lot of effort.',
        'I struggle to find motivation to start things.',
        'I feel I never have enough time to recover between demands.',
        'I have been neglecting my own needs and self-care.'
      ],
      maxScore: 24,
      bands:[
        { min:0,  max:7,  key:'result_good',      color:'var(--moss)',  suggestions:['Low burnout risk. Protect your rest and recovery time.'] },
        { min:8,  max:15, key:'result_moderate',  color:'var(--dusk)',  suggestions:['Some burnout signs present. Review your commitments and rest.','Saying no to one obligation this week might help.','Sleep and regular movement are powerful buffers against burnout.'] },
        { min:16, max:24, key:'result_high',      color:'var(--bloom)', suggestions:['High burnout risk. This warrants serious attention.','Talk to your GP, manager, or a counsellor about reducing load.','Rest is not a reward for finishing — it\'s part of the work.'] }
      ]
    }
  };

  /* State — which assessment is active and current question index */
  let activeId  = null;
  let qIdx      = 0;
  let answers   = [];

  /* Saved results: { assessmentId: { date, score, bandKey } } */
  function getSaved(){
    try{ return JSON.parse(localStorage.getItem('mindora_assessments') || '{}'); }
    catch(e){ return {}; }
  }
  function saveBand(id, score, bandKey){
    const d = getSaved();
    d[id] = { date: Storage.todayStr(), score, bandKey };
    try{ localStorage.setItem('mindora_assessments', JSON.stringify(d)); }catch(e){}
  }

  /* Interpret score → band */
  function getBand(def, score){
    for(let i=def.bands.length-1; i>=0; i--){
      if(score >= def.bands[i].min) return def.bands[i];
    }
    return def.bands[0];
  }

  /* Raw score with optional reverse-scoring */
  function calcScore(def, answers){
    let total = 0;
    answers.forEach((val, idx) => {
      if(def.reverse && def.reverse.includes(idx)){
        total += (def.scaleVals[def.scaleVals.length-1] - val);
      } else {
        total += val;
      }
    });
    return total;
  }

  /* ── Render the assessments list ─────────────────── */
  function renderList(){
    const container = document.getElementById('assessmentsList');
    if(!container) return;
    const saved = getSaved();

    container.innerHTML = Object.values(DEFS).map(def => {
      const s = saved[def.id];
      const band = s ? getBand(def, s.score) : null;
      return `
        <div class="assess-card">
          <div class="assess-card-head">
            <div>
              <h3 class="assess-card-title">${I18n.t(def.titleKey)}</h3>
              <p class="assess-card-desc muted">${I18n.t(def.descKey)}</p>
            </div>
            ${band ? `<span class="assess-badge" style="background:${band.color}20;color:${band.color};">${I18n.t(band.key)}</span>` : ''}
          </div>
          ${s ? `<p class="assess-last-taken">${I18n.t('assess_last_taken')}: ${s.date}</p>` : `<p class="assess-last-taken muted">${I18n.t('assess_not_taken')}</p>`}
          <button class="btn-secondary" data-assess-start="${def.id}" style="margin-top:10px; width:100%;">
            ${s ? I18n.t('assess_retake_btn') : I18n.t('assess_start_btn')}
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-assess-start]').forEach(btn => {
      btn.addEventListener('click', () => startAssessment(btn.getAttribute('data-assess-start')));
    });
  }

  /* ── Start an assessment ─────────────────────────── */
  function startAssessment(id){
    activeId = id;
    qIdx     = 0;
    answers  = [];
    document.getElementById('assessmentsList').classList.add('hidden');
    document.getElementById('assessmentRunner').classList.remove('hidden');
    document.getElementById('assessmentResult').classList.add('hidden');
    renderQuestion();
  }

  function renderQuestion(){
    const def = DEFS[activeId];
    const runner = document.getElementById('assessmentRunner');
    if(!runner) return;

    const q      = def.questions[qIdx];
    const total  = def.questions.length;
    const pct    = Math.round((qIdx / total) * 100);

    runner.innerHTML = `
      <div class="assess-progress-bar-bg">
        <div class="assess-progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <p class="assess-q-counter">${I18n.t('assess_q_of') ? (qIdx+1)+' '+I18n.t('assess_q_of')+' '+total : (qIdx+1)+'/'+ total}</p>
      <p class="assess-question">${q}</p>
      <div class="assess-options">
        ${def.scale.map((scaleKey, i) => `
          <button class="assess-option-btn ${answers[qIdx]===def.scaleVals[i]?'selected':''}" data-val="${def.scaleVals[i]}">
            ${I18n.t(scaleKey)}
          </button>
        `).join('')}
      </div>
      <div class="assess-nav-row">
        ${qIdx > 0 ? `<button class="btn-ghost" id="assessPrevBtn">${I18n.t('assess_prev_btn')}</button>` : '<span></span>'}
        <button class="btn-primary" id="assessNextBtn" ${answers[qIdx]===undefined?'disabled':''} style="flex:none; padding:12px 28px;">
          ${qIdx < total-1 ? I18n.t('assess_next_btn') : I18n.t('assess_finish_btn')}
        </button>
      </div>
    `;

    runner.querySelectorAll('[data-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        answers[qIdx] = Number(btn.getAttribute('data-val'));
        runner.querySelectorAll('.assess-option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('assessNextBtn').disabled = false;
      });
    });

    document.getElementById('assessNextBtn').addEventListener('click', () => {
      if(qIdx < def.questions.length - 1){ qIdx++; renderQuestion(); }
      else showResult();
    });

    const prevBtn = document.getElementById('assessPrevBtn');
    if(prevBtn) prevBtn.addEventListener('click', () => { if(qIdx > 0){ qIdx--; renderQuestion(); } });
  }

  /* ── Show result ─────────────────────────────────── */
  function showResult(){
    const def   = DEFS[activeId];
    const score = calcScore(def, answers);
    const pct   = Math.round((score / def.maxScore) * 100);
    const band  = getBand(def, score);
    saveBand(activeId, score, band.key);

    document.getElementById('assessmentRunner').classList.add('hidden');
    const res = document.getElementById('assessmentResult');
    res.classList.remove('hidden');

    const highConcern = band.key === 'result_high';

    res.innerHTML = `
      <div class="assess-result-header">
        <h3>${I18n.t('assess_result_title')}</h3>
        <h2>${I18n.t(def.titleKey)}</h2>
      </div>
      <div class="assess-score-ring" style="border-color:${band.color};">
        <span class="assess-score-num" style="color:${band.color};">${pct}<span style="font-size:.5em;">%</span></span>
      </div>
      <p class="assess-band-label" style="color:${band.color};">${I18n.t(band.key)}</p>
      ${highConcern ? `<div class="assess-support-note">${I18n.t('result_support_note')}</div>` : ''}
      <div class="assess-suggestions">
        <p class="assess-suggestions-title">${I18n.t('result_suggestions_title')}</p>
        ${band.suggestions.map(s=>`<div class="assess-suggestion-item">✦ ${s}</div>`).join('')}
      </div>
      <p class="assess-disclaimer muted">${I18n.t('assess_disclaimer')}</p>
      <div class="form-actions" style="margin-top:16px;">
        <button class="btn-secondary" id="assessRetakeBtn">${I18n.t('assess_retake_btn')}</button>
        <button class="btn-primary" id="assessDoneBtn">${I18n.t('btn_cancel') ? I18n.t('btn_cancel').replace('Cancel','Done') : 'Done'}</button>
      </div>
    `;

    document.getElementById('assessRetakeBtn').addEventListener('click', () => startAssessment(activeId));
    document.getElementById('assessDoneBtn').addEventListener('click', () => {
      document.getElementById('assessmentResult').classList.add('hidden');
      document.getElementById('assessmentsList').classList.remove('hidden');
      renderList();
    });
  }

  function render(){
    const list = document.getElementById('assessmentsList');
    const runner = document.getElementById('assessmentRunner');
    const result = document.getElementById('assessmentResult');
    if(list)   list.classList.remove('hidden');
    if(runner) runner.classList.add('hidden');
    if(result) result.classList.add('hidden');
    renderList();
  }

  return { render };
})();
