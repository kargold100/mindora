/* ====================================================
   MINDORA — profiles.js
   Multiple people can use Mindora. New profiles created through
   the normal app start as "pending" and can't log in until the
   separate admin page approves them. Profiles added directly by
   the admin are auto-approved, since the admin is vouching for
   them. In LOCAL mode each profile is a separate localStorage
   bucket on this device. In REMOTE mode (APPS_SCRIPT_URL
   configured) the same name + PIN logs you into the same profile
   from any browser or device.
   ==================================================== */

const Profiles = (function(){

  const SESSION_KEY = 'mindora_session';
  const LOCAL_PROFILES_KEY = 'mindora_profiles_local';

  function isRemoteMode(){
    return Api.isConfigured();
  }

  function simpleHash(str){
    let h = 0;
    for(let i=0;i<str.length;i++){
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return String(h);
  }

  function getSession(){
    return Storage._read(SESSION_KEY, null);
  }

  function setSession(session){
    Storage._write(SESSION_KEY, session);
  }

  function clearSession(){
    try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
  }

  // ---------- Local mode ----------

  function getLocalProfiles(){
    return Storage._read(LOCAL_PROFILES_KEY, []);
  }

  function createLocalProfile(name, pin, status){
    status = status || 'pending';
    const profiles = getLocalProfiles();
    if(profiles.some(p => p.name.toLowerCase() === name.toLowerCase())){
      throw new Error('NAME_TAKEN');
    }
    const id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    profiles.push({ id, name, pinHash: simpleHash(pin), status });
    Storage._write(LOCAL_PROFILES_KEY, profiles);
    Storage._write('mindora_data_' + id, {
      moodEntries: [], exerciseLogs: [],
      settings: { name, theme: 'dark', language: I18n.getLang() },
      gamification: { xp: 0, checkinStreak: 0, lastCheckinDate: null, moveStreak: 0, lastMoveDate: null, mindStreak: 0, lastMindDate: null }
    });
    return { id, name, status };
  }

  function loginLocalProfile(name, pin){
    const profiles = getLocalProfiles();
    const match = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
    if(!match || match.pinHash !== simpleHash(pin)){
      throw new Error('INVALID');
    }
    if((match.status || 'approved') !== 'approved'){
      throw new Error('PENDING_APPROVAL');
    }
    return { id: match.id, name: match.name };
  }

  // ---------- Public actions ----------

  // Used by the main app's "Create profile" screen. Always starts pending —
  // it cannot log itself in, regardless of mode.
  async function selfRegister(name, pin){
    name = (name || '').trim();
    if(isRemoteMode()){
      const res = await Api.call('createProfile', { name, pin });
      if(res && res.error) throw new Error(res.error);
      return { profileId: res.profileId, name: res.name, status: 'pending' };
    } else {
      const res = createLocalProfile(name, pin, 'pending');
      return { profileId: res.id, name: res.name, status: 'pending' };
    }
  }

  async function login(name, pin){
    name = (name || '').trim();
    if(isRemoteMode()){
      const res = await Api.call('login', { name, pin });
      if(res && res.error) throw new Error(res.error);
      setSession({ id: res.profileId, name: res.name, mode: 'remote' });
      await Storage.hydrateFromRemote(res.profileId);
      return res;
    } else {
      const res = loginLocalProfile(name, pin); // throws PENDING_APPROVAL or INVALID
      setSession({ id: res.id, name: res.name, mode: 'local' });
      Storage.hydrateFromLocal(res.id);
      return res;
    }
  }

  async function resumeSession(){
    const session = getSession();
    if(!session) return null;
    try{
      if(session.mode === 'remote'){
        await Storage.hydrateFromRemote(session.id);
      } else {
        Storage.hydrateFromLocal(session.id);
      }
      return session;
    }catch(e){
      console.error('Mindora: could not resume session', e);
      clearSession();
      return null;
    }
  }

  function logout(){
    clearSession();
    Storage.resetCache();
  }

  // ---------- Admin: manage profiles without ever exposing PINs ----------
  // (The admin page that calls these has its own separate credential gate —
  // see admin.html / js/admin-login.js. These functions themselves don't
  // check who's calling; the gate happens before this module is ever used.)

  async function listAllProfiles(){
    if(isRemoteMode()){
      const res = await Api.call('listProfiles', {});
      if(res && res.error) throw new Error(res.error);
      return res.profiles || [];
    } else {
      return getLocalProfiles().map(p => ({ profileId: p.id, name: p.name, status: p.status || 'approved' }));
    }
  }

  async function approveProfile(profileId){
    if(isRemoteMode()){
      const res = await Api.call('approveProfile', { profileId });
      if(res && res.error) throw new Error(res.error);
    } else {
      const profiles = getLocalProfiles();
      const idx = profiles.findIndex(p => p.id === profileId);
      if(idx !== -1){
        profiles[idx].status = 'approved';
        Storage._write(LOCAL_PROFILES_KEY, profiles);
      }
    }
  }

  async function removeProfile(profileId){
    if(isRemoteMode()){
      const res = await Api.call('deleteProfile', { profileId });
      if(res && res.error) throw new Error(res.error);
    } else {
      const profiles = getLocalProfiles().filter(p => p.id !== profileId);
      Storage._write(LOCAL_PROFILES_KEY, profiles);
      try{ localStorage.removeItem('mindora_data_' + profileId); }catch(e){}
    }
    const session = getSession();
    if(session && session.id === profileId){
      logout();
    }
  }

  // Creates a profile without switching the current session to it, and
  // auto-approves it since the admin is vouching for it directly — used by
  // the admin page to add a profile on someone else's behalf.
  async function createProfileSilently(name, pin){
    name = (name || '').trim();
    if(isRemoteMode()){
      const res = await Api.call('createProfile', { name, pin, asAdmin: 'true' });
      if(res && res.error) throw new Error(res.error);
      return res;
    } else {
      return createLocalProfile(name, pin, 'approved');
    }
  }

  return {
    isRemoteMode, selfRegister, login, resumeSession, logout, getSession,
    listAllProfiles, approveProfile, removeProfile, createProfileSilently
  };
})();
