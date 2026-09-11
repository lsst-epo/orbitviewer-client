import { NextRequest, NextResponse } from "next/server";
import { searchOrbits } from "@/lib/api/hasura";
export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (term.length < 2 || term.length > 100)
    return NextResponse.json(
      { error: "Search must contain 2–100 characters" },
      { status: 400 },
    );
  try {
    return NextResponse.json({ results: await searchOrbits(term) });
  } catch (error) {
    console.error("Orbit search failed", error);
    return NextResponse.json(
      { error: "Search is temporarily unavailable" },
      { status: 502 },
    );
  }
}
