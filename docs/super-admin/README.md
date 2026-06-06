# Super Admin Setup Guide

This guide explains how to create the initial Super Admin account for the FieldForce Pro platform. The Super Admin has global access to all features and is not tied to any specific tenant.

## Prerequisites

- Docker running with the full stack (`docker-compose up -d`)
- The `fsm-server` and `fsm-db` containers must both be healthy

## How the Stack is Configured

The PostgreSQL database (`fsm-db`) runs entirely inside Docker and is **not** exposed to the host machine on any port. The `fsm-server` container connects to it via the internal Docker network using:

| Variable | Value |
|---|---|
| `DB_HOST` | `fsm-db` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `fieldforce_pro` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `postgres` |

Because of this, the seed script **cannot** be run directly from your host machine — it must be executed inside the `fsm-server` container.

## Running the Seed Script

### Option 1 — Via `docker exec` (Recommended)

From the project root, run the seed inline using the Node.js runtime already inside the container:

```bash
docker exec fsm-server node -e "
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const SUPER_ADMIN_EMAIL = 'fsm.superadmin@fieldforce.com';
const SUPER_ADMIN_PASSWORD = 'FieldForce@Super#2024';
async function run() {
  const client = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  await client.connect();
  const existing = await client.query('SELECT id, email, is_super_admin FROM users WHERE email = \$1 LIMIT 1', [SUPER_ADMIN_EMAIL]);
  if (existing.rows.length > 0) { console.log('Already exists:', existing.rows[0]); await client.end(); return; }
  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await client.query('INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, is_super_admin, is_active, is_deleted, email_verified, phone_verified, status, failed_login_attempts, onboarding_completed, spam_flag_count, timezone, language, created_at, updated_at) VALUES (\$1, NULL, \$2, \$3, \'Super\', \'Admin\', TRUE, TRUE, FALSE, TRUE, FALSE, \'ACTIVE\', 0, TRUE, 0, \'UTC\', \'en\', \$4, \$4)', [id, SUPER_ADMIN_EMAIL, passwordHash, now]);
  console.log('Super Admin created! Email:', SUPER_ADMIN_EMAIL, '| ID:', id);
  await client.end();
}
run().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
"
```

### Option 2 — Copy and run the TypeScript script

```bash
# Copy the seed script into the container
docker cp server/scripts/seed-super-admin.ts fsm-server:/app/seed-super-admin.ts
docker cp server/tsconfig.json fsm-server:/app/tsconfig.json

# Run via ts-node inside the container
docker exec fsm-server npx ts-node -r tsconfig-paths/register /app/seed-super-admin.ts
```

> **Note:** Option 2 requires `ts-node` to be available inside the container. If not, use Option 1.

## Super Admin Credentials

The seeded account has the following credentials:

| Field | Value |
|---|---|
| **Email** | `fsm.superadmin@fieldforce.com` |
| **Password** | `FieldForce@Super#2024` |
| **Role** | `is_super_admin = TRUE` |
| **Tenant** | None (platform-level access) |
| **Status** | `ACTIVE` |

> The account was last seeded on **2026-06-05** with ID `0ed77e5f-cfba-488b-ac64-6e76748ba01d`.

## Known Caveats

- **No unique constraint on `users.email`:** The `users` table does not have a database-level unique constraint on the `email` column. The seed script guards against duplicates via a pre-check `SELECT` query, but `ON CONFLICT (email) DO NOTHING` will **not** work in raw SQL. Do not run the seed multiple times without checking first.

- **`bcryptjs` vs `bcrypt`:** The container ships with the native `bcrypt` package (not `bcryptjs`). If you modify the TypeScript seed script to import `bcryptjs`, it will fail inside the container. Use `bcrypt` for container execution.

## Troubleshooting

- **`ECONNREFUSED` on `localhost:5433`:** The DB is not exposed to the host. Always run the seed inside the container using `docker exec fsm-server ...` as shown above.

- **`Cannot find module 'bcryptjs'`:** Use `require('bcrypt')` instead — the container only has the native `bcrypt` package installed.

- **`there is no unique or exclusion constraint matching the ON CONFLICT specification`:** The `users.email` column has no unique index. Remove `ON CONFLICT (email) DO NOTHING` and rely on the pre-check instead.

- **`Cannot find module './seed-super-admin.ts'`:** The `scripts/` directory is not copied into the Docker image (only `dist/` is). Use `docker cp` to copy the file first, or use the inline `node -e` approach (Option 1 above).
