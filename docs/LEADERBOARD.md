# Leaderboard — local candidate3.11.0

## Product meaning

Global and per-game boards default to **Uang**, then optionally Level or Poin. Money is signed cumulative net IDR from completed settlements, not spendable cash, buy-in value or cosmetic coins. Points are native game units (Poker/Blackjack chips). Practice rate0gives0IDR but records points/rounds. Rules/rates/units differ and human matches against bots/custom rules count; this is a social board, not comparable competitive Elo or verified earnings. Admin recap/stack corrections and buy-ins are not settlement outcomes and do not themselves increase rank. Players' actual equipped avatar and display name are shown; no email, account ID, role, room, hand or session information in the API.

Global level follows existing lifetime accountXP formula `floor(sqrt(XP/100))+1`; game level applies that formula to XP earned from that game. Cosmetic purchases do not lower level. Existing global admin XP edits affect global level, not attributed gameXP. Completed short rounds count ranking stats but keep the existing minimum60seconds for XP, daily1000cap and coin awards. Bots/spectators do not get stats; Poker only dealt-in players, Blackjack players with hands.

Top50ordered descending by selected money/points/XP, then wins, rounds and stable private ID for deterministic row order. Equal primary value shares competition rank. Own summary is returned even outside top50; its exact outside rank is not computed. Money/point wins may be negative, zero or positive; wins use each game's existing reward outcome. Draws count a round without a win. No fabricated historic income.

## SQL architecture and delivery

Same `ACCOUNTS`/AccountStore/`accounts-v1` SQLite actor, no new binding/namespace/Cloudflare migration ID. Constructor adds:

- `game_stats`: PK(user_id,game), rounds,wins,xp,points,money,measured,updated. A per-game row plus `all` row per participant. Indexed money/points/XP orders; users XP index for global level.
- `game_result_receipts`: permanent idempotence receipt for event/account with native points/money, XP and outcome. Keep receipts; deleting them permits replay. This is not a full accounting bank ledger.
- Metadata `leaderboard-v1`: one-time backfill/start timestamp. Existing rewards grouped by user/game and all add eligible historical rounds/wins/XP, with money/points0and measured0. Past per-account monetary results were never stored, so cannot reconstruct them safely. Existing reward receipt prevents old outbox redelivery counting backfilled rounds twice. Old pending reward events can add XP/outcomes with unknown money/points.

Shared `recordResult` freezes `scoreVersion:1`, per-seat points and points×rate into the existing private checkpoint/outbox event. Capsa/Mahjong/Poker/Blackjack pass explicit native deltas. Chess/Domino/UNO/Ludo/Monopoli/Reversi use the just-recorded native round ledger. AccountStore applies receipt, two stat upserts, XP/coins/audit in one SQLite transaction. Outbox retransmission is safe by immutable event/account IDs; transport is asynchronous, so boards can lag a completed table result. In-progress/abandoned rounds do not count. No browser score-writing endpoint. Admin corrections remain separately audited.

Inputs are bounded safe integer per-round units/IDR≤10^15; unavailable/unsafe metrics record null receipts and measured0, not guessed values. Cumulative units/IDR saturate at±9×10^15to retain safe JSON numbers; attributed XP≤10^9. No deletion/reset of existing rooms/account records. This patch adds schema in local preview only; production changes require release approval.

## Read/UI behavior and quota

Authenticated `GET /api/account/leaderboard?game=all|<slug>&sort=money|level|points`. Existing session/revocation guards; exact game/sort allowlists. Returns up to50entries, own summary, generation/start timestamps and metric meaning. Common top50data cached in actor memory30seconds, own summary by PK; browser caches30seconds. No count-all rank query, no polling or websocket leaderboard broadcast. Manual refresh may still receive the server's≤30second snapshot. Names/avatars/levels can be stale until cache expires; successful new results invalidate the cache. Historical backfill is a one-time aggregate and may take longer with large reward history; do not run it repeatedly by removing the metadata flag.

Standalone `/leaderboard/`, hub panel/link, and the same collapsed pre-game control in all10games. Game panels fetch only when opened, hide/close once a shared active state is received, and abort their read when closed. Filters/game links preserve same-origin login return. Native legacy Node has no account DB and shows an availability message; this feature targets Workers/emulator.

## Preview/release boundaries

Local3028uses isolated SQLite. Cloud stays3.8.1; previous3.10.1/3.10.0game/art work included, not separately pending. No canonical install/commit/push/deploy. Before release reconcile reviewed candidate to canonical staging and preserve newer edits/runtime. No public room actions or quota/billing changes.

Source syntax/asset build checked; anonymous401then authenticated empty leaderboard, level filter and Mahjong collapsed/open pre-game UI reviewed with a disposable local profile. Constructor schema/empty queries exercised. No populated leaderboard fixture, historical backfill fixture, scoring/idempotence/settlement/failure-injection/gameplay/mobile or automated tests were requested/run. Do not present those paths as verified. Earlier ten-game gameplay gaps remain.
