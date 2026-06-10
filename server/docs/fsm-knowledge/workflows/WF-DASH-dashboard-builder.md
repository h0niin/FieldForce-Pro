# WF-DASH-dashboard-builder — Build a Custom Dashboard with Widgets

## Module
Dashboard — `DashboardBuilderPage` (`/dashboard/builder`)

## Prerequisites
- User must be authenticated (the page renders inside the authenticated app layout).
- Dashboards built here are session-only; widgets are held in component state. Saving shows a success message only (no backend persistence is wired up in the component).

---

## Steps — Open the Dashboard Builder

1. Navigate to `/dashboard/builder`. The page header reads **"Dashboard Builder"** with a subtitle.
2. The header (top-right) shows these controls in a button group:
   - A toggle button that switches between **Preview Mode** (EyeOutlined icon) and **Edit Mode** (EditOutlined icon).
   - **Save Dashboard** (primary button, SaveOutlined icon).
   - **Add Widget** (primary button, PlusOutlined icon) — shown only when not in preview mode.
3. When the canvas has no widgets and you are in edit mode, an **instructions card** (blue) is displayed with a bulleted list of tips.
4. The dashboard canvas below is a `Card`. When empty it shows an **Empty** state with an **Add Your First Widget** button.

---

## Steps — Add a Widget

1. Click **Add Widget** (or **Add Your First Widget** on the empty canvas). A right-side **Drawer** titled "Widget Library" opens (width 400px).
2. The drawer lists the available widget types as clickable cards. Each card shows an icon, the widget name, a description, and a blue **Tag** indicating its default size. The 12 widget types are:

   | Type | Name | Description | Default Size |
   |---|---|---|---|
   | `kpi` | KPI Metric | Single key performance indicator | small |
   | `progress` | Progress Bar | Progress indicator with percentage | small |
   | `line-chart` | Line Chart | Trend visualization | medium |
   | `bar-chart` | Bar Chart | Comparison visualization | medium |
   | `pie-chart` | Pie Chart | Distribution visualization | small |
   | `doughnut-chart` | Doughnut Chart | Distribution with center space | small |
   | `table` | Data Table | Tabular data display | full |
   | `list` | List | Item list display | medium |
   | `activity-feed` | Activity Feed | Recent activities timeline | medium |
   | `status-overview` | Status Overview | Status breakdown with progress | medium |
   | `metric-cards` | Metric Cards | Multiple KPIs in compact format | medium |
   | `alerts` | Alerts | Important notifications and alerts | medium |

3. Click a widget card. The widget is appended to the canvas with its default size and mock placeholder data, the drawer closes, and a success message ("widget added") appears.

---

## Steps — Configure a Widget

1. In edit mode, hover/locate a widget on the canvas. Three icon buttons appear at its top-right corner:
   - **Drag to reorder** (DragOutlined, grab cursor).
   - **Configure** (SettingOutlined).
   - **Delete** (DeleteOutlined, danger/red).
2. Click the **Configure** (gear) button. A modal titled "Widget Configuration" opens, pre-filled with the widget's current values.
3. The form has two required fields:
   - **Title** — a text input (validated as required).
   - **Size** — a select with options **small**, **medium**, **large**, **full**.
4. Click the modal's **Save** (OK) button. The widget's title and size update on the canvas, the modal closes, and a success message ("widget configured") appears. The grid column width per size is: small = 6, medium = 12, large = 18, full = 24 (out of 24).

---

## Steps — Arrange Widgets (Drag to Reorder)

1. Ensure you are in edit mode (not preview). Each widget column is draggable (move cursor).
2. Press and drag a widget over another widget's position. As you drag over a target index, the widgets reorder live and the dragged item shows reduced opacity.
3. Release to drop the widget into its new position.

---

## Steps — Delete a Widget

1. In edit mode, click the **Delete** (trash) button on the widget's top-right corner.
2. A confirmation modal appears (danger OK type).
3. Confirm to remove the widget. A success message ("widget deleted") appears and the widget is removed from the canvas.

---

## Steps — Preview and Save the Dashboard

1. Click the **Preview Mode** button (EyeOutlined) in the header to hide all editing controls (per-widget icon buttons, Add Widget button) and render the dashboard as it would appear to a viewer. Widgets are no longer draggable in preview.
2. Click the same button again (now **Edit Mode**, EditOutlined) to return to editing.
3. Click **Save Dashboard** (SaveOutlined). A success message ("dashboard saved") appears. (Note: in the current component this only shows a message; there is no backend save call.)

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Open builder | Navigate to `/dashboard/builder` | Authenticated | none |
| Add widget | **Add Widget** / **Add Your First Widget** → widget card in drawer | Authenticated | `addWidget()` (client state, mock data) |
| Configure widget | Per-widget **Configure** (gear) button → **Save** in modal | Authenticated | `configureWidget()` / `saveWidgetConfig()` (client state) |
| Reorder widgets | Drag widget column (DragOutlined handle) | Authenticated | `handleDragStart` / `handleDragOver` / `handleDragEnd` (client state) |
| Delete widget | Per-widget **Delete** (trash) button → confirm modal | Authenticated | `deleteWidget()` (client state) |
| Toggle preview | **Preview Mode** / **Edit Mode** header button | Authenticated | `setPreviewMode()` (client state) |
| Save dashboard | **Save Dashboard** header button | Authenticated | `saveDashboard()` (message only; no backend call) |
