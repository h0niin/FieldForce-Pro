#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rishad@gmail.com","password":"Rishad@123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)

echo "✅ Logged in"
echo ""

# Get all permissions with Contacts (capital C)
echo "📋 Finding Contacts permissions..."
PERMS=$(curl -s "http://localhost:3000/api/permissions?take=100&search=Contacts" -H "Authorization: Bearer $TOKEN")

echo "$PERMS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'data' in data:
    for p in data['data']:
        if p['name'].startswith('Contacts:'):
            print(f\"Found: {p['name']} (ID: {p['id']})\")
"

echo ""
echo "⚠️  Please run the SQL script to fix these permissions:"
echo "   psql -U your_user -d your_database -f fix-contacts-permissions.sql"
