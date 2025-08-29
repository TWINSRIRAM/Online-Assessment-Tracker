import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || ""
  // Allow only SEB for any /exam/* path (client-facing exam UI)
  if (!/SEB/i.test(ua)) {
    return new NextResponse("Please use Safe Exam Browser to access this exam.", { status: 403 })
  }
  return NextResponse.next()
}

// Limit the middleware to exam routes
export const config = {
  matcher: ["/exam/:path*"],
}
