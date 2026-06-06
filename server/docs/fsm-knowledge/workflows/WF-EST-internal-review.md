# WF-EST-internal-review — Internal Reviewer Approve or Reject an Estimate

Internal review (multi-approver workflow) is managed from the **Approve / Reject** tab
on the Estimates list page. Each card in this tab represents one estimate assigned to
the current user for internal review. The component is `EstimateInternalReviewCard`.

---

## Prerequisites

- The current user is listed as an internal approver for the estimate (their approval
  record has `status === 'PENDING'` and `approver_id === me.id`).
- The tab is named **"Approve / Reject"** (key `review`).
- Cards are only shown when at least one approval record exists for the estimate;
  otherwise the card renders nothing.

---

## Approve (Internal)

1. Click **"Estimates"** in the sidebar.
2. Click the **"Approve / Reject"** tab.
3. Locate the estimate card showing your pending approval. The card header displays the
   estimate number, status tag, total, and a progress badge `"<approved>/<total>"`.
4. If the card is collapsed, click the card header (toggles `"+ Expand"` / `"- Collapse"`).
5. Inside the card, find the approver step assigned to you. It is highlighted in blue
   (border `rgba(22, 119, 255, 0.25)`, background `rgba(22, 119, 255, 0.08)`).
6. Click **"Approve"** (`CheckCircleOutlined` icon, primary style).
7. The approval is processed immediately (no secondary confirmation dialog).
8. If this was the last pending approval, an alert appears:
   `"All approvals completed — ready to send to customer."` with a **"Send Now"** button.

---

## Reject (Internal)

1–5. Same as Approve steps 1–5.
6. Click **"Reject"** (`CloseCircleOutlined` icon, danger style).
7. The **"Reject Internal Review"** modal opens:
   - **Title**: `"Reject Internal Review"`
   - An alert: `"This will reject the internal approval and stop the approval chain."`
   - **Comments (optional)** text area: placeholder `"Reason for rejection..."`
8. Optionally type a rejection reason.
9. Click **"Confirm Rejection"** (danger style OK button) to submit.
   Click `"Cancel"` to discard.

---

## All Approvals Completed — Send Now

When the last internal approval is confirmed, the card displays a success alert:
`"All approvals completed — ready to send to customer."` with a **"Send Now"**
(`SendOutlined`) button.

Clicking **"Send Now"** opens the **"Send Estimate to Customer"** modal at the page
level (see **WF-EST-send-to-customer**).

---

## Result

- **Approve**: the approver's step badge changes from a number to `"✓"`, and the
  progress bar advances. If all approvers have approved/skipped, the estimate is
  ready to send to the customer.
- **Reject**: the approver's step badge changes to `"✗"`, the progress bar turns red,
  and an alert `"Internal review rejected"` is shown. The send workflow is blocked.
