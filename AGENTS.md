# SRAC-Gaming: instructions for coding agents

## Read first

1. [Maintenance and current handoff](docs/MAINTENANCE.md): deployed baseline, workflow, architecture, known verification gaps and next-agent checklist.
2. [Repository skill](.agents/skills/meja-kita-games/SKILL.md): implementation/release workflow.
3. [Game conventions](docs/GAME-CONVENTIONS.md) and [sessions/storage](docs/SOCIAL-SESSIONS.md).
4. For hosting, [Cloudflare Workers](docs/CLOUDFLARE-WORKERS.md); for game changes, that game's README. [Quick Tunnel](docs/CLOUDFLARE.md) is a separate legacy option.

## Current baseline — 23 October 2026

- Public hosting is **Cloudflare Workers + SQLite Durable Object**, package **2.0.0**, build **2026-10-23-cloudflare-hosting-1**: https://srac-gaming.faiz-triputra.workers.dev/ . It does not need a laptop, Node origin or tunnel.
- This is the last confirmed deployment, not proof of current availability. Check actual public /health before reporting live status. A commit hash alone does not identify the currently dirty development source or a deployed bundle.
- The owner's `SRAC-Gaming/staging` is the development/Git checkout. Sibling `live` is legacy Node hosting-only (last installed 1.8.0); preserve it and its private runtime. Cloud deployment does not update it. Do not pull, merge, commit or push there, or bypass its Git hooks. Other contributors use their own development checkout and cloud account.
- This 2.0.0 source release includes Hong Kong Mahjong, game-entry names, Workers hosting and maintenance documentation. Inspect actual Git status and remote history to confirm publication; do not discard local changes. Documentation changes do not require a runtime version bump or deployment.

## Authorization and active players

- Prepare patches in staging or another isolated checkout, never served files. Static edits can reach players without a restart. No symlinks/hardlinks/watchers connecting staging and a served Node live tree.
- Patch, GitHub push, cloud deployment, Node release, start, stop, restart and reload are separate actions. Each publishing/hosting action requires the human's current explicit authorization for that action/version. Earlier approval is not standing permission. A clear current instruction is approval; do not ask for it twice.
- Complete a reviewable candidate first. Before a new deployment approval, explain exact build, included patches, destination and impact: sockets may disconnect and unfinished rooms may pause until reconnect/host resume. Keep active matches running while awaiting an answer.
- Starting an installed build is not permission to install pending patches. Never silently deploy while fixing a bug, preparing documentation, building, or pushing GitHub. Keep automatic Git deployments off.
- Default online target is Workers. Do not start LAN/Node/cloudflared or change DNS, billing, plans, accounts or data as a side effect. Quick Tunnel requires a separately authorized Node origin and laptop.
- Preserve cloud SQLite, actor identity, migration history, closed-code reservations and accounting. Preserve the entire legacy Node DATA_DIR, including rooms/ and poker/. No resets, namespace deletion, old-save upload, destructive sync or rollback over newer data to fix an error.
- After each patch/release report **Status | Version | Contents**, with **Running version** and **Pending to deploy version**. Mark Running only after approved deployment and checks succeed. Distinguish pending Git publication from pending cloud installation.

## Implementation and privacy

- Follow GAME-CONVENTIONS: common sidebar order, responsive Dark/Light UI, creator credits, actual bot levels with at least three-second delays, host money settings and server-owned rules/accounting.
- Keep native factories authoritative for each game. Hints use only viewer-visible information. Do not expose other hands, future deck/wall, seat tokens or snapshots. Label house variants accurately.
- Reuse shared components and room lifecycle; preserve recovery, queue/rotation, dissolve tombstones, resource cleanup and per-viewer messages in Node and Workers.
- Do not add/run automated or gameplay tests unless requested. Source/syntax review, builds, dry-runs and isolated empty-entry authoring previews are allowed. Report actual evidence and untested behavior; never promise bug-free gameplay from a handshake.
- Never commit credentials, player data, tokens, .env, logs, PIDs, runtime, preview stores, generated dist, node_modules or machine-specific private paths. Only whitelisted public assets enter Workers Assets.
- Canonical Git repo: https://github.com/izanagiwarrior/srac-gaming . Owner uses approved personal izanagiwarrior identity/SSH, never office Git identity. Cloudflare account selection is separate; verify the account approved by the human. An exception for Cloudflare does not authorize office Git use.
- Inspect branch/status/remote/identity and intended diff before publication. No force push, reset, clean, checkout or overwriting remote/uncommitted work to resolve discrepancies. Install locked dependencies only when needed; avoid unnecessary install scripts.
- Keep detailed approvals, deployment IDs, release manifests, backup paths, selected account and verification evidence in private operator notes/ignored var/. Keep this repo's handoff factual and portable; update it after changes.
