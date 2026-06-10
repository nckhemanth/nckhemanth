# AGENTS.md — GitHub profile README

Repo: `nckhemanth0/nckhemanth0` · **Must stay public** (renders on github.com/nckhemanth0).

## Constraints

- No `<video>` tags — GitHub strips them silently
- No JavaScript — static HTML/Markdown only
- Images/GIFs via `<img>` or raw.githubusercontent.com URLs
- About section: table layout; phoenix asset `assets/phoenix-accent.gif` (200×205)

## Before editing

Read parent hub: `../context/common/CHANGELOG.md` (if workspace cloned as siblings).

## After editing

- Append profile changes to hub `context/common/CHANGELOG.md`
- Commit only when user asks
- No `cursoragent` in commit messages

## Assets

- GIF cache-bust: use new filename when GitHub caches old asset
- Phoenix source: local video → ffmpeg crop for README height match

## Analytics

- Profile views badge: `komarev.com/ghpvc` → dashboard at [yhype.me](https://yhype.me/) after GitHub sign-in
- Stats SVGs: `profile/*.svg` refreshed by `.github/workflows/profile-stats.yml` (daily 03:00 UTC)
- Optional secret `STATS_TOKEN` (PAT with `repo` scope) for private commit counts in stats card

## SEO

- Tech index in `<details>` block at bottom
- Repo topics/descriptions on showcase repos (separate repos)
