# Social Sips auth email templates

Ready to paste. Nothing has been changed in Supabase yet.

## Why the link looks like this

The app exchanges a `?code=` on these pages:

1. Confirm sign-up → `https://social-sips.app/auth/callback`
2. Reset password → `https://social-sips.app/auth/reset`

Both pages call `exchangeCodeForSession(code)`. That only works if the email uses **`{{ .ConfirmationURL }}`**.

Do **not** change the link to `token_hash` or `{{ .TokenHash }}`. Those would break the buttons.

The redirect path is already set in the app (`emailRedirectTo` / `redirectTo`). Leave the template link as `{{ .ConfirmationURL }}`.

## Which templates to paste

The app uses email-and-password sign-up, and "Forgot password". It does **not** use Magic Link or Invite.

| Supabase template name | Paste this? | Files |
| --- | --- | --- |
| Confirm signup | **Yes — needed** | `confirm-signup.html` + subject below |
| Reset password | **Yes — needed** | `reset-password.html` + subject below |
| Change Email Address | Optional (the app has no “change email” screen today). Paste so it still looks right if it is ever sent. | `change-email.html` |
| Reauthentication | Optional (the app does not use this today). This one uses a **code** (`{{ .Token }}`), not a link. | `reauthentication.html` |
| Magic Link | No. Not used. Leave the default. | — |
| Invite user | No. Not used. Leave the default. | — |

Plain-text wording is in the matching `.txt` files, for reference. Supabase’s Body field takes the HTML.

## How to paste (Will does this)

Do this after Resend custom SMTP is on. On the free plan, a “Powered by Supabase” line may still appear under your footer. That is normal.

1. Open the Supabase dashboard → project **eqzrngadyetamexuwrbl**.
2. Go to **Authentication → Emails → Templates**.
3. Click **Confirm signup**.
4. Subject: paste `Confirm your Social Sips account`
5. Body: open `confirm-signup.html`, select all, copy, paste into the Body box. Save.
6. Click **Reset password**.
7. Subject: paste `Reset your Social Sips password`
8. Body: paste `reset-password.html`. Save.
9. Optional: **Change Email Address** — subject `Confirm your new Social Sips email`, body `change-email.html`.
10. Optional: **Reauthentication** — subject `Your Social Sips confirmation code`, body `reauthentication.html`.
11. Check that every link still says `{{ .ConfirmationURL }}` (and the code one still says `{{ .Token }}`).
12. Do not send a real test yet. We will test later with `ss_test_bot` only.

## Subjects (copy these)

- Confirm signup: `Confirm your Social Sips account`
- Reset password: `Reset your Social Sips password`
- Change Email Address: `Confirm your new Social Sips email`
- Reauthentication: `Your Social Sips confirmation code`

## Footer (already in the HTML)

Social Sips · willsto84@gmail.com · Impressum and Privacy on https://social-sips.app

No home address is in these emails.
