# WF-JS-list-job-sheets — Browse and Search Job Sheets

## Overview
The Job Sheets list page provides a tabbed view of all job sheet instances, the current user's drafts, and instances pending the current user's approval. Users can search, paginate, and navigate to individual records.

## Prerequisites
- User must be authenticated (JWT).

---

## Steps

1. In the left sidebar, navigate to **Job Sheets**.
   - The page title is **"Job Sheets"** with subtitle **"Manage job sheet instances"**.

2. Three tabs are rendered:
   - **All Job Sheets** (key: `all`) — default active tab. Fetches all instances (`useJobSheetInstances`).
   - **Drafts** (key: `drafts`) — fetches the current user's draft instances (`useMyJobSheetDrafts`).
   - **Approvals** (key: `approvals`) — fetches instances pending the current user's approval (`useMyJobSheetApprovals`).

3. Click any tab to switch the active view. Switching tabs clears the search field and resets pagination to page 1 for all tabs.

4. Type in **"Search job sheets..."** (allowClear, width 400) to filter the active tab's results. Results are debounced 500ms. Changing the search string resets all tabs to page 1.

5. The table shows columns:
   - **Work Order**: the linked work order's `wo_number`, or `-` if no work order is linked.
   - **Status**: Tag — `Draft` (default), `Pending` (blue), `Approved` (cyan), `In Progress` (orange), `Completed` (green).
   - **Created**: formatted date/time, sortable ascending/descending.
   - **Updated**: formatted date/time.
   - **Actions**: fixed right column (120px normally, 200px on Approvals tab).

6. Pagination controls appear below the table:
   - Shows current page, page size selector, and **"Total N job sheets"** count.
   - Each tab has independent page and pageSize state.

7. From any tab, the following action buttons appear per row (see dedicated workflow files for each):
   - **"View"** tooltip button (EyeOutlined): always visible — see WF-JS-view-job-sheet.
   - **"Complete Draft"** tooltip button (PlusOutlined, blue): only shown when `record.status === 'draft'` — see WF-JS-complete-job-sheet.
   - **"Approve"** tooltip button (CheckOutlined, green): only shown on Approvals tab when `approvalMap[record.id]` exists — see WF-JS-approve-reject-job-sheet.
   - **"Reject"** tooltip button (CloseOutlined, red): only shown on Approvals tab when `approvalMap[record.id]` exists — see WF-JS-approve-reject-job-sheet.

---

## Actions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Click **"All Job Sheets"** tab | Tab onChange | Fetches all instances; search/pagination reset |
| Click **"Drafts"** tab | Tab onChange | Fetches current user's drafts; search/pagination reset |
| Click **"Approvals"** tab | Tab onChange | Fetches user's pending-approval instances; search/pagination reset |
| Type in **"Search job sheets..."** | Input onChange | Table filtered after 500ms debounce; all tabs reset to page 1 |
| Clear search (×) | allowClear | Search cleared; table reloads |
| Click pagination page number | Table pagination onChange | Table shows requested page |
| Change page size | Table pagination showSizeChanger | Table reloads with new page size |
| Click sortable column header (Created) | Table sorter | Rows sorted ascending/descending |
