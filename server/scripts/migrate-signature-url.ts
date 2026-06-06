/**
 * One-time migration: change estimates.signature_url from VARCHAR(500) to TEXT.
 *
 * Run with:
 *   npm run migrate:fix-signature
 */
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();
  console.log('Connected to PostgreSQL.');

  try {
    // Check current column type first
    const check = await client.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'estimates'
        AND column_name = 'signature_url';
    `);

    if (check.rows.length === 0) {
      console.log('Column estimates.signature_url not found — nothing to do.');
      return;
    }

    const { data_type, character_maximum_length } = check.rows[0];
    console.log(`Current type: ${data_type}(${character_maximum_length ?? '∞'})`);

    if (data_type === 'text') {
      console.log('Column is already TEXT — no migration needed.');
      return;
    }

    // Alter the column
    await client.query(`
      ALTER TABLE estimates
        ALTER COLUMN signature_url TYPE TEXT;
    `);

    console.log('✓ estimates.signature_url successfully changed to TEXT.');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
