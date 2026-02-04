import type { PhotoItem } from "@/components/photography/photo-gallery";

export interface PhotoCluster {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  photos: PhotoItem[];
  photoCount: number;
  heroPhoto: PhotoItem;
}

interface ParsedDate {
  month: number;
  year: number;
  raw: string;
}

interface ParsedLocation {
  primary: string;
  full: string;
}

function parseDate(dateStr?: string): ParsedDate | null {
  if (!dateStr) return null;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Handle both "Month, Year" and "Month Year" formats
  const match = dateStr.match(/^(\w+)[,\s]\s*(\d{4})$/);
  if (!match) return null;

  const [, monthName, yearStr] = match;
  const month = monthNames.indexOf(monthName) + 1;
  const year = parseInt(yearStr, 10);

  if (month < 1 || month > 12 || year < 1900 || year > 2100) return null;

  return { month, year, raw: dateStr };
}

function parseLocation(locationStr?: string): ParsedLocation | null {
  if (!locationStr) return null;

  const parts = locationStr.split(",").map((p) => p.trim());
  const primary = parts[parts.length - 1]; // e.g., "Colorado" from "Breckenridge/Keystone Area, Colorado"

  return { primary, full: locationStr };
}

function monthsBetween(date1: ParsedDate, date2: ParsedDate): number {
  return Math.abs((date2.year - date1.year) * 12 + (date2.month - date1.month));
}

function shouldGroupPhotos(
  photo1: PhotoItem,
  photo2: PhotoItem,
  locationThreshold: number = 0,
  timeThreshold: number = 3
): boolean {
  const loc1 = parseLocation(photo1.location);
  const loc2 = parseLocation(photo2.location);

  if (!loc1 || !loc2) return false;

  // Same primary location (e.g., both in Colorado)
  if (loc1.primary !== loc2.primary) return false;

  const date1 = parseDate(photo1.date);
  const date2 = parseDate(photo2.date);

  if (!date1 || !date2) return false;

  // Within time threshold (months)
  const monthDiff = monthsBetween(date1, date2);
  if (monthDiff > timeThreshold) return false;

  return true;
}

function getClusterIdentifier(
  location: ParsedLocation,
  date: ParsedDate
): string {
  return `${location.primary}-${date.year}-${date.month}`;
}

export function clusterPhotos(photos: PhotoItem[]): PhotoCluster[] {
  if (photos.length === 0) return [];

  // Filter to only tagged photos with complete metadata
  const taggedPhotos = photos.filter(
    (p) => p.location && p.date && p.tagged
  );

  if (taggedPhotos.length === 0) return [];

  // Group photos into clusters
  const clusterMap = new Map<string, PhotoItem[]>();

  for (const photo of taggedPhotos) {
    const location = parseLocation(photo.location);
    const date = parseDate(photo.date);

    if (!location) continue;

    // Create cluster ID based only on location (ignore time)
    const clusterId = location.primary;

    if (!clusterMap.has(clusterId)) {
      clusterMap.set(clusterId, []);
    }

    clusterMap.get(clusterId)!.push(photo);
  }

  // Convert to PhotoCluster objects (no merging needed since we cluster by location only)
  const clusters = Array.from(clusterMap.entries())
    .map(([clusterId, clusterPhotos]) => {
      const firstPhoto = clusterPhotos[0];
      const firstLocation = parseLocation(firstPhoto.location)!;
      const firstDate = parseDate(firstPhoto.date)!;
      const lastDate = parseDate(
        clusterPhotos[clusterPhotos.length - 1].date
      )!;

      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      const startMonth = monthNames[firstDate.month - 1];
      const endMonth = monthNames[lastDate.month - 1];

      // Sort photos by date within the cluster
      clusterPhotos.sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateA.year - dateB.year || dateA.month - dateB.month;
      });

      const startDateStr =
        firstDate.month === lastDate.month && firstDate.year === lastDate.year
          ? `${startMonth} ${firstDate.year}`
          : `${startMonth} ${firstDate.year} - ${endMonth} ${lastDate.year}`;

      return {
        id: clusterId,
        name: firstLocation.primary,
        location: firstLocation.full,
        startDate: `${startMonth} ${firstDate.year}`,
        endDate: `${endMonth} ${lastDate.year}`,
        photos: clusterPhotos,
        photoCount: clusterPhotos.length,
        heroPhoto: clusterPhotos[0], // First photo is the hero
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by location

  return clusters;
}

function mergeAdjacentClusters(
  entries: Array<[string, PhotoItem[]]>
): Array<[string, PhotoItem[]]> {
  // Merge clusters that are adjacent in time (within 2 months)
  // This creates multi-month "trips" for extended visits
  const merged: Array<[string, PhotoItem[]]> = [];
  const processed = new Set<string>();

  for (const [id, photos] of entries) {
    if (processed.has(id)) continue;

    let currentPhotos = [...photos];
    processed.add(id);

    // Look for adjacent clusters
    for (const [otherId, otherPhotos] of entries) {
      if (processed.has(otherId) || otherId === id) continue;

      // Check if clusters should be merged (same primary location, adjacent months)
      const firstLocation = parseLocation(photos[0].location);
      const otherLocation = parseLocation(otherPhotos[0].location);

      if (!firstLocation || !otherLocation) continue;
      if (firstLocation.primary !== otherLocation.primary) continue;

      const firstDate = parseDate(photos[photos.length - 1].date)!;
      const otherDate = parseDate(otherPhotos[0].date)!;

      const monthDiff = monthsBetween(firstDate, otherDate);

      if (monthDiff <= 2) {
        // Merge clusters
        currentPhotos.push(...otherPhotos);
        processed.add(otherId);
      }
    }

    // Sort merged photos by date
    currentPhotos.sort((a, b) => {
      const dateA = parseDate(a.date)!;
      const dateB = parseDate(b.date)!;
      return (
        dateA.year - dateB.year || dateA.month - dateB.month
      );
    });

    merged.push([id, currentPhotos]);
  }

  return merged;
}
