// One-off: extracts desert and tundra outlines for the photo map from Natural Earth 1:50m
// geography regions (ne_50m_geography_regions_polys.geojson, public domain) in the directory
// given as the first argument. Writes src/data/climate-regions.json: { deserts, tundra } as
// lists of polygons ([outer ring, ...holes] in [lng, lat]).
const fs = require("fs");
const path = require("path");

const TOLERANCE = 0.12; // degrees
// Natural Earth tags these as deserts, but Punjab is irrigated farmland.
const NOT_DESERT = new Set(["PUNJAB"]);
// The "Canadian Shield" is mostly boreal forest, so only true tundra regions are kept.
const TUNDRA = new Set(["BARREN GROUNDS", "Bol’shezemel’skaya Tundra"]);
const OUTPUT = path.join(__dirname, "../src/data/climate-regions.json");

function simplify(points) {
  if (points.length <= 2) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  let farthest = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const distance = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
    if (distance > farthest) {
      farthest = distance;
      index = i;
    }
  }
  if (farthest <= TOLERANCE) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1)).slice(0, -1), ...simplify(points.slice(index))];
}

// A closed ring starts and ends at the same point, so simplify its two halves separately.
function simplifyRing(ring) {
  const mid = Math.floor(ring.length / 2);
  return [...simplify(ring.slice(0, mid + 1)).slice(0, -1), ...simplify(ring.slice(mid))];
}

const round = (ring) => ring.map(([lng, lat]) => [Number(lng.toFixed(2)), Number(lat.toFixed(2))]);

function polygons(geometry) {
  const list = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return list
    .map((rings) => rings.map((ring) => round(simplifyRing(ring))).filter((ring) => ring.length >= 4))
    .filter((rings) => rings.length > 0);
}

const dir = process.argv[2];
if (!dir) {
  console.error("[generate-climate-regions] usage: node scripts/generate-climate-regions.js <natural-earth-directory>");
  process.exit(1);
}

const features = JSON.parse(fs.readFileSync(path.join(dir, "ne_50m_geography_regions_polys.geojson"), "utf8")).features;
const pick = (match) => features.filter((f) => f.geometry && match(f.properties)).flatMap((f) => polygons(f.geometry));

const deserts = pick((p) => p.FEATURECLA === "Desert" && !NOT_DESERT.has(p.NAME));
const tundra = pick((p) => p.FEATURECLA === "Tundra" && TUNDRA.has(p.NAME));

fs.writeFileSync(OUTPUT, JSON.stringify({ deserts, tundra }));
console.log(
  `[generate-climate-regions] wrote ${deserts.length} desert and ${tundra.length} tundra polygons to ${path.relative(process.cwd(), OUTPUT)}`,
);
