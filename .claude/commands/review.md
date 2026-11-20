---
description: Review this branch's changes with the code-reviewer agent, then walk the pre-launch check
argument-hint: [PR number or focus area]
---

Review the current branch of **Social Sips**. Read-only: do not edit, commit, push, merge or deploy anything.

Extra input from the user (may be empty): $ARGUMENTS

## Step 1: Pick what to review
- If the input is a PR number (for example `12` or `#12`), review that PR's diff with `gh pr diff <number>`. This is read-only.
- If the input is a focus area (for example `security` or `mobile`), review the current branch's diff against `main` with extra attention on that area.
- If the input is empty, review the current branch's diff against `main` (`git diff main...HEAD`), plus any uncommitted changes.

## Step 2: Run the code-reviewer agent
Use the `code-reviewer` subagent on that diff and pass along the focus area. Wait for its full report. Show Will its findings ranked High, Medium and Low, with `file:line` and a suggested fix for each. Do not apply any fix.

## Step 3: Walk the pre-launch check
Go through each point below using the diff and the code it touches. For each, answer **Pass**, **Problem** or **Not checked**, with one line of evidence (a `file:line` or what you looked at). Don't tick a point you didn't actually check.

Run this check at milestones: before a new tester group, after any big change touching logins or user data, and just before public launch. For a small change, a light pass is fine.

- [ ] Point 1: **Secrets and keys.** No keys, tokens, `.env` files or passwords left in the repo or its history.
- [ ] Point 2: **Other users' data.** Can one signed-in user read or change another user's data? Check RLS policies and any query that takes an id from the client.
- [ ] Point 3: **Pages and endpoints with no auth.** Is every route, API handler, Server Action and edge function that should need a login actually checking for one?
- [ ] Point 4: **What breaks at 1,000 users.** Unbounded queries, missing indexes or pagination, N+1 requests, heavy work on every page load, rate limits on sign-up and login.
- [ ] Point 5: **Raw errors users can see.** No stack traces, database errors or `undefined` shown on screen. Friendly messages, and a way back.
- [ ] Point 6: **What's broken on mobile.** Check at phone width: tap targets at least 44px, text readable at 200% zoom, nothing cut off, forms usable with the keyboard open, labels on inputs.
- [ ] Point 7: **What a senior dev would reject.** Dead code, copy-paste, unclear names, missing tests for new logic, risky shortcuts, anything that makes the next change harder.
- [ ] Point 8: **EU legal traps.** Google Fonts or other fonts and scripts loaded from third-party servers without consent (self-host instead, GDPR); age gate on sign-up where needed; session recording or analytics without consent; marketing emails without an unsubscribe link and sender address; unclear subscription renewal terms next to any subscribe button. US-only rules (COPPA, CIPA, DMCA agent) are low priority unless Will targets the US. For this repo: Fonts (`next/font` self-hosts) and scripts are not loaded from third-party servers without consent. The 18+ gate is in place, and the privacy page matches what the code actually does.

## Step 4: Report
Give a short summary in plain, simple words:
- **Verdict:** ready, or not ready, and why.
- **Top problems:** the High findings first.
- **Not checked:** anything nobody tested (real phone, live data, emails, deployed site).
- **Next decision:** what Will needs to say yes or no to.

Fixes need Will's yes. Do not make them in this command.
