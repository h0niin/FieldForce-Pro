# WF-REV-submit-review — Submit, Edit, and Delete a Review

**Module:** Reviews & Feedback
**Routes:** `/reviews` (list), `/reviews/:id` (detail), `/reviews/:id/edit` (edit form)
**Source files:** `ReviewListPage.tsx`, `ReviewDetailPage.tsx`, `ReviewFormPage.tsx`

---

## Prerequisites

| Action | Required permission |
|---|---|
| View review detail | `reviews:read` |
| Edit a review | `reviews:update` |
| Delete a review | `reviews:delete` |

Each action button is wrapped in `PermissionGuard`; the button is not rendered if the user lacks the listed permission.

---

## A. Navigate to the Review List

1. Click **Reviews & Feedback** in the sidebar. The page header reads **"Reviews & Feedback"** with subtitle **"Customer reviews and satisfaction ratings"**.
2. The table displays columns: **Work Order**, **Customer**, **Rating**, **Comment**, **Source**, **Published**, **Date**, **Actions**.

## B. Filter and Search Reviews

3. Type in the **"Search reviews..."** input. After a 500 ms debounce the query parameter `search` is sent to the API and the page resets to page 1.
4. (Optional) Click the **"Filter by rating"** dropdown (width 150 px) and choose one of **5 Stars**, **4 Stars**, **3 Stars**, **2 Stars**, **1 Star**. Filtering is applied client-side on top of the current page of data.
5. (Optional) Click the **"Filter by source"** dropdown (width 150 px) and choose one of **Internal**, **Google**, **Yelp**, **Facebook**. Filtering is likewise applied client-side.
6. The pagination footer shows **"Total {n} reviews"**. Use page controls or the page-size changer to navigate.

## C. View a Review (EyeOutlined icon)

7. In the **Actions** column locate the icon-only button with tooltip **"View"** (`EyeOutlined`). This button is guarded by `reviews:read`.
8. Click **View**. The browser navigates to `/reviews/{id}`.
9. The page header reads **"Review Details"** and a back arrow is present (calls `navigate('/reviews')`).
10. The **Review Information** card (bordered `Descriptions`, 2 columns) displays:
    - **Rating** — star display (read-only `Rate` with `allowHalf`) plus the numeric `(rating / 5)`.
    - **Work Order** — `work_order_id` value.
    - **Customer** — `contact_id` value.
    - **Platform** — coloured `Tag` (Internal = blue, Google = green, Yelp = red, Facebook = blue, Other = default).
    - **Submitted** — formatted timestamp (`created_at`).
    - **Comment** — full text.
    - **Created At** — formatted timestamp.
    - **Updated At** — formatted timestamp.

## D. Edit a Review

11. From the **Review Details** page header, click **Edit** (`EditOutlined` icon, standard button). This button is guarded by `reviews:update`.
12. The browser navigates to `/reviews/{id}/edit`. The page header reads **"Edit Review"**.
13. The form is pre-populated with the existing values (`work_order_id`, `contact_id`, `rating`, `comment`, `platform`) via `form.setFieldsValue` when the `review` object loads.
14. Modify any field. Validation rules are identical to the create flow (all fields remain required; see WF-REV-create-review for details).
15. Click **Update** (primary button, `htmlType="submit"`). The button shows a loading spinner (`updateReview.isPending`) while the API call is in flight.
    - On success: navigates automatically to `/reviews`.
    - On error: the mutation hook surfaces the error.
16. To abandon edits, click **Cancel**. This navigates immediately to `/reviews`.

## E. Delete a Review

17. From the **Review Details** page header, click **Delete** (danger button, `DeleteOutlined` icon). This button is guarded by `reviews:delete`.
18. A confirmation dialog appears with:
    - **Title:** `Delete Review`
    - **Content:** `Are you sure you want to delete this review?`
19. Click **OK** (danger style) to confirm. `deleteReview.mutateAsync(review.id)` is called; on completion the browser navigates to `/reviews`.
20. Click **Cancel** in the dialog to dismiss without deleting.

---

## All Distinct User Actions on the Reviews Module

| Action | Location | Trigger | Navigation outcome |
|---|---|---|---|
| Click "Add Review" | List page header | `onClick -> navigate('/reviews/new')` | `/reviews/new` |
| Click "View" (EyeOutlined) | List table Actions column | `onClick -> navigate('/reviews/{id}')` | `/reviews/{id}` |
| Submit new review form | Form page | `onFinish -> createReview.mutateAsync` | `/reviews` on success |
| Cancel form | Form page | `onClick -> navigate('/reviews')` | `/reviews` |
| Click back arrow | Form / Detail page header | `onBack -> navigate('/reviews')` | `/reviews` |
| Click "Edit" | Detail page header | `onClick -> navigate('/reviews/{id}/edit')` | `/reviews/{id}/edit` |
| Submit edit form | Form page (edit mode) | `onFinish -> updateReview.mutateAsync` | `/reviews` on success |
| Click "Delete" | Detail page header | `onClick -> showConfirmDialog` | Confirmation dialog |
| Confirm delete | Confirmation dialog | `onOk -> deleteReview.mutateAsync` | `/reviews` on success |
| Dismiss delete dialog | Confirmation dialog | click "Cancel" | Stays on detail page |
