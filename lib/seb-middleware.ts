import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next"

// Allow static fallback values here if you need to hard-code any hashes.
// Prefer using env vars in production.
export const ALLOWED_SEB_CONFIG_KEY_HASHES: string[] = [
  // "YOUR_CONFIG_KEY_HASH_1",
  // "YOUR_CONFIG_KEY_HASH_2",
]

// Parse comma-separated env vars into arrays
function parseList(env?: string | undefined) {
  return (env || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

const ENV_ALLOWED_HASHES = parseList(process.env.SEB_ALLOWED_CONFIG_KEY_HASHES)
const ENV_ALLOWED_BEKS = parseList(process.env.SEB_ALLOWED_BROWSER_EXAM_KEYS)

// Read a header safely (Next lowercases headers)
function readHeader(req: NextApiRequest, name: string) {
  const v = req.headers[name.toLowerCase()] as string | string[] | undefined
  const raw = Array.isArray(v) ? v[0] : v
  return typeof raw === "string" ? raw.trim() : null
}

function getSebConfigKeyHash(req: NextApiRequest) {
  return readHeader(req, "x-safeexambrowser-configkeyhash") || readHeader(req, "x-safe-exam-browser-configkeyhash")
}

function getSebBrowserExamKey(req: NextApiRequest) {
  return readHeader(req, "x-safeexambrowser-browserexamkey") || readHeader(req, "x-safe-exam-browser-browserexamkey")
}

// Resolve the allowlists: env takes precedence, then hard-coded fallback.
function getAllowedHashes() {
  return ENV_ALLOWED_HASHES.length > 0 ? ENV_ALLOWED_HASHES : ALLOWED_SEB_CONFIG_KEY_HASHES
}
function getAllowedBEKs() {
  return ENV_ALLOWED_BEKS
}

// Validate function (imperative usage)
export function validateSEB(
  req: NextApiRequest,
  res: NextApiResponse,
  opts?: { allowedHashes?: string[]; allowedBEKs?: string[] },
): boolean {
  const allowedHashes = opts?.allowedHashes ?? getAllowedHashes()
  const allowedBEKs = opts?.allowedBEKs ?? getAllowedBEKs()

  const hash = getSebConfigKeyHash(req)
  const bek = getSebBrowserExamKey(req)

  const hashOk = !!hash && allowedHashes.includes(hash)
  const bekRequired = allowedBEKs.length > 0
  const bekOk = !bekRequired || (!!bek && allowedBEKs.includes(bek))

  if (!hashOk || !bekOk) {
    res.status(403).json({ error: "Access Denied: Please use Safe Exam Browser" })
    return false
  }
  return true
}

// Wrapper (preferred)
export function withSEBProtection(
  handler: NextApiHandler,
  options?: { allowedHashes?: string[]; allowedBEKs?: string[] },
): NextApiHandler {
  const allowedHashes = options?.allowedHashes ?? getAllowedHashes()
  const allowedBEKs = options?.allowedBEKs ?? getAllowedBEKs()

  return async function sebProtectedHandler(req: NextApiRequest, res: NextApiResponse) {
    const hash = getSebConfigKeyHash(req)
    const bek = getSebBrowserExamKey(req)

    const hashOk = !!hash && allowedHashes.includes(hash)
    const bekRequired = allowedBEKs.length > 0
    const bekOk = !bekRequired || (!!bek && allowedBEKs.includes(bek))

    if (!hashOk || !bekOk) {
      return res.status(403).json({ error: "Access Denied: Please use Safe Exam Browser" })
    }
    return handler(req, res)
  }
}
