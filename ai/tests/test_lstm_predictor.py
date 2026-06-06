"""Tests for LSTM failure predictor."""


def test_lstm_predictor_init():
    from app.models.maintenance.lstm_predictor import LSTMPredictor

    predictor = LSTMPredictor()
    assert predictor is not None


def test_lstm_predict_without_model():
    from app.models.maintenance.lstm_predictor import LSTMPredictor

    predictor = LSTMPredictor()
    result = predictor.predict(equipment_id="eq-1")
    assert result["equipment_id"] == "eq-1"
    assert "failure_probability" in result
    assert "health_score" in result
    assert 0 <= result["failure_probability"] <= 1
    assert 0 <= result["health_score"] <= 100


def test_lstm_predict_with_sensor_data():
    from app.models.maintenance.lstm_predictor import LSTMPredictor

    predictor = LSTMPredictor()
    sensor_data = [
        {"temperature": 85.0, "vibration": 4.0, "pressure": 10.0},
        {"temperature": 90.0, "vibration": 6.0, "pressure": 12.0},
    ]
    result = predictor.predict(sensor_data=sensor_data, equipment_id="eq-2")
    assert result["equipment_id"] == "eq-2"
    assert result["failure_probability"] > 0


def test_lstm_predict_with_historical_data():
    from app.models.maintenance.lstm_predictor import LSTMPredictor

    predictor = LSTMPredictor()
    historical_data = [
        {"type": "failure", "date": "2024-01-01T00:00:00Z"},
        {"type": "failure", "date": "2024-03-01T00:00:00Z"},
        {"type": "failure", "date": "2024-05-01T00:00:00Z"},
        {"type": "failure", "date": "2024-07-01T00:00:00Z"},
    ]
    result = predictor.predict(
        equipment_id="eq-3",
        historical_data=historical_data,
    )
    assert result["failure_probability"] > 0


def test_lstm_feature_extraction():
    from app.models.maintenance.lstm_predictor import LSTMPredictor

    predictor = LSTMPredictor()
    sensor_data = [
        {"temperature": 75.0, "vibration": 2.0, "pressure": 5.0, "humidity": 60.0, "current": 10.0, "rpm": 1500},
    ]
    features = predictor.extract_features(sensor_data)
    assert len(features) == 1
    assert len(features[0]) == 6
    assert features[0][0] == 75.0


def test_lstm_api_endpoint_unauthorized(client):
    response = client.post("/api/predict/failure/lstm", json={
        "equipment_id": "eq-1",
    })
    assert response.status_code in (401, 403)


def test_lstm_api_endpoint_success(client, auth_headers):
    response = client.post(
        "/api/predict/failure/lstm",
        json={"equipment_id": "eq-1"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["equipment_id"] == "eq-1"
