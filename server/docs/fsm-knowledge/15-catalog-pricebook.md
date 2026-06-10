# Services Catalog, Parts Catalog, and Pricebook

These three modules define what you sell, what parts you use, and at what price — so adding line items to estimates and invoices is fast and consistent.

---

## Services Catalog

### What is the Services Catalog?
The Services Catalog is a library of the services your company offers. Each service has a default price, duration, tax rate, and category. When adding line items to estimates, work orders, or invoices, you pick items from this catalog to avoid retyping descriptions and prices every time.

### Accessing the Services Catalog
Go to **Catalog → Services** in the sidebar.

### What a Service Record Contains

| Field | Description |
|-------|-------------|
| **Service Name** | The name as it appears on estimates and invoices (e.g., "HVAC Annual Service") |
| **Description** | Detailed description of what the service includes |
| **Default Price** | The standard price charged for this service |
| **Tax Rate** | Default tax percentage applied when this service is added to an invoice |
| **Duration (minutes)** | How long the service typically takes (used by AI scheduling) |
| **Category** | Grouping for filtering (e.g., "Maintenance", "Installation", "Repair") |

### Adding a Service to the Catalog
1. Go to **Catalog → Services**.
2. Click **+ Add Service**.
3. Fill in the **Service Name**, **Description**, **Default Price**, **Tax Rate**, **Duration**, and **Category**.
4. Click **Save**.

### Editing a Service
1. Find the service in the catalog list.
2. Click the **Edit** icon (pencil).
3. Make changes and click **Save**.

Changes to a service in the catalog do NOT retroactively update existing estimates or invoices.

### Deleting a Service
1. Find the service.
2. Click the **Delete** icon (trash).
3. Confirm. The service is removed from the catalog but historical records are preserved.

---

## Parts Catalog

### What is the Parts Catalog?
The Parts Catalog is an inventory of all physical parts and materials you stock and use during jobs. It tracks stock quantities, reorder levels, and supplier information.

### Accessing the Parts Catalog
Go to **Catalog → Parts** in the sidebar.

### What a Part Record Contains

| Field | Description |
|-------|-------------|
| **Part Name** | Descriptive name (e.g., "HEPA Filter 10-inch") |
| **SKU** | Stock Keeping Unit — your internal part code |
| **Unit Price** | Selling price charged to customers |
| **Stock Quantity** | How many are currently in stock |
| **Reorder Level** | When stock falls to this number, a reorder alert is triggered |
| **Supplier** | Who supplies this part |
| **Category** | Grouping (e.g., "Filters", "Belts", "Electrical Components") |

### Adding a Part to the Catalog
1. Go to **Catalog → Parts**.
2. Click **+ Add Part**.
3. Fill in the **Part Name**, **SKU**, **Unit Price**, **Stock Quantity**, **Reorder Level**, **Supplier**, and **Category**.
4. Click **Save**.

### When Is a Low Stock Alert Triggered?
When a part's **Stock Quantity** falls at or below the **Reorder Level**, the platform highlights it in the catalog list and the dashboard shows a low-stock warning.

### Adjusting Stock Quantity
Currently, stock quantity is updated manually by editing the part record. Automatic stock deduction when a part is added to a work order line item may be configured depending on your settings.

---

## Pricebook

### What is the Pricebook?
The Pricebook lets you offer tiered pricing packages for your services — for example, Good / Better / Best pricing tiers. Each tier has its own description and price, linked to a service from the Services Catalog.

**Example:**
- **HVAC Maintenance — Good** ($89): Basic annual filter change
- **HVAC Maintenance — Better** ($149): Filter change + coil cleaning + system check
- **HVAC Maintenance — Best** ($249): Full service + priority response + 12-month warranty

### Accessing the Pricebook
Open the **Pricebook** page. *(Note: Pricebook is not currently shown in the main sidebar menu — open it via a direct link or ask your administrator to enable it. The Services Catalog and Parts Catalog are in the sidebar under Catalog, but Pricebook is not.)*

### What a Pricebook Item Contains

| Field | Description |
|-------|-------------|
| **Name** | Name of this pricing tier (e.g., "HVAC Full Service — Premium") |
| **Service** | The underlying service from the Services Catalog |
| **Tier** | Good, Better, or Best |
| **Price** | The price for this specific tier |
| **Description** | What this tier includes (shown on estimates) |
| **Active** | Toggle to show/hide this tier from the estimate builder |

### Adding a Pricebook Item
1. Open the **Pricebook** page. *(Note: Pricebook is not currently in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. Click **+ New Pricebook Item**.
3. Select the **Service** from the catalog.
4. Select the **Tier** (Good, Better, or Best).
5. Enter the **Price** and **Description** for this tier.
6. Set **Active** to on.
7. Click **Save**.

### Editing a Pricebook Item
1. Find the item in the pricebook list.
2. Click the **Edit** icon.
3. Make changes and click **Save**.

### Deleting a Pricebook Item
1. Find the item.
2. Click the **Delete** icon.
3. Confirm. Historical estimates that used this item are unaffected.

### Using Pricebook Items in Estimates
When creating an estimate and adding a line item, you can choose from the pricebook tiers. The customer sees the tier names and descriptions, making it easy to present Good/Better/Best options side by side.

### Filtering and Searching the Pricebook
- Use the search bar to find items by name or service.
- Filter by **Tier** (Good/Better/Best) or **Active** status.
