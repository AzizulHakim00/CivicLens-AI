from __future__ import annotations

import hashlib
import io
import os
import tempfile
import time
from typing import Annotated, Literal

import cv2
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

from .inference import OnnxDetector

HazardType = Literal[
    "Pothole",
    "Plastic waste",
    "Waterlogging",
    "Open manhole",
    "Broken road",
    "Illegal dumping",
    "Traffic obstruction",
    "Damaged streetlight",
]
Severity = Literal["Critical", "High", "Medium", "Low"]

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_VIDEO_BYTES = 64 * 1024 * 1024
CLASSES: tuple[HazardType, ...] = (
    "Pothole",
    "Plastic waste",
    "Waterlogging",
    "Open manhole",
    "Broken road",
    "Illegal dumping",
    "Traffic obstruction",
    "Damaged streetlight",
)
MODEL_PATH = os.getenv("MODEL_PATH")
_detector: OnnxDetector | None = None


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


class VideoFrameResult(BaseModel):
    frame: int
    timestamp_seconds: float
    detections: list[Detection]


class VideoPredictionResponse(BaseModel):
    mode: Literal["demo", "onnx"]
    sampled_frames: int
    source_fps: float
    duration_seconds: float
    inference_ms: float
    frames: list[VideoFrameResult]


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


def get_detector() -> OnnxDetector:
    global _detector
    if not MODEL_PATH:
        raise RuntimeError("MODEL_PATH is not configured.")
    if _detector is None:
        _detector = OnnxDetector(MODEL_PATH, CLASSES)
    return _detector


def onnx_predict(image: Image.Image) -> list[Detection]:
    results: list[Detection] = []
    width, height = image.size
    for raw in get_detector().predict(image):
        x1, y1, x2, y2 = raw.box
        coverage = ((x2 - x1) * (y2 - y1)) / max(1, width * height)
        results.append(
            Detection(
                class_name=raw.class_name,
                confidence=raw.confidence,
                severity=severity_from(raw.confidence, min(1.0, coverage * 3.2)),
                box=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                explanation="ONNX detection: the returned bounding region exceeded the configured confidence threshold.",
            )
        )
    return results


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
        try:
            with Image.open(io.BytesIO(payload)) as image:
                detections = onnx_predict(image)
        except RuntimeError as error:
            raise HTTPException(status_code=503, detail=str(error)) from error
    else:
        detections = demo_predict(payload, width, height)
    elapsed = (time.perf_counter() - started) * 1000

    return PredictionResponse(
        mode="onnx" if MODEL_PATH else "demo",
        width=width,
        height=height,
        inference_ms=round(elapsed, 3),
        detections=detections,
    )


@app.post("/predict-video", response_model=VideoPredictionResponse)
async def predict_video(
    file: Annotated[UploadFile, File(description="MP4, MOV, WEBM, or AVI road video")],
) -> VideoPredictionResponse:
    if file.content_type not in {
        "video/mp4",
        "video/quicktime",
        "video/webm",
        "video/x-msvideo",
    }:
        raise HTTPException(status_code=415, detail="Use an MP4, MOV, WEBM, or AVI video.")

    payload = await file.read(MAX_VIDEO_BYTES + 1)
    if len(payload) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="Video exceeds the 64 MB limit.")

    suffix = {
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/webm": ".webm",
        "video/x-msvideo": ".avi",
    }[file.content_type]
    started = time.perf_counter()
    frames: list[VideoFrameResult] = []
    with tempfile.NamedTemporaryFile(suffix=suffix) as temporary:
        temporary.write(payload)
        temporary.flush()
        capture = cv2.VideoCapture(temporary.name)
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if not capture.isOpened() or fps <= 0:
            capture.release()
            raise HTTPException(status_code=400, detail="The uploaded file is not a readable video.")

        sample_interval = max(1, int(round(fps)))
        index = 0
        while len(frames) < 120:
            ok, frame = capture.read()
            if not ok:
                break
            if index % sample_interval == 0:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(rgb)
                if MODEL_PATH:
                    try:
                        detections = onnx_predict(image)
                    except RuntimeError as error:
                        capture.release()
                        raise HTTPException(status_code=503, detail=str(error)) from error
                else:
                    ok_encode, encoded = cv2.imencode(".jpg", frame)
                    if not ok_encode:
                        index += 1
                        continue
                    detections = demo_predict(encoded.tobytes(), image.width, image.height)
                frames.append(
                    VideoFrameResult(
                        frame=index,
                        timestamp_seconds=round(index / fps, 3),
                        detections=detections,
                    )
                )
            index += 1
        capture.release()

    return VideoPredictionResponse(
        mode="onnx" if MODEL_PATH else "demo",
        sampled_frames=len(frames),
        source_fps=round(fps, 3),
        duration_seconds=round(frame_count / fps, 3),
        inference_ms=round((time.perf_counter() - started) * 1000, 3),
        frames=frames,
    )
