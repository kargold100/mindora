/* ====================================================
   MINDORA — apps-script/Code.gs
   Backend for cross-device profiles. Deploy as a Web App and
   paste the resulting URL into js/config.js (APPS_SCRIPT_URL).

   SETUP
   1. Create a new Google Sheet (any name).
   2. Extensions -> Apps Script. Delete the default code, paste
      this whole file in.
   3. Run the `setup` function once from the editor (it creates
      the three sheets with headers). Approve the permissions
      prompt when asked.
   4. Deploy -> New deployment -> type "Web app".
        - Execute as: Me
        - Who has access: Anyone
   5. Copy the Web App URL into js/config.js as APPS_SCRIPT_URL.
   6. If you ever change the code and redeploy, you MUST go to
      Deploy -> Manage deployments -> pencil icon -> Version:
      "New version" -> Deploy. Picking the existing version
      silently keeps serving the OLD code — this has bitten past
      projects (PCFB booking system), so it's called out here too.

   SECURITY NOTE: PINs are stored as plain text in the sheet.
   This is fine for a private family tool where the sheet itself
   is only accessible to you, but it is NOT bank-grade security —
   don't reuse a meaningful PIN here.
   ==================================================== */

var SHEET_PROFILES = 'Profiles';
var SHEET_MOOD = 'MoodEntries';
var SHEET_LOGS = 'ExerciseLogs';

function setup(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if(!ss.getSheetByName(SHEET_PROFILES)){
    var p = ss.insertSheet(SHEET_PROFILES);
    p.appendRow(['profileId','name','pin','settingsJson','createdAt']);
  }
  if(!ss.getSheetByName(SHEET_MOOD)){
    var m = ss.insertSheet(SHEET_MOOD);
    m.appendRow(['profileId','date','mood','tagsJson','journal','sleepHours','stressLevel','timestamp']);
  }
  if(!ss.getSheetByName(SHEET_LOGS)){
    var l = ss.insertSheet(SHEET_LOGS);
    l.appendRow(['profileId','id','date','category','type','duration','intensity','notes','timestamp']);
  }
}

function doGet(e){
  var action = e.parameter.action;
  var callback = e.parameter.callback;
  var result;

  try{
    switch(action){
      case 'createProfile': result = createProfile(e.parameter.name, e.parameter.pin); break;
      case 'login': result = login(e.parameter.name, e.parameter.pin); break;
      case 'listProfiles': result = listProfiles(); break;
      case 'deleteProfile': result = deleteProfile(e.parameter.profileId); break;
      case 'getData': result = getData(e.parameter.profileId); break;
      case 'saveMood': result = saveMood(e.parameter.profileId, JSON.parse(e.parameter.payload)); break;
      case 'saveLog': result = saveLog(e.parameter.profileId, JSON.parse(e.parameter.payload)); break;
      case 'deleteLog': result = deleteLogRow(e.parameter.profileId, e.parameter.logId); break;
      case 'saveSettings': result = saveSettings(e.parameter.profileId, JSON.parse(e.parameter.payload)); break;
      case 'clearData': result = clearData(e.parameter.profileId); break;
      default: result = { error: 'UNKNOWN_ACTION' };
    }
  }catch(err){
    result = { error: String(err) };
  }

  var body = callback ? (callback + '(' + JSON.stringify(result) + ')') : JSON.stringify(result);
  return ContentService.createTextOutput(body)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

// ---------- Helpers ----------

function defaultSettings(name, language){
  return {
    name: name || '',
    theme: 'dark',
    language: language || 'en',
    gamification: { xp: 0, checkinStreak: 0, lastCheckinDate: null, moveStreak: 0, lastMoveDate: null, mindStreak: 0, lastMindDate: null }
  };
}

function findProfileRow(name){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
  var data = sheet.getDataRange().getValues();
  for(var i=1;i<data.length;i++){
    if(String(data[i][1]).toLowerCase() === String(name).toLowerCase()){
      return { rowIndex: i+1, profileId: data[i][0], name: data[i][1], pin: data[i][2], settingsJson: data[i][3] };
    }
  }
  return null;
}

function findProfileById(profileId){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
  var data = sheet.getDataRange().getValues();
  for(var i=1;i<data.length;i++){
    if(String(data[i][0]) === String(profileId)){
      return { rowIndex: i+1, profileId: data[i][0], name: data[i][1], pin: data[i][2], settingsJson: data[i][3] };
    }
  }
  return null;
}

// ---------- Profile actions ----------

function createProfile(name, pin){
  name = (name || '').trim();
  if(!name) return { error: 'NAME_REQUIRED' };
  if(!pin || String(pin).length < 4) return { error: 'PIN_TOO_SHORT' };
  if(findProfileRow(name)) return { error: 'NAME_TAKEN' };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
  var profileId = Utilities.getUuid();
  var settings = defaultSettings(name, 'en');
  sheet.appendRow([profileId, name, String(pin), JSON.stringify(settings), new Date().toISOString()]);
  return { profileId: profileId, name: name };
}

function login(name, pin){
  var match = findProfileRow(name);
  if(!match || String(match.pin) !== String(pin)) return { error: 'INVALID' };
  return { profileId: match.profileId, name: match.name };
}

// Admin: list profile names only — PINs are intentionally never returned.
function listProfiles(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
  var data = sheet.getDataRange().getValues();
  var profiles = [];
  for(var i=1;i<data.length;i++){
    profiles.push({ profileId: data[i][0], name: data[i][1] });
  }
  return { profiles: profiles };
}

// Admin: removes a profile row plus all of their mood entries and exercise
// logs (cascade delete) — irreversible, same as the in-app confirm warns.
function deleteProfile(profileId){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
  var data = sheet.getDataRange().getValues();
  for(var i=1;i<data.length;i++){
    if(String(data[i][0]) === String(profileId)){
      sheet.deleteRow(i+1);
      break;
    }
  }
  [SHEET_MOOD, SHEET_LOGS].forEach(function(name){
    var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    var d = s.getDataRange().getValues();
    for(var j=d.length-1;j>=1;j--){
      if(String(d[j][0]) === String(profileId)){
        s.deleteRow(j+1);
      }
    }
  });
  return { ok: true };
}

function getData(profileId){
  var profile = findProfileById(profileId);
  if(!profile) return { error: 'PROFILE_NOT_FOUND' };
  var settings;
  try{ settings = JSON.parse(profile.settingsJson); }catch(e){ settings = defaultSettings(profile.name, 'en'); }

  var moodEntries = [];
  var moodSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOOD);
  var moodData = moodSheet.getDataRange().getValues();
  for(var i=1;i<moodData.length;i++){
    if(String(moodData[i][0]) === String(profileId)){
      moodEntries.push({
        date: moodData[i][1],
        mood: moodData[i][2],
        tags: safeParseArray(moodData[i][3]),
        journal: moodData[i][4],
        sleepHours: moodData[i][5] === '' ? null : moodData[i][5],
        stressLevel: moodData[i][6],
        timestamp: moodData[i][7]
      });
    }
  }

  var exerciseLogs = [];
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
  var logData = logSheet.getDataRange().getValues();
  for(var j=1;j<logData.length;j++){
    if(String(logData[j][0]) === String(profileId)){
      exerciseLogs.push({
        id: logData[j][1],
        date: logData[j][2],
        category: logData[j][3],
        type: logData[j][4],
        duration: logData[j][5],
        intensity: logData[j][6] === '' ? null : logData[j][6],
        notes: logData[j][7],
        timestamp: logData[j][8]
      });
    }
  }

  return {
    moodEntries: moodEntries,
    exerciseLogs: exerciseLogs,
    settings: settings,
    gamification: settings.gamification || defaultSettings().gamification
  };
}

function safeParseArray(str){
  try{ var v = JSON.parse(str); return Array.isArray(v) ? v : []; }catch(e){ return []; }
}

// ---------- Mood ----------

function saveMood(profileId, entry){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOOD);
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for(var i=1;i<data.length;i++){
    if(String(data[i][0]) === String(profileId) && data[i][1] === entry.date){
      rowIndex = i+1;
      break;
    }
  }
  var row = [profileId, entry.date, entry.mood, JSON.stringify(entry.tags||[]), entry.journal||'', entry.sleepHours===null?'':entry.sleepHours, entry.stressLevel, entry.timestamp||Date.now()];
  if(rowIndex === -1){
    sheet.appendRow(row);
  } else {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  }
  return { ok: true, record: entry };
}

// ---------- Exercise logs ----------

function saveLog(profileId, log){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
  var id = Utilities.getUuid();
  var timestamp = Date.now();
  var record = {
    id: id,
    date: log.date,
    category: log.category,
    type: log.type,
    duration: log.duration,
    intensity: log.intensity,
    notes: log.notes || '',
    timestamp: timestamp
  };
  sheet.appendRow([profileId, id, record.date, record.category, record.type, record.duration, record.intensity===null?'':record.intensity, record.notes, timestamp]);
  return { ok: true, record: record };
}

function deleteLogRow(profileId, logId){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
  var data = sheet.getDataRange().getValues();
  for(var i=1;i<data.length;i++){
    if(String(data[i][0]) === String(profileId) && String(data[i][1]) === String(logId)){
      sheet.deleteRow(i+1);
      return { ok: true };
    }
  }
  return { ok: false };
}

// ---------- Settings (also receives gamification updates) ----------

function saveSettings(profileId, partial){
  var profile = findProfileById(profileId);
  if(!profile) return { error: 'PROFILE_NOT_FOUND' };
  var settings;
  try{ settings = JSON.parse(profile.settingsJson); }catch(e){ settings = defaultSettings(profile.name, 'en'); }

  Object.keys(partial).forEach(function(key){
    settings[key] = partial[key];
  });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
  sheet.getRange(profile.rowIndex, 4).setValue(JSON.stringify(settings));
  return { ok: true, settings: settings };
}

// ---------- Clear data (keeps the profile + PIN, wipes entries/logs) ----------

function clearData(profileId){
  [SHEET_MOOD, SHEET_LOGS].forEach(function(name){
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    var data = sheet.getDataRange().getValues();
    for(var i=data.length-1;i>=1;i--){
      if(String(data[i][0]) === String(profileId)){
        sheet.deleteRow(i+1);
      }
    }
  });

  var profile = findProfileById(profileId);
  if(profile){
    var settings;
    try{ settings = JSON.parse(profile.settingsJson); }catch(e){ settings = defaultSettings(profile.name, 'en'); }
    settings.gamification = defaultSettings().gamification;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
    sheet.getRange(profile.rowIndex, 4).setValue(JSON.stringify(settings));
  }
  return { ok: true };
}
