const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TENANT_ID = '916254d1-c122-4c45-b2cf-62a9c75b61b0';
const USER_EMAIL = 'rishad@gmail.com';
const USER_PASSWORD = 'Rishad@123'; // Update this with your actual password

async function addMissingPermissions() {
  try {
    console.log('🔐 Logging in...');

    // Login to get token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });

    const token = loginResponse.data.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Logged in successfully\n');

    // Define missing permissions
    const missingPermissions = [
      {
        name: 'permissions:create',
        module: 'permissions',
        action: 'create',
        description: 'Create new permissions',
      },
      {
        name: 'permissions:read',
        module: 'permissions',
        action: 'read',
        description: 'View permissions',
      },
      {
        name: 'permissions:update',
        module: 'permissions',
        action: 'update',
        description: 'Update permissions',
      },
      {
        name: 'permissions:delete',
        module: 'permissions',
        action: 'delete',
        description: 'Delete permissions',
      },
      {
        name: 'permissions:manage',
        module: 'permissions',
        action: 'manage',
        description: 'Full permissions management',
      },
    ];

    console.log('📝 Creating missing permissions...\n');

    const createdPermissions = [];

    for (const permission of missingPermissions) {
      try {
        const response = await axios.post(
          `${API_URL}/permissions`,
          permission,
          { headers }
        );
        createdPermissions.push(response.data.data);
        console.log(`✅ Created: ${permission.name}`);
      } catch (error) {
        if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
          console.log(`⏭️  Already exists: ${permission.name}`);
          // Get existing permission
          try {
            const listResponse = await axios.get(`${API_URL}/permissions/all`, { headers });
            const existing = listResponse.data.data.find(p => p.name === permission.name);
            if (existing) {
              createdPermissions.push(existing);
            }
          } catch (e) {
            console.error(`❌ Failed to fetch existing permission: ${permission.name}`);
          }
        } else {
          console.error(`❌ Failed to create ${permission.name}:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log(`\n✅ Total permissions ready: ${createdPermissions.length}\n`);

    // Get Admin role
    console.log('🔍 Finding Admin role...\n');
    const rolesResponse = await axios.get(`${API_URL}/roles/all`, { headers });
    const adminRole = rolesResponse.data.data.find(role => role.name === 'Admin');

    if (!adminRole) {
      console.error('❌ Admin role not found!');
      return;
    }

    console.log(`✅ Found Admin role: ${adminRole.id}\n`);

    // Get all permissions
    console.log('📋 Fetching all permissions...\n');
    const allPermissionsResponse = await axios.get(`${API_URL}/permissions/all`, { headers });
    const allPermissions = allPermissionsResponse.data.data;

    console.log(`✅ Total permissions in system: ${allPermissions.length}\n`);

    // Update Admin role with ALL permissions
    const allPermissionIds = allPermissions.map(p => p.id);

    console.log('🔄 Updating Admin role with all permissions...\n');

    try {
      await axios.put(
        `${API_URL}/roles/${adminRole.id}`,
        {
          name: adminRole.name,
          description: adminRole.description,
          permission_ids: allPermissionIds,
        },
        { headers }
      );
      console.log(`✅ Admin role updated with ${allPermissionIds.length} permissions\n`);
    } catch (error) {
      console.error('❌ Failed to update Admin role:', error.response?.data?.message || error.message);
      return;
    }

    console.log('🎉 Setup complete!\n');
    console.log('💡 Please log out and log back in for permissions to take effect.\n');

    // Display current permissions
    console.log('📜 Permissions now in your Admin role:');
    allPermissions.forEach(p => {
      console.log(`   - ${p.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

addMissingPermissions();
