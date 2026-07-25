from __future__ import annotations

import hashlib
import io
import os
import time
from typing import Annotated, Literal

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

HazardType = Literal["Pothole", "Plastic waste", "Waterlogging", "Open manhole"]
Severity = Literal["Critical", "High", "Medium", "Low"]

MAX_IMAGE_BYTES = 8 * 1024 * 1024
CLASSES: tuple[HazardType, ...] = (
    "Pothole",
    "Plastic waste",
    "Waterlogging",
    "Open manhole",
)
MODEL_PATH = os.getenv("MODEL_PATH")


class BoundingBox(BaseModel):
    x1: int = Field(ge=0)
    y1: int = Field(ge=0)
    x2: int = Field(ge=0)
    y2: int = Field(ge=0)


class Detection(BaseModel):
    class_name: HazardType
    confidence: float = Field(ge=0, le=1)
    severity: Severity
    box: BoundingBox
    explanation: str


class PredictionResponse(BaseModel):
    mode: Literal["demo", "onnx"]
    width: int
    height: int
    inference_ms: float
    detections: list[Detection]


app = FastAPI(
    title="CivicLens AI Inference Service",
    version="1.0.0",
    description="Validated image-inference contract for CivicLens AI.",
)


def severity_from(confidence: float, coverage: float) -> Severity:
    score = confidence * 0.55 + coverage * 0.45
    if score >= 0.82:
        return "Critical"
    if score >= 0.66:
        return "High"
    if score >= 0.45:
        return "Medium"
    return "Low"


def demo_predict(payload: bytes, width: int, height: int) -> list[Detection]:
    digest = hashlib.sha256(payload).digest()
    class_name = CLASSES[digest[0] % len(CLASSES)]
    confidence = round(0.88 + (digest[1] % 10) / 100, 2)
    box_width = max(48, int(width * (0.24 + (digest[2] % 12) / 100)))
    box_height = max(48, int(height * (0.20 + (digest[3] % 10) / 100)))
    x1 = max(0, (width - box_width) // 2)
    y1 = max(0, int(height * 0.47) - box_height // 2)
    coverage = (box_width * box_height) / max(1, width * height)
    return [
        Detection(
            class_name=class_name,
            confidence=confidence,
            severity=severity_from(confidence, min(1.0, coverage * 3.2)),
            box=BoundingBox(x1=x1, y1=y1, x2=x1 + box_width, y2=y1 + box_height),
            explanation="Demo adapter: central road-region evidence contributed most to the deterministic result.",
        )
    ]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "onnx" if MODEL_PATH else "demo"}


@app.get("/model-info")
def model_info() -> dict[str, object]:
    return {
        "name": "CivicLens Vision Adapter",
        "mode": "onnx" if MODEL_PATH else "demo",
        "classes": list(CLASSES),
        "weights_loaded": bool(MODEL_PATH),
    }


@app.post("/predict-image", response_model=PredictionResponse)
async def predict_image(
    file: Annotated[UploadFile, File(description="JPG, PNG, or WEBP road image")],
) -> PredictionResponse:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Use a JPG, PNG, or WEBP image.")

    payload = await file.read(MAX_IMAGE_BYTES + 1)
    if len(payload) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 8 MB limit.")

    try:
        with Image.open(io.BytesIO(payload)) as image:
            image.verify()
        with Image.open(io.BytesIO(payload)) as image:
            width, height = image.size
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.")

    if width < 64 or height < 64:
        raise HTTPException(status_code=400, detail="Image dimensions must be at least 64×64.")

    started = time.perf_counter()
    if MODEL_PATH:
        raise HTTPException(
            status_code=501,
            detail="MODEL_PATH is configured; implement model-specific preprocessing and output decoding before enabling ONNX mode.",
        )
    detections = demo_predict(payload, width, height)
    elapsed = (time.perf_counter() - started) * 1000

    return PredictionResponse(
        mode="demo",
        width=width,
        height=height,
        inference_ms=round(elapsed, 3),
        detections=detections,
    )
