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
  RSVP form   ──►  submit RSVP             ──► RSVPs tab (overwrite if exists)
              ──►  submit song request      ──► Songs tab
```

---

## Features

- **Guest verification** — guests enter their name, checked against the private Guests sheet
- **RSVP form** — attending, food preference, allergies, notes, plus one support
- **Update RSVP** — guests can re-submit at any time; their existing row is overwritten, not duplicated
- **Song requests** — guests can request songs for the DJ
- **FAQ** — fully configurable in `config.js`, supports any number of questions
- **Progress bar** — animated progress indicator shown during all network requests
- **Warm-up ping** — page silently pings Apps Script on load to reduce cold-start delay
- **Title case names** — names are normalised to Title Case when saved (e.g. "ANNA" → "Anna")
- **Case-insensitive matching** — "anna", "ANNA", and "Anna" all match the guest list

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
> After each new deployment, update `WEBHOOK_URL` in `config.js` with the new URL.

**About response speed:** Apps Script can take 2–5 seconds on the first request after being idle. The page automatically sends a silent warm-up ping when it loads, so by the time a guest clicks "Find my invite" the script is already awake.

---

## Step 4 — Configure `config.js`

Open `config.js` and update the following:

```js
const DEV_MODE     = false;  // ← set to false before deploying
const WEBHOOK_URL  = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
const SECRET_TOKEN = "REPLACE_WITH_YOUR_SECRET_TOKEN";
```

Update the `FAQ` array with your actual party details. You can add as many questions as you like:

```js
const FAQ = [
  { q: "Where is the party?", a: "Your venue here." },
  { q: "What's the dress code?", a: "Your dress code here." },
  // add more...
];
```

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
- **`RSVPs` tab** — one row per guest, with timestamp and all form fields. Re-submissions overwrite the existing row.
- **`Songs` tab** — one row per song request, with guest name and timestamp

---

## Adding or removing guests

Edit the `Guests` tab in Google Sheets directly. Changes take effect immediately — no code changes needed.

---

## Updating an RSVP

Guests can re-submit their RSVP at any time:
- After verifying, the form is **pre-filled** with their previous answers
- A highlighted notice reminds them they already submitted
- On resubmit, the existing row in the `RSVPs` tab is **overwritten** (not duplicated) and the timestamp is updated
- The success message shows **"RSVP updated!"** to confirm the change
- Guests can also click **"Update my RSVP"** from the success screen to go back and edit

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
| RSVP not updating on resubmit | Make sure you redeployed Apps Script after the latest changes and updated `WEBHOOK_URL` |
| Changes to `apps-script.js` not working | Must create a **New deployment**, not edit existing — then update `WEBHOOK_URL` in `config.js` |
| FAQ not showing new questions | Upload the updated `config.js` to GitHub |
| Slow first response | Expected — Apps Script has a cold-start delay. The page auto-pings on load to minimise this. |
| DEV_MODE badge still showing | Set `DEV_MODE = false` in `config.js` |
