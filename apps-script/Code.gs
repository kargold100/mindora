/* ====================================================
   MINDORA — apps-script/Code.gs  (v5)

   SETUP (first time only)
   1. Create a new Google Sheet.
   2. Extensions → Apps Script. Delete default code, paste this.
   3. Set ADMIN_EMAIL and APP_URL below.
   4. Run setup() from the editor — approve permissions.
      (Also approves MailApp permission for email notifications)
   5. Deploy → New deployment → Web app
        Execute as: Me  |  Who has access: Anyone
   6. Copy the Web App URL → paste into js/config.js

   EMAIL NOTIFICATIONS
   ─────────────────────────────────────────────────
   • Admin gets emailed when a new profile is registered.
   • Users get emailed when their profile is approved
     (only if they provided their email at registration).
   • All emails are sent from YOUR Google account
     (the one that owns this Apps Script).
   • Set ADMIN_EMAIL below to your email address.
   • Set APP_URL to your deployed Mindora URL.
   ==================================================== */

// ── Configuration ─────────────────────────────────────
// Set these before running setup() for the first time.

// ── Email configuration ────────────────────────────
//
// ADMIN_EMAIL — the address that receives notifications when
//   a new profile is registered. Set to your email address.
//
// APP_URL — the full URL of your deployed Mindora site.
//   Used in email links.
//
// SENDER_NAME — the display name recipients see in their inbox.
//   Recipients see:  Mindora <your-google-account@gmail.com>
//   The actual FROM address is always the Google account that
//   owns this Apps Script deployment — that can't be changed
//   without a third-party SMTP service.
//
// ── Want a completely separate sender address? ──────
// Option A (free, 5 minutes):
//   1. Create a new Google account: mindora.notify@gmail.com
//   2. Log into that account and deploy THIS Apps Script from it.
//   3. Recipients will see: Mindora <mindora.notify@gmail.com>
//   4. All other setup steps remain identical.
//
// Option B (if you own a domain):
//   1. In Gmail settings → Accounts → "Send mail as" add
//      noreply@yourdomain.com as a "Send as" alias.
//   2. Replace MailApp.sendEmail with GmailApp.sendEmail and
//      add the `from` field set to that alias.
// ────────────────────────────────────────────────────

var ADMIN_EMAIL  = 'your-admin@email.com';          // ← change this
var APP_URL      = 'https://yourdomain.github.io/mindora/'; // ← change this
var SENDER_NAME  = 'Mindora';                        // display name in inbox

// ── Sheet names ────────────────────────────────────────
var SHEET_PROFILES = 'Profiles';
var SHEET_MOOD     = 'MoodEntries';
var SHEET_LOGS     = 'ExerciseLogs';

// ── Email helpers ──────────────────────────────────────

function sendAdminNotification(name, email, timestamp){
  if(!ADMIN_EMAIL || ADMIN_EMAIL === 'your-admin@email.com') return;
  try{
    var body =
      'A new Mindora profile is waiting for your approval.\n\n' +
      'Name:       ' + name + '\n' +
      'Email:      ' + (email || '(not provided)') + '\n' +
      'Registered: ' + (timestamp || new Date().toLocaleString()) + '\n\n' +
      'Approve or manage profiles:\n' +
      APP_URL + 'admin.html\n\n' +
      '────────────────────────────────────────\n' +
      'This is an automated notification from Mindora.\n' +
      'Please do not reply to this email.';

    MailApp.sendEmail({
      to:      ADMIN_EMAIL,
      name:    SENDER_NAME,                   // ← shows as "Mindora" in inbox
      subject: '[Mindora] New profile awaiting approval: ' + name,
      body:    body,
      noReply: true                            // ← marks as no-reply header
    });
  }catch(e){
    console.log('Admin notification email failed: ' + e);
  }
}

function sendApprovalNotification(name, email){
  if(!email) return;
  try{
    var body =
      'Hi ' + name + ',\n\n' +
      'Great news — your Mindora profile has been approved.\n' +
      'You can now sign in using your name and the PIN you chose.\n\n' +
      'Open Mindora:\n' +
      APP_URL + '\n\n' +
      'If you didn\'t request this account, you can ignore this message.\n\n' +
      '────────────────────────────────────────\n' +
      'This is an automated message from Mindora.\n' +
      'Please do not reply — this address is not monitored.\n\n' +
      'Your data stays on your device or in a private Google Sheet\n' +
      'that only you control. It is never shared or sold.';

    MailApp.sendEmail({
      to:      email,
      name:    SENDER_NAME,
      subject: '[Mindora] Your profile has been approved',
      body:    body,
      noReply: true
    });
  }catch(e){
    console.log('Approval email failed: ' + e);
  }
}

function sendWeeklySummaryEmail(profileId, name, email, summaryText){
  if(!email) return;
  try{
    var body =
      'Hi ' + name + ',\n\n' +
      'Here\'s your Mindora weekly wellbeing summary:\n\n' +
      summaryText + '\n\n' +
      'Keep checking in — consistency matters more than any single day.\n\n' +
      'Open Mindora:\n' +
      APP_URL + '\n\n' +
      '────────────────────────────────────────\n' +
      'This is an automated weekly digest from Mindora.\n' +
      'To stop receiving these, ask your admin to remove your email address.';

    MailApp.sendEmail({
      to:      email,
      name:    SENDER_NAME,
      subject: '[Mindora] Your weekly wellbeing summary',
      body:    body,
      noReply: true
    });
  }catch(e){
    console.log('Weekly summary email failed: ' + e);
  }
}

// ── Setup ─────────────────────────────────────────────

function setup(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Profiles sheet — columns: profileId|name|pin|settingsJson|createdAt|status|email
  var p = ss.getSheetByName(SHEET_PROFILES);
  if(!p){
    p = ss.insertSheet(SHEET_PROFILES);
    p.appendRow(['profileId','name','pin','settingsJson','createdAt','status','email']);
  } else {
    // Ensure status header in col F
    if(!p.getRange(1,6).getValue()) p.getRange(1,6).setValue('status');
    // Ensure email header in col G
    if(!p.getRange(1,7).getValue()) p.getRange(1,7).setValue('email');
    // Back-fill status for rows with no value
    var d = p.getDataRange().getValues();
    for(var i=1;i<d.length;i++){
      if(!d[i][5]) p.getRange(i+1,6).setValue('approved');
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
      case 'resendApprovalEmail': result = resendApprovalEmail(e.parameter.profileId); break;
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
// Handles missing status/email columns (older sheets)
function rowToProfile(row, rowIndex){
  var status = row.length > 5 ? String(row[5] || '') : '';
  if(!status || status === '0' || status === 'NaN') status = 'approved';
  return {
    rowIndex:    rowIndex,
    profileId:   String(row[0] || ''),
    name:        String(row[1] || ''),
    pin:         String(row[2] || ''),
    settingsJson: String(row[3] || '{}'),
    status:      status,
    email:       row.length > 6 ? String(row[6] || '') : ''
  };
}

// ── Profile actions ───────────────────────────────────

function createProfile(name, pin, asAdmin, email){
  name  = (name  || '').trim();
  email = (email || '').trim().toLowerCase();
  if(!name)              return { error: 'NAME_REQUIRED' };
  if(!pin || String(pin).length < 4) return { error: 'PIN_TOO_SHORT' };

  var existing = findProfileRow(name);
  if(existing){
    return { error: 'NAME_TAKEN', existingStatus: existing.status };
  }

  var sheet     = getProfileSheet();
  var profileId = Utilities.getUuid();
  var settings  = defaultSettings(name, 'en');
  var status    = asAdmin ? 'approved' : 'pending';

  // Store email in col G (index 6)
  sheet.appendRow([profileId, name, String(pin), JSON.stringify(settings), new Date().toISOString(), status, email]);

  // Notify admin (remote-mode only, non-blocking)
  if(!asAdmin){
    sendAdminNotification(name, email, new Date().toLocaleString());
  }

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
    if(!row[0] && !row[1]) continue;
    var p = rowToProfile(row, i+1);
    profiles.push({
      profileId: p.profileId,
      name:      p.name,
      status:    p.status,
      email:     p.email || ''  // include email so admin can see/resend notifications
    });
  }

  return { profiles: profiles };
}

function setProfileStatus(profileId, status){
  var sheet = getProfileSheet();
  var data  = sheet.getDataRange().getValues();
  for(var i=1; i<data.length; i++){
    if(String(data[i][0]) === String(profileId)){
      var wasNotApproved = String(data[i][5] || '') !== 'approved';
      sheet.getRange(i+1, 6).setValue(status);
      // Send approval email if the user provided one
      if(status === 'approved' && wasNotApproved){
        var uname = String(data[i][1] || '');
        var uemail = String(data[i][6] || '');
        if(uemail) sendApprovalNotification(uname, uemail);
      }
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
      var row = data[i].slice();
      if(i > 0){ row[2] = '***'; } // hide PIN
      rows.push(row.map(String));
    }
    return {
      sheetName:    SHEET_PROFILES,
      totalRows:    data.length,
      headerRow:    data[0] ? data[0].map(String) : [],
      previewRows:  rows,
      hasStatusCol: data[0] ? data[0].length >= 6 : false,
      hasEmailCol:  data[0] ? data[0].length >= 7 : false,
      adminEmail:   ADMIN_EMAIL,
      appUrl:       APP_URL
    };
  }catch(err){
    return { error: String(err) };
  }
}

// Manually resend the approval email — useful if the user didn't receive it
function resendApprovalEmail(profileId){
  var p = findProfileById(profileId);
  if(!p) return { error: 'PROFILE_NOT_FOUND' };
  if(!p.email) return { error: 'NO_EMAIL', message: 'This profile has no email address on file.' };
  if(p.status !== 'approved') return { error: 'NOT_APPROVED', message: 'Profile is not yet approved.' };
  sendApprovalNotification(p.name, p.email);
  return { ok: true, sentTo: p.email };
}

// Weekly summary trigger — run this from Apps Script Triggers (Time-driven, weekly)
function weeklyDigestTrigger(){
  try{
    var sheet = getProfileSheet();
    var data  = sheet.getDataRange().getValues();
    for(var i=1; i<data.length; i++){
      var p = rowToProfile(data[i], i+1);
      if(p.status !== 'approved' || !p.email) continue;
      var summary = buildWeeklySummary(p.profileId);
      if(summary) sendWeeklySummaryEmail(p.profileId, p.name, p.email, summary);
    }
  }catch(e){
    console.log('Weekly digest error: ' + e);
  }
}

function buildWeeklySummary(profileId){
  var moodSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MOOD);
  if(!moodSheet) return null;
  var data = moodSheet.getDataRange().getValues();
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  var cutoffStr = Utilities.formatDate(cutoff, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var moods = [];
  for(var i=1; i<data.length; i++){
    if(String(data[i][0]) !== String(profileId)) continue;
    if(String(data[i][1]) < cutoffStr) continue;
    moods.push(Number(data[i][2] || 0));
  }

  if(!moods.length) return null;
  var avg = (moods.reduce(function(a,b){ return a+b; }, 0) / moods.length).toFixed(1);
  var best = Math.max.apply(null, moods);
  var worst = Math.min.apply(null, moods);

  return 'Check-ins this week: ' + moods.length + '\n' +
    'Average mood: ' + avg + '/10\n' +
    'Best day: ' + best + '/10\n' +
    'Lowest day: ' + worst + '/10\n\n' +
    'Keep it up — consistency is what matters most.';
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
