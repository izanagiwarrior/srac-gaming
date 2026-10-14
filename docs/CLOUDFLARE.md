# Run Meja Kita through Cloudflare Quick Tunnel

This is a **Node server on your computer** forwarded through a temporary Cloudflare URL. The computer, origin process and cloudflared must stay running. It is the same six-game app and WebSocket origin for all friends, even on different networks. This does not upload the server to a Worker or persistent cloud host.

For current vendor behavior/install packages, use [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/), [cloudflared downloads](https://developers.cloudflare.com/tunnel/downloads/), and [run parameters](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/run-parameters/). Quick Tunnels need no account/domain; they have temporary hostnames and no uptime guarantee. Anyone holding a normal URL can reach the exposed game. The origin here uses WebSockets; Quick Tunnel does not support SSE.

## First run on your own checkout

Read AGENTS.md. Get authorization to expose this game origin if the user has not already requested sharing it publicly. Check the desired port before starting; do not kill unrelated listeners to free it.

1. Install Node.js 22+ and cloudflared from the official sources/package managers. On macOS, `brew install cloudflared`; on Windows, `winget install --id Cloudflare.cloudflared --exact`; Linux users can use the official download/package instructions. Do not commit the binary.
2. From the cloned repo, install locked dependencies:

   ```sh
   npm ci --omit=dev --ignore-scripts
   ```

3. Start the origin in terminal/session A. A tunnel-only origin can use loopback:

   ```sh
   HOST=127.0.0.1 PORT=3000 npm start
   ```

   PowerShell equivalent:

   ```powershell
   $env:HOST = '127.0.0.1'
   $env:PORT = '3000'
   npm start
   ```

   Use HOST=0.0.0.0 only when direct LAN access is also intended. Change PORT if occupied and use that same origin port below. DATA_DIR is optional; its default is private var/ in the checkout.

4. Read http://127.0.0.1:3000/health and confirm the intended build and all six games. Do not create rooms on somebody else's active host for a status check.
5. In terminal/session B, create an empty checkout-local config, separate from any personal/company Cloudflare configuration:

   ```sh
   mkdir -p var/tunnel
   touch var/tunnel/quick.yml
   cloudflared tunnel --config var/tunnel/quick.yml \
     --no-autoupdate --url http://127.0.0.1:3000 \
     --protocol http2 --metrics 127.0.0.1:0 \
     --pidfile var/tunnel/tunnel.pid --logfile var/tunnel/tunnel.log
   ```

   Verify quick.yml is empty for this Quick Tunnel; do not overwrite an existing non-empty config without inspecting it. PowerShell can use `New-Item -ItemType Directory -Force var/tunnel` then `New-Item -ItemType File var/tunnel/quick.yml` for a new config, and run the cloudflared arguments on one line. Leave existing ~/.cloudflared credentials/config alone. HTTP/2 is the working default for this office setup; it avoids relying on UDP/QUIC availability.

6. Read the literal https://...trycloudflare.com URL printed by cloudflared; do not construct or reuse an old hostname from docs. Confirm public /health matches local build/games, open the landing page, then inspect an entry page's connected WebSocket status. Share the root URL; friends choose the same game and join its room. Keep both sessions running.

Record origin path/port, build, commit, process/session IDs, literal public URL and approval context in a private operator note or ignored var/deploy-state.json. Avoid tokens/credentials. Those details are machine/session state, not tracked repo configuration.

## Patch an existing host without surprising players

1. Inspect actual processes/listeners and local/public /health. Reuse an existing healthy tunnel pointing to the approved origin.
2. Prepare source in a separate checkout/folder. Preserve current uncommitted source rather than assuming Git HEAD is the running version. Review the patch and dependency lock; snapshot/hash the source being updated.
3. Preview only on a separate loopback port and DATA_DIR. Close/stop just the preview when finished. Do not reload the players' browser tabs.
4. Report Running version and Pending to deploy version. Before live deployment, get fresh explicit approval for that build and restart: Capsa/Mahjong/Catur/Domino/Blackjack RAM rooms and scores will be lost, all game connections briefly drop, and Poker's private saved sessions must be kept. A push to GitHub alone is not approval.
5. After approval, recheck the source base and intended files. Make a private source backup. Stop only the verified hub process gracefully, wait for exit/port release, and back up the final Poker runtime after shutdown. Apply only source files; preserve .git, var/, custom DATA_DIR and existing credentials. Install dependencies only if their inputs changed.
6. Restart the approved source on the same origin/port in a retained session. Keep cloudflared running so the URL can stay the same. Confirm local and public /health show the new build, then inspect landing/entry WebSocket status without playing a match. Save a screenshot/status evidence. Only now label Running version as updated.
7. Record the resulting commit/build and runtime state privately. Refresh clients and create new RAM rooms. Rollback/restoration of an active host is another interrupting change; get approval before it unless the current authorization explicitly includes that recovery.

## If something fails

- Public 502 / connection refused: inspect origin /health and the tunnel's actual origin port. Do not restart everything indiscriminately.
- Public health works, game won't connect: inspect HTTPS/wss game-specific path and server/browser version. Refresh the client after an approved protocol update; don't weaken Origin checks to bypass a problem.
- QUIC/UDP cannot connect: keep/use --protocol http2 and inspect the real error. Do not alter office router/firewall policies for this game.
- Existing Cloudflare config interferes: use a verified empty repo-local --config file. Do not remove/rename the user's account config or certificates as a shortcut.
- Quick Tunnel limit/availability: each tunnel supports at most 200 in-flight requests and may return 429. Use the vendor's current documentation for limits. This setup is for small casual sessions, not an uptime promise.
- Stopping cloudflared breaks public access but leaves the local/LAN game running. Creating a replacement generally changes the hostname; update friends with the new literal URL only after it works. Stopping/replacing a tunnel used by players requires approval.
