import openpyxl
from openpyxl.styles import (
    PatternFill, Font, Alignment, Border, Side, GradientFill
)
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()

# ── Styles ──────────────────────────────────────────────────────────────
HEADER_BG   = "1F3864"
OLD_BG      = "FFE0B2"
NEW_BG      = "C8E6C9"
SECTION_BG  = "E3F2FD"
ALT_ROW_BG  = "F5F5F5"
WHITE       = "FFFFFF"
RED_TEXT    = "C62828"
GREEN_TEXT  = "1B5E20"

def hfont(color=WHITE, bold=True, size=11):
    return Font(name="Calibri", bold=bold, color=color, size=size)

def fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)

def center():
    return Alignment(horizontal="center", vertical="center", wrap_text=True)

def left():
    return Alignment(horizontal="left", vertical="center", wrap_text=True)

thin = Side(style="thin", color="BDBDBD")
med  = Side(style="medium", color="9E9E9E")
def border(t=thin, l=thin, r=thin, b=thin):
    return Border(top=t, left=l, right=r, bottom=b)


# ══════════════════════════════════════════════════════════════════════════
# SHEET 1 – Feature Comparison
# ══════════════════════════════════════════════════════════════════════════
ws1 = wb.active
ws1.title = "Feature Comparison"
ws1.sheet_view.showGridLines = False
ws1.freeze_panes = "A3"

# Column widths
for col, w in [(1,5),(2,28),(3,38),(4,38),(5,18)]:
    ws1.column_dimensions[get_column_letter(col)].width = w

# Row 1 – Title
ws1.merge_cells("A1:E1")
ws1["A1"] = "FieldForce Pro — Original vs. Updated Model Comparison"
ws1["A1"].font = Font(name="Calibri", bold=True, size=16, color=WHITE)
ws1["A1"].fill = fill(HEADER_BG)
ws1["A1"].alignment = center()
ws1.row_dimensions[1].height = 36

# Row 2 – Column headers
headers = ["#", "Feature / Area", "Original Model", "Updated Model", "Status"]
header_fills = [HEADER_BG, HEADER_BG, "BF360C", "2E7D32", HEADER_BG]
for c, (h, bg) in enumerate(zip(headers, header_fills), 1):
    cell = ws1.cell(row=2, column=c, value=h)
    cell.font = hfont()
    cell.fill = fill(bg)
    cell.alignment = center()
    cell.border = border()
ws1.row_dimensions[2].height = 24

ROWS = [
    # (section_flag, #, Feature, Old, New, Status)
    (True,  "",  "DASHBOARD", "", "", ""),
    (False, "1", "KPI Cards",
     "Basic placeholders – static numbers only",
     "8 live KPI cards: Total Revenue, Payments Collected, Outstanding, Overdue, Active Jobs, Completion Rate, Today's Appointments, Pending Requests",
     "✅ Added"),
    (False, "2", "Revenue Chart",
     "No chart",
     "6-month Area Chart (Invoiced vs Collected) powered by Recharts",
     "✅ Added"),
    (False, "3", "Work Order Pipeline",
     "No chart",
     "Donut Pie chart showing WO status distribution with live data",
     "✅ Added"),
    (False, "4", "Invoice Overview",
     "No breakdown",
     "Per-status progress bars with count and total amount",
     "✅ Added"),
    (False, "5", "Estimate Pipeline",
     "No pipeline view",
     "Win rate %, total count, pipeline value cards + status tags",
     "✅ Added"),
    (False, "6", "Backend Stats API",
     "No dedicated endpoint",
     "Redis-cached /dashboards/stats, /activity-feed, /priority-summary endpoints",
     "✅ Added"),

    (True,  "",  "SERVICE REQUESTS", "", "", ""),
    (False, "7", "Request List – Tabs",
     "Only 'All Requests' and 'My Approvals' tabs",
     "Added 'Queue View' tab (priority sorted) and 'Flagged/Spam' tab",
     "✅ Added"),
    (False, "8", "Spam / Duplicate Detection",
     "Not present",
     "AI NLP similarity check on every new request; flagged with reason + confidence %",
     "✅ Added"),
    (False, "9", "Spam Warning in Detail View",
     "No warning shown",
     "Yellow alert banner showing spam reason and confidence score",
     "✅ Added"),
    (False,"10", "Priority Queue Management",
     "No queue UI",
     "Inline priority dropdown in Queue tab; PATCH /queue/:id/priority backend",
     "✅ Added"),
    (False,"11", "File Attachments",
     "No file upload",
     "Drag-and-drop FileUploadZone in Request Detail; stored in request_attachments table",
     "✅ Added"),

    (True,  "",  "WORK ORDERS", "", "", ""),
    (False,"12", "Technician Feedback",
     "No feedback mechanism",
     "Star-rating modal (TechnicianFeedbackModal) with comments on WO detail page",
     "✅ Added"),
    (False,"13", "Customer CSAT Banner",
     "No CSAT tracking",
     "Auto-shown banner on completed WOs to collect customer satisfaction score",
     "✅ Added"),
    (False,"14", "Work Order Attachments",
     "Basic attachment list",
     "Full upload/delete/download with Ant Design Upload component",
     "✅ Enhanced"),

    (True,  "",  "ONBOARDING", "", "", ""),
    (False,"15", "Onboarding Wizard",
     "No onboarding flow",
     "Multi-step OnboardingWizard modal auto-shown on first login for new users",
     "✅ Added"),
    (False,"16", "Onboarding Backend",
     "No endpoint",
     "GET /onboarding/status + PATCH /onboarding/complete in new ONBOARDING NestJS module",
     "✅ Added"),

    (True,  "",  "BACKEND – DATABASE", "", "", ""),
    (False,"17", "Users Table",
     "No onboarding_completed field",
     "Added: onboarding_completed (BOOLEAN), status, spam_flag_count columns",
     "✅ Migrated"),
    (False,"18", "Service Requests Table",
     "priority as ENUM; no spam columns",
     "priority changed to VARCHAR(10); added: is_spam, spam_reason, spam_confidence columns",
     "✅ Migrated"),
    (False,"19", "request_attachments Table",
     "Not present",
     "New table: id, tenant_id, request_id, file_name, file_url, file_size, uploaded_by",
     "✅ Added"),
    (False,"20", "request_audit_log Table",
     "Not present",
     "New table: tracks priority changes with old/new value, changed_by, reason",
     "✅ Added"),
    (False,"21", "technician_feedback Table",
     "Not present",
     "New table: work_order_id, rating, comments, is_customer_facing",
     "✅ Added"),
    (False,"22", "customer_satisfaction Table",
     "Not present",
     "New table: work_order_id, csat_score, feedback_text, submitted_at",
     "✅ Added"),

    (True,  "",  "BACKEND – MODULES", "", "", ""),
    (False,"23", "ONBOARDING Module",
     "Not present",
     "New NestJS module: OnboardingController + OnboardingService",
     "✅ Added"),
    (False,"24", "ATTACHMENTS Module",
     "Not present",
     "New NestJS module: AttachmentsController + AttachmentsService (multipart upload)",
     "✅ Added"),
    (False,"25", "FEEDBACK Module",
     "Not present",
     "New NestJS module: FeedbackController + FeedbackService",
     "✅ Added"),
    (False,"26", "Redis Cache Service",
     "Not present",
     "New RedisCacheService using ioredis; injected into DashboardsService",
     "✅ Added"),
    (False,"27", "Queue Controller",
     "Not present",
     "New QueueController: GET /queue + PATCH /queue/:id/priority",
     "✅ Added"),

    (True,  "",  "AI ENGINE (Python FastAPI)", "", "", ""),
    (False,"28", "NLP Similarity Endpoint",
     "Not present",
     "New /nlp/similarity endpoint using TF-IDF cosine similarity to detect duplicates",
     "✅ Added"),
    (False,"29", "NLP Router Registration",
     "Not registered",
     "Registered nlp router in ai/app/main.py",
     "✅ Added"),

    (True,  "",  "FRONTEND – NEW FILES", "", "", ""),
    (False,"30", "OnboardingWizard.tsx",     "Not present", "New component in components/onboarding/", "✅ Added"),
    (False,"31", "FileUploadZone.tsx",        "Not present", "New component in components/service-requests/", "✅ Added"),
    (False,"32", "TechnicianFeedbackModal.tsx","Not present","New component in components/feedback/", "✅ Added"),
    (False,"33", "use-attachments.ts",        "Not present", "New hook for attachment CRUD queries", "✅ Added"),
    (False,"34", "use-feedback.ts",           "Not present", "New hook for feedback queries", "✅ Added"),
    (False,"35", "feedback.api.ts",           "Not present", "New API module for feedback endpoints", "✅ Added"),
]

STATUS_COLORS = {
    "✅ Added":    ("E8F5E9", "1B5E20"),
    "✅ Enhanced": ("E3F2FD", "0D47A1"),
    "✅ Migrated": ("FFF3E0", "E65100"),
}

data_row = 3
for is_section, num, feat, old, new, status in ROWS:
    if is_section:
        ws1.merge_cells(f"A{data_row}:E{data_row}")
        cell = ws1.cell(row=data_row, column=1, value=f"  {feat}")
        cell.font = Font(name="Calibri", bold=True, size=11, color="1F3864")
        cell.fill = fill(SECTION_BG)
        cell.alignment = left()
        cell.border = border(l=Side(style="medium",color="1F3864"))
        ws1.row_dimensions[data_row].height = 20
        data_row += 1
        continue

    row_bg = WHITE if data_row % 2 == 0 else ALT_ROW_BG
    values = [num, feat, old, new, status]
    for c, val in enumerate(values, 1):
        cell = ws1.cell(row=data_row, column=c, value=val)
        cell.border = border()
        cell.alignment = center() if c in [1, 5] else left()

        if c == 1:
            cell.font = Font(name="Calibri", bold=True, size=10, color="757575")
            cell.fill = fill(row_bg)
        elif c == 2:
            cell.font = Font(name="Calibri", bold=True, size=10)
            cell.fill = fill(row_bg)
        elif c == 3:
            cell.font = Font(name="Calibri", size=10, color=RED_TEXT)
            cell.fill = fill(OLD_BG)
        elif c == 4:
            cell.font = Font(name="Calibri", size=10, color=GREEN_TEXT)
            cell.fill = fill(NEW_BG)
        elif c == 5:
            sc = STATUS_COLORS.get(status, (row_bg, "000000"))
            cell.fill = fill(sc[0])
            cell.font = Font(name="Calibri", bold=True, size=10, color=sc[1])

    ws1.row_dimensions[data_row].height = 36
    data_row += 1


# ══════════════════════════════════════════════════════════════════════════
# SHEET 2 – File Changes Summary
# ══════════════════════════════════════════════════════════════════════════
ws2 = wb.create_sheet("File Changes")
ws2.sheet_view.showGridLines = False
ws2.freeze_panes = "A3"

for col, w in [(1,5),(2,20),(3,48),(4,18),(5,36)]:
    ws2.column_dimensions[get_column_letter(col)].width = w

ws2.merge_cells("A1:E1")
ws2["A1"] = "FieldForce Pro — All Modified / Created Files"
ws2["A1"].font = Font(name="Calibri", bold=True, size=15, color=WHITE)
ws2["A1"].fill = fill(HEADER_BG)
ws2["A1"].alignment = center()
ws2.row_dimensions[1].height = 32

h2 = ["#", "Layer", "File Path", "Action", "What Changed"]
for c, h in enumerate(h2, 1):
    cell = ws2.cell(row=2, column=c, value=h)
    cell.font = hfont()
    cell.fill = fill(HEADER_BG)
    cell.alignment = center()
    cell.border = border()
ws2.row_dimensions[2].height = 22

file_rows = [
    # Layer, Path, Action, What Changed
    ("Frontend","web/src/pages/dashboard/DashboardPage.tsx","REWRITTEN","Full redesign: 8 KPI cards, area chart, donut chart, invoice & estimate breakdowns"),
    ("Frontend","web/src/pages/service-requests/RequestListPage.tsx","MODIFIED","Added Queue tab, Spam/Flagged tab, inline priority selector"),
    ("Frontend","web/src/pages/service-requests/RequestDetailPage.tsx","MODIFIED","Added spam warning banner + FileUploadZone attachments card"),
    ("Frontend","web/src/pages/work-orders/WorkOrderDetailPage.tsx","MODIFIED","Added TechnicianFeedbackModal + CSAT banner + feedback hooks"),
    ("Frontend","web/src/components/layout/AppLayout.tsx","MODIFIED","Integrated OnboardingWizard modal"),
    ("Frontend","web/src/components/onboarding/OnboardingWizard.tsx","NEW","Multi-step onboarding modal component"),
    ("Frontend","web/src/components/service-requests/FileUploadZone.tsx","NEW","Drag-and-drop file upload component with list and delete"),
    ("Frontend","web/src/components/feedback/TechnicianFeedbackModal.tsx","NEW","Star rating + comments feedback modal"),
    ("Frontend","web/src/hooks/use-dashboards.ts","MODIFIED","Added useDashboardStats, useDashboardActivityFeed, useDashboardPrioritySummary"),
    ("Frontend","web/src/hooks/use-service-requests.ts","MODIFIED","Added useQueue and useUpdatePriority hooks"),
    ("Frontend","web/src/hooks/use-attachments.ts","NEW","CRUD hooks for request attachments"),
    ("Frontend","web/src/hooks/use-feedback.ts","NEW","React Query hooks for technician feedback"),
    ("Frontend","web/src/api/dashboards.api.ts","MODIFIED","Added getStats(), getActivityFeed(), getPrioritySummary()"),
    ("Frontend","web/src/api/service-requests.api.ts","MODIFIED","Added getQueue() and updatePriority()"),
    ("Frontend","web/src/api/feedback.api.ts","NEW","New API module: createFeedback, getByWorkOrder"),
    ("Frontend","web/src/types/models.types.ts","MODIFIED","Added is_spam, spam_reason, spam_confidence to ServiceRequest"),

    ("Backend","server/src/database/startup-migrations.service.ts","MODIFIED","Added 6 new migration blocks for all new tables/columns"),
    ("Backend","server/src/database/database.providers.ts","MODIFIED","Registered RequestAttachment, RequestAuditLog, TechnicianFeedback, CustomerSatisfaction"),
    ("Backend","server/src/database/database.module.ts","MODIFIED","Added new entities to SequelizeModule models array"),
    ("Backend","server/src/USERS/users.entity.ts","MODIFIED","Added onboarding_completed, status, spam_flag_count columns"),
    ("Backend","server/src/SERVICE_REQUESTS/service_requests.entity.ts","MODIFIED","Changed priority to VARCHAR; added is_spam, spam_reason, spam_confidence"),
    ("Backend","server/src/SERVICE_REQUESTS/service_requests.service.ts","MODIFIED","Added getQueue(), updatePriority(), AI spam check in create()"),
    ("Backend","server/src/SERVICE_REQUESTS/service_requests.provider.ts","MODIFIED","Added REQUEST_AUDIT_LOGS provider"),
    ("Backend","server/src/SERVICE_REQUESTS/service_requests.module.ts","MODIFIED","Registered QueueController"),
    ("Backend","server/src/SERVICE_REQUESTS/request_audit_log.entity.ts","NEW","New entity for priority change audit trail"),
    ("Backend","server/src/SERVICE_REQUESTS/queue.controller.ts","NEW","GET /queue + PATCH /queue/:id/priority"),
    ("Backend","server/src/ATTACHMENTS/request_attachments.entity.ts","NEW","New entity for file attachments"),
    ("Backend","server/src/ATTACHMENTS/attachments.controller.ts","NEW","POST/GET /attachments/:requestId"),
    ("Backend","server/src/ATTACHMENTS/attachments.service.ts","NEW","File storage logic with local/S3 support"),
    ("Backend","server/src/ATTACHMENTS/attachments.module.ts","NEW","NestJS module wiring"),
    ("Backend","server/src/FEEDBACK/technician_feedback.entity.ts","NEW","Technician feedback entity"),
    ("Backend","server/src/FEEDBACK/customer_satisfaction.entity.ts","NEW","Customer satisfaction entity"),
    ("Backend","server/src/FEEDBACK/feedback.controller.ts","NEW","POST/GET /feedback endpoints"),
    ("Backend","server/src/FEEDBACK/feedback.service.ts","NEW","Feedback CRUD logic"),
    ("Backend","server/src/FEEDBACK/feedback.module.ts","NEW","NestJS module wiring"),
    ("Backend","server/src/ONBOARDING/onboarding.service.ts","NEW","getStatus() + markComplete() logic"),
    ("Backend","server/src/ONBOARDING/onboarding.controller.ts","NEW","GET /onboarding/status + PATCH /onboarding/complete"),
    ("Backend","server/src/ONBOARDING/onboarding.module.ts","NEW","NestJS module wiring"),
    ("Backend","server/src/DASHBOARDS/dashboards.controller.ts","MODIFIED","Added GET /dashboards/stats, /activity-feed, /priority-summary"),
    ("Backend","server/src/DASHBOARDS/dashboards.service.ts","MODIFIED","Added Redis caching + stats query methods"),
    ("Backend","server/src/DASHBOARDS/dashboards.provider.ts","MODIFIED","Added ServiceRequest and RequestAuditLog providers"),
    ("Backend","server/src/shared/services/redis-cache.service.ts","NEW","Redis wrapper using ioredis with get/set/del/invalidatePattern"),
    ("Backend","server/src/shared/shared.module.ts","MODIFIED","Exported RedisCacheService"),
    ("Backend","server/src/shared/constants/keynames.ts","MODIFIED","Added REQUEST_ATTACHMENTS, REQUEST_AUDIT_LOGS, TECHNICIAN_FEEDBACK, CUSTOMER_SATISFACTION keys"),
    ("Backend","server/src/app.module.ts","MODIFIED","Registered OnboardingModule, AttachmentsModule, FeedbackModule"),

    ("AI Engine","ai/app/api/nlp.py","NEW","TF-IDF cosine similarity endpoint /nlp/similarity for spam detection"),
    ("AI Engine","ai/app/main.py","MODIFIED","Registered nlp router in FastAPI app"),
]

ACTION_COLORS = {
    "NEW":      ("E8F5E9","1B5E20"),
    "MODIFIED": ("E3F2FD","0D47A1"),
    "REWRITTEN":("FFF3E0","BF360C"),
}
LAYER_COLORS = {
    "Frontend":  "E8EAF6",
    "Backend":   "E0F7FA",
    "AI Engine": "F3E5F5",
}

for i, (layer, path, action, desc) in enumerate(file_rows, 1):
    r = i + 2
    row_bg = LAYER_COLORS.get(layer, WHITE)
    ac, tc = ACTION_COLORS.get(action, (WHITE,"000000"))

    for c, val in enumerate([str(i), layer, path, action, desc], 1):
        cell = ws2.cell(row=r, column=c, value=val)
        cell.border = border()
        cell.alignment = center() if c in [1,2,4] else left()
        if c == 1:
            cell.font = Font(name="Calibri", bold=True, size=10, color="757575")
            cell.fill = fill(row_bg)
        elif c == 2:
            cell.font = Font(name="Calibri", bold=True, size=10)
            cell.fill = fill(row_bg)
        elif c == 3:
            cell.font = Font(name="Calibri", size=10, color="1A237E")
            cell.fill = fill(row_bg)
        elif c == 4:
            cell.font = Font(name="Calibri", bold=True, size=10, color=tc)
            cell.fill = fill(ac)
        elif c == 5:
            cell.font = Font(name="Calibri", size=10)
            cell.fill = fill(row_bg)
    ws2.row_dimensions[r].height = 30


# ══════════════════════════════════════════════════════════════════════════
# SHEET 3 – Stats Summary
# ══════════════════════════════════════════════════════════════════════════
ws3 = wb.create_sheet("Stats Summary")
ws3.sheet_view.showGridLines = False

for col, w in [(1,30),(2,18),(3,18)]:
    ws3.column_dimensions[get_column_letter(col)].width = w

ws3.merge_cells("A1:C1")
ws3["A1"] = "FieldForce Pro — Change Statistics"
ws3["A1"].font = Font(name="Calibri", bold=True, size=15, color=WHITE)
ws3["A1"].fill = fill(HEADER_BG)
ws3["A1"].alignment = center()
ws3.row_dimensions[1].height = 32

stats = [
    ("Metric", "Original", "Updated"),
    ("Total Features", "Core FSM only", "Core + 6 New Features"),
    ("Dashboard KPI Cards", "0 (placeholder)", "8 Live Cards"),
    ("Dashboard Charts", "0", "3 (Area, Pie, Progress Bars)"),
    ("Service Request Tabs", "2", "4 (+Queue, +Spam)"),
    ("File Attachment Support", "❌ No", "✅ Yes"),
    ("Onboarding Wizard", "❌ No", "✅ Yes"),
    ("AI Spam Detection", "❌ No", "✅ Yes (TF-IDF NLP)"),
    ("Priority Queue Management", "❌ No", "✅ Yes"),
    ("Technician Feedback", "❌ No", "✅ Yes"),
    ("Redis Caching", "❌ No", "✅ Yes"),
    ("New DB Tables Added", "0", "5 new tables"),
    ("New Backend Modules", "0", "3 (Onboarding, Attachments, Feedback)"),
    ("New Frontend Components", "0", "3 (Wizard, Upload, Feedback Modal)"),
    ("New API Endpoints", "0", "~12 new endpoints"),
    ("New Files (Total)", "0", "~18 new files"),
    ("Modified Files (Total)", "—", "~28 files modified"),
]

for i, row in enumerate(stats):
    r = i + 2
    for c, val in enumerate(row, 1):
        cell = ws3.cell(row=r, column=c, value=val)
        cell.border = border()
        cell.alignment = center()
        if i == 0:
            cell.font = hfont()
            cell.fill = fill(HEADER_BG)
        else:
            bg = ALT_ROW_BG if i % 2 == 0 else WHITE
            if c == 2:
                cell.font = Font(name="Calibri", size=11, color=RED_TEXT)
                cell.fill = fill(OLD_BG)
            elif c == 3:
                cell.font = Font(name="Calibri", size=11, color=GREEN_TEXT)
                cell.fill = fill(NEW_BG)
            else:
                cell.font = Font(name="Calibri", bold=True, size=11)
                cell.fill = fill(bg)
    ws3.row_dimensions[r].height = 24

# Save
out = r"c:\Users\nevil\Desktop\fieldforce pro\FieldForce Pro - Model Comparison.xlsx"
wb.save(out)
print(f"Saved: {out}")
