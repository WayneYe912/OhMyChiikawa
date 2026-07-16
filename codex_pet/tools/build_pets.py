#!/usr/bin/env python3
"""Build Codex v1 custom-pet sprite sheets from OhMyChiikawa assets.pak."""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from cryptography.hazmat.primitives import hashes, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from PIL import Image, ImageDraw, ImageOps


CELL_WIDTH = 192
CELL_HEIGHT = 208
SHEET_COLUMNS = 8
SHEET_ROWS = 9
SHEET_SIZE = (CELL_WIDTH * SHEET_COLUMNS, CELL_HEIGHT * SHEET_ROWS)

PASSPHRASE = b"mybuddy::usagi::asset-vault::v1"


@dataclass(frozen=True)
class PetSpec:
    pet_id: str
    display_name: str
    description: str
    standing: str
    ears: tuple[tuple[str, float, float, float, float], ...]
    walk: tuple[str, ...]
    action: tuple[str, ...]
    walk_source_faces_right: bool

    @property
    def install_id(self) -> str:
        return f"ohmychiikawa-{self.pet_id}"


def numbered_paths(prefix: str, start: int, count: int) -> tuple[str, ...]:
    return tuple(f"{prefix}{index:02d}.png" for index in range(start, start + count))


PET_SPECS = (
    PetSpec(
        pet_id="usagi",
        display_name="Usagi · OhMyChiikawa",
        description="Usagi custom pet from OhMyChiikawa.",
        standing="images/usagi/body.png",
        ears=(
            ("images/usagi/ear-left.png", 0.30333, 0.04945, 0.19833, 0.25824),
            ("images/usagi/ear-right.png", 0.50167, 0.04176, 0.21333, 0.26593),
        ),
        walk=numbered_paths("images/usagi_run/usagi_run_", 1, 6),
        action=numbered_paths("images/usagi_roll/usagi_roll_", 1, 11),
        walk_source_faces_right=False,
    ),
    PetSpec(
        pet_id="chiikawa",
        display_name="Chiikawa · OhMyChiikawa",
        description="Chiikawa custom pet from OhMyChiikawa.",
        standing="images/chiikawa/body.png",
        ears=(
            ("images/chiikawa/ear-left.png", 0.19077, 0.00763, 0.14154, 0.08397),
            ("images/chiikawa/ear-right.png", 0.67231, 0.00254, 0.14000, 0.08906),
        ),
        walk=numbered_paths("images/chiikawa_run/chiikawa_run_", 2, 12),
        action=numbered_paths("images/chiikawa_run/chiikawa_run_", 2, 12),
        walk_source_faces_right=False,
    ),
    PetSpec(
        pet_id="hachiware",
        display_name="Hachiware · OhMyChiikawa",
        description="Hachiware custom pet from OhMyChiikawa.",
        standing="images/hachiware/body.png",
        ears=(
            ("images/hachiware/ear-left.png", 0.129167, 0.012739, 0.270833, 0.188960),
            ("images/hachiware/ear-right.png", 0.590278, 0.000000, 0.262500, 0.193206),
        ),
        walk=numbered_paths("images/hachiware_run/hachiware_run_", 1, 11),
        action=numbered_paths("images/hachiware_jump/hachiware_jump_", 1, 4),
        walk_source_faces_right=False,
    ),
    PetSpec(
        pet_id="momonga",
        display_name="Momonga · OhMyChiikawa",
        description="Momonga custom pet from OhMyChiikawa.",
        standing="images/momonga/body.png",
        ears=(
            ("images/momonga/ear-left.png", 0.175926, 0.082407, 0.195370, 0.230556),
            ("images/momonga/ear-right.png", 0.563889, 0.084259, 0.192593, 0.232407),
        ),
        walk=(),
        action=numbered_paths("images/momonga_rolling/momonga_rolling_", 1, 11),
        walk_source_faces_right=False,
    ),
)


def decrypt_bundle(pack_path: Path) -> dict[str, bytes]:
    encrypted = pack_path.read_bytes()
    if len(encrypted) <= 16:
        raise ValueError(f"Invalid asset vault: {pack_path}")

    key = hashlib.sha256(PASSPHRASE).digest()
    decryptor = Cipher(algorithms.AES(key), modes.CBC(encrypted[:16])).decryptor()
    padded = decryptor.update(encrypted[16:]) + decryptor.finalize()
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    decoded = unpadder.update(padded) + unpadder.finalize()
    bundle = json.loads(decoded.decode("utf-8"))
    return {name: base64.b64decode(value) for name, value in bundle.items()}


def load_rgba(bundle: dict[str, bytes], name: str) -> Image.Image:
    try:
        raw = bundle[name]
    except KeyError as error:
        raise KeyError(f"Missing asset in assets.pak: {name}") from error
    with Image.open(io.BytesIO(raw)) as image:
        return image.convert("RGBA")


def load_standing(bundle: dict[str, bytes], spec: PetSpec) -> Image.Image:
    """Reassemble the repo's articulated standing pose into one Codex frame."""
    body = load_rgba(bundle, spec.standing)
    for path, x, y, width, height in spec.ears:
        ear = load_rgba(bundle, path)
        ear = ear.resize(
            (max(1, round(body.width * width)), max(1, round(body.height * height))),
            Image.Resampling.LANCZOS,
        )
        body.alpha_composite(ear, (round(body.width * x), round(body.height * y)))
    return body


def trim_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    return image.crop(bbox)


def apply_opacity(image: Image.Image, opacity: float) -> Image.Image:
    if opacity >= 0.999:
        return image
    result = image.copy()
    result.putalpha(result.getchannel("A").point(lambda value: round(value * opacity)))
    return result


def fit_pose(
    image: Image.Image,
    *,
    flip: bool = False,
    max_width: int = 176,
    max_height: int = 194,
    dx: int = 0,
    dy: int = 0,
    rotation: float = 0,
    opacity: float = 1,
) -> Image.Image:
    pose = trim_alpha(image)
    if flip:
        pose = ImageOps.mirror(pose)

    scale = min(max_width / pose.width, max_height / pose.height)
    size = (max(1, round(pose.width * scale)), max(1, round(pose.height * scale)))
    pose = pose.resize(size, Image.Resampling.LANCZOS)
    pose = apply_opacity(pose, opacity)
    if rotation:
        pose = pose.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)

    frame = Image.new("RGBA", (CELL_WIDTH, CELL_HEIGHT), (0, 0, 0, 0))
    x = (CELL_WIDTH - pose.width) // 2 + dx
    y = CELL_HEIGHT - pose.height - 5 + dy
    frame.alpha_composite(pose, (x, y))
    return frame


def transform_frame(
    frame: Image.Image,
    *,
    scale_x: float = 1,
    scale_y: float = 1,
    dx: int = 0,
    dy: int = 0,
    rotation: float = 0,
    opacity: float = 1,
    flip: bool = False,
) -> Image.Image:
    content = trim_alpha(frame)
    if flip:
        content = ImageOps.mirror(content)
    content = content.resize(
        (max(1, round(content.width * scale_x)), max(1, round(content.height * scale_y))),
        Image.Resampling.LANCZOS,
    )
    content = apply_opacity(content, opacity)
    if rotation:
        content = content.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)

    result = Image.new("RGBA", (CELL_WIDTH, CELL_HEIGHT), (0, 0, 0, 0))
    x = (CELL_WIDTH - content.width) // 2 + dx
    y = CELL_HEIGHT - content.height - 5 + dy
    result.alpha_composite(content, (x, y))
    return result


def select_sequence(images: Sequence[Image.Image], count: int) -> list[Image.Image]:
    if not images:
        raise ValueError("Cannot sample an empty image sequence")
    if count <= len(images):
        if count == 1:
            indices = [0]
        else:
            indices = [round(index * (len(images) - 1) / (count - 1)) for index in range(count)]
    else:
        indices = [index % len(images) for index in range(count)]
    return [images[index] for index in indices]


def render_sequence(images: Sequence[Image.Image], count: int, *, flip: bool = False) -> list[Image.Image]:
    return [fit_pose(image, flip=flip) for image in select_sequence(images, count)]


def idle_frames(base: Image.Image) -> list[Image.Image]:
    transforms = (
        (1.000, 1.000, 0),
        (1.006, 0.994, 1),
        (1.010, 0.990, 2),
        (1.006, 0.994, 1),
        (1.000, 1.000, 0),
        (0.996, 1.004, -1),
    )
    return [transform_frame(base, scale_x=sx, scale_y=sy, dy=dy) for sx, sy, dy in transforms]


def fallback_walk_frames(base: Image.Image, count: int, *, flip: bool = False) -> list[Image.Image]:
    x_pattern = (0, 3, 6, 3, 0, -3, -6, -3)
    y_pattern = (0, -3, -6, -3, 0, -3, -6, -3)
    return [
        transform_frame(
            base,
            dx=(-x_pattern[index % len(x_pattern)] if flip else x_pattern[index % len(x_pattern)]),
            dy=y_pattern[index % len(y_pattern)],
            rotation=(-2 if index % 2 else 2),
            flip=flip,
        )
        for index in range(count)
    ]


def jump_frames(base: Image.Image) -> list[Image.Image]:
    transforms = (
        (1.00, 1.00, 0),
        (1.03, 0.97, -12),
        (0.98, 1.02, -28),
        (1.03, 0.97, -12),
        (1.00, 1.00, 0),
    )
    return [transform_frame(base, scale_x=sx, scale_y=sy, dy=dy) for sx, sy, dy in transforms]


def add_failed_badge(frame: Image.Image, phase: int) -> Image.Image:
    result = frame.copy()
    draw = ImageDraw.Draw(result, "RGBA")
    wobble = (-2, 1, 2, -1)[phase % 4]
    cx, cy, radius = 157 + wobble, 25, 13
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(238, 86, 86, 245))
    draw.rounded_rectangle((cx - 2, cy - 8, cx + 2, cy + 3), radius=2, fill=(255, 255, 255, 255))
    draw.ellipse((cx - 2, cy + 6, cx + 2, cy + 10), fill=(255, 255, 255, 255))
    return result


def failed_frames(base: Image.Image) -> list[Image.Image]:
    rotations = (-5, 4, -4, 3, -3, 2, -2, 0)
    frames = [
        transform_frame(base, rotation=rotation, dy=4, opacity=0.82)
        for rotation in rotations
    ]
    return [add_failed_badge(frame, index) for index, frame in enumerate(frames)]


def add_waiting_bubble(frame: Image.Image, phase: int) -> Image.Image:
    result = frame.copy()
    draw = ImageDraw.Draw(result, "RGBA")
    draw.rounded_rectangle((123, 10, 177, 42), radius=13, fill=(255, 255, 255, 238), outline=(68, 64, 64, 210), width=2)
    draw.polygon(((137, 39), (132, 50), (148, 40)), fill=(255, 255, 255, 238))
    for index, x in enumerate((139, 150, 161)):
        active = index == phase % 3
        radius = 4 if active else 3
        color = (103, 149, 205, 255) if active else (174, 190, 210, 220)
        draw.ellipse((x - radius, 26 - radius, x + radius, 26 + radius), fill=color)
    return result


def waiting_frames(base: Image.Image) -> list[Image.Image]:
    frames = [transform_frame(base, dy=(-2 if index % 2 else 0)) for index in range(6)]
    return [add_waiting_bubble(frame, index) for index, frame in enumerate(frames)]


def build_rows(bundle: dict[str, bytes], spec: PetSpec) -> list[list[Image.Image]]:
    standing = load_standing(bundle, spec)
    base = fit_pose(standing)
    walk_images = [load_rgba(bundle, path) for path in spec.walk]
    action_images = [load_rgba(bundle, path) for path in spec.action]

    if walk_images:
        running_right = render_sequence(
            walk_images,
            8,
            flip=not spec.walk_source_faces_right,
        )
        running_left = render_sequence(
            walk_images,
            8,
            flip=spec.walk_source_faces_right,
        )
        running = render_sequence(
            walk_images,
            6,
            flip=not spec.walk_source_faces_right,
        )
    else:
        running_right = fallback_walk_frames(
            base,
            8,
            flip=not spec.walk_source_faces_right,
        )
        running_left = fallback_walk_frames(
            base,
            8,
            flip=spec.walk_source_faces_right,
        )
        running = fallback_walk_frames(
            base,
            6,
            flip=not spec.walk_source_faces_right,
        )

    waving = render_sequence(action_images or walk_images or [standing], 4)
    review = render_sequence(action_images or walk_images or [standing], 6)

    # Codex v1 row order: idle, right, left, wave, jump, failed,
    # waiting, running, review. The renderer reads at most eight columns.
    return [
        idle_frames(base),
        running_right,
        running_left,
        waving,
        jump_frames(base),
        failed_frames(base),
        waiting_frames(base),
        running,
        review,
    ]


def make_sheet(rows: Sequence[Sequence[Image.Image]]) -> Image.Image:
    if len(rows) != SHEET_ROWS:
        raise ValueError(f"Expected {SHEET_ROWS} sprite rows, got {len(rows)}")
    sheet = Image.new("RGBA", SHEET_SIZE, (0, 0, 0, 0))
    for row_index, frames in enumerate(rows):
        if not frames:
            raise ValueError(f"Sprite row {row_index} is empty")
        for column_index in range(SHEET_COLUMNS):
            frame = frames[min(column_index, len(frames) - 1)]
            sheet.alpha_composite(frame, (column_index * CELL_WIDTH, row_index * CELL_HEIGHT))
    return sheet


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_pet_package(
    output_root: Path,
    spec: PetSpec,
    sheet: Image.Image,
    *,
    project_version: str,
) -> dict[str, object]:
    pet_root = output_root / spec.install_id
    pet_root.mkdir(parents=True, exist_ok=True)
    sheet_path = pet_root / "spritesheet.webp"
    sheet.save(sheet_path, "WEBP", lossless=True, quality=100, method=6)

    pet_json = {
        "displayName": spec.display_name,
        "description": spec.description,
        "spriteVersionNumber": 1,
        "spritesheetPath": "spritesheet.webp",
    }
    source_json = {
        "sourceRepository": "https://github.com/WayneYe912/OhMyChiikawa",
        "sourceVersion": project_version,
        "petId": spec.pet_id,
        "generatedFormat": "Codex custom pet v1",
        "licenseNotice": "Character artwork belongs to Chiikawa; intended for personal desktop-pet use.",
    }
    write_json(pet_root / "pet.json", pet_json)
    write_json(pet_root / "source.json", source_json)

    checksum_files = ("pet.json", "source.json", "spritesheet.webp")
    checksums = {name: sha256_file(pet_root / name) for name in checksum_files}
    (pet_root / "SHA256SUMS").write_text(
        "".join(f"{checksums[name]}  {name}\n" for name in checksum_files),
        encoding="utf-8",
    )

    with Image.open(sheet_path) as written:
        if written.size != SHEET_SIZE:
            raise ValueError(f"Unexpected sheet size for {spec.pet_id}: {written.size}")
        if written.mode != "RGBA":
            raise ValueError(f"Unexpected sheet mode for {spec.pet_id}: {written.mode}")
        if written.getchannel("A").getextrema() == (255, 255):
            raise ValueError(f"Missing transparent pixels for {spec.pet_id}")

    return {
        "id": spec.pet_id,
        "installId": spec.install_id,
        "displayName": spec.display_name,
        "spriteVersionNumber": 1,
        "width": SHEET_SIZE[0],
        "height": SHEET_SIZE[1],
        "assetPath": f"assets/pets/{spec.install_id}",
        "spritesheetSha256": checksums["spritesheet.webp"],
        "spritesheetBytes": sheet_path.stat().st_size,
    }


def build(repo_root: Path) -> None:
    pack_path = repo_root / "src" / "assets.pak"
    package_json_path = repo_root / "package.json"
    output_root = repo_root / "codex_pet" / "install-ohmychiikawa-pets" / "assets" / "pets"
    output_root.mkdir(parents=True, exist_ok=True)

    bundle = decrypt_bundle(pack_path)
    project_version = json.loads(package_json_path.read_text(encoding="utf-8"))["version"]
    manifest_entries = []
    for spec in PET_SPECS:
        rows = build_rows(bundle, spec)
        sheet = make_sheet(rows)
        entry = write_pet_package(output_root, spec, sheet, project_version=project_version)
        manifest_entries.append(entry)
        print(
            f"built {spec.install_id}: {entry['width']}x{entry['height']} "
            f"({entry['spritesheetBytes']} bytes)"
        )

    manifest = {
        "schemaVersion": 1,
        "projectVersion": project_version,
        "spriteFormat": {
            "version": 1,
            "columns": SHEET_COLUMNS,
            "rows": SHEET_ROWS,
            "cellWidth": CELL_WIDTH,
            "cellHeight": CELL_HEIGHT,
        },
        "pets": manifest_entries,
    }
    write_json(output_root.parent / "manifest.json", manifest)


def main() -> None:
    default_root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=default_root)
    args = parser.parse_args()
    build(args.repo_root.resolve())


if __name__ == "__main__":
    main()
