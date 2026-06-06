from __future__ import annotations

import logging
import re
from typing import Any

from app.services.llm_client import LLMClient

logger = logging.getLogger(__name__)

# Database schema context for NL-to-SQL
DB_SCHEMA_CONTEXT = """
Available tables and their key columns:
- work_orders: id, tenant_id, title, description, status (New/Estimated/Approved/Scheduled/In Progress/On Hold/Completed/Closed/Cancelled), priority, assigned_to, created_at, completed_at
- service_appointments: id, tenant_id, work_order_id, technician_id, scheduled_start, scheduled_end, status, created_at
- assets: id, tenant_id, name, asset_type, status, health_score, location_id, created_at
- invoices: id, tenant_id, work_order_id, total_amount, status (Draft/Sent/Viewed/Partially Paid/Paid/Overdue/Void), due_date, created_at
- contacts: id, tenant_id, first_name, last_name, email, phone, company_id, created_at
- service_requests: id, tenant_id, title, status, priority, created_at
- users: id, tenant_id, first_name, last_name, email, role, created_at

Important rules:
- Always filter by tenant_id
- Use is_deleted = false in WHERE clause
- Use proper date functions for date-related queries
- Limit results to 100 rows maximum
- Never use DELETE, UPDATE, INSERT, DROP, ALTER, or TRUNCATE
"""

SAFE_SQL_PATTERN = re.compile(
    r"\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXEC)\b",
    re.IGNORECASE,
)

VISUALIZATION_KEYWORDS = {
    "chart": "bar_chart",
    "graph": "line_chart",
    "trend": "line_chart",
    "over time": "line_chart",
    "distribution": "pie_chart",
    "breakdown": "pie_chart",
    "compare": "bar_chart",
    "top": "bar_chart",
    "count": "bar_chart",
    "total": "metric",
    "average": "metric",
    "sum": "metric",
}


class NLQueryEngine:
    """Natural language to SQL query engine using LLM."""

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm = llm_client

    async def query(self, natural_language: str, context: dict | None = None) -> dict:
        if self.llm is None:
            return self._rule_based_query(natural_language, context)

        try:
            tenant_id = (context or {}).get("tenant_id", "")
            prompt = self._build_prompt(natural_language, tenant_id)

            response = await self.llm.complete(
                prompt=prompt,
                system="You are a SQL expert. Convert natural language questions about field service management data into safe, read-only PostgreSQL queries. Return ONLY the SQL query, nothing else.",
                max_tokens=512,
                temperature=0.1,
            )

            sql = self._extract_sql(response)

            if not self._validate_sql(sql):
                return {
                    "sql_query": "",
                    "results": [],
                    "explanation": "Generated query was rejected for safety reasons",
                    "visualization_hint": None,
                }

            viz = self._suggest_visualization(natural_language)

            return {
                "sql_query": sql,
                "results": [],  # Results would be populated by the server after executing
                "explanation": f"SQL generated from: '{natural_language}'",
                "visualization_hint": viz,
            }
        except Exception as e:
            logger.error("NL query error: %s", e)
            return self._rule_based_query(natural_language, context)

    def _build_prompt(self, question: str, tenant_id: str) -> str:
        return f"""{DB_SCHEMA_CONTEXT}

Tenant ID to filter by: '{tenant_id}'

User question: {question}

Generate a safe, read-only PostgreSQL SELECT query to answer this question.
Always include WHERE tenant_id = '{tenant_id}' AND is_deleted = false.
LIMIT results to 100 rows.
Return ONLY the SQL query."""

    def _extract_sql(self, response: str) -> str:
        """Extract SQL from LLM response."""
        response = response.strip()
        # Remove markdown code blocks
        if "```sql" in response:
            response = response.split("```sql")[1].split("```")[0].strip()
        elif "```" in response:
            response = response.split("```")[1].split("```")[0].strip()
        return response.strip().rstrip(";") + ";"

    def _validate_sql(self, sql: str) -> bool:
        """Validate SQL is read-only."""
        if not sql or sql == ";":
            return False
        if SAFE_SQL_PATTERN.search(sql):
            logger.warning("Unsafe SQL detected: %s", sql[:100])
            return False
        if not sql.strip().upper().startswith("SELECT"):
            return False
        return True

    def _suggest_visualization(self, question: str) -> str | None:
        q = question.lower()
        for keyword, viz_type in VISUALIZATION_KEYWORDS.items():
            if keyword in q:
                return viz_type
        return None

    def _rule_based_query(self, question: str, context: dict | None = None) -> dict:
        """Generate basic SQL when LLM is unavailable."""
        tenant_id = (context or {}).get("tenant_id", "")
        q = question.lower()
        tenant_filter = f"tenant_id = '{tenant_id}' AND " if tenant_id else ""

        if "work order" in q and ("count" in q or "how many" in q):
            sql = f"SELECT status, COUNT(*) as count FROM work_orders WHERE {tenant_filter}is_deleted = false GROUP BY status ORDER BY count DESC LIMIT 100;"
            return {
                "sql_query": sql,
                "results": [],
                "explanation": "Work order count by status (rule-based)",
                "visualization_hint": "bar_chart",
            }

        if "overdue" in q and "invoice" in q:
            sql = f"SELECT id, total_amount, due_date FROM invoices WHERE {tenant_filter}is_deleted = false AND status = 'Overdue' ORDER BY due_date ASC LIMIT 100;"
            return {
                "sql_query": sql,
                "results": [],
                "explanation": "Overdue invoices (rule-based)",
                "visualization_hint": "bar_chart",
            }

        if "asset" in q and ("health" in q or "score" in q):
            sql = f"SELECT name, health_score, asset_type FROM assets WHERE {tenant_filter}is_deleted = false ORDER BY health_score ASC LIMIT 100;"
            return {
                "sql_query": sql,
                "results": [],
                "explanation": "Asset health scores (rule-based)",
                "visualization_hint": "bar_chart",
            }

        return {
            "sql_query": "",
            "results": [],
            "explanation": "LLM not configured — unable to generate SQL for this query",
            "visualization_hint": None,
        }
