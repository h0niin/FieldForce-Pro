# WF-SET-save-general-settings

## Module
Settings > General Settings

## Route
`/settings`

## Sidebar Navigation
Sidebar section "System & Analytics" > submenu item "Settings" > child item "settings.general"

---

## Prerequisites

- User must be authenticated (PrivateRoute).
- User must hold the `settings:read` permission (controls visibility of the Settings submenu in the sidebar).
- The logged-in user must have a non-empty `tenant_id` stored in the auth store; the page loads the tenant record via `useTenant(user.tenant_id)`. If `tenant_id` is absent, no data loads and the form remains blank.
- While the tenant record is fetching, a full-page `Spin` (size "large") is rendered; no form is accessible during this state.

---

## Steps: Save General Settings

1. In the sidebar under the section **System & Analytics**, click **Settings** to expand the submenu.
2. Click the child item that resolves to the translated key `settings.general` (visible label depends on i18n locale; the route is `/settings`).
3. The page **General Settings** (page header title: `settings.general` i18n key) loads with a `Card` (max-width 600 px) containing a vertical `Form`.
4. The form auto-populates three fields from the current tenant record:
   - **Company Name** (required text input; validation error: "Name is required")
   - **Custom Domain** (optional text input; placeholder: `app.yourcompany.com`)
   - **Active** (Switch toggle; on = tenant is active)
5. Edit any combination of the three fields.
   - To rename the organisation, clear the **Company Name** field and type the new name.
   - To set or change the custom domain, type in the **Custom Domain** field (e.g. `app.yourcompany.com`). Leave blank to remove.
   - To toggle the tenant's active state, click the **Active** Switch.
6. Click the **Save** button (`htmlType="submit"`; shows a loading spinner while the mutation is pending).
7. On success the mutation (`useUpdateTenant`) resolves and the form retains the saved values (the `useEffect` re-sync fires when the query cache updates).
8. On validation failure (empty Company Name) the form displays the inline error "Name is required" below the field and does not submit.

---

## Actions Summary

| Action | Trigger | Effect |
|---|---|---|
| Load tenant data | Page mount (useTenant hook) | Populates Company Name, Custom Domain, Active |
| Toggle Active switch | onClick Switch | Updates local form state |
| Submit form | Click "Save" button | Calls updateMutation.mutate with tenant id + form values |
