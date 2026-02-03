const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const adminDir = path.join(process.cwd(), "src/app/admin");
const adminBackupDir = path.join(process.cwd(), ".admin-backup");

try {
  // Move admin directory out of the way
  if (fs.existsSync(adminDir)) {
    console.log("Temporarily moving admin routes for static export...");
    fs.renameSync(adminDir, adminBackupDir);
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
}
