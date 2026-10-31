# Connection regression validation — 31 October 2026

Baseline: release **3.5.0 / `2026-10-31-disconnect-grace-1`**, Git `862bf1806c1e24071f12a2bb0e6a5db70ec13d77`.
User authorized isolated validation with “lanjut”. Public hosting, production rooms/data, legacy live and deployment configuration were not touched. No commit, push or deploy was performed during validation. The subsequent “selesaikan” request authorizes the Git-only publication of these tests and documentation; it does not require a runtime deployment.

## Results

`node --test --test-reporter=tap tests/*.test.js`: **200 passed, 0 failed**, approximately48seconds. This includes43new checks compared with the157baseline:23native connection cases, one shared-client case, one real-time Worker/SQLite case,13cold recovery checks (parent plus12game subtests), four Mahjong phase checks (parent plus3subtests) and one Blackjack phase-recovery check. The23native cases also passed in10additional runs with fresh random deals each run.

The first baseline run had156/157passing: the shared browser VM fixture lacked `setInterval`, which the new presence UI uses. Its test context now supplies an inert interval. No production runtime change was needed. A new Mahjong fixture initially sent the wrong message type; it was corrected to the native `action/discard` protocol before the final run. These were fixture defects, not game regressions.

| Layer | Verified scenarios |
| --- | --- |
| Six actual native game factories | No temporary action before14999ms; takeover at15000ms; native AI really acts; reconnect before/after takeover keeps seat/token/cards and score/chips; cancelled old callbacks cannot act after reconnect. Fake clocks exercise actual engines, not UI-only fixtures. |
| Native full rounds | All seated humans disconnect while a spectator stays connected; temporary AI completes one round in each game. Scores/chips including pot/dealer conserve total; reconnect does not settle twice. Chess uses a mate-in-one position to bound completion.10repeat runs additionally exercise random deals. |
| Mahjong | Manual pending claim remains available through grace and reconnect; after expiry native proxy resolves its claim. |
| Chess | Blitz clock pauses in grace, resumes with the same remaining time, and reconnect cancels pending proxy moves. |
| Capsa | Ordinary near-expiry turn deadline cannot bypass a newer disconnect grace. |
| Lifecycle/snapshots | Spectators, explicit exits, disposed/deleted rooms and server close cannot acquire temporary control; snapshot retains identity/cards while excluding transient proxy/deadline fields. |
| Shared cloud client VM | Fresh connection automatically sends the socket-bound DB-seat claim; an occupied different game redirects there; empty DB ownership ignores stale browser cache. |
| Actual Worker + SQLite emulator | Existing six-game connected/in-progress handoffs, simultaneous claims, token theft rejection, logout and cold lobby recovery pass. New real wall-clock Chess case disconnects/reconnects before grace, disconnects again, observes15-second expiry via actual adapter, then reclaims the same active seat with board/scores retained. |

## Active cold recovery follow-up

The follow-up “lanjut” authorized further isolated validation, not publication. `tests/account-rooms.test.js` now opens all six games using unique synthetic accounts and private SQLite storage, disposes the emulator with live sockets, then starts a fresh runtime over that same private store. Every DB-owned seat is discoverable without a browser token; a new socket-bound claim rotates its credential. The visible hand/board/chain, phase, turn, round/match and score/chip values match the pre-stop checkpoint. Blackjack is checkpointed during its active betting phase (before cards are dealt); dealt Blackjack hands are covered by the earlier connected handoff/native tests, not this new cold-recovery fixture.

Every restored active table is paused, exposes no stale temporary proxy/deadline, rejects a Start action while paused, and makes no game progress during a3.1-second observation. Host continuation clears recovery successfully. After dissolving each room and a second runtime restart, ownership discovery is empty and the old code rejects Join. The dedicated13-check recovery suite passed separately and again within the full195-test run. Initial new signup fixture expected200instead of the actual successful201; corrected before these passing runs. Production runtime code remains unchanged.

## Phase-specific recovery follow-up

A further “lanjut” authorized private Mahjong/Blackjack checkpoints. The full200-test run includes:

- Mahjong opening: restart at the initial animation step preserves dice/opening ID, wall layout, scores and dealt counts. Paused animation does not advance. Host continuation and Skip finish with53concealed tiles in total and the same remaining wall (no second deal).
- Mahjong manual pending claim: all four players are synthetic humans. Cold restart preserves the offered claim ID, waiting seats, per-player options, hands, discards, flowers and scores. After every player returns and the host continues, three Pass actions advance to the next discard turn without duplicate tiles.
- Mahjong pre-claim undo: checkpoint immediately after a discard, before the2-second undo window finishes and before claim options exist. Cold restore expires old undo; host continuation offers claims and all three Pass actions advance normally.
- Blackjack dealt: a real shuffled non-natural hand with10chips committed survives restart with exactly the same cards, wager, stack, dealer visibility and ledger. A Stand request is rejected while paused. Host continuation preserves that state. The fixture bounds/retries natural-only initial rounds before selecting an active hand.
- Blackjack dealer: after Stand, restart again during the dealer phase, verify its same dealer cards/hand/ledger, then continue through the native dealer logic. Including the house, total chips equal purchased chips.
- Blackjack settled: a third restart retains the final ledger/stacks/house exactly; it does not rerun payment or mark the completed round recovering.

No production code fix was needed. Disposable emulators/accounts were removed after the run; no public room/data/host changes, commit, push or deploy.

## Reproduce privately

Use Node26 and the locked dependencies. Run the suite from staging with local loopback/emulator permission. Tests build the Cloudflare bundle and use temporary local SQLite stores and synthetic accounts; no production credentials, secrets, real rooms or real balances are needed. The native connection file runs without a listening server: `node --test tests/disconnect.test.js`.

## Remaining limits

This is regression evidence, not exhaustive correctness or a security certification. Real production packet loss, heartbeat detection delay, deployment interruption, storage failure/quota exhaustion, all possible claim/turn races and all settlement/reward combinations are not exhaustively covered. New wall-clock adapter coverage is Chess; six-game timing/full-round checks use fake clocks. The previously reviewed visual fixture is separate evidence; this run did not repeat manual browser/accessibility/mobile animation review. The generic cold-recovery check covers one initial active checkpoint per game (Blackjack betting), with the additional Mahjong/Blackjack phases listed above. It still does not cover every intermediate opening step, Kong/rob-Kong, multi-hand split/double, concurrent settlement race or storage failure. It uses emulator disposal with live sockets; this is not real production failure injection.

Runtime stays3.5.0. This validation record and regression tests form the Git-only follow-up requested by “selesaikan”. No runtime deployment is pending. Publication must be confirmed against the remote; future changes still require fresh publication/deployment authorization.
