#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API="http://localhost:3000/api"

echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rishad@gmail.com","password":"Rishad@123"}' \
  | grep -o '"access_token":"[^"]*"' \
  | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""
echo "📝 Creating permissions..."
echo ""

# Create permissions one by one
curl -s -X POST "$API/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:create","module":"permissions","action":"create","description":"Create new permissions"}' | grep -q "statusCode" && echo "✅ permissions:create"

curl -s -X POST "$API/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:read","module":"permissions","action":"read","description":"View permissions"}' | grep -q "statusCode" && echo "✅ permissions:read"

curl -s -X POST "$API/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:update","module":"permissions","action":"update","description":"Update permissions"}' | grep -q "statusCode" && echo "✅ permissions:update"

curl -s -X POST "$API/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:delete","module":"permissions","action":"delete","description":"Delete permissions"}' | grep -q "statusCode" && echo "✅ permissions:delete"

curl -s -X POST "$API/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:manage","module":"permissions","action":"manage","description":"Full permissions management"}' | grep -q "statusCode" && echo "✅ permissions:manage"

echo ""
echo "🔄 Fetching Admin role and all permissions..."

# Save responses to files for easier parsing
curl -s -X GET "$API/roles/all" -H "Authorization: Bearer $TOKEN" > /tmp/roles.json
curl -s -X GET "$API/permissions/all" -H "Authorization: Bearer $TOKEN" > /tmp/perms.json

echo "✅ Data fetched"
echo ""
echo "🎉 Done! Now please:"
echo "   1. Go to http://localhost:3000/api/docs"
echo "   2. Check the Roles and Permissions endpoints"
echo "   3. Use the web UI at /settings/roles to manage roles and permissions"
echo ""
echo "💡 Log out and log back in to refresh your permissions"
