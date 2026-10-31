# Faiz dragon branding and card containment — candidate3.11.1

## Changes

All ten landing cards use dedicated `.game-prop-set` flex/grid illustrations. Small playing cards, dominoes, pawns, tiles, chess board, vehicle/house and Reversi discs stay inside a positive-inset padded container. No negative object coordinates or translated overlapping card stacks. Portraits use `object-fit:contain`, with a slight background fade, so the original artwork is not enlarged/cropped to fill the art window. Mahjong remains full-width, other nine remain alphabetic1+3+3+3desktop. Responsive rules retained; header navigation wraps when the wider brand needs space.

The existing clover is kept; the Faiz black dragon is beside it and the Meja Kita wordmark on hub/footer/account/leaderboard. Shared game creator bars prepend the same small brand portrait. This is decorative public branding, not an entitlement or a replacement for anyone's equipped avatar. Existing admin-only skin rights and starter cat inventory remain unchanged.

Login and signup alone replace the large Table Buddy cat illustration with Faiz's existing black dragon. The hub green-dragon/cat scene, ordinary game cast and default player avatar are unchanged. The login portrait floats6px slowly over8seconds, with a soft gold halo. Pause/resume button is keyboard reachable and updates its accessible label/state. `prefers-reduced-motion:reduce` stops the animations and hides the redundant pause button. Mobile login has a compact156px portrait; desktop240px portrait aligned near the top of the form.

## Assets and source

- Existing source reference: `public/avatar-admin-faiz.webp`, unchanged.
- `public/brand-dragon.webp`:96×96,2700bytes.
- `public/cast-admin-faiz.webp`:384×384,20660bytes.
- Additional payload23360bytes (22.81KiB). Sharp resize/WebP compression, metadata stripped. No AI generation/new master in this patch.
- Build guard brand8KiB, cast32KiB, existing avatar/frame100KiB/other raster300KiB unchanged.
- Shared `public/brand.css`; login art in account-app/account.css; containment in hub HTML/CSS; creator mark in game-tools. Native asset map updated; Worker public asset build includes new files.

## Preview and limits

Local3029with private SQLite, includes pending3.11.0leaderboard/all previous ten-game/art work. Canonical staging and cloud3.8.1 are unchanged. No install/commit/push/deploy authorization. Safe reconciliation into canonical staging must preserve newer edits and runtime, followed by separately authorized publishing.

Desktop branded hub and all card rows inspected, specifically Blackjack/UNO now fully visible. Login Dark/Light, signup tab and pause/resume state inspected without submitting credentials or account/room actions. Source/syntax, asset dimensions/bytes and build checked. No automated/gameplay/phone viewport/OS reduced-motion tests; source CSS support is not a claim of those runtime checks. Earlier leaderboard populated-data/settlement/retry and game validation limits remain. Cloudquota not rechecked.
