#!/bin/bash

# Test script to verify UnionBank OAuth endpoint with curl
# This helps diagnose if the issue is IP whitelisting or credential problems

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "=========================================="
echo "UnionBank OAuth Token Endpoint Test"
echo "=========================================="
echo ""
echo "Testing endpoint: https://api-uat.unionbankph.com/ubp/uat/partners/v1/oauth2/token"
echo ""

# Check if required variables are set
if [ -z "$UNIONBANK_OAUTH_CLIENT_ID" ]; then
  echo "ERROR: UNIONBANK_OAUTH_CLIENT_ID is not set"
  exit 1
fi

if [ -z "$UNIONBANK_USERNAME" ]; then
  echo "ERROR: UNIONBANK_USERNAME is not set"
  exit 1
fi

if [ -z "$UNIONBANK_PASSWORD" ]; then
  echo "ERROR: UNIONBANK_PASSWORD is not set"
  exit 1
fi

if [ -z "$UNIONBANK_SCOPE" ]; then
  echo "ERROR: UNIONBANK_SCOPE is not set"
  exit 1
fi

echo "Credentials check:"
echo "  OAuth Client ID: ${UNIONBANK_OAUTH_CLIENT_ID:0:8}...${UNIONBANK_OAUTH_CLIENT_ID: -4}"
echo "  Username: ${UNIONBANK_USERNAME:0:4}...${UNIONBANK_USERNAME: -4}"
echo "  Scope: $UNIONBANK_SCOPE"
echo ""
echo "Making request..."
echo ""

# Make the curl request exactly as per UnionBank documentation
curl -v -L -X POST 'https://api-uat.unionbankph.com/ubp/uat/partners/v1/oauth2/token' \
  -H 'accept: application/json' \
  -H 'content-type: application/x-www-form-urlencoded' \
  --data-urlencode "grant_type=password" \
  --data-urlencode "client_id=$UNIONBANK_OAUTH_CLIENT_ID" \
  --data-urlencode "username=$UNIONBANK_USERNAME" \
  --data-urlencode "password=$UNIONBANK_PASSWORD" \
  --data-urlencode "scope=$UNIONBANK_SCOPE"

echo ""
echo ""
echo "=========================================="
echo "Test completed"
echo "=========================================="
echo ""
echo "If you get 403 Access Denied:"
echo "  - This is likely an IP whitelisting issue"
echo "  - Contact UnionBank support to whitelist your IP address"
echo "  - Reference: 0.1a2d2d17.1769411462.f20737b"
echo ""
echo "If you get 401 Unauthorized:"
echo "  - Check your credentials (client_id, username, password)"
echo "  - Verify credentials match the UAT environment"
echo ""
echo "If you get 200 OK:"
echo "  - Your credentials and IP are correct"
echo "  - The issue may be in the application code"
echo ""
