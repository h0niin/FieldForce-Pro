# WF-ASSET-create-asset

## Action: Create a new asset

### Prerequisites:
- User must have the permission `assets:create`. If this permission is absent the "Add Asset" button is not rendered on the list page.

### Steps:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. The page header "Manage customer assets and equipment" is displayed with an "Add Asset" button (rendered only when the user holds `assets:create` permission).
3. Click **Add Asset**.
4. The route navigates to `/assets/new`, rendering the "Create Asset" page header with a back arrow.
5. A single `<Card>` form is displayed with the following fields (all optional unless noted):

   | Field label | Input type | Required | Notes |
   |---|---|---|---|
   | Asset Name | Text input | Yes | Validation message: "Please enter asset name". Placeholder: "HVAC Unit - Carrier 24ACC636A003" |
   | Manufacturer | Text input | No | Placeholder: "Carrier" |
   | Model | Text input | No | Placeholder: "24ACC636A003" |
   | Serial Number | Text input | No | Placeholder: "SN-2024-001234" |
   | Category | Select dropdown | No | Options: HVAC, Plumbing, Electrical, Appliance, Security, Fire Safety, Elevator, Generator, Other. Has "allowClear". Placeholder: "Select category" |
   | Install Date | DatePicker | No | |
   | Warranty Expiry | DatePicker | No | |
   | Health Score (0-100) | InputNumber | No | Min 0, Max 100, Step 0.1. Placeholder: "85.5". Width 200px |
   | Customer (Contact) | Select dropdown (searchable) | No | Populated from all contacts. Each option shows "First Last (email)" format. Has "allowClear" and "showSearch". Placeholder: "Select customer" |
   | Notes | TextArea (4 rows) | No | Placeholder: "Additional notes about this asset" |

6. Fill in the required "Asset Name" field and any optional fields.
7. To link the asset to a customer contact, open the "Customer (Contact)" dropdown, type to search, and select a contact.
8. Click **Create** (primary button, `htmlType="submit"`). The button shows a loading spinner while the mutation is pending.
   - On success, the user is navigated to `/assets` (the asset list page).
   - On error, the error is handled by the mutation hook (toast/notification shown externally).
9. To abort without saving, click **Cancel**. The user is navigated to `/assets`.
