"""Tests for NL-to-SQL query engine."""

import pytest
from app.models.nlp.nl_query import NLQueryEngine


@pytest.mark.asyncio
async def test_nl_query_no_llm():
    """NL query engine without LLM returns rule-based result."""
    engine = NLQueryEngine()
    result = await engine.query("How many work orders are there?", context={"tenant_id": "t1"})
    assert "sql_query" in result
    assert "explanation" in result


@pytest.mark.asyncio
async def test_nl_query_work_order_count():
    """Test rule-based work order count query."""
    engine = NLQueryEngine()
    result = await engine.query("count work orders by status", context={"tenant_id": "t1"})
    assert "work_orders" in result["sql_query"].lower()
    assert result["visualization_hint"] == "bar_chart"


@pytest.mark.asyncio
async def test_nl_query_overdue_invoices():
    """Test rule-based overdue invoice query."""
    engine = NLQueryEngine()
    result = await engine.query("show me overdue invoices", context={"tenant_id": "t1"})
    assert "invoices" in result["sql_query"].lower()
    assert "Overdue" in result["sql_query"]


@pytest.mark.asyncio
async def test_nl_query_asset_health():
    """Test rule-based asset health query."""
    engine = NLQueryEngine()
    result = await engine.query("what is the health score of assets?", context={"tenant_id": "t1"})
    assert "assets" in result["sql_query"].lower()
    assert "health_score" in result["sql_query"].lower()


@pytest.mark.asyncio
async def test_nl_query_unknown():
    """Test unknown query returns empty."""
    engine = NLQueryEngine()
    result = await engine.query("something completely unrelated xyz", context={"tenant_id": "t1"})
    assert result["sql_query"] == ""
    assert "LLM not configured" in result["explanation"]


def test_sql_validation():
    """Test SQL validation rejects unsafe queries."""
    engine = NLQueryEngine()
    assert engine._validate_sql("SELECT * FROM work_orders;") is True
    assert engine._validate_sql("DELETE FROM work_orders;") is False
    assert engine._validate_sql("DROP TABLE users;") is False
    assert engine._validate_sql("UPDATE work_orders SET status = 'x';") is False
    assert engine._validate_sql("") is False
