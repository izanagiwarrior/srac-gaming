# Meja Kita

- Preserve the three games and their separate room/session namespaces.
- Keep local player data, saved sessions, credentials, `.env`, and `node_modules` out of Git.
- Use one public HTTP port and game-specific WebSocket paths.
- Prepare changes separately from any active served checkout. Use an isolated port and room for previews.
- Do not deploy, restart, stop, or reload an active server without explicit user confirmation for that version. Publishing source to GitHub does not authorize deploying it to Render.
- Keep Render Auto-Deploy off unless the user explicitly asks to enable it.
- Do not add or run tests unless requested by the user.
- This repository is intended for the personal GitHub account `izanagiwarrior`. Do not use work account credentials or work email for commits.
