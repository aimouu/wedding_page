# 🪩 Disco Dream Wedding — Setup Guide

**Stack:** GitHub Pages · Google Sheets · Apps Script
**Cost:** €0 — no credit card needed anywhere.

---

## File structure

```
wedding/
├── main.html       ← main page (hero, FAQ, RSVP, song request)
├── shared.css      ← shared styles
├── shared.js       ← shared utilities (sanitization, API calls, sparkles)
├── config.js       ← your configuration (edit this before deploying)
├── apps-script.js  ← paste into Google Apps Script
└── README.md
```

---

## How it works

```
main.html           Apps Script (Google)       Google Sheets
  enter name  ──►  verify first+last name  ──► Guests tab (private)
  RSVP form   ──►  submit RSVP             ──► RSVPs tab
              ──►  submit song request      ──► Songs tab
```

---

## Step 1 — Google Sheet setup

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank**
2. Rename file: **"Wedding RSVPs"**
3. Create **three tabs** (rename the default one, add two more):
   - `Guests`
   - `RSVPs`
   - `Songs`

**`Guests` tab — add headers in row 1, guests from row 2:**

| A (FirstName) | B (LastName) | C (PlusOne) |
|---------------|--------------|-------------|
| Anna          | Smith        | TRUE        |
| John          | Doe          | FALSE       |

- `PlusOne`: type exactly `TRUE` or `FALSE`
- Matching is **case-insensitive** — "anna" matches "Anna", "ANNA" also matches
- Names are saved to the sheet in **Title Case** automatically (e.g. "anna smith" → "Anna Smith")
- `RSVPs` and `Songs` tabs: leave empty, headers auto-created on first submission

---

## Step 2 — Apps Script setup

1. In the Sheet: **Extensions → Apps Script**
2. Delete all existing code
3. Paste the full contents of `apps-script.js`
4. Set your secret token — change this line:
   ```js
   const SECRET_TOKEN = "REPLACE_WITH_YOUR_SECRET_TOKEN";
   ```
   Use any random string, e.g. `"disco-2025-xK9mP"`. Write it down.
5. **Save** (Ctrl+S)

---

## Step 3 — Deploy Apps Script

1. **Deploy → New deployment**
2. Gear icon ⚙ → **Web app**
3. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy** → Authorize → **Copy the Web App URL**

> ⚠️ Every time you edit `apps-script.js`, create a **New deployment**.
> Using "Manage deployments → Edit" does NOT update the live version.

**About response speed:** Apps Script can take 2–5 seconds on the first request after being idle. The page automatically sends a silent warm-up ping when it loads, so by the time a guest clicks "Find my invite" the script is already awake.

---

## Step 4 — Configure `config.js`

Open `config.js` and update the following:

```js
const DEV_MODE     = false;  // ← set to false before deploying
const WEBHOOK_URL  = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
const SECRET_TOKEN = "REPLACE_WITH_YOUR_SECRET_TOKEN";
```

Also update the `FAQ` array in `config.js` with your actual party details (date, venue, dress code, etc.).

---

## Step 5 — Publish to GitHub Pages

1. Create a free account at [github.com](https://github.com)
2. **+ → New repository** → name it `wedding` → **Public** → Create
3. Upload all files: `main.html`, `shared.css`, `shared.js`, `config.js`, `apps-script.js`
   - **Add file → Upload files** → drag all files → Commit
4. **Settings → Pages → Branch: main / root → Save**
5. Wait ~60 seconds. Your URL:
   ```
   https://YOUR-USERNAME.github.io/wedding/main.html
   ```

---

## Local testing (DEV_MODE)

With `DEV_MODE = true` in `config.js`:
- No network calls are made — works offline
- Guest verify, RSVP and song submissions are simulated using `DEV_GUESTS` in `shared.js`
- Submissions are logged to the browser console
- A yellow **DEV MODE** badge appears in the bottom-right corner

**To run locally** (required — can't open HTML files directly due to browser security):
```bash
# Python (usually already installed on Mac)
cd path/to/wedding
python3 -m http.server 8080
# open http://localhost:8080/main.html
```

**Before pushing to GitHub:**
1. Set `DEV_MODE = false` in `config.js`
2. Confirm `WEBHOOK_URL` and `SECRET_TOKEN` are correct

---

## Viewing responses

Open your Google Sheet:
- **`RSVPs` tab** — one row per guest, with timestamp and all form fields
- **`Songs` tab** — one row per song request, with guest name and timestamp

---

## Adding or removing guests

Edit the `Guests` tab in Google Sheets directly. Changes take effect immediately — no code changes needed.

---

## Updating an RSVP

Guests can re-submit their RSVP at any time. When a verified guest has already submitted:
- The form is pre-filled with their previous answers
- A notice is shown: *"You've already submitted an RSVP. You can update it below and resubmit."*
- On resubmit, the existing row in the `RSVPs` tab is **overwritten** (not duplicated) and the timestamp is updated

---

## Security

| Threat | Protection |
|---|---|
| Guest list exposed | Never sent to browser — only in Google Sheets |
| Fake RSVPs | Secret token required on every request |
| Malicious input | Sanitized in both `shared.js` and `apps-script.js` |
| Guest data visible | Private Google Sheet — only you can open it |
| Surprise bills | Impossible — both services are free with hard limits |

**Recommended:** Enable 2-step verification on your Google account →
[myaccount.google.com/security](https://myaccount.google.com/security)

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Could not connect" error | Check `WEBHOOK_URL` is correct; deployment is set to "Anyone" |
| "Unauthorized" error | `SECRET_TOKEN` in `apps-script.js` must exactly match `config.js` |
| Name not found (correct spelling) | Check for trailing spaces in the Guests sheet cells; confirm names are in the `Guests` tab, not `Songs` or `RSVPs` |
| RSVP not appearing in sheet | Confirm tab is named exactly `RSVPs` (capital R, V, P, lowercase s) |
| Changes to `apps-script.js` not working | Must create a **New deployment**, not edit existing — then update `WEBHOOK_URL` in `config.js` |
| Slow first response | Expected — Apps Script has a cold-start delay. The page auto-pings on load to minimise this. |
| DEV_MODE badge still showing | Set `DEV_MODE = false` in `config.js` |
