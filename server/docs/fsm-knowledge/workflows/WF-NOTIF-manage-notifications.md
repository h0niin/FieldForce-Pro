# WF-NOTIF-manage-notifications — View, Mark Read, and Delete Notifications

## Module
Notifications — `NotificationsPage` (`/notifications`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).

---

## Steps — View Notifications

1. Click the **bell icon** in the top navigation bar, or navigate to `/notifications`.
2. The page header reads **"Notifications"** with subtitle showing unread count (e.g., "3 unread") or "All caught up".
3. Notifications are sorted: unread first, then by newest. Unread notifications have a blue "New" tag and a blue-tinted background.
4. Each notification shows: **title**, **body**, and a **relative timestamp** (e.g., "5 minutes ago").

---

## Steps — Mark a Single Notification as Read

### Prerequisite
- The notification must be unread (`is_read = false`). The "Mark as read" button only appears on unread items.

1. On an unread notification, click the **check icon** button (CheckOutlined, title: "Mark as read").
2. `markAsRead.mutate(notification.id)` is called immediately (no confirmation dialog).
3. The notification's background changes from blue-tinted to transparent, and the "New" tag disappears.

---

## Steps — Mark All Notifications as Read

### Prerequisite
- At least one unread notification must exist. The **Mark All as Read** button only renders when `unreadCount > 0`.

1. Click the **Mark All as Read** button (CheckCircleOutlined) in the page header.
2. `markAllRead.mutate()` is called. Button shows loading state while pending.
3. All notifications lose the blue highlight and "New" tags.

---

## Steps — Delete a Notification

1. On any notification (read or unread), click the **delete icon** button (DeleteOutlined, danger, title: "Delete").
2. `deleteNotification.mutate(notification.id)` is called immediately (no confirmation dialog).
3. The notification is removed from the list.

---

## Actions Summary

| Action | Button | Permission | API |
|---|---|---|---|
| View notifications | Bell icon / Navigate | Authenticated | `useNotifications` |
| Mark one as read | Check icon | Authenticated | `useMarkNotificationAsRead` |
| Mark all as read | **Mark All as Read** | Authenticated | `useMarkAllNotificationsAsRead` |
| Delete notification | Delete icon | Authenticated | `useDeleteNotification` |
