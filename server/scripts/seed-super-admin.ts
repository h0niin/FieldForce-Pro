/**
 * One-time seed: create the FieldForce Super Admin account.
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-super-admin.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// Load .env from the server directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPER_ADMIN_EMAIL = 'fsm.superadmin@fieldforce.com';
const SUPER_ADMIN_PASSWORD = 'FieldForce@Super#2024';
const BCRYPT_ROUNDS = 12;

async function run() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'fieldforce_pro_dev',
  });

  await client.connect();
  console.log('Connected to PostgreSQL.');

  try {
    // Check if already exists
    const existing = await client.query(
      `SELECT id, email, is_super_admin FROM users WHERE email = $1 LIMIT 1`,
      [SUPER_ADMIN_EMAIL],
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      console.log('\n✓ Super Admin account already exists:');
      console.log(`  ID:             ${row.id}`);
      console.log(`  Email:          ${row.email}`);
      console.log(`  is_super_admin: ${row.is_super_admin}`);
      console.log('\nNo changes made.');
      return;
    }

    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, BCRYPT_ROUNDS);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await client.query(
      `INSERT INTO users (
        id, tenant_id, email, password_hash,
        first_name, last_name,
        is_super_admin, is_active, is_deleted,
        email_verified, phone_verified,
        status, failed_login_attempts,
        onboarding_completed, spam_flag_count,
        timezone, language,
        created_at, updated_at
      ) VALUES (
        $1, NULL, $2, $3,
        'Super', 'Admin',
        TRUE, TRUE, FALSE,
        TRUE, FALSE,
        'ACTIVE', 0,
        TRUE, 0,
        'UTC', 'en',
        $4, $4
      )
      ON CONFLICT (email) DO NOTHING`,
      [id, SUPER_ADMIN_EMAIL, passwordHash, now],
    );

    console.log('\n✓ Super Admin account created successfully!\n');
    console.log('  ┌─────────────────────────────────────────────────┐');
    console.log('  │           SUPER ADMIN CREDENTIALS               │');
    console.log('  ├─────────────────────────────────────────────────┤');
    console.log(`  │  Email:    ${SUPER_ADMIN_EMAIL.padEnd(37)} │`);
    console.log(`  │  Password: ${SUPER_ADMIN_PASSWORD.padEnd(37)} │`);
    console.log('  │  Role:     Super Admin (is_super_admin = true)   │');
    console.log('  │  Tenant:   None (platform-level access)          │');
    console.log('  └─────────────────────────────────────────────────┘\n');
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
