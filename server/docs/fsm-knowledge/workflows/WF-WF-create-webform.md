# WF-WF-create-webform — Create a Webform for Customer Submissions

## Prerequisites
- User must have the `webforms:create` permission (Admin).

## Steps

1. Click **Webforms** in the left sidebar (or navigate to **Settings → Webforms**).
2. Click **+ New Webform**.
3. Enter a **Form Name** (e.g., "Website Contact Form", "Emergency Service Request").
4. Add fields by clicking **+ Add Field** for each question:
   - Choose the **Field Type**: Text, Email, Phone, Textarea, Dropdown, Checkbox, Date, File Upload
   - Enter the **Label** — what the customer sees (e.g., "Describe your issue")
   - Toggle **Required** if the field must be completed before submitting
   - For Dropdown fields, enter the options the customer can choose from
   - Drag fields to reorder them
5. Configure **Styling** (optional):
   - Choose background colour, button colour, and font to match your website brand
6. Enter a **Redirect URL** (optional) — the page the customer is sent to after submitting (e.g., a "Thank you" page on your website).
7. Toggle **Is Active** to ON.
8. Click **Save**.
9. To get the embed code:
   - Click **Get Embed Code** on the webform detail page
   - Copy the HTML snippet
   - Paste it into your website's HTML where you want the form to appear
10. To share as a direct link:
    - Click **Copy Link** on the webform detail page
    - Share the URL with customers directly

## Result
A webform is created. When customers submit it, a new Service Request is automatically created in FieldForce Pro with the channel set to "Web Form". Dispatchers see the new request immediately in their Service Requests list.
