import { NextRequest, NextResponse } from "next/server";
import { redirect, RedirectType } from "next/navigation";
import { env } from "@/env";
import { fallbackLng } from "@/lib/i18n/settings";
import { getPathname } from "@/lib/i18n/navigation";
import previewSession from "@/lib/sessions/preview";

const CRAFT_HOMEPAGE_URI = "__home__";

export async function GET(request: NextRequest): Promise<NextResponse | void> {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");
  const previewToken = searchParams.get("token") || undefined;
  const locale = (searchParams.get("site") || fallbackLng).toLowerCase();
  const uri = searchParams.get("uri");

  // Fails closed when no token is configured.
  if (!env.CRAFT_SECRET_TOKEN || secret !== env.CRAFT_SECRET_TOKEN) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  if (!uri) {
    return new NextResponse("URI missing", { status: 422 });
  }

  await previewSession().start({ previewToken });

  const segments: Array<string> = [""];

  if (uri !== CRAFT_HOMEPAGE_URI) {
    segments.push(uri);
  }

  // Redirect to the path derived from the entry, never to a caller-supplied
  // URL -- that would be an open redirect.
  const redirectPath = getPathname({
    href: { pathname: segments.join("/") || "/" },
    locale,
  });

  redirect(redirectPath, RedirectType.replace);
}
