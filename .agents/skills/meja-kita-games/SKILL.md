---
name: meja-kita-games
description: Patch or extend the Meja Kita multiplayer game hub with consistent game components, or publish its source and run it through Cloudflare Quick Tunnel. Use for this repository's game and deployment work.
---

# Meja Kita games

Read the root AGENTS.md. Treat the human's current instructions as the source of authorization; this skill never grants permission to publish, expose, or interrupt a running game.

## Change a game

Read [docs/GAME-CONVENTIONS.md](../../../docs/GAME-CONVENTIONS.md). Reuse public/game-tools.js and public/hub-game.css for the room sidebar and game credits, and games/shared/table-settings.js for point value and difficulty validation where appropriate. Preserve each game's private state and existing rule variations.

Prepare the patch away from the served checkout; keep its base/source manifest outside deployable files. Bump the hub build/package when publishing new behavior and include any game protocol change that requires clients to refresh. No gameplay/automated tests unless requested. Check JavaScript syntax and inspect the representative UI on a separate loopback origin; identify remaining verification limits.

## Make it available online

Read [docs/CLOUDFLARE.md](../../../docs/CLOUDFLARE.md) for first-run setup, safe updates, and status checks. This repository runs one Node origin; Quick Tunnel forwards HTTPS/WebSockets to it. Keep origin and cloudflared in separate retained sessions.

Before exposing a new origin, ensure the current human has authorized public sharing of that game service. A Quick Tunnel URL gives access to its holder. Use only the approved origin/port; do not expose other local apps or alter the user's existing Cloudflare credentials/config.

For this owner's game, prefer the Cloudflare link with the necessary loopback Node origin instead of a separate LAN host. An instruction to start the installed build is not approval to install a pending build. Quick Tunnel is not hosting independent of the laptop; do not begin a hosting migration without a separate request.

For an existing host, finish the patch and backup plan before requesting the new deploy approval. Verify the base hasn't changed. Preserve Poker runtime, apply only intended source, stop only the verified hub process after approval, and start the selected build on the same origin. Keep an existing healthy tunnel to preserve its URL. Verify local/public /health agree and the page/WebSocket connection works; do not create rooms on the live host just to check status.

## Publish and hand off

GitHub push and running-host deployment each require their own explicit current authorization. Neither authorizes the other, and prior approvals do not carry forward to later work. A clear request for the specific action is authorization; do not ask twice for the same action. Verify the selected repo/account, source diff and ignored runtime; commit under the user's approved identity and push normally. Confirm the remote branch matches the intended commit before claiming success.

Return the repo, literal live URL, commit/build, and Running version / Pending to deploy version table. Record private process state in ignored var/ or the operator's workspace. A failed push/deploy remains incomplete; describe the concrete error and preserve the working host/data.
