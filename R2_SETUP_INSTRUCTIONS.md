# R2 Upload Instructions

## One-Time Setup

### 1. Install AWS CLI

```bash
# macOS
brew install awscli

# Or using pip
pip install awscli
```

### 2. Configure Your Credentials

Create a file called `.env.r2` in the project root:

```bash
cp .env.r2.example .env.r2
```

Edit `.env.r2` and fill in your values:
```bash
export R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
export R2_BUCKET_NAME=blog-assets
export AWS_ACCESS_KEY_ID=your_r2_access_key_id
export AWS_SECRET_ACCESS_KEY=your_r2_secret_access_key
```

**Where to find these values:**
- `R2_ENDPOINT`: Shown on the API token creation confirmation page in Cloudflare dashboard
- `R2_BUCKET_NAME`: The name you gave your bucket (e.g., `blog-assets`)
- `AWS_ACCESS_KEY_ID`: The "Access Key ID" from your R2 API token
- `AWS_SECRET_ACCESS_KEY`: The "Secret Access Key" from your R2 API token

### 3. Make Upload Script Executable

```bash
chmod +x scripts/upload-to-r2.sh
```

## Initial Upload (All Assets)

Run this to upload all your current assets:

```bash
# Load your credentials
source .env.r2

# Upload everything
./scripts/upload-to-r2.sh
```

This will sync all 199 files from `content/assets/` to your R2 bucket.

## Future Uploads (New Assets)

When you add new photos or documents:

1. Add them to `content/assets/` locally
2. Run the upload script:
   ```bash
   source .env.r2
   ./scripts/upload-to-r2.sh
   ```

The script uses `aws s3 sync`, which:
- Only uploads new or changed files (fast!)
- Skips files that already exist and haven't changed
- Can optionally delete files from R2 that you've deleted locally (currently enabled with `--delete` flag)

## Verify Upload

Check what's in your R2 bucket:

```bash
source .env.r2
aws s3 ls s3://$R2_BUCKET_NAME/ --endpoint-url $R2_ENDPOINT --recursive
```

## Troubleshooting

### "Command not found: aws"
Install AWS CLI: `brew install awscli`

### "Unable to locate credentials"
Make sure you ran `source .env.r2` first

### "Access Denied"
Check that your R2 API token has "Object Read & Write" permissions

### Wrong endpoint
Double-check your `R2_ENDPOINT` in `.env.r2` - it should look like:
`https://abc123.r2.cloudflarestorage.com` (no bucket name in the URL)

## Security Notes

- `.env.r2` is gitignored (contains secrets)
- Never commit your API credentials to git
- The R2 API token gives full read/write access to your bucket - keep it secure
