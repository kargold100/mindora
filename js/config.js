/* ====================================================
   MINDORA — config.js
   ──────────────────────────────────────────────────
   Leave APPS_SCRIPT_URL empty to run in LOCAL MODE
   (data stored per-browser, no sign-in needed, works
   offline immediately after first load).

   Set APPS_SCRIPT_URL to enable REMOTE MODE — data
   syncs across devices via Google Sheets, and the
   admin approval flow works from any browser.

   ══════════════════════════════════════════════════
   HOW TO SET UP REMOTE MODE (step-by-step)
   ══════════════════════════════════════════════════

   Step 1 — Create a Google Sheet
   ────────────────────────────────
   • Go to sheets.google.com and create a new blank sheet.
   • Give it a name you'll recognise (e.g. "Mindora Data").
   • You don't need to add any columns — the setup script
     does that automatically.

   Step 2 — Open Apps Script
   ──────────────────────────
   • In your new sheet: click  Extensions → Apps Script
   • A new Apps Script editor tab opens.
   • Delete ALL the default code in the editor.
   • Open apps-script/Code.gs from the Mindora folder
     and copy its entire contents into the editor.
   • Click  File → Save  (or Ctrl/Cmd + S).

   Step 3 — Run the setup function once
   ──────────────────────────────────────
   • In the Apps Script editor, click the function
     dropdown (it may say "myFunction") and select
     "setup" from the list.
   • Click ▷ Run.
   • When prompted, click  Review permissions → Advanced
     → Go to [project name] (unsafe) → Allow.
     (This only appears the first time; it lets the
      script write to your own Google Sheet.)
   • After it runs, check your Sheet — you should see
     three new tabs: Profiles, MoodEntries, ExerciseLogs.

   Step 4 — Deploy as a Web App
   ──────────────────────────────
   • In Apps Script: click  Deploy → New deployment.
   • Under "Select type", choose  Web app.
   • Set:
       Execute as:          Me
       Who has access:      Anyone
   • Click  Deploy.
   • Copy the Web App URL (looks like
     https://script.google.com/macros/s/ABC.../exec).

   Step 5 — Paste the URL below
   ──────────────────────────────
   • Replace the empty string with your Web App URL.
   • Save this file and redeploy Mindora to GitHub Pages.

   ──────────────────────────────────────────────────
   IMPORTANT: "New version" on every update
   ──────────────────────────────────────────────────
   Whenever you edit Code.gs and want the changes live:
     Deploy → Manage deployments → Edit (pencil icon)
     Version: New version → Deploy
   If you don't do this, the old version keeps running.

   ──────────────────────────────────────────────────
   SECURITY NOTE
   ──────────────────────────────────────────────────
   The Apps Script runs as YOUR Google account and has
   full access to the Sheet. The Web App URL is public
   (anyone with it can read/write data). Don't share
   the URL publicly. The admin credential check is in
   js/admin-login.js — see the note there about what
   it does and doesn't protect.
   ==================================================== */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3vewl3v8KqAVy4qEx03m1kYcnsVvlSUlZf5_tlbFvr6gLY9w1JxUrEU61a6TsMsNt/exec';
// Example once set up:
// const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
