#!/usr/bin/env python3
import urllib.request
import json
import ssl

# Disable SSL verification for localhost
ssl._create_default_https_context = ssl._create_unverified_context

API = "http://localhost:3000/api"
EMAIL = "rishad@gmail.com"
PASSWORD = "Rishad@123"

def api_call(method, endpoint, data=None, token=None):
    url = f"{API}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    if data:
        data = json.dumps(data).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        return None

print("🔐 Logging in...")
login_resp = api_call("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})

if not login_resp or not login_resp.get("data"):
    print("❌ Login failed")
    exit(1)

token = login_resp["data"]["access_token"]
print("✅ Logged in successfully\n")

# Get all permissions
print("📋 Fetching all permissions...")
perms_resp = api_call("GET", "/permissions", token=token)

if not perms_resp or not perms_resp.get("data"):
    print("❌ Failed to fetch permissions")
    print(f"Response: {perms_resp}")
    exit(1)

all_permissions = perms_resp["data"]
print(f"✅ Found {len(all_permissions)} permissions\n")

# Display all permissions
print("📜 All permissions in system:")
for p in sorted(all_permissions, key=lambda x: x["name"]):
    print(f"   - {p['name']}")
print()

# Get all roles
print("🔍 Fetching all roles...")
roles_resp = api_call("GET", "/roles", token=token)

if not roles_resp or not roles_resp.get("data"):
    print("❌ Failed to fetch roles")
    print(f"Response: {roles_resp}")
    exit(1)

all_roles = roles_resp["data"]
print(f"✅ Found {len(all_roles)} roles\n")

# Find Admin role
admin_role = next((r for r in all_roles if r["name"] == "Admin"), None)

if not admin_role:
    print("❌ Admin role not found!")
    exit(1)

print(f"✅ Found Admin role:")
print(f"   ID: {admin_role['id']}")
print(f"   Name: {admin_role['name']}")
print(f"   Current permissions: {len(admin_role.get('permissions', []))}\n")

# Prepare update with ALL permission IDs
all_perm_ids = [p["id"] for p in all_permissions]

print(f"🔄 Updating Admin role with {len(all_perm_ids)} permissions...")

update_data = {
    "name": admin_role["name"],
    "description": admin_role.get("description") or "Full system access with all permissions",
    "permission_ids": all_perm_ids
}

update_resp = api_call("PUT", f"/roles/{admin_role['id']}", update_data, token=token)

if update_resp and update_resp.get("statusCode") == 200:
    print("✅ Admin role updated successfully!\n")
    print("🎉 Setup complete!\n")
    print(f"📊 Admin role now has {len(all_perm_ids)} permissions:")
    for p in sorted(all_permissions, key=lambda x: x["name"]):
        print(f"   ✓ {p['name']}")
    print()
    print("💡 IMPORTANT: Log out and log back in for permissions to take effect!")
else:
    print(f"❌ Failed to update Admin role")
    print(f"Response: {update_resp}")
