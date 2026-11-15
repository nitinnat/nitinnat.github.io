// One-off: builds the photo map's climate data from the Köppen–Geiger 0.5° grid
// (Koeppen-Geiger-ASCII.txt, columns Lat Lon Cls at cell centres, 1951–2000) in the directory given
// as the first argument. Source: Kottek, M., Grieser, J., Beck, C., Rudolf, B., and Rubel, F. (2006).
// World Map of the Köppen-Geiger climate classification updated. Meteorol. Z., 15, 259-263.
//
// Writes src/data/climate-grid.json as { lat, lng, step, rows, tints }:
// - rows: one string per 0.5° row from `lat` (84°N) southwards to 60°S, each covering 720 cells
//   eastwards from `lng` (-180°), run-length encoded as a group character followed by an optional
//   repeat count ("D12M." = 12 desert cells, one temperate cell, one ocean cell). Groups: D desert,
//   S steppe, T tropical rainforest/monsoon, V savanna, M temperate/continental, B boreal,
//   N tundra, I ice, P prairie, "." ocean. Köppen has no grassland class (northern Kazakhstan, the
//   Ukrainian steppe, the Great Plains and the Pampas are Dfb, Dfa or Cfa), so temperate cells within
//   PRAIRIE_REACH cells of a dry one become prairie: the open grassland between steppe and forest.
//   Maritime classes and anything within COAST_GAP cells of the sea stay forest, and GRASSLANDS adds the Pontic steppe, the Pampas and the eastern Great Plains,
//   which are too far from Köppen's dry classes or too close to the sea for the rule to find.
// - tints: { [group]: [rings, rings, rings] } smoothed outlines of each group except M (the base land
//   colour) at the FEATHER thresholds of its blurred mask, stacked translucently for a soft edge, as
//   flat [lng, lat, lng, lat, ...] rings to fill with the even-odd rule. Coastal cells are spread a
//   little into the sea first, so outlines overshoot the coast and the map clips them to land.
const fs = require("fs");
const path = require("path");
const { contours } = require("d3-contour");

const STEP = 0.5;
const NORTH = 84;
const SOUTH = -60;
const COLS = 360 / STEP;
const ROWS = (NORTH - SOUTH) / STEP;
const COAST_SPREAD = 3;
const PRAIRIE_REACH = 6;
const COAST_GAP = 3;
const MARITIME = new Set(["Cfb", "Cfc", "Csb", "Csc", "Cwc"]);
const GRASSLANDS = [
  { west: 28, east: 50, south: 45, north: 49.5 },
  { west: -64, east: -53, south: -39, north: -30 },
  { west: -101, east: -96, south: 35, north: 49 },
];
const TOLERANCE = 0.2;
const MIN_EXTENT = 1;
const FEATHER = [0.2, 0.5, 0.8];
const OCEAN = ".";
const TINTED = ["D", "S", "P", "V", "T", "B", "N", "I"];
const BOREAL = new Set(["Dfc", "Dfd", "Dwc", "Dwd", "Dsc", "Dsd"]);
const OUTPUT = path.join(__dirname, "../src/data/climate-grid.json");

function group(cls) {
  if (cls === "BWh" || cls === "BWk") return "D";
  if (cls === "BSh" || cls === "BSk") return "S";
  if (cls === "Af" || cls === "Am") return "T";
  if (cls === "Aw" || cls === "As") return "V";
  if (cls === "ET") return "N";
  if (cls === "EF") return "I";
  if (BOREAL.has(cls)) return "B";
  if (cls[0] === "C" || cls[0] === "D") return "M";
  throw new Error(`unknown class ${cls}`);
}

function readClasses(file) {
  const classes = new Array(COLS * ROWS).fill(null);
  fs.readFileSync(file, "utf8")
    .split("\n")
    .slice(1)
    .forEach((line) => {
      const [lat, lng, cls] = line.trim().split(/\s+/);
      if (!cls) return;
      const row = Math.floor((NORTH - Number(lat)) / STEP);
      const col = Math.floor((Number(lng) + 180) / STEP);
      if (row >= 0 && row < ROWS) classes[row * COLS + col] = cls;
    });
  return classes;
}

// Breadth-first from the seed cells through cells that pass `enter`, up to `reach` steps; returns
// each reached cell's step count.
function spread(seeds, enter, reach) {
  const steps = new Map(seeds.map((i) => [i, 0]));
  let frontier = seeds;
  for (let step = 1; step <= reach; step += 1) {
    const next = [];
    frontier.forEach((i) => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      for (const [dr, dc] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const r = row + dr;
        const j = r * COLS + ((col + dc + COLS) % COLS);
        if (r < 0 || r >= ROWS || steps.has(j) || !enter(j)) continue;
        steps.set(j, step);
        next.push(j);
      }
    });
    frontier = next;
  }
  return steps;
}

const inGrassland = (i) => {
  const lat = NORTH - (Math.floor(i / COLS) + 0.5) * STEP;
  const lng = (i % COLS + 0.5) * STEP - 180;
  return GRASSLANDS.some(({ west, east, south, north }) => lng >= west && lng <= east && lat >= south && lat <= north);
};

function markPrairie(classes) {
  const grid = classes.map((cls) => (cls ? group(cls) : OCEAN));
  const coast = spread(grid.flatMap((cell, i) => (cell === OCEAN ? [i] : [])), () => true, COAST_GAP);
  const temperate = (i) => grid[i] === "M" && !MARITIME.has(classes[i]);
  const dry = grid.flatMap((cell, i) => (cell === "D" || cell === "S" ? [i] : []));
  spread(dry, (i) => temperate(i) && !coast.has(i), PRAIRIE_REACH).forEach((_, i) => {
    if (grid[i] === "M") grid[i] = "P";
  });
  grid.forEach((cell, i) => {
    if (temperate(i) && inGrassland(i)) grid[i] = "P";
  });
  return grid;
}

const encodeRow = (cells) =>
  cells.join("").replace(/(.)\1*/g, (run, char) => (run.length > 1 ? `${char}${run.length}` : char));

// Each pass hands ocean cells the group of a land neighbour, wrapping across the antimeridian.
function spreadIntoSea(grid) {
  let src = grid;
  for (let pass = 0; pass < COAST_SPREAD; pass += 1) {
    const next = src.slice();
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (src[row * COLS + col] !== OCEAN) continue;
        for (const [dr, dc] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const r = row + dr;
          const neighbour = r >= 0 && r < ROWS ? src[r * COLS + ((col + dc + COLS) % COLS)] : OCEAN;
          if (neighbour !== OCEAN) {
            next[row * COLS + col] = neighbour;
            break;
          }
        }
      }
    }
    src = next;
  }
  return src;
}

function blur(source) {
  const values = new Float32Array(COLS * ROWS);
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      let sum = 0;
      let count = 0;
      for (let dr = -1; dr <= 1; dr += 1) {
        const r = row + dr;
        if (r < 0 || r >= ROWS) continue;
        for (let dc = -1; dc <= 1; dc += 1) {
          sum += source[r * COLS + ((col + dc + COLS) % COLS)];
          count += 1;
        }
      }
      values[row * COLS + col] = sum / count;
    }
  }
  return values;
}

// Two 3×3 box blurs of the group's mask (a 5×5 tent) round off its stair-stepped cell edges.
const mask = (grid, id) => blur(blur(Float32Array.from(grid, (cell) => (cell === id ? 1 : 0))));

function simplify(points) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    const [ax, ay] = points[start];
    const [bx, by] = points[end];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    let maxDistance = 0;
    let index = -1;
    for (let i = start + 1; i < end; i += 1) {
      const [px, py] = points[i];
      const t = lengthSq ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq)) : 0;
      const distance = Math.hypot(px - ax - t * dx, py - ay - t * dy);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (maxDistance > TOLERANCE) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function toRing(gridRing) {
  const ring = simplify(gridRing.map(([x, y]) => [x * STEP - 180, NORTH - y * STEP]));
  if (ring.length < 4) return null;
  const lngs = ring.map((point) => point[0]);
  const lats = ring.map((point) => point[1]);
  if (Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats)) < MIN_EXTENT) return null;
  return ring.flatMap(([lng, lat]) => [Number(lng.toFixed(1)), Number(lat.toFixed(1))]);
}

const dir = process.argv[2];
if (!dir) {
  console.error("[generate-climate-grid] usage: node scripts/generate-climate-grid.js <koeppen-directory>");
  process.exit(1);
}

const grid = markPrairie(readClasses(path.join(dir, "Koeppen-Geiger-ASCII.txt")));
const rows = Array.from({ length: ROWS }, (_, row) => encodeRow(grid.slice(row * COLS, (row + 1) * COLS)));
const coastal = spreadIntoSea(grid);
const tints = Object.fromEntries(
  TINTED.map((id) => {
    const levels = contours().size([COLS, ROWS]).thresholds(FEATHER)(mask(coastal, id));
    const rings = levels.map((level) => level.coordinates.flat().map(toRing).filter(Boolean));
    console.log(`[generate-climate-grid] ${id}: ${grid.filter((cell) => cell === id).length} cells, ${rings.map((r) => r.length).join("/")} rings`);
    return [id, rings];
  }),
);

fs.writeFileSync(OUTPUT, JSON.stringify({ lat: NORTH, lng: -180, step: STEP, rows, tints }));
console.log(`[generate-climate-grid] wrote ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB to ${path.relative(process.cwd(), OUTPUT)}`);
