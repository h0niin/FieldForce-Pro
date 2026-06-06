# Service Requests

Service requests are incoming job requests from customers, created before a work order exists. They go through a triage and approval process.

## Accessing Service Requests

Click **Service Requests** in the left sidebar.

## Tabs on the Service Requests Page

| Tab | Contents |
|-----|----------|
| **All Requests** | Every service request for your tenant |
| **My Approvals** | Requests awaiting YOUR approval |
| **New** | Unreviewed requests |
| **Triaged** | Reviewed but not yet approved |

## Creating a Service Request

1. Click **+ Add Request** (top-right).
2. Fill in:
   - **Subject** — short description of the problem
   - **Priority** — `Low`, `Medium`, `High`, or `Urgent`
   - **Customer** — link to a Contact
   - **Service Location** — where the work is needed
   - **Description** — detailed problem description (optional)
3. Click **Submit**. The request enters `New` status.

## Triaging a Service Request

Triaging means reviewing the request and deciding next steps.

1. Go to **Service Requests** → **All Requests** or **New** tab.
2. Click the request row to open the detail page.
3. Review the details.
4. Click **Triage** (or change status to `Triaged`).
5. Add a triage note to document your assessment.

## Approving a Service Request

1. Go to **Service Requests** → **My Approvals** tab.
2. Find the request in the table.
3. Click the **green checkmark ✓** icon in the Actions column, OR open the request and click the **Approve** button.
4. In the popup, add optional comments.
5. Click **Approve**. Status changes to `Approved`.

## Rejecting a Service Request

1. From the list, click the **red X** icon in the Actions column, OR open the request and click **Reject**.
2. Enter a rejection reason in the popup.
3. Click **Reject**. Status changes to `Rejected` (not a valid status — see the "Spam" path below for junk requests).

## Marking as Spam

For requests that are clearly invalid or duplicates:
1. Open the service request.
2. Click **Mark as Spam** in the action menu.
3. Status changes to `Spam` and the request is excluded from normal views.

## Converting a Service Request to a Work Order

Once a service request is `Approved`:
1. Open the service request detail page.
2. Click **Convert to Work Order** (top-right action button).
3. A new work order is automatically created, pre-filled with the service request's details.
4. The service request status changes to `Converted to WO`.
5. You are redirected to the newly created work order.

## Approve-and-Convert in One Step

1. From the **My Approvals** tab, click the **Approve & Convert** button (if visible).
2. This approves the request and immediately creates a work order in a single action.

## Linking a Service Request to an Existing Work Order

1. Open the service request.
2. Click **Link to Work Order** in the action menu.
3. Search for and select the target work order.
4. The service request is linked and its status is updated.

## Service Request Detail Page Tabs

| Tab | Contents |
|-----|----------|
| **Overview** | Status, priority, customer, service location |
| **Activity** | All status changes and comments |
| **Linked Work Order** | The converted/linked work order (if any) |
| **Estimates** | Estimates created for this request |
