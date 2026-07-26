from fastapi.testclient import TestClient

from app.main import app, severity_from

client = TestClient(app)


def test_health_reports_demo_mode():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert len(client.get("/model-info").json()["classes"]) == 8


def test_rejects_non_image():
    response = client.post(
        "/predict-image",
        files={"file": ("report.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 415


def test_severity_thresholds():
    assert severity_from(0.95, 0.95) == "Critical"
    assert severity_from(0.72, 0.72) == "High"
    assert severity_from(0.50, 0.50) == "Medium"
    assert severity_from(0.30, 0.30) == "Low"
