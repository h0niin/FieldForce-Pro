# WF-BP-create-blueprint — Create a New Blueprint (Custom Workflow)

## Prerequisites
- User must have the `blueprints:create` permission (Admin or custom role).

## Steps

1. Open the **Blueprints** page. *(Note: Blueprints is not currently shown in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. Click **+ New Blueprint** (top-right).
3. Enter a **Blueprint Name** (e.g., "Commercial HVAC Workflow").
4. Select the **Module** this blueprint applies to:
   - **Work Order** — for custom work order status flows
   - **Estimate** — for custom estimate status flows
   - **Invoice** — for custom invoice status flows
5. Click **Create**. You are taken to the Blueprint Editor (visual canvas).
6. **Add States** (the steps/statuses in your workflow):
   - Click **+ Add State**
   - Enter the **State Name**
   - Choose a **Color** for the status badge
   - Toggle **Is Initial** for the starting state (only one per blueprint)
   - Toggle **Is Final** for terminal states (e.g., Closed, Cancelled)
   - Click **Save State**
   - Repeat for all states
7. **Add Transitions** (the connections between states):
   - Click **+ Add Transition** or drag a connector arrow from one state to another
   - Select **From State** and **To State**
   - Enter a **Transition Name** (becomes the button label, e.g., "Approve", "Complete")
   - Select **Allowed Roles** (which roles can trigger this transition)
   - Add **Required Fields** if applicable (fields that must be filled before transition is allowed)
   - Optionally add a **Webhook URL** to fire when this transition occurs
   - Click **Save Transition**
   - Repeat for all transitions
8. Once all states and transitions are configured, click **Activate Blueprint** (top-right).
9. Confirm. The blueprint is now live for new records in that module.

## Result
A custom workflow is active. New records in the selected module will follow this workflow instead of the default status flow.

## Important Notes
- Only one blueprint can be active per module at a time. Activating a new one deactivates the previous one.
- Existing records remain in their current status; the new blueprint applies to newly created records.
