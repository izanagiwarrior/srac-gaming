> **Released in3.16.1 (1November2026).** This feature is installed on Cloudflare and included in personal GitHub sourcebc80d46. Any local/pending/no-deploy descriptions below are historical authoring evidence, not a current release backlog. See [current status](PROJECT-STATUS.md). Gacha's final missing-only policy is poolfirst-light-v2.

# Gacha recovery follow-up

Pending local3.16.1 / `2026-11-01-gacha-recovery-1`,1November2026. Includes3.16.0/all earlier pending work. Pool remains `first-light-v2`: no cost, chance, missing-only selection, payout, collectible or receipt changes. Current cloud/Git remains3.11.21; no installation/push/deploy.

## Changes

- Pending request bookmarks now require a bounded pool identifier and a boolean complete-collection acknowledgement in addition to the existing request-ID shape. Malformed sessionStorage entries are ignored; the in-memory fallback remains. No balance, inventory or credential becomes client-authoritative.
- The UI no longer blindly prefers an old in-memory result over a newer database receipt. An explicitly recovered pending result takes priority for that recovery view; otherwise the newest receipt wins, including timestamp ties going to server state.
- Authenticated gacha status includes the current user's ID and existing revision, without an extra database query. A still-current render for that same user may refresh its coin display from that response only when its revision is at least the currently known account revision. Late responses from an older render/account cannot overwrite the header. Other profile fields are not assigned from a partial status response.

No database tables/indexes, namespace/binding/migration identities, rate limits, RNG or economic rules change. Existing server-scoped immutable receipts and single-transaction behavior remain untouched. No additional polling or expensive history query.

## Verified authoring

A fresh private loopback workerd/SQLite fixture used synthetic accounts/coins. A deterministic2× draw was committed via the private API driver, then a private HTML fixture inserted only its unresolved request bookmark before the real account client loaded. Browser navigation recovered the recorded result, removed the pending notice and restored the ordinary draw button. Snapshot before/after stayed2100coins,one receipt/one gacha audit event: no automatic redraw or second charge.

A later synthetic zonk receipt was then committed separately. Without reloading the account client, navigating profile→gacha showed the newer Zonk result and2000coins in both header and gacha console; it did not retain the old2× result. A bookmark with no committed receipt showed the retry instruction and made no automatic draw. A malformed overlong-pool/string-ack bookmark was ignored. Final snapshot stayed2000coins,two receipts/two gacha events. These are local UI/ledger observations, not a real network-outage production test.

Actual320px page document fit; desktop1280px width fit. No observed browser console errors. The gallery screenshot clipping attempt was invalid after viewport reset and was discarded, not used as UI evidence. Private driver/setup/bookmark scripts and forced-outcome workers remain outside publishable source.

Syntax/build inspected. No formal gameplay/full-suite, actual browser POST with dropped TCP response, disabled browser storage, OS storage restrictions, cross-device auth race, real Google, production migration or live-room verification. Preview3054 stopped, owned tabs closed, viewport reset. All previous gacha odds/selection/replay/rollback authoring evidence remains in docs/GACHA.md; this follow-up does not claim those workflows were exhaustively re-run.

Future release requires explicit authorization. Publish only the source manifest; never include private fixture workers, runtime, setup/user/request data or inspection helpers.
