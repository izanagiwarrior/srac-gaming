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
- Mahjong claim resolution and kong replacement draws have explicit resumable phases. A pending discard undo window expires on restart. The client protocol is v8; older Mahjong pages must refresh after approved deployment.
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
