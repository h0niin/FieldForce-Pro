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
| `00-getting-started.md` | First-time setup, onboarding checklist, common first questions |
| `01-platform-overview.md` | Architecture, navigation, and general concepts |
| `02-work-orders.md` | Work order lifecycle and workflows |
| `03-service-requests.md` | Service request handling and approval |
| `04-scheduling-dispatch.md` | Scheduling, Gantt chart, and dispatch |
| `05-invoicing-payments.md` | Invoicing, line items, and payments |
| `06-mobile-app.md` | Mobile app features for field technicians |
| `07-user-roles-permissions.md` | Role management and permission configuration |
| `08-settings-customization.md` | Tenant settings, SLAs, and workflow rules |
| `09-estimates.md` | Estimates (quotes) — create, send, approve, convert to WO |
| `10-assets.md` | Asset management, health scores, maintenance plans |
| `11-contacts-companies.md` | Contacts, companies, and service locations |
| `12-job-sheets.md` | Job sheet templates, completion, and approval |
| `13-timesheets-trips.md` | Timesheet tracking and GPS trip history |
| `14-workforce-management.md` | Crews, shifts, territories, time off, skills, equipment |
| `15-catalog-pricebook.md` | Services catalog, parts catalog, and pricebook tiers |
| `16-service-agreements.md` | Service agreements, SLA policies, SLA compliance |
| `17-blueprints.md` | Visual workflow designer / custom state machines |
| `18-reports-analytics.md` | Reports, custom report builder, dashboard, NL analytics |
| `19-customer-portal.md` | Customer self-service portal (invoices, tracking, approvals) |
| `20-communications-notifications.md` | Communications log and notification preferences |
| `21-webforms-reviews.md` | Embeddable webforms and customer reviews |
| `22-maintenance-plans.md` | Recurring maintenance schedules and equipment health |
| `23-live-tracking.md` | Real-time GPS technician tracking |
| `24-security-audit.md` | Security settings, 2FA, audit logs |
| `25-voice-vision-ai.md` | Voice notes (transcription) and AI Vision (OCR/document analysis) |
| `26-fsm-glossary.md` | Definitions of every FSM term used in the platform |
| `27-faq-new-users.md` | Frequently asked questions for new users |
| `master-index.md` | Complete capability index linking to all workflow SOPs |
| `ui-maps/` | Detailed UI maps of key pages (button labels, form fields) |
| `workflows/` | 100+ step-by-step workflow SOPs for every action in the app |
