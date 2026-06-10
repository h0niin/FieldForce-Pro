# WF-ROLE-create-custom-role — Create a Custom User Role

## Prerequisites
- User must have the `settings:manage` permission (Admin).

## Steps

1. Go to **Settings → Roles & Permissions** in the sidebar.
2. Click **+ New Role**.
3. Enter a **Role Name** (e.g., "Field Supervisor", "Finance Manager", "Site Inspector").
4. Enter a **Description** explaining who this role is for.
5. Configure permissions by toggling them on or off. Permissions are grouped by module:

   **Work Orders:** read, create, update, delete, change-status
   **Service Requests:** read, create, update, delete, approve, reject, convert
   **Estimates:** read, create, update, delete, send, approve, reject
   **Invoices:** read, create, update, delete, send, record-payment, void
   **Scheduling:** read, create, update, delete (appointments)
   **Contacts:** read, create, update, delete
   **Assets:** read, create, update, delete
   **Timesheets:** read, create, update, approve, reject
   **Reports:** read, create
   **Settings:** manage
   **Users:** read, create, update, deactivate
   **Audit Logs:** read
   **Chatbot:** use

6. Click **Save Role**.
7. To assign this role to a user:
   - Go to **Settings → Users**
   - Open the user's profile
   - In the **Role** field, select the new custom role
   - Click **Save**

## Result
A custom role is created with the exact permissions you defined. Users assigned this role can only perform the actions their permissions allow. The role applies immediately to all users assigned to it.

## Important Notes
- Changing a role's permissions immediately affects ALL users with that role.
- If a user should have different permissions from others on their team, create a separate custom role rather than modifying a shared one.
- Built-in roles (Admin, Dispatcher, Technician, Manager) cannot be deleted but can be edited.
