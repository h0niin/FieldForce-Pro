# Assets

Assets are pieces of equipment or machinery that you maintain for your customers. Examples include HVAC units, generators, elevators, fire suppression systems, refrigeration units, and any other equipment that requires regular service or repair.

---

## Accessing Assets

Click **Assets** in the left sidebar.

---

## What Information Does an Asset Record Contain?

| Field | Description |
|-------|-------------|
| **Asset Name** | Descriptive name (e.g., "Rooftop HVAC Unit 1") |
| **Model** | Manufacturer model number |
| **Serial Number** | Unique identifier from the manufacturer |
| **Manufacturer** | Brand or maker of the equipment |
| **Install Date** | When the asset was installed |
| **Warranty Expiry** | Date the manufacturer warranty expires |
| **Health Score** | AI-calculated score (0–100) indicating asset condition |
| **Customer / Contact** | The customer who owns this asset |
| **Service Location** | Where the asset is physically located |
| **Custom Fields** | Any additional fields configured by your admin |

---

## Creating an Asset

1. Go to **Assets** in the sidebar.
2. Click **+ New Asset**.
3. Fill in the required fields:
   - **Asset Name** — required
   - **Customer / Contact** — link to the owning customer
   - **Service Location** — where the asset is installed
4. Fill in optional fields: model, serial number, manufacturer, install date, warranty expiry.
5. Click **Save**.

---

## Viewing Asset Details

Click any asset row to open the detail page. It contains:

| Tab / Section | Contents |
|---------------|----------|
| **Overview** | All asset fields, health score, linked customer and location |
| **Work Order History** | All past and current work orders for this asset |
| **Maintenance Plans** | Scheduled recurring maintenance for this asset |
| **Service History** | Timeline of all services performed |
| **Attachments** | Manuals, photos, warranty documents |
| **Notes** | Internal notes about the asset |

---

## Linking an Asset to a Work Order

When creating or editing a work order, you can select an **Asset** from the dropdown. This links the job to the specific piece of equipment and builds a service history automatically.

---

## Asset Health Score

The health score (0–100) is automatically calculated by the AI Predictive Maintenance engine based on:
- Age of the asset
- Service history and frequency of repairs
- Recent fault codes or issues logged in work orders
- Warranty status

A score of **80–100** = Good condition. A score below **50** = Attention needed. A score below **30** = Critical, consider replacement or major service.

---

## Equipment Health Dashboard

Go to **Maintenance → Equipment Health Dashboard** to see:
- A list of all assets sorted by health score
- Assets with upcoming warranty expiry
- Assets that have not been serviced recently
- Predictive alerts for assets likely to need service

---

## Maintenance Plans

A maintenance plan is a recurring schedule for servicing an asset automatically. This ensures preventive maintenance is never missed.

### Creating a Maintenance Plan for an Asset

1. Open the asset detail page.
2. Click the **Maintenance Plans** tab.
3. Click **+ Add Maintenance Plan**.
4. Fill in:
   - **Plan Name** — e.g. "Annual Filter Change"
   - **Frequency** — how often the maintenance should happen (weekly, monthly, quarterly, annually, custom)
   - **Next Due Date** — when the next service is scheduled
   - **Auto Create Work Order** — toggle ON to automatically create a work order when the maintenance is due
5. Click **Save**.

When the due date arrives and **Auto Create Work Order** is enabled, the system creates a new work order pre-linked to this asset automatically.

---

## Editing an Asset

1. Open the asset detail page.
2. Click the **Edit** button (top-right).
3. Modify the fields.
4. Click **Save**.

---

## Deleting an Asset

1. Open the asset detail page.
2. Click **Delete** in the action menu.
3. Confirm the deletion. The asset is soft-deleted (hidden from lists but data is preserved).

Note: Assets with linked work orders cannot be hard-deleted to preserve service history.

---

## Filtering and Searching Assets

- Use the **search bar** to find assets by name, serial number, or model.
- Filter by **Customer** to see all assets for a specific account.
- Filter by **Service Location** to see all equipment at a specific site.

---

## Attaching Documents to Assets

1. Open the asset detail page.
2. Go to the **Attachments** tab.
3. Click **Upload** and select a file (manuals, warranty certificates, photos, PDFs up to 25 MB).
4. Files are accessible to all team members who can view the asset.
