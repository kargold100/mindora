/* ====================================================
   MINDORA — app.js
   Profile gate, navigation, theme, language, chat wiring, and
   the crisis/escalation banner orchestration.
   ==================================================== */

(function(){

  let crisisManuallyCollapsed = false;
  let chatCrisisFlag = false; // set true if crisis language appears in chat, independent of mood entries
  let profileMode = 'create'; // 'create' | 'login'
  let chatTyping = false;
  let learnTab = 'understand'; // 'understand' | 'wellbeing'

  // ---------- Language selects ----------

  function populateLangSelect(select){
    select.innerHTML = '';
    LANG_META.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.code; opt.textContent = l.label;
      select.appendChild(opt);
    });
    select.value = I18n.getLang();
  }

  function setLanguage(code){
    I18n.setLang(code);
    document.getElementById('profileLangSelect').value = code;
    document.getElementById('settingsLangSelect').value = code;
    const active = document.querySelector('.screen.active');
    if(active) goToScreen(active.id.replace('screen-',''));
    if(Storage.getActiveProfile().id){
      Storage.saveSettings({ language: code });
    }
  }

  // ---------- Navigation ----------

  function goToScreen(name){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + name);
    if(target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
      const isActive = b.getAttribute('data-screen') === name;
      b.classList.toggle('active', isActive);
      if(isActive) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });

    if(name === 'trends') Trends.renderAll();
    if(name === 'tracker') Tracker.renderTrackerScreen();
    if(name === 'today') refreshTodayScreen();
    if(name === 'chat') refreshChatScreen();
    if(name === 'learn') renderLearnScreen();
    if(name === 'settings') Admin.render();
    window.scrollTo(0,0);
  }

  function renderLearnScreen(){
    const subtitleEl = document.getElementById('learnSubtitleText');
    subtitleEl.setAttribute('data-i18n', learnTab === 'understand' ? 'learn_subtitle' : 'wellbeing_subtitle');
    I18n.applyStaticTranslations();
    if(learnTab === 'understand') Learn.render(); else Wellbeing.render();
  }

  function refreshTodayScreen(){
    Mood.renderTodayCard();
    renderStreakRow();
    renderRecommendations();
  }

  function renderStreakRow(){
    const state = Gamification.getState();
    const row = document.getElementById('streakRow');
    row.innerHTML = `
      <div class="streak-chip"><span class="num">${state.checkinStreak || 0}</span><span class="cap">${I18n.t('day_streak')}</span></div>
      <div class="streak-chip"><span class="num">${state.moveStreak || 0}</span><span class="cap">${I18n.t('movement')}</span></div>
      <div class="streak-chip"><span class="num">${state.mindStreak || 0}</span><span class="cap">${I18n.t('mind')}</span></div>
    `;
  }

  function renderRecommendations(){
    const result = Recommend.evaluate();
    const card = document.getElementById('recommendCard');
    const list = document.getElementById('recommendList');
    const escalation = document.getElementById('escalationActions');

    if(result.recommendations.length){
      card.classList.remove('hidden');
      list.innerHTML = result.recommendations.map(r =>
        `<li class="${r.urgent ? 'urgent' : ''}${r.positive ? 'positive' : ''}">${r.text}</li>`
      ).join('');
    } else {
      card.classList.add('hidden');
    }

    escalation.classList.toggle('hidden', !result.escalation);
    updateCrisisBanner(result.crisis || chatCrisisFlag);
  }

  function updateCrisisBanner(isCrisis){
    const banner = document.getElementById('crisisBanner');
    const reopenBtn = document.getElementById('crisisReopen');
    if(isCrisis && !crisisManuallyCollapsed){
      banner.classList.remove('hidden');
      reopenBtn.classList.add('hidden');
    } else if(isCrisis && crisisManuallyCollapsed){
      banner.classList.add('hidden');
      reopenBtn.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
      reopenBtn.classList.add('hidden');
      crisisManuallyCollapsed = false;
    }
  }

  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    if(document.getElementById('screen-trends').classList.contains('active')) Trends.renderAll();
  }

  function downloadFile(filename, content, mime){
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- Chat screen ----------

  function refreshChatScreen(){
    const has = Chat.hasApiKey();
    document.getElementById('chatApiKeyPrompt').classList.toggle('hidden', has);
    document.getElementById('chatPanel').classList.toggle('hidden', !has);
    if(has){
      const settings = Storage.getSettings();
      document.getElementById('chatContextToggle').checked = !!settings.chatIncludeContext;
      renderChatMessages();
    }
  }

  function chatBubbleHtml(msg){
    if(msg.role === 'safety'){
      return `
        <div class="chat-bubble chat-safety">
          <strong data-i18n="crisis_heading">If things feel unsafe right now, you don't have to handle it alone.</strong>
          <div class="crisis-actions" style="margin-top:8px;">
            <a href="tel:131114" class="crisis-btn-static"><span data-i18n="helpline_lifeline">Lifeline</span> · 13 11 14</a>
            <a href="tel:1300224636" class="crisis-btn-static"><span data-i18n="helpline_beyondblue">Beyond Blue</span> · 1300 22 4636</a>
            <a href="tel:000" class="crisis-btn-static"><span data-i18n="helpline_emergency">Emergency</span> · 000</a>
          </div>
        </div>`;
    }
    const cls = msg.role === 'user' ? 'chat-bubble chat-user' : 'chat-bubble chat-assistant';
    return `<div class="${cls}">${escapeHtml(msg.content)}</div>`;
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderChatMessages(){
    const container = document.getElementById('chatMessages');
    const msgs = Chat.getMessages();
    let html = msgs.map(chatBubbleHtml).join('');
    if(chatTyping){
      html += `<div class="chat-bubble chat-assistant chat-typing"><span></span><span></span><span></span></div>`;
    }
    container.innerHTML = html;
    I18n.applyStaticTranslations();
    container.scrollTop = container.scrollHeight;
  }

  async function handleChatSend(){
    const input = document.getElementById('chatInput');
    const text = input.value;
    if(!text.trim()) return;
    input.value = '';
    autoGrowChatInput(input);

    await Chat.sendMessage(text, {
      onUpdate: renderChatMessages,
      onTyping: (v) => { chatTyping = v; renderChatMessages(); },
      onNeedsApiKey: refreshChatScreen
    });
  }

  function autoGrowChatInput(el){
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  // ---------- Profile gate ----------

  function showProfileGate(){
    document.getElementById('profileGate').classList.remove('hidden');
    document.getElementById('appShell').classList.add('hidden');
    document.getElementById('profileNameInput').value = '';
    document.getElementById('profilePinInput').value = '';
    setProfileMode('create');
  }

  function setProfileMode(mode){
    profileMode = mode;
    document.getElementById('profileError').classList.add('hidden');
    if(mode === 'create'){
      document.getElementById('profileSubmitBtn').textContent = I18n.t('profile_create_btn');
      document.getElementById('profileToggleBtn').textContent = I18n.t('profile_toggle_to_login');
    } else {
      document.getElementById('profileSubmitBtn').textContent = I18n.t('profile_login_btn');
      document.getElementById('profileToggleBtn').textContent = I18n.t('profile_toggle_to_create');
    }
  }

  function showProfileError(key){
    const el = document.getElementById('profileError');
    el.textContent = I18n.t(key);
    el.classList.remove('hidden');
  }

  async function enterApp(){
    document.getElementById('profileGate').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    const settings = Storage.getSettings();
    applyTheme(settings.theme || 'dark');
    if(settings.language) setLanguage(settings.language);
    document.getElementById('nameInput').value = settings.name || '';
    document.getElementById('apiKeyInput').value = Chat.getApiKey();
    chatCrisisFlag = false;
    Chat.clearChat();
    goToScreen('today');
  }

  async function handleProfileSubmit(){
    const name = document.getElementById('profileNameInput').value.trim();
    const pin = document.getElementById('profilePinInput').value.trim();
    document.getElementById('profileError').classList.add('hidden');

    if(!name){ showProfileError('profile_error_notfound'); return; }
    if(pin.length < 4){ showProfileError('profile_error_pin'); return; }

    const btn = document.getElementById('profileSubmitBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = I18n.t('loading');

    try{
      if(profileMode === 'create'){
        await Profiles.createProfile(name, pin);
      } else {
        await Profiles.login(name, pin);
      }
      await enterApp();
    }catch(e){
      const msg = e.message;
      if(msg === 'NAME_TAKEN') showProfileError('profile_error_taken');
      else showProfileError('profile_error_notfound');
    }finally{
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  // ---------- Init ----------

  async function init(){
    I18n.init();
    populateLangSelect(document.getElementById('profileLangSelect'));
    populateLangSelect(document.getElementById('settingsLangSelect'));

    document.getElementById('profileLangSelect').addEventListener('change', e => setLanguage(e.target.value));
    document.getElementById('settingsLangSelect').addEventListener('change', e => setLanguage(e.target.value));

    document.getElementById('profileForm').addEventListener('submit', e => {
      e.preventDefault();
      handleProfileSubmit();
    });
    document.getElementById('profileToggleBtn').addEventListener('click', () => {
      setProfileMode(profileMode === 'create' ? 'login' : 'create');
    });

    setProfileMode('create');

    // Bottom nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => goToScreen(btn.getAttribute('data-screen')));
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      Storage.saveSettings({ theme: next });
      applyTheme(next);
    });

    // Settings (header gear icon, not part of the bottom tab bar)
    document.getElementById('settingsBtn').addEventListener('click', () => goToScreen('settings'));

    // Check-in flow
    document.getElementById('startCheckinBtn').addEventListener('click', () => {
      Mood.openForm(null);
      goToScreen('checkin');
    });
    document.getElementById('editCheckinBtn').addEventListener('click', () => {
      Mood.openForm(Storage.getTodayEntry());
      goToScreen('checkin');
    });
    document.getElementById('cancelCheckinBtn').addEventListener('click', () => goToScreen('today'));
    document.getElementById('saveCheckinBtn').addEventListener('click', () => {
      Storage.saveMoodEntry(Mood.readForm());
      goToScreen('today');
    });
    document.getElementById('moodSlider').addEventListener('input', e => {
      document.getElementById('moodValueLabel').textContent = e.target.value;
    });
    document.getElementById('stressSlider').addEventListener('input', e => {
      document.getElementById('stressValueLabel').textContent = e.target.value;
    });
    document.getElementById('energySlider').addEventListener('input', e => {
      document.getElementById('energyValueLabel').textContent = e.target.value;
    });
    document.getElementById('enjoymentSlider').addEventListener('input', e => {
      document.getElementById('enjoymentValueLabel').textContent = e.target.value;
    });
    document.getElementById('connectionSlider').addEventListener('input', e => {
      document.getElementById('connectionValueLabel').textContent = e.target.value;
    });
    document.getElementById('focusSlider').addEventListener('input', e => {
      document.getElementById('focusValueLabel').textContent = e.target.value;
    });
    document.getElementById('moreQuestionsToggle').addEventListener('click', () => {
      const panel = document.getElementById('moreQuestionsPanel');
      const currentlyExpanded = !panel.classList.contains('hidden');
      Mood.setMoreQuestionsExpanded(!currentlyExpanded);
    });

    // Quick-log buttons (Today + Tracker screens)
    document.querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        Tracker.openLogForm(btn.getAttribute('data-quick'));
        goToScreen('log');
      });
    });
    document.getElementById('logIntensity').addEventListener('input', e => {
      document.getElementById('intensityValueLabel').textContent = e.target.value;
    });
    document.getElementById('cancelLogBtn').addEventListener('click', () => goToScreen('tracker'));
    document.getElementById('saveLogBtn').addEventListener('click', async () => {
      const btn = document.getElementById('saveLogBtn');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = I18n.t('saving');
      try{
        await Tracker.saveFromForm();
        goToScreen('tracker');
        refreshTodayScreen();
      }catch(e){
        console.error('Mindora: could not save log', e);
      }finally{
        btn.disabled = false;
        btn.textContent = original;
      }
    });

    // Trends range tabs
    document.querySelectorAll('.range-tab[data-range]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.range-tab[data-range]').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed','false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed','true');
        Trends.setRange(Number(tab.getAttribute('data-range')));
      });
    });

    // Learn / Well-being sub-tabs
    document.querySelectorAll('#learnTabs .range-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#learnTabs .range-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed','false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed','true');
        learnTab = tab.getAttribute('data-learntab');
        renderLearnScreen();
      });
    });

    // Crisis banner controls
    document.getElementById('crisisCollapse').addEventListener('click', () => {
      crisisManuallyCollapsed = true;
      renderRecommendations();
    });
    document.getElementById('crisisReopen').addEventListener('click', () => {
      crisisManuallyCollapsed = false;
      renderRecommendations();
    });

    // Chat
    document.getElementById('chatSendBtn').addEventListener('click', handleChatSend);
    document.getElementById('chatInput').addEventListener('input', e => autoGrowChatInput(e.target));
    document.getElementById('chatInput').addEventListener('keydown', e => {
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        handleChatSend();
      }
    });
    document.getElementById('chatClearBtn').addEventListener('click', () => {
      Chat.clearChat();
      renderChatMessages();
    });
    document.getElementById('chatGoToSettingsBtn').addEventListener('click', () => goToScreen('settings'));
    document.getElementById('chatContextToggle').addEventListener('change', e => {
      Storage.saveSettings({ chatIncludeContext: e.target.checked });
    });

    // Settings
    document.getElementById('saveNameBtn').addEventListener('click', () => {
      Storage.saveSettings({ name: document.getElementById('nameInput').value.trim() });
      refreshTodayScreen();
    });
    document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
      Chat.setApiKey(document.getElementById('apiKeyInput').value);
      refreshChatScreen();
    });
    document.getElementById('exportJsonBtn').addEventListener('click', () => {
      downloadFile(`mindora-export-${Storage.todayStr()}.json`, Storage.exportAllAsJson(), 'application/json');
    });
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      downloadFile(`mindora-export-${Storage.todayStr()}.csv`, Storage.exportAllAsCsv(), 'text/csv');
    });
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      if(confirm(I18n.t('clear_data_confirm'))){
        Storage.clearProfileData();
        refreshTodayScreen();
        Tracker.renderTrackerScreen();
      }
    });
    document.getElementById('switchProfileBtn').addEventListener('click', () => {
      Profiles.logout();
      Chat.clearChat();
      chatCrisisFlag = false;
      showProfileGate();
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
      Profiles.logout();
      Chat.clearChat();
      chatCrisisFlag = false;
      showProfileGate();
    });

    // Admin: add a profile on someone else's behalf without switching session
    document.getElementById('adminAddBtn').addEventListener('click', async () => {
      const name = document.getElementById('adminNewName').value.trim();
      const pin = document.getElementById('adminNewPin').value.trim();
      const errEl = document.getElementById('adminAddError');
      errEl.classList.add('hidden');

      if(!name || pin.length < 4){
        errEl.textContent = I18n.t('profile_error_pin');
        errEl.classList.remove('hidden');
        return;
      }

      const btn = document.getElementById('adminAddBtn');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = I18n.t('loading');
      try{
        await Admin.addProfile(name, pin);
        document.getElementById('adminNewName').value = '';
        document.getElementById('adminNewPin').value = '';
      }catch(e){
        errEl.textContent = (e.message === 'NAME_TAKEN') ? I18n.t('profile_error_taken') : I18n.t('profile_error_notfound');
        errEl.classList.remove('hidden');
      }finally{
        btn.disabled = false;
        btn.textContent = original;
      }
    });

    // If an admin removes the profile that's currently logged in, fall back to the gate
    window.MindoraOnProfileRemoved = function(removedId){
      if(!Profiles.getSession()){
        Chat.clearChat();
        chatCrisisFlag = false;
        showProfileGate();
      }
    };

    // Exposed so chat.js can force the crisis banner on, independent of mood-based detection
    window.MindoraNotifyChatCrisis = function(){
      chatCrisisFlag = true;
      crisisManuallyCollapsed = false;
      renderRecommendations();
    };

    // Try to resume an existing session before showing the profile gate
    const session = await Profiles.resumeSession();
    if(session){
      await enterApp();
    } else {
      showProfileGate();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
