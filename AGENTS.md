# SRAC-Gaming: instructions for coding agents

## Read first

1. [Maintenance and current handoff](docs/MAINTENANCE.md): deployed baseline, workflow, architecture, known verification gaps and next-agent checklist.
2. [Repository skill](.agents/skills/meja-kita-games/SKILL.md): implementation/release workflow.
3. [Game conventions](docs/GAME-CONVENTIONS.md) and [sessions/storage](docs/SOCIAL-SESSIONS.md).
4. For hosting, [Cloudflare Workers](docs/CLOUDFLARE-WORKERS.md); for game changes, that game's README. [Quick Tunnel](docs/CLOUDFLARE.md) is a separate legacy option.

## Installed alignment patch — 23 October 2026

Cloud **2.3.1 / `2026-10-23-toolbar-alignment-1`** is deployed and checked after explicit user instruction “deploy push”. Personal Git publication of this same source/docs is authorized; verify actual remote commit before reporting push complete. No runtime candidate remains pending. CSS-only presentation correction: landing preferences panel matches header/main inner gutters (40px desktop,22px mobile; content max1200), preferences summary and Dark/Light share a grid row, room shortcuts retain a separate row. Expanded preferences retain full width and reserve space for theme controls. No game rules, protocol, accounting, credentials or storage change. Root package/build IDs reflect the candidate; Mahjong's unchanged game build/protocol remain2.3.0/v12.

Syntax/root server, whitespace and cloud build passed. Isolated loopback authoring: landing desktop brand/panel both left40 at1280px; summary/theme top131 and bottom175. Mobile390px brand/panel left22 with scrollWidth390; Dark/Light, expanded/collapsed preferences reviewed. Empty Blackjack preview room (not Start) confirmed quick-action bottom153.6 below theme/summary top161.6, no overlap; no console errors on inspected pages. Preview was stopped and tabs closed. No gameplay/automated tests or public room actions. Public health/root/six entries200, three changed CSS hashes matched, six empty WSSconnected. Public desktop brand/panel left40 and summary/theme top131, no console errors; browser tab closed. Future publication requires fresh authorization.

## Previous UI baseline2.3.0 — 23 October 2026

Cloud is deployed and checked: **2.3.0 / 2026-10-23-lobby-consistency-1**, Mahjong protocol12, at https://srac-gaming.faiz-triputra.workers.dev/ . User explicitly authorized this release with “push dan deploy”. It includes lobby order, visible invitations and the previously documented session-refresh draft. No runtime candidate remains pending. Git publication of this source/docs is authorized; verify actual remote commit before claiming push complete.

All six games share an always-visible room code / Copy invite / Copy code / Leave-switch bar, outside preferences. Theme controls have their own row to avoid covering actions. Host lock/dissolve, recovery export and device settings remain in the clearly labelled preferences/management section; recovery banner is visible outside the fold. Server host/leave/dissolve authorization and accounting are unchanged.

Lobby order: duration/clock, point or chip value, simple playing/bot options, then expanding rule details. Mahjong keeps its real server presets. Catur/Domino/Blackjack common settings move above the board. Poker/Capsa/Blackjack expose current ready-to-use settings with Customize for detailed controls; no new fake ruleset/preset or automatic reset of existing values. Customize open state is retained per room instance across native rerenders. Follow docs/GAME-CONVENTIONS.md.

Syntax/whitespace/build passed. Isolated Workers preview: six empty lobbies created without Start, invite/code copy feedback, Poker Customize retained after settings acknowledgement, advanced Capsa/Blackjack fields, Mahjong order reviewed; console errors absent. Catur Dark/Light and390px room controls reviewed (document width390, no horizontal overflow). Previous draft auto-rejoin on same room URL and unavailable saved seat handling observed in empty preview rooms; timeout/recovery races, game settlement and full matches were not tested. No new automated tests. Legacy live and cloud data/players unchanged. Preview cleanup and private manifest recorded by operator. Public health/root/six entries200, six empty WSSconnected and12changed assets exactly matched the candidate. No production room was created/joined/started. Future Git/cloud publications require new user authorization.

## Previous installed baseline2.2.0 — 23 October 2026

- Previous cloud baseline was deployed and checked: **2.2.0 / 2026-10-23-mahjong-presets-hu-1 / Mahjong v12** at https://srac-gaming.faiz-triputra.workers.dev/ . Git publication of this same release is explicitly authorized; confirm the remote commit before claiming push complete. No runtime deployment remains pending. Deployment can disconnect clients; old Mahjong pages require refresh.
- Four lobby presets: Easy default (casual 0-fan Hu, completed-set highlight, easy bots); Normal (casual, no highlight, normal bots); Hard (HKMA Hong Kong minimum3fan, no highlight, hard bots); Customize (all existing options). Presets are applied by the server, lock before play, and keep duration/Rp independent. Assisted claims, eight flowers, skippable opening ON and no joker/flower fan bonus are common preset settings. All bots retain at least3second delays.
- This is **Hong Kong**, not Chinese Official/MCR. The referenced playmahjong.io/chinese-official-rules describes MCR minimum8points; no MCR engine was added. HKMA remains the strict scoring reference. Casual payout0/1/2fan=0/8/16 discard points is a labeled house variation;3–10usesHKMA. Hu0fan settles zero points/Rp.
- Existing saves without tablePreset become Customize, without casualZero retain prior0fan=4payout; existing strict/legacy rules and settled balances remain unchanged. Never silently turn an active room into Easy. New clients refresh to v12.
- Hu celebration runs before the result panel only on an observed live winning transition, with skip/reduced motion and cancellation on leave/disconnect/new round. It never changes settlement or replays on initial recovery/history. No full-match/automated tests were requested for this release. Syntax/build passed; isolated empty-lobby preset changes and Hu visual/skip/reduced motion were reviewed. Public health/root/six entries and six empty WSS passed; five changed Mahjong assets matched source hashes. No production room was created/joined/started. Detailed evidence is private; the earlier106testpass concerns2.0.1.
- Staging is the sole development/Git checkout. Sibling live remains legacy offline1.8.0 with private saves, untouched. Workers + SQLite is the default online target without laptop/tunnel. Preserve worker/binding/actor/migrations, room identities and accounting.
- Personal Git: izanagiwarrior/srac-gaming over the existing HTTPS transport; repo-local exception prevents office SSH rewrite. Preserve personal commit identity and never change global keys/config. Cloud account permission is separate.

## Authorization and active players

- Prepare patches in staging or another isolated checkout, never served files. Static edits can reach players without a restart. No symlinks/hardlinks/watchers connecting staging and a served Node live tree.
- Patch, GitHub push, cloud deployment, Node release, start, stop, restart and reload are separate actions. Each publishing/hosting action requires the human's current explicit authorization for that action/version. Earlier approval is not standing permission. A clear current instruction is approval; do not ask for it twice.
- Complete a reviewable candidate first. Before a new deployment approval, explain exact build, included patches, destination and impact: sockets may disconnect and unfinished rooms may pause until reconnect/host resume. Keep active matches running while awaiting an answer.
- Starting an installed build is not permission to install pending patches. Never silently deploy while fixing a bug, preparing documentation, building, or pushing GitHub. Keep automatic Git deployments off.
- Default online target is Workers. Do not start LAN/Node/cloudflared or change DNS, billing, plans, accounts or data as a side effect. Quick Tunnel requires a separately authorized Node origin and laptop.
- Preserve cloud SQLite, actor identity, migration history, closed-code reservations and accounting. Preserve the entire legacy Node DATA_DIR, including rooms/ and poker/. No resets, namespace deletion, old-save upload, destructive sync or rollback over newer data to fix an error.
- After each patch/release report **Status | Version | Contents**, with **Running version** and **Pending to deploy version**. Mark Running only after approved deployment and checks succeed. Distinguish pending Git publication from pending cloud installation.

## Implementation and privacy

- Follow GAME-CONVENTIONS: common sidebar order, responsive Dark/Light UI, creator credits, actual bot levels with at least three-second delays, host money settings and server-owned rules/accounting.
- Keep native factories authoritative for each game. Hints use only viewer-visible information. Do not expose other hands, future deck/wall, seat tokens or snapshots. Label house variants accurately.
- Reuse shared components and room lifecycle; preserve recovery, queue/rotation, dissolve tombstones, resource cleanup and per-viewer messages in Node and Workers.
- Do not add/run automated or gameplay tests unless requested. Source/syntax review, builds, dry-runs and isolated empty-entry authoring previews are allowed. Report actual evidence and untested behavior; never promise bug-free gameplay from a handshake.
- Never commit credentials, player data, tokens, .env, logs, PIDs, runtime, preview stores, generated dist, node_modules or machine-specific private paths. Only whitelisted public assets enter Workers Assets.
- Canonical Git repo: https://github.com/izanagiwarrior/srac-gaming . Owner uses approved personal izanagiwarrior identity, never office Git identity. Cloudflare account selection is separate; verify the account approved by the human. An exception for Cloudflare does not authorize office Git use.
- Inspect branch/status/remote/identity and intended diff before publication. No force push, reset, clean, checkout or overwriting remote/uncommitted work to resolve discrepancies. Install locked dependencies only when needed; avoid unnecessary install scripts.
- Keep detailed approvals, deployment IDs, release manifests, backup paths, selected account and verification evidence in private operator notes/ignored var/. Keep this repo's handoff factual and portable; update it after changes.
