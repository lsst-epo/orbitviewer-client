import { NextRequest, NextResponse } from "next/server";
import { searchSolarElements, type ObjectTypeCode } from "@/lib/api/hasura";
import { CategoryTypeMap, fromHasuraElements } from "@/lib/solar/elements";
import type { SolarCategory } from "@/lib/solar/types";

/** Hard ceiling regardless of what the caller asks for. */
const MAX_LIMIT = 100;
const MIN_QUERY_LENGTH = 2;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({
      results: [],
      message: `Query must be at least ${MIN_QUERY_LENGTH} characters`,
    });
  }

  const discovery = searchParams.get("discovery");
  const rubinDiscovery =
    discovery === "rubin" ? true : discovery === "other" ? false : undefined;

  const types = (searchParams.get("types") ?? "")
    .split(",")
    .map((slug) => CategoryTypeMap[slug.trim() as SolarCategory])
    .filter((code): code is ObjectTypeCode => Boolean(code));

  const limit = Math.min(
    Number(searchParams.get("limit")) || MAX_LIMIT,
    MAX_LIMIT
  );

  try {
    const rows = await searchSolarElements(query, {
      types,
      rubinDiscovery,
      limit,
    });

    return NextResponse.json({
      results: rows.map((row) => fromHasuraElements(row)),
    });
  } catch (cause) {
    console.error("Object search failed", cause);
    return NextResponse.json(
      { results: [], message: "Search is unavailable" },
      { status: 502 }
    );
  }
}
