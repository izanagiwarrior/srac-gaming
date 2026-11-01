# Image assets and size budget

## Required workflow

- Before adding any generated or imported bitmap to `public/` or a game's public directory, resize and compress it. Never publish the raw multi-megabyte generator output.
- Avatar portraits and accessory frames: **WebP**, longest side **512 px maximum**, no upscaling. This supports the current card/retina avatar sizes.
- Start near **quality82**, preserve alpha for transparent frames, strip EXIF/other metadata, and inspect at the actual UI size. Target **60 KiB or less** per avatar/frame; hard limit **100 KiB**. Reduce quality/dimensions further when needed without making the artwork unclear.
- Other raster artwork: size to actual display needs, longest side normally at most1920px, hard limit300KiB per file. Keep existing SVG/vector icons as vectors.
- If an exceptional larger image is essential, explain the need and obtain agreement before changing the shared budget. Do not silently bypass/remove the guard.
- Keep original masters outside deployable public directories and outside Git (private operator backup or original generation output). Ship only the optimized derivative.
- Update catalog, native server map/MIME, client URL allowlists and any HTML/CSS references to the new format; retain stable item IDs and database inventory.
- Inspect the result for readable detail, alpha and broken references. Build and verify the byte budgets. No automatic gameplay tests unless requested.
- Image generation remains the built-in imagegen workflow. Deterministic resizing/encoding of existing output can use an available optimizer such as Sharp, Pillow, cwebp or ImageMagick; no AI regeneration is needed for compression.
- This workflow never grants push/deploy permission.

## Build guard

`npm run build:cloudflare` checks each deployable PNG/WebP/ICO before copying: avatar/accessory filenames100KiB, other raster300KiB. The build fails on oversized files. The guard enforces bytes; the agent must also inspect dimensions and visual quality. No optimizer library or image-generation service is needed in the deployed app.

## Compression3.8.1 —31October2026

All34existing/new raster assets converted from full-size PNG to WebP: **61,681,748 →1,488,808bytes (97.59% reduction)**. Longest side512px; largest78,948bytes (77.10KiB). Transparent frames retain alpha. Runtime image references now use WebP and Node serves image/webp; item/inventory IDs stay unchanged. Existing native static coverage also includes the six free portrait files. OriginalPNG masters preserved outside the repo before removal from public.

Included in deployed3.8.1 (with3.8.0cosmetics), deployment5b2212d2-7e44-44a0-ac8b-a5f7d882afae. User authorized Git publication; confirm remote after push. Static assets verified; database quota incident is documented in PROJECT-STATUS.md. Source syntax, all34decoded dimensions/metadata/file presence and asset build inspected; sample black dragon and transparent emerald frame visually inspected. No automated/gameplay tests or browser review for this compression follow-up; previous shop preview covered the uncompressed artwork. Earlier provenance tables record original generation outputs, not an instruction to ship PNG masters.


## Character scenes3.10.1

Reused portraits as decorative cast thumbnails: WebP≤384px, target24KiB, hard cap32KiB enforced for `cast-*.webp`. New scene hero1120×630/100236bytes, all11cast thumbnails175476bytes total/max22380. Original collectible image IDs/rights remain unchanged. Scene generation does not grant a user an admin skin. Keep master outside source.

## Black-dragon branding3.11.1

Reuse existing Faiz artwork, no regeneration: `brand-dragon.webp`96px/2700bytes (brand hard cap8KiB); `cast-admin-faiz.webp`384px/20660bytes (cast hard cap32KiB). Sharp strips metadata. Logo/login use decorative art only and do not grant the reserved admin cosmetic. Native map +shared HTML references updated.

## Leaderboard3.11.3

`leaderboard-dragons.webp`:480×320,35080bytes (34.26KiB). Built-in imagegen references existing avatar-jade.webp and avatar-admin-faiz.webp, recoloring Faiz white only for this new appreciation illustration; both thumbs-up. Sharp WebP quality76, strips metadata. Master stays outside source. Use object-fit:contain/aspect-ratio3:2; never circular crop faces/hands. Decorative only, no item grant.

## Unified brand3.11.4

`brand-emblem.webp`:96×96/5680bytes (5.55KiB), RGBA, transparent alpha retained; built-in imagegen from existing Faiz artwork combines black dragon and gold club in one silhouette. Sharp quality80/alpha90 and metadata stripping. Display contain without tile/border in header/footer/account/leaderboard/shared credits; decorative only. Existing brand-dragon.webp retained for compatibility, no longer referenced by current brand markup. No item grant or avatar replacement.

## Faiz profile avatar3.11.6

Stable cosmetic admin-faiz now uses avatar-admin-faiz-white.webp,512px/49286bytes (48.13KiB), from built-in imagegen matching leaderboard white Faiz. SharpWebP76, metadata stripped, master outside source. Display name Ivory Dragon. Old black avatar asset retained for provenance; black logo/login assets unchanged. Do not change ownership or grant defaults as part of this artwork swap.

## Tab brand3.11.9

Use the same integrated emblem for all HTML entry favicons: favicon-dragon-v1.png64pxRGBA/3729bytes, SharpPNG palette90/compression9 from96pxbrand-emblem.webp, metadata stripped. Each13entry explicitly references the new filename so old favicon.svg cache does not retain the club-only icon. Legacy favicon.svg now embeds same emblem. Preserve black logo/login and white Faiz profile distinction.

## Collectible art3.14.0

Six new384pxavatar portraits and two768×512profile backgrounds, built-in imagegen; WebP quality76, no metadata, total212224bytes. Eachavatar16–23KB;profile42–54KB. New `profile-*` hard cap64KiB enforced at build; target future avatar artunder32KiB, keep existing100KiB ceiling. Originals stay outside source. Fixed theme URLs/contrast overlays, contain previews, static-only delivery; see [provenance and budgets](COLLECTIBLE-ART.md). Existing admin artwork/ownership unchanged.
