#!/bin/bash
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" -H "Content-Type: application/json" -d '{"email":"rishad@gmail.com","password":"Rishad@123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)

curl -s "http://localhost:3000/api/roles?take=100" -H "Authorization: Bearer $TOKEN"
