/**
 * One-time seed: insert the 3 default subscription plans (INR pricing).
 * Safe to run multiple times — skips existing plans by name.
 *
 * Run with:
 *   docker exec fsm-server node -e "$(cat /tmp/seed-plans-inline.js)"
 * Or copy + run via ts-node inside the container.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PLANS = [
  {
    name: 'Basic',
    max_total_users: 200,
    max_appointments_monthly: 100,
    price_monthly: 49.0,
    price_yearly: 490.0,
    features: [
      'Up to 100 appointments/mo',
      'Up to 200 users',
      'Work Orders & Scheduling',
      'Service Requests',
      'Customer Portal',
      'Basic Reports',
    ],
  },
  {
    name: 'Professional',
    max_total_users: 200,
    max_appointments_monthly: 500,
    price_monthly: 149.0,
    price_yearly: 1490.0,
    features: [
      'Up to 500 appointments/mo',
      'Up to 200 users',
      'Everything in Basic',
      'AI Scheduling & Dispatch',
      'Invoices & Payments',
      'Advanced Analytics',
      'API Access',
    ],
  },
  {
    name: 'Enterprise',
    max_total_users: 200,
    max_appointments_monthly: 2000,
    price_monthly: 399.0,
    price_yearly: 3990.0,
    features: [
      'Up to 2000 appointments/mo',
      'Up to 200 users',
      'Everything in Professional',
      'Predictive Maintenance (IoT)',
      'Computer Vision QA',
      'Custom Integrations',
      'Dedicated Support',
    ],
  },
];

async function run() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'fieldforce_pro',
  });

  await client.connect();
  console.log('Connected to PostgreSQL.');

  try {
    for (const plan of PLANS) {
      const existing = await client.query(
        `SELECT id, name FROM subscription_plans WHERE name = $1 LIMIT 1`,
        [plan.name],
      );

      if (existing.rows.length > 0) {
        console.log(`  ✓ Plan "${plan.name}" already exists (id: ${existing.rows[0].id}) — skipped.`);
        continue;
      }

      const result = await client.query(
        `INSERT INTO subscription_plans (
          name, max_total_users, max_appointments_monthly, price_monthly, price_yearly, features, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
        RETURNING id`,
        [
          plan.name,
          plan.max_total_users,
          plan.max_appointments_monthly,
          plan.price_monthly,
          plan.price_yearly,
          JSON.stringify(plan.features),
        ],
      );

      console.log(`  ✓ Created plan "${plan.name}" (id: ${result.rows[0].id})`);
    }

    console.log('\nDone. All subscription plans are seeded.');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
