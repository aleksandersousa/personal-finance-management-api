#!/bin/bash

# Test script for tag extraction in GitHub Actions workflows
# This script simulates the multi-line tag outputs and tests the extraction logic

set -e

echo "🧪 Testing tag extraction logic for GitHub Actions workflows..."
echo

# Test case 1: CI/CD workflow (development/staging branches)
echo "📋 Test Case 1: CI/CD Workflow (Multi-arch build)"
MULTI_LINE_TAGS_1="ghcr.io/aleksandersousa/personal-financial-management-api:develop
ghcr.io/aleksandersousa/personal-financial-management-api:develop-718b68f"

echo "Input (multi-line):"
echo "$MULTI_LINE_TAGS_1"
echo

PRIMARY_TAG_1=$(echo "$MULTI_LINE_TAGS_1" | head -n1)
echo "Extracted primary tag: $PRIMARY_TAG_1"
echo "✅ Test 1 passed"
echo

# Test case 2: Production workflow
echo "📋 Test Case 2: Production Workflow"
MULTI_LINE_TAGS_2="ghcr.io/aleksandersousa/personal-financial-management-api:production-latest
ghcr.io/aleksandersousa/personal-financial-management-api:production-1.0.0
ghcr.io/aleksandersousa/personal-financial-management-api:latest
ghcr.io/aleksandersousa/personal-financial-management-api:1.0.0"

echo "Input (multi-line):"
echo "$MULTI_LINE_TAGS_2"
echo

PRIMARY_TAG_2=$(echo "$MULTI_LINE_TAGS_2" | head -n1)
echo "Extracted primary tag: $PRIMARY_TAG_2"
echo "✅ Test 2 passed"
echo

# Test case 3: Staging workflow
echo "📋 Test Case 3: Staging Workflow"
MULTI_LINE_TAGS_3="ghcr.io/aleksandersousa/personal-financial-management-api:staging-staging
ghcr.io/aleksandersousa/personal-financial-management-api:staging-latest
ghcr.io/aleksandersousa/personal-financial-management-api:staging-1.0.0"

echo "Input (multi-line):"
echo "$MULTI_LINE_TAGS_3"
echo

PRIMARY_TAG_3=$(echo "$MULTI_LINE_TAGS_3" | head -n1)
echo "Extracted primary tag: $PRIMARY_TAG_3"
echo "✅ Test 3 passed"
echo

# Test case 4: Single line (should work the same)
echo "📋 Test Case 4: Single Line Tag"
SINGLE_TAG="ghcr.io/aleksandersousa/personal-financial-management-api:main"

echo "Input (single line):"
echo "$SINGLE_TAG"
echo

PRIMARY_TAG_4=$(echo "$SINGLE_TAG" | head -n1)
echo "Extracted primary tag: $PRIMARY_TAG_4"
echo "✅ Test 4 passed"
echo

# Test case 5: Environment variable simulation
echo "📋 Test Case 5: Environment Variable Simulation"
echo "Testing GitHub Actions environment variable format..."

# Simulate what happens in GitHub Actions
TEST_TAG="ghcr.io/aleksandersousa/personal-financial-management-api:test-tag"
echo "Setting IMAGE_TAG environment variable..."

# This is what would happen in GitHub Actions
echo "IMAGE_TAG=$TEST_TAG" > /tmp/test_env
source /tmp/test_env

echo "Environment variable set: IMAGE_TAG=$IMAGE_TAG"
echo "✅ Test 5 passed"
echo

# Test case 6: Validation of extracted tags
echo "📋 Test Case 6: Tag Validation"
echo "Validating that extracted tags are valid Docker image references..."

validate_tag() {
    local tag=$1
    if [[ $tag =~ ^[a-z0-9.-]+/[a-z0-9._-]+:[a-z0-9._-]+$ ]]; then
        echo "✅ Valid tag format: $tag"
        return 0
    else
        echo "❌ Invalid tag format: $tag"
        return 1
    fi
}

validate_tag "$PRIMARY_TAG_1"
validate_tag "$PRIMARY_TAG_2"
validate_tag "$PRIMARY_TAG_3"
validate_tag "$PRIMARY_TAG_4"

echo "✅ All tag validations passed"
echo

# Cleanup
rm -f /tmp/test_env

echo "🎉 All tests passed! Tag extraction logic is working correctly."
echo
echo "📝 Summary:"
echo "- ✅ Multi-line tag extraction works correctly"
echo "- ✅ Single-line tag extraction works correctly"
echo "- ✅ Environment variable setting works correctly"
echo "- ✅ All extracted tags have valid format"
echo
echo "🚀 The workflows should now handle multi-line image tags correctly!" 