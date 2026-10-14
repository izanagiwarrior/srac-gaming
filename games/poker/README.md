> Game terintegrasi di Meja Kita. Jalankan aplikasi dari root repository dengan `npm start`; lihat README utama. Instruksi standalone di bawah adalah dokumentasi source asal.

# Poker P2P — your home table

A local, English-language Texas Hold’em game for 2–8 players. It follows the room-code and green-felt style of the Mahjong P2P game: one computer runs the server, and friends use their phone or laptop browsers on the same WiFi.

## Start playing

You need Node.js 18 or newer on the host computer only. The portable ZIP includes the small JavaScript networking dependency, so no download is needed if Node is already installed.

- **Mac:** double-click `start.command` in Finder.
- **Windows:** double-click `start.bat`.
- **Linux:** run `./start.sh`.
- **Terminal:** open this folder and run `npm start`. If `node_modules` is missing, run `npm install` first.

Open **http://localhost:3001** on the host computer. Keep the server window open while playing. The server prints the network address friends should open, for example `http://192.168.1.10:3001`. The waiting room also has a **Copy invite link** button.

1. Enter your name and create a room.
2. In **Table settings**, set chip value in IDR, buy-in size, blinds, seats, and whether rebuys are allowed. Settings save automatically; starting also submits the values currently shown.
3. Friends open the network address and enter the four-letter code, or use the invite link.
4. When everyone has joined, the host starts the game. One initial buy-in is recorded for each player.
5. After each hand, review the result. Only the host can deal the next hand.

In this hub, open /poker/ on the shared port 3000. Standalone instructions above describe the original source. To use another port, run `PORT=4001 npm start` on Mac/Linux, or `$env:PORT=4001; npm start` in Windows PowerShell.

## What is included

- Create/join rooms, waiting room, invitation links, and fixed seats for the session.
- Standard no-limit Texas Hold’em with heads-up rules, rotating dealer, blinds, burns, legal raises, all-ins, main/side pots, split pots, odd chips, and returned uncalled bets.
- Two private cards visible only to their owner until a non-folded showdown. Folded cards stay private.
- Six-page beginner guide; illustrated ten-hand cheat sheet; explanations of each betting action; the best available five-card hand highlighted in gold.
- No decision timer while a human player is connected. Offline players check if possible or fold after 15 seconds; the app never automatically calls for them.
- Optional practice bots using only their own cards and public information. Easy/Normal/Hard bots retain the chosen chip value for simulated IDR results; rooms with bots do not create payment instructions. They automatically replenish their practice stack when busted.
- Responsive phone and desktop layouts, light/dark theme, and keyboard-accessible dialogs and controls.
- Live chip/IDR recap, approved buy-in ledger, recent hand results, CSV export, and final settlement.
- Saved rooms and automatic recovery after a browser reload or server restart.

## Chips, buy-ins, and rebuys

Chip value, starting stack, and blinds lock when the session begins. All amounts are whole chips and whole rupiah. The app records amounts; it does not process payments.

Example: **1 chip = Rp100**, buy-in **1,000 chips = Rp100,000**. A player who buys in twice has **2,000 purchased chips / Rp200,000 recorded buy-ins**. If they finish with 2,300 chips, their stack is worth Rp230,000 and their net result is +Rp30,000.

A player with no chips can request a rebuy **between hands**, or choose **No thanks, sit out**. The host approves or declines each request, including their own. A pending request has no cost and adds no chips. Approved rebuys add exactly one configured buy-in to both the stack and ledger. No top-ups are allowed during a hand or while a player still has chips.

The live recap shows stack chips, committed chips, total buy-ins, IDR values, and provisional net amounts. During a hand, committed chips are still shown at their original value until the pot is settled.

## Minimum play and ending the session

A cycle means a complete dealer rotation. Each remaining funded player must have completed **three hands as dealer** before the host can end normally. On a stable four-player table, that is 12 completed hands; on a six-player table, 18. Progress is visible in the recap and End session dialog.

- Only the host can end; they must explicitly select **Confirm & end session**.
- A hand must finish first, and all pending rebuys must be resolved.
- Busted players who decline a rebuy are exempt from the remaining rotations. Rebuying puts the player back under the normal requirement, retaining their previous progress.
- **Approved early-finish exception:** when only one player has chips and every other player has declined a rebuy, the host may confirm the end immediately.
- A disconnected player who still has chips remains part of the minimum-play requirement. They need to reconnect to complete their dealer turns.

Ending freezes the ledger and creates the final recap. The session cannot be resumed for additional hands; create a new room for a new game.

## Final settlement — who pays whom

**Net result = (remaining chips − all purchased chips) × IDR per chip.**

The final screen generates transfers from players with a negative net result to those with a positive result. These settle the recorded game **if buy-ins were a running tally and nobody has paid yet**.

If all buy-ins were already paid into a shared bank, use the final **Stack value** column as the bank payout for each player instead. The interface explains both methods. **Do not use both methods**, which would double-count the result.

Practice tables have no payments. The CSV includes balances, every approved buy-in, and the final transfer instructions when applicable. Transfers are suggestions for the players to settle themselves; there is no payment integration.

## Reconnecting and local saves

Reloading the page restores your seat. If you closed the tab, open the same host address in the same browser and select **Return to saved room**. The browser stores a private seat token. Opening that seat in another tab replaces the older connection.

If the host disconnects, another connected human becomes host after about 15 seconds; a reconnecting player can take over a room whose host is offline. Only the current host can deal, approve rebuys, or end.

The server saves room state, cards, seat tokens, and the ledger in `data/sessions.json`, with an atomic replacement after changes. Restart from the same folder to recover rooms. The server computer is trusted and can access this private data. It is not served over HTTP. Do not distribute `data/` when sharing the app; the supplied ZIP contains no session data.

Use the same network address when returning. `localhost`, `127.0.0.1`, and a LAN IP have separate browser storage, and a changed host IP may prevent the browser from finding its saved seat token. Clearing browser storage also removes that recovery token.

## If a friend cannot connect

- Confirm everyone is on the same WiFi and the server computer is awake.
- Use the host’s network IP address, not `localhost`, on friends’ devices.
- Allow Node.js to accept local network connections in the host firewall.
- Guest networks and some office/campus networks block device-to-device traffic.
- If several addresses appear in the waiting room, select the address for the shared WiFi network.
- If port 3001 is busy, use another port and share that new address.

This app is designed for a trusted local network. It is a host-authoritative LAN game, not direct browser-to-browser networking or a public internet service. The host computer holds the deck and session data.

## Project files and verification

- `server.js`: HTTP/WebSocket server, rooms, authority checks, persistence, accounting, settlement.
- `engine.js`: game state machine, secure shuffle interface, five/seven-card hand evaluator, pot distribution.
- `public/`: interface, styling, guides, and browser client.
- `test/`: rules and real WebSocket multiplayer tests. Run `npm test`.

The tests cover rankings, kickers, ace-low straights, side pots, short/cumulative all-ins, heads-up action, odd chips, uncalled refunds, random-game chip conservation, private-card filtering, host controls, three-cycle locks, end confirmation, early finish, rebuy accounting, reconnect/persistence, and offline behavior.

Rules references: [PokerStars Hold’em rules](https://www.pokerstars.com/poker/games/texas-holdem/), [PokerStars betting and pot explanations](https://www.pokerstars.com/help/articles/poker-rules-master/229168/), and [Poker TDA raise/reopening rules](https://www.pokertda.com/view-poker-tda-rules/). The three-cycle minimum, fixed buy-in rebuys, and early-finish policy are house rules for this app.

## Hub patch 2026-10-14-six-games-1

Creator: **Hendy W**, shown on the landing card and inside the game. Right sidebar: chat, visual hand rankings, river category probabilities, net chip/IDR recap with full recap/ledger/history access, and game log. On small screens it stacks below the table. Room chat is saved in the existing private Poker session snapshots.

Bot difficulty is chosen in the lobby and locked when play starts. Easy sometimes makes poor/random choices; Normal uses the previous basic strength policy; Hard also weighs call cost, public pot size and own flush draws. Bots use only their own cards and public board/betting information, waiting at least 3 seconds. These are local heuristics, not a tournament poker engine.

Probabilities describe the best five-card category at the river, including use of the board. Preflop uses 10,000 random board completions. Flop/turn/river enumerate every unknown board completion (1,081 / 46 / 1). Categories are exclusive; royal flush is separated from other straight flushes. Percentages are rounded; preflop nominal sampling uncertainty is at most about ±1 percentage point at 95%. Opponent cards remain unknown, including at showdown; this is a hand-category distribution rather than opponent equity. Calculation happens in a browser Worker.

Settings auto-save before play; Start submits current form values. Bots do not force the IDR rate to zero anymore. All bot balances are simulation; no payment instructions are generated for bot tables. The original detailed recap, ledger, CSV, session save and human-only settlement calculation remain available.
