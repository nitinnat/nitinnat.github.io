import type { PhotoCluster } from "./photo-clustering";

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface PositionedCluster extends PhotoCluster {
  position: Position3D;
  scale: number;
  depth: number; // 0-1 scale for visual depth
}

interface ParsedDate {
  month: number;
  year: number;
}

function parseDate(dateStr: string): ParsedDate {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Handle both "Month Year" and "Month Year - Month Year" formats
  // Extract the last "Month Year" part for end date positioning
  const parts = dateStr.split(" - ");
  const lastPart = parts[parts.length - 1].trim();

  const match = lastPart.match(/^(\w+)\s+(\d{4})$/);
  if (!match) return { month: 1, year: 2000 };

  const [, monthName, yearStr] = match;
  const month = monthNames.indexOf(monthName) + 1;
  const year = parseInt(yearStr, 10);

  return { month: Math.max(1, month), year };
}

function extractLocationKey(location: string): string {
  // Extract primary location for X-axis positioning
  // e.g., "Breckenridge/Keystone Area, Colorado" -> "Colorado"
  const parts = location.split(",").map((p) => p.trim());
  return parts[parts.length - 1];
}

function locationToX(
  location: string,
  locationMap: Map<string, number>
): number {
  const key = extractLocationKey(location);
  return locationMap.get(key) || 0;
}

function dateToZ(dateStr: string, dateRange: { min: number; max: number }): number {
  const date = parseDate(dateStr);
  const dateNum = date.year * 12 + date.month;
  const { min, max } = dateRange;

  if (max === min) return 0;

  // Normalize to 0-1 range, older dates are further back (higher Z)
  return 1 - (dateNum - min) / (max - min);
}

function randomY(seed: number): number {
  // Deterministic pseudo-random based on seed for consistent positioning
  const x = Math.sin(seed) * 10000;
  return (x - Math.floor(x)) * 0.3 - 0.15; // Range: -0.15 to 0.15
}

export function positionClusters(clusters: PhotoCluster[]): PositionedCluster[] {
  if (clusters.length === 0) return [];

  // Build location map for X-axis positioning
  const locations = new Set(clusters.map((c) => extractLocationKey(c.location)));
  const locationArray = Array.from(locations).sort();
  const locationMap = new Map<string, number>();

  locationArray.forEach((loc, index) => {
    // Spread locations across X-axis: -1 to 1
    const x = locationArray.length === 1 ? 0 : (index / (locationArray.length - 1)) * 2 - 1;
    locationMap.set(loc, x);
  });

  // Build date range for Z-axis positioning
  let minDate = Infinity;
  let maxDate = -Infinity;

  for (const cluster of clusters) {
    const startDate = parseDate(cluster.startDate);
    const endDate = parseDate(cluster.endDate);

    const startNum = startDate.year * 12 + startDate.month;
    const endNum = endDate.year * 12 + endDate.month;

    minDate = Math.min(minDate, startNum);
    maxDate = Math.max(maxDate, endNum);
  }

  // Position clusters in 3D space
  const positioned = clusters.map((cluster, index) => {
    const x = locationToX(cluster.location, locationMap);
    const y = randomY(index);
    const z = dateToZ(cluster.endDate, { min: minDate, max: maxDate }) * 8 - 4; // Range: -4 to 4

    // Scale based on number of photos
    // Larger clusters appear slightly bigger
    const scale = 0.8 + (Math.min(cluster.photoCount, 20) / 20) * 0.4; // 0.8 to 1.2

    // Depth for layering (0-1, where 0 is closest to camera)
    const depth = (z + 4) / 8; // Normalize to 0-1

    return {
      ...cluster,
      position: { x, y, z },
      scale,
      depth,
    };
  });

  return positioned;
}

export function getCameraTarget(
  clusters: PositionedCluster[]
): { x: number; y: number; z: number } {
  if (clusters.length === 0) return { x: 0, y: 0, z: 0 };

  // Calculate centroid of all cluster positions
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (const cluster of clusters) {
    sumX += cluster.position.x;
    sumY += cluster.position.y;
    sumZ += cluster.position.z;
  }

  return {
    x: sumX / clusters.length,
    y: sumY / clusters.length,
    z: sumZ / clusters.length,
  };
}

export function getCameraPosition(
  target: { x: number; y: number; z: number },
  distance: number = 8
): { x: number; y: number; z: number } {
  // Position camera looking at target from a distance
  // Offset slightly upward and back
  return {
    x: target.x,
    y: target.y + 2,
    z: target.z - distance,
  };
}
