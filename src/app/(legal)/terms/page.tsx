import Link from 'next/link'
import { LEGAL } from '@/lib/legal'
import { L, LegalPage, Section } from '@/components/legal/Legal'

export const metadata = { title: 'Terms of Use' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" emoji="📜">
      <Section title="1. Who we are">
        <p>Social Sips is run by {LEGAL.ownerName}, <L k="address" /> (<L k="contactEmail" mailto />). See the <Link href="/impressum" className="text-accent-purple">Impressum</Link>. It is a free, non-commercial service.</p>
      </Section>
      <Section title="2. 18+ only">
        <p>You must be at least 18 to use Social Sips. By signing up you confirm your date of birth is true. False ages lead to removal.</p>
      </Section>
      <Section title="3. Drink responsibly">
        <p>Content is for entertainment and information. Know your limits, never drink and drive, don&apos;t pressure anyone to drink, and drinking games are optional: alcohol-free versions are always fine. Follow local laws. Help: Austria <a className="text-accent-purple" href="https://www.suchtvorbeugung.net">suchtvorbeugung.net</a> · UK <a className="text-accent-purple" href="https://www.drinkaware.co.uk">drinkaware.co.uk</a>.</p>
      </Section>
      <Section title="4. Your account">
        <p>Keep your login safe. One person per account. You can delete your account at any time in <Link href="/settings/account" className="text-accent-purple">Settings → Account</Link> or by emailing us.</p>
      </Section>
      <Section title="5. Content rules: you must not post">
        <ul className="list-disc pl-5 space-y-1">
          <li>Anything illegal (hate speech, threats, terrorism, child sexual abuse material, non-consensual intimate images, drug dealing).</li>
          <li>Content that targets or appeals to under-18s, or shows minors drinking.</li>
          <li>Encouraging dangerous, excessive or forced drinking, drink-driving, or mixing alcohol with drugs.</li>
          <li>Harassment, bullying, doxxing, or other people&apos;s personal data.</li>
          <li>Spam, scams, ads or selling alcohol.</li>
          <li>Content you have no right to use (other people&apos;s photos or art without permission). Memes must respect copyright and the rights of people pictured.</li>
          <li>Nudity or sexual content.</li>
        </ul>
      </Section>
      <Section title="6. Your content and licence">
        <p>You keep ownership. You grant Social Sips a free, non-exclusive, worldwide licence to host, display, resize and share it within the service, ending when you delete it (except copies others legitimately shared or kept for legal reasons). You confirm you have the rights to what you upload.</p>
      </Section>
      <Section title="7. Reporting, blocking and moderation">
        <ul className="list-disc pl-5 space-y-1">
          <li>Use <strong>⚑ Report</strong> on any post, meme, comment or variation. Anyone, signed in or not, can also use the <Link href="/report" className="text-accent-purple">report form</Link> or email <L k="contactEmail" mailto /> with the link, why it&apos;s illegal or breaks these rules, and a good-faith statement. Your name and email are optional.</li>
          <li>You can block another user: you won&apos;t see their posts or comments, and they can&apos;t comment on yours.</li>
          <li>We review reports promptly and fairly, with human review. We may hide or remove content, or suspend accounts for serious or repeated breaches.</li>
          <li>If we act on your content we tell you why (a statement of reasons on the item), unless the law prohibits it. You can ask us to reconsider by emailing <L k="contactEmail" mailto /> within 6 months; we review it ourselves and can explain out-of-court dispute options.</li>
          <li>We report content suggesting a threat to life or safety to the authorities (DSA Art. 18).</li>
        </ul>
      </Section>
      <Section title="8. Point of contact">
        <p>Users and authorities: <L k="contactEmail" mailto />, in {LEGAL.contactLanguages}.</p>
      </Section>
      <Section title="9. Liability">
        <p>Provided &quot;as is&quot;. Nothing limits liability for intent, gross negligence, injury to life, body or health, or mandatory consumer rights. We are not responsible for user content we don&apos;t know is illegal (DSA Art. 6).</p>
      </Section>
      <Section title="10. Changes and ending">
        <p>We may update these terms with notice to account holders. We may end the service.</p>
      </Section>
      <Section title="11. Law">
        <p>Austrian law applies, without removing the protections of your home country&apos;s consumer law. Courts: your place of residence if you are a consumer.</p>
      </Section>
    </LegalPage>
  )
}
