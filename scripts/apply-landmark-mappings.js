const fs = require("fs");
const path = require("path");

const METADATA_PATH = path.join(process.cwd(), "content/photos-metadata.json");

// Manual mappings based on web search results for famous landmarks
const LOCATION_MAPPINGS = {
  // Colorado
  "Summit County, Colorado": "Breckenridge/Keystone Area, Colorado",
  "Alamosa County, Colorado": "Great Sand Dunes Area, Colorado",
  "Saguache County, Colorado": "Great Sand Dunes Area, Colorado",

  // Utah
  "Wayne County, Utah": "Capitol Reef/Arches Area, Utah",
  "Tooele County, Utah": "Bonneville Salt Flats Area, Utah",
  "Salt Lake County, Utah": "Salt Lake City Area, Utah",
  "Millard County, Utah": "Great Basin Area, Utah",

  // Oregon
  "Douglas County, Oregon": "Umpqua Valley Area, Oregon",
  "Lincoln County, Oregon": "Oregon Coast, Oregon",
  "Clatsop County, Oregon": "Cannon Beach/Haystack Rock Area, Oregon",
  "Hood River County, Oregon": "Columbia River Gorge, Oregon",
  "Multnomah County, Oregon": "Portland/Columbia Gorge Area, Oregon",

  // New York
  "Buffalo, New York": "Buffalo/Niagara Falls Area, New York",
  "Erie County, New York": "Buffalo Area, New York",

  // California
  "Marin County, California": "Golden Gate/Marin Headlands, California",

  // Washington
  "Mason County, Washington": "Olympic Peninsula Area, Washington",

  // Alaska
  "Denali Borough, Alaska": "Denali National Park, Alaska",
  "Fairbanks North Star Borough, Alaska": "Fairbanks/Aurora Area, Alaska",
  "Anchorage, Alaska": "Anchorage Area, Alaska",

  // New Mexico
  "Otero County, New Mexico": "White Sands Area, New Mexico",
  "Bernalillo County, New Mexico": "Albuquerque Area, New Mexico",
  "Santa Fe, New Mexico": "Santa Fe Historic District, New Mexico",

  // New Hampshire
  "Coös County, New Hampshire": "White Mountains, New Hampshire",
  "Hart's Location, New Hampshire": "White Mountains, New Hampshire",
  "Grafton County, New Hampshire": "White Mountains/Franconia Notch, New Hampshire",

  // India
  "Bengaluru, Karnataka": "Bangalore, Karnataka",
  "Salcete, Goa": "South Goa Beaches, Goa",
  "Canacona, Goa": "Palolem Beach Area, Goa",
  "Shimla ( Rural ), Himachal Pradesh": "Shimla Hill Station, Himachal Pradesh",
  "Shimla, Himachal Pradesh": "Shimla Hill Station, Himachal Pradesh",
  "Shimla (urban), Himachal Pradesh": "Shimla Mall Road, Himachal Pradesh",
  "Theog, Himachal Pradesh": "Shimla Outskirts, Himachal Pradesh",
  "Devanahalli taluku, Karnataka": "Bangalore Outskirts, Karnataka",

  // New Jersey
  "Hudson County, New Jersey": "Jersey City/Liberty State Park Area, New Jersey",

  // Washington DC
  "Washington, District of Columbia": "National Mall Area, Washington D.C.",
};

function applyMappings() {
  console.log("Applying landmark mappings to remaining locations...\n");

  // Load metadata
  let metadata = {};
  if (fs.existsSync(METADATA_PATH)) {
    try {
      metadata = JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8"));
    } catch (e) {
      console.error("Failed to read metadata:", e.message);
      return;
    }
  }

  let enhanced = 0;

  // Apply mappings
  for (const [photoId, data] of Object.entries(metadata)) {
    if (data.location && LOCATION_MAPPINGS[data.location]) {
      const oldLocation = data.location;
      const newLocation = LOCATION_MAPPINGS[data.location];
      metadata[photoId].location = newLocation;
      console.log(`✓ ${oldLocation} → ${newLocation}`);
      enhanced++;
    }
  }

  // Save updated metadata
  fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), "utf-8");

  console.log(`\n✓ Applied ${enhanced} landmark mappings`);
  console.log(`  Saved to: ${METADATA_PATH}`);
}

applyMappings();
