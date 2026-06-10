# WF-PB-edit-pricebook-item.md — Edit a Pricebook Item

## Overview
This workflow covers editing an existing pricebook item, including updating its fields via the form and toggling its active status directly from the list. Both are distinct user actions.

## Prerequisites
- User must have the `pricebook:update` permission. The Edit (EditOutlined) icon button on the list is wrapped in `PermissionGuard permission="pricebook:update"`. It is hidden if the user lacks this permission.
- The pricebook item must exist and be retrievable by `id`. While loading, the page shows the title "Loading..." with a skeleton card.
- Note: The inline Active/Inactive Switch in the list table calls `updatePricebookItem` directly and does NOT require navigating to the edit form. It is not gated by a PermissionGuard in the table render — the toggle calls the update mutation for any authenticated user who can see the list.

---

## Action A — Edit via Form (full edit)

### Steps — From Pricebook List

1. Open the **Pricebook** page (its list page title is "Pricebook"). *(Note: Pricebook is not currently shown in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. The Pricebook list page loads.
3. Locate the desired pricebook item row in the table.
4. In the **Actions** column, click the icon-only button with tooltip **Edit** (EditOutlined icon).
   - This button is wrapped in `PermissionGuard permission="pricebook:update"`. It is hidden if the user lacks `pricebook:update`.
5. The browser navigates to `/pricebook/{id}/edit`.
6. The page title **Edit Pricebook Item** is shown.
7. The form pre-populates with existing values:
   - **Service** — pre-selected service from `pricebookItem.service_id`
   - **Name** — pre-filled from `pricebookItem.name`
   - **Tier** — pre-selected from `pricebookItem.tier`
   - **Price** — pre-filled from `pricebookItem.price`
   - **Description** — pre-filled from `pricebookItem.description`
   - **Active** — switch state from `pricebookItem.is_active`
8. Modify any of the following fields:
   - **Service** (required) — searchable select showing service names from Services Catalog
   - **Name** (required) — free text (placeholder: `e.g. Premium HVAC Service`)
   - **Tier** (required) — select one of: `Good`, `Better`, `Best`
   - **Price** (required) — numeric, min 0, step 0.01, precision 2, prefix `$`
   - **Description** — textarea (placeholder: `Describe this pricebook item`)
   - **Active** — toggle switch (`checkedChildren="Active"` / `unCheckedChildren="Inactive"`)
9. Click **Update** (primary button, `htmlType="submit"`).
   - While the mutation is pending the button shows a loading spinner.
   - On success, navigates to `/pricebook`.
   - On error, the error is handled by the mutation hook.
10. To abandon without saving, click **Cancel** — navigates to `/pricebook`.

---

## Action B — Toggle Active/Inactive from List (inline status toggle)

### Steps

1. Open the **Pricebook** page. *(Note: Pricebook is not currently in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. The Pricebook list page loads.
3. Locate the desired pricebook item row in the table.
4. In the **Status** column, locate the Switch control showing either "Active" or "Inactive".
5. Click the Switch to toggle the active state:
   - Toggling from "Active" to "Inactive" sends `updatePricebookItem.mutateAsync({ id: record.id, is_active: false })`.
   - Toggling from "Inactive" to "Active" sends `updatePricebookItem.mutateAsync({ id: record.id, is_active: true })`.
6. The switch updates immediately (optimistically or after the mutation resolves per hook implementation). The user remains on the Pricebook list page.

---

## Validation Rules (client-side — Edit Form)
| Field | Rule |
|-------|------|
| Service | Required — "Please select a service" |
| Name | Required — "Please enter a name" |
| Tier | Required — "Please select a tier" |
| Price | Required — "Please enter the price" |
| Description | Optional |
| Active | Optional |
