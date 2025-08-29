"use client"

import type { ReactNode } from "react"

export default function ExamLayout({ children }: { children: ReactNode }) {
  // Allow normal scrolling and interactions
  return <main>{children}</main>
}
