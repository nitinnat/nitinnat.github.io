// One-off: derives mountain peak positions for the photo map from AWS Terrain Tiles
// (Terrarium encoding, https://registry.opendata.aws/terrain-tiles/) downloaded at zoom 4 as
// `4-{x}-{y}.png` into the directory given as the first argument. Writes src/data/terrain-peaks.json
// as [lng, lat, elevationMeters] tuples, highest first.
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const ZOOM = 4;
const TILES = 2 ** ZOOM;
const TILE_SIZE = 256;
const ROWS = [1, 12]; // ~80°N to ~60°S
const CELL = 3; // pixels per sampling cell (~30 km at the equator)
const MIN_ELEVATION = 900;
const MIN_RELIEF = 350;
const OUTPUT = path.join(__dirname, "../src/data/terrain-peaks.json");

function buildMosaic(tileDir) {
  const width = TILES * TILE_SIZE;
  const height = (ROWS[1] - ROWS[0] + 1) * TILE_SIZE;
  const elevation = new Int16Array(width * height);

  for (let y = ROWS[0]; y <= ROWS[1]; y += 1) {
    for (let x = 0; x < TILES; x += 1) {
      const png = PNG.sync.read(fs.readFileSync(path.join(tileDir, `${ZOOM}-${x}-${y}.png`)));
      for (let py = 0; py < TILE_SIZE; py += 1) {
        for (let px = 0; px < TILE_SIZE; px += 1) {
          const o = (py * TILE_SIZE + px) * 4;
          const meters = png.data[o] * 256 + png.data[o + 1] + png.data[o + 2] / 256 - 32768;
          const gx = x * TILE_SIZE + px;
          const gy = (y - ROWS[0]) * TILE_SIZE + py;
          elevation[gy * width + gx] = Math.max(-1, Math.min(9000, Math.round(meters)));
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
  return [Number(lng.toFixed(2)), Number(lat.toFixed(2))];
}

// A peak is the highest cell among its 8 neighbours that rises well above its 5x5 surroundings.
function findPeaks({ elevation, width, height }) {
  const cols = Math.floor(width / CELL);
  const rows = Math.floor(height / CELL);
  const max = new Int16Array(cols * rows);
  const at = new Int32Array(cols * rows);

  for (let cy = 0; cy < rows; cy += 1) {
    for (let cx = 0; cx < cols; cx += 1) {
      let best = -32768;
      let bestIndex = 0;
      for (let dy = 0; dy < CELL; dy += 1) {
        for (let dx = 0; dx < CELL; dx += 1) {
          const index = (cy * CELL + dy) * width + cx * CELL + dx;
          if (elevation[index] > best) {
            best = elevation[index];
            bestIndex = index;
          }
        }
      }
      max[cy * cols + cx] = best;
      at[cy * cols + cx] = bestIndex;
    }
  }

  const peaks = [];
  for (let cy = 2; cy < rows - 2; cy += 1) {
    for (let cx = 0; cx < cols; cx += 1) {
      const value = max[cy * cols + cx];
      // 9000 is the clamp ceiling, which only corrupt source pixels reach.
      if (value < MIN_ELEVATION || value >= 9000) continue;
      let isPeak = true;
      let low = value;
      for (let dy = -2; dy <= 2 && isPeak; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const neighbour = max[(cy + dy) * cols + ((cx + dx + cols) % cols)];
          if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx || dy) && neighbour > value) {
            isPeak = false;
            break;
          }
          low = Math.min(low, neighbour);
        }
      }
      if (!isPeak || value - low < MIN_RELIEF) continue;
      const index = at[cy * cols + cx];
      peaks.push([...toLngLat(index % width, Math.floor(index / width), width), value]);
    }
  }
  return peaks.sort((a, b) => b[2] - a[2]);
}

const tileDir = process.argv[2];
if (!tileDir) {
  console.error("[generate-terrain] usage: node scripts/generate-terrain.js <tile-directory>");
  process.exit(1);
}
const peaks = findPeaks(buildMosaic(tileDir));
fs.writeFileSync(OUTPUT, JSON.stringify(peaks));
console.log(`[generate-terrain] wrote ${peaks.length} peaks to ${path.relative(process.cwd(), OUTPUT)}`);
