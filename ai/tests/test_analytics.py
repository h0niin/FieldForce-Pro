"""Tests for analytics API endpoints."""


def test_nl_query_unauthorized(client):
    """NL query requires auth."""
    response = client.post("/api/analytics/nl-query", json={
        "query": "How many work orders?",
    })
    assert response.status_code in (401, 403)


def test_nl_query_success(client, auth_headers):
    """NL query returns result."""
    response = client.post(
        "/api/analytics/nl-query",
        headers=auth_headers,
        json={"query": "How many work orders are open?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "sql_query" in data["data"]
    assert "explanation" in data["data"]


def test_sentiment_unauthorized(client):
    """Sentiment requires auth."""
    response = client.post("/api/analytics/sentiment", json={
        "text": "Great service!",
    })
    assert response.status_code in (401, 403)


def test_sentiment_positive(client, auth_headers):
    """Sentiment analysis on positive text."""
    response = client.post(
        "/api/analytics/sentiment",
        headers=auth_headers,
        json={"text": "The technician was excellent and fixed everything quickly. Great service!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["sentiment"] == "positive"
    assert data["data"]["confidence"] > 0


def test_sentiment_negative(client, auth_headers):
    """Sentiment analysis on negative text."""
    response = client.post(
        "/api/analytics/sentiment",
        headers=auth_headers,
        json={"text": "Terrible experience. The technician was late and rude. Very disappointed."},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["sentiment"] == "negative"


def test_sentiment_batch(client, auth_headers):
    """Batch sentiment analysis."""
    response = client.post(
        "/api/analytics/sentiment/batch",
        headers=auth_headers,
        json={
            "texts": [
                "Great job!",
                "Terrible service",
                "It was okay",
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["total"] == 3
    assert len(data["data"]["results"]) == 3


def test_forecast_success(client, auth_headers):
    """Forecast endpoint placeholder."""
    response = client.post(
        "/api/analytics/forecast",
        headers=auth_headers,
        json={"metric": "work_orders", "horizon_days": 30},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True


def test_anomaly_detection_success(client, auth_headers):
    """Anomaly detection placeholder."""
    response = client.post(
        "/api/analytics/anomaly",
        headers=auth_headers,
        json={"metric": "revenue", "sensitivity": 0.5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
