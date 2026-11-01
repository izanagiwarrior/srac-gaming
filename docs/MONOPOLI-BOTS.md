# Monopoli bot trade policy — released3.11.19

The previous bot only responded to trades and Easy never built. Fragmented ownership could prevent housing and make Standard extremely long despite valid advancing turns. This update changes bot decisions, not the board, dice, rents, cash issuance, Quick eight-turn rule, Standard last-solvent rule or settlement points.

## Decisions

- At end of turn, first redeem mortgages on a fully owned group and build legally/evenly if reserves permit. Easy retains350k, Normal250k, Hard150k. Existing purchase/auction behavior is retained; Easy now also develops property.
- Propose only a non-mortgaged property that completes the bot's group. Easy offers cash; Normal/Hard may swap a spare undeveloped property. Never give away an existing full group. A plan must improve the sender's public portfolio estimate and not worsen the receiver's estimate. This is a heuristic, not a market value or guaranteed optimal strategy.
- Portfolio estimate: visible cash plus visible deed value (half if mortgaged), plus1.5×deed value bonus for complete unmortgaged groups. Normal/Hard use that estimate when accepting; Easy keeps its simple randomized acceptance.
- At most one offer per ordinary turn. The normal validated trade action records bounded per-player `tradeOfferTurns` metadata; rejected/cancelled offers do not loop on the next3second bot timer. Human trade permissions and freedom to send multiple offers are unchanged.
- Every trade still uses the same authoritative trade action, owner/funds/building checks and explicit target reply. A connected human target is never auto-accepted. Disconnect grace and temporary proxy may reply only through the existing automation mechanism. All bot timers remain at least3seconds.
- Optional metadata initializes on a new match and is tolerated when absent from old state; it serializes with existing room snapshots. No new database schema, actor, binding, account entitlement or private-hand access.

## Local evidence and limits

Nine deterministic four-player Standard replays, same baseline seeds1/42/2026 and three levels, now finish in431–777actions versus previous2/9finished and7hitting the30000action test bound. Expanded sweep:600seeded engine scenarios (20seeds ×2–6players ×3levels ×Quick/Standard) all finish within10000testactions, largest1433. These are seeded simulation outcomes, not a guarantee of match duration or human acceptance. Production randomness remains crypto.randomInt.

Focused engine cases cover ownership/cash conservation, rejected-offer cooldown, public-only pure planning, reserves, mortgage/build eligibility, native Quick finish, serialization/legacy state and human consent. Native fake-clock server cases cover3second offer timing, waiting for human accept/reject, plus18full matches across2/4/6seats,3levels andQuick/Standard with temporary proxy takeover and once-only ledger after reconnect. Worker/SQLite lifecycle regression is recorded separately by the operator. No real-player/cloud game was used. No manual browser barter preview or all-human market behavior was verified.

Run the focused suites:

```sh
node --test tests/november-monopoli-bot.test.js tests/november-monopoli-trade-flow.test.js
```

A long human game remains possible. Standard has no hidden turn cap, forced sale, forced barter or rent inflation.
