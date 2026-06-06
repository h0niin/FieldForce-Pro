from __future__ import annotations

import logging
import re
from collections import defaultdict

logger = logging.getLogger(__name__)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed — using rule-based categorization")

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "HVAC": [
        "air conditioning", "heating", "furnace", "thermostat", "duct",
        "hvac", "ventilation", "coolant", "compressor", "refrigerant",
        "air handler", "heat pump", "condenser", "evaporator", "blower",
        "ac unit", "central air", "mini split", "boiler", "radiator",
    ],
    "Plumbing": [
        "plumbing", "pipe", "drain", "faucet", "toilet", "leak",
        "water heater", "sewer", "clog", "valve", "sink", "shower",
        "bathtub", "garbage disposal", "water pressure", "septic",
        "sprinkler", "backflow", "sump pump", "water line",
    ],
    "Electrical": [
        "electrical", "wiring", "outlet", "circuit", "breaker", "switch",
        "panel", "voltage", "power", "light", "generator", "transformer",
        "fuse", "electrician", "short circuit", "grounding", "surge",
        "socket", "dimmer", "conduit",
    ],
    "Appliance": [
        "appliance", "washer", "dryer", "dishwasher", "refrigerator",
        "oven", "stove", "microwave", "freezer", "ice maker",
        "range", "cooktop", "hood", "disposal", "washing machine",
        "clothes dryer", "water softener", "water filter",
    ],
    "General": [
        "maintenance", "repair", "service", "inspection", "install",
        "replace", "fix", "check", "routine", "scheduled",
        "preventive", "annual", "quarterly", "tune up",
    ],
}


class RequestCategorizer:
    """Categorize service request descriptions into predefined categories."""

    def __init__(self) -> None:
        self._tfidf: object | None = None
        if SKLEARN_AVAILABLE:
            try:
                self._build_tfidf()
                logger.info("TF-IDF categorizer initialised")
            except Exception as e:
                logger.warning("Failed to build TF-IDF model: %s", e)
                self._tfidf = None

    def _build_tfidf(self) -> None:
        """Build TF-IDF vectors for each category from keywords."""
        self._category_names: list[str] = list(CATEGORY_KEYWORDS.keys())
        corpus = [" ".join(keywords) for keywords in CATEGORY_KEYWORDS.values()]
        self._vectorizer = TfidfVectorizer()
        self._category_vectors = self._vectorizer.fit_transform(corpus)
        self._tfidf = self._vectorizer

    def categorize(self, text: str) -> dict:
        """Categorize a single text."""
        if not text or not text.strip():
            return {
                "text": "",
                "category": "General",
                "confidence": 1.0,
                "all_scores": {},
                "method": "empty_text",
            }

        if self._tfidf is not None:
            return self._tfidf_categorize(text)

        return self._rule_based_categorize(text)

    def categorize_batch(self, texts: list[str]) -> list[dict]:
        """Categorize multiple texts."""
        return [self.categorize(t) for t in texts]

    def _tfidf_categorize(self, text: str) -> dict:
        try:
            text_vector = self._vectorizer.transform([text.lower()])
            similarities = cosine_similarity(text_vector, self._category_vectors)[0]

            scores: dict[str, float] = {}
            for i, name in enumerate(self._category_names):
                scores[name] = round(float(similarities[i]), 3)

            best_idx = int(similarities.argmax())
            best_score = float(similarities[best_idx])
            best_category = self._category_names[best_idx]

            # Fall back to General if confidence is very low
            if best_score < 0.05:
                best_category = "General"
                best_score = max(scores.get("General", 0.0), 0.1)

            return {
                "text": text[:100],
                "category": best_category,
                "confidence": round(best_score, 3),
                "all_scores": scores,
                "method": "tfidf",
            }
        except Exception as e:
            logger.error("TF-IDF categorization error: %s", e)
            return self._rule_based_categorize(text)

    def _rule_based_categorize(self, text: str) -> dict:
        text_lower = text.lower()
        scores: dict[str, int] = defaultdict(int)

        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    scores[category] += 1

        if not scores:
            return {
                "text": text[:100],
                "category": "General",
                "confidence": 0.3,
                "all_scores": {cat: 0.0 for cat in CATEGORY_KEYWORDS},
                "method": "rule_based",
            }

        total = sum(scores.values())
        normalised: dict[str, float] = {
            cat: round(scores.get(cat, 0) / total, 3) for cat in CATEGORY_KEYWORDS
        }

        best_category = max(scores, key=scores.get)  # type: ignore[arg-type]
        best_confidence = normalised[best_category]

        return {
            "text": text[:100],
            "category": best_category,
            "confidence": round(best_confidence, 3),
            "all_scores": normalised,
            "method": "rule_based",
        }
