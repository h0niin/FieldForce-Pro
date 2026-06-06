# WF-USR-documents — User Document Management

## Overview
Upload, verify, unverify, download, and delete documents attached to a user profile from the Documents card on the User Details page.

---

## WF-USR-documents-upload — Upload Document

### Prerequisites
- The authenticated user must hold the permission `users:update`. The **Upload Document** button is wrapped in `<PermissionGuard permission="users:update">`.

### Steps

1. In the sidebar, click **Users** (section: "System & Analytics").
2. Click the icon-only **View Details** button (tooltip: "View Details", icon: EyeOutlined) for the target user.
3. The **User Details** page loads. Scroll to the **Documents** card.
4. Click **Upload Document** (icon: UploadOutlined, type: primary) in the Documents card header.
5. The **Upload Document** modal opens.
6. Fill in the fields:
   - **Document Type** (required — "Please select document type"): select from Certification, License, ID Proof, Insurance, Contract, Other.
   - **Document Name** (required — "Please enter document name"): e.g., "Driver's License, Certification".
   - **File** (required — "Please select a file to upload"): click **Select File** (icon: UploadOutlined) to choose one file. Max count is 1.
   - **Document Number** (optional): e.g., "License number, Certificate ID".
   - **Issuing Authority** (optional): e.g., "DMV, Certification body".
   - **Issue Date** (optional): date picker.
   - **Expiry Date** (optional): date picker.
   - **Notes** (optional): textarea, "Additional notes".
7. Click the modal's OK button to submit.
   - If no file is selected, an error message "Please select a file to upload" appears.
   - On success, the modal closes and the Documents table refreshes.
8. To cancel, click the modal's cancel (X) button — the modal closes, the form resets, and the file list is cleared.

---

## WF-USR-documents-verify — Verify a Document

### Prerequisites
- The authenticated user must hold the permission `users:update`. The Verify / Unverify button is wrapped in `<PermissionGuard permission="users:update">`.
- The document must have `is_verified = false` (Verified column shows **Not Verified** tag).

### Steps

1. Navigate to the **User Details** page for the target user.
2. In the **Documents** table, find a row where the Verified column shows **Not Verified**.
3. In the Actions column, click the icon-only button with tooltip **Verify** (icon: CheckCircleOutlined, color: #52c41a).
4. `verifyDocument.mutateAsync(record.id)` is called immediately (no confirmation dialog).
5. On success, the Verified column changes to the **Verified** tag.

---

## WF-USR-documents-unverify — Unverify a Document

### Prerequisites
- The authenticated user must hold the permission `users:update`.
- The document must have `is_verified = true` (Verified column shows **Verified** tag).

### Steps

1. Navigate to the **User Details** page for the target user.
2. In the **Documents** table, find a row where the Verified column shows **Verified**.
3. In the Actions column, click the icon-only button with tooltip **Unverify** (icon: CloseCircleOutlined).
4. `unverifyDocument.mutateAsync(record.id)` is called immediately (no confirmation dialog).
5. On success, the Verified column changes to the **Not Verified** tag.

---

## WF-USR-documents-download — Download a Document

### Prerequisites
- No permission guard is applied to the Download button; any user who can view the User Details page can download documents.

### Steps

1. Navigate to the **User Details** page for the target user.
2. In the **Documents** table, locate the target document row.
3. In the Actions column, click the icon-only button with tooltip **Download** (icon: DownloadOutlined, type: text).
4. `window.open(record.file_url, '_blank')` is called — the file URL opens in a new browser tab.

---

## WF-USR-documents-delete — Delete a Document

### Prerequisites
- The authenticated user must hold the permission `users:delete`. The Delete button is wrapped in `<PermissionGuard permission="users:delete">`.

### Steps

1. Navigate to the **User Details** page for the target user.
2. In the **Documents** table, locate the target document row.
3. In the Actions column, click the icon-only danger button with tooltip **Delete** (icon: DeleteOutlined, type: text, danger).
4. A confirmation dialog appears with:
   - Title: "Delete Document"
   - Content: "Are you sure you want to delete this document?"
   - A destructive confirmation button.
5. Confirm by clicking the confirm button in the dialog.
   - On success, `deleteDocument.mutateAsync(id)` is called and the document is removed from the table.
6. To cancel, click the cancel button in the dialog.

## Outcome
The document record is soft-deleted. The Documents table no longer shows the deleted entry after cache refresh.

---

## Expiry Status Indicators (informational, read-only)

In the Expiry Date column:
- If `expiry_date` is in the past: date displayed in **red** with the suffix **(Expired)**.
- If `expiry_date` is within 30 days from today: date displayed in **orange** with the suffix **(Expiring Soon)**.
- Otherwise: date displayed in the default text color with no suffix.
