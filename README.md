# Waltz for Venus — Preproduction v3.0

v3 adds the shared-workspace architecture:
- Google sign-in through Supabase Auth
- Four-member allowlist
- Shared song edits, preproduction progress, recording progress and discussion notes
- Realtime syncing across band members
- Private Supabase Storage support for unreleased MP3s and lyric PDFs
- Local-preview fallback until credentials are connected

Start with `SETUP.md`.

For local visual review before setup, open `index.html`. It will show **LOCAL PREVIEW** mode.

Do not publish the included `assets/audio` or `assets/lyrics` folders. They are included only so the local preview still works and so you have the files ready to upload to the private Supabase bucket.
