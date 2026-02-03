const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const PHOTO_ASSETS_PATH = path.join(process.cwd(), "content/assets/photos");
const METADATA_PATH = path.join(process.cwd(), "content/photos-metadata.json");

// Known national parks and monuments with their boundaries
const LANDMARK_QUERIES = [
  { name: "national_park", tag: "boundary=national_park" },
  { name: "monument", tag: "historic=memorial" },
  { name: "scenic_area", tag: "leisure=nature_reserve" },
  { name: "state_park", tag: "boundary=protected_area" },
];

function parseGPS(latStr, lonStr) {
  if (!latStr || !lonStr) return null;

  const parseDMS = (str) => {
    const match = str.match(/(\d+)\s+deg\s+(\d+)'\s+([\d.]+)"\s+([NSEW])/);
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

function queryOverpassAPI(lat, lon, radius = 15000) {
  return new Promise((resolve) => {
    // Query for nearby landmarks: national parks, protected areas, scenic features
    const query = `
      [out:json][bbox:${lat - 0.15},${lon - 0.15},${lat + 0.15},${lon + 0.15}];
      (
        node[tourism=viewpoint];
        node[tourism=attraction];
        way[boundary=national_park];
        way[boundary=protected_area];
        way[boundary=national_monument];
        way[historic=memorial];
        way[natural=peak];
        way[natural=valley];
        way[natural=gorge];
        way[waterway=waterfall];
        relation[boundary=national_park];
        relation[boundary=protected_area];
      );
      out center 1;
    `;

    const data = `data=${encodeURIComponent(query)}`;
    const options = {
      hostname: "overpass-api.de",
      port: 443,
      path: "/api/interpreter",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
        "User-Agent": "photo-tagger",
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(responseData);
          const landmarks = extractLandmarks(json.elements);
          resolve(landmarks);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on("error", () => resolve([]));
    req.write(data);
    req.end();
  });
}

function extractLandmarks(elements) {
  if (!elements || elements.length === 0) return [];

  const landmarks = [];

  for (const el of elements) {
    const tags = el.tags || {};
    let name = tags.name || tags.official_name || "";
    let type = "";

    // Identify landmark type
    if (tags.boundary === "national_park") {
      type = "National Park";
    } else if (tags.boundary === "protected_area") {
      type = "Protected Area";
    } else if (tags.boundary === "national_monument") {
      type = "National Monument";
    } else if (tags.historic === "memorial") {
      type = "Monument";
    } else if (tags.tourism === "viewpoint") {
      type = "Viewpoint";
    } else if (tags.tourism === "attraction") {
      type = "Landmark";
    } else if (tags.natural === "peak") {
      type = "Peak";
    } else if (tags.natural === "valley") {
      type = "Valley";
    } else if (tags.natural === "gorge") {
      type = "Gorge";
    } else if (tags.waterway === "waterfall") {
      type = "Waterfall";
    }

    if (name && type) {
      landmarks.push({
        name,
        type,
        priority: getPriority(type),
      });
    }
  }

  // Sort by priority and remove duplicates
  landmarks.sort((a, b) => b.priority - a.priority);
  const seen = new Set();
  return landmarks.filter((l) => {
    const key = l.name + l.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getPriority(type) {
  const priorities = {
    "National Park": 100,
    "National Monument": 90,
    "Protected Area": 80,
    "State Park": 75,
    Gorge: 70,
    Waterfall: 65,
    Peak: 60,
    Valley: 55,
    Monument: 50,
    Viewpoint: 40,
    Landmark: 30,
  };
  return priorities[type] || 0;
}

function extractExifData(photoPath) {
  try {
    const output = execSync(`exiftool "${photoPath}"`, {
      encoding: "utf-8",
    });

    const lines = output.split("\n");
    let gpsLat = null;
    let gpsLon = null;

    for (const line of lines) {
      if (line.includes("GPS Latitude") && !line.includes("Ref")) {
        gpsLat = line.split(":").slice(1).join(":").trim();
      } else if (line.includes("GPS Longitude") && !line.includes("Ref")) {
        gpsLon = line.split(":").slice(1).join(":").trim();
      }
    }

    return { gpsLat, gpsLon };
  } catch (error) {
    return { gpsLat: null, gpsLon: null };
  }
}

function toSlug(folder, filename) {
  const base = `${folder}-${filename}`.toLowerCase();
  return base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function enhanceLocations() {
  console.log("Enhancing photo locations with landmark data...\n");

  // Load current metadata
  let metadata = {};
  if (fs.existsSync(METADATA_PATH)) {
    try {
      metadata = JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8"));
    } catch (e) {
      console.error("Failed to read metadata:", e.message);
    }
  }

  const entries = fs
    .readdirSync(PHOTO_ASSETS_PATH, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name));

  let updated = 0;
  let enhanced = 0;

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
        const photoMeta = metadata[slug];

        // Skip if manually edited with a landmark-specific location (not just county)
        if (photoMeta && photoMeta.location && !photoMeta.location.includes("County") && !photoMeta.location.includes("Borough")) {
          continue;
        }

        const { gpsLat, gpsLon } = extractExifData(photoPath);

        if (gpsLat && gpsLon) {
          const gps = parseGPS(gpsLat, gpsLon);
          if (gps) {
            process.stdout.write(
              `🔍 Finding landmarks for ${file.name}... `
            );
            const landmarks = await queryOverpassAPI(gps.lat, gps.lon);

            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (landmarks.length > 0) {
              const bestLandmark = landmarks[0];
              const currentLocation = photoMeta?.location || "";
              let enhancedLocation = currentLocation;

              if (bestLandmark.name) {
                if (
                  currentLocation.includes("County") ||
                  !currentLocation.includes(bestLandmark.name)
                ) {
                  enhancedLocation = `${bestLandmark.name}, ${currentLocation
                    .split(",")
                    .pop()
                    .trim()}`;
                  enhanced++;
                }
              }

              if (!metadata[slug]) {
                metadata[slug] = {};
              }
              metadata[slug].location = enhancedLocation;
              metadata[slug].tagged = !!(
                metadata[slug].location || metadata[slug].date
              );
              console.log(
                `✓ ${bestLandmark.name} (${bestLandmark.type})`
              );
            } else {
              console.log("(no landmarks found)");
            }
            updated++;
          }
        }
      }
    }
  }

  // Save updated metadata
  fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), "utf-8");

  console.log("\n✓ Location enhancement complete!");
  console.log(`  Checked: ${updated} photos with GPS data`);
  console.log(`  Enhanced: ${enhanced} locations with landmarks`);
  console.log(`  Saved to: ${METADATA_PATH}`);
}

async function main() {
  try {
    await enhanceLocations();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
