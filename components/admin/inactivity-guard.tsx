"use client"

import { useEffect, useRef } from "react"
import { signOut } from "next-auth/react"

const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

export function InactivityGuard() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/admin/login" })
      }, TIMEOUT_MS)
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"]
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [])

  return null
}
