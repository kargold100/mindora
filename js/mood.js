/* ====================================================
   MINDORA — mood.js
   Check-in form, tag chips, the mood orb visual, and an
   optional "a few more questions" panel covering energy,
   enjoyment, connection, focus, and appetite. Those extra
   fields are only ever saved if the person actually opened
   that panel — defaults are never silently recorded.
   ==================================================== */

const Mood = (function(){

  const TAGS = [
    'anxious','tired','stressed','overwhelmed','low',
    'calm','energised','happy','grateful','motivated',
    'lonely','irritable'
  ];

  const APPETITE = ['normal','less','more','skipped'];

  let selectedTags = [];
  let selectedAppetite = null;

  function renderTagChips(){
    const wrap = document.getElementById('tagChips');
    wrap.innerHTML = '';
    TAGS.forEach(tag => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (selectedTags.includes(tag) ? ' selected' : '');
      chip.textContent = I18n.t('tag_' + tag);
      chip.addEventListener('click', () => {
        if(selectedTags.includes(tag)){
          selectedTags = selectedTags.filter(t => t !== tag);
        } else {
          selectedTags.push(tag);
        }
        renderTagChips();
      });
      wrap.appendChild(chip);
    });
  }

  function renderAppetiteChips(){
    const wrap = document.getElementById('appetiteChips');
    if(!wrap) return;
    wrap.innerHTML = '';
    APPETITE.forEach(key => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (selectedAppetite === key ? ' selected' : '');
      chip.textContent = I18n.t('appetite_' + key);
      chip.addEventListener('click', () => {
        selectedAppetite = (selectedAppetite === key) ? null : key;
        renderAppetiteChips();
      });
      wrap.appendChild(chip);
    });
  }

  // Interpolates between Dusk (low mood, value 1) and Bloom (high mood, value 10).
  // Deliberately not red->green: low mood is not "bad", it's just lower-energy.
  function moodColor(value){
    const v = Math.max(1, Math.min(10, value));
    const t = (v - 1) / 9;
    const dusk = [107,111,158];
    const bloom = [232,137,107];
    const rgb = dusk.map((c,i) => Math.round(c + (bloom[i]-c)*t));
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  }

  function renderOrb(value){
    const orb = document.getElementById('moodOrb');
    const mini = document.getElementById('moodOrbMini');
    if(value === null || value === undefined){
      orb.style.background = `radial-gradient(circle at 35% 30%, var(--dusk), var(--ink-softer) 70%)`;
      orb.style.boxShadow = `0 0 40px 6px rgba(107,111,158,0.35)`;
      orb.style.animationDuration = '5s';
      return;
    }
    const color = moodColor(value);
    orb.style.background = `radial-gradient(circle at 35% 30%, ${color}, var(--ink-softer) 75%)`;
    orb.style.boxShadow = `0 0 44px 8px ${color}55`;
    const duration = 6.5 - (value/10)*3;
    orb.style.animationDuration = `${duration.toFixed(1)}s`;
    if(mini) mini.style.background = `radial-gradient(circle at 35% 30%, ${color}, var(--dusk))`;
  }

  function setMoreQuestionsExpanded(expanded){
    const panel = document.getElementById('moreQuestionsPanel');
    const btn = document.getElementById('moreQuestionsToggle');
    if(!panel || !btn) return;
    panel.classList.toggle('hidden', !expanded);
    btn.setAttribute('aria-expanded', String(expanded));
    btn.textContent = expanded ? I18n.t('more_questions_collapse') : I18n.t('more_questions_toggle');
  }

  function openForm(prefill){
    selectedTags = prefill ? (prefill.tags || []) : [];
    selectedAppetite = prefill ? (prefill.appetite || null) : null;

    document.getElementById('moodSlider').value = prefill ? prefill.mood : 5;
    document.getElementById('moodValueLabel').textContent = prefill ? prefill.mood : 5;
    document.getElementById('stressSlider').value = prefill && prefill.stressLevel ? prefill.stressLevel : 5;
    document.getElementById('stressValueLabel').textContent = prefill && prefill.stressLevel ? prefill.stressLevel : 5;
    document.getElementById('sleepInput').value = prefill && prefill.sleepHours !== null && prefill.sleepHours !== undefined ? prefill.sleepHours : '';
    document.getElementById('journalInput').value = prefill ? (prefill.journal || '') : '';

    const e = prefill && prefill.energy ? prefill.energy : 5;
    const en = prefill && prefill.enjoyment ? prefill.enjoyment : 5;
    const c = prefill && prefill.connection ? prefill.connection : 5;
    const f = prefill && prefill.focus ? prefill.focus : 5;
    const sq = prefill && prefill.sleepQuality ? prefill.sleepQuality : 5;
    const tn = prefill && prefill.tension ? prefill.tension : 5;
    const ol = prefill && prefill.outlook ? prefill.outlook : 5;
    document.getElementById('energySlider').value = e;
    document.getElementById('energyValueLabel').textContent = e;
    document.getElementById('enjoymentSlider').value = en;
    document.getElementById('enjoymentValueLabel').textContent = en;
    document.getElementById('connectionSlider').value = c;
    document.getElementById('connectionValueLabel').textContent = c;
    document.getElementById('focusSlider').value = f;
    document.getElementById('focusValueLabel').textContent = f;
    document.getElementById('sleepQualitySlider').value = sq;
    document.getElementById('sleepQualityValueLabel').textContent = sq;
    document.getElementById('tensionSlider').value = tn;
    document.getElementById('tensionValueLabel').textContent = tn;
    document.getElementById('outlookSlider').value = ol;
    document.getElementById('outlookValueLabel').textContent = ol;

    renderTagChips();
    renderAppetiteChips();

    const hasExtra = !!(prefill && (prefill.energy || prefill.enjoyment || prefill.connection || prefill.focus || prefill.appetite || prefill.sleepQuality || prefill.tension || prefill.outlook));
    setMoreQuestionsExpanded(hasExtra);
  }

  function readForm(){
    const panelExpanded = !document.getElementById('moreQuestionsPanel').classList.contains('hidden');
    return {
      date: Storage.todayStr(),
      mood: Number(document.getElementById('moodSlider').value),
      stressLevel: Number(document.getElementById('stressSlider').value),
      sleepHours: document.getElementById('sleepInput').value,
      journal: document.getElementById('journalInput').value.trim(),
      tags: selectedTags.slice(),
      energy: panelExpanded ? Number(document.getElementById('energySlider').value) : null,
      enjoyment: panelExpanded ? Number(document.getElementById('enjoymentSlider').value) : null,
      connection: panelExpanded ? Number(document.getElementById('connectionSlider').value) : null,
      focus: panelExpanded ? Number(document.getElementById('focusSlider').value) : null,
      sleepQuality: panelExpanded ? Number(document.getElementById('sleepQualitySlider').value) : null,
      tension: panelExpanded ? Number(document.getElementById('tensionSlider').value) : null,
      outlook: panelExpanded ? Number(document.getElementById('outlookSlider').value) : null,
      appetite: panelExpanded ? selectedAppetite : null
    };
  }

  function greetingForHour(){
    const h = new Date().getHours();
    if(h < 5) return I18n.t('greeting_uplate');
    if(h < 12) return I18n.t('greeting_morning');
    if(h < 17) return I18n.t('greeting_afternoon');
    if(h < 21) return I18n.t('greeting_evening');
    return I18n.t('greeting_night');
  }

  function renderTodayCard(){
    const settings = Storage.getSettings();
    const name = settings.name ? `, ${settings.name}` : '';
    const today = Storage.getTodayEntry();
    document.getElementById('greeting').textContent = today ? `${greetingForHour()}${name}` : `${I18n.t('greeting_default')}`;

    const promptCard = document.getElementById('checkinPromptCard');
    const summaryCard = document.getElementById('todaySummaryCard');
    const subline = document.getElementById('todaySubline');

    if(today){
      promptCard.classList.add('hidden');
      summaryCard.classList.remove('hidden');
      subline.textContent = I18n.t('subline_done');
      renderOrb(today.mood);
      const body = document.getElementById('todaySummaryBody');
      const tagsHtml = today.tags.length
        ? `<div class="chip-row" style="margin-top:8px;">${today.tags.map(t=>`<span class="chip selected">${escapeHtml(I18n.t('tag_'+t))}</span>`).join('')}</div>`
        : '';
      const sleepBit = (today.sleepHours!==null && today.sleepHours!==undefined && today.sleepHours!=='')
        ? ` · ${I18n.t('label_sleep')}: <strong>${today.sleepHours}h</strong>`
        : '';

      const extraBits = [];
      if(today.energy !== null && today.energy !== undefined) extraBits.push(`${I18n.t('field_energy')}: <strong>${today.energy}/10</strong>`);
      if(today.enjoyment !== null && today.enjoyment !== undefined) extraBits.push(`${I18n.t('field_enjoyment')}: <strong>${today.enjoyment}/10</strong>`);
      if(today.connection !== null && today.connection !== undefined) extraBits.push(`${I18n.t('field_connection')}: <strong>${today.connection}/10</strong>`);
      if(today.focus !== null && today.focus !== undefined) extraBits.push(`${I18n.t('field_focus')}: <strong>${today.focus}/10</strong>`);
      if(today.sleepQuality !== null && today.sleepQuality !== undefined) extraBits.push(`${I18n.t('field_sleep_quality')}: <strong>${today.sleepQuality}/10</strong>`);
      if(today.tension !== null && today.tension !== undefined) extraBits.push(`${I18n.t('field_tension')}: <strong>${today.tension}/10</strong>`);
      if(today.outlook !== null && today.outlook !== undefined) extraBits.push(`${I18n.t('field_outlook')}: <strong>${today.outlook}/10</strong>`);
      if(today.appetite) extraBits.push(`${I18n.t('field_appetite')}: <strong>${I18n.t('appetite_'+today.appetite)}</strong>`);
      const extraHtml = extraBits.length ? `<p class="muted" style="margin-top:6px;">${extraBits.join(' · ')}</p>` : '';

      body.innerHTML = `
        <p style="margin:0 0 4px;">${I18n.t('field_mood')}: <strong>${today.mood}/10</strong> · ${I18n.t('field_stress')}: <strong>${today.stressLevel}/10</strong>${sleepBit}</p>
        ${extraHtml}
        ${today.journal ? `<p class="muted" style="margin-top:8px;">"${escapeHtml(today.journal)}"</p>` : ''}
        ${tagsHtml}
      `;
    } else {
      promptCard.classList.remove('hidden');
      summaryCard.classList.add('hidden');
      subline.textContent = I18n.t('subline_none');
      renderOrb(null);
    }
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    TAGS, APPETITE,
    renderTagChips, renderAppetiteChips, moodColor, renderOrb,
    openForm, readForm, renderTodayCard, greetingForHour, setMoreQuestionsExpanded
  };
})();
