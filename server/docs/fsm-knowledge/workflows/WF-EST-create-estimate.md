# WF-EST-create-estimate — Create a New Estimate

## Prerequisites

- User must be logged in and hold the `estimates:create` permission.
- User must be the **assigned estimator** OR an admin. If neither condition is met,
  the application redirects to `/estimates` with the message:
  `"Only the assigned estimator can create estimates"`.
- The **"Create Estimate"** button is only rendered when the **Drafts** tab is active
  AND `canCreate` evaluates to `true`.

---

## Steps

1. Click **"Estimates"** in the sidebar (calculator icon).
2. The Estimates list page opens. Click the **"Drafts"** tab.
3. Click the **"Create Estimate"** button (top-right, `+` icon). This navigates to
   `/estimates/new`.

   > If arriving from a Service Request, the URL includes `?service_request_id=<id>`.
   > The form auto-fills **Customer / Contact**, **Estimate Title**
   > (`"Estimate for: <SR subject>"`), **Scheduled Date**, and **Location** from the
   > linked SR, and an info banner appears:
   > **"Linked to Service Request: [SR Subject] [priority tag]"**

4. In the **"Client & Reference"** card, complete:
   - **Customer / Contact** (required) — type to search and select from the dropdown.
   - **Estimate Title** — e.g. `"HVAC Annual Maintenance Package"`.
   - **Scheduled Date** — pick from the date picker (`"Select scheduled date"`).
   - **Location** — search and select from `"Select service location"` dropdown; the
     field is pre-populated when a linked SR supplies a location.

5. In the **"Estimate Details"** card (right column), complete:
   - **Valid Until** (required) — select expiry date from `"Select expiry date"` date
     picker. Past dates are disabled.
   - **Priority** — optionally select: `Low`, `Medium`, `High`, or `Urgent`.
   - **Estimate Date** is read-only (today's date, auto-set).

6. Add at least one line item (see **WF-EST-line-item-crud**).
   The "Line Items" card border turns red and shows a **Required** tag until at least
   one item is added.

7. Optionally fill in:
   - **Notes** card — free text printed on the PDF.
   - **Terms & Conditions** card — free text; click **"Use Default Terms"** to insert
     the standard five-clause template.

8. Choose a save action (top-right button group):
   - **"Cancel"** — navigates back to `/estimates` without saving.
   - **"Save Draft"** (`SaveOutlined` icon) — saves the estimate in `draft` status and
     navigates back to `/estimates`.
   - **"Save & Send for Review"** (`SendOutlined` icon) — saves the estimate, persists
     all new line items, transitions status `draft → sent`, then navigates to `/estimates`.

   If no line items have been added when either save button is clicked, an error toast
   fires: `"Please add at least one line item before saving."` and the save is aborted.

---

## Result

- **Save Draft**: estimate is created with status `Draft` and appears in the **Drafts**
  tab of the list page.
- **Save & Send for Review**: estimate is created and immediately sent for review;
  status becomes `Sent` and the record appears on the **All Estimates** tab.
