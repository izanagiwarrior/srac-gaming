# Rank cosmetics and effects — candidate3.12.0

This local candidate includes/supersedes3.11.22. Current cloud/Git is3.11.21 until explicitly released. No production account/room changes or deployment during authoring.

## Progression and acquisition

|Level|English title|Automatic rewards|
|---|---|---|
|1–4|Initiate|Existing starter skin|
|5–9|Silver Vanguard|Midnight Fox + Vanguard Crest profile decoration|
|10–14|Jade Sentinel|Ivory Wanderer + Jade Awakening entrance|
|15–19|Golden Sovereign|Ember Tiger + Sovereign Radiance aura|
|20–29|Astral Legend|Sakura Ronin + Astral Sanctum decoration + Astral Ascension entrance|
|30+|Celestial Dragon|Koi Spirit + Celestial Throne decoration + Dragon Arrival + Celestial Dragonfire aura|

Five existing paid skins can also be earned at rank. Fourteen new CSS cosmetics: six paid decorations/entrances/auras and eight rank-exclusive effects/decorations. Skin artwork is reused; no new images/download payloads. No effect changes game odds, hints, permissions, reward caps, XP thresholds or room money.

Profile contains five independent slots: skin, frame (legacy accessory), decoration, entrance, aura. Optional slots can be disabled. Shop/collection filters match those slots plus rank/free/admin. Rank-only rewards cannot be purchased or manually claimed early. Existing free skins remain available. Admin editor controls inventory and all five equipped slots with its existing reason/revision/idempotency/audit protections.

## Server ownership and database

Existing AccountStore actor/binding/namespace/migrations stay unchanged. Additive, idempotent schema setup adds nullable users.decoration/entrance/aura and cosmetic_unlocks(user_id,item,created) primary key. Existing users default to no new effect.

On authenticated session resolution, syncRankCosmetics derives eligibility from authoritative lifetime XP. One transaction inserts permanent unlock receipts, missing inventory items and cosmetic.rank_unlocked audits, without charging coins. A per-user rank-cosmetics-v1 metadata watermark avoids repeated inventory scans once current level is processed. Increment that catalog key for future retroactive additions. Existing purchased items are not duplicated/refunded. Rewards are permanent when XP is reduced. Explicit admin removal is respected by receipts/watermark, rather than silently regranting every session. No automatic equip of rank rewards.

Normal buy transaction and replay protection apply to paid effects. Equip validates both slot kind and owned entitlement; all-slot /api/account/appearance validates every selection before a transaction. Unknown slots and unowned/wrong-kind items are rejected. Admin permissions remain separate from titles. No client XP/title or effect ID can grant inventory.

Profile/equip and admin changes send a sanitized internal AccountStore→GamingHub notification (user ID and public cosmetic IDs only). It updates existing connected socket styles and matching room members, saves and broadcasts, without initializing dormant games or disconnecting players. Public worker routing does not expose the internal path. If notification fails, later existing verified action/session refresh supplies current style; no new polling. Do not describe delivery as guaranteed while offline.

Room metadata exposes public style IDs/name/arrival ID for seated account players only, never email/session tokens/private hands. Old snapshots tolerate absent fields. Native joined/rejoin rotates the cosmetic arrival ID. Initial room render celebrates only self; later new/rejoining arrivals can be shown to other viewers. Profile edits do not replay entrances. One transient banner replaces the previous one; animations are pointer-transparent, bounded and cleaned on leave/dissolve/replacement/pagehide. Shared profile strip and native player panels use the same cosmetic definition across10games. Native player panels match their public display name; existing room name uniqueness/sanitization remains authoritative. Spectator-only appearances are not advertised as seated-player effects.

## Rendering and validation

Shared player-titles.js uses English names at unchanged1/5/10/15/20/30 thresholds. Shared cosmetics.js/css use finite theme names, lightweight CSS art, low-opacity entrance and aura. Native render annotations are presentation only. All13source HTML pages include these public assets; Node route map and Workers build serve them. Bridge initializes before native clients and retries initial cosmetics after toolbar/DOMContentLoaded/load readiness, addressing an observed first-state Blackjack race. Native player gameplay logic is unchanged. Reduced-motion OS preference and existing device “Kurangi animasi” stop animation. No sound, canvas, new API polling or generated artwork.

Private local authoring checks: Level30 demo receives13unique unlocks once; repeated reads keep inventory20 after one paid purchase. Level3 non-admin advanced locally to1600XP/Level5 receives exactly fox + profile-vanguard, coins180 unchanged, repeated inventory count4. Unowned rank buy/equip/all-slot invalid requests rejected403; unknown slot400, existing skin/coins unchanged. Paid Stardust Veil UI purchase480→180coins, equip and one audit; replay200/no additional charge. Restart retained purchased/equipped aura, decoration and entrance. Real unstarted private Mahjong lobby showed own arrival, live aura updates from profile without reconnect, reduced-animation disabled native aura, then room dissolved. No game started.

Private render-only native snapshots of10active game tables:30final samples1280Dark/390Dark/320Light all document widths equal actual viewport and every annotated panel receives aura. Fourteen final profile/shop samples1280/958/390/320DarkLight as applicable fit, with no broken shop images. Initial timing/viewport harness observations were superseded by confirmed readiness/actual-dimension reads. Source JS syntax/public build pass. No new automated/gameplay suite or production validation was run; multi-client live arrival/rejoin/active-game update races, all intermediate ranks, all animation phases, actual cloud schema upgrade and exhaustive admin/race coverage remain unverified. Never publish private fixtures/helpers/databases or synthetic data.
