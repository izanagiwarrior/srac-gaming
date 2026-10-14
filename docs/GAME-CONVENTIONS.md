# Game structure and shared components

## Room layout

Keep the playable board/table and turn/actions on the left. The right sidebar uses this order in the DOM and visually:

1. Chat meja: messages and input at the top, accessible without scrolling to the bottom of the game.
2. Cheat sheet: rules/rankings with card/tile/piece examples where useful. It explains the rules; it must not expose hidden information.
3. Rekap poin & rupiah: each player's score/net, selected rate, active/unsettled status, and CSV or existing detailed recap access.
4. Log permainan: server-confirmed actions/results in a scrollable history.

A game-specific helper, such as Poker river probabilities, may sit after the cheat sheet. Supplemental host settings may follow the standard four panels; main turn controls stay beside/below the playable area. At small widths the sidebar becomes one stack below the game in the same order. Use readable contrast, labelled inputs, visible keyboard focus, and text/badges alongside color. Preserve chat drafts/focus and the user's reading position when state updates.

Shared code: public/game-tools.js renders sidebar/chat/cheat/recap/CSV and credits; public/hub-game.css supplies common layout. Capsa retains native panels with the same order and required components. Preserve existing detailed recaps, guides, game downloads and hand/reveal behavior when adapting a view. Do not add page-local copies of a shared component just to change labels or colors.

## Creator credits

Show the creator on both the landing card and inside the game (landing/lobby/play/results):

| Game | Public path | Creator |
| --- | --- | --- |
| Mahjong | /mahjong/ | Hendy W |
| Poker | /poker/ | Hendy W |
| Capsa Banting | /capsa/ | Faiz T |
| Domino Gaple | /domino/ | Faiz T |
| Catur | /catur/ | Faiz T |
| Blackjack | /blackjack/ | Faiz T |

For a new game, obtain its creator from the user; keep this table and MejaTools.creators aligned. Names here are product credits, not permission to impersonate someone in Git commits.

## Bot behavior

Every game exposes Easy / Normal / Hard. Each level must change actual decisions, not merely its label or timer. Bots wait at least 3 seconds before actions so players can follow the game. Difficulty affects player bots, not fixed dealer/rule behavior. Use only the bot's hand and public information; never use the opponent's private hand or future deck to select a move. Describe the implemented heuristic and remaining limits, rather than inventing an engine strength rating.

## Poin, chips and rupiah

Each game lets the host set an integer IDR value per point/chip in the lobby, including 0 for practice. Settings lock on the server when play starts. Inputs save without a separate Pasang step; Start includes the displayed values so a missed blur/save cannot revert the user's choice. Reject invalid values before starting.

The server records each completed result once. Keep active stakes distinct from settled net; changing a screen, rebuying, reconnecting or retrying an action must not manufacture a profit or duplicate a payout. Rebuy increases both stack and bought chips. CSV uses escaped cells, excludes tokens/private state, and explains any provisional amount. Bot tables' monetary values are simulation.

| Game | Current scoring convention |
| --- | --- |
| Capsa | Losing players lose one point per remaining card; the winner receives the sum |
| Mahjong | Existing fan scoring, 1 fan = 10 points per payer, with zimo/discard payer rules |
| Poker | Net = stack + unresolved contributed chips − bought chips; final after pot awards |
| Catur | Win +1 / loss −1 / draw 0, including resignation or leaving during play |
| Domino | Losers lose remaining pips; winner receives the pool. Tied winners split, with leftover points by seat order |
| Blackjack | Net = stack + unresolved hand stakes − bought chips; dealer net is the opposite total player net |

Domino's pip convention is common in [Gaple](https://www.pagat.com/domino/line/gaple.html), which has multiple variants. For this hub, a player emptying their hand wins; a blocked table compares the **sum of dots**, not the number of tiles. The hub's high-double opener, drawing stock for fewer players, tied winners, and winner-pool accounting are documented table choices, not a claim that every detail is universally official. Do not silently change those variants while patching another feature.

Mahjong Fast mode and completed-hand highlight are room choices made before play. Lock both in the server until a new room; default fast OFF / highlight ON. Highlight only complete Chow/Pung in the own hand, not claim possibilities from a discard. Shared tiles can belong to alternative sets; explain that those alternatives may overlap.

Poker category percentages use the own hole cards plus visible board to describe the best five-card category at the river. Keep categories exclusive and show whether calculation is exact or sampling. Do not use hidden opponent cards, imply certainty from sampling, or present category probability as a guarantee of winning.

## Module structure and integration

- Use games/<module>/server.js for a factory owning rooms, rules/accounting, timers and WebSockets. It returns an unbound HTTP server plus close() resources; only root server.js listens on the public port.
- Keep client.js, index.html, styles and visual assets in that module's public/; use engine.js for reusable rule/evaluation functions where useful. Give the game a README with its actual rules, scoring, disconnect behavior and checks performed.
- Register the HTTP route, asset allowlist, WebSocket upgrade route and /health game entry in root server.js; add the landing card and creator. Use /<slug>/ws and a unique browser storage prefix. Never share rooms or tokens between games.
- Server validates turn, phase, actor/host, selected IDs, input ranges and state revision. Send each viewer only their allowed state; return explicit errors for stale/illegal actions. Spectators cannot play or change settings. Preserve reconnect behavior and limits on rooms/messages.
- Use an explicit asset allowlist. Do not serve repository files, runtime, credentials or arbitrary paths. Keep same-origin WebSockets compatible with both local HTTP/ws and tunnel HTTPS/wss. Stop owned timers/sockets on close.
- No new dependency unless it supports the requested feature. Preserve root lockfile and the six existing games. Check source diff and syntax; only run gameplay/automated tests if requested. Any authoring preview uses its own port, rooms and DATA_DIR.
