# UI containment — candidate 3.11.2

All earlier3.11.1 changes are included. This patch changes CSS only apart from build metadata/documentation. No rules, account permissions, saved state, storage identity, leaderboard computation or images change.

## Layout conventions

- Keep grid children `min-width:0`; use `minmax(0,1fr)` for flexible tracks. Let navigation wrap before overflowing.
- Use shared content insets; ranking panels must not touch viewport edges.
- Filter inputs/selects shrink within their label. Sorting buttons remain one flexible group; refresh has a44px target.
- Ranking table reserves space for rank/metric while names wrap. On narrow screens the existing secondary outcome column is hidden and outcomes remain in the player subtitle. No global horizontal-overflow masking.
- Account sidebar logo uses compact artwork/wordmark; login form columns can shrink. Mobile settings stack.
- Large heading help icons follow the last text line; input labels retain their existing single-row helper convention.
- Shared game sidebar cards wrap text and keep inputs/examples inside the column. New-game entry portraits and props have bounded sizing.

## Review evidence and limits

Local preview3030, separate SQLite, demo player only. All10entry screens and account/login/profile were visually inspected at958px; empty leaderboard Dark/Light; Mahjong private unstarted room FWJW with cheat sheet open, then left. Landing/card rows and compact account brand inspected at1280px. Measured page width equals viewport on inspected screens. No Start/gameplay or production actions. Source syntax and public asset build passed.

Responsive CSS covers smaller widths, but actual mobile viewport was not available in this review. Populated rankings, active game tables, long admin data and all transient states are not verified. This is not an exhaustive no-bug guarantee. Previous game/settlement/recovery limits still apply.

Canonical staging/cloud are untouched. Safely reconcile the private manifest against canonical before a later authorized release. Screenshot: operator outputs/ui-layout-leaderboard-preview.png.
