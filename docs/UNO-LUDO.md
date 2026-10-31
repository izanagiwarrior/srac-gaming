# UNO and Ludo — candidate3.9.0

Prepared after user request “gas bikin uno & ludo”. Hub build2026-10-31-uno-ludo-1. Eight-game Node/Worker registries, static allowlists, landing cards/creator Faiz T, account gating/return paths/one-seat handoff/reward acceptlist and shared room UI names cover both new slugs. Existing SQLite namespaces/actors/migrations remain unchanged. Native factories are wrappers around games/shared/party-server.js, reusing established Domino transport/session/persistence/presence logic; each new engine owns its rules. Existing six native engines are untouched.

Read games/uno/README.md and games/ludo/README.md for exact house profiles, scores and limits. Bot difficulty, point value, Quick Play, right chat/cheat/recap/log, emoji effects, Dark/Light, invitation controls and shared host dissolve are included. No new dependency or raster artwork. Asset byte guard preserved.

## Verification and release boundary

Syntax and eight-game cloud build inspected. Isolated Workers preview on3025 with disposable preview account and SQLite directory. Both entry pages and unstarted lobbies created, UNO leave flow and Ludo same-room refresh inspected, both settings/sidebars/creator and Light/Dark reviewed. Theme script order and player label spacing corrected during review. No game was started, no automated/gameplay/full settlement/reconnect/reward/security/mobile tests run. Prior original-six-game test evidence does not validate the new engines. These checks are representative authoring inspection, not a bug-free or official-tournament claim.

Current public cloud and canonical staging remain3.8.1/46321a1; active3024preview is untouched. Candidate source is in the original operator's private work/uno-ludo-patch/source (not a second Git history);3025serves that isolated copy. Before installing into canonical staging, inspect the patch manifest/base and obtain permission to replace/restart the served3024preview if necessary. Preserve any new staging edits, private local runtime and all production DB identities. Do not copy node_modules/.git/runtime/secrets; transfer only reviewed new/changed source. Do not push/deploy until explicitly requested. No production quotas were changed or bypassed.

## UNO appearance3.11.5

Shared uno-cards.css loads only on hub/UNO. Classic-inspired colored cards, white diagonal ellipse, central symbol and mirrored corner values; black Wild background/four-color ellipse. Rendered locally without hotlinks/bitmap downloads, no new image or official licensing claim. Reference: https://shop.mattel.com/collections/uno . Engine/house rules remain unchanged. Entry and landing reviewed, active hand/Wild layout not gameplay verified.
