def test_maintenance_prediction_unauthorized(client):
    response = client.post("/api/predict/maintenance", json={
        "equipment_id": "eq-1",
    })
    assert response.status_code in (401, 403)


def test_maintenance_prediction_success(client, auth_headers):
    response = client.post(
        "/api/predict/maintenance",
        json={"equipment_id": "eq-1"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["equipment_id"] == "eq-1"
    assert "failure_probability" in data["data"]
    assert "health_score" in data["data"]


def test_maintenance_prediction_with_history(client, auth_headers):
    """Test maintenance prediction with historical data"""
    historical_data = [
        {"type": "maintenance", "date": "2024-01-01T00:00:00Z"},
        {"type": "failure", "date": "2024-03-01T00:00:00Z"},
    ]

    response = client.post(
        "/api/predict/maintenance",
        json={
            "equipment_id": "eq-2",
            "historical_data": historical_data,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["equipment_id"] == "eq-2"
    assert 0 <= data["data"]["failure_probability"] <= 1
    assert 0 <= data["data"]["health_score"] <= 100
    assert "recommended_action" in data["data"]


def test_maintenance_prediction_with_sensor_data(client, auth_headers):
    """Test maintenance prediction with sensor data"""
    sensor_data = [
        {"temperature": 85.0, "vibration": 3.5},
        {"temperature": 88.0, "vibration": 4.0},
    ]

    response = client.post(
        "/api/predict/maintenance",
        json={
            "equipment_id": "eq-3",
            "sensor_data": sensor_data,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["health_score"] <= 100


def test_demand_forecast_unauthorized(client):
    response = client.post("/api/predict/demand", json={})
    assert response.status_code in (401, 403)


def test_demand_forecast_success(client, auth_headers):
    response = client.post(
        "/api/predict/demand",
        json={"service_type": "hvac", "horizon_days": 14},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "forecast" in data["data"]
    assert "trend" in data["data"]


def test_ensemble_prediction_unauthorized(client):
    response = client.post("/api/predict/failure/ensemble", json={
        "equipment_id": "eq-1",
    })
    assert response.status_code in (401, 403)


def test_ensemble_prediction_success(client, auth_headers):
    response = client.post(
        "/api/predict/failure/ensemble",
        json={
            "equipment_id": "eq-1",
            "lstm_weight": 0.5,
            "prophet_weight": 0.5,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["equipment_id"] == "eq-1"
    assert data["data"]["model_type"] == "ensemble"


def test_health_score_endpoint(client, auth_headers):
    response = client.post(
        "/api/predict/health-score",
        json={"equipment_id": "eq-1"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "health_score" in data["data"]


def test_health_score_batch_endpoint(client, auth_headers):
    response = client.post(
        "/api/predict/health-score/batch",
        json={
            "equipment_list": [
                {"equipment_id": "eq-1"},
                {"equipment_id": "eq-2"},
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["total_scored"] == 2
