// One-off: derives the photo map's rivers and lakes from Natural Earth 1:50m data
// (ne_50m_rivers_lake_centerlines.geojson and ne_50m_lakes.geojson, public domain,
// https://www.naturalearthdata.com) in the directory given as the first argument.
// Writes src/data/hydrology.json: { rivers: [{ rank, lines }], lakes: [{ rank, polygons }] }.
const fs = require("fs");
const path = require("path");

const MAX_RIVER_RANK = 5;
const MAX_LAKE_RANK = 1;
const TOLERANCE = 0.06; // degrees
const OUTPUT = path.join(__dirname, "../src/data/hydrology.json");

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

const round = (line) => line.map(([lng, lat]) => [Number(lng.toFixed(2)), Number(lat.toFixed(2))]);
const read = (dir, name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.geojson`), "utf8")).features;

function lines(geometry) {
  return geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
}

function polygons(geometry) {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

const dir = process.argv[2];
if (!dir) {
  console.error("[generate-hydrology] usage: node scripts/generate-hydrology.js <natural-earth-directory>");
  process.exit(1);
}

const rivers = read(dir, "ne_50m_rivers_lake_centerlines")
  .filter((f) => f.geometry && f.properties.scalerank <= MAX_RIVER_RANK)
  .map((f) => ({
    rank: f.properties.scalerank,
    lines: lines(f.geometry).map((line) => round(simplify(line))).filter((line) => line.length >= 2),
  }))
  .filter((river) => river.lines.length > 0);

const lakes = read(dir, "ne_50m_lakes")
  .filter((f) => f.geometry && f.properties.scalerank <= MAX_LAKE_RANK)
  .map((f) => ({
    rank: f.properties.scalerank,
    polygons: polygons(f.geometry)
      .map((rings) => rings.map((ring) => round(simplifyRing(ring))).filter((ring) => ring.length >= 4))
      .filter((rings) => rings.length > 0),
  }))
  .filter((lake) => lake.polygons.length > 0);

fs.writeFileSync(OUTPUT, JSON.stringify({ rivers, lakes }));
console.log(`[generate-hydrology] wrote ${rivers.length} rivers and ${lakes.length} lakes to ${path.relative(process.cwd(), OUTPUT)}`);
