const fs = require("fs");
const path = require("path");

const sourceDir = path.join(process.cwd(), "content/assets");
const targetDir = path.join(process.cwd(), "public/assets");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log("No assets directory found, skipping asset copy.");
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(sourceDir, targetDir);
console.log("Assets copied successfully from content/assets to public/assets");
