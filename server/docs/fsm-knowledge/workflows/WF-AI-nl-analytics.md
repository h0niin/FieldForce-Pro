# WF-AI-nl-analytics — Ask Natural-Language Analytics Questions

## Module
Natural Language Analytics — `NLAnalyticsPage` (`/analytics/ai`), which renders the `NLQueryBar` component (`web/src/components/analytics/NLQueryBar.tsx`).

## Prerequisites
- User must be authenticated (route is nested under the `PrivateRoute` guard with `AppLayout`).

---

## Steps — Run a Natural-Language Query

1. Navigate to `/analytics/ai`. The page title reads **"AI-Powered Analytics"** (`nlAnalytics.aiPoweredAnalytics`).
2. A card titled **"AI Analytics Query"** (`nlQueryBar.aiAnalyticsQuery`, with a ThunderboltOutlined icon) is displayed.
3. Type a question into the large search **Input** (it has a SearchOutlined prefix and shows the placeholder from `nlQueryBar.placeholder`).
4. Submit the query either by pressing **Enter** in the input or clicking the **Query** button (`nlQueryBar.query`, primary button).
5. While the request is in flight, the **Query** button shows a loading state (`nlQuery.isPending`). The query is sent via the `useNLQuery` hook, which calls `analyticsApi.nlQuery` → `POST /analytics/nl-query` with `{ query }`.
6. If the request fails, an Ant Design error message is shown using the server's error message, or "Query failed" as a fallback.

---

## Steps — Use a Suggested Query

1. Below the input, a row labeled **"Try:"** (`nlQueryBar.try`) shows clickable blue **Tag** suggestions:
   - **How many work orders by status?**
   - **Show me overdue invoices**
   - **What is the health score of assets?**
2. Click any suggestion tag to populate the input field with that text.
3. Press **Enter** or click **Query** to run it (clicking the tag only fills the input; it does not auto-submit).

---

## Steps — Read the Query Result

1. After a successful response (`nlQuery.data.data`), a result **Card** appears titled **"Result"** (`nlQueryBar.result`).
2. An **explanation** paragraph is shown (`result.explanation`).
3. If the response includes `result.sql_query`, the generated SQL is displayed inside an info **Alert** as preformatted code.
4. If the response includes `result.visualization_hint`, a purple **Tag** (BarChartOutlined icon) labeled **"Suggested:"** (`nlQueryBar.suggested`) shows the suggested visualization type (e.g., bar_chart, line_chart, pie_chart, metric).
5. If `result.results` contains rows, the data renders in a **Table** whose columns are auto-generated from the keys of the first result row.
6. If there are no rows but a `sql_query` was returned, the text **"query generated successfully"** (`nlQueryBar.queryGeneratedSuccess`) is shown instead.

---

## Steps — Empty State

1. Before any query is run (and when not loading), an **Empty** placeholder is displayed with the description from `nlQueryBar.emptyDescription`.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Open NL analytics page | Navigate to `/analytics/ai` | Authenticated (PrivateRoute) | — |
| Submit query | **Query** button or **Enter** in input | Authenticated | `useNLQuery` → `POST /analytics/nl-query` |
| Fill input from suggestion | Click a blue suggestion **Tag** | Authenticated | Client-side only (sets input value) |
| View generated SQL | Auto-rendered info **Alert** | Authenticated | From `result.sql_query` |
| View suggested visualization | Auto-rendered purple **Tag** | Authenticated | From `result.visualization_hint` |
| View result rows | Auto-rendered **Table** | Authenticated | From `result.results` |
