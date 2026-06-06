const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function checkPermissions() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const res = await client.query(`
      SELECT r.name as role_name, p.name as permission_name
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'Technician';
    `);

        console.log('Technician Permissions:', res.rows.map(r => r.permission_name));

        // Also check what roles exist to be sure 'Technician' is the right name
        const rolesRes = await client.query(`SELECT name FROM roles;`);
        console.log('All Roles:', rolesRes.rows.map(r => r.name));

    } catch (err) {
        console.error('Error connecting to DB or querying:', err);
    } finally {
        await client.end();
    }
}

checkPermissions();
