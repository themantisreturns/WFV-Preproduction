WFV Preproduction v3.1 update — Audio Ideas / Version History

REPLACE THESE 3 FILES IN YOUR EXISTING LIVE REPOSITORY
- app.js
- styles.css
- index.html

DO NOT replace config.js. Keep your current Supabase URL and publishable key.
No new Supabase SQL is required if your v3 shared-workspace setup is already working.

NEW FEATURE
- Each song has an Audio Ideas / Versions section.
- Any approved band member can upload MP3, WAV, M4A, AAC, AIFF, FLAC, OGG, etc.
- They can add a label such as "Bart - chorus lead idea" or "Full arrangement v2".
- Files stay in the existing private wfv-private Supabase bucket under ideas/<song>/.
- Version History is chronological (Version 1, Version 2, etc.) and shows uploader, date, original filename, file size, playback, and an open-file link.
- Jay/admin can delete any upload. Other members can delete their own uploads when uploader metadata is available.
- Larger files use resumable uploads with progress; smaller files use the normal Supabase upload method.

DEPLOY
1. Copy these three files over the matching files in your local WFV-Preproduction repo.
2. Open GitHub Desktop.
3. Commit: "Add audio idea uploads and version history"
4. Push origin.
5. Wait for GitHub Pages to redeploy, then hard-refresh the WFV site.
