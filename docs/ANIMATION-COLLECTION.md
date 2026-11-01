> **Released in3.16.1 (1November2026).** This feature is installed on Cloudflare and included in personal GitHub sourcebc80d46. Any local/pending/no-deploy descriptions below are historical authoring evidence, not a current release backlog. See [current status](PROJECT-STATUS.md). Gacha's final missing-only policy is poolfirst-light-v2.

# Animation collection

Local candidate3.15.0 / `2026-11-01-animation-collection-1`,1November2026. Includes all pending3.14.0 artwork,3.13.0 read optimization and rank cosmetics. Canonical/cloud/Git remains3.11.21 until fresh release authorization.

## Twelve normal shop items

| Name | Slot | Coins |
|---|---|---:|
| Comet Trail | entrance | 120 |
| Comet Halo | aura | 120 |
| Ocean Arrival | entrance | 140 |
| Tidal Glow | aura | 140 |
| Petal Waltz | entrance | 160 |
| Petal Breeze | aura | 160 |
| Aurora Gate | entrance | 180 |
| Aurora Veil | aura | 180 |
| Prism Portal | entrance | 200 |
| Prism Crown | aura | 200 |
| Thunder Crest | entrance | 220 |
| Storm Pulse | aura | 220 |

Six finite themes (comet/tide/petal/aurora/prism/thunder) have different entry particle motion and aura glow keyframes. All are ordinary purchased items; no automatic rank gifts or changes to existing catalog entries, admin rights, reward amounts or ownership rules. Same persisted entrance/aura slots and existing purchase/equip/audit APIs. No schema, image assets, extra API polling or animation telemetry.

## Rendering and previews

New entry banners contain at most six decorative particles, are pointer-transparent, and last2.8seconds. Only one shared banner/preview exists at a time; starting a new one clears the previous timer/node. New entries sweep/drift/rise/rotate gently; no rapid blinking or full-screen flash. Continuous aura keyframes use slow5–8second glows. They apply through the existing shared profile/native-player classes across the ten games. Native propagation was already implemented in the pending cosmetic bridge; this increment does not change game state or WebSocket messages.

Every entrance/aura shop card, including existing and rank-only items, now has a **Pratinjau animasi** button. Previewing an unowned effect is local presentation only and grants no entitlement. Entry preview uses the real entry renderer with a preview label. Aura preview uses one bounded pointer-transparent orb panel, removed after3.6seconds. Profile selection/equip remains limited to owned items and validated server-side.

Static shop representations animate only while hovered/focused, rather than running an entire grid. The global base aura shadow no longer uses `!important`, so CSS animation keyframes can actually change the new shadows. Text/background theme behavior stays shared.

## Reduced motion and cleanup

Both OS `prefers-reduced-motion` and the saved `mejakita.preferences.reduced` setting suppress motion. A discovered existing gap was fixed: account pages do not create the game preference toolbar, so cosmetics now reads the existing nonsensitive device preference when MejaRoom is unavailable. It mirrors the boolean onto the root attribute, listens for preference/storage changes, and never writes back or stores account data. CSS final overrides prevent new theme selectors from undoing reduced-motion rules. Reduced entry previews show a notice instead of a banner; aura previews retain a static swatch.

Pagehide, hidden-document transitions and existing game leave/dissolve/replacement cleanup remove transient banners. Motion preference changes clear them. No persistent particle loop or canvas is created. Existing native host/player/reward behavior is unchanged. Performance is bounded by design but device battery/frame rate was not benchmarked.

## Local evidence and limits

- All six entry previews produced one banner/six particles and their distinct expected animation names; all six aura previews produced one panel with distinct glow animation names and pointer-events:none.
- Existing local player demo bought/equipped CometTrail120 +CometHalo120:480→240coins. Profile selectors retained both IDs and avatar computed animation was mk-comet-glow. No production user or real currency involved.
- Reduced-motion authoring initially revealed the account-page preference gap. After the fix, persisted true on returning from Mahjong showed zero entry banners plus notice, and animation:none on both aura preview and profile. Earlier failed observations in the private UI record are superseded by the final checks. OS live-change/cross-tab storage behavior was source-reviewed, not independently browser-emulated.
- Six new entry previews in Dark320px and six aura previews in Light320px fit document width. Desktop shop preview inspected, no console errors in the reviewed tab. Existing shared game-entry page loaded without creating or starting a room.
- Source syntax and cloud asset build passed. No formal automated/gameplay/full-match suite, every-item transaction, production migration, all native active-game effects, full lifetime cleanup race or device performance benchmark. Private preview stopped, tab closed and viewport reset.

No commit/push/deploy. Publish only source manifest; exclude private fixture data/helpers/review outputs. Fresh release instruction required.
