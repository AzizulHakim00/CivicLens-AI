# API reference

## `GET /api/reports`

Returns up to 100 newest reports.

```json
{
  "reports": [
    {
      "id": "CL-2841",
      "type": "Pothole",
      "severity": "Critical",
      "confidence": 97,
      "location": "Mirpur Road, near Science Lab",
      "area": "Dhanmondi",
      "status": "Reported",
      "assignedTeam": "Road Alpha",
      "source": "Dashcam",
      "slaMinutes": 42,
      "priorityScore": 95
    }
  ]
}
```

## `POST /api/reports`

Creates validated report metadata. Maximum request body: 16 KB.

```json
{
  "id": "CL-2841",
  "type": "Pothole",
  "severity": "Critical",
  "confidence": 97,
  "location": "Mirpur Road, near Science Lab",
  "area": "Dhanmondi",
  "status": "Reported",
  "coverage": 34,
  "reports": 2,
  "assignedTeam": "Road Alpha",
  "source": "Dashcam",
  "slaMinutes": 60,
  "priorityScore": 95
}
```

Allowed hazard types: `Pothole`, `Plastic waste`, `Waterlogging`, `Open manhole`, `Broken road`, `Illegal dumping`, `Traffic obstruction`, `Damaged streetlight`.

Allowed severity values: `Critical`, `High`, `Medium`, `Low`.

Responses:

- `201` created
- `400` invalid report
- `409` duplicate tracking ID
- `413` payload too large
- `503` storage unavailable

## `PATCH /api/reports`

Updates authority-owned workflow fields and writes a `status_history` audit event whenever status changes.

```json
{
  "id": "CL-2841",
  "status": "Investigating",
  "assignedTeam": "Road Alpha",
  "slaMinutes": 42,
  "actor": "City operator",
  "note": "Crew dispatched"
}
```

## Optional inference API

The standalone service in `ai-service/` exposes:

- `GET /health`
- `GET /model-info`
- `POST /predict-image`
- `POST /predict-video`

`/predict-image` accepts multipart field `file` and returns detection boxes, confidence, severity, timing, image size, and adapter mode. `/predict-video` accepts MP4, MOV, WEBM, or AVI up to 64 MB and samples at approximately one frame per second, capped at 120 frames.
