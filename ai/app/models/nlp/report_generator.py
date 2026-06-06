from __future__ import annotations

import logging
from datetime import datetime

from app.services.llm_client import LLMClient

logger = logging.getLogger(__name__)


REPORT_TEMPLATES = {
    "work_order_summary": {
        "title": "Work Order Summary Report",
        "sections": ["overview", "status_distribution", "completion_rates", "technician_performance"],
    },
    "revenue": {
        "title": "Revenue Report",
        "sections": ["total_revenue", "revenue_by_service", "payment_status", "trends"],
    },
    "technician_performance": {
        "title": "Technician Performance Report",
        "sections": ["completion_rates", "response_times", "customer_satisfaction", "utilization"],
    },
    "equipment_health": {
        "title": "Equipment Health Report",
        "sections": ["health_overview", "risk_distribution", "maintenance_history", "predictions"],
    },
    "custom": {
        "title": "Custom Report",
        "sections": ["summary"],
    },
}


class ReportGenerator:
    """LLM-powered report generation engine."""

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm = llm_client

    async def generate(
        self,
        report_type: str,
        parameters: dict | None = None,
        data: dict | None = None,
    ) -> dict:
        template = REPORT_TEMPLATES.get(report_type, REPORT_TEMPLATES["custom"])
        params = parameters or {}
        report_data = data or {}

        if self.llm is None:
            return self._generate_placeholder_report(template, report_type, params, report_data)

        try:
            prompt = self._build_report_prompt(template, report_type, params, report_data)
            content = await self.llm.complete(
                prompt=prompt,
                system="You are a professional report generator for a field service management platform. Generate clear, well-structured reports with insights and recommendations.",
                max_tokens=2048,
                temperature=0.3,
            )

            return {
                "report_type": report_type,
                "title": template["title"],
                "content": content,
                "generated_at": datetime.utcnow().isoformat(),
                "parameters": params,
                "format": params.get("format", "text"),
            }
        except Exception as e:
            logger.error("Report generation error: %s", e)
            return self._generate_placeholder_report(template, report_type, params, report_data)

    def _build_report_prompt(self, template: dict, report_type: str, params: dict, data: dict) -> str:
        parts = [
            f"Generate a {template['title']} with the following sections: {', '.join(template['sections'])}.",
            "",
        ]

        if params.get("date_range"):
            parts.append(f"Date range: {params['date_range']}")

        if data:
            parts.append(f"Data to analyze: {data}")

        parts.append("")
        parts.append("Format the report with clear headings, bullet points, and key metrics.")
        parts.append("Include actionable insights and recommendations at the end.")

        return "\n".join(parts)

    def _generate_placeholder_report(self, template: dict, report_type: str, params: dict, data: dict) -> dict:
        sections = {}
        for section in template["sections"]:
            sections[section] = f"[Placeholder: {section.replace('_', ' ').title()} data would appear here]"

        content_parts = [f"# {template['title']}", f"Generated: {datetime.utcnow().isoformat()}", ""]
        for section_name, section_content in sections.items():
            content_parts.append(f"## {section_name.replace('_', ' ').title()}")
            content_parts.append(section_content)
            content_parts.append("")

        content_parts.append("*Note: LLM not configured — placeholder report generated.*")

        return {
            "report_type": report_type,
            "title": template["title"],
            "content": "\n".join(content_parts),
            "generated_at": datetime.utcnow().isoformat(),
            "parameters": params,
            "format": params.get("format", "text"),
        }
