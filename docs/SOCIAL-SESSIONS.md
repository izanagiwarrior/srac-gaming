# Shared lobby, saved rooms and device preferences

Build `2026-10-15-social-save-2` / package 1.4.1 adds the same room controls to all six games. The hub still needs a running Node origin and internet connection; saving does not keep a sleeping laptop online.

## Players

- Set a nickname once in the landing page. Existing game entry fields use it; changing a name when joining updates the shared browser preference.
- The shared lobby lists open rooms with an online human, the game, player nicknames, capacity, phase and spectator count. It refreshes every five seconds while visible. No hands, deck, tokens, recovery files or local paths are listed.
- The host can lock a room. A locked room is omitted from the directory and new joins are rejected even with its code. Existing seat tokens can reconnect. Locking is an invitation control, not an identity-verification system.
- Spectators can chat and queue for the next round. Poker now also supports spectators and keeps hole cards private. Spectators cannot take gameplay actions or edit settings.
- A seated player can volunteer their seat. At a completed-round boundary, the host uses **Main lagi & rotasi**. Online queued spectators fill bot seats, volunteered seats, departed Catur seats, or unfilled capacity. No active hand is interrupted. Disconnected people keep their place in the queue but are skipped until online.
- A player giving a seat keeps their balance/account and becomes a spectator. A returning funded spectator uses their existing account; a new Poker/Blackjack player receives exactly one configured initial buy-in. Retired bot accounts remain in the recap. Detailed Poker accounting, shared recaps/CSV and Capsa history keep account ownership instead of assigning old results to the new seat occupant.
- The shared host button starts the next round once seated human players are connected. Existing Catur/Domino consent buttons still work without a waiting queue. When a queue exists, those buttons direct players to the host's shared rotation button. Account settings/rates stay locked after play starts.

## Saving and recovery

### Continue a saved seat or switch rooms

- All six games show **Lanjutkan atau ganti room?** on a fresh page when a seat is saved. The popup names the previous room and any different invitation code. It appears before reclaiming the old socket; merely opening a different invitation does not silently discard the old token or take over another tab.
- **Lanjutkan room …** reclaims that seat. A temporary WebSocket interruption within the same page reconnects automatically to the same seat without repeating the startup choice.
- **Keluar dulu & pindah ke …** first authenticates the old seat, sends its native leave command, and waits for the server's `left` acknowledgement. Only then is the current seat credential removed and the entry form restored with the destination code. The player clicks **Gabung** to enter that room. The shared Meja toolbar also offers **Keluar / ganti room**.
- **Tutup dulu** or Escape only dismisses the popup. An inline reminder remains, and another create/join attempt opens the choice again. Disconnects, timeouts, version errors and transient failures never count as proof that the seat is gone. If connectivity drops during an explicitly confirmed leave, reconnect authenticates that same seat to finish leaving. A server response marked `sessionUnavailable` allows removal of an expired/unknown saved seat; there is still no automatic join or replacement account.
- Explicit leave follows each game's existing rules: an active Catur game counts as resignation; Poker keeps account totals and checks/folds the hand; active seats in the other games pass to bots. The popup describes these effects. Spectators leave their viewing session. This feature does not change payouts, rules, disconnect timers or private views. Poker's manually chosen **Return to saved room** backup remains available after explicit leave and does not auto-resume.
- Saved ownership is browser/origin specific. The popup cannot discover a seat created in another browser or on a previous Quick Tunnel hostname unless its private recovery file is imported.

### Private snapshots

- The hub writes six private snapshots under `DATA_DIR/rooms/<game>.v8` (default `var/rooms/`). Writes use a mode-0600 temporary file, file fsync and atomic rename. A snapshot is written before broadcasting changed state; a five-second sweep also captures cleanup. Identical snapshots are not rewritten. Save failures are shown in the room controls and logged.
- Snapshots include the current deck/wall, private hands, turn/claim state, scores/chips, history/chat, host, session tokens, queue and lock. They never serialize sockets, timer handles or callbacks. v8 serialization preserves Sets and shared Mahjong tile references; Catur reconstructs from PGN including move history, Poker from its explicit Game serializer.
- After a restart, an unfinished saved round is **paused**. Bots, claim transitions, dealer actions and Capsa deadlines stay stopped until seated human players reconnect and the current host selects **Lanjutkan sesi**. Capsa gets a fresh 60-second deadline after resuming. A completed round/lobby needs no artificial paused turn.
- Mahjong claim resolution and kong replacement draws have explicit resumable phases. A pending discard undo window expires on restart. The Mahjong client protocol is v9 in the emoji/manual-claim release; older pages must refresh after approved deployment.
- Saved seat credentials stay in the original browser. **Simpan file pemulihan** downloads one private JSON file for the viewer's own token. The landing-page import validates its schema/size and restores that seat without putting the token in a URL, room list, chat, or CSV. This file is needed if a new Quick Tunnel hostname changes browser origin. A normal invitation link gives friends the room, not ownership of your seat.
- Fully abandoned rooms are retained for seven days before existing maintenance removes them. Archives are bounded to 128 total accounts per room and existing per-game connected-spectator limits. Back up private runtime separately if longer retention is needed. Local disk loss, user deletion or disk-write failures are not solved by a browser token.

### First upgrade and Poker migration

The previous UI-polish build stores Capsa/Mahjong/Catur/Domino/Blackjack active rooms in RAM. Installing this build cannot recover those pre-upgrade RAM rooms; the first approved restart still ends them. Persistence begins for rooms running this build.

Poker's existing `DATA_DIR/poker/sessions.json` is read on first migration. When no new Poker snapshot exists, those rooms are imported into the shared save and resumed paused when unfinished. The legacy file is preserved; the managed hub then uses the new snapshot as canonical and does not keep overwriting the legacy file. Standalone Poker retains its native save behavior. Preserve **the entire DATA_DIR**, including legacy Poker data and rooms/, when updating. An older build does not understand the new shared snapshots: rollback needs an explicit data migration/review, not copying old source over current runtime.

## UI and feedback

- Shared `public/room-client.js` and `public/room-ui.css` provide room controls, per-browser nickname/seat recovery, collapsible sidebar panels, sound, volume and reduced animation. Each game passes server messages to MejaRoom.receive and its existing send function to the shared controls.
- Sound defaults to off. Audio is synthesized locally through Web Audio only after a user gesture; there are distinct turn, play, result and chat tones. No audio files or external services are needed. Capsa/Mahjong native sound buttons use the same preference, avoiding duplicate turn sounds.
- Reduced animation defaults to the OS preference and can be changed for this browser. Capsa combination particles respect it. Sidebar folds retain their state after native rerenders. Mobile forms/actions have readable inputs, wrapping controls and sticky primary card actions where the game's layout supports them.

## Game adapters

Each factory registers `setRoomService`, `capacity`, `restoreRoom`, `setSpectator`, `broadcastRoom`, `resumeRoom`, and `nextRound`. Catur and Poker provide explicit export/restore methods; the other rooms use the shared resource-free serializer. `admit`, `onRotation` and `checkNext` handle game-specific seat/account requirements. The shared service handles only lifecycle and access; native game modules still validate moves, turns, accounting and private views. The service adds viewer-specific public `hub` metadata; it never broadcasts the stored snapshot.

## Checks and limits

Source review, JavaScript syntax checks and isolated authoring previews are recorded in the operator patch notes. No new automated or gameplay tests were requested for this patch. Full-match recovery, kill/crash recovery, every money/side-pot/rotation branch, audible output and physical mobile devices have not been verified. Existing UI tests describe the earlier UI-polish release; do not claim their earlier passing result verifies these new features. Only run/add tests when the user asks, per AGENTS.md.

## Mahjong claim-mode compatibility (protocol v9)

The emoji/manual-claim release adds settings.claimMode with manual / assisted / fast. Old saves without it map autoPass true to fast and false to assisted. Existing pending option data is retained and assigned a claim-window ID if absent. New manual windows persist generic manual:true options for humans; they never precompute/disclose their availability. ID-bound attempts are validated only on submission; invalid attempts do not consume tiles or a pending answer. Bots keep computed options and native priorities. Host mode/highlight lock and paused recovery remain intact. Refresh old clients after installation; older pages cannot attach to the v9 server.

## Shared emote feedback (1.5.1)

The twelve-button palette uses each game’s existing chat channel, including spectators. New emoji chat entries carry a unique server ID and emoji flag. The shared client seeds its seen-ID cache on join/history/reconnect; fresh accepted messages trigger a temporary translucent effect, while reloads, old history, other-room history and Capsa rollback never replay it. No emote timers or DOM effects are saved. Disconnect/leave, hidden pages and preference changes clear current visuals. At most three bursts and twelve particles each are rendered, with a 900ms local send cooldown; reduced motion shows only one static emoji briefly. The overlay cannot consume board/card/action clicks and does not expose private hands or change accounting.

## Floating user chat (1.5.2)

Fresh accepted text chat from seated people and spectators floats faintly along the table edges as well as remaining in Chat meja. The shared renderer uses the same server IDs and history seeding as emotes; system messages and old history do not float. At most three visible bubbles remain for five seconds (two on a short table); reduced motion uses one static four-second bubble. Names and bodies are literal text and the floating copy clamps to three lines; full content stays in the sidebar. Chat and emoji overlays have independent expiry but share cleanup on leave, disconnect, hidden pages, preference changes and Capsa undo. No new protocol or native game-rule change is needed.

## Compact emoji menu (1.5.3)

All six games place a smile toggle between chat input and Send. The twelve emoji choices appear only after opening it; selecting closes it immediately and refocuses the preserved text draft. Outside click/Escape/close and room/disconnect cleanup also dismiss it. A single body-level popover avoids clipped sidebar scrolling and tracks the current visible toggle after native view rerenders. Server chat, IDs, message history, reactions, floating text, game rules and save format are unchanged.

## Browser theme (1.6.0)

The shared Dark / Light controls are always visible in the room toolbar on the landing and six games. Dark is the default, independent of device color preference. A choice uses localStorage mejakita.theme and syncs between tabs of the same origin; blocked storage still allows a temporary current-page choice. This replaces Poker's separate theme control/key without modifying its saved seats. The head script applies the choice before paint, sets native color-scheme, and updates the browser theme-color. Switching themes changes CSS only; cards, selected moves, drafts, rooms and money stay unchanged. Temporary chat/emoji feedback and the picker close on theme changes, without replaying history.

## Quick Play dan jam Catur

Mode singkat disimpan dalam settings room. Capsa/Mahjong memakai jumlah ronde 1; Poker/Domino/Blackjack memakai `playMode: quick`; Catur memakai `clockMode: blitz5` atau `blitz3plus2` (default `casual`). Legacy room tidak diubah menjadi Quick Play. Poker Quick Play mencapai phase ended saat satu tangan settled; tombol main lagi/rotasi harus tetap menghormati projected funding dan antrean.

Clock Catur menyimpan anggaran `remaining` per warna dan increment. Export mengurangi waktu yang telah berjalan lalu menyimpan jam dalam keadaan jeda; `clockTimer` adalah transient. Recovery menunggu pemain kembali dan host melanjutkan. Tidak menghitung downtime sebagai waktu bermain dan tidak menambahkan increment untuk langkah ilegal, reconnect atau resume.

## Bubarkan ruang (1.8.0)

- Host terhubung dapat membubarkan ruang dari toolbar bersama di semua fase, termasuk recovery/lobby. Dua langkah: buka dialog, lalu konfirmasi untuk code + roomId yang ditampilkan. Pembubaran hanya berlaku untuk satu room/game, tidak menghentikan server atau room lain.
- Server memeriksa host saat ini, person.ws, room object, code, roomId dan confirm:true. Field hub.roomId adalah identitas instance publik untuk mencegah konfirmasi usang, bukan credential. Token sesi tetap privat.
- Snapshot format 1 mendapat field tambahan closedCodes dan archives (opsional bagi snapshot lama). Penghapusan room + pencadangan kode ditulis atomik terlebih dahulu. Disk error menolak pembubaran tanpa mengubah pemain/timer. Setelah berhasil, room dihapus dari Map, timer dibersihkan dan seluruh socket dilepas dari room tanpa menjalankan aturan leave. Kode di closedCodes tidak dipakai allocator baru, tidak dimuat dari daftar room lama dan ditolak sama seperti room tidak ditemukan.
- Client menerima room-dissolved sebagai native left yang diketahui alasannya; semua UI game/overlay dan kredensial sesi room itu dibersihkan setelah konfirmasi server. WebSocket tetap tersedia untuk membuat/gabung room baru. Rejoin/resume offline mendapat sessionUnavailable + dissolved; shared handler mengembalikan ke entry juga, termasuk S Poker dan backup last-seat. Link room baru yang sudah dipilih tetap disiapkan di input, tanpa join otomatis.
- Pembubaran membatalkan ronde/tangan aktif tanpa menambah hasil, menentukan pemenang, refund atau payout buatan. Hasil selesai tidak dihitung ulang. Snapshot privat menyimpan paling banyak 200 ringkasan pembubaran: nama/bot, nilai poin, skor/stack/buy-in/contributed terakhir dan ledger hasil yang sudah dicatat; unfinished menandai angka yang belum settled. Ringkasan tidak memuat token, deck/tangan atau snapshot yang dapat direstore, dan tidak diterbitkan lewat directory/API/UI. Unduh rekap sebelum bubar jika perlu salinan pengguna. closedCodes dipertahankan tanpa retensi 200 tersebut.
- Simpan seluruh DATA_DIR. Menghapus data privat atau rollback ke build lama dapat menghilangkan pencadangan kode; migrasi/rollback harus menjaga daftar closedCodes, bukan memulihkan room yang sudah dibubarkan dari backup lama. Tidak mengubah legacy Poker file; snapshot shared tetap canonical sehingga legacy tidak diimpor ulang ketika snapshot kosong dari room aktif.
- Pemeriksaan default hanya sintaks/source dan preview dialog yang dibatalkan. Jangan mengklaim pembubaran multiplayer, penolakan nonhost, restart persistence atau failure injection sudah diuji jika belum diminta.
