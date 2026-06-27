# Mindora — v1.0

A wellbeing portal with mood check-ins, mood trends, a movement + mindfulness
tracker, a Learn section with mental-health psychoeducation, a Well-being
tips library, multi-person profiles with admin management, 8 languages, a
supportive chat companion, and a transparent rule-based recommendation
engine that escalates to real human support when things look serious.

## Disclaimer

The information in **Learn** and **Well-being** is general and educational
only, put together from publicly available knowledge — it is not
personalised advice and has not been reviewed by a clinician for any
individual's specific situation. It's shown in the app itself (Settings →
Disclaimer, and inline on the Learn screen) so it's visible at the point of
use, not just buried in this file: please don't treat anything in Mindora
as a replacement for professional judgement. Read it critically, and check
anything important with a qualified GP, psychologist, or other professional
rather than relying on the app alone.

## Quick start (works immediately, no setup)

No build step. Either:
- **Netlify**: drag the whole `mindora` folder onto netlify.com/drop
- **GitHub Pages**: push this folder to a repo, enable Pages on the `main` branch
- **Local**: just open `index.html` in a browser

Out of the box, Mindora runs in **local mode**: anyone can create a profile
(name + PIN) and it works fully, but each profile is tied to one browser on
one device. To get profiles that follow you across browsers/devices, deploy
the Apps Script backend below — it's the same Google Apps Script + Sheets
pattern used in your other tools (SmartSaver, the expense tracker, PCFB).

## Admin: managing profiles

Settings has a **Manage profiles** card listing every profile by name only
— PINs are never shown there, in either direction. It can:

- **Remove** a profile (with a confirm dialog) — deletes that profile's
  data entirely (mood entries, logs, the profile row itself in remote
  mode). If you remove the profile that's currently logged in, the app
  drops back to the login screen.
- **Add** a profile on someone else's behalf (e.g. setting one up for a
  child) — this still requires entering a name and PIN *for that new
  profile* (since that's how they'll log in later), but it does **not**
  switch your own active session to it, so you stay logged in as yourself.

There's no separate admin login — whoever can already reach Settings (i.e.
whoever is logged into a profile on this device) can manage profiles. This
was a deliberate simplicity choice for a personal/family tool; it means
admin capability is implicitly available to anyone with a working profile
on the device, not gated behind a second credential.

In remote mode this calls two new Apps Script actions (`listProfiles`,
`deleteProfile`) added to `apps-script/Code.gs` — redeploy with "New
version" (see the gotcha above) if you've already deployed an older
version of the script.

## Look and feel

- Inline SVG favicon matching the brand gradient
- Tactile press feedback (`:active` scale) on all primary buttons
- The "good day" reinforcement message in recommendations now gets a sage
  border instead of the neutral indigo one, so positive feedback reads
  differently from a routine nudge at a glance
- The profile screen's brand mark now pulses gently, same animation as the
  in-app mood orb, for a more cohesive first impression before you've even
  logged in
- A muted "Mindora v1.0" version line sits at the bottom of the profile
  screen and the Disclaimer card in Settings

## Extended check-in

The daily check-in still leads with mood, tags, sleep, stress, and an
optional journal — that stays quick by design. Below it now sits a
collapsed "**+ A few more questions (optional)**" panel covering energy,
enjoyment/interest, social connection, focus, and appetite. These cover
similar ground to domains used in common mental-health screening
questionnaires (mood, interest/pleasure, energy, concentration, connection),
but deliberately **not** as a scored clinical instrument — there's no
composite score, no severity band, no diagnostic label. Each is a plain
1–10 slider (appetite is a single-select chip), feeding the same
transparent rule-based recommendation engine as everything else.

Important data-integrity detail: these five fields only get saved as
non-null if the person actually expanded that panel. If they never open it,
the fields stay `null` rather than silently recording default slider
values — so trends and recommendations are never built on answers nobody
actually gave. When editing a check-in that already has these filled in,
the panel auto-expands so they can see what they answered.

Two new escalation/routine rules came out of this: sustained low
enjoyment over 3+ days (escalation tier, same severity as sustained low
mood) and isolated low energy / low connection days (routine tier).

## Well-being section

The Learn screen now has two sub-tabs: **Understand** (the original 7
explainer topics) and **Well-being** (`js/wellbeing.js`) — six topics of
practical, ongoing habits rather than "why" explanations: sleep habits,
making movement stick, keeping social connection, a healthier relationship
with screens, gratitude without forcing positivity, and self-compassion.
Each ends in a short checklist of 3 concrete tips instead of Learn's single
"try this" line, since this section is meant as more of a tips reference
than an explainer.

Both sub-tabs share the same disclaimer line at the top of the screen.

## Learn

A 7-topic accordion (`js/learn.js`) covering general psychoeducation: why
mood naturally fluctuates, sleep's effect on mood, movement and mental
health, the stress response and breathing, grounding/coping techniques,
understanding common feelings (anxious, low, irritable, lonely — the same
words used in check-in tags), and when it's worth seeking professional
support. Each topic ends with a short "try this" tip; the last topic also
surfaces the helpline numbers inline.

This is **general information, not a diagnosis or treatment plan** — that
disclaimer sits at the top of the screen itself, not just in this README.
Content lives in `js/i18n.js` as `topic_<key>_title/teaser/body/tip` — add a
topic by adding a key to `Learn.TOPICS` in `js/learn.js` and the matching
four keys per language.

Settings moved out of the bottom tab bar into a gear icon in the header
(next to the theme toggle) to make room for Learn without crowding a sixth
tab — the bottom bar is Today / Trends / Move & Mind / Learn / Chat.

## Chat companion

A supportive chat, calling the Anthropic API (`claude-sonnet-4-6`) directly
from your browser — same pattern as StudySpark's AI Tutor: you add your own
API key in Settings, it's stored only in `localStorage` on this device,
**never synced** to your profile or the Apps Script backend regardless of
local/remote mode.

It's deliberately framed as a supportive presence, not a therapist — the
system prompt (in `js/chat.js`) tells it to validate without diagnosing, keep
replies short, and route to real helplines if anything serious comes up.
Safety here is layered on purpose, not left to the model alone: every
outgoing message is checked client-side against the same crisis-phrase list
used for journal entries, and if it matches, a deterministic helpline card
(not model-generated) appears in the thread immediately, and the global
crisis banner fires too — that doesn't depend on what the model decides to
say.

There's an optional toggle on the Chat screen to include today's check-in
(mood/stress/tags, not the journal text) as context, off by default. Chat
history is **not persisted** — it clears on reload — to avoid storing
sensitive conversational text anywhere beyond the current session.

## Accessibility

- Every form field has a properly associated `<label for=…>` (screen readers
  announce the label when you focus the field, not just visually-adjacent text)
- Icon-only buttons (theme toggle, send, delete) have translated `aria-label`s
- Visible focus ring (`:focus-visible`) on every interactive element for
  keyboard navigation
- The crisis banner and recommendation card are `aria-live`, so screen
  readers announce them as they appear, not just visually
- Nav icons are inline SVG (not emoji/unicode glyphs, which render
  inconsistently across devices and screen readers) marked `aria-hidden`
  since the text label next to each one already says what it is
- `prefers-reduced-motion` is respected (orb pulse and screen transitions
  turn off)
- Muted text contrast was bumped in light mode to clear WCAG AA for normal text

## Visual design

- Nav icons are minimal inline SVGs instead of unicode glyphs, for crisp,
  consistent rendering on every device
- A soft ambient gradient appears behind the column on wider screens (desktop
  browser testing) so it doesn't look like blank margin
- Hover states (card lift, button brighten) only apply on pointer devices
  that support hover — no sticky hover state in mobile/touch
- Chat messages render as proper bubbles with a typing indicator; the safety
  card (crisis-language detection) uses the same deep rose tone as the crisis
  banner so it reads as "this is the serious one" at a glance

## Setting up cross-device profiles (optional)

1. Create a new Google Sheet (any name, any account).
2. Extensions → Apps Script. Delete the placeholder code and paste in the
   contents of `apps-script/Code.gs`.
3. In the Apps Script editor, select the `setup` function from the dropdown
   and run it once. Approve the permissions prompt. This creates the three
   sheets (`Profiles`, `MoodEntries`, `ExerciseLogs`) with headers.
4. Deploy → New deployment → type **Web app** → Execute as **Me** → Who has
   access **Anyone** → Deploy. Copy the Web App URL.
5. Open `js/config.js` and set `APPS_SCRIPT_URL` to that URL.
6. Re-upload/redeploy the `mindora` folder.

**Important gotcha** (this one cost time on the PCFB booking system before):
whenever you edit `Code.gs` and need to push the change live, go to
**Deploy → Manage deployments → pencil icon → Version: "New version" → Deploy**.
Picking the existing version and clicking Deploy again silently keeps serving
the *old* code.

Once this is set up: creating a profile with a name + PIN on any device, then
logging in with the same name + PIN on a different browser or device, gives
you the same data. Within the same browser, the session is remembered so you
don't have to re-enter the PIN every time — only switching devices/browsers
needs it.

**Security note**: PINs are stored as plain text in the Sheet. That's fine
for a private family tool where only you can see the spreadsheet, but it's
not bank-grade — don't reuse a meaningful PIN.

## Mobile-friendliness

- 16px input font size (prevents iOS auto-zoom on focus)
- `viewport-fit=cover` + safe-area padding on the bottom nav for notched phones
- `100dvh` app height so mobile browser chrome doesn't clip the layout
- Larger tap targets on chips/buttons, `touch-action: manipulation` to cut
  tap delay, no double-tap-to-zoom
- Works as a single column up to tablet width, capped at 480px so it never
  stretches into an awkward in-between size on larger phones/foldables

## Languages

Switchable from the profile screen or Settings: English, हिन्दी, Español,
Français, Deutsch, 中文, العربية (RTL), 日本語. "Every language" wasn't
realistic to do well by hand in one pass — translation quality matters a lot
here, especially for the crisis-support text — so this is 8 well-covered
languages rather than a much longer list of shaky ones.

**Adding another language**: open `js/i18n.js`, copy the entire `en: {...}`
block, translate each value (keep the keys and any `{placeholders}`
unchanged), and add it as a new entry in `LANGS`. Add `{ code, label }` to
`LANG_META` so it shows up in the language picker. If it's a right-to-left
language, add the code to `RTL_LANGS` too.

**Please get the crisis-related strings checked by a native/fluent speaker**
before relying on them for real — `crisis_heading`, `crisis_subtext`, and the
`rec_*` escalation templates in `js/i18n.js`, plus the short crisis-phrase
list in `js/recommend.js`. I did my best, but mistranslated safety text is
worse than no translation at all.

## Structure

```
mindora/
├── index.html           profile gate + screen shell
├── css/style.css         design tokens + layout
├── apps-script/Code.gs   optional backend for cross-device profiles
└── js/
    ├── i18n.js            language dictionaries + translation helper
    ├── config.js          APPS_SCRIPT_URL (empty = local-only mode)
    ├── api.js             JSONP client for the backend
    ├── profiles.js         create/login/resume/logout, local or remote
    ├── admin.js             manage profiles (add/remove) without showing PINs
    ├── storage.js           in-memory cache + localStorage/backend persistence
    ├── recommend.js          crisis + escalation + routine recommendation engine
    ├── mood.js                check-in form, mood orb visual, tag chips
    ├── tracker.js              movement/mind exercise logging + activity feed
    ├── trends.js                line chart, heatmap, stats, tag frequency
    ├── learn.js                  mental-health psychoeducation accordion
    ├── wellbeing.js                practical well-being tips accordion
    ├── chat.js                      Anthropic API chat client + safety routing
    └── app.js                        navigation, init, theme, profile/crisis orchestration
```

## How the recommendation engine works (`js/recommend.js`)

Every suggestion maps to a visible, editable threshold — no judgement call,
just `if X for Y days, suggest Z`. Three tiers, in order of severity:

1. **Crisis language** detected in today's or the last 3 days' journal
   entries → the crisis banner (Lifeline / Beyond Blue / Suicide Call Back /
   000) pins to the top of every screen. It can be minimised but reappears
   on next load while the flag is active.
2. **Escalation** — no explicit crisis wording, but the *pattern* looks
   serious: a sharp single-day mood drop (≥4 points below the recent
   average), two consecutive very-low days (≤2/10), or a 3-day average
   ≤3.5/10. Shown as an urgent in-card message plus quick-dial helpline
   buttons (Lifeline / Beyond Blue / 000) right there in the Today screen —
   one tap to call, no need to dig through menus.
3. **Routine nudges** — everyday stuff: a single low day, high stress, short
   sleep, no movement/mindfulness in 3 days, or reinforcement on a good day.

The crisis phrase list is intentionally short and plain — a basic safety
net, not a clinical screen, covering a handful of common phrases across all
8 shipped languages (since a journal entry might be written in a different
language than the current UI). False positives are fine; missing something
matters more.

**This is not a diagnostic tool.** It doesn't replace a GP, psychologist, or
crisis service.

## Customising

- **Tags**: `Mood.TAGS` in `js/mood.js` (canonical keys; labels come from
  `tag_<key>` in `js/i18n.js`)
- **Activity types**: `Tracker.TYPES` in `js/tracker.js` (same pattern,
  `act_<key>`)
- **Crisis numbers**: edit the banner markup in `index.html` (`#crisisBanner`,
  `#escalationActions`) and the disclaimer card — currently Australian
  (Lifeline, Beyond Blue, Suicide Call Back Service, Kids Helpline, 000)
- **Escalation thresholds**: the numeric thresholds (sharp-drop size,
  very-low cutoff, sustained-average cutoff) are plain constants inline in
  `js/recommend.js` — easy to tune
- **Colour scale**: `Mood.moodColor()` in `js/mood.js` interpolates between
  the `--dusk` and `--bloom` CSS variables in `css/style.css`
- **XP / levels**: thresholds in `Gamification.getLevel()` in `js/storage.js`

## Known v2 limitations

- If the backend is unreachable mid-write (e.g. lost connection), that
  write isn't retried — it stays in the current session's view until next
  reload, then may be missing. Fine for a personal tool, worth knowing.
- RTL (Arabic) layout is best-effort: text direction and most UI mirror
  correctly, but a few absolutely-positioned elements weren't manually
  re-checked for pixel-perfect RTL placement.
- Heatmap shows the current calendar month only, no month navigation yet.
- One check-in per day (editable, not multiple per day).
- No push notifications/reminders.
- Chat calls the Anthropic API directly from the browser, which means your
  API key is visible in browser dev tools/network requests on your own
  device. Fine for personal use; don't deploy this build somewhere other
  people could open dev tools on your browser session.
- Chat is non-streaming (waits for the full reply rather than streaming
  token-by-token) — a deliberate simplicity/reliability tradeoff for this
  version.
