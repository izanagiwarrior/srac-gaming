# Collectible art expansion

Pending local **3.14.0 / `2026-11-01-collectible-art-1`**, 1 November 2026. Includes the pending read optimizations and rank cosmetics from 3.13.0. Cloud/Git remains 3.11.21 until a new explicit release instruction.

Eight new original images were created with the built-in imagegen tool: six square character portraits and two landscape environments. Warm emerald/gold storybook style, safe head/ear margins, no lettering or logos. Masters are outside the source; publish only compressed WebP derivatives. No external image hotlinks or runtime generation.

## Items

| Item | Slot | Coins |
|---|---|---:|
| Velvet Lynx | Skin |180|
| Storm Wolf | Skin |300|
| Coral Axolotl | Skin |220|
| Moss Capybara | Skin |260|
| Amara Sunweaver | Skin |160|
| Niko Cloudrider | Skin |160|
| Lantern Garden | Profile decoration |240|
| Moonlit Observatory | Profile decoration |360|

All eight are normal shop items, not admin-only or automatic rank grants. Existing prices, rank unlocks, ownership checks, reward economics and reserved Faiz/Hendy cosmetics are unchanged. Same purchase/equip/inventory/audit mechanisms; no additional storage table, polling, analytics or image-generation API route. Static image requests do not query SQL. Existing account APIs still verify the session and legitimately read/write ownership as before.

## Image budget

Avatars384×384, profile scenes768×512, WebPquality76/effort6, metadata stripped. Entire addition212,224bytes (207.25KiB), largest53,694bytes. Avatar files remain under existing100KiB cap; new `profile-*` hard cap64KiB is enforced by the asset builder. Do not publish PNG masters, inflate dimensions, or add uncompressed source exports. Future generated profile backgrounds must preserve this64KiB limit; target avatars under32KiB where appearance permits.

| File | Pixels | Bytes |
|---|---|---:|
| avatar-velvet-lynx.webp | 384×384 | 17886 |
| avatar-storm-wolf.webp | 384×384 | 22034 |
| avatar-coral-axolotl.webp | 384×384 | 20660 |
| avatar-moss-capybara.webp | 384×384 | 23092 |
| avatar-amara-sunweaver.webp | 384×384 | 16018 |
| avatar-niko-cloudrider.webp | 384×384 | 16642 |
| profile-lantern-garden.webp | 768×512 | 42198 |
| profile-moonlit-observatory.webp | 768×512 | 53694 |

## Rendering

Catalog entries use fixed image paths; Node's explicit asset map includes the same eight paths as the Worker static build. Shared cosmetics recognizes only two additional finite theme names, `lantern` and `observatory`. Their decorative backgrounds use fixed CSS URLs with dark or cream overlays for readable text. Image previews use contain, not a cropped portrait frame. No new animation, motion preference or pointer interaction is introduced. Existing game/profile style propagation continues unchanged.

## Verification and limits

- Inspected all eight compressed assets together: complete faces/gills/ears and both environments, no broken/blank art. Metadata/file budgets checked.
- Private local `/api/account/me` includes56catalog entries; eight new IDs/kinds/prices match. All eight static responses200/expectedWebP, byte-identical to source.
- Existing player demo bought/equipped Velvet Lynx180 and Lantern Garden240; coins480→60, avatar/profilebackground updated. Private profile Dark/Light at958px and Light profile/shop320px fit the viewport. Profile CSS resolves the correct scene and theme-specific overlays. Store remains12cards/page and images lazy-load.
- Existing catalog entries, including admin IDs/owner/default art, compared unchanged against3.13.0. Syntax and cloud asset build passed. No formal automated/gameplay suite, real Google flow, every new-item transaction, native active-game propagation or production action was performed. Shared infrastructure was already present; this art review does not prove every game state.

Preview and fixture/runtime/helpers are private and excluded from publication. No canonical install, commit, push or deploy. Fresh publication authorization required.
