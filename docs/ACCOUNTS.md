# Accounts, progression and administration — release3.7.0

Status:3.7.0 `2026-10-31-password-controls-1` is deployed, including the [admin ownership/balance editor](ADMIN-CONTROLS.md). Google production credentials are configured and real local/public Google sign-in completed with verified admin identity. See root AGENTS for the release evidence and [account safety validation](ACCOUNT-SAFETY.md) for historical3.2.0test evidence and current limits; [connection lifecycle](CONNECTIONS.md) documents the3.5.0changes, whose subsequent200-test native/SQLite validation is detailed in CONNECTION-VALIDATION.md. Git publication is recorded separately; this guide never authorizes a future release.

## Accepted Internal Google policy and user-facing explanation

On31October the user saw403org_internal with a personal Gmail account, accepted the office-account limitation, and requested a visible explanation plus deployment/publication. Current landing/login/shared account gate says this is a community game for office friends and Google requires an organization-authorized office account such as @shopee.com. The button says Lanjutkan dengan Google kantor. Email/password with a personal email remains available; no new server domain enforcement was requested or added. Do not silently switch the shared Google project to External, alter branding/other clients or remove this explanation.

## Scope and product rules

This is the account feature requested in chat on 31 October, across all six games. The supplied Mahjong Gathering PRD covers a different Mahjong redesign and explicitly lists accounts outside its scope. Its lobby, voting, scoring and table redesign are not implemented by this patch.

- One database profile per email and stable Google subject; one equipped skin and at most one accessory. This cannot prove one real human owns only one email/account.
- Email/password signup and Google OpenID Connect authorization-code flow. Bootstrap emails must use verified Google sign-in, cannot register through ordinary signup.
- Lifetime XP determines level: `floor(sqrt(totalXP / 100)) + 1`. Each eligible completed participant-round gives 20 XP and 20 cosmetic coins; a win adds 30 of each. Coins are the spendable counterpart to XP; spending never reduces lifetime XP/level. No cash value, purchases or effect on game rules/payouts.
- At least 60 seconds tracked connected participation in a server-owned active round. Daily cap 1,000 XP/coins per account, UTC. Bots/spectators receive none. Poker counts players actually dealt in; positive final hand net counts as a win. Blackjack positive round net counts as a win; other games use actual winner(s), including tied Domino winners. Draws get participation only.
- Connected time is an estimate from server events, capped to 120 seconds between samples and 2 hours per rewarded participant-round. It is not an exact stopwatch, anti-bot certification, provider usage or billing estimate.
- Shorter rounds, abandoned/unfinished rounds and past history do not retroactively earn rewards. Existing rooms acquire an identity only when their authenticated holder presents the existing seat token. They retain prior rules/scores.
- Nine AI-generated skins: Jade Keeper starter, Midnight Fox300coins, Ivory Wanderer500coins, and six free human portraits; Golden Hour accessory150coins. Purchases/equipment are server-authoritative and persist in the account DB. The UI always confirms purchases.

## Database and security architecture

`cloudflare/accounts/store.js` exports **AccountStore**, a separate SQLite Durable Object namespace, binding `ACCOUNTS`, actor `accounts-v1`, migration `v2-accounts`. Existing `GAMING_HUB`/`GamingHub`/`office-hub-v1` and migration v1 remain unchanged. This is a Cloudflare SQL database, not localStorage; it does not need a separately provisioned D1 database.

Tables: users, sessions, roles, inventory, events, rewards, oauth, limits, metadata. User/password/session/OAuth/accounting data stays server-side. Browser holds only an opaque HttpOnly, SameSite=Lax session cookie (Secure over HTTPS), not a JS-readable account token. Lifetime seven days. Passwords use per-user salted PBKDF2-SHA256, 100,000 iterations,1–128characters without complexity/strength requirements. No plaintext passwords; compare derived hashes without early equality exit. IP rate keys are salted hashes; raw IPs are not logged.

Google: authorization code + PKCE S256, one-use DB state tied to HttpOnly browser cookie, nonce, RS256 signature verification via Google JWKS, issuer/audience/expiry/verified-email checks, stable subject identity. Store provider subject and verified email; do not retain Google access/refresh/ID tokens because this app does not call Google APIs after login. Pending state/verifier/nonce expires after 10 minutes. The local Google secret remains a deployment secret, not source or a database row.

A verified Google owner can claim an unverified password-signup email: clear the old password and revoke all old sessions before binding the Google subject. This prevents an email squatter retaining access. Explicit Google linking from settings must match the signed-in account and email; it also revokes prior sessions. Changed Google email/subject collisions fail closed for manual support; no silent account merge. Password changes revoke other device sessions. Password-only signup does not verify email and cannot activate admin grants. Password reset/email delivery are not yet implemented; use Google with the same email for ownership recovery, or configure/link Google while signed in.

Mutating browser APIs require exact same-origin Origin, JSON payloads and bounded request bodies. Public Worker dispatch permits only `/api/account/*`, `/auth/google`, `/auth/google/callback`; it never forwards public `/internal/*`. Internal reward and session routes are binding-only. Admin authorization is recomputed from verified identity and current DB roles on every request. Account IDs/seat ownership are private snapshot fields; per-viewer hub profiles expose only display name and allowlisted cosmetics.

Cloud WebSocket upgrades require valid account sessions. Each message revalidates the DB session before native dispatch, so logout/password revocation stops subsequent commands. Native game rules and host controls remain authoritative. One account cannot create two live seats in the same room or resume another account's bound seat. Existing local device preferences and legacy game-seat recovery storage remain unchanged; they are not the source of truth for account/profile/XP/inventory. Clearing browser storage cannot delete those database records.

## Reward delivery

Native settlement hooks call shared `recordResult`; they never accept a browser XP/outcome value. The room's round token and result event are captured in the private game checkpoint. After successful game-save persistence, GamingHub inserts the event into its SQLite `account_outbox`, then asynchronously delivers it to AccountStore. Permanent reward IDs are unique by event/account. AccountStore applies reward, daily cap, coin credit and audit insert in one SQLite transaction. Successful delivery leaves an outbox receipt. Lost delivery can be retried without granting twice.

Game storage and account DB are separate transactions. A game can show its finished result before account delivery completes. Delivery retry counters are persisted in GamingHub SQL so cold eviction does not reset the retry budget. Pending outbox retries use a durable alarm with five bounded exponential reschedules, and retry again on later game events/connections; an upstream exception must never rewrite the game settlement. Do not claim immediate/exactly-once transport; the receiver provides idempotent application. Old room history is not replayed for XP. Poker's explicit snapshot includes progression fields. Track timestamps are reset on cold room restore so offline/recovery time is not credited.

## Admin roles and dashboard

Bootstrap, protected grants:
- `hendy.wijaya@shopee.com`
- `faiz.triputra@shopee.com`

They activate only after verified Google ownership. An email string or ordinary signup never creates admin access. Other admins can list, add, edit and remove email grants. Pending grants are visibly inactive until Google verification. Bootstrap grants and the actor's own grant are protected from accidental removal. Grant mutations require a login less than 30 minutes old. They do not change Google Workspace permissions or Git identities.

Admin views: account directory with search/pagination; live room/connected names (including locked rooms only after admin authorization); participant-round activity and estimated player minutes over seven days; XP issuance; audit filters and cursor pagination; role CRUD. Audit logs cover login/signup/failure/logout, profile/password/provider changes, join/reconnect/start, completed rounds/rewards, cosmetic purchase/equipment and grants. No hands, wall/deck, chat bodies, passwords, OAuth codes, cookies, raw IP or seat tokens. Dashboard measures new recorded events only, not pre-account sessions. It is not a comprehensive request/APM log or Cloudflare cost report. Log retention 90 days with opportunistic cleanup; rewards/inventory remain durable. Google/Cloudflare usage dashboards are separate.

## Google OAuth setup — owner steps

Do this in an owner-approved Google Cloud project, not an arbitrary office project.

1. Open https://console.cloud.google.com/ and select/create an approved project. Open **Google Auth Platform** (or APIs & Services → OAuth consent screen). Set Branding/support email, choose the appropriate audience. For a first preview use Testing and add the intended testers, including both bootstrap emails. Do not request Drive/Gmail scopes.
2. Clients → Create client → **Web application**. Name e.g. `Meja Kita Web`. Authorized redirect URI must be exactly:
   `https://srac-gaming.faiz-triputra.workers.dev/auth/google/callback`
   For local OAuth authoring, register separately:
   `http://127.0.0.1:3026/auth/google/callback`
   If the UI requests an authorized JavaScript origin, use the corresponding origin without a path. This implementation uses a server redirect, not Google's embedded JS SDK. A personal domain may require verification for consent-screen publication. Workspace policies can require administrator approval; do not bypass them.
3. Copy Client ID and Secret into private operator configuration. Never paste the Secret in chat or commit it. The repo does not contain usable Google credentials.
4. Local private `.dev.vars` (ignored): `GOOGLE_CLIENT_ID=...`, `GOOGLE_CLIENT_SECRET=...`. The current production callback is already configured; these steps are for an explicitly approved future setup/rotation, not a pending task.
5. After approval of the reviewed candidate, store production secrets through Wrangler's interactive secret prompts or the Cloudflare dashboard: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. **Secret upload can itself create a production version/restart**, so it requires release authorization; do not perform it while merely preparing source. Do not put `ACCOUNT_PREVIEW` into production.
6. Deploy with current explicit approval, preserve existing game resources, verify new AccountStore migration and real login using owner-controlled credentials. Testers must be on the Testing audience list until OAuth publishing is complete. Never ask for passwords, OTPs or Google tokens in chat.

Official references: https://developers.google.com/identity/openid-connect/openid-connect and https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/ .

## Local preview

Use an isolated Workers emulator, loopback port3026 and private `--persist-to` directory, not cloud or legacy Node data. Supply `--var ACCOUNT_PREVIEW:1` only locally. `/api/account/preview` requires BOTH this flag and hostname localhost/127.0.0.1; two clearly labelled demo personas are persisted with starter demo XP/coins. Demo is not verified Google and is never publicly enabled. No seed players/round analytics are fabricated. The default public configuration contains no preview flag.

Frontend: `/account/`, `/admin/`, `public/account-app.js`, `account.css`; shared game badges/gate use `account-bridge.js/css`. Build writes the account document to `dist/cloudflare/public/account/index.html`; do not also publish a same-basename root account.html because Cloudflare's HTML canonicalization can loop redirects. Static assets remain allowlisted. Strict script CSP is retained; no inline event attributes or third-party login scripts.

The account feature targets Workers. Legacy Node remains anonymous and does not have this database service. Its static allowlist includes the account UI, which reports the unsupported service instead of pretending to store accounts locally. Never deploy a Node origin as a substitute for account storage.

## Verification and rollout limits

Google OAuth has now been configured locally; see the latest release handoff for production status. Do not silently gate active players mid-match. Deployment can disconnect existing sockets, and future game connections require accounts; announce that change and allow active rooms to finish. No existing guest history/coins is migrated.

Initial authoring did not include automated tests. The later user instruction to finish all pending work authorized focused verification; see [release validation](ACCOUNT-VALIDATION.md) for128passing tests, real local Google sign-in and remaining limits. No promise of bug-free/authentication certification.

For further exhaustive gameplay/failure-injection work beyond the recorded checks, obtain the corresponding user request. Do not expose the Google-gated release publicly before its configuration and failure paths are reviewed. Git commit/push and production deployment remain separate actions.

### Authoring evidence — 31 October

Isolated local demo admin login; purchase Midnight Fox300 from demo480coins, equip, reload/restart preserved180coins and Fox; overview, protected bootstrap grants, pending demo grant creation and audit entries inspected. Dark/Light profile and390px (scrollWidth390) reviewed. Roles query ambiguity and account HTML redirect loop found during authoring and repaired. Shop images constrained to art220px/img219px without overlapping labels. Account browser console after final reload showed no warnings/errors. No room/game started, no real Google or password flow and no negative/security/reward/gameplay tests. Preview rows are synthetic and must never be migrated to production. Build/dry-run succeeded without publishing; screenshots/operator evidence kept outside Git.


## Local Google OAuth configured — 31 October 2026

User explicitly approved creating a new Meja Kita client in Google Cloud project SRAC-AI using faiz.triputra@shopee.com. Created a separate Web application client, `Meja Kita · Web`, with exact callbacks `http://127.0.0.1:3026/auth/google/callback` and `https://srac-gaming.faiz-triputra.workers.dev/auth/google/callback`. Existing Web client 1 was not edited. Credentials are in ignored root `.dev.vars`, mode0600; downloaded JSON also mode0600. Never print or commit either file. No production secrets were uploaded.

The project currently has Internal audience and shared consent branding `Smart Drive Image Tool`. Both were inspected only, not modified; changing them affects existing clients. Local preview3026 restarted with the same private emulator store and hidden environment bindings. Continue with Google now reaches the real Google account picker; owner must finish sign-in/consent. Callback, account creation and automatic verified-admin role remain unverified until then. No commit/push/deploy or production room action. Cloud baseline remains last confirmed2.3.1; candidate3.1.0 remains pending.


## Production activation completed — 31 October

Google production secrets were installed with release3.1.0 in deployment71c2f303-58e7-4317-b6ea-25741ce1ebc1. Owner real Google sign-in completed on workers.dev; verified admin profile and dashboard were observed. No preview rows were uploaded. Production preview flag is false and demo endpoint404. Public setup details above remain current: Internal audience/shared branding were left intact. Google tokens/passwords are not in source; future secret uploads are deployment actions requiring fresh permission.

Final3.1.1socket-guard release59095e81-d0a7-4a75-879d-7fa332eecaf4 retains the same Google secrets/SQLite actors. All six anonymous WebSocket paths return401 before game timers are initialized;128tests pass. No pending runtime patch remains.


## Cross-device ownership and session hardening

See [ACCOUNT-SAFETY.md](ACCOUNT-SAFETY.md) for3.2account-room recovery, confirmed controller transfer, one occupied room per account, logout/other-device controls, limits, legacy token migration, same-origin Google return paths and157targeted/regression tests. AccountStore and game snapshots remain separate SQLite state; browser/IP is not account authority. Latest root AGENTS gives actual deployed status.

## Password controls3.7.0

New signup and self-change forms include password confirmation and accessible eye toggles; one-character/nonempty passwords accepted, maximum128kept as a resource bound. Login accepts existing/short passwords. Legacy signup/self-change requests can omit confirmPassword; supplied confirmation must match exactly. Admin reset requires it. Passwords are never trimmed, returned or logged. Hashing/throttling/cookie protection retained.

Admin → Pemain → Kelola pemain → Reset password is a separate form. POST /api/account/admin/users/:id/password accepts password, confirmPassword, version, reason(10–240). Requires verified admin, login within30minutes, exact origin and fresh target revision; rechecks authority after async hashing. Transaction updates password/salt/revision, deletes existing target sessions, logs admin.password_reset for actor and auth.password_reset_by_admin for recipient. Logs contain IDs/names/reason/revocation flag plus normal timestamp, never password/confirmation/hash/salt. Old sockets receive revocation only for collected old-session IDs; a newly authenticated session is not inadvertently targeted. Stale/repeated request409; reload form before another reset. Google sign-in remains linked. Resetting own account also ends own session. No DB migration or production password reset was performed for release verification.

Eleven targeted local Worker/SQLite checks and Light/Dark browser form/eye inspection passed; not a full regression suite or exhaustive security/race proof.

## Pending cosmetics3.8.0

Twenty paid cosmetics (12skins/8frames), seven free skins and seven admin skins. Faiz/Hendy reserved dragon skins require their own verified administrator identity; five generic reserved avatars are available to other verified admins. Server grants entitled skins and equips a default only once, with audit. Administrator removal blocks use without deleting inventory; entitled reserved items are restored if removed. Shop prices use cosmetic coins, never lifetime XP or table balances. See [pending status](PROJECT-STATUS.md) and [asset provenance](COSMETICS-EXPANSION.md).
