from __future__ import annotations

import logging
import re
from typing import Any

from app.models.nlp.categorizer import RequestCategorizer
from app.models.nlp.priority_suggester import PrioritySuggester

logger = logging.getLogger(__name__)

# Default service catalog per category with typical pricing
SERVICE_CATALOG: dict[str, list[dict[str, Any]]] = {
    "HVAC": [
        {"name": "HVAC Diagnostic Inspection", "type": "service", "unit_price": 95.00, "duration_minutes": 60},
        {"name": "HVAC System Repair", "type": "service", "unit_price": 250.00, "duration_minutes": 120},
        {"name": "Air Filter Replacement", "type": "service", "unit_price": 45.00, "duration_minutes": 30},
        {"name": "Refrigerant Recharge", "type": "service", "unit_price": 180.00, "duration_minutes": 60},
        {"name": "Thermostat Replacement", "type": "service", "unit_price": 120.00, "duration_minutes": 45},
        {"name": "Ductwork Repair", "type": "service", "unit_price": 300.00, "duration_minutes": 180},
    ],
    "Plumbing": [
        {"name": "Plumbing Diagnostic Inspection", "type": "service", "unit_price": 85.00, "duration_minutes": 60},
        {"name": "Leak Repair", "type": "service", "unit_price": 200.00, "duration_minutes": 90},
        {"name": "Drain Cleaning", "type": "service", "unit_price": 150.00, "duration_minutes": 60},
        {"name": "Faucet Replacement", "type": "service", "unit_price": 175.00, "duration_minutes": 60},
        {"name": "Toilet Repair", "type": "service", "unit_price": 130.00, "duration_minutes": 60},
        {"name": "Water Heater Service", "type": "service", "unit_price": 280.00, "duration_minutes": 120},
    ],
    "Electrical": [
        {"name": "Electrical Diagnostic Inspection", "type": "service", "unit_price": 95.00, "duration_minutes": 60},
        {"name": "Circuit Breaker Repair", "type": "service", "unit_price": 220.00, "duration_minutes": 90},
        {"name": "Outlet/Switch Replacement", "type": "service", "unit_price": 110.00, "duration_minutes": 45},
        {"name": "Wiring Repair", "type": "service", "unit_price": 300.00, "duration_minutes": 120},
        {"name": "Panel Upgrade", "type": "service", "unit_price": 450.00, "duration_minutes": 240},
        {"name": "Light Fixture Installation", "type": "service", "unit_price": 130.00, "duration_minutes": 60},
    ],
    "Appliance": [
        {"name": "Appliance Diagnostic Inspection", "type": "service", "unit_price": 85.00, "duration_minutes": 60},
        {"name": "Appliance Repair", "type": "service", "unit_price": 200.00, "duration_minutes": 90},
        {"name": "Appliance Installation", "type": "service", "unit_price": 250.00, "duration_minutes": 120},
        {"name": "Appliance Maintenance", "type": "service", "unit_price": 120.00, "duration_minutes": 60},
    ],
    "General": [
        {"name": "General Inspection", "type": "service", "unit_price": 75.00, "duration_minutes": 60},
        {"name": "General Maintenance", "type": "service", "unit_price": 150.00, "duration_minutes": 90},
        {"name": "General Repair", "type": "service", "unit_price": 200.00, "duration_minutes": 120},
    ],
}

# Parts commonly associated with keywords
PARTS_CATALOG: dict[str, list[dict[str, Any]]] = {
    "thermostat": [{"name": "Digital Thermostat", "type": "part", "unit_price": 65.00}],
    "filter": [{"name": "HVAC Air Filter", "type": "part", "unit_price": 25.00}],
    "refrigerant": [{"name": "R-410A Refrigerant (per lb)", "type": "part", "unit_price": 35.00}],
    "faucet": [{"name": "Standard Faucet Assembly", "type": "part", "unit_price": 85.00}],
    "toilet": [{"name": "Toilet Repair Kit", "type": "part", "unit_price": 30.00}],
    "pipe": [{"name": "PVC Pipe Section", "type": "part", "unit_price": 15.00}],
    "valve": [{"name": "Shut-off Valve", "type": "part", "unit_price": 22.00}],
    "breaker": [{"name": "Circuit Breaker", "type": "part", "unit_price": 40.00}],
    "outlet": [{"name": "Electrical Outlet", "type": "part", "unit_price": 12.00}],
    "switch": [{"name": "Light Switch", "type": "part", "unit_price": 10.00}],
    "light": [{"name": "LED Light Fixture", "type": "part", "unit_price": 55.00}],
    "water heater": [{"name": "Water Heater Element", "type": "part", "unit_price": 45.00}],
    "compressor": [{"name": "AC Compressor Unit", "type": "part", "unit_price": 350.00}],
    "condenser": [{"name": "Condenser Coil", "type": "part", "unit_price": 280.00}],
    "garbage disposal": [{"name": "Garbage Disposal Unit", "type": "part", "unit_price": 120.00}],
}

DEFAULT_TAX_RATE = 8.0
DEFAULT_TRAVEL_CHARGE = {"name": "Travel/Service Call Fee", "type": "travel", "unit_price": 50.00, "quantity": 1}


class EstimateGenerator:
    """Generate estimates from service request descriptions using NLP analysis."""

    def __init__(self) -> None:
        self._categorizer = RequestCategorizer()
        self._priority = PrioritySuggester()

    def generate(self, description: str, include_travel: bool = True) -> dict:
        """Generate an estimate from a service request description."""
        if not description or not description.strip():
            return {
                "description": "",
                "category": "General",
                "priority": "low",
                "line_items": [],
                "subtotal": 0.0,
                "tax": 0.0,
                "total": 0.0,
                "confidence": 0.0,
                "reasoning": "Empty description provided.",
                "estimated_duration_minutes": 0,
            }

        # Categorize the request
        cat_result = self._categorizer.categorize(description)
        category = cat_result["category"]
        cat_confidence = cat_result["confidence"]

        # Suggest priority
        pri_result = self._priority.suggest(description)
        priority = pri_result["suggested_priority"]

        # Select relevant services
        line_items = self._select_services(description, category)

        # Detect and add relevant parts
        parts = self._detect_parts(description)
        line_items.extend(parts)

        # Add travel charge
        if include_travel:
            line_items.append({
                **DEFAULT_TRAVEL_CHARGE,
                "tax_rate": 0.0,
                "total": DEFAULT_TRAVEL_CHARGE["unit_price"],
                "sort_order": len(line_items) + 1,
            })

        # Calculate totals
        subtotal = sum(item["total"] for item in line_items)
        tax = sum(
            item["total"] * item.get("tax_rate", DEFAULT_TAX_RATE) / 100
            for item in line_items
        )
        total = round(subtotal + tax, 2)

        # Estimate total duration
        duration = sum(item.get("duration_minutes", 0) for item in line_items)

        # Build reasoning
        reasoning_parts = [
            f"Category: {category} (confidence: {cat_confidence}).",
            f"Priority: {priority}.",
            f"Suggested {len(line_items)} line items based on description analysis.",
        ]
        if parts:
            reasoning_parts.append(f"Detected {len(parts)} specific part(s) from keywords.")

        return {
            "description": description[:200],
            "category": category,
            "priority": priority,
            "line_items": line_items,
            "subtotal": round(subtotal, 2),
            "tax": round(tax, 2),
            "total": total,
            "confidence": round(cat_confidence * 0.8 + 0.2, 3),
            "reasoning": " ".join(reasoning_parts),
            "estimated_duration_minutes": duration,
        }

    def generate_batch(self, descriptions: list[str], include_travel: bool = True) -> list[dict]:
        """Generate estimates for multiple descriptions."""
        return [self.generate(d, include_travel=include_travel) for d in descriptions]

    def _select_services(self, description: str, category: str) -> list[dict]:
        """Select relevant services based on category and description keywords."""
        available = SERVICE_CATALOG.get(category, SERVICE_CATALOG["General"])
        text_lower = description.lower()
        selected: list[dict] = []

        # Always include the diagnostic/inspection as the first item
        diagnostic = available[0]
        selected.append(self._make_line_item(diagnostic, sort_order=1))

        # Check description for action keywords to select additional services
        action_keywords = {
            "repair": "Repair",
            "fix": "Repair",
            "broken": "Repair",
            "replace": "Replacement",
            "install": "Installation",
            "maintenance": "Maintenance",
            "clean": "Cleaning",
            "service": "Service",
            "upgrade": "Upgrade",
            "not working": "Repair",
            "stopped": "Repair",
            "leaking": "Repair",
            "leak": "Repair",
            "clogged": "Cleaning",
            "clog": "Cleaning",
        }

        matched_service_types: set[str] = set()
        for keyword, service_type in action_keywords.items():
            if keyword in text_lower:
                matched_service_types.add(service_type)

        # Find matching services from catalog
        sort_order = 2
        for svc in available[1:]:
            svc_name_lower = svc["name"].lower()
            for svc_type in matched_service_types:
                if svc_type.lower() in svc_name_lower:
                    selected.append(self._make_line_item(svc, sort_order=sort_order))
                    sort_order += 1
                    break

        # If no action matched, add the primary repair service
        if len(selected) == 1 and len(available) > 1:
            selected.append(self._make_line_item(available[1], sort_order=2))

        return selected

    def _detect_parts(self, description: str) -> list[dict]:
        """Detect parts needed based on description keywords."""
        text_lower = description.lower()
        detected: list[dict] = []
        seen_names: set[str] = set()

        for keyword, parts_list in PARTS_CATALOG.items():
            if keyword in text_lower:
                for part in parts_list:
                    if part["name"] not in seen_names:
                        seen_names.add(part["name"])
                        detected.append(self._make_line_item(part, sort_order=100 + len(detected)))

        return detected

    @staticmethod
    def _make_line_item(item: dict[str, Any], sort_order: int = 1) -> dict[str, Any]:
        """Create a standardised line item dict."""
        quantity = item.get("quantity", 1)
        unit_price = item["unit_price"]
        tax_rate = item.get("tax_rate", DEFAULT_TAX_RATE)
        total = round(quantity * unit_price, 2)

        return {
            "type": item["type"],
            "name": item["name"],
            "description": item.get("description", ""),
            "quantity": quantity,
            "unit_price": unit_price,
            "tax_rate": tax_rate,
            "discount": 0.0,
            "total": total,
            "sort_order": sort_order,
            "duration_minutes": item.get("duration_minutes", 0),
        }
