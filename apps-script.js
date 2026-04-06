/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         DISCO DREAM WEDDING — Apps Script Backend        ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with THREE tabs:
 *    Tab 1 name: "Guests"
 *    Tab 2 name: "RSVPs"
 *    Tab 3 name: "Songs"
 *
 * 2. "Guests" tab columns (row 1 = headers):
 *    A: FirstName | B: LastName | C: PlusOne
 *    Example row: Alice | White | TRUE
 *
 * 3. "RSVPs" and "Songs" tab columns are created automatically on first submission.
 *
 * 4. Set your secret token below (any random string you choose).
 *    Copy the same token into index.html.
 *
 * 5. Deploy:
 *    Extensions → Apps Script → Deploy → New deployment
 *    Type: Web app
 *    Execute as: Me
 *    Who has access: Anyone
 *    → Copy the Web App URL into index.html
 */

// ── CONFIG ────────────────────────────────────────────────────────
const SECRET_TOKEN   = "REPLACE_WITH_YOUR_SECRET_TOKEN"; // e.g. "disco-2025-xK9mP"
const SPREADSHEET_ID = ""; // Leave empty = uses the bound spreadsheet
                            // Or paste your Sheet ID here for standalone use
const SHEET_GUESTS   = "Guests";
const SHEET_RSVPS    = "RSVPs";
const SHEET_SONGS    = "Songs";

// ─────────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    const p      = e.parameter;
    const action = p.action;

    if (p.token !== SECRET_TOKEN) {
      return respond({ ok: false, error: "Unauthorized" });
    }

    // plusOne arrives as a JSON string — parse it back to object
    const body = Object.assign({}, p);
    if (body.plusOne && typeof body.plusOne === "string") {
      try { body.plusOne = JSON.parse(body.plusOne); } catch (_) {}
    }

    if (action === "ping")   return respond({ ok: true });
    if (action === "verify") return respond(handleVerify(body));
    if (action === "rsvp")   return respond(handleRsvp(body));
    if (action === "song")   return respond(handleSong(body));

    return respond({ ok: false, error: "Unknown action" });
  } catch (err) {
    return respond({ ok: false, error: "Server error: " + err.message });
  }
}

function doPost(_e) {
  return respond({ ok: false, error: "Use GET requests" });
}

// ── Verify guest name ─────────────────────────────────────────────
function handleVerify(body) {
  const firstName = sanitize(body.firstName || "");
  const lastName  = sanitize(body.lastName  || "");

  if (!firstName || !lastName) {
    return { ok: false, error: "Missing name" };
  }

  const sheet = getSheet(SHEET_GUESTS);
  const data  = sheet.getDataRange().getValues();

  // Row 0 = headers, skip it
  for (let i = 1; i < data.length; i++) {
    const rowFirst = String(data[i][0]).trim().toLowerCase();
    const rowLast  = String(data[i][1]).trim().toLowerCase();
    const plusOne  = String(data[i][2]).trim().toLowerCase() === "true";

    if (rowFirst === firstName.toLowerCase() &&
        rowLast  === lastName.toLowerCase()) {

      // Fetch existing RSVP if any
      const existing = getExistingRsvp(firstName, lastName);

      return {
        ok:           true,
        found:        true,
        plusOne:      plusOne,
        alreadyRsvpd: existing !== null,
        existingRsvp: existing,
      };
    }
  }

  return { ok: true, found: false };
}

// ── Fetch existing RSVP row ───────────────────────────────────────
function getExistingRsvp(firstName, lastName) {
  const sheet = getSheet(SHEET_RSVPS);
  if (sheet.getLastRow() <= 1) return null;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const f = String(data[i][1]).trim().toLowerCase();
    const l = String(data[i][2]).trim().toLowerCase();
    if (f === firstName.toLowerCase() && l === lastName.toLowerCase()) {
      return {
        attending:        data[i][3] === "Yes",
        food:             data[i][4] || "",
        allergies:        data[i][5] || "",
        notes:            data[i][6] || "",
        plusOneFirst:     data[i][7] || "",
        plusOneLast:      data[i][8] || "",
        plusOneAttending: data[i][9] === "" ? null : data[i][9] === "Yes",
        plusOneFood:      data[i][10] || "",
        plusOneAllergies: data[i][11] || "",
      };
    }
  }
  return null;
}

// ── Submit RSVP ───────────────────────────────────────────────────
function handleRsvp(body) {
  const firstName = sanitize(body.firstName || "");
  const lastName  = sanitize(body.lastName  || "");

  if (!firstName || !lastName) {
    return { ok: false, error: "Missing name" };
  }

  // Re-verify the guest exists (never trust the client)
  const verifyResult = handleVerify({ firstName, lastName, token: SECRET_TOKEN });
  if (!verifyResult.found) {
    return { ok: false, error: "Guest not found" };
  }

  const sheet = getSheet(SHEET_RSVPS);

  // Write headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp", "FirstName", "LastName",
      "Attending", "Food", "Allergies", "Notes",
      "PlusOneName", "PlusOneLastName", "PlusOneAttending",
      "PlusOneFood", "PlusOneAllergies",
    ]);
  }

  const plusOne = body.plusOne || {};
  const newRow  = [
    new Date(),
    toTitleCase(firstName),
    toTitleCase(lastName),
    body.attending     ? "Yes" : "No",
    sanitize(body.food        || ""),
    sanitize(body.allergies   || ""),
    sanitize(body.notes       || ""),
    toTitleCase(sanitize(plusOne.firstName   || "")),
    toTitleCase(sanitize(plusOne.lastName    || "")),
    plusOne.attending  !== undefined ? (plusOne.attending ? "Yes" : "No") : "",
    sanitize(plusOne.food        || ""),
    sanitize(plusOne.allergies   || ""),
  ];

  // Overwrite existing row if found, otherwise append
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const f = String(data[i][1]).trim().toLowerCase();
    const l = String(data[i][2]).trim().toLowerCase();
    if (f === firstName.toLowerCase() && l === lastName.toLowerCase()) {
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return { ok: true, updated: true };
    }
  }

  sheet.appendRow(newRow);
  return { ok: true, updated: false };
}

// ── Submit Song Request ───────────────────────────────────────────
function handleSong(body) {
  const firstName = sanitize(body.firstName || "");
  const lastName  = sanitize(body.lastName  || "");
  const song      = sanitize(body.song      || "");
  const artist    = sanitize(body.artist    || "");

  if (!song) {
    return { ok: false, error: "Song title is required" };
  }

  // Guest must be verified — re-check they're on the list
  if (!firstName || !lastName) {
    return { ok: false, error: "Missing guest name" };
  }
  const verifyResult = handleVerify({ firstName, lastName, token: SECRET_TOKEN });
  if (!verifyResult.found) {
    return { ok: false, error: "Guest not found" };
  }

  const sheet = getSheet(SHEET_SONGS);

  // Write headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "FirstName", "LastName", "Song", "Artist"]);
  }

  sheet.appendRow([new Date(), toTitleCase(firstName), toTitleCase(lastName), song, artist]);

  return { ok: true };
}

// ── Helpers ───────────────────────────────────────────────────────


function getSheet(name) {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name);
}

function sanitize(input) {
  return String(input)
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, 500);
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function respond(data, headers) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  // Note: Apps Script doesn't support custom headers on ContentService
  // CORS is handled by Google's infrastructure for doPost
  return output;
}
