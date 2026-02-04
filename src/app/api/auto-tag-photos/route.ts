import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), "scripts/auto-tag-photos.js");

    const output = execSync(`node "${scriptPath}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      output,
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
