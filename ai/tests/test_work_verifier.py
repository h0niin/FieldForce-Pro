"""Tests for computer vision work verification model (YOLOv8)."""

import io

import pytest


def _make_image(width: int, height: int, color: tuple = (128, 128, 128)) -> bytes:
    """Helper to create a test PNG image."""
    from PIL import Image

    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_dark_image() -> bytes:
    return _make_image(200, 200, color=(5, 5, 5))


def _make_bright_image() -> bytes:
    return _make_image(200, 200, color=(250, 250, 250))


def _make_tiny_image() -> bytes:
    return _make_image(50, 50)


# ─── WorkVerifier unit tests ─────────────────────────────────────────


def test_verifier_instantiation():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    assert verifier.model is None  # No model path provided


def test_verifier_placeholder_on_invalid_bytes():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    result = verifier.verify(b"not_an_image", work_order_id="wo-1")
    assert result["verified"] is False
    assert len(result["issues"]) > 0


def test_verifier_rule_based_normal_image():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_image(400, 400)
    result = verifier.verify(image_bytes, work_order_id="wo-normal")
    assert "verified" in result
    assert "confidence" in result
    assert "findings" in result
    assert "issues" in result
    assert result.get("work_order_id") == "wo-normal"


def test_verifier_dark_image_detected():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_dark_image()
    result = verifier.verify(image_bytes)
    # Should flag as too dark
    dark_issues = [i for i in result["issues"] if "dark" in i.lower()]
    assert len(dark_issues) > 0
    assert result["verified"] is False


def test_verifier_bright_image_detected():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_bright_image()
    result = verifier.verify(image_bytes)
    # Should flag as overexposed
    bright_issues = [i for i in result["issues"] if "overexposed" in i.lower() or "bright" in i.lower()]
    assert len(bright_issues) > 0


def test_verifier_low_resolution_detected():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_tiny_image()
    result = verifier.verify(image_bytes)
    low_res_issues = [i for i in result["issues"] if "resolution" in i.lower()]
    assert len(low_res_issues) > 0


def test_verifier_empty_bytes():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    result = verifier.verify(b"")
    assert result["verified"] is False


def test_verifier_work_order_id_passthrough():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_image(300, 300)
    result = verifier.verify(image_bytes, work_order_id="wo-abc-123")
    assert result.get("work_order_id") == "wo-abc-123"


def test_verifier_findings_are_list():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_image(300, 300)
    result = verifier.verify(image_bytes)
    assert isinstance(result["findings"], list)
    assert isinstance(result["issues"], list)


def test_verifier_rule_based_method_tag():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_image(300, 300)
    result = verifier.verify(image_bytes)
    # Rule-based path should be used when no YOLO model is loaded
    assert result.get("method") == "rule_based" or "YOLO model not loaded" in str(result.get("issues", []))


def test_verifier_confidence_range():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_image(400, 400)
    result = verifier.verify(image_bytes)
    assert 0.0 <= result["confidence"] <= 1.0


def test_verifier_total_detections():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    image_bytes = _make_image(400, 400)
    result = verifier.verify(image_bytes)
    assert "total_detections" in result
    assert isinstance(result["total_detections"], int)


# ─── YOLO model loading ──────────────────────────────────────────────


def test_verifier_load_invalid_model_path():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier(model_path="/nonexistent/model.pt")
    # Should not crash, just have model = None
    assert verifier.model is None


def test_verifier_train_without_ultralytics():
    from app.models.vision.work_verifier import WorkVerifier, ULTRALYTICS_AVAILABLE
    verifier = WorkVerifier()
    if not ULTRALYTICS_AVAILABLE:
        result = verifier.train("fake_data.yaml")
        assert result["success"] is False


# ─── Verification classes ─────────────────────────────────────────────


def test_verification_classes_defined():
    from app.models.vision.work_verifier import WORK_VERIFICATION_CLASSES
    assert len(WORK_VERIFICATION_CLASSES) == 10
    assert "completed_work" in WORK_VERIFICATION_CLASSES
    assert "safety_hazard" in WORK_VERIFICATION_CLASSES
    assert "damaged_equipment" in WORK_VERIFICATION_CLASSES


def test_verification_thresholds_defined():
    from app.models.vision.work_verifier import VERIFICATION_THRESHOLD, HIGH_CONFIDENCE_THRESHOLD
    assert VERIFICATION_THRESHOLD == 0.5
    assert HIGH_CONFIDENCE_THRESHOLD == 0.8


# ─── API endpoint integration tests ──────────────────────────────────


def test_verify_work_api_success(client, auth_headers):
    image_bytes = _make_image(300, 300)
    response = client.post(
        "/api/vision/verify-work",
        headers=auth_headers,
        files={"file": ("test.png", io.BytesIO(image_bytes), "image/png")},
        data={"work_order_id": "wo-api-test", "verification_type": "completion"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "verified" in data["data"]
    assert "confidence" in data["data"]
    assert "findings" in data["data"]
    assert "issues" in data["data"]


def test_verify_work_api_unauthorized(client):
    response = client.post("/api/vision/verify-work")
    assert response.status_code in (401, 403, 422)


def test_verify_work_api_dark_image(client, auth_headers):
    image_bytes = _make_dark_image()
    response = client.post(
        "/api/vision/verify-work",
        headers=auth_headers,
        files={"file": ("dark.png", io.BytesIO(image_bytes), "image/png")},
        data={"work_order_id": "wo-dark"},
    )
    assert response.status_code == 200
    data = response.json()
    # Should detect issues with dark image
    assert len(data["data"]["issues"]) > 0
