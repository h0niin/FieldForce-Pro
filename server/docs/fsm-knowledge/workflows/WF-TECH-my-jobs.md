# WF-TECH-my-jobs — View & Manage Assigned Jobs (My Jobs)

## Module
My Jobs (Technician view) — `MyJobsPage` (`/work-orders/my-jobs`). This is the **Technician** role's view of work orders assigned to them.

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- The user must have work orders assigned to them; the list is scoped to the current technician's jobs via `GET /work-orders/my-jobs`.

---

## Steps — View Your Assigned Jobs

1. Navigate to `/work-orders/my-jobs`. The page header shows the **My Jobs** title and subtitle.
2. The list loads via the `useMyJobs` hook (`GET /work-orders/my-jobs`), fetching up to 50 jobs (`take: 50`).
3. While loading, a centered loading **Spin** indicator is shown.
4. Each assigned job is displayed as a **JobCard** showing:
   - **WO number** (`wo_number`).
   - A **status** tag, color-coded by job status.
   - A **priority** tag, color-coded by priority.
   - The job **summary** (title).
   - **Contact** name (first + last), shown with a user icon — only if a contact exists.
   - **Location** address, shown with a location icon — only if a location address exists.
   - **Scheduled start** date/time formatted as "MMM D, YYYY h:mm A", shown with a calendar icon — only if `scheduled_start` is set.
5. If no jobs match, an **Empty** state is shown:
   - On the **All** tab: "no jobs assigned" message.
   - On a status tab: "no jobs" message for that specific status.

---

## Steps — Filter Jobs by Status

1. At the top of the list, use the **Tabs** bar to filter by job status. Available tabs:
   - **All** (`all`) — default; fetches with `{ take: 50 }`.
   - **New** (`new`)
   - **Scheduled** (`scheduled`)
   - **In Progress** (`in_progress`)
   - **Completed** (`completed`)
2. Selecting a status tab refetches `useMyJobs` with `{ take: 50, status: <tab> }`, returning only jobs in that status.
3. The **All** tab does not send a `status` filter and returns jobs across all statuses.

Status tag colors used on each card: new = blue, estimated = cyan, approved = geekblue, scheduled = purple, in_progress = orange, on_hold = gold, completed = green, closed = default, cancelled = red.

Priority tag colors: low = default, medium = blue, high = orange, urgent = red.

---

## Steps — Open a Job's Details

1. On any job card, click the **View Job** button (eye icon).
2. The app navigates to the work order detail page at `/work-orders/{id}` for that job.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| View assigned jobs | Open `/work-orders/my-jobs` | Authenticated (Technician) | `useMyJobs` → `GET /work-orders/my-jobs?take=50` |
| Filter by status | **Tabs**: All / New / Scheduled / In Progress / Completed | Authenticated (Technician) | `useMyJobs` with `status` param |
| Open job details | **View Job** button (eye icon) | Authenticated (Technician) | Navigates to `/work-orders/{id}` |
