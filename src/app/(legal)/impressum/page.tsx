import Link from 'next/link'
import { LEGAL } from '@/lib/legal'
import { L, LegalPage, Section } from '@/components/legal/Legal'

export const metadata = { title: 'Impressum' }

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum" updated={false}>
      <Section title="Disclosure according to § 25 MedienG (small website)">
        <dl className="grid sm:grid-cols-[14rem_1fr] gap-x-4 gap-y-2">
          <dt className="text-ink-2">Media owner and service provider</dt><dd className="font-semibold">{LEGAL.ownerName}</dd>
          <dt className="text-ink-2">Place of residence</dt><dd><L k="address" /></dd>
          <dt className="text-ink-2">Email</dt><dd><L k="contactEmail" mailto /></dd>
          <dt className="text-ink-2">Contact form</dt><dd><Link href="/report" className="text-accent">Report content or contact us</Link></dd>
          <dt className="text-ink-2">Business details</dt><dd>None. Social Sips is a private, non-commercial hobby project with no ads, payments or subscriptions, so § 5 ECG does not apply (no company register entry, trade licence or VAT number).</dd>
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
