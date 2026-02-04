const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const adminDir = path.join(process.cwd(), "src/app/admin");
const adminBackupDir = path.join(process.cwd(), ".admin-backup");
const apiGetPhotosDir = path.join(process.cwd(), "src/app/api/get-photos");
const apiGetPhotosBackup = path.join(process.cwd(), ".api-get-photos-backup");
const apiAutoTagDir = path.join(process.cwd(), "src/app/api/auto-tag-photos");
const apiAutoTagBackup = path.join(process.cwd(), ".api-auto-tag-backup");

try {
  // Move admin directory out of the way
  if (fs.existsSync(adminDir)) {
    console.log("Temporarily moving admin routes for static export...");
    fs.renameSync(adminDir, adminBackupDir);
  }

  // Move admin-related API routes
  if (fs.existsSync(apiGetPhotosDir)) {
    fs.renameSync(apiGetPhotosDir, apiGetPhotosBackup);
  }
  if (fs.existsSync(apiAutoTagDir)) {
    fs.renameSync(apiAutoTagDir, apiAutoTagBackup);
  }

  // Build the site
  console.log("Building site...");
  execSync("next build", { stdio: "inherit" });

  console.log("✓ Build completed successfully");
} catch (error) {
  console.error("Build failed:", error.message);
  throw error;
} finally {
  // Restore admin directory
  if (fs.existsSync(adminBackupDir)) {
    console.log("Restoring admin routes...");
    fs.renameSync(adminBackupDir, adminDir);
  }

  // Restore API routes
  if (fs.existsSync(apiGetPhotosBackup)) {
    fs.renameSync(apiGetPhotosBackup, apiGetPhotosDir);
  }
  if (fs.existsSync(apiAutoTagBackup)) {
    fs.renameSync(apiAutoTagBackup, apiAutoTagDir);
  }
}
