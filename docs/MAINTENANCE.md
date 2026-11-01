## Released 3.11.19 — 1 November 2026

User authorized “push deploy” for the reviewed3.11.19 candidate, including pending3.11.18. Cloud3.11.19 / `2026-11-01-monopoli-bot-trades-1` is installed at https://srac-gaming.faiz-triputra.workers.dev/ . Monopoli bots now propose group-completing consensual trades, consider full groups when replying and develop/redeem with level-specific reserves; one proposal per ordinary turn and existing3second timers. Board, randomness, rents, Quick/Standard finish rules and zero-sum settlement stay unchanged. Optional bounded offer-turn metadata uses existing snapshots and supports missing legacy fields. See [bot behavior and validation](docs/MONOPOLI-BOTS.md).

Includes3.11.18: mobile action panels follow normal page flow instead of covering cards/tiles; Poker/Mahjong Light felt status contrast corrected.12-file manifest verified against clean20ad7bd and backed up before installation.65prior local cases passed (43focused/native and22Worker/SQLite lifecycle), plus600seeded simulations all finished within the test bound. Build/whitespace/dry-run passed,134publicassets,396.71KiB/gzip111.46KiB bundle. Browser confirms new health/10games,14entrypages loaded and both changed public stylesheets contain the intended rules. No production room/account mutations or manual live match. Same database actors/bindings/migrations/secrets; legacy Node untouched.

No pending runtime source deployment;3.11.18 is included/superseded. Personal Git publication is authorized for this release; verify remote before reporting push complete. Remaining production-test identity, all-state coverage and six historical exceptions without retained stacks are explicit verification limits. Sampled bot matches are not a duration guarantee for human games. Future changes/push/deploy require a new request; older Pending entries describe preparation history.

## Released 3.11.17 — 1 November 2026

User authorized “push deploy” for the reviewed active-table candidate. Cloud 3.11.17 / `2026-11-01-active-table-width-1` is installed at https://srac-gaming.faiz-triputra.workers.dev/ . Shared party table grid now uses an explicit shrinkable column and bounds children: active UNO mobile document width896 at390viewport is fixed without disabling internal hand scrolling. Applies to UNO, Ludo, Monopoli and Reversi; no engine, bot, authentication, accounting or storage changes. Same cloud namespaces, bindings, actors, migrations and secrets; legacy Node live untouched.

Seven-file manifest verified against clean bad2479 before installation, private source backup retained. Candidate22isolated test cases passed (20leaf+2parent): four-game spectator/lock/queue/yield/rotation/boundary, result-once, SQLite cold recovery/tombstones and fake-clock15second proxy/reconnect. Four active game tables390px Dark/Light contained; Ludo/Monopoli/Reversi1280desktop checked. Build/dry-run passed,134publicassets and394.77KiB/gzip110.87KiB bundle. See [validation scope](docs/ACTIVE-TABLE-LAYOUT.md). No production room/account mutation. Git publication is authorized for this release; verify remote before declaring push complete.

No pending runtime source installation. Remaining six-game complete queue/active-state UI matrix, agreed production test identity, six historical exception attribution and Monopoli Standard duration are follow-ups, not claims of complete coverage. Future patch/push/deploy requires a new request. Earlier Pending3.11.17 describes preparation history.

# Maintenance and agent handoff

## Released3.11.16 —1November2026

User authorized “puh deploy”, understood as push and deploy3.11.16. Cloud **3.11.16 / 2026-11-01-auth-availability-1** installed at https://srac-gaming.faiz-triputra.workers.dev/ ; deployment **58ac318c-1cae-4f41-83f6-097bc302b7e6**. Source **98674706d8e3579728aaa91a2923160d721bee12** pushed through personal GitHubDesktop izanagiwarrior and independently matched remote main. Includesrankingalignment3.11.15 and controlled AccountStore-failure handling before game initialization. HistoricalPending3.11.15/16 headings below are preparation history, not separate unreleased patches.

Verified9-file source manifest against clean3d19dae before staging installation; source backup/private probes remain outsideGit. Prior422isolatedcasespass (302regressionincluding102faultassertions+61WorkerSQLitefaultcases+59newgame/account/native-resultchecks). Syntax/whitespace/build/dry-run passed;134publicfiles,394.77KiB/gzip110.87KiB bundle. Publichealth matches10games/newbuild,14entrypages200,disclosuresCSSbyte-identical,anonymousaccountAPI200/Googleconfiguredtrue/previewfalse,all10anonymousgamehandshakes401. No productionroom/account mutations or injected backendfailure; storage/bindings/migrations/secrets/loggingpolicy and legacyNode unchanged. Currentaccountaccessobservedrecovered; oldquotaoutagerecords are historical, not a statement of presentfailure.

No pending source deployment. Release documentation follows in a documentation commit under this same authorization; consult Git history/private release receipt for its final hash. SixhistoricalWorkerexceptioncausesremainunattributed; fixing a proven sourcefault doesnotproveeveryoldexceptionfixed. StandardMonopoliduration/balancing and remainingproductiontestidentity/full-statecoverage remainfollow-ups. Future code changes/push/deploy need a new request.


## Released 3.11.14 — 31 October 2026

User authorized “push, deploy, update obsidian”. Cloud build **2026-10-31-dragon-flame-1 / 3.11.14** is installed at https://srac-gaming.faiz-triputra.workers.dev/ ; deployment **3214c64d-d2bd-4881-85db-da5ef2450ceb**. Source commit **50a0ec8396f48005e0f0172f9e01ad927a3094d9** pushed through personal GitHub Desktop izanagiwarrior and independently matched remote main. All pending3.9.0–3.11.14 work is included: ten games, featured Mahjong/alphabetical grid, database leaderboards, compressed character/card artwork, white Faiz profile, integrated black-dragon brand/favicon/login aura, consistent panels/disclosures, centered creator footer and help bullets. Historical Pending headings below describe preparation, not outstanding deployment.

Canonical staging reconciled from verified94-file candidate manifest on clean46321a1; source backup retained outside Git. Build/dry-run passed:134publicfiles,394.35KiB/gzip110.79KiB bundle. Public health confirms10games/newbuild;14entrypages200 and14representative assets byte-identical. Shared Google secrets, Durable Object bindings/migration identities, existing account/game storage and legacy Node live are preserved; local preview data is not uploaded. Leaderboard adds tables/indexes and a one-time XP/outcome backfill in the existing AccountStore; historical money/points are never invented.

**Availability remains impaired:** anonymous account API500 before and after deployment. Read-only Worker tail again shows `Exceeded allowed rows read in Durable Objects free tier.` Account/login/leaderboard and account-gated gameplay cannot be declared healthy until the account-wide daily quota resets and recovery is checked. No billing upgrade, reset, data deletion or workaround migration was performed. Static release is installed; quota recovery remains external. No new automated/gameplay tests; four new games/full settlement/ranking recovery/mobile/all-state verification remains incomplete. No production room actions. Future code changes/push/deploy require a new request. Release documentation is published in a follow-up documentation commit under this same authorization.


## Pending3.11.12 — creator credits in centered footer (31 October2026)

Local3.11.12/build2026-10-31-creator-footer-1 includes3.11.11. Shared game-tools moves creator/emblem from top .hubbar to one semantic footer.mk-game-credit appended at document end for all10games; normal flow, centered, small, wrapping/safe-area padding, never fixed/overlay. Top game bar now2columns/back+profile. Removed duplicate Creator smalls on4new-game headers and dynamic new-game entry eyebrow credit; landing game-card authors and creator mapping retained. Existing heading/branding/avatar/disclosure/rules/auth/data unchanged.

Preview http://127.0.0.1:3040/mahjong/ /privateSQLite/session29744; isolated work/creator-footer-patch/source. Build/source checks,958px demo Mahjong Dark/Light and UNO long entry footer reviewed; no room/start/gameplay/automated/mobile/active table verification. Canonicalmain46321a1/cloud3.8.1/oldpreviews/live unchanged; no install/commit/push/deploy. Earlierpendingincluded/superseded, newrelease authorization required; quota not rechecked. Proof outputs/creator-footer-preview.png.


## Pending3.11.11 — consistent disclosure controls (31 October2026)

Local3.11.11/build2026-10-31-disclosure-consistency-1 includes3.11.10. Last-loaded public/disclosures.css on all13entries gives every native details/summary the same small left arrow (right=closed/down=open), hides native marker/right+/minus variants, standardizes8pxlabel gap. Shared sidebar fold buttons now prepend same arrow and omit visible Buka/Lipat/?/Tutup labels; aria-label/expanded states and persistence keys remain. Help ? is still help, actions/navigation/emoji retain distinct semantics. No animation required, no color/rules/auth/storage changes.

Isolated work/disclosure-consistency-patch/source, preview http://127.0.0.1:3039/mahjong/ /privateSQLite/session23479. Build/source/13stylesheet checks;958px demo Mahjong preferences+ranking closed/open, Dark/Light; private unstarted CMRU lobby sidebar chat/cheat/recap/log reviewed and cheat opened, then left. No Start/production/gameplay/automated/mobile/fullkeyboard/all-state validation. Canonicalmain46321a1/cloud3.8.1/oldpreviews/live untouched; no install/commit/push/deploy. Previouspendingincluded/superseded, new release permission required; quota not rechecked. Proof outputs/consistent-disclosure-preview.png.


## Pending3.11.10 — consistent leaderboard/lobby panels (31 October2026)

Local3.11.10/build2026-10-31-lobby-panel-consistency-1 includes3.11.9. New last-loaded public/lobby-panels.css on all13HTML entries defines shared surface/text/border/radius tokens from each page's native card/panel theme. Preferences, ranking and room-directory now share those colors,12pxcorner and border; game ranking uses same content width/insets and70pxdesktop collapsed height as preferences,13pxfont/650weight. Landing leaderboard+directory share max1200/contentwidth/padding28/title32 and margin. Ranking selects/refresh44px and sortgroup44px with36pxbuttons match theme switch proportions; smaller breakpoints coordinated. Native Mahjong dark cards are gray, Poker/UNO use own native green surfaces, Light uses native cream. No JS/engine/auth/storage changes except hub build metadata.

Preview http://127.0.0.1:3038/mahjong/ /privateSQLite/session40811, isolated work/lobby-panel-consistency-patch/source. Build/source checks and13stylesheetreferences. Manual958px landing computed identical backgrounds/borders/width878/left40/padding28/radius12/title32; Mahjong ranking/preference matched gray/border/width918/left20/radius12, reviewed closed/open Dark/Light. UNO/Poker closed panels reviewed. No production/room/start/gameplay/automated/mobile/populatedrank/longdata validation. Canonicalmain46321a1/cloud3.8.1/oldpreviews/live unchanged; no install/commit/push/deploy. Earlierpendingincluded/superseded; new release authorization required, quota not rechecked. Proof outputs/consistent-mahjong-ranking-preview.png.


## Pending3.11.9 — consistent tab favicon (31 October2026)

Local3.11.9/build2026-10-31-favicon-brand-1 includes3.11.8. All13HTML entry pages (hub/account/leaderboard +10games) explicitly use /favicon-dragon-v1.png,64×64RGBA/3729bytes, derived from existing unified black-dragon/gold-club emblem. New filename avoids stale old-favicon cache. Legacy favicon.svg also embeds the new emblem as a fallback. No imagegen/new character or account/game/storage changes.

Isolated work/favicon-brand-patch/source, preview http://127.0.0.1:3037/ /privateSQLite/session95555. Build/source and13icon-tag checks; browser landing resolves new favicon link and compressed asset inspected. Browser tab chrome icon itself not captured by page screenshot; no gameplay/automated/mobile verification. Canonicalmain46321a1/cloud3.8.1/oldpreviews/live unchanged, no install/commit/push/deploy. Prior3.11.8included/superseded, new release permission required; quota not rechecked. Icon proof outputs/dragon-favicon.png.


## Pending3.11.8 — Wikipedia UNO artwork (31 October2026)

Local3.11.8/build2026-10-31-uno-wiki-art-1 includes3.11.7. Replaces rejected CSS-drawn UNO faces with cropped artwork from Wikimedia Commons UNO cards deck.svg by Dmitry Fomin (file page CC0, used by user Wikipedia reference). Local WebP atlas54unique faces:2240×1200/240066bytes,160×240 per slot. CSS class mappings for4colors×13values +Wild/+4, consistent landing/entry/hand/discard. Native semantic labels/disabled/card click behavior retained; CSS center/corners no longer render over image. No bitmap hotlinks or runtime fetch from Wikimedia. Original/reference/provenance outside public; docs/UNO-CARD-ART.md recordsauthor/source/license/changes. Community illustration is not a claim of official Mattel authorization/edition, enginehouse rules unchanged.

Preview http://127.0.0.1:3036/ /privateSQLite/session42637; isolated work/uno-wiki-art-patch/source. Source/build checks, master54face layout and1280px landing UNO reviewed; no active game/hand mapping/Wild gameplay/automated/mobile validation. Canonicalmain46321a1/cloud3.8.1/oldpreviews/live unchanged; no install/commit/push/deploy. Supersedes rejected3.11.5CSSappearance while includes otherpendingpatches; new release authorization required. Quota not rechecked. Proof outputs/uno-wiki-cards-preview.png.


## Pending3.11.7 — compact shared game header (31 October2026)

Local3.11.7/build2026-10-31-compact-game-header-1 includes3.11.6. Shared account bridge inserts profile link directly in .hubbar instead of a separate full-width top account strip for all10games. Single desktop row: back link left, small creator credit +profile right. At<=640px credit becomes left subcaption while profile spans rows; narrow names wrap within bounded profile. Native focus/links and account fetching/gating/name ownership remain unchanged. Non-game landing/account placement unchanged.

Preview http://127.0.0.1:3035/uno/ /privateSQLite/session68327; isolated work/compact-game-header-patch/source. Build/source checks;958px demo-authenticated UNO Dark/Light, Mahjong/Poker entry reviewed. No room/start/gameplay/automated/mobile/long-name verification. Canonicalmain46321a1/cloud3.8.1/oldpreviews/live unchanged; no canonical install/commit/push/deploy. Prior3.11.6included/superseded, new publication permission required. Quota not rechecked. Proof outputs/compact-game-header-preview.png.


## Pending3.11.6 — Faiz white profile avatar (31 October2026)

Local3.11.6/build2026-10-31-faiz-white-avatar-1 includes3.11.5. Existing admin-faiz cosmetic keeps its ID/adminOnly/ownerEmail/price/entitlements, updates display name to Faiz · Ivory Dragon and image to /avatar-admin-faiz-white.webp. New512×512WebP49286bytes, metadata stripped, imagegen reference white Faiz from joint leaderboard illustration. Existing black avatar source retained; black integrated brand emblem and black login portrait/account markup byte-identical to3.11.5. No account/session/inventory/database writes or new grants. Existing equipped admin-faiz resolves new art after authorized release; no production profile changed yet.

Isolated work/faiz-white-avatar-patch/source, preview http://127.0.0.1:3034/ /privateSQLite/session65866. Build/source checks and compressed art inspected; no real-account/catalog equip, room/gameplay/automated/mobile verification. Canonical staging main46321a1/cloud3.8.1/oldpreviews/live unchanged; not installed/committed/pushed/deployed. Prior3.11.5included/superseded; new release authorization required, quota not rechecked.


## Pending3.11.5 — classic UNO card appearance (31 October2026)

Local3.11.5/build2026-10-31-uno-classic-1 includes3.11.4. Shared lightweight public/uno-cards.css gives UNO props/entry/cards classic red-yellow-green-blue faces, white diagonal oval/border, colored central symbols and inverted corner indices; Wild black face with four-color oval. CSS-rendered approximation guided by Mattel UNO reference https://shop.mattel.com/collections/uno, not licensed official asset files or an official-edition claim. No new bitmap/payload image. Applied to hub props, UNO entry illustration and dynamic hand/discard markup. No rule/engine/account/storage changes; earlier house variants unchanged.

Preview http://127.0.0.1:3033/ /privateSQLite/session92141, isolated work/uno-classic-patch/source. Build/source checks; desktop1280px landing UNO card and958px authenticated demo UNO entry reviewed. No Start/room/gameplay/automated/mobile/active hand/Wild runtime verification. Canonical staging main46321a1/cloud3.8.1/old previews/live unchanged; no install/commit/push/deploy. Prior3.11.4included/superseded; new publication authorization needed. Quota not rechecked. Proof outputs/uno-classic-cards-preview.png.


## Pending3.11.4 — unified black-dragon club emblem (31 October2026)

Local3.11.4/build2026-10-31-unified-brand-1 includes3.11.3. Single transparent black-dragon/gold-club emblem replaces the two separate clover+portrait tiles in hub header/footer, account brand, leaderboard and creator bars. Generated with existing Faiz dragon reference;96×96WebP5680bytes with alpha, metadata stripped, master outside source. Decorative only: existing login portrait, actual avatars/admin grants, leaderboard two-dragon art remain unchanged. Brand marks use48px/44px/40px/28px contexts without frame/background.

Isolated work/unified-brand-patch/source, preview http://127.0.0.1:3032/ /privateSQLite/session24117. Build/source checks; desktop1280/958px landing Dark/Light and account login Light reviewed. No credential/account/room/gameplay/automated/mobile actions. Canonical staging main46321a1/cloud3.8.1/old previews/legacy live untouched; no install/commit/push/deploy. Prior3.11.3included/superseded; new release permission required, cloudquota not rechecked. Screenshot outputs/unified-dragon-logo-preview.png.


## Pending3.11.3 — leaderboard dragon appreciation art (31 October2026)

Local3.11.3/build2026-10-31-leaderboard-dragons-1 includes3.11.2. Dedicated Papan Juara hero replaces tiger with joint Hendy jade-green/Faiz pearlescent-white dragons, both giving thumbs up. White Faiz is specific to this illustration; black-dragon brand/login and actual reserved avatar/catalog rights stay unchanged. Built-in imagegen using existing jade/Faiz artwork references; final WebP480×320/35080bytes, metadata stripped; master excluded from source. Rounded3:2 contain frame keeps hands/faces visible, stacks below title on narrow CSS breakpoints.

Preview http://127.0.0.1:3031/leaderboard/ /privateSQLite/session73891, isolated work/leaderboard-dragons-patch/source. Build/source checks and desktop1280px Dark/Light reviewed; no mobile/gameplay/automated tests or account/room actions. Canonical staging main46321a1/cloud3.8.1/older previews/legacy live unchanged; not installed/committed/pushed/deployed. Prior3.11.2included/superseded, new release authorization required; cloudquota recovery not rechecked. Proof outputs/leaderboard-dragons-preview.png.


## Pending 3.11.2 — responsive UI containment (31 October 2026)

Local candidate **3.11.2 / `2026-10-31-ui-layout-1`** includes3.11.1 and all prior game/art/leaderboard patches. Flexible headers/navigation, ranking filter rows and bounded table columns; consistent ranking panel insets; shrinking account/login/settings grids; sidebar brand now fits its rail; shared game columns, controls and character entry art remain within their containers. Help icons in large headings follow the last line rather than floating midway alongside a tall title. No blanket document overflow hiding, game/auth/storage/settlement changes or new images.

Isolated work/ui-layout-patch/source, preview **http://127.0.0.1:3030/**, private SQLite/session33075. Canonical staging main46321a1, cloud3.8.1, legacy live and previous previews unchanged. Not installed/committed/pushed/deployed; separate new publication authorization required. Prior pending3.11.1 is included/superseded. Cloudquota recovery not rechecked.

Manual browser review: authenticated demo account/profile, empty leaderboard Dark/Light, all10game entry pages at958px, unstarted private Mahjong lobby +expanded cheat sheet, landing/card rows and account sidebar at1280px. Document width equals viewport on measured pages. No game started, no production room actions. Build and changed-JS syntax checked. No automated/gameplay/populated leaderboard/mobile viewport/active table/admin interaction validation; do not claim every UI/state or game bug is proven absent. See docs/UI-LAYOUT.md and private PATCH-MANIFEST.json.


## Pending 3.11.1 — contained card art and Faiz dragon brand (31 October 2026)

Local candidate **3.11.1 / `2026-10-31-dragon-brand-1`** includes leaderboard3.11.0/all previous game/art patches. All10landing illustrations now use bounded flex/grid game-prop sets with positive insets, no oversized/negative-positioned card stacks; character portraits use contain. Existing Faiz black dragon decorates the clover/Meja Kita brand on hub/footer/account/leaderboard and shared game creator bars. Only the login/signup hero replaces Table Buddy with the black dragon; actual starter avatar/catalog/admin entitlements/profile ownership stay unchanged. Existing green-dragon/cat hero scene unchanged.

Reuses existing artwork only; no imagegen/new master. Brand96px2700bytes; login384px20660bytes. Cast32KiB guard retained; new brand8KiB guard. Login CSS slow6px float/gold halo, visible pause/resume, prefers-reduced-motion disables animation. Dark/Light desktop cards/brand/login/signup and pause/resume inspected. No credentials submitted, account/room actions, automated/gameplay/mobile or OS reduced-motion verification. Syntax/build/static assets checked separately; previous game/leaderboard validation limits remain. See docs/DRAGON-BRAND.md.

Isolated work/dragon-brand-patch/source, preview3029/privateSQLite/session18274. Canonical staging main46321a1, cloud3.8.1, old previews and legacy live unchanged; no install/commit/push/deploy. Prior3.11.0pending is included/superseded. New authorization required before safe canonical reconciliation/publication. Cloudquota recovery not rechecked.


## Pending 3.11.0 — account/game leaderboards (31 October 2026)

Local candidate **3.11.0 / `2026-10-31-leaderboard-1`** includes ten games +character-art3.10.1. Authenticated global/per-game leaderboard defaults to net IDR, optional level/points, top50 +own summary; hub link/panel, dedicated `/leaderboard/`, collapsed shared control before starting every game. No polling; client/server30s cache, indexed bounded results. Active state hides game-entry panel. Users' email/role/session/room/other hands are not returned.

AccountStore adds `game_stats` and permanent `game_result_receipts` under the same actor/binding/migration identity. Atomic result receipt/stats/XP transaction and existing checkpoint/outbox flow. All10settlement hooks supply server-owned points/chips ×table rate; bots/spectators/buy-ins/admin corrections excluded as ranked entrants/deltas, but human games against bots/custom rules count. Monetary ranks are informal net simulation results, not cash/account coins; rates/units differ by table. Completed short rounds count stats, existing60s/dailyXP rules unchanged. One-time existing reward backfill retains per-game XP/outcomes only, measuredRounds0; never invent historical money/points. Global level uses lifetime account XP, game level earned game XP. See docs/LEADERBOARD.md.

Separate source/preview3028/privateSQLite. Canonical staging main46321a1, cloud3.8.1, legacy live and older previews unchanged; no canonical installation, commit/push/deploy. New authorization required for publication. Source/build +authenticated empty-list reads and Mahjong pre-game control inspected; no automated/gameplay/settlement/retry/ranking-tie/backfill-with-history/mobile tests. Empty demo DB is not a populated ranking proof. Cloud quota recovery not rechecked; previous gameplay limits remain.


## Pending 3.10.1 — character illustrations (31 October 2026)

Local candidate **3.10.1 / `2026-10-31-character-art-1`** includes ten-game3.10.0 and all earlier pending UNO/Ludo work. New warm game-night hero generated with existing jade dragon and starter cat references; eleven384px WebP cast derivatives decorate all ten landing cards, closing section and UNO/Ludo/Monopoli/Reversi entry screens. Original avatar/inventory IDs and admin entitlements remain unchanged. Mahjong featured row and alphabetical three-column layout retained. Hero1120×630/100236bytes; eleven cast images175476bytes total, largest22380bytes. Lazy card images, explicit dimensions, reduced-motion support; cast build guard32KiB. Prompt/provenance and usage: docs/CHARACTER-ART.md (CHARACTER-ART.md from docs).

Isolated copy/preview3027; canonical staging/main46321a1, previews3024/3025/3026, cloud3.8.1 and legacy live unchanged. Not committed/pushed/deployed/installed into canonical. A later release must reconcile the reviewed private manifest safely into staging, preserve newer work/runtime, and obtain current push/deploy authorization.3.10.0pending notes are included/superseded. Source syntax/build/image budgets and desktop Dark/Light landing/cards, Monopoli entry reviewed; no new automated/gameplay/mobile tests, room actions or production changes. Earlier game-validation gaps remain. Cloudquota not rechecked.


## Pending 3.10.0 — ten games and featured Mahjong (31 October 2026)

Local candidate **3.10.0 / `2026-10-31-ten-games-1`** includes the previous UNO/Ludo candidate3.9.0 plus Monopoli Nusantara2–6 and Reversi2. Landing: Mahjong full width, then Blackjack, Capsa, Catur, Domino, Ludo, Monopoli, Poker, Reversi, UNO in a three-column desktop grid. Tablet/phone reduce columns. Both new games reuse accounts, shared rooms, invite/dissolve, disconnect grace, bot levels/delay, money recap and right sidebar. Monopoli is an explicitly documented Nusantara house profile, not a complete official-edition claim. Reversi uses standard8×8, optional house6×6 QuickPlay.

Prepared in an isolated authoring copy, preview3026/privateSQLite; canonical staging/main46321a1, older previews3024/3025, cloud3.8.1 and legacy live remain untouched. Earlier3.9.0 pending notes are included/superseded, not a separate release. Before a later release, reconcile this candidate against canonical staging using the reviewed private manifest, preserve newer changes/runtime, and obtain current Git/cloud authorization. See docs/TEN-GAMES.md (TEN-GAMES.md from docs). No commit, push or deployment authorized/performed.

Evidence: source syntax and cloud asset build; landing and unstarted Monopoli/Reversi lobbies inspected. No automated/gameplay/complete-match/settlement/reward/recovery/race/security tests or phone viewport validation. Do not infer full correctness from lobby rendering. Cloud quota recovery has not been rechecked.


## Pending3.9.0 — UNO and Ludo (31 October2026)

User authorized building two games locally, not Git/cloud publication. Candidate3.9.0/build2026-10-31-uno-ludo-1 is prepared in a separate operator authoring copy, served locally on3025 with isolated SQLite. Original staging/main46321a1/cloud3.8.1/preview3024 remain unchanged. Adds UNO2–8 and Ludo2–4, own authoritative engines +shared party factory, bot levels/3s delay/15s grace, accounts/XP/admin point support, chat/emote/right sidebar, invite/dissolve, QuickPlay and creator Faiz T. Rules/verification boundaries in docs/UNO-LUDO.md (or UNO-LUDO.md from docs). UNO automatic call/no challenge and Ludo no blockade are explicit house variants, not a full official edition claim.

Source syntax/build and unstarted private lobby/UI inspection only; no automated/gameplay/mobile/settlement/reward/recovery/security tests. Candidate must be installed into canonical staging from the reviewed manifest before a later authorized Git/cloud release; never overwrite newer staging/runtime or stop3024without approval. See private work/uno-ludo-patch/. Future push/deploy requires a new request.


## Installed3.8.1 — cosmetics and image budget (31 October 2026)

User explicitly requested push/deploy and Obsidian update. Cloud now **3.8.1 / `2026-10-31-image-budget-1`**, deployment `5b2212d2-7e44-44a0-ac8b-a5f7d882afae`, https://srac-gaming.faiz-triputra.workers.dev/ . Includes3.8.0:20paid cosmetics (12skins/8frames),7free skins,7admin skins (Faiz black dragon, Hendy existing green dragon,5generic admin choices), verified-role/owner entitlement and audited one-time default grant. All34images now512px WebP,61.68MB→1.49MB (97.59%smaller); stable item IDs, preserved alpha,100KiB avatar/frame build guard. Same SQLite actor/bindings/migrations/secrets and existing game data; no legacy live change.

Syntax/whitespace/build/dry-run passed:96assets,344.06KiB bundle/gzip95.41KiB. Public health/newbuild and ten entry routes200; all34WebP+2changedJS files exactly match source. **Availability incident:** anonymous `/api/account/me` returns500/1101. Read-only Worker tail identifies `Exceeded allowed rows read in Durable Objects free tier.` Account DB access is blocked by the account-wide free daily read quota; do not call this a validated healthy login or erase/migrate storage/upgrade billing to bypass it. Daily limits reset00:00UTC/07:00WIB per Cloudflare pricing docs. Exact consumption/source of quota usage and post-reset recovery were not verified. Static assets remain available. No production account/room actions, new automated/gameplay tests or real purchase/equip verification. Prior private preview limits remain in preparation history below. Git publication is authorized by this request; confirm remote equality before claiming push complete. No pending source deployment; quota recovery remains an external availability condition. Future push/deploy needs a new request.


## Pending3.8.1 — compressed images (31 October 2026)

Staging **3.8.1 / `2026-10-31-image-budget-1`** includes pending3.8.0cosmetics/admin avatars. All34old/new PNGs replaced by512px WebP,61,681,748→1,488,808bytes (97.59% less); largest77.10KiB; frame alpha preserved. Stable catalog/inventory IDs, WebP references/client allowlists/native MIME. Originals backed up outside deployable source. Build rejects avatar/frame assets above100KiB and other raster above300KiB; future agents must optimize before adding images. See [image budget](IMAGE-ASSETS.md). Syntax/whitespace, catalog file presence, decoded metadata and build passed; sample dragon/frame visually inspected. No new automated/gameplay or browser review for this follow-up. Running stays3.7.0; no commit/push/deploy permission or public data change. Earlier pending3.8.0notes describe included work, not a separate release.


## Pending3.8.0 — expanded cosmetics and admin avatars (31 October 2026)

Prepared in staging only: **3.8.0 / `2026-10-31-cosmetics-admin-1`**. Running remains **3.7.0 / `2026-10-31-password-controls-1`**, deployment `5110c83f-544a-475d-8ce5-8fd37ce122a4`; no commit/push/deploy authorized or performed for this patch. Twenty paid items total (12 skins +8 frames), seven ordinary free skins and seven reserved admin skins. Faiz owns the black dragon; Hendy exclusively reuses the existing green dragon; five additional administrator choices are shared among verified admins. Starter inventory ID `jade` remains compatible but renders a new Table Buddy cat, reserving the original green artwork for Hendy.

Server-owned eligibility rejects purchases of admin skins and restricts equip/admin inventory edits to the target's entitlement. Verified-role session reads grant entitled admin skins transactionally and auto-equip a default once, with `avatar.admin_granted` audit; subsequent user choices persist. Revoked admins render the starter and cannot equip reserved skins. Reserved inventory remains entitlement-managed; missing entitled admin items are restored on the next authenticated request. No schema, role, identity, coin/XP, game rules, actor/binding or legacy live changes. Public catalog strips owner-email metadata but retains art IDs so game clients can render other players. Seven frame overlays use the shared avatar renderer. See [asset prompts](COSMETICS-EXPANSION.md).

Syntax/whitespace and cloud build passed. Private isolated Worker/SQLite preview showed ordinary shop20items with no admin tab, free/paid/category filters, admin automatic five-skin grant/default and admin collection. Shop Light/Dark and representative artwork reviewed on desktop. No new automated/gameplay tests, mobile review, real named-admin sign-in or production account/room changes. Cosmetic purchase confirmation was inspected but transaction submission was rejected by automatic approval review; it was cancelled, so new-item purchase/equip and frame-overlay behavior are not runtime-verified. Preview stopped and generated-only gallery excluded from final build. Git publication and cloud deployment remain pending separate authorization.


## Installed3.7.0 — flexible passwords and audited admin reset (31 October 2026)

User explicitly requested one-character passwords, confirmation/eye controls, admin password reset recorded in logs, plus push/deploy/Obsidian. Running **3.7.0 / `2026-10-31-password-controls-1`**, deployment `5110c83f-544a-475d-8ce5-8fd37ce122a4`, https://srac-gaming.faiz-triputra.workers.dev/ . Passwords accept1–128characters without strength rules (nonempty and resource bound); salted PBKDF2/100000iterations and throttles retained. Signup, self-change and admin-reset UI include confirmation/visibility controls; login/current-password also has an eye. Existing signup/self-change API clients may omit confirmation; supplied mismatch is rejected. Admin reset requires matching confirmation, exact origin, verified/recent admin and current target revision. Password/revision update, old-session revocation and actor/recipient audits commit atomically; socket notification targets revoked sessions only, preserving a later new login. Google identity/roles remain unchanged.

Eleven targeted isolated Worker/SQLite checks passed:1character signup/login, mismatched confirmation, non-admin denial, successful reset, revoked old session, rejected old password, new password login, stale retry409, actor/recipient log shape without credentials, private public-user shape. Browser signup/reset/eye controls inspected in Light/Dark; no real password typed through browser or production account changed. No full regression/gameplay run and no exhaustive race/security claim. Syntax/whitespace/build/dry-run passed,72assets,337.55KiB/gzip94.17KiB. Public new health/ten routes200,2changed assets match; Googleconfiguredtrue/previewfalse; anonymous reset401. Preview stopped. Same SQLite actors/bindings/migrations/secrets and existing accounts/game data; legacy live untouched. Git publication is authorized by this request and verified in operator record/Git history. No pending runtime deployment; future push/deploy needs a fresh request.

## Installed3.6.0 — compact UI and aligned help (31 October 2026)

User explicitly requested “push, deploy, pastiin obsidian juga up to date”. **3.6.0 / `2026-10-31-compact-help-1`** is installed at https://srac-gaming.faiz-triputra.workers.dev/ , deployment `056c6483-a02a-4e19-b857-9e49a070e884`. Source commit `6f5b0de0daff4109e7ee5215754ca745c38a0014` was pushed through GitHub Desktop personal izanagiwarrior and independently matched remote main. This release includes concise landing/account/six-game copy, optional shared help with aligned28px icons/8px gaps, preserved fold preferences, and responsive header/modal-help fixes. Actual game odds, errors, turn/timer and amounts remain visible.

Build/dry-run passed:72prepared assets,335.59KiB/gzip93.71KiB. Private representative390px six-game entry/lobby and account/landing review, Mahjong Customize, Poker390/768/1280, Dark/Light, checkbox isolation and modal autofocus/help were checked. Postdeploy health/new build and ten routes200;20changed public assets exactly match, Google configured=true and preview=false. Public landing inspected without account/room/gameplay actions. No new automated/gameplay tests; prior200tests are historical evidence. No database migration/reset, secret/audience/policy change, actor/binding change, legacy live update or preview-data upload. Generated review fixture/config excluded and production CSP restored before release. No pending runtime deployment; final release-document publication is identified by subsequent Git history and operator record. Future push/deploy still needs a fresh request.

## Preparation history3.6.0 — compact explanations (31 October 2026)

User requests less on-screen prose and optional `?` explanations. Candidate **3.6.0 / `2026-10-31-compact-help-1`** is prepared in staging only. Shared help supports pointer hover, keyboard focus/Enter/Space/Escape and tap/outside dismissal; viewport-clamped themed popovers retain original dynamic explanation nodes/IDs. Landing/account and six game entries/settings use concise copy or optional help. Cheat sheets start collapsed only when no stored fold preference exists. Poker lobby warm-up/example odds removed; actual in-game odds retained. Core turn/timer, error, balance and confirmation information stays visible.

Running remains **3.5.1 / `2026-10-31-office-login-note-1`**, deployment `23a92239-e344-462b-a2de-8d5b0818b358`. No commit, push, public deploy/restart or production room actions authorized/performed. No rules, DB, auth policy or runtime identity changes. Private local preview inspected landing/account, all six entries and Mahjong/Poker/Capsa/Blackjack lobbies without starting games. Click/focus/Escape, checkbox-help isolation, cheat open/close and Light/Dark reviewed; hover path implemented but not directly exercised by the native browser API. The initial review excluded mobile; the follow-up below adds390px layout checks. No full gameplay or automated regression run for this candidate. Source syntax, whitespace and cloud asset build checked. Preview uses isolated local data and ACCOUNT_PREVIEW only; never publish that preview flag. [Compact UI conventions](GAME-CONVENTIONS.md).

Last reconciled: **31 October 2026**. Read root [AGENTS.md](../AGENTS.md) first. This document records context and procedures; it does not authorize push, deployment, interruption, gameplay tests or data migration. Dates below are historical evidence. Recheck actual source and service before acting.

### UI alignment review — 31 October 2026

Follow-up requests all question-mark help aligned with its label and consistent sizing. Pending3.6.0 now uses one shared non-wrapping flex row, a shrinking/wrapping text column,28px fixed icon and8px gap. Specificity prevents native game styles overriding it. Heading, legend, plain labels, standalone notes and account copy share the same row treatment. Landing mobile header grows without account-pill collision. Explicit help in the login dialog is placed in the top layer and primary login receives initial focus.

Manual private preview covered landing/account and six game entry/lobby states at390px width, Mahjong Customize long checkbox labels, Poker Customize at390/768/1280, and Dark/Light examples. Local synthetic rooms were never started; no real/public player actions. This is representative UI review, not an exhaustive guarantee for every game state, browser, zoom or device. No automated/gameplay tests run. Temporary responsive fixture/CSP adjustment existed only in generated local preview output; final build restores production frame-ancestors none and excludes preview fixture/config. Running remains3.5.1; no commit/push/deploy.

## Installed release3.5.1 — office Google login explanation

User accepted the existing Internal Google audience and explicitly requested “notes … di webnya … internal game … email kantor, deploy & push”. Current **3.5.1 / `2026-10-31-office-login-note-1`**, deployment `23a92239-e344-462b-a2de-8d5b0818b358`, https://srac-gaming.faiz-triputra.workers.dev/ . Landing, sign-in/sign-up card and shared six-game account gate explain the office-community context: Google sign-in requires an organization-authorized office account such as @shopee.com; personal Gmail cannot use that Google button. Email/password signup with personal email remains available. This is explanatory UI, not a new domain filter or an official corporate service claim. Existing Google audience/shared branding, authentication policy, secrets, database actors/bindings/migrations, game rules, accounts/balances and legacy live are unchanged.

Syntax/whitespace/build/dry-run passed,70assets,335.60KiB/gzip93.71KiB. Private empty account/landing preview inspected in Dark/Light without signup/login/gameplay; preview stopped. Public health/new build and nine entries200; three changed public files exactly match; Google configured true, preview false,9skins retained. No public room actions or new automated/gameplay tests. The200passing regression checks remain evidence for the unchanged native game/account logic, not a new test run. Git publication of this exact change is authorized; verify the remote before reporting it complete. No pending runtime deploy. Future changes need fresh authorization.

## Previously installed release3.5.0 — 31 October 2026

User explicitly authorized “deploy push semua”. Running **3.5.0 / `2026-10-31-disconnect-grace-1`**, deployment `1add96c5-7189-49fe-9cbe-0be27cb9960a`, at https://srac-gaming.faiz-triputra.workers.dev/ . Includes all3.2.1/3.3.0/3.4.0/3.5.0pending source: account-based automatic device takeover, no manual recovery files, six free human portraits (9skins total), and six-game15second disconnect grace/native temporary AI with countdown/reconnect animation. Same AccountStore/GamingHub actors, binding/migrations, secrets and existing data; legacy Node live untouched. No production room/game actions.

Manifest37files matched the prepared patch before release,21JS syntax/whitespace and dry-run passed; bundle335.60KiB/gzip93.71KiB,70public assets. Postdeploy health/newbuild/root/account/admin/6entries200,19asset hashes match, anonymous admin and6game sockets401, Google configured true/preview false; catalog9skins and all6newfree portraits. Manual local evidence: avatar free-claim/equip with coins unchanged, Dark/Light desktop; separate connection UI fixture15→bot→reconnect. Subsequent isolated validation authorized by “lanjut”:200tests pass/0fail; native six-game grace/reconnect/full-round conservation, Mahjong claims, Chess clocks, Capsa timeout guard, automatic account client and real-time Worker/SQLite Chess grace. Six-game active cold recovery, paused-action rejection, host continuation and persistent dissolved-code rejection also pass. Additional private phase checks cover Mahjong opening/pending claims/pre-claim undo and Blackjack dealt wagers/dealer/settled restart without duplicate payment.23native cases passed10additional runs. Only a test VM fixture needed an inert setInterval; no runtime fix was needed. See [validation scope and limits](CONNECTION-VALIDATION.md). Public hosting/rooms/data remain untouched during validation. User subsequently requested “selesaikan” to complete the pending Git publication; this follow-up contains tests/docs only and does not authorize runtime deployment. Read docs/CONNECTIONS.md (or CONNECTIONS.md from docs) for behavior/limits.

Release3.5.0was already published as862bf18. No runtime patch remains pending. Validation tests/docs were committed and pushed asadb90f7bd2bfda8c9b7ac91df45876300548402c; remote main matched and the working tree was clean before this final documentation audit. No runtime deployment is needed. Future changes still require separate publication/deployment authorization. Sections below record historical preparation and earlier releases.

## Preparation history: disconnect grace3.5.0 — 31 October 2026

User requests a visible Disconnect countdown15seconds before temporary bot control and animated reconnect feedback across all games. Candidate3.5.0/build`2026-10-31-disconnect-grace-1` includes pending3.4.0/3.3.0/3.2.1. Shared factory-scoped connection lifecycle, native AI after grace, reconnect cancellation, Mahjong pending-claim grace, Chess/Domino temporary AI, Poker/Blackjack automation and Capsa deadline guard; account/seat/balance identity remains human. Shared public presence metadata drives text countdown, pulse/toast transitions, bot/connected badges and reduced-motion support. No schema/actor/data changes; cold recovery still paused. [Behavior/limits](CONNECTIONS.md). Source syntax/whitespace/cloud build passed. Isolated UI fixture only:15→bot→reconnect reviewed; no automated/gameplay tests or native six-game runtime/clock/claim-race verification. Cloud remains3.2.0; no commit/push/deploy authorized or performed.

## Preparation history: avatar options3.4.0 — 31 October 2026

User requests more profile choices (women, men, etc.). Intermediate candidate3.4.0/build`2026-10-31-avatar-options-1` (now included in3.5.0) includes pending3.3.0automatic handoff and3.2.1manual recovery UI removal. Six original AI-generated adult human portraits (Sari/Nadia/Luna/Arka/Bima/Rio), all free, bring skin catalog to9plus the existing accessory. Studio shows free unowned skins, human/character/accessory filters, and Pakai gratis claims through the existing server-owned0coin purchase then equips. Paid items, existing inventory/equipment/account balances and database schema remain unchanged; no runtime AI generator or costs. See docs/AVATAR-ASSETS.md for prompts. Current3.2.0cloud unchanged, no commit/push/deploy. Manual disposable-account preview3028: human filter shows6portraits; Pakai gratis equipped Nadia in SQLite-backed local profile and coins remained480. Dark/Light desktop inspected. Preview stopped and tab closed. Syntax/whitespace/cloud build passed; no automated/gameplay or mobile checks.

## Preparation history: automatic account handoff3.3.0 — 31 October 2026

User wants Roblox-style newest game connection to take control automatically, with the old device disconnected and able to take back only through a human reconnect. Historical intermediate candidate3.3.0/build`2026-10-31-account-auto-handoff-1` (now included in3.4.0) includes pending3.2.1manual file UI removal. Cloud shared client automatically claims its authenticated DB seat using the existing socket-bound challenge/token checkpoint; redirects to the owned game when necessary. No normal takeover popup; stale/raced claims stop with an explicit retry, never an automatic claim loop. Old-controller notice includes Main di perangkat ini (page reload). Server account verification, save-before-output, handoff tokens/cards/balances/host, logout semantics and native no-auto-reconnect remain. This changes game control, not browser-wide sign-in or account DB ownership. Running cloud3.2.0 remains unchanged. No commit/push/deploy authorized; syntax/build only, no automated/gameplay/runtime UI checks yet for this candidate.

## Previous account safety3.2.0 — 31 October 2026

User explicitly requests fixing account/device issues, broader safety checks, personal Git push and direct cloud deployment. Deployed3.2.0/build`2026-10-31-account-safety-1` includes one occupied room per account, account-based recovery/confirmed handoff/token rotation, stale-browser cleanup, session revocation and limits, race/input/redirect guards. AccountStore and GamingHub SQLite actor/bindings/migrations preserved; only additive OAuth return column. [Safety architecture/checks](ACCOUNT-SAFETY.md):157tests pass, including full Worker/SQLite two-device and in-progress fixtures in all six games, plus private UI390px Dark/Light. No promise of exhaustive security/settlement/quota correctness. Running cloud is3.2.0, deployment `51b2c347-2665-4510-88ea-41670e608843`, at https://srac-gaming.faiz-triputra.workers.dev/ . Public health matches the build; root/account/admin/six entries200,12asset hashes match, anonymous admin and six game sockets401, Google configured true/preview false. No production room actions or legacy live changes. Personal Git publication is separately authorized; confirm the remote before reporting push complete. Future releases require a new request.

## Historical release3.1.1 — 31 October 2026

**Previously running3.1.1 / `2026-10-31-account-socket-guard-1`**, deployment `59095e81-d0a7-4a75-879d-7fa332eecaf4`, at https://srac-gaming.faiz-triputra.workers.dev/ . Includes the full3.1.0account/admin release below and rejects anonymous game WebSockets before factory/timer initialization. Automatic approval review required fresh deployment confirmation after3.1.0; user explicitly answered “Ya, deploy3.1.1 sekarang”. Deployment/checks succeeded; no pending runtime patch remains. Git publication is authorized but must be confirmed independently against the remote.

**128tests pass/0fail**, including six anonymous fetch-handler paths proving no factory startup. Public health matches3.1.1; landing/account/admin/six entries200;8account assets match source; anonymous admin and6game WebSockets401; Google configured true/preview false. Real public Google sign-in/Admin dashboard succeeded on3.1.0and the same session/configuration is retained. An authenticated Blackjack empty entry connected without room creation or gameplay. Full six-game settlements/races/quotas remain unproven; see ACCOUNT-VALIDATION.md. Google project remains Internal with shared branding, not modified. No secret/player data in Git or preview data upload, no legacy live changes. Earlier entries are historical.

## Previous release3.1.0 — 31 October 2026

**Running3.1.0 / `2026-10-31-admin-controls-1`** on https://srac-gaming.faiz-triputra.workers.dev/ . User instruction “selesaiin semua” explicitly followed the listed remaining validation, Git publication, Google production secrets and deployment work. Deployment succeeded `71c2f303-58e7-4317-b6ea-25741ce1ebc1`. Google secrets were uploaded with the same version using `wrangler deploy --secrets-file .dev.vars`; never print/commit that ignored0600file. ACCOUNT_PREVIEW is absent in production and public demo login returns404. Existing GamingHub/office-hub-v1/v1 data is retained; AccountStore/accounts-v1/v2-accounts is additive. Legacy Node live and local preview data were not migrated.

Public health reports the new build; landing, account/admin and six game entries return200. Anonymous admin overview401. Real Google login completed on the public callback as faiz.triputra@shopee.com; UI shows verified email/Admin and the live dashboard. Bootstrap Hendy activates when that user signs in with verified Google. No public room/game/result/XP was fabricated. **127tests pass**, including isolated SQLite auth/admin/purchase/reward cases, Google signed-token checks and six-game balance fixtures. [Validation and remaining limits](ACCOUNT-VALIDATION.md): full native six-game rewards/settlement/recovery races, failure injection and quota behavior are not exhaustively proven.

Google project SRAC-AI is owner-approved despite its office account. Shared branding remains Smart Drive Image Tool; audience remains Internal. Neither shared setting nor the previous OAuth client was changed. No Google Drive/Gmail scopes, paid plan or billing change. Account/possession data lives in Cloudflare SQLite. Email/password signup remains unverified and cannot activate admin grants. Account gating is now live for future game connections. Further patch/push/deploy needs a new request. Git publication is authorized for this release; verify HEAD against origin/main independently before reporting push complete. Earlier pending notes below describe preparation history, not current deployment.

## Historical preparation: admin controls — 31 October 2026

Current staging3.1.0/build`2026-10-31-admin-controls-1` includes the account candidate below plus [admin ownership/balance controls](ADMIN-CONTROLS.md). It is not deployed/pushed; cloud last confirmed2.3.1. Use versioned account mutation, preserve SQL receipts/audit, and apply native chip/point corrections only at safe boundaries with funding/transfer accounting. Do not inject an unbalanced point win. Preview evidence is limited to account possession edits and one empty Blackjack funding/broadcast; not full six-game/security/recovery verification. Google client still needs setup. No permission for Git/cloud publication carries over.

## Previous pending accounts candidate3.0.0 — superseded

Staging3.0.0/build`2026-10-31-accounts-1`, not installed/pushed; cloud last confirmed2.3.1. Read [account hosting and Google setup](ACCOUNTS.md) before changing credentials or deploying. Separate SQLite AccountStore/additive migration, no D1 provisioning required; keep game identities/data unchanged. Google OAuth is not configured. Only loopback preview may use demo login. Full provider/security/multiplayer reward verification remains pending; empty dashboard values are real absence of recorded rounds, not failure or seeded production activity. Never infer authorization from the source version. Public activation requires configured Google login and explicit review of mandatory account gating and disconnect impact.

## Installed alignment correction2.3.1

Local2.3.1 / `2026-10-23-toolbar-alignment-1` corrects the landing toolbar width and summary/theme baseline; shared grid keeps invitation controls in a separate row. Cloud2.3.1 was installed after the user explicitly requested “deploy push”. Health/root/six entries200, three CSS asset hashes and six empty WSS passed. Public desktop alignment matched the preview with no console errors. No runtime candidate remains pending; personal Git publication of this source/docs is authorized and must be confirmed from the remote. Desktop/mobile390px Dark/Light and expanded preferences were visually reviewed on a separate loopback origin, plus empty Blackjack room toolbar geometry; no gameplay/automated tests. Syntax/build/whitespace passed, preview stopped. Preserve all room data and require fresh publication authorization.

## Historical release2.3.0

**2.3.0 / 2026-10-23-lobby-consistency-1** is installed on Cloudflare following the user’s explicit “push dan deploy”. Same Worker/SQLite identities, room data and Free plan preserved. Health/root/six entries200, six empty WSSconnected and12changed assets matched source; no production room actions. No runtime installation is pending. Personal Git publication of the same source/docs is authorized; verify the remote commit before claiming push success. This release includes the previously documented2.2.1session-refresh draft. Future releases need new authorization.

Room invite/code/leave shortcuts are always visible, preferences fold separately. Common lobby controls are ordered duration → money → simple choices → Customize. Real Mahjong presets remain server-owned; other complex lobbies keep their existing defaults/values and place chip/blind/rule details inside Customize. Simple Catur/Domino/Blackjack settings move from the sidebar to above the board; shared sidebar order remains Chat/Cheat/Recap/Log. No accounting/rules/save migration, namespace/identity change or cloud operation.

Evidence: syntax/build/whitespace, six isolated empty lobby previews, copy feedback, Customize persistence after an acknowledged Poker setting, Dark/Light/390px Catur control layout. No Start, gameplay or automated tests. Prior session draft timeout and recovery races are not verified by this authoring check. No claim of bug-free full gameplay. See root AGENTS and [layout conventions](GAME-CONVENTIONS.md).

## 1. Previous2.2.0 handoff (historical)

Installed **2.2.0 / 2026-10-23-mahjong-presets-hu-1**, Mahjong v12. Cloud deployment and public checks succeeded on23October2026. No runtime candidate is pending. Personal Git publication of this same source/docs is authorized; verify actual remote before reporting push success. Public health/root/six entries200, six empty WSSconnected, five changed Mahjong asset hashes match source. Syntax/build, isolated empty lobby preset interactions and Hu visual/skip/reduced-motion fixture reviewed; no production room actions or full matches. Preview stopped. Recheck /health and remote for later work.

New lobby presents Easy (default), Normal, Hard, Customize; duration and Rp remain outside the advanced settings. Server owns preset application and pre-start locking. Easy/Normal permit0fan Hu;0fan=0points,1/2fan=8/16discardpoints (house variation),3–10followHKMA. Hard uses HKMA Hong Kong minimum3fan, **not MCR Chinese Official minimum8points**. See [Mahjong README](../games/mahjong/README.md) for exact defaults and compatibility.

Hu animation is local presentation before results, with skip/reduced motion, bounded particles, literal winner text and transient cleanup. No payout is delayed or repeated. Existing room rules/money are preserved: missing preset maps to Customize; old casual rooms retain0fan=4unless explicitly changed in lobby. No production-room actions or gameplay/automated tests are authorized merely for release checks; old106-test evidence covers2.0.1.

Cloud remains https://srac-gaming.faiz-triputra.workers.dev/ ; service srac-gaming, class GamingHub, binding GAMING_HUB, actor office-hub-v1, SQLite migration v1. Keep all identities/data stable. No Node save upload, tunnel, plan or credential change. Owner staging is development/Git; sibling live remains offline legacy1.8.0 and is not updated by a cloud release. No automatic Git deploy.

## 2. First ten minutes for a new agent

1. Read applicable parent/repo instructions, this guide and the repository skill. Parent historical notes may still describe the old tunnel; the dated cloud handoff records the later completed migration. Preserve all safety/permission requirements.
2. Inspect working directory, branch, status, diff and remote. Identify existing edits before adding yours. Do not assume a dirty tree is disposable or already published.
3. Read package.json, server.js build ID and wrangler.jsonc. Compare public `/health` when current service status matters. Source version, Git commit and cloud deployment are different facts.
4. Identify the user's current request and its authorization boundary. Default work happens in staging; leave cloud/legacy live running as found.
5. Find relevant shared components, native game factory and game README before implementation. Ask only for missing decisions that materially block work.
6. Keep a private baseline/backup of touched source, changed-file manifest and verification notes outside deployable assets. Never copy player data into source.
7. Prepare isolated local previews only when useful, on an unused loopback port and a separate private data store; never reuse an active player's room/tab or live DATA_DIR.
8. Finish the candidate, review source/diff and report evidence and limits. Tests/gameplay need a user request; do not run them merely because scripts exist.
9. For release, show exact candidate and session impact; get current explicit approval if not already given. Git and hosting approval remain separate.
10. Update the handoff/status table and private operation record. Leave no claim of success for a failed or only attempted push/deploy.

## 3. Code map and boundaries

| Area | Responsibility |
| --- | --- |
| `server.js`, `public/index.html`, `public/hub.js` | Native Node router, hub build/health, landing and room directory; no landing nickname gate |
| `games/{capsa,mahjong,poker,chess,domino,blackjack}/server.js` | Six native game factories: legality, private views, scoring, bots and phases. Chess public path is `/catur/` |
| `games/shared/room-service.js` | Shared lifecycle, seats/spectators, locks, persistence, paused recovery, rotation and dissolve reservations |
| `games/shared/table-settings.js` | Money/difficulty validation and ledger helpers |
| `public/game-tools.js`, `public/hub-game.css` | Shared sidebar, chat/emote feedback, recap/CSV, credits and layout; Capsa retains compatible native panels |
| `public/room-client.js`, `public/room-ui.css` | Reconnect/session-choice, room controls, panel folds and preferences |
| `public/theme.js`, `public/theme.css` | Dark default independent of system theme; optional shared browser Light preference |
| `games/mahjong/hong-kong.js`, Mahjong README | HK scoring/rule helper and exact supported rules/limits |
| `cloudflare/worker.js` | Routes, six-factory cloud lifecycle, Durable Object WebSocket callbacks and checkpoint-before-output |
| `cloudflare/storage.js`, `cloudflare/codec.cjs` | Private transactional chunked SQLite snapshots and reference-preserving graph codec |
| `cloudflare/compat/` | Cloud-only HTTP/WS/fs/V8/OS/timer adapters; ordinary Node keeps original modules |
| `scripts/build-cloudflare.mjs`, `wrangler.jsonc` | Allowlisted assets, bundle, cloud identity/bindings/migrations; generated output lives in ignored `dist/cloudflare/` |

Native Node uses one HTTP/WS port. Cloud uses one public origin, static Assets and a single small-hub Durable Object; it opens no laptop port. Public routes remain `/capsa/`, `/mahjong/`, `/poker/`, `/catur/`, `/domino/`, `/blackjack/`, each with its own `/ws` and room namespace. Health is `/health`, room directory `/api/lobby`.

Cloud guardrails: **64 sockets, 24 retained rooms total, 2 MiB private snapshot per game**. These are application guards, not a guarantee of Free-plan capacity. Connected native timers keep the actor active; using WebSocket callbacks does not prove hibernation. The last socket closing checkpoints/disposes native resources; cold restore pauses unfinished play. See [cloud design](CLOUDFLARE-WORKERS.md).

## 4. Product context to preserve

- Sidebar everywhere: **Chat → Cheat sheet → Recap points/Rp → Game log**. Poker probabilities follow cheat sheet. Mobile keeps this order below the table; panels must open/close without clipping. Keep drafts, focus and reading position through rerenders.
- Creators on landing and inside game: **Mahjong + Poker: Hendy W; Capsa + Domino + Catur + Blackjack: Faiz T**. These are credits, not Git author identities.
- Easy/Normal/Hard bots change decisions, use only own/public information and wait at least three seconds. Do not speed bots up for Quick Play.
- Host Rp inputs save without an extra Pasang button; Start uses displayed values. Lock settings during play. Rp measures point/chip results; there is no payment integration. Keep provisional stakes separate and settle each result once.
- Quick Play supports one round/hand, plus Chess blitz 5+0 and 3+2. Mahjong claim mode remains a separate lobby choice.
- Emoji picker sits beside Send, hidden until opened and closes on choice. Accepted emoji/chat also appear translucently at the table; history/reconnect/undo must not replay old effects. Respect reduced motion.
- Landing opens games/room links without a name form. Ask for name in the chosen game's create/join form, prefilled from the browser preference.
- A stored seat offers continue versus explicit leave-and-switch; wait for native leave acknowledgement. Transient disconnect is not permission to delete credentials. File recovery is a private seat token, not a room migration or normal invitation.
- Host dissolve confirms code + room instance, persists closed-code reservations before deleting, cleans timers and returns all participants to entry. Never create artificial payout/refund or reuse a dissolved code after restart.

### Rules that have caused confusion

| Game | Preserve / consult |
| --- | --- |
| Capsa Banting | Opening is any **legal combination containing 3♦**, not single-only. Rank 3 through A then 2; suits ♦ < ♣ < ♥ < ♠. Official four players; non-official 3–8 distributes the full deck; 1/2 humans get bots. Turn timer 60 seconds. Easy Mode hints/undo are opt-in with warning; undo at most twice per player/round. |
| Mahjong | New rooms use documented HKMA core 3–10 fan/payment ladder, flowers/replacements and default animated skippable four-wall/dice/deal opening. Four jokers and flower fan bonuses are explicitly optional house variants, OFF by default. Old saves without ruleset remain legacy. Protocol v12. Read [Mahjong rules](../games/mahjong/README.md) before changing scoring; do not claim every physical tournament rule is implemented. |
| Mahjong assistance | Manual free offers unfiltered claim controls, validates only submitted actions; assisted is default; Fast auto-passes. Highlight shows completed sets in own hand, not discard opportunities. These choices lock before play. |
| Poker | NL Hold'em, private hole cards, side pots, buy-in/rebuy accounting. Percentages describe exclusive best-hand categories at river using own/public cards, not opponent win equity. Preflop sampled, flop/turn/river enumerated. |
| Domino | Gaple score uses remaining **pips**, not tile count. Blocked table compares pip totals. Hub opening/stock/tied winner details are documented table variants. |
| Chess | Server chess.js legality and clocks; recovery/disconnect pauses clocks. Win +1, loss −1, draw 0. Preserve PGN, resign/draw/rotation semantics. |
| Blackjack | Six decks, dealer stands soft 17; blackjack 3:2, normal win 1:1, one split/double, split aces one extra card, no insurance/surrender. Even chip amounts preserve integer payouts. |

## 5. Patch and authoring workflow

Use Node 22+ and the root lockfile. Install dependencies only if missing/changed (`npm ci --ignore-scripts` for cloud dev); never regenerate lockfiles casually. Existing scripts include build:cloudflare, dev:cloudflare, deploy:cloudflare and test:ui. **Do not run test:ui unless asked.**

For behavior changes, bump package/lock version and server build ID together; update any changed native client protocol/version gates. A docs-only change needs no runtime bump. Review Node and cloud compatibility for shared changes: direct fs/listen/process/timer assumptions may need an adapter, not another rules implementation.

```sh
npm run build:cloudflare
npx wrangler deploy --dry-run --outdir /path/to/private/dry-run
npx wrangler dev --local --ip 127.0.0.1 --port 3024 --persist-to /path/to/private/cloud-preview
```

Paths above are placeholders: choose private locations and check the port first. No remote preview/tunnel by default. The build recreates only generated dist/cloudflare, checks local asset references and copies the public allowlist. Do not store handwritten files there. Stop your own preview after use; do not stop another host.

Inspect changed-file diff, JavaScript syntax, whitespace and representative UI when relevant. Distinguish fixture/empty-entry inspection from real multiplayer gameplay. If the user asks for verification, scope tests to affected rules, privacy, accounting, reconnect/recovery and mobile/Light/Dark UI, and state exactly what passed.

## 6. Release to Cloudflare

Detailed account/setup steps: [CLOUDFLARE-WORKERS.md](CLOUDFLARE-WORKERS.md).

1. Finish and identify a candidate. Review all included uncommitted changes; prevent accidental publication of unrelated source. Record a private file/hash manifest and base. Confirm no generated public asset contains tokens, snapshots, server-only paths or credentials.
2. Compare actual public health/build and local candidate. Explain disconnect/pause/reconnect impact. Get approval for this exact target/version when needed. Existing approval for another build is not permission.
3. Verify the human-approved Cloudflare account with Wrangler and Free plan in dashboard. The owner explicitly approved the account used for the first deployment; this is separate from the strictly personal Git account. Do not silently switch accounts, copy account IDs into Git, upgrade plans or add payment details. If login is unavailable, use browser OAuth; never request password/OTP/token in chat.
4. Keep `srac-gaming`, `GAMING_HUB`/`GamingHub`, `office-hub-v1` and SQLite migration history stable. Review any schema/codec changes and backward compatibility first. Do not delete storage or create a new actor to bypass a restore failure.
5. Publish only after current approval with `npm run deploy:cloudflare`. Build/dry-run are not publication; Git push is not required. Do not copy staging to legacy live or start cloudflared as a side effect.
6. Confirm actual deployment output, public HTTPS `/health` candidate build/all games, landing/entries/assets and same-origin WSS without creating rooms. Do not disturb active matches for a check. Fresh workers.dev TLS can need propagation; wait/recheck, never bypass TLS.
7. Record deployment ID/time, source manifest, approved account privately, public checks and unverified areas. Only now update Running. A failed attempt remains pending.

No zero-interruption promise: deploy/eviction can close sockets, clients reconnect and unfinished rooms require host resume. A successful release keeps the same cloud room store when identity/schema are preserved; it does not erase the need for compatibility review.

### Data recovery and incidents

- Read-only diagnosis first: compare health/build, browser connection/error, known provider outage/quota and private deployment logs. A static page loading does not prove a working game socket.
- Keep logs and snapshots private. Never add reset/import/debug download endpoints or publish real tokens in a report.
- Cloud snapshots are private SQLite graph/chunk transactions (128 KiB chunks); Node uses V8 files under DATA_DIR/rooms and preserves legacy poker/. Formats are not interchangeable.
- On cloud write failure, checkpoint-before-output closes/disposes the adapter and later restores the last durable state. Investigate the error/capacity before any data change. Do not fake a successful action or reset the database.
- Export/restore, retention changes, migration and rollback require a concrete reviewed plan and authorization. Protect closedCodes and accounting; old backups must not resurrect dissolved rooms or duplicate payouts. Old source may not understand newer saves.
- Do not treat Workers deployment history as a database backup. Do not claim a cloud backup exists unless actually exported and verified privately.
- Reverting code is another deployment requiring approval. Assess storage compatibility first; keep current source/data intact while preparing a recovery candidate.
- Detailed evidence, manifests, approvals and tool configuration are in the original operator's private workspace, outside Git. Ask the owner for that record if necessary; do not search/dump credential files. A fresh contributor authenticates their own approved account rather than receiving an exported OAuth file.

## 7. Git publication

Canonical remote: `https://github.com/izanagiwarrior/srac-gaming.git`. Owner staging uses this HTTPS transport with a repo-local exception to a global HTTPS-to-SSH rewrite, allowing Desktop personal authentication. Do not change office/global SSH configuration to push this repo. Develop/publish from staging only; owner GitHub Desktop should open staging. Preserve the working personal transport and identity; do not change author/email without telling the owner. An allowed Cloudflare account is not permission to use office Git identity.

A fresh clone gets only published source. The 2.0.0 source release includes the deployed behavior and this guide; confirm the remote branch actually contains that release before claiming publication. Never use `git pull` in legacy live to deploy, or reset/clean/checkout to hide local edits. Review status/branch/remote, intended diff, new files and ignore rules; stage only reviewed source/docs, no secrets/runtime. Commit/push only when requested, push normally without force, and confirm remote branch contains the intended commit before reporting success. Remote divergence needs inspection, not overwriting.

## 8. Historical evidence and future verification limits

The original2.0.0cloud checks on23October (historical): 89 source files matched the release manifest; 45 JS syntax checks, whitespace review, build/dry-run passed; 52 public assets, bundle 272.07 KiB / gzip 76.29 KiB. Local empty-entry preview was stopped. Production root and all six entries returned HTTP 200; health matched build; all six empty WSS connections succeeded; directory was empty; Blackjack entry showed connected with no browser console errors. No room was created/joined/started for cloud checks.

**Not yet verified in production cloud:** full matches and winning settlements, reconnect/cold recovery with actual rooms, timer/action races, storage failure/cap behavior, joker performance, real-group usage and Free quota consumption. Subsequent local validation covers native winning settlements, fan/payments, Pao and flower/joker fixtures; see the validation report. It does not prove production durability or races. Earlier UI regression results concern older releases and do not prove these paths. A separate Node Mahjong bot demonstration completed one drawn hand with eight flowers and claims; it was not a cloud payout test. An all-bot spectator result can wait for an absent host to advance; confirm desired behavior before changing that edge.

Initial 2.0.0 publication and the later 2.0.1 release were separately authorized and completed on 23 October; follow-up test/docs publication and redeploy were then explicitly authorized. That authorization applies to this release only. Verify actual Git/cloud operation results in the final operator record; the instruction itself is not proof of success. Suggested future work (needs scope/authorization): the verification gaps above, operational quota observation and a private cloud backup/restore procedure. These are not promised completed features or permission to run tests.

## 9. Finish every work session

Update this guide when architecture/current baseline changes; keep exact operator details private. Use a short handoff containing: request and authorization scope; source base and changed files; candidate version; actual running target/version; performed checks and untested paths; runtime/data changes; pending work; whether Git push/cloud deploy occurred; preview cleanup and any still-running authorized service.

Required user report:

| Status | Version | Contents |
| --- | --- | --- |
| Running version | Last confirmed cloud version/build (or current verified result) | Installed features and checks, not assumptions from local source |
| Pending to deploy version | Candidate/build, or None | Only not-yet-installed runtime changes; list pending Git/docs publication separately |

Never change Running merely because editing/building finished. After authorized deployment update this guide and private evidence; after authorized push record the real commit, rather than continuing to quote the old baseline.


## Installed release — Mahjong controls, 23 October 2026

Cloud **2.0.1 / `2026-10-23-mahjong-csp-controls-1`**, source commit `70236ca`, was installed on 23 October (deployment `e8a7e495-c7ca-409b-adfe-60371666cff8`). It replaces Mahjong inline HTML event handlers with explicit external-script delegates and declarative action data. Strict Workers script CSP remains unchanged. Includes tutorial next/back/skip/done/quiz, entry/lobby settings, round/result controls, tiles/claims and drag/drop bindings. Protocol v10, storage, rules and scoring unchanged. Isolated preview reached all ten tutorial pages and exercised back/skip/reopen/done without console errors. Production tutorial Next advanced from page 1 to 2; public health, root/six entries and six empty WSS connections passed. Actual in-match browser controls were not exercised by those checks. Other games retain legacy inline markup and need a separately scoped CSP compatibility review; do not infer all-game UI works from HTTP/WSS checks. No runtime candidate remains pending.


## Scoring validation — 23 October 2026

The user requested HKMA validation after the 2.0.1 cloud release. [Validation report](MAHJONG-SCORING-VALIDATION.md) records 106 passing local tests (95 HK scoring/server + 11 existing session/UI), official reference mapping, test-fixture corrections and remaining limits. No runtime/scoring change, push or deployment was performed for this validation. The owner subsequently authorized this validation/test/documentation release with “pastiin … agent.md … push … deploy”. The runtime remains 2.0.1; verify actual Git/deploy results in the final operator record, rather than treating this authorization as proof of success.


## Historical casual winning candidate 2.1.0

See [Mahjong rules](../games/mahjong/README.md): new rooms default Santai, no minimum fan; optional HKMA retains 3 fan. Flowers/animation stay available. Casual extends payout below 3 fan with 4/8/16 discard points for 0/1/2 fan (local variation); Zimo each opponent pays half. Existing saves missing winMode restore HKMA. Lobby lock/server eligibility/scoring use the same selected mode. Protocol v11. User explicitly confirmed deploy now on23October; push is separate and not authorized for this patch. Source/syntax/build and private lobby authoring review only; no new automated/gameplay tests.


### Historical installed casual release

User confirmation “Tetap deploy sekarang” authorized2.1.0. Deployment/public health and Mahjong asset hashes matched2026-10-23-mahjong-casual-win-1; fresh public entry loaded without console errors and without joining/creating a production room. Private lobby3024 confirmed defaultSantai and HKMA↔Santai changes. Preview stopped. No automated/gameplay tests run; earlier106-test evidence remains2.0.1. Current2.1.0 source remains uncommitted/unpushed on basecbdd547; publication requires separate approval. Older baseline tables above describe2.0.1 history; current cloud is2.1.0.

## Release-history note

Earlier2.0/2.1 sections below are dated historical evidence; current defaults/status are in the opening3.5.0section and root AGENTS. The current0fan=0policy applies to newly configured presets, not stored old casual balances.

Admin extension evidence: one synthetic account possession edit and one unstarted Blackjack initial-funding correction+native broadcast/audit inspected;319px editor has no document horizontal overflow. No six-game gameplay/security/race tests. Preview source and store are isolated from production; At that authoring checkpoint Google setup, release approval and focused verification were pending; later3.1–3.5release sections and PROJECT-STATUS.md record their completion. See ADMIN-CONTROLS.md.

## Current completion audit

See [completion audit](PROJECT-STATUS.md) for the reconciled chat requirements, superseded requests and actual completion boundaries. User approved this documentation cleanup/publication; no runtime change or deployment is required. Older candidate/pending statements are preparation history, not current queued work.
