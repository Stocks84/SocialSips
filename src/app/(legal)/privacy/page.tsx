import Link from 'next/link'
import { LEGAL } from '@/lib/legal'
import { L, LegalPage, Section } from '@/components/legal/Legal'

export const metadata = { title: 'Privacy Policy' }

const rows: [string, string, string, React.ReactNode][] = [
  ['Email, password (hashed by Supabase), username', 'Create and secure your account', 'Art. 6(1)(b) contract', 'Until you delete your account'],
  ['Date of birth', 'Confirm you are 18+ (youth protection, alcohol content)', 'Art. 6(1)(c) legal obligation / (f) legitimate interest', 'Until you delete your account. For signed-out visitors only a signed age cookie is stored, no date of birth.'],
  ['Acceptance of the Terms and this policy (date and version)', 'Show what you agreed to', 'Art. 6(1)(b) and (f)', 'Until you delete your account'],
  ['Display name, bio, profile photo', 'Your public profile', 'Art. 6(1)(b) contract', 'Until you change or delete it'],
  ['Posts, memes, images, comments, variations, reactions', 'Running the community', 'Art. 6(1)(b) contract', 'Until you or a moderator remove them'],
  ['People you block', 'Hide their content from you and stop them commenting on your posts', 'Art. 6(1)(b) contract', 'Until you unblock them or delete your account'],
  ['Reports (including an optional email from signed-out reporters) and moderation decisions', 'Safety, Digital Services Act duties', 'Art. 6(1)(c) and (f)', <>Up to <L k="reportRetention" /> after the case closes</>],
  ['IP address, request logs, rate-limit data', 'Security and abuse prevention', 'Art. 6(1)(f) legitimate interest', 'Short-term, per provider (see section 4)'],
]

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" emoji="🔒">
      <Section title="1. Who is responsible (controller)">
        <p>{LEGAL.ownerName}, <L k="address" />. Email: <L k="contactEmail" mailto />. No Data Protection Officer is appointed (not required under Art. 37 GDPR for this service).</p>
      </Section>
      <Section title="2. What we collect and why">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left text-xs sm:text-sm border-separate border-spacing-y-1 min-w-[36rem]">
            <thead className="text-text-secondary"><tr><th className="p-1">Data</th><th className="p-1">Purpose</th><th className="p-1">Legal basis (GDPR)</th><th className="p-1">Kept for</th></tr></thead>
            <tbody>
              {rows.map(([d, p, b, k]) => (
                <tr key={d} className="align-top"><td className="p-1 font-semibold">{d}</td><td className="p-1">{p}</td><td className="p-1">{b}</td><td className="p-1">{k}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Uploaded images are re-encoded and location (EXIF) data is stripped. We do not sell data, run ads, or use analytics or tracking cookies.</p>
      </Section>
      <Section title="3. Cookies and local storage">
        <p>Only strictly necessary items: Supabase login session cookies, the age-check cookie, and settings kept on your device only (for example your &quot;What can I make?&quot; bar and Kings Cup house rules, in localStorage). These are exempt from consent under § 165(3) TKG 2021 and Art. 5(3) of the ePrivacy Directive, so no consent banner is shown. If we add analytics later we will ask first.</p>
      </Section>
      <Section title="4. Service providers (processors)">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase Inc.</strong>: database, login and file storage. Region: <L k="supabaseRegion" />. Data processing agreement: <a className="text-accent-purple" href="https://supabase.com/legal/dpa">supabase.com/legal/dpa</a></li>
          <li><strong>Vercel Inc.</strong>: hosting and delivery. Data processing agreement: <a className="text-accent-purple" href="https://vercel.com/legal/dpa">vercel.com/legal/dpa</a></li>
        </ul>
        <p>Where data goes to the USA, transfers rely on the EU–US Data Privacy Framework and/or Standard Contractual Clauses (Art. 45/46 GDPR).</p>
      </Section>
      <Section title="5. Who can see your content">
        <p>Profiles, posts, comments and variations are visible to signed-in and age-checked visitors. Reactions are only shown as totals, never per person. Your block list is private to you. Moderators see reports.</p>
      </Section>
      <Section title="6. Your rights">
        <p>You have the right to access (Art. 15), correction (16), deletion (17), restriction (18), portability (20) and objection (21).</p>
        <p>Signed in, you can do this yourself in <Link href="/settings/account" className="text-accent-purple">Settings → Account</Link>: <strong>Download my data</strong> (a JSON file) and <strong>Delete account</strong>. Or email <L k="contactEmail" mailto />. We reply within one month.</p>
        <p>You can complain to the <strong>Österreichische Datenschutzbehörde</strong>, Barichgasse 40–42, 1030 Wien, <a className="text-accent-purple" href="https://www.dsb.gv.at">dsb.gv.at</a> (UK users: ICO, <a className="text-accent-purple" href="https://ico.org.uk">ico.org.uk</a>).</p>
      </Section>
      <Section title="7. Age">
        <p>Social Sips is for adults 18+ only. If we learn an under-18 has an account we delete it.</p>
      </Section>
      <Section title="8. Changes">
        <p>We will post updates here and tell account holders about important changes.</p>
      </Section>
    </LegalPage>
  )
}
