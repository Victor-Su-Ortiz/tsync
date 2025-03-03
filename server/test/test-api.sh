#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
API_URL="http://localhost:3000/api/v1"
TOKEN=""

# Function to print colored output
print_message() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to make API calls and handle responses
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
     local auth_header=()

    if [ ! -z "$TOKEN" ]; then
        auth_header=(-H "Authorization: Bearer $TOKEN")
    fi

    if [ ! -z "$data" ]; then
        response=$(curl -s -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            "${auth_header[@]}" \
            -d "$data")
    else
        response=$(curl -s -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            "${auth_header[@]}")
    fi

    echo "$response"
}

# Test Registration
test_registration() {
    print_message "Testing User Registration"
    
    local data='{
        "name": "John Doe",
        "email": "john@example.com",
        "password": "Password123!"
    }'
    
    local response=$(make_request "POST" "/auth/register" "$data")
    
    if echo $response | grep -q "token"; then
        print_success "Registration successful"
        TOKEN=$(echo $response | jq -r '.token')
    else
        print_error "Registration failed: $response"
    fi
}

# Test Login
test_login() {
    print_message "Testing User Login"
    
    local data='{
        "email": "john@example.com",
        "password": "Password123!"
    }'
    
    local response=$(make_request "POST" "/auth/login" "$data")
    
    if echo $response | grep -q "token"; then
        print_success "Login successful"
        TOKEN=$(echo $response | jq -r '.token')
    else
        print_error "Login failed: $response"
    fi
}

# Test Get Profile
test_get_profile() {
    print_message "Testing Get Profile"
    
    local response=$(make_request "GET" "/users/profile")

    print_message "Response: $response"
    
    if echo $response | grep -q "name"; then
        print_success "Got profile successfully"
    else
        print_error "Failed to get profile: $response"
    fi
}

# Test Update Profile
test_update_profile() {
    print_message "Testing Update Profile"
    
    local data='{
        "name": "John Updated",
        "phoneNumber": "+1234567890"
    }'
    
    local response=$(make_request "PATCH" "/users/profile" "$data")
    
    if echo $response | grep -q "name"; then
        print_success "Profile updated successfully"
    else
        print_error "Failed to update profile: $response"
    fi
}

# Test Change Password
test_change_password() {
    print_message "Testing Change Password"
    
    local data='{
        "currentPassword": "Password123!",
        "newPassword": "NewPassword123!",
        "confirmPassword": "NewPassword123!"
    }'
    
    local response=$(make_request "PATCH" "/users/change-password" "$data")
    
    if echo $response | grep -q "success"; then
        print_success "Password changed successfully"
    else
        print_error "Failed to change password: $response"
    fi
}

test_get_users() {
    print_message "Testing Get Users"

    local response=$(make_request "GET" "/users")

    if echo $response | grep -q "name"; then
        print_success "Got users successfully"
    else
        print_error "Failed to get users: $response"
    fi
}

# Main execution
main() {
    echo "Starting API Tests..."
    echo "===================="
    
    # Run tests
    test_registration
    sleep 1
    
    test_login
    sleep 1
    
    if [ ! -z "$TOKEN" ]; then
        test_get_profile
        sleep 1
        
        test_update_profile
        sleep 1
        
        test_change_password
        sleep 1

        test_get_users
        sleep 1
    else
        print_error "Skipping authenticated tests - no token available"
    fi
    
    echo "===================="
    echo "Tests completed"
}

# Run main function
main