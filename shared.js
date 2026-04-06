/**
 * shared.js — utilities used by both index.html and main.html
 * Loaded via <script src="shared.js"></script>
 *
 * Exposes globals: sanitize, isValidName, rateLimit, apiCall, initSparkles, esc, qi, qAll
 */

"use strict";

// ═══════════════════════════════════════════════════════════════
// CONFIG — edit these in config.js, not here
// (config.js is gitignored so secrets stay off GitHub)
// ═══════════════════════════════════════════════════════════════

// ── Security ──────────────────────────────────────────────────
function sanitize(input) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, 300);
}

function isValidName(name) {
  // Letters (incl. Finnish/Nordic/accented), spaces, hyphens, apostrophes
  return /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]{1,80}$/.test(name.trim());
}

// Client-side rate limiter — backs up server-side validation
const _limits = {};
function rateLimit(key, max, ms) {
  const now = Date.now();
  const r = _limits[key] || { n: 0, t: now };
  if (now - r.t > ms) { _limits[key] = { n: 1, t: now }; return true; }
  if (r.n >= max) return false;
  _limits[key] = { ...r, n: r.n + 1 };
  return true;
}

// ── API call ──────────────────────────────────────────────────
// WEBHOOK_URL and SECRET_TOKEN must be defined in config.js
async function apiCall(action, payload) {
  if (typeof DEV_MODE !== "undefined" && DEV_MODE) {
    return devMock(action, payload);
  }
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token: SECRET_TOKEN, ...payload }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Dev mock ──────────────────────────────────────────────────
// Simulates Apps Script responses locally without any network calls.
// Mirror a few names from your real Guests sheet here for local testing.
const DEV_GUESTS = [
  { firstName: "Anna",  lastName: "Smith", plusOne: true,  alreadyRsvpd: false },
  { firstName: "John",  lastName: "Doe",   plusOne: false, alreadyRsvpd: false },
];

function devMock(action, payload) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (action === "verify") {
        const first = (payload.firstName || "").trim().toLowerCase();
        const last  = (payload.lastName  || "").trim().toLowerCase();
        const match = DEV_GUESTS.find(
          g => g.firstName.toLowerCase() === first &&
               g.lastName.toLowerCase()  === last
        );
        if (!match) { resolve({ ok: true, found: false }); return; }
        resolve({ ok: true, found: true, plusOne: match.plusOne, alreadyRsvpd: match.alreadyRsvpd });
      } else if (action === "rsvp") {
        console.log("[DEV] RSVP payload:", payload);
        resolve({ ok: true });
      } else if (action === "song") {
        console.log("[DEV] Song request:", payload);
        resolve({ ok: true });
      } else {
        resolve({ ok: false, error: "Unknown action" });
      }
    }, 600);
  });
}

// ── DOM helpers ───────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function qi(id)    { return document.getElementById(id); }
function qAll(sel) { return document.querySelectorAll(sel); }

// ── Sparkles ──────────────────────────────────────────────────
function initSparkles() {
  const c = document.getElementById("sparkles");
  if (!c) return;
  const colors = ["#e040fb", "#f5a623", "#9b59e8", "#ffffff", "#ff6bda"];
  for (let i = 0; i < 28; i++) {
    const d = document.createElement("div");
    d.className = "sparkle";
    const size = 2 + Math.random() * 4;
    d.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px; height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      --dur: ${4 + Math.random() * 6}s;
      --delay: ${Math.random() * 8}s;
    `;
    c.appendChild(d);
  }
}

// ── Session storage helpers ───────────────────────────────────
// Used to pass verified guest data from index.html → main.html
const SESSION_KEY = "wedding_guest";

function saveGuest(guest) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(guest));
}

function loadGuest() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearGuest() {
  sessionStorage.removeItem(SESSION_KEY);
}
