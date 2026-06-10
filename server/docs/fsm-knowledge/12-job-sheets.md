# Job Sheets

A job sheet is a digital checklist or form that a technician fills out while on site. It ensures all required steps are completed, all safety checks are ticked, and all required photos or signatures are captured. Job sheets replace paper service reports.

---

## Accessing Job Sheets

Click **Job Sheets** in the left sidebar. This shows the **Job Sheet Dashboard** with:
- Recent job sheet activity
- Templates available for use
- Job sheets pending approval

To see all job sheet instances: click **All Job Sheets** tab.
To manage templates: click **Templates** tab.

---

## What is a Job Sheet Template?

A template defines the structure of a job sheet — the checklist items, questions, and fields the technician needs to complete. You create templates once and reuse them across many jobs.

**Template item types:**
- **Checkbox** — a yes/no or done/not done item (e.g., "Checked refrigerant levels")
- **Text** — a free-text field for the technician to write a comment (e.g., "Describe the fault found")
- **Photo** — requires the technician to upload a photo (e.g., "Photo of completed installation")
- **Signature** — requires a signature (e.g., customer sign-off, technician certification)
- **Number** — numeric input (e.g., temperature reading, pressure reading)

---

## Creating a Job Sheet Template

1. Go to **Job Sheets → Templates** tab.
2. Click **+ New Template**.
3. Enter a **Template Name** (e.g., "HVAC Annual Service Checklist").
4. Enter a **Description** (optional).
5. Select a **Category** (e.g., "HVAC", "Electrical", "Plumbing").
6. Click **+ Add Item** to add checklist items:
   - Choose the **Type** (Checkbox, Text, Photo, Signature, Number)
   - Enter the **Label** (the question or instruction the technician sees)
   - Toggle **Required** if the technician must complete this item before submitting
   - Drag items to reorder them
7. Click **Save Template**.

---

## Attaching a Job Sheet to a Work Order

1. Open the work order detail page.
2. Click the **Job Sheet** tab.
3. Click **+ Add Job Sheet**.
4. Select the template to use.
5. The job sheet instance is created and linked to the work order.

Technicians can also see and complete job sheets from the **mobile app** on the work order detail page.

---

## Completing a Job Sheet (Technician)

1. On the mobile app or web, open the work order.
2. Tap/click the **Job Sheet** tab.
3. Work through each checklist item:
   - Tick checkboxes
   - Type text into text fields
   - Take or upload photos where required
   - Capture signature where required
4. Once all required items are complete, tap **Submit Job Sheet**.
5. The job sheet status changes to `Completed`.

---

## Approving or Rejecting a Job Sheet (Manager/Admin)

1. Go to **Job Sheets** in the sidebar.
2. Find the job sheet (filter by status = "Completed, Pending Review").
3. Click the job sheet to open it.
4. Review all completed items and photos.
5. Click **Approve** or **Reject**.
   - If rejecting, enter a reason and the technician is notified to redo specific items.

---

## Job Sheet Statuses

| Status | Meaning |
|--------|---------|
| **Pending** | Created, not yet started by the technician |
| **In Progress** | Technician has started filling it out |
| **Completed** | Technician has submitted it, awaiting review |
| **Approved** | Manager has approved the completed job sheet |
| **Rejected** | Manager has rejected — technician must resubmit |

---

## Job Sheet Dashboard

Go to **Job Sheets** to see:
- Number of job sheets completed today
- Job sheets awaiting approval
- Recent activity across all job sheets
- Quick access to open a specific job sheet

---

## Viewing a Job Sheet

1. Go to **Job Sheets** in the sidebar.
2. Click any job sheet row to open it.
3. The detail view shows:
   - Which work order and technician it is linked to
   - All checklist items with their responses
   - Photos that were uploaded (click to view full-size)
   - Signatures captured
   - Time the job sheet was started and submitted
   - Approval status and approver notes

---

## Editing a Job Sheet Template

1. Go to **Job Sheets → Templates** tab.
2. Click the template you want to edit.
3. Click **Edit Template**.
4. Add, remove, or reorder items.
5. Click **Save**. Changes apply to future job sheet instances only (existing ones are not affected).

---

## Deleting a Job Sheet Template

1. Go to **Job Sheets → Templates** tab.
2. Find the template.
3. Click the **Delete** icon (trash) in the actions column.
4. Confirm. The template is removed but existing job sheet instances are preserved.
