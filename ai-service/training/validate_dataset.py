"""Validate a YOLO detection dataset before training.

Usage:
    python training/validate_dataset.py --data datasets/civiclens
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


@dataclass(frozen=True)
class DatasetIssue:
    path: str
    message: str


@dataclass(frozen=True)
class DatasetReport:
    images: int
    labels: int
    boxes: int
    class_counts: dict[int, int]
    issues: list[DatasetIssue]

    @property
    def valid(self) -> bool:
        return self.images > 0 and not self.issues


def parse_label(path: Path, class_count: int) -> tuple[Counter[int], list[DatasetIssue]]:
    counts: Counter[int] = Counter()
    issues: list[DatasetIssue] = []
    for line_number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not raw.strip():
            continue
        fields = raw.split()
        if len(fields) != 5:
            issues.append(DatasetIssue(str(path), f"line {line_number}: expected 5 YOLO values"))
            continue
        try:
            class_id = int(fields[0])
            x_center, y_center, width, height = map(float, fields[1:])
        except ValueError:
            issues.append(DatasetIssue(str(path), f"line {line_number}: values must be numeric"))
            continue
        if not 0 <= class_id < class_count:
            issues.append(DatasetIssue(str(path), f"line {line_number}: class {class_id} is out of range"))
            continue
        if not all(0 <= value <= 1 for value in (x_center, y_center, width, height)):
            issues.append(DatasetIssue(str(path), f"line {line_number}: coordinates must be normalized"))
            continue
        if width <= 0 or height <= 0:
            issues.append(DatasetIssue(str(path), f"line {line_number}: box dimensions must be positive"))
            continue
        counts[class_id] += 1
    return counts, issues


def validate_dataset(root: Path, class_count: int = 8) -> DatasetReport:
    images = sorted(path for path in root.rglob("*") if path.suffix.lower() in IMAGE_SUFFIXES)
    labels = 0
    boxes = 0
    counts: Counter[int] = Counter()
    issues: list[DatasetIssue] = []

    for image in images:
        parts = list(image.parts)
        if "images" in parts:
            parts[parts.index("images")] = "labels"
            label = Path(*parts).with_suffix(".txt")
        else:
            label = image.with_suffix(".txt")
        if not label.exists():
            issues.append(DatasetIssue(str(image), "matching label file is missing"))
            continue
        labels += 1
        image_counts, image_issues = parse_label(label, class_count)
        counts.update(image_counts)
        boxes += sum(image_counts.values())
        issues.extend(image_issues)

    if not images:
        issues.append(DatasetIssue(str(root), "no supported images were found"))

    return DatasetReport(
        images=len(images),
        labels=labels,
        boxes=boxes,
        class_counts=dict(sorted(counts.items())),
        issues=issues,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True, help="Dataset root containing images/ and labels/")
    parser.add_argument("--classes", type=int, default=8)
    parser.add_argument("--report", type=Path, default=Path("dataset-validation.json"))
    args = parser.parse_args()
    report = validate_dataset(args.data, args.classes)
    payload = {**asdict(report), "valid": report.valid}
    args.report.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))
    return 0 if report.valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
