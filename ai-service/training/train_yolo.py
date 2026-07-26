"""Reproducible Ultralytics training entrypoint."""

from __future__ import annotations

import argparse
import os
import random
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--model", default="yolo11n.pt")
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--image-size", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--device", default="0")
    parser.add_argument("--project", default="runs/civiclens")
    args = parser.parse_args()

    try:
        import numpy as np
        import torch
        from ultralytics import YOLO
    except ImportError as error:
        raise SystemExit("Install training-requirements.txt before training.") from error

    os.environ["PYTHONHASHSEED"] = str(args.seed)
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(args.seed)

    model = YOLO(args.model)
    model.train(
        data=str(args.data),
        epochs=args.epochs,
        imgsz=args.image_size,
        batch=args.batch,
        seed=args.seed,
        deterministic=True,
        device=args.device,
        project=args.project,
        name="train",
        exist_ok=True,
        patience=20,
        cos_lr=True,
        close_mosaic=10,
        plots=True,
    )


if __name__ == "__main__":
    main()
