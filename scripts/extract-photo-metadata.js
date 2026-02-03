const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const PHOTO_ASSETS_PATH = path.join(process.cwd(), "content/assets/photos");
const METADATA_PATH = path.join(process.cwd(), "content/photos-metadata.json");

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(dateString) {
  if (!dateString) return null;
  const match = dateString.match(/(\d{4}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const year = match[1];
  const month = parseInt(match[2], 10);
  return `${MONTHS[month - 1]}, ${year}`;
}

function parseGPS(latStr, lonStr) {
  if (!latStr || !lonStr) return null;

  const parseDMS = (str) => {
    const match = str.match(
      /(\d+)\s+deg\s+(\d+)'\s+([\d.]+)"\s+([NSEW])/
    );
    if (!match) return null;
    let value =
      parseInt(match[1]) + parseInt(match[2]) / 60 + parseFloat(match[3]) / 3600;
    if (match[4] === "S" || match[4] === "W") value *= -1;
    return value;
  };

  const lat = parseDMS(latStr);
  const lon = parseDMS(lonStr);
  return lat !== null && lon !== null ? { lat, lon } : null;
}

function reverseGeocode(lat, lon) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    https
      .get(url, { headers: { "User-Agent": "photo-tagger" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.address || null);
          } catch (e) {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

function extractAddressLocation(address) {
  if (!address) return null;

  let location = null;

  if (address.state) {
    location = `${address.city || address.county || "Location"}, ${address.state}`;
  } else if (address.county) {
    location = `${address.county}`;
  } else if (address.country) {
    if (address.city) {
      location = `${address.city}, ${address.country}`;
    } else {
      location = address.country;
    }
  }

  return location || null;
}

function extractExifData(photoPath) {
  try {
    const output = execSync(`exiftool "${photoPath}"`, {
      encoding: "utf-8",
    });

    const lines = output.split("\n");
    let dateTime = null;
    let gpsLat = null;
    let gpsLon = null;

    for (const line of lines) {
      if (line.includes("Date/Time Original")) {
        dateTime = line.split(":").slice(1).join(":").trim();
      } else if (line.includes("GPS Latitude") && !line.includes("Ref")) {
        gpsLat = line.split(":").slice(1).join(":").trim();
      } else if (line.includes("GPS Longitude") && !line.includes("Ref")) {
        gpsLon = line.split(":").slice(1).join(":").trim();
      }
    }

    return { dateTime, gpsLat, gpsLon };
  } catch (error) {
    return { dateTime: null, gpsLat: null, gpsLon: null };
  }
}

function toSlug(folder, filename) {
  const base = `${folder}-${filename}`.toLowerCase();
  return base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function processPhotos() {
  console.log("Extracting EXIF metadata from photos...\n");

  const metadata = {};
  const photoList = [];
  let processed = 0;
  let withGPS = 0;
  let withDate = 0;

  const entries = fs
    .readdirSync(PHOTO_ASSETS_PATH, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name));

  // First pass: collect all photos and extract EXIF
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderName = entry.name;
      const folderPath = path.join(PHOTO_ASSETS_PATH, folderName);
      const files = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((file) => {
          const ext = path.extname(file.name).toLowerCase();
          return (
            file.isFile() &&
            [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) &&
            fs.statSync(path.join(folderPath, file.name)).size > 0
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const file of files) {
        const photoPath = path.join(folderPath, file.name);
        const slug = toSlug(folderName, file.name);
        const { dateTime, gpsLat, gpsLon } = extractExifData(photoPath);

        photoList.push({
          slug,
          file: file.name,
          folderName,
          dateTime,
          gpsLat,
          gpsLon,
        });
      }
    }
  }

  // Second pass: process with geocoding
  for (const photo of photoList) {
    const location = {};
    let hasData = false;

    if (photo.dateTime) {
      location.date = formatDate(photo.dateTime);
      if (location.date) {
        withDate++;
        hasData = true;
      }
    }

    if (photo.gpsLat && photo.gpsLon) {
      const gps = parseGPS(photo.gpsLat, photo.gpsLon);
      if (gps) {
        process.stdout.write(`⏳ Geocoding ${photo.file}... `);
        const address = await reverseGeocode(gps.lat, gps.lon);
        const locationStr = extractAddressLocation(address);
        if (locationStr) {
          location.location = locationStr;
          withGPS++;
          console.log(`✓ ${locationStr}`);
        } else {
          console.log("(no location found)");
        }
        hasData = true;
      }
    }

    if (hasData) {
      metadata[photo.slug] = {
        ...location,
        tagged: !!(location.location || location.date),
      };
      processed++;
    }
  }

  return { metadata, processed, withGPS, withDate };
}

async function main() {
  try {
    const result = await processPhotos();

    // Merge with existing metadata
    let existingMetadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        existingMetadata = JSON.parse(
          fs.readFileSync(METADATA_PATH, "utf-8")
        );
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Merge: keep existing edits, add new extracted data
    const finalMetadata = { ...result.metadata };
    for (const [key, value] of Object.entries(existingMetadata)) {
      if (!finalMetadata[key] && value.location) {
        // Keep manual edits
        finalMetadata[key] = value;
      }
    }

    fs.writeFileSync(
      METADATA_PATH,
      JSON.stringify(finalMetadata, null, 2),
      "utf-8"
    );

    console.log("\n✓ Metadata extraction complete!");
    console.log(`  Processed: ${result.processed} photos`);
    console.log(`  With date: ${result.withDate}`);
    console.log(`  With location: ${result.withGPS}`);
    console.log(`  Saved to: ${METADATA_PATH}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
