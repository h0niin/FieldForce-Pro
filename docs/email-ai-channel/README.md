# Email AI Channel (Hanin)

Users can now configure an Email AI channel that reads incoming support emails, automatically classifies and extracts structured service request details using Gemini AI, creates Service Requests, and handles automated acknowledgement/clarification replies and conversation threading.

---

## How to Test

### 1. Configure Email Channel Settings
1. Log in to the application and navigate to **Settings** > **Email Channel** in the sidebar.
2. Select a connection method:
   - **Email Forwarding (Recommended)**: Set up your support mailbox (e.g., `support@yourcompany.com`) to forward all incoming mail to:
     - Generic JSON Webhook: `https://[YOUR_DOMAIN]/api/email-channel/webhook/inbound`
     - SendGrid Inbound Parse Webhook: `https://[YOUR_DOMAIN]/api/email-channel/webhook/sendgrid`
   - **Platform-Provided Address**: Direct incoming mail to a platform-hosted address (e.g., `support@tickets.yourfsm.com`).
3. Set your **Support Email Address** and a **Webhook Secret** (for validating incoming webhooks).
   > **Tip:** You can generate a strong random secret in your terminal using Node.js:
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   > ```
4. Customize your **Reply Templates**:
   - **Acknowledgement Template**: The auto-response sent when a Service Request is successfully created (supports `{ticket_number}`, `{summary}`, and `{category}` placeholders).
   - **Clarification Template**: The response sent when Gemini AI cannot determine enough information to classify/resolve the request.
5. Define **AI Classification Settings**:
   - Add/remove categories the AI is trained to recognize.
   - Define priority rules mapping keywords (e.g., "urgent" -> `HIGH`).
   - Define fallback default category and priority.
6. Customize **Filtering & Handoff**:
   - Toggle spam/auto-reply filters.
   - Add blocked sender domains/addresses (e.g., `no-reply@`).
   - Add sensitive/human handoff keywords (e.g., `lawyer`, `refund`).
7. Save the configuration and click **Test** to send a test verification email.

### 2. Inbound Webhook Testing
You can simulate incoming emails by sending POST requests to the inbound webhook endpoints:

#### Generic JSON Webhook
- **Endpoint**: `POST /api/email-channel/webhook/inbound`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Webhook-Secret: [Your configured secret]`
- **Body**:
  ```json
  {
    "from": "John Doe <john.doe@example.com>",
    "to": "support@yourcompany.com",
    "subject": "AC unit not cooling down",
    "text": "Hello, our AC unit in the main office stopped cooling down this morning. It is getting very hot here. Please send someone to fix it ASAP. Reference #AC-992.",
    "message_id": "<msg-id-12345@example.com>"
  }
  ```

#### Multi-Issue Webhook Testing
To verify that the system handles multiple distinct issues in a single email by creating separate Service Requests, send a payload containing multiple issues:
- **Body**:
  ```json
  {
    "from": "Jane Smith <jane.smith@example.com>",
    "to": "support@yourcompany.com",
    "subject": "Leaking pipe and broken light fixture",
    "text": "Hi, we have two issues at our facility. First, the kitchen sink pipe is leaking water all over the floor. Second, the main conference room light fixture is broken and won't turn on. Please help.",
    "message_id": "<msg-id-67890@example.com>"
  }
  ```
*Verify that two separate Service Requests are created and logged in the system.*

#### Threading and Reply Verification
To test reply threading, send a subsequent email referencing the primary ticket number in the subject line or matching headers:
- **Body**:
  ```json
  {
    "from": "John Doe <john.doe@example.com>",
    "to": "support@yourcompany.com",
    "subject": "Re: AC unit not cooling down - [Ticket #SR-xxxx-xxx]",
    "text": "Here is some more information. The AC model number is CoolTech-4000.",
    "in_reply_to": "<msg-id-12345@example.com>"
  }
  ```
*Verify that the message is appended to the existing thread and no new Service Request is created.*

---

## Files Changed

### Backend

#### 1. `server/src/EMAIL_CHANNELS/` (New Module)
- [email_channels.entity.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/email_channels.entity.ts): Sequelize entity for storing email channels configuration.
- [email_threads.entity.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/email_threads.entity.ts): Sequelize entity for tracking email conversations, message history, and linked service requests.
- [email_channels.provider.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/email_channels.provider.ts): Repository providers for database dependency injection.
- [dto/upsert-email-channel.dto.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/dto/upsert-email-channel.dto.ts): DTO validating request payload for creating/updating channel configurations.
- [dto/email-webhook.dto.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/dto/email-webhook.dto.ts): DTOs validating inbound emails in both generic JSON and SendGrid form-data formats.
- [email_ai.service.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/email_ai.service.ts): Integrates Gemini AI (`gemini-2.0-flash`) to parse emails, detect language/sentiment, evaluate spam/auto-replies, and extract structured issues.
- [email_processing.service.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/email_processing.service.ts): Core orchestrator processing webhook payloads, matching reply threads, matching/creating contacts, and creating Service Requests.
- [email_channels.service.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/email_channels.service.ts): Service layer for channel settings CRUD, connection tests, and thread retrievals.
- [email_channels.controller.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/email_channels.controller.ts): Exposes REST controllers for managing channel configuration and handling public inbound email webhooks.
- [email_channels.module.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/EMAIL_CHANNELS/email_channels.module.ts): Packages and wires the controllers, services, and repository dependencies.

#### 2. Registration and Wires
- [keynames.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/shared/constants/keynames.ts): Registered constants for `EMAIL_CHANNELS` and `EMAIL_THREADS` repositories.
- [database.module.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/database/database.module.ts): Registered `EmailChannel` and `EmailThread` entities in the Sequelize models array.
- [app.module.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/server/src/app.module.ts): Imported and registered `EmailChannelsModule` globally in the application imports.

---

### Frontend

#### 1. Components & Pages
- [EmailChannelSettingsPage.tsx](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/web/src/pages/settings/EmailChannelSettingsPage.tsx): Settings dashboard UI for configuring connection details, templates, category/priority mappings, blocklists, and human handoff rules.
- [Sidebar.tsx](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/web/src/components/layout/Sidebar.tsx): Added the "Email Channel" settings item under the Settings submenu.

#### 2. API & Routing
- [email-channel.api.ts](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/web/src/api/email-channel.api.ts): Axios API client wrapper for managing email channel settings.
- [routes.tsx](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/web/src/routes.tsx): Registered the lazy-loaded route `/settings/channels/email` pointing to `EmailChannelSettingsPage`.

#### 3. Translations
- [common.json (en)](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/web/public/locales/en/common.json): Added `"emailChannel": "Email Channel"` key.
- [common.json (ar)](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/web/public/locales/ar/common.json): Added `"emailChannel": "قناة البريد الإلكتروني"` key.
- [common.json (hi)](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/web/public/locales/hi/common.json): Added `"emailChannel": "ईमेल चैनल"` key.
- [common.json (ml)](file:///c:/Users/mhani/OneDrive/Desktop/BAIRUHA/h0niin/FieldForce-Pro/web/public/locales/ml/common.json): Added `"emailChannel": "ഇമെയിൽ ചാനൽ"` key.
