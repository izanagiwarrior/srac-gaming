> **Released in3.16.1 (1November2026).** This feature is installed on Cloudflare and included in personal GitHub sourcebc80d46. Any local/pending/no-deploy descriptions below are historical authoring evidence, not a current release backlog. See [current status](PROJECT-STATUS.md). Gacha's final missing-only policy is poolfirst-light-v2.

# First Light gacha

Pending local3.16.0 / `2026-11-01-limited-gacha-1`,1November2026. Includes3.15.0animations and all earlier pending work. Cloud/Git remains3.11.21. No real users, real currency or production actions were used during authoring.

## Product policy

Each explicit single draw costs **100 account coins**. XP, table chips/points, IDR simulation results and leaderboards are untouched. Account coins are existing earned/admin-adjusted cosmetic currency, not cash, a deposit or a withdrawal mechanism.

| Outcome | Chance | Total coins received | Net coins |
|---|---:|---:|---:|
| Zonk |50%|0|−100|
| Cost returned |30%|100|0|
|1.5× reward |10%|150|+50|
|2× reward |9%|200|+100|
| One limited |1%|0|−100 plus item if new|

These are the user's corrected final odds, not the earlier draft with a half refund. They sum to100%. Each draw keeps the same 1% asset-category chance, without pity or a guaranteed asset-category hit. The 1% asset outcome chooses uniformly among the IDs not currently owned, starting at **0.2% per item** when all five are missing:

| Stable ID | Name | Slot |
|---|---|---|
|limited-eclipse|Eclipse Sanctum|Profile decoration|
|limited-phoenix|Phoenix Rebirth|Entrance|
|limited-nova|Nova Ascension|Entrance|
|limited-nebula|Nebula Crown|Aura|
|limited-chrono|Chrono Halo|Aura|

All five use lightweight finite CSS themes, not new images. “Limited” means gacha-exclusive for ordinary users; there is no advertised end date or global stock cap. Normal shop purchase returns403 for gachaOnly items. They are hidden from the ordinary shop, shown in the five-item gacha collection, and appear in inventory/profile once owned. Existing admin possession controls can explicitly grant/remove them, with the same audit trail as other inventory; that is intentional admin authority. No automatic rank grant is added.

While any limited is missing, an asset-category hit always grants **one new item**, chosen uniformly from the fresh unowned subset. Per-missing-item chance is1% divided by the number still missing (5→0.2%,4→0.25%,3→approximately0.333%,2→0.5%,1→1%). Owned items are excluded, not rerolled after selection. The UI shows dynamic per-item chances and marks owned items instead of retaining a fixed0.2% label.

Once all five are owned, the normal1% asset-category hit chooses an already-owned item and gives **no additional inventory or replacement coins**—effectively zonk. The fresh current collection is checked before each transaction; owning all five requires explicit `ackComplete:true`, with another UI warning before each new draw. Users may continue seeking the10%/9% coin rewards. If two different requests race for the final item, the second sees completion and requires acknowledgement before charging. Existing inventory uniqueness remains a defensive constraint.

## Server integrity

`cloudflare/accounts/gacha.js` uses Web Crypto uint32 values with rejection sampling for unbiased integer selection over10,000 outcome buckets and five asset slots. Clients cannot choose stakes, outcomes, asset IDs or payouts. Pool ID is `first-light-v2`. Change the pool ID whenever cost, odds, payout or pool composition changes after publication; preserve old catalog IDs and immutable receipts.

One synchronous AccountStore transaction checks an existing receipt, pool, fresh balance, owned subset and complete-collection acknowledgement; applies a per-user10/minute limiter; chooses the outcome; debits/credits; optionally inserts inventory; inserts the immutable receipt and one gacha.drawn audit event. Any failure rolls the transaction back. Keep existing session/Origin/CSRF checks. Balances below100 are rejected; balances over999,999,900 are refused to guarantee a possible+100 net payout stays under the existing1billion coin cap. Payouts are not silently clipped.

`gacha_draws(user_id,request_id,pool,result,created)` has primary key(user_id,request_id) and index(user_id,created DESC,request_id DESC). Replay finds the stored receipt **before** charging/rate-limiting and returns exactly the recorded result, including after lost response/restart. Different users cannot retrieve each other's receipts. Same-ID concurrent requests charge/grant/log once. Receipts are not deleted with90-day audit-log cleanup; deleting them can re-enable old requests and double-charge. No actor/binding/namespace/migration ID changes or resets.

GET `/api/account/gacha` returns fixed policy, a bounded lookup of at most five owned items, one latest receipt and optionally the current user's point-keyed request receipt. It does not fetch the whole draw ledger, count history or poll. Existing20-row history/admin-audit pagination includes category `gacha`. Source receipts/audits legitimately add small writes per draw; this is not a guarantee against account-wide Cloudflare quota exhaustion.

## Client safety and presentation

Menu `Gacha limited`, always-visible odds/cost and ownership5-card panel. Confirmation before a new draw; stronger duplicate warning when complete. Previews of the four animated limited items are presentation-only. Result panel discloses payout/net/cost and duplicate state; inventory remains server-owned. A short neutral orb motion/result reveal respects reduced-motion preferences; no fake near-miss carousel, auto-draw, bulk draw or time-pressure claim.

An unresolved operation keeps only a request bookmark(request ID/pool/acknowledgement) in account-scoped sessionStorage with an in-memory fallback. No balance, collection, password, OAuth token or authoritative account state is stored there. Reload checks that receipt first; retry reuses the same request ID. Known rejection clears the bookmark; uncertain transport errors retain it. Account change/logout clears transient presentation state. This is an idempotency aid, not a local user database or backup.

## Verified authoring evidence and limits

Only an isolated loopback workerd/SQLite database with synthetic accounts/coins was used. Private deterministic RNG/fixture wrappers are **outside source** and must never publish. Production uses Web Crypto, with no test seed, force-outcome endpoint or configuration.

- Native local API checks at every probability boundary (0/4999/5000/7999/8000/8999/9000/9899/9900/9999) produced exact corrected outcomes/payouts; all five asset slots individually produced their IDs. This verifies mapping, not a production statistical randomness study.
- Replaying a recorded2× outcome returned identical result, net+100 and one receipt/event. Two simultaneous identical zonk requests returned identical results, net−100 and one receipt/event. GET receipt recovery returned the exact own result; another account received null; anonymous status401.
- Partial-ownership asset hit selected a missing item without duplication; full-collection duplicate paid0 and retained five copies total (one per ID). Fifth new limited marked completion. Complete collection without acknowledgement409/no coin/receipt change. Explicit continuation allowed both coin reward and duplicate asset outcomes.
- Insufficient coins409/no change; direct limited buy and unowned equip403. Supplied fake cost/payout/outcome fields ignored. Private forced failure before receipt insert503 rolled back debit, inventory, receipt and audit; retry with same ID then succeeded once and won decoration equipped successfully.
- Five consecutive controlled asset hits produced five unique items; partial-subset selector and final-single-item cases selected missing IDs. Racing two different requests for the final item produced200/409, one charge and one receipt. New-policy same-ID replay remained identical. These checks are recorded separately in the private MISSING-POOL-REVIEW.
- Ten fresh draws allowed, eleventh429; receipt replay still200 at the limit. Exact upper balance can reach1billion; overflow boundary409/no change. Wrong pool409 and short ID400/no charge.
- Browser authoring inspected odds, collection, all-five confirmation (cancelled without a browser draw), Dark/Light320px page/dialog bounds, four limited animation previews and no observed browser console errors. Server draws occurred only via the private synthetic API driver. Full browser lost-response/storage-disabled flow, actual random UI draw, multi-device/restart fault injection, OS reduced-motion emulation, gameplay/full suite and production migration/load were not exercised. Source/syntax/build checked separately. The initial v1 draft allowed partial-collection duplicates; user clarification superseded it before publication, so the current pool is v2. No v1 was deployed.

No push/deploy/canonical installation. New explicit release authorization required. Publish only source manifest; never private review workers, forced outcomes, fixture DB or helpers.
