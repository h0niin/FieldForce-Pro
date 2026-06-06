# Dashboard Widgets Library

## Overview

The Dashboard Widgets Library provides a comprehensive set of reusable widgets for building custom dashboards with drag-and-drop functionality.

## Installation

### Required Dependencies

Install Chart.js and react-chartjs-2 for chart widgets:

```bash
npm install chart.js react-chartjs-2
```

or with yarn:

```bash
yarn add chart.js react-chartjs-2
```

## Widget Types

### 1. **KPI Widget**
Display single key performance indicators with trend arrows.

**Features:**
- Value with prefix/suffix
- Trend indicator (up/down)
- Color customization

### 2. **Progress Widget**
Show progress towards a goal with percentage bar.

**Features:**
- Current/total values
- Percentage calculation
- Status indicator (active/success/exception)

### 3. **Line Chart Widget**
Trend visualization over time.

**Features:**
- Time-series data
- Smooth curves
- Responsive design

### 4. **Bar Chart Widget**
Compare values across categories.

**Features:**
- Vertical bars
- Color customization
- Multiple datasets support

### 5. **Pie Chart Widget**
Show distribution of values.

**Features:**
- Percentage visualization
- Legend display
- Color palette

### 6. **Doughnut Chart Widget**
Distribution with center space.

**Features:**
- Similar to pie chart
- Center area for additional info
- Legend positioning

### 7. **Table Widget**
Display data in tabular format.

**Features:**
- Sortable columns
- Pagination
- Responsive scrolling

### 8. **List Widget**
Show items in list format with icons.

**Features:**
- Avatar/icon support
- Badge indicators
- Description text

### 9. **Activity Feed Widget**
Timeline of recent activities.

**Features:**
- Chronological display
- Type-based icons
- Tag labels

### 10. **Status Overview Widget**
Breakdown with progress bars.

**Features:**
- Multiple status categories
- Progress visualization
- Count display

### 11. **Metric Cards Widget**
Multiple KPIs in compact format.

**Features:**
- Icon + value + label
- Trend indicators
- Color coding

### 12. **Alerts Widget**
Important notifications and warnings.

**Features:**
- Severity levels (critical/warning/info)
- Color-coded backgrounds
- Icon indicators

## Usage

### Basic Usage

```typescript
import { KPIWidget } from '@/components/dashboard/WidgetLibrary';

<KPIWidget
  title="Total Revenue"
  value={84320}
  prefix="$"
  trend={{ direction: 'up', value: 12.5 }}
  color="#52c41a"
/>
```

### Dashboard Builder

Access the Dashboard Builder at `/dashboard/builder` to:
1. Add widgets from the library
2. Drag to reorder widgets
3. Configure widget settings
4. Preview the dashboard
5. Save the layout

### Widget Configuration

Each widget can be configured with:
- **Title**: Custom widget title
- **Size**: small (1/4), medium (1/2), large (3/4), full (100%)
- **Data**: Widget-specific data

### Widget Sizes

- **Small**: 6 columns (1/4 width) - Perfect for KPIs
- **Medium**: 12 columns (1/2 width) - Charts, lists
- **Large**: 18 columns (3/4 width) - Tables
- **Full**: 24 columns (100% width) - Wide tables, detailed views

## Mock Data

The library includes mock data generators for all widget types. In production, replace with real API calls:

```typescript
const generateMockData = (type: string): any => {
  // Replace with actual API calls
  const response = await fetch(`/api/widgets/${type}/data`);
  return response.json();
}
```

## Drag and Drop

Widgets support HTML5 native drag-and-drop:
- No external dependencies required
- Click and hold to drag
- Drop to reorder
- Visual feedback during drag

## Customization

### Custom Widget Types

Add new widget types to `widgetTypes` array:

```typescript
{
  type: 'my-widget',
  name: 'My Widget',
  icon: <MyIcon />,
  description: 'Custom widget description',
  component: MyWidgetComponent,
  defaultSize: 'medium',
}
```

### Custom Colors

Chart colors can be customized in each widget's data:

```typescript
const chartData = {
  datasets: [{
    backgroundColor: '#custom-color',
    borderColor: '#custom-color',
  }]
}
```

## Performance

- Widgets use React.memo for optimization
- Chart.js is tree-shakeable
- Lazy loading supported
- Responsive breakpoints

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design

## Examples

### Sales Dashboard

```typescript
const salesWidgets = [
  { type: 'kpi', title: 'Total Revenue', size: 'small' },
  { type: 'line-chart', title: 'Revenue Trend', size: 'medium' },
  { type: 'pie-chart', title: 'Sales by Category', size: 'small' },
];
```

### Operations Dashboard

```typescript
const opsWidgets = [
  { type: 'metric-cards', title: 'Key Metrics', size: 'full' },
  { type: 'bar-chart', title: 'Work Orders', size: 'medium' },
  { type: 'status-overview', title: 'Status', size: 'medium' },
  { type: 'activity-feed', title: 'Recent Activity', size: 'medium' },
];
```

## API Integration

Connect widgets to real data:

```typescript
const { data } = useQuery(['widget-data', widgetId], () =>
  fetch(`/api/widgets/${widgetId}/data`).then(res => res.json())
);

<KPIWidget {...data} />
```

## Troubleshooting

### Charts not rendering

Ensure Chart.js is installed:
```bash
npm list chart.js react-chartjs-2
```

### Drag not working

Check that `draggable={true}` is set and preview mode is off.

### Widget not found

Verify the widget type exists in `widgetTypes` array.

## Future Enhancements

- [ ] Real-time data updates via WebSocket
- [ ] Export dashboard as PDF/Image
- [ ] Share dashboard with link
- [ ] Dashboard templates library
- [ ] Custom widget builder UI
- [ ] Advanced filtering per widget
- [ ] Drill-down capabilities
- [ ] Mobile-optimized widgets
