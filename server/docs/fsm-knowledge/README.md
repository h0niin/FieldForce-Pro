# FieldForce Pro — FSM Expert Knowledge Base

This directory feeds the **FSM Expert AI ("Max")** that appears inside the application for logged-in users.

## How it works

- At server startup, `AiService` reads every `.md` file in this directory (alphabetical order, `README.md` excluded).
- The file contents are concatenated and injected verbatim into the Gemini system prompt as the AI's source of truth.
- **The AI is instructed never to hallucinate** — if something is not documented here, it will say so and refer the user to support.

## How to add / update documentation

1. Drop a `.md` file into this directory.
2. Use the `NN-slug.md` naming convention (`01-platform-overview.md`, `02-work-orders.md`) to control the reading order.
3. **Restart the server** (`docker-compose restart fsm-server`) so the new content is picked up.

## Writing good documentation for the AI

- Be **specific about UI element names** — button labels, tab names, sidebar items — exactly as they appear in the product.
- Write in **second-person imperative** ("Click **Save**", "Navigate to **Service Requests**").
- Use numbered steps for workflows.
- Include edge cases, error states, and troubleshooting tips.
- The more precise and complete the docs, the better the AI answers.

## Current documents

| File | Topic |
|------|-------|
| `01-platform-overview.md` | Architecture, navigation, and general concepts |
| `02-work-orders.md` | Work order lifecycle and workflows |
| `03-service-requests.md` | Service request handling and approval |
| `04-scheduling-dispatch.md` | Scheduling, Gantt chart, and dispatch |
| `05-invoicing-payments.md` | Invoicing, line items, and payments |
| `06-mobile-app.md` | Mobile app features for field technicians |
| `07-user-roles-permissions.md` | Role management and permission configuration |
| `08-settings-customization.md` | Tenant settings, SLAs, and workflow rules |
