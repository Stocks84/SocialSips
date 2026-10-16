'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AGE_COOKIE } from '@/lib/age'
import { dobSchema } from '@/lib/validators/auth'

export default function AgeGateForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const dob = String(new FormData(e.currentTarget).get('dob') ?? '')
    const result = dobSchema.safeParse(dob)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid date')
      return
    }
    // Soft gate cookie (30 days). The hard check is date_of_birth on the profile (DB constraint).
    document.cookie = `${AGE_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    router.push(params.get('redirectTo') ?? '/feed')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="label" htmlFor="dob">Date of birth</label>
      <input id="dob" name="dob" type="date" required className="input" />
      {error && <p className="error-msg">{error}</p>}
      <button className="btn-primary w-full">Let me in 🚀</button>
    </form>
  )
}
