# WF-REV-create-review — Create a Customer Review

**Module:** Reviews & Feedback
**Route:** `/reviews/new`
**Form page:** `ReviewFormPage.tsx` (create mode, `isEdit = false`)

---

## Prerequisites

- The authenticated user's role must carry the permission `reviews:create`.
  - If this permission is absent the "Add Review" button is hidden by `PermissionGuard` on the list page and the route must be reached directly; the form itself has no secondary guard and will submit regardless.
- At least one Work Order must exist (the Work Order select is required and populated from `useAllWorkOrders`).
- At least one Contact must exist (the Customer select is required and populated from `useAllContacts`).

---

## Steps

1. Click **Reviews & Feedback** in the sidebar to open the list page (`/reviews`).
2. Confirm the page header reads **"Reviews & Feedback"** and the subtitle reads **"Customer reviews and satisfaction ratings"**.
3. Click the **Add Review** button (top-right, primary, `PlusOutlined` icon). This navigates to `/reviews/new`.
4. The page header now reads **"Create Review"**. The back arrow (rendered by `PageHeader`'s `onBack`) is visible and navigates back to `/reviews` when clicked.
5. **Work Order** field (required):
   - Click the **"Select work order"** dropdown.
   - Type to search (the select has `showSearch` with `optionFilterProp="label"`).
   - Each option is rendered as `"{wo_number || 'WO'} - {summary}"`.
   - Select the desired work order. Validation message if skipped: **"Please select a work order"**.
6. **Customer (Contact)** field (required):
   - Click the **"Select customer"** dropdown.
   - Type to search (same `showSearch` behaviour).
   - Each option is rendered as `"{first_name} {last_name}"` or `"{first_name} {last_name} ({email})"` when an email is present.
   - Select the desired contact. Validation message if skipped: **"Please select a contact"**.
7. **Rating** field (required):
   - Click a star on the `Rate` component (half-stars are allowed via `allowHalf`).
   - Validation message if skipped: **"Please provide a rating"**.
8. **Comment** field (required):
   - Click the `TextArea` with placeholder **"Write your review here..."**.
   - Type the review comment.
   - Validation message if skipped: **"Please enter a comment"**.
9. **Platform** field (required, default value `"internal"`):
   - Click the **"Select platform"** dropdown.
   - Available options: **Internal**, **Google**, **Yelp**, **Facebook**, **Other**.
   - Validation message if skipped: **"Please select a platform"**.
10. Click **Submit Review** (primary button, `htmlType="submit"`). The button displays a loading spinner (`createReview.isPending`) while the API call is in flight.
    - On success: navigates automatically to `/reviews`.
    - On error: the mutation hook surfaces the error (no inline UI handling in this component).
11. To abandon the form, click **Cancel** (secondary button). This navigates immediately to `/reviews` without API call.

---

## Field Summary

| Label | Control | Required | Default |
|---|---|---|---|
| Work Order | Select (searchable) | Yes | — |
| Customer (Contact) | Select (searchable) | Yes | — |
| Rating | Rate (half-stars) | Yes | — |
| Comment | TextArea | Yes | — |
| Platform | Select | Yes | `internal` |
