# Service Agreements and SLA Policies

---

## Service Agreements

### What is a Service Agreement?
A service agreement (also called a contract or maintenance contract) is a formal commitment between your company and a customer defining the scope, frequency, and terms of ongoing service. It is different from a one-off work order — it represents a longer-term relationship.

Common types:
- **Maintenance Agreement** — regular preventive maintenance visits (monthly, quarterly, annually)
- **Warranty Agreement** — covers parts and labour for a specific period
- **SLA Agreement** — defines response time and resolution time guarantees

### Accessing Service Agreements
Open the **Service Agreements** page. *(Note: Service Agreements / Agreements is not currently shown in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*

### What a Service Agreement Contains

| Field | Description |
|-------|-------------|
| **Agreement Name** | Descriptive title (e.g., "Annual HVAC Maintenance Contract") |
| **Type** | Maintenance, Warranty, or SLA |
| **Customer / Contact** | Who the agreement is with |
| **Start Date** | When the agreement begins |
| **End Date** | When the agreement expires |
| **Recurrence** | How often service visits occur (monthly, quarterly, etc.) |
| **SLA Response Hours** | Maximum hours before first response (for SLA type) |
| **SLA Resolution Hours** | Maximum hours before the issue is resolved (for SLA type) |
| **Value** | Total contract value |
| **Status** | Active, Draft, Expired, Cancelled |

### Creating a Service Agreement
1. Open the **Service Agreements** page. *(Note: Agreements is not currently in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. Click **+ New Agreement**.
3. Fill in the **Agreement Name**, **Type**, and **Customer**.
4. Set the **Start Date**, **End Date**, and **Recurrence**.
5. For SLA types, enter **Response Hours** and **Resolution Hours**.
6. Enter the **Contract Value**.
7. Click **Save**.

### SLA Compliance Dashboard
Go to **Agreements → SLA Compliance** to see:
- Which work orders are within SLA
- Which work orders are at risk of breaching SLA
- Which work orders have already breached SLA
- Response time averages per technician and territory

---

## SLA Policies

### What is an SLA Policy?
An SLA (Service Level Agreement) policy defines response and resolution time targets based on job priority. For example:
- **Urgent** jobs: First response within 1 hour, resolved within 4 hours
- **High** jobs: First response within 4 hours, resolved within 8 hours
- **Medium** jobs: First response within 8 hours, resolved within 24 hours
- **Low** jobs: First response within 24 hours, resolved within 72 hours

SLA policies are applied automatically to work orders based on their priority.

### Accessing SLA Policies
Go to **Settings → SLA Policies**.

### Creating an SLA Policy
1. Go to **Settings → SLA Policies**.
2. Click **+ New Policy**.
3. Fill in:
   - **Policy Name** (e.g., "Standard SLA" or "Premium Support SLA")
   - **Priority** — which job priority this policy applies to
   - **First Response Time** — hours allowed before first contact with customer
   - **Resolution Time** — total hours allowed to fully resolve the issue
   - **Business Hours Only** — toggle ON to only count working hours (not nights/weekends) against the SLA clock
4. Click **Save**.

### How SLA Works on a Work Order
- When a work order is created with a specific priority, the matching SLA policy is applied.
- The SLA clock starts from when the work order is created.
- The work order list shows an **SLA indicator**:
  - **Green** — within SLA
  - **Orange** — approaching SLA breach (less than 25% time remaining)
  - **Red** — SLA breached
- Managers and admins can see SLA status in the work order list and the SLA Compliance Dashboard.

### What Stops the SLA Clock?
- When the work order status changes to `On Hold` (e.g., waiting for parts), the SLA clock pauses — but only if your SLA Policy is configured to pause on hold.
- When the work order is resolved (status = `Completed`), the SLA clock stops.

### Setting Up SLA Alerts
Go to **Settings → Workflow Rules** to create an automated rule:
- **Trigger**: Work order SLA is about to breach (e.g., 2 hours before)
- **Action**: Send an email notification to the dispatcher or manager

---

## Agreement SLA vs. Policy SLA

| | SLA Policy | Service Agreement SLA |
|--|------------|----------------------|
| **What it is** | Company-wide rule based on job priority | Customer-specific contract terms |
| **Where set** | Settings → SLA Policies | Agreements module |
| **Applies to** | All work orders of a given priority | Work orders for a specific customer |
| **Overrides?** | Agreement SLA takes precedence if one exists for the customer | — |
