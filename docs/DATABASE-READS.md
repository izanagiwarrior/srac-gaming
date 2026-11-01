> **Released in3.16.1 (1November2026).** This feature is installed on Cloudflare and included in personal GitHub sourcebc80d46. Any local/pending/no-deploy descriptions below are historical authoring evidence, not a current release backlog. See [current status](PROJECT-STATUS.md). Gacha's final missing-only policy is poolfirst-light-v2.

# Database read discipline

Local candidate 3.13.0 / `2026-11-01-database-pages-1` includes the pending rank/cosmetic work from 3.12.0. Not installed, pushed or deployed. Current cloud/Git remains 3.11.21. This is an original implementation of generic indexed pagination and scoped caching patterns reviewed in Feedback Intelligence; no office source, data or configuration is copied into this repository.

## Lists and queries

- Account history, admin users, audit and admin roles: 20 rows per page, fetch 21 to determine `next`. No exact filtered count, deep OFFSET, or automatic log polling. History no longer queries the separate reward ledger that its UI did not render. Reward accounting/history storage is preserved.
- Opaque UTF-8 cursors bind the complete filter scope and sort tuple. They are navigation hints, never authorization. Session/role checks still run on every API request; own history remains user-scoped. Bad/cross-filter cursors return 400. Previous-page navigation uses a browser-memory cursor stack.
- Audit defaults to seven days, optionally 1/30/90 days, with category/game filters. Index choice is explicit for unfiltered, user, category, game and combined category/game paths. Time/ID tie breaking is stable. The rolling window can shrink while paging; it is not a transactional snapshot/export.
- User search selects **name or email**, and matches the **start**, not an arbitrary substring. Literal punctuation is not a SQL wildcard. SQLite NOCASE folds ASCII only; other scripts match literally. Prefix bounds skip the uppercase ASCII gap in the normalized ordering. Equal-name tails and later names use separate bounded seeks, avoiding rereading earlier pages even with duplicate names. Empty search sorts by created time/ID.
- User lists join role existence in the list query and reuse that result for presentation. Do not reintroduce per-row role queries. This does not cache authorization.
- Shop/inventory: 12 cards per page from the existing catalog/inventory response. No extra DB request to turn these pages.
- Leaderboard: existing top-50/30-second server and browser cache retained; display ten per page, compact entry five. Page changes use the same fetched snapshot. Global level uses an indexed projection of eligible accounts rather than sorting all accounts.
- Room directory: six per page with local game/name/code filters. Its source is GamingHub memory, not SQL. Polling changes from every five seconds to every 30 seconds only while its section and document are visible; manual refresh remains. Admin live rooms show ten per page; balance rooms show five plus local search. Those two APIs still return the RAM room list when opened; this improves rendering, not SQL read counts.

## Dashboard and grant caches

- One indexed window of at most 2,001 reward records replaces three overlapping seven-day aggregations. Only the newest 2,000 participant-rounds are aggregated; `sampleLimited` is explicit and the dashboard labels the sample. This is **not** a complete seven-day report above the cap. Active-last-day display is capped at 2,000 with a limited flag.
- Summary cache: 60 seconds per actor, after fresh authorization. Total-account/XP/coin aggregate: 15 minutes, with generation timestamp. That first aggregate still reads the user table and is not a constant-cost operation. Actor eviction clears these caches, so cold actors may recompute earlier; no exact read-budget reservation is claimed.
- Repeated automatic admin grants reuse a bounded actor-local cache keyed by user revision, after a fresh role check. Rank grants reuse a bounded user/level cache. Durable grant receipts/watermarks remain authoritative after restart. These caches never store permissions, sessions or passwords and cannot authorize an unowned cosmetic.

## Additive storage and cost tradeoffs

Same AccountStore/GamingHub actors, namespaces, bindings and migration identities. No data reset, deletion, relocation or retention change. New composite/expression indexes are created idempotently. Their first creation scans existing rows and writes indexes; additional indexes also increase subsequent write work. Existing indexes are retained for compatibility.

`rank_account_levels(user_id PRIMARY KEY,xp)` plus `(xp DESC,user_id)` maintains global-level eligibility. A one-time, metadata-marked backfill copies real XP only for accounts with an existing positive-round global standing. SQL triggers update the projection in the same transaction as user XP updates, insert it on first global standing, and remove it on user/global-standing deletion. Admin XP changes follow the same path; no rewards or money are invented. Equal-XP display order is deterministic user ID, while tied XP retains the same rank. A future direct change to standing eligibility must also maintain this projection. This trades a small extra write on eligible XP changes for bounded ordered rank reads. Do not add another actor/storage migration to optimize it.

## Verified local evidence and limits

An isolated workerd/SQLite fixture used 1,000 synthetic accounts, 50,000 events, 20,000 reward rows and 40 extra roles. No production account/game actions occurred.

- Direct SQL comparison: old deep-offset user query read 1,000 rows for 50 returned; indexed seek read 21 for 21 returned. Old category-log example read 200 for 100 returned; indexed category seek read 21 for 21 returned. Different page sizes are intentional; these are query examples, **not** whole-service savings percentages.
- Real local endpoints, including session/role checks: unfiltered users 26 reads on both first and second pages; Unicode-prefix users 25/26; audit 46/47; combined game/category audit 46/47; roles 26/26. Twenty results returned, no overlap between inspected page pairs. Earlier plans which scanned 45/89 reads on filtered second pages were corrected before final measurement.
- Dashboard: 4,016 reads on first measured cold summary with this fixture, then four on the immediate cache hit. Global-level leaderboard: 161 reads for 50 entries on first measured request, three on its immediate cache hit. The XP projection reflected a private synthetic XP update. These are local cursor counters from the measured statements, not a production bill or guarantee.
- One hundred synthetic users sharing a display name were paged three times with no overlap (32 first-request reads including cold admin grants, then 25/25). A literal email prefix ending `@` returned only its one matching account, excluding a nearby `[` address.
- Invalid/mismatched cursors: 400. Non-admin audit: 403; own history: 200. Private UI authoring checked users/roles next page, Unicode search, shop page changes, audit filters, leaderboard ten-row page changes, and empty balances/lobby. Seven account pages fit 320px in Dark and Light; desktop audit and 320px leaderboard/lobby checked. Table content may scroll inside its bounded table container.
- Syntax/build checks passed. No gameplay/full suite, production migration, real production load, large populated RAM-room pagination, concurrent mutation/snapshot consistency, quota guard, or every state was validated. Private fixture workers, measurement headers, databases, scripts and results are excluded from publication.

## Rules for future agents

Every growing list needs an indexed bounded query, cursor tied to filters, explicit page size and `next`; a returned LIMIT alone does not prove cheap reads. Inspect actual query plans/cursor `rowsRead`, including deeper pages and duplicate values. Search must use an index-compatible contract; do not silently switch to `%contains%`. Never auto-fetch expensive exact totals. Use small cached/bounded summaries with clear freshness/sample labels. Keep fixed catalogs and RAM lists separate from DB-read claims. Never cache positive authorization to save reads. Never include sensitive SQL parameters in telemetry. Do not claim these optimizations isolate the account-wide Cloudflare quota; other projects can still exhaust the shared pool. Push/deploy requires a new explicit user request.
