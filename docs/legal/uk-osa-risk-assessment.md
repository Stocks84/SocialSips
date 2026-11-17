# Social Sips: UK Online Safety Act risk assessment

> **DRAFT. Not legal advice.**
> Written by Social Sips (Will's assistant) from the code and from Ofcom's public guidance.
> Will has not approved it. The WKO lawyer review must check it before anyone relies on it.
> Nothing here is published or sent to anyone.

| | |
|---|---|
| Version | 0.1 DRAFT |
| Date written | 17 November 2026 |
| Service | Social Sips, https://social-sips-livid.vercel.app/ |
| Provider and responsible person | William Stocks ("Will"), named as the person accountable (Ofcom measure ICU A2 / PCU A2) |
| Contact (only if needed) | The public contact email on the Impressum page. Not repeated here (CLAUDE.md allows that email on the legal pages only). No home address in this file. |
| Next review | **17 November 2027**, or sooner before any big change (see section 9) |

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

- The age gate is **self-declared** (type a birth date, tick a box). Ofcom says this is **not** "highly effective age assurance" (HEAA). The Online Safety Act itself says self-declaration "without more" is not age assurance.
- So Ofcom says I can't claim children can't get in. I must assume children are **likely** to be on the service and do a **children's risk assessment** (section 8).
- Biggest children's risk: **"harmful substances" content**. Ofcom lists content encouraging excessive alcohol as an example. Drinking games are the product. I rate this **Medium** (cautious).
- This may mean Ofcom expects real age checks (HEAA) for that content. **Lawyer question, not settled here.**

### Already in place

Report button (signed in) and a public report form (no sign-in) · human review by an admin · hide and delete tools · reasons sent to the author · block users · rate limits on posting and reporting · Turnstile captcha at sign-up · uploads re-encoded, 4 MB max, only jpg/png/webp/gif · no private messages · no live video · no clickable links in user text · clear Terms with banned content list · named contact.

### Gaps (full list in section 7)

1. **Children:** self-declared age gate. Decide: real age checks, block the UK, or accept the children's duties and record why.
2. **Promise not kept in code:** the Privacy Policy says reports are kept 12 months after closing. I found **no automatic delete**.
3. **Promise not kept in code:** the Terms say we can suspend accounts. I found **no suspend or ban tool**. Admins can only hide or delete content.
4. **Moderation cover:** one person (Will). No written response time, no backup if he is away.
5. **No numbers:** the Privacy Policy says there is no analytics, so I can't show UK or child user counts.
6. **Hide leaves the image file online** (to anyone with the link). Illegal images must be **deleted**, not just hidden.

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

Everything below was read from the repo on 17 Nov 2026 (`main` at `229495d`). Files are in `src/` unless stated.

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
- Files are stored in **public** storage buckets with random file names (`userId/uuid.ext`). Anyone with the link can open the file, **no age gate on the file itself**. (`0001_init.sql`, `0006`, `0015`)
- **No automatic image scanning** (no nudity, no CSAM hash matching).

### Limits and abuse controls found

- Posting limits per user: 5 games, 5 cocktails, 5 memes per hour; 20 comments per 10 min; 10 variations per hour; 10 reports per hour. (`0005_rate_limits_cocktail_search.sql`)
- Sign-in throttle and Turnstile captcha. (`lib/server/throttle.ts`, `lib/turnstile.ts`)
- Public report form: max 10 reports per IP per 15 min. (`app/(legal)/report/actions.ts`)

### Reporting and moderation flow

1. **Report.** Signed-in: "⚑ Report" button on posts, comments and variations. Reasons: illegal, under-18s involved, copyright, spam, harassment, dangerous drinking, hate, other. Anyone (no sign-in): `/report` form with link, reason, note (min 10 characters), optional email, good-faith tick. Also email. (`components/ui/ReportButton.tsx`, `app/(legal)/report`)
2. **Review.** Admin pages `/admin/reports` and `/admin/hidden`. Human review. (`app/(main)/admin`)
3. **Action.** Admin can **hide** (item disappears for the public, author can still see it), **unhide**, or **delete** (removes the row and, for delete, the image file), or **dismiss** the report. Closing a case closes all open reports about the same item. (`app/(main)/admin/actions.ts`)
4. **Tell the author.** A "statement of reasons" is saved and shown to the author. (`moderation_notices`, `components/moderation/StatementOfReasons.tsx`)
5. **Tell the reporter.** Signed-in reporters can see status and outcome.
6. **Appeal.** Terms say: email within 6 months, Will reviews it himself.
7. **Retention.** Privacy Policy says reports and decisions are kept up to **12 months** after the case closes (`lib/legal.ts`). **No code or job deletes them** (see gap G2).
8. **Suspending accounts.** The Terms say we may suspend accounts. I found **no code for this** (see gap G3).

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
| **ICU C2** Swift takedown | Remove illegal content swiftly once you know | **Partly met.** Hide and delete exist. No target time. Hide leaves image file online. (G4, G6) |
| **ICU D1, D2, D7** Reporting and complaints | Easy to find and use. Act on reports. | **Mostly met.** Report button, public form, email. Check UK wording. |
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
| **G2** | **12-month report retention is promised, but nothing deletes old reports.** | Add a scheduled job or a manual monthly SQL routine to delete closed reports and moderation notices older than 12 months. Or change the Privacy Policy wording. | **Code** (SQL migration plus job) or Non-code (policy wording). | **2** |
| **G3** | **Terms say accounts can be suspended, but no tool exists.** Repeat offenders could come back. | Short term: write down the manual way (Supabase dashboard). Better: add a "suspended" flag that blocks posting and sign-in. | Non-code now. **Code** for the flag. | **2** |
| **G4** | **One moderator, no response target, no backup.** | Write a one-page moderation routine: check reports daily; illegal content within 24 hours (proposal, Will to confirm); name a backup or an "away" plan. Say the target in Terms. | Non-code (plus a small Terms edit). | **3** |
| **G5** | **No UK or child user numbers.** Can't justify "not significant" or "few children". | Choose a privacy-friendly count (for example Vercel's built-in country totals) and update the Privacy Policy if needed. Or record that scope is assumed. | Non-code or small **code** change. | 4 |
| **G6** | **Hiding an item leaves its image file online.** For illegal images that is not enough. | Rule: illegal image content must be **deleted**, not hidden. Also keep a note of what was deleted (see G9). Later: make hide also move the file out of the public bucket. | Non-code rule now. **Code** for the later fix. | 3 |
| **G7** | **Terms and Help don't mention the UK Act or UK support.** | Add a short UK section: how to report, how complaints work, UK help (Samaritans 116 123, Childline 0800 1111, Drinkaware). Lawyer to word it. | Terms text edit (**code**, small) after lawyer review. | 5 |
| **G8** | **No image scanning.** Fine at low risk, but impact of CSAM is severe. | Record the decision to rely on reports for now. Revisit if image volume grows. Consider free tools (for example Cloudflare's CSAM scanning tool for sites behind Cloudflare). *Not checked: whether it fits this setup.* | Non-code decision. | 5 |
| **G9** | **Deleting illegal content destroys evidence** for law enforcement. | Write down what to do (for example, keep the report record and note the URL and time before deleting; contact the police and, for child abuse images, the IWF). Lawyer to advise. | Non-code. | 4 |
| **G10** | **Nobody checked Ofcom's Risk Profiles box by box.** | Will or the lawyer ticks the factors against Ofcom's current Risk Profiles (section 4 note). | Non-code. | 3 |
| **G11** | **Live data not reviewed.** Real reports, admin count and any past incidents were not read. | Will reviews `/admin/reports` history once and records anything notable here. | Non-code. | 4 |

Other points, lower priority:
- Review the share-preview bypass (stub with title and summary for bots). It is text only, so low risk, but it is the one place content shows without any age check.
- The UK duty to **report detected CSAM to the National Crime Agency** may apply to Social Sips. *I did not confirm whether that duty is in force or applies at this size. Lawyer to confirm.*

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
| **C. Accept the children's duties (light touch)** | Keep the self-declared gate. Do the children's risk assessment (below). Apply the Protection of Children Code measures for a small service. | No new vendor. Mostly what you already have. | Possible **PCU B5** problem (see below). Ofcom may say the gate is not enough. |

**Possible problem with Option C (lawyer to check).** In Ofcom's *Codes at a glance*, measure **PCU B5** says services must use HEAA to protect children from priority harmful content when (a) that content is not the service's main purpose, (b) their Terms **prohibit** that content, and (c) their risk for it is **medium or high**. Social Sips' Terms **do** ban "encouraging dangerous, excessive or forced drinking". If harmful substances is Medium (my rating below), PCU B5 **appears to** apply. I read this from a text extract of a table, so please treat it as "needs checking", not as a final answer.

**My recommendation:** do Option C on paper now (it costs nothing), ask the lawyer the PCU B5 question, and only then choose between A and B if the answer is "yes, you need HEAA".

### Children's risk assessment (first draft)

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
| **Dangerous stunts and challenges** (PC) | **Low (watch)** | Drinking dares are possible. The weekly challenge themes are set by an admin and are meme or cocktail-variation themes, not drinking dares. |
| **Harmful substances content** (PC) | **Medium** | Ofcom lists "content encouraging excessive consumption of alcohol" as an example. Alcohol is **the whole theme**. Our Terms say drinking is optional and ban pressure to drink, which helps, but the risk is built in. |
| **Depression content** (non-designated) | **Low** | Not the topic. |
| **Body stigma content** (non-designated) | **Negligible** | Not the topic. |

**Result:** one Medium (harmful substances), so a **single-risk** service for children. Not multi-risk (needs two or more medium or high).

**Children's measures for a smaller service** (Codes at a glance): name an accountable person (PCU A2, Will) · content moderation function that reviews and acts swiftly (PCU C1, C2) · complaints and reporting (PCU D1, D2, D7, D10, D13, D14) · terms that cover protection of children and are clear (PCU G1, G3). Most are the same as the illegal-content measures above. **Possible extra for medium risk: PCU B5 (HEAA), see above.**

If a children's risk assessment is required, you also have to **tell Ofcom if you find "non-designated" harmful content** on the service (nondesignatedcontent@ofcom.org.uk). None found as far as I know (no live data checked).

---

# 9. When to redo this assessment

Redo **at least once a year**. Redo **before** any big change, for example:

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
| Reviewed by lawyer | **Not yet** (WKO review pending) |
| Approved by Will | **Not yet** |
| Date approved | |
| Actions started | (fill in) |
| Next review due | 17 Nov 2027 |

**Report to governance:** Ofcom says small services without a board can simply report the result to the person responsible. Here that is Will, so his sign-off above is the report.

---

# 11. Ofcom and legal sources

All were read on 17 Nov 2026. Ofcom changes its pages; check the date on each.

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
- Guidance on content harmful to children (PDF): https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/guidance-on-content-harmful-to-children.pdf
- Protection of Children Codes: Codes at a glance (PDF): https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/codes-at-a-glance.pdf

**The Act**
- Online Safety Act 2023, section 230 (self-declaration is not age verification or estimation): https://www.legislation.gov.uk/ukpga/2023/50/section/230

*Note on one source:* the "excessive alcohol" example in section 8 comes from the text of Ofcom's *Guidance on content harmful to children* as it appeared in a law-firm summary (Handley Gill) and Ofcom's own definition of harmful substances content. I read the Ofcom PDF's definition and contents but not its full harmful-substances section (section 9). **Check that section directly.**

---

# 12. Questions for the WKO lawyer

1. Is Social Sips in scope of the UK Online Safety Act at its size, with UK help lines on the site and no user counts?
2. Is a self-declared age gate acceptable for a hobby 18+ alcohol-themed app, or must it use highly effective age assurance?
3. Does PCU B5 (HEAA for medium-risk priority content that the Terms prohibit) apply to "harmful substances" content when the whole theme is alcohol?
4. Is "block the UK" a safe way out, or does Ofcom still see UK links?
5. Does the duty to report CSAM to the National Crime Agency apply at this size, and what should be kept as evidence before deleting?
6. Is the flashing-images offence relevant for animated GIFs?
7. Wording for UK terms and complaints, and what to do about the 12-month report retention promise.
