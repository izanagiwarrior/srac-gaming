# Dam, Ular Tangga and Empat Berturut — local candidate

Three new party games, taking the lineup from ten to thirteen. They use `games/shared/party-server.js`, one authoritative engine each (`games/<slug>/engine.js`), and the shared `public/party-client.js` / `public/strategy-ui.js` / `public/party.css`. Landing order stays alphabetical after Mahjong: Blackjack, Capsa, Catur, **Dam**, Domino, **Empat Berturut**, Ludo, Monopoli, Poker, Reversi, **Ular Tangga**, UNO (4 rows × 3 on desktop). Registrations cover Node, Workers, leaderboard, account return routing, admin naming, room tools, directory and asset build. No new dependency, image asset, SQLite actor or migration; storage is the same room checkpoint used by the other party games.

Slugs: `dam`, `tangga`, `empat`. Creator credit: Faiz T. Card art reuses existing cast portraits (Ember Tiger, River Otter, Snow Owl).

## Dam (Checkers) — 2 players

8×8 on dark squares, 12 pieces each. **Merah** starts at the bottom and moves first; **Putih** at the top. The board is flipped for Putih so each player sees their own pieces at the bottom. Quick Play is a 6×6 board with 6 pieces each (house variation).

- Men step one square diagonally forward; they capture forward only.
- **Capture is mandatory.** If any jump exists the player must jump, and must keep jumping with the same piece while a further jump exists (`chain` locks that piece; each jump is one action).
- Reaching the far row crowns a **Raja** (♛). Crowning ends the turn, even if another jump would be available.
- Kings move and capture one square in any diagonal direction (no flying kings — the house profile, not International draughts).
- Win: opponent has no pieces or no legal move. Draw: 80 consecutive plies (40 moves each) with no capture and no man move.
- Table points: winner +10, loser −10, draw 0.
- Bots: Easy random legal move; Normal negamax depth 2; Hard depth 4 with a 1500-node cap. Material + advancement + edge evaluation. Multi-jumps are searched as the same side moving again.

## Ular Tangga — 2–4 players

10×10 (100 squares), Quick Play 6×6 (36). Roll a die and advance; pieces start off-board. Ladders climb, snakes descend; jumps never chain (verified by test). The exact last square is required — an overshoot leaves the piece where it is. A six grants an extra roll; the third consecutive six is void and ends the turn. Several pieces may share a square; there are no captures.

Standard ladders `4→14, 9→31, 20→38, 28→84, 40→59, 51→67, 63→81, 71→91`; snakes `17→7, 54→34, 62→19, 64→60, 87→24, 93→73, 95→75, 99→78`. Quick ladders `3→13, 8→22, 15→27`; snakes `17→6, 24→11, 33→19, 35→21`.

Dice use `crypto.randomInt` on the server. The only action is `roll`; the move, ladder/snake and win are resolved in one authoritative step. Table points follow Ludo: winner receives 10 from every opponent. Bots always roll (levels do not differ — there is no decision to make).

## Empat Berturut (Connect Four) — 2 players

7×6, Quick Play 6×5. Players alternate dropping a disc into a column (`place` with the column index); it falls to the lowest empty row. Four in a row horizontally, vertically or diagonally wins and the winning line is highlighted; a full board is a draw. Points: +10/−10, draw 0. Bots: Easy plays an immediate win half the time otherwise random; Normal always wins in one or blocks in one, otherwise depth-3 alpha-beta; Hard depth 6 with a 20000-node cap. Window-count heuristic with a centre preference.

## Shared behavior and boundaries

Lobby, bots filling empty seats, spectators, chat/emotes, rules cheat sheet, recap/log, theme, invites, host dissolve, the 15-second disconnect grace, delayed bots (3 s), authenticated one-room-per-account handoff and cold SQLite recovery all come from the shared party server and room service unchanged. Table settings: point value, bot level and play mode (`standard` / `quick`) via the existing validation.

Client: `data-cell` carries the board index (Dam), the column (Empat) or is unused (Tangga — dice only). Dam selection is a local UI aid (select a piece, then a highlighted target) that resets on each new server revision; the server validates every move. All boards size by CSS classes only (no inline style), so they work under the Node server's strict CSP. Reduced motion disables the move/drop/hop animations.

## Evidence and limits

`tests/new-games-engine.test.js` covers rules, bots and random self-play for the three engines. The existing lifecycle (`november-lifecycle`), cold-recovery (`november-cold-new4`) and availability tests now include the new slugs: a full authenticated Quick Play round through the real Worker/SQLite adapters with spectator privacy, lock/queue/yield, once-only standing, leaderboard rows and room rotation; paused cold recovery and closed-code tombstones. See the final test count in [PROJECT-STATUS](PROJECT-STATUS.md).

Not verified: human play-testing of rules against another implementation, long-running performance of Hard bots on slow devices, assistive technology, and real phones (layout was checked in the browser at 320 px). Local candidate only — not committed to `main`, pushed, installed or deployed. Cloud remains 3.16.1 until a new release instruction.
