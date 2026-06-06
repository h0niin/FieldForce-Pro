"""Tests for document parsing API endpoints."""


def test_parse_document_unauthorized(client):
    """Parse endpoint requires auth."""
    response = client.post("/api/documents/parse")
    assert response.status_code in (401, 403, 422)


def test_parse_document_success(client, auth_headers):
    """Parse document with a fake file."""
    import io
    response = client.post(
        "/api/documents/parse",
        headers=auth_headers,
        files={"file": ("test.png", io.BytesIO(b"fake image data"), "image/png")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "extracted_text" in data["data"]
    assert "confidence" in data["data"]


def test_parse_invoice_success(client, auth_headers):
    """Parse invoice endpoint."""
    import io
    response = client.post(
        "/api/documents/parse/invoice",
        headers=auth_headers,
        files={"file": ("invoice.png", io.BytesIO(b"fake invoice"), "image/png")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "fields" in data["data"]


def test_generate_report_unauthorized(client):
    """Report generation requires auth."""
    response = client.post("/api/documents/generate", json={
        "report_type": "work_order_summary",
    })
    assert response.status_code in (401, 403)


def test_generate_report_success(client, auth_headers):
    """Generate report placeholder."""
    response = client.post(
        "/api/documents/generate",
        headers=auth_headers,
        json={"report_type": "work_order_summary"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "report_type" in data["data"]
