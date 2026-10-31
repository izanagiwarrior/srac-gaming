# Account ownership, sessions and cross-device safety

Current release3.5.0 / `2026-10-31-disconnect-grace-1`. Read root AGENTS for actual deployment/Git status; preparation is not publication.

## Included in3.5.0: latest game connection controls the account

The user superseded the3.2confirmation flow below. The shared cloud client automatically claims its authenticated owned seat on game connection, moving control from the old device with no confirmation popup. Opening the hub/account profile alone does not steal a game controller. Old controllers stop reconnecting and offer Main di perangkat ini; a human reload reconnects and takes control back. A stale/raced claim stops with manual retry instead of automatically fighting the winning device. Existing socket-bound challenge, account validation and durable token/host checkpoint remain unchanged. The latest successful server-serialized claim wins; clicking or editing an old device's cached data cannot overwrite current game state. An existing occupied room must still be left before changing rooms.

Manual recovery-file removal is included. The157test results below describe installed3.2.0, not validation of this new automatic client flow. No new automated/gameplay checks have been run for this candidate.

## Identity and persistence

The old game identity was a random browser seat token, **not IP**. IP-derived salted fingerprints are used only for auth rate limits. Cloud sign-in identity now comes from an HttpOnly session validated against AccountStore SQLite; no client-supplied account ID/name/email/IP establishes ownership.

- AccountStore/accounts-v1: profiles, credentials/provider subject, login sessions, inventory, XP/coins, roles/audit/rewards, OAuth state. Only Google Client ID/Secret are Cloudflare deployment secrets, not public source.
- GamingHub/office-hub-v1: all six native game snapshots, seat `accountId`, current seat token, released status, cards/board, settlement and reward outbox. No namespace or migration history is replaced. The existing OAuth table gains only a nullable `return_to` column, with explicit insert columns to preserve old pending rows.
- Browser may retain device preferences and legacy recovery hints/tokens. They are not authoritative. Cloud entry clears an unusable cached seat instead of repeatedly trying a different account's session. Old unbound seats can be migrated only with their exact bearer token; names/IP do not prove ownership. Old data is not reset or uploaded from local previews.

## One occupied room per account; many signed-in devices

The following confirmation description records the3.2.0implementation and tests; the automatic policy above supersedes its UI confirmation requirement in3.5.0.

An account may remain signed in on multiple devices, but only one device controls one occupied room across the six games. Idle game-entry sockets are capped at8per account; login sessions at10. Native global64socket/24room/2MiB-per-game limits remain. Explicit leave releases occupancy without rewriting past settlement. Offline seats still belong to their account and must be resumed or explicitly left before creating another room.

On entry, the server returns only this account's recoverable seats (game/code/room identity/online status, never seat tokens or other hands). Taking a connected seat requires the **Lanjutkan di sini** confirmation. A90-second challenge is tied to that socket, account, room and current seat token. New controller acquisition rotates/checkpoints the token, including a token-based host reference, before native resume emits private state. The old controller receives `replaced` and closes; no resign/fold/bot replacement or new result is caused by the transfer. The old tab stops retrying and shows a persistent control-ended notice. A disconnected same-browser valid-token resume may recover automatically. Cold-runtime recovery uses the persisted account-seat association without a device-local token.

Stale challenges, copied challenges from another socket/account, old recovery tokens, duplicate-room creation and simultaneous handoff races cannot create two controllers. A failed token checkpoint restores the old token/host reference. Existing historical duplicate account seats are not deleted: the owner can discover/resume and explicitly leave them; only one connected controller is granted.

Different accounts may share a profile display name. Server-side table labels receive a bounded numeric suffix on collision (including Poker), preserving each profile and account/seat identity. Client-supplied names cannot impersonate the authenticated profile.

## Session and mutation controls

- Every game action rechecks the login session. Outgoing private state checks session expiry. The socket adapter rechecks ready state after the pre-send guard so a closed socket emits no final private frame.
- Logout closes sockets using that login session while leaving the account seat recoverable. **Keluar dari semua perangkat lain**, password change and Google linking/verified ownership claim revoke other sessions and notify GamingHub to close their controllers. Cross-object notification is best effort during outages; revoked sessions still cannot issue further game actions, and outgoing expiry is enforced. It is not a guarantee of instantaneous delivery during a service failure.
- Login recomputes the current password after its asynchronous hashing step; a simultaneous password change cannot leave an old-password login active. Password changes verify the session and unchanged credentials again before commit.
- JSON is streamed with an8KiB ceiling and must be an object; malformed/oversized input fails explicitly. Mutation origin/Fetch-Site and input are checked before authenticating their principal, preventing slow-body stale-authorization windows. Balance mutations likewise parse before cross-object admin verification. Account permissions/ownership remain server-enforced.
- Google return links are stored in one-use OAuth state and restricted to same-origin six-game routes. No external redirect. Only openid/email/profile scopes; shared Google project branding/audience are unchanged.
- Message size/rate/queue checks run before account lookups and handoff processing, including reserved shared commands. An account cannot occupy parallel rooms to collect concurrent-round rewards. Existing reward ID deduplication, minimum participation and daily cap remain; this is not proof against every kind of multi-account farming.

## Verification

`npm run test:ui`: **157pass,0fail** on31October2026. New full Worker/workerd + SQLite tests use a disposable store and synthetic accounts, never production data:

- All six games: two-device lobby transfer, ownership/token theft rejection, duplicate rooms, stale challenge; in-progress handoff preserves own cards/board, balances and host.
- Same-profile-name Poker entry without identity collision; cross-game occupancy, simultaneous handoffs (one winner),8socket cap, logout/current-vs-other-device behavior, logout-other-devices, cold runtime persistence with no local token.
- Password change/login race, parallel purchases, optimistic admin edit races,10session cap, JSON validation, safe return paths, no output after close, stale browser seat handling and legacy unbound-token recovery.
- Existing scoring, UI, admin correction and reward tests remain included. No production game/room/settlement is created for release checks.

Manual isolated UI authoring: two tabs on a demo Blackjack lobby, explicit handoff, old tab stopped; restart recovery;390px Dark/Light dialog, readable buttons/no console warning/error on the inspected page. Cached missing legacy room returned to entry. Final stale-cache branches also have VM/server regression tests.

## Limits

Targeted tests do not certify every legal hand, full-match settlement, network partition, cross-object outage/retry, quota exhaustion, malicious multi-account scheme or physical-device/browser combination. A successful handoff fixture is not a completed-match reward test. Google real sign-in was verified for the preceding3.1release;3.2preserves its client, secrets, namespaces and claims verification. Observe production failures/usage; do not weaken auth, delete data or change namespace to resolve an incident.

Code: `cloudflare/accounts/room-access.js`, `store.js`, `security.js`, `cloudflare/worker.js`, shared room service/client, and the six native factories. Legacy Node remains token-based and hosting-only; these cloud account rules do not create a second local account database.
