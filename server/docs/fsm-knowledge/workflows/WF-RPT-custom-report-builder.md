# WF-RPT-custom-report-builder — Custom Report Builder

## Module
Reports — `CustomReportBuilderPage` (`/reports/builder`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).

---

## Steps — Open the Custom Report Builder

1. Navigate to `/reports/builder`. The page renders inside the standard app layout.
2. A `PageHeader` is displayed with:
   - Title: **"Custom Report Builder"**
   - Subtitle: **"Build custom reports with your own fields and filters"**
   - A back control (the header's `onBack`) that returns to `/reports`.

---

## Steps — Read the Coming Soon notice

1. Below the header, a single **Card** contains a `Result` component.
2. The result shows a purple tool icon (`ToolOutlined`) and the title **"Coming Soon"**.
3. The sub-title reads: **"The custom report builder is currently under development. Use the pre-built reports for now."**
4. This page has no report-building controls — there are no field pickers, filters, data-source selectors, or save/export actions in the code. It is a placeholder pending development.

---

## Steps — Return to pre-built reports

1. In the `Result` notice, click the primary button **"View Reports"**.
2. The app navigates to `/reports`, the pre-built reports dashboard.
3. Alternatively, click the back control in the `PageHeader`, which also navigates to `/reports`.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Open custom report builder | Navigate to `/reports/builder` | Authenticated | None |
| Return to reports dashboard | **View Reports** button | Authenticated | Client-side `navigate('/reports')` |
| Go back | `PageHeader` back control | Authenticated | Client-side `navigate('/reports')` |
