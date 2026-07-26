"""Evaluate a trained checkpoint on the held-out test split."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("evaluation-summary.json"))
    parser.add_argument("--image-size", type=int, default=640)
    args = parser.parse_args()

    try:
        from ultralytics import YOLO
    except ImportError as error:
        raise SystemExit("Install training-requirements.txt before evaluation.") from error

    metrics = YOLO(str(args.weights)).val(
        data=str(args.data),
        split="test",
        imgsz=args.image_size,
        plots=True,
    )
    summary = {
        "map50": float(metrics.box.map50),
        "map50_95": float(metrics.box.map),
        "precision": float(metrics.box.mp),
        "recall": float(metrics.box.mr),
        "per_class_map50_95": [float(value) for value in metrics.box.maps],
        "note": "Measured on the dataset test split declared in the supplied YAML.",
    }
    args.output.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
