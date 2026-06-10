# WF-WFL-approval-dashboard — Approval Dashboard & My Pending Approvals

## Module
Workflow — `ApprovalDashboardPage` (`/workflow/dashboard`)

## Prerequisites
- User must be authenticated (PrivateRoute guard on the parent layout).

---

## Steps — View Approval Statistics

1. Navigate to `/workflow/dashboard`. The page title reads **"Approval Dashboard"** (`approvalDashboard.title`).
2. A row of six statistic cards loads from the `useApprovalDashboard()` hook (`GET /document-approvals/dashboard`):

   | Card Title | Value Field | Suffix/Color |
   |---|---|---|
   | **Total** | `stats.total` | default |
   | **Pending** | `stats.pending` | amber (`#faad14`) |
   | **Approved** | `stats.approved` | green (`#52c41a`) |
   | **Rejected** | `stats.rejected` | red (`#ff4d4f`) |
   | **Overdue** | `stats.overdue` | red (`#ff4d4f`) |
   | **Approval Rate** | `stats.approval_rate` | `%` suffix, blue (`#1890ff`) |

3. While loading, each card shows a loading state (`statsLoading`); missing values fall back to `0`.

---

## Steps — Review My Pending Approvals

1. Below the statistics, a card titled **"My Pending Approvals"** (`approvalDashboard.myPendingApprovals`) displays a table.
2. Data is fetched via `useMyPendingApprovals({ take: 10 })` (`GET /document-approvals/my-pending`), limited to 10 rows; the table has no pagination.
3. The table shows these columns:
   - **Document Type** — the `document_type` value with underscores replaced by spaces, rendered as a Tag.
   - **Workflow** — `workflow_template.name`, or `-` if none.
   - **Step** — the `order_no` value, displayed as `#<number>`.
   - **Due Date** — `due_date` formatted via `formatDateTime`. If the due date is in the past, the text turns red (danger) and an **"Overdue"** Tag is appended.
   - **Created** — `created_at` formatted via `formatDateTime`.
4. If there are no pending approvals, the table shows the empty text **"No pending approvals"** (`approvalDashboard.noPendingApprovals`).

---

## Steps — View All Approvals

1. In the **"My Pending Approvals"** card header, click the **"View All"** link (`approvalDashboard.viewAll`).
2. The browser navigates to `/workflow/approvals`.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| View approval statistics | Statistic cards (auto-load) | Authenticated | `useApprovalDashboard` → `GET /document-approvals/dashboard` |
| Review my pending approvals | "My Pending Approvals" table (auto-load) | Authenticated | `useMyPendingApprovals({ take: 10 })` → `GET /document-approvals/my-pending` |
| View all approvals | **View All** link | Authenticated | Navigates to `/workflow/approvals` |
