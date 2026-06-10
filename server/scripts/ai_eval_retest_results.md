# AI Chatbot Evaluation Results

Corpus: 1002 chunks. Model: gemini-2.0-flash.


---

## Q1 [control] (EXPERT(logged-in))
**Q:** How do I create a work order?

**A:** You can create a new Work Order by following these steps:

1. Click **Work Orders** in the left sidebar under the "Operations" section.
2. On the Work Orders list page, click the **`"Create Work Order"`** button (it's a primary blue button with a **+** icon) in the top-right corner of the page header.
3. You will land on the Create Work Order form.
4. Fill in the required fields:
 * **`"Summary"`** — a brief description of the job, like "HVAC repair at 123 Main St".
 * **`"Priority"`** — choose from Low, Medium, High, or Urgent.
 * **`"Customer (Contact)"`** — link to an existing customer contact.
 * **`"Service Location"`** — select the address where the job will take place.
5. Optionally, you can also fill in fields like **`"Description"`**, **`"Asset"`**, **`"Category"`**, or set a **`"Scheduled Date"`**.
6. Click the **`"Create"`** button at the bottom-right of the form.

You will then be redirected to the detail page for your newly created work order, which will be in `New` status.


---

## Q2 [control] (EXPERT(logged-in))
**Q:** How do I record a payment against an invoice?

**A:** To record a payment against an invoice, you'll need to use the dedicated Payments module:

1. In the left sidebar, click **Payments**.
2. Since there isn't a "New Payment" button on the Payments list page, you'll need to navigate directly to the "Record Payment" page.
3. On the **Record Payment** page:
 * Select the invoice you want to apply the payment to from the **Invoice** dropdown. You can search by invoice number or customer name.
 * Enter the **Amount** of the payment.
 * Choose the **Payment Method** (e.g., Card, Cash, Bank Transfer). "Card" is selected by default.
 * Optionally, you can enter a **Transaction ID**, select the **Paid At** date and time, and add any **Notes**.
4. Click the **Record Payment** button.

Once successful, you will be taken back to the Payments list page. The invoice status will update accordingly (e.g., to `Partially Paid` or `Paid`).


---

## Q3 [fixed-nav] (EXPERT(logged-in))
**Q:** What is a blueprint?

**A:** A Blueprint is a visual workflow designer that allows you to create custom status workflows for your work orders, estimates, and invoices. Instead of using the system's default status flows, you can design your own sequence of steps tailored to your company's specific processes.

For example, you could set up a workflow for a work order to follow these steps: `Quote Requested → Quote Approved → Parts Ordered → Parts Received → Work Scheduled → In Progress → Inspection → Signed Off → Invoiced`.

Blueprints also let you define how records move between these steps, including who can trigger each change, what information must be filled in, and more.


---

## Q4 [fixed-nav] (EXPERT(logged-in))
**Q:** What is a pricebook?

**A:** The Pricebook in our FSM software allows you to create tiered pricing packages for your services. This means you can offer different options, like Good, Better, or Best tiers, for a single service.

Each tier has its own name, description, and price, and it's linked to an underlying service from your Services Catalog.

For example, for an "HVAC Maintenance" service, you could have:
* **HVAC Maintenance — Good** ($89): Basic annual filter change
* **HVAC Maintenance — Better** ($149): Filter change + coil cleaning + system check
* **HVAC Maintenance — Best** ($249): Full service + priority response + 12-month warranty

This helps you present clear options to your customers when creating estimates.

You can access the Pricebook by going to **Catalog → Pricebook** in the sidebar.


---

## Q5 [fixed-nav] (EXPERT(logged-in))
**Q:** What is a service agreement?

**A:** A service agreement, also known as a contract or maintenance contract, is a formal commitment between your company and a customer. It defines the scope, frequency, and terms of ongoing service, establishing a longer-term relationship rather than a one-off job.

Common types of service agreements include:
* **Maintenance Agreement:** For regular preventive maintenance visits (e.g., monthly, quarterly).
* **Warranty Agreement:** Covers parts and labor for a specific period.
* **SLA Agreement:** Defines guaranteed response and resolution times for issues.


---

## Q6 [fixed-nav] (EXPERT(logged-in))
**Q:** How do I view SLA compliance for my service agreements?

**A:** To view the SLA compliance for your service agreements, you'll need to go to the SLA Compliance Dashboard.

Here are the steps:

1. **Access Service Agreements:** Since "SLA Compliance" is part of the "Agreements" module, you will first need to navigate to **Agreements**. Please note that "Service Agreements" is not currently a direct item in the main left sidebar navigation. You may need a direct link to this page, or your administrator might need to provide guidance on how to access it if it's not readily visible.
2. **Go to SLA Compliance:** Once in the "Agreements" section, look for an option or sub-menu titled **SLA Compliance**. Clicking this will take you to the **SLA Compliance Dashboard**.

On the dashboard, you will see:

* **Summary Statistics:** Four cards showing average response and resolution compliance percentages, the count of agreements at risk, and the total number of breaches across all your agreements.
* **Compliance Table:** A table listing each service agreement with its individual compliance status, response time compliance, resolution time compliance, total requests, and total breaches.
* **Filtering Options:** You can filter the data by time range (7 days, 30 days, 90 days, or 1 year) and by agreement status (excellent, good, warning, critical).
* **Critical Alerts:** If any agreement is in a critical status, a red alert banner will appear above the table.

You can also click on an agreement name in the table to drill into its specific details.


---

## Q7 [fixed-nav] (EXPERT(logged-in))
**Q:** What can the Vision AI feature do for me?

**A:** Our Vision AI feature helps you analyze images in several ways:

* **Verify Work:** You can upload a photo of completed work, and the AI will analyze it to confirm if the work was done correctly and identify any issues or findings.
* **Detect Equipment:** Upload a photo, and the AI can identify specific pieces of equipment present in the image, showing you their labels, categories, and confidence levels.
* **Compare Before/After Photos:** You can provide two photos, one taken before work and one after, and the AI will compare them to detect significant changes and highlight changed regions.

You can access these features from the Vision AI Dashboard. While it's not currently in the main navigation menu, your administrator can provide you with a direct link or enable it.


---

## Q8 [fixed-nav] (EXPERT(logged-in))
**Q:** How do I transcribe a voice note?

**A:** You can transcribe a voice note by uploading an audio file to the Voice Notes & Transcription page. Please note that this page is not currently in the main navigation menu, so you may need a direct link or to ask your administrator to access it.

Here's how to do it:

1. Go to the **Voice Notes & Transcription** page.
2. In the **"Upload Voice Note"** section, select the language spoken in the audio file from the language dropdown. The default language is English.
3. Click the **"Upload & Transcribe"** button (it has a microphone icon) and then choose the audio file from your computer.
 * Accepted file types include `audio/*`, `.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`, and `.webm`.
4. Once you select the file, it will be submitted immediately for transcription. You'll see a loading indicator.
5. After the transcription is complete, a success message will appear, and your new voice note will be added to the top of the **"Voice Notes"** list. Its transcription will then open in the right-hand panel for you to view.

Please keep in mind that voice notes uploaded this way are not saved permanently and will be cleared if you reload the page.


---

## Q9 [fixed-nav] (EXPERT(logged-in))
**Q:** How do I upload a document for the AI to read with OCR?

**A:** To upload a document for AI-powered Optical Character Recognition (OCR) and parsing, please follow these steps:

1. Go to the **Document AI** page. This page is specifically designed for document uploads and is not currently listed in the main navigation menu, so you might need a direct link or to ask your administrator for access.
2. On the **"Upload Document"** page, in the "Upload Document" section, use the document-type dropdown to select the type of document you are uploading. You can choose from **Invoice, Receipt, Contract, Report,** or **General**.
3. Click the **"Upload & Parse"** button. A file picker will open.
4. Select the document file from your computer. Accepted file types are PDF, PNG, JPG, JPEG, TIFF, and BMP.
5. Once you select the file, it will begin uploading and parsing automatically. You'll see a loading spinner on the button.
6. After a successful upload and parsing, a notification will appear saying "Document uploaded and parsed," and the list of "Parsed Documents" on the page will refresh to show your newly added document. If there's an issue, an error message will be displayed instead.


---

## Q10 [fixed-nav] (EXPERT(logged-in))
**Q:** How do I ask a question using natural language analytics?

**A:** You can ask questions using natural language analytics by following these steps:

1. First, make sure you are logged into the system and have the necessary permission to access analytics data. You'll need the `analytics:read` permission.
2. Navigate to the **AI-Powered Analytics** page. Please note that this page does not currently have a direct link in the main navigation sidebar, so you may need a direct link or ask your administrator for access.
3. On this page, you'll see a card titled **"AI Analytics Query"**.
4. Type your question into the large search box. For example, you could ask:
 * "How many work orders by status?"
 * "Show me overdue invoices"
 * "What is the health score of assets?"
 * "Show me all work orders completed last month by technician"
5. After typing your question, press **Enter** or click the **Query** button to submit it.
6. You'll also see some clickable blue suggestion tags below the input, like "How many work orders by status?". You can click any of these tags to populate the input field with that question, then press **Enter** or click **Query** to run it.

After your query runs, a **"Result"** card will appear, showing an explanation, any generated SQL, a suggested visualization type, and the data in a table if results are found.


---

## Q11 [fixed-nav] (EXPERT(logged-in))
**Q:** How do I check the health of my equipment?

**A:** You can check the health of your equipment using the **Equipment Health Dashboard**.

Here's how to access and use it:

1. **Access the Dashboard:** This dashboard is found at the **Equipment Health Dashboard** page. Please note that this feature is not currently available in the main navigation menu, so you may need a direct link or to ask your administrator to access it.

2. **Dashboard Overview:**
 * The page header will display "Equipment Health Dashboard".
 * Below the header, you'll see four summary cards: **Total** (total number of equipment records), **Healthy** (equipment at low risk), **Needs Attention** (equipment at medium or high risk), and **Critical** (equipment at critical risk).
 * An **Avg Health** tag shows the average health score for all equipment. It's green for an average of 70% or more, orange for 50% or more, and red otherwise.

3. **Equipment Health Table:**
 * The main part of the dashboard is a table listing each piece of equipment.
 * Key columns include:
 * **Equipment:** The name and category of the equipment.
 * **Health Score:** A progress bar (0–100) indicating the equipment's condition. Green is 80% or higher, yellow 60% or higher, red 40% or higher, and dark red below 40%.
 * **Risk Level:** A colored tag showing **LOW**, **MEDIUM**, **HIGH**, or **CRITICAL** risk.
 * **Failure Probability:** The percentage chance of failure, shown in red if above 70% and warning color if above 30%.
 * **Last Maintenance:** The date of its last service.
 * **Predicted Failure:** A predicted date of failure, or "N/A" if no prediction.
 * **Actions:** Buttons to **View Details** or **Run Prediction** for specific equipment.

4. **Understanding the Health Score:**
 * The Health Score (0-100) is calculated automatically by our AI Predictive Maintenance engine. It considers the asset's age, service history, frequency of repairs, recent fault codes, and warranty status.
 * A score of 80–100 means good condition.
 * A score below 50 means attention is needed.
 * A score below 30 means it's critical and replacement or major service should be considered.

5. **Searching and Filtering:**
 * You can use the **search** input above the table to filter equipment by name.
 * Use the **Risk Level** dropdown to filter by a specific risk level (Low, Medium, High, Critical).
 * You can also click the **Health Score** or **Failure Probability** column headers to sort the table by those metrics.

This dashboard helps you proactively plan service visits and address potential issues before equipment breaks down.


---

## Q12 [fixed-nav] (EXPERT(logged-in))
**Q:** How do I create a new blueprint workflow?

**A:** To create a new blueprint workflow, you'll need the `blueprints:create` permission, which is typically available to Admin users or those with a custom role.

Here are the steps to create one:

1. Click **Blueprints** in the left sidebar.
2. Click the **+ New Blueprint** button, usually found in the top-right corner.
3. Enter a **Blueprint Name** for your workflow (for example, "Commercial HVAC Workflow").
4. Select the **Module** this blueprint will apply to:
 * **Work Order** for custom work order status flows.
 * **Estimate** for custom estimate status flows.
 * **Invoice** for custom invoice status flows.
5. Click **Create**. This will take you to the Blueprint Editor, which is a visual canvas.
6. **Add States** (these are the individual steps or statuses in your workflow):
 * Click **+ Add State**.
 * Enter a **State Name** (e.g., "Parts Ordered").
 * Choose a **Color** for the status badge.
 * Toggle **Is Initial** if this is the very first step in your workflow (you can only have one initial state).
 * Toggle **Is Final** if this is a terminal step (like "Closed" or "Cancelled").
 * Click **Save State**. Repeat this for all the states you need.
7. **Add Transitions** (these are the connections that allow movement between states and become action buttons):
 * Click **+ Add Transition** or drag a connector arrow from one state to another on the canvas.
 * Select the **From State** (the current status) and the **To State** (the next status).
 * Enter a **Transition Name** (this will be the label on the button, like "Approve" or "Complete").
 * Select **Allowed Roles** to specify which user roles can trigger this transition.
 * If certain information must be filled out before this transition can occur, add any **Required Fields**.
 * Optionally, you can add a **Webhook URL** if you want an external system to be notified when this transition happens.
 * Click **Save Transition**. Repeat this for all the connections in your workflow.
8. Once all your states and transitions are set up, click **Activate Blueprint** in the top-right corner.
9. Confirm your choice.

Your custom workflow will now be active for new records created in the module you selected. Keep in mind that only one blueprint can be active per module at a time, and it will only apply to new records, not existing ones.


---

## Q13 [fixed-endpoint] (EXPERT(logged-in))
**Q:** How do I integrate my website form to create service requests via the API?

**A:** To integrate your website form and create service requests in FieldForce Pro via the API, you'll need to use our inbound service request endpoint. Here's how you can set it up:

1. **Access the Integration Guide:**
 First, you'll want to review our detailed guide for pushing service requests. You can find this guide by navigating to the "Integration Guide" page within the application. Please note that this page is a reference and not directly available in the main navigation menu; you may need a direct link or your administrator can guide you there.

2. **Create an API Key:**
 All incoming requests to the API require authentication using an `x-api-key` header. You'll need to create a new API key for this purpose. Go to **Integrations** then **API Keys** in the main navigation to generate one.

3. **Understand the Inbound Endpoint:**
 The API endpoint for creating service requests is ` POST /service-requests/inbound `. This endpoint accepts data from your external system (like your website form) and creates a new service request in FieldForce Pro.

4. **Prepare Your Request Body:**
 Your website form will need to send data in a specific format (JSON) to this endpoint. Here are the key fields you can include:
 * `subject` (required): A short title for the service request.
 * `description` (optional): A detailed explanation of the issue.
 * `priority` (optional): Can be `low`, `medium`, `high`, or `urgent`. The default is `medium`.
 * `category` (optional): Such as `HVAC`, `Plumbing`, etc.
 * `customer_email` (optional): The customer's email address, used to link or create a contact.
 * `customer_name` (optional): The customer's full name.
 * `customer_phone` (optional): The customer's phone number.
 * `service_address` (optional): The full address where the service is needed.
 * `lat` and `lng` (optional): Latitude and longitude for the service location.
 * `external_ref_id` (optional): Your own internal reference ID for the request.
 * `custom_fields` (optional): Any extra key-value data you want to attach.

5. **Use Code Examples:**
 The Integration Guide includes copyable code examples in cURL, JavaScript, and Python to help you structure your API call. These examples demonstrate how to include the `x-api-key` header and the JSON request body.

6. **Handle Responses:**
 * **Success:** A successful request will return a `201 Created` status with a message "Service request received successfully" and details of the new request, including its unique `request_number`.
 * **Errors:** The guide also details common error codes (e.g., `401 Unauthorized` for an invalid API key, `400 Bad Request` for missing required fields, `422 Unprocessable Entity` for validation errors).

By following these steps, you can configure your website form to automatically create service requests in FieldForce Pro.
