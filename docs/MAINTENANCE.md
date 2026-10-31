# Maintenance and agent handoff

## Pending3.6.0 — compact explanations (31 October 2026)

User requests less on-screen prose and optional `?` explanations. Candidate **3.6.0 / `2026-10-31-compact-help-1`** is prepared in staging only. Shared help supports pointer hover, keyboard focus/Enter/Space/Escape and tap/outside dismissal; viewport-clamped themed popovers retain original dynamic explanation nodes/IDs. Landing/account and six game entries/settings use concise copy or optional help. Cheat sheets start collapsed only when no stored fold preference exists. Poker lobby warm-up/example odds removed; actual in-game odds retained. Core turn/timer, error, balance and confirmation information stays visible.

Running remains **3.5.1 / `2026-10-31-office-login-note-1`**, deployment `23a92239-e344-462b-a2de-8d5b0818b358`. No commit, push, public deploy/restart or production room actions authorized/performed. No rules, DB, auth policy or runtime identity changes. Private local preview inspected landing/account, all six entries and Mahjong/Poker/Capsa/Blackjack lobbies without starting games. Click/focus/Escape, checkbox-help isolation, cheat open/close and Light/Dark reviewed; hover path implemented but not directly exercised by the native browser API. The initial review excluded mobile; the follow-up below adds390px layout checks. No full gameplay or automated regression run for this candidate. Source syntax, whitespace and cloud asset build checked. Preview uses isolated local data and ACCOUNT_PREVIEW only; never publish that preview flag. [Compact UI conventions](GAME-CONVENTIONS.md).

Last reconciled: **31 October 2026**. Read root [AGENTS.md](../AGENTS.md) first. This document records context and procedures; it does not authorize push, deployment, interruption, gameplay tests or data migration. Dates below are historical evidence. Recheck actual source and service before acting.

### UI alignment review — 31 October 2026

Follow-up requests all question-mark help aligned with its label and consistent sizing. Pending3.6.0 now uses one shared non-wrapping flex row, a shrinking/wrapping text column,28px fixed icon and8px gap. Specificity prevents native game styles overriding it. Heading, legend, plain labels, standalone notes and account copy share the same row treatment. Landing mobile header grows without account-pill collision. Explicit help in the login dialog is placed in the top layer and primary login receives initial focus.

Manual private preview covered landing/account and six game entry/lobby states at390px width, Mahjong Customize long checkbox labels, Poker Customize at390/768/1280, and Dark/Light examples. Local synthetic rooms were never started; no real/public player actions. This is representative UI review, not an exhaustive guarantee for every game state, browser, zoom or device. No automated/gameplay tests run. Temporary responsive fixture/CSP adjustment existed only in generated local preview output; final build restores production frame-ancestors none and excludes preview fixture/config. Running remains3.5.1; no commit/push/deploy.

## Installed release3.5.1 — office Google login explanation

User accepted the existing Internal Google audience and explicitly requested “notes … di webnya … internal game … email kantor, deploy & push”. Current **3.5.1 / `2026-10-31-office-login-note-1`**, deployment `23a92239-e344-462b-a2de-8d5b0818b358`, https://srac-gaming.faiz-triputra.workers.dev/ . Landing, sign-in/sign-up card and shared six-game account gate explain the office-community context: Google sign-in requires an organization-authorized office account such as @shopee.com; personal Gmail cannot use that Google button. Email/password signup with personal email remains available. This is explanatory UI, not a new domain filter or an official corporate service claim. Existing Google audience/shared branding, authentication policy, secrets, database actors/bindings/migrations, game rules, accounts/balances and legacy live are unchanged.

Syntax/whitespace/build/dry-run passed,70assets,335.60KiB/gzip93.71KiB. Private empty account/landing preview inspected in Dark/Light without signup/login/gameplay; preview stopped. Public health/new build and nine entries200; three changed public files exactly match; Google configured true, preview false,9skins retained. No public room actions or new automated/gameplay tests. The200passing regression checks remain evidence for the unchanged native game/account logic, not a new test run. Git publication of this exact change is authorized; verify the remote before reporting it complete. No pending runtime deploy. Future changes need fresh authorization.

## Previously installed release3.5.0 — 31 October 2026

User explicitly authorized “deploy push semua”. Running **3.5.0 / `2026-10-31-disconnect-grace-1`**, deployment `1add96c5-7189-49fe-9cbe-0be27cb9960a`, at https://srac-gaming.faiz-triputra.workers.dev/ . Includes all3.2.1/3.3.0/3.4.0/3.5.0pending source: account-based automatic device takeover, no manual recovery files, six free human portraits (9skins total), and six-game15second disconnect grace/native temporary AI with countdown/reconnect animation. Same AccountStore/GamingHub actors, binding/migrations, secrets and existing data; legacy Node live untouched. No production room/game actions.

Manifest37files matched the prepared patch before release,21JS syntax/whitespace and dry-run passed; bundle335.60KiB/gzip93.71KiB,70public assets. Postdeploy health/newbuild/root/account/admin/6entries200,19asset hashes match, anonymous admin and6game sockets401, Google configured true/preview false; catalog9skins and all6newfree portraits. Manual local evidence: avatar free-claim/equip with coins unchanged, Dark/Light desktop; separate connection UI fixture15→bot→reconnect. Subsequent isolated validation authorized by “lanjut”:200tests pass/0fail; native six-game grace/reconnect/full-round conservation, Mahjong claims, Chess clocks, Capsa timeout guard, automatic account client and real-time Worker/SQLite Chess grace. Six-game active cold recovery, paused-action rejection, host continuation and persistent dissolved-code rejection also pass. Additional private phase checks cover Mahjong opening/pending claims/pre-claim undo and Blackjack dealt wagers/dealer/settled restart without duplicate payment.23native cases passed10additional runs. Only a test VM fixture needed an inert setInterval; no runtime fix was needed. See [validation scope and limits](CONNECTION-VALIDATION.md). Public hosting/rooms/data remain untouched during validation. User subsequently requested “selesaikan” to complete the pending Git publication; this follow-up contains tests/docs only and does not authorize runtime deployment. Read docs/CONNECTIONS.md (or CONNECTIONS.md from docs) for behavior/limits.

Release3.5.0was already published as862bf18. No runtime patch remains pending. Validation tests/docs were committed and pushed asadb90f7bd2bfda8c9b7ac91df45876300548402c; remote main matched and the working tree was clean before this final documentation audit. No runtime deployment is needed. Future changes still require separate publication/deployment authorization. Sections below record historical preparation and earlier releases.

## Preparation history: disconnect grace3.5.0 — 31 October 2026

User requests a visible Disconnect countdown15seconds before temporary bot control and animated reconnect feedback across all games. Candidate3.5.0/build`2026-10-31-disconnect-grace-1` includes pending3.4.0/3.3.0/3.2.1. Shared factory-scoped connection lifecycle, native AI after grace, reconnect cancellation, Mahjong pending-claim grace, Chess/Domino temporary AI, Poker/Blackjack automation and Capsa deadline guard; account/seat/balance identity remains human. Shared public presence metadata drives text countdown, pulse/toast transitions, bot/connected badges and reduced-motion support. No schema/actor/data changes; cold recovery still paused. [Behavior/limits](CONNECTIONS.md). Source syntax/whitespace/cloud build passed. Isolated UI fixture only:15→bot→reconnect reviewed; no automated/gameplay tests or native six-game runtime/clock/claim-race verification. Cloud remains3.2.0; no commit/push/deploy authorized or performed.

## Preparation history: avatar options3.4.0 — 31 October 2026

User requests more profile choices (women, men, etc.). Intermediate candidate3.4.0/build`2026-10-31-avatar-options-1` (now included in3.5.0) includes pending3.3.0automatic handoff and3.2.1manual recovery UI removal. Six original AI-generated adult human portraits (Sari/Nadia/Luna/Arka/Bima/Rio), all free, bring skin catalog to9plus the existing accessory. Studio shows free unowned skins, human/character/accessory filters, and Pakai gratis claims through the existing server-owned0coin purchase then equips. Paid items, existing inventory/equipment/account balances and database schema remain unchanged; no runtime AI generator or costs. See docs/AVATAR-ASSETS.md for prompts. Current3.2.0cloud unchanged, no commit/push/deploy. Manual disposable-account preview3028: human filter shows6portraits; Pakai gratis equipped Nadia in SQLite-backed local profile and coins remained480. Dark/Light desktop inspected. Preview stopped and tab closed. Syntax/whitespace/cloud build passed; no automated/gameplay or mobile checks.

## Preparation history: automatic account handoff3.3.0 — 31 October 2026

User wants Roblox-style newest game connection to take control automatically, with the old device disconnected and able to take back only through a human reconnect. Historical intermediate candidate3.3.0/build`2026-10-31-account-auto-handoff-1` (now included in3.4.0) includes pending3.2.1manual file UI removal. Cloud shared client automatically claims its authenticated DB seat using the existing socket-bound challenge/token checkpoint; redirects to the owned game when necessary. No normal takeover popup; stale/raced claims stop with an explicit retry, never an automatic claim loop. Old-controller notice includes Main di perangkat ini (page reload). Server account verification, save-before-output, handoff tokens/cards/balances/host, logout semantics and native no-auto-reconnect remain. This changes game control, not browser-wide sign-in or account DB ownership. Running cloud3.2.0 remains unchanged. No commit/push/deploy authorized; syntax/build only, no automated/gameplay/runtime UI checks yet for this candidate.

## Previous account safety3.2.0 — 31 October 2026

User explicitly requests fixing account/device issues, broader safety checks, personal Git push and direct cloud deployment. Deployed3.2.0/build`2026-10-31-account-safety-1` includes one occupied room per account, account-based recovery/confirmed handoff/token rotation, stale-browser cleanup, session revocation and limits, race/input/redirect guards. AccountStore and GamingHub SQLite actor/bindings/migrations preserved; only additive OAuth return column. [Safety architecture/checks](ACCOUNT-SAFETY.md):157tests pass, including full Worker/SQLite two-device and in-progress fixtures in all six games, plus private UI390px Dark/Light. No promise of exhaustive security/settlement/quota correctness. Running cloud is3.2.0, deployment `51b2c347-2665-4510-88ea-41670e608843`, at https://srac-gaming.faiz-triputra.workers.dev/ . Public health matches the build; root/account/admin/six entries200,12asset hashes match, anonymous admin and six game sockets401, Google configured true/preview false. No production room actions or legacy live changes. Personal Git publication is separately authorized; confirm the remote before reporting push complete. Future releases require a new request.

## Historical release3.1.1 — 31 October 2026

**Previously running3.1.1 / `2026-10-31-account-socket-guard-1`**, deployment `59095e81-d0a7-4a75-879d-7fa332eecaf4`, at https://srac-gaming.faiz-triputra.workers.dev/ . Includes the full3.1.0account/admin release below and rejects anonymous game WebSockets before factory/timer initialization. Automatic approval review required fresh deployment confirmation after3.1.0; user explicitly answered “Ya, deploy3.1.1 sekarang”. Deployment/checks succeeded; no pending runtime patch remains. Git publication is authorized but must be confirmed independently against the remote.

**128tests pass/0fail**, including six anonymous fetch-handler paths proving no factory startup. Public health matches3.1.1; landing/account/admin/six entries200;8account assets match source; anonymous admin and6game WebSockets401; Google configured true/preview false. Real public Google sign-in/Admin dashboard succeeded on3.1.0and the same session/configuration is retained. An authenticated Blackjack empty entry connected without room creation or gameplay. Full six-game settlements/races/quotas remain unproven; see ACCOUNT-VALIDATION.md. Google project remains Internal with shared branding, not modified. No secret/player data in Git or preview data upload, no legacy live changes. Earlier entries are historical.

## Previous release3.1.0 — 31 October 2026

**Running3.1.0 / `2026-10-31-admin-controls-1`** on https://srac-gaming.faiz-triputra.workers.dev/ . User instruction “selesaiin semua” explicitly followed the listed remaining validation, Git publication, Google production secrets and deployment work. Deployment succeeded `71c2f303-58e7-4317-b6ea-25741ce1ebc1`. Google secrets were uploaded with the same version using `wrangler deploy --secrets-file .dev.vars`; never print/commit that ignored0600file. ACCOUNT_PREVIEW is absent in production and public demo login returns404. Existing GamingHub/office-hub-v1/v1 data is retained; AccountStore/accounts-v1/v2-accounts is additive. Legacy Node live and local preview data were not migrated.

Public health reports the new build; landing, account/admin and six game entries return200. Anonymous admin overview401. Real Google login completed on the public callback as faiz.triputra@shopee.com; UI shows verified email/Admin and the live dashboard. Bootstrap Hendy activates when that user signs in with verified Google. No public room/game/result/XP was fabricated. **127tests pass**, including isolated SQLite auth/admin/purchase/reward cases, Google signed-token checks and six-game balance fixtures. [Validation and remaining limits](ACCOUNT-VALIDATION.md): full native six-game rewards/settlement/recovery races, failure injection and quota behavior are not exhaustively proven.

Google project SRAC-AI is owner-approved despite its office account. Shared branding remains Smart Drive Image Tool; audience remains Internal. Neither shared setting nor the previous OAuth client was changed. No Google Drive/Gmail scopes, paid plan or billing change. Account/possession data lives in Cloudflare SQLite. Email/password signup remains unverified and cannot activate admin grants. Account gating is now live for future game connections. Further patch/push/deploy needs a new request. Git publication is authorized for this release; verify HEAD against origin/main independently before reporting push complete. Earlier pending notes below describe preparation history, not current deployment.

## Historical preparation: admin controls — 31 October 2026

Current staging3.1.0/build`2026-10-31-admin-controls-1` includes the account candidate below plus [admin ownership/balance controls](ADMIN-CONTROLS.md). It is not deployed/pushed; cloud last confirmed2.3.1. Use versioned account mutation, preserve SQL receipts/audit, and apply native chip/point corrections only at safe boundaries with funding/transfer accounting. Do not inject an unbalanced point win. Preview evidence is limited to account possession edits and one empty Blackjack funding/broadcast; not full six-game/security/recovery verification. Google client still needs setup. No permission for Git/cloud publication carries over.

## Previous pending accounts candidate3.0.0 — superseded

Staging3.0.0/build`2026-10-31-accounts-1`, not installed/pushed; cloud last confirmed2.3.1. Read [account hosting and Google setup](ACCOUNTS.md) before changing credentials or deploying. Separate SQLite AccountStore/additive migration, no D1 provisioning required; keep game identities/data unchanged. Google OAuth is not configured. Only loopback preview may use demo login. Full provider/security/multiplayer reward verification remains pending; empty dashboard values are real absence of recorded rounds, not failure or seeded production activity. Never infer authorization from the source version. Public activation requires configured Google login and explicit review of mandatory account gating and disconnect impact.

## Installed alignment correction2.3.1

Local2.3.1 / `2026-10-23-toolbar-alignment-1` corrects the landing toolbar width and summary/theme baseline; shared grid keeps invitation controls in a separate row. Cloud2.3.1 was installed after the user explicitly requested “deploy push”. Health/root/six entries200, three CSS asset hashes and six empty WSS passed. Public desktop alignment matched the preview with no console errors. No runtime candidate remains pending; personal Git publication of this source/docs is authorized and must be confirmed from the remote. Desktop/mobile390px Dark/Light and expanded preferences were visually reviewed on a separate loopback origin, plus empty Blackjack room toolbar geometry; no gameplay/automated tests. Syntax/build/whitespace passed, preview stopped. Preserve all room data and require fresh publication authorization.

## Historical release2.3.0

**2.3.0 / 2026-10-23-lobby-consistency-1** is installed on Cloudflare following the user’s explicit “push dan deploy”. Same Worker/SQLite identities, room data and Free plan preserved. Health/root/six entries200, six empty WSSconnected and12changed assets matched source; no production room actions. No runtime installation is pending. Personal Git publication of the same source/docs is authorized; verify the remote commit before claiming push success. This release includes the previously documented2.2.1session-refresh draft. Future releases need new authorization.

Room invite/code/leave shortcuts are always visible, preferences fold separately. Common lobby controls are ordered duration → money → simple choices → Customize. Real Mahjong presets remain server-owned; other complex lobbies keep their existing defaults/values and place chip/blind/rule details inside Customize. Simple Catur/Domino/Blackjack settings move from the sidebar to above the board; shared sidebar order remains Chat/Cheat/Recap/Log. No accounting/rules/save migration, namespace/identity change or cloud operation.

Evidence: syntax/build/whitespace, six isolated empty lobby previews, copy feedback, Customize persistence after an acknowledged Poker setting, Dark/Light/390px Catur control layout. No Start, gameplay or automated tests. Prior session draft timeout and recovery races are not verified by this authoring check. No claim of bug-free full gameplay. See root AGENTS and [layout conventions](GAME-CONVENTIONS.md).

## 1. Previous2.2.0 handoff (historical)

Installed **2.2.0 / 2026-10-23-mahjong-presets-hu-1**, Mahjong v12. Cloud deployment and public checks succeeded on23October2026. No runtime candidate is pending. Personal Git publication of this same source/docs is authorized; verify actual remote before reporting push success. Public health/root/six entries200, six empty WSSconnected, five changed Mahjong asset hashes match source. Syntax/build, isolated empty lobby preset interactions and Hu visual/skip/reduced-motion fixture reviewed; no production room actions or full matches. Preview stopped. Recheck /health and remote for later work.

New lobby presents Easy (default), Normal, Hard, Customize; duration and Rp remain outside the advanced settings. Server owns preset application and pre-start locking. Easy/Normal permit0fan Hu;0fan=0points,1/2fan=8/16discardpoints (house variation),3–10followHKMA. Hard uses HKMA Hong Kong minimum3fan, **not MCR Chinese Official minimum8points**. See [Mahjong README](../games/mahjong/README.md) for exact defaults and compatibility.

Hu animation is local presentation before results, with skip/reduced motion, bounded particles, literal winner text and transient cleanup. No payout is delayed or repeated. Existing room rules/money are preserved: missing preset maps to Customize; old casual rooms retain0fan=4unless explicitly changed in lobby. No production-room actions or gameplay/automated tests are authorized merely for release checks; old106-test evidence covers2.0.1.

Cloud remains https://srac-gaming.faiz-triputra.workers.dev/ ; service srac-gaming, class GamingHub, binding GAMING_HUB, actor office-hub-v1, SQLite migration v1. Keep all identities/data stable. No Node save upload, tunnel, plan or credential change. Owner staging is development/Git; sibling live remains offline legacy1.8.0 and is not updated by a cloud release. No automatic Git deploy.

## 2. First ten minutes for a new agent

1. Read applicable parent/repo instructions, this guide and the repository skill. Parent historical notes may still describe the old tunnel; the dated cloud handoff records the later completed migration. Preserve all safety/permission requirements.
2. Inspect working directory, branch, status, diff and remote. Identify existing edits before adding yours. Do not assume a dirty tree is disposable or already published.
3. Read package.json, server.js build ID and wrangler.jsonc. Compare public `/health` when current service status matters. Source version, Git commit and cloud deployment are different facts.
4. Identify the user's current request and its authorization boundary. Default work happens in staging; leave cloud/legacy live running as found.
5. Find relevant shared components, native game factory and game README before implementation. Ask only for missing decisions that materially block work.
6. Keep a private baseline/backup of touched source, changed-file manifest and verification notes outside deployable assets. Never copy player data into source.
7. Prepare isolated local previews only when useful, on an unused loopback port and a separate private data store; never reuse an active player's room/tab or live DATA_DIR.
8. Finish the candidate, review source/diff and report evidence and limits. Tests/gameplay need a user request; do not run them merely because scripts exist.
9. For release, show exact candidate and session impact; get current explicit approval if not already given. Git and hosting approval remain separate.
10. Update the handoff/status table and private operation record. Leave no claim of success for a failed or only attempted push/deploy.

## 3. Code map and boundaries

| Area | Responsibility |
| --- | --- |
| `server.js`, `public/index.html`, `public/hub.js` | Native Node router, hub build/health, landing and room directory; no landing nickname gate |
| `games/{capsa,mahjong,poker,chess,domino,blackjack}/server.js` | Six native game factories: legality, private views, scoring, bots and phases. Chess public path is `/catur/` |
| `games/shared/room-service.js` | Shared lifecycle, seats/spectators, locks, persistence, paused recovery, rotation and dissolve reservations |
| `games/shared/table-settings.js` | Money/difficulty validation and ledger helpers |
| `public/game-tools.js`, `public/hub-game.css` | Shared sidebar, chat/emote feedback, recap/CSV, credits and layout; Capsa retains compatible native panels |
| `public/room-client.js`, `public/room-ui.css` | Reconnect/session-choice, room controls, panel folds and preferences |
| `public/theme.js`, `public/theme.css` | Dark default independent of system theme; optional shared browser Light preference |
| `games/mahjong/hong-kong.js`, Mahjong README | HK scoring/rule helper and exact supported rules/limits |
| `cloudflare/worker.js` | Routes, six-factory cloud lifecycle, Durable Object WebSocket callbacks and checkpoint-before-output |
| `cloudflare/storage.js`, `cloudflare/codec.cjs` | Private transactional chunked SQLite snapshots and reference-preserving graph codec |
| `cloudflare/compat/` | Cloud-only HTTP/WS/fs/V8/OS/timer adapters; ordinary Node keeps original modules |
| `scripts/build-cloudflare.mjs`, `wrangler.jsonc` | Allowlisted assets, bundle, cloud identity/bindings/migrations; generated output lives in ignored `dist/cloudflare/` |

Native Node uses one HTTP/WS port. Cloud uses one public origin, static Assets and a single small-hub Durable Object; it opens no laptop port. Public routes remain `/capsa/`, `/mahjong/`, `/poker/`, `/catur/`, `/domino/`, `/blackjack/`, each with its own `/ws` and room namespace. Health is `/health`, room directory `/api/lobby`.

Cloud guardrails: **64 sockets, 24 retained rooms total, 2 MiB private snapshot per game**. These are application guards, not a guarantee of Free-plan capacity. Connected native timers keep the actor active; using WebSocket callbacks does not prove hibernation. The last socket closing checkpoints/disposes native resources; cold restore pauses unfinished play. See [cloud design](CLOUDFLARE-WORKERS.md).

## 4. Product context to preserve

- Sidebar everywhere: **Chat → Cheat sheet → Recap points/Rp → Game log**. Poker probabilities follow cheat sheet. Mobile keeps this order below the table; panels must open/close without clipping. Keep drafts, focus and reading position through rerenders.
- Creators on landing and inside game: **Mahjong + Poker: Hendy W; Capsa + Domino + Catur + Blackjack: Faiz T**. These are credits, not Git author identities.
- Easy/Normal/Hard bots change decisions, use only own/public information and wait at least three seconds. Do not speed bots up for Quick Play.
- Host Rp inputs save without an extra Pasang button; Start uses displayed values. Lock settings during play. Rp measures point/chip results; there is no payment integration. Keep provisional stakes separate and settle each result once.
- Quick Play supports one round/hand, plus Chess blitz 5+0 and 3+2. Mahjong claim mode remains a separate lobby choice.
- Emoji picker sits beside Send, hidden until opened and closes on choice. Accepted emoji/chat also appear translucently at the table; history/reconnect/undo must not replay old effects. Respect reduced motion.
- Landing opens games/room links without a name form. Ask for name in the chosen game's create/join form, prefilled from the browser preference.
- A stored seat offers continue versus explicit leave-and-switch; wait for native leave acknowledgement. Transient disconnect is not permission to delete credentials. File recovery is a private seat token, not a room migration or normal invitation.
- Host dissolve confirms code + room instance, persists closed-code reservations before deleting, cleans timers and returns all participants to entry. Never create artificial payout/refund or reuse a dissolved code after restart.

### Rules that have caused confusion

| Game | Preserve / consult |
| --- | --- |
| Capsa Banting | Opening is any **legal combination containing 3♦**, not single-only. Rank 3 through A then 2; suits ♦ < ♣ < ♥ < ♠. Official four players; non-official 3–8 distributes the full deck; 1/2 humans get bots. Turn timer 60 seconds. Easy Mode hints/undo are opt-in with warning; undo at most twice per player/round. |
| Mahjong | New rooms use documented HKMA core 3–10 fan/payment ladder, flowers/replacements and default animated skippable four-wall/dice/deal opening. Four jokers and flower fan bonuses are explicitly optional house variants, OFF by default. Old saves without ruleset remain legacy. Protocol v12. Read [Mahjong rules](../games/mahjong/README.md) before changing scoring; do not claim every physical tournament rule is implemented. |
| Mahjong assistance | Manual free offers unfiltered claim controls, validates only submitted actions; assisted is default; Fast auto-passes. Highlight shows completed sets in own hand, not discard opportunities. These choices lock before play. |
| Poker | NL Hold'em, private hole cards, side pots, buy-in/rebuy accounting. Percentages describe exclusive best-hand categories at river using own/public cards, not opponent win equity. Preflop sampled, flop/turn/river enumerated. |
| Domino | Gaple score uses remaining **pips**, not tile count. Blocked table compares pip totals. Hub opening/stock/tied winner details are documented table variants. |
| Chess | Server chess.js legality and clocks; recovery/disconnect pauses clocks. Win +1, loss −1, draw 0. Preserve PGN, resign/draw/rotation semantics. |
| Blackjack | Six decks, dealer stands soft 17; blackjack 3:2, normal win 1:1, one split/double, split aces one extra card, no insurance/surrender. Even chip amounts preserve integer payouts. |

## 5. Patch and authoring workflow

Use Node 22+ and the root lockfile. Install dependencies only if missing/changed (`npm ci --ignore-scripts` for cloud dev); never regenerate lockfiles casually. Existing scripts include build:cloudflare, dev:cloudflare, deploy:cloudflare and test:ui. **Do not run test:ui unless asked.**

For behavior changes, bump package/lock version and server build ID together; update any changed native client protocol/version gates. A docs-only change needs no runtime bump. Review Node and cloud compatibility for shared changes: direct fs/listen/process/timer assumptions may need an adapter, not another rules implementation.

```sh
npm run build:cloudflare
npx wrangler deploy --dry-run --outdir /path/to/private/dry-run
npx wrangler dev --local --ip 127.0.0.1 --port 3024 --persist-to /path/to/private/cloud-preview
```

Paths above are placeholders: choose private locations and check the port first. No remote preview/tunnel by default. The build recreates only generated dist/cloudflare, checks local asset references and copies the public allowlist. Do not store handwritten files there. Stop your own preview after use; do not stop another host.

Inspect changed-file diff, JavaScript syntax, whitespace and representative UI when relevant. Distinguish fixture/empty-entry inspection from real multiplayer gameplay. If the user asks for verification, scope tests to affected rules, privacy, accounting, reconnect/recovery and mobile/Light/Dark UI, and state exactly what passed.

## 6. Release to Cloudflare

Detailed account/setup steps: [CLOUDFLARE-WORKERS.md](CLOUDFLARE-WORKERS.md).

1. Finish and identify a candidate. Review all included uncommitted changes; prevent accidental publication of unrelated source. Record a private file/hash manifest and base. Confirm no generated public asset contains tokens, snapshots, server-only paths or credentials.
2. Compare actual public health/build and local candidate. Explain disconnect/pause/reconnect impact. Get approval for this exact target/version when needed. Existing approval for another build is not permission.
3. Verify the human-approved Cloudflare account with Wrangler and Free plan in dashboard. The owner explicitly approved the account used for the first deployment; this is separate from the strictly personal Git account. Do not silently switch accounts, copy account IDs into Git, upgrade plans or add payment details. If login is unavailable, use browser OAuth; never request password/OTP/token in chat.
4. Keep `srac-gaming`, `GAMING_HUB`/`GamingHub`, `office-hub-v1` and SQLite migration history stable. Review any schema/codec changes and backward compatibility first. Do not delete storage or create a new actor to bypass a restore failure.
5. Publish only after current approval with `npm run deploy:cloudflare`. Build/dry-run are not publication; Git push is not required. Do not copy staging to legacy live or start cloudflared as a side effect.
6. Confirm actual deployment output, public HTTPS `/health` candidate build/all games, landing/entries/assets and same-origin WSS without creating rooms. Do not disturb active matches for a check. Fresh workers.dev TLS can need propagation; wait/recheck, never bypass TLS.
7. Record deployment ID/time, source manifest, approved account privately, public checks and unverified areas. Only now update Running. A failed attempt remains pending.

No zero-interruption promise: deploy/eviction can close sockets, clients reconnect and unfinished rooms require host resume. A successful release keeps the same cloud room store when identity/schema are preserved; it does not erase the need for compatibility review.

### Data recovery and incidents

- Read-only diagnosis first: compare health/build, browser connection/error, known provider outage/quota and private deployment logs. A static page loading does not prove a working game socket.
- Keep logs and snapshots private. Never add reset/import/debug download endpoints or publish real tokens in a report.
- Cloud snapshots are private SQLite graph/chunk transactions (128 KiB chunks); Node uses V8 files under DATA_DIR/rooms and preserves legacy poker/. Formats are not interchangeable.
- On cloud write failure, checkpoint-before-output closes/disposes the adapter and later restores the last durable state. Investigate the error/capacity before any data change. Do not fake a successful action or reset the database.
- Export/restore, retention changes, migration and rollback require a concrete reviewed plan and authorization. Protect closedCodes and accounting; old backups must not resurrect dissolved rooms or duplicate payouts. Old source may not understand newer saves.
- Do not treat Workers deployment history as a database backup. Do not claim a cloud backup exists unless actually exported and verified privately.
- Reverting code is another deployment requiring approval. Assess storage compatibility first; keep current source/data intact while preparing a recovery candidate.
- Detailed evidence, manifests, approvals and tool configuration are in the original operator's private workspace, outside Git. Ask the owner for that record if necessary; do not search/dump credential files. A fresh contributor authenticates their own approved account rather than receiving an exported OAuth file.

## 7. Git publication

Canonical remote: `https://github.com/izanagiwarrior/srac-gaming.git`. Owner staging uses this HTTPS transport with a repo-local exception to a global HTTPS-to-SSH rewrite, allowing Desktop personal authentication. Do not change office/global SSH configuration to push this repo. Develop/publish from staging only; owner GitHub Desktop should open staging. Preserve the working personal transport and identity; do not change author/email without telling the owner. An allowed Cloudflare account is not permission to use office Git identity.

A fresh clone gets only published source. The 2.0.0 source release includes the deployed behavior and this guide; confirm the remote branch actually contains that release before claiming publication. Never use `git pull` in legacy live to deploy, or reset/clean/checkout to hide local edits. Review status/branch/remote, intended diff, new files and ignore rules; stage only reviewed source/docs, no secrets/runtime. Commit/push only when requested, push normally without force, and confirm remote branch contains the intended commit before reporting success. Remote divergence needs inspection, not overwriting.

## 8. Historical evidence and future verification limits

The original2.0.0cloud checks on23October (historical): 89 source files matched the release manifest; 45 JS syntax checks, whitespace review, build/dry-run passed; 52 public assets, bundle 272.07 KiB / gzip 76.29 KiB. Local empty-entry preview was stopped. Production root and all six entries returned HTTP 200; health matched build; all six empty WSS connections succeeded; directory was empty; Blackjack entry showed connected with no browser console errors. No room was created/joined/started for cloud checks.

**Not yet verified in production cloud:** full matches and winning settlements, reconnect/cold recovery with actual rooms, timer/action races, storage failure/cap behavior, joker performance, real-group usage and Free quota consumption. Subsequent local validation covers native winning settlements, fan/payments, Pao and flower/joker fixtures; see the validation report. It does not prove production durability or races. Earlier UI regression results concern older releases and do not prove these paths. A separate Node Mahjong bot demonstration completed one drawn hand with eight flowers and claims; it was not a cloud payout test. An all-bot spectator result can wait for an absent host to advance; confirm desired behavior before changing that edge.

Initial 2.0.0 publication and the later 2.0.1 release were separately authorized and completed on 23 October; follow-up test/docs publication and redeploy were then explicitly authorized. That authorization applies to this release only. Verify actual Git/cloud operation results in the final operator record; the instruction itself is not proof of success. Suggested future work (needs scope/authorization): the verification gaps above, operational quota observation and a private cloud backup/restore procedure. These are not promised completed features or permission to run tests.

## 9. Finish every work session

Update this guide when architecture/current baseline changes; keep exact operator details private. Use a short handoff containing: request and authorization scope; source base and changed files; candidate version; actual running target/version; performed checks and untested paths; runtime/data changes; pending work; whether Git push/cloud deploy occurred; preview cleanup and any still-running authorized service.

Required user report:

| Status | Version | Contents |
| --- | --- | --- |
| Running version | Last confirmed cloud version/build (or current verified result) | Installed features and checks, not assumptions from local source |
| Pending to deploy version | Candidate/build, or None | Only not-yet-installed runtime changes; list pending Git/docs publication separately |

Never change Running merely because editing/building finished. After authorized deployment update this guide and private evidence; after authorized push record the real commit, rather than continuing to quote the old baseline.


## Installed release — Mahjong controls, 23 October 2026

Cloud **2.0.1 / `2026-10-23-mahjong-csp-controls-1`**, source commit `70236ca`, was installed on 23 October (deployment `e8a7e495-c7ca-409b-adfe-60371666cff8`). It replaces Mahjong inline HTML event handlers with explicit external-script delegates and declarative action data. Strict Workers script CSP remains unchanged. Includes tutorial next/back/skip/done/quiz, entry/lobby settings, round/result controls, tiles/claims and drag/drop bindings. Protocol v10, storage, rules and scoring unchanged. Isolated preview reached all ten tutorial pages and exercised back/skip/reopen/done without console errors. Production tutorial Next advanced from page 1 to 2; public health, root/six entries and six empty WSS connections passed. Actual in-match browser controls were not exercised by those checks. Other games retain legacy inline markup and need a separately scoped CSP compatibility review; do not infer all-game UI works from HTTP/WSS checks. No runtime candidate remains pending.


## Scoring validation — 23 October 2026

The user requested HKMA validation after the 2.0.1 cloud release. [Validation report](MAHJONG-SCORING-VALIDATION.md) records 106 passing local tests (95 HK scoring/server + 11 existing session/UI), official reference mapping, test-fixture corrections and remaining limits. No runtime/scoring change, push or deployment was performed for this validation. The owner subsequently authorized this validation/test/documentation release with “pastiin … agent.md … push … deploy”. The runtime remains 2.0.1; verify actual Git/deploy results in the final operator record, rather than treating this authorization as proof of success.


## Historical casual winning candidate 2.1.0

See [Mahjong rules](../games/mahjong/README.md): new rooms default Santai, no minimum fan; optional HKMA retains 3 fan. Flowers/animation stay available. Casual extends payout below 3 fan with 4/8/16 discard points for 0/1/2 fan (local variation); Zimo each opponent pays half. Existing saves missing winMode restore HKMA. Lobby lock/server eligibility/scoring use the same selected mode. Protocol v11. User explicitly confirmed deploy now on23October; push is separate and not authorized for this patch. Source/syntax/build and private lobby authoring review only; no new automated/gameplay tests.


### Historical installed casual release

User confirmation “Tetap deploy sekarang” authorized2.1.0. Deployment/public health and Mahjong asset hashes matched2026-10-23-mahjong-casual-win-1; fresh public entry loaded without console errors and without joining/creating a production room. Private lobby3024 confirmed defaultSantai and HKMA↔Santai changes. Preview stopped. No automated/gameplay tests run; earlier106-test evidence remains2.0.1. Current2.1.0 source remains uncommitted/unpushed on basecbdd547; publication requires separate approval. Older baseline tables above describe2.0.1 history; current cloud is2.1.0.

## Release-history note

Earlier2.0/2.1 sections below are dated historical evidence; current defaults/status are in the opening3.5.0section and root AGENTS. The current0fan=0policy applies to newly configured presets, not stored old casual balances.

Admin extension evidence: one synthetic account possession edit and one unstarted Blackjack initial-funding correction+native broadcast/audit inspected;319px editor has no document horizontal overflow. No six-game gameplay/security/race tests. Preview source and store are isolated from production; At that authoring checkpoint Google setup, release approval and focused verification were pending; later3.1–3.5release sections and PROJECT-STATUS.md record their completion. See ADMIN-CONTROLS.md.

## Current completion audit

See [completion audit](PROJECT-STATUS.md) for the reconciled chat requirements, superseded requests and actual completion boundaries. User approved this documentation cleanup/publication; no runtime change or deployment is required. Older candidate/pending statements are preparation history, not current queued work.
