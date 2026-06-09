import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

/**
 * Runs idempotent schema migrations on every server start.
 * Each statement uses IF NOT EXISTS / IF EXISTS — safe to run multiple times.
 * Add new migrations here instead of running manual ALTER TABLE commands.
 */
@Injectable()
export class StartupMigrationsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupMigrationsService.name);

  constructor(@InjectConnection() private readonly sequelize: Sequelize) { }

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.runMigrations();
    } catch (err) {
      this.logger.error(`Startup migration failed: ${err.message}`);
    }
  }

  private async runMigrations(): Promise<void> {
    const migrations: Array<{ name: string; sql: string }> = [

      // ── estimate_line_items: fix type ENUM → VARCHAR ──────────────────────
      // Must drop DEFAULT first — PostgreSQL cannot change column type when
      // an ENUM-typed DEFAULT exists (this was causing the rollback loop)
      {
        name: 'estimate_line_items: drop ENUM default on type column',
        sql: `ALTER TABLE estimate_line_items ALTER COLUMN type DROP DEFAULT;`,
      },
      {
        name: 'estimate_line_items: convert type ENUM to VARCHAR',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'estimate_line_items'
                  AND column_name = 'type'
                  AND data_type = 'USER-DEFINED'
                ) THEN
                  ALTER TABLE estimate_line_items
                    ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
                END IF;
              END $$;`,
      },
      {
        name: 'estimate_line_items: restore default value on type column',
        sql: `ALTER TABLE estimate_line_items
                ALTER COLUMN type SET DEFAULT 'service';`,
      },

      // ── estimate_line_items: add unit column ──────────────────────────────
      {
        name: 'estimate_line_items: add unit column',
        sql: `ALTER TABLE estimate_line_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50);`,
      },

      // ── workflow_templates: convert document_type ENUM → VARCHAR ──────────
      {
        name: 'workflow_templates: drop ENUM default on document_type',
        sql: `ALTER TABLE workflow_templates ALTER COLUMN document_type DROP DEFAULT;`,
      },
      {
        name: 'workflow_templates: convert document_type to VARCHAR',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'workflow_templates'
                  AND column_name = 'document_type'
                  AND data_type = 'USER-DEFINED'
                ) THEN
                  ALTER TABLE workflow_templates
                    ALTER COLUMN document_type TYPE VARCHAR(100) USING document_type::text;
                END IF;
              END $$;`,
      },

      // ── workflow_document_approvals: convert document_type ENUM → VARCHAR ─
      {
        name: 'workflow_document_approvals: drop ENUM default on document_type',
        sql: `ALTER TABLE workflow_document_approvals ALTER COLUMN document_type DROP DEFAULT;`,
      },
      {
        name: 'workflow_document_approvals: convert document_type to VARCHAR',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'workflow_document_approvals'
                  AND column_name = 'document_type'
                  AND data_type = 'USER-DEFINED'
                ) THEN
                  ALTER TABLE workflow_document_approvals
                    ALTER COLUMN document_type TYPE VARCHAR(100) USING document_type::text;
                END IF;
              END $$;`,
      },

      // ── workflow_approvers: fix is_active for non-deleted rows ────────────
      {
        name: 'workflow_approvers: set is_active=true where is_deleted=false',
        sql: `UPDATE workflow_approvers
                SET is_active = true
                WHERE is_deleted = false AND (is_active IS NULL OR is_active = false);`,
      },

      // ── users: add fcm_token column for push notifications ───────────────
      {
        name: 'users: add fcm_token column',
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(255);`,
      },

      // ── reviews: make contact_id and work_order_id nullable ──────────────
      // These were NOT NULL at DB level; the entity now allows null so we
      // must explicitly drop the constraint from the existing table.
      {
        name: 'reviews: drop NOT NULL on contact_id',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'reviews'
                  AND column_name = 'contact_id'
                  AND is_nullable = 'NO'
                ) THEN
                  ALTER TABLE reviews ALTER COLUMN contact_id DROP NOT NULL;
                END IF;
              END $$;`,
      },
      // ── estimates: add created_by column for draft ownership ─────────────
      {
        name: 'estimates: add created_by column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS created_by UUID;`,
      },

      {
        name: 'reviews: drop NOT NULL on work_order_id',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'reviews'
                  AND column_name = 'work_order_id'
                  AND is_nullable = 'NO'
                ) THEN
                  ALTER TABLE reviews ALTER COLUMN work_order_id DROP NOT NULL;
                END IF;
              END $$;`,
      },
      // ── service_appointments: make agent_id nullable for unassigned appointments ─
      {
        name: 'service_appointments: drop NOT NULL on agent_id',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'service_appointments'
                  AND column_name = 'agent_id'
                  AND is_nullable = 'NO'
                ) THEN
                  ALTER TABLE service_appointments ALTER COLUMN agent_id DROP NOT NULL;
                END IF;
              END $$;`,
      },
      // ── service_requests: add request_number column ───────────────────
      {
        name: 'service_requests: add request_number column',
        sql: `ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS request_number VARCHAR(50);`,
      },
      {
        name: 'service_requests: add unique index on request_number',
        sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_service_requests_request_number
              ON service_requests (request_number)
              WHERE request_number IS NOT NULL;`,
      },
      // Backfill existing rows with date-based request_number: SR-YYYYMMDD-001
      {
        name: 'service_requests: backfill request_number (date-based) for existing rows',
        sql: `DO $$
              DECLARE
                rec RECORD;
              BEGIN
                FOR rec IN (
                  SELECT id, tenant_id, created_at,
                    TO_CHAR(created_at, 'YYYYMMDD') AS dt,
                    ROW_NUMBER() OVER (PARTITION BY tenant_id, DATE(created_at) ORDER BY created_at ASC) AS day_num
                  FROM service_requests
                  WHERE request_number IS NULL
                  ORDER BY created_at ASC
                ) LOOP
                  UPDATE service_requests
                  SET request_number = 'SR-' || rec.dt || '-' || LPAD(rec.day_num::TEXT, 3, '0')
                  WHERE id = rec.id;
                END LOOP;
              END $$;`,
      },

      // ── service_appointments: convert status ENUM → VARCHAR to support en_route, on_site, on_hold ─
      {
        name: 'service_appointments: drop ENUM default on status',
        sql: `ALTER TABLE service_appointments ALTER COLUMN status DROP DEFAULT;`,
      },
      {
        name: 'service_appointments: convert status ENUM to VARCHAR',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'service_appointments'
                  AND column_name = 'status'
                  AND data_type = 'USER-DEFINED'
                ) THEN
                  ALTER TABLE service_appointments
                    ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
                END IF;
              END $$;`,
      },
      {
        name: 'service_appointments: restore default on status',
        sql: `ALTER TABLE service_appointments ALTER COLUMN status SET DEFAULT 'scheduled';`,
      },
      // ── FEATURE 1: Onboarding ─────────────────────────────────────────────
      {
        name: 'users: add onboarding_completed column',
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;`,
      },

      // ── FEATURE 3: File Attachments ───────────────────────────────────────
      {
        name: 'request_attachments: create table',
        sql: `CREATE TABLE IF NOT EXISTS request_attachments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
            tenant_id UUID NOT NULL,
            file_name VARCHAR(255),
            file_url TEXT,
            file_type VARCHAR(50),
            file_size INTEGER,
            uploaded_by UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
        );`,
      },

      // ── FEATURE 4: Priority-Based Queue System ────────────────────────────
      {
        name: 'service_requests: drop ENUM default on priority',
        sql: `ALTER TABLE service_requests ALTER COLUMN priority DROP DEFAULT;`,
      },
      {
        name: 'service_requests: convert priority ENUM to VARCHAR',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'service_requests'
                  AND column_name = 'priority'
                  AND data_type = 'USER-DEFINED'
                ) THEN
                  ALTER TABLE service_requests
                    ALTER COLUMN priority TYPE VARCHAR(10) USING priority::text;
                END IF;
              END $$;`,
      },
      {
        name: 'service_requests: update priority values to new enum spec',
        sql: `UPDATE service_requests SET priority = 'CRITICAL' WHERE priority = 'urgent';
              UPDATE service_requests SET priority = UPPER(priority) WHERE priority IN ('low', 'medium', 'high');`,
      },
      {
        name: 'service_requests: add check constraint on priority',
        sql: `DO $$ BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM information_schema.constraint_column_usage
                  WHERE table_name = 'service_requests' AND constraint_name = 'check_priority'
                ) THEN
                  ALTER TABLE service_requests ADD CONSTRAINT check_priority CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW'));
                END IF;
              END $$;`,
      },
      {
        name: 'service_requests: restore default on priority',
        sql: `ALTER TABLE service_requests ALTER COLUMN priority SET DEFAULT 'MEDIUM';`,
      },
      {
        name: 'request_audit_log: create table',
        sql: `CREATE TABLE IF NOT EXISTS request_audit_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id UUID REFERENCES service_requests(id),
            tenant_id UUID NOT NULL,
            changed_by UUID REFERENCES users(id),
            field_changed VARCHAR(50),
            old_value TEXT,
            new_value TEXT,
            changed_at TIMESTAMP DEFAULT NOW()
        );`,
      },

      // ── FEATURE 5: Duplicate & Spam Prevention ────────────────────────────
      {
        name: 'service_requests: add is_spam_flagged column',
        sql: `ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS is_spam_flagged BOOLEAN DEFAULT FALSE;`,
      },
      {
        name: 'service_requests: add spam_reason column',
        sql: `ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS spam_reason VARCHAR(255);`,
      },
      {
        name: 'users: add spam_flag_count column',
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS spam_flag_count INTEGER DEFAULT 0;`,
      },
      {
        name: 'users: add status column',
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','WARNED'));`,
      },

      // ── Super Admin support: make users.tenant_id nullable ───────────────
      {
        name: 'users: drop NOT NULL on tenant_id (super admin has null tenant)',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'users'
                  AND column_name = 'tenant_id'
                  AND is_nullable = 'NO'
                ) THEN
                  ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;
                END IF;
              END $$;`,
      },
      {
        name: 'users: add is_super_admin column',
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;`,
      },
      // ── Inbound API: new service_request columns ─────────────────────────
      {
        name: 'service_requests: add source_api_key_id column',
        sql: `ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS source_api_key_id UUID;`,
      },
      {
        name: 'service_requests: add external_ref_id column',
        sql: `ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS external_ref_id VARCHAR(255);`,
      },
      // ── API Keys table ────────────────────────────────────────────────────
      {
        name: 'api_keys: create table',
        sql: `CREATE TABLE IF NOT EXISTS api_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                key_prefix VARCHAR(20),
                key_hash VARCHAR(255),
                scopes JSONB NOT NULL DEFAULT '[]',
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                last_used_at TIMESTAMP,
                expires_at TIMESTAMP,
                is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
              );`,
      },

      // ── Magic Links table ─────────────────────────────────────────────────
      {
        name: 'magic_links: create table',
        sql: `CREATE TABLE IF NOT EXISTS magic_links (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(255) NOT NULL,
                purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('super_admin_access', 'admin_onboarding', 'user_access')),
                is_used BOOLEAN NOT NULL DEFAULT FALSE,
                expires_at TIMESTAMP NOT NULL,
                created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
              );`,
      },

      // ── Subscription Plans table ──────────────────────────────────────────
      {
        name: 'subscription_plans: create table',
        sql: `CREATE TABLE IF NOT EXISTS subscription_plans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL UNIQUE,
                max_technicians INTEGER,
                max_dispatchers INTEGER,
                max_managers INTEGER,
                max_admins INTEGER,
                max_total_users INTEGER,
                max_appointments_monthly INTEGER,
                price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
                price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
                features JSONB NOT NULL DEFAULT '[]',
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
              );`,
      },
      {
        name: 'subscription_plans: seed Basic plan',
        sql: `INSERT INTO subscription_plans (id, name, max_technicians, max_dispatchers, max_managers, max_admins, max_total_users, max_appointments_monthly, price_monthly, price_yearly, features, created_at, updated_at)
              VALUES (gen_random_uuid(), 'Basic', 5, 2, 1, 1, 200, 100, 49.00, 490.00, '["service_requests","work_orders","invoices","basic_reports"]', NOW(), NOW())
              ON CONFLICT (name) DO NOTHING;`,
      },
      {
        name: 'subscription_plans: seed Professional plan',
        sql: `INSERT INTO subscription_plans (id, name, max_technicians, max_dispatchers, max_managers, max_admins, max_total_users, max_appointments_monthly, price_monthly, price_yearly, features, created_at, updated_at)
              VALUES (gen_random_uuid(), 'Professional', 20, 5, 3, 2, 200, 500, 149.00, 1490.00, '["service_requests","work_orders","invoices","estimates","scheduling","advanced_reports","api_access"]', NOW(), NOW())
              ON CONFLICT (name) DO NOTHING;`,
      },
      {
        name: 'subscription_plans: seed Enterprise plan',
        sql: `INSERT INTO subscription_plans (id, name, max_technicians, max_dispatchers, max_managers, max_admins, max_total_users, max_appointments_monthly, price_monthly, price_yearly, features, created_at, updated_at)
              VALUES (gen_random_uuid(), 'Enterprise', NULL, NULL, NULL, NULL, 200, 2000, 399.00, 3990.00, '["service_requests","work_orders","invoices","estimates","scheduling","advanced_reports","api_access","custom_fields","webhooks","ai_features"]', NOW(), NOW())
              ON CONFLICT (name) DO NOTHING;`,
      },

      // ── Magic Links: add created_at column (missing from initial table) ────
      {
        name: 'magic_links: add created_at column',
        sql: `ALTER TABLE magic_links ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();`,
      },

      // ── Magic Links: add user_onboarding purpose ─────────────────────────
      {
        name: 'magic_links: drop old purpose check constraint',
        sql: `ALTER TABLE magic_links DROP CONSTRAINT IF EXISTS magic_links_purpose_check;`,
      },
      {
        name: 'magic_links: add updated purpose check constraint',
        sql: `DO $$ BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM information_schema.constraint_column_usage
                  WHERE table_name = 'magic_links' AND constraint_name = 'magic_links_purpose_check_v2'
                ) THEN
                  ALTER TABLE magic_links ADD CONSTRAINT magic_links_purpose_check_v2
                    CHECK (purpose IN ('super_admin_access', 'admin_onboarding', 'user_access', 'user_onboarding'));
                END IF;
              END $$;`,
      },

      // ── Tenants: add subscription columns ────────────────────────────────
      {
        name: 'tenants: add subscription_plan_id column',
        sql: `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;`,
      },
      {
        name: 'tenants: add subscription_status column',
        sql: `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial';`,
      },
      {
        name: 'tenants: add subscription_start column',
        sql: `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP;`,
      },
      {
        name: 'tenants: add subscription_end column',
        sql: `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP;`,
      },
      {
        name: 'tenants: add custom_limits column',
        sql: `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_limits JSONB;`,
      },

      // ── FEATURE 6: Technician Feedback Section ────────────────────────────
      {
        name: 'technician_feedback: create table',
        sql: `CREATE TABLE IF NOT EXISTS technician_feedback (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
            technician_id UUID REFERENCES users(id),
            tenant_id UUID NOT NULL,
            difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
            time_taken_minutes INTEGER,
            work_summary TEXT,
            flags TEXT[],
            created_at TIMESTAMP DEFAULT NOW()
        );`,
      },
      {
        name: 'customer_satisfaction: create table',
        sql: `CREATE TABLE IF NOT EXISTS customer_satisfaction (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
            customer_id UUID REFERENCES users(id),
            tenant_id UUID NOT NULL,
            rating INTEGER CHECK (rating BETWEEN 1 AND 5),
            comment TEXT,
            submitted_at TIMESTAMP DEFAULT NOW()
        );`,
      },

      // ── ESTIMATION + INVOICE WORKFLOW: schema additions ───────────────────

      // estimates: add work_order_id so estimates can be linked to a WO
      {
        name: 'estimates: add work_order_id column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS work_order_id UUID;`,
      },

      // estimates: convert status ENUM → VARCHAR so new values (pending_approval,
      // converted_to_invoice) can be inserted without an ALTER TYPE which is DDL-heavy
      {
        name: 'estimates: drop ENUM default on status',
        sql: `ALTER TABLE estimates ALTER COLUMN status DROP DEFAULT;`,
      },
      {
        name: 'estimates: convert status ENUM to VARCHAR',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'estimates'
                  AND column_name = 'status'
                  AND data_type = 'USER-DEFINED'
                ) THEN
                  ALTER TABLE estimates
                    ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
                END IF;
              END $$;`,
      },
      {
        name: 'estimates: restore default on status',
        sql: `ALTER TABLE estimates ALTER COLUMN status SET DEFAULT 'draft';`,
      },

      // estimates: support templates
      {
        name: 'estimates: add is_template column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;`,
      },
      {
        name: 'estimates: add template_name column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS template_name VARCHAR(255);`,
      },

      // invoices: add estimate_id so we can track which estimate generated an invoice
      {
        name: 'invoices: add estimate_id column',
        sql: `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS estimate_id UUID;`,
      },

      // ── ON-SITE ESTIMATE APPROVAL FLOW ────────────────────────────────────
      {
        name: 'estimates: add estimate_type column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS estimate_type VARCHAR(20) NOT NULL DEFAULT 'pre_visit';`,
      },
      {
        name: 'estimates: add internal_approval_status column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS internal_approval_status VARCHAR(30);`,
      },
      {
        name: 'estimates: add internal_approved_by column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS internal_approved_by UUID;`,
      },
      {
        name: 'estimates: add internal_approved_at column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS internal_approved_at TIMESTAMP;`,
      },
      {
        name: 'estimates: add internal_rejection_reason column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS internal_rejection_reason TEXT;`,
      },
      {
        name: 'estimates: add customer_approval_status column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS customer_approval_status VARCHAR(30);`,
      },
      {
        name: 'estimates: add customer_approved_at column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMP;`,
      },
      {
        name: 'estimates: add customer_rejection_reason column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS customer_rejection_reason TEXT;`,
      },
      {
        name: 'estimates: add customer_signature column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS customer_signature TEXT;`,
      },
      {
        name: 'estimates: add customer_name_signed column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS customer_name_signed VARCHAR(200);`,
      },
      {
        name: 'estimates: add awaiting_internal_approval column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS awaiting_internal_approval BOOLEAN NOT NULL DEFAULT FALSE;`,
      },
      {
        name: 'estimates: add awaiting_customer_approval column',
        sql: `ALTER TABLE estimates ADD COLUMN IF NOT EXISTS awaiting_customer_approval BOOLEAN NOT NULL DEFAULT FALSE;`,
      },
      // ── PAYMENT RECORDING FEATURE ────────────────────────────────────────

      // Convert payments.method ENUM → VARCHAR so we can add 'upi', 'cheque'
      {
        name: 'payments: drop ENUM default on method',
        sql: `ALTER TABLE payments ALTER COLUMN method DROP DEFAULT;`,
      },
      {
        name: 'payments: convert method ENUM to VARCHAR',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'payments' AND column_name = 'method'
                  AND data_type = 'USER-DEFINED'
                ) THEN
                  ALTER TABLE payments ALTER COLUMN method TYPE VARCHAR(30) USING method::text;
                END IF;
              END $$;`,
      },
      {
        name: 'payments: restore default on method',
        sql: `ALTER TABLE payments ALTER COLUMN method SET DEFAULT 'cash';`,
      },
      // Convert payments.status ENUM → VARCHAR so we can add new statuses
      {
        name: 'payments: drop ENUM default on status',
        sql: `ALTER TABLE payments ALTER COLUMN status DROP DEFAULT;`,
      },
      {
        name: 'payments: convert status ENUM to VARCHAR',
        sql: `DO $$ BEGIN
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'payments' AND column_name = 'status'
                  AND data_type = 'USER-DEFINED'
                ) THEN
                  ALTER TABLE payments ALTER COLUMN status TYPE VARCHAR(30) USING status::text;
                END IF;
              END $$;`,
      },
      {
        name: 'payments: restore default on status',
        sql: `ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'confirmed';`,
      },
      // New payment columns
      {
        name: 'payments: add source column',
        sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual';`,
      },
      {
        name: 'payments: add received_by column',
        sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS received_by VARCHAR(200);`,
      },
      {
        name: 'payments: add rejection_reason column',
        sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;`,
      },
      {
        name: 'payments: add screenshot_url column',
        sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS screenshot_url TEXT;`,
      },
      // Invoice public token for customer portal
      {
        name: 'invoices: add public_token column',
        sql: `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS public_token UUID UNIQUE;`,
      },
      {
        name: 'invoices: add public_token_expires_at column',
        sql: `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS public_token_expires_at TIMESTAMP;`,
      },

      // ── SUBSCRIPTION MAGIC LINKS ─────────────────────────────────────────
      {
        name: 'subscription_magic_links: create table',
        sql: `CREATE TABLE IF NOT EXISTS subscription_magic_links (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            token VARCHAR(255) NOT NULL UNIQUE,
            token_hash VARCHAR(255) NOT NULL,
            plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            expires_at TIMESTAMP NOT NULL,
            max_uses INTEGER NOT NULL DEFAULT 1,
            used_count INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );`,
      },

      {
        name: 'estimate_attachments: create table',
        sql: `CREATE TABLE IF NOT EXISTS estimate_attachments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
            tenant_id UUID NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_url TEXT NOT NULL,
            file_type VARCHAR(50),
            file_size INTEGER,
            uploaded_by UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
        );`,
      },

      // ── MULTIPLE TECHNICIANS FOR SERVICE REQUESTS ────────────────────────
      {
        name: 'service_request_technicians: create table',
        sql: `CREATE TABLE IF NOT EXISTS service_request_technicians (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
            technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE (service_request_id, technician_id)
        );`,
      },
      {
        name: 'service_request_technicians: backfill existing assignments',
        sql: `INSERT INTO service_request_technicians (id, tenant_id, service_request_id, technician_id, created_at, updated_at)
              SELECT gen_random_uuid(), tenant_id, id, assigned_to, NOW(), NOW()
              FROM service_requests
              WHERE assigned_to IS NOT NULL
              ON CONFLICT (service_request_id, technician_id) DO NOTHING;`,
      },
      {
        name: 'subscription_plans: add currency column',
        sql: `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD';`,
      },
      {
        name: 'subscription_plans: seed Custom plan',
        sql: `INSERT INTO subscription_plans (id, name, max_technicians, max_dispatchers, max_managers, max_admins, max_total_users, max_appointments_monthly, price_monthly, price_yearly, features, currency, created_at, updated_at)
              VALUES (gen_random_uuid(), 'Custom', NULL, NULL, NULL, NULL, 200, NULL, 0.00, 0.00, '[]', 'USD', NOW(), NOW())
              ON CONFLICT (name) DO NOTHING;`,
      },
      {
        name: 'subscription_plans: add max_appointments_monthly column',
        sql: `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_appointments_monthly INTEGER;`,
      },
      {
        name: 'subscription_plans: update plans default limits (user cap 200 and appointments cap)',
        sql: `UPDATE subscription_plans SET max_appointments_monthly = 100, max_total_users = 200 WHERE name = 'Basic';
              UPDATE subscription_plans SET max_appointments_monthly = 500, max_total_users = 200 WHERE name = 'Professional';
              UPDATE subscription_plans SET max_appointments_monthly = 2000, max_total_users = 200 WHERE name = 'Enterprise';
              UPDATE subscription_plans SET max_total_users = 200 WHERE name = 'Custom';`,
      },
      {
        name: 'customization: create tenant_modules table',
        sql: `CREATE TABLE IF NOT EXISTS tenant_modules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                module_name VARCHAR(100) NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true,
                last_modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
                UNIQUE (tenant_id, module_name)
              );`,
      },
      {
        name: 'customization: create field_permissions table',
        sql: `CREATE TABLE IF NOT EXISTS field_permissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                module_name VARCHAR(100) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                access_level VARCHAR(20) NOT NULL DEFAULT 'read_write',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
                UNIQUE (tenant_id, module_name, field_name, role_id)
              );`,
      },
      {
        name: 'customization: create dispatch_console_layouts table',
        sql: `CREATE TABLE IF NOT EXISTS dispatch_console_layouts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                view_type VARCHAR(50) NOT NULL,
                layout_mode VARCHAR(50) NOT NULL DEFAULT 'classic',
                visible_fields JSONB NOT NULL DEFAULT '[]',
                last_modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
                UNIQUE (tenant_id, view_type)
              );`,
      },
    ];


    for (const migration of migrations) {
      try {
        await this.sequelize.query(migration.sql);
      } catch (err) {
        this.logger.warn(`Migration "${migration.name}" failed: ${err.message}`);
      }
    }

    // ── Seed: auto-create SCHEDULE workflow template per tenant ────────────
    await this.seedScheduleWorkflow();

    // ── Seed: auto-create INVOICE workflow template per tenant ────────────
    await this.seedInvoiceWorkflow();

    // ── Seed: create Dispatcher role for tenants that don't have one yet ──
    await this.seedDispatcherRole();
  }

  /**
   * For every tenant that does NOT yet have an active SCHEDULE workflow template,
   * create one and assign the first Admin user as the designated technician assigner.
   */
  private async seedScheduleWorkflow(): Promise<void> {
    try {
      // Find tenants missing an active SCHEDULE workflow
      const tenantsWithout = (await this.sequelize.query(
        `SELECT t.id
         FROM tenants t
         WHERE t.is_active = true
           AND NOT EXISTS (
             SELECT 1 FROM workflow_templates wt
             WHERE wt.tenant_id = t.id
               AND wt.document_type = 'SCHEDULE'
               AND wt.is_active = true
               AND wt.is_deleted = false
           )`,
        { type: (this.sequelize as any).constructor.QueryTypes.SELECT },
      ) as unknown) as Array<{ id: string }>;

      if (!tenantsWithout || tenantsWithout.length === 0) {
        return; // All tenants already have a SCHEDULE workflow
      }

      for (const tenant of tenantsWithout) {
        // Find the first active Admin user for this tenant to be the default assigner
        const adminResults = (await this.sequelize.query(
          `SELECT u.id
           FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
           WHERE u.tenant_id = :tenantId
             AND u.is_deleted = false
             AND u.is_active = true
             AND LOWER(r.name) = 'admin'
           ORDER BY u.created_at ASC
           LIMIT 1`,
          { replacements: { tenantId: tenant.id }, type: (this.sequelize as any).constructor.QueryTypes.SELECT },
        ) as unknown) as Array<{ id: string }>;
        const adminUser = adminResults[0];

        if (!adminUser) {
          this.logger.warn(`Tenant ${tenant.id}: no active Admin user found — skipping SCHEDULE workflow seed`);
          continue;
        }

        // Create the workflow template
        const templateResults = (await this.sequelize.query(
          `INSERT INTO workflow_templates (id, tenant_id, name, description, document_type, document_category, version, is_active, is_deleted, created_at, updated_at)
           VALUES (gen_random_uuid(), :tenantId, 'Schedule Assignment Workflow', 'Auto-created workflow for assigning technicians to scheduled appointments', 'SCHEDULE', 'OPERATIONS', 1, true, false, NOW(), NOW())
           RETURNING id`,
          { replacements: { tenantId: tenant.id }, type: (this.sequelize as any).constructor.QueryTypes.SELECT },
        ) as unknown) as Array<{ id: string }>;
        const templateRow = templateResults[0];

        if (!templateRow) {
          this.logger.warn(`Tenant ${tenant.id}: failed to create SCHEDULE workflow template`);
          continue;
        }

        // Add the admin as the first (and only) approver — this makes them the designated assigner
        await this.sequelize.query(
          `INSERT INTO workflow_approvers (id, tenant_id, workflow_template_id, approver_id, order_no, is_required, is_active, is_deleted, created_at, updated_at)
           VALUES (gen_random_uuid(), :tenantId, :templateId, :approverId, 1, true, true, false, NOW(), NOW())`,
          { replacements: { tenantId: tenant.id, templateId: templateRow.id, approverId: adminUser.id } },
        );

        this.logger.log(`Tenant ${tenant.id}: seeded SCHEDULE workflow (template=${templateRow.id}, assigner=${adminUser.id})`);
      }
    } catch (err) {
      this.logger.warn(`SCHEDULE workflow seed failed: ${err.message}`);
    }
  }

  /**
   * For every tenant that does NOT yet have a Dispatcher role,
   * create one with the standard dispatcher permission set.
   * Idempotent — skips tenants that already have the role.
   */
  private async seedDispatcherRole(): Promise<void> {
    try {
      const dispatcherPermissionNames = [
        'dashboard:read', 'notifications:read',
        'service_requests:read', 'service_requests:create', 'service_requests:update',
        'work_orders:read', 'work_orders:create', 'work_orders:update',
        'scheduling:read', 'scheduling:create', 'scheduling:update',
        'service_appointments:read', 'service_appointments:create', 'service_appointments:update',
        'estimates:read', 'estimates:create', 'estimates:update',
        'invoices:read', 'invoices:create', 'invoices:update',
        'contacts:read', 'companies:read', 'service_locations:read',
        'agent_locations:read',
        'work_order_line_items:read', 'work_order_line_items:create', 'work_order_line_items:update',
        'documents:read', 'documents:create',
        'reports:read',
      ];

      // Tenants that don't yet have a Dispatcher role
      const tenantsWithout = (await this.sequelize.query(
        `SELECT t.id
         FROM tenants t
         WHERE NOT EXISTS (
             SELECT 1 FROM roles r
             WHERE r.tenant_id = t.id
               AND LOWER(r.name) = 'dispatcher'
           )`,
        { type: (this.sequelize as any).constructor.QueryTypes.SELECT },
      ) as unknown) as Array<{ id: string }>;

      if (!tenantsWithout || tenantsWithout.length === 0) {
        return;
      }

      // Resolve permission IDs once (permissions are global)
      const permissionRows = (await this.sequelize.query(
        `SELECT id, name FROM permissions WHERE name = ANY(:names)`,
        {
          replacements: { names: dispatcherPermissionNames },
          type: (this.sequelize as any).constructor.QueryTypes.SELECT,
        },
      ) as unknown) as Array<{ id: string; name: string }>;

      for (const tenant of tenantsWithout) {
        // Create the Dispatcher role
        const roleResults = (await this.sequelize.query(
          `INSERT INTO roles (id, tenant_id, name, description, is_system, created_at, updated_at)
           VALUES (gen_random_uuid(), :tenantId, 'Dispatcher', 'Dispatch coordinator - reviews service requests, assigns technicians, manages work orders', false, NOW(), NOW())
           RETURNING id`,
          {
            replacements: { tenantId: tenant.id },
            type: (this.sequelize as any).constructor.QueryTypes.SELECT,
          },
        ) as unknown) as Array<{ id: string }>;

        const roleRow = roleResults[0];
        if (!roleRow) {
          this.logger.warn(`Tenant ${tenant.id}: failed to create Dispatcher role`);
          continue;
        }

        // Assign permissions
        for (const perm of permissionRows) {
          await this.sequelize.query(
            `INSERT INTO role_permissions (id, role_id, permission_id)
             VALUES (gen_random_uuid(), :roleId, :permId)
             ON CONFLICT DO NOTHING`,
            { replacements: { roleId: roleRow.id, permId: perm.id } },
          );
        }

        this.logger.log(`Tenant ${tenant.id}: seeded Dispatcher role (id=${roleRow.id}, permissions=${permissionRows.length})`);
      }
    } catch (err) {
      this.logger.warn(`Dispatcher role seed failed: ${err.message}`);
    }
  }

  /**
   * For every tenant that does NOT yet have an active INVOICE workflow template,
   * create one and assign the first Admin user as the default invoice approver.
   */
  private async seedInvoiceWorkflow(): Promise<void> {
    try {
      // Find tenants missing an active INVOICE workflow
      const tenantsWithout = (await this.sequelize.query(
        `SELECT t.id
         FROM tenants t
         WHERE t.is_active = true
           AND NOT EXISTS (
             SELECT 1 FROM workflow_templates wt
             WHERE wt.tenant_id = t.id
               AND wt.document_type = 'INVOICE'
               AND wt.is_active = true
               AND wt.is_deleted = false
           )`,
        { type: (this.sequelize as any).constructor.QueryTypes.SELECT },
      ) as unknown) as Array<{ id: string }>;

      if (!tenantsWithout || tenantsWithout.length === 0) {
        return; // All tenants already have an INVOICE workflow
      }

      for (const tenant of tenantsWithout) {
        // Find the first active Admin user for this tenant to be the default approver
        const adminResults = (await this.sequelize.query(
          `SELECT u.id
           FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
           WHERE u.tenant_id = :tenantId
             AND u.is_deleted = false
             AND u.is_active = true
             AND LOWER(r.name) = 'admin'
           ORDER BY u.created_at ASC
           LIMIT 1`,
          { replacements: { tenantId: tenant.id }, type: (this.sequelize as any).constructor.QueryTypes.SELECT },
        ) as unknown) as Array<{ id: string }>;
        const adminUser = adminResults[0];

        if (!adminUser) {
          this.logger.warn(`Tenant ${tenant.id}: no active Admin user found — skipping INVOICE workflow seed`);
          continue;
        }

        // Create the workflow template
        const templateResults = (await this.sequelize.query(
          `INSERT INTO workflow_templates (id, tenant_id, name, description, document_type, document_category, version, is_active, is_deleted, created_at, updated_at)
           VALUES (gen_random_uuid(), :tenantId, 'Invoice Approval Workflow', 'Auto-created workflow for reviewing and approving customer invoices', 'INVOICE', 'FINANCE', 1, true, false, NOW(), NOW())
           RETURNING id`,
          { replacements: { tenantId: tenant.id }, type: (this.sequelize as any).constructor.QueryTypes.SELECT },
        ) as unknown) as Array<{ id: string }>;
        const templateRow = templateResults[0];

        if (!templateRow) {
          this.logger.warn(`Tenant ${tenant.id}: failed to create INVOICE workflow template`);
          continue;
        }

        // Add the admin as the first (and only) approver
        await this.sequelize.query(
          `INSERT INTO workflow_approvers (id, tenant_id, workflow_template_id, approver_id, order_no, is_required, is_active, is_deleted, created_at, updated_at)
           VALUES (gen_random_uuid(), :tenantId, :templateId, :approverId, 1, true, true, false, NOW(), NOW())`,
          { replacements: { tenantId: tenant.id, templateId: templateRow.id, approverId: adminUser.id } },
        );

        this.logger.log(`Tenant ${tenant.id}: seeded INVOICE workflow (template=${templateRow.id}, approver=${adminUser.id})`);
      }
    } catch (err) {
      this.logger.warn(`INVOICE workflow seed failed: ${err.message}`);
    }
  }
}
