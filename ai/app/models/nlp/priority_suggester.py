from __future__ import annotations

import logging
import re

from app.models.nlp.sentiment import SentimentAnalyzer

logger = logging.getLogger(__name__)

URGENCY_KEYWORDS: list[str] = [
    "emergency", "urgent", "asap", "immediately", "flooding",
    "fire", "no power", "dangerous", "safety hazard", "leaking gas",
    "gas leak", "sparking", "electrocution", "smoke", "carbon monoxide",
    "burst pipe", "sewage", "no heat", "no water", "life threatening",
]

HIGH_PRIORITY_KEYWORDS: list[str] = [
    "broken", "not working", "completely", "stopped",
    "failed", "down", "out of service", "inoperable",
    "critical", "severe", "major",
]


class PrioritySuggester:
    """Suggest service request priority based on sentiment and urgency detection."""

    def __init__(self) -> None:
        self._sentiment = SentimentAnalyzer()

    def suggest(self, text: str) -> dict:
        """Suggest priority for a single text."""
        if not text or not text.strip():
            return {
                "text": "",
                "suggested_priority": "low",
                "confidence": 1.0,
                "sentiment": "neutral",
                "urgency_detected": False,
                "reasoning": "Empty text defaults to low priority.",
            }

        text_lower = text.lower()

        # Check urgency keywords
        urgency_detected = any(kw in text_lower for kw in URGENCY_KEYWORDS)

        # Check high-priority keywords
        high_detected = any(kw in text_lower for kw in HIGH_PRIORITY_KEYWORDS)

        # Run sentiment analysis
        sentiment_result = self._sentiment.analyze(text)
        sentiment = sentiment_result["sentiment"]
        sentiment_confidence = sentiment_result["confidence"]

        # Decision matrix
        if urgency_detected:
            priority = "urgent"
            confidence = 0.95
            reasoning = "Urgency keywords detected in the request."
        elif sentiment == "negative" and sentiment_confidence >= 0.6:
            priority = "high"
            confidence = round(sentiment_confidence * 0.9, 3)
            reasoning = "Strong negative sentiment detected."
        elif sentiment == "negative" or high_detected:
            priority = "medium"
            confidence = round(max(sentiment_confidence * 0.7, 0.5), 3)
            reasoning = (
                "Negative sentiment or severity keywords detected."
                if sentiment == "negative"
                else "Severity keywords detected in the request."
            )
        else:
            priority = "low"
            confidence = round(max(1.0 - sentiment_confidence * 0.3, 0.5), 3)
            reasoning = "No urgency indicators; neutral or positive sentiment."

        return {
            "text": text[:100],
            "suggested_priority": priority,
            "confidence": confidence,
            "sentiment": sentiment,
            "urgency_detected": urgency_detected,
            "reasoning": reasoning,
        }

    def suggest_batch(self, texts: list[str]) -> list[dict]:
        """Suggest priority for multiple texts."""
        return [self.suggest(t) for t in texts]
