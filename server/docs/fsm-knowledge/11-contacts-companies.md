# Contacts and Companies

Contacts are the people (individual customers) in FieldForce Pro. Companies are the businesses or organisations they work for. Service Locations are the physical addresses where work is performed.

---

## Contacts

### What is a Contact?
A contact is a customer record — an individual person who requests or receives services. Contacts can be linked to a company (if they work for a business) and to multiple service locations.

### Accessing Contacts
Click **Contacts** in the left sidebar.

### What Information Does a Contact Record Contain?

| Field | Description |
|-------|-------------|
| **First Name / Last Name** | Customer's full name |
| **Email** | Primary email address for sending invoices and estimates |
| **Phone** | Contact number for technicians and dispatchers |
| **Company** | The business this person belongs to (optional) |
| **Address** | Billing or primary address |
| **Tags** | Labels to categorise contacts (e.g., "VIP", "Commercial", "Residential") |
| **Custom Fields** | Any additional fields configured by your admin |

### Creating a Contact

1. Go to **Contacts** in the sidebar.
2. Click **+ New Contact**.
3. Fill in at minimum: **First Name**, **Last Name**, and **Email** or **Phone**.
4. Optionally link to a **Company** and add an address.
5. Click **Save**.

### Contact Detail Page

Click any contact to open their detail page:

| Tab | Contents |
|-----|----------|
| **Overview** | All contact fields |
| **Service Locations** | Addresses linked to this contact |
| **Work Orders** | All jobs performed for this contact |
| **Estimates** | All estimates sent to this contact |
| **Invoices** | All invoices billed to this contact |
| **Payments** | Payment history |
| **Assets** | Equipment owned by this contact |
| **Notes** | Internal notes |
| **Activity** | Audit trail |

### Linking a Contact to a Company

1. Open the contact detail page.
2. Click **Edit**.
3. In the **Company** field, search for and select the company.
4. Click **Save**.

### Editing a Contact
Open the contact, click **Edit**, make changes, and click **Save**.

### Deleting a Contact
Open the contact, click **Delete** in the action menu, and confirm. The contact is soft-deleted.

### Searching Contacts
Use the search bar on the Contacts list page to search by name, email, or phone number.

---

## Companies

### What is a Company?
A company is a business account. It groups multiple contacts who work for the same organisation. Useful for commercial customers where multiple employees may request service for the same business.

### Accessing Companies
Click **Companies** in the left sidebar.

### What Information Does a Company Record Contain?

| Field | Description |
|-------|-------------|
| **Company Name** | The business name |
| **Industry** | Type of business (e.g., "Healthcare", "Retail", "Manufacturing") |
| **Billing Address** | The company's billing address |
| **Tax ID** | VAT number or tax registration number |
| **Website** | Company website URL |
| **Notes** | Internal notes about this account |
| **Phone** | Main business phone number |
| **Email** | Main business email address |

### Creating a Company

1. Go to **Companies** in the sidebar.
2. Click **+ New Company**.
3. Fill in **Company Name** (required) and other details.
4. Click **Save**.

### Company Detail Page

Click any company to open its detail page:

| Tab | Contents |
|-----|----------|
| **Overview** | All company fields |
| **Contacts** | Individual contacts who work at this company |
| **Service Locations** | All service addresses for this company |
| **Work Orders** | All jobs performed for this company |
| **Invoices** | All invoices billed to this company |
| **Assets** | Equipment owned by this company |

---

## Service Locations

### What is a Service Location?
A service location is a physical address where work is performed. One contact or company can have multiple service locations. For example, a retail chain may have 10 store locations, each needing service.

Service locations store the GPS coordinates used for routing technicians and displaying job pins on the live map.

### Accessing Service Locations
Click **Service Locations** in the left sidebar.

### What Information Does a Service Location Contain?

| Field | Description |
|-------|-------------|
| **Address** | Full street address |
| **Latitude / Longitude** | GPS coordinates (auto-detected when address is entered) |
| **Access Notes** | Instructions for entry (e.g., "Use rear entrance, code 1234") |
| **Gate Code** | Security access code if needed |
| **Contact** | The contact this location belongs to |
| **Company** | The company this location belongs to |
| **Territory** | The service territory this location falls within |

### Creating a Service Location

1. Go to **Service Locations** in the sidebar or from a contact's detail page.
2. Click **+ New Service Location**.
3. Enter the **Address** — GPS coordinates are auto-detected as you type.
4. Alternatively, click **Use My Current Location** to capture GPS automatically.
5. Drag the map pin to fine-tune the location if needed.
6. Add **Access Notes** and **Gate Code** if applicable.
7. Click **Save**.

**Important:** A service location must have valid GPS coordinates for technician routing and map features to work. The system will warn you if no coordinates are detected.

### Viewing a Service Location on the Map
Open the service location detail page and click the **Map** tab to see its position on an interactive map. Click **Directions** to open navigation in Google Maps or Apple Maps.

### Linking a Service Location to a Contact
1. Open the service location detail page.
2. Click **Edit**.
3. In the **Contact** field, search and select the contact.
4. Click **Save**.

### Service Territory Alerts
When creating or editing a service location, the form shows whether the address falls within a defined service territory:
- **Green banner** — "Address is within [Territory Name]"
- **Orange banner** — "Address is outside any defined service territory"

This helps dispatchers know if they serve the area before committing to a job.
