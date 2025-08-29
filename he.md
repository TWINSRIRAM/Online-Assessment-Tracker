## What is SEB_ALLOWED_BROWSER_EXAM_KEYS (Browser Exam Key)?
- This is an OPTIONAL allowlist for Safe Exam Browser’s Browser Exam Key (BEK).
- The BEK verifies the integrity/version/build of the SEB client. It is platform- and build-specific (e.g., different for Windows 32‑bit vs 64‑bit, macOS, and different SEB versions).
- Where to find it in SEB: In the SEB Configuration Tool, open the “Browser” tab → copy the value shown under “Browser Exam Key”. If you use multiple platforms/builds, collect each value.
- When to use it: Only if you want to additionally restrict access to specific SEB client builds. Our app already enforces the Config Key Hash via SEB_ALLOWED_CONFIG_KEY_HASHES. Adding BEK is extra tightening.
- How the app uses it: If SEB_ALLOWED_BROWSER_EXAM_KEYS is set, the server will also require the incoming SEB request to present a matching BEK hash. If not set, only Config Key Hash is validated.


### Quick reference (BEK vs Config Key Hash)
- Required: SEB_ALLOWED_CONFIG_KEY_HASHES → paste the “Config Key Hash” from your SEB config.
- Optional: SEB_ALLOWED_BROWSER_EXAM_KEYS → paste the “Browser Exam Key” (one or more, comma‑separated) if you want to restrict to specific SEB client builds.

## 20‑Minute Setup (SEB + Env)
1) Paste your SEB “Config Key Hash” into .env.local → SEB_ALLOWED_CONFIG_KEY_HASHES (comma‑separated if multiple).
2) Optional: If you want to pin to specific SEB builds, paste the “Browser Exam Key(s)” into SEB_ALLOWED_BROWSER_EXAM_KEYS (comma‑separated).
3) Local run: .env.local is now populated with your Google/NextAuth values. Start the app as usual.
4) Deploys: Add the SAME variables in Project Settings → Environment Variables (the .env file is not used by deploys).
5) Test: From Safe Exam Browser, hit the student endpoints. Non‑SEB or wrong hash → 403; valid SEB → works.

### What is SEB_ALLOWED_BROWSER_EXAM_KEYS?
- Optional allowlist for SEB’s Browser Exam Key (BEK), which is platform/build specific. Find it in SEB Config Tool → Browser tab.
- Our app already enforces the SEB Config Key Hash. Set BEK only if you want extra lock‑down to particular SEB builds.
