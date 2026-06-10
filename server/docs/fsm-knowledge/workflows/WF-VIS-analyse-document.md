# WF-VIS-analyse-document — Use AI Vision to Extract Data from a Document or Photo

## Prerequisites
- User must have the `vision:use` permission (Admin or appropriate role).
- A document (invoice, receipt, asset photo, etc.) must be available for upload.

## Steps — Analyse a Document

1. Click **Vision** in the left sidebar (or **AI → Vision Dashboard**).
2. Click **+ Upload Document** or drag and drop a file onto the upload area.
   Supported formats: JPG, PNG, PDF, HEIC.
3. The AI processes the document (takes approximately 10–30 seconds).
4. The extracted data is shown in a review panel:
   - For an invoice/receipt: supplier name, invoice number, line items, amounts, due date
   - For an asset photo: model number, serial number, identified components, detected faults
5. Review the extracted fields. Click any field to manually correct it if the AI made an error.
6. Choose what to do with the extracted data:
   - Click **Apply to Invoice** to create a draft invoice pre-filled with the extracted data
   - Click **Apply to Work Order** to fill in work order fields
   - Click **Save for Later** to store the extraction result without applying it yet
7. Click **Confirm**.

## Steps — Analyse a Photo on a Work Order

1. Open the work order.
2. Go to the **Attachments** tab.
3. Upload a photo (e.g., a photo of the equipment, a receipt, a manufacturer label).
4. On the uploaded photo, click **Analyse with AI**.
5. The AI returns extracted information relevant to the photo.
6. Click **Apply to Work Order** to fill in asset details or fault information automatically.

## Result
Data is automatically extracted from the document or photo, saving time on manual data entry. Extracted data can be applied to invoices, work orders, or saved as a reference.
