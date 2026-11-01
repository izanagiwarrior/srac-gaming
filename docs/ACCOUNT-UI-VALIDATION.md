# Account UI validation — released3.11.20

## Fix

A valid24-character name without spaces could expand the profile hero beyond a320px viewport: document width454px. The heading's flex child had an intrinsic width without a maximum. `.ac-pageheading>*` now has min-width0/max-width100%; its h1 wraps anywhere. This is a presentation change only, without auth, money, game, storage or permission changes.

## Local evidence

A private loopback emulator used26synthetic ranked accounts,260trusted fixture results across10games, long names/non-Latin/emoji, and very large signed point/money totals. A separate demo admin made27local accounts. Trusted seed results are presentation fixtures, not evidence of260completed matches. No fixture data or helper endpoints were added to the product or production.

- Populated leaderboard all10games ×money/level/points at390px; aggregate320/390/1280, Dark/Light samples.26rows remained present and document fit.
- All10game entry pages with a24-character account name at320/390Dark:20measurements without horizontal page overflow. This is not active-table long-name proof for all games.
- Profile reproduces454px width before fix and320px after; fixed320Dark/Light,390Dark and1280Dark also fit. Store, collection, activity, settings, populated admin dashboard/users/editor/log views and landing checked at selected narrow sizes. Table-local horizontal scrolling remains intentional.
- Real local UI purchase of Ivory Wanderer charged500cosmetic coins once (680→180); XP840unchanged, owned count1→2. Equip updated avatar. After emulator restart the same cookie/name/avatar/coins/XP/inventory persisted. Admin log showed one shop.purchase and one avatar.equipped event. No account correction was used to manufacture this outcome.
-32account regression cases and26password/leaderboard/native-result cases passed on isolated SQLite. The latter includes four actual Quick engine rounds through Worker sockets to once-only account ranking, with trusted receipt replay tests separately. Google provider interaction was not tested; preview accounts are not proof of real OAuth.

The private preview is stopped and viewport reset. The seed/asset helper was outside source/Git and never used against cloud. No production account or room was changed. Full mobile/browser/active-state/admin coverage remains bounded; controlled real Google/email login and production purchase/settlement still need an agreed test identity.
