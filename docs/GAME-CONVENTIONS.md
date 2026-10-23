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
| Mahjong | New HK rooms: 3–10 fan/payment ladder per Mahjong README; old legacy rooms retain 1 fan = 10 points and their original payer rules |
| Poker | Net = stack + unresolved contributed chips − bought chips; final after pot awards |
| Catur | Win +1 / loss −1 / draw 0, including resignation or leaving during play |
| Domino | Losers lose remaining pips; winner receives the pool. Tied winners split, with leftover points by seat order |
| Blackjack | Net = stack + unresolved hand stakes − bought chips; dealer net is the opposite total player net |

Domino's pip convention is common in [Gaple](https://www.pagat.com/domino/line/gaple.html), which has multiple variants. For this hub, a player emptying their hand wins; a blocked table compares the **sum of dots**, not the number of tiles. The hub's high-double opener, drawing stock for fewer players, tied winners, and winner-pool accounting are documented table choices, not a claim that every detail is universally official. Do not silently change those variants while patching another feature.

Mahjong claim mode (manual, assisted, fast) and completed-hand highlight are room choices made before play. Lock both in the server until a new room; default assisted / highlight ON. Manual mode gives every connected human the same unfiltered claim controls, computes no human availability in advance, and validates the actual selected tiles/Hu only on submission. Invalid attempts leave the hand and pending choice intact; assisted mode retains its prechecks, fast mode retains automatic passes. Highlight only complete Chow/Pung in the own hand, not claim possibilities from a discard. Shared tiles can belong to alternative sets; explain that those alternatives may overlap.

Poker category percentages use the own hole cards plus visible board to describe the best five-card category at the river. Keep categories exclusive and show whether calculation is exact or sampling. Do not use hidden opponent cards, imply certainty from sampling, or present category probability as a guarantee of winning.

## Module structure and integration

- Use games/<module>/server.js for a factory owning rooms, rules/accounting, timers and WebSockets. It returns an unbound HTTP server plus close() resources; only root server.js listens on the public port.
- Keep client.js, index.html, styles and visual assets in that module's public/; use engine.js for reusable rule/evaluation functions where useful. Give the game a README with its actual rules, scoring, disconnect behavior and checks performed.
- Register the HTTP route, asset allowlist, WebSocket upgrade route and /health game entry in root server.js; add the landing card and creator. Use /<slug>/ws and a unique browser storage prefix. Never share rooms or tokens between games.
- Server validates turn, phase, actor/host, selected IDs, input ranges and state revision. Send each viewer only their allowed state; return explicit errors for stale/illegal actions. Spectators cannot play or change settings. Preserve reconnect behavior and limits on rooms/messages.
- Use an explicit asset allowlist. Do not serve repository files, runtime, credentials or arbitrary paths. Keep same-origin WebSockets compatible with both local HTTP/ws and tunnel HTTPS/wss. Stop owned timers/sockets on close.
- No new dependency unless it supports the requested feature. Preserve root lockfile and the six existing games. Check source diff and syntax; only run gameplay/automated tests if requested. Any authoring preview uses its own port, rooms and DATA_DIR.

## Shared room lifecycle

Follow [SOCIAL-SESSIONS.md](SOCIAL-SESSIONS.md). The room toolbar provides lock, private recovery download, queue/volunteer controls and host continuation at completed-round boundaries. The right sidebar keeps its existing order and gains persistent folds. New games must implement the room-service adapter, persist only game data, restore paused without running bots, and keep account balances with people when seats change. Do not expose private save snapshots or tokens in directory/API/chat/CSV.

Use the shared saved-session choice before restoring a seat on a fresh page. Each client calls MejaRoom.connected(savedSeat, send, onEntry), MejaRoom.disconnected(), gates every send with MejaRoom.outgoing, and respects consumed messages from MejaRoom.receive. A different invitation must preserve the old seat until the player chooses to leave and the server acknowledges it. Only explicit authentication/room expiry responses carry sessionUnavailable; rate limits, version errors and transport timeouts do not. Keep automatic same-page reconnect and native account/leave rules intact.

## Collapsible sidebar panels

Use the shared Buka/Lipat button for each sidebar panel. The enhancer marks exactly its top-level heading/header with data-mk-panel-header; collapsing hides every other direct child, including content containing nested subheadings. Do not use the presence of h2/h3 inside content as a reason to keep it visible. Keep the outer panel as the single disclosure control, retain its state after native rerenders, and synchronize its text and aria-expanded. Capsa uses the same behavior for chat, cheat sheet, recap, log, round history and bot controls.

## Shared emotes

Reuse MejaTools.emojiBar and MejaRoom.emote for the twelve shared reactions. Keep emoji:true and a unique server-generated chat id in accepted messages; never animate optimistically before acknowledgement. MejaRoom.receive feeds the shared effects renderer. All viewers, including spectators, see only new accepted emotes from their room. Seed history without effects on join/reconnect and do not replay history or rollback. Keep pointer-events:none, low opacity, table-bound clipping, a 900ms send cooldown, at most three 3-second bursts and 12 particles per burst. Reduced motion uses a short static reaction; clear effects on leave/disconnect, hidden pages and preference changes. Do not introduce camera shake, flashes, sounds, a new public endpoint or game-rule changes for reactions.

Ordinary accepted user chat also uses the shared receipt renderer: translucent edge bubbles with sender and up to three lines, while retaining the full sidebar history. Render at most three for five seconds (two on a short table); use one static four-second bubble under reduced motion. Use textContent for sender/body, no HTML, links, click targets or extra live announcements. Keep stable perimeter lanes, table/viewport-column clipping and independent cleanup from emoji bursts. Seed history and skip system messages; the same room/reconnect/undo/reset rules apply.

## Emoji picker

Use MejaTools.emojiPicker for a disclosure toggle between the chat input and Send in every game. Keep the twelve-button palette closed by default in one body-level popover so sidebar overflow cannot clip it. Selection sends one native emote, closes immediately and returns focus to the unchanged draft. Outside click, Escape, explicit close, leaving and disconnect close it; Escape must not trigger a board/card shortcut. Keep type=button for toggle/choices and an explicit type=submit for Send. Preserve expanded state/position across native rerenders, viewport changes and scrolling. Clamp the popup to the viewport, provide accessible names/aria-expanded/aria-controls, keyboard focus and 44px choice targets; no new dependencies.

## Shared Dark / Light theme

Load /theme.js synchronously after charset and /theme.css after native styles on every entry document. Default is explicitly dark regardless of OS/browser color preference; never reset the shared choice from a native game client. Reuse the Dark/Light group in the shared room toolbar and store only the browser preference at mejakita.theme, independent of room/session credentials. Keep selected aria-pressed, focus, touch targets, storage-failure fallback and cross-tab updates. Theme changes must not rerender/reset games or submit actions. Use --mk-* tokens for body-level popovers/shared controls, with explicit foreground and background in both themes. Preserve legible face/felt colors; do not invert the whole page or filter cards and images.

## Durasi dan Quick Play

Sediakan pilihan singkat di lobby sebelum host memulai: Capsa/Mahjong/Domino/Blackjack 1 ronde, Poker 1 tangan, Catur Blitz 5+0 atau 3+2. Pilihan dikunci ketika bermain; room lama tetap memakai durasi/settings yang tersimpan. Jangan mengaktifkan Fast/auto-lewat Mahjong karena Quick Play dipilih. Jangan mempersingkat jeda bot 3 detik. Durasi singkat berakhir setelah settlement, bukan dengan memotong tangan atau payout. Main lagi harus eksplisit; saldo kumulatif dan aturan antrean/rotasi tetap berlaku.

Jam Catur berada di server; klien hanya menampilkan estimasi dari sampel terbaru tanpa mengirim tick atau mengubah hasil. Bekukan jam pada disconnect/recovery, simpan sisa waktu tanpa handle timer, dan pastikan timeout/move/resign hanya mencatat satu hasil.

## Pembubaran ruang

Semua game memakai tombol host **Bubarkan ruang** di kontrol Meja bersama, bukan salinan per game. Tampilkan kode dan akibatnya dalam dialog, fokus awal pada Batal, dan tunggu balasan server sebelum menghapus sesi browser. Host saat ini, socket pemilik sesi, kode dan roomId harus cocok pada saat eksekusi; penonton/pemain lain tidak boleh membubarkan ruang. Konfirmasi lama tidak berlaku setelah room/hak host berubah.

Pembubaran menghapus room aktif, memutus ikatan seluruh socket tanpa native leave (tidak mencatat resign/fold/payout baru), menghentikan semua timer termasuk jam Blitz dan transisi klaim, dan mengirim notifikasi literal ke semua peserta/penonton. Kode yang dibubarkan dicadangkan di snapshot privat agar undangan/token lama tidak bisa hidup lagi setelah restart atau dipakai room baru. Setiap allocator native harus memeriksa service.hasCode. Resource milik factory yang tidak tercakup timer room dibersihkan melalui disposeRoom. Jika penulisan penghapusan gagal, pertahankan room dan beri error; jangan menampilkan sukses.

## Hong Kong Mahjong (1.9.0)

New rooms use the documented HKMA core scoring/deal profile; old snapshots without ruleset remain legacy. Flowers are public bonus tiles replaced from the wall tail, never meld tiles. Joker and flower fan options are explicitly local variants and OFF by default. Respect minimum3/max10 fan, the documented payment ladder, Pao, and viewer-specific server Hu eligibility. Opening phase is server-owned, default animated, host-skippable by current opening ID, paused on recovery, and cleared on disposal. No tile identities from the wall or other concealed hands may enter opening messages. Render only public occupancy/counts/dice; preserve shared sidebar and reduced motion.

## Cloud runtime adapter (2.0.0)

Keep game rules authoritative in the existing six factories. Cloud-only transport/filesystem/timer adapters live under cloudflare/, bound by scripts/build-cloudflare.mjs; never import them into the ordinary Node target. The room service accepts optional synchronous persistence and a disabled periodic-save interval for the cloud target. Preserve Set/shared references and private per-viewer messages; only whitelisted public assets go into Workers Assets. Keep one small hub actor, owned timer cleanup, checkpoint-before-publish, closed-code reservations and paused recovery on cold restore. See CLOUDFLARE-WORKERS.md for limits and release rules.

## Lobby order and visible room controls

- Keep the room identity and primary actions visible outside collapsed panels: room code, **Salin link undangan**, **Salin kode**, **Keluar / ganti room**. Use the shared room-client component; do not require opening an ambiguous “Meja CODE” section to invite a friend. Preserve the native confirmation/leave acknowledgement. Clipboard unavailable/denied must show the text/link to copy.
- Theme controls occupy a separate row. They must not cover invitation or leave controls. Preferences/host management can fold under a clear title; recovery status and required recovery action remain visible.
- Order stable/simple settings before expanding content: **duration/clock → point/chip value → simple play/bot choice → Customize details**. Expanding a variant should grow below those primary controls. Do not recreate or reset a room to change a visual section.
- Put lobby settings in the main area before the board; the sidebar keeps Chat → Cheat sheet → Recap → Log. After Start, rule controls remain locked by the server.
- For complex games show the current ready-to-use configuration and a Customize disclosure. Mahjong has real server presets; do not pretend a client-only UI disclosure is a new authoritative preset. Existing Poker/Capsa/Blackjack values remain valid when Customize closes. All controls still exist in the DOM so Start reads their complete values.
- Reuse MejaRoom.customize(key,label,trustedInternalHTML) for per-room open-state preservation across native rerenders. Never pass player text as raw HTML. Preserve focus/drafts on settings/chat acknowledgements. Labels explain units and any house-rule variation.
- No new automatic deploy/push or automatic reset to default settings follows from these conventions.
