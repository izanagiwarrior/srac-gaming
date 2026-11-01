# Active table containment and lifecycle validation

Version3.11.17 bounds the shared party table grid with `grid-template-columns:minmax(0,1fr)` and bounds direct children with `min-width:0;max-width:100%`. The implicit auto-sized table track previously allowed the auto-fit player row and UNO hand to expand the page: a390px active UNO viewport produced896px document width. Internal UNO hand scrolling remains intentional. No global overflow hiding or game rule change.

## Evidence

- Active UNO/Ludo/Monopoli/Reversi:390px Dark andLight document width390. Ludo/Monopoli/Reversi also1280px desktop without document overflow. UNO desktop after patch was not measured.
- `tests/november-lifecycle.test.js`: real Worker/SQLite four Quick rounds with two synthetic human accounts and a spectator; lock, idempotent queue, yielding, host-only next, stale boundary rejection, seat rotation, UNO viewer privacy, once-only native results and dissolution.
- `tests/november-cold-new4.test.js`: active state/account-owned seat across emulator restart; private token rotated, recovery pauses bots until host continuation; dissolved codes remain unavailable after a second restart.
- `tests/november-grace-new4.test.js`: native fake-clock checks for14999ms grace, takeover at15000ms, actual bot action, seat/score/cards retained and stale timer cancellation on reconnect.
-22reported cases passed (20leaf cases plus2parent cases). Tests ran only with private temporary databases. No real Google login, owner account mutation or production match.

Run these suites sequentially because Worker integration fixtures rebuild the same generated bundle:

```sh
node --test --test-concurrency=1 tests/november-lifecycle.test.js tests/november-cold-new4.test.js tests/november-grace-new4.test.js
```

Do not infer all games, long names, populated leaderboard, all viewport/action states or real-time cloud grace behavior are proven. Later six-game lifecycle checks and the3.11.21 private render matrix extend this scope; see TABLE-STATE-UI.md. Release3.11.19 added bounded Monopoli bot trade proposals and development; see MONOPOLI-BOTS.md. Human match duration remains unbounded. Historical six cloud exceptions remain unattributed without retained stacks.
