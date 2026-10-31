# UNO · Meja Kita

Creator: Faiz T. Server-authoritative 2–8-player108-card shedding game. Seven cards per seat, numeric opening discard, matching color/value or wild, skip/reverse/+2/+4, shuffled discard recycling. Server validates +4 has no current-color card; only a just-drawn card can be played after drawing. Drawn unplayable card ends turn; playable draw can be kept by passing. Two-player reverse/skip returns control to the actor. Final +2/+4 penalties are dealt before scoring. Bot levels use only their own cards/public information and wait3seconds per action.

This is a casual house profile, not a claim to implement every published edition: UNO is announced automatically (no catch penalty), illegal +4 is rejected rather than challenged, no stacking/jump-in/7–0, numeric first discard, starter rotates, each hand finishes with an explicit rematch (no automatic500-point match). Quick Play is one hand. Number cards score face value, action20, wild50. Losers lose their remaining value; winner receives the total, zero-sum. Rupiah is a chosen display conversion only.

Rules reference: [Mattel basic instructions](https://service.mattel.com/instruction_sheets/41940-Eng.pdf). No official logos or artwork reused. Rendered cards are HTML/CSS, no new raster assets.

Shared native party-server factory owns rooms, turn/revision checks,3second bots,15second disconnect grace, private hand views, chat, room-service persistence/paused restore/queue/dissolve, account-bound sessions and result rewards. UNO stock and opposing hands never enter other viewers' state. Account, admin point corrections, rewards and eight-game route allowlists are integrated for both Node and Workers. See ../../docs/UNO-LUDO.md for release/verification boundaries.
