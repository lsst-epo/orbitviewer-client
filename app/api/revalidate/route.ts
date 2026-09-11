import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import revalidate from "@/lib/revalidation";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const uri = request.nextUrl.searchParams.get("uri");
  const secret = request.nextUrl.searchParams.get("secret");

  if (!uri) {
    return NextResponse.json({
      revalidated: false,
      now: Date.now(),
      message: "Missing path to revalidate",
    });
  }

  // Fails closed: with no configured token nothing can trigger a revalidation,
  // rather than an empty secret matching an empty query param.
  if (
    !env.CRAFT_REVALIDATE_SECRET_TOKEN ||
    secret !== env.CRAFT_REVALIDATE_SECRET_TOKEN
  ) {
    return NextResponse.json({
      revalidated: false,
      now: Date.now(),
      message: "Invalid token",
    });
  }

  const { paths, tags } = revalidate(uri);

  return NextResponse.json({ revalidated: true, now: Date.now(), paths, tags });
}
