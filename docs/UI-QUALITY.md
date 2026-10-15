# UI verification — 2026-10-15-ui-polish-1

## Scope and fixes

This release includes the pending Mahjong cheat-sheet repair and a review of all six games. It was prepared in an isolated source tree, with its own loopback origin and runtime. Publishing source does not deploy it to a running host.

- Mahjong cheat sheet: one column inside the narrow sidebar, wrapping claim descriptions, separate fan section, fixed value column, no nested panel frame.
- Shared panels: readable typography, wrapping player names and amounts, visible keyboard focus, and preserved chat draft/cursor, settings focus/value and sidebar/cheat/log scroll position during state updates.
- Mahjong keeps one active sidebar when changing screens. Its own hand wraps into rows on narrow screens with larger mobile tiles.
- Mahjong protocol **v7** notifies a displaced tab and stops its automatic reconnect loop. The newer tab retains the seat and saved credentials. Refresh older Mahjong clients after an approved deployment. Factory shutdown also cancels a pending round.
- Capsa: contained decorative card fan on mobile and a wrapping header, including the recap button.
- Poker: the lobby warm-up panels and summaries fit a narrow screen; numeric summaries and panel headings can wrap.
- Catur/Domino: long names and compact room headings fit their containers.
- Blackjack: flexible card rows, player containers, betting controls and room headings; a focused buy-in draft survives incoming state updates.

## Repeatable checks

Requires Node.js 22+ and the locked dependencies. When the user requests verification, run:

```sh
npm run test:ui
```

The 11 tests cover shared panel order, escaping, hidden cards, draft/cursor/focus and scroll restoration, locked settings, hidden sidebars, bot labels, Mahjong seat replacement and starting a configured Mahjong room. The Mahjong tests bind ephemeral loopback ports and clean up their own sockets/server. They do not contact the running hub or public tunnel.

## Browser checks performed

The six entry pages, waiting rooms and game views were inspected through the browser. Waiting rooms and playing layouts were checked at 320, 390, 768, 1024 and 1440 CSS pixels, with actual viewport size checked for each result. Early viewport attempts targeting a different tab were excluded. Narrow-screen findings were corrected and revisited. The final Mahjong game view has one chat input and no duplicate IDs or horizontal overflow in the inspected panels/hand at all five widths. Scrollable data tables intentionally retain their own horizontal scrolling where needed.

Interaction checks included creating rooms, reconnecting, the Capsa Easy Mode warning/cancel and exit dialog, Mahjong room settings and start/discard, a Catur e2–e4 move, Poker starting with a practice bot, and Blackjack chip validation/start/stand. A separate QA peer sent incoming chat while Blackjack settings were being edited; both the IDR draft and buy-in draft retained their value and focus. All gameplay checks used zero IDR/practice tables. No real payments were made.

Screenshots and raw browser measurements are operator artifacts, kept outside tracked source. No player sessions, tokens or machine-specific runtime are published.

## Limits

These checks are not a proof that every game branch is bug-free. They do not exhaust full matches, every Mahjong claim/score combination, Blackjack split/double/payout combinations, every poker side pot, all browser engines, devices or network interruption scenarios. Treat a new failure report as evidence to investigate. Recheck the affected interaction and screen sizes after changes.
