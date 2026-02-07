#!/bin/bash

# Upload assets to Cloudflare R2
# This script syncs the local content/assets/ directory to your R2 bucket

set -e

echo "🚀 Uploading assets to Cloudflare R2..."

# Load .env.r2 if it exists
if [ -f ".env.r2" ]; then
    echo "📝 Loading credentials from .env.r2..."
    set -a  # automatically export all variables
    source .env.r2
    set +a
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Installing..."
    echo "Run: brew install awscli"
    echo "Or: pip install awscli"
    exit 1
fi

# Configuration - you can override these with environment variables
R2_ENDPOINT="${R2_ENDPOINT:-}"
R2_BUCKET_NAME="${R2_BUCKET_NAME:-blog-assets}"
ASSETS_DIR="${ASSETS_DIR:-content/assets}"

# Check if endpoint is set
if [ -z "$R2_ENDPOINT" ]; then
    echo "❌ R2_ENDPOINT not set"
    echo "Set it with: export R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
    echo "Or create a .env file in the project root"
    exit 1
fi

# Check if assets directory exists
if [ ! -d "$ASSETS_DIR" ]; then
    echo "❌ Assets directory not found: $ASSETS_DIR"
    exit 1
fi

# Count files to upload
FILE_COUNT=$(find "$ASSETS_DIR" -type f | wc -l | tr -d ' ')
echo "📦 Found $FILE_COUNT files to sync"

# Perform the sync
echo "📤 Syncing $ASSETS_DIR/ to s3://$R2_BUCKET_NAME/..."
aws s3 sync "$ASSETS_DIR/" "s3://$R2_BUCKET_NAME/" \
    --endpoint-url "$R2_ENDPOINT" \
    --exclude ".DS_Store" \
    --exclude ".gitkeep" \
    --delete

echo "✅ Upload complete!"
echo ""
echo "To verify, run:"
echo "aws s3 ls s3://$R2_BUCKET_NAME/ --endpoint-url $R2_ENDPOINT --recursive"
