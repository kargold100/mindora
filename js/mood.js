/* ====================================================
   MINDORA — mood.js   (v2)
   Check-in redesigned as a multi-step flow:
     Step 1 – Emoji picker (primary input, immediately satisfying)
     Step 2 – Context chips (weather, social) — always visible
     Step 3 – Body & basics (sleep, stress — already familiar)
     Step 4 – Reflect (journal, mood tags)
   The "more questions" panel is still available for optional
   deep tracking (energy, focus, tension, etc.)
   ==================================================== */

const Mood = (function(){

  const EMOJIS = [
    // Positive
    { id:'happy',      value:9,  face:'😊', key:'mood_happy',      valence:'positive' },
    { id:'calm',       value:8,  face:'😌', key:'mood_calm',       valence:'positive' },
    { id:'content',    value:7,  face:'🙂', key:'mood_content',    valence:'positive' },
    { id:'grateful',   value:8,  face:'🥰', key:'mood_grateful',   valence:'positive' },
    { id:'confident',  value:8,  face:'😎', key:'mood_confident',  valence:'positive' },
    // Neutral
    { id:'neutral',    value:5,  face:'😐', key:'mood_neutral',    valence:'neutral'  },
    // Negative
    { id:'tired',      value:4,  face:'😴', key:'mood_tired',      valence:'negative' },
    { id:'anxious',    value:3,  face:'😟', key:'mood_anxious',    valence:'negative' },
    { id:'sad',        value:3,  face:'😢', key:'mood_sad',        valence:'negative' },
    { id:'angry',      value:3,  face:'😡', key:'mood_angry',      valence:'negative' },
    { id:'overwhelmed',value:2,  face:'😨', key:'mood_overwhelmed',valence:'negative' },
    { id:'lonely',     value:3,  face:'😞', key:'mood_lonely',     valence:'negative' },
  ];

  const TAGS = [
    'anxious','tired','stressed','overwhelmed','low',
    'calm','energised','happy','grateful','motivated',
    'lonely','irritable'
  ];

  const TRIGGERS   = ['work','family','health','money','sleep','relationships'];
  const ACTIVITIES = ['work','family','exercise','friends','study','travel','financial','relationships','health','weather'];
  const FOOD_OPTS = ['healthy','average','poor','skipped'];
  const WEATHER   = ['sunny','cloudy','rainy','hot','cold'];
  const SOCIAL    = ['alone','family','friends','work'];

  let selectedTriggers  = [];
  let selectedActivities = [];
  let selectedFood      = null;
  const APPETITE = ['normal','less','more','skipped'];

  let selectedTags    = [];
  let selectedWeather = null;
  let selectedSocial  = null;
  let selectedAppetite= null;
  let selectedEmoji   = null; // null = nothing picked yet; value 2-10

  // ----------------------------------------------------------------
  // Emoji picker — renders into #emojiPicker
  // ----------------------------------------------------------------
  function renderEmojiPicker(){
    const wrap = document.getElementById('emojiPicker');
    if(!wrap) return;
    wrap.innerHTML = EMOJIS.map(e => `
      <button type="button"
              class="emoji-btn ${selectedEmoji === e.value ? 'selected' : ''}"
              data-emoji="${e.value}"
              aria-label="${I18n.t(e.key)}"
              title="${I18n.t(e.key)}">
        <span class="emoji-face" aria-hidden="true">${e.face}</span>
        <span class="emoji-label">${I18n.t(e.key)}</span>
      </button>
    `).join('');

    wrap.querySelectorAll('[data-emoji]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = Number(btn.getAttribute('data-emoji'));
        selectedEmoji = (selectedEmoji === v) ? null : v;
        // sync slider
        if(selectedEmoji !== null){
          const slider = document.getElementById('moodSlider');
          if(slider) slider.value = selectedEmoji;
          const label = document.getElementById('moodValueLabel');
          if(label) label.textContent = selectedEmoji;
        }
        renderEmojiPicker();
        // pulse the orb
        renderOrb(selectedEmoji);
      });
    });
  }

  // ----------------------------------------------------------------
  // Context chips
  // ----------------------------------------------------------------
  function renderWeatherChips(){
    const wrap = document.getElementById('weatherChips');
    if(!wrap) return;
    wrap.innerHTML = WEATHER.map(k => `
      <button type="button" class="chip ${selectedWeather===k?'selected':''}" data-weather="${k}">
        ${weatherIcon(k)} ${I18n.t('weather_'+k)}
      </button>
    `).join('');
    wrap.querySelectorAll('[data-weather]').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.getAttribute('data-weather');
        selectedWeather = (selectedWeather === k) ? null : k;
        renderWeatherChips();
      });
    });
  }

  function renderSocialChips(){
    const wrap = document.getElementById('socialChips');
    if(!wrap) return;
    wrap.innerHTML = SOCIAL.map(k => `
      <button type="button" class="chip ${selectedSocial===k?'selected':''}" data-social="${k}">
        ${I18n.t('social_'+k)}
      </button>
    `).join('');
    wrap.querySelectorAll('[data-social]').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.getAttribute('data-social');
        selectedSocial = (selectedSocial === k) ? null : k;
        renderSocialChips();
      });
    });
  }

  function renderTagChips(){
    const wrap = document.getElementById('tagChips');
    if(!wrap) return;
    wrap.innerHTML = TAGS.map(tag => `
      <button type="button" class="chip ${selectedTags.includes(tag)?'selected':''}" data-tag="${tag}">
        ${I18n.t('tag_'+tag)}
      </button>
    `).join('');
    wrap.querySelectorAll('[data-tag]').forEach(b => {
      b.addEventListener('click', () => {
        const t = b.getAttribute('data-tag');
        selectedTags.includes(t)
          ? selectedTags = selectedTags.filter(x => x !== t)
          : selectedTags.push(t);
        renderTagChips();
      });
    });
  }

  function renderActivityChips(){
    const wrap = document.getElementById('activityChips');
    if(!wrap) return;
    if(!selectedActivities) selectedActivities = [];
    wrap.innerHTML = ACTIVITIES.map(k => `
      <button type="button" class="chip ${selectedActivities.includes(k)?'selected':''}" data-activity="${k}">
        ${I18n.t('activity_'+k)}
      </button>
    `).join('');
    wrap.querySelectorAll('[data-activity]').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.getAttribute('data-activity');
        selectedActivities.includes(k)
          ? selectedActivities = selectedActivities.filter(x=>x!==k)
          : selectedActivities.push(k);
        renderActivityChips();
      });
    });
  }

  function renderTriggerChips(){
    const wrap = document.getElementById('triggerChips');
    if(!wrap) return;
    wrap.innerHTML = TRIGGERS.map(k => `
      <button type="button" class="chip ${selectedTriggers.includes(k)?'selected':''}" data-trigger="${k}">
        ${I18n.t('trigger_'+k)}
      </button>
    `).join('');
    wrap.querySelectorAll('[data-trigger]').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.getAttribute('data-trigger');
        selectedTriggers.includes(k)
          ? selectedTriggers = selectedTriggers.filter(x=>x!==k)
          : selectedTriggers.push(k);
        renderTriggerChips();
      });
    });
  }

  function renderFoodChips(){
    const wrap = document.getElementById('foodChips');
    if(!wrap) return;
    wrap.innerHTML = FOOD_OPTS.map(k => `
      <button type="button" class="chip ${selectedFood===k?'selected':''}" data-food="${k}">
        ${I18n.t('food_'+k)}
      </button>
    `).join('');
    wrap.querySelectorAll('[data-food]').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.getAttribute('data-food');
        selectedFood = (selectedFood === k) ? null : k;
        renderFoodChips();
      });
    });
  }

  function renderAppetiteChips(){
    const wrap = document.getElementById('appetiteChips');
    if(!wrap) return;
    wrap.innerHTML = APPETITE.map(key => `
      <button type="button" class="chip ${selectedAppetite===key?'selected':''}" data-appetite="${key}">
        ${I18n.t('appetite_'+key)}
      </button>
    `).join('');
    wrap.querySelectorAll('[data-appetite]').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.getAttribute('data-appetite');
        selectedAppetite = (selectedAppetite === k) ? null : k;
        renderAppetiteChips();
      });
    });
  }

  // ----------------------------------------------------------------
  // Mood orb colour — Dusk (low) → Bloom (high)
  // ----------------------------------------------------------------
  function moodColor(value){
    const v = Math.max(1, Math.min(10, value));
    const t = (v - 1) / 9;
    const dusk  = [107,111,158];
    const bloom = [232,137,107];
    const rgb = dusk.map((c,i) => Math.round(c + (bloom[i]-c)*t));
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  }

  function renderOrb(value){
    const orb = document.getElementById('moodOrb');
    const mini = document.getElementById('moodOrbMini');
    if(value === null || value === undefined){
      if(orb){ orb.style.background = `radial-gradient(circle at 35% 30%, var(--dusk), var(--ink-softer) 70%)`; orb.style.boxShadow = `0 0 40px 6px rgba(107,111,158,0.35)`; orb.style.animationDuration = '5s'; }
      return;
    }
    const color = moodColor(value);
    if(orb){
      orb.style.background = `radial-gradient(circle at 35% 30%, ${color}, var(--ink-softer) 75%)`;
      orb.style.boxShadow = `0 0 44px 8px ${color}55`;
      orb.style.animationDuration = `${(6.5 - (value/10)*3).toFixed(1)}s`;
    }
    if(mini) mini.style.color = color; // subtle color hint on the brand name
  }

  function moodDescriptor(value){
    if(value <= 2) return I18n.t('mood_desc_1');
    if(value <= 4) return I18n.t('mood_desc_2');
    if(value <= 6) return I18n.t('mood_desc_3');
    if(value <= 8) return I18n.t('mood_desc_4');
    return I18n.t('mood_desc_5');
  }

  // ----------------------------------------------------------------
  // setMoreQuestionsExpanded — toggle the deep-questions panel
  // ----------------------------------------------------------------
  function setMoreQuestionsExpanded(expanded){
    const panel = document.getElementById('moreQuestionsPanel');
    const btn   = document.getElementById('moreQuestionsToggle');
    if(!panel || !btn) return;
    panel.classList.toggle('hidden', !expanded);
    btn.setAttribute('aria-expanded', String(expanded));
    btn.textContent = expanded ? I18n.t('more_questions_collapse') : I18n.t('more_questions_toggle');
  }

  // ----------------------------------------------------------------
  // openForm — populate the check-in screen from an existing entry
  // ----------------------------------------------------------------
  function openForm(prefill){
    const pf = prefill || {};

    // Determine initial mood value — from emoji selection or stored value
    const initialMood = pf.mood || 6;
    selectedEmoji   = pf.mood || null;
    selectedWeather = pf.weather || null;
    selectedSocial  = pf.social  || null;
    selectedAppetite= pf.appetite || null;
    selectedTags    = pf.tags ? pf.tags.slice() : [];

    const setSlider = (id, val, labelId) => {
      const el = document.getElementById(id); if(el) el.value = val;
      const lb = document.getElementById(labelId); if(lb) lb.textContent = val;
    };

    setSlider('moodSlider',        initialMood,               'moodValueLabel');
    setSlider('stressSlider',      pf.stressLevel    || 5,    'stressValueLabel');
    setSlider('energySlider',      pf.energy         || 5,    'energyValueLabel');
    setSlider('enjoymentSlider',   pf.enjoyment      || 5,    'enjoymentValueLabel');
    setSlider('connectionSlider',  pf.connection     || 5,    'connectionValueLabel');
    setSlider('focusSlider',       pf.focus          || 5,    'focusValueLabel');
    setSlider('sleepQualitySlider',pf.sleepQuality   || 5,    'sleepQualityValueLabel');
    setSlider('tensionSlider',     pf.tension        || 5,    'tensionValueLabel');
    setSlider('outlookSlider',     pf.outlook        || 5,    'outlookValueLabel');

    const sleepEl = document.getElementById('sleepInput');
    if(sleepEl) sleepEl.value = (pf.sleepHours !== null && pf.sleepHours !== undefined) ? pf.sleepHours : '';

    const journalEl = document.getElementById('journalInput');
    if(journalEl) journalEl.value = pf.journal || '';

    selectedTriggers   = pf.triggers   ? pf.triggers.slice()   : [];
    selectedActivities = pf.activities ? pf.activities.slice() : [];
    selectedFood       = pf.food || null;

    // Water field
    const waterEl = document.getElementById('waterInput');
    if(waterEl) waterEl.value = (pf.water !== null && pf.water !== undefined) ? pf.water : '';

    // Screen time slider
    const stEl = document.getElementById('screenTimeSlider');
    if(stEl){ stEl.value = pf.screenTime ?? 4; document.getElementById('screenTimeValueLabel').textContent = pf.screenTime ?? 4; }

    // Gratitude fields
    for(let i=0;i<3;i++){
      const el = document.getElementById('gratitude'+i);
      if(el) el.value = (pf.gratitude && pf.gratitude[i]) ? pf.gratitude[i] : '';
    }
    const winsEl = document.getElementById('dailyWinsInput');
    if(winsEl) winsEl.value = pf.dailyWins || '';

    renderEmojiPicker();
    renderWeatherChips();
    renderSocialChips();
    renderTagChips();
    renderTriggerChips();
    renderActivityChips();
    renderFoodChips();
    renderAppetiteChips();
    renderOrb(selectedEmoji);

    const hasExtra = !!(pf.energy || pf.enjoyment || pf.connection || pf.focus || pf.appetite || pf.sleepQuality || pf.tension || pf.outlook);
    setMoreQuestionsExpanded(hasExtra);
  }

  // ----------------------------------------------------------------
  // readForm — read all fields out of the check-in form
  // ----------------------------------------------------------------
  function readForm(){
    const panelExpanded = (() => {
      const p = document.getElementById('moreQuestionsPanel');
      return p && !p.classList.contains('hidden');
    })();

    const moodValue = selectedEmoji !== null
      ? selectedEmoji
      : Number(document.getElementById('moodSlider').value);

    const getSlider = (id) => {
      const el = document.getElementById(id);
      return el ? Number(el.value) : 5;
    };

    return {
      date:        Storage.todayStr(),
      mood:        moodValue,
      stressLevel: getSlider('stressSlider'),
      sleepHours:  (() => { const v = document.getElementById('sleepInput').value; return v === '' ? null : Number(v); })(),
      journal:     (document.getElementById('journalInput').value || '').trim(),
      tags:        selectedTags.slice(),
      weather:     selectedWeather,
      social:      selectedSocial,
      energy:      panelExpanded ? getSlider('energySlider')       : null,
      enjoyment:   panelExpanded ? getSlider('enjoymentSlider')    : null,
      connection:  panelExpanded ? getSlider('connectionSlider')   : null,
      focus:       panelExpanded ? getSlider('focusSlider')        : null,
      sleepQuality:panelExpanded ? getSlider('sleepQualitySlider') : null,
      tension:     panelExpanded ? getSlider('tensionSlider')      : null,
      outlook:     panelExpanded ? getSlider('outlookSlider')      : null,
      appetite:    panelExpanded ? selectedAppetite                : null,
      water:       (() => { const v = document.getElementById('waterInput')?.value; return (v===''||v==null) ? null : Number(v); })(),
      food:        selectedFood,
      screenTime:  (() => { const el = document.getElementById('screenTimeSlider'); return el ? Number(el.value) : null; })(),
      triggers:    selectedTriggers.slice(),
      activities:  selectedActivities.slice(),
      gratitude:   [0,1,2].map(i => { const el = document.getElementById('gratitude'+i); return el ? (el.value.trim()||null) : null; }),
      dailyWins:   (document.getElementById('dailyWinsInput')?.value||'').trim()||null
    };
  }

  // ----------------------------------------------------------------
  // renderTodayCard — the summary view on the Today screen
  // ----------------------------------------------------------------
  function greetingForHour(){
    const h = new Date().getHours();
    if(h < 5)  return I18n.t('greeting_uplate');
    if(h < 12) return I18n.t('greeting_morning');
    if(h < 17) return I18n.t('greeting_afternoon');
    if(h < 21) return I18n.t('greeting_evening');
    return I18n.t('greeting_night');
  }

  function renderTodayCard(){
    const settings = Storage.getSettings();
    const name     = settings.name ? `, ${settings.name}` : '';
    const today    = Storage.getTodayEntry();

    const promptCard  = document.getElementById('checkinPromptCard');
    const summaryCard = document.getElementById('todaySummaryCard');
    const subline     = document.getElementById('todaySubline');
    const greeting    = document.getElementById('greeting');

    if(today){
      promptCard.classList.add('hidden');
      summaryCard.classList.remove('hidden');
      if(greeting) greeting.textContent = `${greetingForHour()}${name}`;
      if(subline)  subline.textContent  = moodDescriptor(today.mood);
      renderOrb(today.mood);

      const emojiForMood = EMOJIS.reduce((best, e) =>
        Math.abs(e.value - today.mood) < Math.abs(best.value - today.mood) ? e : best
      );

      const bits = [];
      bits.push(`${emojiForMood.face} <strong>${today.mood}/10</strong> mood`);
      if(today.stressLevel) bits.push(`${I18n.t('field_stress')}: <strong>${today.stressLevel}/10</strong>`);
      if(today.sleepHours !== null && today.sleepHours !== undefined && today.sleepHours !== '') bits.push(`${I18n.t('field_sleep')}: <strong>${today.sleepHours}h</strong>`);
      if(today.weather) bits.push(`${weatherIcon(today.weather)} ${I18n.t('weather_'+today.weather)}`);
      if(today.social) bits.push(`${I18n.t('social_'+today.social)}`);
      if(today.energy  !== null && today.energy  !== undefined) bits.push(`${I18n.t('field_energy')}: <strong>${today.energy}/10</strong>`);
      if(today.enjoyment!==null && today.enjoyment!==undefined) bits.push(`${I18n.t('field_enjoyment')}: <strong>${today.enjoyment}/10</strong>`);
      if(today.connection!==null&&today.connection!==undefined) bits.push(`${I18n.t('field_connection')}: <strong>${today.connection}/10</strong>`);
      if(today.focus   !== null && today.focus   !== undefined) bits.push(`${I18n.t('field_focus')}: <strong>${today.focus}/10</strong>`);
      if(today.sleepQuality!==null&&today.sleepQuality!==undefined) bits.push(`${I18n.t('field_sleep_quality')}: <strong>${today.sleepQuality}/10</strong>`);
      if(today.tension !== null && today.tension !== undefined) bits.push(`${I18n.t('field_tension')}: <strong>${today.tension}/10</strong>`);
      if(today.outlook !== null && today.outlook !== undefined) bits.push(`${I18n.t('field_outlook')}: <strong>${today.outlook}/10</strong>`);
      if(today.appetite) bits.push(`${I18n.t('appetite_'+today.appetite)}`);

      const tagsHtml = today.tags.length
        ? `<div class="chip-row" style="margin-top:8px;">${today.tags.map(t=>`<span class="chip selected">${escapeHtml(I18n.t('tag_'+t))}</span>`).join('')}</div>`
        : '';

      document.getElementById('todaySummaryBody').innerHTML = `
        <p class="summary-bits">${bits.join(' · ')}</p>
        ${today.journal ? `<p class="summary-journal">"${escapeHtml(today.journal)}"</p>` : ''}
        ${tagsHtml}
      `;
    } else {
      promptCard.classList.remove('hidden');
      summaryCard.classList.add('hidden');
      if(greeting) greeting.textContent = `${I18n.t('greeting_default')}`;
      if(subline)  subline.textContent  = I18n.t('subline_none');
      renderOrb(null);
    }
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  function weatherIcon(key){
    const map = { sunny:'☀️', cloudy:'☁️', rainy:'🌧️', hot:'🔥', cold:'❄️' };
    return map[key] || '';
  }

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return {
    TAGS, WEATHER, SOCIAL, APPETITE, EMOJIS, ACTIVITIES,
    renderEmojiPicker, renderWeatherChips, renderSocialChips,
    renderTagChips, renderAppetiteChips, renderTriggerChips, renderActivityChips,
    moodColor, renderOrb, moodDescriptor,
    openForm, readForm, renderTodayCard,
    greetingForHour, setMoreQuestionsExpanded
  };
})();
