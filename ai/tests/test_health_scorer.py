"""
Unit tests for the HealthScorer model.

Tests cover:
- Basic health scoring
- Maintenance history evaluation
- Issue pattern detection
- Age degradation calculation
- Sensor data anomaly detection
- Risk level categorization
- Recommendations generation
"""

import pytest
from datetime import datetime, timedelta
from app.models.maintenance.health_scorer import HealthScorer


class TestHealthScorer:
    """Test suite for HealthScorer model"""

    @pytest.fixture
    def scorer(self):
        """Create a HealthScorer instance for testing"""
        return HealthScorer()

    def test_scorer_initialization(self, scorer):
        """Test that scorer initializes correctly"""
        assert scorer is not None
        assert scorer.available is not None
        assert scorer.numpy_available is not None

    def test_perfect_health_no_data(self, scorer):
        """Test scoring with no historical data returns perfect health"""
        result = scorer.score(equipment_id="test-001")

        assert result["equipment_id"] == "test-001"
        assert result["health_score"] == 100.0
        assert result["risk_level"] == "low"
        assert len(result["factors"]) == 0
        assert "Continue regular maintenance schedule" in result["recommendations"]

    def test_no_maintenance_history_penalty(self, scorer):
        """Test that lack of maintenance history reduces health score"""
        historical_data = [
            {"type": "installation", "date": "2020-01-01T00:00:00Z"}
        ]

        result = scorer.score(
            equipment_id="test-002",
            historical_data=historical_data
        )

        assert result["health_score"] < 100.0
        assert any("No Maintenance History" in f["factor"] for f in result["factors"])

    def test_overdue_maintenance_penalty(self, scorer):
        """Test that overdue maintenance significantly reduces health score"""
        old_date = (datetime.now() - timedelta(days=200)).isoformat()
        historical_data = [
            {"type": "maintenance", "date": old_date}
        ]

        result = scorer.score(
            equipment_id="test-003",
            historical_data=historical_data
        )

        assert result["health_score"] < 100.0
        assert any("Overdue Maintenance" in f["factor"] for f in result["factors"])
        assert "Schedule overdue maintenance immediately" in result["recommendations"]

    def test_high_failure_rate_critical(self, scorer):
        """Test that high failure rate results in critical risk"""
        historical_data = [
            {"type": "failure", "date": "2024-01-01T00:00:00Z"},
            {"type": "failure", "date": "2024-02-01T00:00:00Z"},
            {"type": "failure", "date": "2024-03-01T00:00:00Z"},
            {"type": "failure", "date": "2024-04-01T00:00:00Z"},
            {"type": "failure", "date": "2024-05-01T00:00:00Z"},
            {"type": "failure", "date": "2024-06-01T00:00:00Z"},
        ]

        result = scorer.score(
            equipment_id="test-004",
            historical_data=historical_data
        )

        assert result["health_score"] < 75.0
        assert any("High Failure Rate" in f["factor"] for f in result["factors"])
        assert "Review maintenance procedures" in result["recommendations"]

    def test_equipment_age_degradation(self, scorer):
        """Test that old equipment gets age degradation penalty"""
        old_install_date = (datetime.now() - timedelta(days=365 * 12)).isoformat()
        historical_data = [
            {"type": "installation", "date": old_install_date}
        ]

        result = scorer.score(
            equipment_id="test-005",
            historical_data=historical_data
        )

        assert result["health_score"] < 100.0
        assert any("Equipment Age" in f["factor"] for f in result["factors"])

    def test_risk_level_calculation(self, scorer):
        """Test risk level categorization"""
        # Low risk (80-100)
        result_low = scorer.score(equipment_id="test-low")
        assert result_low["risk_level"] == "low"

        # High risk (40-60)
        historical_data_high_risk = [
            {"type": "failure", "date": "2024-01-01T00:00:00Z"},
            {"type": "failure", "date": "2024-02-01T00:00:00Z"},
            {"type": "failure", "date": "2024-03-01T00:00:00Z"},
            {"type": "failure", "date": "2024-04-01T00:00:00Z"},
            {"type": "failure", "date": "2024-05-01T00:00:00Z"},
            {"type": "failure", "date": "2024-06-01T00:00:00Z"},
            {"type": "maintenance", "date": (datetime.now() - timedelta(days=200)).isoformat()},
        ]
        result_high = scorer.score(
            equipment_id="test-high",
            historical_data=historical_data_high_risk
        )
        assert result_high["risk_level"] in ["high", "critical"]

    def test_sensor_data_temperature_anomaly(self, scorer):
        """Test temperature anomaly detection in sensor data"""
        sensor_data = [
            {"temperature": 85.0, "timestamp": "2024-01-01T00:00:00Z"},
            {"temperature": 87.0, "timestamp": "2024-01-01T01:00:00Z"},
            {"temperature": 90.0, "timestamp": "2024-01-01T02:00:00Z"},
        ]

        result = scorer.score(
            equipment_id="test-006",
            sensor_data=sensor_data
        )

        # Only test if numpy is available
        if scorer.numpy_available:
            assert any("Temperature" in f["factor"] for f in result["factors"])
            assert "Check cooling system and ventilation" in result["recommendations"]

    def test_sensor_data_vibration_anomaly(self, scorer):
        """Test vibration anomaly detection in sensor data"""
        sensor_data = [
            {"vibration": 6.5, "timestamp": "2024-01-01T00:00:00Z"},
            {"vibration": 7.0, "timestamp": "2024-01-01T01:00:00Z"},
            {"vibration": 8.2, "timestamp": "2024-01-01T02:00:00Z"},
        ]

        result = scorer.score(
            equipment_id="test-007",
            sensor_data=sensor_data
        )

        # Only test if numpy is available
        if scorer.numpy_available:
            assert any("Vibration" in f["factor"] for f in result["factors"])
            assert "Inspect mounting and alignment" in result["recommendations"]

    def test_combined_factors(self, scorer):
        """Test scoring with multiple negative factors"""
        old_install_date = (datetime.now() - timedelta(days=365 * 11)).isoformat()
        old_maintenance_date = (datetime.now() - timedelta(days=200)).isoformat()

        historical_data = [
            {"type": "installation", "date": old_install_date},
            {"type": "maintenance", "date": old_maintenance_date},
            {"type": "failure", "date": "2024-01-01T00:00:00Z"},
            {"type": "failure", "date": "2024-03-01T00:00:00Z"},
            {"type": "failure", "date": "2024-05-01T00:00:00Z"},
        ]

        sensor_data = [
            {"temperature": 75.0, "vibration": 6.0},
            {"temperature": 78.0, "vibration": 6.5},
            {"temperature": 82.0, "vibration": 7.0},
        ]

        result = scorer.score(
            equipment_id="test-008",
            historical_data=historical_data,
            sensor_data=sensor_data
        )

        # Should have multiple negative factors
        assert len(result["factors"]) > 2
        assert result["health_score"] < 70.0
        assert result["risk_level"] in ["medium", "high", "critical"]
        assert len(result["recommendations"]) > 1

    def test_health_score_bounds(self, scorer):
        """Test that health score stays within 0-100 bounds"""
        # Create worst-case scenario
        old_install_date = (datetime.now() - timedelta(days=365 * 15)).isoformat()
        old_maintenance_date = (datetime.now() - timedelta(days=365)).isoformat()

        historical_data = [
            {"type": "installation", "date": old_install_date},
            {"type": "maintenance", "date": old_maintenance_date},
        ] + [
            {"type": "failure", "date": (datetime.now() - timedelta(days=30 * i)).isoformat()}
            for i in range(10)
        ]

        sensor_data = [
            {"temperature": 100.0, "vibration": 10.0}
            for _ in range(5)
        ]

        result = scorer.score(
            equipment_id="test-009",
            historical_data=historical_data,
            sensor_data=sensor_data
        )

        assert 0 <= result["health_score"] <= 100
        assert result["risk_level"] == "critical"

    def test_recommendations_unique(self, scorer):
        """Test that recommendations don't contain duplicates"""
        historical_data = [
            {"type": "failure", "date": "2024-01-01T00:00:00Z"},
            {"type": "failure", "date": "2024-02-01T00:00:00Z"},
            {"type": "failure", "date": "2024-03-01T00:00:00Z"},
        ]

        result = scorer.score(
            equipment_id="test-010",
            historical_data=historical_data
        )

        # Check that all recommendations are unique
        assert len(result["recommendations"]) == len(set(result["recommendations"]))

    def test_algorithm_field_present(self, scorer):
        """Test that algorithm field is present in response"""
        result = scorer.score(equipment_id="test-011")

        assert "algorithm" in result
        assert result["algorithm"] == "baseline_rule_based"
        assert "ml_available" in result

    def test_recent_maintenance_good_health(self, scorer):
        """Test that recent maintenance contributes to good health"""
        recent_date = (datetime.now() - timedelta(days=30)).isoformat()
        historical_data = [
            {"type": "maintenance", "date": recent_date}
        ]

        result = scorer.score(
            equipment_id="test-012",
            historical_data=historical_data
        )

        # Should not have overdue maintenance penalty
        assert not any("Overdue Maintenance" in f["factor"] for f in result["factors"])
        assert result["health_score"] >= 70.0
