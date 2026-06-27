/* ====================================================
   MINDORA — storage.js
   Holds the current profile's data in an in-memory cache for
   fast synchronous reads, and persists writes either to
   localStorage (local mode) or the Apps Script backend (remote
   mode), depending on whether APPS_SCRIPT_URL is configured.
   ==================================================== */

const Storage = (function(){

  let currentProfileId = null;
  let currentMode = 'local'; // 'local' | 'remote'

  let cache = {
    moodEntries: [],
    exerciseLogs: [],
    settings: { name: '', theme: 'dark', language: 'en' },
    gamification: { xp: 0, checkinStreak: 0, lastCheckinDate: null, moveStreak: 0, lastMoveDate: null, mindStreak: 0, lastMindDate: null }
  };

  function _read(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(e){
      console.error('Mindora storage read error for', key, e);
      return fallback;
    }
  }

  function _write(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }catch(e){
      console.error('Mindora storage write error for', key, e);
      return false;
    }
  }

  function todayStr(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function dateStrDaysAgo(n){
    const d = new Date();
    d.setDate(d.getDate()-n);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ---------- Profile lifecycle (called by profiles.js) ----------

  function setActiveProfile(profileId, mode){
    currentProfileId = profileId;
    currentMode = mode;
  }

  function getActiveProfile(){
    return { id: currentProfileId, mode: currentMode };
  }

  function localDataKey(id){ return 'mindora_data_' + id; }

  function hydrateFromLocal(profileId){
    currentProfileId = profileId;
    currentMode = 'local';
    cache = _read(localDataKey(profileId), {
      moodEntries: [], exerciseLogs: [],
      settings: { name: '', theme: 'dark', language: 'en' },
      gamification: { xp: 0, checkinStreak: 0, lastCheckinDate: null, moveStreak: 0, lastMoveDate: null, mindStreak: 0, lastMindDate: null }
    });
  }

  function writeLocalCache(){
    if(currentMode === 'local' && currentProfileId){
      _write(localDataKey(currentProfileId), cache);
    }
  }

  async function hydrateFromRemote(profileId){
    const res = await Api.call('getData', { profileId });
    if(res && res.error) throw new Error(res.error);
    currentProfileId = profileId;
    currentMode = 'remote';
    cache = {
      moodEntries: (res && res.moodEntries) || [],
      exerciseLogs: (res && res.exerciseLogs) || [],
      settings: (res && res.settings) || { name: '', theme: 'dark', language: 'en' },
      gamification: (res && res.gamification) || { xp: 0, checkinStreak: 0, lastCheckinDate: null, moveStreak: 0, lastMoveDate: null, mindStreak: 0, lastMindDate: null }
    };
  }

  function resetCache(){
    currentProfileId = null;
    currentMode = 'local';
    cache = {
      moodEntries: [], exerciseLogs: [],
      settings: { name: '', theme: 'dark', language: 'en' },
      gamification: { xp: 0, checkinStreak: 0, lastCheckinDate: null, moveStreak: 0, lastMoveDate: null, mindStreak: 0, lastMindDate: null }
    };
  }

  // ---------- Persistence helpers ----------

  function persistAfterChange(){
    if(currentMode === 'local'){
      writeLocalCache();
    }
    // remote mode persists per-action inside the functions below (each
    // write maps to one backend call), so there's nothing generic to do here.
  }

  function persistMoodRemote(record){
    Api.call('saveMood', { profileId: currentProfileId, payload: JSON.stringify(record) })
      .catch(e => console.error('Mindora sync error (mood):', e));
  }

  function persistSettingsRemote(partial){
    Api.call('saveSettings', { profileId: currentProfileId, payload: JSON.stringify(partial) })
      .catch(e => console.error('Mindora sync error (settings):', e));
  }

  // ---------- Mood entries ----------

  function getMoodEntries(){
    return cache.moodEntries;
  }

  function getTodayEntry(){
    const t = todayStr();
    return cache.moodEntries.find(e => e.date === t) || null;
  }

  function saveMoodEntry(entry){
    const record = {
      date: entry.date || todayStr(),
      mood: entry.mood,
      tags: entry.tags || [],
      journal: entry.journal || '',
      sleepHours: (entry.sleepHours === '' || entry.sleepHours === undefined) ? null : Number(entry.sleepHours),
      stressLevel: entry.stressLevel,
      energy: (entry.energy === undefined) ? null : entry.energy,
      enjoyment: (entry.enjoyment === undefined) ? null : entry.enjoyment,
      connection: (entry.connection === undefined) ? null : entry.connection,
      focus: (entry.focus === undefined) ? null : entry.focus,
      appetite: (entry.appetite === undefined) ? null : entry.appetite,
      timestamp: Date.now()
    };
    const idx = cache.moodEntries.findIndex(e => e.date === record.date);
    const isNewDay = idx === -1;
    if(idx === -1) cache.moodEntries.push(record); else cache.moodEntries[idx] = record;
    cache.moodEntries.sort((a,b) => a.date.localeCompare(b.date));

    if(currentMode === 'remote') persistMoodRemote(record);
    else persistAfterChange();

    if(isNewDay) Gamification.onCheckin(record.date);
    return record;
  }

  function getMoodEntriesInRange(days){
    const cutoff = dateStrDaysAgo(days-1);
    return cache.moodEntries.filter(e => e.date >= cutoff).sort((a,b) => a.date.localeCompare(b.date));
  }

  // ---------- Exercise logs ----------

  function getLogs(){
    return cache.exerciseLogs;
  }

  async function saveLog(log){
    const base = {
      date: log.date || todayStr(),
      category: log.category,
      type: log.type,
      duration: Number(log.duration) || 0,
      intensity: log.intensity ? Number(log.intensity) : null,
      notes: log.notes || ''
    };

    let record;
    if(currentMode === 'remote'){
      const res = await Api.call('saveLog', { profileId: currentProfileId, payload: JSON.stringify(base) });
      if(res && res.error) throw new Error(res.error);
      record = (res && res.record) || Object.assign({ id: 'log_' + Date.now() }, base, { timestamp: Date.now() });
    } else {
      record = Object.assign({ id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2,7) }, base, { timestamp: Date.now() });
    }

    cache.exerciseLogs.push(record);
    persistAfterChange();
    Gamification.onLog(record);
    return record;
  }

  function deleteLog(id){
    cache.exerciseLogs = cache.exerciseLogs.filter(l => l.id !== id);
    if(currentMode === 'remote'){
      Api.call('deleteLog', { profileId: currentProfileId, logId: id })
        .catch(e => console.error('Mindora sync error (delete log):', e));
    } else {
      persistAfterChange();
    }
  }

  function getLogsInRange(days){
    const cutoff = dateStrDaysAgo(days-1);
    return cache.exerciseLogs.filter(l => l.date >= cutoff).sort((a,b) => b.timestamp - a.timestamp);
  }

  function getRecentLogs(limit){
    return cache.exerciseLogs.slice().sort((a,b) => b.timestamp - a.timestamp).slice(0, limit || 10);
  }

  // ---------- Settings ----------

  function getSettings(){
    return cache.settings;
  }

  function saveSettings(partial){
    cache.settings = Object.assign({}, cache.settings, partial);
    if(currentMode === 'remote') persistSettingsRemote(partial);
    else persistAfterChange();
    return cache.settings;
  }

  // ---------- Gamification persistence (called from Gamification module) ----------

  function getGamification(){
    return cache.gamification;
  }

  function saveGamification(state){
    cache.gamification = state;
    if(currentMode === 'remote'){
      Api.call('saveSettings', { profileId: currentProfileId, payload: JSON.stringify({ gamification: state }) })
        .catch(e => console.error('Mindora sync error (gamification):', e));
    } else {
      persistAfterChange();
    }
  }

  // ---------- Export ----------

  function exportAllAsJson(){
    return JSON.stringify({
      moodEntries: cache.moodEntries,
      exerciseLogs: cache.exerciseLogs,
      settings: cache.settings,
      gamification: cache.gamification,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  function exportAllAsCsv(){
    let rows = [];
    rows.push(['type','date','mood','tags','sleepHours','stressLevel','energy','enjoyment','connection','focus','appetite','journal','category','activityType','duration','intensity','notes'].join(','));
    cache.moodEntries.forEach(e=>{
      rows.push(['mood', e.date, e.mood, (e.tags||[]).join('|'), e.sleepHours ?? '', e.stressLevel ?? '', e.energy ?? '', e.enjoyment ?? '', e.connection ?? '', e.focus ?? '', e.appetite ?? '', `"${(e.journal||'').replace(/"/g,'""')}"`, '','','','',''].join(','));
    });
    cache.exerciseLogs.forEach(l=>{
      rows.push(['log', l.date, '', '', '', '', '', '', '', '', '', '', l.category, l.type, l.duration, l.intensity ?? '', `"${(l.notes||'').replace(/"/g,'""')}"`].join(','));
    });
    return rows.join('\n');
  }

  function clearProfileData(){
    cache.moodEntries = [];
    cache.exerciseLogs = [];
    cache.gamification = { xp: 0, checkinStreak: 0, lastCheckinDate: null, moveStreak: 0, lastMoveDate: null, mindStreak: 0, lastMindDate: null };
    if(currentMode === 'remote'){
      Api.call('clearData', { profileId: currentProfileId }).catch(e => console.error('Mindora sync error (clear):', e));
    } else {
      persistAfterChange();
    }
  }

  return {
    todayStr,
    dateStrDaysAgo,
    _read,
    _write,
    setActiveProfile,
    getActiveProfile,
    hydrateFromLocal,
    hydrateFromRemote,
    resetCache,
    getMoodEntries,
    getTodayEntry,
    saveMoodEntry,
    getMoodEntriesInRange,
    getLogs,
    saveLog,
    deleteLog,
    getLogsInRange,
    getRecentLogs,
    getSettings,
    saveSettings,
    getGamification,
    saveGamification,
    exportAllAsJson,
    exportAllAsCsv,
    clearProfileData
  };
})();


/* ====================================================
   Gamification — small, shame-free streaks + XP
   ==================================================== */
const Gamification = (function(){

  function _isYesterday(dateStr, refStr){
    const d = new Date(dateStr);
    const ref = new Date(refStr);
    const diffDays = Math.round((ref - d) / 86400000);
    return diffDays === 1;
  }

  function _bumpStreak(currentStreak, lastDate, today){
    if(lastDate === today) return currentStreak; // already counted today
    if(lastDate && _isYesterday(lastDate, today)) return currentStreak + 1;
    return 1; // streak restarts at 1, never shown as "broken"
  }

  function onCheckin(dateStr){
    const state = Storage.getGamification();
    const today = dateStr || Storage.todayStr();
    state.checkinStreak = _bumpStreak(state.checkinStreak, state.lastCheckinDate, today);
    state.lastCheckinDate = today;
    state.xp += 10;
    Storage.saveGamification(state);
  }

  function onLog(record){
    const state = Storage.getGamification();
    const today = record.date;
    if(record.category === 'physical'){
      state.moveStreak = _bumpStreak(state.moveStreak, state.lastMoveDate, today);
      state.lastMoveDate = today;
    } else {
      state.mindStreak = _bumpStreak(state.mindStreak, state.lastMindDate, today);
      state.lastMindDate = today;
    }
    state.xp += 15;
    Storage.saveGamification(state);
  }

  function getState(){
    return Storage.getGamification();
  }

  function getLevel(){
    const xp = Storage.getGamification().xp;
    const thresholds = [0,50,120,220,360,550,800,1100,1500,2000];
    let level = 1;
    for(let i=0;i<thresholds.length;i++){
      if(xp >= thresholds[i]) level = i+1;
    }
    return level;
  }

  return { onCheckin, onLog, getState, getLevel };
})();
