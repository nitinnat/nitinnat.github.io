const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const heicConvert = require("heic-convert");

const SOURCE_DIR = path.join(process.cwd(), "content/assets");
const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);
const COMMAND_CANDIDATES = [
  {
    name: "sips",
    args: (src, dest) => ["-s", "format", "jpeg", src, "--out", dest],
  },
  {
    name: "heif-convert",
    args: (src, dest) => [src, dest],
  },
  {
    name: "magick",
    args: (src, dest) => [src, dest],
  },
  {
    name: "convert",
    args: (src, dest) => [src, dest],
  },
];

function collectHeicFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectHeicFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (HEIC_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function commandExists(command) {
  const result = spawnSync("which", [command], { stdio: "ignore" });
  return result.status === 0;
}

function runCommand(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status === 0) {
    return { ok: true, message: "" };
  }
  const message = [result.stdout, result.stderr]
    .filter((value) => value && value.trim())
    .join("\n");
  return { ok: false, message };
}

async function convertHeicFile(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, path.extname(srcPath));
  const targetPath = path.join(dir, `${base}.jpg`);

  if (fs.existsSync(targetPath)) {
    const [srcStat, destStat] = [
      fs.statSync(srcPath),
      fs.statSync(targetPath),
    ];
    if (destStat.mtimeMs >= srcStat.mtimeMs) {
      fs.unlinkSync(srcPath);
      return "removed";
    }
  }

  let lastError = "";

  for (const candidate of COMMAND_CANDIDATES) {
    if (!commandExists(candidate.name)) continue;
    const result = runCommand(candidate.name, candidate.args(srcPath, targetPath));
    if (result.ok) {
      fs.unlinkSync(srcPath);
      return "converted";
    }
    lastError = result.message || `${candidate.name} failed.`;
  }

  try {
    const inputBuffer = fs.readFileSync(srcPath);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.9,
    });
    fs.writeFileSync(targetPath, outputBuffer);
    fs.unlinkSync(srcPath);
    return "converted";
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown conversion error";
    const details = lastError ? `${lastError}\n${message}` : message;
    throw new Error(details);
  }
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log("No assets directory found, skipping HEIC conversion.");
    return;
  }

  const heicFiles = collectHeicFiles(SOURCE_DIR);
  if (heicFiles.length === 0) {
    console.log("No HEIC/HEIF files found, skipping conversion.");
    return;
  }

  let converted = 0;
  let removed = 0;
  for (const file of heicFiles) {
    const result = await convertHeicFile(file);
    if (result === "converted") converted += 1;
    if (result === "removed") removed += 1;
  }

  console.log(
    `Converted ${converted} HEIC/HEIF file${converted === 1 ? "" : "s"} to JPG.`
  );
  if (removed > 0) {
    console.log(
      `Removed ${removed} HEIC/HEIF original${removed === 1 ? "" : "s"}.`
    );
  }
}

main().catch((error) => {
  console.error("HEIC conversion failed:", error);
  process.exit(1);
});
