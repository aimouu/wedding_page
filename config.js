/**
 * config.js — THE ONLY FILE YOU EDIT BEFORE DEPLOYING
 *
 * ⚠️  If your GitHub repo is public, do NOT commit real values here.
 *     Instead, edit this file directly in the GitHub web UI after publishing
 *     (the live file gets updated without it being stored in git history).
 */

// ── Toggle dev mode ───────────────────────────────────────────────
//   true  → no network calls, simulates responses (local testing only)
//   false → calls Apps Script (production)
const DEV_MODE     = false;                          // ← set to false before deploying to GitHub

// ── Apps Script config ────────────────────────────────────────────
const WEBHOOK_URL  = "https://script.google.com/macros/s/AKfycbwZHYHNpGHJqwg8wpVgBzyP1IsnyplKisIglm5YAOfpfJTT-gmhBMgP8YMey5Bwuz9b/exec"; // ← your URL
const SECRET_TOKEN = "disco-20261010-AE";            // ← must match apps-script.js

// ── FAQ content ───────────────────────────────────────────────────
const FAQ = [
  {
    q: "Where is the party?",
    a: "Villa Romantica, Espoo. Directions will be emailed closer to the date.",
  },
  {
    q: "When is it happening?",
    a: "Saturday, 14 June 2025 — doors open at 17:00, party until midnight.",
  },
  {
    q: "What should I expect?",
    a: "Dancing, great food, open bar, and the best night of the summer. Disco vibes guaranteed. 🪩",
  },
  {
    q: "What's the dress code?",
    a: "Disco glam! Sequins, glitter, and colour encouraged. Think Studio 54.",
  },
];
