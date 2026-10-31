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

