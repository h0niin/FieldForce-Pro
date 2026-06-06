from __future__ import annotations

import logging
import re

logger = logging.getLogger(__name__)

try:
    from transformers import pipeline as hf_pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("transformers not installed — using rule-based sentiment analysis")

# Rule-based sentiment word lists
POSITIVE_WORDS = {
    "great", "excellent", "good", "wonderful", "amazing", "happy", "satisfied",
    "thank", "thanks", "appreciate", "love", "best", "perfect", "awesome",
    "helpful", "professional", "quick", "fast", "efficient", "resolved",
    "fixed", "working", "pleased", "recommend", "outstanding", "fantastic",
}

NEGATIVE_WORDS = {
    "bad", "terrible", "awful", "horrible", "poor", "worst", "hate",
    "angry", "frustrated", "disappointed", "unacceptable", "broken",
    "slow", "late", "rude", "unprofessional", "wrong", "failed",
    "issue", "problem", "complaint", "never", "waste", "useless",
    "incompetent", "ridiculous", "overcharged", "damaged",
}

NEGATION_WORDS = {"not", "no", "never", "neither", "nor", "isn't", "aren't", "don't", "doesn't", "wasn't", "weren't", "won't", "can't", "couldn't", "shouldn't"}


class SentimentAnalyzer:
    """Text sentiment analysis with ML fallback to rule-based."""

    def __init__(self) -> None:
        self.ml_pipeline: object | None = None
        if TRANSFORMERS_AVAILABLE:
            try:
                self.ml_pipeline = hf_pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                )
                logger.info("Sentiment ML pipeline loaded")
            except Exception as e:
                logger.warning("Failed to load sentiment model: %s", e)

    def analyze(self, text: str) -> dict:
        """Analyze sentiment of text."""
        if not text or not text.strip():
            return {
                "text": "",
                "sentiment": "neutral",
                "confidence": 1.0,
                "scores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
                "method": "empty_text",
            }

        if self.ml_pipeline is not None:
            return self._ml_analyze(text)

        return self._rule_based_analyze(text)

    def analyze_batch(self, texts: list[str]) -> list[dict]:
        """Analyze sentiment for multiple texts."""
        return [self.analyze(t) for t in texts]

    def _ml_analyze(self, text: str) -> dict:
        try:
            result = self.ml_pipeline(text[:512])[0]
            label = result["label"].lower()
            score = result["score"]

            if label == "positive":
                scores = {"positive": score, "neutral": 0.0, "negative": 1 - score}
            else:
                scores = {"positive": 1 - score, "neutral": 0.0, "negative": score}
                label = "negative"

            return {
                "text": text[:100],
                "sentiment": label,
                "confidence": round(score, 3),
                "scores": {k: round(v, 3) for k, v in scores.items()},
                "method": "ml",
            }
        except Exception as e:
            logger.error("ML sentiment error: %s", e)
            return self._rule_based_analyze(text)

    def _rule_based_analyze(self, text: str) -> dict:
        words = set(re.findall(r'\b\w+\b', text.lower()))
        word_list = re.findall(r'\b\w+\b', text.lower())

        pos_count = 0
        neg_count = 0

        for i, word in enumerate(word_list):
            is_negated = any(neg in word_list[max(0, i-2):i] for neg in NEGATION_WORDS) if i > 0 else False

            if word in POSITIVE_WORDS:
                if is_negated:
                    neg_count += 1
                else:
                    pos_count += 1
            elif word in NEGATIVE_WORDS:
                if is_negated:
                    pos_count += 1
                else:
                    neg_count += 1

        total = pos_count + neg_count
        if total == 0:
            return {
                "text": text[:100],
                "sentiment": "neutral",
                "confidence": 0.5,
                "scores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
                "method": "rule_based",
            }

        pos_score = pos_count / total
        neg_score = neg_count / total
        confidence = max(pos_score, neg_score)

        if pos_score > neg_score:
            sentiment = "positive"
        elif neg_score > pos_score:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        return {
            "text": text[:100],
            "sentiment": sentiment,
            "confidence": round(confidence, 3),
            "scores": {"positive": round(pos_score, 3), "neutral": 0.0, "negative": round(neg_score, 3)},
            "method": "rule_based",
        }
