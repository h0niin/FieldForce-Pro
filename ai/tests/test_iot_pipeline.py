"""Tests for IoT data pipeline."""


def test_iot_pipeline_init():
    from app.models.maintenance.iot_pipeline import IoTPipeline

    pipeline = IoTPipeline()
    assert pipeline is not None


def test_iot_ingest_valid_readings():
    from app.models.maintenance.iot_pipeline import IoTPipeline

    pipeline = IoTPipeline()
    readings = [
        {"sensor_type": "temperature", "value": 75.0, "equipment_id": "eq-1"},
        {"sensor_type": "vibration", "value": 3.5, "equipment_id": "eq-1"},
    ]
    result = pipeline.ingest(readings)
    assert result["total_received"] == 2
    assert result["total_accepted"] == 2
    assert result["total_rejected"] == 0


def test_iot_ingest_invalid_readings():
    from app.models.maintenance.iot_pipeline import IoTPipeline

    pipeline = IoTPipeline()
    readings = [
        {"sensor_type": "temperature", "value": 75.0},
        {"sensor_type": "invalid_type", "value": 10.0},
        {"value": 10.0},  # missing sensor_type
        {"sensor_type": "temperature"},  # missing value
    ]
    result = pipeline.ingest(readings)
    assert result["total_received"] == 4
    assert result["total_accepted"] == 1
    assert result["total_rejected"] == 3


def test_iot_anomaly_detection():
    from app.models.maintenance.iot_pipeline import IoTPipeline

    pipeline = IoTPipeline()
    readings = [
        {"sensor_type": "temperature", "value": 70.0},
        {"sensor_type": "temperature", "value": 72.0},
        {"sensor_type": "temperature", "value": 71.0},
        {"sensor_type": "temperature", "value": 73.0},
        {"sensor_type": "temperature", "value": 150.0},  # anomaly
    ]
    result = pipeline.detect_anomalies(readings)
    assert result["total_anomalies"] > 0
    assert "temperature" in result["sensors_analyzed"]


def test_iot_anomaly_detection_empty():
    from app.models.maintenance.iot_pipeline import IoTPipeline

    pipeline = IoTPipeline()
    result = pipeline.detect_anomalies([])
    assert result["total_anomalies"] == 0


def test_iot_aggregation():
    from app.models.maintenance.iot_pipeline import IoTPipeline

    pipeline = IoTPipeline()
    readings = [
        {"sensor_type": "temperature", "value": 70.0},
        {"sensor_type": "temperature", "value": 80.0},
        {"sensor_type": "temperature", "value": 75.0},
        {"sensor_type": "vibration", "value": 2.0},
        {"sensor_type": "vibration", "value": 3.0},
    ]
    result = pipeline.aggregate(readings, window_minutes=60)
    assert len(result["aggregations"]) == 2
    assert result["total_readings"] == 5

    temp_agg = next(a for a in result["aggregations"] if a["sensor_type"] == "temperature")
    assert temp_agg["min"] == 70.0
    assert temp_agg["max"] == 80.0
    assert temp_agg["count"] == 3


def test_iot_ingest_api_unauthorized(client):
    response = client.post("/api/predict/iot/ingest", json={
        "sensor_readings": [{"sensor_type": "temperature", "value": 75.0}],
    })
    assert response.status_code in (401, 403)


def test_iot_ingest_api_success(client, auth_headers):
    response = client.post(
        "/api/predict/iot/ingest",
        json={
            "sensor_readings": [
                {"sensor_type": "temperature", "value": 75.0, "equipment_id": "eq-1"},
                {"sensor_type": "vibration", "value": 3.0, "equipment_id": "eq-1"},
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["total_accepted"] == 2


def test_iot_anomaly_api_success(client, auth_headers):
    response = client.post(
        "/api/predict/iot/anomalies",
        json={
            "readings": [
                {"sensor_type": "temperature", "value": 70.0},
                {"sensor_type": "temperature", "value": 72.0},
                {"sensor_type": "temperature", "value": 71.0},
                {"sensor_type": "temperature", "value": 200.0},
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True


def test_iot_status_api_success(client, auth_headers):
    response = client.get(
        "/api/predict/iot/status/eq-1",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["equipment_id"] == "eq-1"
