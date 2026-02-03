import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const METADATA_PATH = path.join(process.cwd(), "content/photos-metadata.json");

interface SaveRequest {
  photoId: string;
  location?: string;
  date?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveRequest = await request.json();
    const { photoId, location, date } = body;

    if (!photoId) {
      return NextResponse.json(
        { error: "photoId is required" },
        { status: 400 }
      );
    }

    // Load existing metadata
    let metadata: Record<string, any> = {};
    if (fs.existsSync(METADATA_PATH)) {
      const content = fs.readFileSync(METADATA_PATH, "utf-8");
      metadata = JSON.parse(content);
    }

    // Update metadata
    const hasLocation = !!location && location.trim() !== "";
    const hasDate = !!date && date.trim() !== "";

    metadata[photoId] = {
      ...(hasLocation && { location: location.trim() }),
      ...(hasDate && { date: date.trim() }),
      tagged: hasLocation || hasDate,
    };

    // Write back to file
    fs.writeFileSync(
      METADATA_PATH,
      JSON.stringify(metadata, null, 2),
      "utf-8"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving photo metadata:", error);
    return NextResponse.json(
      { error: "Failed to save metadata" },
      { status: 500 }
    );
  }
}
