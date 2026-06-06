"""Tests for NLP request categorization."""

from app.models.nlp.categorizer import RequestCategorizer


def test_categorize_hvac():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("The air conditioning unit is not cooling properly and the thermostat is broken")
    assert result["category"] == "HVAC"
    assert result["confidence"] > 0


def test_categorize_plumbing():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("There is a leak under the kitchen sink and the faucet is dripping")
    assert result["category"] == "Plumbing"
    assert result["confidence"] > 0


def test_categorize_electrical():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("The circuit breaker keeps tripping and several outlets are not working")
    assert result["category"] == "Electrical"
    assert result["confidence"] > 0


def test_categorize_appliance():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("The refrigerator is making a loud noise and the ice maker stopped working")
    assert result["category"] == "Appliance"
    assert result["confidence"] > 0


def test_categorize_general():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("Need a routine maintenance inspection for the building")
    assert result["category"] == "General"
    assert result["confidence"] > 0


def test_categorize_ambiguous():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("Something is wrong but I don't know what")
    assert result["category"] in ("General", "Other", "HVAC", "Plumbing", "Electrical", "Appliance")
    assert "all_scores" in result


def test_categorize_empty():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("")
    assert result["category"] == "General"
    assert result["confidence"] == 1.0
    assert result["method"] == "empty_text"


def test_categorize_whitespace():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("   ")
    assert result["category"] == "General"
    assert result["method"] == "empty_text"


def test_categorize_returns_all_scores():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("The furnace is not heating")
    assert "all_scores" in result
    assert isinstance(result["all_scores"], dict)


def test_categorize_method_present():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("Fix the broken pipe")
    assert result["method"] in ("tfidf", "rule_based", "empty_text")


def test_categorize_batch():
    categorizer = RequestCategorizer()
    texts = [
        "Air conditioning broken",
        "Toilet is clogged",
        "Lights flickering in the office",
    ]
    results = categorizer.categorize_batch(texts)
    assert len(results) == 3
    assert results[0]["category"] == "HVAC"
    assert results[1]["category"] == "Plumbing"
    assert results[2]["category"] == "Electrical"


def test_categorize_batch_empty_list():
    categorizer = RequestCategorizer()
    results = categorizer.categorize_batch([])
    assert results == []


def test_categorize_confidence_range():
    categorizer = RequestCategorizer()
    result = categorizer.categorize("The heating system needs a new furnace filter")
    assert 0.0 <= result["confidence"] <= 1.0
