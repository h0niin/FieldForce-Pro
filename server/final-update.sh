#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rishad@gmail.com","password":"Rishad@123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)

echo "✅ Logged in"
echo ""

# Get all permissions (with large page size to get all)
PERMS=$(curl -s "http://localhost:3000/api/permissions?take=100" -H "Authorization: Bearer $TOKEN")
PERM_IDS=$(echo $PERMS | python3 -c "import sys, json; d=json.load(sys.stdin); print(json.dumps([p['id'] for p in d['data']]))")

echo "📋 Found permissions:"
echo $PERMS | python3 -c "import sys, json; d=json.load(sys.stdin); [print(f'   - {p[\"name\"]}') for p in d['data']]"
echo ""

# Get all roles (with large page size)
ROLES=$(curl -s "http://localhost:3000/api/roles?take=100" -H "Authorization: Bearer $TOKEN")
ADMIN_ROLE_ID=$(echo $ROLES | python3 -c "import sys, json; d=json.load(sys.stdin); admin=[r for r in d['data'] if r['name']=='Admin']; print(admin[0]['id'] if admin else '')" 2>/dev/null)

if [ -z "$ADMIN_ROLE_ID" ]; then
  echo "❌ Admin role not found"
  exit 1
fi

echo "✅ Found Admin role: $ADMIN_ROLE_ID"
echo ""

# Update Admin role
echo "🔄 Updating Admin role with ALL permissions..."
UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:3000/api/roles/$ADMIN_ROLE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Admin\",\"description\":\"Full system access with all permissions\",\"permission_ids\":$PERM_IDS}")

echo $UPDATE_RESPONSE | python3 -m json.tool

echo ""
echo "🎉 Done! Log out and log back in to refresh your permissions."
