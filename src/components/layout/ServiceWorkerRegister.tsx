'use client'
import { useEffect } from 'react'

/** Registers /sw.js in production so the app is installable and works offline (basic shell cache). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
