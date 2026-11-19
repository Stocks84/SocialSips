# Social Sips: UK Online Safety Act risk assessment

> **DRAFT. Not legal advice.**
> Written by Social Sips (Will's assistant) from the code and from Ofcom's public guidance.
> Will has not approved it. The WKO lawyer review must check it before anyone relies on it.
> Nothing here is published or sent to anyone.

| | |
|---|---|
| Version | 0.3 DRAFT |
| Date first written | 17 November 2026 |
| Date last updated | 19 November 2026 |
| Service | Social Sips. Live today at https://social-sips-livid.vercel.app/. Intended domain: https://social-sips.app (chosen, not bought yet). |
| Code baseline for this update | `main` at `04ea2e8`. First draft was written against `main` at `229495d`. |
| Provider and responsible person | William Stocks ("Will"), named as the person accountable (Ofcom measure ICU A2 / PCU A2) |
| Contact (only if needed) | The public contact email on the Impressum page. Not repeated here (CLAUDE.md allows that email on the legal pages only). No home address in this file. |
| Next review | **19 November 2027**, or sooner before any big change (see section 9) |

**Change log**

- **0.1** (17 Nov 2026): first draft.
- **0.2** (19 Nov 2026): refreshed against later `main` (G2, G3 and G6 closed in code).
- **0.3** (19 Nov 2026): re-read Ofcom's harmful-substances guidance and Risk Level Table. Rate harmful-substances (and restated dangerous-challenges) children's risk as **Low**, with evidence, weak spots, and cheap extra safeguards. Not legal advice. Lawyer to confirm.

---

# 1. One-screen summary

**Short version: the service looks small and low risk for illegal content. The weak spot is children, because the age gate only trusts what people type.**

### Illegal content risk (Ofcom's 18 kinds)

| Level | Which harms |
|---|---|
| **Medium** | none |
| **Low (watch these)** | Hate · Harassment and threats · Intimate image abuse · Child sexual abuse images · Grooming |
| **Low** | Terrorism · Extreme pornography · Fraud · Drugs · Suicide and serious self-harm |
| **Negligible** | CSAM links · Controlling or coercive behaviour · Sexual exploitation of adults · Human trafficking · Unlawful immigration · Proceeds of crime · Weapons · Foreign interference · Animal cruelty · Cyberflashing |

"Low (watch)" means: images and comments are public, nobody pre-checks them, and I have no UK user numbers to prove it is quiet. One confirmed case should push it to Medium.

If everything stays Low or Negligible, Ofcom calls this a **low-risk, smaller service**. Then only the basic measures apply (section 6).

### Children

- The age gate is **self-declared** (type a birth date, tick a box). Ofcom says this is **not** "highly effective age assurance" (HEAA). The Act says self-declaration "without more" is not age assurance. So I still treat children as able to get in, and I still do a children's risk assessment (section 8).
- I now rate **"harmful substances" content as Low**, not Medium. Ofcom's category is content that *actively encourages excessive* drinking (for example initiations, or drinking until someone is sick), not every mention of alcohol. The full case, including weak spots, is in section 8.
- Because that rating is now Low, I no longer think measure **PCU B5** (HEAA when the risk is medium or high and the Terms ban the content) is triggered. **That is for the lawyer to confirm, not settled here.**

### Already in place

Report button (signed in) and a public report form (no sign-in; can now target a single comment) · human review by an admin · hide, unhide, delete, and a **suspend account** tool · hidden images move to a private bucket, plus a “Make hidden images private” sweep button · in-app and email-ready admin alerts when a new report arrives · reasons sent to the author · block users · rate limits on posting and reporting · Turnstile captcha at sign-up and password reset · uploads re-encoded, 4 MB max, only jpg/png/webp/gif · no private messages · no live video · no clickable links in user text · clear Terms with banned content list · named contact · closed reports are set to be deleted after 12 months (see G2).

### Gaps still open (full list in section 7)

1. **Children (G1):** self-declared age gate. Still not HEAA. Decide with the lawyer: real age checks, block the UK, or accept the children's duties and record why.
2. **Moderation cover (G4):** one person (Will). No written response time, no backup if he is away.
3. **No numbers (G5):** the Privacy Policy says there is no analytics, so I still can't show UK or child user counts.
4. **UK wording (G7):** Terms and Help still do not mention the UK Act or UK support lines.
5. **No image scanning (G8)** and **no written “save evidence then delete” rule (G9).** Illegal images should still be **deleted**, not only hidden.
6. **G10 / G11:** Ofcom Risk Profiles not yet ticked box by box; live reports were not read for this update.

Closed in code since the 17 Nov draft, subject to a live-dashboard check (see section 7): **G2** (12-month report delete job), **G3** (suspend tool), **G6** (hide now moves the image out of the public bucket).

---

# 2. Is Social Sips in scope?

**Working answer: assume yes.** Treat it as in scope until the lawyer says otherwise.

Why:
- It is a **user-to-user service**: users upload games, cocktails, memes, comments and profile photos that other users see.
- The Act applies to services with **links to the UK** wherever the provider lives. Links means any one of: a *significant number of UK users*; UK is a *target market*; or UK users *can* use it and there's a *material risk of significant harm* (Ofcom Regulation Checker).
- Ofcom does not define "significant number". You must be able to explain your judgement. **I have no UK user data**, so I can't show it is small.
- Hints of UK links in the code: English-language app, UK help lines (Drinkaware, 999) on `/help` and in the Terms, UK ICO named in the Privacy Policy.
- Will is in Austria. EU rules (the DSA) already apply to him. This document covers the **UK** rules only.

Not a "limited functionality" service: users post their own content, so that exemption doesn't fit.

---

# 3. What the service is (from the code)

The first draft was read from the repo on 17 Nov 2026 (`main` at `229495d`). This update was re-checked against `main` at `6e8995b` on 19 Nov 2026. Files are in `src/` unless stated. I did not query the live database or change any live settings.

### What changed in the code since the first draft

These are now on `main`. I did not re-check the live database, so “in the shipped app” here means “the code is on the branch described as live”.

- **12-month report retention (G2):** migration `0039_report_retention.sql` adds `private.purge_old_reports()` and a daily `pg_cron` job `purge-old-reports` at 03:17 UTC. Open reports are never deleted. The migration file also enables the `pg_cron` extension. **Please confirm in the Supabase dashboard that this job is scheduled.** I could not verify that from here.
- **Suspend accounts (G3):** migration `0040_account_suspension.sql`, admin **Accounts** page at `/admin/users`, and an “account suspended” banner. Suspended members can still sign in, read, delete their own posts and delete their account, but cannot post, comment, vote, follow, report, or upload. Later commits also hide create/edit forms, reaction controls, and Report buttons from suspended members.
- **Hidden images (G6):** migration `0041_hidden_media_bucket.sql`. Hiding an item moves its image into a private `hidden-media` bucket; unhiding moves it back. If the move fails, the admin is sent to **Hidden items** to press **“Make hidden images private”** (`src/app/(main)/admin/hidden/page.tsx`). This closes the “anyone with the old link can still see the file” gap for hidden items. Illegal images should still be **deleted**, not only hidden (see G9).
- **Moderation alerts:** migration `0044_report_admin_alerts.sql` is marked **applied live on 18 Nov 2026**. Admins see a nav badge and in-app alerts for new reports. Optional email alerts already exist in the app, behind env vars, and are not switched on yet.
- **Public report form** can now target a **single comment** (permalink or `?comment=`), not only the parent post.
- **Password reset** with Turnstile captcha. **Welcome prompt** after first sign-up (migration `0043_welcome_dismissed.sql` is on `main`; the file says “apply at push time”. I could not confirm it was applied live).
- Copy now uses **Drinks** and **Dares** in public wording.

### What users can do

| Feature | What I found | Where |
|---|---|---|
| Sign up | Email, password, username, **date of birth**, "I'm 18+" tick box, Terms tick box, Turnstile captcha | `app/(auth)/sign-up/SignUpForm.tsx`, `lib/validators/auth.ts` |
| Age gate for guests | Date of birth form. Under 18 gets an exit page and a 24 h block. Over 18 gets a signed cookie for 30 days. No date of birth stored for guests. | `app/(auth)/age-gate/actions.ts`, `lib/age.ts`, `lib/age-token.ts`, `middleware.ts` |
| Age at sign-up | DB check: date of birth must be at least 18 years ago. Trigger rejects sign-up without the confirm tick. | `supabase/migrations/0001_init.sql`, `0002_age_confirmation.sql` |
| Guests | After the age gate, guests can **read** games, cocktails, memes, comments, profiles. Writes need an account. | `middleware.ts`, RLS migrations |
| Posts | Games (and variations), cocktails (and variations), **memes (image or joke text)**, comments (text only, 1000 chars), star ratings, emoji reactions on memes | `app/(main)/*/actions.ts`, `lib/validators/*` |
| Profiles | Public username, display name (50), bio (280), avatar image, favourite drink, party vibe. Date of birth is **not** readable by the public (column grants). | `supabase/migrations/0028_explicit_grants.sql` |
| Social | Follow users (follower lists are public). Following feed. Notifications for follows, reactions, comments. | `app/(main)/feed`, `notifications`, `0024_follows_notifications.sql` |
| Weekly challenge | Admin sets a meme or cocktail-variation theme. Users enter and vote. | `0023_weekly_challenge.sql`, `app/(main)/challenge` |
| Block | Blocked users can't comment on your posts and you don't see theirs. | `0021_blocks.sql` |
| Delete account | Self-serve. Removes own content and files. Data download too. | `0022_delete_account.sql`, `app/(main)/settings/account` |

### What the service does **not** have (confirmed by reading the code)

- **No private or direct messages.** No group chat.
- **No live video or audio.** No video uploads (only jpg, png, webp, gif).
- **No user search.** Search covers games and cocktails. I found no username search in the code or the database functions the app calls.
- **No clickable links** in user text. Comments render as plain text. No link-ification found.
- **No personalised recommender.** The feed is newest first, or "top" sorted by reaction count. The Following tab shows only people you follow.
- **No ads, payments, or analytics** (Privacy Policy, Impressum).
- **No AI features** (no AI libraries found in `src/` or `package.json`).

### Images (the riskiest feature)

- Users upload images for memes, game covers, cocktail photos and avatars. Animated GIFs are allowed (max 150 frames).
- Server checks the real file type, re-encodes the image (strips location data), max edge 1600 px, max 4 MB. Limits: 20 images / 40 MB per user per day. (`lib/server/uploads.ts`, `README.md`)
- Visible items are stored in **public** storage buckets with random file names (`userId/uuid.ext`). Anyone with the link can open a **public** file, and there is **no age gate on the file itself**. (`0001_init.sql`, `0006`, `0015`)
- **Since 0041:** when an item is hidden, its image is moved to the private `hidden-media` bucket, so the old public URL should stop working. Unhide moves it back. A sweep button catches images that were hidden before this, or whose move failed.
- **No automatic image scanning** (no nudity, no CSAM hash matching).

### Limits and abuse controls found

- Posting limits per user: 5 games, 5 cocktails, 5 memes per hour; 20 comments per 10 min; 10 variations per hour; 10 reports per hour. (`0005_rate_limits_cocktail_search.sql`)
- Sign-in throttle and Turnstile captcha. (`lib/server/throttle.ts`, `lib/turnstile.ts`)
- Public report form: max 10 reports per IP per 15 min. (`app/(legal)/report/actions.ts`)

### Reporting and moderation flow

1. **Report.** Signed-in: "⚑ Report" button on posts, comments and variations. Reasons: illegal, under-18s involved, copyright, spam, harassment, dangerous drinking, hate, other. Anyone (no sign-in): `/report` form with link, reason, note (min 10 characters), optional email, good-faith tick. The form can target a **single comment** (`#comment-<id>` or `?comment=`). Also email. (`components/ui/ReportButton.tsx`, `app/(legal)/report`, `lib/report-url.ts`)
2. **Review.** Admin pages `/admin/reports`, `/admin/hidden` and `/admin/users`. New reports also show as a nav badge and in-app alerts. Human review. (`app/(main)/admin`)
3. **Action.** Admin can **hide** (item disappears for the public, author can still see it; the image is moved to a private bucket), **unhide**, or **delete** (removes the row and the image file), or **dismiss** the report, or **suspend / restore** an account. Closing a case closes all open reports about the same item. (`app/(main)/admin/actions.ts`, `app/(main)/admin/users`)
4. **Tell the author.** A "statement of reasons" is saved and shown to the author. (`moderation_notices`, `components/moderation/StatementOfReasons.tsx`)
5. **Tell the reporter.** Signed-in reporters can see status and outcome.
6. **Appeal.** Terms say: email within 6 months, Will reviews it himself.
7. **Retention.** Privacy Policy says reports and decisions are kept up to **12 months** after the case closes (`lib/legal.ts`). **Code now exists:** migration `0039` schedules a daily delete of *closed* reports and moderation notices older than 12 months. **Please confirm the live `pg_cron` job is running.** (Was gap G2.)
8. **Suspending accounts.** Admin Accounts page (`/admin/users`) can suspend or lift a suspension, with a reason. Suspended members cannot post or interact, but can still read and delete their own data. (Was gap G3.)

### Legal pages

Terms, Privacy, Impressum, report form, Help page. Reachable without the age gate. Terms section 5 bans: illegal content (hate, threats, terrorism, CSAM, non-consensual intimate images, drug dealing), content aimed at under-18s, encouraging dangerous or forced drinking, harassment, spam and scams, copyright theft, nudity and sexual content. Terms never mention the UK Online Safety Act by name.

### Share previews

Link-preview bots (Slack, X, WhatsApp and so on) can fetch title and summary of a game, cocktail, meme or challenge **without** the age gate. They get a stub with no comments and no counts. Normal visitors still hit the gate. (`middleware.ts`)

### Who runs it

Will, alone, as a non-commercial hobby. One moderator (Will). Hosting: Vercel and Supabase (EU Frankfurt). The number of admins in the live database was **not checked** (I did not touch live data).

---

# 4. How I assessed it (Ofcom's four steps)

Source: Ofcom's *Risk Assessment Guidance and Risk Profiles* and the Ofcom page on illegal content duties (links in section 11).

| Step | What it asks | Where it is in this file |
|---|---|---|
| 1. Understand | List the kinds of illegal content. Check Ofcom's Risk Profiles for risk factors. | Section 5 table |
| 2. Assess | Likelihood and impact for each kind, using evidence. Pick Negligible / Low / Medium / High. Count existing controls. | Section 5 table |
| 3. Decide measures | Check which Code measures apply to a service like yours. Do them or record an alternative. | Sections 6 and 7 |
| 4. Report and review | Tell whoever is accountable. Watch results. Review at least yearly and before big changes. | Sections 9 and 10 |

**Scale used:** Likelihood = how likely the harm shows up on the service. Impact = how bad it is if it does. Risk level = both together, after counting what we already do.

**Honest limits of this draft:**
- I have **no real data** on UK users, incident counts or report numbers. Likelihood is a judgement from design and size, not from measured evidence.
- I did **not** read the live database or any real reports.
- **I could not download Ofcom's PDFs directly** (their site blocked my download). I read Ofcom's web pages and search extracts of the PDFs instead. Before the lawyer review, **Will (or the lawyer) should open Ofcom's current Risk Profiles and tick each risk factor off.** Step 1 says you must confirm you consulted them. I can't honestly say I did that in full.
- Ofcom says to use evidence. Where I say "Low", the reason is the design (no DMs, text and images only) and the small size. That is a reasoned guess.

**Ofcom's count:** Ofcom's page says **18 kinds** of priority illegal content (updated June 2026 to add serious self-harm and cyberflashing). It lists child sexual exploitation and abuse (CSEA) as one kind with three sub-kinds (grooming, image CSAM, CSAM URLs). I assess each sub-kind on its own, so the table has 20 rows.

---

# 5. Illegal content: harm by harm

L = likelihood, I = impact (L = low, M = medium, H = high). "Level" is Ofcom's four-point scale.

| # | Harm | L | I | Level | Why (evidence from the code) | What we already do |
|---|---|---|---|---|---|---|
| 1 | **Terrorism** | L | H | **Low** | Public text and images. No DMs, no live video, no links. Small, niche, alcohol topic. | Terms ban it. Report form, admin hide and delete. Rate limits. |
| 2 | **Grooming** (CSEA) | L | H | **Low (watch)** | No DMs, no user search, no contact feature. Adults and children could both **comment** publicly and follow. Self-declared age gate means under-18s could join. | 18+ rule and gate. Terms ban content aimed at under-18s. Block. Rate limits. |
| 3 | **Child sexual abuse images** | L | H | **Low (watch)** | Public image uploads (memes, avatars, covers, GIFs). **No image scanning or hash matching.** Hidden images stay online until deleted. | Sign-in needed to upload. Upload limits. Re-encoding. Terms ban it. "Under-18s involved" report reason. Delete removes the file. |
| 4 | **CSAM links** | L | H | **Negligible** | Links in text are not clickable. Free text can still contain a URL as plain text. | Plain-text rendering. Report form accepts "link" reports. |
| 5 | **Hate** | M | M | **Low (watch)** | Memes and comments are the classic route. Public. No pre-checking. Small size and no incidents known. | Terms ban it. "Hate speech" report reason. Hide and delete. Statement of reasons. |
| 6 | **Harassment, stalking, threats, abuse** | M | M | **Low (watch)** | Public comments, follows, notifications. No DMs limits reach. | Block tool. Report reasons incl. harassment. Comment rate limit. Terms ban it. |
| 7 | **Controlling or coercive behaviour** | L | M | **Negligible** | Needs ongoing private contact between partners. No DMs. | None needed beyond the above. |
| 8 | **Intimate image abuse** | L | H | **Low (watch)** | Public image uploads could hold someone's private images. No nudity detection. | Terms ban non-consensual intimate images and nudity. Report and delete. |
| 9 | **Extreme pornography** | L | M | **Low** | Public image uploads (including GIFs). No scanning. | Terms ban nudity and sexual content. Report and delete. |
| 10 | **Sexual exploitation of adults** | L | M | **Negligible** | No messaging, no payments, no ads, no adult services. | Terms. |
| 11 | **Human trafficking** | L | H | **Negligible** | No ads, no listings, no messaging. | Terms. |
| 12 | **Unlawful immigration** | L | M | **Negligible** | No ads, no services, no messaging. | Terms. |
| 13 | **Fraud and financial services** | L | M | **Low** | Free text could carry scam text. No links, no payments, no DMs. Terms ban scams and selling alcohol. | Terms. Spam report reason. Rate limits. |
| 14 | **Proceeds of crime** | L | M | **Negligible** | No payments or money services. | Terms. |
| 15 | **Drugs and psychoactive substances** | M | M | **Low** | Alcohol-themed audience. Content could mention drugs or mixing alcohol with drugs. No selling features. | Terms ban drug dealing and mixing alcohol with drugs. Report and hide. |
| 16 | **Firearms, knives, other weapons** | L | M | **Negligible** | No selling features, no listings. | Terms. |
| 17 | **Encouraging or assisting suicide and serious self-harm** | L | H | **Low** | Drinking-themed content could drift into harmful drinking. Public comments only. | Terms ban encouraging dangerous or excessive drinking. `/help` page has support lines (Drinkaware, 112, 999, Austrian help). |
| 18 | **Foreign interference** | L | M | **Negligible** | No political ads, no news features. | None needed. |
| 19 | **Animal cruelty** | L | M | **Negligible** | Images only. Niche topic. | Terms. Report and delete. |
| 20 | **Cyberflashing** (new, June 2026) | L | M | **Negligible** | Needs a way to send an image to a specific person. There is **no DM**. Comments are text only. Memes are public posts, not sent to a person. | Not possible by design. Recheck if DMs or image comments are ever added. |

### Other illegal content to watch (not on Ofcom's priority list)

| Harm | Level | Notes |
|---|---|---|
| **Copyright** (other people's photos or memes) | **Medium** (likely, lower severity) | Memes are often copied. Not a priority offence, handled by the report form ("copyright" reason) and the Terms. DSA/EU rules matter more here. |
| **Flashing images (epilepsy trolling)** | **Low** | Animated GIFs are allowed (max 150 frames). *I believe this is an offence under the Act but did not confirm it on Ofcom's pages. Lawyer to confirm.* |

### Overall result

- **Medium or high for any priority illegal harm: none.** So I'm treating the service as **low risk** ("smaller, low-risk" in Ofcom's terms).
- Five rows are "Low (watch)". **If any one becomes Medium**, the service becomes a "single-risk" service and more Code measures apply (for example, CSAM hash matching if image CSAM rose).
- **Another way I'd be wrong:** if there are many UK users, or reports start arriving, these levels go up. I can't measure either today (gap G5).

---

# 6. Which Ofcom measures apply (smaller, low-risk, illegal content)

Based on Ofcom's *Summary of our decisions* and *Summary of each chapter* tables for **smaller, low-risk** user-to-user services. I saw extracts of those tables, not every row. The Code text itself prevails over this table, so the lawyer should check it against the current Codes.

| Code measure | What it asks | Status here |
|---|---|---|
| **ICU A2** Named accountable person | Name one person responsible | **Done in this draft:** Will. Needs Will's OK. |
| **ICU C1** Content moderation function | Review content you suspect is illegal | **Partly met.** Admin tools exist. No written process. Single person. (G4) |
| **ICU C2** Swift takedown | Remove illegal content swiftly once you know | **Improved, still partly met.** Hide, delete, and suspend exist. Hide now moves the image to a private bucket, with a sweep button if the move fails. Still no written target time (G4). Illegal images should still be deleted, not only hidden (G9). |
| **ICU D1, D2, D7** Reporting and complaints | Easy to find and use. Act on reports. | **Mostly met.** Report button, public form (including a single comment), email, and admin alerts for new reports. Check UK wording (G7). |
| **ICU D** Complaints about takedowns and non-compliance | Let people complain and act on it | **Partly met.** Terms offer "email within 6 months". No UK-specific mention. |
| **ICU G1, G3** Terms of service | Say how you protect users from illegal content. Clear and easy to find. | **Mostly met** in Terms section 5 and 7. Does not name the UK Act. Lawyer to check. |
| **Record-keeping** | Written, dated record of this assessment, and of the measures above. Keep earlier versions at least 3 years. | **This file** is the record once approved. |

Not required at this size and risk level (measures that need "large", "multi-risk" or a specific medium/high risk): annual board review (A1), written responsibilities for senior managers (A3), staff training (A7), automated CSAM hash matching, recommender-system rules, and others.

**Category 1 / 2A extras** (sending Ofcom the record, publishing a summary): these only apply to services Ofcom puts on its register of categorised services. A hobby service this size would not be one. (Ofcom page on illegal content duties.)

---

# 7. Gaps and actions

Code = needs an app or database change (separate branch, Will's OK to push). Non-code = process, writing, or a decision.

| ID | Gap | What to do | Type | Priority |
|---|---|---|---|---|
| **G1** | **Age gate is self-declared** (not HEAA). Children's duties likely apply. | Decide Option A, B or C in section 8. | Decision first. **Code only for Option A** (3rd-party age checks: cost and privacy to consider). | **1** |
| **G2** | **CLOSED IN CODE (check live).** Migration `0039` adds `private.purge_old_reports()` and daily `pg_cron` job `purge-old-reports` (03:17 UTC). Open reports are never deleted. | Will: in the Supabase dashboard (or SQL `select * from cron.job`), confirm the job is scheduled. If it is not, apply `0039` with Will's OK. Residual risk: the job was not verified from this update; if cron is off, old reports would stay. | Check live (non-code). Re-apply only if missing. | **Check** |
| **G3** | **CLOSED IN CODE.** Migration `0040` plus `/admin/users`. Suspended members cannot post, comment, vote, follow, report or upload. They can still sign in, read, and delete their own data. | Keep using the Accounts page. Residual risk: I did not query the live database; if `0040` were missing, the page would error. The feature is on the branch described as live. | Done in code. | — |
| **G4** | **One moderator, no response target, no backup.** | Write a one-page moderation routine: check reports daily; illegal content within 24 hours (proposal, Will to confirm); name a backup or an "away" plan. Say the target in Terms. | Non-code (plus a small Terms edit). | **3** |
| **G5** | **No UK or child user numbers.** Can't justify "not significant" or "few children". | Choose a privacy-friendly count (for example Vercel's built-in country totals) and update the Privacy Policy if needed. Or record that scope is assumed. | Non-code or small **code** change. | 4 |
| **G6** | **MOSTLY CLOSED IN CODE.** Hide moves the image to the private `hidden-media` bucket (migration `0041`). The Hidden items page has a **“Make hidden images private”** button for leftovers. | Residual: public files are still reachable by URL until hidden or deleted; there is still no age gate on public file URLs. For illegal images, **delete** the item (and keep a note — G9), do not only hide it. | Mostly done. Residual is process (G9) plus the public-bucket design for visible items. | Residual |
| **G7** | **Terms and Help don't mention the UK Act or UK support.** | Add a short UK section: how to report, how complaints work, UK help (Samaritans 116 123, Childline 0800 1111, Drinkaware). Lawyer to word it. | Terms text edit (**code**, small) after lawyer review. | 5 |
| **G8** | **No image scanning.** Fine at low risk, but impact of CSAM is severe. | Record the decision to rely on reports for now. Revisit if image volume grows. Consider free tools (for example Cloudflare's CSAM scanning tool for sites behind Cloudflare). *Not checked: whether it fits this setup.* | Non-code decision. | 5 |
| **G9** | **Deleting illegal content destroys evidence** for law enforcement. | Write down what to do (for example, keep the report record and note the URL and time before deleting; contact the police and, for child abuse images, the IWF). Lawyer to advise. | Non-code. | 4 |
| **G10** | **Nobody checked Ofcom's Risk Profiles box by box.** | Will or the lawyer ticks the factors against Ofcom's current Risk Profiles (section 4 note). | Non-code. | 3 |
| **G11** | **Live data not reviewed.** Real reports, admin count and any past incidents were not read. | Will reviews `/admin/reports` history once and records anything notable here. | Non-code. | 4 |

Other points, lower priority:
- Review the share-preview bypass (stub with title and summary for bots, now also for `/challenge`). It is text only, so low risk, but it is still the one place content shows without any age check.
- The UK duty to **report detected CSAM to the National Crime Agency** may apply to Social Sips. *I did not confirm whether that duty is in force or applies at this size. Lawyer to confirm.*

### Residual risk (after the closed code gaps)

Illegal-content risk levels in section 5 are **unchanged** in this update (still no Medium or High; still no live report data). The main residual risks are: the self-declared age gate (G1); a single moderator with no written target time (G4); no UK/child user counts (G5); no image scanning (G8); and deleting illegal content without a written evidence step (G9). Closing G2, G3 and G6 lowers the chance that a closed report is kept too long, that a repeat offender can keep posting, or that a hidden illegal image stays on a public URL. They do not, on their own, settle the children's HEAA question. v0.3 rates harmful substances as Low, so PCU B5 looks less likely, but **that is for the lawyer, not settled here.**

### Remaining code (and small build) tasks

Ordered, smallest first. Do not start these until Will says so. Anything that needs lawyer wording waits for the WKO review.

1. **Live checks (Will does, no code):** confirm in Supabase that migration `0039`’s `purge-old-reports` cron job is scheduled, that `0040` and `0041` are applied (the Accounts page and hide-image flow work), and whether `0043` (welcome dismiss) has been applied.
2. **UK wording in Terms and Help (G7), after the lawyer drafts it:** a short UK section on how to report, how complaints work, and UK help lines (Samaritans 116 123, Childline 0800 1111, Drinkaware). Small copy change only.
3. **“Save a note, then delete” for illegal images (G9 residual):** a small admin flow that stores the URL, time and report id, then deletes the file and row, so evidence is not lost. Lawyer should say what to keep.
4. **Optional, only if the lawyer wants numbers (G5):** a privacy-friendly way to see UK (and maybe age-band) visitor totals, for example Vercel’s built-in country stats, plus a Privacy Policy line if needed.
5. **Only if the lawyer says HEAA is required (G1 Option A):** integrate a third-party age-assurance vendor. This is a bigger job (cost, privacy, a vendor, friction for users). Do not start it first.
6. **Only if the lawyer says to block the UK (G1 Option B):** a geo-block for UK visitors, plus a review of UK help-line wording so the site is not still aimed at the UK. Do not start it first.
7. **Later, if image volume grows (G8):** look at image scanning (for example Cloudflare’s CSAM scanning, if it fits this setup). Not needed at the current size, but record the decision.

---

# 8. Children's access assessment (and children's risk assessment)

Sources: Ofcom's *Children's access assessment duties* page, *Children's Access Assessments Guidance*, *Guidance on highly effective age assurance*, *Protection of children duties* page, *Guidance on content harmful to children* (links in section 11).

### Stage 1. Can children get in?

- Ofcom: you can only say "no, children can't access this" if you use **highly effective age assurance** (HEAA) **and** access controls that block anyone not shown to be an adult.
- HEAA means **technically accurate, robust, reliable and fair**. Ofcom's examples that can work: photo-ID matching, facial age estimation, reusable digital ID, credit card checks, open banking, mobile-network checks.
- Ofcom's examples that **do not** count: **self-declaration** (typing a birth date or ticking an 18+ box), debit cards that don't need 18+, and "terms say 18+".

**What Social Sips does:** type a date of birth (guests) or date of birth plus tick box (sign-up), Terms say 18+. Under-18 answers get blocked for 24 h. This is **self-declaration**. A child can lie, or try again with a different browser.

**Result: this is not HEAA. Children are normally able to access the service.** Honest and clear. Go to stage 2.

### Stage 2. Is the "child user condition" met?

It is met if there is **a significant number of child users**, **or** the service is **likely to attract a significant number of children**. Ofcom says "significant" can be a small number and tells you to err on the side of caution. Ofcom also says most services without HEAA are likely to be accessed by children.

| Question | Evidence | Answer |
|---|---|---|
| Do we know how many children use it? | No data. No analytics. Self-declared ages only. | **Unknown** |
| Benefits to children? | Games, cocktails and memes about alcohol. Aimed at adults. | Probably not |
| Content appealing to children? | Party and meme culture can appeal to older teens. | **Possibly** |
| Design appealing to children? | Dark neon look, memes, reactions. Plays well on phones. | **Possibly** |
| Children part of a commercial plan? | Non-commercial. No. | No |

**Draft conclusion: treat the child user condition as MET (cautious).**
Reasons: no evidence either way, Ofcom says err on the side of caution, and Ofcom's own tool says that answering "yes, children can access" lets you move on without more evidence.

*The other route is to argue "not met" with evidence. I would not take that route with no user data. Lawyer to confirm.*

If we conclude "not met" instead, Ofcom wants the **detailed evidence written down** and the assessment **repeated within 12 months**.

### Your options (Will decides, with the lawyer)

| Option | What it means | Good | Bad |
|---|---|---|---|
| **A. Add real age checks (HEAA)** | Use a third-party check (photo ID, face estimate, etc.) before access. | Strongest answer. May lower children's duties a lot. | Cost, privacy work, a vendor, friction for users, code changes. Heavy for a hobby app. |
| **B. Block UK users** | Geo-block the UK so there are no UK links. | Removes OSA duties. Simple on Vercel. | Loses UK users. VPNs. Ofcom may still see the site as UK-targeted if the UK help lines stay. |
| **C. Accept the children's duties (light touch)** | Keep the self-declared gate. Do the children's risk assessment (below). Apply the Protection of Children Code measures for a small service. | No new vendor. Mostly what you already have. | Ofcom may still say the gate is not enough. **PCU B5** looks less likely if the harmful-substances rating stays Low (see below), but that is for the lawyer. |

**PCU B5 and Option C (lawyer to check).** In Ofcom's *Codes at a glance* (text extract, not re-read in full for v0.3), measure **PCU B5** says services must use HEAA to protect children from priority harmful content when (a) that content is not the service's main purpose, (b) their Terms **prohibit** that content, and (c) their risk for it is **medium or high**. Social Sips' Terms **do** ban "encouraging dangerous, excessive or forced drinking". I now rate that risk **Low** (see below), so I do not think condition (c) is met. Please confirm both the Low rating and whether B5 still applies.

**My recommendation:** stay with Option C on paper, with the Low rating and the weak spots written down, and ask the lawyer to confirm. Only then choose A or B if the lawyer says HEAA is still required.

### Children's risk assessment (updated in v0.3)

Ofcom's categories of content harmful to children: **4 primary priority** and **8 priority** kinds, plus "non-designated" kinds (Ofcom names depression content and body-stigma content). Same scale and same four steps.

| Kind | Level | Why |
|---|---|---|
| **Pornographic content** (PPC) | **Low** | No porn is meant to be here. Terms ban nudity and sexual content. Public image uploads are not scanned. |
| **Suicide content** (PPC) | **Low** | Alcohol context. No evidence of this content. `/help` has support lines. |
| **Self-harm content** (PPC) | **Low** | As above. |
| **Eating disorder content** (PPC) | **Low** | Not the topic. Cocktail content could mention drinking instead of eating, but no instructions are allowed. |
| **Abuse and hate content** (PC) | **Low (watch)** | Memes and comments, public. |
| **Bullying content** (PC) | **Low (watch)** | Public comments, follows. Block tool exists. |
| **Violent content** (PC, serious violence against people) | **Low** | Meme images could show violence. No sign of it. Not the topic. |
| **Violence against animals or creatures** (PC) | **Negligible** | Not the topic. |
| **Dangerous stunts and challenges** (PC) | **Low** | See the detailed case below. Weekly Dares are meme or drink-recipe themes, not injury stunts. |
| **Harmful substances content** (PC) | **Low** | See the detailed case below. The category is *encouraging excessive* drinking, not every mention of alcohol. |
| **Depression content** (non-designated) | **Low** | Not the topic. |
| **Body stigma content** (non-designated) | **Negligible** | Not the topic. |

**Result:** no Medium or High children's ratings in this draft. If the lawyer agrees, this would be a **low-risk service for children** as well as for illegal content (only the core children's measures would apply). This is a change from v0.2, which rated harmful substances as Medium and therefore treated the service as "single-risk" for children.

**Children's measures for a smaller, low-risk service** (Codes at a glance, from the earlier extract): name an accountable person (PCU A2, Will) · content moderation function that reviews and acts swiftly (PCU C1, C2) · complaints and reporting (PCU D1, D2, D7, D10, D13, D14) · terms that cover protection of children and are clear (PCU G1, G3). Most are the same as the illegal-content measures above. **PCU B5 (HEAA) is written for medium or high risk. I do not think it is triggered if the Low rating stands. Lawyer to confirm.**

### Why harmful substances (and dangerous challenges) are rated Low

This is the detailed case. Short sentences. File paths are to the current code. Nothing here is invented user data.

#### What Ofcom's category actually covers

I read Section 9 of Ofcom's *Guidance on content harmful to children* (PDF, 24 April 2025) in full for this update.

The Act (section 62(9), as quoted by Ofcom) defines harmful-substances content as content which **encourages** a person to ingest, inject, inhale or otherwise self-administer a physically harmful substance, or a substance in a quantity that is physically harmful.

Ofcom Table 9.1 says "encourage" here means **active or express encouragement**: recommending, advising, inciting, inducing or instigating. Paragraph 9.4 says content that only depicts or describes use, with no active or express encouragement, is **unlikely to be in scope**.

Alcohol is on Ofcom's list of harmful substances (it is not legal to sell it to children in the UK). But not every alcohol mention is in-scope content. Ofcom's alcohol example of content that **is** in scope (Table 9.2) is:

> "Content encouraging activities that involve drinking excessive amounts, often to the point of vomiting or passing out, e.g., encouraging initiations or hazing rituals or other challenges involving excessive consumption of alcohol."

Ofcom's example of content that is **not** in scope (Table 9.3) includes:

> "Content depicting or describing individuals drinking alcohol … without active or express encouragement of others to do the same."

The same paragraph 9.11 notes that out-of-scope content may still be **unsuitable for children**. That is a separate point from this rating.

Dangerous stunts and challenges (Section 10, and the Act) is content which encourages, promotes or provides instructions for a challenge or stunt **highly likely to result in serious injury**. That is a high bar. A weekly "Dare" that is a meme theme or a drink-recipe variation is not, by itself, that kind of content.

#### Risk factors (Ofcom Table 6)

Ofcom's Children's Risk Profiles (PDF, 24 April 2025, Table 6) list these **specific** user-to-user risk factors for harmful-substances content: social media services; video-sharing services; posting images or videos; content tagging; and features that increase engagement.

How those sit on Social Sips:

| Risk factor | On this service? |
| --- | --- |
| Social media service (1a) | **Partly, and this is a weak spot.** There are public posts, profiles, follows and comments. It is a small hobby community, not a large service built to maximise engagement. A lawyer could still treat 1a as a yes. |
| Video-sharing (1f) | **No.** No video uploads. Images and GIFs only. |
| Posting images or videos (4d) | **Yes.** Memes, game covers, drink photos and avatars. |
| Content tagging (5b) | **Weakly.** Games can have up to 10 user tags (`src/lib/validators/game.ts`). Not a hashtag discovery system. |
| Features that increase engagement (7) | **Mostly no.** There is no "For you" recommender and no autoplay. The main feed is newest first. "Top" is a user-chosen sort by star rating. "Following" shows only people you chose (`src/app/(main)/feed/page.tsx`, `src/lib/queries/games.ts`). Reactions, comments and follows do exist. |

For dangerous stunts, Table 6 also lists user connections and content recommender systems. Follows exist. A recommender does not.

Ofcom says that, ordinarily, **few** specific risk factors for a kind of content point to a **lower likelihood** (guidance 4.30 / Table 10). I count few clear yeses here. The general factors still apply: the user base is aimed at adults; the project is a non-commercial hobby with no ads or payments.

#### Evidence from the app

1. **18+ wording and checks.** Guests type a date of birth (`src/app/(auth)/age-gate/`). Under-18s get an exit page and a 24-hour block. Sign-up asks for a date of birth, shows "18+ only. We check your date of birth.", and a required tick box: "I confirm I am 18 or over, and I'll drink responsibly." (`src/app/(auth)/sign-up/page.tsx`, `SignUpForm.tsx`). The database rejects under-18 sign-ups (`supabase/migrations/0001_init.sql`, `0002_age_confirmation.sql`). Terms section 2 is "18+ only" (`src/app/(legal)/terms/page.tsx`). Privacy says 18+ only, and that an under-18 account is deleted. This is still **self-declaration, not HEAA**. I do not claim children cannot get in.

2. **The Terms ban the in-scope content.** Terms section 3: content is for entertainment; know your limits; never drink and drive; don't pressure anyone to drink; drinking games are optional; alcohol-free versions are always fine; Drinkaware and Austrian help links. Terms section 5 bans content that targets under-18s or shows minors drinking, and bans "Encouraging dangerous, excessive or forced drinking, drink-driving, or mixing alcohol with drugs." It also bans selling alcohol.

3. **Responsible-drinking and soft-drink notes already in the product.** Home: "18+ only. Every game works with soft drinks." and "Social Sips promotes responsible drinking. Know your limits, and never drink and drive." (`src/app/page.tsx`). Footer on every page: "18+ only · Please drink responsibly", plus a Help link (`src/components/layout/LegalFooter.tsx`). Help page: pace yourself, eat, never drink and drive, every game works with soft drinks, look after friends; Drinkaware / Drinkline 0300 123 1110; Austrian help; 112 / 999 (`src/app/(main)/help/page.tsx`). The built-in Kings Cup play screen: "Nobody has to drink to play. Soft drinks work just as well." (`src/components/play/KingsCup.tsx`). Drink recipes can be marked and filtered as alcohol-free (`src/components/cocktails/*`).

4. **Built-in Drinks and Dares.** The weekly Dare is only a **meme** or a **cocktail-variation** (recipe) theme, set by an admin, not a drinking stunt (`src/lib/challenge.ts`). Seeded drinks include a virgin/alcohol-free example (`supabase/seed.sql`). Seeded games are mixed: "Mocktail Mafia" is alcohol-free (`no_hangover`); "Neon Never Have I Ever" says "takes a sip"; "Cosmic Cups" is a flip-cup relay where "each player drinks" and is tagged `two_day_hangover`. There is **no** cap on how intense a user-written game can be, and **no** wording filter. Hangover ratings are a warning label (`no_hangover`, `mild_hangover`, `two_day_hangover`), but the public jokes include "Cancel your plans. All of them." (`src/components/ui/HangoverBoard.tsx`). That last point is a weak spot, not a strength.

5. **Moderation.** Anyone can report, including a single comment (`/report`, `src/lib/validators/comment.ts`). One report reason is **"Dangerous drinking / unsafe"**. Admins get a nav badge and in-app alerts (migration 0044, marked applied live). They can hide (image moves to a private bucket, plus a "Make hidden images private" button), delete, or suspend an account (migrations 0040 and 0041, `/admin/users`, `/admin/hidden`). Closed reports are set to be deleted after 12 months (migration 0039 — confirm the live cron job). Posts are **not** pre-checked before they go live.

6. **No DMs, no "For you" feed, no user search.** There are no private messages, no live video, and no clickable links in user text (section 3 of this file). Adults cannot search for or message children on the service. Content is not pushed to strangers by an algorithm.

7. **Design is aimed at adults, not children.** Dark pub-board look (bottle green, cream, brass), hangover scale, 18+ on share cards and the homepage. It is not a cartoon or brightly child-targeted design. Party memes and a phone-friendly layout could still appeal to older teens. I do not claim "no child would like this."

8. **Scale.** This is a non-commercial hobby project, pre-launch, with a stated first target of about **50 users** by 31 January 2027. I have **no live user count** and no analytics. Ofcom's Medium/High impact examples talk about 100,000 or 1 million monthly UK child users, and about content going viral. We are nowhere near that. Ofcom also says: if a service has a *high* number of users and no age data, assume a high number of children (guidance 4.34). That "high number" example does not fit a 50-user hobby app. I still have no proof there are zero child users.

#### Likelihood: Low

I rate the likelihood that a child would encounter **in-scope** harmful-substances content (active encouragement of excessive or forced drinking) as **Low**.

Why: the Terms ban that content; there is a dedicated report reason and a working hide/suspend path; the feed will not push a post to strangers; the service is tiny; Ofcom's own examples are about hazing and drinking until someone is sick, which is not what the product is designed to host; and only a few of Ofcom's specific risk factors clearly apply.

I do **not** claim the second Low-likelihood limb in Table 10 (comprehensive, "very effective" systems, for example all content pre-moderated). We do not pre-moderate. I also do not claim there is proof of zero cases, because live reports were not read (gap G11).

I do not rate this Negligible. Children can still lie at the age gate, and a user could still post in-scope content before an admin sees it.

#### Impact and overall rating

If a child did see genuine "drink until you pass out" or hazing content, the **severity would not be low**. Ofcom Table 10 is clear: if severity is high, even a small number of instances can mean the service is not Low *for impact*. I will not pretend otherwise.

What *is* limited is **reach**: a handful of intended users, no viral recommender, and a hide/suspend path once something is reported. The everyday content (recipes, optional sip-based games, responsible-drinking notes) is, on Ofcom's Table 9.3, mostly depiction or information, not in-scope encouragement of excess.

**Overall children's risk for harmful substances: Low.** I get there mainly on **low likelihood** and **small reach**, plus the existing bans and tools, not by saying alcohol harm is mild. **Dangerous stunts and challenges: also Low**, for the same reasons, and because weekly Dares are not injury stunts.

This is my judgement from the guidance and the code. It is not a legal conclusion.

#### Residual risk

A child who lies about their age can still see alcohol-themed posts. A new game can go live without being checked. A flip-cup or "take a sip" game is not Ofcom's hazing example, but it does tell players to drink. Ordinary public images still have no age gate on the file URL. If the user base grows a lot, or if reports of excessive-drinking content appear, this rating should be done again.

#### Weak spots (be honest)

1. The product is still **about drinking**. A cautious reader, or a lawyer, might say Medium because alcohol is the theme, even after reading Ofcom's narrower definition.
2. The age gate is **not HEAA**. Children can get in. Ofcom also says that if the evidence is not conclusive, pick the **higher** risk level (Risk Level Table, 4.3).
3. Posts are **not pre-moderated**. Table 10's example of a "very effective" control is pre-moderation. We do not have that.
4. **No wording filter**, and no cap on how hard a game can be. A user could post a hazing-style dare.
5. Built-in **Cosmic Cups** tells each player to drink and is labelled `two_day_hangover`. The hangover-board joke is "Cancel your plans. All of them." That can look like celebrating a heavy night.
6. Responsible-drinking and Drinkaware links are on Home, Help, Terms and the Kings Cup screen. They are **not** on every Game or Dare page. The footer says "Please drink responsibly" but does not itself name Drinkaware.
7. Live reports and user numbers were **not** checked. I cannot say "we have had no cases."
8. Memes and party culture can still appeal to **older teens**.

#### Cheap extra safeguards (not built in this job)

These would make the Low rating easier to defend. Small code or copy tasks only. Do not start them until Will says so.

1. A one-line reminder on every Game and Dare page: nobody has to drink; soft drinks are fine; link to `/help`.
2. On the game / dare form, a required tick or a prompt for a soft-drink alternative, and a short reminder that encouraging excessive or forced drinking is banned.
3. Put Drinkaware (and the Austrian help link) in the **global footer**, not only on `/help` and the Terms.
4. A simple wording flag for an admin when a post looks like hazing or "drink until you pass out" (not a full filter, just a review queue).
5. Soften or relabel `two_day_hangover` so it reads as a **warning**, not a joke about a heavy night, and review the seeded "Cosmic Cups" rules.
6. Keep the sign-up 18+ line, and add the same short "18+ only, drink responsibly" line at the top of the create-game and create-dare screens.

If a children's risk assessment is required, you also have to **tell Ofcom if you find "non-designated" harmful content** on the service (nondesignatedcontent@ofcom.org.uk). None found as far as I know (no live data checked).

---

# 9. When to redo this assessment

Redo **at least once a year** (next due **19 November 2027**). Redo **before** any big change, for example:

- direct messages, group chat, voice, video, live streams
- video uploads
- clickable links in user content
- a "for you" or personalised feed
- a search for people
- ads, payments or selling anything
- a big jump in users, or a campaign aimed at the UK
- anything that lets adults contact other users privately

Also redo it if Ofcom changes its Risk Profiles, or after a serious incident.

# 10. Record-keeping and sign-off

Ofcom wants a written, dated, easy-to-understand record, **kept in a durable place**. Keep earlier versions **at least 3 years**. (Check Ofcom's current Record-Keeping and Review Guidance on its regulatory documents page. The copy I could reach was marked superseded.)

| | |
|---|---|
| This file is the record | `docs/legal/uk-osa-risk-assessment.md` in the repo (history kept by git) |
| Accountable person | William Stocks |
| Draft written by | Social Sips assistant, 17 Nov 2026 |
| Draft updated by | Social Sips assistant, 19 Nov 2026. v0.2: refreshed against later main (G2, G3, G6 closed in code). v0.3: harmful-substances children's risk changed from Medium to Low, with evidence, weak spots and extra safeguards. |
| Reviewed by lawyer | **Not yet** (WKO review pending) |
| Approved by Will | **Not yet** |
| Date approved | |
| Actions started | Code for G2, G3 and G6 is on `main`. Live cron job for G2 not verified from here. |
| Next review due | 19 Nov 2027 |

**Report to governance:** Ofcom says small services without a board can simply report the result to the person responsible. Here that is Will, so his sign-off above is the report.

---

# 11. Ofcom and legal sources

Ofcom sources were first read on 17 Nov 2026. On 19 Nov 2026 I re-read the children's risk guidance (including the Risk Level Table and Table 6) and, in full, Section 9 of the harmful-to-children guidance, plus the start of Section 10. The live Ofcom PDFs returned 403 from this environment (Cloudflare); I used Ofcom's pages via the fetch tool and a 6 January 2026 Wayback Machine copy of the same PDFs. Ofcom changes its pages; check the date on each.

**Illegal content**
- Illegal content duties (page, updated 25 Jun 2026): https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/illegal-content-duties-under-the-online-safety-act
- Risk Assessment Guidance and Risk Profiles (PDF): https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/risk-assessment-guidance-and-risk-profiles.pdf
- Record-Keeping and Review Guidance (PDF; copy seen was marked superseded): https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/record-keeping-and-review-guidance.pdf
- Summary of our decisions (measures by size and risk): https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/summary-of-our-decisions.pdf
- Summary of each chapter: https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/summary-of-each-chapter.pdf
- All regulatory documents (current versions): https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/online-safety-regulatory-documents

**Scope**
- Regulation Checker: https://www.ofcom.org.uk/os-toolkit/regulation-checker/regulation-checker
- Overview of regulated services (PDF): https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/overview-of-regulated-services.pdf

**Children**
- Children's access assessment duties (page, updated 29 Jun 2026): https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/childrens-access-assessment-duties-under-the-online-safety-act
- Children's access assessment tool: https://www.ofcom.org.uk/os-toolkit/child-access-assessment/childrens-access-assessment-tool
- Children's Access Assessments Guidance (PDF): https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-age-assurance-and-childrens-access/childrens-access-assessments-guidance.pdf
- Protection of children duties (page, updated 1 Apr 2026): https://www.ofcom.org.uk/online-safety/protecting-children/protection-of-children-duties-under-the-online-safety-act
- Age assurance duties (page): https://www.ofcom.org.uk/online-safety/protecting-children/age-assurance
- Guidance on highly effective age assurance, Part 3 (PDF): https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-age-assurance-and-childrens-access/part-3-guidance-on-highly-effective-age-assurance.pdf
- Guidance on content harmful to children (PDF, published 24 April 2025): https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/guidance-on-content-harmful-to-children.pdf — **Section 9 read in full** for v0.3 (definition, “encourage” in Table 9.1, paragraphs 9.4–9.11, Tables 9.2 and 9.3). Start of Section 10 also read. Wayback copy used: https://web.archive.org/web/20260106175424/https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/guidance-on-content-harmful-to-children.pdf
- Children's Risk Assessment Guidance and Children's Risk Profiles (PDF, published 24 April 2025): https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/childrens-risk-assessment-guidance-and-childrens-risk-profiles.pdf — Step 2 (especially 4.22–4.36), Table 6 (specific risk factors, including harmful substances and dangerous stunts) and Table 10 (Risk Level Table, pages 68–71) read for v0.3.
- Protection of children duties (page): https://www.ofcom.org.uk/online-safety/protecting-children/protection-of-children-duties-under-the-online-safety-act
- Protection of Children Codes: Codes at a glance (PDF): https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/codes-at-a-glance.pdf — PCU B5 wording is still from the earlier extract; not re-read in full for v0.3.

**The Act**
- Online Safety Act 2023, section 230 (self-declaration is not age verification or estimation): https://www.legislation.gov.uk/ukpga/2023/50/section/230

*Note on sources:* v0.1/v0.2 relied in part on a law-firm summary for the “excessive alcohol” example and had not read Section 9 in full. **v0.3 read Section 9 in full** from Ofcom's PDF (and a Wayback copy when the live file was blocked). I have **not** read Section 8 of Ofcom's *Children's Register of Risks* (the impact chapter that Section 9.8 points to). The lawyer should check that chapter too.

**Processors / DPA (checked 19 Nov 2026)**
- Vercel Data Processing Addendum: https://vercel.com/legal/dpa (last updated 17 March 2026, effective 31 March 2026). The public text says it applies to Enterprise and Pro plans. The live project's plan was not checked.
- Supabase DPA (already linked from the Privacy Policy): https://supabase.com/legal/dpa


---

# 12. Questions for the WKO lawyer

These are questions, not answers. Please treat every point below as **for the lawyer to decide**.

1. Is Social Sips in scope of the UK Online Safety Act at its size, with UK help lines on the site and no user counts?
2. **HEAA or a UK block?** The age gate is only self-declared (type a date of birth). Ofcom’s public guidance says that is not highly effective age assurance. For a hobby 18+ alcohol-themed app, should Will: (A) add real age checks (HEAA), (B) geo-block the UK, or (C) keep the current gate, do the children’s duties, and write down why? What is the least heavy option that still meets the duty?
3. **PCU B5, please confirm.** We now rate harmful-substances children's risk as **Low**, because Ofcom's category is active encouragement of *excessive* drinking (initiations, hazing, drinking until someone is sick), not every alcohol-themed post, and because the Terms ban that in-scope content, the service is tiny, there is no recommender, and there is a report / hide / suspend path. The weak spots are written down in section 8 (no HEAA, no pre-moderation, no wording filter, a heavy seeded game, no live report review). Does the Low rating stand? If it does, is **PCU B5** (HEAA when the Terms prohibit the content and the risk is medium or high) **not** triggered? If you think the rating should stay Medium, please say why.
4. If we chose Option B (block the UK): is a Vercel or middleware geo-block enough, or would UK help lines, English-language copy, or VPN use still count as UK links? What wording would we need to change?
5. Does the duty to report CSAM to the National Crime Agency apply at this size, and what should be kept as evidence before deleting an illegal image?
6. Is the flashing-images offence relevant for animated GIFs?
7. Wording for a short UK section in the Terms and Help (how to report, how complaints work, UK help lines). The 12-month report retention promise now has a delete job in the code; please say if the Privacy Policy wording still needs a change, and whether Will must confirm the live cron job.
8. **Vercel Hobby plan and the DPA.** The Privacy Policy already links to Vercel’s Data Processing Addendum (https://vercel.com/legal/dpa). The public DPA text, last updated 17 March 2026 and effective 31 March 2026, says it applies to Vercel’s processing “for Customers who are on Enterprise and Pro plans.” I have **not** checked which plan the live Social Sips project is on. If it is on the Hobby plan, does that leave a gap under GDPR Article 28 (no processor contract), and should Will upgrade to Pro so the DPA applies? This is a GDPR / DSA point as well as an OSA one. Please also say whether a non-commercial hobby project on Hobby is otherwise acceptable under Vercel’s terms.
9. Who should be named as the accountable person, and is the record in this file enough once Will signs it?
