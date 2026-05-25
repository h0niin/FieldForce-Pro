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
      // ── SLA Timers: add timer_type column ─────────────────────────────────
      {
        name: 'sla_timers: add timer_type column',
        sql: `ALTER TABLE sla_timers ADD COLUMN IF NOT EXISTS timer_type VARCHAR(20) DEFAULT 'work_completion';`,
      },
      {
        name: 'sla_timers: backfill timer_type for existing rows',
        sql: `UPDATE sla_timers SET timer_type = 'work_completion' WHERE timer_type IS NULL;`,
      },

      // ── companies: add new columns ─────────────────────────────────────────
      {
        name: 'companies: add status, phone_number, and shipping_address',
        sql: `
          ALTER TABLE companies ADD COLUMN IF NOT EXISTS status VARCHAR(50);
          ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
          ALTER TABLE companies ADD COLUMN IF NOT EXISTS shipping_address TEXT;
        `,
      },

      // ── contacts: add new columns ──────────────────────────────────────────
      {
        name: 'contacts: add job_title, mobile_phone, and is_primary',
        sql: `
          ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
          ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20);
          ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
        `,
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
         WHERE t.is_deleted = false
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
           JOIN user_roles ur ON ur.user_id = u.id AND ur.is_deleted = false
           JOIN roles r ON r.id = ur.role_id AND r.is_deleted = false
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
}
