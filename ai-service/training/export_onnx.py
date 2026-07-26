"""Export a trained CivicLens detector for the FastAPI ONNX adapter."""

from __future__ import annotations

import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument("--image-size", type=int, default=640)
    parser.add_argument("--half", action="store_true")
    args = parser.parse_args()
    try:
        from ultralytics import YOLO
    except ImportError as error:
        raise SystemExit("Install training-requirements.txt before export.") from error

    exported = YOLO(str(args.weights)).export(
        format="onnx",
        imgsz=args.image_size,
        simplify=True,
        dynamic=False,
        half=args.half,
        opset=17,
    )
    print(f"Exported ONNX model: {exported}")


if __name__ == "__main__":
    main()
