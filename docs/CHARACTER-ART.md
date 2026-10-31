# Character artwork — local candidate3.10.1

## Usage and budget

The landing hero uses a newly generated scene of the existing jade dragon and starter cat at a game table. Cards reuse existing portraits, blended with recognizable game pieces. No inventory, skin ownership, account role or admin entitlement changes. Ten-game layout/order stays unchanged. Character closing cluster reuses cached thumbnails. New four-game entry art shares the same cast mapping; actual boards/hands remain unchanged.

- `public/characters-game-night.webp`:1120×630,100236bytes (97.89KiB).
- Eleven `public/cast-*.webp`:384×384,175476bytes combined, largest22380bytes (21.86KiB).
- Total additional raster payload275712bytes (269.25KiB). Lazy loading for game cards/closing; hero fetchpriority high. Explicit dimensions avoid layout shift. Native Node map and Workers public asset build include the files.
- Cast hard cap32KiB; avatar/frame100KiB and other raster300KiB remain. All optimized assets strip metadata; raw master stays outside public/Git.

| Surface | Existing character |
|---|---|
| Hero | Jade dragon + Table Buddy cat |
| Mahjong | Jade dragon |
| Blackjack | Midnight Fox |
| Capsa | Ember Tiger |
| Catur | Snow Owl |
| Domino | River Otter |
| Ludo | Moon Rabbit |
| Monopoli | Raccoon Scout |
| Poker | Bima |
| Reversi | Bamboo Panda |
| UNO | Mira Starlight |

## Generation provenance

Built-in imagegen, one landscape illustration; two existing avatar references. Prompt:

> Use case: illustration-story. Create one landscape website hero illustration for Meja Kita, a friendly tabletop game hub. Image1 and Image2 are character identity/style references, not edit targets. Preserve the recognizable friendly small emerald dragon with gold antlers, ivory-and-gold traditional jacket, and the fluffy cream cat with a deep green vest. Show these two existing characters together at a cozy emerald felt game table, smiling and playing, with a few ivory mahjong tiles, playing cards, wooden chess pieces, colored ludo pawns and dominoes on the table. Richly crafted miniature3D storybook illustration, warm gold lamplight, forest green backdrop, welcoming and playful. Wide close composition with both faces clearly visible in upper two thirds and game pieces below. No words, letters, logos, watermark or UI. Detailed but clean, no busy background. This will be compressed into a small web hero, so bold readable shapes and few large props.

Only the hero was AI-generated. Existing images were resized/re-encoded with Sharp; game props/layout remain code assets. Portrait masters/catalog remain intact.

## Verification and release

Local preview3027 with isolated SQLite; no canonical installation, commit, push or cloud deploy. Desktop Dark/Light hero and compact card art reviewed, Monopoli entry reviewed with disposable preview account, no room create/start/gameplay. Syntax/build/byte budgets checked. Mobile viewport, every entry state, all gameplay and earlier3.10.0edge cases are unverified. Running cloud remains3.8.1 and quota recovery is not rechecked. Before release reconcile the candidate source into canonical staging using the private manifest without replacing newer edits or runtime.
