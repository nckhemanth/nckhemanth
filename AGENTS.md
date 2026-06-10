# AGENTS.md — GitHub profile README

Repo: `nckhemanth0/nckhemanth0` · **Must stay public** (renders on github.com/nckhemanth0).

## Constraints

- No `<video>` tags — GitHub strips them silently
- No JavaScript — static HTML/Markdown only
- Images/GIFs via `<img>` or raw.githubusercontent.com URLs
- About section: table layout; phoenix asset `assets/phoenix-accent.gif` (200×205)

## Before editing

Read parent hub: `../context/common/CHANGELOG.md` (if workspace cloned as siblings).

## Personal folder

`personal/` is gitignored — local notes, resume drafts, private experiments. Never pushed.

```bash
mkdir -p personal
```

## After editing

- Append profile changes to hub `context/common/CHANGELOG.md`
- Commit only when user asks
- No `cursoragent` in commit messages

## Assets

- GIF cache-bust: use new filename when GitHub caches old asset
- Phoenix source: local video → ffmpeg crop for README height match

## SEO

- Tech index in `<details>` block at bottom
- Repo topics/descriptions on showcase repos (separate repos)
