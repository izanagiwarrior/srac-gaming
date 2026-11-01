# Table-state UI audit — candidate 3.11.21

This is a local candidate, not a cloud release. Build `2026-11-01-table-state-layout-1` follows released3.11.20. CSS-only behavior changes; no authentication, game engine, permissions, settlement, storage, migration or namespace changes.

## Changes

- Capsa headings/results wrap long names; the mobile brand and header actions no longer overlap.
- Mahjong opponent grid uses shrinkable tracks and bounded wrapping names. Lobby seat labels retain room for wind labels.
- Poker summary cards bound names/totals and become one column on small screens, keeping monetary totals readable.
- Chess status headings wrap beside their icon.
- Domino table grid shrinks, very narrow player lists stack, and status names wrap before the stock indicator.
- Blackjack spectator status wraps long player names.
- Shared party result headings wrap; player-count labels have a dedicated width and stay on one line.

Internal hand/table scrolling remains intentional. There is no document-wide overflow hiding.

## Verification scope

Private native server snapshots cover all ten games in nine cases: full lobby, active, spectator, queued, locked, disconnect grace, proxy bot, round/session result, and recovery presentation. The recovery snapshot is a derived display fixture, not a cold-start restoration test. Other snapshots come from native factory operations; native results were advanced with controlled local clocks. Private fixture transport disables gameplay actions and is never included in source release assets.

The final matrix has270 unique combinations:10games ×9cases ×1280px Dark/390px Dark/320px Light. Every measured document fits its viewport. Long unbroken names, maximum table occupancy and high configured chip/point rates are included. Expanded cheat sheets, emoji menus, and chat collapse/reopen were checked for all ten games at390px Dark. Emoji menus stayed within the viewport. Representative active/result screenshots were visually reviewed, including readability corrections beyond document width.

The snapshot generator passed11checks (ten native game fixtures and one bundle check). This is not270 gameplay tests or proof of all possible states. It does not validate real Google consent, production purchase/settlement, every dialog, all intermediate actions, animation phases, all browsers, accessibility or all theme/size combinations. Existing backend suites remain separate evidence. Private fixture data/helpers/databases/logs must not be published.

## Cloud follow-up

The read-only GamingHub dashboard's selected one-hour snapshot showed0Worker exceptions,19client disconnects and0CPU/memory/internal errors. Historical observability was disabled, so the six earlier exceptions have no retained stack and remain unattributed. The24hour window overlaps the previous quota incident; its counts cannot identify the six events. No logging, billing, actor, data or runtime change was made during this check. Subsequently, the user selected a dedicated email/password QA account. Production public API checks passed signup/login, free purchase/replay/equip, rejected insufficient-coins purchase, one locked zero-IDR Quick Reversi native settlement/reward/standing, room dissolution and logout. The account retains20XP/20coins and one standing; no owner/other-room changes. Successful paid purchase and real Google consent remain untested in production.
