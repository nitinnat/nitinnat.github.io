import fs from "fs";
import path from "path";

export interface PhotoMetadata {
  location?: string;
  date?: string;
  tagged: boolean;
}

export type PhotoMetadataMap = Record<string, PhotoMetadata>;

const METADATA_PATH = path.join(process.cwd(), "content/photos-metadata.json");

export function loadPhotoMetadata(): PhotoMetadataMap {
  try {
    if (!fs.existsSync(METADATA_PATH)) {
      return {};
    }
    const content = fs.readFileSync(METADATA_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load photo metadata:", error);
    return {};
  }
}

export function mergeMetadataIntoPhotos<T extends { id: string }>(
  photos: T[],
  metadata: PhotoMetadataMap
): (T & { location?: string; date?: string; tagged?: boolean })[] {
  return photos.map((photo) => ({
    ...photo,
    location: metadata[photo.id]?.location,
    date: metadata[photo.id]?.date,
    tagged: metadata[photo.id]?.tagged,
  }));
}
