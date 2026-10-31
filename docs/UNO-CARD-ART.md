# UNO card artwork — candidate3.11.8

User reference: https://en.wikipedia.org/wiki/Uno_(card_game)

## Source and rights metadata

Artwork: **UNO cards deck.svg**, by **Дмитрий Фомин (Dmitry Fomin)**, own work10November2013. Source file page: https://commons.wikimedia.org/wiki/File:UNO_cards_deck.svg . Download: https://upload.wikimedia.org/wikipedia/commons/9/95/UNO_cards_deck.svg . File page states **CC0 1.0 Universal**: https://creativecommons.org/publicdomain/zero/1.0/ . Rechecked31October2026. This is community-created deck artwork used on Wikipedia, not a statement that Mattel supplies/licenses this application. UNO name/game rights remain with their owners.

## Processing and use

Downloaded original stays in operator work/uno-wiki-art-patch/reference/ (not deployed). Rendered SVG then selected first four color rows/13values (0–9,Skip,Reverse,+2), Wild top-right and +4 row5right. Cropped whole card rectangles, resized160×240 and composed14×5transparent WebP atlas. No rewriting of numbers/action symbols. Final public/uno-deck-art.webp2240×1200/240066bytes (234.44KiB); metadata stripped. One local file/cache request, no hotlink dependency. Shared uno-cards.css maps each semantic card class to atlas coordinates, hides old visual glyph overlays while retaining semantic content. Atlas only loads on hub/UNO.

Landing uses red7,blue+2,greenReverse; entry red7/blue+2. Dynamic hand/topcard derive class from server-owned color/value; buttons retain existing labels/actions/disabled states. Card proportions2:3. House rules/engine/state/account logic unchanged. The old CSS approximation from3.11.5 is superseded.

Build/syntax/local read routes and landing/master visual reviewed. Actual active hand/Wild/playthrough/mobile not verified. No automated/gameplay tests run, no cloud actions.
