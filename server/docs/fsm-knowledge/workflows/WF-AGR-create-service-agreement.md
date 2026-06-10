# WF-AGR-create-service-agreement — Create a Service Agreement

**Module:** Service Agreements
**Route:** `/agreements/new`
**Form page:** `AgreementFormPage.tsx` (create mode, `isEdit = false`)

---

## Prerequisites

- The authenticated user's role must carry the permission `service-agreements:create`.
  - If absent, the **Add Agreement** button is hidden by `PermissionGuard` on the list page.
- At least one Contact must exist (the Contact select is required and populated from `useAllContacts`).

---

## Steps

1. Open the **Service Agreements** page (title **"Service Agreements"**, subtitle **"Manage service agreements and contracts"**). *(Note: Service Agreements is not currently shown in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. Click the **Add Agreement** button (top-right, primary, `PlusOutlined` icon). This navigates to `/agreements/new`.
3. The page header now reads **"Create Agreement"**. The back arrow (`onBack`) navigates to `/agreements` when clicked.
4. **Agreement Name** field (required):
   - Click the text input with placeholder **"Annual Maintenance Agreement"**.
   - Enter the agreement name.
   - Validation message if skipped: **"Please enter agreement name"**.
5. **Type** field (required, displayed left half of a side-by-side row):
   - Click the **"Select type"** dropdown.
   - Available options: **Maintenance**, **Warranty**, **Support**, **Subscription**, **Custom**.
   - Validation message if skipped: **"Please select type"**.
6. **Contact** field (required, displayed right half of same row):
   - Click the **"Select contact"** dropdown.
   - Type to search (the select has `showSearch` with `optionFilterProp="label"`).
   - Each option is rendered as `"{first_name} {last_name}"` or `"{first_name} {last_name} ({email})"` when an email is present.
   - Select the desired contact.
   - Validation message if skipped: **"Please select contact"**.
7. **Start Date** field (required, displayed left half of a side-by-side row):
   - Click the `DatePicker` and choose a date.
   - Validation message if skipped: **"Please select start date"**.
8. **End Date** field (required, displayed right half of same row):
   - Click the `DatePicker` and choose a date.
   - Validation message if skipped: **"Please select end date"**.
9. **Value ($)** field (required):
   - Click the `InputNumber` with prefix **"$"** and placeholder **"5000.00"** (min 0, step 0.01, width 300 px).
   - Enter the monetary value.
   - Validation message if skipped: **"Please enter value"**.
10. **SLA Response Hours** field (optional, left half of side-by-side row):
    - Click the `InputNumber` with placeholder **"4"** (min 0, step 1).
    - Enter the maximum response time in hours.
11. **SLA Resolution Hours** field (optional, right half of same row):
    - Click the `InputNumber` with placeholder **"24"** (min 0, step 1).
    - Enter the maximum resolution time in hours.
12. **Description** field (optional):
    - Click the `TextArea` with placeholder **"Agreement details and terms"** (4 rows).
    - Enter any free-text description or terms.
13. Click **Create** (primary button, `htmlType="submit"`). The button displays a loading spinner (`createAgreement.isPending`) while the API call is in flight.
    - On success: navigates automatically to `/agreements`.
    - On error: the mutation hook surfaces the error (no inline UI handling in this component).
14. To abandon the form, click **Cancel** (secondary button). This navigates immediately to `/agreements` without an API call.

---

## Field Summary

| Label | Control | Required | Notes |
|---|---|---|---|
| Agreement Name | Input | Yes | Free text |
| Type | Select | Yes | Maintenance / Warranty / Support / Subscription / Custom |
| Contact | Select (searchable) | Yes | Populated from all contacts |
| Start Date | DatePicker | Yes | Formatted YYYY-MM-DD on submit |
| End Date | DatePicker | Yes | Formatted YYYY-MM-DD on submit |
| Value ($) | InputNumber | Yes | Min 0, step 0.01 |
| SLA Response Hours | InputNumber | No | Min 0, step 1 |
| SLA Resolution Hours | InputNumber | No | Min 0, step 1 |
| Description | TextArea | No | 4 rows |
