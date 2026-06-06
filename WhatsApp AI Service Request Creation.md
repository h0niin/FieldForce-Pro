# Feature 1 - WhatsApp AI Service Request Creation

## 1\. The Idea in One Paragraph (Plain English)

Today, a customer who has a problem (e.g., "my air conditioner stopped cooling") has to call you, fill a form, or email. With this feature, the customer simply sends a **WhatsApp message** to your company's WhatsApp number. An **AI assistant** answers them instantly, has a natural back-and-forth chat to collect everything we need (what's wrong, where, how urgent, photos, etc.), and then **automatically creates a Service Request** in your dashboard. From that moment, the request follows your normal process - exactly as if your staff had typed it in. The customer keeps getting updates on the same WhatsApp chat.

**Think of it as:** a tireless support agent who works 24/7, never forgets to ask a question, speaks the customer's language, and types every answer neatly into your system.

## 2\. Why This Matters

- **Customers love WhatsApp** - it's where they already are. No app to download, no form to learn.
- **No missed requests** - messages at 2 AM are captured and turned into tickets instantly.
- **Cleaner data** - the AI always collects the same required fields, so no half-filled tickets.
- **Faster response** - the SLA clock (see Doc 4) starts the moment the ticket is created, not hours later when someone reads an inbox.
- **Less manual typing** for your staff - they receive a complete, structured ticket.

## 3\. Part A - Configuration (Where the Company Sets It Up)

A new **Settings → Channels → WhatsApp** section is added. Here the Company Admin connects and controls their WhatsApp AI.

### 3.1 What the Admin Configures

| **Setting**                    | **Description**                                                                                                                                                               | **Example**                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **WhatsApp Business Number**   | The phone number customers will message. Connected via the official WhatsApp Business Platform (Meta Cloud API) or an approved provider (e.g., Twilio / 360dialog / Gupshup). | +971 50 123 4567                                                       |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Connection status**          | Shows whether the number is verified and live.                                                                                                                                | 🟢 Connected · 🟡 Pending verification · 🔴 Disconnected               |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Business display name**      | The name customers see in the chat header.                                                                                                                                    | "CoolBreeze HVAC Support"                                              |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Welcome / greeting message** | First message the AI sends.                                                                                                                                                   | "Hi 👋 I'm the CoolBreeze assistant. Tell me what you need help with." |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Working hours behaviour**    | Whether AI replies 24/7 or shows an after-hours note (it still captures the request).                                                                                         | 24/7 capture, "office hours" note outside 9-6                          |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Languages**                  | Which languages the AI should understand and reply in.                                                                                                                        | English, Arabic, Hindi                                                 |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Required data fields**       | Which details the AI must collect before creating a ticket (toggle on/off).                                                                                                   | Name ✓, Location ✓, Category ✓, Photos (optional)                      |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Category mapping**           | The list of service categories/sub-categories the AI can choose from (pulled from your existing settings).                                                                    | Electrical, Plumbing, HVAC, Appliance…                                 |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Default priority**           | Priority to use if the AI cannot infer one.                                                                                                                                   | Medium                                                                 |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Human handoff number/team**  | Where to escalate if the customer asks for a human or the AI gets stuck.                                                                                                      | Support team queue                                                     |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |
| **Auto-reply confirmation**    | The confirmation message sent once a ticket is created.                                                                                                                       | "✅ Ticket #SR-1042 created. Our team will contact you shortly."       |
| ---                            | ---                                                                                                                                                                           | ---                                                                    |

### 3.2 One-Time Onboarding Steps (We Guide the Admin)

- **Choose a number** - use an existing business number or buy a new one.
- **Verify ownership** with Meta/WhatsApp (a one-time code; we walk them through it).
- **Test chat** - admin sends a test message and sees the AI respond + a test ticket appear.
- **Go live** - share the number with customers (website, invoices, signage, etc.).

📌 **Important platform rule (we handle this for you):** WhatsApp only lets a business _freely_ reply within a **24-hour window** after the customer's last message. Outside that window, the business must use an _approved template_ to re-open the chat. The AI is built to respect this rule automatically.

### 3.3 Multi-Company Isolation

Because the platform is multi-tenant, **each company connects its own WhatsApp number**. A message to Company A's number only ever creates a ticket in Company A's dashboard, using Company A's categories, SLA rules, and team. Companies never see each other's chats.

## 4\. How the AI Conversation Works (Step by Step)

The AI's job is to **understand → ask only what's missing → confirm → create the ticket → keep the customer updated.**

Customer message ──► AI understands intent ──► AI checks: do we know this customer?

│

┌───────────────────────────┴──────────────┐

▼ ▼

Known customer New customer

(match by number) (ask name + details)

│ │

└───────────────┬───────────────────────────┘

▼

AI collects required fields one by one

(what / where / how urgent / photos)

▼

AI shows a summary & asks "Shall I create this?"

▼

┌───────────────┴───────────────┐

▼ ▼

Customer confirms Customer edits

│ │

▼ ▼

✅ Service Request created AI updates & re-confirms

\+ confirmation + ticket #

▼

Ticket appears in dashboard → normal flow

(SLA clock starts - see Doc 4)

### 4.1 Data the AI Collects (the "intake checklist")

The AI gathers (only asking for what it can't already infer):

- **Who** - customer name + verifies the WhatsApp number; links to existing customer record if found.
- **What** - a description of the problem, mapped to a **Category + Sub-category**.
- **Where** - service location/address (or links to a saved address for known customers).
- **How urgent** - maps to a **Priority** (the AI can infer "no power in the whole shop" = High).
- **Evidence** - optional photos/videos/voice notes the customer sends.
- **When** - preferred date/time window if relevant.
- **Extra** - any field your business marks as required (e.g., AMC/warranty number, asset ID).

### 4.2 What "Two-Way Communication" Means

It is a genuine conversation, not a one-shot form:

- The AI **asks follow-up questions** ("Is it the whole building or one room?").
- It **handles out-of-order info** (if the customer dumps everything in one message, the AI extracts it all and only asks for what's still missing).
- After the ticket is created, the **same chat thread** is used for updates: "Technician assigned", "On the way", "Job completed - please rate us". The customer can reply at any time and those replies attach to the ticket.

## 5\. Detailed Scenario Walkthroughs

These show the AI's behaviour in realistic situations. (Customer messages in **bold**.)

### Scenario A - New customer, AC not cooling (the happy path)

**Customer:** Hi, my AC is not cooling

**AI:** Hi 👋 I'm the CoolBreeze assistant. I can raise a service request for you. May I have your name, please?

**Customer:** Ahmed Khan

**AI:** Thanks, Ahmed. Where is the AC located? Please share the address or area.

**Customer:** Villa 23, Al Barsha 2, Dubai

**AI:** Got it. Is it _one_ AC unit not cooling, or the whole house?

**Customer:** Just the living room one

**AI:** Understood. Is it blowing warm air, not turning on, or making a noise?

**Customer:** Blowing warm air

**AI:** If you can, please send a photo of the unit and its remote display - it helps the technician. (Optional, you can skip.)

**Customer:** _\[sends photo\]_

**AI:** Perfect 📷. Here's a summary: • Issue: AC not cooling (blowing warm air) - _Category: HVAC / Cooling_ • Location: Villa 23, Al Barsha 2, Dubai • Urgency: Medium Shall I create this service request? (Yes / No)

**Customer:** Yes

**AI:** ✅ Done! Your ticket number is **SR-1042**. Our team will contact you shortly with a visit time. You can message here anytime for updates.

**In the dashboard:** A new SR-1042 appears with category HVAC/Cooling, location, customer Ahmed Khan (new record created), the photo attached, priority Medium, and source = WhatsApp. The **Response SLA clock starts immediately** (Doc 4).

### Scenario B - Known customer, sends everything at once

**Customer:** This is Ahmed again, the same living room AC is leaking water now, it's urgent, water is dripping on the floor

**AI:** Hi Ahmed 👋 I found your details from your number. I understand the living-room AC is now **leaking water** and it's **urgent**. Is the leak ongoing right now?

**Customer:** Yes dripping continuously

**AI:** Got it. To avoid damage, please switch the unit off at the wall if it's safe. Here's the summary: • Issue: AC water leakage (ongoing) - _Category: HVAC / Drainage_ • Location: Villa 23, Al Barsha 2 (your saved address) • Urgency: **High** Create this request? (Yes / No)

**Customer:** Yes please hurry

**AI:** ✅ Ticket **SR-1067** created with **High** priority. Because it's urgent, our team is being notified now.

**Notes:** The AI (1) recognised the returning customer by number, (2) reused the saved address, (3) extracted issue + urgency from one message, (4) inferred **High** priority, which (via Doc 4) applies a tighter Response SLA.

### Scenario C - Vague opening message

**Customer:** hello

**AI:** Hi 👋 I'm the CoolBreeze assistant. I can help you raise a service request. Could you tell me what's not working or what you need help with?

**Customer:** problem

**AI:** No problem - let's figure it out together. Is it related to: 1️⃣ Air conditioning 2️⃣ Plumbing 3️⃣ Electrical 4️⃣ Something else? You can reply with a number or describe it.

**Customer:** 1

**AI:** Got it, an air-conditioning issue. What's happening with it - not cooling, not turning on, leaking, or noisy?

**Notes:** The AI never creates a ticket from "hello". It **guides** the customer with simple choices instead of leaving them stuck.

### Scenario D - Customer asks for a human

**Customer:** I don't want a bot, connect me to a person

**AI:** Of course. I'm connecting you to our support team. They'll reply here on WhatsApp during office hours (9 AM-6 PM). To help them, could you tell me in one line what it's about?

**Customer:** billing dispute on last service

**AI:** Thank you. I've flagged this for our team as a **billing query** and a member will respond here shortly.

**In the dashboard:** A ticket/handoff is created and routed to the human support queue, flagged "human requested". The AI steps back so a staff member can take over the chat.

### Scenario E - Out-of-scope / spam message

**Customer:** Do you sell second-hand cars?

**AI:** I'm the support assistant for CoolBreeze HVAC, so I can only help with air-conditioning and related services. If you have a cooling or plumbing issue, I'm happy to help! 😊

**Notes:** The AI politely declines and does **not** create a ticket for irrelevant messages.

### Scenario F - After-hours capture

**Customer (11:40 PM):** No cooling at all, very hot, please help

**AI:** Hi 👋 Thanks for reaching out. Our office hours are 9 AM-6 PM, but I'll capture your request now so the team can act first thing. Where is the unit located? _(…continues collecting details and creates the ticket…)_

**AI:** ✅ Ticket **SR-1101** created. Our team will reach out at the start of office hours. If this is an emergency, you can call our hotline on +971-4-000-0000.

**Notes:** Nothing is lost overnight. The ticket exists, the SLA clock behaves per your working-hours configuration (Doc 4), and the team starts the day with a ready ticket.

### Scenario G - Status update flowing back to the customer

After SR-1042 is assigned and worked on, the customer receives (on the same chat):

**AI:** 🔧 Update on **SR-1042**: Technician _Rahul_ has been assigned and will arrive between **2-4 PM today**.

_(later)_ **AI:** 🚗 Rahul is on the way to your location.

_(later)_ **AI:** ✅ Your request **SR-1042** is marked completed. How would you rate the service? ⭐1-5

**Customer:** 5

**AI:** Thank you, Ahmed! 🙏 We've recorded your 5-star rating.

**Notes:** These proactive messages use **WhatsApp-approved templates** (required when the business starts a conversation outside the 24-hour window). The customer's replies (rating, follow-up questions) attach back to the ticket.

## 6\. Edge Cases & How They're Handled

| **Situation**                                        | **AI behaviour**                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Customer sends only a photo, no text                 | AI asks "What's the issue with this?" and continues.                                                    |
| ---                                                  | ---                                                                                                     |
| Customer sends a voice note                          | AI transcribes it (if enabled) and treats it as text; otherwise asks them to type.                      |
| ---                                                  | ---                                                                                                     |
| Two different problems in one chat                   | AI offers to create **two** separate tickets and confirms each.                                         |
| ---                                                  | ---                                                                                                     |
| Customer goes silent mid-conversation                | AI saves a **draft**; sends one gentle reminder; if still no reply, keeps the draft so nothing is lost. |
| ---                                                  | ---                                                                                                     |
| Customer changes their mind ("actually cancel that") | AI cancels the draft before creation, or notes a cancellation request on an existing ticket.            |
| ---                                                  | ---                                                                                                     |
| Wrong/unsupported language                           | AI replies in a configured fallback language and/or offers human handoff.                               |
| ---                                                  | ---                                                                                                     |
| Cannot map issue to a category confidently           | AI uses a default/"Uncategorised" category and flags it for staff to re-classify.                       |
| ---                                                  | ---                                                                                                     |
| Duplicate request (same issue within minutes)        | AI detects it and asks "Is this the same as ticket SR-1042, or a new issue?"                            |
| ---                                                  | ---                                                                                                     |
| Abusive/inappropriate messages                       | AI stays professional, does not create a ticket, can mute/flag per policy.                              |
| ---                                                  | ---                                                                                                     |

## 7\. What Happens After the Ticket Is Created

Once created from WhatsApp, the Service Request is **identical to any other ticket** and follows your existing flow:

- Appears in the **dashboard Service Request list** with Source = WhatsApp.
- **SLA auto-applies** based on category/sub-category/priority/location (see Doc 4) and the clock starts.
- **Approval workflow** triggers if the request type/category requires it (see Doc 3).
- Staff **assign a technician**, schedule, execute, and close.
- Optional **invoice/payment** steps (which may themselves require approval - Doc 3).
- **Customer is kept informed** automatically on the same WhatsApp thread.

## 8\. What the Company Admin Can See & Control

- **Conversation log** per ticket - the full WhatsApp chat that produced it, for transparency/audit.
- **Override AI** - a staff member can jump into any live chat and take over (AI steps aside).
- **AI performance view** - tickets created by AI, average questions asked, handoff rate, abandoned drafts.
- **Tune the AI** - edit greeting, required fields, category mapping, and tone without code changes.
- **Block/allow list** - block known spam numbers.