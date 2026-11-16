// One-off: derives the photo map's highland patches and forest blobs from AWS Terrain Tiles
// (Terrarium, zoom 4, `4-{x}-{y}.png` in the directory given as the first argument), the Köppen
// climate grid (src/data/climate-grid.json) and the peaks (src/data/terrain-peaks.json).
// Writes src/data/map-features.json, with rings as flat [lng, lat, lng, lat, ...] arrays:
//   highlands: [{ dry, rings, peaks: [[lng, lat, elevation, surroundingElevation]] }]
//   volcanoes: isolated peaks outside any highland, in the same format
//   forests:   { pine | broadleaf | jungle: [[outer, ...holes]] }
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const { contours } = require("d3-contour");
const climateGrid = require("../src/data/climate-grid.json");
const peaks = require("../src/data/terrain-peaks.json");

const ZOOM = 4;
const TILES = 2 ** ZOOM;
const TILE_SIZE = 256;
const ROWS = [1, 12]; // ~80°N to ~60°S
const CELL = 4; // mosaic pixels per grid cell (~0.35° of longitude)
const SOUTH_LIMIT = -56;
const HIGHLAND_LEVEL = 2200;
const MIN_HIGHLAND_AREA = 1; // square degrees, scaled by cos(latitude)
const MIN_FOREST_AREA = 0.5;
const MIN_PEAK = 2500;
const OPEN_SHARE = 0.4; // share of forest-climate ground left as open meadow
const TOLERANCE = 0.1;
const OUTPUT = path.join(__dirname, "../src/data/map-features.json");

const climateRows = climateGrid.rows.map((row) => row.replace(/(\D)(\d+)/g, (_, char, count) => char.repeat(Number(count))));
const climateAt = (lng, lat) => {
  const row = Math.floor((climateGrid.lat - lat) / climateGrid.step);
  const col = Math.floor((lng - climateGrid.lng) / climateGrid.step);
  return climateRows[row]?.[col] ?? ".";
};

function buildMosaic(tileDir) {
  const width = TILES * TILE_SIZE;
  const height = (ROWS[1] - ROWS[0] + 1) * TILE_SIZE;
  const elevation = new Float32Array(width * height);
  for (let y = ROWS[0]; y <= ROWS[1]; y += 1) {
    for (let x = 0; x < TILES; x += 1) {
      const png = PNG.sync.read(fs.readFileSync(path.join(tileDir, `${ZOOM}-${x}-${y}.png`)));
      for (let py = 0; py < TILE_SIZE; py += 1) {
        for (let px = 0; px < TILE_SIZE; px += 1) {
          const o = (py * TILE_SIZE + px) * 4;
          const meters = png.data[o] * 256 + png.data[o + 1] + png.data[o + 2] / 256 - 32768;
          // 9000+ only appears in corrupt source pixels.
          elevation[((y - ROWS[0]) * TILE_SIZE + py) * width + x * TILE_SIZE + px] = meters >= 9000 ? 0 : Math.max(0, meters);
        }
      }
    }
  }
  return { elevation, width, height };
}

const toLngLat = (gx, gy, width) => {
  const mercatorY = (ROWS[0] * TILE_SIZE + gy) / (TILES * TILE_SIZE);
  return [(gx / width) * 360 - 180, (Math.atan(Math.sinh(Math.PI * (1 - 2 * mercatorY))) * 180) / Math.PI];
};

function downsample({ elevation, width, height }) {
  const cols = width / CELL;
  const rows = height / CELL;
  const grid = new Float32Array(cols * rows);
  const highest = new Float32Array(cols * rows);
  for (let cy = 0; cy < rows; cy += 1) {
    for (let cx = 0; cx < cols; cx += 1) {
      let sum = 0;
      for (let dy = 0; dy < CELL; dy += 1) {
        for (let dx = 0; dx < CELL; dx += 1) {
          const e = elevation[(cy * CELL + dy) * width + cx * CELL + dx];
          sum += e;
          highest[cy * cols + cx] = Math.max(highest[cy * cols + cx], e);
        }
      }
      grid[cy * cols + cx] = sum / (CELL * CELL);
    }
  }
  return { grid, highest, cols, rows };
}

// Separable box blur, repeated to approximate a Gaussian; wraps horizontally across the antimeridian.
function blur(src, cols, rows, radius, passes) {
  let out = src;
  for (let pass = 0; pass < passes; pass += 1) {
    const horizontal = new Float32Array(out.length);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let sum = 0;
        for (let k = -radius; k <= radius; k += 1) sum += out[y * cols + ((x + k + cols) % cols)];
        horizontal[y * cols + x] = sum / (2 * radius + 1);
      }
    }
    const vertical = new Float32Array(out.length);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let sum = 0;
        let count = 0;
        for (let k = Math.max(-radius, -y); k <= radius && y + k < rows; k += 1) {
          sum += horizontal[(y + k) * cols + x];
          count += 1;
        }
        vertical[y * cols + x] = sum / count;
      }
    }
    out = vertical;
  }
  return out;
}

// Value noise with three octaves, so forest edges wander like painted blobs.
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = (x - xi) ** 2 * (3 - 2 * (x - xi));
  const fy = (y - yi) ** 2 * (3 - 2 * (y - yi));
  const [a, b, c, d] = [hash(xi, yi), hash(xi + 1, yi), hash(xi, yi + 1), hash(xi + 1, yi + 1)];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const fbm = (x, y) => 0.55 * noise(x, y) + 0.3 * noise(x * 2.1 + 17, y * 2.1) + 0.15 * noise(x * 4.3, y * 4.3 + 31);

function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    const [ax, ay] = points[start];
    const [bx, by] = points[end];
    const lengthSq = (bx - ax) ** 2 + (by - ay) ** 2;
    let maxDistance = 0;
    let index = -1;
    for (let i = start + 1; i < end; i += 1) {
      const [px, py] = points[i];
      const t = lengthSq ? Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lengthSq)) : 0;
      const distance = Math.hypot(px - ax - t * (bx - ax), py - ay - t * (by - ay));
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (maxDistance > tolerance) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return Math.abs(sum / 2) * Math.cos((ring[0][1] * Math.PI) / 180);
};

const inRing = ([x, y], ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inPolygon = (point, [outer, ...holes]) => inRing(point, outer) && !holes.some((hole) => inRing(point, hole));

// Contours a 0–1 mask at 0.5 into simplified [lng, lat] polygons, dropping small ones.
function polygonsOf(mask, cols, rows, width, minArea) {
  const toRing = (ring) => simplify(ring.map(([x, y]) => toLngLat(x * CELL, y * CELL, width)), TOLERANCE);
  return contours()
    .size([cols, rows])
    .thresholds([0.5])(mask)[0]
    .coordinates.map((polygon) => polygon.map(toRing))
    .filter(([outer]) => outer.length >= 4 && ringArea(outer) >= minArea)
    .map(([outer, ...holes]) => [outer, ...holes.filter((hole) => hole.length >= 4 && ringArea(hole) >= minArea / 4)]);
}

const flat = (ring) => ring.flatMap(([lng, lat]) => [Number(lng.toFixed(2)), Number(lat.toFixed(2))]);

const tileDir = process.argv[2];
if (!tileDir) {
  console.error("[generate-map-features] usage: node scripts/generate-map-features.js <tile-directory>");
  process.exit(1);
}
const mosaic = buildMosaic(tileDir);
const { grid, highest, cols, rows } = downsample(mosaic);
const cells = Array.from({ length: cols * rows }, (_, i) => {
  const [lng, lat] = toLngLat(((i % cols) + 0.5) * CELL, (Math.floor(i / cols) + 0.5) * CELL, mosaic.width);
  return { lng, lat, climate: lat < SOUTH_LIMIT ? "." : climateAt(lng, lat) };
});
console.log(`[generate-map-features] grid ${cols}×${rows}`);

// Highlands: ranges whose summits reach HIGHLAND_LEVEL, smoothed, without ice sheets.
const highMask = blur(
  highest.map((e, i) => (cells[i].climate === "." || cells[i].climate === "I" ? 0 : e >= HIGHLAND_LEVEL ? 1 : 0)),
  cols,
  rows,
  1,
  2,
);
const surroundings = blur(grid, cols, rows, 4, 2);
const surroundingAt = (lng, lat) => {
  const mercatorY = (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
  const cy = Math.floor((mercatorY * TILES * TILE_SIZE - ROWS[0] * TILE_SIZE) / CELL);
  const cx = Math.floor((((lng + 180) / 360) * mosaic.width) / CELL);
  return surroundings[Math.max(0, Math.min(rows - 1, cy)) * cols + Math.max(0, Math.min(cols - 1, cx))];
};
const highlandPolygons = polygonsOf(highMask, cols, rows, mosaic.width, MIN_HIGHLAND_AREA);
const tallPeaks = peaks.filter(([, lat, elevation]) => lat > SOUTH_LIMIT && elevation >= MIN_PEAK);
const peakEntry = ([lng, lat, elevation]) => [lng, lat, elevation, Math.round(surroundingAt(lng, lat) / 100) * 100];
const claimed = new Set();
const highlands = highlandPolygons.map((polygon) => {
  const inside = tallPeaks.filter((peak) => inPolygon(peak, polygon));
  inside.forEach((peak) => claimed.add(peak));
  // A patch is dry when most of its grid cells are desert.
  const [minLng, minLat, maxLng, maxLat] = polygon[0].reduce(
    ([a, b, c, d], [lng, lat]) => [Math.min(a, lng), Math.min(b, lat), Math.max(c, lng), Math.max(d, lat)],
    [180, 90, -180, -90],
  );
  let desert = 0;
  let total = 0;
  for (let lat = minLat; lat <= maxLat; lat += 0.25) {
    for (let lng = minLng; lng <= maxLng; lng += 0.25) {
      if (!inPolygon([lng, lat], polygon)) continue;
      total += 1;
      if (climateAt(lng, lat) === "D") desert += 1;
    }
  }
  return { dry: total > 0 && desert / total > 0.5, rings: polygon.map(flat), peaks: inside.map(peakEntry) };
});
// Isolated volcanoes: a tall peak outside every highland, keeping only the highest within ~1.5°.
const volcanoes = [];
for (const peak of tallPeaks) {
  if (claimed.has(peak) || volcanoes.some(([lng, lat]) => Math.hypot(lng - peak[0], lat - peak[1]) < 1.5)) continue;
  volcanoes.push(peakEntry(peak));
}

// Forests: forest climates below the treeline, broken into blobs by noise so ~40% stays meadow.
const treeline = (lat) => 3800 - Math.max(0, Math.abs(lat) - 30) * 100;
const biomeOf = ({ lat, climate }, elevation) => {
  if (elevation > treeline(lat)) return null;
  if (climate === "B") return "pine";
  if (climate === "T") return "jungle";
  if (climate === "M") return elevation > 1800 ? "pine" : "broadleaf";
  // Semi-arid ranges carry montane conifer belts that the 0.5° climate grid calls steppe.
  if (climate === "S" && elevation > 2000) return "pine";
  return null;
};
const biomes = cells.map((cell, i) => biomeOf(cell, grid[i]));
const growth = cells.map(({ lng, lat }) => fbm(lng * 0.3, lat * 0.3));
const eligible = growth.filter((_, i) => biomes[i]).sort((a, b) => a - b);
const threshold = eligible[Math.floor(eligible.length * OPEN_SHARE)];
// Desert and prairie, widened by a quarter degree so contour interpolation stays out too.
const treeless = cells.map(({ lng, lat }) =>
  [-0.25, 0.25].some((dx) => [-0.25, 0.25].some((dy) => "DP".includes(climateAt(lng + dx, lat + dy)))),
);
const forests = Object.fromEntries(
  ["pine", "broadleaf", "jungle"].map((biome) => {
    // Smoothing must not spill a blob's edge back into desert or prairie.
    const mask = blur(
      biomes.map((b, i) => (b === biome && growth[i] > threshold ? 1 : 0)),
      cols,
      rows,
      1,
      2,
    ).map((value, i) => (treeless[i] ? 0 : value));
    return [biome, polygonsOf(mask, cols, rows, mosaic.width, MIN_FOREST_AREA).map((polygon) => polygon.map(flat))];
  }),
);

fs.writeFileSync(OUTPUT, JSON.stringify({ highlands, volcanoes, forests }));
console.log(`[generate-map-features] highlands: ${highlands.length} (${highlands.filter((h) => h.dry).length} dry), ${claimed.size} peaks; volcanoes: ${volcanoes.length}`);
Object.entries(forests).forEach(([biome, polygons]) => console.log(`[generate-map-features] ${biome}: ${polygons.length} polygons`));
console.log(`[generate-map-features] wrote ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB to ${path.relative(process.cwd(), OUTPUT)}`);
