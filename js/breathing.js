/* ====================================================
   MINDORA — breathing.js
   Interactive breathing exercises rendered in the Learn
   "Tools" tab. Animates with pure CSS transitions and
   a JS timer — no audio, no external dependencies.
   ==================================================== */

const Breathing = (function(){

  let activeTimer = null;
  let cycleCount  = 0;

  const EXERCISES = {
    box: {
      key: 'box',
      phases: [
        { key:'breathing_inhale', secs:4 },
        { key:'breathing_hold',   secs:4 },
        { key:'breathing_exhale', secs:4 },
        { key:'breathing_rest',   secs:4 }
      ]
    },
    fse: { // 4-7-8
      key: 'fse',
      phases: [
        { key:'breathing_inhale', secs:4 },
        { key:'breathing_hold',   secs:7 },
        { key:'breathing_exhale', secs:8 }
      ]
    }
  };

  function stop(){
    if(activeTimer){ clearTimeout(activeTimer); activeTimer = null; }
    cycleCount = 0;
    // Reset all orbs
    document.querySelectorAll('.breath-orb').forEach(o => {
      o.style.transform = 'scale(0.6)';
      o.style.transition = 'none';
    });
    document.querySelectorAll('.breath-phase-label').forEach(l => { l.textContent = ''; });
    document.querySelectorAll('.breath-counter').forEach(c => { c.textContent = ''; });
    document.querySelectorAll('.breath-start-btn').forEach(b => {
      b.textContent = I18n.t('breathing_start_btn');
      b.setAttribute('data-running','false');
    });
  }

  function start(exerciseKey){
    stop();
    const ex = EXERCISES[exerciseKey];
    if(!ex) return;

    const container = document.getElementById('breath-' + exerciseKey);
    if(!container) return;

    const orb   = container.querySelector('.breath-orb');
    const label = container.querySelector('.breath-phase-label');
    const counter = container.querySelector('.breath-counter');
    const startBtn = container.querySelector('.breath-start-btn');
    startBtn.setAttribute('data-running','true');
    startBtn.textContent = I18n.t('breathing_stop_btn');

    let phaseIdx = 0;
    cycleCount = 0;

    function runPhase(){
      const phase = ex.phases[phaseIdx];
      label.textContent = I18n.t(phase.key);

      // Animate orb: inhale → scale up, exhale → scale down, hold/rest → stay
      if(phase.key === 'breathing_inhale'){
        orb.style.transition = `transform ${phase.secs}s ease-in-out`;
        orb.style.transform  = 'scale(1.0)';
      } else if(phase.key === 'breathing_exhale'){
        orb.style.transition = `transform ${phase.secs}s ease-in-out`;
        orb.style.transform  = 'scale(0.6)';
      }
      // hold/rest — orb stays where it is

      // Countdown timer
      let remaining = phase.secs;
      counter.textContent = remaining;
      const countDown = setInterval(() => {
        remaining--;
        if(remaining > 0) counter.textContent = remaining;
        else clearInterval(countDown);
      }, 1000);

      activeTimer = setTimeout(() => {
        clearInterval(countDown);
        phaseIdx = (phaseIdx + 1) % ex.phases.length;
        if(phaseIdx === 0){
          cycleCount++;
          counter.textContent = `${cycleCount} ${I18n.t('breathing_cycles')}`;
        }
        // Check if still running (user might have stopped)
        if(startBtn.getAttribute('data-running') === 'true') runPhase();
      }, phase.secs * 1000);
    }

    runPhase();
  }

  function renderAll(){
    const wrap = document.getElementById('breathingTools');
    if(!wrap) return;

    wrap.innerHTML = [
      renderExercise('box', I18n.t('box_breathing_name'), I18n.t('box_breathing_desc')),
      renderExercise('fse', I18n.t('breathing_478_name'), I18n.t('breathing_478_desc')),
      renderGrounding()
    ].join('');

    // Wire buttons
    wrap.querySelectorAll('[data-breath-start]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-breath-start');
        if(btn.getAttribute('data-running') === 'true'){
          stop();
        } else {
          start(key);
        }
      });
    });
  }

  function renderExercise(key, name, desc){
    return `
      <div class="breath-card" id="breath-${key}">
        <h3 class="breath-name">${escHtml(name)}</h3>
        <p class="breath-desc muted">${escHtml(desc)}</p>
        <div class="breath-visual">
          <div class="breath-orb" style="transform:scale(0.6)"></div>
          <span class="breath-phase-label"></span>
          <span class="breath-counter"></span>
        </div>
        <button class="btn-secondary breath-start-btn" data-breath-start="${key}" data-running="false">
          ${I18n.t('breathing_start_btn')}
        </button>
      </div>
    `;
  }

  function renderGrounding(){
    const steps = [
      I18n.t('grounding_5'), I18n.t('grounding_4'), I18n.t('grounding_3'),
      I18n.t('grounding_2'), I18n.t('grounding_1')
    ];
    return `
      <div class="breath-card grounding-card">
        <h3 class="breath-name">${I18n.t('grounding_title')}</h3>
        <p class="breath-desc muted">${I18n.t('grounding_desc')}</p>
        <ol class="grounding-steps">
          ${steps.map(s => `<li>${escHtml(s)}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  function escHtml(str){
    const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
  }

  return { renderAll, start, stop };
})();
