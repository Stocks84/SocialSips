/**
 * Legal details for /impressum, /privacy and /terms — the ONE place to fill in Will's details.
 * Leave a value as null until it's known: the pages then show a neutral "To be added" line (never made-up data).
 */
export const LEGAL = {
  /** Media owner / service provider / controller. */
  ownerName: 'William Stocks',
  /**
   * Hobby (non-commercial) mode: § 25(5) MedienG "small website" disclosure needs only name + place of residence,
   * and § 5 ECG does not apply. Switch to a full postal/c/o address here (and restore the phone row) once Social Sips earns money.
   */
  address: 'Klagenfurt am Wörthersee, Austria' as string | null,
  /** [CONTACT EMAIL] Point of contact for users and authorities (DSA Art. 11–12). */
  contactEmail: null as string | null,
  /** Only needed once commercial (§ 5 ECG). Not shown in hobby mode. */
  phone: null as string | null,
  /** [DATE] "Last updated" date shown on Privacy and Terms, e.g. '21 October 2026'. */
  lastUpdated: null as string | null,
  /** Version stored on profiles.accepted_terms_version at sign-up. Bump when the Terms/Privacy text changes. */
  termsVersion: '2026-10-19',
  /** Supabase project region, from the dashboard (Project Settings → General), e.g. 'EU (Frankfurt, eu-central-1)'. */
  supabaseRegion: null as string | null,
  /** How long reports and moderation decisions are kept after a case closes, e.g. '12 months'. */
  reportRetention: null as string | null,
  /** Languages for contact (DSA Art. 12). */
  contactLanguages: 'English and German',
} as const

export type LegalKey = keyof typeof LEGAL
