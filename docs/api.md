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
      "status": "Reported"
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
  "reports": 2
}
```

Allowed hazard types: `Pothole`, `Plastic waste`, `Waterlogging`, `Open manhole`.

Allowed severity values: `Critical`, `High`, `Medium`, `Low`.

Responses:

- `201` created
- `400` invalid report
- `409` duplicate tracking ID
- `413` payload too large
- `503` storage unavailable

## Optional inference API

The standalone service in `ai-service/` exposes:

- `GET /health`
- `GET /model-info`
- `POST /predict-image`

`/predict-image` accepts multipart field `file` and returns detection boxes, confidence, severity, timing, image size, and adapter mode.
