/* ====================================================
   MINDORA — profiles.js
   Multiple people can use Mindora. In LOCAL mode each profile is
   a separate localStorage bucket on this device. In REMOTE mode
   (APPS_SCRIPT_URL configured) the same name + PIN logs you into
   the same profile from any browser or device.
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

  function createLocalProfile(name, pin){
    const profiles = getLocalProfiles();
    if(profiles.some(p => p.name.toLowerCase() === name.toLowerCase())){
      throw new Error('NAME_TAKEN');
    }
    const id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    profiles.push({ id, name, pinHash: simpleHash(pin) });
    Storage._write(LOCAL_PROFILES_KEY, profiles);
    Storage._write('mindora_data_' + id, {
      moodEntries: [], exerciseLogs: [],
      settings: { name, theme: 'dark', language: I18n.getLang() },
      gamification: { xp: 0, checkinStreak: 0, lastCheckinDate: null, moveStreak: 0, lastMoveDate: null, mindStreak: 0, lastMindDate: null }
    });
    return { id, name };
  }

  function loginLocalProfile(name, pin){
    const profiles = getLocalProfiles();
    const match = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
    if(!match || match.pinHash !== simpleHash(pin)){
      throw new Error('INVALID');
    }
    return { id: match.id, name: match.name };
  }

  // ---------- Public actions ----------

  async function createProfile(name, pin){
    name = (name || '').trim();
    if(isRemoteMode()){
      const res = await Api.call('createProfile', { name, pin });
      if(res && res.error) throw new Error(res.error);
      setSession({ id: res.profileId, name: res.name, mode: 'remote' });
      await Storage.hydrateFromRemote(res.profileId);
      return res;
    } else {
      const res = createLocalProfile(name, pin);
      setSession({ id: res.id, name: res.name, mode: 'local' });
      Storage.hydrateFromLocal(res.id);
      return res;
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
      const res = loginLocalProfile(name, pin);
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

  async function listAllProfiles(){
    if(isRemoteMode()){
      const res = await Api.call('listProfiles', {});
      if(res && res.error) throw new Error(res.error);
      return res.profiles || [];
    } else {
      return getLocalProfiles().map(p => ({ profileId: p.id, name: p.name }));
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
    // If the removed profile is the one currently active, log out so the
    // session doesn't keep pointing at data that no longer exists.
    const session = getSession();
    if(session && session.id === profileId){
      logout();
    }
  }

  // Creates a profile without switching the current session to it — used by
  // the admin panel to add a profile on someone else's behalf (e.g. a
  // parent setting one up for a child) without logging themselves out.
  async function createProfileSilently(name, pin){
    name = (name || '').trim();
    if(isRemoteMode()){
      const res = await Api.call('createProfile', { name, pin });
      if(res && res.error) throw new Error(res.error);
      return res;
    } else {
      return createLocalProfile(name, pin);
    }
  }

  return {
    isRemoteMode, createProfile, login, resumeSession, logout, getSession,
    listAllProfiles, removeProfile, createProfileSilently
  };
})();
