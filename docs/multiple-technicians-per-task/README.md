# Multiple Technicians per Task (Hanin)

Service Requests and Work Orders now support assigning multiple technicians to a single task instead of just a primary assignee.

---

## Overview

### Problem (Before)
A Service Request only had a single `assigned_to` field, which limited teams when a job required a crew or multiple agents.

### Solution (After)
Introduced a many-to-many junction table (`service_request_technicians`) that links `ServiceRequest` and `User`. 
The UI has been upgraded to a multi-select dropdown for assigning technicians, and the backend handles syncing these `technician_ids`.

## Changes Made

### Backend
1. **Junction Entity (`service_request_technician.entity.ts`)**: Created the junction table `ServiceRequestTechnician` with a unique constraint on `(service_request_id, technician_id)`.
2. **Relationships (`service_requests.entity.ts`)**: Added `BelongsToMany` association to link ServiceRequests with Users (technicians).
3. **Database Module (`database.module.ts`)**: Registered the new `ServiceRequestTechnician` model.
4. **Service Logic (`service_requests.service.ts`)**: 
    - Extracted `technician_ids` from incoming DTOs in `create()` and `update()`.
    - Maintained backward compatibility by designating the first technician as the primary `assigned_to`.
    - Adjusted `assignTechnician()` to use Sequelize's `$add` method so that assigning a technician appends to the crew instead of wiping out existing assignees.

### Frontend
1. **API Endpoints (`service-requests.api.ts`)**: Added `technician_ids` array to the Create and Update payloads.
2. **Assign Technician Modal (`RequestDetailPage.tsx`)**: Replaced the single-select dropdown with a `mode="multiple"` `Select` component. The modal now pre-populates with the already assigned technicians.
3. **Service Request Details (`RequestDetailPage.tsx`)**: Upgraded the details card to display multiple technician tags instead of just one.
4. **Service Request List (`RequestListPage.tsx`)**: Upgraded the list columns to map through and display multiple technician avatars/initials for each request.

---

## How to Test

### 1. Create Technicians
To test multiple technicians, you first need multiple users in the system to assign tasks to.
1. Navigate to the **Users** tab (e.g., `/users`).
2. Click **Invite User** or **Create User**.
3. Create at least 2 or 3 users (make sure to assign them a Role like Technician).

### 2. Assign Multiple Technicians to a Service Request
1. Navigate to **Service Requests** and select an existing request to view its details.
2. Click the **Assign Technician** button in the top right.
3. In the modal, you should now be able to search and select *multiple* technicians from the dropdown.
4. Click **Save**.
5. The Service Request details page will refresh and display tags for all the selected technicians under "Assigned Technicians".

### 3. Verify in the List View
1. Go back to the **Service Requests** list page.
2. Check the "Technicians" column for the request you just modified.
3. You should see multiple initials tags side-by-side representing the crew assigned to that task.
