import { NextRequest, NextResponse } from "next/server";
import { getCatalogFiles } from "@/lib/api/craft";
export async function GET(request: NextRequest) {
  const quality = request.nextUrl.searchParams.get("quality") ?? "low";
  if (!["low", "medium", "high", "ultra"].includes(quality))
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  try {
    const files = await getCatalogFiles();
    const file = files.find(
      (entry) => entry.dataFileQuality.toLowerCase() === quality,
    );
    if (!file)
      return NextResponse.json(
        { error: "Catalog is unavailable" },
        { status: 404 },
      );
    const response = await fetch(file.dataFileUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Catalog failed (${response.status})`);
    return new Response(response.body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Catalog load failed", error);
    return NextResponse.json(
      { error: "Catalog is unavailable" },
      { status: 502 },
    );
  }
}
