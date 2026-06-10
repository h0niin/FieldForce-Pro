# WF-DOC-document-ai-upload — Upload & Parse Documents with Document AI (OCR)

## Module
Document AI — `DocumentUploadPage` (`/documents/ai`)

## Prerequisites
- User must be authenticated (PrivateRoute guard on the authenticated app layout).

---

## Steps — Upload and Parse a Document

1. Navigate to `/documents/ai`. The page title reads **"Upload Document"** (from `documentUpload.title`).
2. In the **Upload Document** card, open the document-type **Select** (default value **General**) and choose one of:
   - **Invoice**, **Receipt**, **Contract**, **Report**, **General**
3. Click the **Upload & Parse** button (primary button with upload icon). A file picker opens.
4. Choose a file. Only these file types are accepted: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.tiff`, `.bmp`.
5. On selection the file uploads immediately (the Upload control returns `false` and triggers the upload directly — there is no separate confirm step). The button shows a loading spinner while `useUploadDocument` is pending.
6. The file is sent as `multipart/form-data` to `POST /documents/upload` with fields `file` and `document_type`.
7. On success a notification appears: the server `message` or fallback **"Document uploaded and parsed"**, and the **Parsed Documents** list refreshes automatically (TanStack Query invalidates the `['documents']` cache).
8. On failure an error notification shows the server message or **"Failed to upload document"**.

---

## Steps — View and Filter Parsed Documents

1. The **Parsed Documents** card below shows a table populated by `useDocuments` (`GET /documents`).
2. The table columns are:
   - **File Name** (with a file icon)
   - **Type** (rendered as a tag)
   - **Status** (color-coded tag: pending = default, processing = processing, completed = success, failed = error, reviewed = blue)
   - **Confidence** (the `confidence` value shown as a percentage with one decimal, e.g. `92.5%`, or `-` if absent)
   - **Pages**
   - **Actions** (Preview, Delete)
3. In the card header (`extra`), use the **Filter Type** Select to filter by document type (Invoice, Receipt, Contract, Report, General). It is clearable.
4. Use the **Filter Status** Select to filter by status: **pending**, **processing**, **completed**, **failed**, **reviewed**. It is clearable.
5. Changing either filter re-fetches via `useDocuments` with `document_type` and/or `status` query params.
6. If there are no documents, an empty state shows **"No documents"** (`documentUpload.noDocuments`).

---

## Steps — Preview Extracted Data

1. In the **Actions** column of a table row, click the **Preview** button (eye icon).
2. A modal opens titled with the document's `file_name` (or **"Document Preview"** fallback).
3. The modal shows a **Descriptions** block with **Type**, **Status** (color-coded tag), **Confidence** (percentage or `-`), and **Pages**.
4. If the document has `extracted_fields`, an **Extracted Fields** card lists each field key and value.
5. If the document has `extracted_text`, an **Extracted Text** card shows the raw parsed text in a scrollable, pre-wrapped block.
6. Close the modal via the cancel (X) control. The modal has no footer buttons.

---

## Steps — Delete a Document

1. In the **Actions** column of a table row, click the **Delete** button (red/danger button with delete icon).
2. The document is deleted immediately via `useDeleteDocument` (`DELETE /documents/{id}`) — there is no confirmation dialog.
3. On success a notification shows **"Document deleted"** and the list refreshes (cache invalidated).
4. On failure an error notification shows the server message or **"Failed to delete document"**.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Select document type | Document-type **Select** (default General) | Authenticated | Local state (`docType`) |
| Upload & parse a document | **Upload & Parse** button | Authenticated | `useUploadDocument` → `POST /documents/upload` (multipart: `file`, `document_type`) |
| List parsed documents | (auto on load) | Authenticated | `useDocuments` → `GET /documents` |
| Filter by type | **Filter Type** Select | Authenticated | `useDocuments` with `document_type` param |
| Filter by status | **Filter Status** Select | Authenticated | `useDocuments` with `status` param |
| Preview extracted data | **Preview** button (eye icon) | Authenticated | Local state (`previewDoc`); data from list row |
| Delete a document | **Delete** button (danger) | Authenticated | `useDeleteDocument` → `DELETE /documents/{id}` |
