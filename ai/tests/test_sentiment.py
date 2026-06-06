"""Tests for sentiment analysis model."""

from app.models.nlp.sentiment import SentimentAnalyzer


def test_sentiment_analyzer_positive():
    """Test positive sentiment detection."""
    analyzer = SentimentAnalyzer()
    result = analyzer.analyze("The service was excellent and the technician was very professional")
    assert result["sentiment"] == "positive"
    assert result["confidence"] > 0


def test_sentiment_analyzer_negative():
    """Test negative sentiment detection."""
    analyzer = SentimentAnalyzer()
    result = analyzer.analyze("Terrible experience, the technician was rude and incompetent")
    assert result["sentiment"] == "negative"
    assert result["confidence"] > 0


def test_sentiment_analyzer_neutral():
    """Test neutral sentiment detection."""
    analyzer = SentimentAnalyzer()
    result = analyzer.analyze("The technician arrived at 3pm")
    assert result["sentiment"] == "neutral"


def test_sentiment_analyzer_empty():
    """Test empty text."""
    analyzer = SentimentAnalyzer()
    result = analyzer.analyze("")
    assert result["sentiment"] == "neutral"
    assert result["confidence"] == 1.0


def test_sentiment_batch():
    """Test batch analysis."""
    analyzer = SentimentAnalyzer()
    results = analyzer.analyze_batch(["Great!", "Terrible!", "Okay"])
    assert len(results) == 3


def test_sentiment_negation():
    """Test negation handling."""
    analyzer = SentimentAnalyzer()
    result = analyzer.analyze("not good at all")
    # "not good" should flip to negative
    assert result["sentiment"] in ("negative", "neutral")
