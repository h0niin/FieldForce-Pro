# Approval Workflow Module - Build Guide & Task List (IMPROVED)

## Overview
Build a complete Approval Workflow module for a React + NestJS + Sequelize + PostgreSQL application.
This module enables multi-level sequential document approvals with threshold-based dynamic routing.

**This guide includes 30+ improvements over the AGS version** covering security, performance, UX, and code quality.

---

## MASTER PROMPT (Use this to instruct AI or developers)

```
Build an Approval Workflow module with the following requirements:

TECH STACK: React + TypeScript + Ant Design (frontend), NestJS + Sequelize-TypeScript + PostgreSQL (backend)

CORE FEATURES:
1. Workflow Templates - Create/manage approval chain templates with version history
2. Workflow Approvers - Configure approvers per template with order/sequence and thresholds
3. Document Approvals - Track approval records for each document submission
4. Sequential/Cascading Approvals - Level 1 must complete before Level 2 is notified
5. Threshold-based Dynamic Routing - Different approvers based on document amount/budget
6. Email Notifications with Retry - Notify approvers when it's their turn, retry on failure
7. Audit Trail with History Table - Full history of all approval actions with timestamps
8. Approval Deadlines & Escalation - SLA tracking with auto-escalation
9. Bulk Approval - Approve multiple documents at once
10. Approval Delegation - Temporarily delegate approval authority
11. Approval Dashboard - Statistics, bottlenecks, turnaround times
12. Idempotent Processing - Prevent duplicate approval submissions

DOCUMENT TYPES: INVOICE, QUOTATION, VENDOR, CONTRACT, DRAFT_INVOICE, PRQ, PO, PROFORMA,
PAYMENT_REQUEST, SERVICE_CONTRACT, PETTY_CASH, PURCHASE_REQUEST, SERVICE_REQUEST,
PETTY_CASH_REPORT, RESOURCE_BOOKING

DOCUMENT CATEGORIES: PROCUREMENT, SERVICE, MAINTENANCE, FINANCE, VENDOR, PROGRAM, BUDGET, OTHER

APPROVAL STATUSES: PENDING, APPROVED, REJECTED, SKIPPED, CORRECTION_REQUIRED

SIDEBAR NAVIGATION:
- Section: "Approval Workflow"
  - Templates (/workflow/templates) - CRUD for workflow templates
  - Document Approvals (/workflow/document-approvals) - View/process approvals
  - Dashboard (/workflow/dashboard) - Approval analytics & stats

QUALITY REQUIREMENTS:
- Use NestJS Logger (NOT console.log)
- All inputs validated with class-validator DTOs
- Standardized API response format (DataResponseDto)
- Database indexes on frequently queried columns
- Proper transaction handling with rollback
- Input sanitization for XSS prevention
- Server-side search & pagination (NOT client-side)
- React Error Boundaries on all pages
- Loading skeletons for better UX
- Confirmation dialogs for destructive actions
```

---

## IMPROVEMENTS OVER AGS VERSION

### Backend Improvements
1. Use NestJS Logger instead of console.log (AGS uses 50+ console.logs)
2. Strict DTO validation on ALL endpoints (AGS has `@Query() query: any`)
3. Standardized response format - all endpoints return `{ data, meta, message }` (AGS is inconsistent)
4. Idempotency check - prevent processing already-actioned approvals (AGS allows duplicate submissions)
5. Database indexes on frequently queried columns (AGS has none)
6. Aggregate queries for stats instead of loading all records into memory (AGS loads entire table)
7. Batch user loading to prevent N+1 queries (AGS queries users in loops)
8. Soft delete for templates with `deleted_at` (AGS hard-deletes)
9. Dependency check before delete - can't delete template with active approvals (AGS doesn't check)
10. Unique constraint on active template per document_type (AGS has race condition)
11. Approval deadline/SLA tracking with `due_date` field (AGS has none)
12. Proper threshold validation - min < max (AGS doesn't validate ranges)
13. Duplicate approver detection (AGS allows same person at multiple levels)
14. Input sanitization on comments field to prevent XSS (AGS stores raw input)
15. Email notification retry with failure alerting (AGS silently swallows email errors)
16. Version increment on ALL template changes (AGS only increments on approver changes)

### Frontend Improvements
17. Server-side search with debounce (AGS only filters current page)
18. React Error Boundaries on all workflow pages (AGS has none)
19. Loading skeletons for stats cards and tables (AGS shows nothing while loading)
20. Confirmation dialog before approval actions (AGS has no confirmation)
21. Document context in approval modal - show name, amount, requestor (AGS only shows ID)
22. Approval timeline/history view in details modal (AGS doesn't show full history)
23. Disable "Request Correction" for first approver with tooltip (AGS shows error after click)
24. Dynamic form labels - "(optional)" for approve comments, "(required)" for reject (AGS has static labels)
25. Request cancellation on component unmount via AbortController (AGS has memory leak potential)
26. Locale-aware date formatting (AGS has hardcoded YYYY-MM-DD)
27. Dirty state tracking on template form - disable save when no changes (AGS allows empty saves)
28. Template preview panel before save (AGS has no preview)
29. Drag-and-drop approver reordering (AGS auto-normalizes silently)
30. Bulk approval capability - checkbox select + bulk action (AGS is one-at-a-time)
31. Approval dashboard with turnaround time analytics (AGS has no dashboard)

---

## PHASE 1: DATABASE & BACKEND FOUNDATION

### Task 1.1: Create Database Enums & Shared Types
**Description:** Create TypeScript enums for the workflow module
**Files to create:**
- `src/shared/enums/workflow.enum.ts`

```typescript
export enum DocumentTypeEnum {
  INVOICE = 'INVOICE',
  QUOTATION = 'QUOTATION',
  VENDOR = 'VENDOR',
  CONTRACT = 'CONTRACT',
  DRAFT_INVOICE = 'DRAFT_INVOICE',
  PRQ = 'PRQ',
  PO = 'PO',
  PROFORMA = 'PROFORMA',
  PAYMENT_REQUEST = 'PAYMENT_REQUEST',
  SERVICE_CONTRACT = 'SERVICE_CONTRACT',
  PETTY_CASH = 'PETTY_CASH',
  PURCHASE_REQUEST = 'PURCHASE_REQUEST',
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  PETTY_CASH_REPORT = 'PETTY_CASH_REPORT',
  RESOURCE_BOOKING = 'RESOURCE_BOOKING',
}

export enum DocumentCategoryEnum {
  PROCUREMENT = 'PROCUREMENT',
  SERVICE = 'SERVICE',
  MAINTENANCE = 'MAINTENANCE',
  FINANCE = 'FINANCE',
  VENDOR = 'VENDOR',
  PROGRAM = 'PROGRAM',
  BUDGET = 'BUDGET',
  OTHER = 'OTHER',
}

export enum ApprovalStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED',
  CORRECTION_REQUIRED = 'CORRECTION_REQUIRED',
}

export enum ApprovalActionEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_CORRECTION = 'REQUEST_CORRECTION',
  SKIP = 'SKIP',
  DELEGATE = 'DELEGATE',
  ESCALATE = 'ESCALATE',
}
```

**IMPROVEMENT:** Use string enum values (AGS uses numeric), add `ApprovalActionEnum` for type-safe actions.

### Task 1.2: Create Workflow Templates Entity
**File:** `src/WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.entity.ts`

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key, auto-generated |
| name | STRING | Workflow template name, **UNIQUE per document_type** |
| description | TEXT | Optional description |
| document_type | ENUM(DocumentTypeEnum) | Which document type this applies to |
| document_category | ENUM(DocumentCategoryEnum) | Category grouping |
| version | INTEGER | Template version (default: 1) |
| is_active | BOOLEAN | Active/inactive toggle |
| deleted_at | DATE | **NEW: Soft delete timestamp (null = not deleted)** |
| created_at | DATE | Auto timestamp |
| updated_at | DATE | Auto timestamp |

**Relationships:** HasMany → WorkflowApprovers (as 'approvers')

**IMPROVEMENTS:**
- Add `deleted_at` for soft delete (AGS hard-deletes)
- Add unique constraint on `(name, document_type)` to prevent duplicate names
- Add partial unique index: only one `is_active=true` per `document_type + document_category` combo

### Task 1.3: Create Workflow Approvers Entity
**File:** `src/WORKFLOW/WORKFLOW_APPROVERS/workflow_approvers.entity.ts`

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| workflow_template_id | UUID | FK to WorkflowTemplates |
| approver_id | UUID | FK to Users table |
| order_no | INTEGER | Approval sequence (1, 2, 3...) |
| approval_authority | INTEGER | Authority level |
| amount_threshold_min | DECIMAL | **NEW: Minimum amount threshold** |
| amount_threshold_max | DECIMAL | **NEW: Maximum amount threshold** |
| budget_threshold | DECIMAL | Budget percentage threshold |
| is_required | BOOLEAN | **NEW: Whether this approver can be skipped** |
| is_active | BOOLEAN | Active toggle |
| notes | TEXT | **NEW: Instructions/notes for this approver** |

**Relationships:** BelongsTo → WorkflowTemplates, BelongsTo → Users

**IMPROVEMENTS:**
- Split `amount_threshold` into `min` and `max` for proper range validation
- Add `is_required` flag to control whether skip is allowed
- Add `notes` field for approver-specific instructions
- Add validation: `amount_threshold_min <= amount_threshold_max`
- Add unique constraint: `(workflow_template_id, approver_id)` to prevent duplicate approvers

### Task 1.4: Create Document Approvals Entity
**File:** `src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.entity.ts`

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| document_id | UUID | ID of document being approved |
| document_type | ENUM(DocumentTypeEnum) | **IMPROVEMENT: Use enum, not string** |
| workflow_id | UUID | FK to WorkflowTemplates |
| workflow_version | INTEGER | Snapshot of template version |
| approver_id | UUID | FK to Users |
| delegated_from_id | UUID | **NEW: Original approver if delegated** |
| order_no | INTEGER | Approval level in sequence |
| status | ENUM(ApprovalStatusEnum) | Current status (default: PENDING) |
| comments | TEXT | Approver notes/feedback (sanitized) |
| action_date | DATE | When action was taken |
| due_date | DATE | **NEW: Approval deadline** |
| escalated_at | DATE | **NEW: When escalation triggered** |
| escalated_to_id | UUID | **NEW: FK to Users if escalated** |

**Relationships:** BelongsTo → WorkflowTemplates, BelongsTo → Users (approver), BelongsTo → Users (delegatedFrom)

**IMPROVEMENTS:**
- `document_type` uses enum instead of plain string
- Added delegation support (`delegated_from_id`)
- Added SLA tracking (`due_date`, `escalated_at`, `escalated_to_id`)

### Task 1.5: Create Approval History Entity (NEW)
**File:** `src/WORKFLOW/WORKFLOW_APPROVAL_HISTORY/approval_history.entity.ts`

**Description:** Separate audit trail table - every action creates an immutable history record.

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| approval_id | UUID | FK to DocumentApprovals |
| document_id | UUID | Document reference |
| action | ENUM(ApprovalActionEnum) | Action taken |
| old_status | ENUM(ApprovalStatusEnum) | Status before action |
| new_status | ENUM(ApprovalStatusEnum) | Status after action |
| actor_id | UUID | FK to Users (who performed action) |
| comments | TEXT | Notes with this action |
| ip_address | STRING | **NEW: IP of actor for security audit** |
| created_at | DATE | Immutable timestamp |

**IMPROVEMENT:** AGS has no dedicated history table. This provides a clean, immutable audit trail.

### Task 1.6: Create Database Migration
**File:** `src/database/migrations/XXXXXX-create-workflow-tables.ts`

**Tables:**
1. `workflow_templates` (with soft delete, unique constraints)
2. `workflow_approvers` (with range thresholds, unique approver per template)
3. `document_approvals` (with delegation, SLA fields)
4. `approval_history` (NEW - immutable audit trail)

**Database Indexes (IMPROVEMENT - AGS has none):**
```sql
CREATE INDEX idx_doc_approvals_approver_status ON document_approvals(approver_id, status);
CREATE INDEX idx_doc_approvals_document ON document_approvals(document_id);
CREATE INDEX idx_doc_approvals_workflow ON document_approvals(workflow_id);
CREATE INDEX idx_doc_approvals_created ON document_approvals(created_at DESC);
CREATE INDEX idx_doc_approvals_due_date ON document_approvals(due_date) WHERE status = 'PENDING';
CREATE INDEX idx_templates_active ON workflow_templates(is_active, document_type, document_category)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_approval_history_approval ON approval_history(approval_id);
CREATE INDEX idx_approval_history_document ON approval_history(document_id);
CREATE UNIQUE INDEX idx_unique_active_template
  ON workflow_templates(document_type, document_category)
  WHERE is_active = true AND deleted_at IS NULL;
```

---

## PHASE 2: BACKEND SERVICES & CONTROLLERS

### Task 2.1: Create Providers (Repository Injection)
**Files:**
- `src/WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.provider.ts`
- `src/WORKFLOW/WORKFLOW_APPROVERS/workflow_approvers.provider.ts`
- `src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.provider.ts`
- `src/WORKFLOW/WORKFLOW_APPROVAL_HISTORY/approval_history.provider.ts` (NEW)

### Task 2.2: Create DTOs with Strict Validation
**IMPROVEMENT:** AGS uses `@Query() query: any` on some endpoints. All inputs must be validated.

**Files:**

- `src/WORKFLOW/WORKFLOW_TEMPLATES/dto/workflow_templates.dto.ts`
  ```typescript
  class CreateWorkflowTemplateDto {
    @IsString() @IsNotEmpty() @MaxLength(100)
    name: string;

    @IsOptional() @IsString() @MaxLength(500)
    description?: string;

    @IsEnum(DocumentTypeEnum)
    document_type: DocumentTypeEnum;

    @IsEnum(DocumentCategoryEnum)
    document_category: DocumentCategoryEnum;

    @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1)
    @Type(() => CreateWorkflowApproverDto)
    approvers: CreateWorkflowApproverDto[];
  }

  class QueryWorkflowTemplateDto {
    @IsOptional() @IsInt() @Min(1)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100)
    take?: number = 10;

    @IsOptional() @IsEnum(DocumentTypeEnum)
    document_type?: DocumentTypeEnum;

    @IsOptional() @IsEnum(DocumentCategoryEnum)
    document_category?: DocumentCategoryEnum;

    @IsOptional() @IsBoolean()
    is_active?: boolean;

    @IsOptional() @IsString()
    search?: string;
  }
  ```

- `src/WORKFLOW/WORKFLOW_APPROVERS/dto/workflow_approvers.dto.ts`
  ```typescript
  class CreateWorkflowApproverDto {
    @IsUUID()
    approver_id: string;

    @IsInt() @Min(1)
    order_no: number;

    @IsOptional() @IsNumber() @Min(0)
    amount_threshold_min?: number;

    @IsOptional() @IsNumber() @Min(0)
    amount_threshold_max?: number;  // MUST be >= amount_threshold_min

    @IsOptional() @IsNumber() @Min(0) @Max(100)
    budget_threshold?: number;

    @IsOptional() @IsBoolean()
    is_required?: boolean = true;

    @IsOptional() @IsString() @MaxLength(500)
    notes?: string;
  }
  ```

- `src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/dto/workflow_document_approvals.dto.ts`
  ```typescript
  class ProcessApprovalDto {
    @IsUUID()
    document_id: string;

    @IsUUID()
    approver_id: string;

    @IsEnum(ApprovalActionEnum)
    action: ApprovalActionEnum;

    @ValidateIf(o => o.action !== ApprovalActionEnum.APPROVE)
    @IsNotEmpty({ message: 'Comments required for reject/correction actions' })
    @IsString() @MaxLength(2000)
    comments?: string;
  }

  class BulkProcessApprovalDto {  // NEW
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => ProcessApprovalDto)
    approvals: ProcessApprovalDto[];
  }

  class QueryApprovalsDto {
    @IsOptional() @IsInt() @Min(1)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100)
    take?: number = 10;

    @IsOptional() @IsEnum(ApprovalStatusEnum)
    status?: ApprovalStatusEnum;

    @IsOptional() @IsEnum(DocumentTypeEnum)
    document_type?: DocumentTypeEnum;

    @IsOptional() @IsDateString()
    date_from?: string;

    @IsOptional() @IsDateString()
    date_to?: string;

    @IsOptional() @IsString()
    search?: string;  // Server-side search
  }

  class DelegateApprovalDto {  // NEW
    @IsUUID()
    approval_id: string;

    @IsUUID()
    delegate_to_user_id: string;

    @IsOptional() @IsString() @MaxLength(500)
    reason?: string;
  }
  ```

### Task 2.3: Create Workflow Templates Service
**File:** `src/WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.service.ts`

**Use NestJS Logger** (IMPROVEMENT: AGS uses console.log everywhere):
```typescript
private readonly logger = new Logger(WorkflowTemplatesService.name);
```

**Methods:**

- `create(dto)` - Create template with approvers
  - **IMPROVEMENT:** Validate approver users exist before saving
  - **IMPROVEMENT:** Check for duplicate approvers in same template
  - **IMPROVEMENT:** Validate threshold ranges (min <= max)
  - Use database transaction

- `findAll(query: QueryWorkflowTemplateDto)` - List templates
  - **IMPROVEMENT:** Server-side search on name/description
  - **IMPROVEMENT:** Proper pagination with total count
  - Filter `deleted_at IS NULL` (soft delete)

- `findOne(id)` - Get template with approvers
  - **IMPROVEMENT:** Include approver user details in single query (avoid N+1)

- `update(id, dto)` - Update template
  - **IMPROVEMENT:** Always increment version on ANY change (AGS only does it for approver changes)
  - **IMPROVEMENT:** Re-validate approver users and duplicates

- `remove(id)` - Soft delete
  - **IMPROVEMENT:** Check if active approvals reference this template first
  - **IMPROVEMENT:** Set `deleted_at = new Date()` instead of hard delete
  - If active approvals exist, throw error: "Cannot delete template with pending approvals"

- `activate(id)` - Activate template
  - **IMPROVEMENT:** Use database-level unique constraint to prevent multiple active per doc_type
  - Deactivate existing active template for same doc_type in same transaction

- `deactivate(id)` - Deactivate template
  - **IMPROVEMENT:** Warn if pending approvals exist using this template

- `getActiveTemplateByDocType(docType, category)` - Find active template

### Task 2.4: Create Document Approvals Service
**File:** `src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service.ts`

**Key Methods with Improvements:**

- `createDocumentApprovals(documentId, workflowId, version, amount?, budget?)`
  - Fetch workflow template & approvers
  - Filter approvers by thresholds (amount/budget) with proper range validation
  - Create approval records for each approver in sequence
  - **IMPROVEMENT:** Set `due_date` based on configurable SLA (e.g., +3 business days)
  - Notify first-level approvers via email
  - **IMPROVEMENT:** Retry email on failure (up to 3 attempts)
  - Create history record: action=CREATE

- `processApproval(dto: ProcessApprovalDto)`
  - **IMPROVEMENT: Idempotency check** - if approval already processed, return existing result
  - Validate approver is authorized for this document
  - Validate it's their turn (check order_no sequence)
  - **IMPROVEMENT:** Sanitize comments (strip HTML/scripts) before saving
  - **IMPROVEMENT:** If action=CORRECTION and order_no=1, return clear error
  - **IMPROVEMENT:** If action=SKIP, check `is_required` flag on approver config
  - Update approval status
  - Create history record with IP address
  - If APPROVED: check if all at current level done → notify next level
  - If all levels APPROVED: mark document as fully approved
  - If REJECTED: mark remaining as SKIPPED, notify document creator
  - Wrap everything in single transaction

- `bulkProcessApproval(dto: BulkProcessApprovalDto)` **(NEW)**
  - Process multiple approvals in single transaction
  - Return results array with success/failure per approval
  - Validate all before processing any (fail-fast)

- `delegateApproval(dto: DelegateApprovalDto)` **(NEW)**
  - Reassign approval to another user
  - Set `delegated_from_id` on record
  - Create history record with DELEGATE action
  - Notify new approver

- `getAllApprovals(query: QueryApprovalsDto)`
  - **IMPROVEMENT:** Use aggregate functions for stats instead of loading all records:
    ```sql
    SELECT status, COUNT(*) as count FROM document_approvals
    GROUP BY status
    ```
  - **IMPROVEMENT:** Server-side search across document_id, document_type
  - **IMPROVEMENT:** Batch load approver user data in single query (prevent N+1)
  - Proper pagination with total count

- `getApprovalDashboardStats()` **(NEW)**
  - Average turnaround time per approval level
  - Bottleneck identification (approvers with most pending)
  - Approval rate (approved vs rejected percentage)
  - Overdue approvals count
  - Stats by document type

### Task 2.5: Create Approval Reminder Service (NEW)
**File:** `src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/approval_reminder.service.ts`

**Description:** Scheduled job to send reminders for pending approvals.

```typescript
@Cron('0 9 * * 1-5')  // Every weekday at 9 AM
async sendPendingReminders() {
  // Find approvals pending > 1 day
  // Send reminder email
  // After 3 days, escalate to next level or admin
}
```

**IMPROVEMENT:** AGS has no automated reminder system.

### Task 2.6: Create Email Notification Template
**File:** `src/shared/templates/workflow_approval_notification.ts`

**Template should include:**
- Document type, name, and amount (not just ID)
- Approval action required
- Direct link to approval page
- Requester information
- **NEW:** Due date / deadline
- **NEW:** Number of pending approvals for this user
- **NEW:** Previous approval decisions (who approved before you)

### Task 2.7: Create Workflow Templates Controller
**File:** `src/WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.controller.ts`

**Endpoints:**
```
POST   /workflow/templates                    → create()
GET    /workflow/templates                    → findAll()
GET    /workflow/templates/:id               → findOne()
PUT    /workflow/templates/:id               → update()
DELETE /workflow/templates/:id               → remove()     // Soft delete
PATCH  /workflow/templates/:id/activate      → activate()
PATCH  /workflow/templates/:id/deactivate    → deactivate()
GET    /workflow/templates/:id/versions      → getVersionHistory()  // NEW
```
All routes protected with JWT AuthGuard.
**IMPROVEMENT:** All `@Query()` parameters use validated DTOs (no `any`).

### Task 2.8: Create Document Approvals Controller
**File:** `src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.controller.ts`

**Endpoints:**
```
POST   /document-approvals/document/:docId/workflow/:workflowId/version/:version
       → createDocumentApprovals()

GET    /document-approvals
       → getAllApprovals()                    // With validated QueryApprovalsDto

GET    /document-approvals/:id
       → getApprovalById()

GET    /document-approvals/document/:documentId
       → getApprovalsByDocumentId()

GET    /document-approvals/pending/:approverId
       → getPendingApprovals()

POST   /document-approvals/process
       → processApproval()                    // Single approval

POST   /document-approvals/bulk-process       // NEW
       → bulkProcessApproval()

POST   /document-approvals/delegate           // NEW
       → delegateApproval()

GET    /document-approvals/dashboard          // NEW
       → getDashboardStats()

GET    /document-approvals/:id/history        // NEW
       → getApprovalHistory()
```

All routes protected with JWT AuthGuard.
**IMPROVEMENT:** Standardized response format on ALL endpoints:
```typescript
{
  success: true,
  data: { ... },
  meta: { total, page, take, totalPages },
  message: "Approvals fetched successfully"
}
```

### Task 2.9: Create NestJS Modules
**Files:**
- `src/WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.module.ts`
- `src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.module.ts`
- `src/WORKFLOW/WORKFLOW_APPROVAL_HISTORY/approval_history.module.ts` (NEW)
- `src/WORKFLOW/workflow.module.ts` (parent module)

Register `WorkflowModule` in `AppModule`.

---

## PHASE 3: FRONTEND - SERVICES & STATE

### Task 3.1: Create Workflow API Services
**Files:**

- `src/services/workflowService.ts`
  ```typescript
  createTemplate(data)                    // POST /workflow/templates
  getAllTemplates(params)                  // GET /workflow/templates
  getTemplateById(id)                     // GET /workflow/templates/:id
  updateTemplate(id, data)                // PUT /workflow/templates/:id
  deleteTemplate(id)                      // DELETE /workflow/templates/:id
  activateTemplate(id)                    // PATCH /workflow/templates/:id/activate
  deactivateTemplate(id)                  // PATCH /workflow/templates/:id/deactivate
  getTemplateVersionHistory(id)           // GET /workflow/templates/:id/versions (NEW)
  ```

- `src/services/workflowApprovalService.ts`
  ```typescript
  getApprovalsByDocumentId(docId)         // GET /document-approvals/document/:docId
  getPendingApprovals(approverId, params) // GET /document-approvals/pending/:approverId
  processApproval(data)                  // POST /document-approvals/process
  bulkProcessApproval(data)              // POST /document-approvals/bulk-process (NEW)
  delegateApproval(data)                 // POST /document-approvals/delegate (NEW)
  getAllApprovals(params)                // GET /document-approvals
  getApprovalById(id)                    // GET /document-approvals/:id
  getApprovalHistory(id)                 // GET /document-approvals/:id/history (NEW)
  getDashboardStats()                    // GET /document-approvals/dashboard (NEW)
  ```

**IMPROVEMENT:** All services handle AbortController for request cancellation on unmount.

### Task 3.2: Create Shared Types & Constants (NEW)
**File:** `src/types/workflow.types.ts`

```typescript
// Mirror backend enums for type safety
// Define response interfaces
// Define component prop interfaces
// Status color mapping
// Date format constants (locale-aware)
```

---

## PHASE 4: FRONTEND - PAGES & COMPONENTS

### Task 4.1: Create Workflow Templates Page
**File:** `src/app/workflow/templates/index.tsx`

**Features:**
- Table listing all workflow templates
- Columns: Name, Document Type, Category, Version, Status (Active/Inactive), Actions
- **IMPROVEMENT:** Server-side search with 300ms debounce (AGS filters client-side only)
- Filter by document type, category, status
- Pagination (server-side)
- Action buttons: View, Edit, Delete, Activate/Deactivate
- **IMPROVEMENT:** Confirmation modal before delete/deactivate
- **IMPROVEMENT:** Warning if deactivating template with pending approvals
- "Create New Template" button → opens form/drawer
- **IMPROVEMENT:** React Error Boundary wrapping the page
- **IMPROVEMENT:** Loading skeleton while data loads

### Task 4.2: Create Workflow Template Form Component
**File:** `src/app/workflow/templates/components/WorkflowTemplateForm.tsx`

**Features:**
- Form fields: Name, Description, Document Type (dropdown), Document Category (dropdown)
- **IMPROVEMENT:** Unique name validation (check against existing templates)
- **IMPROVEMENT:** Field-level validation errors in real-time
- Dynamic approver list:
  - Add/remove approvers
  - For each approver: Select user, Order number, Amount threshold min/max, Budget threshold, Is Required, Notes
  - **IMPROVEMENT:** Drag-and-drop reordering with @dnd-kit
  - **IMPROVEMENT:** Duplicate approver detection (highlight if same user added twice)
  - **IMPROVEMENT:** Threshold range validation (min <= max) inline
- **IMPROVEMENT:** Dirty state tracking - disable save when no changes made
- **IMPROVEMENT:** Preview panel showing approval chain visualization before save
- Save & Cancel buttons
- Works for both Create and Edit modes

### Task 4.3: Create Workflow Template Viewer Component
**File:** `src/app/workflow/templates/components/WorkflowTemplateViewer.tsx`

**Features:**
- Display template details in a read-only view
- Show approval chain visually (Ant Design Steps component)
- Show approver details with thresholds and notes
- **NEW:** Version history tab showing all previous versions
- Close/Back button

### Task 4.4: Create Document Approvals Page
**File:** `src/app/workflow/document-approvals/index.tsx`

**Features:**
- Tab interface: "My Pending" | "All Approvals"
- **IMPROVEMENT:** Summary stat cards WITH loading skeletons
- **IMPROVEMENT:** Server-side search across document fields (not just current page)
- Table columns: Document Name, Document Type, Status, Approver, Level, Due Date, Actions
- Status badges with colors (PENDING=Orange, APPROVED=Green, REJECTED=Red, CORRECTION=Yellow, SKIPPED=Gray)
- **IMPROVEMENT:** Overdue indicator (red icon) if past due_date
- **NEW:** Checkbox selection for bulk approval
- **NEW:** "Bulk Approve" button (appears when items selected)
- Action buttons: View Details, Approve/Reject, Delegate (for pending items)
- Filter by status, document type, date range
- Pagination (server-side)
- **IMPROVEMENT:** React Error Boundary
- **IMPROVEMENT:** AbortController cleanup on unmount

### Task 4.5: Create Approval Action Modal
**File:** `src/app/workflow/document-approvals/components/ApprovalActionModal.tsx`

**Features:**
- Modal with approval actions: Approve, Reject, Request Correction
- **IMPROVEMENT:** Show full document context: name, amount, requestor, date submitted
- **IMPROVEMENT:** Show previous approvers' decisions (who approved/rejected before)
- **IMPROVEMENT:** Show approver-specific notes from template configuration
- **IMPROVEMENT:** Disable "Request Correction" for first approver with tooltip: "First approver cannot request corrections"
- **IMPROVEMENT:** Dynamic labels: "(optional)" for approve comments, "(required)" for reject/correction
- **IMPROVEMENT:** Confirmation dialog before final submission: "Are you sure you want to [approve/reject] this document?"
- Comments/feedback textarea (required for Reject and Correction)
- Loading state while processing
- Success/error notification after action

### Task 4.6: Create Document Approval Details Modal
**File:** `src/app/workflow/document-approvals/components/DocumentApprovalDetailsModal.tsx`

**Features:**
- Show document information (name, type, amount, requestor, date)
- **IMPROVEMENT:** Full approval timeline using Ant Design Timeline component
  - Shows ALL actions chronologically (creates, approvals, rejections, corrections, delegations)
  - Each entry: actor name, action, comments, timestamp
- Current status of each approval level (visual step indicator)
- **NEW:** Delegation history if any
- **NEW:** SLA status (on time / overdue)

### Task 4.7: Create Delegation Modal (NEW)
**File:** `src/app/workflow/document-approvals/components/DelegationModal.tsx`

**Features:**
- Select user to delegate to (searchable dropdown)
- Reason for delegation (optional text)
- Confirmation before delegating
- Only available for PENDING approvals assigned to current user

### Task 4.8: Create Approval Dashboard Page (NEW)
**File:** `src/app/workflow/dashboard/index.tsx`

**Features:**
- Stat cards: Total Approvals, Pending, Approved, Rejected, Overdue
- Chart: Approval turnaround time (average days per level) - use Recharts
- Chart: Approvals by document type (pie/donut chart)
- Table: Bottleneck approvers (most pending items)
- Chart: Approval trend over time (line chart, last 30 days)
- Filter by date range and document type

---

## PHASE 5: ROUTING & NAVIGATION

### Task 5.1: Add Routes
**File:** `src/routes/index.tsx` (modify existing)

```tsx
/workflow/templates          → WorkflowTemplatesPage
/workflow/document-approvals → DocumentApprovalsPage
/workflow/dashboard          → ApprovalDashboardPage    // NEW
```

### Task 5.2: Add Sidebar Navigation
**File:** `src/components/Sidebar/sidebarData.ts` (modify existing)

```typescript
{
  title: "Approval Workflow",
  icon: Workflow,  // from lucide-react
  key: "approval-workflow",
  children: [
    { title: "Dashboard", path: "/workflow/dashboard" },       // NEW
    { title: "Templates", path: "/workflow/templates" },
    { title: "Document Approvals", path: "/workflow/document-approvals" }
  ],
  resources: ["workflow-dashboard", "templates", "document-approvals"],
  actions: {
    "workflow-dashboard": ["view"],
    templates: ["view", "create", "edit", "delete", "activate", "deactivate"],
    "document-approvals": ["view", "approve", "reject", "cancel", "delegate", "bulk-approve"]
  }
}
```

---

## PHASE 6: INTEGRATION & TESTING

### Task 6.1: Integrate with Existing Document Modules
For each document module (Invoice, PO, Payment Request, etc.):
- Add "Submit for Approval" button
- Call `createDocumentApprovals()` when submitting (pass amount for threshold routing)
- Show approval status badge on document list/detail pages
- Block document edit/delete actions while approval is pending
- Show approval timeline on document detail pages

### Task 6.2: Add Notification Integration
- Integrate with existing email service with retry mechanism
- Send notifications when:
  - New approval created → notify first-level approver (include due date)
  - Approval level completed → notify next-level approver
  - Document fully approved → notify document creator
  - Document rejected → notify document creator with rejection comments
  - Correction requested → notify document creator with correction instructions
  - **NEW:** Approval delegated → notify new approver
  - **NEW:** Approval overdue → remind approver (via scheduled job)
  - **NEW:** Escalation triggered → notify escalation target

### Task 6.3: Test the Complete Flow
**Test scenarios:**
1. Create a workflow template with 3 approval levels
2. Submit a document for approval
3. Level 1 approver approves → Level 2 is notified
4. Level 2 approves → Level 3 is notified
5. Level 3 approves → Document marked as fully approved
6. Test rejection flow (Level 2 rejects → remaining levels skipped → creator notified)
7. Test correction flow (Level 2 requests correction → creator notified)
8. Test threshold-based routing (different approvers for different amounts)
9. **NEW:** Test bulk approval (select 5 documents → approve all)
10. **NEW:** Test delegation (delegate to another user → they receive notification)
11. **NEW:** Test idempotency (submit same approval twice → second is no-op)
12. **NEW:** Test SLA/overdue (create approval → advance time → check overdue indicator)
13. **NEW:** Test soft delete (delete template → verify it's hidden but data preserved)
14. **NEW:** Test duplicate prevention (try to add same approver twice → error)
15. **NEW:** Test skip prevention (try to skip required approver → error)

---

## REFERENCE FILES FROM AGS PROJECT

When building each task, reference these AGS files for patterns and logic:

| Task | AGS Reference File |
|------|-------------------|
| Entities | `ags-server/src/WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.entity.ts` |
| Entities | `ags-server/src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.entity.ts` |
| Entities | `ags-server/src/WORKFLOW/WORKFLOW_APPROVERS/workflow_approvers.entity.ts` |
| Template Service | `ags-server/src/WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.service.ts` |
| Approval Service | `ags-server/src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service.ts` |
| Controllers | `ags-server/src/WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.controller.ts` |
| Controllers | `ags-server/src/WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.controller.ts` |
| Frontend Templates Page | `ags-web/src/app/workflow/templates/index.tsx` |
| Frontend Approvals Page | `ags-web/src/app/workflow/document-approvals/index.tsx` |
| Approval Modal | `ags-web/src/app/workflow/document-approvals/components/ApprovalActionModal.tsx` |
| API Services | `ags-web/src/services/workflowService.ts` |
| API Services | `ags-web/src/services/workflowApprovalService.ts` |
| Sidebar Config | `ags-web/src/components/Sidebar/sidebarData.ts` (lines 623-642) |
| Routes | `ags-web/src/routes/index.tsx` (lines 245-257) |
| Email Template | `ags-server/src/shared/templates/workflow_approval_notification.ts` |
| Threshold Logic | `ags-server/src/BUDGET_ALLOCATION/budget-workflow-integration.service.ts` |

---

## SUMMARY OF IMPROVEMENTS OVER AGS

| Area | AGS Problem | New Solution |
|------|-------------|-------------|
| Logging | 50+ console.log statements | NestJS Logger with proper levels |
| Validation | `@Query() query: any` on endpoints | Strict DTOs with class-validator |
| Response Format | Inconsistent (array vs object vs nested) | Standardized `{ data, meta, message }` |
| Duplicate Submissions | Allowed, overwrites previous | Idempotency check |
| Database Performance | No indexes | 8+ targeted indexes |
| Stats Calculation | Loads ALL records into memory | SQL aggregate functions |
| User Loading | N+1 queries in loops | Batch loading |
| Template Deletion | Hard delete, no dependency check | Soft delete + active approval check |
| Active Template | Race condition possible | Database unique constraint |
| SLA Tracking | None | Due dates + escalation |
| Threshold Validation | No range validation | min <= max validation |
| Duplicate Approvers | Allowed at multiple levels | Unique constraint |
| XSS Prevention | Raw comments stored | Input sanitization |
| Email Failures | Silently swallowed | Retry + failure alerts |
| Version Tracking | Only on approver changes | On ALL template changes |
| Search | Client-side, current page only | Server-side with debounce |
| Error Handling | No error boundaries | React Error Boundaries |
| Loading States | Blank while loading | Skeleton loaders |
| Approval Confirmation | No confirmation dialog | Confirmation before submit |
| Document Context | Only shows document ID | Shows name, amount, requestor |
| Correction Button | Shows error after click for order 1 | Disabled with tooltip |
| Audit Trail | Mixed with main records | Separate immutable history table |
| Bulk Operations | One at a time only | Bulk approval support |
| Delegation | Not supported | Full delegation workflow |
| Dashboard | Not available | Analytics with charts |
| Reminders | Not available | Scheduled reminder system |

---

## ESTIMATED EFFORT

| Phase | Tasks | Complexity |
|-------|-------|-----------|
| Phase 1: Database | 6 tasks | Medium |
| Phase 2: Backend | 9 tasks | High |
| Phase 3: Frontend Services | 2 tasks | Low |
| Phase 4: Frontend Pages | 8 tasks | High |
| Phase 5: Routing & Nav | 2 tasks | Low |
| Phase 6: Integration | 3 tasks | Medium-High |
| **Total** | **30 tasks** | |
