# Maintenance and agent handoff

Last reconciled: **23 October 2026**. Read root [AGENTS.md](../AGENTS.md) first. This document records context and procedures; it does not authorize push, deployment, interruption, gameplay tests or data migration. Dates below are historical evidence. Recheck actual source and service before acting.

## 1. Current handoff

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

## 8. Evidence and outstanding work

Last cloud release checks on 23 October: 89 source files matched the release manifest; 45 JS syntax checks, whitespace review, build/dry-run passed; 52 public assets, bundle 272.07 KiB / gzip 76.29 KiB. Local empty-entry preview was stopped. Production root and all six entries returned HTTP 200; health matched build; all six empty WSS connections succeeded; directory was empty; Blackjack entry showed connected with no browser console errors. No room was created/joined/started for cloud checks.

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


## Casual winning candidate 2.1.0

See [Mahjong rules](../games/mahjong/README.md): new rooms default Santai, no minimum fan; optional HKMA retains 3 fan. Flowers/animation stay available. Casual extends payout below 3 fan with 4/8/16 discard points for 0/1/2 fan (local variation); Zimo each opponent pays half. Existing saves missing winMode restore HKMA. Lobby lock/server eligibility/scoring use the same selected mode. Protocol v11. User explicitly confirmed deploy now on23October; push is separate and not authorized for this patch. Source/syntax/build and private lobby authoring review only; no new automated/gameplay tests.


### Installed casual release

User confirmation “Tetap deploy sekarang” authorized2.1.0. Deployment/public health and Mahjong asset hashes matched2026-10-23-mahjong-casual-win-1; fresh public entry loaded without console errors and without joining/creating a production room. Private lobby3024 confirmed defaultSantai and HKMA↔Santai changes. Preview stopped. No automated/gameplay tests run; earlier106-test evidence remains2.0.1. Current2.1.0 source remains uncommitted/unpushed on basecbdd547; publication requires separate approval. Older baseline tables above describe2.0.1 history; current cloud is2.1.0.

## Release-history note

Earlier2.0/2.1 sections below are dated historical evidence; current defaults/status are in section1 and root AGENTS. The current0fan=0policy applies to newly configured presets, not stored old casual balances.
