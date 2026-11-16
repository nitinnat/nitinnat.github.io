// One-off: derives smoothed elevation-band polygons for the photo map from AWS Terrain Tiles
// (Terrarium encoding, https://registry.opendata.aws/terrain-tiles/) downloaded at zoom 4 as
// `4-{x}-{y}.png` into the directory given as the first argument. Writes src/data/terrain-bands.json
// as { levels, bands: [{ level, polygons: [[outerRing, ...holes]] }] } in [lng, lat] degrees, where
// each band covers everything at or above its level.
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const { contours } = require("d3-contour");

const ZOOM = 4;
const TILES = 2 ** ZOOM;
const TILE_SIZE = 256;
const ROWS = [1, 12]; // ~80°N to ~60°S
const CELL = 4; // mosaic pixels per grid cell (~0.35° of longitude)
const BLUR_RADIUS = 2;
const BLUR_PASSES = 1;
const LEVELS = [600, 1400, 2400, 3600];
const SOUTH_LIMIT = -56;
const MIN_EXTENT = 0.5;
const TOLERANCE = 0.15;
const OUTPUT = path.join(__dirname, "../src/data/terrain-bands.json");

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
          const gx = x * TILE_SIZE + px;
          const gy = (y - ROWS[0]) * TILE_SIZE + py;
          // Ocean counts as sea level; 9000+ only appears in corrupt source pixels.
          elevation[gy * width + gx] = meters >= 9000 ? 0 : Math.max(0, meters);
        }
      }
    }
  }
  return { elevation, width, height };
}

function toLngLat(gx, gy, width) {
  const lng = (gx / width) * 360 - 180;
  const mercatorY = (ROWS[0] * TILE_SIZE + gy) / (TILES * TILE_SIZE);
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * mercatorY))) * 180) / Math.PI;
  return [lng, lat];
}

function downsample({ elevation, width, height }) {
  const cols = width / CELL;
  const rows = height / CELL;
  const grid = new Float32Array(cols * rows);
  for (let cy = 0; cy < rows; cy += 1) {
    // Masking whole rows south of the limit keeps Antarctica out of every band.
    if (toLngLat(0, (cy + 0.5) * CELL, width)[1] < SOUTH_LIMIT) continue;
    for (let cx = 0; cx < cols; cx += 1) {
      let sum = 0;
      for (let dy = 0; dy < CELL; dy += 1) {
        for (let dx = 0; dx < CELL; dx += 1) sum += elevation[(cy * CELL + dy) * width + cx * CELL + dx];
      }
      grid[cy * cols + cx] = sum / (CELL * CELL);
    }
  }
  return { grid, cols, rows };
}

// Separable box blur, repeated to approximate a Gaussian; wraps horizontally across the antimeridian.
function blur(grid, cols, rows) {
  let src = grid;
  for (let pass = 0; pass < BLUR_PASSES; pass += 1) {
    const horizontal = new Float32Array(src.length);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let sum = 0;
        for (let k = -BLUR_RADIUS; k <= BLUR_RADIUS; k += 1) sum += src[y * cols + ((x + k + cols) % cols)];
        horizontal[y * cols + x] = sum / (2 * BLUR_RADIUS + 1);
      }
    }
    const vertical = new Float32Array(src.length);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let sum = 0;
        let count = 0;
        for (let k = -BLUR_RADIUS; k <= BLUR_RADIUS; k += 1) {
          if (y + k < 0 || y + k >= rows) continue;
          sum += horizontal[(y + k) * cols + x];
          count += 1;
        }
        vertical[y * cols + x] = sum / count;
      }
    }
    src = vertical;
  }
  return src;
}

function simplify(points, tolerance) {
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
    if (maxDistance > tolerance) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function toRing(gridRing, width) {
  const ring = simplify(
    gridRing.map(([x, y]) => toLngLat(x * CELL, y * CELL, width)),
    TOLERANCE,
  ).map(([lng, lat]) => [Number(lng.toFixed(2)), Number(lat.toFixed(2))]);
  if (ring.length < 4) return null;
  const lngs = ring.map((point) => point[0]);
  const lats = ring.map((point) => point[1]);
  const extent = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats));
  return extent < MIN_EXTENT ? null : ring;
}

const tileDir = process.argv[2];
if (!tileDir) {
  console.error("[generate-terrain-bands] usage: node scripts/generate-terrain-bands.js <tile-directory>");
  process.exit(1);
}
const mosaic = buildMosaic(tileDir);
const { grid, cols, rows } = downsample(mosaic);
const smoothed = blur(grid, cols, rows);
const bands = contours()
  .size([cols, rows])
  .thresholds(LEVELS)(smoothed)
  .map(({ value, coordinates }) => ({
    level: value,
    polygons: coordinates
      .map(([outer, ...holes]) => {
        const ring = toRing(outer, mosaic.width);
        return ring && [ring, ...holes.map((hole) => toRing(hole, mosaic.width)).filter(Boolean)];
      })
      .filter(Boolean),
  }));

fs.writeFileSync(OUTPUT, JSON.stringify({ levels: LEVELS, bands }));
bands.forEach(({ level, polygons }) => console.log(`[generate-terrain-bands] ${level}m: ${polygons.length} polygons`));
console.log(
  `[generate-terrain-bands] wrote ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB to ${path.relative(process.cwd(), OUTPUT)}`,
);
