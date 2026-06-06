# FieldForce Pro — Mobile App Tasks (Field Worker App)

> Mobile app is for **field technicians/workers only** — NOT admin panel.
> Focused on daily field operations: jobs, navigation, checklists, payments, tracking.
>
> **Last Updated:** 2026-02-25

---

## Progress Overview

| # | Feature | Status |
|---|---------|--------|
| 1 | App Setup & Foundation | Complete |
| 2 | Login & Authentication | Partial |
| 3 | Home — Today's Jobs | Complete |
| 4 | Schedule & Calendar | Complete |
| 5 | Work Order Details & Actions | Partial |
| 6 | Appointment Flow (Trip → On-Site → Complete) | Complete |
| 7 | Job Sheet / Checklist | Complete |
| 8 | Timesheet & Clock In/Out | Complete |
| 9 | GPS Tracking & Navigation | Complete |
| 10 | Estimates (On-Site) | Complete |
| 11 | Invoice & Payment Collection | Complete |
| 12 | Customer Info (View Only) | Partial |
| 13 | Asset Lookup (On-Site) | Complete |
| 14 | Notifications | Not Started |
| 15 | Offline Support | Partial |
| 16 | Profile & Settings | Complete |

---

## 1. App Setup & Foundation

- [x] Initialize Expo project with Expo Router
- [x] Set up WatermelonDB for offline storage
- [x] Set up MMKV for token/preferences storage
- [x] Create tab navigation layout (Home, Schedule, Map, Notifications, Profile)
- [x] Create API client with offline queue
- [x] Create shared components (StatusBadge, JobCard, PhotoCapture, SignaturePad, OfflineIndicator)

---

## 2. Login & Authentication

- [x] Login screen
- [x] Forgot password screen
- [x] Biometric login (Face ID / Fingerprint)
- [x] Secure token storage (MMKV)
- [ ] Auto-refresh token logic

---

## 3. Home — Today's Jobs

- [x] Today's assigned work orders list
- [x] Job card with status, priority, customer, time
- [x] Tap to open work order detail
- [x] Status update from home screen

---

## 4. Schedule & Calendar

- [x] Daily schedule view with time slots
- [x] Appointment list for the day/week
- [x] Accept/reject appointment
- [x] Navigate to job site (deep link to Maps)

---

## 5. Work Order Details & Actions

- [x] Work order detail screen (info, notes, attachments)
- [x] Update work order status from field
- [x] Add notes to work order
- [x] Upload photos/attachments from camera
- [ ] View work order line items (services/parts used)

---

## 6. Appointment Flow (Trip → On-Site → Complete)

- [x] Start trip — begin navigation to job site
- [x] On-site actions — checklist, photos, notes
- [x] Customer signature capture
- [x] Complete job — mark appointment done

---

## 7. Job Sheet / Checklist

- [x] Step-by-step checklist completion
- [x] Photo capture per checklist item
- [x] Customer signature at end
- [x] Offline checklist completion (sync later)

---

## 8. Timesheet & Clock In/Out

- [x] Clock in / clock out buttons
- [x] Manual timesheet entry
- [x] Trip auto-logging (start/end based on movement)
- [x] Trip history view

---

## 9. GPS Tracking & Navigation

- [x] Background GPS tracking
- [x] Navigation to job site (Google Maps / Apple Maps)
- [x] Map tab with current location

---

## 10. Estimates (On-Site)

- [x] Create estimate on-site
- [x] View estimate details
- [x] Customer signature for estimate approval

---

## 11. Invoice & Payment Collection

- [x] View invoice on-site
- [x] Send invoice to customer (email/SMS)
- [x] Collect payment on-site (Stripe Terminal)
- [x] Payment receipt screen

---

## 12. Customer Info (View Only)

- [x] Search customer/contact
- [x] View customer details
- [x] Quick-call customer
- [x] Quick-navigate to customer location
- [ ] Offline customer history (WatermelonDB cache)

---

## 13. Asset Lookup (On-Site)

- [x] Search asset by name
- [x] Barcode/serial number scan for asset lookup
- [x] View asset details & service history

---

## 14. Notifications

- [ ] Push notification handling (FCM)
- [ ] In-app notification feed
- [ ] Quick reply to messages
- [ ] FCM configuration in app layout

---

## 15. Offline Support

- [x] WatermelonDB models for offline data
- [x] Offline sync engine
- [x] Offline indicator component
- [x] Offline checklist completion
- [ ] Offline customer history caching
- [ ] Offline pricebook caching

---

## 16. Profile & Settings

- [x] User profile screen
- [x] Document upload (certifications, licenses)
- [x] Document viewer
- [x] App settings screen

---

## Summary

| Status | Count |
|--------|:-----:|
| **Completed** | 45 |
| **Remaining** | 8 |
| **Total** | **53** |

### Remaining Tasks

1. Auto-refresh token logic
2. View work order line items screen
3. Offline customer history caching
4. Push notification handling (FCM)
5. In-app notification feed
6. Quick reply to messages
7. FCM configuration in app layout
8. Offline pricebook caching
