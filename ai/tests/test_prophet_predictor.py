"""Tests for Prophet failure predictor."""


def test_prophet_predictor_init():
    from app.models.maintenance.prophet_predictor import ProphetPredictor

    predictor = ProphetPredictor()
    assert predictor is not None


def test_prophet_predict_without_data():
    from app.models.maintenance.prophet_predictor import ProphetPredictor

    predictor = ProphetPredictor()
    result = predictor.predict(equipment_id="eq-1")
    assert result["equipment_id"] == "eq-1"
    assert "failure_probability" in result
    assert "health_score" in result
    assert result["model_type"] == "exponential_decay_fallback"


def test_prophet_predict_with_historical_data():
    from app.models.maintenance.prophet_predictor import ProphetPredictor

    predictor = ProphetPredictor()
    historical_data = [
        {"type": "maintenance", "date": "2024-01-01T00:00:00Z"},
        {"type": "failure", "date": "2024-03-01T00:00:00Z"},
        {"type": "maintenance", "date": "2024-04-01T00:00:00Z"},
        {"type": "issue", "date": "2024-06-01T00:00:00Z"},
    ]
    result = predictor.predict(
        equipment_id="eq-2",
        historical_data=historical_data,
        horizon_days=30,
    )
    assert result["equipment_id"] == "eq-2"
    assert 0 <= result["failure_probability"] <= 1
    assert 0 <= result["health_score"] <= 100


def test_prophet_forecast_output():
    from app.models.maintenance.prophet_predictor import ProphetPredictor

    predictor = ProphetPredictor()
    historical_data = [
        {"type": "failure", "date": "2024-01-01T00:00:00Z"},
        {"type": "failure", "date": "2024-02-01T00:00:00Z"},
        {"type": "failure", "date": "2024-03-01T00:00:00Z"},
    ]
    result = predictor.predict(
        equipment_id="eq-3",
        historical_data=historical_data,
        horizon_days=30,
    )
    assert "forecast" in result
    if result.get("forecast"):
        assert "date" in result["forecast"][0]
        assert "failure_probability" in result["forecast"][0]


def test_prophet_api_endpoint_unauthorized(client):
    response = client.post("/api/predict/failure/prophet", json={
        "equipment_id": "eq-1",
    })
    assert response.status_code in (401, 403)


def test_prophet_api_endpoint_success(client, auth_headers):
    response = client.post(
        "/api/predict/failure/prophet",
        json={"equipment_id": "eq-1", "horizon_days": 30},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["equipment_id"] == "eq-1"
