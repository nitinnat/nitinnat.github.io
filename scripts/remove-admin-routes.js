const fs = require("fs");
const path = require("path");

const adminDir = path.join(process.cwd(), "out/admin");

if (fs.existsSync(adminDir)) {
  fs.rmSync(adminDir, { recursive: true });
  console.log("✓ Removed admin routes from build output");
} else {
  console.log("✓ No admin routes to remove");
}
