#!/bin/bash

TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rishad@gmail.com","password":"Rishad@123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)

echo "Token obtained: ${TOKEN:0:50}..."
echo ""

echo "Creating permissions:create..."
curl -s -X POST "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:create","module":"permissions","action":"create","description":"Can create permissions"}'
echo ""

echo "Creating permissions:read..."
curl -s -X POST "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:read","module":"permissions","action":"read","description":"Can read permissions"}'
echo ""

echo "Creating permissions:update..."
curl -s -X POST "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:update","module":"permissions","action":"update","description":"Can update permissions"}'
echo ""

echo "Creating permissions:delete..."
curl -s -X POST "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:delete","module":"permissions","action":"delete","description":"Can delete permissions"}'
echo ""

echo "Creating permissions:manage..."
curl -s -X POST "http://localhost:3000/api/permissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"permissions:manage","module":"permissions","action":"manage","description":"Can manage permissions"}'
echo ""

echo "Done! Check your database now."
