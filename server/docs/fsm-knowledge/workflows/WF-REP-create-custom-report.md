# WF-REP-create-custom-report — Create a Custom Report

## Prerequisites
- User must have the `reports:create` permission (Admin or Manager).

## Steps

1. Click **Reports** in the left sidebar.
2. Click **Custom Reports** tab (or look for a **Custom Reports** section).
3. Click **+ New Report**.
4. Enter a **Report Name** (e.g., "Monthly Revenue by Technician").
5. Select the **Module** to report on (Work Orders, Invoices, Contacts, Timesheets, Assets, etc.).
6. Select the **Columns** to include by clicking the checkbox next to each field you want shown.
7. Add **Filters**:
   - Click **+ Add Filter**
   - Select a field (e.g., "Status")
   - Select the operator (e.g., "equals", "is not", "greater than")
   - Enter or select the value (e.g., "Completed")
   - Repeat for additional filters
8. Configure **Grouping** (optional):
   - Select a field to group results by (e.g., Group by "Assigned Technician" or "Month")
9. Set **Sort Order** — choose which column to sort by and ascending or descending direction.
10. Click **Preview** to see a sample of the results with your configuration.
11. Adjust filters or columns as needed.
12. Click **Save Report**. The report appears in your Reports list.
13. To run it, click the report name and then **Run Report**.
14. To export, use the **Export** button (PDF, CSV, or Excel).

## Result
A reusable custom report is created and saved. It can be run at any time with the same configuration.
