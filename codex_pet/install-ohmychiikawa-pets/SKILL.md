---
name: install-ohmychiikawa-pets
description: Install or update OhMyChiikawa custom pet skins for the ChatGPT desktop app and Codex CLI. Use when a user asks to install, download, switch to, update, or test Usagi, Chiikawa, Hachiware, or Momonga as a Codex pet, including requests written in Chinese, English, or Japanese.
---

# Install OhMyChiikawa Pets

Install one or all packaged OhMyChiikawa pets into the user's local Codex pet directory. Keep the ChatGPT/Codex application bundle unchanged.

## Resolve the request

- Map 乌萨奇 / うさぎ / Usagi to `usagi`.
- Map 吉伊 / ちいかわ / Chiikawa to `chiikawa`.
- Map 小八 / ハチワレ / Hachiware to `hachiware`.
- Map 莫莫伽 / モモンガ / Momonga to `momonga`.
- Use `usagi` when the user requests an OhMyChiikawa pet without naming a character.
- Use `all` only when the user explicitly requests every character.

## Install

1. Resolve `CODEX_HOME`; use `~/.codex` when it is unset.
2. Prefer the bundled packages under `assets/pets` when this whole skill directory is available.
3. Use `scripts/install.sh <pet>` on macOS or Linux. Use `scripts/install.ps1 -Pet <pet>` on Windows.
4. If only this `SKILL.md` was provided, download the matching installer from the repository, inspect it, and run it with `--remote` on macOS/Linux or `-Remote` on Windows:
   - `https://raw.githubusercontent.com/WayneYe912/OhMyChiikawa/main/codex_pet/install-ohmychiikawa-pets/scripts/install.sh`
   - `https://raw.githubusercontent.com/WayneYe912/OhMyChiikawa/main/codex_pet/install-ohmychiikawa-pets/scripts/install.ps1`
5. Request approval before network downloads or writes outside the active workspace.
6. Require checksum verification to succeed. Stop on missing files, invalid checksums, or an incomplete package.
7. Replace the existing pet directory with the new package. Preserve the previous version under `$CODEX_HOME/pet-backups`, outside the scanned `$CODEX_HOME/pets` directory.
8. Move any legacy `ohmychiikawa-<pet>.backup-*` directories out of `$CODEX_HOME/pets` so Codex does not list backups as duplicate pets.

## Verify and hand off

- Confirm the installed directory exists at `$CODEX_HOME/pets/ohmychiikawa-<pet>`.
- Confirm `pet.json`, `spritesheet.webp`, `source.json`, and `SHA256SUMS` exist.
- Tell desktop users to open Settings > Pets, select Refresh, and choose the new pet.
- Tell desktop users to enter `/pet` or choose Wake Pet if they want the floating pet to appear immediately.
- Tell Codex CLI users to enter `/pets` and choose the installed pet.
- Explain that local custom pets do not automatically sync to the web pet picker.

Never edit files inside the ChatGPT/Codex application bundle. Never overwrite unrelated custom pets. Do not claim the desktop selection changed unless the user selected it in Settings.
