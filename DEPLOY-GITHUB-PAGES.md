# Mindora — Deploy to GitHub Pages

**Time needed:** About 10 minutes the first time.
**What you need:** A free GitHub account and the Mindora ZIP file.

---

## Step 1 — Create a GitHub account (skip if you have one)

1. Go to [github.com](https://github.com)
2. Click **Sign up**
3. Enter your email, create a password, choose a username
4. Verify your email address

---

## Step 2 — Create a new repository

1. Once logged in, click the **+** icon (top right) → **New repository**
2. Fill in:
   - **Repository name:** `mindora`
   - **Description:** My Daily Mental Wellness Companion
   - **Visibility:** ✅ Public *(GitHub Pages requires Public on free accounts)*
   - Leave everything else unchecked
3. Click **Create repository**

---

## Step 3 — Upload the Mindora files

> You have two options: drag-and-drop (easier) or GitHub Desktop (better for future updates).

### Option A — Drag and drop (easiest)

1. Unzip `mindora.zip` on your computer
2. On your new repository page, click **uploading an existing file**
3. Open your unzipped `mindora` folder on your computer
4. Select **ALL files and folders** inside it and drag them into the GitHub window
5. Scroll down, write a commit message: `Initial Mindora deployment`
6. Click **Commit changes**
7. Wait for the upload to complete (may take 30–60 seconds depending on your connection)

> **Important:** Upload the *contents* of the mindora folder (index.html, admin.html, css/, js/, etc.) — not the folder itself. Your repository root should have `index.html` directly in it.

### Option B — GitHub Desktop (recommended for ongoing updates)

1. Download [GitHub Desktop](https://desktop.github.com)
2. Sign in with your GitHub account
3. Click **Clone repository** → choose `mindora`
4. Copy the unzipped Mindora files into the cloned folder
5. In GitHub Desktop, write commit message and click **Commit to main** → **Push origin**

---

## Step 4 — Enable GitHub Pages

1. In your repository, click **Settings** (the gear icon in the top tabs)
2. Scroll down to **Pages** in the left sidebar
3. Under **Build and deployment:**
   - Source: **Deploy from a branch**
   - Branch: **main** (or **master** — whatever your default branch is)
   - Folder: **/ (root)**
4. Click **Save**
5. A banner will appear at the top: *"Your site is live at https://[your-username].github.io/mindora/"*

> GitHub Pages usually goes live within **1–3 minutes**. Refresh the page to see the URL.

---

## Step 5 — Configure your URLs

Once deployed, update two files:

### In `js/config.js`:
```javascript
// If using remote mode (Google Apps Script):
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

### In `apps-script/Code.gs` (if using email notifications):
```javascript
var ADMIN_EMAIL = 'your@email.com';
var APP_URL     = 'https://your-username.github.io/mindora/';
```

After changing `Code.gs`, remember to:
**Deploy → Manage deployments → Edit → New version → Deploy**

---

## Step 6 — Test your deployment

Visit: `https://[your-username].github.io/mindora/`

Check:
- ✅ Home screen loads with the Bloom logo
- ✅ Mood check-in works (tap an emoji)
- ✅ Today screen shows tips and affirmation
- ✅ Tools → Breathing works
- ✅ More → Support shows crisis lines
- ✅ Assessments → Start an assessment

---

## Updating Mindora after changes

Every time you get a new `mindora.zip`:
1. Unzip it
2. **Option A (web UI):** Go to your GitHub repo → drag new files over old → commit
3. **Option B (GitHub Desktop):** Copy files into the local folder → commit → push

GitHub Pages rebuilds automatically after every push — changes are usually live within 1–2 minutes.

---

## Admin panel

Access your admin panel at:
`https://[your-username].github.io/mindora/admin.html`

Default credentials:
- Username: `mind_admin`
- Password: `MindAdmin123$`

Change the password from within the admin panel (Security section).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Site shows 404 | Make sure `index.html` is in the root of the repo (not inside a subfolder) |
| Pages not enabled | Check Settings → Pages → Source is set to "Deploy from a branch" |
| Old version showing | Wait 3–5 min, then hard-refresh (Ctrl+Shift+R or Cmd+Shift+R) |
| Email notifications not working | Make sure ADMIN_EMAIL is set in Code.gs and Apps Script is redeployed with "New version" |
| Profiles not appearing in admin | If local mode: admin must be opened in the same browser where profiles were created. For cross-device: set up remote mode (Apps Script). |

---

## Your URLs at a glance

| URL | What it is |
|---|---|
| `https://[username].github.io/mindora/` | Main app |
| `https://[username].github.io/mindora/admin.html` | Admin panel |
| `https://github.com/[username]/mindora` | Your repository |
| `https://github.com/[username]/mindora/settings/pages` | Pages settings |

