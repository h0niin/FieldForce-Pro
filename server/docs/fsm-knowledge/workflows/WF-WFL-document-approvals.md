# WF-WFL-document-approvals — View & Track Document Approvals

## Module
Workflow — `DocumentApprovalListPage` (`/workflow/document-approvals`)

## Prerequisites
- User must be authenticated (route is rendered inside the private app layout).

---

## Steps — Open the Document Approvals List

1. Navigate to `/workflow/document-approvals`. The page title reads **"Document Approvals"**.
2. Two tabs are shown at the top:
   - **All Approvals** (`all`) — default tab; lists every approval, with status and document-type filters.
   - **Sent to Me** (`sent-to-me`) — lists approvals sent to the current user; no extra filters are shown.
3. Switching tabs resets the page to 1 and clears the status and document-type filters.

---

## Steps — Filter the All Approvals List

1. On the **All Approvals** tab, two dropdown filters appear above the table.
2. Use the **Filter by status** dropdown (allow-clear) to filter by one status:
   - **Pending** (`PENDING`)
   - **Approved** (`APPROVED`)
   - **Rejected** (`REJECTED`)
   - **Skipped** (`SKIPPED`)
   - **Correction Required** (`CORRECTION_REQUIRED`)
3. Use the **Filter by document type** dropdown (allow-clear) to filter by document type. Available values include: Invoice, Quotation, Vendor, Contract, Draft Invoice, PRQ, PO, Proforma, Payment Request, Service Contract, Petty Cash, Purchase Request, Service Request, Petty Cash Report, Resource Booking, Purchase Order, Work Order, Estimate, Estimate Approval, Expense, Schedule, Field Workflow.
4. Changing either filter resets the page to 1 and re-fetches the list via `useDocumentApprovals`.
5. The **Sent to Me** tab does not show these filters; it fetches via `useSentToMeApprovals`.

---

## Steps — Read the Approvals Table

1. The table shows one row per approval step with these columns:

   | Column | Content |
   |---|---|
   | **Document** | Document-type tag (colored) plus the first 8 characters of the document ID |
   | **Workflow** | The workflow template name (`workflow_template.name`), or `-` |
   | **Step** | Step order number, shown as `#{order_no}` |
   | **Approver** | Approver first + last name, or the first 8 characters of `approver_id` |
   | **Status** | Status tag (colored): Pending=orange, Approved=green, Rejected=red, Skipped=default, Correction Required=gold |
   | **Due Date** | Formatted `due_date`, or `-` |
   | **Action Date** | Formatted `action_date`, or `-` |
   | **Actions** | A view-details (eye) button |

2. Pagination shows the total item count and a page-size changer; changing the page or size re-fetches the list.

---

## Steps — Open the Related Document

1. In the **Document** column, for supported document types a link (chain) button appears next to the truncated document ID.
2. Click the link button to navigate to the related record. Supported routes:
   - **Service Request** → `/service-requests/{document_id}`
   - **Work Order** → `/work-orders/{document_id}`
   - **Estimate** / **Estimate Approval** → `/estimates/{document_id}`
   - **Schedule** → `/scheduling?tab=review&appointment_id={document_id}`
   - **Field Workflow** → `/work-orders?wo_id={document_id}#field-workflow`
3. Document types without a mapped route show no link button.

---

## Steps — View the Approval Timeline (Expand Row)

1. Click the expand control on any table row to render an inline **DocumentTimeline** for that document.
2. The timeline (loaded via `useApprovalsByDocument` and `useHistoryByDocument`) shows, in order:
   - **Submitted for approval** — when the document entered the approval chain.
   - **Chain started** — with a tag for the number of steps and the workflow template name.
   - **Action entries** — each history action (e.g. Approve, Reject, Request Correction, Skip, Delegate, Escalate) with the actor name, the resulting status tag, timestamp, and any comments.
   - **Pending step entries** — step number, approver name, a "Pending" tag, "awaiting review" note, and due date if set.

---

## Steps — View Approval Details (Modal)

1. Click the **view-details** (eye) button in the **Actions** column to open the **Approval Details** modal for that row.
2. The modal shows a details panel (loaded via `useDocumentApproval`): copyable Document ID with an optional **View** link to the related document, Document Type, Approver, Step (`#order_no`), Status, Workflow, and (when present) Comments, Action Date, Due Date, and Delegated From.
3. Below the details, an **Approval History** timeline (loaded via `useApprovalHistory`) lists each action with the actor, timestamp, and comments; if there is none, "no history" text is shown.
4. The modal has no action buttons; close it with the modal's cancel control.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Open approvals list | Navigate to `/workflow/document-approvals` | Authenticated | `useDocumentApprovals` (All Approvals) |
| Switch to Sent to Me | **Sent to Me** tab | Authenticated | `useSentToMeApprovals` |
| Filter by status | **Filter by status** dropdown | Authenticated | `useDocumentApprovals` (re-fetch with `status`) |
| Filter by document type | **Filter by document type** dropdown | Authenticated | `useDocumentApprovals` (re-fetch with `document_type`) |
| Paginate / change page size | Table pagination | Authenticated | `useDocumentApprovals` / `useSentToMeApprovals` (re-fetch with `page`/`take`) |
| Open related document | Link (chain) button in Document column | Authenticated | Client-side `navigate()` to mapped route |
| Expand approval timeline | Row expand control | Authenticated | `useApprovalsByDocument`, `useHistoryByDocument` |
| View approval details | View-details (eye) button | Authenticated | `useDocumentApproval`, `useApprovalHistory` |
