"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"

export default function ExamLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault()
    const blockKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && (key === "c" || key === "v" || key === "x" || key === "a" || key === "s")) {
        e.preventDefault()
      }
      // Block common devtool keys
      if (
        key === "f12" ||
        (ctrl && key === "u") ||
        (ctrl && shiftPressed(e) && (key === "i" || key === "j" || key === "c"))
      ) {
        e.preventDefault()
      }
    }
    const shiftPressed = (e: KeyboardEvent) => e.shiftKey

    document.addEventListener("copy", block)
    document.addEventListener("paste", block)
    document.addEventListener("cut", block)
    document.addEventListener("contextmenu", block)
    document.addEventListener("keydown", blockKey)

    return () => {
      document.removeEventListener("copy", block)
      document.removeEventListener("paste", block)
      document.removeEventListener("cut", block)
      document.removeEventListener("contextmenu", block)
      document.removeEventListener("keydown", blockKey)
    }
  }, [])

  return <main>{children}</main>
}
