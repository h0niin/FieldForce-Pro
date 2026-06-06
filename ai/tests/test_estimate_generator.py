"""Tests for AI estimate generation from request descriptions."""

from app.models.nlp.estimate_generator import EstimateGenerator


def test_generate_hvac_estimate():
    gen = EstimateGenerator()
    result = gen.generate("The air conditioning unit is not cooling and the thermostat seems broken")
    assert result["category"] == "HVAC"
    assert len(result["line_items"]) >= 2
    assert result["subtotal"] > 0
    assert result["total"] >= result["subtotal"]


def test_generate_plumbing_estimate():
    gen = EstimateGenerator()
    result = gen.generate("There is a leak under the kitchen sink and the faucet is dripping")
    assert result["category"] == "Plumbing"
    assert len(result["line_items"]) >= 2
    assert result["total"] > 0


def test_generate_electrical_estimate():
    gen = EstimateGenerator()
    result = gen.generate("The circuit breaker keeps tripping and outlets are not working")
    assert result["category"] == "Electrical"
    assert len(result["line_items"]) >= 2


def test_generate_appliance_estimate():
    gen = EstimateGenerator()
    result = gen.generate("The refrigerator is making noise and the ice maker stopped")
    assert result["category"] == "Appliance"
    assert len(result["line_items"]) >= 1


def test_generate_general_estimate():
    gen = EstimateGenerator()
    result = gen.generate("Need a routine maintenance inspection for the building")
    assert result["category"] == "General"
    assert len(result["line_items"]) >= 1


def test_empty_description():
    gen = EstimateGenerator()
    result = gen.generate("")
    assert result["category"] == "General"
    assert result["line_items"] == []
    assert result["total"] == 0.0
    assert result["confidence"] == 0.0


def test_whitespace_description():
    gen = EstimateGenerator()
    result = gen.generate("   ")
    assert result["total"] == 0.0
    assert result["line_items"] == []


def test_line_items_have_required_fields():
    gen = EstimateGenerator()
    result = gen.generate("Fix the broken pipe and replace the valve")
    for item in result["line_items"]:
        assert "type" in item
        assert "name" in item
        assert "unit_price" in item
        assert "quantity" in item
        assert "total" in item
        assert "sort_order" in item
        assert item["type"] in ("service", "part", "travel")


def test_parts_detected_from_keywords():
    gen = EstimateGenerator()
    result = gen.generate("The thermostat is broken and needs replacement")
    part_items = [i for i in result["line_items"] if i["type"] == "part"]
    assert len(part_items) >= 1
    part_names = [p["name"] for p in part_items]
    assert any("Thermostat" in name for name in part_names)


def test_travel_charge_included():
    gen = EstimateGenerator()
    result = gen.generate("Fix the leaking faucet", include_travel=True)
    travel_items = [i for i in result["line_items"] if i["type"] == "travel"]
    assert len(travel_items) == 1


def test_travel_charge_excluded():
    gen = EstimateGenerator()
    result = gen.generate("Fix the leaking faucet", include_travel=False)
    travel_items = [i for i in result["line_items"] if i["type"] == "travel"]
    assert len(travel_items) == 0


def test_tax_calculated():
    gen = EstimateGenerator()
    result = gen.generate("Replace the circuit breaker in the panel")
    assert result["tax"] > 0
    assert result["total"] == round(result["subtotal"] + result["tax"], 2)


def test_confidence_range():
    gen = EstimateGenerator()
    result = gen.generate("The furnace is not heating the house")
    assert 0.0 <= result["confidence"] <= 1.0


def test_priority_included():
    gen = EstimateGenerator()
    result = gen.generate("Emergency! Gas leak in the kitchen, very dangerous")
    assert result["priority"] == "urgent"


def test_priority_low_for_routine():
    gen = EstimateGenerator()
    result = gen.generate("Schedule a routine annual maintenance check")
    assert result["priority"] == "low"


def test_reasoning_present():
    gen = EstimateGenerator()
    result = gen.generate("Toilet is clogged and overflowing")
    assert len(result["reasoning"]) > 0
    assert "Category" in result["reasoning"]


def test_estimated_duration():
    gen = EstimateGenerator()
    result = gen.generate("Need HVAC system repair and filter replacement")
    assert result["estimated_duration_minutes"] > 0


def test_batch_generation():
    gen = EstimateGenerator()
    descriptions = [
        "Air conditioning broken",
        "Toilet is clogged",
        "Lights flickering",
    ]
    results = gen.generate_batch(descriptions)
    assert len(results) == 3
    assert all(r["total"] > 0 for r in results)


def test_batch_empty_list():
    gen = EstimateGenerator()
    results = gen.generate_batch([])
    assert results == []


def test_multiple_parts_detected():
    gen = EstimateGenerator()
    result = gen.generate("Need to replace the faucet and fix the valve under the sink, pipe is cracked")
    part_items = [i for i in result["line_items"] if i["type"] == "part"]
    assert len(part_items) >= 2


def test_subtotal_is_sum_of_line_items():
    gen = EstimateGenerator()
    result = gen.generate("Repair the broken outlet and replace the switch")
    item_total = sum(i["total"] for i in result["line_items"])
    assert abs(result["subtotal"] - item_total) < 0.01
