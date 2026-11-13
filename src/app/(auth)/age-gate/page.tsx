import AuthPanel from '../AuthPanel'
import { Suspense } from 'react'
import AgeGateForm from './AgeGateForm'

export const metadata = { title: 'Age check' }

export default function AgeGatePage() {
  return (
    <AuthPanel>
      <h1 className="font-display font-normal text-h1 lg:text-h1-lg tracking-h1 text-ink mb-2">Are you 18 or over?</h1>
      <p className="text-ink-2 text-sm mb-6">Social Sips is for adults only. Enter your date of birth to continue.</p>
      <Suspense>
        <AgeGateForm />
      </Suspense>
    </AuthPanel>
  )
}
