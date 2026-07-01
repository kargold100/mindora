/* ====================================================
   MINDORA — apps-script/Code.gs  (v4)

   SETUP (first time only)
   1. Create a new Google Sheet.
   2. Extensions → Apps Script. Delete default code, paste this.
   3. Run setup() from the editor — approve permissions.
   4. Deploy → New deployment → Web app
        Execute as: Me  |  Who has access: Anyone
   5. Copy the Web App URL → paste into js/config.js

   IMPORTANT: every time you change this file, you MUST:
     Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy
   Saving the script does NOT update the live deployment.
   ==================================================== */

var SHEET_PROFILES = 'Profiles';
var SHEET_MOOD     = 'MoodEntries';
var SHEET_LOGS     = 'ExerciseLogs';

// ── Setup ─────────────────────────────────────────────

function setup(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Profiles sheet — adds 'status' column if missing
  var p = ss.getSheetByName(SHEET_PROFILES);
  if(!p){
    p = ss.insertSheet(SHEET_PROFILES);
    p.appendRow(['profileId','name','pin','settingsJson','createdAt','status']);
  } else {
    // Ensure status header exists in col F
    if(!p.getRange(1,6).getValue()){
      p.getRange(1,6).setValue('status');
    }
    // Back-fill status for rows that have no value in col F
    var d = p.getDataRange().getValues();
    for(var i=1;i<d.length;i++){
      if(!d[i][5]){
        p.getRange(i+1,6).setValue('approved');
      }
    }
  }

  if(!ss.getSheetByName(SHEET_MOOD)){
    var m = ss.insertSheet(SHEET_MOOD);
    m.appendRow(['profileId','date','mood','tagsJson','journal','sleepHours','stressLevel','timestamp']);
  }
  if(!ss.getSheetByName(SHEET_LOGS)){
    var l = ss.insertSheet(SHEET_LOGS);
    l.appendRow(['profileId','id','date','category','type','duration','intensity','notes','timestamp']);
  }
  return { ok: true, message: 'Setup complete' };
}

// ── Dispatcher ────────────────────────────────────────

function doGet(e){
  var action   = e.parameter.action;
  var callback = e.parameter.callback;
  var result;

  try{
    switch(action){
      case 'setup':          result = setup(); break;
      case 'createProfile':  result = createProfile(e.parameter.name, e.parameter.pin, e.parameter.asAdmin === 'true'); break;
      case 'login':          result = login(e.parameter.name, e.parameter.pin); break;
      case 'listProfiles':   result = listProfiles(); break;
      case 'approveProfile': result = setProfileStatus(e.parameter.profileId, 'approved'); break;
      case 'lockProfile':    result = setProfileStatus(e.parameter.profileId, 'locked'); break;
      case 'unlockProfile':  result = setProfileStatus(e.parameter.profileId, 'approved'); break;
      case 'resetPin':       result = resetPin(e.parameter.profileId, e.parameter.newPin); break;
      case 'deleteProfile':  result = deleteProfile(e.parameter.profileId); break;
      case 'getData':        result = getData(e.parameter.profileId); break;
      case 'saveMood':       result = saveMood(e.parameter.profileId, JSON.parse(e.parameter.payload)); break;
      case 'saveLog':        result = saveLog(e.parameter.profileId, JSON.parse(e.parameter.payload)); break;
      case 'deleteLog':      result = deleteLogRow(e.parameter.profileId, e.parameter.logId); break;
      case 'saveSettings':   result = saveSettings(e.parameter.profileId, JSON.parse(e.parameter.payload)); break;
      case 'clearData':      result = clearData(e.parameter.profileId); break;
      case 'debugSheet':     result = debugSheet(); break;
      default: result = { error: 'UNKNOWN_ACTION: ' + action };
    }
  }catch(err){
    result = { error: 'SERVER_ERROR: ' + String(err) };
  }

  var body = callback
    ? (callback + '(' + JSON.stringify(result) + ')')
    : JSON.stringify(result);

  return ContentService.createTextOutput(body)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

// ── Helpers ───────────────────────────────────────────

function getProfileSheet(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
  if(!sheet){
    throw new Error('Profiles sheet not found. Please run setup() from the Apps Script editor first.');
  }
  return sheet;
}

function defaultSettings(name, language){
  return {
    name: name || '',
    theme: 'dark',
    language: language || 'en'
  };
}

// Read a row from the Profiles sheet by name (case-insensitive)
function findProfileRow(name){
  var sheet = getProfileSheet();
  var data  = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++){
    if(String(data[i][1]).toLowerCase() === String(name).toLowerCase()){
      return rowToProfile(data[i], i+1);
    }
  }
  return null;
}

// Read a row by profileId
function findProfileById(profileId){
  var sheet = getProfileSheet();
  var data  = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++){
    if(String(data[i][0]) === String(profileId)){
      return rowToProfile(data[i], i+1);
    }
  }
  return null;
}

// Convert a raw sheet row to a safe profile object
// Handles missing status column (older sheets)
function rowToProfile(row, rowIndex){
  var status = row.length > 5 ? String(row[5] || '') : '';
  // Handle GAS date-formatting of empty cells → they become '' or 0
  if(!status || status === '0' || status === 'NaN') status = 'approved';
  return {
    rowIndex:    rowIndex,
    profileId:   String(row[0] || ''),
    name:        String(row[1] || ''),
    pin:         String(row[2] || ''),
    settingsJson: String(row[3] || '{}'),
    status:      status
  };
}

// ── Profile actions ───────────────────────────────────

function createProfile(name, pin, asAdmin){
  name = (name || '').trim();
  if(!name)              return { error: 'NAME_REQUIRED' };
  if(!pin || String(pin).length < 4) return { error: 'PIN_TOO_SHORT' };

  var existing = findProfileRow(name);
  if(existing){
    // Tell the client the status of the existing profile
    // so it can give a more helpful message
    return { error: 'NAME_TAKEN', existingStatus: existing.status };
  }

  var sheet     = getProfileSheet();
  var profileId = Utilities.getUuid();
  var settings  = defaultSettings(name, 'en');
  var status    = asAdmin ? 'approved' : 'pending';
  sheet.appendRow([profileId, name, String(pin), JSON.stringify(settings), new Date().toISOString(), status]);
  return { profileId: profileId, name: name, status: status };
}

function login(name, pin){
  var match = findProfileRow(name);
  if(!match || String(match.pin) !== String(pin)) return { error: 'INVALID' };
  if(match.status === 'locked')          return { error: 'LOCKED' };
  if(match.status !== 'approved')        return { error: 'PENDING_APPROVAL' };
  return { profileId: match.profileId, name: match.name };
}

// ── Admin: profile management ─────────────────────────

function listProfiles(){
  var sheet = getProfileSheet();
  var data  = sheet.getDataRange().getValues();
  var profiles = [];

  for(var i=1; i<data.length; i++){
    var row = data[i];
    // Skip blank rows
    if(!row[0] && !row[1]) continue;
    var p = rowToProfile(row, i+1);
    // Only return fields needed by the admin — never return the PIN
    profiles.push({
      profileId: p.profileId,
      name:      p.name,
      status:    p.status
    });
  }

  return { profiles: profiles };
}

function setProfileStatus(profileId, status){
  var sheet = getProfileSheet();
  var data  = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++){
    if(String(data[i][0]) === String(profileId)){
      sheet.getRange(i+1, 6).setValue(status);
      return { ok: true };
    }
  }
  return { error: 'PROFILE_NOT_FOUND' };
}

function resetPin(profileId, newPin){
  if(!newPin || String(newPin).length < 4) return { error: 'PIN_TOO_SHORT' };
  var sheet = getProfileSheet();
  var data  = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++){
    if(String(data[i][0]) === String(profileId)){
      sheet.getRange(i+1, 3).setValue(String(newPin));
      return { ok: true };
    }
  }
  return { error: 'PROFILE_NOT_FOUND' };
}

function deleteProfile(profileId){
  var sheet = getProfileSheet();
  var data  = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++){
    if(String(data[i][0]) === String(profileId)){
      sheet.deleteRow(i+1);
      break;
    }
  }
  [SHEET_MOOD, SHEET_LOGS].forEach(function(name){
    var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if(!s) return;
    var d = s.getDataRange().getValues();
    for(var j=d.length-1; j>=1; j--){
      if(String(d[j][0]) === String(profileId)) s.deleteRow(j+1);
    }
  });
  return { ok: true };
}

// ── Debug: returns raw sheet info without PINs ────────
// Use the Test Connection button in admin.html to call this.
function debugSheet(){
  try{
    var sheet = getProfileSheet();
    var data  = sheet.getDataRange().getValues();
    var rows  = [];
    for(var i=0; i<Math.min(data.length, 10); i++){
      var row = data[i].slice(); // copy
      if(i > 0) row[2] = '***'; // hide PIN
      rows.push(row.map(String));
    }
    return {
      sheetName:     SHEET_PROFILES,
      totalRows:     data.length,
      headerRow:     data[0] ? data[0].map(String) : [],
      previewRows:   rows,
      hasStatusCol:  data[0] ? data[0].length >= 6 : false
    };
  }catch(err){
    return { error: String(err) };
  }
}

// ── Data storage ──────────────────────────────────────

function getData(profileId){
  var match = findProfileById(profileId);
  if(!match) return { error: 'PROFILE_NOT_FOUND' };

  var settings = {};
  try{ settings = JSON.parse(match.settingsJson); }catch(e){}

  var mood = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOOD);
  var logs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);

  var moodEntries   = [];
  var exerciseLogs  = [];

  if(mood){
    var md = mood.getDataRange().getValues();
    for(var i=1; i<md.length; i++){
      if(String(md[i][0]) !== String(profileId)) continue;
      var tags = [];
      try{ tags = JSON.parse(md[i][3]); }catch(e){}
      moodEntries.push({
        date: String(md[i][1]), mood: Number(md[i][2] || 0),
        tags: tags, journal: String(md[i][4] || ''),
        sleepHours: md[i][5] !== '' ? Number(md[i][5]) : null,
        stressLevel: md[i][6] !== '' ? Number(md[i][6]) : null,
        timestamp: Number(md[i][7] || 0)
      });
    }
  }

  if(logs){
    var ld = logs.getDataRange().getValues();
    for(var i=1; i<ld.length; i++){
      if(String(ld[i][0]) !== String(profileId)) continue;
      exerciseLogs.push({
        profileId: String(ld[i][0]), id: String(ld[i][1]),
        date: String(ld[i][2]), category: String(ld[i][3]),
        type: String(ld[i][4]), duration: Number(ld[i][5] || 0),
        intensity: ld[i][6] !== '' ? Number(ld[i][6]) : null,
        notes: String(ld[i][7] || ''), timestamp: Number(ld[i][8] || 0)
      });
    }
  }

  return { settings: settings, moodEntries: moodEntries, exerciseLogs: exerciseLogs };
}

function saveMood(profileId, entry){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOOD);
  if(!sheet) return { error: 'MOOD_SHEET_NOT_FOUND' };

  // Remove existing entry for same date
  var data = sheet.getDataRange().getValues();
  for(var i=data.length-1; i>=1; i--){
    if(String(data[i][0]) === String(profileId) && String(data[i][1]) === String(entry.date)){
      sheet.deleteRow(i+1);
    }
  }

  sheet.appendRow([
    profileId, entry.date, entry.mood,
    JSON.stringify(entry.tags || []),
    entry.journal || '',
    entry.sleepHours !== null ? entry.sleepHours : '',
    entry.stressLevel !== null ? entry.stressLevel : '',
    Date.now()
  ]);
  return { ok: true };
}

function saveLog(profileId, log){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
  if(!sheet) return { error: 'LOGS_SHEET_NOT_FOUND' };
  var id = log.id || ('log_' + Date.now());
  sheet.appendRow([
    profileId, id, log.date, log.category, log.type,
    log.duration || 0,
    log.intensity !== null ? log.intensity : '',
    log.notes || '',
    Date.now()
  ]);
  return { ok: true, id: id };
}

function deleteLogRow(profileId, logId){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
  if(!sheet) return { ok: true };
  var data = sheet.getDataRange().getValues();
  for(var i=data.length-1; i>=1; i--){
    if(String(data[i][0]) === String(profileId) && String(data[i][1]) === String(logId)){
      sheet.deleteRow(i+1);
      return { ok: true };
    }
  }
  return { ok: true };
}

function saveSettings(profileId, newSettings){
  var sheet = getProfileSheet();
  var data  = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++){
    if(String(data[i][0]) === String(profileId)){
      var existing = {};
      try{ existing = JSON.parse(data[i][3]); }catch(e){}
      var merged = Object.assign({}, existing, newSettings);
      sheet.getRange(i+1, 4).setValue(JSON.stringify(merged));
      return { ok: true };
    }
  }
  return { error: 'PROFILE_NOT_FOUND' };
}

function clearData(profileId){
  [SHEET_MOOD, SHEET_LOGS].forEach(function(name){
    var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if(!s) return;
    var d = s.getDataRange().getValues();
    for(var i=d.length-1; i>=1; i--){
      if(String(d[i][0]) === String(profileId)) s.deleteRow(i+1);
    }
  });
  return { ok: true };
}
