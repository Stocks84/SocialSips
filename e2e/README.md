# End-to-end tests

Playwright smoke specs live in `e2e/specs/`. They were ported from the ad-hoc
Puppeteer scripts under `/workspace/ss-e2e` (age gate, play tab). Heavier flows
(follows, challenges, legal report, meme reactions, edit-own) still depend on
seeded test accounts (`zz_low_*`), `sq.sh` SQL helpers, and screenshots — keep
those in `ss-e2e` until a shared seed + fixtures layer exists. Do **not** copy
`dbg*.js`, `*.png`, or password-bearing seed scripts into this folder.

## Run

```bash
npx playwright install chromium   # once per machine
npm run dev                       # another terminal
npm run test:e2e
# or against a preview:
BASE_URL=https://….vercel.app npm run test:e2e
```

## Still in ss-e2e (not ported)

| Script | Why left behind |
|--------|-----------------|
| `follows.js`, `challenge.js`, `legal.js`, `editown.js`, `memes*.js`, `hidden*.js` | Need DB seed + real test users |
| `dbg.js`, `dbg2.js`, `dbg3.js`, `*.png`, `del.sh`, `rest.sh` | Debug junk / screenshots |
| `seed/`, `lowfix.js`, `setup_*.sh` | Live DB mutation helpers — never run against production from CI |

When you port one of those, rewrite assertions against `data-testid`s and put
fixtures (not live SQL) under `e2e/fixtures/`.
