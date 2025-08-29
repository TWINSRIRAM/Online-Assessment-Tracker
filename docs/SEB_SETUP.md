# Safe Exam Browser (SEB) Setup — 20‑Minute Guide

This project is already wired to enforce Safe Exam Browser (SEB) on student-facing API routes. You do NOT need to modify code. Your only required action is to add one environment variable, then test with SEB.

## What’s already done in this repo

- SEB protection is active on these student-facing endpoints:
  - Pages Router:
    - pages/api/start-exam.ts
    - pages/api/questions.ts
    - pages/api/submit.ts
  - App Router:
    - app/api/questions/route.ts
    - app/api/assessment/submit/route.ts
- Shared middleware/guard:
  - lib/seb-middleware.ts
- Behavior:
  - Requests must include the header: `X-SafeExamBrowser-ConfigKeyHash`
  - The value must match an allowlisted hash; otherwise the endpoint returns 403 JSON:
    - `{ "error": "Access Denied: Please use Safe Exam Browser" }`

You do not need to change these files. They are already updated.

---

## Step 1 — Get your SEB Config Key Hash (2–3 min)

1) Open your exam configuration in the Safe Exam Browser Config Tool.
2) Locate the “Config Key Hash” (hex string).  
3) If you will distribute more than one SEB config, collect each hash.

Tip: Keep these exact values; they are case-sensitive.

---

## Step 2 — Add environment variable (2–5 min)

Add the following environment variable in your Vercel Project Settings → Environment Variables:

- Key: `SEB_ALLOWED_CONFIG_KEY_HASHES`
- Value: your hash(es), comma-separated if multiple (e.g. `HASH1,HASH2,HASH3`)

After saving, redeploy or restart the Preview to apply the new value.

---

## Step 3 — Quick verification (5–8 min)

- Valid flow (in SEB)
  - Use Safe Exam Browser configured with one of your allowlisted hashes.
  - Open your app and start an exam; the protected endpoints will behave normally.

- Invalid flow (outside SEB or wrong config)
  - Any call to a protected endpoint that is missing `X-SafeExamBrowser-ConfigKeyHash` or uses an unlisted hash will receive HTTP 403 with a JSON error message indicating SEB is required.

---

## Step 4 — Troubleshooting (3–5 min)

- “Old versions are read‑only” in the editor
  - Click “Back to Latest” (top right) to view the latest editable version.
  - If you see a “Restore” button, click it to switch to the latest editable state.

- Can’t download the project
  - In the top-right of the code preview, click the three dots (…) → “Download ZIP”.
  - Alternatively, click the GitHub icon to push to a repo, then pull locally.

- Env var changes not picked up
  - Ensure `SEB_ALLOWED_CONFIG_KEY_HASHES` is set on the correct environment (Preview/Production).
  - Redeploy the project so the new env var is available to server code.

- Want to protect more endpoints?
  - Pages Router: wrap additional student-facing API handlers with the existing SEB protection (already wired pattern).
  - App Router: use the same guard pattern already applied to `app/api/questions/route.ts` and `app/api/assessment/submit/route.ts`.

---

## Frequently Asked

- Do I need to modify any code?
  - No. The project’s code is already updated to enforce SEB on the student-facing endpoints listed above. You only need to set `SEB_ALLOWED_CONFIG_KEY_HASHES`.

- How do I confirm which endpoints are protected?
  - See the file paths listed in “What’s already done in this repo.” These files already enforce SEB. Admin endpoints are intentionally left open for normal browser access.

- What exact header is required?
  - `X-SafeExamBrowser-ConfigKeyHash`. SEB adds it automatically if your SEB client uses one of the allowed configs.

---

## Completion Checklist (≈ 20 min total)

- [ ] I copied my SEB “Config Key Hash” value(s).
- [ ] I added `SEB_ALLOWED_CONFIG_KEY_HASHES` in Project Settings (comma-separated if multiple).
- [ ] I redeployed/restarted my Preview so env vars apply.
- [ ] In SEB, exam endpoints load and submit normally.
- [ ] Outside SEB, protected endpoints return HTTP 403 with a JSON error.

You’re done. No further code edits are required.
