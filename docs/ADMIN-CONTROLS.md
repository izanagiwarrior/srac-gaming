# Admin controls — included in current release3.5.0

Cloud release `2026-10-31-admin-controls-1` is deployed with Google credentials and verified owner admin sign-in. It includes the preceding3.0account work. [128passing tests and limits](ACCOUNT-VALIDATION.md) cover focused auth/admin/reward and six-game balance fixtures; full gameplay/recovery is not exhaustively proven. Preparation evidence below is historical. Read [account setup](ACCOUNTS.md), AGENTS and the maintenance guide before publishing.

## What admins can change

User explicitly requested administrators can add/remove/set everything a player owns, and confirmed that this includes chip/point balances in all six games.

**Pemain → Kelola pemain**:
- Set display name.
- Add, subtract or set lifetime XP and cosmetic coins; level follows XP automatically. Administrative grants bypass the daily gameplay-reward cap. Integer balances0–1,000,000,000; no cash value.
- Grant/revoke catalog skins and accessories, grant all, return inventory to the starter, change equipped skin/accessory. Maintain the product invariant of one active owned skin; removing all skins is rejected. Equipment must belong to the resulting inventory.
- Before confirmation show XP/coin totals and inventory count changes. A reason10–240characters is mandatory. Server authorization requires a current verified admin role and login within30minutes.

Admin grants do not change password, Google verification or provider identity. Identity credentials are not possessions. Existing dedicated role management remains in Kelola admin. Do not add a client-only admin switch or allow a claimed email to bypass authentication.

## Saldo meja — all six games

Separate account cosmetic currency from game chip/point accounting. The admin page reads all saved rooms, including locked/offline rooms, through authorized binding-only APIs. It does not expose hands, deck/wall or seat tokens.

- **Poker / Blackjack, modal mode:** add/subtract/set stack and adjust recorded bought chips by the same delta. Thus total stack value changes but gameplay net stays unchanged. Withdrawal cannot make stack or bought chips negative. Pre-game personalized funding survives Start: each factory skips the ordinary initial buy-in for a player whose initial funding was explicitly administered. Poker validates at least two funded participants including practice bots before starting.
- **Transfer mode:** for Poker/Blackjack, transfer stack from/to another room participant; for Blackjack the dealer can be the opposite side. For Capsa/Mahjong/Catur/Domino, set/add/subtract a player's points with an explicit opposite participant whose point change is the negative delta. Opposite balances are validated too. This keeps zero-sum settlement math intact instead of inventing an unbalanced win.
- Chip changes are allowed in the lobby and after a completed hand/round. Point corrections apply after a completed round/match. Active betting, dealing, playing, claims, opening and paused unfinished rounds are rejected, including old forms submitted after the next hand starts. No forced mid-pot edits.
- Rupiah is derived from the room's existing rate × chip/points, not an independent editable field. Practice rate0 remains Rp0 even if admin gives many chips.
- Correction preserves native result/winner history. It creates its own `adminAdjustments` journal, game ledger where supported, and audit entries. No XP or win is granted by a balance correction.

The player-facing shared toolbar exposes a correction disclosure: admin display name, reason, timestamp and before/after balances. Capsa's existing history remains actual rounds; its CSV includes explicitly labelled up-to20recent manual corrections. Other point-game ledgers distinguish corrections by label. Poker buy-in/correction rows name the operation; they are not disguised as a hand win. Existing ledger retention still applies.

## Atomicity, stale forms and retry behavior

Account users have an additive SQL revision column. All possession changes (normal profile/equip/purchase/reward and admin edits) increment it. Admin submits the last viewed revision; stale forms get409 instead of overwriting an intervening purchase/reward. A full user edit, inventory changes, actor/recipient audit and idempotency receipt are one SQLite transaction. The same actor/request ID/body replay returns its existing result. Reusing an ID for a different request is rejected.

`admin_operations` stores private account mutation receipts. Never clear it merely to hide activity. Account audit stores before/after possessions, actor, recipient, reason and time. User activity receives a corresponding correction entry.

Game forms carry room UUID, an opaque balance/state fingerprint and request ID. Native state plus a monotonic admin revision prevents stale edits. Each game snapshot persists the correction journal and bounded replay receipts (latest200). A request older than retained receipts remains stale because its revision cannot match. On save failure, mutated balances/journals/ledger are restored before returning failure. The synchronous native checkpoint is authoritative; broadcast occurs only after successful persistence. Poker's explicit export includes all admin metadata.

Room correction audit delivery uses the existing durable outbox to AccountStore. It can arrive after game state; receipt application is idempotent. Public clients cannot dispatch `/internal/*`, provide their own authorized actor, or grant themselves an admin role. Public Worker dispatch checks the session/admin role/recent login and CSRF origin, then forwards the server-derived actor to GamingHub. Existing game actor/namespace/migrations stay unchanged.

## Code map

- `cloudflare/accounts/admin.js`: account possession validation, transaction, audit/receipts.
- `cloudflare/accounts/game-admin.js`: read-only public balance snapshots and invariant-preserving corrections.
- `cloudflare/accounts/store.js`: account revision migration, authenticated admin endpoints and correction audits.
- `cloudflare/worker.js`: explicitly authorized balance proxy and native checkpoint/broadcast.
- `public/account-app.js/css`: users editor, inventory controls, balance editor and audit details.
- `public/account-bridge.js/css`: visible public correction notices.
- Native Poker/Blackjack: respect per-player administered initial funding; Blackjack entry reads displayed account-prefilled name before validation.

## Historical authoring evidence and limits

The following describes the pre-release preview, not pending setup. Google/admin deployment and Git publication were later completed; current validation and completion status are in CONNECTION-VALIDATION.md and PROJECT-STATUS.md.

Manual isolated localhost3026 authoring only: changed the synthetic demo admin's640→2000XP and180→10000coins, granted4items, equipped Ivory Wanderer+Golden Hour; DB reply/UI showed level5 and resulting balances. Admin audit shows actor and recipient correction entries. Created one empty Blackjack lobby without Start; funded0→50000stack and0→50000bought, saw the updated number and correction disclosure on the game client, and saw corresponding audit entries. No actual game, bet, result or payout occurred.

JavaScript syntax, whitespace, cloud build and dry-run checked. No automated/gameplay tests were requested/run. Point-transfer paths in the other five games, negative RBAC/CSRF cases, stale/replayed failure injection, numeric boundary exhaustion, Google login and complete hand/start/recovery/settlement flows are not proven by this preview. Do not claim bug-free or production-ready security. The later finish-all instruction authorized targeted tests; [release validation](ACCOUNT-VALIDATION.md) now records additional account/negative-path/reward/six-game fixture coverage. Full native game settlements and recovery races remain outside that evidence.

Only staging source and local preview data were changed. No public deployment, Git publication, production secret/account/plan change, legacy Node host or player-save migration. Publishing needs a fresh explicit instruction for this candidate and configured Google login, with mandatory-account/disconnect impact explained.

Final layout inspection: account editor at319px reported document scrollWidth319 after wrapping the header; Dark view and possession controls were visually inspected. Broader Light/mobile game-balance/editor variants were not rechecked in this extension. The empty Blackjack preview tab was closed without Start; its private lobby record remains only in the emulator store for review. Production and Git stay unchanged.
