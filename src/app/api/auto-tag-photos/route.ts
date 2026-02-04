import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const autoTagScriptPath = path.join(process.cwd(), "scripts/auto-tag-photos.js");
    const copyAssetsScriptPath = path.join(process.cwd(), "scripts/copy-assets.js");

    // Run auto-tag script
    const autoTagOutput = execSync(`node "${autoTagScriptPath}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });

    // Copy assets to public folder for dev mode
    const copyAssetsOutput = execSync(`node "${copyAssetsScriptPath}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      output: autoTagOutput + "\n" + copyAssetsOutput,
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
