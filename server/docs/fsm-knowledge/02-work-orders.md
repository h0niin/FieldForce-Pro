# Work Orders

Work orders are the core operational unit of FieldForce Pro. They represent a job to be performed at a customer's location.

## Accessing Work Orders

Navigate to **Work Orders** in the left sidebar.

## Creating a Work Order

1. Click **+ New Work Order** (top-right button).
2. Fill in the required fields:
   - **Summary** — brief job description
   - **Priority** — `Low`, `Medium`, `High`, or `Urgent`
   - **Customer / Contact** — link to an existing contact
   - **Service Location** — the address where the job takes place
3. Optional: attach an **Asset**, set a **Scheduled Start** date, or assign a **Technician**.
4. Click **Save**. The work order is created in `New` status.

## Work Order Detail Page

Click any work order row to open its detail page. Tabs available:

| Tab | Contents |
|-----|----------|
| **Overview** | Status, priority, dates, assigned technician, customer |
| **Line Items** | Parts and labour added to the job |
| **Notes** | Internal notes and communication log |
| **Attachments** | Photos, documents, PDFs |
| **Job Sheet** | Digital checklist for the technician |
| **Appointments** | Linked service appointments |
| **Invoice** | Invoice generated from this work order |
| **Activity** | Audit trail of all status changes |

## Changing Work Order Status

1. Open the work order detail page.
2. Click the **Status** badge at the top (e.g., `New`).
3. Select the next valid status from the dropdown. Invalid transitions (e.g., `New` → `Completed`) are blocked.
4. Confirm in the popup if prompted.

## Assigning a Technician

- On the work order detail page, click the **Assigned To** field.
- Search for a technician by name.
- Select the technician and click **Save**.
- The technician receives a push notification (if the mobile app is installed).

## Adding Line Items (Parts & Labour)

1. Go to the **Line Items** tab on the work order.
2. Click **+ Add Line Item**.
3. Choose the type (`Part` or `Labour`), enter description, quantity, and unit price.
4. Click **Add**. The total updates automatically.

## Generating an Invoice from a Work Order

1. Open the work order (must be in `Completed` or later status).
2. Click **Generate Invoice** (top-right action button) or go to the **Invoice** tab.
3. The invoice is pre-populated with all line items.
4. Review, adjust if needed, then click **Save and Send** or **Save as Draft**.

## Work Order Notes

1. Go to the **Notes** tab.
2. Type your note in the text box and click **Add Note**.
3. Notes are timestamped and attributed to the logged-in user.
4. Notes are internal only — not visible to customers.

## Attaching Photos or Documents

1. Go to the **Attachments** tab.
2. Click **Upload** and select a file (images, PDFs, documents up to 25 MB).
3. Files are stored securely and accessible to all users with access to that work order.

## Multi-Technician Assignment

A work order can be assigned to multiple technicians:
1. On the detail page, click **+ Add Technician** in the Assigned Technicians section.
2. Each technician gets their own service appointment linked to this work order.

## Filtering and Searching Work Orders

- Use the **search bar** at the top of the Work Orders list to search by summary or ID.
- Use the **Status** filter dropdown to show only work orders in a specific status.
- Use the **Assigned To** filter to see one technician's jobs.
- Use the **Date Range** filter to narrow by scheduled date.

## Bulk Actions

Select multiple work orders using the checkboxes on the left, then use the **Bulk Action** dropdown to:
- Reassign to a different technician
- Change status for all selected
- Export to CSV
