# WF-JS-approve-reject-job-sheet — Approve or Reject a Job Sheet

## Overview
A user who is a designated approver reviews a `pending` job sheet instance and either approves or rejects it from the **Approvals** tab of the Job Sheets list page.

## Prerequisites
- The job sheet instance must have status `pending` and a corresponding `JOB_SHEET_APPROVAL` workflow approval record with status `PENDING`.
- The current user must be an approver on that approval record (the `useMyJobSheetApprovals` hook returns only records assigned to the current user).
- `approvalMap[record.id]` must resolve to a valid approval ID (i.e., the pending approval record was returned by `useDocumentApprovals({ document_type: 'JOB_SHEET_APPROVAL', status: 'PENDING' })`).
- The **Approve** and **Reject** action buttons are rendered in the Actions column only when `activeTab === 'approvals'` AND `approvalMap[record.id]` exists.

---

## Steps — Approve

1. In the left sidebar, navigate to **Job Sheets**.
   - The page title is **"Job Sheets"** with subtitle **"Manage job sheet instances"**.

2. Click the **"Approvals"** tab.
   - The table reloads with job sheet instances pending the current user's approval.
   - The Actions column is 200px wide (wider than normal 120px to accommodate approve/reject buttons).

3. Optionally type in **"Search job sheets..."** (allowClear, width 400) to locate a specific job sheet.

4. In the **Actions** column of the target row, click the **"Approve"** tooltip button (CheckOutlined icon, text style, small, green color `#52c41a`).
   - A Popconfirm dropdown appears with:
     - **Title**: `Approve this job sheet?`
     - **OK button label**: `Approve`
     - **Cancel button label**: `Cancel`

5. Click **"Approve"** in the Popconfirm to confirm.
   - `processApproval.mutateAsync({ id: approvalMap[record.id], action: 'APPROVE' })` is called.
   - The Approve and Reject buttons show a loading spinner while the mutation is pending (`processApproval.isPending`).
   - On success, the approval record is processed and the instance status transitions (server-side).

6. To cancel without approving, click **"Cancel"** in the Popconfirm. No changes are made.

---

## Steps — Reject

1–3. Follow the same steps as Approve above (navigate to **Job Sheets** > **"Approvals"** tab).

4. In the **Actions** column of the target row, click the **"Reject"** tooltip button (CloseOutlined icon, text style, small, red color `#ff4d4f`).
   - A Popconfirm dropdown appears with:
     - **Title**: `Reject this job sheet?`
     - **OK button label**: `Reject` (danger style)
     - **Cancel button label**: `Cancel`

5. Click **"Reject"** in the Popconfirm to confirm.
   - `processApproval.mutateAsync({ id: approvalMap[record.id], action: 'REJECT' })` is called.
   - The Approve and Reject buttons show a loading spinner while the mutation is pending.

6. To cancel without rejecting, click **"Cancel"** in the Popconfirm.

---

## Actions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Click **"Approvals"** tab | Tab onChange | Table shows current user's pending-approval instances; Actions column expands to 200px |
| Click **"Approve"** tooltip button | CheckOutlined Tooltip button (approvals tab only, when approvalMap entry exists) | Popconfirm opens: `Approve this job sheet?` |
| Click **"Approve"** in Popconfirm | Popconfirm onConfirm | `processApproval` mutation fires with `action: 'APPROVE'` |
| Click **"Cancel"** in Approve Popconfirm | Popconfirm cancelText | Popconfirm dismissed, no change |
| Click **"Reject"** tooltip button | CloseOutlined Tooltip button (approvals tab only, when approvalMap entry exists) | Popconfirm opens: `Reject this job sheet?` |
| Click **"Reject"** in Popconfirm | Popconfirm onConfirm | `processApproval` mutation fires with `action: 'REJECT'` |
| Click **"Cancel"** in Reject Popconfirm | Popconfirm cancelText | Popconfirm dismissed, no change |
