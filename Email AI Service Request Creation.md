# Feature 2 - Email AI Service Request Creation

## 1\. The Idea in One Paragraph (Plain English)

Customers often prefer to **email** their problems, especially businesses ("Our office printer on the 3rd floor is jammed, see photo"). With this feature, the company connects a **support email address** (e.g., <support@coolbreeze.com>). When a customer emails that address, an **AI reads the email**, understands what the issue is, **classifies it** into the right category, pulls out the important details (who, what, where, how urgent), and **automatically creates a Service Request** in the dashboard. The customer instantly gets a reply with a ticket number, and any further email replies stay attached to the same ticket.

**Think of it as:** a smart assistant sitting in your support inbox who reads every email, never misses one, files it correctly, and opens a ticket - within seconds, day or night.

## 2\. Why This Matters

- **Customers keep using email** - no behaviour change required from them.
- **Inbox zero, automatically** - every email becomes a structured ticket; nothing rots in an inbox.
- **Correct categorisation from the start** - the AI reads the content and picks the right Category/Sub-category, so it routes to the right team.
- **Attachments captured** - photos, PDFs, and documents from the email are attached to the ticket.
- **SLA starts on arrival** - the response clock (Doc 4) starts when the email lands, not when a human happens to open it.

## 3\. Part B - Configuration (Where the Company Sets It Up)

A new **Settings → Channels → Email** section is added. Here the Company Admin connects and controls their Email AI.

### 3.1 What the Admin Configures

| **Setting**                       | **Description**                                                                                 | **Example**                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Support email address**         | The address customers will email. Two options (see 3.2).                                        | <support@coolbreeze.com>                          |
| ---                               | ---                                                                                             | ---                                               |
| **Connection method**             | How emails reach the platform - forwarding or a platform-provided address.                      | Forwarding                                        |
| ---                               | ---                                                                                             | ---                                               |
| **Connection status**             | Whether email is flowing in correctly.                                                          | 🟢 Receiving · 🔴 Not receiving                   |
| ---                               | ---                                                                                             | ---                                               |
| **Reply "from" name**             | The sender name customers see on AI replies.                                                    | "CoolBreeze Support"                              |
| ---                               | ---                                                                                             | ---                                               |
| **Auto-acknowledgement template** | The reply sent when a ticket is created.                                                        | "Thanks - we've logged your request as #SR-2045…" |
| ---                               | ---                                                                                             | ---                                               |
| **Category mapping**              | The categories/sub-categories the AI may assign (from your existing settings).                  | Electrical, Plumbing, HVAC…                       |
| ---                               | ---                                                                                             | ---                                               |
| **Priority rules**                | How urgency is decided (keywords like "urgent", "down", "ASAP"; or sender/domain rules).        | "urgent"/"down" → High                            |
| ---                               | ---                                                                                             | ---                                               |
| **Default category/priority**     | Fallback when the AI is unsure.                                                                 | Category: General · Priority: Medium              |
| ---                               | ---                                                                                             | ---                                               |
| **Allowed / blocked senders**     | Optional rules - e.g., only accept emails from known customer domains; block newsletters.       | Block no-reply@\*                                 |
| ---                               | ---                                                                                             | ---                                               |
| **Spam & auto-reply filtering**   | Ignore out-of-office replies, bounce messages, and marketing.                                   | On                                                |
| ---                               | ---                                                                                             | ---                                               |
| **Human handoff rules**           | When to route to a human instead of auto-creating (e.g., legal/complaint keywords).             | "lawyer", "refund" → human                        |
| ---                               | ---                                                                                             | ---                                               |

### 3.2 Two Ways to Connect the Email (We Recommend One)

- **Email forwarding (simplest):** The company keeps its existing inbox (<support@coolbreeze.com>) and sets a rule to **auto-forward** a copy to a unique, secure platform address. Easiest to set up; no password sharing.
- **Platform-provided address:** We issue an address like <coolbreeze@tickets.yourfsm.com> that the company publishes or forwards to. Zero email setup on their side.

📌 We'll recommend the best option for your email provider during setup. Both result in the same outcome: emails become tickets.

### 3.3 Multi-Company Isolation

Each company connects **its own** support email. An email to Company A's address only ever creates a ticket in Company A's dashboard, using Company A's categories and rules. No cross-company visibility.

## 4\. How the AI Reads an Email (Step by Step)

Email arrives ──► AI reads subject + body + attachments + signature

│

▼

Is it a real service request? ──No──► (Spam / newsletter / auto-reply) ──► ignored or filed, no ticket

│Yes

▼

AI identifies the customer (from the sender email; links to existing record if found)

▼

AI extracts structured details:

• Summary of the issue • Location/site (from body or signature)

• Category + Sub-category • Priority/urgency

• Asset/reference numbers • Attachments

▼

AI creates the Service Request + sends acknowledgement reply with ticket number

▼

Ticket appears in dashboard → normal flow (SLA clock starts - Doc 4)

▼

Customer replies to the email ──► reply attaches to the SAME ticket (no duplicate)

### 4.1 What the AI Extracts From an Email

| **Field**                   | **How the AI finds it**                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| **Customer**                | The "From" address; matched to an existing customer if known, otherwise a new record is created. |
| ---                         | ---                                                                                              |
| **Summary**                 | A short, clean one-line description of the problem.                                              |
| ---                         | ---                                                                                              |
| **Category / Sub-category** | Inferred from the wording ("printer jammed" → _IT / Printer_).                                   |
| ---                         | ---                                                                                              |
| **Priority**                | From urgency words ("urgent", "production down", "ASAP") and/or sender rules.                    |
| ---                         | ---                                                                                              |
| **Location / Site**         | From the body or the email signature (office, floor, branch, address).                           |
| ---                         | ---                                                                                              |
| **Reference numbers**       | Asset IDs, AMC/contract numbers, prior ticket numbers if mentioned.                              |
| ---                         | ---                                                                                              |
| **Attachments**             | Photos, PDFs, screenshots - saved to the ticket.                                                 |
| ---                         | ---                                                                                              |
| **Sentiment** (optional)    | Detects an angry/escalated tone to flag for priority attention.                                  |
| ---                         | ---                                                                                              |

### 4.2 The Acknowledgement Reply

As soon as a ticket is created, the customer receives an automatic email such as:

**Subject:** Re: Printer not working - \[Ticket #SR-2045\]

Hi Sara, Thanks for contacting CoolBreeze Support. We've logged your request: • **Ticket:** SR-2045 • **Issue:** Office printer (3rd floor) not printing • **Category:** IT / Printer We'll be in touch shortly. Just reply to this email if you have more details.

The \[Ticket #SR-2045\] tag in the subject is how the system keeps every future reply attached to the **same ticket** instead of creating duplicates.

## 5\. Detailed Scenario Walkthroughs

### Scenario A - Clear request with a photo attached (happy path)

**Incoming email:**

**From:** <sara@acme.com> **Subject:** Printer not working **Body:** Hi, the printer on our 3rd floor (Acme Tower, Office 305) is showing a paper jam error and won't print. We have a big deadline today, please send someone urgently. Photo attached. - Sara, Office Manager **Attachment:** printer-error.jpg

**AI actions:**

- **Customer:** Sara (acme.com) - matched to existing customer "Acme Corp".
- **Summary:** "3rd-floor printer showing paper-jam error, not printing."
- **Category:** IT / Printer.
- **Priority:** **High** (words "urgently", "deadline today").
- **Location:** Acme Tower, Office 305, 3rd floor (from body).
- **Attachment:** printer-error.jpg saved to ticket.
- **Creates** SR-2045, sends the acknowledgement above.

**In dashboard:** SR-2045, Source = Email, High priority → tighter Response SLA (Doc 4).

### Scenario B - Vague complaint email

**Incoming email:**

**Subject:** Not happy **Body:** This is the second time something is wrong. Please fix it.

**AI actions:** The AI can't confidently identify the issue, location, or category. It:

- Creates SR-2050 with **Category = General (needs review)** and flags it for staff.
- Sends a **clarifying reply**:  
   "Thanks for reaching out. So we can help quickly, could you tell us what exactly isn't working and where? We've logged this as SR-2050 in the meantime."
- When Sara replies with details, the reply attaches to SR-2050 and the AI updates the category/priority.

**Notes:** The AI never silently drops a real customer - it creates the ticket _and_ asks for what's missing.

### Scenario C - Reply on an existing ticket (no duplicate)

**From:** <sara@acme.com> **Subject:** Re: Printer not working - \[Ticket #SR-2045\] **Body:** The technician hasn't arrived yet, any update?

**AI actions:** Recognises \[Ticket #SR-2045\] → attaches the message as a new note on the **existing** ticket and notifies the assigned staff. **No new ticket is created.**

### Scenario D - Multiple issues in one email

**Body:** Two problems: (1) AC in the meeting room is noisy, and (2) the pantry tap is leaking.

**AI actions:** Detects two distinct issues and (per your chosen policy) either:

- Creates **two tickets** (SR-2061 HVAC, SR-2062 Plumbing) and replies listing both, **or**
- Creates **one** ticket and lists both items inside it. (You choose the default in _Open Questions_.)

### Scenario E - Different language

**Subject:** المكيف لا يعمل **Body:** المكيف في المكتب لا يبرد، أرجو إرسال فني.

**AI actions:** Detects Arabic, understands "office AC not cooling, please send a technician", creates the ticket (Category HVAC/Cooling), and replies **in Arabic**.

### Scenario F - Spam / newsletter / auto-reply (ignored)

- A marketing newsletter, an "Out of Office" auto-reply, or a delivery-failure bounce arrives at the support address.
- The AI recognises these as **not** service requests and **does not** create a ticket. They can be quietly archived or routed to a "non-actionable" folder for audit.

### Scenario G - Sensitive email routed to a human

**Body:** I want a full refund or I'll involve my lawyer.

**AI actions:** Matches a configured "sensitive" rule (refund/legal). Instead of auto-processing, it creates a ticket flagged **"human review - sensitive"** and routes it to a manager queue, with a neutral acknowledgement to the customer.

## 6\. Edge Cases & How They're Handled

| **Situation**                                    | **AI behaviour**                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Email from an unknown sender                     | Creates a new customer record (or, if you require it, routes for staff verification first).               |
| ---                                              | ---                                                                                                       |
| Email with only "see attached" and a PDF         | Reads the attachment (if document reading is enabled) to extract the request; otherwise asks for details. |
| ---                                              | ---                                                                                                       |
| Very long forwarded email thread                 | Focuses on the **latest** message; uses the history for context.                                          |
| ---                                              | ---                                                                                                       |
| Reply arrives but the original ticket is closed  | Re-opens the ticket or creates a linked follow-up (your choice).                                          |
| ---                                              | ---                                                                                                       |
| Same issue emailed twice (duplicate)             | Detects likely duplicates from the same sender within a short window and links them.                      |
| ---                                              | ---                                                                                                       |
| Email has no subject                             | Generates a summary subject from the body.                                                                |
| ---                                              | ---                                                                                                       |
| Encoding / formatting (HTML, signatures, images) | Strips noise (logos, footers) and keeps the meaningful text.                                              |
| ---                                              | ---                                                                                                       |
| Phishing / malicious attachment                  | Attachments are scanned; suspicious ones are quarantined, not attached.                                   |
| ---                                              | ---                                                                                                       |

## 7\. What Happens After the Ticket Is Created

Identical to every other ticket - it follows your existing flow:

- Appears in the **Service Request list** with Source = Email and the full email thread attached.
- **SLA auto-applies** by category/sub-category/priority/location and the clock starts (Doc 4).
- **Approval workflow** triggers if required for that request type/category (Doc 3).
- Staff assign, schedule, execute, and close.
- Optional **invoice/payment** (which may need approval - Doc 3).
- **Customer updates** flow back by email automatically (or staff reply manually).

## 8\. What the Company Admin Can See & Control

- **Full email thread** attached to each ticket (audit-friendly).
- **Re-classify** any AI decision (change category/priority) with one click; the AI learns from corrections over time.
- **Edit templates** (acknowledgement, clarification) without code.
- **AI performance view** - tickets from email, auto-classification accuracy, % needing review, spam filtered.
- **Manual takeover** - staff can reply directly from the ticket; their reply goes out as a normal email.

## 9\. WhatsApp AI vs Email AI - Quick Comparison

| **Aspect**               | **WhatsApp AI (Doc 1)**                   | **Email AI (Doc 2)**                                    |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------- |
| Style                    | Live back-and-forth chat                  | Read-and-classify (mostly one-shot, with reply threads) |
| ---                      | ---                                       | ---                                                     |
| Best for                 | Quick consumer requests, photos, urgency  | Detailed business requests, documents, formal records   |
| ---                      | ---                                       | ---                                                     |
| Asks follow-up questions | Yes, in real time                         | Yes, via reply emails when info is missing              |
| ---                      | ---                                       | ---                                                     |
| Identity                 | Phone number                              | Email address                                           |
| ---                      | ---                                       | ---                                                     |
| Data quality             | Guided → very structured                  | Inferred → structured, may need occasional review       |
| ---                      | ---                                       | ---                                                     |
| Both result in           | A normal Service Request in the dashboard | A normal Service Request in the dashboard               |
| ---                      | ---                                       | ---                                                     |