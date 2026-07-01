/* ====================================================
   MINDORA — profiles.js  (v3)
   Profiles with status: pending | approved | locked
   ──────────────────────────────────────────────────
   LOCAL MODE  — all data in localStorage['mindora_profiles_local']
     ● Only visible in the same browser+origin that created them
     ● Admin approval via admin.html on the SAME device
   REMOTE MODE — data in Google Sheets via Apps Script
     ● Works across any device once Apps Script URL is set
   ==================================================== */

const Profiles = (function(){

  const SESSION_KEY     = 'mindora_session';
  const LOCAL_PROFILES  = 'mindora_profiles_local';

  function isRemoteMode(){ return Api.isConfigured(); }

  // Simple non-cryptographic hash — good enough to avoid plaintext PINs
  // in localStorage; not security-grade.
  function simpleHash(str){
    let h = 0;
    for(let i=0;i<str.length;i++){ h = (Math.imul(31,h) + str.charCodeAt(i)) | 0; }
    return String(h);
  }

  // ── Session ───────────────────────────────────────

  function getSession(){ return Storage._read(SESSION_KEY, null); }
  function setSession(s){ Storage._write(SESSION_KEY, s); }
  function clearSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }

  // ── Local helpers ─────────────────────────────────

  function getLocalProfiles(){ return Storage._read(LOCAL_PROFILES, []); }
  function setLocalProfiles(list){ Storage._write(LOCAL_PROFILES, list); }

  function createLocalProfile(name, pin, status){
    const profiles = getLocalProfiles();
    if(profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) throw new Error('NAME_TAKEN');
    const id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    profiles.push({ id, name, pinHash: simpleHash(pin), status: status || 'pending' });
    setLocalProfiles(profiles);
    Storage._write('mindora_data_' + id, {
      moodEntries:[], exerciseLogs:[],
      settings:{ name, theme:'dark', language: I18n.getLang() },
      gamification:{ xp:0, checkinStreak:0, lastCheckinDate:null, moveStreak:0, lastMoveDate:null, mindStreak:0, lastMindDate:null }
    });
    return { id, name, status: status || 'pending' };
  }

  function loginLocalProfile(name, pin){
    const profiles = getLocalProfiles();
    const match = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
    if(!match || match.pinHash !== simpleHash(pin)) throw new Error('INVALID');
    const s = match.status || 'approved';
    if(s === 'pending')  throw new Error('PENDING_APPROVAL');
    if(s === 'locked')   throw new Error('LOCKED');
    return { id: match.id, name: match.name };
  }

  // ── Public: app-side actions ──────────────────────

  async function selfRegister(name, pin){
    name = (name||'').trim();
    if(isRemoteMode()){
      const res = await Api.call('createProfile', { name, pin });
      if(res && res.error){
        // If the name is taken AND the existing profile is pending,
        // tell the user their profile is already awaiting approval
        if(res.error === 'NAME_TAKEN' && res.existingStatus === 'pending'){
          throw new Error('ALREADY_PENDING');
        }
        throw new Error(res.error);
      }
      return { profileId: res.profileId, name: res.name, status: 'pending' };
    }
    // Local mode — same logic
    const profiles = getLocalProfiles();
    const existing = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
    if(existing){
      if((existing.status || 'approved') === 'pending') throw new Error('ALREADY_PENDING');
      throw new Error('NAME_TAKEN');
    }
    const res = createLocalProfile(name, pin, 'pending');
    return { profileId: res.id, name: res.name, status: 'pending' };
  }

  async function login(name, pin){
    name = (name||'').trim();
    if(isRemoteMode()){
      const res = await Api.call('login', { name, pin });
      if(res && res.error) throw new Error(res.error);
      setSession({ id: res.profileId, name: res.name, mode: 'remote' });
      await Storage.hydrateFromRemote(res.profileId);
      return res;
    }
    const res = loginLocalProfile(name, pin);
    setSession({ id: res.id, name: res.name, mode: 'local' });
    Storage.hydrateFromLocal(res.id);
    return res;
  }

  async function resumeSession(){
    const session = getSession();
    if(!session) return null;
    try{
      if(session.mode === 'remote') await Storage.hydrateFromRemote(session.id);
      else Storage.hydrateFromLocal(session.id);
      return session;
    }catch(e){
      console.error('Mindora: session resume failed', e);
      clearSession();
      return null;
    }
  }

  function logout(){ clearSession(); Storage.resetCache(); }

  // ── Admin actions ─────────────────────────────────

  async function listAllProfiles(){
    if(isRemoteMode()){
      const res = await Api.call('listProfiles', {});
      if(res && res.error) throw new Error(res.error);
      return res.profiles || [];
    }
    return getLocalProfiles().map(p => ({
      profileId: p.id, name: p.name,
      status: p.status || 'approved'
    }));
  }

  async function approveProfile(profileId){
    if(isRemoteMode()){
      const res = await Api.call('approveProfile', { profileId });
      if(res && res.error) throw new Error(res.error);
    } else {
      const list = getLocalProfiles();
      const idx = list.findIndex(p => p.id === profileId);
      if(idx !== -1){ list[idx].status = 'approved'; setLocalProfiles(list); }
    }
  }

  async function lockProfile(profileId){
    if(isRemoteMode()){
      const res = await Api.call('lockProfile', { profileId });
      if(res && res.error) throw new Error(res.error);
    } else {
      const list = getLocalProfiles();
      const idx = list.findIndex(p => p.id === profileId);
      if(idx !== -1){ list[idx].status = 'locked'; setLocalProfiles(list); }
    }
  }

  async function unlockProfile(profileId){
    if(isRemoteMode()){
      const res = await Api.call('unlockProfile', { profileId });
      if(res && res.error) throw new Error(res.error);
    } else {
      const list = getLocalProfiles();
      const idx = list.findIndex(p => p.id === profileId);
      if(idx !== -1){ list[idx].status = 'approved'; setLocalProfiles(list); }
    }
  }

  async function resetProfilePin(profileId, newPin){
    if(newPin.length < 4) throw new Error('PIN_TOO_SHORT');
    if(isRemoteMode()){
      const res = await Api.call('resetPin', { profileId, newPin });
      if(res && res.error) throw new Error(res.error);
    } else {
      const list = getLocalProfiles();
      const idx = list.findIndex(p => p.id === profileId);
      if(idx !== -1){ list[idx].pinHash = simpleHash(newPin); setLocalProfiles(list); }
      else throw new Error('PROFILE_NOT_FOUND');
    }
  }

  async function removeProfile(profileId){
    if(isRemoteMode()){
      const res = await Api.call('deleteProfile', { profileId });
      if(res && res.error) throw new Error(res.error);
    } else {
      setLocalProfiles(getLocalProfiles().filter(p => p.id !== profileId));
      try{ localStorage.removeItem('mindora_data_' + profileId); }catch(e){}
    }
    const session = getSession();
    if(session && session.id === profileId) logout();
  }

  // Creates and auto-approves — used by admin adding someone else
  async function createProfileSilently(name, pin){
    name = (name||'').trim();
    if(isRemoteMode()){
      const res = await Api.call('createProfile', { name, pin, asAdmin:'true' });
      if(res && res.error) throw new Error(res.error);
      return res;
    }
    return createLocalProfile(name, pin, 'approved');
  }

  // ── Local-mode diagnostic (admin use only) ────────
  // Returns a plain summary of what's in localStorage so the admin
  // can see if there's anything at all, even in an empty-profiles scenario.
  function localDiagnostic(){
    if(isRemoteMode()) return null;
    const profiles = getLocalProfiles();
    const keys = [];
    try{
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(k && k.startsWith('mindora_')) keys.push(k);
      }
    }catch(e){}
    return {
      profileCount: profiles.length,
      profiles: profiles.map(p => ({ name:p.name, status:p.status||'approved' })),
      mindoraKeys: keys
    };
  }

  return {
    isRemoteMode, selfRegister, login, resumeSession, logout, getSession,
    listAllProfiles, approveProfile, lockProfile, unlockProfile, resetProfilePin,
    removeProfile, createProfileSilently, localDiagnostic
  };
})();
