# WF-ASSET-link-location

## Action: Link an asset to a service location

Linking is accomplished through the asset create or edit form via the hidden `location_id` field. The form pre-populates `location_id` from the existing asset record when editing.

### Prerequisites:
- To link during creation: user must have the permission `assets:create`.
- To link during edit: user must have the permission `assets:update`.

### Notes on current UI state:

The `AssetFormPage.tsx` includes `location_id` in the `form.setFieldsValue` call and in the payload sent to the server (`asset.location_id` is pre-loaded in edit mode). However, there is **no visible `<Form.Item>` for `location_id`** rendered in the JSX — the field is not exposed to the user in the form UI. The `location_id` is carried through the payload only when it already exists on the asset (edit mode preserves it unchanged).

The asset detail page (`AssetDetailPage.tsx`) displays the linked location address in the "Location" description item (`asset.location?.address`), but provides no UI action to set or change the location from the detail page.

### Current supported steps (edit — preserve existing location_id):

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. Open the asset via the "Edit" action (tooltip: "Edit", requires `assets:update` permission).
3. The form loads. If a `location_id` is already set on the asset it is silently preserved in the form state even though no location picker control is visible.
4. Modify any other fields and click **Update**.
   - The existing `location_id` is included in the update payload unchanged.

### How the linked location is displayed:

- Asset detail page, "Location" description item (span 2): `asset.location.address`. Shows a faded dash if no location is linked.

### Note for QA:

A visible location picker or Select control is absent from `AssetFormPage.tsx`. To assign or change `location_id` via the UI, a form control must be added. This is a gap between the form implementation and the asset detail display.
