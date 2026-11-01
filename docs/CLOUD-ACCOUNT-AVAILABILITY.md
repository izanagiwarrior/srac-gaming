# Cloud account dependency availability — candidate3.11.16

## Observed defect and behavior

GamingHub's WebSocket handshake awaited AccountStore and parsed JSON outside the existing native-factory restoration catch. A backend exception or malformed response escaped the request. Private fault injection of the actual fetch method reproduced40uncaught errors/40cases across10games. This establishes a code defect, not the exact cause of the six previously observed production exceptions.

Candidate3.11.16 handles dependency transport/non-success HTTP/invalid JSON with generic503before factories/timers or a game WebSocket are initialized. Non-null identity must satisfy the existing internal session contract (nonempty string id/sessionId and finite expires); invalid structure gives503, null or expired identity gives401. Cross-site Origin is rejected403before account lookup. Normal signed-in connections retain existing AccountStore ownership and native game logic. No provider error, email, cookie/token or backend body is included in the public error. No automatic retries, database migration, grant, namespace rename, billing or logging enablement.

## Verification

-40baseline prepatch method probes reproduce uncaught failures.
-102targeted source-method assertions are part of302passingcandidate regression cases.
-61private actualWorker/SQLite tests (parent+60subcases):10games×transportthrow,500nonJSON,503JSON,malformedJSON,invalidshape,null; controlled503/401andnosuccessfulWebSocket. The fake account actor deliberately fails; this is not a live provider failure test.
-59additional checks rerun in a separate validation tree:4newgamehandoff/dissolve,leaderboard/replay,password/reset,enginecases,andnativeQuickresults throughWS/outbox/AccountStoreSQLite. Totals **422casespass**; targeted102are already contained in302and must not be counted twice.
-Native full result rounds run locally; no production room/account/score changes. StandardMonopoli tests include bounded simulations, not a full-completion claim. See separate investigation notes.

## Limits and release

Historical Workers Observability was disabled. A temporary live stream previously returned no events during a successful read-only room-directory request; no historical exception stack was recovered. Sixproductionexceptionsremainunattributed. Compatibilitydate2026-10-23already enables runtime close replies per https://developers.cloudflare.com/durable-objects/api/base/ ; no speculative handshakeclose patch was applied.

Candidate includes3.11.15rankingCSS. Running3.11.14 remainsunchanged. New explicit GitHubpush/deploy authorization is required. Keep both DurableObject actors/migrations/secrets and existing cloud/legacydata; neverenableACCOUNT_PREVIEWpublicly or publishprivatevalidationfixtures.
