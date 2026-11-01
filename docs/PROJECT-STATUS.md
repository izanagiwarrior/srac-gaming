# Project completion audit — 31 October 2026

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

### UI alignment review — 31 October 2026

Follow-up requests all question-mark help aligned with its label and consistent sizing. Pending3.6.0 now uses one shared non-wrapping flex row, a shrinking/wrapping text column,28px fixed icon and8px gap. Specificity prevents native game styles overriding it. Heading, legend, plain labels, standalone notes and account copy share the same row treatment. Landing mobile header grows without account-pill collision. Explicit help in the login dialog is placed in the top layer and primary login receives initial focus.

Manual private preview covered landing/account and six game entry/lobby states at390px width, Mahjong Customize long checkbox labels, Poker Customize at390/768/1280, and Dark/Light examples. Local synthetic rooms were never started; no real/public player actions. This is representative UI review, not an exhaustive guarantee for every game state, browser, zoom or device. No automated/gameplay tests run. Temporary responsive fixture/CSP adjustment existed only in generated local preview output; final build restores production frame-ancestors none and excludes preview fixture/config. Running remains3.5.1; no commit/push/deploy.

## Follow-up3.5.1 — office login explanation

After the closure audit, the user explicitly accepted Google's Internal audience and requested an on-site office-account explanation, notes, deployment and personal Git push. Release3.5.1/build2026-10-31-office-login-note-1 is installed (deployment23a92239-e344-462b-a2de-8d5b0818b358). Landing, login/signup and shared game gate now explain Google office-account access and the separate personal-email/password path. Public health/nine entries and three changed file hashes passed. Rules/data/OAuth audience remain unchanged; no new automated/gameplay run. This follow-up is complete on the runtime; its publication is identified by the Git history and verified operator record.

## Closure-audit baseline (historical3.5.0)

- Public hosting: **3.5.0 / `2026-10-31-disconnect-grace-1`**, https://srac-gaming.faiz-triputra.workers.dev/ . Read-only health and ten entry routes returned200 during this audit.19critical public assets exactly matched source. Google configured=true, account preview=false;9skins plus1accessory. No login, room action, gameplay, deployment, restart or production data change was performed.
- Git: personal `izanagiwarrior/srac-gaming`, main. Runtime source release `862bf18`; regression publication `adb90f7bd2bfda8c9b7ac91df45876300548402c` independently matched remote main before this documentation-only follow-up. The audit publication commit is identified by Git history; confirm remote equality after pushing.
- Latest regression evidence: **200passed,0failed**, plus10repeats of23native connection cases. The test source is unchanged in this audit. Details and limitations: [validation report](CONNECTION-VALIDATION.md).
- Development/Git: `staging`. Sibling `live` is the preserved legacy Node hosting checkout, intentionally older and separate from Workers; its older version is not a pending cloud release. No old Node saves are copied into the cloud.
- Completion status: no identified unimplemented request, runtime candidate, failed release, pending credential setup or required user decision remains within the explicit chat requests audited here. This follow-up reconciles documentation only; it needs no runtime deploy. Historical preparation entries are not a current queue.

## Request-to-implementation map

The audit reconciles the available conversation requests in order and applies later corrections over earlier ones. Evidence below is source/documentation and the recorded checks, not a claim that every UI combination was replayed today.

| Request group | Final implemented state | Main evidence |
| --- | --- | --- |
| One repo and game landing | Six selectable games; nickname entry moved from hub to game create/join, account identity authoritative when signed in | `public/index.html`, `public/hub.js`, `server.js`, `cloudflare/worker.js` |
| Capsa Banting instead of Susun | Clockwise Big Two,3→2ranking, legal response comparisons; default Indonesian straight rule and optional alternate ordering | `games/capsa/engine.js`, Capsa README |
|3♦ opening correction | Holder opens every round; legal single/pair/triple/five-card play must include3♦, not necessarily single | Capsa engine `requiredCard` validation |
| Capsa non-official | Mode selected at creation and retained;3–8participants, all52cards distributed, max1difference; bots supply minimum3when only1–2humans | Capsa engine/server/README |
| Money, recap, rate input | Server-owned chip/point accounting in six games, configured IDR conversion, recap/history/CSV; Capsa/Poker rate autosave and Start reads current form | shared table settings/game-tools; native factories and READMEs |
| Bot levels and timing | Easy/Normal/Hard decision policies; native action delay at least3seconds. Capsa turn timer60seconds. Chess casual/Blitz5+0/3+2 | native six factories/engines, game conventions |
| Capsa beginner assistance | Suggestions hidden normally; explicit host Easy warning enables suggestions and2undos per player/round, restoring game/history/score checkpoint | Capsa server/client/README |
| Visual game assistance | Visual hand rankings, Capsa combination effects, Mahjong own-hand completed-set highlights, separate assisted/manual/fast claims | Capsa/Mahjong clients, shared game-tools, Mahjong README |
| Mahjong rules and flower mechanics | Easy/Normal allow valid0fan Hu;0fan=0points. Hard uses implemented HKMA core min3fan; Customize exposes variants.8flowers/replacements, optional4jokers OFF by default | `games/mahjong/hong-kong.js`, server, README, scoring report |
| Mahjong opening and Hu | Four-wall layout, actual server dice/break/deal with animation ON and host Skip; Hu animation before result with reduced-motion/skip | Mahjong server/client/opening assets; phase-recovery tests |
| Shared UI/chat | Right panels for chat, cheat sheet, recap and log; collapsible controls; compact emoji menu auto-closes, translucent table emotes and floating edge chat; Dark default/Light | `public/game-tools.js`, `room-client.js`, `theme.js/css`, native Capsa panels |
| Credits | Mahjong/Poker Hendy W; Capsa/Domino/Catur/Blackjack Faiz T on landing and inside games | hub page and shared creators map |
| Quick Play and invitations |1round/hand choices and Chess Blitz; static duration/rate before dynamic/custom controls; visible room code/copy invite/copy code/leave controls | shared room UI, game clients/settings |
| Room dissolution | Host-confirmed dissolve closes ownership; old code stays unavailable after restart; no fake payout | shared room service; six-game SQLite tombstone tests |
| Poker educational odds | Own hole cards plus public board: exclusive river categories,10,000preflop samples, full flop/turn/river enumeration; not win equity | Poker odds worker/panel and README |
| Accounts and cosmetics | Google and email/password, Cloudflare SQLite profile/XP/coins/inventory,1equipped avatar+optional accessory; AI-generated catalog with6additional free human portraits | account store/catalog/UI, avatar provenance |
| Progression | Server-owned eligible completed rounds earn20XP/coins, win+30;60seconds connected eligibility and1,000daily cap. Spendable coins mirror earned progression without lowering lifetime XP/level | account rewards, account docs/tests |
| Admin | Verified Google bootstrap Hendy/Faiz; admin role CRUD, possession/XP/coin/inventory/equipment edits, audited six-game balance correction, event/player activity estimates | admin/account store/game-admin/UI and validation |
| Same-account devices | Latest authenticated game connection claims persisted seat with token rotation; old controller stops retrying; manual reconnect can reclaim, no stale browser overwrite | account room access/shared client; six-game handoff/race tests |
| Disconnect UX | Server-detected15second grace/countdown, then temporary native bot; reconnect cancels old callbacks, keeps cards/balances, animated shared notices | shared connection/room UI; native and SQLite tests |
| Cloud hosting and maintenance | Workers+SQLite Durable Objects independent of laptop; stable workers.dev URL. Preserved actor identities/secrets/data, explicit separate push/deploy permission; agent/hosting guides | Wrangler config, Workers guide, maintenance/skill |
| Repo relocation and Git identity | `Pribadi/SRAC-Gaming/staging` development/Git, `live` legacy hosting only; personal HTTPS remote/author, no office Git/global SSH changes | actual repo path/config/history; owner parent guidance |

## Superseded requests and deliberate boundaries

- Susun was replaced by Banting. “Single3♦only” was corrected to any legal opening containing3♦.15second Capsa turn duration was superseded by60seconds. Initial removal of suggestions was later replaced by explicit Easy-only assistance.
- Initial account/local-storage proposal was superseded by DB-only account/progression storage. Browser preference/cache is not authoritative account/game ownership. Manual player file-recovery UI was removed; safe host continuation after a cold runtime remains intentional.
- Google login uses the owner-approved SRAC-AI client/Internal audience/shared branding. It is configured and tested; changing that shared project's audience/branding is not an unfinished deployment. Email signup is a separate path. No Google access/refresh/ID tokens are retained after identity verification; secrets stay private, not in Git or account rows.
- The Chinese Official/MCR link was a comparison reference. The user's final presets explicitly specify Hong Kong; MCR8point tournament scoring and physical referee penalties are not promised features.
- Shop coins are spendable XP-earned currency; lifetime XP controls level and is not spent. All skins/accessory assets are AI generated at authoring time, with no paid runtime generator promised.
- The supplied Mahjong Gathering PRD was reference context for an account request, not authorization to implement a separate entire redesign. No unidentified redesign backlog is declared completed.
- Render/alwaysdata/card verification, Quick Tunnel/local/LAN hosting and zip exports were superseded or cancelled. Preserved legacy source/data are not an instruction to restart, migrate or delete them.
- Balance corrections are deliberately between hands/rounds and audited, preserving zero-sum settlement; administrators do not bypass auth or rewrite an active pot.

## What “clear” means

There is no identified pending promised feature, failed push or uninstalled runtime patch. Further exhaustive testing, password-reset email delivery, Google External audience conversion, provider quota/cost monitoring, private operational backup/restore tooling, runtime AI generation and tournament certification are not silently represented as completed requests. Existing verification/hosting limits remain documented; zero pending work does not mean mathematically bug-free, unlimited hosting or guaranteed uptime. Do not create production matches or edit real users merely to prove completeness.

Future work requires a new request; Git push, runtime deploy and changing active hosting remain separate permissions. Use this page as the current completion index; keep older release evidence as history.
