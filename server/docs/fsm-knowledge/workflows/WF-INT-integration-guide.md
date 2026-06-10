# WF-INT-integration-guide — Integration Guide: Push Inbound Service Requests via API

## Module
Integrations — `IntegrationGuidePage` (`/integrations/guide`)

## Prerequisites
- User must be authenticated (the route is nested under the `PrivateRoute`-guarded app layout).
- To actually call the inbound endpoint, you need an API key created at **Integrations → API Keys** (`/integrations/api-keys`).

---

## Steps — Read the Integration Guide Overview

1. Navigate to `/integrations/guide`. The page header reads **"Integration Guide"** with subtitle "Learn how to push service requests from your client systems into FieldForce Pro".
2. At the top, an info **Alert** titled **"Authentication"** (key icon) explains: "All inbound requests require an `x-api-key` header." It directs you to **Integrations → API Keys** to create one.
3. The guide is a single read-only reference page (no forms or inputs) made of stacked cards: Inbound Endpoint, Request Body Fields, Code Examples, Success Response, and Error Codes.

---

## Steps — Review the Inbound Endpoint

1. The **"Inbound Endpoint"** card (API icon) shows a green **POST** tag next to the endpoint path: `POST /service-requests/inbound`.
2. The description states the endpoint "Accepts a service request from any external system (CRM, customer portal, IoT device, etc.) and creates it inside FieldForce Pro, linked to the correct tenant via the API key."
3. The base URL used throughout the examples is `https://api.yourfieldforce.com`.

---

## Steps — Review the Request Body Fields

1. The **"Request Body Fields"** card (code icon) renders a table with columns: **Field**, **Type**, **Required**, **Description**. Required fields show a red **required** tag; others show a gray **optional** tag.
2. The documented fields are:

   | Field | Type | Required | Description |
   |---|---|---|---|
   | `subject` | string | required | Short title of the service request |
   | `description` | string | optional | Detailed description of the issue |
   | `priority` | low \| medium \| high \| urgent | optional | Request priority (default: medium) |
   | `category` | string | optional | Service category (e.g. HVAC, Plumbing) |
   | `customer_email` | string (email) | optional | Customer email — used to find or create a contact record |
   | `customer_name` | string | optional | Customer full name |
   | `customer_phone` | string | optional | Customer phone number |
   | `service_address` | string | optional | Full service address |
   | `lat` | number | optional | Latitude for the service location |
   | `lng` | number | optional | Longitude for the service location |
   | `external_ref_id` | string | optional | Your internal ticket/reference ID for deduplication |
   | `custom_fields` | object | optional | Any additional key-value data to attach to the request |

---

## Steps — Use the Code Examples

1. The **"Code Examples"** card (code icon) contains a **Tabs** control with three tabs: **cURL**, **JavaScript**, and **Python**. Each tab shows a copyable code block calling `POST /service-requests/inbound` with the `x-api-key: fk_live_<your_api_key>` header and `Content-Type: application/json`.
2. All three examples post the same sample payload, including: `subject` "AC unit not cooling", `description`, `priority: high`, `category: HVAC`, `customer_email`, `customer_name`, `customer_phone`, `service_address`, and `external_ref_id: TICKET-4821`.
3. The **JavaScript** example uses `fetch` and logs `result.data.request_number` (e.g. `"SR-ABC-20260527-001"`).
4. The **Python** example uses the `requests` library and prints `data['data']['request_number']`.
5. The **cURL** example mirrors the same headers and JSON body via `curl -X POST`.

---

## Steps — Understand the Success Response

1. The **"Success Response (201)"** card shows a JSON envelope with `statusCode: 201`, `status: true`, and message "Service request received successfully".
2. The `data` object includes: `id`, `request_number` (e.g. `"SR-ABC-20260527-001"`), `subject`, `status: "new"`, `priority`, `channel: "api"`, `external_ref_id`, and `created_at`.

---

## Steps — Handle Error Codes

1. Below a divider, the **"Error Codes"** card shows a table with columns **Status** and **Reason**. 4xx codes use an orange tag; 5xx uses red.
2. The documented errors are:

   | Status | Reason |
   |---|---|
   | 401 Unauthorized | Missing, invalid, expired, or revoked x-api-key header |
   | 400 Bad Request | subject field is missing or payload is malformed JSON |
   | 422 Unprocessable Entity | Validation error — check individual field constraints |
   | 500 Internal Server Error | Unexpected server error — contact support |

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| View the integration guide | Navigate to `/integrations/guide` | Authenticated | None (static reference page) |
| Create an API key for inbound calls | Link to **Integrations → API Keys** (`/integrations/api-keys`) | Authenticated | (handled on ApiKeysPage) |
| Switch code example language | **cURL / JavaScript / Python** tabs | Authenticated | None (client-side tab switch) |
| Push an inbound service request | Copy a code example and call externally with `x-api-key` | Valid `x-api-key` header | `POST /service-requests/inbound` |
