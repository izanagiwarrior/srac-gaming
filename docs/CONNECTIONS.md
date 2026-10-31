# Disconnect grace and temporary automation

Deployed3.5.0 / `2026-10-31-disconnect-grace-1`. Running release is recorded in root AGENTS. Includes avatar options/automatic account handoff/manual file UI cleanup. Public health and asset/auth checks passed; native-runtime verification limits remain below. Future releases still require authorization.

## Server-owned15-second grace

`games/shared/connection.js` is used by all six factories. An unexpected seated human WebSocket close records an absolute15-second deadline. No temporary bot action is eligible during that grace. The deadline begins when the server detects the closed connection; heartbeat/network detection can itself take longer than a physical Wi-Fi loss. Spectators do not get bot control. Explicit Leave retains each game's existing exit/resignation behavior; it is not a disconnect.

At expiry the same person gets `disconnectBot`, never permanent `bot`, a new account, a new seat or new funding. Native AI uses the configured difficulty and public/own-hand information. Think delays still apply after bot control becomes eligible. Reconnect cancels grace and clears temporary automation before native attach sends private state. Action timers also recheck current turn/revision/connection so an obsolete callback cannot make a move for a reconnected human. Account takeover detaches old socket references before closing, so a device handoff does not create a fake disconnect.

- Capsa:15seconds replaces8; offline automation and a nearly expired ordinary turn deadline cannot act during grace. A previously expired turn may still time out after grace. Undo does not reset disconnect deadlines or restore a past controller.
- Mahjong:15seconds replaces the4-second offline action. A pending claim is not instantly passed on network loss. Non-fast waiting seats retain the claim opportunity through grace; at takeover native rule-based AI decides it. Fast mode still skips unavailable claims. Draw/discard/kong automation rechecks connection.
- Poker: grace starts at connection loss, rather than waiting a fresh15seconds on each turn. Proxy AI may check/fold/call/raise using normal difficulty; chip decisions remain part of the same player's simulated ledger. New hands can include a temporarily controlled human seat.
- Catur/Domino: previously paused indefinitely; after grace their native AI can continue for the disconnected seat. Chess clocks pause while a human is within grace, resume when the table is playable, and remain server-owned.
- Blackjack: after grace native AI chooses a minimum bet or a legal hand decision; a new table update does not reset the15-second grace. Dealer behavior is independent.

Lobby/completed-round proxy badges say Bot siaga: this does not automatically fund/start a lobby or bypass existing next-round readiness/consent. Offline connected-time rewards do not accrue.

## Persistence and lifecycle

Account identity, tokens, cards, scores and settled ledgers remain unchanged. Grace timer handles live in a factory-owned map and are cleared on attach, room disposal and server close; deleted/stale rooms are checked before a callback. Connection timestamps and `disconnectBot` are transient snapshot fields. Cold/runtime recovery continues to pause unfinished games for safe host continuation; elapsed old disconnect deadlines are never resurrected as automatic game actions. No DB schema/migration/actor change.

## Shared player feedback

Room metadata includes all seated players' public presence, deadline and server sample time. The shared toolbar renders Disconnect plus a local ticking countdown, Bot sementara/siaga, and Terhubung. Browser ticks do not generate per-second game messages or DB writes. Native seat labels use the same public presence status. A local disconnected socket can only estimate its own wait; it cannot assert server bot takeover before receiving state again.

Disconnect badges pulse; small animated notices announce disconnect, bot control and reconnect. Initial snapshots do not replay past transitions. User reduced-animation settings and system reduced-motion preferences are respected. Core status is text as well as color; animated notices do not intercept clicks.

## Validation and remaining limits

After the user authorized isolated validation, **200tests passed,0failed**, including native six-game15second grace/reconnect/full-round settlement checks, Mahjong pending claims, Chess clocks, Capsa turn-deadline guard, account handoffs and a real-time Worker/SQLite Chess disconnect cycle. Six-game active cold recovery, paused-action rejection, host continuation and dissolved-room tombstones after a second restart also pass. Additional Mahjong opening/pending-claim/undo and Blackjack dealt/dealer/settled checkpoints pass without duplicate payout. The23native connection cases also passed10repeat runs. One old VM fixture needed an inert `setInterval`; production code was unchanged. See [validation report](CONNECTION-VALIDATION.md) for exact scope, reproduction and remaining gaps.

This does not prove all network/storage/production races or every settlement/reward combination. No production rooms were used. Manual animation evidence remains the earlier isolated visual fixture; this automated run did not repeat browser/mobile/accessibility review. Cloud remains3.5.0. User requested completion of the pending test/documentation Git publication with “selesaikan”; no runtime deployment is needed or performed.
