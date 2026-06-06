# WF-PB-create-pricebook-item.md — Create a Pricebook Item

## Overview
This workflow covers creating a new pricebook entry from the Pricebook module.

## Prerequisites
- User must have the `pricebook:create` permission. The **Add Pricebook Item** button in the page header is wrapped in `PermissionGuard permission="pricebook:create"`. It is hidden if the user lacks this permission.
- At least one service must exist in the Services Catalog for the Service dropdown to have options.

---

## Steps

1. In the sidebar, click **Pricebook** (the page title on the list page is "Pricebook").
2. The Pricebook list page loads with subtitle "Manage tiered pricing for services (Good/Better/Best)".
3. In the page header, click **Add Pricebook Item** (primary button with PlusOutlined icon).
   - This button is wrapped in `PermissionGuard permission="pricebook:create"`.
4. The browser navigates to `/pricebook/new`.
5. The page title **Create Pricebook Item** is shown.
6. In the **Service** field (required), click the dropdown — a searchable select appears showing service names from the Services Catalog. Type to filter. Select the desired service.
7. In the **Name** field (required), enter a name for this pricebook item (placeholder: `e.g. Premium HVAC Service`).
8. In the **Tier** field (required, defaults to `good`), select one of:
   - `Good`
   - `Better`
   - `Best`
9. In the **Price** field (required), enter a numeric price. The field accepts decimals with step `0.01`, minimum `0`, and displays a `$` prefix.
10. In the **Description** field (optional), enter a description of this pricebook item (placeholder: `Describe this pricebook item`).
11. In the **Active** field, toggle the switch:
    - Defaults to **Active** (`is_active: true`).
    - Toggle to **Inactive** to create the item in an inactive state.
12. Click **Create** (primary button, `htmlType="submit"`).
    - While the mutation is pending, the button shows a loading spinner.
    - On success, navigates to `/pricebook`.
    - On error, the error is handled by the mutation hook.
13. To abandon without saving, click **Cancel** — navigates to `/pricebook`.

---

## Validation Rules (client-side)
| Field | Rule |
|-------|------|
| Service | Required — "Please select a service" |
| Name | Required — "Please enter a name" |
| Tier | Required — "Please select a tier" |
| Price | Required — "Please enter the price" |
| Description | Optional |
| Active | Optional (defaults to Active/true) |
