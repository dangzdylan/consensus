#!/bin/bash
echo "=== Testing Backend Connection ==="
echo ""
echo "1. Testing login endpoint..."
curl -X POST http://127.0.0.1:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  2>/dev/null || echo "❌ Backend not accessible"
echo ""
echo "2. Testing signup endpoint..."
curl -X POST http://127.0.0.1:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  2>/dev/null || echo "❌ Backend not accessible"
echo ""
echo "=== Test Complete ==="
