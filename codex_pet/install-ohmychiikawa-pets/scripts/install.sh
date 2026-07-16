#!/usr/bin/env bash
set -eu

PET="all"
REMOTE=0
CODEX_HOME_OVERRIDE=""
REMOTE_BASE="${OHMYCHIIKAWA_PET_BASE_URL:-https://raw.githubusercontent.com/WayneYe912/OhMyChiikawa/main/codex_pet/install-ohmychiikawa-pets/assets/pets}"

usage() {
  echo "Usage: install.sh [usagi|chiikawa|hachiware|momonga|all] [--remote] [--codex-home PATH]"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    usagi|chiikawa|hachiware|momonga|all)
      PET="$1"
      shift
      ;;
    --remote)
      REMOTE=1
      shift
      ;;
    --codex-home)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      CODEX_HOME_OVERRIDE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SKILL_DIR=$(dirname "$SCRIPT_DIR")
LOCAL_PETS="$SKILL_DIR/assets/pets"

if [ "$REMOTE" -eq 0 ] && [ ! -d "$LOCAL_PETS" ]; then
  REMOTE=1
fi

if [ -n "$CODEX_HOME_OVERRIDE" ]; then
  CODEX_HOME_DIR="$CODEX_HOME_OVERRIDE"
elif [ -n "${CODEX_HOME:-}" ]; then
  CODEX_HOME_DIR="$CODEX_HOME"
else
  CODEX_HOME_DIR="$HOME/.codex"
fi

PETS_ROOT="$CODEX_HOME_DIR/pets"
BACKUPS_ROOT="$CODEX_HOME_DIR/pet-backups"
mkdir -p "$PETS_ROOT"

case "$PET" in
  all) PET_IDS="usagi chiikawa hachiware momonga" ;;
  *) PET_IDS="$PET" ;;
esac

verify_checksums() {
  directory="$1"
  if command -v shasum >/dev/null 2>&1; then
    (cd "$directory" && shasum -a 256 -c SHA256SUMS)
  elif command -v sha256sum >/dev/null 2>&1; then
    (cd "$directory" && sha256sum -c SHA256SUMS)
  else
    echo "Neither shasum nor sha256sum is available; refusing an unverified install." >&2
    return 1
  fi
}

move_legacy_backups() {
  install_id="$1"
  for legacy in "$PETS_ROOT/$install_id.backup-"*; do
    [ -e "$legacy" ] || continue
    mkdir -p "$BACKUPS_ROOT"
    legacy_name=$(basename "$legacy")
    destination="$BACKUPS_ROOT/$legacy_name"
    if [ -e "$destination" ]; then
      destination="$destination-$$"
    fi
    mv "$legacy" "$destination"
    echo "Moved legacy pet backup out of the Pets directory: $destination"
  done
}

install_pet() {
  pet_id="$1"
  install_id="ohmychiikawa-$pet_id"
  stage=$(mktemp -d "$PETS_ROOT/.${install_id}.tmp.XXXXXX")

  if [ "$REMOTE" -eq 1 ]; then
    command -v curl >/dev/null 2>&1 || { echo "curl is required for --remote" >&2; return 1; }
    for file in pet.json source.json spritesheet.webp SHA256SUMS; do
      curl --fail --location --silent --show-error "$REMOTE_BASE/$install_id/$file" --output "$stage/$file"
    done
  else
    source_dir="$LOCAL_PETS/$install_id"
    [ -d "$source_dir" ] || { echo "Missing local pet package: $source_dir" >&2; return 1; }
    cp -R "$source_dir/." "$stage/"
  fi

  verify_checksums "$stage"
  [ -f "$stage/pet.json" ] && [ -f "$stage/spritesheet.webp" ] || {
    echo "Pet package is incomplete: $install_id" >&2
    return 1
  }

  target="$PETS_ROOT/$install_id"
  move_legacy_backups "$install_id"
  if [ -e "$target" ]; then
    mkdir -p "$BACKUPS_ROOT"
    backup="$BACKUPS_ROOT/$install_id.backup-$(date +%Y%m%d-%H%M%S)-$$"
    mv "$target" "$backup"
    echo "Backed up existing pet to: $backup"
  fi
  mv "$stage" "$target"
  echo "Installed $install_id -> $target"
}

for pet_id in $PET_IDS; do
  install_pet "$pet_id"
done

echo
echo "Open ChatGPT/Codex Settings > Pets, select Refresh, then choose the new pet."
echo "Enter /pet or choose Wake Pet to show the floating desktop pet."
echo "In Codex CLI, run /pets to open the pet picker."
