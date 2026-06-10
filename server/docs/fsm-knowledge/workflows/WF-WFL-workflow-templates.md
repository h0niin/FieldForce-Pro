# WF-WFL-workflow-templates — Manage Workflow Approval Templates

## Module
Workflow & Approvals — `WorkflowTemplateListPage` (`/workflow/templates`), `WorkflowTemplateFormPage` (`/workflow/templates/new`, `/workflow/templates/:id/edit`), `WorkflowTemplateDetailPage` (`/workflow/templates/:id`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- Creating a template requires the `workflow_templates:create` permission.
- Editing, activating, and deactivating require `workflow_templates:update`.
- Deleting requires `workflow_templates:delete`.
- To assign approvers, users must exist (the approver dropdown is populated from `useUsers`).

---

## Steps — View Workflow Templates List

1. Navigate to `/workflow/templates`. The page heading reads **Workflow Templates** (`workflowTemplates.title`).
2. If you have `workflow_templates:create`, a **New Template** button (PlusOutlined) is shown top-right, linking to `/workflow/templates/new`.
3. A search box (SearchOutlined) filters templates as you type (debounced ~500ms); typing resets to page 1.
4. The table (loaded via `useWorkflowTemplates`) shows these columns:

   | Column | Notes |
   |---|---|
   | **Name** | Clickable link to `/workflow/templates/:id` |
   | **Document Type** | Blue tag, underscores shown as spaces (e.g. `WORK ORDER`) |
   | **Category** | Color-coded tag (PROCUREMENT=blue, SERVICE=green, MAINTENANCE=orange, FINANCE=purple, VENDOR=gold, PROGRAM=geekblue, BUDGET=magenta, OPERATIONS=cyan, OTHER=default) |
   | **Version** | Rendered as `v{n}` |
   | **Approvers** | Count of configured approver steps |
   | **Status** | Green **Active** tag or default **Inactive** tag (from `is_active`) |
   | **Created** | Formatted date/time |
   | **Actions** | View, Edit, Activate/Deactivate, Delete (permission-gated) |

5. The table paginates (default 10 per page, page-size changer enabled) and shows a total count.

---

## Steps — Create a Workflow Template

1. From the list page, click **New Template**. The form opens at `/workflow/templates/new` with heading **Create** (`workflowTemplate.createTitle`).
2. In the **Details** card, fill in:
   - **Name** (required) — text input.
   - **Description** (optional) — multi-line text area.
   - **Document Type** (required) — searchable dropdown. Options include: Invoice, Quotation, Vendor, Contract, Draft Invoice, PRQ, PO, Proforma, Payment Request, Service Contract, Petty Cash, Purchase Request, Service Request, Petty Cash Report, Resource Booking, Purchase Order, Work Order, Estimates, Estimate Approve, Expense, Schedule (Service Appointment), Field Workflow (Technician Session), Job Sheets, Job Sheet Approval.
   - **Category** (required) — searchable dropdown: Procurement, Service, Maintenance, Finance, Vendor, Program, Budget, Other, Operations, Create, Update, Approve.
3. In the **Steps** card, configure one or more approval steps (Form.List `approvers`; the form starts with one step pre-filled with order_no 1 and required = on). For each **Step {n}**, set:
   - **Step No** (required) — number, min 1.
   - **Approver** (required) — searchable dropdown of users shown as `First Last (email)`.
   - **Authority Level** (optional) — number 1–10.
   - **Required** (optional) — toggle switch (defaults on).
   - **Min Amount** (optional) — number, min 0.
   - **Max Amount** (optional) — number, min 0.
   - **Budget Threshold** (optional) — number, min 0.
   - **Notes** (optional) — text input.
4. Click **Add Step** (dashed, PlusOutlined) to append another step, or **Remove** (MinusCircleOutlined, shown only when more than one step exists) to delete a step.
5. Click **Create Template** (primary submit). On success the app shows "Workflow template created successfully" and navigates back to `/workflow/templates`. Click **Cancel** to discard and return to the list.

---

## Steps — View a Workflow Template

1. From the list, click the template **Name** link or the **View** action (EyeOutlined). The detail page loads at `/workflow/templates/:id` (`useWorkflowTemplate`).
2. The header shows a **Back** button (ArrowLeftOutlined → `/workflow/templates`), the template name, and a status tag (green **Active** / default **Inactive**).
3. The **Details** card (Descriptions) shows: Name, Version (`v{n}`), Document Type (blue tag), Category (green tag), Description (or "no description"), Created, and Updated.
4. The **Approval Steps** card lists approvers as a vertical Steps component, sorted by `order_no`. Each step shows the approver name (or approver_id), a red **Required** tag if required, an **Authority** tag if set, plus the approver email and any **Min**, **Max**, **Budget** (shown with `$`), and **Note** values.
5. If no approvers are configured, the card shows "no steps".

---

## Steps — Edit a Workflow Template

1. From the list **Edit** action (EditOutlined) or the detail page **Edit** button, navigate to `/workflow/templates/:id/edit`. Heading reads **Edit** (`workflowTemplate.editTitle`).
2. The form pre-fills name, description, document type, category, and all approver steps from the existing template (`useWorkflowTemplate`).
3. Adjust any fields/steps as in the create flow.
4. Click **Update Template** (primary submit). On success the app shows "Workflow template updated successfully" and returns to `/workflow/templates`.

---

## Steps — Activate / Deactivate a Template

1. On the list page, use the Activate/Deactivate action: when the template is active the icon is StopOutlined (deactivate); when inactive it is CheckCircleOutlined (activate). Requires `workflow_templates:update`.
2. Alternatively, on the detail page, click the **Activate** / **Deactivate** button in the header.
3. Activating calls `useActivateWorkflowTemplate` and shows "Workflow template activated"; deactivating calls `useDeactivateWorkflowTemplate` and shows "Workflow template deactivated". The status tag updates accordingly.

---

## Steps — Delete a Workflow Template

1. Click the **Delete** action (DeleteOutlined, danger) on the list, or the **Delete** button on the detail page. Requires `workflow_templates:delete`.
2. A confirmation dialog appears (`showConfirmDialog`).
3. Confirm to call `useDeleteWorkflowTemplate`. On success the app shows "Workflow template deleted successfully"; from the detail page it then navigates back to `/workflow/templates`.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| View templates list | Navigate to `/workflow/templates` | Authenticated | `useWorkflowTemplates` → `GET /workflow-templates` |
| Open create form | **New Template** button | `workflow_templates:create` | — |
| Create template | **Create Template** submit | `workflow_templates:create` | `useCreateWorkflowTemplate` → `POST /workflow-templates` |
| View template detail | **Name** link / **View** action | Authenticated | `useWorkflowTemplate` → `GET /workflow-templates/:id` |
| Open edit form | **Edit** action / **Edit** button | `workflow_templates:update` | — |
| Update template | **Update Template** submit | `workflow_templates:update` | `useUpdateWorkflowTemplate` → `PUT /workflow-templates/:id` |
| Activate template | Activate action / **Activate** button | `workflow_templates:update` | `useActivateWorkflowTemplate` → `PATCH /workflow-templates/:id/activate` |
| Deactivate template | Deactivate action / **Deactivate** button | `workflow_templates:update` | `useDeactivateWorkflowTemplate` → `PATCH /workflow-templates/:id/deactivate` |
| Delete template | **Delete** action / **Delete** button | `workflow_templates:delete` | `useDeleteWorkflowTemplate` → `DELETE /workflow-templates/:id` |
| Search templates | Search input | Authenticated | `useWorkflowTemplates` with `search` param |
| Add approval step | **Add Step** button | create/update context | Client-side (Form.List) |
| Remove approval step | **Remove** button | create/update context | Client-side (Form.List) |
