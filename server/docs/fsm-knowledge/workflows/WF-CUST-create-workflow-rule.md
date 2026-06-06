# WF-CUST-create-workflow-rule

## Module
Customization > Workflow Rules

## Routes
- List: `/customization/workflow-rules`
- Create: `/customization/workflow-rules/new` (renders `WorkflowRuleFormPage` with `isEdit = false`)
- Edit: `/customization/workflow-rules/:id/edit` (renders `WorkflowRuleFormPage` with `isEdit = true`)

## Sidebar Navigation
The "Automation & Customization" section and its "Workflow Rules" child item are commented out in `Sidebar.tsx`. Navigate directly to `/customization/workflow-rules`.

---

## Prerequisites

- User must be authenticated (PrivateRoute).
- **Create Workflow Rule** button is wrapped in `PermissionGuard permission="workflow-rules:create"`. The button is hidden unless the user holds this permission.
- **View** (EyeOutlined, tooltip "View") action button requires `workflow-rules:read`.
- **Edit** (EditOutlined, tooltip "Edit") action button requires `workflow-rules:update`.
- **Delete** (DeleteOutlined, tooltip "Delete") action button requires `workflow-rules:delete`.
- The **Status** toggle Switch in the list table is not additionally permission-guarded beyond page access.

---

## Page: Workflow Rules List (`/customization/workflow-rules`)

Page header title: **Workflow Rules**  
Page header subtitle: "Event-triggered automation rules"

### Filters available

- **Search** text input (placeholder "Search workflow rules...") — debounced 500 ms, resets to page 1.

### Table columns
`Name` | `Entity Type` | `Trigger Event` | `Status` | `Last Updated` | `Actions`

- **Entity Type** column: plain Tag.
- **Trigger Event** column: blue Tag.
- **Status** column: Switch (`checkedChildren="Active"` / `unCheckedChildren="Inactive"`) — toggles immediately via `useUpdateWorkflowRule`.
- **Last Updated** column: formatted datetime; sortable.
- `Name` and `Last Updated` columns are sortable.
- Pagination: `showSizeChanger`, total label `Total {n} workflow rules`.

---

## Steps: Create a Workflow Rule

1. Navigate to `/customization/workflow-rules`.
2. Click **Create Workflow Rule** (primary button, PlusOutlined icon; requires `workflow-rules:create` permission). The browser navigates to `/customization/workflow-rules/new`.
3. The page **Create Workflow Rule** (page header; onBack navigates to `/customization/workflow-rules`) loads with an empty form in a `Card`.
4. Fill in **Name** (required text input; placeholder "e.g. Auto-assign urgent work orders"; validation: "Please enter a name").
5. Select a **Module** (required Select dropdown; placeholder "Select module"; validation: "Please select a module"):
   - Work Orders
   - Service Requests
   - Estimates
   - Invoices
   - Contacts
   - Companies
   - Assets
6. Select a **Trigger Event** (required Select dropdown; placeholder "Select trigger"; validation: "Please select a trigger event"):
   - On Create
   - On Update
   - On Delete
   - On Status Change
   - On Field Change
   - Scheduled
7. Fill in **Conditions (JSON)** (required TextArea; monospace font; 6 rows; default `{}`; hint: "Define conditions that must be met for the rule to trigger"; placeholder `{"field": "priority", "operator": "equals", "value": "urgent"}`). Validates that value is parseable JSON; error: "Invalid JSON format".
8. Fill in **Actions (JSON)** (required TextArea; monospace font; 6 rows; default `{}`; hint: "Define actions to execute when conditions are met"; placeholder `{"action": "send_email", "to": "manager@example.com", "template": "urgent_wo_notification"}`). Validates that value is parseable JSON; error: "Invalid JSON format".
9. Toggle **Active** Switch (`checkedChildren="Active"` / `unCheckedChildren="Inactive"`; default: Active/checked).
10. Click **Create** (primary button; loading while `createWorkflowRule.isPending`). On success, navigates to `/customization/workflow-rules`.
11. Click **Cancel** to discard and navigate to `/customization/workflow-rules`.

---

## Steps: Edit a Workflow Rule

1. Navigate to `/customization/workflow-rules`.
2. Locate the target rule.
3. Click the **Edit** icon button (EditOutlined, tooltip "Edit"; requires `workflow-rules:update`). Navigates to `/customization/workflow-rules/:id/edit`.
4. While the record loads, a `Skeleton` is displayed under the page header "Loading...".
5. The form **Edit Workflow Rule** pre-populates: Name, Module, Trigger Event, Conditions (JSON string), Actions (JSON string), Active.
6. Make changes.
7. Click **Update** (primary button; loading while `updateWorkflowRule.isPending`). On success, navigates to `/customization/workflow-rules`.
8. Click **Cancel** to discard and navigate to `/customization/workflow-rules`.

---

## Steps: View a Workflow Rule

1. In the list table, click the **View** icon button (EyeOutlined, tooltip "View"; requires `workflow-rules:read`). Navigates to `/customization/workflow-rules/:id`.

---

## Steps: Toggle Workflow Rule Active Status

1. In the **Status** column of any row, click the Switch to toggle `Active` / `Inactive`.
2. `useUpdateWorkflowRule` fires immediately with `{ id, is_active: <new value> }`. No confirmation dialog is shown.

---

## Steps: Delete a Workflow Rule

1. In the list table, click the **Delete** icon button (DeleteOutlined, danger/red, tooltip "Delete"; requires `workflow-rules:delete`).
2. A confirmation dialog appears:
   - Title: **Delete Workflow Rule**
   - Body: `Are you sure you want to delete "{rule.name}"?`
3. Click **OK** to confirm; `deleteWorkflowRule.mutateAsync(record.id)` is called.
4. Click **Cancel** to abort.

---

## Trigger Event Reference

| Display Label | Value |
|---|---|
| On Create | `create` |
| On Update | `update` |
| On Delete | `delete` |
| On Status Change | `status_change` |
| On Field Change | `field_change` |
| Scheduled | `scheduled` |

---

## Actions Summary

| Action | Trigger | Effect |
|---|---|---|
| Search | Text input onChange (debounced) | Filters list; resets to page 1 |
| Sort by Name | Click Name column header | Client-side sort |
| Sort by Last Updated | Click Last Updated column header | Client-side sort |
| Navigate to Create form | Click "Create Workflow Rule" | Navigates to `/customization/workflow-rules/new` |
| Navigate to Edit form | Click EditOutlined (tooltip "Edit") | Navigates to `/customization/workflow-rules/:id/edit` |
| Navigate to View detail | Click EyeOutlined (tooltip "View") | Navigates to `/customization/workflow-rules/:id` |
| Toggle Status inline | Click Switch in Status column | Calls useUpdateWorkflowRule with { id, is_active } immediately |
| Open delete confirmation | Click DeleteOutlined (tooltip "Delete") | showConfirmDialog "Delete Workflow Rule" |
| Confirm deletion | Click "OK" in dialog | deleteWorkflowRule.mutateAsync(id) |
| Submit Create form | Click "Create" | createWorkflowRule.mutateAsync; navigates to list on success |
| Submit Edit form | Click "Update" | updateWorkflowRule.mutateAsync; navigates to list on success |
| Cancel form | Click "Cancel" | Navigates to `/customization/workflow-rules` without saving |
| Back from form | Click back arrow (PageHeader onBack) | Navigates to `/customization/workflow-rules` |
