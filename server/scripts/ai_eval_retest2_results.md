# AI Chatbot Evaluation Results

Corpus: 1002 chunks. Model: gemini-2.0-flash.


---

## Q1 [control] (EXPERT(logged-in))
**Q:** How do I create a work order?

**A:** To create a new work order, follow these steps:

1. Click **Work Orders** in the left sidebar.
2. On the Work Orders list page, click the blue **`Create Work Order`** button, which has a **+** icon, located in the top-right corner of the page.
3. You will arrive at the Create Work Order form.
4. Fill in the **`Summary`** field, which is required. You can also optionally fill in other details like:
 * **`Description`**
 * **`Customer (Contact)`**
 * **`Service Location`**
 * **`Asset`**
 * **`Priority`** (e.g., Low, Medium, High, Urgent)
 * **`Category`** (e.g., HVAC, Plumbing)
 * **`Scheduled Date`**
5. Click the blue **`Create`** button at the bottom-right of the form.

You will then be redirected to the detail page for your newly created work order.


---

## Q2 [blueprint] (EXPERT(logged-in))
**Q:** What is a blueprint?

**A:** A Blueprint is a visual workflow designer that lets you create custom status flows for your work orders, estimates, and invoices. Instead of using the default statuses in the platform, you can design your own sequence of steps tailored to your company's specific processes.

For example, you could create a workflow for work orders that includes steps like "Quote Requested," "Parts Ordered," "Work Scheduled," and "Inspection."

Blueprints allow you to:
* Define each step (called a "State") in your workflow.
* Set up rules for how records move from one state to another (called "Transitions").
* Restrict which user roles can trigger specific transitions.
* Require certain fields to be filled out before a transition can occur.


---

## Q3 [blueprint] (EXPERT(logged-in))
**Q:** How do I create a new blueprint workflow?

**A:** To create a new blueprint workflow, you'll need to have the `blueprints:create` permission. This permission is typically held by users with an Admin role or a custom role specifically configured for it.

Here are the steps to create a new blueprint:

1. **Open the Blueprints Page:** The Blueprints page is where you manage all your custom workflows. Please note that Blueprints is not currently shown in the main sidebar menu, so you might need a direct link or to ask your administrator to enable it.
2. **Start a New Blueprint:** On the Blueprints page, click the **+ New Blueprint** button, usually found in the top-right corner.
3. **Name Your Blueprint:** Enter a clear **Blueprint Name** (for example, "Commercial HVAC Workflow").
4. **Select the Module:** Choose which type of record this blueprint will apply to. You can select:
 * **Work Order** — for custom work order status flows.
 * **Estimate** — for custom estimate status flows.
 * **Invoice** — for custom invoice status flows.
5. **Create the Blueprint:** Click **Create**. This will take you to the Blueprint Editor, which is a visual canvas.
6. **Add States (Workflow Steps):**
 * Click **+ Add State** on the canvas.
 * Enter a **State Name** (e.g., "Parts Ordered").
 * Choose a **Color** for the status badge that will appear in the UI.
 * Toggle **Is Initial** to mark the starting point of your workflow. Remember, there can only be one initial state per blueprint.
 * Toggle **Is Final** for any terminal states, such as "Closed" or "Cancelled." No further transitions are allowed from final states.
 * Click **Save State**.
 * Repeat these steps until all necessary states for your workflow are added.
7. **Add Transitions (Connections Between States):**
 * Click **+ Add Transition** or drag a connector arrow directly from one state to another on the canvas.
 * Select the **From State** (the current status) and the **To State** (the next status).
 * Enter a **Transition Name**. This name will become the label on the action button users click to move a record to the next state (e.g., "Approve," "Complete").
 * Select the **Allowed Roles** – these are the user roles that will be able to trigger this specific transition.
 * If applicable, add **Required Fields**. Users must fill in these fields before they can trigger the transition.
 * Optionally, you can add a **Webhook URL** if you want an external system to be notified when this transition occurs.
 * Click **Save Transition**.
 * Repeat these steps to define all the pathways between your states.
8. **Activate Your Blueprint:** Once you have finished designing all your states and transitions, click **Activate Blueprint** in the top-right corner.
9. **Confirm Activation:** Confirm your choice.

Your custom workflow is now active! New records created in the module you selected will follow this custom status flow instead of the default one. Keep in mind that only one blueprint can be active per module at a time, and activating a new one will deactivate any previous blueprint for that module. Also, this new blueprint will only apply to newly created records; existing records will remain in their current status.


---

## Q4 [pricebook] (EXPERT(logged-in))
**Q:** What is a pricebook?

**A:** The Pricebook in our FSM software allows you to create and manage different pricing packages for your services, often referred to as tiered pricing (Good, Better, or Best).

For example, you could set up:
* **HVAC Maintenance — Good** for a basic filter change at $89.
* **HVAC Maintenance — Better** for a filter change plus coil cleaning and system check at $149.
* **HVAC Maintenance — Best** for a full service including priority response and a 12-month warranty at $249.

Each Pricebook item links to an existing service from your Services Catalog and has its own name, price, and description. This helps you present clear options to customers when creating estimates.

To access the Pricebook, you'll need to open the Pricebook page directly or ask your administrator to enable it, as it is not currently shown in the main sidebar menu.


---

## Q5 [pricebook] (EXPERT(logged-in))
**Q:** How do I add a new pricebook item?

**A:** To add a new pricebook item, you'll need the `pricebook:create` permission, and at least one service must already exist in your Services Catalog.

Here are the steps:

1. Open the **Pricebook** page. (Please note that the Pricebook is not currently in the main sidebar menu, so you might need a direct link, or you can ask your administrator to enable it.)
2. Once on the Pricebook page, click the **Add Pricebook Item** button, which you'll find in the page header.
3. On the "Create Pricebook Item" page, fill in the following details:
 * **Service**: Click the dropdown and select the service you want this pricebook item to be linked to. You can type to search.
 * **Name**: Enter a descriptive name for this pricebook item (e.g., "Premium HVAC Service").
 * **Tier**: Choose one of the pricing tiers: `Good`, `Better`, or `Best`. The default is `Good`.
 * **Price**: Enter the numeric price. It accepts decimals and has a `$` prefix.
 * **Description** (Optional): Add a description explaining what this pricebook item includes.
 * **Active**: The item defaults to `Active`. If you want to create it in an inactive state, toggle the switch.
4. Finally, click the **Create** button to save your new pricebook item.

If you decide not to save, you can click **Cancel** to return to the Pricebook list page.


---

## Q6 [agreement] (EXPERT(logged-in))
**Q:** How do I create a service agreement?

**A:** To create a service agreement, you'll need to follow these steps:

**Prerequisites:**

* Your user role must have the permission to create service agreements. If you don't have this, the "Add Agreement" button will not be visible.
* At least one contact must already exist in the system, as you'll need to select a contact for the agreement.

**Steps:**

1. Open the **Service Agreements** page. (Please note that Service Agreements is not currently shown in the main sidebar menu, so you might need a direct link or ask your administrator to enable it.)
2. Click the **Add Agreement** button, which is typically found in the top-right corner.
3. On the "Create Agreement" page, fill in the following required fields:
 * **Agreement Name:** Enter a descriptive name for the agreement.
 * **Type:** Select the type from the dropdown (e.g., Maintenance, Warranty, Support, Subscription, Custom).
 * **Contact:** Select the relevant contact from the searchable dropdown.
 * **Start Date:** Choose the agreement's start date.
 * **End Date:** Choose the agreement's end date.
 * **Value ($):** Enter the total monetary value of the agreement.
4. You can also fill in these optional fields:
 * **SLA Response Hours:** Enter the maximum response time in hours.
 * **SLA Resolution Hours:** Enter the maximum resolution time in hours.
 * **Description:** Add any detailed notes or terms for the agreement.
5. Click the **Create** button at the bottom of the page to save your new service agreement.

If you need to cancel at any point, click the **Cancel** button, and you will be redirected back to the Service Agreements list without saving.
