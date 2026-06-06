"""Tests for priority suggestion based on sentiment analysis."""

from app.models.nlp.priority_suggester import PrioritySuggester


def test_urgent_keywords():
    suggester = PrioritySuggester()
    result = suggester.suggest("Emergency! There is a gas leak in the building")
    assert result["suggested_priority"] == "urgent"
    assert result["urgency_detected"] is True
    assert result["confidence"] >= 0.9


def test_urgent_flooding():
    suggester = PrioritySuggester()
    result = suggester.suggest("The basement is flooding and water is everywhere")
    assert result["suggested_priority"] == "urgent"
    assert result["urgency_detected"] is True


def test_urgent_no_power():
    suggester = PrioritySuggester()
    result = suggester.suggest("We have no power in the entire building")
    assert result["suggested_priority"] == "urgent"
    assert result["urgency_detected"] is True


def test_high_priority_negative_sentiment():
    suggester = PrioritySuggester()
    result = suggester.suggest("This is terrible, the system completely failed and is broken and damaged beyond use")
    assert result["suggested_priority"] in ("high", "urgent")
    assert result["sentiment"] == "negative"


def test_medium_priority():
    suggester = PrioritySuggester()
    result = suggester.suggest("The unit stopped working")
    assert result["suggested_priority"] in ("medium", "high", "low")


def test_low_priority_neutral():
    suggester = PrioritySuggester()
    result = suggester.suggest("I would like to schedule a routine maintenance visit next month")
    assert result["suggested_priority"] == "low"
    assert result["urgency_detected"] is False


def test_low_priority_positive():
    suggester = PrioritySuggester()
    result = suggester.suggest("Everything is working great, just need a regular checkup")
    assert result["suggested_priority"] == "low"
    assert result["sentiment"] in ("positive", "neutral")


def test_empty_text():
    suggester = PrioritySuggester()
    result = suggester.suggest("")
    assert result["suggested_priority"] == "low"
    assert result["confidence"] == 1.0
    assert result["urgency_detected"] is False


def test_whitespace_text():
    suggester = PrioritySuggester()
    result = suggester.suggest("   ")
    assert result["suggested_priority"] == "low"


def test_result_fields():
    suggester = PrioritySuggester()
    result = suggester.suggest("The heater is not working")
    assert "suggested_priority" in result
    assert "confidence" in result
    assert "sentiment" in result
    assert "urgency_detected" in result
    assert "reasoning" in result
    assert "text" in result


def test_confidence_range():
    suggester = PrioritySuggester()
    result = suggester.suggest("Need to fix the broken appliance soon")
    assert 0.0 <= result["confidence"] <= 1.0


def test_batch_suggest():
    suggester = PrioritySuggester()
    texts = [
        "Emergency gas leak!",
        "Everything is fine, just a checkup",
        "The system is completely broken and terrible",
    ]
    results = suggester.suggest_batch(texts)
    assert len(results) == 3
    assert results[0]["suggested_priority"] == "urgent"
    assert results[1]["suggested_priority"] == "low"


def test_batch_empty_list():
    suggester = PrioritySuggester()
    results = suggester.suggest_batch([])
    assert results == []


def test_combined_urgency_and_negative_sentiment():
    suggester = PrioritySuggester()
    result = suggester.suggest("This is an emergency! Terrible situation, dangerous gas leak everywhere!")
    assert result["suggested_priority"] == "urgent"
    assert result["urgency_detected"] is True


def test_safety_hazard():
    suggester = PrioritySuggester()
    result = suggester.suggest("There is a safety hazard with exposed wiring")
    assert result["suggested_priority"] == "urgent"
    assert result["urgency_detected"] is True
