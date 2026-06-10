# Webforms and Customer Reviews

---

## Webforms

### What is a Webform?
A webform is an embeddable form that you place on your website or share via a link to let customers submit service requests directly. When a customer fills in the form and submits, a new **Service Request** is automatically created in FieldForce Pro — no manual data entry needed.

### Accessing Webforms
Click **Webforms** in the sidebar (or **Settings → Webforms**).

### What a Webform Contains
Each webform has:
- **Name** — your internal label for the form (e.g., "Website Contact Form", "Emergency Request Form")
- **Fields** — the questions you ask the customer (name, email, phone, issue description, address, etc.)
- **Styling** — colours and branding to match your website
- **Redirect URL** — the page the customer is sent to after submitting (e.g., "Thank you" page)
- **Embed Code** — the HTML snippet to paste into your website
- **Is Active** — toggle to enable or disable the form without deleting it

### Creating a Webform
1. Go to **Webforms** in the sidebar.
2. Click **+ New Webform**.
3. Enter a **Form Name**.
4. Click **+ Add Field** for each question:
   - Choose the **Field Type**: Text, Email, Phone, Dropdown, Checkbox, Textarea, Date, File Upload
   - Enter the **Label** (what the customer sees)
   - Toggle **Required** if the field must be filled in
5. Configure **Styling** (background colour, button colour, font).
6. Enter a **Redirect URL** for after submission (optional).
7. Toggle **Is Active** to on.
8. Click **Save**.

### Getting the Embed Code
1. Open the webform.
2. Click **Get Embed Code**.
3. Copy the HTML snippet.
4. Paste it into the HTML of your website where you want the form to appear.

The form can also be shared as a direct link — click **Copy Link** and share the URL directly with customers.

### How Webform Submissions Become Service Requests
When a customer submits the form:
1. A new **Service Request** is created automatically.
2. The channel is set to "Web Form".
3. The customer's contact details create or match an existing **Contact**.
4. Dispatchers see the new service request in the **Service Requests** list.
5. A confirmation notification is sent to the team.

### Editing a Webform
1. Open the webform from the list.
2. Click **Edit**.
3. Add, remove, or reorder fields.
4. Click **Save**. Changes take effect immediately.

### Deactivating a Webform
Open the webform and toggle **Is Active** to off. The form stops accepting submissions but the configuration is preserved for later use.

---

## Customer Reviews

### What is a Review?
A review is feedback from a customer about a completed job. It includes a **star rating** (1–5) and an optional **comment**. Reviews help you monitor service quality and identify outstanding or underperforming technicians.

### Accessing Reviews
Click **Reviews** in the sidebar.

### Where Do Reviews Come From?
Reviews can come from:
- **Internal** — sent automatically after a work order is completed (customer receives a rating request email/SMS)
- **Google** — linked Google Business Profile reviews
- **Yelp** — linked Yelp reviews
- **Manual entry** — an admin manually records a verbal review

### Review Detail

| Field | Description |
|-------|-------------|
| **Rating** | 1–5 stars |
| **Comment** | Written feedback from the customer |
| **Work Order** | The job this review is about |
| **Customer / Contact** | Who left the review |
| **Platform** | Internal, Google, Yelp |
| **Created At** | When the review was submitted |

### Viewing All Reviews
1. Go to **Reviews** in the sidebar.
2. The list shows all reviews with ratings.
3. Filter by **Rating** (e.g., show only 1–2 star reviews), **Technician**, **Date Range**, or **Platform**.

### Responding to a Review
1. Open a review.
2. Click **Add Response**.
3. Type your response.
4. Click **Save**. The response is stored internally (for Google/Yelp, you respond through those platforms directly).

### Creating a Manual Review Entry
1. Go to **Reviews**.
2. Click **+ New Review**.
3. Select the **Work Order** the review is for.
4. Select the **Rating** and enter the customer's **Comment**.
5. Select the **Platform** (Internal by default).
6. Click **Save**.

### Submitting a Review (Customer)
After a work order is completed, the customer receives an email or SMS with a link to submit their rating. Clicking the link opens a simple star-rating form. Once submitted, the review appears in your Reviews list immediately.
