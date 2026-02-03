import { notFound } from "next/navigation";
import { PhotoTaggerClient } from "@/components/admin/photo-tagger-client";
import { getGalleryFromAssets } from "@/app/photography/page";
import { loadPhotoMetadata, mergeMetadataIntoPhotos } from "@/lib/photo-metadata";

export default function PhotoTaggerPage() {
  // Check if photo tagger is enabled
  // Set ENABLE_PHOTO_TAGGER=true in .env.local to enable locally
  // This should be false or unset in production
  if (process.env.ENABLE_PHOTO_TAGGER !== "true") {
    notFound();
  }

  const photos = getGalleryFromAssets();
  const metadata = loadPhotoMetadata();
  const photosWithMetadata = mergeMetadataIntoPhotos(photos, metadata);

  return (
    <div className="min-h-screen bg-background">
      <PhotoTaggerClient photos={photosWithMetadata} />
    </div>
  );
}
