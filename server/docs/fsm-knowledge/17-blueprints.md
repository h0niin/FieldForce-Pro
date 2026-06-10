# Blueprints — Visual Workflow Designer

## What is a Blueprint?

A Blueprint is a visual state machine that lets you define custom status workflows for work orders, estimates, and invoices. Instead of using the platform's default status flows, you can design your own steps tailored to your company's process.

**Example:** A plumbing company might want a work order to follow:
`Quote Requested → Quote Approved → Parts Ordered → Parts Received → Work Scheduled → In Progress → Inspection → Signed Off → Invoiced`

Blueprints let you build this exact flow with transitions, validation rules, and role restrictions.

---

## Accessing Blueprints

Open the **Blueprints** page. *(Note: Blueprints is not currently shown in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*

---

## Blueprint Concepts

### States
Each step in your workflow is a **State** (equivalent to a status). You define:
- **State Name** — what it's called (e.g., "Parts Ordered")
- **Color** — the badge color shown in the UI
- **Is Initial** — marks this as the starting state (only one per blueprint)
- **Is Final** — marks this as a terminal state (no further transitions allowed, e.g., "Closed")

### Transitions
A **Transition** defines when and how a record can move from one state to another. For each transition you configure:
- **From State** — the current state
- **To State** — the state to move to
- **Transition Name** — the label shown on the action button (e.g., "Approve", "Dispatch")
- **Allowed Roles** — which user roles can trigger this transition (e.g., only Admins can approve)
- **Required Fields** — fields that must be filled in before the transition is allowed (e.g., must have a technician assigned before moving to "Scheduled")
- **Webhook URL** — an external URL to notify when this transition fires
- **Guard Condition** — a logic rule that must pass before the transition is allowed

---

## Creating a Blueprint

1. Open the **Blueprints** page. *(Note: Blueprints is not currently in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. Click **+ New Blueprint**.
3. Enter a **Blueprint Name** (e.g., "Commercial HVAC Workflow").
4. Select the **Module** this blueprint applies to: Work Order, Estimate, or Invoice.
5. Click **Create**.
6. You are taken to the **Blueprint Editor** — a visual canvas.

### Adding States in the Blueprint Editor

1. Click **+ Add State** on the canvas.
2. Enter the **State Name**.
3. Choose a **Color**.
4. Toggle **Is Initial** for the starting state.
5. Toggle **Is Final** for any terminal states (Closed, Cancelled, etc.).
6. Click **Save State**.

### Adding Transitions in the Blueprint Editor

1. Click **+ Add Transition** or drag a connector between two states on the canvas.
2. Select the **From State** and **To State**.
3. Enter a **Transition Name** (this becomes the button label).
4. Select **Allowed Roles** — which roles can click this button.
5. Add any **Required Fields** that must be completed before the transition is allowed.
6. Optionally enter a **Webhook URL** to fire when this transition happens.
7. Click **Save Transition**.

### Activating a Blueprint

1. After designing all states and transitions, click **Activate Blueprint**.
2. Confirm. The blueprint is now live and applies to new records in that module.
3. Only one blueprint can be active per module at a time.

---

## Blueprint vs. Default Status Flow

| | Default Status Flow | Blueprint |
|--|--------------------|--------------------|
| **Fixed?** | Yes — defined by the platform | No — fully customisable |
| **States** | Preset (e.g., New, Scheduled, Completed) | You define any states |
| **Transitions** | Platform-controlled | You control who can do what |
| **Role restrictions** | Not configurable | Fully configurable per transition |
| **Best for** | Standard operations | Complex or industry-specific workflows |

---

## Editing a Blueprint

1. Go to **Blueprints** and click the blueprint name.
2. Click **Edit Blueprint** to open the editor.
3. Add, modify, or delete states and transitions.
4. Click **Save**. If the blueprint is active, changes take effect immediately.

**Warning:** Modifying an active blueprint may affect records already in the workflow. States that are removed but still have records in that state will show a warning.

---

## Deactivating a Blueprint

1. Open the blueprint.
2. Click **Deactivate**.
3. The system reverts to the default status flow for that module.

---

## When to Use Blueprints

Use blueprints when:
- Your workflow has more steps than the default status flow allows
- Certain transitions should only be done by specific roles (e.g., only managers can close a work order)
- You need validation rules before a status can change (e.g., must have a signature before completing)
- You want webhook notifications to fire on specific status changes
