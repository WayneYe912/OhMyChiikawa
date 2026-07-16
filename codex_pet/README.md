# OhMyChiikawa Codex Pets

This directory contains four Codex v1 custom pets generated from the existing OhMyChiikawa artwork. Everything needed to build, inspect, or install the pets stays under `codex_pet/`.

## Included pets

- `ohmychiikawa-usagi`
- `ohmychiikawa-chiikawa`
- `ohmychiikawa-hachiware`
- `ohmychiikawa-momonga`

Each package contains a transparent `1536 × 1872` WebP sprite sheet, `pet.json`, source metadata, and SHA-256 checksums.

## Install on macOS or Linux

Install all four pets:

```bash
bash codex_pet/install-ohmychiikawa-pets/scripts/install.sh all
```

Install one pet:

```bash
bash codex_pet/install-ohmychiikawa-pets/scripts/install.sh usagi
```

## Install on Windows

Install all four pets from PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File codex_pet\install-ohmychiikawa-pets\scripts\install.ps1 -Pet all
```

Replace `all` with `usagi`, `chiikawa`, `hachiware`, or `momonga` to install one pet.

Reinstalling a pet replaces the package with the same ID. The previous version is moved to `$CODEX_HOME/pet-backups/`, outside the Pets directory, so it will not appear as a duplicate pet. The installer also migrates backups created by older versions of this installer out of `$CODEX_HOME/pets/`.

## Select the pet

After installation, open ChatGPT/Codex Settings > Pets, select Refresh, and choose the new pet. Enter `/pet` or choose Wake Pet to show the floating desktop pet. In an interactive Codex CLI session, enter `/pets` to open the pet picker.

## Let Codex install it from the Skill

After this directory is published on the repository's `main` branch, give another Codex this URL and ask it to read and follow the instructions:

```text
https://raw.githubusercontent.com/WayneYe912/OhMyChiikawa/main/codex_pet/install-ohmychiikawa-pets/SKILL.md
```

The Skill tells Codex to download the installer and checksummed pet package from this repository. Codex should ask the user to approve the network download and the write to the local Codex home directory.

To register it as a reusable local Skill instead, copy the complete `install-ohmychiikawa-pets` directory into `$CODEX_HOME/skills/` (normally `~/.codex/skills/`) and restart Codex.

## Rebuild the sprite sheets

The build tool needs Python 3 with Pillow and cryptography:

```bash
python3 codex_pet/tools/build_pets.py
```

The builder reads `src/assets.pak` in memory and rewrites only the generated packages under `codex_pet/install-ohmychiikawa-pets/assets/pets`.

Character artwork belongs to Chiikawa and is intended for personal desktop-pet use, consistent with the repository notice.
