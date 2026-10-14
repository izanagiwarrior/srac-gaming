# Meja Kita: instructions for coding agents

Read [.agents/skills/meja-kita-games/SKILL.md](.agents/skills/meja-kita-games/SKILL.md) when changing a game, preparing a release, or making this hub available through Cloudflare. These instructions travel with the repository; use paths relative to your checkout.

## Live games and authorization

- Prepare patches in a separate checkout/folder. Never edit the source or static files of a running host: frontend changes can reach players without a restart.
- Every deploy, restart, stop, reload, or switch of an active host/tunnel needs explicit approval for that action/version. A request to patch or push GitHub alone does not authorize a live deployment. Earlier approvals are not standing approval for later versions.
- Finish a reviewable patch first, then show its version, target origin/port, restart needs, and session impact before asking to deploy. Keep active games running while waiting.
- Inspect the actual listener/process and /health before touching a host. Do not assume a previous PID, IP, port, checkout or trycloudflare URL is still current. Use an isolated origin and rooms for preview.
- Capsa, Mahjong, Catur, Domino and Blackjack rooms/scores are RAM state: restart loses them. Backing up files does not save those active rooms. Preserve Poker DATA_DIR/var/poker and any configured private runtime when updating.
- Stop only your own temporary preview during cleanup. Keep a working Cloudflare tunnel if its origin stays the same; replacing it disconnects public visitors and normally changes the temporary URL.
- After a patch/release, report a table with Status, Version, Contents/changes, including Running version and Pending to deploy version. Update running only after the approved deploy and status check succeed. Store local process/URL/approval details under ignored var/, not tracked documentation.

## Consistent games

[docs/GAME-CONVENTIONS.md](docs/GAME-CONVENTIONS.md) defines the required layout, components, creator credits, bot levels, score/rupiah accounting and module structure. Follow it for existing and new games.

- Maintain one public HTTP port, the root landing page, and separate game paths/room/session/WebSocket namespaces.
- Server owns rules, state, legality and accounting. Private hands and deck/hole information stay private according to that game's rules; hints/probabilities use only information visible to their viewer.
- Keep rule variations documented as table rules. Do not call a local variant universally official.
- Do not add or run automated/gameplay tests unless the user asks. Syntax checks, source review, and isolated authoring previews are allowed; report what was and was not checked.

## Repository and runtime

- Never commit player sessions, tokens, credentials, .env, cloudflared binaries/configuration credentials, logs, PIDs, node_modules, preview runtime or machine-specific paths/IPs.
- Use the root package-lock and public dependency registry. Install only when dependencies are missing/changed; do not run install scripts without need/approval.
- Keep Render auto-deploy off unless explicitly requested. This app uses Node processes and RAM rooms; Quick Tunnel routes to that live origin. Do not assume it can be deployed unchanged as a static site or Cloudflare Worker.
- Canonical repo: https://github.com/izanagiwarrior/srac-gaming. For the owner's checkout, use the approved personal izanagiwarrior identity, never the owner's work account/email. Other contributors use their own approved identity; creator credits are not Git author identities.
- Stage only the intended source/docs, inspect the diff and confirm no private runtime is included. Push without force; do not overwrite remote work or discard uncommitted changes to resolve a conflict.
