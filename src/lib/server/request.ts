import { headers } from 'next/headers'

/** Client IP as seen by Vercel (first x-forwarded-for hop), for throttles. */
export async function clientIp() {
  const h = await headers()
  return (h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? 'unknown').trim().slice(0, 64)
}
