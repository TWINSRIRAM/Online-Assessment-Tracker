import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next"

// Keep allowed hashes in an array so it can be updated later.
export const ALLOWED_SEB_CONFIG_KEY_HASHES: string[] = [
  // TODO: add your real SEB Config Key Hash values here (exact strings)
  // "YOUR_CONFIG_KEY_HASH_1",
  // "YOUR_CONFIG_KEY_HASH_2",
]

// Internal helper to safely read the SEB hash from headers.
// Node/Next lower-cases header names, so we primarily check the lower-case variant.
function getSebHashFromHeaders(req: NextApiRequest): string | null {
  const fromStd = req.headers["x-safeexambrowser-configkeyhash"]
  const fromAlt = req.headers["x-safe-exam-browser-configkeyhash"] // in case some proxies mutate the name

  const raw = (Array.isArray(fromStd) ? fromStd[0] : fromStd) ?? (Array.isArray(fromAlt) ? fromAlt[0] : fromAlt)
  if (!raw || typeof raw !== "string") return null
  return raw.trim()
}

// A small reusable validator if you prefer to call it imperatively inside a handler.
export function validateSEB(
  req: NextApiRequest,
  res: NextApiResponse,
  allowed: string[] = ALLOWED_SEB_CONFIG_KEY_HASHES,
): boolean {
  const hash = getSebHashFromHeaders(req)
  const ok = !!hash && allowed.includes(hash)
  if (!ok) {
    res.status(403).json({ error: "Access Denied: Please use Safe Exam Browser" })
    return false
  }
  return true
}

// Recommended: wrap any Next.js API route with this HOF to enforce SEB protection.
export function withSEBProtection(handler: NextApiHandler, options?: { allowedHashes?: string[] }): NextApiHandler {
  const allowed = options?.allowedHashes ?? ALLOWED_SEB_CONFIG_KEY_HASHES

  return async function sebProtectedHandler(req: NextApiRequest, res: NextApiResponse) {
    const hash = getSebHashFromHeaders(req)
    if (!hash || !allowed.includes(hash)) {
      return res.status(403).json({ error: "Access Denied: Please use Safe Exam Browser" })
    }
    // Proceed as usual
    return handler(req, res)
  }
}
