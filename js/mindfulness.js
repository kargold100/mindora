/* ====================================================
   MINDORA — mindfulness.js
   Text-based guided mindfulness sessions. Each session
   is a series of timed steps with instructions. No audio
   or video required — works fully offline.
   ==================================================== */

const Mindfulness = (function(){

  const SESSIONS = {
    calm5: {
      titleKey: 'mindfulness_5min_title',
      totalMins: 5,
      steps: [
        { duration:30, text:"Find a comfortable position. You can sit in a chair with your feet flat on the floor, or sit cross-legged. Gently close your eyes, or let your gaze soften to the floor." },
        { duration:40, text:"Take three slow, deep breaths through your nose and out through your mouth. Let each exhale release any tension you're carrying." },
        { duration:60, text:"Now let your breathing return to its natural rhythm. Simply notice the sensation of air entering and leaving your body — the rise and fall of your chest or belly." },
        { duration:60, text:"Your mind may wander to thoughts or worries. This is completely normal. When you notice it happening, gently — without judgment — return your attention to the breath." },
        { duration:60, text:"If a thought grabs you, try silently labelling it: 'thinking', 'worrying', 'planning'. Then let it pass like a cloud crossing the sky, and return to the breath." },
        { duration:60, text:"As you breathe, allow your body to soften a little more with each exhale. There's nowhere to be right now, nothing to fix or solve — just this breath, this moment." },
        { duration:30, text:"Gently begin to expand your awareness to the sounds around you. Take one more deep breath, then when you're ready, slowly open your eyes." }
      ]
    },

    awareness10: {
      titleKey: 'mindfulness_10min_title',
      totalMins: 10,
      steps: [
        { duration:30, text:"Settle into a comfortable, upright position. Close your eyes or lower your gaze. Take a moment to notice where you are, and why you've chosen to be here." },
        { duration:50, text:"Begin with three intentional breaths — long, slow, and complete. On each exhale, let a little more tension leave your body." },
        { duration:90, text:"Now settle into your natural breathing rhythm. Notice the breath without trying to change it. Simply observe — is it shallow or deep? Fast or slow? Smooth or slightly ragged?" },
        { duration:90, text:"Expand your attention to include physical sensations. What does your body feel like right now? Notice areas of warmth, coolness, tension, or ease — without judging any of them." },
        { duration:90, text:"Your mind will wander. It always does. This isn't failure — it's what minds do. Notice the wandering, then gently, patiently, bring attention back to the breath. Every return is the practice." },
        { duration:90, text:"Now turn awareness to your emotional state. What's here right now? You don't need to analyse or change anything. Simply acknowledge what you find with a quiet 'I see you.'" },
        { duration:60, text:"Bring all of this together — breath, body, emotion — and simply rest in wide, open awareness. You don't have to focus on any one thing. Just be here." },
        { duration:60, text:"As this session comes to a close, take a moment to appreciate yourself for taking this time. It matters." },
        { duration:30, text:"Three final breaths. Then slowly open your eyes, carrying a little of this stillness with you." }
      ]
    },

    bodyScan: {
      titleKey: 'mindfulness_body_scan_title',
      totalMins: 8,
      steps: [
        { duration:30, text:"Lie down or sit comfortably. Close your eyes. Let your arms rest at your sides and your legs uncrossed." },
        { duration:40, text:"Take three deep breaths. With each exhale, give yourself permission to let go — of doing, fixing, achieving. For now, just being." },
        { duration:45, text:"Bring your attention to the top of your head. Notice any sensations there — tingling, pressure, warmth, or nothing at all. Whatever is there is fine." },
        { duration:45, text:"Slowly move attention down to your face. Your forehead, eyes, jaw. If you notice tension — particularly in the jaw or brow — invite it to soften." },
        { duration:45, text:"Move to your neck and shoulders. These are common places to hold stress. Breathe into any tension here, and as you exhale, let it release a little." },
        { duration:45, text:"Bring attention to your chest and upper back. Notice your heartbeat if you can. Notice the rise and fall of your chest with each breath." },
        { duration:45, text:"Move to your belly, lower back, and hips. Notice any sensations — tightness, ease, warmth. No need to change anything, just observe." },
        { duration:45, text:"Now your arms and hands. Notice the weight of them, any tingling in the fingertips, the temperature of the air on your skin." },
        { duration:45, text:"Finally, your legs and feet. Notice the sensation where your body makes contact with the floor or chair. Feel the groundedness of being held." },
        { duration:45, text:"Bring your full body into awareness at once. Notice how you feel compared to when you began. Rest here for a few moments." },
        { duration:30, text:"Take one deep breath, wiggle your fingers and toes, and when you're ready, gently return." }
      ]
    },

    lovingKindness: {
      titleKey: 'mindfulness_loving_title',
      totalMins: 7,
      steps: [
        { duration:30, text:"Find a comfortable seated position. Close your eyes. Take a few breaths to arrive fully in this moment." },
        { duration:50, text:"Begin by directing kindness toward yourself. Silently repeat: 'May I be safe. May I be healthy. May I be happy. May I live with ease.' Repeat these phrases slowly, letting them settle." },
        { duration:70, text:"Bring to mind someone you love easily — a close friend, family member, or beloved pet. See them in your mind's eye. Direct the same phrases toward them: 'May you be safe. May you be healthy. May you be happy. May you live with ease.'" },
        { duration:70, text:"Now bring to mind someone neutral — perhaps a neighbour or colleague you don't know well. Extend the same wishes to them. Notice how it feels to wish someone well without any particular story about them." },
        { duration:70, text:"Bring to mind someone you find difficult. This is the hardest part. You don't have to feel warmth straight away — simply try: 'May you be safe. May you be healthy. May you be happy. May you live with ease.' Even the attempt creates connection." },
        { duration:70, text:"Now expand outward — to your neighbourhood, your city, people everywhere who are struggling right now just as you have struggled. 'May all beings be safe. May all beings be happy. May all beings live with ease.'" },
        { duration:40, text:"Return gently to yourself. You have given something real in this practice. Take one more breath, and slowly open your eyes." }
      ]
    },

    sleepRelax: {
      titleKey: 'mindfulness_sleep_title',
      totalMins: 10,
      steps: [
        { duration:30, text:"Lie down in your bed or somewhere comfortable in low light. You won't need to sit upright for this one. Let your body settle." },
        { duration:50, text:"Take five slow, deep breaths. With each exhale, feel your body become heavier — sinking into the mattress or floor beneath you." },
        { duration:60, text:"Tense your feet gently — squeeze them tight — then release completely. Feel the difference between tension and release." },
        { duration:60, text:"Move up to your calves and thighs. Tense, hold for three seconds, then release. Let them become heavy and warm." },
        { duration:60, text:"Your abdomen and lower back. Tense gently, hold, release. Your body is becoming softer with each step." },
        { duration:60, text:"Your arms and hands. Make fists, tense your forearms — then release. Let them fall, heavy and relaxed." },
        { duration:60, text:"Your shoulders and neck. Draw them up toward your ears — hold — then let them drop completely. Feel any tension leaving with that release." },
        { duration:60, text:"Your face. Scrunch your eyes and jaw tight — then relax. Let your jaw drop slightly. Notice how peaceful your face becomes when it is truly at rest." },
        { duration:60, text:"Your whole body is now relaxed and heavy. Begin breathing slowly and rhythmically. With each exhale, count down from 10. 10... 9... 8..." },
        { duration:60, text:"Continue counting with slow breaths. Let thoughts drift by without engaging them. You are safe. It is time to rest." }
      ]
    },

    beginner: {
      titleKey: 'mindfulness_beginner_title',
      totalMins: 4,
      steps: [
        { duration:30, text:"Welcome. Mindfulness simply means paying attention — on purpose, in the present moment, without judgment. That's all. You're already capable of it." },
        { duration:40, text:"Sit comfortably. You don't need to be perfectly still or cross-legged on a cushion. A chair is absolutely fine. Close your eyes or look softly at the floor." },
        { duration:60, text:"Take a slow breath in through your nose, and out through your mouth. Notice the sensation of the air. This simple act of noticing is the whole foundation of mindfulness." },
        { duration:60, text:"Your mind will wander — possibly within seconds. That's normal. That's what minds do. The practice is not to stop thoughts, but to notice when you've wandered, and come back. Every time you come back, you've succeeded." },
        { duration:60, text:"Now just sit and breathe for one minute. When thoughts arise, notice them gently — 'thinking' — then return your attention to the breath. No judgment, no frustration. Just noticing and returning." },
        { duration:30, text:"Well done. That's mindfulness. It doesn't always feel calm — sometimes it surfaces difficult thoughts. That's okay too. The skill is the noticing, not the quietness." }
      ]
    }
  };

  let activeSession = null;
  let stepIdx = 0;
  let stepTimer = null;
  let stepElapsed = 0;

  function render(){
    const container = document.getElementById('mindfulnessContent');
    if(!container) return;
    container.innerHTML = Object.entries(SESSIONS).map(([key, s]) => `
      <div class="mindfulness-card" id="msess-${key}">
        <h3 class="mindfulness-session-title">${I18n.t(s.titleKey)}</h3>
        <p class="mindfulness-session-desc muted">${Math.round(s.steps.reduce((a,st)=>a+st.duration,0)/60)} min</p>
        <div class="mindfulness-player hidden" id="mplayer-${key}">
          <div class="mindfulness-progress">
            <div class="mindfulness-progress-fill" id="mprog-${key}" style="width:0%"></div>
          </div>
          <p class="mindfulness-step-label" id="mstep-${key}">${I18n.t('mindfulness_step_label')} 1 ${I18n.t('assess_q_of')||'of'} ${s.steps.length}</p>
          <p class="mindfulness-instruction" id="minstr-${key}"></p>
          <div class="mindfulness-timer" id="mtimer-${key}">0</div>
          <button class="btn-ghost mindfulness-finish-btn hidden" id="mfinish-${key}" data-session="${key}">${I18n.t('mindfulness_finish_btn')}</button>
        </div>
        <button class="btn-secondary mindfulness-start-btn" id="mstart-${key}" data-session="${key}">
          ${I18n.t('mindfulness_start_btn')}
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.mindfulness-start-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-session');
        startSession(key, container);
      });
    });
    container.querySelectorAll('.mindfulness-finish-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        stopAll();
        render();
      });
    });
  }

  function startSession(key, container){
    stopAll();
    activeSession = key;
    stepIdx = 0;
    stepElapsed = 0;
    const s = SESSIONS[key];

    document.getElementById('mstart-'+key).classList.add('hidden');
    document.getElementById('mplayer-'+key).classList.remove('hidden');

    showStep(key, s);
  }

  function showStep(key, s){
    const step = s.steps[stepIdx];
    if(!step){ finishSession(key); return; }

    const instrEl = document.getElementById('minstr-'+key);
    const stepEl  = document.getElementById('mstep-'+key);
    const timerEl = document.getElementById('mtimer-'+key);
    const progEl  = document.getElementById('mprog-'+key);

    if(instrEl) instrEl.textContent = step.text;
    if(stepEl)  stepEl.textContent = `${I18n.t('mindfulness_step_label')||'Step'} ${stepIdx+1} / ${s.steps.length}`;
    stepElapsed = step.duration;

    const totalDur = s.steps.reduce((a,st)=>a+st.duration,0);
    const elapsed  = s.steps.slice(0,stepIdx).reduce((a,st)=>a+st.duration,0);

    function tick(){
      if(timerEl) timerEl.textContent = stepElapsed;
      if(progEl)  progEl.style.width = Math.round(((elapsed + (step.duration - stepElapsed)) / totalDur) * 100)+'%';
      if(stepElapsed <= 0){
        stepIdx++;
        showStep(key, s);
      } else {
        stepElapsed--;
        stepTimer = setTimeout(tick, 1000);
      }
    }
    tick();
  }

  function finishSession(key){
    const player = document.getElementById('mplayer-'+key);
    const instrEl = document.getElementById('minstr-'+key);
    const finish  = document.getElementById('mfinish-'+key);
    const timerEl = document.getElementById('mtimer-'+key);
    if(instrEl) instrEl.textContent = 'Session complete. Well done.';
    if(timerEl) timerEl.textContent = '✓';
    if(finish)  finish.classList.remove('hidden');
    activeSession = null;
  }

  function stopAll(){
    if(stepTimer){ clearTimeout(stepTimer); stepTimer=null; }
    activeSession = null;
  }

  return { render };
})();
