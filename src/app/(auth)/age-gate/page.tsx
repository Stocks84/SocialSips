import { Suspense } from 'react'
import AgeGateForm from './AgeGateForm'

export const metadata = { title: 'Age check' }

export default function AgeGatePage() {
  return (
    <>
      <h1 className="text-2xl font-black mb-2">Are you 18 or over? 🔞</h1>
      <p className="text-text-secondary text-sm mb-6">Social Sips is for adults only. Enter your date of birth to continue.</p>
      <Suspense>
        <AgeGateForm />
      </Suspense>
    </>
  )
}
