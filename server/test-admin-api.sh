#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== FilmVault Admin API Testing Script ===${NC}"
echo "This script tests the admin API endpoints for the FilmVault server."
echo

# API URL - default to localhost:3000
API_URL=${API_URL:-"http://localhost:3000"}
echo -e "${BLUE}API URL: ${API_URL}${NC}"

# Admin JWT token - the script requires this to be set
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Error: ADMIN_TOKEN environment variable not set.${NC}"
  echo "Please login as an admin user and set the JWT token as an environment variable:"
  echo "export ADMIN_TOKEN=your_jwt_token"
  exit 1
fi

echo -e "${BLUE}Using admin token: ${ADMIN_TOKEN:0:20}...${NC}"
echo

# Function to make API calls
call_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  echo -e "${BLUE}Testing ${method} ${endpoint}${NC}"
  
  if [ -z "$data" ]; then
    curl -s -X "${method}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      "${API_URL}${endpoint}" | jq .
  else
    curl -s -X "${method}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -d "${data}" \
      "${API_URL}${endpoint}" | jq .
  fi
  
  echo
}

# Test 1: Get all users
echo -e "${GREEN}Test 1: Get all users${NC}"
call_api "GET" "/api/admin/users"

# Store the first non-admin user ID
# USER_ID=$(curl -s -X "GET" -H "Authorization: Bearer ${ADMIN_TOKEN}" "${API_URL}/api/admin/users" | jq '.[] | select(.is_admin == 0) | .id' | head -1)
USER_ID=5  # For testing, hardcode a user ID

if [ -z "$USER_ID" ]; then
  echo -e "${RED}No non-admin user found for testing.${NC}"
  exit 1
fi

echo -e "${BLUE}Selected user ID for testing: ${USER_ID}${NC}"
echo

# Test 2: Make user admin
echo -e "${GREEN}Test 2: Make user admin (User ID: ${USER_ID})${NC}"
call_api "POST" "/api/admin/users/${USER_ID}/make-admin"

# Test 3: Remove admin from user
echo -e "${GREEN}Test 3: Remove admin from user (User ID: ${USER_ID})${NC}"
call_api "POST" "/api/admin/users/${USER_ID}/remove-admin"

# DO NOT test the delete user endpoint by default, as it permanently removes the user
# Uncomment the line below if you want to test it
# echo -e "${GREEN}Test 4: Delete user (User ID: ${USER_ID})${NC}"
# call_api "DELETE" "/api/admin/users/${USER_ID}"

echo -e "${GREEN}All tests completed.${NC}"