# Workforce Management

Workforce management covers all the tools for organising your team: territories, shifts, crews, time off, holidays, skills, and equipment.

---

## Territories

### What is a Territory?
A territory is a geographical zone (drawn on a map) that defines which area a specific team or technician covers. Territories help dispatchers assign jobs to the right person quickly and ensure each area is covered.

### Accessing Territories
Go to **Settings → Territories** or **Workforce → Territories**.

### Creating a Territory
1. Go to the Territories section.
2. Click **+ New Territory**.
3. Enter a **Name** (e.g., "North District", "Zone A").
4. Enter a **Description** (optional).
5. On the map, draw the territory boundary by clicking to place polygon points around the area.
6. Choose a **Color** for the territory (shown on maps).
7. Click **Save**.

Once territories are defined, service locations within those boundaries automatically show a territory tag.

---

## Crews

### What is a Crew?
A crew is a group of technicians who work together on jobs. One technician is the crew lead. Crews can be assigned as a unit to a work order or appointment.

### Accessing Crews
Go to **Workforce → Crews**.

### Creating a Crew
1. Go to **Workforce → Crews**.
2. Click **+ New Crew**.
3. Enter a **Crew Name** (e.g., "Team Alpha").
4. Select a **Crew Lead** (the technician in charge).
5. Select a **Territory** (optional — the area this crew covers).
6. Click **+ Add Members** to search and add other technicians to the crew.
7. Click **Save**.

### Assigning a Crew to a Work Order
- When scheduling, you can assign an entire crew to a work order instead of individual technicians.
- Go to the work order and click **Assign Crew** to select a crew.
- All crew members get notified and the appointment appears on each member's schedule.

---

## Shifts

### What is a Shift?
A shift defines the working hours for a technician or team. The scheduling board uses shifts to show when technicians are available for dispatch.

### Creating a Shift
1. Go to **Workforce → Shifts** (or **Settings → Shifts**).
2. Click **+ New Shift**.
3. Enter a **Shift Name** (e.g., "Morning Shift", "On-Call Weekend").
4. Set **Start Time** and **End Time**.
5. Select which **Days of the Week** this shift applies.
6. Toggle **Active** on.
7. Click **Save**.

---

## Time Off

### What is Time Off?
A time off record tracks when a technician is unavailable — vacation, sick leave, personal leave, training, etc. The scheduling board shows technicians as unavailable during approved time off.

### Requesting Time Off (Technician)
1. Go to **Workforce → Time Off** or **More → Time Off** in the mobile app.
2. Click **+ Request Time Off**.
3. Select the **Type** (Annual Leave, Sick Leave, Personal Leave, Training, etc.).
4. Select **Start Date** and **End Date**.
5. Enter a **Reason**.
6. Click **Submit**.

### Approving or Rejecting Time Off (Admin/Manager)
1. Go to **Workforce → Time Off**.
2. Filter by **Status = Pending** to see requests awaiting decision.
3. Click the request to open it.
4. Click **Approve** or **Reject**.
5. The technician is notified of the decision.

### Time Off Statuses
- **Pending** — submitted, awaiting manager decision
- **Approved** — manager approved, technician is marked unavailable in the scheduling board
- **Rejected** — manager rejected the request

---

## Holidays

### What is a Holiday?
Holidays are company-wide dates when no work is scheduled (or overtime rules apply). They appear on the scheduling board as blocked-out days.

### Adding a Holiday
1. Go to **Settings → Holidays** or **Workforce → Holidays**.
2. Click **+ New Holiday**.
3. Enter the **Holiday Name** (e.g., "Christmas Day").
4. Select the **Date**.
5. Toggle **Is Recurring** to automatically repeat every year.
6. Optionally restrict it to specific territories.
7. Click **Save**.

---

## Skills

### What is a Skill?
Skills tag technicians with their certifications and capabilities (e.g., "Refrigerant Handling License", "Electrical Level 2", "Gas Safe Registered"). The AI scheduling engine uses skills to match the right technician to jobs that require specific qualifications.

### Adding a Skill Definition
1. Go to **Workforce → Skills** or **Settings → Skills**.
2. Click **+ Add Skill**.
3. Enter a **Skill Name** and **Category**.
4. Click **Save**.

### Assigning a Skill to a Technician
1. Open the user's profile (**Settings → Users → [Technician Name]**).
2. Click the **Skills** tab.
3. Click **+ Add Skill**.
4. Select the skill.
5. Select the **Proficiency Level** (Beginner, Intermediate, Expert).
6. Set a **Certified Until** date if the certification expires.
7. Click **Save**.

---

## Equipment (Tools & Vehicles)

### What is Equipment?
Equipment tracks the tools, vehicles, and machinery assigned to your technicians. Examples: service van (Reg: VAN-001), drill kit, leak detection device.

### Accessing Equipment
Go to **Workforce → Equipment**.

### Adding Equipment
1. Go to **Workforce → Equipment**.
2. Click **+ Add Equipment**.
3. Fill in: **Name**, **Type** (Vehicle, Tool, Machinery), **Serial Number**, **Assigned To** (which technician), **Condition** (Good/Fair/Poor), **Last Maintenance Date**.
4. Click **Save**.

---

## Agent / Technician List

Go to **Workforce → Agents** to see all technicians in one view with:
- Current availability status
- Active appointment (if any)
- Territory they cover
- Skills and certifications
