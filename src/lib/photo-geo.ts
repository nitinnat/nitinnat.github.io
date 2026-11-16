import { open } from "fs/promises";
import path from "path";
import exifr from "exifr";
import type { PhotoItem } from "@/components/photography/photo-gallery";

export interface GeoPhoto {
  id: string;
  src: string;
  thumb: string;
  alt: string;
  lat: number;
  lng: number;
  takenAt: string | null;
  location?: string;
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  start: string | null;
  end: string | null;
  photos: GeoPhoto[];
}

const PHOTO_ROOT = path.join(process.cwd(), "content/assets/photos");
// ~5 km: precise enough for a world map without revealing exact spots.
const PRECISION = 0.05;
const PLACE_RADIUS_KM = 60;

// EXIF sits at the start of the file; passing bytes avoids exifr's own (bundler-unfriendly) file loading.
async function readHeader(file: string) {
  const handle = await open(file, "r");
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(256 * 1024), 0, 256 * 1024, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

const round = (value: number) => Math.round(value / PRECISION) * PRECISION;

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

function folderName(src: string) {
  const folder = decodeURI(src).split("/").at(-2) ?? "";
  return folder.replace(/^\d+_/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

type GeoReading = Omit<GeoPhoto, "lat" | "lng"> & { lat?: number; lng?: number };

async function readGeo(photo: PhotoItem): Promise<GeoReading | null> {
  const src = photo.full ?? photo.thumb;
  if (!photo.source || !src) return null;
  const header = await readHeader(path.join(PHOTO_ROOT, photo.source)).catch(() => null);
  if (!header) return null;
  const [gps, exif] = await Promise.all([
    exifr.gps(header).catch(() => undefined),
    exifr.parse(header, ["DateTimeOriginal"]).catch(() => undefined),
  ]);
  const hasGps = typeof gps?.latitude === "number" && typeof gps?.longitude === "number";
  return {
    id: photo.id,
    src,
    thumb: photo.thumb ?? src,
    alt: photo.alt ?? "Landscape photograph",
    lat: hasGps ? round(gps.latitude) : undefined,
    lng: hasGps ? round(gps.longitude) : undefined,
    takenAt: exif?.DateTimeOriginal instanceof Date ? exif.DateTimeOriginal.toISOString() : null,
    location: photo.location,
  };
}

// Photos without GPS take the mean position of geotagged photos sharing their location tag.
function placeByLocation(readings: GeoReading[]): GeoPhoto[] {
  const tagged = new Map<string, GeoPhoto[]>();
  const located = readings.filter((r): r is GeoPhoto => r.lat !== undefined && r.lng !== undefined);
  located.forEach((photo) => {
    if (photo.location) tagged.set(photo.location, [...(tagged.get(photo.location) ?? []), photo]);
  });
  const inferred = readings.flatMap((reading) => {
    const peers = reading.lat === undefined && reading.location ? tagged.get(reading.location) : undefined;
    if (!peers) return [];
    const mean = (key: "lat" | "lng") => round(peers.reduce((sum, p) => sum + p[key], 0) / peers.length);
    return [{ ...reading, lat: mean("lat"), lng: mean("lng") }];
  });
  return [...located, ...inferred];
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

// Groups geotagged photos into places (within PLACE_RADIUS_KM), ordered by when they were taken.
export async function buildPlaces(photos: PhotoItem[]): Promise<Place[]> {
  const readings = (await Promise.all(photos.map(readGeo))).filter((photo) => photo !== null);
  const geo = placeByLocation(readings).sort((a, b) => (a.takenAt ?? "").localeCompare(b.takenAt ?? ""));

  const places: Place[] = [];
  for (const photo of geo) {
    const place = places.find((candidate) => distanceKm(candidate, photo) <= PLACE_RADIUS_KM);
    if (place) {
      place.photos.push(photo);
      place.lat = round(place.photos.reduce((sum, p) => sum + p.lat, 0) / place.photos.length);
      place.lng = round(place.photos.reduce((sum, p) => sum + p.lng, 0) / place.photos.length);
    } else {
      places.push({ id: `place-${places.length + 1}`, name: "", lat: photo.lat, lng: photo.lng, start: null, end: null, photos: [photo] });
    }
  }

  return places
    .map((place) => {
      const dates = place.photos.map((p) => p.takenAt).filter((d) => d !== null).sort();
      const label = mostCommon(place.photos.map((p) => p.location).filter((l) => l !== undefined));
      return {
        ...place,
        name: label?.split(",")[0].trim() ?? folderName(place.photos[0].src),
        start: dates[0] ?? null,
        end: dates.at(-1) ?? null,
      };
    })
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
}
