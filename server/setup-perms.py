#!/usr/bin/env python3
import requests
import json

API_URL = "http://localhost:3000/api"
EMAIL = "rishad@gmail.com"
PASSWORD = "Rishad@123"

def main():
    print("🔐 Logging in...")

    # Login
    login_resp = requests.post(
        f"{API_URL}/auth/login",
        json={"email": EMAIL, "password": PASSWORD}
    )

    if login_resp.status_code != 200:
        print(f"❌ Login failed: {login_resp.text}")
        return

    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("✅ Logged in successfully\n")

    # Create missing permissions
    print("📝 Creating missing permissions...\n")

    permissions_to_create = [
        {"name": "permissions:create", "module": "permissions", "action": "create", "description": "Create new permissions"},
        {"name": "permissions:read", "module": "permissions", "action": "read", "description": "View permissions"},
        {"name": "permissions:update", "module": "permissions", "action": "update", "description": "Update permissions"},
        {"name": "permissions:delete", "module": "permissions", "action": "delete", "description": "Delete permissions"},
        {"name": "permissions:manage", "module": "permissions", "action": "manage", "description": "Full permissions management"},
    ]

    created_perms = []

    for perm in permissions_to_create:
        try:
            resp = requests.post(f"{API_URL}/permissions", json=perm, headers=headers)
            if resp.status_code in [200, 201]:
                created_perms.append(resp.json()["data"])
                print(f"✅ Created: {perm['name']}")
            elif "already exists" in resp.text.lower():
                print(f"⏭️  Already exists: {perm['name']}")
            else:
                print(f"❌ Failed to create {perm['name']}: {resp.text}")
        except Exception as e:
            print(f"❌ Error creating {perm['name']}: {str(e)}")

    print(f"\n✅ Created/verified {len(permissions_to_create)} permissions\n")

    # Get all permissions
    print("📋 Fetching all permissions...")
    all_perms_resp = requests.get(f"{API_URL}/permissions/all", headers=headers)
    all_permissions = all_perms_resp.json()["data"]
    print(f"✅ Total permissions in system: {len(all_permissions)}\n")

    # Get Admin role
    print("🔍 Finding Admin role...")
    roles_resp = requests.get(f"{API_URL}/roles/all", headers=headers)
    roles = roles_resp.json()["data"]
    admin_role = next((r for r in roles if r["name"] == "Admin"), None)

    if not admin_role:
        print("❌ Admin role not found!")
        return

    print(f"✅ Found Admin role: {admin_role['id']}\n")

    # Update Admin role with ALL permissions
    all_perm_ids = [p["id"] for p in all_permissions]

    print(f"🔄 Updating Admin role with {len(all_perm_ids)} permissions...")

    update_resp = requests.put(
        f"{API_URL}/roles/{admin_role['id']}",
        json={
            "name": admin_role["name"],
            "description": admin_role["description"] or "Full system access with all permissions",
            "permission_ids": all_perm_ids
        },
        headers=headers
    )

    if update_resp.status_code == 200:
        print("✅ Admin role updated successfully!\n")
        print("🎉 Setup complete!\n")
        print("💡 Please log out and log back in for permissions to take effect.\n")
        print("\n📜 Permissions now in your Admin role:")
        for p in sorted(all_permissions, key=lambda x: x["name"]):
            print(f"   - {p['name']}")
    else:
        print(f"❌ Failed to update Admin role: {update_resp.text}")

if __name__ == "__main__":
    main()
