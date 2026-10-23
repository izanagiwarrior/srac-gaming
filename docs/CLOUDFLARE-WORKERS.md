# Cloudflare hosting — Workers + SQLite Durable Object

This target runs all six games on **Cloudflare Workers + a SQLite-backed Durable Object**. It does not use cloudflared, a tunnel, a laptop origin or a paid Container. The existing Node/Quick Tunnel target remains available separately. Preparing/building this target never deploys it.

## Status and authorization

Last confirmed deployed and checked on23October2026: **2.3.0 / 2026-10-23-lobby-consistency-1** at https://srac-gaming.faiz-triputra.workers.dev/ . Read [MAINTENANCE.md](MAINTENANCE.md) for the current handoff, code map, update workflow and Git publication status. This is a dated deployment record; inspect /health for current status. A local emulator/build is not proof of production gameplay or a guarantee of free capacity. Follow AGENTS.md: obtain current authorization before deploying the chosen build, and separate authorization before GitHub push. Never enable automatic Git-to-Workers deployment for this owner's repo without an explicit request.

The first cloud deployment started **new rooms with an empty cloud database**; subsequent updates must preserve that existing cloud store. It does not upload old Node saves, player tokens, source backups, or office data. Existing Node runtime remains untouched. Private recovery files from another host cannot restore a room that does not exist on the new host. A data migration would be a separate task.

## Design

- Workers Assets serves only the prepared public directories, browser engines and Mahjong scoring helper. Build output is ignored under dist/cloudflare. Never point the assets binding at the repo or games/ root.
- Worker routes /health, /api/lobby, /<game>/ws and /<game>/api/info. Native game URLs, protocol versions and client behavior stay the same.
- A single GamingHub actor named office-hub-v1 coordinates the small office hub. All six native game factories remain authoritative for rules, private views, legality, scores, bots and room lifecycle. The cloud transport is an EventEmitter adapter, not another copy of the game rules.
- Only the cloud bundle substitutes native HTTP/WS/filesystem/V8 imports. Ordinary npm start continues using Node's original modules and file persistence.
- The shared room service accepts a synchronous storage driver. Each cloud game save is a private graph encoding (Sets and shared references preserved), stored in bounded SQLite BLOB chunks in an atomic transaction. It is not a browser response and has no public download endpoint.
- Unchanged snapshots do not write again. Checkpoints occur on state changes and before publishing native outbound messages. A failed checkpoint closes cloud sockets and discards the in-memory adapter; subsequent connections restore the last durable save, paused if unfinished. A write failure cannot justify displaying a successful dissolve or gameplay result.
- While clients are connected, **Durable Object WebSocket callbacks and native timers** keep the actor active. Sockets use acceptWebSocket/class callbacks, but pending native timers prevent actual hibernation while connected; this implementation does not claim game-aware WebSocket hibernation. Cold retained sockets are explicitly closed with a reconnect instruction, never silently rebound to a guessed seat. Bots retain their existing delays, including at least three seconds. Do not replace these timers with alarms without adapting each game's phase/recovery semantics.
- When the last socket closes, native disconnect handling runs, the actor saves the resulting state, clears its owned timers, and closes the factories. A later connection rebuilds them from SQLite. Unfinished games use the existing host-resume flow; timers do not silently continue while everyone is gone. An unexpected eviction/deploy also requires reconnect and host resume.
- The small-hub guard is 64 simultaneous sockets, 24 retained rooms total, and 2 MiB of snapshot data per game. Native per-room capacities, payload/rate limits, same-origin checks, spectator privacy and code tombstones still apply. Dissolve old rooms before reaching room capacity. If save capacity is exhausted, do not delete or silently reset existing saves.
- Public room summaries retain the existing names/capacities/phase visibility. Private rooms stay hidden. This is a casual public-link hub, not an authenticated private club or an abuse-proof public gaming service.

## Prepare locally

Use Node 22+ and the repo's locked dev dependencies:

```sh
npm ci --ignore-scripts
npm run build:cloudflare
```

The build writes only generated dist/cloudflare. It first recreates that generated directory, copies explicitly public assets, bundles the cloud adapter and reads the build ID from server.js. Never put hand-maintained files or runtime in dist/cloudflare.

For a private authoring preview, use a free loopback port and a separate local emulator directory:

```sh
npx wrangler dev --local --ip 127.0.0.1 --port 3024 --persist-to /path/to/private/cloud-preview
```

Keep local dev local: do not choose Wrangler's tunnel/remote preview options without permission. Stop only this preview when done. Do not create rooms or start gameplay merely to check a live host. Per project rules, request authorization before gameplay/automated test runs; build/syntax/empty-entry authoring inspection is allowed.

For a packaging check without publishing:

```sh
npx wrangler deploy --dry-run --outdir /path/to/private/dry-run
```

No build/check command should trigger GitHub or a public deployment.

## First deployment, after explicit approval

1. Report the complete candidate build, included patches, cloud destination and fresh-room behavior. Preserve the existing live folder/runtime and any current tunnel. Do not restart that old host as a side effect.
2. Confirm the Cloudflare account is the account **explicitly approved by the human** (independent of the personal-only Git identity) and Workers Free is selected. Do not enable paid plans, Containers, R2, paid add-ons, custom domains or payment methods. If the dashboard requires an unexpected billing step, stop and explain it.
3. Let the user complete sign-in in their browser. Standard Wrangler login uses the official OAuth flow; do not collect/paste credentials into this repository. Check the selected account with `npx wrangler whoami` locally; never copy tokens or account details into tracked files.
4. Review wrangler.jsonc. `name` controls the public service name (default srac-gaming). GAMING_HUB must reference GamingHub with the **new_sqlite_classes** migration. SQLite is required for the Free plan. Preserve the actor name and migration history after first deployment; changing them can create a different room store.
5. Run `npm run deploy:cloudflare` only after the user authorized that deployment. No GitHub push is needed. Do not use --force or delete a namespace to fix a deployment failure.
6. Read the actual workers.dev URL from the successful output; never invent a link or promise the service name is available. Check public /health shows the candidate build and all six games. Open root and representative empty game entries, verify assets and same-origin WSS. A published build is not fully verified gameplay until separately checked.
7. Record build, URL, actual account selection (without credentials), deployment ID, approval, local/public checks and verification limits in private operator notes or ignored var/. Only then mark this build Running. Record failed operations as failed, not deployed.

## Updates and recovery

- Prepare and preview in staging, then request approval for the exact cloud update. A deployment can drop sockets and pause unfinished games; players may need refresh/reconnect/host resume. Do not promise uninterrupted matches.
- Preserve SQLite migrations, actor name, storage format, code tombstones and accounting history. Never copy Node .v8 files directly into cloud storage: formats and restore semantics differ.
- No public reset/import/debug endpoints. Database export/restore is private operator work needing a reviewed plan; never publish tokens or private snapshots to GitHub.
- Keep Node live/var intact; cloud deployment does not update live/. GitHub publication remains a separate action from cloud release.

## Free-tier limits and verification limits

Cloudflare currently offers Workers Free and SQLite Durable Objects on Free, without a credit card for the free start. Quotas apply; excess operations can fail until the daily allowance resets. Check **current** official documentation before deployment and measure actual usage after release. Do not quote a guaranteed friend/room count or call it unlimited. One shared actor limits duration multiplication, but all active connections/timers still count; other apps on the same account share account quotas.

Sources:
- https://www.cloudflare.com/products/durable-objects/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/workers/static-assets/

Release verification is recorded in the operator's report. Build success, empty lobby and a WSS handshake do not prove all-game settlement, timer races, reconnect, power-loss recovery, storage-exhaustion behavior, or real Free-plan quota usage. Never claim those passed without the corresponding authorized verification.
