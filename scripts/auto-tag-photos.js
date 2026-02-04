#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PHOTO_ASSETS_PATH = path.join(process.cwd(), "content/assets/photos");
const METADATA_PATH = path.join(process.cwd(), "content/photos-metadata.json");
const DELAY_MS = 1000; // Delay between API calls

// Load existing metadata
function loadMetadata() {
  if (!fs.existsSync(METADATA_PATH)) {
    return {};
  }
  const content = fs.readFileSync(METADATA_PATH, "utf8");
  return JSON.parse(content);
}

// Save metadata
function saveMetadata(metadata) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
}

// Convert photo ID to match format used in gallery
function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Get all photos from assets
function getAllPhotos() {
  const photos = [];

  if (!fs.existsSync(PHOTO_ASSETS_PATH)) {
    console.log("Photo assets directory not found");
    return photos;
  }

  const entries = fs.readdirSync(PHOTO_ASSETS_PATH, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    if (entry.isDirectory()) {
      const folderPath = path.join(PHOTO_ASSETS_PATH, entry.name);
      const files = fs.readdirSync(folderPath, { withFileTypes: true });

      for (const file of files) {
        if (!file.isFile()) continue;
        const ext = path.extname(file.name).toLowerCase();
        if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;

        const filePath = path.join(folderPath, file.name);
        const stats = fs.statSync(filePath);
        if (stats.size === 0) continue; // Skip empty files

        const slug = toSlug(`${entry.name}-${file.name}`);
        photos.push({
          id: slug,
          path: filePath,
          relativePath: `${entry.name}/${file.name}`,
        });
      }
    }
  }

  return photos;
}

// Extract EXIF data using exiftool
function extractEXIF(filePath) {
  try {
    const output = execSync(
      `exiftool -j -GPSLatitude -GPSLongitude -DateTimeOriginal -CreateDate "${filePath}"`,
      { encoding: "utf8" }
    );
    const data = JSON.parse(output);
    return data[0] || {};
  } catch (error) {
    console.error(`Failed to extract EXIF from ${filePath}:`, error.message);
    return {};
  }
}

// Convert DMS (degrees, minutes, seconds) to decimal degrees
function dmsToDecimal(dmsStr) {
  if (typeof dmsStr === 'number') return dmsStr;

  // Parse "43 deg 0' 6.00\" N" format
  const match = dmsStr.match(/^(\d+(?:\.\d+)?)\s*deg\s*(\d+(?:\.\d+)?)\'\s*(\d+(?:\.\d+)?)\"\s*([NSEW])$/);
  if (!match) return null;

  const [, degrees, minutes, seconds, direction] = match;
  let decimal = parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / 3600;

  // Make negative if South or West
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
}

// Parse GPS coordinates
function parseGPS(exif) {
  const lat = exif.GPSLatitude;
  const lon = exif.GPSLongitude;

  if (!lat || !lon) return null;

  // Convert from DMS to decimal if needed
  const latitude = dmsToDecimal(lat);
  const longitude = dmsToDecimal(lon);

  if (latitude === null || longitude === null) return null;

  return { latitude, longitude };
}

// Parse date from EXIF
function parseDate(exif) {
  const dateStr = exif.DateTimeOriginal || exif.CreateDate;
  if (!dateStr) return null;

  // Parse "2023:05:15 14:30:22" format
  const match = dateStr.match(/^(\d{4}):(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, year, month] = match;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  return `${monthNames[monthIndex]}, ${year}`;
}

// Reverse geocode using Nominatim
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "PhotoGalleryApp/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};

    // Extract meaningful location
    let location = "";

    // Try city/town/village
    const place = address.city || address.town || address.village || address.county;
    const state = address.state;
    const country = address.country;

    if (place && state) {
      location = `${place}, ${state}`;
    } else if (place && country) {
      location = `${place}, ${country}`;
    } else if (state && country) {
      location = `${state}, ${country}`;
    } else if (country) {
      location = country;
    }

    return location || null;
  } catch (error) {
    console.error(`Geocoding failed for ${lat},${lon}:`, error.message);
    return null;
  }
}

// Auto-tag a single photo
async function autoTagPhoto(photo) {
  console.log(`Processing: ${photo.relativePath}`);

  const exif = extractEXIF(photo.path);
  const gps = parseGPS(exif);
  const date = parseDate(exif);

  let location = null;
  if (gps) {
    console.log(`  GPS: ${gps.latitude}, ${gps.longitude}`);
    location = await reverseGeocode(gps.latitude, gps.longitude);
    if (location) {
      console.log(`  Location: ${location}`);
    }
    // Delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  if (date) {
    console.log(`  Date: ${date}`);
  }

  return {
    location: location || undefined,
    date: date || undefined,
    tagged: !!(location || date),
  };
}

// Main function
async function main() {
  console.log("🔍 Scanning for photos...\n");

  const photos = getAllPhotos();
  console.log(`Found ${photos.length} photos\n`);

  const metadata = loadMetadata();
  let newCount = 0;
  let updatedCount = 0;

  for (const photo of photos) {
    const existing = metadata[photo.id];

    // Skip if photo has both location and date
    if (existing && existing.location && existing.date) {
      continue;
    }

    const tags = await autoTagPhoto(photo);

    // Merge with existing data to preserve any manually entered tags
    const mergedTags = {
      location: tags.location || (existing && existing.location),
      date: tags.date || (existing && existing.date),
      tagged: !!(
        (tags.location || (existing && existing.location)) &&
        (tags.date || (existing && existing.date))
      ),
    };

    metadata[photo.id] = mergedTags;
    if (existing) {
      updatedCount++;
    } else {
      newCount++;
    }

    console.log("");
  }

  if (newCount > 0 || updatedCount > 0) {
    saveMetadata(metadata);
    console.log(`✅ Tagged ${newCount} new photos and updated ${updatedCount} existing photos`);
    console.log(`📁 Metadata saved to ${METADATA_PATH}`);
  } else {
    console.log("✨ All photos are already tagged!");
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
