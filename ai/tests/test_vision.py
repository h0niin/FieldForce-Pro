"""Tests for computer vision API endpoints and models."""
import io


def test_verify_work_unauthorized(client):
    response = client.post("/api/vision/verify-work")
    assert response.status_code in (401, 403, 422)


def test_verify_work_success(client, auth_headers):
    """Verify work with a fake image."""
    # Create a simple 10x10 PNG-like image
    from PIL import Image
    img = Image.new("RGB", (100, 100), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/api/vision/verify-work",
        headers=auth_headers,
        files={"file": ("test.png", buf, "image/png")},
        data={"work_order_id": "wo-123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "verified" in data["data"]
    assert "confidence" in data["data"]
    assert "findings" in data["data"]


def test_identify_equipment_unauthorized(client):
    response = client.post("/api/vision/identify-equipment")
    assert response.status_code in (401, 403, 422)


def test_identify_equipment_success(client, auth_headers):
    from PIL import Image
    img = Image.new("RGB", (100, 100), color=(200, 200, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/api/vision/identify-equipment",
        headers=auth_headers,
        files={"file": ("equip.png", buf, "image/png")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "detections" in data["data"]
    assert "equipment_count" in data["data"]


def test_compare_before_after_unauthorized(client):
    response = client.post("/api/vision/compare-before-after")
    assert response.status_code in (401, 403, 422)


def test_compare_before_after_success(client, auth_headers):
    from PIL import Image

    # Before: red image
    before_img = Image.new("RGB", (100, 100), color=(255, 0, 0))
    before_buf = io.BytesIO()
    before_img.save(before_buf, format="PNG")
    before_buf.seek(0)

    # After: blue image (different)
    after_img = Image.new("RGB", (100, 100), color=(0, 0, 255))
    after_buf = io.BytesIO()
    after_img.save(after_buf, format="PNG")
    after_buf.seek(0)

    response = client.post(
        "/api/vision/compare-before-after",
        headers=auth_headers,
        files=[
            ("before", ("before.png", before_buf, "image/png")),
            ("after", ("after.png", after_buf, "image/png")),
        ],
        data={"work_order_id": "wo-456"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["significant_change"] is True
    assert data["data"]["change_percentage"] > 0


def test_compare_identical_images(client, auth_headers):
    from PIL import Image

    img = Image.new("RGB", (100, 100), color=(128, 128, 128))
    buf1 = io.BytesIO()
    img.save(buf1, format="PNG")
    buf1.seek(0)

    buf2 = io.BytesIO()
    img.save(buf2, format="PNG")
    buf2.seek(0)

    response = client.post(
        "/api/vision/compare-before-after",
        headers=auth_headers,
        files=[
            ("before", ("before.png", buf1, "image/png")),
            ("after", ("after.png", buf2, "image/png")),
        ],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["significant_change"] is False
    assert data["data"]["change_percentage"] < 2.0


# --- Model unit tests ---

def test_work_verifier_no_model():
    from app.models.vision.work_verifier import WorkVerifier
    verifier = WorkVerifier()
    result = verifier.verify(b"fake", work_order_id="wo-1")
    assert result["verified"] is False
    assert len(result["issues"]) > 0


def test_equipment_detector_no_model():
    from app.models.vision.equipment_detector import EquipmentDetector
    detector = EquipmentDetector()
    result = detector.detect(b"fake")
    assert result["equipment_count"] == 0


def test_before_after_comparator():
    from app.models.vision.before_after import BeforeAfterComparator
    comparator = BeforeAfterComparator()

    try:
        from PIL import Image
        import numpy as np

        # Create two different images
        before = Image.new("RGB", (50, 50), color=(255, 0, 0))
        after = Image.new("RGB", (50, 50), color=(0, 255, 0))

        before_buf = io.BytesIO()
        before.save(before_buf, format="PNG")
        after_buf = io.BytesIO()
        after.save(after_buf, format="PNG")

        result = comparator.compare(before_buf.getvalue(), after_buf.getvalue(), "wo-test")
        assert result["significant_change"] is True
        assert result["change_percentage"] > 0
    except ImportError:
        # PIL not available, test placeholder
        result = comparator.compare(b"fake1", b"fake2")
        assert result["significant_change"] is False
