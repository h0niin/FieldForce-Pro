# WF-SET-configure-notification-preferences

## Module
Settings > Notification Preferences

## Route
`/settings/notifications`

## Sidebar Navigation
This route is registered in `routes.tsx` but the sidebar child item (`Notifications`) is commented out. Navigate directly to `/settings/notifications`.

---

## Prerequisites

- User must be authenticated (PrivateRoute).
- No additional permission guard is present on this page; any authenticated user who can reach the route may configure preferences.

---

## Page Layout

Page header title: **Notification Preferences**  
Page header subtitle: "Configure how and when you receive notifications"

The form is divided into four `Card` sections:

1. **Global Settings**
2. **Event Notifications**
3. **Quiet Hours**
4. **Digest Notifications**

A **Save Preferences** button (primary, SaveOutlined icon) is rendered in a fifth card at the bottom of the form.

---

## Steps: Configure Global Notification Channels

1. Navigate to `/settings/notifications`.
2. In the **Global Settings** card, four channel toggles are available:
   - **Email Notifications** ("Receive notifications via email") — Switch (name: `email_enabled`)
   - **SMS Notifications** ("Receive notifications via text message") — Switch (name: `sms_enabled`)
   - **Push Notifications** ("Receive push notifications on mobile devices") — Switch (name: `push_enabled`)
   - **In-App Notifications** ("Show notification bell in the app") — Switch (name: `in_app_enabled`)
3. Click each Switch to enable or disable that channel globally.

---

## Steps: Configure Per-Event Notification Channels

1. Scroll to the **Event Notifications** card.
2. Each row represents an event type. The header labels the three channel columns: **Email**, **SMS**, **Push** (each shown as a small icon Switch).
3. Available event rows:
   - **Work Order Assigned**
   - **Work Order Completed**
   - **Appointment Scheduled**
   - **Appointment Reminder**
   - **Estimate Approved**
   - **Invoice Generated**
   - **Payment Received**
4. For each event row, toggle the three Switches independently:
   - MailOutlined icon Switch — email channel for this event
   - MessageOutlined icon Switch — SMS channel for this event
   - MobileOutlined icon Switch — push channel for this event

---

## Steps: Configure Quiet Hours

1. Scroll to the **Quiet Hours** card.
2. Toggle **Enable Quiet Hours** Switch (`checkedChildren="Enabled"` / `unCheckedChildren="Disabled"`; field name: `quiet_hours_enabled`).
3. An info Alert "Notifications will not be sent during quiet hours" is always displayed in this card.
4. Set **Start Time** using the time picker (format `HH:mm`; field name: `quiet_hours_start`; default `22:00`).
5. Set **End Time** using the time picker (format `HH:mm`; field name: `quiet_hours_end`; default `08:00`).

---

## Steps: Configure Digest Notifications

1. Scroll to the **Digest Notifications** card.
2. **Daily Digest** row ("Receive a daily summary of all notifications"):
   - Set the delivery time using the inline time picker (format `HH:mm`; field name: `daily_digest_time`; default `18:00`).
   - Toggle the Switch (field name: `daily_digest_enabled`) to enable or disable the daily digest.
3. **Weekly Digest** row ("Receive a weekly summary"):
   - Select the day of week from the inline Select dropdown (field name: `weekly_digest_day`):
     - Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
   - Toggle the Switch (field name: `weekly_digest_enabled`) to enable or disable the weekly digest.

---

## Steps: Save All Preferences

1. After configuring any combination of the sections above, click **Save Preferences** (primary button, SaveOutlined icon) in the bottom card.
2. While saving, the button shows a loading spinner (`loading={saving}`).
3. On success: notification "Notification preferences saved successfully" appears.
4. On failure: notification "Failed to save preferences" appears.

---

## Actions Summary

| Action | Trigger | Effect |
|---|---|---|
| Toggle global channel switch | onClick Switch (email_enabled / sms_enabled / push_enabled / in_app_enabled) | Updates form state |
| Toggle per-event channel switch | onClick Switch on event row (email / sms / push columns) | Updates nested form state |
| Toggle Enable Quiet Hours | onClick Switch (quiet_hours_enabled) | Updates form state |
| Set Start Time | TimePicker onChange (quiet_hours_start) | Updates form state |
| Set End Time | TimePicker onChange (quiet_hours_end) | Updates form state |
| Set Daily Digest Time | TimePicker onChange (daily_digest_time) | Updates form state |
| Toggle Daily Digest | onClick Switch (daily_digest_enabled) | Updates form state |
| Select Weekly Digest Day | Select onChange (weekly_digest_day) | Updates form state |
| Toggle Weekly Digest | onClick Switch (weekly_digest_enabled) | Updates form state |
| Submit form | Click "Save Preferences" | handleSubmit: simulated API call; success or error notification |
