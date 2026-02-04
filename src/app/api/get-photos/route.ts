import { NextResponse } from "next/server";
import { getGalleryFromAssets } from "@/app/photography/page";
import { loadPhotoMetadata, mergeMetadataIntoPhotos } from "@/lib/photo-metadata";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const photos = getGalleryFromAssets();
    const metadata = loadPhotoMetadata();
    const photosWithMetadata = mergeMetadataIntoPhotos(photos, metadata);

    return NextResponse.json({
      success: true,
      photos: photosWithMetadata,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
