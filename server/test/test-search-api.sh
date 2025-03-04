#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL for API - adjust this to match your server setup
API_BASE_URL="http://localhost:3000/api/v1"
AUTH_TOKEN=""
DEBUG=true

# Test tracking
TESTS_FAILED=0

# Helper functions
print_message() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

debug() {
    if [ "$DEBUG" = true ]; then
        echo -e "${BLUE}DEBUG: $1${NC}"
    fi
}

# Fixed make_request function to properly handle query parameters and auth header
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local curl_cmd="curl -s -X $method"
    
    # Add authorization header if token exists
    if [ ! -z "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    fi
    
    # Add content type header
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    # Handle GET requests with query parameters
    if [ "$method" == "GET" ]; then
        if [ ! -z "$data" ]; then
            curl_cmd="$curl_cmd '$API_BASE_URL$endpoint?$data'"
        else
            curl_cmd="$curl_cmd '$API_BASE_URL$endpoint'"
        fi
    else {
        # Handle POST/PUT/DELETE with JSON body
        if [ -z "$data" ]; then
            data="{}"
        fi
        curl_cmd="$curl_cmd -d '$data' '$API_BASE_URL$endpoint'"
    }
    fi
    
    debug "Executing: $curl_cmd"
    eval $curl_cmd
}

setup() {
    print_message "Setting up test environment"
    
    # Create test user and login to get token
    local login_data='{"email":"testuser@example.com","password":"Password123!"}'
    local login_response=$(make_request "POST" "/auth/login" "$login_data")
    
    if echo "$login_response" | grep -q "Invalid credentials"; then
        # User doesn't exist, register first
        local register_data='{"name":"Test User","email":"testuser@example.com","password":"Password123!"}'
        local register_response=$(make_request "POST" "/auth/register" "$register_data")
        debug "Register response: $register_response"
        
        # Extract token from register response
        AUTH_TOKEN=$(echo $register_response | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    else
        # Extract token from login response
        AUTH_TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    fi
    
    if [ -z "$AUTH_TOKEN" ]; then
        print_error "Failed to get auth token. Cannot proceed with tests."
        exit 1
    else
        print_success "Got authentication token"
    fi
}

# User search test cases
test_search_users_success() {
    print_message "Testing user search with valid query"

    # The query parameter 'q' MUST be present with at least 2 characters
    local response=$(make_request "GET" "/users/search" "q=test")
    debug "Search response: $response"

    if echo "$response" | grep -q '"users"' || echo "$response" | grep -q "status.*success"; then
        print_success "Search returned results as expected"
    else
        print_error "Failed to search users: $response"
    fi
}

test_search_users_invalid_query() {
    print_message "Testing user search with invalid query (too short)"

    # Send a single character query which should be rejected by Joi validation
    local response=$(make_request "GET" "/users/search" "q=a")
    debug "Invalid query response: $response"
    
    # Match the exact Joi validation error message
    if echo "$response" | grep -q "at least 2 characters"; then
        print_success "Server correctly rejected short search query"
    else
        print_error "Server did not properly validate short search query: $response"
    fi
}

test_search_users_missing_query() {
    print_message "Testing user search with missing query"

    # Send a request without the 'q' parameter which is required by Joi
    local response=$(make_request "GET" "/users/search" "")
    debug "Missing query response: $response"
    
    # Match the exact Joi validation error message
    if echo "$response" | grep -q "Search query is required"; then
        print_success "Server correctly rejected missing search query"
    else
        print_error "Server did not properly validate missing search query: $response"
    fi
}

test_search_users_with_limit() {
    print_message "Testing user search with custom limit"

    # Send both q and limit parameters which should pass Joi validation
    local response=$(make_request "GET" "/users/search" "q=test&limit=5")
    debug "Search with limit response: $response"

    if echo "$response" | grep -q '"users"' || echo "$response" | grep -q "status.*success"; then
        print_success "Search with custom limit returned successfully"
    else
        print_error "Failed to search with custom limit: $response"
    fi
}

test_search_users_unauthorized() {
    print_message "Testing user search without authentication"
    
    # Temporarily clear the auth token
    local temp_token=$AUTH_TOKEN
    AUTH_TOKEN=""
    
    local response=$(make_request "GET" "/users/search" "q=test")
    debug "Unauthorized response: $response"
    
    # Restore auth token
    AUTH_TOKEN=$temp_token
    
    # Your API should return an authentication error
    if echo "$response" | grep -q "Not authorized" || echo "$response" | grep -q "Authentication"; then
        print_success "Server correctly rejected unauthenticated search request"
    else
        print_error "Server allowed search without authentication: $response"
    fi
}

# Create a second test user for more comprehensive search testing
create_second_user() {
    print_message "Creating second test user for search testing"
    
    local register_data='{"name":"Another User","email":"anotheruser@example.com","password":"Password123!"}'
    local register_response=$(make_request "POST" "/auth/register" "$register_data")
    debug "Second user creation response: $register_response"
    
    if echo "$register_response" | grep -q '"token":' || echo "$register_response" | grep -q "already registered"; then
        print_success "Created or found second test user"
    else
        print_error "Failed to create second test user: $register_response"
    fi
}

test_search_multiple_results() {
    print_message "Testing search with multiple expected results"

    # Search for a term that should match both test users
    local response=$(make_request "GET" "/users/search" "q=user")
    debug "Multiple results response: $response"

    # Check for multiple users in the response
    if echo "$response" | grep -q '"users":\[.*,.*\]'; then
        print_success "Search returned multiple users as expected"
    else
        local count=$(echo "$response" | grep -o '"_id"' | wc -l)
        if [ "$count" -gt 1 ]; then
            print_success "Search returned multiple users as expected ($count users found)"
        else
            print_error "Search should have returned multiple users but didn't: $response"
        fi
    fi
}

run_tests() {
    # Setup test environment
    setup

    # Run search tests
    test_search_users_success
    test_search_users_invalid_query
    test_search_users_missing_query
    test_search_users_with_limit
    test_search_users_unauthorized
    
    # Create second user and test more complex scenarios
    create_second_user
    test_search_multiple_results
    
    # Final results
    if [ $TESTS_FAILED -eq 0 ]; then
        print_message "\nAll user search tests passed!"
    else
        print_message "\n$TESTS_FAILED user search tests failed!"
    fi
    
    return $TESTS_FAILED
}

# Execute all tests
run_tests