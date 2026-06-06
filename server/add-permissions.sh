#!/bin/bash

API_URL="http://localhost:3000/api"
USER_EMAIL="rishad@gmail.com"
USER_PASSWORD="Rishad@123"

echo "🔐 Logging in..."

# Login to get token
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Create missing permissions
echo "📝 Creating missing permissions..."
echo ""

# Array of permissions to create
declare -a PERMISSIONS=(
  '{"name":"permissions:create","module":"permissions","action":"create","description":"Create new permissions"}'
  '{"name":"permissions:read","module":"permissions","action":"read","description":"View permissions"}'
  '{"name":"permissions:update","module":"permissions","action":"update","description":"Update permissions"}'
  '{"name":"permissions:delete","module":"permissions","action":"delete","description":"Delete permissions"}'
  '{"name":"permissions:manage","module":"permissions","action":"manage","description":"Full permissions management"}'
)

for PERMISSION in "${PERMISSIONS[@]}"; do
  PERM_NAME=$(echo $PERMISSION | grep -o '"name":"[^"]*' | cut -d'"' -f4)

  RESPONSE=$(curl -s -X POST "$API_URL/permissions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$PERMISSION")

  if echo "$RESPONSE" | grep -q "statusCode\":201\|statusCode\":200"; then
    echo "✅ Created: $PERM_NAME"
  elif echo "$RESPONSE" | grep -q "already exists"; then
    echo "⏭️  Already exists: $PERM_NAME"
  else
    echo "❌ Failed to create $PERM_NAME"
  fi
done

echo ""
echo "🔍 Getting all permissions..."

# Get all permissions
ALL_PERMS_RESPONSE=$(curl -s -X GET "$API_URL/permissions/all" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Fetched all permissions"
echo ""

echo "🔍 Finding Admin role..."

# Get all roles to find Admin
ROLES_RESPONSE=$(curl -s -X GET "$API_URL/roles/all" \
  -H "Authorization: Bearer $TOKEN")

# Extract Admin role ID (this is a simple grep, might need adjustment based on actual response)
ADMIN_ROLE_ID=$(echo $ROLES_RESPONSE | grep -o '"id":"[^"]*","tenant_id":"[^"]*","name":"Admin"' | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ADMIN_ROLE_ID" ]; then
  echo "❌ Admin role not found!"
  exit 1
fi

echo "✅ Found Admin role: $ADMIN_ROLE_ID"
echo ""

# Extract all permission IDs from the response
PERMISSION_IDS=$(echo $ALL_PERMS_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | tr '\n' ',' | sed 's/,$//')

# Convert to JSON array format
PERMISSION_IDS_JSON=$(echo $PERMISSION_IDS | sed 's/,/","/g' | sed 's/^/["/' | sed 's/$/"]/')

echo "🔄 Updating Admin role with all permissions..."

# Update Admin role
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/roles/$ADMIN_ROLE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Admin\",\"description\":\"Full system access with all permissions\",\"permission_ids\":$PERMISSION_IDS_JSON}")

if echo "$UPDATE_RESPONSE" | grep -q "statusCode\":200"; then
  echo "✅ Admin role updated successfully!"
  echo ""
  echo "🎉 Setup complete!"
  echo ""
  echo "💡 Please log out and log back in for permissions to take effect."
  echo ""
else
  echo "❌ Failed to update Admin role"
  echo "$UPDATE_RESPONSE"
fi
