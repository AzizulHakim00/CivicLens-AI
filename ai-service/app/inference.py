from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import numpy as np
import onnxruntime as ort
from PIL import Image


@dataclass(frozen=True)
class RawDetection:
    class_name: str
    confidence: float
    box: tuple[int, int, int, int]


def intersection_over_union(
    first: tuple[int, int, int, int],
    second: tuple[int, int, int, int],
) -> float:
    x1 = max(first[0], second[0])
    y1 = max(first[1], second[1])
    x2 = min(first[2], second[2])
    y2 = min(first[3], second[3])
    intersection = max(0, x2 - x1) * max(0, y2 - y1)
    first_area = max(0, first[2] - first[0]) * max(0, first[3] - first[1])
    second_area = max(0, second[2] - second[0]) * max(0, second[3] - second[1])
    return intersection / max(1, first_area + second_area - intersection)


def non_max_suppression(
    detections: Sequence[RawDetection],
    iou_threshold: float = 0.45,
) -> list[RawDetection]:
    kept: list[RawDetection] = []
    for candidate in sorted(detections, key=lambda item: item.confidence, reverse=True):
        overlaps = (
            existing.class_name == candidate.class_name
            and intersection_over_union(existing.box, candidate.box) > iou_threshold
            for existing in kept
        )
        if not any(overlaps):
            kept.append(candidate)
    return kept


class OnnxDetector:
    """Generic YOLO-style ONNX detector with class-aware NMS.

    The adapter accepts common ``[1, channels, boxes]`` and
    ``[1, boxes, channels]`` outputs. Export a model with raw predictions and
    the same class order as ``classes``.
    """

    def __init__(
        self,
        model_path: str,
        classes: Sequence[str],
        confidence_threshold: float = 0.35,
        iou_threshold: float = 0.45,
    ) -> None:
        path = Path(model_path)
        if not path.is_file():
            raise RuntimeError(f"ONNX model was not found: {path}")
        self.classes = tuple(classes)
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.session = ort.InferenceSession(
            str(path),
            providers=["CPUExecutionProvider"],
        )
        self.input = self.session.get_inputs()[0]
        shape = self.input.shape
        self.input_height = int(shape[2]) if len(shape) > 3 and isinstance(shape[2], int) else 640
        self.input_width = int(shape[3]) if len(shape) > 3 and isinstance(shape[3], int) else 640

    def _preprocess(self, image: Image.Image) -> np.ndarray:
        resized = image.convert("RGB").resize(
            (self.input_width, self.input_height),
            Image.Resampling.BILINEAR,
        )
        tensor = np.asarray(resized, dtype=np.float32) / 255.0
        return np.transpose(tensor, (2, 0, 1))[None, ...]

    def _rows(self, output: np.ndarray) -> np.ndarray:
        predictions = np.asarray(output)
        while predictions.ndim > 2 and predictions.shape[0] == 1:
            predictions = predictions[0]
        if predictions.ndim != 2:
            raise RuntimeError(f"Unsupported ONNX output shape: {predictions.shape}")
        if predictions.shape[0] <= 4 + len(self.classes) and predictions.shape[1] > predictions.shape[0]:
            predictions = predictions.T
        return predictions

    def predict(self, image: Image.Image) -> list[RawDetection]:
        original_width, original_height = image.size
        output = self.session.run(None, {self.input.name: self._preprocess(image)})[0]
        candidates: list[RawDetection] = []

        for row in self._rows(output):
            if row.size == 6:
                x1, y1, x2, y2, confidence, class_id = row.tolist()
            elif row.size >= 4 + len(self.classes):
                x_center, y_center, width, height = row[:4].tolist()
                scores = row[4 : 4 + len(self.classes)]
                class_id = int(np.argmax(scores))
                confidence = float(scores[class_id])
                x1 = x_center - width / 2
                y1 = y_center - height / 2
                x2 = x_center + width / 2
                y2 = y_center + height / 2
            else:
                continue

            class_index = int(class_id)
            if confidence < self.confidence_threshold or not 0 <= class_index < len(self.classes):
                continue

            scaled = (
                int(max(0, min(original_width, x1 * original_width / self.input_width))),
                int(max(0, min(original_height, y1 * original_height / self.input_height))),
                int(max(0, min(original_width, x2 * original_width / self.input_width))),
                int(max(0, min(original_height, y2 * original_height / self.input_height))),
            )
            if scaled[2] <= scaled[0] or scaled[3] <= scaled[1]:
                continue
            candidates.append(
                RawDetection(
                    class_name=self.classes[class_index],
                    confidence=round(float(confidence), 5),
                    box=scaled,
                )
            )

        return non_max_suppression(candidates, self.iou_threshold)
