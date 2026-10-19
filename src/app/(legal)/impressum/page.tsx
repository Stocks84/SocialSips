import Link from 'next/link'
import { LEGAL } from '@/lib/legal'
import { L, LegalPage, Section } from '@/components/legal/Legal'

export const metadata = { title: 'Impressum' }

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum" emoji="📇" updated={false}>
      <Section title="Information according to § 5 ECG and disclosure according to § 25 MedienG">
        <dl className="grid sm:grid-cols-[14rem_1fr] gap-x-4 gap-y-2">
          <dt className="text-text-secondary">Media owner and service provider</dt><dd className="font-semibold">{LEGAL.ownerName}</dd>
          <dt className="text-text-secondary">Address</dt><dd><L k="address" /></dd>
          <dt className="text-text-secondary">Email</dt><dd><L k="contactEmail" mailto /></dd>
          <dt className="text-text-secondary">Phone</dt><dd><L k="phone" /></dd>
          <dt className="text-text-secondary">Contact form</dt><dd><Link href="/report" className="text-accent-purple">Report content or contact us</Link></dd>
          <dt className="text-text-secondary">Business details</dt><dd>None. Social Sips is a private, non-commercial project (no company register entry, trade licence or VAT number).</dd>
        </dl>
      </Section>
      <Section title="Basic direction (Blattlinie, § 25(4) MedienG)">
        <p>Social Sips is a community website about cocktails, drinking games and memes for adults, with content created by its users.</p>
      </Section>
      <Section title="Point of contact (EU Digital Services Act, Art. 11–12)">
        <p>Users and authorities can reach us at <L k="contactEmail" mailto />, in {LEGAL.contactLanguages}.</p>
      </Section>
    </LegalPage>
  )
}
