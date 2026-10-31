# Account and admin release verification — 31 October 2026

Release: **3.1.0 / 2026-10-31-admin-controls-1**. Source preparation, tests and deployment are separate facts; see root AGENTS for the final installed/publication status.

## Checks actually performed

`npm run test:ui`: **127 tests passed, zero failed** (31 October). This includes the existing Mahjong/Hong Kong and UI regressions plus21 account/admin assertions and fixture groups:

- Real AccountStore implementation in an isolated workerd/SQLite emulator: unauthenticated access; local-only demo gate; bootstrap email signup denial; ordinary-player admin denial; exact-origin mutation enforcement; password signup, wrong/correct password, logout and session privacy.
- Account edits: transaction, revision conflicts, unchanged replay, mismatched replay, inventory invariant, actor/recipient audit; purchase charged once; equipment ownership; protected/self-admin removal; unverified password account cannot activate an admin grant.
- Rewards:59-second exclusion,60-second eligibility, win bonus, duplicate delivery,1,000daily cap. Direct trusted binding calls use synthetic users, not production game results.
- Six-game balance fixtures: zero-sum transfers, stale forms, duplicate replay, unfinished-round rejection, save-failure rollback. Poker/Blackjack funding preserves net and marks personalized initial funding. These fixtures do not establish full native game settlement behavior.
- Google token checks: real generated RSA signatures, audience, nonce, issuer, expiry, issue time, verified email, tampered signature; long Google names are safely shortened to24characters. No real provider tokens are stored in tests.
- Existing Mahjong fixture updated to protocol12 and explicit Customize to disable opening animations. Sidebar mock gained document-level querySelector to match the existing UI. These were stale test expectations/mocks, not production rule changes.

The owner completed real Google login in local preview. UI settings showed faiz.triputra@shopee.com and “Identitas Google sudah terverifikasi”; admin navigation was present. Local account DB and every synthetic test/emulator store remain private and are not uploaded.

JavaScript/build/whitespace checks passed; deploy bundle320.04KiB/gzip89.44KiB,64public assets. Source/build scan found neither the actual Google secret nor a Google client-secret prefix. `.dev.vars` is ignored and mode0600. The deployment secret file contains only GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, never ACCOUNT_PREVIEW.

## Limits and operational follow-up

These are targeted checks, not a security audit or exhaustive proof. Full six-game XP delivery after real matches, outbox failure/eviction races, long-running reconnect/settlement, quota exhaustion and every mobile view are not exhaustively exercised. No production game/room is created or started for release checks. Preserve existing game DB and room actors; never import preview account rows or demo balances.

Google project SRAC-AI currently uses Internal audience and shared branding “Smart Drive Image Tool”. This restricts Google sign-in to the organization's eligible accounts; email signup is a separate path. Changing audience/branding affects other OAuth clients and needs explicit scope review. Only openid/email/profile are requested; no Drive/Gmail permission.

See [accounts](ACCOUNTS.md), [admin accounting](ADMIN-CONTROLS.md), [maintenance](MAINTENANCE.md) and [Cloudflare operations](CLOUDFLARE-WORKERS.md).
